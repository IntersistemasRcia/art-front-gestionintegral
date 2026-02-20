import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { AxiosError } from "axios";
import { token } from "./usuarioAPI";
import { ExternalAPI } from "./api";
import { camelCaseKeys, toURLSearch } from "@/utils/utils";

//#region Types

export type ISODateString = string;
export type GUIDString = string;
export type Ambito = "todos" | "rol" | "usuario";
export interface APIError<T = Record<string, any>> {
  code: number;
  message: string;
  details?: T;
}
export type Pagination<T = any> = {
  index: number,
  size: number,
  pages: number,
  count: number,
  data: T[],
}

//#region queries

export interface Query {
  select: Select[];
  from: Source[];
  where?: string;
  group?: Group;
  order?: Order;
}
export interface Source {
  name?: string;
  table?: string;
  values?: Record<string, (string | null)[]>
  query?: Query;
  join?: Join;
}
export interface Join {
  left?: string;
  right?: string;
  inner?: string;
  full?: string;
}
export interface Select {
  value?: string;
  name?: string;
}
export interface Group {
  by: string[];
  having?: string;
}
export interface Order {
  by: string[];
  page?: Page;
}
export interface Page {
  index: number;
  size?: number;
}

//#region execute
export type QueryResultData = Record<string, any>;
export interface QueryResult<Data = QueryResultData> {
  count: number;
  data?: Data[];
  page?: QueryResultPage;
}
export interface QueryResultPage {
  index: number;
  size: number;
  count: number;
}
export type ExecuteSWRKey = [url: string, token: string, query: string];
//#endregion execute

//#region analyze
export interface QueryAnalysis {
  count: number;
  pages?: number;
  tables?: Record<string, string[]>;
}
export type AnalyzeSWRKey = [url: string, token: string, query: string];
//#endregion analyze

//#endregion queries

//#region filters
export type FiltroVm = {
  id?: number,
  guid?: GUIDString,
  createdDate?: ISODateString,
  createdBy?: GUIDString | string,
  lastModifiedDate?: ISODateString,
  lastModifiedBy?: GUIDString | string,
  deletedDate?: ISODateString,
  deletedBy?: GUIDString | string,
  deletedObs?: string,
  proposition?: string,
  nombre?: string,
  modulo?: string,
  ambito?: Ambito,
  ambitoUserId?: GUIDString,
  ambitoRolId?: GUIDString,
  propietarioUserId?: GUIDString,
}

//#region getFilters
export type GetFiltersParams = {
  deleted?: boolean,
  page?: string,
  sort?: string,
  modulo?: string,
  nombre?: string,
  id?: number,
}
export type GetFiltersSWRKey = [url: string, token: string, params: string];
//#endregion getFilters

//#region saveFilter
export type SaveFilterCommand = {
  nombre: string,
  modulo: string,
  proposition: string,
  ambito: Ambito,
  ambitoRolId?: GUIDString,
}
export type SaveFilterSWRKey = [url: string, token: string];
//#endregion saveFilter

//#region deleteFilter
export type DeleteFilterCommand = {
  id?: number,
  nombre?: string,
  modulo?: string,
  observaciones?: string,
}
export type DeleteFilterSWRKey = [url: string, token: string];
//#endregion deleteFilter

//#region getDisponibilidad
export type GetDisponibilidadParams = {
  modulo: string,
  nombre: string,
}
export type GetDisponibilidadResponse = {
  disponible: boolean,
}
export type GetDisponibilidadSWRKey = [url: string, token: string, params: string];
//#endregion getDisponibilidad

//#endregion filters

//#region dashboard
export type IndicadorDTO = {
  id: number;
  nombre: string;
  descripcion: string;
  valor: number;
  link: string;
  opcionAsociada?: string;
  filtroId?: number;
};
export type GetIndicadoresSWRKey = [url: string, token: string];
//#endregion dashboard

//#endregion Types

const tokenizable = token.configure();

function reject<T>(error: AxiosError) {
  return Promise.reject<T>(camelCaseKeys<APIError>(error.response?.data)
    ?? { code: error.status ?? 0, message: error.message, details: error } as APIError<AxiosError>
  );
}

export class QueriesAPIClass extends ExternalAPI {
  readonly basePath = process.env.NEXT_PUBLIC_QUERYAPI_URL!;

  //#region queries

  //#region execute
  readonly executeURL = this.getURL({ path: "/api/queries/execute" }).toString();
  execute = async <Data extends QueryResultData = QueryResultData>(query: Query) => tokenizable.post<QueryResult<Data>>(
    this.executeURL, query
  ).then(({ data }) => data, (error) => reject<QueryResult<Data>>(error));
  swrExecute = Object.freeze({
    key: (query: Query): ExecuteSWRKey => [this.executeURL, token.getToken(), JSON.stringify(query)],
    fetcher: <Data extends QueryResultData = QueryResultData>(key: ExecuteSWRKey) => this.execute<Data>(JSON.parse(key[2])),
  });
  useExecute = <Data extends QueryResultData = QueryResultData>(query: Query) =>
    useSWR<QueryResult<Data>, APIError>(this.swrExecute.key(query), this.swrExecute.fetcher);
  //#endregion execute

  //#region analyze
  readonly analyzeURL = this.getURL({ path: "/api/queries/analyze" }).toString();
  analyze = async <Data = QueryAnalysis>(query: Query) => tokenizable.post<Data>(
    this.analyzeURL, query
  ).then(({ data }) => data, (error) => reject<Data>(error));
  swrAnalyze = Object.freeze({
    key: (query: Query): AnalyzeSWRKey => [this.executeURL, token.getToken(), JSON.stringify(query)],
    fetcher: <Data = QueryAnalysis>(key: AnalyzeSWRKey) => this.analyze<Data>(JSON.parse(key[2])),
  });
  useAnalyze = <Data = QueryAnalysis>(query: Query) => useSWR<Data, APIError>(this.swrAnalyze.key(query), this.swrAnalyze.fetcher);
  //#endregion analyze

