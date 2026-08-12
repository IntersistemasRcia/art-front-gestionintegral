"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from '@/data/AuthContext';
import DataTable from '@/utils/ui/table/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import ArtAPI from '@/data/artAPI';
import { type Empresa } from '@/data/authAPI';
import { useEmpresasStore } from '@/data/empresasStore';
import Formato from '@/utils/Formato';
import styles from './poliza.module.css';
import CustomSelectSearch from "@/utils/ui/form/CustomSelectSearch";
import { BsFileText, BsCardChecklist, BsGraphUpArrow, BsCalendar2Plus } from 'react-icons/bs';
import { PiUserSwitchFill } from 'react-icons/pi';
import FormularioComercializador from './historialPoliza/formularioComercializador';
import Link from 'next/link';
import type { Poliza, SRTPolizaAcotada } from "./types/poliza";
import CustomTabs from '@/utils/ui/tab/CustomTab';
import HistorialPoliza from './historialPoliza/historialPoliza';
import SrtAPI from '@/data/srtAPI';
import {
  getComercializadorDescripcion,
  getComercializadorInterno,
  isPolizaDirectlyAssignedToComercializador,
  polizaBelongsDirectlyToAsociado,
  polizaBelongsToAsociado,
  walkAsociadoHierarchy,
} from "@/utils/srt/srtComercializadorAsociadoUtils";
import { isSRTPolizaVigente } from "@/utils/srt/srtPolizaVigenciaUtils";

const EMPRESA_TODAS_EMPRESAS_ID = -1;
const POLIZA_COMBO_TODOS_ID = -1;

const EMPRESA_OPCION_TODAS: Empresa = {
  empresaId: EMPRESA_TODAS_EMPRESAS_ID,
  cuit: 0,
  razonSocial: 'Todas las Empresas',
  domicilio: '',
  localidad: '',
  provincia: '',
};

type PolizaComboOption = {
  interno: number;
  descripcion: string;
};

const POLIZA_COMBO_TODOS: PolizaComboOption = {
  interno: POLIZA_COMBO_TODOS_ID,
  descripcion: "Todos",
};

function digits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

type PolizaRow = {
  interno: string;
  numero: string;
  NroPoliza: string;
  CUIT: string;
  Empleador_Denominacion: string;
  Comercializador_Denominacion: string;
  srtComercializadorInterno: number;
  Vigencia_Desde: string;
  Vigencia_Hasta: string;
  fecha: string;
};

