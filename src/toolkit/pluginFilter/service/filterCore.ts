import type { PluginFilterState } from "../types";

/** 插件行的两个显隐信号：启停（开关 is-enabled 类）+ 可更新（控制区有更新按钮） */
export interface IRowSignals {
	enabled: boolean;
	updatable: boolean;
}

export interface IFilterCounts {
	total: number;
	enabled: number;
	disabled: number;
	updatable: number;
}

/**
 * 列表项在指定筛选态下是否可见。
 *
 * 运行时过滤由 CSS `:has()` 规则完成（见 settings/pluginFilter.css），本函数是
 * 该规则的纯函数镜像：单测钉住语义，防止 CSS 与状态机漂移；若 CSS 方案被证实
 * 不可用（§plugin-filter-design §10.3 JS inline style 备选），它就是现成的实现。
 * 「可更新」与启停是正交维度：只看更新按钮，不看开关。
 */
export function matchesState(
	state: PluginFilterState,
	row: IRowSignals,
): boolean {
	if (state === "all") return true;
	if (state === "enabled") return row.enabled;
	if (state === "disabled") return !row.enabled;
	return row.updatable;
}

/** 统计计数，用于菜单项与按钮 tooltip（如「全部 (82)」「可更新 (25)」） */
export function computeCounts(rows: readonly IRowSignals[]): IFilterCounts {
	let enabled = 0;
	let updatable = 0;
	for (const row of rows) {
		if (row.enabled) enabled++;
		if (row.updatable) updatable++;
	}
	return {
		total: rows.length,
		enabled,
		disabled: rows.length - enabled,
		updatable,
	};
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
