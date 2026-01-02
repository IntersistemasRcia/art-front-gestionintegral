import { s } from "react-querybuilder/dist/index-Dxdojb6L";
import type { SelectChangeEvent } from "@mui/material/Select";

// Interface for detailed incident/accident report
export type DenunciaCreate = {
  // Denuncia/Siniestro Information
  denunciaNro: number;
  siniestroNro: number;
  siniestroTipo: string;

  // Employer Information (emp)
  empCuit: number;
  empPoliza: number;
  empRazonSocial: string;
  empCiiu: number;
  empDomicilioCalle: string;
  empDomicilioNro: string;
  empDomicilioPiso: string;
  empDomicilioDpto: string;
  empDomicilioEntreCalle1: string;
  empDomicilioEntreCalle2: string;
  empCodLocalidad: string;
  empCodPostal: number;
  empTelefonos: string;
  empeMail: string;

  // Employer Occurrence Information (empOc)
  empOcCuit: number;
  empOcRazonSocial: string;
  empOcEstablecimiento: string;
  empOcCiiu: number;
  empOcDomicilioCalle: string;
  empOcDomicilioNro: string;
  empOcDomicilioPiso: string;
  empOcDomicilioDpto: string;
  empOcDomicilioEntreCalle1: string;
  empOcDomicilioEntreCalle2: string;
  empOcCodLocalidad: string;
  empOcCodPostal: number;
  empOcSubContrato: string;
  empOcTelefonos: string;
  empOceMail: string;

  // Employer Establishment Information (empEst)
  empEstCuit: number;
  empEstRazonSocial: string;
  empEstEstablecimiento: string;
  empEstCiiu: number;
  empEstDomicilioCalle: string;
  empEstDomicilioNro: string;
  empEstDomicilioPiso: string;
  empEstDomicilioDpto: string;
  empEstDomicilioEntreCalle1: string;
  empEstDomicilioEntreCalle2: string;
  empEstCodLocalidad: string;
  empEstCodPostal: number;
  empEstTelefonos: string;
  empEsteMail: string;

  // Provider Information
  prestadorCuit: number;

  // Affiliate (Worker) Information (afi)
  afiCuil: number;
  afiDocTipo: string;
  afiDocNumero: number;
  afiNombre: string;
  afiFechaNacimiento: number;
  afiSexo: string;
  afiEstadoCivil: string;
  afiNacionalidad: number;
  afiDomicilioCalle: string;
  afiDomicilioNro: string;
  afiDomicilioPiso: string;
  afiDomicilioDpto: string;
  afiDomicilioEntreCalle1: string;
  afiDomicilioEntreCalle2: string;
  afiCodLocalidad: string;
  afiCodPostal: number;
  afieMail: string;
  afiTelefono: string;
  afiObraSocial: string;

  // Additional Information
  comentario: string;
  origenIngreso: string;
  trasladoTipo: string;
  avisoTrabajadorFueraNomina: boolean | null;
  avisoEmpleadorSinContratoVigente: boolean | null;
  estado: number;
  denunciaCanalIngresoInterno: number;
}

// Formulario de Denuncia de Siniestro - Tipos basados en las imágenes
export interface DenunciaFormData {
  // Paso 1: Datos Iniciales
  // Contacto Inicial
  telefonos: string;
  apellidoNombres: string;
  relacionAccidentado: string;

  // Información del Siniestro
  tipoDenuncia: 'AccidenteTrabajo' | 'Enfermedad' | '';
  tipoSiniestro: string;
  enViaPublica: 'Si' | 'No' | '';

  // Accidente de Trabajo
  fechaOcurrencia: string;
  hora: string;
  calle: string;
  nro: string;
  piso: string;
  dpto: string;
  entreCalle: string;
  entreCalleY: string;
  descripcion: string;
  codLocalidad: string;
  codPostal: string;
  // Nombre de la localidad (accidente) seleccionada en Datos Iniciales
  localidadAccidente: string;
  // Nombre de la provincia asociada a la localidad seleccionada
  litProvincia: string;
  // Paso 2: Datos del Trabajador - código de localidad específico del trabajador
  codLocalidadTrabajador: string;
  // Nombre de la localidad del trabajador (opcional)
  localidadTrabajador: string;
  // Nombre de la provincia asociada a la localidad del trabajador
  litProvinciaTrabajador: string;

