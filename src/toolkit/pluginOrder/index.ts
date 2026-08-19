import { LL } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import type { IPluginContext } from "@src/model/toolkit/IPluginContext";
import { reactSetting } from "@src/settings/reactSetting";
import type { SettingDefinitionItem } from "obsidian";
import { createElement } from "react";
import { computePluginOrder, parsePriorityPlugins } from "./service/orderKeeper";
import { collectInstalledPlugins } from "./service/pluginInventory";
import { PriorityListEditor } from "./settings/PriorityListEditor";
import { DefaultSettings, ISettings } from "./types";

/**
 * plugin-order：把一个或多个指定插件 id（按配置顺序）保持在
 * community-plugins.json 数组最前，控制其最先加载。
 *
 * enforce 时机 = onload + 配置变更（settingsStore 订阅 + 快照比对，静默）
 * + 插件启停/增删（app.plugins "changed" 事件，静默）
 * + 手动命令/设置页 action（仅"已重排/结构异常"两种 Notice，其余不打扰）。
 * 对当前会话无效（启动时 Obsidian 已读取过该文件），下次启动生效。
 */
@Toolkit({
	id: "plugin-order",
	name: LL.settings.plugin_order.name(),
	icon: "list-ordered",
	version: "1.2.0",
	description: LL.settings.plugin_order.desc(),
})
export default class PluginOrderTool extends BaseTool<ISettings> {
	#enforceChain: Promise<void> = Promise.resolve();
	#unsubscribe?: () => void;
	#lastConfigSnapshot = "";
	/** 合并突发的多次 changed，避免为同一次启停排多份 settle+enforce */
	#pluginChangePending = false;

	getDefaultSettings(): ISettings {
		return structuredClone(DefaultSettings);
	}

	async initialize(context: IPluginContext): Promise<void> {
		// 迁移：v1 textarea 文本格式（多行字符串）→ v2 数组（React 岛存储格式）
		const raw = context._settingsStore.settings.toolkit[this.info.id] as
			| { config?: { priorityPlugins?: unknown } }
			| undefined;
		if (typeof raw?.config?.priorityPlugins === "string") {
			raw.config.priorityPlugins = parsePriorityPlugins(
				raw.config.priorityPlugins
			);
		}
		await super.initialize(context);
	}

