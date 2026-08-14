import { IFolderTemplateRule, TemplateScope } from "../types";

export interface IFileInfo {
	/** 所在文件夹路径；根目录为 "" 或 "/" */
	parentPath: string;
	/** 文件名（不含扩展名） */
	basename: string;
}

/** 与 obsidian normalizePath 行为一致的纯实现，便于单元测试 */
export function normalize(path: string): string {
	return path
		.replace(/\\/g, "/")
		.replace(/\/+/g, "/")
		.replace(/^\/|\/$/g, "");
}

function matchScope(scope: TemplateScope, info: IFileInfo): boolean {
	const parent = normalize(info.parentPath);
	switch (scope.type) {
		case "FOLDER": {
			const target = normalize(scope.path);
			if (target === "") return false;
			if (parent === target) return true;
			return (
				scope.includeSubfolders && parent.startsWith(target + "/")
			);
		}
		case "EXCLUDE_FOLDER": {
			const target = normalize(scope.path);
			if (target === "") return true;
			return parent !== target && !parent.startsWith(target + "/");
		}
		case "FILENAME_PATTERN": {
			if (!scope.pattern) return false;
			try {
				return new RegExp(scope.pattern).test(info.basename);
			} catch {
				return false;
			}
		}
		// 「根目录」= 整库兜底：vault 内任意位置都命中，需要收窄时靠同规则内的
		// EXCLUDE_FOLDER / FILENAME_PATTERN（AND 组合）排除。
		// 与 v0 行为一致：旧版 folder="/" 的模板即是对所有文件夹生效的兜底项。
		case "ROOT":
			return true;
	}
}

/**
 * 按数组顺序返回首个命中的启用规则；规则内所有 scope 须同时满足（AND）。
 * 无命中返回 null。
 */
export function findMatchingRule(
	rules: readonly IFolderTemplateRule[],
	info: IFileInfo
): IFolderTemplateRule | null {
	for (const rule of rules) {
		if (!rule.enabled) continue;
		if (rule.scopes.length === 0) continue;
		if (!rule.templateFile) continue;
		if (rule.scopes.every((scope) => matchScope(scope, info))) {
			return rule;
		}
	}
	return null;
}
