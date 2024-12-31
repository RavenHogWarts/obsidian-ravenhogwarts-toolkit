import { FC, useState } from 'react';
import { FUNCTION_HINTS, IFunctionHint, IFunctionParameter } from '../types/formula';
import { IMarkdownTable } from '../types/table';

interface FormulaEditorProps {
  table: IMarkdownTable;
  value: string;
  onChange: (value: string) => void;
}

const FormulaEditor: FC<FormulaEditorProps> = ({ table, value, onChange }) => {
  const [activeSuggestion, setActiveSuggestion] = useState<IFunctionHint | null>(null);
  const [hoverSuggestion, setHoverSuggestion] = useState<IFunctionHint | null>(null);

  const currentSuggestion = hoverSuggestion || activeSuggestion;

  const insertFunction = (hint: IFunctionHint) => {
    setActiveSuggestion(hint);
    const template = (hint.defaultTemplate || hint.syntax).replace('columns', '');
    onChange(template);
  };

  const insertColumn = (columnName: string) => {
    if (!value) {
      return;
    }

    // 查找方括号的位置
    const bracketIndex = value.indexOf('[');
    if (bracketIndex === -1) {
      return;
    }

    // 找到对应的右括号
    const closeBracketIndex = value.indexOf(']', bracketIndex);
    if (closeBracketIndex === -1) {
      return;
    }

    // 获取现有的列内容
    const currentColumns = value.slice(bracketIndex + 1, closeBracketIndex)
      .split(',')
      .map(col => col.trim())
      .filter(col => col !== '');

    // 切换列的存在状态
    const columnIndex = currentColumns.indexOf(columnName);
    if (columnIndex === -1) {
      // 如果列不存在，添加它
      currentColumns.push(columnName);
    } else {
      // 如果列已存在，删除它
      currentColumns.splice(columnIndex, 1);
    }

    // 重建公式
    const before = value.slice(0, bracketIndex + 1);
    const after = value.slice(closeBracketIndex);
    const newValue = `${before}${currentColumns.join(', ')}${after}`;
    onChange(newValue);
  };

  // 添加一个辅助函数来检查列是否被选中
  const isColumnSelected = (columnName: string): boolean => {
    if (!value) return false;

    const bracketIndex = value.indexOf('[');
    const closeBracketIndex = value.indexOf(']', bracketIndex);
    
    if (bracketIndex === -1 || closeBracketIndex === -1) return false;

    const currentColumns = value.slice(bracketIndex + 1, closeBracketIndex)
      .split(',')
      .map(col => col.trim())
      .filter(col => col !== '');

    return currentColumns.includes(columnName);
  };

  const insertParameter = (param: IFunctionParameter, option: string) => {
    if (!value || !activeSuggestion) return;

    const functionName = activeSuggestion.function;
    
    // 查找函数的开始括号和结束括号
    const openParenIndex = value.indexOf('(');
    if (openParenIndex === -1) return;
    
    const closeParenIndex = value.lastIndexOf(')');
    const hasCloseParen = closeParenIndex !== -1;

    // 查找列的方括号
    const bracketIndex = value.indexOf('[', openParenIndex);
    if (bracketIndex === -1) return;

    const closeBracketIndex = value.indexOf(']', bracketIndex);
    if (closeBracketIndex === -1) return;

    // 获取列部分
    const columnsPart = value.slice(bracketIndex, closeBracketIndex + 1);
    
    // 获取参数部分（不包括结束括号）
    const afterBracket = value.slice(closeBracketIndex + 1, hasCloseParen ? closeParenIndex : undefined);
    
    // 解析现有参数
    const params = new Map<string, string>();
    const paramMatches = afterBracket.match(/(?:,\s*)?'[^']*'|[^,)]+/g) || [];
    
    // 特殊处理 TimeSpan 函数的格式:单位参数
    if (functionName === 'TimeSpan' && param.name === 'unit') {
        const formatParam = activeSuggestion.parameters?.find(p => p.name === 'format');
        const currentFormat = params.get('format') || formatParam?.default || 'yyyy-MM-dd';
        params.set('format', `${currentFormat}:${option}`);
    } else if (functionName === 'TimeSpan' && param.name === 'format') {
        // 如果是修改格式，保持现有的单位
        const unitParam = activeSuggestion.parameters?.find(p => p.name === 'unit');
        const currentUnit = params.get('unit') || unitParam?.default || 'days';
        params.set(param.name, `${option}:${currentUnit}`);
    } else {
        // 其他函数的常规参数处理
        activeSuggestion.parameters?.forEach((p, index) => {
            if (paramMatches[index]) {
                params.set(p.name, paramMatches[index].trim().replace(/^,?\s*'|'$/g, ''));
            } else if (p.default) {
                params.set(p.name, p.default);
            }
        });
        params.set(param.name, option);
    }

    // 重建公式
    const newParamsStr = Array.from(params.values())
        .filter(Boolean) // 移除空值
        .map(v => `'${v}'`)
        .join(', ');

    const newFormula = `${functionName}(${columnsPart}${newParamsStr ? ', ' + newParamsStr : ''})`;
    onChange(newFormula);
  };

  return (
    <div className="formula-editor">
        <div className="formula-columns">
            <h3>Table Columns</h3>
            <div className="column-list">
                {table.headers.map(column => (
                    <div 
                        key={column.field}
                        className={`column-item ${isColumnSelected(column.content) ? 'selected' : ''}`}
                        onClick={() => insertColumn(column.content)}
                    >
                        {column.field}: {column.content}
                    </div>
                ))}
            </div>
        </div>

        <div className="formula-input">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Select a function or start typing..."
                className="formula-textarea"
            />
        </div>

        <div className="formula-functions">
            <h3>Functions</h3>
            <div className="functions-container">
                <div className="function-list">
                    {FUNCTION_HINTS.map(hint => (
                        <div 
                            key={hint.function}
                            className={`function-item ${activeSuggestion?.function === hint.function ? 'active' : ''}`}
                            onClick={() => {
                                insertFunction(hint);
                            }}
                            onMouseEnter={() => setHoverSuggestion(hint)}
                            // onMouseLeave={() => setHoverSuggestion(null)}
                        >
                            <div className="function-name">{hint.function}</div>
                            <div className="function-desc">{hint.description}</div>
                        </div>
                    ))}
                </div>
                <div className="function-detail-wrapper">
                    {currentSuggestion && (
                        <div className="function-detail">
                            <div className="hint-syntax">Syntax: {currentSuggestion.syntax}</div>
                            <div className="hint-example">Example: {currentSuggestion.example}</div>
                            
                            {currentSuggestion.parameters && currentSuggestion.parameters.length > 0 && (
                                <div className="hint-parameters">
                                    <div className="parameters-title">Parameters:</div>
                                    {currentSuggestion.parameters.map((param, index) => (
                                        <div key={index} className="parameter-item">
                                            <div className="parameter-name">
                                                {param.name}
                                                {param.optional && <span className="parameter-optional">(optional)</span>}
                                            </div>
                                            <div className="parameter-desc">{param.description}</div>
                                            {param.options && (
                                                <div className="parameter-options">
                                                    Options: {param.options.map(opt => (
                                                        <span 
                                                            key={opt} 
                                                            className="option-tag"
                                                            onClick={() => insertParameter(param, opt)}
                                                            title={`Insert '${opt}'`}
                                                        >
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default FormulaEditor;
