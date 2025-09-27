import { Logger } from "@/src/core/services/Log";
import { App, normalizePath, Notice, TFile, TFolder } from "obsidian";
import { IFolderTemplate } from "../types/config";

/**
 * 模板变量接口
 */
interface ITemplateVariables {
	title?: string;
	date?: string;
	time?: string;
	timestamp?: string;
	[key: string]: string | undefined;
}

/**
 * 文件夹模板服务
 * 负责处理模板文件的读取、变量替换、文件创建等功能
 */
export class FolderTemplatesService {
	constructor(private app: App, private logger: Logger) {}

	/**
	 * 获取默认模板文件夹路径
	 * 如果存在官方模板插件设置，使用其路径，否则使用默认值
	 */
	getDefaultTemplatesFolderPath(): string {
		return this.app.internalPlugins.plugins.templates.instance.options
			.folder;
	}

	/**
	 * 获取指定路径下的所有模板文件
	 * @param templatesFolderPath 模板文件夹路径
	 * @returns 模板文件列表
	 */
	async getTemplateFiles(templatesFolderPath: string): Promise<TFile[]> {
		if (!templatesFolderPath.trim()) {
			return [];
		}

		const normalizedPath = normalizePath(templatesFolderPath);
		const templateFolder =
			this.app.vault.getAbstractFileByPath(normalizedPath);

		if (!templateFolder || !(templateFolder instanceof TFolder)) {
			this.logger.warn(`Template folder not found: ${normalizedPath}`);
			return [];
		}

		const templateFiles: TFile[] = [];

		// 递归获取文件夹下的所有 markdown 文件
		const collectFiles = (folder: TFolder) => {
			for (const child of folder.children) {
				if (child instanceof TFile && child.extension === "md") {
					templateFiles.push(child);
				} else if (child instanceof TFolder) {
					collectFiles(child);
				}
			}
		};

		collectFiles(templateFolder);
		return templateFiles;
	}

	/**
	 * 根据文件夹路径查找匹配的模板
	 * @param folderPath 目标文件夹路径
	 * @param templates 模板配置列表
	 * @returns 匹配的模板，如果没有匹配则返回 null
	 */
	findMatchingTemplate(
		folderPath: string,
		templates: IFolderTemplate[]
	): IFolderTemplate | null {
		const normalizedFolderPath = normalizePath(folderPath);

		// 按文件夹路径匹配长度排序，优先匹配更具体的路径
		const sortedTemplates = templates.sort(
			(a, b) => b.Folder.length - a.Folder.length
		);

		for (const template of sortedTemplates) {
			const normalizedTemplatePath = normalizePath(template.Folder);

			// 精确匹配或者是子文件夹匹配
			if (
				normalizedFolderPath === normalizedTemplatePath ||
				normalizedFolderPath.startsWith(normalizedTemplatePath + "/")
			) {
				return template;
			}
		}

		return null;
	}

	/**
	 * 检查模板文件是否存在
	 * @param templateFilePath 模板文件路径
	 * @returns 模板文件对象，如果不存在返回 null
	 */
	async getTemplateFile(templateFilePath: string): Promise<TFile | null> {
		if (!templateFilePath.trim()) {
			return null;
		}

		const normalizedPath = normalizePath(templateFilePath);
		const file = this.app.vault.getAbstractFileByPath(normalizedPath);

		if (file instanceof TFile) {
			return file;
		}

		this.logger.warn(`Template file not found: ${normalizedPath}`);
		return null;
	}

	/**
	 * 读取模板文件内容
	 * @param templateFile 模板文件
	 * @returns 模板内容
	 */
	async readTemplateContent(templateFile: TFile): Promise<string> {
		try {
			return await this.app.vault.read(templateFile);
		} catch (error) {
			this.logger.error(
				`Failed to read template file: ${templateFile.path}`,
				error
			);
			throw new Error(`无法读取模板文件: ${templateFile.path}`);
		}
	}

