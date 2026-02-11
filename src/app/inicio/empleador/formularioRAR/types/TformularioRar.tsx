/* Tipos (para datos de la tabla) */
export type FormularioRAR = {
  InternoFormularioRAR: number;
  CUIT: string;
  RazonSocial: string;
  Establecimiento: string;
  CantTrabExpuestos: number;
  CantTrabNoExpuestos: number;
  Estado: string;
  FechaHoraCreacion: string;
  FechaHoraConfirmado: string;
};

export type ParametersFormularioRar = {
  CUIT?: number;
  FechaPresentacion?: string;
  RefEstablecimientoId?: number;
  PageIndex?: number;
  PageSize?: number;
  OrderBy?: string;
};

export type ParametersEmpresaByCUIT = {
  CUIT?: number;
};

export type EstablecimientoById = {
  id: number;
}

export type ParametersEstablecimientoByCUIT = {
  CUIT?: number;
}


//#region Types Formularios RAR (POST)
export type FormularioRARDetallePostRequest = {
  internoFormulariosRar: number;
  cuil: number;
  nombre: string;
  sectorTarea: string;
  fechaIngreso: string;
  horasExposicion: number;
  fechaUltimoExamenMedico: string;
  codigoAgente: number;
  fechaInicioExposicion: string;
  fechaFinExposicion: string;
};

export type FormularioRARPostRequest = {
  cantTrabajadoresExpuestos: number;
  cantTrabajadoresNoExpuestos: number;
  fechaCreacion: string;
  fechaPresentacion: string | null;
  internoPresentacion: number;
  internoEstablecimiento: number;
  formularioRARDetalle: FormularioRARDetallePostRequest[];
};

export type FormularioRARPutRequest = FormularioRARPostRequest;

export type FormulariosRARApiResponse = unknown;
//#endregion Types Formularios RAR (POST)


export default FormularioRAR;