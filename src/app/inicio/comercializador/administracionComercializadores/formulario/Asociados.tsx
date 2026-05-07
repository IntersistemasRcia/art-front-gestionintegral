"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Autocomplete, Box, TextField } from "@mui/material";
import { MdDelete, MdEdit } from "react-icons/md";
import DataTable from "@/utils/ui/table/DataTable";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomModalMessage from "@/utils/ui/message/CustomModalMessage";
import ArtAPI from "@/data/artAPI";
import type { OrganizadorComercializador, GrupoOrganizadorComercializador, ParametersComercializadoresAsociados } from "@/app/inicio/comercializador/polizas/types/poliza";
import type {
	ApiGrupoItem,
	ApiOrganizacionItem,
	AsociadoDetalleRow,
	AsociadoRow,
	AsociadosHandle,
	AsociadosProps,
	NombreAsociadoCellProps,
	SelectOption,
} from "@/app/inicio/comercializador/administracionComercializadores/formulario/types/formulario";
import styles from "./formulario.module.css";

export type { AsociadosHandle } from "@/app/inicio/comercializador/administracionComercializadores/formulario/types/formulario";

function asArray<T>(value: T[] | { DATA?: T[]; data?: T[] } | undefined): T[] {
	if (Array.isArray(value)) return value;
	if (value?.DATA) return value.DATA;
	if (value?.data) return value.data;
	return [];
}

function NombreAsociadoCell({ tipo, asociadoId }: NombreAsociadoCellProps) {
	const { data: organizadorData } = ArtAPI.useGetOrganizadorById(
		tipo === "Organizador" ? { id: asociadoId } : undefined
	);
	const { data: grupoData } = ArtAPI.useGetGOrganizadorById(
		tipo === "Grupo" ? { id: asociadoId } : undefined
	);

	if (tipo === "Organizador") {
		const detalle = organizadorData as AsociadoDetalleRow;

		return <>{detalle?.razonSocial ?? detalle?.observaciones ?? ""}</>;
	}

	const detalle = grupoData as AsociadoDetalleRow;

	return <>{detalle?.razonSocial ?? detalle?.descripcion ?? detalle?.observacion ?? ""}</>;
}

