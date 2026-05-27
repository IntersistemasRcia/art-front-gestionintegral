"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import AuthAPI, { type Empresa } from "./authAPI";
import ArtAPI from "./artAPI";
import { useEmpresasStore } from "./empresasStore";
import { fetchRolesForEmpresas } from "./useRolesLoader";
import type RolesInterface from "@/app/inicio/usuarios/interfaces/RolesInterface";
import type { SRTPolizaAcotada } from "@/app/inicio/comercializador/polizas/types/poliza";
import {
  ADMINISTRADOR_COMERCIALIZADOR_ROLE,
  isAdministradorComercializadorOrChild,
  isAdministradorEmpleadorOrChild,
  isComercializadorEmpresasRole,
  isComercializadorEmpresasRoleFromSession,
  isComercializadorRole,
  isExactRole,
  isGrupoOrganizadorRole,
  isOrganizadorComercializadorRole,
  needsRolesHierarchyForEmpresas,
} from "@/utils/rolesUtils";

type SessionUser = {
  rol?: string;
  cuit?: number;
  userName?: string;
};

export const useEmpresasLoader = () => {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const {
    setEmpresas,
    setLoading,
    setError,
    setEmptyEmpresasMessage,
    clearEmpresas,
  } = useEmpresasStore();
  const hasLoadedRef = useRef(false);
  const loadStartedRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      clearEmpresas();
      hasLoadedRef.current = false;
      loadStartedRef.current = false;
      return;
    }

    if (
      status !== "authenticated" ||
      !accessToken ||
      hasLoadedRef.current ||
      loadStartedRef.current
    ) {
      return;
    }

    loadStartedRef.current = true;
    setLoading(true);
    setError(null);
    setEmptyEmpresasMessage(null);

    const loadEmpresas = async () => {
      try {
        const sessionUser = (session?.user ?? {}) as SessionUser;
        const userRole = String(sessionUser.rol ?? "");
        const isAdministrador = userRole.toLowerCase() === "administrador";

        if (isAdministrador) {
          const empresasRef = await ArtAPI.getRefEmpleadores();
          setEmpresas(mapRefEmpleadoresToEmpresas(empresasRef ?? []));
          hasLoadedRef.current = true;
          return;
        }

        if (isComercializadorEmpresasRoleFromSession(userRole)) {
          setEmpresas(
            await loadEmpresasComercializador(userRole, sessionUser.cuit, [])
          );
          hasLoadedRef.current = true;
          return;
        }

        const rolesPromise = needsRolesHierarchyForEmpresas(userRole)
          ? fetchRolesForEmpresas()
          : Promise.resolve([] as RolesInterface[]);

        const [roles, empresasAuth] = await Promise.all([
          rolesPromise,
          AuthAPI.getEmpresas(sessionUser.cuit ? { CUIT: sessionUser.cuit } : {}),
        ]);

        if (isComercializadorEmpresasRole(userRole, roles)) {
          setEmpresas(
            await loadEmpresasComercializador(userRole, sessionUser.cuit, roles)
          );
          hasLoadedRef.current = true;
          return;
        }

        const resolvedEmpresas = empresasAuth || [];
        setEmpresas(resolvedEmpresas);
        hasLoadedRef.current = true;

        if (
          resolvedEmpresas.length === 0 &&
          isAdministradorEmpleadorOrChild(userRole, roles)
        ) {
          const nombreUsuario =
            String(sessionUser.userName ?? "").trim() || "sin nombre";
          setEmptyEmpresasMessage(
            `El Usuario (${nombreUsuario}) no tiene una Empresa relacionada, contacte con su Administrador.`
          );
        }
      } catch (error) {
        console.error("Error al cargar empresas:", error);
        setError(
          error instanceof Error
            ? error
            : new Error("Error desconocido al cargar empresas")
        );
        hasLoadedRef.current = false;
        loadStartedRef.current = false;
      } finally {
        setLoading(false);
      }
    };

    void loadEmpresas();
  }, [
    status,
    accessToken,
    session?.user,
    setEmpresas,
    setLoading,
    setError,
    setEmptyEmpresasMessage,
    clearEmpresas,
  ]);
};

function mapRefEmpleadoresToEmpresas(
  empresasRef: { interno: number; cuit: number; razonSocial?: string }[]
): Empresa[] {
  return empresasRef.map((empresa) => ({
    empresaId: Number(empresa.interno),
    cuit: Number(empresa.cuit),
    razonSocial: String(empresa.razonSocial ?? ""),
    domicilio: "",
    localidad: "",
    provincia: "",
  }));
}

function digits(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

function mapPolizasAcotadasToEmpresas(polizas: SRTPolizaAcotada[]): Empresa[] {
  const seen = new Set<string>();
  const empresas: Empresa[] = [];

  for (const poliza of polizas) {
    const empresaId = Number(poliza.interno);
    const cuit = Number(poliza.cuit);
    if (!empresaId || !cuit) {
      continue;
    }
    const key = `${empresaId}-${cuit}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    empresas.push({
      empresaId,
      cuit,
      razonSocial: String(poliza.empleadorDenominacion ?? ""),
      domicilio: "",
      localidad: "",
      provincia: "",
    });
  }

  return empresas;
}

async function fetchEmpresasFromPolizasAcotado(
  comercializadoresInternos?: number[]
): Promise<Empresa[]> {
  const valid = (comercializadoresInternos ?? []).filter(
    (id) => Number.isFinite(id) && id > 0
  );
  const params =
    valid.length > 0
      ? { ComercializadoresInternos: valid.map(String).join(",") }
      : {};

  const polizas = await ArtAPI.getPolizasAcotado(params);
  return mapPolizasAcotadasToEmpresas(polizas ?? []);
}

async function loadEmpresasComercializador(
  userRole: string,
  userCuit: number | undefined,
  roles: RolesInterface[]
): Promise<Empresa[]> {
  if (
    isExactRole(userRole, ADMINISTRADOR_COMERCIALIZADOR_ROLE) ||
    isAdministradorComercializadorOrChild(userRole, roles)
  ) {
    return fetchEmpresasFromPolizasAcotado();
  }

  const cuil = Number(digits(userCuit));
  if (!cuil) {
    return [];
  }

  if (isComercializadorRole(userRole)) {
    const comercializadores = await ArtAPI.getComercializador({ CUIL: cuil });
    const internos = (comercializadores ?? [])
      .map((item) => Number((item as { interno?: number }).interno))
      .filter((id) => id > 0);
    return fetchEmpresasFromPolizasAcotado(internos);
  }

  if (isOrganizadorComercializadorRole(userRole) || isGrupoOrganizadorRole(userRole)) {
    const asociados = await ArtAPI.getComercializadoresAsociados({ CUIL: cuil });
    const internos = (asociados ?? [])
      .map((item) => Number(item.srtComercializadorInterno))
      .filter((id) => id > 0);
    return fetchEmpresasFromPolizasAcotado(internos);
  }

  return [];
}
