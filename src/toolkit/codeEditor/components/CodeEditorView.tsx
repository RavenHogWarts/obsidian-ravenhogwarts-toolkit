// This code is adapted from https://github.com/sunxvming/obsidian-vscode-editor
// Original code licensed under MIT License

import {
	IconName,
	Modifier,
	Scope,
	TextFileView,
	TFile,
	WorkspaceLeaf,
} from "obsidian";
import * as monaco from "monaco-editor";
import { CODE_EDITOR_VIEW_TYPE, ICodeEditorConfig } from "../types/config";
import { Logger } from "@/src/core/services/Log";
import { MonacoLanguageService } from "../services/MonacoLanguageService";

export class CodeEditorView extends TextFileView {
	timer: NodeJS.Timeout | null;
	config: ICodeEditorConfig;
	logger: Logger;
	value = "";
	monacoEditor: monaco.editor.IStandaloneCodeEditor;
	editorScope: Scope;

	constructor(
		leaf: WorkspaceLeaf,
		config: ICodeEditorConfig,
		logger: Logger
	) {
		super(leaf);
		this.config = config;
		this.logger = logger;
		this.editorScope = new Scope();
	}

	/*
	execute order: onOpen -> onLoadFile -> setViewData -> onUnloadFile -> onClose
	*/
	async onOpen() {
		await super.onOpen();
		this.registerMonacoKeybindings();

		this.registerEvent(
			this.app.workspace.on("css-change", () => {
				if (this.config.theme === "auto") {
					const isDarkTheme =
						document.body.classList.contains("theme-dark");
					const theme = isDarkTheme ? "vs-dark" : "vs";
					monaco.editor.setTheme(theme);
				}
			})
		);
	}

	async onLoadFile(file: TFile) {
		const language = getLanguage(this.file?.extension ?? "");
		await MonacoLanguageService.loadLanguage(language);

		this.monacoEditor = monaco.editor.create(
			this.contentEl,
			getMonacoSettings(language, this.config)
		);

		this.monacoEditor.onDidChangeModelContent(() => {
			this.requestSave();
		});

		this.monacoEditor.onDidFocusEditorText(() => {
			this.app.keymap.pushScope(this.editorScope);
		});

		this.monacoEditor.onDidBlurEditorText(() => {
			this.app.keymap.popScope(this.editorScope);
		});

		await super.onLoadFile(file);
	}

	async onUnloadFile(file: TFile) {
		await super.onUnloadFile(file);
		this.monacoEditor.dispose();
	}

	async onClose() {
		await super.onClose();
	}

