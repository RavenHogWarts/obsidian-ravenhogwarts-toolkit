import { LL } from "@src/i18n/i18n";
import { App } from "obsidian";
import { createScope, TemplateScope, TemplateScopeType } from "../types";
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
					// 切换类型时按新类型重建字段，保留原 id
					onChange(
						createScope(
							e.target.value as TemplateScopeType,
							scope.id,
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
				<input
					type="text"
					className="rht-ft-input"
					spellCheck={false}
					value={scope.pattern}
					placeholder={T.patternPlaceholder()}
					onChange={(e) =>
						onChange({ ...scope, pattern: e.target.value })
					}
				/>
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
