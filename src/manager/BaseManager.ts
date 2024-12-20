import { IRavenHogwartsToolkitConfig, IToolkitModule } from './types';
import RavenHogwartsToolkitPlugin from '../main';
import { Logger } from '../util/log';
import { App, Command, Component, Menu } from 'obsidian';
import { getStandardTime } from '../util/date';
import { t, TranslationKeys } from '../i18n/i18n';
import { QUICK_PATH_DEFAULT_CONFIG } from '../toolkit/quickPath/types/config';
import { TABLE_ENHANCEMENTS_DEFAULT_CONFIG } from '../toolkit/tableEnhancements/types/config';
import { FRONTMATTER_SORTER_DEFAULT_CONFIG } from '../toolkit/frontmatterSorter/types/config';

export abstract class BaseManager<T extends IToolkitModule> extends Component {
    // private initialized = false;
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
            
            // 保存默认设置到 data.json
            await this.plugin.saveData(this.settings);
            this.logger.debug('Initialized default settings for module:', this.moduleId);
        }
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
            this.config = { ...this.config, ...newConfig };
            this.data.lastModified = getStandardTime();
            await this.saveSettings();
        } catch (error) {
            this.logger.error('Error updating config for module:', this.moduleId, error);
            throw error;
        }
    }

    public async setConfig(newConfig: T['config']): Promise<void> {
        try {
            this.config = newConfig;
            this.data.lastModified = getStandardTime();
            await this.saveSettings();
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
        {
            title,
            icon,
            callback,
            showSeparator = false
        }: {
            title: string;
            icon?: string;
            callback: () => any;
            showSeparator?: boolean;
        }
    ) {
        if (showSeparator) {
            menu.addSeparator();
        }
         menu.addItem((item) => {
            item.setTitle(title);
            if (icon) {
                item.setIcon(icon);
            }
            item.onClick(callback);
        });
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
}