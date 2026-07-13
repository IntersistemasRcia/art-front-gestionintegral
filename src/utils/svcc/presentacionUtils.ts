import type { PresentacionCreateDTO, PresentacionUltimaDTO } from "@/data/svccAPI";
import type { Empresa } from "@/data/authAPI";

export function clonePresentacionUltima(ultima: PresentacionUltimaDTO): PresentacionUltimaDTO {
  return { ...ultima };
}

export function emptyPresentacionUltimaForm(empleadorCUIT: number, empleadorRazonSocial = ""): PresentacionUltimaDTO {
  return {
    interno: 0,
    empleadorCuit: empleadorCUIT,
    empleadorRazonSocial,
    idPresentacion: 0,
    numeroDePoliza: 0,
    idMotivo: 1,
    idProgramaMuestra: 0,
    version: 1,
    presentacionFecha: "",
    consolidacionFecha: "",
    observaciones: "",
    fechaInsert: "",
    constanciaGUID: "",
    constanciaArchivo: "",
  };
}

export function presentacionUltimaFormFromUltima(
  ultima: PresentacionUltimaDTO | null | undefined,
  empleadorCUIT: number,
): PresentacionUltimaDTO {
  if (ultima != null) return clonePresentacionUltima(ultima);
  return emptyPresentacionUltimaForm(empleadorCUIT);
}

type BuildIniciarPresentacionFormOptions = {
  ultima?: PresentacionUltimaDTO | null;
  empleadorCUIT: number;
  empresa?: Empresa | null;
  idProgramaMuestraParam?: number;
};

/** Arma el formulario de nueva presentación con campos bloqueados pre-cargados. */
export function buildIniciarPresentacionForm({
  ultima,
  empleadorCUIT,
  empresa,
  idProgramaMuestraParam,
}: BuildIniciarPresentacionFormOptions): PresentacionUltimaDTO {
  const base = presentacionUltimaFormFromUltima(ultima, empleadorCUIT);

  return {
    ...base,
    empleadorRazonSocial: base.empleadorRazonSocial || empresa?.razonSocial || "",
    numeroDePoliza: Number(empresa?.numeroDePoliza ?? 0) || 0,
    idProgramaMuestra: Number(idProgramaMuestraParam ?? 0) || 0,
    version: 1,
    observaciones: "",
  };
}

export function presentacionUltimaFormToCreate(
  form: PresentacionUltimaDTO,
  empleadorCUIT: number,
): PresentacionCreateDTO {
  return {
    empleadorCUIT,
    idMotivo: form.idMotivo,
    idProgramaMuestra: form.idProgramaMuestra,
    numeroDePoliza: form.numeroDePoliza,
    version: form.version,
    idPresentacion: form.idPresentacion,
    observaciones: form.observaciones,
    presentacionOrigenInterno: form.interno > 0 ? form.interno : undefined,
  };
}

export function hasPresentacionUltimaFecha(ultima?: PresentacionUltimaDTO | null): boolean {
  const pf = ultima?.presentacionFecha;
  return pf != null && pf !== "" && String(pf) !== "null";
}

/** Habilita iniciar cuando no hay última, error 500 en Ultima, o la última está confirmada (con fecha). */
export function canIniciarNuevaPresentacion(
  ultima: PresentacionUltimaDTO | null | undefined,
  ultimaError: { status?: number } | null | undefined,
  isLoadingUltima: boolean,
  empresaCUIT?: number,
): boolean {
  if (isLoadingUltima || empresaCUIT == null) return false;
  if (ultimaError?.status === 500) return true;
  if (ultimaError != null) return false;
  if (ultima == null) return true;
  return hasPresentacionUltimaFecha(ultima);
}
