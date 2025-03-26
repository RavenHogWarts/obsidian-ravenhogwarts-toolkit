import {
	IconName,
	Modifier,
	Scope,
	TextFileView,
	TFile,
	WorkspaceLeaf,
} from "obsidian";
import { CODE_EDITOR_VIEW_TYPE, ICodeEditorConfig } from "../types/config";
import { Logger } from "@/src/core/services/Log";
import { AceService } from "../services/AceService";

export class CodeEditorView extends TextFileView {
	private aceService: AceService;
	editorScope: Scope;
	editorElement: HTMLElement;

	constructor(
		leaf: WorkspaceLeaf,
		private config: ICodeEditorConfig,
		private logger: Logger
	) {
		super(leaf);
		this.aceService = new AceService(logger);
		this.editorScope = new Scope();
	}

	/*
	execute order: onOpen -> onLoadFile -> setViewData -> onUnloadFile -> onClose
	*/
	async onOpen() {
		await super.onOpen();
		this.editorElement = this.contentEl;

		this.registerEvent(
			this.app.workspace.on("css-change", () => {
				this.aceService.updateTheme(
					this.config.lightTheme,
					this.config.darkTheme
				);
			})
		);

		this.registerAceKeybindings();

		this.registerDomEvent(
			this.editorElement,
			"focus",
			() => {
				this.app.keymap.pushScope(this.editorScope);
			},
			true
		);

		this.registerDomEvent(
			this.editorElement,
			"blur",
			() => {
				this.app.keymap.popScope(this.editorScope);
			},
			true
		);
	}

	async onLoadFile(file: TFile) {
		this.aceService.createEditor(this.editorElement);
		this.aceService.configureEditor(this.config, file?.extension ?? "");

		await super.onLoadFile(file);
	}

	async onUnloadFile(file: TFile) {
		await super.onUnloadFile(file);
		this.aceService.destroy();
	}

	async onClose() {
		await super.onClose();
	}

	onResize() {
		this.aceService.resize();
	}

	getViewType(): string {
		return CODE_EDITOR_VIEW_TYPE;
	}

	getContext(file?: TFile) {
		return file?.path ?? this.file?.path;
	}

	getIcon(): IconName {
		return "code-xml";
	}

	getViewData(): string {
		return this.aceService.getValue();
	}

	setViewData(data: string, clear: boolean) {
		this.aceService.setValue(data, clear ? 1 : -1);
	}

	clear() {
		this.aceService.setValue("");
	}

	updateEditorConfig(newConfig: ICodeEditorConfig) {
		this.config = newConfig;
		this.aceService.configureEditor(
			this.config,
			this.file?.extension ?? ""
		);
	}

	private registerAceKeybindings() {
		// 设置键盘处理程序
		if (this.config.keyboard) {
			this.aceService.setKeyboardHandler(
				`ace/keyboard/${this.config.keyboard}`
			);
		}

		// 注册特定的快捷键到 Obsidian 的 Scope 系统
		const registerKeybinding = (
			modifiers: Modifier[],
			key: string,
			callback: () => boolean | void
		) => {
			this.editorScope.register(modifiers, key, (evt: KeyboardEvent) => {
				if (this.aceService.hasFocus()) {
					const result = callback();
					return result === undefined ? false : result;
				}
				return true;
			});
		};

		// 根据当前键盘模式可能需要添加更多快捷键
		if (this.config.keyboard === "vim") {
			// Vim 模式特定的快捷键
		} else if (this.config.keyboard === "emacs") {
			// Emacs 模式特定的快捷键
		}
	}
}
