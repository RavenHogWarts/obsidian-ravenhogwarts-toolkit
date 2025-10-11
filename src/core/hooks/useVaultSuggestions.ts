import { App, TFile, TFolder } from "obsidian";
import { useMemo } from "react";

export const useVaultSuggestions = (app: App) => {
	return useMemo(() => {
		const suggestions = {
			folders: new Set<TFolder>(),
			files: new Set<TFile>(),
			keys: new Set<string>(),
		};

		// 遍历所有文件获取建议值
		app.vault.getAllLoadedFiles().forEach((file) => {
			if (file instanceof TFolder) {
				suggestions.folders.add(file);
			} else if (file instanceof TFile) {
				suggestions.files.add(file);

				// 获取 frontmatter
				const cache = app.metadataCache.getCache(file.path);
				const frontmatter = cache?.frontmatter;
				if (frontmatter) {
					Object.keys(frontmatter).forEach((key) => {
						suggestions.keys.add(key);
					});
				}
			}
		});

		// 对文件夹路径进行排序：先按深度排序（浅层文件夹在前），然后按字母排序
		const sortedFolders = Array.from(suggestions.folders)
			.map((folder) => folder.path)
			.sort((a, b) => {
				const depthA = a.split("/").length;
				const depthB = b.split("/").length;

				// 优先按深度排序
				if (depthA !== depthB) {
					return depthA - depthB;
				}

				// 深度相同时按字母排序
				return a.localeCompare(b);
			});

		return {
			folderSuggestions: sortedFolders,
			fileSuggestions: Array.from(suggestions.files).map(
				(file) => file.path
			),
			keySuggestions: Array.from(suggestions.keys),
		};
	}, [app]);
};
