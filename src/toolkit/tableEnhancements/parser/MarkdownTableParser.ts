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
    private config: IParserConfig;

    constructor(logger: Logger, config?: IParserConfig) {
        this.logger = logger;
        this.config = {
            preserveFormat: false,
            parseInlineStyles: true,
            parseCaption: false,
            delimiter: '|',
            ...config
        };
    }

    /**
     * 解析文件内容中的所有表格
     */
    public parseTables(content: string, config?: IParserConfig): IMarkdownTable[] {
        try {
            const tables: IMarkdownTable[] = [];
            const lines = content.split('\n');
            const mergedConfig = { ...this.config, ...config };

            for (let i = 0; i < lines.length; i++) {
                if (this.isTableHeader(lines[i], mergedConfig) && 
                    this.isTableAlignment(lines[i + 1], mergedConfig)) {
                    try {
                        const position: ITablePosition = {
                            filePath: '',
                            startLine: i,
                            endLine: i
                        };
                        const table = this.parseTable(
                            lines.slice(i).join('\n'),
                            position
                        );
                        tables.push(table);
                        i = table.position.endLine; // 跳过已解析的表格行
                    } catch (error) {
                        this.logger.error('Parse table error:', error);
                    }
                }
            }

            return tables;
        } catch (error) {
            this.logger.error('Parse tables error:', error);
            return [];
        }
    }

    /**
     * 解析单个表格
     */
    public parseTable(tableContent: string, position: ITablePosition): IMarkdownTable {
        const lines = tableContent.split('\n');
        const headers = this.parseHeaders(lines[0]);
        const alignments = this.parseAlignments(lines[1]);
        const rows: string[][] = [];

        let endLine = position.startLine + 1;
        let referenceId = '';

        // 解析数据行
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 如果是空行，表示表格结束
            if (line === '') {
                endLine = position.startLine + i - 1;
                break;
            }

            // 如果是引用ID行
            if (line.startsWith('^')) {
                referenceId = line.substring(1);
                endLine = position.startLine + i;
                break;
            }

            // 如果不是表格行，表示表格结束
            if (!this.isTableRow(line)) {
                endLine = position.startLine + i - 1;
                break;
            }

            rows.push(this.parseRow(line));
            endLine = position.startLine + i;
        }

        // 创建表格对象
        const table: IMarkdownTable = {
            headers: headers.map((content, index) => ({
                field: `col${index + 1}`,
                content,
                alignment: alignments[index],
            })),
            cells: rows.map(row => {
                return row.map((content, index) => ({
                    content,
                    alignment: alignments[index],
                }));
            }),
            position: {
                ...position,
                endLine,
            },
            referenceId
        };

        // 验证表格
        if (!this.validateTable(table)) {
            this.logger.throwError(new Error('Invalid table structure'));
        }

        return table;
    }

    /**
     * 验证表格格式
     */
    public validateTable(table: IMarkdownTable): boolean {
        try {
            // 验证表格基本结构
            if (!table.headers || !table.cells) {
                return false;
            }

            // 验证表头
            if (table.headers.length === 0) {
                return false;
            }

            // 验证每行的列数是否一致
            const columnCount = table.headers.length;
            return table.cells.every(row => row.length === columnCount);
        } catch (error) {
            this.logger.error('Validate table error:', error);
            return false;
        }
    }

    /**
     * 判断是否为表格头部行
     */
    private isTableHeader(line: string, config: IParserConfig): boolean {
        if (!line) return false;
        const delimiter = config.delimiter || '|';
        const trimmed = line.trim();

        // 必须以分隔符开始和结束
        if (!trimmed.startsWith(delimiter) || !trimmed.endsWith(delimiter)) {
            return false;
        }

        // 分割单元格并移除首尾空单元格
        const cells = trimmed
            .split(delimiter)
            .slice(1, -1)
            .map(cell => cell.trim());

        // 至少要有一个单元格，且不能全是分隔符
        return cells.length > 0 && !cells.every(cell => cell === '');
    }

    /**
     * 判断是否为表格对齐行
     */
    private isTableAlignment(line: string, config: IParserConfig): boolean {
        if (!line) return false;
        const delimiter = config.delimiter || '|';
        const trimmed = line.trim();
        
        if (!trimmed.startsWith(delimiter) || !trimmed.endsWith(delimiter)) {
            return false;
        }
        
        const alignments = trimmed
            .split(delimiter)
            .map(cell => cell.trim())
            .filter(cell => cell !== '');

        return alignments.every(cell => /^:?-+:?$/.test(cell));
    }

    /**
     * 判断是否为表格数据行
     */
    private isTableRow(line: string): boolean {
        const trimmed = line.trim();
        return trimmed.startsWith('|') && trimmed.endsWith('|');
    }

    /**
     * 解析表格头部
     */
    private parseHeaders(line: string): string[] {
        const delimiter = this.config.delimiter || '|';
        return line
            .split(delimiter)
            .slice(1, -1)  // 移除首尾空单元格
            .map(cell => cell.trim());
    }

    /**
     * 解析对齐方式
     */
    private parseAlignments(line: string): TableCellAlignment[] {
        return line
            .split(this.config.delimiter || '|')
            .map(cell => cell.trim())
            .filter(cell => cell !== '')
            .map(cell => {
                if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
                if (cell.endsWith(':')) return 'right';
                return 'left';
            });
    }

    /**
     * 解析数据行
     */
    private parseRow(line: string): string[] {
        const delimiter = this.config.delimiter || '|';
        return line
            .split(delimiter)
            .slice(1, -1)  // 移除首尾空单元格
            .map(cell => cell.trim());
    }
}