	onload(): void {
		super.onload(); // 约定：必须首行

		// 1) 配置变更 → 静默重新 enforce（快照比对防抖；缓存落盘 updateData 亦会
		//    通知订阅者，靠 snapshot 无变化短路，不会形成 enforce 循环。
		//    状态已在 React 岛内实时呈现，不发 Notice）
		this.#lastConfigSnapshot = JSON.stringify(
			this.settings.config.priorityPlugins
		);
		this.#unsubscribe = this.context._settingsStore.store.subscribe(() => {
			const next = JSON.stringify(this.settings.config.priorityPlugins);
			if (next !== this.#lastConfigSnapshot) {
				this.#lastConfigSnapshot = next;
				this.#enqueueEnforce({ reason: "config-change" });
			}
		});

		// 2) 插件启停/增删 → 静默重排。补齐关键场景：会话内重新启用某优先插件时，
		//    Obsidian 会把它追加到 community-plugins.json 末尾——此处即时上浮回最前，
		//    使「下次启动」就生效（否则要多重启一次）。registerEvent 托管，禁用/卸载自动解绑。
		//    ⚠ changed 先于 Obsidian 的 requestSaveConfig（去抖写盘）触发：直接读会读到
		//    旧文件（实测：关闭插件后 changed 时文件仍是启用态）。故经
		//    #schedulePluginChangeEnforce 等文件写盘后再 enforce。重排不改集合成员，
		//    不与该事件形成循环（computePluginOrder 幂等）。
		this.registerEvent(
			this.context._app.plugins.on("changed", () => {
				// [诊断日志] 确认监听确实被触发；在 Obsidian 里 toggle 任一插件即应打印此行
				this.context.log(
					"info",
					"app.plugins 'changed' 触发 → 待写盘后 enforce",
					"plugin-order"
				);
				this.#schedulePluginChangeEnforce();
			})
		);
		// [诊断日志] 确认监听已注册（onload 时打印一次）
		this.context.log(
			"info",
			"已注册 app.plugins 'changed' 监听",
			"plugin-order"
		);

		// 3) 启动即 enforce 一次（静默：刷新缓存 + 修正顺序）
		this.#enqueueEnforce({ reason: "onload" });

		// 4) 手动命令
		this.registerCommand({
			id: "apply",
			name: LL.command.plugin_order.apply(),
			callback: () =>
				this.#enqueueEnforce({ withNotice: true, reason: "command" }),
		});
	}

	onunload(): void {
		this.#unsubscribe?.();
		this.#unsubscribe = undefined;
		this.unregisterCommands();
		super.onunload(); // 约定：必须尾行
	}

	getSettingItems(): SettingDefinitionItem[] {
		return [
			// 优先插件编辑器为 React 岛：联想添加（候选来自已安装插件缓存，
			// 显示 name、存储 id）、上下移排序、删除、三态徽标；
			// 本地状态 + 异步落盘，不触发 settingTab.update()（不整页重渲染）。
			reactSetting(LL.settings.plugin_order.priority_plugins.name(), () =>
				createElement(PriorityListEditor, {
					app: this.context._app,
					initialIds: sanitizeIds(
						this.settings.config.priorityPlugins
					),
					getInstalledPlugins: () =>
						this.settings.data.installedPlugins,
					persist: (ids: string[]) => {
						void this.context._settingsStore.updateToolSettingByPath(
							this.info.id,
							"config.priorityPlugins",
							ids
						);
					},
				})
			),
			{
				// action 行：立即应用 + 刷新缓存（同一入口；新装插件后刷新联想候选）
				name: LL.settings.plugin_order.apply_now.name(),
				desc: LL.settings.plugin_order.apply_now.desc(),
				action: () =>
					this.#enqueueEnforce({ withNotice: true, reason: "action" }),
			},
		];
	}

	/** 串行执行，避免并发读写交错；所有入口（onload/订阅/命令/action/changed）共用 */
	#enqueueEnforce(options?: { withNotice?: boolean; reason?: string }): void {
		const reason = options?.reason ?? "manual";
		this.#enforceChain = this.#enforceChain
			.then(() => this.#enforce(options?.withNotice === true, reason))
			.catch((error: unknown) => {
				const message = error instanceof Error ? error.message : String(error);
				this.context.log(
					"warn",
					`enforce failed (reason=${reason}): ${message}`,
					"plugin-order"
				);
				if (options?.withNotice) {
					this.context.notice(LL.notice.plugin_order.invalid());
				}
			});
	}

	/**
	 * changed 专用入口：合并突发事件 + 等文件写盘后再 enforce。
	 * changed 先于 Obsidian 的 requestSaveConfig（去抖写盘）触发，直接 enforce 会读到
	 * 旧文件（读-写竞争，实测关闭插件后文件仍是启用态）。因此进入串行链后先
	 * {@link #waitForConfigSettled} 等文件写盘，再 enforce。
	 */
	#schedulePluginChangeEnforce(): void {
		if (this.#pluginChangePending) return; // 突发多次 changed 合并为一次
		this.#pluginChangePending = true;
		this.#enforceChain = this.#enforceChain
			.then(async () => {
				this.#pluginChangePending = false; // 进入执行即释放，后续新启停可再排队
				if (!this.enabled) return; // 卸载后不再动作
				await this.#waitForConfigSettled();
				if (!this.enabled) return; // 等待期间可能被卸载
				await this.#enforce(false, "plugin-changed");
			})
			.catch((error: unknown) => {
				this.#pluginChangePending = false;
				const message = error instanceof Error ? error.message : String(error);
				this.context.log(
					"warn",
					`enforce failed (reason=plugin-changed): ${message}`,
					"plugin-order"
				);
			});
	}

	/**
	 * 等待 community-plugins.json 的成员与运行时 `app.plugins.enabledPlugins` 一致
	 * （= Obsidian 已把本次启停写盘）。有界轮询（~6s），超时则尽力而为直接返回；
	 * 无法比对成员（enabledPlugins 缺失）时退化为固定短等待越过去抖。
	 */
	async #waitForConfigSettled(): Promise<void> {
		const { configDir, adapter } = this.context._app.vault;
		const configPath = `${configDir}/community-plugins.json`;
		const enabled = this.context._app.plugins?.enabledPlugins;
		if (!(enabled instanceof Set)) {
			await sleep(2500); // 兜底：拿不到权威成员集时固定等待，尽量越过写盘去抖
			return;
		}
		for (let attempt = 0; attempt < 30; attempt++) {
			let settled = false;
			try {
				const parsed: unknown = JSON.parse(await adapter.read(configPath));
				if (Array.isArray(parsed)) {
					const fileSet = new Set(
						parsed.filter((x): x is string => typeof x === "string")
					);
					settled =
						fileSet.size === enabled.size &&
						[...enabled].every((id) => fileSet.has(id));
				}
			} catch {
				// 读取/解析失败：当作未就绪，继续等
			}
			if (settled) {
				// [诊断日志] 文件已反映本次启停，可安全 enforce
				this.context.log(
					"info",
					`config 已写盘（等待 ~${attempt * 200}ms）→ enforce`,
					"plugin-order"
				);
				return;
			}
			await sleep(200);
		}
		// [诊断日志] 兜底：等太久仍尝试 enforce（best-effort）
		this.context.log(
			"warn",
			"config 写盘等待超时（~6s），仍尝试 enforce",
			"plugin-order"
		);
	}

	async #enforce(withNotice: boolean, reason = "unknown"): Promise<void> {
		const orderedIds = sanitizeIds(this.settings.config.priorityPlugins);
		if (orderedIds.length === 0) {
			// [诊断日志] 空列表：什么都不做（changed 频繁触发时靠这条快速确认已短路）
			this.context.log(
				"info",
				`enforce 跳过：优先列表为空 (reason=${reason})`,
				"plugin-order"
			);
			return; // 空配置：静默无操作
		}

		const { configDir, adapter } = this.context._app.vault;

		// 1) 刷新已安装插件缓存（无论是否启用：运行时 manifests 主路径 / 目录扫描兜底）
		const installed = await collectInstalledPlugins(
			this.context._app,
			adapter,
			configDir
		);
		await this.updateData("installedPlugins", installed);
		await this.updateData("installedPluginsCachedAt", Date.now());

		// 2) 读启用列表（配置目录名可被用户自定义，必须从 vault 动态获取）
		const configPath = `${configDir}/community-plugins.json`;
		let enabledIds: unknown;
		try {
			enabledIds = JSON.parse(await adapter.read(configPath));
		} catch {
			this.context.log(
				"warn",
				`enforce 跳过：读取/解析 ${configPath} 失败 (reason=${reason})`,
				"plugin-order"
			);
			if (withNotice) this.context.notice(LL.notice.plugin_order.invalid());
			return;
		}

		// [诊断日志] 打印决策输入：优先项在文件数组中的实际下标（-1 = 不在文件中，
		//   即未启用/未安装）。这是判断"为何 unchanged"的关键：
		//   · 目标插件此刻下标已是 0 → 本次读到的确实已满足（可能稍后被其他写入者覆盖）；
		//   · 下标为 -1 → 读早了，文件尚未反映刚发生的启用（读-写竞争）；
		//   · 下标 > 0（尤其在末尾）→ 应当 reordered，若仍报 unchanged 则是判定逻辑问题。
		if (Array.isArray(enabledIds)) {
			const fileArr = enabledIds as unknown[];
			const positions = orderedIds
				.map((id) => `${id}@${fileArr.indexOf(id)}`)
				.join(", ");
			this.context.log(
				"info",
				`enforce 决策 (reason=${reason})：文件长度=${fileArr.length}，优先项位置=[${positions}]`,
				"plugin-order"
			);
		}

		// 3) 计算并写回（差异才写；结构异常不动文件；unchanged 不打扰）
		const outcome = computePluginOrder(enabledIds, orderedIds);
		if (outcome.status === "skipped-invalid") {
			this.context.log(
				"warn",
				`enforce 跳过：community-plugins.json 结构异常 (reason=${reason})`,
				"plugin-order"
			);
			if (withNotice) this.context.notice(LL.notice.plugin_order.invalid());
			return;
		}
		if (outcome.status === "reordered") {
			await adapter.write(configPath, JSON.stringify(outcome.nextIds));
			// [诊断日志] 真正改动了文件——这行出现即说明监听→重排链路完整生效
			this.context.log(
				"info",
				`enforce 已重排 community-plugins.json (reason=${reason})`,
				"plugin-order",
				outcome.nextIds
			);
			if (withNotice) this.context.notice(LL.notice.plugin_order.applied());
		} else {
			// [诊断日志] 顺序已满足，无需写文件（幂等短路，也是防循环的关键）
			this.context.log(
				"info",
				`enforce 无需改动：顺序已满足 (reason=${reason})`,
				"plugin-order"
			);
		}
	}
}

/** 防御性清洗：仅保留非空字符串项（抵御手改 data.json 的脏数据） */
function sanitizeIds(value: readonly unknown[]): string[] {
	return value.filter((id): id is string => typeof id === "string" && id !== "");
}

/** 简单延时（#waitForConfigSettled 轮询用） */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}
