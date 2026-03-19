"use client";
import { useState, useMemo, useEffect } from 'react';
import { Box, IconButton, Tooltip } from "@mui/material";
import styles from './denuncias.module.css';
import ArtAPI from '@/data/artAPI';
import { DenunciaGetAll, DenunciaQueryParams, DenunciaFormData, initialDenunciaFormData, DenunciaPostRequest, DenunciaQueryParamsID, DenunciaPutRequest, DenunciaPatchRequest } from './types/tDenuncias';
import { useAuth } from '@/data/AuthContext';
import DataTable from '@/utils/ui/table/DataTable';
import Formato from '@/utils/Formato';
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModalMessage, { MessageType } from "@/utils/ui/message/CustomModalMessage";
import DenunciaForm from './denunciaForm';
import dayjs from 'dayjs';
import EditIcon from '@mui/icons-material/Edit';

const estadoOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'Borrador', label: 'Borrador' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'En proceso', label: 'En proceso' },
  { value: 'Completado', label: 'Completado' },
  { value: 'Cancelado', label: 'Cancelado' },
];

// Definición del modo de operación
type RequestMethod = "create" | "edit" | "view" | "delete";

interface RequestState {
  method: RequestMethod | null;
  denunciaData: DenunciaFormData | null;
}

// =========================
// Helpers compartidos POST/PUT
// =========================
const onlyDigits = (v: string | undefined): number => {
  if (!v) return 0;
  const digits = v.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
};

const cuilToNumber = (cuil: string | undefined): number => {
  if (!cuil) return 0;
  const digits = cuil.replace(/\D/g, "");
  return digits.length === 11 ? Number(digits) : 0;
};

const buildFechaHoraSiniestroIso = (fechaOcurrencia?: string, hora?: string): string | null => {
  return fechaOcurrencia && hora
    ? dayjs(`${fechaOcurrencia}T${hora}`).toISOString()
    : null;
};

const buildFechaHoraTomaConocimientoIso = (fechaInformacionArt?: string): string | null => {
  return fechaInformacionArt
    ? dayjs(fechaInformacionArt).toISOString()
    : null;
};

const buildAfiNacimientoYear = (fechaNac?: string): number => {
  return fechaNac ? dayjs(fechaNac).year() : 0;
};

const mapSiNoToApi = (v: string | undefined): string => {
  if (!v) return '';
  const s = v.trim().toLowerCase();
  if (s === 'ignora') return 'I';
  if (s === 'si' || s === 's') return 'S';
  if (s === 'no' || s === 'n') return 'N';
  return '';
};

const mapEstadoCivilToApi = (v: string | undefined): string => {
  if (!v) return '';
  const s = v.trim().toLowerCase();
  if (s.length === 1) return s.toUpperCase();
  if (s.includes('solter')) return 'S';
  if (s.includes('casad')) return 'C';
  if (s.includes('divorc')) return 'D';
  if (s.includes('viud')) return 'V';
  if (s.includes('concubin') || s.includes('concub')) return 'O';
  return '';
};

/* Helpers */
const cuipFormatter = (v: any) => Formato.CUIP(v);



// Variante binaria
const normalizeApiSiNoBinary = (apiValue: any): 'Si' | 'No' | '' => {
  if (apiValue == null || apiValue === '') return '';
  if (typeof apiValue === 'boolean') return apiValue ? 'Si' : 'No';
  const s = String(apiValue).trim().toLowerCase();
  if (s === 's' || s === 'si' || s === 'true' || s === '1') return 'Si';
  if (s === 'n' || s === 'no' || s === 'false' || s === '0') return 'No';
  return '';
};

// Normaliza estado civil de la API (S/C/D/V/O) al valor del select
const normalizeApiEstadoCivilToSelect = (apiValue: any): string => {
  if (apiValue == null || apiValue === '') return initialDenunciaFormData.estadoCivil;
  const s = String(apiValue).trim().toUpperCase();
  if (s.length === 1) {
    if (s === 'S') return 'SOLTERO';
    if (s === 'C') return 'CASADO';
    if (s === 'D') return 'DIVORCIADO';
    if (s === 'V') return 'VIUDO';
    if (s === 'O') return 'CONCUBINATO';
  }
  // Si ya viene el texto completo
  const up = String(apiValue).trim().toUpperCase();
  if (['SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'CONCUBINATO'].includes(up)) return up;
  return initialDenunciaFormData.estadoCivil;
};

// Conversión de fecha/hora desde formatos numéricos o string de la API
const parseApiDateToYMD = (v: any): string => {
  if (!v && v !== 0) return '';
  // ISO directo
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';
    const d = dayjs(s);
    return d.isValid() ? d.format('YYYY-MM-DD') : '';
  }
  if (typeof v === 'number') {
    // Epoch ms o s
    if (v > 10_000_000_000) return dayjs(v).format('YYYY-MM-DD'); // ms
    if (v > 1_000_000_000) return dayjs(v * 1000).format('YYYY-MM-DD'); // s
    // OA/Excel date (días desde 1899-12-30)
    const base = dayjs('1899-12-30');
    const d = base.add(v, 'day');
    return d.isValid() ? d.format('YYYY-MM-DD') : '';
  }
  return '';
};

const parseApiTimeToHM = (v: any): string => {
  if (!v && v !== 0) return '';
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return '';
    // Si viene como HH:mm(:ss)
    const d = dayjs(`2000-01-01T${s}`);
    return d.isValid() ? d.format('HH:mm') : '';
  }
  if (typeof v === 'number') {
    // Si parece ms dentro del día (<= 24h)
    if (v <= 86_400_000) {
      const d = dayjs('2000-01-01').startOf('day').add(v, 'millisecond');
      return d.format('HH:mm');
    }
    // Si parece segundos dentro del día
    if (v <= 86_400) {
      const d = dayjs('2000-01-01').startOf('day').add(v, 'second');
      return d.format('HH:mm');
    }
  }
  return '';
};