	/**
	 * 生成模板变量
	 * @param fileName 文件名（不含扩展名）
	 * @param customVariables 自定义变量
	 * @returns 模板变量对象
	 */
	generateTemplateVariables(
		fileName?: string,
		customVariables?: Record<string, string>
	): ITemplateVariables {
		const now = new Date();

		const variables: ITemplateVariables = {
			title: fileName || "",
			date: now.toISOString().split("T")[0], // YYYY-MM-DD
			time: now.toTimeString().split(" ")[0], // HH:MM:SS
			timestamp: now.toISOString(),
			// 兼容官方模板插件的变量格式
			"{{date}}": now.toISOString().split("T")[0],
			"{{time}}": now.toTimeString().split(" ")[0],
			"{{title}}": fileName || "",
			// 添加更多常用的日期格式
			"{{date:YYYY-MM-DD}}": now.toISOString().split("T")[0],
			"{{date:MM-DD-YYYY}}": `${String(now.getMonth() + 1).padStart(
				2,
				"0"
			)}-${String(now.getDate()).padStart(2, "0")}-${now.getFullYear()}`,
			"{{date:DD/MM/YYYY}}": `${String(now.getDate()).padStart(
				2,
				"0"
			)}/${String(now.getMonth() + 1).padStart(
				2,
				"0"
			)}/${now.getFullYear()}`,
			// 中文日期格式
			"{{date:YYYY年MM月DD日}}": `${now.getFullYear()}年${String(
				now.getMonth() + 1
			).padStart(2, "0")}月${String(now.getDate()).padStart(2, "0")}日`,
		};

		// 合并自定义变量
		if (customVariables) {
			Object.assign(variables, customVariables);
		}

		return variables;
	}

	/**
	 * 替换模板内容中的变量
	 * @param content 模板内容
	 * @param variables 变量对象
	 * @returns 替换变量后的内容
	 */
	replaceTemplateVariables(
		content: string,
		variables: ITemplateVariables
	): string {
		let result = content;

		// 替换所有变量
		for (const [key, value] of Object.entries(variables)) {
			if (value !== undefined) {
				// 支持多种变量格式
				const patterns = [
					new RegExp(`\\{\\{${key}\\}\\}`, "g"), // {{variable}}
					new RegExp(`\\{\\{\\{${key}\\}\\}\\}`, "g"), // {{{variable}}}
					new RegExp(`<\\%\\s*${key}\\s*\\%>`, "g"), // <% variable %>
				];

				for (const pattern of patterns) {
					result = result.replace(pattern, value);
				}
			}
		}

		return result;
	}

