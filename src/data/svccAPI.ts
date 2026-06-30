import useSWR, { Fetcher, SWRConfiguration } from "swr";
import useSWRMutation, { type SWRMutationConfiguration } from "swr/mutation";
import { ExternalAPI } from "./api";
import { token } from "./usuarioAPI";
import { toURLSearch } from "@/utils/utils";
import axios, { AxiosError } from "axios";

const tokenizable = token.configure();

const SVCC_CONSTANCIA_DEFAULT_FILENAME = "constancia.pdf";

function filenameFromContentDispositionHeaders(headers: Record<string, unknown>): string {
  const h = headers as {
    get?: (name: string) => string | undefined | null;
  } & Record<string, unknown>;
  const fromGet =
    typeof h.get === "function"
      ? h.get("content-disposition") ?? h.get("Content-Disposition")
      : undefined;
  const headerRaw =
    typeof fromGet === "string" && fromGet.length > 0
      ? fromGet
      : h["content-disposition"] ?? h["Content-Disposition"];
  const header = typeof headerRaw === "string" ? headerRaw.trim() : "";
  if (!header) return SVCC_CONSTANCIA_DEFAULT_FILENAME;

  const star = /filename\*=(?:UTF-8'')?([^;\n]+)/i.exec(header)?.[1]?.trim();
  if (star) {
    try {
      const decoded = decodeURIComponent(star.replace(/^"+|"+$/g, ""));
      if (decoded) return decoded;
    } catch {
      /* seguir con filename= */
    }
  }

  const quoted = /filename\s*=\s*"([^"]+)"/i.exec(header)?.[1]?.trim();
  if (quoted) return quoted;

  const unquoted = /filename\s*=\s*([^;\n]+)/i.exec(header)?.[1]?.trim()?.replace(/^"+|"+$/g, "") ?? "";
  return unquoted.length > 0 ? unquoted : SVCC_CONSTANCIA_DEFAULT_FILENAME;
}
//#region Types SVCC (DTOs y contratos de hooks — mismo módulo que el fetching ART)
export type Pagination<T> = {
  index: number;
  size: number;
  pages: number;
  count: number;
  data: T[];
}

//#region Types SVCC common
export type PresentacionBaseDTO = {
  observaciones?: string,
}
export type PresentacionCreateDTO = PresentacionBaseDTO & {
  empleadorCUIT: number;
  idMotivo?: number;
  idProgramaMuestra?: number;
  numeroDePoliza?: number;
  version?: number;
  idPresentacion?: number;
  /** Interno de la presentación origen desde la cual se copian los datos. */
  presentacionOrigenInterno?: number;
}
/** Body PUT `/api/Presentaciones/Finaliza` */
export type PresentacionFinalizaDTO = {
  id: number;
  observaciones: string;
}
export type PresentacionDTO = PresentacionBaseDTO & {
  interno: number,
  idMotivo?: number,
  presentacionFecha?: string,
  empleadorCuit?: number,
  empleadorRazonSocial?: string,
}
export type EmpresaTercerizadaBaseDTO = {
  idEstablecimientoEmpresa?: number;
  cuit?: number;
  ciiu?: number;
  cantidadTrabajadores?: number;
}
export type EmpresaTercerizadaCreateDTO = EmpresaTercerizadaBaseDTO & {
  presentacionId: number;
}
export type EmpresaTercerizadaDTO = EmpresaTercerizadaBaseDTO & {
  interno: number;
}
export type PuestoDTO = {
  interno?: number;
  nombre?: string;
  ciuo?: number;
}
export type SectorDTO = {
  interno?: number;
  nombre?: string;
  ciiu?: number;
}
export type ResponsableDTO = {
  interno?: number;
  cuilCuit?: number;
  idContratacion?: number;
  idRepresentacion?: number;
  idTipoProfesionalResponsable?: number;
  matricula?: string;
  cantHorasAsignadas?: number;
}
export type ContratistaDTO = {
  interno: number;
  cuit?: number;
  ciiu?: number;
  cantidadTrabajadores?: number;
}
export type EstablecimientoDeclaradoBaseDTO = {
  idEstablecimientoEmpresa?: number;
  descripcionActividad?: string;
  cantTrabEventualesProd: number;
  cantTrabEventualesAdmin?: number;
  cantTrabPropiosProd?: number;
  cantTrabPropiosAdmin?: number;
  mail?: string;
  telefono?: string;
  cuilContacto?: number;
  permitidoFumar?: number;
  lugaresCerradosParaFumar?: number;
  puestos?: PuestoDTO[];
  sectores?: SectorDTO[];
  responsables?: ResponsableDTO[];
  contratistas?: ContratistaDTO[];
}
export type EstablecimientoDeclaradoCreateDTO = EstablecimientoDeclaradoBaseDTO & {
  presentacionId: number;
}
export type EstablecimientoDeclaradoDTO = EstablecimientoDeclaradoBaseDTO & {
  interno: number;
}
export type UtilizacionDTO = {
  interno?: number;
  usoOrigen?: number;
  modoDeEmpleo?: number;
  fechaInsert?: string;
}
export type MedidaPreventivaDTO = {
  interno?: number;
  idMedidaPreventivaDeclarado?: number;
}
export type ElementoProteccionDTO = {
  interno?: number;
  idElementoDeProteccionDeclarado?: number;
}
export type PuestoAfectadoDTO = {
  interno?: number;
  puestoInterno?: number;
  descripcionActividad?: string;
  informaSobreRiesgos?: boolean;
  capacitacionSobreRiesgos?: boolean;
  entregaElementosDeProteccion?: boolean;
  descripcionEstudios?: string;
  licenciaEspecial?: boolean;
  medidasPreventivasDelPuesto?: MedidaPreventivaDTO[];
  elementosProteccionPersonal?: ElementoProteccionDTO[];
}
export type DosimetriaDTO = {
  interno?: number;
  cantidadDePersonal?: number;
  idTipoDosimetria?: number;
  idMetodoDosimetria?: number;
  cuitResponsable?: number;
}
export type ResponsableUsoDTO = {
  interno?: number;
  cuil?: number;
  autorizacionIndividual?: string;
  nroPermisoHabilitante?: string;
  matriculaProfesional?: string;
  fechaExpedicion?: string;
  fechaVencimiento?: string;
}
export type ResponsableInstalacionDTO = {
  interno?: number;
  cuil?: number;
  nroLicenciaHabilitante?: string;
  domicilioHabilitacion?: string;
  fechaExpedicion?: string;
  fechaVencimiento?: string;
}
export type EncargadoProteccionDTO = {
  interno?: number;
  cuil?: number;
  tituloProfesional?: string;
  matriculaProfesional?: string;
  nroHabilitacion?: string;
}
export type EquipoRadiologicoDTO = {
  interno?: number;
  marca?: string;
  modelo?: string;
  idTipoEquipo?: number;
  idCaracteristicaEquipo?: number;
  idTipoRadiacion?: number;
  actividad?: string;
  radioisotopoFuente?: string;
  idTipoFuente?: number;
  potenciaEquipoKVP?: number;
  potenciaEquipomAp?: number;
  potenciaEquipoMeV?: number;
  procesamientoImagenes?: boolean;
  metodoProcesamiento?: number;
  observaciones: string;
  dosimetria?: DosimetriaDTO;
  responsablesDeUso?: ResponsableUsoDTO[];
  responsablesDeInstalacion?: ResponsableInstalacionDTO[];
  encargadosDeProteccionRadiologica?: EncargadoProteccionDTO[];
}
export type ProveedorDTO = {
  interno?: number;
  cuit?: number;
  nombreComercial?: string;
}
export type CompradorDTO = {
  interno?: number;
  cuit?: number;
  nombreComercial?: string;
}
export type EstudioAmbientalDTO = {
  interno?: number;
  cantidadFrecuencia?: number;
  idUnidadFrecuencia?: number;
  metodologiaEmpleada?: string;
}
export type EstudioBiologicoDTO = {
  interno?: number;
  cantidadFrecuencia?: number;
  idUnidadFrecuencia?: number;
  analisisEstudiosComplementacion?: string;
}
export type SustanciaBaseDTO = {
  idEstablecimientoEmpresa?: number;
  idSustancia?: number;
  nombreComercial?: string;
  cantidadAnual?: number;
  idUnidadDeMedida?: number;
  utilizaciones?: UtilizacionDTO[];
  puestosAfectados?: PuestoAfectadoDTO[];
  equiposRadiologicos?: EquipoRadiologicoDTO[];
  proveedores?: ProveedorDTO[];
  compradores?: CompradorDTO[];
  estudiosAmbientalesEspecificos?: EstudioAmbientalDTO[];
  estudiosBiologicosEspecificos?: EstudioBiologicoDTO[];
}
export type SustanciaCreateDTO = SustanciaBaseDTO & {
  presentacionId: number;
}
export type SustanciaDTO = SustanciaBaseDTO & {
  interno: number;
}
export type ExamenMedicoDTO = {
  interno?: number;
  idExamen?: number;
  fechaExamen?: string;
  idConclusion?: number;
}
export type ActividadDTO = {
  interno?: number;
  idActividad?: number;
  idPuesto?: number;
  idRamo?: number;
  idCategoria?: number;
  puestoInterno?: number;
  sectorInterno?: number;
  sustanciaInterno?: number;
  permanente?: boolean;
  fechaInicioExposicion?: string;
  fechaFinExposicion?: string;
  fechaIngreso?: string;
  fechaEgreso?: string;
  examenesMedicos?: ExamenMedicoDTO[];
}
export type TrabajadorBaseDTO = {
  presentacionInterno?: number;
  empleadorCUIT?: number;
  cuil?: number;
  idEstablecimientoEmpresa?: number;
  fechaIngreso?: string;
  fechaEgreso?: string;
  actividades?: ActividadDTO[];
}
export type TrabajadorCreateDTO = TrabajadorBaseDTO & {
  presentacionId: number;
}
export type TrabajadorDTO = TrabajadorBaseDTO & {
  interno: number;
}
//#endregion Types SVCC common

