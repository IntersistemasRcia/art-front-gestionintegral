import React from "react";
import { TextField } from "@mui/material";
import styles from "../../../denuncias.module.css";

type DatosTrabajadorProps = {
  cuil?: string | number | null;
  nombre?: string | null;
  docTipo?: string | null;
  docNumero?: string | number | null;
  fechaNacimiento?: string | null;
  sexo?: string | null;
  correo?: string | null;
  domicilioCalle?: string | null;
  domicilioNro?: string | number | null;
  domicilioPiso?: string | number | null;
  domicilioDpto?: string | null;
};

export default function DatosTrabajador({
  cuil,
  nombre,
  docTipo,
  docNumero,
  fechaNacimiento,
  sexo,
  correo,
  domicilioCalle,
  domicilioNro,
  domicilioPiso,
  domicilioDpto,
}: DatosTrabajadorProps) {
  return (
    <div>
      <div className={styles.sectionTitle}>Datos del trabajador</div>

      <div className={styles.formRow}>
        <div className={styles.compactField}>
          <TextField label="C.U.I.L." value={String(cuil ?? "")} fullWidth disabled />
        </div>
        <div className={styles.wideField}>
          <TextField label="Nombre" value={nombre ?? ""} fullWidth disabled />
        </div>
        <div className={styles.compactField}>
          <TextField label="Documento" value={docTipo ?? ""} fullWidth disabled />
        </div>
        <div className={styles.compactFieldSmall}>
          <TextField label="" value={String(docNumero ?? "")} fullWidth disabled />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.compactField}>
          <TextField label="Fecha nacimiento" value={fechaNacimiento ?? ""} fullWidth disabled />
        </div>
        <div className={styles.compactFieldSmall}>
          <TextField label="Sexo" value={sexo ?? ""} fullWidth disabled />
        </div>
        <div className={styles.wideField}>
          <TextField label="Correos" value={correo ?? ""} fullWidth disabled />
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
    </div>
  );
}
