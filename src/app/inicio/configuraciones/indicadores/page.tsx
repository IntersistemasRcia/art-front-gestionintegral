"use client";

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import IndicadorTable from "./IndicadorTable";
import IndicadorForm, { IndicadorFormFields } from "./IndicadorForm";
import styles from "./Indicador.module.css";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModalMessage from "@/utils/ui/message/CustomModalMessage";
import QueriesAPI, { IndicadorGestionDTO } from "@/data/queryAPI";
import { useAuth } from "@/data/AuthContext";

const { useGetIndicadoresGestion, useCreateIndicador, useUpdateIndicador, useDeleteIndicador } = QueriesAPI;

type RequestMethod = "create" | "edit" | "view" | "delete";

interface RequestState {
  method: RequestMethod | null;
  indicadorData: IndicadorFormFields | null;
}

export default function IndicadoresPage() {
  const { hasTask } = useAuth();
  
  // Validar permisos
  if (!hasTask("Configuraciones")) {
    return (
      <Box sx={{ padding: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          No tienes permisos para acceder a esta sección
        </Typography>
      </Box>
    );
  }

  const { data: indicadores, isLoading, error, mutate } = useGetIndicadoresGestion();

  // Debug: Log para verificar los datos
  console.log("Indicadores data:", indicadores);
  console.log("Is loading:", isLoading);
  console.log("Error:", error);
  const { trigger: createIndicador, isMutating: isCreating } = useCreateIndicador();
  const { trigger: updateIndicador, isMutating: isUpdating } = useUpdateIndicador();
  const { trigger: deleteIndicador, isMutating: isDeleting } = useDeleteIndicador();

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [requestState, setRequestState] = useState<RequestState>({
    method: null,
    indicadorData: null,
  });

  const [modalMessage, setModalMessage] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    type: 'info'
  });

  const showModal = requestState.method !== null;

  const showModalMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setModalMessage({
      open: true,
      message,
      type
    });
  };

  const handleClose = () => {
    setModalMessage({
      open: false,
      message: '',
      type: 'info'
    });
  };

  const initialForm: IndicadorFormFields = {
    nombre: "",
    descripcion: "",
    filtroId: 0,
    tablaBase: "",
    rolId: "",
    cargoId: null,
    sectorId: null,
    estado: "Activo",
    link: "",
  };

  const handleOpenModal = (method: RequestMethod, row?: IndicadorGestionDTO) => {
    const dataToForm: IndicadorFormFields = row
      ? {
          id: row.id,
          nombre: row.nombre || "",
          descripcion: row.descripcion || "",
          filtroId: row.filtroId || 0,
          tablaBase: row.tablaBase || "",
          rolId: row.rolId || "",
          cargoId: row.cargoId ?? null,
          sectorId: row.sectorId ?? null,
          estado: row.estado || "Activo",
          link: row.link ?? "",
        }
      : initialForm;

    setRequestState({
      method,
      indicadorData: dataToForm,
    });
    setFormError(null);
  };

  const handleCloseModal = () => {
    setRequestState({ method: null, indicadorData: null });
  };

  const handleToggleEstado = async (row: IndicadorGestionDTO) => {
    setIsSubmitting(true);
    try {
      const nuevoEstado = row.estado === "Activo" ? "Inactivo" : "Activo";
      const updateData = {
        id: row.id,
        nombre: row.nombre,
        descripcion: row.descripcion,
        filtroId: row.filtroId,
        tablaBase: row.tablaBase,
        rolId: row.rolId,
        cargoId: row.cargoId ?? null,
        sectorId: row.sectorId ?? null,
        estado: nuevoEstado as "Activo" | "Inactivo",
        link: row.link ?? "",
      };

      // Usar el método update con el nuevo estado
      await updateIndicador({ id: row.id, data: updateData });
      await mutate();
      showModalMessage(`Indicador ${nuevoEstado === "Activo" ? "activado" : "desactivado"} exitosamente`, "success");
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      showModalMessage("Ocurrió un error al cambiar el estado del indicador", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (data: IndicadorFormFields) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const method = requestState.method;
      let result: { success: boolean; error: string | null } = {
        success: false,
        error: null,
      };

      if (method === "view") {
        handleCloseModal();
        return;
      }

      if (method === "edit") {
        const updateData = {
          id: data.id!,
          nombre: data.nombre,
          descripcion: data.descripcion,
          filtroId: data.filtroId,
          tablaBase: data.tablaBase,
          rolId: data.rolId,
          cargoId: data.cargoId ?? null,
          sectorId: data.sectorId ?? null,
          estado: data.estado,
          link: data.link ?? "",
        };
        try {
          await updateIndicador({ id: data.id!, data: updateData });
          await mutate();
          result = { success: true, error: null };
        } catch (error: any) {
          result = {
            success: false,
            error: error?.message || "Error al actualizar el indicador",
          };
        }
      } else if (method === "create") {
        const createData = {
          nombre: data.nombre,
          descripcion: data.descripcion,
          filtroId: data.filtroId,
          tablaBase: data.tablaBase,
          rolId: data.rolId,
          cargoId: data.cargoId ?? null,
          sectorId: data.sectorId ?? null,
          estado: data.estado,
          link: data.link ?? "",
        };
        try {
          await createIndicador(createData);
          await mutate();
          result = { success: true, error: null };
        } catch (error: any) {
          result = {
            success: false,
            error: error?.message || "Error al crear el indicador",
          };
        }
      }

      if (result.success) {
        const successMessages = {
          create: "Indicador creado exitosamente",
          edit: "Indicador actualizado exitosamente",
          delete: "Indicador eliminado exitosamente",
        };
        showModalMessage(successMessages[method as keyof typeof successMessages] || "Operación completada exitosamente", "success");
        handleCloseModal();
      } else {
        const errorMessage = result.error || `Error al ${method} el indicador.`;
        showModalMessage(errorMessage, "error");
        setFormError(errorMessage);
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      const errorMessage = "Ocurrió un error inesperado al procesar la solicitud";
      showModalMessage(errorMessage, "error");
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Typography variant="h6">Cargando...</Typography>;
  }

  if (error) {
    return (
      <Typography color="error">
        Error:{" "}
        {error instanceof Error
          ? error.message
          : "Un error inesperado ha ocurrido."}
      </Typography>
    );
  }

  const currentInitialData = requestState.indicadorData || initialForm;

  return (
    <Box className={styles.indicadoresPageContainer}>
      <CustomButton
        onClick={() => handleOpenModal("create")}
        style={{ float: "right", marginBottom: "20px" }}
      >
        Crear indicador
      </CustomButton>

      <IndicadorTable
        data={indicadores || []}
        onEdit={(row) => handleOpenModal("edit", row)}
        onView={(row) => handleOpenModal("view", row)}
        onDelete={(row) => handleToggleEstado(row)}
        isLoading={isLoading}
      />

      <IndicadorForm
        open={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={currentInitialData}
        errorMsg={formError}
        method={requestState.method || "create"}
        isSubmitting={isSubmitting || isCreating || isUpdating || isDeleting}
      />

      <CustomModalMessage
        open={modalMessage.open}
        message={modalMessage.message}
        type={modalMessage.type}
        onClose={handleClose}
        title="Atención requerida"
      />
    </Box>
  );
}

