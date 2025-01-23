import { IMarkdownTable, ITablePosition } from "./table";

/** 解析器配置接口 */
export interface IParserConfig {
	/** 是否保留原始格式 */
	preserveFormat?: boolean;
	/** 是否解析内联样式 */
	parseInlineStyles?: boolean;
	/** 是否解析表格标题 */
	parseCaption?: boolean;
	/** 自定义分隔符 */
	delimiter?: string;
}

/** 解析器接口 */
export interface ITableParser {
	/** 解析Markdown文本中的表格 */
	parseTables(content: string, config?: IParserConfig): IMarkdownTable[];
	/** 解析单个表格 */
	parseTable(tableContent: string, position: ITablePosition): IMarkdownTable;
	/** 验证表格格式 */
	validateTable(table: IMarkdownTable): boolean;
}
