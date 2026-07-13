"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import AuthAPI from "@/data/authAPI";
import { useParametrosEntidadesStore } from "@/data/ParametrosEntidadesStore";

const { useGetParametrosEntidadURL } = AuthAPI;

export const useParametrosEntidadesLoader = () => {
  const { status } = useSession();
  const {
    setParametrosEntidades,
    setLoading,
    setError,
    clearParametrosEntidades,
    isLoaded,
  } = useParametrosEntidadesStore();

  const shouldFetch = status === "authenticated" && !isLoaded;

  // Mismos parámetros que useAccesosRapidosLoader para que SWR deduplique el request.
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
      clearParametrosEntidades();
    }
  }, [status, clearParametrosEntidades]);

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }

    setLoading(isLoading);

    if (data) {
      setParametrosEntidades(data);
      return;
    }

    if (error) {
      setError(
        error instanceof Error
          ? error
          : new Error("Error desconocido al cargar parámetros de entidades")
      );
    }
  }, [
    shouldFetch,
    data,
    error,
    isLoading,
    setParametrosEntidades,
    setLoading,
    setError,
  ]);
};
