
export type ARCAparams = {
    CUIL?: number;
}

export type ARCAApiResponse = {
    fechaNacimiento?: string;
    nombre?: string;
    apellido?: string;
    razonSocial?: string;
    tipoDocumento?: string;
    numeroDocumento?: number;
    tipoPersona?: string;
    tipoClave?: string;
    estadoClave?: string;
    claveInactivaAsociada?: number;
    fechaFallecimiento?: string | null;
    formaJuridica?: string;
    descripcionActividadPrincipal?: string;
    idActividadPrincipal?: number;
    periodoActividadPrincipal?: string;
    mesCierre?: number;
    idPersona?: number;
    fechaContratoSocial?: string | null;
    ciiU1?: number;
    ciiU2?: number;
    ciiU3?: number;
    domicilios?: Array<{
        direccion?: string;
        calle?: string;
        numero?: string;
        piso?: string;
        sector?: string;
        torre?: string;
        manzana?: string;
        localidad?: string;
        descripcionProvincia?: string;
        idProvincia?: number;
        codigoPostal?: string;
        tipoDomicilio?: string;
        estadoDomicilio?: string;
        oficinaDptoLocal?: string;
        datoAdicional?: string;
        tipoDatoAdicional?: string;
    }>;
};