import { ITool } from "../toolkit/ITool";

export class ToolkitRegistry {
	private static instance: ToolkitRegistry;
	private toolkit: Map<string, new () => ITool> = new Map();

	private constructor() {}

	static getInstance(): ToolkitRegistry {
		if (!ToolkitRegistry.instance) {
			ToolkitRegistry.instance = new ToolkitRegistry();
		}
		return ToolkitRegistry.instance;
	}

	register(id: string, toolClass: new () => ITool): void {
		if (this.toolkit.has(id)) {
			throw new Error(`Tool with id ${id} is already registered.`);
		}
		this.toolkit.set(id, toolClass);
	}

	get(id: string): (new () => ITool) | undefined {
		return this.toolkit.get(id);
	}

	has(id: string): boolean {
		return this.toolkit.has(id);
	}

	unregister(id: string): boolean {
		return this.toolkit.delete(id);
	}

	clear(): void {
		this.toolkit.clear();
	}
}

export const toolkitRegistry = ToolkitRegistry.getInstance();
