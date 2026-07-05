import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { AxiosError } from "axios";
import { useSession } from "next-auth/react";
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
  link?: string;
  opcionAsociada?: string;
  filtroId?: number;
};
export type GetIndicadoresParams = { cuit?: number };
export type GetIndicadoresSWRKey = [url: string, token: string, cuit: number | undefined];
//#endregion dashboard

//#region indicadores gestion
export type IndicadorGestionDTO = {
  id: number;
  nombre: string;
  descripcion: string;
  filtroId: number;
  tablaBase: string;
  rolId: string;
  cargoId?: number | null;
  sectorId?: number | null;
  estado: "Activo" | "Inactivo";
  link?: string;
  guid?: GUIDString;
  createdDate?: ISODateString;
  createdBy?: GUIDString;
  lastModifiedDate?: ISODateString;
  lastModifiedBy?: GUIDString;
  deletedDate?: ISODateString;
  deletedBy?: GUIDString;
  deletedObs?: string;
};

export type IndicadorCreateCommand = {
  nombre: string;
  descripcion: string;
  filtroId: number;
  tablaBase: string;
  rolId: string;
  cargoId?: number | null;
  sectorId?: number | null;
  estado: "Activo" | "Inactivo";
  link?: string;
};

export type IndicadorUpdateCommand = {
  id: number;
  nombre: string;
  descripcion: string;
  filtroId: number;
  tablaBase: string;
  rolId: string;
  cargoId?: number | null;
  sectorId?: number | null;
  estado: "Activo" | "Inactivo";
  link?: string;
};

export type IndicadorDeleteCommand = {
  id: number;
  observaciones?: string;
};

export type GetIndicadoresGestionSWRKey = [url: string, token: string];
export type IndicadorGestionSWRKey = [url: string, token: string];
export type IndicadorGestionDeleteSWRKey = [url: string, token: string];
//#endregion indicadores gestion

//#endregion Types

const tokenizable = token.configure();

function reject<T>(error: AxiosError) {
  return Promise.reject<T>(camelCaseKeys<APIError>(error.response?.data)
    ?? { code: error.status ?? 0, message: error.message, details: error } as APIError<AxiosError>
  );
}

export class QueriesAPIClass extends ExternalAPI {
  readonly basePath = process.env.NEXT_PUBLIC_QUERYAPI_URL || "http://fallback-prod.url";

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
  readonly getIndicadoresURL = (params?: GetIndicadoresParams) =>
    this.getURL({ path: "/api/Dashboard/Indicadores", search: params?.cuit != null ? { cuit: String(params.cuit) } : undefined }).toString();
  getIndicadores = async (params?: GetIndicadoresParams) => tokenizable.get<IndicadorDTO[]>(
    this.getIndicadoresURL(params)
  ).then(({ data }) => data, (error) => reject<IndicadorDTO[]>(error));
  swrGetIndicadores = Object.freeze({
    key: (cuit?: number): GetIndicadoresSWRKey => [this.getIndicadoresURL({ cuit }), token.getToken(), cuit],
    fetcher: (key: GetIndicadoresSWRKey) => this.getIndicadores({ cuit: key[2] }),
  });
  useGetIndicadores = (enabled: boolean = true) => {
    const { data: session, status } = useSession();
    const accessToken = (session as { accessToken?: string })?.accessToken;
    const isAuthenticated = status === 'authenticated';
    const user = session?.user as Record<string, unknown> | undefined;
    const empresaCUITRaw = user?.empresaCUIT ?? user?.EmpresaCUIT ?? user?.empresaCuit;
    const empresaCUIT = Number(empresaCUITRaw);
    const cuit = empresaCUIT > 0 ? empresaCUIT : undefined;
    
    const swrKey = enabled && isAuthenticated && accessToken 
      ? [this.getIndicadoresURL({ cuit }), accessToken, cuit] as GetIndicadoresSWRKey
      : null;
    
    return useSWR<IndicadorDTO[], APIError>(
      swrKey,
      this.swrGetIndicadores.fetcher,
      {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        revalidateOnMount: true,
        refreshInterval: 0,
      }
    );
  };
  //#endregion getIndicadores

  //#endregion dashboard

  //#region indicadores gestion

  //#region getIndicadoresGestion
  readonly getIndicadoresGestionURL = this.getURL({ path: "/api/Indicadores" }).toString();
  getIndicadoresGestion = async () => {
    try {
      const response = await tokenizable.get<Pagination<IndicadorGestionDTO>>(this.getIndicadoresGestionURL);
      console.log("API Response Indicadores:", response.data);
      // La API devuelve un objeto Pagination, extraer el array data
      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching Indicadores:", error);
      return reject<IndicadorGestionDTO[]>(error as AxiosError);
    }
  };
  swrGetIndicadoresGestion = Object.freeze({
    key: (): GetIndicadoresGestionSWRKey => [this.getIndicadoresGestionURL, token.getToken()],
    fetcher: (key: GetIndicadoresGestionSWRKey) => this.getIndicadoresGestion(),
  });
  useGetIndicadoresGestion = () => {
    // Usar useSession para obtener el token directamente y que se actualice reactivamente
    const { data: session, status } = useSession();
    const accessToken = (session as any)?.accessToken;
    const isAuthenticated = status === 'authenticated';
    
    // Crear la key con el token de la sesión para que cambie cuando se autentica
    const swrKey = isAuthenticated && accessToken 
      ? [this.getIndicadoresGestionURL, accessToken] as GetIndicadoresGestionSWRKey
      : null;
    
    return useSWR<IndicadorGestionDTO[], APIError>(
      swrKey,
      this.swrGetIndicadoresGestion.fetcher,
      {
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        revalidateOnMount: true,
      }
    );
  };
  //#endregion getIndicadoresGestion

