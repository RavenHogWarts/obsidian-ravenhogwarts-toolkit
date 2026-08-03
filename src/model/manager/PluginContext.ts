import RHTPlugin from "@src/main";
import { IPluginSettings } from "@src/settings/IPluginSettings";
import SettingsStore from "@src/settings/SettingsStore";
import { Notice } from "obsidian";
import { IPluginContext } from "../toolkit/IPluginContext";

export class PluginContext implements IPluginContext {
	private readonly plugin: RHTPlugin;

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
