import { Button } from "@/src/components/base/Button/Button";
import { Input } from "@/src/components/base/Input/Input";
import { SuggestionInput } from "@/src/components/base/Input/SuggestionInput";
import { SettingItem } from "@/src/components/base/Setting/SettingItem";
import { useModuleConfig } from "@/src/core/hooks/useModuleConfig";
import { useVaultSuggestions } from "@/src/core/hooks/useVaultSuggestions";
import { t } from "@/src/i18n/i18n";
import RavenHogwartsToolkitPlugin from "@/src/main";
import * as React from "react";
import { useEffect, useState } from "react";
import { FolderTemplatesManager } from "../../manager/FolderTemplatesManager";
import { IFolderTemplate, IFolderTemplatesConfig } from "../../types/config";
import "./styles/FolderTemplatesSettings.css";

interface FolderTemplatesSettingsProps {
	plugin: RavenHogwartsToolkitPlugin;
}

export const FolderTemplatesSettings: React.FC<
	FolderTemplatesSettingsProps
> = ({ plugin }) => {
	const { config } = useModuleConfig<IFolderTemplatesConfig>(
		plugin,
		"folderTemplates"
	);
	const { folderSuggestions } = useVaultSuggestions(plugin.app);

	// 获取模板数据和相关状态
	const [templates, setTemplates] = useState<IFolderTemplate[]>([]);
	const [templateFileOptions, setTemplateFileOptions] = useState<string[]>(
		[]
	);
	const [templatesPath, setTemplatesPath] = useState<string>("");
	const [isTemplatePluginEnabled, setIsTemplatePluginEnabled] =
		useState(false);

	// 编辑状态
	const [expandedIndex, setExpandedIndex] = useState<number>(-1);
	const [editingIndex, setEditingIndex] = useState<number>(-1);
	const [isAdding, setIsAdding] = useState(false);

	useEffect(() => {
		// 检查核心模板插件是否启用并获取路径
		const manager = plugin.getManager(
			"folderTemplates"
		) as FolderTemplatesManager;
		if (manager) {
			const service = manager.getTemplatesService();
			try {
				const path = service.getDefaultTemplatesFolderPath();
				setTemplatesPath(path || "");
				setIsTemplatePluginEnabled(!!path);
			} catch (error) {
				setIsTemplatePluginEnabled(false);
				setTemplatesPath("");
			}

			// 获取当前模板数据
			const moduleData = plugin.settings.toolkit.folderTemplates?.data;
			if (moduleData?.templates) {
				setTemplates(moduleData.templates);
			}
		}
	}, [plugin]);

	// 单独的useEffect来获取模板文件选项
	useEffect(() => {
		const manager = plugin.getManager(
			"folderTemplates"
		) as FolderTemplatesManager;
		if (manager && templatesPath && isTemplatePluginEnabled) {
			const service = manager.getTemplatesService();
			service
				.getTemplateFileOptions(templatesPath)
				.then((options) => {
					setTemplateFileOptions(options.map((opt) => opt.value));
				})
				.catch((error) => {
					console.error(
						"Failed to get template file options:",
						error
					);
					setTemplateFileOptions([]);
				});
		} else {
			setTemplateFileOptions([]);
		}
	}, [plugin, templatesPath, isTemplatePluginEnabled]);

	const handleUpdateTemplates = async (newTemplates: IFolderTemplate[]) => {
		try {
			const manager = plugin.getManager(
				"folderTemplates"
			) as FolderTemplatesManager;
			if (manager) {
				// 直接访问和更新数据
				const moduleSettings = plugin.settings.toolkit.folderTemplates;
				if (moduleSettings) {
					moduleSettings.data.templates = newTemplates;
					moduleSettings.data.lastModified = new Date().toISOString();
					await plugin.saveData(plugin.settings);
					setTemplates(newTemplates);
				}
			}
		} catch (err) {
			console.error("Failed to update templates:", err);
		}
	};

	const handleAddTemplate = () => {
		const newIndex = templates.length;
		setTemplates([
			...templates,
			{ Folder: "", TemplateFile: "", FileNameRule: "" },
		]);
		setEditingIndex(newIndex);
		setExpandedIndex(newIndex);
		setIsAdding(true);
	};

	const handleEditTemplate = (index: number) => {
		setEditingIndex(index);
		setExpandedIndex(index);
		setIsAdding(false);
	};

	const handleToggleExpand = (index: number) => {
		if (editingIndex === index) return; // 编辑时不允许折叠
		setExpandedIndex(expandedIndex === index ? -1 : index);
	};

	const handleSaveTemplate = async (
		index: number,
		template: IFolderTemplate
	) => {
		if (!template.Folder.trim() || !template.TemplateFile.trim()) {
			return;
		}

		const newTemplates = [...templates];
		newTemplates[index] = template;
		await handleUpdateTemplates(newTemplates);
		setEditingIndex(-1);
		setExpandedIndex(-1);
		setIsAdding(false);
	};

	const handleCancelEdit = () => {
		if (isAdding) {
			// 如果是新增状态，移除最后添加的空模板
			setTemplates(templates.slice(0, -1));
		}
		setEditingIndex(-1);
		setExpandedIndex(-1);
		setIsAdding(false);
	};

	const handleDeleteTemplate = async (index: number) => {
		const newTemplates = templates.filter((_, i) => i !== index);
		await handleUpdateTemplates(newTemplates);
		// 重置状态
		setEditingIndex(-1);
		setExpandedIndex(-1);
		setIsAdding(false);
	};

	const handleUpdateTemplate = (
		index: number,
		field: keyof IFolderTemplate,
		value: string
	) => {
		const newTemplates = [...templates];
		newTemplates[index] = { ...newTemplates[index], [field]: value };
		setTemplates(newTemplates);
	};

	return (
		<div className="folder-templates-settings">
			{/* 模板文件夹路径设置 */}
			<div className="template-folder-path-section">
				<SettingItem
					name={t(
						"toolkit.folderTemplates.settings.templatesFolderPath.title"
					)}
					desc={t(
						"toolkit.folderTemplates.settings.templatesFolderPath.description"
					)}
				>
					<div className="template-folder-path-input-container">
						<Input
							value={templatesPath}
							onChange={() => {}} // 不允许编辑
							placeholder={t(
								"toolkit.folderTemplates.settings.templatesFolderPath.placeholder"
							)}
							disabled
						/>
						{!isTemplatePluginEnabled && (
							<span className="template-folder-path-error">
								{t(
									"toolkit.folderTemplates.settings.templatesFolderPath.enablePlugin"
								)}
							</span>
						)}
					</div>
				</SettingItem>
			</div>

			{/* 模板管理设置 */}
			<SettingItem
				name={t(
					"toolkit.folderTemplates.settings.templateManagement.title"
				)}
				desc=""
			>
				<div className="template-management-section">
					<div className="template-management-header">
						<Button
							onClick={handleAddTemplate}
							disabled={!isTemplatePluginEnabled}
						>
							{t(
								"toolkit.folderTemplates.settings.templateManagement.addTemplate"
							)}
						</Button>
					</div>

					{/* 模板列表 */}
					{templates.length > 0 ? (
						<div className="template-list">
							{templates.map((template, index) => (
								<TemplateItem
									key={index}
									template={template}
									index={index}
									isExpanded={expandedIndex === index}
									isEditing={editingIndex === index}
									folderSuggestions={folderSuggestions}
									templateFileOptions={templateFileOptions}
									onToggleExpand={() =>
										handleToggleExpand(index)
									}
									onEdit={() => handleEditTemplate(index)}
									onSave={(template) =>
										handleSaveTemplate(index, template)
									}
									onCancel={handleCancelEdit}
									onDelete={() => handleDeleteTemplate(index)}
									onUpdate={(field, value) =>
										handleUpdateTemplate(
											index,
											field,
											value
										)
									}
									disabled={!isTemplatePluginEnabled}
								/>
							))}
						</div>
					) : (
						<div className="template-empty-state">
							<p>
								{isTemplatePluginEnabled
									? t(
											"toolkit.folderTemplates.settings.templateManagement.emptyState"
									  )
									: t(
											"toolkit.folderTemplates.settings.templateManagement.enablePluginFirst"
									  )}
							</p>
						</div>
					)}
				</div>
			</SettingItem>
		</div>
	);
};

