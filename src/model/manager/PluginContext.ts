import RHTPlugin from "@src/main";
import { IPluginSettings } from "@src/settings/IPluginSettings";
import SettingsStore from "@src/settings/SettingsStore";
import { Menu, MenuItem, Notice } from "obsidian";
import { IPluginContext } from "../toolkit/IPluginContext";

export class PluginContext implements IPluginContext {
	private readonly plugin: RHTPlugin;
	/**
	 * 每个 `Menu` 实例到本插件父级子菜单的缓存。
	 * 菜单是一次性对象（关闭即弃），WeakMap 让其被 GC 时自动清理，无需手动失效。
	 */
	private readonly submenuCache = new WeakMap<Menu, Menu>();
	/**
	 * 每个 `Menu` 实例上「上一次添加条目的工具 id」。
	 * 工具切换时插入分割线，使不同工具之间在子菜单内清晰分隔，
	 * 同一工具的连续条目则紧挨在一起、无分割线。
	 */
	private readonly lastToolIdByMenu = new WeakMap<Menu, string>();

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
			submenu = (item as unknown as { setSubmenu(): Menu }).setSubmenu();
		});
		this.submenuCache.set(menu, submenu);
		return submenu;
	}

	addToolkitMenuItem(
		menu: Menu,
		toolId: string,
		configure: (item: MenuItem) => void,
		section = "action",
	): void {
		const submenu = this.getToolkitSubmenu(menu, section);
		// 切换到不同工具时插入分割线；首个工具或同工具连续条目不插。
		const lastToolId = this.lastToolIdByMenu.get(menu);
		if (lastToolId !== undefined && lastToolId !== toolId) {
			submenu.addSeparator();
		}
		this.lastToolIdByMenu.set(menu, toolId);
		submenu.addItem(configure);
	}

	log(
		level: "info" | "warn" | "error",
		message: string,
		id?: string,
		...args: unknown[]
	): void {
		console[level](
			`[${id ?? this.plugin.manifest.id}] ${message}`,
			...args,
		);
	}
}
