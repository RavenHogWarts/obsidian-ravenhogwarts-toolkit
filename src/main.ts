import { Plugin } from 'obsidian';
import { IRavenHogwartsToolkitConfig } from './manager/types';
import { PluginManager } from './manager/PluginManager';
import { TableEnhancementsManager } from './toolkit/tableEnhancements/manager/TableEnhancementsManager';
import { rootLogger } from './util/log';
import { FrontMatterSorterManager } from './toolkit/frontmatterSorter/manager/FrontMatterSorterManager';
import { QuickPathManager } from './toolkit/quickPath/manager/QuickPathManager';
import { BaseManager } from './manager/BaseManager';
import RavenHogwartsToolkitSettingTab from './ui/settings/SettingsTab';
import '../style/styles.css';
import '../style/settings.css';
import '../style/tableEnhancements.css';

export default class RavenHogwartsToolkitPlugin extends Plugin {
	public pluginManager: PluginManager;
	registeredMenus: Record<string, Set<string>> = {};

	async onload() {
		try {
            // 初始化插件管理器
            this.pluginManager = new PluginManager(this);
            await this.pluginManager.initialize();

            // 注册工具模块
            await this.registerToolkit();

            // 注册设置页面
            this.addSettingTab(new RavenHogwartsToolkitSettingTab(this.app, this));
        }
        catch (e) {
            rootLogger.error('Plugin load error', e);
            rootLogger.notice('Plugin load error: ' + e.message);
        }
	}

	async onunload() {
        try {
            await this.pluginManager?.unload();
            rootLogger.info('Plugin unloaded successfully');
        } catch (error) {
            rootLogger.error('Plugin unload error:', error);
        }
    }

	private async registerToolkit() {
        const managers = {
            'tableEnhancements': TableEnhancementsManager,
            'frontmatterSorter': FrontMatterSorterManager,
            'quickPath': QuickPathManager,
        };
        await this.pluginManager.registerManagers(managers);
    }

    async updateSettings(newSettings: Partial<IRavenHogwartsToolkitConfig>) {
        await this.pluginManager.updateSettings(newSettings);
    }

    getManager<T extends BaseManager<any>>(moduleId: string): T | undefined {
        return this.pluginManager.getManager<T>(moduleId);     
    }

    get settings(): IRavenHogwartsToolkitConfig {
        return this.pluginManager.pluginSettings;
    }
}