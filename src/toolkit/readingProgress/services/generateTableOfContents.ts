import {
	App,
	HeadingCache,
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	MarkdownView,
	TFile,
} from "obsidian";
import "../components/styles/TableOfContents.css";
import { Logger } from "@/src/core/services/Log";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { registerCodeblock } from "@/src/lib/registerCodeblock";

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

	layout?: {
		type: "default" | "columns";
		columnMinWidth?: string; // 双栏模式下每栏最小宽度
		columnGap?: string; // 双栏间距
		breakpoint?: string; // 触发双栏的最小宽度
		columnRule?: string; // 双栏分隔线样式
	};
}

export class GenerateTOC {
	app: App;
	private plugin: RavenHogwartsToolkitPlugin;
	private logger: Logger;
	private codeBlockProcessor: registerCodeblock;

	constructor(app: App, plugin: RavenHogwartsToolkitPlugin, logger: Logger) {
		this.app = app;
		this.plugin = plugin;
		this.logger = logger;
		this.codeBlockProcessor = new registerCodeblock(this.plugin);
	}

	public async initialize(): Promise<void> {
		try {
			this.codeBlockProcessor.registerPriorityCodeblockPostProcessor(
				"rht-toc",
				-99,
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
									this.logger.error(
										"Failed to parse TOC config"
									);
								}
							}
						}

						// 创建容器元素
						const container = el.createEl("div");

						// 使用 TOCRenderChild 来管理生命周期和更新
						ctx.addChild(
							new TOCRenderChild(
								container,
								this,
								config,
								ctx.sourcePath
							)
						);
					} catch (error) {
						this.logger.error(
							"Error processing TOC codeblock:",
							error
						);
						el.setText(
							"Error generating table of contents, Please Check Syntax"
						);
					}
				}
			);

			this.logger.debug("Successfully initialized TOC processor");
		} catch (error) {
			this.logger.error("Error initializing TOC processor:", error);
		}
	}

	public unload(): void {
		try {
			this.codeBlockProcessor.unregisterCodeblockProcessor("rht-toc");
			this.logger.debug("Successfully unloaded TOC processor");
		} catch (error) {
			this.logger.error("Error unloading TOC processor:", error);
		}
	}

	public async renderTableOfContents(
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

	public get DEFAULT_CONFIG(): ITocConfig {
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
			layout: {
				type: "default",
				columnMinWidth: "250px",
				columnGap: "2em",
				columnRule: "1px solid var(--background-modifier-border)",
				breakpoint: "600px",
			},
		};
	}

	private applyStyles(element: HTMLElement, config: ITocConfig): void {
		element.addClass("rht-inline-toc-container");

		// 应用布局类型
		if (config.layout?.type === "columns") {
			element.addClass("columns");

			const styles: Record<string, string> = {};

			// 设置CSS变量用于自定义样式
			styles["--toc-column-min-width"] =
				config.layout?.columnMinWidth ||
				this.DEFAULT_CONFIG.layout!.columnMinWidth!;
			styles["--toc-column-gap"] =
				config.layout?.columnGap ||
				this.DEFAULT_CONFIG.layout!.columnGap!;
			styles["--toc-column-rule"] =
				config.layout?.columnRule ||
				this.DEFAULT_CONFIG.layout!.columnRule!;

			// 合并现有样式
			if (config.style) {
				if (config.style.width) styles.width = config.style.width;
				if (config.style.maxHeight)
					styles.maxHeight = config.style.maxHeight;
				if (config.style.backgroundColor)
					styles.backgroundColor = config.style.backgroundColor;
				if (config.style.borderRadius)
					styles.borderRadius = config.style.borderRadius;
				if (config.style.padding) styles.padding = config.style.padding;
				if (config.style.border) styles.border = config.style.border;
				if (config.style.fontSize)
					styles.fontSize = config.style.fontSize;
			}

			element.style.setProperty(
				"--toc-column-min-width",
				styles["--toc-column-min-width"]
			);
			element.style.setProperty(
				"--toc-column-gap",
				styles["--toc-column-gap"]
			);
			element.style.setProperty(
				"--toc-column-rule",
				styles["--toc-column-rule"]
			);

			Object.entries(styles).forEach(([key, value]) => {
				if (!key.startsWith("--")) {
					element.style[key as any] = value;
				}
			});
		} else {
			// 默认样式处理
			if (config.style) {
				const styles: Record<string, string> = {};
				if (config.style.width) styles.width = config.style.width;
				if (config.style.maxHeight)
					styles.maxHeight = config.style.maxHeight;
				if (config.style.backgroundColor)
					styles.backgroundColor = config.style.backgroundColor;
				if (config.style.borderRadius)
					styles.borderRadius = config.style.borderRadius;
				if (config.style.padding) styles.padding = config.style.padding;
				if (config.style.border) styles.border = config.style.border;
				if (config.style.fontSize)
					styles.fontSize = config.style.fontSize;
				element.setCssStyles(styles);
			}
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

			// 创建链接容器
			const linkContainer = listItem.createEl("div", {
				cls: "rht-inline-toc-link-container",
			});

			if (config.ordered) {
				const numberSpan = linkContainer.createEl("span", {
					cls: "rht-inline-toc-number",
					text: generateHeadingNumber(index),
				});
				numberSpan.style.marginRight = "0.5em";
			}

			const textContainer = linkContainer.createEl("a", {
				cls: "rht-inline-toc-text",
				text: heading.heading,
			});

			if (config.redirect) {
				// 在 Obsidian 中点击时的处理
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
			}
		});

		return fragment;
	}
}

// 新增 TOCRenderChild 类来处理实时更新
class TOCRenderChild extends MarkdownRenderChild {
	private config: ITocConfig;
	private tocGenerator: GenerateTOC;
	private sourcePath: string;
	private activeFile: TFile | null = null;

	constructor(
		containerEl: HTMLElement,
		tocGenerator: GenerateTOC,
		config: ITocConfig,
		sourcePath: string
	) {
		super(containerEl);
		this.tocGenerator = tocGenerator;
		this.config = config;
		this.sourcePath = sourcePath;
	}

	async onload() {
		// 获取当前文件
		this.activeFile = this.tocGenerator.app.vault.getAbstractFileByPath(
			this.sourcePath
		) as TFile;
		if (!this.activeFile) return;

		// 初始渲染
		await this.render();

		// 监听文件变化;
		this.registerEvent(
			this.tocGenerator.app.metadataCache.on("changed", async (file) => {
				if (file && file.path === this.sourcePath) {
					await this.render();
				}
			})
		);

		// 监听编辑器变化
		// this.registerEvent(
		// 	this.tocGenerator.app.workspace.on(
		// 		"editor-change",
		// 		async (editor) => {
		// 			const activeFile =
		// 				this.tocGenerator.app.workspace.getActiveFile();
		// 			if (activeFile && activeFile.path === this.sourcePath) {
		// 				await this.render();
		// 			}
		// 		}
		// 	)
		// );
	}

	async render() {
		if (!this.activeFile) return;

		try {
			// 清空容器
			this.containerEl.empty();

			// 重新渲染 TOC
			await this.tocGenerator.renderTableOfContents(
				this.containerEl,
				this.config
			);
		} catch (error) {
			this.containerEl.setText("Error updating table of contents");
			console.error("Error updating TOC:", error);
		}
	}
}
