import type { App, DataAdapter } from "obsidian";
import type { IInstalledPluginEntry } from "../types";

/**
 * 统一入口：读取全部已安装插件（无论是否启用）。
 * 主路径 = 运行时 `app.plugins.manifests`（未文档化但稳定，启动时已解析，
 * 含未启用，零 I/O）；形状校验不通过时降级为目录扫描。两层结果归一，调用方无感知。
 */
export async function collectInstalledPlugins(
	app: App,
	adapter: DataAdapter,
	configDir: string
): Promise<IInstalledPluginEntry[]> {
	const fromRuntime = readInstalledFromRuntime(app);
	if (fromRuntime) return fromRuntime;
	return scanInstalledPlugins(adapter, configDir);
}

/** 运行时主路径；`app.plugins.manifests` 形状不符时返回 undefined（触发降级） */
function readInstalledFromRuntime(app: App): IInstalledPluginEntry[] | undefined {
	// `manifests` 在启动时已解析全部已安装插件的 manifest（含未启用），零 I/O。
	// 类型由 @obsidian-typings 增强（App.plugins: Plugins）；仍保留运行时形状守卫，
	// 异常构建下 `plugins` 缺失即降级为目录扫描。
	const manifests = app.plugins?.manifests;
	if (!manifests || typeof manifests !== "object") return undefined;

	const entries: IInstalledPluginEntry[] = [];
	for (const manifest of Object.values(manifests)) {
		if (!manifest || typeof manifest.id !== "string" || manifest.id === "") {
			continue;
		}
		entries.push({
			id: manifest.id,
			name: typeof manifest.name === "string" ? manifest.name : manifest.id,
			version:
				typeof manifest.version === "string" ? manifest.version : "",
		});
	}
	entries.sort((a, b) => a.id.localeCompare(b.id)); // 稳定输出，缓存可复现
	return entries;
}

/**
 * 兜底路径：扫描 `${configDir}/plugins/` 下所有子目录的 manifest.json。
 * 已安装但【未启用】的插件只剩目录（id 不在 community-plugins.json 中），仍在扫描范围。
 * 单个目录 manifest 缺失/损坏时跳过该目录，不影响其余。
 */
export async function scanInstalledPlugins(
	adapter: DataAdapter,
	configDir: string
): Promise<IInstalledPluginEntry[]> {
	const pluginsDir = `${configDir}/plugins`;
	let listing: { files: string[]; folders: string[] };
	try {
		listing = await adapter.list(pluginsDir);
	} catch {
		return []; // 目录不存在（从未安装过插件）视为空缓存
	}

	const entries: IInstalledPluginEntry[] = [];
	for (const folder of listing.folders) {
		try {
			const manifest = JSON.parse(
				await adapter.read(`${folder}/manifest.json`)
			) as {
				id?: unknown;
				name?: unknown;
				version?: unknown;
			};
			if (typeof manifest.id !== "string" || manifest.id === "") continue;
			entries.push({
				id: manifest.id,
				name:
					typeof manifest.name === "string" ? manifest.name : manifest.id,
				version:
					typeof manifest.version === "string" ? manifest.version : "",
			});
		} catch {
			// manifest 缺失/JSON 损坏：跳过该目录
		}
	}
	entries.sort((a, b) => a.id.localeCompare(b.id)); // 稳定输出，缓存可复现
	return entries;
}

/** 配置三态判定结果（纯函数，供 Notice 反馈与测试） */
export interface PluginStatusSummary {
	/** 已启用（在数组中，本次参与优先排序） */
	active: string[];
	/** 已安装但未启用（本次忽略；启用后下次 enforce 生效） */
	installedDisabled: string[];
	/** 未安装 / 已卸载（忽略，可能是笔误） */
	missing: string[];
}

/** 把配置 id 列表按「已启用 / 已安装未启用 / 未安装」三态分类 */
export function summarizePluginStatus(
	orderedIds: string[],
	enabledIds: string[],
	installedEntries: IInstalledPluginEntry[]
): PluginStatusSummary {
	const enabledSet = new Set(enabledIds);
	const installedSet = new Set(
		installedEntries.map((entry) => entry.id)
	);
	const active: string[] = [];
	const installedDisabled: string[] = [];
	const missing: string[] = [];
	for (const id of orderedIds) {
		if (enabledSet.has(id)) active.push(id);
		else if (installedSet.has(id)) installedDisabled.push(id);
		else missing.push(id);
	}
	return { active, installedDisabled, missing };
}
