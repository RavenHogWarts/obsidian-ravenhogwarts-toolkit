import { LL } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import { IPluginContext } from "@src/model/toolkit/IPluginContext";
import { reactSetting } from "@src/settings/reactSetting";
import {
	type EventRef,
	normalizePath,
	TFile,
	type SettingDefinitionItem,
} from "obsidian";
import { createElement } from "react";
import { shouldApplyRule } from "./service/applyPolicy";
import { findMatchingRule } from "./service/RuleMatcher";
import { buildVariableContext } from "./service/variableContext";
import { VariableEngine } from "./service/VariableEngine";
import { RulesEditor } from "./settings/RulesEditor";
import { DefaultSettings, IFolderTemplateRule, ISettings } from "./types";
import { migrateSettings, needsMigration } from "./util/migrate";

/** 文件名中不允许出现的字符 */
const ILLEGAL_FILENAME_CHARS = /[\\/:*?"<>|#^[\]]/g;

@Toolkit({
	id: "folder-templates",
	name: LL.settings.folder_templates.name(),
	icon: "folder-cog",
	version: "2.0.0",
	description: LL.settings.folder_templates.desc(),
})
export class FolderTemplates extends BaseTool<ISettings> {
	private triggerOnFileCreationEvent: EventRef | undefined;
	/** 本会话内已处理过的文件路径，避免同一文件被重复套用模板（重入/重复 create 事件） */
	private readonly processedPaths = new Set<string>();

	getDefaultSettings(): ISettings {
		return DefaultSettings;
	}

	async initialize(context: IPluginContext): Promise<void> {
		// 迁移必须在 loadToolSettings 的默认值合并之前执行，
		// 否则旧结构的 data.folderTemplates 会被合并逻辑丢弃
		const raw = context._settingsStore.getToolSettings("folder-templates");
		if (raw && needsMigration(raw)) {
			await context._settingsStore.updateSettingByPath(
				"toolkit.folder-templates",
				migrateSettings(raw)
			);
		}
		await super.initialize(context);
	}

	// ---- 事件处理 ----

	async onload(): Promise<void> {
		await super.onload();
		this.registerEventHandlers();
	}

	onunload(): void {
		this.unregisterEventHandlers();
		super.onunload();
	}

	private registerEventHandlers(): void {
		if (!this.isEnabled()) {
			return;
		}
		// onLayoutReady 之后注册，避开 vault 初始化时的批量 create 事件
		this.context._app.workspace.onLayoutReady(() => {
			this.triggerOnFileCreationEvent = this.context._app.vault.on(
				"create",
				async (file) => {
					if (file instanceof TFile) {
						await this.handleFileCreate(file);
					}
				}
			);
		});
	}

	private unregisterEventHandlers(): void {
		if (this.triggerOnFileCreationEvent) {
			this.context._app.vault.offref(this.triggerOnFileCreationEvent);
			this.triggerOnFileCreationEvent = undefined;
		}
		this.processedPaths.clear();
	}

	/** 模板相对路径的基准目录：用户配置 > 官方 Templates 插件配置 > "templates" */
	private getTemplatesBasePath(): string {
		const configured = this.settings.config.templatesFolderPath;
		if (configured && configured.trim() !== "") {
			return normalizePath(configured);
		}
		const internalPlugins = (
			this.context._app as unknown as {
				internalPlugins: {
					getEnabledPluginById(id: string): {
						options: { folder?: string };
					} | null;
				};
			}
		).internalPlugins;
		const templatesPlugin = internalPlugins.getEnabledPluginById("templates");
		const folder = templatesPlugin?.options?.folder;
		return normalizePath(folder && folder.trim() !== "" ? folder : "templates");
	}

	private resolveTemplateFile(templateFile: string): TFile | null {
		const path = templateFile.includes("/")
			? normalizePath(templateFile)
			: `${this.getTemplatesBasePath()}/${templateFile}`;
		const file = this.context._app.vault.getAbstractFileByPath(path);
		return file instanceof TFile ? file : null;
	}

	private async handleFileCreate(file: TFile): Promise<void> {
		if (!this.isEnabled() || file.extension !== "md") {
			return;
		}

		// 同一路径本会话只处理一次，避免重复 create 事件或重入导致的反复套用
		if (this.processedPaths.has(file.path)) {
			return;
		}
		this.processedPaths.add(file.path);

		const rule = findMatchingRule(this.settings.data.rules, {
			parentPath: file.parent?.path ?? "",
			basename: file.basename,
		});
		if (!rule) {
			return;
		}

		const templateFile = this.resolveTemplateFile(rule.templateFile);
		if (!templateFile) {
			this.context.log(
				"warn",
				`Template file not found: ${rule.templateFile}`,
				this.info.id
			);
			return;
		}

		// 先判定整条规则是否应作用于该文件：empty-only 模式下非空文件应完全不动
		// （既不套模板也不重命名），避免出现"改了名却没套模板"的割裂行为。
		const content = await this.context._app.vault.read(file);
		if (!shouldApplyRule(rule.applyMode, content.trim().length === 0)) {
			return;
		}

		try {
			if (rule.renameFormat && rule.renameFormat.trim() !== "") {
				await this.applyRename(file, rule.renameFormat);
				// 重命名后 file.path 已更新，标记新路径避免其触发的事件再次处理
				this.processedPaths.add(file.path);
			}
			await this.applyTemplate(file, templateFile, rule);
		} catch (error) {
			this.addError(error as Error);
			this.context.log(
				"error",
				"Failed to apply folder template",
				this.info.id,
				error
			);
		}
	}

	/** 先重命名再填充模板，使模板中的 ${notename} 反映新文件名 */
	private async applyRename(file: TFile, format: string): Promise<void> {
		const engine = new VariableEngine(
			buildVariableContext(this.context._app, file)
		);
		const rendered = engine
			.render(format)
			.replace(ILLEGAL_FILENAME_CHARS, "")
			.trim();
		if (!rendered || rendered === file.basename) {
			return;
		}

		const parent = file.parent?.path ?? "";
		const prefix = parent === "" || parent === "/" ? "" : `${parent}/`;
		let target = `${prefix}${rendered}.${file.extension}`;
		let index = 0;
		while (this.context._app.vault.getAbstractFileByPath(target)) {
			index += 1;
			target = `${prefix}${rendered}-${String(index).padStart(2, "0")}.${file.extension}`;
		}
		await this.context._app.fileManager.renameFile(file, target);
	}

	private async applyTemplate(
		file: TFile,
		templateFile: TFile,
		rule: IFolderTemplateRule
	): Promise<void> {
		const raw = await this.context._app.vault.read(templateFile);
		const engine = new VariableEngine(
			buildVariableContext(this.context._app, file)
		);
		const rendered = engine.render(raw);

		await this.context._app.vault.process(file, (content) => {
			if (content.trim().length === 0) {
				return rendered;
			}
			if (rule.applyMode === "prepend") {
				return `${rendered}\n${content}`;
			}
			return content;
		});
	}

	// ---- 设置界面 ----

	getSettingItems(): SettingDefinitionItem[] {
		const id = this.info.id;
		const T = LL.settings.folder_templates;

		return [
			{
				name: T.templatesFolderPath.name(),
				desc: T.templatesFolderPath.desc(),
				control: {
					type: "folder" as const,
					key: `toolkit.${id}.config.templatesFolderPath`,
					defaultValue: "",
				},
			},
			// 规则编辑器为 React 岛：本地状态 + 异步落盘，不触发 settingTab.update()，
			// 因而避免整页重渲染（修复删除、选模板文件、改匹配条件"重载"三个问题）。
			reactSetting(T.rules.name(), () =>
				createElement(RulesEditor, {
					app: this.context._app,
					initialRules: this.settings.data.rules,
					getTemplatesBasePath: () => this.getTemplatesBasePath(),
					persist: (rules: IFolderTemplateRule[]) => {
						void this.context._settingsStore.updateToolSettingByPath(
							this.info.id,
							"data.rules",
							rules
						);
					},
				})
			),
		];
	}
}
