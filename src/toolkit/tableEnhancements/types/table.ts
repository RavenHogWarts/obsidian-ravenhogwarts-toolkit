/** 表格单元格对齐方式 */
export type TableCellAlignment = 'left' | 'center' | 'right';

/** 表格位置信息 */
export interface ITablePosition {
    /** 文件路径 */
    filePath: string;
    /** 开始行号 */
    startLine: number;
    /** 结束行号 */
    endLine: number;
    /** 选中范围 */
    selection?: {
        start: { row: number; col: number };
        end: { row: number; col: number };
    };
}

/** 表格单元格接口 */
export interface ITableCell {
    /** 单元格内容 */
    content: string;
    /** 对齐方式 */
    alignment?: TableCellAlignment;
    /** 样式类 */
    className?: string;
    /** 数据类型 */
    type?: 'string' | 'number' | 'boolean' | 'date';
    /** 验证规则 */
    validation?: {
        required?: boolean;
        pattern?: string;
        min?: number;
        max?: number;
    };
}

/** 表格头部单元格接口 */
export interface ITableHeader extends ITableCell {
    /** 列字段名 */
    field: string;
    /** 显示名称 */
    headerName?: string;
    /** 是否可排序 */
    sortable?: boolean;
    /** 是否可过滤 */
    filterable?: boolean;
    /** 是否可调整大小 */
    resizable?: boolean;
    /** 是否可见 */
    visible?: boolean;
    /** 列宽 */
    width?: number;
    /** 最小列宽 */
    minWidth?: number;
    /** 最大列宽 */
    maxWidth?: number;
}

/** Markdown表格接口 */
export interface IMarkdownTable {
    /** 表格头部 */
    headers: ITableHeader[];
    /** 表格内容 */
    cells: ITableCell[][];
    /** 位置信息 */
    position: ITablePosition;
    /** 表格引用ID */
    referenceId?: string;
}

/** AG Grid数据行接口 */
export interface ITableGridData {
    /** 行索引 */
    __rowIndex?: number;
    /** 动态字段，key为列field */
    [key: string]: string | number | boolean | Date | null | undefined;
}
