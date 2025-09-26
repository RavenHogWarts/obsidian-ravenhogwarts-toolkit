import { SettingItem } from "@/src/components/base/Setting/SettingItem";
import { useModuleConfig } from "@/src/core/hooks/useModuleConfig";
import { t } from "@/src/i18n/i18n";
import RavenHogwartsToolkitPlugin from "@/src/main";
import * as React from "react";
import { IFolderTemplatesConfig } from "../../types/config";

interface FolderTemplatesSettingsProps {
	plugin: RavenHogwartsToolkitPlugin;
}

export const FolderTemplatesSettings: React.FC<
	FolderTemplatesSettingsProps
> = ({ plugin }) => {
	const { config, updateConfig } = useModuleConfig<IFolderTemplatesConfig>(
		plugin,
		"folderTemplates"
	);

	const handleUpdateConfig = async (
		updates: Partial<IFolderTemplatesConfig>
	) => {
		try {
			await updateConfig(updates);
		} catch (err) {
			console.error("Failed to update config:", err);
		}
	};

	return (
		<div className="rht-toolkit-detail-settings">
			<SettingItem
				name={t(
					"toolkit.folderTemplates.settings.templatesFolderPath.title"
				)}
				desc={t(
					"toolkit.folderTemplates.settings.templatesFolderPath.description"
				)}
			></SettingItem>
		</div>
	);
};
