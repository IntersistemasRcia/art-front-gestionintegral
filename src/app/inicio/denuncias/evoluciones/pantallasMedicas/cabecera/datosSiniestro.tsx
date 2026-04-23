import React from "react";
import { TextField } from "@mui/material";
import styles from "../../../denuncias.module.css";

type DatosSiniestroProps = {
  dia?: string | null;
  hora?: string | null;
  inicioInasistencia?: string | null;
  descripcion?: string | null;
};

export default function DatosSiniestro({ dia, hora, inicioInasistencia, descripcion }: DatosSiniestroProps) {
  return (
    <div>
      <div className={styles.sectionTitle}>Siniestro:</div>

      <div className={styles.formRow}>
        <div>
          <TextField label="El día:" value={dia ?? ""} fullWidth disabled />
        </div>
        <div>
          <TextField label="A las:" value={hora ?? ""} fullWidth disabled />
        </div>
        <div>
          <TextField label="Inicio de inasistencia:" value={inicioInasistencia ?? ""} fullWidth disabled />
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <TextField label="" value={descripcion ?? ""} multiline rows={4} fullWidth disabled />
      </div>
    </div>
  );
}
