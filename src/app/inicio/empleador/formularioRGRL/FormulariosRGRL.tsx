'use client';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import CustomButton from '@/utils/ui/button/CustomButton';
import DataTableImport from '@/utils/ui/table/DataTable';
import DataTableDetail from '@/utils/ui/table/DataTableDetail';
import { type DataTableDetailColumn } from '@/utils/ui/table/types';
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
import { MdDelete } from 'react-icons/md';
import ArtAPI from '@/data/artAPI';
import CustomModalMessage, { MessageType } from '@/utils/ui/message/CustomModalMessage';

let _tiposCache: ApiTiposFormularios | null = null;
//#region tipos-catalogos
// Cache de TiposFormulariosRGRL y utilitarios para mapear secciones/cuestionarios/planillas.
const cargarTipos = async (): Promise<ApiTiposFormularios> => {
  // Descarga (una sola vez) el catálogo de tipos; guarda en _tiposCache para reuso.
  if (_tiposCache) return _tiposCache;
  _tiposCache = await ArtAPI.getTiposFormulariosRGRL() as unknown as ApiTiposFormularios;
  return _tiposCache!;
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
  FechaSRTRaw: r.fechaSRT ?? null,
});

const soloDigitosCuit = (value: unknown) => String(value ?? '').replace(/\D/g, '');

/** `empresaId` en `useEmpresasStore` que coincide con el CUIT de la fila del listado RGRL. */
function empresaIdDesdeStorePorCuit(empresasList: Empresa[], cuitFila: unknown): number | undefined {
  const digitosFila = soloDigitosCuit(cuitFila);
  if (!digitosFila) return undefined;
  const found = empresasList.find((e) => soloDigitosCuit(e.cuit) === digitosFila);
  const id = found?.empresaId;
  return typeof id === 'number' && Number.isFinite(id) && id > 0 ? id : undefined;
}

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

const formatFechaAAAAMMDD = (v?: number | string | null): string => {
  if (v == null) return '';
  const s = String(v).replace(/\D/g, '');
  if (s.length !== 8) return '';
  const yyyy = s.slice(0, 4);
  const mm = s.slice(4, 6);
  const dd = s.slice(6, 8);
  return `${dd}/${mm}/${yyyy}`;
};