const buildBaseDenunciaPayload = (formData: DenunciaFormData, empresa?: any, empleadorCuit?: number) => {
  const fechaHoraSiniestro = buildFechaHoraSiniestroIso(formData.fechaOcurrencia, formData.hora);
  const fechaHoraTomaConocimientoSiniestro = buildFechaHoraTomaConocimientoIso(formData.fechaInformacionArt);
  const afiFechaNacimiento = buildAfiNacimientoYear(formData.fechaNac);
  const emp = empresa || {};
  const empCuitNum = typeof empleadorCuit === 'number' ? empleadorCuit : onlyDigits(formData.empCuit);

  return {
    siniestroTipo: formData.tipoDenuncia,
    empCuit: empCuitNum,
    empPoliza: Number(formData.empPoliza ?? 0),
    empRazonSocial: String(formData.empRazonSocial ?? ''),
    empCiiu: Number(onlyDigits((formData as any).empCiiu as any)) || 0,
    empDomicilioCalle: String(formData.empDomicilioCalle ?? ''),
    empDomicilioNro: String(formData.empDomicilioNro ?? ''),
    empDomicilioPiso: String(formData.empDomicilioPiso ?? ''),
    empDomicilioDpto: String(formData.empDomicilioDpto ?? ''),
    empDomicilioEntreCalle1: String(formData.empDomicilioEntreCalle1 ?? ''),
    empDomicilioEntreCalle2: String(formData.empDomicilioEntreCalle2 ?? ''),
    empCodLocalidad: String(formData.empCodLocalidad ?? ''),
    empCodPostal: Number(onlyDigits(formData.empCodPostal)),
    empTelefonos: String(formData.empTelefonos ?? ''),
    empeMail: String(formData.empEmail ?? ''),
    empOcCuit: empCuitNum,
    empOcRazonSocial: String(formData.empRazonSocial ?? ''),
    empOcEstablecimiento: String(formData.empRazonSocial ?? ''),
    empOcCiiu: 0,
    empOcDomicilioCalle: String(formData.empDomicilioCalle ?? ''),
    empOcDomicilioNro: String(formData.empDomicilioNro ?? ''),
    empOcDomicilioPiso: String(formData.empDomicilioPiso ?? ''),
    empOcDomicilioDpto: String(formData.empDomicilioDpto ?? ''),
    empOcDomicilioEntreCalle1: String(formData.empDomicilioEntreCalle1 ?? ''),
    empOcDomicilioEntreCalle2: String(formData.empDomicilioEntreCalle2 ?? ''),
    empOcCodLocalidad: String(formData.empCodLocalidad ?? ''),
    empOcCodPostal: Number(onlyDigits(formData.empCodPostal)),
    empOcSubContrato: "",
    empOcTelefonos: String(formData.empTelefonos ?? ''),
    empOceMail: String(formData.empEmail ?? ''),
   // Datos del Establecimiento (empEst*)
    empEstCuit: Number(onlyDigits(formData.establecimientoCuit)),
    // Usamos la razón social de la empresa como razón social del establecimiento
    empEstRazonSocial: String(emp?.razonSocial ?? formData.empRazonSocial ?? ''),
    empEstEstablecimiento: String(formData.establecimientoNombre ?? ''),
    empEstCiiu: Number(onlyDigits(formData.establecimientoCiiu)),
    empEstDomicilioCalle: String(formData.establecimientoCalle ?? ''),
    empEstDomicilioNro: String(formData.establecimientoNumero ?? ''),
    empEstDomicilioPiso: String(formData.establecimientoPiso ?? ''),
    empEstDomicilioDpto: String(formData.establecimientoDpto ?? ''),
    // No hay campos específicos de "entre calles" para establecimiento en el formulario
    empEstDomicilioEntreCalle1: "",
    empEstDomicilioEntreCalle2: "",
    empEstCodLocalidad: String(formData.establecimientoCodLocalidad ?? ''),
    empEstCodPostal: Number(onlyDigits(formData.establecimientoCodPostal)),
    empEstTelefonos: String(formData.establecimientoTelefono ?? ''),
    empEsteMail: String(formData.establecimientoEmail ?? ''),
    prestadorCuit: onlyDigits(formData.prestadorInicialCuit),
    afiCuil: cuilToNumber(formData.cuil),
    afiDocTipo: formData.docTipo,
    afiDocNumero: onlyDigits(formData.docNumero),
    afiNombre: formData.nombre,
    afiFechaNacimiento,
    afiSexo: formData.sexo,
    afiEstadoCivil: mapEstadoCivilToApi(formData.estadoCivil),
    afiNacionalidad: onlyDigits(formData.nacionalidad),
    afiDomicilioCalle: formData.domicilioCalle,
    afiDomicilioNro: formData.domicilioNro,
    afiDomicilioPiso: formData.domicilioPiso,
    afiDomicilioDpto: formData.domicilioDpto,
    afiDomicilioEntreCalle1: formData.domicilioEntreCalle1 ?? '',
    afiDomicilioEntreCalle2: formData.domicilioEntreCalle2 ?? '',
    afiCodLocalidad: formData.codLocalidadTrabajador,
    afiCodPostal: onlyDigits(formData.codPostalTrabajador),
    afieMail: formData.email,
    afiTelefono: formData.telefono,
    afiObraSocial: formData.obraSocial,

    comentario: '',
    origenIngreso: 'web',
    descripcion: formData.descripcion,
    fechaHoraSiniestro,
    fechaHoraTomaConocimientoSiniestro,

    enViaPublica: mapSiNoToApi(formData.enViaPublica || ''),

    tipoAccidente: formData.tipoSiniestro || '',
    conIniTelefono: formData.telefonos || '',
    conIniApellidoNombres: formData.apellidoNombres || '',
    conIniRelacionConFamiliar: formData.relacionAccidentado || '',
    conIniTipoDenuncia: formData.tipoDenuncia || '',
    conIniTipoSiniestro: formData.tipoSiniestro || '',
    conIniCodLocalidad: onlyDigits(formData.codLocalidad),
    conIniCodPostal: String(formData.codPostal ?? ''),
    conIniLocalidad: String(formData.localidadAccidente ?? ''),
    conIniDomicilioCalle: String(formData.calle ?? ''),
    conIniDomicilioNumero: String(formData.nro ?? ''),
    conIniDomicilioPiso: String(formData.piso ?? ''),
    conIniDomicilioDepartamento: String(formData.dpto ?? ''),
    conIniDomicilioEntreCalle: String(formData.entreCalle ?? ''),
    conIniDomicilioYCalle: String(formData.entreCalleY ?? ''),

  };
};

