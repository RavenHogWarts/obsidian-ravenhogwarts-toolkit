import { LL } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import { reactSetting } from "@src/settings/reactSetting";
import {
	App,
	Menu,
	Modal,
	normalizePath,
	Setting,
	TAbstractFile,
	TFolder,
} from "obsidian";
import { createElement } from "react";
import {
	buildTargetPaths,
	collectSubPaths,
	filterNonExistent,
} from "./service/StructureBuilder";
import { parseStructure, serializeStructure } from "./service/clipboardStructure";
import { TemplatesEditor } from "./settings/TemplatesEditor";
import {
	createTemplate,
	DefaultSettings,
	ISettings,
	IStructureTemplate,
} from "./types";

@Toolkit({
	id: "folder-scaffolder",
	name: LL.settings.folder_scaffolder.name(),
	icon: "folder-tree",
	version: "1.1.0",
	description: LL.settings.folder_scaffolder.desc(),
})
export class FolderScaffolder extends BaseTool<ISettings> {
	/**
	 * 会话级缓存：最近一次「复制此文件夹结构」得到的相对路径列表。
	 * 用于同步决定右键菜单里「粘贴文件夹结构」是否显示（Obsidian 菜单是同步构建的，
	 * 无法在显示前 await 读取系统剪贴板）；真正粘贴时解析的是**真实系统剪贴板**，
	 * 解析失败才回退到这里。卸载/重载后失效，null 表示尚未复制任何结构。
	 */
	private lastCopied: string[] | null = null;

	getDefaultSettings(): ISettings {
		return DefaultSettings;
	}

	onload(): void {
		super.onload();
		this.registerCommands();
		this.registerEventHandlers();
	}

	onunload(): void {
		this.lastCopied = null; // 清理会话状态（其余由 Component 树自动清理）
		super.onunload();
	}

	// ---- 命令 ----

	private registerCommands(): void {
		// 从已保存模板创建结构（弹 Modal 选模板/位置/名称）
		this.registerCommand({
			id: "create-from-template",
			name: LL.command.folder_scaffolder.create_from_template(),
			callback: () => {
				const active = this.context._app.workspace.getActiveFile();
				this.openCreateModal(active?.parent?.path ?? "");
			},
		});

		// 粘贴剪贴板结构到当前激活文件所在目录
		this.registerCommand({
			id: "paste-structure",
			name: LL.command.folder_scaffolder.paste_structure(),
			callback: async () => {
				const active = this.context._app.workspace.getActiveFile();
				await this.pasteStructure(active?.parent?.path ?? "");
			},
		});
	}

	// ---- 右键文件夹菜单（4 项）----

	private registerEventHandlers(): void {
		if (!this.isEnabled()) {
			return;
		}
		this.registerEvent(
			this.context._app.workspace.on("file-menu", (menu, file) =>
				this.handleFileMenu(menu, file)
			)
		);
	}

	private handleFileMenu(menu: Menu, file: TAbstractFile): void {
		if (!(file instanceof TFolder)) {
			return; // 仅文件夹右键菜单
		}
		const submenu = this.context.getToolkitSubmenu(menu);
		const T = LL.menu.folder_scaffolder;

		// ① 从模版创建结构（打开 modal，默认克隆到右键文件夹下）
		submenu.addItem((item) => {
			item.setTitle(T.create_from_template());
			item.setIcon("folder-tree");
			item.onClick(() => this.openCreateModal(file.path));
		});

		// ② 复制此文件夹结构（写入系统剪贴板，带专属标识）
		submenu.addItem((item) => {
			item.setTitle(T.copy_structure());
			item.setIcon("copy");
			item.onClick(() => this.copyStructure(file));
		});

		// ③ 粘贴文件夹结构（仅当会话缓存有结构时显示；点击解析真实剪贴板）
		if (this.lastCopied && this.lastCopied.length > 0) {
			submenu.addItem((item) => {
				item.setTitle(T.paste_structure());
				item.setIcon("clipboard-paste");
				item.onClick(async () => {
					await this.pasteStructure(file.path);
				});
			});
		}

		// ④ 存为模板（保留）
		submenu.addSeparator();
		submenu.addItem((item) => {
			item.setTitle(T.save_as_template());
			item.setIcon("bookmark-plus");
			item.onClick(() => this.saveAsTemplate(file));
		});
	}

