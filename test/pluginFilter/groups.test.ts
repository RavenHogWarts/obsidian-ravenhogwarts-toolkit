import {
	createGroupId,
	isHiddenByGroup,
	normalizeGroups,
	normalizeStringList,
} from "@src/toolkit/pluginFilter/service/groups";

describe("normalizeStringList — 字符串 id 列表规范化", () => {
	it("只留非空字符串、去重保序", () => {
		expect(
			normalizeStringList(["a", "", 3, "b", "a", null])
		).toEqual(["a", "b"]);
	});

	it("非数组输入 → 空数组", () => {
		expect(normalizeStringList(undefined)).toEqual([]);
		expect(normalizeStringList("a")).toEqual([]);
	});
});

describe("normalizeGroups — 抵御手改 data.json 的脏数据", () => {
	it("合法分组原样保留（成员去重保序）", () => {
		expect(
			normalizeGroups(
				[
					{
						id: "g1",
						name: "写作",
						pluginIds: ["b", "a", "b", ""],
					},
				],
				"未命名分组"
			)
		).toEqual([{ id: "g1", name: "写作", pluginIds: ["b", "a"] }]);
	});

	it("丢非法项：非对象条目、空 id、重复 id", () => {
		expect(
			normalizeGroups(
				[
					"junk",
					null,
					{ name: "无 id" },
					{ id: "g1", name: "A", pluginIds: [] },
					{ id: "g1", name: "A 重复", pluginIds: [] },
				],
				"未命名分组"
			)
		).toEqual([{ id: "g1", name: "A", pluginIds: [] }]);
	});

	it("空名/缺名 → 兜底 fallbackName；pluginIds 非数组 → 空成员", () => {
		expect(
			normalizeGroups(
				[
					{ id: "g1", name: "   " },
					{ id: "g2", pluginIds: "junk" },
				],
				"未命名分组"
			)
		).toEqual([
			{ id: "g1", name: "未命名分组", pluginIds: [] },
			{ id: "g2", name: "未命名分组", pluginIds: [] },
		]);
	});

	it("非数组输入 → 空数组", () => {
		expect(normalizeGroups(undefined, "x")).toEqual([]);
		expect(normalizeGroups("junk", "x")).toEqual([]);
	});
});

describe("isHiddenByGroup — 分组过滤显隐判定", () => {
	const members = ["a", "b"];

	it("未选分组（undefined）→ 永不隐藏（原生开关行也靠这一点保持可见）", () => {
		expect(isHiddenByGroup(undefined, "a")).toBe(false);
		expect(isHiddenByGroup(undefined, "zzz")).toBe(false);
	});

	it("选了分组 → 仅成员可见", () => {
		expect(isHiddenByGroup(members, "a")).toBe(false);
		expect(isHiddenByGroup(members, "zzz")).toBe(true);
	});
});

describe("createGroupId — 唯一性", () => {
	it("连续生成不重复且带前缀", () => {
		const ids = new Set(Array.from({ length: 100 }, () => createGroupId()));
		expect(ids.size).toBe(100);
		for (const id of ids) {
			expect(id.startsWith("group-")).toBe(true);
		}
	});
});
