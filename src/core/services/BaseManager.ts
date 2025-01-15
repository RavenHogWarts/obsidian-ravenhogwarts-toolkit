import { App, Command, Component, Menu } from 'obsidian';
import { IRavenHogwartsToolkitConfig, IToolkitModule } from '../interfaces/types';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { Logger } from '@/src/core/services/Log';
import { getStandardTime } from '@/src/lib/date';
import { t, TranslationKeys } from '@/src/i18n/i18n';
import { QUICK_PATH_DEFAULT_CONFIG } from '@/src/toolkit/quickPath/types/config';
import { TABLE_ENHANCEMENTS_DEFAULT_CONFIG } from '@/src/toolkit/tableEnhancements/types/config';
import { FRONTMATTER_SORTER_DEFAULT_CONFIG } from '@/src/toolkit/frontmatterSorter/types/config';
import { READING_PROGRESS_DEFAULT_CONFIG } from '@/src/toolkit/readingProgress/types/config';

interface MenuItemConfig {
    title: string;
    icon?: string;
    callback?: () => any;
    group?: string;
    order?: number;
    items?: MenuItemConfig[];
}

export abstract class BaseManager<T extends IToolkitModule> extends Component {
    private initPromise: Promise<void>;
    protected config: T['config'];
    protected data: T['data'];
    protected logger: Logger;
    protected app: App;
    protected registeredCommands: string[] = [];
    
    constructor(
        protected plugin: RavenHogwartsToolkitPlugin,
        protected moduleId: string,
        protected settings: IRavenHogwartsToolkitConfig,
    ) {
        super();
        this.app = this.plugin.app;
        // 使用模块级别的 logger
        this.logger = Logger.getLogger(this.moduleId);

        // 初始化模块（异步）
        this.initPromise = this.initializeModule();
    }

    private async initializeModule() {
        if (!this.settings.toolkit[this.moduleId]) {
            // 如果模块完全不存在，才初始化默认设置
            this.settings.toolkit[this.moduleId] = {
                config: this.getDefaultConfig(),
                data: {
                    lastModified: getStandardTime()
                }
            };
        } else {
            // 如果模块存在，只合并缺失的默认配置，保留现有数据
            const defaultConfig = this.getDefaultConfig();
            const currentConfig = this.settings.toolkit[this.moduleId].config;
            const currentData = this.settings.toolkit[this.moduleId].data;
            
            this.settings.toolkit[this.moduleId] = {
                config: this.cleanConfig(currentConfig, defaultConfig),
                data: currentData    // 完全保留现有数据
            };
        }
        
        // 保存设置到 data.json
        await this.plugin.saveData(this.settings);
        this.logger.debug('Module settings initialized:', this.moduleId);
        
        this.config = this.settings.toolkit[this.moduleId].config;
        this.data = this.settings.toolkit[this.moduleId].data;
    }

    private cleanConfig(currentConfig: any, defaultConfig: any): any {
        // 如果是基本类型或数组，直接返回当前值，如果当前值不存在则返回默认值
        if (typeof defaultConfig !== 'object' || Array.isArray(defaultConfig) || defaultConfig === null) {
            return currentConfig ?? defaultConfig;
        }

        const cleanedConfig: any = {};

        // 遍历默认配置的所有字段
        for (const key in defaultConfig) {
            if (key in currentConfig) {
                // 递归清理嵌套对象
                cleanedConfig[key] = this.cleanConfig(currentConfig[key], defaultConfig[key]);
            } else {
                // 如果字段不存在，使用默认值
                cleanedConfig[key] = defaultConfig[key];
            }
        }

        return cleanedConfig;
    }

    protected getDefaultConfig(): T['config'] {
        switch (this.moduleId) {
            case 'quickPath':
                return QUICK_PATH_DEFAULT_CONFIG;
            case 'tableEnhancements':
                return TABLE_ENHANCEMENTS_DEFAULT_CONFIG;
            case 'frontmatterSorter':
                return FRONTMATTER_SORTER_DEFAULT_CONFIG;
            case 'readingProgress':
                return READING_PROGRESS_DEFAULT_CONFIG;
            default:
                this.logger.throwError(new Error(`Unknown module ID: ${this.moduleId}`));
        }
    }

    protected async waitForInitialization(): Promise<void> {
        await this.initPromise;
    }

    public async onload(): Promise<void> {
        await this.waitForInitialization();
        // 调用子类的加载方法
        await this.onModuleLoad();
    }
    protected abstract onModuleLoad(): Promise<void>;
    public async onunload(): Promise<void> {
       // 确保在卸载时清理资源
       this.onModuleUnload();
   }
    protected onModuleUnload(): void {
       // 默认实现，子类可以重写
       this.logger.debug('Module unloaded:', this.moduleId);
   }

    protected async saveSettings(): Promise<void> {
        try {
            this.settings.toolkit[this.moduleId] = {
                config: this.config,
                data: this.data
            };
            await this.plugin.saveData(this.settings);
            this.logger.debug('Settings saved for module:', this.moduleId);
        } catch (error) {
            this.logger.throwError(new Error(`Error saving settings for module: ${this.moduleId}`), error);
        }
    }

