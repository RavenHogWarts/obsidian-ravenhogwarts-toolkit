import { Plugin } from 'obsidian';
import { DEFAULT_CONFIG, IRavenHogwartsToolkitConfig } from './types';
import { BaseManager } from './BaseManager';
import { Logger, rootLogger } from '../util/log';

export class PluginManager {
    private managers: Map<string, BaseManager<any>> = new Map();
    private settings: IRavenHogwartsToolkitConfig;

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
                this.settings = {
                    ...DEFAULT_CONFIG,
                    ...loadedData
                };

                // 初始化 logger 配置
                if (this.settings.config?.logging) {
                    Logger.initRootLogger(this.settings.config.logging);
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

    async updateSettings(newSettings: Partial<IRavenHogwartsToolkitConfig>) {
        rootLogger.debug('Updating settings', newSettings);
        this.settings = {
            ...this.settings,
            ...newSettings
        };

        // 更新 logger 配置
        if (newSettings.config?.logging) {
            Logger.initRootLogger(newSettings.config.logging);
        }
        
        await this.saveSettings();
    }

    unload() {
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
}