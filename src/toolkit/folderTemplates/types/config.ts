import {
	IToolkitModuleConfig,
	IToolkitModuleData,
} from "@src/core/interfaces/types";

export interface IFolderTemplatesConfig extends IToolkitModuleConfig {
	// 模板文件夹存放位置
	templatesFolderPath: string;
	// 忽略的文件夹列表，在这些文件夹中创建文件不会应用模板
	ignoredFolders: string[];
}

export interface IFolderTemplate {
	Folder: string;
	TemplateFile: string;
	FileNameRule?: string;
}

export interface IFolderTemplatesData extends IToolkitModuleData {
	templates: IFolderTemplate[];
}

export const FOLDER_TEMPLATES_DEFAULT_CONFIG: IFolderTemplatesConfig = {
	enabled: true,
	templatesFolderPath: "",
	ignoredFolders: [],
};
