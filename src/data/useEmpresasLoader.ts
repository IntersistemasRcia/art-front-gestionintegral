"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import AuthAPI, { type Empresa } from "./authAPI";
import type { Usuario } from "@/data/usuarioAPI";
import ArtAPI from "./artAPI";
import SrtAPI from "./srtAPI";
import { useEmpresasStore } from "./empresasStore";
import { fetchRolesForEmpresas } from "./useRolesLoader";
import type RolesInterface from "@/app/inicio/usuarios/interfaces/RolesInterface";
import type { SRTPolizaAcotada } from "@/app/inicio/comercializador/polizas/types/poliza";
import {
  VER_TODAS_LAS_EMPRESAS_TASK,
  isAdministradorEmpleadorOrChild,
  isAdministradorTodasEmpresasRole,
  isComercializadorEmpresasRole,
  isComercializadorEmpresasRoleFromSession,
  needsRolesHierarchyForEmpresas,
} from "@/utils/rolesUtils";
import { userHasTask } from "@/utils/userTasksUtils";

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

        if (isAdministradorTodasEmpresasRole(userRole)) {
          setEmpresas(await loadAllEmpresasFromRef());
          hasLoadedRef.current = true;
          return;
        }

        const skipAuthEmpresas = isComercializadorEmpresasRoleFromSession(userRole);

        const rolesPromise = needsRolesHierarchyForEmpresas(userRole)
          ? fetchRolesForEmpresas()
          : Promise.resolve([] as RolesInterface[]);

        const [roles, empresasAuth] = await Promise.all([
          rolesPromise,
          skipAuthEmpresas
            ? Promise.resolve([] as Empresa[])
            : AuthAPI.getEmpresas(
                sessionUser.cuit ? { CUIT: sessionUser.cuit } : {}
              ),
        ]);

        if (isComercializadorEmpresasRole(userRole, roles)) {
          setEmpresas(await loadEmpresasUsuarioLogueado());
          hasLoadedRef.current = true;
          return;
        }

        if (isAdministradorEmpleadorOrChild(userRole, roles)) {
          const resolvedEmpresas = mapAuthEmpresasConNumeroDePoliza(empresasAuth || []);
          setEmpresas(resolvedEmpresas);
          hasLoadedRef.current = true;
          if (resolvedEmpresas.length === 0) {
            const nombreUsuario =
              String(sessionUser.userName ?? "").trim() || "sin nombre";
            setEmptyEmpresasMessage(
              `El Usuario (${nombreUsuario}) no tiene una Empresa relacionada, contacte con su Administrador.`
            );
          }
          return;
        }

        if (
          userHasTask(session?.user as Usuario | undefined, VER_TODAS_LAS_EMPRESAS_TASK)
        ) {
          setEmpresas(await loadAllEmpresasFromRef());
          hasLoadedRef.current = true;
          return;
        }

        setEmpresas(mapAuthEmpresasConNumeroDePoliza(empresasAuth || []));
        hasLoadedRef.current = true;
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

async function loadAllEmpresasFromRef(): Promise<Empresa[]> {
  const empresasRef = await ArtAPI.getRefEmpleadores();
  return mapRefEmpleadoresToEmpresas(empresasRef ?? []);
}

function mapRefEmpleadoresToEmpresas(
  empresasRef: { interno: number; cuit: number; razonSocial?: string; polizaNro?: number }[]
): Empresa[] {
  return empresasRef.map((empresa) =>
    normalizeEmpresaPoliza({
      empresaId: Number(empresa.interno),
      cuit: Number(empresa.cuit),
      razonSocial: String(empresa.razonSocial ?? ""),
      domicilio: "",
      localidad: "",
      provincia: "",
      polizaNro: empresa.polizaNro,
    }),
  );
}

/** Normaliza el número de póliza al campo `numeroDePoliza` cuando la respuesta lo provee. */
function resolveNumeroDePoliza(...candidatos: Array<number | undefined>): number | undefined {
  for (const candidato of candidatos) {
    const numero = Number(candidato);
    if (Number.isFinite(numero) && numero > 0) return numero;
  }
  return undefined;
}

/** Unifica `polizaNro`/`poliza` del API en `numeroDePoliza` del store. */
function normalizeEmpresaPoliza(empresa: Empresa): Empresa {
  return {
    ...empresa,
    numeroDePoliza: resolveNumeroDePoliza(
      empresa.numeroDePoliza,
      empresa.polizaNro,
      empresa.poliza,
    ),
  };
}

function mapAuthEmpresasConNumeroDePoliza(empresas: Empresa[]): Empresa[] {
  return empresas.map(normalizeEmpresaPoliza);
}

function mapPolizasUsuarioLogueadoToEmpresas(
  polizas: SRTPolizaAcotada[]
): Empresa[] {
  const seen = new Set<string>();
  const empresas: Empresa[] = [];

  for (const poliza of polizas) {
    const empresaId =
      Number(poliza.interno) || Number(poliza.refEmpleadorInterno);
    const cuit = Number(poliza.cuit);
    if (!empresaId || !cuit) {
      continue;
    }
    const key = `${empresaId}-${cuit}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    empresas.push(
      normalizeEmpresaPoliza({
        empresaId,
        cuit,
        razonSocial: String(poliza.empleadorDenominacion ?? ""),
        domicilio: "",
        localidad: "",
        provincia: "",
        numeroDePoliza: resolveNumeroDePoliza(Number(poliza.numero)),
      }),
    );
  }

  return empresas;
}

/** Roles comercializador (+ hijos): GET /api/SRTPolizas/UsuarioLogueado sin parámetros. */
async function loadEmpresasUsuarioLogueado(): Promise<Empresa[]> {
  const polizas = await SrtAPI.getPolizasUsuarioLogueado();
  return mapPolizasUsuarioLogueadoToEmpresas(polizas ?? []);
}
