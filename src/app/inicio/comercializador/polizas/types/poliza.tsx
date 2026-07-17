import type { SRTComercializadorAsociadoNodo } from "@/utils/srt/srtComercializadorAsociadoUtils";

export type { SRTComercializadorAsociadoNodo };

export type ParametersPoliza = {
    CUIT?: number;
    ComercializadoresInternos?: string;
    SoloActivas?: boolean;
    VerIndependientes?: boolean;
}

export type ParametersPolizaAcotada = {
    ComercializadoresInternos?: string;
}

/** Contrato unificado de SRTPolizas y SRTPolizas/UsuarioLogueado. */
export type SRTPolizaAcotada = {
    interno: number;
    cuit: number;
    numero: number;
    numeroSolicitud: number;
    codigoOperacion?: number;
    codigoMotivoSorteo?: number;
    referenciaArt?: string;
    ciiu?: number;
    ciiuDescripcion?: string;
    cuotaResultante?: number;
    cantTrabajadores?: number;
    masaSalarial?: number;
    bonificacion?: string;
    clausulaPenal?: string;
    unicoEstablecimiento?: number;
    esPrestadorMedico?: number;
    refEmpleadorInterno: number;
    srtcomercializadorInterno: number;
    srtComercializadorDenominacion: string;
    firmanteEmpleadorInterno?: number;
    firmanteArtinterno?: number;
    empleadorDenominacion: string;
    empleadorEmail?: string;
    empleadorTelefono?: string;
    empleadorMovil?: string;
    empleadorDomicilioCalle?: string;
    empleadorDomicilioAltura?: string;
    empleadorDomicilioPiso?: string;
    empleadorDomicilioDepto?: string;
    empleadorDomicilioCp?: number;
    empleadorDomicilioLocalidadCodigo?: number;
    empleadorDomicilioLocalidadDescripcion?: string;
    empleadorDomicilioProvinciaCodigo?: number;
    empleadorDomicilioProvinciaDescripcion?: string;
    estadoCodigo: number;
    estadoFecha: string;
    alicuotaPagoIlt?: number;
    alicuotaSumaFija?: number;
    alicuotaCuotaVariable?: number;
    alicuotaNivel?: number;
    alicuotaFfe?: number;
    vigenciaDesde: string;
    vigenciaHasta: string;
    movimientoCodigoOperacion?: number;
    movimientoDescripcionOperacion?: string;
    movimientoFecha?: string;
    movimientoPdmId?: number;
    archivo?: string;
    archivoBase64?: string;
    diasParaVencimiento?: number;
    comercializadorCuil: number;
    comercializadorMatricula: string;
    comercializadorEmail: string;
    comercializadorTelefono: string;
    comercializadorMovil: string;
    comercializadorReferenteRazonSocial: string;
    firmanteArtCuil?: number;
    firmanteArtDenominacion?: string;
    firmanteEmpleadorCuil?: number;
    firmanteEmpleadorDenominacion?: string;
    /** Resumen plano del asociado inmediato (compat). */
    srtComercializadorAsociadoInterno: number | null;
    /** @deprecated Preferir `srtComercializadorAsociado` nested. */
    srtComercializadorAsociadoDescripcion?: string | null;
    /** @deprecated Preferir `srtComercializadorAsociado` nested. */
    srtComercializadorAsociadoTipo?: string | null;
    /**
     * Jerarquía asociativa: Organizador/Grupo.
     * Agrupar/filtrar por `asociadoId`; `interno` es el registro de relación.
     */
    srtComercializadorAsociado?: SRTComercializadorAsociadoNodo | null;
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
