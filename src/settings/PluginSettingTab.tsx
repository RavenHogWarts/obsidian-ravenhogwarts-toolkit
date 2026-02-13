import { SettingsStoreContext } from "@src/context/SettingsStoreContext";
import { ObsidianAppContext } from "@src/hook/obsidianAppContext";
import RHTPlugin from "@src/main";
import { PluginSettingTab as ObPluginSettingTab } from "obsidian";
import { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import { Settings } from "./Settings";

export class PluginSettingTab extends ObPluginSettingTab {
	plugin: RHTPlugin;
	root: Root;

	constructor(plugin: RHTPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		this.root = createRoot(containerEl);
		this.root.render(
			<StrictMode>
				<ObsidianAppContext.Provider value={this.plugin.app}>
					<SettingsStoreContext.Provider
						value={this.plugin.settingsStore}
					>
						<Settings />
					</SettingsStoreContext.Provider>
				</ObsidianAppContext.Provider>
			</StrictMode>
		);
	}

	hide() {
		this.root.unmount();
		this.containerEl.empty();
	}
}
