import { MarkdownView } from 'obsidian';
import { BaseManager } from '@/src/manager/BaseManager';
import { MarkdownTableParser } from '../parser/MarkdownTableParser';
import { TableGenerator } from '../parser/TableGenerator';
import { IMarkdownTable } from '../types/table';
import { IToolkitModule } from '@/src/manager/types';
import RavenHogwartsToolkitPlugin from '@/src/main';
import { BaseModal } from '@/src/ui/components/base/BaseModal';
import { TableCalculationService } from '../services/TableCalculationService';
import { ITableEnhancementsConfig, ITableEnhancementsData } from '../types/config';
import { getStandardTime } from '@/src/util/date';
import { UUIDGenerator } from '@/src/util/uuid';
import { updateFrontMatter } from '@/src/util/frontMatter';
import { ISavedCalculation } from '../types/operations';

interface ITableEnhancementsModule extends IToolkitModule {
    config: ITableEnhancementsConfig;
    data: ITableEnhancementsData;
}

export class TableEnhancementsManager extends BaseManager<ITableEnhancementsModule> {
    private parser: MarkdownTableParser;
    private generator: TableGenerator;
    private tables: IMarkdownTable[] = [];
    private uuidGenerator: UUIDGenerator;
    private modal: BaseModal | null = null;
    private calculationService: TableCalculationService;
    private savedCalculations: Map<string, ISavedCalculation[]> = new Map();

    constructor(
        plugin: RavenHogwartsToolkitPlugin,
        moduleId: string,
        settings: any
    ) {
        super(plugin, moduleId, settings);
        this.parser = new MarkdownTableParser(this.logger);
        this.generator = new TableGenerator(this.logger);
        this.calculationService = new TableCalculationService(this.logger);
        this.uuidGenerator = new UUIDGenerator({
            prefix: 'table',
            length: 12,
        });
        this.loadSavedCalculations();
    }

    async onload(): Promise<void> {
        this.logger.debug('Loading table enhancements manager');
        this.showTableEditor();
    }

    onunload(): void {
        this.logger.debug('Unloading table enhancements manager');
    }

    /**
     * 加载保存的计算配置
     */
    private async loadSavedCalculations(): Promise<void> {
        try {
            const data = await this.getData();
            if (data?.savedCalculations) {
                Object.entries(data.savedCalculations).forEach(([tableId, calculations]) => {
                    this.savedCalculations.set(tableId, calculations);
                });
            }
        } catch (error) {
            this.logger.error('Error loading saved calculations:', error);
        }
    }

    /**
     * 保存计算配置
     */
    private async saveCalculations(): Promise<void> {
        try {
            const savedCalculations: { [key: string]: ISavedCalculation[] } = {};
            this.savedCalculations.forEach((calculations, tableId) => {
                savedCalculations[tableId] = calculations;
            });

            await this.updateData({ savedCalculations });
        } catch (error) {
            this.logger.error('Error saving calculations:', error);
        }
    }

    /**
     * 获取表格的保存的计算配置
     */
    public getSavedCalculations(tableId: string | undefined): ISavedCalculation[] {
        if (!tableId) return [];
        return this.savedCalculations.get(tableId) || [];
    }

    /**
     * 添加计算配置
     */
    public async addCalculation(tableId: string | undefined, calculation: ISavedCalculation): Promise<void> {
        if (!tableId) {
            throw new Error('Table ID is required');
        }

        const calculations = this.getSavedCalculations(tableId);
        calculations.push({
            ...calculation,
            createdAt: getStandardTime(),
            updatedAt: getStandardTime()
        });
        this.savedCalculations.set(tableId, calculations);
        await this.saveCalculations();
    }

    /**
     * 删除计算配置
     */
    public async deleteCalculation(tableId: string | undefined, index: number): Promise<void> {
        if (!tableId) return;
        
        const calculations = this.getSavedCalculations(tableId);
        calculations.splice(index, 1);
        this.savedCalculations.set(tableId, calculations);
        await this.saveCalculations();
    }

    /**
     * 更新计算配置
     */
    public async updateCalculation(tableId: string | undefined, index: number, calculation: Partial<ISavedCalculation>): Promise<void> {
        if (!tableId) return;
        
        const calculations = this.getSavedCalculations(tableId);
        if (index >= 0 && index < calculations.length) {
            calculations[index] = {
                ...calculations[index],
                ...calculation,
                updatedAt: getStandardTime()
            };
            this.savedCalculations.set(tableId, calculations);
            await this.saveCalculations();
        }
    }

