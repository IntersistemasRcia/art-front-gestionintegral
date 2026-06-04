"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { ColumnDef } from "@tanstack/react-table";
import axios, { AxiosError } from "axios";
import AuthAPI, { type Empresa, type UsuarioEmpresasListadoEmpresaVm } from "@/data/authAPI";
import { useAuth } from "@/data/AuthContext";
import { useEmpresasStore } from "@/data/empresasStore";
import CustomSelectSearch from "@/utils/ui/form/CustomSelectSearch";
import DataTable from "@/utils/ui/table/DataTable";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModalMessage, { MessageType } from "@/utils/ui/message/CustomModalMessage";
import Formato from "@/utils/Formato";

export type UsuarioEmpresaPorCuitFila = Empresa & { relacionId: number };
type EmpresaComboOption = Pick<Empresa, "empresaId" | "cuit" | "razonSocial">;

export type EmpresasRelacionadasMeta = {
  count: number;
  isLoading: boolean;
};

type UsuarioEmpresasUsuarioTabProps = {
  open: boolean;
  usuarioId: string;
  cuitForm: string;
  puedeEditar: boolean;
  empresasIniciales?: UsuarioEmpresasListadoEmpresaVm[];
  /** Notifica cantidad de empresas vinculadas y estado de carga (p. ej. bloqueo de cierre del modal tras alta). */
  onEmpresasRelacionadasMetaChange?: (meta: EmpresasRelacionadasMeta) => void;
  onMutate?: () => Promise<void>;
};

