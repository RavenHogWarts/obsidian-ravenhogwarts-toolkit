import { BaseManager } from "@/src/core/services/BaseManager";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { useCallback, useState } from "react";

export function useModuleConfig<T>(
	plugin: RavenHogwartsToolkitPlugin,
	moduleId: string
) {
	const manager = plugin.getManager(moduleId) as BaseManager<any>;
	const [config, setConfig] = useState(manager.getConfig());

	const updateConfig = useCallback(
		(updates: Partial<T>) => {
			const newConfig = JSON.parse(JSON.stringify(config)); // Deep clone

			// Handle nested updates
			Object.entries(updates).forEach(([key, value]) => {
				if (key.includes(".")) {
					// Handle nested path updates
					const parts = key.split(".");
					let current: any = newConfig;
					for (let i = 0; i < parts.length - 1; i++) {
						if (!current[parts[i]]) {
							current[parts[i]] = {};
						}
						current = current[parts[i]];
					}
					current[parts[parts.length - 1]] = value;
				} else {
					// For non-nested updates
					if (Array.isArray(value)) {
						// 直接赋值数组
						newConfig[key] = value;
					} else if (typeof value === "object" && value !== null) {
						// 对象进行合并
						newConfig[key] = { ...newConfig[key], ...value };
					} else {
						// 基本类型直接赋值
						newConfig[key] = value;
					}
				}
			});

			manager.setConfig(newConfig);
			setConfig(manager.getConfig());
		},
		[manager, config]
	);

	return { config, updateConfig };
}
