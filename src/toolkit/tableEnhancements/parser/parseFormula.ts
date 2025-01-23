import { FormulaFunction } from "../types/operations";

/** 公式解析结果 */
export interface ParsedFormula {
	/** 函数名 */
	function: FormulaFunction;
	/** 列名数组 */
	columns: string[];
	/** 修饰参数 */
	modifier?: string;
}

/** 解析错误类型 */
export enum ParseErrorType {
	INVALID_FORMAT = "INVALID_FORMAT",
	UNKNOWN_FUNCTION = "UNKNOWN_FUNCTION",
	INVALID_COLUMNS = "INVALID_COLUMNS",
}

/** 解析错误 */
export class ParseError extends Error {
	constructor(public type: ParseErrorType, message: string) {
		super(message);
		this.name = "ParseError";
	}
}

export class FormulaParser {
	/** 解析公式 */
	public static parse(formula: string): ParsedFormula {
		// 示例公式: "Count([A,B], 'values')" 或 "TimeSpan([Date], 'days')"
		const regex =
			/^(\w+)\s*\(\s*\[(.*?)\](?:\s*,\s*(?:'([^']*(?::[^']*)?)'|"([^"]*(?::[^"]*)?)")?)?\s*\)$/;
		const match = formula.match(regex);

		if (!match) {
			throw new ParseError(
				ParseErrorType.INVALID_FORMAT,
				`Invalid formula format: ${formula}`
			);
		}

		const [
			_,
			functionName,
			columnsStr,
			singleQuoteModifier,
			doubleQuoteModifier,
		] = match;
		const columns = columnsStr.split(",").map((c) => c.trim());

		if (
			!Object.values(FormulaFunction).includes(
				functionName as FormulaFunction
			)
		) {
			throw new ParseError(
				ParseErrorType.UNKNOWN_FUNCTION,
				`Unknown function: ${functionName}`
			);
		}

		if (columns.some((c) => !c)) {
			throw new ParseError(
				ParseErrorType.INVALID_COLUMNS,
				"Invalid column name"
			);
		}

		const modifier = singleQuoteModifier || doubleQuoteModifier;

		return {
			function: functionName as FormulaFunction,
			columns,
			modifier,
		};
	}
}
