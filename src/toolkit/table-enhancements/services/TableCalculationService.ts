import { getCurrentTime } from '@/src/util/date';
import { CalculationType, ICalculationConfig, ICalculationResult } from '../types/operations';
import { IMarkdownTable, ITableCell } from '../types/table';
import { Logger } from '@/src/util/log';

export class TableCalculationService {
    constructor(private logger: Logger) {}

    /**
     * 处理小数位数
     * @param value 需要处理的数值
     * @param decimals 保留的小数位数，默认为2
     */
    private formatNumber(value: number, decimals = 2): number {
        return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
    }

    /**
     * 执行计算操作
     */
    public calculate(table: IMarkdownTable, config: ICalculationConfig): ICalculationResult {
        const { type, targetColumns } = config;
        const columnIndex = table.headers.findIndex(h => h.field === targetColumns[0]);
        if (columnIndex === -1) {
            throw new Error(`Column ${targetColumns[0]} not found`);
        }

        // 获取目标列的数值
        const values = table.cells.map(row => {
            const content = row[columnIndex].content;
            const num = parseFloat(content);
            return isNaN(num) ? null : num;
        }).filter(v => v !== null) as number[];

        let result: number;
        let formula: string;

        switch (type) {
            case CalculationType.SUM:
                result = this.sum(values);
                formula = `SUM(${targetColumns[0]})`;
                break;

            case CalculationType.AVERAGE:
                result = this.average(values);
                formula = `AVERAGE(${targetColumns[0]})`;
                break;

            case CalculationType.COUNT_ALL:
                result = table.cells.length;
                formula = `COUNT_ALL(${targetColumns[0]})`;
                break;

            case CalculationType.COUNT_VALUES:
                result = table.cells.filter(row => row[columnIndex].content.trim() !== '').length;
                formula = `COUNT_VALUES(${targetColumns[0]})`;
                break;

            case CalculationType.COUNT_EMPTY:
                result = table.cells.filter(row => row[columnIndex].content.trim() === '').length;
                formula = `COUNT_EMPTY(${targetColumns[0]})`;
                break;

            case CalculationType.COUNT_UNIQUE:
                result = new Set(table.cells.map(row => row[columnIndex].content.trim()).filter(content => content !== '')).size;
                formula = `COUNT_UNIQUE(${targetColumns[0]})`;
                break;

            case CalculationType.MIN:
                result = Math.min(...values);
                formula = `MIN(${targetColumns[0]})`;
                break;

            case CalculationType.MAX:
                result = Math.max(...values);
                formula = `MAX(${targetColumns[0]})`;
                break;

            case CalculationType.MEDIAN:
                result = this.median(values);
                formula = `MEDIAN(${targetColumns[0]})`;
                break;

            case CalculationType.MODE:
                result = this.mode(values);
                formula = `MODE(${targetColumns[0]})`;
                break;

            case CalculationType.STDDEV:
                result = this.standardDeviation(values);
                formula = `STDDEV(${targetColumns[0]})`;
                break;

            case CalculationType.VARIANCE:
                result = this.variance(values);
                formula = `VARIANCE(${targetColumns[0]})`;
                break;

            case CalculationType.PERCENTAGE:
                result = this.percentage(values);
                formula = `PERCENTAGE(${targetColumns[0]})`;
                break;

            default:
                throw new Error(`Unsupported calculation type: ${type}`);
        }

        return {
            value: this.formatNumber(result),
            formula: formula,
            type: type,
            targetColumns: targetColumns
        };
    }

    /**
     * 计算总和
     */
    private sum(values: number[]): number {
        return this.formatNumber(values.reduce((acc, val) => acc + val, 0));
    }

    /**
     * 计算平均值
     */
    private average(values: number[]): number {
        return this.formatNumber(this.sum(values) / values.length);
    }

    /**
     * 计算中位数
     */
    private median(values: number[]): number {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return this.formatNumber(
            sorted.length % 2 === 0
                ? (sorted[mid - 1] + sorted[mid]) / 2
                : sorted[mid]
        );
    }

    /**
     * 计算众数
     */
    private mode(values: number[]): number {
        const counts = new Map<number, number>();
        let maxCount = 0;
        let mode = values[0];

        for (const value of values) {
            const count = (counts.get(value) || 0) + 1;
            counts.set(value, count);
            if (count > maxCount) {
                maxCount = count;
                mode = value;
            }
        }

        return this.formatNumber(mode);
    }

    /**
     * 计算方差
     */
    private variance(values: number[]): number {
        const avg = this.average(values);
        const squareDiffs = values.map(value => Math.pow(value - avg, 2));
        return this.formatNumber(this.average(squareDiffs));
    }

    /**
     * 计算标准差
     */
    private standardDeviation(values: number[]): number {
        return this.formatNumber(Math.sqrt(this.variance(values)));
    }

    /**
     * 计算百分比（相对于总和）
     */
    private percentage(values: number[]): number {
        const total = this.sum(values);
        return this.formatNumber((total / values.length / total) * 100);
    }
}