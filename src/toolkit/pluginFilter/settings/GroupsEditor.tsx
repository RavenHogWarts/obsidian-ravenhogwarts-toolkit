import { LL } from "@src/i18n/i18n";
import type { IInstalledPluginEntry } from "@src/toolkit/pluginOrder/types";
import type { App } from "obsidian";
import { useEffect, useRef, useState } from "react";
import { createGroupId, sortMembersForDisplay } from "../service/groups";
import type { IPluginGroup } from "../types";
import { Icon } from "./Icon";
import { PluginSuggest } from "./PluginSuggest";
import "./pluginFilter.css";

interface GroupsEditorProps {
	app: App;
	/** 挂载时的初始分组；后续编辑由本组件本地状态驱动并异步落盘 */
	initialGroups: IPluginGroup[];
	/** 惰性取值：已安装插件（联想候选源，也用于 id → name 映射） */
	getInstalledPlugins: () => IInstalledPluginEntry[];
	/** 持久化到设置（内部不调用 settingTab.update()，故不会整页重渲染） */
	persist: (groups: IPluginGroup[]) => void;
}

/**
 * 插件分组编辑器（React 岛）：
 * - 添加/删除分组（两步确认，防误删）、行内改名、收起/展开；
 * - 成员 chips 带启停状态点（实时跟随 app.plugins "changed"）；
 * - 添加成员走 AbstractInputSuggest 联想（候选为已安装插件，显示 name 存 id）；
 *   重复添加不静默——目标 chip 闪烁提示。
 */
export function GroupsEditor({
	app,
	initialGroups,
	getInstalledPlugins,
	persist,
}: GroupsEditorProps) {
	const [groups, setGroups] = useState<IPluginGroup[]>(initialGroups);
	const groupsRef = useRef(groups);
	groupsRef.current = groups;
	/** 新建分组后聚焦其名称输入框（由 GroupCard 消费后回调清除） */
	const [focusGroupId, setFocusGroupId] = useState<string | null>(null);
	const T = LL.settings.plugin_filter.groups;

	const commit = (next: IPluginGroup[]) => {
		setGroups(next);
		persist(next);
	};

	const updateGroup = (id: string, patch: Partial<IPluginGroup>) => {
		commit(
			groupsRef.current.map((g) =>
				g.id === id ? { ...g, ...patch } : g,
			),
		);
	};

	const addGroup = () => {
		const group: IPluginGroup = {
			id: createGroupId(),
			name: T.unnamed(),
			pluginIds: [],
		};
		commit([...groupsRef.current, group]);
		setFocusGroupId(group.id);
	};

	// 成员启停状态点数据源：app.plugins.enabledPlugins（运行时权威，实时）。
	// 设置页开着时用户在 Obsidian 里启停插件 → "changed" 事件刷新，与 PriorityListEditor 同法。
	const [enabledIds, setEnabledIds] = useState<Set<string>>(() =>
		readEnabledIds(app),
	);
	useEffect(() => {
		let active = true;
		const ref = app.plugins.on("changed", () => {
			if (active) setEnabledIds(readEnabledIds(app));
		});
		return () => {
			active = false;
			app.plugins.offref(ref);
		};
	}, [app]);

	const memberTotal = groups.reduce((sum, g) => sum + g.pluginIds.length, 0);

	return (
		<div className="rht-pf-groups">
			<div className="rht-pf-groups-head">
				<div className="rht-pf-groups-title">
					<span className="rht-pf-groups-name">{T.name()}</span>
					<span className="rht-pf-groups-summary">
						{T.summary({
							groups: String(groups.length),
							members: String(memberTotal),
						})}
					</span>
				</div>
				<button
					className="rht-pf-add-group"
					type="button"
					onClick={addGroup}
				>
					<Icon name="plus" />
					{T.add_group()}
				</button>
			</div>
			{groups.length === 0 ? (
				<div className="rht-pf-empty">{T.empty_groups()}</div>
			) : (
				groups.map((group) => (
					<GroupCard
						key={group.id}
						app={app}
						group={group}
						enabledIds={enabledIds}
						getInstalledPlugins={getInstalledPlugins}
						autoFocusName={focusGroupId === group.id}
						onAutoFocusHandled={() => setFocusGroupId(null)}
						onChange={(patch) => updateGroup(group.id, patch)}
						onDelete={() =>
							commit(
								groupsRef.current.filter(
									(g) => g.id !== group.id,
								),
							)
						}
					/>
				))
			)}
		</div>
	);
}

/** 读取启用中的插件 id 集合（运行时权威；形状异常时退化为空集） */
function readEnabledIds(app: App): Set<string> {
	const enabled = app.plugins?.enabledPlugins;
	return enabled instanceof Set ? enabled : new Set<string>();
}

interface GroupCardProps {
	app: App;
	group: IPluginGroup;
	enabledIds: Set<string>;
	getInstalledPlugins: () => IInstalledPluginEntry[];
	autoFocusName: boolean;
	onAutoFocusHandled: () => void;
	onChange: (patch: Partial<IPluginGroup>) => void;
	onDelete: () => void;
}

