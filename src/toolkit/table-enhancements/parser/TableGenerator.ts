import { IMarkdownTable, ITableCell, ITableHeader } from '../types/table';
import { Logger } from '@/src/util/log';

export class TableGenerator {
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    public generateMarkdown(table: IMarkdownTable): string {
        try {
            const lines: string[] = [];

            // 生成表头
            lines.push(this.generateHeaderLine(table.headers));
            lines.push(this.generateAlignmentLine(table.headers));

            // 生成数据行
            table.cells.forEach(row => {
                lines.push(this.generateDataLine(row));
            });

            return lines.join('\n');
        } catch (error) {
            this.logger.error('Failed to generate markdown table:', error);
            throw error;
        }
    }

    private generateHeaderLine(headers: ITableHeader[]): string {
        return `| ${headers.map(h => h.content).join(' | ')} |`;
    }

    private generateAlignmentLine(headers: ITableHeader[]): string {
        return `| ${headers.map(h => this.getAlignmentMarker(h.alignment)).join(' | ')} |`;
    }

    private generateDataLine(cells: ITableCell[]): string {
        return `| ${cells.map(cell => cell.content).join(' | ')} |`;
    }

    private getAlignmentMarker(alignment?: string): string {
        switch (alignment) {
            case 'center': return ':---:';
            case 'right': return '---:';
            default: return '---';
        }
    }
}