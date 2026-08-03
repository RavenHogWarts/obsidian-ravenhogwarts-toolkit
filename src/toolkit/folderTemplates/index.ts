import { LL } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import {
	type EventRef,
	normalizePath,
	TFile,
	type SettingDefinitionItem,
	type SettingDefinitionList,
} from "obsidian";
import { TemplateProcessEngine } from "./service/TemplateProcessEngine";
import { DefaultSettings, ISettings } from "./types";
import { findMatchingTemplate } from "./util/findMatchingTemplate";

@Toolkit({
	id: "folder-templates",
	name: LL.settings.folder_templates.name(),
	icon: "folder-cog",
	version: "1.0.0",
	description: LL.settings.folder_templates.desc(),
})
export class FolderTemplates extends BaseTool<ISettings> {
	private triggerOnFileCreationEvent: EventRef | undefined;

	getDefaultSettings(): ISettings {
		return DefaultSettings;
	}

	getSettingItems(): SettingDefinitionItem[] {
		const id = this.info.id;
		const { folderTemplates } = this.settings.data;

		const list: SettingDefinitionList = {
			type: "list",
			heading: LL.settings.folder_templates.folderTemplates.name(),
			emptyState: LL.common.noConfig(),
			addItem: {
				name: LL.common.add(),
				action: () => {
					const updated = [
						...folderTemplates,
						{ folder: "", templateFile: "" },
					];
					void this.context._settingsStore.updateToolSettingByPath(
						id,
						"data.folderTemplates",
						updated,
					);
					this.context.refreshSettingTab();
				},
			},
			onDelete: (index: number) => {
				const updated = [...folderTemplates];
				updated.splice(index, 1);
				void this.context._settingsStore.updateToolSettingByPath(
					id,
					"data.folderTemplates",
					updated,
				);
				this.context.refreshSettingTab();
			},
			items: folderTemplates.map((entry, index) => ({
				name: entry.folder || entry.templateFile || LL.common.add(),
				render: (setting) => {
					setting.addText((text) => {
						text.setPlaceholder("folder/path")
							.setValue(entry.folder)
							.onChange((value) => {
								const updated = [...folderTemplates];
								updated[index] = {
									...updated[index],
									folder: normalizePath(value),
								};
								void this.context._settingsStore.updateToolSettingByPath(
									id,
									"data.folderTemplates",
									updated,
								);
							});
					});
					setting.addText((text) => {
						text.setPlaceholder("template-file.md")
							.setValue(entry.templateFile)
							.onChange((value) => {
								const updated = [...folderTemplates];
								updated[index] = {
									...updated[index],
									templateFile: value,
								};
								void this.context._settingsStore.updateToolSettingByPath(
									id,
									"data.folderTemplates",
									updated,
								);
							});
					});
				},
			})),
		};

		return [
			{
				name: LL.settings.folder_templates.templatesFolderPath.name(),
				desc: LL.settings.folder_templates.templatesFolderPath.desc(),
				control: {
					type: "text" as const,
					key: `toolkit.${id}.config.templatesFolderPath`,
					defaultValue: DefaultSettings.config.templatesFolderPath,
				},
			},
			list,
		];
	}

	async onload(): Promise<void> {
		await super.onload();

		this.ensureTemplatesFolderPath();

		this.registerEventHandlers();
	}

	private ensureTemplatesFolderPath(): void {
		const internalPlugins = (
			this.context._app as unknown as {
				internalPlugins: {
					getEnabledPluginById(id: string): {
						options: { folder?: string };
					} | null;
				};
			}
		).internalPlugins;
		const templatesPlugin =
			internalPlugins.getEnabledPluginById("templates");
		if (templatesPlugin) {
			void this.context._settingsStore.updateToolSettingByPath(
				this.info.id,
				"config.templatesFolderPath",
				templatesPlugin.options.folder,
			);
		} else {
			void this.context._settingsStore.updateToolSettingByPath(
				this.info.id,
				"config.templatesFolderPath",
				this.getDefaultSettings().config.templatesFolderPath,
			);
		}
	}

	private registerEventHandlers(): void {
		if (!this.isEnabled()) {
			return;
		}

		this.context._app.workspace.onLayoutReady(() => {
			this.updateTriggerFileOnCreation();
		});
	}

	private updateTriggerFileOnCreation(): void {
		this.triggerOnFileCreationEvent = this.context._app.vault.on(
			"create",
			async (file) => {
				if (file instanceof TFile) {
					await this.handleFileCreate(file);
				}
			},
		);
	}

	private unregisterEventHandlers(): void {
		if (this.triggerOnFileCreationEvent) {
			this.context._app.vault.offref(
				this.triggerOnFileCreationEvent,
			);
			this.triggerOnFileCreationEvent = undefined;
		}
	}

	private async handleFileCreate(file: TFile): Promise<void> {
		if (file.extension !== "md") {
			return;
		}

		const matchTemplate = findMatchingTemplate(
			file,
			this.settings.data.folderTemplates,
		);

		if (!matchTemplate) {
			return;
		}

		const templatePath = `${normalizePath(this.settings.config.templatesFolderPath)}/${matchTemplate.templateFile}`;
		const templateFile =
			this.context._app.vault.getAbstractFileByPath(templatePath);
		if (!(templateFile instanceof TFile)) {
			return;
		}

		const matchedTemplateContent =
			await this.context._app.vault.read(templateFile);

		const engine = new TemplateProcessEngine();
		const templateContent = await engine.process(matchedTemplateContent);

		await this.context._app.vault.process(file, (content) => {
			if (content.trim().length > 0) {
				return content;
			}
			return templateContent;
		});
	}

	onunload(): void {
		this.unregisterEventHandlers();
		super.onunload();
	}
}
