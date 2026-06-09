import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { ExternalAPI } from "./api";
import { token } from "./usuarioAPI";
import { toURLSearch } from "@/utils/utils";
import srtProvincia from "@/app/inicio/usuarios/interfaces/SrtProvincia";
import { ParametersLocalidadSRT, ParametersLocalidadbyCodigo } from "@/app/inicio/denuncias/types/tDenuncias";
import {
  ParametersPoliza,
  ParametersPolizaAcotada,
  ParametersComercializador,
  OrganizadorComercializador,
  GrupoOrganizadorComercializador,
  ParametersComercializadoresAsociados,
  SRTPolizaAcotada,
} from "@/app/inicio/comercializador/polizas/types/poliza";
import {
  ComercializadorPostRequest,
  ComercializadorPostResponse,
  ComercializadorPutRequest,
  ComercializadorPutResponse,
  ComercializadorDeleteParams,
  ComercializadorDeleteResponse,
  ComercializadorOrganizadoresPostRequest,
  ComercializadorOrganizadoresPutRequest,
  ComercializadorGOrganizadoresPostRequest,
  ComercializadorGOrganizadoresPutRequest,
  ComercializadorGOrganizadorById,
  ComercializadorById,
  ComercializadorOrganizadorById,
  SRTComercializadoresAsociadosPostRequest,
  SRTComercializadoresAsociadosPostResponse,
  SRTComercializadoresAsociadosPutRequest,
} from "@/app/inicio/comercializador/administracionComercializadores/types/administracionUsuarios";
import { SRTEnviosRGRLParams, SRTEnviosRGRLResponse, SRTEnviosRGRLRespuestasParams, SRTEnviosRGRLRespuestasResponse, SRTPublicacionesCIIUConversionesParams } from "@/app/inicio/pruebasLotesSRT/RGRL/types/rgrlLotes";

const tokenizable = token.configure();

export type SRTPolizaUsuarioLogueada = SRTPolizaAcotada;

export class SrtAPIClass extends ExternalAPI {
  readonly basePath =
    process.env.NEXT_PUBLIC_API_SRT ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://fallback-srt.url";
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

  //#region Polizas Acotado Comercializador
  readonly getPolizasAcotadoURL = (params: ParametersPolizaAcotada = {}) =>
    this.getURL({ path: "/api/SRTPolizas/Acotado", search: toURLSearch(params) }).toString();

  getPolizasAcotado = async (params: ParametersPolizaAcotada = {}) =>
    tokenizable
      .get<SRTPolizaAcotada[]>(this.getPolizasAcotadoURL(params))
      .then(({ data }) => data);

  useGetPolizasAcotadoURL = (params: ParametersPolizaAcotada | null = {}) =>
    useSWR(
      params === null ? null : [this.getPolizasAcotadoURL(params), token.getToken()],
      () => this.getPolizasAcotado(params ?? {}),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion Polizas Acotado Comercializador

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


  //#region Polizas Usuario Logueado
  readonly getPolizasUsuarioLogueadoURL = () =>
    this.getURL({ path: "/api/SRTPolizas/UsuarioLogueado" }).toString();

  getPolizasUsuarioLogueado = async () =>
    tokenizable
      .get<SRTPolizaUsuarioLogueada[]>(this.getPolizasUsuarioLogueadoURL())
      .then(({ data }) => data);

  useGetPolizasUsuarioLogueadoURL = () =>
    useSWR(
      [this.getPolizasUsuarioLogueadoURL(), token.getToken()],
      () => this.getPolizasUsuarioLogueado(),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //#endregion Polizas Usuario Logueado



   //#region SRTEnviosRGRL
  readonly getSRTEnviosRGRLURL = (params: SRTEnviosRGRLParams = {}) =>
    this.getURL({ path: "/api/SRTEnviosRGRL", search: toURLSearch(params) }).toString();

  getSRTEnviosRGRL = async (params: SRTEnviosRGRLParams = {}): Promise<SRTEnviosRGRLResponse> =>
    tokenizable.get<SRTEnviosRGRLResponse>(this.getSRTEnviosRGRLURL(params)).then(({ data }) => data);

  useGetSRTEnviosRGRL = (params: SRTEnviosRGRLParams = {}) =>
    useSWR(
      [this.getSRTEnviosRGRLURL(params), token.getToken()],
      () => this.getSRTEnviosRGRL(params),
      { revalidateOnFocus: false, revalidateOnReconnect: false }
    );
  //#endregion

  //#region SRTEnviosRGRLRespuestas
  readonly getSRTEnviosRGRLRespuestasURL = (params: SRTEnviosRGRLRespuestasParams = {}) =>
    this.getURL({ path: "/api/SRTEnviosRGRLRespuestas", search: toURLSearch(params) }).toString();

  getSRTEnviosRGRLRespuestas = async (params: SRTEnviosRGRLRespuestasParams = {}): Promise<SRTEnviosRGRLRespuestasResponse> =>
    tokenizable.get<SRTEnviosRGRLRespuestasResponse>(this.getSRTEnviosRGRLRespuestasURL(params)).then(({ data }) => data);

  useGetSRTEnviosRGRLRespuestas = (params: SRTEnviosRGRLRespuestasParams = {}) =>
    useSWR(
      [this.getSRTEnviosRGRLRespuestasURL(params), token.getToken()],
      () => this.getSRTEnviosRGRLRespuestas(params),
      { revalidateOnFocus: false, revalidateOnReconnect: false }
    );
  //#endregion


  //#region SRTPublicacionesCIIUConversiones
  readonly getSRTPublicacionesCIIUConversionesURL = (params: SRTPublicacionesCIIUConversionesParams = {}) => {
    return this.getURL({ path: "/api/SRTPublicacionesCIIUConversiones", search: toURLSearch(params) }).toString();
  };
  getSRTPublicacionesCIIUConversiones = async (params: SRTPublicacionesCIIUConversionesParams = {}) => tokenizable.get(
    this.getSRTPublicacionesCIIUConversionesURL(params),
  ).then(({ data }) => data);
  useGetSRTPublicacionesCIIUConversiones = (params: SRTPublicacionesCIIUConversionesParams = {}) => useSWR(
    [this.getSRTPublicacionesCIIUConversionesURL(params), token.getToken()], () => this.getSRTPublicacionesCIIUConversiones(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  //#endregion




}



const SrtAPI = Object.seal(new SrtAPIClass()) as SrtAPIClass;

export default SrtAPI;