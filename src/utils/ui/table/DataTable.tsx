// src/utils/ui/table/DataTable.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Box,
  IconButton,
  TextField,
  CircularProgress,
  Checkbox,
} from "@mui/material";

import {
  ArrowDownward,
  ArrowUpward,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  FirstPage,
  LastPage,
} from "@mui/icons-material";

import styles from "./DataTable.module.css";
import {DataTableProps, ColumnMeta} from "./types"



export function DataTable<TData extends object>({
  data,
  columns,
  pageSizeOptions,
  enableSorting = true,
  enableFiltering = true,
  size = "mid",
  isLoading = false,
  onRowClick,
  enableRowSelection = false,
  initialRowSelection = {},
  onRowSelectionChange,
  manualPagination = false,
  pageIndex: pageIndexProp,
  pageSize: pageSizeProp,
  pageCount: pageCountProp,
  onPageChange,
  onPageSizeChange,
  rowKeyField = "interno",
  selectedRowKeyProp,
  initialSelectedRowKey = null,
  onSelectedRowChange,
  persistSelectedRowKey = null,
}: DataTableProps<TData>) {

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Inicializar columnVisibility: ocultar columnas con hidden: true
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {  
    const visibility: VisibilityState = {};
    columns.forEach((col) => {
      const colDef = col as any;
      if (colDef.hidden === true) {
        const columnId = colDef.id || colDef.accessorKey;
        if (columnId) visibility[columnId] = false;
      }
    });
    return visibility;
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialRowSelection);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(
    selectedRowKeyProp ?? initialSelectedRowKey ?? null
  );

  // Paginación local interna (0-based)
  const [localPagination, setLocalPagination] = useState({
    pageIndex: pageIndexProp ? Math.max(0, pageIndexProp - 1) : 0,
    pageSize: pageSizeProp ?? pageSizeOptions?.[0] ?? 10,
  });

  // -------------------------
  // Sync props
  // -------------------------
  useEffect(() => {
    if (pageIndexProp !== undefined && pageIndexProp !== null) {
      const new0 = Math.max(0, pageIndexProp - 1);
      if (new0 !== localPagination.pageIndex) setLocalPagination(p => ({ ...p, pageIndex: new0 }));
    }
  }, [pageIndexProp]);

  useEffect(() => {
    if (pageSizeProp !== undefined && pageSizeProp !== localPagination.pageSize)
      setLocalPagination(p => ({ ...p, pageSize: pageSizeProp! }));
  }, [pageSizeProp]);

  useEffect(() => {
    if (selectedRowKeyProp !== undefined) setSelectedRowKey(selectedRowKeyProp);
  }, [selectedRowKeyProp]);

  // Persistencia localStorage
  useEffect(() => {
    if (!persistSelectedRowKey || selectedRowKeyProp || initialSelectedRowKey) return;
    const stored = localStorage.getItem(persistSelectedRowKey);
    if (stored) setSelectedRowKey(stored);
  }, []);

  useEffect(() => {
    if (!persistSelectedRowKey) return;
    if (selectedRowKey === null) localStorage.removeItem(persistSelectedRowKey);
    else localStorage.setItem(persistSelectedRowKey, selectedRowKey);
  }, [selectedRowKey, persistSelectedRowKey]);

  // -------------------------
  // Helpers
  // -------------------------
  const getRowKey = useCallback(
    (row: TData) => {
      const anyRow = row as any;
      if (rowKeyField in anyRow) return String(anyRow[rowKeyField]);
      if ("id" in anyRow) return String(anyRow["id"]);
      // fallback hash simple
      const s = JSON.stringify(row);
      let h = 0;
      for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
      return `hash_${Math.abs(h)}`;
    },
    [rowKeyField]
  );

  const selectionColumn: ColumnDef<TData, unknown> = {
    id: "select",
    size: 50,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={e => table.toggleAllRowsSelected(e.target.checked)}
        className={styles.selectionCheckbox}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        indeterminate={row.getIsSomeSelected()}
        onChange={row.getToggleSelectedHandler()}
        className={styles.selectionCheckbox}
        onClick={e => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: true,
  };

  const finalColumns = useMemo(() => (enableRowSelection ? [selectionColumn, ...columns] : columns), [
    enableRowSelection,
    columns,
  ]);

  // -------------------------
  // Tabla
  // -------------------------
  const table = useReactTable({
    data,
    columns: finalColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection,
      pagination: localPagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setLocalPagination,
    getCoreRowModel: getCoreRowModel(),
    ...(manualPagination
      ? {}
      : { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection,
    manualPagination,
    pageCount: manualPagination ? pageCountProp : undefined,
  });

  // -------------------------
  // Notificaciones
  // -------------------------
  useEffect(() => {
    onRowSelectionChange?.(table.getSelectedRowModel().flatRows.map(r => r.original));
  }, [rowSelection]);

  // -------------------------
  // Paginar 1-based
  // -------------------------
  const goToPage = (index0: number) => {
    table.setPageIndex(index0);
    onPageChange?.(index0 + 1);
  };

  const pageControls = {
    first: () => goToPage(0),
    prev: () => goToPage(Math.max(0, table.getState().pagination.pageIndex - 1)),
    next: () => goToPage(Math.min(table.getPageCount() - 1, table.getState().pagination.pageIndex + 1)),
    last: () => goToPage(table.getPageCount() - 1),
  };

  const cellPaddingClass = size === "small" ? styles.smallCell : styles.midCell;
  const headerPaddingClass = size === "small" ? styles.smallHeader : styles.midHeader;

  // -------------------------
  // Render
  // -------------------------
  return (
    <Box className={styles.tableContainer}>
      {enableFiltering && (
        <TextField
          label="Buscar en la tabla:"
          variant="outlined"
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className={styles.filterInput}
        />
      )}
      <TableContainer component={Paper} className={styles.paper}>
        <Table size={size === "small" ? "small" : undefined} className={styles.table}>
          <TableHead className={styles.tableHead}>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => {
                  const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                  const alignClass = styles[`align-${meta?.align || "left"}`] || styles["align-left"];
                  const widthStyle = meta?.width ? { width: typeof meta.width === 'number' ? `${meta.width}px` : meta.width } : {};
                  return (
                    <TableCell
                      key={header.id}
                      colSpan={header.colSpan}
                      className={`${styles.tableHeaderCell} ${headerPaddingClass} ${alignClass}`}
                      onClick={enableSorting && header.id !== "select" ? header.column.getToggleSortingHandler() : undefined}
                      style={{ 
                        cursor: enableSorting && header.id !== "select" ? "pointer" : "default",
                        ...widthStyle
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                        {enableSorting && header.column.getIsSorted() === "asc" && <ArrowUpward className={styles.sortIcon} />}
                        {enableSorting && header.column.getIsSorted() === "desc" && <ArrowDownward className={styles.sortIcon} />}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={finalColumns.length} className={styles.loadingCell}>
                  <CircularProgress />
                  <Box mt={2}>Cargando...</Box>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => {
                const key = getRowKey(row.original);
                const isSelected = key === selectedRowKey;
                return (
                  <TableRow
                    key={row.id}
                    className={`${styles.tableRow} ${isSelected ? styles.selectedRow : ""}`}
                    onClick={() => {
                      setSelectedRowKey(key);
                      onSelectedRowChange?.(key, row.original);
                      onRowClick?.(row.original);
                    }}
                    style={{ cursor: onRowClick ? "pointer" : "default" }}
                  >
                    {row.getVisibleCells().map(cell => {
                      const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                      const alignClass = styles[`align-${meta?.align || "left"}`] || styles["align-left"];
                      const widthStyle = meta?.width ? { width: typeof meta.width === 'number' ? `${meta.width}px` : meta.width } : {};
                      return (
                        <TableCell 
                          key={cell.id} 
                          className={`${styles.tableBodyCell} ${cellPaddingClass} ${alignClass} ${isSelected ? styles.selectedCell : ""}`}
                          style={widthStyle}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={finalColumns.length} className={styles.noDataCell}>
                  No se encontraron datos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box className={styles.paginationContainer}>
        <Box className={styles.paginationIcons}>
          <IconButton onClick={pageControls.first} disabled={!table.getCanPreviousPage()}>
            <FirstPage />
          </IconButton>
          <IconButton onClick={pageControls.prev} disabled={!table.getCanPreviousPage()}>
            <KeyboardArrowLeft />
          </IconButton>
          <IconButton onClick={pageControls.next} disabled={!table.getCanNextPage()}>
            <KeyboardArrowRight />
          </IconButton>
          <IconButton onClick={pageControls.last} disabled={!table.getCanNextPage()}>
            <LastPage />
          </IconButton>
        </Box>
        <Box>
          Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de{" "}
          <strong>{manualPagination ? pageCountProp ?? table.getPageCount() : table.getPageCount()}</strong>
        </Box>
      </Box>
    </Box>
  );
}

export default DataTable;
