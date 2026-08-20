"use client";

import React, { useEffect, useRef, useState } from "react";
import { MenuItem, TextField, Typography, Autocomplete, CircularProgress } from "@mui/material";
import CustomButton from "@/utils/ui/button/CustomButton";
import { FaSearch } from "react-icons/fa";
import { SelectChangeEvent } from "@mui/material/Select";
import styles from "../denuncias.module.css";
import localStyles from "./nuevaDenuncia.module.css";
import { DenunciaFormData, TIPOS_TRASLADO } from "../types/tDenuncias";
import ArtAPI, { EstablecimientoVmDescripcion } from '@/data/artAPI';
import Formato from "@/utils/Formato";

const SI_NO_IGNORA_OPTIONS = ["Si", "No", "Ignora"] as const;
const ESTADO_COLOR_OPTIONS = [
	'Ind.',
	'ROJO: CON riesgo de vida',
	'AMARILLO: SIN riesgo de vida',
	'VERDE: posible consulta'
] as const;
const GRAVEDAD_OPTIONS = ['Ignora', 'Leve', 'Moderada', 'Grave', 'Muerte'] as const;
const ROAM_SELECT_OPTIONS = ["Si", "No", "Posible"] as const;

type NuevaDenunciaProps = {
	form: DenunciaFormData;
	errors: { [K in keyof DenunciaFormData]?: string };
	touched: { [K in keyof DenunciaFormData]?: boolean };
	isDisabled: boolean;
	onTextFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSelectChange: (e: SelectChangeEvent<string>) => void;
	onBlur: (fieldName: keyof DenunciaFormData) => void;
};

