import { TemplateApplyMode } from "../types";

/**
 * 判定命中规则是否应作用于该文件。
 *
 * 关键约束：`empty-only` 模式下非空文件应**完全不动**——既不套模板也不重命名，
 * 避免出现"改了名却没套模板"的割裂行为（见 dev/folder-templates-review.md P0-1）。
 *
 * @param applyMode 规则的应用方式
 * @param isEmpty   文件当前内容是否为空（去除首尾空白后长度为 0）
 */
export function shouldApplyRule(
	applyMode: TemplateApplyMode,
	isEmpty: boolean
): boolean {
	if (applyMode === "empty-only") {
		return isEmpty;
	}
	return true;
}
