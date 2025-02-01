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

	const themeOptions = [
		{ value: "auto", label: "auto" },
		{ value: "vs", label: "vs" },
		{ value: "vs-dark", label: "vs-dark" },
		{ value: "hc-light", label: "hc-light" },
		{ value: "hc-black", label: "hc-black" },
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
				name={t("toolkit.codeEditor.settings.theme.title")}
				desc={t("toolkit.codeEditor.settings.theme.description")}
			>
				<Select
					options={themeOptions}
					value={config.theme}
					onValueChange={(value) =>
						handleUpdateConfig({ theme: value })
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
				name={t("toolkit.codeEditor.settings.minimap.title")}
				desc={t("toolkit.codeEditor.settings.minimap.description")}
			>
				<Toggle
					checked={config.minimap}
					onChange={(value) => handleUpdateConfig({ minimap: value })}
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

			<SettingItem
				name={t("toolkit.codeEditor.settings.lineHeight.title")}
				desc={t("toolkit.codeEditor.settings.lineHeight.description")}
			>
				<Input
					type="number"
					value={config.lineHeight}
					onChange={(value) =>
						handleUpdateConfig({ lineHeight: Number(value) })
					}
				/>
			</SettingItem>

			<SettingItem
				name={t("toolkit.codeEditor.settings.letterSpacing.title")}
				desc={t(
					"toolkit.codeEditor.settings.letterSpacing.description"
				)}
			>
				<Input
					type="number"
					value={config.letterSpacing}
					onChange={(value) =>
						handleUpdateConfig({ letterSpacing: Number(value) })
					}
				/>
			</SettingItem>
		</div>
	);
};
