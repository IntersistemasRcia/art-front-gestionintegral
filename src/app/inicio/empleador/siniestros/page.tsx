'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import gestionEmpleadorAPI from '@/data/gestionEmpleadorAPI';
import type { Parameters } from '@/app/inicio/empleador/cobertura/types/persona';

import DataTable from '@/utils/ui/table/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Box, Typography } from '@mui/material';

import CondicionesTabla from './table';
import type { SiniestroItem, InstanciaSiniestro } from './types/tipos';
import { useEmpresasStore } from '@/data/empresasStore';
import { Empresa } from '@/data/authAPI';
import CustomSelectSearch from '@/utils/ui/form/CustomSelectSearch';
import CustomButton from '@/utils/ui/button/CustomButton';
import Formato from '@/utils/Formato';
import styles from './siniestros.module.css';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { EmpleadorSiniestrosContextProvider, useEmpleadorSiniestrosContext } from './context';
import useSWR from 'swr';
import QueriesAPI, { type Pagination, type FiltroVm } from '@/data/queryAPI';


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
    meta: { align: 'center' },
  },
  { header: 'Diagnóstico', accessorKey: 'diagnostico', meta: { align: 'center' }, },
  
  {
    header: 'Categoría',
    accessorKey: 'siniestroCategoria',
    cell: ({ getValue }) => String(getValue() ?? '').trim(),
  },
  {
    header: 'Próx. Control Médico',
    accessorKey: 'proximoControlMedicoFechaHora',
    cell: ({ getValue }) => fmtDateTime(getValue() as string | null),
    meta: { align: 'center' },
  },
  { header: 'Prestador inicial', accessorKey: 'prestador' },
  {
    header: 'Alta Médica',
    accessorKey: 'altaMedicaFecha',
    cell: ({ getValue }) => fmtDate(getValue() as string | null),
    meta: { align: 'center' },
  },
];

const normalizeDigits = (value: unknown) => String(value ?? '').replace(/\D/g, '');


export default function SiniestrosPage() {
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const seleccionAutomaticaRef = useRef(false);
  const [selectedDenuncia, setSelectedDenuncia] = useState<number | null>(null);

  const cuitQuery = searchParams.get('cuit') ?? searchParams.get('cuil') ?? '';
  const cuitDesdeQuery = normalizeDigits(cuitQuery);
  const bloquearBusquedaPorCuit = Boolean(cuitDesdeQuery);
  const filtroIdParam = searchParams.get('filtroId');
  const filtroNombreParam = searchParams.get('filtroNombre') ?? '';

  const filtersParams = filtroIdParam ? { id: Number(filtroIdParam) } : null;
  const { data: filtersData } = useSWR<Pagination<FiltroVm>>(
    filtersParams ? QueriesAPI.swrGetFilters.key(filtersParams) : null,
    QueriesAPI.swrGetFilters.fetcher
  );
  const proposition = useMemo(() => {
    const data = filtersData?.data;
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0]?.proposition ?? null;
  }, [filtersData?.data]);

  const cuitEmpresaSeleccionada = normalizeDigits((empresaSeleccionada as any)?.cuit);
  const cuitFinalStr = cuitDesdeQuery || cuitEmpresaSeleccionada;
  const cuitFinal = cuitFinalStr ? Number(cuitFinalStr) : undefined;

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

  const handleLimpiarFiltro = () => {
    const params = new URLSearchParams();
    if (cuitQuery) params.set('cuit', cuitQuery);
    router.replace(params.toString() ? `${pathname}?${params}` : pathname);
  };

  const tieneFiltroAplicado = Boolean(filtroIdParam && filtroNombreParam);

  const instanciasParams: Parameters = cuitFinal ? { CUIT: cuitFinal } : {};
  if (selectedDenuncia != null && cuitFinal) {
    (instanciasParams as any).Denuncia = selectedDenuncia;
  }

  const {
    data: instanciasData,
    isLoading: isLoadingInst,
    error: errorInst,
  } = gestionEmpleadorAPI.useGetVEmpleadorSiniestrosInstancias(instanciasParams);

  // Carga instancias de esa denuncia (como antes: denunciaNro o siniestroNro para abrir el panel)
  const handleRowClick = (row: SiniestroItem) => {
    const den = Number(row.denunciaNro ?? 0) || Number(row.siniestroNro ?? 0);
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', marginBottom: 2 }}>
        <Box className={styles.empresaSelectorContainer} sx={{ flexShrink: 0 }}>
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
        {tieneFiltroAplicado && (
          <>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              Filtro aplicado: <strong>{decodeURIComponent(filtroNombreParam)}</strong>
            </Typography>
            <CustomButton variant="outlined" size="small" onClick={handleLimpiarFiltro}>
              Limpiar Filtro
            </CustomButton>
          </>
        )}
      </Box>

      <EmpleadorSiniestrosContextProvider cuit={cuitFinal} proposition={proposition}>
        <TablaSiniestrosPadre
          cuitDesdeQuery={cuitDesdeQuery}
          empresaSeleccionada={empresaSeleccionada}
          setEmpresaSeleccionada={setEmpresaSeleccionada}
          onRowClick={handleRowClick}
        />
      </EmpleadorSiniestrosContextProvider>

      {/* Tabla hija (instancias): lógica original, sin cambios */}
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

type TablaSiniestrosPadreProps = {
  cuitDesdeQuery: string;
  empresaSeleccionada: Empresa | null;
  setEmpresaSeleccionada: React.Dispatch<React.SetStateAction<Empresa | null>>;
  onRowClick: (row: SiniestroItem) => void;
};

/** Solo la tabla padre de siniestros (fetch vía queryAPI/context). La tabla hija de instancias queda en la page. */
function TablaSiniestrosPadre({
  cuitDesdeQuery,
  empresaSeleccionada,
  setEmpresaSeleccionada,
  onRowClick,
}: TablaSiniestrosPadreProps) {
  const { rows, isLoading, error, razonSocialFromQuery } = useEmpleadorSiniestrosContext();

  useEffect(() => {
    if (!cuitDesdeQuery) return;
    if (empresaSeleccionada) return;
    if (!razonSocialFromQuery) return;
    setEmpresaSeleccionada({ razonSocial: razonSocialFromQuery } as Empresa);
  }, [cuitDesdeQuery, empresaSeleccionada, razonSocialFromQuery, setEmpresaSeleccionada]);

  return (
    <>
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
        onRowClick={onRowClick}
      />
    </>
  );
}
