import { useState } from "react";
import { TextField } from "@mui/material";
import DatosTrabajador from "./cabecera/datosTrabajador";
import DatosEmpleador from "./cabecera/datosEmpleador";
import DatosEstablecimiento from "./cabecera/datosEstablecimiento";
import DatosSiniestro from "./cabecera/datosSiniestro";
import { PantallaAdministrativaProps } from "../pantallasAdministrativas/types/pantallaAdministrativa";
import CabeceraComun from "../CabeceraComun";
import trasladoStyles from "../pantallasAdministrativas/solicitudTraslado.module.css";
import denunciasStyles from "../../denuncias.module.css";

type ParteMedicoIngresoProps = PantallaAdministrativaProps;

export default function ParteMedicoIngreso({ denunciaNro, empleadoCuil, empleadoNombre, cabecera }: ParteMedicoIngresoProps) {
    const trabajador = cabecera?.trabajador;
    const empleador = cabecera?.empleador;
    const establecimiento = cabecera?.establecimiento;
    const siniestro = cabecera?.siniestro;
    const [fecha, setFecha] = useState("");
    const [hora, setHora] = useState("");
    const [comentario, setComentario] = useState("");

    return (
        <div className={trasladoStyles.container}>
            <CabeceraComun denunciaNro={denunciaNro} />
            <div className={trasladoStyles.sectionBox}>
                <DatosTrabajador
                    cuil={trabajador?.cuil ?? empleadoCuil ?? ""}
                    nombre={trabajador?.nombre ?? empleadoNombre ?? ""}
                    docTipo={trabajador?.docTipo}
                    docNumero={trabajador?.docNumero}
                    fechaNacimiento={trabajador?.fechaNacimiento}
                    sexo={trabajador?.sexo}
                    correo={trabajador?.correo}
                    domicilioCalle={trabajador?.domicilioCalle}
                    domicilioNro={trabajador?.domicilioNro}
                    domicilioPiso={trabajador?.domicilioPiso}
                    domicilioDpto={trabajador?.domicilioDpto}
                />
            </div>

            <div className={trasladoStyles.sectionBox}>
                <DatosEmpleador
                    cuit={empleador?.cuit}
                    razonSocial={empleador?.razonSocial}
                    domicilioCalle={empleador?.domicilioCalle}
                    domicilioNro={empleador?.domicilioNro}
                    domicilioPiso={empleador?.domicilioPiso}
                    domicilioDpto={empleador?.domicilioDpto}
                    telefonos={empleador?.telefonos}
                    correos={empleador?.correos}
                />
            </div>

            <div className={trasladoStyles.sectionBox}>
                <DatosEstablecimiento
                    cuit={establecimiento?.cuit}
                    razonSocial={establecimiento?.razonSocial}
                    domicilioCalle={establecimiento?.domicilioCalle}
                    domicilioNro={establecimiento?.domicilioNro}
                    domicilioPiso={establecimiento?.domicilioPiso}
                    domicilioDpto={establecimiento?.domicilioDpto}
                />
            </div>

            <div className={trasladoStyles.sectionBox}>
                <DatosSiniestro
                    dia={siniestro?.dia}
                    hora={siniestro?.hora}
                    inicioInasistencia={siniestro?.inicioInasistencia}
                    descripcion={siniestro?.descripcion}
                />
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Próximo control médico</div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.compactField}>
                        <TextField
                            label="Fecha"
                            type="date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            fullWidth
                        />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField
                            label="Hora"
                            type="time"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={hora}
                            onChange={(e) => setHora(e.target.value)}
                            fullWidth
                        />
                    </div>
                </div>
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Comentario</div>
                <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className={trasladoStyles.observacionesField}
                />
            </div>
        </div>
    );
}
