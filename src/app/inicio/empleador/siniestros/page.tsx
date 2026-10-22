'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '@/data/AuthContext';
import CustomSelectSearch from '@/utils/ui/form/CustomSelectSearch';
import CustomButton from '@/utils/ui/button/CustomButton';
import CustomModalMessage from '@/utils/ui/message/CustomModalMessage';
import Formato from '@/utils/Formato';
import styles from './siniestros.module.css';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { EmpleadorSiniestrosContextProvider, useEmpleadorSiniestrosContext } from './context';
import useSWR from 'swr';
import QueriesAPI, { type Pagination, type FiltroVm } from '@/data/queryAPI';
import { saveTable, type TableColumn, type AddTableOptions } from '@/utils/excelUtils';


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

type SiniestroColumnConfig = {
  key: keyof SiniestroItem;
  header: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (v: unknown) => string;
};

const trim = (v: unknown) => String(v ?? '').trim();

// Fuente única: UI (`cols`) y Excel (`exportColumns`/`exportOptions`) se derivan de esta tabla,
// para que grilla y export no puedan divergir (RN-003/RN-004).
const SINIESTROS_COLUMNS: SiniestroColumnConfig[] = [
  { key: 'trabCUIL', header: 'CUIL' },
  { key: 'trabNombre', header: 'Apellido y Nombre', formatter: trim },
  { key: 'establecimiento', header: 'Establecimiento' },
  { key: 'siniestroNro', header: 'Nº Siniestro' },
  { key: 'tipoSiniestro', header: 'Tipo', formatter: trim },
  { key: 'siniestroFechaHora', header: 'Fecha y Hora Siniestro', align: 'center', formatter: (v) => fmtDateTime(v as string | null) },
  { key: 'diagnostico', header: 'Diagnóstico', align: 'center' },
  { key: 'siniestroCategoria', header: 'Categoría', formatter: trim },
  { key: 'proximoControlMedicoFechaHora', header: 'Próx. Control Médico', align: 'center', formatter: (v) => fmtDateTime(v as string | null) },
  { key: 'prestador', header: 'Prestador inicial' },
  { key: 'altaMedicaFecha', header: 'Alta Médica', align: 'center', formatter: (v) => fmtDate(v as string | null) },
];

const cols: ColumnDef<SiniestroItem>[] = SINIESTROS_COLUMNS.map(({ key, header, align, formatter }) => ({
  header,
  accessorKey: key,
  ...(formatter ? { cell: ({ getValue }: { getValue: () => unknown }) => formatter(getValue()) } : {}),
  ...(align ? { meta: { align } } : {}),
}));

const EXPORT_FILE_NAME = 'Siniestros.xlsx';
const exportColumns: Record<string, TableColumn> = Object.fromEntries(
  SINIESTROS_COLUMNS.map(({ key, header }) => [key, { key, header }])
);
const exportOptions: AddTableOptions = {
  formatters: {
    row: Object.fromEntries(
      SINIESTROS_COLUMNS.filter((c) => c.formatter).map(({ key, formatter }) => [key, formatter!])
    ),
  },
};

const normalizeDigits = (value: unknown) => String(value ?? '').replace(/\D/g, '');
const EMPRESA_TODAS_ID = -1;
const EMPRESA_TODAS: Empresa = {
  empresaId: EMPRESA_TODAS_ID,
  cuit: 0,
  razonSocial: "Todas las Empresas",
  domicilio: "",
  localidad: "",
  provincia: "",
};


