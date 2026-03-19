"use client";

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import UsuarioForm, { UsuarioFormFields } from "./UsuarioForm";
import UsuarioTable from "./UsuarioTable";
import EmpresaTable from "./EmpresaTable";
import Tareas from "./Tareas";
import useUsuarios from "./useUsuarios";
import styles from "./Usuario.module.css";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModalMessage from "@/utils/ui/message/CustomModalMessage";
import UsuarioRow from "./interfaces/UsuarioRow";
import { useAuth } from "@/data/AuthContext";
import IUsuarioDarDeBajaReactivar from "./interfaces/IUsuarioDarDeBajaReactivar";
import CustomTabs from "@/utils/ui/tab/CustomTab";

type RequestMethod =
  | "create"
  | "edit"
  | "view"
  | "delete"
  | "activate"
  | "remove";

interface RequestState {
  method: RequestMethod | null;
  userData: UsuarioFormFields | null;
}

interface PermisosModulo {
  moduloId: number;
  moduloDescripcion: string;
  habilitado: boolean;
  tareas: {
    tareaId: number;
    moduloId: number;
    habilitada: boolean;
  }[];
}

export default function UsuariosPage() {
  const { user, hasTask } = useAuth();
  const canConfigEmpresa = hasTask("Usuarios_EmpresaConfiguracion");
  
  // Determinar si el usuario es administrador
  const isAdmin = user?.rol?.toLowerCase() === "administrador";

  const initialForm: UsuarioFormFields = {
    cuit: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: "",
    // tipo: "",
    phoneNumber: "",
    nombre: "",
    userName: "",
    titulo: "",
    matricula: "",
    maxUsuarios: 0,
    // Usamos el `|| 1` como valor por defecto, aunque es mejor que el backend lo maneje si no existe
    empresaId: user?.empresaId || 0, 
    cargoId: undefined,
    sectorId: undefined,
  };

  const {
    usuarios,
    roles,
    cargos,
    refEmpleadores,
    loading,
    error,
    registrarUsuario,
    actualizarPermisosUsuario,
    usuarioUpdate,
    usuarioDarDeBaja,
    usuarioReactivar,
    usuarioReestablecer,
    usuarioReenviarCorreo
  } = useUsuarios();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [requestState, setRequestState] = useState<RequestState>({
    method: null,
    userData: null,
  });
  const [currentTab, setCurrentTab] = useState<number>(0);

  useEffect(() => {
    if (!canConfigEmpresa && currentTab === 1) {
      setCurrentTab(0);
    }
  }, [canConfigEmpresa, currentTab]);

  const [permisosModal, setPermisosModal] = useState<{
    open: boolean;
    usuario: UsuarioRow | null;
  }>({
    open: false,
    usuario: null,
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

  // Determina si el modal debe estar visible
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

  const handleOpenModal = (method: RequestMethod, row?: UsuarioRow) => {
    // CORRECCIÓN 2: Mapeamos la fila (UsuarioRow) a datos del formulario (UsuarioFormFields)
    const sectorIdFromRow = row?.sectorId ?? (row as UsuarioRow & { SectorId?: number | string } | undefined)?.SectorId;
    const resolvedSectorId =
      sectorIdFromRow !== undefined && sectorIdFromRow !== null && sectorIdFromRow !== ""
        ? Number(sectorIdFromRow)
        : undefined;

    const dataToForm: UsuarioFormFields = row
      ? {
          cuit: row.cuit || "",
          email: row.email || "",
          // La contraseña y su confirmación deben ir vacías SIEMPRE en edición
          password: method === "edit" ? "" : "",
          confirmPassword: method === "edit" ? "" : "",
          rol: row.rol || "",
          phoneNumber: row.phoneNumber || "",
          nombre: row.nombre || "",
          cargoId: row.cargoId || 1,
          userName: row.userName || "",
          titulo: row.titulo || "",
          matricula: row.matricula || "",
          // Limpiar cargo si está vacío, es null, undefined, o contiene valores no deseados
          // cargo: (row.cargo && row.cargo.trim() !== "" && row.cargo !== "null" && row.cargo !== "undefined") ? row.cargo : "",
          // Mantenemos la empresaId de la fila o del usuario actual
          empresaId: row.empresaId || user?.empresaId || 0, 
          sectorId: resolvedSectorId,
          // Es crucial incluir el ID de usuario para edición/eliminación
          id: String(row.id), // <-- Aseguramos que el ID se convierte a string para el formulario
        }
      : initialForm;

    setRequestState({
      method,
      userData: dataToForm,
    });
    setFormError(null);
  };

  const handleCloseModal = () => {
    setRequestState({ method: null, userData: null });
  };

  const handleOpenPermisos = (usuario: UsuarioRow) => {
    setPermisosModal({
      open: true,
      usuario,
    });
  };

  const handleClosePermisos = () => {
    setPermisosModal({
      open: false,
      usuario: null,
    });
  };

  const handleSavePermisos = async (permisos: PermisosModulo[]) => {
    if (!permisosModal.usuario?.id) {
      showModalMessage("Error: No se pudo identificar el usuario", "error");
      return;
    }

    try {
      const result = await actualizarPermisosUsuario(
        String(permisosModal.usuario.id),
        permisos
      );

      if (result.success) {
        showModalMessage("Permisos guardados exitosamente", "success");
        handleClosePermisos();
      } else {
        showModalMessage(`Error al guardar permisos: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Error al guardar permisos:", error);
      showModalMessage("Ocurrió un error al guardar los permisos", "error");
    }
  };

  const handleReestablecer = async (row: UsuarioRow): Promise<void> => {
    try {
      const result = await usuarioReestablecer(String(row.email));
      if (result.success) {
        showModalMessage(
          "Se envió el correo para reestablecer la contraseña del usuario.",
          "success"
        );
      } else {
        showModalMessage(`Error al reestablecer usuario: ${result.error}`, "error");
      }
    } catch (error) {
      showModalMessage("Ocurrió un error al reestablecer el usuario", "error");
    }
  };

  const handleReenviarCorreo = async (row: UsuarioRow): Promise<void> => {
    try {
      const result = await usuarioReenviarCorreo(String(row.email));
      if (result.success) {
        showModalMessage("Se reenviaron las instrucciones al correo del usuario.", "success");
      } else {
        showModalMessage(`Error al reenviar correo: ${result.error}`, "error");
      }
    } catch (error) {
      showModalMessage("Ocurrió un error al reenviar el correo", "error");
    }
  };

const handleSubmit = async (data: UsuarioFormFields) => {
  // Activar estado de carga
  setIsSubmitting(true);
  setFormError(null);

  try {
    // Aquí se crea el objeto completo para la API, añadiendo empresaId
    // La lógica de envío debe considerar el modo (create, edit, delete)
    const method = requestState.method;
    let result: { success: boolean; error: string | null } = {
      success: false,
      error: null,
    };

    if (method === "view") {
      handleCloseModal();
      return;
    }

  // Aquí se crea el objeto completo para la API...
  const dataToSubmit = {
    ...data,
    // EmpresaId ya viene del formulario o de initialForm, aseguramos que se envíe
    empresaId: data.empresaId || initialForm.empresaId,
    // Si es 'edit' o 'delete', el ID viene en `data`
  };

  // TODO: Implementar lógica de API para EDITAR y ELIMINAR
  if (method === "edit") {
    // Lógica para editar usuario
    {
      const rawResult = await usuarioUpdate(String(data.id), dataToSubmit);
      result = {
        success: rawResult.success,
        error: rawResult.error !== undefined ? rawResult.error : null,
      };
    }
  } else if (method === "activate") {
    // Lógica para reactivar usuario
    const reactivarBody: IUsuarioDarDeBajaReactivar = {
      id: String(data.id),
      deletedObs: "", // data.deletedObs || ""
    };
    {
      const rawResult = await usuarioReactivar(reactivarBody);
      result = {
        success: rawResult.success,
        error: rawResult.error !== undefined ? String(rawResult.error) : null,
      };
    }
  } else if (method === "delete") {
    // Lógica para eliminar usuario
    const darDeBajaBody: IUsuarioDarDeBajaReactivar = {
      id: String(data.id),
      deletedObs: "", // data.deletedObs || ""
    };
    {
      const rawResult = await usuarioDarDeBaja(darDeBajaBody);
      result = {
        success: rawResult.success,
        error: rawResult.error !== undefined ? String(rawResult.error) : null,
      };
    }
  } else if (method === "create") {
    result = (await registrarUsuario(dataToSubmit)) as {
      success: boolean;
      error: string | null;
    };
  }

    if (result.success) {
      const successMessages = {
        create: "Usuario creado exitosamente",
        edit: "Usuario actualizado exitosamente", 
        delete: "Usuario dado de baja exitosamente",
        activate: "Usuario reactivado exitosamente"
      };
      
      showModalMessage(successMessages[method as keyof typeof successMessages] || "Operación completada exitosamente", "success");
      handleCloseModal();
    } else {
      const errorMessage = result.error || `Error al ${method} el usuario.`;
      showModalMessage(errorMessage, "error");
      setFormError(errorMessage);
    }
  } catch (error) {
    console.error("Error en handleSubmit:", error);
    const errorMessage = "Ocurrió un error inesperado al procesar la solicitud";
    showModalMessage(errorMessage, "error");
    setFormError(errorMessage);
  } finally {
    // Desactivar estado de carga
    setIsSubmitting(false);
  }
};

  if (loading) {
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

  // AHORA currentInitialData siempre será UsuarioFormFields o initialForm
  // Lo cual satisface la prop initialData de UsuarioForm
  const currentInitialData = requestState.userData || initialForm; // LÍNEA 144

  const tabs = [
    {
      label: "Configuracion de Usuario",
      value: 0,
      content: (
        <>
          <CustomButton
            onClick={() => handleOpenModal("create")}
            style={{ float: "right" }}
          >
            Crear usuario
          </CustomButton>

          <UsuarioTable
            data={usuarios}
            onEdit={(row) => handleOpenModal("edit", row)}
            onView={(row) => handleOpenModal("view", row)}
            onDelete={(row) => handleOpenModal("delete", row)}
            onActivate={(row) => handleOpenModal("activate", row)}
            onRemove={(row) => handleOpenModal("remove", row)}
            onReestablecer={(row) => handleReestablecer(row)}
            onPermisos={handleOpenPermisos}
            onReenviarCorreo={handleReenviarCorreo}
            isLoading={loading}
          />
        </>
      ),
    },
    ...(canConfigEmpresa
      ? [
          {
            label: "Configuracion de Empresa",
            value: 1,
            content: <EmpresaTable />,
          },
        ]
      : []),
  ];
  
  return (
    <Box className={styles.usuariosPageContainer}>
      <CustomTabs
        tabs={tabs}
        currentTab={currentTab}
        onTabChange={(_event, newTabValue) => setCurrentTab(newTabValue)}
      />

      <UsuarioForm
        open={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        roles={roles}
        cargos={cargos}
        refEmpleadores={refEmpleadores}
        usuarios={usuarios}
        initialData={currentInitialData}
        errorMsg={formError}
        method={requestState.method || "create"}
        isAdmin={isAdmin}
        isSubmitting={isSubmitting}
      />

      <Tareas
        open={permisosModal.open}
        onClose={handleClosePermisos}
        usuario={permisosModal.usuario}
        onSave={handleSavePermisos}
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
