import { LL } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import type { IPluginContext } from "@src/model/toolkit/IPluginContext";
import { reactSetting } from "@src/settings/reactSetting";
import { collectInstalledPlugins } from "@src/toolkit/pluginOrder/service/pluginInventory";
import {
	ButtonComponent,
	Menu,
	Modal,
	Setting,
	setIcon,
	type App,
	type SettingDefinitionItem,
	type SettingTab,
} from "obsidian";
import { createElement } from "react";
import { computeCounts, pickTargets } from "./service/filterCore";
import {
	isHiddenByGroup,
	normalizeGroups,
	normalizeStringList,
	sortGroupsById,
	sortMembersForDisplay,
} from "./service/groups";
import { GroupsEditor } from "./settings/GroupsEditor";
import { GuardEditor } from "./settings/GuardEditor";
import {
	DefaultSettings,
	FILTER_STATES,
	FILTER_STATE_CLASSES,
	FilterSelection,
	ISettings,
	PluginFilterState,
} from "./types";
import "./settings/pluginFilter.css";

/** 排障期开关：定位完成后可改为 false（日志经 context.log 打到 console） */
const DEBUG = true;

/** 筛选按钮图标（恒定；有激活筛选时按钮高亮） */
const BUTTON_ICON = "filter";
/** 批量操作按钮图标 */
const ACTION_ICON = "zap";

/**
 * plugin-filter：在社区插件设置页头（"重新加载插件 / 打开插件文件夹"同排）注入
 * 一枚筛选按钮，点击弹出原生 Menu（全部/已启用/已禁用，当前项带 ✓），按列表项
 * 开关的 is-enabled 类过滤插件行显示。
 *
 * 渲染路径：Obsidian 1.13+ 社区插件 tab 走声明式渲染（getSettingDefinitions +
 * update → refreshCurrentPage 重渲染，不调用 display()）。注入 = MutationObserver
 * 监听 tab.containerEl（childList+subtree，rAF 去抖）后幂等重注入/重挂状态类。
 * 过滤 = CSS :has() 状态类（限定 [data-plugin-id] 只作用于插件行——原生开关行如
 * "自动检查插件更新"同 class 结构但无该属性，必须排除；与原生搜索 AND 叠加）。
 * 卸载 = 断开 observer / 移按钮 / 清状态类，页面无残留。
 */
@Toolkit({
	id: "plugin-filter",
	name: LL.settings.plugin_filter.name(),
	icon: "filter",
	version: "1.0.0",
	description: LL.settings.plugin_filter.desc(),
})
export default class PluginFilterTool extends BaseTool<ISettings> {
	/**
	 * 筛选选择仅会话内记忆（重开设置回「全部」），不落 settings（设计 §5.5）。
	 * 分组选择时若分组被删除，applyFilter 会自动回落「全部」。
	 */
	#selection: FilterSelection = { kind: "builtin", state: "all" };
	#tab: SettingTab | null = null;
	#observer: MutationObserver | null = null;
	/** 已观察到 containerEl 渲染突变（此后锚点仍缺失才值得告警） */
	#sawMutation = false;
	#anchorWarned = false;
	#injectLogged = false;
	#counts = { total: 0, enabled: 0, disabled: 0 };
	#lastCountsKey = "";
	/** rAF 去抖：合并一次渲染的成批 childList 突变 */
	#refreshQueued = false;
	/** 批量启停执行中（防菜单重入并发批次） */
	#batchRunning = false;
	/** 有界轮询定时器（onload 期 resolve 失败时的兜底；成功即自停） */
	#retryTimer: number | null = null;
	#attempts = 0;

	getDefaultSettings(): ISettings {
		return structuredClone(DefaultSettings);
	}

