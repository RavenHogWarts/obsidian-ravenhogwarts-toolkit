import { FolderSuggestInput } from "@src/components/combobox/FolderSuggestInput";
import useSettingsStore from "@src/hook/useSettingsStore";
import { t } from "@src/i18n/i18n";
import { IToolSettingsProps } from "@src/model/toolkit/ITool";
import { ObsidianSetting } from "@src/settings/ObsidianSetting";
import { ToolSettingsLayout } from "@src/settings/ToolSettingsLayout";
import { FC } from "react";
import { ISettings } from "./types";

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
						name: t(
							"settings.folder_templates.templatesFolderPath.name"
						),
						desc: t(
							"settings.folder_templates.templatesFolderPath.desc"
						),
						control: (
							<>
								<FolderSuggestInput
									value={
										tool.settings.config.templatesFolderPath
									}
									onChange={(v) => {
										settingsStore.updateToolSettingByPath(
											tool.info.id,
											"config.templatesFolderPath",
											v
										);
									}}
								/>
								<ObsidianSetting.ExtraButton
									icon={"reset"}
									onClick={() => {}}
								/>
							</>
						),
					}}
				/>
			</ObsidianSetting.Container>
		</ToolSettingsLayout>
	);
};
