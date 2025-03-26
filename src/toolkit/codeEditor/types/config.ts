import {
	IToolkitModuleConfig,
	IToolkitModuleData,
} from "@/src/core/interfaces/types";
import {
	AceDarkThemes,
	AceKeyboard,
	AceLightThemes,
} from "../services/AceThemes";

export interface ICodeEditorConfig extends IToolkitModuleConfig {
	supportExtensions: string[]; // 支持的文件扩展名
	lightTheme: AceLightThemes;
	darkTheme: AceDarkThemes;
	keyboard: AceKeyboard;
	lineNumbers: boolean;
	fontSize: number;
	fontFamily: string;
	tabSize: number;
	snippetsManager: {
		location: "Null" | "Ribbon";
		icon: string;
	};
}

export interface ICodeEditorData extends IToolkitModuleData {}

export const CODE_EDITOR_DEFAULT_CONFIG: ICodeEditorConfig = {
	supportExtensions: ["js"],
	enabled: true,
	lightTheme: "chrome",
	darkTheme: "monokai",
	keyboard: "vscode",
	lineNumbers: true,
	fontSize: 14,
	fontFamily: "Consolas, 'Courier New', monospace",
	tabSize: 4,
	snippetsManager: {
		location: "Null",
		icon: "code",
	},
};

export const CODE_EDITOR_VIEW_TYPE = "rht-code-editor";

export interface ICodeBlock {
	language: string;
	code: string;
	range: { start: number; end: number };
	context?: {
		isInCallout: boolean;
		calloutType?: string;
		calloutStartLine?: number;
	};
	indent?: number;
}