  // Paso 2: Datos del Trabajador
  cuil: string;
  docTipo: string;
  docNumero: string;
  nombre: string;
  fechaNac: string;
  sexo: string;
  estadoCivil: string;
  nacionalidad: string;
  obraSocialCodigo: string;
  obraSocial: string;
  domicilioCalle: string;
  domicilioNro: string;
  domicilioPiso: string;
  domicilioDpto: string;
  domicilioEntreCalle1: string;
  domicilioEntreCalle2: string;
  telefono: string;
  email: string;
  localidad: string;
  codPostalTrabajador: string;

  // Trabajadores relacionados (tabla)
  trabajadoresRelacionados: TrabajadorRelacionado[];

  // Paso 3: Datos del Siniestro (Estado del Trabajador)
  estaConsciente: 'Ignora' | 'Si' | 'No' | '';
  color: string;
  habla: 'Ignora' | 'Si' | 'No' | '';
  gravedad: 'Ignora' | 'Leve' | 'Grave' | 'Critico' | '';
  respira: 'Ignora' | 'Si' | 'No' | '';
  observaciones: string;
  tieneHemorragia: 'Ignora' | 'Si' | 'No' | '';
  contextoDenuncia: 'Ignora' | 'Urgente' | 'Normal' | '';

  // ROAM
  roam: 'No' | 'Si' | '';
  roamNro: string;
  roamAno: string;
  roamCodigo: string;
  roamDescripcion: string;

  // Tipo de Traslado
  tipoTraslado: string;
  prestadorTraslado: string;

  // Prestador Inicial
  prestadorInicialCuit: string;
  prestadorInicialRazonSocial: string;
  // Establecimiento (datos del establecimiento)
  establecimientoCuit: string;
  establecimientoNombre: string;
  establecimientoCiiu: string;
  establecimientoCalle: string;
  establecimientoNumero: string;
  establecimientoPiso: string;
  establecimientoDpto: string;
  establecimientoCodLocalidad: string;
  establecimientoCodPostal: string;
  establecimientoTelefono: string;
  establecimientoEmail: string;

  // Verificación de Contacto Inicial
  verificaContactoInicial: string;

  // Paso 4: Confirmación
  // Archivos adjuntos
  archivosAdjuntos: File[];

  // Aceptación de términos
  aceptoTerminos: boolean;

  // Datos del Empleador (solapa adicional)
  empCuit: string;
  empPoliza: string;
  empRazonSocial: string;
  empDomicilioCalle: string;
  empDomicilioNro: string;
  empDomicilioPiso: string;
  empDomicilioDpto: string;
  empDomicilioEntreCalle1: string;
  empDomicilioEntreCalle2: string;
  empCodLocalidad: string;
  empCodPostal: string;
  empTelefonos: string;
  empEmail: string;
}

export interface TrabajadorRelacionado {
  trabajador: string;
  empresa: string;
  periodo: string;
  origen: string;
}

// Opciones para dropdowns
export const TIPO_DOCUMENTO = [
  { value: 'DNI', label: 'DNI' },
  { value: 'LC', label: 'LC' },
  { value: 'LE', label: 'LE' },
  { value: 'CI', label: 'CI' },
  { value: 'PASAPORTE', label: 'Pasaporte' }
];

export const ESTADO_CIVIL = [
  { value: 'SOLTERO', label: 'Soltero/a' },
  { value: 'CASADO', label: 'Casado/a' },
  { value: 'DIVORCIADO', label: 'Divorciado/a' },
  { value: 'VIUDO', label: 'Viudo/a' },
  { value: 'CONCUBINATO', label: 'Concubinato' }
];

export const RELACION_ACCIDENTADO = [
  { value: 'TRABAJADOR', label: 'Trabajador' },
  { value: 'FAMILIAR', label: 'Familiar' },
  { value: 'EMPLEADOR', label: 'Empleador' },
  { value: 'COMPAÑERO', label: 'Compañero de Trabajo' },
  { value: 'TESTIGO', label: 'Testigo' },
  { value: 'OTRO', label: 'Otro' }
];

export const COLORES = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'PALIDO', label: 'Pálido' },
  { value: 'CIANÓTICO', label: 'Cianótico' },
  { value: 'RUBICUNDO', label: 'Rubicundo' }
];

export const TIPOS_TRASLADO = [
  { value: 'AMBULANCIA_UTIM', label: 'Ambulancia UTIM' },
  { value: 'AMBULANCIA_CSM', label: 'Ambulancia CSM' },
  { value: 'REMIS', label: 'Remis' },
  { value: 'PROPIO', label: 'Propio' }
];

