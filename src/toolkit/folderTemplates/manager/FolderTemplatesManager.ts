import { IToolkitModule } from "@/src/core/interfaces/types";
import { BaseManager } from "@/src/core/services/BaseManager";
import { Menu, TFolder } from "obsidian";
import {
	FOLDER_TEMPLATES_DEFAULT_CONFIG,
	IFolderTemplatesConfig,
	IFolderTemplatesData,
} from "../types/config";

interface IFolderTemplatesModule extends IToolkitModule {
	config: IFolderTemplatesConfig;
	data: IFolderTemplatesData;
}

export class FolderTemplatesManager extends BaseManager<IFolderTemplatesModule> {
	protected getDefaultConfig(): IFolderTemplatesConfig {
		return FOLDER_TEMPLATES_DEFAULT_CONFIG;
	}

	protected async onModuleLoad(): Promise<void> {
		this.logger.info("Loading folder templates manager");
		this.registerCommands();
		this.registerEventHandlers();
	}

	protected onModuleUnload(): void {
		this.logger.info("Unloading folder templates manager");
	}

	protected onModuleCleanup(): void {}

	private registerCommands(): void {}

	protected registerEventHandlers(): void {
		if (!this.isEnabled()) return;

		this.registerEvent(
			this.app.workspace.on("files-menu", this.handleFilesMenu.bind(this))
		);
	}

	private handleFilesMenu(menu: Menu, files: TFolder): void {
		if (!this.isEnabled()) return;
		this.addMenuItem(menu, {
			title: "create file with templates",
			icon: "add",
			callback: () => {},
		});
	}

	protected onConfigChange(): void {
		this.unregisterEvents();
		this.registerEventHandlers();
	}
}