//#region Types SVCC/Presentaciones/Todas
export type SVCCPresentacionTodasParams = {
  empleadorCUIT?: number;
  empleadorCuit?: number[];
  PageIndex?: number;
  PageSize?: number;
  Order?: string;
};

export type SVCCPresentacionTodasPostBody = {
  empleadorCuit: number[];
  order?: string;
  pageIndex?: number;
  pageSize?: number;
};

export type SVCCPresentacionTodasSWRKey = [url: string, token: string, params: string];
export type SVCCPresentacionTodasOptions = SWRConfiguration<Pagination<PresentacionDTO>, AxiosError, Fetcher<Pagination<PresentacionDTO>, SVCCPresentacionTodasSWRKey>>
//#endregion Types SVCC/Presentaciones/Todas

//#region Types SVCC/Presentaciones/Obtener
export type SVCCPresentacionObtenerParams = {
  id: number;
}
export type SVCCPresentacionObtenerSWRKey = [url: string, token: string, params: string];
export type SVCCPresentacionObtenerOptions = SWRConfiguration<PresentacionDTO, AxiosError, Fetcher<PresentacionDTO, SVCCPresentacionObtenerSWRKey>>
//#endregion Types SVCC/Presentaciones/Obtener

//#region Types SVCC/Presentaciones/Ultima
export type PresentacionUltimaDTO = {
  interno: number;
  empleadorCuit: number;
  empleadorRazonSocial: string;
  idPresentacion: number;
  numeroDePoliza: number;
  idMotivo: number;
  idProgramaMuestra: number;
  version: number;
  presentacionFecha: string;
  consolidacionFecha: string;
  observaciones: string;
  fechaInsert: string;
  constanciaGUID: string;
  constanciaArchivo: string;
}

export type SVCCPresentacionUltimaParams = {
  empleadorCuit: number;
}
export type SVCCPresentacionUltimaSWRKey = [url: string, token: string, empleadorCuit: string];
export type SVCCPresentacionUltimaOptions = SWRConfiguration<PresentacionUltimaDTO | null, AxiosError, Fetcher<PresentacionUltimaDTO | null, SVCCPresentacionUltimaSWRKey>>
//#endregion Types SVCC/Presentaciones/Ultima

//#region Types SVCC/Presentaciones/Nueva
export type SVCCPresentacionNuevaSWRKey = [url: string, token: string];
export type SVCCPresentacionNuevaOptions = SWRMutationConfiguration<PresentacionDTO, AxiosError, SVCCPresentacionNuevaSWRKey, PresentacionCreateDTO, PresentacionDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/Presentaciones/Nueva

//#region Types SVCC/Presentaciones/Finaliza
export type SVCCPresentacionFinalizaSWRKey = [url: string, token: string];
export type SVCCPresentacionFinalizaOptions = SWRMutationConfiguration<PresentacionDTO, AxiosError, SVCCPresentacionNuevaSWRKey, PresentacionFinalizaDTO, PresentacionDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/Presentaciones/Finaliza

//#region Types SVCC/Presentaciones/Constancia
export type SVCCPresentacionConstanciaParams = {
  id: number;
}
export type SVCCPresentacionConstanciaSWRKey = [url: string, token: string, params: string];
export type SVCCPresentacionConstanciaOptions = SWRConfiguration<File, AxiosError, Fetcher<File, SVCCPresentacionConstanciaSWRKey>>
//#endregion Types SVCC/Presentaciones/Constancia

//#region Types SVCC/EmpresaTercerizada - List
export type SVCCEmpresaTercerizadaListParams = {
  presentacionId: number;
  ciiu?: number;
  cantidadTrabajadores?: number;
  PageIndex?: number;
  PageSize?: number;
  sort?: string;
}
export type SVCCEmpresaTercerizadaListSWRKey = [url: string, token: string, params: string];
export type SVCCEmpresaTercerizadaListOptions = SWRConfiguration<Pagination<EmpresaTercerizadaDTO>, AxiosError, Fetcher<Pagination<EmpresaTercerizadaDTO>, SVCCEmpresaTercerizadaListSWRKey>>
//#endregion Types SVCC/EmpresaTercerizada - List

//#region Types SVCC/EmpresaTercerizada - Create
export type SVCCEmpresaTercerizadaCreateSWRKey = [url: string, token: string];
export type SVCCEmpresaTercerizadaCreateOptions = SWRMutationConfiguration<EmpresaTercerizadaDTO, AxiosError, SVCCEmpresaTercerizadaCreateSWRKey, EmpresaTercerizadaCreateDTO, EmpresaTercerizadaDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/EmpresaTercerizada - Create

//#region Types SVCC/EmpresaTercerizada - Update
export type SVCCEmpresaTercerizadaUpdateParams = {
  id: number;
}
export type SVCCEmpresaTercerizadaUpdateSWRKey = [url: string, token: string, params: string];
export type SVCCEmpresaTercerizadaUpdateOptions = SWRMutationConfiguration<EmpresaTercerizadaDTO, AxiosError, SVCCEmpresaTercerizadaUpdateSWRKey | null, EmpresaTercerizadaBaseDTO, EmpresaTercerizadaDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/EmpresaTercerizada - Update

//#region Types SVCC/EmpresaTercerizada - Delete
export type SVCCEmpresaTercerizadaDeleteParams = {
  id: number;
}
export type SVCCEmpresaTercerizadaDeleteSWRKey = [url: string, token: string, params: string];
export type SVCCEmpresaTercerizadaDeleteOptions = SWRMutationConfiguration<EmpresaTercerizadaDTO, AxiosError, SVCCEmpresaTercerizadaDeleteSWRKey | null, EmpresaTercerizadaDTO, EmpresaTercerizadaDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/EmpresaTercerizada - Delete

