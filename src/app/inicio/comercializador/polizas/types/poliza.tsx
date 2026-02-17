export type ParametersPoliza = {
    CUIT?: number;
    ComercializadoresInternos?: string;
}

export type ParametersComercializador = {
    CUIL?: number;
    ComercializadoresOrganizadoresInternos?: string;
}

export type OrganizadorComercializador = {
    SRTComercializadorGOrganizadorInterno?: number;
    CUIL?: number;
}

export type GrupoOrganizadorComercializador = {
    CUIL?: number;
}

export type Poliza = {
    interno: string;
    numero: string;
    NroPoliza: string;
    CUIT: string;
    Empleador_Denominacion: string;
    Vigencia_Desde: string;
    Vigencia_Hasta: string;
    fecha: string;
};

export type EmpresaOption = {
    razonSocial: string;
    cuit?: string;
};