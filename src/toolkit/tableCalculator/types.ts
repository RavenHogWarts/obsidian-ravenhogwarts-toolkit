import { IToolSettings } from "@src/model/toolkit/IToolSettings";

export interface ISettings extends IToolSettings {
	config: {};
	data: ITableCalculate[];
}

export interface ITableCalculate {
	[tableId: string]: string[];
}

export const DefaultSettings: ISettings = {
	enabled: false,
	config: {},
	data: [],
};
