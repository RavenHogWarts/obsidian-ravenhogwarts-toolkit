import { IToolSettings } from "@src/model/toolkit/IToolSettings";

export interface ISettings extends IToolSettings {
	config: {
		version: number; // 迁移锚点
	};
	data: {
		templates: IStructureTemplate[];
	};
}

export const SETTINGS_VERSION = 1;

/**
 * 一条"文件夹结构模板"。
 *
 * 采用「结构快照」而非仅存源路径：创建时按 snapshot 克隆，模板自包含、
 * 不依赖源文件夹存在（源被删/改名后模板仍可用）。
 *
 * sourceFolder 是可选的辅助字段：
 * - 可以留空，完全通过可视化编辑器手动构建模板
 * - 也可以填写 vault 路径，作为来源记录或用于"刷新快照"功能
 */
export interface IStructureTemplate {
	id: string; // uuid，稳定标识（UI 增删/持久化不依赖数组下标）
	enabled: boolean; // 单条可独立开关
	name: string; // 在命令/菜单里显示的名字
	sourceFolder: string; // 可选：快照来源（vault 路径），仅展示/刷新用
	snapshot: string[]; // 子目录相对路径快照，克隆依据
}

export function generateId(): string {
	return crypto.randomUUID();
}

/** 构造空模板占位（用户后续在设置中手填，或用「存为模板」填充） */
export function createTemplate(
	id: string = generateId()
): IStructureTemplate {
	return {
		id,
		enabled: true,
		name: "",
		sourceFolder: "",
		snapshot: [],
	};
}

export const DefaultSettings: ISettings = {
	enabled: false, // 工具默认禁用，由用户主动开启
	config: {
		version: SETTINGS_VERSION,
	},
	data: {
		templates: [],
	},
};
