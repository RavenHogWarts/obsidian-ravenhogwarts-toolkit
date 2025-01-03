import { Logger } from "@/src/core/services/Log";
import { ColDef, ColumnApi, GridApi } from "ag-grid-community";
import { IMarkdownTable, ITableCell, ITableHeader, ITablePosition, TableCellAlignment } from "../types/table";
import { IParserConfig } from "../types/parser";

export class TableGenerator {
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
     * 从AG Grid生成Markdown表格
     */
    public generateFromAgGrid(
        gridApi: GridApi,
        columnApi: ColumnApi,
        position: ITablePosition,
        referenceId?: string
    ): IMarkdownTable {
        try {
            // 获取列定义和数据
            const columns = columnApi.getAllDisplayedColumns();
            const colDefs = columns.map(col => col.getColDef());
            
            // 生成表头
            const headers = this.generateHeaders(colDefs);

            // 获取数据行
            const cells: ITableCell[][] = [];
            gridApi.forEachNode(node => {
                if (node.data) {
                    cells.push(this.generateCells(node.data, colDefs));
                }
            });

            // 构建表格对象
            const table: IMarkdownTable = {
                headers,
                cells,
                position,
                referenceId
            };

            // 验证表格
            if (!this.validateTable(table)) {
                this.logger.throwError(new Error('Invalid table structure'));
            }

            return table;
        } catch (error) {
            this.logger.throwError(new Error('Generate from AG Grid error'), error);
        }
    }

    /**
     * 生成表格文本
     */
    public generateTableText(table: IMarkdownTable): string {
        try {
            const headerRow = this.generateHeaderRow(table.headers);
            const alignmentRow = this.generateAlignmentRow(table.headers);
            const dataRows = table.cells.map(row => this.generateDataRow(row));
            
            const lines = [
                headerRow,
                alignmentRow,
                ...dataRows
            ];

            if(table.referenceId) {
                lines.push(`^${table.referenceId}`);
            }

            return lines.join('\n');
        } catch (error) {
            this.logger.throwError(new Error('Generate table text error'), error);
        }
    }

    /**
     * 生成表头
     */
    private generateHeaders(colDefs: ColDef[]): ITableHeader[] {
        return colDefs.map(col => ({
            field: col.field || '',
            content: (col.headerName || col.field || '').trim(),
            alignment: this.getColumnAlignment(col)
        }));
    }

    /**
     * 生成单元格数据
     */
    private generateCells(rowData: any, colDefs: ColDef[]): ITableCell[] {
        return colDefs.map(col => ({
            content: this.formatCellValue(rowData[col.field || ''], col),
            alignment: this.getColumnAlignment(col)
        }));
    }

    /**
     * 生成表头行
     */
    private generateHeaderRow(headers: ITableHeader[]): string {
        const delimiter = this.config.delimiter || '|';
        const cells = headers.map(header => ` ${header.content} `);
        return `${delimiter}${cells.join(delimiter)}${delimiter}`;
    }

    /**
     * 生成对齐行
     */
    private generateAlignmentRow(headers: ITableHeader[]): string {
        const delimiter = this.config.delimiter || '|';
        const alignments = headers.map(header => {
            const minLength = 3;
            const contentLength = header.content.length;
            const length = Math.max(minLength, contentLength);

            switch (header.alignment) {
                case 'center':
                    return `:${'-'.repeat(length - 2)}:`;
                case 'right':
                    return `${'-'.repeat(length - 1)}:`;
                default: // 'left'
                    return `${'-'.repeat(length)}`;
            }
        });

        return `${delimiter} ${alignments.join(` ${delimiter} `)} ${delimiter}`;
    }

    /**
     * 生成数据行
     */
    private generateDataRow(cells: ITableCell[]): string {
        const delimiter = this.config.delimiter || '|';
        const cellContents = cells.map(cell => ` ${cell.content} `);
        return `${delimiter}${cellContents.join(delimiter)}${delimiter}`;
    }

    /**
     * 获取列对齐方式
     */
    private getColumnAlignment(colDef: ColDef): TableCellAlignment {
        if (!colDef.type) return 'left';

        const type = Array.isArray(colDef.type) ? colDef.type[0] : colDef.type;
        
        if (!type) return 'left';

        switch (type.toLowerCase()) {
            case 'numericcolumn':
            case 'number':
                return 'right';
            case 'centeraligned':
                return 'center';
            default:
                return 'left';
        }
    }

    /**
     * 格式化单元格值
     */
    private formatCellValue(value: any, colDef: ColDef): string {
        if (value === null || value === undefined) {
            return '';
        }

        // 默认格式化
        if (typeof value === 'number') {
            return value.toString();
        }

        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        return value.toString();
    }

    /**
     * 验证表格结构
     */
    private validateTable(table: IMarkdownTable): boolean {
        try {
            if (!table.headers || !table.cells) {
                return false;
            }

            if (table.headers.length === 0) {
                return false;
            }

            const columnCount = table.headers.length;
            return table.cells.every(row => row.length === columnCount);
        } catch (error) {
            this.logger.error('Validate table error:', error);
            return false;
        }
    }
}