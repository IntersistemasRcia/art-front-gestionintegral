"use client";
import React, { useMemo, useState, SyntheticEvent, useEffect, useRef } from 'react';
import DataTable from '@/utils/ui/table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Box, Typography } from '@mui/material';
import CustomTab from '@/utils/ui/tab/CustomTab';
import Formato from '@/utils/Formato';
import gestionEmpleadorAPI from "@/data/gestionEmpleadorAPI";
import type { CuentaCorrienteRegistro, DDJJRegistro } from './types/cuentaCorriente';
import ExportButtons from './components/ExportButtons';
import { useEmpresasStore } from "@/data/empresasStore";
import { Empresa } from "@/data/authAPI";
import CustomSelectSearch from "@/utils/ui/form/CustomSelectSearch";
import { useSearchParams } from 'next/navigation';
import ArtAPI from "@/data/artAPI";



// Funciones auxiliares para parsear y formatear números asegurando coma decimal
const parseToNumber = (value: unknown): number => {
    const s = String(value ?? '').trim();
    if (s === '') return NaN;

    const hasDot = s.indexOf('.') !== -1;
    const hasComma = s.indexOf(',') !== -1;

    let normalized = s;
    if (hasDot && hasComma) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else if (hasComma && !hasDot) {
        // "1234,56" -> "1234.56"
        normalized = normalized.replace(',', '.');
    }

    return parseFloat(normalized);
};

const formatCurrency = (value: unknown) => {
    const num = typeof value === 'number' ? value : parseToNumber(value);

    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(isNaN(num) ? 0 : num);
};

const formatDecimal = (
    value: unknown,
    options: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 6 }
) => {
    const num = typeof value === 'number' ? value : parseToNumber(value);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('es-AR', options).format(num);
};

const normalizeDigits = (value: unknown) => String(value ?? '').replace(/\D/g, '');

const PAGE_SIZE = 10;

