export type DenunciaCabecera = {
  trabajador?: {
    cuil?: number | string | null;
    nombre?: string | null;
    docTipo?: string | null;
    docNumero?: string | number | null;
    fechaNacimiento?: string | null;
    sexo?: string | null;
    correo?: string | null;
    domicilioCalle?: string | null;
    domicilioNro?: string | number | null;
    domicilioPiso?: string | number | null;
    domicilioDpto?: string | null;
    telefono?: string | null;
  };
  empleador?: {
    cuit?: string | number | null;
    razonSocial?: string | null;
    domicilioCalle?: string | null;
    domicilioNro?: string | number | null;
    domicilioPiso?: string | number | null;
    domicilioDpto?: string | null;
    telefonos?: string | null;
    correos?: string | null;
    poliza?: string | number | null;
  };
  establecimiento?: {
    cuit?: string | number | null;
    razonSocial?: string | null;
    domicilioCalle?: string | null;
    domicilioNro?: string | number | null;
    domicilioPiso?: string | number | null;
    domicilioDpto?: string | null;
  };
  siniestro?: {
    dia?: string | null;
    hora?: string | null;
    inicioInasistencia?: string | null;
    descripcion?: string | null;
  };
};

export type PantallaAdministrativaProps = {
  denunciaNro?: number | string | null;
  empleadoNombre?: string | null;
  empleadoCuil?: number | string | null;
  empleadoDocTipo?: string | null;
  empleadoDocNumero?: string | number | null;
  empleadorCuit?: string | number | null;
  empleadorRazonSocial?: string | null;
  cabecera?: DenunciaCabecera;
};

