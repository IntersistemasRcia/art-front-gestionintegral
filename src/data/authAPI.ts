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
  getParametrosEntidad = async (params: ParametersParamEntidad = {}) => tokenizable.get(
    this.getParametrosEntidadURL(params),
  ).then(({ data }) => data);
  useGetParametrosEntidadURL = (params: ParametersParamEntidad = {}) => useSWR(
    [this.getParametrosEntidadURL(params), token.getToken()], () => this.getParametrosEntidad(params),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  //endregion



  
}

const AuthAPI = Object.seal(new AuthAPIClass());

export default AuthAPI;

