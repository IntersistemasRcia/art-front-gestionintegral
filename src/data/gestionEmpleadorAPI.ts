import useSWR, { Fetcher, SWRConfiguration } from "swr";
import useSWRMutation, { SWRMutationConfiguration } from "swr/mutation";
import { ExternalAPI } from "./api";
import { token } from "./usuarioAPI";
import Persona, { Parameters } from "@/app/inicio/empleador/cobertura/types/persona";
import dayjs from "dayjs";
import { toURLSearch } from "@/utils/utils";
import { useAuth } from '@/data/AuthContext';
import { AxiosError } from "axios";

const tokenizable = token.configure();

const getCurrentPeriodo = (): number => {
  return Number(dayjs().subtract(2, 'month').format('YYYYMM'));
};

export interface UsuarioGetAllParams {
  CUIT?: number;
  Sort?: string;
  Page?: string;
}

export type Pagination<T> = {
  index: number;
  size: number;
  pages: number;
  count: number;
  data: T[];
}

//#region Types SVCC
//#region Types common
export type PresentacionBaseDTO = {
  observaciones?: string,
}
export type PresentacionCreateDTO = PresentacionBaseDTO & {
  empleadorCUIT: number;
  idMotivo?: number,
}
export type PresentacionFinalizaDTO = PresentacionBaseDTO & {
  interno: number,
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
//#endregion Types common

//#region Types SVCC/Presentacion
//#region Types SVCC/Presentacion/Todas
export type SVCCPresentacionTodasParams = {
  empleadorCUIT: number;
  page?: string;
  sort?: string;
}
export type SVCCPresentacionTodasSWRKey = [url: string, token: string, params: string];
export type SVCCPresentacionTodasOptions = SWRConfiguration<Pagination<PresentacionDTO>, AxiosError, Fetcher<Pagination<PresentacionDTO>, SVCCPresentacionTodasSWRKey>>
//#endregion Types SVCC/Presentacion/Todas

//#region Types SVCC/Presentacion/Obtener
export type SVCCPresentacionObtenerParams = {
  id: number;
}
export type SVCCPresentacionObtenerSWRKey = [url: string, token: string, params: string];
export type SVCCPresentacionObtenerOptions = SWRConfiguration<PresentacionDTO, AxiosError, Fetcher<PresentacionDTO, SVCCPresentacionObtenerSWRKey>>
//#endregion Types SVCC/Presentacion/Obtener

//#region Types SVCC/Presentacion/Ultima
export type SVCCPresentacionUltimaParams = {
  empleadorCUIT: number;
}
export type SVCCPresentacionUltimaSWRKey = [url: string, token: string, params: string];
export type SVCCPresentacionUltimaOptions = SWRConfiguration<PresentacionDTO, AxiosError, Fetcher<PresentacionDTO, SVCCPresentacionUltimaSWRKey>>
//#endregion Types SVCC/Presentacion/Ultima

//#region Types SVCC/Presentacion/Nueva
export type SVCCPresentacionNuevaSWRKey = [url: string, token: string];
export type SVCCPresentacionNuevaOptions = SWRMutationConfiguration<PresentacionDTO, AxiosError, SVCCPresentacionNuevaSWRKey, PresentacionCreateDTO, PresentacionDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/Presentacion/Nueva

//#region Types SVCC/Presentacion/Finaliza
export type SVCCPresentacionFinalizaSWRKey = [url: string, token: string];
export type SVCCPresentacionFinalizaOptions = SWRMutationConfiguration<PresentacionDTO, AxiosError, SVCCPresentacionNuevaSWRKey, PresentacionFinalizaDTO, PresentacionDTO> & {
  throwOnError?: boolean;
}
//#endregion Types SVCC/Presentacion/Finaliza

//#region Types SVCC/Presentacion/Constancia
export type SVCCPresentacionConstanciaParams = {
  id: number;
}
export type SVCCPresentacionConstanciaSWRKey = [url: string, token: string, params: string];
export type SVCCPresentacionConstanciaOptions = SWRConfiguration<File, AxiosError, Fetcher<File, SVCCPresentacionConstanciaSWRKey>>
//#endregion Types SVCC/Presentacion/Constancia
//#endregion Types SVCC/Presentacion

//#region Types SVCC/EmpresaTercerizada
//#region Types SVCC/EmpresaTercerizada - List
export type SVCCEmpresaTercerizadaListParams = {
  presentacionId: number;
  ciiu?: number;
  cantidadTrabajadores?: number;
  page?: string;
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
//#endregion Types SVCC/EmpresaTercerizada

//#region Types SVCC/EstablecimientoDeclarado
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
  page?: string;
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
//#endregion Types SVCC/EstablecimientoDeclarado

//#region Types SVCC/Sustancia
//#region Types SVCC/Sustancia - List
export type SVCCSustanciaListParams = {
  presentacionId: number;
  idEstablecimientoEmpresa?: number;
  idSustancia?: number;
  nombreComercial?: string;
  cantidadAnual?: number;
  idUnidadDeMedida?: number;
  page?: string;
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
//#endregion Types SVCC/Sustancia

//#region Types SVCC/Trabajador
//#region Types SVCC/Trabajador - List
export type SVCCTrabajadorListParams = {
  presentacionId: number;
  cuil?: number;
  idEstablecimientoEmpresa?: number;
  page?: string;
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
//#endregion Types SVCC/Trabajador
//#endregion Types SVCC

//#region Types SRTSiniestralidadCIUO88
export type SRTSiniestralidadCIUO88 = {
  id: number;
  ciuO88: number;
  descripcion?: string;
}

//#region Types SRTSiniestralidadCIUO88 - List
export type SRTSiniestralidadCIUO88ListSWRKey = [url: string, token: string];
export type SRTSiniestralidadCIUO88ListOptions = SWRConfiguration<SRTSiniestralidadCIUO88[], AxiosError, Fetcher<SRTSiniestralidadCIUO88[], SRTSiniestralidadCIUO88ListSWRKey>>
//#endregion Types SRTSiniestralidadCIUO88 - List

//#region Types SRTSiniestralidadCIUO88 - Read
export type SRTSiniestralidadCIUO88ReadParams = {
  pId: number;
}
export type SRTSiniestralidadCIUO88ReadSWRKey = [url: string, token: string, params: string];
export type SRTSiniestralidadCIUO88ReadOptions = SWRConfiguration<SRTSiniestralidadCIUO88, AxiosError, Fetcher<SRTSiniestralidadCIUO88, SVCCTrabajadorReadSWRKey>>
//#endregion Types SRTSiniestralidadCIUO88 - Read
//#endregion Types SRTSiniestralidadCIUO88

//#region Types RefCIIU
export type RefCIIU = {
  id: number;
  ciiuRev4?: number;
  descripcionRev4?: string;
  descripcionEquivalencia4?: string;
  ciiuRev2?: number;
  descripcionRev2?: string;
  codigo?: number;
  nivel1Fija?: number;
  nivel1Variable?: number;
  nivel2Fija?: number;
  nivel2Variable?: number;
  nivel3Fija?: number;
  nivel3Variable?: number;
  nivel4Fija?: number;
  nivel4Variable?: number;
}

//#region Types RefCIIU - List
export type RefCIIUListSWRKey = [url: string, token: string];
export type RefCIIUListOptions = SWRConfiguration<RefCIIU[], AxiosError, Fetcher<RefCIIU[], RefCIIUListSWRKey>>
//#endregion Types RefCIIU - List

//#region Types RefCIIU - Read
export type RefCIIUReadParams = {
  pId: number;
}
export type RefCIIUReadSWRKey = [url: string, token: string, params: string];
export type RefCIIUReadOptions = SWRConfiguration<RefCIIU, AxiosError, Fetcher<RefCIIU, SVCCTrabajadorReadSWRKey>>
//#endregion Types RefCIIU - Read
//#endregion Types RefCIIU

export class GestionEmpleadorAPIClass extends ExternalAPI {

  readonly basePath = process.env.NEXT_PUBLIC_API_EMPLEADOR_URL || 'http://fallback-prod.url';

  //#region AfiliadoCuentaCorriente
  readonly getPersonalURL = (params: Parameters = {}) => {

    params.CUIT ??= useAuth().user?.empresaCUIT ?? 0;
    params.periodo ??= getCurrentPeriodo();
    params.page ??= "1,1";
    return this.getURL({ path: "/api/AfiliadoCuentaCorriente/", search: toURLSearch(params) }).toString();
  };
  getPersonal = async (params: Parameters = {}) => tokenizable.get<Persona[]>(
    this.getPersonalURL(params),
  ).then(({ data }) => data);

  useGetPersonal = (params: Parameters = {}) => useSWR(
    [this.getPersonalURL(params), token.getToken()], () => this.getPersonal(params),
    {
      revalidateOnFocus: false,// No volver a revalidar al volver al foco, reconectar o al montar si ya hay cache
      revalidateOnReconnect: false,
      //revalidateOnMount: false,
      //dedupingInterval: // Tiempo en ms durante el cual SWR deduplica solicitudes iguales (evita re-fetch frecuente) 1000 * 60 * 60, // 1 hora (ajusta si hace falta)
      // Si quieres que la clave no dispare fetch hasta que exista token, puedes usar: (token.getToken() ? key : null)
    }
  );
  //#endregion

  //#region Persona
  readonly getPolizaURL = (params: Parameters = {}) => {
    return this.getURL({ path: "/api/SRTPoliza", search: toURLSearch(params) }).toString();
  };
  getPoliza = async (params: Parameters = {}) => tokenizable.get(
    this.getPolizaURL(params),
  ).then(({ data }) => data[0]);
  useGetPoliza = (params: Parameters = {}) => useSWR(
    [this.getPolizaURL(params), token.getToken()], () => this.getPoliza(params),
    {
      revalidateOnFocus: false,// No volver a revalidar al volver al foco, reconectar o al montar si ya hay cache
      revalidateOnReconnect: false,
      //revalidateOnMount: false,
      //dedupingInterval: // Tiempo en ms durante el cual SWR deduplica solicitudes iguales (evita re-fetch frecuente) 1000 * 60 * 60, // 1 hora (ajusta si hace falta)
      // Si quieres que la clave no dispare fetch hasta que exista token, puedes usar: (token.getToken() ? key : null)
    }
  );
  //#endregion

  //#region SiniestrosEmpleador
  readonly getVEmpleadorSiniestrosURL = (params: Parameters = {}) => {
    return this.getURL({ path: "/api/VEmpleadorSiniestros", search: toURLSearch(params) }).toString();
  };
  getVEmpleadorSiniestros = async (params: Parameters = {}) => tokenizable.get(
    this.getVEmpleadorSiniestrosURL(params),
  ).then(({ data }) => data);
  useGetVEmpleadorSiniestros = (params: Parameters = {}) => {
    // Solo hacer fetch si hay CUIT en los parámetros
    const hasCUIT = params?.CUIT != null && params.CUIT !== 0;
    const swrKey = hasCUIT ? [this.getVEmpleadorSiniestrosURL(params), token.getToken()] : null;
    return useSWR(
      swrKey,
      () => this.getVEmpleadorSiniestros(params),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  };
  //#endregion

  //#region CtaCTe y DDJJ
  readonly getVEmpleadorDDJJURL = (params: Parameters = {}) => {
    params.CUIT ??= useAuth().user?.empresaCUIT ?? 0;
    return this.getURL({ path: "/api/VEmpleadorDDJJ/?Sort=-Periodo&Page=0,1000", search: toURLSearch(params) }).toString();
  };
  getVEmpleadorDDJJ = async (params: Parameters = {}) => tokenizable.get(
    this.getVEmpleadorDDJJURL(params),
  ).then(({ data }) => data);
  useGetVEmpleadorDDJJ = (params: Parameters = {}) => useSWR(
    [this.getVEmpleadorDDJJURL(params), token.getToken()], () => this.getVEmpleadorDDJJ(params),
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

  //#region SiniestrosEmpleador
  readonly getVEmpleadorSiniestrosInstanciasURL = (params: Parameters = {}) => {
    params.CUIT ??= useAuth().user?.empresaCUIT ?? 0;
    return this.getURL({ path: "/api/VEmpleadorSiniestrosInstancias", search: toURLSearch(params) }).toString();
  };
  getVEmpleadorSiniestrosInstancias = async (params: Parameters = {}) => tokenizable.get(
    this.getVEmpleadorSiniestrosInstanciasURL(params),
  ).then(({ data }) => data);
  useGetVEmpleadorSiniestrosInstancias = (params: Parameters = {}) => {
    // Solo hacer fetch si hay CUIT en los parámetros
    const hasCUIT = params?.CUIT != null && params.CUIT !== 0;
    const swrKey = hasCUIT ? [this.getVEmpleadorSiniestrosInstanciasURL(params), token.getToken()] : null;
    return useSWR(
      swrKey,
      () => this.getVEmpleadorSiniestrosInstancias(params),
      {
        // No volver a revalidar al volver al foco, reconectar o al montar si ya hay cache
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  };
  //#endregion

  //#region AvisoObra
  readonly getAvisoObraURL = (params: UsuarioGetAllParams = {}) => {
    return this.getURL({ path: "/api/AvisoObra/ultimos/?Sort=-ObraNumero&Page=0,1000", search: toURLSearch(params) }).toString();
  };
  getAvisoObra = async (params: UsuarioGetAllParams = {}) => tokenizable.get(
    this.getAvisoObraURL(params),
  ).then(({ data }) => data);
  useGetAvisoObra = (params: UsuarioGetAllParams = {}) => {
    // Solo hacer fetch si hay CUIT en los parámetros
    const hasCUIT = params?.CUIT != null && params.CUIT !== 0;
    const swrKey = hasCUIT ? [this.getAvisoObraURL(params), token.getToken()] : null;
    return useSWR(
      swrKey,
      () => this.getAvisoObra(params),
      {
        // No volver a revalidar al volver al foco, reconectar o al montar si ya hay cache
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  };

  // Métodos de mutación para AvisoObra
  readonly avisoObraInsertURL = this.getURL({ path: "/api/AvisoObra" }).toString();
  avisoObraInsert = async (data: any) => tokenizable.post(
    this.avisoObraInsertURL,
    data
  ).then(({ data }) => data);

  readonly avisoObraUpdateURL = (interno: number) => this.getURL({ path: `/api/AvisoObra/${interno}` }).toString();
  avisoObraUpdate = async (interno: number, data: any) => tokenizable.put(
    this.avisoObraUpdateURL(interno),
    data
  ).then(({ data }) => data);

  readonly avisoObraDeleteURL = (interno: number) => this.getURL({ path: `/api/AvisoObra/${interno}` }).toString();
  avisoObraDelete = async (interno: number) => tokenizable.delete(
    this.avisoObraDeleteURL(interno)
  ).then(({ data }) => data);
  //#endregion

  //#region SVCC
  //#region SVCC/Presentacion
  //#region SVCC/Presentacion/Todas
  readonly svccPresentacionTodasURL = (params?: SVCCPresentacionTodasParams) =>
    this.getURL({ path: "/api/SVCC/Presentacion", search: toURLSearch(params) }).toString();
  svccPresentacionTodas = async (params?: SVCCPresentacionTodasParams) => tokenizable.get<Pagination<PresentacionDTO>>(
    this.svccPresentacionTodasURL(params)
  ).then(({ data }) => data);
  swrSVCCPresentacionTodas: {
    key: (params?: SVCCPresentacionTodasParams) => SVCCPresentacionTodasSWRKey,
    fetcher: (key: SVCCPresentacionTodasSWRKey) => Promise<Pagination<PresentacionDTO>>
  } = Object.freeze({
    key: (params) => [this.svccPresentacionTodasURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccPresentacionTodas(JSON.parse(params)),
  });
  useSVCCPresentacionTodas = (params?: SVCCPresentacionTodasParams, options?: SVCCPresentacionTodasOptions) =>
    useSWR<Pagination<PresentacionDTO>, AxiosError>(params ? this.swrSVCCPresentacionTodas.key(params) : null, this.swrSVCCPresentacionTodas.fetcher, options);
  //#endregion SVCC/Presentacion/Todas

  //#region SVCC/Presentacion/Obtener
  readonly svccPresentacionObtenerURL = ({ id }: SVCCPresentacionObtenerParams) => this.getURL({ path: `/api/SVCC/Presentacion/${id}` }).toString();
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
  //#endregion SVCC/Presentacion/Obtener

  //#region SVCC/Presentacion/Ultima
  readonly svccPresentacionUltimaURL = (params: SVCCPresentacionUltimaParams) =>
    this.getURL({ path: "/api/SVCC/Presentacion/Ultima", search: toURLSearch(params) }).toString();
  svccPresentacionUltima = async (params: SVCCPresentacionUltimaParams) => tokenizable.get<PresentacionDTO>(
    this.svccPresentacionUltimaURL(params)
  ).then(({ data }) => data);
  swrSVCCPresentacionUltima: {
    key: (params: SVCCPresentacionUltimaParams) => SVCCPresentacionUltimaSWRKey,
    fetcher: (key: SVCCPresentacionUltimaSWRKey) => Promise<PresentacionDTO>
  } = Object.freeze({
    key: (params) => [this.svccPresentacionUltimaURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.svccPresentacionUltima(JSON.parse(params)),
  });
  useSVCCPresentacionUltima = (params?: SVCCPresentacionUltimaParams, options?: SVCCPresentacionUltimaOptions) =>
    useSWR<PresentacionDTO, AxiosError>(params ? this.swrSVCCPresentacionUltima.key(params) : null, this.swrSVCCPresentacionUltima.fetcher, options);
  //#endregion SVCC/Presentacion/Ultima

  //#region SVCC/Presentacion/Nueva
  readonly svccPresentacionNuevaURL = this.getURL({ path: "/api/SVCC/Presentacion/Nueva" }).toString();
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
  //#endregion SVCC/Presentacion/Nueva

  //#region SVCC/Presentacion/Finaliza
  readonly svccPresentacionFinalizaURL = this.getURL({ path: "/api/SVCC/Presentacion/Finaliza" }).toString();
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
  //#endregion SVCC/Presentacion/Finaliza

  //#region SVCC/Presentacion/Constancia
  readonly svccPresentacionConstanciaURL = ({ id }: SVCCPresentacionConstanciaParams) => this.getURL({ path: `/api/SVCC/Presentacion/Constancia/${id}` }).toString();
  svccPresentacionConstancia = async (params: SVCCPresentacionConstanciaParams) => tokenizable.get<Blob>(
    this.svccPresentacionConstanciaURL(params),
    { responseType: "blob" }
  ).then(({ data, headers }) => {
    const header = headers['content-disposition'];
    const fname = header.split('filename=')[1].split('.')[0];
    const ext = header.split('.')[1].split(';')[0];
    const filename = [fname.replace(`"`, ``), ext.replace(`"`, ``)].filter(e => e).join(".") || "constancia.pdf";
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
  //#endregion SVCC/Presentacion/Constancia
  //#endregion SVCC/Presentacion

  //#region SVCC/EmpresaTercerizada
  //#region SVCC/EmpresaTercerizada - List
  readonly svccEmpresaTercerizadaListURL = (params?: SVCCEmpresaTercerizadaListParams) =>
    this.getURL({ path: "/api/SVCC/EmpresaTercerizada", search: toURLSearch(params) }).toString();
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
  readonly svccEmpresaTercerizadaCreateURL = this.getURL({ path: "/api/SVCC/EmpresaTercerizada" }).toString();
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
  readonly svccEmpresaTercerizadaUpdateURL = ({ id }: SVCCEmpresaTercerizadaUpdateParams) => this.getURL({ path: `/api/SVCC/EmpresaTercerizada/${id}` }).toString();
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
  readonly svccEmpresaTercerizadaDeleteURL = ({ id }: SVCCEmpresaTercerizadaDeleteParams) => this.getURL({ path: `/api/SVCC/EmpresaTercerizada/${id}` }).toString();
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
    this.getURL({ path: "/api/SVCC/EstablecimientoDeclarado", search: toURLSearch(params) }).toString();
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
  readonly svccEstablecimientoDeclaradoCreateURL = this.getURL({ path: "/api/SVCC/EstablecimientoDeclarado" }).toString();
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
  readonly svccEstablecimientoDeclaradoUpdateURL = ({ id }: SVCCEstablecimientoDeclaradoUpdateParams) => this.getURL({ path: `/api/SVCC/EstablecimientoDeclarado/${id}` }).toString();
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
  readonly svccEstablecimientoDeclaradoDeleteURL = ({ id }: SVCCEstablecimientoDeclaradoDeleteParams) => this.getURL({ path: `/api/SVCC/EstablecimientoDeclarado/${id}` }).toString();
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
    this.getURL({ path: "/api/SVCC/Sustancia", search: toURLSearch(params) }).toString();
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
  readonly svccSustanciaCreateURL = this.getURL({ path: "/api/SVCC/Sustancia" }).toString();
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
  readonly svccSustanciaReadURL = ({ id }: SVCCSustanciaReadParams) => this.getURL({ path: `/api/SVCC/Sustancia/${id}` }).toString();
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
  readonly svccSustanciaUpdateURL = ({ id }: SVCCSustanciaUpdateParams) => this.getURL({ path: `/api/SVCC/Sustancia/${id}` }).toString();
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
  readonly svccSustanciaDeleteURL = ({ id }: SVCCSustanciaDeleteParams) => this.getURL({ path: `/api/SVCC/Sustancia/${id}` }).toString();
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
    this.getURL({ path: "/api/SVCC/Trabajador", search: toURLSearch(params) }).toString();
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
  readonly svccTrabajadorCreateURL = this.getURL({ path: "/api/SVCC/Trabajador" }).toString();
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
  readonly svccTrabajadorReadURL = ({ id }: SVCCTrabajadorReadParams) => this.getURL({ path: `/api/SVCC/Trabajador/${id}` }).toString();
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
  readonly svccTrabajadorUpdateURL = ({ id }: SVCCTrabajadorUpdateParams) => this.getURL({ path: `/api/SVCC/Trabajador/${id}` }).toString();
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
  readonly svccTrabajadorDeleteURL = ({ id }: SVCCTrabajadorDeleteParams) => this.getURL({ path: `/api/SVCC/Trabajador/${id}` }).toString();
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

  //#region SRTSiniestralidadCIUO88
  //#region SRTSiniestralidadCIUO88 - List
  readonly srtSiniestralidadCIUO88ListURL = this.getURL({ path: "/api/SRTSiniestralidadCIUO88" }).toString();
  srtSiniestralidadCIUO88List = async () => tokenizable.get<SRTSiniestralidadCIUO88[]>(
    this.srtSiniestralidadCIUO88ListURL
  ).then(({ data }) => data);
  swrSRTSiniestralidadCIUO88List: {
    key: SRTSiniestralidadCIUO88ListSWRKey,
    fetcher: (key: SRTSiniestralidadCIUO88ListSWRKey) => Promise<SRTSiniestralidadCIUO88[]>
  } = Object.freeze({
    key: [this.srtSiniestralidadCIUO88ListURL, token.getToken()],
    fetcher: ([_url, _token]) => this.srtSiniestralidadCIUO88List(),
  });
  useSRTSiniestralidadCIUO88List = (options?: SRTSiniestralidadCIUO88ListOptions) =>
    useSWR<SRTSiniestralidadCIUO88[], AxiosError>(this.swrSRTSiniestralidadCIUO88List.key, this.swrSRTSiniestralidadCIUO88List.fetcher, options);
  //#endregion SRTSiniestralidadCIUO88 - List

  //#region SRTSiniestralidadCIUO88 - Read
  readonly srtSiniestralidadCIUO88ReadURL = ({ pId }: SRTSiniestralidadCIUO88ReadParams) => this.getURL({ path: `/api/SRTSiniestralidadCIUO88/${pId}` }).toString();
  srtSiniestralidadCIUO88Read = async (params: SRTSiniestralidadCIUO88ReadParams) => tokenizable.get<SRTSiniestralidadCIUO88>(
    this.srtSiniestralidadCIUO88ReadURL(params)
  ).then(({ data }) => data);
  swrSRTSiniestralidadCIUO88Read: {
    key: (params: SRTSiniestralidadCIUO88ReadParams) => SRTSiniestralidadCIUO88ReadSWRKey,
    fetcher: (key: SRTSiniestralidadCIUO88ReadSWRKey) => Promise<SRTSiniestralidadCIUO88>
  } = Object.freeze({
    key: (params) => [this.srtSiniestralidadCIUO88ReadURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.srtSiniestralidadCIUO88Read(JSON.parse(params)),
  });
  useSRTSiniestralidadCIUO88Read = (params?: SRTSiniestralidadCIUO88ReadParams, options?: SRTSiniestralidadCIUO88ReadOptions) =>
    useSWR<SRTSiniestralidadCIUO88, AxiosError>(params ? this.swrSRTSiniestralidadCIUO88Read.key(params) : null, this.swrSRTSiniestralidadCIUO88Read.fetcher, options);
  //#endregion SRTSiniestralidadCIUO88 - Read
  //#endregion SRTSiniestralidadCIUO88

  //#region RefCIIU
  //#region RefCIIU - List
  readonly refCIIUURL = this.getURL({ path: "/api/RefCIIU" }).toString();
  refCIIU = async () => tokenizable.get<RefCIIU[]>(
    this.refCIIUURL
  ).then(({ data }) => data);
  swrRefCIIUList: {
    key: RefCIIUListSWRKey,
    fetcher: (key: RefCIIUListSWRKey) => Promise<RefCIIU[]>
  } = Object.freeze({
    key: [this.refCIIUURL, token.getToken()],
    fetcher: ([_url, _token]) => this.refCIIU(),
  });
  useRefCIIUList = (options?: RefCIIUListOptions) =>
    useSWR<RefCIIU[], AxiosError>(this.swrRefCIIUList.key, this.swrRefCIIUList.fetcher, options);
  //#endregion RefCIIU - List

  //#region RefCIIU - Read
  readonly refCIIUReadURL = ({ pId }: RefCIIUReadParams) => this.getURL({ path: `/api/RefCIIU/${pId}` }).toString();
  refCIIUReadRead = async (params: RefCIIUReadParams) => tokenizable.get<RefCIIU>(
    this.refCIIUReadURL(params)
  ).then(({ data }) => data);
  swrRefCIIURead: {
    key: (params: RefCIIUReadParams) => RefCIIUReadSWRKey,
    fetcher: (key: RefCIIUReadSWRKey) => Promise<RefCIIU>
  } = Object.freeze({
    key: (params) => [this.refCIIUReadURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: ([_url, _token, params]) => this.refCIIUReadRead(JSON.parse(params)),
  });
  useRefCIIURead = (params?: RefCIIUReadParams, options?: RefCIIUReadOptions) =>
    useSWR<RefCIIU, AxiosError>(params ? this.swrRefCIIURead.key(params) : null, this.swrRefCIIURead.fetcher, options);
  //#endregion RefCIIU - Read
  //#endregion RefCIIU
}

const gestionEmpleadorAPI = Object.seal(new GestionEmpleadorAPIClass());

export default gestionEmpleadorAPI;
