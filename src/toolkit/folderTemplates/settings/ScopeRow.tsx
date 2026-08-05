import { LL } from "@src/i18n/i18n";
import { App } from "obsidian";
import { migrateScope, TemplateScope, TemplateScopeType } from "../types";
import { Icon } from "./Icon";
import { SuggestInput } from "./SuggestInput";

interface Props {
	app: App;
	scope: TemplateScope;
	onChange: (scope: TemplateScope) => void;
	onDelete: () => void;
}

const SCOPE_TYPES: TemplateScopeType[] = [
	"FOLDER",
	"EXCLUDE_FOLDER",
	"FILENAME_PATTERN",
	"ROOT",
];

/** 非空且无法编译为正则时返回 true，用于即时校验提示。 */
function isInvalidRegex(pattern: string): boolean {
	if (!pattern) return false;
	try {
		new RegExp(pattern);
		return false;
	} catch {
		return true;
	}
}

/** 单条匹配条件（scope）：类型下拉 + 类型相关字段。 */
export function ScopeRow({ app, scope, onChange, onDelete }: Props) {
	const T = LL.settings.folder_templates.scopes;

	const typeLabel: Record<TemplateScopeType, string> = {
		FOLDER: T.typeFolder(),
		EXCLUDE_FOLDER: T.typeExcludeFolder(),
		FILENAME_PATTERN: T.typeFilenamePattern(),
		ROOT: T.typeRoot(),
	};

	return (
		<div className="rht-ft-scope-row">
			<select
				className="rht-ft-select dropdown"
				value={scope.type}
				onChange={(e) =>
					// 切换类型时按新类型重建字段，保留原 id 并尽量迁移同名字段（path）
					onChange(
						migrateScope(
							scope,
							e.target.value as TemplateScopeType,
						),
					)
				}
			>
				{SCOPE_TYPES.map((type) => (
					<option key={type} value={type}>
						{typeLabel[type]}
					</option>
				))}
			</select>

			{(scope.type === "FOLDER" || scope.type === "EXCLUDE_FOLDER") && (
				<SuggestInput
					app={app}
					kind="folder"
					value={scope.path}
					placeholder={T.pathPlaceholder()}
					onChange={(path) => onChange({ ...scope, path })}
				/>
			)}

			{scope.type === "FOLDER" && (
				<label className="rht-ft-check">
					<input
						type="checkbox"
						checked={scope.includeSubfolders}
						onChange={(e) =>
							onChange({
								...scope,
								includeSubfolders: e.target.checked,
							})
						}
					/>
					{T.includeSubfolders()}
				</label>
			)}

			{scope.type === "FILENAME_PATTERN" && (
				<div className="rht-ft-pattern">
					<input
						type="text"
						className={`rht-ft-input${
							isInvalidRegex(scope.pattern)
								? " rht-ft-invalid"
								: ""
						}`}
						spellCheck={false}
						value={scope.pattern}
						placeholder={T.patternPlaceholder()}
						aria-invalid={isInvalidRegex(scope.pattern)}
						onChange={(e) =>
							onChange({ ...scope, pattern: e.target.value })
						}
					/>
					{isInvalidRegex(scope.pattern) && (
						<span className="rht-ft-error">
							{T.patternInvalid()}
						</span>
					)}
				</div>
			)}

			<button
				className="rht-ft-icon-btn clickable-icon rht-ft-danger"
				type="button"
				aria-label={LL.common.delete()}
				onClick={onDelete}
			>
				<Icon name="trash-2" />
			</button>
		</div>
	);
}
