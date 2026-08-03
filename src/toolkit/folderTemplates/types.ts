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

/** 仅匹配 vault 根目录下创建的文件 */
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
