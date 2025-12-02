import usePluginSettings from "@src/hook/usePluginSettings";
import useSettingsStore from "@src/hook/useSettingsStore";
import { FC, useState } from "react";
import ObsidianSetting from "./ObsidianSetting";

type SettingsView = { type: "main" } | { type: "tool"; toolId: string };

export const Settings: FC = () => {
	const settingsStore = useSettingsStore();
	const settings = usePluginSettings(settingsStore);
	const toolkit = settingsStore.plugin.toolkitManager.getToolkit();

	const [currentView, setCurrentView] = useState<SettingsView>({
		type: "main",
	});

	const handleToolToggle = (toolId: string, enabled: boolean) => {
		enabled
			? settingsStore.plugin.toolkitManager.enableTool(toolId)
			: settingsStore.plugin.toolkitManager.disableTool(toolId);
	};

	const handleOpenToolSettings = (toolId: string) => {
		setCurrentView({ type: "tool", toolId });
	};

	const handleBack = () => {
		setCurrentView({ type: "main" });
	};

	if (currentView.type === "main") {
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
												settings.toolkit[tk.info.id]
													.enabled
											}
											onChange={(v) => {
												handleToolToggle(tk.info.id, v);
											}}
										/>
										<ObsidianSetting.ExtraButton
											icon={"settings"}
											onClick={() => {
												handleOpenToolSettings(
													tk.info.id
												);
											}}
										/>
									</>
								),
							}}
						/>
					))}
				</ObsidianSetting.Container>
			</>
		);
	}

	const tool = toolkit.find((t) => t.info.id === currentView.toolId);
	if (!tool) {
		return null;
	}

	const ToolSettingsComponent = tool.getSettingsComponent();
	return (
		<>
			<ToolSettingsComponent tool={tool} onBack={handleBack} />
		</>
	);
};
