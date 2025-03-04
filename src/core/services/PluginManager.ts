import { Menu } from "obsidian";
import {
	DEFAULT_CONFIG,
	IRavenHogwartsToolkitConfig,
} from "../interfaces/types";
import { BaseManager } from "./BaseManager";
import { Logger, rootLogger } from "@/src/core/services/Log";
import { UpdateManager } from "./UpdateManager";
import RavenHogwartsToolkitPlugin from "@/src/main";

export class PluginManager {
	private managers: Map<string, BaseManager<any>> = new Map();
	private settings: IRavenHogwartsToolkitConfig;
	private toolkitMenu: Menu | null = null;
	private menuRegistrations: Map<string, Set<string>> = new Map();
	private plugin: RavenHogwartsToolkitPlugin;
	private updateManager: UpdateManager;

	constructor(plugin: RavenHogwartsToolkitPlugin) {
		this.plugin = plugin;
		this.settings = { ...DEFAULT_CONFIG };
		this.updateManager = new UpdateManager(plugin);
	}

	async initialize() {
		await this.loadSettings();
		rootLogger.debug(
			"Plugin manager initialized with settings:",
			this.settings
		);
		if (this.settings.config.updater.autoUpdate) {
			this.checkForUpdates();
		}
	}

	async loadSettings() {
		try {
			const loadedData = await this.plugin.loadData();
			if (loadedData) {
				this.settings = this.mergeSettings(loadedData);
				if (this.settings.config?.logger) {
					Logger.initRootLogger(this.settings.config.logger);
				}
			} else {
				this.settings = { ...DEFAULT_CONFIG };
				await this.saveSettings();
			}
		} catch (error) {
			rootLogger.error("Error loading settings:", error);
			this.settings = { ...DEFAULT_CONFIG };
			await this.saveSettings();
		}
	}

	private mergeSettings(loadedData: any): IRavenHogwartsToolkitConfig {
		return {
			config: {
				version:
					loadedData.config?.version || DEFAULT_CONFIG.config.version,
				logger: {
					...DEFAULT_CONFIG.config.logger,
					...(loadedData.config?.logger || {}),
				},
				developer: {
					...DEFAULT_CONFIG.config.developer,
					...(loadedData.config?.developer || {}),
				},
				menu: {
					...DEFAULT_CONFIG.config.menu,
					...(loadedData.config?.menu || {}),
				},
				updater: {
					...DEFAULT_CONFIG.config.updater,
					...(loadedData.config?.updater || {}),
				},
			},
			toolkit: {
				...DEFAULT_CONFIG.toolkit,
				...(loadedData.toolkit || {}),
			},
		};
	}

	async saveSettings() {
		try {
			await this.plugin.saveData(this.settings);
			rootLogger.debug("Settings saved:", this.settings);
		} catch (error) {
			rootLogger.error("Error saving settings:", error);
		}
	}

	public getSettings() {
		return this.settings;
	}

	registerManagers(managers: {
		[moduleId: string]: new (...args: any[]) => BaseManager<any>;
	}) {
		Object.entries(managers).forEach(([moduleId, managerClass]) => {
			if (this.managers.has(moduleId)) {
				rootLogger.warn(
					`Manager already registered for module: ${moduleId}`
				);
				return;
			}

			try {
				const manager = new managerClass(
					this.plugin,
					moduleId,
					this.settings
				);
				this.managers.set(moduleId, manager);
				manager.onload().catch((error) => {
					rootLogger.error(
						`Failed to load manager: ${moduleId}`,
						error
					);
				});
			} catch (error) {
				rootLogger.error(
					`Failed to create manager: ${moduleId}`,
					error
				);
			}
		});
		rootLogger.info(`Registered managers: ${Object.keys(managers)}`);
	}

	getManager<T extends BaseManager<any>>(moduleId: string): T | undefined {
		return this.managers.get(moduleId) as T;
	}

	getToolkitMenu(parentMenu: Menu, moduleId: string): Menu {
		const manager = this.managers.get(moduleId);
		if (!manager?.isEnabled()) {
			return parentMenu;
		}

		if (!this.settings.config.menu.useSubMenu) {
			return parentMenu;
		}

		const existingItem = (parentMenu as any).items?.find(
			(item: any) => item.titleEl?.textContent === "RavenHogwartsToolkit"
		);

		if (existingItem) {
			this.toolkitMenu = existingItem.submenu;
		} else {
			parentMenu.addItem((menuItem) => {
				menuItem.setTitle("RavenHogwartsToolkit");
				menuItem.setIcon("gavel");
				// @ts-ignore
				this.toolkitMenu = menuItem.setSubmenu();
			});
		}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this.toolkitMenu!;
	}

	clearMenuItems(moduleId?: string) {
		try {
			if (moduleId) {
				// 清除指定模块的菜单项
				this.menuRegistrations.delete(moduleId);
				if (this.toolkitMenu) {
					const items = (this.toolkitMenu as any).items || [];
					(this.toolkitMenu as any).items = items.filter(
						(item: any) => {
							const title = item.titleEl?.textContent || "";
							return !title.includes(moduleId);
						}
					);
				}
			} else {
				// 清除所有菜单项
				this.menuRegistrations.clear();
				if (this.toolkitMenu) {
					(this.toolkitMenu as any).items = [];
					this.toolkitMenu = null;
				}
			}
		} catch (error) {
			rootLogger.error("Error clearing menu items:", error);
		}
	}

	async updateSettings(newSettings: Partial<IRavenHogwartsToolkitConfig>) {
		rootLogger.debug("Updating settings", newSettings);
		this.settings = {
			...this.settings,
			...newSettings,
		};

		// 更新 logger 配置
		if (newSettings.config?.logger) {
			Logger.initRootLogger(newSettings.config.logger);
		}

		await this.saveSettings();
	}

	unload() {
		try {
			this.clearMenuItems();
			this.toolkitMenu = null;

			// 3. 卸载所有管理器
			this.managers.forEach((manager, moduleId) => {
				try {
					manager.onunload?.();
					rootLogger.debug(`Unloaded manager: ${moduleId}`);
				} catch (error) {
					rootLogger.error(
						`Error unloading manager: ${moduleId}`,
						error
					);
				}
			});

			// 4. 清理集合
			this.managers.clear();
			this.menuRegistrations.clear();
		} catch (error) {
			rootLogger.error("Error during plugin unload:", error);
		}
	}

	get pluginSettings(): IRavenHogwartsToolkitConfig {
		return this.settings;
	}

	async checkForUpdates(): Promise<boolean> {
		rootLogger.debug("Manual update check triggered");
		rootLogger.debug("Current settings:", {
			checkBeta: this.settings.config.updater.checkBeta,
			autoUpdate: this.settings.config.updater.autoUpdate,
			updateCheckInterval:
				this.settings.config.updater.updateCheckInterval,
		});

		return await this.updateManager.checkForUpdates();
	}
}
