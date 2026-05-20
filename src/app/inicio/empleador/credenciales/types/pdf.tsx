export type AfiliadoCredencial = {
  NombreEmpleado?: string;
  CUIL?: string;
};

export type PolizaCredencial = {
  empleador_Denominacion?: string;
  cuit?: string | number;
  numero?: string | number;
};

export type CredencialPdfAssets = {
  frontImageUrl?: string;
  qrImageUrl?: string;
  srtImageUrl?: string;
  logoImageUrl?: string;
};

export type CredencialPdfInput = {
  afiliado?: AfiliadoCredencial;
  poliza?: PolizaCredencial[];
  assets?: CredencialPdfAssets;
  fileName?: string;
};