  //#endregion queries

  //#region filters

  //#region getFilters
  readonly getFiltersURL = (params?: GetFiltersParams) => this.getURL({ path: "/api/filters", search: toURLSearch(params) }).toString();
  getFilters = async (params?: GetFiltersParams) => tokenizable.get<Pagination<FiltroVm>>(
    this.getFiltersURL(params)
  ).then(({ data }) => data, (error) => reject<Pagination<FiltroVm>>(error));
  swrGetFilters = Object.freeze({
    key: (params?: GetFiltersParams): GetFiltersSWRKey => [this.getFiltersURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: (key: GetFiltersSWRKey) => this.getFilters(JSON.parse(key[2])),
  });
  useGetFilters = (params?: GetFiltersParams) =>
    useSWR<Pagination<FiltroVm>, APIError>(this.swrGetFilters.key(params), this.swrGetFilters.fetcher);
  //#endregion getFilters

  //#region saveFilter
  readonly saveFilterURL = this.getURL({ path: "/api/filters" }).toString();
  saveFilter = async (filter: SaveFilterCommand) => tokenizable.post<FiltroVm>(
    this.saveFilterURL, filter
  ).then(({ data }) => data, (error) => reject<FiltroVm>(error));
  swrSaveFilter: {
    key: SaveFilterSWRKey,
    fetcher: (key: SaveFilterSWRKey, options: { arg: SaveFilterCommand }) => Promise<FiltroVm>,
  } = Object.freeze({
    key: [this.saveFilterURL, token.getToken()],
    fetcher: (_key, { arg }) => this.saveFilter(arg),
  });
  useSaveFilter = (params?: GetFiltersParams) => {
    const { mutate } = this.useGetFilters(params);
    return useSWRMutation<FiltroVm, APIError, SaveFilterSWRKey, SaveFilterCommand>(
      this.swrSaveFilter.key,
      this.swrSaveFilter.fetcher,
      { onSuccess: () => mutate() }
    );
  }
  //#endregion saveFilter

  //#region deleteFilter
  readonly deleteFilterURL = this.getURL({ path: "/api/filters" }).toString();
  deleteFilter = async (filter: DeleteFilterCommand) => tokenizable.delete<FiltroVm>(
    this.deleteFilterURL, { data: filter }
  ).then(({ data }) => data, (error) => reject<FiltroVm>(error));
  swrDeleteFilter: {
    key: DeleteFilterSWRKey,
    fetcher: (key: DeleteFilterSWRKey, options: { arg: DeleteFilterCommand }) => Promise<FiltroVm>,
  } = Object.freeze({
    key: [this.deleteFilterURL, token.getToken()],
    fetcher: (_key, { arg }) => this.deleteFilter(arg),
  });
  useDeleteFilter = (params?: GetFiltersParams) => {
    const { mutate } = this.useGetFilters(params);
    return useSWRMutation<FiltroVm, APIError, DeleteFilterSWRKey, DeleteFilterCommand>(
      this.swrDeleteFilter.key,
      this.swrDeleteFilter.fetcher,
      { onSuccess: () => mutate() }
    );
  }
  //#endregion deleteFilter

  //#region getDisponibilidad
  readonly getDisponibilidadURL = (params: GetDisponibilidadParams) =>
    this.getURL({ path: "/api/filters/disponibilidad", search: toURLSearch(params) }).toString();
  getDisponibilidad = async (params: GetDisponibilidadParams) => tokenizable.get<GetDisponibilidadResponse>(
    this.getDisponibilidadURL(params)
  ).then(({ data }) => data, (error) => reject<GetDisponibilidadResponse>(error));
  swrGetDisponibilidad = Object.freeze({
    key: (params: GetDisponibilidadParams): GetDisponibilidadSWRKey => [this.getDisponibilidadURL(params), token.getToken(), JSON.stringify(params)],
    fetcher: (key: GetDisponibilidadSWRKey) => this.getDisponibilidad(JSON.parse(key[2])),
  });
  useGetDisponibilidad = (params: GetDisponibilidadParams) =>
    useSWR<GetDisponibilidadResponse, APIError>(this.swrGetDisponibilidad.key(params), this.swrGetDisponibilidad.fetcher);
  //#endregion getDisponibilidad

  //#endregion filters

  //#region dashboard

  //#region getIndicadores
  readonly getIndicadoresURL = this.getURL({ path: "/api/Dashboard/Indicadores" }).toString();
  getIndicadores = async () => tokenizable.get<IndicadorDTO[]>(
    this.getIndicadoresURL
  ).then(({ data }) => data, (error) => reject<IndicadorDTO[]>(error));
  swrGetIndicadores = Object.freeze({
    key: (): GetIndicadoresSWRKey => [this.getIndicadoresURL, token.getToken()],
    fetcher: (key: GetIndicadoresSWRKey) => this.getIndicadores(),
  });
  useGetIndicadores = () => {
    const tokenValue = token.getToken();
    // Solo hacer la petición si hay token (usuario autenticado)
    return useSWR<IndicadorDTO[], APIError>(
      tokenValue ? this.swrGetIndicadores.key() : null,
      this.swrGetIndicadores.fetcher
    );
  };
  //#endregion getIndicadores

  //#endregion dashboard
}

const QueriesAPI = Object.freeze(new QueriesAPIClass());

export default QueriesAPI;