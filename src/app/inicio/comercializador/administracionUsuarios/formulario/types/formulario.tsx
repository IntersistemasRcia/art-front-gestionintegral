export interface RolesInterface {
  id: string;
  nombre: string;
  nombreNormalizado: string
}

export interface RefEmpleador {
  interno: number;
  nombre1: string;
  nombre2: string;
  razonSocial: string;
      // Add other fields if needed
}

export interface CargoInterface {
  id: number;
  descripcion: string; 
}

export type RequestMethod = "create" | "edit" | "view" | "delete" | "activate" | "remove";

export interface UsuarioFormFields {
  nombre: string;
  email: string;
  cuit: string; // Keep as string for form input, will convert to number on submit
  phoneNumber: string;
  matricula?: string;
  fechaNacimiento?: string;
  canalInterviniente?: string;
  inicioFecha?: string;
  bajaFecha?: string | null;
  domicilioCalle?: string;
  domicilioNro?: string;
  domicilioPiso?: string;
  domicilioEntreCalle1?: string;
  domicilioEntreCalle2?: string;
  domicilioCodPostal?: string;
  domicilioCodLocalidad?: string;
  domicilioLocalidad?: string;
  domicilioProvincia?: string;
  cargoId?: number;
  password?: string;
  confirmPassword?: string;
  rol: string;
  // tipo: string;
  userName: string;
  empresaId: number;
  id?: string;
  comision?: number;
  serviciosAdicionales?: number;
  aplicaIva?: number;
  srtComercializadorOrganizadorInterno?: number;
}

export interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: UsuarioFormFields) => void;
  roles: RolesInterface[];
  cargos?: CargoInterface[];
  refEmpleadores?: RefEmpleador[];
  initialData?: UsuarioFormFields;
  errorMsg?: string | null;
  method: RequestMethod; // MODO DE OPERACIÓN
  isSubmitting?: boolean;
  isAdmin?: boolean; // Nuevo parámetro para determinar si el usuario es admin
}

// Interfaces completas para errores y campos tocados
export interface ValidationErrors {
  nombre?: string;
  email?: string;
  cuit?: string;
  phoneNumber?: string;
  matricula?: string;
  fechaNacimiento?: string;
  domicilioCalle?: string;
  domicilioNro?: string;
  domicilioPiso?: string;
  domicilioEntreCalle1?: string;
  domicilioEntreCalle2?: string;
  domicilioCodPostal?: string;
  domicilioCodLocalidad?: string;
  domicilioLocalidad?: string;
  domicilioProvincia?: string;
  cargoId?: string;
  rol?: string;
  // tipo?: string;
  // userName?: string;
  id?: string;
}

export interface TouchedFields {
  nombre?: boolean;
  email?: boolean;
  cuit?: boolean;
  phoneNumber?: boolean;
  matricula?: boolean;
  fechaNacimiento?: boolean;
  canalInterviniente?: boolean;
  inicioFecha?: boolean;
  bajaFecha?: boolean;
  domicilioCalle?: boolean;
  domicilioNro?: boolean;
  domicilioPiso?: boolean;
  domicilioEntreCalle1?: boolean;
  domicilioEntreCalle2?: boolean;
  domicilioCodPostal?: boolean;
  domicilioCodLocalidad?: boolean;
  domicilioLocalidad?: boolean;
  domicilioProvincia?: boolean;
  cargoId?: boolean;
  rol?: boolean;
  comision?: boolean;
  serviciosAdicionales?: boolean;
  aplicaIva?: boolean;
  // tipo?: boolean;
  // userName?: boolean;
  id?: boolean;
}

export type ComercializadorGetAll = {
  interno?: number;
  Interno?: number;
  cuil?: number;
  CUIL?: number;
  matricula?: string;
  email?: string;
  telefono?: string;
  movil?: string;
  referenteDatosInterno?: number;
  canalInterviniente?: string;
  inicioFecha?: string;
  bajaFecha?: string;
  comision?: number;
  aplicaIva?: number;
  serviciosAdicionales?: number;
  srtComercializadorOrganizadorInterno?: number;
  [key: string]: unknown;
}

export type ComercializadorApiResponse = {
  data: ComercializadorGetAll[];

};
