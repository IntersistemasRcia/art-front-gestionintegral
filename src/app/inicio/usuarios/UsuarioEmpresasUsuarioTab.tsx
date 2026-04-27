"use client";

import { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { ColumnDef } from "@tanstack/react-table";
import axios, { AxiosError } from "axios";
import AuthAPI, { token, type Empresa } from "@/data/authAPI";
import { useAuth } from "@/data/AuthContext";
import { useEmpresasStore } from "@/data/empresasStore";
import DataTable from "@/utils/ui/table/DataTable";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModalMessage, { MessageType } from "@/utils/ui/message/CustomModalMessage";
import Formato from "@/utils/Formato";

export type UsuarioEmpresaPorCuitFila = Empresa & { id?: number };

type UsuarioEmpresasUsuarioTabProps = {
  open: boolean;
  usuarioId: string;
  cuitForm: string;
  puedeEditar: boolean;
};

export function UsuarioEmpresasUsuarioTab({
  open,
  usuarioId,
  cuitForm,
  puedeEditar,
}: UsuarioEmpresasUsuarioTabProps) {
  const { hasTask } = useAuth();
  const { empresas: empresasStore } = useEmpresasStore();
  const [empresaAAgregar, setEmpresaAAgregar] = useState<number | "">("");
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

  const empresasSesionParaCombo = useMemo(
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
    if (empresaAAgregar === "" || empresaAAgregar === 0) {
      showModalMessage("Seleccione una empresa para agregar.", "warning");
      return;
    }
    setIsMutating(true);
    try {
      await AuthAPI.postUsuariosEmpresas({
        usuarioId,
        empresaId: Number(empresaAAgregar),
        vigencia: "2099-12-31T00:00:00.000Z",
      });
      showModalMessage("Empresa agregada correctamente.", "success");
      setEmpresaAAgregar("");
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
          <FormControl sx={{ minWidth: 280 }} disabled={isMutating}>
            <InputLabel id="empresa-agregar-label">Empresa</InputLabel>
            <Select
              labelId="empresa-agregar-label"
              label="Empresa"
              value={empresaAAgregar === "" ? "" : empresaAAgregar}
              onChange={(e) => {
                const v = e.target.value as number | "";
                setEmpresaAAgregar(v === "" ? "" : Number(v));
              }}
              displayEmpty
            >
              <MenuItem value="">
                <em>Seleccionar…</em>
              </MenuItem>
              {empresasDisponiblesParaAgregar.map((e) => (
                <MenuItem key={e.empresaId} value={e.empresaId}>
                  {e.razonSocial}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <CustomButton
            type="button"
            onClick={() => void handleAgregarEmpresa()}
            disabled={isMutating || empresaAAgregar === "" || empresasDisponiblesParaAgregar.length === 0}
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
