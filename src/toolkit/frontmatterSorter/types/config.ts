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

export interface ISortingRules {
    priority: string[];           // 优先排序的键
    customOrder: Record<string, number>; // 自定义排序权重
    ignoreKeys: string[];        // 忽略的键
    arraySort: boolean;          // 是否对数组值进行排序
    caseSensitive: boolean;      // 是否区分大小写
}

export const FRONTMATTER_SORTER_DEFAULT_CONFIG: IFrontmatterSorterConfig = {
    enabled: true,
    sortOnSave: false,
    ignoreFolders: [],
    ignoreFiles: [],
    rules: {
        priority: [],
        customOrder: {},
        ignoreKeys: [],
        arraySort: false,
        caseSensitive: false
    }
}

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

