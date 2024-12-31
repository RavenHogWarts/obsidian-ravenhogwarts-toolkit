import { FormulaFunction } from "./operations";

export interface IFunctionParameter {
  name: string;
  description: string;
  options?: string[];  // 可选的参数值列表
  optional?: boolean;  // 是否可选参数
  default?: string;  // 添加默认值
}

export interface IFunctionHint {
  function: FormulaFunction;
  description: string;
  syntax: string;
  example: string;
  parameters?: IFunctionParameter[];  // 新增参数说明
  defaultTemplate?: string;  // 添加默认模板
}

export const FUNCTION_HINTS: IFunctionHint[] = [
  {
    function: FormulaFunction.COUNT,
    description: "Count values in selected columns",
    syntax: "Count([columns], modifier?)",
    example: "Count([Status], 'unique')",
    defaultTemplate: "Count([columns], 'values')",  // 默认使用 'values'
    parameters: [
      {
        name: "modifier",
        description: "Type of counting",
        options: ["values", "empty", "unique"],
        optional: true,
        default: "values"
      }
    ]
  },
  {
    function: FormulaFunction.SUM,
    description: "Sum up values in selected columns",
    syntax: "Sum([columns])",
    example: "Sum([Price,Cost])"
  },
  {
    function: FormulaFunction.AVERAGE,
    description: "Calculate average of values",
    syntax: "Average([columns])",
    example: "Average([Score])"
  },
  {
    function: FormulaFunction.MIN,
    description: "Find the minimum value in selected columns",
    syntax: "Min([columns])",
    example: "Min([Score])"
  },
  {
    function: FormulaFunction.MAX,
    description: "Find the maximum value in selected columns",
    syntax: "Max([columns])",
    example: "Max([Score])"
  },
  {
    function: FormulaFunction.MEDIAN,
    description: "Find the median value in selected columns",
    syntax: "Median([columns])",
    example: "Median([Score])"
  },
  {
    function: FormulaFunction.MODE,
    description: "Find the mode value in selected columns",
    syntax: "Mode([columns])",
    example: "Mode([Score])"
  },
  {
    function: FormulaFunction.STDDEV,
    description: "Calculate standard deviation of values",
    syntax: "StdDev([columns])",
    example: "StdDev([Score])"
  },
  {
    function: FormulaFunction.VARIANCE,
    description: "Calculate variance of values",
    syntax: "Variance([columns])",
    example: "Variance([Score])"
  },
  {
    function: FormulaFunction.PERCENTAGE,
    description: "Calculate percentage of values",
    syntax: "Percentage([columns])",
    example: "Percentage([Score])"
  },
  {
    function: FormulaFunction.TIME_EARLIEST,
    description: "Find the earliest date in selected columns",
    syntax: "TimeEarliest([columns])",
    example: "TimeEarliest([Date])"
  },
  {
    function: FormulaFunction.TIME_LATEST,
    description: "Find the latest date in selected columns",
    syntax: "TimeLatest([columns])",
    example: "TimeLatest([Date])"
  },
  {
    function: FormulaFunction.TIME_SPAN,
    description: "Calculate time span between dates",
    syntax: "TimeSpan([column], format?:unit?)",
    example: "TimeSpan([Date], 'yyyy-MM-dd:days')",
    defaultTemplate: "TimeSpan([columns], 'yyyy-MM-dd:days')",  // 默认格式和单位
    parameters: [
      {
        name: "format",
        description: "Date format pattern",
        options: ["yyyy-MM-dd", "yyyy/MM/dd", "yyyy-MM-dd HH:mm:ss"],
        optional: true,
        default: "yyyy-MM-dd"
      },
      {
        name: "unit",
        description: "Time unit for result",
        options: ["days", "hours", "minutes"],
        optional: true,
        default: "days"
      }
    ]
  },
]; 