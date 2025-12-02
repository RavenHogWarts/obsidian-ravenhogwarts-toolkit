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

	const [headingEl, setHeadingEl] = useState<HTMLElement | null>(null);
	const [gridEl, setGridEl] = useState<HTMLElement | null>(null);

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
				<div ref={setHeadingEl} className="rht__settings--heading" />
				<div ref={setGridEl} className="rht__settings--grid" />

				{headingEl && (
					<ObsidianSetting
						containerEl={headingEl}
						slots={{
							name: "TK[Beta]",
						}}
						heading={true}
					/>
				)}

				{gridEl &&
					toolkit.map((tk) => (
						<ObsidianSetting
							containerEl={gridEl}
							className="rht__settings--grid-item"
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