// Estado inicial del formulario
export const initialDenunciaFormData: DenunciaFormData = {
  // Paso 1
  telefonos: '',
  apellidoNombres: '',
  relacionAccidentado: 'EMPLEADOR',
  tipoDenuncia: '',
  tipoSiniestro: '',
  enViaPublica: '',
  fechaOcurrencia: '',
  hora: '',
  calle: '',
  nro: '',
  piso: '',
  dpto: '',
  entreCalle: '',
  entreCalleY: '',
  descripcion: '',
  codLocalidad: '',
  codPostal: '',
  localidadAccidente: '',
  litProvincia: '',
  codLocalidadTrabajador: '',
  localidadTrabajador: '',
  litProvinciaTrabajador: '',

  // Datos del Empleador (nueva solapa)
  empCuit: '',
  empPoliza: '',
  empRazonSocial: '',
  empDomicilioCalle: '',
  empDomicilioNro: '',
  empDomicilioPiso: '',
  empDomicilioDpto: '',
  empDomicilioEntreCalle1: '',
  empDomicilioEntreCalle2: '',
  empCodLocalidad: '',
  empCodPostal: '',
  empTelefonos: '',
  empEmail: '',

  // Paso 2
  cuil: '',
  docTipo: '',
  docNumero: '',
  nombre: '',
  fechaNac: '',
  sexo: '',
  estadoCivil: '',
  nacionalidad: '200', // Argentina por defecto
  obraSocial: '',
  obraSocialCodigo: '',
  domicilioCalle: '',
  domicilioNro: '',
  domicilioPiso: '',
  domicilioDpto: '',
  domicilioEntreCalle1: '',
  domicilioEntreCalle2: '',
  telefono: '',
  email: '',
  localidad: '',
  codPostalTrabajador: '',
  trabajadoresRelacionados: [],

  // Paso 3
  estaConsciente: '',
  color: '',
  habla: '',
  gravedad: '',
  respira: '',
  observaciones: '',
  tieneHemorragia: '',
  contextoDenuncia: '',
  roam: '',
  roamNro: '',
  roamAno: '',
  roamCodigo: '',
  roamDescripcion: '',
  tipoTraslado: '',
  prestadorTraslado: '',
  prestadorInicialCuit: '',
  prestadorInicialRazonSocial: '',
  establecimientoCuit: '',
  establecimientoNombre: '',
  establecimientoCiiu: '',
  establecimientoCalle: '',
  establecimientoNumero: '',
  establecimientoPiso: '',
  establecimientoDpto: '',
  establecimientoCodLocalidad: '',
  establecimientoCodPostal: '',
  establecimientoTelefono: '',
  establecimientoEmail: '',
  verificaContactoInicial: '',

  // Paso 4
  archivosAdjuntos: [],
  aceptoTerminos: false
};

export type DenunciaGetAll = {
  // Denuncia/Siniestro Information
  interno: number;
  denunciaNro: number;
  siniestroNro: number;
  siniestroTipo: string;
  empCuit: number;
  empPoliza: number;
  empRazonSocial: string;
};

export type DenunciaQueryParams = {
  Estado?: number;
  PageIndex?: number;
  PageSize?: number;
  EmpCuit?: number;
  orderBy?: string;
};

export type DenunciaQueryParamsID = {
  id?: number;
};

// API Response type for paginated denuncias
export type DenunciasApiResponse = {
  data: DenunciaGetAll[];
  count?: number;
  pages: number;
  size: number;
};

export type AfiQueryParams = {
  CUIL?: number;
};

export type AfiApiResponse = {
  cuil: number;
  docTipo: string;
  docNumero: number;
  nombre: string;
  fechaNacimiento: string;
  nacionalidad: number;
  sexo: string;
  DomicilioCalle: string;
  DomicilioNumero: string;
  DomicilioPiso: string;
  DomicilioDpto: string;
  DomicilioEntreCalle1: string;
  DomicilioEntreCalle2: string;
  CodLocalidadSrt: string;
  CodLocalidadPostal: number;
  telefono: string;
  estadoCivil: string;
  email: string;
  obraSocial: number;
  comentario: string;

}


export type PrestadorQueryParams = {
  CUIT?: number;
};

export type PrestadorResponse = {
  cuit: number;
  razonSocial: string;
};

