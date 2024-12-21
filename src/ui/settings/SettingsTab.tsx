import * as React from "react";
import RavenHogwartsToolkitPlugin from '@/src/main';
import { App, PluginSettingTab } from 'obsidian';
import { createRoot, Root } from "react-dom/client";
import { ToolkitOverview } from "./components/ToolkitOverview";
import { ToolkitDetailSettings } from "./components/ToolkitDetailSettings";
import { ToolkitId } from "../../manager/hooks/useToolkitSettings";

export default class RavenHogwartsToolkitSettingTab extends PluginSettingTab {
  plugin: RavenHogwartsToolkitPlugin;
  root: Root | null = null;
  private currentView: ToolkitId | 'overview' = 'overview';
  
  constructor(app: App, plugin: RavenHogwartsToolkitPlugin) {
    super(app, plugin);
    this.plugin = plugin;
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
    this.currentView = 'overview';
  }

  private renderContent() {
    this.root?.render(
      <React.StrictMode>
        <div className="rht-settings-container">
          {this.currentView === 'overview' ? (
            <ToolkitOverview 
              plugin={this.plugin}
              onNavigateToDetail={(moduleId) => {
                this.currentView = moduleId as ToolkitId;
                this.renderContent();
              }}
            />
          ) : (
            <ToolkitDetailSettings
              app={this.app}
              plugin={this.plugin}
              moduleId={this.currentView}
              onNavigateBack={() => {
                this.currentView = 'overview';
                this.renderContent();
              }}
            />
          )}
        </div>
      </React.StrictMode>
    );
  }
}