import { LL } from "@src/i18n/i18n";
import RHTPlugin from "@src/main";
import type { ITool } from "@src/model/toolkit/ITool";
import {
	PluginSettingTab as ObPluginSettingTab,
	type SettingDefinitionItem,
	type SettingDefinitionPage,
} from "obsidian";

export class PluginSettingTab extends ObPluginSettingTab {
	plugin: RHTPlugin;
	icon: string = "gavel";

	constructor(plugin: RHTPlugin) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const toolkit = this.plugin.toolkitManager.getToolkit();

		return toolkit.map((tool) => this.buildToolPage(tool));
	}

	private buildToolPage(tool: ITool): SettingDefinitionPage {
		const enabledKey = `toolkit.${tool.info.id}.enabled`;
		const toolItems: SettingDefinitionItem[] = tool.getSettingItems();

		return {
			type: "page",
			name: tool.info.name,
			desc: tool.info.description,
			status: () => (tool.isEnabled() ? null : "warning"),
			items: [
				{
					name: LL.common.enabled(),
					desc: LL.common.enabledDesc(),
					control: {
						type: "toggle" as const,
						key: enabledKey,
						defaultValue: false,
					},
				},
				...toolItems,
			],
		};
	}

	getControlValue(key: string): unknown {
		const parts = key.split(".");
		let current: unknown = this.plugin.settings;
		for (const part of parts) {
			if (current == null || typeof current !== "object")
				return undefined;
			current = (current as Record<string, unknown>)[part];
		}
		return current;
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const match = key.match(/^toolkit\.(.+)\.enabled$/);
		if (match) {
			const toolId = match[1];
			const manager = this.plugin.toolkitManager;
			if (value) {
				await manager.enableTool(toolId);
			} else {
				await manager.disableTool(toolId);
			}
			this.update();
			return;
		}

		const parts = key.split(".");
		const settings = this.plugin.settings;
		let current: unknown = settings;
		for (let i = 0; i < parts.length - 1; i++) {
			if (current == null || typeof current !== "object") return;
			current = (current as Record<string, unknown>)[parts[i]];
		}
		if (current != null && typeof current === "object") {
			(current as Record<string, unknown>)[parts[parts.length - 1]] =
				value;
		}
		await this.plugin.saveSettings();
	}
}
