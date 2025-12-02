import { IToolSettingsProps } from "@src/model/toolkit/ITool";
import { ToolSettingsLayout } from "@src/settings/ToolSettingsLayout";
import { FC } from "react";

export const Settings: FC<IToolSettingsProps> = ({ tool, onBack }) => {
	return (
		<ToolSettingsLayout toolName={tool.info.name} onBack={onBack}>
			{/* Add your tool-specific settings components here */}
			<></>
		</ToolSettingsLayout>
	);
};
