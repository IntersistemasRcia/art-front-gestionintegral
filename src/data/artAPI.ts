import useSWR, { Fetcher, SWRConfiguration } from "swr";
import useSWRMutation, { type SWRMutationConfiguration } from "swr/mutation";
import { useSession } from "next-auth/react";
import { ExternalAPI } from "./api";
import { token } from "./usuarioAPI";
import RefEmpleador from "@/app/inicio/usuarios/interfaces/RefEmpleador";
import srtProvincia from "@/app/inicio/usuarios/interfaces/SrtProvincia";
import FormularioRAR, { ParametersFormularioRar, ParametersEmpresaByCUIT, EstablecimientoById, ParametersEstablecimientoByCUIT, FormularioRARDetallePostRequest, FormularioRARPostRequest, FormularioRARPutRequest, FormulariosRARApiResponse } from "@/app/inicio/empleador/formularioRAR/types/TformularioRar";
import { toURLSearch } from "@/utils/utils";
import type { ApiFormularioRGRL, ApiEstablecimientoEmpresa, FormularioRGRLDeleteParams, FormularioRGRLDeleteResponse } from "@/app/inicio/empleador/formularioRGRL/types/rgrl";
import type { FormularioVm, TipoFormulario } from "@/app/inicio/empleador/formularioRGRL/generar/types/generar";
import { ParametersLocalidad, ParametersLocalidadCodigo, ParametersLocalidadNombre, DenunciaQueryParams, DenunciasApiResponse, DenunciaPostRequest, DenunciaQueryParamsID, AfiQueryParams, AfiApiResponse, PrestadorQueryParams, PrestadorResponse, DenunciaPutRequest, DenunciaPatchRequest, RefPaises, RefObraSocial, Roam, ParametersEmpleadorT, RefPrestadores, ParametersLocalidadSRT, ParametersLocalidadbyCodigo } from "@/app/inicio/denuncias/types/tDenuncias";
import { ParametersPoliza, ParametersComercializador, OrganizadorComercializador, GrupoOrganizadorComercializador, ParametersComercializadoresAsociados } from "@/app/inicio/comercializador/polizas/types/poliza";
import { ComercializadorPostRequest, ComercializadorPostResponse, ComercializadorPutRequest, ComercializadorPutResponse, ComercializadorDeleteParams, ComercializadorDeleteResponse, ComercializadorOrganizadoresPostRequest, ComercializadorOrganizadoresPutRequest, ComercializadorGOrganizadoresPostRequest, ComercializadorGOrganizadoresPutRequest, ComercializadorGOrganizadorById, ComercializadorById, ComercializadorOrganizadorById, SRTComercializadoresAsociadosPostRequest, SRTComercializadoresAsociadosPostResponse, SRTComercializadoresAsociadosPutRequest } from "@/app/inicio/comercializador/administracionComercializadores/types/administracionUsuarios"
import { ParametersEmpleadorPagosComercializador, ParametersAfipTranferencia } from "@/app/inicio/comercializador/cuentaCorriente/types/cuentaCorriente";
import { CoberturaPost, CoberturaPostResponse, ParametersCobertura } from "@/app/inicio/empleador/cobertura/types/cobertura";
import { ARCAparams, ARCAApiResponse } from "@/app/inicio/usuarios/interfaces/ARCA";
import { EmpresaParamsID } from "@/app/inicio/usuarios/types/empresa";
import Formato from "@/utils/Formato";
import { AxiosError } from "axios";
import type { AvisoObraRecord } from "@/app/inicio/empleador/avisosDeObra/types/types";

const tokenizable = token.configure();

const SVCC_CONSTANCIA_DEFAULT_FILENAME = "constancia.pdf";

/** Extrae el nombre de archivo de `Content-Disposition` sin romper si falta o es inválido (Axios puede exponer headers planos o con `.get`). */
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
  idMotivo?: number,
}
/** Body PUT `/api/SVCC/Presentaciones/Finaliza` */
export type PresentacionFinalizaDTO = {
  id: number;
  observaciones: string;
}
export type PresentacionDTO = PresentacionBaseDTO & {
  interno: number,
  idMotivo?: number,
  presentacionFecha?: string,
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
}
export type ActividadDTO = {
  interno?: number;
  puestoInterno?: number;
  sectorInterno?: number;
  sustanciaInterno?: number;
  permanente?: boolean;
  fechaInicioExposicion?: string;
  fechaFinExposicion?: string;
  examenesMedicos?: ExamenMedicoDTO[];
}
export type TrabajadorBaseDTO = {
  cuil?: number;
  idEstablecimientoEmpresa?: number;
  fechaIngreso?: string;
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
}
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
export type SVCCPresentacionUltimaParams = {
  empleadorCuit: number[];
  PageIndex?: number;
  PageSize?: number;
}
export type SVCCPresentacionUltimaSWRKey = [url: string, token: string, bodyJson: string];
export type SVCCPresentacionUltimaOptions = SWRConfiguration<Pagination<PresentacionDTO>, AxiosError, Fetcher<Pagination<PresentacionDTO>, SVCCPresentacionUltimaSWRKey>>
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

//#region Types
//#region Types Establecimiento
export type EstablecimientoVm = {
  interno: number;
  cuit: number;
  nroSucursal: number;
  nombre?: string;
  domicilioCalle?: string;
  domicilioNro?: string;
  superficie: number;
  cantTrabajadores: number;
  estadoAccion?: string;
  estadoFecha: number;
  estadoSituacion?: string;
  bajaMotivo: number;
  localidad?: string;
  provincia?: string;
  codigo: number;
  numero: number;
  codEstabEmpresa: number;
  ciiu: number;
  descripcion?: string;
}
export type EstablecimientoListParams = {
  cuit: number;
  Activos?: boolean;
}
export type EstablecimientoListSWRKey = [url: string, token: string, params: string];
export type EstablecimientoListOptions = SWRConfiguration<EstablecimientoVm[], AxiosError, Fetcher<EstablecimientoVm[], EstablecimientoListSWRKey>>
//#endregion Types Establecimiento

export type EmpresaParametroPutRequest = {
  nombre: string;
  valor: string;
};

export type ApiAgenteCausante = {
  interno: number;
  codigo: number;
  agenteCausante: string;
  agenteTipo: string;
};

export type ApiFormulariosRGRLParams = {
  empresasId?: number[];
  CUIT?: number | string;
  PageIndex?: number;
  PageSize?: number;
  OrderBy?: string;
  pageIndex?: number;
  pageSize?: number;
  orderBy?: string;
};

export type ApiFormulariosRGRLResponse = {
  index: number;
  size: number;
  pages: number;
  count: number;
  data: ApiFormularioRGRL[];
};

type GetFormulariosRARBySpecsBody = {
  empresasId: number[];
  fechaPresentacion?: string;
  refEstablecimientoId?: number;
  pageIndex: number;
  pageSize: number;
  orderBy: string;
};

type GetFormulariosRGRLBySpecsBody = {
  empresasId: number[];
  pageIndex: number;
  pageSize: number;
  orderBy: string;
};

export type FormularioRGRLCreateRequest = {
  internoFormulario: number;
  internoEstablecimiento: number;
  creacionFechaHora: string | null;
  completadoFechaHora: string | null;
  notificacionFecha: string | null;
  internoPresentacion: number;
  fechaSRT: string | null;
};

export type FormularioRGRLUpdateRequest = FormularioRGRLCreateRequest & {
  respuestasCuestionario: unknown[];
  respuestasGremio: unknown[];
  respuestasContratista: unknown[];
  respuestasResponsable: unknown[];
};

export type EmpresaParametroPutResponse = unknown;

/** Cuerpo POST `/api/AvisoObra/ultimos` (obraNumero/obraSecuencia solo si filtrás por obra). */
export type AvisoObraUltimosBody = {
  cuits: number[];
  pageIndex: number;
  pageSize: number;
  obraNumero?: number;
  obraSecuencia?: number;
};

/** Parámetros de consulta (una empresa con `CUIT`, o "todas" con `todasLasEmpresas`). */
export type AvisoObraUltimosParams = {
  CUIT?: number;
  /** Listado "Todas las empresas": admin envía `cuits: []`; resto envía `cuitsRelacionados`. */
  todasLasEmpresas?: boolean;
  esAdministrador?: boolean;
  cuitsRelacionados?: number[];
  obraNumero?: number;
  obraSecuencia?: number;
  pageIndex?: number;
  pageSize?: number;
};

export type AvisoObraUltimosResponse = {
  index?: number;
  size?: number;
  pages?: number;
  count?: number;
  data: AvisoObraRecord[];
};

/** La API puede devolver un array plano o un objeto paginado con `data`. */
export function normalizeAvisoObraUltimosResponse(raw: unknown): AvisoObraUltimosResponse {
  if (Array.isArray(raw)) {
    const rows = raw as AvisoObraRecord[];
    return {
      data: rows,
      index: 1,
      size: rows.length,
      pages: 1,
      count: rows.length,
    };
  }
  if (raw != null && typeof raw === 'object' && Array.isArray((raw as AvisoObraUltimosResponse).data)) {
    return raw as AvisoObraUltimosResponse;
  }
  return {
    data: [],
    index: 1,
    size: 0,
    pages: 0,
    count: 0,
  };
}

