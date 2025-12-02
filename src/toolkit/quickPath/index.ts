import { t } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import { Editor, Menu, normalizePath, TFile, TFolder } from "obsidian";
import { Settings } from "./Settings";
import { DefaultSettings, ISettings } from "./types";

@Toolkit({
	id: "quick-path",
	name: t("settings.quick_path.name"),
	version: "1.0.0",
	description: t("settings.quick_path.desc"),
})
export class QuickPath extends BaseTool {
	private basePath: string;

	getDefaultSettings(): ISettings {
		return DefaultSettings;
	}

	getSettingsComponent() {
		return Settings;
	}

	async onload(): Promise<void> {
		await super.onload();
		this.basePath = this.context._app.vault.adapter.basePath.replace(
			/\\/g,
			"/"
		);
		this.registerCommands();
		this.registerEventHandlers();
	}

	private registerCommands() {
		this.context._plugin.addCommand({
			id: "quick_path-copy_current_file_path",
			name: `[${t("settings.quick_path.name")}] ${t(
				"command.quick_path.copy_current_file_path"
			)}`,
			callback: () => {
				const activeFile = this.context._app.workspace.getActiveFile();
				if (activeFile) {
					const path = this.getPath(activeFile);
					this.copyToClipboard(path);
				}
			},
		});

		this.context._plugin.addCommand({
			id: "quick_path-copy_current_folder_path",
			name: `[${t("settings.quick_path.name")}] ${t(
				"command.quick_path.copy_current_folder_path"
			)}`,
			callback: () => {
				const activeFile = this.context._app.workspace.getActiveFile();
				const activeFolder =
					activeFile && this.getParentPath(activeFile);
				if (activeFolder) {
					this.copyToClipboard(activeFolder);
				} else {
					this.context.notice(
						t("notice.quick_path.root_path_warning")
					);
				}
			},
		});
	}

	private unregisterCommands() {
		this.context._plugin.removeCommand("quick_path-copy_current_file_path");
		this.context._plugin.removeCommand(
			"quick_path-copy_current_folder_path"
		);
	}

	private registerEventHandlers(): void {
		if (!this.isEnabled()) {
			return;
		}

		if (this.settings.config.addFileMenu) {
			this.registerEvent(
				this.context._app.workspace.on(
					"file-menu",
					this.handleFileMenu.bind(this)
				)
			);

			this.registerEvent(
				this.context._app.workspace.on(
					"files-menu",
					this.handleFilesMenu.bind(this)
				)
			);
		}

		if (this.settings.config.addEditorMenu) {
			this.registerEvent(
				this.context._app.workspace.on(
					"editor-menu",
					this.handleEditorMenu.bind(this)
				)
			);
		}
	}

	private handleFileMenu(menu: Menu, file: TFile | TFolder): void {
		// title,open,action-primary,action,info,view,system,danger
		if (file instanceof TFolder) {
			menu.addItem((item) => {
				item.setSection("info");
				item.setTitle(t("menu.quick_path.copy_folder_path"));
				item.setIcon("copy");
				item.onClick(() => {
					const path = this.getPath(file);
					this.copyToClipboard(path);
				});
			});
		} else {
			menu.addItem((item) => {
				item.setSection("info");
				item.setTitle(t("menu.quick_path.copy_file_path"));
				item.setIcon("copy");
				item.onClick(() => {
					const path = this.getPath(file);
					this.copyToClipboard(path);
				});
			});
		}
	}

	private handleFilesMenu(menu: Menu, files: (TFile | TFolder)[]): void {
		menu.addItem((item) => {
			item.setSection("info");
			item.setTitle(t("menu.quick_path.copy_files_path"));
			item.setIcon("copy");
			item.onClick(() => {
				const path = files
					.map((file) => this.getPath(file))
					.join(this.settings.config.pathSeparator);
				this.copyToClipboard(path);
			});
		});
	}

	private handleEditorMenu(menu: Menu, editor: Editor): void {
		// title,correction,spellcheck,open,selection-link,selection,selection.format,selection.paragraph,selection.paragraph.list,selection.paragraph.heading,selection.paragraph.block,selection.insert.basic,selection.insert.advanced,insert,clipboard,info,action,view,selection.format.basic,selection.format.advanced,selection.format.danger,danger
		menu.addItem((item) => {
			item.setSection("action");
			item.setTitle(t("menu.quick_path.paste_current_file_path"));
			item.setIcon("file-text");
			item.onClick(() => {
				const activeFile = this.context._app.workspace.getActiveFile();
				if (activeFile) {
					const path = this.getPath(activeFile);
					editor.replaceSelection(path);
				}
			});
		});
		menu.addItem((item) => {
			item.setSection("action");
			item.setTitle(t("menu.quick_path.paste_current_folder_path"));
			item.setIcon("folder");
			item.onClick(() => {
				const activeFile = this.context._app.workspace.getActiveFile();
				const activeFolder =
					activeFile && this.getParentPath(activeFile);
				if (activeFolder) {
					editor.replaceSelection(activeFolder);
				} else {
					this.context.notice(
						t("notice.quick_path.root_path_warning")
					);
				}
			});
		});
	}

	private getPath(file: TFile | TFolder): string {
		return this.settings.config.useAbsolutePath
			? normalizePath(`${this.basePath}/${file.path}`)
			: normalizePath(file.path);
	}

	private getParentPath(file: TFile | TFolder): string | null {
		const path = this.getPath(file);
		const lastSlashIndex = path.lastIndexOf("/");
		if (lastSlashIndex === -1) {
			return null;
		}
		return normalizePath(path.substring(0, lastSlashIndex));
	}

	private copyToClipboard(text: string): void {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				this.context.notice(t("notice.quick_path.copy_success"));
			})
			.catch((err) => {
				this.context.notice(t("notice.quick_path.copy_failure"));
				throw err;
			});
	}

	onunload(): void {
		this.unregisterCommands();
		super.onunload();
	}
}