    /**
     * 执行计算并保存到frontmatter
     */
    public async executeCalculation(table: IMarkdownTable, calculation: ISavedCalculation): Promise<void> {
        try {
            const result = this.calculationService.calculate(table, calculation);

            // 更新计算结果
            const calculations = this.getSavedCalculations(table.referenceId);
            const index = calculations.findIndex(c => 
                c.type === calculation.type && 
                c.targetColumns[0] === calculation.targetColumns[0]
            );

            if (index !== -1) {
                await this.updateCalculation(table.referenceId, index, {
                    lastResult: result
                });
            }

            // 如果配置了frontmatter键，保存到frontmatter
            if (calculation.frontmatterKey) {
                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!view?.file) {
                    throw new Error('No active markdown view');
                }

                const file = view.file;
                const metadata = this.app.metadataCache.getFileCache(file);
                const frontmatter = metadata?.frontmatter;


                updateFrontMatter(file, (frontmatter) => {
                    frontmatter[calculation.frontmatterKey!] = result.value;
                });

                this.logger.debug(`Updated frontmatter: ${calculation.frontmatterKey} = ${result.value}`);
            }

        } catch (error) {
            this.logger.error('Error executing calculation:', error);
            throw error;
        }
    }

    /**
     * 解析当前文件中的表格
     */
    private async parseCurrentTables(): Promise<void> {
        try {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (!activeView?.file) {
                throw new Error('No active markdown view found');
            }

            // 读取当前文件内容
            const content = await this.app.vault.read(activeView.file);
            const filePath = activeView.file.path;

            // 解析表格
            const tables = this.parser.parseTables(content).map(table => ({
                ...table,
                position: {
                    ...table.position,
                    filePath
                }
            }));

            // 更新表格数据
            this.tables = tables;

            if (!this.tables.length) {
                this.logger.error('No tables found in current file');
            } else {
                this.logger.debug('Found tables:', this.tables);
            }

        } catch (error) {
            this.logger.error('Parse current tables error:', error);
            throw error;
        }
    }

    /**
     * 显示表格编辑器
     */
    private async showTableEditor(): Promise<void> {
        try {
            // 解析当前表格
            await this.parseCurrentTables();

            // 如果没有找到表格，提示用户
            if (!this.tables || this.tables.length === 0) {
                this.logger.info('No tables found in current file');
                return;
            }

            // 如果已有modal，先关闭
            if (this.modal) {
                this.modal.close();
                this.modal = null;
            }

            // 创建新的modal
            this.modal = new BaseModal(
                this.app,
                this.plugin,
                () => import('../ui/TableModal'),
                {
                    logger: this.logger,
                    tables: this.tables,
                    manager: this,
                    onSave: async (updatedTables: IMarkdownTable[]) => {
                        try {
                            await this.saveTables(updatedTables);
                            this.modal?.close();
                            this.modal = null;
                        } catch (error) {
                            this.logger.error('Error saving tables:', error);
                            throw error;
                        }
                    }
                }
            );

            // 打开modal
            this.modal.open();

        } catch (error) {
            this.logger.error('Error showing table editor:', error);
            
            // 确保在发生错误时清理modal
            if (this.modal) {
                this.modal.close();
                this.modal = null;
            }
        }
    }

    /**
     * 保存表格数据
     */
    private async saveTables(updatedTables: IMarkdownTable[]): Promise<void> {
        try {
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (!activeView?.file) {
                throw new Error('No active markdown view found');
            }

            // 读取当前文件内容
            const currentContent = await this.app.vault.read(activeView.file);
            const lines = currentContent.split('\n');

            // 更新每个表格
            let offset = 0; // 用于追踪由于插入空行导致的行号偏移
            for (let i = 0; i < updatedTables.length; i++) {
                const table = updatedTables[i];
                const originalTable = this.tables[i];

                if (!originalTable || !originalTable.position) {
                    this.logger.error('Original table or position not found', { table, originalTable });
                    continue;
                }

                // 使用原始表格的位置信息
                const startLine = originalTable.position.startLine + offset;
                const endLine = originalTable.position.endLine + offset;

                // 检查表格是否被修改
                const isModified = JSON.stringify(originalTable.cells) !== JSON.stringify(table.cells);
                
                // 如果表格被修改且没有ID，则生成新ID
                if (isModified && !table.referenceId) {
                    table.referenceId = this.uuidGenerator.generate();
                    this.logger.debug('Generated new ID for table:', table.referenceId);
                }

                // 生成新的表格文本
                const tableText = this.generator.generateTableText({
                    ...table,
                    position: {
                        ...originalTable.position,
                        startLine,
                        endLine
                    }
                });
                const tableLines = tableText.split('\n');

                // 替换原有表格内容
                lines.splice(startLine, endLine - startLine + 1, ...tableLines);

                // 确保表格后至少有一个空行
                if (i < updatedTables.length - 1) {
                    const currentEnd = startLine + tableLines.length;
                    let nextContentStart = currentEnd;
                    
                    // 找到下一个非空行的位置
                    while (nextContentStart < lines.length && lines[nextContentStart].trim() === '') {
                        nextContentStart++;
                    }

                    // 如果下一个内容存在
                    if (nextContentStart < lines.length) {
                        // 删除所有现有的空行
                        lines.splice(currentEnd, nextContentStart - currentEnd);
                        // 添加一个空行
                        lines.splice(currentEnd, 0, '');
                        offset += 1 - (nextContentStart - currentEnd);
                    }
                }

                // 更新后续表格的偏移量
                offset += tableLines.length - (endLine - startLine + 1);
            }

            // 保存更新后的文件内容
            await this.app.vault.modify(activeView.file, lines.join('\n'));
            
            // 重新解析表格
            await this.parseCurrentTables();
            
            
            // // 关闭modal
            // if (this.modal) {
            //     this.modal.close();
            //     this.modal = null;
            // }

            // this.showTableEditor();

            this.logger.debug('Tables saved successfully');
        } catch (error) {
            this.logger.error('Save tables error:', error);
            throw error;
        }
    }
}