import { IToolSettings } from "@src/model/toolkit/IToolSettings";

export interface ISettings extends IToolSettings {
	config: {
		version: number;
		/** 模板文件相对路径的基准目录；空串表示跟随官方 Templates 插件配置 */
		templatesFolderPath: string;
	};
	data: {
		rules: IFolderTemplateRule[];
	};
}

export const SETTINGS_VERSION = 1;

/** 模板应用方式 */
export type TemplateApplyMode = "empty-only" | "prepend";

export interface IFolderTemplateRule {
	id: string;
	enabled: boolean;
	/** 匹配条件，AND 组合；空数组视为不命中 */
	scopes: TemplateScope[];
	/** 模板路径；含 "/" 视为 vault 完整路径，否则相对 templatesFolderPath */
	templateFile: string;
	/** 重命名模板，支持 ${...} 变量；空串表示不重命名 */
	renameFormat: string;
	applyMode: TemplateApplyMode;
}

// ---- Scope（判别联合）----

interface BaseScope {
	id: string;
}

export interface FolderScope extends BaseScope {
	type: "FOLDER";
	path: string;
	includeSubfolders: boolean;
}

export interface ExcludeFolderScope extends BaseScope {
	type: "EXCLUDE_FOLDER";
	path: string;
}

export interface FilenamePatternScope extends BaseScope {
	type: "FILENAME_PATTERN";
	/** 匹配文件 basename 的正则表达式 */
	pattern: string;
}

/**
 * 根目录（整库兜底）：vault 内任意位置的新建文件都命中。
 * 需要收窄范围时，在同一规则内追加 EXCLUDE_FOLDER / FILENAME_PATTERN 作用域。
 */
export interface RootScope extends BaseScope {
	type: "ROOT";
}

export type TemplateScope =
	| FolderScope
	| ExcludeFolderScope
	| FilenamePatternScope
	| RootScope;

export type TemplateScopeType = TemplateScope["type"];

export function generateId(): string {
	return crypto.randomUUID();
}

/** 按类型构造空作用域（设置面板切换作用域类型时使用） */
export function createScope(
	type: TemplateScopeType,
	id: string = generateId()
): TemplateScope {
	switch (type) {
		case "FOLDER":
			return { id, type, path: "", includeSubfolders: true };
		case "EXCLUDE_FOLDER":
			return { id, type, path: "" };
		case "FILENAME_PATTERN":
			return { id, type, pattern: "" };
		case "ROOT":
			return { id, type };
	}
}

/**
 * 切换 scope 类型时构造新 scope，并尽量保留与旧类型同名的字段值。
 * 目前仅 `path` 在 FOLDER / EXCLUDE_FOLDER 间通用；其余字段各类型独有，不迁移。
 * id 始终沿用旧值，保证 React key 稳定。
 */
export function migrateScope(
	prev: TemplateScope,
	nextType: TemplateScopeType
): TemplateScope {
	const next = createScope(nextType, prev.id);
	if ("path" in prev && "path" in next) {
		next.path = prev.path;
	}
	return next;
}

export function createRule(): IFolderTemplateRule {
	return {
		id: generateId(),
		enabled: true,
		scopes: [createScope("FOLDER")],
		templateFile: "",
		renameFormat: "",
		applyMode: "empty-only",
	};
}

export const DefaultSettings: ISettings = {
	enabled: false,
	config: {
		version: SETTINGS_VERSION,
		templatesFolderPath: "",
	},
	data: {
		rules: [],
	},
};
