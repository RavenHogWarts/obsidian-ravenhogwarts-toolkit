import { Component, type SettingDefinitionItem } from "obsidian";
import { IPluginContext } from "./IPluginContext";
import { IToolInfo } from "./IToolInfo";
import { IToolSettings } from "./IToolSettings";

export interface ITool<TSettings extends IToolSettings = IToolSettings>
	extends Component {
	readonly info: IToolInfo;
	readonly settings: TSettings;

	initialize(context: IPluginContext): Promise<void>;
	onload(): Promise<void>;
	onunload(): void;

	getDefaultSettings(): TSettings;

	isEnabled(): boolean;
	setEnabled(enabled: boolean): void;

	getErrors(): Error[];
	clearErrors(): void;

	getSettingItems(): SettingDefinitionItem[];
}
