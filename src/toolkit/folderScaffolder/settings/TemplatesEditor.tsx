import { App, Notice, TFolder } from "obsidian";
import { useState } from "react";

import { LL } from "@src/i18n/i18n";
import { collectSubPaths } from "../service/StructureBuilder";
import { createTemplate, IStructureTemplate } from "../types";
import { Icon } from "./Icon";
import { StructureTreeEditor } from "./StructureTreeEditor";
import { SuggestInput } from "./SuggestInput";
import "./folderScaffolder.css";

interface Props {
	app: App;
	/** 挂载时的初始模板；后续编辑由本组件本地状态驱动并异步落盘 */
	initialTemplates: IStructureTemplate[];
	/** 持久化到设置（内部不调用 settingTab.update()，故不会整页重渲染） */
	persist: (templates: IStructureTemplate[]) => void;
}

/** 文件夹脚手架「结构模板」编辑器（React 岛）：增删、命名、来源选择、刷新快照。 */
export function TemplatesEditor({ app, initialTemplates, persist }: Props) {
	const [templates, setTemplates] =
		useState<IStructureTemplate[]>(initialTemplates);
	const T = LL.settings.folder_scaffolder;

	const commit = (next: IStructureTemplate[]) => {
		setTemplates(next);
		persist(next);
	};

	const addTemplate = () => commit([...templates, createTemplate()]);

	const patchTemplate = (id: string, next: Partial<IStructureTemplate>) =>
		commit(templates.map((t) => (t.id === id ? { ...t, ...next } : t)));

	const deleteTemplate = (id: string) =>
		commit(templates.filter((t) => t.id !== id));

	/** 从 sourceFolder 重新读取结构覆盖 snapshot */
	const refreshSnapshot = (template: IStructureTemplate) => {
		const source = app.vault.getAbstractFileByPath(template.sourceFolder);
		if (!(source instanceof TFolder)) {
			new Notice(T.templateCard.sourceNotFound());
			return;
		}
		const snapshot = collectSubPaths(source);
		patchTemplate(template.id, { snapshot });
		new Notice(T.templateCard.refreshed({ count: snapshot.length }));
	};

	return (
		<div className="rht-fs-templates">
			<div className="rht-fs-head">
				<span className="rht-fs-title">{T.templates.name()}</span>
				<button
					className="rht-fs-text-btn mod-cta"
					type="button"
					onClick={addTemplate}
				>
					<Icon name="plus" />
					{LL.common.add()}
				</button>
			</div>

			{templates.length === 0 ? (
				<div className="rht-fs-empty-state">
					<Icon name="folder-tree" />
					<span className="rht-fs-empty-state-text">
						{LL.common.noConfig()}
					</span>
					<button
						className="rht-fs-text-btn mod-cta"
						type="button"
						onClick={addTemplate}
					>
						<Icon name="plus" />
						{T.templateCard.addFirst()}
					</button>
				</div>
			) : (
				templates.map((template) => (
					<TemplateCard
						key={template.id}
						app={app}
						template={template}
						onChange={(next) => patchTemplate(template.id, next)}
						onDelete={() => deleteTemplate(template.id)}
						onRefresh={() => refreshSnapshot(template)}
					/>
				))
			)}
		</div>
	);
}

interface CardProps {
	app: App;
	template: IStructureTemplate;
	onChange: (next: Partial<IStructureTemplate>) => void;
	onDelete: () => void;
	onRefresh: () => void;
}

function TemplateCard({
	app,
	template,
	onChange,
	onDelete,
	onRefresh,
}: CardProps) {
	const T = LL.settings.folder_scaffolder;
	const name = template.name.trim() || T.templateCard.unnamed();
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div className="rht-fs-card">
			<div className="rht-fs-card-header">
				<button
					className="rht-fs-card-toggle"
					type="button"
					aria-expanded={!collapsed}
					aria-label={collapsed ? T.templateCard.expand() : T.templateCard.collapse()}
					title={collapsed ? T.templateCard.expand() : T.templateCard.collapse()}
					onClick={() => setCollapsed((c) => !c)}
				>
					<span
						className={`rht-fs-chevron${collapsed ? " is-collapsed" : ""}`}
					>
						<Icon name="chevron-down" />
					</span>
					<div className="rht-fs-card-title-wrap">
						<span className="rht-fs-card-title">{name}</span>
						<span className="rht-fs-card-summary">
							{T.templateCard.subDirs({ count: template.snapshot.length })}
						</span>
					</div>
				</button>
				<label className="rht-fs-check">
					<input
						type="checkbox"
						checked={template.enabled}
						onChange={(e) => onChange({ enabled: e.target.checked })}
						aria-label={T.templateCard.enabledDesc()}
					/>
				</label>
				<div className="rht-fs-card-actions">
					<button
						className="rht-fs-icon-btn rht-fs-danger"
						type="button"
						onClick={onDelete}
						aria-label={LL.common.delete()}
						title={LL.common.delete()}
					>
						<Icon name="trash" />
					</button>
				</div>
			</div>

			{!collapsed && (
				<div className="rht-fs-card-body">
					<div className="rht-fs-field">
						<span className="rht-fs-field-label">
							{T.templateCard.nameField.name()}
						</span>
						<input
							type="text"
							className="rht-fs-input"
							spellCheck={false}
							value={template.name}
							placeholder={T.templateCard.unnamed()}
							onChange={(e) => onChange({ name: e.target.value })}
						/>
					</div>

					{/* 主编辑方式：可视化树编辑器，完全脱离 vault 也能搭建 */}
					<div className="rht-fs-field">
						<StructureTreeEditor
							snapshot={template.snapshot}
							onChange={(snapshot) => onChange({ snapshot })}
						/>
					</div>

					{/* 辅助方式：从 vault 已有文件夹导入结构（可选，可折叠） */}
					<details className="rht-fs-import">
						<summary className="rht-fs-import-summary">
							<Icon name="folder-input" />
							{T.templateCard.importFromVault()}
						</summary>
						<div className="rht-fs-import-body">
							<span className="rht-fs-field-desc">
								{T.templateCard.importFromVaultDesc()}
							</span>
							<div className="rht-fs-import-row">
								<SuggestInput
									app={app}
									value={template.sourceFolder}
									placeholder={T.templateCard.sourceField.name()}
									onChange={(v) => onChange({ sourceFolder: v })}
								/>
								<button
									className="rht-fs-text-btn mod-cta"
									type="button"
									onClick={onRefresh}
									disabled={!template.sourceFolder.trim()}
								>
									<Icon name="refresh-cw" />
									{T.templateCard.refresh()}
								</button>
							</div>
						</div>
					</details>
				</div>
			)}
		</div>
	);
}
