import * as React from "react";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { Logger, LogLevel } from "@/src/core/services/Log";
import { t } from "@/src/i18n/i18n";
import { SettingItem } from "@/src/components/base/Setting/SettingItem";
import { Toggle } from "@/src/components/base/Button/Toggle";
import "./styles/DeveloperSettings.css";

interface DeveloperSettingsProps {
	plugin: RavenHogwartsToolkitPlugin;
	logger: Logger;
}

export const DeveloperSettings: React.FC<DeveloperSettingsProps> = ({
	plugin,
	logger,
}) => {
	const [loggerConfig, setLoggerConfig] = React.useState(
		plugin.settings.config.logger
	);
	const [menuConfig, setMenuConfig] = React.useState(
		plugin.settings.config.menu
	);

	// 监听插件设置变化
	React.useEffect(() => {
		setLoggerConfig(plugin.settings.config.logger);
		setMenuConfig(plugin.settings.config.menu);
	}, [plugin.settings.config.logger, plugin.settings.config.menu]);

	const handleSettingChange = async (
		section: "logger" | "menu",
		key: string,
		value: any
	) => {
		try {
			if (section === "logger") {
				const newLoggerConfig = {
					...loggerConfig,
					[key]: value,
				};
				setLoggerConfig(newLoggerConfig);
				await plugin.updateSettings({
					config: {
						...plugin.settings.config,
						logger: newLoggerConfig,
					},
				});
				Logger.initRootLogger(newLoggerConfig);
			} else if (section === "menu") {
				const newMenuConfig = {
					...menuConfig,
					[key]: value,
				};
				setMenuConfig(newMenuConfig);
				await plugin.updateSettings({
					config: {
						...plugin.settings.config,
						menu: newMenuConfig,
					},
				});
			}
		} catch (error) {
			logger.error("Failed to update settings:", error);
		}
	};

	return (
		<div className="rht-toolkit-developer">
			<div className="rht-toolkit-developer-settings-header">
				<h2>{t("common.developer.title")}</h2>
				<p>{t("common.developer.description")}</p>
			</div>
			<div className="rht-toolkit-developer-settings-content">
				<div className="rht-toolkit-developer-settings">
					<SettingItem name={t("common.developer.menu.useSubMenu")}>
						<Toggle
							checked={menuConfig.useSubMenu}
							onChange={(checked: boolean) =>
								handleSettingChange(
									"menu",
									"useSubMenu",
									checked
								)
							}
						/>
					</SettingItem>
					<SettingItem name={t("common.developer.logger.level")}>
						<select
							value={loggerConfig.level}
							onChange={(e) =>
								handleSettingChange(
									"logger",
									"level",
									Number(e.target.value) as LogLevel
								)
							}
						>
							{Object.entries(LogLevel)
								.filter(
									([key, value]) => typeof value === "number"
								)
								.map(([key, value]) => (
									<option key={value} value={value}>
										{key}
									</option>
								))}
						</select>
					</SettingItem>
					<SettingItem
						name={t("common.developer.logger.showTimestamp")}
					>
						<Toggle
							checked={loggerConfig.showTimestamp}
							onChange={(checked: boolean) =>
								handleSettingChange(
									"logger",
									"showTimestamp",
									checked
								)
							}
						/>
					</SettingItem>
					<SettingItem name={t("common.developer.logger.showLevel")}>
						<Toggle
							checked={loggerConfig.showLevel}
							onChange={(checked: boolean) =>
								handleSettingChange(
									"logger",
									"showLevel",
									checked
								)
							}
						/>
					</SettingItem>
					<SettingItem name={t("common.developer.logger.console")}>
						<Toggle
							checked={loggerConfig.console}
							onChange={(checked: boolean) =>
								handleSettingChange(
									"logger",
									"console",
									checked
								)
							}
						/>
					</SettingItem>
					<SettingItem
						name={t("common.developer.logger.showNotifications")}
					>
						<Toggle
							checked={loggerConfig.showNotifications}
							onChange={(checked: boolean) =>
								handleSettingChange(
									"logger",
									"showNotifications",
									checked
								)
							}
						/>
					</SettingItem>
					<SettingItem
						name={t("common.developer.logger.noticeTimeout")}
					>
						<input
							type="number"
							value={loggerConfig.noticeTimeout}
							onChange={(e) =>
								handleSettingChange(
									"logger",
									"noticeTimeout",
									Number(e.target.value)
								)
							}
						/>
					</SettingItem>
				</div>
			</div>
		</div>
	);
};
