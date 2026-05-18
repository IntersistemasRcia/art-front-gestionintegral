"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/utils/ui/table/DataTable";
import type { ParametroEntidad } from "@/data/authAPI";

type ParametrosTableProps = {
  data: ParametroEntidad[];
  isLoading: boolean;
};

export const ParametrosTable = ({ data, isLoading }: ParametrosTableProps) => {
  const columns = useMemo<ColumnDef<ParametroEntidad>[]>(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        meta: { align: "center", width: "80px" },
      },
      {
        header: "Entidad ID",
        accessorKey: "entidadId",
        meta: { align: "center", width: "110px" },
      },
      {
        header: "Tipo entidad",
        accessorKey: "entidadTipo",
        meta: { align: "left" },
      },
      {
        header: "Parámetro ID",
        accessorKey: "parametroId",
        meta: { align: "center", width: "120px" },
      },
      {
        header: "Parámetro",
        accessorKey: "parametroNombre",
        meta: { align: "left" },
      },
      {
        header: "Valor",
        accessorKey: "valor",
        meta: { align: "left" },
      },
    ],
    []
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      rowKeyField="id"
    />
  );
};