//#region Types SVCC/EstablecimientoDeclarado - List
export type SVCCEstablecimientoDeclaradoListParams = {
  presentacionId: number;
  idEstablecimientoEmpresa?: number;
  descripcionActividad?: string;
  cantTrabEventualesProd?: number;
  cantTrabEventualesAdmin?: number;
  cantTrabPropiosProd?: number;
  cantTrabPropiosAdmin?: number;
  mail?: string;
  telefono?: string;
  cuilContacto?: number;
  permitidoFumar?: number;
  lugaresCerradosParaFumar?: number;
  PageIndex?: number;
  PageSize?: number;
  sort?: string;
}
export type SVCCEstablecimientoDeclaradoListSWRKey = [url: string, token: string, params: string];
export type SVCCEstablecimientoDeclaradoListOptions = SWRConfiguration<Pagination<EstablecimientoDeclaradoDTO>, AxiosError, Fetcher<Pagination<EstablecimientoDeclaradoDTO>, SVCCEstablecimientoDeclaradoListSWRKey>>
//#endregion Types SVCC/EstablecimientoDeclarado - List

//#region Types SVCC/EstablecimientoDeclarado - Create
export type SVCCEstablecimientoDeclaradoCreateSWRKey = [url: string, token: string];
export type SVCCEstablecimientoDeclaradoCreateOptions = SWRMutationConfiguration<EstablecimientoDeclaradoDTO, AxiosError, SVCCEstablecimientoDeclaradoCreateSWRKey, EstablecimientoDeclaradoCreateDTO, EstablecimientoDeclaradoDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/EstablecimientoDeclarado - Create

//#region Types SVCC/EstablecimientoDeclarado - Update
export type SVCCEstablecimientoDeclaradoUpdateParams = {
  id: number;
}
export type SVCCEstablecimientoDeclaradoUpdateSWRKey = [url: string, token: string, params: string];
export type SVCCEstablecimientoDeclaradoUpdateOptions = SWRMutationConfiguration<EstablecimientoDeclaradoDTO, AxiosError, SVCCEstablecimientoDeclaradoUpdateSWRKey | null, EstablecimientoDeclaradoBaseDTO, EstablecimientoDeclaradoDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/EstablecimientoDeclarado - Update

//#region Types SVCC/EstablecimientoDeclarado - Delete
export type SVCCEstablecimientoDeclaradoDeleteParams = {
  id: number;
}
export type SVCCEstablecimientoDeclaradoDeleteSWRKey = [url: string, token: string, params: string];
export type SVCCEstablecimientoDeclaradoDeleteOptions = SWRMutationConfiguration<EstablecimientoDeclaradoDTO, AxiosError, SVCCEstablecimientoDeclaradoDeleteSWRKey | null, EstablecimientoDeclaradoDTO, EstablecimientoDeclaradoDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/EstablecimientoDeclarado - Delete

//#region Types SVCC/Sustancia - List
export type SVCCSustanciaListParams = {
  presentacionId: number;
  idEstablecimientoEmpresa?: number;
  idSustancia?: number;
  nombreComercial?: string;
  cantidadAnual?: number;
  idUnidadDeMedida?: number;
  PageIndex?: number;
  PageSize?: number;
  sort?: string;
}
export type SVCCSustanciaListSWRKey = [url: string, token: string, params: string];
export type SVCCSustanciaListOptions = SWRConfiguration<Pagination<SustanciaDTO>, AxiosError, Fetcher<Pagination<SustanciaDTO>, SVCCSustanciaListSWRKey>>
//#endregion Types SVCC/Sustancia - List

//#region Types SVCC/Sustancia - Create
export type SVCCSustanciaCreateSWRKey = [url: string, token: string];
export type SVCCSustanciaCreateOptions = SWRMutationConfiguration<SustanciaDTO, AxiosError, SVCCSustanciaCreateSWRKey, SustanciaCreateDTO, SustanciaDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/Sustancia - Create

//#region Types SVCC/Sustancia - Read
export type SVCCSustanciaReadParams = {
  id: number;
}
export type SVCCSustanciaReadSWRKey = [url: string, token: string, params: string];
export type SVCCSustanciaReadOptions = SWRConfiguration<SustanciaDTO, AxiosError, Fetcher<SustanciaDTO, SVCCSustanciaReadSWRKey>>
//#endregion Types SVCC/Sustancia - Read

//#region Types SVCC/Sustancia - Update
export type SVCCSustanciaUpdateParams = {
  id: number;
}
export type SVCCSustanciaUpdateSWRKey = [url: string, token: string, params: string];
export type SVCCSustanciaUpdateOptions = SWRMutationConfiguration<SustanciaDTO, AxiosError, SVCCSustanciaUpdateSWRKey | null, SustanciaBaseDTO, SustanciaDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/Sustancia - Update

//#region Types SVCC/Sustancia - Delete
export type SVCCSustanciaDeleteParams = {
  id: number;
}
export type SVCCSustanciaDeleteSWRKey = [url: string, token: string, params: string];
export type SVCCSustanciaDeleteOptions = SWRMutationConfiguration<SustanciaDTO, AxiosError, SVCCSustanciaDeleteSWRKey | null, SustanciaDTO, SustanciaDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/Sustancia - Delete

//#region Types SVCC/Trabajador - List
export type SVCCTrabajadorListParams = {
  presentacionId: number;
  PresentacionId?: number;
  cuil?: number;
  idEstablecimientoEmpresa?: number;
  PageIndex?: number;
  PageSize?: number;
  sort?: string;
}
export type SVCCTrabajadorListSWRKey = [url: string, token: string, params: string];
export type SVCCTrabajadorListOptions = SWRConfiguration<Pagination<TrabajadorDTO>, AxiosError, Fetcher<Pagination<TrabajadorDTO>, SVCCTrabajadorListSWRKey>>
//#endregion Types SVCC/Trabajador - List

//#region Types SVCC/Trabajador - Create
export type SVCCTrabajadorCreateSWRKey = [url: string, token: string];
export type SVCCTrabajadorCreateOptions = SWRMutationConfiguration<TrabajadorDTO, AxiosError, SVCCTrabajadorCreateSWRKey, TrabajadorCreateDTO, TrabajadorDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/Trabajador - Create

//#region Types SVCC/Trabajador - Read
export type SVCCTrabajadorReadParams = {
  id: number;
}
export type SVCCTrabajadorReadSWRKey = [url: string, token: string, params: string];
export type SVCCTrabajadorReadOptions = SWRConfiguration<TrabajadorDTO, AxiosError, Fetcher<TrabajadorDTO, SVCCTrabajadorReadSWRKey>>
//#endregion Types SVCC/Trabajador - Read

//#region Types SVCC/Trabajador - Update
export type SVCCTrabajadorUpdateParams = {
  id: number;
}
export type SVCCTrabajadorUpdateSWRKey = [url: string, token: string, params: string];
export type SVCCTrabajadorUpdateOptions = SWRMutationConfiguration<TrabajadorDTO, AxiosError, SVCCTrabajadorUpdateSWRKey | null, TrabajadorBaseDTO, TrabajadorDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/Trabajador - Update

//#region Types SVCC/Trabajador - Delete
export type SVCCTrabajadorDeleteParams = {
  id: number;
}
export type SVCCTrabajadorDeleteSWRKey = [url: string, token: string, params: string];
export type SVCCTrabajadorDeleteOptions = SWRMutationConfiguration<TrabajadorDTO, AxiosError, SVCCTrabajadorDeleteSWRKey | null, TrabajadorDTO, TrabajadorDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/Trabajador - Delete
//#endregion Types SVCC
function svccPresentacionTodasPostBody(
  params?: SVCCPresentacionTodasParams
): SVCCPresentacionTodasPostBody {
  let empleadorCuit: number[] = [];

  if (params?.empleadorCuit != null) {
    empleadorCuit = params.empleadorCuit;
  } else if (params?.empleadorCUIT != null) {
    empleadorCuit = [params.empleadorCUIT];
  }

  return {
    empleadorCuit,
    order: params?.Order ?? "-interno",
    pageIndex: params?.PageIndex ?? 1,
    pageSize: params?.PageSize ?? 10,
  };
}

