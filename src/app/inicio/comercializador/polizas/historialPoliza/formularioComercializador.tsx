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
import styles from "./formularioComercializador.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  empleadorCuit: string;
  empleadorRazonSocial: string;
  polizaInterno: number | undefined;
  editRow?: HistorialRow;
};

const asociadosColumns: ColumnDef<SRTComercializadorAsociado>[] = [
  { accessorKey: "tipo", header: "Tipo", meta: { align: "left", width: 120 } },
  { accessorKey: "cuil", header: "CUIL", meta: { align: "left", width: 150 }, cell: (info) => Formato.CUIP(String(info.getValue() ?? "")), },
  { accessorKey: "razonSocial", header: "Comercializador", meta: { align: "left" } },
];

export default function FormularioComercializador({ open, onClose, empleadorCuit, empleadorRazonSocial, polizaInterno, editRow }: Props) {
  const [comercializadorSeleccionado, setComercializadorSeleccionado] = useState<Comercializador | null>(null);
  const [asociadoSeleccionado, setAsociadoSeleccionado] = useState<SRTComercializadorAsociado | null>(null);
  const [seleccionarAsociados, setSeleccionarAsociados] = useState(false);
  const [fechaHasta, setFechaHasta] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: comercializadoresRaw, isLoading } = SrtAPI.useGetComercializadorURL();
  const { data: asociadosRaw } = SrtAPI.useGetComercializadoresAsociadosURL(
    comercializadorSeleccionado ? { SRTComercializadorInterno: comercializadorSeleccionado.interno, IncluirInactivos: false } : {}
  );

  const comercializadores = ((comercializadoresRaw ?? []) as Comercializador[]).filter((c) => c.interno !== 0);
  const asociados = (asociadosRaw ?? []) as SRTComercializadorAsociado[];

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
  const titulo = editRow ? "Editar Historial Comercializador" : "Modificar Comercializador";

  const handleGuardar = async () => {
    if (!comercializadorSeleccionado) return;
    setSaving(true);
    try {
      if (editRow) {
        const body: SRTComercializadoresHistorialPutRequest = {
          srtPolizaInterno: editRow.srtPolizaInterno,
          srtComercializadorInterno: comercializadorSeleccionado.interno,
          srtComercializadorAsociadoInterno: seleccionarAsociados && asociadoSeleccionado ? asociadoSeleccionado.asociadoId : null,
          fechaHasta: fechaHasta ? new Date(fechaHasta).toISOString() : editRow.fechaHasta,
        };
        await SrtAPI.putSRTComercializadoresHistorial(editRow.interno, body);
      } else {
        if (polizaInterno == null) return;
        await SrtAPI.putSRTPolizaComercializador(polizaInterno, {
          srtComercializadorInterno: comercializadorSeleccionado.interno,
          srtComercializadorAsociadoInterno: seleccionarAsociados && asociadoSeleccionado ? asociadoSeleccionado.asociadoId : null,
        } as { srtComercializadorInterno: number });
      }
      onClose();
    } catch (e) {
      console.error("Error al guardar:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
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
  );
}
