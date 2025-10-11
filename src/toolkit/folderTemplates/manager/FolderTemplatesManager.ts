import { IToolkitModule } from "@/src/core/interfaces/types";
import { BaseManager } from "@/src/core/services/BaseManager";
import { Notice, TFile, normalizePath } from "obsidian";
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

/**
 * 文件处理上下文接口
 */
interface FileProcessingContext {
	originalFile: TFile;
	folderPath: string;
	templates: IFolderTemplate[];
	fileName: string;
}

/**
 * 模板上下文接口
 */
interface TemplateContext extends FileProcessingContext {
	matchingTemplate: IFolderTemplate;
	templatesFolderPath: string;
	variables: Record<string, string>;
}

/**
 * 文件夹模板管理器
 *
 * 重构后的处理流程：
 * 1. 监听文件创建事件 (vault.on('create'))
 * 2. 防抖和并发控制，防止重复处理
 * 3. 验证文件有效性和查找匹配模板
 * 4. 如果需要重命名，先进行文件重命名操作
 * 5. 在单个 vault.process 调用中原子性地执行模板应用
 *
 * 核心改进：
 * - 所有文件内容修改都在 vault.process 中进行，确保原子性
 * - 简化了并发控制机制，移除全局锁
 * - 重命名操作在模板应用前进行，避免文件引用不一致
 * - 更好的错误处理和用户反馈
 */
