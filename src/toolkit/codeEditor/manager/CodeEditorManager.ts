import { IToolkitModule } from "@/src/core/interfaces/types";
import {
	CODE_EDITOR_DEFAULT_CONFIG,
	CODE_EDITOR_VIEW_TYPE,
	ICodeBlock,
	ICodeEditorConfig,
	ICodeEditorData,
} from "../types/config";
import { BaseManager } from "@/src/core/services/BaseManager";
import {
	Editor,
	EditorPosition,
	MarkdownPostProcessor,
	MarkdownView,
	Menu,
	setIcon,
	TFile,
	TFolder,
} from "obsidian";
import { CodeEditorView, getLanguage } from "../components/CodeEditorView";
import { MonacoWorkerService } from "../services/MonacoWorkerService";
import { BaseModal } from "@/src/components/base/Modal/BaseModal";

interface ICodeEditorModule extends IToolkitModule {
	config: ICodeEditorConfig;
	data: ICodeEditorData;
}

export class CodeEditorManager extends BaseManager<ICodeEditorModule> {
	private markdownPostProcessor: MarkdownPostProcessor | null = null;

	protected getDefaultConfig(): ICodeEditorConfig {
		return CODE_EDITOR_DEFAULT_CONFIG;
	}

	protected async onModuleLoad(): Promise<void> {
		this.logger.info("Loading code editor manager");
		MonacoWorkerService.initialize(this.logger);

		try {
			this.plugin.registerView(CODE_EDITOR_VIEW_TYPE, (leaf) => {
				return new CodeEditorView(leaf, this.config, this.logger);
			});
			this.registerFileExtensions();
		} catch (e) {
			this.logger.debug("Failed to register code editor view", e);
			return;
		}

		this.registerEventHandlers();
		this.registerCommands();
		this.registerMarkdownPostProcessor();

		this.plugin.registerHoverLinkSource(CODE_EDITOR_VIEW_TYPE, {
			display: CODE_EDITOR_VIEW_TYPE,
			defaultMod: true,
		});
	}

	protected onModuleUnload(): void {
		this.logger.info("Unloading code editor manager");
	}

	protected onModuleCleanup(): void {
		this.logger.info("Cleaning up code editor manager");
		MonacoWorkerService.dispose();

		const leaves = this.app.workspace.getLeavesOfType(
			CODE_EDITOR_VIEW_TYPE
		);
		const states = leaves.map((leaf) => ({
			state: leaf.getViewState(),
			eState: leaf.getEphemeralState(),
		}));
		this.data.savedStates = states;
		leaves.forEach((leaf) => {
			if (leaf.view instanceof CodeEditorView) {
				leaf.view.onunload();
			}
		});

		this.app.workspace.detachLeavesOfType(CODE_EDITOR_VIEW_TYPE);
		// @ts-ignore
		this.app.viewRegistry.unregisterView(CODE_EDITOR_VIEW_TYPE);

		this.unregisterMarkdownPostProcessor();
	}

	private registerFileExtensions(): void {
		const supportedExtensions = this.config.supportExtensions;

		this.plugin.registerExtensions(
			supportedExtensions,
			CODE_EDITOR_VIEW_TYPE
		);
	}

