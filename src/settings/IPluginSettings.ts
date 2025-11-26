import { IToolSettings } from "@src/model/toolkit/IToolSettings";

export interface IPluginSettings {
	toolkit: Record<string, IToolSettings>;
}

export const DEFAULT_SETTINGS: IPluginSettings = {
	toolkit: {},
};
