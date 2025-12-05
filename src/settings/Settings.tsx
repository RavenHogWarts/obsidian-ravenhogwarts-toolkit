import usePluginSettings from "@src/hook/usePluginSettings";
import useSettingsStore from "@src/hook/useSettingsStore";
import { setIcon } from "obsidian";
import { FC, useEffect, useRef, useState } from "react";
import { ObsidianSetting } from "./ObsidianSetting";

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
				<ObsidianSetting.Container className="rht__settings--main-heading">
					<ObsidianSetting
						slots={{
							name: "TK[Beta]",
						}}
						heading={true}
					/>
				</ObsidianSetting.Container>

				<ObsidianSetting.Container className="rht__settings--grid">
					<ObsidianSetting
						slots={{
							name: "Toolkit",
						}}
						heading={true}
					/>
					{toolkit.map((tk) => {
						const ToolIcon: FC = () => {
							const iconRef = useRef<HTMLSpanElement>(null);

							useEffect(() => {
								if (iconRef.current && tk.info.icon) {
									setIcon(iconRef.current, tk.info.icon);
								}
							}, []);

							return <span ref={iconRef} />;
						};

						return (
							<ObsidianSetting
								className="mod-toggle rht__settings--grid-item"
								key={tk.info.id}
								slots={{
									name: (
										<>
											<ToolIcon />
											<span>{tk.info.name}</span>
										</>
									),
									desc: (
										<>
											<span>V{tk.info.version}</span>
											<br />
											<span>{tk.info.description}</span>
										</>
									),
									control: (
										<>
											<ObsidianSetting.ExtraButton
												icon={"settings"}
												onClick={() => {
													handleOpenToolSettings(
														tk.info.id
													);
												}}
											/>
											<ObsidianSetting.Toggle
												value={
													settings.toolkit[tk.info.id]
														.enabled
												}
												onChange={(v) => {
													handleToolToggle(
														tk.info.id,
														v
													);
												}}
											/>
										</>
									),
								}}
							/>
						);
					})}
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
