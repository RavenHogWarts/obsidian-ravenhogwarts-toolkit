import { IRavenHogwartsToolkitConfig, IToolkitModule, TOOLKIT_CONFIG } from './types';
import RavenHogwartsToolkitPlugin from '../main';
import { Logger } from '../util/log';
import { App, Command, Component, Menu, MenuItem } from 'obsidian';
import { getStandardTime } from '../util/date';
import { t, TranslationKeys } from '../i18n/i18n';
import { QUICK_PATH_DEFAULT_CONFIG } from '../toolkit/quickPath/types/config';
import { TABLE_ENHANCEMENTS_DEFAULT_CONFIG } from '../toolkit/tableEnhancements/types/config';
import { FRONTMATTER_SORTER_DEFAULT_CONFIG } from '../toolkit/frontmatterSorter/types/config';
import { ToolkitId } from './hooks/useToolkitSettings';

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
            // 初始化模块设置
            this.settings.toolkit[this.moduleId] = {
                config: this.getDefaultConfig(),
                data: {
                    lastModified: getStandardTime()
                }
            };
        } else {
            // 只合并 config，保持 data 不变
            const defaultConfig = this.getDefaultConfig();
            this.settings.toolkit[this.moduleId] = {
                ...this.settings.toolkit[this.moduleId],  // 保留现有的所有数据
                config: {                                 // 只更新 config
                    ...defaultConfig,
                    ...this.settings.toolkit[this.moduleId].config
                }
            };
        }
        
        // 保存设置到 data.json
        await this.plugin.saveData(this.settings);
        this.logger.debug('Module settings initialized:', this.moduleId);
        
        this.config = this.settings.toolkit[this.moduleId].config;
        this.data = this.settings.toolkit[this.moduleId].data;
    }

    protected getDefaultConfig(): T['config'] {
        switch (this.moduleId) {
            case 'quickPath':
                return QUICK_PATH_DEFAULT_CONFIG;
            case 'tableEnhancements':
                return TABLE_ENHANCEMENTS_DEFAULT_CONFIG;
            case 'frontmatterSorter':
                return FRONTMATTER_SORTER_DEFAULT_CONFIG;
            default:
                this.logger.error(`Unknown module ID: ${this.moduleId}`);
                throw new Error(`Unknown module ID: ${this.moduleId}`);
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
            this.logger.error('Error saving settings for module:', this.moduleId, error);
            throw error;
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
            this.logger.error('Error updating config for module:', this.moduleId, error);
            throw error;
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
            this.logger.error('Error setting config for module:', this.moduleId, error);
            throw error;
        }
    }

    protected async updateData(newData: Partial<T['data']>): Promise<void> {
        try {
            this.logger.debug('Updating data for module:', this.moduleId, newData);
            this.data = { ...this.data, ...newData };
            this.data.lastModified = getStandardTime();
            await this.saveSettings();
        } catch (error) {
            this.logger.error('Error updating data for module:', this.moduleId, error);
            throw error;
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
    }

    // 为菜单项添加提供便捷方法
    protected addMenuItem(
        menu: Menu,
        items: MenuItemConfig | MenuItemConfig[],
        options: {
            showSeparator?: boolean;     // 是否显示分隔符
            useSubmenu?: boolean;        // 是否使用子菜单
        } = {}
    ): void {
        if (!this.isEnabled()) return;

        const { showSeparator = false, useSubmenu = false } = options;

        const menuItems = Array.isArray(items) ? items : [items];
        const sortedItems = menuItems.sort((a, b) => {
            return (a.order || 0) - (b.order || 0);
        });

        if (useSubmenu) {
            // 创建带子菜单的项目
            menu.addItem((menuItem) => {
                menuItem
                    .setTitle(this.moduleId)
                    .setIcon(TOOLKIT_CONFIG[this.moduleId as ToolkitId].iconName);

                // 创建子菜单
                // @ts-ignore
                const submenu = menuItem.setSubmenu();
                
                // 添加子菜单项
                sortedItems.forEach((item) => {
                    submenu.addItem((subMenuItem) => {
                        subMenuItem.setTitle(item.title);
                        if (item.icon) subMenuItem.setIcon(item.icon);
                        if (item.callback) subMenuItem.onClick(item.callback);
                    });
                });
            });
        } else {
            // 直接添加菜单项
            sortedItems.forEach((item) => {
                menu.addItem((menuItem) => {
                    menuItem.setTitle(item.title);
                    if (item.icon) menuItem.setIcon(item.icon);
                    if (item.callback) menuItem.onClick(item.callback);
                });
            });
        }

        // 添加开始分隔符
        if (showSeparator) {
            menu.addSeparator();
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
        this.logger.debug('Module enabled:', this.moduleId);
    }

    protected onDisable(): void {
        this.logger.debug('Module disabled:', this.moduleId);
    }

    // 添加 protected onConfigChange 方法声明
    protected onConfigChange?(): void;
}