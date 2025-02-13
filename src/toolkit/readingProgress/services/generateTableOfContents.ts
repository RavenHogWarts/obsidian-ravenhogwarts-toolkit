import {
	App,
	HeadingCache,
	MarkdownPostProcessorContext,
	MarkdownPreviewRenderer,
	MarkdownView,
} from "obsidian";
import "../components/styles/TableOfContents.css";
import { Logger } from "@/src/core/services/Log";

export interface ITocConfig {
	// 基础配置
	maxDepth?: number; // 最大标题深度
	minDepth?: number; // 最小标题深度
	redirect?: boolean; // 是否包含可点击链接

	// 显示配置
	ordered?: boolean; // 是否显示序号
	title?: string; // TOC 标题

	// 样式配置
	style?: {
		width?: string;
		maxHeight?: string;
		backgroundColor?: string;
		borderRadius?: string;
		padding?: string;
		border?: string;
		fontSize?: string;
	};
}

export class GenerateTOC {
	private app: App;
	private logger: Logger;

	constructor(app: App, logger: Logger) {
		this.app = app;
		this.logger = logger;
	}

	public initialize(): void {
		MarkdownPreviewRenderer.registerPostProcessor(
			MarkdownPreviewRenderer.createCodeBlockPostProcessor(
				"rht-toc",
				async (
					source: string,
					el: HTMLElement,
					ctx: MarkdownPostProcessorContext
				) => {
					try {
						let config: ITocConfig = {};
						if (source.trim()) {
							try {
								config = new Function(
									`return (${source.trim()})`
								)();
							} catch (parseError) {
								try {
									config = JSON.parse(source.trim());
								} catch (jsonError) {
									console.error("Failed to parse TOC config");
								}
							}
						}

						const container = el.createEl("div");
						await this.renderTableOfContents(container, config);
					} catch (error) {
						console.error("Error rendering TOC:", error);
						el.setText("Error generating table of contents");
					}
				}
			)
		);
	}

	private async renderTableOfContents(
		container: HTMLElement,
		config?: ITocConfig
	): Promise<void> {
		try {
			const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
			const activeFile = this.app.workspace.getActiveFile();
			if (!activeFile) {
				throw new Error("No active file found");
			}

			const cache = this.app.metadataCache.getFileCache(activeFile);
			const headings = cache?.headings || [];

			this.applyStyles(container, mergedConfig);
			container.appendChild(this.generateTOC(headings, mergedConfig));
		} catch (error) {
			this.logger.error("Error generating table of contents:", error);
			throw error;
		}
	}

	private get DEFAULT_CONFIG(): ITocConfig {
		return {
			maxDepth: 3,
			minDepth: 1,
			redirect: true,
			ordered: false,
			title: "Table of Contents",
			style: {
				width: "100%",
				maxHeight: "500px",
				backgroundColor: "var(--background-secondary)",
				borderRadius: "8px",
				padding: "12px 16px",
				border: "1px solid var(--background-modifier-border)",
				fontSize: "0.9em",
			},
		};
	}

	private applyStyles(element: HTMLElement, config: ITocConfig): void {
		element.addClass("rht-inline-toc-container");

		if (config.style) {
			const styles: Record<string, string> = {};

			// 基础样式
			if (config.style.width) styles.width = config.style.width;
			if (config.style.maxHeight)
				styles.maxHeight = config.style.maxHeight;
			if (config.style.backgroundColor)
				styles.backgroundColor = config.style.backgroundColor;
			if (config.style.borderRadius)
				styles.borderRadius = config.style.borderRadius;
			if (config.style.padding) styles.padding = config.style.padding;
			if (config.style.border) styles.border = config.style.border;
			if (config.style.fontSize) styles.fontSize = config.style.fontSize;

			element.setCssStyles(styles);
		}
	}

