import RHTPlugin from "@src/main";
import { IPluginSettings } from "@src/settings/IPluginSettings";
import SettingsStore from "@src/settings/SettingsStore";
import { App, Menu } from "obsidian";

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
	log(
		level: "info" | "warn" | "error",
		message: string,
		id?: string,
		...args: unknown[]
	): void;
}
