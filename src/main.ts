import "@styles/styles";
import { Plugin } from "obsidian";
import { IPluginSettings } from "./settings/IPluginSettings";
import { PluginSettingTab } from "./settings/PluginSettingTab";
import SettingsStore from "./settings/SettingsStore";

export default class RHTPlugin extends Plugin {
	settings: IPluginSettings;
	readonly settingsStore = new SettingsStore(this);

	async onload() {
		await this.settingsStore.loadSettings();

		this.addSettingTab(new PluginSettingTab(this));
	}

	onunload() {}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
