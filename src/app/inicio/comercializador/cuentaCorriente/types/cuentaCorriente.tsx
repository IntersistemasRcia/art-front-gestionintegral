
export type ViewCuentaCorriente = {    
    
    interno: number;
    periodo: number;
    origen?: string;
    monto: number;    /** Monto de la comisión aplicada. */
    comision: number;    /** Monto por servicios adicionales o gastos. */
    serviciosAdicionales: number;
    IVA: number;
    TotalSinIVA: number;
    TotalConIVA: number;
}

export type ViewCuentaCorrienteDetalle = {    
    
    interno: number;    /** Fecha y hora de creación o registro de la liquidación (formato ISO 8601 string). */
    fecha: string;    /** Período al que corresponde la liquidación (puede ser un año, mes o número de período). */
    periodo: number;    /** Origen o tipo de liquidación (Ej: 'POL', 'SERV', 'AJUSTE'). */
    origen: string;    /** Número de póliza asociada, si aplica. */
    polizaNumero: number;    /** CUIT del empleador o cliente. */
    empleadorCUIT: number;    /** Razón social del empleador o cliente. */
    razonSocial: string;    /** Monto base de la liquidación (sin comisiones ni servicios adicionales). */
    monto: number;    /** Monto de la comisión aplicada. */
    comision: number;    /** Monto por servicios adicionales o gastos. */
    serviciosAdicionales: number;
    IVA: number;
    TotalSinIVA: number;
    TotalConIVA: number;
}

export type ParametersEmpleadorPagosComercializador = {
    Periodo?: number;
    ComercializadoresInternos?: string;
    OrderBy?: string;
    PageIndex?: number;
    PageSize?: number;
}

export type ParametersAfipTranferencia = {
    Periodo?: number;
    CuitContribuyente?: string;
    // OrderBy?: string;
    // PageIndex?: number;
    // PageSize?: number;
}

export default ViewCuentaCorriente;
