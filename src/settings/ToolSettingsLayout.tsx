import { FC, ReactNode } from "react";
import ObsidianSetting from "./ObsidianSetting";

interface ToolSettingsLayoutProps {
	toolName: string;
	onBack: () => void;
	children: ReactNode;
}

export const ToolSettingsLayout: FC<ToolSettingsLayoutProps> = ({
	toolName,
	onBack,
	children,
}) => {
	return (
		<ObsidianSetting.Container>
			<ObsidianSetting
				slots={{
					name: toolName,
					control: (
						<ObsidianSetting.Button
							icon={"arrow-left"}
							onClick={onBack}
						/>
					),
				}}
				heading={true}
			/>
			{children}
		</ObsidianSetting.Container>
	);
};