export function buildAvisoObraUltimosBody(params: AvisoObraUltimosParams = {}): AvisoObraUltimosBody {
  let cuits: number[];
  if (params.todasLasEmpresas) {
    if (params.esAdministrador) {
      cuits = [];
    } else {
      const raw = params.cuitsRelacionados ?? [];
      cuits = Array.from(
        new Set(raw.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n !== 0))
      );
    }
  } else {
    const cuit = params.CUIT;
    cuits =
      cuit != null && !Number.isNaN(Number(cuit)) && Number(cuit) !== 0 ? [Number(cuit)] : [0];
  }
  const body: AvisoObraUltimosBody = {
    cuits,
    pageIndex: params.pageIndex ?? 1,
    pageSize: params.pageSize ?? 10,
  };
  const on = params.obraNumero;
  const os = params.obraSecuencia;
  if (on != null && !Number.isNaN(Number(on)) && Number(on) !== 0) {
    body.obraNumero = Number(on);
  }
  if (os != null && !Number.isNaN(Number(os)) && Number(os) !== 0) {
    body.obraSecuencia = Number(os);
  }
  return body;
}

//#endregion Types

export function EstablecimientoVmDescripcion(establecimiento?: EstablecimientoVm) {
  if (establecimiento == null) return "";
  const { nombre, numero, codEstabEmpresa, descripcion } = establecimiento;
  return [
    Formato.Numero(codEstabEmpresa),
    Formato.Numero(numero),
    nombre,
    descripcion,
    EstablecimientoVmUbicacion(establecimiento),
  ].filter(e => e).join(" - ");
}

export function EstablecimientoVmUbicacion(establecimiento?: EstablecimientoVm) {
  if (establecimiento == null) return "";
  const { domicilioCalle, domicilioNro, localidad, provincia } = establecimiento;
  return [
    [domicilioCalle, domicilioNro].filter(e => e).join(" "),
    localidad,
    provincia,
  ].filter(e => e).join(", ");
}

function svccPresentacionTodasSearchParams(params?: SVCCPresentacionTodasParams): URLSearchParams | undefined {
  if (params == null) return undefined;
  const search = new URLSearchParams();
  const multicit = params.empleadorCuit;
  if (multicit != null && multicit.length > 0) {
    for (const c of multicit) {
      search.append("empleadorCuit", `${c}`);
    }
  } else if (params.empleadorCUIT != null && params.empleadorCUIT !== undefined) {
    search.append("empleadorCUIT", `${params.empleadorCUIT}`);
  }
  if (params.PageIndex != null) search.set("PageIndex", `${params.PageIndex}`);
  if (params.PageSize != null) search.set("PageSize", `${params.PageSize}`);
  if (params.Order != null) search.set("Order", params.Order);
  return search.size > 0 ? search : undefined;
}

