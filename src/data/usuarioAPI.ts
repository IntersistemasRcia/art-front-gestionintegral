import axios, { AxiosError } from "axios";
import useSWR from "swr";
import { ExternalAPI } from "./api";
import UsuarioRow from "@/app/inicio/usuarios/interfaces/UsuarioRow";
import TokenConfigurator from "@/types/TokenConfigurator";
import { toURLSearch } from "@/utils/utils";
import IUsuarioDarDeBaja from "@/app/inicio/usuarios/interfaces/IUsuarioDarDeBajaReactivar";
import CargoInterface from "@/app/inicio/usuarios/interfaces/CargoInterface";

//#region Types
export interface Auditable {
  createdDate?: string;
  createdBy?: string;
  lastModifiedDate?: string;
  lastModifiedBy?: string;
  deletedDate?: string;
  deletedBy?: string;
  deletedObs?: string;
  guid?: string;
}

//#region /api/Usuario/Login types
export interface LoginCommand {
  usuario?: string;
  password?: string;
}
export interface LoginErrorResponse {
  StatusCode?: number;
  Mensaje?: string;
  message?: string;
}
export interface TokenDTO {
  tokenId?: string;
  validTo: string;
}
export interface UsuarioTareaVm extends Auditable {
  id: number;
  usuarioId?: string;
  tareaId: number;
  rolId?: string;
  rolNombre?: string;
  denegado: boolean;
}
export interface UsuarioExclusionVm {
  id: number;
  createdDate?: string;
  createdBy?: string;
  lastModifiedDate?: string;
  lastModifiedBy?: string;
  deletedDate?: string;
  deletedBy?: string;
  deletedObs?: string;
  guid?: string;
  tablaId: number;
  tablaDescripcion?: string;
  campoId: number;
  campoDescripcion?: string;
}

export type Tarea = {
  id: number;
  tareaDescripcion: string;
  habilitada: boolean;
};

export type Modulo = {
  id: number;
  codigo: number;
  nombre: string;
  habilitado: boolean;
  tareas: Tarea[];
};

export type UsuarioEmpresaSesion = {
  id: number;
  usuarioId?: string;
  empresaId: number;
  empresaCUIT?: number;
  empresaRazonSocial?: string;
  fechaBaja?: string | null;
};

export interface UsuarioVm {
  id?: string;
  cuit: number;
  nombre?: string;
  tipo?: string;
  cargoId?: number;
  cargoDescripcion?: string;
  userName?: string;
  normalizedUserName?: string;
  email?: string;
  normalizedEmail?: string;
  emailConfirmed: boolean;
  phoneNumber?: string;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnd?: string;
  lockoutEnabled: boolean;
  accessFailedCount: number;
  token: TokenDTO;
  rol?: string;
  empresaId?: number;
  empresaCUIT: number;
  empresaRazonSocial: string;
  /** Relación usuario–empresa en sesión (ids para filtros multi-empresa). */
  empresas?: UsuarioEmpresaSesion[];
  modulos?: Modulo[]; //ToDo: verificar el tipo de arreglo
  exclusiones?: UsuarioExclusionVm[];
}
export type Usuario = Omit<UsuarioVm, "token">;
//#endregion /api/Usuario/Login types
//#region /api/Usuario/GetAll types
export interface UsuarioGetAllParams {
  empresaId?: number;
  sort?: string;
  pageIndex?: number;
  pageSize?: number;
}
export interface UsuarioGetAllResult {
  data: UsuarioRow[];
}
//#endregion /api/Usuario/GetAll types

