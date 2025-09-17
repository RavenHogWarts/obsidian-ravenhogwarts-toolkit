import { Toggle } from "@/src/components/base/Button/Toggle";
import { Card } from "@/src/components/base/Card/Card";
import { useDeveloperMode } from "@/src/core/hooks/useDeveloperMode";
import { useToolkitSettings } from "@/src/core/hooks/useToolkitSettings";
import {
	IRavenHogwartsToolkitConfig,
	ToolkitId,
} from "@/src/core/interfaces/types";
import { Logger } from "@/src/core/services/Log";
import { t } from "@/src/i18n/i18n";
import { TranslationKeys } from "@/src/i18n/types";
import RavenHogwartsToolkitPlugin from "@/src/main";
import parse from "html-react-parser";
import { Settings } from "lucide-react";
import * as React from "react";
import { OverviewSettingItem } from "../base/Setting/OverviewSettingItem";
import { SettingItem } from "../base/Setting/SettingItem";
import { DeveloperSettings } from "./DeveloperSettings";
import "./styles/ToolkitOverview.css";

interface ToolkitOverviewProps {
	plugin: RavenHogwartsToolkitPlugin;
	logger: Logger;
	config: IRavenHogwartsToolkitConfig["config"];
	onNavigateToDetail: (moduleId: string) => void;
	onVersionClick: () => void;
}

export const ToolkitOverview: React.FC<ToolkitOverviewProps> = ({
	plugin,
	logger,
	config,
	onNavigateToDetail,
	onVersionClick,
}) => {
	const { toolkits, updateToolkit } = useToolkitSettings({
		plugin,
		onNavigateToDetail,
	});
	const { showHint, handleVersionClick } = useDeveloperMode({
		plugin,
		onActivated: onVersionClick,
	});
	const [menuConfig, setMenuConfig] = React.useState(config.menu);

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

			await plugin.updateSettings({ config: newConfig });
			logger.debug(`Updated config ${path}:`, value);
		} catch (error) {
			logger.error(`Failed to update config ${path}:`, error);
		}
	};

	// 处理工具包启用/禁用
	const handleToolkitToggle = async (
		toolkitId: ToolkitId,
		enabled: boolean
	) => {
		try {
			const manager = plugin.getManager(toolkitId);
			if (!manager) {
				throw new Error(`Manager not found for toolkit: ${toolkitId}`);
			}

			if (enabled) {
				await manager.enable();
			} else {
				await manager.disable();
			}

			// 更新设置
			await updateToolkit(toolkitId, enabled);
		} catch (error) {
			logger.error(
				`Failed to ${
					enabled ? "enable" : "disable"
				} toolkit ${toolkitId}:`,
				error
			);
		}
	};

	return (
		<div className="rht-toolkit-overview">
			<div className="rht-toolkit-header">
				<div className="rht-toolkit-header-left">
					<h2>{t("common.overview.title")}</h2>
					<p>{parse(t("common.overview.description"))}</p>
				</div>
				<div className="rht-toolkit-header-right">
					<span
						className="rht-version-text"
						onClick={handleVersionClick}
					>
						Version: {plugin.manifest.version}
					</span>

					{showHint && (
						<small className="rht-version-hint">
							{t("common.overview.version_hint")}
						</small>
					)}
				</div>
			</div>
			<OverviewSettingItem
				name={t("common.general.title")}
				collapsible
				defaultCollapsed={true}
			>
				<SettingItem name={t("common.general.menu.useSubMenu")}>
					<Toggle
						checked={menuConfig.useSubMenu}
						onChange={async (checked: boolean) => {
							await handleConfigUpdate(
								"menu.useSubMenu",
								checked
							);
							setMenuConfig((prev) => ({
								...prev,
								useSubMenu: checked,
							}));
						}}
					/>
				</SettingItem>
			</OverviewSettingItem>
			<OverviewSettingItem
				name={t("common.toolkit.title")}
				desc={t("common.toolkit.description")}
				collapsible
				defaultCollapsed={false}
			>
				<div className="rht-toolkit-grid">
					{toolkits.map((toolkit) => (
						<Card
							key={toolkit.id}
							className={toolkit.id}
							title={t(
								`toolkit.${toolkit.id}.title` as TranslationKeys
							)}
							icon={toolkit.icon}
							description={t(
								`toolkit.${toolkit.id}.description` as TranslationKeys
							)}
							actions={
								<>
									<Toggle
										checked={toolkit.enabled}
										onChange={(checked) =>
											handleToolkitToggle(
												toolkit.id,
												checked
											)
										}
										aria-label={t("common.toggle_toolkit")}
									/>
									<span
										className="rht-toolkit-settings-btn"
										onClick={() =>
											onNavigateToDetail(toolkit.id)
										}
										aria-label={t("common.settings")}
									>
										<Settings size={16} />
									</span>
								</>
							}
						/>
					))}
				</div>
			</OverviewSettingItem>
			{plugin.settings.config.developer?.enabled && (
				<DeveloperSettings plugin={plugin} logger={logger} />
			)}
		</div>
	);
};
