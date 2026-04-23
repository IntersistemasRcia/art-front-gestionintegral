import React, { useState } from "react";
import dayjs from "dayjs";
import {
	Button,
	Checkbox,
	FormControl,
	FormControlLabel,
	InputLabel,
	MenuItem,
	Radio,
	RadioGroup,
	Select,
	TextField,
} from "@mui/material";
import { PantallaAdministrativaProps } from "./types/pantallaAdministrativa";
import styles from "./solicitudTraslado.module.css";

export default function SolicitudTraslado({ denunciaNro, empleadoNombre, empleadoCuil }: PantallaAdministrativaProps) {
	const [tipoTrayecto, setTipoTrayecto] = useState("soloIda");
	const isSoloIda = tipoTrayecto === "soloIda";

	const hoy = dayjs();
	const fecha = hoy.format("DD/MM/YYYY");
	const hora = hoy.format("HH:mm");

	return (
		<div className={styles.container}>
			<div className={styles.topRow}>
				<TextField label="Denuncia" value={denunciaNro ?? ""} disabled />
				<TextField label="Fecha" value={fecha} disabled />
				<TextField label="Hora" value={hora} disabled />
			</div>

			<div className={styles.sectionBox}>
				<div className={styles.sectionTitle}>Trabajador</div>
				<div className={styles.workerRow}>
					<TextField label="CUIL" value={empleadoCuil ?? ""} fullWidth disabled />
					<TextField label="Nombre" value={empleadoNombre ?? ""} fullWidth disabled />
				</div>
			</div>

			<div className={styles.sectionBox}>
				<div className={styles.sectionTitle}>Traslado (Ida)</div>

				<div className={styles.tripRow}>
					<TextField label="Fecha" />
					<TextField label="Hora" />
					<RadioGroup
						row
						value={tipoTrayecto}
						onChange={(event) => setTipoTrayecto(event.target.value)}
						className={styles.radioGroup}
					>
						<FormControlLabel value="soloIda" control={<Radio />} label="Solo ida" />
						<FormControlLabel value="idaVuelta" control={<Radio />} label="Ida y vuelta" />
					</RadioGroup>
					<div className={styles.checkboxGroup}>
						<FormControlLabel control={<Checkbox />} label="Con espera" />
						<FormControlLabel control={<Checkbox />} label="Misma dirección" />
					</div>
				</div>

				<div className={styles.routeBox}>
					<div className={styles.routeTitle}>Desde</div>
					<div className={styles.routeRow}>
						<TextField label="Calle" fullWidth />
						<TextField label="Altura" className={styles.smallField} />
					</div>
					<div className={styles.routeRow}>
						<TextField label="Barrio / Localidad" fullWidth />
						<TextField label="Entre calles" fullWidth />
						<TextField label="y" fullWidth />
					</div>
				</div>

				<div className={styles.routeBox}>
					<div className={styles.routeTitle}>Hasta</div>
					<div className={styles.routeRow}>
						<TextField label="Calle" fullWidth />
						<TextField label="Altura" className={styles.smallField} />
					</div>
					<div className={styles.routeRow}>
						<TextField label="Barrio / Localidad" fullWidth />
						<TextField label="Entre calles" fullWidth />
						<TextField label="y" fullWidth />
						<TextField label="Kms (ida)" className={styles.kmField} />
					</div>
				</div>

				<div className={styles.bottomRow}>
					<FormControl className={styles.tipoTrasladoField}>
						<InputLabel id="tipo-traslado-label">Tipo traslado</InputLabel>
						<Select labelId="tipo-traslado-label" label="Tipo traslado" defaultValue="">
							<MenuItem value=""> </MenuItem>
							<MenuItem value="trasladoInterno">Traslado interno</MenuItem>
							<MenuItem value="trasladoExterno">Traslado externo</MenuItem>
						</Select>
					</FormControl>

					<TextField label="Prestador traslado" className={styles.prestadorField} />

					<Button variant="outlined" className={styles.searchButton}>...</Button>
				</div>

				<div className={`${styles.vueltaContainer} ${isSoloIda ? styles.vueltaDisabled : ""}`}>
					<div className={`${styles.sectionTitle} ${isSoloIda ? styles.vueltaTitleDisabled : ""}`}>Traslado (vuelta)</div>

					<div className={styles.routeBox}>
						<div className={styles.routeTitle}>Desde</div>
						<div className={styles.routeRow}>
							<TextField label="Calle" fullWidth disabled={isSoloIda} />
							<TextField label="Altura" className={styles.smallField} disabled={isSoloIda} />
						</div>
						<div className={styles.routeRow}>
							<TextField label="Barrio / Localidad" fullWidth disabled={isSoloIda} />
							<TextField label="Entre calles" fullWidth disabled={isSoloIda} />
							<TextField label="y" fullWidth disabled={isSoloIda} />
						</div>
					</div>

					<div className={styles.routeBox}>
						<div className={styles.routeTitle}>Hasta</div>
						<div className={styles.routeRow}>
							<TextField label="Calle" fullWidth disabled={isSoloIda} />
							<TextField label="Altura" className={styles.smallField} disabled={isSoloIda} />
						</div>
						<div className={styles.routeRow}>
							<TextField label="Barrio / Localidad" fullWidth disabled={isSoloIda} />
							<TextField label="Entre calles" fullWidth disabled={isSoloIda} />
							<TextField label="y" fullWidth disabled={isSoloIda} />
							<TextField label="Kms (vuelta)" className={styles.kmField} disabled={isSoloIda} />
						</div>
					</div>
				</div>

				<TextField
					label="Observaciones"
					multiline
					rows={3}
					fullWidth
					className={styles.observacionesField}
				/>
			</div>
		</div>
	);
}
