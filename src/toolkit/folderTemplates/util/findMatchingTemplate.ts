import { normalizePath, TFile } from "obsidian";
import { IFolderTemplate } from "../types";

export function findMatchingTemplate(
	file: TFile,
	templates: IFolderTemplate[]
): IFolderTemplate | null {
	if (templates.length === 0) {
		return null;
	}

	const filePath = normalizePath(file.parent?.path || "");

	const sortTemplates = templates.sort(
		(a, b) => b.folder.length - a.folder.length
	);

	for (const template of sortTemplates) {
		const templatePath = normalizePath(template.folder);

		// 首先不处理根目录模板
		if (templatePath === "" || templatePath === "/") {
			continue;
		}

		// 第一优先级: 完全匹配
		if (filePath === templatePath) {
			return template;
		}

		// 子文件夹匹配
		if (filePath.startsWith(templatePath + "/")) {
			return template;
		}
	}

	// 根目录模板作为最后的匹配选项
	const rootTemplate = templates.find(
		(t) => normalizePath(t.folder) === "" || normalizePath(t.folder) === "/"
	);
	return rootTemplate || null;
}
