"use client";
import React, { useMemo, useState, SyntheticEvent, useEffect } from 'react';
import DataTable from '@/utils/ui/table/DataTable'; 
import { ColumnDef } from '@tanstack/react-table';
import { Box, Typography } from '@mui/material';
import CustomTab from '@/utils/ui/tab/CustomTab';
import Formato from '@/utils/Formato';
import gestionComercializadorAPI from "@/data/gestionComercializadorAPI";
import type { ViewCuentaCorriente, ViewCuentaCorrienteDetalle } from './types/cuentaCorriente';
import { useAuth } from '@/data/AuthContext';


const formatCurrency = (value: number | string | null | undefined) => {
    // 1. Manejo de valores nulos o indefinidos inmediatamente
    if (value === null || value === undefined) {
        // Retorna 0.00 formateado como moneda
        value = 0;
    }
    const cleanValue = typeof value === 'string' ? value.replace(',', '.') : value;
    const num = parseFloat(String(cleanValue)); 

    const finalNum = isNaN(num) ? 0 : num;

    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(finalNum);
};

type SelectedCtaCte = ViewCuentaCorriente | null;

function CuentaCorrienteComercializador() {
    const { user } = useAuth();

    const [ctacteSelected, setCtacteSelected] = useState<SelectedCtaCte>(null);

     // PAGINACIÓN controlada por componente
    const [PageIndex, setPageIndex] = useState<number>(0);
    const [PageSize, setPageSize] = useState<number>(10);
    const [pageCount, setPageCount] = useState<number>(0);

    // PAGINACIÓN controlada por componente (detalles)
    const [PageIndexDetalle, setPageIndexDetalle] = useState<number>(0);
    const [PageSizeDetalle, setPageSizeDetalle] = useState<number>(10);
    const [pageCountDetalle, setPageCountDetalle] = useState<number>(0);

    // Accede a las propiedades de la sesión con seguridad
    const { empresaCUIT, cuit } = user as any;

    // Clave de persistencia para DataTable (por cuit para no mezclar usuarios)
    const persistKeyForSelection = cuit ? `ctacte_selected_${cuit}` : `ctacte_selected_global`;

    // NOTA: Usamos ctacteSelected?.periodo, y lo convertimos a string si existe.
    // Esto hace que la clave SWR solo se active cuando ctacteSelected.periodo tiene un valor.
    const { data: CtaCteRawData, isLoading: isCtaCteLoading, error: viewCtaCteError, isValidating, mutate: mutateCtaCte } =
    gestionComercializadorAPI.useGetViewCtaCte(cuit ? { CUIL: cuit, page: `${PageIndex},${PageSize}`, sort: "-periodo" } : { page: `${PageIndex},${PageSize}`, sort: "-periodo" });

    const periodoFiltro = ctacteSelected?.periodo || 0;
    
    const { data: CtaCteRawDetalleData, isLoading: isCtaCteDetalleLoading, error: viewCtaCteDetalleError, isValidating: isValidatingDetalle, mutate: mutateCtaCteDetalle } =
    gestionComercializadorAPI.useGetViewCtaCteDetalle(
        // La consulta de detalles solo se ejecuta si hay un periodo seleccionado (periodoFiltro)
        periodoFiltro ? { 
            CUIL: cuit, 
            page: `${PageIndexDetalle},${PageSizeDetalle}`, // Usar la paginación de detalles
            periodo: periodoFiltro, // Filtro por periodo
            sort: "-fecha" // Ordenar por fecha para los detalles es común
        } : undefined // Si no hay periodo seleccionado, no se consulta
    );

    // Este handler ahora solo hace UX: setea seleccionado y abre la pestaña 1
    const onRowClick = (row: ViewCuentaCorriente) => {
        // Guardar la fila seleccionada en el estado (padre)
        setCtacteSelected(row);
        
        // Cambiar a la pestaña de "Detalles" (valor 1)
        //setCurrentTab(1); 
        
        // Reiniciar la paginación de Detalles
        setPageIndexDetalle(0);
        
        console.log("Fila seleccionada (click), Periodo:", row.periodo);
    };

    //#region CTA CTE COMERCIALIZADOR (cálculo pageCount)
    useEffect(() => {
        if (viewCtaCteError) {
            console.error('Error al cargar viewCtaCteError (SWR):', viewCtaCteError);
            return;
        }

        // Normalizar respuesta
        let ctacte: any[] = [];
        const data = CtaCteRawData;
        if (data?.data) ctacte = Array.isArray(data.data) ? data.data : [data.data];
        else if (Array.isArray(data)) ctacte = data;
        else if (data) ctacte = [data];
        
        // Si la API devuelve total/totalRecords/TotalCount calcula pageCount
        const total =
            typeof data?.total === 'number' ? data.total :
            typeof data?.totalCount === 'number' ? data.totalCount :
            typeof data?.TotalCount === 'number' ? data.TotalCount :
            typeof data?.TOTAL === 'number' ? data.TOTAL :
            typeof data?.count === 'number' ? data.count :
            typeof data?.meta?.total === 'number' ? data.meta.total :
            undefined;

        if (typeof total === 'number' && PageSize > 0) {
            setPageCount(Math.ceil(total / PageSize));
        } else {
            // fallback
            setPageCount(ctacte?.length > 0 ? Math.ceil(ctacte.length / PageSize) : 1);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [CtaCteRawData, viewCtaCteError, PageSize]);

    const handlePageChange = (newPageIndex: number) => {
        setPageIndex(newPageIndex);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setPageIndex(0);
    };
    //#endregion


    //#region CTA CTE COMERCIALIZADOR DETALLE (cálculo pageCount detalles)
    useEffect(() => {
        if (viewCtaCteDetalleError) {
            console.error('Error al cargar viewCtaCteErrorDetalle (SWR):', viewCtaCteDetalleError);
            return;
        }

        let ctacteDetalle: any[] = [];
        const data = CtaCteRawDetalleData;
        if (data?.data) ctacteDetalle = Array.isArray(data.data) ? data.data : [data.data];
        else if (Array.isArray(data)) ctacteDetalle = data;
        else if (data) ctacteDetalle = [data];
        
        const total =
            typeof data?.total === 'number' ? data.total :
            typeof data?.totalCount === 'number' ? data.totalCount :
            typeof data?.TotalCount === 'number' ? data.TotalCount :
            typeof data?.TOTAL === 'number' ? data.TOTAL :
            typeof data?.count === 'number' ? data.count :
            typeof data?.meta?.total === 'number' ? data.meta.total :
            undefined;

        if (typeof total === 'number' && PageSizeDetalle > 0) {
            setPageCountDetalle(Math.ceil(total / PageSizeDetalle));
        } else {
            setPageCountDetalle(ctacteDetalle?.length > 0 ? Math.ceil(ctacteDetalle.length / PageSizeDetalle) : 1);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [CtaCteRawDetalleData, viewCtaCteDetalleError, PageSizeDetalle]);

    const handlePageDetalleChange = (newPageIndex: number) => {
        setPageIndexDetalle(newPageIndex);
    };

    const handlePageSizeDetalleChange = (newPageSize: number) => {
        setPageSizeDetalle(newPageSize);
        setPageIndexDetalle(0);
    };
    //#endregion


    const initialTabIndex = 0; // Queremos que inicie en la primera pestaña (0)
    const [currentTab, setCurrentTab] = useState<number>(initialTabIndex);

    // NOTA: NO reseteamos ctacteSelected al cambiar de tab, queremos mantener la selección
    const handleTabChange = (event: SyntheticEvent, newTabValue: string | number) => {
        setCurrentTab(newTabValue as number);
        // no modificar ctacteSelected aquí — la selección se mantiene entre pestañas
    };

    const columns: ColumnDef<ViewCuentaCorriente>[] = useMemo(() => [
        { id: 'periodoCtaCte', header: 'Período', accessorKey: 'periodo', cell: (info: any) => Formato.Fecha(info.getValue(),"MM-YYYY"), meta: { align: 'center'} }, 
        { header: 'Monto', accessorKey: 'monto', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },
        { header: 'Comisión', accessorKey: 'comision', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },
        { header: 'Servicios Adicionales', accessorKey: 'serviciosAdicionales', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },
        { header: 'IVA', accessorKey: 'iva', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },       
        { header: 'Total Sin IVA', accessorKey: 'totalSinIVA', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },       
        { header: 'Total Con IVA', accessorKey: 'totalConIVA', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },       
    ], []);

    const columnsDetalles: ColumnDef<ViewCuentaCorrienteDetalle>[] = useMemo(() => [
        { id: 'periodoDetalle', header: 'Período', accessorKey: 'periodo', cell: (info: any) => Formato.Fecha(info.getValue(),"MM-YYYY"), meta: { align: 'center'} },
        { header: 'Fecha', accessorKey: 'fecha', cell: (info: any) => Formato.Fecha(info.getValue()), meta: { align: 'center'} },
        { header: 'Origen', accessorKey: 'origen', meta: { align: 'center'} },
        { header: 'Nro. Póliza', accessorKey: 'polizaNumero', meta: { align: 'center'} },
        { header: 'CUIT Empleador', accessorKey: 'empleadorCUIT', cell: (info: any) => Formato.CUIP(info.getValue()), meta: { align: 'center'} },
        { header: 'Razón Social', accessorKey: 'razonSocial', meta: { align: 'center'} },
        { header: 'Monto', accessorKey: 'monto', cell: info => formatCurrency(info.getValue() as string), meta: { align: 'center'} },
        { header: 'Comisión', accessorKey: 'comision', cell: info => formatCurrency(info.getValue() as string), meta: { align: 'center'} },
        { header: 'Servicios Adicionales', accessorKey: 'serviciosAdicionales', cell: info => formatCurrency(info.getValue() as string), meta: { align: 'center'} },
        { header: 'IVA', accessorKey: 'iva', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },       
        { header: 'Total Sin IVA', accessorKey: 'totalSinIVA', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },       
        { header: 'Total Con IVA', accessorKey: 'totalConIVA', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },   
        { header: 'Aplica IVA', id: 'aplicaIVA', cell: (info: any) => {const ivaVal = info.row?.original?.iva ?? info.getValue?.(); const num = Number(String(ivaVal ?? 0).replace(',', '.')); return (isNaN(num) || num === 0) ? 'No' : 'Si';}, meta: { align: 'center' } },
    ], []);


    const tabItems = [
        {
            label: 'Estado de Cuenta',
            value: 0,
            content: (

                <DataTable
                    data={CtaCteRawData?.data || []} 
                    columns={columns} 
                    size="mid"
                    isLoading={isCtaCteLoading}
                    onRowClick={onRowClick}
                    manualPagination={true}
                    pageIndex={PageIndex}
                    pageSize={PageSize}
                    pageCount={pageCount}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}

                    /* NUEVAS PROPS para persistir/recordar la fila seleccionada */
                    rowKeyField="periodo"                              /* usamos 'periodo' como clave estable */
                    persistSelectedRowKey={persistKeyForSelection}     /* guarda en localStorage por usuario */
                    onSelectedRowChange={(selectedKey, row) => {
                        // selectedKey: string|null ; row?: TData
                        if (row) {
                            setCtacteSelected(row as ViewCuentaCorriente);
                        } else if (selectedKey === null) {
                            setCtacteSelected(null);
                        } else {
                            // si no vino el row (por ejemplo viene desde persist y aun no hay data),
                            // intentar buscarlo en los datos actuales
                            const found = (CtaCteRawData?.data || []).find((r: any) => String(r.periodo) === String(selectedKey));
                            setCtacteSelected(found ?? null);
                        }
                    }}
                />
            ),
        },
        {
            label: 'Detalles',
            value: 1,
            content: (
                 <DataTable
                    data={CtaCteRawDetalleData?.data || []} 
                    columns={columnsDetalles} 
                    size="mid"
                    isLoading={isCtaCteDetalleLoading || (currentTab === 1 && !ctacteSelected)}
                    manualPagination={true}
                    pageIndex={PageIndexDetalle}
                    pageSize={PageSizeDetalle}
                    pageCount={pageCountDetalle}
                    onPageChange={handlePageDetalleChange}
                    onPageSizeChange={handlePageSizeDetalleChange}
                />
            ),
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            
            <Typography variant="h6" gutterBottom>
                Período seleccionado: {Formato.Fecha(ctacteSelected?.periodo, "MM-YYYY")}
            </Typography>
           
            <CustomTab 
                tabs={tabItems} 
                currentTab={currentTab} 
                onTabChange={handleTabChange}
            /> 

        </div>
    );
}

export default CuentaCorrienteComercializador;
