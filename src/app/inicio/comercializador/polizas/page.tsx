"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from '@/data/AuthContext';
import DataTable from '@/utils/ui/table/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import ArtAPI from '@/data/artAPI';
import Formato from '@/utils/Formato';
import styles from './poliza.module.css';
import CustomSelectSearch from "@/utils/ui/form/CustomSelectSearch";
import { BsFileText, BsCardChecklist, BsGraphUpArrow, BsCalendar2Plus } from 'react-icons/bs';
import Link from 'next/link';
import type { Poliza, EmpresaOption } from "./types/poliza";

const columns: ColumnDef<Poliza>[] = [
  { accessorKey: 'numero', header: 'Nro. Poliza', meta: { align: 'left' } },
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


        </div>
      );
    },
    enableHiding: true,
  },
];

function digits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

function PolizasListado({ params, groupSelect, organizadorSelect, comercializadorSelect, emptyMessage, forceEmpty, }: { params: any; groupSelect?: React.ReactNode; organizadorSelect?: React.ReactNode; comercializadorSelect?: React.ReactNode; emptyMessage?: string; forceEmpty?: boolean; }) {
  const { data: apiDataRaw, error: apiError, isLoading: apiIsLoading } = ArtAPI.useGetPolizaComercializadorURL(params);

  const apiData = forceEmpty ? [] : (apiDataRaw ?? []);
  const error = forceEmpty ? undefined : apiError;
  const isLoading = forceEmpty ? false : apiIsLoading;

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

  const empresas = useMemo(() => {
    const map = new Map<string, EmpresaOption>();
    for (const r of rows) {
      const razon = String(r?.Empleador_Denominacion ?? '').trim();
      const cuit = digits(r?.CUIT);
      const key = cuit || razon.toLowerCase();
      if (!key) continue;
      if (!map.has(key)) map.set(key, { razonSocial: razon || cuit, cuit: cuit || undefined });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.razonSocial.localeCompare(b.razonSocial, 'es', { sensitivity: 'base' })
    );
  }, [rows]);

  const [empresa, setEmpresa] = useState<EmpresaOption | null>(null);

  const filteredRows = useMemo(() => {
    if (!empresa) return rows;
    if (empresa.cuit) return rows.filter((r) => digits(r?.CUIT) === empresa.cuit);
    const rs = empresa.razonSocial.trim().toLowerCase();
    return rows.filter((r) => String(r?.Empleador_Denominacion ?? '').trim().toLowerCase() === rs);
  }, [rows, empresa]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.topRow}>
          <div className={styles.selectItem}>
            <CustomSelectSearch<EmpresaOption>
              options={empresas}
              getOptionLabel={(e) => String(e?.razonSocial ?? '')}
              value={empresa}
              onChange={(_event, newValue) => {
                setEmpresa(newValue);
              }}
              label="Empresa"
              placeholder="Filtrar por razón social..."
              loading={isLoading}
              loadingText="Cargando..."
              noOptionsText={isLoading ? "Cargando..." : "No se encontraron empresas"}
              disabled={isLoading || empresas.length === 0}
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
          <CustomSelectSearch<EmpresaOption>
            options={empresas}
            getOptionLabel={(e) => String(e?.razonSocial ?? '')}
            value={empresa}
            onChange={(_event, newValue) => {
              setEmpresa(newValue);
            }}
            label="Empresa"
            placeholder="Filtrar por razón social..."
            loading={isLoading}
            loadingText="Cargando..."
            noOptionsText={isLoading ? "Cargando..." : "No se encontraron empresas"}
            disabled={isLoading || empresas.length === 0}
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
      />
    </div>
  );
}

