export type CoberturaPost = {
    cuit?: number;
    poliza?: number;
    razonSocial?: string;
    destinatario?: string;
    tipoCertificado?: string;
}

export type CoberturaPostResponse = unknown;

export type ParametersCobertura = {
    cuit?: number;
}

export type HistItem = {
    interno: number;
    cuitEmpleador: number;
    poliza: number;
    razonSocial: string;
    destinatario: string;
    tipoCertificado: string;
    fechaHora: string;
    createdAt: string;
    createdBy: string;
};
