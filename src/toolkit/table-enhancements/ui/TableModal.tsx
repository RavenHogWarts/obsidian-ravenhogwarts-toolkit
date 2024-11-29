import { FC, useState } from "react"; 
import { IMarkdownTable, ITableGridData } from "../types/table";
import { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { TableEditor } from "./TableEditor";
import { useModal } from "@/src/ui/components/base/BaseModal";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const TableModal: FC = () => {
    const { additionalProps } = useModal();
    const tables = additionalProps?.tables as IMarkdownTable[] ?? [];

    const [selectedTableIndex, setSelectedTableIndex] = useState(0);

    if (tables.length === 0) {
        return (
            <div className="tableEnhancements-modal">
                <div className="tableEnhancements-modal-empty">
                    No tables found in the current document.
                </div>
            </div>
        );
    }

    const currentTable = tables[selectedTableIndex];

    // 转换表格数据为AG Grid格式
    const rowData: ITableGridData[] = currentTable.cells.map(row => {
        const rowObj: ITableGridData = {};
        row.forEach((cell, index) => {
            const field = currentTable.headers[index].field;
            rowObj[field] = cell.content;
        });
        return rowObj;
    });

    // 创建列定义
    const columnDefs: ColDef[] = currentTable.headers.map(header => ({
        field: header.field,
        headerName: header.headerName || header.content,
        sortable: header.sortable ?? true,
        filter: header.filterable ?? true,
        resizable: header.resizable ?? true,
        width: header.width,
        minWidth: header.minWidth || 100,
        maxWidth: header.maxWidth,
        hide: !header.visible,
    }));

    return(
        <div
            className="tableEnhancements-modal"
        >
            {tables.length > 1 && (
                <div className="tableEnhancements-modal-nav">
                    <select 
                        value={selectedTableIndex}
                        onChange={(e) => setSelectedTableIndex(Number(e.target.value))}
                    >
                        {tables.map((table, index) => (
                            <option key={index} value={index}>
                                Table {index + 1} {table.description ? `- ${table.description}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="tableEnhancements-modal-content">
                <div 
                    className="ag-theme-alpine" 
                    style={{ 
                        height: '400px', 
                        width: '100%' 
                    }}
                >
                    <AgGridReact
                        rowData={rowData}
                        columnDefs={columnDefs}
                        defaultColDef={{
                            flex: 1,
                            minWidth: 100,
                            sortable: true,
                            filter: true,
                            resizable: true,
                        }}
                        pagination={true}
                        paginationAutoPageSize={true}
                    />
                </div>
            </div>
        </div>
    );
 };

export default TableModal;