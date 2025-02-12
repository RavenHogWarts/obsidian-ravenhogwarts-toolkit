import { t } from "@/src/i18n/i18n";
import {
	App,
	MarkdownPostProcessorContext,
	MarkdownPreviewRenderer,
} from "obsidian";
import "../components/styles/ReadingTime.css";
import { Logger } from "@/src/core/services/Log";

export interface IReadingTimeConfig {
	// 基础配置
	chineseWordsPerMinute?: number;
	englishWordsPerMinute?: number;
	removeCodeBlocks?: boolean;
	removeWikiLinks?: boolean;
	removeImageLinks?: boolean;
	removeNormalLinks?: boolean;

	// 显示配置
	template?: string;
	showWordCount?: boolean;
	showIcon?: boolean;
	showRange?: boolean;

	// 样式配置
	style?: {
		color?: string;
		backgroundColor?: string;
		borderRadius?: string;
		padding?: string;
		fontSize?: string;
		fontWeight?: string;
		boxShadow?: string;
		border?: string;
		width?: string;
		maxWidth?: string;
		margin?: string;
	};
}

export class EstimatedReadingTime {
	private app: App;
	private logger: Logger;

	constructor(app: App, logger: Logger) {
		this.app = app;
		this.logger = logger;
	}

	/**
	 * 初始化并注册处理器
	 */
	public initialize(): void {
		MarkdownPreviewRenderer.registerPostProcessor(
			MarkdownPreviewRenderer.createCodeBlockPostProcessor(
				"rht-reading-time",
				async (
					source: string,
					el: HTMLElement,
					ctx: MarkdownPostProcessorContext
				) => {
					try {
						// 清理源代码
						const cleanSource = source.trim();
						let config = {};

						if (cleanSource) {
							// 使用 Function 构造器来解析 JavaScript 对象字面量
							// 这样可以支持不带引号的属性名和尾随逗号
							try {
								config = new Function(
									`return (${cleanSource})`
								)();
							} catch (parseError) {
								// 如果对象字面量解析失败，尝试 JSON.parse 作为后备
								try {
									config = JSON.parse(cleanSource);
								} catch (jsonError) {
									throw new Error(
										t(
											"toolkit.readingProgress.estimatedReadingTime.error.message"
										)
									);
								}
							}
						}

						const container = el.createEl("div");
						await this.calculateReadingTime(container, config);
					} catch (error) {
						el.setText(
							t(
								"toolkit.readingProgress.estimatedReadingTime.error.message"
							)
						);
					}
				}
			)
		);
	}

	/**
	 * 计算阅读时间
	 */
	private async calculateReadingTime(
		container: HTMLElement,
		config?: IReadingTimeConfig
	): Promise<void> {
		try {
			const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
			const activeFile = this.app.workspace.getActiveFile();
			if (!activeFile) {
				throw new Error("No active file found");
			}

			const content = await this.app.vault.read(activeFile);
			const cleanedContent = this.cleanContentWithConfig(
				content,
				mergedConfig
			);
			const wordCounts = this.getWordCounts(cleanedContent);

			// 计算时间
			const chineseTime =
				wordCounts.chineseCount / mergedConfig.chineseWordsPerMinute!;
			const englishTime =
				wordCounts.englishCount / mergedConfig.englishWordsPerMinute!;
			const totalTime = chineseTime + englishTime;

			// 应用样式和渲染内容
			this.applyStyles(container, mergedConfig);
			container.appendChild(
				this.formatContent(totalTime, wordCounts, mergedConfig)
			);
		} catch (error) {
			this.logger.error("Error calculating reading time:", error);
			throw error;
		}
	}

	private get DEFAULT_CONFIG(): IReadingTimeConfig {
		return {
			chineseWordsPerMinute: 300,
			englishWordsPerMinute: 200,
			removeCodeBlocks: true,
			removeWikiLinks: false,
			removeImageLinks: true,
			removeNormalLinks: false,

			// 现在 t() 函数会在实际需要时才被调用
			template: t(
				"toolkit.readingProgress.estimatedReadingTime.template"
			),
			showWordCount: true,
			showIcon: true,
			showRange: false,

			style: {
				color: "var(--text-normal)",
				backgroundColor: "var(--background-secondary)",
				borderRadius: "8px",
				padding: "12px 16px",
				fontSize: "0.95em",
				fontWeight: "normal",
				boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
				border: "1px solid var(--background-modifier-border)",
				width: "auto",
				maxWidth: "100%",
				margin: "1em 0",
			},
		};
	}

	/**
	 * 获取中英文单词数
	 */
	private getWordCounts(content: string): {
		chineseCount: number;
		englishCount: number;
	} {
		// 提取所有中文字符
		const chineseChars = content.match(/[\u4e00-\u9fff]/g) || [];
		// 移除所有中文字符后，按空格分词计算英文单词
		const englishContent = content
			.replace(/[\u4e00-\u9fff]/g, "") // 移除中文字符
			.replace(/[\p{P}]/gu, " ") // 将标点替换为空格
			.trim();

		const englishWords = englishContent.split(/\s+/).filter(Boolean);

		return {
			chineseCount: chineseChars.length,
			englishCount: englishWords.length,
		};
	}

