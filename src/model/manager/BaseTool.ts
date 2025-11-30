import { IPluginContext } from "../toolkit/IPluginContext";
import { ITool } from "../toolkit/ITool";
import { IToolInfo } from "../toolkit/IToolInfo";

export abstract class BaseTool implements ITool {
	protected context: IPluginContext;
	protected settings: Record<string, any> = {};
	protected enabled: boolean = false;
	protected errors: Error[] = [];

	abstract readonly info: IToolInfo;

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

	getDefaultSettings(): Record<string, any> {
		return {};
	}

	validateSettings(settings: Record<string, any>): boolean {
		return true;
	}

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
