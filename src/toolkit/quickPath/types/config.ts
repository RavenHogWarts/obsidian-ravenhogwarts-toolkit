import {
	IToolkitModuleConfig,
	IToolkitModuleData,
} from "@/src/core/interfaces/types";

export interface IQuickPathConfig extends IToolkitModuleConfig {
	// 是否使用绝对路径
	useAbsolutePath: boolean;
	// 多文件路径分隔符
	pathSeparator: string;
	// 是否添加到编辑器菜单
	addEditorMenu: boolean;
	// 是否添加到文件菜单
	addFileMenu: boolean;
}

export interface IQuickPathData extends IToolkitModuleData {}

export const QUICK_PATH_DEFAULT_CONFIG: IQuickPathConfig = {
	enabled: true,
	useAbsolutePath: false,
	pathSeparator: "\n",
	addEditorMenu: true,
	addFileMenu: true,
};
