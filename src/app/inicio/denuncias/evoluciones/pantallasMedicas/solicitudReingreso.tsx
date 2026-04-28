import { useState } from "react";
import { TextField, Radio, RadioGroup, FormControlLabel, FormControl } from "@mui/material";
import { PantallaAdministrativaProps } from "../pantallasAdministrativas/types/pantallaAdministrativa";
import CabeceraComun from "../CabeceraComun";
import trasladoStyles from "../pantallasAdministrativas/solicitudTraslado.module.css";
import denunciasStyles from "../../denuncias.module.css";

type SolicitudReingresoProps = PantallaAdministrativaProps;

export default function SolicitudReingreso({
    denunciaNro,
    empleadoCuil,
    empleadoNombre,
    empleadoDocTipo,
    empleadoDocNumero,
    empleadorCuit,
    empleadorRazonSocial,
    cabecera,
}: SolicitudReingresoProps) {
    const trabajador = cabecera?.trabajador;
    const empleador = cabecera?.empleador;
    const [fechaAltaMedica, setFechaAltaMedica] = useState("");
    const [horaAltaMedica, setHoraAltaMedica] = useState("");
    const [indicaciones, setIndicaciones] = useState("");
    const [aceptacion, setAceptacion] = useState("no");
    const [comentario, setComentario] = useState("");
    const [fundamentoDenegacion, setFundamentoDenegacion] = useState("");

    return (
        <div className={trasladoStyles.container}>
            <CabeceraComun denunciaNro={denunciaNro} />
            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Datos del trabajador</div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="C.U.I.L." value={String(trabajador?.cuil ?? empleadoCuil ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.wideField}>
                        <TextField label="Nombre" value={trabajador?.nombre ?? empleadoNombre ?? ""} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Documento" value={trabajador?.docTipo ?? empleadoDocTipo ?? ""} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactFieldSmall}>
                        <TextField label="" value={String(trabajador?.docNumero ?? empleadoDocNumero ?? "")} fullWidth disabled />
                    </div>
                </div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Fecha nacimiento" value={trabajador?.fechaNacimiento ?? ""} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactFieldSmall}>
                        <TextField label="Sexo" value={trabajador?.sexo ?? ""} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.wideField}>
                        <TextField label="Correos" value={trabajador?.correo ?? ""} fullWidth disabled />
                    </div>
                </div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.wideField}>
                        <TextField label="Domicilio: Calle" value={trabajador?.domicilioCalle ?? ""} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Nro" value={String(trabajador?.domicilioNro ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Piso" value={String(trabajador?.domicilioPiso ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactFieldSmall}>
                        <TextField label="Dpto" value={trabajador?.domicilioDpto ?? ""} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Tel. fijo/móvil" value={trabajador?.telefono ?? ""} fullWidth disabled />
                    </div>
                </div>
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Datos del empleador</div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="C.U.I.T." value={String(empleador?.cuit ?? empleadorCuit ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.wideField}>
                        <TextField label="Razón social" value={empleador?.razonSocial ?? empleadorRazonSocial ?? ""} fullWidth disabled />
                    </div>
                </div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.wideField}>
                        <TextField label="Domicilio: Calle" value={empleador?.domicilioCalle ?? ""} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Nro" value={String(empleador?.domicilioNro ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Piso" value={String(empleador?.domicilioPiso ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactFieldSmall}>
                        <TextField label="Dpto" value={empleador?.domicilioDpto ?? ""} fullWidth disabled />
                    </div>
                </div>
                <div className={denunciasStyles.formRow}>
                    <TextField label="Teléfonos" value={empleador?.telefonos ?? ""} fullWidth disabled />
                </div>
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Descripción del motivo de consulta</div>

                <FormControl>
                    <RadioGroup row value="" name="tipoConsulta">
                        <FormControlLabel value="inItinere" control={<Radio disabled size="small" />} label="In Itínere" />
                        <FormControlLabel value="otroCentro" control={<Radio disabled size="small" />} label="En otro Centro o Lugar de Trabajo" />
                        <FormControlLabel value="intercurrencia1" control={<Radio disabled size="small" />} label="Intercurrencia" />
                        <FormControlLabel value="desplazamiento" control={<Radio disabled size="small" />} label="Desplazamiento Día Laboral" />
                        <FormControlLabel value="enElTrabajo" control={<Radio disabled size="small" />} label="En el trabajo" />
                        <FormControlLabel value="intercurrencia2" control={<Radio disabled size="small" />} label="Intercurrencia" />
                    </RadioGroup>
                </FormControl>

                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.wideField}>
                        <TextField
                            label="Fecha de ocurrencia de la contingencia original"
                            type="date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value=""
                            fullWidth
                            disabled
                        />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField
                            label="Hora"
                            type="time"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value=""
                            fullWidth
                            disabled
                        />
                    </div>
                </div>

                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.wideField}>
                        <TextField
                            label="Fecha de alta médica"
                            type="date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={fechaAltaMedica}
                            onChange={(e) => setFechaAltaMedica(e.target.value)}
                            fullWidth
                        />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField
                            label="Hora"
                            type="time"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={horaAltaMedica}
                            onChange={(e) => setHoraAltaMedica(e.target.value)}
                            fullWidth
                        />
                    </div>
                </div>

                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.wideField}>
                        <TextField
                            label="Fecha de solicitud de reingreso"
                            type="date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value=""
                            fullWidth
                            disabled
                        />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField
                            label="Hora"
                            type="time"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value=""
                            fullWidth
                            disabled
                        />
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    <TextField label="Descripción del motivo de consulta" value="" multiline rows={2} fullWidth disabled />
                    <TextField label="Diagnóstico" value="" fullWidth disabled />
                    <TextField
                        label="Indicaciones / tratamiento"
                        value={indicaciones}
                        onChange={(e) => setIndicaciones(e.target.value)}
                        fullWidth
                    />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Aceptación del reingreso al tratamiento:</span>
                    <RadioGroup row value={aceptacion} onChange={(e) => setAceptacion(e.target.value)}>
                        <FormControlLabel value="si" control={<Radio size="small" />} label="Sí" />
                        <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                    </RadioGroup>
                </div>

                <div style={{ marginTop: 4 }}>
                    <TextField label="Fundamento de la denegación de reintegro" value={fundamentoDenegacion} onChange={(e) => setFundamentoDenegacion(e.target.value)} fullWidth />
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