// ----------------------------------------------------
// 3. DEFINICIÓN DE COLUMNAS Y COMPONENTE
// ----------------------------------------------------
function CuentaCorrientePage() {
    const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
    const searchParams = useSearchParams();
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
    const seleccionAutomaticaRef = useRef(false);
    const [pageIndex, setPageIndex] = useState(0);

    const cuitQuery = searchParams?.get('cuit') ?? '';
    const cuitDesdeQuery = normalizeDigits(cuitQuery);
    const bloquearBusquedaPorCuit = Boolean(cuitDesdeQuery);

    // Seleccionar automáticamente si solo hay una empresa o fijar empresa por CUIT cuando viene desde comercializador
    useEffect(() => {
        if (isLoadingEmpresas) return;

        if (cuitDesdeQuery) {
            const match = empresas.find((e) => normalizeDigits(e.cuit) === cuitDesdeQuery);
            if (match) {
                setEmpresaSeleccionada(match);
                seleccionAutomaticaRef.current = true;
            }
            return;
        }
            if (empresas.length === 1) {
                setEmpresaSeleccionada(empresas[0]);
                seleccionAutomaticaRef.current = true;
            } else if (empresas.length !== 1 && seleccionAutomaticaRef.current) {
                setEmpresaSeleccionada(null);
                seleccionAutomaticaRef.current = false;
            }
        
    }, [empresas, isLoadingEmpresas, cuitDesdeQuery]);

    const handleEmpresaChange = (
        _event: React.SyntheticEvent,
        newValue: Empresa | null
    ) => {
        if (bloquearBusquedaPorCuit) return;
        setEmpresaSeleccionada(newValue);
        seleccionAutomaticaRef.current = false;
        setPageIndex(0);
    };

    const getEmpresaLabel = (empresa: Empresa | null): string => {
        if (!empresa) return "";
        return `${empresa.razonSocial}`;
    };
    const cuitEmpresaSeleccionada = empresaSeleccionada?.cuit ? normalizeDigits(empresaSeleccionada.cuit) : '';
    const cuitFinalStr = cuitDesdeQuery || cuitEmpresaSeleccionada;
    const cuitFinal = cuitFinalStr ? Number(cuitFinalStr) : undefined;

    const { data: polizaRawData } = gestionEmpleadorAPI.useGetPoliza(
        cuitFinal ? { CUIT: cuitFinal } : {}
    );
    const ddJJParams = cuitFinal
        ? { cuit: [cuitFinal], pageIndex: pageIndex + 1, pageSize: PAGE_SIZE, orderBy: '-periodo' }
        : null;

    const { data: ddJJRawData, isLoading: isCtaCteLoading } = ArtAPI.useVEmpleadorDDJJ(ddJJParams);
    useEffect(() => {
        if (!bloquearBusquedaPorCuit) return;
        if (empresaSeleccionada) return;

        const razonSocial = (polizaRawData as any)?.empleador_Denominacion;
        if (!razonSocial) return;

        setEmpresaSeleccionada({ razonSocial: String(razonSocial) } as Empresa);
    }, [bloquearBusquedaPorCuit, empresaSeleccionada, polizaRawData]);

    const rawRows = useMemo(() => ddJJRawData?.data ?? [], [ddJJRawData]);
    const pageCount = ddJJRawData?.pages ?? 0;

    // Normaliza nombres de campo (la API nueva usa camelCase distinto al GET original)
    const computedData = useMemo(() => {
        const poliza = polizaRawData as { cuit?: number; empleador_Denominacion?: string } | undefined;

        return rawRows.map((r: any) => {
            const totalPagado = isNaN(parseToNumber(r.totalPagadoCuota)) ? 0 : parseToNumber(r.totalPagadoCuota);
            const totalCuota = isNaN(parseToNumber(r.totalCuota)) ? 0 : parseToNumber(r.totalCuota);
            const saldoMensual = totalPagado - totalCuota;

            return {
                ...r,
                // Normalizar nombres que cambiaron entre GET y POST
                origenDDJJ: r.origenDDJJ ?? r.origenDdjj,
                totalDevengadoFFEP: r.totalDevengadoFFEP ?? r.totalDevengadoFfep,
                totalPagadoFFEP: r.totalPagadoFFEP ?? r.totalPagadoFfep,
                primaAPagar: r.primaAPagar ?? r.primaApagar,
                cuit: r.cuit ?? poliza?.cuit,
                empleador_Denominacion: r.empleador_Denominacion ?? poliza?.empleador_Denominacion,
                saldoMensual,
            };
        });
    }, [rawRows, polizaRawData]);

    // 1. CONTROL DE LA PESTAÑA: Usamos useState para el valor numérico
    // Iniciamos con 0 si queremos 'Estado de Cuenta', o 1 si queremos 'Últimas DDJJ'
    const initialTabIndex = 0; // Queremos que inicie en la primera pestaña (0)
    const [currentTab, setCurrentTab] = useState<number>(initialTabIndex);

    // 2. HANDLER DE CAMBIO: Convertimos el valor (string) que devuelve MUI a number
    const handleTabChange = (event: SyntheticEvent, newTabValue: string | number) => {
        setCurrentTab(newTabValue as number);
    };

    const sumarleUnMesAlPeriodo = (periodo: unknown) => {
        const periodoStr = String(periodo ?? '');

        if (periodoStr.length < 6) {
            console.error("El periodo no tiene el formato AAAAMM válido.");
            return null; // O devuelve un valor por defecto o lanza un error
        }

        const anio = parseInt(periodoStr.substring(0, 4), 10);
        const mes = parseInt(periodoStr.substring(4, 6), 10);

        // El resto de la lógica permanece igual
        const fecha = new Date(anio, mes - 1, 1);
        fecha.setMonth(fecha.getMonth() + 1);
        const nuevoAnio = fecha.getFullYear();
        const nuevoMes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        
        return `${nuevoAnio}${nuevoMes}`;
    }

    const columns: ColumnDef<CuentaCorrienteRegistro>[] = useMemo(() => [
        { header: 'CUIT', accessorKey: 'cuit', cell: info => Formato.CUIP(info.getValue<number>()), meta: { align: 'center'} },
        { header: 'Razón Social', accessorKey: 'empleador_Denominacion', meta: { align: 'center'} },
        { id: 'periodoCobertura', header: () => <>Período<br />Cobertura</>, accessorKey: 'periodo', cell: (info: any) => Formato.Fecha(sumarleUnMesAlPeriodo(info.getValue() as any) as any,"MM-YYYY"), meta: { align: 'center'} }, //DEBO RESTAR UN MES AL VALOR
        { id: 'periodoDDJJ', header: () => <>Período<br />DDJJ</>, accessorKey: 'periodo', cell: (info: any) => Formato.Fecha(info.getValue() as any,"MM-YYYY"), meta: { align: 'center'} },
        { header: () => <>Fecha<br />Pres.</>, accessorKey: 'presentacion', cell: (info: any) => Formato.Fecha(info.getValue() as any), meta: { align: 'center'} },
        { header: 'Tipo', accessorKey: 'origenDDJJ', meta: { align: 'center'} },
        { header: 'Masa Salarial', accessorKey: 'masaSalarial', cell: info => formatCurrency(info.getValue()), meta: { align: 'center'} },
        { header: () => <>Cant.<br />Trab.</>, accessorKey: 'cantidadTrabajadores', meta: { align: 'center'} },
        { header: 'Alic. Fija', accessorKey: 'alicuotaFijaVigenteTrabajador', cell: info => formatDecimal(info.getValue()), meta: { align: 'center'} },
        { header: 'Alic. Var.', accessorKey: 'alicuotaVariableVigenteSobreMasaSalarial', cell: info => formatDecimal(info.getValue()), meta: { align: 'center'} },
        { header: () => <>Alic. Fija +<br />FFEP Dec.</>, accessorKey: 'alicuotaFijaDeclaradaTrabajador', cell: info => formatDecimal(info.getValue()), meta: { align: 'center'} },
        { header: () => <>Alic. Var.<br />Declarada</>, accessorKey: 'alicuotaVariableDeclaradaMasaSalarial', cell: info => formatDecimal(info.getValue()), meta: { align: 'center'} },
        { header: () => <>Premio A<br />Pagar</>, accessorKey: 'primaAPagar', cell: info => formatCurrency(info.getValue()), meta: { align: 'center'} },
        { header: () => <>Total Dev.<br />FFEP</>, accessorKey: 'totalDevengadoFFEP', cell: info => formatCurrency(info.getValue()), meta: { align: 'center'} },
        { header: 'FFEP S/Res', accessorKey: 'ffep', cell: info => formatCurrency(info.getValue()), meta: { align: 'center'} },
        { header: () => <>Total Cuota<br />a Pagar</>, accessorKey: 'totalCuota', cell: info => formatCurrency(info.getValue()), meta: { align: 'center'} },
        { header: () => <>Total Pagado<br />Cuota</>, accessorKey: 'totalPagadoCuota', cell: info => formatCurrency(info.getValue()), meta: { align: 'center'} },
        { header: () => <>Saldo<br />Mensual</>, accessorKey: 'saldoMensual',
            cell: info => {
                // Usamos el campo calculado `saldoMensual`
                const mensual = Number(info.row.original?.saldoMensual ?? info.getValue() ?? 0);
                const style = mensual < 0 ? { color: 'red', fontWeight: 'bold' } : {};
                return <span style={style}>{formatCurrency(mensual)}</span>;
            }
            , meta: { align: 'center'} },
        { header: () => <>Saldo<br />Acumulado</>, accessorKey: 'saldoAcumulado', cell: info => formatCurrency(info.row.original?.saldoAcumulado ?? info.getValue()), meta: { align: 'center'} },
    ], []);

    const columnsDDJJ: ColumnDef<DDJJRegistro>[] = useMemo(() => [
        { header: 'CUIT', accessorKey: 'cuit', cell: info => Formato.CUIP(info.getValue<number>()), meta: { align: 'center'} },
        { header: 'Razón Social', accessorKey: 'empleador_Denominacion', meta: { align: 'center'} },
        { header: 'Período DDJJ', accessorKey: 'periodo', cell: (info: any) => Formato.Fecha(info.getValue() as any,"MM-YYYY"), meta: { align: 'center'} },
        { header: 'Presentación', accessorKey: 'presentacion', cell: (info: any) => Formato.Fecha(info.getValue() as any), meta: { align: 'center'} },
        { header: 'Tipo', accessorKey: 'origenDDJJ', meta: { align: 'center'} },
        { header: 'Alic. Fija', accessorKey: 'alicuotaFijaDeclaradaTrabajador', cell: info => formatDecimal(info.getValue()), meta: { align: 'center'} },
        { header: 'Alic. Variable', accessorKey: 'alicuotaVariableDeclaradaMasaSalarial', cell: info => formatDecimal(info.getValue()), meta: { align: 'center'} },
        { header: 'Cant. Trabajadores', accessorKey: 'cantidadTrabajadores', meta: { align: 'center'} },
        { header: 'Masa Salarial', accessorKey: 'masaSalarial', cell: info => formatCurrency(info.getValue()), meta: { align: 'center'} },
    ], []);

    const tabItems = [
        {
            label: 'Estado de Cuenta',
            value: 0,
            content: (
                <>
                    <DataTable
                        data={computedData || []}
                        columns={columns}
                        pageSizeOptions={[PAGE_SIZE]}
                        size="mid"
                        isLoading={isCtaCteLoading}
                        manualPagination
                        pageIndex={pageIndex + 1}
                        pageSize={PAGE_SIZE}
                        pageCount={pageCount}
                        onPageChange={(newPage) => setPageIndex(newPage - 1)}
                    />
                    <ExportButtons
                        data={computedData || []}
                        type="estadoCuenta"
                        sumarleUnMesAlPeriodo={sumarleUnMesAlPeriodo}
                    />
                </>
            ),
        },
        {
            label: 'Últimas DDJJ',
            value: 1,
            content: (
                <>
                    <DataTable
                        data={computedData || []}
                        columns={columnsDDJJ}
                        pageSizeOptions={[PAGE_SIZE]}
                        size="mid"
                        isLoading={isCtaCteLoading}
                        manualPagination
                        pageIndex={pageIndex + 1}
                        pageSize={PAGE_SIZE}
                        pageCount={pageCount}
                        onPageChange={(newPage) => setPageIndex(newPage - 1)}
                    />
                    <ExportButtons
                        data={computedData || []}
                        type="ultimasDDJJ"
                    />
                </>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <Box sx={{ maxWidth: 500, marginBottom: 2 }}>
                <CustomSelectSearch<Empresa>
                    options={empresas}
                    getOptionLabel={getEmpresaLabel}
                    value={empresaSeleccionada}
                    onChange={handleEmpresaChange}
                    label="Seleccionar Empresa"
                    placeholder="Buscar empresa..."
                    loading={isLoadingEmpresas}
                    loadingText="Cargando empresas..."
                    noOptionsText={
                        isLoadingEmpresas
                            ? "Cargando..."
                            : empresas.length === 0
                            ? "No hay empresas disponibles"
                            : "No se encontraron empresas"
                    }
                            disabled={isLoadingEmpresas || bloquearBusquedaPorCuit}
                />
            </Box>

            <CustomTab 
                tabs={tabItems}
                currentTab={currentTab}
                onTabChange={handleTabChange}
            /> 

            {/* Mensaje de Advertencia */}
            <Typography variant="body1" gutterBottom style={{ marginBottom: '20px', fontSize: '0.9rem', marginTop: '16px' }}>
                En caso de presentar deuda tenga en cuenta que la misma se ajustará por intereses al momento de realizar el pago.
            </Typography>

        </div>
    );
}

export default CuentaCorrientePage;