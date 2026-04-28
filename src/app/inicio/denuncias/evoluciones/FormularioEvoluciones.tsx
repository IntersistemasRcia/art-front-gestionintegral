import { useState, useEffect, useMemo } from "react";
import CustomModal from "@/utils/ui/form/CustomModal";
import PantallaGenerica from "./pantallasAdministrativas/pantallaGenerica";
import SolicitudTraslado from "./pantallasAdministrativas/solicitudTraslado";
import ConstanciaAltaMedica from "./pantallasMedicas/constanciaAltaMedica";
import ConstanciaAtencionMedica from "./pantallasMedicas/constanciaAtencionMedica";
import ParteMedicoIngreso from "./pantallasMedicas/parteMedicoIngreso";
import SolicitudAtencionMedica from "./pantallasMedicas/solicitudAtencionMedica";
import SolicitudReingreso from "./pantallasMedicas/solicitudReingreso";
import SolicitudReintegro from "./pantallasMedicas/solicitudReintegro";
import { Autocomplete, TextField } from "@mui/material";
import CustomButton from "@/utils/ui/button/CustomButton";
import { FormularioEvolucionesProps } from "./types/evoluciones";
import ArtAPI from "@/data/artAPI";
import { DenunciaQueryParamsID } from "../types/tDenuncias";
import { FechaHora } from "@/utils/Formato";
import styles from "./evoluciones.module.css";

type DenunciaDetalle = {
	afiCuil?: number | string | null;
	afiDocTipo?: string | null;
	afiDocNumero?: number | string | null;
	afiNombre?: string | null;
	afiFechaNacimiento?: string | number | null;
	afiSexo?: string | null;
	afieMail?: string | null;
	afiDomicilioCalle?: string | null;
	afiDomicilioNro?: string | number | null;
	afiDomicilioPiso?: string | number | null;
	afiDomicilioDpto?: string | null;
	afiTelefono?: string | null;

	empCuit?: number | string | null;
	empPoliza?: number | string | null;
	empRazonSocial?: string | null;
	empDomicilioCalle?: string | null;
	empDomicilioNro?: string | number | null;
	empDomicilioPiso?: string | number | null;
	empDomicilioDpto?: string | null;
	empTelefonos?: string | null;
	empeMail?: string | null;

	empOcCuit?: number | string | null;
	empOcRazonSocial?: string | null;
	empOcDomicilioCalle?: string | null;
	empOcDomicilioNro?: string | number | null;
	empOcDomicilioPiso?: string | number | null;
	empOcDomicilioDpto?: string | null;

	empEstCuit?: number | string | null;
	empEstRazonSocial?: string | null;
	empEstDomicilioCalle?: string | null;
	empEstDomicilioNro?: string | number | null;
	empEstDomicilioPiso?: string | number | null;
	empEstDomicilioDpto?: string | null;

	siniestroFechaHora?: string | null;
	siniestroTomaConocimientoFechaHora?: string | null;

	denunciaSiniestros?: Array<{
		descripcion?: string | null;
		fechaHoraSiniestro?: string | null;
	}>;
};

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

