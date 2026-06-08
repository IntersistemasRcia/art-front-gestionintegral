"use client";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/utils/ui/table/DataTable";
import SrtAPI, { type SRTEnvioRGRL } from "@/data/srtAPI";
import { FechaHora } from "@/utils/Formato";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import { TextField } from "@mui/material";
import { RiMailSendLine } from "react-icons/ri";
import styles from "./envioSrtEnvio.module.css";

const PAGE_SIZE = 10;

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

export default function EnvioSrtEnvio() {
  const [pageNumber, setPageNumber] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = SrtAPI.useGetSRTEnviosRGRL({
    PageNumber: pageNumber,
    PageSize: PAGE_SIZE,
    OrderBy: "-envioFechaHora",
  });

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

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        manualPagination
        pageIndex={pageNumber}
        pageSize={PAGE_SIZE}
        pageCount={data?.pages ?? 1}
        onPageChange={setPageNumber}
        enableFiltering={false}
      />
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
