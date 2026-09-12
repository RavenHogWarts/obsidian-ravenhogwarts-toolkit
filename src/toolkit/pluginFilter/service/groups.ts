import type { IPluginGroup } from "../types";

/** 生成分组 id（时间戳 + 随机段，冲突概率可忽略） */
export function createGroupId(): string {
	return `group-${Date.now().toString(36)}-${Math.random()
		.toString(36)
		.slice(2, 8)}`;
}

/**
 * 规范化存储的分组（抵御手改 data.json 的脏数据）：
 * 丢非法项、id 去重、空名字兜底为 `fallbackName`、组内成员去重保序、剔除空串。
 */
export function normalizeGroups(
	value: unknown,
	fallbackName: string,
): IPluginGroup[] {
	if (!Array.isArray(value)) return [];
	const seenIds = new Set<string>();
	const result: IPluginGroup[] = [];
	for (const entry of value) {
		if (typeof entry !== "object" || entry === null) continue;
		const record = entry as Record<string, unknown>;
		const id = typeof record.id === "string" ? record.id : "";
		if (id === "" || seenIds.has(id)) continue;
		const rawIds = Array.isArray(record.pluginIds)
			? record.pluginIds
			: [];
		result.push({
			id,
			name:
				typeof record.name === "string" && record.name.trim() !== ""
					? record.name
					: fallbackName,
			pluginIds: [
				...new Set(
					rawIds.filter(
						(x): x is string => typeof x === "string" && x !== ""
					)
				),
			],
		});
		seenIds.add(id);
	}
	return result;
}

/**
 * 插件行是否被分组筛选隐藏：
 * 未选择分组（`members` 为 undefined）时**永不隐藏**；
 * 选了分组则只显示成员行（原生开关行无 data-plugin-id，本函数不触及，见 index.ts）。
 */
export function isHiddenByGroup(
	members: readonly string[] | undefined,
	pluginId: string,
): boolean {
	return members !== undefined && !members.includes(pluginId);
}
