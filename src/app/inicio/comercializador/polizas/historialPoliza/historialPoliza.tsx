"use client";

import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import { useAuth } from "@/data/AuthContext";
import CustomModalMessage from "@/utils/ui/message/CustomModalMessage";
import { MdEdit, MdGroupRemove } from "react-icons/md";
import { IoEyeSharp } from "react-icons/io5";
import DataTable from "@/utils/ui/table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import Formato from "@/utils/Formato";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModal from "@/utils/ui/form/CustomModal";
import FormularioComercializador from "./formularioComercializador";
import ModalVerPoliza from "./ModalVerPoliza";
import type { HistorialRow } from "./types/historialPoliza";
import SrtAPI from "@/data/srtAPI";
import styles from "./historialPoliza.module.css";

type Props = {
  data: HistorialRow[];
  isLoading: boolean;
  hasSelection: boolean;
  empleadorCuit: string;
  empleadorRazonSocial: string;
  polizaInterno: number | undefined;
  onSuccess: () => void;
};

export default function HistorialPoliza({ data, isLoading, hasSelection, empleadorCuit, empleadorRazonSocial, polizaInterno, onSuccess }: Props) {
  const { hasTask } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<HistorialRow | null>(null);
  const [bajaRow, setBajaRow] = useState<HistorialRow | null>(null);
  const [verPolizaId, setVerPolizaId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bajaResultado, setBajaResultado] = useState<"success" | "error" | null>(null);

  const columns: ColumnDef<HistorialRow>[] = [
    {
      accessorKey: "numeroPoliza",
      header: "Numero Poliza",
      meta: { align: "center", width: 150 },
      cell: (info) => Formato.Numero(Number(String(info.getValue() ?? "").replace(/\D/g, ""))) || String(info.getValue() ?? ""),
    },
    {
      accessorKey: "comercializadorCuil",
      header: "Cuil Comercializador",
      meta: { align: "center", width: 190 },
      cell: (info) => Formato.CUIP(String(info.getValue() ?? "")),
    },
    { accessorKey: "comercializadorReferenteRazonSocial", header: "Comercializador", meta: { align: "left" } },
    { accessorKey: "srtComercializadorAsociadoDescripcion", header: "Asociado", meta: { align: "left" } },
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
      meta: { align: "center", width: 200 },
      cell: ({ row }) => (
        <Box className={styles.actionButtons} sx={{ width: "100%" }}>
          {hasTask("Comercializador_Polizas_Historial_Editar") && (
          <IconButton size="medium" aria-label="Editar" onClick={(event) => { event.stopPropagation(); setEditRow(row.original); }}>
            <MdEdit title="Editar" className={styles.actionIcon} />
          </IconButton>
          )}
          {hasTask("Comercializador_Polizas_Historial_Baja") && (
          <IconButton size="medium" aria-label="Quitar" onClick={(event) => { event.stopPropagation(); setBajaRow(row.original); }}>
            <MdGroupRemove title="Quitar" className={styles.actionIcon} />
          </IconButton>
          )}
          <IconButton size="medium" aria-label="Ver Poliza Completa" onClick={(event) => { event.stopPropagation(); setVerPolizaId(row.original.interno); }}>
            <IoEyeSharp title="Ver Poliza Completa" className={styles.actionIcon} />
            </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <>
      {!hasSelection && <p className={styles.emptyMessage}>Seleccione una póliza para ver el historial.</p>}
      <DataTable
        columns={columns}
        data={data}
        pageSizeOptions={[5, 10, 20]}
        isLoading={isLoading}
      />
      <FormularioComercializador
        open={modalOpen}
        onClose={() => { setModalOpen(false); onSuccess(); }}
        empleadorCuit={empleadorCuit}
        empleadorRazonSocial={empleadorRazonSocial}
        polizaInterno={polizaInterno}
        numeroPoliza={data[0]?.numeroPoliza}
      />
      <FormularioComercializador
        open={!!editRow}
        onClose={() => { setEditRow(null); onSuccess(); }}
        empleadorCuit={empleadorCuit}
        empleadorRazonSocial={empleadorRazonSocial}
        polizaInterno={polizaInterno}
        numeroPoliza={editRow?.numeroPoliza}
        editRow={editRow ?? undefined}
      />
      <ModalVerPoliza historialId={verPolizaId} onClose={() => setVerPolizaId(null)} />
      <CustomModalMessage
        open={bajaResultado === "success"}
        type="success"
        title="Operación exitosa"
        message="Se eliminó la asociación del historial."
        onClose={() => setBajaResultado(null)}
      />
      <CustomModalMessage
        open={bajaResultado === "error"}
        type="error"
        title="Hubo un inconveniente"
        message="No se pudo eliminar la asociación. Intente nuevamente."
        onClose={() => setBajaResultado(null)}
      />
      <CustomModal open={!!bajaRow} onClose={() => setBajaRow(null)} title="Confirmar baja" size="small">
        <p>¿Está seguro que quiere eliminar esta asociacion del historial?</p>
        <div className={styles.actions}>
          <CustomButton
            isLoading={deleting}
            onClick={async () => {
              if (!bajaRow) return;
              setDeleting(true);
              try {
                await SrtAPI.deleteSRTComercializadoresHistorial(bajaRow.interno);
                setBajaRow(null);
                onSuccess();
                setBajaResultado("success");
              } catch (e) {
                console.error(e);
                setBajaRow(null);
                setBajaResultado("error");
              } finally {
                setDeleting(false);
              }
            }}
          >Aceptar</CustomButton>
          <CustomButton color="secondary" onClick={() => setBajaRow(null)}>Cancelar</CustomButton>
        </div>
      </CustomModal>
    </>
  );
}
