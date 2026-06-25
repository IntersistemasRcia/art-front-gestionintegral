"use client";

import { useState } from "react";
import { TextField, Autocomplete, Checkbox, FormControlLabel } from "@mui/material";
import type { ColumnDef } from "@tanstack/react-table";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import DataTable from "@/utils/ui/table/DataTable";
import SrtAPI from "@/data/srtAPI";
import Formato from "@/utils/Formato";
import type { Comercializador, ComercializadorAsociado } from "./types/historialPoliza";
import styles from "./formularioComercializador.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  empleadorCuit: string;
  empleadorRazonSocial: string;
};

const asociadosColumns: ColumnDef<ComercializadorAsociado>[] = [
  { accessorKey: "tipo", header: "Tipo", meta: { align: "left", width: 120 } },
  { accessorKey: "cuil", header: "CUIL", meta: { align: "left", width: 150 }, cell: (info) => Formato.CUIP(String(info.getValue() ?? "")), },
  { accessorKey: "razonSocial", header: "Comercializador", meta: { align: "left" } },
];

export default function FormularioComercializador({ open, onClose, empleadorCuit, empleadorRazonSocial }: Props) {
  const [comercializadorSeleccionado, setComercializadorSeleccionado] = useState<Comercializador | null>(null);
  const [asociadoSeleccionado, setAsociadoSeleccionado] = useState<ComercializadorAsociado | null>(null);
  const [seleccionarAsociados, setSeleccionarAsociados] = useState(false);

  const { data: comercializadoresRaw, isLoading } = SrtAPI.useGetComercializadorURL();
  const comercializadores = ((comercializadoresRaw ?? []) as Comercializador[]).filter((c) => c.interno !== 0);

  const asociados = (comercializadorSeleccionado?.comercializadorAsociados ?? []).filter((a) => !a.fechaBaja && !a.deletedAt);

  const cuitFormateado = Formato.CUIP(empleadorCuit.replace(/\D/g, "")) || empleadorCuit;

  return (
    <CustomModal open={open} onClose={onClose} title="Modificar Comercializador" size="large">
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
        <CustomButton onClick={() => { }}>Guardar</CustomButton>
        <CustomButton color="secondary" onClick={onClose}>Cancelar</CustomButton>
      </div>
    </CustomModal>
  );
}
