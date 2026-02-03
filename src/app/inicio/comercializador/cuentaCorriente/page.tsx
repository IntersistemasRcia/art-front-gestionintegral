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

type SelectedCtaCte = ViewCuentaCorriente | null;

function digits(value: unknown) {
    return String(value ?? '').replace(/\D/g, '');
}

function CuentaCorrienteComercializador() {
    const { user } = useAuth();

    const rol = String((user as any)?.rol ?? '').toLowerCase();
    const cuil = Number(digits((user as any)?.cuit ?? (user as any)?.CUIL ?? (user as any)?.cuil ?? 0));

    const isAdmin = rol === 'administrador';
    const isGrupoOrganizador = rol === 'grupoorganizador';
    const isOrganizadorComercializador = rol === 'organizadorcomercializador';
    const isComercializador = rol === 'comercializador';

    const [grupo, setGrupo] = useState<any>(null);
    const [organizador, setOrganizador] = useState<any>(null);
    const [comercializador, setComercializador] = useState<any>(null);

    const [ctacteSelected, setCtacteSelected] = useState<SelectedCtaCte>(null);
    const [empleadorPagoSelected, setEmpleadorPagoSelected] = useState<any>(null);

     // PAGINACIÓN controlada por componente
    const [PageIndex, setPageIndex] = useState<number>(0);
    const [PageSize, setPageSize] = useState<number>(10);
    const [pageCount, setPageCount] = useState<number>(0);

    // PAGINACIÓN controlada por componente (detalles)
    const [PageIndexDetalle, setPageIndexDetalle] = useState<number>(0);
    const [PageSizeDetalle, setPageSizeDetalle] = useState<number>(10);
    const [pageCountDetalle, setPageCountDetalle] = useState<number>(0);
    const [pageCountEmpleador, setPageCountEmpleador] = useState<number>(0);

    // Accede a las propiedades de la sesión con seguridad
    const { empresaCUIT, cuit } = user as any;

    const { data: gOrgData } = ArtAPI.useGetGOrganizadorURL(
        isAdmin ? ({} as any) : isGrupoOrganizador ? ({ CUIL: cuil } as any) : ({} as any)
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

    const grupoValue = isAdmin
        ? grupo
        : isGrupoOrganizador
            ? (gOrgData?.[0] ?? null)
            : isComercializador
                ? grupoFromComercializador
                : isOrganizadorComercializador
                    ? grupoById
                    : null;

    const grupoInterno = Number((grupoValue as any)?.interno ?? 0);

    const organizadorValue = isAdmin
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
        setCtacteSelected(null);
        setPageIndex(0);
        setPageIndexDetalle(0);
    }, [cuilConsulta]);

    // Clave de persistencia para DataTable (por cuit para no mezclar usuarios)
    const persistKeyForSelection = cuit ? `ctacte_selected_${cuit}` : `ctacte_selected_global`;

    // NOTA: Usamos ctacteSelected?.periodo, y lo convertimos a string si existe.
    // Esto hace que la clave SWR solo se active cuando ctacteSelected.periodo tiene un valor.
    const ctaCteParams = useMemo(() => {
        const base = { page: `${PageIndex},${PageSize}`, sort: "-periodo" } as any;
        if (cuilConsulta) return { CUIL: cuilConsulta, ...base } as any;
        if (hasAnyFiltro) return { CUIL: 0, ...base } as any;
        return base;
    }, [PageIndex, PageSize, cuilConsulta, hasAnyFiltro]);

    const { data: CtaCteRawData, isLoading: isCtaCteLoading, error: viewCtaCteError, isValidating, mutate: mutateCtaCte } =
    gestionComercializadorAPI.useGetViewCtaCte(ctaCteParams);

    const periodoFiltro = ctacteSelected?.periodo || 0;
    
    const { data: CtaCteRawDetalleData, isLoading: isCtaCteDetalleLoading, error: viewCtaCteDetalleError, isValidating: isValidatingDetalle, mutate: mutateCtaCteDetalle } =
    gestionComercializadorAPI.useGetViewCtaCteDetalle(
        // La consulta de detalles solo se ejecuta si hay un periodo seleccionado (periodoFiltro)
        periodoFiltro ? { 
            CUIL: cuilConsulta || (hasAnyFiltro ? 0 : cuil), 
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
        if (forceEmpty) {
            setPageCount(1);
            return;
        }
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
    }, [CtaCteRawData, viewCtaCteError, PageSize, forceEmpty]);

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
        if (forceEmpty) {
            setPageCountDetalle(1);
            return;
        }
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
    }, [CtaCteRawDetalleData, viewCtaCteDetalleError, PageSizeDetalle, forceEmpty]);

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
    
    const columnsEmpleadorPeriodo: ColumnDef<any>[] = useMemo(() => [
        { header: 'CUIT', accessorKey: 'cuit', cell: (info: any) => Formato.CUIP(info.getValue()), meta: { align: 'center' } },
        { header: 'Razón Social', accessorKey: 'razonSocial', meta: { align: 'center' } },
        { header: 'Poliza Nro.', accessorKey: 'poliza', meta: { align: 'center' } },
        { header: 'Monto Premio', accessorKey: 'montoPremio', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Monto Prima', accessorKey: 'montoPrima', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Comisión', accessorKey: 'comision', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Servicio Adicional', accessorKey: 'serviciosAdicionales', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'IVA', accessorKey: 'iva', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Total Sin IVA', accessorKey: 'totalSinIva', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
        { header: 'Total Con IVA', accessorKey: 'totalConIva', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
    ], []);

    const columnsAfipTransferencias: ColumnDef<any>[] = useMemo(() => [
        { header: 'Trabajador', accessorKey: 'cuitContribuyente', cell: (info: any) => Formato.CUIP(info.getValue()), meta: { align: 'center' } },
        { header: 'Fecha Transferencia', accessorKey: 'fechProc', cell: (info: any) => Formato.Fecha(info.getValue()), meta: { align: 'center' } },
        { header: 'Periodo Fiscal', accessorKey: 'periodo', meta: { align: 'center' } },
        { header: 'Cod. Concepto', accessorKey: 'codConcepto', meta: { align: 'center' } },
        { header: 'Importe', accessorKey: 'importe', cell: info => formatCurrency(info.getValue() as number), meta: { align: 'center' } },
    ], []);


    const ctacteData = forceEmpty ? [] : (CtaCteRawData?.data || []);
    const ctacteDetalleData = forceEmpty ? [] : (CtaCteRawDetalleData?.data || []);

    // Params para consultar EmpleadorPagosComercializador
    const empleadorPagosParams = useMemo(() => ({
        Periodo: periodoFiltro,
        ComercializadoresInternos: comercializadoresInternos,
        PageIndex: PageIndexDetalle,
        PageSize: PageSizeDetalle,
    }), [periodoFiltro, comercializadoresInternos, PageIndexDetalle, PageSizeDetalle]);

    const { data: empleadorPagosRaw, isLoading: isEmpleadorPagosLoading } = ArtAPI.useGetEmpleadorPagoComercializadorURL(empleadorPagosParams as any);
    const empleadorPagosData = forceEmpty ? [] : (
        Array.isArray(empleadorPagosRaw) ? empleadorPagosRaw : (empleadorPagosRaw?.data || empleadorPagosRaw || [])
    );

    const [empresasByCuitMap, setEmpresasByCuitMap] = useState<Record<string, any>>({});
    const [isEmpresaByCuitLoading, setIsEmpresaByCuitLoading] = useState<boolean>(false);

    useEffect(() => {
        const cuits: string[] = (empleadorPagosData ?? [])
            .map((x: any) => digits(x?.cuit))
            .filter((x: string) => x.length === 11);

        const uniqueCuitsMissing: string[] = Array.from(new Set<string>(cuits))
            .filter((cuitItem: string) => !(cuitItem in empresasByCuitMap));
        if (uniqueCuitsMissing.length === 0) return;

        let cancelled = false;
        setIsEmpresaByCuitLoading(true);

        Promise.all(
            uniqueCuitsMissing.map((cuitItem: string) =>
                ArtAPI.getEmpresaByCUIT({ CUIT: Number(cuitItem) })
                    .then((data) => ({ cuitItem, data }))
                    .catch(() => ({ cuitItem, data: null }))
            )
        )
            .then((results) => {
                if (cancelled) return;
                setEmpresasByCuitMap((prev) => {
                    const next = { ...prev } as Record<string, any>;
                    results.forEach(({ cuitItem, data }) => {
                        next[cuitItem] = data;
                    });
                    return next;
                });
            })
            .finally(() => {
                if (!cancelled) setIsEmpresaByCuitLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [empleadorPagosData, empresasByCuitMap]);

    const empleadorPagosDataEnriched = useMemo(() => (
        (empleadorPagosData ?? []).map((row: any) => {
            const cuitKey = digits(row?.cuit);
            const empresa = empresasByCuitMap[cuitKey];
            return {
                ...row,
                razonSocial: empresa?.razonSocial ?? row?.razonSocial ?? '',
            };
        })
    ), [empleadorPagosData, empresasByCuitMap]);

    const afipTransferParams = useMemo(() => ({
        Periodo: empleadorPagoSelected?.periodo,
        CuitContribuyente: empleadorPagoSelected?.cuit != null ? String(empleadorPagoSelected.cuit) : undefined,
    }), [empleadorPagoSelected]);

    const { data: afipTransferRaw, isLoading: isAfipTransferLoadingRaw } = ArtAPI.useGetAfipTransferenciaURL(afipTransferParams as any);
    const shouldShowAfip = !!(empleadorPagoSelected?.periodo && empleadorPagoSelected?.cuit);
    const selectedAfipCuit = Number(digits(empleadorPagoSelected?.cuit));
    const selectedAfipPeriodo = Number(empleadorPagoSelected?.periodo || 0);
    const afipTransferData = forceEmpty || !shouldShowAfip ? [] : (
        Array.isArray(afipTransferRaw) ? afipTransferRaw : (afipTransferRaw?.data || afipTransferRaw || [])
    ).filter((x: any) =>
        Number(digits(x?.cuitContribuyente)) === selectedAfipCuit && Number(x?.periodo || 0) === selectedAfipPeriodo
    );
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

        if (typeof total === 'number' && PageSizeDetalle > 0) setPageCountEmpleador(Math.ceil(total / PageSizeDetalle));
        else setPageCountEmpleador(arr.length > 0 ? Math.ceil(arr.length / PageSizeDetalle) : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [empleadorPagosRaw, PageSizeDetalle]);

    const groupSelect = (
        <CustomSelectSearch<any>
            options={isAdmin ? (gOrgData ?? []) : grupoValue ? [grupoValue] : []}
            getOptionLabel={(x) => String((x as any)?.comercializadorGOrganizadorDescripcion ?? (x as any)?.razonSocial ?? (x as any)?.descripcion ?? '')}
            value={grupoValue ?? null}
            onChange={(_e, v) => {
                setGrupo(v);
                setOrganizador(null);
                setComercializador(null);
            }}
            label="Grupo Organizador"
            disabled={!isAdmin}
        />
    );

    const organizadorSelect = (
        <CustomSelectSearch<any>
            options={isAdmin || isGrupoOrganizador ? (organizadoresData ?? []) : organizadorValue ? [organizadorValue] : []}
            getOptionLabel={(x) => String((x as any)?.razonSocial ?? (x as any)?.descripcion ?? '')}
            value={organizadorValue ?? null}
            onChange={(_e, v) => {
                setOrganizador(v);
                setComercializador(null);
            }}
            label="Organizador"
            disabled={isOrganizadorComercializador || isComercializador || (!grupoValue && !isAdmin)}
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
            disabled={isComercializador || ((!grupoValue && !isOrganizadorComercializador) && !isAdmin)}
        />
    );

    const tabItems = [
        {
            label: 'Estado de Cuenta',
            value: 0,
            content: (

                <DataTable
                    data={ctacteData} 
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
                            const found = (ctacteData || []).find((r: any) => String(r.periodo) === String(selectedKey));
                            setCtacteSelected(found ?? null);
                        }
                    }}
                />
            ),
        },

        {
            label: 'Empleador por periodo de pago',
            value: 1,
            content: (
                <DataTable
                    data={empleadorPagosDataEnriched}
                    columns={columnsEmpleadorPeriodo}
                    size="mid"
                    isLoading={isEmpleadorPagosLoading || isEmpresaByCuitLoading}
                    onRowClick={(row: any) => setEmpleadorPagoSelected(row)}
                    manualPagination={true}
                    pageIndex={PageIndexDetalle}
                    pageSize={PageSizeDetalle}
                    pageCount={pageCountDetalle}
                    onPageChange={handlePageDetalleChange}
                    onPageSizeChange={handlePageSizeDetalleChange}
                />
            ),
        },
        {
            label: 'Transferencias del empleador',
            value: 2,
            content: (
                <DataTable
                    data={afipTransferData}
                    columns={columnsAfipTransferencias}
                    size="mid"
                    isLoading={isAfipTransferLoading}
                />
            ),
        },

                {
            label: 'Detalles',
            value: 3,
            content: (
                 <DataTable
                    data={ctacteDetalleData} 
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

        </div>
    );
}

export default CuentaCorrienteComercializador;