function GroupCard({
	app,
	group,
	enabledIds,
	getInstalledPlugins,
	autoFocusName,
	onAutoFocusHandled,
	onChange,
	onDelete,
}: GroupCardProps) {
	const [collapsed, setCollapsed] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	/** 重复添加时闪烁提示的成员 id */
	const [flashId, setFlashId] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const nameRef = useRef<HTMLInputElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	// 成员的最新引用（联想回调触发时避免闭包过期）
	const membersRef = useRef(group.pluginIds);
	membersRef.current = group.pluginIds;
	const T = LL.settings.plugin_filter.groups;

	const commitMembers = (next: string[]) => onChange({ pluginIds: next });

	const removeMember = (id: string) => {
		commitMembers(membersRef.current.filter((m) => m !== id));
	};

	// 挂载时附加联想器；候选源与排除集经闭包惰性取值，联想器本身只建一次
	useEffect(() => {
		const el = inputRef.current;
		if (!el) return;
		const suggest = new PluginSuggest(app, el, (id) => addMember(id), {
			getCandidates: getInstalledPlugins,
			excludeIds: () => new Set(membersRef.current),
		});
		return () => suggest.close();
		// 仅挂载时建联想器；回调经 ref 惰性取最新值
	}, [app]);

	// 两步删除：3s 内再次点击才真正删除，超时自动复位
	useEffect(() => {
		if (!confirmDelete) return;
		const timer = window.setTimeout(() => setConfirmDelete(false), 3000);
		return () => window.clearTimeout(timer);
	}, [confirmDelete]);

	// 新建分组后自动聚焦名称并全选，直接输入即可命名
	useEffect(() => {
		if (!autoFocusName) return;
		const el = nameRef.current;
		if (el) {
			el.focus();
			el.select();
		}
		onAutoFocusHandled();
	}, [autoFocusName, onAutoFocusHandled]);

	// 重复添加闪烁 800ms 后复位
	useEffect(() => {
		if (!flashId) return;
		const timer = window.setTimeout(() => setFlashId(null), 800);
		return () => window.clearTimeout(timer);
	}, [flashId]);

	const installed = getInstalledPlugins();

	const addMember = (id: string) => {
		const trimmed = id.trim();
		if (!trimmed) {
			setQuery("");
			return;
		}
		if (membersRef.current.includes(trimmed)) {
			// 重复添加：不静默——目标 chip 闪烁提示
			setFlashId(trimmed);
			setQuery("");
			return;
		}
		commitMembers([...membersRef.current, trimmed]);
		setQuery("");
	};

	return (
		<div
			className={`rht-pf-group${
				group.pluginIds.length === 0 ? " rht-pf-group-empty" : ""
			}`}
		>
			<div className="rht-pf-group-head">
				<button
					className={`rht-pf-collapse clickable-icon${
						collapsed ? " is-collapsed" : ""
					}`}
					type="button"
					aria-label={collapsed ? T.expand() : T.collapse()}
					onClick={() => setCollapsed((v) => !v)}
				>
					<Icon name="chevron-down" />
				</button>
				<input
					ref={nameRef}
					className="rht-pf-group-name"
					type="text"
					spellCheck={false}
					value={group.name}
					placeholder={T.unnamed()}
					aria-label={T.group_name_aria()}
					onChange={(e) => onChange({ name: e.target.value })}
					onKeyDown={(e) => {
						// Enter 即确认命名
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
				<span className="rht-pf-count">
					{T.member_count({ count: String(group.pluginIds.length) })}
				</span>
				{confirmDelete ? (
					<>
						<button
							className="rht-pf-icon-btn clickable-icon rht-pf-danger"
							type="button"
							aria-label={T.confirm_delete()}
							title={T.confirm_delete()}
							onClick={onDelete}
						>
							<Icon name="check" />
						</button>
						<button
							className="rht-pf-icon-btn clickable-icon"
							type="button"
							aria-label={LL.settings.plugin_filter.confirm_cancel()}
							onClick={() => setConfirmDelete(false)}
						>
							<Icon name="x" />
						</button>
					</>
				) : (
					<button
						className="rht-pf-icon-btn clickable-icon rht-pf-muted"
						type="button"
						aria-label={T.delete_group()}
						onClick={() => setConfirmDelete(true)}
					>
						<Icon name="trash-2" />
					</button>
				)}
			</div>
			{!collapsed && (
				<>
					{group.pluginIds.length === 0 ? (
						<div className="rht-pf-empty">{T.empty_members()}</div>
					) : (
						<div className="rht-pf-members">
							{sortMembersForDisplay(group.pluginIds, (id) =>
								installed.find((entry) => entry.id === id)
									?.name
							).map((id) => {
								const name = installed.find(
									(entry) => entry.id === id,
								)?.name;
								const missing = !name;
								const enabled = enabledIds.has(id);
								return (
									<span
										key={id}
										className={`rht-pf-chip${
											missing
												? " rht-pf-chip-missing"
												: ""
										}${flashId === id ? " rht-pf-chip-flash" : ""}`}
									>
										<span
											className={`rht-pf-dot rht-pf-dot-${
												enabled ? "on" : "off"
											}`}
											title={
												enabled
													? T.status_enabled()
													: T.status_disabled()
											}
										/>
										<span className="rht-pf-chip-name">
											{name ?? id}
										</span>
										{missing && (
											<span className="rht-pf-chip-badge">
												{T.missing()}
											</span>
										)}
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
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							// 手输完整 id 直接回车也可添加（不依赖联想命中）
							if (e.key === "Enter") {
								e.preventDefault();
								addMember(query);
							} else if (e.key === "Escape") {
								setQuery("");
							}
						}}
					/>
				</>
			)}
		</div>
	);
}
