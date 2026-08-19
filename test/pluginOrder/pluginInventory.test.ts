import type { App, DataAdapter } from "obsidian";
import {
	collectInstalledPlugins,
	scanInstalledPlugins,
	summarizePluginStatus,
} from "@src/toolkit/pluginOrder/service/pluginInventory";
import type { IInstalledPluginEntry } from "@src/toolkit/pluginOrder/types";

const CONFIG_DIR = ".obsidian";

/** 假 app：只包含 readInstalledFromRuntime 会触碰的形状 */
function fakeApp(manifests: unknown): App {
	return { plugins: { manifests } } as unknown as App;
}

/** 假 app：不含 plugins 属性（模拟运行时属性缺失，触发降级） */
function fakeAppWithoutPlugins(): App {
	return {} as unknown as App;
}

/** 假 adapter：内存文件表 + 显式目录列表 */
function fakeAdapter(
	files: Record<string, string>,
	folders: string[] = []
): DataAdapter {
	return {
		list: async (path: string) => ({
			files: Object.keys(files).filter((file) => file.startsWith(`${path}/`)),
			folders: folders.filter((folder) => folder.startsWith(`${path}/`)),
		}),
		read: async (path: string) => {
			if (!(path in files)) throw new Error(`not found: ${path}`);
			return files[path];
		},
	} as unknown as DataAdapter;
}

/** 假 adapter：list 抛错（模拟 plugins 目录不存在；也用于证明主路径零 I/O） */
function failingAdapter(): DataAdapter {
	return {
		list: async () => {
			throw new Error("no such directory");
		},
		read: async () => {
			throw new Error("unreachable");
		},
	} as unknown as DataAdapter;
}

describe("collectInstalledPlugins — 运行时主路径", () => {
	it("读取 manifests：字段映射、缺 name 回退 id、空 id 过滤、按 id 排序", async () => {
		const app = fakeApp({
			zz: { id: "zz", name: "ZZ", version: "1.0.0" },
			disabled: { id: "disabled", name: "已停用插件", version: "0.9.0" },
			noname: { id: "noname", version: "2.0.0" },
			bad: { id: "", name: "空 id" },
		});
		const entries = await collectInstalledPlugins(
			app,
			failingAdapter(),
			CONFIG_DIR
		);
		// 空 id 被过滤；缺 name 回退 id；按 id 字典序排序
		expect(entries).toEqual([
			{ id: "disabled", name: "已停用插件", version: "0.9.0" },
			{ id: "noname", name: "noname", version: "2.0.0" },
			{ id: "zz", name: "ZZ", version: "1.0.0" },
		]);
	});
});

describe("collectInstalledPlugins — 降级扫描", () => {
	const files: Record<string, string> = {
		[`${CONFIG_DIR}/plugins/ok/manifest.json`]:
			'{"id":"ok","name":"OK","version":"1.0.0"}',
		[`${CONFIG_DIR}/plugins/corrupt/manifest.json`]: "not-json",
	};
	const folders = [
		`${CONFIG_DIR}/plugins/ok`,
		`${CONFIG_DIR}/plugins/corrupt`,
		`${CONFIG_DIR}/plugins/nomanifest`,
	];

	it("plugins 属性缺失时走扫描路径", async () => {
		const entries = await collectInstalledPlugins(
			fakeAppWithoutPlugins(),
			fakeAdapter(files, folders),
			CONFIG_DIR
		);
		expect(entries).toEqual([
			{ id: "ok", name: "OK", version: "1.0.0" },
		]);
	});

	it("manifests 非 object 时走扫描路径", async () => {
		const entries = await collectInstalledPlugins(
			fakeApp(null),
			fakeAdapter(files, folders),
			CONFIG_DIR
		);
		expect(entries).toEqual([
			{ id: "ok", name: "OK", version: "1.0.0" },
		]);
	});
});

describe("scanInstalledPlugins — 容错", () => {
	it("manifest 缺失/JSON 损坏的目录被跳过，其余正常入缓存", async () => {
		const entries = await scanInstalledPlugins(
			fakeAdapter(
				{
					".obsidian/plugins/ok/manifest.json":
						'{"id":"ok","name":"OK","version":"1.0.0"}',
					".obsidian/plugins/corrupt/manifest.json": "not-json",
				},
				[
					".obsidian/plugins/ok",
					".obsidian/plugins/corrupt",
					".obsidian/plugins/nomanifest",
				]
			),
			CONFIG_DIR
		);
		expect(entries).toEqual([
			{ id: "ok", name: "OK", version: "1.0.0" },
		]);
	});

	it("plugins 目录不存在时返回空数组不抛出", async () => {
		const entries = await scanInstalledPlugins(failingAdapter(), CONFIG_DIR);
		expect(entries).toEqual([]);
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
