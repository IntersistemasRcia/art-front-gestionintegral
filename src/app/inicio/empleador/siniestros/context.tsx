"use client";

import React, { createContext, type ReactNode, useContext, useMemo } from "react";
import useSWR from "swr";
import QueriesAPI, { type Query, type QueryResultData, type QueryResult } from "@/data/queryAPI";
import { token } from "@/data/usuarioAPI";
import type { SiniestroItem } from "./types/tipos";

const TABLE_NAME = "vSiniestrosEmpleador" as const;

/** Columnas de vSiniestrosEmpleador (denunciaNro solo para fetch tabla hija, no se muestra en tabla padre) */
const SELECT_COLUMNS = [
  "denunciaNro",
  "empCUIT",
  "trabCUIL",
  "trabNombre",
  "establecimiento",
  "siniestroNro",
  "tipoSiniestro",
  "siniestroFechaHora",
  "diagnostico",
  "siniestroCategoria",
  "proximoControlMedicoFechaHora",
  "prestador",
  "altaMedicaFecha",
] as const;

type Row = QueryResultData;

const trim = (v: unknown): string => String(v ?? "").trim();
const normalizeDigits = (value: unknown): string => String(value ?? "").replace(/\D/g, "");
const toNumOrStr = (v: unknown): number | string => {
  if (v == null || v === "") return "";
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(v);
  return !Number.isNaN(n) ? n : String(v);
};
const strOrNull = (v: unknown): string | null => (v != null && v !== "" ? trim(v) : null);

function mapRowToSiniestroItem(row: Row): SiniestroItem {
  const siniestroNroRaw = row?.siniestroNro ?? row?.Siniestro ?? row?.siniestro ?? "";
  const denunciaNro = Number(row?.denunciaNro ?? row?.Denuncia ?? siniestroNroRaw ?? 0) || 0;
  const empCuitRaw =
    row?.empCUIT ??
    row?.empCuit ??
    row?.EmpCUIT ??
    row?.EmpCuit ??
    row?.CUIT ??
    row?.Cuit ??
    row?.cuit ??
    "";
  const empCuitDigits = normalizeDigits(empCuitRaw);
  const empCuitValue: number | string = empCuitDigits !== ""
    ? Number(empCuitDigits)
    : toNumOrStr(empCuitRaw);
  return {
    denunciaNro,
    siniestroNro: toNumOrStr(siniestroNroRaw) || "",
    empCUIT: empCuitValue,
    trabCUIL: row?.trabCUIL ?? row?.Cuil ?? row?.cuil ?? "",
    trabNombre: trim(row?.trabNombre ?? row?.ApellidoNombre ?? row?.apellidoNombre),
    establecimiento: trim(row?.establecimiento ?? row?.Establecimiento),
    tipoSiniestro: trim(row?.tipoSiniestro ?? row?.Tipo ?? row?.tipo),
    siniestroFechaHora: strOrNull(row?.siniestroFechaHora ?? row?.FechaOcurrencia ?? row?.fechaOcurrencia),
    diagnostico: strOrNull(row?.diagnostico ?? row?.Diagnostico ?? row?.CIE10 ?? row?.cie10),
    siniestroCategoria: strOrNull(row?.siniestroCategoria ?? row?.Categoria ?? row?.categoria),
    proximoControlMedicoFechaHora: strOrNull(row?.proximoControlMedicoFechaHora ?? row?.ProximoControlMedicoFechaHora),
    prestador: strOrNull(row?.prestador ?? row?.PrestadorInicial ?? row?.prestadorInicial),
    altaMedicaFecha: strOrNull(row?.altaMedicaFecha ?? row?.FechaAltaMedica ?? row?.fechaAltaMedica),
  };
}

