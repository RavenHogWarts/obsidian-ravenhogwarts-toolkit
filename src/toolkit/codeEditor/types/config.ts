import {
	IToolkitModuleConfig,
	IToolkitModuleData,
} from "@/src/core/interfaces/types";

export interface ICodeEditorConfig extends IToolkitModuleConfig {
	supportExtensions: string[]; // 支持的文件扩展名
	theme: "auto" | "vs" | "vs-dark" | "hc-light" | "hc-black";
	lineNumbers: boolean;
	minimap: boolean;
	fontSize: number;
	fontFamily: string;
	tabSize: number;
	lineHeight: number;
	letterSpacing: number;
}

export interface ICodeEditorData extends IToolkitModuleData {}

export const CODE_EDITOR_DEFAULT_CONFIG: ICodeEditorConfig = {
	supportExtensions: ["js"],
	enabled: true,
	theme: "auto",
	lineNumbers: true,
	minimap: true,
	fontSize: 14,
	fontFamily: "Consolas, 'Courier New', monospace",
	tabSize: 4,
	lineHeight: 1.5,
	letterSpacing: 0,
};

export const CODE_EDITOR_VIEW_TYPE = "rht-code-editor";
