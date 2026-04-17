import type { CabeceraData } from '../impresionFormulario/types/impresion';

export interface FormulariosRGRLProps {
  cuit: number;
  referenteDatos?: unknown;
}

export type FormularioRGRL = {
  InternoFormularioRGRL: number;
  CUIT: string;
  RazonSocial: string;
  Establecimiento: string;
  Formulario: string;
  Estado: string;
  FechaHoraCreacion: string;
  FechaHoraConfirmado: string;
  // Fecha cruda tal como viene de la API (ISO) para parseos/decisiones lógicas
  CreacionFechaHoraRaw?: string | null;
  FechaSRTRaw?: string | null;
};

export type FormularioRGRLDetalle = {
  Nro: number;
  Categoria: string;
  CategoriaOrden?: number;
  Pregunta: string;
  Respuesta: string;
  FechaRegularizacion: string;
  NormaVigente: string;
};

export type PlanillaAItem = { Codigo: string; Sustancia: string; SiNo: 'Sí' | 'No' | 'No Aplica' };
export type PlanillaBItem = { Codigo: string; Sustancia: string; SiNo: 'Sí' | 'No' | 'No Aplica' };
export type PlanillaCItem = { Codigo: string; Sustancia: string; SiNo: 'Sí' | 'No' | 'No Aplica'; NormaVigente: string };

export type GremioItem = { Legajo: string; Nombre: string };
export type ContratistaItem = { CUIT: string; Contratista: string };

export type ResponsableItem = {
  CUITCUIL: string;
  NombreApellido: string;
  Cargo: string;
  Representacion: string;
  PropioContratado: 'Propio' | 'Contratado';
  TituloHabilitante: string;
  Matricula: string;
  EntidadOtorgante: string;
};

export type PrintData = {
  cabecera: CabeceraData;
  detalle: FormularioRGRLDetalle[];
  planillaA: PlanillaAItem[];
  planillaB?: PlanillaBItem[];
  planillaC: PlanillaCItem[];
  gremios: GremioItem[];
  contratistas: ContratistaItem[];
  responsables: ResponsableItem[];
};

export type ApiTiposFormularios = Array<{
  descripcion: string;
  decreto: number;
  secciones: Array<{
    internoFormulario: number;
    orden: number;
    descripcion: string;
    pagina: number;
    planilla?: string;
    cuestionarios: Array<{
      codigo: number;
      pregunta: string;
      comentario: string;
    }>;
  }>;
}>;

export type TiposIndexItem = {
  pregunta: string;
  norma: string;
  seccion: string;
  pagina: number;
  planilla?: string;
  seccionOrden?: number;
};

export type ApiFormularioRGRL = {
  interno: number;
  cuit: string; //lo dejo como string porque de lo contrario no puedo mostrarlo en la datagrid. y me da error en la impresion, no puedo pasar el CUIT con guiones para que consulta en una query.
  razonSocial: string;
  direccion: string | null;
  descripcion: string | null;
  estado: string;
  creacionFechaHora: string | null;
  completadoFechaHora: string | null;
  internoFormulario: number | null;
  internoEstablecimiento: number | null;
  fechaSRT: string | null;
  respuestasCuestionario: unknown[];
  respuestasGremio: unknown[];
  respuestasContratista: unknown[];
  respuestasResponsable: unknown[];
};

export type ApiFormularioDetalle = {
  interno: number;
  cuit: number;
  razonSocial: string;
  direccion: string | null;
  descripcion: string | null;
  estado: string;
  creacionFechaHora: string | null;
  completadoFechaHora: string | null;
  internoFormulario: number | null;
  internoEstablecimiento: number | null;
  fechaSRT: string | null;
  respuestasCuestionario: Array<{
    interno: number;
    internoCuestionario: number;
    internoRespuestaFormulario: number;
    respuesta: string | null;
    fechaRegularizacion: number | null;
    observaciones: string | null;
    fechaRegularizacionNormal: string | null;
  }>;
  respuestasGremio?: Array<{ legajo?: string | number; nombre?: string }>;
  respuestasContratista?: Array<{ cuit?: string | number; contratista?: string; nombre?: string }>;
  respuestasResponsable?: Array<{
    cuit?: string;
    responsable?: string;
    cargo?: string;
    representacion?: string;
    propioContratado?: string;
    tituloHabilitante?: string;
    matricula?: string;
    entidadOtorganteTitulo?: string;
  }>;
};

export type ApiEstablecimientoEmpresa = {
  interno: number;
  cp: number;
  cuit: number;
  nroSucursal: number;
  nombre: string;
  domicilioCalle: string;
  domicilioNro: string;
  superficie: number;
  cantTrabajadores: number;
  estadoAccion: string;
  estadoFecha: number;
  estadoSituacion: string;
  bajaMotivo: number;
  localidad: string;
  provincia: string;
  codigo: number;
  numero: number;
  codEstabEmpresa: number;
  ciiu: number;
};

export type TabKey =
  | 'none'
  | 'planillaA'
  | 'planillaB'
  | 'planillaC'
  | 'gremios'
  | 'contratistas'
  | 'responsables';

export type DetallePayload = {
  detalle: FormularioRGRLDetalle[];
  gremios: { Legajo: string; Nombre: string }[];
  contratistas: { CUIT: string; Contratista: string }[];
  responsables: ResponsableItem[];
  planillaA: PlanillaAItem[];
  planillaB: PlanillaBItem[];
  planillaC: PlanillaCItem[];
  internoFormulario?: number | null;
  internoEstablecimiento?: number | null;
  fechaSRT?: string | null;
};

export type FormularioRGRLDeleteParams = {
    id: number | string;
};

export type FormularioRGRLDeleteResponse = unknown;