    protected async updateConfig(newConfig: Partial<T['config']>): Promise<void> {
        try {
            this.logger.debug('Updating config for module:', this.moduleId, newConfig);
            const oldConfig = { ...this.config };  // 保存旧配置
            this.config = { ...this.config, ...newConfig };
            this.data.lastModified = getStandardTime();
            await this.saveSettings();
            
            // 如果配置确实发生了变化，调用 onConfigChange
            if (JSON.stringify(oldConfig) !== JSON.stringify(this.config)) {
                this.onConfigChange?.();
            }
        } catch (error) {
            this.logger.throwError(new Error(`Error updating config for module: ${this.moduleId}`), error);
        }
    }

    public async setConfig(newConfig: T['config']): Promise<void> {
        try {
            const oldConfig = { ...this.config };  // 保存旧配置
            this.config = newConfig;
            this.data.lastModified = getStandardTime();
            await this.saveSettings();
            
            // 如果配置确实发生了变化，调用 onConfigChange
            if (JSON.stringify(oldConfig) !== JSON.stringify(this.config)) {
                this.onConfigChange?.();
            }
        } catch (error) {
            this.logger.throwError(new Error(`Error setting config for module: ${this.moduleId}`), error);
        }
    }

    protected async updateData(newData: Partial<T['data']>): Promise<void> {
        try {
            this.logger.debug('Updating data for module:', this.moduleId, newData);
            this.data = { ...this.data, ...newData };
            this.data.lastModified = getStandardTime();
            await this.saveSettings();
        } catch (error) {
            this.logger.throwError(new Error(`Error updating data for module: ${this.moduleId}`), error);
        }
    }

    protected t(key: TranslationKeys, params?: any): string {
        return t(key, params);
    }

    protected get pluginInstance(): RavenHogwartsToolkitPlugin {
        return this.plugin;
    }

    // 重写 Component 的 registerEvent 以添加启用状态检查
    public registerEvent(eventRef: any): void {
        if (this.isEnabled()) {
            super.registerEvent(eventRef);
        }
    }

    protected unregisterEvents(): void {
        ((this as any).events || []).forEach(eventRef => eventRef());
        (this as any).events = [];
    }

    // 为常用的命令注册提供便捷方法
    protected addCommand(command: Command): void {
        const enhancedCommand = {
            ...command,
            id: command.id.includes(this.moduleId) ? command.id : `${this.moduleId}.${command.id}`,
            name: `${this.moduleId}: ${command.name}`,
            checkCallback: (checking: boolean) => {
                if (checking) return this.isEnabled();
                if (this.isEnabled() && command.callback) {
                    command.callback();
                    return true;
                }
                return false;
            }
        }
        this.plugin.addCommand(enhancedCommand);
        this.registeredCommands.push(enhancedCommand.id);
    }

    protected unregisterCommand(commandId: string): void {
        const fullCommandId = `${this.plugin.manifest.id}:${this.moduleId}.${commandId}`;
        // @ts-ignore - Obsidian internal API
        this.app.commands?.removeCommand?.(fullCommandId);
    }

    protected unregisterAllCommands(): void {
        this.registeredCommands.forEach(commandId => {
            this.unregisterCommand(commandId);
        });
        this.registeredCommands = [];
    }

    // 为菜单项添加提供便捷方法
    protected addMenuItem(
        menu: Menu,
        items: MenuItemConfig | MenuItemConfig[],
        options: {
            showSeparator?: boolean;
        } = {}
    ): void {
        if (!this.isEnabled()) return;

        const { showSeparator = false } = options;
        const menuItems = Array.isArray(items) ? items : [items];
        const sortedItems = menuItems.sort((a, b) => (a.order || 0) - (b.order || 0));

        // 获取目标菜单（可能是父菜单或工具包子菜单）
        const targetMenu = (this.plugin as RavenHogwartsToolkitPlugin)
            .pluginManager.getToolkitMenu(menu);

        // 直接添加菜单项到工具包菜单
        sortedItems.forEach((item) => {
            targetMenu.addItem((menuItem) => {
                menuItem.setTitle(`${this.moduleId}: ${item.title}`);
                if (item.icon) menuItem.setIcon(item.icon);
                if (item.callback) menuItem.onClick(item.callback);
            });
        });

        // 添加分隔符
        if (showSeparator) {
            targetMenu.addSeparator();
        }
    }

    public getConfig(): T['config'] {
        return this.config;
    }

    public getData(): T['data'] {
        return this.data;
    }

    public isEnabled(): boolean {
        return this.config.enabled;
    }

    public async enable(): Promise<void> {
        if (!this.isEnabled()) {
            await this.updateConfig({ enabled: true } as Partial<T['config']>);
            this.onEnable();
        }
    }

    public async disable(): Promise<void> {
        if (this.isEnabled()) {
            await this.updateConfig({ enabled: false } as Partial<T['config']>);
            this.onDisable();
        }
    }

    protected onEnable(): void {
        this.logger.info('Module enabled:', this.moduleId);
    }

    protected onDisable(): void {
        this.cleanupModule();
        this.logger.info('Module disabled:', this.moduleId);
    }

    protected cleanupModule(): void {
        // 1. 卸载所有命令
        this.unregisterAllCommands();
        
        // 2. 卸载所有事件
        this.unregisterEvents();
        
        // 3. 记录日志
        this.logger.debug(`Cleaned up module: ${this.moduleId}`);
    }

    // 添加 protected onConfigChange 方法声明
    protected onConfigChange?(): void;

    public getApp(): App {
        return this.app;
    }

    public getPlugin(): RavenHogwartsToolkitPlugin {
        return this.plugin;
    }
}