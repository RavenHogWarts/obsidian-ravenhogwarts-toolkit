import { FormulaFunction, IFormulaConfig } from '../types/operations';
import { IMarkdownTable } from '../types/table';
import { Logger } from '@/src/core/services/Log';
import { compareAsc, compareDesc, differenceInDays, differenceInHours, differenceInMinutes, format, isValid, parse } from 'date-fns';
import { getStandardTime } from '@/src/lib/date';
import { FormulaParser } from '../parser/parseFormula';

type CalculationStrategy = (table: IMarkdownTable, columns: string[], modifier?: string) => number | string;

export class TableCalculationService {
    private strategies: Record<FormulaFunction, CalculationStrategy>;

    constructor(private logger: Logger) {
        this.initializeStrategies();
    }

    private initializeStrategies() {
        this.strategies = {
            // 计数统计
            [FormulaFunction.COUNT]: (table, columns, modifier) => {
                const values = this.getColumnValues(table, columns);
                switch (modifier) {
                    case 'values':
                        return values.filter(v => v.trim() !== '').length;
                    case 'empty':
                        return values.filter(v => v.trim() === '').length;
                    case 'unique':
                        return new Set(values.filter(v => v.trim() !== '')).size;
                    default:
                        return values.length;
                }
            },

            // 数学计算
            [FormulaFunction.SUM]: (table, columns) => {
                const numbers = this.getNumericValues(table, columns);
                return this.sum(numbers);
            },
            [FormulaFunction.AVERAGE]: (table, columns) => {
                const numbers = this.getNumericValues(table, columns);
                return this.average(numbers);
            },
            [FormulaFunction.MIN]: (table, columns) => {
                const numbers = this.getNumericValues(table, columns);
                return Math.min(...numbers);
            },
            [FormulaFunction.MAX]: (table, columns) => {
                const numbers = this.getNumericValues(table, columns);
                return Math.max(...numbers);
            },
            [FormulaFunction.MEDIAN]: (table, columns) => {
                const numbers = this.getNumericValues(table, columns);
                return this.median(numbers);
            },
            [FormulaFunction.MODE]: (table, columns) => {
                const numbers = this.getNumericValues(table, columns);
                return this.mode(numbers);
            },
            [FormulaFunction.STDDEV]: (table, columns) => {
                const numbers = this.getNumericValues(table, columns);
                return this.standardDeviation(numbers);
            },
            [FormulaFunction.VARIANCE]: (table, columns) => {
                const numbers = this.getNumericValues(table, columns);
                return this.variance(numbers);
            },

            // 时间计算
            [FormulaFunction.TIME_EARLIEST]: (table, columns, modifier) => {
                const dates = this.getDateValues(table, columns, modifier);
                if (dates.length === 0) return '';
                const earliest = this.earliest(dates);
                if (!earliest) return '';
                return modifier ? format(earliest, modifier) : format(earliest, "yyyy-MM-dd");
            },
            [FormulaFunction.TIME_LATEST]: (table, columns, modifier) => {
                const dates = this.getDateValues(table, columns, modifier);
                if (dates.length === 0) return '';
                const latest = this.latest(dates);
                if (!latest) return '';
                return modifier ? format(latest, modifier) : format(latest, "yyyy-MM-dd");
            },
            [FormulaFunction.TIME_SPAN]: (table, columns, modifier) => {
                let format: string | undefined;
                let unit = 'days';

                if (modifier) {
                    const parts = modifier.split(':');
                    if (parts.length === 2) {
                        // 'yyyy-MM-dd:days' 格式
                        [format, unit] = parts;
                    } else if (parts.length === 1) {
                        // 可能是 'yyyy-MM-dd' 或 'days'
                        const part = parts[0];
                        if (['days', 'hours', 'minutes'].includes(part)) {
                            unit = part;
                        } else {
                            format = part;
                        }
                    }
                }
                
                const dates = this.getDateValues(table, columns, format);
                if (dates.length === 0) return 0;
                
                const earliest = this.earliest(dates);
                const latest = this.latest(dates);

                if (!earliest || !latest) return 0;
                
                switch (unit) {
                    case 'minutes':
                        return differenceInMinutes(latest, earliest);
                    case 'hours':
                        return differenceInHours(latest, earliest);
                    case 'days':
                    default:
                        return differenceInDays(latest, earliest);
                }
            },
        };
    }
    
