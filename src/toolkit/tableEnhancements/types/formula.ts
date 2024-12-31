import { t } from "@/src/i18n/i18n";
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
    description: t('toolkit.tableEnhancements.formula_editor.math.COUNT'),
    syntax: "Count([columns], modifier?)",
    example: "Count([Status], 'unique')",
    defaultTemplate: "Count([columns], 'values')",  // 默认使用 'values'
    parameters: [
      {
        name: "modifier",
        description: t('toolkit.tableEnhancements.formula_editor.math.count_modifier'),
        options: ["values", "empty", "unique"],
        optional: true,
        default: "values"
      }
    ]
  },
  {
    function: FormulaFunction.SUM,
    description: t('toolkit.tableEnhancements.formula_editor.math.SUM'),
    syntax: "Sum([columns])",
    example: "Sum([Price,Cost])"
  },
  {
    function: FormulaFunction.AVERAGE,
    description: t('toolkit.tableEnhancements.formula_editor.math.AVERAGE'),
    syntax: "Average([columns])",
    example: "Average([Score])"
  },
  {
    function: FormulaFunction.MIN,
    description: t('toolkit.tableEnhancements.formula_editor.math.MIN'),
    syntax: "Min([columns])",
    example: "Min([Score])"
  },
  {
    function: FormulaFunction.MAX,
    description: t('toolkit.tableEnhancements.formula_editor.math.MAX'),
    syntax: "Max([columns])",
    example: "Max([Score])"
  },
  {
    function: FormulaFunction.MEDIAN,
    description: t('toolkit.tableEnhancements.formula_editor.math.MEDIAN'),
    syntax: "Median([columns])",
    example: "Median([Score])"
  },
  {
    function: FormulaFunction.MODE,
    description: t('toolkit.tableEnhancements.formula_editor.math.MODE'),
    syntax: "Mode([columns])",
    example: "Mode([Score])"
  },
  {
    function: FormulaFunction.STDDEV,
    description: t('toolkit.tableEnhancements.formula_editor.math.STDDEV'),
    syntax: "StdDev([columns])",
    example: "StdDev([Score])"
  },
  {
    function: FormulaFunction.VARIANCE,
    description: t('toolkit.tableEnhancements.formula_editor.math.VARIANCE'),
    syntax: "Variance([columns])",
    example: "Variance([Score])"
  },
  {
    function: FormulaFunction.PERCENTAGE,
    description: t('toolkit.tableEnhancements.formula_editor.math.PERCENTAGE'),
    syntax: "Percentage([columns])",
    example: "Percentage([Score])"
  },
  {
    function: FormulaFunction.TIME_EARLIEST,
    description: t('toolkit.tableEnhancements.formula_editor.time.TIME_EARLIEST'),
    syntax: "TimeEarliest([columns], format?)",
    example: "TimeEarliest([Date], 'yyyy-MM-dd')",
    defaultTemplate: "TimeEarliest([columns], 'yyyy-MM-dd')",
    parameters: [
      {
        name: "format",
        description: t('toolkit.tableEnhancements.formula_editor.time.time_format'),
        options: ["yyyy-MM-dd", "yyyy-MM-dd HH:mm:ss", "HH:mm"],
        optional: true,
        default: "yyyy-MM-dd"
      }
    ]
  },
  {
    function: FormulaFunction.TIME_LATEST,
    description: t('toolkit.tableEnhancements.formula_editor.time.TIME_LATEST'),
    syntax: "TimeLatest([columns], format?)",
    example: "TimeLatest([Date], 'yyyy-MM-dd')",
    defaultTemplate: "TimeLatest([columns], 'yyyy-MM-dd')",
    parameters: [
      {
        name: "format",
        description: t('toolkit.tableEnhancements.formula_editor.time.time_format'),
        options: ["yyyy-MM-dd", "yyyy-MM-dd HH:mm:ss", "HH:mm"],
        optional: true,
        default: "yyyy-MM-dd"
      }
    ]
  },
  {
    function: FormulaFunction.TIME_SPAN,
    description: t('toolkit.tableEnhancements.formula_editor.time.TIME_SPAN'),
    syntax: "TimeSpan([column], format?:unit?)",
    example: "TimeSpan([Date], 'yyyy-MM-dd:days')",
    defaultTemplate: "TimeSpan([columns], 'yyyy-MM-dd:days')",
    parameters: [
      {
        name: "format",
        description: t('toolkit.tableEnhancements.formula_editor.time.time_format'),
        options: ["yyyy-MM-dd", "yyyy-MM-dd HH:mm:ss"],
        optional: true,
        default: "yyyy-MM-dd"
      },
      {
        name: "unit",
        description: t('toolkit.tableEnhancements.formula_editor.time.time_unit'),
        options: ["days", "hours", "minutes"],
        optional: true,
        default: "days"
      }
    ]
  },
]; 