interface TemplateItemProps {
	template: IFolderTemplate;
	index: number;
	isExpanded: boolean;
	isEditing: boolean;
	folderSuggestions: string[];
	templateFileOptions: string[];
	onToggleExpand: () => void;
	onEdit: () => void;
	onSave: (template: IFolderTemplate) => void;
	onCancel: () => void;
	onDelete: () => void;
	onUpdate: (field: keyof IFolderTemplate, value: string) => void;
	disabled?: boolean;
}

const TemplateItem: React.FC<TemplateItemProps> = ({
	template,
	index,
	isExpanded,
	isEditing,
	folderSuggestions,
	templateFileOptions,
	onToggleExpand,
	onEdit,
	onSave,
	onCancel,
	onDelete,
	onUpdate,
	disabled = false,
}) => {
	const handleSave = () => {
		onSave(template);
	};

	const renderSummary = (): React.ReactNode[] => {
		const items: React.ReactNode[] = [];

		if (template.Folder) {
			items.push(
				<span key="folder" className="template-summary-item">
					<span className="template-summary-label">
						{t(
							"toolkit.folderTemplates.settings.templateForm.targetFolder"
						)}
						:
					</span>
					<span>{template.Folder}</span>
				</span>
			);
		}
		if (template.TemplateFile) {
			items.push(
				<span key="template" className="template-summary-item">
					<span className="template-summary-label">
						{t(
							"toolkit.folderTemplates.settings.templateForm.templateFile"
						)}
						:
					</span>
					<span>{template.TemplateFile}</span>
				</span>
			);
		}
		if (template.FileNameRule) {
			items.push(
				<span key="rule" className="template-summary-item">
					<span className="template-summary-label">
						{t(
							"toolkit.folderTemplates.settings.templateForm.fileNameRule"
						)}
						:
					</span>
					<span>{template.FileNameRule}</span>
				</span>
			);
		}
		return items.length > 0
			? items
			: [
					<span key="empty" className="template-summary-item">
						<span className="template-summary-empty">未配置</span>
					</span>,
			  ];
	};

	return (
		<div className={`template-item ${isEditing ? "editing" : ""}`}>
			{/* 标题栏 */}
			<div
				className={`template-item-header ${
					isEditing ? "editing" : ""
				} ${isExpanded ? "expanded" : ""}`}
				onClick={!isEditing ? onToggleExpand : undefined}
			>
				<div className="template-item-title-section">
					<div className="template-item-title">
						{t(
							"toolkit.folderTemplates.settings.templateForm.title"
						)}{" "}
						{index + 1}
					</div>
					{!isExpanded && !isEditing && (
						<div className="template-item-summary">
							{renderSummary()}
						</div>
					)}
				</div>

				<div className="template-item-actions">
					{!isEditing && (
						<>
							<Button
								onClick={(e) => {
									e.stopPropagation();
									onEdit();
								}}
								size="small"
								disabled={disabled}
							>
								{t(
									"toolkit.folderTemplates.settings.templateManagement.editTemplate"
								)}
							</Button>
							<Button
								onClick={(e) => {
									e.stopPropagation();
									onDelete();
								}}
								size="small"
								variant="outline"
								disabled={disabled}
							>
								{t(
									"toolkit.folderTemplates.settings.templateManagement.deleteTemplate"
								)}
							</Button>
						</>
					)}
					{!isEditing && (
						<span
							className={`template-expand-arrow ${
								isExpanded ? "expanded" : ""
							}`}
						>
							▶
						</span>
					)}
				</div>
			</div>

			{/* 展开内容 */}
			{(isExpanded || isEditing) && (
				<div className="template-item-content">
					<div className="template-form-fields">
						{/* 目标文件夹 */}
						<SettingItem
							name={t(
								"toolkit.folderTemplates.settings.templateForm.targetFolder"
							)}
							desc=""
						>
							{isEditing ? (
								<SuggestionInput
									value={template.Folder}
									onChange={(value) =>
										onUpdate("Folder", value)
									}
									suggestions={folderSuggestions}
									placeholder={t(
										"toolkit.folderTemplates.settings.templateForm.selectFolder"
									)}
									disabled={disabled}
								/>
							) : (
								<span
									className={`template-form-value ${
										!template.Folder ? "empty" : ""
									}`}
								>
									{template.Folder || "/"}
								</span>
							)}
						</SettingItem>

						{/* 模板文件 */}
						<SettingItem
							name={t(
								"toolkit.folderTemplates.settings.templateForm.templateFile"
							)}
							desc=""
						>
							{isEditing ? (
								<SuggestionInput
									value={template.TemplateFile}
									onChange={(value) =>
										onUpdate("TemplateFile", value)
									}
									suggestions={templateFileOptions}
									placeholder={t(
										"toolkit.folderTemplates.settings.templateForm.selectTemplate"
									)}
									disabled={disabled}
								/>
							) : (
								<span
									className={`template-form-value ${
										!template.TemplateFile ? "empty" : ""
									}`}
								>
									{template.TemplateFile}
								</span>
							)}
						</SettingItem>

						{/* 文件名规则 */}
						<SettingItem
							name={t(
								"toolkit.folderTemplates.settings.templateForm.fileNameRule"
							)}
							desc={
								isEditing
									? t(
											"toolkit.folderTemplates.settings.templateForm.fileNameRuleDesc"
									  )
									: ""
							}
						>
							{isEditing ? (
								<Input
									value={template.FileNameRule || ""}
									onChange={(value) =>
										onUpdate("FileNameRule", value)
									}
									placeholder={t(
										"toolkit.folderTemplates.settings.templateForm.fileNameRulePlaceholder"
									)}
									disabled={disabled}
								/>
							) : (
								<span
									className={`template-form-value ${
										!template.FileNameRule ? "empty" : ""
									}`}
								>
									{template.FileNameRule}
								</span>
							)}
						</SettingItem>

						{/* 编辑模式下的操作按钮 */}
						{isEditing && (
							<div className="template-form-actions">
								<Button
									onClick={handleSave}
									disabled={disabled}
								>
									{t(
										"toolkit.folderTemplates.settings.templateManagement.saveTemplate"
									)}
								</Button>
								<Button onClick={onCancel} variant="outline">
									{t(
										"toolkit.folderTemplates.settings.templateManagement.cancel"
									)}
								</Button>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
