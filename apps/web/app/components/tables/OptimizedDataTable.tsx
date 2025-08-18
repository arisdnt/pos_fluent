// ======================================================================
// OPTIMIZED DATA TABLE
// Komponen tabel yang dioptimasi untuk data besar menggunakan TanStack Table
// ======================================================================

'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  ExpandedState,
  PaginationState,
  Row
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Card,
  Button,
  Text,
  Input,
  Dropdown,
  Option,
  Field,
  Spinner,
  Badge,
  Checkbox,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Divider,
  ProgressBar
} from '@fluentui/react-components';
import {
  ChevronUp24Regular,
  ChevronDown24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  Search24Regular,
  Filter24Regular,
  ArrowSort24Regular,
  Eye24Regular,
  EyeOff24Regular,
  Download24Regular,
  Refresh24Regular,
  MoreHorizontal24Regular
} from '@fluentui/react-icons';
import { cn } from '@/lib/utils/cn';

// ======================================================================
// TYPES
// ======================================================================

interface OptimizedDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableVirtualization?: boolean;
  enableRowSelection?: boolean;
  enableColumnVisibility?: boolean;
  enableExpanding?: boolean;
  pageSize?: number;
  maxHeight?: number;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  renderSubComponent?: (props: { row: Row<T> }) => React.ReactElement;
  className?: string;
}

interface TableStats {
  totalRows: number;
  filteredRows: number;
  selectedRows: number;
  currentPage: number;
  totalPages: number;
  renderTime: number;
}

// ======================================================================
// PERFORMANCE MONITORING
// ======================================================================

const usePerformanceMonitor = () => {
  const [renderTime, setRenderTime] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    return performance.now();
  }, []);

  const endMonitoring = useCallback((startTime: number) => {
    const endTime = performance.now();
    setRenderTime(endTime - startTime);
    setIsMonitoring(false);
  }, []);

  return { renderTime, isMonitoring, startMonitoring, endMonitoring };
};

// ======================================================================
// OPTIMIZED DATA TABLE COMPONENT
// ======================================================================

