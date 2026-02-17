import { AxiosError } from "axios";
import useSWR from "swr";
import { ExternalAPI } from "./api";
import TokenConfigurator from "@/types/TokenConfigurator";
import { toURLSearch } from "@/utils/utils";

//#region Types
export interface EmpresasParams {
  CUIT?: number | string;
}

export interface Empresa {
  empresaId: number;
  cuit: number;
  razonSocial: string;
  domicilio: string;
  localidad: string;
  provincia: string;
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
}

const AuthAPI = Object.seal(new AuthAPIClass());

export default AuthAPI;

