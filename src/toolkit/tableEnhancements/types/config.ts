import { ISavedCalculation } from './operations';

/** 表格增强配置接口 */
export interface ITableEnhancementsConfig {
    /** 是否启用 */
    enabled: boolean;
}

/** 表格增强数据接口 */
export interface ITableEnhancementsData {
    lastModified: string;
    /** 保存的计算 */
    savedCalculations: {
        [tableId: string]: ISavedCalculation[];
    };
}

export const TABLE_ENHANCEMENTS_DEFAULT_CONFIG: ITableEnhancementsConfig = {
    enabled: true
}
