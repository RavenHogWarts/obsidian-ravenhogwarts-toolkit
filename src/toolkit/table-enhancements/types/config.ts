import { ICalculatedColumnConfig } from './operations';

/** 编辑配置接口 */
export interface IEditConfig {
    /** 是否启用编辑 */
    enabled: boolean;
    /** 编辑模式 */
    mode: 'cell' | 'row' | 'batch';
    /** 验证规则 */
    validation?: {
        /** 列验证规则 */
        [column: string]: {
            /** 数据类型 */
            type: 'string' | 'number' | 'boolean' | 'date';
            /** 是否必填 */
            required?: boolean;
            /** 自定义验证函数 */
            validator?: (value: any) => boolean;
        };
    };
}

/** 导出配置接口 */
export interface IExportConfig {
    /** 导出格式 */
    format: 'markdown' | 'csv' | 'json';
    /** 是否包含计算列 */
    includeCalculatedColumns: boolean;
    /** 自定义导出处理器 */
    customProcessor?: (data: any) => string;
}

/** 表格主题配置接口 */
export interface ITableThemeConfig {
    /** 主题名称 */
    name: 'alpine' | 'balham' | 'material';
    /** 是否使用暗色主题 */
    isDark?: boolean;
    /** 自定义样式 */
    customStyles?: {
        [key: string]: string;
    };
}

/** 前置数据配置接口 */
export interface IFrontMatterConfig {
    /** 是否启用前置数据输出 */
    enabled: boolean;
    /** 输出键前缀 */
    keyPrefix?: string;
    /** 自动更新 */
    autoUpdate?: boolean;
    /** 更新策略 */
    updateStrategy?: 'immediate' | 'debounce' | 'throttle';
    /** 更新延迟(ms) */
    updateDelay?: number;
}

/** 表格增强配置接口 */
export interface ITableEnhancementsConfig {
    /** 是否启用编辑 */
    editable?: boolean;
    /** 是否启用排序 */
    sortable?: boolean;
    /** 是否启用过滤 */
    filterable?: boolean;
    /** 是否启用列调整 */
    resizable?: boolean;
    /** 是否启用范围选择 */
    rangeSelection?: boolean;
    /** 主题设置 */
    theme?: ITableThemeConfig;
    /** 计算列配置 */
    calculatedColumns?: ICalculatedColumnConfig[];
    /** 编辑配置 */
    edit?: IEditConfig;
    /** 导出配置 */
    export?: IExportConfig;
    /** 前置数据配置 */
    frontMatter?: IFrontMatterConfig;
}

