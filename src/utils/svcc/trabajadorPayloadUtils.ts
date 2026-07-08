import type {
  ActividadDTO,
  ExamenMedicoDTO,
  TrabajadorBaseDTO,
  TrabajadorCreateDTO,
  TrabajadorDTO,
} from "@/data/svccAPI";

function toDateOnly(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  return value.slice(0, 10);
}

function toIsoDateTime(value?: string): string | undefined {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return undefined;
  return `${dateOnly}T00:00:00.000Z`;
}

/** Mapea examen médico del GET al modelo editable del formulario. */
function normalizeExamenFromApi(examen: ExamenMedicoDTO): ExamenMedicoDTO {
  return {
    interno: examen.interno,
    idExamen: examen.idExamen,
    fechaExamen: examen.fechaExamen,
    idConclusion: examen.idConclusion,
  };
}

/**
 * Mapea actividad del GET (idPuesto, fechaIngreso, etc.)
 * al modelo del POST/PUT (puestoInterno, fechaInicioExposicion, etc.).
 */
function normalizeActividadFromApi(actividad: ActividadDTO): ActividadDTO {
  return {
    interno: actividad.interno,
    puestoInterno: actividad.puestoInterno ?? actividad.idPuesto,
    sectorInterno: actividad.sectorInterno ?? actividad.idRamo,
    sustanciaInterno: actividad.sustanciaInterno ?? actividad.idActividad,
    permanente: actividad.permanente,
    fechaInicioExposicion: toDateOnly(
      actividad.fechaInicioExposicion ?? actividad.fechaIngreso,
    ),
    fechaFinExposicion: toDateOnly(
      actividad.fechaFinExposicion ?? actividad.fechaEgreso,
    ),
    examenesMedicos: (actividad.examenesMedicos ?? []).map(normalizeExamenFromApi),
  };
}

/** Normaliza trabajador recibido del GET para edición en el formulario. */
export function normalizeTrabajadorFromApi(trabajador: TrabajadorDTO): TrabajadorDTO {
  return {
    ...trabajador,
    fechaIngreso: toDateOnly(trabajador.fechaIngreso),
    actividades: (trabajador.actividades ?? []).map(normalizeActividadFromApi),
  };
}

function toExamenCreatePayload(examen: ExamenMedicoDTO): ExamenMedicoDTO {
  return { idExamen: examen.idExamen };
}

function toExamenUpdatePayload(examen: ExamenMedicoDTO): ExamenMedicoDTO {
  const payload: ExamenMedicoDTO = { idExamen: examen.idExamen };
  if (examen.interno != null && examen.interno > 0) {
    payload.interno = examen.interno;
  }
  return payload;
}

function toActividadCreatePayload(actividad: ActividadDTO): ActividadDTO {
  return {
    puestoInterno: actividad.puestoInterno,
    sectorInterno: actividad.sectorInterno,
    sustanciaInterno: actividad.sustanciaInterno,
    permanente: actividad.permanente,
    fechaInicioExposicion: toDateOnly(actividad.fechaInicioExposicion),
    fechaFinExposicion: toDateOnly(actividad.fechaFinExposicion),
    examenesMedicos: (actividad.examenesMedicos ?? []).map(toExamenCreatePayload),
  };
}

function toActividadUpdatePayload(actividad: ActividadDTO): ActividadDTO {
  const payload = toActividadCreatePayload(actividad);
  if (actividad.interno != null && actividad.interno > 0) {
    payload.interno = actividad.interno;
  }
  payload.examenesMedicos = (actividad.examenesMedicos ?? []).map(toExamenUpdatePayload);
  return payload;
}

/** Arma el body del POST /api/Trabajadores. */
export function toTrabajadorCreatePayload(
  data: TrabajadorDTO,
  presentacionId: number,
): TrabajadorCreateDTO {
  return {
    presentacionId,
    cuil: data.cuil,
    idEstablecimientoEmpresa: data.idEstablecimientoEmpresa,
    fechaIngreso: toDateOnly(data.fechaIngreso),
    actividades: (data.actividades ?? []).map(toActividadCreatePayload),
  };
}

/** Arma el body del PUT /api/Trabajadores/{id}. */
export function toTrabajadorUpdatePayload(data: TrabajadorDTO): TrabajadorBaseDTO {
  return {
    cuil: data.cuil,
    idEstablecimientoEmpresa: data.idEstablecimientoEmpresa,
    fechaIngreso: toIsoDateTime(data.fechaIngreso),
    actividades: (data.actividades ?? []).map(toActividadUpdatePayload),
  };
}
