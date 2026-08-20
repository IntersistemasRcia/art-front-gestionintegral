export type Establecimiento = {
  interno: number;
  cuit: number;
  nroSucursal: number;
  nombre: string;
  domicilioCalle: string | null;
  domicilioNro: string | null;
  superficie: number | null;
  cantTrabajadores: number | null;
  localidad?: string | null;
  provincia?: string | null;
  numero?: number | null;
  ciiu?: number | null;
};

export type TipoFormulario = {
  interno: number;
  descripcion: string;
  secciones?: Array<{
    interno: number;
    orden: number;
    descripcion: string;
    tieneNoAplica: number;
    comentario?: string;
    cuestionarios?: Array<{
      interno: number;
      internoSeccion: number;
      orden: number;
      codigo: number;
      pregunta: string;
      comentario: string;
    }>;
  }>;
};

export type RespuestaCuestionarioVm = {
  interno?: number;
  internoCuestionario?: number;
  internoRespuestaFormulario?: number;
  respuesta?: string;
  fechaRegularizacion?: number | null;
  fechaRegularizacionNormal?: string | null;
  observaciones?: string | null;
  estadoAccion?: string | null;
  estadoFecha?: number | null;
  estadoSituacion?: string | null;
  bajaMotivo?: number | null;
};

export type FormularioVm = {
  interno: number;
  creacionFechaHora: string;
  completadoFechaHora?: string | null;
  notificacionFecha?: string | null;
  internoFormulario: number;
  internoEstablecimiento: number;
  respuestasCuestionario: RespuestaCuestionarioVm[];
  respuestasGremio: any[];
  respuestasContratista: any[];
  respuestasResponsable: any[];
  internoPresentacion?: number;
  fechaSRT?: string | null;
};

export type GremioUI = { legajo?: number; nombre?: string };
export type ContratistaUI = { cuit?: number; contratista?: string };
export type ResponsableUI = {
  cuit?: number;
  responsable?: string;
  cargo?: string;
  representacion?: number;
  esContratado?: number;
  tituloHabilitante?: string;
  matricula?: string;
  entidadOtorganteTitulo?: string;
};
