"use client";

import { Box, Typography } from "@mui/material";
import AuthAPI from "@/data/authAPI";
import { useAuth } from "@/data/AuthContext";
import { ParametrosTable } from "./ParametrosTable";
import styles from "./Parametros.module.css";

const { useGetParametrosEntidadURL } = AuthAPI;

const PARAMETROS_TASK = "Configuraciones_Parametros";

export default function ParametrosPage() {
  const { hasTask } = useAuth();
  const canAccess = hasTask(PARAMETROS_TASK);
  const { data, isLoading, error } = useGetParametrosEntidadURL(
    canAccess ? { PageIndex: 1, PageSize: 500 } : null
  );

  if (!canAccess) {
    return (
      <Box sx={{ padding: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          No tienes permisos para acceder a esta sección
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error">
        Error:{" "}
        {error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar los parámetros."}
      </Typography>
    );
  }

  return (
    <Box className={styles.parametrosPageContainer}>
      <ParametrosTable data={data ?? []} isLoading={isLoading} />
    </Box>
  );
}
