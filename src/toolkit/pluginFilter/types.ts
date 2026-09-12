import { IToolSettings } from "@src/model/toolkit/IToolSettings";

/** 筛选状态：全部 / 已启用 / 已禁用 */
export type PluginFilterState = "all" | "enabled" | "disabled";

/** 三态全集（菜单渲染顺序契约：全部 → 已启用 → 已禁用 → 分组） */
export const FILTER_STATES: readonly PluginFilterState[] = [
	"all",
	"enabled",
	"disabled",
];

/** 状态 → 挂在 `.setting-items` 上的过滤类（all 不过滤，无类） */
export const FILTER_STATE_CLASSES: Partial<Record<PluginFilterState, string>> =
	{
		enabled: "otk-pf-state-enabled",
		disabled: "otk-pf-state-disabled",
	};

/**
 * 筛选选择：内置三态，或某个插件分组（分组可出现在筛选菜单中）。
 * 分组过滤不走 CSS 状态类（成员是数据关系），由 JS 逐行显隐（见 index.ts）。
 */
export type FilterSelection =
	| { kind: "builtin"; state: PluginFilterState }
	| { kind: "group"; groupId: string };

/** 一个插件分组：同一插件可同时属于多个分组 */
export interface IPluginGroup {
	id: string;
	name: string;
	pluginIds: string[];
}

export interface ISettings extends IToolSettings {
	config: {
		/** 插件分组（成员可跨分组重叠） */
		groups: IPluginGroup[];
	};
}

export const DefaultSettings: ISettings = {
	enabled: false,
	config: {
		groups: [],
	},
};
