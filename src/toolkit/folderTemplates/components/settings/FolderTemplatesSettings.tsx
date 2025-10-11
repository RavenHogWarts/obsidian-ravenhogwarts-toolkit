import { Button } from "@/src/components/base/Button/Button";
import { Input } from "@/src/components/base/Input/Input";
import { SuggestionInput } from "@/src/components/base/Input/SuggestionInput";
import { SettingItem } from "@/src/components/base/Setting/SettingItem";
import { useModuleConfig } from "@/src/core/hooks/useModuleConfig";
import { useVaultSuggestions } from "@/src/core/hooks/useVaultSuggestions";
import { t } from "@/src/i18n/i18n";
import RavenHogwartsToolkitPlugin from "@/src/main";
import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderTemplatesManager } from "../../manager/FolderTemplatesManager";
import { IFolderTemplate, IFolderTemplatesConfig } from "../../types/config";
import "./styles/FolderTemplatesSettings.css";

interface FolderTemplatesSettingsProps {
	plugin: RavenHogwartsToolkitPlugin;
}

// 自定义 Hook 用于管理模板相关状态和逻辑
const useFolderTemplatesLogic = (
	plugin: RavenHogwartsToolkitPlugin,
	config: IFolderTemplatesConfig | undefined,
	updateConfig: (newConfig: Partial<IFolderTemplatesConfig>) => void
) => {
	const manager = useMemo(
		() => plugin.getManager("folderTemplates") as FolderTemplatesManager,
		[plugin]
	);

	const [templates, setTemplates] = useState<IFolderTemplate[]>([]);
	const [templateFileOptions, setTemplateFileOptions] = useState<string[]>(
		[]
	);
	const [templatesPath, setTemplatesPath] = useState<string>("");

	// 初始化数据
	useEffect(() => {
		if (!manager) return;

		const service = manager.getTemplatesService();
		const defaultPath =
			config?.templatesFolderPath ||
			service.getDefaultTemplatesFolderPath();
		setTemplatesPath(defaultPath);

		const moduleData = plugin.settings.toolkit.folderTemplates?.data;
		if (moduleData?.templates) {
			setTemplates(moduleData.templates);
		}
	}, [plugin, manager, config]);

	// 获取模板文件选项
	const refreshTemplateFileOptions = useCallback(
		async (path: string) => {
			if (!manager || !path) {
				setTemplateFileOptions([]);
				return;
			}

			const service = manager.getTemplatesService();
			const options = await service.getTemplateFileOptions(path);
			setTemplateFileOptions(options.map((opt) => opt.value));
		},
		[manager]
	);

	useEffect(() => {
		refreshTemplateFileOptions(templatesPath);
	}, [templatesPath, refreshTemplateFileOptions]);

	// 更新模板配置
	const updateTemplates = useCallback(
		async (newTemplates: IFolderTemplate[]) => {
			const moduleSettings = plugin.settings.toolkit.folderTemplates;
			if (moduleSettings) {
				moduleSettings.data.templates = newTemplates;
				moduleSettings.data.lastModified = new Date().toISOString();
				await plugin.saveData(plugin.settings);
				setTemplates(newTemplates);
			}
		},
		[plugin]
	);

	// 更新模板路径
	const updateTemplatesPath = useCallback(
		(newPath: string) => {
			setTemplatesPath(newPath);
			updateConfig({ templatesFolderPath: newPath });
			refreshTemplateFileOptions(newPath);
		},
		[updateConfig, refreshTemplateFileOptions]
	);

	return {
		templates,
		templateFileOptions,
		templatesPath,
		updateTemplates,
		updateTemplatesPath,
		setTemplates,
	};
};

export const FolderTemplatesSettings: React.FC<
	FolderTemplatesSettingsProps
