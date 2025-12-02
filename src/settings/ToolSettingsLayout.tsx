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
					name: (
						<>
							<ObsidianSetting.Button
								icon={"arrow-left"}
								onClick={onBack}
							/>
							{/* {toolName} */}
						</>
					),
				}}
				heading={true}
			/>
			{children}
		</ObsidianSetting.Container>
	);
};
