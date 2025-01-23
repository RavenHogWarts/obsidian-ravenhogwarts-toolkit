import { useCallback, useState } from "react";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { BaseManager } from "@/src/core/services/BaseManager";

export function useModuleConfig<T>(
	plugin: RavenHogwartsToolkitPlugin,
	moduleId: string
) {
	const manager = plugin.getManager(moduleId) as BaseManager<any>;
	const [config, setConfig] = useState(manager.getConfig());

	const updateConfig = useCallback(
		(updates: Partial<T>) => {
			const newConfig = {
				...config,
				...updates,
			};
			manager.setConfig(newConfig);
			setConfig(manager.getConfig());
		},
		[manager, config]
	);

	return { config, updateConfig };
}
