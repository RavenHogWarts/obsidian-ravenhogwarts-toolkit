import { IToolkitModule } from "@/src/core/interfaces/types";
import { BaseManager } from "@/src/core/services/BaseManager";
import { FolderTemplatesService } from "../services/FolderTemplatesService";
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
	private templatesService: FolderTemplatesService;

	constructor(plugin: any, moduleId: string, settings: any) {
		super(plugin, moduleId, settings);
		this.templatesService = new FolderTemplatesService(
			this.app,
			this.logger
		);
	}

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

		this.registerEvent(this.app.vault.on("create", () => {}));
	}

	protected onConfigChange(): void {
		this.unregisterEvents();
		this.registerEventHandlers();
	}

	/**
	 * 获取模板服务实例（供外部使用）
	 */
	public getTemplatesService(): FolderTemplatesService {
		return this.templatesService;
	}
}
