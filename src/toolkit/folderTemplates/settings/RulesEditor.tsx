import { App } from "obsidian";
import { useState } from "react";
import { LL } from "@src/i18n/i18n";
import { createRule, IFolderTemplateRule } from "../types";
import { Icon } from "./Icon";
import { RuleCard } from "./RuleCard";
import "./folderTemplates.css";

interface Props {
	app: App;
	/** 挂载时的初始规则；后续编辑由本组件本地状态驱动并异步落盘 */
	initialRules: IFolderTemplateRule[];
	/** 模板文件联想的基准目录（惰性取值，反映最新的模板文件夹配置） */
	getTemplatesBasePath: () => string;
	/** 持久化到设置（内部不调用 settingTab.update()，故不会整页重渲染） */
	persist: (rules: IFolderTemplateRule[]) => void;
}

/** 文件夹模板「规则」编辑器（React 岛）：增删、排序、展开编辑，均为本地重渲染。 */
export function RulesEditor({
	app,
	initialRules,
	getTemplatesBasePath,
	persist,
}: Props) {
	const [rules, setRules] = useState<IFolderTemplateRule[]>(initialRules);
	// 记录最近新建的规则 id，使其卡片默认展开
	const [lastAddedId, setLastAddedId] = useState<string | null>(null);
	const T = LL.settings.folder_templates;

	const commit = (next: IFolderTemplateRule[]) => {
		setRules(next);
		persist(next);
	};

	const addRule = () => {
		const rule = createRule();
		setLastAddedId(rule.id);
		commit([...rules, rule]);
	};

	const patchRule = (index: number, next: IFolderTemplateRule) =>
		commit(rules.map((r, i) => (i === index ? next : r)));
	const deleteRule = (index: number) =>
		commit(rules.filter((_, i) => i !== index));
	const move = (index: number, delta: number) => {
		const target = index + delta;
		if (target < 0 || target >= rules.length) return;
		const next = [...rules];
		const [moved] = next.splice(index, 1);
		next.splice(target, 0, moved);
		commit(next);
	};

	return (
		<div className="rht-ft-rules">
			<div className="rht-ft-rules-head">
				<span className="rht-ft-rules-title">{T.rules.name()}</span>
				<button
					className="rht-ft-text-btn mod-cta"
					type="button"
					onClick={addRule}
				>
					<Icon name="plus" />
					{LL.common.add()}
				</button>
			</div>

			{rules.length === 0 ? (
				<div className="rht-ft-empty">{LL.common.noConfig()}</div>
			) : (
				rules.map((rule, i) => (
					<RuleCard
						key={rule.id}
						app={app}
						rule={rule}
						getTemplatesBasePath={getTemplatesBasePath}
						defaultExpanded={rule.id === lastAddedId}
						onChange={(next) => patchRule(i, next)}
						onDelete={() => deleteRule(i)}
						onMoveUp={i > 0 ? () => move(i, -1) : undefined}
						onMoveDown={
							i < rules.length - 1 ? () => move(i, 1) : undefined
						}
					/>
				))
			)}
		</div>
	);
}
