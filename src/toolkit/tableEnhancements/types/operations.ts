/** 输出类型 */
export enum OutputType {
    /** Front Matter */
    FRONTMATTER = 'frontmatter',
}

/** 输出目标配置 */
export interface OutputTarget {
    /** 输出类型 */
    type: OutputType;
    /** 输出值 - 可以是 frontmatter key */
    value: string;
}

export enum FormulaFunction {
    COUNT = 'Count',
    SUM = 'Sum',
    AVERAGE = 'Average',
    MIN = 'Min',
    MAX = 'Max',
    MEDIAN = 'Median',
    MODE = 'Mode',
    STDDEV = 'StdDev',
    VARIANCE = 'Variance',
    PERCENTAGE = 'Percentage',

    // 时间相关
    TIME_EARLIEST = 'TimeEarliest',  // 最早时间
    TIME_LATEST = 'TimeLatest',      // 最晚时间
    TIME_SPAN = 'TimeSpan',          // 时间跨度
}

/** 函数参数类型 */
export type FunctionArgument = {
    /** 列名数组 */
    columns: string[];
    /** 可选的修饰参数，如 'values', 'empty', 'unique' 等 */
    modifier?: string;
}

/** 公式计算配置 */
export interface IFormulaConfig {
    /** 公式表达式，如:
     * "Count([A,B], 'values')"
     * "TimeSpan([Date], 'days')"
     */
    formula: string;
    /** 输出配置 */
    output: OutputTarget;
    /** 最后计算结果 */
    result?: number | string;
    /** 最后计算时间 */
    lastCalculatedAt?: string;
}

/** 已保存的计算接口 */
export interface ISavedCalculation {
    /** 计算配置 */
    config: IFormulaConfig;
    /** 创建时间 */
    createdAt: string;
    /** 更新时间 */
    updatedAt: string;
}