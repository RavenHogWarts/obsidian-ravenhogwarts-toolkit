import { IPluginContext } from "../toolkit/IPluginContext";
import { ITool } from "../toolkit/ITool";

export interface IToolState {
	loaded: boolean;
	errors: Error[];
}

export class ToolkitManager {
	private toolkit: Map<string, ITool> = new Map();
	private toolkitState: Map<string, IToolState> = new Map();
	private pluginContext: IPluginContext;

	constructor(pluginContext: IPluginContext) {
		this.pluginContext = pluginContext;
	}

	registerTool(tool: ITool): void {
		this.toolkit.set(tool.info.id, tool);
		this.toolkitState.set(tool.info.id, {
			loaded: false,
			errors: [],
		});
	}

	async loadTool(id: string): Promise<void> {
		const tool = this.toolkit.get(id);
		if (!tool) {
			throw new Error(`Tool ${id} not found.`);
		}

		const state = this.toolkitState.get(id)!;
		if (state.loaded) return;

		try {
			const settings =
				this.pluginContext._settingsStore.getToolSettings(id);
			if (!settings?.enabled) {
				return;
			}
			this.pluginContext._plugin.addChild(tool);

			state.loaded = true;

			this.pluginContext.log("info", `loaded successfully`, id);
		} catch (error) {
			state.errors.push(error as Error);
			throw error;
		}
	}

	async unloadTool(id: string): Promise<void> {
		const tool = this.toolkit.get(id);
		if (!tool) return;

		const state = this.toolkitState.get(id)!;
		if (!state.loaded) return;

		try {
			tool.onunload();
			this.pluginContext._plugin.removeChild(tool);

			state.loaded = false;

			this.pluginContext.log("info", `unloaded successfully`, id);
		} catch (error) {
			state.errors.push(error as Error);
			throw error;
		}
	}

	getTool(id: string): ITool | undefined {
		return this.toolkit.get(id);
	}

	getToolkit(): ITool[] {
		return Array.from(this.toolkit.values());
	}

	getEnabledToolkit(): ITool[] {
		return this.getToolkit().filter((tool) => tool.isEnabled());
	}

	isToolLoaded(id: string): boolean {
		const state = this.toolkitState.get(id);
		return state?.loaded || false;
	}

	async enableTool(id: string): Promise<void> {
		await this.pluginContext._settingsStore.updateToolSettingByPath<boolean>(
			id,
			"enabled",
			true
		);
		await this.loadTool(id);
	}

	async disableTool(id: string): Promise<void> {
		await this.pluginContext._settingsStore.updateToolSettingByPath<boolean>(
			id,
			"enabled",
			false
		);
		await this.unloadTool(id);
	}

	async loadEnabledToolkit(): Promise<void> {
		const enabledToolkit = this.pluginContext._settings.toolkit || {};
		const loadErrors: Array<{ id: string; error: Error }> = [];

		for (const [id, config] of Object.entries(enabledToolkit)) {
			if (config.enabled) {
				try {
					await this.loadTool(id);
				} catch (error) {
					const err = error as Error;
					loadErrors.push({ id, error: err });
					this.pluginContext.log(
						"error",
						`Failed to load tool ${id}: ${err.message}`,
						id
					);
					const state = this.toolkitState.get(id);
					if (state) {
						state.errors.push(err);
					}
				}
			}
		}
	}

	unloadToolkit(): void {
		for (const id of this.toolkit.keys()) {
			void this.unloadTool(id);
		}
	}
}