export function UsuarioEmpresasUsuarioTab({
  open,
  usuarioId,
  cuitForm,
  puedeEditar,
  empresasIniciales,
  onEmpresasRelacionadasMetaChange,
  onMutate,
}: UsuarioEmpresasUsuarioTabProps) {
  const { hasTask, user } = useAuth();
  const { empresas: empresasStore } = useEmpresasStore();
  const [empresaAAgregar, setEmpresaAAgregar] = useState<EmpresaComboOption | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [modalMsg, setModalMsg] = useState<{
    open: boolean;
    message: string;
    type: MessageType;
  }>({ open: false, message: "", type: "info" });

  const cuitNum = useMemo(() => {
    const n = Number(String(cuitForm ?? "").replace(/\D/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [cuitForm]);

  const { data, error, isLoading, mutate } = AuthAPI.useGetEmpresas(
    open && usuarioId && cuitNum ? { CUIT: cuitNum } : undefined
  );

  const { data: empresasLogueado } = AuthAPI.useGetEmpresas(
    open && user?.cuit ? { CUIT: user.cuit } : undefined
  );

  // Empresas activas del usuario (sin fecha de baja), con el id de relación cruzado
  const relacionesActivas = useMemo(() => {
    const activas = new Set(
      (empresasIniciales ?? [])
        .filter((e) => e.fechaBaja == null)
        .map((e) => e.empresaId)
    );
    return activas;
  }, [empresasIniciales]);

  const relacionById = useMemo(() => {
    const map = new Map<number, number>();
    (empresasIniciales ?? [])
      .filter((e) => e.fechaBaja == null)
      .forEach((e) => map.set(e.empresaId, e.id));
    return map;
  }, [empresasIniciales]);

  const empresasLogueadoIds = useMemo(
    () => new Set((empresasLogueado ?? []).map((e) => e.empresaId)),
    [empresasLogueado]
  );

  const rows = useMemo<UsuarioEmpresaPorCuitFila[]>(() => {
    if (!Array.isArray(data)) return [];
    return (data as Empresa[])
      .filter((e) => relacionesActivas.has(e.empresaId) && empresasLogueadoIds.has(e.empresaId))
      .map((e) => ({ ...e, relacionId: relacionById.get(e.empresaId) ?? 0 }));
  }, [data, relacionesActivas, relacionById, empresasLogueadoIds]);

  useEffect(() => {
    if (!open || !onEmpresasRelacionadasMetaChange) return;
    if (!cuitNum || !usuarioId) {
      onEmpresasRelacionadasMetaChange({ count: 0, isLoading: false });
      return;
    }
    onEmpresasRelacionadasMetaChange({ count: rows.length, isLoading });
  }, [open, cuitNum, usuarioId, rows.length, isLoading, onEmpresasRelacionadasMetaChange]);

  const empresasSesionParaCombo = useMemo<EmpresaComboOption[]>(
    () =>
      (empresasStore ?? []).map((empresa) => ({
        empresaId: Number(empresa.empresaId),
        razonSocial: String(empresa.razonSocial ?? ""),
        cuit: Number(empresa.cuit ?? 0),
      })),
    [empresasStore]
  );

  const empresasDisponiblesParaAgregar = useMemo(() => {
    const asignadas = new Set(rows.map((r) => r.empresaId));
    return empresasSesionParaCombo.filter((o) => !asignadas.has(o.empresaId));
  }, [empresasSesionParaCombo, rows]);

  const showModalMessage = useCallback((message: string, type: MessageType) => {
    setModalMsg({ open: true, message, type });
  }, []);
  const canAgregarEmpresa = hasTask("Usuarios_UsuariosEmpresas_Agregar");
  const canDarDeBajaEmpresa = hasTask("Usuarios_UsuariosEmpresas_DarDeBaja");

  const handleCloseModal = useCallback(() => {
    setModalMsg((prev) => ({ ...prev, open: false }));
  }, []);

  const handleDarDeBaja = useCallback(
    async (row: UsuarioEmpresaPorCuitFila) => {
      setIsMutating(true);
      try {
        await AuthAPI.deleteUsuariosEmpresasBorrar(row.relacionId);
        void onMutate?.();
        await mutate();
        showModalMessage("Empresa desvinculada correctamente.", "success");
      } catch (err) {
        const msg =
          axios.isAxiosError(err)
            ? (err.response?.data as { Mensaje?: string; message?: string } | undefined)
                ?.Mensaje ??
              (err.response?.data as { message?: string } | undefined)?.message ??
              err.message
            : err instanceof Error
              ? err.message
              : "Error al dar de baja la empresa.";
        showModalMessage(String(msg), "error");
      } finally {
        setIsMutating(false);
      }
    },
    [mutate, onMutate, showModalMessage]
  );

  const handleAgregarEmpresa = useCallback(async () => {
    if (!empresaAAgregar?.empresaId) {
      showModalMessage("Seleccione una empresa para agregar.", "warning");
      return;
    }
    setIsMutating(true);
    try {
      await AuthAPI.postUsuariosEmpresas({
        usuarioId,
        empresaId: Number(empresaAAgregar.empresaId),
        vigencia: "2099-12-31T00:00:00.000Z",
      });

      const parametros = await AuthAPI.getParamEntidadEmpresa({ CUIT: empresaAAgregar.cuit, PageIndex: 1, PageSize: 1 });
      const parametrosData = (parametros as { data?: unknown[] })?.data ?? (Array.isArray(parametros) ? parametros : []);
      if (parametrosData.length === 0) {
        await AuthAPI.postParamEntidadEmpresaRAR({
          entidadId: Number(empresaAAgregar.empresaId),
          parametroId: 1,
          parametroValor: "20",
        });
      }

      void onMutate?.();
      await mutate();
      showModalMessage("Empresa agregada correctamente.", "success");
      setEmpresaAAgregar(null);
    } catch (err) {
      const msg =
        axios.isAxiosError(err)
          ? (err.response?.data as { Mensaje?: string; message?: string } | undefined)
              ?.Mensaje ??
            (err.response?.data as { message?: string } | undefined)?.message ??
            err.message
          : err instanceof Error
            ? err.message
            : "Ocurrió un inconveniente al procesar la empresa. Por favor intente de nuevo.";
      showModalMessage(String(msg), "error");
    } finally {
      setIsMutating(false);
    }
  }, [empresaAAgregar, mutate, onMutate, showModalMessage, usuarioId]);

  const columns = useMemo<ColumnDef<UsuarioEmpresaPorCuitFila>[]>(
    () => [
      {
        accessorKey: "cuit",
        header: "CUIT",
        cell: (info) => Formato.CUIP(info.getValue()),
      },
      { accessorKey: "razonSocial", header: "Razón social" },
      { accessorKey: "domicilio", header: "Domicilio" },
      { accessorKey: "localidad", header: "Localidad" },
      { accessorKey: "provincia", header: "Provincia" },
      {
        id: "darDeBaja",
        header: "Dar de baja",
        meta: { align: "center" as const },
        cell: ({ row }) => (
          <CustomButton
            type="button"
            color="secondary"
            disabled={!canDarDeBajaEmpresa || isMutating}
            onClick={() => void handleDarDeBaja(row.original)}
          >
            Dar de baja
          </CustomButton>
        ),
      },
    ],
    [handleDarDeBaja, canDarDeBajaEmpresa, isMutating]
  );

  if (!cuitNum) {
    return (
      <Typography variant="body2" color="text.secondary">
        Ingrese un CUIT válido en la pestaña &quot;Datos del Usuario&quot; para listar las empresas.
      </Typography>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        {error instanceof AxiosError
          ? (error.response?.data as { Mensaje?: string } | undefined)?.Mensaje ??
            error.message
          : "No se pudieron cargar las empresas del usuario."}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {puedeEditar && canAgregarEmpresa && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "flex-end",
          }}
        >
          <Box sx={{ minWidth: 380, flex: "1 1 380px" }}>
            <CustomSelectSearch<EmpresaComboOption>
              options={empresasDisponiblesParaAgregar}
              value={empresaAAgregar}
              onChange={(_event, newValue) => setEmpresaAAgregar(newValue)}
              getOptionLabel={(empresa) => {
                if (!empresa) return "";
                return `${empresa.razonSocial ?? ""} - ${Formato.CUIP(empresa.cuit)}`;
              }}
              filterOptions={(options, { inputValue }) => {
                const term = String(inputValue ?? "").toLowerCase().trim();
                if (!term) return options;
                const termDigits = term.replace(/\D/g, "");
                return options.filter((option) => {
                  const razonSocial = String(option.razonSocial ?? "").toLowerCase();
                  const cuitDigits = String(option.cuit ?? "").replace(/\D/g, "");
                  return (
                    razonSocial.includes(term) ||
                    (termDigits.length > 0 && cuitDigits.includes(termDigits))
                  );
                });
              }}
              isOptionEqualToValue={(option, value) => option.empresaId === value.empresaId}
              label="Empresa"
              placeholder="Buscar por razón social o CUIT..."
              noOptionsText="No se encontraron empresas"
              disabled={isMutating}
            />
          </Box>
          <CustomButton
            type="button"
            onClick={() => void handleAgregarEmpresa()}
            disabled={isMutating || !empresaAAgregar?.empresaId || empresasDisponiblesParaAgregar.length === 0}
          >
            Agregar Empresa
          </CustomButton>
        </Box>
      )}

      <DataTable
        data={rows}
        columns={columns}
        isLoading={isLoading}
        size="small"
        enableFiltering={false}
      />

      <CustomModalMessage
        open={modalMsg.open}
        onClose={handleCloseModal}
        message={modalMsg.message}
        type={modalMsg.type}
        title={modalMsg.type === "success" ? "Operación exitosa" : "Atención"}
      />
    </Box>
  );
}
