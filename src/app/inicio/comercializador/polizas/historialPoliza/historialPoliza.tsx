"use client";

import { useState } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { MdEdit, MdGroupRemove } from "react-icons/md";
import DataTable from "@/utils/ui/table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import Formato from "@/utils/Formato";
import CustomButton from "@/utils/ui/button/CustomButton";
import FormularioComercializador from "./formularioComercializador";
import type { HistorialRow } from "./types/historialPoliza";
import styles from "./historialPoliza.module.css";

type Props = {
  data: HistorialRow[];
  isLoading: boolean;
  hasSelection: boolean;
  empleadorCuit: string;
  empleadorRazonSocial: string;
};

const columns: ColumnDef<HistorialRow>[] = [
  {
    accessorKey: "numeroPoliza",
    header: "Numero Poliza",
    meta: { align: "center", width: 150 },
    cell: (info) => Formato.Numero(Number(String(info.getValue() ?? "").replace(/\D/g, ""))) || String(info.getValue() ?? ""),
  },
  {
    accessorKey: "cuil",
    header: "Cuil Comercializador",
    meta: { align: "center", width: 190 },
    cell: (info) => Formato.CUIP(String(info.getValue() ?? "")),
  },
  { accessorKey: "razonSocial", header: "Comercializador", meta: { align: "left" } },
  {
    accessorKey: "fechaHasta",
    header: "Fecha Finalizacion",
    meta: { align: "center", width: 180 },
    cell: (info) => {
      const v = String(info.getValue() ?? "");
      return Formato.Fecha(v) || v;
    },
  },
  {
    id: "accion",
    header: "Acción",
    meta: { align: "center", width: 150 },
    cell: () => (
      <Box className={styles.actionButtons} sx={{ width: "100%" }}>
        <Tooltip title="Editar" arrow>
          <IconButton size="medium" aria-label="Editar" onClick={(event) => event.stopPropagation()}>
            <MdEdit className={styles.actionIcon} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Quitar" arrow>
          <IconButton size="medium" aria-label="Quitar" onClick={(event) => event.stopPropagation()}>
            <MdGroupRemove className={styles.actionIcon} />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  },
];

export default function HistorialPoliza({ data, isLoading, hasSelection, empleadorCuit, empleadorRazonSocial }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!hasSelection) {
    return <p className={styles.emptyMessage}>Seleccione una póliza para ver el historial.</p>;
  }

  return (
    <>
      <div className={styles.toolbar}>
        <CustomButton onClick={() => setModalOpen(true)}>Modificar Comercializador</CustomButton>
      </div>
      <DataTable
        columns={columns}
        data={data}
        pageSizeOptions={[5, 10, 20]}
        isLoading={isLoading}
      />
      <FormularioComercializador
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        empleadorCuit={empleadorCuit}
        empleadorRazonSocial={empleadorRazonSocial}
      />
    </>
  );
}
