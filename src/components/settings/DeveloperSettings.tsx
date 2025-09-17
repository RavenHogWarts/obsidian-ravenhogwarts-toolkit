import { Toggle } from "@/src/components/base/Button/Toggle";
import { SettingItem } from "@/src/components/base/Setting/SettingItem";
import { Logger, LogLevel } from "@/src/core/services/Log";
import { t } from "@/src/i18n/i18n";
import RavenHogwartsToolkitPlugin from "@/src/main";
import * as React from "react";
import { Input } from "../base/Input/Input";
import { Select } from "../base/Select/Select";
import { OverviewSettingItem } from "../base/Setting/OverviewSettingItem";

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

	// 监听插件设置变化
	React.useEffect(() => {
		setLoggerConfig(plugin.settings.config.logger);
	}, [plugin.settings.config.logger]);

	const handleConfigUpdate = async (path: string, value: any) => {
		try {
			const newConfig = { ...plugin.settings.config };
			path.split(".").reduce(
				(obj: any, key: string, index: number, arr: string[]) => {
					if (index === arr.length - 1) {
						obj[key] = value;
					} else {
						obj[key] = { ...obj[key] };
					}
					return obj[key];
				},
				newConfig
			);
			setLoggerConfig(newConfig.logger);
			await plugin.updateSettings({ config: newConfig });
			logger.debug(`Updated config ${path}:`, value);
		} catch (error) {
			logger.error(`Failed to update config ${path}:`, error);
		}
	};

	const levelOptions = Object.entries(LogLevel)
		.filter(([key, value]) => typeof value === "number")
		.map(([key, value]) => ({
			value: value,
			label: key,
		}));

	return (
		<OverviewSettingItem
			name={t("common.developer.title")}
			desc={t("common.developer.description")}
			collapsible
			defaultCollapsed={true}
		>
			<SettingItem name={t("common.developer.logger.level")}>
				<Select
					options={levelOptions}
					value={loggerConfig.level}
					onValueChange={(value) =>
						handleConfigUpdate(
							"logger.level",
							Number(value) as LogLevel
						)
					}
				></Select>
			</SettingItem>
			<SettingItem name={t("common.developer.logger.showTimestamp")}>
				<Toggle
					checked={loggerConfig.showTimestamp}
					onChange={(checked: boolean) =>
						handleConfigUpdate("logger.showTimestamp", checked)
					}
				/>
			</SettingItem>
			<SettingItem name={t("common.developer.logger.showLevel")}>
				<Toggle
					checked={loggerConfig.showLevel}
					onChange={(checked: boolean) =>
						handleConfigUpdate("logger.showLevel", checked)
					}
				/>
			</SettingItem>
			<SettingItem name={t("common.developer.logger.console")}>
				<Toggle
					checked={loggerConfig.console}
					onChange={(checked: boolean) =>
						handleConfigUpdate("logger.console", checked)
					}
				/>
			</SettingItem>
			<SettingItem name={t("common.developer.logger.showNotifications")}>
				<Toggle
					checked={loggerConfig.showNotifications}
					onChange={(checked: boolean) =>
						handleConfigUpdate("logger.showNotifications", checked)
					}
				/>
			</SettingItem>
			<SettingItem name={t("common.developer.logger.noticeTimeout")}>
				<Input
					type="number"
					value={loggerConfig.noticeTimeout}
					onChange={(value) =>
						handleConfigUpdate(
							"logger.noticeTimeout",
							Number(value)
						)
					}
				/>
			</SettingItem>
		</OverviewSettingItem>
	);
};
