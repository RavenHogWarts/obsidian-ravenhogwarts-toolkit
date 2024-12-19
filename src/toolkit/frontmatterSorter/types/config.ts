export interface IFrontmatterSorterConfig {
    enabled: boolean;
    order: string[];
}

export interface IFrontmatterSorterData {
    lastModified: string;
}

export const FRONTMATTER_SORTER_DEFAULT_CONFIG: IFrontmatterSorterConfig = {
    enabled: true,
    order: []
}
