import axios, { AxiosError } from "axios";
import useSWR from "swr";
import { ExternalAPI } from "./api";
import TokenConfigurator from "@/types/TokenConfigurator";
import { toURLSearch } from "@/utils/utils";

//#region Types
export interface EmpresasParams {
  CUIT?: number | string;
}

export interface ParametersParamEntidad {
  entidadId?: number;
  parametroId?: number;
}

export type ParametroEntidad = {
  id: number;
  entidadId: number;
  entidadTipo: string;
  parametroId: number;
  parametroNombre: string;
  valor: string;
};

export interface Empresa {
  empresaId: number;
  cuit: number;
  razonSocial: string;
  domicilio: string;
  localidad: string;
  provincia: string;
  polizaNro?: number;
  poliza?: number;
}

export type EnviarCorreoAttachment = {
  fileName: string;
  contentType: string;
  base64Data: string;
};

export type EnviarCorreoRequest = {
  to: string[];
  cabecera: string;
  seccion: string;
  attachments: EnviarCorreoAttachment[];
};

export interface RefSector {
  id: number;
  descripcion: string;
}

export interface RefRol {
  id: string;
  nombre: string;
  nombreNormalizado: string;
  esRolHijo: boolean;
  tareas?: unknown[];
}

export interface RefCargoEmpresa {
  id: number;
  descripcion: string;
  empresaId: number;
}

export type PostUsuariosEmpresasBody = {
  usuarioId: string;
  empresaId: number;
  vigencia: string;
};

export type UsuariosEmpresasUsuarioLogueadoBody = {
  empresasId: number[];
  pageIndex: number;
  pageSize: number;
  cuit?: string;
  nombre?: string;
  email?: string;
  rol?: string;
  estado?: string;
};

export const USUARIOS_EMPRESAS_USUARIO_LOGUEADO_PAGE_INDEX = 1;
export const USUARIOS_EMPRESAS_USUARIO_LOGUEADO_PAGE_SIZE = 10;

export type UsuarioEmpresasListadoTokenVm = {
  tokenId?: string;
  validTo?: string;
};

export type UsuarioEmpresasListadoTareaVm = {
  id: number;
  tareaId: number;
  tareaDescripcion?: string;
  habilitada: boolean;
};

export type UsuarioEmpresasListadoModuloVm = {
  id: number;
  codigo: string;
  nombre?: string;
  habilitado: boolean;
  tareas: UsuarioEmpresasListadoTareaVm[];
};

export type UsuarioEmpresasListadoExclusionVm = {
  id: number;
  tablaId: number;
  tablaDescripcion?: string;
  campoId: number;
  campoDescripcion?: string;
};

export type UsuarioEmpresasListadoEmpresaVm = {
  id: number;
  usuarioId?: string;
  empresaId: number;
  empresaCUIT?: number;
  empresaRazonSocial?: string;
  fechaBaja?: string | null;
};

export type UsuarioEmpresasUsuarioLogueadoItem = {
  id: string;
  cuit: number;
  nombre?: string;
  tipo?: string;
  sectorId?: number;
  titulo?: string;
  matricula?: string;
  userName?: string;
  normalizedUserName?: string;
  email?: string;
  normalizedEmail?: string;
  emailConfirmed?: boolean;
  phoneNumber?: string;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  lockoutEnd?: string | null;
  lockoutEnabled?: boolean;
  accessFailedCount?: number;
  token?: UsuarioEmpresasListadoTokenVm;
  cargoId?: number;
  cargoDescripcion?: string;
  rol?: string;
  createdBy?: string;
  createdDate?: string;
  estado?: string;
  deletedDate?: string | null;
  modulos?: UsuarioEmpresasListadoModuloVm[];
  exclusiones?: UsuarioEmpresasListadoExclusionVm[];
  empresas?: UsuarioEmpresasListadoEmpresaVm[];
};

export type UsuariosEmpresasUsuarioLogueadoResponse = {
  index: number;
  size: number;
  pages: number;
  count: number;
  data: UsuarioEmpresasUsuarioLogueadoItem[];
};
//#endregion Types

//#region token
export const token = Object.seal(new TokenConfigurator());
//#endregion token

const tokenizable = token.configure();

export class AuthAPIClass extends ExternalAPI {
  readonly basePath =
    process.env.NEXT_PUBLIC_API_AUTH_URL || "http://fallback-prod.url";

  //#region getEmpresas
  readonly getEmpresasURL = (params: EmpresasParams = {}) =>
    this.getURL({
      path: "/api/Usuario/Empresas",
      search: toURLSearch(params),
    }).toString();

  getEmpresas = async (params: EmpresasParams = {}) =>
    tokenizable
      .get<Empresa[]>(this.getEmpresasURL(params))
      .then(async (response) => {
        if (response.status === 200) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });

  useGetEmpresas = (params: EmpresasParams = {}) =>
    useSWR([this.getEmpresasURL(params), token.getToken()], () =>
      this.getEmpresas(params)
    );
  //#endregion getEmpresas

