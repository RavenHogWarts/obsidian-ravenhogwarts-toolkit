import * as React from "react";
import { BaseManager } from "@/src/core/services/BaseManager";
import { debounce, HeadingCache, MarkdownView } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { IToolkitModule } from "@/src/core/interfaces/types";
import { ReadingProgress } from "@/src/toolkit/readingProgress/components/ReadingProgress/ReadingProgress";
import {
	IReadingProgressConfig,
	IReadingProgressData,
	READING_PROGRESS_DEFAULT_CONFIG,
} from "@/src/toolkit/readingProgress/types/config";
import { EstimatedReadingTime } from "../services/estimatedReadingTime";
import { GenerateTOC } from "../services/generateTableOfContents";

interface IReadingProgressModule extends IToolkitModule {
	config: IReadingProgressConfig;
	data: IReadingProgressData;
}

export class ReadingProgressManager extends BaseManager<IReadingProgressModule> {
	private root: Root | null = null;
	private container: HTMLElement | null = null;
	private currentView: MarkdownView | null = null;
	private scrollElement: Element | null = null;
	private resizeObserver: ResizeObserver | null = null;
	private progress = 0;
	private headings: HeadingCache[] = [];
	private currentHeadingIndex = -1;
	private estimatedReadingTime: EstimatedReadingTime | null = null;
	private toc: GenerateTOC | null = null;

	protected getDefaultConfig(): IReadingProgressConfig {
		return READING_PROGRESS_DEFAULT_CONFIG;
	}

	protected async onModuleLoad(): Promise<void> {
		this.logger.info("Loading reading progress manager");
		this.initResizeObserver();
		this.registerEventHandlers();
		this.updateContainerPosition();

		this.estimatedReadingTime = new EstimatedReadingTime(
			this.app,
			this.logger
		);
		this.estimatedReadingTime.initialize();
		this.toc = new GenerateTOC(this.app, this.logger);
		this.toc.initialize();
	}

	protected onModuleUnload(): void {
		this.logger.info("Unloading reading progress manager");
	}

	protected onModuleCleanup(): void {
		this.cleanupCurrentView();
		// @ts-ignore
		window.calculateReadingTime = undefined;
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
		this.estimatedReadingTime = null;
	}

