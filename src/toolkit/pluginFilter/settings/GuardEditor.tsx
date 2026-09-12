import { LL } from "@src/i18n/i18n";
import type { IInstalledPluginEntry } from "@src/toolkit/pluginOrder/types";
import type { App } from "obsidian";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { PluginSuggest } from "./PluginSuggest";
import "./pluginFilter.css";

interface GuardEditorProps {
	app: App;
	/** 挂载时的初始保护清单；后续编辑由本组件本地状态驱动并异步落盘 */
	initialIds: string[];
	/** 惰性取值：已安装插件（联想候选源，也用于 id → name 映射） */
	getInstalledPlugins: () => IInstalledPluginEntry[];
	/** 持久化到设置（内部不调用 settingTab.update()，故不会整页重渲染） */
	persist: (ids: string[]) => void;
}

/**
 * 禁用保护清单编辑器（React 岛）：
 * 批量禁用的目标命中清单中的插件时先弹确认框（可逐个排除）。
 * 添加走 AbstractInputSuggest 联想；OTK 自身始终隐式受保护，无需在此配置。
 */
export function GuardEditor({
	app,
	initialIds,
	getInstalledPlugins,
	persist,
}: GuardEditorProps) {
	const [ids, setIds] = useState<string[]>(initialIds);
	const idsRef = useRef(ids);
	idsRef.current = ids;
	const inputRef = useRef<HTMLInputElement>(null);
	const T = LL.settings.plugin_filter.guard;

	const commit = (next: string[]) => {
		setIds(next);
		persist(next);
	};

	// 挂载时附加联想器；候选源与排除集经闭包惰性取值，联想器本身只建一次
	useEffect(() => {
		const el = inputRef.current;
		if (!el) return;
		const suggest = new PluginSuggest(app, el, (id) => addMember(id), {
			getCandidates: getInstalledPlugins,
			excludeIds: () => new Set(idsRef.current),
		});
		return () => suggest.close();
		// 仅挂载时建联想器；回调经 ref 惰性取最新值
	}, [app]);

	const installed = getInstalledPlugins();

	const addMember = (id: string) => {
		const trimmed = id.trim();
		if (!trimmed || idsRef.current.includes(trimmed)) {
			return;
		}
		commit([...idsRef.current, trimmed]);
	};

	const removeMember = (id: string) => {
		commit(idsRef.current.filter((m) => m !== id));
	};

	return (
		<div className="rht-pf-guard">
			<div className="rht-pf-empty">{T.hint()}</div>
			{ids.length === 0 ? (
				<div className="rht-pf-empty">{T.empty()}</div>
			) : (
				<div className="rht-pf-members">
					{ids.map((id) => {
						const name = installed.find(
							(entry) => entry.id === id,
						)?.name;
						return (
							<span key={id} className="rht-pf-chip">
								<span className="rht-pf-chip-name" title={id}>
									{name ?? id}
								</span>
								<button
									className="rht-pf-chip-remove clickable-icon"
									type="button"
									aria-label={T.remove_member()}
									onClick={() => removeMember(id)}
								>
									<Icon name="x" />
								</button>
							</span>
						);
					})}
				</div>
			)}
			<input
				ref={inputRef}
				type="text"
				className="rht-pf-add-input"
				spellCheck={false}
				placeholder={T.search_placeholder()}
				onKeyDown={(e) => {
					// 手输完整 id 直接回车也可添加（不依赖联想命中）
					if (e.key === "Enter") {
						e.preventDefault();
						addMember(e.currentTarget.value);
						e.currentTarget.value = "";
					}
				}}
			/>
		</div>
	);
}
