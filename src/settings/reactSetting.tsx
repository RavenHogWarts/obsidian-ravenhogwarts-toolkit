import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Setting, SettingDefinitionRender } from "obsidian";

/** 记录每个宿主元素当前挂载的 React root，避免同一容器被重复 createRoot */
const roots = new WeakMap<HTMLElement, Root>();

/**
 * 通用桥接：把任意 React 组件挂进 Obsidian 1.13 声明式设置项。
 *
 * 返回一个 `SettingDefinitionRender`——在 render 时清空该设置行、占满整行宽度并
 * 挂载一个 React root；框架在拆除该行前会调用返回的清理函数以卸载 React。
 *
 * 关键点：React 组件自行管理状态并异步落盘，**不再触发 `settingTab.update()`**，
 * 从而避免整页重渲染把用户从当前子页面弹出（删除、选文件、改匹配条件不再"重载"）。
 *
 * @param name 供搜索索引与无障碍使用的名称（不参与视觉布局）
 * @param node 每次挂载时调用，返回要渲染的 React 节点
 */
export function reactSetting(
	name: string,
	node: () => ReactNode
): SettingDefinitionRender {
	return {
		name,
		render: (setting: Setting) => {
			const host = setting.settingEl;

			// 防御：若同一容器上已存在 root（框架未先调用 cleanup 就重渲染），先卸载
			const existing = roots.get(host);
			if (existing) {
				existing.unmount();
				roots.delete(host);
			}

			host.empty();
			host.addClass("rht-react-host");

			const root = createRoot(host);
			roots.set(host, root);
			root.render(node());

			return () => {
				root.unmount();
				if (roots.get(host) === root) {
					roots.delete(host);
				}
			};
		},
	};
}
