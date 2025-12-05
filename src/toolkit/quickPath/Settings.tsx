import useSettingsStore from "@src/hook/useSettingsStore";
import { t } from "@src/i18n/i18n";
import { IToolSettingsProps } from "@src/model/toolkit/ITool";
import ObsidianSetting from "@src/settings/ObsidianSetting";
import { ToolSettingsLayout } from "@src/settings/ToolSettingsLayout";
import { FC } from "react";
import { ISettings, pathSeparators } from "./types";

export const Settings: FC<IToolSettingsProps<ISettings>> = ({
	tool,
	onBack,
}) => {
	const settingsStore = useSettingsStore();

	return (
		<ToolSettingsLayout toolName={tool.info.name} onBack={onBack}>
			<ObsidianSetting.Container>
				<ObsidianSetting
					slots={{
						name: t("settings.quick_path.addEditorMenu.name"),
						desc: t("settings.quick_path.addEditorMenu.desc"),
						control: (
							<ObsidianSetting.Toggle
								value={tool.settings.config.addEditorMenu}
								onChange={(v) => {
									settingsStore.updateToolSettingByPath(
										tool.info.id,
										"config.addEditorMenu",
										v
									);
								}}
							/>
						),
					}}
				/>

				<ObsidianSetting
					slots={{
						name: t("settings.quick_path.addFileMenu.name"),
						desc: t("settings.quick_path.addFileMenu.desc"),
						control: (
							<ObsidianSetting.Toggle
								value={tool.settings.config.addFileMenu}
								onChange={(v) => {
									settingsStore.updateToolSettingByPath(
										tool.info.id,
										"config.addFileMenu",
										v
									);
								}}
							/>
						),
					}}
				/>

				<ObsidianSetting
					slots={{
						name: t("settings.quick_path.useAbsolutePath.name"),
						desc: t("settings.quick_path.useAbsolutePath.desc"),
						control: (
							<ObsidianSetting.Toggle
								value={tool.settings.config.useAbsolutePath}
								onChange={(v) => {
									settingsStore.updateToolSettingByPath(
										tool.info.id,
										"config.useAbsolutePath",
										v
									);
								}}
							/>
						),
					}}
				/>

				<ObsidianSetting
					slots={{
						name: t("settings.quick_path.pathSeparator.name"),
						desc: t("settings.quick_path.pathSeparator.desc"),
						control: (
							<ObsidianSetting.Dropdown
								value={tool.settings.config.pathSeparator}
								options={{
									[pathSeparators.newline]: t(
										"settings.quick_path.pathSeparator.newline"
									),
									[pathSeparators.comma]: t(
										"settings.quick_path.pathSeparator.comma"
									),
									[pathSeparators.semicolon]: t(
										"settings.quick_path.pathSeparator.semicolon"
									),
									[pathSeparators.space]: t(
										"settings.quick_path.pathSeparator.space"
									),
								}}
								onChange={(v) => {
									settingsStore.updateToolSettingByPath(
										tool.info.id,
										"config.pathSeparator",
										v
									);
								}}
							/>
						),
					}}
				/>
			</ObsidianSetting.Container>
		</ToolSettingsLayout>
	);
};