const Asociados = forwardRef<AsociadosHandle, AsociadosProps>(function Asociados(
	{ comercializadorInterno, comercializadorNombre, readOnly = false },
	ref
) {
	const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null);
	const [selectedOrganizacionId, setSelectedOrganizacionId] = useState<number | null>(null);
	const [tableRows, setTableRows] = useState<AsociadoRow[]>([]);
	const [pendingBajaRow, setPendingBajaRow] = useState<AsociadoRow | null>(null);
	const [showBajaSuccess, setShowBajaSuccess] = useState(false);
	const [showBajaError, setShowBajaError] = useState(false);
	const [bajaErrorMessage, setBajaErrorMessage] = useState("");
	const [editRow, setEditRow] = useState<AsociadoRow | null>(null);
	const [editGrupoId, setEditGrupoId] = useState<number | null>(null);
	const [editOrganizacionId, setEditOrganizacionId] = useState<number | null>(null);
	const [showDuplicate, setShowDuplicate] = useState(false);
	const [showEditError, setShowEditError] = useState(false);
	const [editErrorMessage, setEditErrorMessage] = useState("");

	const params = { SRTComercializadorInterno: comercializadorInterno } as unknown as ParametersComercializadoresAsociados;
	const grupoParams: GrupoOrganizadorComercializador = {};
	const organizadorParams: OrganizadorComercializador = selectedGrupoId ? { SRTComercializadorGOrganizadorInterno: selectedGrupoId } : {};
	const editOrganizadorParams: OrganizadorComercializador = editGrupoId ? { SRTComercializadorGOrganizadorInterno: editGrupoId } : {};

	const { data, isLoading } = ArtAPI.useGetComercializadoresAsociadosURL(params);
	const { data: gruposData } = ArtAPI.useGetGOrganizadorURL(grupoParams);
	const { data: organizacionesData } = ArtAPI.useGetOrganizadorURL(organizadorParams);
	const { data: editOrganizacionesData } = ArtAPI.useGetOrganizadorURL(editOrganizadorParams);
	const { trigger: triggerBaja } = ArtAPI.usePutSRTComercializadoresAsociadosBajaBas();
	const { trigger: triggerPost } = ArtAPI.usePostSRTComercializadoresAsociados();
	const { trigger: triggerPut } = ArtAPI.usePutSRTComercializadoresAsociadosEdit();

	const rows = asArray(data as AsociadoRow[] | { DATA?: AsociadoRow[]; data?: AsociadoRow[] } | undefined);

	useEffect(() => {
		setTableRows(rows.filter(r => !r.fechaBaja).map(r => ({ ...r, isNew: false })));
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	useImperativeHandle(ref, () => ({
		save: async () => {
			if (!comercializadorInterno) return;
			const newRows = tableRows.filter(r => r.isNew);
			await Promise.allSettled(
				newRows.map(r =>
					triggerPost({
						srtComercializadorInterno: comercializadorInterno,
						tipo: r.tipo === "Organizacion" ? "Organizador" : r.tipo,
						asociadoId: r.asociadoId,
					})
				)
			);
			setTableRows(prev => prev.map(r => r.isNew ? { ...r, isNew: false } : r));
		},
		hasUnsaved: () => tableRows.some(r => r.isNew === true),
		getNewAsociados: () => tableRows
			.filter(r => r.isNew)
			.map(r => ({
				srtComercializadorInterno: 0,
				tipo: r.tipo === "Organizacion" ? "Organizador" : r.tipo,
				asociadoId: r.asociadoId,
			})),
	}), [tableRows, comercializadorInterno, triggerPost]);

	const grupoOptions = useMemo<SelectOption[]>(
		() => asArray(gruposData as ApiGrupoItem[] | { DATA?: ApiGrupoItem[]; data?: ApiGrupoItem[] } | undefined)
			.map(item => ({ value: Number(item.interno ?? 0), label: String(item.razonSocial ?? item.descripcion ?? "") }))
			.filter(item => item.value > 0),
		[gruposData]
	);

	const organizacionOptions = useMemo<SelectOption[]>(
		() => asArray(organizacionesData as ApiOrganizacionItem[] | { DATA?: ApiOrganizacionItem[]; data?: ApiOrganizacionItem[] } | undefined)
			.map(item => ({ value: Number(item.interno ?? 0), label: String(item.razonSocial ?? item.observacion ?? item.observaciones ?? "") }))
			.filter(item => item.value > 0),
		[organizacionesData]
	);

	const editOrganizacionOptions = useMemo<SelectOption[]>(
		() => asArray(editOrganizacionesData as ApiOrganizacionItem[] | { DATA?: ApiOrganizacionItem[]; data?: ApiOrganizacionItem[] } | undefined)
			.map(item => ({ value: Number(item.interno ?? 0), label: String(item.razonSocial ?? item.observacion ?? item.observaciones ?? "") }))
			.filter(item => item.value > 0),
		[editOrganizacionesData]
	);

	const handleBajaConfirm = async () => {
		if (!pendingBajaRow) return;
		if (pendingBajaRow.isNew) {
			setTableRows(prev => prev.filter(r => !(r.asociadoId === pendingBajaRow.asociadoId && r.tipo === pendingBajaRow.tipo)));
			setPendingBajaRow(null);
			return;
		}
		try {
			await triggerBaja({
				id: pendingBajaRow.interno!,
				data: {
					interno: pendingBajaRow.interno!,
					srtComercializadorInterno: comercializadorInterno,
					tipo: pendingBajaRow.tipo,
					asociadoId: pendingBajaRow.asociadoId,
					fechaBaja: new Date().toISOString(),
				},
			});
			setTableRows(prev => prev.filter(r => !(r.asociadoId === pendingBajaRow.asociadoId && r.tipo === pendingBajaRow.tipo)));
			setShowBajaSuccess(true);
		} catch (error) {
			const apiMessage = (error as { response?: { data?: { Mensaje?: string } } })?.response?.data?.Mensaje;
			setBajaErrorMessage(apiMessage || "No se pudo dar de baja la asociacion.");
			setShowBajaError(true);
		} finally {
			setPendingBajaRow(null);
		}
	};

	const handleOpenEdit = (row: AsociadoRow) => {
		setEditRow(row);
		if (row.tipo === "Organizador") {
			setEditOrganizacionId(row.asociadoId);
			setEditGrupoId(null);
		} else {
			setEditGrupoId(row.asociadoId);
			setEditOrganizacionId(null);
		}
	};

	const handleEditSave = async () => {
		if (!editRow) return;
		const asociadoId = editOrganizacionId ?? editGrupoId!;
		const tipo = editOrganizacionId ? "Organizador" : "Grupo";

		if (tableRows.some((item) => item !== editRow && item.asociadoId === asociadoId && item.tipo === tipo)) {
			setShowDuplicate(true);
			return;
		}

		if (editRow.isNew) {
			setTableRows(prev => prev.map(r => r === editRow ? { ...r, asociadoId, tipo } : r));
			setEditRow(null);
			return;
		}

		try {
		await triggerPut({
			id: editRow!.interno!,
			data: {
				interno: editRow!.interno!,
				srtComercializadorInterno: comercializadorInterno,
				tipo,
				asociadoId,
				fechaBaja: null,
			},
		});
		setTableRows(prev => prev.map(r => r === editRow ? { ...r, asociadoId, tipo } : r));
		setEditRow(null);
		} catch (error) {
			const apiMessage = (error as { response?: { data?: { Mensaje?: string } } })?.response?.data?.Mensaje;
			setEditErrorMessage(apiMessage || "No se puede modificar la asociación porque fue utilizada en pólizas.");
			setShowEditError(true);
		}
	};

	const columns = useMemo<ColumnDef<AsociadoRow, unknown>[]>(
		() => [
			{ id: "comercializador", header: "Comercializador", cell: () => comercializadorNombre },
			{
                id: "nombreAsociado",
				header: "Asociado",
				cell: ({ row }) => <NombreAsociadoCell tipo={row.original.tipo} asociadoId={row.original.asociadoId} />,
			},
            { accessorKey: "tipo", header: "Tipo" },
            ...(!readOnly ? [{
				id: "acciones",
				header: "Acciones",
				meta: { align: "center", width: 100 },
				cell: ({ row }: { row: { original: AsociadoRow } }) => (
					<Box className={styles.actionButtons}>
						<MdEdit
							className={styles.editIcon}
							onClick={() => handleOpenEdit(row.original)}
						/>
						<MdDelete
							className={styles.deleteIcon}
							onClick={() => setPendingBajaRow(row.original)}
						/>
					</Box>
				),
			} as ColumnDef<AsociadoRow, unknown>] : []),
		],
		[comercializadorNombre, readOnly]
	);

	const handleAgregar = () => {
		if (!selectedGrupoId && !selectedOrganizacionId) return;

		const asociadoId = selectedOrganizacionId ?? selectedGrupoId!;
		const tipo = selectedOrganizacionId ? "Organizador" : "Grupo";

		if (tableRows.some((item) => item.asociadoId === asociadoId && item.tipo === tipo)) {
			setShowDuplicate(true);
			return;
		}

		setTableRows((prev) => [...prev, { asociadoId, tipo, isNew: true }]);
	};

	return (
		<Box className={styles.asociadosContainer}>
			<Box className={styles.formRow}>
				<Autocomplete<SelectOption, false, false, false>
					options={grupoOptions}
					getOptionLabel={(option) => option.label}
					isOptionEqualToValue={(option, value) => option.value === value.value}
					value={grupoOptions.find((option) => option.value === selectedGrupoId) ?? null}
					onChange={(_event, newValue) => {
						setSelectedGrupoId(newValue?.value ?? null);
						setSelectedOrganizacionId(null);
					}}
					renderInput={(params) => <TextField {...params} label="Grupo" />}
					fullWidth
					disabled={readOnly}
				/>
				<Autocomplete<SelectOption, false, false, false>
					options={organizacionOptions}
					getOptionLabel={(option) => option.label}
					isOptionEqualToValue={(option, value) => option.value === value.value}
					value={organizacionOptions.find((option) => option.value === selectedOrganizacionId) ?? null}
					onChange={(_event, newValue) => setSelectedOrganizacionId(newValue?.value ?? null)}
					renderInput={(params) => <TextField {...params} label="Organización" />}
					fullWidth
					disabled={readOnly}
				/>
			</Box>
			<Box className={styles.asociadosActions}>
				<CustomButton disabled={readOnly || (!selectedGrupoId && !selectedOrganizacionId)} onClick={handleAgregar}>
					Agregar
				</CustomButton>
			</Box>
			<Box className={styles.asociadosTableWrapper}>
				<DataTable<AsociadoRow>
					data={tableRows}
					columns={columns}
					isLoading={isLoading}
					size="mid"
					rowKeyField="asociadoId"
					enableFiltering={false}
				/>
			</Box>
			<CustomModal
				open={!!pendingBajaRow}
				onClose={() => setPendingBajaRow(null)}
				size="small"
				actions={
					<>
						<CustomButton onClick={handleBajaConfirm}>Si</CustomButton>
						<CustomButton color="secondary" onClick={() => setPendingBajaRow(null)}>No</CustomButton>
					</>
				}
			>
				¿Estas seguro que quieres dar de baja la asociacion?
			</CustomModal>
			<CustomModalMessage
				open={showBajaSuccess}
				type="success"
				message="Asociacion dada de baja existoosamente"
				onClose={() => setShowBajaSuccess(false)}
			/>
			<CustomModalMessage
				open={showBajaError}
				type="error"
				message={bajaErrorMessage}
				onClose={() => setShowBajaError(false)}
			/>
			<CustomModalMessage
				open={showDuplicate}
				type="warning"
				title="Asociación duplicada"
				message="Esta asociación ya se encuentra registrada en el sistema."
				onClose={() => setShowDuplicate(false)}
			/>
			<CustomModalMessage
				open={showEditError}
				type="error"
				title="Error al editar la asociación"
				message={editErrorMessage}
				onClose={() => setShowEditError(false)}
			/>
			<CustomModal
				open={!!editRow}
				onClose={() => setEditRow(null)}
				title="Editar una asociación"
				size="mid"
				actions={
					<>
						<CustomButton onClick={handleEditSave}>Guardar</CustomButton>
						<CustomButton color="secondary" onClick={() => setEditRow(null)}>Cancelar</CustomButton>
					</>
				}
			>
				<Box className={styles.formRow}>
					<Autocomplete<SelectOption, false, false, false>
						options={grupoOptions}
						getOptionLabel={(option) => option.label}
						isOptionEqualToValue={(option, value) => option.value === value.value}
						value={grupoOptions.find((option) => option.value === editGrupoId) ?? null}
						onChange={(_event, newValue) => {
							setEditGrupoId(newValue?.value ?? null);
							setEditOrganizacionId(null);
						}}
						renderInput={(params) => <TextField {...params} label="Grupo" />}
						fullWidth
					/>
					<Autocomplete<SelectOption, false, false, false>
						options={editOrganizacionOptions}
						getOptionLabel={(option) => option.label}
						isOptionEqualToValue={(option, value) => option.value === value.value}
						value={editOrganizacionOptions.find((option) => option.value === editOrganizacionId) ?? null}
						onChange={(_event, newValue) => setEditOrganizacionId(newValue?.value ?? null)}
						renderInput={(params) => <TextField {...params} label="Organización" />}
						fullWidth
					/>
				</Box>
			</CustomModal>
		</Box>
	);
});

export default Asociados;
