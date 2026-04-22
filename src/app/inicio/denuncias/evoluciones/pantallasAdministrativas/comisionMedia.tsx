import React from "react";
import { TextField } from "@mui/material";
import styles from "../../denuncias.module.css";
import dayjs from "dayjs";
import { PantallaAdministrativaProps } from "./types/pantallaAdministrativa";

export default function ComisionMedica({ denunciaNro }: PantallaAdministrativaProps) {
  const hoy = dayjs();
  const fecha = hoy.format("DD/MM/YYYY");
  const hora = hoy.format("HH:mm");

  return (
    <>
      <div className={styles.formRow}>
        <div>
          <TextField label="Denuncia" value={denunciaNro ?? ""} fullWidth disabled />
        </div>
        <div>
          <TextField label="Fecha" value={fecha} fullWidth disabled />
        </div>
        <div>
          <TextField label="Hora" value={hora} fullWidth disabled />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.fullRowField}>
          <TextField label="Comentario" multiline rows={10} fullWidth />
        </div>
      </div>
    </>
  );
}
