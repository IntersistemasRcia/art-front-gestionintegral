"use client";
import React, { useMemo, useState, SyntheticEvent, useEffect } from 'react';
import DataTable from '@/utils/ui/table/DataTable'; 
import { ColumnDef } from '@tanstack/react-table';
import { Box, Typography } from '@mui/material';
import CustomTab from '@/utils/ui/tab/CustomTab';
import Formato from '@/utils/Formato';
import type { ViewCuentaCorriente, ComercializadorPeriodoPago, ParametersComercializadorPeriodoPago } from './types/cuentaCorriente';
import { useAuth } from '@/data/AuthContext';
import ArtAPI from '@/data/artAPI';
import CustomSelectSearch from '@/utils/ui/form/CustomSelectSearch';
import styles from './cuentaCorriente.module.css';


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

function digits(value: unknown) {
    return String(value ?? '').replace(/\D/g, '');
}

function CuentaCorrienteComercializador() {
    const { user } = useAuth();

    const rol = String((user as any)?.rol ?? '').toLowerCase();
    const cuil = Number(digits((user as any)?.cuit ?? (user as any)?.CUIL ?? (user as any)?.cuil ?? 0));

    const isAdmin = rol === 'administrador' || rol === 'administradorart';
    const isAdminComercializador = rol === 'administradorcomercializador';
    const isAdministradorART = rol === 'administradorart';
    const isGrupoOrganizador = rol === 'grupoorganizador';
    const isOrganizadorComercializador = rol === 'organizadorcomercializador';
    const isComercializador = rol === 'comercializador';
    const isAdminLevel = isAdmin || isAdminComercializador || isAdministradorART;

    const [grupo, setGrupo] = useState<any>(null);
    const [organizador, setOrganizador] = useState<any>(null);
    const [comercializador, setComercializador] = useState<any>(null);

    const [periodoPagoSelected, setPeriodoPagoSelected] = useState<ComercializadorPeriodoPago | null>(null);
    const [empleadorPagoSelected, setEmpleadorPagoSelected] = useState<any>(null);

     // PAGINACIÓN controlada por componente
    const [PageIndex, setPageIndex] = useState<number>(0);
    const [PageSize, setPageSize] = useState<number>(10);
    const [pageCount, setPageCount] = useState<number>(0);

    // PAGINACIÓN controlada por componente (detalles)
    const [PageIndexDetalle, setPageIndexDetalle] = useState<number>(0);
    const [PageSizeDetalle, setPageSizeDetalle] = useState<number>(10);
    const [pageCountDetalle, setPageCountDetalle] = useState<number>(0);

    // Accede a las propiedades de la sesión con seguridad

    const { data: gOrgData } = ArtAPI.useGetGOrganizadorURL(
        isAdminLevel ? ({} as any) : isGrupoOrganizador ? ({ CUIL: cuil } as any) : ({} as any)
    );

    const { data: organizadorMeData } = ArtAPI.useGetOrganizadorURL(
        isOrganizadorComercializador ? ({ CUIL: cuil } as any) : ({} as any)
    );

    const { data: comercializadorMeData } = ArtAPI.useGetComercializadorURL(
        isComercializador ? ({ CUIL: cuil } as any) : ({} as any)
    );

    const comercializadorMe = useMemo(() => (comercializadorMeData?.[0] ?? null) as any, [comercializadorMeData]);
    const organizadorMe = useMemo(() => (organizadorMeData?.[0] ?? null) as any, [organizadorMeData]);

    const grupoById = ArtAPI.useGetGOrganizadorById(
        isOrganizadorComercializador && organizadorMe
            ? { id: organizadorMe.srtComercializadorGOrganizadorInterno }
            : undefined
    ).data;

    const grupoFromComercializador = isComercializador
        ? ({
            interno: Number((comercializadorMe as any)?.srtComercializadorGOrganizadorInterno ?? 0),
            descripcion: String((comercializadorMe as any)?.comercializadorGOrganizadorDescripcion ?? ''),
        } as any)
        : null;

    const organizadorFromComercializador = isComercializador
        ? ({
            interno: Number((comercializadorMe as any)?.srtComercializadorOrganizadorInterno ?? 0),
            descripcion: String((comercializadorMe as any)?.comercializadorOrganizadorDescripcion ?? ''),
        } as any)
        : null;

    const grupoValue = isAdminLevel
        ? grupo
        : isGrupoOrganizador
            ? (gOrgData?.[0] ?? null)
            : isComercializador
                ? grupoFromComercializador
                : isOrganizadorComercializador
                    ? grupoById
                    : null;

    const grupoInterno = Number((grupoValue as any)?.interno ?? 0);

    const organizadorValue = isAdminLevel
        ? organizador
        : isOrganizadorComercializador
            ? organizadorMe
            : isComercializador
                ? organizadorFromComercializador
                : organizador;

    const { data: organizadoresData } = ArtAPI.useGetOrganizadorURL(
        grupoValue && !isOrganizadorComercializador && !isComercializador
            ? ({ SRTComercializadorGOrganizadorInterno: grupoInterno || 0 } as any)
            : ({} as any)
    );

    const organizadoresInternos = useMemo(() => {
        const list = (organizadoresData ?? []) as any[];
        return list.length ? list.map((x) => String(x.interno)).join(',') : undefined;
    }, [organizadoresData]);

    const { data: comercializadoresData, isLoading: comercializadoresLoading } = ArtAPI.useGetComercializadorURL(
        isComercializador
            ? ({ CUIL: cuil } as any)
            : (organizadorValue
                ? ({ ComercializadoresOrganizadoresInternos: String((organizadorValue as any)?.interno ?? 0) } as any)
                : (grupoValue
                    ? ({ ComercializadoresOrganizadoresInternos: organizadoresInternos || '0' } as any)
                    : ({} as any)))
    );

    const comercializadoresInternos = useMemo(() => {
        const list = (comercializadoresData ?? []) as any[];
        return list.length ? list.map((x) => String(x.interno)).join(',') : undefined;
    }, [comercializadoresData]);

    const comercializadorValue = isComercializador ? comercializadorMe : comercializador;

    const hasAnyFiltro =
        isGrupoOrganizador ||
        isOrganizadorComercializador ||
        isComercializador ||
        !!grupoValue ||
        !!organizadorValue ||
        !!comercializadorValue;

    const forceEmpty = hasAnyFiltro && !comercializadoresLoading && !comercializadoresInternos;

    const cuilConsulta = isComercializador
        ? cuil
        : Number(digits((comercializadorValue as any)?.cuil ?? 0));

    useEffect(() => {
        setPageIndex(0);
        setPageIndexDetalle(0);
    }, [cuilConsulta]);

    const comercializadorInterno = comercializadorValue ? String((comercializadorValue as any)?.interno ?? 0) : undefined;

    const periodoPagoParams = useMemo((): ParametersComercializadorPeriodoPago => ({
        ComercializadoresInternos: comercializadorInterno,
        OrderBy: '-Periodo',
        PageIndex: PageIndex,
        PageSize,
    }), [comercializadorInterno, PageIndex, PageSize]);

    const { data: periodoPagoRaw, isLoading: isPeriodoPagoLoading } =
        ArtAPI.useGetComercializadorPeriodoPago(comercializadorInterno ? periodoPagoParams : {});

    const periodoPagoData: ComercializadorPeriodoPago[] = (forceEmpty || !comercializadorInterno) ? [] : (
        Array.isArray(periodoPagoRaw) ? periodoPagoRaw : (periodoPagoRaw?.data || [])
    );

    const periodoFiltro = periodoPagoSelected?.periodo || 0;
    

    //#region CTA CTE COMERCIALIZADOR (cálculo pageCount)
    useEffect(() => {
        if (forceEmpty) { setPageCount(1); return; }
        const data = periodoPagoRaw;
        const arr: ComercializadorPeriodoPago[] = Array.isArray(data) ? data : (data?.data || []);
        const total = typeof data?.total === 'number' ? data.total : typeof data?.count === 'number' ? data.count : undefined;
        if (typeof total === 'number' && PageSize > 0) setPageCount(Math.ceil(total / PageSize));
        else setPageCount(arr.length > 0 ? Math.ceil(arr.length / PageSize) : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodoPagoRaw, PageSize, forceEmpty]);

    const handlePageChange = (newPageIndex: number) => {
        setPageIndex(newPageIndex);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setPageIndex(0);
    };
    //#endregion


    //#region CTA CTE COMERCIALIZADOR DETALLE (cálculo pageCount detalles)

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

    const columnsPeriodoPago: ColumnDef<ComercializadorPeriodoPago>[] = useMemo(() => [
        { header: 'Período', accessorKey: 'periodo', cell: (info: any) => Formato.Fecha(info.getValue(), "YYYY-MM"), meta: { align: 'center' } },
        { header: 'Monto', accessorKey: 'montoPrima', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Comisión', accessorKey: 'comision', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'IVA', accessorKey: 'iva', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Total Sin IVA', accessorKey: 'totalSinIva', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Total Con IVA', accessorKey: 'totalConIva', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
    ], []);

    const columns: ColumnDef<ViewCuentaCorriente>[] = useMemo(() => [
        { id: 'periodoCtaCte', header: 'Período', accessorKey: 'periodo', cell: (info: any) => Formato.Fecha(info.getValue(),"MM-YYYY"), meta: { align: 'center'} },
        { header: 'Monto', accessorKey: 'monto', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },
        { header: 'Comisión(*)', accessorKey: 'comision', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },
        // { header: 'Servicios Adicionales', accessorKey: 'serviciosAdicionales', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },
        { header: 'IVA', accessorKey: 'iva', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },
        { header: 'Total Sin IVA', accessorKey: 'totalSinIVA', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },
        { header: 'Total Con IVA', accessorKey: 'totalConIVA', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center'} },
    ], []);

    const columnsEmpleadorPeriodo: ColumnDef<any>[] = useMemo(() => [
        { header: 'CUIT', accessorKey: 'cuit', cell: (info: any) => Formato.CUIP(info.getValue()), meta: { align: 'center' } },
        { header: 'Razón Social', accessorKey: 'razonSocial', meta: { align: 'left' } },
        { header: 'Póliza Nro.', accessorKey: 'poliza', meta: { align: 'center' } },
        { header: 'Monto Premio', accessorKey: 'montoPremio', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Monto Prima', accessorKey: 'montoPrima', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Comisión', accessorKey: 'comision', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Servicio Adicional', accessorKey: 'serviciosAdicionales', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'IVA', accessorKey: 'iva', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Total Sin IVA', accessorKey: 'totalSinIva', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Total Con IVA', accessorKey: 'totalConIva', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
    ], []);

    const columnsAfipTransferencias: ColumnDef<any>[] = useMemo(() => [
        // { header: 'Trabajador', accessorKey: 'cuitContribuyente', cell: (info: any) => Formato.CUIP(info.getValue()), meta: { align: 'center' } },
        { header: 'Fecha Transferencia', accessorKey: 'fechProc', cell: (info: any) => Formato.Fecha(info.getValue()), meta: { align: 'center' } },
        { header: 'Origen', accessorKey: 'origen', meta: { align: 'center' } },
        { header: 'Periodo Fiscal', accessorKey: 'periodo', meta: { align: 'center' } },
        { header: 'Cód. Concepto', accessorKey: 'codConcepto', meta: { align: 'center' } },
        { header: 'Importe', accessorKey: 'importe', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
    ], []);


    // Params para consultar EmpleadorPagosComercializador
    const empleadorPagosParams = useMemo(() => ({
        Periodo: periodoFiltro,
        ComercializadoresInternos: comercializadorValue ? String((comercializadorValue as any)?.interno ?? 0) : comercializadoresInternos,
        PageIndex: PageIndexDetalle,
        PageSize: PageSizeDetalle,
    }), [periodoFiltro, comercializadorValue, comercializadoresInternos, PageIndexDetalle, PageSizeDetalle]);

    const { data: empleadorPagosRaw, isLoading: isEmpleadorPagosLoading } = ArtAPI.useGetEmpleadorPagoComercializadorURL(empleadorPagosParams as any);
    const empleadorPagosData = forceEmpty ? [] : (
        Array.isArray(empleadorPagosRaw) ? empleadorPagosRaw : (empleadorPagosRaw?.data || empleadorPagosRaw || [])
    );

    const empleadorPagosDataEnriched = empleadorPagosData;

    const periodoPagoFiltro = Number(periodoPagoSelected?.periodo || 0);

    const periodoOriginal = useMemo(() => {
        if (!periodoPagoFiltro) return undefined;
        const anio = Math.floor(periodoPagoFiltro / 100);
        const mes = periodoPagoFiltro % 100;
        return mes === 1 ? (anio - 1) * 100 + 12 : anio * 100 + (mes - 1);
    }, [periodoPagoFiltro]);

    const afipTransferParams = useMemo(() => ({
        FechaProceso: periodoPagoFiltro || undefined,
        CuitContribuyente: empleadorPagoSelected?.cuit != null ? String(empleadorPagoSelected.cuit) : undefined,
        OrderBy: '-Periodo',
    }), [periodoPagoFiltro, empleadorPagoSelected?.cuit]);

    const { data: afipTransferRaw, isLoading: isAfipTransferLoadingRaw } = ArtAPI.useGetAfipTransferenciaURL(afipTransferParams as any);
    const shouldShowAfip = !!(periodoPagoFiltro && empleadorPagoSelected?.cuit);
    const selectedAfipCuit = Number(digits(empleadorPagoSelected?.cuit));

    const afipTransferData = forceEmpty || !shouldShowAfip ? [] : (
        Array.isArray(afipTransferRaw) ? afipTransferRaw : (afipTransferRaw?.data || afipTransferRaw || [])
    ).filter((x: any) =>
        Number(digits(x?.cuitContribuyente)) === selectedAfipCuit
    ).map((x: any) => ({
        ...x,
        origen: Number(x?.periodo || 0) === periodoOriginal ? 'Original' : 'Rectificativa',
    }));
    const isAfipTransferLoading = shouldShowAfip ? isAfipTransferLoadingRaw : false;

    useEffect(() => {
        const data = empleadorPagosRaw;
        let arr: any[] = [];
        if (data?.data) arr = Array.isArray(data.data) ? data.data : [data.data];
        else if (Array.isArray(data)) arr = data;
        else if (data) arr = [data];

        const total =
            typeof data?.total === 'number' ? data.total :
            typeof data?.count === 'number' ? data.count :
            typeof data?.pages === 'number' ? data.count :
            undefined;

        if (typeof total === 'number' && PageSizeDetalle > 0) setPageCountDetalle(Math.ceil(total / PageSizeDetalle));
        else setPageCountDetalle(arr.length > 0 ? Math.ceil(arr.length / PageSizeDetalle) : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empleadorPagosRaw, PageSizeDetalle]);

    const groupSelect = (
        <CustomSelectSearch<any>
            options={isAdminLevel ? (gOrgData ?? []) : grupoValue ? [grupoValue] : []}
            getOptionLabel={(x) => String((x as any)?.comercializadorGOrganizadorDescripcion ?? (x as any)?.razonSocial ?? (x as any)?.descripcion ?? '')}
            value={grupoValue ?? null}
            onChange={(_e, v) => {
                setGrupo(v);
                setOrganizador(null);
                setComercializador(null);
            }}
            label="Grupo Organizador"
            disabled={!isAdminLevel}
        />
    );

    const organizadorSelect = (
        <CustomSelectSearch<any>
            options={isAdminLevel || isGrupoOrganizador ? (organizadoresData ?? []) : organizadorValue ? [organizadorValue] : []}
            getOptionLabel={(x) => String((x as any)?.razonSocial ?? (x as any)?.descripcion ?? '')}
            value={organizadorValue ?? null}
            onChange={(_e, v) => {
                setOrganizador(v);
                setComercializador(null);
            }}
            label="Organizador"
            disabled={isOrganizadorComercializador || isComercializador || (!grupoValue && !isAdminLevel)}
        />
    );

    const comercializadorSelect = (
        <CustomSelectSearch<any>
            options={isComercializador ? (comercializadorValue ? [comercializadorValue] : []) : (comercializadoresData ?? [])}
            getOptionLabel={(x) =>
                isComercializador
                    ? String((x as any)?.referenteRazonSocial ?? '')
                    : String((x as any)?.referenteRazonSocial ?? (x as any)?.razonSocial ?? (x as any)?.descripcion ?? '')
            }
            value={comercializadorValue ?? null}
            onChange={(_e, v) => setComercializador(v)}
            label="Comercializador"
            disabled={isComercializador || ((!grupoValue && !isOrganizadorComercializador) && !isAdminLevel)}
        />
    );

    const tabItems = [
        {
            label: 'Periodo de pago',
            value: 0,
            content: (
                <DataTable
                    data={periodoPagoData}
                    columns={columnsPeriodoPago}
                    size="mid"
                    isLoading={isPeriodoPagoLoading}
                    rowKeyField="interno"
                    selectedRowKeyProp={periodoPagoSelected ? String(periodoPagoSelected.interno) : null}
                    onRowClick={(row: ComercializadorPeriodoPago) => {
                        setPeriodoPagoSelected(row);
                        setPageIndexDetalle(0);
                    }}
                    manualPagination={true}
                    pageIndex={PageIndex}
                    pageSize={PageSize}
                    pageCount={pageCount}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                />
            ),
        },

        {
            label: 'Empleador por periodo de pago',
            value: 1,
            content: (
                <>
                    {periodoPagoSelected && (
                        <p className={styles.tabLabel}>
                            <strong>Periodo:</strong> {Formato.Fecha(periodoPagoSelected.periodo, "YYYY-MM")}
                        </p>
                    )}
                    <DataTable
                        data={empleadorPagosDataEnriched}
                        columns={columnsEmpleadorPeriodo}
                        size="mid"
                        isLoading={isEmpleadorPagosLoading}
                        rowKeyField="interno"
                        selectedRowKeyProp={empleadorPagoSelected ? String(empleadorPagoSelected.interno) : null}
                        onRowClick={(row: any) => setEmpleadorPagoSelected(row)}
                        manualPagination={true}
                        pageIndex={PageIndexDetalle}
                        pageSize={PageSizeDetalle}
                        pageCount={pageCountDetalle}
                        onPageChange={handlePageDetalleChange}
                        onPageSizeChange={handlePageSizeDetalleChange}
                    />
                </>
            ),
        },
        {
            label: 'Transferencias del empleador',
            value: 2,
            content: (
                <>
                    {empleadorPagoSelected && (
                        <p className={styles.tabLabel}>
                            <strong>Empleador:</strong> {Formato.CUIP(empleadorPagoSelected.cuit)} - {empleadorPagoSelected.razonSocial}
                        </p>
                    )}
                    <DataTable
                        data={afipTransferData}
                        columns={columnsAfipTransferencias}
                        size="mid"
                        isLoading={isAfipTransferLoading}
                    />
                </>
            ),
        },

    ];

    return (
        <div className={styles.container}>
            <div className={styles.topRow}>
                <div className={styles.selectItem}>{groupSelect}</div>
                <div className={styles.selectItem}>{organizadorSelect}</div>
                <div className={styles.selectItem}>{comercializadorSelect}</div>
            </div>

           
            <CustomTab 
                tabs={tabItems} 
                currentTab={currentTab} 
                onTabChange={handleTabChange}
            /> 

            <Typography variant="body1" className={styles.notice}>
                (*)Monto de la comisión sujeto a retenciones, la liquidación final le será enviada a su correo.
            </Typography>

        </div>
    );
}

export default CuentaCorrienteComercializador;
