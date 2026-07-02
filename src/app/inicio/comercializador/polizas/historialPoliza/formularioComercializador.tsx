"use client";

import { useState, useEffect } from "react";
import { TextField, Autocomplete, Checkbox, FormControlLabel } from "@mui/material";
import type { ColumnDef } from "@tanstack/react-table";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import DataTable from "@/utils/ui/table/DataTable";
import SrtAPI from "@/data/srtAPI";
import Formato from "@/utils/Formato";
import type { Comercializador, HistorialRow } from "./types/historialPoliza";
import type { SRTComercializadorAsociado } from "@/app/inicio/comercializador/polizas/types/poliza";
import type { SRTComercializadoresHistorialPutRequest } from "@/data/srtAPI";
import CustomModalMessage from "@/utils/ui/message/CustomModalMessage";
import styles from "./formularioComercializador.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  empleadorCuit: string;
  empleadorRazonSocial: string;
  polizaInterno: number | undefined;
  numeroPoliza?: string;
  editRow?: HistorialRow;
  crearHistorial?: boolean;
};

const asociadosColumns: ColumnDef<SRTComercializadorAsociado>[] = [
  { accessorKey: "tipo", header: "Tipo", meta: { align: "left", width: 120 } },
  { accessorKey: "cuil", header: "CUIL", meta: { align: "left", width: 150 }, cell: (info) => Formato.CUIP(String(info.getValue() ?? "")), },
  { accessorKey: "razonSocial", header: "Comercializador", meta: { align: "left" } },
];