> = ({ plugin }) => {
	const { config, updateConfig } = useModuleConfig<IFolderTemplatesConfig>(
		plugin,
		"folderTemplates"
	);
	const { folderSuggestions } = useVaultSuggestions(plugin.app);

	const {
		templates,
		templateFileOptions,
		templatesPath,
		updateTemplates,
		updateTemplatesPath,
		setTemplates,
	} = useFolderTemplatesLogic(plugin, config, updateConfig);

	// 编辑状态
	const [editingIndex, setEditingIndex] = useState<number>(-1);
	const [isAdding, setIsAdding] = useState(false);
	// 临时编辑数据，用于存储编辑过程中的数据，不影响原始数据
	const [editingTemplate, setEditingTemplate] =
		useState<IFolderTemplate | null>(null);

	// 模板操作方法
	const templateOperations = useMemo(
		() => ({
			add: () => {
				const newTemplate = {
					Folder: "",
					TemplateFile: "",
					FileNameRule: "",
				};
				setEditingIndex(templates.length);
				setEditingTemplate(newTemplate);
				setIsAdding(true);
			},

			edit: (index: number) => {
				// 复制当前模板数据到编辑状态
				setEditingTemplate({ ...templates[index] });
				setEditingIndex(index);
				setIsAdding(false);
			},

			save: async () => {
				if (!editingTemplate) return;

				if (
					!editingTemplate.Folder.trim() ||
					!editingTemplate.TemplateFile.trim()
				) {
					return;
				}

				const newTemplates = [...templates];

				if (isAdding) {
					// 添加新模板
					newTemplates.push(editingTemplate);
				} else {
					// 更新现有模板
					newTemplates[editingIndex] = editingTemplate;
				}

				await updateTemplates(newTemplates);
				setEditingIndex(-1);
				setEditingTemplate(null);
				setIsAdding(false);
			},

			cancel: () => {
				// 简单重置编辑状态，不修改原始数据
				setEditingIndex(-1);
				setEditingTemplate(null);
				setIsAdding(false);
			},

			delete: async (index: number) => {
				const newTemplates = templates.filter((_, i) => i !== index);
				await updateTemplates(newTemplates);
				setEditingIndex(-1);
				setEditingTemplate(null);
				setIsAdding(false);
			},

			update: (field: keyof IFolderTemplate, value: string) => {
				if (!editingTemplate) return;

				setEditingTemplate({
					...editingTemplate,
					[field]: value,
				});
			},
		}),
		[templates, updateTemplates, isAdding, editingIndex, editingTemplate]
	);

	return (
		<div className="rht-toolkit-detail-settings">
			<SettingItem
				name={t(
					"toolkit.folderTemplates.settings.templatesFolderPath.title"
				)}
				desc={t(
					"toolkit.folderTemplates.settings.templatesFolderPath.description"
				)}
			>
				<SuggestionInput
					value={templatesPath}
					onChange={updateTemplatesPath}
					suggestions={folderSuggestions}
					placeholder={t(
						"toolkit.folderTemplates.settings.templatesFolderPath.placeholder"
					)}
				/>
			</SettingItem>

			<SettingItem
				name={t(
					"toolkit.folderTemplates.settings.templateManagement.title"
				)}
				desc=""
				collapsible={true}
				defaultCollapsed={false}
			>
				<div className="RHT__FT-template-management">
					{/* 顶部操作栏 */}
					<div className="RHT__FT-template-header">
						<Button
							onClick={templateOperations.add}
							className="RHT__FT-add-button"
							disabled={editingIndex !== -1}
						>
							{t(
								"toolkit.folderTemplates.settings.templateManagement.addTemplate"
							)}
						</Button>
					</div>

					{/* 模板列表 */}
					<div className="RHT__FT-template-list">
						{templates.map((template, index) => (
							<TemplateItem
								key={index}
								template={template}
								editingTemplate={editingTemplate}
								index={index}
								isEditing={editingIndex === index}
								isAdding={false}
								folderSuggestions={folderSuggestions}
								templateFileOptions={templateFileOptions}
								onEdit={() => templateOperations.edit(index)}
								onSave={templateOperations.save}
								onCancel={templateOperations.cancel}
								onDelete={() =>
									templateOperations.delete(index)
								}
								onUpdate={templateOperations.update}
							/>
						))}
						{/* 渲染正在添加的新模板 */}
						{isAdding && editingTemplate && (
							<TemplateItem
								key="new-template"
								template={editingTemplate}
								editingTemplate={editingTemplate}
								index={templates.length}
								isEditing={true}
								isAdding={true}
								folderSuggestions={folderSuggestions}
								templateFileOptions={templateFileOptions}
								onEdit={() => {}}
								onSave={templateOperations.save}
								onCancel={templateOperations.cancel}
								onDelete={() => {}}
								onUpdate={templateOperations.update}
							/>
						)}
					</div>
				</div>
			</SettingItem>
		</div>
	);
};

