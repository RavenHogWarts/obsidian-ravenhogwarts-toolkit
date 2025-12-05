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
		<>
			<ObsidianSetting.Container className="rht__settings--heading">
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
			</ObsidianSetting.Container>

			<div className="rht__settings--content">{children}</div>
		</>
	);
};
