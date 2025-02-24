import * as React from "react";
import { BaseManager } from "@/src/core/services/BaseManager";
import { debounce, Editor, HeadingCache, MarkdownView, Menu } from "obsidian";
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

interface IReadingProgressTocState {
	collapsedItems: Set<number>;
	allCollapsed: boolean;
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
	private tocGenerator: GenerateTOC | null = null;
	private state: IReadingProgressTocState = {
		collapsedItems: new Set(),
		allCollapsed: false,
	};

	protected getDefaultConfig(): IReadingProgressConfig {
		return READING_PROGRESS_DEFAULT_CONFIG;
	}

	protected async onModuleLoad(): Promise<void> {
		this.logger.info("Loading reading progress manager");
		this.initResizeObserver();
		this.registerCommands();
		this.registerEventHandlers();
		this.updateContainerPosition();

		this.estimatedReadingTime = new EstimatedReadingTime(
			this.app,
			this.plugin,
			this.logger
		);
		this.estimatedReadingTime.initialize();
		this.tocGenerator = new GenerateTOC(this.app, this.plugin, this.logger);
		this.tocGenerator.initialize();
	}

	protected onModuleUnload(): void {
		this.logger.info("Unloading reading progress manager");
	}

	protected onModuleCleanup(): void {
		this.cleanupCurrentView();
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}
		this.estimatedReadingTime?.unload();
		this.tocGenerator?.unload();
	}

	protected registerCommands(): void {
		this.addCommand({
			id: "insert-rht-toc",
			name: this.t("toolkit.readingProgress.command.insert_toc"),
			editorCallback: (editor: Editor) => {
				this.insertTOC(editor);
			},
		});

		this.addCommand({
			id: "insert-rht-reading-time",
			name: this.t("toolkit.readingProgress.command.insert_reading_time"),
			editorCallback: (editor: Editor) => {
				this.insertReadingTime(editor);
			},
		});

		this.addCommand({
			id: "toggle-rht-toc-expanded",
			name: this.t("toolkit.readingProgress.command.toggle_toc_expanded"),
			callback: () => {
				this.setConfig({
					tocAlwaysExpanded: !this.getConfig().tocAlwaysExpanded,
				});
			},
		});

		this.addCommand({
			id: "jump-to-next-heading",
			name: this.t(
				"toolkit.readingProgress.command.jump_to_next_heading"
			),
			callback: () => {
				this.navigateHeading("next");
			},
		});

		this.addCommand({
			id: "jump-to-previous-heading",
			name: this.t(
				"toolkit.readingProgress.command.jump_to_prev_heading"
			),
			callback: () => {
				this.navigateHeading("previous");
			},
		});

		this.addCommand({
			id: "toggle-all-headings",
			name: this.t("toolkit.readingProgress.command.toggle_all_headings"),
			callback: () => {
				this.toggleAllHeadings();
			},
		});

		this.addCommand({
			id: "scroll-to-top",
			name: this.t("toolkit.readingProgress.command.scroll_to_top"),
			callback: () => {
				this.handleReturnClick("top");
			},
		});

		this.addCommand({
			id: "scroll-to-bottom",
			name: this.t("toolkit.readingProgress.command.scroll_to_bottom"),
			callback: () => {
				this.handleReturnClick("bottom");
			},
		});
	}

	private insertTOC(editor: Editor) {
		const defaultConfig = this.tocGenerator?.DEFAULT_CONFIG;
		if (!defaultConfig) return;

		const codeBlock = [
			"```rht-toc",
			JSON.stringify(defaultConfig, null, 2),
			"```",
		].join("\n");

		editor.replaceSelection(codeBlock);
	}

	private insertReadingTime(editor: Editor) {
		const defaultConfig = this.estimatedReadingTime?.DEFAULT_CONFIG;
		if (!defaultConfig) return;

		const codeBlock = [
			"```rht-reading-time",
			JSON.stringify(defaultConfig, null, 2),
			"```",
		].join("\n");

		editor.replaceSelection(codeBlock);
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

		this.registerEvent(
			this.app.workspace.on(
				"editor-menu",
				this.handleEditorMenu.bind(this)
			)
		);
	}

	private handleEditorMenu(menu: Menu, editor: Editor): void {
		if (!this.isEnabled()) return;

		this.addMenuItem(
			menu,
			[
				{
					title: this.t(
						"toolkit.readingProgress.editor_menu.insert_toc"
					),
					icon: "list-tree",
					order: 1,
					callback: () => {
						const editor = this.currentView?.editor;
						if (editor) {
							this.insertTOC(editor);
						}
					},
				},
				{
					title: this.t(
						"toolkit.readingProgress.editor_menu.insert_reading_time"
					),
					icon: "hourglass",
					order: 2,
					callback: () => {
						const editor = this.currentView?.editor;
						if (editor) {
							this.insertReadingTime(editor);
						}
					},
				},
			],
			{ showSeparator: true }
		);
	}

	private renderComponent(): void {
		if (!this.root) return;

		this.root.render(
			React.createElement(ReadingProgress, {
				app: this.app,
				config: this.config,
				currentView: this.currentView!,
				onConfigChange: (config) => this.updateConfig(config),
				headings: this.headings,
				progress: this.progress,
				onHeadingClick: (heading) => this.scrollToHeading(heading),
				activeHeadingIndex: this.currentHeadingIndex,
				isEditing: this.currentView?.getMode() === "source",
				onReturnClick: (target) => this.handleReturnClick(target),
				onNavigateHeading: (direction) =>
					this.navigateHeading(direction),
				collapsedItems: this.state.collapsedItems,
				allCollapsed: this.state.allCollapsed,
				onToggleCollapse: (index: number) =>
					this.handleToggleCollapse(index),
				onToggleAll: () => this.toggleAllHeadings(),
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
			} else {
				const currentScroll = this.currentView.currentMode.getScroll();
				const targetScroll =
					target === "top" ? 0 : Number.MAX_SAFE_INTEGER;

				const startTime = Date.now();
				const startPosition = currentScroll;
				const distance = targetScroll - startPosition;
				const duration = 500;

				const smoothScroll = () => {
					const elapsed = Date.now() - startTime;
					const progress = Math.min(elapsed / duration, 1);

					if (progress < 1) {
						const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
						const newScroll =
							startPosition + distance * easeProgress;
						this.currentView?.currentMode.applyScroll(newScroll);
						requestAnimationFrame(smoothScroll);
					} else {
						this.currentView?.currentMode.applyScroll(targetScroll);
					}
				};
				requestAnimationFrame(smoothScroll);
			}
		} else if (mode === "preview") {
			const currentScroll = this.scrollElement.scrollTop;
			const targetScroll =
				target === "top"
					? 0
					: this.scrollElement.scrollHeight -
					  this.scrollElement.clientHeight;

			const startTime = Date.now();
			const startPosition = currentScroll;
			const distance = targetScroll - startPosition;
			const duration = 500;

			const smoothScroll = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);

				if (progress < 1) {
					const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
					this.scrollElement!.scrollTop =
						startPosition + distance * easeProgress;
					requestAnimationFrame(smoothScroll);
				} else {
					this.scrollElement!.scrollTop = targetScroll;
				}
			};

			requestAnimationFrame(smoothScroll);
		}
	};

	private navigateHeading(direction: "next" | "previous"): void {
		if (!this.currentView || this.headings.length === 0) return;

		const mode = this.currentView.getMode();
		let nextIndex = -1;

		if (mode === "source") {
			const editor = this.currentView.editor;
			if (!editor) return;

			const currentLine = editor.getCursor().line;

			if (direction === "next") {
				// 查找下一个标题
				nextIndex = this.headings.findIndex(
					(h) => h.position.start.line > currentLine
				);
				// 如果没找到下一个，循环到第一个
				if (nextIndex === -1) nextIndex = 0;
			} else {
				// 查找上一个标题
				for (let i = this.headings.length - 1; i >= 0; i--) {
					if (this.headings[i].position.start.line < currentLine) {
						nextIndex = i;
						break;
					}
				}
				// 如果没找到上一个，循环到最后一个
				if (nextIndex === -1) nextIndex = this.headings.length - 1;
			}
		} else {
			const scrollInfo = Math.ceil(
				this.currentView.currentMode.getScroll()
			);
			const currentIndex = this.binarySearchClosestHeading(
				this.headings,
				scrollInfo
			);

			if (direction === "next") {
				nextIndex =
					currentIndex < this.headings.length - 1
						? currentIndex + 1
						: 0;
			} else {
				nextIndex =
					currentIndex > 0
						? currentIndex - 1
						: this.headings.length - 1;
			}
		}

		if (nextIndex >= 0) {
			this.scrollToHeading(this.headings[nextIndex]);
		}
	}

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

		let activeIndex = -1;

		const mode = this.currentView.getMode();
		if (mode === "source") {
			const editor = this.currentView.editor;
			if (!editor) return;

			const currentLine = editor.getCursor().line;
			for (let i = this.headings.length - 1; i >= 0; i--) {
				if (this.headings[i].position.start.line <= currentLine) {
					activeIndex = i;
					break;
				}
			}
		} else {
			activeIndex = this.binarySearchClosestHeading(
				this.headings,
				this.currentView.currentMode.getScroll()
			);
		}

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

	private toggleAllHeadings(): void {
		if (this.state.allCollapsed) {
			this.state.collapsedItems = new Set();
		} else {
			this.state.collapsedItems = new Set(
				this.headings
					.map((_, index) => index)
					.filter((index) => this.hasChildren(index))
			);
		}
		this.state.allCollapsed = !this.state.allCollapsed;
		this.renderComponent();
	}

	private hasChildren(index: number): boolean {
		if (index >= this.headings.length - 1) return false;
		const currentLevel = this.headings[index].level;
		return this.headings[index + 1].level > currentLevel;
	}

	private handleToggleCollapse(index: number): void {
		const newCollapsedItems = new Set(this.state.collapsedItems);
		if (newCollapsedItems.has(index)) {
			newCollapsedItems.delete(index);
		} else {
			newCollapsedItems.add(index);
		}
		this.state.collapsedItems = newCollapsedItems;
		this.renderComponent();
	}
}
