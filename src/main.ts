import { Plugin } from 'obsidian';
import { IRavenHogwartsToolkitConfig } from './manager/types';
import { PluginManager } from './manager/PluginManager';
import '../style/styles.css';
import '../style/table-enhancements.css';
import { TableEnhancementsManager } from './toolkit/table-enhancements/manager/TableEnhancementsManager';
import { rootLogger } from './util/log';
import { t } from './i18n/i18n';


export default class RavenHogwartsToolkitPlugin extends Plugin {
	public pluginManager: PluginManager;

	async onload() {
		try {
            // 初始化插件管理器
            this.pluginManager = new PluginManager(this);
            await this.pluginManager.initialize();

            // 注册工具模块
            this.registerToolkit();
        }
        catch (e) {
            rootLogger.error('Plugin load error', e);
            rootLogger.notice('Plugin load error: ' + e.message);
        }
	}

	async onunload() {
        this.pluginManager.unload();
    }

	private registerToolkit() {
        // 注册表格增强工具
        this.pluginManager.registerManager('tableEnhancements', TableEnhancementsManager);
        
        // 注册表格增强的上下文菜单
        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu, editor) => {
                const tableManager = this.pluginManager.getManager<TableEnhancementsManager>('tableEnhancements');
                if (tableManager && tableManager.isEnabled()) {
                    menu.addItem((item) => {
                        item
                            .setTitle(t('toolkit.tableEnhancements.context_menu'))
                            .setIcon("tablets")
                            .onClick(() => {
                                tableManager.onload();
                            });
                    });
                }
            })
        );
    }

    async updateSettings(newSettings: Partial<IRavenHogwartsToolkitConfig>) {
        await this.pluginManager.updateSettings(newSettings);
    }
}