export function OptimizedDataTable<T>({
  data,
  columns,
  isLoading = false,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableVirtualization = false,
  enableRowSelection = false,
  enableColumnVisibility = true,
  enableExpanding = false,
  pageSize = 50,
  maxHeight = 600,
  searchPlaceholder = "Cari data...",
  onRowClick,
  onRowSelect,
  onExport,
  onRefresh,
  renderSubComponent,
  className
}: OptimizedDataTableProps<T>) {
  // ======================================================================
  // STATE
  // ======================================================================

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize
  });
  const [globalFilter, setGlobalFilter] = useState('');
  
  const { renderTime, startMonitoring, endMonitoring } = usePerformanceMonitor();

  // ======================================================================
  // MEMOIZED COLUMNS
  // ======================================================================

  const memoizedColumns = useMemo(() => {
    let tableColumns = [...columns];

    // Add row selection column if enabled
    if (enableRowSelection) {
      tableColumns.unshift({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 50,
        enableSorting: false,
        enableHiding: false
      });
    }

    // Add expand column if enabled
    if (enableExpanding && renderSubComponent) {
      tableColumns.unshift({
        id: 'expander',
        header: () => null,
        cell: ({ row }) => (
          row.getCanExpand() ? (
            <Button
              appearance="subtle"
              size="small"
              icon={row.getIsExpanded() ? <ChevronDown24Regular /> : <ChevronRight24Regular />}
              onClick={row.getToggleExpandedHandler()}
            />
          ) : null
        ),
        size: 50,
        enableSorting: false,
        enableHiding: false
      });
    }

    return tableColumns;
  }, [columns, enableRowSelection, enableExpanding, renderSubComponent]);

  // ======================================================================
  // TABLE INSTANCE
  // ======================================================================

  const table = useReactTable({
    data,
    columns: memoizedColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      expanded,
      pagination,
      globalFilter
    },
    enableRowSelection,
    enableExpanding,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getExpandedRowModel: enableExpanding ? getExpandedRowModel() : undefined,
    getSubRows: enableExpanding ? (row: any) => row.subRows : undefined,
    debugTable: process.env.NODE_ENV === 'development'
  });

  // ======================================================================
  // VIRTUALIZATION
  // ======================================================================

  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  
  const rows = enablePagination 
    ? table.getRowModel().rows 
    : table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50,
    enabled: enableVirtualization && !enablePagination
  });

  // ======================================================================
  // EFFECTS
  // ======================================================================

  useEffect(() => {
    const startTime = startMonitoring();
    
    // Simulate render completion
    const timer = setTimeout(() => {
      endMonitoring(startTime);
    }, 0);

    return () => clearTimeout(timer);
  }, [data, sorting, columnFilters, globalFilter, startMonitoring, endMonitoring]);

  useEffect(() => {
    if (onRowSelect && enableRowSelection) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);
      onRowSelect(selectedRows);
    }
  }, [rowSelection, onRowSelect, enableRowSelection, table]);

  // ======================================================================
  // HANDLERS
  // ======================================================================

  const handleRowClick = useCallback((row: Row<T>) => {
    if (onRowClick) {
      onRowClick(row.original);
    }
  }, [onRowClick]);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
    }
  }, [onExport]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // ======================================================================
  // STATS
  // ======================================================================

  const stats: TableStats = useMemo(() => ({
    totalRows: data.length,
    filteredRows: table.getFilteredRowModel().rows.length,
    selectedRows: Object.keys(rowSelection).length,
    currentPage: table.getState().pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    renderTime
  }), [data.length, table, rowSelection, renderTime]);

  // ======================================================================
  // RENDER FUNCTIONS
  // ======================================================================

  const renderTableHeader = () => (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {enableFiltering && (
            <Field>
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                contentBefore={<Search24Regular />}
                className="w-64"
              />
            </Field>
          )}
          
          {enableColumnVisibility && (
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button
                  appearance="outline"
                  icon={<Eye24Regular />}
                >
                  Kolom
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {table.getAllLeafColumns().map(column => {
                    if (!column.getCanHide()) return null;
                    return (
                      <MenuItem key={column.id}>
                        <Checkbox
                          checked={column.getIsVisible()}
                          onChange={column.getToggleVisibilityHandler()}
                          label={typeof column.columnDef.header === 'string' 
                            ? column.columnDef.header 
                            : column.id
                          }
                        />
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </MenuPopover>
            </Menu>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              appearance="outline"
              icon={<Refresh24Regular />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          )}
          
          {onExport && (
            <Button
              appearance="outline"
              icon={<Download24Regular />}
              onClick={handleExport}
            >
              Export
            </Button>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <Text size={200}>
          Total: {stats.totalRows.toLocaleString('id-ID')} data
        </Text>
        <Text size={200}>
          Ditampilkan: {stats.filteredRows.toLocaleString('id-ID')} data
        </Text>
        {enableRowSelection && stats.selectedRows > 0 && (
          <Text size={200}>
            Dipilih: {stats.selectedRows} data
          </Text>
        )}
        {enablePagination && (
          <Text size={200}>
            Halaman: {stats.currentPage} dari {stats.totalPages}
          </Text>
        )}
        {process.env.NODE_ENV === 'development' && (
          <Text size={200}>
            Render: {renderTime.toFixed(2)}ms
          </Text>
        )}
      </div>
    </div>
  );

  const renderTable = () => {
    if (enableVirtualization && !enablePagination) {
      return (
        <div
          ref={tableContainerRef}
          className="overflow-auto"
          style={{ height: maxHeight }}
        >
          <div style={{ height: rowVirtualizer.getTotalSize() }}>
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-gray-200">
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left font-semibold text-gray-900"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              'flex items-center gap-2',
                              header.column.getCanSort() && 'cursor-pointer select-none hover:text-blue-600'
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {enableSorting && header.column.getCanSort() && (
                              <span className="text-gray-400">
                                {header.column.getIsSorted() === 'asc' ? (
                                  <ChevronUp24Regular className="w-4 h-4" />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ChevronDown24Regular className="w-4 h-4" />
                                ) : (
                                  <ArrowSort24Regular className="w-4 h-4" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rowVirtualizer.getVirtualItems().map(virtualRow => {
                  const row = rows[virtualRow.index];
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-b border-gray-100 hover:bg-gray-50',
                        onRowClick && 'cursor-pointer',
                        row.getIsSelected() && 'bg-blue-50'
                      )}
                      style={{
                        height: virtualRow.size,
                        transform: `translateY(${virtualRow.start}px)`
                      }}
                      onClick={() => handleRowClick(row)}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full">
          <thead className="sticky top-0 bg-white z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-semibold text-gray-900"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          'flex items-center gap-2',
                          header.column.getCanSort() && 'cursor-pointer select-none hover:text-blue-600'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {enableSorting && header.column.getCanSort() && (
                          <span className="text-gray-400">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp24Regular className="w-4 h-4" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown24Regular className="w-4 h-4" />
                            ) : (
                              <ArrowSort24Regular className="w-4 h-4" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <React.Fragment key={row.id}>
                <tr
                  className={cn(
                    'border-b border-gray-100 hover:bg-gray-50',
                    onRowClick && 'cursor-pointer',
                    row.getIsSelected() && 'bg-blue-50'
                  )}
                  onClick={() => handleRowClick(row)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {row.getIsExpanded() && renderSubComponent && (
                  <tr>
                    <td colSpan={row.getVisibleCells().length} className="p-0">
                      {renderSubComponent({ row })}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPagination = () => {
    if (!enablePagination) return null;

    return (
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Text size={200} className="text-gray-600">
              Menampilkan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, stats.filteredRows)} dari {stats.filteredRows} data
            </Text>
            
            <Field label="Baris per halaman:">
              <Dropdown
                value={table.getState().pagination.pageSize.toString()}
                onOptionSelect={(e, data) => {
                  table.setPageSize(Number(data.optionValue));
                }}
              >
                <Option value="10">10</Option>
                <Option value="25">25</Option>
                <Option value="50">50</Option>
                <Option value="100">100</Option>
                <Option value="200">200</Option>
              </Dropdown>
            </Field>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              appearance="outline"
              size="small"
              icon={<ChevronLeft24Regular />}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Sebelumnya
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, table.getPageCount()) }, (_, i) => {
                const pageIndex = Math.max(0, table.getState().pagination.pageIndex - 2) + i;
                if (pageIndex >= table.getPageCount()) return null;
                
                return (
                  <Button
                    key={pageIndex}
                    appearance={pageIndex === table.getState().pagination.pageIndex ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => table.setPageIndex(pageIndex)}
                  >
                    {pageIndex + 1}
                  </Button>
                );
              })}
            </div>
            
            <Button
              appearance="outline"
              size="small"
              icon={<ChevronRight24Regular />}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ======================================================================
  // MAIN RENDER
  // ======================================================================

  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <Spinner size="large" />
            <Text className="mt-4 block">Memuat data...</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {renderTableHeader()}
      {renderTable()}
      {renderPagination()}
    </Card>
  );
}

// ======================================================================
// EXPORT
// ======================================================================

export default OptimizedDataTable;
export type { OptimizedDataTableProps, TableStats };