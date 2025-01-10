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
                onConfigChange: (config) => this.updateConfig(config),
                readingTime: this.readingTime,
                headings: this.headings,
                progress: this.progress,
                onHeadingClick: (heading) => this.scrollToHeading(heading),
                activeHeadingIndex: this.currentHeadingIndex,
                isEditing: this.currentView?.getMode() === 'source',
                onReturnClick: (target) => this.handleReturnClick(target)
            })
        );
    }

    protected onConfigChange(): void {
        // 配置变更时重新渲染组件
        this.renderComponent();
        // 更新容器位置
        this.updateContainerPosition();
    }

    private handleReturnClick = (target: 'cursor' | 'top' | 'bottom'): void => {
        if (!this.currentView || !this.scrollElement) return;
    
        const mode = this.currentView.getMode();
        
        if (mode === 'source') {
            if (target === 'cursor') {
                const editor = this.currentView.editor;
                if (editor) {
                    const currentPos = editor.getCursor();
                    editor.scrollIntoView({ from: currentPos, to: currentPos }, true);
                    editor.focus();
                }
            }
        } else {
            // 阅读模式：先尝试平滑滚动，如果超时则强制滚动
            const startTime = Date.now();
            const startPosition = this.scrollElement.scrollTop;
            const targetPosition = target === 'top' ? 0 : this.scrollElement.scrollHeight - this.scrollElement.clientHeight;
            const distance = targetPosition - startPosition;
            
            const smoothScroll = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / 500, 1); // 500ms 的动画时间
                
                if (progress < 1) {
                    // 使用 easeOutCubic 缓动函数
                    const easeProgress = 1 - Math.pow(1 - progress, 3);
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this.scrollElement!.scrollTop = startPosition + (distance * easeProgress);
                    requestAnimationFrame(smoothScroll);
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this.scrollElement!.scrollTop = targetPosition;
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
            // 阅读模式下使用滚动位置来确定当前标题
            if (!this.scrollElement) return;

            const viewportTop = this.scrollElement.scrollTop;
            const viewportHeight = this.scrollElement.clientHeight;
            const scrollHeight = this.scrollElement.scrollHeight;
            const progress = (viewportTop / (scrollHeight - viewportHeight)) * 100;

             // 根据滚动进度预估当前可能的标题范围
            const estimatedIndex = Math.floor((progress / 100) * this.headings.length);
            const searchRange = 5; // 向前后各搜索的标题数量

            // 确定搜索范围
            const startIndex = Math.max(0, estimatedIndex - searchRange);
            const endIndex = Math.min(this.headings.length - 1, estimatedIndex + searchRange);
            
            // 获取这个范围内的所有标题
            const candidateHeadings = this.headings.slice(startIndex, endIndex + 1);

            // 尝试查找这些标题对应的元素
            const foundHeadings = candidateHeadings.map((heading, idx) => {
                const actualIndex = startIndex + idx;
                const element = this.findHeadingElementByAllMethods(heading);
                if (!element) return null;

                const rect = element.getBoundingClientRect();
                const offsetTop = viewportTop + rect.top;

                return {
                    index: actualIndex,
                    heading,
                    element,
                    offsetTop
                };
            }).filter((item): item is NonNullable<typeof item> => item !== null);

            if (!foundHeadings.length) {
                // 如果没有找到任何可见标题，使用估算的索引
                this.currentHeadingIndex = estimatedIndex;
                this.renderComponent();
                return;
            }

            // 使用视口上三分之一位置作为判断点
            const viewportThreshold = viewportTop + (viewportHeight / 3);

            // 找到最接近但不超过判断点的标题
            let activeIndex = -1;
            let minDistance = Infinity;

            for (const heading of foundHeadings) {
                const distance = viewportThreshold - heading.offsetTop;
                if (distance >= 0 && distance < minDistance) {
                    activeIndex = heading.index;
                    minDistance = distance;
                }
            }

            // 如果找到了合适的标题，更新索引
            if (activeIndex !== -1 && this.currentHeadingIndex !== activeIndex) {
                this.currentHeadingIndex = activeIndex;
                this.renderComponent();
            }
        }
    }

    private findHeadingElementByAllMethods(heading: HeadingCache): HTMLElement | null {
        if (!this.currentView) return null;
        const previewView = this.currentView.containerEl.querySelector('.markdown-preview-view');
        if (!previewView) return null;
    
        // 1. 首先尝试使用 data-line 属性
        const lineSelector = `[data-line="${heading.position.start.line}"]`;
        const elementByLine = previewView.querySelector(lineSelector) as HTMLElement;
        if (elementByLine) return elementByLine;
    
        // 2. 尝试使用 data-heading 属性
        const headingSelector = `[data-heading="${heading.heading}"]`;
        const elementByDataHeading = previewView.querySelector(headingSelector) as HTMLElement;
        if (elementByDataHeading) return elementByDataHeading;
    
        // 3. 使用标签和文本内容匹配
        const headingElements = Array.from(previewView.querySelectorAll(`h${heading.level}`));
        return headingElements.find(el => el.textContent?.trim() === heading.heading) as HTMLElement || null;
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
