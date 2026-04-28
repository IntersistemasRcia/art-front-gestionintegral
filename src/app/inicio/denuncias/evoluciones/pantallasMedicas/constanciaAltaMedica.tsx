import { TextField } from "@mui/material";
import DatosTrabajador from "./cabecera/datosTrabajador";
import DatosEmpleador from "./cabecera/datosEmpleador";
import DatosSiniestro from "./cabecera/datosSiniestro";
import { PantallaAdministrativaProps } from "../pantallasAdministrativas/types/pantallaAdministrativa";
import CabeceraComun from "../CabeceraComun";
import trasladoStyles from "../pantallasAdministrativas/solicitudTraslado.module.css";
import denunciasStyles from "../../denuncias.module.css";

type ConstanciaProps = PantallaAdministrativaProps;

export default function ConstanciaAltaMedica({ denunciaNro, empleadoNombre, empleadoCuil, cabecera }: ConstanciaProps) {
    const trabajador = cabecera?.trabajador;
    const empleador = cabecera?.empleador;
    const siniestro = cabecera?.siniestro;
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
                <DatosSiniestro
                    dia={siniestro?.dia}
                    hora={siniestro?.hora}
                    inicioInasistencia={siniestro?.inicioInasistencia}
                    descripcion={siniestro?.descripcion}
                />
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Comentarios</div>
                <TextField
                    multiline
                    rows={4}
                    fullWidth
                    className={trasladoStyles.observacionesField}
                />
            </div>
        </div>
    );
}
