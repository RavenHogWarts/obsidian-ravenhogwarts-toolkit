import { t } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import { Settings } from "./Settings";
import { DefaultSettings, ISettings } from "./types";

@Toolkit({
	id: "table-calculator",
	name: t("settings.table_calculator.name"),
	icon: "table",
	version: "1.0.0",
	description: t("settings.table_calculator.desc"),
})
export class TableCalculator extends BaseTool {
	getDefaultSettings(): ISettings {
		return DefaultSettings;
	}

	getSettingsComponent() {
		return Settings;
	}

	async onload(): Promise<void> {
		await super.onload();
	}

	onunload(): void {
		super.onunload();
	}
}