export default function NuevaDenuncia({
	form,
	errors,
	touched,
	isDisabled,
	onTextFieldChange,
	onSelectChange,
	onBlur,
}: NuevaDenunciaProps) {
	const { data: roamData = [], isValidating: isLoadingRoam } = ArtAPI.useGetRefRoam();
	const roamValue = String((form as any).roam || '').trim().toLowerCase();
	const isRoamExtraEnabled = !isDisabled && (roamValue === 'si' || roamValue === 'posible');


	// Localidad search states (copiado/adaptado desde DatosIniciales)
	const [cpBuscado, setCpBuscado] = useState<number | null>(null);
	const [busqueda, setBusqueda] = useState<string>("");
	const [nombreBuscado, setNombreBuscado] = useState<string | null>(null);

	// Localidades hooks
	const { data: localidadesData, isValidating: isValidatingCP } = ArtAPI.useGetLocalidadesbyCP(cpBuscado ? { CodPostal: cpBuscado } : {});
	const localidadesFromCpButton: any[] = Array.isArray(localidadesData) ? localidadesData : [];
	const { data: localidadesByNombre, isValidating: isValidatingNombre } = ArtAPI.useGetLocalidadesbyNombre(nombreBuscado ? { Nombre: nombreBuscado } : {});
	const isValidatingLocalidad = isValidatingCP || isValidatingNombre;

	const codigoLocalidadDigits = String((form as any).ocurrenciaCodLocalidad || '').replace(/\D/g, '');
	const codigoLocalidadNum = codigoLocalidadDigits ? Number(codigoLocalidadDigits) : 0;
	const { data: localidadCodigoData } = ArtAPI.useGetLocalidadesbyCodigo(codigoLocalidadNum ? { Codigo: codigoLocalidadNum } : {});
	const localidadCodigoItem = Array.isArray(localidadCodigoData) ? localidadCodigoData[0] : localidadCodigoData || null;

	const lastFetchedEstCuitRef = useRef<string>('');
	const [localEstCuit, setLocalEstCuit] = useState<string>('');
	const estCuitDigits = String(localEstCuit || '').replace(/\D/g, '');
	const hasEstCuitValido = estCuitDigits.length === 11;

	// Al editar una denuncia existente, sincronizar el CUIT local (que controla
	// esta sección) con el valor ya guardado en el formulario, para no depender
	// de que el usuario lo tipee de nuevo.
	const ocurrenciaCuitSyncedRef = useRef(false);
	useEffect(() => {
		if (ocurrenciaCuitSyncedRef.current) return;
		const formCuitDigits = String((form as any).ocurrenciaCuit || '').replace(/\D/g, '');
		if (formCuitDigits) {
			setLocalEstCuit(formCuitDigits);
			lastFetchedEstCuitRef.current = formCuitDigits;
			ocurrenciaCuitSyncedRef.current = true;
		}
	}, [(form as any).ocurrenciaCuit]);

	// Prestador traslado local state
	const [prestadorLoading, setPrestadorLoading] = useState(false);
	const lastFetchedPrestadorCuitRef = useRef<string>('');

	// Estado local para la selección del Autocomplete de Establecimiento.
	// NO debe escribir en el formulario; solo controla la UI del select.
	const [selectedEstablecimiento, setSelectedEstablecimiento] = useState<any | null>(null);

	// Establecimientos filtrados por CUIT (solo si hay CUIT válido de 11 dígitos)
	const cuitForEstablecimientos = hasEstCuitValido ? Number(estCuitDigits) : 0;
	const { data: establecimientosList = [], isValidating: isLoadingEstablecimientos } = ArtAPI.useEstablecimientoList(
		cuitForEstablecimientos ? { cuit: cuitForEstablecimientos } : undefined
	);

	// Al editar una denuncia existente, una vez cargada la lista de establecimientos
	// del CUIT, preseleccionar en el Autocomplete el que coincide con los datos de
	// Ocurrencia ya guardados en el formulario (por calle+número, o por nombre).
	useEffect(() => {
		if (selectedEstablecimiento) return;
		if (!Array.isArray(establecimientosList) || establecimientosList.length === 0) return;

		const onlyDigitsLocal = (v?: string) => (v ?? '').replace(/\D/g, '');
		const formCalle = String((form as any).ocurrenciaCalle || '').trim().toLowerCase();
		const formNumero = onlyDigitsLocal(String((form as any).ocurrenciaNumero || ''));
		const formNombre = String((form as any).ocurrenciaRazonSocial || '').trim().toLowerCase();

		const match = establecimientosList.find((est: any) => {
			const estCalle = String(est.domicilioCalle || '').trim().toLowerCase();
			const estNumero = onlyDigitsLocal(String(est.domicilioNro || ''));
			if (formCalle && estCalle === formCalle && formNumero === estNumero) {
				return true;
			}
			const estNombre = String(est.nombre || '').trim().toLowerCase();
			return !!formNombre && estNombre === formNombre;
		});

		if (match) {
			setSelectedEstablecimiento(match);
		}
	}, [establecimientosList, (form as any).ocurrenciaCalle, (form as any).ocurrenciaNumero, (form as any).ocurrenciaRazonSocial, selectedEstablecimiento]);

	let localidadesOptions: any[] = [];
	if (nombreBuscado) {
		localidadesOptions = Array.isArray(localidadesByNombre) ? localidadesByNombre : [];
	} else {
		localidadesOptions = localidadesFromCpButton.length ? localidadesFromCpButton : localidadCodigoItem ? [localidadCodigoItem] : [];
	}

	useEffect(() => {
		const raw = String(localEstCuit || '').replace(/\D/g, '');
		if (!raw || raw.length !== 11) return;
		if (lastFetchedEstCuitRef.current === raw) return;

		let cancelled = false;
		(async () => {
			try {
				const empresa: any = await ArtAPI.getEmpresaByCUIT({ CUIT: Number(raw) });
				if (cancelled || !empresa) return;

				const mappings: Record<string, any> = {
					ocurrenciaRazonSocial: String(empresa.razonSocial ?? empresa.RazonSocial ?? ''),
					ocurrenciaCalle: String(empresa.domicilioCalle ?? empresa.domicilio ?? ''),
					ocurrenciaNumero: String(empresa.domicilioNro ?? empresa.domicilioNumero ?? ''),
					ocurrenciaPiso: String(empresa.domicilioPiso ?? ''),
					ocurrenciaDpto: String(empresa.domicilioDpto ?? ''),
					ocurrenciaEntreCalle1: String(empresa.domicilioEntreCalle1 ?? ''),
					ocurrenciaEntreCalle2: String(empresa.domicilioEntreCalle2 ?? ''),
					ocurrenciaEmail: String(empresa.email ?? empresa.mail ?? empresa.Email ?? ''),
					ocurrenciaTelefonos: String(empresa.telefono ?? empresa.telefonos ?? empresa.telefono1 ?? ''),
					ocurrenciaCiiu: String(empresa.ciiu ?? empresa.CIIU ?? empresa.clasificacionCiiu ?? empresa.actividadCIIU ?? ''),
					ocurrenciaCodPostal: String(empresa.codLocalidadPostal ?? empresa.cp ?? ''),
					ocurrenciaCodLocalidad: String(empresa.codLocalidad ?? ''),
				};

				Object.keys(mappings).forEach((k) => {
					const ev = { target: { name: k, value: mappings[k] } } as unknown as React.ChangeEvent<HTMLInputElement>;
					onTextFieldChange(ev);
				});

				// If empresa returned a postal code for localidad, trigger localidad search by CP
				const postal = mappings.ocurrenciaCodPostal;
				if (postal) {
					const cpNum = Number(String(postal).replace(/\D/g, ''));
					if (cpNum) setCpBuscado(cpNum);
				}

				// also propagate the CUIT itself into the form
				const evCuit = { target: { name: 'ocurrenciaCuit', value: raw } } as unknown as React.ChangeEvent<HTMLInputElement>;
				onTextFieldChange(evCuit);

				lastFetchedEstCuitRef.current = raw;
			} catch (e) {
				// ignore
			}
		})();

		return () => { cancelled = true; };
	}, [localEstCuit]);

	// Si la búsqueda por CP devolvió localidades, y no tenemos todavía codLocalidad establecido, autopoblar
	useEffect(() => {
		if (!hasEstCuitValido) return;
		if (!Array.isArray(localidadesFromCpButton) || localidadesFromCpButton.length === 0) return;
		const first = localidadesFromCpButton[0];
		if (!first) return;
		// Si el formulario ya tiene código, no sobreescribir
		const existing = String((form as any).ocurrenciaCodLocalidad || '').replace(/\D/g, '');
		if (existing) return;
		const codigo = String(first.codigo ?? first.Codigo ?? '');
		const postal = String(first.codPostal ?? first.CodPostal ?? '');
		if (codigo) {
			const ev = { target: { name: 'ocurrenciaCodLocalidad', value: codigo } } as unknown as React.ChangeEvent<HTMLInputElement>;
			onTextFieldChange(ev);
		}
		if (postal) {
			const ev2 = { target: { name: 'ocurrenciaCodPostal', value: postal } } as unknown as React.ChangeEvent<HTMLInputElement>;
			onTextFieldChange(ev2);
		}
	}, [localidadesFromCpButton, hasEstCuitValido]);

		return (<>
			<div className={styles.formSection}>
				<Typography variant="h6" className={styles.sectionTitle}>
					Ocurrencia
				</Typography>
				<div className={`${styles.formRow} ${localStyles.gridThreeCols}`}> 
					<TextField
						label="CUIT Occurrence"
						name="ocurrenciaCuit"
						value={estCuitDigits.length === 11 ? Formato.CUIP(estCuitDigits) : localEstCuit}
						onChange={(e) => {
							const digits = String((e.target as HTMLInputElement).value || '').replace(/\D/g, '');
							setLocalEstCuit(digits);
						}}
						onBlur={() => {
							const ev = { target: { name: 'ocurrenciaCuit', value: localEstCuit } } as unknown as React.ChangeEvent<HTMLInputElement>;
							onTextFieldChange(ev);
							onBlur('ocurrenciaCuit');
						}}
						fullWidth
						disabled={isDisabled}
						inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
					/>
					{/* mostrados tras la busqueda */}
					<TextField label="Razón Social" value={hasEstCuitValido ? ((form as any).ocurrenciaRazonSocial || '') : ''} fullWidth disabled />

					{/* Autocomplete Establecimiento filtrado por CUIT */}
					<Autocomplete
						disabled={isDisabled || !hasEstCuitValido}
						options={establecimientosList || []}
						getOptionLabel={(opt: any) => EstablecimientoVmDescripcion(opt)}
						value={selectedEstablecimiento}
						onChange={(_e, newValue: any) => {
							// Solo actualizar el estado del select en la UI. NO tocar el formulario.
							setSelectedEstablecimiento(newValue ?? null);
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Establecimiento"
								placeholder="Filtrar por CUIT"
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<>
											{isLoadingEstablecimientos ? <CircularProgress color="inherit" size={16} /> : null}
											{params.InputProps.endAdornment}
										</>
									)
								}}
							/>
						)}
					/>
				</div>




			
					{/* email / telefonos / ciiu */}
					<div className={`${styles.formRow} ${localStyles.gridThreeRepeatWithMarginTop}`}>
						<TextField label="Email" value={hasEstCuitValido ? ((form as any).ocurrenciaEmail || '') : ''} fullWidth disabled />
						<TextField label="Teléfonos" value={hasEstCuitValido ? ((form as any).ocurrenciaTelefonos || '') : ''} fullWidth disabled />
						<TextField label="CIIU" value={hasEstCuitValido ? ((form as any).ocurrenciaCiiu || '') : ''} fullWidth disabled />
					</div>
				<div className={`${styles.formRow} ${localStyles.gridThreeRepeat}`}>
					<TextField label="Calle" value={hasEstCuitValido ? ((form as any).ocurrenciaCalle || '') : ''} fullWidth disabled />
					<TextField label="Número" value={hasEstCuitValido ? ((form as any).ocurrenciaNumero || '') : ''} fullWidth disabled />
					<TextField label="Piso" value={hasEstCuitValido ? ((form as any).ocurrenciaPiso || '') : ''} fullWidth disabled />
				</div>
				<div className={`${styles.formRow} ${localStyles.gridThreeRepeat}`}>
					<TextField label="Dpto" value={hasEstCuitValido ? ((form as any).ocurrenciaDpto || '') : ''} fullWidth disabled />
					<TextField label="Entre Calle 1" value={hasEstCuitValido ? ((form as any).ocurrenciaEntreCalle1 || '') : ''} fullWidth disabled />
					<TextField label="Entre Calle 2" value={hasEstCuitValido ? ((form as any).ocurrenciaEntreCalle2 || '') : ''} fullWidth disabled />
				</div>
				{/* Buscador de Localidad (CP / nombre) */}
				<div className={`${styles.formRow} ${localStyles.gridSearchLocalidad}`}>
					<TextField
						label="Búsqueda Localidad / C.P."
						name="busqueda"
						value={busqueda}
						onChange={(e) => setBusqueda(e.target.value)}
						fullWidth
						disabled={isDisabled || !hasEstCuitValido}
						placeholder="Buscar..."
					/>

					<CustomButton
						color="primary"
						size="mid"
						className={styles.smallButton}
						aria-label="buscar localidad"
						onClick={() => {
							if (!hasEstCuitValido) return;
							const text = busqueda.trim();
							if (text) {
								if (/^\d+$/.test(text)) {
									setNombreBuscado(null);
									setCpBuscado(Number(text));
								} else {
									setCpBuscado(null);
									setNombreBuscado(text);
								}
								return;
							}
							const cp = Number((form as any).ocurrenciaCodPostal ?? 0);
							if (!cp || Number.isNaN(cp)) return;
							setNombreBuscado(null);
							setCpBuscado(cp);
						}}
					>
						<FaSearch />
					</CustomButton>
					<div>
						<Autocomplete
							disabled={isDisabled || !hasEstCuitValido}
							options={localidadesOptions}
							getOptionLabel={(opt: any) => String(opt?.nombreCompleto ?? opt?.nombre ?? "")}
							isOptionEqualToValue={(opt: any, val: any) => String(opt?.codigo) === String(val?.codigo)}
							value={hasEstCuitValido ? (localidadesOptions.find((loc) => String(loc.codigo) === String((form as any).ocurrenciaCodLocalidad)) ?? null) : null}
							onChange={(_e, newValue: any) => {
								const codigo = newValue ? String(newValue.codigo ?? "") : "";
								const nombre = newValue ? String(newValue.nombreCompleto ?? newValue.nombre ?? "") : "";
								const syntheticCod = { target: { name: 'ocurrenciaCodLocalidad', value: codigo } } as any;
								onTextFieldChange(syntheticCod);
								const syntheticPostal = { target: { name: 'ocurrenciaCodPostal', value: String(newValue ? (newValue.codPostal ?? newValue.CodPostal ?? "") : "") } } as any;
								onTextFieldChange(syntheticPostal);
								// provincia -> no existe campo específico, omitimos
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									label="Localidad"
									placeholder="Seleccione localidad"
									onBlur={() => onBlur('ocurrenciaCodLocalidad')}
								/>
							)}
						/>
					</div>
					<TextField label="Cód. Postal" name="ocurrenciaCodPostal" value={hasEstCuitValido ? ((form as any).ocurrenciaCodPostal || '') : ''} fullWidth disabled />
				</div>
			</div>


				<div className={styles.formSection}>
					<Typography variant="h6" className={styles.sectionTitle}>
						Estado del Trabajador
					</Typography>

				<div className={`${styles.formRow} ${localStyles.gridFourRepeat}`}>
					<TextField
						select
						label="Esta consciente?"
						name="estTrabEstaConsciente"
						value={form.estTrabEstaConsciente}
						onChange={(e) => onSelectChange(e as SelectChangeEvent<string>)}
						onBlur={() => onBlur("estTrabEstaConsciente")}
						error={touched.estTrabEstaConsciente && !!errors.estTrabEstaConsciente}
						helperText={touched.estTrabEstaConsciente ? errors.estTrabEstaConsciente : undefined}
						fullWidth
						disabled={isDisabled}
					>
						{SI_NO_IGNORA_OPTIONS.map((option) => (
							<MenuItem key={option} value={option}>{option}</MenuItem>
						))}
					</TextField>

					<TextField
						select
						label="Respira?"
						name="estTrabRespira"
						value={form.estTrabRespira}
						onChange={(e) => onSelectChange(e as SelectChangeEvent<string>)}
						onBlur={() => onBlur("estTrabRespira")}
						error={touched.estTrabRespira && !!errors.estTrabRespira}
						helperText={touched.estTrabRespira ? errors.estTrabRespira : undefined}
						fullWidth
						disabled={isDisabled}
					>
						{SI_NO_IGNORA_OPTIONS.map((option) => (
							<MenuItem key={option} value={option}>{option}</MenuItem>
						))}
					</TextField>

					<TextField
						select
						label="Gravedad"
						name="estTrabGravedad"
						value={form.estTrabGravedad}
						onChange={(e) => onSelectChange(e as SelectChangeEvent<string>)}
						onBlur={() => onBlur("estTrabGravedad")}
						error={touched.estTrabGravedad && !!errors.estTrabGravedad}
						helperText={touched.estTrabGravedad ? errors.estTrabGravedad : undefined}
						fullWidth
						disabled={isDisabled}
					>
						{GRAVEDAD_OPTIONS.map((option) => (
							<MenuItem key={option} value={option}>{option}</MenuItem>
						))}
					</TextField>

					<TextField
						select
						label="Habla?"
						name="estTrabHabla"
						value={form.estTrabHabla}
						onChange={(e) => onSelectChange(e as SelectChangeEvent<string>)}
						onBlur={() => onBlur("estTrabHabla")}
						error={touched.estTrabHabla && !!errors.estTrabHabla}
						helperText={touched.estTrabHabla ? errors.estTrabHabla : undefined}
						fullWidth
						disabled={isDisabled}
					>
						{SI_NO_IGNORA_OPTIONS.map((option) => (
							<MenuItem key={option} value={option}>{option}</MenuItem>
						))}
					</TextField>
				</div>

				<div className={`${styles.formRow} ${localStyles.gridFourRepeat}`}>
					<TextField
						select
						label="Color"
						name="estTrabColor"
						value={form.estTrabColor}
						onChange={(e) => onSelectChange(e as SelectChangeEvent<string>)}
						onBlur={() => onBlur("estTrabColor")}
						error={touched.estTrabColor && !!errors.estTrabColor}
						helperText={touched.estTrabColor ? errors.estTrabColor : undefined}
						fullWidth
						disabled={isDisabled}
					>
						{ESTADO_COLOR_OPTIONS.map((option) => (
							<MenuItem key={option} value={option}>{option}</MenuItem>
						))}
					</TextField>

					<TextField
						select
						label="Tiene hemorragias?"
						name="estTrabTieneHemorragia"
						value={form.estTrabTieneHemorragia}
						onChange={(e) => onSelectChange(e as SelectChangeEvent<string>)}
						onBlur={() => onBlur("estTrabTieneHemorragia")}
						error={touched.estTrabTieneHemorragia && !!errors.estTrabTieneHemorragia}
						helperText={touched.estTrabTieneHemorragia ? errors.estTrabTieneHemorragia : undefined}
						fullWidth
						disabled={isDisabled}
					>
						{SI_NO_IGNORA_OPTIONS.map((option) => (
							<MenuItem key={option} value={option}>{option}</MenuItem>
						))}
					</TextField>

					<TextField
						select
						label="Contexto de Riesgo?"
						name="estTrabContextoDenuncia"
						value={form.estTrabContextoDenuncia}
						onChange={(e) => onSelectChange(e as SelectChangeEvent<string>)}
						onBlur={() => onBlur("estTrabContextoDenuncia")}
						error={touched.estTrabContextoDenuncia && !!errors.estTrabContextoDenuncia}
						helperText={touched.estTrabContextoDenuncia ? errors.estTrabContextoDenuncia : undefined}
						fullWidth
						disabled={isDisabled}
					>
						{SI_NO_IGNORA_OPTIONS.map((option) => (
							<MenuItem key={option} value={option}>{option}</MenuItem>
						))}
					</TextField>

					{/* Tipo de Traslado */}
					<TextField
						select
						label="Tipo de Traslado"
						name="trasladoTipo"
						value={(form as any).trasladoTipo}
						onChange={(e) => onSelectChange(e as SelectChangeEvent<string>)}
						onBlur={() => onBlur('trasladoTipo')}
						error={touched.trasladoTipo && !!errors.trasladoTipo}
						helperText={touched.trasladoTipo ? errors.trasladoTipo : undefined}
						fullWidth
						disabled={isDisabled}
					>
						{TIPOS_TRASLADO.map((opt) => (
							<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
						))}
					</TextField>
				</div>

				<div className={styles.formRow}>
					<TextField
						label="Observaciones"
						name="estTrabObservaciones"
						value={form.estTrabObservaciones}
						onChange={onTextFieldChange}
						onBlur={() => onBlur("estTrabObservaciones")}
						error={touched.estTrabObservaciones && !!errors.estTrabObservaciones}
						helperText={touched.estTrabObservaciones ? errors.estTrabObservaciones : undefined}
						fullWidth
						disabled={isDisabled}
						multiline
						minRows={3}
						placeholder="Observaciones"
					/>
				</div>
			</div>

			{/* ROAM */}
			<div className={styles.formSection}>
				<Typography variant="h6" className={styles.sectionTitle}>
					ROAM
				</Typography>
				<div className={`${styles.formRow} ${localStyles.gridRoam}`}> 
					<TextField
						select
						label="ROAM"
						name="roam"
						value={(form as any).roam}
						onChange={(e) => onSelectChange(e as SelectChangeEvent<string>)}
						onBlur={() => onBlur("roam")}
						error={(touched as any).roam && !!(errors as any).roam}
						helperText={(touched as any).roam ? (errors as any).roam : undefined}
						fullWidth
						disabled={isDisabled}
					>
						{ROAM_SELECT_OPTIONS.map((opt) => (
							<MenuItem key={opt} value={opt}>{opt}</MenuItem>
						))}
					</TextField>

					<TextField
						label="Roam Nro"
						name="roamNumero"
						value={(form as any).roamNumero}
						onChange={(e) => {
							const digits = String((e.target as HTMLInputElement).value || '').replace(/\D/g, '');
							const ev = { target: { name: (e.target as HTMLInputElement).name, value: digits } } as unknown as React.ChangeEvent<HTMLInputElement>;
							onTextFieldChange(ev);
						}}
						onBlur={() => onBlur('roamNumero')}
						error={(touched as any).roamNumero && !!(errors as any).roamNumero}
						helperText={(touched as any).roamNumero ? (errors as any).roamNumero : undefined}
						fullWidth
						disabled={!isRoamExtraEnabled}
						inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
					/>

					<TextField
						label="Roam Año"
						name="roamAnio"
						value={(form as any).roamAnio}
						onChange={(e) => {
							const digits = String((e.target as HTMLInputElement).value || '').replace(/\D/g, '');
							const ev = { target: { name: (e.target as HTMLInputElement).name, value: digits } } as unknown as React.ChangeEvent<HTMLInputElement>;
							onTextFieldChange(ev);
						}}
						onBlur={() => onBlur('roamAnio')}
						error={(touched as any).roamAnio && !!(errors as any).roamAnio}
						helperText={(touched as any).roamAnio ? (errors as any).roamAnio : undefined}
						fullWidth
						disabled={!isRoamExtraEnabled}
						inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
					/>

					<Autocomplete
						disabled={!isRoamExtraEnabled}
						options={roamData || []}
						getOptionLabel={(o: any) => o?.roamDetalle ?? ''}
						value={(roamData || []).find((r: any) => String(r.interno) === String((form as any).roamInterno)) ?? null}
						onChange={(_, value) => {
							const ev = { target: { name: 'roamInterno', value: value ? String(value.interno) : '' } } as unknown as React.ChangeEvent<HTMLInputElement>;
							onTextFieldChange(ev);
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Buscar ROAM"
								placeholder="Seleccione ROAM..."
								onBlur={() => onBlur('roamInterno')}
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<>
											{isLoadingRoam ? <CircularProgress color="inherit" size={16} /> : null}
											{params.InputProps.endAdornment}
										</>
									)
								}}
							/>
						)}
					/>
				</div>
			</div>

			{/* Prestador Traslado */}
			<div className={styles.formSection}>
				<Typography variant="h6" className={styles.sectionTitle}>
					Prestador Traslado
				</Typography>
				<div className={styles.formRow}>
					<TextField
						label="CUIT Prestador"
						name="estTrabPrestadorTraslado"
						value={(form as any).estTrabPrestadorTraslado || ''}
						onChange={(e) => {
							const digits = String((e.target as HTMLInputElement).value || '').replace(/\D/g, '');
							const ev = { target: { name: 'estTrabPrestadorTraslado', value: digits } } as unknown as React.ChangeEvent<HTMLInputElement>;
							onTextFieldChange(ev);
						}}
						onBlur={async () => {
							const digits = String((form as any).estTrabPrestadorTraslado || '').replace(/\D/g, '');
							if (!digits || digits.length !== 11) return onBlur('estTrabPrestadorTraslado');
							if (lastFetchedPrestadorCuitRef.current === digits) return onBlur('estTrabPrestadorTraslado');
							setPrestadorLoading(true);
							try {
								const data: any = await ArtAPI.getPrestador({ CUIT: Number(digits) });
								const razon = String(data?.razonSocial ?? data?.razon ?? '');
								const ev2 = { target: { name: 'estTrabPrestadorTrasladoRazonSocial', value: razon } } as unknown as React.ChangeEvent<HTMLInputElement>;
								onTextFieldChange(ev2);
								lastFetchedPrestadorCuitRef.current = digits;
							} catch {
								// ignore
							} finally {
								setPrestadorLoading(false);
								onBlur('estTrabPrestadorTraslado');
							}
						}}
						fullWidth
						inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
						placeholder="CUIT del prestador"
					/>

					<TextField
						label="Razón Social Prestador"
						name="estTrabPrestadorTrasladoRazonSocial"
						value={(form as any).estTrabPrestadorTrasladoRazonSocial || ''}
						onChange={onTextFieldChange}
						onBlur={() => onBlur('estTrabPrestadorTrasladoRazonSocial')}
						fullWidth
						disabled={isDisabled || prestadorLoading}
						placeholder="Razón social"
					/>
				</div>
			</div>
		</>
	);
}
