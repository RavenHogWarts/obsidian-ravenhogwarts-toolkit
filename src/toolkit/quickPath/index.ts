import { LL } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import {
	Editor,
	Menu,
	normalizePath,
	TFile,
	TFolder,
	type SettingDefinitionItem,
} from "obsidian";
import { DefaultSettings, ISettings, pathSeparators } from "./types";

@Toolkit({
	id: "quick-path",
	name: LL.settings.quick_path.name(),
	icon: "link",
	version: "1.0.0",
	description: LL.settings.quick_path.desc(),
})
export class QuickPath extends BaseTool<ISettings> {
	private basePath: string;

	getDefaultSettings(): ISettings {
		return DefaultSettings;
	}

	getSettingItems(): SettingDefinitionItem[] {
		const id = this.info.id;

		return [
			{
				name: LL.settings.quick_path.addEditorMenu.name(),
				desc: LL.settings.quick_path.addEditorMenu.desc(),
				control: {
					type: "toggle" as const,
					key: `toolkit.${id}.config.addEditorMenu`,
					defaultValue: DefaultSettings.config.addEditorMenu,
				},
			},
			{
				name: LL.settings.quick_path.addFileMenu.name(),
				desc: LL.settings.quick_path.addFileMenu.desc(),
				control: {
					type: "toggle" as const,
					key: `toolkit.${id}.config.addFileMenu`,
					defaultValue: DefaultSettings.config.addFileMenu,
				},
			},
			{
				name: LL.settings.quick_path.useAbsolutePath.name(),
				desc: LL.settings.quick_path.useAbsolutePath.desc(),
				control: {
					type: "toggle" as const,
					key: `toolkit.${id}.config.useAbsolutePath`,
					defaultValue: DefaultSettings.config.useAbsolutePath,
				},
			},
			{
				name: LL.settings.quick_path.pathSeparator.name(),
				desc: LL.settings.quick_path.pathSeparator.desc(),
				control: {
					type: "dropdown" as const,
					key: `toolkit.${id}.config.pathSeparator`,
					defaultValue: DefaultSettings.config.pathSeparator,
					options: {
						[pathSeparators.newline]:
							LL.settings.quick_path.pathSeparator.newline(),
						[pathSeparators.comma]:
							LL.settings.quick_path.pathSeparator.comma(),
						[pathSeparators.semicolon]:
							LL.settings.quick_path.pathSeparator.semicolon(),
						[pathSeparators.space]:
							LL.settings.quick_path.pathSeparator.space(),
					},
				},
			},
		];
	}

	async onload(): Promise<void> {
		await super.onload();
		// `basePath` is an undocumented property on the data adapter (desktop
		// only, not in the public typings).
		const adapter = this.context._app.vault.adapter as unknown as {
			basePath: string;
		};
		this.basePath = adapter.basePath.replace(/\\/g, "/");
		this.registerCommands();
		this.registerEventHandlers();
	}

	private registerCommands() {
		this.registerCommand({
			id: "copy_current_file_path",
			name: LL.command.quick_path.copy_current_file_path(),
			callback: () => {
				const activeFile = this.context._app.workspace.getActiveFile();
				if (activeFile) {
					const path = this.getPath(activeFile);
					this.copyToClipboard(path);
				}
			},
		});

		this.registerCommand({
			id: "copy_current_folder_path",
			name: LL.command.quick_path.copy_current_folder_path(),
			callback: () => {
				const activeFile = this.context._app.workspace.getActiveFile();
				const activeFolder =
					activeFile && this.getParentPath(activeFile);
				if (activeFolder) {
					this.copyToClipboard(activeFolder);
				} else {
					this.context.notice(
						LL.notice.quick_path.root_path_warning(),
					);
				}
			},
		});
	}

	private registerEventHandlers(): void {
		if (!this.isEnabled()) {
			return;
		}

		if (this.settings.config.addFileMenu) {
			this.registerEvent(
				this.context._app.workspace.on(
					"file-menu",
					this.handleFileMenu.bind(this),
				),
			);

			this.registerEvent(
				this.context._app.workspace.on(
					"files-menu",
					this.handleFilesMenu.bind(this),
				),
			);
		}

		if (this.settings.config.addEditorMenu) {
			this.registerEvent(
				this.context._app.workspace.on(
					"editor-menu",
					this.handleEditorMenu.bind(this),
				),
			);
		}
	}

	private handleFileMenu(menu: Menu, file: TFile | TFolder): void {
		if (file instanceof TFolder) {
			this.addToolkitMenuItem(menu, (item) => {
				item.setTitle(LL.menu.quick_path.copy_folder_path());
				item.setIcon("copy");
				item.onClick(() => {
					const path = this.getPath(file);
					this.copyToClipboard(path);
				});
			});
		} else {
			this.addToolkitMenuItem(menu, (item) => {
				item.setTitle(LL.menu.quick_path.copy_file_path());
				item.setIcon("copy");
				item.onClick(() => {
					const path = this.getPath(file);
					this.copyToClipboard(path);
				});
			});
		}
	}

	private handleFilesMenu(menu: Menu, files: (TFile | TFolder)[]): void {
		this.addToolkitMenuItem(menu, (item) => {
			item.setTitle(LL.menu.quick_path.copy_files_path());
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
		this.addToolkitMenuItem(menu, (item) => {
			item.setTitle(LL.menu.quick_path.paste_current_file_path());
			item.setIcon("file-text");
			item.onClick(() => {
				const activeFile = this.context._app.workspace.getActiveFile();
				if (activeFile) {
					const path = this.getPath(activeFile);
					editor.replaceSelection(path);
				}
			});
		});
		this.addToolkitMenuItem(menu, (item) => {
			item.setTitle(LL.menu.quick_path.paste_current_folder_path());
			item.setIcon("folder");
			item.onClick(() => {
				const activeFile = this.context._app.workspace.getActiveFile();
				const activeFolder =
					activeFile && this.getParentPath(activeFile);
				if (activeFolder) {
					editor.replaceSelection(activeFolder);
				} else {
					this.context.notice(
						LL.notice.quick_path.root_path_warning(),
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
				this.context.notice(LL.notice.quick_path.copy_success());
			})
			.catch((err) => {
				this.context.notice(LL.notice.quick_path.copy_failure());
				throw err;
			});
	}

	onunload(): void {
		this.unregisterCommands();
		super.onunload();
	}
}
