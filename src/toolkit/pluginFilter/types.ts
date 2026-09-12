import { IToolSettings } from "@src/model/toolkit/IToolSettings";

/** 筛选状态：全部 / 已启用 / 已禁用 */
export type PluginFilterState = "all" | "enabled" | "disabled";

/** 三态全集（按钮渲染顺序契约：全部 → 已启用 → 已禁用） */
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

export type ISettings = IToolSettings;

export const DefaultSettings: ISettings = {
	enabled: false,
	config: {},
};