const CargarDetalleRGRL = async (id: number): Promise<DetallePayload> => {
  // GET /FormulariosRGRL/{id}: arma el payload completo para impresión y vista de detalle.
  const data = await ArtAPI.getFormularioRGRLById(id) as unknown as ApiFormularioDetalle;
  // Construir catálogo

  type Seccion = ApiTiposFormularios[0]['secciones'][0];
  type Cuestionario = Seccion['cuestionarios'][0];
  type CatItem = { codigo: number; seccion: string; seccionOrden: number; pregunta: string; norma: string; planilla: string };

  const tiposAll2 = await cargarTipos();
  const tipoForm2 = tiposAll2.find(f => f.secciones?.some(s => s.internoFormulario === Number(data.internoFormulario ?? 1)));
  const secsOrdenadas = (tipoForm2?.secciones ?? []).slice().sort((a: Seccion, b: Seccion) => (a.orden ?? 0) - (b.orden ?? 0));

  const catalogoNormal: CatItem[] = [];
  const catalogoPlanillaA: CatItem[] = [];
  const catalogoPlanillaB: CatItem[] = [];
  const catalogoPlanillaC: CatItem[] = [];

  for (const s of secsOrdenadas) {
    const planilla = (s.planilla ?? '').trim().toUpperCase();
    const cuests = (s.cuestionarios ?? []).slice().sort((a: Cuestionario, b: Cuestionario) => (a.codigo ?? 0) - (b.codigo ?? 0));
    for (const q of cuests) {
      const item: CatItem = { codigo: Number(q.codigo ?? 0), seccion: s.descripcion ?? '', seccionOrden: s.orden ?? 0, pregunta: q.pregunta ?? '', norma: q.comentario ?? '', planilla };
      if (planilla === 'A') catalogoPlanillaA.push(item);
      else if (planilla === 'B') catalogoPlanillaB.push(item);
      else if (planilla === 'C') catalogoPlanillaC.push(item);
      else catalogoNormal.push(item);
    }
  }

  type RespCuest = ApiFormularioDetalle['respuestasCuestionario'][0];

  const respOrdenadas = (data.respuestasCuestionario ?? []).slice()
    .sort((a: RespCuest, b: RespCuest) => (a.internoCuestionario ?? 0) - (b.internoCuestionario ?? 0));

  const nNormal = catalogoNormal.length;
  const respNormal = respOrdenadas.slice(0, nNormal);
  const respPlanillas = respOrdenadas.slice(nNormal);

  const items: FormularioRGRLDetalle[] = catalogoNormal.map((cat, i) => ({
    Nro: cat.codigo,
    Categoria: cat.seccion,
    CategoriaOrden: cat.seccionOrden,
    Pregunta: cat.pregunta,
    Respuesta: respNormal[i] ? mapRespuesta(respNormal[i].respuesta) : '',
    FechaRegularizacion: respNormal[i]
      ? ((respNormal[i].fechaRegularizacionNormal ?? '').toString().trim() || formatFechaAAAAMMDD(respNormal[i].fechaRegularizacion))
      : '',
    NormaVigente: cat.norma,
  }));

  const cleaned = items.filter(it => (it.Pregunta && it.Pregunta.trim()));
  cleaned.sort((a, b) => {
    const so = (a.CategoriaOrden ?? 0) - (b.CategoriaOrden ?? 0);
    if (so !== 0) return so;
    return (a.Nro ?? 0) - (b.Nro ?? 0);
  });

  // Planillas
  const bloques: RespCuest[][] = [];
  {
    let actual: RespCuest[] = [];
    for (let i = 0; i < respPlanillas.length; i++) {
      if (i === 0) { actual.push(respPlanillas[i]); continue; }
      const gap = (respPlanillas[i].internoCuestionario ?? 0) - (respPlanillas[i - 1].internoCuestionario ?? 0);
      if (gap > 10) { bloques.push(actual); actual = [respPlanillas[i]]; }
      else actual.push(respPlanillas[i]);
    }
    if (actual.length > 0) bloques.push(actual);
  }
  const bloquePA = bloques.find(b => b.length === catalogoPlanillaA.length) ?? respPlanillas.slice(0, catalogoPlanillaA.length);
  const bloquePB = bloques.find(b => b.length === catalogoPlanillaB.length && b !== bloquePA) ?? [];
  const bloquePC = bloques.find(b => b.length === catalogoPlanillaC.length && b !== bloquePA && b !== bloquePB) ?? [];

  const planillaA: PlanillaAItem[] = catalogoPlanillaA.map((cat, i) => ({
    Codigo: String(cat.codigo),
    Sustancia: cat.pregunta,
    SiNo: mapRespuesta(bloquePA[i]?.respuesta) as PlanillaAItem['SiNo'],
  }));

  const planillaB: PlanillaBItem[] = catalogoPlanillaB.map((cat, i) => ({
    Codigo: String(cat.codigo),
    Sustancia: cat.pregunta,
    SiNo: mapRespuesta(bloquePB[i]?.respuesta) as PlanillaBItem['SiNo'],
  }));

  const planillaC: PlanillaCItem[] = catalogoPlanillaC.map((cat, i) => ({
    Codigo: String(cat.codigo),
    Sustancia: cat.pregunta,
    SiNo: mapRespuesta(bloquePC[i]?.respuesta) as PlanillaCItem['SiNo'],
    NormaVigente: cat.norma,
  }));

  // Un valor identificatorio vacío, NULL o "0" indica un registro histórico incompleto que no debe mostrarse.
  const esIdentificadorVacio = (v: unknown) => {
    const s = String(v ?? '').trim();
    return !s || Number(s) === 0;
  };

  const gremios = (data.respuestasGremio ?? [])
    .filter(g => !esIdentificadorVacio(g.legajo))
    .map(g => ({
    Legajo: String(g.legajo ?? ''),
    Nombre: g.nombre ?? ''
  }));
  const contratistas = (data.respuestasContratista ?? [])
    .filter(c => !esIdentificadorVacio(c.cuit))
.map(c => ({
    CUIT: CUIP(c.cuit),
    Contratista: c.contratista ?? c.nombre ?? ''
  }));
  const responsables = (data.respuestasResponsable ?? [])
    .filter(r => !esIdentificadorVacio(r.cuit))
.map(r => ({
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
  const { user, hasTask } = useAuth();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const seleccionAutomaticaRef = useRef(false);
  const isAdmin = user?.rol?.toLowerCase() === 'administrador' || user?.rol?.toLowerCase() === 'administradorart';
  const sessionEmpresaIds = useMemo(() => {
    const fromSession = (user?.empresas ?? [])
      .filter((e) => e?.fechaBaja == null)
      .map((e) => e.empresaId)
      .filter((id): id is number => typeof id === "number" && Number.isFinite(id));
    const unique = Array.from(new Set(fromSession));
    if (unique.length > 0) return unique;
    return Array.from(new Set(empresas.map((e) => e.empresaId)));
  }, [user?.empresas, empresas]);
  const EMPRESA_TODAS_EMPRESAS_ID = -1;
  const EMPRESA_OPCION_TODAS: Empresa = {
    empresaId: EMPRESA_TODAS_EMPRESAS_ID,
    cuit: 0,
    razonSocial: "Todas las Empresas",
    domicilio: "",
    localidad: "",
    provincia: "",
  };
  const opcionesEmpresaSelector = useMemo(
    () => [EMPRESA_OPCION_TODAS, ...empresas],
    [empresas]
  );
  
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleteInterno, setDeleteInterno] = useState<number | null>(null);
  const [modalMsgOpen, setModalMsgOpen] = useState<boolean>(false);
  const [modalMsg, setModalMsg] = useState<string>('');
  const [modalMsgType, setModalMsgType] = useState<MessageType>('info');
  const [pendingRefresh, setPendingRefresh] = useState<boolean>(false);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageCount, setTablePageCount] = useState(1);

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

  // Página por rangos de 'interno' (mapas por tipo de formulario)
  const [tipoFormularioSelected, setTipoFormularioSelected] = useState<number | null>(null);

  const pagesByType = useMemo(() => {
    const a = [
      [1, 20],
      [21, 43],
      [44, 63],
      [64, 90],
      [91, 112],
      [113, 134],
      [135, 149],
      [150, 161]
    ];
    const b = [
      [1, 26],
      [27, 51],
      [52, 80],
      [81, 104],
      [105, 135],
      [136, 162],
      [163, 188],
      [189, 210]
    ];
    const c = [
      [1, 19],
      [20, 52],
      [53, 70],
      [71, 82],
      [83, 98],
      [99, 134],
      [135, 148],
      [149, 151]
    ];
    return { a, b, c } as const;
  }, []);

  const currentPages = useMemo(() => {
    if (tipoFormularioSelected === 1) return pagesByType.a;
    if (tipoFormularioSelected === 2) return pagesByType.b;
    if (tipoFormularioSelected === 3) return pagesByType.c;
    return null as null | number[][];
  }, [tipoFormularioSelected, pagesByType]);

  const totalPages = currentPages ? Math.max(1, currentPages.length) : Math.max(1, Math.ceil(detalleFiltrado.length / pageSize));

  const detallePageData = useMemo(() => {
    if (currentPages) {
      const idx = Math.max(0, Math.min(detallePage - 1, currentPages.length - 1));
      const sel = currentPages[idx] ?? [];
      if (Array.isArray(sel) && sel.length === 2) {
        const [from, to] = sel;
        return detalleFiltrado.filter(d => (d.Nro ?? 0) >= from && (d.Nro ?? 0) <= to).sort((x, y) => (x.Nro ?? 0) - (y.Nro ?? 0));
      }
      return [] as typeof detalleFiltrado;
    }
    return detalleFiltrado.slice((detallePage - 1) * pageSize, detallePage * pageSize);
  }, [detalleFiltrado, detallePage, currentPages]);

  // Asegura que la página actual no exceda el total de páginas al cambiar el detalle.
  useEffect(() => {
    if (detallePage > totalPages) setDetallePage(totalPages);
  }, [totalPages, detallePage]);

  // Seleccionar automáticamente si solo hay una empresa
  useEffect(() => {
    if (isLoadingEmpresas) return;
    if (empresas.length === 1) {
      setEmpresaSeleccionada(empresas[0]);
      seleccionAutomaticaRef.current = true;
      return;
    }
    if (empresas.length === 0) {
      setEmpresaSeleccionada(null);
      seleccionAutomaticaRef.current = false;
      return;
    }
    setEmpresaSeleccionada((prev) => {
      if (!seleccionAutomaticaRef.current && prev !== null) return prev;
      return EMPRESA_OPCION_TODAS;
    });
    seleccionAutomaticaRef.current = true;
  }, [empresas, isLoadingEmpresas]);

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
    setTablePage(1);
    setTablePageCount(1);
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
    if (empresa.empresaId === EMPRESA_TODAS_EMPRESAS_ID) return "Todas las Empresas";
    return `${empresa.razonSocial} - ${Formato.CUIP(empresa.cuit)}`;
  };

  const empresaIdsFiltro = useMemo(() => {
    if (!empresaSeleccionada) return [];
    if (empresaSeleccionada.empresaId === EMPRESA_TODAS_EMPRESAS_ID) {
      if (isAdmin) return [];
      return sessionEmpresaIds;
    }
    return [empresaSeleccionada.empresaId];
  }, [empresaSeleccionada, isAdmin, sessionEmpresaIds]);

  /** Para GetBySpecs en el modal Generar: `empresaId` por CUIT del combo vs `empresas` del store (misma lógica que edición). */
  const empresasIdGetBySpecsModalGenerar = useMemo(() => {
    if (!empresaSeleccionada) return [];
    if (empresaSeleccionada.empresaId === EMPRESA_TODAS_EMPRESAS_ID) return empresaIdsFiltro;
    const desdeStore = empresaIdDesdeStorePorCuit(empresas, empresaSeleccionada.cuit);
    if (desdeStore != null) return [desdeStore];
    return empresaIdsFiltro;
  }, [empresaSeleccionada, empresas, empresaIdsFiltro]);

  const canFetchFormularios = useMemo(() => {
    if (!empresaSeleccionada) return false;
    if (empresaSeleccionada.empresaId === EMPRESA_TODAS_EMPRESAS_ID) return true;
    return empresaIdsFiltro.length > 0;
  }, [empresaSeleccionada, empresaIdsFiltro]);

  const fetchFormularios = useCallback(
    // Busca cabeceras por empresasId; para Admin + "Todas", envía empresasId: [].
    async (empresasIdsParam?: number[]) => {
      try {
        setLoading(true);
        const empresasIds = Array.isArray(empresasIdsParam) ? empresasIdsParam : empresaIdsFiltro;
        if (!canFetchFormularios) {
          setFormulariosRGRL([]);
          setLoading(false);
          return;
        }
        setTablePage(1);
        const responseRaw = await ArtAPI.getFormulariosRGRL({
          empresasId: empresasIds,
          PageIndex: 1,
          PageSize: 10,
        });
        const response = { data: (responseRaw.data ?? []).map(mapApiToUi), pages: responseRaw.pages ?? 1 };
        setFormulariosRGRL(response.data ?? []);
        setTablePageCount(response.pages ?? 1);
      } finally {
        setLoading(false);
      }
    },
    [empresaIdsFiltro, canFetchFormularios]
  );

  // Variante rápida que solo actualiza la tabla sin activar el loading global
  const fetchFormulariosTable = useCallback(
    async (empresasIdsParam?: number[], page = 1) => {
      const empresasIds = Array.isArray(empresasIdsParam) ? empresasIdsParam : empresaIdsFiltro;
      if (!canFetchFormularios) return;
      const responseRaw = await ArtAPI.getFormulariosRGRL({
        empresasId: empresasIds,
        PageIndex: page,
        PageSize: 10,
      });
      const response = { data: (responseRaw.data ?? []).map(mapApiToUi), pages: responseRaw.pages ?? 1 };
      setFormulariosRGRL(response.data ?? []);
      setTablePageCount(response.pages ?? 1);
    },
    [empresaIdsFiltro, canFetchFormularios]
  );

  const handlePageChange = useCallback(
    async (page: number) => {
      setTablePage(page);
      if (!canFetchFormularios) return;
      const responseRaw = await ArtAPI.getFormulariosRGRL({
        empresasId: empresaIdsFiltro,
        PageIndex: page,
        PageSize: 10,
      });
      const response = { data: (responseRaw.data ?? []).map(mapApiToUi), pages: responseRaw.pages ?? 1 };
      setFormulariosRGRL(response.data ?? []);
      setTablePageCount(response.pages ?? 1);
    },
    [canFetchFormularios, empresaIdsFiltro]
  );
  
  // Carga inicial y recarga cuando cambian la empresa seleccionada o "referenteDatos".
  useEffect(() => {
    if (canFetchFormularios) {
      fetchFormularios(empresaIdsFiltro);
    }
  }, [fetchFormularios, referenteDatos, canFetchFormularios, empresaIdsFiltro]);

  const handleCloseModalMsg = async () => {
    setModalMsgOpen(false);
    if (pendingRefresh && canFetchFormularios) {
      await fetchFormulariosTable(empresaIdsFiltro, tablePage);
      setPendingRefresh(false);
    }
  };

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
    detalle: (data.detalle ?? [])
      .filter(r =>
        (r.Pregunta?.trim()) ||
        (r.Respuesta?.trim()) ||
        (r.FechaRegularizacion?.trim()) ||
        (r.NormaVigente?.trim())
      )
      .filter(r => {
        const cat = String(r.Categoria ?? '').toUpperCase();
        return !cat.includes('PLANILLA B');
      }),
    planillaA: data.planillaA,
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
            const empresaId = empresaIdDesdeStorePorCuit(empresas, row.original.CUIT);
            const qEmpresa =
              empresaId != null ? `&empresaId=${encodeURIComponent(String(empresaId))}` : '';
            router.push(`/inicio/empleador/formularioRGRL/editar?id=${interno}${qEmpresa}`);
          };

          const onCopy = (e: any) => {
            e.stopPropagation?.();
            const interno = Number(row.original.InternoFormularioRGRL || 0);
            if (!interno) return;
            setReplicaDe(interno);
            setOpenGenerar(true);
          };

          // Preferimos usar la fecha cruda (ISO) que guardamos en `CreacionFechaHoraRaw`; si no existe, usamos la cadena formateada.
          const estado = String(row.original.Estado ?? '').trim();
          const showEditar = (estado !== 'Confirmado' || hasTask('Empleador_FormularioRGRL_EditarDenunciaConfirmada'));
          const showReplicar = true;

      
          const fechaSRTraw = String((row.original as any).FechaSRTRaw ?? '').trim();
          const canPrint = estado === 'Confirmado' && !!fechaSRTraw;

          return (
            <div className={styles.iconActions}>
              {showEditar && (
                <BsPencilFill title="Editar" onClick={onEdit} className={styles.iconButton} />
              )}
              <BsFileEarmarkPdfFill
                title={canPrint ? 'Imprimir' : 'No es posible imprimir el formulario porque aún no fue presentado ante la SRT.'}
                onClick={canPrint ? onClick : (e: any) => { e.stopPropagation?.(); }}
                className={`${styles.iconButton} ${canPrint ? '' : styles.iconDisabled}`}
              />
              {showReplicar && (
                <BsFront title="Replicar" onClick={onCopy} className={styles.iconButton} />
              )}
              {hasTask('Empleador_FormularioRGRL_EditarDenunciaConfirmada') && (() => {
                const tieneConfirmado = String(row.original.FechaHoraConfirmado ?? '').trim() !== '';
                const internoActual = Number(row.original.InternoFormularioRGRL || 0);
                const onDel = !tieneConfirmado
                  ? (e: any) => { e.stopPropagation?.(); setDeleteInterno(internoActual); setDeleteConfirmOpen(true); }
                  : undefined;
                return (
                  <MdDelete
                    title="Eliminar"
                    onClick={onDel}
                    className={`${styles.iconButton} ${tieneConfirmado ? styles.iconDisabled : ''} ${styles.iconDelete}`}
                  />
                );
              })()}
            </div>
          );
        },
        meta: { align: 'center' },
        enableSorting: false,
      },
    ],
    [router, empresas]
  );
  // Re-define DataTable con tipado específico para este componente.
  const DataTable = DataTableImport as unknown as React.FC<{
    columns: any[];
    data: FormularioRGRL[];
    onRowClick?: (row: FormularioRGRL) => void;
    enableSearch?: boolean;
    style?: React.CSSProperties;
    manualPagination?: boolean;
    pageIndex?: number;
    pageSize?: number;
    pageCount?: number;
    onPageChange?: (page: number) => void;
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
    // Guardar el tipo de formulario (internoFormulario) para mapear páginas
    setTipoFormularioSelected(data.internoFormulario ?? null);

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
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleExportExcel = async () => {
    if (!canFetchFormularios) return;
    try {
      setExportingExcel(true);
      // Primera consulta para obtener el total de registros
      const countResponse = await ArtAPI.getFormulariosRGRL({
        empresasId: empresaIdsFiltro,
        PageIndex: 1,
        PageSize: 1,
      });
      const totalCount = countResponse.count ?? 0;
      if (totalCount === 0) {
        await saveTable(
          {
            CUIT: { header: 'CUIT', key: 'CUIT' },
            RazonSocial: { header: 'Razón Social', key: 'RazonSocial' },
            Establecimiento: { header: 'Establecimiento', key: 'Establecimiento' },
            Formulario: { header: 'Formulario', key: 'Formulario' },
            Estado: { header: 'Estado', key: 'Estado' },
            FechaHoraCreacion: { header: 'Fecha Hora Creación', key: 'FechaHoraCreacion' },
            FechaHoraConfirmado: { header: 'Fecha Hora Confirmado', key: 'FechaHoraConfirmado' },
          },
          [],
          'FormulariosRGRL.xlsx',
          { format: 'xlsx', sheet: { name: 'Formularios RGRL' } }
        );
        return;
      }
      // Segunda consulta trayendo todos los registros sin paginación
      const allResponse = await ArtAPI.getFormulariosRGRL({
        empresasId: empresaIdsFiltro,
        PageIndex: 1,
        PageSize: totalCount,
      });
      const allData = (allResponse.data ?? []).map(mapApiToUi);
      const columns: Record<string, TableColumn> = {
        CUIT: { header: 'CUIT', key: 'CUIT' },
        RazonSocial: { header: 'Razón Social', key: 'RazonSocial' },
        Establecimiento: { header: 'Establecimiento', key: 'Establecimiento' },
        Formulario: { header: 'Formulario', key: 'Formulario' },
        Estado: { header: 'Estado', key: 'Estado' },
        FechaHoraCreacion: { header: 'Fecha Hora Creación', key: 'FechaHoraCreacion' },
        FechaHoraConfirmado: { header: 'Fecha Hora Confirmado', key: 'FechaHoraConfirmado' },
      };
      await saveTable(columns, allData, 'FormulariosRGRL.xlsx', { format: 'xlsx', sheet: { name: 'Formularios RGRL' } });
    } finally {
      setExportingExcel(false);
    }
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
              options={opcionesEmpresaSelector}
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
                  : opcionesEmpresaSelector.length <= 1
                  ? "No hay empresas disponibles"
                  : "No se encontraron empresas"
              }
              disabled={isLoadingEmpresas}
            />
          </Box>

          {/* Acciones: editar, generar, replicar y exportar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <CustomButton
              onClick={handleClickGenerar}
              disabled={
                !empresaSeleccionada ||
                empresaSeleccionada.empresaId === EMPRESA_TODAS_EMPRESAS_ID ||
                !empresaSeleccionada.cuit
              }
            >
              Generar Formulario
            </CustomButton>

            <CustomButton onClick={handleExportExcel} disabled={exportingExcel}>
              {exportingExcel ? 'Exportando...' : 'Exportar a Excel'}
            </CustomButton>
          </div>

          {/* Tabla principal: resultados de la búsqueda */}
          <div className={styles.compactTable}>
            <DataTable
              columns={tableColumns}
              data={formulariosRGRL}
              onRowClick={onRowClick}
              enableSearch={false}
              manualPagination
              pageIndex={tablePage}
              pageSize={10}
              pageCount={tablePageCount}
              onPageChange={handlePageChange}
            />
          </div>
          {!!internoSeleccionado && (
            <div className={styles.tabsBar}>

              {totalPages > 1 && (
                <div className={styles.nums}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <CustomButton
                      key={n}
                      onClick={() => { setActiveTab('none'); setDetallePage(n); }}
                      color={activeTab === 'none' && n === detallePage ? 'secondary' : 'primary'}
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
                  { key: 'planillaC', label: 'Planilla C' },
                  { key: 'gremios', label: 'Gremios' },
                  { key: 'contratistas', label: 'Contratistas' },
                  { key: 'responsables', label: 'Responsables' },
                ].map(t => (
                  <CustomButton
                    key={t.key}
                    onClick={() => handleOpenTab(t.key as TabKey)}
                    color={activeTab === (t.key as TabKey) ? 'secondary' : 'primary'}
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
            <div className={styles.panelPlanillas}>
              {loadingTab ? (
                <div className={styles.panelLoadingTab}>cargando...</div>
              ) : (
                <>
                  {activeTab === 'planillaA' && (
                    <DataTableDetail<PlanillaAItem>
                      title="PLANILLA A - LISTADO DE SUSTANCIAS Y AGENTES CANCERÍGENOS (Res. SRT 81/2019)"
                      columns={[
                        { header: 'Código',    width: 90,  render: r => r.Codigo },
                        { header: 'Sustancia', align: 'left', render: r => r.Sustancia },
                        { header: 'Sí/No',    width: 80,  render: r => r.SiNo },
                      ] as DataTableDetailColumn<PlanillaAItem>[]}
                      rows={planillaA}
                      rowKey={(_, i) => String(i)}
                      pageSize={50}
                    />
                  )}

                  {activeTab === 'planillaB' && (
                    <DataTableDetail<PlanillaBItem>
                      title="PLANILLA B - DIFENILOS POLICLORADOS (Res. SRT 497/03)"
                      columns={[
                        { header: 'Código',    width: 90,  render: r => r.Codigo },
                        { header: 'Sustancia', align: 'left', render: r => r.Sustancia },
                        { header: 'Sí/No',    width: 80,  render: r => r.SiNo },
                      ] as DataTableDetailColumn<PlanillaBItem>[]}
                      rows={planillaB}
                      rowKey={(_, i) => String(i)}
                      pageSize={50}
                    />
                  )}

                  {activeTab === 'planillaC' && (
                    <DataTableDetail<PlanillaCItem>
                      title="PLANILLA C - SUSTANCIAS QUÍMICAS A DECLARAR (Res. SRT 743/03)"
                      columns={[
                        { header: 'Código',        width: 90,  render: r => r.Codigo },
                        { header: 'Sustancia',     align: 'left', render: r => r.Sustancia },
                        { header: 'Sí/No',         width: 80,  render: r => r.SiNo },
                        { header: 'Norma Vigente', align: 'left', render: r => r.NormaVigente },
                      ] as DataTableDetailColumn<PlanillaCItem>[]}
                      rows={planillaC}
                      rowKey={(_, i) => String(i)}
                      pageSize={50}
                    />
                  )}

                  {activeTab === 'gremios' && (
                    <DataTableDetail<GremioItem>
                      title="Representación Gremial"
                      columns={[
                        { header: 'Nro Legajo del Gremio', width: 200, render: r => r.Legajo },
                        { header: 'Nombre del Gremio',     align: 'left', render: r => r.Nombre },
                      ] as DataTableDetailColumn<GremioItem>[]}
                      rows={gremios}
                      rowKey={(_, i) => String(i)}
                    />
                  )}

                  {activeTab === 'contratistas' && (
                    <DataTableDetail<ContratistaItem>
                      title="Contratistas"
                      columns={[
                        { header: 'CUIT',        width: 160,  render: r => r.CUIT },
                        { header: 'Contratista', align: 'left', render: r => r.Contratista },
                      ] as DataTableDetailColumn<ContratistaItem>[]}
                      rows={contratistas}
                      rowKey={(_, i) => String(i)}
                    />
                  )}

                  {activeTab === 'responsables' && (
                    <DataTableDetail<ResponsableItem>
                      title="Datos Laborales del Profesional o Responsable del Formulario"
                      columns={[
                        { header: 'CUIT/CUIL/CUIP',                  render: r => r.CUITCUIL },
                        { header: 'Nombre y Apellido',                render: r => r.NombreApellido },
                        { header: 'Cargo',                            render: r => r.Cargo },
                        { header: 'Representación',                   render: r => r.Representacion },
                        { header: 'Propio/Contratado',                render: r => r.PropioContratado },
                        { header: 'Título Habilitante',               render: r => r.TituloHabilitante },
                        { header: 'N° Matrícula',                     render: r => r.Matricula },
                        { header: 'Entidad que otorgó el título',     render: r => r.EntidadOtorgante },
                      ] as DataTableDetailColumn<ResponsableItem>[]}
                      rows={responsables}
                      rowKey={(_, i) => String(i)}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Detalle principal: condiciones a cumplir y paginación del detalle */}
          {!!internoSeleccionado && activeTab === 'none' && (
            <div className={styles.panelCondiciones}>
              {loadingDetalle ? (
                <div className={styles.panelLoadingDetalle}>cargando detalle...</div>
              ) : detalleFiltrado.length === 0 ? (
                <div className={styles.panelVacio}>
                  No hay condiciones para mostrar.
                </div>
              ) : (
                <DataTableDetail<FormularioRGRLDetalle>
                  title="CONDICIONES A CUMPLIR"
                  columns={[
                    { header: 'Nro',                      width: 60,  render: r => r.Nro },
                    { header: 'Pregunta',                 align: 'left', render: r => r.Pregunta || '—' },
                    { header: 'Respuesta',                width: 120, render: r => r.Respuesta },
                    { header: 'Fecha de Regularización',  width: 170, render: r => r.FechaRegularizacion },
                    { header: 'Norma Vigente',            width: 260, align: 'left', render: r => r.NormaVigente || '—' },
                  ] as DataTableDetailColumn<FormularioRGRLDetalle>[]}
                  rows={detallePageData}
                  rowKey={r => String(r.Nro)}
                  pageSize={detallePageData.length || 1}
                  groupBy={r => (r.Categoria ?? 'Sin categoría').toString()}
                  groupOrder={r => r.CategoriaOrden ?? 0}
                />
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
          empresasIdGetBySpecs={empresasIdGetBySpecsModalGenerar}
          replicaDe={replicaDe}
          onClose={() => setOpenGenerar(false)}
          onDone={async () => {
            setOpenGenerar(false);
            if (canFetchFormularios) {
              await fetchFormularios(empresaIdsFiltro);
            }
          }}
        />
      </CustomModal>

      <CustomModal
        open={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteInterno(null); }}
        title="Confirmar eliminación"
        size="mid"
        actions={
          <div className={styles.confirmActions}>
            <CustomButton onClick={() => {
              const id = deleteInterno as number;
              setDeleteConfirmOpen(false);
              setDeleteInterno(null);
              ArtAPI.deleteFormularioRGRL(id).then(() => {
                setModalMsg('El formulario RGRL seleccionado fue borrado correctamente.');
                setModalMsgType('success');
                setPendingRefresh(true);
                setModalMsgOpen(true);
              }).catch(() => {
                setModalMsg('Operación cancelada.');
                setModalMsgType('error');
                setModalMsgOpen(true);
              });
            }}>SI</CustomButton>
            <CustomButton onClick={() => {
              setDeleteConfirmOpen(false);
              setDeleteInterno(null);
              setModalMsg('El formulario RGRL seleccionado no fue borrado.');
              setModalMsgType('error');
              setModalMsgOpen(true);
            }}>NO</CustomButton>
          </div>
        }
      >
        <div>
          El formulario RGRL seleccionado será Borrado. ¿Está seguro que desea continuar?
        </div>
      </CustomModal>
      <CustomModalMessage
        open={modalMsgOpen}
        onClose={handleCloseModalMsg}
        message={modalMsg}
        type={modalMsgType}
        title={modalMsgType === 'success' ? 'Formulario borrado' : modalMsgType === 'error' ? 'Formulario no borrado' : undefined}
      />


    </div>
  );
};

export default FormulariosRGRL;
