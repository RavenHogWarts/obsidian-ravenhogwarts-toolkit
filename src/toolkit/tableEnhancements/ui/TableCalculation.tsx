import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { IFormulaConfig, ISavedCalculation, OutputType } from "../types/operations";
import { IMarkdownTable } from "../types/table";
import { Logger } from "@/src/util/log";
import { TableEnhancementsManager } from "../manager/TableEnhancementsManager";
import { getStandardTime } from "@/src/util/date";
import { CirclePlay, CircleX, PencilLine } from "lucide-react";

interface TableCalculationProps {
    table: IMarkdownTable;
    manager: TableEnhancementsManager;
    onCalculate: (table: IMarkdownTable) => void;
    logger: Logger;
}

interface CalculationState {
    formula: string;
    output: OutputType;
    outputValue: string;
    editingIndex: number | null;
    isAdding: boolean;
}

// 输出类型选项
const OUTPUT_TYPE_OPTIONS = Object.values(OutputType).map(type => ({
    value: type,
    label: type.toUpperCase()
}));

// 计算项组件
const CalculationItem: FC<{
    calc: ISavedCalculation;
    index: number;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
    onExecute: (calc: ISavedCalculation) => void;
    disabled: boolean;
}> = ({ calc, index, onEdit, onDelete, onExecute, disabled }) => (
    <div className="tableEnhancements-calculation-item">
        <div className="tableEnhancements-calculation-info">
            <span className="calculation-formula">
                {calc.config.formula}
            </span>
            <span className="calculation-output">
                → {calc.config.output.type}
            </span>
            {calc.config.output.value && (
                <span className="calculation-output-value">
                    ({calc.config.output.value})
                </span>
            )}
            {calc.config.result !== undefined && (
                <span className="calculation-result">
                    = {calc.config.result}
                </span>
            )}
        </div>
        <div className="tableEnhancements-calculation-actions">
            <button
                className="tableEnhancements-btn icon"
                onClick={() => onEdit(index)}
                disabled={disabled}
                aria-label="Edit calculation"
            >
                <PencilLine />
            </button>
            <button
                className="tableEnhancements-btn icon"
                onClick={() => onDelete(index)}
                disabled={disabled}
                aria-label="Remove calculation"
            >
                <CircleX />
            </button>
            <button
                className="tableEnhancements-btn icon"
                onClick={() => onExecute(calc)}
                disabled={disabled}
                aria-label="Execute calculation"
            >
                <CirclePlay />
            </button>
        </div>
    </div>
);

