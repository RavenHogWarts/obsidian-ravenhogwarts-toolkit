import { ITableGridData } from './table';
import { IFormulaConfig, OutputType } from './operations';

/** 事件类型枚举 */
export enum TableEventType {
    CELL_CHANGE = 'cell_change',
    ROW_CHANGE = 'row_change',
    COLUMN_CHANGE = 'column_change',
    STRUCTURE_CHANGE = 'structure_change',
    SELECTION_CHANGE = 'selection_change',
    CALCULATION_COMPLETE = 'calculation_complete',
    EXPORT_COMPLETE = 'export_complete',
    ERROR = 'error'
}

/** 基础事件接口 */
export interface ITableEvent {
    /** 事件类型 */
    type: TableEventType;
    /** 时间戳 */
    timestamp: number;
    /** 表格引用ID */
    tableId: string;
}

/** 表格变更事件接口 */
export interface ITableChangeEvent extends ITableEvent {
    /** 变更类型 */
    type: TableEventType;
    /** 变更数据 */
    data: ITableGridData[];
    /** 变更位置 */
    position?: {
        rowIndex?: number;
        colId?: string;
    };
    /** 旧值 */
    oldValue?: any;
    /** 新值 */
    newValue?: any;
}

/** 计算事件接口 */
export interface ICalculationEvent extends ITableEvent {
    type: TableEventType.CALCULATION_COMPLETE;
    /** 计算配置 */
    config: IFormulaConfig;
    /** 计算时间 */
    calculatedAt: string;
}

/** 错误事件接口 */
export interface ITableErrorEvent extends ITableEvent {
    type: TableEventType.ERROR;
    /** 错误信息 */
    error: {
        /** 错误代码 */
        code: string;
        /** 错误消息 */
        message: string;
        /** 错误详情 */
        details?: any;
        /** 错误堆栈 */
        stack?: string;
    };
}