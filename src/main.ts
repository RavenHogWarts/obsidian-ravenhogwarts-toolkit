import { PluginContext } from "@src/model/manager/PluginContext";
import { ToolkitManager } from "@src/model/manager/ToolkitManager";
import { toolkitRegistry } from "@src/model/manager/ToolkitRegistry";
import { IPluginSettings } from "@src/settings/IPluginSettings";
import { PluginSettingTab } from "@src/settings/PluginSettingTab";
import SettingsStore from "@src/settings/SettingsStore";
import "@src/toolkit";
import "@styles/styles";
import { Plugin } from "obsidian";

export default class RHTPlugin extends Plugin {
	settings: IPluginSettings;
	readonly settingsStore = new SettingsStore(this);
	toolkitManager: ToolkitManager;
	pluginContext: PluginContext;
	settingTab: PluginSettingTab | undefined;

	async onload() {
		await this.settingsStore.loadSettings();

		this.pluginContext = new PluginContext(this);
		this.toolkitManager = new ToolkitManager(this.pluginContext);

		await this.registerToolkit();
		await this.toolkitManager.loadEnabledToolkit();

		this.settingTab = new PluginSettingTab(this);
		this.addSettingTab(this.settingTab);
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
			await tool.initialize(this.pluginContext);
		}
	}
}
