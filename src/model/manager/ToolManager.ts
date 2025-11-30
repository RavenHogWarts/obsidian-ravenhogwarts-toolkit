import { IPluginContext } from "../toolkit/IPluginContext";
import { ITool } from "../toolkit/ITool";

export interface IToolState {
	enabled: boolean;
	loaded: boolean;
	errors: Error[];
}

export class ToolManager {
	private toolkit: Map<string, ITool> = new Map();
	private toolkitState: Map<string, IToolState> = new Map();
	private pluginContext: IPluginContext;

	constructor(pluginContext: IPluginContext) {
		this.pluginContext = pluginContext;
	}

	registerTool(tool: ITool): void {
		this.toolkit.set(tool.info.id, tool);
		this.toolkitState.set(tool.info.id, {
			enabled: false,
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
			await tool.initialize(this.pluginContext);
			await tool.onload();

			state.loaded = true;
			state.enabled = true;

			this.pluginContext.emitEvent(`tool-${id}-loaded`, { toolId: id });
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

			state.loaded = false;
			state.enabled = false;

			this.pluginContext.emitEvent(`tool-${id}-unloaded`, { toolId: id });
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
		await this.loadTool(id);
	}

	async disableTool(id: string): Promise<void> {
		await this.unloadTool(id);
	}

	async loadEnabledToolkit(): Promise<void> {
		const enabledToolkit = this.pluginContext._settings.toolkit || {};

		for (const [id, config] of Object.entries(enabledToolkit)) {
			if (config.enabled) {
				try {
					await this.loadTool(id);
				} catch (error) {
					console.error(`Failed to load tool ${id}:`, error);
					throw error;
				}
			}
		}
	}

	unloadToolkit(): void {
		for (const id of this.toolkit.keys()) {
			this.unloadTool(id);
		}
	}
}
