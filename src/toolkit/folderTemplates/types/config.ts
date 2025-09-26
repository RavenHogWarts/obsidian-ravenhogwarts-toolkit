import {
	IToolkitModuleConfig,
	IToolkitModuleData,
} from "@/src/core/interfaces/types";

export interface IFolderTemplatesConfig extends IToolkitModuleConfig {
	// 模板文件夹存放位置
	templatesFolderPath: string;
}

interface IFolderTemplate {
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
};
