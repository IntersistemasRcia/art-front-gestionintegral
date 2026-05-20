"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import { Box, Typography } from "@mui/material";
import { ColumnDef } from "@tanstack/react-table";
import axios, { AxiosError } from "axios";
import AuthAPI, { token, type Empresa } from "@/data/authAPI";
import { useAuth } from "@/data/AuthContext";
import { useEmpresasStore } from "@/data/empresasStore";
import CustomSelectSearch from "@/utils/ui/form/CustomSelectSearch";
import DataTable from "@/utils/ui/table/DataTable";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModalMessage, { MessageType } from "@/utils/ui/message/CustomModalMessage";
import Formato from "@/utils/Formato";

export type UsuarioEmpresaPorCuitFila = Empresa & { id?: number };
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
  /** Notifica cantidad de empresas vinculadas y estado de carga (p. ej. bloqueo de cierre del modal tras alta). */
  onEmpresasRelacionadasMetaChange?: (meta: EmpresasRelacionadasMeta) => void;
};

export function UsuarioEmpresasUsuarioTab({
  open,
  usuarioId,
  cuitForm,
  puedeEditar,
  onEmpresasRelacionadasMetaChange,
}: UsuarioEmpresasUsuarioTabProps) {
  const { hasTask } = useAuth();
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

  const swrKey =
    open && usuarioId && cuitNum
      ? ([AuthAPI.getEmpresasURL({ CUIT: cuitNum }), token.getToken(), usuarioId] as const)
      : null;

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    () => AuthAPI.getEmpresas({ CUIT: cuitNum! })
  );

  const rows: UsuarioEmpresaPorCuitFila[] = useMemo(
    () => (Array.isArray(data) ? (data as UsuarioEmpresaPorCuitFila[]) : []),
    [data]
  );

  useEffect(() => {
    if (!open || !onEmpresasRelacionadasMetaChange) return;
    if (!cuitNum || !usuarioId) {
      onEmpresasRelacionadasMetaChange({ count: 0, isLoading: false });
      return;
    }
    onEmpresasRelacionadasMetaChange({
      count: rows.length,
      isLoading,
    });
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
      if (row.id == null) {
        showModalMessage(
          "No se puede dar de baja: el servicio no devolvió el identificador de la relación usuario–empresa (id).",
          "error"
        );
        return;
      }
      setIsMutating(true);
      try {
        await AuthAPI.deleteUsuariosEmpresasBorrar(row.id);
        showModalMessage("Empresa desvinculada correctamente.", "success");
        await mutate();
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
    [mutate, showModalMessage]
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
      showModalMessage("Empresa agregada correctamente.", "success");
      setEmpresaAAgregar(null);
      await mutate();
    } catch (err) {
      const msg =
        axios.isAxiosError(err)
          ? (err.response?.data as { Mensaje?: string; message?: string } | undefined)
              ?.Mensaje ??
            (err.response?.data as { message?: string } | undefined)?.message ??
            err.message
          : err instanceof Error
            ? err.message
            : "Error al agregar la empresa.";
      showModalMessage(String(msg), "error");
    } finally {
      setIsMutating(false);
    }
  }, [empresaAAgregar, mutate, showModalMessage, usuarioId]);

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
            disabled={!puedeEditar || !canDarDeBajaEmpresa || row.original.id == null || isMutating}
            onClick={() => void handleDarDeBaja(row.original)}
          >
            Dar de baja
          </CustomButton>
        ),
      },
    ],
    [handleDarDeBaja, puedeEditar, canDarDeBajaEmpresa, isMutating]
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