// Tipo para crear una nueva denuncia (POST /api/Denuncias)
export type DenunciaPostRequest = {
  siniestroNro: number;
  siniestroTipo: string;
  empCuit: number;
  empPoliza: number;
  empRazonSocial: string;
  empCiiu: number;
  empDomicilioCalle: string;
  empDomicilioNro: string;
  empDomicilioPiso: string;
  empDomicilioDpto: string;
  empDomicilioEntreCalle1: string;
  empDomicilioEntreCalle2: string;
  empCodLocalidad: string;
  empCodPostal: number;
  empTelefonos: string;
  empeMail: string;
  empOcCuit: number;
  empOcRazonSocial: string;
  empOcEstablecimiento: string;
  empOcCiiu: number;
  empOcDomicilioCalle: string;
  empOcDomicilioNro: string;
  empOcDomicilioPiso: string;
  empOcDomicilioDpto: string;
  empOcDomicilioEntreCalle1: string;
  empOcDomicilioEntreCalle2: string;
  empOcCodLocalidad: string;
  empOcCodPostal: number;
  empOcSubContrato: string;
  empOcTelefonos: string;
  empOceMail: string;
  empEstCuit: number;
  empEstRazonSocial: string;
  empEstEstablecimiento: string;
  empEstCiiu: number;
  empEstDomicilioCalle: string;
  empEstDomicilioNro: string;
  empEstDomicilioPiso: string;
  empEstDomicilioDpto: string;
  empEstDomicilioEntreCalle1: string;
  empEstDomicilioEntreCalle2: string;
  empEstCodLocalidad: string;
  empEstCodPostal: number;
  empEstTelefonos: string;
  empEsteMail: string;
  prestadorCuit: number;
  afiCuil: number;
  afiDocTipo: string;
  afiDocNumero: number;
  afiNombre: string;
  afiFechaNacimiento: number;
  afiSexo: string;
  afiEstadoCivil: string;
  afiNacionalidad: number;
  afiDomicilioCalle: string;
  afiDomicilioNro: string;
  afiDomicilioPiso: string;
  afiDomicilioDpto: string;
  afiDomicilioEntreCalle1: string;
  afiDomicilioEntreCalle2: string;
  afiCodLocalidad: string;
  afiCodPostal: number;
  afieMail: string;
  afiTelefono: string;
  afiObraSocial: string;
  comentario: string;
  origenIngreso: string;
  trasladoTipo: string;
  avisoTrabajadorFueraNomina: number;
  avisoEmpleadorSinContratoVigente: boolean;
  estado: number;
  denunciaCanalIngresoInterno: number;
  descripcion: string;
  fechaHoraSiniestro: string;
  enViaPublica: string;
  roam: string;
  roamNumero: number;
  roamInterno: number;
  roamAnio: number;

  tipoAccidente: string;
  conIniTelefono: string;
  conIniApellidoNombres: string;
  conIniRelacionConFamiliar: string;
  conIniTipoDenuncia: string;
  conIniTipoSiniestro: string;

  conIniCodLocalidad: number;
  conIniCodPostal: string;
  conIniLocalidad: string;
  estTrabEstaConsciente: string;
  estTrabColor: string;
  estTrabHabla: string;
  estTrabGravedad: string;
  estTrabRespira: string;
  estTrabObservaciones: string;
  estTrabTieneHemorragia: string;
  estTrabContextoDenuncia: string;
  estTrabVerificaContactoInicial: string;
  estTrabPrestadorTraslado: string;
  denunciaInstanciaImagenes: Array<{
    internoRefDenImgTipo: number;
    tipoDocumentacion: string;
    archivoNombre: string;
    imagen: string;
  }>;
};