	async initialize(context: IPluginContext): Promise<void> {
		// 规范化存储的分组与保护清单（抵御手改 data.json 的脏数据）
		const raw = context._settingsStore.settings.toolkit[this.info.id] as
			| { config?: { groups?: unknown; protectedIds?: unknown } }
			| undefined;
		if (raw?.config) {
			raw.config.groups = normalizeGroups(
				raw.config.groups,
				LL.settings.plugin_filter.groups.unnamed()
			);
			raw.config.protectedIds = normalizeStringList(
				raw.config.protectedIds
			);
		}
		await super.initialize(context);
	}

	getSettingItems(): SettingDefinitionItem[] {
		// 两个 React 岛：分组编辑器 + 禁用保护清单编辑器。
		// 本地状态 + 异步落盘，不触发 settingTab.update()（不整页重渲染）。
		return [
			reactSetting(LL.settings.plugin_filter.groups.name(), () =>
				createElement(GroupsEditor, {
					app: this.context._app,
					initialGroups: this.settings.config.groups,
					getInstalledPlugins: () =>
						collectInstalledPlugins(this.context._app),
					persist: (groups) => {
						void this.updateConfig("groups", groups);
					},
				})
			),
			reactSetting(LL.settings.plugin_filter.guard.name(), () =>
				createElement(GuardEditor, {
					app: this.context._app,
					initialIds: this.settings.config.protectedIds,
					getInstalledPlugins: () =>
						collectInstalledPlugins(this.context._app),
					persist: (ids) => {
						void this.updateConfig("protectedIds", ids);
					},
				})
			),
		];
	}

	onload(): void {
		super.onload(); // 约定：必须首行
		this.#debug("tool loaded; resolving community-plugins tab");
		this.#resolveAndAttach();
	}

	onunload(): void {
		this.#stopResolveRetry();
		this.#detach();
		super.onunload(); // 约定：必须尾行
	}

