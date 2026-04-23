import React, { useState, useEffect } from "react";
import CustomModal from "@/utils/ui/form/CustomModal";
import PantallaGenerica from "./pantallasAdministrativas/pantallaGenerica";
import SolicitudTraslado from "./pantallasAdministrativas/solicitudTraslado";
import ConstanciaAltaMedica from "./pantallasMedicas/constanciaAltaMedica";
import { Autocomplete, TextField } from "@mui/material";
import CustomButton from "@/utils/ui/button/CustomButton";
import { FormularioEvolucionesProps } from "./types/evoluciones";
import styles from "./evoluciones.module.css";

const ADMIN_OPTIONS: string[] = [
	"Comisión Médica",
	"Hospedaje",
	"Informe Social",
	"Notificación",
	"Notificación CECAP",
	"Orden Atención Médica",
	"Recalificación Profesional",
	"Solicitud Reintegro",
	"Traslado",
	"Turno",
];

const MEDICAS_OPTIONS: string[] = [
	"Constancia Alta Medica",
	"Constancia Atención Médica",
	"Constancia Parte Médico Ingreso",
	"Notificación de Auditoría Médica",
	"Solicitud Atención Médica",
	"Solicitud Reingreso",
	"Solicitud Reintegro",
];

export default function FormularioEvoluciones({ open, onClose, title, denunciaNro, empleadoNombre, empleadoCuil }: FormularioEvolucionesProps) {
	const [selected, setSelected] = useState<string | null>(null);

	// Limpiar selección cada vez que el modal se abra
	useEffect(() => {
		if (open) setSelected(null);
	}, [open]);

	const options = title === "Evoluciones Administrativa" ? ADMIN_OPTIONS : MEDICAS_OPTIONS;
	const showPantallaGenerica = selected === "Comisión Médica" || selected === "Hospedaje" || selected === "Informe Social" || selected === "Notificación" || selected === "Notificación CECAP" || selected === "Orden Atención Médica" || selected === "Recalificación Profesional" || selected === "Solicitud Reintegro" || selected === "Turno";
	const showSolicitudTraslado = selected === "Traslado";
	const showConstanciaAltaMedica = selected === "Constancia Alta Medica";

	const handleConfirm = () => {
		console.log("Evolucion seleccionada:", selected);
		onClose();
	};

	return (
		<CustomModal
			open={open}
			onClose={onClose}
			title={title}
			size={title === "Evoluciones Medicas" ? "large" : "mid"}
			actions={(
				<>
					<CustomButton onClick={handleConfirm}>Confirmar</CustomButton>
					<CustomButton onClick={onClose}>Cancelar</CustomButton>
				</>
			)}
		>
			<div>
				<Autocomplete
					options={options}
					value={selected}
					onChange={(_, v) => setSelected(v)}
					renderInput={(params) => <TextField {...params} label="Tipo de Evolución" />}
				/>

				{/* Renderizado condicional para Comisión Médica y Hospedaje */}
				{showPantallaGenerica && (
					<div className={styles.marginTop}>
						<PantallaGenerica denunciaNro={denunciaNro ?? null} />
					</div>
				)}

				{showSolicitudTraslado && (
					<div className={styles.marginTop}>
						<SolicitudTraslado
							denunciaNro={denunciaNro ?? null}
							empleadoNombre={empleadoNombre ?? null}
							empleadoCuil={empleadoCuil ?? null}
						/>
					</div>
				)}

				{showConstanciaAltaMedica && (
					<div className={styles.marginTop}>
						<ConstanciaAltaMedica
							denunciaNro={denunciaNro ?? null}
							empleadoNombre={empleadoNombre ?? null}
							empleadoCuil={empleadoCuil ?? null}
						/>
					</div>
				)}
			</div>
		</CustomModal>
	);
}
