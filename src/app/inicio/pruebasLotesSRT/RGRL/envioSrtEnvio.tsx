"use client";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/utils/ui/table/DataTable";
import DataTableDetail from "@/utils/ui/table/DataTableDetail";
import { type DataTableDetailColumn } from "@/utils/ui/table/types";
import SrtAPI, { type SRTEnvioRGRL, type SRTEnvioRGRLRespuesta } from "@/data/srtAPI";
import ArtAPI from "@/data/artAPI";
import { FechaHora, CUIP } from "@/utils/Formato";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import { TextField } from "@mui/material";
import { RiMailSendLine } from "react-icons/ri";
import styles from "./envioSrtEnvio.module.css";

const PAGE_SIZE = 10;
const DETALLE_PAGE_SIZE = 5;

const ARCHIVO_TIPO_LABEL: Record<string, string> = {
  SR: "Establecimientos",
  RB: "Datos generales de establecimientos",
  RC: "Cumplimiento de establecimientos",
  RI: "Incumplimiento de empleadores",
  RS: "Sustancias",
  RM: "Gremios",
  RO: "Contratistas",
  RH: "Responsables de datos",
  VI: "Visitas",
  RN: "Seguimientos de incumplimientos",
  RD: "Denuncias por incumplimientos",
};

const FORMULARIO_LABEL: Record<number, string> = {
  1: "Formulario A General",
  2: "Formulario B Construcción",
  3: "Formulario C Agro",
};

type FormularioResumen = {
  interno: number;
  internoFormulario: number;
  cuit: number;
  direccion: string;
};

type RespuestaConFormulario = SRTEnvioRGRLRespuesta & {
  formulario: FormularioResumen | null;
};

export default function EnvioSrtEnvio() {
  const [pageNumber, setPageNumber] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInterno, setSelectedInterno] = useState<number | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null);
  const [selectedRegistro, setSelectedRegistro] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<RespuestaConFormulario[]>([]);
  const [detallePageCount, setDetallePageCount] = useState(1);
  const [detallePage, setDetallePage] = useState(1);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const { data, isLoading } = SrtAPI.useGetSRTEnviosRGRL({
    PageNumber: pageNumber,
    PageSize: PAGE_SIZE,
    OrderBy: "-envioFechaHora",
  });

  const loadDetalle = async (interno: number, page: number) => {
    setLoadingDetalle(true);
    const res = await SrtAPI.getSRTEnviosRGRLRespuestas({ SrtenviosRgrlinterno: interno, PageNumber: page, PageSize: DETALLE_PAGE_SIZE });
    const rows = await Promise.all(
      res.data.map(async (r) => {
        const formulario = await ArtAPI.getFormularioRGRLById(r.respuestasFormularioInterno) as unknown as FormularioResumen;
        return { ...r, formulario };
      })
    );
    setDetalle(rows);
    setDetallePageCount(res.pages);
    setLoadingDetalle(false);
  };

  const handleRowClick = async (row: SRTEnvioRGRL) => {
    setSelectedInterno(row.interno);
    setSelectedTipo(ARCHIVO_TIPO_LABEL[row.archivoTipo] ?? row.archivoTipo);
    setSelectedRegistro(null);
    setDetallePage(1);
    loadDetalle(row.interno, 1);
  };

  const handleDetallePageChange = (page: number) => {
    setDetallePage(page);
    setSelectedRegistro(null);
    loadDetalle(selectedInterno!, page);
  };

  const columns: ColumnDef<SRTEnvioRGRL>[] = [
    { accessorKey: "interno",        header: "Nro. Envío",         meta: { align: "center" } },
    { accessorKey: "archivoTipo",    header: "Tipo",               cell: ({ getValue }) => ARCHIVO_TIPO_LABEL[getValue<string>()] ?? getValue<string>() },
    { accessorKey: "archivoNombre",  header: "Archivo" },
    { accessorKey: "envioFechaHora", header: "Fecha y Hora Envío", cell: ({ getValue }) => FechaHora(getValue<string | null>()), meta: { align: "center" } },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => row.original.envioFechaHora === null ? (
        <div className={styles.iconActions}>
          <RiMailSendLine className={styles.iconButton} onClick={() => setModalOpen(true)} />
        </div>
      ) : null,
      meta: { align: "center" },
      enableSorting: false,
    },
  ];

  const detalleColumns: DataTableDetailColumn<RespuestaConFormulario>[] = [
    { header: "Nro. Registro",   width: 110, render: r => r.interno },
    { header: "Nro. Envío",      width: 100, render: r => r.srtenviosRgrlinterno },
    { header: "Nro. Rta.",       width: 90,  render: r => r.respuestasFormularioInterno },
    { header: "Formulario",                  render: r => r.formulario ? (FORMULARIO_LABEL[r.formulario.internoFormulario] ?? r.formulario.internoFormulario) : "" },
    { header: "CUIT",            width: 140, render: r => r.formulario ? CUIP(String(r.formulario.cuit)) : "" },
    { header: "Establecimiento", align: "left", render: r => r.formulario?.direccion ?? "" },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        manualPagination
        pageIndex={pageNumber}
        pageSize={PAGE_SIZE}
        pageCount={data?.pages ?? 1}
        onPageChange={setPageNumber}
        enableFiltering={false}
      />
      {selectedInterno !== null && (
        <div className={styles.detalle}>
          {loadingDetalle ? (
            <span>cargando...</span>
          ) : (
            <DataTableDetail<RespuestaConFormulario>
              title={`Registros del envío ${selectedInterno}`}
              columns={detalleColumns}
              rows={detalle}
              rowKey={r => String(r.interno)}
              onRowClick={r => setSelectedRegistro(r.registro)}
              manualPagination
              pageCount={detallePageCount}
              onPageChange={handleDetallePageChange}
            />
          )}
          {selectedRegistro && (
            <TextField label={selectedTipo ?? ""} value={selectedRegistro} fullWidth disabled />
          )}
        </div>
      )}
      <CustomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Enviar correo"
        size="mid"
        actions={<CustomButton onClick={() => {}}>Enviar correo</CustomButton>}
      >
        <TextField label="Correo electrónico" type="email" fullWidth />
      </CustomModal>
    </>
  );
}