	#debug(message: string): void {
		if (DEBUG) this.context.log("info", message, "plugin-filter");
	}

	/**
	 * 定位 community-plugins tab：onload 即试 → onLayoutReady 重试 → 有界轮询
	 * （10×1s）。核心 tab 一般在启动期已注册；全部失败仅 warn 一次，功能静默不生效。
	 */
	#resolveAndAttach(): void {
		if (this.#tryAttach()) return;

		this.context._app.workspace.onLayoutReady(() => {
			if (this.#tryAttach()) return;
			this.#retryTimer = window.setInterval(() => {
				if (this.#tryAttach()) {
					this.#stopResolveRetry();
					return;
				}
				if (++this.#attempts >= 10) {
					this.#stopResolveRetry();
					this.context.log(
						"warn",
						"community-plugins tab not found in app.setting.settingTabs; tool stays inactive",
						"plugin-filter"
					);
				}
			}, 1000);
		});
	}

	#stopResolveRetry(): void {
		if (this.#retryTimer !== null) {
			window.clearInterval(this.#retryTimer);
			this.#retryTimer = null;
		}
	}

	#tryAttach(): boolean {
		const setting = (
			this.context._app as unknown as {
				setting?: { settingTabs?: unknown };
			}
		).setting;
		const tabs = setting?.settingTabs;
		if (!Array.isArray(tabs)) {
			this.#debug(
				`resolve: app.setting.settingTabs unavailable (${describeSettingTabs(setting)})`
			);
			return false;
		}

		const tab = (tabs as { id?: unknown }[]).find(
			(t) => t?.id === "community-plugins"
		);
		if (!tab) {
			this.#debug(
				`resolve: tab not found among ${tabs.length} settingTabs (ids: ${sampleIds(tabs)})`
			);
			return false;
		}

		this.#debug("resolve: community-plugins tab instance found, attaching");
		this.#attachToTab(tab as SettingTab);
		return true;
	}

	#attachToTab(tab: SettingTab): void {
		this.#tab = tab;
		this.#stopResolveRetry();

		// 声明式渲染（1.13+）与旧 display() 路径的产出都落在 containerEl 下：
		// childList 突变 → rAF 去抖刷新。注入/状态类/计数全部幂等，不会自激循环。
		this.#observer = new MutationObserver(() => this.#scheduleRefresh());
		this.#observer.observe(tab.containerEl, {
			childList: true,
			subtree: true,
		});
		this.#debug("observer attached on tab.containerEl");

		// 事件委托挂在 containerEl 上（重渲染重建子树不影响监听；registerDomEvent
		// 托管，卸载自动解绑）：筛选按钮点击弹菜单 + 行内开关/菜单操作后刷计数
		this.registerDomEvent(tab.containerEl, "click", (evt) =>
			this.#handleClick(evt)
		);

		// 若 tab DOM 此刻已渲染（如从其他设置页切回），立即补一次
		this.#refreshTab("attach");
	}

	#scheduleRefresh(): void {
		if (!this.#sawMutation) {
			this.#sawMutation = true;
			this.#debug("first containerEl mutation observed");
		}
		if (this.#refreshQueued) return;
		this.#refreshQueued = true;
		window.requestAnimationFrame(() => {
			this.#refreshQueued = false;
			this.#refreshTab("mutation");
		});
	}

	#refreshTab(reason: "attach" | "mutation"): void {
		if (!this.#tab) return;
		this.#injectButtons(reason);
		this.#applyFilter();
		this.#refreshCounts();
	}

	/** 页头控制区：第一个含 extra-setting-button 的 heading control（结构定位，
	 *  禁止依赖 aria-label/文本——它们随语言本地化变化） */
	#findHeaderControl(): HTMLElement | null {
		const container = this.#tab?.containerEl;
		if (!container) return null;
		// Array.from 中转：NodeList 直接 for-of 需 DOM.Iterable lib（tsconfig 未含）
		for (const control of Array.from(
			container.querySelectorAll<HTMLElement>(
				".setting-item-heading .setting-item-control"
			)
		)) {
			if (control.querySelector(".extra-setting-button")) return control;
		}
		return null;
	}

	#injectButtons(reason: "attach" | "mutation"): void {
		const control = this.#findHeaderControl();
		if (!control) {
			this.#warnAnchorMissing("header control");
			return;
		}
		// 幂等：单次渲染内可能多次进入（attach 补刷 + 突变回调）
		if (!control.querySelector(":scope > [data-otk-plugin-filter]")) {
			const button = control.createDiv(
				"clickable-icon extra-setting-button otk-pf-btn"
			);
			button.setAttribute("data-otk-plugin-filter", "");
			button.setAttribute("tabindex", "0");
			button.setAttribute("aria-label", this.#buttonLabel());
			setIcon(button, BUTTON_ICON);
			if (!this.#injectLogged) {
				this.#injectLogged = true;
				this.#debug("filter button injected into header control");
			}
		}
		if (!control.querySelector(":scope > [data-otk-plugin-actions]")) {
			const action = control.createDiv(
				"clickable-icon extra-setting-button"
			);
			action.setAttribute("data-otk-plugin-actions", "");
			action.setAttribute("tabindex", "0");
			action.setAttribute(
				"aria-label",
				LL.settings.plugin_filter.action_tooltip()
			);
			setIcon(action, ACTION_ICON);
		}
	}

	/** 当前内置三态；分组选择时为 null（分组过滤走 JS 显隐，不走状态类） */
	#builtinState(): PluginFilterState | null {
		return this.#selection.kind === "builtin" ? this.#selection.state : null;
	}

	#applyFilter(): void {
		const container = this.#tab?.containerEl;
		if (!container) return;
		// 1.14 声明式 DOM 含多个 .setting-items 分组（受限模式介绍组 + 已安装插件
		// 组……）：querySelector 只会命中第一个，状态类必须挂到全部（含插件行的那个），
		// 否则过滤永不生效（沙盒库实测踩坑）。空组挂类无害。
		const groups = Array.from(
			container.querySelectorAll<HTMLElement>(".setting-items")
		);
		if (groups.length === 0) {
			this.#warnAnchorMissing(".setting-items");
			return;
		}
		const state = this.#builtinState();
		for (const items of groups) {
			for (const [s, className] of Object.entries(FILTER_STATE_CLASSES)) {
				items.classList.toggle(className, s === state);
			}
		}
		this.#applyGroupVisibility(container);
	}

	/**
	 * 分组过滤：成员关系是数据关系，CSS 状态类表达不了，改为 JS 逐行显隐。
	 * 我们隐藏的行打 `data-otk-group-hidden` 标记，恢复时只清自家标记——
	 * 与原生搜索的隐藏（无论其用 inline style 还是重建列表）互不覆盖。
	 * 分组被删除时自动回落「全部」。
	 */
	#applyGroupVisibility(container: HTMLElement): void {
		let members: readonly string[] | undefined;
		if (this.#selection.kind === "group") {
			const groupId = this.#selection.groupId;
			members = this.settings.config.groups.find(
				(g) => g.id === groupId
			)?.pluginIds;
			if (!members) {
				// 分组已被删除：回落「全部」
				this.#selection = { kind: "builtin", state: "all" };
			}
		}
		for (const row of Array.from(
			container.querySelectorAll<HTMLElement>(
				".setting-items > .setting-item.mod-toggle[data-plugin-id]"
			)
		)) {
			const id = row.getAttribute("data-plugin-id") ?? "";
			if (isHiddenByGroup(members, id)) {
				row.addClass("otk-pf-group-hidden");
			} else if (row.hasClass("otk-pf-group-hidden")) {
				// 只恢复被本功能隐藏的行；原生搜索隐藏的行没有标记，不触碰
				row.removeClass("otk-pf-group-hidden");
			}
		}
	}

	#refreshCounts(): void {
		const container = this.#tab?.containerEl;
		if (!container) return;

		const items = container.querySelectorAll<HTMLElement>(
			".setting-items > .setting-item.mod-toggle[data-plugin-id]"
		);
		this.#counts = computeCounts(
			Array.from(items, (el) =>
				el
					.querySelector(".checkbox-container")
					?.classList.contains("is-enabled") ?? false
			)
		);
		const key = `${this.#counts.total}/${this.#counts.enabled}`;
		if (key !== this.#lastCountsKey) {
			this.#lastCountsKey = key;
			this.#debug(
				`counts: total=${this.#counts.total} enabled=${this.#counts.enabled} disabled=${this.#counts.disabled}`
			);
		}

		for (const button of Array.from(
			container.querySelectorAll<HTMLElement>("[data-otk-plugin-filter]")
		)) {
			// 按钮恒为 filter 图标；有激活筛选（含分组）时高亮提示
			const filtering =
				!(
					this.#selection.kind === "builtin" &&
					this.#selection.state === "all"
				);
			button.classList.toggle("is-active", filtering);
			button.setAttribute("aria-label", this.#buttonLabel());
		}
	}

	/** 菜单项文案（带计数）：如「全部 (82)」 */
	#stateLabel(state: PluginFilterState): string {
		const { total, enabled, disabled } = this.#counts;
		return {
			all: LL.settings.plugin_filter.all({ count: total }),
			enabled: LL.settings.plugin_filter.enabled({ count: enabled }),
			disabled: LL.settings.plugin_filter.disabled({ count: disabled }),
		}[state];
	}

	/** 当前选择的展示文案：内置三态或「分组名 (成员数)」 */
	#selectionLabel(): string {
		const selection = this.#selection;
		if (selection.kind === "group") {
			const group = this.settings.config.groups.find(
				(g) => g.id === selection.groupId
			);
			if (group) {
				return `${group.name} (${group.pluginIds.length})`;
			}
			// 分组已被删除：回落「全部」（applyFilter 亦会同步清理）
			this.#selection = { kind: "builtin", state: "all" };
		}
		return this.#stateLabel(
			selection.kind === "builtin" ? selection.state : "all"
		);
	}

	/** 按钮 tooltip：如「插件筛选：全部 (82)」 */
	#buttonLabel(): string {
		return LL.settings.plugin_filter.tooltip({
			label: this.#selectionLabel(),
		});
	}

	#openFilterMenu(evt: MouseEvent): void {
		const menu = new Menu();
		const activeState = this.#builtinState();
		for (const state of FILTER_STATES) {
			menu.addItem((item) => {
				// ✓ 追加在文字后（MenuItem.setIcon 只能渲染在文字前，不合需求）
				const active = state === activeState;
				item.setTitle(
					active
						? `${this.#stateLabel(state)} ✓`
						: this.#stateLabel(state)
				).onClick(() => {
					this.#selection = { kind: "builtin", state };
					this.#debug(`filter -> ${state}`);
					this.#applyFilter();
					this.#refreshCounts();
				});
			});
		}
		const groups = sortGroupsById(this.settings.config.groups);
		if (groups.length > 0) {
			menu.addSeparator();
			const selection = this.#selection;
			for (const group of groups) {
				menu.addItem((item) => {
					const active =
						selection.kind === "group" &&
						selection.groupId === group.id;
					item.setTitle(
						`${group.name} (${group.pluginIds.length})${active ? " ✓" : ""}`
					).onClick(() => {
						this.#selection = { kind: "group", groupId: group.id };
						this.#debug(`filter -> group ${group.id}`);
						this.#applyFilter();
						this.#refreshCounts();
					});
				});
			}
		}
		menu.showAtMouseEvent(evt);
	}

	/** 当前筛选可见的插件行（含原生搜索的显隐效果；隐藏行不计入批量操作） */
	#collectVisiblePlugins(): { id: string; enabled: boolean }[] {
		const container = this.#tab?.containerEl;
		if (!container) return [];
		return Array.from(
			container.querySelectorAll<HTMLElement>(
				".setting-items > .setting-item.mod-toggle[data-plugin-id]"
			),
			(el) => ({
				// offsetParent 为 null ⇔ display:none（被筛选/搜索隐藏的行）
				visible: el.offsetParent !== null,
				id: el.getAttribute("data-plugin-id") ?? "",
				enabled:
					el
						.querySelector(".checkbox-container")
						?.classList.contains("is-enabled") ?? false,
			})
		).filter((item) => item.visible && item.id !== "");
	}

	#openActionsMenu(evt: MouseEvent): void {
		if (this.#batchRunning) return;
		const visible = this.#collectVisiblePlugins();
		const menu = new Menu();
		menu.addItem((item) => {
			const count = pickTargets(visible, true).length;
			item.setTitle(LL.settings.plugin_filter.action_enable({ count }));
			item.onClick(() => void this.#applyEnableState(visible, true));
		});
		menu.addItem((item) => {
			const count = pickTargets(visible, false).length;
			item.setTitle(LL.settings.plugin_filter.action_disable({ count }));
			item.onClick(() => void this.#applyEnableState(visible, false));
		});
		menu.showAtMouseEvent(evt);
	}

	/**
	 * 批量禁用守卫：目标命中保护清单（含 OTK 自身，始终隐式保护）时弹确认框
	 * （可逐个排除）；其余情况直接执行。
	 */
	#applyEnableState(
		visible: { id: string; enabled: boolean }[],
		enable: boolean,
	): void {
		const targets = pickTargets(visible, enable);
		if (targets.length === 0) return;
		if (this.#batchRunning) return;

		const selfId = this.context._plugin.manifest.id;
		if (!enable) {
			const guards = new Set([
				...this.settings.config.protectedIds,
				selfId,
			]);
			const guarded = targets.filter((id) => guards.has(id));
			if (guarded.length > 0) {
				const installed = collectInstalledPlugins(this.context._app);
				const nameOf = (id: string) =>
					installed.find((entry) => entry.id === id)?.name ?? id;
				new BatchDisableConfirmModal(
					this.context._app,
					targets,
					guarded,
					nameOf,
					selfId,
					(finalTargets) => void this.#runBatch(finalTargets, false)
				).open();
				return;
			}
		}
		void this.#runBatch(targets, enable);
	}

	/**
	 * 串行批量启停（逐个 await，避免并发写 community-plugins.json 竞争）。
	 * 目标 = 打开菜单时快照的可见插件中未处于目标状态者；执行中列表重渲染
	 * 不影响本次操作范围。OTK 自身排到最后处理：全部禁用时其余插件先完成，
	 * 本工具最后卸载，避免批次中途中断。单条失败不中断批次。
	 */
	async #runBatch(targets: string[], enable: boolean): Promise<void> {
		if (targets.length === 0) return;
		if (this.#batchRunning) return;
		this.#batchRunning = true;
		const selfId = this.context._plugin.manifest.id;
		if (!enable) {
			// 自禁排最后（启用方向 OTK 已在运行、必不在目标集）
			targets.sort((a, b) =>
				a === selfId ? 1 : b === selfId ? -1 : 0
			);
		}
		const verb = enable
			? LL.notice.plugin_filter.enabled_n
			: LL.notice.plugin_filter.disabled_n;
		this.#debug(`batch ${enable ? "enable" : "disable"}: ${targets.length} plugins`);
		let done = 0;
		try {
			const plugins = this.context._app.plugins;
			for (const id of targets) {
				if (!enable && id === selfId && !this.enabled) break;
				try {
					if (enable) {
						await plugins.enablePluginAndSave(id);
					} else {
						await plugins.disablePluginAndSave(id);
					}
					done++;
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					this.context.log(
						"warn",
						`batch ${enable ? "enable" : "disable"} failed for ${id}: ${message}`,
						"plugin-filter"
					);
				}
			}
		} finally {
			this.#batchRunning = false;
		}
		// OTK 自身被禁用时工具已卸载，context 通知不再有意义；其余情况汇报结果
		if (this.enabled) {
			this.context.notice(verb({ count: done }));
			this.#debug(`batch done: ${done}/${targets.length}`);
		}
	}

	#handleClick(evt: MouseEvent): void {
		const target = evt.target;
		const el =
			target instanceof Element
				? target.closest<HTMLElement>(
						"[data-otk-plugin-filter], [data-otk-plugin-actions]"
					)
				: null;
		if (el?.hasAttribute("data-otk-plugin-filter")) {
			this.#openFilterMenu(evt);
		} else if (el?.hasAttribute("data-otk-plugin-actions")) {
			this.#openActionsMenu(evt);
		}
		// 行内开关 / 「更多选项」菜单启停后计数可能变化；rAF 合并连续点击
		window.requestAnimationFrame(() => this.#refreshCounts());
	}

	#warnAnchorMissing(which: string): void {
		if (!this.#sawMutation || this.#anchorWarned) return;
		this.#anchorWarned = true;
		this.context.log(
			"warn",
			`DOM anchor missing after render (${which}); tool stays inactive`,
			"plugin-filter"
		);
	}

	/** 逐项可逆清理：停用时设置页恰停在该 tab 也无残留 */
	#detach(): void {
		const tab = this.#tab;
		this.#tab = null;
		this.#sawMutation = false;
		this.#anchorWarned = false;
		this.#injectLogged = false;
		this.#lastCountsKey = "";
		this.#selection = { kind: "builtin", state: "all" };
		this.#attempts = 0;
		if (!tab) return;

		this.#observer?.disconnect();
		this.#observer = null;
		tab.containerEl.querySelector("[data-otk-plugin-filter]")?.remove();
		tab.containerEl.querySelector("[data-otk-plugin-actions]")?.remove();
		tab.containerEl
			.querySelectorAll(
				".setting-items.otk-pf-state-enabled, .setting-items.otk-pf-state-disabled"
			)
			.forEach((el) =>
				el.classList.remove("otk-pf-state-enabled", "otk-pf-state-disabled")
			);
		// 恢复被分组筛选隐藏的行（只清自家标记，不动原生搜索的显隐）
		tab.containerEl
			.querySelectorAll(".otk-pf-group-hidden")
			.forEach((el) => el.removeClass("otk-pf-group-hidden"));
	}
}