// Tipo para actualizar una denuncia existente (PUT /api/Denuncias/{id})
export type DenunciaPutRequest = {
  denunciaNro: number;
  siniestroNro: number;
  siniestroTipo: string;
  empCuit: number;
  empPoliza: number;
  empRazonSocial: string;
  empCiiu: number;
  empDomicilioCalle: string;
  empDomicilioNro: string;
  empDomicilioPiso: string;
  empDomicilioDpto: string;
  empDomicilioEntreCalle1: string;
  empDomicilioEntreCalle2: string;
  empCodLocalidad: string;
  empCodPostal: number;
  empTelefonos: string;
  empeMail: string;
  empOcCuit: number;
  empOcRazonSocial: string;
  empOcEstablecimiento: string;
  empOcCiiu: number;
  empOcDomicilioCalle: string;
  empOcDomicilioNro: string;
  empOcDomicilioPiso: string;
  empOcDomicilioDpto: string;
  empOcDomicilioEntreCalle1: string;
  empOcDomicilioEntreCalle2: string;
  empOcCodLocalidad: string;
  empOcCodPostal: number;
  empOcSubContrato: string;
  empOcTelefonos: string;
  empOceMail: string;
  empEstCuit: number;
  empEstRazonSocial: string;
  empEstEstablecimiento: string;
  empEstCiiu: number;
  empEstDomicilioCalle: string;
  empEstDomicilioNro: string;
  empEstDomicilioPiso: string;
  empEstDomicilioDpto: string;
  empEstDomicilioEntreCalle1: string;
  empEstDomicilioEntreCalle2: string;
  empEstCodLocalidad: string;
  empEstCodPostal: number;
  empEstTelefonos: string;
  empEsteMail: string;
  prestadorCuit: number;
  afiCuil: number;
  afiDocTipo: string;
  afiDocNumero: number;
  afiNombre: string;
  afiFechaNacimiento: number;
  afiSexo: string;
  afiEstadoCivil: string;
  afiNacionalidad: number;
  afiDomicilioCalle: string;
  afiDomicilioNro: string;
  afiDomicilioPiso: string;
  afiDomicilioDpto: string;
  afiDomicilioEntreCalle1: string;
  afiDomicilioEntreCalle2: string;
  afiCodLocalidad: string;
  afiCodPostal: number;
  afieMail: string;
  afiTelefono: string;
  afiObraSocial: string;
  comentario: string;
  origenIngreso: string;
  trasladoTipo: string;
  avisoTrabajadorFueraNomina: number;
  avisoEmpleadorSinContratoVigente: boolean;
  denunciaCanalIngresoInterno: number;
  descripcion: string;
  fechaHoraSiniestro: string;
  enViaPublica: string;
  roam: string;
  roamNumero: number;
  roamInterno: number;
  roamAnio: number;
  tipoAccidente: string;
  estadoDenunciaSiniestro: string;
  conIniTelefono: string;
  conIniApellidoNombres: string;
  conIniRelacionConFamiliar: string;
  conIniTipoDenuncia: string;
  conIniTipoSiniestro: string;
  conIniCodLocalidad: number;
  conIniCodPostal: string;
  conIniLocalidad: string;
  estTrabEstaConsciente: string;
  estTrabColor: string;
  estTrabHabla: string;
  estTrabGravedad: string;
  estTrabRespira: string;
  estTrabObservaciones: string;
  estTrabTieneHemorragia: string;
  estTrabContextoDenuncia: string;
  estTrabVerificaContactoInicial: string;
  estTrabPrestadorTraslado: string;
  denunciaInstanciaImagenes: Array<{
    interno: number;
    internoRefDenImgTipo: number;
    tipoDocumentacion: string;
    archivoNombre: string;
    imagen: string;
  }>;
};

// Tipo para actualizar parcialmente una denuncia (PATCH /api/Denuncias)
export type DenunciaPatchRequest = {
  interno: number;
  patchDocument: Array<{
    path: string;
    value: any;
  }>;
};

export type ParametersLocalidad = {
  CodPostal?: number;
};

export type ParametersLocalidadCodigo = {
  Codigo?: number;
};

export type ParametersLocalidadNombre = {
  Nombre?: string;
};

// Referencias comunes utilizadas por Denuncias
export interface RefPaises {
  codigo: number;
  denominacion: string;
  pais: string;
}

export interface RefObraSocial {
  rnos: number;
  denominacion: string;
  sigla: string;
  domicilio: string;
  localidad: string;
  cp: string;
  provincia: string;
  telefono: string;
  otrosTelefonos: string;
  eMail: string;
  web: string;
  organismo: string;
}

export interface RefPrestadores {
  cuit: number;
  razonSocial: string;
}

export interface Roam {
  interno: number;
  roamDetalle: string;
}


export type ConfirmacionProps = {
  form: DenunciaFormData;
  isDisabled: boolean;
  uploadedFiles: File[];
  errors: { aceptoTerminos?: string };
  touched: { aceptoTerminos?: boolean };
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: (index: number) => void;
  onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (fieldName: keyof DenunciaFormData) => void;
};


