import useSWR from "swr";
import { ExternalAPI } from "./api";
import { token } from "./usuarioAPI";
import { toURLSearch } from "@/utils/utils";

const tokenizable = token.configure();

export type SRTEnviosRGRLParams = {
  SrtenviosRgrlinterno?: number;
  ArchivoNombre?: string;
  PageNumber?: number;
  PageSize?: number;
  OrderBy?: string;
};

export type SRTEnviosRGRLRespuestasParams = {
  SrtenviosRgrlinterno?: number;
  PageNumber?: number;
  PageSize?: number;
};

export type SRTEnvioRGRLRespuesta = {
  interno: number;
  srtenviosRgrlinterno: number;
  respuestasFormularioInterno: number;
  registro: string;
  createdAt: string | null;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type SRTEnviosRGRLRespuestasResponse = {
  index: number;
  size: number;
  pages: number;
  count: number;
  data: SRTEnvioRGRLRespuesta[];
};

export type SRTEnvioRGRL = {
  interno: number;
  archivoTipo: string;
  archivoNombre: string;
  envioFechaHora: string | null;
  envioSecuencia: number | null;
};

export type SRTEnviosRGRLResponse = {
  index: number;
  size: number;
  pages: number;
  count: number;
  data: SRTEnvioRGRL[];
};

export class SrtAPIClass extends ExternalAPI {
  readonly basePath = process.env.NEXT_PUBLIC_API_SRT_URL || 'http://fallback-prod.url';

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
}

const SrtAPI = Object.seal(new SrtAPIClass()) as SrtAPIClass;

export default SrtAPI;
