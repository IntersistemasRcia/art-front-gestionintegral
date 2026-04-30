import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/utils/ui/table/DataTable";
import CustomButton from "@/utils/ui/button/CustomButton";
import styles from "../denuncias.module.css";
import FormularioEvoluciones from "./FormularioEvoluciones";
import ArtAPI from "@/data/artAPI";
import { DenunciaInstanciaItem } from "./types/evoluciones";

type EvolucionRow = {
	fecha: string;
	hora: string;
	tipoEvolucion: string;
	estado: string;
};

const columns: ColumnDef<EvolucionRow>[] = [
	{ accessorKey: "fecha", header: "Fecha" },
	{ accessorKey: "hora", header: "Hora" },
	{ accessorKey: "tipoEvolucion", header: "Tipo Evolucion" },
	{ accessorKey: "estado", header: "Estado" },
];

type EvolucionesTableProps = {
	denunciaId?: number | string | null;
	denunciaNro?: number | string | null;
	empleadoNombre?: string | null;
	empleadoCuil?: number | string | null;
};

export default function CustomTab({ denunciaId, denunciaNro, empleadoNombre, empleadoCuil }: EvolucionesTableProps) {
	const [modalTitle, setModalTitle] = useState<string>("");
	const [openModal, setOpenModal] = useState(false);

	const { data: evolucionesData, isLoading } = ArtAPI.useGetDenunciaInstancia({
		denunciaNro: denunciaNro ? Number(denunciaNro) : undefined,
		VerTodas: true,
	});

	const tableData: EvolucionRow[] = (evolucionesData as DenunciaInstanciaItem[] ?? []).map((item) => {
		const [fecha = "", horaCompleta = ""] = (item.fechaHora ?? "").split("T");
		const [anio, mes, dia] = fecha.split("-");
		const fechaFormateada = fecha ? `${dia}/${mes}/${anio}` : "";
		const hora = horaCompleta.slice(0, 5);
		return {
			fecha: fechaFormateada,
			hora,
			tipoEvolucion: item.tipoInstancia ?? "",
			estado: item.autorizacionEstado ?? "",
		};
	});

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
			<DataTable data={tableData} columns={columns} size="mid" isLoading={isLoading} />
			<FormularioEvoluciones
				open={openModal}
				onClose={() => setOpenModal(false)}
				title={modalTitle}
				denunciaId={denunciaId}
				denunciaNro={denunciaNro}
				empleadoNombre={empleadoNombre ?? null}
				empleadoCuil={empleadoCuil ?? null}
			/>
		</>
	);
}
