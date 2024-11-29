import { FC, useState } from "react";
import { IMarkdownTable, ITableCell, ITableHeader } from "../types/table";
import { ColDef, GridApi } from 'ag-grid-community';
import { AgGridReact } from "ag-grid-react";

interface ITableEditorProps {
    table: IMarkdownTable;
    onTableChange: (updatedTable: IMarkdownTable) => void;
}

export const TableEditor: FC<ITableEditorProps> = ({
    table,
    onTableChange
}) => {
    const [gridApi, setGridApi] = useState<GridApi | null>(null);

    // 列定义
    const columnDefs: ColDef[] = [
        {
            field: 'field',
            headerName: 'Field',
            editable: true,
            width: 150,
        },
        {
            field: 'headerName',
            headerName: 'Header Name',
            editable: true,
            width: 150,
        },
        {
            field: 'alignment',
            headerName: 'Alignment',
            editable: true,
            cellEditor: 'agSelectCellEditor',
            cellEditorParams: {
                values: ['left', 'center', 'right'],
            },
            width: 120,
        },
        {
            field: 'sortable',
            headerName: 'Sortable',
            editable: true,
            cellEditor: 'agCheckboxCellEditor',
            width: 100,
        },
        {
            field: 'filterable',
            headerName: 'Filterable',
            editable: true,
            cellEditor: 'agCheckboxCellEditor',
            width: 100,
        },
        {
            field: 'resizable',
            headerName: 'Resizable',
            editable: true,
            cellEditor: 'agCheckboxCellEditor',
            width: 100,
        },
        {
            field: 'visible',
            headerName: 'Visible',
            editable: true,
            cellEditor: 'agCheckboxCellEditor',
            width: 100,
        },
        {
            field: 'width',
            headerName: 'Width',
            editable: true,
            type: 'numericColumn',
            width: 100,
        },
    ];

    // 转换表头数据为行数据
    const rowData = table.headers.map(header => ({
        field: header.field,
        headerName: header.headerName || header.content,
        alignment: header.alignment || 'left',
        sortable: header.sortable ?? true,
        filterable: header.filterable ?? true,
        resizable: header.resizable ?? true,
        visible: header.visible ?? true,
        width: header.width,
    }));

    // 处理单元格值变化
    const onCellValueChanged = (params: any) => {
        const updatedHeaders = table.headers.map((header, index) => {
            if (index === params.rowIndex) {
                return {
                    ...header,
                    [params.colDef.field]: params.newValue,
                };
            }
            return header;
        });

        onTableChange({
            ...table,
            headers: updatedHeaders,
        });
    };

    // 添加新列
    const addColumn = () => {
        const newHeader: ITableHeader = {
            field: `col${table.headers.length + 1}`,
            content: `Column ${table.headers.length + 1}`,
            alignment: 'left',
            sortable: true,
            filterable: true,
            resizable: true,
            visible: true,
        };

        const newCells: ITableCell[][] = table.cells.map(row => [
            ...row,
            { content: '' },
        ]);

        onTableChange({
            ...table,
            headers: [...table.headers, newHeader],
            cells: newCells,
        });
    };

    // 删除选中的列
    const deleteSelectedColumns = () => {
        if (!gridApi) return;

        const selectedNodes = gridApi.getSelectedNodes();
        const selectedIndexes = selectedNodes.map(node => node.rowIndex!);
        
        if (selectedIndexes.length === 0) return;

        const updatedHeaders = table.headers.filter((_, index) => 
            !selectedIndexes.includes(index)
        );

        const updatedCells = table.cells.map(row =>
            row.filter((_, index) => !selectedIndexes.includes(index))
        );

        onTableChange({
            ...table,
            headers: updatedHeaders,
            cells: updatedCells,
        });
    };

    return (
        <div className="tableEnhancements-editor">
            <div className="tableEnhancements-editor-toolbar">
                <button onClick={addColumn}>Add Column</button>
                <button onClick={deleteSelectedColumns}>Delete Selected</button>
            </div>
        </div>
    );
};
