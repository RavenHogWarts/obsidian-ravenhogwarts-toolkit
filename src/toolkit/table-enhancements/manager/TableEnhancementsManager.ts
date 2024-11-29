import { App, MarkdownView, Plugin, TFile } from 'obsidian';
import { BaseManager } from '@/src/manager/BaseManager';
import { MarkdownTableParser } from '../parser/MarkdownTableParser';
import { TableGenerator } from '../parser/TableGenerator';
import { IMarkdownTable } from '../types/table';
import { IToolkitModule } from '@/src/manager/types';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { BaseModal } from '@/src/ui/components/base/BaseModal';

interface ITableEnhancementsConfig {
    enabled: boolean;
}

interface ITableEnhancementsData {
    lastModified: string;
}

interface ITableEnhancementsModule extends IToolkitModule {
    config: ITableEnhancementsConfig;
    data: ITableEnhancementsData;
}

export class TableEnhancementsManager extends BaseManager<ITableEnhancementsModule> {
    private parser: MarkdownTableParser;
    private generator: TableGenerator;

    constructor(
        plugin: RavenHogwartsToolkitPlugin,
        moduleId: string,
        settings: any
    ) {
        super(plugin, moduleId, settings);
        this.parser = new MarkdownTableParser(this.logger);
        this.generator = new TableGenerator(this.logger);
    }

    async onload(): Promise<void> {
        this.logger.debug('Loading table enhancements manager');
        this.parseCurrentTables();
    }

    onunload(): void {
        this.logger.debug('Unloading table enhancements manager');
    }

    /**
     * 解析当前文件中的表格
     */
    private async parseCurrentTables(): Promise<void> {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView || !activeView.file) {
            this.logger.warn('No active markdown view found');
            return Promise.resolve(); // or handle the case gracefully
        }

        const currentFile = activeView.file;

        try {
            const content = await this.app.vault.read(currentFile);
            const tables = this.parser.parseTables(content);

            // 设置文件路径
            tables.forEach(table => {
                table.position.filePath = currentFile.path;
            });

            // 如果找到表格，显示第一个表格的编辑器
            if (tables.length > 0) {
                this.logger.debug('Tables found in current file', tables);
                this.showTableEditor(tables);
            } else {
                // 可以添加一个通知
                this.logger.info('No tables found in current file');
            }

        } catch (error) {
            this.logger.error('Error parsing tables:', error);
        }
    }

    /**
     * 显示表格编辑器
     */
    private showTableEditor(tables: IMarkdownTable[]): void {
        const modal = new BaseModal(
            this.app,
            this.plugin,
            () => import('../ui/TableModal'),
            {
                tables: tables,
            }
        );
        modal.open();
    }
}