	/**
	 * 根据配置清理内容
	 */
	private cleanContentWithConfig(
		content: string,
		config?: IReadingTimeConfig
	): string {
		let cleanedContent = content
			.replace(/---[\s\S]*?---/, "") // 移除 front matter
			.trim();

		if (config?.removeCodeBlocks) {
			cleanedContent = cleanedContent.replace(/```[\s\S]*?```/g, "");
		}
		if (config?.removeWikiLinks) {
			cleanedContent = cleanedContent.replace(/\[\[.*?\]\]/g, "");
		}
		if (config?.removeImageLinks) {
			cleanedContent = cleanedContent.replace(/!\[\[.*?\]\]/g, "");
		}
		if (config?.removeNormalLinks) {
			cleanedContent = cleanedContent.replace(/\[.*?\]\(.*?\)/g, "");
		}

		return cleanedContent;
	}

	/**
	 * 美化显示阅读时间
	 */
	private formatReadingTime(minutes: number): string {
		if (minutes < 1) {
			return t(
				"toolkit.readingProgress.estimatedReadingTime.formatReadingTime.lessThanOneMinute"
			);
		} else if (minutes < 60) {
			return t(
				"toolkit.readingProgress.estimatedReadingTime.formatReadingTime.lessThanOneHour",
				[Math.ceil(minutes)]
			);
		} else {
			const hours = Math.floor(minutes / 60);
			const remainingMinutes = Math.ceil(minutes % 60);
			return t(
				"toolkit.readingProgress.estimatedReadingTime.formatReadingTime.moreThanOneHour",
				[hours, remainingMinutes]
			);
		}
	}

	private applyStyles(
		element: HTMLElement,
		config: IReadingTimeConfig
	): void {
		element.addClass("rht-reading-time-card");

		if (config.style) {
			const styles: Record<string, string> = {};

			// 基础样式
			if (config.style.color) styles.color = config.style.color;
			if (config.style.backgroundColor)
				styles.backgroundColor = config.style.backgroundColor;
			if (config.style.borderRadius)
				styles.borderRadius = config.style.borderRadius;
			if (config.style.padding) styles.padding = config.style.padding;
			if (config.style.width) styles.width = config.style.width;
			if (config.style.maxWidth) styles.maxWidth = config.style.maxWidth;
			if (config.style.margin) styles.margin = config.style.margin;

			// 文字样式
			if (config.style.fontSize) styles.fontSize = config.style.fontSize;
			if (config.style.fontWeight)
				styles.fontWeight = config.style.fontWeight;

			// 视觉效果
			if (config.style.boxShadow)
				styles.boxShadow = config.style.boxShadow;
			if (config.style.border) styles.border = config.style.border;

			element.setCssStyles(styles);
		}
	}

	private formatContent(
		time: number,
		wordCounts: { chineseCount: number; englishCount: number },
		config: IReadingTimeConfig
	): DocumentFragment {
		const fragment = document.createDocumentFragment();

		// 创建内容容器，应用主题和动画
		const contentEl = fragment;

		// 渲染基本内容
		const textContainer = contentEl.createEl("div", {
			cls: "rht-reading-time-text-container",
		});

		// 添加图标
		if (config.showIcon) {
			const iconEl = textContainer.createEl("span", {
				cls: "rht-reading-time-icon",
			});
			iconEl.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
		}

		// 处理时间范围显示
		let timeDisplay = "";
		if (config.showRange) {
			const fastTime = this.formatReadingTime(time * 0.8); // 快速阅读时间
			const slowTime = this.formatReadingTime(time * 1.2); // 慢速阅读时间
			timeDisplay = `${fastTime} - ${slowTime}`;
		} else {
			timeDisplay = this.formatReadingTime(time);
		}

		const content = (
			config.template || this.DEFAULT_CONFIG.template!
		).replace("{{time}}", timeDisplay);

		textContainer.createEl("div", {
			cls: "rht-reading-time-text",
			text: content,
		});

		// 如果需要显示字数统计
		if (config.showWordCount) {
			const statsEl = contentEl.createEl("div", {
				cls: "rht-reading-time-stats",
			});
			const totalWords =
				wordCounts.chineseCount + wordCounts.englishCount;

			// 创建总字数统计
			statsEl.createEl("div", {
				cls: "rht-reading-time-stat-item",
				text: t(
					"toolkit.readingProgress.estimatedReadingTime.wordCount",
					[totalWords]
				),
			});

			// 创建中文字数统计
			if (wordCounts.chineseCount > 0) {
				statsEl.createEl("div", {
					cls: "rht-reading-time-stat-item",
					text: t(
						"toolkit.readingProgress.estimatedReadingTime.chineseCount",
						[wordCounts.chineseCount]
					),
				});
			}

			// 创建英文字数统计
			if (wordCounts.englishCount > 0) {
				statsEl.createEl("div", {
					cls: "rht-reading-time-stat-item",
					text: t(
						"toolkit.readingProgress.estimatedReadingTime.englishCount",
						[wordCounts.englishCount]
					),
				});
			}
		}
		return fragment;
	}
}
