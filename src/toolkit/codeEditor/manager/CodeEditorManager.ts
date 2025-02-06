import { IToolkitModule } from "@/src/core/interfaces/types";
import {
	CODE_EDITOR_DEFAULT_CONFIG,
	CODE_EDITOR_VIEW_TYPE,
	ICodeBlock,
	ICodeEditorConfig,
	ICodeEditorData,
} from "../types/config";
import { BaseManager } from "@/src/core/services/BaseManager";
import { Editor, EditorPosition, Menu, TFile, TFolder } from "obsidian";
import { CodeEditorView, getLanguage } from "../components/CodeEditorView";
import { MonacoWorkerService } from "../services/MonacoWorkerService";
import { BaseModal } from "@/src/components/base/Modal/BaseModal";

interface ICodeEditorModule extends IToolkitModule {
	config: ICodeEditorConfig;
	data: ICodeEditorData;
}

export class CodeEditorManager extends BaseManager<ICodeEditorModule> {
	protected getDefaultConfig(): ICodeEditorConfig {
		return CODE_EDITOR_DEFAULT_CONFIG;
	}

	protected async onModuleLoad(): Promise<void> {
		this.logger.info("Loading code editor manager");
		MonacoWorkerService.initialize(this.logger);

		this.plugin.registerView(CODE_EDITOR_VIEW_TYPE, (leaf) => {
			return new CodeEditorView(leaf, this.config, this.logger);
		});

		this.registerFileExtensions();
		this.registerEventHandlers();
		this.registerCommands();
	}

	protected onModuleUnload(): void {
		this.logger.info("Unloading code editor manager");

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
	}

	protected onModuleCleanup(): void {
		this.logger.info("Cleaning up code editor manager");
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
			if (lines[startLine].startsWith("```")) {
				break;
			}
			startLine--;
		}

		// 向下查找代码块结束
		let endLine = line;
		while (endLine < lines.length) {
			if (endLine > startLine && lines[endLine].startsWith("```")) {
				break;
			}
			endLine++;
		}

		// 如果找到完整的代码块
		if (startLine >= 0 && endLine < lines.length) {
			const blockLanguage = lines[startLine].slice(3).trim();
			const language = getLanguage(blockLanguage);
			const code = lines.slice(startLine + 1, endLine).join("\n");
			return {
				language,
				code,
				range: {
					start: startLine,
					end: endLine,
				},
			};
		}

		return null;
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
					this.updateCodeBlock(codeBlock.range, newCode),
			},
			"modal-size-large"
		).open();
	}

	private async updateCodeBlock(
		range: { start: number; end: number },
		newCode: string
	) {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) return;

		const content = editor.getValue();
		const lines = content.split("\n");
		const codeBlockHeader = lines[range.start];
		const codeBlockFooter = lines[range.end];

		const newContent = [
			...lines.slice(0, range.start),
			codeBlockHeader,
			newCode,
			codeBlockFooter,
			...lines.slice(range.end + 1),
		].join("\n");

		editor.setValue(newContent);
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