	/**
	 * 生成文件名
	 * @param template 模板配置
	 * @param variables 模板变量
	 * @param defaultName 默认文件名
	 * @returns 生成的文件名
	 */
	generateFileName(
		template: IFolderTemplate,
		variables: ITemplateVariables,
		defaultName: string
	): string {
		if (!template.FileNameRule || !template.FileNameRule.trim()) {
			return defaultName;
		}

		const fileName = this.replaceTemplateVariables(
			template.FileNameRule,
			variables
		);

		// 确保文件名合法（移除非法字符）
		return fileName.replace(/[<>:"/\\|?*]/g, "-");
	}

	/**
	 * 创建基于模板的新文件
	 * @param folderPath 目标文件夹路径
	 * @param fileName 文件名（不含扩展名）
	 * @param template 模板配置
	 * @param templatesFolderPath 模板文件夹路径
	 * @param customVariables 自定义变量
	 * @returns 创建的文件对象
	 */
	async createFileFromTemplate(
		folderPath: string,
		fileName: string,
		template: IFolderTemplate,
		templatesFolderPath: string,
		customVariables?: Record<string, string>
	): Promise<TFile | null> {
		try {
			// 构建模板文件完整路径
			const templateFilePath = normalizePath(
				`${templatesFolderPath}/${template.TemplateFile}`
			);
			const templateFile = await this.getTemplateFile(templateFilePath);

			if (!templateFile) {
				new Notice(`模板文件不存在: ${templateFilePath}`);
				return null;
			}

			// 读取模板内容
			const templateContent = await this.readTemplateContent(
				templateFile
			);

			// 生成模板变量
			const variables = this.generateTemplateVariables(
				fileName,
				customVariables
			);

			// 替换模板变量
			const processedContent = this.replaceTemplateVariables(
				templateContent,
				variables
			);

			// 生成最终文件名
			const finalFileName = this.generateFileName(
				template,
				variables,
				fileName
			);

			// 构建完整文件路径
			const filePath = normalizePath(`${folderPath}/${finalFileName}.md`);

			// 检查文件是否已存在
			const existingFile = this.app.vault.getAbstractFileByPath(filePath);
			if (existingFile) {
				new Notice(`文件已存在: ${filePath}`);
				return null;
			}

			// 创建文件
			const newFile = await this.app.vault.create(
				filePath,
				processedContent
			);

			this.logger.info(`Created file from template: ${filePath}`);
			new Notice(`已创建文件: ${finalFileName}.md`);

			return newFile;
		} catch (error) {
			this.logger.error("Failed to create file from template", error);
			new Notice(`创建文件失败: ${error.message}`);
			return null;
		}
	}

	/**
	 * 验证模板配置
	 * @param template 模板配置
	 * @param templatesFolderPath 模板文件夹路径
	 * @returns 验证结果和错误信息
	 */
	async validateTemplate(
		template: IFolderTemplate,
		templatesFolderPath: string
	): Promise<{
		isValid: boolean;
		errors: string[];
	}> {
		const errors: string[] = [];

		// 检查必要字段
		if (!template.Folder || !template.Folder.trim()) {
			errors.push("文件夹路径不能为空");
		}

		if (!template.TemplateFile || !template.TemplateFile.trim()) {
			errors.push("模板文件不能为空");
		}

		// 检查文件夹是否存在
		if (template.Folder && template.Folder.trim()) {
			const normalizedFolderPath = normalizePath(template.Folder);
			const folder =
				this.app.vault.getAbstractFileByPath(normalizedFolderPath);
			if (!folder || !(folder instanceof TFolder)) {
				errors.push(`目标文件夹不存在: ${normalizedFolderPath}`);
			}
		}

		// 检查模板文件是否存在
		if (
			template.TemplateFile &&
			template.TemplateFile.trim() &&
			templatesFolderPath
		) {
			const templateFilePath = normalizePath(
				`${templatesFolderPath}/${template.TemplateFile}`
			);
			const templateFile = await this.getTemplateFile(templateFilePath);
			if (!templateFile) {
				errors.push(`模板文件不存在: ${templateFilePath}`);
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * 获取可用的模板文件选项（用于设置界面）
	 * @param templatesFolderPath 模板文件夹路径
	 * @returns 模板文件选项列表
	 */
	async getTemplateFileOptions(
		templatesFolderPath: string
	): Promise<Array<{ value: string; label: string }>> {
		const templateFiles = await this.getTemplateFiles(templatesFolderPath);
		const templatesFolderNormalized = normalizePath(templatesFolderPath);

		return templateFiles.map((file) => {
			// 计算相对于模板文件夹的路径
			const relativePath = file.path.startsWith(
				templatesFolderNormalized + "/"
			)
				? file.path.substring(templatesFolderNormalized.length + 1)
				: file.path;

			return {
				value: relativePath,
				label: `${file.basename} (${relativePath})`,
			};
		});
	}

	/**
	 * 获取文件夹选项（用于设置界面）
	 * @returns 文件夹选项列表
	 */
	getFolderOptions(): Array<{ value: string; label: string }> {
		const folders: Array<{ value: string; label: string }> = [];

		// 遍历所有文件夹
		this.app.vault.getAllLoadedFiles().forEach((file) => {
			if (file instanceof TFolder) {
				folders.push({
					value: file.path,
					label: file.path || "/", // 根文件夹显示为 /
				});
			}
		});

		// 按路径排序
		folders.sort((a, b) => a.value.localeCompare(b.value));

		return folders;
	}
}
