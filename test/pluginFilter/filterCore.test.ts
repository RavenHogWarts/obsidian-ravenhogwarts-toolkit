import {
	computeCounts,
	matchesState,
} from "@src/toolkit/pluginFilter/service/filterCore";
import { FILTER_STATES } from "@src/toolkit/pluginFilter/types";

describe("matchesState — CSS :has() 规则的纯函数镜像", () => {
	it("all：恒可见（不过滤）", () => {
		expect(matchesState("all", true)).toBe(true);
		expect(matchesState("all", false)).toBe(true);
	});

	it("enabled：仅启用项可见", () => {
		expect(matchesState("enabled", true)).toBe(true);
		expect(matchesState("enabled", false)).toBe(false);
	});

	it("disabled：仅禁用项可见", () => {
		expect(matchesState("disabled", true)).toBe(false);
		expect(matchesState("disabled", false)).toBe(true);
	});
});

describe("computeCounts — 计数", () => {
	it("快照基准（test/community-plugin.html）：82 项 / 7 启用 / 75 禁用", () => {
		const flags = [...Array<boolean>(7).fill(true), ...Array<boolean>(75).fill(false)];
		expect(computeCounts(flags)).toEqual({
			total: 82,
			enabled: 7,
			disabled: 75,
		});
	});

	it("空列表全零", () => {
		expect(computeCounts([])).toEqual({ total: 0, enabled: 0, disabled: 0 });
	});

	it("计数互补：enabled + disabled === total", () => {
		const flags = [true, false, true, true];
		const counts = computeCounts(flags);
		expect(counts.enabled).toBe(3);
		expect(counts.disabled).toBe(1);
		expect(counts.enabled + counts.disabled).toBe(counts.total);
	});
});

describe("FILTER_STATES — 按钮渲染顺序契约", () => {
	it("固定为 全部 → 已启用 → 已禁用", () => {
		expect(FILTER_STATES).toEqual(["all", "enabled", "disabled"]);
	});
});
