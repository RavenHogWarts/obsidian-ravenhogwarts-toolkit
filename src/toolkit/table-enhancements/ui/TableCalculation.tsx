import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { CalculationType, ICalculationConfig, ICalculationResult, ISavedCalculation, OutputType } from "../types/operations";
import { IMarkdownTable, ITableHeader } from "../types/table";
import { Logger } from "@/src/util/log";
import { TableCalculationService } from "../services/TableCalculationService";
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
    selectedColumn: string;
    calculationType: CalculationType;
    outputType: OutputType;
    frontmatterKey: string;
    editingIndex: number | null;
    isAdding: boolean;
}

// 抽取表单选项为常量
const CALCULATION_TYPE_OPTIONS = Object.values(CalculationType).map(type => ({
    value: type,
    label: type.toUpperCase()
}));

const OUTPUT_TYPE_OPTIONS = Object.values(OutputType).map(type => ({
    value: type,
    label: type.toUpperCase()
}));

// 抽取表单组件
const CalculationFormSelect: FC<{
    label: string;
    value: string;
    options: Array<{ value: string; label: string; }>;
    onChange: (value: string) => void;
    disabled?: boolean;
}> = ({ label, value, options, onChange, disabled }) => (
    <div className="tableEnhancements-form-group">
        <label>{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="tableEnhancements-select"
            disabled={disabled}
        >
            <option value="">Select {label}</option>
            {options.map(({ value, label }) => (
                <option key={value} value={value}>
                    {label}
                </option>
            ))}
        </select>
    </div>
);

// 抽取计算项组件
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
            <span className="calculation-type">
                {calc.type.toUpperCase()}
            </span>
            <span className="calculation-column">
                {calc.targetColumns.join(', ')}
            </span>
            <span className="calculation-output">
                → {calc.outputType.toUpperCase()}
            </span>
            {calc.frontmatterKey && (
                <span className="calculation-frontmatter">
                    ({calc.frontmatterKey})
                </span>
            )}
            {calc.lastResult && (
                <span className="calculation-result">
                    = {calc.lastResult.value}
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
    const [calculationService] = useState(() => new TableCalculationService(logger));
    const [state, setState] = useState<CalculationState>({
        selectedColumn: '',
        calculationType: CalculationType.SUM,
        outputType: OutputType.FRONTMATTER,
        frontmatterKey: '',
        editingIndex: null,
        isAdding: false,
    });
    const [savedCalculations, setSavedCalculations] = useState<ISavedCalculation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 初始化
    useEffect(() => {
        if (table.referenceId) {
            try {
                const calculations = manager.getSavedCalculations(table.referenceId);
                setSavedCalculations(calculations);
                setError(null);
            } catch (err) {
                setError('Failed to load saved calculations');
                logger.error('Error loading calculations:', err);
            }
        }
    }, [table.referenceId, manager, logger]);

    // 初始化选择的列
    useEffect(() => {
        if (table.headers.length > 0 && !state.selectedColumn) {
            setState(prev => ({
                ...prev,
                selectedColumn: table.headers[0].field
            }));
        }
    }, [table.headers, state.selectedColumn]);

    // 表头选项记忆化
    const headerOptions = useMemo(() => 
        table.headers.map(header => ({
            value: header.field,
            label: header.headerName || header.content
        })),
        [table.headers]
    );

    // 重置表单状态
    const resetForm = useCallback(() => {
        setState({
            selectedColumn: table.headers[0]?.field || '',
            calculationType: CalculationType.SUM,
            outputType: OutputType.FRONTMATTER,
            frontmatterKey: '',
            editingIndex: null,
            isAdding: false,
        });
        setError(null);
    }, [table.headers]);

    // 开始编辑计算
    const startEditing = useCallback((index: number) => {
        const calculation = savedCalculations[index];
        setState({
            selectedColumn: calculation.targetColumns[0],
            calculationType: calculation.type,
            outputType: calculation.outputType || OutputType.FRONTMATTER,
            frontmatterKey: calculation.frontmatterKey || '',
            editingIndex: index,
            isAdding: false,
        });
        setError(null);
    }, [savedCalculations]);

    // 执行计算
    const executeCalculation = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!table.referenceId) {
                table.referenceId = await manager.saveCalculatedTable(table);
            }

            const calculation: ISavedCalculation = {
                type: state.calculationType,
                targetColumns: [state.selectedColumn],
                outputType: state.outputType,
                frontmatterKey: state.outputType === OutputType.FRONTMATTER ? state.frontmatterKey : undefined,
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

    // 删除计算
    const handleDelete = useCallback(async (index: number) => {
        setIsLoading(true);
        try {
            // 先更新本地状态，实现即时反馈
            const newCalculations = [...savedCalculations];
            newCalculations.splice(index, 1);
            setSavedCalculations(newCalculations);
            
            // 然后执行删除操作
            await manager.deleteCalculation(table.referenceId, index);
            setError(null);
            
            // 通知父组件更新
            onCalculate(table);
        } catch (err) {
            // 如果删除失败，恢复原状态
            setSavedCalculations(manager.getSavedCalculations(table.referenceId!));
            setError('Failed to delete calculation');
            logger.error('Error deleting calculation:', err);
        } finally {
            setIsLoading(false);
        }
    }, [table, manager, logger, onCalculate, savedCalculations]);

    // 执行单个计算
    const handleExecute = useCallback(async (calc: ISavedCalculation) => {
        try {
            await manager.executeCalculation(table, calc);
            setSavedCalculations(manager.getSavedCalculations(table.referenceId!));
            onCalculate(table);
            setError(null);
        } catch (err) {
            setError('Failed to execute calculation');
            logger.error('Error executing calculation:', err);
        }
    }, [table, manager, onCalculate, logger]);

    // 执行所有计算
    const executeAllCalculations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            for (const calc of savedCalculations) {
                await manager.executeCalculation(table, calc);
            }
            setSavedCalculations(manager.getSavedCalculations(table.referenceId!));
            onCalculate(table);
        } catch (err) {
            setError('Failed to execute all calculations');
            logger.error('Error executing all calculations:', err);
        } finally {
            setIsLoading(false);
        }
    }, [savedCalculations, table, manager, onCalculate, logger]);

    return (
        <div className="tableEnhancements-calculation">
            <div className="tableEnhancements-calculation-header">
                <div className="tableEnhancements-calculation-header-left">
                    <h3>Table Calculations</h3>
                    {savedCalculations.length > 0 && (
                        <button 
                            className="tableEnhancements-btn secondary"
                            onClick={executeAllCalculations}
                            disabled={isLoading || state.isAdding || state.editingIndex !== null}
                        >
                            {isLoading ? 'Processing...' : 'Execute All'}
                        </button>
                    )}
                </div>

                <button 
                    className="tableEnhancements-btn primary" 
                    onClick={() => setState(prev => ({ ...prev, isAdding: true }))}
                    disabled={state.isAdding || state.editingIndex !== null}
                >
                    + Add Calculation
                </button>
            </div>

            {error && (
                <div className="tableEnhancements-error-message">
                    {error}
                </div>
            )}

            <div className="tableEnhancements-calculation-list">
                {/* 新增/编辑表单 */}
                {(state.isAdding || state.editingIndex !== null) && (
                    <div className="tableEnhancements-calculation-form">
                        <div className="tableEnhancements-calculation-form-row">
                            <CalculationFormSelect
                                label="Type"
                                value={state.calculationType}
                                options={CALCULATION_TYPE_OPTIONS}
                                onChange={(value) => setState(prev => ({ ...prev, calculationType: value as CalculationType }))}
                                disabled={isLoading}
                            />
                            <CalculationFormSelect
                                label="Column"
                                value={state.selectedColumn}
                                options={headerOptions}
                                onChange={(value) => setState(prev => ({ ...prev, selectedColumn: value }))}
                                disabled={isLoading}
                            />
                            <CalculationFormSelect
                                label="Output"
                                value={state.outputType}
                                options={OUTPUT_TYPE_OPTIONS}
                                onChange={(value) => setState(prev => ({ ...prev, outputType: value as OutputType }))}
                                disabled={isLoading}
                            />
                            {state.outputType === OutputType.FRONTMATTER && (
                                <div className="tableEnhancements-form-group">
                                    <label>Frontmatter Key</label>
                                    <input
                                        type="text"
                                        value={state.frontmatterKey}
                                        onChange={(e) => setState(prev => ({ ...prev, frontmatterKey: e.target.value }))}
                                        placeholder="Frontmatter key"
                                        className="tableEnhancements-input"
                                        disabled={isLoading}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="tableEnhancements-calculation-form-actions">
                            <button
                                className="tableEnhancements-btn primary"
                                onClick={executeCalculation}
                                disabled={isLoading || !state.selectedColumn || (state.outputType === OutputType.FRONTMATTER && !state.frontmatterKey)}
                            >
                                {isLoading ? '...' : state.editingIndex !== null ? 'Update' : 'Save'}
                            </button>
                            <button 
                                className="tableEnhancements-btn secondary" 
                                onClick={resetForm}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                
                {/* 已保存的计算列表 */}
                {savedCalculations.map((calc, index) => (
                    state.editingIndex !== index && (
                        <CalculationItem
                            key={index}
                            calc={calc}
                            index={index}
                            onEdit={startEditing}
                            onDelete={handleDelete}
                            onExecute={handleExecute}
                            disabled={isLoading || state.isAdding || state.editingIndex !== null}
                        />
                    )
                ))}
            </div>
        </div>
    );
};