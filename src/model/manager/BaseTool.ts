import { IPluginContext } from "@src/model/toolkit/IPluginContext";
import { ITool } from "@src/model/toolkit/ITool";
import { IToolInfo } from "@src/model/toolkit/IToolInfo";
import { IToolSettings } from "@src/model/toolkit/IToolSettings";
import {
	Command,
	Component,
	Menu,
	MenuItem,
	type SettingDefinitionItem,
} from "obsidian";

export abstract class BaseTool<TSettings extends IToolSettings = IToolSettings>
	extends Component
	implements ITool<TSettings>
{
	protected context: IPluginContext;
	protected enabled: boolean = false;
	protected errors: Error[] = [];
	/** 本工具已注册的命令 id（已作用域化），用于卸载时统一移除。 */
	private readonly registeredCommandIds: string[] = [];

	get info(): IToolInfo {
		// Access decorator-injected metadata (no safe typed alternative available)
		const meta = Reflect.getMetadata(Symbol.for("toolkit:meta"), this.constructor) as IToolInfo | undefined;
		if (!meta) {
			throw new Error(
				`Tool ${this.constructor.name} is missing @Toolkit decorator`
			);
		}
		return meta;
	}

	get settings(): TSettings {
		const settings = this.context._settingsStore.getToolSettings(
			this.info.id
		);
		if (!settings) {
			throw new Error(`Settings for tool ${this.info.id} not found.`);
		}
		return settings as TSettings;
	}

	async initialize(context: IPluginContext): Promise<void> {
		this.context = context;

		await this.context._settingsStore.loadToolSettings(
			this.info.id,
			this.getDefaultSettings()
		);
	}

	onload(): void {
		super.onload();
		this.enabled = true;
	}

	onunload(): void {
		this.enabled = false;
		super.onunload();
	}

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

	abstract getDefaultSettings(): TSettings;

	getSettingItems(): SettingDefinitionItem[] {
		return [];
	}

	protected addError(error: Error): void {
		this.errors.push(error);
	}

	/**
	 * 注册一条命令，自动完成两件所有工具都需要的事：
	 * 1. 命令 id 以 `工具id-` 作用域化，避免跨工具冲突；
	 * 2. 命令名统一加 `[工具名] ` 前缀，便于在命令面板中区分归属与搜索。
	 * 传入的 `command.id`/`command.name` 只需写业务本身，无需再手拼前缀。
	 * 记录已注册的 id，`unregisterCommands()` 会一并移除。
	 */
	protected registerCommand(command: Command): void {
		const scopedId = `${this.info.id}-${command.id}`;
		this.context._plugin.addCommand({
			...command,
			id: scopedId,
			name: `[${this.info.name}] ${command.name}`,
		});
		this.registeredCommandIds.push(scopedId);
	}

	/** 移除本工具通过 {@link registerCommand} 注册的全部命令。 */
	protected unregisterCommands(): void {
		for (const id of this.registeredCommandIds) {
			this.context._plugin.removeCommand(id);
		}
		this.registeredCommandIds.length = 0;
	}

	/**
	 * 向右键菜单添加一条归属于本插件的菜单项。
	 * 所有工具的条目会聚合到统一的 "插件名 ▸ ..." 子菜单下，
	 * 从而在原生菜单中天然区分归属、且不随工具增多而膨胀。
	 * 自动按工具分组：切换工具时插入分割线，同工具连续条目不插（见
	 * {@link IPluginContext.addToolkitMenuItem}）。
	 * @param menu 事件回调收到的菜单实例
	 * @param configure 配置菜单项（标题、图标、点击回调等）
	 * @param section 首个调用者决定子菜单父项所在的 section
	 */
	protected addToolkitMenuItem(
		menu: Menu,
		configure: (item: MenuItem) => void,
		section = "action"
	): void {
		this.context.addToolkitMenuItem(menu, this.info.id, configure, section);
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