	protected registerEventHandlers(): void {
		// 监听活动视图变化
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", async () => {
				this.updateContainerPosition();
			})
		);

		// 监听布局变化
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				this.updateContainerPosition();
			})
		);

		// 监听编辑器变化
		this.registerEvent(
			this.app.workspace.on("editor-change", (editor) => {
				if (this.currentView?.editor === editor) {
					this.updateActiveHeading();
					this.updateTOC();
				}
			})
		);

		// 监听文件元数据变化
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				if (this.currentView?.file === file) {
					this.updateTOC();
				}
			})
		);
	}

	private renderComponent(): void {
		if (!this.root) return;

		this.root.render(
			React.createElement(ReadingProgress, {
				config: this.config,
				onConfigChange: (config) => this.updateConfig(config),
				headings: this.headings,
				progress: this.progress,
				onHeadingClick: (heading) => this.scrollToHeading(heading),
				activeHeadingIndex: this.currentHeadingIndex,
				isEditing: this.currentView?.getMode() === "source",
				onReturnClick: (target) => this.handleReturnClick(target),
			})
		);
	}

	private handleReturnClick = (target: "cursor" | "top" | "bottom"): void => {
		if (!this.currentView || !this.scrollElement) return;

		const mode = this.currentView.getMode();

		if (mode === "source") {
			if (target === "cursor") {
				const editor = this.currentView.editor;
				if (editor) {
					const currentPos = editor.getCursor();
					editor.scrollIntoView(
						{ from: currentPos, to: currentPos },
						true
					);
					editor.focus();
				}
			}
		} else {
			const startTime = Date.now();
			const startPosition = this.scrollElement.scrollTop;
			const targetPosition =
				target === "top"
					? 0
					: this.scrollElement.scrollHeight -
					  this.scrollElement.clientHeight;
			const distance = targetPosition - startPosition;

			const smoothScroll = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / 500, 1); // 500ms 的动画时间

				if (progress < 1) {
					const easeProgress = 1 - Math.pow(1 - progress, 3);
					this.scrollElement!.scrollTop =
						startPosition + distance * easeProgress;
					requestAnimationFrame(smoothScroll);
				} else {
					this.scrollElement!.scrollTop = targetPosition;
				}
			};

			requestAnimationFrame(smoothScroll);
		}
	};

	private updateProgress(): void {
		if (!this.scrollElement) return;

		const scrollTop = this.scrollElement.scrollTop;
		const scrollHeight = this.scrollElement.scrollHeight;
		const clientHeight = this.scrollElement.clientHeight;
		const maxScroll = scrollHeight - clientHeight;

		this.progress =
			maxScroll > 0
				? Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100))
				: 0;

		this.updateActiveHeading();
		this.renderComponent();
	}

	private updateActiveHeading(): void {
		if (!this.headings.length || !this.currentView) return;

		const activeIndex = this.binarySearchClosestHeading(
			this.headings,
			this.currentView.currentMode.getScroll()
		);

		if (this.currentHeadingIndex !== activeIndex) {
			this.currentHeadingIndex = activeIndex;
			this.renderComponent();
		}
	}

	private binarySearchClosestHeading(
		headings: HeadingCache[],
		targetLine: number
	): number {
		let closestIndex = 0;
		let low = 0;
		let high = headings.length - 1;
		while (low <= high) {
			const mid = Math.floor((low + high) / 2);
			const midLine = headings[mid].position.start.line;
			if (midLine <= targetLine) {
				closestIndex = mid;
				low = mid + 1;
			} else {
				high = mid - 1;
			}
		}
		return closestIndex;
	}

	private updateTOC(): void {
		if (!this.currentView?.file) return;

		const cache = this.app.metadataCache.getFileCache(
			this.currentView.file
		);
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

	private updateContainerPosition(): void {
		if (!this.isEnabled()) {
			this.cleanupCurrentView();
			return;
		}

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			this.cleanupCurrentView();
			return;
		}

		this.cleanupCurrentView();
		this.currentView = view;

		const contentContainer =
			view.containerEl.querySelector(".view-content");
		this.scrollElement = this.getScrollElement();

		if (contentContainer && this.scrollElement) {
			// 创建容器和 React root
			this.container = document.createElement("div");
			this.container.classList.add("rht-reading-progress");
			this.root = createRoot(this.container);
			contentContainer.appendChild(this.container);

			// 设置滚动监听
			this.scrollElement.addEventListener("scroll", this.handleScroll);

			// 设置编辑器事件监听
			this.setupEditorEvents(view);

			// 更新观察器
			this.resizeObserver?.observe(contentContainer);

			// 更新内容和渲染组件
			this.updateTOC();
			this.updateProgress();
		}
	}

	private getScrollElement(): Element | null {
		if (!this.currentView) return null;

		return this.currentView.getMode() === "source"
			? this.currentView.containerEl.querySelector(".cm-scroller")
			: this.currentView.containerEl.querySelector(
					".markdown-preview-view"
			  );
	}

	private handleScroll = debounce((): void => {
		this.updateProgress();
	}, 50);

	private setupEditorEvents(view: MarkdownView): void {
		const editor = view.editor;
		if (!editor) return;

		// 每 100ms 检查一次光标位置
		const interval = window.setInterval(() => {
			if (this.currentView?.getMode() === "source") {
				this.updateActiveHeading();
			}
		}, 100);

		// 确保在清理时移除interval
		this.register(() => window.clearInterval(interval));
	}

	private scrollToHeading(heading: HeadingCache): void {
		if (!this.currentView?.file) return;

		const mode = this.currentView.getMode();
		const lineNumber = heading.position.start.line;

		this.currentView.leaf.openFile(this.currentView.file, {
			eState: {
				line: lineNumber,
				mode: mode,
			},
		});
	}

	private cleanupCurrentView(): void {
		document
			.querySelectorAll(".rht-reading-progress")
			.forEach((el) => el.remove());

		if (this.scrollElement) {
			this.scrollElement.removeEventListener("scroll", this.handleScroll);
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

	protected onConfigChange(): void {
		this.renderComponent();
		this.updateContainerPosition();
	}
}
