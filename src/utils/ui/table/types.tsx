import React from 'react';

export type DataTableDetailColumn<T> = {
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => React.ReactNode;
};

export type DataTableDetailProps<T> = {
  columns: DataTableDetailColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  pageSize?: number;
  title?: string;
  groupBy?: (row: T) => string;
  groupOrder?: (row: T) => number;
  onRowClick?: (row: T) => void;
  manualPagination?: boolean;
  pageCount?: number;
  onPageChange?: (page: number) => void;
};
import {
  ColumnDef,
  RowSelectionState,
} from "@tanstack/react-table";

export type ColumnMeta = {
     align?: "left" | "center" | "right" | "justify";
     width?: string | number;
    };

export interface DataTableProps<TData extends object> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  pageSizeOptions?: number[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  size?: "mid" | "small";
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;

  enableRowSelection?: boolean;
  initialRowSelection?: RowSelectionState;
  onRowSelectionChange?: (selectedRows: TData[]) => void;

  manualPagination?: boolean;
  pageIndex?: number | null; // 1-based
  pageSize?: number;
  pageCount?: number;
  onPageChange?: (newPageIndex1Based: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;

  rowKeyField?: string;
  selectedRowKeyProp?: string | null;
  initialSelectedRowKey?: string | null;
  onSelectedRowChange?: (selectedKey: string | null, row?: TData) => void;
  persistSelectedRowKey?: string | null;
}