function PolizasListado({
  rows,
  isLoading,
  groupSelect,
  organizadorSelect,
  comercializadorSelect,
  emptyMessage,
  onRowClick,
  selectedRowKey,
  onCambiarComercializador,
}: {
  rows: PolizaRow[];
  isLoading?: boolean;
  groupSelect?: React.ReactNode;
  organizadorSelect?: React.ReactNode;
  comercializadorSelect?: React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (row: PolizaRow) => void;
  selectedRowKey?: string;
  onCambiarComercializador?: (row: PolizaRow) => void;
}) {
  const { hasTask } = useAuth();
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const seleccionAutomaticaRef = useRef(false);
  const isComboLoading = isLoadingEmpresas || isLoading;

  const columns: ColumnDef<Poliza>[] = [
    { accessorKey: 'numero', header: 'Nro. Póliza', meta: { align: 'left' } },
    {
      accessorKey: 'CUIT',
      header: 'CUIT',
      meta: { align: 'left' },
      cell: (info: any) => {
        const v = info.getValue();
        const vDigits = digits(v);
        return Formato.CUIP(vDigits) || String(v ?? '');
      },
    },
    { accessorKey: 'Empleador_Denominacion', header: 'Empleador', meta: { align: 'left' } },
    { accessorKey: 'Comercializador_Denominacion', header: 'Comercializador', meta: { align: 'left' } },
    {
      accessorKey: 'fecha',
      header: 'Fecha de suscripción',
      meta: { align: 'left' },
      cell: (info: any) => {
        const v = String(info.getValue() ?? '');
        return Formato.Fecha(v) || v;
      },
    },
    {
      accessorKey: 'Vigencia_Desde',
      header: 'Vigencia Desde',
      meta: { align: 'left' },
      cell: (info: any) => {
        const v = String(info.getValue() ?? '');
        return Formato.Fecha(v) || v;
      },
    },
    {
      accessorKey: 'Vigencia_Hasta',
      header: 'Vigencia Hasta',
      meta: { align: 'center' },
      cell: (info: any) => {
        const v = String(info.getValue() ?? '');
        const d = new Date(v);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isExpired = !Number.isNaN(d.getTime()) && d < today;
        const formatted = Formato.Fecha(v) || v;
        return (
          <span className={isExpired ? styles.expired : undefined}>
            {formatted}
          </span>
        );
      },
    },
    {
      id: 'accion',
      header: 'Acción',
      meta: { align: 'center' },
      cell: ({ row }: any) => {
        const cuitDigits = digits(row?.original?.CUIT);
        return (
          <div className={styles.iconActions}>
            <Link
              href={{ pathname: '/inicio/empleador/poliza', query: { cuit: cuitDigits } }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Ver póliza del empleador"
            >
              <BsFileText title="Poliza" className={styles.iconButton} />
            </Link>

            <Link
              href={{ pathname: '/inicio/empleador/cobertura', query: { cuit: cuitDigits } }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Ver coberturas del empleador"
            >
              <BsCardChecklist title="Cobertura" className={styles.iconButton} />
            </Link>

            <Link
              href={{ pathname: '/inicio/empleador/cuentaCorriente', query: { cuit: cuitDigits } }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Ver CtaCte del empleador"
            >
              <BsGraphUpArrow title="CuentaCorriente" className={styles.iconButton} />
            </Link>

            <Link
              href={{ pathname: '/inicio/empleador/siniestros', query: { cuit: cuitDigits } }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Ver póliza del empleador"
            >
              <BsCalendar2Plus title="Siniestros" className={styles.iconButton} />
            </Link>

            {hasTask("Comercializador_Polizas_CambiarComercializador") && (
              <PiUserSwitchFill
                title="Cambiar comercializador o asociado"
                className={styles.iconButton}
                onClick={(e) => { e.stopPropagation(); onCambiarComercializador?.(row.original); }}
              />
            )}
          </div>
        );
      },
      enableHiding: true,
    },
  ];

  const empresasOptions = useMemo(
    () => (empresas.length > 1 ? [EMPRESA_OPCION_TODAS, ...empresas] : empresas),
    [empresas]
  );

  const formatEmpresaLabel = (e?: Empresa | null) => {
    if (!e) return '';
    if (e.empresaId === EMPRESA_TODAS_EMPRESAS_ID) return 'Todas las Empresas';
    const razon = String(e.razonSocial ?? '').trim();
    const cuit = digits(e.cuit);
    const cuitForm = cuit ? Formato.CUIP(cuit) || cuit : '';
    return cuitForm ? `${razon} - ${cuitForm}` : razon;
  };

  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  useEffect(() => {
    if (isLoadingEmpresas) return;
    if (empresas.length === 0) {
      setEmpresa(null);
      seleccionAutomaticaRef.current = false;
      return;
    }
    setEmpresa((prev) => {
      if (!seleccionAutomaticaRef.current && prev !== null) return prev;
      return empresas.length === 1 ? empresas[0] : EMPRESA_OPCION_TODAS;
    });
    seleccionAutomaticaRef.current = true;
  }, [empresas, isLoadingEmpresas]);

  const filteredRows = useMemo(() => {
    if (!empresa) return rows;
    if (empresa.empresaId === EMPRESA_TODAS_EMPRESAS_ID) return rows;
    const cuitEmpresa = digits(empresa.cuit);
    if (cuitEmpresa) {
      return rows.filter((r) => digits(r?.CUIT) === cuitEmpresa);
    }
    const rs = String(empresa.razonSocial ?? '').trim().toLowerCase();
    return rows.filter((r) => String(r?.Empleador_Denominacion ?? '').trim().toLowerCase() === rs);
  }, [rows, empresa]);

  return (
    <div className={styles.container}>
      <div className={styles.topRow}>
        <div className={styles.selectItem}>
          <CustomSelectSearch<Empresa>
            options={empresasOptions}
            getOptionLabel={(e) => formatEmpresaLabel(e)}
            value={empresa}
            onChange={(_event, newValue) => {
              setEmpresa(newValue);
              seleccionAutomaticaRef.current = false;
            }}
            label="Empresa"
            placeholder="Filtrar por razón social..."
            loading={isComboLoading}
            loadingText="Cargando..."
            noOptionsText={
              isComboLoading
                ? "Cargando..."
                : empresasOptions.length === 0
                ? "No hay empresas disponibles"
                : "No se encontraron empresas"
            }
            disabled={isComboLoading || empresasOptions.length === 0}
          />
        </div>
        <div className={styles.selectItem}>{groupSelect}</div>
        <div className={styles.selectItem}>{organizadorSelect}</div>
        <div className={styles.selectItem}>{comercializadorSelect}</div>
      </div>

      {!isLoading && emptyMessage && filteredRows.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : null}

      <DataTable
        columns={columns}
        data={filteredRows}
        pageSizeOptions={[5, 10, 20]}
        isLoading={isLoading}
        size="mid"
        onRowClick={onRowClick}
        selectedRowKeyProp={selectedRowKey}
      />
    </div>
  );
}

function PolizasPage() {
  const { hasTask } = useAuth();

  const [grupo, setGrupo] = useState<PolizaComboOption>(POLIZA_COMBO_TODOS);
  const [organizador, setOrganizador] = useState<PolizaComboOption>(POLIZA_COMBO_TODOS);
  const [comercializador, setComercializador] = useState<PolizaComboOption>(POLIZA_COMBO_TODOS);
  const [tab, setTab] = useState(0);
  const [selectedPoliza, setSelectedPoliza] = useState<PolizaRow | null>(null);
  const [modalPoliza, setModalPoliza] = useState<PolizaRow | null>(null);

  const {
    data: polizasUsuarioLogueadoData,
    isLoading: isLoadingPolizasUsuarioLogueado,
    mutate: mutatePolizasUsuarioLogueado,
  } = ArtAPI.useGetPolizasUsuarioLogueadoURL();

  const polizasVigentes = useMemo(
    () => filterPolizasVigentes((polizasUsuarioLogueadoData ?? []) as SRTPolizaAcotada[]),
    [polizasUsuarioLogueadoData],
  );

  const grupoAsociadoIdSeleccionado = isPolizaComboTodos(grupo) ? 0 : grupo.interno;
  const organizadorAsociadoIdSeleccionado = isPolizaComboTodos(organizador) ? 0 : organizador.interno;

  /** Combos se arman solo desde UsuarioLogueado (jerarquía nested), sin APIs auxiliares. */
  const grupoOptions = useMemo(
    () => buildGrupoComboOptions(polizasVigentes),
    [polizasVigentes],
  );

  const organizadorOptions = useMemo(
    () => buildOrganizadorComboOptions(polizasVigentes, grupoAsociadoIdSeleccionado),
    [polizasVigentes, grupoAsociadoIdSeleccionado],
  );

  const comercializadorOptions = useMemo(
    () => buildComercializadorComboOptions(
      polizasVigentes,
      grupoAsociadoIdSeleccionado,
      organizadorAsociadoIdSeleccionado,
    ),
    [polizasVigentes, grupoAsociadoIdSeleccionado, organizadorAsociadoIdSeleccionado],
  );

  useEffect(() => {
    if (!organizadorOptions.some((option) => option.interno === organizador.interno)) {
      setOrganizador(POLIZA_COMBO_TODOS);
    }
  }, [organizadorOptions, organizador.interno]);

  useEffect(() => {
    if (!comercializadorOptions.some((option) => option.interno === comercializador.interno)) {
      setComercializador(POLIZA_COMBO_TODOS);
    }
  }, [comercializadorOptions, comercializador.interno]);

  const isLoadingCombos = isLoadingPolizasUsuarioLogueado;

  const filteredPolizas = useMemo(
    () => filterPolizasByCombos(polizasVigentes, grupo, organizador, comercializador),
    [polizasVigentes, grupo, organizador, comercializador],
  );

  const tableRows = useMemo(
    () => mapPolizasToRows(filteredPolizas),
    [filteredPolizas],
  );

  const getComboLabel = (option?: PolizaComboOption | null) =>
    String(option?.descripcion ?? "");

  const groupSelect = (
    <CustomSelectSearch<PolizaComboOption>
      options={grupoOptions}
      getOptionLabel={getComboLabel}
      value={grupo}
      onChange={(_e, value) => {
        setGrupo(value ?? POLIZA_COMBO_TODOS);
        setOrganizador(POLIZA_COMBO_TODOS);
        setComercializador(POLIZA_COMBO_TODOS);
      }}
      label="Grupo Organizador"
      loading={isLoadingCombos}
      loadingText="Cargando..."
      noOptionsText={
        isLoadingCombos
          ? "Cargando..."
          : "No hay grupos disponibles"
      }
      disabled={isLoadingCombos}
    />
  );

  const organizadorSelect = (
    <CustomSelectSearch<PolizaComboOption>
      options={organizadorOptions}
      getOptionLabel={getComboLabel}
      value={organizador}
      onChange={(_e, value) => {
        setOrganizador(value ?? POLIZA_COMBO_TODOS);
        setComercializador(POLIZA_COMBO_TODOS);
      }}
      label="Organizador"
      loading={isLoadingCombos}
      loadingText="Cargando..."
      noOptionsText={
        isLoadingCombos
          ? "Cargando..."
          : "No hay organizadores disponibles"
      }
      disabled={isLoadingCombos}
    />
  );

  const comercializadorSelect = (
    <CustomSelectSearch<PolizaComboOption>
      options={comercializadorOptions}
      getOptionLabel={getComboLabel}
      isOptionEqualToValue={(option, value) =>
        option.interno === value.interno
        || (
          normalizeComboDescripcion(option.descripcion)
          === normalizeComboDescripcion(value.descripcion)
        )
      }
      value={comercializador}
      onChange={(_e, value) => setComercializador(value ?? POLIZA_COMBO_TODOS)}
      label="Comercializador"
      loading={isLoadingCombos}
      loadingText="Cargando..."
      noOptionsText={
        isLoadingCombos
          ? "Cargando..."
          : "No hay comercializadores disponibles"
      }
      disabled={isLoadingCombos}
    />
  );

  const hasActiveFilter =
    !isPolizaComboTodos(comercializador)
    || !isPolizaComboTodos(organizador)
    || !isPolizaComboTodos(grupo);

  const emptyMessage = hasActiveFilter
    ? 'No hay pólizas para el filtro seleccionado.'
    : undefined;

  const polizaInterno = selectedPoliza ? Number(selectedPoliza.interno) : undefined;
  const { data: historialData, isLoading: historialLoading, mutate: mutateHistorial } = SrtAPI.useGetSRTComercializadoresHistorialByPolizaId(polizaInterno);

  const historialRows = useMemo(() => {
    if (!historialData) return [];
    return (historialData as any[]).map((item) => ({
      ...item,
      numeroPoliza: selectedPoliza?.numero ?? String(item.srtPolizaInterno),
    }));
  }, [historialData, selectedPoliza]);

  const historial = (
    <HistorialPoliza
      data={historialRows}
      isLoading={historialLoading}
      hasSelection={!!selectedPoliza}
      empleadorCuit={selectedPoliza?.CUIT ?? ""}
      empleadorRazonSocial={selectedPoliza?.Empleador_Denominacion ?? ""}
      polizaInterno={polizaInterno}
      onSuccess={mutateHistorial}
    />
  );

  return (
    <>
      <CustomTabs
        currentTab={tab}
        onTabChange={(_e, v) => setTab(v)}
        tabs={[
          {
            label: "Polizas",
            value: 0,
            content: (
              <PolizasListado
                rows={tableRows}
                isLoading={isLoadingPolizasUsuarioLogueado || isLoadingCombos}
                groupSelect={groupSelect}
                organizadorSelect={organizadorSelect}
                comercializadorSelect={comercializadorSelect}
                emptyMessage={emptyMessage}
                onRowClick={setSelectedPoliza}
                selectedRowKey={selectedPoliza?.interno}
                onCambiarComercializador={setModalPoliza}
              />
            ),
          },
          ...(hasTask("Comercializador_Polizas_Historial") ? [{ label: "Historial", value: 1, content: historial }] : []),
        ]}
      />
      <FormularioComercializador
        open={!!modalPoliza}
        onClose={() => setModalPoliza(null)}
        onSuccess={() => { mutateHistorial(); mutatePolizasUsuarioLogueado(); }}
        empleadorCuit={modalPoliza?.CUIT ?? ""}
        empleadorRazonSocial={modalPoliza?.Empleador_Denominacion ?? ""}
        polizaInterno={modalPoliza ? Number(modalPoliza.interno) : undefined}
        numeroPoliza={modalPoliza?.numero}
        comercializadorActualInterno={modalPoliza?.srtComercializadorInterno || undefined}
      />
    </>
  );
}

export default PolizasPage;

function isPolizaVigente(poliza: SRTPolizaAcotada): boolean {
  return isSRTPolizaVigente(poliza);
}

function filterPolizasVigentes(polizas: SRTPolizaAcotada[]): SRTPolizaAcotada[] {
  return polizas.filter(isPolizaVigente);
}

function withTodosOption(options: PolizaComboOption[]): PolizaComboOption[] {
  return [POLIZA_COMBO_TODOS, ...uniqueComboOptions(options)];
}

function normalizeComboDescripcion(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function uniqueComboOptions(items: PolizaComboOption[]): PolizaComboOption[] {
  const map = new Map<number, PolizaComboOption>();
  items.forEach((item) => {
    if (item.interno > 0 && item.descripcion.trim()) {
      map.set(item.interno, item);
    }
  });
  return Array.from(map.values()).sort((a, b) =>
    a.descripcion.localeCompare(b.descripcion, "es"),
  );
}

function uniqueComercializadorComboOptions(items: PolizaComboOption[]): PolizaComboOption[] {
  const byInterno = new Map<number, PolizaComboOption>();
  const byDescripcion = new Map<string, PolizaComboOption>();

  items.forEach((item) => {
    const descripcion = item.descripcion.trim();
    if (!descripcion) return;

    const descripcionKey = normalizeComboDescripcion(descripcion);
    if (byDescripcion.has(descripcionKey)) return;
    if (item.interno > 0 && byInterno.has(item.interno)) return;

    const option = { interno: item.interno, descripcion };
    if (item.interno > 0) byInterno.set(item.interno, option);
    byDescripcion.set(descripcionKey, option);
  });

  return Array.from(byDescripcion.values()).sort((a, b) =>
    a.descripcion.localeCompare(b.descripcion, "es"),
  );
}

function polizaMatchesComercializador(
  poliza: SRTPolizaAcotada,
  comercializador: PolizaComboOption,
): boolean {
  const interno = getComercializadorInterno(poliza);
  if (interno > 0 && interno === comercializador.interno) return true;

  return (
    normalizeComboDescripcion(getComercializadorDescripcion(poliza))
    === normalizeComboDescripcion(comercializador.descripcion)
  );
}

function buildGrupoComboOptions(polizas: SRTPolizaAcotada[]): PolizaComboOption[] {
  const items = polizas.flatMap((poliza) =>
    walkAsociadoHierarchy(poliza)
      .filter((node) => node.tipo === "grupo")
      .map((node) => ({ interno: node.asociadoId, descripcion: node.descripcion })),
  );

  return withTodosOption(items);
}

/** Organizadores presentes en las pólizas; si hay Grupo, solo los de ese Grupo (por asociadoId). */
function buildOrganizadorComboOptions(
  polizas: SRTPolizaAcotada[],
  grupoAsociadoIdSeleccionado: number,
): PolizaComboOption[] {
  const items = polizas.flatMap((poliza) => {
    if (
      grupoAsociadoIdSeleccionado > 0
      && !polizaBelongsToAsociado(poliza, grupoAsociadoIdSeleccionado, "grupo")
    ) {
      return [];
    }

    return walkAsociadoHierarchy(poliza)
      .filter((node) => node.tipo === "organizador")
      .map((node) => ({ interno: node.asociadoId, descripcion: node.descripcion }));
  });

  return withTodosOption(items);
}

/**
 * Comercializador:
 * - Grupo y Organizador en Todos → solo Independientes.
 * - Grupo seleccionado (Organizador Todos) → comercializadores de pólizas
 *   **directas** del grupo (no las que pasan por organizador).
 * - Organizador seleccionado → comercializadores de pólizas directas de ese organizador.
 */
function buildComercializadorComboOptions(
  polizas: SRTPolizaAcotada[],
  grupoAsociadoIdSeleccionado: number,
  organizadorAsociadoIdSeleccionado: number,
): PolizaComboOption[] {
  const items = polizas
    .filter((poliza) => {
      if (organizadorAsociadoIdSeleccionado > 0) {
        return polizaBelongsDirectlyToAsociado(
          poliza,
          organizadorAsociadoIdSeleccionado,
          "organizador",
        );
      }
      if (grupoAsociadoIdSeleccionado > 0) {
        return polizaBelongsDirectlyToAsociado(
          poliza,
          grupoAsociadoIdSeleccionado,
          "grupo",
        );
      }
      return isPolizaDirectlyAssignedToComercializador(poliza);
    })
    .map((poliza) => ({
      interno: getComercializadorInterno(poliza),
      descripcion: getComercializadorDescripcion(poliza),
    }));

  return [POLIZA_COMBO_TODOS, ...uniqueComercializadorComboOptions(items)];
}

function isPolizaComboTodos(option: PolizaComboOption | null | undefined): boolean {
  return !option || option.interno === POLIZA_COMBO_TODOS_ID;
}

/**
 * Tabla:
 * - Grupo y Organizador en Todos + Comercializador → Independientes de ese comercializador.
 * - Organizador → pólizas **directas** de ese organizador (y comercializador si hay).
 * - Grupo + Organizador Todos + Comercializador Todos → **todas** las pólizas del grupo
 *   (directas o vía organizador). Sin Independientes.
 * - Grupo + Organizador Todos + Comercializador → solo pólizas **directas** del grupo
 *   de ese comercializador (no las que pasan por organizador).
 */
function filterPolizasByCombos(
  polizas: SRTPolizaAcotada[],
  grupo: PolizaComboOption,
  organizador: PolizaComboOption,
  comercializador: PolizaComboOption,
): SRTPolizaAcotada[] {
  const hasGrupo = !isPolizaComboTodos(grupo);
  const hasOrganizador = !isPolizaComboTodos(organizador);
  const hasComercializador = !isPolizaComboTodos(comercializador);

  return polizas.filter((poliza) => {
    if (!hasGrupo && !hasOrganizador) {
      if (!hasComercializador) return true;
      return (
        isPolizaDirectlyAssignedToComercializador(poliza)
        && polizaMatchesComercializador(poliza, comercializador)
      );
    }

    if (isPolizaDirectlyAssignedToComercializador(poliza)) return false;

    if (hasOrganizador) {
      if (!polizaBelongsDirectlyToAsociado(poliza, organizador.interno, "organizador")) {
        return false;
      }
    } else if (hasGrupo) {
      if (hasComercializador) {
        // Comercializador concreto: solo directas del grupo.
        if (!polizaBelongsDirectlyToAsociado(poliza, grupo.interno, "grupo")) {
          return false;
        }
      } else if (!polizaBelongsToAsociado(poliza, grupo.interno, "grupo")) {
        // Comercializador Todos: todas las del grupo (directas o vía organizador).
        return false;
      }
    }

    if (hasComercializador && !polizaMatchesComercializador(poliza, comercializador)) {
      return false;
    }

    return true;
  });
}

function mapPolizasToRows(polizas: SRTPolizaAcotada[]): PolizaRow[] {
  return polizas.map((item) => ({
    interno: String(item.interno),
    numero: String(item.numero ?? ''),
    NroPoliza: String(item.numero ?? ''),
    CUIT: String(item.cuit ?? ''),
    Empleador_Denominacion: String(item.empleadorDenominacion ?? ''),
    Comercializador_Denominacion: getComercializadorDescripcion(item)
      || String(item.srtComercializadorDenominacion ?? ''),
    srtComercializadorInterno: getComercializadorInterno(item),
    Vigencia_Desde: String(item.vigenciaDesde ?? ''),
    Vigencia_Hasta: String(item.vigenciaHasta ?? ''),
    fecha: String(item.movimientoFecha ?? item.estadoFecha ?? ''),
  }));
}
