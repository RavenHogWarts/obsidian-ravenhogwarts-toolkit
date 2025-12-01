import RHTPlugin from "@src/main";
import { IPluginSettings } from "@src/settings/IPluginSettings";
import SettingsStore from "@src/settings/SettingsStore";
import { App, Command } from "obsidian";
import { EventBus, EventCallback } from "../manager/EventBus";

export interface IPluginContext {
	readonly _app: App;
	readonly _plugin: RHTPlugin;
	readonly _settingsStore: SettingsStore;
	readonly _eventBus: EventBus;
	readonly _settings: IPluginSettings;

	addCommand(command: Command): void;
	addRibbonIcon(
		icon: string,
		title: string,
		callback: (evt: MouseEvent) => void
	): HTMLElement;
	addStatusBarItem(): HTMLElement;

	emitEvent(event: string, data?: any): void;
	onEvent(event: string, callback: EventCallback): () => void;

	notice(message: string): void;
	log(
		level: "info" | "warn" | "error",
		message: string,
		...args: any[]
	): void;
}
