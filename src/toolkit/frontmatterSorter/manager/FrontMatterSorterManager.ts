import { IToolkitModule } from "@/src/manager/types";
import { FRONTMATTER_SORTER_DEFAULT_CONFIG, IFrontmatterSorterConfig, IFrontmatterSorterData } from "../types/config";
import { BaseManager } from "@/src/manager/BaseManager";
import { FrontMatterParser } from "../services/FrontMatterParser";
import { FrontMatterSorter } from "../services/FrontMatterSorter";
import { FrontMatterWriter } from "../services/FrontMatterWriter";
import minimatch from "minimatch";
import { TFile } from "obsidian";
import { Modal } from "obsidian";

interface IFrontMatterSorterModule extends IToolkitModule {
    config: IFrontmatterSorterConfig;
    data: IFrontmatterSorterData;
}

export class FrontMatterSorterManager extends BaseManager<IFrontMatterSorterModule> {
    private parser: FrontMatterParser;
    private sorter: FrontMatterSorter;
    private writer: FrontMatterWriter;
    private processing = false;
    private modifyEventRef: any = null;

    protected async onModuleLoad(): Promise<void> {
        this.validateConfig();
        
        this.initializeServices();
        
        this.registerCommands();
        this.registerEventHandlers();
    }

    private initializeServices(): void {
        this.parser = new FrontMatterParser(this.logger);
        this.sorter = new FrontMatterSorter(this.config.rules);
        this.writer = new FrontMatterWriter(this.config.rules);
    }

    private validateConfig(): void {
        if (!this.config) {
            throw new Error('Configuration is missing');
        }
        
        this.config.ignoreFolders = Array.isArray(this.config.ignoreFolders) ? this.config.ignoreFolders : [];
        this.config.ignoreFiles = Array.isArray(this.config.ignoreFiles) ? this.config.ignoreFiles : [];
        this.config.rules = this.config.rules || FRONTMATTER_SORTER_DEFAULT_CONFIG.rules;
    }

    private registerCommands(): void {
        this.addCommand({
            id: 'sort-frontmatter',
            name: this.t('toolkit.frontmatterSorter.command.sortCurrentFile'),
            callback: () => this.sortCurrentFileFrontmatter(),
            // hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'S' }]
        });

        this.addCommand({
            id: 'sort-all-frontmatter',
            name: this.t('toolkit.frontmatterSorter.command.sortAllFiles'),
            callback: () => this.sortAllFrontmatter()
        });
    }

    private registerEventHandlers(): void {
        this.unregisterEventHandlers();
        
        this.logger.debug('Current config when registering events:', {
            sortOnSave: this.config.sortOnSave,
            fullConfig: this.config
        });
        
        if (this.config.sortOnSave) {
            this.modifyEventRef = this.registerEvent(
                this.app.vault.on('modify', this.handleFileModify.bind(this))
            );
            this.logger.debug('Registered auto-sort on save handler');
        }
    }

    private unregisterEventHandlers(): void {
        if (this.modifyEventRef) {
            this.modifyEventRef();
            this.modifyEventRef = null;
            this.logger.debug('Unregistered auto-sort on save handler');
        }
    }

    private async handleFileModify(file: TFile): Promise<void> {
        if (!this.config.sortOnSave) {
            this.logger.debug('Sort on save is disabled, ignoring file modification');
            return;
        }

        if (this.processing) return;
        if (!(file instanceof TFile)) return;
        
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile || activeFile.path !== file.path) return;
        
        if (!this.shouldProcessFile(file)) {
            this.logger.debug(`File ${file.path} ${this.getIgnoreReason(file)}, skipped auto-sorting`);
            return;
        }