function buildQuery(params: {
  cuit?: number;
  cuits?: number[];
  isAdmin?: boolean;
  proposition?: string | null;
}): Query {
  const { cuit, cuits, isAdmin, proposition } = params;
  const cuitList = Array.isArray(cuits) ? Array.from(new Set(cuits.filter((v) => Number.isFinite(v) && v > 0))) : [];
  const baseWhere = (() => {
    if (cuit != null && cuit > 0) return `eq(empCUIT,${cuit})`;
    if (cuitList.length === 0) return isAdmin ? "" : "";
    if (cuitList.length === 1) return `eq(empCUIT,${cuitList[0]})`;
    return `or(${cuitList.map((value) => `eq(empCUIT,${value})`).join(",")})`;
  })();
  const propositionWhere = proposition?.trim() ?? "";
  const where = baseWhere && propositionWhere
    ? `and(${baseWhere},${propositionWhere})`
    : baseWhere || propositionWhere || undefined;
  return {
    select: SELECT_COLUMNS.map((name) => ({ value: name, name })),
    from: [{ table: TABLE_NAME }],
    where,
    order: { by: ["siniestroNro"] },
  };
}

type EmpleadorSiniestrosContextType = {
  rows: SiniestroItem[];
  isLoading: boolean;
  error: Error | null;
  count: number | null;
  /** Razón social del empleador (desde la primera fila del query), para uso cuando viene CUIT por URL */
  razonSocialFromQuery: string | null;
};

const EmpleadorSiniestrosContext = createContext<EmpleadorSiniestrosContextType | undefined>(undefined);

type Props = {
  children: ReactNode;
  cuit: number | undefined;
  cuits?: number[];
  isAdmin?: boolean;
  proposition?: string | null;
};

export function EmpleadorSiniestrosContextProvider({ children, cuit, cuits, isAdmin, proposition }: Props) {
  const query = useMemo(
    () => {
      if (cuit != null && cuit > 0) return buildQuery({ cuit, proposition });
      if (Array.isArray(cuits) && cuits.length > 0) return buildQuery({ cuits, isAdmin, proposition });
      if (isAdmin) return buildQuery({ isAdmin, proposition });
      return null;
    },
    [cuit, cuits, isAdmin, proposition]
  );

  const executeKey = query != null ? [QueriesAPI.executeURL, token.getToken(), JSON.stringify(query)] as const : null;
  const executeFetcher = (key: typeof executeKey) => {
    if (!key || key.length < 3) return Promise.reject(new Error("Invalid key"));
    const queryStr = String(key[2]);
    return QueriesAPI.execute<Row>(JSON.parse(queryStr));
  };
  const { data: executeData, error: executeError, isLoading: isLoadingExecute } = useSWR<QueryResult<Row>>(
    executeKey,
    executeFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const analyzeKey = query != null ? [QueriesAPI.analyzeURL, token.getToken(), JSON.stringify(query)] as const : null;
  const analyzeFetcher = (key: typeof analyzeKey) => {
    if (!key || key.length < 3) return Promise.reject(new Error("Invalid key"));
    return QueriesAPI.analyze(JSON.parse(String(key[2])));
  };
  const { data: analyzeData } = useSWR(
    analyzeKey,
    analyzeFetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const value = useMemo<EmpleadorSiniestrosContextType>(() => {
    const data = executeData?.data;
    const rows: SiniestroItem[] = Array.isArray(data) ? data.map(mapRowToSiniestroItem) : [];
    const firstRow = Array.isArray(data) && data.length > 0 ? data[0] : null;
    const razonSocialFromQuery = firstRow
      ? String(firstRow?.RazonSocial ?? firstRow?.razonSocial ?? "").trim() || null
      : null;
    return {
      rows,
      isLoading: query != null ? isLoadingExecute : false,
      error: executeError ?? null,
      count: analyzeData?.count ?? null,
      razonSocialFromQuery,
    };
  }, [executeData?.data, isLoadingExecute, executeError, analyzeData?.count, query]);

  return (
    <EmpleadorSiniestrosContext.Provider value={value}>
      {children}
    </EmpleadorSiniestrosContext.Provider>
  );
}

export function useEmpleadorSiniestrosContext() {
  const context = useContext(EmpleadorSiniestrosContext);
  if (context === undefined) {
    throw new Error("useEmpleadorSiniestrosContext must be used within EmpleadorSiniestrosContextProvider");
  }
  return context;
}
