'use client';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import CustomButton from '@/utils/ui/button/CustomButton';
import DataTableImport from '@/utils/ui/table/DataTable';
import { saveTable, type TableColumn } from '@/utils/excelUtils';
import { useRouter } from 'next/navigation';

import VentanaImpresionFormulario from './impresionFormulario/VentanaImpresionFormulario';
import ImpresionFormulario from './impresionFormulario/ImpresionFormulario';
import type { CabeceraData } from './impresionFormulario/types/impresion';

import CustomModal from '@/utils/ui/form/CustomModal';
import GenerarFormularioRGRL from './generar/GenerarFormularioRGRL';
import Formato, { CUIP, Fecha, FechaHora } from '@/utils/Formato';
import { useAuth } from '@/data/AuthContext';
import dayjs from 'dayjs';
import styles from './FormulariosRGRL.module.css';
import { useEmpresasStore } from "@/data/empresasStore";
import { Empresa } from "@/data/authAPI";
import CustomSelectSearch from "@/utils/ui/form/CustomSelectSearch";
import { Box } from '@mui/material';
import type {
  FormulariosRGRLProps,
  FormularioRGRL,
  FormularioRGRLDetalle,
  PrintData,
  ApiTiposFormularios,
  TiposIndexItem,
  ApiFormularioRGRL,
  ApiFormularioDetalle,
  ApiEstablecimientoEmpresa,
  TabKey,
  PlanillaAItem,
  PlanillaBItem,
  PlanillaCItem,
  GremioItem,
  ContratistaItem,
  ResponsableItem,
  DetallePayload
} from './types/rgrl';
import { BsFileEarmarkPdfFill, BsPencilFill, BsFront } from "react-icons/bs";
import ArtAPI from '@/data/artAPI';

let _tiposCache: ApiTiposFormularios | null = null;
//#region tipos-catalogos
// Cache de TiposFormulariosRGRL y utilitarios para mapear secciones/cuestionarios/planillas.
const cargarTipos = async (): Promise<ApiTiposFormularios> => {
  // Descarga (una sola vez) el catálogo de tipos; guarda en _tiposCache para reuso.
  if (_tiposCache) return _tiposCache;
  const res = await fetch('http://arttest.intersistemas.ar:8302/api/TiposFormulariosRGRL', { cache: 'no-store' });
  if (!res.ok) throw new Error(`TiposFormulariosRGRL error ${res.status}`);
  _tiposCache = await res.json();
  return _tiposCache!;
};

const buildTiposIndex = async (internoFormulario: number): Promise<Map<number, TiposIndexItem>> => {
  // Índice por código de cuestionario metadatos (pregunta, norma, sección, planilla, orden).
  const all = await cargarTipos();
  const form = all.find(f => f.secciones?.some(s => s.internoFormulario === internoFormulario));
  const idx = new Map<number, TiposIndexItem>();
  form?.secciones?.forEach(s => {
    s.cuestionarios?.forEach(q => {
      idx.set(q.codigo, {
        pregunta: q.pregunta ?? '',
        norma: q.comentario ?? '',
        seccion: s.descripcion ?? '',
        pagina: s.pagina ?? 1,
        planilla: (s.planilla ?? '').trim().toUpperCase(),
        seccionOrden: s.orden ?? 0,
      });
    });
  });
  return idx;
};

const getPlanillaCuestionarios = async (internoFormulario: number, letra: 'A' | 'B' | 'C') => {
  // Devuelve cuestionarios pertenecientes a la planilla indicada (A/B/C) para el tipo de formulario.
  const all = await cargarTipos();
  const form = all.find(f => f.secciones?.some(s => s.internoFormulario === internoFormulario));
  const secs = form?.secciones?.filter(s => (s.planilla ?? '').trim().toUpperCase() === letra) ?? [];
  return secs.flatMap(s => s.cuestionarios ?? []);
};
//#endregion tipos-catalogos


