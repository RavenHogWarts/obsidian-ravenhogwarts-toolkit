import type { App } from "obsidian";
import type { IInstalledPluginEntry } from "../types";

/**
 * 读取全部已安装插件（无论是否启用）。数据源 = 运行时 `app.plugins.manifests`
 * （类型由 @obsidian-typings 增强 `App.plugins: Plugins`；Obsidian 启动时已解析全部
 * 已安装插件的 manifest，含未启用，零 I/O）。一律走内置 API，不做目录扫描；
 * 保留运行时形状守卫：异常构建下 `manifests` 缺失即返回空缓存。
 */
export function collectInstalledPlugins(app: App): IInstalledPluginEntry[] {
	const manifests = app.plugins?.manifests;
	if (!manifests || typeof manifests !== "object") return [];

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
