import React from "react";
import dayjs from "dayjs";
import { TextField } from "@mui/material";
import DatosTrabajador from "./cabecera/datosTrabajador";
import DatosEmpleador from "./cabecera/datosEmpleador";
import DatosSiniestro from "./cabecera/datosSiniestro";
import { PantallaAdministrativaProps } from "../pantallasAdministrativas/types/pantallaAdministrativa";
import trasladoStyles from "../pantallasAdministrativas/solicitudTraslado.module.css";

type ConstanciaProps = PantallaAdministrativaProps & {
    // campos médicos específicos pueden añadirse aquí
};

export default function ConstanciaAltaMedica({ denunciaNro, empleadoNombre, empleadoCuil }: ConstanciaProps) {
    const hoy = dayjs();
    const fecha = hoy.format("DD/MM/YYYY");
    const hora = hoy.format("HH:mm");

    return (
        <div className={trasladoStyles.container}>
            <div className={trasladoStyles.sectionBox}>
                <DatosTrabajador cuil={empleadoCuil ?? ""} nombre={empleadoNombre ?? ""} />
            </div>

            <div className={trasladoStyles.sectionBox}>
                <DatosEmpleador />
            </div>

            <div className={trasladoStyles.sectionBox}>
                <DatosSiniestro />
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div className={trasladoStyles.sectionTitle}>Comentarios</div>
                <TextField
                    label="Comentarios"
                    multiline
                    rows={4}
                    fullWidth
                    className={trasladoStyles.observacionesField}
                />
            </div>

        </div>
    );
}
