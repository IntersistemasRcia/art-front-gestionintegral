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
import type { Poliza } from "./types/poliza";
import CustomTabs from '@/utils/ui/tab/CustomTab';
import HistorialPoliza from './historialPoliza/historialPoliza';
import SrtAPI from '@/data/srtAPI';

const EMPRESA_TODAS_EMPRESAS_ID = -1;

const EMPRESA_OPCION_TODAS: Empresa = {
  empresaId: EMPRESA_TODAS_EMPRESAS_ID,
  cuit: 0,
  razonSocial: 'Todas las Empresas',
  domicilio: '',
  localidad: '',
  provincia: '',
};


function digits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

type PolizaRow = { interno: string; numero: string; NroPoliza: string; CUIT: string; Empleador_Denominacion: string; Vigencia_Desde: string; Vigencia_Hasta: string; fecha: string; };

function PolizasListado({
  params = {},
  groupSelect,
  organizadorSelect,
  comercializadorSelect,
  emptyMessage,
  isResolvingPolizas = false,
  onRowClick,
  selectedRowKey,
  onCambiarComercializador,
}: {
  params?: Record<string, unknown> | null;
  groupSelect?: React.ReactNode;
  organizadorSelect?: React.ReactNode;
  comercializadorSelect?: React.ReactNode;
  emptyMessage?: string;
  isResolvingPolizas?: boolean;
  onRowClick?: (row: PolizaRow) => void;
  selectedRowKey?: string;
  onCambiarComercializador?: (row: PolizaRow) => void;
}) {
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

            <PiUserSwitchFill
              title="Cambiar comercializador o asociado"
              className={styles.iconButton}
              onClick={(e) => { e.stopPropagation(); onCambiarComercializador?.(row.original); }}
            />
        </div>
      );
    },
    enableHiding: true,
  },
];
  const { data: apiDataRaw, error: apiError, isLoading: apiIsLoading } = ArtAPI.useGetPolizaComercializadorURL(params);
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const seleccionAutomaticaRef = useRef(false);

  const apiData = isResolvingPolizas ? [] : apiDataRaw ?? [];
  const error = isResolvingPolizas ? undefined : apiError;
  const isLoading = isResolvingPolizas || apiIsLoading;
  const isComboLoading = isLoadingEmpresas || isLoading;

  const rows = useMemo(() => {
    const list = (apiData ?? []) as any[];
    return list.map((item) => ({
      interno: String(item.interno),
      numero: String(item.numero ?? ''),
      NroPoliza: String(item.numero ?? ''),
      CUIT: String(item.cuit ?? ''),
      Empleador_Denominacion: String(item.empleadorDenominacion ?? ''),
      Vigencia_Desde: String(item.vigenciaDesde ?? ''),
      Vigencia_Hasta: String(item.vigenciaHasta ?? ''),
      fecha: String(item.movimientoFecha ?? ''),
    }));
  }, [apiData]);

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

  if (error) {
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
        <p>No se encontraron pólizas.</p>
      </div>
    );
  }

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
        onRowClick={onRowClick}
        selectedRowKeyProp={selectedRowKey}
      />
    </div>
  );
}

