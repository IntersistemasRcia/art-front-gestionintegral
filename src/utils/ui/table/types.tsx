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