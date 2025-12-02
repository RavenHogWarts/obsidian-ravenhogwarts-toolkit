import { IToolSettings } from "@src/model/toolkit/IToolSettings";

export interface ISettings extends IToolSettings {
	config: {
		addEditorMenu: boolean;
		addFileMenu: boolean;
		useAbsolutePath: boolean;
		pathSeparator: string;
	};
}

export const DefaultSettings: ISettings = {
	enabled: false,
	config: {
		addEditorMenu: true,
		addFileMenu: true,
		useAbsolutePath: false,
		pathSeparator: "\n",
	},
};
