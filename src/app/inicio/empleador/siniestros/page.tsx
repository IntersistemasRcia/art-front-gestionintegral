'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import gestionEmpleadorAPI from '@/data/gestionEmpleadorAPI';
import { token } from '@/data/usuarioAPI';
import type { Parameters } from '@/app/inicio/empleador/cobertura/types/persona';

import DataTable from '@/utils/ui/table/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Box } from '@mui/material';

import CondicionesTabla from './table';
import type { SiniestroItem, InstanciaSiniestro } from './types/tipos';
import { useEmpresasStore } from '@/data/empresasStore';
import { Empresa } from '@/data/authAPI';
import CustomSelectSearch from '@/utils/ui/form/CustomSelectSearch';
import Formato from '@/utils/Formato';
import styles from './siniestros.module.css';
import { useSearchParams } from 'next/navigation';


const fmtDateTime = (v?: string | null) => {
  if (!v) return '';
  const d = dayjs(v);
  return d.isValid() ? d.format('DD-MM-YYYY, HH:mm') : '';
};
const fmtDate = (v?: string | null) => {
  if (!v) return '';
  const d = dayjs(v);
  return d.isValid() ? d.format('DD-MM-YYYY') : '';
};

const cols: ColumnDef<SiniestroItem>[] = [
  { header: 'CUIL', accessorKey: 'trabCUIL' },
  {
    header: 'Apellido y Nombre',
    accessorKey: 'trabNombre',
    cell: ({ getValue }) => String(getValue() ?? '').trim(),
  },
  { header: 'Establecimiento', accessorKey: 'establecimiento' },
  { header: 'Nº Siniestro', accessorKey: 'siniestroNro' },
  {
    header: 'Tipo',
    accessorKey: 'tipoSiniestro',
    cell: ({ getValue }) => String(getValue() ?? '').trim(),
  },
  {
    header: 'Fecha y Hora Siniestro',
    accessorKey: 'siniestroFechaHora',
    cell: ({ getValue }) => fmtDateTime(getValue() as string | null),
  },
  { header: 'Diagnóstico', accessorKey: 'diagnostico' },
  {
    header: 'Categoría',
    accessorKey: 'siniestroCategoria',
    cell: ({ getValue }) => String(getValue() ?? '').trim(),
  },
  {
    header: 'Próx. Control Médico',
    accessorKey: 'proximoControlMedicoFechaHora',
    cell: ({ getValue }) => fmtDateTime(getValue() as string | null),
  },
  { header: 'Prestador inicial', accessorKey: 'prestador' },
  {
    header: 'Alta Médica',
    accessorKey: 'altaMedicaFecha',
    cell: ({ getValue }) => fmtDate(getValue() as string | null),
  },
];

const normalizeDigits = (value: unknown) => String(value ?? '').replace(/\D/g, '');


