import RHTPlugin from "@src/main";
import { IPluginSettings } from "@src/settings/IPluginSettings";
import SettingsStore from "@src/settings/SettingsStore";
import { App, Command } from "obsidian";

export interface IPluginContext {
	readonly _app: App;
	readonly _plugin: RHTPlugin;
	readonly _settingsStore: SettingsStore;
	readonly _settings: IPluginSettings;

	addCommand(command: Command): Command;

	notice(message: string): void;
	log(
		level: "info" | "warn" | "error",
		message: string,
		id?: string,
		...args: any[]
	): void;
}
