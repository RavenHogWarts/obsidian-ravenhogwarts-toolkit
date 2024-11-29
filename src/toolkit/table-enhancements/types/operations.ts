import { ValueGetterParams } from 'ag-grid-community';

/** 计算类型枚举 */
export enum CalculationType {
    SUM = 'sum',
    AVERAGE = 'average',
    COUNT = 'count',
    MIN = 'min',
    MAX = 'max',
    MEDIAN = 'median',
    MODE = 'mode',
    STDDEV = 'stddev',
    VARIANCE = 'variance',
    PERCENTAGE = 'percentage',
    CUSTOM = 'custom'
}

/** 计算列配置接口 */
export interface ICalculatedColumnConfig {
    /** 列字段名 */
    field: string;
    /** 显示名称 */
    headerName: string;
    /** 计算类型 */
    calculationType: CalculationType;
    /** 源列字段列表 */
    sourceFields: string[];
    /** 自定义计算函数 */
    customCalculation?: (params: ValueGetterParams) => any;
    /** 结果格式化函数 */
    valueFormatter?: (value: any) => string;
    /** 条件格式化 */
    conditionalFormatting?: {
        condition: (value: any) => boolean;
        style: { [key: string]: string };
    }[];
}

/** 计算配置接口 */
export interface ICalculationConfig {
    /** 计算类型 */
    type: CalculationType;
    /** 目标列 */
    targetColumns: string[];
    /** 过滤条件 */
    filter?: {
        column: string;
        operator: '=' | '>' | '<' | '>=' | '<=' | '!=';
        value: any;
    };
    /** 分组 */
    groupBy?: string[];
    /** 排序 */
    sortBy?: {
        column: string;
        direction: 'asc' | 'desc';
    }[];
}

/** 计算结果接口 */
export interface ICalculationResult {
    /** 计算类型 */
    type: CalculationType;
    /** 计算值 */
    value: number;
    /** 计算公式 */
    formula: string;
    /** 计算时间 */
    timestamp: string;
    /** 源数据 */
    sourceData?: any[];
    /** 中间结果 */
    intermediateResults?: any[];
    /** 错误信息 */
    error?: string;
}