  //#region createIndicador
  readonly createIndicadorURL = this.getURL({ path: "/api/Indicadores" }).toString();
  createIndicador = async (indicador: IndicadorCreateCommand) => tokenizable.post<IndicadorGestionDTO>(
    this.createIndicadorURL, indicador
  ).then(({ data }) => data, (error) => reject<IndicadorGestionDTO>(error));
  swrCreateIndicador: {
    key: IndicadorGestionSWRKey,
    fetcher: (key: IndicadorGestionSWRKey, options: { arg: IndicadorCreateCommand }) => Promise<IndicadorGestionDTO>,
  } = Object.freeze({
    key: [this.createIndicadorURL, token.getToken()],
    fetcher: (_key, { arg }) => this.createIndicador(arg),
  });
  useCreateIndicador = () => {
    const { mutate } = this.useGetIndicadoresGestion();
    return useSWRMutation<IndicadorGestionDTO, APIError, IndicadorGestionSWRKey, IndicadorCreateCommand>(
      this.swrCreateIndicador.key,
      this.swrCreateIndicador.fetcher,
      { onSuccess: () => mutate() }
    );
  };
  //#endregion createIndicador

  //#region updateIndicador
  readonly updateIndicadorURL = (id: number) => this.getURL({ path: `/api/Indicadores/${id}` }).toString();
  updateIndicador = async (id: number, indicador: IndicadorUpdateCommand) => tokenizable.put<IndicadorGestionDTO>(
    this.updateIndicadorURL(id), indicador
  ).then(({ data }) => data, (error) => reject<IndicadorGestionDTO>(error));
  swrUpdateIndicador = Object.freeze({
    key: (id: number): IndicadorGestionSWRKey => [this.updateIndicadorURL(id), token.getToken()],
    fetcher: (_key: IndicadorGestionSWRKey, { arg }: { arg: { id: number; data: IndicadorUpdateCommand } }) => 
      this.updateIndicador(arg.id, arg.data),
  });
  useUpdateIndicador = () => {
    const { mutate } = this.useGetIndicadoresGestion();
    const baseKey: IndicadorGestionSWRKey = [this.updateIndicadorURL(0), token.getToken()];
    return useSWRMutation<IndicadorGestionDTO, APIError, IndicadorGestionSWRKey, { id: number; data: IndicadorUpdateCommand }>(
      baseKey,
      async (_key: IndicadorGestionSWRKey, { arg }: { arg: { id: number; data: IndicadorUpdateCommand } }) => {
        return this.updateIndicador(arg.id, arg.data);
      },
      { onSuccess: () => mutate() }
    );
  };
  //#endregion updateIndicador

  //#region deleteIndicador
  readonly deleteIndicadorURL = (id: number) => this.getURL({ path: `/api/Indicadores/${id}` }).toString();
  deleteIndicador = async (id: number, command: IndicadorDeleteCommand) => tokenizable.delete<IndicadorGestionDTO>(
    this.deleteIndicadorURL(id), { data: command }
  ).then(({ data }) => data, (error) => reject<IndicadorGestionDTO>(error));
  swrDeleteIndicador = Object.freeze({
    key: (id: number): IndicadorGestionDeleteSWRKey => [this.deleteIndicadorURL(id), token.getToken()],
    fetcher: (_key: IndicadorGestionDeleteSWRKey, { arg }: { arg: IndicadorDeleteCommand }) => 
      this.deleteIndicador(arg.id, arg),
  });
  useDeleteIndicador = () => {
    const { mutate } = this.useGetIndicadoresGestion();
    const baseKey: IndicadorGestionDeleteSWRKey = [this.deleteIndicadorURL(0), token.getToken()];
    return useSWRMutation<IndicadorGestionDTO, APIError, IndicadorGestionDeleteSWRKey, IndicadorDeleteCommand>(
      baseKey,
      async (_key: IndicadorGestionDeleteSWRKey, { arg }: { arg: IndicadorDeleteCommand }) => {
        return this.deleteIndicador(arg.id, arg);
      },
      { onSuccess: () => mutate() }
    );
  };
  //#endregion deleteIndicador

  //#endregion indicadores gestion
}

const QueriesAPI = Object.freeze(new QueriesAPIClass());

export default QueriesAPI;