import { IToolkitModule } from "@/src/core/interfaces/types";
import {
	FRONTMATTER_SORTER_DEFAULT_CONFIG,
	IFrontmatterSorterConfig,
	IFrontmatterSorterData,
} from "../types/config";
import { BaseManager } from "@/src/core/services/BaseManager";
import { FrontMatterParser } from "../services/FrontMatterParser";
import { FrontMatterSorter } from "../services/FrontMatterSorter";
import { FrontMatterWriter } from "../services/FrontMatterWriter";
import minimatch from "minimatch";
import { Modal, TFile } from "obsidian";

interface IFrontMatterSorterModule extends IToolkitModule {
	config: IFrontmatterSorterConfig;
	data: IFrontmatterSorterData;
}

export class FrontMatterSorterManager extends BaseManager<IFrontMatterSorterModule> {
	private parser: FrontMatterParser;
	private sorter: FrontMatterSorter;
	private writer: FrontMatterWriter;
	private processing = false;

	protected getDefaultConfig(): IFrontmatterSorterConfig {
		return FRONTMATTER_SORTER_DEFAULT_CONFIG;
	}

	protected async onModuleLoad(): Promise<void> {
		this.logger.info("Loading frontmatter sorter manager");
		this.validateConfig();
		this.initializeServices();
		this.registerCommands();
		this.registerEventHandlers();
	}

	protected onModuleUnload(): void {
		this.logger.info("Unloading frontmatter sorter manager");
	}

	protected onModuleCleanup(): void {
		this.eventRefs.forEach((ref) => ref());
		this.eventRefs = [];
		this.processing = false;
	}

	protected onDisable(): void {
		this.unregisterEvents();
	}

	private initializeServices(): void {
		this.parser = new FrontMatterParser(this.logger);
		this.sorter = new FrontMatterSorter(this.config.rules);
		this.writer = new FrontMatterWriter(this.config.rules, this.logger);
	}

	private validateConfig(): void {
		if (!this.config) {
			this.logger.throwError(new Error("Configuration is missing"));
		}

		this.config.ignoreFolders = Array.isArray(this.config.ignoreFolders)
			? this.config.ignoreFolders
			: [];
		this.config.ignoreFiles = Array.isArray(this.config.ignoreFiles)
			? this.config.ignoreFiles
			: [];
		this.config.rules =
			this.config.rules || FRONTMATTER_SORTER_DEFAULT_CONFIG.rules;
	}

	private registerCommands(): void {
		this.addCommand({
			id: "sort-frontmatter",
			name: this.t("toolkit.frontmatterSorter.command.sortCurrentFile"),
			callback: () => this.sortCurrentFileFrontmatter(),
			// hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'S' }]
		});

		this.addCommand({
			id: "sort-all-frontmatter",
			name: this.t("toolkit.frontmatterSorter.command.sortAllFiles"),
			callback: () => this.sortAllFrontmatter(),
		});
	}

	protected registerEventHandlers(): void {
		this.unregisterEvents();

		if (!this.isPluginEnabled() || !this.isEnabled()) {
			return;
		}

		if (this.config.sortOnSave) {
			const eventRef = this.app.metadataCache.on(
				"changed",
				this.handleFileModify.bind(this)
			);

			const unsubscribe = () => {
				if (eventRef) {
					this.app.metadataCache.offref(eventRef);
				}
			};

			this.eventRefs.push(unsubscribe);
			this.logger.debug("Registered auto-sort on save handler");
		}
	}

	private async handleFileModify(file: TFile): Promise<void> {
		if (!this.isPluginEnabled() || !this.isEnabled()) {
			this.unregisterEvents();
			return;
		}

		if (!this.config.sortOnSave) {
			this.logger.debug(
				"Sort on save is disabled, ignoring file modification"
			);
			return;
		}

		if (this.processing) return;
		if (!(file instanceof TFile)) return;

		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.path !== file.path) return;

		if (!this.shouldProcessFile(file)) {
			this.logger.debug(
				`File ${file.path} ${this.getIgnoreReason(
					file
				)}, skipped auto-sorting`
			);
			return;
		}

