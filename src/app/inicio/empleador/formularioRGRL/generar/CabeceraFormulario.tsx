'use client';

import React from 'react';
import Box from '@mui/material/Box';
import { TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete } from '@mui/material';
import CustomButton from '@/utils/ui/button/CustomButton';
import { CUIP } from '@/utils/Formato';
import styles from './GenerarFormularioRGRL.module.css';
import type { Establecimiento, TipoFormulario } from './types/generar';

type CabeceraFormularioProps = {
	cuit?: number;
	onCuitChange: (value: number | undefined) => void;
	razonSocial: string;
	establecimientos: Establecimiento[];
	estActual?: Establecimiento;
	esReplica: boolean;
	onEstablecimientoChange: (value: number | undefined) => void;
	estSuperficie: number | string;
	onSuperficieChange: (value: string) => void;
	estCantTrab: number | string;
	onCantTrabChange: (value: string) => void;
	tipos: TipoFormulario[];
	tipoSel?: number;
	onTipoChange: (value: number | undefined) => void;
	onVolver: () => void;
	onCrear: () => void;
	disableCrear: boolean;
	soloLectura?: boolean;
	/** Solo bloquea el campo CUIT (p. ej. CUIT fijado desde el selector de empresa del listado). */
	cuitSoloLectura?: boolean;
	mostrarAcciones?: boolean;
};

const CabeceraFormulario: React.FC<CabeceraFormularioProps> = ({
	cuit,
	onCuitChange,
	razonSocial,
	establecimientos,
	estActual,
	esReplica,
	onEstablecimientoChange,
	estSuperficie,
	onSuperficieChange,
	estCantTrab,
	onCantTrabChange,
	tipos,
	tipoSel,
	onTipoChange,
	onVolver,
	onCrear,
	disableCrear,
	soloLectura = false,
	cuitSoloLectura = false,
	mostrarAcciones = true,
}) => {
	return (
		<>
			<Box className={styles.filterCuitBox}>
				<TextField
					label="CUIT"
					value={
						cuit
							? (String(cuit).replace(/\D/g, '').length === 11 ? CUIP(cuit) : String(cuit))
							: ''
					}
					onChange={(e) => {
						const digits = e.target.value.replace(/[^\d]/g, '');
						onCuitChange(digits ? Number(digits) : undefined);
					}}
					placeholder="Ingresá CUIT"
					inputMode="numeric"
					fullWidth
					disabled={soloLectura || cuitSoloLectura}
				/>
			</Box>
			<Box className={styles.razonSocialBox}>
				<TextField
					label="Razón Social"
					value={razonSocial}
					placeholder="Sin datos"
					fullWidth
					InputProps={{ readOnly: true }}
				/>
			</Box>
			<Box className={styles.establecimientoBox}>
				<FormControl fullWidth disabled={esReplica || soloLectura} title={esReplica ? 'Tipo fijado por replicación' : undefined}>
					<Autocomplete
						options={establecimientos}
						getOptionLabel={(opt) => {
							const suc = String(opt.nroSucursal ?? '').trim();
							const calle = String(opt.domicilioCalle ?? '').trim();
							const nro = String(opt.domicilioNro ?? '').trim();
							const dir = [calle, nro].filter(Boolean).join(' ').trim();
							return [suc, dir].filter(Boolean).join(' - ').trim();
						}}
						value={estActual ?? null}
						onChange={(_e, newVal) => onEstablecimientoChange(newVal ? newVal.interno : undefined)}
						isOptionEqualToValue={(option, value) => option.interno === value.interno}
						renderInput={(params) => <TextField {...params} label="Establecimiento" />}
						disabled={esReplica || soloLectura}
					/>
				</FormControl>
			</Box>
			{estActual && (
				<Box className={styles.estDatosGrid}>
					<TextField
						label="Superficie"
						type="number"
						value={estSuperficie}
						onChange={(e) => onSuperficieChange(e.target.value)}
						fullWidth
						inputProps={{ inputMode: 'numeric' }}
						disabled={soloLectura}
					/>
					<TextField
						label="Cant. Trabajadores"
						type="number"
						value={estCantTrab}
						onChange={(e) => onCantTrabChange(e.target.value)}
						fullWidth
						inputProps={{ inputMode: 'numeric' }}
						disabled={soloLectura}
					/>
					<TextField
						label="CIIU"
						value={estActual.ciiu ?? ''}
						fullWidth
						InputProps={{ readOnly: true }}
					/>
				</Box>
			)}
			<Box className={styles.establecimientoBox}>
				<FormControl fullWidth disabled={esReplica || soloLectura} title={esReplica ? 'Tipo fijado por replicación' : undefined}>
					<InputLabel>Formulario</InputLabel>
					<Select
						label="Formulario"
						value={tipoSel ?? ''}
						onChange={(e) => onTipoChange(Number(e.target.value) || undefined)}
					>
						<MenuItem value="" disabled>Seleccioná</MenuItem>
						{tipos.map((t) => (
							<MenuItem key={t.interno} value={t.interno}>{t.descripcion}</MenuItem>
						))}
					</Select>
				</FormControl>
			</Box>
			{mostrarAcciones && (
				<Box className={styles.accionesFooter}>
					<CustomButton onClick={onVolver}>VOLVER</CustomButton>
					<CustomButton onClick={onCrear} disabled={disableCrear}>CREAR FORMULARIO</CustomButton>
				</Box>
			)}
		</>
	);
};

export default CabeceraFormulario;