interface TemplateItemProps {
	template: IFolderTemplate;
	editingTemplate: IFolderTemplate | null;
	index: number;
	isEditing: boolean;
	isAdding?: boolean;
	folderSuggestions: string[];
	templateFileOptions: string[];
	onEdit: () => void;
	onSave: () => void;
	onCancel: () => void;
	onDelete: () => void;
	onUpdate: (field: keyof IFolderTemplate, value: string) => void;
}

const TemplateItem: React.FC<TemplateItemProps> = ({
	template,
	editingTemplate,
	index,
	isEditing,
	isAdding = false,
	folderSuggestions,
	templateFileOptions,
	onEdit,
	onSave,
	onCancel,
	onDelete,
	onUpdate,
}) => {
	// 使用编辑中的模板数据或原始数据
	const currentTemplate =
		isEditing && editingTemplate ? editingTemplate : template;

	const handleSave = () => {
		onSave();
	};

	if (isEditing) {
		return (
			<div className="RHT__FT-template-item RHT__FT-editing">
				{/* 紧凑的编辑表单 */}
				<div className="RHT__FT-template-form-compact">
					<div className="RHT__FT-form-header">
						<span className="RHT__FT-template-number">
							{index + 1}.
						</span>
						<span className="RHT__FT-form-title">
							{isAdding ? "添加新模板" : "编辑模板配置"}
						</span>
						<div className="RHT__FT-form-actions-header">
							<Button
								onClick={handleSave}
								disabled={
									!currentTemplate.Folder.trim() ||
									!currentTemplate.TemplateFile.trim()
								}
								size="small"
								className="RHT__FT-save-button"
							>
								保存
							</Button>
							<Button
								onClick={onCancel}
								variant="outline"
								size="small"
								className="RHT__FT-cancel-button"
							>
								取消
							</Button>
						</div>
					</div>

					<div className="RHT__FT-form-grid">
						{/* 目标文件夹 */}
						<div className="RHT__FT-form-field">
							<label className="RHT__FT-form-label">
								目标文件夹
							</label>
							<SuggestionInput
								value={currentTemplate.Folder}
								onChange={(value) => onUpdate("Folder", value)}
								suggestions={folderSuggestions}
								placeholder="选择或输入文件夹路径"
							/>
						</div>

						{/* 模板文件 */}
						<div className="RHT__FT-form-field">
							<label className="RHT__FT-form-label">
								模板文件
							</label>
							<SuggestionInput
								value={currentTemplate.TemplateFile}
								onChange={(value) =>
									onUpdate("TemplateFile", value)
								}
								suggestions={templateFileOptions}
								placeholder="选择模板文件"
							/>
						</div>

						{/* 文件名规则 */}
						<div className="RHT__FT-form-field RHT__FT-form-field-full">
							<label className="RHT__FT-form-label">
								文件名规则
								<span className="RHT__FT-form-label-optional">
									（可选）
								</span>
							</label>
							<Input
								value={currentTemplate.FileNameRule || ""}
								onChange={(value) =>
									onUpdate("FileNameRule", value)
								}
								placeholder="例如：{{title}}-{{date}}"
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="RHT__FT-template-item">
			{/* 紧凑的显示行 */}
			<div className="RHT__FT-template-row-compact">
				<div className="RHT__FT-template-info-compact">
					<span className="RHT__FT-template-number">
						{index + 1}.
					</span>
					<div className="RHT__FT-template-path-chain">
						<span className="RHT__FT-template-folder">
							{template.Folder || "/"}
						</span>
						<span className="RHT__FT-template-separator">→</span>
						<span className="RHT__FT-template-file">
							{template.TemplateFile || "未选择模板"}
						</span>
						{template.FileNameRule && (
							<>
								<span className="RHT__FT-template-separator">
									|
								</span>
								<span className="RHT__FT-template-rule">
									{template.FileNameRule}
								</span>
							</>
						)}
					</div>
				</div>

				<div className="RHT__FT-template-actions-compact">
					<Button
						onClick={onEdit}
						size="small"
						className="RHT__FT-edit-button"
					>
						编辑
					</Button>
					<Button
						onClick={onDelete}
						size="small"
						variant="outline"
						className="RHT__FT-delete-button"
					>
						删除
					</Button>
				</div>
			</div>
		</div>
	);
};