	private generateTOC(
		headings: HeadingCache[],
		config: ITocConfig
	): DocumentFragment {
		const fragment = document.createDocumentFragment();

		if (config.title) {
			const titleEl = fragment.createEl("div", {
				cls: "rht-inline-toc-title",
				text: config.title,
			});
		}

		const listEl = fragment.createEl("ul", {
			cls: "rht-inline-toc-list",
		});

		const filteredHeadings = headings.filter(
			(heading) =>
				heading.level >= config.minDepth! &&
				heading.level <= config.maxDepth!
		);

		const isUnderSameParent = (index1: number, index2: number): boolean => {
			const level = headings[index1].level;
			let parent1 = -1;
			let parent2 = -1;

			// 向前查找最近的上级标题
			for (let i = index1; i >= 0; i--) {
				// 跳过不在配置范围内的标题
				if (
					headings[i].level < config.minDepth! ||
					headings[i].level > config.maxDepth!
				) {
					continue;
				}
				if (headings[i].level < level) {
					parent1 = i;
					break;
				}
			}

			for (let i = index2; i >= 0; i--) {
				// 跳过不在配置范围内的标题
				if (
					headings[i].level < config.minDepth! ||
					headings[i].level > config.maxDepth!
				) {
					continue;
				}
				if (headings[i].level < level) {
					parent2 = i;
					break;
				}
			}

			return parent1 === parent2;
		};

		const generateHeadingNumber = (index: number): string => {
			// 如果标题不在配置的深度范围内，不显示编号
			if (
				filteredHeadings[index].level < config.minDepth! ||
				filteredHeadings[index].level > config.maxDepth!
			) {
				return "";
			}

			const stack: number[] = [];
			const levels: number[] = [];

			// 从头开始遍历，构建正确的层级关系
			for (let i = 0; i <= index; i++) {
				const heading = filteredHeadings[i];

				// 跳过不在配置范围内的标题
				if (
					heading.level < config.minDepth! ||
					heading.level > config.maxDepth!
				) {
					continue;
				}

				while (
					levels.length > 0 &&
					levels[levels.length - 1] >= heading.level
				) {
					levels.pop();
					stack.pop();
				}

				if (
					levels.length === 0 ||
					heading.level > levels[levels.length - 1]
				) {
					// 新的层级
					let count = 1;
					// 向前查找同级标题
					for (let j = i - 1; j >= 0; j--) {
						// 跳过不在配置范围内的标题
						if (
							filteredHeadings[j].level < config.minDepth! ||
							filteredHeadings[j].level > config.maxDepth!
						) {
							continue;
						}
						if (
							filteredHeadings[j].level === heading.level &&
							isUnderSameParent(j, i)
						) {
							count++;
						}
					}
					levels.push(heading.level);
					stack.push(count);
				}
			}

			return stack.join(".") + ".";
		};

		filteredHeadings.forEach((heading, index) => {
			const listItem = listEl.createEl("li", {
				cls: `rht-inline-toc-item level-${heading.level}`,
			});

			// 设置缩进样式
			listItem.style.marginLeft = `${
				(heading.level - config.minDepth!) * 20
			}px`;

			if (config.redirect) {
				if (config.ordered) {
					const numberSpan = listItem.createEl("span", {
						cls: "rht-inline-toc-number",
						text: generateHeadingNumber(index),
					});
					numberSpan.style.marginRight = "0.5em";
				}

				listItem.createEl("span", {
					text: heading.heading,
				});

				// 添加点击事件处理
				listItem.addEventListener("click", (e) => {
					e.preventDefault();

					const activeView =
						this.app.workspace.getActiveViewOfType(MarkdownView);
					if (!activeView?.file) return;

					const mode = activeView.getMode();
					const lineNumber = heading.position.start.line;

					activeView.leaf.openFile(activeView.file, {
						eState: {
							line: lineNumber,
							mode: mode,
						},
					});
				});
			} else {
				if (config.ordered) {
					const numberSpan = listItem.createEl("span", {
						cls: "rht-inline-toc-number",
						text: generateHeadingNumber(index),
					});
					numberSpan.style.marginRight = "0.5em";
				}
				listItem.createEl("span", {
					text: heading.heading,
				});
			}
		});

		return fragment;
	}
}
