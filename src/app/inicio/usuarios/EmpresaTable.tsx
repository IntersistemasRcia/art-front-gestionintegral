"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Alert, Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DataTable from "@/utils/ui/table/DataTable";
import ArtAPI from "@/data/artAPI";
import AuthAPI from "@/data/authAPI";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModalMessage, { MessageType } from "@/utils/ui/message/CustomModalMessage";
import Formato from "@/utils/Formato";
import type { EmpresaRow, ParametroEntidad, EmpresaById, Props } from "./types/empresa";

export default function EmpresaTable({ data, isLoading }: Props) {
	const { useGetRefEmpleadores, usePutEmpresaParametro } = ArtAPI;
	const { useGetParametrosEntidadURL } = AuthAPI;
	const {
		data: refEmpleadores,
		isLoading: isLoadingRef,
		mutate: mutateRefEmpleadores,
	} = useGetRefEmpleadores();
	const {
		data: parametrosEntidadData,
		isLoading: isLoadingParametros,
		mutate: mutateParametrosEntidad,
	} = useGetParametrosEntidadURL({ parametroId: 1, PageIndex: 1, PageSize: 500 });
	const { trigger: putEmpresaParametro, isMutating: isSaving } = usePutEmpresaParametro();
	const parametrosEntidad = (parametrosEntidadData ?? []) as ParametroEntidad[];

	const [openModal, setOpenModal] = useState(false);
	const [selectedEmpresaId, setSelectedEmpresaId] = useState<number | null>(null);
	const [empresasById, setEmpresasById] = useState<Record<number, EmpresaById>>({});
	const [isLoadingEmpresasById, setIsLoadingEmpresasById] = useState(true);
	const [cantidadUsuariosMaxima, setCantidadUsuariosMaxima] = useState<number>(0);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [modalMsgOpen, setModalMsgOpen] = useState(false);
	const [modalMsgText, setModalMsgText] = useState<string>("");
	const [modalMsgType, setModalMsgType] = useState<MessageType>("info");

	useEffect(() => {
		let active = true;
		const loadEmpresasById = async () => {
			setIsLoadingEmpresasById(true);
			const empresas = await Promise.all(
				parametrosEntidad.map(async (parametro) => {
					try {
						return (await ArtAPI.getEmpresaById({ id: parametro.entidadId })) as EmpresaById;
					} catch {
						return null;
					}
				})
			);
			if (!active) return;
			setEmpresasById(
				empresas.filter((empresa): empresa is EmpresaById => empresa !== null).reduce<Record<number, EmpresaById>>((acc, empresa) => {
					acc[empresa.interno] = empresa;
					return acc;
				}, {})
			);
			setIsLoadingEmpresasById(false);
		};

		if (parametrosEntidad.length > 0) {
			loadEmpresasById();
		} else {
			setEmpresasById({});
			setIsLoadingEmpresasById(false);
		}

		return () => {
			active = false;
		};
	}, [parametrosEntidad]);

	const tableData = useMemo<EmpresaRow[]>(() => {
		if (data && data.length > 0) {
			return data;
		}
		if (isLoadingEmpresasById) return [];
		return parametrosEntidad.flatMap((parametro) => {
			const empresa = empresasById[parametro.entidadId];
			if (!empresa) return [];
			return [{
				interno: parametro.entidadId,
				cuit: String(empresa.cuit),
				nombreEmpresa: empresa.razonSocial,
				parametro: parametro.parametroNombre,
				action: "",
			}];
		});
	}, [data, parametrosEntidad, empresasById, isLoadingEmpresasById]);

	const selectedEmpresa = useMemo(() => {
		if (!refEmpleadores || selectedEmpresaId == null) return null;
		return refEmpleadores.find((e) => e.interno === selectedEmpresaId) ?? null;
	}, [refEmpleadores, selectedEmpresaId]);

	const selectedParametro = useMemo(() => {
		if (selectedEmpresaId == null) return null;
		return parametrosEntidad.find((p) => p.entidadId === selectedEmpresaId) ?? null;
	}, [parametrosEntidad, selectedEmpresaId]);

	useEffect(() => {
		if (!openModal) return;
		setSaveError(null);
		// Revalidar al abrir para cumplir con “consulta a /api/Empresas”
		mutateRefEmpleadores();
	}, [openModal, mutateRefEmpleadores]);

	useEffect(() => {
		if (!openModal) return;
		setCantidadUsuariosMaxima(Number(selectedParametro?.valor ?? 0));
	}, [openModal, selectedParametro]);

	const handleOpenEdit = (row: EmpresaRow) => {
		setSelectedEmpresaId(row.interno ?? null);
		setOpenModal(true);
	};

	const handleCloseModal = () => {
		setOpenModal(false);
		setSelectedEmpresaId(null);
		setSaveError(null);
	};

	const handleSave = async () => {
		if (!selectedEmpresa || !selectedParametro) return;
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
					nombre: selectedParametro.parametroNombre,
					valor: String(cantidadUsuariosMaxima),
				},
			});
			await mutateRefEmpleadores();
			await mutateParametrosEntidad();
			handleCloseModal();
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : "No se pudo guardar el parámetro.";
			setSaveError(errorMessage);
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
				isLoading={(isLoading ?? false) || isLoadingRef || isLoadingParametros || isLoadingEmpresasById}
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
