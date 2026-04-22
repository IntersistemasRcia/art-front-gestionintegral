import React, { useState, useEffect } from "react";
import CustomModal from "@/utils/ui/form/CustomModal";
import ComisionMedica from "./pantallasAdministrativas/comisionMedia";
import Hospedaje from "./pantallasAdministrativas/hospedaje";
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
	"Constancia Atención Médica",
	"Constancia Parte Médico Ingreso",
	"Notificación de Auditoría Médica",
	"Solicitud Atención Médica",
	"Solicitud Reingreso",
	"Solicitud Reintegro",
];

export default function FormularioEvoluciones({ open, onClose, title, denunciaNro }: FormularioEvolucionesProps) {
	const [selected, setSelected] = useState<string | null>(null);

	// Limpiar selección cada vez que el modal se abra
	useEffect(() => {
		if (open) setSelected(null);
	}, [open]);

	const options = title === "Evoluciones Administrativa" ? ADMIN_OPTIONS : MEDICAS_OPTIONS;

	const handleConfirm = () => {
		console.log("Evolucion seleccionada:", selected);
		onClose();
	};

	return (
		<CustomModal
			open={open}
			onClose={onClose}
			title={title}
			size="mid"
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

				{/* Renderizado condicional para Comisión Médica */}
				{selected === "Comisión Médica" && (
					<div className={styles.marginTop}>
						<ComisionMedica denunciaNro={denunciaNro ?? null} />
					</div>
				)}

				{/* Renderizado condicional para Hospedaje */}
				{selected === "Hospedaje" && (
					<div className={styles.marginTop}>
						<Hospedaje denunciaNro={denunciaNro ?? null} />
					</div>
				)}
			</div>
		</CustomModal>
	);
}
