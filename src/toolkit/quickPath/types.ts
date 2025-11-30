import { IToolSettings } from "@src/model/toolkit/IToolSettings";

export interface IQuickPathSettings extends IToolSettings {
	config: {
		addEditorMenu: boolean;
		addFileMenu: boolean;
		useAbsolutePath: boolean;
		pathSeparator: string;
	};
}

export const QuickPathDefaultSettings: IQuickPathSettings = {
	enabled: false,
	config: {
		addEditorMenu: true,
		addFileMenu: true,
		useAbsolutePath: false,
		pathSeparator: "\n",
	},
};