	onResize() {
		this.monacoEditor.layout();
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

	getViewData = () => {
		return this.monacoEditor.getValue();
	};

	setViewData = (data: string, clear: boolean) => {
		if (clear) {
			this.monacoEditor.getModel()?.setValue(data);
		} else {
			this.monacoEditor.setValue(data);
		}
	};

	clear = () => {
		this.monacoEditor.setValue("");
	};

	updateEditorConfig(newConfig: ICodeEditorConfig) {
		this.config = newConfig;
		if (this.monacoEditor) {
			// 更新 Monaco Editor 的设置
			this.monacoEditor.updateOptions(
				getMonacoSettings(
					getLanguage(this.file?.extension ?? ""),
					newConfig
				)
			);
		}
	}

	// 注册额外的快捷键
	private registerMonacoKeybindings() {
		const registerKeybinding = (
			modifiers: Modifier[],
			key: string,
			callback: () => void
		) => {
			this.editorScope.register(modifiers, key, () => {
				if (this.monacoEditor.hasTextFocus()) {
					callback();
					return false;
				}
				return true;
			});
		};

		// 撤销
		// registerKeybinding(["Mod"], "z", () => {
		// 	this.monacoEditor.trigger("keyboard", "undo", null);
		// });
	}
}

export function getMonacoSettings(language: string, config: ICodeEditorConfig) {
	return {
		language: language,
		theme: getMonacoTheme(config),
		lineNumbers: config.lineNumbers ? "on" : "off",
		minimap: { enabled: config.minimap },
		fontSize: config.fontSize,
		fontFamily: config.fontFamily,
		tabSize: config.tabSize,
		lineHeight: config.lineHeight,
		letterSpacing: config.letterSpacing,
		wordWrap: "wordWrapColumn", // 自动换行
		automaticLayout: true, // 自动调整布局大小
		renderLineHighlight: "all", // 当前行高亮
		fixedOverflowWidgets: true, // 固定溢出部件的位置
		cursorStyle: "line", // 光标样式
		cursorBlinking: "blink", // 光标闪烁
		roundedSelection: true, // 选中区域圆角
		renderWhitespace: "none", // 空格显示
		scrollbar: {
			// 滚动条设置
			vertical: "visible",
			horizontal: "visible",
			verticalScrollbarSize: 10,
			horizontalScrollbarSize: 10,
			alwaysConsumeMouseWheel: false,
		},
		bracketPairColorization: {
			// 括号匹配
			enabled: true,
		},
		folding: true, // 代码折叠
		smoothScrolling: true, // 滚动平滑
		links: true, // 链接可点击
		multiCursorPaste: "full", // 多光标粘贴模式
		dragAndDrop: true, // 拖放编辑
		quickSuggestions: {
			other: true,
			comments: true,
			strings: true,
		},
		suggestOnTriggerCharacters: true,
		acceptSuggestionOnEnter: "on",
		tabCompletion: "on",
		snippetSuggestions: "inline",
		wordBasedSuggestions: "currentDocument",
		parameterHints: {
			enabled: true,
		},
	} as monaco.editor.IStandaloneEditorConstructionOptions;
}

export function getMonacoTheme(config: ICodeEditorConfig) {
	const isDarkTheme = document.body.classList.contains("theme-dark");
	return config.theme === "auto"
		? isDarkTheme
			? "vs-dark"
			: "vs"
		: config.theme;
}

export function getLanguage(extension: string) {
	const aliasStart = "run-";
	if (extension.startsWith(aliasStart)) {
		extension = extension.slice(aliasStart.length);
	}

	switch (extension) {
		case "js":
		case "es6":
		case "jsx":
		case "cjs":
		case "mjs":
		case "javascript":
			return "javascript";
		case "ts":
		case "tsx":
		case "cts":
		case "mts":
		case "typescript":
			return "typescript";
		case "json":
			return "json";
		case "py":
		case "rpy":
		case "pyu":
		case "cpy":
		case "gyp":
		case "gypi":
		case "python":
		case "python2":
		case "python3":
			return "python";
		case "css":
			return "css";
		case "html":
		case "htm":
		case "shtml":
		case "xhtml":
		case "mdoc":
		case "jsp":
		case "asp":
		case "aspx":
		case "jshtm":
			return "html";
		case "cpp":
		case "c++":
		case "cc":
		case "cxx":
		case "hpp":
		case "hh":
		case "hxx":
			return "cpp";
		case "graphql":
		case "gql":
			return "graphql";
		case "java":
		case "jav":
			return "java";
		case "php":
		case "php4":
		case "php5":
		case "phtml":
		case "ctp":
			return "php";
		case "sql":
			return "sql";
		case "yaml":
		case "yml":
			return "yaml";
		case "bat":
		case "batch":
			return "bat";
		case "lua":
			return "lua";
		case "rb":
		case "rbx":
		case "rjs":
		case "gemspec":
			return "ruby";
		case "markdown":
		case "mdown":
		case "mkdn":
		case "mkd":
		case "mdwn":
		case "mdtxt":
		case "mdtext":
		case "mdx":
			return "markdown";
		case "r":
		case "rhistory":
		case "rmd":
		case "rprofile":
		case "rt":
			return "r";
		case "ftl":
		case "ftlh":
		case "ftlx":
			return "freemarker2";
		case "rst":
			return "restructuredtext";
		case "hcl":
		case "tf":
		case "tfvars":
			return "hcl";
		case "ini":
		case "properties":
		case "gitconfig":
			return "ini";
		case "pug":
		case "jade":
			return "pug";
		case "dart":
			return "dart";
		case "rs":
		case "rlib":
			return "rust";
		case "less":
			return "less";
		case "cls":
			return "apex";
		case "tcl":
			return "tcl";
		case "abap":
			return "abap";
		case "ecl":
			return "ecl";
		case "pla":
			return "pla";
		case "cmd":
			return "bat";
		case "vb":
			return "vb";
		case "sb":
			return "sb";
		case "m3":
		case "i3":
		case "mg":
		case "ig":
			return "m3";
		case "go":
		case "golang":
			return "go";
		case "s":
			return "mips";
		case "pl":
		case "pm":
			return "perl";
		case "wgsl":
			return "wgsl";
		case "twig":
			return "twig";
		case "scss":
			return "scss";
		case "redis":
			return "redis";
		case "sh":
		case "bash":
			return "shell";
		case "scala":
		case "sc":
		case "sbt":
			return "scala";
		case "jl":
			return "julia";
		case "dax":
		case "msdax":
			return "msdax";
		case "lex":
			return "lexon";
		case "cshtml":
			return "razor";
		case "bicep":
			return "bicep";
		case "azcli":
			return "azcli";
		case "swift":
		case "Swift":
			return "swift";
		case "flow":
			return "flow9";
		case "xml":
		case "xsd":
		case "dtd":
		case "ascx":
		case "csproj":
		case "config":
		case "props":
		case "targets":
		case "wxi":
		case "wxl":
		case "wxs":
		case "xaml":
		case "svgz":
		case "opf":
		case "xslt":
		case "xsl":
			return "xml";
		case "kt":
		case "kts":
			return "kotlin";
		case "cypher":
		case "cyp":
			return "cypher";
		case "coffee":
			return "coffeescript";
		case "fs":
		case "fsi":
		case "ml":
		case "mli":
		case "fsx":
		case "fsscript":
			return "fsharp";
		case "scm":
		case "ss":
		case "sch":
		case "rkt":
			return "scheme";
		case "rq":
			return "sparql";
		case "aes":
			return "aes";
		case "liquid":
		case "html.liquid":
			return "liquid";
		case "pas":
		case "p":
		case "pp":
			return "pascal";
		case "ex":
		case "exs":
			return "elixir";
		case "qs":
			return "qsharp";
		case "cs":
		case "csx":
		case "cake":
			return "csharp";
		case "clj":
		case "cljs":
		case "cljc":
		case "edn":
			return "clojure";
		case "mligo":
			return "cameligo";
		case "sol":
			return "sol";
		case "proto":
			return "proto";
		case "dats":
		case "sats":
		case "hats":
			return "postiats";
		case "ligo":
			return "pascaligo";
		case "dockerfile":
			return "dockerfile";
		case "handlebars":
		case "hbs":
			return "handlebars";
		case "pq":
		case "pqm":
			return "powerquery";
		case "m":
			return "objective-c";
		case "sv":
		case "svh":
			return "systemverilog";
		case "v":
		case "vh":
			return "verilog";
		case "st":
		case "iecst":
		case "iecplc":
		case "lc3lib":
			return "st";
		case "c":
		case "h":
			return "c";
		default:
			return "plaintext";
	}
}