export type UsuarioUpdatePayload = {
  phoneNumber: string;
  nombre: string;
  titulo: string;
  matricula: string;
  sectorId: number;
  cargoId: number;
  password?: string;
  confirmPassword?: string;
  email: string;
};
//#region /api/Roles types
export interface RolesInterface {
  id: string;
  nombre: string;
  nombreNormalizado: string;
  esRolHijo: boolean;
}
//#endregion /api/Roles types
//#region /api/Tablas types
export interface Campo extends Auditable {
  id: number;
  nombre?: string;
  descripcion?: string;
}
export interface Tabla extends Auditable {
  id: number;
  nombre?: string;
  descripcion?: string;
  campos?: Campo[];
}
export type TablasSWRKey = [url: string, token: string];
//#endregion /api/Tablas types
//#region /api/Tablas/Usuario/{usuarioId}
export type TablasUsuarioParams = { usuarioId: string };
export type TablasUsuarioSWRKey = [url: string, token: string, params: string];
//#endregion /api/Tablas/Usuario/{usuarioId}
//#endregion Types

//#region EnviarCorreo Cotización Types
export type EnviarCorreoAttachment = {
  fileName: string;
  contentType: string;
  base64Data: string;
};

export type EnviarCorreoRequest = {
  to: string[];
  cuerpo: string;
  attachments: EnviarCorreoAttachment[];
};
//#endregion EnviarCorreo Cotización Types

//#region token
export const token = Object.seal(new TokenConfigurator());
//#endregion token

const tokenizable = token.configure();