function stringValue(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value != null && value !== "" && String(value) !== "null") return String(value);
  }
  return "";
}

function numberValue(row: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = row[key];
    if (value == null || value === "") continue;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
}

function optionalNumberValue(row: Record<string, unknown>, ...keys: string[]): number | undefined {
  const numeric = numberValue(row, ...keys);
  return numeric > 0 ? numeric : undefined;
}

function svccTrabajadorListSearch(params?: SVCCTrabajadorListParams): URLSearchParams | undefined {
  if (params == null) return undefined;
  const { presentacionId, PresentacionId, ...rest } = params;
  return toURLSearch({
    ...rest,
    PresentacionId: PresentacionId ?? presentacionId,
  });
}

/** Fila devuelta por `/api/Presentaciones/Ultima` (y equivalentes con campos extra). */
function mapSvccPresentacionApiRecordToDTO(row: Record<string, unknown>): PresentacionDTO {
  const presentacionFecha = stringValue(row, "presentacionFecha", "PresentacionFecha");
  const observaciones = stringValue(row, "observaciones", "Observaciones");
  return {
    interno: numberValue(row, "interno", "Interno", "id", "Id"),
    idMotivo: optionalNumberValue(row, "idMotivo", "IdMotivo"),
    observaciones: observaciones || undefined,
    presentacionFecha: presentacionFecha || undefined,
    empleadorCuit: optionalNumberValue(row, "empleadorCuit", "empleadorCUIT", "EmpleadorCuit", "EmpleadorCUIT"),
    empleadorRazonSocial: stringValue(row, "empleadorRazonSocial", "EmpleadorRazonSocial") || undefined,
  };
}

function mapSvccPresentacionUltimaApiRecordToDTO(raw: unknown): PresentacionUltimaDTO | null {
  if (raw == null || typeof raw !== "object") return null;

  const row = raw as Record<string, unknown>;
  const interno = numberValue(row, "interno", "Interno", "id", "Id");
  if (interno <= 0) return null;

  return {
    interno,
    empleadorCuit: numberValue(row, "empleadorCuit", "empleadorCUIT", "EmpleadorCuit", "EmpleadorCUIT"),
    empleadorRazonSocial: stringValue(row, "empleadorRazonSocial", "EmpleadorRazonSocial"),
    idPresentacion: numberValue(row, "idPresentacion", "IdPresentacion"),
    numeroDePoliza: numberValue(row, "numeroDePoliza", "NumeroDePoliza"),
    idMotivo: numberValue(row, "idMotivo", "IdMotivo"),
    idProgramaMuestra: numberValue(row, "idProgramaMuestra", "IdProgramaMuestra"),
    version: numberValue(row, "version", "Version"),
    presentacionFecha: stringValue(row, "presentacionFecha", "PresentacionFecha"),
    consolidacionFecha: stringValue(row, "consolidacionFecha", "ConsolidacionFecha"),
    observaciones: stringValue(row, "observaciones", "Observaciones"),
    fechaInsert: stringValue(row, "fechaInsert", "FechaInsert"),
    constanciaGUID: stringValue(row, "constanciaGUID", "constanciaGuid", "ConstanciaGUID", "ConstanciaGuid"),
    constanciaArchivo: stringValue(row, "constanciaArchivo", "ConstanciaArchivo"),
  };
}

/** Extrae filas de un array raíz o de `data` en respuesta paginada. */
function mapSvccPresentacionRowsFromRaw(raw: unknown): PresentacionDTO[] {
  if (raw == null) return [];
  const rows =
    Array.isArray(raw)
      ? raw
      : typeof raw === "object" && raw !== null && "data" in raw && Array.isArray((raw as { data?: unknown }).data)
        ? (raw as { data: unknown[] }).data
        : [];
  return rows
    .map((item) => mapSvccPresentacionApiRecordToDTO(item as Record<string, unknown>))
    .filter((p) => p.interno > 0);
}



function normalizeSvccPresentacionTodasResponse(raw: unknown): Pagination<PresentacionDTO> {
  const vacío = (): Pagination<PresentacionDTO> => ({
    index: 1,
    size: 0,
    pages: 0,
    count: 0,
    data: [],
  });
  if (raw == null) return vacío();
  if (Array.isArray(raw)) {
    const data = mapSvccPresentacionRowsFromRaw(raw);
    const n = data.length;
    return { index: 1, size: n, pages: n > 0 ? 1 : 0, count: n, data };
  }
  if (typeof raw === 'object' && raw !== null && 'data' in raw) {
    const p = raw as Pagination<Record<string, unknown>>;
    const rows = Array.isArray(p.data) ? p.data : [];
    const data = rows
      .map((r) => mapSvccPresentacionApiRecordToDTO(r as Record<string, unknown>))
      .filter((x) => x.interno > 0);
    return {
      index: typeof p.index === 'number' ? p.index : 1,
      size: typeof p.size === 'number' ? p.size : data.length,
      pages: typeof p.pages === 'number' ? p.pages : data.length > 0 ? 1 : 0,
      count: typeof p.count === 'number' ? p.count : data.length,
      data,
    };
  }
  return vacío();
}



export class SvccAPIClass extends ExternalAPI {
  readonly basePath = process.env.NEXT_PUBLIC_API_SVCC || "http://fallback-prod.url";

  //#region SVCC
  //#region SVCC/Presentaciones
  //#region SVCC/Presentaciones/Todas
  readonly svccPresentacionTodasURL = () =>
    this.getURL({ path: "/api/Presentaciones" }).toString();
  svccPresentacionTodas = async (params?: SVCCPresentacionTodasParams) =>
    tokenizable
      .post<unknown>(
        this.svccPresentacionTodasURL(),
        svccPresentacionTodasPostBody(params)
      )
      .then(({ data }) => normalizeSvccPresentacionTodasResponse(data));
  swrSVCCPresentacionTodas: {
    key: (params?: SVCCPresentacionTodasParams) => SVCCPresentacionTodasSWRKey,
    fetcher: (key: SVCCPresentacionTodasSWRKey) => Promise<Pagination<PresentacionDTO>>
  } = Object.freeze({
    key: (params) => [
      this.svccPresentacionTodasURL(),
      token.getToken(),
      JSON.stringify(params),
    ],
    fetcher: ([_url, _token, params]) => this.svccPresentacionTodas(JSON.parse(params)),
  });
  useSVCCPresentacionTodas = (params?: SVCCPresentacionTodasParams, options?: SVCCPresentacionTodasOptions) =>
    useSWR<Pagination<PresentacionDTO>, AxiosError>(params ? this.swrSVCCPresentacionTodas.key(params) : null, this.swrSVCCPresentacionTodas.fetcher, options);
  //#endregion SVCC/Presentaciones/Todas

