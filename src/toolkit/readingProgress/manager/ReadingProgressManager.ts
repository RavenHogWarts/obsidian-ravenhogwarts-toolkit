import * as React from 'react';
import { BaseManager } from "@/src/core/services/BaseManager";
import { debounce, HeadingCache, MarkdownView } from "obsidian";
import { createRoot, Root } from 'react-dom/client';
import { IToolkitModule } from "@/src/core/interfaces/types";
import { ReadingProgress } from '@/src/toolkit/readingProgress/components/ReadingProgress/ReadingProgress';
import { IReadingProgressConfig, IReadingProgressData } from "@/src/toolkit/readingProgress/types/config";
import { EstimatedReadingTime } from "@/src/toolkit/readingProgress/services/estimatedReadingTime";

interface IReadingProgressModule extends IToolkitModule {
  config: IReadingProgressConfig;
  data: IReadingProgressData;
}

export class ReadingProgressManager extends BaseManager<IReadingProgressModule> {
    private root: Root | null = null;
    private container: HTMLElement | null = null;
    private currentView: MarkdownView | null = null;
    private scrollElement: Element | null = null;
    private resizeObserver: ResizeObserver;
    private progress = 0;
    private headings: HeadingCache[] = [];
    private currentHeadingIndex = -1;
    private readingTime = 0;

    protected async onModuleLoad(): Promise<void> {
        // 确保只初始化一次
        this.cleanupCurrentView(); // 先清理可能存在的旧实例
        this.initResizeObserver();
        this.initContainer();
        this.registerEventHandlers();
        await this.updateReadingTime();
        this.logger.info('Reading progress manager loaded');
    }

    protected async onEnable(): Promise<void> {
        // 确保先调用父类方法
        super.onEnable();

        // 初始化
        this.initResizeObserver();
        this.registerEventHandlers();
        await this.updateReadingTime();

        // 立即更新显示
        this.updateContainerPosition();
    }

    private initContainer(): void {
        this.container = document.createElement('div');
        this.root = createRoot(this.container);
        this.renderComponent();
        this.updateContainerPosition();
    }

    private async updateReadingTime(): Promise<void> {
        if (!this.currentView?.file) return;
        const content = await this.app.vault.read(this.currentView.file);

        this.readingTime = EstimatedReadingTime.calculate(content);
        this.renderComponent();
    }

    private renderComponent(): void {
        if (!this.root) return;
        
        this.root.render(
            React.createElement(ReadingProgress, {
                config: this.config,
                readingTime: this.readingTime,
                headings: this.headings,
                progress: this.progress,
                onHeadingClick: (heading) => this.scrollToHeading(heading),
                activeHeadingIndex: this.currentHeadingIndex,
                isEditing: this.currentView?.getMode() === 'source',
                onReturnClick: this.handleReturnClick
            })
        );
    }

    protected onConfigChange(): void {
        // 配置变更时重新渲染组件
        this.renderComponent();
        // 更新容器位置
        this.updateContainerPosition();
    }

    private handleReturnClick = (): void => {
        if (!this.currentView || !this.scrollElement) return;
    
        const mode = this.currentView.getMode();
        
        if (mode === 'source') {
            const editor = this.currentView.editor;
            if (editor) {
                const currentPos = editor.getCursor();
                editor.scrollIntoView({ from: currentPos, to: currentPos }, true);
                editor.focus();
            }
        } else {
            // 阅读模式：先尝试平滑滚动，如果超时则强制滚动
            const startTime = Date.now();
            const startPosition = this.scrollElement.scrollTop;
            
            const smoothScroll = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / 500, 1); // 500ms 的动画时间
                
                if (progress < 1) {
                    // 使用 easeOutCubic 缓动函数
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this.scrollElement!.scrollTop = startPosition * (1 - easeProgress);
                    requestAnimationFrame(smoothScroll);
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this.scrollElement!.scrollTop = 0;
                }
            };

