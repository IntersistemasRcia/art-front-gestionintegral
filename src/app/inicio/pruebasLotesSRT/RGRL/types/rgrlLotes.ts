import type { ApiFormularioRGRL } from "@/app/inicio/empleador/formularioRGRL/types/rgrl";

export type { ApiFormularioRGRL };

export type RgrlLotesResponse = {
  index: number;
  size: number;
  pages: number;
  count: number;
  data: ApiFormularioRGRL[];
};


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

export type SRTPublicacionesCIIUConversionesParams = {
  rev4Ciiu6d?: number;
};

export type SRTPoliza = {
  interno: number;
  cuit: number;
  numero: number;
  ciiu: number;
};

export type SRTCIIUConversion = {
  rev4Ciiu6d: number;
  rev3Ciiu6d: number;
};

export type SRTEstablecimiento = {
  interno: number;
  superficie: number;
  cantTrabajadores: number;
  fechaBaja: string | null;
  bajaMotivo: number | null;
  estadoAccion: string;
  ciiu: number;
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