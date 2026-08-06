/**
 * 文件夹结构的「剪贴板交换格式」。
 *
 * 设计：用 Markdown 围栏代码块（fenced code block）承载，并带一个专属语言标识
 * `ravenhogwarts-folder-structure`，作为「这是本插件导出的结构」的唯一判定依据。
 *
 * 好处：
 * - 人类可读、可在笔记中手改、可跨设备/跨笔记粘贴；
 * - 带明确标识，不会把任意文本误判为结构；
 * - 解析纯文本即可，不依赖 Obsidian 运行时（便于单测）。
 *
 * 形如：
 * ```ravenhogwarts-folder-structure
 * 材料/
 * 材料/原始/
 * 材料/复盘/
 * 复盘/
 * ```
 *
 * 每行是一条相对路径（以 `/` 分隔层级），顺序即「父先于子」的创建顺序。
 */

/** 围栏代码块的语言标识，作为本插件结构的唯一判定依据 */
export const FOLDER_STRUCTURE_FENCE = "ravenhogwarts-folder-structure";

/** 单级文件夹名中不允许出现的字符（保留 `/` 作为层级分隔符，不可一并剔除） */
const ILLEGAL_CHARS = /[\\:*?"<>|#^[\]]/g;

/**
 * 把子目录相对路径序列化为可写入剪贴板的文本（带专属标识的围栏代码块）。
 * @param subPaths 相对路径数组（如 ["材料", "材料/原始"]）
 */
export function serializeStructure(subPaths: string[]): string {
	const cleaned = subPaths
		.map((p) => p.replace(ILLEGAL_CHARS, "").trim())
		.filter((p) => p.length > 0);
	const body = cleaned.join("\n");
	return "```" + FOLDER_STRUCTURE_FENCE + "\n" + body + "\n```";
}

/**
 * 从剪贴板文本中解析本插件导出的文件夹结构。
 * 仅当存在语言标识为 {@link FOLDER_STRUCTURE_FENCE} 的围栏代码块时才解析，
 * 否则返回 null（表示「不是可识别的结构」）。
 * @param text 系统剪贴板原始文本
 * @returns 相对路径数组；未识别时返回 null
 */
export function parseStructure(text: string): string[] | null {
	if (!text) return null;
	// 匹配 ```lang\n ... \n```，lang 与内容均可含任意字符（非贪婪、跨行）
	const fenceRe = new RegExp(
		"`{3}" + escapeRegExp(FOLDER_STRUCTURE_FENCE) + "\\s*\\n([\\s\\S]*?)\\n`{3}",
		"m"
	);
	const match = fenceRe.exec(text);
	if (!match) return null;
	const body = match[1] ?? "";
	const paths = body
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
		.map((line) => line.replace(ILLEGAL_CHARS, ""))
		.filter((line) => line.length > 0);
	return paths.length > 0 ? paths : null;
}

/** 转义正则中的特殊字符，确保语言标识被当作字面量匹配 */
function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
