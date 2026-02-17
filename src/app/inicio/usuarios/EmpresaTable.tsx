"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Alert, Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DataTable from "@/utils/ui/table/DataTable";
import ArtAPI from "@/data/artAPI";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModalMessage, { MessageType } from "@/utils/ui/message/CustomModalMessage";
import Formato from "@/utils/Formato";

type EmpresaRow = {
	interno?: number;
	cuit?: string;
	nombreEmpresa?: string;
	parametro?: string;
	accion?: string;
};

interface Props {
	data?: EmpresaRow[];
	isLoading?: boolean;
}

export default function EmpresaTable({ data, isLoading }: Props) {
	const { useGetRefEmpleadores, usePutEmpresaParametro } = ArtAPI;
	const {
		data: refEmpleadores,
		isLoading: isLoadingRef,
		mutate: mutateRefEmpleadores,
	} = useGetRefEmpleadores();
	const { trigger: putEmpresaParametro, isMutating: isSaving } = usePutEmpresaParametro();

	const [openModal, setOpenModal] = useState(false);
	const [selectedCuit, setSelectedCuit] = useState<number | null>(null);
	const [cantidadUsuariosMaxima, setCantidadUsuariosMaxima] = useState<number>(0);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [modalMsgOpen, setModalMsgOpen] = useState(false);
	const [modalMsgText, setModalMsgText] = useState<string>("");
	const [modalMsgType, setModalMsgType] = useState<MessageType>("info");

	const allowedCuits = useMemo(() => new Set([30707933336, 30616512052]), []);
	const tableData = useMemo<EmpresaRow[]>(() => {
		if (data && data.length > 0) {
			return data;
		}
		return (refEmpleadores || [])
			.filter((empleador) => allowedCuits.has(empleador.cuit))
			.map((empleador) => ({
				interno: empleador.interno,
				cuit: empleador.cuit != null ? String(empleador.cuit) : "",
				nombreEmpresa: empleador.razonSocial || "",
				parametro: "CantidadUsuariosEmpresa",
				accion: "",
			}));
	}, [data, refEmpleadores, allowedCuits]);

	const selectedEmpresa = useMemo(() => {
		if (!refEmpleadores || selectedCuit == null) return null;
		return refEmpleadores.find((e) => e.cuit === selectedCuit) ?? null;
	}, [refEmpleadores, selectedCuit]);

	useEffect(() => {
		if (!openModal) return;
		setSaveError(null);
		// Revalidar al abrir para cumplir con “consulta a /api/Empresas”
		mutateRefEmpleadores();
	}, [openModal, mutateRefEmpleadores]);

	useEffect(() => {
		if (!openModal) return;
		setCantidadUsuariosMaxima(selectedEmpresa?.cantidadUsuariosMaxima ?? 0);
	}, [openModal, selectedEmpresa]);

	const handleOpenEdit = (row: EmpresaRow) => {
		const cuitNumber = row.cuit ? Number(row.cuit) : NaN;
		setSelectedCuit(Number.isFinite(cuitNumber) ? cuitNumber : null);
		setOpenModal(true);
	};

	const handleCloseModal = () => {
		setOpenModal(false);
		setSelectedCuit(null);
		setSaveError(null);
	};

	const handleSave = async () => {
		if (!selectedEmpresa) return;
		const actuales = selectedEmpresa.cantidadUsuarios ?? 0;
		if (cantidadUsuariosMaxima < actuales) {
			setModalMsgType("warning");
			setModalMsgText(
				"No se puede establecer una Cantidad Usuarios Máxima menor a la Cantidad Usuarios Actuales."
			);
			setModalMsgOpen(true);
			return;
		}
		setSaveError(null);
		try {
			await putEmpresaParametro({
				id: selectedEmpresa.interno,
				data: {
					nombre: "CantidadUsuariosEmpresa",
					valor: String(cantidadUsuariosMaxima),
				},
			});
			await mutateRefEmpleadores();
			handleCloseModal();
		} catch (e: any) {
			setSaveError(e?.message ?? "No se pudo guardar el parámetro.");
		}
	};

	const columns = useMemo<ColumnDef<EmpresaRow>[]>(
		() => [
			{
				accessorKey: "cuit",
				header: "CUIT",
				cell: ({ row }) => {
					const raw = row.original.cuit ?? "";
					const n = raw ? Number(raw) : NaN;
					return Number.isFinite(n) ? Formato.CUIP(n) : raw;
				},
			},
			{ accessorKey: "nombreEmpresa", header: "Nombre Empresa" },
			{ accessorKey: "parametro", header: "Parametro" },
			{
				accessorKey: "accion",
				header: "Accion",
				cell: ({ row }) => (
					<Tooltip title="Editar" arrow>
						<IconButton
							color="warning"
							size="small"
							onClick={() => handleOpenEdit(row.original)}
						>
							<EditIcon fontSize="large" />
						</IconButton>
					</Tooltip>
				),
				meta: { width: "10%" },
			},
		],
		[]
	);

	return (
		<>
			<DataTable
				data={tableData}
				columns={columns}
				isLoading={isLoading ?? isLoadingRef}
			/>

			<CustomModal
				open={openModal}
				onClose={handleCloseModal}
				title="Editar parámetros de empresa"
				size="mid"
				actions={
					<Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
						<CustomButton onClick={handleSave} isLoading={isSaving} disabled={!selectedEmpresa || isSaving}>
							Guardar
						</CustomButton>
						<CustomButton onClick={handleCloseModal} color="secondary" disabled={isSaving}>
							Cancelar
						</CustomButton>
					</Box>
				}
			>
				{saveError && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{saveError}
					</Alert>
				)}

				{!selectedEmpresa ? (
					<Typography variant="body1">
						No se encontró la empresa seleccionada.
					</Typography>
				) : (
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
						<TextField
							fullWidth
							type="number"
							label="Cantidad Usuarios Máxima"
							value={cantidadUsuariosMaxima}
								onChange={(e) => {
									const v = Number(e.target.value);
									setCantidadUsuariosMaxima(Number.isFinite(v) ? v : 0);
								}}
							disabled={isSaving}
							inputProps={{ min: 0 }}
						/>

						<TextField
							fullWidth
							type="number"
							label="Cantidad Usuarios Actuales"
							value={selectedEmpresa.cantidadUsuarios ?? 0}
							disabled
						/>
					</Box>
				)}
			</CustomModal>

			<CustomModalMessage
				open={modalMsgOpen}
				onClose={() => setModalMsgOpen(false)}
				message={modalMsgText}
				type={modalMsgType}
				title="Atención"
			/>
		</>
	);
}