export default function FormularioEvoluciones({ open, onClose, title, denunciaId, denunciaNro, empleadoNombre, empleadoCuil }: FormularioEvolucionesProps) {
	const [selected, setSelected] = useState<string | null>(null);
	const denunciaIdParams: DenunciaQueryParamsID | undefined = typeof denunciaId === "number"
		? { id: denunciaId }
		: denunciaId
			? { id: Number(denunciaId) }
			: undefined;
	const { data: denunciaByIdData } = ArtAPI.useGetDenunciaById(denunciaIdParams);

	// Limpiar selección cada vez que el modal se abra
	useEffect(() => {
		if (open) setSelected(null);
	}, [open]);

	const options = title === "Evoluciones Administrativa" ? ADMIN_OPTIONS : MEDICAS_OPTIONS;
	const showPantallaGenerica = selected === "Comisión Médica" || selected === "Hospedaje" || selected === "Informe Social" || selected === "Notificación" || selected === "Notificación CECAP" || selected === "Orden Atención Médica" || selected === "Recalificación Profesional" || selected === "Turno" || selected === "Notificación de Auditoría Médica";
	const showSolicitudTraslado = selected === "Traslado";
	const showConstanciaAltaMedica = selected === "Constancia Alta Medica";
	const showConstanciaAtencionMedica = selected === "Constancia Atención Médica";
	const showParteMedicoIngreso = selected === "Constancia Parte Médico Ingreso";
	const showSolicitudAtencionMedica = selected === "Solicitud Atención Médica";
	const showSolicitudReingreso = selected === "Solicitud Reingreso";
	const showSolicitudReintegro = selected === "Solicitud Reintegro";

	const cabecera = useMemo(() => {
		const data = denunciaByIdData as DenunciaDetalle | undefined;
		if (!data) return undefined;
		const sinItems = data.denunciaSiniestros ?? [];
		const sin = sinItems.length > 0 ? sinItems[sinItems.length - 1] : undefined;
		const siniestroFecha = data.siniestroFechaHora ?? sin?.fechaHoraSiniestro ?? null;
		return {
			trabajador: {
				cuil: data.afiCuil,
				nombre: data.afiNombre,
				docTipo: data.afiDocTipo,
				docNumero: data.afiDocNumero,
				fechaNacimiento: FechaHora(data.afiFechaNacimiento, "date"),
				sexo: data.afiSexo,
				correo: data.afieMail,
				domicilioCalle: data.afiDomicilioCalle,
				domicilioNro: data.afiDomicilioNro,
				domicilioPiso: data.afiDomicilioPiso,
				domicilioDpto: data.afiDomicilioDpto,
				telefono: data.afiTelefono,
			},
			empleador: {
				cuit: data.empCuit,
				razonSocial: data.empRazonSocial,
				domicilioCalle: data.empDomicilioCalle,
				domicilioNro: data.empDomicilioNro,
				domicilioPiso: data.empDomicilioPiso,
				domicilioDpto: data.empDomicilioDpto,
				telefonos: data.empTelefonos,
				correos: data.empeMail,
				poliza: data.empPoliza,
			},
			establecimiento: {
				cuit: data.empEstCuit ?? data.empOcCuit,
				razonSocial: data.empEstRazonSocial ?? data.empOcRazonSocial,
				domicilioCalle: data.empEstDomicilioCalle ?? data.empOcDomicilioCalle,
				domicilioNro: data.empEstDomicilioNro ?? data.empOcDomicilioNro,
				domicilioPiso: data.empEstDomicilioPiso ?? data.empOcDomicilioPiso,
				domicilioDpto: data.empEstDomicilioDpto ?? data.empOcDomicilioDpto,
			},
			siniestro: {
				dia: FechaHora(siniestroFecha, "date"),
				hora: FechaHora(siniestroFecha, "time"),
				inicioInasistencia: FechaHora(data.siniestroTomaConocimientoFechaHora, "date"),
				descripcion: sin?.descripcion ?? undefined,
			},
		};
	}, [denunciaByIdData]);

	const handleConfirm = () => {
		console.log("Evolucion seleccionada:", selected);
		onClose();
	};

	return (
		<CustomModal
			open={open}
			onClose={onClose}
			title={title}
			size={title === "Evoluciones Medicas" ? "large" : "large"}
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
							cabecera={cabecera}
						/>
					</div>
				)}

				{showConstanciaAltaMedica && (
					<div className={styles.marginTop}>
						<ConstanciaAltaMedica
							denunciaNro={denunciaNro ?? null}
							empleadoNombre={empleadoNombre ?? null}
							empleadoCuil={empleadoCuil ?? null}
							cabecera={cabecera}
						/>
					</div>
				)}

				{showConstanciaAtencionMedica && (
					<div className={styles.marginTop}>
						<ConstanciaAtencionMedica
							denunciaNro={denunciaNro ?? null}
							empleadoNombre={empleadoNombre ?? null}
							empleadoCuil={empleadoCuil ?? null}
							cabecera={cabecera}
						/>
					</div>
				)}

				{showParteMedicoIngreso && (
					<div className={styles.marginTop}>
						<ParteMedicoIngreso
							denunciaNro={denunciaNro ?? null}
							empleadoNombre={empleadoNombre ?? null}
							empleadoCuil={empleadoCuil ?? null}
							cabecera={cabecera}
						/>
					</div>
				)}

				{showSolicitudAtencionMedica && (
					<div className={styles.marginTop}>
						<SolicitudAtencionMedica
							denunciaNro={denunciaNro ?? null}
							empleadoNombre={empleadoNombre ?? null}
							empleadoCuil={empleadoCuil ?? null}
							cabecera={cabecera}
						/>
					</div>
				)}

				{showSolicitudReingreso && (
					<div className={styles.marginTop}>
						<SolicitudReingreso
							denunciaNro={denunciaNro ?? null}
							empleadoNombre={empleadoNombre ?? null}
							empleadoCuil={empleadoCuil ?? null}
							cabecera={cabecera}
						/>
					</div>
				)}

				{showSolicitudReintegro && (
					<div className={styles.marginTop}>
						<SolicitudReintegro
							denunciaNro={denunciaNro ?? null}
							empleadoNombre={empleadoNombre ?? null}
							empleadoCuil={empleadoCuil ?? null}
							cabecera={cabecera}
						/>
					</div>
				)}
			</div>
		</CustomModal>
	);
}
