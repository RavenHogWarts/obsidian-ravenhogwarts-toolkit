import {
	createScope,
	generateId,
	IFolderTemplateRule,
	ISettings,
	SETTINGS_VERSION,
	TemplateScope,
} from "../types";
import { normalize } from "../service/RuleMatcher";

/** v0 旧结构（config 无 version 字段） */
interface ILegacySettings {
	enabled?: boolean;
	config?: {
		templatesFolderPath?: string;
		ignoredFolders?: string[];
	};
	data?: {
		folderTemplates?: Array<{
			folder?: string;
			templateFile?: string;
			fileNameRule?: string;
		}>;
	};
}

export function needsMigration(saved: unknown): boolean {
	if (!saved || typeof saved !== "object") return false;
	const s = saved as ILegacySettings & ISettings;
	return typeof s.config?.version !== "number";
}

/**
 * v0 → v1：
 * - 每条 folderTemplate 转为一条规则；folder 为空/根目录 → ROOT scope，
 *   否则 FOLDER scope（含子文件夹，与旧匹配行为一致）；
 * - config.ignoredFolders 转为追加到每条规则的 EXCLUDE_FOLDER scope
 *   （旧版该配置从未生效，迁移后真正生效）；
 * - fileNameRule 迁移为 renameFormat。
 */
export function migrateSettings(saved: unknown): ISettings {
	const legacy = (saved ?? {}) as ILegacySettings;
	const ignored = (legacy.config?.ignoredFolders ?? []).filter(
		(f) => typeof f === "string" && normalize(f) !== ""
	);

	const rules: IFolderTemplateRule[] = (
		legacy.data?.folderTemplates ?? []
	).map((tpl) => {
		const folder = normalize(tpl.folder ?? "");
		const scopes: TemplateScope[] =
			folder === ""
				? [createScope("ROOT")]
				: [
						{
							id: generateId(),
							type: "FOLDER",
							path: folder,
							includeSubfolders: true,
						},
					];
		for (const path of ignored) {
			scopes.push({
				id: generateId(),
				type: "EXCLUDE_FOLDER",
				path: normalize(path),
			});
		}
		return {
			id: generateId(),
			enabled: true,
			scopes,
			templateFile: tpl.templateFile ?? "",
			renameFormat: tpl.fileNameRule ?? "",
			applyMode: "empty-only",
		};
	});

	// 旧版按路径长者优先、根目录最后匹配；新版按数组顺序，迁移时还原该优先级
	const priority = (rule: IFolderTemplateRule): number => {
		const folder = rule.scopes.find((s) => s.type === "FOLDER");
		if (!folder) return -1; // ROOT 规则排最后
		return folder.path.length;
	};
	rules.sort((a, b) => priority(b) - priority(a));

	return {
		enabled: legacy.enabled ?? false,
		config: {
			version: SETTINGS_VERSION,
			templatesFolderPath: legacy.config?.templatesFolderPath ?? "",
		},
		data: { rules },
	};
}