	// ---- ① 从模版创建结构（弹 Modal）----

	private openCreateModal(defaultParent: string): void {
		const templates = this.settings.data.templates.filter(
			(t) => t.enabled && t.snapshot.length > 0
		);
		if (templates.length === 0) {
			this.context.notice(LL.notice.folder_scaffolder.no_template());
			return;
		}
		new ScaffolderModal(
			this.context._app,
			templates,
			defaultParent,
			async (template, targetParent, newName) => {
				await this.createStructure(
					template.snapshot,
					targetParent,
					newName,
					(count) => LL.notice.folder_scaffolder.created({ count })
				);
			}
		).open();
	}

	// ---- ② 复制结构（写系统剪贴板）----

	/** 读取文件夹子目录相对路径，写进系统剪贴板（带专属标识），并缓存到会话 */
	private async copyStructure(folder: TFolder): Promise<void> {
		const paths = collectSubPaths(folder);
		if (paths.length === 0) {
			this.context.notice(LL.notice.folder_scaffolder.empty_structure());
			return;
		}
		this.lastCopied = paths;
		try {
			await navigator.clipboard.writeText(serializeStructure(paths));
		} catch (error) {
			// 系统剪贴板写入失败（如权限）仍保留会话缓存，本会话内粘贴可用
			this.context.log(
				"warn",
				"Failed to write clipboard, fallback to session cache",
				this.info.id,
				error
			);
		}
		this.context.notice(
			LL.notice.folder_scaffolder.copied({ count: paths.length })
		);
	}

	// ---- ③ 粘贴结构（解析真实剪贴板，回退会话缓存）----

	/**
	 * 解析系统剪贴板中本插件导出的结构并克隆到 targetParent 下。
	 * 解析失败（非本插件格式 / 读剪贴板异常）时回退到会话缓存 lastCopied。
	 */
	private async pasteStructure(targetParent: string): Promise<void> {
		let paths: string[] | null = null;
		try {
			const text = await navigator.clipboard.readText();
			paths = parseStructure(text);
		} catch {
			// 读剪贴板失败（权限/无焦点），继续走下面的会话缓存回退
		}
		if (!paths) {
			paths = this.lastCopied;
		}
		if (!paths || paths.length === 0) {
			this.context.notice(LL.notice.folder_scaffolder.paste_invalid());
			return;
		}
		await this.createStructure(
			paths,
			targetParent,
			undefined,
			(count) => LL.notice.folder_scaffolder.pasted({ count })
		);
	}

	// ---- ④ 存为模板（写持久化设置）----

	/** 把文件夹结构快照存为一条模板（弹小 Modal 命名） */
	private saveAsTemplate(folder: TFolder): void {
		const snapshot = collectSubPaths(folder);
		if (snapshot.length === 0) {
			this.context.notice(LL.notice.folder_scaffolder.empty_structure());
			return;
		}
		new SaveTemplateModal(
			this.context._app,
			folder.name,
			async (name) => {
				const template: IStructureTemplate = {
					...createTemplate(),
					name: name.trim() || folder.name,
					sourceFolder: folder.path,
					snapshot,
				};
				await this.updateData("templates", [
					...this.settings.data.templates,
					template,
				]);
				this.context.notice(LL.notice.folder_scaffolder.template_saved());
			}
		).open();
	}

	// ---- 执行：克隆（共享核心副作用）----

