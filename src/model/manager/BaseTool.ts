import { IPluginContext } from "@src/model/toolkit/IPluginContext";
import { ITool } from "@src/model/toolkit/ITool";
import { IToolInfo } from "@src/model/toolkit/IToolInfo";
import { IToolSettings } from "@src/model/toolkit/IToolSettings";

export abstract class BaseTool implements ITool {
	protected context: IPluginContext;
	protected settings: IToolSettings;
	protected enabled: boolean = false;
	protected errors: Error[] = [];

	get info(): IToolInfo {
		const meta = (this as any).toolkitMeta;
		if (!meta) {
			throw new Error(
				`Tool ${this.constructor.name} is missing @Toolkit decorator`
			);
		}
		return meta;
	}

	async initialize(context: IPluginContext): Promise<void> {
		this.context = context;
		this.settings = this.getDefaultSettings();
	}

	async onload(): Promise<void> {
		this.enabled = true;
	}

	onunload(): void {
		this.enabled = false;
	}

	abstract getDefaultSettings(): IToolSettings;

	isEnabled(): boolean {
		return this.enabled;
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}

	getErrors(): Error[] {
		return [...this.errors];
	}

	clearErrors(): void {
		this.errors = [];
	}

	protected addError(error: Error): void {
		this.errors.push(error);
	}
}