export default function SiniestrosPage() {
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const searchParams = useSearchParams();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const seleccionAutomaticaRef = useRef(false);
  const [selectedDenuncia, setSelectedDenuncia] = useState<number | null>(null);

  const cuitQuery = searchParams.get('cuit') ?? searchParams.get('cuil') ?? '';
  const cuitDesdeQuery = normalizeDigits(cuitQuery);
  const bloquearBusquedaPorCuit = Boolean(cuitDesdeQuery);

  const cuitEmpresaSeleccionada = normalizeDigits((empresaSeleccionada as any)?.cuit);
  const cuitFinalStr = cuitDesdeQuery || cuitEmpresaSeleccionada;
  const cuitFinal = cuitFinalStr ? Number(cuitFinalStr) : undefined;

  const { data: polizaRawData } = gestionEmpleadorAPI.useGetPoliza(
    cuitDesdeQuery ? { CUIT: Number(cuitDesdeQuery) } : {}
  );

  // Si viene CUIT por query param, forzar selección por CUIT y bloquear el selector
  useEffect(() => {
    if (isLoadingEmpresas) return;
    if (!cuitDesdeQuery) return;

    const match = empresas.find((e) => normalizeDigits((e as any)?.cuit) === cuitDesdeQuery);
    if (match) {
      setEmpresaSeleccionada(match);
      seleccionAutomaticaRef.current = true;
    }
  }, [cuitDesdeQuery, empresas, isLoadingEmpresas]);

  // Si está bloqueado por CUIT y no hay match en el store, igual mostrar la Razón Social en el combo
  useEffect(() => {
    if (!cuitDesdeQuery) return;
    if (empresaSeleccionada) return;

    const razonSocial = (polizaRawData as any)?.empleador_Denominacion;
    if (!razonSocial) return;
    setEmpresaSeleccionada({ razonSocial: String(razonSocial) } as any);
  }, [cuitDesdeQuery, empresaSeleccionada, polizaRawData]);

  // Seleccionar automáticamente si solo hay una empresa (salvo que venga CUIT por query)
  useEffect(() => {
    if (bloquearBusquedaPorCuit) return;
    if (!isLoadingEmpresas) {
      if (empresas.length === 1) {
        setEmpresaSeleccionada(empresas[0]);
        seleccionAutomaticaRef.current = true;
      } else if (empresas.length !== 1 && seleccionAutomaticaRef.current) {
        setEmpresaSeleccionada(null);
        seleccionAutomaticaRef.current = false;
      }
    }
  }, [empresas.length, isLoadingEmpresas, bloquearBusquedaPorCuit]);

  // Limpiar la denuncia seleccionada cuando cambia el CUIT (empresa/forzado)
  useEffect(() => {
    setSelectedDenuncia(null);
  }, [cuitFinalStr]);

  const handleEmpresaChange = (
    _event: React.SyntheticEvent,
    newValue: Empresa | null
  ) => {
    if (bloquearBusquedaPorCuit) return;
    setEmpresaSeleccionada(newValue);
    seleccionAutomaticaRef.current = false;
  };

  const getEmpresaLabel = (empresa: Empresa | null): string => {
    if (!empresa) return "";
    if (bloquearBusquedaPorCuit) return String((empresa as any)?.razonSocial ?? "");
    return `${empresa.razonSocial} - ${Formato.CUIP(empresa.cuit)}`;
  };

  const params: Parameters = cuitFinal ? { CUIT: cuitFinal } : {};

  // El hook solo hará fetch si hay CUIT en los parámetros
  const { data, error, isLoading } = gestionEmpleadorAPI.useGetVEmpleadorSiniestros(params);

  const instanciasParams: Parameters = cuitFinal ? { CUIT: cuitFinal } : {};
  
  if (selectedDenuncia != null && cuitFinal) {
    (instanciasParams as any).Denuncia = selectedDenuncia;
  }

  // El hook solo hará fetch si hay CUIT y Denuncia en los parámetros
  const {
    data: instanciasData,
    isLoading: isLoadingInst,
    error: errorInst,
  } = gestionEmpleadorAPI.useGetVEmpleadorSiniestrosInstancias(instanciasParams);

  // Log con token enmascarado y URL (debug)
  const url = useMemo(
    () => gestionEmpleadorAPI.getVEmpleadorSiniestrosURL(params),
    [params]
  );
  useEffect(() => {
    const raw = token.getToken?.();
    console.log("raw",raw)
    const masked =
      typeof raw === 'string'
        ? `Bearer ${raw.slice(0, 6)}…${raw.slice(-6)}`
        : '(objeto/token compuesto)';
    console.log('[GET] VEmpleadorSiniestros →', { url, params, tokenPreview: masked });
  }, [url, params]);

  // Filas principales
  const rows: SiniestroItem[] = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  // Carga instancias de esa denuncia
  const handleRowClick = (row: SiniestroItem) => {
    const den = Number(row.denunciaNro ?? 0);
    if (den) setSelectedDenuncia(den);
  };

  const instanciasRows: InstanciaSiniestro[] = useMemo(() => {
    if (!Array.isArray(instanciasData)) return [];
    return (instanciasData as any[]).map((it) => ({
      denunciaNro: Number(it.denunciaNro ?? 0),
      fechaHoraInstancia: it.fechaHoraInstancia ?? null,
      tipoInstancia: typeof it.tipoInstancia === 'string' ? it.tipoInstancia.trim() : it.tipoInstancia ?? null,
      comentarioInstancia: typeof it.comentarioInstancia === 'string' ? it.comentarioInstancia.trim() : it.comentarioInstancia ?? null,
      estadoInstancia: typeof it.estadoInstancia === 'string' ? it.estadoInstancia.trim() : it.estadoInstancia ?? null,
      proximoControlMedicoFechaHora: it.proximoControlMedicoFechaHora ?? null,
    }));
  }, [instanciasData]);

  const hasAnyDetalle = instanciasRows.length > 0;

  return (
    <div style={{ padding: 16 }}>
      <Box className={styles.empresaSelectorContainer}>
        <CustomSelectSearch<Empresa>
          label="Seleccionar Empresa"
          options={empresas}
          value={empresaSeleccionada}
          onChange={handleEmpresaChange}
          getOptionLabel={getEmpresaLabel}
          isOptionEqualToValue={(option, value) => option.empresaId === value.empresaId}
          loading={isLoadingEmpresas}
          disabled={isLoadingEmpresas || empresas.length === 0 || bloquearBusquedaPorCuit}
        />
      </Box>

      {error && (
        <p style={{ color: 'crimson' }}>
          {String((error as any)?.message ?? error)}
        </p>
      )}

      <DataTable<SiniestroItem>
        data={rows}
        columns={cols}
        isLoading={isLoading}
        size="mid"
        onRowClick={handleRowClick}
      />

      {/* Panel inferior*/}
      {selectedDenuncia != null && (
        <>
          {errorInst && (
            <p style={{ color: 'crimson' }}>
              {String((errorInst as any)?.message ?? errorInst)}
            </p>
          )}

          <CondicionesTabla
            rows={instanciasRows}
            loading={isLoadingInst}
            hasAny={hasAnyDetalle}
          />
        </>
      )}
    </div>
  );
}