const dt = (iso: string | null | undefined) => {
  //#region api-mappers-loaders
  // Helpers de formateo y funciones de carga que adaptan la API a las estructuras de UI.
  if (!iso) return '';
  const d = dayjs(iso);
  return d.isValid() ? d.format('DD-MM-YYYY HH:mm') : '';
};
const mapApiToUi = (r: ApiFormularioRGRL): FormularioRGRL => ({
  // Normaliza el registro de cabecera de la API al shape de la grilla principal.
  InternoFormularioRGRL: r.interno ?? 0,
  CUIT: r.cuit ?? '',
  RazonSocial: r.razonSocial ?? '',
  Establecimiento: r.direccion ?? '',
  Formulario:
    r.descripcion ??
    (r.internoFormulario === 1
      ? 'Formulario A General'
      : r.internoFormulario === 2
        ? 'Formulario B Construcción'
        : r.internoFormulario === 3
          ? 'Formulario C Agro'
          : r.internoFormulario
            ? `Formulario ${r.internoFormulario}`
            : ''),
  Estado: r.estado ?? '',
  FechaHoraCreacion: Fecha(r.creacionFechaHora),
  FechaHoraConfirmado: Fecha(r.completadoFechaHora),
  CreacionFechaHoraRaw: r.creacionFechaHora ?? null,
});

const CargarConsultaFormulariosRGRL = async (cuit: number): Promise<FormularioRGRL[]> => {

  // GET /FormulariosRGRL/{cuit}: obtiene lista de formularios para la grilla.
  // Solicitar todos los formularios añadiendo un pageSize alto para evitar la paginación del backend
  const url = `http://arttest.intersistemas.ar:8302/api/FormulariosRGRL?CUIT=${encodeURIComponent(
    cuit
  )}&pageSize=99999`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'text/json, application/json' },
  });

  if (res.status === 404) {
    console.info('[RGRL] CUIT sin formularios aún:', cuit);
    return [];
  }


  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    throw new Error(`GET ${url} -> ${res.status} ${raw}`);
  }
  // La API puede devolver { DATA: [...] } o { data: [...] } o directamente el array.
  const body = await res.json().catch(() => null);
  const arr =
    Array.isArray(body?.DATA) ? body.DATA :
      Array.isArray(body?.data) ? body.data :
        Array.isArray(body) ? body :
          [];

  const data: ApiFormularioRGRL[] = (arr ?? []) as ApiFormularioRGRL[];
  return data.map(mapApiToUi);

};

const CargarEstablecimientoPorId = async (id: number): Promise<ApiEstablecimientoEmpresa | null> => {
  if (!id) return null;
  try {
    const data = await ArtAPI.getEstablecimientoById({ id });
    return data as ApiEstablecimientoEmpresa;
  } catch (error) {
    console.error('[RGRL] Error al cargar establecimiento por id', id, error);
    return null;
  }
};


const mapRespuesta = (v?: string | null) =>
  // Normaliza 'S'/'N'/'A' a 'Sí'/'No'/'No Aplica'.
  v === 'S' ? 'Sí' : v === 'N' ? 'No' : v === 'A' ? 'No Aplica' : (v ?? '');

const normPropioContratado = (v?: string | number | null): 'Propio' | 'Contratado' => {
  // Convención: 0 => Propio, 1 => Contratado.
  if (v == null) return 'Propio';
  const n = Number(v);
  if (!Number.isNaN(n)) {
    if (n === 1) return 'Contratado';
    return 'Propio';
  }
  const s = String(v ?? '').trim().toLowerCase();
  if (s === 'contratado' || s === 'c' || s === 'externo' || s === '1' || s === 'true') return 'Contratado';
  return 'Propio';
};

const normCargo = (v?: string | null): string => {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (s === 'H') return 'Profesional de Higiene y Seguridad en el Trabajo';
  if (s === 'M') return 'Profesional de Medicina Laboral';
  if (s === 'R') return 'Responsable de Datos del Formulario';
  return s;
};

const normRepresentacion = (v?: string | number | null): string => {
  const n = Number(v);
  switch (n) {
    case 1:
      return 'Representante Legal';
    case 2:
      return 'Presidente';
    case 3:
      return 'VicePresidente';
    case 4:
      return 'Director General';
    case 5:
      return 'Gerente General';
    case 6:
      return 'Administrador General';
    case 0:
      return 'Otros';
    default:
      return String(v ?? '');
  }
};