/** resolve 诊断用：settingTabs 是否存在（存在则报告个数） */
function describeSettingTabs(setting: unknown): string {
	const tabs = (setting as { settingTabs?: unknown } | undefined)?.settingTabs;
	return Array.isArray(tabs) ? `array of ${tabs.length}` : "missing";
}

/** resolve 诊断用：列出前几个 tab id，便于发现 id 命名变化 */
function sampleIds(tabs: unknown[]): string {
	return Array.from(tabs, (t) => String((t as { id?: unknown })?.id))
		.slice(0, 12)
		.join(",");
}

/**
 * 批量禁用确认框：目标命中保护清单（含 OTK 自身，始终隐式保护）时弹出。
 * 命中的保护插件逐行列出，**默认勾选（一并禁用）**，可逐个取消勾选排除；
 * 「禁用所选 (N)」的 N = 最终批次大小（未受保护目标 + 勾选的保护插件），随勾选实时更新。
 */
class BatchDisableConfirmModal extends Modal {
	/** 勾选的保护插件（默认全选 = 一并禁用） */
	#checked: Set<string>;
	/** 未受保护的目标（始终禁用，不出现勾选行） */
	#rest: string[];
	/** 命中保护清单的目标（勾选行，可逐个排除） */
	#guarded: string[];
	/** 「禁用所选」按钮引用（勾选变化时实时更新计数文案） */
	#runButton: ButtonComponent | null = null;

