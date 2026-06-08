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
import { ParametersPoliza, ParametersPolizaAcotada, ParametersComercializador, OrganizadorComercializador, GrupoOrganizadorComercializador, ParametersComercializadoresAsociados, SRTPolizaAcotada } from "@/app/inicio/comercializador/polizas/types/poliza";
import { ComercializadorPostRequest, ComercializadorPostResponse, ComercializadorPutRequest, ComercializadorPutResponse, ComercializadorDeleteParams, ComercializadorDeleteResponse, ComercializadorOrganizadoresPostRequest, ComercializadorOrganizadoresPutRequest, ComercializadorGOrganizadoresPostRequest, ComercializadorGOrganizadoresPutRequest, ComercializadorGOrganizadorById, ComercializadorById, ComercializadorOrganizadorById, SRTComercializadoresAsociadosPostRequest, SRTComercializadoresAsociadosPostResponse, SRTComercializadoresAsociadosPutRequest } from "@/app/inicio/comercializador/administracionComercializadores/types/administracionUsuarios"
import { ParametersEmpleadorPagosComercializador, ParametersComercializadorPeriodoPago, ParametersAfipTranferencia } from "@/app/inicio/comercializador/cuentaCorriente/types/cuentaCorriente";
import { CoberturaPost, CoberturaPostResponse, ParametersCobertura } from "@/app/inicio/empleador/cobertura/types/cobertura";
import { ARCAparams, ARCAApiResponse } from "@/app/inicio/usuarios/interfaces/ARCA";
import { EmpresaParamsID } from "@/app/inicio/usuarios/types/empresa";
import Formato from "@/utils/Formato";
import { AxiosError } from "axios";
import type { AvisoObraRecord } from "@/app/inicio/empleador/avisosDeObra/types/types";
import SrtAPI, { type SrtAPIClass } from "./srtAPI";

const tokenizable = token.configure();

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

/** Body POST `/api/VEmpleadorDDJJ` */
export type VEmpleadorDDJJPostBody = {
  cuit: number[];
  pageIndex: number;
  pageSize: number;
  orderBy: string;
};

