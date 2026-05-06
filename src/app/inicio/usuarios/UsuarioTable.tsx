"use client";

import { useMemo, useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { IconButton, Box, Tooltip } from "@mui/material"; 
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility"; 
import SecurityIcon from "@mui/icons-material/Security";
import DataTable from "@/utils/ui/table/DataTable";
import UsuarioRow from "./interfaces/UsuarioRow";
import { useAuth } from "@/data/AuthContext";
import { Delete, GroupAdd, GroupRemove, Mail, Password } from "@mui/icons-material";
import { BsEnvelopeArrowUpFill } from "react-icons/bs";
import Formato from "@/utils/Formato";
import styles from "./UsuarioTable.module.css";

type UsuarioTableServerPagination = {
  /** Página actual (1-based), alineado al POST y al `DataTable`. */
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (pageIndex1Based: number) => void;
};

interface Props {
  data: UsuarioRow[];
  onEdit: (row: UsuarioRow) => void;
  onDelete: (row: UsuarioRow) => void;
  onView: (row: UsuarioRow) => void;
  onPermisos: (row: UsuarioRow) => void;
  onActivate: (row: UsuarioRow) => void;
  onRemove: (row: UsuarioRow) => void;
  onReestablecer: (row: UsuarioRow) => Promise<void>;
  onReenviarCorreo: (row: UsuarioRow) => Promise<void>;
  isLoading: boolean;
  /** Paginación en servidor (listado por empresas). */
  serverPagination?: UsuarioTableServerPagination;
}

export default function UsuarioTable({
  data,
  onEdit,
  onDelete,
  onView,
  onActivate,
  onRemove,
  onPermisos,
  onReestablecer,
  onReenviarCorreo,
  isLoading,
  serverPagination,
}: Props) {
  const { user } = useAuth();  
  const { hasTask } = useAuth();
  const isAdmin = user?.rol?.toLowerCase() === "administrador"
  const isAdminEmpleador = user?.rol?.toLowerCase() === "administradorempleador";
  
  // Estado para rastrear los botones deshabilitados
  const [disabledButtons, setDisabledButtons] = useState<{
    reestablecer: Set<string>;
    reenviarCorreo: Set<string>;
  }>({
    reestablecer: new Set(),
    reenviarCorreo: new Set()
  });

  // Función para reactivar el botón de Reestablecer contraseña
  const enableReestablecerButton = useCallback((userId: string) => {
    setDisabledButtons(prev => {
      const newReestablecer = new Set(prev.reestablecer);
      newReestablecer.delete(userId);
      return {
        ...prev,
        reestablecer: newReestablecer
      };
    });
  }, []);

  // Función para reactivar el botón de Reenviar correo
  const enableReenviarCorreoButton = useCallback((userId: string) => {
    setDisabledButtons(prev => {
      const newReenviarCorreo = new Set(prev.reenviarCorreo);
      newReenviarCorreo.delete(userId);
      return {
        ...prev,
        reenviarCorreo: newReenviarCorreo
      };
    });
  }, []);

  // Función para manejar click en Reestablecer contraseña
  const handleReestablecerClick = useCallback(async (row: UsuarioRow) => {
    const userId = row.id.toString();
    
    // Deshabilitar el botón
    setDisabledButtons(prev => {
      const newReestablecer = new Set(prev.reestablecer);
      newReestablecer.add(userId);
      return {
        ...prev,
        reestablecer: newReestablecer
      };
    });

    try {
      await onReestablecer(row);
    } finally {
      // Reactivar el botón después del proceso, exitoso o no
      enableReestablecerButton(userId);
    }
  }, [onReestablecer, enableReestablecerButton]);

  // Función para manejar click en Reenviar correo
  const handleReenviarCorreoClick = useCallback(async (row: UsuarioRow) => {
    const userId = row.id.toString();
    
    // Deshabilitar el botón
    setDisabledButtons(prev => {
      const newReenviarCorreo = new Set(prev.reenviarCorreo);
      newReenviarCorreo.add(userId);
      return {
        ...prev,
        reenviarCorreo: newReenviarCorreo
      };
    });

    try {
      await onReenviarCorreo(row);
    } finally {
      // Reactivar el botón después del proceso, exitoso o no
      enableReenviarCorreoButton(userId);
    }
  }, [onReenviarCorreo, enableReenviarCorreoButton]);
  
  const columns = useMemo<ColumnDef<UsuarioRow>[]>(
    () => [
      { accessorKey: "cuit", header: "CUIT", cell: (info: any) => Formato.CUIP(info.getValue())},
      { accessorKey: "nombre", header: "Nombre"},
      { accessorKey: "email", header: "Email"},
      { accessorKey: "rol", header: "Rol"},
      {
        accessorKey: "cargoDescripcion",
        header: () => (
          <Box sx={{ lineHeight: 1.1 }}>
            Cargo/
            <br />
            Función
          </Box>
        ),
      },
      {
        accessorKey: "sectorDescripcion",
        header: "Sector",
        cell: ({ row }) => row.original.sectorDescripcion || "-",
      },
      { accessorKey: "estado", header: "Estado"},
      { accessorKey: "phoneNumber", header: "Teléfono"},
      { id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          const isRowUserAdmin = row.original.rol?.toLowerCase() === "administrador";
          const isRowUserAdminEmpleador = row.original.rol?.toLowerCase() === "administradorempleador";
          
          return (
            <Box className={styles.actionsGrid}>
                  <>
                    <Tooltip
                      title="Editar usuario"
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            fontSize: "1.2rem",
                            fontWeight: 500,
                          },
                        },
                      }}
                    >
                      <IconButton
                        disabled={!hasTask("Usuarios_AccionEditar")}
                        onClick={() => onEdit(row.original)}
                        color="warning"
                        size="small"
                      >
                        <EditIcon fontSize="medium" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title="Ver detalles"
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            fontSize: "1.2rem",
                            fontWeight: 500,
                          },
                        },
                      }}
                    >
                      <IconButton
                        disabled={!hasTask("Usuarios_AccionVer")}
                        onClick={() => onView(row.original)}
                        color="primary"
                        size="small"
                      >
                        <VisibilityIcon fontSize="medium" />
                      </IconButton>
                    </Tooltip>                    
                    <Tooltip
                      title="Configurar permisos"
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            fontSize: "1.2rem",
                            fontWeight: 500,
                          },
                        },
                      }}
                    >
                      <IconButton
                        disabled={!hasTask("Usuarios_AccionConfigurar")}
                        onClick={() => onPermisos(row.original)}
                        color="success"
                        size="small"
                      >
                        <SecurityIcon fontSize="medium" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip
                      title="Restablecer contraseña"
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            fontSize: "1.2rem",
                            fontWeight: 500,
                          },
                        },
                      }}
                    >
                      <IconButton
                        disabled={!hasTask("Usuarios_AccionRestablecerClave") || disabledButtons.reestablecer.has(row.original.id.toString())}
                        onClick={() => handleReestablecerClick(row.original)}
                        color="warning"
                        size="small"
                      >
                        <Password fontSize="medium" />
                      </IconButton>
                    </Tooltip>
                  </>
              {row.original.estado === "Inactivo" ? 
              (
                <>
                  <Tooltip
                    title="Activar usuario"
                    arrow
                    slotProps={{
                      tooltip: {
                        sx: {
                          fontSize: "1.2rem",
                          fontWeight: 500,
                        },
                      },
                    }}
                  >
                    <IconButton
                      disabled={!hasTask("Usuarios_AccionActivar")}
                      onClick={() => onActivate(row.original)}
                      color="primary"
                      size="small"
                    >
                      <Mail fontSize="medium" />
                    </IconButton>
                  </Tooltip>
                </>
              ) 
              :
              (
              <>
                <Tooltip
                  title="Desactivar usuario"
                  arrow
                  slotProps={{
                    tooltip: {
                      sx: {
                        fontSize: "1.2rem",
                        fontWeight: 500,
                      },
                    },
                  }}
                >
                  <IconButton
                    disabled={!hasTask("Usuarios_AccionDesactivar")}
                    onClick={() => onDelete(row.original)}
                    color="error"
                    size="small"
                  >
                    <GroupRemove fontSize="medium" />
                  </IconButton>
                </Tooltip>
              </>
              )}
              {row.original.estado.toLowerCase() === "pendiente activación" ? (
                <>
                    <Tooltip
                      title="Reenviar Correo"
                      arrow
                      slotProps={{
                        tooltip: {
                          sx: {
                            fontSize: "1.2rem",
                            fontWeight: 500,
                          },
                        },
                      }}
                    >
                      <IconButton
                        disabled={!hasTask("Usuarios_AccionReenviarCorreo") || disabledButtons.reenviarCorreo.has(row.original.id.toString())}
                        onClick={() => handleReenviarCorreoClick(row.original)}
                        color="warning"
                        size="small"
                      >
                        <BsEnvelopeArrowUpFill className={styles.pendingMailIcon} />
                      </IconButton>
                    </Tooltip>
                  </>
              ) : (
                <Box className={styles.emptyActionSlot} />
                )}
            </Box>
          );
        },
        meta: { align: 'center'},
  },
    ],
    [onEdit, onDelete, onView, onPermisos, onActivate, hasTask, disabledButtons.reestablecer, disabledButtons.reenviarCorreo, handleReestablecerClick, handleReenviarCorreoClick]
  );

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      size="small"
      enableFiltering={false}
      manualPagination={Boolean(serverPagination)}
      pageIndex={serverPagination?.pageIndex}
      pageSize={serverPagination?.pageSize}
      pageCount={serverPagination?.pageCount}
      onPageChange={serverPagination?.onPageChange}
    />
  );
}