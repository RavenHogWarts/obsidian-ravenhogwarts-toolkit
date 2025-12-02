import { IPluginContext } from "@src/model/toolkit/IPluginContext";
import { ITool } from "@src/model/toolkit/ITool";
import { IToolInfo } from "@src/model/toolkit/IToolInfo";
import { IToolSettings } from "@src/model/toolkit/IToolSettings";
import { Component } from "obsidian";

export abstract class BaseTool extends Component implements ITool {
	protected context: IPluginContext;
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

	get settings(): IToolSettings {
		const settings = this.context._settingsStore.getToolSettings(
			this.info.id
		);
		if (!settings) {
			throw new Error(`Settings for tool ${this.info.id} not found.`);
		}
		return settings;
	}

	async initialize(context: IPluginContext): Promise<void> {
		this.context = context;

		await this.context._settingsStore.loadToolSettings(
			this.info.id,
			this.getDefaultSettings()
		);
	}

	async onload(): Promise<void> {
		super.onload();
		this.enabled = true;
	}

	onunload(): void {
		this.enabled = false;
		super.onunload();
	}

	abstract getDefaultSettings(): IToolSettings;

	isEnabled(): boolean {
		return this.enabled && this.settings.enabled;
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

	protected async updateConfig<T>(key: string, value: T): Promise<void> {
		await this.context._settingsStore.updateToolSettingByPath(
			this.info.id,
			`config.${key}`,
			value
		);
	}

	protected async updateData<T>(key: string, value: T): Promise<void> {
		await this.context._settingsStore.updateToolSettingByPath(
			this.info.id,
			`data.${key}`,
			value
		);
	}
}