  //#region UsuariosEmpresas (asignación / baja)
  readonly deleteUsuariosEmpresasBorrarURL = (id: number | string) =>
    this.getURL({
      path: `/api/UsuariosEmpresas/Borrar/${encodeURIComponent(String(id))}`,
    }).toString();

  deleteUsuariosEmpresasBorrar = async (id: number | string) =>
    tokenizable
      .delete(this.deleteUsuariosEmpresasBorrarURL(id))
      .then(async (response) => {
        if (response.status === 200 || response.status === 204) return;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.statusText}`)
        );
      });

  readonly postUsuariosEmpresasURL = () =>
    this.getURL({ path: "/api/UsuariosEmpresas" }).toString();

  postUsuariosEmpresas = async (body: PostUsuariosEmpresasBody) =>
    tokenizable
      .post<unknown>(this.postUsuariosEmpresasURL(), body)
      .then(async (response) => {
        if (response.status === 200 || response.status === 201) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });
  //#endregion UsuariosEmpresas (asignación / baja)

  //#region Sectores
  readonly refSectoresURL = () => this.getURL({ path: "/api/Sectores" }).toString();
  getRefSectores = async () => tokenizable.get<RefSector[]>(
    this.refSectoresURL()
  ).then(({ data }) => data);
  useGetRefSectores = () => useSWR(
    [this.refSectoresURL(), token.getToken()], () => this.getRefSectores()
  );
  //#endregion Sectores

  //#region Roles
  readonly refRolesURL = () => this.getURL({ path: "/api/Roles" }).toString();
  getRefRoles = async () => tokenizable.get<RefRol[]>(
    this.refRolesURL()
  ).then(({ data }) => data);
  useGetRefRoles = () => useSWR(
    [this.refRolesURL(), token.getToken()], () => this.getRefRoles()
  );
  //#endregion Roles

  //#region Cargos Empresa
  readonly refCargosEmpresaURL = () => this.getURL({ path: "/api/Cargos/Empresa" }).toString();
  getRefCargosEmpresa = async () => tokenizable.get<RefCargoEmpresa[]>(
    this.refCargosEmpresaURL()
  ).then(({ data }) => data);
  useGetRefCargosEmpresa = () => useSWR(
    [this.refCargosEmpresaURL(), token.getToken()], () => this.getRefCargosEmpresa()
  );
  //#endregion Cargos Empresa

  //#region EnviarCorreo Cotización
  readonly postEnviarCorreoURL = () =>
    this.getURL({ path: '/api/Email' }).toString();

  enviarCorreo = async (data: EnviarCorreoRequest) =>
    axios
      .post(this.postEnviarCorreoURL(), data, {
        headers: { 'Content-Type': 'application/json' },
      })
      .then(async (response) => {
        if (response.status === 200 || response.status === 201) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });
  //#endregion


    //GET ParametrosEntidad
  readonly getParametrosEntidadURL = (params: ParametersParamEntidad = {}) => {
    return this.getURL({ path: "/api/ParametrosEntidades", search: toURLSearch(params) }).toString();
  };
  getParametrosEntidad = async (params: ParametersParamEntidad = {}) =>
    tokenizable
      .get<ParametroEntidad[]>(this.getParametrosEntidadURL(params))
      .then(({ data }) => data);
  useGetParametrosEntidadURL = (params: ParametersParamEntidad | null = {}) =>
    useSWR(
      params === null ? null : [this.getParametrosEntidadURL(params), token.getToken()],
      () => this.getParametrosEntidad(params ?? {}),
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );
  //endregion

  //#region UsuariosEmpresas / UsuarioLogueado
  readonly postUsuariosEmpresasUsuarioLogueadoURL = () =>
    this.getURL({ path: "/api/UsuariosEmpresas/UsuarioLogueado" }).toString();

  postUsuariosEmpresasUsuarioLogueado = async (body: UsuariosEmpresasUsuarioLogueadoBody) =>
    tokenizable
      .post<UsuariosEmpresasUsuarioLogueadoResponse>(
        this.postUsuariosEmpresasUsuarioLogueadoURL(),
        body
      )
      .then(async (response) => {
        if (response.status === 200 || response.status === 201) return response.data;
        return Promise.reject(
          new AxiosError(`Error en la petición: ${response.data}`)
        );
      });

  useUsuariosEmpresasUsuarioLogueado = (body: UsuariosEmpresasUsuarioLogueadoBody | null) =>
    useSWR(
      body !== null
        ? [
            this.postUsuariosEmpresasUsuarioLogueadoURL(),
            token.getToken(),
            JSON.stringify([...body.empresasId].sort((a, b) => a - b)),
            String(body.pageIndex),
            String(body.pageSize),
          ]
        : null,
      () => this.postUsuariosEmpresasUsuarioLogueado(body!)
    );
  //#endregion UsuariosEmpresas / UsuarioLogueado
}

const AuthAPI = Object.seal(new AuthAPIClass());

export default AuthAPI;