export class UsuarioAPIClass extends ExternalAPI {
  readonly basePath = (() => {
    const url = process.env.NEXT_PUBLIC_API_AUTH_URL || "http://fallback-prod.url";
    // Normalizar: remover trailing slash y /api si existe
    const normalized = url.replace(/\/api\/?$/, '').replace(/\/$/, '');
    // Log para depuración (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('[UsuarioAPI] basePath configurado:', normalized);
      console.log('[UsuarioAPI] NEXT_PUBLIC_API_AUTH_URL:', process.env.NEXT_PUBLIC_API_AUTH_URL);
    }
    return normalized;
  })();
  //#region login
  readonly loginURL = () => {
    const url = this.getURL({ path: "/api/Usuario/Login" }).toString();
    // Log para depuración (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('[UsuarioAPI] loginURL:', url);
    }
    return url;
  };
  login = async (login: LoginCommand) =>
    axios.post<UsuarioVm>(this.loginURL(), login).then(
      ({ data }) => data,
      (error) => {
        if (axios.isAxiosError(error)) {
          const responseData = error.response?.data as LoginErrorResponse | string | undefined;
          const apiMessage =
            typeof responseData === "string"
              ? responseData
              : responseData?.Mensaje || responseData?.message;

          console.error(
            "Authentication failed:",
            error.response?.data || error.message
          );

          // Propaga el mensaje de la API (ej: "Confirmación Pendiente...")
          throw new Error(apiMessage || "Credenciales inválidas");
        } else if (error instanceof Error) {
          console.error("An unexpected error occurred:", error.message);
          throw error;
        } else {
          console.error("An unexpected error occurred:", error);
          throw new Error("Error inesperado al iniciar sesión");
        }
      }
    );
  useLogin = (login: LoginCommand) =>
    useSWR([this.loginURL()], () => this.login(login));
  //#endregion login

  //#region getAll
  readonly getAllURL = (params: UsuarioGetAllParams = {}) =>
    this.getURL({
      path: "/api/Usuario/GetAll",
      search: toURLSearch(params),
    }).toString();
  getAll = async (params: UsuarioGetAllParams = {}) =>
    tokenizable
      .get<UsuarioGetAllResult>(this.getAllURL(params))
      .then(async (response) => {
        if (response.status === 200) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });
  useGetAll = (params?: UsuarioGetAllParams | null) =>
    useSWR(
      params === null ? null : [this.getAllURL(params ?? {}), token.getToken()],
      () => this.getAll(params ?? {})
    );
  //#endregion getAll

  //#region getRoles
  readonly getRolesURL = () => this.getURL({ path: "/api/Roles" }).toString();
  getRoles = async (query: any = {}) =>
    tokenizable
      .get<RolesInterface[]>(this.getRolesURL(), { data: query })
      .then(async (response) => {
        if (response.status === 200) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });
  useGetRoles = (query: any = {}) =>
    useSWR([this.getRolesURL(), token.getToken()], () => this.getRoles(query));
  //#endregion getRoles

  //#region registrar
  readonly registrarURL = () =>
    this.getURL({ path: "/api/Usuario" }).toString();
  registrar = async (data: any) =>
    axios.post(this.registrarURL(), data).then(async (response) => {
      if (response.status === 200) return response.data;
      return Promise.reject(
        new AxiosError(`Error en la petición: ${response.data}`)
      );
    });
  useRegistrar = (data: any) =>
    useSWR([this.registrarURL()], () => this.registrar(data));
  //#endregion registrar

  //#region Update
  readonly updateURL = (usuarioId: string) =>
    this.getURL({ path: `/api/Usuario/${usuarioId}` }).toString();
  update = async (usuarioId: string, data: UsuarioUpdatePayload) =>
    tokenizable
      .put(this.updateURL(usuarioId), data)
      .then(async (response) => {
        if (response.status === 200) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });
  useUsuarioUpdate = (usuarioId: string, data: UsuarioUpdatePayload) =>
    useSWR([this.updateURL(usuarioId)], () => this.update(usuarioId, data));
  //#endregion Update

  //#region tablas
  readonly tablasURL = this.getURL({ path: "/api/Tablas" }).toString();
  tablas = async () =>
    tokenizable.get<Tabla[]>(this.tablasURL).then(({ data }) => data);
  swrTablas = Object.freeze({
    Key: [this.tablasURL, token.getToken()],
    Fetcher: this.tablas,
  });
  useTablas = () => useSWR(this.swrTablas.Key, this.swrTablas.Fetcher);
  //#endregion tablas

  //#region tablasUsuario
  readonly tablasUsuarioURL = ({ usuarioId }: TablasUsuarioParams) =>
    this.getURL({ path: `/api/Tablas/Usuario/${usuarioId}` }).toString();
  tablasUsuario = async (params: TablasUsuarioParams) =>
    tokenizable
      .get<Tabla[]>(this.tablasUsuarioURL(params))
      .then(({ data }) => data);
  swrTablasUsuario = Object.freeze({
    Key: (params: TablasUsuarioParams): TablasUsuarioSWRKey => [
      this.tablasUsuarioURL(params),
      token.getToken(),
      JSON.stringify(params),
    ],
    Fetcher: (key: TablasUsuarioSWRKey) =>
      this.tablasUsuario(JSON.parse(key[2])),
  });
  useTablasUsuario = (params: TablasUsuarioParams) =>
    useSWR(this.swrTablasUsuario.Key(params), this.swrTablasUsuario.Fetcher);
  //#endregion tablasUsuario

  //#region actualizarTareas
  readonly tareasUpdateURL = (usuarioId: string) =>
    this.getURL({
      path: `/api/UsuariosTareas/Usuario/${usuarioId}`,
    }).toString();
  tareasUpdate = async (
    usuarioId: string,
    data: Array<{
      moduloId: number;
      habilitado: boolean;
      tareas: Array<{
        tareaId: number;
        moduloId: number;
        habilitada: boolean;
      }>;
    }>
  ) =>
    tokenizable
      .put(
        this.tareasUpdateURL(usuarioId),
        data // Solo los datos van en el body
      )
      .then(async (response) => {
        if (response.status === 200) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });
  useTareasUpdate = (
    usuarioId: string,
    data: Array<{
      moduloId: number;
      habilitado: boolean;
      tareas: Array<{
        tareaId: number;
        moduloId: number;
        habilitada: boolean;
      }>;
    }>
  ) =>
    useSWR(
      [this.tareasUpdateURL(usuarioId), token.getToken(), JSON.stringify(data)],
      () => this.tareasUpdate(usuarioId, data)
    );
  //#endregion actualizarTareas

  //#region DarDeBaja Usuario
  readonly darDeBajaURL = () =>
    this.getURL({ path: `/api/Usuario/DarDeBaja` }).toString();
  darDeBaja = async (data: IUsuarioDarDeBaja) =>
    axios.put(this.darDeBajaURL(), data).then(async (response) => {
      if (response.status === 200) return response.data;
      return Promise.reject(
        new AxiosError(`Error en la petición: ${response.data}`)
      );
    });
  useUsuarioDarDeBaja = (data: IUsuarioDarDeBaja) =>
    useSWR([this.darDeBajaURL(), token.getToken()], () => this.darDeBaja(data));
  //#endregion DarDeBaja Usuario

  //#region Reactivar Usuario
  readonly reactivarURL = () =>
    this.getURL({ path: `/api/Usuario/Reactivar` }).toString();
  reactivar = async (data: IUsuarioDarDeBaja) =>
    axios.put(this.reactivarURL(), data).then(async (response) => {
      if (response.status === 200) return response.data;
      return Promise.reject(
        new AxiosError(`Error en la petición: ${response.data}`)
      );
    });
  useUsuarioReactivar = (data: IUsuarioDarDeBaja) =>
    useSWR([this.reactivarURL(), token.getToken()], () => this.reactivar(data));
  //#endregion Reactivar Usuario

  //#region Cargos

  readonly getCargosUrl = (empresaId: number) =>
    this.getURL({ path: `/api/Cargos/Empresa/${empresaId}` }).toString();
  getCargos = async (query: any = {}) =>
    tokenizable
      .get<CargoInterface[]>(this.getCargosUrl(query.empresaId), {
        data: query,
      })
      .then(async (response) => {
        if (response.status === 200) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });
  useGetCargos = (query: any = {}) =>
    useSWR([this.getCargosUrl(query.empresaId), token.getToken()], () =>
      this.getCargos(query)
    );

  //#endregion

  //#region Reestablecer Usuario

  readonly postReestablecerURL = () =>
    this.getURL({ path: `/api/Usuario/RecuperarClaveEmail` }).toString();
  reestablecer = async (email: string) =>
    tokenizable
      .post(this.postReestablecerURL(), { email })
      .then(async (response) => {
        if (response.status === 200) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });
  useReestablecer = (query: any = {}) => {
    console.log("endpoint", this.postReestablecerURL());
    return useSWR([this.postReestablecerURL(), token.getToken()], () =>
      this.reestablecer(query)
    );
  };

  //#endregion

  //#region CambiarClave Usuario

  readonly postCambiarClaveURL = () =>
    this.getURL({ path: `/api/Usuario/ReestablecerClave` }).toString();
  cambiarClave = async (data: { email?: string, password?: string, token?: string, confirmPassword?: string }) =>
    tokenizable
      .post(this.postCambiarClaveURL(), {
        email: data.email, 
        token: data.token, 
        password: data.password, 
        confirmPassword: data.confirmPassword 
      })
      .then(async (response) => {
        if (response.status === 200) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });
  useCambiarClave = (query: any) =>
    useSWR([this.postCambiarClaveURL(), token.getToken()], () =>
      this.cambiarClave(query)
    );
  //#endregion

  //#region EnviarCorreo Usuario

  readonly postReenviarCorreoURL = () =>
    this.getURL({ path: `/api/Usuario/EnviarCorreoActivacion` }).toString();
  reenviarCorreo = async (email: string) =>
    tokenizable
      .post(this.postReenviarCorreoURL(), { email: email })
      .then(async (response) => {
        if (response.status === 200) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });
  useReenviarCorreo = (query: any = {}) =>
    useSWR([this.postReenviarCorreoURL(), token.getToken()], () =>
      this.reenviarCorreo(query)
    );
  //#endregion


  //#region Confirmar Email
  readonly confirmarEmailURL = () =>
    this.getURL({ path: `/api/Usuario/ConfirmarEmail` }).toString();
  confirmarEmail = async (token: string, email: string) =>
    tokenizable
      .post(this.confirmarEmailURL(), { email, token })
      .then(async (response) => {
        if (response.status === 200) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });
  useConfirmarEmail = (query: any) =>
    useSWR(
      [this.confirmarEmailURL(), token.getToken()],
      () => this.confirmarEmail(query.token, query.email)
    );

}

const UsuarioAPI = Object.seal(new UsuarioAPIClass());

export default UsuarioAPI;
