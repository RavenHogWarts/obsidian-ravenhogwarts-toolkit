import { ToolkitId } from "@/src/core/interfaces/types";
import { Logger } from "@/src/core/services/Log";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { App, PluginSettingTab } from "obsidian";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import "./styles/SettingsTab.css";
import { ToolkitDetailSettings } from "./ToolkitDetailSettings";
import { ToolkitOverview } from "./ToolkitOverview";

export default class RavenHogwartsToolkitSettingTab extends PluginSettingTab {
	plugin: RavenHogwartsToolkitPlugin;
	logger: Logger;
	root: Root | null = null;
	private currentView: ToolkitId | "overview" = "overview";

	constructor(app: App, plugin: RavenHogwartsToolkitPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.logger = Logger.getRootLogger();
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		if (!this.root) {
			this.root = createRoot(containerEl);
		}

		this.renderContent();
	}

	hide() {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		this.containerEl.empty();
		this.currentView = "overview";
	}

	private renderContent() {
		this.root?.render(
			<React.StrictMode>
				<div className="rht-settings-container">
					{this.currentView === "overview" ? (
						<>
							<ToolkitOverview
								plugin={this.plugin}
								logger={this.logger}
								config={this.plugin.settings.config}
								onNavigateToDetail={(moduleId) => {
									this.currentView = moduleId as ToolkitId;
									this.renderContent();
								}}
								onVersionClick={() => this.renderContent()}
							/>
						</>
					) : (
						<ToolkitDetailSettings
							app={this.app}
							plugin={this.plugin}
							moduleId={this.currentView}
							onNavigateBack={() => {
								this.currentView = "overview";
								this.renderContent();
							}}
						/>
					)}
				</div>
			</React.StrictMode>
		);
	}
}