const fileToBase64Raw = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const full = String(reader.result || '');
        const commaIdx = full.indexOf(',');
        resolve(commaIdx >= 0 ? full.substring(commaIdx + 1) : full);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const transformFormDataToPostRequest = async (
  formData: DenunciaFormData,
  empresa?: any,
  empleadorCuit?: number,
  isFinal: boolean = false
): Promise<DenunciaPostRequest> => {
  const base = buildBaseDenunciaPayload(formData, empresa, empleadorCuit);

  const denunciaInstanciaImagenes = await Promise.all(
    (formData.archivosAdjuntos || []).map(async (file) => ({
      internoRefDenImgTipo: 0,
      tipoDocumentacion: file.type || 'Adjunto',
      archivoNombre: file.name,
      imagen: await fileToBase64Raw(file),
    }))
  );

  return {
    ...base,
    siniestroNro: 0,
    denunciaCanalIngresoInterno: 0,
    estado: isFinal ? 'Pendiente' : 'Borrador',
    avisoTrabajadorFueraNomina: 0,
    avisoEmpleadorSinContratoVigente: false,
    // campos específicos de tu POST (los que hoy ya tenés y no están en base)
    conIniCodLocalidad: onlyDigits(formData.codLocalidad),
    conIniCodPostal: String(formData.codPostal ?? ''),
    conIniLocalidad: String(formData.localidadAccidente ?? ''),
    denunciaInstanciaImagenes,
  } as DenunciaPostRequest;
};

