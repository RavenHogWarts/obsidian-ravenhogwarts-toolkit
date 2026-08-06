import { LL } from "@src/i18n/i18n";
import { App } from "obsidian";
import { useState } from "react";
import { VariableEngine } from "../service/VariableEngine";
import { buildPreviewContext } from "../service/variableContext";
import {
	createScope,
	FolderScope,
	IFolderTemplateRule,
	TemplateApplyMode,
	TemplateScope,
} from "../types";
import { Icon } from "./Icon";
import { ScopeRow } from "./ScopeRow";
import { SuggestInput } from "./SuggestInput";
import { VariableHint } from "./VariableHint";

interface Props {
	app: App;
	rule: IFolderTemplateRule;
	onChange: (rule: IFolderTemplateRule) => void;
	onDelete: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	/** 新建规则时默认展开，便于立即填写 */
	defaultExpanded?: boolean;
	/** 模板文件联想的基准目录（惰性取值） */
	getTemplatesBasePath: () => string;
}

/** 单条规则卡片：标题行（启用/上移下移/删除）+ 可展开的编辑区。 */
export function RuleCard({
	app,
	rule,
	onChange,
	onDelete,
	onMoveUp,
	onMoveDown,
	defaultExpanded,
	getTemplatesBasePath,
}: Props) {
	const [expanded, setExpanded] = useState(defaultExpanded ?? false);
	const T = LL.settings.folder_templates;

	const title = ruleDisplayName(rule);
	const hasWarning = rule.enabled && !rule.templateFile;

	const setScope = (index: number, next: TemplateScope) =>
		onChange({
			...rule,
			scopes: rule.scopes.map((s, i) => (i === index ? next : s)),
		});
	const deleteScope = (index: number) =>
		onChange({
			...rule,
			scopes: rule.scopes.filter((_, i) => i !== index),
		});
	const addScope = () =>
		onChange({ ...rule, scopes: [...rule.scopes, createScope("FOLDER")] });

	return (
		<div className="rht-ft-card">
			<div className="rht-ft-card-header">
				<button
					className="rht-ft-icon-btn clickable-icon"
					type="button"
					aria-label={title}
					aria-expanded={expanded}
					onClick={() => setExpanded((v) => !v)}
				>
					<Icon name={expanded ? "chevron-down" : "chevron-right"} />
				</button>
				<span
					className="rht-ft-card-title-wrap"
					onClick={() => setExpanded((v) => !v)}
				>
					<span className="rht-ft-card-title">
						{title}
						{hasWarning && (
							<span
								className="rht-ft-warn"
								role="img"
								aria-label={T.rules.warnNoTemplate()}
								title={T.rules.warnNoTemplate()}
							>
								{" "}
								●
							</span>
						)}
					</span>
					{!expanded && (
						<span className="rht-ft-card-summary">
							{ruleSummary(rule)}
						</span>
					)}
				</span>

				<div className="rht-ft-card-actions">
					<div
						className={`checkbox-container ${rule.enabled ? "is-enabled" : ""}`}
						role="switch"
						aria-checked={rule.enabled}
						aria-label={T.rules.enabledDesc()}
						tabIndex={0}
						onClick={() =>
							onChange({ ...rule, enabled: !rule.enabled })
						}
						onKeyDown={(e) => {
							if (e.key === " " || e.key === "Enter") {
								e.preventDefault();
								onChange({ ...rule, enabled: !rule.enabled });
							}
						}}
					/>
					<button
						className="rht-ft-icon-btn clickable-icon"
						type="button"
						aria-label={LL.common.moveUp()}
						disabled={!onMoveUp}
						onClick={onMoveUp}
					>
						<Icon name="chevron-up" />
					</button>
					<button
						className="rht-ft-icon-btn clickable-icon"
						type="button"
						aria-label={LL.common.moveDown()}
						disabled={!onMoveDown}
						onClick={onMoveDown}
					>
						<Icon name="chevron-down" />
					</button>
					<button
						className="rht-ft-icon-btn clickable-icon rht-ft-danger"
						type="button"
						aria-label={LL.common.delete()}
						onClick={onDelete}
					>
						<Icon name="trash-2" />
					</button>
				</div>
			</div>

			{expanded && (
				<div className="rht-ft-card-body">
					<label className="rht-ft-field">
						<span className="rht-ft-field-label">
							{T.rules.templateFile.name()}
						</span>
						<SuggestInput
							app={app}
							kind="file"
							value={rule.templateFile}
							placeholder="template.md"
							fileFilter={(file) => file.extension === "md"}
							baseFolder={getTemplatesBasePath}
							onChange={(templateFile) =>
								onChange({ ...rule, templateFile })
							}
						/>
					</label>

					<label className="rht-ft-field">
						<span className="rht-ft-field-label">
							{T.rules.applyMode.name()}
						</span>
						<select
							className="rht-ft-select dropdown"
							value={rule.applyMode}
							onChange={(e) =>
								onChange({
									...rule,
									applyMode: e.target
										.value as TemplateApplyMode,
								})
							}
						>
							<option value="empty-only">
								{T.rules.applyMode.emptyOnly()}
							</option>
							<option value="prepend">
								{T.rules.applyMode.prepend()}
							</option>
						</select>
					</label>

					<label className="rht-ft-field">
						<span className="rht-ft-field-label">
							{T.rules.renameFormat.name()}
						</span>
						<input
							type="text"
							className="rht-ft-input"
							spellCheck={false}
							value={rule.renameFormat}
							placeholder="${date}-${notename}"
							onChange={(e) =>
								onChange({
									...rule,
									renameFormat: e.target.value,
								})
							}
						/>
						{renamePreview(rule.renameFormat) && (
							<span className="rht-ft-preview">
								{T.rules.renamePreview()}
								<code>{renamePreview(rule.renameFormat)}</code>
							</span>
						)}
					</label>

					<VariableHint />

					<div className="rht-ft-scopes">
						<div className="rht-ft-scopes-head">
							<span className="rht-ft-field-label">
								{T.scopes.name()}
							</span>
							<button
								className="rht-ft-text-btn"
								type="button"
								onClick={addScope}
							>
								<Icon name="plus" />
								{LL.common.add()}
							</button>
						</div>
						{rule.scopes.length === 0 ? (
							<div className="rht-ft-empty">
								{T.scopes.empty()}
							</div>
						) : (
							rule.scopes.map((scope, i) => (
								<ScopeRow
									key={scope.id}
									app={app}
									scope={scope}
									onChange={(next) => setScope(i, next)}
									onDelete={() => deleteScope(i)}
								/>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function ruleDisplayName(rule: IFolderTemplateRule): string {
	const T = LL.settings.folder_templates;
	const folder = rule.scopes.find(
		(s): s is FolderScope => s.type === "FOLDER",
	);
	if (folder && folder.path) return folder.path;
	if (rule.scopes.some((s) => s.type === "ROOT")) return T.scopes.typeRoot();
	if (rule.templateFile) return rule.templateFile;
	return T.rules.unnamed();
}

/** 折叠态摘要：条件数 · 模板 · 应用模式，便于不展开也能看清配置。 */
function ruleSummary(rule: IFolderTemplateRule): string {
	const T = LL.settings.folder_templates;
	const parts: string[] = [];
	parts.push(`${rule.scopes.length} ${T.rules.scopesUnit()}`);
	if (rule.templateFile) parts.push(rule.templateFile);
	parts.push(
		rule.applyMode === "empty-only"
			? T.rules.applyMode.emptyOnly()
			: T.rules.applyMode.prepend(),
	);
	return parts.join(" · ");
}

/** 用占位上下文渲染 renameFormat，给出实时样例；空串或渲染失败返回空。 */
function renamePreview(format: string): string {
	if (!format || format.trim() === "") return "";
	try {
		return new VariableEngine(buildPreviewContext()).render(format);
	} catch {
		return "";
	}
}
