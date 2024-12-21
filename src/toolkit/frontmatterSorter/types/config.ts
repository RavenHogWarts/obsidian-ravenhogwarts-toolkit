export interface IFrontMatterEntry {
    key: string;
    value: any;
    originalLine: string;
    lineNumber: number;
}

export interface IParsedFrontMatter {
    entries: IFrontMatterEntry[];
    raw: string;
    start: number;
    end: number;
}

export interface ISortingRules {
    priority: string[];      // 优先排序的键
    ignoreKeys: string[];    // 忽略排序的键
    arraySort: boolean;      // 是否对数组值排序
    caseSensitive: boolean;  // 是否区分大小写
}

export interface IFrontmatterSorterConfig {
    enabled: boolean;
    sortOnSave: boolean;
    ignoreFolders: string[];
    ignoreFiles: string[];
    rules: ISortingRules;
}

export interface IFrontmatterSorterData {
    lastModified: string;
}

export const FRONTMATTER_SORTER_DEFAULT_CONFIG: IFrontmatterSorterConfig = {
    enabled: true,
    sortOnSave: false,
    ignoreFolders: [],
    ignoreFiles: [],
    rules: {
        priority: [],
        ignoreKeys: [],
        arraySort: false,
        caseSensitive: false
    }
}

