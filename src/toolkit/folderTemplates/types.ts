import { IToolSettings } from "@src/model/toolkit/IToolSettings";

export interface ISettings extends IToolSettings {
	config: {
		templatesFolderPath: string;
		ignoredFolders: string[];
	};
	data: {
		folderTemplates: IFolderTemplate[];
	};
}

export interface IFolderTemplate {
	folder: string;
	templateFile: string;
	fileNameRule?: string;
}

export const DefaultSettings: ISettings = {
	enabled: false,
	config: {
		templatesFolderPath: "templates",
		ignoredFolders: [],
	},
	data: {
		folderTemplates: [],
	},
};
