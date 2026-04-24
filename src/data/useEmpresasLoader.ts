"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import AuthAPI from "./authAPI";
import ArtAPI from "./artAPI";
import { useEmpresasStore } from "./empresasStore";

export const useEmpresasLoader = () => {
  const { data: session, status } = useSession();
  const { setEmpresas, setLoading, setError, empresas, isLoading, clearEmpresas } =
    useEmpresasStore();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Limpiar empresas cuando el usuario cierra sesión
    if (status === "unauthenticated") {
      clearEmpresas();
      hasLoadedRef.current = false;
      return;
    }

    // Solo cargar si el usuario está autenticado, hay sesión, no hay empresas cargadas y no se está cargando
    if (
      status === "authenticated" &&
      session?.accessToken &&
      empresas.length === 0 &&
      !isLoading &&
      !hasLoadedRef.current
    ) {
      hasLoadedRef.current = true;
      
      const loadEmpresas = async () => {
        try {
          setLoading(true);
          setError(null);

          const userRole = String((session.user as any)?.rol ?? "").toLowerCase();
          const isAdministrador = userRole === "administrador";

          if (isAdministrador) {
            // Para Administrador, cargar TODAS las empresas desde /api/Empresas.
            const empresasRef = await ArtAPI.getRefEmpleadores();
            const empresasData = (empresasRef ?? []).map((empresa) => ({
              empresaId: Number(empresa.interno),
              cuit: Number(empresa.cuit),
              razonSocial: String(empresa.razonSocial ?? ""),
              domicilio: "",
              localidad: "",
              provincia: "",
            }));
            setEmpresas(empresasData);
            return;
          }

          // Para el resto de roles, mantener filtro por CUIT del usuario.
          const userCuit = (session.user as any)?.cuit;
          const empresasData = await AuthAPI.getEmpresas(
            userCuit ? { CUIT: userCuit } : {}
          );
          setEmpresas(empresasData || []);
        } catch (error) {
          console.error("Error al cargar empresas:", error);
          setError(
            error instanceof Error
              ? error
              : new Error("Error desconocido al cargar empresas")
          );
          hasLoadedRef.current = false; // Permitir reintento en caso de error
        } finally {
          setLoading(false);
        }
      };

      loadEmpresas();
    }
  }, [
    status,
    session,
    empresas.length,
    isLoading,
    setEmpresas,
    setLoading,
    setError,
    clearEmpresas,
  ]);
};

