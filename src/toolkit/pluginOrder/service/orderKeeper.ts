/**
 * plugin-order 核心纯函数：解析配置文本、计算 community-plugins.json 的重排结果。
 *
 * 安全规则（全部沿用 custom-icons 已验证实现）：
 * - 仅重排 orderedIds 中【已存在于数组】的条目，绝不增删
 *   （未启用/未安装的配置 id 自动忽略）；
 * - 其余条目保持原相对顺序；
 * - 数组含重复 id 视为结构异常（否则去重上浮会静默缩短数组，违反"绝不增删"）；
 * - 非 string[] 一律 skipped-invalid 不动文件。
 */

export type ReorderOutcome =
	| { status: "skipped-invalid" } // 文件结构异常（非 string[] / 含重复 id），不动文件
	| { status: "unchanged" } // 已满足 / 配置的 id 全部不在数组中
	| { status: "reordered"; nextIds: string[] }; // 需要重排

/** textarea 原始文本 → 有序 id 列表：按行分割、trim、去空行、保序去重、过滤危险键 */
export function parsePriorityPlugins(text: string): string[] {
	const seen = new Set<string>();
	const ids: string[] = [];
	for (const line of text.split("\n")) {
		const id = line.trim();
		if (!id || id === "__proto__" || id === "constructor" || id === "prototype") {
			continue;
		}
		if (seen.has(id)) continue;
		seen.add(id);
		ids.push(id);
	}
	return ids;
}

/**
 * 计算重排结果。`orderedIds` 由调用方先经 {@link parsePriorityPlugins} 解析，
 * 此处仅防御性去重保序。结果与原数组一致时返回 unchanged（幂等，差异才写）。
 */
export function computePluginOrder(
	parsed: unknown,
	orderedIds: string[]
): ReorderOutcome {
	if (!Array.isArray(parsed)) return { status: "skipped-invalid" };

	const ids: string[] = [];
	for (const id of parsed) {
		if (typeof id !== "string") return { status: "skipped-invalid" };
		ids.push(id);
	}
	if (new Set(ids).size !== ids.length) return { status: "skipped-invalid" };

	const present = parseUnique(orderedIds).filter((id) => ids.includes(id));
	if (present.length === 0) return { status: "unchanged" };

	const presentSet = new Set(present);
	const nextIds = [...present, ...ids.filter((id) => !presentSet.has(id))];
	if (arraysEqual(ids, nextIds)) return { status: "unchanged" };
	return { status: "reordered", nextIds };
}

/** 保序去重（防御性：orderedIds 正常已被 parsePriorityPlugins 去重） */
function parseUnique(ids: string[]): string[] {
	const seen = new Set<string>();
	const unique: string[] = [];
	for (const id of ids) {
		if (seen.has(id)) continue;
		seen.add(id);
		unique.push(id);
	}
	return unique;
}

function arraysEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((value, index) => value === b[index]);
}