	private registerCommands(): void {
		this.addCommand({
			id: "createCodeFile",
			name: this.t("toolkit.codeEditor.command.createCodeFile"),
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				const folderPath = activeFile?.parent?.path || "";
				await this.createCodeFile(folderPath);
			},
		});
	}

	private registerMarkdownPostProcessor(): void {
		// 为所有代码块注册处理器
		this.markdownPostProcessor = this.plugin.registerMarkdownPostProcessor(
			(el, ctx) => {
				// 只处理代码块元素
				const preElements = el.querySelectorAll("pre > code");
				if (!preElements.length) return;

				preElements.forEach((codeEl) => {
					const pre = codeEl.parentElement;
					if (!pre) return;

					const buttonContainer = pre.createDiv({
						cls: "rht-code-block-buttons",
					});
					const editButton = buttonContainer.createEl("button", {
						cls: "rht-edit-code-button",
					});
					setIcon(editButton, "edit");

					const language = getLanguage(
						codeEl.className.replace("language-", "") || ""
					);
					const source = codeEl.textContent || "";

					// 绑定编辑按钮点击事件
					editButton.addEventListener("click", (e) => {
						e.stopPropagation();
						const sectionInfo = ctx.getSectionInfo(el);
						const codeBlock: ICodeBlock = {
							language,
							code: source,
							range: {
								start: sectionInfo?.lineStart || 0,
								end: sectionInfo?.lineEnd || 0,
							},
						};
						this.openCodeBlockEditor(codeBlock);
					});

					// 将复制按钮移动到按钮容器中
					const copyButton = pre.querySelector(".copy-code-button");
					if (copyButton) {
						copyButton.detach();
						buttonContainer.appendChild(copyButton);
					}
				});
			}
		);
	}

	private unregisterMarkdownPostProcessor(): void {
		if (!this.markdownPostProcessor) return;

		this.markdownPostProcessor = null;
		document
			.querySelectorAll(".rht-code-block-buttons")
			.forEach((buttonContainer) => {
				const pre = buttonContainer.closest("pre");
				if (pre) {
					// 将复制按钮移回原位置
					const copyButton =
						buttonContainer.querySelector(".copy-code-button");
					if (copyButton) {
						copyButton.detach();
						pre.appendChild(copyButton);
					}

					// 移除编辑按钮和按钮容器
					buttonContainer.remove();
				}
			});
	}

	protected registerEventHandlers(): void {
		if (!this.isEnabled()) return;

		this.registerEvent(
			this.app.workspace.on("file-menu", this.handleFileMenu.bind(this))
		);

		this.registerEvent(
			this.app.workspace.on(
				"editor-menu",
				this.handleEditorMenu.bind(this)
			)
		);
	}

	private handleFileMenu(menu: Menu, file: TFile | TFolder): void {
		if (!this.isEnabled()) return;

		if (file instanceof TFolder) {
			this.addMenuItem(menu, {
				title: this.t("toolkit.codeEditor.file_menu.createCodeFile"),
				icon: "code-xml",
				callback: () => {
					this.createCodeFile(file.path);
				},
			});
		}

		if (file instanceof TFile) {
			this.addMenuItem(menu, [
				{
					title: this.t(
						"toolkit.codeEditor.file_menu.createCodeFile"
					),
					icon: "code-xml",
					callback: () => {
						this.createCodeFile(file.parent?.path || "");
					},
				},
				{
					title: this.t(
						"toolkit.codeEditor.file_menu.openInCodeEditor"
					),
					icon: "code-xml",
					callback: async () => {
						await this.openInCodeEditor(file.path, true);
					},
				},
			]);
		}
	}

	async openInCodeEditor(
		filePath: string,
		newTab: boolean = false
	): Promise<void> {
		const leaf = this.app.workspace.getLeaf(newTab);
		await leaf.setViewState({
			type: CODE_EDITOR_VIEW_TYPE,
			state: { file: filePath },
		});
		this.app.workspace.setActiveLeaf(leaf);
	}

	async createCodeFile(folderPath: string): Promise<void> {
		new BaseModal(
			this.app,
			this.plugin,
			() => import("../components/Modal/CreateCodeFileModal"),
			{
				folderPath,
				logger: this.logger,
				openInCodeEditor: (path: string, newTab: boolean) =>
					this.openInCodeEditor(path, newTab),
			},
			"modal-size-small"
		).open();
	}

	private handleEditorMenu(menu: Menu, editor: Editor): void {
		if (!this.isEnabled()) return;

		this.addMenuItem(menu, {
			title: this.t("toolkit.codeEditor.editor_menu.editCodeBlock"),
			icon: "code-xml",
			callback: () => {
				const cursor = editor.getCursor();
				const codeBlock = this.getCodeBlockAtCursor(editor, cursor);
				if (codeBlock) {
					this.openCodeBlockEditor(codeBlock);
				} else {
					this.logger.notice(
						this.t("toolkit.codeEditor.notice.no_code_block")
					);
				}
			},
		});
	}

	private getCodeBlockAtCursor(
		editor: Editor,
		cursor: EditorPosition
	): ICodeBlock | null {
		const line = cursor.line;
		const content = editor.getValue();
		const lines = content.split("\n");

		// 向上查找代码块开始
		let startLine = line;
		while (startLine >= 0) {
			const currentLine = lines[startLine].trim(); // 移除前导空格
			const withoutQuote = currentLine.replace(/^>\s*/, ""); // 移除引用标记
			if (withoutQuote.startsWith("```")) {
				break;
			}
			startLine--;
		}

		// 如果没找到开始标记，返回 null
		if (startLine < 0) return null;

		// 向下查找代码块结束
		let endLine = line;
		while (endLine < lines.length) {
			const currentLine = lines[endLine].trim();
			const withoutQuote = currentLine.replace(/^>\s*/, "");
			if (endLine > startLine && withoutQuote.startsWith("```")) {
				break;
			}
			endLine++;
		}

		// 如果找到完整的代码块
		if (startLine >= 0 && endLine < lines.length) {
			// 获取代码块的起始行，并处理引用和缩进
			const startLineContent = lines[startLine]
				.trim()
				.replace(/^>\s*/, "");
			const blockLanguage = startLineContent.slice(3).trim();
			const language = getLanguage(blockLanguage);

			// 提取代码内容
			const codeLines = lines
				.slice(startLine + 1, endLine)
				.map((line) => {
					// 移除引用标记和保持相对缩进
					return line.replace(/^>\s*/, "");
				});

			// 计算最小缩进量
			const minIndent =
				codeLines
					.filter((line) => line.trim().length > 0)
					.reduce((min, line) => {
						const indent = line.match(/^\s*/)?.[0].length || 0;
						return Math.min(min, indent);
					}, Infinity) || 0;

			// 移除共同的缩进，但保留相对缩进
			const code = codeLines
				.map((line) => {
					if (line.trim().length === 0) return line.trim();
					return line.slice(minIndent);
				})
				.join("\n");

			// 获取原始行的缩进和引用标记
			const originalIndent =
				lines[startLine].match(/^\s*/)?.[0].length || 0;
			const context = this.getCodeBlockContext(lines, startLine);

			return {
				language,
				code,
				range: {
					start: startLine,
					end: endLine,
				},
				context,
				indent: originalIndent,
			};
		}

		return null;
	}

	// 获取代码块的上下文信息（例如是否在 callout 中）
	private getCodeBlockContext(
		lines: string[],
		startLine: number
	): {
		isInCallout: boolean;
		calloutType?: string;
		calloutStartLine?: number;
	} {
		let currentLine = startLine;
		let isInCallout = false;
		let calloutType: string | undefined;
		let calloutStartLine: number | undefined;

		// 向上查找 callout 标记
		while (currentLine >= 0) {
			const line = lines[currentLine].trim();
			const calloutMatch = line.match(/^>\s*\[!(\w+)\]/);

			if (calloutMatch) {
				isInCallout = true;
				calloutType = calloutMatch[1];
				calloutStartLine = currentLine;
				break;
			}

			// 如果遇到非引用行，且不是空行，则中断搜索
			if (!line.startsWith(">") && line.length > 0) {
				break;
			}

			currentLine--;
		}

		return {
			isInCallout,
			calloutType,
			calloutStartLine,
		};
	}

	async openCodeBlockEditor(codeBlock: ICodeBlock): Promise<void> {
		new BaseModal(
			this.app,
			this.plugin,
			() => import("../components/Modal/EditCodeBlockModal"),
			{
				codeBlock,
				logger: this.logger,
				config: this.config,
				onSave: (newCode: string) =>
					this.updateCodeBlock(
						codeBlock.range,
						newCode,
						codeBlock.indent
					),
			},
			"modal-size-large"
		).open();
	}

	private async updateCodeBlock(
		range: { start: number; end: number },
		newCode: string,
		indent: number = 0
	): Promise<void> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) return;

		const file = activeView.file;
		if (!file) return;

		const content = await this.app.vault.read(file);
		const lines = content.split("\n");
		const originalStartLine = lines[range.start];
		const originalEndLine = lines[range.end];

		// 提取原始缩进和引用格式
		const indentMatch = originalStartLine.match(/^(\s*)/);
		const originalIndent = indentMatch ? indentMatch[1] : "";
		const isInQuote = originalStartLine.trimStart().startsWith(">");
		const quoteMatch = isInQuote
			? originalStartLine.match(/^[\s>]+\s*/)
			: null;
		const quotePrefix = quoteMatch ? quoteMatch[0] : originalIndent;

		// 保持原有的缩进和引用格式
		const newLines = newCode.split("\n").map((line) => {
			return line.length > 0 ? quotePrefix + line : line;
		});

		// 构建新内容
		const newContent = [
			...lines.slice(0, range.start),
			originalStartLine, // 保持原有的开始行
			...newLines,
			originalEndLine, // 保持原有的结束行
			...lines.slice(range.end + 1),
		].join("\n");

		// 保存文件
		await this.app.vault.modify(file, newContent);
	}

	protected onConfigChange(): void {
		this.logger.debug(
			"Code editor config changed, updating all editor instances"
		);

		// 更新所有打开的编辑器实例
		const leaves = this.app.workspace.getLeavesOfType(
			CODE_EDITOR_VIEW_TYPE
		);
		leaves.forEach((leaf) => {
			const view = leaf.view;
			if (view instanceof CodeEditorView) {
				view.updateEditorConfig(this.config);
			}
		});
	}
}
