import { App, moment, TFile } from "obsidian";
import { IVariableContext } from "./VariableEngine";

/**
 * 从笔记文件构建变量上下文。
 *
 * 可用变量：
 * - ${notename}   笔记文件名（不含扩展名）
 * - ${folder}     所在文件夹名
 * - ${folderPath} 所在文件夹完整路径
 * - ${now}        moment 对象，如 ${now.format('YYYY-MM-DD')}
 * - ${year} ${yearMonth} ${date} ${time} ${timestamp}
 * - ${frontmatter.xxx}（新建文件时通常为空，仅对已有缓存的文件有值）
 */
export function buildVariableContext(app: App, file: TFile): IVariableContext {
	const now = moment();
	return {
		notename: file.basename,
		folder: file.parent?.name ?? "",
		folderPath: file.parent?.path ?? "",
		now,
		date: now.format("YYYY-MM-DD"),
		time: now.format("HH:mm"),
		year: now.format("YYYY"),
		yearMonth: now.format("YYYYMM"),
		timestamp: Date.now(),
		frontmatter: app.metadataCache.getFileCache(file)?.frontmatter ?? {},
	};
}
