import { Component } from "obsidian";
import { IPluginContext } from "./IPluginContext";
import { IToolInfo } from "./IToolInfo";
import { IToolSettings } from "./IToolSettings";

export interface ITool extends Component {
	readonly info: IToolInfo;

	initialize(context: IPluginContext): Promise<void>;
	onload(): Promise<void>;
	onunload(): void;

	getDefaultSettings(): IToolSettings;

	isEnabled(): boolean;
	setEnabled(enabled: boolean): void;

	getErrors(): Error[];
	clearErrors(): void;
}