            // 开始自定义平滑滚动
            requestAnimationFrame(smoothScroll);
        }
    };

    private updateProgress(): void {
        if (!this.scrollElement) return;
        
        const scrollTop = this.scrollElement.scrollTop;
        const scrollHeight = this.scrollElement.scrollHeight;
        const clientHeight = this.scrollElement.clientHeight;
        const maxScroll = scrollHeight - clientHeight;
        
        this.progress = maxScroll > 0 ? 
            Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 
            0;
        
        // 更新当前活动的标题
        this.updateActiveHeading(scrollTop);

        this.renderComponent();
    }

    private updateActiveHeading(scrollTop: number): void {
        if (!this.headings.length || !this.currentView) return;

        const mode = this.currentView.getMode();
        
        if (mode === 'source') {
            // 编辑模式下使用光标位置
            const editor = this.currentView.editor;
            if (editor) {
                const currentLine = editor.getCursor().line;
                
                // 找到当前光标所在位置之前的最近标题
                let activeIndex = -1;
                for (let i = this.headings.length - 1; i >= 0; i--) {
                    if (this.headings[i].position.start.line <= currentLine) {
                        activeIndex = i;
                        break;
                    }
                }
                
                if (this.currentHeadingIndex !== activeIndex) {
                    this.currentHeadingIndex = activeIndex;
                    this.renderComponent();
                }
            }
        } else {
            // 阅读模式下使用 Intersection Observer
            const observer = new IntersectionObserver(
                (entries) => {
                    const visibleHeading = entries.find(entry => entry.isIntersecting);
                    if (visibleHeading) {
                        const headingEl = visibleHeading.target;
                        const headingText = headingEl.getAttribute('data-heading');
                        const index = this.headings.findIndex(h => h.heading === headingText);
                        
                        if (this.currentHeadingIndex !== index) {
                            this.currentHeadingIndex = index;
                            this.renderComponent();
                        }
                    }
                },
                {
                    root: this.scrollElement,
                    threshold: 0.1
                }
            );

            // 观察所有标题元素
            this.headings.forEach(heading => {
                const el = this.findHeadingElement(heading);
                if (el) observer.observe(el);
            });
        }
    }

    private updateTOC(): void {
        if (!this.currentView?.file) return;

        const cache = this.app.metadataCache.getFileCache(this.currentView.file);
        this.headings = cache?.headings || [];
        this.renderComponent();
    }

    private initResizeObserver(): void {
        this.resizeObserver = new ResizeObserver(() => {
            if (this.currentView) {
                this.updateProgress();
            }
        });
    }

    private registerEventHandlers(): void {
        // 监听活动视图变化
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', async () => {
                await this.updateReadingTime();
                this.updateContainerPosition();
            })
        );

        // 监听文件内容变化
        this.registerEvent(
            this.app.vault.on('modify', async (file) => {
                if (this.currentView?.file === file) {
                    await this.updateReadingTime();
                }
            })
        );

        // 监听布局变化
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.updateContainerPosition();
            })
        );

        // 监听编辑器变化
        this.registerEvent(
            this.app.workspace.on('editor-change', (editor) => {
                if (this.currentView?.editor === editor) {
                    this.updateActiveHeading(this.scrollElement?.scrollTop || 0);
                    this.updateTOC();
                }
            })
        );

        // 监听文件元数据变化
        this.registerEvent(
            this.app.metadataCache.on('changed', (file) => {
                if (this.currentView?.file === file) {
                    this.updateTOC();
                }
            })
        );
    }

    private unregisterEventHandlers(): void {
        this.app.workspace.off('active-leaf-change', this.registerEventHandlers);
        this.app.workspace.off('layout-change', this.registerEventHandlers);
        this.app.workspace.off('editor-change', this.registerEventHandlers);
        this.app.metadataCache.off('changed', this.registerEventHandlers);
    }

    private setupEditorEvents(view: MarkdownView): void {
        const editor = view.editor;
        if (!editor) return;

        // 每 100ms 检查一次光标位置
        const interval = window.setInterval(() => {
            if (this.currentView?.getMode() === 'source') {
                this.updateActiveHeading(this.scrollElement?.scrollTop || 0);
            }
        }, 100);

        // 确保在清理时移除interval
        this.register(() => window.clearInterval(interval));
    }

    private updateContainerPosition(): void {
        if (!this.isEnabled()) {
            this.cleanupCurrentView();
            return;
        }

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);

        // 先移除所有已存在的容器
        this.cleanupCurrentView();
        
        if (view) {
            this.currentView = view;
            const contentContainer = this.getContentContainer();
            this.scrollElement = this.getScrollElement();
            
            if (contentContainer) {
                // 重新创建 React root 和容器
                this.container = document.createElement('div');
                this.container.classList.add('rht-reading-progress');
                this.root = createRoot(this.container);
                contentContainer.appendChild(this.container);
                
                // 设置滚动监听
                if (this.scrollElement) {
                    this.scrollElement.removeEventListener('scroll', this.handleScroll);
                    this.scrollElement.addEventListener('scroll', this.handleScroll);
                }

                // 设置编辑器事件监听
                this.setupEditorEvents(view);
                
                // 更新观察器
                if (this.resizeObserver) {
                    this.resizeObserver.disconnect();
                    this.resizeObserver.observe(contentContainer);
                }
                
                // 更新内容和渲染组件
                this.updateTOC();
                this.updateProgress();
            }
        } else {
            this.cleanupCurrentView();
        }
    }

    private getContentContainer(): Element | null {
        if (!this.currentView) return null;
        return this.currentView.containerEl.querySelector('.view-content');
    }

    private getScrollElement(): Element | null {
        if (!this.currentView) return null;
        
        const mode = this.currentView.getMode();
        return mode === 'source'
            ? this.currentView.containerEl.querySelector('.cm-scroller')
            : this.currentView.containerEl.querySelector('.markdown-preview-view');
    }

    private handleScroll = debounce((): void => {
        this.updateProgress();
    }, 50); // 50ms 的节流时间

    private scrollToHeading(heading: HeadingCache): void {
        if (!this.currentView?.file) return;

        const mode = this.currentView.getMode();
        const lineNumber = heading.position.start.line;
        
        this.currentView.leaf.openFile(this.currentView.file, {
            eState: { 
                line: lineNumber,
                mode: mode
            }
        });
    }

    private findHeadingElement(heading: HeadingCache): HTMLElement | null {
        if (!this.currentView) return null;

        const previewView = this.currentView.containerEl.querySelector('.markdown-preview-view');
        if (!previewView) return null;

        // 使用 Obsidian 的数据属性查找
        const headingEl = previewView.querySelector(
            `[data-heading="${heading.heading}"]`
        ) as HTMLElement;
        if (headingEl) return headingEl;

        const allHeadings = Array.from(previewView.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const targetIndex = this.headings.findIndex(h => h === heading);
        if (targetIndex >= 0 && targetIndex < allHeadings.length) {
            return allHeadings[targetIndex] as HTMLElement;
        }

        return allHeadings.find(el => {
            const text = el.textContent?.trim();
            const level = parseInt(el.tagName.substring(1));
            return text === heading.heading && level === heading.level;
        }) as HTMLElement || null;
    }

    private cleanupCurrentView(): void {
        document.querySelectorAll('.rht-reading-progress').forEach(el => el.remove());

        if (this.scrollElement) {
            this.scrollElement.removeEventListener('scroll', this.handleScroll);
        }
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
        this.container?.remove();
        this.container = null;
        this.currentView = null;
        this.scrollElement = null;
    }

    protected cleanupModule(): void {
        // 1. 调用父类的清理方法
        super.cleanupModule();
        
        this.cleanupCurrentView();
        this.unregisterEventHandlers();
    }

    protected async onModuleUnload(): Promise<void> {
        this.cleanupCurrentView();
        this.unregisterEventHandlers();
        this.logger.info('Reading progress manager unloaded');
    }
}
