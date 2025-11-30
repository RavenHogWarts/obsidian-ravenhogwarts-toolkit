import { IPluginContext } from "./IPluginContext";
import { IToolInfo } from "./IToolInfo";

export interface ITool {
	readonly info: IToolInfo;

	initialize(context: IPluginContext): Promise<void>;
	onload(): Promise<void>;
	onunload(): void;

	getDefaultSettings(): Record<string, any>;
	validateSettings(settings: Record<string, any>): boolean;

	isEnabled(): boolean;
	setEnabled(enabled: boolean): void;

	getErrors(): Error[];
	clearErrors(): void;
}
