import { App } from "obsidian";
import { useEffect, useRef, useState } from "react";
import { LL } from "@src/i18n/i18n";
import type { IInstalledPluginEntry } from "../types";
import { Icon } from "./Icon";
import { PluginSuggest } from "./PluginSuggest";
import "./pluginOrder.css";

interface Props {
	app: App;
	/** 挂载时的初始 id 列表；后续编辑由本组件本地状态驱动并异步落盘 */
	initialIds: string[];
	/** 惰性取值：已安装插件缓存（联想候选源，也用于 id → name 映射） */
	getInstalledPlugins: () => IInstalledPluginEntry[];
	/** 持久化到设置（内部不调用 settingTab.update()，故不会整页重渲染） */
	persist: (ids: string[]) => void;
}

/** 单行状态：已启用（在数组中）/ 已安装未启用 / 未安装 */
type RowStatus = "enabled" | "disabled" | "missing";

/**
 * 读取 community-plugins.json 中的启用插件 id 集合（只读）。
 * 解析失败 / 非数组时返回 null，调用方据此保持现状。
 */
async function readEnabledPluginIds(app: App): Promise<Set<string> | null> {
	try {
		const raw = await app.vault.adapter.read(
			`${app.vault.configDir}/community-plugins.json`
		);
		const parsed: unknown = JSON.parse(raw);
		if (Array.isArray(parsed)) {
			return new Set(
				parsed.filter((x): x is string => typeof x === "string")
			);
		}
	} catch {
		// 读取失败：保持现状
	}
	return null;
}

/**
 * 优先插件列表编辑器（React 岛）：
 * - 添加：联想输入，候选来自已安装插件缓存——显示 name、存储 id；
 * - 行内：上移/下移调整优先顺序、删除；徽标展示三态（启用态来自 community-plugins.json）。
 */
export function PriorityListEditor({
	app,
	initialIds,
	getInstalledPlugins,
	persist,
}: Props) {
	const [ids, setIds] = useState<string[]>(initialIds);
	const [query, setQuery] = useState("");
	// 启用中的插件 id（挂载与每次落盘后从 community-plugins.json 重读）
	const [enabledIds, setEnabledIds] = useState<Set<string>>(new Set());
	const inputRef = useRef<HTMLInputElement>(null);
	// 本地 ids 的最新引用（联想回调触发时避免闭包过期）
	const idsRef = useRef(ids);
	idsRef.current = ids;
	const T = LL.settings.plugin_order.priority_plugins;

	const commit = (next: string[]) => {
		setIds(next);
		persist(next);
	};

	// 挂载时附加联想器；候选源与排除集经闭包惰性取值，联想器本身只建一次
	useEffect(() => {
		const el = inputRef.current;
		if (!el) return;
		const suggest = new PluginSuggest(
			app,
			el,
			(id) => commit([...idsRef.current, id]),
			{
				getCandidates: getInstalledPlugins,
				excludeIds: () => new Set(idsRef.current),
			}
		);
		return () => suggest.close();
		// 仅挂载时建联想器；候选源/排除集/回调均经闭包与 ref 惰性取最新值
	}, [app]);

	// 挂载 / 编辑列表后读取启用列表（只读；失败保持现状——徽标退化为基于缓存的二态）
	useEffect(() => {
		let cancelled = false;
		void readEnabledPluginIds(app).then((next) => {
			if (!cancelled && next) setEnabledIds(next);
		});
		return () => {
			cancelled = true;
		};
	}, [app, ids]);

	// 设置页开着时，用户在 Obsidian 里启停/增删插件 → 重读启用态，徽标实时刷新。
	// 仅依赖 app：编辑列表（ids 变化）不应重建订阅。offref 清理，active 守卫防卸载后 setState。
	useEffect(() => {
		let active = true;
		const ref = app.plugins.on("changed", () => {
			void readEnabledPluginIds(app).then((next) => {
				if (active && next) setEnabledIds(next);
			});
		});
		return () => {
			active = false;
			app.plugins.offref(ref);
		};
	}, [app]);

	const installed = getInstalledPlugins();
	const nameOf = (id: string): string | undefined =>
		installed.find((entry) => entry.id === id)?.name;
	const statusOf = (id: string): RowStatus =>
		enabledIds.has(id)
			? "enabled"
			: installed.some((entry) => entry.id === id)
				? "disabled"
				: "missing";

	const move = (index: number, delta: number) => {
		const target = index + delta;
		if (target < 0 || target >= ids.length) return;
		const next = [...ids];
		const [moved] = next.splice(index, 1);
		next.splice(target, 0, moved);
		commit(next);
	};

	const addById = (id: string) => {
		const trimmed = id.trim();
		if (!trimmed || idsRef.current.includes(trimmed)) {
			setQuery("");
			return;
		}
		commit([...idsRef.current, trimmed]);
		setQuery("");
	};

	return (
		<div className="rht-po-editor">
			<div className="rht-po-head">
				<span className="rht-po-title">{T.name()}</span>
				<span className="rht-po-count">
					{T.count({ count: String(ids.length) })}
				</span>
			</div>

			<input
				ref={inputRef}
				type="text"
				className="rht-po-add-input"
				spellCheck={false}
				placeholder={T.search_placeholder()}
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				onKeyDown={(e) => {
					// 手输完整 id 直接回车也可添加（不依赖联想命中）
					if (e.key === "Enter") {
						e.preventDefault();
						addById(query);
					}
				}}
			/>

			{ids.length === 0 ? (
				<div className="rht-po-empty">{T.empty()}</div>
			) : (
				ids.map((id, i) => (
					<div className="rht-po-row" key={id}>
						<span className="rht-po-order">{i + 1}</span>
						<span className="rht-po-name-wrap">
							<span className="rht-po-name">
								{nameOf(id) ?? id}
							</span>
							<span className="rht-po-id">{id}</span>
						</span>
						<span className={`rht-po-badge rht-po-${statusOf(id)}`}>
							{statusOf(id) === "enabled"
								? T.status.enabled()
								: statusOf(id) === "disabled"
									? T.status.disabled()
									: T.status.missing()}
						</span>
						<div className="rht-po-actions">
							<button
								className="rht-po-icon-btn clickable-icon"
								type="button"
								aria-label={LL.common.moveUp()}
								disabled={i === 0}
								onClick={() => move(i, -1)}
							>
								<Icon name="chevron-up" />
							</button>
							<button
								className="rht-po-icon-btn clickable-icon"
								type="button"
								aria-label={LL.common.moveDown()}
								disabled={i === ids.length - 1}
								onClick={() => move(i, 1)}
							>
								<Icon name="chevron-down" />
							</button>
							<button
								className="rht-po-icon-btn clickable-icon rht-po-danger"
								type="button"
								aria-label={LL.common.delete()}
								onClick={() =>
									commit(ids.filter((_, j) => j !== i))
								}
							>
								<Icon name="x" />
							</button>
						</div>
					</div>
				))
			)}
		</div>
	);
}
