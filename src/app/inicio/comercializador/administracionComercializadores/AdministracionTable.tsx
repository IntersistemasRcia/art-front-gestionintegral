"use client";

import React, { useMemo, SyntheticEvent } from "react";
import DataTable from '@/utils/ui/table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import CustomTab from '@/utils/ui/tab/CustomTab';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { IoMdEye } from "react-icons/io";
import { MdEdit, MdGroupRemove } from "react-icons/md";
import { CUIP } from "@/utils/Formato";
import type { VComercializadorRow, EditKind, ComercializadoresOrganizadoresRow, ComercializadoresGOrganizadoresRow } from "@/app/inicio/comercializador/administracionComercializadores/types/administracionUsuarios";
import styles from "./administracionUsuarios.module.css";

interface AdministracionTableProps {
  currentTab: number;
  onTabChange: (_event: SyntheticEvent, newTabValue: string | number) => void;
  organizadorFilterText: string;
  comercializadorFilterText: string;
  grupoRows: ComercializadoresGOrganizadoresRow[];
  organizadorRows: ComercializadoresOrganizadoresRow[];
  comercializadorRows: VComercializadorRow[];
  isLoadingGrupoTable: boolean;
  isLoadingOrganizador: boolean;
  isLoadingComercializador: boolean;
  selectedGrupoRowKey: string | null;
  selectedOrganizadorRowKey: string | null;
  onGrupoRowSelect: (key: string | number | null, row?: ComercializadoresGOrganizadoresRow) => void;
  onOrganizadorRowSelect: (key: string | number | null, row?: ComercializadoresOrganizadoresRow) => void;
  onViewRow: (row: ComercializadoresGOrganizadoresRow | ComercializadoresOrganizadoresRow | VComercializadorRow, kind: EditKind) => void;
  onEditRow: (row: ComercializadoresGOrganizadoresRow | ComercializadoresOrganizadoresRow | VComercializadorRow, kind: EditKind) => void;
  onDeleteRow: (row: ComercializadoresGOrganizadoresRow | ComercializadoresOrganizadoresRow | VComercializadorRow, kind: EditKind) => void;
  hasTask: (task: string) => boolean;
  isGrupoOrganizador: boolean;
  isOrganizadorComercializador: boolean;
  isDeletingGrupo: boolean;
  isDeletingOrganizador: boolean;
  isDeletingComercializador: boolean;
}