	constructor(
		app: App,
		targets: string[],
		guarded: string[],
		private readonly nameOf: (id: string) => string,
		private readonly selfId: string,
		private readonly onConfirm: (finalTargets: string[]) => void
	) {
		super(app);
		this.#guarded = guarded;
		this.#rest = targets.filter((id) => !guarded.includes(id));
		this.#checked = new Set(guarded);
	}

	#batchSize(): number {
		return this.#rest.length + this.#checked.size;
	}

	#refreshRunLabel(): void {
		this.#runButton?.setButtonText(
			LL.settings.plugin_filter.confirm_run({ count: this.#batchSize() })
		);
	}

	onOpen(): void {
		this.titleEl.setText(LL.settings.plugin_filter.confirm_title());
		this.contentEl.createEl("p", {
			text: LL.settings.plugin_filter.confirm_desc(),
			cls: "mod-muted",
		});

		const list = this.contentEl.createDiv("otk-pf-confirm-list");
		// 勾选行按显示名排序（与设置页 chips 的排序语义一致）
		for (const id of sortMembersForDisplay(this.#guarded, this.nameOf)) {
			const label = list.createEl("label", {
				cls: "otk-pf-confirm-row",
			});
			const checkbox = label.createEl("input", { type: "checkbox" });
			checkbox.checked = true;
			checkbox.onchange = () => {
				if (checkbox.checked) {
					this.#checked.add(id);
				} else {
					this.#checked.delete(id);
				}
				this.#refreshRunLabel();
			};
			label.createSpan({
				cls: "otk-pf-confirm-name",
				text: this.nameOf(id),
			});
			if (id === this.selfId) {
				label.createSpan({
					cls: "otk-pf-confirm-badge",
					text: LL.settings.plugin_filter.confirm_self_badge(),
				});
			}
			label.setAttribute("title", id);
		}

		new Setting(this.contentEl)
			.addButton((button) =>
				button
					.setButtonText(LL.settings.plugin_filter.confirm_cancel())
					.onClick(() => this.close())
			)
			.addButton((button) => {
				this.#runButton = button
					.setCta()
					.setButtonText(
						LL.settings.plugin_filter.confirm_run({
							count: this.#batchSize(),
						})
					)
					.onClick(() => {
						this.close();
						this.onConfirm([...this.#rest, ...this.#checked]);
					});
				return button;
			});
	}
}
