import { LL } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import {
	Menu,
	setIcon,
	type SettingDefinitionItem,
	type SettingTab,
} from "obsidian";
import { computeCounts } from "./service/filterCore";
import {
	DefaultSettings,
	FILTER_STATES,
	FILTER_STATE_CLASSES,
	ISettings,
	PluginFilterState,
} from "./types";
import "./settings/pluginFilter.css";

/** 排障期开关：定位完成后可改为 false（日志经 context.log 打到 console） */
const DEBUG = true;

/** 筛选按钮图标（恒定；有激活筛选时按钮高亮） */
const BUTTON_ICON = "filter";

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
	/** 筛选状态仅会话内记忆（重开设置回「全部」），不落 settings（设计 §5.5） */
	#state: PluginFilterState = "all";
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
	/** 有界轮询定时器（onload 期 resolve 失败时的兜底；成功即自停） */
	#retryTimer: number | null = null;
	#attempts = 0;

	getDefaultSettings(): ISettings {
		return structuredClone(DefaultSettings);
	}

	getSettingItems(): SettingDefinitionItem[] {
		// 零配置工具：仅 buildToolPage 自动 prepend 的 Enabled 开关
		return [];
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
		this.#applyFilterClass();
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
		if (control.querySelector(":scope > [data-otk-plugin-filter]")) {
			return;
		}

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

	#applyFilterClass(): void {
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
		for (const items of groups) {
			for (const [state, className] of Object.entries(FILTER_STATE_CLASSES)) {
				items.classList.toggle(className, state === this.#state);
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
			// 按钮恒为 filter 图标；有激活筛选时高亮提示
			button.classList.toggle("is-active", this.#state !== "all");
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

	/** 按钮 tooltip：如「插件筛选：全部 (82)」 */
	#buttonLabel(): string {
		return LL.settings.plugin_filter.tooltip({
			label: this.#stateLabel(this.#state),
		});
	}

	#openFilterMenu(evt: MouseEvent): void {
		const menu = new Menu();
		for (const state of FILTER_STATES) {
			menu.addItem((item) => {
				// ✓ 追加在文字后（MenuItem.setIcon 只能渲染在文字前，不合需求）
				item.setTitle(
					state === this.#state
						? `${this.#stateLabel(state)} ✓`
						: this.#stateLabel(state)
				).onClick(() => {
					this.#state = state;
					this.#debug(`filter state -> ${this.#state}`);
					this.#applyFilterClass();
					this.#refreshCounts();
				});
			});
		}
		menu.showAtMouseEvent(evt);
	}

	#handleClick(evt: MouseEvent): void {
		const target = evt.target;
		const button =
			target instanceof Element
				? target.closest<HTMLElement>("[data-otk-plugin-filter]")
				: null;
		if (button) this.#openFilterMenu(evt);
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
		this.#state = "all";
		this.#attempts = 0;
		if (!tab) return;

		this.#observer?.disconnect();
		this.#observer = null;
		tab.containerEl.querySelector("[data-otk-plugin-filter]")?.remove();
		tab.containerEl
			.querySelectorAll(
				".setting-items.otk-pf-state-enabled, .setting-items.otk-pf-state-disabled"
			)
			.forEach((el) =>
				el.classList.remove("otk-pf-state-enabled", "otk-pf-state-disabled")
			);
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
