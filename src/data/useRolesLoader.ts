"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import UsuarioAPI from "@/data/usuarioAPI";
import type RolesInterface from "@/app/inicio/usuarios/interfaces/RolesInterface";
import { useRolesStore } from "@/data/rolesStore";

const { useGetRoles } = UsuarioAPI;

export const useRolesLoader = () => {
  const { status } = useSession();
  const { setRoles, setLoading, setError, clearRoles, isLoaded } = useRolesStore();

  const shouldFetch = status === "authenticated" && !isLoaded;
  const { data, error, isLoading } = useGetRoles(shouldFetch ? {} : null);

  useEffect(() => {
    if (status === "unauthenticated") {
      clearRoles();
    }
  }, [status, clearRoles]);

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }

    setLoading(isLoading);

    if (data) {
      setRoles(data);
      return;
    }

    if (error) {
      setError(
        error instanceof Error
          ? error
          : new Error("Error desconocido al cargar roles")
      );
    }
  }, [shouldFetch, data, error, isLoading, setRoles, setLoading, setError]);
};

/** Roles desde el store o fetch directo si empresasLoader los necesita antes que SWR. */
export async function fetchRolesForEmpresas(): Promise<RolesInterface[]> {
  const { isLoaded, roles } = useRolesStore.getState();
  if (isLoaded && roles.length > 0) {
    return roles;
  }

  try {
    const fetched = await UsuarioAPI.getRoles();
    useRolesStore.getState().setRoles(fetched ?? []);
    return fetched ?? [];
  } catch {
    return useRolesStore.getState().roles;
  }
}