export type VEmpleadorDDJJApiResponse = {
  data: unknown[];
  /** Total de pÃ¡ginas segÃºn API (para paginaciÃ³n manual). */
  pages?: number;
  index?: number;
  size?: number;
  count?: number;
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

/** Cuerpo POST `/api/AvisoObra/ultimos` (obraNumero/obraSecuencia solo si filtrÃ¡s por obra). */
export type AvisoObraUltimosBody = {
  cuits: number[];
  pageIndex: number;
  pageSize: number;
  obraNumero?: number;
  obraSecuencia?: number;
};

/** ParÃ¡metros de consulta (una empresa con `CUIT`, o "todas" con `todasLasEmpresas`). */
export type AvisoObraUltimosParams = {
  CUIT?: number;
  /** Listado "Todas las empresas": admin envÃ­a `cuits: []`; resto envÃ­a `cuitsRelacionados`. */
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


function normalizeVEmpleadorDDJJResponse(raw: unknown): VEmpleadorDDJJApiResponse {
  if (raw == null) return { data: [], pages: 0 };
  if (Array.isArray(raw)) return { data: raw, pages: raw.length > 0 ? 1 : 0 };
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    const data = Array.isArray(o.data)
      ? o.data
      : Array.isArray(o.Data)
        ? (o.Data as unknown[])
        : [];
    const pagesRaw = o.pages ?? o.Pages;
    const pagesParsed =
      typeof pagesRaw === "number" && Number.isFinite(pagesRaw)
        ? pagesRaw
        : typeof pagesRaw === "string" && pagesRaw.trim() !== ""
          ? Number(pagesRaw)
          : NaN;
    const pages = Number.isFinite(pagesParsed)
      ? Math.max(0, Math.floor(pagesParsed))
      : data.length > 0
        ? 1
        : 0;
    const indexRaw = o.index ?? o.Index;
    const sizeRaw = o.size ?? o.Size;
    const countRaw = o.count ?? o.Count;
    return {
      data,
      pages,
      index: typeof indexRaw === "number" && Number.isFinite(indexRaw) ? indexRaw : undefined,
      size: typeof sizeRaw === "number" && Number.isFinite(sizeRaw) ? sizeRaw : undefined,
      count: typeof countRaw === "number" && Number.isFinite(countRaw) ? countRaw : undefined,
    };
  }
  return { data: [], pages: 0 };
}


// Reexportaciones SVCC (migrado a svccAPI.ts)
export type {
  Pagination,
  PresentacionBaseDTO,
  PresentacionCreateDTO,
  PresentacionFinalizaDTO,
  PresentacionDTO,
  PresentacionUltimaDTO,
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
} from "./svccAPI";

export { default as SvccAPI } from "./svccAPI";
export { default as SrtAPI } from "./srtAPI";
export type { SRTPolizaUsuarioLogueada } from "./srtAPI";

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
    // Solo hacer fetch si hay CUIT vÃ¡lido (diferente de 0 y no undefined/null)
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
    // Obtener el token de la sesiÃ³n de forma confiable
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
        // SWR detectarÃ¡ automÃ¡ticamente cuando cambia la clave (que incluye el CUIT)
        // y ejecutarÃ¡ el query automÃ¡ticamente
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

  //#region VEmpleadorDDJJ
  readonly postVEmpleadorDDJJURL = this.getURL({ path: "/api/VEmpleadorDDJJ" }).toString();
  postVEmpleadorDDJJ = async (body: VEmpleadorDDJJPostBody): Promise<VEmpleadorDDJJApiResponse> =>
    tokenizable.post<unknown>(this.postVEmpleadorDDJJURL, body).then(({ data }) => normalizeVEmpleadorDDJJResponse(data));

  useVEmpleadorDDJJ = (body: VEmpleadorDDJJPostBody | null, options?: SWRConfiguration<VEmpleadorDDJJApiResponse, AxiosError>) =>
    useSWR<VEmpleadorDDJJApiResponse, AxiosError>(
      body ? [this.postVEmpleadorDDJJURL, token.getToken(), JSON.stringify(body)] : null,
      () => this.postVEmpleadorDDJJ(body as VEmpleadorDDJJPostBody),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        /** Evita `data === undefined` al cambiar pÃ¡gina (nueva key), que rompÃ­a `pages` y el estado local. */
        keepPreviousData: true,
        ...options,
      }
    );
  //#endregion VEmpleadorDDJJ


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




  //#region Denuncias
  readonly getDenunciasURL = () =>
    //params.CUIT ??= useAuth().user?.empresaCUIT ?? 0; este parametro lo paso desde el componente que lo usa
    // Ordenar por defecto: mÃ¡s nuevas primero (Interno descendente)
    //params.orderBy ??= "-Interno";
    this.getURL({ path: "/api/Denuncias/GetBySpecs" }).toString();
  getDenuncias = async (params: DenunciaQueryParams = {}) =>
    tokenizable.post<DenunciasApiResponse>(this.getDenunciasURL(), params).then(({ data }) => data);
  useGetDenuncias = (params: DenunciaQueryParams = {}) =>
    useSWR(
      [this.getDenunciasURL(), JSON.stringify(params), token.getToken()],
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






    //#region Comercializador Periodo Pago
  readonly getComercializadorPeriodoPagoURL = (params: ParametersComercializadorPeriodoPago = {}) => {
    return this.getURL({
      path: "/api/ComercializadoresPeriodosPagos",
      search: toURLSearch(params),
    }).toString();
  };
  
  getComercializadorPeriodoPago = async (params: ParametersComercializadorPeriodoPago = {}) =>
    tokenizable.get(
      this.getComercializadorPeriodoPagoURL(params),
    ).then(({ data }) => data);

  useGetComercializadorPeriodoPago = (params: ParametersComercializadorPeriodoPago = {}) => useSWR(
    [this.getComercializadorPeriodoPagoURL(params), token.getToken()],
    () => this.getComercializadorPeriodoPago(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  //#endregion


}



type ArtAPIInstance = ArtAPIClass & SrtAPIClass;

const ArtAPI = Object.seal(
  Object.assign(new ArtAPIClass(), SrtAPI)
) as ArtAPIInstance;

export default ArtAPI;