	/**
	 * 把子目录相对路径克隆到 targetParent 下。
	 * ①（模板）、③（剪贴板）两处统一走此方法。
	 *
	 * @param subPaths 子目录相对路径（来自 snapshot 或剪贴板）
	 * @param targetParent 目标父目录（vault 路径，空串表示 vault 根）
	 * @param newName 可选：顶层新文件夹名；省略则直接在 targetParent 下克隆子目录
	 * @param successNotice 可选：成功提示构造器（默认「已创建」）
	 */
	private async createStructure(
		subPaths: string[],
		targetParent: string,
		newName?: string,
		successNotice: (count: number) => string = (count) =>
			LL.notice.folder_scaffolder.created({ count })
	): Promise<void> {
		const app = this.context._app;
		const effectiveParent = newName
			? normalizePath(`${targetParent}/${newName}`)
			: normalizePath(targetParent);

		try {
			let targetPaths = buildTargetPaths(subPaths, effectiveParent);

			// 若提供 newName，先确保顶层目录存在
			if (
				newName &&
				!app.vault.getAbstractFileByPath(effectiveParent)
			) {
				await app.vault.createFolder(effectiveParent);
			}

			// 过滤已存在 + 逐个创建（顺序保证父先于子）
			targetPaths = filterNonExistent(targetPaths, (p) =>
				Boolean(app.vault.getAbstractFileByPath(p))
			);
			for (const path of targetPaths) {
				await app.vault.createFolder(path);
			}
			this.context.notice(successNotice(targetPaths.length));
		} catch (error) {
			this.addError(error as Error);
			this.context.log(
				"error",
				"Failed to scaffold folder structure",
				this.info.id,
				error
			);
			this.context.notice(LL.notice.folder_scaffolder.create_failed());
		}
	}

	// ---- 设置界面 ----

	getSettingItems() {
		return [
			reactSetting(LL.settings.folder_scaffolder.templates.name(), () =>
				createElement(TemplatesEditor, {
					app: this.context._app,
					initialTemplates: this.settings.data.templates,
					persist: (templates: IStructureTemplate[]) => {
						void this.context._settingsStore.updateToolSettingByPath(
							this.info.id,
							"data.templates",
							templates
						);
					},
				})
			),
		];
	}
}

// ---- Modal: 从模板创建结构 ----

class ScaffolderModal extends Modal {
	private selectedTemplate: IStructureTemplate;
	private targetParent: string;
	private newName = "";

	constructor(
		app: App,
		private readonly templates: IStructureTemplate[],
		defaultParent: string,
		private readonly onConfirm: (
			template: IStructureTemplate,
			targetParent: string,
			newName?: string
		) => Promise<void>
	) {
		super(app);
		this.selectedTemplate = templates[0];
		this.targetParent = defaultParent;
	}

	onOpen(): void {
		const { contentEl } = this;
		const T = LL.modal.folder_scaffolder;
		contentEl.createEl("h2", { text: T.scaffold_title() });

		new Setting(contentEl)
			.setName(T.select_template())
			.addDropdown((dd) => {
				dd.addOptions(
					Object.fromEntries(
						this.templates.map((t) => [
							t.id,
							t.name || t.sourceFolder,
						])
					)
				);
				dd.onChange((v) => {
					const found = this.templates.find((t) => t.id === v);
					if (found) {
						this.selectedTemplate = found;
					}
				});
			});

		new Setting(contentEl)
			.setName(T.target_parent())
			.setDesc(T.target_parent_desc())
			.addText((txt) => {
				txt.setValue(this.targetParent);
				txt.onChange((v) => (this.targetParent = v));
			});

		new Setting(contentEl)
			.setName(T.new_folder_name())
			.setDesc(T.new_folder_name_desc())
			.addText((txt) => {
				txt.setValue(this.newName);
				txt.onChange((v) => (this.newName = v));
			});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setCta()
				.setButtonText(T.confirm())
				.onClick(async () => {
					this.close();
					await this.onConfirm(
						this.selectedTemplate,
						this.targetParent,
						this.newName.trim() || undefined
					);
				})
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

// ---- Modal: 存为模板 ----

class SaveTemplateModal extends Modal {
	private name: string;

	constructor(
		app: App,
		defaultName: string,
		private readonly onConfirm: (name: string) => Promise<void>
	) {
		super(app);
		this.name = defaultName; // 默认填源文件夹名
	}

	onOpen(): void {
		const { contentEl } = this;
		const T = LL.modal.folder_scaffolder;
		contentEl.createEl("h2", { text: T.save_template_title() });

		new Setting(contentEl).setName(T.template_name()).addText((txt) => {
			txt.setValue(this.name);
			txt.onChange((v) => (this.name = v));
		});

		new Setting(contentEl).addButton((btn) =>
			btn
				.setCta()
				.setButtonText(T.save())
				.onClick(async () => {
					this.close();
					await this.onConfirm(this.name);
				})
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
