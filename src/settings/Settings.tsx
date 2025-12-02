import usePluginSettings from "@src/hook/usePluginSettings";
import useSettingsStore from "@src/hook/useSettingsStore";
import { FC } from "react";
import ObsidianSetting from "./ObsidianSetting";

export const Settings: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);
	const toolkit = settingsStore.plugin.toolkitManager.getToolkit();

	const handleToolToggle = (toolId: string, enabled: boolean) => {
		enabled
			? settingsStore.plugin.toolkitManager.enableTool(toolId)
			: settingsStore.plugin.toolkitManager.disableTool(toolId);
	};

	return (
		<>
			<ObsidianSetting.Container>
				<ObsidianSetting
					slots={{
						name: "TK[Beta]",
					}}
					heading={true}
				/>

				{toolkit.map((tk) => (
					<ObsidianSetting
						key={tk.info.name}
						slots={{
							name: tk.info.name,
							desc: tk.info.description,
							control: (
								<>
									<ObsidianSetting.Toggle
										value={
											settings.toolkit[tk.info.id].enabled
										}
										onChange={(v) => {
											handleToolToggle(tk.info.id, v);
										}}
									/>
									<ObsidianSetting.ExtraButton
										icon={"settings"}
									/>
								</>
							),
						}}
					/>
				))}
			</ObsidianSetting.Container>
		</>
	);
};
