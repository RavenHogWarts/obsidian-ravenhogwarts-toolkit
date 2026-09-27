import {
	computeCounts,
	matchesState,
	pickTargets,
	type IRowSignals,
} from "@src/toolkit/pluginFilter/service/filterCore";
import { FILTER_STATES } from "@src/toolkit/pluginFilter/types";

/** 行信号速记 */
function row(enabled: boolean, updatable = false): IRowSignals {
	return { enabled, updatable };
}

describe("matchesState — CSS :has() 规则的纯函数镜像", () => {
	it("all：恒可见（不过滤）", () => {
		expect(matchesState("all", row(true, true))).toBe(true);
		expect(matchesState("all", row(false, false))).toBe(true);
	});

	it("enabled：仅启用项可见", () => {
		expect(matchesState("enabled", row(true))).toBe(true);
		expect(matchesState("enabled", row(false))).toBe(false);
	});

	it("disabled：仅禁用项可见", () => {
		expect(matchesState("disabled", row(true))).toBe(false);
		expect(matchesState("disabled", row(false))).toBe(true);
	});

	it("updatable：仅可更新项可见，与启停正交（启用/禁用皆可命中）", () => {
		expect(matchesState("updatable", row(true, true))).toBe(true);
		expect(matchesState("updatable", row(false, true))).toBe(true);
		expect(matchesState("updatable", row(true, false))).toBe(false);
		expect(matchesState("updatable", row(false, false))).toBe(false);
	});
});

describe("computeCounts — 计数", () => {
	it("快照基准（test/pluginFilter/community-plugin.html）：82 项 / 7 启用 / 75 禁用 / 25 可更新", () => {
		// 7 启用 + 75 禁用；25 个可更新（含启用与禁用两种，正交维度）
		const rows = [
			...Array.from({ length: 5 }, () => row(true, true)),
			...Array.from({ length: 2 }, () => row(true, false)),
			...Array.from({ length: 20 }, () => row(false, true)),
			...Array.from({ length: 55 }, () => row(false, false)),
		];
		expect(computeCounts(rows)).toEqual({
			total: 82,
			enabled: 7,
			disabled: 75,
			updatable: 25,
		});
	});

	it("空列表全零", () => {
		expect(computeCounts([])).toEqual({
			total: 0,
			enabled: 0,
			disabled: 0,
			updatable: 0,
		});
	});

	it("计数互补：enabled + disabled === total；updatable 独立统计", () => {
		const rows = [row(true, true), row(false, false), row(true, false), row(true, true)];
		const counts = computeCounts(rows);
		expect(counts.enabled).toBe(3);
		expect(counts.disabled).toBe(1);
		expect(counts.enabled + counts.disabled).toBe(counts.total);
		expect(counts.updatable).toBe(2);
	});
});

describe("pickTargets — 批量启停目标（跳过已处于目标状态的项）", () => {
	const items = [
		{ id: "a", enabled: true },
		{ id: "b", enabled: false },
		{ id: "c", enabled: true },
		{ id: "d", enabled: false },
	];

	it("一键启用：只选当前禁用的", () => {
		expect(pickTargets(items, true)).toEqual(["b", "d"]);
	});

	it("一键禁用：只选当前启用的", () => {
		expect(pickTargets(items, false)).toEqual(["a", "c"]);
	});

	it("全部已处于目标状态 → 空目标", () => {
		const allEnabled = items.map((i) => ({ ...i, enabled: true }));
		expect(pickTargets(allEnabled, true)).toEqual([]);
	});

	it("空可见集 → 空目标", () => {
		expect(pickTargets([], true)).toEqual([]);
	});
});

describe("FILTER_STATES — 按钮渲染顺序契约", () => {
	it("固定为 全部 → 已启用 → 已禁用 → 可更新", () => {
		expect(FILTER_STATES).toEqual(["all", "enabled", "disabled", "updatable"]);
	});
});
