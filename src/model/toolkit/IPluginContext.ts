import RHTPlugin from "@src/main";
import { IPluginSettings } from "@src/settings/IPluginSettings";
import SettingsStore from "@src/settings/SettingsStore";
import { App, Menu, MenuItem } from "obsidian";

export interface IPluginContext {
	readonly _app: App;
	readonly _plugin: RHTPlugin;
	readonly _settingsStore: SettingsStore;
	readonly _settings: IPluginSettings;

	notice(message: string): void;
	refreshSettingTab(): void;

	/**
	 * 返回本插件在指定右键菜单上的统一子菜单（标题为插件名）。
	 * 同一个 `Menu` 实例多次调用会复用同一个父级子菜单，
	 * 使不同 toolkit 贡献的菜单项聚合在 "插件名 ▸ ..." 之下，而不是散落污染原生菜单。
	 * @param section 首个调用者决定父级所在的 section（后续调用忽略此参数）。
	 */
	getToolkitSubmenu(menu: Menu, section?: string): Menu;

	/**
	 * 向右键菜单的统一子菜单添加一条归属于指定工具的菜单项。
	 * 自动按 `toolId` 分组：同一工具的连续条目紧挨在一起、不插分割线；
	 * 切换到另一个工具时，先在子菜单里插入一条分割线再添加条目，
	 * 从而让不同工具之间在视觉上清晰分隔。
	 * @param menu 事件回调收到的菜单实例
	 * @param toolId 归属工具 id（用于跨工具分割线判定）
	 * @param configure 配置菜单项（标题、图标、点击回调等）
	 * @param section 首个调用者决定子菜单父项所在的 section
	 */
	addToolkitMenuItem(
		menu: Menu,
		toolId: string,
		configure: (item: MenuItem) => void,
		section?: string,
	): void;
	log(
		level: "info" | "warn" | "error",
		message: string,
		id?: string,
		...args: unknown[]
	): void;
}