export default function SiniestrosPage() {
  const { user } = useAuth();
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const [selectedDenuncia, setSelectedDenuncia] = useState<number | null>(null);
  const [selectedDenunciaCuit, setSelectedDenunciaCuit] = useState<number | undefined>(undefined);

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
  const isAdmin = String(user?.rol ?? "").trim().toLowerCase() === 'administrador' || String(user?.rol ?? "").trim().toLowerCase() === 'administradorart';
  const cuitEmpresasUsuario = useMemo(() => {
    const desdeSesion = (user?.empresas ?? [])
      .filter((e) => e?.fechaBaja == null)
      .map((e) => Number(e.empresaCUIT))
      .filter((v) => Number.isFinite(v) && v > 0);
    if (desdeSesion.length > 0) return Array.from(new Set(desdeSesion));
    const desdeStore = empresas
      .map((e) => Number((e as any)?.cuit))
      .filter((v) => Number.isFinite(v) && v > 0);
    return Array.from(new Set(desdeStore));
  }, [empresas, user?.empresas]);
  const mostrarOpcionTodas = !bloquearBusquedaPorCuit && empresas.length > 1;
  const opcionesEmpresaSelector = useMemo(
    () => (mostrarOpcionTodas ? [EMPRESA_TODAS, ...empresas] : empresas),
    [empresas, mostrarOpcionTodas]
  );
  const empresaSeleccionadaEsValida = useMemo(() => {
    if (empresaSeleccionada == null) return false;
    return opcionesEmpresaSelector.some(
      (o) => o.empresaId === empresaSeleccionada.empresaId
    );
  }, [empresaSeleccionada, opcionesEmpresaSelector]);
  const esOpcionTodasSeleccionada = empresaSeleccionada?.empresaId === EMPRESA_TODAS_ID;
  const cuitFinalStr = cuitDesdeQuery || (esOpcionTodasSeleccionada ? "" : cuitEmpresaSeleccionada);
  const cuitFinal = cuitFinalStr ? Number(cuitFinalStr) : undefined;
  const cuitsContexto = useMemo<number[] | undefined>(() => {
    if (cuitFinal) return [cuitFinal];
    if (isAdmin) return undefined;
    return cuitEmpresasUsuario.length > 0 ? cuitEmpresasUsuario : undefined;
  }, [cuitFinal, isAdmin, cuitEmpresasUsuario]);

  // Si viene CUIT por query param, forzar selección por CUIT y bloquear el selector
  useEffect(() => {
    if (isLoadingEmpresas) return;
    if (!cuitDesdeQuery) return;

    const match = empresas.find((e) => normalizeDigits((e as any)?.cuit) === cuitDesdeQuery);
    if (match) setEmpresaSeleccionada(match);
  }, [cuitDesdeQuery, empresas, isLoadingEmpresas]);

  // Por defecto: "Todas las empresas" si existe esa opción; si no, la única empresa del usuario.
  useEffect(() => {
    if (bloquearBusquedaPorCuit) return;
    if (isLoadingEmpresas) return;
    if (empresas.length === 0) return;
    if (empresaSeleccionadaEsValida) return;

    if (mostrarOpcionTodas) setEmpresaSeleccionada(EMPRESA_TODAS);
    else setEmpresaSeleccionada(empresas[0]);
  }, [
    bloquearBusquedaPorCuit,
    isLoadingEmpresas,
    empresas,
    mostrarOpcionTodas,
    empresaSeleccionadaEsValida,
  ]);

  // Limpiar la denuncia seleccionada cuando cambia el CUIT (empresa/forzado)
  useEffect(() => {
    setSelectedDenuncia(null);
    setSelectedDenunciaCuit(undefined);
  }, [cuitFinalStr]);

  const handleEmpresaChange = (
    _event: React.SyntheticEvent,
    newValue: Empresa | null
  ) => {
    if (bloquearBusquedaPorCuit) return;
    setEmpresaSeleccionada(newValue);
  };

  const getEmpresaLabel = (empresa: Empresa | null): string => {
    if (!empresa) return "";
    if (empresa.empresaId === EMPRESA_TODAS_ID) return "Todas las Empresas";
    if (bloquearBusquedaPorCuit) return String((empresa as any)?.razonSocial ?? "");
    return `${empresa.razonSocial} - ${Formato.CUIP(empresa.cuit)}`;
  };

  const handleLimpiarFiltro = () => {
    const params = new URLSearchParams();
    if (cuitQuery) params.set('cuit', cuitQuery);
    router.replace(params.toString() ? `${pathname}?${params}` : pathname);
  };

  const tieneFiltroAplicado = Boolean(filtroIdParam && filtroNombreParam);

  const cuitParaInstancias = cuitFinal ?? selectedDenunciaCuit;
  const instanciasParams: Parameters = cuitParaInstancias ? { CUIT: cuitParaInstancias } : {};
  if (selectedDenuncia != null && cuitParaInstancias) {
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
    const cuitFilaRaw =
      (row as any)?.empCUIT ??
      (row as any)?.empCuit ??
      (row as any)?.CUIT ??
      (row as any)?.Cuit ??
      (row as any)?.cuit ??
      0;
    const cuitFila = Number(normalizeDigits(cuitFilaRaw));
    if (den) {
      setSelectedDenuncia(den);
      setSelectedDenunciaCuit(Number.isFinite(cuitFila) && cuitFila > 0 ? cuitFila : undefined);
    }
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
            options={opcionesEmpresaSelector}
            value={empresaSeleccionada}
            onChange={handleEmpresaChange}
            getOptionLabel={getEmpresaLabel}
            isOptionEqualToValue={(option, value) => option.empresaId === value.empresaId}
            loading={isLoadingEmpresas}
            disabled={isLoadingEmpresas || opcionesEmpresaSelector.length === 0 || bloquearBusquedaPorCuit}
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

      <EmpleadorSiniestrosContextProvider cuit={cuitFinal} cuits={cuitsContexto} isAdmin={isAdmin} proposition={proposition}>
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportFallo, setExportFallo] = useState(false);

  useEffect(() => {
    if (!cuitDesdeQuery) return;
    if (empresaSeleccionada) return;
    if (!razonSocialFromQuery) return;
    setEmpresaSeleccionada({ razonSocial: razonSocialFromQuery } as Empresa);
  }, [cuitDesdeQuery, empresaSeleccionada, razonSocialFromQuery, setEmpresaSeleccionada]);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      await saveTable(exportColumns, rows, EXPORT_FILE_NAME, {
        format: 'xlsx',
        sheet: { name: 'Siniestros' },
        table: exportOptions,
      });
    } catch {
      setExportFallo(true);
    } finally {
      setIsExporting(false);
    }
  }, [rows]);

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
        toolbarActions={
          <CustomButton
            onClick={handleExportExcel}
            isLoading={isExporting}
            disabled={isLoading || Boolean(error)}
          >
            Descarga Excel
          </CustomButton>
        }
      />
      <CustomModalMessage
        open={exportFallo}
        type="error"
        message="Operación fallida. Intente nuevamente."
        onClose={() => setExportFallo(false)}
      />
    </>
  );
}
