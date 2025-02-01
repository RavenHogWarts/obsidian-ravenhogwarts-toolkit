import * as React from "react";
import { SettingItem } from "@/src/components/base/Setting/SettingItem";
import { t } from "@/src/i18n/i18n";
import { IQuickPathConfig } from "@/src/toolkit/quickPath/types/config";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { useModuleConfig } from "@/src/core/hooks/useModuleConfig";
import { Toggle } from "@/src/components/base/Button/Toggle";
import { Select } from "@/src/components/base/Select/Select";

interface QuickPathSettingsProps {
	plugin: RavenHogwartsToolkitPlugin;
}

export const QuickPathSettings: React.FC<QuickPathSettingsProps> = ({
	plugin,
}) => {
	const { config, updateConfig } = useModuleConfig<IQuickPathConfig>(
		plugin,
		"quickPath"
	);

	const handleUpdateConfig = async (updates: Partial<IQuickPathConfig>) => {
		try {
			await updateConfig(updates);
		} catch (err) {
			console.error("Failed to update config:", err);
		}
	};

	return (
		<div className="rht-toolkit-detail-settings">
			<SettingItem
				name={t("toolkit.quickPath.settings.addEditorMenu.title")}
				desc={t("toolkit.quickPath.settings.addEditorMenu.description")}
			>
				<Toggle
					checked={config.addEditorMenu}
					onChange={(checked) =>
						handleUpdateConfig({ addEditorMenu: checked })
					}
				/>
			</SettingItem>

			<SettingItem
				name={t("toolkit.quickPath.settings.addFileMenu.title")}
				desc={t("toolkit.quickPath.settings.addFileMenu.description")}
			>
				<Toggle
					checked={config.addFileMenu}
					onChange={(checked) =>
						handleUpdateConfig({ addFileMenu: checked })
					}
				/>
			</SettingItem>

			<SettingItem
				name={t("toolkit.quickPath.settings.absolutePath.title")}
				desc={t("toolkit.quickPath.settings.absolutePath.description")}
			>
				<Toggle
					checked={config.useAbsolutePath}
					onChange={(checked) =>
						handleUpdateConfig({ useAbsolutePath: checked })
					}
				/>
			</SettingItem>

			<SettingItem
				name={t("toolkit.quickPath.settings.separator.title")}
				desc={t("toolkit.quickPath.settings.separator.description")}
			>
				<Select
					value={config.pathSeparator}
					onValueChange={(value) =>
						handleUpdateConfig({ pathSeparator: value })
					}
					options={[
						{
							label: t(
								"toolkit.quickPath.settings.separator.newline"
							),
							value: "\n",
						},
						{
							label: t(
								"toolkit.quickPath.settings.separator.comma"
							),
							value: ", ",
						},
						{
							label: t(
								"toolkit.quickPath.settings.separator.semicolon"
							),
							value: "; ",
						},
					]}
				></Select>
			</SettingItem>
		</div>
	);
};
