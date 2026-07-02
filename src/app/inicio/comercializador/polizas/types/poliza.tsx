export type ParametersPoliza = {
    CUIT?: number;
    ComercializadoresInternos?: string;
    SoloActivas?: boolean;
    VerIndependientes?: boolean;
}

export type ParametersPolizaAcotada = {
    ComercializadoresInternos?: string;
}

export type SRTPolizaAcotada = {
    interno: number;
    cuit: number;
    numero: number;
    numeroSolicitud: number;
    refEmpleadorInterno: number;
    srtcomercializadorInterno: number;
    srtComercializadorDenominacion: string;
    empleadorDenominacion: string;
    estadoCodigo: number;
    estadoFecha: string;
    vigenciaDesde: string;
    vigenciaHasta: string;
    comercializadorCuil: number;
    comercializadorMatricula: string;
    comercializadorEmail: string;
    comercializadorTelefono: string;
    comercializadorMovil: string;
    comercializadorReferenteRazonSocial: string;
    srtComercializadorAsociadoInterno: number;
    srtComercializadorAsociadoDescripcion: string;
}

export type ParametersComercializador = {
    CUIL?: number;
    ComercializadoresOrganizadoresInternos?: string;
    SRTComercializadorOrganizadorInterno?: number;
}

export type OrganizadorComercializador = {
    SRTComercializadorGOrganizadorInterno?: number;
    CUIL?: number;
}

export type GrupoOrganizadorComercializador = {
    CUIL?: number;
}

export type ParametersComercializadoresAsociados = {
    CUIL?: number;
    SRTComercializadorInterno?: number;
    IncluirInactivos?: boolean;
}

export type SRTComercializadorAsociado = {
    interno: number;
    srtComercializadorInterno: number;
    tipo: string;
    asociadoId: number;
    descripcion: string;
    cuil: number;
    razonSocial: string;
    fechaBaja: string | null;
}

export type Poliza = {
    interno: string;
    numero: string;
    NroPoliza: string;
    CUIT: string;
    Empleador_Denominacion: string;
    Comercializador_Denominacion: string;
    srtComercializadorInterno: number;
    Vigencia_Desde: string;
    Vigencia_Hasta: string;
    fecha: string;
};

export type EmpresaOption = {
    razonSocial: string;
    cuit?: string;
};