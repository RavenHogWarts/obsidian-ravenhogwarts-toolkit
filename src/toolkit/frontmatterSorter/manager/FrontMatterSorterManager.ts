import { IToolkitModule } from "@/src/manager/types";
import { FRONTMATTER_SORTER_DEFAULT_CONFIG, IFrontmatterSorterConfig, IFrontmatterSorterData } from "../types/config";
import { BaseManager } from "@/src/manager/BaseManager";
import { FrontMatterParser } from "../services/FrontMatterParser";
import { FrontMatterSorter } from "../services/FrontMatterSorter";
import { FrontMatterWriter } from "../services/FrontMatterWriter";
import minimatch from "minimatch";
import { TFile } from "obsidian";

interface IFrontMatterSorterModule extends IToolkitModule {
    config: IFrontmatterSorterConfig;
    data: IFrontmatterSorterData;
}

export class FrontMatterSorterManager extends BaseManager<IFrontMatterSorterModule> {
    private parser: FrontMatterParser;
    private sorter: FrontMatterSorter;
    private writer: FrontMatterWriter;
    private processing = false;

    protected async onModuleLoad(): Promise<void> {
        this.validateConfig();
        
        this.parser = new FrontMatterParser(this.logger);
        this.sorter = new FrontMatterSorter(this.config.rules);
        this.writer = new FrontMatterWriter(this.config.rules);

        this.registerCommands();
        this.registerEventHandlers();
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
            name: 'Sort frontmatter in current file',
            callback: () => this.sortCurrentFileFrontmatter(),
            hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'S' }]
        });

        this.addCommand({
            id: 'sort-all-frontmatter',
            name: 'Sort frontmatter in all files',
            callback: () => this.sortAllFrontmatter()
        });
    }

    private registerEventHandlers(): void {
        if (this.config.sortOnSave) {
            // 监听文件修改事件
            this.registerEvent(
                this.app.vault.on('modify', 
                    async (file) => {
                        if (this.processing) return;
                        if (!(file instanceof TFile)) return;
                        
                        const activeFile = this.app.workspace.getActiveFile();
                        if (activeFile && activeFile.path === file.path) {
                            await this.sortFile(file);
                        }
                    }
                )
            );
        }
    }

    private async sortCurrentFileFrontmatter(): Promise<void> {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) return;
        await this.sortFile(activeFile);
    }

    private async sortAllFrontmatter(): Promise<void> {
        const files = this.app.vault.getMarkdownFiles();
        const batchSize = 5; // 每批处理的文件数
        
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            await Promise.all(batch.map(file => this.sortFile(file)));
        }
    }

    private async sortFile(file: TFile): Promise<boolean> {
        if (this.processing) return false;
        if (!this.shouldProcessFile(file)) return false;

        try {
            this.processing = true;
            const content = await this.app.vault.read(file);
            const parsed = this.parser.parse(content);
            this.logger.debug('Parsed frontmatter:', parsed);
            if (!parsed) return false;

            const sorted = this.sorter.sort(parsed.entries);
            this.logger.debug('sorted frontmatter:', sorted);
            const newContent = this.writer.generateContent(sorted);
            this.logger.debug('newContent:\n', newContent);

            if (content !== newContent) {
                // await this.app.vault.modify(file, newContent);
                this.logger.notice(`Frontmatter sorted: ${file.path}`);
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Error sorting frontmatter in ${file.path}:`, error);
            return false;
        } finally {
            this.processing = false;
        }
    }

    private shouldProcessFile(file: TFile): boolean {
        if (!file || file.extension !== 'md') return false;

        const isIgnoredFolder = this.config.ignoreFolders.some(folder =>{
            // 确保文件夹路径以 / 结尾
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

    protected onModuleUnload(): void {
        this.logger.info("Unloading frontmatter sorter manager");
        this.processing = false;
    }
}