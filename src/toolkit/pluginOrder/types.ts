import { IToolSettings } from "@src/model/toolkit/IToolSettings";

/** 已安装插件缓存条目（来自 `${configDir}/plugins/<id>/manifest.json`，无论是否启用） */
export interface IInstalledPluginEntry {
	id: string;
	name: string;
	version: string;
}

export interface ISettings extends IToolSettings {
	config: {
		/**
		 * 优先加载的插件 id 列表（有序，自上而下依次提到数组最前）。
		 * React 岛编辑：界面按缓存以 name 呈现，存储只存 id。
		 */
		priorityPlugins: string[];
	};
	data: {
		/** 已安装插件缓存（含未启用），每次 enforce 时刷新 */
		installedPlugins: IInstalledPluginEntry[];
		/** 缓存生成时间（毫秒时间戳），仅供展示/诊断 */
		installedPluginsCachedAt: number;
	};
}

export const DefaultSettings: ISettings = {
	enabled: false,
	config: {
		priorityPlugins: [],
	},
	data: {
		installedPlugins: [],
		installedPluginsCachedAt: 0,
	},
};
