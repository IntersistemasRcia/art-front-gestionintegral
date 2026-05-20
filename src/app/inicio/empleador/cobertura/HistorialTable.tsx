"use client";

import React, { useMemo, useState, useEffect } from 'react';
import DataTable from '@/utils/ui/table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import styles from './cobertura.module.css';
import CustomSelectSearch from '@/utils/ui/form/CustomSelectSearch';
import { useEmpresasStore } from '@/data/empresasStore';
import { Empresa } from '@/data/authAPI';
import ArtAPI from '@/data/artAPI';
import { HistItem } from './types/cobertura';
import Formato from '@/utils/Formato';

export default function HistorialTable({ data, isLoading = false }: { data: HistItem[]; isLoading?: boolean }) {
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);

  const handleEmpresaChange = (_event: React.SyntheticEvent, newValue: Empresa | null) => {
    setEmpresaSeleccionada(newValue);
  };

  const getEmpresaLabel = (empresa: Empresa | null): string => {
    if (!empresa) return '';
    return String(empresa.razonSocial ?? '');
  };
  const columns: ColumnDef<HistItem>[] = useMemo(() => [
    { header: 'CUIT Empleador', accessorKey: 'cuitEmpleador', cell: (info) => Formato.CUIP(info.getValue()) },
    { header: 'Póliza', accessorKey: 'poliza' },
    { header: 'Razón Social', accessorKey: 'razonSocial' },
    { header: 'Destinatario', accessorKey: 'destinatario' },
    { header: 'Tipo Certificado', accessorKey: 'tipoCertificado' },
    { header: 'Fecha y Hora de Creación', accessorKey: 'createdAt', cell: (info) => Formato.FechaHora(info.getValue()), meta: { align: 'center' } },
  ], []);

  const [rows, setRows] = useState<HistItem[]>(data);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!empresaSeleccionada) return;
    setLoading(true);
    void ArtAPI.getCobertura({ cuit: empresaSeleccionada.cuit }).then((resp) => {
      setRows(resp as HistItem[]);
      setLoading(false);
    });
  }, [empresaSeleccionada]);

  return (
    <div style={{ marginTop: 12 }}>
      <div className={styles.empresaSelectorContainer}>
        <CustomSelectSearch<Empresa>
          options={empresas}
          getOptionLabel={getEmpresaLabel}
          value={empresaSeleccionada}
          onChange={handleEmpresaChange}
          label="Seleccionar Empresa"
          placeholder="Buscar empresa..."
          loading={isLoadingEmpresas}
        />
      </div>
      <DataTable data={rows} columns={columns} size="mid" isLoading={isLoading || loading} />
    </div>
  );
}