function PolizasPage() {
  const { user } = useAuth();
  const rol = String((user as any)?.rol ?? '').toLowerCase();
  const cuil = Number(digits((user as any)?.cuit ?? (user as any)?.CUIL ?? (user as any)?.cuil ?? 0));

  const isAdmin = rol === 'administrador' || rol === 'administradorart';
  const isAdminComercializador = rol === 'administradorcomercializador';
  const isAdministradorART = rol === 'administradorart';
  const isGrupoOrganizador = rol === 'grupoorganizador';
  const isOrganizadorComercializador = rol === 'organizadorcomercializador';
  const isComercializador = rol === 'comercializador';
  const isAdminLevel = isAdmin || isAdminComercializador || isAdministradorART;

  const [grupo, setGrupo] = useState<any>(null);
  const [organizador, setOrganizador] = useState<any>(null);
  const [comercializador, setComercializador] = useState<any>(null);
  const [tab, setTab] = useState(0);
  const [selectedPoliza, setSelectedPoliza] = useState<PolizaRow | null>(null);
  const [modalPoliza, setModalPoliza] = useState<PolizaRow | null>(null);

  const { data: gOrgData } = ArtAPI.useGetGOrganizadorURL(
    isAdminLevel ? ({} as any) : isGrupoOrganizador ? ({ CUIL: cuil } as any) : ({} as any)
  );

  const { data: organizadorMeData } = ArtAPI.useGetOrganizadorURL(
    isOrganizadorComercializador ? ({ CUIL: cuil } as any) : null
  );

  const { data: comercializadorMeData } = ArtAPI.useGetComercializadorURL(
    isComercializador ? ({ CUIL: cuil } as any) : null
  );
  const { data: polizasUsuarioLogueadoData, isLoading: isLoadingPolizasUsuarioLogueado } = ArtAPI.useGetPolizasUsuarioLogueadoURL();


  const comercializadorMe = useMemo(() => (comercializadorMeData?.[0] ?? null) as any, [comercializadorMeData]);
  const organizadorMe = useMemo(() => (organizadorMeData?.[0] ?? null) as any, [organizadorMeData]);

  const comercializadorAsociados = useMemo(() => {
    const list = (comercializadorMe as any)?.comercializadorAsociados;
    return Array.isArray(list) ? list : [];
  }, [comercializadorMe]);

  const grupoAsociado = useMemo(
    () => comercializadorAsociados.find((x: any) => String(x?.tipo ?? '').trim().toUpperCase() === 'GRUPO') ?? null,
    [comercializadorAsociados]
  );

  const organizadorAsociado = useMemo(
    () => comercializadorAsociados.find((x: any) => String(x?.tipo ?? '').trim().toUpperCase() === 'ORGANIZADOR') ?? null,
    [comercializadorAsociados]
  );

 const grupoById = ArtAPI.useGetGOrganizadorById(
   isOrganizadorComercializador && organizadorMe
     ? { id: organizadorMe.srtComercializadorGOrganizadorInterno }
     : undefined
 ).data;

  const grupoFromComercializador = isComercializador
    ? ({
      interno: Number((grupoAsociado as any)?.interno ?? (grupoAsociado as any)?.asociadoId ?? 0),
      descripcion: String((grupoAsociado as any)?.descripcion ?? ''),
    } as any)
    : null;

  const organizadorFromComercializador = isComercializador
    ? ({
      interno: Number((organizadorAsociado as any)?.interno ?? (organizadorAsociado as any)?.asociadoId ?? 0),
      descripcion: String((organizadorAsociado as any)?.descripcion ?? ''),
    } as any)
    : null;

  const grupoValue = isAdminLevel
    ? grupo
    : isGrupoOrganizador
      ? (gOrgData?.[0] ?? null)
      : isComercializador
        ? grupoFromComercializador
        : isOrganizadorComercializador
          ? grupoById
          : null;

  const grupoInterno = Number((grupoValue as any)?.interno ?? 0);

  const organizadorValue = isAdminLevel
    ? organizador
    : isOrganizadorComercializador
      ? organizadorMe
      : isComercializador
        ? organizadorFromComercializador
        : organizador;

  const { data: organizadoresData, isLoading: isLoadingOrganizadores } = ArtAPI.useGetOrganizadorURL(
    grupoValue && !isOrganizadorComercializador && !isComercializador
      ? ({ SRTComercializadorGOrganizadorInterno: grupoInterno || 0 } as any)
      : ({} as any)
  );

  const comercializadorValue = comercializador;

  const organizadoresInternos = useMemo(() => {
    const list = (organizadoresData ?? []) as any[];
    return list
      .map((organizadorItem) => Number((organizadorItem as any)?.interno ?? 0))
      .filter((interno) => Number.isFinite(interno) && interno > 0)
      .map(String)
      .join(',');
  }, [organizadoresData]);

  const organizadorInterno = Number((organizadorValue as any)?.interno ?? 0);
  const comercializadoresParams = organizadorInterno
    ? ({ ComercializadoresOrganizadoresInternos: String(organizadorInterno) } as any)
    : isLoadingOrganizadores
    ? null
    : ({ ComercializadoresOrganizadoresInternos: organizadoresInternos || '0' } as any);

  const { data: comercializadoresData, isLoading: isLoadingComercializadores } = ArtAPI.useGetComercializadorURL(comercializadoresParams);

  const comercializadoresInternos = useMemo(() => {
    const list = (comercializadoresData ?? []) as any[];
    return list.length ? list.map((x) => String(x.interno)).join(',') : undefined;
  }, [comercializadoresData]);

  const comercializadoresUsuarioLogueadoOptions = useMemo(() => {
    const map = new Map<string, any>();
    const addComercializadorOption = (internoValue: unknown, referenteValue: unknown) => {
      const interno = Number(internoValue ?? 0);
      const referenteRazonSocial = String(referenteValue ?? '').trim();
      if (!interno || !referenteRazonSocial) return;
      map.set(String(interno), {
        interno,
        referenteRazonSocial,
      });
    };

    (polizasUsuarioLogueadoData ?? []).forEach((poliza: any) => {
      addComercializadorOption(
        poliza?.srtcomercializadorInterno ?? poliza?.srtComercializadorInterno,
        poliza?.comercializadorReferenteRazonSocial
      );
    });

    (comercializadoresData ?? []).forEach((comercializadorItem: any) => {
      addComercializadorOption(
        comercializadorItem?.interno,
        comercializadorItem?.referenteRazonSocial ?? comercializadorItem?.razonSocial ?? comercializadorItem?.descripcion
      );

      const asociados = Array.isArray(comercializadorItem?.comercializadoresAsociados)
        ? comercializadorItem.comercializadoresAsociados
        : [];

      asociados.forEach((asociado: any) => {
        addComercializadorOption(
          asociado?.interno ?? asociado?.srtComercializadorInterno ?? asociado?.asociadoId,
          asociado?.referenteRazonSocial ?? asociado?.razonSocial ?? asociado?.descripcion
        );
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.referenteRazonSocial).localeCompare(String(b.referenteRazonSocial))
    );
  }, [comercializadoresData, polizasUsuarioLogueadoData]);

  const polizasParams = useMemo(() => {
    const comercializadorInterno = Number((comercializadorValue as any)?.interno ?? 0);
    if (comercializadorInterno) {
      return { ComercializadoresInternos: String(comercializadorInterno), SoloActivas: true } as any;
    }

    if (organizadorValue) {
      if (isLoadingComercializadores) return null;
      return { ComercializadoresInternos: comercializadoresInternos || '0', SoloActivas: true } as any;
    }

    return { SoloActivas: true } as any;
  }, [comercializadorValue, comercializadoresInternos, isLoadingComercializadores, organizadorValue]);

  const groupSelect = (
    <CustomSelectSearch<any>
      options={isAdminLevel ? (gOrgData ?? []) : grupoValue ? [grupoValue] : []}
      getOptionLabel={(x) => String((x as any)?.comercializadorGOrganizadorDescripcion ?? (x as any)?.razonSocial ?? (x as any)?.descripcion ?? '')}
      value={grupoValue ?? null}
      onChange={(_e, v) => {
        setGrupo(v);
        setOrganizador(null);
        setComercializador(null);
      }}
      label="Grupo Organizador"
      disabled={!isAdminLevel}
    />
  );

  const organizadorSelect = (
    <CustomSelectSearch<any>
      options={isAdminLevel || isGrupoOrganizador ? (organizadoresData ?? []) : organizadorValue ? [organizadorValue] : []}
      getOptionLabel={(x) => String((x as any)?.razonSocial ?? (x as any)?.observaciones ?? (x as any)?.descripcion ?? '')}
      value={organizadorValue ?? null}
      onChange={(_e, v) => {
        setOrganizador(v);
        setComercializador(null);
      }}
      label="Organizador"
      disabled={isOrganizadorComercializador || isComercializador || (!grupoValue && !isAdminLevel)}
    />
  );

  const comercializadorSelect = (
    <CustomSelectSearch<any>
      options={comercializadoresUsuarioLogueadoOptions}
      getOptionLabel={(x) => String((x as any)?.referenteRazonSocial ?? '')}
      value={comercializadorValue ?? null}
      onChange={(_e, v) => setComercializador(v)}
      label="Comercializador"
      loading={isLoadingPolizasUsuarioLogueado}
      loadingText="Cargando..."
      disabled={isLoadingPolizasUsuarioLogueado || comercializadoresUsuarioLogueadoOptions.length === 0}
    />
  );

  const emptyMessage =
    (isGrupoOrganizador || isOrganizadorComercializador || isComercializador || !!grupoValue || !!organizadorValue || !!comercializadorValue)
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
              params={polizasParams}
              groupSelect={groupSelect}
              organizadorSelect={organizadorSelect}
              comercializadorSelect={comercializadorSelect}
              emptyMessage={emptyMessage}
              isResolvingPolizas={polizasParams === null}
              onRowClick={setSelectedPoliza}
              selectedRowKey={selectedPoliza?.interno}
                onCambiarComercializador={setModalPoliza}
            />
          ),
        },
        {
          label: "Historial",
          value: 1,
          content: historial,
        },
      ]}
    />
      <FormularioComercializador
        open={!!modalPoliza}
        onClose={() => setModalPoliza(null)}
        empleadorCuit={modalPoliza?.CUIT ?? ""}
        empleadorRazonSocial={modalPoliza?.Empleador_Denominacion ?? ""}
        polizaInterno={modalPoliza ? Number(modalPoliza.interno) : undefined}
      />
    </>
  );
}

export default PolizasPage;