		await this.sortFile(file);
	}

	private async sortCurrentFileFrontmatter(): Promise<void> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return;

		if (!this.shouldProcessFile(activeFile)) {
			this.logger.notice(
				this.t("toolkit.frontmatterSorter.notice.file_ignored", [
					activeFile.path,
					this.getIgnoreReason(activeFile),
				])
			);
			return;
		}

		await this.sortFile(activeFile);
	}

	private async sortAllFrontmatter(): Promise<void> {
		const confirmed = await new Promise<boolean>((resolve) => {
			const modal = new Modal(this.app);
			modal.titleEl.setText(
				this.t(
					"toolkit.frontmatterSorter.notice.confirm_sort_all.title"
				)
			);
			modal.contentEl.setText(
				this.t(
					"toolkit.frontmatterSorter.notice.confirm_sort_all.message"
				)
			);

			modal.contentEl.createDiv(
				{ cls: "modal-button-container" },
				(buttonContainer) => {
					buttonContainer
						.createEl("button", { text: this.t("common.confirm") })
						.addEventListener("click", () => {
							modal.close();
							resolve(true);
						});

					buttonContainer
						.createEl("button", { text: this.t("common.cancel") })
						.addEventListener("click", () => {
							modal.close();
							resolve(false);
						});
				}
			);

			modal.open();
		});

		if (!confirmed) return;

		const files = this.app.vault.getMarkdownFiles();
		const batchSize = 5;

		let sortedCount = 0;
		let skippedCount = 0;
		const skippedFiles: string[] = [];

		if (this.processing) return;

		try {
			this.processing = true;

			for (let i = 0; i < files.length; i += batchSize) {
				const batch = files.slice(i, i + batchSize);
				const results = await Promise.all(
					batch.map(async (file) => {
						if (!this.shouldProcessFile(file)) {
							skippedFiles.push(
								`${file.path} (${this.getIgnoreReason(file)})`
							);
							return false;
						}
						return this.sortFile(file, true);
					})
				);

				sortedCount += results.filter(Boolean).length;
				skippedCount += results.filter((r) => r === false).length;
			}

			this.logger.notice(
				`${this.t("toolkit.frontmatterSorter.notice.sort_complete", [
					sortedCount,
					skippedCount,
				])}\n` +
					this.t("toolkit.frontmatterSorter.notice.check_console")
			);

			if (skippedFiles.length > 0) {
				this.logger.info(
					this.t("toolkit.frontmatterSorter.notice.sort_details", [
						sortedCount,
						skippedCount,
						skippedFiles.join("\n  "),
					])
				);
			}
		} finally {
			this.processing = false;
		}
	}

	private getIgnoreReason(file: TFile): string {
		const ignoredFolder = this.config.ignoreFolders.find((folder) => {
			const normalizedFolder = folder.endsWith("/")
				? folder
				: folder + "/";
			return file.path.startsWith(normalizedFolder);
		});
		if (ignoredFolder) {
			return this.t("toolkit.frontmatterSorter.notice.ignore_folder", [
				ignoredFolder,
			]);
		}

		const ignoredPattern = this.config.ignoreFiles.find((pattern) => {
			try {
				return minimatch(file.path, pattern, { matchBase: true });
			} catch (error) {
				return false;
			}
		});
		if (ignoredPattern) {
			return this.t("toolkit.frontmatterSorter.notice.ignore_pattern", [
				ignoredPattern,
			]);
		}
		return this.t("toolkit.frontmatterSorter.notice.ignore_unknown");
	}

	private async sortFile(
		file: TFile,
		skipProcessingCheck = false
	): Promise<boolean> {
		if (!skipProcessingCheck && this.processing) return false;

		try {
			if (!skipProcessingCheck) {
				this.processing = true;
			}

			const content = await this.app.vault.read(file);
			const parsed = this.parser.parse(content);
			this.logger.debug("Parsed frontmatter:", parsed);
			if (!parsed) return false;

			const sorted = this.sorter.sort(parsed.entries);
			this.logger.debug("sorted frontmatter:", sorted);
			const newContent = this.writer.generateContent(
				sorted,
				parsed,
				content
			);
			this.logger.debug("newContent:\n", newContent);

			if (content !== newContent) {
				await this.app.vault.modify(file, newContent);
				this.logger.notice(
					this.t("toolkit.frontmatterSorter.notice.file_sorted", [
						file.path,
					])
				);
				return true;
			}
			return false;
		} catch (error) {
			this.logger.error(
				`Error sorting frontmatter in ${file.path}:`,
				error
			);
			return false;
		} finally {
			if (!skipProcessingCheck) {
				this.processing = false;
			}
		}
	}

	private shouldProcessFile(file: TFile): boolean {
		if (!file || file.extension !== "md") return false;

		const isIgnoredFolder = this.config.ignoreFolders.some((folder) => {
			const normalizedFolder = folder.endsWith("/")
				? folder
				: folder + "/";
			return file.path.startsWith(normalizedFolder);
		});

		const isIgnoredFile = this.config.ignoreFiles.some((pattern) => {
			try {
				return minimatch(file.path, pattern, { matchBase: true });
			} catch (error) {
				this.logger.error(`Invalid ignore pattern: ${pattern}`, error);
				return false;
			}
		});

		return !isIgnoredFolder && !isIgnoredFile;
	}

	protected onConfigChange(): void {
		// 更新服务实例以使用新的规则
		this.sorter = new FrontMatterSorter(this.config.rules);
		this.writer = new FrontMatterWriter(this.config.rules, this.logger);

		// 重新注册事件处理器
		this.unregisterEvents();
		this.registerEventHandlers();
	}
}
