"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { IconButton, Box, Tooltip, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DataTable from "@/utils/ui/table/DataTable";
import { IndicadorGestionDTO } from "@/data/queryAPI";
import Formato from "@/utils/Formato";

interface Props {
  data: IndicadorGestionDTO[];
  onEdit: (row: IndicadorGestionDTO) => void;
  onDelete: (row: IndicadorGestionDTO) => void;
  onView: (row: IndicadorGestionDTO) => void;
  isLoading: boolean;
}

export default function IndicadorTable({ data, onEdit, onDelete, onView, isLoading }: Props) {
  const columns = useMemo<ColumnDef<IndicadorGestionDTO>[]>(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        meta: { align: "center", width: "80px" },
      },
      {
        header: "Nombre",
        accessorKey: "nombre",
        meta: { align: "left" },
      },
      {
        header: "Descripción",
        accessorKey: "descripcion",
        meta: { align: "left" },
      },
      {
        header: "Filtro ID",
        accessorKey: "filtroId",
        meta: { align: "center", width: "100px" },
      },
      {
        header: "Tabla Base",
        accessorKey: "tablaBase",
        meta: { align: "left" },
      },
      {
        header: "Link",
        accessorKey: "link",
        meta: { align: "left" },
      },
      {
        header: "Estado",
        accessorKey: "estado",
        cell: ({ getValue }) => {
          const estado = getValue() as string;
          const estadoNormalizado = estado === "No Activo" ? "Inactivo" : estado;
          return (
            <Chip
              label={estadoNormalizado}
              color={estadoNormalizado === "Activo" ? "success" : "default"}
              size="medium"
              sx={{
                fontSize: "1.4rem",
                fontWeight: 600,
                minWidth: "100px",
                height: "20px",
                "& .MuiChip-label": {
                  fontWeight: 600,
                  fontSize: "1.4rem",
                },
              }}
            />
          );
        },
        meta: { align: "center", width: "120px" },
      },
      {
        header: "Acciones",
        id: "actions",
        cell: ({ row }) => {
          const indicador = row.original;
          return (
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
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
                  size="small"
                  onClick={() => onView(indicador)}
                  color="primary"
                >
                  <VisibilityIcon fontSize="large" />
                </IconButton>
              </Tooltip>
              <Tooltip
                title="Editar indicador"
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
                  size="small"
                  onClick={() => onEdit(indicador)}
                  color="warning"
                >
                  <EditIcon fontSize="large" />
                </IconButton>
              </Tooltip>
              <Tooltip
                title={indicador.estado === "Activo" ? "Desactivar" : "Activar"}
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
                  size="small"
                  onClick={() => onDelete(indicador)}
                  color={indicador.estado === "Activo" ? "error" : "success"}
                >
                  <DeleteIcon fontSize="large" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
        meta: { align: "center", width: "150px" },
      },
    ],
    [onEdit, onDelete, onView]
  );

  // Debug: Verificar datos recibidos
  console.log("IndicadorTable - Data recibida:", data);
  console.log("IndicadorTable - Cantidad de registros:", data?.length);

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      rowKeyField="id"
    />
  );
}

