import { ValueGetterParams } from 'ag-grid-community';

/** 计算类型枚举 */
export enum CalculationType {
    SUM = 'sum',
    AVERAGE = 'average',
    COUNT_ALL = 'count_all',          // 统计总行数
    COUNT_VALUES = 'count_values',    // 统计有值的数量
    COUNT_EMPTY = 'count_empty',      // 统计空值的数量
    COUNT_UNIQUE = 'count_unique',    // 统计不重复值的数量
    MIN = 'min',
    MAX = 'max',
    MEDIAN = 'median',
    MODE = 'mode',
    STDDEV = 'stddev',
    VARIANCE = 'variance',
    PERCENTAGE = 'percentage',
}

/** 输出类型枚举 */
export enum OutputType {
    FRONTMATTER = 'frontmatter',
    // 可以在这里添加更多输出类型
}

/** 计算配置接口 */
export interface ICalculationConfig {
    type: CalculationType;
    targetColumns: string[];
    outputType: OutputType;
    frontmatterKey?: string;
}

/** 计算结果接口 */
export interface ICalculationResult {
    value: number;
    formula: string;
    type: CalculationType;
    targetColumns: string[];
}

/** 已保存的计算接口 */
export interface ISavedCalculation extends ICalculationConfig {
    frontmatterKey?: string;
    lastResult?: ICalculationResult;
    createdAt: string;
    updatedAt: string;
}