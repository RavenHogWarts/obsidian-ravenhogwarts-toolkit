import * as React from "react";
import { SettingItem } from "@/src/components/base/Setting/SettingItem";
import { Toggle } from "@/src/components/base/Button/Toggle";
import { t } from "@/src/i18n/i18n";
import { useModuleConfig } from "@/src/core/hooks/useModuleConfig";
import { ICodeEditorConfig } from "@/src/toolkit/codeEditor/types/config";
import RavenHogwartsToolkitPlugin from "@/src/main";
import { TagInput } from "@/src/components/base/Input/TagInput";
import { Select } from "@/src/components/base/Select/Select";
import { Input } from "@/src/components/base/Input/Input";
import {
	AceDarkThemesList,
	AceKeyboardList,
	AceLightThemesList,
} from "@/src/toolkit/codeEditor/services/AceThemes";
import { IconPicker } from "@/src/components/base/Icon/IconPicker";

interface CodeEditorSettingsProps {
	plugin: RavenHogwartsToolkitPlugin;
}

export const CodeEditorSettings: React.FC<CodeEditorSettingsProps> = ({
	plugin,
}) => {
	const { config, updateConfig } = useModuleConfig<ICodeEditorConfig>(
		plugin,
		"codeEditor"
	);

	const handleUpdateConfig = async (updates: Partial<ICodeEditorConfig>) => {
		try {
			await updateConfig(updates);
		} catch (err) {
			console.error("Failed to update config:", err);
		}
	};

	const lightThemeOptions = AceLightThemesList.map((theme) => ({
		value: theme,
		label: theme,
	}));

	const darkThemeOptions = AceDarkThemesList.map((theme) => ({
		value: theme,
		label: theme,
	}));

	const keyboardOptions = AceKeyboardList.map((keyboard) => ({
		value: keyboard,
		label: keyboard,
	}));

	const snippetsManagerOptions = [
		{
			value: "Null",
			label: t(
				"toolkit.codeEditor.settings.snippetsManager.location.Null"
			),
		},
		{
			value: "Ribbon",
			label: t(
				"toolkit.codeEditor.settings.snippetsManager.location.Ribbon"
			),
		},
	];

	return (
		<div className="rht-toolkit-detail-settings">
			<SettingItem
				name={t("toolkit.codeEditor.settings.supportExtensions.title")}
				desc={t(
					"toolkit.codeEditor.settings.supportExtensions.description"
				)}
				collapsible={true}
				defaultCollapsed={true}
			>
				<TagInput
					values={config.supportExtensions}
					onChange={(value) =>
						handleUpdateConfig({ supportExtensions: value })
					}
				/>
			</SettingItem>

			<SettingItem
				name={t("toolkit.codeEditor.settings.theme.light")}
				desc={t("toolkit.codeEditor.settings.theme.light_description")}
			>
				<Select
					options={lightThemeOptions}
					value={config.lightTheme}
					onValueChange={(value) =>
						handleUpdateConfig({ lightTheme: value })
					}
				/>
			</SettingItem>

			<SettingItem
				name={t("toolkit.codeEditor.settings.theme.dark")}
				desc={t("toolkit.codeEditor.settings.theme.dark_description")}
			>
				<Select
					options={darkThemeOptions}
					value={config.darkTheme}
					onValueChange={(value) =>
						handleUpdateConfig({ darkTheme: value })
					}
				/>
			</SettingItem>

			<SettingItem
				name={t("toolkit.codeEditor.settings.snippetsManager.title")}
				desc={t(
					"toolkit.codeEditor.settings.snippetsManager.description"
				)}
			>
				<Select
					options={snippetsManagerOptions}
					value={config.snippetsManager.location}
					onValueChange={(value) =>
						handleUpdateConfig({
							"snippetsManager.location": value,
						})
					}
				/>
				<IconPicker
					app={plugin.app}
					value={config.snippetsManager.icon}
					onChange={(value) =>
						handleUpdateConfig({ "snippetsManager.icon": value })
					}
				/>
			</SettingItem>

			<SettingItem
				name={t("toolkit.codeEditor.settings.keyboard.title")}
				desc={t("toolkit.codeEditor.settings.keyboard.description")}
			>
				<Select
					options={keyboardOptions}
					value={config.keyboard}
					onValueChange={(value) =>
						handleUpdateConfig({ keyboard: value })
					}
				/>
			</SettingItem>

			<SettingItem
				name={t("toolkit.codeEditor.settings.lineNumbers.title")}
				desc={t("toolkit.codeEditor.settings.lineNumbers.description")}
			>
				<Toggle
					checked={config.lineNumbers}
					onChange={(value) =>
						handleUpdateConfig({ lineNumbers: value })
					}
				/>
			</SettingItem>

			<SettingItem
				name={t("toolkit.codeEditor.settings.fontSize.title")}
				desc={t("toolkit.codeEditor.settings.fontSize.description")}
			>
				<Input
					type="number"
					value={config.fontSize}
					onChange={(value) =>
						handleUpdateConfig({ fontSize: Number(value) })
					}
				/>
			</SettingItem>

			<SettingItem
				name={t("toolkit.codeEditor.settings.fontFamily.title")}
				desc={t("toolkit.codeEditor.settings.fontFamily.description")}
			>
				<Input
					value={config.fontFamily}
					onChange={(value) =>
						handleUpdateConfig({ fontFamily: String(value) })
					}
				/>
			</SettingItem>

			<SettingItem
				name={t("toolkit.codeEditor.settings.tabSize.title")}
				desc={t("toolkit.codeEditor.settings.tabSize.description")}
			>
				<Input
					type="number"
					value={config.tabSize}
					onChange={(value) =>
						handleUpdateConfig({ tabSize: Number(value) })
					}
				/>
			</SettingItem>
		</div>
	);
};
