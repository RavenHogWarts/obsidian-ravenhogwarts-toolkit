import { FC, useCallback, useEffect, useState } from "react"; 
import { IMarkdownTable, ITableCell, ITableGridData } from "../types/table";
import { CellValueChangedEvent, ColDef } from "ag-grid-community";
import { useModal } from "@/src/ui/components/base/BaseModal";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import { Logger } from "@/src/util/log";
import { TableGrid } from "./TableGrid";
import { TableEnhancementsManager } from "../manager/TableEnhancementsManager";
import { TableCalculation } from "./TableCalculation";

const TableModal: FC = () => {
    const { additionalProps } = useModal();
    const logger = additionalProps?.logger as Logger;
    const tables = additionalProps?.tables as IMarkdownTable[] ?? [];
    const manager = additionalProps?.manager as TableEnhancementsManager;
    const onSave = additionalProps?.onSave;

    const [selectedTableIndex, setSelectedTableIndex] = useState(0);
    const [editedTables, setEditedTables] = useState<IMarkdownTable[]>(tables);
    const [gridData, setGridData] = useState<ITableGridData[]>([]);
    const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
    const [showCalculation, setShowCalculation] = useState(false);

    // 获取当前表格
    const currentTable = editedTables[selectedTableIndex];

    // 更新表格数据和列定义
    useEffect(() => {
        if (!currentTable) return;

        // 更新列定义
        const newColumnDefs: ColDef[] = currentTable.headers.map(header => ({
            field: header.field,
            headerName: header.headerName || header.content,
            sortable: header.sortable ?? true,
            filter: header.filterable ?? true,
            resizable: header.resizable ?? true,
            editable: true,
        }));
        setColumnDefs(newColumnDefs);

        // 更新表格数据
        const newGridData: ITableGridData[] = currentTable.cells.map((row, rowIndex) => {
            const rowObj: ITableGridData = {
                __rowIndex: rowIndex,
            };
            row.forEach((cell, colIndex) => {
                const field = currentTable.headers[colIndex].field;
                rowObj[field] = cell.content;
            });
            return rowObj;
        });
        setGridData(newGridData);
    }, [currentTable]);

    // 同步外部数据变化
    useEffect(() => {
        setEditedTables(tables);
    }, [tables]);

    // 处理单元格值变化
    const handleCellValueChanged = useCallback((params: CellValueChangedEvent) => {
        const { data, colDef, newValue } = params;
        if (!data || !colDef.field) return;

        const rowIndex = data.__rowIndex;
        const field = colDef.field;

        // 找到对应的列索引
        const colIndex = currentTable.headers.findIndex(h => h.field === field);
        if (colIndex === -1) return;

        // 创建新的单元格数据
        const newCell: ITableCell = {
            content: newValue,
            alignment: currentTable.cells[rowIndex][colIndex].alignment
        };

        // 更新表格数据
        setEditedTables(prevTables => {
            const newTables = [...prevTables];
            const newTable = { ...newTables[selectedTableIndex] };
            const newCells = [...newTable.cells];
            newCells[rowIndex] = [...newCells[rowIndex]];
            newCells[rowIndex][colIndex] = newCell;
            newTable.cells = newCells;
            newTables[selectedTableIndex] = newTable;
            return newTables;
        });

        // 更新网格数据
        setGridData(prevData => {
            const newData = [...prevData];
            newData[rowIndex] = {
                ...newData[rowIndex],
                [field]: newValue,
                __rowIndex: rowIndex,
            };
            return newData;
        });
    }, [currentTable, selectedTableIndex]);

    // 处理表格选择变化
    const handleTableChange = useCallback((index: number) => {
        setSelectedTableIndex(index);
    }, []);

    // 处理表格计算
    const handleCalculate = useCallback((updatedTable: IMarkdownTable) => {
        setEditedTables(prevTables => {
            const newTables = [...prevTables];
            newTables[selectedTableIndex] = updatedTable;
            return newTables;
        });
    }, [selectedTableIndex]);

    // 处理保存
    const handleSave = useCallback(async () => {
        try {
            if (onSave) {
                await onSave(editedTables);
            }
        } catch (error) {
            logger?.error('Error saving tables:', error);
            throw error;
        }
    }, [onSave, editedTables, logger]);

    // 切换计算面板
    const toggleCalculation = useCallback(() => {
        setShowCalculation(prev => !prev);
    }, []);

    return (
        <div className="tableEnhancements-modal">
            {editedTables.length > 0 && (
                <>
                    <div className="tableEnhancements-modal-nav">
                        <select 
                            value={selectedTableIndex}
                            onChange={(e) => handleTableChange(Number(e.target.value))}
                        >
                            {editedTables.map((table, index) => (
                                <option key={index} value={index}>
                                    Table {index + 1} {table.referenceId ? `：${table.referenceId}` : ''}
                                </option>
                            ))}
                        </select>
                        <button 
                            className="mod-cta"
                            onClick={toggleCalculation}
                            style={{ marginLeft: '8px' }}
                        >
                            {showCalculation ? 'Hide Calculator' : 'Show Calculator'}
                        </button>
                        <button 
                            className="mod-cta"
                            onClick={handleSave}
                            style={{ marginLeft: '8px' }}
                        >
                            Save Changes
                        </button>
                    </div>

                    <div className="tableEnhancements-modal-content">
                        {currentTable ? (
                            <TableGrid
                                rowData={gridData}
                                columnDefs={columnDefs}
                                onCellValueChanged={handleCellValueChanged}
                            />
                        ) : (
                            <div className="tableEnhancements-no-data">
                                No table data available
                            </div>
                        )}
                    </div>

                    {showCalculation && currentTable && manager && (
                        <TableCalculation
                            table={currentTable}
                            manager={manager}
                            onCalculate={handleCalculate}
                            logger={logger}
                        />
                    )}
                </>
            )}

            
        </div>
    );
 };

export default TableModal;