import * as ace from "ace-builds";
// 导入扩展
import "./AceExtensions";
// 导入语言包
import "./AceLanguages";
// 导入主题
import "./AceThemes";
// 导入键盘绑定
import "ace-builds/src-noconflict/keybinding-emacs";
import "ace-builds/src-noconflict/keybinding-sublime";
import "ace-builds/src-noconflict/keybinding-vim";
import "ace-builds/src-noconflict/keybinding-vscode";

import { Logger } from "@/src/core/services/Log";
import { ICodeEditorConfig } from "../types/config";
import { getLanguageMode, workerBaseUrl } from "./AceLanguages";
import { getAceTheme } from "./AceThemes";

export class AceService {
	private editor: ace.Ace.Editor | null = null;
	private workerUrls: Set<string> = new Set();

	constructor(private logger: Logger) {
		// 设置基础路径
		ace.config.set("basePath", workerBaseUrl);
	}

	isEditorInitialized(): boolean {
		return this.editor !== null;
	}

	createEditor(element: HTMLElement): ace.Ace.Editor {
		this.editor = ace.edit(element);
		return this.editor;
	}

	async configureEditor(config: ICodeEditorConfig, fileExtension: string) {
		if (!this.editor) return;

		const languageMode = await this.getLanguageMode(fileExtension);
		const settings = this.getEditorSettings(languageMode, config);

		this.editor.setOptions(settings);
		this.editor.session.setMode(`ace/mode/${languageMode}`);
		this.editor.setKeyboardHandler(`ace/keyboard/${config.keyboard}`);

		this.updateTheme(config.lightTheme, config.darkTheme);
	}

	async updateTheme(lightTheme: string, darkTheme: string) {
		if (!this.editor) return;
		const themeName = document.body.classList.contains("theme-dark")
			? darkTheme
			: lightTheme;

		const theme = await getAceTheme(themeName);

		this.editor.setTheme(`ace/theme/${theme}`);
	}

	getValue(): string {
		return this.editor?.getValue() ?? "";
	}

	setValue(content: string, cursorPos?: number) {
		if (!this.editor) return;

		if (cursorPos !== undefined) {
			const currentPos = this.editor.getCursorPosition();
			this.editor.setValue(content, cursorPos);
			if (cursorPos === -1) {
				this.editor.moveCursorToPosition(currentPos);
				this.editor.clearSelection();
			}
		} else {
			this.editor.setValue(content);
		}
	}

	resize() {
		this.editor?.resize();
	}

	hasFocus(): boolean {
		return this.editor?.isFocused() ?? false;
	}

	setKeyboardHandler(handler: string): void {
		if (!this.editor) return;
		this.editor.setKeyboardHandler(handler);
	}

	destroy() {
		if (this.editor) {
			this.workerUrls.forEach((url) => {
				try {
					URL.revokeObjectURL(url);
				} catch (e) {
					this.logger.error("Failed to revoke worker URL", e);
				}
			});
			this.workerUrls.clear();

			this.editor.destroy();
			this.editor = null;
		}
	}

	private async getLanguageMode(extension: string): Promise<string> {
		const aliasStart = "run-";
		if (extension.startsWith(aliasStart)) {
			extension = extension.slice(aliasStart.length);
		}

		return await getLanguageMode(extension);
	}

	private getEditorSettings(languageMode: string, config: ICodeEditorConfig) {
		return {
			// -- editor选项 --
			// 选中样式 selectionStyle: text [line|text]
			// 高亮当前行 highlightActiveLine: true
			// 高亮选中文本 highlightSelectedWord: true
			// 是否只读 readOnly: false
			// 光标样式 cursorStyle: ace [ace|slim|smooth|wide]
			// 合并撤销 mergeUndoDeltas: false [always]
			// 启用行为 behavioursEnabled: true
			// 启用换行 wrapBehavioursEnabled: true
			// 启用滚动 autoScrollEditorIntoView: false
			// 复制空格 copyWithEmptySelection: true
			// 软标签跳转 navigateWithinSoftTabs: false
			// 选中多处 enableMultiselect: false

			// -- renderer选项 --
			// 纵向滚动条始终可见 hScrollBarAlwaysVisible: false
			// 横向滚动条始终可见 vScrollBarAlwaysVisible: false
			// 高亮边线 highlightGutterLine: true
			// 滚动动画 animatedScroll: false
			// 显示不可见字符 showInvisibles: false
			// 显示打印边距 showPrintMargin: true
			// 设置页边距 printMarginColumn: 80
			// 显示并设置页边距 printMargin: false
			// 淡入折叠部件 fadeFoldWidgets: false
			// 显示折叠部件 showFoldWidgets: true
			// 显示行号
			showLineNumbers: config.lineNumbers,
			// 显示行号区域 showGutter: true
			// 显示参考线 displayIndentGuides: true
			// 设置字号
			fontSize: config.fontSize,
			// 设置字体
			fontFamily: config.fontFamily,
			// 至多行数 maxLines
			// 至少行数 minLines
			// 滚动位置 scrollPastEnd: 0
			// 固定行号区域宽度 fixedWidthGutter: false
			// 主题引用路径 theme

			// -- mouseHandler选项 --
			// 滚动速度 scrollSpeed
			// 拖拽延时 dragDelay
			// 是否启用拖动 dragEnabled: true
			// 聚焦超时 focusTimout
			// 鼠标提示 tooltipFollowsMouse: false

			// -- session选项 --
			// 起始行号 firstLineNumber: 1,
			// 重做 overwrite
			// 新开行模式 newLineMode: auto [auto|unix|windows]
			// 	使用辅助对象
			useWorker: false,
			// 使用软标签 useSoftTabs
			// 标签大小
			tabSize: config.tabSize,
			// 换行 wrap
			// 折叠样式 foldStyle [markbegin|markbeginend|manual]
			// 代码匹配模式
			mode: `ace/mode/${languageMode}`,

			// -- 扩展选项 --
			// 启用基本自动完成
			enableBasicAutocompletion: true,
			// 启用实时自动完成
			enableLiveAutocompletion: true,
			// 启用代码段
			enableSnippets: true,
			// 启用Emmet enableEmmet
			// 使用弹性制表位 useElasticTabstops
		};
	}
}