export type DatosEmpleadorProps = {
  form: DenunciaFormData;
  errors: { [K in keyof DenunciaFormData]?: string };
  touched: { [K in keyof DenunciaFormData]?: boolean };
  isDisabled: boolean;
  isEditing?: boolean;
  readonlyEmpCuit?: boolean;
  onTextFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (e: SelectChangeEvent<string>) => void;
  onBlur: (fieldName: keyof DenunciaFormData) => void;
};


export type DatosInicialesProps = {
  form: DenunciaFormData;
  errors: { [K in keyof DenunciaFormData]?: string };
  touched: { [K in keyof DenunciaFormData]?: boolean };
  isDisabled: boolean;
  isEditing?: boolean;
  onTextFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (e: SelectChangeEvent<string>) => void;
  onBlur: (fieldName: keyof DenunciaFormData) => void;
};


export type RequestMethod = "create" | "edit" | "view" | "delete";

export interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: DenunciaFormData, options?: { final?: boolean }) => void;
  initialData?: DenunciaFormData;
  initialFiles?: File[];
  errorMsg?: string | null;
  method: RequestMethod;
  isSubmitting?: boolean;
  onValidationError?: (message: string) => void;
}

export interface ValidationErrors {
  telefonos?: string;
  apellidoNombres?: string;
  relacionAccidentado?: string;
  tipoDenuncia?: string;
  tipoSiniestro?: string;
  enViaPublica?: string;
  fechaOcurrencia?: string;
  hora?: string;
  calle?: string;
  descripcion?: string;
  // Worker data fields
  cuil?: string;
  docTipo?: string;
  docNumero?: string;
  nombre?: string;
  fechaNac?: string;
  sexo?: string;
  estadoCivil?: string;
  nacionalidad?: string;
  domicilioCalle?: string;
  telefono?: string;
  email?: string;
  // Accident data fields
  estaConsciente?: string;
  color?: string;
  habla?: string;
  gravedad?: string;
  respira?: string;
  tieneHemorragia?: string;
  contextoDenuncia?: string;
  prestadorInicialCuit?: string;
  prestadorInicialRazonSocial?: string;
  roamDescripcion?: string;
  // Employer fields
  empCuit?: string;
  empPoliza?: string;
  empRazonSocial?: string;
  empDomicilioCalle?: string;
  empDomicilioNro?: string;
  empDomicilioPiso?: string;
  empDomicilioDpto?: string;
  empDomicilioEntreCalle1?: string;
  empDomicilioEntreCalle2?: string;
  empCodLocalidad?: string;
  empCodPostal?: string;
  empTelefonos?: string;
  empEmail?: string;
  // Confirmation fields
  aceptoTerminos?: string;
}

export interface TouchedFields {
  telefonos?: boolean;
  apellidoNombres?: boolean;
  relacionAccidentado?: boolean;
  tipoDenuncia?: boolean;
  tipoSiniestro?: boolean;
  enViaPublica?: boolean;
  fechaOcurrencia?: boolean;
  hora?: boolean;
  calle?: boolean;
  descripcion?: boolean;
  // Worker data fields
  cuil?: boolean;
  docTipo?: boolean;
  docNumero?: boolean;
  nombre?: boolean;
  fechaNac?: boolean;
  sexo?: boolean;
  estadoCivil?: boolean;
  nacionalidad?: boolean;
  domicilioCalle?: boolean;
  telefono?: boolean;
  email?: boolean;
  // Accident data fields
  estaConsciente?: boolean;
  color?: boolean;
  habla?: boolean;
  gravedad?: boolean;
  respira?: boolean;
  tieneHemorragia?: boolean;
  contextoDenuncia?: boolean;
  prestadorInicialCuit?: boolean;
  prestadorInicialRazonSocial?: boolean;
  roamDescripcion?: boolean;
  // Confirmation fields
  aceptoTerminos?: boolean;
  // Employer fields
  empCuit?: boolean;
  empPoliza?: boolean;
  empRazonSocial?: boolean;
  empDomicilioCalle?: boolean;
  empDomicilioNro?: boolean;
  empDomicilioPiso?: boolean;
  empDomicilioDpto?: boolean;
  empDomicilioEntreCalle1?: boolean;
  empDomicilioEntreCalle2?: boolean;
  empCodLocalidad?: boolean;
  empCodPostal?: boolean;
  empTelefonos?: boolean;
  empEmail?: boolean;
}

export type ParametersEmpleadorT = {
  CUIL?: number;
};
