import {
	computePluginOrder,
	parsePriorityPlugins,
} from "@src/toolkit/pluginOrder/service/orderKeeper";

describe("parsePriorityPlugins", () => {
	it("按行分割并 trim，去除空行", () => {
		expect(parsePriorityPlugins("  a \n\nb\n")).toEqual(["a", "b"]);
	});

	it("保序去重重复行", () => {
		expect(parsePriorityPlugins("a\nb\na")).toEqual(["a", "b"]);
	});

	it("过滤危险键（__proto__ / constructor / prototype）", () => {
		expect(
			parsePriorityPlugins("__proto__\nconstructor\nprototype\nok")
		).toEqual(["ok"]);
	});

	it("空文本与纯空白返回空数组", () => {
		expect(parsePriorityPlugins("")).toEqual([]);
		expect(parsePriorityPlugins(" \n\t\n")).toEqual([]);
	});
});

describe("computePluginOrder", () => {
	it("已满足顺序时不变", () => {
		const outcome = computePluginOrder(["a", "b", "c"], ["a", "b"]);
		expect(outcome).toEqual({ status: "unchanged" });
	});

	it("部分存在：不存在的 id 忽略，其余按配置序上浮", () => {
		const outcome = computePluginOrder(["c", "a", "b"], ["a", "x"]);
		expect(outcome).toEqual({ status: "reordered", nextIds: ["a", "c", "b"] });
	});

	it("配置的 id 全部不在数组中时 unchanged", () => {
		const outcome = computePluginOrder(["a", "b"], ["x", "y"]);
		expect(outcome).toEqual({ status: "unchanged" });
	});

	it("非数组输入 skipped-invalid", () => {
		expect(computePluginOrder("abc", ["a"])).toEqual({
			status: "skipped-invalid",
		});
	});

	it("混合类型数组 skipped-invalid", () => {
		expect(computePluginOrder(["a", 1], ["a"])).toEqual({
			status: "skipped-invalid",
		});
	});

	it("数组含重复 id 时 skipped-invalid（防静默缩短数组）", () => {
		expect(computePluginOrder(["a", "a", "b"], ["a"])).toEqual({
			status: "skipped-invalid",
		});
	});

	it("多个优先 id 保持配置顺序", () => {
		const outcome = computePluginOrder(["c", "b", "a"], ["a", "b"]);
		expect(outcome).toEqual({ status: "reordered", nextIds: ["a", "b", "c"] });
	});

	it("其余条目保持原相对顺序", () => {
		const outcome = computePluginOrder(
			["d", "a", "e", "b", "f"],
			["b", "a"]
		);
		expect(outcome).toEqual({
			status: "reordered",
			nextIds: ["b", "a", "d", "e", "f"],
		});
	});

	it("空配置返回 unchanged", () => {
		expect(computePluginOrder([], ["a"])).toEqual({ status: "unchanged" });
	});
});
