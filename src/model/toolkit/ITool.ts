import { Component } from "obsidian";
import { ComponentType } from "react";
import { IPluginContext } from "./IPluginContext";
import { IToolInfo } from "./IToolInfo";
import { IToolSettings } from "./IToolSettings";

export interface IToolSettingsProps {
	tool: ITool;
	onBack: () => void;
}

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

	getSettingsComponent(): ComponentType<IToolSettingsProps>;
}
