import { App, Command, Component, Menu } from 'obsidian';
import { IRavenHogwartsToolkitConfig, IToolkitModule } from '../interfaces/types';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { Logger } from '@/src/core/services/Log';
import { getStandardTime } from '@/src/lib/date';
import { t, TranslationKeys } from '@/src/i18n/i18n';
import { rootLogger } from './Log';

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
    protected eventRefs: any[] = [];
    
    constructor(
        protected plugin: RavenHogwartsToolkitPlugin,
        protected moduleId: string,
        protected settings: IRavenHogwartsToolkitConfig,
    ) {
        super();
        this.app = this.plugin.app;
        this.logger = Logger.getLogger(this.moduleId);
        this.initPromise = this.initializeModule();
    }

    private async initializeModule() {
        if (!this.settings.toolkit[this.moduleId]) {
            this.settings.toolkit[this.moduleId] = {
                config: this.getDefaultConfig(),
                data: {
                    lastModified: getStandardTime()
                }
            };
        } else {
            const defaultConfig = this.getDefaultConfig();
            const currentConfig = this.settings.toolkit[this.moduleId].config;
            const currentData = this.settings.toolkit[this.moduleId].data;
            
            this.settings.toolkit[this.moduleId] = {
                config: this.cleanConfig(currentConfig, defaultConfig),
                data: currentData
            };
        }
        
        await this.plugin.saveData(this.settings);
        this.logger.debug('Module settings initialized:', this.moduleId);
        
        this.config = this.settings.toolkit[this.moduleId].config;
        this.data = this.settings.toolkit[this.moduleId].data;
    }

    protected abstract getDefaultConfig(): T['config'];

    private cleanConfig(currentConfig: any, defaultConfig: any): any {
        if (typeof defaultConfig !== 'object' || Array.isArray(defaultConfig) || defaultConfig === null) {
            return currentConfig ?? defaultConfig;
        }

        const cleanedConfig: any = {};
        for (const key in defaultConfig) {
            if (key in currentConfig) {
                cleanedConfig[key] = this.cleanConfig(currentConfig[key], defaultConfig[key]);
            } else {
                cleanedConfig[key] = defaultConfig[key];
            }
        }
        return cleanedConfig;
    }

    // 生命周期方法
    public async onload(): Promise<void> {
        await this.waitForInitialization();
        if (this.isEnabled()) {
            await this.onModuleLoad();
        }
    }

    public async onunload(): Promise<void> {
        this.cleanupModule();
        this.onModuleUnload();
    }

    protected abstract onModuleLoad(): Promise<void>;
    protected abstract onModuleUnload(): void;
    protected abstract onModuleCleanup(): void;

    // 事件注册
    public registerEvent(eventRef: any): void {
        if (this.isEnabled()) {
            super.registerEvent(eventRef);
            if (typeof eventRef === 'function') {
                this.eventRefs.push(eventRef);
            }
        }
    }

    protected unregisterEvents(): void {
        this.eventRefs
            .filter(ref => typeof ref === 'function')
            .forEach(ref => ref());
        this.eventRefs = [];
    }

    // 命令管理
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

    // 菜单管理
    protected addMenuItem(
        menu: Menu,
        items: MenuItemConfig | MenuItemConfig[],
        options: { showSeparator?: boolean } = {}
    ): void {
        if (!this.isPluginEnabled()) return;
        if (!this.isEnabled()) return;

        const pluginManager = (this.plugin as RavenHogwartsToolkitPlugin).pluginManager;
        const useSubMenu = pluginManager.getSettings().config.menu.useSubMenu;

        const existingToolkitMenu = (menu as any).items?.find((item: any) => 
            item.titleEl?.textContent === 'RavenHogwartsToolkit'
        );

        if (useSubMenu) {
            const mainItems = (menu as any).items || [];
            const moduleItemIndexes = mainItems
                .map((item: any, index: number) => item.titleEl?.textContent?.includes(this.moduleId) ? index : -1)
                .filter((index: number) => index !== -1)
                .reverse(); // 从后往前删除，避免索引变化

            moduleItemIndexes.forEach((index: number) => {
                mainItems.splice(index, 1);
            });

            if (existingToolkitMenu?.submenu) {
                const existingSubItems = (existingToolkitMenu.submenu as any).items?.filter((item: any) => 
                    item.titleEl?.textContent?.includes(this.moduleId)
                );
                if (existingSubItems?.length > 0) {
                    return;
                }
            }
        } else {
            const existingItems = (menu as any).items?.filter((item: any) => 
                item.titleEl?.textContent?.includes(this.moduleId)
            );
            if (existingItems?.length > 0) {
                return;
            }
        }

        const { showSeparator = false } = options;
        const menuItems = Array.isArray(items) ? items : [items];
        const sortedItems = menuItems.sort((a, b) => (a.order || 0) - (b.order || 0));

        const targetMenu = (this.plugin as RavenHogwartsToolkitPlugin)
            .pluginManager.getToolkitMenu(menu, this.moduleId);

        sortedItems.forEach((item) => {
            targetMenu.addItem((menuItem) => {
                menuItem.setTitle(`${this.moduleId}: ${item.title}`);
                if (item.icon) menuItem.setIcon(item.icon);
                if (item.callback) {
                    menuItem.onClick(item.callback);
                }
            });
        });

        if (showSeparator) {
            targetMenu.addSeparator();
        }
    }

    // 设置管理
    protected async waitForInitialization(): Promise<void> {
        await this.initPromise;
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
            const oldConfig = { ...this.config };
            this.config = { ...this.config, ...newConfig };
            this.data.lastModified = new Date().toISOString();
            await this.saveSettings();
            
            if (JSON.stringify(oldConfig) !== JSON.stringify(this.config)) {
                this.onConfigChange?.();
            }
        } catch (error) {
            this.logger.throwError(new Error(`Error updating config for module: ${this.moduleId}`), error);
        }
    }

    // 启用/禁用管理
    public isEnabled(): boolean {
        return this.config.enabled;
    }

    public async enable(): Promise<void> {
        if (!this.isEnabled()) {
            await this.updateConfig({ enabled: true } as Partial<T['config']>);
            await this.onModuleLoad();
            this.onEnable();
        }
    }

    public async disable(): Promise<void> {
        if (this.isEnabled()) {
            this.cleanupModule();
            await this.updateConfig({ enabled: false } as Partial<T['config']>);
            this.onDisable();
        }
    }

    protected onEnable(): void {
        this.logger.info('Module enabled:', this.moduleId);
    }

    protected onDisable(): void {
        this.logger.info('Module disabled:', this.moduleId);
    }

    // 清理方法
    protected cleanupModule(): void {
        this.unregisterAllCommands();
        this.unregisterEvents();
        (this.plugin as RavenHogwartsToolkitPlugin)
            .pluginManager.clearMenuItems(this.moduleId);
        this.onModuleCleanup?.();
        this.logger.debug(`Cleaned up module: ${this.moduleId}`);
    }

    // 工具方法
    protected t(key: TranslationKeys, params?: any): string {
        return t(key, params);
    }

    protected onConfigChange?(): void;

    /**
     * 获取模块数据
     */
    protected async getData(): Promise<T['data']> {
        await this.waitForInitialization();
        return this.data;
    }

    /**
     * 更新模块数据
     */
    protected async updateData(newData: Partial<T['data']>): Promise<void> {
        try {
            this.logger.debug('Updating data for module:', this.moduleId, newData);
            this.data = { ...this.data, ...newData };
            this.data.lastModified = new Date().toISOString();
            await this.saveSettings();
        } catch (error) {
            this.logger.throwError(new Error(`Error updating data for module: ${this.moduleId}`), error);
        }
    }

    /**
     * 获取当前配置
     */
    public getConfig(): T['config'] {
        return this.config;
    }

    /**
     * 更新配置
     */
    public async setConfig(newConfig: Partial<T['config']>): Promise<void> {
        await this.updateConfig(newConfig);
    }

    /**
     * 获取 App 实例
     */
    public getApp() {
        return this.app;
    }

    /**
     * 获取 Plugin 实例
     */
    public getPlugin() {
        return this.plugin;
    }

    protected registerEventHandlers(): void {
        // 子类实现具体事件注册
        if (!this.isEnabled()) return;
    }

    protected isPluginEnabled(): boolean {
        rootLogger.debug('isPluginEnabled', (this.plugin.app as any).plugins.enabledPlugins.has(this.plugin.manifest.id));
        return (this.plugin.app as any).plugins.enabledPlugins.has(this.plugin.manifest.id);
    }
}