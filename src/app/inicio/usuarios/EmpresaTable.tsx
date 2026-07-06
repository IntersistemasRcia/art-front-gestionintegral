"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Alert, Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import useSWR from "swr";
import DataTable from "@/utils/ui/table/DataTable";
import ArtAPI from "@/data/artAPI";
import AuthAPI, { token } from "@/data/authAPI";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModalMessage, { MessageType } from "@/utils/ui/message/CustomModalMessage";
import Formato from "@/utils/Formato";
import type { ParametroEntidad } from "@/data/authAPI";
import styles from "./Usuario.module.css";
import CustomSelectSearch from "@/utils/ui/form/CustomSelectSearch";

const PAGE_SIZE = 10;

type EmpresaFiltroOption = Pick<ParametroEntidad, "cuit" | "razonSocial" | "entidadId">;

const OPCION_TODAS: EmpresaFiltroOption = { entidadId: -1, cuit: 0, razonSocial: "Todas las Empresas" };

export default function EmpresaTable() {
	const { usePutEmpresaParametro, useGetRefEmpleadores } = ArtAPI;
	const { trigger: putEmpresaParametro, isMutating: isSaving } = usePutEmpresaParametro();
	const { data: refEmpleadores } = useGetRefEmpleadores();

	const [pageIndex, setPageIndex] = useState(1);
	const [empresaFiltro, setEmpresaFiltro] = useState<EmpresaFiltroOption>(OPCION_TODAS);

	const paramsCombo = useMemo(() => ({ PageIndex: 1, PageSize: 500 }), []);
	const { data: responseCombo } = useSWR(
		[AuthAPI.getParamEntidadEmpresaURL(paramsCombo), token.getToken()],
		() => AuthAPI.getParamEntidadEmpresa(paramsCombo),
		{ revalidateOnFocus: false, revalidateOnReconnect: false }
	);
	const opcionesCombo: EmpresaFiltroOption[] = useMemo(
		() => [OPCION_TODAS, ...((responseCombo as { data?: ParametroEntidad[] } | undefined)?.data ?? []).map(
			({ cuit, razonSocial, entidadId }) => ({ cuit, razonSocial, entidadId })
		)],
		[responseCombo]
	);

	const params = { PageIndex: pageIndex, PageSize: PAGE_SIZE, ...(empresaFiltro.entidadId !== -1 ? { CUIT: empresaFiltro.cuit } : {}) };
	const { data: response, isLoading, mutate } = useSWR(
		[AuthAPI.getParamEntidadEmpresaURL(params), token.getToken(), pageIndex, empresaFiltro?.cuit],
		() => AuthAPI.getParamEntidadEmpresa(params),
		{ revalidateOnFocus: false, revalidateOnReconnect: false }
	);

	const tableData: ParametroEntidad[] = (response as { data?: ParametroEntidad[] } | undefined)?.data ?? [];
	const pageCount: number = (response as { pages?: number } | undefined)?.pages ?? 1;

	const [openModal, setOpenModal] = useState(false);
	const [selectedItem, setSelectedItem] = useState<ParametroEntidad | null>(null);
	const [cantidadUsuariosMaxima, setCantidadUsuariosMaxima] = useState<number>(0);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [modalMsgOpen, setModalMsgOpen] = useState(false);
	const [modalMsgText, setModalMsgText] = useState<string>("");
	const [modalMsgType, setModalMsgType] = useState<MessageType>("info");

	const handleOpenEdit = (row: ParametroEntidad) => {
		setSelectedItem(row);
		setCantidadUsuariosMaxima(Number(row.valor));
		setSaveError(null);
		setOpenModal(true);
	};

	const handleCloseModal = () => {
		setOpenModal(false);
		setSelectedItem(null);
		setSaveError(null);
	};

	const handleSave = async () => {
		if (!selectedItem) return;
		const actuales = refEmpleadores?.find((e) => e.interno === selectedItem.entidadId)?.cantidadUsuarios ?? 0;
		if (cantidadUsuariosMaxima < actuales) {
			setModalMsgType("warning");
			setModalMsgText("No se puede establecer una Cantidad Usuarios Máxima menor a la Cantidad Usuarios Actuales.");
			setModalMsgOpen(true);
			return;
		}
		setSaveError(null);
		try {
			await putEmpresaParametro({
				id: selectedItem.entidadId,
				data: {
					nombre: selectedItem.parametroNombre,
					valor: String(cantidadUsuariosMaxima),
				},
			});
			await mutate();
			handleCloseModal();
		} catch (e: unknown) {
			setSaveError(e instanceof Error ? e.message : "No se pudo guardar el parámetro.");
		}
	};

	const columns = useMemo<ColumnDef<ParametroEntidad>[]>(
		() => [
			{
				accessorKey: "cuit",
				header: "CUIT",
				cell: ({ getValue }) => Formato.CUIP(getValue<number>()),
			},
			{ accessorKey: "razonSocial", header: "Razón Social" },
			{
				id: "accion",
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
			<Box className={styles.empresaSelectorWrapper}>
				<Box className={styles.empresaSelectorBox}>
					<CustomSelectSearch<EmpresaFiltroOption>
						options={opcionesCombo}
						value={empresaFiltro}
						onChange={(_e, val) => { setEmpresaFiltro(val ?? OPCION_TODAS); setPageIndex(1); }}
						getOptionLabel={(o) => !o || o.entidadId === -1 ? (o?.razonSocial ?? "") : `${Formato.CUIP(o.cuit ?? 0)} - ${o.razonSocial ?? ""}`}
						isOptionEqualToValue={(a, b) => a.entidadId === b.entidadId}
						label="Filtrar por empresa"
						placeholder="Buscar por razón social o CUIT..."
						noOptionsText="No se encontraron empresas"
					/>
				</Box>
			</Box>
			<DataTable
				data={tableData}
				columns={columns}
				isLoading={isLoading}
				enableFiltering={false}
				manualPagination
				pageIndex={pageIndex}
				pageSize={PAGE_SIZE}
				pageCount={pageCount}
				onPageChange={setPageIndex}
			/>

			<CustomModal
				open={openModal}
				onClose={handleCloseModal}
				title="Editar parámetros de empresa"
				size="mid"
				actions={
					<Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
						<CustomButton onClick={handleSave} isLoading={isSaving} disabled={!selectedItem || isSaving}>
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

				{!selectedItem ? (
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
							slotProps={{ htmlInput: { min: 0 } }}
						/>
						<TextField
							fullWidth
							type="number"
							label="Cantidad Usuarios Actuales"
							value={refEmpleadores?.find((e) => e.interno === selectedItem.entidadId)?.cantidadUsuarios ?? 0}
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