  //#region SVCC/Presentaciones/Obtener
  readonly svccPresentacionObtenerURL = ({ id }: SVCCPresentacionObtenerParams) => this.getURL({ path: `/api/Presentaciones/${id}` }).toString();
  svccPresentacionObtener = async (params: SVCCPresentacionObtenerParams) => tokenizable.get<PresentacionDTO>(
    this.svccPresentacionObtenerURL(params)
  ).then(({ data }) => mapSvccPresentacionApiRecordToDTO(data as Record<string, unknown>));
  swrSVCCPresentacionObtener: {
    key: (params: SVCCPresentacionObtenerParams) => SVCCPresentacionObtenerSWRKey,
    fetcher: (key: SVCCPresentacionObtenerSWRKey) => Promise<PresentacionDTO>
  } = Object.freeze({
    key: (params) => [this.svccPresentacionObtenerURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccPresentacionObtener(JSON.parse(params)),
  });
  useSVCCPresentacionObtener = (params?: SVCCPresentacionObtenerParams, options?: SVCCPresentacionObtenerOptions) =>
    useSWR<PresentacionDTO, AxiosError>(params ? this.swrSVCCPresentacionObtener.key(params) : null, this.swrSVCCPresentacionObtener.fetcher, options);
  //#endregion SVCC/Presentaciones/Obtener

  //#region SVCC/Presentaciones/Ultima
  readonly svccPresentacionUltimaURL = (empleadorCuit: number) =>
    this.getURL({ path: `/api/Presentaciones/Ultima/${encodeURIComponent(String(empleadorCuit))}` }).toString();
  svccPresentacionUltima = async (params: SVCCPresentacionUltimaParams) => {
    const cuit = Number(params.empleadorCuit);
    if (!Number.isFinite(cuit) || cuit <= 0) return null;
    try {
      const { data } = await tokenizable.get<unknown>(this.svccPresentacionUltimaURL(cuit));
      return mapSvccPresentacionUltimaApiRecordToDTO(data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  };
  swrSVCCPresentacionUltima: {
    key: (params: SVCCPresentacionUltimaParams) => SVCCPresentacionUltimaSWRKey,
    fetcher: (key: SVCCPresentacionUltimaSWRKey) => Promise<PresentacionUltimaDTO | null>
  } = Object.freeze({
    key: (params) => [this.svccPresentacionUltimaURL(params.empleadorCuit), token.getToken(), String(params.empleadorCuit)],
    fetcher: ([_url, _token, empleadorCuit]) =>
      this.svccPresentacionUltima({ empleadorCuit: Number(empleadorCuit) }),
  });
  useSVCCPresentacionUltima = (params?: SVCCPresentacionUltimaParams, options?: SVCCPresentacionUltimaOptions) =>
    useSWR<PresentacionUltimaDTO | null, AxiosError>(params ? this.swrSVCCPresentacionUltima.key(params) : null, this.swrSVCCPresentacionUltima.fetcher, options);
  //#endregion SVCC/Presentaciones/Ultima

  //#region SVCC/Presentaciones/Nueva
  readonly svccPresentacionNuevaURL = this.getURL({ path: "/api/Presentaciones/Nueva" }).toString();
  svccPresentacionNueva = async (presentacion: PresentacionCreateDTO) => tokenizable.post<PresentacionDTO>(
    this.svccPresentacionNuevaURL, presentacion
  ).then(({ data }) => mapSvccPresentacionApiRecordToDTO(data as Record<string, unknown>));
  swrSVCCPresentacionNueva: {
    key: SVCCPresentacionNuevaSWRKey,
    fetcher: (key: SVCCPresentacionNuevaSWRKey, options: { arg: PresentacionCreateDTO }) => Promise<PresentacionDTO>,
  } = Object.freeze({
    key: [this.svccPresentacionNuevaURL, token.getToken()],
    fetcher: (_key, { arg }) => this.svccPresentacionNueva(arg),
  });
  useSVCCPresentacionNueva = (options?: SVCCPresentacionNuevaOptions) =>
    useSWRMutation(this.swrSVCCPresentacionNueva.key, this.swrSVCCPresentacionNueva.fetcher, options);
  //#endregion SVCC/Presentaciones/Nueva

  //#region SVCC/Presentaciones/Finaliza
  readonly svccPresentacionFinalizaURL = this.getURL({ path: "/api/Presentaciones/Finaliza" }).toString();
  svccPresentacionFinaliza = async (presentacion: PresentacionFinalizaDTO) => tokenizable.put<PresentacionDTO>(
    this.svccPresentacionFinalizaURL, presentacion
  ).then(({ data }) => mapSvccPresentacionApiRecordToDTO(data as Record<string, unknown>));
  swrSVCCPresentacionFinaliza: {
    key: SVCCPresentacionFinalizaSWRKey,
    fetcher: (key: SVCCPresentacionFinalizaSWRKey, options: { arg: PresentacionFinalizaDTO }) => Promise<PresentacionDTO>,
  } = Object.freeze({
    key: [this.svccPresentacionFinalizaURL, token.getToken()],
    fetcher: (_key, { arg }) => this.svccPresentacionFinaliza(arg),
  });
  useSVCCPresentacionFinaliza = (options?: SVCCPresentacionFinalizaOptions) =>
    useSWRMutation(this.swrSVCCPresentacionFinaliza.key, this.swrSVCCPresentacionFinaliza.fetcher, options);
  //#endregion SVCC/Presentaciones/Finaliza

  //#region SVCC/Presentaciones/Constancia
  readonly svccPresentacionConstanciaURL = ({ id }: SVCCPresentacionConstanciaParams) => this.getURL({ path: `/api/Presentaciones/${id}/Constancia` }).toString();
  svccPresentacionConstancia = async (params: SVCCPresentacionConstanciaParams) => tokenizable.get<Blob>(
    this.svccPresentacionConstanciaURL(params),
    { responseType: "blob" }
  ).then(({ data, headers }) => {
    const filename = filenameFromContentDispositionHeaders(headers as Record<string, unknown>);
    return new File([data], filename, { type: data.type });
  });
  swrSVCCPresentacionConstancia: {
    key: (params: SVCCPresentacionConstanciaParams) => SVCCPresentacionConstanciaSWRKey,
    fetcher: (key: SVCCPresentacionConstanciaSWRKey) => Promise<File>
  } = Object.freeze({
    key: (params) => [this.svccPresentacionConstanciaURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccPresentacionConstancia(JSON.parse(params)),
  });
  useSVCCPresentacionConstancia = (params?: SVCCPresentacionConstanciaParams, options?: SVCCPresentacionConstanciaOptions) =>
    useSWR<File, AxiosError>(params ? this.swrSVCCPresentacionConstancia.key(params) : null, this.swrSVCCPresentacionConstancia.fetcher, options);
  //#endregion SVCC/Presentaciones/Constancia
  //#endregion SVCC/Presentaciones

  //#region SVCC/EmpresaTercerizada
  //#region SVCC/EmpresaTercerizada - List
  readonly svccEmpresaTercerizadaListURL = (params?: SVCCEmpresaTercerizadaListParams) =>
    this.getURL({ path: "/api/EmpresasTercerizadas", search: toURLSearch(params) }).toString();
  svccEmpresaTercerizadaList = async (params?: SVCCEmpresaTercerizadaListParams) => tokenizable.get<Pagination<EmpresaTercerizadaDTO>>(
    this.svccEmpresaTercerizadaListURL(params)
  ).then(({ data }) => data);
  swrSVCCEmpresaTercerizadaList: {
    key: (params?: SVCCEmpresaTercerizadaListParams) => SVCCEmpresaTercerizadaListSWRKey,
    fetcher: (key: SVCCEmpresaTercerizadaListSWRKey) => Promise<Pagination<EmpresaTercerizadaDTO>>
  } = Object.freeze({
    key: (params) => [this.svccEmpresaTercerizadaListURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccEmpresaTercerizadaList(JSON.parse(params)),
  });
  useSVCCEmpresaTercerizadaList = (params?: SVCCEmpresaTercerizadaListParams, options?: SVCCEmpresaTercerizadaListOptions) =>
    useSWR<Pagination<EmpresaTercerizadaDTO>, AxiosError>(params ? this.swrSVCCEmpresaTercerizadaList.key(params) : null, this.swrSVCCEmpresaTercerizadaList.fetcher, options);
  //#endregion SVCC/EmpresaTercerizada - List

  //#region SVCC/EmpresaTercerizada - Create
  readonly svccEmpresaTercerizadaCreateURL = this.getURL({ path: "/api/EmpresasTercerizadas" }).toString();
  svccEmpresaTercerizadaCreate = async (data?: EmpresaTercerizadaCreateDTO) => tokenizable.post<EmpresaTercerizadaDTO>(
    this.svccEmpresaTercerizadaCreateURL, data
  ).then(({ data }) => data);
  swrSVCCEmpresaTercerizadaCreate: {
    key: SVCCEmpresaTercerizadaCreateSWRKey,
    fetcher: (key: SVCCEmpresaTercerizadaCreateSWRKey, options: { arg: EmpresaTercerizadaCreateDTO }) => Promise<EmpresaTercerizadaDTO>
  } = Object.freeze({
    key: [this.svccEmpresaTercerizadaCreateURL, token.getToken()],
    fetcher: (_key, { arg }) => this.svccEmpresaTercerizadaCreate(arg),
  });
  useSVCCEmpresaTercerizadaCreate = (options?: SVCCEmpresaTercerizadaCreateOptions) =>
    useSWRMutation(this.swrSVCCEmpresaTercerizadaCreate.key, this.swrSVCCEmpresaTercerizadaCreate.fetcher, options);
  //#endregion SVCC/EmpresaTercerizada - Create

  //#region SVCC/EmpresaTercerizada - Update
  readonly svccEmpresaTercerizadaUpdateURL = ({ id }: SVCCEmpresaTercerizadaUpdateParams) => this.getURL({ path: `/api/EmpresasTercerizadas/${id}` }).toString();
  svccEmpresaTercerizadaUpdate = async (params: SVCCEmpresaTercerizadaUpdateParams, data?: EmpresaTercerizadaBaseDTO) => tokenizable.put<EmpresaTercerizadaDTO>(
    this.svccEmpresaTercerizadaUpdateURL(params), data
  ).then(({ data }) => data);
  swrSVCCEmpresaTercerizadaUpdate: {
    key: (params: SVCCEmpresaTercerizadaUpdateParams) => SVCCEmpresaTercerizadaUpdateSWRKey,
    fetcher: (key: SVCCEmpresaTercerizadaUpdateSWRKey, options: { arg: EmpresaTercerizadaBaseDTO }) => Promise<EmpresaTercerizadaDTO>
  } = Object.freeze({
    key: (params) => [this.svccEmpresaTercerizadaUpdateURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params], { arg }) => this.svccEmpresaTercerizadaUpdate(JSON.parse(params), arg),
  });
  useSVCCEmpresaTercerizadaUpdate = (params?: SVCCEmpresaTercerizadaUpdateParams, options?: SVCCEmpresaTercerizadaUpdateOptions) =>
    useSWRMutation(params ? this.swrSVCCEmpresaTercerizadaUpdate.key(params) : null, this.swrSVCCEmpresaTercerizadaUpdate.fetcher, options);
  //#endregion SVCC/EmpresaTercerizada - Update

  //#region SVCC/EmpresaTercerizada - Delete
  readonly svccEmpresaTercerizadaDeleteURL = ({ id }: SVCCEmpresaTercerizadaDeleteParams) => this.getURL({ path: `/api/EmpresasTercerizadas/${id}` }).toString();
  svccEmpresaTercerizadaDelete = async (params: SVCCEmpresaTercerizadaDeleteParams) => tokenizable.delete<EmpresaTercerizadaDTO>(
    this.svccEmpresaTercerizadaDeleteURL(params)
  ).then(({ data }) => data);
  swrSVCCEmpresaTercerizadaDelete: {
    key: (params: SVCCEmpresaTercerizadaDeleteParams) => SVCCEmpresaTercerizadaDeleteSWRKey,
    fetcher: (key: SVCCEmpresaTercerizadaDeleteSWRKey) => Promise<EmpresaTercerizadaDTO>
  } = Object.freeze({
    key: (params) => [this.svccEmpresaTercerizadaDeleteURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccEmpresaTercerizadaDelete(JSON.parse(params)),
  });
  useSVCCEmpresaTercerizadaDelete = (params?: SVCCEmpresaTercerizadaDeleteParams, options?: SVCCEmpresaTercerizadaDeleteOptions) =>
    useSWRMutation(params ? this.swrSVCCEmpresaTercerizadaDelete.key(params) : null, this.swrSVCCEmpresaTercerizadaDelete.fetcher, options);
  //#endregion SVCC/EmpresaTercerizada - Delete
  //#endregion SVCC/EmpresaTercerizada

  //#region SVCC/EstablecimientoDeclarado
  //#region SVCC/EstablecimientoDeclarado - List
  readonly svccEstablecimientoDeclaradoListURL = (params?: SVCCEstablecimientoDeclaradoListParams) =>
    this.getURL({ path: "/api/EstablecimientosDeclarados", search: toURLSearch(params) }).toString();
  svccEstablecimientoDeclaradoList = async (params?: SVCCEstablecimientoDeclaradoListParams) => tokenizable.get<Pagination<EstablecimientoDeclaradoDTO>>(
    this.svccEstablecimientoDeclaradoListURL(params)
  ).then(({ data }) => data);
  swrSVCCEstablecimientoDeclaradoList: {
    key: (params?: SVCCEstablecimientoDeclaradoListParams) => SVCCEstablecimientoDeclaradoListSWRKey,
    fetcher: (key: SVCCEstablecimientoDeclaradoListSWRKey) => Promise<Pagination<EstablecimientoDeclaradoDTO>>
  } = Object.freeze({
    key: (params) => [this.svccEstablecimientoDeclaradoListURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccEstablecimientoDeclaradoList(JSON.parse(params)),
  });
  useSVCCEstablecimientoDeclaradoList = (params?: SVCCEstablecimientoDeclaradoListParams, options?: SVCCEstablecimientoDeclaradoListOptions) =>
    useSWR<Pagination<EstablecimientoDeclaradoDTO>, AxiosError>(params ? this.swrSVCCEstablecimientoDeclaradoList.key(params) : null, this.swrSVCCEstablecimientoDeclaradoList.fetcher, options);
  //#endregion SVCC/EstablecimientoDeclarado - List

  //#region SVCC/EstablecimientoDeclarado - Create
  readonly svccEstablecimientoDeclaradoCreateURL = this.getURL({ path: "/api/EstablecimientosDeclarados" }).toString();
  svccEstablecimientoDeclaradoCreate = async (data?: EstablecimientoDeclaradoCreateDTO) => tokenizable.post<EstablecimientoDeclaradoDTO>(
    this.svccEstablecimientoDeclaradoCreateURL, data
  ).then(({ data }) => data);
  swrSVCCEstablecimientoDeclaradoCreate: {
    key: SVCCEstablecimientoDeclaradoCreateSWRKey,
    fetcher: (key: SVCCEstablecimientoDeclaradoCreateSWRKey, options: { arg: EstablecimientoDeclaradoCreateDTO }) => Promise<EstablecimientoDeclaradoDTO>
  } = Object.freeze({
    key: [this.svccEstablecimientoDeclaradoCreateURL, token.getToken()],
    fetcher: (_key, { arg }) => this.svccEstablecimientoDeclaradoCreate(arg),
  });
  useSVCCEstablecimientoDeclaradoCreate = (options?: SVCCEstablecimientoDeclaradoCreateOptions) =>
    useSWRMutation(this.swrSVCCEstablecimientoDeclaradoCreate.key, this.swrSVCCEstablecimientoDeclaradoCreate.fetcher, options);
  //#endregion SVCC/EstablecimientoDeclarado - Create

  //#region SVCC/EstablecimientoDeclarado - Update
  readonly svccEstablecimientoDeclaradoUpdateURL = ({ id }: SVCCEstablecimientoDeclaradoUpdateParams) => this.getURL({ path: `/api/EstablecimientosDeclarados/${id}` }).toString();
  svccEstablecimientoDeclaradoUpdate = async (params: SVCCEstablecimientoDeclaradoUpdateParams, data?: EstablecimientoDeclaradoBaseDTO) => tokenizable.put<EstablecimientoDeclaradoDTO>(
    this.svccEstablecimientoDeclaradoUpdateURL(params), data
  ).then(({ data }) => data);
  swrSVCCEstablecimientoDeclaradoUpdate: {
    key: (params: SVCCEstablecimientoDeclaradoUpdateParams) => SVCCEstablecimientoDeclaradoUpdateSWRKey,
    fetcher: (key: SVCCEstablecimientoDeclaradoUpdateSWRKey, options: { arg: EstablecimientoDeclaradoBaseDTO }) => Promise<EstablecimientoDeclaradoDTO>
  } = Object.freeze({
    key: (params) => [this.svccEstablecimientoDeclaradoUpdateURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params], { arg }) => this.svccEstablecimientoDeclaradoUpdate(JSON.parse(params), arg),
  });
  useSVCCEstablecimientoDeclaradoUpdate = (params?: SVCCEstablecimientoDeclaradoUpdateParams, options?: SVCCEstablecimientoDeclaradoUpdateOptions) =>
    useSWRMutation(params ? this.swrSVCCEstablecimientoDeclaradoUpdate.key(params) : null, this.swrSVCCEstablecimientoDeclaradoUpdate.fetcher, options);
  //#endregion SVCC/EstablecimientoDeclarado - Update

  //#region SVCC/EstablecimientoDeclarado - Delete
  readonly svccEstablecimientoDeclaradoDeleteURL = ({ id }: SVCCEstablecimientoDeclaradoDeleteParams) => this.getURL({ path: `/api/EstablecimientosDeclarados/${id}` }).toString();
  svccEstablecimientoDeclaradoDelete = async (params: SVCCEstablecimientoDeclaradoDeleteParams) => tokenizable.delete<EstablecimientoDeclaradoDTO>(
    this.svccEstablecimientoDeclaradoDeleteURL(params)
  ).then(({ data }) => data);
  swrSVCCEstablecimientoDeclaradoDelete: {
    key: (params: SVCCEstablecimientoDeclaradoDeleteParams) => SVCCEstablecimientoDeclaradoDeleteSWRKey,
    fetcher: (key: SVCCEstablecimientoDeclaradoDeleteSWRKey) => Promise<EstablecimientoDeclaradoDTO>
  } = Object.freeze({
    key: (params) => [this.svccEstablecimientoDeclaradoDeleteURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccEstablecimientoDeclaradoDelete(JSON.parse(params)),
  });
  useSVCCEstablecimientoDeclaradoDelete = (params?: SVCCEstablecimientoDeclaradoDeleteParams, options?: SVCCEstablecimientoDeclaradoDeleteOptions) =>
    useSWRMutation(params ? this.swrSVCCEstablecimientoDeclaradoDelete.key(params) : null, this.swrSVCCEstablecimientoDeclaradoDelete.fetcher, options);
  //#endregion SVCC/EstablecimientoDeclarado - Delete
  //#endregion SVCC/EstablecimientoDeclarado

  //#region SVCC/Sustancia
  //#region SVCC/Sustancia - List
  readonly svccSustanciaListURL = (params?: SVCCSustanciaListParams) =>
    this.getURL({ path: "/api/Sustancias", search: toURLSearch(params) }).toString();
  svccSustanciaList = async (params?: SVCCSustanciaListParams) => tokenizable.get<Pagination<SustanciaDTO>>(
    this.svccSustanciaListURL(params)
  ).then(({ data }) => data);
  swrSVCCSustanciaList: {
    key: (params?: SVCCSustanciaListParams) => SVCCSustanciaListSWRKey,
    fetcher: (key: SVCCSustanciaListSWRKey) => Promise<Pagination<SustanciaDTO>>
  } = Object.freeze({
    key: (params) => [this.svccSustanciaListURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccSustanciaList(JSON.parse(params)),
  });
  useSVCCSustanciaList = (params?: SVCCSustanciaListParams, options?: SVCCSustanciaListOptions) =>
    useSWR<Pagination<SustanciaDTO>, AxiosError>(params ? this.swrSVCCSustanciaList.key(params) : null, this.swrSVCCSustanciaList.fetcher, options);
  //#endregion SVCC/Sustancia - List

  //#region SVCC/Sustancia - Create
  readonly svccSustanciaCreateURL = this.getURL({ path: "/api/Sustancias" }).toString();
  svccSustanciaCreate = async (data?: SustanciaCreateDTO) => tokenizable.post<SustanciaDTO>(
    this.svccSustanciaCreateURL, data
  ).then(({ data }) => data);
  swrSVCCSustanciaCreate: {
    key: SVCCSustanciaCreateSWRKey,
    fetcher: (key: SVCCSustanciaCreateSWRKey, options: { arg: SustanciaCreateDTO }) => Promise<SustanciaDTO>
  } = Object.freeze({
    key: [this.svccSustanciaCreateURL, token.getToken()],
    fetcher: (_key, { arg }) => this.svccSustanciaCreate(arg),
  });
  useSVCCSustanciaCreate = (options?: SVCCSustanciaCreateOptions) =>
    useSWRMutation(this.swrSVCCSustanciaCreate.key, this.swrSVCCSustanciaCreate.fetcher, options);
  //#endregion SVCC/Sustancia - Create

  //#region SVCC/Sustancia - Read
  readonly svccSustanciaReadURL = ({ id }: SVCCSustanciaReadParams) => this.getURL({ path: `/api/Sustancias/${id}` }).toString();
  svccSustanciaRead = async (params: SVCCSustanciaReadParams) => tokenizable.get<SustanciaDTO>(
    this.svccSustanciaReadURL(params)
  ).then(({ data }) => data);
  swrSVCCSustanciaRead: {
    key: (params: SVCCSustanciaReadParams) => SVCCSustanciaReadSWRKey,
    fetcher: (key: SVCCSustanciaReadSWRKey) => Promise<SustanciaDTO>
  } = Object.freeze({
    key: (params) => [this.svccSustanciaReadURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccSustanciaRead(JSON.parse(params)),
  });
  useSVCCSustanciaRead = (params?: SVCCSustanciaReadParams, options?: SVCCSustanciaReadOptions) =>
    useSWR<SustanciaDTO, AxiosError>(params ? this.swrSVCCSustanciaRead.key(params) : null, this.swrSVCCSustanciaRead.fetcher, options);
  //#endregion SVCC/Sustancia - Read

  //#region SVCC/Sustancia - Update
  readonly svccSustanciaUpdateURL = ({ id }: SVCCSustanciaUpdateParams) => this.getURL({ path: `/api/Sustancias/${id}` }).toString();
  svccSustanciaUpdate = async (params: SVCCSustanciaUpdateParams, data?: SustanciaBaseDTO) => tokenizable.put<SustanciaDTO>(
    this.svccSustanciaUpdateURL(params), data
  ).then(({ data }) => data);
  swrSVCCSustanciaUpdate: {
    key: (params: SVCCSustanciaUpdateParams) => SVCCSustanciaUpdateSWRKey,
    fetcher: (key: SVCCSustanciaUpdateSWRKey, options: { arg: SustanciaBaseDTO }) => Promise<SustanciaDTO>
  } = Object.freeze({
    key: (params) => [this.svccSustanciaUpdateURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params], { arg }) => this.svccSustanciaUpdate(JSON.parse(params), arg),
  });
  useSVCCSustanciaUpdate = (params?: SVCCSustanciaUpdateParams, options?: SVCCSustanciaUpdateOptions) =>
    useSWRMutation(params ? this.swrSVCCSustanciaUpdate.key(params) : null, this.swrSVCCSustanciaUpdate.fetcher, options);
  //#endregion SVCC/Sustancia - Update

  //#region SVCC/Sustancia - Delete
  readonly svccSustanciaDeleteURL = ({ id }: SVCCSustanciaDeleteParams) => this.getURL({ path: `/api/Sustancias/${id}` }).toString();
  svccSustanciaDelete = async (params: SVCCSustanciaDeleteParams) => tokenizable.delete<SustanciaDTO>(
    this.svccSustanciaDeleteURL(params)
  ).then(({ data }) => data);
  swrSVCCSustanciaDelete: {
    key: (params: SVCCSustanciaDeleteParams) => SVCCSustanciaDeleteSWRKey,
    fetcher: (key: SVCCSustanciaDeleteSWRKey) => Promise<SustanciaDTO>
  } = Object.freeze({
    key: (params) => [this.svccSustanciaDeleteURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccSustanciaDelete(JSON.parse(params)),
  });
  useSVCCSustanciaDelete = (params?: SVCCSustanciaDeleteParams, options?: SVCCSustanciaDeleteOptions) =>
    useSWRMutation(params ? this.swrSVCCSustanciaDelete.key(params) : null, this.swrSVCCSustanciaDelete.fetcher, options);
  //#endregion SVCC/Sustancia - Delete
  //#endregion SVCC/Sustancia

  //#region SVCC/Trabajador
  //#region SVCC/Trabajador - List
  readonly svccTrabajadorListURL = (params?: SVCCTrabajadorListParams) =>
    this.getURL({ path: "/api/Trabajadores", search: svccTrabajadorListSearch(params) }).toString();
  svccTrabajadorList = async (params?: SVCCTrabajadorListParams) => tokenizable.get<Pagination<TrabajadorDTO>>(
    this.svccTrabajadorListURL(params)
  ).then(({ data }) => data);
  swrSVCCTrabajadorList: {
    key: (params?: SVCCTrabajadorListParams) => SVCCTrabajadorListSWRKey,
    fetcher: (key: SVCCTrabajadorListSWRKey) => Promise<Pagination<TrabajadorDTO>>
  } = Object.freeze({
    key: (params) => [this.svccTrabajadorListURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccTrabajadorList(JSON.parse(params)),
  });
  useSVCCTrabajadorList = (params?: SVCCTrabajadorListParams, options?: SVCCTrabajadorListOptions) =>
    useSWR<Pagination<TrabajadorDTO>, AxiosError>(params ? this.swrSVCCTrabajadorList.key(params) : null, this.swrSVCCTrabajadorList.fetcher, options);
  //#endregion SVCC/Trabajador - List

  //#region SVCC/Trabajador - Create
  readonly svccTrabajadorCreateURL = this.getURL({ path: "/api/Trabajadores" }).toString();
  svccTrabajadorCreate = async (data?: TrabajadorCreateDTO) => tokenizable.post<TrabajadorDTO>(
    this.svccTrabajadorCreateURL, data
  ).then(({ data }) => data);
  swrSVCCTrabajadorCreate: {
    key: SVCCTrabajadorCreateSWRKey,
    fetcher: (key: SVCCTrabajadorCreateSWRKey, options: { arg: TrabajadorCreateDTO }) => Promise<TrabajadorDTO>
  } = Object.freeze({
    key: [this.svccTrabajadorCreateURL, token.getToken()],
    fetcher: (_key, { arg }) => this.svccTrabajadorCreate(arg),
  });
  useSVCCTrabajadorCreate = (options?: SVCCTrabajadorCreateOptions) =>
    useSWRMutation(this.swrSVCCTrabajadorCreate.key, this.swrSVCCTrabajadorCreate.fetcher, options);
  //#endregion SVCC/Trabajador - Create

  //#region SVCC/Trabajador - Read
  readonly svccTrabajadorReadURL = ({ id }: SVCCTrabajadorReadParams) => this.getURL({ path: `/api/Trabajadores/${id}` }).toString();
  svccTrabajadorRead = async (params: SVCCTrabajadorReadParams) => tokenizable.get<TrabajadorDTO>(
    this.svccTrabajadorReadURL(params)
  ).then(({ data }) => data);
  swrSVCCTrabajadorRead: {
    key: (params: SVCCTrabajadorReadParams) => SVCCTrabajadorReadSWRKey,
    fetcher: (key: SVCCTrabajadorReadSWRKey) => Promise<TrabajadorDTO>
  } = Object.freeze({
    key: (params) => [this.svccTrabajadorReadURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccTrabajadorRead(JSON.parse(params)),
  });
  useSVCCTrabajadorRead = (params?: SVCCTrabajadorReadParams, options?: SVCCTrabajadorReadOptions) =>
    useSWR<TrabajadorDTO, AxiosError>(params ? this.swrSVCCTrabajadorRead.key(params) : null, this.swrSVCCTrabajadorRead.fetcher, options);
  //#endregion SVCC/Trabajador - Read

  //#region SVCC/Trabajador - Update
  readonly svccTrabajadorUpdateURL = ({ id }: SVCCTrabajadorUpdateParams) => this.getURL({ path: `/api/Trabajadores/${id}` }).toString();
  svccTrabajadorUpdate = async (params: SVCCTrabajadorUpdateParams, data?: TrabajadorBaseDTO) => tokenizable.put<TrabajadorDTO>(
    this.svccTrabajadorUpdateURL(params), data
  ).then(({ data }) => data);
  swrSVCCTrabajadorUpdate: {
    key: (params: SVCCTrabajadorUpdateParams) => SVCCTrabajadorUpdateSWRKey,
    fetcher: (key: SVCCTrabajadorUpdateSWRKey, options: { arg: TrabajadorBaseDTO }) => Promise<TrabajadorDTO>
  } = Object.freeze({
    key: (params) => [this.svccTrabajadorUpdateURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params], { arg }) => this.svccTrabajadorUpdate(JSON.parse(params), arg),
  });
  useSVCCTrabajadorUpdate = (params?: SVCCTrabajadorUpdateParams, options?: SVCCTrabajadorUpdateOptions) =>
    useSWRMutation(params ? this.swrSVCCTrabajadorUpdate.key(params) : null, this.swrSVCCTrabajadorUpdate.fetcher, options);
  //#endregion SVCC/Trabajador - Update

  //#region SVCC/Trabajador - Delete
  readonly svccTrabajadorDeleteURL = ({ id }: SVCCTrabajadorDeleteParams) => this.getURL({ path: `/api/Trabajadores/${id}` }).toString();
  svccTrabajadorDelete = async (params: SVCCTrabajadorDeleteParams) => tokenizable.delete<TrabajadorDTO>(
    this.svccTrabajadorDeleteURL(params)
  ).then(({ data }) => data);
  swrSVCCTrabajadorDelete: {
    key: (params: SVCCTrabajadorDeleteParams) => SVCCTrabajadorDeleteSWRKey,
    fetcher: (key: SVCCTrabajadorDeleteSWRKey) => Promise<TrabajadorDTO>
  } = Object.freeze({
    key: (params) => [this.svccTrabajadorDeleteURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccTrabajadorDelete(JSON.parse(params)),
  });
  useSVCCTrabajadorDelete = (params?: SVCCTrabajadorDeleteParams, options?: SVCCTrabajadorDeleteOptions) =>
    useSWRMutation(params ? this.swrSVCCTrabajadorDelete.key(params) : null, this.swrSVCCTrabajadorDelete.fetcher, options);
  //#endregion SVCC/Trabajador - Delete
  //#endregion SVCC/Trabajador
  //#endregion SVCC

}

const SvccAPI = Object.seal(new SvccAPIClass()) as SvccAPIClass;

export default SvccAPI;