export default function FormularioComercializador({ open, onClose, onSuccess, empleadorCuit, empleadorRazonSocial, polizaInterno, numeroPoliza, editRow, crearHistorial }: Props) {
  const [comercializadorSeleccionado, setComercializadorSeleccionado] = useState<Comercializador | null>(null);
  const [asociadoSeleccionado, setAsociadoSeleccionado] = useState<SRTComercializadorAsociado | null>(null);
  const [seleccionarAsociados, setSeleccionarAsociados] = useState(false);
  const [fechaHasta, setFechaHasta] = useState("");
  const [saving, setSaving] = useState(false);
  const [resultado, setResultado] = useState<"success" | "error" | null>(null);

  const { data: comercializadoresRaw, isLoading } = SrtAPI.useGetComercializadorURL();
  const { data: asociadosRaw } = SrtAPI.useGetComercializadoresAsociadosURL(
    comercializadorSeleccionado ? { SRTComercializadorInterno: comercializadorSeleccionado.interno, IncluirInactivos: false } : {}
  );

  const comercializadores = ((comercializadoresRaw ?? []) as Comercializador[]).filter((c) => c.interno !== 0);
  const asociados = comercializadorSeleccionado ? (asociadosRaw ?? []) as SRTComercializadorAsociado[] : [];

  useEffect(() => {
    if (!open) {
      setComercializadorSeleccionado(null);
      setAsociadoSeleccionado(null);
      setSeleccionarAsociados(false);
      setFechaHasta("");
      return;
    }
    if (editRow && comercializadores.length > 0) {
      const com = comercializadores.find((c) => c.interno === editRow.srtComercializadorInterno) ?? null;
      setComercializadorSeleccionado(com);
      setFechaHasta(editRow.fechaHasta ? editRow.fechaHasta.slice(0, 10) : "");
    }
  }, [open, editRow, comercializadores.length]);

  const cuitFormateado = Formato.CUIP(empleadorCuit.replace(/\D/g, "")) || empleadorCuit;
  const titulo = editRow
    ? `Editar el historial del comercializador${numeroPoliza ? ` - Póliza: ${numeroPoliza}` : ""}`
    : crearHistorial
    ? `Nuevo registro de historial${numeroPoliza ? ` - Póliza: ${numeroPoliza}` : ""}`
    : `Modificar Comercializador${numeroPoliza ? ` - Póliza: ${numeroPoliza}` : ""}`;

  const handleGuardar = async () => {
    if (!comercializadorSeleccionado) return;
    setSaving(true);
    try {
      if (crearHistorial) {
        if (polizaInterno == null) return;
        const body: SRTComercializadoresHistorialPutRequest = {
          srtPolizaInterno: polizaInterno,
          srtComercializadorInterno: comercializadorSeleccionado.interno,
          srtComercializadorAsociadoInterno: seleccionarAsociados && asociadoSeleccionado ? asociadoSeleccionado.interno : null,
          fechaHasta: fechaHasta ? new Date(fechaHasta).toISOString() : new Date().toISOString(),
        };
        await SrtAPI.postSRTComercializadoresHistorial(body);
      } else if (editRow) {
        const body: SRTComercializadoresHistorialPutRequest = {
          srtPolizaInterno: editRow.srtPolizaInterno || (polizaInterno ?? 0),
          srtComercializadorInterno: comercializadorSeleccionado.interno,
          srtComercializadorAsociadoInterno: seleccionarAsociados && asociadoSeleccionado ? asociadoSeleccionado.interno : null,
          fechaHasta: fechaHasta ? new Date(fechaHasta).toISOString() : editRow.fechaHasta,
        };
        await SrtAPI.putSRTComercializadoresHistorial(editRow.interno, body);
      } else {
        if (polizaInterno == null) return;
        await SrtAPI.putSRTPolizaComercializador(polizaInterno, {
          srtComercializadorInterno: comercializadorSeleccionado.interno,
          srtComercializadorAsociadoInterno: seleccionarAsociados && asociadoSeleccionado ? asociadoSeleccionado.interno : null,
        } as { srtComercializadorInterno: number });
      }
      setResultado("success");
      onSuccess?.();
    } catch (e) {
      console.error("Error al guardar:", e);
      setResultado("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <CustomModalMessage
      open={resultado === "success"}
      type="success"
      title="Operación exitosa"
      message={crearHistorial ? `Se creó el registro de historial${numeroPoliza ? ` para la póliza ${numeroPoliza}` : ""}` : `Se modificó el comercializador a la póliza${numeroPoliza ? ` ${numeroPoliza}` : ""}`}
      onClose={() => { setResultado(null); onClose(); }}
    />
    <CustomModalMessage
      open={resultado === "error"}
      type="error"
      title="Hubo un inconveniente"
      message="No se pudo completar la operación. Intente nuevamente."
      onClose={() => setResultado(null)}
    />
    <CustomModal open={open} onClose={onClose} title={titulo} size="large">
      <div className={styles.topRow}>
        <TextField
          label="CUIL Empleador"
          value={cuitFormateado}
          disabled
          className={`${styles.disabledOpacity} ${styles.cuilField}`}
        />
        <TextField
          label="Razón Social Empleador"
          value={empleadorRazonSocial}
          disabled
          className={`${styles.disabledOpacity} ${styles.razonSocialField}`}
        />
        <Autocomplete
          options={comercializadores}
          loading={isLoading}
          getOptionLabel={(op) => `${Formato.CUIP(String(op.cuil).replace(/\D/g, "")) || op.cuil} - ${op.referenteRazonSocial}`}
          value={comercializadorSeleccionado}
          onChange={(_e, v) => {
            setComercializadorSeleccionado(v);
            setAsociadoSeleccionado(null);
            setSeleccionarAsociados(false);
          }}
          isOptionEqualToValue={(op, v) => op.interno === v.interno}
          renderInput={(params) => <TextField {...params} label="Comercializador" />}
          className={styles.autocompleteField}
        />
        {(editRow || crearHistorial) && (
          <TextField
            label="Fecha Finalización"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            className={styles.fechaField}
          />
        )}
      </div>


      <FormControlLabel
        control={
          <Checkbox
            checked={seleccionarAsociados}
            onChange={(e) => {
              setSeleccionarAsociados(e.target.checked);
              setAsociadoSeleccionado(null);
            }}
            disabled={!comercializadorSeleccionado}
          />
        }
        label="Seleccionar Asociados"
        className={styles.checkbox}
      />

      <div className={!seleccionarAsociados ? styles.tableDisabled : undefined}>
        <DataTable
          columns={asociadosColumns}
          data={asociados}
          pageSizeOptions={[5, 10]}
          onRowClick={seleccionarAsociados ? (row) => setAsociadoSeleccionado(row) : undefined}
          selectedRowKeyProp={seleccionarAsociados && asociadoSeleccionado ? String(asociadoSeleccionado.interno) : undefined}
          rowKeyField="interno"
        />
      </div>

      <div className={styles.actions}>
        <CustomButton
          onClick={handleGuardar}
          disabled={!comercializadorSeleccionado}
          isLoading={saving}
        >Guardar</CustomButton>
        <CustomButton color="secondary" onClick={onClose}>Cancelar</CustomButton>
      </div>
    </CustomModal>
    </>
  );
}
