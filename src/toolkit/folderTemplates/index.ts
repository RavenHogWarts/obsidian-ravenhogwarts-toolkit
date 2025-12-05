import { t } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import { normalizePath, TFile } from "obsidian";
import { TemplateProcessEngine } from "./service/TemplateProcessEngine";
import { Settings } from "./Settings";
import { DefaultSettings, ISettings } from "./types";
import { findMatchingTemplate } from "./util/findMatchingTemplate";

@Toolkit({
	id: "folder-templates",
	name: t("settings.folder_templates.name"),
	icon: "folder-cog",
	version: "1.0.0",
	description: t("settings.folder_templates.desc"),
})
export class FolderTemplates extends BaseTool<ISettings> {
	private triggerOnFileCreationEvent: any;

	getDefaultSettings(): ISettings {
		return DefaultSettings;
	}

	getSettingsComponent() {
		return Settings;
	}

	async onload(): Promise<void> {
		await super.onload();

		this.ensureTemplatesFolderPath();

		this.registerEventHandlers();
	}

	private ensureTemplatesFolderPath(): void {
		const templatesPlugin =
			this.context._app.internalPlugins.getEnabledPluginById("templates");
		if (templatesPlugin) {
			this.context._settingsStore.updateToolSettingByPath(
				this.info.id,
				"config.templatesFolderPath",
				// @ts-ignore
				templatesPlugin.options.folder
			);
		} else {
			this.context._settingsStore.updateToolSettingByPath(
				this.info.id,
				"config.templatesFolderPath",
				this.getDefaultSettings().config.templatesFolderPath
			);
		}
	}

	private registerEventHandlers(): void {
		if (!this.isEnabled()) {
			return;
		}

		// 使用 onLayoutReady 来确保事件在正确的时机注册（类似 Templater）
		this.context._app.workspace.onLayoutReady(() => {
			this.updateTriggerFileOnCreation();
		});
	}

	private updateTriggerFileOnCreation(): void {
		this.triggerOnFileCreationEvent = this.context._app.vault.on(
			"create",
			(file) => {
				if (file instanceof TFile) {
					this.handleFileCreate(file);
				}
			}
		);
	}

	private unregisterEventHandlers(): void {
		if (this.triggerOnFileCreationEvent) {
			this.context._app.vault.offref(this.triggerOnFileCreationEvent);
			this.triggerOnFileCreationEvent = undefined;
		}
	}

	private async handleFileCreate(file: TFile): Promise<void> {
		if (file.extension !== "md") {
			return;
		}

		const matchTemplate = findMatchingTemplate(
			file,
			this.settings.data.folderTemplates
		);

		if (!matchTemplate) {
			return;
		}

		const matchedTemplateContent = await this.context._app.vault.read(
			this.context._app.vault.getAbstractFileByPath(
				`${normalizePath(this.settings.config.templatesFolderPath)}/${
					matchTemplate.templateFile
				}`
			) as TFile
		);

		const engine = new TemplateProcessEngine();
		const templateContent = await engine.process(matchedTemplateContent);

		await this.context._app.vault.process(file, (content) => {
			if (content.trim().length > 0) {
				// 文件非空，不处理
				return content;
			}
			// 返回模板内容
			return templateContent;
		});
	}

	onunload(): void {
		this.unregisterEventHandlers();
		super.onunload();
	}
}
