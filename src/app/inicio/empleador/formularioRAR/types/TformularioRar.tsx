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
  Activos?: string;
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


//#region Types Formularios RAR (GET por interno)
/** Detalle de trabajador tal como llega en `formularioRARDetalle` de `/api/FormulariosRAR/{id}`. */
export type FormularioRARDetalleItem = {
  internoFormulariosRar?: number;
  cuil?: number | string;
  nombre?: string;
  sectorTarea?: string;
  fechaIngreso?: string;
  horasExposicion?: number | string;
  fechaUltimoExamenMedico?: string;
  codigoAgente?: number | string;
  descripcionAgente?: string;
  fechaInicioExposicion?: string;
  fechaFinExposicion?: string;
};

/** Fila del detalle de trabajadores ya normalizada para la solapa Detalles y la exportación a Excel. */
export type DetalleTrabajador = {
  id: number;
  cuil: string;
  nombre: string;
  sectorTarea: string;
  fechaIngreso: string;
  fechaInicioExposicion: string;
  fechaFinExposicion: string;
  horasExposicion: number;
  agenteCausante: string;
  fechaUltimoExamenMedico: string;
};
//#endregion Types Formularios RAR (GET por interno)


export default FormularioRAR;