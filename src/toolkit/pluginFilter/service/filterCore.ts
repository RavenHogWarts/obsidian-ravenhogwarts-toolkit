import type { PluginFilterState } from "../types";

export interface IFilterCounts {
	total: number;
	enabled: number;
	disabled: number;
}

/**
 * 列表项在指定筛选态下是否可见。
 *
 * 运行时过滤由 CSS `:has()` 规则完成（见 settings/pluginFilter.css），本函数是
 * 该规则的纯函数镜像：单测钉住语义，防止 CSS 与状态机漂移；若 CSS 方案被证实
 * 不可用（§plugin-filter-design §10.3 JS inline style 备选），它就是现成的实现。
 */
export function matchesState(
	state: PluginFilterState,
	enabled: boolean,
): boolean {
	if (state === "all") return true;
	return state === "enabled" ? enabled : !enabled;
}

/** 统计计数，用于菜单项与按钮 tooltip（如「全部 (82)」） */
export function computeCounts(enabledFlags: readonly boolean[]): IFilterCounts {
	let enabled = 0;
	for (const flag of enabledFlags) {
		if (flag) enabled++;
	}
	return { total: enabledFlags.length, enabled, disabled: enabledFlags.length - enabled };
}

/** 批量操作可见插件的最小形状 */
export interface IPluginToggleItem {
	id: string;
	enabled: boolean;
}

/**
 * 批量启停目标：可见插件中**未处于目标状态**的项（一键启用选禁用中的，
 * 一键禁用选启用中的）；已处于目标状态的原样跳过，不重复调用 API。
 */
export function pickTargets(
	items: readonly IPluginToggleItem[],
	enable: boolean,
): string[] {
	return items
		.filter((item) => item.enabled !== enable)
		.map((item) => item.id);
}
