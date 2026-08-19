import type { App } from "obsidian";
import {
	collectInstalledPlugins,
	summarizePluginStatus,
} from "@src/toolkit/pluginOrder/service/pluginInventory";
import type { IInstalledPluginEntry } from "@src/toolkit/pluginOrder/types";

/** 假 app：只包含 collectInstalledPlugins 会触碰的形状 */
function fakeApp(manifests: unknown): App {
	return { plugins: { manifests } } as unknown as App;
}

/** 假 app：不含 plugins 属性（模拟运行时属性缺失） */
function fakeAppWithoutPlugins(): App {
	return {} as unknown as App;
}

describe("collectInstalledPlugins — 运行时 app.plugins.manifests", () => {
	it("读取 manifests：字段映射、缺 name 回退 id、空 id 过滤、按 id 排序", () => {
		const app = fakeApp({
			zz: { id: "zz", name: "ZZ", version: "1.0.0" },
			disabled: { id: "disabled", name: "已停用插件", version: "0.9.0" },
			noname: { id: "noname", version: "2.0.0" },
			bad: { id: "", name: "空 id" },
		});
		// 空 id 被过滤；缺 name 回退 id；按 id 字典序排序
		expect(collectInstalledPlugins(app)).toEqual([
			{ id: "disabled", name: "已停用插件", version: "0.9.0" },
			{ id: "noname", name: "noname", version: "2.0.0" },
			{ id: "zz", name: "ZZ", version: "1.0.0" },
		]);
	});

	it("plugins 属性缺失时返回空数组（不再降级目录扫描）", () => {
		expect(collectInstalledPlugins(fakeAppWithoutPlugins())).toEqual([]);
	});

	it("manifests 非 object 时返回空数组", () => {
		expect(collectInstalledPlugins(fakeApp(null))).toEqual([]);
	});
});

describe("summarizePluginStatus — 三态判定", () => {
	const installed: IInstalledPluginEntry[] = [
		{ id: "A", name: "A", version: "1" },
		{ id: "B", name: "B", version: "1" },
		{ id: "C", name: "C", version: "1" },
	];

	it("配置 (A,B,C) 而 B 未启用：active=[A,C]、installedDisabled=[B]", () => {
		const summary = summarizePluginStatus(["A", "B", "C"], ["A", "C"], installed);
		expect(summary).toEqual({
			active: ["A", "C"],
			installedDisabled: ["B"],
			missing: [],
		});
	});

	it("未安装的配置 id 归入 missing", () => {
		const summary = summarizePluginStatus(["A", "X"], ["A"], installed);
		expect(summary).toEqual({
			active: ["A"],
			installedDisabled: [],
			missing: ["X"],
		});
	});

	it("全部配置插件未启用：active 为空、全部归入 installedDisabled", () => {
		const summary = summarizePluginStatus(["A", "B"], [], installed);
		expect(summary).toEqual({
			active: [],
			installedDisabled: ["A", "B"],
			missing: [],
		});
	});
});
