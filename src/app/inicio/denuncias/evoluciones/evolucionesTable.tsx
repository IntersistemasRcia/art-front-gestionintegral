import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/utils/ui/table/DataTable";
import CustomButton from "@/utils/ui/button/CustomButton";
import styles from "../denuncias.module.css";
import FormularioEvoluciones from "./FormularioEvoluciones";

type EvolucionRow = {
	fecha: string;
	hora: string;
	tipoEvolucion: string;
	estado: string;
};

const data: EvolucionRow[] = [
	{ fecha: "22/04/2026", hora: "08:15", tipoEvolucion: "Carga inicial", estado: "Pendiente" },
	{ fecha: "22/04/2026", hora: "09:40", tipoEvolucion: "Validacion medica", estado: "En revision" },
	{ fecha: "22/04/2026", hora: "11:05", tipoEvolucion: "Actualizacion de datos", estado: "Aprobada" },
	{ fecha: "22/04/2026", hora: "12:30", tipoEvolucion: "Cierre de evolucion", estado: "Finalizada" },
];

const columns: ColumnDef<EvolucionRow>[] = [
	{ accessorKey: "fecha", header: "Fecha" },
	{ accessorKey: "hora", header: "Hora" },
	{ accessorKey: "tipoEvolucion", header: "Tipo Evolucion" },
	{ accessorKey: "estado", header: "Estado" },
];

export default function CustomTab({ denunciaNro }: { denunciaNro?: number | string | null }) {
	const [modalTitle, setModalTitle] = useState<string>("");
	const [openModal, setOpenModal] = useState(false);

	const handleOpenAdministrativa = () => {
		setModalTitle("Evoluciones Administrativa");
		setOpenModal(true);
	};

	const handleOpenMedicas = () => {
		setModalTitle("Evoluciones Medicas");
		setOpenModal(true);
	};

	return (
		<>
			<div className={styles.actionsBar}>
				<CustomButton onClick={handleOpenAdministrativa}>Cargar Evoluciones Administrativa</CustomButton>
				<CustomButton onClick={handleOpenMedicas}>Cargar Evoluciones Medicas</CustomButton>
			</div>
			<DataTable data={data} columns={columns} size="mid" />
			<FormularioEvoluciones open={openModal} onClose={() => setOpenModal(false)} title={modalTitle} denunciaNro={denunciaNro} />
		</>
	);
}
