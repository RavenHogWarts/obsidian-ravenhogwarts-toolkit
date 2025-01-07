import { BaseManager } from "@/src/core/services/BaseManager";
import { HeadingCache, MarkdownView } from "obsidian";
import { createRoot, Root } from 'react-dom/client';
import { ReadingProgress } from '../components/ReadingProgress';
import * as React from 'react';
import { IReadingProgressConfig, IReadingProgressData } from "../types/config";
import { IToolkitModule } from "@/src/core/interfaces/types";

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

    protected async onModuleLoad(): Promise<void> {
        // 确保只初始化一次
        this.cleanupCurrentView(); // 先清理可能存在的旧实例
        this.initResizeObserver();
        this.initContainer();
        this.registerEventHandlers();
        this.logger.info('Reading progress manager loaded');
    }

    protected onEnable(): void {
        // 确保先调用父类方法
        super.onEnable();

        // 初始化
        this.initResizeObserver();
        this.registerEventHandlers();

        // 立即更新显示
        this.updateContainerPosition();
    }

    private initContainer(): void {
        this.container = document.createElement('div');
        this.root = createRoot(this.container);
        this.renderComponent();
        this.updateContainerPosition();
    }

    private renderComponent(): void {
        if (!this.root) return;
        
        this.root.render(
            React.createElement(ReadingProgress, {
                headings: this.headings,
                progress: this.progress,
                onHeadingClick: (heading) => this.scrollToHeading(heading)
            })
        );
    }

    private updateProgress(): void {
        if (!this.scrollElement) return;
        
        const scrollTop = this.scrollElement.scrollTop;
        const scrollHeight = this.scrollElement.scrollHeight;
        const clientHeight = this.scrollElement.clientHeight;
        const maxScroll = scrollHeight - clientHeight;
        
        this.progress = maxScroll > 0 ? 
            Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)) : 
            0;
        
        this.renderComponent();
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
            this.app.workspace.on('active-leaf-change', () => {
                this.updateContainerPosition();
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
                
                // 更新观察器
                if (this.resizeObserver) {
                    this.resizeObserver.disconnect();
                    this.resizeObserver.observe(contentContainer);
                }
                
                // 更新内容和渲染组件
                this.updateTOC();
                this.updateProgress();
                this.applyStyles();
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

    private handleScroll = (): void => {
        this.updateProgress();
    };

    private scrollToHeading(heading: HeadingCache): void {
        if (!this.currentView) return;

        const mode = this.currentView.getMode();
        
        if (mode === 'source') {
            // 编辑模式下的滚动
            if (this.currentView.editor) {
                const pos = { line: heading.position.start.line, ch: 0 };
                this.currentView.editor.setCursor(pos);
                this.currentView.editor.scrollIntoView({ from: pos, to: pos }, true);
            }
        } else {
            // 阅读模式下的滚动
            const scrollEl = this.getScrollElement();
            const headingEl = this.findHeadingElement(heading);
            
            if (scrollEl && headingEl) {
                // 计算目标滚动位置
                const scrollRect = scrollEl.getBoundingClientRect();
                const headingRect = headingEl.getBoundingClientRect();
                const offsetTop = headingRect.top - scrollRect.top + scrollEl.scrollTop;
                
                // 使用 scrollTo 而不是 scrollIntoView
                scrollEl.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
                
                // 更新进度条
                setTimeout(() => {
                    this.updateProgress();
                }, 100);
            }
        }
    }

    private findHeadingElement(heading: HeadingCache): HTMLElement | null {
        if (!this.currentView) return null;

        const previewView = this.currentView.containerEl.querySelector('.markdown-preview-view');
        if (!previewView) return null;

        // 首先尝试使用精确匹配
        const headingSelector = `h${heading.level}`;
        const headings = Array.from(previewView.querySelectorAll(headingSelector));
        
        // 使用更精确的文本匹配
        const targetHeading = headings.find(el => {
            const headingText = el.textContent?.trim();
            const targetText = heading.heading.trim();
            return headingText === targetText;
        });

        if (targetHeading) {
            return targetHeading as HTMLElement;
        }

        // 回退到模糊匹配
        return headings.find(el => 
            el.textContent?.trim().includes(heading.heading.trim())
        ) as HTMLElement || null;
    }

    private applyStyles(): void {
        if (!this.container) return;

        const { position } = this.config;
        
        Object.assign(this.container.style, {
            [position]: '0',
            [position === 'right' ? 'left' : 'right']: 'auto'
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

