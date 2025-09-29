import { IToolkitModule } from "@/src/core/interfaces/types";
import { BaseManager } from "@/src/core/services/BaseManager";
import { Notice, TFile } from "obsidian";
import { FolderTemplatesService } from "../services/FolderTemplatesService";
import {
	FOLDER_TEMPLATES_DEFAULT_CONFIG,
	IFolderTemplate,
	IFolderTemplatesConfig,
	IFolderTemplatesData,
} from "../types/config";

interface IFolderTemplatesModule extends IToolkitModule {
	config: IFolderTemplatesConfig;
	data: IFolderTemplatesData;
}

export class FolderTemplatesManager extends BaseManager<IFolderTemplatesModule> {
	private templatesService: FolderTemplatesService;
	private isProcessingFile: boolean = false;

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

		// 监听文件创建事件
		this.registerEvent(
			this.app.vault.on("create", (file) => {
				if (file instanceof TFile) {
					this.handleFileCreate(file);
				}
			})
		);
	}

	/**
	 * 处理文件创建事件
	 */
	private async handleFileCreate(file: TFile): Promise<void> {
		// 避免重复处理
		if (this.isProcessingFile) return;

		// 只处理 markdown 文件
		if (!(file instanceof TFile) || file.extension !== "md") return;

		this.isProcessingFile = true;

		try {
			// 获取文件所在文件夹
			const folderPath = file.parent?.path || "";

			// 获取模板配置
			const templates = this.data?.templates || [];
			if (templates.length === 0) {
				this.isProcessingFile = false;
				return;
			}

			// 查找匹配的模板
			const matchingTemplate = this.templatesService.findMatchingTemplate(
				folderPath,
				templates
			);

			if (matchingTemplate) {
				// 获取模板文件夹路径
				const templatesFolderPath =
					this.config?.templatesFolderPath ||
					this.templatesService.getDefaultTemplatesFolderPath();

				if (templatesFolderPath) {
					// 应用模板
					await this.applyTemplateToFile(
						file,
						matchingTemplate,
						templatesFolderPath
					);
				}
			}
		} catch (error) {
			this.logger.error("Error handling file creation:", error);
		} finally {
			this.isProcessingFile = false;
		}
	}

	/**
	 * 对文件应用模板
	 */
	private async applyTemplateToFile(
		file: TFile,
		template: IFolderTemplate,
		templatesFolderPath: string
	): Promise<void> {
		try {
			// 等待一小段时间确保文件创建完成
			await new Promise((resolve) => setTimeout(resolve, 100));

			// 读取当前文件内容（可能是空文件）
			const currentContent = await this.app.vault.read(file);

			// 如果文件已经有内容（不只是空行或空白字符），不应用模板（避免覆盖用户输入）
			if (currentContent.trim().length > 0) {
				this.logger.debug(
					`File already has content, skipping template application: ${file.path}`
				);
				return;
			}

			// 构建模板文件完整路径
			const templateFilePath = `${templatesFolderPath}/${template.TemplateFile}`;
			const templateFile = await this.templatesService.getTemplateFile(
				templateFilePath
			);

			if (!templateFile) {
				this.logger.warn(
					`Template file not found: ${templateFilePath}`
				);
				return;
			}

			// 读取模板内容
			const templateContent =
				await this.templatesService.readTemplateContent(templateFile);

			// 生成模板变量
			const fileName = file.basename;
			const variables =
				this.templatesService.generateTemplateVariables(fileName);

			// 替换模板变量
			const processedContent =
				this.templatesService.replaceTemplateVariables(
					templateContent,
					variables
				);

			// 检查是否需要重命名文件（如果有文件名规则）
			const newFileName = this.templatesService.generateFileName(
				template,
				variables,
				fileName
			);

			// 如果文件名需要改变，先重命名文件
			if (newFileName !== fileName) {
				const newFilePath = `${
					file.parent?.path || ""
				}/${newFileName}.md`;
				await this.app.vault.rename(file, newFilePath);
				// 重新获取重命名后的文件对象
				const renamedFile =
					this.app.vault.getAbstractFileByPath(newFilePath);
				if (renamedFile instanceof TFile) {
					// 更新重命名后文件的内容
					await this.app.vault.modify(renamedFile, processedContent);
				}
			} else {
				// 更新文件内容
				await this.app.vault.modify(file, processedContent);
			}

			this.logger.info(`Applied template to file: ${file.path}`);

			// 显示通知
			new Notice(`已应用模板到文件: ${file.name}`);
		} catch (error) {
			this.logger.error(
				`Failed to apply template to file ${file.path}:`,
				error
			);
			new Notice(`应用模板失败: ${error.message}`);
		}
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