export class FolderTemplatesManager extends BaseManager<IFolderTemplatesModule> {
	private templatesService: FolderTemplatesService;
	private processingFiles: Map<string, Promise<void>> = new Map();
	private triggerOnFileCreationEvent: any;
	private lastProcessedTime: number = 0;
	private readonly DEBOUNCE_DELAY: number = 1000; // 1 second debounce

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
		this.unregisterEventHandlers();
	}

	protected onModuleCleanup(): void {}

	private registerCommands(): void {}

	protected registerEventHandlers(): void {
		if (!this.isEnabled()) return;

		// 使用 onLayoutReady 来确保事件在正确的时机注册（类似 Templater）
		this.app.workspace.onLayoutReady(() => {
			this.updateTriggerFileOnCreation();
		});
	}

	private unregisterEventHandlers(): void {
		if (this.triggerOnFileCreationEvent) {
			this.app.vault.offref(this.triggerOnFileCreationEvent);
			this.triggerOnFileCreationEvent = undefined;
		}
	}

	private updateTriggerFileOnCreation(): void {
		if (this.isEnabled()) {
			this.triggerOnFileCreationEvent = this.app.vault.on(
				"create",
				(file) => {
					if (file instanceof TFile) {
						this.handleFileCreate(file);
					}
				}
			);
			this.registerEvent(this.triggerOnFileCreationEvent);
		} else {
			this.unregisterEventHandlers();
		}
	}

	/**
	 * 处理文件创建事件 - 主入口方法
	 * 使用简化的并发控制机制：防抖 + 文件路径锁
	 */
	private async handleFileCreate(file: TFile): Promise<void> {
		// 只处理 markdown 文件
		if (!(file instanceof TFile) || file.extension !== "md") return;

		const filePath = file.path;
		const currentTime = Date.now();

		// 防抖机制，防止快速连续的文件创建事件
		if (currentTime - this.lastProcessedTime < this.DEBOUNCE_DELAY) {
			this.logger.debug(
				`File creation event too soon after last processing, skipping: ${filePath}`
			);
			return;
		}

		// 检查是否已经有相同的文件正在处理
		if (this.processingFiles.has(filePath)) {
			this.logger.debug(
				`File ${filePath} is already being processed, skipping`
			);
			return;
		}

		// 更新最后处理时间
		this.lastProcessedTime = currentTime;

		// 创建处理 Promise 并存储
		const processingPromise = this.processFileCreation(file);
		this.processingFiles.set(filePath, processingPromise);

		try {
			await processingPromise;
		} finally {
			// 处理完成后从 Map 中移除
			this.processingFiles.delete(filePath);
		}
	}

	/**
	 * 实际处理文件创建的逻辑
	 */
	private async processFileCreation(file: TFile): Promise<void> {
		try {
			// 1. 验证文件是否存在且有效
			const isValidFile = await this.validateFileExistence(file);
			if (!isValidFile) return;

			// 2. 验证和处理文件
			const processingContext = await this.validateAndPrepareFile(file);
			if (!processingContext) return;

			// 3. 查找匹配的模板
			const templateContext = await this.findMatchingTemplate(
				processingContext
			);
			if (!templateContext) return;

			// 4. 在vault.process中执行所有文件操作（应用模板和重命名）
			await this.executeTemplateApplicationInProcess(templateContext);
		} catch (error) {
			this.logger.error("Error processing file creation:", error);
		}
	}

	/**
	 * 验证文件是否存在且有效
	 */
	private async validateFileExistence(file: TFile): Promise<boolean> {
		// 检查文件是否仍然存在
		const currentFile = this.app.vault.getAbstractFileByPath(file.path);
		if (!currentFile || !(currentFile instanceof TFile)) {
			this.logger.debug(`File no longer exists, skipping: ${file.path}`);
			return false;
		}

		// 文件大小限制，防止处理过大的文件
		const SIZE_LIMIT = 100_000; // 100KB
		if (file.stat.size > SIZE_LIMIT) {
			this.logger.debug(
				`Skipped template application for ${file.path} because file size exceeds ${SIZE_LIMIT} bytes`
			);
			return false;
		}

		return true;
	}

	/**
	 * 验证和准备文件处理上下文
	 */
	private async validateAndPrepareFile(
		file: TFile
	): Promise<FileProcessingContext | null> {
		const folderPath = file.parent?.path || "";
		const templates = this.data?.templates || [];

		if (templates.length === 0) {
			this.logger.debug("No templates configured");
			return null;
		}

		// 检查文件夹是否在忽略列表中
		if (this.isFolderIgnored(folderPath)) {
			this.logger.debug(
				`Folder is in ignored list, skipping template application: ${folderPath}`
			);
			return null;
		}

		return {
			originalFile: file,
			folderPath,
			templates,
			fileName: file.basename,
		};
	}

	/**
	 * 检查文件夹是否在忽略列表中
	 */
	private isFolderIgnored(folderPath: string): boolean {
		const ignoredFolders = this.config?.ignoredFolders || [];

		if (ignoredFolders.length === 0) {
			return false;
		}

		const normalizedFolderPath = normalizePath(folderPath);

		for (const ignoredFolder of ignoredFolders) {
			const normalizedIgnoredPath = normalizePath(ignoredFolder);

			// 精确匹配
			if (normalizedFolderPath === normalizedIgnoredPath) {
				return true;
			}

			// 子文件夹匹配 - 检查当前文件夹是否是忽略文件夹的子目录
			if (
				normalizedIgnoredPath.length > 0 &&
				normalizedFolderPath.startsWith(normalizedIgnoredPath + "/")
			) {
				return true;
			}

			// 特殊处理根目录
			if (
				(normalizedIgnoredPath === "" ||
					normalizedIgnoredPath === "/") &&
				normalizedFolderPath === ""
			) {
				return true;
			}
		}

		return false;
	}

	/**
	 * 查找匹配的模板并准备模板上下文
	 */
	private async findMatchingTemplate(
		context: FileProcessingContext
	): Promise<TemplateContext | null> {
		const matchingTemplate = this.templatesService.findMatchingTemplate(
			context.folderPath,
			context.templates
		);

		if (!matchingTemplate) {
			this.logger.debug(
				`No matching template found for folder: ${context.folderPath}`
			);
			return null;
		}

		const templatesFolderPath =
			this.config?.templatesFolderPath ||
			this.templatesService.getDefaultTemplatesFolderPath();

		if (!templatesFolderPath) {
			this.logger.warn("Templates folder path not configured");
			return null;
		}

		// 生成模板变量
		const templateVariables =
			this.templatesService.generateTemplateVariables(context.fileName);

		// 转换变量类型
		const variables = this.convertTemplateVariables(templateVariables);

		return {
			...context,
			matchingTemplate,
			templatesFolderPath,
			variables,
		};
	}

	/**
	 * 在vault.process中执行模板应用和文件重命名
	 *
	 * 核心原理：
	 * 1. 先检查是否需要重命名文件，如果需要则先进行重命名
	 * 2. 使用 vault.process 确保文件内容修改的原子性
	 * 3. 在 process 回调中检查文件当前状态，避免覆盖用户内容
	 * 4. 所有操作都有完整的错误处理和用户反馈
	 *
	 * 这种方式遵循 Obsidian 最佳实践，类似于 Templater 插件的实现
	 */
	private async executeTemplateApplicationInProcess(
		context: TemplateContext
	): Promise<void> {
		const {
			originalFile,
			matchingTemplate,
			templatesFolderPath,
			variables,
			fileName,
		} = context;

		try {
			// 短暂延迟确保文件创建完成
			await new Promise((resolve) => setTimeout(resolve, 300));

			// 检查文件是否仍然存在
			let currentFile = this.app.vault.getAbstractFileByPath(
				originalFile.path
			);
			if (!currentFile || !(currentFile instanceof TFile)) {
				this.logger.debug(
					`File no longer exists, skipping: ${originalFile.path}`
				);
				return;
			}

			// 准备模板内容
			const templateData = await this.prepareTemplateContent(
				matchingTemplate,
				templatesFolderPath,
				variables
			);
			if (!templateData) return;

			// 计算目标文件名
			const newFileName = this.templatesService.generateFileName(
				matchingTemplate,
				variables,
				fileName
			);

			// 如果需要重命名文件，先进行重命名操作
			if (newFileName !== fileName) {
				const renamedFile =
					await this.renameFileBeforeTemplateApplication(
						currentFile,
						newFileName
					);
				if (!renamedFile) {
					// 重命名失败，使用原文件继续处理
					this.logger.warn(
						`File rename failed, continuing with original file: ${currentFile.path}`
					);
				} else {
					// 更新文件引用
					currentFile = renamedFile;
				}
			}

			// 在vault.process中应用模板内容
			await this.app.vault.process(
				currentFile as TFile,
				(currentContent) => {
					// 如果文件已经有实质性内容，不应用模板
					if (currentContent.trim().length > 0) {
						this.logger.debug(
							`File already has content, skipping template application: ${
								(currentFile as TFile).path
							}`
						);
						return currentContent; // 返回原内容，不做修改
					}

					// 应用模板内容
					this.logger.info(
						`Applied template to file: ${
							(currentFile as TFile).path
						}`
					);
					return templateData.processedContent;
				}
			);

			// 显示成功通知
			new Notice(`已应用模板到文件: ${(currentFile as TFile).name}`);
		} catch (error) {
			this.handleProcessingError(error, originalFile.path);
		}
	}

	/**
	 * 准备模板内容
	 */
	private async prepareTemplateContent(
		template: IFolderTemplate,
		templatesFolderPath: string,
		variables: Record<string, string>
	): Promise<{ processedContent: string } | null> {
		try {
			// 构建模板文件完整路径
			const templateFilePath = `${templatesFolderPath}/${template.TemplateFile}`;
			const templateFile = await this.templatesService.getTemplateFile(
				templateFilePath
			);

			if (!templateFile) {
				this.logger.warn(
					`Template file not found: ${templateFilePath}`
				);
				return null;
			}

			// 读取模板内容
			const templateContent =
				await this.templatesService.readTemplateContent(templateFile);

			// 替换模板变量
			const processedContent =
				this.templatesService.replaceTemplateVariables(
					templateContent,
					variables
				);

			return { processedContent };
		} catch (error) {
			this.logger.error(`Failed to prepare template content:`, error);
			return null;
		}
	}

	/**
	 * 在模板应用前重命名文件
	 */
	private async renameFileBeforeTemplateApplication(
		file: TFile,
		newFileName: string
	): Promise<TFile | null> {
		const parentPath = file.parent?.path || "";
		const newFilePath = normalizePath(
			parentPath ? `${parentPath}/${newFileName}.md` : `${newFileName}.md`
		);

		// 检查目标文件是否已存在
		const existingFile = this.app.vault.getAbstractFileByPath(newFilePath);
		if (existingFile) {
			this.logger.warn(`Target file already exists: ${newFilePath}`);
			new Notice(`目标文件已存在: ${newFileName}.md`);
			return null;
		}

		try {
			await this.app.vault.rename(file, newFilePath);
			this.logger.info(
				`File renamed from ${file.name} to ${newFileName}.md`
			);

			// 重新获取重命名后的文件对象
			const renamedFile =
				this.app.vault.getAbstractFileByPath(newFilePath);
			if (renamedFile instanceof TFile) {
				return renamedFile;
			}

			this.logger.error(`Failed to get renamed file: ${newFilePath}`);
			return null;
		} catch (error) {
			this.logger.error(
				`Failed to rename file from ${file.path} to ${newFilePath}:`,
				error
			);
			new Notice(
				`文件重命名失败: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
			return null;
		}
	}

	/**
	 * 在模板应用后重命名文件
	 */
	private async renameFileAfterTemplateApplication(
		file: TFile,
		newFileName: string
	): Promise<void> {
		const parentPath = file.parent?.path || "";
		const newFilePath = normalizePath(
			parentPath ? `${parentPath}/${newFileName}.md` : `${newFileName}.md`
		);

		// 检查目标文件是否已存在
		const existingFile = this.app.vault.getAbstractFileByPath(newFilePath);
		if (existingFile) {
			this.logger.warn(`Target file already exists: ${newFilePath}`);
			new Notice(`目标文件已存在: ${newFileName}.md`);
			return;
		}

		try {
			await this.app.vault.rename(file, newFilePath);
			this.logger.info(
				`File renamed from ${file.name} to ${newFileName}.md`
			);
		} catch (error) {
			this.logger.error(
				`Failed to rename file from ${file.path} to ${newFilePath}:`,
				error
			);
			new Notice(
				`文件重命名失败: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * 处理处理过程中的错误
	 */
	private handleProcessingError(error: any, filePath: string): void {
		// 处理各种错误类型
		if ((error as any).code === "ENOENT") {
			this.logger.debug(
				`File operation failed due to ENOENT, likely deleted by another process: ${filePath}`
			);
			return; // 静默处理 ENOENT 错误
		}

		if (
			error instanceof Error &&
			error.message.includes("no such file or directory")
		) {
			this.logger.debug(
				`File operation failed, file likely deleted by another process: ${filePath}`
			);
			return; // 静默处理文件不存在错误
		}

		this.logger.error(`Failed to process file ${filePath}:`, error);

		// 只在不是文件系统相关错误时显示通知
		if (
			!(error as any).code &&
			!error.message.includes("no such file") &&
			!error.message.includes("ENOENT")
		) {
			new Notice(
				`处理文件失败: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		}
	}

	/**
	 * 转换模板变量类型
	 */
	private convertTemplateVariables(
		templateVariables: Record<string, string | undefined>
	): Record<string, string> {
		const variables: Record<string, string> = {};
		for (const [key, value] of Object.entries(templateVariables)) {
			if (value !== undefined) {
				variables[key] = value;
			}
		}
		return variables;
	}

	protected onConfigChange(): void {
		this.unregisterEventHandlers();
		this.registerEventHandlers();
	}

	/**
	 * 获取模板服务实例（供外部使用）
	 */
	public getTemplatesService(): FolderTemplatesService {
		return this.templatesService;
	}
}
