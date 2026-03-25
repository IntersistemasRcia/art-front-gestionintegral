import useSWR, { Fetcher, SWRConfiguration } from "swr";
import useSWRMutation from "swr/mutation";
import { useSession } from "next-auth/react";
import { ExternalAPI } from "./api";
import { token } from "./usuarioAPI";
import RefEmpleador from "@/app/inicio/usuarios/interfaces/RefEmpleador";
import FormularioRAR, { ParametersFormularioRar, ParametersEmpresaByCUIT, EstablecimientoById, ParametersEstablecimientoByCUIT, FormularioRARDetallePostRequest, FormularioRARPostRequest, FormularioRARPutRequest, FormulariosRARApiResponse } from "@/app/inicio/empleador/formularioRAR/types/TformularioRar";
import { toURLSearch } from "@/utils/utils";
import type { ApiFormularioRGRL, ApiEstablecimientoEmpresa } from "@/app/inicio/empleador/formularioRGRL/types/rgrl";
import { ParametersLocalidad, ParametersLocalidadCodigo, ParametersLocalidadNombre, DenunciaQueryParams, DenunciasApiResponse, DenunciaPostRequest, DenunciaQueryParamsID, AfiQueryParams, AfiApiResponse, PrestadorQueryParams, PrestadorResponse, DenunciaPutRequest, DenunciaPatchRequest, RefPaises, RefObraSocial, Roam, ParametersEmpleadorT, RefPrestadores } from "@/app/inicio/denuncias/types/tDenuncias";
import { ParametersPoliza, ParametersComercializador, OrganizadorComercializador, GrupoOrganizadorComercializador} from "@/app/inicio/comercializador/polizas/types/poliza";
import {ComercializadorPostRequest, ComercializadorPostResponse, ComercializadorPutRequest, ComercializadorPutResponse, ComercializadorDeleteParams, ComercializadorDeleteResponse, ComercializadorOrganizadoresPostRequest, ComercializadorOrganizadoresPutRequest, ComercializadorGOrganizadoresPostRequest, ComercializadorGOrganizadoresPutRequest, ComercializadorGOrganizadorById, ComercializadorById, ComercializadorOrganizadorById } from "@/app/inicio/comercializador/administracionComercializadores/types/administracionUsuarios"
import {ParametersEmpleadorPagosComercializador, ParametersAfipTranferencia } from "@/app/inicio/comercializador/cuentaCorriente/types/cuentaCorriente";
import {CoberturaPost, CoberturaPostResponse, ParametersCobertura} from "@/app/inicio/empleador/cobertura/types/cobertura";
import { ARCAparams, ARCAApiResponse } from "@/app/inicio/usuarios/interfaces/ARCA";
import Formato from "@/utils/Formato";
import { AxiosError } from "axios";

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

export type EmpresaParametroPutResponse = unknown;

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
  readonly getFormulariosRARURL = (params: ParametersFormularioRar = {}) => {
    //params.CUIT ??= useAuth().user?.empresaCUIT ?? 0; este parametro lo paso desde el componente que lo usa
    return this.getURL({ path: "/api/FormulariosRAR", search: toURLSearch(params) }).toString();
  };
  getFormulariosRAR = async (params: ParametersFormularioRar = {}) => tokenizable.get(
    this.getFormulariosRARURL(params),
  ).then(({ data }) => data);
  useGetFormulariosRARURL = (params?: ParametersFormularioRar) => {
    // Obtener el token de la sesión de forma confiable
    const { data: session } = useSession();
    const accessToken = session?.accessToken;

    // Construir la clave SWR de forma estable
    // La clave debe cambiar cuando cambia el CUIT para que SWR detecte el cambio automáticamente
    // SWR detectará el cambio en la clave y ejecutará el query automáticamente
    const key = params && params.CUIT && params.CUIT > 0 && accessToken
      ? [this.getFormulariosRARURL(params), accessToken, params.CUIT, params.PageIndex ?? 0, params.PageSize ?? 10]
      : null;

    // Log para debug en desarrollo
    if (process.env.NODE_ENV === 'development') {
      if (key) {
        console.log('[useGetFormulariosRARURL] Clave SWR:', key);
        console.log('[useGetFormulariosRARURL] CUIT:', params?.CUIT);
      } else {
        console.log('[useGetFormulariosRARURL] Clave SWR es null - params:', params, 'accessToken:', !!accessToken);
      }
    }

    return useSWR(
      key,
      key ? () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useGetFormulariosRARURL] Ejecutando fetcher con CUIT:', params?.CUIT);
        }
        return this.getFormulariosRAR(params!);
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
  getFormulariosRGRL = async (cuit: number, all: boolean = false): Promise<ApiFormularioRGRL[]> => {
    const search: Record<string, string | number> = { CUIT: String(cuit) };
    if (all) search.pageSize = 99999;
    const url = this.getURL({
      path: "/api/FormulariosRGRL",
      search: toURLSearch(search),
    });
    const res = await fetch(url.toString(), { cache: "no-store", headers: { Accept: "application/json" } });
    if (res.status === 404) return [];
    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      throw new Error(`GET ${url} -> ${res.status} ${raw}`);
    }
    const body = await res.json().catch(() => null);
    const arr = Array.isArray(body?.DATA)
      ? body.DATA
      : Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body)
          ? body
          : [];
    return arr as ApiFormularioRGRL[];
  };
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
  getEstablecimientosEmpresa = async (cuit: number, activos?: string): Promise<ApiEstablecimientoEmpresa[]> => {
    const opts: any = {
      path: `/api/Establecimientos/Empresa/${encodeURIComponent(cuit)}`,
    };
    if (activos !== undefined) opts.search = toURLSearch({ Activos: activos });
    const url = this.getURL(opts);
    const res = await fetch(url.toString(), { cache: "no-store", headers: { Accept: "application/json" } });
    if (res.status === 404) return [];
    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      throw new Error(`GET ${url} -> ${res.status} ${raw}`);
    }
    return (await res.json()) as ApiEstablecimientoEmpresa[];
  };
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



}



const ArtAPI = Object.seal(new ArtAPIClass()) as ArtAPIClass;

export default ArtAPI;

