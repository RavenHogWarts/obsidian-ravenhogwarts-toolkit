import * as React from "react";
import { Card } from "@/src/components/base/Card/Card";
import { Toggle } from "@/src/components/base/Button/Toggle";
import { useToolkitSettings } from "@/src/core/hooks/useToolkitSettings";
import { t } from "@/src/i18n/i18n";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { CircleArrowDown, Settings } from "lucide-react";
import { useDeveloperMode } from "@/src/core/hooks/useDeveloperMode";
import { Logger } from "@/src/core/services/Log";
import {
	IRavenHogwartsToolkitConfig,
	ToolkitId,
} from "@/src/core/interfaces/types";
import parse from "html-react-parser";
import { ContextMenu } from "@/src/components/base/Menu/ContextMenu";
import { SettingItem } from "../base/Setting/SettingItem";
import { OverviewSettingItem } from "../base/Setting/OverviewSettingItem";
import { DeveloperSettings } from "./DeveloperSettings";
import "./styles/ToolkitOverview.css";
import { useUpdateProgress } from "@/src/core/hooks/useUpdateProgress";

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
	const [contextMenu, setContextMenu] = React.useState<{
		show: boolean;
		x: number;
		y: number;
	}>({ show: false, x: 0, y: 0 });
	const [updaterConfig, setUpdaterConfig] = React.useState(config.updater);
	const [menuConfig, setMenuConfig] = React.useState(config.menu);
	const {
		updateStatus,
		handleUpdateProgress,
		resetStatus,
		showUpdateStatus,
	} = useUpdateProgress();

	// 监听配置变化
	React.useEffect(() => {
		setUpdaterConfig(config.updater);
		setMenuConfig(config.menu);
	}, [config.updater, config.menu]);

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		setContextMenu({
			show: true,
			x: e.clientX,
			y: e.clientY,
		});
	};

	const handleCheckUpdate = async () => {
		try {
			logger.debug("Update check requested from UI");
			resetStatus();
			const result = await plugin.updateManager.checkForUpdates({
				checkBeta: updaterConfig.checkBeta,
				force: true,
				onProgress: handleUpdateProgress,
			});
			logger.debug("Update check result:", result);

			if (!result) {
				handleUpdateProgress({
					stage: "completed",
					message: "已是最新版本",
				});
			}
		} catch (error) {
			logger.error("Failed to check for updates:", error);
		}
	};

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
						onContextMenu={handleContextMenu}
					>
						Version: {plugin.manifest.version}
					</span>

					{contextMenu.show && (
						<ContextMenu
							options={[
								{
									type: "button",
									label: t("common.overview.check_update"),
									onClick: handleCheckUpdate,
									icon: <CircleArrowDown size={16} />,
								},
								{
									type: "toggle",
									label: t("common.overview.auto_update"),
									checked: updaterConfig.autoUpdate,
									onClick: async () => {
										await handleConfigUpdate(
											"updater.autoUpdate",
											!updaterConfig.autoUpdate
										);
										setUpdaterConfig((prev) => ({
											...prev,
											autoUpdate: !prev.autoUpdate,
										}));
									},
								},
								{
									type: "toggle",
									label: t("common.overview.check_beta"),
									checked: updaterConfig.checkBeta,
									onClick: async () => {
										await handleConfigUpdate(
											"updater.checkBeta",
											!updaterConfig.checkBeta
										);
										setUpdaterConfig((prev) => ({
											...prev,
											checkBeta: !prev.checkBeta,
										}));
									},
								},
							]}
							position={contextMenu}
							onClose={() =>
								setContextMenu({ show: false, x: 0, y: 0 })
							}
						/>
					)}

					{showHint && (
						<small className="rht-version-hint">
							{t("common.overview.version_hint")}
						</small>
					)}

					{showUpdateStatus && (
						<div className="rht-update-progress">
							<div className="rht-update-status">
								<span>{updateStatus.status}</span>
								{updateStatus.currentFile && (
									<small className="rht-update-file">
										{updateStatus.currentFile}
									</small>
								)}
							</div>
							{updateStatus.needsUpdate && (
								<div className="rht-progress-bar">
									<div
										className="rht-progress-fill"
										style={{
											width: `${updateStatus.progress}%`,
										}}
									/>
								</div>
							)}
							{updateStatus.error && (
								<div className="rht-update-error">
									{updateStatus.error}
								</div>
							)}
						</div>
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
							title={t(`toolkit.${toolkit.id}.title`)}
							icon={toolkit.icon}
							description={t(`toolkit.${toolkit.id}.description`)}
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
