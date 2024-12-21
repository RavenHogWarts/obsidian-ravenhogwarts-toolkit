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
                            if (!this.shouldProcessFile(file)) {
                                this.logger.debug(`文件 ${file.path} ${this.getIgnoreReason(file)}，已跳过自动排序`);
                                return;
                            }
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

        if (!this.shouldProcessFile(activeFile)) {
            const ignoreReason = this.getIgnoreReason(activeFile);
            this.logger.notice(`当前文件 ${activeFile.path} ${ignoreReason}，已跳过排序`);
            return;
        }

        await this.sortFile(activeFile);
    }

    private async sortAllFrontmatter(): Promise<void> {
        const files = this.app.vault.getMarkdownFiles();
        const batchSize = 5;
        
        let sortedCount = 0;
        let skippedCount = 0;
        const skippedFiles: string[] = [];

        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(async file => {
                    if (!this.shouldProcessFile(file)) {
                        skippedFiles.push(file.path);
                        return false;
                    }
                    return this.sortFile(file);
                })
            );
            
            sortedCount += results.filter(Boolean).length;
            skippedCount += results.filter(r => r === false).length;
        }

        this.logger.notice(
            `前置元数据排序完成：\n` +
            `- 已处理：${sortedCount} 个文件\n` +
            `- 已跳过：${skippedCount} 个文件` +
            (skippedFiles.length > 0 ? `\n- 跳过的文件：\n  ${skippedFiles.join('\n  ')}` : '')
        );
    }

    private getIgnoreReason(file: TFile): string {
        const ignoredFolder = this.config.ignoreFolders.find(folder => {
            const normalizedFolder = folder.endsWith('/') ? folder : folder + '/';
            return file.path.startsWith(normalizedFolder);
        });
        if (ignoredFolder) {
            return `在忽略文件夹 "${ignoredFolder}" 中`;
        }

        const ignoredPattern = this.config.ignoreFiles.find(pattern => {
            try {
                return minimatch(file.path, pattern, { matchBase: true });
            } catch (error) {
                return false;
            }
        });
        if (ignoredPattern) {
            return `匹配忽略规则 "${ignoredPattern}"`;
        }

        return '在忽略列表中';
    }

    private async sortFile(file: TFile): Promise<boolean> {
        if (this.processing) return false;

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