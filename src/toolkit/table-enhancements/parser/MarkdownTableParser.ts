import { UUIDGenerator } from '@/src/util/uuid';
import { 
    IMarkdownTable, 
    ITableCell, 
    ITableHeader,
    ITablePosition,
    TableCellAlignment 
} from '../types/table';
import { IParserConfig, ITableParser } from './interfaces';
import { Logger } from '@/src/util/log';

export class MarkdownTableParser implements ITableParser {
    private logger: Logger;
    private uuidGenerator: UUIDGenerator;

    constructor(logger: Logger) {
        this.logger = logger;
        this.uuidGenerator = new UUIDGenerator({
            prefix: 'table',
            length: 12,
        });
    }

    public parseTables(content: string, config?: IParserConfig): IMarkdownTable[] {
        try {
            const tables: IMarkdownTable[] = [];
            const lines = content.split('\n');
            let currentTable: string[] = [];
            let startLine = 0;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (this.isTableLine(line)) {
                    if (currentTable.length === 0) {
                        startLine = i;
                    }
                    currentTable.push(line);
                } else if (currentTable.length > 0) {
                    // 找到一个完整的表格
                    const position: ITablePosition = {
                        filePath: '',  // 需要从上下文获取
                        startLine,
                        endLine: i - 1,
                        selection: undefined
                    };
                    const table = this.parseTable(currentTable.join('\n'), position);
                    if (table) {
                        tables.push(table);
                    }
                    currentTable = [];
                }
            }

            // 处理文件末尾的表格
            if (currentTable.length > 0) {
                const position: ITablePosition = {
                    filePath: '',
                    startLine,
                    endLine: lines.length - 1,
                    selection: undefined
                };
                const table = this.parseTable(currentTable.join('\n'), position);
                if (table) {
                    tables.push(table);
                }
            }

            return tables;
        } catch (error) {
            this.logger.error('Failed to parse tables:', error);
            return [];
        }
    }

    public parseTable(tableContent: string, position: ITablePosition): IMarkdownTable {
        try {
            const lines = tableContent.split('\n');
            if (lines.length < 3) {
                throw new Error('Invalid table format: insufficient lines');
            }

            // 解析表头
            const headers = this.parseHeaders(lines[0], lines[1]);
            
            // 解析数据行
            const cells = lines.slice(2).map(line => this.parseCells(line));

            return {
                headers,
                cells,
                position,
                referenceId: this.uuidGenerator.generate(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error('Failed to parse table:', error);
            throw error;
        }
    }

    public validateTable(table: IMarkdownTable): boolean {
        try {
            // 验证表头
            if (!table.headers || table.headers.length === 0) {
                return false;
            }

            // 验证单元格
            const columnCount = table.headers.length;
            return table.cells.every(row => row.length === columnCount);
        } catch (error) {
            this.logger.error('Failed to validate table:', error);
            return false;
        }
    }

    private isTableLine(line: string): boolean {
        return line.trim().startsWith('|') && line.trim().endsWith('|');
    }

    private parseHeaders(headerLine: string, alignmentLine: string): ITableHeader[] {
        const headerCells = this.splitTableLine(headerLine);
        const alignments = this.parseAlignments(alignmentLine);

        return headerCells.map((content, index) => ({
            content: content.trim(),
            field: `col${index}`,
            headerName: content.trim(),
            alignment: alignments[index],
            sortable: true,
            filterable: true,
            resizable: true,
            visible: true
        }));
    }

    private parseAlignments(alignmentLine: string): TableCellAlignment[] {
        return this.splitTableLine(alignmentLine).map(align => {
            align = align.trim();
            if (align.startsWith(':') && align.endsWith(':')) return 'center';
            if (align.endsWith(':')) return 'right';
            return 'left';
        });
    }

    private parseCells(line: string): ITableCell[] {
        return this.splitTableLine(line).map(content => ({
            content: content.trim(),
            type: this.inferType(content.trim())
        }));
    }

    private splitTableLine(line: string): string[] {
        return line
            .trim()
            .slice(1, -1)  // 移除首尾的 |
            .split('|');
    }

    private inferType(value: string): 'string' | 'number' | 'boolean' | 'date' {
        if (!isNaN(Number(value))) return 'number';
        if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') return 'boolean';
        if (!isNaN(Date.parse(value))) return 'date';
        return 'string';
    }
}