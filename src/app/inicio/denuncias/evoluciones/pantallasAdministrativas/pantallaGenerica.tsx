import { TextField } from "@mui/material";
import { PantallaAdministrativaProps } from "./types/pantallaAdministrativa";
import CabeceraComun from "../CabeceraComun";
import trasladoStyles from "./solicitudTraslado.module.css";
import denunciasStyles from "../../denuncias.module.css";

export default function PantallaGenerica({ denunciaNro }: PantallaAdministrativaProps) {
	return (
		<div className={trasladoStyles.container}>
			<CabeceraComun denunciaNro={denunciaNro} />
			<div className={trasladoStyles.sectionBox}>
				<div className={denunciasStyles.sectionTitle}>Comentario</div>
				<TextField multiline rows={10} fullWidth />
			</div>
		</div>
	);
}
