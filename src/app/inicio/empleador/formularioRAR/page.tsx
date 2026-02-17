'use client';

import React, { useCallback, useEffect, useState, SyntheticEvent, useRef } from 'react';
import { IconButton, Box, Tooltip } from "@mui/material";
import { useAuth } from '@/data/AuthContext';
import Formato from '@/utils/Formato';
import CustomButton from '@/utils/ui/button/CustomButton';
import DataTable from '@/utils/ui/table/DataTable';
import PDFModalViewer from '@/utils/PDF/PDFModalViewer';
import BaseDocumentPDF from '@/utils/PDF/BaseDocumentPDF';
import { Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import CustomTab from '@/utils/ui/tab/CustomTab';
import styles from './FormulariosRAR.module.css';
import { BsFileEarmarkPdfFill, BsPencilFill, BsFront } from "react-icons/bs";
import FormularioRAR from './types/TformularioRar';
import ArtAPI from "@/data/artAPI";
import { useEmpresasStore } from "@/data/empresasStore";
import { Empresa } from "@/data/authAPI";
import CustomSelectSearch from "@/utils/ui/form/CustomSelectSearch";

// Hijos
import FormularioRARGenerar from './generar/FormularioRARGenerar';
// import FormularioRAREditor from './editar/FormularioRAREditor'; // Ya no se usa, reutilizamos el modal de generar para edición

// Ruta del logo para el PDF
const pdfLogoSrc = '/icons/LogoTexto.png';


/* Helpers */
const fechaFormatter = (v: any) => Formato.Fecha(v);
const cuipFormatter = (v: any) => Formato.CUIP(v);
const formatearFecha = (f: any) => fechaFormatter(f);

/* Spinner simple */
const Spinner: React.FC = () => (
  <div className={styles.spinner}>
    <span>cargando...</span>
  </div>
);

type ViewMode = 'list' | 'crear' | 'editar';

const FormulariosRAR: React.FC = () => {
  const { user } = useAuth();
  // Accede a las propiedades de la sesión con seguridad
  const { empresaCUIT, cuit } = user as any;

  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const seleccionAutomaticaRef = useRef(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [internoFormularioRAR, setInternoFormularioRAR] = useState<number>(0);
  const [internoEstablecimiento, setInternoEstablecimiento] = useState<number>(0);
  const [estado, setEstado] = useState<string>('');
  const [formulariosRAR, setFormulariosRAR] = useState<FormularioRAR[]>([]);
  const [idFormularioSeleccionado, setIdFormularioSeleccionado] = useState<number>(0);

  // PAGINACIÓN controlada por componente
  const [PageIndex, setPageIndex] = useState<number>(0);
  const [PageSize, setPageSize] = useState<number>(10);
  const [pageCount, setPageCount] = useState<number>(0);

  // modos
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editaId, setEditaId] = useState<number>(0);
  const [replicaDe, setReplicaDe] = useState<number | undefined>(undefined);

  // PDF
  const [modalPDFOpen, setModalPDFOpen] = useState<boolean>(false);
  const [datosPDF, setDatosPDF] = useState<any>(null);

  // Detalles del interno
  const [detallesInterno, setDetallesInterno] = useState<any[]>([]);
  const [loadingDetalles, setLoadingDetalles] = useState<boolean>(false);
  const [errorDetalles, setErrorDetalles] = useState<string>('');
  const [registroSeleccionado, setRegistroSeleccionado] = useState<any>(null);

  // Estado para controlar el tab activo (correcto)
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  // Handler para cambiar el tab (necesario para el componente controlado)
  const handleTabChange = (event: SyntheticEvent, newTabValue: number) => {
    setActiveTabIndex(newTabValue);
  };

  // Seleccionar automáticamente si solo hay una empresa
  useEffect(() => {
    if (!isLoadingEmpresas) {
      if (empresas.length === 1) {
        setEmpresaSeleccionada(empresas[0]);
        seleccionAutomaticaRef.current = true;
      } else if (empresas.length !== 1 && seleccionAutomaticaRef.current) {
        setEmpresaSeleccionada(null);
        seleccionAutomaticaRef.current = false;
      }
    }
  }, [empresas.length, isLoadingEmpresas]);

  // Limpiar formularios cuando cambia la empresa seleccionada
  useEffect(() => {
    setFormulariosRAR([]);
    setIdFormularioSeleccionado(0);
    setRegistroSeleccionado(null);
    setDetallesInterno([]);
    setErrorDetalles('');
    setPageIndex(0);
  }, [empresaSeleccionada?.cuit]);

  const handleEmpresaChange = (
    _event: React.SyntheticEvent,
    newValue: Empresa | null
  ) => {
    setEmpresaSeleccionada(newValue);
    seleccionAutomaticaRef.current = false;
  };

  const getEmpresaLabel = (empresa: Empresa | null): string => {
    if (!empresa) return "";
    return `${empresa.razonSocial} - ${Formato.CUIP(empresa.cuit)}`;
  };

  // Usamos el hook SWR del API (solo hace fetch si existe token y respeta las opciones de revalidate)
  // Solo hace fetch si hay una empresa seleccionada
  // SWR detectará automáticamente cuando cambia el CUIT porque está en la clave
  const apiPageIndex = PageIndex;
  const paramsFormularios = empresaSeleccionada?.cuit 
    ? { CUIT: empresaSeleccionada.cuit, PageIndex: apiPageIndex, PageSize: PageSize, OrderBy: '-Interno' } 
    : undefined;
  
  const { data: formulariosData, error: formulariosError, isLoading: isLoadingSWR, isValidating, mutate: mutateFormularios } =
    ArtAPI.useGetFormulariosRARURL(paramsFormularios);

  // Sincronizar el estado de loading con SWR
  useEffect(() => {
    // Si no hay empresa seleccionada, mantener tabla vacía y no mostrar loading
    if (!empresaSeleccionada?.cuit) {
      setFormulariosRAR([]);
      setLoading(false);
      setPageCount(1);
      return;
    }

    // Usar el estado de loading de SWR directamente
    setLoading(isLoadingSWR || isValidating);
  }, [empresaSeleccionada?.cuit, isLoadingSWR, isValidating]);

  // Una sola vez: cuando llegan datos, los mapeamos al estado local
  useEffect(() => {
    // Si no hay empresa seleccionada, no procesar datos
    if (!empresaSeleccionada?.cuit) {
      return;
    }

    // Si está cargando, no procesar aún
    if (isLoadingSWR || isValidating) {
      return;
    }

    // Si hay error, mostrar error
    if (formulariosError) {
      console.error('Error al cargar formularios (SWR):', formulariosError);
      setFormulariosRAR([]);
      setLoading(false);
      return;
    }

    // Si no hay datos, mantener vacío
    if (!formulariosData) {
      setFormulariosRAR([]);
      setPageCount(1);
      return;
    }

    // Normalizar respuesta (igual que antes)
    let formularios: any[] = [];
    const data = formulariosData;
    if (data?.data) formularios = Array.isArray(data.data) ? data.data : [data.data];
    else if (Array.isArray(data)) formularios = data;
    else if (data) formularios = [data];

    setFormulariosRAR(formularios);
    setLoading(false);
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
      // fallback: si no hay total, estimar una página (evita pageCount=0)
      setPageCount(formularios.length > 0 ? Math.ceil(formularios.length / PageSize) : 1);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formulariosData, formulariosError, empresaSeleccionada?.cuit, isLoadingSWR, isValidating]);

  // Handler que se pasa al DataTable para solicitar otra página
  const handlePageChange = (newPageIndex: number) => {
    // actualizar estado -> la clave SWR cambia y fetch se ejecuta
    setPageIndex(newPageIndex);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(0); // volver a primera página cuando cambia tamaño
  };

  const fetchDetallesInterno = useCallback(async (internoId: number) => {
    if (!internoId || internoId === 0) {
      setDetallesInterno([]);
      setErrorDetalles('');
      return;
    }
    setLoadingDetalles(true);
    setErrorDetalles('');
    try {
      const data = await ArtAPI.getFormularioRARById(internoId);

      if (data?.formularioRARDetalle && Array.isArray(data.formularioRARDetalle)) {
        const detallesFormateados = data.formularioRARDetalle.map((detalle: any, index: number) => ({
          id: index + 1,
          cuil: detalle.cuil || '',
          nombre: detalle.nombre || '',
          sectorTarea: detalle.sectorTarea || '',
          fechaIngreso: detalle.fechaIngreso ? formatearFecha(detalle.fechaIngreso) : '',
          fechaInicioExposicion: detalle.fechaInicioExposicion ? formatearFecha(detalle.fechaInicioExposicion) : '',
          fechaFinExposicion: detalle.fechaFinExposicion ? formatearFecha(detalle.fechaFinExposicion) : '',
          horasExposicion: detalle.horasExposicion ?? 0,
          codigoAgente: detalle.codigoAgente || '',
          fechaUltimoExamenMedico: detalle.fechaUltimoExamenMedico ? formatearFecha(detalle.fechaUltimoExamenMedico) : '',
        }));
        setDetallesInterno(detallesFormateados);
      } else {
        setDetallesInterno([]);
      }
    } catch (error) {
      console.error('Error al obtener detalles del interno:', error);
      setErrorDetalles(error instanceof Error ? error.message : 'Error desconocido al cargar detalles');
      setDetallesInterno([]);
    } finally {
      setLoadingDetalles(false);
    }
  }, []);


  /* Handlers de navegación */
  const handleClickNuevo = () => {
    setReplicaDe(undefined);
    setViewMode('crear');
    setEditaId(0);
    setInternoFormularioRAR(0);
    setInternoEstablecimiento(0);
    setEstado('');
    setIdFormularioSeleccionado(0);
    setRegistroSeleccionado(null);
    setDetallesInterno([]);
    setErrorDetalles('');
    //  MODIFICACIÓN 7: Resetear el tab activo cuando se crea nuevo formulario
    setActiveTabIndex(0);
  };

  const handleEdita = () => {
    const elegido = idFormularioSeleccionado > 0 ? idFormularioSeleccionado : internoFormularioRAR;
    if (!elegido || elegido === 0) {
      alert('Seleccioná un formulario de la tabla para editar.');
      return;
    }
    setEditaId(elegido);
    setViewMode('editar');
  };

  const seleccionaRegistro = (internoFormRAR: number, internoEstab: number, estadoSel: string) => {
    setInternoFormularioRAR(internoFormRAR);
    setInternoEstablecimiento(internoEstab);
    setEstado(estadoSel);
  };

  const handleFinalizaCarga = async (ret?: boolean) => {
    setViewMode('list');
    setEstado('');
    if (ret) {
      setLoading(true);
      await mutateFormularios?.();
    }
  };

  /* PDF */
  const handleAbrirPDF = async (rowData: any) => {
    const idFormulario = rowData.id || rowData.Id || rowData.ID || rowData.InternoFormularioRAR || rowData.interno;
    if (idFormulario) {
      try {
        const detallesFormulario = await ArtAPI.getFormularioRARById(Number(idFormulario));

          let mapaAgentes = new Map<number, string>();
          try {
            const rAg = await fetch('http://arttest.intersistemas.ar:8302/api/AgentesCausantes');
            if (rAg.ok) {
              const agentes = await rAg.json();
              const arr = Array.isArray(agentes) ? agentes : agentes?.data ? (Array.isArray(agentes.data) ? agentes.data : [agentes.data]) : [agentes];
              arr.forEach((a: any) => {
                const codigo = Number(a?.codigo ?? 0);
                const nombre = String(a?.agenteCausante ?? '').trim();
                if (codigo && nombre) mapaAgentes.set(codigo, nombre);
              });
            }
          } catch (e) {
            console.warn('No se pudo cargar el catálogo de agentes para PDF', e);
          }

          const detalles = detallesFormulario.formularioRARDetalle || [];
          const detallesConNombre = Array.isArray(detalles)
            ? detalles.map((d: any) => ({
                ...d,
                agenteNombre: d?.codigoAgente === 1
                  ? 'No Expuesto'
                  : (mapaAgentes.get(Number(d?.codigoAgente)) || '—'),
              }))
            : [];


        let establecimiento = null;
        try {
          const estId = Number(
            rowData.internoEstablecimiento ||
            rowData.InternoEstablecimiento ||
            detallesFormulario.internoEstablecimiento ||
            0
          );
          if (estId > 0) {
            establecimiento = await ArtAPI.getEstablecimientoById({ id: estId });
          }
        } catch (e) {
          console.warn("No se pudo obtener el establecimiento", e);
        }

        const telefonoEmpresa =
          detallesFormulario.empresaTelefono ||
          (detallesFormulario as any).EmpresaTelefono ||
          rowData.empresaTelefono ||
          (rowData as any).EmpresaTelefono ||
          null;

        const contratoEmpresa =
          detallesFormulario.empresaContrato ||
          (detallesFormulario as any).EmpresaContrato ||
          rowData.empresaContrato ||
          (rowData as any).EmpresaContrato ||
          null;

        const razonSocialEmpresa =
          detallesFormulario.empresaRazonSocial ||
          (detallesFormulario as any).EmpresaRazonSocial ||
          rowData.empresaRazonSocial ||
          (rowData as any).EmpresaRazonSocial ||
          null;

        const cantTrabajadoresExpuestosEmpresa =
          detallesFormulario.cantTrabajadoresExpuestos ??
          (detallesFormulario as any).CantTrabajadoresExpuestos ??
          rowData.cantTrabajadoresExpuestos ??
          (rowData as any).CantTrabajadoresExpuestos ??
          null;

        const cantTrabajadoresNoExpuestosEmpresa =
          detallesFormulario.cantTrabajadoresNoExpuestos ??
          (detallesFormulario as any).CantTrabajadoresNoExpuestos ??
          rowData.cantTrabajadoresNoExpuestos ??
          (rowData as any).CantTrabajadoresNoExpuestos ??
          null;

        let empresa: any = null;
        try {
          const cuitEmpresa =
            detallesFormulario.cuit ??
            (detallesFormulario as any).CUIT ??
            rowData.cuit ??
            (rowData as any).CUIT ??
            null;

          if (cuitEmpresa) {
            empresa = await ArtAPI.getEmpresaByCUIT({ CUIT: Number(cuitEmpresa) });
          }
        } catch (e) {
          console.warn("No se pudo obtener la empresa por CUIT", e);
        }

        const empresaCiiu =
          (empresa && (empresa.ciiu ?? (empresa as any).CIIU)) ??
          detallesFormulario.ciiu ??
          (detallesFormulario as any).CIIU ??
          rowData.ciiu ??
          (rowData as any).CIIU ??
          null;

       const establecimientoActividadPrincipal =
         detallesFormulario.establecimientoActividadPrincipal ??
         (detallesFormulario as any).establecimientoActividadPrincipal ??
         rowData.establecimientoActividadPrincipal ??
         (rowData as any).EstablecimientoActividadPrincipal ??
         null;

       const establecimientoActividadSecundaria =
         detallesFormulario.establecimientoActividadSecundaria ??
         (detallesFormulario as any).establecimientoActividadSecundaria ??
         rowData.establecimientoActividadSecundaria ??
         (rowData as any).EstablecimientoActividadSecundaria ??
         null;





        const datosCompletos = {
          ...rowData,
          establecimiento,
          empresaTelefono: telefonoEmpresa,
          empresaContrato: contratoEmpresa,
          empresaRazonSocial: razonSocialEmpresa,
          empresaCiiu: empresaCiiu,
          establecimientoActividadPrincipal,
          establecimientoActividadSecundaria,          
          cantTrabajadoresExpuestos: cantTrabajadoresExpuestosEmpresa,
          cantTrabajadoresNoExpuestos: cantTrabajadoresNoExpuestosEmpresa,
          detallesTrabajadores: detallesConNombre,
          totalTrabajadores: detallesConNombre.length || 0,
        };

        setDatosPDF(datosCompletos);



      } catch (error) {
        console.error('Error obteniendo detalles para PDF:', error);
        setDatosPDF(rowData);
      }
    } else {
      setDatosPDF(rowData);
    }
    setModalPDFOpen(true);
  };
  const handleCerrarPDF = () => {
    setModalPDFOpen(false);
    setDatosPDF(null);
  };

  /* Columnas para tabla principal de formularios */
  const tableColumns = [
    { accessorKey: 'interno', header: 'Interno'},
    { accessorKey: 'cuit', header: 'CUIT', cell: (info: any) => Formato.CUIP(info.getValue()) },
    { accessorKey: 'empresaRazonSocial', header: 'Razón Social' },
    { accessorKey: 'empresaDireccion', header: 'Dirección' },
    { accessorKey: 'estado', header: 'Estado' },
    { accessorKey: 'fechaCreacion', header: 'Fecha Creación', cell: (info: any) => fechaFormatter(info.getValue()), meta: { align: "center" } },
    { accessorKey: 'fechaPresentacion', header: 'Fecha Presentación', cell: (info: any) => fechaFormatter(info.getValue()), meta: { align: "center" } },
    { accessorKey: 'internoEstablecimiento', header: 'Interno Establecimiento', meta: { align: "center" }, hidden: true  },
    { accessorKey: 'cantTrabajadoresExpuestos', header: 'Expuestos', meta: { align: "center" } },
    { accessorKey: 'cantTrabajadoresNoExpuestos', header: 'No Expuestos', meta: { align: "center" } },
    {
      id: 'acciones',
      header: 'Acciones',
      meta: { align: "right" },
      cell: ({ row }: { row: any }) => {
        const estadoForm = String(row.original.Estado || row.original.estado || '');
        const mostrarEditar = estadoForm !== 'Confirmado';
        const mostrarReplicar = true; 
        
        return (
          <Box className={styles.iconActions}>
            <>
              {mostrarEditar && (
                <Tooltip
                  title="Editar Formulario"
                  arrow
                  slotProps={{
                    tooltip: {
                      className: styles.tooltipCustom,
                    },
                  }}
                >
                  <IconButton
                    onClick={(e: any) => {
                      e.stopPropagation?.();
                      // Seleccionar el registro y activar edición
                      const internoForm = Number(row.original.InternoFormularioRAR || row.original.interno || 0);
                      const internoEstab = Number(row.original.internoEstablecimiento || row.original.InternoEstablecimiento || 0);
                      const est = String(row.original.Estado || row.original.estado || '');

                      seleccionaRegistro(internoForm, internoEstab, est);
                      setIdFormularioSeleccionado(internoForm);

                      if (internoForm > 0) {
                        setEditaId(internoForm);
                        setViewMode('editar');
                      } else {
                        alert('No se pudo obtener el ID del formulario para editar.');
                      }
                    }}
                    disabled={cuit === 99999999999 || (!row.original.interno && !row.original.InternoFormularioRAR)}
                    color="warning"
                    size="small"
                  >
                    <BsPencilFill fontSize="large" />
                  </IconButton>
                </Tooltip>
              )}
              {/* Botón Imprimir */}
              <Tooltip
                title="Generar PDF"
                arrow
                slotProps={{
                  tooltip: {
                    className: styles.tooltipCustom,
                  },
                }}
              >
                <IconButton
                  onClick={(e: any) => {
                    e.stopPropagation?.();
                    handleAbrirPDF(row.original);
                  }}
                  color="warning"
                  size="small"
                >
                  <BsFileEarmarkPdfFill fontSize="large" />
                </IconButton>
              </Tooltip>
              {/* Botón Replicar */}
              {mostrarReplicar && (
                <Tooltip
                  title="Replicar Formulario"
                  arrow
                  slotProps={{
                    tooltip: {
                      className: styles.tooltipCustom,
                    },
                  }}
                >
                  <IconButton
                    onClick={(e: any) => {
                      e.stopPropagation?.();
                      const internoForm = Number(row.original.InternoFormularioRAR || row.original.interno || 0);
                      if (internoForm > 0) {
                        setReplicaDe(internoForm);
                        setViewMode('crear');
                      }
                    }}
                    disabled={cuit === 99999999999 || (!row.original.interno && !row.original.InternoFormularioRAR)}
                    color="info"
                    size="small"
                  >
                    <BsFront fontSize="large" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          </Box>
        );
      }
    },
  ];

  /*  MODIFICACIÓN: Columnas para tabla de detalles de trabajadores */
  const detalleColumns = [
    {
      accessorKey: 'id',
      header: '#',
      size: 60
    },
    {
      accessorKey: 'cuil',
      header: 'CUIL',
      cell: (info: any) => cuipFormatter(info.getValue()) || '—',
      size: 120
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre',
      cell: (info: any) => info.getValue() || '—'
    },
    {
      accessorKey: 'sectorTarea',
      header: 'Sector/Tarea',
      cell: (info: any) => info.getValue() || '—',
      size: 150
    },
    {
      accessorKey: 'fechaIngreso',
      header: 'Fecha Ingreso',
      cell: (info: any) => info.getValue() || '—',
      size: 120
    },
    {
      accessorKey: 'fechaInicioExposicion',
      header: 'Fecha Inicio Exp.',
      cell: (info: any) => info.getValue() || '—',
      size: 140
    },
    {
      accessorKey: 'fechaFinExposicion',
      header: 'Fecha Fin Exp.',
      cell: (info: any) => info.getValue() || '—',
      size: 130
    },
    {
      accessorKey: 'horasExposicion',
      header: 'Horas Exp.',
      cell: (info: any) => info.getValue() || '0',
      size: 80
    },
    {
      accessorKey: 'codigoAgente',
      header: 'Cod. Agente',
      cell: (info: any) => info.getValue() || '—',
      size: 100
    },
    {
      accessorKey: 'fechaUltimoExamenMedico',
      header: 'Último Examen Médico',
      cell: (info: any) => info.getValue() || '—',
      size: 150
    }
  ];

  const onRowClick = (row: any) => {
    const idFormulario = Number(row.id || row.Id || row.ID || row.InternoFormularioRAR || row.interno || 0);
    const internoForm = Number(row.InternoFormularioRAR || row.interno || 0);
    const internoEstab = Number(row.internoEstablecimiento || row.InternoEstablecimiento || 0);
    const est = String(row.Estado || row.estado || '');

    // guardar selección
    seleccionaRegistro(internoForm, internoEstab, est);
    setIdFormularioSeleccionado(idFormulario);
    setRegistroSeleccionado(row);


    if (internoForm > 0) {
      fetchDetallesInterno(internoForm);
    } else {
      setDetallesInterno([]);
      setErrorDetalles('');
      setRegistroSeleccionado(null);
    }
  };


  const disableEdita = cuit !== 99999999999 && internoFormularioRAR !== 0 ? false : true;
  const disableGenera = cuit === 99999999999 ? true : false;

  if (loading) return <Spinner />;

  /* PDF para listado */
  const pdfStyles = StyleSheet.create({
    simpleHeaderContainer: {
      backgroundColor: styles.pdfHeaderBg,
      padding: Number(styles.pdfHeaderPadding),
      marginBottom: Number(styles.pdfHeaderMb),
    },
    simpleHeaderTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: Number(styles.pdfHeaderGap),
    },
    simpleHeaderLogo: {
      width: Number(styles.pdfHeaderLogoWidth),
      height: Number(styles.pdfHeaderLogoHeight),
      objectFit: 'contain',
      marginBottom: Number(styles.pdfHeaderLogoMb),
    },
    simpleHeaderTitle: {
      color: styles.pdfHeaderTextColor,
      fontWeight: 'bold',
      fontSize: Number(styles.pdfHeaderFontSize),
      textAlign: 'center',
    },
    resumenContainer: {
      paddingVertical: Number(styles.pdfResumenPaddingV),
      paddingHorizontal: Number(styles.pdfResumenPaddingH),
      marginBottom: Number(styles.pdfResumenMb),
    },
    razonTitle: {
      fontSize: Number(styles.pdfRazonFontSize),
      fontWeight: 'bold',
      marginBottom: Number(styles.pdfRazonMb),
    },
    fechaRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      flexWrap: 'nowrap',
    },
    fechaText: {
      fontSize: Number(styles.pdfFechaRowFontSize),
    },
    contratoRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      flexWrap: 'nowrap',
      marginTop: Number(styles.pdfRowMarginTop),
    },
    contratoText: {
      fontSize: Number(styles.pdfContratoLabelFontSize),
      width: styles.pdfContratoWidthPercent as any,
      marginRight: Number(styles.pdfContratoMarginRight),
    },
    contratoTextNoRight: {
      fontSize: Number(styles.pdfContratoLabelFontSize),
      width: styles.pdfContratoWidthPercent as any,
    },
    estabNumeroTitle: {
      fontSize: Number(styles.pdfEstabTitleFontSize),
      fontWeight: 'bold',
      marginTop: Number(styles.pdfEstabTitleMarginTop),
    },
    infoText: {
      fontSize: Number(styles.pdfInfoFontSize),
      marginTop: Number(styles.pdfInfoMarginTop),
    },
    trabajadoresTitle: {
      fontSize: Number(styles.pdfTrabTitleFontSize),
      marginTop: Number(styles.pdfTrabTitleMarginTop),
      marginBottom: Number(styles.pdfTrabTitleMarginBottom),
      fontWeight: 'bold',
      textAlign: 'left',
    },
  });

  const SimpleHeader: React.FC = () => (
    <View>
      {/* Logo por fuera del header verde, arriba a la izquierda */}
      <View style={pdfStyles.simpleHeaderTopRow}>
        <Image style={pdfStyles.simpleHeaderLogo} src={pdfLogoSrc} />
      </View>
      {/* Banda verde con el título centrado */}
      <View style={pdfStyles.simpleHeaderContainer}>
        <Text style={pdfStyles.simpleHeaderTitle}>
          Relevamiento de trabajadores Expuestos a Agentes de Riesgo
        </Text>
      </View>
    </View>
  );

  const FormularioRARPDF = ({ datos }: { datos: any }) => {
    if (!datos) return null;

    const resumen = {
      interno: datos.interno || datos.InternoFormularioRAR || '',
      cuit: cuipFormatter(datos.cuit || datos.CUIT || ''),
      razonSocial: datos.razonSocial || datos.RazonSocial || '',
      direccion: datos.direccion || datos.Direccion || '',
      estado: datos.estado || datos.Estado || '',
      cantTrabajadoresExpuestos:
        datos.cantTrabajadoresExpuestos || datos.CantTrabExpuestos || 0,
      cantTrabajadoresNoExpuestos:
        datos.cantTrabajadoresNoExpuestos || datos.CantTrabNoExpuestos || 0,
    };

    // TRABAJADORES: ahora son la tabla principal (abajo)
    const trabajadores = datos.detallesTrabajadores || [];
    const trabajadoresFormateados = trabajadores.map((t: any) => ({
      cuil: cuipFormatter(t.cuil || ''),
      nombre: t.nombre || '',
      sectorTarea: t.sectorTarea || '',
      fechaIngreso: fechaFormatter(t.fechaIngreso || ''),
      horasExposicion: t.horasExposicion || 0,
      fechaUltimoExamen: fechaFormatter(t.fechaUltimoExamenMedico || ''),
      agenteNombre: t.agenteNombre || '—',
    }));

    const columnasTrabajadores = [
      { key: 'cuil', title: 'CUIL', width: '15%' },
      { key: 'nombre', title: 'Apellido y Nombre', width: '25%' },
      { key: 'sectorTarea', title: 'Sector/Tarea', width: '20%' },
      { key: 'fechaIngreso', title: 'Fecha Ingreso', width: '12%' },
      { key: 'horasExposicion', title: 'Horas Exp.', width: '10%' },
      { key: 'fechaUltimoExamen', title: 'Fecha Últ. Examen', width: '12%' },
      { key: 'agenteNombre', title: 'Agente Causante', width: '18%' },
    ];

    return (
      <BaseDocumentPDF
        title={`Formulario RAR #${resumen.interno}`}
        headerComponent={SimpleHeader}
        columns={columnasTrabajadores}
        data={trabajadoresFormateados}
        orientation="landscape"
        itemsPerPage={trabajadoresFormateados.length || 1}
        customStyles={{}}
        renderCustomContent={() => (
          <>
            {/* Encabezado estilo RAR sin recuadro */}
            <View style={pdfStyles.resumenContainer}>
              {/* Línea 1: Razón Social (más grande) */}
              <Text style={pdfStyles.razonTitle}>
                Razón Social: {datos.empresaRazonSocial || '—'}
              </Text>

              {/* Fecha en su propia línea. Debajo: Contrato / CUIT / CIIU en la misma línea exacta */}
              <View style={pdfStyles.fechaRow}>
                <Text style={pdfStyles.fechaText}>
                  Fecha:{' '}
                  {formatearFecha(
                    datos.fechaCreacion
                  ) || '—'}
                </Text>
              </View>

              <View style={pdfStyles.contratoRow}>
                <Text style={pdfStyles.contratoText}>
                  Contrato: {String(datos.empresaContrato || datos.Contrato || '—')}
                </Text>
                <Text style={pdfStyles.contratoText}>
                  CUIT: {resumen.cuit || '—'}
                </Text>
                <Text style={pdfStyles.contratoTextNoRight}>
                  CIIU: {String(
                    datos.empresaCiiu ??
                    datos.ciiu ??
                    datos.CIIU ??
                    datos.ciiuPrincipal ??
                    '—'
                  )}
                </Text>
              </View>

              {/* NUEVO - Nro. Establecimiento */}
              <Text style={pdfStyles.estabNumeroTitle}>
                Nro. Establecimiento:{' '}
                {String(
                  datos.internoEstablecimiento ||
                  datos.InternoEstablecimiento ||
                  '—'
                )}
              </Text>


              {/* Datos del establecimiento */}
              <Text style={pdfStyles.infoText}>
                CIIU: {String(datos.establecimiento?.ciiu ?? '—')}
              </Text>

              <Text style={pdfStyles.infoText}>
                Dirección Establecimiento:{' '}
                {`${datos.establecimiento?.domicilioCalle ?? ''} ${datos.establecimiento?.domicilioNro ?? ''}`.trim() || '—'}
              </Text>

              <Text style={pdfStyles.infoText}>
                CP: {String(datos.establecimiento?.cp ?? '—')}
              </Text>

              <Text style={pdfStyles.infoText}>
                Localidad: {String(datos.establecimiento?.localidad ?? '—')}
              </Text>

              <Text style={pdfStyles.infoText}>
                Provincia: {String(datos.establecimiento?.provincia ?? '—')}
              </Text>

              <Text style={pdfStyles.infoText}>
                Teléfono: {String(datos.empresaTelefono ?? '—')}
              </Text>

              <Text style={pdfStyles.infoText}>
                Trabajadores Expuestos:{' '}
                {datos.cantTrabajadoresExpuestos ?? '—'}
              </Text>

              <Text style={pdfStyles.infoText}>
                Trabajadores No Expuestos:{' '}
                {datos.cantTrabajadoresNoExpuestos ?? '—'}
              </Text>

             <Text style={pdfStyles.infoText}>
              Actividad Principal:{' '}
              {String(datos.establecimientoActividadPrincipal ?? '—')}
            </Text>

             <Text style={pdfStyles.infoText}>
              Actividad Secundaria:{' '}
              {String(datos.establecimientoActividadSecundaria ?? '—')}
            </Text>        

            </View>

            {/* Título antes de la tabla de trabajadores */}
            {trabajadoresFormateados.length > 0 && (
              <Text style={pdfStyles.trabajadoresTitle}>
                Trabajadores Registrados ({trabajadoresFormateados.length})
              </Text>
            )}
          </>
        )}
      />
    );
  };

  //  MODIFICACIÓN 2: Creamos la configuración de tabs
  const tabItems = [
    {
      label: 'Formularios',
      value: 0, // Índice 0
      content: (
        <div>
          {/* MODIFICACIÓN: Botones de acción - removido "Editar" ya que ahora está en la tabla */}
          <div className={`${styles.flex} ${styles.gap12} ${styles.mb16}`}>
            <CustomButton onClick={handleClickNuevo} disabled={disableGenera}>
              Generar formulario
            </CustomButton>
          </div>

          {/* Tabla principal de formularios */}
          <div className={styles.compactTable}>
            <DataTable
              columns={tableColumns}
              data={formulariosRAR}
              onRowClick={onRowClick}
              isLoading={loading}
              manualPagination={true}
              pageIndex={PageIndex}
              pageSize={PageSize}
              pageCount={pageCount}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      ),
    },
    {
      label: 'Detalles',
      value: 1, // Índice 1
      content: (
        <div>
          {/*  MODIFICACIÓN 3: Contenido del tab de detalles */}
          {!registroSeleccionado ? (
            <div className={styles.emptyStateContainer}>
              <h3 className={styles.emptyStateTitle}>
                📋 Selecciona un Formulario RAR
              </h3>
              <p className={styles.emptyStateText}>
                Haz clic en cualquier fila de la tabla &quot;Formularios RAR&quot; para ver los detalles del formulario seleccionado aquí.
              </p>
            </div>
          ) : (
            <div>
              {/* Encabezado con información del formulario seleccionado */}
              <div className={styles.formularioHeader}>
                <div className={styles.formularioHeaderTop}>
                  <h3 className={styles.formularioTitle}>
                    📄 Formulario RAR #{registroSeleccionado.interno || registroSeleccionado.InternoFormularioRAR}
                  </h3>

                </div>
                <div className={styles.formularioGrid}>
                  <p><strong>Razón Social:</strong> {registroSeleccionado.razonSocial || '—'}</p>
                  <p><strong>CUIT:</strong> {cuipFormatter(registroSeleccionado.cuit) || '—'}</p>
                  <p><strong>Estado:</strong> {registroSeleccionado.estado || '—'}</p>
                  <p><strong>Dirección:</strong> {registroSeleccionado.direccion || '—'}</p>
                </div>
              </div>

              {/* Estados de carga y error */}
              {loadingDetalles && (
                <div className={styles.loadingMessage}>
                  <span>🔄 Cargando detalles de trabajadores...</span>
                </div>
              )}

              {errorDetalles && (
                <div className={styles.errorMessage}>
                  <span>❌ Error: {errorDetalles}</span>
                </div>
              )}

              {!loadingDetalles && !errorDetalles && detallesInterno.length === 0 && (
                <div className={styles.noDataMessage}>
                  <span>📝 No se encontraron trabajadores registrados para este formulario.</span>
                </div>
              )}

              {/*  MODIFICACIÓN: Tabla de trabajadores usando DataTable */}
              {!loadingDetalles && !errorDetalles && detallesInterno.length > 0 && (
                <div>
                  <div className={styles.trabajadoresHeader}>
                    <p className={`${styles.detallesInfo} ${styles.trabajadoresCount}`}>
                      <strong>👥 Trabajadores registrados: {detallesInterno.length}</strong>
                    </p>
                  </div>

                  {/* Usando el mismo componente DataTable*/}
                  <div className={styles.compactTable}>
                    <DataTable
                      columns={detalleColumns}
                      data={detallesInterno}
                      size="small"
                      isLoading={loadingDetalles}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {viewMode === 'list' ? (
        <div>
          {/* Selector de empresa */}
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
              disabled={isLoadingEmpresas}
            />
          </Box>

          <CustomTab
            tabs={tabItems}
            currentTab={activeTabIndex} // Usamos el estado
            onTabChange={handleTabChange} // Usamos el handler
          />
        </div>
      ) : viewMode === 'crear' ? (
        <FormularioRARGenerar
          cuit={empresaSeleccionada?.cuit ?? cuit}
          internoEstablecimiento={internoEstablecimiento}
          finalizaCarga={handleFinalizaCarga}
          formulariosRAR={formulariosRAR}
          replicaDe={replicaDe}
          razonSocial={empresaSeleccionada?.razonSocial}
        />
      ) : (
        <FormularioRARGenerar
          cuit={empresaSeleccionada?.cuit ?? cuit}
          internoEstablecimiento={internoEstablecimiento}
          finalizaCarga={handleFinalizaCarga}
          formulariosRAR={formulariosRAR}
          editarId={editaId}
          razonSocial={empresaSeleccionada?.razonSocial}
        />
      )}

      {/* Modal PDF */}
      <PDFModalViewer
        isOpen={modalPDFOpen}
        onClose={handleCerrarPDF}
        title={`Formulario RAR #${datosPDF?.interno || datosPDF?.InternoFormularioRAR || ''}`}
        pdfComponent={FormularioRARPDF}
        pdfProps={{ datos: datosPDF }}
      />
    </div>
  );
};

export default FormulariosRAR;
