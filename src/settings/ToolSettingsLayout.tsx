import { FC, ReactNode, useState } from "react";
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
	const [headingEl, setHeadingEl] = useState<HTMLElement | null>(null);

	return (
		<>
			<div ref={setHeadingEl} className="rht__settings--heading" />
			<div className="rht__settings--content">{children}</div>

			{headingEl && (
				<ObsidianSetting
					containerEl={headingEl}
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
			)}
		</>
	);
};
