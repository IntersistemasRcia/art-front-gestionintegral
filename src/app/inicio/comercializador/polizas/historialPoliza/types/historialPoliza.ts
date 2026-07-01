export type ComercializadorAsociado = {
  tipo: string;
  asociadoId: number;
  descripcion: string | null;
  interno: number;
  cuil: number;
  razonSocial: string | null;
  fechaBaja: string | null;
  deletedAt: string | null;
  srtComercializadoresInternos: number[];
};

export type Comercializador = {
  interno: number;
  cuil: number;
  matricula: string | null;
  email: string | null;
  telefono: string | null;
  movil: string | null;
  referenteDatosInterno: number;
  referenteRazonSocial: string;
  comercializadorAsociados: ComercializadorAsociado[];
};

export type HistorialRow = {
  interno: number;
  srtPolizaInterno: number;
  srtComercializadorInterno: number;
  fechaHasta: string;
  comercializadorcuit?: number;
  comercializadorrazonsocial?: string;
  srtComercializadorAsociadoDescripcion?: string | null;
  numeroPoliza: string;
};
