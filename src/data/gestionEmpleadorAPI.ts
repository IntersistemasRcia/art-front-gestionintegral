import useSWR, { Fetcher, SWRConfiguration } from "swr";
import useSWRMutation, { SWRMutationConfiguration } from "swr/mutation";
import { ExternalAPI } from "./api";
import { token } from "./usuarioAPI";
import Persona, { Parameters } from "@/app/inicio/empleador/cobertura/types/persona";
import dayjs from "dayjs";
import { toURLSearch } from "@/utils/utils";
import { useAuth } from '@/data/AuthContext';
import { AxiosError } from "axios";
import type { SVCCTrabajadorReadSWRKey } from "./svccAPI";

const tokenizable = token.configure();

const getCurrentPeriodo = (): number => {
  return Number(dayjs().subtract(2, 'month').format('YYYYMM'));
};

/** Reexport de tipos SVCC definidos en svccAPI. */
export type {
  Pagination,
  PresentacionBaseDTO,
  PresentacionCreateDTO,
  PresentacionFinalizaDTO,
  PresentacionDTO,
  EmpresaTercerizadaBaseDTO,
  EmpresaTercerizadaCreateDTO,
  EmpresaTercerizadaDTO,
  PuestoDTO,
  SectorDTO,
  ResponsableDTO,
  ContratistaDTO,
  EstablecimientoDeclaradoBaseDTO,
  EstablecimientoDeclaradoCreateDTO,
  EstablecimientoDeclaradoDTO,
  UtilizacionDTO,
  MedidaPreventivaDTO,
  ElementoProteccionDTO,
  PuestoAfectadoDTO,
  DosimetriaDTO,
  ResponsableUsoDTO,
  ResponsableInstalacionDTO,
  EncargadoProteccionDTO,
  EquipoRadiologicoDTO,
  ProveedorDTO,
  CompradorDTO,
  EstudioAmbientalDTO,
  EstudioBiologicoDTO,
  SustanciaBaseDTO,
  SustanciaCreateDTO,
  SustanciaDTO,
  ExamenMedicoDTO,
  ActividadDTO,
  TrabajadorBaseDTO,
  TrabajadorCreateDTO,
  TrabajadorDTO,
  SVCCPresentacionTodasParams,
  SVCCPresentacionTodasSWRKey,
  SVCCPresentacionTodasOptions,
  SVCCPresentacionObtenerParams,
  SVCCPresentacionObtenerSWRKey,
  SVCCPresentacionObtenerOptions,
  SVCCPresentacionUltimaParams,
  SVCCPresentacionUltimaSWRKey,
  SVCCPresentacionUltimaOptions,
  SVCCPresentacionNuevaSWRKey,
  SVCCPresentacionNuevaOptions,
  SVCCPresentacionFinalizaSWRKey,
  SVCCPresentacionFinalizaOptions,
  SVCCPresentacionConstanciaParams,
  SVCCPresentacionConstanciaSWRKey,
  SVCCPresentacionConstanciaOptions,
  SVCCEmpresaTercerizadaListParams,
  SVCCEmpresaTercerizadaListSWRKey,
  SVCCEmpresaTercerizadaListOptions,
  SVCCEmpresaTercerizadaCreateSWRKey,
  SVCCEmpresaTercerizadaCreateOptions,
  SVCCEmpresaTercerizadaUpdateParams,
  SVCCEmpresaTercerizadaUpdateSWRKey,
  SVCCEmpresaTercerizadaUpdateOptions,
  SVCCEmpresaTercerizadaDeleteParams,
  SVCCEmpresaTercerizadaDeleteSWRKey,
  SVCCEmpresaTercerizadaDeleteOptions,
  SVCCEstablecimientoDeclaradoListParams,
  SVCCEstablecimientoDeclaradoListSWRKey,
  SVCCEstablecimientoDeclaradoListOptions,
  SVCCEstablecimientoDeclaradoCreateSWRKey,
  SVCCEstablecimientoDeclaradoCreateOptions,
  SVCCEstablecimientoDeclaradoUpdateParams,
  SVCCEstablecimientoDeclaradoUpdateSWRKey,
  SVCCEstablecimientoDeclaradoUpdateOptions,
  SVCCEstablecimientoDeclaradoDeleteParams,
  SVCCEstablecimientoDeclaradoDeleteSWRKey,
  SVCCEstablecimientoDeclaradoDeleteOptions,
  SVCCSustanciaListParams,
  SVCCSustanciaListSWRKey,
  SVCCSustanciaListOptions,
  SVCCSustanciaCreateSWRKey,
  SVCCSustanciaCreateOptions,
  SVCCSustanciaReadParams,
  SVCCSustanciaReadSWRKey,
  SVCCSustanciaReadOptions,
  SVCCSustanciaUpdateParams,
  SVCCSustanciaUpdateSWRKey,
  SVCCSustanciaUpdateOptions,
  SVCCSustanciaDeleteParams,
  SVCCSustanciaDeleteSWRKey,
  SVCCSustanciaDeleteOptions,
  SVCCTrabajadorListParams,
  SVCCTrabajadorListSWRKey,
  SVCCTrabajadorListOptions,
  SVCCTrabajadorCreateSWRKey,
  SVCCTrabajadorCreateOptions,
  SVCCTrabajadorReadParams,
  SVCCTrabajadorReadSWRKey,
  SVCCTrabajadorReadOptions,
  SVCCTrabajadorUpdateParams,
  SVCCTrabajadorUpdateSWRKey,
  SVCCTrabajadorUpdateOptions,
  SVCCTrabajadorDeleteParams,
  SVCCTrabajadorDeleteSWRKey,
  SVCCTrabajadorDeleteOptions,
  PresentacionUltimaDTO,
} from "./svccAPI";

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
