"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  IconButton,
  Collapse,
  CircularProgress,
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import CustomModal from '@/utils/ui/form/CustomModal';
import IModulo from './interfaces/IModulo';
import UsuarioRow from './interfaces/UsuarioRow';
import styles from './Usuario.module.css';
import tareasStyles from './Tareas.module.css';
import CustomButton from '@/utils/ui/button/CustomButton';

interface TareasProps {
  open: boolean;
  onClose: () => void;
  usuario: UsuarioRow | null;
  // Puede retornar una promesa o ser sincrónica
  onSave: (permisos: PermisosModulo[]) => void | Promise<void>;
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

export default function Tareas({
  open,
  onClose,
  usuario,
  onSave,
}: TareasProps) {
  const [permisosModulos, setPermisosModulos] = useState<Record<number, boolean>>({});
  const [permisosTareas, setPermisosTareas] = useState<Record<string, boolean>>({});
  const [modulosExpandidos, setModulosExpandidos] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const getTareaKey = (moduloId: number, tareaId: number) => `${moduloId}-${tareaId}`;

  const getModulosUnicos = () => {
    if (!usuario?.modulos) return [];
    return usuario.modulos.filter(
      (modulo, index, array) => array.findIndex((m) => m.id === modulo.id) === index
    );
  };

  useEffect(() => {
    if (usuario?.modulos) {
      const modulosUnicos = getModulosUnicos();

      const permisosModulosIniciales: Record<number, boolean> = {};
      const permisosTareasIniciales: Record<string, boolean> = {};
      const modulosExpandidosIniciales: Record<number, boolean> = {};

      modulosUnicos.forEach((modulo) => {
        permisosModulosIniciales[modulo.id] = modulo.habilitado;
        modulosExpandidosIniciales[modulo.id] = false;

        modulo.tareas?.forEach((tarea) => {
          permisosTareasIniciales[getTareaKey(modulo.id, tarea.tareaId)] =
            tarea.habilitada ?? modulo.habilitado;
        });
      });

      setPermisosModulos(permisosModulosIniciales);
      setPermisosTareas(permisosTareasIniciales);
      setModulosExpandidos(modulosExpandidosIniciales);
    }
  }, [usuario]);

  // Limpiar mensajes de estado cuando se abre el modal o cambia el usuario
  useEffect(() => {
    if (open) {
      setSaveError(null);
      setSaveSuccess(null);
      setIsSaving(false);
    }
  }, [open, usuario?.id]);

  const handleModuloPermisoChange = (moduloId: number, habilitado: boolean) => {
    setPermisosModulos((prev) => ({
      ...prev,
      [moduloId]: habilitado,
    }));

    setPermisosTareas((prev) => {
      const next = { ...prev };
      const modulo = getModulosUnicos().find((m) => m.id === moduloId);
      modulo?.tareas?.forEach((tarea) => {
        next[getTareaKey(moduloId, tarea.tareaId)] = habilitado;
      });
      return next;
    });
  };

  const handleTareaPermisoChange = (
    moduloId: number,
    tareaId: number,
    habilitada: boolean
  ) => {
    setPermisosTareas((prev) => ({
      ...prev,
      [getTareaKey(moduloId, tareaId)]: habilitada,
    }));

    const modulo = getModulosUnicos().find((m) => m.id === moduloId);
    const tareasDelModulo = modulo?.tareas ?? [];

    if (tareasDelModulo.length === 0) {
      setPermisosModulos((prev) => ({
        ...prev,
        [moduloId]: habilitada,
      }));
      return;
    }

    const hayAlgunaHabilitada = tareasDelModulo.some((tarea) => {
      if (tarea.tareaId === tareaId) return habilitada;
      return permisosTareas[getTareaKey(moduloId, tarea.tareaId)] ?? false;
    });

    setPermisosModulos((prev) => ({
      ...prev,
      [moduloId]: hayAlgunaHabilitada,
    }));
  };

  const handleToggleModulo = (moduloId: number) => {
    setModulosExpandidos((prev) => ({
      ...prev,
      [moduloId]: !prev[moduloId],
    }));
  };

  const handleGuardarConfiguracion = async () => {
    if (!usuario?.modulos) return;

    const modulosUnicos = getModulosUnicos();

    const permisosModulosArray: PermisosModulo[] = modulosUnicos.map((modulo) => ({
      moduloId: modulo.id,
      moduloDescripcion: modulo.nombre,
      habilitado: permisosModulos[modulo.id] ?? false,
      tareas:
        modulo.tareas?.map((tarea) => ({
          tareaId: tarea.tareaId,
          moduloId: modulo.id,
          habilitada:
            permisosTareas[getTareaKey(modulo.id, tarea.tareaId)] ?? false,
        })) ?? [],
    }));

    console.log('Permisos módulos a enviar:', permisosModulosArray);
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      const res = onSave(permisosModulosArray);
      if (res && typeof (res as any).then === "function") {
        await res;
      }

      setSaveSuccess("Guardado correctamente.");
    } catch (err: any) {
      console.error(err);
      setSaveError(err?.message ?? "Error al guardar la configuración.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVolver = () => {
    onClose();
  };

  const handleDarAccesoATodo = () => {
    if (!usuario?.modulos) return;

    const modulosUnicos = getModulosUnicos();

    const nuevosPermisos: Record<number, boolean> = {};
    const nuevosPermisosTareas: Record<string, boolean> = {};
    modulosUnicos.forEach((modulo) => {
      nuevosPermisos[modulo.id] = true;
      modulo.tareas?.forEach((tarea) => {
        nuevosPermisosTareas[getTareaKey(modulo.id, tarea.tareaId)] = true;
      });
    });
    setPermisosModulos(nuevosPermisos);
    setPermisosTareas(nuevosPermisosTareas);
  };

  const handleQuitarTodosLosAccesos = () => {
    if (!usuario?.modulos) return;

    const modulosUnicos = getModulosUnicos();

    const nuevosPermisos: Record<number, boolean> = {};
    const nuevosPermisosTareas: Record<string, boolean> = {};
    modulosUnicos.forEach((modulo) => {
      nuevosPermisos[modulo.id] = false;
      modulo.tareas?.forEach((tarea) => {
        nuevosPermisosTareas[getTareaKey(modulo.id, tarea.tareaId)] = false;
      });
    });
    setPermisosModulos(nuevosPermisos);
    setPermisosTareas(nuevosPermisosTareas);
  };

  if (!usuario) {
    return null;
  }

  return (
    <CustomModal
      open={open}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title={`Configuración de Permisos - ${usuario.nombre}`}
      size="large"
    >
      <Box sx={{ p: 2, position: 'relative' }}>
        {/* Información del usuario */}
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mb: 2, fontSize: "1.8rem" }}
        >
          Administración de Usuarios &gt; {usuario.nombre} &gt; Configuración de
          Permisos
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontSize: "1.5rem" }}>
            <strong>Usuario:</strong> {usuario.email}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "1.5rem" }}>
            <strong>Cargo:</strong> {usuario.cargoDescripcion}
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ mb: 3, fontSize: "1.5rem" }}>
          Seleccione a qué módulos tendrá acceso este usuario:
        </Typography>

        {/* Tabla de permisos */}
        <Box
          sx={{
            border: "1px solid #ddd",
            borderRadius: 1,
            overflow: "hidden",
            mb: 3,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              backgroundColor: "#f5f5f5",
              borderBottom: "1px solid #ddd",
              p: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{ flex: 2, fontWeight: "bold", fontSize: "1.3rem" }}
            >
              Opción del Menú
            </Typography>
            <Typography
              variant="body2"
              sx={{
                flex: 1,
                fontWeight: "bold",
                textAlign: "center",
                fontSize: "1.3rem",
              }}
            >
              Acceso (S/N)
            </Typography>
            <Typography
              variant="body2"
              sx={{ flex: 2, fontWeight: "bold", fontSize: "1.3rem" }}
            >
              Información sobre permisos
            </Typography>
          </Box>

          {/* Contenido - Módulos */}
          {getModulosUnicos()
            ?.map((modulo, moduloIndex) => (
            <Box key={`modulo-${modulo.id}`}>
              {/* Header del módulo con control de permisos y expandir/contraer */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#e8f4f8",
                  p: 1,
                  borderBottom: "1px solid #ddd",
                  fontWeight: "bold",
                }}
              >
                <Box sx={{ flex: 2, display: "flex", alignItems: "center" }}>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleModulo(modulo.id)}
                    sx={{ mr: 1 }}
                  >
                    {modulosExpandidos[modulo.id] ? (
                      <ExpandLess />
                    ) : (
                      <ExpandMore />
                    )}
                  </IconButton>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", fontSize: "1.2rem" }}
                  >
                    {modulo.nombre}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "inline-block",
                      width: 30,
                      height: 20,
                      borderRadius: "3px",
                      backgroundColor: permisosModulos[modulo.id]
                        ? "#4CAF50"
                        : "#f44336",
                      color: "white",
                      textAlign: "center",
                      lineHeight: "20px",
                      fontSize: "15px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      handleModuloPermisoChange(
                        modulo.id,
                        !permisosModulos[modulo.id]
                      )
                    }
                  >
                    {permisosModulos[modulo.id] ? "S" : "N"}
                  </Box>
                </Box>

                <Typography
                  variant="body2"
                  sx={{ flex: 2, fontSize: "1.2rem", color: "#666" }}
                >
                  {permisosModulos[modulo.id]
                    ? "• Acceso habilitado al módulo"
                    : "• Acceso denegado al módulo"}
                </Typography>
              </Box>

              {/* Tareas del módulo (colapsables) */}
              <Collapse
                in={modulosExpandidos[modulo.id]}
                timeout="auto"
                unmountOnExit
              >
                {modulo.tareas?.map((tarea, tareaIndex) => (
                  <Box
                    key={`${modulo.id}-tarea-${tarea.tareaId}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      borderBottom:
                        tareaIndex === modulo.tareas.length - 1
                          ? "none"
                          : "1px solid #ddd",
                      p: 1,
                      pl: 4, // Indentación para mostrar que son sub-elementos
                      minHeight: 40,
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ flex: 2, pl: 2, fontSize: "1.1rem" }}
                    >
                      {tarea.tareaDescripcion}
                    </Typography>

                    <Box sx={{ flex: 1, textAlign: "center" }}>
                      <Box
                        className={
                          `${tareasStyles.toggleBadge} ${
                            permisosTareas[getTareaKey(modulo.id, tarea.tareaId)]
                              ? tareasStyles.enabled
                              : tareasStyles.disabled
                          }`
                        }
                        onClick={() =>
                          handleTareaPermisoChange(
                            modulo.id,
                            tarea.tareaId,
                            !(
                              permisosTareas[
                                getTareaKey(modulo.id, tarea.tareaId)
                              ] ?? false
                            )
                          )
                        }
                      >
                        {permisosTareas[getTareaKey(modulo.id, tarea.tareaId)]
                          ? "S"
                          : "N"}
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{ flex: 2, fontSize: "1.1rem", color: "#666" }}
                    >
                      {permisosTareas[getTareaKey(modulo.id, tarea.tareaId)]
                        ? "• Tarea habilitada"
                        : "• Tarea deshabilitada"}
                    </Typography>
                  </Box>
                ))}
              </Collapse>
            </Box>
          ))}
        </Box>

        {/* Botones de acción */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <CustomButton variant="outlined" onClick={handleVolver} disabled={isSaving}>
              Volver
            </CustomButton>

            <CustomButton
              variant="outlined"
              onClick={handleDarAccesoATodo}
              color="secondary"
              disabled={isSaving}
            >
              Dar acceso a todo
            </CustomButton>

            <CustomButton
              variant="outlined"
              onClick={handleQuitarTodosLosAccesos}
              color="error"
              disabled={isSaving}
            >
              Quitar todos los accesos
            </CustomButton>
          </Box>

          <CustomButton
            variant="contained"
            onClick={handleGuardarConfiguracion}
            color="primary"
            disabled={isSaving}
          >
            Guardar Configuración
          </CustomButton>
        </Box>

        {saveError && (
          <Typography color="error" sx={{ mt: 2 }}>
            {saveError}
          </Typography>
        )}

        {saveSuccess && (
          <Typography color="primary" sx={{ mt: 2 }}>
            {saveSuccess}
          </Typography>
        )}

        {isSaving && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 30,
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="h6">Guardando...</Typography>
          </Box>
        )}
      </Box>
    </CustomModal>
  );
}