import RHTPlugin from "@src/main";
import { IPluginSettings } from "@src/settings/IPluginSettings";
import SettingsStore from "@src/settings/SettingsStore";
import { Menu, Notice } from "obsidian";
import { IPluginContext } from "../toolkit/IPluginContext";

export class PluginContext implements IPluginContext {
	private readonly plugin: RHTPlugin;
	/**
	 * 每个 `Menu` 实例到本插件父级子菜单的缓存。
	 * 菜单是一次性对象（关闭即弃），WeakMap 让其被 GC 时自动清理，无需手动失效。
	 */
	private readonly submenuCache = new WeakMap<Menu, Menu>();

	constructor(plugin: RHTPlugin) {
		this.plugin = plugin;
	}

	get _app() {
		return this.plugin.app;
	}

	get _plugin() {
		return this.plugin;
	}

	get _settingsStore(): SettingsStore {
		return this.plugin.settingsStore;
	}

	get _settings(): IPluginSettings {
		return this.plugin.settings;
	}

	notice(message: string): void {
		new Notice(message);
	}

	refreshSettingTab(): void {
		this.plugin.settingTab?.update();
	}

	getToolkitSubmenu(menu: Menu, section = "action"): Menu {
		const cached = this.submenuCache.get(menu);
		if (cached) {
			return cached;
		}

		let submenu!: Menu;
		menu.addItem((item) => {
			item.setSection(section);
			item.setTitle(this.plugin.manifest.name);
			item.setIcon("wand");
			// setSubmenu 在运行时存在，但未包含在 obsidian 的公开类型里。
			submenu = (
				item as unknown as { setSubmenu(): Menu }
			).setSubmenu();
		});
		this.submenuCache.set(menu, submenu);
		return submenu;
	}

	log(
		level: "info" | "warn" | "error",
		message: string,
		id?: string,
		...args: any[]
	): void {
		console[level](
			`[${id ?? this.plugin.manifest.id}] ${message}`,
			...args
		);
	}
}