    /** 执行计算 */
    public calculate(table: IMarkdownTable, config: IFormulaConfig): IFormulaConfig["result"] {
        try {
            const parsed = FormulaParser.parse(config.formula);
            const strategy = this.strategies[parsed.function];
            
            if (!strategy) {
                this.logger.throwError(new Error(`Unsupported function: ${parsed.function}`));
            }

            const result = strategy(table, parsed.columns, parsed.modifier);
            
            // 更新计算结果
            config.result = result;
            config.lastCalculatedAt = getStandardTime();

            return result;
        } catch (error) {
            this.logger.throwError(new Error('Calculation failed'), error);
        }
    }
    
    /** 获取列值 */
    private getColumnValues(table: IMarkdownTable, columns: string[]): string[] {
        const columnIndices = columns.map(column => {
            const index = table.headers.findIndex(h => h.content === column);
            if (index === -1) {
                this.logger.throwError(new Error(`Column not found: ${column}`));
            }
            return index;
        });

        return table.cells.flatMap(row => 
            columnIndices.map(index => row[index].content)
        );
    }

    /** 获取数值 */
    private getNumericValues(table: IMarkdownTable, columns: string[]): number[] {
        return this.getColumnValues(table, columns)
            .map(v => parseFloat(v))
            .filter(n => !isNaN(n));
    }

    /** 内置的时间格式列表 */
    private readonly defaultDateFormats = [
        "yyyy-MM-dd'T'HH:mm:ssXXX",
        'yyyy-MM-dd HH:mm:ss',
        'yyyy-MM-dd HH:mm',
        'yyyy-MM-dd',
        'yyyy/MM/dd HH:mm:ss',
        'yyyy/MM/dd HH:mm',
        'yyyy/MM/dd',
        'HH:mm:ss',
        'HH:mm'
    ];

    /** 解析时间字符串 */
    private parseDate(value: string, customFormat?: string): Date | null {
        // 1. 如果提供了自定义格式，先尝试使用自定义格式
        if (customFormat) {
            try {
                const date = parse(value, customFormat, new Date());
                if (isValid(date)) {
                    return date;
                }
            } catch {
                this.logger.warn(`Failed to parse date using custom format: ${customFormat}`);
            }
        }

        // 2. 尝试所有内置格式
        for (const format of this.defaultDateFormats) {
            try {
                const date = parse(value, format, new Date());
                if (isValid(date)) {
                    return date;
                }
            } catch {
                continue;
            }
        }

        // 3. 尝试作为ISO字符串解析
        try {
            const date = new Date(value);
            if (isValid(date)) {
                return date;
            }
        } catch {
            this.logger.warn(`Failed to parse date: ${value}`);
        }

        return null;
    }

    /** 获取日期值 */
    private getDateValues(table: IMarkdownTable, columns: string[], customFormat?: string): Date[] {
        return this.getColumnValues(table, columns)
            .map(v => this.parseDate(v.trim(), customFormat))
            .filter((d): d is Date => d !== null);
    }

    // 数学计算辅助方法
    private sum(numbers: number[]): number {
        return numbers.reduce((a, b) => a + b, 0);
    }
    private average(numbers: number[]): number {
        if (numbers.length === 0) return 0;
        return this.sum(numbers) / numbers.length;
    }
    private median(numbers: number[]): number {
        if (numbers.length === 0) return 0;
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }
    private mode(numbers: number[]): number {
        if (numbers.length === 0) return 0;
        const frequency = new Map<number, number>();
        numbers.forEach(n => frequency.set(n, (frequency.get(n) || 0) + 1));
        
        let maxFreq = 0;
        let mode = numbers[0];
        
        for (const [num, freq] of frequency.entries()) {
            if (freq > maxFreq) {
                maxFreq = freq;
                mode = num;
            }
        }
        
        return mode;
    }
    private variance(numbers: number[]): number {
        if (numbers.length === 0) return 0;
        const avg = this.average(numbers);
        return this.average(numbers.map(n => Math.pow(n - avg, 2)));
    }
    private standardDeviation(numbers: number[]): number {
        return Math.sqrt(this.variance(numbers));
    }

    // 时间计算辅助方法
    private earliest(dates: Date[]): Date | null {
        if (dates.length === 0) {
            this.logger.warn('No dates found');
            return null;
        }
        
        let earliest = dates[0];
        for (let i = 1; i < dates.length; i++) {
            if (compareAsc(dates[i], earliest) == -1) {
                earliest = dates[i];
            }
        }
        return earliest;
    }
    private latest(dates: Date[]): Date |null {
        if (dates.length === 0) {
            this.logger.warn('No dates found');
            return null;
        }
        
        let latest = dates[0];
        for (let i = 1; i < dates.length; i++) {
            if (compareDesc(dates[i], latest) == -1) {
                latest = dates[i];
            }
        }
        return latest;
    }
}