function PolizasPage() {
  const { user } = useAuth();
  const rol = String((user as any)?.rol ?? '').toLowerCase();
  const cuil = Number(digits((user as any)?.cuit ?? (user as any)?.CUIL ?? (user as any)?.cuil ?? 0));

  const isAdmin = rol === 'administrador';
  const isGrupoOrganizador = rol === 'grupoorganizador';
  const isOrganizadorComercializador = rol === 'organizadorcomercializador';
  const isComercializador = rol === 'comercializador';

  const [grupo, setGrupo] = useState<any>(null);
  const [organizador, setOrganizador] = useState<any>(null);
  const [comercializador, setComercializador] = useState<any>(null);

  const { data: gOrgData } = ArtAPI.useGetGOrganizadorURL(
    isAdmin ? ({} as any) : isGrupoOrganizador ? ({ CUIL: cuil } as any) : ({} as any)
  );

  const { data: organizadorMeData } = ArtAPI.useGetOrganizadorURL(
    isOrganizadorComercializador ? ({ CUIL: cuil } as any) : ({} as any)
  );

  const { data: comercializadorMeData } = ArtAPI.useGetComercializadorURL(
    isComercializador ? ({ CUIL: cuil } as any) : ({} as any)
  );


  const comercializadorMe = useMemo(() => (comercializadorMeData?.[0] ?? null) as any, [comercializadorMeData]);
  const organizadorMe = useMemo(() => (organizadorMeData?.[0] ?? null) as any, [organizadorMeData]);

 const grupoById = ArtAPI.useGetGOrganizadorById(
   isOrganizadorComercializador && organizadorMe
     ? { id: organizadorMe.srtComercializadorGOrganizadorInterno }
     : undefined
 ).data;

  const grupoFromComercializador = isComercializador
    ? ({
      interno: Number((comercializadorMe as any)?.srtComercializadorGOrganizadorInterno ?? 0),
      descripcion: String((comercializadorMe as any)?.comercializadorGOrganizadorDescripcion ?? ''),
    } as any)
    : null;

  const organizadorFromComercializador = isComercializador
    ? ({
      interno: Number((comercializadorMe as any)?.srtComercializadorOrganizadorInterno ?? 0),
      descripcion: String((comercializadorMe as any)?.comercializadorOrganizadorDescripcion ?? ''),
    } as any)
    : null;

  const grupoValue = isAdmin
    ? grupo
    : isGrupoOrganizador
      ? (gOrgData?.[0] ?? null)
      : isComercializador
        ? grupoFromComercializador
        : isOrganizadorComercializador
          ? grupoById
          : null;

  const grupoInterno = Number((grupoValue as any)?.interno ?? 0);

  const organizadorValue = isAdmin
    ? organizador
    : isOrganizadorComercializador
      ? organizadorMe
      : isComercializador
        ? organizadorFromComercializador
        : organizador;

  const { data: organizadoresData } = ArtAPI.useGetOrganizadorURL(
    grupoValue && !isOrganizadorComercializador && !isComercializador
      ? ({ SRTComercializadorGOrganizadorInterno: grupoInterno || 0 } as any)
      : ({} as any)
  );

const organizadoresInternos = useMemo(() => {
  const list = (organizadoresData ?? []) as any[];
  return list.length ? list.map((x) => String(x.interno)).join(',') : undefined;
}, [organizadoresData]);
  const { data: comercializadoresData, isLoading: comercializadoresLoading } = ArtAPI.useGetComercializadorURL(
    isComercializador
      ? ({ CUIL: cuil } as any)
      : (organizadorValue
        ? ({ ComercializadoresOrganizadoresInternos: String((organizadorValue as any)?.interno ?? 0) } as any)
        : (grupoValue
          ? ({ ComercializadoresOrganizadoresInternos: organizadoresInternos || '0' } as any)
          : ({} as any)))
  );

 const comercializadoresInternos = useMemo(() => {
   const list = (comercializadoresData ?? []) as any[];
   return list.length ? list.map((x) => String(x.interno)).join(',') : undefined;
 }, [comercializadoresData]);
  
  
  const comercializadorValue = isComercializador ? comercializadorMe : comercializador;

  const hasAnyFiltro =
    isGrupoOrganizador ||
    isOrganizadorComercializador ||
    isComercializador ||
    !!grupoValue ||
    !!organizadorValue ||
    !!comercializadorValue;

  const forceEmpty = hasAnyFiltro && !comercializadoresLoading && !comercializadoresInternos;

  const params = useMemo(() => {
    const interno = Number((comercializadorValue as any)?.interno ?? 0);
    if (interno) return { ComercializadoresInternos: String(interno) } as any;
    const hasFiltro =
      isGrupoOrganizador ||
      isOrganizadorComercializador ||
      isComercializador ||
      !!grupoValue ||
      !!organizadorValue ||
      !!comercializadorValue;
    if (hasFiltro && !comercializadoresInternos) return { ComercializadoresInternos: '0' } as any;
    return comercializadoresInternos ? ({ ComercializadoresInternos: comercializadoresInternos } as any) : ({} as any);
  }, [
    comercializadorValue,
    comercializadoresInternos,
    grupoValue,
    organizadorValue,
    isGrupoOrganizador,
    isOrganizadorComercializador,
    isComercializador,
  ]);

  const groupSelect = (
    <CustomSelectSearch<any>
      options={isAdmin ? (gOrgData ?? []) : grupoValue ? [grupoValue] : []}
      getOptionLabel={(x) => String((x as any)?.comercializadorGOrganizadorDescripcion ?? (x as any)?.razonSocial ?? (x as any)?.descripcion ?? '')}
      value={grupoValue ?? null}
      onChange={(_e, v) => {
        setGrupo(v);
        setOrganizador(null);
        setComercializador(null);
      }}
      label="Grupo Organizador"
      disabled={!isAdmin}
    />
  );

  const organizadorSelect = (
    <CustomSelectSearch<any>
      options={isAdmin || isGrupoOrganizador ? (organizadoresData ?? []) : organizadorValue ? [organizadorValue] : []}
      getOptionLabel={(x) => String((x as any)?.razonSocial ?? (x as any)?.descripcion ?? '')}
      value={organizadorValue ?? null}
      onChange={(_e, v) => {
        setOrganizador(v);
        setComercializador(null);
      }}
      label="Organizador"
      disabled={isOrganizadorComercializador || isComercializador || (!grupoValue && !isAdmin)}
    />
  );

  const comercializadorSelect = (
    <CustomSelectSearch<any>
      options={isComercializador ? (comercializadorValue ? [comercializadorValue] : []) : (comercializadoresData ?? [])}

      getOptionLabel={(x) =>
        isComercializador
          ? String((x as any)?.referenteRazonSocial ?? '')
          : String((x as any)?.referenteRazonSocial ?? (x as any)?.razonSocial ?? (x as any)?.descripcion ?? '')
      }
      value={comercializadorValue ?? null}
      onChange={(_e, v) => setComercializador(v)}
      label="Comercializador"
      disabled={isComercializador || ((!grupoValue && !isOrganizadorComercializador) && !isAdmin)}
    />
  );

  const emptyMessage =
    (isGrupoOrganizador || isOrganizadorComercializador || isComercializador || !!grupoValue || !!organizadorValue || !!comercializadorValue)
      ? 'No hay pólizas para el filtro seleccionado.'
      : undefined;

  return <PolizasListado params={params} groupSelect={groupSelect} organizadorSelect={organizadorSelect} comercializadorSelect={comercializadorSelect} emptyMessage={emptyMessage} forceEmpty={forceEmpty} />;
}

export default PolizasPage;