export default function AdministracionTable({
  currentTab,
  onTabChange,
  organizadorFilterText,
  comercializadorFilterText,
  grupoRows,
  organizadorRows,
  comercializadorRows,
  isLoadingGrupoTable,
  isLoadingOrganizador,
  isLoadingComercializador,
  selectedGrupoRowKey,
  selectedOrganizadorRowKey,
  onGrupoRowSelect,
  onOrganizadorRowSelect,
  onViewRow,
  onEditRow,
  onDeleteRow,
  hasTask,
  isGrupoOrganizador,
  isOrganizadorComercializador,
  isDeletingGrupo,
  isDeletingOrganizador,
  isDeletingComercializador,
}: AdministracionTableProps) {
  const columnsGrupo = useMemo<ColumnDef<ComercializadoresGOrganizadoresRow, any>[]>(
    () => [
      { accessorKey: 'cuil', header: 'CUIT/CUIL', cell: ({ row }) => CUIP(row.original.cuil) },
      { accessorKey: 'razonSocial', header: 'Nombre' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'telefono', header: 'Teléfono' },
      { accessorKey: 'estado', header: 'Estado' },
      {
        id: 'accion',
        header: 'Acción',
        meta: { width: "8%" , align: "center"},
        cell: ({ row }) => (
          <Box className={styles.actionButtons}>
            <Tooltip title="Ver" arrow slotProps={{ tooltip: { className: styles.actionTooltip } }}>
              <IconButton
                size="medium"
                disabled={!hasTask("Comercializador_Administracion_AccionVer")}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewRow(row.original, "grupo");
                }}
              >
                <IoMdEye className={styles.actionIcon} />
              </IconButton>
            </Tooltip>
            {String(row.original.cuil ?? '').replace(/\D/g, '') !== '0' && (
              <Tooltip title="Editar" arrow slotProps={{ tooltip: { className: styles.actionTooltip } }}>
                <IconButton
                  size="medium"
                  disabled={isOrganizadorComercializador || !hasTask("Comercializador_Administracion_AccionEditar")}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isOrganizadorComercializador) return;
                    onEditRow(row.original, "grupo");
                  }}
                >
                  <MdEdit className={styles.actionIcon} />
                </IconButton>
              </Tooltip>
            )}
            {String(row.original.cuil ?? '').replace(/\D/g, '') !== '0' && (
              <Tooltip title="Dar de baja" arrow slotProps={{ tooltip: { className: styles.actionTooltip } }}>
                <IconButton
                  size="medium"
                  color="error"
                  disabled={isDeletingGrupo || isGrupoOrganizador || isOrganizadorComercializador || !hasTask("Comercializador_Administracion_AccionEliminar")}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isGrupoOrganizador || isOrganizadorComercializador) return;
                    onDeleteRow(row.original, "grupo");
                  }}
                >
                  <MdGroupRemove className={styles.actionIcon} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [hasTask, isDeletingGrupo, isGrupoOrganizador, isOrganizadorComercializador, onDeleteRow, onEditRow, onViewRow]
  );

  const columnsOrganizador = useMemo<ColumnDef<ComercializadoresOrganizadoresRow, any>[]>(
    () => [
      { accessorKey: 'cuil', header: 'CUIT/CUIL', cell: ({ row }) => CUIP(row.original.cuil) },
      { accessorKey: 'razonSocial', header: 'Nombre' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'telefono', header: 'Teléfono' },
      { accessorKey: 'estado', header: 'Estado' },
      {
        id: 'accion',
        header: 'Acción',
        meta: { width: "8%" , align: "center"},
        cell: ({ row }) => (
          <Box className={styles.actionButtons}>
            <Tooltip title="Ver" arrow slotProps={{ tooltip: { className: styles.actionTooltip } }}>
              <IconButton
                size="medium"
                disabled={!hasTask("Comercializador_Administracion_AccionVer")}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewRow(row.original, "organizador");
                }}
              >
                <IoMdEye className={styles.actionIcon} />
              </IconButton>
            </Tooltip>
            {String(row.original.cuil ?? '').replace(/\D/g, '') !== '0' && (
              <Tooltip title="Editar" arrow slotProps={{ tooltip: { className: styles.actionTooltip } }}>
                <IconButton
                  size="medium"
                  disabled={!hasTask("Comercializador_Administracion_AccionEditar")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditRow(row.original, "organizador");
                  }}
                >
                  <MdEdit className={styles.actionIcon} />
                </IconButton>
              </Tooltip>
            )}
            {String(row.original.cuil ?? '').replace(/\D/g, '') !== '0' && (
              <Tooltip title="Dar de baja" arrow slotProps={{ tooltip: { className: styles.actionTooltip } }}>
                <IconButton
                  size="medium"
                  color="error"
                  disabled={isDeletingOrganizador || isOrganizadorComercializador || !hasTask("Comercializador_Administracion_AccionEliminar")}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isOrganizadorComercializador) return;
                    onDeleteRow(row.original, "organizador");
                  }}
                >
                  <MdGroupRemove className={styles.actionIcon} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [hasTask, isDeletingOrganizador, isOrganizadorComercializador, onDeleteRow, onEditRow, onViewRow]
  );

  const columnsComercializador = useMemo<ColumnDef<VComercializadorRow, any>[]>(
    () => [
      { accessorKey: 'cuil', header: 'CUIT/CUIL', cell: ({ row }) => CUIP(row.original.cuil) },
      { accessorKey: 'referenteRazonSocial', header: 'Nombre' },
      { accessorKey: 'matricula', header: 'Matrícula' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'telefono', header: 'Teléfono' },
      { accessorKey: 'estado', header: 'Estado' },
      {
        id: 'accion',
        header: 'Acción',
        meta: { width: "8%" , align: "center"},
        cell: ({ row }) => (
          <Box className={styles.actionButtons}>
            <Tooltip title="Ver" arrow slotProps={{ tooltip: { className: styles.actionTooltip } }}>
              <IconButton
                size="medium"
                disabled={!hasTask("Comercializador_Administracion_AccionVer")}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewRow(row.original, "comercializador");
                }}
              >
                <IoMdEye className={styles.actionIcon} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar" arrow slotProps={{ tooltip: { className: styles.actionTooltip } }}>
              <IconButton
                size="medium"
                disabled={!hasTask("Comercializador_Administracion_AccionEditar")}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditRow(row.original, "comercializador");
                }}
              >
                <MdEdit className={styles.actionIcon} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Dar de baja" arrow slotProps={{ tooltip: { className: styles.actionTooltip } }}>
              <IconButton
                size="medium"
                color="error"
                disabled={isDeletingComercializador || !hasTask("Comercializador_Administracion_AccionEliminar")}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRow(row.original, "comercializador");
                }}
              >
                <MdGroupRemove className={styles.actionIcon} />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    [hasTask, isDeletingComercializador, onDeleteRow, onEditRow, onViewRow]
  );

  const tabItems = [
    {
      label: 'Grupo',
      value: 0,
      content: (
        <>
          <DataTable<ComercializadoresGOrganizadoresRow>
            data={grupoRows}
            columns={columnsGrupo}
            size="mid"
            isLoading={isLoadingGrupoTable}
            rowKeyField="interno"
            selectedRowKeyProp={selectedGrupoRowKey}
            onSelectedRowChange={(key, row) => {
              if (!row) return;
              onGrupoRowSelect(key, row);
            }}
          />
        </>
      ),
    },
    {
      label: 'Organizador',
      value: 1,
      content: (
        <>
          <Typography className={styles.filterInfoText}>
            {organizadorFilterText}
          </Typography>
          <DataTable<ComercializadoresOrganizadoresRow>
            data={organizadorRows}
            columns={columnsOrganizador}
            size="mid"
            isLoading={isLoadingOrganizador}
            rowKeyField="interno"
            selectedRowKeyProp={selectedOrganizadorRowKey}
            onSelectedRowChange={(key, row) => {
              if (!row) return;
              onOrganizadorRowSelect(key, row);
            }}
          />
        </>
      ),
    },
    {
      label: 'Comercializador',
      value: 2,
      content: (
        <>
          <Typography className={styles.filterInfoText}>
            {comercializadorFilterText}
          </Typography>
          <DataTable<VComercializadorRow>
            data={comercializadorRows}
            columns={columnsComercializador}
            size="mid"
            isLoading={isLoadingComercializador}
          />
        </>
      ),
    },
  ];

  return <CustomTab tabs={tabItems} currentTab={currentTab} onTabChange={onTabChange} />;
}