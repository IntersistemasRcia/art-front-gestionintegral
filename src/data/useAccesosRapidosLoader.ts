"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import AuthAPI from "@/data/authAPI";
import type { Usuario } from "@/data/usuarioAPI";
import { useAccesosRapidosStore } from "@/data/accesosRapidosStore";
import { filterAccesosRapidosByRol } from "@/utils/accesosRapidosUtils";

const { useGetParametrosEntidadURL } = AuthAPI;

export const useAccesosRapidosLoader = () => {
  const { data: session, status } = useSession();
  const userRol = (session?.user as Usuario | undefined)?.rol;
  const {
    setAccesosRapidos,
    setLoading,
    setError,
    clearAccesosRapidos,
    isLoaded,
  } = useAccesosRapidosStore();

  const shouldFetch = status === "authenticated" && !isLoaded;
  const { data, error, isLoading } = useGetParametrosEntidadURL(
    shouldFetch
      ? {
          PageIndex: 1,
          PageSize: 1000,
        }
      : null
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      clearAccesosRapidos();
    }
  }, [status, clearAccesosRapidos]);

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }

    setLoading(isLoading);

    if (data) {
      setAccesosRapidos(filterAccesosRapidosByRol(data, userRol));
      return;
    }

    if (error) {
      setError(
        error instanceof Error
          ? error
          : new Error("Error desconocido al cargar accesos rápidos")
      );
    }
  }, [
    shouldFetch,
    data,
    error,
    isLoading,
    userRol,
    setAccesosRapidos,
    setLoading,
    setError,
  ]);
};
