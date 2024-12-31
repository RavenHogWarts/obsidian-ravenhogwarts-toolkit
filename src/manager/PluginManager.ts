import { Menu, Plugin } from 'obsidian';
import { DEFAULT_CONFIG, IRavenHogwartsToolkitConfig } from './types';
import { BaseManager } from './BaseManager';
import { Logger, rootLogger } from '../util/log';

export class PluginManager {
    private managers: Map<string, BaseManager<any>> = new Map();
    private settings: IRavenHogwartsToolkitConfig;
    private toolkitMenu: Menu | null = null;

    constructor(private plugin: Plugin) {
        // 初始化默认设置
        this.settings = { ...DEFAULT_CONFIG };
    }

    async initialize() {
        // 加载设置
        await this.loadSettings();
        rootLogger.debug('Plugin manager initialized with settings:', this.settings);
    }

    async loadSettings() {
        try {
            const loadedData = await this.plugin.loadData();
            if (loadedData) {
                // 递归合并设置，保持现有数据
                this.settings = {
                    config: {
                        version: loadedData.config?.version || DEFAULT_CONFIG.config.version,
                        logger: {
                            ...DEFAULT_CONFIG.config.logger,
                            ...(loadedData.config?.logger || {})
                        },
                        developer: {
                            ...DEFAULT_CONFIG.config.developer,
                            ...(loadedData.config?.developer || {})
                        }
                    },
                    toolkit: {
                        ...DEFAULT_CONFIG.toolkit,
                        ...(loadedData.toolkit || {})
                    }
                };

                // 初始化 logger 配置
                if (this.settings.config?.logger) {
                    Logger.initRootLogger(this.settings.config.logger);
                }
            } else {
                // 如果没有加载到数据，使用默认设置并保存
                this.settings = { ...DEFAULT_CONFIG };
                await this.saveSettings();
            }
        } catch (error) {
            rootLogger.error('Error loading settings:', error);
            this.settings = { ...DEFAULT_CONFIG };
            await this.saveSettings();
        }
    }

    async saveSettings() {
        try {
            await this.plugin.saveData(this.settings);
            rootLogger.debug('Settings saved:', this.settings);
        } catch (error) {
            rootLogger.error('Error saving settings:', error);
        }
    }

    registerManagers(managers: {[moduleId: string]: new (...args: any[]) => BaseManager<any>}) {
        Object.entries(managers).forEach(([moduleId, managerClass]) => {
            if (this.managers.has(moduleId)) {
                rootLogger.warn(`Manager already registered for module: ${moduleId}`);
                return;
            }

            const manager = new managerClass(this.plugin, moduleId, this.settings);
            this.managers.set(moduleId, manager);
            manager.onload().catch(error => {
                rootLogger.error(`Failed to load manager: ${moduleId}`, error);
            });
        });
        rootLogger.info(`Registered manager: ${Object.keys(managers)}`);
    }

    getManager<T extends BaseManager<any>>(moduleId: string): T | undefined {
        return this.managers.get(moduleId) as T;
    }

    getToolkitMenu(parentMenu: Menu): Menu {
        this.toolkitMenu = null;
        
        // 检查是否已经存在菜单项
        const existingItem = (parentMenu as any).items?.find((item: any) => 
            item.titleEl?.textContent === 'RavenHogwartsToolkit'
        );

        if (existingItem) {
            this.toolkitMenu = existingItem.submenu;
        } else {
            parentMenu.addItem((menuItem) => {
                menuItem.setTitle('RavenHogwartsToolkit');
                menuItem.setIcon('gavel');
                // @ts-ignore
                this.toolkitMenu = menuItem.setSubmenu();
            });
        }
        
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.toolkitMenu!;
    }

    async updateSettings(newSettings: Partial<IRavenHogwartsToolkitConfig>) {
        rootLogger.debug('Updating settings', newSettings);
        this.settings = {
            ...this.settings,
            ...newSettings
        };

        // 更新 logger 配置
        if (newSettings.config?.logger) {
            Logger.initRootLogger(newSettings.config.logger);
        }
        
        await this.saveSettings();
    }

    unload() {
        this.toolkitMenu = null;
        this.managers.forEach((manager, moduleId) => {
            try {
                manager.onunload?.();
                rootLogger.debug(`Unloaded manager: ${moduleId}`);
            } catch (error) {
                rootLogger.error(`Error unloading manager: ${moduleId}`, error);
            }
        });
        this.managers.clear();
    }

    get pluginSettings(): IRavenHogwartsToolkitConfig {
        return this.settings;
    }
}