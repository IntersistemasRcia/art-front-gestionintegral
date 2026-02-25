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
      <Box className={tareasStyles.container}>
        {/* Información del usuario */}
        <Typography
          variant="body2"
          color="textSecondary"
          className={tareasStyles.titleText}
        >
          Administración de Usuarios &gt; {usuario.nombre} &gt; Configuración de
          Permisos
        </Typography>

        <Box className={tareasStyles.userInfo}>
          <Typography variant="body2" className={tareasStyles.userInfoText}>
            <strong>Usuario:</strong> {usuario.email}
          </Typography>
          <Typography variant="body2" className={tareasStyles.userInfoText}>
            <strong>Cargo:</strong> {usuario.cargoDescripcion}
          </Typography>
        </Box>

        <Typography variant="body2" className={tareasStyles.subtitle}>
          Seleccione a qué módulos tendrá acceso este usuario:
        </Typography>

        {/* Tabla de permisos */}
        <Box className={tareasStyles.tableBox}>
          {/* Header */}
          <Box className={tareasStyles.tableHeader}>
            <Typography variant="body2" className={tareasStyles.headerColLarge}>
              Opción del Menú
            </Typography>
            <Typography variant="body2" className={tareasStyles.headerColCenter}>
              Acceso (S/N)
            </Typography>
            <Typography variant="body2" className={tareasStyles.headerColInfo}>
              Información sobre permisos
            </Typography>
          </Box>

          {/* Contenido - Módulos */}
          {getModulosUnicos()
            ?.map((modulo, moduloIndex) => (
            <Box key={`modulo-${modulo.id}`}>
              {/* Header del módulo con control de permisos y expandir/contraer */}
              <Box className={tareasStyles.moduleHeader}>
                <Box className={tareasStyles.moduleLeft}>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleModulo(modulo.id)}
                    className={tareasStyles.iconButtonMargin}
                  >
                    {modulosExpandidos[modulo.id] ? (
                      <ExpandLess />
                    ) : (
                      <ExpandMore />
                    )}
                  </IconButton>
                  <Typography variant="body2" className={tareasStyles.moduleName}>
                    {modulo.nombre}
                  </Typography>
                </Box>

                <Box className={tareasStyles.moduleCenter}>
                  <Box
                    className={`${tareasStyles.moduleBadge} ${
                      permisosModulos[modulo.id] ? tareasStyles.enabled : tareasStyles.disabled
                    }`}
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

                <Typography variant="body2" className={tareasStyles.moduleInfo}>
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
                {modulo.tareas?.map((tarea) => (
                  <Box key={`${modulo.id}-tarea-${tarea.tareaId}`} className={tareasStyles.tareaBox}>
                    <Typography variant="body2" className={tareasStyles.tareaText}>
                      {tarea.tareaDescripcion}
                    </Typography>

                    <Box className={tareasStyles.tareaCenter}>
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
                        {permisosTareas[getTareaKey(modulo.id, tarea.tareaId)] ? "S" : "N"}
                      </Box>
                    </Box>

                    <Typography variant="body2" className={tareasStyles.tareaInfo}>
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
        <Box className={tareasStyles.actionsRow}>
          <Box className={tareasStyles.actionsLeft}>
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
          <Typography className={tareasStyles.messageError}>
            {saveError}
          </Typography>
        )}

        {saveSuccess && (
          <Typography className={tareasStyles.messageSuccess}>
            {saveSuccess}
          </Typography>
        )}

        {isSaving && (
          <Box className={tareasStyles.overlay}>
            <CircularProgress />
            <Typography variant="h6">Guardando...</Typography>
          </Box>
        )}
      </Box>
    </CustomModal>
  );
}