        await this.sortFile(file);
    }

    private async sortCurrentFileFrontmatter(): Promise<void> {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return;

        if (!this.shouldProcessFile(activeFile)) {
            this.logger.notice(
                this.t('toolkit.frontmatterSorter.notice.file_ignored', [
                    activeFile.path,
                    this.getIgnoreReason(activeFile)
                ])
            );
            return;
        }

        await this.sortFile(activeFile);
    }

    private async sortAllFrontmatter(): Promise<void> {
        const confirmed = await new Promise<boolean>(resolve => {
            const modal = new Modal(this.app);
            modal.titleEl.setText(this.t('toolkit.frontmatterSorter.notice.confirm_sort_all.title'));
            modal.contentEl.setText(this.t('toolkit.frontmatterSorter.notice.confirm_sort_all.message'));
            
            modal.contentEl.createDiv({ cls: "modal-button-container" }, (buttonContainer) => {
                buttonContainer
                    .createEl("button", { text: this.t('common.confirm') })
                    .addEventListener("click", () => {
                        modal.close();
                        resolve(true);
                    });
                
                buttonContainer
                    .createEl("button", { text: this.t('common.cancel') })
                    .addEventListener("click", () => {
                        modal.close();
                        resolve(false);
                    });
            });

            modal.open();
        });

        if (!confirmed) {
            return;
        }

        const files = this.app.vault.getMarkdownFiles();
        const batchSize = 5;
        
        let sortedCount = 0;
        let skippedCount = 0;
        const skippedFiles: string[] = [];

        if (this.processing) {
            return;
        }

        try {
            this.processing = true;
            
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);
                const results = await Promise.all(
                    batch.map(async file => {
                        if (!this.shouldProcessFile(file)) {
                            skippedFiles.push(`${file.path} (${this.getIgnoreReason(file)})`);
                            return false;
                        }
                        return this.sortFile(file, true);
                    })
                );
                
                sortedCount += results.filter(Boolean).length;
                skippedCount += results.filter(r => r === false).length;
            }

            this.logger.notice(
                `${this.t('toolkit.frontmatterSorter.notice.sort_complete', [sortedCount, skippedCount])}\n` +
                this.t('toolkit.frontmatterSorter.notice.check_console')
            );

            if (skippedFiles.length > 0) {
                this.logger.info(
                    this.t('toolkit.frontmatterSorter.notice.sort_details', [
                        sortedCount,
                        skippedCount,
                        skippedFiles.join('\n  ')
                    ])
                );
            }
        } finally {
            this.processing = false;
        }
    }

    private getIgnoreReason(file: TFile): string {
        const ignoredFolder = this.config.ignoreFolders.find(folder => {
            const normalizedFolder = folder.endsWith('/') ? folder : folder + '/';
            return file.path.startsWith(normalizedFolder);
        });
        if (ignoredFolder) {
            return this.t('toolkit.frontmatterSorter.notice.ignore_folder', [ignoredFolder]);
        }

        const ignoredPattern = this.config.ignoreFiles.find(pattern => {
            try {
                return minimatch(file.path, pattern, { matchBase: true });
            } catch (error) {
                return false;
            }
        });
        if (ignoredPattern) {
            return this.t('toolkit.frontmatterSorter.notice.ignore_pattern', [ignoredPattern]);
        }
        return this.t('toolkit.frontmatterSorter.notice.ignore_unknown');
    }

    private async sortFile(file: TFile, skipProcessingCheck = false): Promise<boolean> {
        if (!skipProcessingCheck && this.processing) return false;

        try {
            if (!skipProcessingCheck) {
                this.processing = true;
            }
            
            const content = await this.app.vault.read(file);
            const parsed = this.parser.parse(content);
            this.logger.debug('Parsed frontmatter:', parsed);
            if (!parsed) return false;

            const sorted = this.sorter.sort(parsed.entries);
            this.logger.debug('sorted frontmatter:', sorted);
            const newContent = this.writer.generateContent(sorted, parsed, content);
            this.logger.debug('newContent:\n', newContent);

            if (content !== newContent) {
                await this.app.vault.modify(file, newContent);
                this.logger.notice(
                    this.t('toolkit.frontmatterSorter.notice.file_sorted', [file.path])
                );
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Error sorting frontmatter in ${file.path}:`, error);
            return false;
        } finally {
            if (!skipProcessingCheck) {
                this.processing = false;
            }
        }
    }

    private shouldProcessFile(file: TFile): boolean {
        if (!file || file.extension !== 'md') return false;

        const isIgnoredFolder = this.config.ignoreFolders.some(folder =>{
            const normalizedFolder = folder.endsWith('/') ? folder : folder + '/';
            return file.path.startsWith(normalizedFolder);
        } );
        
        const isIgnoredFile = this.config.ignoreFiles.some(pattern =>{ 
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
        this.logger.debug('Config changed, current config:', {
            sortOnSave: this.config.sortOnSave,
            rules: this.config.rules,
            fullConfig: this.config
        });
        
        // 更新 sorter 和 writer 实例以使用新的规则
        this.sorter = new FrontMatterSorter(this.config.rules);
        this.writer = new FrontMatterWriter(this.config.rules);
        
        // 处理 sortOnSave 相关的事件处理器
        this.unregisterEventHandlers();
        if (this.config.sortOnSave) {
            this.registerEventHandlers();
        }

        this.logger.debug('Updated sorter and writer with new rules');
    }

    protected onModuleUnload(): void {
        this.logger.info("Unloading frontmatter sorter manager");
        this.unregisterEventHandlers();
        this.processing = false;
    }
}