/** Fila devuelta por `/api/SVCC/Presentaciones/Ultima` (y equivalentes con campos extra). */
function mapSvccPresentacionApiRecordToDTO(row: Record<string, unknown>): PresentacionDTO {
  const interno = Number(row.interno);
  const pf = row.presentacionFecha;
  const obs = row.observaciones;
  return {
    interno: Number.isFinite(interno) ? interno : 0,
    idMotivo: row.idMotivo != null ? Number(row.idMotivo) : undefined,
    observaciones: obs != null && obs !== '' ? String(obs) : undefined,
    presentacionFecha:
      pf != null && pf !== '' && String(pf) !== 'null' ? String(pf) : undefined,
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

function normalizeSvccPresentacionUltimaResponse(raw: unknown): Pagination<PresentacionDTO> {
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
  if (typeof raw === "object" && raw !== null && "data" in raw) {
    const p = raw as Pagination<Record<string, unknown>>;
    const data = mapSvccPresentacionRowsFromRaw(raw);
    return {
      index: typeof p.index === "number" ? p.index : 1,
      size: typeof p.size === "number" ? p.size : data.length,
      pages: typeof p.pages === "number" ? p.pages : data.length > 0 ? 1 : 0,
      count: typeof p.count === "number" ? p.count : data.length,
      data,
    };
  }
  return vacío();
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

export class ArtAPIClass extends ExternalAPI {
  readonly basePath = process.env.NEXT_PUBLIC_API_ART_URL || 'http://fallback-prod.url';

  //#region RefEmpleadores
  readonly refEmpleadoresURL = () => this.getURL({ path: "/api/Empresas" }).toString();
  getRefEmpleadores = async () => tokenizable.get<RefEmpleador[]>(
    this.refEmpleadoresURL()
  ).then(({ data }) => data);
  useGetRefEmpleadores = () => useSWR(
    [this.refEmpleadoresURL(), token.getToken()], () => this.getRefEmpleadores()
  );
  //#endregion

  //#region AvisoObra
  readonly postAvisoObraUltimosURL = () =>
    this.getURL({ path: "/api/AvisoObra/ultimos" }).toString();

  getAvisoObra = async (params: AvisoObraUltimosParams = {}) => {
    const body = buildAvisoObraUltimosBody(params);
    const raw = await tokenizable
      .post<unknown>(this.postAvisoObraUltimosURL(), body)
      .then(({ data }) => data);
    return normalizeAvisoObraUltimosResponse(raw);
  };

  useGetAvisoObra = (params: AvisoObraUltimosParams = {}) => {
    const todas = Boolean(params.todasLasEmpresas);
    const admin = Boolean(params.esAdministrador);
    const relacionados = params.cuitsRelacionados ?? [];
    const puedeFetch =
      (todas && (admin || relacionados.length > 0)) ||
      (!todas && params?.CUIT != null && params.CUIT !== 0);
    const body = buildAvisoObraUltimosBody(params);
    const swrKey = puedeFetch
      ? [this.postAvisoObraUltimosURL(), token.getToken(), JSON.stringify(body)] as const
      : null;
    return useSWR(
      swrKey,
      () => this.getAvisoObra(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  };

  readonly avisoObraInsertURL = this.getURL({ path: "/api/AvisoObra" }).toString();
  avisoObraInsert = async (payload: unknown) =>
    tokenizable.post(this.avisoObraInsertURL, payload).then(({ data }) => data);

  readonly avisoObraUpdateURL = (interno: number) =>
    this.getURL({ path: `/api/AvisoObra/${interno}` }).toString();
  avisoObraUpdate = async (interno: number, payload: unknown) =>
    tokenizable.put(this.avisoObraUpdateURL(interno), payload).then(({ data }) => data);

  readonly avisoObraDeleteURL = (interno: number) =>
    this.getURL({ path: `/api/AvisoObra/${interno}` }).toString();
  avisoObraDelete = async (interno: number) =>
    tokenizable.delete(this.avisoObraDeleteURL(interno)).then(({ data }) => data);
  //#endregion AvisoObra

  //#region Establecimientos
  readonly getEstablecimientosURL = (params: ParametersEstablecimientoByCUIT = {}) => {
    return this.getURL({
      path: "/api/Establecimientos/Empresa",
      search: toURLSearch(params),
    }).toString();
  };

  getEstablecimientos = async (params: ParametersEstablecimientoByCUIT = {}) =>
    tokenizable.get(
      this.getEstablecimientosURL(params),
    ).then(({ data }) => data);

  useGetEstablecimientos = (params: ParametersEstablecimientoByCUIT = {}) => useSWR(
    [this.getEstablecimientosURL(params), token.getToken()],
    () => this.getEstablecimientos(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  //#endregion


  //#region Establecimiento por Id
  readonly getEstablecimientoByIdURL = (params: EstablecimientoById) => {
    return this.getURL({
      path: `/api/Establecimientos/${params.id}`,
    }).toString();
  };

  getEstablecimientoById = async (params: EstablecimientoById) =>
    tokenizable
      .get(this.getEstablecimientoByIdURL(params))
      .then(({ data }) => data);

  useGetEstablecimientoById = (params?: EstablecimientoById) =>
    useSWR(
      params && params.id && token.getToken()
        ? [this.getEstablecimientoByIdURL(params), token.getToken()]
        : null,
      () => this.getEstablecimientoById(params as EstablecimientoById),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion

  //#region Establecimiento CUIT
  readonly establecimientoListURL = (params: EstablecimientoListParams) =>
    this.getURL({
      path: `/api/Establecimientos/Empresa/${params.cuit}`,
      search: toURLSearch({ Activos: params.Activos }),
    }).toString();
  establecimientoList = async (params: EstablecimientoListParams) => tokenizable.get<EstablecimientoVm[]>(
    this.establecimientoListURL(params)
  ).then(({ data }) => data);
  swrEstablecimientoList: {
    key: (params: EstablecimientoListParams) => EstablecimientoListSWRKey,
    fetcher: (key: EstablecimientoListSWRKey) => Promise<EstablecimientoVm[]>
  } = Object.freeze({
    key: (params) => [this.establecimientoListURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.establecimientoList(JSON.parse(params)),
  });
  useEstablecimientoList = (params?: EstablecimientoListParams, options?: EstablecimientoListOptions) => {
    // Solo hacer fetch si hay CUIT válido (diferente de 0 y no undefined/null)
    const hasValidCUIT = params?.cuit != null && params.cuit !== 0;
    const swrKey = hasValidCUIT ? this.swrEstablecimientoList.key(params) : null;
    return useSWR<EstablecimientoVm[], AxiosError>(
      swrKey,
      this.swrEstablecimientoList.fetcher,
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        ...options
      }
    );
  };
  //#endregion Establecimiento CUIT

  //#region FormulariosRAR
  readonly getFormulariosRARURL = () =>
    this.getURL({ path: "/api/FormulariosRAR/GetBySpecs" }).toString();
  getFormulariosRAR = async (params: ParametersFormularioRar & { empresasId?: number[] } = {}) => {
    const body: GetFormulariosRARBySpecsBody = {
      empresasId: Array.isArray(params.empresasId) ? params.empresasId : [],
      fechaPresentacion: params.FechaPresentacion,
      refEstablecimientoId: params.RefEstablecimientoId,
      pageIndex: params.PageIndex ?? 0,
      pageSize: params.PageSize ?? 10,
      orderBy: params.OrderBy ?? "-Interno",
    };
    return tokenizable.post(this.getFormulariosRARURL(), body).then(({ data }) => data);
  };
  useGetFormulariosRARURL = (params?: ParametersFormularioRar & { empresasId?: number[] }) => {
    // Obtener el token de la sesión de forma confiable
    const { data: session } = useSession();
    const accessToken = session?.accessToken;

    const paramsWithEmpresas = params as (ParametersFormularioRar & { empresasId?: number[] }) | undefined;
    const hasEmpresasArray = Boolean(
      paramsWithEmpresas && Array.isArray(paramsWithEmpresas.empresasId)
    );
    const key = paramsWithEmpresas && hasEmpresasArray && accessToken
      ? [
          this.getFormulariosRARURL(),
          accessToken,
          JSON.stringify(paramsWithEmpresas.empresasId),
          paramsWithEmpresas.PageIndex ?? 0,
          paramsWithEmpresas.PageSize ?? 10,
          paramsWithEmpresas.OrderBy ?? "-Interno",
          paramsWithEmpresas.FechaPresentacion ?? "",
          paramsWithEmpresas.RefEstablecimientoId ?? 0,
        ]
      : null;

    // Log para debug en desarrollo
    if (process.env.NODE_ENV === 'development') {
      if (key) {
        console.log('[useGetFormulariosRARURL] Clave SWR:', key);
        console.log('[useGetFormulariosRARURL] empresasId:', paramsWithEmpresas?.empresasId);
      } else {
        console.log('[useGetFormulariosRARURL] Clave SWR es null - params:', params, 'accessToken:', !!accessToken);
      }
    }

    return useSWR(
      key,
      key ? () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useGetFormulariosRARURL] Ejecutando fetcher con empresasId:', paramsWithEmpresas?.empresasId);
        }
        return this.getFormulariosRAR(paramsWithEmpresas ?? {});
      } : null,
      {
        // No volver a revalidar al volver al foco o reconectar
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        // SWR detectará automáticamente cuando cambia la clave (que incluye el CUIT)
        // y ejecutará el query automáticamente
        revalidateOnMount: true,
        keepPreviousData: false,
      }
    );
  };

  //  Formulario RAR por interno (/api/FormulariosRAR/{id})
  readonly getFormularioRARByIdURL = (interno: FormularioRAR['InternoFormularioRAR']) =>
    this.getURL({ path: `/api/FormulariosRAR/${interno}` }).toString();

  getFormularioRARById = async (interno: FormularioRAR['InternoFormularioRAR']) =>
    tokenizable.get(
      this.getFormularioRARByIdURL(interno),
    ).then(({ data }) => data);

  useGetFormularioRARById = (interno?: FormularioRAR['InternoFormularioRAR']) => useSWR(
    interno && token.getToken()
      ? [this.getFormularioRARByIdURL(interno), token.getToken()]
      : null,
    () => this.getFormularioRARById(interno as FormularioRAR['InternoFormularioRAR']),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  //#endregion

  // #region Formulario RAR POST
  readonly postFormularioRARURL = this.getURL({ path: "/api/FormulariosRAR" }).toString();

  postFormularioRAR = async (payload: FormularioRARPostRequest) =>
    tokenizable.post<FormulariosRARApiResponse>(this.postFormularioRARURL, payload).then(({ data }) => data);

  swrPostFormularioRAR: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: FormularioRARPostRequest }) => Promise<FormulariosRARApiResponse>;
  } = Object.freeze({
    key: [this.postFormularioRARURL, token.getToken()],
    fetcher: (_key, { arg }) => this.postFormularioRAR(arg),
  });

  usePostFormularioRAR = () =>
    useSWRMutation<FormulariosRARApiResponse, Error, [url: string, token: string], FormularioRARPostRequest>(
      this.swrPostFormularioRAR.key,
      this.swrPostFormularioRAR.fetcher
    );
  //#endregion

  //#region RAR PUT
  readonly putFormularioRARBaseURL = this.getURL({ path: "/api/FormulariosRAR" }).toString();

  readonly putFormularioRARURL = (id: number | string) =>
    this.getURL({ path: `/api/FormulariosRAR/${id}` }).toString();

  putFormularioRAR = async (id: number | string, data: FormularioRARPutRequest) =>
    tokenizable.put<FormulariosRARApiResponse>(this.putFormularioRARURL(id), data).then(({ data }) => data);

  swrPutFormularioRAR: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: { id: number | string; data: FormularioRARPutRequest } }) => Promise<FormulariosRARApiResponse>;
  } = Object.freeze({
    key: [this.putFormularioRARBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.putFormularioRAR(arg.id, arg.data),
  });

  usePutFormularioRAR = () =>
    useSWRMutation<FormulariosRARApiResponse, Error, [url: string, token: string], { id: number | string; data: FormularioRARPutRequest }>(
      this.swrPutFormularioRAR.key,
      this.swrPutFormularioRAR.fetcher
    );
  //#endregion


  //#region FormulariosRGRL
  readonly getFormulariosRGRLURL = () =>
    this.getURL({ path: "/api/FormulariosRGRL/GetBySpecs" }).toString();
  getFormulariosRGRL = async (params: ApiFormulariosRGRLParams = {}): Promise<ApiFormulariosRGRLResponse> => {
    const body: GetFormulariosRGRLBySpecsBody = {
      empresasId: Array.isArray(params.empresasId) ? params.empresasId : [],
      pageIndex: params.pageIndex ?? params.PageIndex ?? 0,
      pageSize: params.pageSize ?? params.PageSize ?? 10,
      orderBy: params.orderBy ?? params.OrderBy ?? "-creacionFechaHora",
    };
    return tokenizable
      .post<ApiFormulariosRGRLResponse>(this.getFormulariosRGRLURL(), body)
      .then(({ data }) => data);
  };
  useGetFormulariosRGRL = (params: ApiFormulariosRGRLParams = {}) =>
    useSWR(
      [
        this.getFormulariosRGRLURL(),
        token.getToken(),
        JSON.stringify(params.empresasId ?? []),
        params.pageIndex ?? params.PageIndex ?? 0,
        params.pageSize ?? params.PageSize ?? 10,
        params.orderBy ?? params.OrderBy ?? "-creacionFechaHora",
      ],
      () => this.getFormulariosRGRL(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );

  readonly getTiposFormulariosRGRLURL = () =>
    this.getURL({ path: "/api/TiposFormulariosRGRL" }).toString();
  getTiposFormulariosRGRL = async (): Promise<TipoFormulario[]> =>
    tokenizable.get<TipoFormulario[]>(this.getTiposFormulariosRGRLURL()).then(({ data }) => data);
  useGetTiposFormulariosRGRL = () =>
    useSWR(
      [this.getTiposFormulariosRGRLURL(), token.getToken()],
      () => this.getTiposFormulariosRGRL(),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );

  readonly getFormularioRGRLByIdURL = (id: number) =>
    this.getURL({ path: `/api/FormulariosRGRL/${id}` }).toString();
  getFormularioRGRLById = async (id: number): Promise<FormularioVm> =>
    tokenizable.get<FormularioVm>(this.getFormularioRGRLByIdURL(id)).then(({ data }) => data);
  useGetFormularioRGRLById = (id?: number) =>
    useSWR(
      id && token.getToken()
        ? [this.getFormularioRGRLByIdURL(id), token.getToken()]
        : null,
      () => this.getFormularioRGRLById(id as number),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );

  readonly patchEstablecimientoRGRLBaseURL = this.getURL({ path: "/api/Establecimientos" }).toString();
  readonly patchEstablecimientoRGRLURL = (id: number) =>
    this.getURL({ path: `/api/Establecimientos/${id}` }).toString();
  patchEstablecimientoRGRL = async (id: number, payload: { superficie: number; cantTrabajadores: number }): Promise<void> =>
    tokenizable.patch(this.patchEstablecimientoRGRLURL(id), payload).then(() => undefined);
  swrPatchEstablecimientoRGRL: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: { id: number; payload: { superficie: number; cantTrabajadores: number } } }) => Promise<void>;
  } = Object.freeze({
    key: [this.patchEstablecimientoRGRLBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.patchEstablecimientoRGRL(arg.id, arg.payload),
  });
  usePatchEstablecimientoRGRL = () =>
    useSWRMutation<void, Error, [url: string, token: string], { id: number; payload: { superficie: number; cantTrabajadores: number } }>(
      this.swrPatchEstablecimientoRGRL.key,
      this.swrPatchEstablecimientoRGRL.fetcher
    );

  readonly postFormularioRGRLURL = this.getURL({ path: "/api/FormulariosRGRL" }).toString();
  postFormularioRGRL = async (payload: FormularioRGRLCreateRequest): Promise<{ interno: number }> =>
    tokenizable.post<{ interno: number }>(this.postFormularioRGRLURL, payload).then(({ data }) => data);
  swrPostFormularioRGRL: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: FormularioRGRLCreateRequest }) => Promise<{ interno: number }>;
  } = Object.freeze({
    key: [this.postFormularioRGRLURL, token.getToken()],
    fetcher: (_key, { arg }) => this.postFormularioRGRL(arg),
  });
  usePostFormularioRGRL = () =>
    useSWRMutation<{ interno: number }, Error, [url: string, token: string], FormularioRGRLCreateRequest>(
      this.swrPostFormularioRGRL.key,
      this.swrPostFormularioRGRL.fetcher
    );

  readonly putFormularioRGRLBaseURL = this.getURL({ path: "/api/FormulariosRGRL" }).toString();
  readonly putFormularioRGRLURL = (id: number) =>
    this.getURL({ path: `/api/FormulariosRGRL/${id}` }).toString();
  putFormularioRGRL = async (id: number, payload: FormularioRGRLUpdateRequest): Promise<void> =>
    tokenizable.put(this.putFormularioRGRLURL(id), payload).then(() => undefined);
  swrPutFormularioRGRL: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: { id: number; payload: FormularioRGRLUpdateRequest } }) => Promise<void>;
  } = Object.freeze({
    key: [this.putFormularioRGRLBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.putFormularioRGRL(arg.id, arg.payload),
  });
  usePutFormularioRGRL = () =>
    useSWRMutation<void, Error, [url: string, token: string], { id: number; payload: FormularioRGRLUpdateRequest }>(
      this.swrPutFormularioRGRL.key,
      this.swrPutFormularioRGRL.fetcher
    );
  //#endregion

    //#region RGRL DELETE
  readonly deleteFormularioRGRLBaseURL = this.getURL({ path: "/api/FormulariosRGRL" }).toString();

  readonly deleteFormularioRGRLURL = (id: number | string) =>
    this.getURL({ path: `/api/FormulariosRGRL/${id}` }).toString();

  deleteFormularioRGRL = async (id: number | string) =>
    tokenizable.delete<FormularioRGRLDeleteResponse>(this.deleteFormularioRGRLURL(id)).then(({ data }) => data);

  swrDeleteFormularioRGRL: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: FormularioRGRLDeleteParams }) => Promise<FormularioRGRLDeleteResponse>;
  } = Object.freeze({
    key: [this.deleteFormularioRGRLBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.deleteFormularioRGRL(arg.id),
  });

  useDeleteFormularioRGRL = () =>
    useSWRMutation<FormularioRGRLDeleteResponse, Error, [url: string, token: string], FormularioRGRLDeleteParams>(
      this.swrDeleteFormularioRGRL.key,
      this.swrDeleteFormularioRGRL.fetcher
    );
  //#endregion


  //#region Localidades

  //Cod Postal
  readonly getLocalidadesbyCPURL = (params: ParametersLocalidad = {}) => {
    return this.getURL({
      path: "/api/Localidades/CodPostal",
      search: toURLSearch(params),
    }).toString();
  };

  getLocalidadesbyCP = async (params: ParametersLocalidad = {}) =>
    tokenizable.get(this.getLocalidadesbyCPURL(params)).then(({ data }) => data);

  useGetLocalidadesbyCP = (params: ParametersLocalidad = {}) =>
    useSWR(
      params && params.CodPostal
        ? [this.getLocalidadesbyCPURL(params), token.getToken()]
        : null,
      () => this.getLocalidadesbyCP(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );

  //Nombre Localidad
  readonly getLocalidadesbyNombreURL = (params: ParametersLocalidadNombre = {}) => {
    return this.getURL({
      path: "/api/Localidades/Nombre",
      search: toURLSearch(params),
    }).toString();
  };

  getLocalidadesbyNombre = async (params: ParametersLocalidadNombre = {}) =>
    tokenizable.get(this.getLocalidadesbyNombreURL(params)).then(({ data }) => data);

  useGetLocalidadesbyNombre = (params: ParametersLocalidadNombre = {}) =>
    useSWR(
      params && params.Nombre
        ? [this.getLocalidadesbyNombreURL(params), token.getToken()]
        : null,
      () => this.getLocalidadesbyNombre(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );


  //Codigo Localidad
  readonly getLocalidadesbyCodigoURL = (params: ParametersLocalidadCodigo = {}) => {
    return this.getURL({
      path: "/api/Localidades/Codigo",
      search: toURLSearch(params),
    }).toString();
  };

  getLocalidadesbyCodigo = async (params: ParametersLocalidadCodigo = {}) =>
    tokenizable.get(this.getLocalidadesbyCodigoURL(params)).then(({ data }) => data);

  useGetLocalidadesbyCodigo = (params: ParametersLocalidadCodigo = {}) =>
    useSWR(
      params && params.Codigo
        ? [this.getLocalidadesbyCodigoURL(params), token.getToken()]
        : null,
      () => this.getLocalidadesbyCodigo(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );

    //region LocalidadSRT
  readonly getLocalidadesbySRTURL = (params: ParametersLocalidadSRT = {}) => {
    return this.getURL({
      path: "/api/SRTLocalidades",
      search: toURLSearch(params),
    }).toString();
  };

  getLocalidadesSRT = async (params: ParametersLocalidadSRT = {}) =>
    tokenizable.get(this.getLocalidadesbySRTURL(params)).then(({ data }) => data);

  useGetLocalidadesSRT = (params: ParametersLocalidadSRT = {}) =>
    useSWR(
      params && params.provinciaId
        ? [this.getLocalidadesbySRTURL(params), token.getToken()]
        : null,
      () => this.getLocalidadesSRT(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );

    //Region LoclaidadSrt Codigo {codigo}
      readonly getLocalidadByCodigoURL = (params: ParametersLocalidadbyCodigo) => {
    return this.getURL({
      path: `/api/SRTLocalidades/codigo/${params.codigo}`,
    }).toString();
  };

  getLocalidadById = async (params: ParametersLocalidadbyCodigo) =>
    tokenizable
      .get(this.getLocalidadByCodigoURL(params))
      .then(({ data }) => data);

  useGetLocalidadById = (params?: ParametersLocalidadbyCodigo) =>
    useSWR(
      params?.codigo && token.getToken()
        ? [this.getLocalidadByCodigoURL(params), token.getToken()]
        : null,
      () => this.getLocalidadById(params as ParametersLocalidadbyCodigo),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );


  //#endregion localidades

  //Provincia
  readonly srtProvinciaURL = () => this.getURL({ path: "/api/SRTProvincias" }).toString();
  getsrtProvinciaURL = async () => tokenizable.get<srtProvincia[]>(
    this.srtProvinciaURL()
  ).then(({ data }) => data);
  useGetSRTProvincias = () => useSWR(
    [this.srtProvinciaURL(), token.getToken()], () => this.srtProvinciaURL()
  );
  //#endregion



  //#region Denuncias
  readonly getDenunciasURL = (params: DenunciaQueryParams = {}) => {
    //params.CUIT ??= useAuth().user?.empresaCUIT ?? 0; este parametro lo paso desde el componente que lo usa
    // Ordenar por defecto: más nuevas primero (Interno descendente)
    //params.orderBy ??= "-Interno";
    return this.getURL({
      path: "/api/Denuncias",
      search: toURLSearch(params),
    }).toString();
  };
  getDenuncias = async (params: DenunciaQueryParams = {}) =>
    tokenizable.get<DenunciasApiResponse>(this.getDenunciasURL(params)).then(({ data }) => data);
  useGetDenuncias = (params: DenunciaQueryParams = {}) =>
    useSWR(
      [this.getDenunciasURL(params), token.getToken()],
      () => this.getDenuncias(params),
      {
        // No volver a revalidar al volver al foco, reconectar o al montar si ya hay cache
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        //revalidateOnMount: false,
        //dedupingInterval: 1000 * 60 * 60, // 1 hora (ajusta si hace falta) // Tiempo en ms durante el cual SWR deduplica solicitudes iguales (evita re-fetch frecuente)
        // Si quieres que la clave no dispare fetch hasta que exista token, puedes usar: (token.getToken() ? key : null)
      }
    );
  //#endregion

  //#Region Denuncia por Id
  readonly getDenunciaByIdURL = (params: DenunciaQueryParamsID) => {
    return this.getURL({
      path: `/api/Denuncias/${params.id}`,
    }).toString();
  };

  getDenunciaById = async (params: DenunciaQueryParamsID) =>
    tokenizable
      .get(this.getDenunciaByIdURL(params))
      .then(({ data }) => data);

  useGetDenunciaById = (params?: DenunciaQueryParamsID) =>
    useSWR(
      params?.id && token.getToken()
        ? [this.getDenunciaByIdURL(params), token.getToken()]
        : null,
      () => this.getDenunciaById(params as DenunciaQueryParamsID),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion

  //#region Denuncia POST
  readonly postDenunciaURL = this.getURL({ path: "/api/Denuncias" }).toString();

  postDenuncia = async (data: DenunciaPostRequest) =>
    tokenizable.post<DenunciasApiResponse>(this.postDenunciaURL, data).then(({ data }) => data);

  swrPostDenuncia: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: DenunciaPostRequest }) => Promise<DenunciasApiResponse>;
  } = Object.freeze({
    key: [this.postDenunciaURL, token.getToken()],
    fetcher: (_key, { arg }) => this.postDenuncia(arg),
  });

  usePostDenuncia = () =>
    useSWRMutation<DenunciasApiResponse, Error, [url: string, token: string], DenunciaPostRequest>(
      this.swrPostDenuncia.key,
      this.swrPostDenuncia.fetcher
    );
  //#endregion

  //#region Denuncia PUT
  readonly putDenunciaBaseURL = this.getURL({ path: "/api/Denuncias" }).toString();

  readonly putDenunciaURL = (id: number | string) =>
    this.getURL({ path: `/api/Denuncias/${id}` }).toString();

  putDenuncia = async (id: number | string, data: DenunciaPutRequest) =>
    tokenizable.put<DenunciasApiResponse>(this.putDenunciaURL(id), data).then(({ data }) => data);

  swrPutDenuncia: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: { id: number; data: DenunciaPutRequest } }) => Promise<DenunciasApiResponse>;
  } = Object.freeze({
    key: [this.putDenunciaBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.putDenuncia(arg.id, arg.data),
  });

  usePutDenuncia = () =>
    useSWRMutation<DenunciasApiResponse, Error, [url: string, token: string], { id: number; data: DenunciaPutRequest }>(
      this.swrPutDenuncia.key,
      this.swrPutDenuncia.fetcher
    );
  //#endregion

  //#region Denuncia PATCH
  readonly patchDenunciaURL = this.getURL({ path: "/api/Denuncias" }).toString();

  patchDenuncia = async (data: DenunciaPatchRequest) =>
    tokenizable.patch<DenunciasApiResponse>(this.patchDenunciaURL, data).then(({ data }) => data);

  swrPatchDenuncia: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: DenunciaPatchRequest }) => Promise<DenunciasApiResponse>;
  } = Object.freeze({
    key: [this.patchDenunciaURL, token.getToken()],
    fetcher: (_key, { arg }) => this.patchDenuncia(arg),
  });

  usePatchDenuncia = () =>
    useSWRMutation<DenunciasApiResponse, Error, [url: string, token: string], DenunciaPatchRequest>(
      this.swrPatchDenuncia.key,
      this.swrPatchDenuncia.fetcher
    );
  //#endregion


  //#region Afiliado por CUIL
  readonly getAfiliadoByCuilURL = (params: AfiQueryParams = {}) => {
    return this.getURL({
      path: "/api/Afiliados/CUIL",
      search: toURLSearch(params),
    }).toString();
  };
  getAfiliadoCuil = async (params: AfiQueryParams = {}) =>
    tokenizable.get<AfiApiResponse>(this.getAfiliadoByCuilURL(params)).then(({ data }) => data);
  useGetAfiliadoCuil = (params: AfiQueryParams = {}) =>
    useSWR(
      [this.getAfiliadoByCuilURL(params), token.getToken()],
      () => this.getAfiliadoCuil(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion

  //#region get Prestador inicial por CUIT
  readonly getPrestadolURL = (params: PrestadorQueryParams = {}) => {
    return this.getURL({
      path: "/api/Prestadores/CUIT",
      search: toURLSearch(params),
    }).toString();
  };
  getPrestador = async (params: PrestadorQueryParams = {}) =>
    tokenizable.get<PrestadorResponse>(this.getPrestadolURL(params)).then(({ data }) => data);
  useGetPrestador = (params: PrestadorQueryParams = {}) =>
    useSWR(
      [this.getPrestadolURL(params), token.getToken()],
      () => this.getPrestador(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion

  //Region Prestadores get
  readonly refPrestadoresURL = () => this.getURL({ path: "/api/Prestadores" }).toString();
  getRefPrestadores = async () => tokenizable.get<RefPrestadores[]>(
    this.refPrestadoresURL()
  ).then(({ data }) => data);
  useGetRefPrestadores = () => useSWR(
    [this.refPrestadoresURL(), token.getToken()], () => this.getRefPrestadores()
  );
  //#endregion


  //Region paises
  readonly refPaisesURL = () => this.getURL({ path: "/api/Paises" }).toString();
  getRefPaises = async () => tokenizable.get<RefPaises[]>(
    this.refPaisesURL()
  ).then(({ data }) => data);
  useGetRefPaises = () => useSWR(
    [this.refPaisesURL(), token.getToken()], () => this.getRefPaises()
  );
  //#endregion

  //Region OS
  readonly refObraSocialURL = () => this.getURL({ path: "/api/ObrasSociales" }).toString();
  getRefObraSocial = async () => tokenizable.get<RefObraSocial[]>(
    this.refObraSocialURL()
  ).then(({ data }) => data);
  useGetRefObraSocail = () => useSWR(
    [this.refObraSocialURL(), token.getToken()], () => this.getRefObraSocial()
  );
  //#endregion

  //Region ROAM
  readonly refRoamURL = () => this.getURL({ path: "/api/Roam" }).toString();
  getRefRoam = async () => tokenizable.get<Roam[]>(
    this.refRoamURL()
  ).then(({ data }) => data);
  useGetRefRoam = () => useSWR(
    [this.refRoamURL(), token.getToken()], () => this.getRefRoam()
  );
  //#endregion


  //#region Establecimientos por CUIT
  readonly getEstablecimientosEmpresaURL = (cuit: number, activos?: string) => {
    const opts: any = { path: `/api/Establecimientos/Empresa/${encodeURIComponent(cuit)}` };
    if (activos !== undefined) opts.search = toURLSearch({ Activos: activos });
    return this.getURL(opts).toString();
  };
  getEstablecimientosEmpresa = async (cuit: number, activos?: string): Promise<ApiEstablecimientoEmpresa[]> =>
    tokenizable.get<ApiEstablecimientoEmpresa[]>(this.getEstablecimientosEmpresaURL(cuit, activos)).then(({ data }) => data);
  useGetEstablecimientosEmpresa = (cuit: number, activos?: string) =>
    useSWR(
      [this.getEstablecimientosEmpresaURL(cuit, activos), token.getToken()],
      () => this.getEstablecimientosEmpresa(cuit, activos),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion

  //#region Agentes Causantes
  readonly getAgentesCausantesURL = () =>
    this.getURL({ path: "/api/AgentesCausantes" }).toString();
  getAgentesCausantes = async (): Promise<ApiAgenteCausante[]> =>
    tokenizable.get<ApiAgenteCausante[]>(this.getAgentesCausantesURL()).then(({ data }) => data);
  useGetAgentesCausantes = () =>
    useSWR(
      [this.getAgentesCausantesURL(), token.getToken()],
      () => this.getAgentesCausantes(),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion

  //#region Empresas por CUIT
  readonly getEmpresaByCUITURL = (params: { CUIT?: number | string } = {}) => {
    return this.getURL({ path: "/api/Empresas/CUIT", search: toURLSearch(params) }).toString();
  };

  getEmpresaByCUIT = async (params: ParametersEmpresaByCUIT = {}) =>
    tokenizable.get(this.getEmpresaByCUITURL(params))
      .then(({ data }) => data);

  useGetEmpresaByCUIT = (params: ParametersEmpresaByCUIT = {}) => useSWR(
    [this.getEmpresaByCUITURL(params), token.getToken()],
    () => this.getEmpresaByCUIT(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  //#endregion

  //#Region Empresa por Id
  readonly getEmpresaByIdURL = (params: EmpresaParamsID) => {
    return this.getURL({
      path: `/api/Empresas/${params.id}`,
    }).toString();
  };

  getEmpresaById = async (params: EmpresaParamsID) =>
    tokenizable
      .get(this.getEmpresaByIdURL(params))
      .then(({ data }) => data);

  useGetEmpresaById = (params?: EmpresaParamsID) =>
    useSWR(
      params?.id && token.getToken()
        ? [this.getEmpresaByIdURL(params), token.getToken()]
        : null,
      () => this.getEmpresaById(params as EmpresaParamsID),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion Empresa por Id


  //#region Empresa PUT
  readonly putEmpresaParametroBaseURL = this.getURL({ path: "/api/Empresas" }).toString();

  readonly putEmpresaParametroURL = (id: number | string) =>
    this.getURL({ path: `/api/Empresas/${id}/Parametro` }).toString();

  putEmpresaParametro = async (id: number | string, data: EmpresaParametroPutRequest) =>
    tokenizable.put<EmpresaParametroPutResponse>(this.putEmpresaParametroURL(id), data).then(({ data }) => data);

  swrPutEmpresaParametro: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: { id: number | string; data: EmpresaParametroPutRequest } }) => Promise<EmpresaParametroPutResponse>;
  } = Object.freeze({
    key: [this.putEmpresaParametroBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.putEmpresaParametro(arg.id, arg.data),
  });

  usePutEmpresaParametro = () =>
    useSWRMutation<EmpresaParametroPutResponse, Error, [url: string, token: string], { id: number | string; data: EmpresaParametroPutRequest }>(
      this.swrPutEmpresaParametro.key,
      this.swrPutEmpresaParametro.fetcher
    );
  //#endregion


  //#region EmpleadorTrabajadores
  readonly getEmpleadorTrabajadoresURL = (params: ParametersEmpleadorT = {}) => {
    //params.CUIT ??= useAuth().user?.empresaCUIT ?? 0; este parametro lo paso desde el componente que lo usa
    return this.getURL({ path: "/api/EmpleadorTrabajadores/CUIT", search: toURLSearch(params) }).toString();
  };
  getEmpleadorTrabajadores = async (params: ParametersEmpleadorT = {}) => tokenizable.get(
    this.getEmpleadorTrabajadoresURL(params),
  ).then(({ data }) => data);
  useGetEmpleadorTrabajadoresURL = (params: ParametersEmpleadorT = {}) => useSWR(
    [this.getEmpleadorTrabajadoresURL(params), token.getToken()], () => this.getEmpleadorTrabajadores(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );



  //#region Polizas Comercializador
  readonly getpolizaComercializadorURL = (params: ParametersPoliza = {}) => {
    return this.getURL({ path: "/api/SRTPolizas", search: toURLSearch(params) }).toString();
  };
  getPolizaComercializador = async (params: ParametersPoliza = {}) => tokenizable.get(
    this.getpolizaComercializadorURL(params),
  ).then(({ data }) => data);
  useGetPolizaComercializadorURL = (params: ParametersPoliza = {}) => useSWR(
    [this.getpolizaComercializadorURL(params), token.getToken()], () => this.getPolizaComercializador(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );



  //#region Comercializador

  //GET comercializador
  readonly getComercializadorURL = (params: ParametersComercializador = {}) => {
    return this.getURL({ path: "/api/SRTComercializadores", search: toURLSearch(params) }).toString();
  };
  getComercializador = async (params: ParametersComercializador = {}) => tokenizable.get(
    this.getComercializadorURL(params),
  ).then(({ data }) => data);
  useGetComercializadorURL = (params: ParametersComercializador = {}) => useSWR(
    [this.getComercializadorURL(params), token.getToken()], () => this.getComercializador(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  //POST
  readonly postComercializadorURL = this.getURL({ path: "/api/SRTComercializadores" }).toString();

  postComercializador = async (data: ComercializadorPostRequest) =>
    tokenizable.post<ComercializadorPostResponse>(this.postComercializadorURL, data).then(({ data }) => data);

  swrPostComercializador: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: ComercializadorPostRequest }) => Promise<ComercializadorPostResponse>;
  } = Object.freeze({
    key: [this.postComercializadorURL, token.getToken()],
    fetcher: (_key, { arg }) => this.postComercializador(arg),
  });

  usePostComercializador = () =>
    useSWRMutation<ComercializadorPostResponse, Error, [url: string, token: string], ComercializadorPostRequest>(
      this.swrPostComercializador.key,
      this.swrPostComercializador.fetcher
    );
  //#endregion

  //#region Comercializador PUT
  readonly putComercializadorBaseURL = this.getURL({ path: "/api/SRTComercializadores" }).toString();

  readonly putComercializadorURL = (id: number | string) =>
    this.getURL({ path: `/api/SRTComercializadores/${id}` }).toString();

  putComercializador = async (id: number | string, data: ComercializadorPutRequest) =>
    tokenizable.put<ComercializadorPutResponse>(this.putComercializadorURL(id), data).then(({ data }) => data);

  swrPutComercializador: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: { id: number | string; data: ComercializadorPutRequest } }) => Promise<ComercializadorPutResponse>;
  } = Object.freeze({
    key: [this.putComercializadorBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.putComercializador(arg.id, arg.data),
  });

  usePutComercializador = () =>
    useSWRMutation<ComercializadorPutResponse, Error, [url: string, token: string], { id: number | string; data: ComercializadorPutRequest }>(
      this.swrPutComercializador.key,
      this.swrPutComercializador.fetcher
    );
  //#endregion

  //#region Comercializador DELETE
  readonly deleteComercializadorBaseURL = this.getURL({ path: "/api/SRTComercializadores" }).toString();

  readonly deleteComercializadorURL = (id: number | string) =>
    this.getURL({ path: `/api/SRTComercializadores/${id}` }).toString();

  deleteComercializador = async (id: number | string) =>
    tokenizable.delete<ComercializadorDeleteResponse>(this.deleteComercializadorURL(id)).then(({ data }) => data);

  swrDeleteComercializador: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: ComercializadorDeleteParams }) => Promise<ComercializadorDeleteResponse>;
  } = Object.freeze({
    key: [this.deleteComercializadorBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.deleteComercializador(arg.id),
  });

  useDeleteComercializador = () =>
    useSWRMutation<ComercializadorDeleteResponse, Error, [url: string, token: string], ComercializadorDeleteParams>(
      this.swrDeleteComercializador.key,
      this.swrDeleteComercializador.fetcher
    );
  //#endregion


  //#region Comercializador por Id
  readonly getComercializadorByIdURL = (params: ComercializadorById) => {
    return this.getURL({
      path: `/api/SRTComercializadores/${params.id}`,
    }).toString();
  };

  getComercializadorById = async (params: ComercializadorById) =>
    tokenizable
      .get(this.getComercializadorByIdURL(params))
      .then(({ data }) => data);

  useGetComercializadorById = (params?: ComercializadorById) =>
    useSWR(
      params && params.id && token.getToken()
        ? [this.getComercializadorByIdURL(params), token.getToken()]
        : null,
      () => this.getComercializadorById(params as ComercializadorById),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion


  //End Region Comercializador

  //#region Organizador Comercializador

  //GET Organizador Comercializador
  readonly getOrganizadorURL = (params: OrganizadorComercializador = {}) => {
    return this.getURL({ path: "/api/SRTComercializadoresOrganizadores", search: toURLSearch(params) }).toString();
  };
  getOrganizador = async (params: OrganizadorComercializador = {}) => tokenizable.get(
    this.getOrganizadorURL(params),
  ).then(({ data }) => data);
  useGetOrganizadorURL = (params: OrganizadorComercializador = {}) => useSWR(
    [this.getOrganizadorURL(params), token.getToken()], () => this.getOrganizador(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  //POST Organizador Comercializador
  readonly postComercializadororganizadoresURL = this.getURL({ path: "/api/SRTComercializadoresOrganizadores" }).toString();

  postComercializadorOrganizadores = async (data: ComercializadorOrganizadoresPostRequest) =>
    tokenizable.post<ComercializadorPostResponse>(this.postComercializadororganizadoresURL, data).then(({ data }) => data);

  swrPostComercializadororganizadores: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: ComercializadorOrganizadoresPostRequest }) => Promise<ComercializadorPostResponse>;
  } = Object.freeze({
    key: [this.postComercializadororganizadoresURL, token.getToken()],
    fetcher: (_key, { arg }) => this.postComercializadorOrganizadores(arg),
  });

  usePostComercializadorOrganizadores = () =>
    useSWRMutation<ComercializadorPostResponse, Error, [url: string, token: string], ComercializadorOrganizadoresPostRequest>(
      this.swrPostComercializadororganizadores.key,
      this.swrPostComercializadororganizadores.fetcher
    );
  //#endregion


  //#region Comercializador Organizador PUT
  readonly putComercializadorOrganizadoresBaseURL = this.getURL({ path: "/api/SRTComercializadoresOrganizadores" }).toString();

  readonly putComercializadorOrganizadoresURL = (id: number | string) =>
    this.getURL({ path: `/api/SRTComercializadoresOrganizadores/${id}` }).toString();

  putComercializadorOrganizadores = async (id: number | string, data: ComercializadorOrganizadoresPutRequest) =>
    tokenizable.put<ComercializadorPutResponse>(this.putComercializadorOrganizadoresURL(id), data).then(({ data }) => data);

  swrPutComercializadorOrganizadores: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: { id: number | string; data: ComercializadorOrganizadoresPutRequest } }) => Promise<ComercializadorPutResponse>;
  } = Object.freeze({
    key: [this.putComercializadorOrganizadoresBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.putComercializadorOrganizadores(arg.id, arg.data),
  });

  usePutComercializadorOrganizadores = () =>
    useSWRMutation<ComercializadorPutResponse, Error, [url: string, token: string], { id: number | string; data: ComercializadorOrganizadoresPutRequest }>(
      this.swrPutComercializadorOrganizadores.key,
      this.swrPutComercializadorOrganizadores.fetcher
    );
  //#endregion

  // //#region Comercializador organizadores DELETE
  readonly deleteComercializadoresOrganizadoresBaseURL = this.getURL({ path: "/api/SRTComercializadoresOrganizadores" }).toString();

  readonly deleteComercializadoresOrganizadoresURL = (id: number | string) =>
    this.getURL({ path: `/api/SRTComercializadoresOrganizadores/${id}` }).toString();

  deleteComercializadoresOrganizadores = async (id: number | string) =>
    tokenizable.delete<ComercializadorDeleteResponse>(this.deleteComercializadoresOrganizadoresURL(id)).then(({ data }) => data);

  swrDeleteComercializadoresOrganizadores: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: ComercializadorDeleteParams }) => Promise<ComercializadorDeleteResponse>;
  } = Object.freeze({
    key: [this.deleteComercializadoresOrganizadoresBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.deleteComercializadoresOrganizadores(arg.id),
  });

  useDeleteComercializadoresOrganizadores = () =>
    useSWRMutation<ComercializadorDeleteResponse, Error, [url: string, token: string], ComercializadorDeleteParams>(
      this.swrDeleteComercializadoresOrganizadores.key,
      this.swrDeleteComercializadoresOrganizadores.fetcher
    );
  // //#endregion


  //#region Organizador comercializador por Id
  readonly getOrganizadorByIdURL = (params: ComercializadorOrganizadorById) => {
    return this.getURL({
      path: `/api/SRTComercializadoresOrganizadores/${params.id}`,
    }).toString();
  };

  getOrganizadorById = async (params: ComercializadorOrganizadorById) =>
    tokenizable
      .get(this.getOrganizadorByIdURL(params))
      .then(({ data }) => data);

  useGetOrganizadorById = (params?: ComercializadorOrganizadorById) =>
    useSWR(
      params && params.id && token.getToken()
        ? [this.getOrganizadorByIdURL(params), token.getToken()]
        : null,
      () => this.getOrganizadorById(params as ComercializadorOrganizadorById),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion

  //#Endregion OrgComercializador


  //#region Grupo Organizador Comercializador

  //GET Grupo Organizador Comercializador
  readonly getGOrganizadorURL = (params: GrupoOrganizadorComercializador = {}) => {
    return this.getURL({ path: "/api/SRTComercializadoresGOrganizadores", search: toURLSearch(params) }).toString();
  };
  getGOrganizador = async (params: GrupoOrganizadorComercializador = {}) => tokenizable.get(
    this.getGOrganizadorURL(params),
  ).then(({ data }) => data);
  useGetGOrganizadorURL = (params: GrupoOrganizadorComercializador = {}) => useSWR(
    [this.getGOrganizadorURL(params), token.getToken()], () => this.getGOrganizador(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  //POST Organizador Grupo Comercializador
  readonly postComercializadorGOrganizadoresURL = this.getURL({ path: "/api/SRTComercializadoresGOrganizadores" }).toString();

  postComercializadorGOrganizadores = async (data: ComercializadorGOrganizadoresPostRequest) =>
    tokenizable.post<ComercializadorPostResponse>(this.postComercializadorGOrganizadoresURL, data).then(({ data }) => data);
  swrPostComercializadorGOrganizadores: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: ComercializadorGOrganizadoresPostRequest }) => Promise<ComercializadorPostResponse>;
  } = Object.freeze({
    key: [this.postComercializadorGOrganizadoresURL, token.getToken()],
    fetcher: (_key, { arg }) => this.postComercializadorGOrganizadores(arg),
  });

  usePostComercializadorGOrganizadores = () =>
    useSWRMutation<ComercializadorPostResponse, Error, [url: string, token: string], ComercializadorGOrganizadoresPostRequest>(
      this.swrPostComercializadorGOrganizadores.key,
      this.swrPostComercializadorGOrganizadores.fetcher
    );
  //#endregion


  //#region Grupo Organizador Comercializador PUT
  readonly putComercializadorGOrganizadoresBaseURL = this.getURL({ path: "/api/SRTComercializadoresGOrganizadores" }).toString();

  readonly putComercializadorGOrganizadoresURL = (id: number | string) =>
    this.getURL({ path: `/api/SRTComercializadoresGOrganizadores/${id}` }).toString();

  putComercializadorGOrganizadores = async (id: number | string, data: ComercializadorGOrganizadoresPutRequest) =>
    tokenizable.put<ComercializadorPutResponse>(this.putComercializadorGOrganizadoresURL(id), data).then(({ data }) => data);
  swrPutComercializadorGOrganizadores: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: { id: number | string; data: ComercializadorGOrganizadoresPutRequest } }) => Promise<ComercializadorPutResponse>;
  } = Object.freeze({
    key: [this.putComercializadorGOrganizadoresBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.putComercializadorGOrganizadores(arg.id, arg.data),
  });

  usePutComercializadorGOrganizadores = () =>
    useSWRMutation<ComercializadorPutResponse, Error, [url: string, token: string], { id: number | string; data: ComercializadorGOrganizadoresPutRequest }>(
      this.swrPutComercializadorGOrganizadores.key,
      this.swrPutComercializadorGOrganizadores.fetcher
    );
  //#endregion

  //#region Comercializador Grupo organizadores DELETE
  readonly deleteComercializadoresGOrganizadoresBaseURL = this.getURL({ path: "/api/SRTComercializadoresGOrganizadores" }).toString();

  readonly deleteComercializadoresGOrganizadoresURL = (id: number | string) =>
    this.getURL({ path: `/api/SRTComercializadoresGOrganizadores/${id}` }).toString();

  deleteComercializadoresGOrganizadores = async (id: number | string) =>
    tokenizable.delete<ComercializadorDeleteResponse>(this.deleteComercializadoresGOrganizadoresURL(id)).then(({ data }) => data);

  swrDeleteComercializadoresGOrganizadores: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: ComercializadorDeleteParams }) => Promise<ComercializadorDeleteResponse>;
  } = Object.freeze({
    key: [this.deleteComercializadoresOrganizadoresBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.deleteComercializadoresOrganizadores(arg.id),
  });

  useDeleteComercializadoresGOrganizadores = () =>
    useSWRMutation<ComercializadorDeleteResponse, Error, [url: string, token: string], ComercializadorDeleteParams>(
      this.swrDeleteComercializadoresGOrganizadores.key,
      this.swrDeleteComercializadoresGOrganizadores.fetcher
    );
  //#endregion

  //#region Grupo Organizador por Id
  readonly getGOrganizadorByIdURL = (params: ComercializadorGOrganizadorById) => {
    return this.getURL({
      path: `/api/SRTComercializadoresGOrganizadores/${params.id}`,
    }).toString();
  };

  getGOrganizadorById = async (params: ComercializadorGOrganizadorById) =>
    tokenizable
      .get(this.getGOrganizadorByIdURL(params))
      .then(({ data }) => data);

  useGetGOrganizadorById = (params?: ComercializadorGOrganizadorById) =>
    useSWR(
      params && params.id && token.getToken()
        ? [this.getGOrganizadorByIdURL(params), token.getToken()]
        : null,
      () => this.getGOrganizadorById(params as ComercializadorGOrganizadorById),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion



    //#Region  GET SRTComercializadoresAsociados
  readonly getComercializadoresAsociadosURL = (params: ParametersComercializadoresAsociados = {}) => {
    return this.getURL({ path: "/api/SRTComercializadoresAsociados", search: toURLSearch(params) }).toString();
  };
  getComercializadoresAsociados = async (params: ParametersComercializadoresAsociados = {}) => tokenizable.get(
    this.getComercializadoresAsociadosURL(params),
  ).then(({ data }) => data);
  useGetComercializadoresAsociadosURL = (params: ParametersComercializadoresAsociados = {}) => useSWR(
    [this.getComercializadoresAsociadosURL(params), token.getToken()], () => this.getComercializadoresAsociados(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // # End Region SRTComercializadoresAsociados



   //#Region  POST SRTComercializadoresAsociados
  readonly postSRTComercializadoresAsociadosGOrganizadoresURL = this.getURL({ path: "/api/SRTComercializadoresAsociados" }).toString();

  postSRTComercializadoresAsociados = async (data: SRTComercializadoresAsociadosPostRequest) =>
    tokenizable.post<SRTComercializadoresAsociadosPostResponse>(this.postSRTComercializadoresAsociadosGOrganizadoresURL, data).then(({ data }) => data);
  swrPostSRTComercializadoresAsociados: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: SRTComercializadoresAsociadosPostRequest }) => Promise<SRTComercializadoresAsociadosPostResponse>;
  } = Object.freeze({
    key: [this.postSRTComercializadoresAsociadosGOrganizadoresURL, token.getToken()],
    fetcher: (_key, { arg }) => this.postSRTComercializadoresAsociados(arg),
  });

  usePostSRTComercializadoresAsociados = () =>
    useSWRMutation<SRTComercializadoresAsociadosPostResponse, Error, [url: string, token: string], SRTComercializadoresAsociadosPostRequest>(
      this.swrPostSRTComercializadoresAsociados.key,
      this.swrPostSRTComercializadoresAsociados.fetcher
    );
  //#endregion


    //#region Grupo Organizador Comercializador PUT Baja
  readonly putSRTComercializadoresAsociadosBajaBaseURL = this.getURL({ path: "/api/SRTComercializadoresAsociados" }).toString();

  readonly putSRTComercializadoresAsociadosBajaBasURL = (id: number | string) =>
    this.getURL({ path: `/api/SRTComercializadoresAsociados/${id}/Baja` }).toString();

  putSRTComercializadoresAsociadosBajaBas = async (id: number | string, data: SRTComercializadoresAsociadosPutRequest) =>
    tokenizable.put<ComercializadorPutResponse>(this.putSRTComercializadoresAsociadosBajaBasURL(id), data).then(({ data }) => data);
  swrPutSRTComercializadoresAsociadosBajaBas: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: { id: number | string; data: SRTComercializadoresAsociadosPutRequest } }) => Promise<ComercializadorPutResponse>;
  } = Object.freeze({
    key: [this.putSRTComercializadoresAsociadosBajaBaseURL, token.getToken()],
    fetcher: (_key, { arg }) => this.putSRTComercializadoresAsociadosBajaBas(arg.id, arg.data),
  });

  usePutSRTComercializadoresAsociadosBajaBas = () =>
    useSWRMutation<ComercializadorPutResponse, Error, [url: string, token: string], { id: number | string; data: SRTComercializadoresAsociadosPutRequest }>(
      this.swrPutSRTComercializadoresAsociadosBajaBas.key,
      this.swrPutSRTComercializadoresAsociadosBajaBas.fetcher
    );
  //#endregion

  //#region SRTComercializadoresAsociados PUT
  readonly putSRTComercializadoresAsociadosEditURL = (id: number | string) =>
    this.getURL({ path: `/api/SRTComercializadoresAsociados/${id}` }).toString();

  putSRTComercializadoresAsociadosEdit = async (id: number | string, data: SRTComercializadoresAsociadosPutRequest) =>
    tokenizable.put<ComercializadorPutResponse>(this.putSRTComercializadoresAsociadosEditURL(id), data).then(({ data }) => data);

  swrPutSRTComercializadoresAsociadosEdit: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: { id: number | string; data: SRTComercializadoresAsociadosPutRequest } }) => Promise<ComercializadorPutResponse>;
  } = Object.freeze({
    key: [this.putSRTComercializadoresAsociadosBajaBaseURL + "#edit", token.getToken()],
    fetcher: (_key, { arg }) => this.putSRTComercializadoresAsociadosEdit(arg.id, arg.data),
  });

  usePutSRTComercializadoresAsociadosEdit = () =>
    useSWRMutation<ComercializadorPutResponse, Error, [url: string, token: string], { id: number | string; data: SRTComercializadoresAsociadosPutRequest }>(
      this.swrPutSRTComercializadoresAsociadosEdit.key,
      this.swrPutSRTComercializadoresAsociadosEdit.fetcher
    );
  //#endregion


  // # Region Empleador Pago Comercializador
  readonly getEmpleadorPagoComercializadorURL = (params: ParametersEmpleadorPagosComercializador = {}) => {
    return this.getURL({ path: "/api/EmpleadorPagosComercializador", search: toURLSearch(params) }).toString();
  };
  getEmpleadorPagoComercializador = async (params: ParametersEmpleadorPagosComercializador = {}) => tokenizable.get(
    this.getEmpleadorPagoComercializadorURL(params),
  ).then(({ data }) => data);
  useGetEmpleadorPagoComercializadorURL = (params: ParametersEmpleadorPagosComercializador = {}) => useSWR(
    [this.getEmpleadorPagoComercializadorURL(params), token.getToken()], () => this.getEmpleadorPagoComercializador(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  // # End Region Empleador Pago Comercializador

  // # Region afipTransferencia
  readonly getAfipTransferenciaURL = (params: ParametersAfipTranferencia = {}) => {
    return this.getURL({ path: "/api/AfipTransferencias", search: toURLSearch(params) }).toString();
  };
  getAfipTransferencia = async (params: ParametersAfipTranferencia = {}) => tokenizable.get(
    this.getAfipTransferenciaURL(params),
  ).then(({ data }) => data);
  useGetAfipTransferenciaURL = (params: ParametersAfipTranferencia = {}) => useSWR(
    [this.getAfipTransferenciaURL(params), token.getToken()], () => this.getAfipTransferencia(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  // # End Region afipTransferencia


  //#region ARCA GET
  readonly getARCAURL = (params: ARCAparams = {}) => {
    return this.getURL({
      path: "/api/Arca/ConsultaPadron",
      search: toURLSearch(params),
    }).toString();
  };
  getARCA = async (params: ARCAparams = {}) =>
    tokenizable.get<ARCAApiResponse>(this.getARCAURL(params)).then(({ data }) => data);
  useGetARCA = (params: ARCAparams = {}) =>
    useSWR(
      [this.getARCAURL(params), token.getToken()],
      () => this.getARCA(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion



  //POST certificado de cobertura
  readonly postCoberturaURL = this.getURL({ path: "/api/CertificadosCoberturaLog" }).toString();
  postCobertura = async (data: CoberturaPost) =>
    tokenizable.post<CoberturaPostResponse>(this.postCoberturaURL, data).then(({ data }) => data);
  swrPostCobertura: {
    key: [url: string, token: string];
    fetcher: (key: [url: string, token: string], options: { arg: CoberturaPost }) => Promise<CoberturaPostResponse>;
  } = Object.freeze({
    key: [this.postCoberturaURL, token.getToken()],
    fetcher: (_key, { arg }) => this.postCobertura(arg),
  });
  usePostCobertura = () =>
    useSWRMutation<CoberturaPostResponse, Error, [url: string, token: string], CoberturaPost>(
      this.swrPostCobertura.key,
      this.swrPostCobertura.fetcher
    );
  //#endregion

  //GET cobertura
  readonly getCoberturaURL = (params: ParametersCobertura = {}) => {
    return this.getURL({ path: "/api/CertificadosCoberturaLog", search: toURLSearch(params) }).toString();
  };
  getCobertura = async (params: ParametersCobertura = {}) => tokenizable.get(
    this.getCoberturaURL(params),
  ).then(({ data }) => data);
  useGetCoberturaURL = (params: ParametersCobertura = {}) => useSWR(
    [this.getCoberturaURL(params), token.getToken()], () => this.getCobertura(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );




  //#region SVCC
  //#region SVCC/Presentaciones
  //#region SVCC/Presentaciones/Todas
  readonly svccPresentacionTodasURL = (params?: SVCCPresentacionTodasParams) =>
    this.getURL({ path: "/api/SVCC/Presentaciones", search: svccPresentacionTodasSearchParams(params) }).toString();
  svccPresentacionTodas = async (params?: SVCCPresentacionTodasParams) =>
    tokenizable
      .get<unknown>(this.svccPresentacionTodasURL(params))
      .then(({ data }) => normalizeSvccPresentacionTodasResponse(data));
  swrSVCCPresentacionTodas: {
    key: (params?: SVCCPresentacionTodasParams) => SVCCPresentacionTodasSWRKey,
    fetcher: (key: SVCCPresentacionTodasSWRKey) => Promise<Pagination<PresentacionDTO>>
  } = Object.freeze({
    key: (params) => [this.svccPresentacionTodasURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccPresentacionTodas(JSON.parse(params)),
  });
  useSVCCPresentacionTodas = (params?: SVCCPresentacionTodasParams, options?: SVCCPresentacionTodasOptions) =>
    useSWR<Pagination<PresentacionDTO>, AxiosError>(params ? this.swrSVCCPresentacionTodas.key(params) : null, this.swrSVCCPresentacionTodas.fetcher, options);
  //#endregion SVCC/Presentaciones/Todas

  //#region SVCC/Presentaciones/Obtener
  readonly svccPresentacionObtenerURL = ({ id }: SVCCPresentacionObtenerParams) => this.getURL({ path: `/api/SVCC/Presentaciones/${id}` }).toString();
  svccPresentacionObtener = async (params: SVCCPresentacionObtenerParams) => tokenizable.get<PresentacionDTO>(
    this.svccPresentacionObtenerURL(params)
  ).then(({ data }) => data);
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
  readonly svccPresentacionUltimaURL = () =>
    this.getURL({ path: "/api/SVCC/Presentaciones/Ultima" }).toString();
  svccPresentacionUltima = async (params: SVCCPresentacionUltimaParams) => {
    const body: SVCCPresentacionUltimaParams = {
      ...params,
      PageIndex: params.PageIndex ?? 1,
      PageSize: params.PageSize ?? 10,
    };
    return tokenizable
      .post<unknown>(this.svccPresentacionUltimaURL(), body)
      .then(({ data }) => normalizeSvccPresentacionUltimaResponse(data));
  };
  swrSVCCPresentacionUltima: {
    key: (params: SVCCPresentacionUltimaParams) => SVCCPresentacionUltimaSWRKey,
    fetcher: (key: SVCCPresentacionUltimaSWRKey) => Promise<Pagination<PresentacionDTO>>
  } = Object.freeze({
    key: (params) => [this.svccPresentacionUltimaURL(), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccPresentacionUltima(JSON.parse(params)),
  });
  useSVCCPresentacionUltima = (params?: SVCCPresentacionUltimaParams, options?: SVCCPresentacionUltimaOptions) =>
    useSWR<Pagination<PresentacionDTO>, AxiosError>(params ? this.swrSVCCPresentacionUltima.key(params) : null, this.swrSVCCPresentacionUltima.fetcher, options);
  //#endregion SVCC/Presentaciones/Ultima

  //#region SVCC/Presentaciones/Nueva
  readonly svccPresentacionNuevaURL = this.getURL({ path: "/api/SVCC/Presentaciones/Nueva" }).toString();
  svccPresentacionNueva = async (presentacion: PresentacionCreateDTO) => tokenizable.post<PresentacionDTO>(
    this.svccPresentacionNuevaURL, presentacion
  ).then(({ data }) => data);
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
  readonly svccPresentacionFinalizaURL = this.getURL({ path: "/api/SVCC/Presentaciones/Finaliza" }).toString();
  svccPresentacionFinaliza = async (presentacion: PresentacionFinalizaDTO) => tokenizable.put<PresentacionDTO>(
    this.svccPresentacionFinalizaURL, presentacion
  ).then(({ data }) => data);
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
  readonly svccPresentacionConstanciaURL = ({ id }: SVCCPresentacionConstanciaParams) => this.getURL({ path: `/api/SVCC/Presentaciones/${id}/Constancia` }).toString();
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
    this.getURL({ path: "/api/SVCC/EmpresasTercerizadas", search: toURLSearch(params) }).toString();
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
  readonly svccEmpresaTercerizadaCreateURL = this.getURL({ path: "/api/SVCC/EmpresasTercerizadas" }).toString();
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
  readonly svccEmpresaTercerizadaUpdateURL = ({ id }: SVCCEmpresaTercerizadaUpdateParams) => this.getURL({ path: `/api/SVCC/EmpresasTercerizadas/${id}` }).toString();
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
  readonly svccEmpresaTercerizadaDeleteURL = ({ id }: SVCCEmpresaTercerizadaDeleteParams) => this.getURL({ path: `/api/SVCC/EmpresasTercerizadas/${id}` }).toString();
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
    this.getURL({ path: "/api/SVCC/EstablecimientosDeclarados", search: toURLSearch(params) }).toString();
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
  readonly svccEstablecimientoDeclaradoCreateURL = this.getURL({ path: "/api/SVCC/EstablecimientosDeclarados" }).toString();
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
  readonly svccEstablecimientoDeclaradoUpdateURL = ({ id }: SVCCEstablecimientoDeclaradoUpdateParams) => this.getURL({ path: `/api/SVCC/EstablecimientosDeclarados/${id}` }).toString();
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
  readonly svccEstablecimientoDeclaradoDeleteURL = ({ id }: SVCCEstablecimientoDeclaradoDeleteParams) => this.getURL({ path: `/api/SVCC/EstablecimientosDeclarados/${id}` }).toString();
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
    this.getURL({ path: "/api/SVCC/Sustancias", search: toURLSearch(params) }).toString();
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
  readonly svccSustanciaCreateURL = this.getURL({ path: "/api/SVCC/Sustancias" }).toString();
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
  readonly svccSustanciaReadURL = ({ id }: SVCCSustanciaReadParams) => this.getURL({ path: `/api/SVCC/Sustancias/${id}` }).toString();
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
  readonly svccSustanciaUpdateURL = ({ id }: SVCCSustanciaUpdateParams) => this.getURL({ path: `/api/SVCC/Sustancias/${id}` }).toString();
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
  readonly svccSustanciaDeleteURL = ({ id }: SVCCSustanciaDeleteParams) => this.getURL({ path: `/api/SVCC/Sustancias/${id}` }).toString();
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
    this.getURL({ path: "/api/SVCC/Trabajadores", search: toURLSearch(params) }).toString();
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
  readonly svccTrabajadorCreateURL = this.getURL({ path: "/api/SVCC/Trabajadores" }).toString();
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
  readonly svccTrabajadorReadURL = ({ id }: SVCCTrabajadorReadParams) => this.getURL({ path: `/api/SVCC/Trabajadores/${id}` }).toString();
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
  readonly svccTrabajadorUpdateURL = ({ id }: SVCCTrabajadorUpdateParams) => this.getURL({ path: `/api/SVCC/Trabajadores/${id}` }).toString();
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
  readonly svccTrabajadorDeleteURL = ({ id }: SVCCTrabajadorDeleteParams) => this.getURL({ path: `/api/SVCC/Trabajadores/${id}` }).toString();
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



const ArtAPI = Object.seal(new ArtAPIClass()) as ArtAPIClass;

export default ArtAPI;

