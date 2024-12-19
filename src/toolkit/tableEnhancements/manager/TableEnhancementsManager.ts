import { Editor, MarkdownView, Menu } from 'obsidian';
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
import { ISavedCalculation, OutputType } from '../types/operations';

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

        // 初始化服务和工具
        this.parser = new MarkdownTableParser(this.logger);
        this.generator = new TableGenerator(this.logger);
        this.calculationService = new TableCalculationService(this.logger);
        this.uuidGenerator = new UUIDGenerator({
            prefix: 'table',
            length: 12,
        });
    }

    protected async onModuleLoad(): Promise<void> {
        this.logger.info('Loading table enhancements manager');
        await this.loadSavedCalculations();
    }

    protected registerContextMenuItems(): void {
        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor) => {
                if (this.isEnabled()) {
                    this.addMenuItem(menu, {
                        title: this.t('toolkit.tableEnhancements.context_menu'),
                        icon: 'tablets',
                        showSeparator: true,
                        callback: () => {
                            this.showTableEditor();
                        }
                    });
                }
            })
        )
    }

    protected onModuleUnload(): void {
        super.onModuleUnload();
        // 清理模态框
        if (this.modal) {
            this.modal.close();
            this.modal = null;
        }
        // 清理其他资源
        this.tables = [];
        this.savedCalculations.clear();
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
                this.logger.debug('Loaded saved calculations:', this.savedCalculations.size);
            }
        } catch (error) {
            this.logger.error('Error loading saved calculations:', error);
            throw error;
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
            const result = this.calculationService.calculate(table, calculation.config);

            // 更新计算结果
            const calculations = this.getSavedCalculations(table.referenceId);
            const index = calculations.findIndex(c => 
                c.config.formula === calculation.config.formula && 
                c.config.output.type === calculation.config.output.type &&
                c.config.output.value === calculation.config.output.value
            );

            if (index !== -1) {
                await this.updateCalculation(table.referenceId, index, {
                    config: {
                        ...calculation.config,
                        result: result
                    }
                });
            }

            // 如果配置了frontmatter键，保存到frontmatter
            if (calculation.config.output.type === OutputType.FRONTMATTER) {
                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (!view?.file) {
                    throw new Error('No active markdown view');
                }

                const file = view.file;
                updateFrontMatter(file, (frontmatter) => {
                    frontmatter[calculation.config.output.value] = result;
                });

                this.logger.debug(`Updated frontmatter: ${calculation.config.output.value} = ${result}`);
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

            // 解析表格,更新表格数据
            this.tables = this.parser.parseTables(content).map(table => ({
                ...table,
                position: {
                    ...table.position,
                    filePath
                }
            }));

            this.logger.debug(`Parsed ${this.tables.length} tables from current file`);
        } catch (error) {
            this.logger.error('Error parsing current tables:', error);
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
    public async saveTables(updatedTables: IMarkdownTable[]): Promise<void> {
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
            const processedTables: IMarkdownTable[] = [];

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

                // 检查表格是否需要生成引用ID
                let needsId = false;

                // 1. 检查单元格值是否被修改
                const cellsModified = JSON.stringify(originalTable.cells) !== JSON.stringify(table.cells);
                if (cellsModified) {
                    needsId = true;
                    this.logger.debug('Table cells modified');
                }

                // 2. 检查是否有数学操作
                const hasCalculations = this.savedCalculations.has(table.referenceId || '') || 
                                     this.savedCalculations.has(originalTable.referenceId || '');
                if (hasCalculations) {
                    needsId = true;
                    this.logger.debug('Table has calculations');
                }
                
                // 如果表格被修改且没有ID，则生成新ID
                if (needsId && !table.referenceId) {
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

    public async saveCalculatedTable(table: IMarkdownTable): Promise<string | undefined> {
        try {
            // 生成新的引用ID
            const referenceId = this.uuidGenerator.generate();
            
            // 创建带有引用ID的新表格
            const tableWithId = {
                ...table,
                referenceId
            };

            // 找到对应的原始表格
            const originalTableIndex = this.tables.findIndex(t => 
                t.position && table.position &&
                t.position.startLine === table.position.startLine &&
                t.position.endLine === table.position.endLine
            );

            if (originalTableIndex === -1) {
                throw new Error('Original table not found');
            }
            
            // 创建更新表格数组，保持其他表格不变
            const updatedTables = [...this.tables];
            updatedTables[originalTableIndex] = tableWithId;

            // 保存表格到文档
            await this.saveTables(updatedTables);
            
            // 返回引用ID
            return referenceId;
        } catch (error) {
            this.logger.error('Save calculated table error:', error);
            throw error;
        }
    }
}