import { FC, useCallback, useEffect, useState } from "react";
import { CalculationType, ICalculationConfig, ICalculationResult, ISavedCalculation, OutputType } from "../types/operations";
import { IMarkdownTable, ITableHeader } from "../types/table";
import { Logger } from "@/src/util/log";
import { TableCalculationService } from "../services/TableCalculationService";
import { TableEnhancementsManager } from "../manager/TableEnhancementsManager";
import { getStandardTime } from "@/src/util/date";

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

    // 初始化
    useEffect(() => {
        if (table.referenceId) {
            const calculations = manager.getSavedCalculations(table.referenceId);
            setSavedCalculations(calculations);
        }
    }, [table.referenceId, manager]);

    // 初始化选择的列
    useEffect(() => {
        if (table.headers.length > 0 && !state.selectedColumn) {
            setState(prev => ({
                ...prev,
                selectedColumn: table.headers[0].field
            }));
        }
    }, [table.headers]);

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
    }, [savedCalculations]);

    // 执行计算
    const executeCalculation = useCallback(async () => {
        try {
            if (!table.referenceId) {
                throw new Error('Table reference ID not found');
            }

            const calculation: ISavedCalculation = {
                type: state.calculationType,
                targetColumns: [state.selectedColumn],
                outputType: state.outputType,
                frontmatterKey: state.outputType === OutputType.FRONTMATTER ? state.frontmatterKey : undefined,
                createdAt: getStandardTime(),
                updatedAt: getStandardTime(),
            };

            // 执行计算
            await manager.executeCalculation(table, calculation);

            if (state.editingIndex !== null) {
                // 更新现有计算
                await manager.updateCalculation(table.referenceId, state.editingIndex, calculation);
            } else {
                // 添加新计算
                await manager.addCalculation(table.referenceId, calculation);
            }

            // 更新本地状态
            setSavedCalculations(manager.getSavedCalculations(table.referenceId));

            // 重置表单状态
            resetForm();

            // 通知父组件
            onCalculate(table);
        } catch (error) {
            logger.error('Error executing calculation:', error);
        }
    }, [state, table, manager, onCalculate, logger, resetForm]);

    const renderCalculationForm = (isNewForm = false) => (
        <div className="calculation-item calculation-form">
            <div className="calculation-controls">
                <select
                    value={state.selectedColumn}
                    onChange={(e) => setState(prev => ({ ...prev, selectedColumn: e.target.value }))}
                >
                    {table.headers.map(header => (
                        <option key={header.field} value={header.field}>
                            {header.headerName || header.content}
                        </option>
                    ))}
                </select>

                <select
                    value={state.calculationType}
                    onChange={(e) => setState(prev => ({ ...prev, calculationType: e.target.value as CalculationType }))}
                >
                    {Object.values(CalculationType).map(type => (
                        <option key={type} value={type}>
                            {type.toUpperCase()}
                        </option>
                    ))}
                </select>

                <select
                    value={state.outputType}
                    onChange={(e) => setState(prev => ({ ...prev, outputType: e.target.value as OutputType }))}
                >
                    {Object.values(OutputType).map(type => (
                        <option key={type} value={type}>
                            {type.toUpperCase()}
                        </option>
                    ))}
                </select>

                {state.outputType === OutputType.FRONTMATTER && (
                    <input
                        type="text"
                        value={state.frontmatterKey}
                        onChange={(e) => setState(prev => ({ ...prev, frontmatterKey: e.target.value }))}
                        placeholder="Frontmatter key"
                    />
                )}

                <div className="calculation-actions">
                    <button
                        className="mod-cta"
                        onClick={executeCalculation}
                        disabled={!state.selectedColumn || (state.outputType === OutputType.FRONTMATTER && !state.frontmatterKey)}
                    >
                        {state.editingIndex !== null ? 'Update' : 'Save'}
                    </button>
                    <button className="mod-warning" onClick={resetForm}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="tableCalculation">
            <div className="tableCalculation-list">
                <div className="tableCalculation-header">
                    <h3>Table Calculations</h3>
                    <button 
                        className="mod-cta" 
                        onClick={() => setState(prev => ({ ...prev, isAdding: true }))}
                        disabled={state.isAdding || state.editingIndex !== null}
                    >
                        + Add Calculation
                    </button>
                </div>

                {/* 新增/编辑表单或已保存的计算列表 */}
                {(state.isAdding || state.editingIndex !== null) && renderCalculationForm()}
                
                {savedCalculations.map((calc, index) => (
                    state.editingIndex !== index && (
                        <div key={index} className="calculation-item">
                            <div className="calculation-info">
                                <span className="calculation-type">
                                    {calc.type.toUpperCase()}
                                </span>
                                <span className="calculation-column">
                                    on {calc.targetColumns.join(', ')}
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
                            <div className="calculation-actions">
                                <button
                                    className="mod-cta"
                                    onClick={() => startEditing(index)}
                                    disabled={state.isAdding || state.editingIndex !== null}
                                >
                                    Edit
                                </button>
                                <button
                                    className="mod-warning"
                                    onClick={() => manager.deleteCalculation(table.referenceId!, index)}
                                    disabled={state.isAdding || state.editingIndex !== null}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};