// Helper para transformar DenunciaFormData a DenunciaPutRequest (edición)
const transformFormDataToPutRequest = async (
  formData: DenunciaFormData,
  existing?: any,
  empresa?: any,
  empleadorCuit?: number,
  isFinal: boolean = false
): Promise<DenunciaPutRequest> => {
  const base = buildBaseDenunciaPayload(formData, empresa, empleadorCuit);

  const denunciaInstanciaImagenes = await Promise.all(
    (formData.archivosAdjuntos || []).map(async (file) => ({
      internoRefDenImgTipo: 0,
      tipoDocumentacion: file.type || 'Adjunto',
      archivoNombre: file.name,
      imagen: await fileToBase64Raw(file),
      interno: 0, // Nuevos documentos deben llevar interno = 0
    }))
  );

  return {
    ...base,
    descripcion: String(formData.descripcion || ''),
    empEstCuit: Number(onlyDigits(formData.establecimientoCuit)),
    empEstRazonSocial: String((empresa as any)?.razonSocial ?? formData.empRazonSocial ?? ''),
    empEstEstablecimiento: String(formData.establecimientoNombre ?? ''),
    empEstCiiu: Number(onlyDigits(formData.establecimientoCiiu)),
    empEstDomicilioCalle: String(formData.establecimientoCalle ?? ''),
    empEstDomicilioNro: String(formData.establecimientoNumero ?? ''),
    empEstDomicilioPiso: String(formData.establecimientoPiso ?? ''),
    empEstDomicilioDpto: String(formData.establecimientoDpto ?? ''),
    empEstCodLocalidad: String(formData.establecimientoCodLocalidad ?? ''),
    empEstCodPostal: Number(onlyDigits(formData.establecimientoCodPostal)),
    empEstTelefonos: String(formData.establecimientoTelefono ?? ''),
    empEsteMail: String(formData.establecimientoEmail ?? ''),

    denunciaNro: Number(existing?.denunciaNro ?? 0),
    siniestroNro: Number(existing?.siniestroNro ?? 0),
    denunciaCanalIngresoInterno: Number(existing?.denunciaCanalIngresoInterno ?? 0),
    estado: isFinal ? 'Pendiente' : 'Borrador',
    estadoDenunciaSiniestro: String(existing?.estadoDenunciaSiniestro ?? ''),

    avisoEmpleadorSinContratoVigente: false,
    avisoTrabajadorFueraNomina: 0,

    // Fecha en que se tomó conocimiento (API espera 'siniestroTomaConocimientoFechaHora' en PUT)
    siniestroTomaConocimientoFechaHora: (base as any).fechaHoraTomaConocimientoSiniestro ?? null,

    denunciaInstanciaImagenes,
  } as DenunciaPutRequest;
};

  const buildOrderedPutPayload = (p: any) => ({
    denunciaNro: Number(p.denunciaNro ?? 0),
    siniestroNro: Number(p.siniestroNro ?? 0),
    siniestroTipo: String(p.siniestroTipo ?? ''),
    empCuit: Number(p.empCuit ?? 0),
    empPoliza: Number(p.empPoliza ?? 0),
    empRazonSocial: String(p.empRazonSocial ?? ''),
    empCiiu: Number(p.empCiiu ?? 0),
    empDomicilioCalle: String(p.empDomicilioCalle ?? ''),
    empDomicilioNro: String(p.empDomicilioNro ?? ''),
    empDomicilioPiso: String(p.empDomicilioPiso ?? ''),
    empDomicilioDpto: String(p.empDomicilioDpto ?? ''),
    empDomicilioEntreCalle1: String(p.empDomicilioEntreCalle1 ?? ''),
    empDomicilioEntreCalle2: String(p.empDomicilioEntreCalle2 ?? ''),
    empCodLocalidad: String(p.empCodLocalidad ?? ''),
    empCodPostal: Number(p.empCodPostal ?? 0),
    empTelefonos: String(p.empTelefonos ?? ''),
    empeMail: String(p.empeMail ?? ''),
    empOcCuit: Number(p.empOcCuit ?? 0),
    empOcRazonSocial: String(p.empOcRazonSocial ?? ''),
    empOcEstablecimiento: String(p.empOcEstablecimiento ?? ''),
    empOcCiiu: Number(p.empOcCiiu ?? 0),
    empOcDomicilioCalle: String(p.empOcDomicilioCalle ?? ''),
    empOcDomicilioNro: String(p.empOcDomicilioNro ?? ''),
    empOcDomicilioPiso: String(p.empOcDomicilioPiso ?? ''),
    empOcDomicilioDpto: String(p.empOcDomicilioDpto ?? ''),
    empOcDomicilioEntreCalle1: String(p.empOcDomicilioEntreCalle1 ?? ''),
    empOcDomicilioEntreCalle2: String(p.empOcDomicilioEntreCalle2 ?? ''),
    empOcCodLocalidad: String(p.empOcCodLocalidad ?? ''),
    empOcCodPostal: Number(p.empOcCodPostal ?? 0),
    empOcSubContrato: String(p.empOcSubContrato ?? ''),
    empOcTelefonos: String(p.empOcTelefonos ?? ''),
    empOceMail: String(p.empOceMail ?? ''),
    empEstCuit: Number(p.empEstCuit ?? 0),
    empEstRazonSocial: String(p.empEstRazonSocial ?? ''),
    empEstEstablecimiento: String(p.empEstEstablecimiento ?? ''),
    empEstCiiu: Number(p.empEstCiiu ?? 0),
    empEstDomicilioCalle: String(p.empEstDomicilioCalle ?? ''),
    empEstDomicilioNro: String(p.empEstDomicilioNro ?? ''),
    empEstDomicilioPiso: String(p.empEstDomicilioPiso ?? ''),
    empEstDomicilioDpto: String(p.empEstDomicilioDpto ?? ''),
    empEstDomicilioEntreCalle1: String(p.empEstDomicilioEntreCalle1 ?? ''),
    empEstDomicilioEntreCalle2: String(p.empEstDomicilioEntreCalle2 ?? ''),
    empEstCodLocalidad: String(p.empEstCodLocalidad ?? ''),
    empEstCodPostal: Number(p.empEstCodPostal ?? 0),
    empEstTelefonos: String(p.empEstTelefonos ?? ''),
    empEsteMail: String(p.empEsteMail ?? ''),
    prestadorCuit: Number(p.prestadorCuit ?? 0),
    afiCuil: Number(p.afiCuil ?? 0),
    afiDocTipo: String(p.afiDocTipo ?? ''),
    afiDocNumero: Number(p.afiDocNumero ?? 0),
    afiNombre: String(p.afiNombre ?? ''),
    afiFechaNacimiento: Number(p.afiFechaNacimiento ?? 0),
    afiSexo: String(p.afiSexo ?? ''),
    afiEstadoCivil: String(p.afiEstadoCivil ?? ''),
    afiNacionalidad: Number(p.afiNacionalidad ?? 0),
    afiDomicilioCalle: String(p.afiDomicilioCalle ?? ''),
    afiDomicilioNro: String(p.afiDomicilioNro ?? ''),
    afiDomicilioPiso: String(p.afiDomicilioPiso ?? ''),
    afiDomicilioDpto: String(p.afiDomicilioDpto ?? ''),
    afiDomicilioEntreCalle1: String(p.afiDomicilioEntreCalle1 ?? ''),
    afiDomicilioEntreCalle2: String(p.afiDomicilioEntreCalle2 ?? ''),
    afiCodLocalidad: String(p.afiCodLocalidad ?? ''),
    afiCodPostal: Number(p.afiCodPostal ?? 0),
    afieMail: String(p.afieMail ?? ''),
    afiTelefono: String(p.afiTelefono ?? ''),
    afiObraSocial: String(p.afiObraSocial ?? ''),
    comentario: String(p.comentario ?? ''),
    origenIngreso: String(p.origenIngreso ?? ''),
    trasladoTipo: p.trasladoTipo ?? null,
    avisoTrabajadorFueraNomina: Number(p.avisoTrabajadorFueraNomina ?? 0),
    avisoEmpleadorSinContratoVigente: Boolean(p.avisoEmpleadorSinContratoVigente ?? false),
    denunciaCanalIngresoInterno: Number(p.denunciaCanalIngresoInterno ?? 0),
    descripcion: String(p.descripcion ?? ''),
    fechaHoraSiniestro: p.fechaHoraSiniestro ?? null,
    fechaHoraTomaConocimientoSiniestro: p.fechaHoraTomaConocimientoSiniestro ?? null,
    enViaPublica: String(p.enViaPublica ?? ''),
    roam: p.roam ?? null,
    roamNumero: Number(p.roamNumero ?? 0),
    roamInterno: Number(p.roamInterno ?? 0),
    roamAnio: Number(p.roamAnio ?? 0),
    tipoAccidente: String(p.tipoAccidente ?? ''),
    estadoDenunciaSiniestro: String(p.estadoDenunciaSiniestro ?? ''),
    conIniTelefono: String(p.conIniTelefono ?? ''),
    conIniApellidoNombres: String(p.conIniApellidoNombres ?? ''),
    conIniRelacionConFamiliar: String(p.conIniRelacionConFamiliar ?? ''),
    conIniTipoDenuncia: String(p.conIniTipoDenuncia ?? ''),
    conIniTipoSiniestro: String(p.conIniTipoSiniestro ?? ''),
    conIniCodLocalidad: Number(p.conIniCodLocalidad ?? 0),
    conIniCodPostal: String(p.conIniCodPostal ?? ''),
    conIniLocalidad: String(p.conIniLocalidad ?? ''),
    conIniDomicilioCalle: String(p.conIniDomicilioCalle ?? ''),
    conIniDomicilioNumero: String(p.conIniDomicilioNumero ?? ''),
    conIniDomicilioPiso: String(p.conIniDomicilioPiso ?? ''),
    conIniDomicilioDepartamento: String(p.conIniDomicilioDepartamento ?? ''),
    conIniDomicilioEntreCalle: String(p.conIniDomicilioEntreCalle ?? ''),
    conIniDomicilioYCalle: String(p.conIniDomicilioYCalle ?? ''),
    estTrabEstaConsciente: p.estTrabEstaConsciente ?? null,
    estTrabColor: p.estTrabColor ?? null,
    estTrabHabla: p.estTrabHabla ?? null,
    estTrabGravedad: p.estTrabGravedad ?? null,
    estTrabRespira: p.estTrabRespira ?? null,
    estTrabObservaciones: p.estTrabObservaciones ?? null,
    estTrabTieneHemorragia: p.estTrabTieneHemorragia ?? null,
    estTrabContextoDenuncia: p.estTrabContextoDenuncia ?? null,
    estTrabVerificaContactoInicial: p.estTrabVerificaContactoInicial ?? null,
    estTrabPrestadorTraslado: p.estTrabPrestadorTraslado ?? null,
    denunciaInstanciaImagenes: Array.isArray(p.denunciaInstanciaImagenes) ? p.denunciaInstanciaImagenes : [],
    estado: String(p.estado ?? ''),
  });

