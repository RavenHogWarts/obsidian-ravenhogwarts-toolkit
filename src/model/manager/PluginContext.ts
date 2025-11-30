import RHTPlugin from "@src/main";
import { IPluginSettings } from "@src/settings/IPluginSettings";
import SettingsStore from "@src/settings/SettingsStore";
import { Command, Notice } from "obsidian";
import { IPluginContext } from "../toolkit/IPluginContext";
import { EventBus, EventCallback } from "./EventBus";

export class PluginContext implements IPluginContext {
	private readonly plugin: RHTPlugin;
	private readonly eventBus: EventBus;

	constructor(plugin: RHTPlugin, eventBus: EventBus) {
		this.plugin = plugin;
		this.eventBus = eventBus;
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

	get _eventBus(): EventBus {
		return this.eventBus;
	}

	get _settings(): IPluginSettings {
		return this.plugin.settings;
	}

	addCommand(command: Command): void {
		this.plugin.addCommand(command);
	}

	addRibbonIcon(
		icon: string,
		title: string,
		callback: (evt: MouseEvent) => void
	): HTMLElement {
		return this.plugin.addRibbonIcon(icon, title, callback);
	}

	addStatusBarItem(): HTMLElement {
		return this.plugin.addStatusBarItem();
	}

	emitEvent(event: string, data?: any): void {
		this.eventBus.emit(event, data);
	}

	onEvent(event: string, callback: EventCallback): () => void {
		return this.eventBus.on(event, callback);
	}

	notice(message: string): void {
		new Notice(message);
	}

	log(
		level: "info" | "warn" | "error",
		message: string,
		...args: any[]
	): void {
		console[level](`[${this.plugin.manifest.name}] ${message}`, ...args);
	}
}
