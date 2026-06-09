"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/utils/ui/table/DataTable";
import ArtAPI from "@/data/artAPI";
import { FechaHora, CUIP, Numero } from "@/utils/Formato";
import type { ApiFormularioRGRL } from "./types/rgrlLotes";
import styles from "./rgrlTable.module.css";
import { Empresa } from "@/data/authAPI";
import CustomButton from "@/utils/ui/button/CustomButton";
import { generarCodigoDatosGeneralesEstablecimiento } from "./codigos/DatosGeneralesEstablecimiento";

const PAGE_SIZE = 10;
const EMPRESA_TODAS_EMPRESAS_ID = -1;

const FORMULARIO_LABEL: Record<number, string> = {
  1: "Formulario A General",
  2: "Formulario B Construcción",
  3: "Formulario C Agro",
};

const columns: ColumnDef<ApiFormularioRGRL>[] = [
  { accessorKey: "interno", header: "Nro. Rta.", cell: ({ getValue }) => Numero(getValue<number>()), meta: { align: "center" } },
  {
    accessorKey: "internoFormulario",
    header: "Formulario",
    cell: ({ getValue }) => FORMULARIO_LABEL[getValue<number>() ?? 0] ?? getValue<number>(),
  },
  { accessorKey: "cuit", header: "CUIT", cell: ({ getValue }) => CUIP(getValue<string>()) },
  { accessorKey: "razonSocial", header: "Razón Social" },
  { accessorKey: "direccion",  header: "Establecimiento" },
  {
    accessorKey: "creacionFechaHora",
    header: "Fecha de Creación",
    cell: ({ getValue }) => FechaHora(getValue<string | null>(), "date"),
    meta: { align: "center" },
  },
  {
    accessorKey: "completadoFechaHora",
    header: "Fecha de Confirmación",
    cell: ({ getValue }) => FechaHora(getValue<string | null>(), "date"),
    meta: { align: "center" },
  },
];

interface RgrlTableProps {
  empresaSeleccionada: Empresa;
}

export default function RgrlTable({ empresaSeleccionada }: RgrlTableProps) {
  const [data, setData]           = useState<ApiFormularioRGRL[]>([]);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading]     = useState(false);
  const [selectedRows, setSelectedRows] = useState<ApiFormularioRGRL[]>([]);
  const [loadingIncorporar, setLoadingIncorporar] = useState(false);

  const empresasIdParaFiltro = useCallback((empresa: Empresa): number[] => {
    if (empresa.empresaId === EMPRESA_TODAS_EMPRESAS_ID) return [];
    return [empresa.empresaId];
  }, []);

  const load = useCallback(async (page: number, empresa: Empresa) => {
    setLoading(true);
    try {
      const res = await ArtAPI.getFormulariosRGRL({
        empresasId: empresasIdParaFiltro(empresa),
        pageIndex: page,
        pageSize: PAGE_SIZE,
        orderBy: "-creacionFechaHora",
        soloCompletados: true,
      });
      setData(res.data);
      setPageCount(res.pages);
    } finally {
      setLoading(false);
    }
  }, [empresasIdParaFiltro]);

  useEffect(() => {
    setPageIndex(1);
    load(1, empresaSeleccionada);
  }, [empresaSeleccionada, load]);

  const handlePageChange = useCallback((page: number) => {
    setPageIndex(page);
    load(page, empresaSeleccionada);
  }, [load, empresaSeleccionada]);

  const handleIncorporarMarcados = useCallback(async () => {
    setLoadingIncorporar(true);
    try {
      for (const rgrl of selectedRows) {
        const codigo = await generarCodigoDatosGeneralesEstablecimiento(rgrl);
        console.log(codigo);
      }
    } finally {
      setLoadingIncorporar(false);
    }
  }, [selectedRows]);

  const cols = useMemo(() => columns, []);

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <CustomButton onClick={handleIncorporarMarcados} isLoading={loadingIncorporar}>Incorporar marcados a Envío</CustomButton>
        <CustomButton>Quitar marcados del Envío</CustomButton>
      </div>
      <DataTable
        columns={cols}
        data={data}
        isLoading={loading}
        enableRowSelection
        onRowSelectionChange={setSelectedRows}
        manualPagination
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        pageCount={pageCount}
        onPageChange={handlePageChange}
        enableFiltering={false}
      />
    </div>
  );
}