/* Spinner simple */
const Spinner: React.FC = () => (
  <div className={styles.spinner}>
    <span>cargando...</span>
  </div>
);

function DenunciasPage() {
  const { user } = useAuth();
  const isAdmin = (user?.rol || '').toLowerCase() === 'administrador';

  const [estado, setEstado] = useState<string | undefined>(undefined);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageCount, setPageCount] = useState<number>(0);

  // Buscador por CUIT (arriba de "Registrar Denuncia")
  const [cuitBusqueda, setCuitBusqueda] = useState<string>("");
  const [empCuit, setEmpCuit] = useState<number | undefined>(undefined);

  // Si el usuario NO es administrador, fijar el filtro por su empresa CUIT y bloquear cambios
  useEffect(() => {
    const userCuit = user?.empresaCUIT;
    if (!isAdmin && userCuit && String(userCuit).length === 11) {
      setEmpCuit(userCuit);
      setCuitBusqueda(String(userCuit));
    }
  }, [isAdmin, user?.empresaCUIT]);

  // Auto-trigger search when CUIT input reaches 11 digits
  useEffect(() => {
    const digits = (cuitBusqueda || '').replace(/\D/g, '');
    if (digits.length === 11) {
      const c = Number(digits);
      if (empCuit !== c) {
        setEmpCuit(c);
        setPageIndex(1);
      }
    } else {
      if (empCuit !== undefined) {
        setEmpCuit(undefined);
        setPageIndex(1);
      }
    }
  }, [cuitBusqueda, empCuit]);

  // Hook para POST de denuncia
  const { trigger: postDenuncia, isMutating: isPostingDenuncia } = ArtAPI.usePostDenuncia();

  const { trigger: putDenuncia, isMutating: isPuttingDenuncia } = ArtAPI.usePutDenuncia();
  const { trigger: patchDenuncia, isMutating: isPatchingDenuncia } = ArtAPI.usePatchDenuncia();

  // State for form modal
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [requestState, setRequestState] = useState<RequestState>({
    method: null,
    denunciaData: null,
  });
  const [selectedDenunciaId, setSelectedDenunciaId] = useState<number | null>(null);
  const [initialFiles, setInitialFiles] = useState<File[]>([]);

  // Fetch denuncia by ID when editing
  const denunciaIdParams: DenunciaQueryParamsID | undefined = selectedDenunciaId ? { id: selectedDenunciaId } : undefined;
  const { data: denunciaByIdData, isLoading: isLoadingDenunciaById, error: denunciaByIdError } = ArtAPI.useGetDenunciaById(denunciaIdParams);

  const [modalMessage, setModalMessage] = useState<{
    open: boolean;
    message: string;
    type: MessageType;
  }>({
    open: false,
    message: '',
    type: 'warning'
  });

  // Build query parameters
  const queryParams: DenunciaQueryParams = useMemo(() => {
    const params: DenunciaQueryParams = {
      Estado: estado,
      PageIndex: pageIndex,
      PageSize: pageSize,
      orderBy: '-Interno',
    };
    // Aplicar EmpCuit solo cuando es un CUIT válido (11 dígitos)
    if (typeof empCuit === 'number' && String(empCuit).length === 11) {
      params.EmpCuit = empCuit;
    }
    return params;
  }, [estado, pageIndex, pageSize, empCuit]);

  // API call using SWR
  const { data, error, isLoading, mutate: mutateDenuncias } = ArtAPI.useGetDenuncias(queryParams);
  // Empresa por CUIT (para mapear campos emp*)
  const empresaParams = useMemo(() => (
    typeof empCuit === 'number' && String(empCuit).length === 11
      ? { CUIT: empCuit }
      : {}
  ), [empCuit]);
  const { data: empresaByCuit } = ArtAPI.useGetEmpresaByCUIT(empresaParams);

  // Check if error is 404 (not found) - treat as empty result instead of error
  const is404Error = error?.status === 404 || error?.response?.status === 404;

  // Process data and update states
  useMemo(() => {
    if (!data && !error) {
      setLoading(true);
      return;
    }

    if (error && !is404Error) {
      console.error('Error al cargar denuncias:', error);
      setLoading(false);
      return;
    }

    // Calculate page count if total is available
    if (data?.count && pageSize > 0) {
      setPageCount(Math.ceil(data.count / pageSize));
    } else if (data?.data) {
      setPageCount(data.data.length > 0 ? Math.ceil(data.data.length / pageSize) : 1);
    }

    setLoading(false);
  }, [data, error, pageSize, is404Error]);

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPageIndex(1); // Reset to first page (1-based)
  };

  // Handle estado filter change
  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setEstado(value === '' ? undefined : value);
    setPageIndex(1); // Reset to first page when filtering (1-based)
  };

  // Modal handlers
  const showModal = requestState.method !== null;

  const showModalMessage = (message: string, type: MessageType) => {
    setModalMessage({
      open: true,
      message,
      type
    });
  };

  const handleClose = () => {
    setModalMessage({
      open: false,
      message: '',
      type: 'warning'
    });
  };

  const handleOpenModal = (method: RequestMethod, row?: DenunciaGetAll) => {
    setFormError(null);
    if (method === 'edit' && row) {
      // Use the denuncia ID from the row to fetch full details
      const idCandidate = (row as any).interno ?? (row as any).id ?? (row as any).denunciaId;
      if (typeof idCandidate === 'number') {
        setSelectedDenunciaId(idCandidate);
      }
      setRequestState({ method, denunciaData: null });
      return;
    }

    setSelectedDenunciaId(null);
    setRequestState({ method, denunciaData: initialDenunciaFormData });
  };

  const handleCloseModal = () => {
    setRequestState({ method: null, denunciaData: null });
    setSelectedDenunciaId(null);
  };

  // Map API DenunciaById response into DenunciaFormData when available
  useEffect(() => {
    if (requestState.method === 'edit') {
      if (isLoadingDenunciaById) {
        return;
      }
      if (denunciaByIdError) {
        const msg = (denunciaByIdError as any)?.message || 'No se pudo cargar la denuncia seleccionada';
        setFormError(msg);
        // Fallback to empty form to avoid blocking
        setRequestState(prev => ({ ...prev, denunciaData: initialDenunciaFormData }));
        return;
      }
      if (denunciaByIdData) {
        // Attempt to normalize fields from API into form data
        const api = denunciaByIdData as any;
        const sinItems = Array.isArray(api.denunciaSiniestros) ? api.denunciaSiniestros : [];
        const sin = sinItems.length > 0 ? sinItems[sinItems.length - 1] : null;

        // Preferir valores anidados si existen, con fallback a top-level
        const enViaPublicaSel = normalizeApiSiNoBinary(sin?.enViaPublica ?? api.enViaPublica) || initialDenunciaFormData.enViaPublica;
        const descripcionVal = (sin?.descripcion ?? api.descripcion) ?? initialDenunciaFormData.descripcion;

        // Fecha y hora: usar ISO (top-level o anidado en denunciaSiniestros[0])
        const rawIso = sin?.fechaHoraSiniestro ?? api.fechaHoraSiniestro ?? null;
        const fechaIso = rawIso != null ? String(rawIso) : null;
        const fechaFromIso = fechaIso && dayjs(fechaIso).isValid()
          ? dayjs(fechaIso).format('YYYY-MM-DD')
          : '';
        const horaFromIso = fechaIso && dayjs(fechaIso).isValid()
          ? dayjs(fechaIso).format('HH:mm')
          : '';
        // Fecha en la que se informó a la ART (puede venir en siniestroTomaConocimientoFechaHora)
        const rawInfoIso = sin?.siniestroTomaConocimientoFechaHora ?? api.siniestroTomaConocimientoFechaHora ?? null;
        const fechaInfoIso = rawInfoIso != null ? String(rawInfoIso) : null;
        const fechaInformacionFromIso = fechaInfoIso && dayjs(fechaInfoIso).isValid()
          ? dayjs(fechaInfoIso).format('YYYY-MM-DD')
          : '';
        const fechaCalc = fechaFromIso || parseApiDateToYMD(sin?.siniestroFecha);
        const horaCalc = horaFromIso || parseApiTimeToHM(sin?.siniestroHora);
        const mapped: DenunciaFormData = {
          ...initialDenunciaFormData,
          // Tipo de denuncia/siniestro
          tipoDenuncia: api.conIniTipoDenuncia ?? api.tipoDenuncia ?? api.siniestroTipo ?? initialDenunciaFormData.tipoDenuncia,
          tipoSiniestro: api.conIniTipoSiniestro ?? api.tipoSiniestro ?? api.siniestroTipo ?? initialDenunciaFormData.tipoSiniestro,
          // Datos del Empleador (solapa "Datos del Empleador")
          empCuit: api.empOcCuit != null ? String(api.empOcCuit) : initialDenunciaFormData.empCuit,
          empPoliza: api.empPoliza != null ? String(api.empPoliza) : initialDenunciaFormData.empPoliza,
          empRazonSocial: api.empOcRazonSocial ?? api.empRazonSocial ?? initialDenunciaFormData.empRazonSocial,
          empDomicilioCalle: api.empOcDomicilioCalle ?? initialDenunciaFormData.empDomicilioCalle,
          empDomicilioNro: api.empOcDomicilioNro ?? initialDenunciaFormData.empDomicilioNro,
          empDomicilioPiso: api.empOcDomicilioPiso ?? initialDenunciaFormData.empDomicilioPiso,
          empDomicilioDpto: api.empOcDomicilioDpto ?? initialDenunciaFormData.empDomicilioDpto,
          empDomicilioEntreCalle1: api.empOcDomicilioEntreCalle1 ?? initialDenunciaFormData.empDomicilioEntreCalle1,
          empDomicilioEntreCalle2: api.empOcDomicilioEntreCalle2 ?? initialDenunciaFormData.empDomicilioEntreCalle2,
          empCodLocalidad: api.empOcCodLocalidad != null ? String(api.empOcCodLocalidad) : initialDenunciaFormData.empCodLocalidad,
          empCodPostal: api.empOcCodPostal != null ? String(api.empOcCodPostal) : initialDenunciaFormData.empCodPostal,
          empTelefonos: api.empOcTelefonos ?? initialDenunciaFormData.empTelefonos,
          empEmail: api.empOceMail ?? initialDenunciaFormData.empEmail,
          calle: sin?.conIniDomicilioCalle ?? api.conIniDomicilioCalle ?? api.empDomicilioCalle ?? initialDenunciaFormData.calle,
          nro: sin?.conIniDomicilioNumero ?? api.conIniDomicilioNumero ?? api.empDomicilioNro ?? initialDenunciaFormData.nro,
          piso: sin?.conIniDomicilioPiso ?? api.conIniDomicilioPiso ?? api.empDomicilioPiso ?? initialDenunciaFormData.piso,
          dpto: sin?.conIniDomicilioDepartamento ?? api.conIniDomicilioDepartamento ?? api.empDomicilioDpto ?? initialDenunciaFormData.dpto,
          entreCalle: sin?.conIniDomicilioEntreCalle ?? api.conIniDomicilioEntreCalle ?? api.empDomicilioEntreCalle1 ?? initialDenunciaFormData.entreCalle,
          entreCalleY: sin?.conIniDomicilioYCalle ?? api.conIniDomicilioYCalle ?? api.empDomicilioEntreCalle2 ?? initialDenunciaFormData.entreCalleY,
          codLocalidad: String(api.conIniCodLocalidad ?? api.empCodLocalidad ?? initialDenunciaFormData.codLocalidad) || initialDenunciaFormData.codLocalidad,
          codPostal: String(api.conIniCodPostal ?? api.empCodPostal ?? '') || initialDenunciaFormData.codPostal,
          telefonos: api.conIniTelefono ?? api.empTelefonos ?? initialDenunciaFormData.telefonos,
          prestadorInicialCuit: String(api.prestadorCuit ?? ''),
          cuil: api.afiCuil ? String(api.afiCuil) : initialDenunciaFormData.cuil,
          docTipo: api.afiDocTipo ?? initialDenunciaFormData.docTipo,
          docNumero: api.afiDocNumero ? String(api.afiDocNumero) : initialDenunciaFormData.docNumero,
          nombre: (api.afiNombre ?? api.AfiNombre ?? api.AFINombre ?? api.nombreAfiliado ?? '') || initialDenunciaFormData.nombre,
          fechaNac: api.afiFechaNacimiento ? String(api.afiFechaNacimiento) : initialDenunciaFormData.fechaNac,
          sexo: api.afiSexo ?? initialDenunciaFormData.sexo,
          estadoCivil: normalizeApiEstadoCivilToSelect(api.afiEstadoCivil),
          nacionalidad: api.afiNacionalidad ? String(api.afiNacionalidad) : initialDenunciaFormData.nacionalidad,
          domicilioCalle: api.afiDomicilioCalle ?? initialDenunciaFormData.domicilioCalle,
          domicilioNro: api.afiDomicilioNro ?? initialDenunciaFormData.domicilioNro,
          domicilioPiso: api.afiDomicilioPiso ?? initialDenunciaFormData.domicilioPiso,
          domicilioDpto: api.afiDomicilioDpto ?? initialDenunciaFormData.domicilioDpto,
          domicilioEntreCalle1: api.afiDomicilioEntreCalle1 ?? initialDenunciaFormData.domicilioEntreCalle1,
          domicilioEntreCalle2: api.afiDomicilioEntreCalle2 ?? initialDenunciaFormData.domicilioEntreCalle2,
          codPostalTrabajador: String(api.afiCodPostal ?? ''),
          codLocalidadTrabajador: api.afiCodLocalidad ? String(api.afiCodLocalidad) : initialDenunciaFormData.codLocalidadTrabajador,
          email: api.afieMail ?? initialDenunciaFormData.email,
          telefono: api.afiTelefono ?? initialDenunciaFormData.telefono,
          obraSocial: api.afiObraSocial ?? initialDenunciaFormData.obraSocial,
          descripcion: descripcionVal,
          fechaOcurrencia: fechaCalc || initialDenunciaFormData.fechaOcurrencia,
          hora: horaCalc || initialDenunciaFormData.hora,
          fechaInformacionArt: fechaInformacionFromIso || initialDenunciaFormData.fechaInformacionArt,
          enViaPublica: enViaPublicaSel,
          // Datos del Establecimiento (para poder editarlos)
          establecimientoCuit: api.empEstCuit != null ? String(api.empEstCuit) : initialDenunciaFormData.establecimientoCuit,
          establecimientoNombre: api.empEstEstablecimiento ?? api.empEstRazonSocial ?? initialDenunciaFormData.establecimientoNombre,
          establecimientoCiiu: api.empEstCiiu != null ? String(api.empEstCiiu) : initialDenunciaFormData.establecimientoCiiu,
          establecimientoCalle: api.empEstDomicilioCalle ?? initialDenunciaFormData.establecimientoCalle,
          establecimientoNumero: api.empEstDomicilioNro ?? initialDenunciaFormData.establecimientoNumero,
          establecimientoPiso: api.empEstDomicilioPiso ?? initialDenunciaFormData.establecimientoPiso,
          establecimientoDpto: api.empEstDomicilioDpto ?? initialDenunciaFormData.establecimientoDpto,
          establecimientoCodLocalidad: api.empEstCodLocalidad != null ? String(api.empEstCodLocalidad) : initialDenunciaFormData.establecimientoCodLocalidad,
          establecimientoCodPostal: api.empEstCodPostal != null ? String(api.empEstCodPostal) : initialDenunciaFormData.establecimientoCodPostal,
          establecimientoTelefono: api.empEstTelefonos ?? initialDenunciaFormData.establecimientoTelefono,
          establecimientoEmail: api.empEsteMail ?? initialDenunciaFormData.establecimientoEmail,
          // Campos adicionales del formulario
          apellidoNombres: api.conIniApellidoNombres ?? api.apellidoNombres ?? api.apellidoNombre ?? api.afiliadoApellidoNombre ?? initialDenunciaFormData.apellidoNombres,
          relacionAccidentado: api.conIniRelacionConFamiliar ?? api.relacionConFamiliar ?? api.relacionAccidentado ?? initialDenunciaFormData.relacionAccidentado,
          obraSocialCodigo: api.afiObraSocialCodigo ? String(api.afiObraSocialCodigo) : initialDenunciaFormData.obraSocialCodigo,
          localidad: api.afiLocalidad ?? initialDenunciaFormData.localidad,
          trabajadoresRelacionados: Array.isArray(api.trabajadoresRelacionados) ? api.trabajadoresRelacionados : initialDenunciaFormData.trabajadoresRelacionados,
          prestadorInicialRazonSocial: api.prestadorInicialRazonSocial ?? initialDenunciaFormData.prestadorInicialRazonSocial,
          verificaContactoInicial: api.verificaContactoInicial ?? initialDenunciaFormData.verificaContactoInicial,
          archivosAdjuntos: initialDenunciaFormData.archivosAdjuntos,
          aceptoTerminos: false,
        };
        setRequestState(prev => ({ ...prev, denunciaData: mapped }));

        // Construir archivos existentes (base64 -> File) para mostrarlos en "Archivos Adjuntos"
        try {
          const inferContentType = (name?: string): string => {
            const n = String(name || '').toLowerCase();
            if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
            if (n.endsWith('.png')) return 'image/png';
            if (n.endsWith('.pdf')) return 'application/pdf';
            if (n.endsWith('.doc')) return 'application/msword';
            if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            return 'application/octet-stream';
          };
          const base64ToFile = (b64: string, fileName: string, contentType: string): File => {
            const byteChars = typeof window !== 'undefined' ? window.atob(b64) : Buffer.from(b64, 'base64').toString('binary');
            const byteNumbers = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
              byteNumbers[i] = byteChars.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            return new File([byteArray], fileName, { type: contentType });
          };
          const instArr = Array.isArray((denunciaByIdData as any).denunciaInstancia) ? (denunciaByIdData as any).denunciaInstancia : [];
          const files: File[] = [];
          instArr.forEach((inst: any) => {
            const imgs = Array.isArray(inst?.denunciaInstanciaImagenes) ? inst.denunciaInstanciaImagenes : [];
            imgs.forEach((img: any) => {
              const nombre = String(img?.archivoNombre || 'documento');
              const tipo = inferContentType(nombre);
              const b64 = String(img?.imagen || '');
              if (b64) {
                try {
                  const file = base64ToFile(b64, nombre, tipo);
                  files.push(file);
                } catch { }
              }
            });
          });
          setInitialFiles(files);
        } catch (e) {
          console.warn('No se pudo convertir la documentación existente a File[]:', e);
          setInitialFiles([]);
        }
      }
    }
  }, [requestState.method, isLoadingDenunciaById, denunciaByIdError, denunciaByIdData]);

  const handleSubmit = async (data: DenunciaFormData, options?: { final?: boolean }) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const method = requestState.method;
      const isFinal = !!options?.final;

      if (method === "view") {
        handleCloseModal();
        return;
      }

      if (method === "create") {
        const postData = await transformFormDataToPostRequest(data, empresaByCuit, empCuit, isFinal);
        const created = await postDenuncia(postData);
        showModalMessage(
          isFinal
            ? `Su pre-denuncia ha sido registrada correctamente en nuestro sistema.\n Será validada por nuestro equipo en las próximas 24 horas hábiles.`
            : "Borrador guardado exitosamente",
          "success"
        );
        handleCloseModal();
        // Refrescar la lista sin recargar la página
        mutateDenuncias();
      }

      if (method === "edit") {
        if (!selectedDenunciaId) {
          throw new Error("No se encontró el ID interno de la denuncia a editar");
        }
        if (!denunciaByIdData) {
          throw new Error("No se pudieron obtener los datos actuales de la denuncia para editar");
        }

        const putData = await transformFormDataToPutRequest(data, denunciaByIdData, empresaByCuit, empCuit, isFinal);

        const ordered = buildOrderedPutPayload(putData);
        await putDenuncia({ id: selectedDenunciaId, data: ordered });

        const patchPayload: DenunciaPatchRequest = {
          interno: Number(selectedDenunciaId),
          patchDocument: [
            { path: 'estado', value: isFinal ? 'Pendiente' : 'Borrador' },
          ],
        };
        await patchDenuncia(patchPayload);


        showModalMessage(
          isFinal
            ? `Su pre-denuncia ha sido registrada correctamente en nuestro sistema.\n Será validada por nuestro equipo en las próximas 24 horas hábiles.`
            : "Borrador actualizado exitosamente",
          "success"
        );
        handleCloseModal();
        // Refrescar la lista sin recargar la página
        mutateDenuncias();
      }

    } catch (error: any) {
      console.error("Error en handleSubmit:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Ocurrió un error inesperado al procesar la solicitud";
      showModalMessage(errorMessage, "error");
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Table columns definition
  const tableColumns = [
    {
      accessorKey: 'nroPreDenuncia',
      header: 'Nro. Pre-Denuncia',
      size: 120
    },
    {
      accessorKey: 'siniestroTipo',
      header: 'Tipo Siniestro',
      size: 150
    },
    {
      accessorKey: 'afiCuil',
      header: 'CUIL Trabajador',
      cell: (info: any) => cuipFormatter(info.getValue()),
      size: 130
    },
    {
      accessorKey: 'afiNombre',
      header: 'Nombre',
      size: 80
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      size: 80
    },
    {
      id: 'actions',
      header: 'Acción',
      size: 80,
      cell: ({ row }: any) => {
        const estadoVal = row?.original?.estado;
        const isEditable = String(estadoVal ?? '') === 'Borrador';

        return (
          <Box className={styles.actionCell}>
            {isEditable && (
              <Tooltip title="Editar" arrow>
                <IconButton
                  size="small"
                  color="warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Abrir modal en modo editar con los datos de la fila
                    handleOpenModal("edit", row.original as DenunciaGetAll);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
      meta: { align: 'center' },
    },
  ];

  if (loading) return <Spinner />;
  if (error && !is404Error) {
    return (
      <div className={styles.inicioContainer}>
        <div className={styles.errorMessage}>
          Error al cargar las denuncias: {error.message}
        </div>
      </div>
    );
  }

  // Current initial data for the form
  const currentInitialData = requestState.denunciaData || initialDenunciaFormData;

  return (
    <Box className={styles.inicioContainer}>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label htmlFor="estado" className={styles.filterLabel}>
            FILTROS
          </label>
          <select
            id="estado"
            value={estado ?? ''}
            onChange={handleEstadoChange}
            className={styles.filterSelect}
          >
            {estadoOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.cuitGroup}>
          <input
            id="cuitBusqueda"
            type="text"
            placeholder="Ingresá CUIT (11 dígitos)"
            value={cuitBusqueda}
            onChange={(e) => setCuitBusqueda((e.target.value || '').replace(/[^\d]/g, ''))}
            disabled={!isAdmin}
            className={styles.cuitInput}
          />
        </div>
      </div>

      <div className={styles.actionsBar}>
        <CustomButton onClick={() => handleOpenModal("create")}>
          Registrar Denuncia
        </CustomButton>
      </div>

      {/* Data table */}
      <div className={styles.compactTable}>
        <DataTable
          columns={tableColumns}
          data={data?.data || []}
          isLoading={isLoading}
          manualPagination={true}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Empty state for no data */}
      {!isLoading && ((data?.data && data.data.length === 0) || is404Error || (!data && !error)) && (
        <div className={styles.emptyState}>
          <p>No se encontraron denuncias con los filtros seleccionados.</p>
        </div>
      )}

      {/* Denuncia Form Modal */}
      <DenunciaForm
        open={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={currentInitialData}
        initialFiles={initialFiles}
        errorMsg={formError}
        method={requestState.method || "create"}
        isSubmitting={isSubmitting || isPostingDenuncia || isPuttingDenuncia || isPatchingDenuncia}
        onValidationError={(message) =>
          showModalMessage(message, "error")
        }
      />

      {/* Modal Message */}
      <CustomModalMessage
        open={modalMessage.open}
        message={modalMessage.message}
        type={modalMessage.type}
        onClose={handleClose}
        title={
          modalMessage.type === 'error'
            ? 'Faltan cargar datos obligatorios'
            : modalMessage.type === 'success'
              ? 'Pre-Denuncia Registrada con Éxito'
              : undefined
        }
      />
    </Box>
  );
}

export default DenunciasPage;