import { AgGridReact } from 'ag-grid-react';
import { CellValueChangedEvent, ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { FC, useCallback, useEffect, useState } from 'react';
import { ITableGridData } from '../../types/table';
import './styles/TableGrid.css';

interface TableGridProps {
    rowData: ITableGridData[];
    columnDefs: ColDef[];
    onCellValueChanged?: (params: CellValueChangedEvent) => void;
    isEditing?: boolean;
}

const defaultColDef: ColDef = {
    // 基础布局
    flex: 1,                    // 列宽度弹性系数，1表示均分剩余空间
    minWidth: 100,              // 最小列宽（像素）
    width: 150,                 // 默认列宽（像素）
    maxWidth: 300,              // 最大列宽（像素）
    
    // 功能开关
    sortable: true,             // 允许排序
    filter: false,               // 允许过滤
    resizable: true,            // 允许调整列宽
    editable: false,            // 是否可编辑
    
    // 单元格配置
    autoHeight: true,           // 自动行高
    wrapText: true,             // 文本自动换行
    
    // 排序配置
    sortingOrder: ['asc', 'desc', null], // 排序顺序
    unSortIcon: false,           // 显示未排序图标

    // 值格式化和编辑
    valueFormatter: params => `${params.value}`,
}

export const TableGrid: FC<TableGridProps> = ({
    rowData,
    columnDefs,
    onCellValueChanged,
    isEditing = false,
}) => {
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [isGridReady, setIsGridReady] = useState(false);

    const onGridReady = useCallback((params: GridReadyEvent) => {
        setGridApi(params.api);
        setIsGridReady(true);
    }, []);

    // 处理单元格值变化
    const handleCellValueChanged = useCallback((params: CellValueChangedEvent) => {
        if (onCellValueChanged) {
            onCellValueChanged(params);
        }
    }, [onCellValueChanged]);

    // 处理表格数据和列定义变化
    useEffect(() => {
        if (!gridApi || !isGridReady) return;

        const updateGrid = () => {
            // 更新列定义，根据编辑状态设置editable
            const updatedColumnDefs = columnDefs.map(col => ({
                ...col,
                editable: isEditing
            }));
            
            gridApi.setColumnDefs(updatedColumnDefs);
            gridApi.setRowData(rowData);
            
            requestAnimationFrame(() => {
                if (gridApi) {
                    gridApi.sizeColumnsToFit();
                }
            });
        };

        // 使用requestAnimationFrame确保DOM已更新
        requestAnimationFrame(updateGrid);
    }, [gridApi, isGridReady, rowData, columnDefs, isEditing]);

    // 监听窗口大小变化
    useEffect(() => {
        if (!gridApi || !isGridReady) return;

        const handleResize = () => {
            requestAnimationFrame(() => {
                if (gridApi) {
                    gridApi.sizeColumnsToFit();
                }
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [gridApi, isGridReady]);

    return (
        // <div 
        //     className="tableEnhancements-grid"
        // >
            <div 
                className="tableEnhancements-grid-wrapper ag-theme-balham"
                style={{ 
                    height: '400px', 
                    width: '100%',
                    overflow: 'auto',
                    minWidth: '200px',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}

                    // 事件处理
                    onGridReady={onGridReady}       // 网格就绪事件
                    onCellValueChanged={handleCellValueChanged}
                    // onSelectionChanged={onSelectionChanged} // 选择变化事件
                    // onCellClicked={(event) => {
                    //     onCellClicked?.(event);
                    //     handleMouseDown(event);
                    // }}   // 单元格点击事件
                    // onCellMouseOver={handleMouseMove}
                    // onRowClicked={onRowClicked}     // 行点击事件

                    // 编辑配置
                    stopEditingWhenCellsLoseFocus={true}

                    // 主题和布局
                    domLayout='normal'               // 布局模式：'normal'|'autoHeight'|'print'
                    enableRtl={false}                // 从右到左布局
                    headerHeight={25}                // 表头高度
                    rowHeight={25}                   // 行高

                    // 功能开关
                    animateRows={true}               // 启用行动画
                    enableCellTextSelection={false}   // 允许单元格文本选择
                    ensureDomOrder={true}            // 确保DOM顺序与数据顺序一致
                    suppressScrollOnNewData={true}   // 新数据时不自动滚动

                    // 选择配置
                    rowSelection={'multiple'}             // 行选择模式：'single'|'multiple'
                    suppressRowClickSelection={true} // 禁止点击时选择行  
                    suppressRowDeselection={true}    // 禁止取消行选择                 

                    // 排序和过滤
                    sortingOrder={['asc', 'desc']}   // 排序顺序
                    multiSortKey='ctrl'              // 多列排序快捷键

                    // 分页
                    pagination={false}                // 分页
                    paginationPageSize={10}          // 每页行数
                    suppressPaginationPanel={false}  // 隐藏分页面板

                    // 列管理
                    suppressMovableColumns={false}   // 禁止列移动
                    suppressDragLeaveHidesColumns={true} // 拖出不隐藏列

                    // 性能优化
                    rowBuffer={10}                   // 缓冲行数
                    suppressColumnVirtualisation={false} // 禁用列虚拟化
                />
            </div>
        // </div>
    );
};