import { IRavenHogwartsToolkitConfig, IToolkitModule } from './types';
import RavenHogwartsToolkitPlugin from '../main';
import { Logger } from '../util/log';
import { App } from 'obsidian';
import { getStandardTime } from '../util/date';

export abstract class BaseManager<T extends IToolkitModule> {
    protected config: T['config'];
    protected data: T['data'];
    protected logger: Logger;
    protected app: App;
    
    constructor(
        protected plugin: RavenHogwartsToolkitPlugin,
        protected moduleId: string,
        protected settings: IRavenHogwartsToolkitConfig,
    ) {
        this.initializeModule();
        this.app = this.plugin.app;
        // 使用模块级别的 logger
        this.logger = Logger.getLogger(this.moduleId);
    }

    private initializeModule() {
        if (!this.settings.toolkit[this.moduleId]) {
            this.settings.toolkit[this.moduleId] = {
                config: {
                    enabled: true
                },
                data: {
                    lastModified: getStandardTime()
                }
            } as T;
        }
        this.config = this.settings.toolkit[this.moduleId].config;
        this.data = this.settings.toolkit[this.moduleId].data;
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
            await this.updateConfig({ enabled: true });
            this.onEnable();
        }
    }

    public async disable(): Promise<void> {
        if (this.isEnabled()) {
            await this.updateConfig({ enabled: false });
            this.onDisable();
        }
    }

    abstract onload(): Promise<void>;
    abstract onunload(): void;

    protected onEnable(): void {
        this.logger.debug('Module enabled:', this.moduleId);
    }

    protected onDisable(): void {
        this.logger.debug('Module disabled:', this.moduleId);
    }
}