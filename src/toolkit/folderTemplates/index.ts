import { LL } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import { IPluginContext } from "@src/model/toolkit/IPluginContext";
import { reactSetting } from "@src/settings/reactSetting";
import {
	type EventRef,
	MarkdownView,
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
	/**
	 * 只处理「创建时间距今小于该阈值」的文件，用于过滤掉插件加载时 vault
	 * 已存在文件触发的批量 create 事件，同时识别真正的新建。
	 */
	private static readonly CREATE_AGE_THRESHOLD_MS = 5000;
	/**
	 * 短时去重：以文件的 ctime 为 key 记录已处理项，TTL 内同 ctime 的二次触发
	 * （同一物理文件的重发或重命名衍生事件）直接跳过；过期后条目自动失效。
	 *
	 * 关键：去重 key 必须是 ctime 而非 path。重命名后原文件名（如「未命名」）
	 * 会被 Obsidian 复用给下一个新文件——若按 path 去重，新文件会因旧条目未过期
	 * 被误判为「重复事件」而漏处理，留下空壳文件。不同物理文件的 ctime 不同，
	 * 故按 ctime 去重既能挡住同文件重发，又不会误伤复用名的新文件。
	 */
	private readonly processedCtimes = new Map<string, number>();
	private static readonly INFLIGHT_TTL_MS = 10000;
	/** 等待新建文件初始打开的轮询间隔与总超时（见 waitForInitialOpen） */
	private static readonly OPEN_WAIT_INTERVAL_MS = 50;
	private static readonly OPEN_WAIT_TIMEOUT_MS = 2000;
	/** 编辑器持有文件后的额外静置，确保 setState→loadFile 的读取链走完 */
	private static readonly OPEN_SETTLE_DELAY_MS = 100;

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

	onload(): void {
		super.onload();
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
				(file) => {
					if (file instanceof TFile) {
						void this.handleFileCreate(file);
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
		this.processedCtimes.clear();
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

		const stat = file.stat;

		// ctime 时间窗：只处理「刚刚创建」的文件，挡掉 vault 启动时已存在文件
		// 触发的批量 create 事件，同时排除被其他工具反复触碰的旧文件。
		if (Date.now() - stat.ctime > FolderTemplates.CREATE_AGE_THRESHOLD_MS) {
			return;
		}

		// 短时去重：同一物理文件的 create 重发（或重命名衍生事件）共享相同
		// stat.ctime，以 ctime 为 key 去重即可。绝不能用 path——重命名后原名会
		// 被 Obsidian 复用给下一个新文件，按 path 去重会把新文件误判为重发而漏处理。
		const dedupeKey = String(stat.ctime);
		this.pruneProcessed();
		const seenExpiry = this.processedCtimes.get(dedupeKey);
		if (seenExpiry !== undefined && seenExpiry > Date.now()) {
			return;
		}
		this.processedCtimes.set(
			dedupeKey,
			Date.now() + FolderTemplates.INFLIGHT_TTL_MS
		);

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

		// 等 Obsidian 对新建文件的初始打开流程走完再动手（详见 waitForInitialOpen）。
		// 判定与套用放在等待之后：等待期间用户若已输入内容，下面的空文件判定
		// 能拿到最新缓存，避免对已非空的文件重命名。
		const opened = await this.waitForInitialOpen(file);
		if (
			!opened &&
			!(await this.context._app.vault.adapter.exists(file.path))
		) {
			// 等待期间文件已被删除：放弃处理
			return;
		}

		// 先判定整条规则是否应作用于该文件：empty-only 模式下非空文件应完全不动
		// （既不套模板也不重命名），避免出现"改了名却没套模板"的割裂行为。
		// 此处仅为判定而非修改，cachedRead 优先读内存缓存即可；新建空笔记在
		// 落盘前磁盘上可能不存在（Obsidian 先建索引后写文件），读取失败按空内容
		// 处理——未落盘的新笔记本就是空的，且后续 vault.process 回调会以真实
		// 内容重新校验，不会因此丢数据。
		let content = "";
		try {
			content = await this.context._app.vault.cachedRead(file);
		} catch {
			// 文件尚未落盘或已被删除：视为空文件，交由后续流程处理
		}
		if (!shouldApplyRule(rule.applyMode, content.trim().length === 0)) {
			return;
		}

		try {
			if (rule.renameFormat && rule.renameFormat.trim() !== "") {
				await this.applyRename(file, rule.renameFormat);
				// 重命名后 file.path 更新，但 stat.ctime 不变，去重仍由上面的
				// processedCtimes 条目（同 ctime）覆盖，无需额外记录新路径。
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

	/** 清理 processedCtimes 中已过期的条目，避免无界增长。 */
	private pruneProcessed(): void {
		const now = Date.now();
		for (const [key, expiry] of this.processedCtimes) {
			if (expiry <= now) {
				this.processedCtimes.delete(key);
			}
		}
	}

	/**
	 * 等待 Obsidian 完成对新建文件的初始打开。
	 *
	 * 新建笔记的内部流水线（createAbstractFile → afterCreate → openFile →
	 * setState → loadFile）在 create 事件之后才异步推进，而 loadFile 持有按
	 * 创建时路径（如「未命名.md」）的磁盘读取请求。若在 loadFile 读盘之前就
	 * 完成重命名，旧路径已不存在，loadFile 会抛 ENOENT，且编辑器停留在旧
	 * 文件名上。因此重命名/套模板必须等到「文件已落盘 且 已被某个 Markdown
	 * 编辑器视图持有」，再静置一小段时间让 setState→loadFile 的 promise 链
	 * 走完。
	 *
	 * 超时返回 false（后台/批量创建等不会有编辑器打开的场景）——此时不存在
	 * 即将发生的 loadFile，立即应用规则是安全的。
	 */
	private async waitForInitialOpen(file: TFile): Promise<boolean> {
		const deadline = Date.now() + FolderTemplates.OPEN_WAIT_TIMEOUT_MS;
		while (Date.now() < deadline) {
			if (
				(await this.context._app.vault.adapter.exists(file.path)) &&
				this.isHeldByEditor(file)
			) {
				await FolderTemplates.sleep(
					FolderTemplates.OPEN_SETTLE_DELAY_MS
				);
				return true;
			}
			await FolderTemplates.sleep(FolderTemplates.OPEN_WAIT_INTERVAL_MS);
		}
		return false;
	}

	/** 文件是否已被某个 Markdown 编辑器视图持有（初始打开已进入编辑器阶段）。 */
	private isHeldByEditor(file: TFile): boolean {
		let held = false;
		this.context._app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView && leaf.view.file === file) {
				held = true;
			}
		});
		return held;
	}

	private static sleep(ms: number): Promise<void> {
		return new Promise((resolve) => window.setTimeout(resolve, ms));
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
