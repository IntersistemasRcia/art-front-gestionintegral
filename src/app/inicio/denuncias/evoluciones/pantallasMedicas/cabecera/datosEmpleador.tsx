import React from "react";
import { TextField } from "@mui/material";
import styles from "../../../denuncias.module.css";

type DatosEmpleadorProps = {
  cuit?: string | number | null;
  razonSocial?: string | null;
  domicilioCalle?: string | null;
  domicilioNro?: string | number | null;
  domicilioPiso?: string | number | null;
  domicilioDpto?: string | null;
  telefonos?: string | null;
  correos?: string | null;
};

export default function DatosEmpleador({
  cuit,
  razonSocial,
  domicilioCalle,
  domicilioNro,
  domicilioPiso,
  domicilioDpto,
  telefonos,
  correos,
}: DatosEmpleadorProps) {
  return (
    <div>
      <div className={styles.sectionTitle}>Datos del empleador</div>

      <div className={styles.formRow}>
        <div className={styles.compactField}>
          <TextField label="C.U.I.T." value={String(cuit ?? "")} fullWidth disabled />
        </div>
        <div className={styles.wideField}>
          <TextField label="Razón social" value={razonSocial ?? ""} fullWidth disabled />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.wideField}>
          <TextField label="Domicilio: Calle" value={domicilioCalle ?? ""} fullWidth disabled />
        </div>
        <div className={styles.compactField}>
          <TextField label="Nro" value={String(domicilioNro ?? "")} fullWidth disabled />
        </div>
        <div className={styles.compactField}>
          <TextField label="Piso" value={String(domicilioPiso ?? "")} fullWidth disabled />
        </div>
        <div className={styles.compactFieldSmall}>
          <TextField label="Dpto" value={domicilioDpto ?? ""} fullWidth disabled />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.wideField}>
          <TextField label="Teléfonos" value={telefonos ?? ""} fullWidth disabled />
        </div>
        <div className={styles.wideField}>
          <TextField label="Correos" value={correos ?? ""} fullWidth disabled />
        </div>
      </div>
    </div>
  );
}
