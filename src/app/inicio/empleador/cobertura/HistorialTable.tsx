"use client";

import React, { useMemo, useState, useEffect } from 'react';
import DataTable from '@/utils/ui/table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import styles from './cobertura.module.css';
import CustomButton from '@/utils/ui/button/CustomButton';
import CustomSelectSearch from '@/utils/ui/form/CustomSelectSearch';
import { useEmpresasStore } from '@/data/empresasStore';
import { Empresa } from '@/data/authAPI';
import ArtAPI from '@/data/artAPI';
import { HistItem } from './types/cobertura';
import Formato from '@/utils/Formato';
import { saveTable, type TableColumn } from '@/utils/excelUtils';

const TODAS_LAS_EMPRESAS: Empresa = { empresaId: 0, cuit: 0, razonSocial: 'Todas las Empresas', domicilio: '', localidad: '', provincia: '' };

export default function HistorialTable({ data, isLoading = false }: { data: HistItem[]; isLoading?: boolean }) {
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(TODAS_LAS_EMPRESAS);

  const opciones = useMemo(() => [TODAS_LAS_EMPRESAS, ...empresas], [empresas]);

  const handleEmpresaChange = (_event: React.SyntheticEvent, newValue: Empresa | null) => {
    setEmpresaSeleccionada(newValue);
  };

  const getEmpresaLabel = (empresa: Empresa | null): string => {
    if (!empresa) return '';
    return String(empresa.razonSocial ?? '');
  };
  const columns: ColumnDef<HistItem>[] = useMemo(() => [
    { header: 'Nro. Certificado', accessorKey: 'interno' },
    { header: 'CUIT Empleador', accessorKey: 'cuitEmpleador', cell: (info) => Formato.CUIP(info.getValue()) },
    { header: 'Póliza', accessorKey: 'poliza' },
    { header: 'Razón Social', accessorKey: 'razonSocial' },
    { header: 'Destinatario', accessorKey: 'destinatario' },
    { header: 'Tipo Certificado', accessorKey: 'tipoCertificado' },
    { header: 'Fecha y Hora de Creación', accessorKey: 'createdAt', cell: (info) => Formato.FechaHora(info.getValue()), meta: { align: 'center' } },
  ], []);

  const [rows, setRows] = useState<HistItem[]>(data);
  const [pageCount, setPageCount] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!empresaSeleccionada) {
      setRows([]);
      setPageCount(1);
      return;
    }
    setLoading(true);
    void ArtAPI.getCobertura({ cuit: empresaSeleccionada.cuit || undefined, pageIndex: page, pageSize: 10, orderBy: '-fechaHora' }).then((resp) => {
      const { data, pages } = resp as { data: HistItem[]; pages: number };
      setRows(data);
      setPageCount(pages);
      setLoading(false);
    });
  }, [empresaSeleccionada, page]);

  useEffect(() => { setPage(1); }, [empresaSeleccionada]);

  const handleExportExcel = async () => {
    const { data: allRows } = (await ArtAPI.getCobertura({ cuit: empresaSeleccionada?.cuit || undefined, orderBy: '-fechaHora' })) as { data: HistItem[] };
    const columnsExcel: Record<string, TableColumn> = {
      interno: { header: 'Nro. Certificado', key: 'interno' },
      cuitEmpleador: { header: 'CUIT Empleador', key: 'cuitEmpleador' },
      poliza: { header: 'Póliza', key: 'poliza' },
      razonSocial: { header: 'Razón Social', key: 'razonSocial' },
      destinatario: { header: 'Destinatario', key: 'destinatario' },
      tipoCertificado: { header: 'Tipo Certificado', key: 'tipoCertificado' },
      createdAt: { header: 'Fecha y Hora de Creación', key: 'createdAt' },
    };
    const rowsExcel = allRows.map((row) => ({
      ...row,
      cuitEmpleador: Formato.CUIP(row.cuitEmpleador),
      createdAt: Formato.FechaHora(row.createdAt),
    }));
    await saveTable(columnsExcel, rowsExcel, 'HistorialCertificadosCobertura.xlsx', { format: 'xlsx', sheet: { name: 'Historial' } });
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div className={styles.empresaSelectorContainer}>
        <CustomSelectSearch<Empresa>
          options={opciones}
          getOptionLabel={getEmpresaLabel}
          value={empresaSeleccionada}
          onChange={handleEmpresaChange}
          label="Seleccionar Empresa"
          placeholder="Buscar empresa..."
          loading={isLoadingEmpresas}
        />
      </div>
      <div className={styles.exportButtonContainer}>
        <CustomButton onClick={handleExportExcel} disabled={loading || rows.length === 0}>
          Exportar a Excel
        </CustomButton>
      </div>
      <DataTable data={rows} columns={columns} size="mid" isLoading={isLoading || loading} manualPagination pageIndex={page} pageSize={10} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
