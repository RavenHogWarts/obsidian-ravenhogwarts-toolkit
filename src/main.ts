import { EventBus } from "@src/model/manager/EventBus";
import { PluginContext } from "@src/model/manager/PluginContext";
import { ToolkitManager } from "@src/model/manager/ToolkitManager";
import { toolkitRegistry } from "@src/model/manager/ToolkitRegistry";
import { IPluginSettings } from "@src/settings/IPluginSettings";
import { PluginSettingTab } from "@src/settings/PluginSettingTab";
import SettingsStore from "@src/settings/SettingsStore";
import "@styles/styles";
import { Plugin } from "obsidian";

// Import all toolkits to trigger decorator registration
import "@src/toolkit/quickPath/quick-path";

export default class RHTPlugin extends Plugin {
	settings: IPluginSettings;
	readonly settingsStore = new SettingsStore(this);
	private toolkitManager: ToolkitManager;
	private eventBus: EventBus;
	private pluginContext: PluginContext;

	async onload() {
		await this.settingsStore.loadSettings();

		this.eventBus = new EventBus();
		this.pluginContext = new PluginContext(this, this.eventBus);
		this.toolkitManager = new ToolkitManager(this.pluginContext);

		await this.registerToolkit();
		await this.saveSettings();

		this.addSettingTab(new PluginSettingTab(this));
	}

	onunload() {
		if (this.toolkitManager) {
			this.toolkitManager.unloadToolkit();
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async registerToolkit() {
		const toolkit = toolkitRegistry.getAll();
		for (const tk of toolkit) {
			const tool = new tk();
			this.toolkitManager.registerTool(tool);
		}
	}
}