const CargarDetalleRGRL = async (id: number): Promise<DetallePayload> => {
  // GET /FormulariosRGRL/{id}: arma el payload completo para impresión y vista de detalle.
  const res = await fetch(`http://arttest.intersistemas.ar:8302/api/FormulariosRGRL/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data: ApiFormularioDetalle = await res.json();

  const idx = await buildTiposIndex(Number(data.internoFormulario ?? 1));

  const rMap = new Map<number, string>();
  for (const r of (data.respuestasCuestionario ?? [])) {
    if (r?.internoCuestionario != null) rMap.set(Number(r.internoCuestionario), r.respuesta ?? '');
  }

  const items: FormularioRGRLDetalle[] = [];
  for (const r of (data.respuestasCuestionario ?? [])) {


    const key = Number(r.internoCuestionario);
    const meta = idx.get(key);
    const p = (meta?.planilla ?? '').toUpperCase();
    // Omite cuestionarios de planillas A/B/C: se muestran en sus tabs específicos.
    if (p === 'A' || p === 'B' || p === 'C') continue;
    if (!meta || !(meta.pregunta ?? '').trim()) continue;
    items.push({
      Nro: r.internoCuestionario ?? 0,
      Categoria: meta?.seccion ?? '',
      CategoriaOrden: meta?.seccionOrden ?? 0,
      Pregunta: meta?.pregunta ?? '',
      Respuesta: mapRespuesta(r.respuesta),
      FechaRegularizacion: r.fechaRegularizacionNormal ?? '',
      NormaVigente: meta?.norma ?? '',
    });
  }

  const cleaned = items.filter(it =>
    // Filtra filas vacías y mantiene únicamente las que tengan algún dato relevante.
    (it.Pregunta && it.Pregunta.trim()) ||
    (it.Respuesta && it.Respuesta.trim()) ||
    (it.FechaRegularizacion && it.FechaRegularizacion.trim()) ||
    (it.NormaVigente && it.NormaVigente.trim())
  );
  cleaned.sort((a, b) => {
    const so = (a.CategoriaOrden ?? 0) - (b.CategoriaOrden ?? 0);
    if (so !== 0) return so;
    return (a.Nro ?? 0) - (b.Nro ?? 0);
  });

  const qsA = await getPlanillaCuestionarios(Number(data.internoFormulario ?? 1), 'A');
  const planillaA: PlanillaAItem[] = qsA.map(q => ({
    Codigo: String(q.codigo ?? ''),
    Sustancia: q.pregunta ?? '',
    SiNo: mapRespuesta(rMap.get(Number(q.codigo))) as PlanillaAItem['SiNo'],
  }));

  const qsB = await getPlanillaCuestionarios(Number(data.internoFormulario ?? 1), 'B');
  const planillaB: PlanillaBItem[] = qsB.map(q => ({
    Codigo: String(q.codigo ?? ''),
    Sustancia: q.pregunta ?? '',
    SiNo: mapRespuesta(rMap.get(Number(q.codigo))) as PlanillaBItem['SiNo'],
  }));

  const qsC = await getPlanillaCuestionarios(Number(data.internoFormulario ?? 1), 'C');
  const planillaC: PlanillaCItem[] = qsC.map(q => ({
    Codigo: String(q.codigo ?? ''),
    Sustancia: q.pregunta ?? '',
    SiNo: mapRespuesta(rMap.get(Number(q.codigo))) as PlanillaCItem['SiNo'],
    NormaVigente: q.comentario ?? '',
  }));

  const gremios = (data.respuestasGremio ?? []).map(g => ({
    Legajo: String(g.legajo ?? ''),
    Nombre: g.nombre ?? ''
  }));
  const contratistas = (data.respuestasContratista ?? []).map(c => ({
    CUIT: CUIP(c.cuit),
    Contratista: c.contratista ?? c.nombre ?? ''
  }));
  const responsables = (data.respuestasResponsable ?? []).map(r => ({
    CUITCUIL: CUIP(r.cuit),
    NombreApellido: r.responsable ?? '',
    Cargo: normCargo(r.cargo),
    Representacion: normRepresentacion(r.representacion ?? r.representacion),
    PropioContratado: normPropioContratado((r as any).esContratado ?? (r as any).propioContratado),
    TituloHabilitante: r.tituloHabilitante ?? '',
    Matricula: r.matricula ?? '',
    EntidadOtorgante: r.entidadOtorganteTitulo ?? '',
  })) as ResponsableItem[];
  return {
    detalle: cleaned,
    gremios,
    contratistas,
    responsables,
    planillaA,
    planillaB,
    planillaC,
    internoFormulario: data.internoFormulario ?? null,
    internoEstablecimiento: data.internoEstablecimiento ?? null,
    fechaSRT: data.fechaSRT ?? null,
  };
};

//#endregion api-mappers-loaders
const FormulariosRGRL: React.FC<FormulariosRGRLProps> = ({ cuit, referenteDatos }) => {
  //#region component-state-effects
  // Estados principales: loading, lista de formularios, selección, detalle/planillas,
  // pestañas secundarias, modales (impresión/generación), y paginación del detalle.
  const router = useRouter();
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const seleccionAutomaticaRef = useRef(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [formulariosRGRL, setFormulariosRGRL] = useState<FormularioRGRL[]>([]);
  const [cargarFormulario, setCargarFormulario] = useState<boolean>(false);
  const [internoSeleccionado, setInternoSeleccionado] = useState<number>(0);

  const [detalle, setDetalle] = useState<FormularioRGRLDetalle[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<TabKey>('none');
  const [loadingTab, setLoadingTab] = useState<boolean>(false);
  const [planillaA, setPlanillaA] = useState<PlanillaAItem[]>([]);
  const [planillaC, setPlanillaC] = useState<PlanillaCItem[]>([]);
  const [planillaB, setPlanillaB] = useState<PlanillaBItem[]>([]);
  const [gremios, setGremios] = useState<GremioItem[]>([]);
  const [contratistas, setContratistas] = useState<ContratistaItem[]>([]);
  const [responsables, setResponsables] = useState<ResponsableItem[]>([]);

  const [printOpen, setPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<PrintData | null>(null);

  const [openGenerar, setOpenGenerar] = useState<boolean>(false);
  const [replicaDe, setReplicaDe] = useState<number | undefined>(undefined);

  const { user } = useAuth();
  // Accede a las propiedades de la sesión con seguridad
  const { empresaCUIT } = user as any;

  const isFilaVacia = (r: FormularioRGRLDetalle) =>
    !(
      (r.Pregunta && r.Pregunta.trim()) ||
      (r.Respuesta && r.Respuesta.trim()) ||
      (r.FechaRegularizacion && r.FechaRegularizacion.trim()) ||
      (r.NormaVigente && r.NormaVigente.trim())
    );


  const detalleFiltrado = useMemo(
    () => detalle.filter(r => !isFilaVacia(r)),
    [detalle]
  );
  // Paginación del detalle (20 filas por página).
  const [detallePage, setDetallePage] = useState<number>(1);
  const pageSize = 20;

  const totalPages = Math.max(1, Math.ceil(detalleFiltrado.length / pageSize));
  const detallePageData = useMemo(
    () => detalleFiltrado.slice((detallePage - 1) * pageSize, detallePage * pageSize),
    [detalleFiltrado, detallePage]
  );

  // Asegura que la página actual no exceda el total de páginas al cambiar el detalle.
  useEffect(() => {
    if (detallePage > totalPages) setDetallePage(totalPages);
  }, [totalPages, detallePage]);

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
    setFormulariosRGRL([]);
    setInternoSeleccionado(0);
    setActiveTab('none');
    setDetalle([]);
    setDetallePage(1);
    setGremios([]);
    setContratistas([]);
    setResponsables([]);
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

  const fetchFormularios = useCallback(
    // Busca cabeceras por CUIT; si CUIT inválido, limpia la grilla.
    async (cuitParam?: number) => {
      try {
        setLoading(true);
        const c = Number(cuitParam ?? empresaSeleccionada?.cuit);
        if (!c || Number.isNaN(c)) {
          setFormulariosRGRL([]);
          setLoading(false);
          return;
        }
        const response = await CargarConsultaFormulariosRGRL(c);
        setFormulariosRGRL(response ?? []);
      } finally {
        setLoading(false);
      }
    },
    [empresaSeleccionada?.cuit]
  );
  
  // Carga inicial y recarga cuando cambian la empresa seleccionada o "referenteDatos".
  useEffect(() => {
    if (empresaSeleccionada?.cuit) {
      fetchFormularios(empresaSeleccionada.cuit);
    }
  }, [fetchFormularios, referenteDatos, empresaSeleccionada?.cuit]);

  //#region table-and-handlers
  // Definición de columnas de la grilla principal y handlers asociados.
  const tableColumns = useMemo(
    () => [
      { accessorKey: 'CUIT', header: 'CUIT', cell: (info: any) => Formato.CUIP(info.getValue()) },
      { accessorKey: 'RazonSocial', header: 'Razón Social' },
      { accessorKey: 'Establecimiento', header: 'Establecimiento' },
      { accessorKey: 'Formulario', header: 'Formulario' },
      { accessorKey: 'Estado', header: 'Estado' },
      { accessorKey: 'FechaHoraCreacion', header: 'Fecha Creación', meta: { align: "center" } },
      { accessorKey: 'FechaHoraConfirmado', header: 'Fecha Confirmado', meta: { align: "center" } },

      {
        id: 'acciones',
        header: 'Acciones',
        //@ts-ignore
        cell: ({ row }) => {
          console.log("row", row)
 const onClick = async (e: any) => {
  e.stopPropagation?.();
  const interno = Number(row.original.InternoFormularioRGRL || 0);
  if (!interno) return;

  // 1) Detalle del formulario
  const data = await CargarDetalleRGRL(interno);

  // 2) Establecimiento por ID usando ArtAPI (/api/Establecimientos/{id})
  const estab = data.internoEstablecimiento
    ? await CargarEstablecimientoPorId(Number(data.internoEstablecimiento))
    : null;

  // 3) Cabecera para el PDF
  const cabecera: CabeceraData = {
    empresa: {
      razonSocial: row.original.RazonSocial,
      cuit: CUIP(row.original.CUIT),
      contrato: '',
      ciiu: estab?.ciiu != null ? String(estab.ciiu) : '',
    },
    establecimiento: {
      cuit: estab?.cuit != null ? String(estab.cuit) : String(row.original.CUIT || ''),
      numero: estab
        ? String(estab.numero ?? estab.codigo ?? estab.codEstabEmpresa ?? '')
        : '',
      ciiu: estab?.ciiu != null ? String(estab.ciiu) : '',
      direccion: estab
        ? `${String(estab.domicilioCalle ?? '').trim()} ${String(
            estab.domicilioNro ?? ''
          ).trim()}`.trim()
        : row.original.Establecimiento,

      //  CP real
      cp: estab?.cp != null && estab.cp !== 0 ? String(estab.cp) : '',

      localidad: estab?.localidad ?? '',
      provincia: estab?.provincia ?? '',

      superficie: estab?.superficie != null ? String(estab.superficie) : '',
      cantTrabajadores:
        estab?.cantTrabajadores != null ? String(estab.cantTrabajadores) : '',
    },
    fechaSRT: data.fechaSRT ?? '',
  };

  setPrintData({
    cabecera,
    detalle: (data.detalle ?? []).filter(r =>
      (r.Pregunta?.trim()) ||
      (r.Respuesta?.trim()) ||
      (r.FechaRegularizacion?.trim()) ||
      (r.NormaVigente?.trim())
    ),
    planillaA: data.planillaA,
    planillaB: data.planillaB,
    planillaC: data.planillaC,
    gremios: data.gremios,
    contratistas: data.contratistas,
    responsables: data.responsables,
  });
  setPrintOpen(true);
};
          const onEdit = (e: any) => {
            e.stopPropagation?.();
            const interno = Number(row.original.InternoFormularioRGRL || 0);
            if (!interno) return;
            router.push(`/inicio/empleador/formularioRGRL/editar?id=${interno}`);
          };

          const onCopy = (e: any) => {
            e.stopPropagation?.();
            const interno = Number(row.original.InternoFormularioRGRL || 0);
            if (!interno) return;
            setReplicaDe(interno);
            setOpenGenerar(true);
          };

          // Ocultar iconos de replicar/editar si la fecha de creación es >= 1 año
          // Preferimos usar la fecha cruda (ISO) que guardamos en `CreacionFechaHoraRaw`; si no existe, usamos la cadena formateada.
          const creadoRaw = (row.original as any).CreacionFechaHoraRaw ?? row.original.FechaHoraCreacion ?? '';
          const creado = dayjs(creadoRaw);
          const anos = creado.isValid() ? dayjs().diff(creado, 'year') : 0;
          const olderOrEqual1Year = creado.isValid() && anos >= 1;

          const estado = String(row.original.Estado ?? '').trim();
          const showEditar = estado !== 'Confirmado' && !olderOrEqual1Year;
          const showReplicar = !olderOrEqual1Year;

          return (
            <div className={styles.iconActions}>
              {showEditar && (
                <BsPencilFill title="Editar" onClick={onEdit} className={styles.iconButton} />
              )}
              <BsFileEarmarkPdfFill title="Imprimir" onClick={onClick} className={styles.iconButton} />
              {showReplicar && (
                <BsFront title="Replicar" onClick={onCopy} className={styles.iconButton} />
              )}
            </div>
          );
        },
        meta: { align: 'center' },
        enableSorting: false,
      },
    ],
    [router]
  );
  // Re-define DataTable con tipado específico para este componente.
  const DataTable = DataTableImport as unknown as React.FC<{
    columns: any[];
    data: FormularioRGRL[];
    onRowClick?: (row: FormularioRGRL) => void;
    enableSearch?: boolean;
    style?: React.CSSProperties;
  }>;

  const onRowClick = async (row: FormularioRGRL) => {
    const interno = Number(row.InternoFormularioRGRL || 0);
    setInternoSeleccionado(interno);
    setLoadingDetalle(true);
    setDetallePage(1);

    setActiveTab('none');
    setPlanillaA([]);
    setPlanillaC([]);
    setGremios([]);
    setContratistas([]);
    setResponsables([]);

    const data = await CargarDetalleRGRL(interno);
    setDetalle(data.detalle);
    setGremios(data.gremios);
    setContratistas(data.contratistas);
    setResponsables(data.responsables);
    setLoadingDetalle(false);

    setPlanillaA(data.planillaA);
    setPlanillaC(data.planillaC);
    setPlanillaB(data.planillaB);

  };

  const handleOpenTab = async (tab: TabKey) => {
    if (!internoSeleccionado) return;
    setActiveTab(tab);
    setLoadingTab(true);
    switch (tab) {
      case 'planillaA':
      case 'planillaC':
        break;
      case 'planillaB':
        break;
      case 'gremios':
      case 'contratistas':
      case 'responsables':
        break;
    }
    setLoadingTab(false);
  };

  const handleClickGenerar = () => {
    setReplicaDe(undefined);
    setOpenGenerar(true);
  };

  //#endregion table-and-handlers
  const handleExportExcel = async () => {
    const columns: Record<string, TableColumn> = {


      CUIT: { header: 'CUIT', key: 'CUIT' },
      RazonSocial: { header: 'Razón Social', key: 'RazonSocial' },
      Establecimiento: { header: 'Establecimiento', key: 'Establecimiento' },
      Formulario: { header: 'Formulario', key: 'Formulario' },
      Estado: { header: 'Estado', key: 'Estado' },
      FechaHoraCreacion: { header: 'Fecha Hora Creación', key: 'FechaHoraCreacion' },
      FechaHoraConfirmado: { header: 'Fecha Hora Confirmado', key: 'FechaHoraConfirmado' },
    };
    await saveTable(columns, formulariosRGRL, 'FormulariosRGRL.xlsx', { format: 'xlsx', sheet: { name: 'Formularios RGRL' } });
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
        <span>cargando...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Contenedor principal: buscador, acciones, tabla y detalle */}

      {!cargarFormulario ? (
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

          {/* Acciones: editar, generar, replicar y exportar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <CustomButton onClick={handleClickGenerar}>Generar Formulario</CustomButton>

            <CustomButton onClick={handleExportExcel}>Exportar a Excel</CustomButton>
          </div>

          {/* Tabla principal: resultados de la búsqueda */}
          <div className={styles.compactTable}>
            <DataTable columns={tableColumns} data={formulariosRGRL} onRowClick={onRowClick} enableSearch={false} />
          </div>
          {!!internoSeleccionado && (
            <div className={styles.tabsBar}>

              {totalPages > 1 && (
                <div className={styles.nums}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <CustomButton
                      key={n}
                      onClick={() => { setActiveTab('none'); setDetallePage(n); }}
                      style={{ fontWeight: n === detallePage ? 700 : 400 }}
                    >
                      {n}
                    </CustomButton>
                  ))}
                </div>
              )}

              {/* Pestanas: selección de planillas y listas auxiliares */}
              <div className={styles.pills}>
                {[
                  { key: 'planillaA', label: 'Planilla A' },
                  { key: 'planillaB', label: 'Planilla B' },
                  { key: 'planillaC', label: 'Planilla C' },
                  { key: 'gremios', label: 'Gremios' },
                  { key: 'contratistas', label: 'Contratistas' },
                  { key: 'responsables', label: 'Responsables' },
                ].map(t => (
                  <CustomButton
                    key={t.key}
                    onClick={() => handleOpenTab(t.key as TabKey)}
                    className={`${styles.pill} ${activeTab === (t.key as TabKey) ? styles.active : ''}`}
                    style={{ padding: '6px 12px' }}
                  >
                    {t.label}
                  </CustomButton>
                ))}
              </div>
            </div>
          )}

          {/* Paneles de planillas y listas (se muestran cuando activeTab != 'none') */}
          {activeTab !== 'none' && (
            <div style={{ marginTop: 10 }}>
              {loadingTab ? (
                <div style={{ padding: 12, textAlign: 'center' }}>cargando...</div>
              ) : (
                <>
                  {activeTab === 'planillaA' && (
                    <>
                      <div className={styles.tablaTitulo}>PLANILLA A - LISTADO DE SUSTANCIAS Y AGENTES CANCERÍGENOS (Res. SRT 81/2019)</div>
                      <table className={styles.sheetTable}>
                        <thead>
                          <tr>
                            <th style={{ width: 90 }}>Código</th>
                            <th>Sustancia</th>
                            <th style={{ width: 80 }}>Sí/No</th>
                          </tr>
                        </thead>
                        <tbody>
                          {planillaA.map((r, i) => (
                            <tr key={i}>
                              <td>{r.Codigo}</td>
                              <td>{r.Sustancia}</td>
                              <td>{r.SiNo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {activeTab === 'planillaB' && (
                    <>
                      <div className={styles.tablaTitulo}>PLANILLA B - DIFENILOS POLICLORADOS (Res. SRT 497/03)</div>
                      <table className={styles.sheetTable}>
                        <thead>
                          <tr>
                            <th style={{ width: 90 }}>Código</th>
                            <th>Sustancia</th>
                            <th style={{ width: 80 }}>Sí/No</th>
                          </tr>
                        </thead>
                        <tbody>
                          {planillaB.map((r, i) => (
                            <tr key={i}>
                              <td>{r.Codigo}</td>
                              <td>{r.Sustancia}</td>
                              <td>{r.SiNo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {activeTab === 'planillaC' && (
                    <>
                      <div className={styles.tablaTitulo}>PLANILLA C - SUSTANCIAS QUÍMICAS A DECLARAR (Res. SRT 743/03)</div>
                      <table className={styles.sheetTable}>
                        <thead>
                          <tr>
                            <th style={{ width: 90 }}>Código</th>
                            <th>Sustancia</th>
                            <th style={{ width: 80 }}>Sí/No</th>
                            <th>Norma Vigente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {planillaC.map((r, i) => (
                            <tr key={i}>
                              <td>{r.Codigo}</td>
                              <td>{r.Sustancia}</td>
                              <td>{r.SiNo}</td>
                              <td>{r.NormaVigente}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {activeTab === 'gremios' && (
                    <>
                      <h2 style={{ textAlign: 'center' }}>Representación Gremial</h2>
                      <table className={styles.sheetTable}>
                        <thead>
                          <tr>
                            <th>Nro Legajo del Gremio</th>
                            <th>Nombre del Gremio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gremios.map((g, i) => (
                            <tr key={i}>
                              <td>{g.Legajo}</td>
                              <td>{g.Nombre}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {activeTab === 'contratistas' && (
                    <>
                      <h2 style={{ textAlign: 'center' }}>Contratistas</h2>
                      <table className={styles.sheetTable}>
                        <thead>
                          <tr>
                            <th style={{ width: 160 }}>CUIT</th>
                            <th>Contratista</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contratistas.map((c, i) => (
                            <tr key={i}>
                              <td>{c.CUIT}</td>
                              <td>{c.Contratista}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {activeTab === 'responsables' && (
                    <>
                      <h2 style={{ textAlign: 'center' }}>Datos Laborales del Profesional o Responsable del Formulario</h2>
                      <table className={styles.sheetTable}>
                        <thead>
                          <tr>
                            <th>CUIT/CUIL/CUIP</th>
                            <th>Nombre y apellido</th>
                            <th>Cargo</th>
                            <th>Representación</th>
                            <th>Propio/contratado</th>
                            <th>Título habilitante</th>
                            <th>N° matrícula</th>
                            <th>Entidad que otorgó el título habilitante</th>
                          </tr>
                        </thead>
                        <tbody>
                          {responsables.map((r, i) => (
                            <tr key={i}>
                              <td>{r.CUITCUIL}</td>
                              <td>{r.NombreApellido}</td>
                              <td>{r.Cargo}</td>
                              <td>{r.Representacion}</td>
                              <td>{r.PropioContratado}</td>
                              <td>{r.TituloHabilitante}</td>
                              <td>{r.Matricula}</td>
                              <td>{r.EntidadOtorgante}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Detalle principal: condiciones a cumplir y paginación del detalle */}
          {!!internoSeleccionado && activeTab === 'none' && (
            <div style={{ marginTop: 18 }}>
              <h2 style={{ textAlign: 'center', margin: '12px 0 6px' }}>CONDICIONES A CUMPLIR</h2>
              {loadingDetalle ? (
                <div style={{ padding: 16, textAlign: 'center' }}>cargando detalle...</div>

              ) : (
                detalleFiltrado.length === 0 ? (
                  <div style={{ padding: 12, textAlign: 'center', opacity: 0.7 }}>
                    No hay condiciones para mostrar.
                  </div>
                ) : (
                  <div className={styles.detalleTable}>
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>NRO</th>
                          <th>PREGUNTA</th>
                          <th style={{ width: 120 }}>RESPUESTA</th>
                          <th style={{ width: 170 }}>FECHA DE REGULARIZACIÓN</th>
                          <th style={{ width: 260 }}>NORMA VIGENTE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detallePageData.map((r) => (
                          <tr key={r.Nro}>
                            <td>{r.Nro}</td>
                            <td>{r.Pregunta || '—'}</td>
                            <td>{r.Respuesta}</td>
                            <td>{r.FechaRegularizacion}</td>
                            <td>{r.NormaVigente || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Modal de impresión: muestra la vista para imprimir */}
      {printOpen && printData && (
        <VentanaImpresionFormulario
          // Abre ventana de impresion
          open={printOpen}
          onClose={() => { setPrintOpen(false); setPrintData(null); }}
        >
          <ImpresionFormulario
            cabecera={printData.cabecera}
            detalle={printData.detalle}
            planillaA={printData.planillaA}
            planillaB={printData.planillaB}
            planillaC={printData.planillaC}
            gremios={printData.gremios}
            contratistas={printData.contratistas}
            responsables={printData.responsables}
          />
        </VentanaImpresionFormulario>
      )}

      {/* Modal generar/replicar: abre el componente GenerarFormularioRGRL */}
      <CustomModal
        //Modal generar/replicar
        open={openGenerar}
        onClose={() => setOpenGenerar(false)}
        title={replicaDe ? 'Replicar Formulario RGRL' : 'Generar Formulario RGRL'}
        size="large"
      >
        <GenerarFormularioRGRL
          //Generar
          initialCuit={empresaSeleccionada?.cuit || undefined}
          replicaDe={replicaDe}
          onDone={async () => {
            setOpenGenerar(false);
            if (empresaSeleccionada?.cuit) {
              await fetchFormularios(empresaSeleccionada.cuit);
            }
          }}
        />
      </CustomModal>


    </div>
  );
};

export default FormulariosRGRL;
