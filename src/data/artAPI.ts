import useSWR, { Fetcher, SWRConfiguration } from "swr";
import useSWRMutation from "swr/mutation";
import { ExternalAPI } from "./api";
import { token } from "./usuarioAPI";
import RefEmpleador from "@/app/inicio/usuarios/interfaces/RefEmpleador";
import FormularioRAR, { ParametersFormularioRar, ParametersEmpresaByCUIT, EstablecimientoById, ParametersEstablecimientoByCUIT } from "@/app/inicio/empleador/formularioRAR/types/TformularioRar";
import { toURLSearch } from "@/utils/utils";
import type { ApiFormularioRGRL, ApiEstablecimientoEmpresa } from "@/app/inicio/empleador/formularioRGRL/types/rgrl";
import { ParametersLocalidad, ParametersLocalidadCodigo, ParametersLocalidadNombre, DenunciaQueryParams, DenunciasApiResponse, DenunciaPostRequest, DenunciaQueryParamsID, AfiQueryParams, AfiApiResponse, PrestadorQueryParams, PrestadorResponse, DenunciaPutRequest, DenunciaPatchRequest, RefPaises, RefObraSocial, Roam, ParametersEmpleadorT, RefPrestadores } from "@/app/inicio/denuncias/types/tDenuncias";
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
}
export type EstablecimientoListSWRKey = [url: string, token: string, params: string];
export type EstablecimientoListOptions = SWRConfiguration<EstablecimientoVm[], AxiosError, Fetcher<EstablecimientoVm[], EstablecimientoListSWRKey>>
//#endregion Types Establecimiento

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

  //#region Establecimiento
  readonly establecimientoListURL = ({ cuit }: EstablecimientoListParams) =>
    this.getURL({ path: `/api/Establecimientos/empresa/${cuit}` }).toString();
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
  useEstablecimientoList = (params?: EstablecimientoListParams, options?: EstablecimientoListOptions) =>
    useSWR<EstablecimientoVm[], AxiosError>(params ? this.swrEstablecimientoList.key(params) : null, this.swrEstablecimientoList.fetcher, options);
  //#endregion Establecimiento

  //#region FormulariosRAR
  readonly getFormulariosRARURL = (params: ParametersFormularioRar = {}) => {
    //params.CUIT ??= useAuth().user?.empresaCUIT ?? 0; este parametro lo paso desde el componente que lo usa
    return this.getURL({ path: "/api/FormulariosRAR", search: toURLSearch(params) }).toString();
  };
  getFormulariosRAR = async (params: ParametersFormularioRar = {}) => tokenizable.get(
    this.getFormulariosRARURL(params),
  ).then(({ data }) => data);
  useGetFormulariosRARURL = (params: ParametersFormularioRar = {}) => useSWR(
    [this.getFormulariosRARURL(params), token.getToken()], () => this.getFormulariosRAR(params),
    {
      // No volver a revalidar al volver al foco, reconectar o al montar si ya hay cache
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      //revalidateOnMount: false,
      //dedupingInterval: 1000 * 60 * 60, // 1 hora (ajusta si hace falta) // Tiempo en ms durante el cual SWR deduplica solicitudes iguales (evita re-fetch frecuente)
      // Si quieres que la clave no dispare fetch hasta que exista token, puedes usar: (token.getToken() ? key : null)
    }
  );

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
  getEstablecimientosEmpresa = async (cuit: number): Promise<ApiEstablecimientoEmpresa[]> => {
    const url = this.getURL({
      path: `/api/Establecimientos/Empresa/${encodeURIComponent(cuit)}`,
    });
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

  //#region EmpleadorTrabajadores
  readonly getEmpleadorTrabajadoresURL = (params: ParametersEmpleadorT = {}) => {
    //params.CUIT ??= useAuth().user?.empresaCUIT ?? 0; este parametro lo paso desde el componente que lo usa
    return this.getURL({ path: "/api/EmpleadorTrabajadores/CUIL", search: toURLSearch(params) }).toString();
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

}

const ArtAPI = Object.seal(new ArtAPIClass()) as ArtAPIClass;

export default ArtAPI;

export const formatEstablecimientoLabel = (est?: Partial<ApiEstablecimientoEmpresa> | null): string => {
  if (!est) return "";
  const nroSucursal =
    (est as any).nroSucursal ?? (est as any).NroSucursal ?? (est as any).nroSucursalEmpresa ?? (est as any).sucursal ?? "";
  const domicilioCalle =
    (est as any).domicilioCalle ?? (est as any).domicilio ?? (est as any).calle ?? (est as any).direccion ?? "";
  const domicilioNro =
    (est as any).domicilioNro ?? (est as any).domicilioNroEmpresa ?? (est as any).domicilioNroString ?? (est as any).domicilioNroStr ?? (est as any).domicilioNumero ?? "";

  const domicilio = `${String(domicilioCalle || "").trim()} ${String(domicilioNro || "").trim()}`.trim();

  const parts: string[] = [];
  parts.push(String(nroSucursal));
  parts.push(domicilio);

  const filled = parts.map(p => (p && p !== "undefined" && p !== "null" ? p : "")).filter(p => p && p.trim().length > 0);
  if (filled.length === 0) return "";
  return `Sucursal: ${filled.join(" - ")}`;
};