export const TableCalculation: FC<TableCalculationProps> = ({
    table,
    manager,
    onCalculate,
    logger,
}) => {
    const [savedCalculations, setSavedCalculations] = useState<ISavedCalculation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState<CalculationState>({
        formula: '',
        output: OutputType.FRONTMATTER,
        outputValue: '',
        editingIndex: null,
        isAdding: false,
    });

    // 加载保存的计算
    useEffect(() => {
        if (table.referenceId) {
            setSavedCalculations(manager.getSavedCalculations(table.referenceId));
        }
    }, [table.referenceId, manager]);

    // 重置表单状态
    const resetForm = useCallback(() => {
        setState({
            formula: '',
            output: OutputType.FRONTMATTER,
            outputValue: '',
            editingIndex: null,
            isAdding: false,
        });
        setError(null);
    }, []);

    // 开始编辑计算
    const startEditing = useCallback((index: number) => {
        const calculation = savedCalculations[index];
        setState({
            formula: calculation.config.formula,
            output: calculation.config.output.type,
            outputValue: calculation.config.output.value,
            editingIndex: index,
            isAdding: false,
        });
        setError(null);
    }, [savedCalculations]);

    // 开始添加新计算
    const startAdding = useCallback(() => {
        setState(prev => ({ ...prev, isAdding: true }));
        setError(null);
    }, []);

    // 删除计算
    const deleteCalculation = useCallback(async (index: number) => {
        if (!table.referenceId) return;

        try {
            await manager.deleteCalculation(table.referenceId, index);
            setSavedCalculations(manager.getSavedCalculations(table.referenceId));
            onCalculate(table);
        } catch (error) {
            logger.error('Error deleting calculation:', error);
        }
    }, [table, manager, onCalculate, logger]);

    // 执行计算
    const executeCalculation = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!table.referenceId) {
                table.referenceId = await manager.saveCalculatedTable(table);
            }

            const config: IFormulaConfig = {
                formula: state.formula,
                output: {
                    type: state.output,
                    value: state.outputValue
                }
            };

            const calculation: ISavedCalculation = {
                config,
                createdAt: getStandardTime(),
                updatedAt: getStandardTime(),
            };

            await manager.executeCalculation(table, calculation);

            if (state.editingIndex !== null) {
                await manager.updateCalculation(table.referenceId, state.editingIndex, calculation);
            } else {
                await manager.addCalculation(table.referenceId, calculation);
            }

            setSavedCalculations(manager.getSavedCalculations(table.referenceId));
            resetForm();
            onCalculate(table);
        } catch (error) {
            setError('Failed to execute calculation');
            logger.error('Error executing calculation:', error);
        } finally {
            setIsLoading(false);
        }
    }, [state, table, manager, onCalculate, logger, resetForm]);

    // 执行保存的计算
    const executeSavedCalculation = useCallback(async (calculation: ISavedCalculation) => {
        setIsLoading(true);
        try {
            await manager.executeCalculation(table, calculation);
            onCalculate(table);
        } catch (error) {
            logger.error('Error executing saved calculation:', error);
        } finally {
            setIsLoading(false);
        }
    }, [table, manager, onCalculate, logger]);
    
    return (
        <div className="tableEnhancements-calculation">
            <div className="tableEnhancements-calculation-list">
                {savedCalculations.map((calc, index) => (
                    <CalculationItem
                        key={index}
                        calc={calc}
                        index={index}
                        onEdit={startEditing}
                        onDelete={deleteCalculation}
                        onExecute={executeSavedCalculation}
                        disabled={isLoading}
                    />
                ))}
            </div>

            {error && (
                <div className="tableEnhancements-error">
                    {error}
                </div>
            )}

            {!state.isAdding && state.editingIndex === null && (
                <div className="tableEnhancements-calculation-actions">
                    <button
                        className="tableEnhancements-btn"
                        onClick={startAdding}
                        disabled={isLoading}
                    >
                        Add Calculation
                    </button>
                </div>
            )}

            {(state.isAdding || state.editingIndex !== null) && (
                <div className="tableEnhancements-calculation-form">
                    <div className="tableEnhancements-calculation-form-row">
                        {/* 公式输入框 */}
                        <div className="tableEnhancements-form-group">
                            <label>Formula</label>
                            <input
                                type="text"
                                value={state.formula}
                                onChange={(e) => setState(prev => ({ ...prev, formula: e.target.value }))}
                                placeholder="e.g., Sum([A,B]) or TimeSpan([Date], 'days')"
                                className="tableEnhancements-input"
                                disabled={isLoading}
                            />
                        </div>
                        {/* 输出类型选择 */}
                        <div className="tableEnhancements-form-group">
                            <label>Output Type</label>
                            <select
                                value={state.output}
                                onChange={(e) => setState(prev => ({ ...prev, output: e.target.value as OutputType }))}
                                className="tableEnhancements-select"
                                disabled={isLoading}
                            >
                                {OUTPUT_TYPE_OPTIONS.map(({ value, label }) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* 输出值输入框 */}
                        <div className="tableEnhancements-form-group">
                            <label>Output Value</label>
                            <input
                                type="text"
                                value={state.outputValue}
                                onChange={(e) => setState(prev => ({ ...prev, outputValue: e.target.value }))}
                                placeholder="e.g., frontmatter key"
                                className="tableEnhancements-input"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <div className="tableEnhancements-calculation-form-actions">
                        <button
                            className="tableEnhancements-btn"
                            onClick={resetForm}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className="tableEnhancements-btn primary"
                            onClick={executeCalculation}
                            disabled={isLoading || !state.formula}
                        >
                            {state.editingIndex !== null ? 'Update' : 'Add'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};