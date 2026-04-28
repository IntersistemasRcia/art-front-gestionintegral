import dayjs from "dayjs";
import { TextField } from "@mui/material";
import styles from "./pantallasAdministrativas/solicitudTraslado.module.css";

type CabeceraComunProps = {
    denunciaNro?: string | number | null;
};

export default function CabeceraComun({ denunciaNro }: CabeceraComunProps) {
    const hoy = dayjs();
    return (
        <div className={styles.topRow}>
            <TextField label="Denuncia" value={denunciaNro ?? ""} disabled />
            <TextField label="Fecha" value={hoy.format("DD/MM/YYYY")} disabled />
            <TextField label="Hora" value={hoy.format("HH:mm")} disabled />
        </div>
    );
}
