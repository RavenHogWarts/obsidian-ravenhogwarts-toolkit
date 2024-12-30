import { FC, useCallback, useEffect, useState } from "react";
import { ISavedCalculation, OutputType } from "../types/operations";
import { IMarkdownTable } from "../types/table";
import { Logger } from "@/src/util/log";
import { TableEnhancementsManager } from "../manager/TableEnhancementsManager";
import { CirclePlay, CircleX, PencilLine } from "lucide-react";
import { BaseModal } from "@/src/ui/components/base/BaseModal";

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
    const [modal, setModal] = useState<BaseModal | null>(null);

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
        const modal = new BaseModal(
            manager.getApp(),
            manager.getPlugin(),
            () => import('./FormulaModal'),
            {
                initialFormula: calculation.config.formula,
                initialOutput: calculation.config.output.type,
                initialOutputValue: calculation.config.output.value,
                isEditing: true,
                onSubmit: async (newCalculation) => {
                    try {
                        setIsLoading(true);
                        await manager.executeAndSaveCalculation(table, newCalculation, index);
                        setSavedCalculations(manager.getSavedCalculations(table.referenceId));
                        onCalculate(table);
                        modal.close();
                    } catch (error) {
                        logger.error('Error updating calculation:', error);
                    } finally {
                        setIsLoading(false);
                    }
                },
                onClose: () => modal.close()
            },
            'modal-size-medium'
        );
        modal.open();
        setModal(modal);
    }, [savedCalculations, table, manager, logger, onCalculate]);

    // 开始添加新计算
    const startAdding = useCallback(() => {
        const modal = new BaseModal(
            manager.getApp(),
            manager.getPlugin(),
            () => import('./FormulaModal'),
            {
                isEditing: false,
                onSubmit: async (calculation) => {
                    try {
                        setIsLoading(true);
                        await manager.executeAndSaveCalculation(table, calculation);
                        setSavedCalculations(manager.getSavedCalculations(table.referenceId));
                        onCalculate(table);
                        modal.close();
                    } catch (error) {
                        logger.error('Error adding calculation:', error);
                    } finally {
                        setIsLoading(false);
                    }
                },
                onClose: () => modal.close()
            },
            'modal-size-medium'
        );
        modal.open();
        setModal(modal);
    }, [table, manager, logger, onCalculate]);

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
            <div className="tableEnhancements-calculation-actions">
                <button
                    className="tableEnhancements-btn"
                    onClick={startAdding}
                    disabled={isLoading}
                >
                    Add Calculation
                </button>
            </div>

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
        </div>
    );
};