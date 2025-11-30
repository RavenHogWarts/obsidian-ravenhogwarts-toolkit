import { t } from "@src/i18n/i18n";
import { BaseTool } from "@src/model/manager/BaseTool";
import { Toolkit } from "@src/model/manager/Decorators";
import { normalizePath, TFile, TFolder } from "obsidian";
import { IQuickPathSettings, QuickPathDefaultSettings } from "./types";

@Toolkit({
	id: "quick-path",
	name: t("settings.quick_path.name"),
	version: "1.0.0",
	description: t("settings.quick_path.desc"),
})
export class QuickPath extends BaseTool {
	private basePath: string;

	getDefaultSettings(): IQuickPathSettings {
		return QuickPathDefaultSettings;
	}

	async onload(): Promise<void> {
		await super.onload();
		this.basePath = this.context._app.vault.adapter.basePath.replace(
			/\\/g,
			"/"
		);
		this.registerCommands();
	}

	private registerCommands() {
		this.context.addCommand({
			id: "copy-file-path",
			name: "Copy File Path",
			callback: () => {
				const activeFile = this.context._app.workspace.getActiveFile();
				if (activeFile) {
					const path = this.getPath(activeFile);
					this.copyToClipboard(path);
				}
			},
		});
	}

	private getPath(file: TFile | TFolder): string {
		return this.settings.config.useAbsolutePath
			? normalizePath(`${this.basePath}/${file.path}`)
			: normalizePath(file.path);
	}

	private getParentPath(file: TFile | TFolder): string | null {
		const path = this.getPath(file);
		const lastSlashIndex = path.lastIndexOf("/");
		if (lastSlashIndex === -1) {
			return null;
		}
		return normalizePath(path.substring(0, lastSlashIndex));
	}

	private copyToClipboard(text: string): void {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				this.context.notice("File path copied to clipboard.");
			})
			.catch((err) => {
				this.context.log("error", "Failed to copy file path: ", err);
				this.context.notice("Failed to copy file path.");
				throw err;
			});
	}
}
