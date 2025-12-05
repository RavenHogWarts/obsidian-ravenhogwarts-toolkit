import { IToolSettingsProps } from "@src/model/toolkit/ITool";
import { ToolSettingsLayout } from "@src/settings/ToolSettingsLayout";
import { FC } from "react";
import { ISettings } from "./types";

export const Settings: FC<IToolSettingsProps<ISettings>> = ({
	tool,
	onBack,
}) => {
	return (
		<ToolSettingsLayout toolName={tool.info.name} onBack={onBack}>
			<></>
		</ToolSettingsLayout>
	);
};
