import { Editor, Menu, TFile, TFolder } from "obsidian";
import { BaseManager } from "@/src/core/services/BaseManager";
import { IToolkitModule } from "@/src/core/interfaces/types";
import {
	IQuickPathConfig,
	IQuickPathData,
	QUICK_PATH_DEFAULT_CONFIG,
} from "../types/config";

interface IQuickPathModule extends IToolkitModule {
	config: IQuickPathConfig;
	data: IQuickPathData;
}

export class QuickPathManager extends BaseManager<IQuickPathModule> {
	private basePath: string;

	protected getDefaultConfig(): IQuickPathConfig {
		return QUICK_PATH_DEFAULT_CONFIG;
	}

	protected async onModuleLoad(): Promise<void> {
		this.logger.info("Loading quick path manager");
		this.basePath =
			(this.app.vault.adapter as any)
				.getBasePath()
				?.replace(/\\/g, "/") || "";

		this.registerCommands();
		this.registerEventHandlers();
	}

	protected onModuleUnload(): void {
		this.logger.info("Unloading quick path manager");
	}

	protected onModuleCleanup(): void {
		// 清理特定资源（如果有）
	}

	private registerCommands(): void {
		this.addCommand({
			id: "copyPath",
			name: this.t("toolkit.quickPath.command.copy_filePath"),
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					const path = this.getPath(activeFile);
					this.copyToClipboard(path);
				}
			},
		});

		this.addCommand({
			id: "copyParentPath",
			name: this.t("toolkit.quickPath.command.copy_folderPath"),
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				const parentPath = activeFile && this.getParentPath(activeFile);
				if (parentPath) {
					this.copyToClipboard(parentPath);
				} else {
					this.logger.notice(
						this.t("toolkit.quickPath.status.no_parent_path")
					);
				}
			},
		});
	}

	protected registerEventHandlers(): void {
		if (!this.isEnabled()) return;

		if (this.config.addFileMenu) {
			// 文件菜单（单个文件/文件夹）
			this.registerEvent(
				this.app.workspace.on(
					"file-menu",
					this.handleFileMenu.bind(this)
				)
			);

			// 文件菜单（多个文件）
			this.registerEvent(
				this.app.workspace.on(
					"files-menu",
					this.handleFilesMenu.bind(this)
				)
			);
		}

		if (this.config.addEditorMenu) {
			// 编辑器菜单
			this.registerEvent(
				this.app.workspace.on(
					"editor-menu",
					this.handleEditorMenu.bind(this)
				)
			);
		}
	}

	private handleFileMenu(menu: Menu, file: TFile | TFolder): void {
		if (!this.isEnabled()) return;
		if (!this.config.addFileMenu) return;

		if (file instanceof TFolder) {
			this.addMenuItem(menu, {
				title: this.t("toolkit.quickPath.file_menu.copy_folderPath"),
				icon: "folder-closed",
				callback: () => {
					const path = this.getPath(file);
					this.copyToClipboard(path);
				},
			});
		} else {
			this.addMenuItem(menu, {
				title: this.t("toolkit.quickPath.file_menu.copy_filePath"),
				icon: "file-text",
				callback: () => {
					const path = this.getPath(file);
					this.copyToClipboard(path);
				},
			});
		}
	}

	private handleFilesMenu(menu: Menu, files: (TFile | TFolder)[]): void {
		if (!this.isEnabled()) return;

		this.addMenuItem(menu, {
			title: this.t("toolkit.quickPath.file_menu.copy_filesPath"),
			icon: "copy",
			callback: () => {
				const paths = files
					.map((file) => this.getPath(file))
					.join(this.config.pathSeparator || "\n");
				this.copyToClipboard(paths);
			},
		});
	}

	private handleEditorMenu(menu: Menu, editor: Editor): void {
		if (!this.isEnabled()) return;
		if (!this.config.addEditorMenu) return;

		this.addMenuItem(
			menu,
			[
				{
					title: this.t(
						"toolkit.quickPath.editor_menu.paste_filePath"
					),
					icon: "copy",
					order: 1,
					callback: () => {
						const activeFile = this.app.workspace.getActiveFile();
						if (activeFile) {
							const path = this.getPath(activeFile);
							this.copyToClipboard(path, false);
							editor.replaceSelection(path);
						}
					},
				},
				{
					title: this.t(
						"toolkit.quickPath.editor_menu.paste_folderPath"
					),
					icon: "folder",
					order: 2,
					callback: () => {
						const activeFile = this.app.workspace.getActiveFile();
						const parentPath =
							activeFile && this.getParentPath(activeFile);
						if (parentPath) {
							this.copyToClipboard(parentPath, false);
							editor.replaceSelection(parentPath);
						} else {
							this.logger.notice(
								this.t(
									"toolkit.quickPath.status.no_parent_path"
								)
							);
						}
					},
				},
			],
			{ showSeparator: true }
		);
	}

	private getParentPath(file: TFile | TFolder): string | null {
		const path = this.config.useAbsolutePath
			? `${this.basePath}/${file.path}`
			: file.path;
		const lastSlashIndex = path.lastIndexOf("/");
		return lastSlashIndex === -1 ? null : path.substring(0, lastSlashIndex);
	}

	private getPath(file: TFile | TFolder): string {
		return this.config.useAbsolutePath
			? `${this.basePath}/${file.path}`
			: file.path;
	}

	private copyToClipboard(text: string, showNotice = true): void {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				this.logger.debug("Copied to clipboard:", text);
				if (showNotice) {
					this.logger.notice(
						this.t("toolkit.quickPath.status.copy_success")
					);
				}
			})
			.catch((error) => {
				this.logger.error("Failed to copy to clipboard", error);
				if (showNotice) {
					this.logger.notice(
						this.t("toolkit.quickPath.status.copy_failed")
					);
				}
			});
	}

	protected onConfigChange(): void {
		// 配置变更时重新注册事件处理器
		this.unregisterEvents();
		this.registerEventHandlers();
	}
}
