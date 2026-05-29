import type { ChangeEvent } from "react";
import type { SelectChangeEvent } from "@mui/material/Select";
import RolesInterface from "@/app/inicio/usuarios/interfaces/RolesInterface";
import RefEmpleador from "@/app/inicio/usuarios/interfaces/RefEmpleador";
import CargoInterface from "@/app/inicio/usuarios/interfaces/CargoInterface";
import type {
  UsuarioFormFields as BaseUsuarioFormFields,
  RequestMethod as UsuarioRequestMethod,
  ValidationErrors as BaseValidationErrors,
  TouchedFields as BaseTouchedFields,
  Props as UsuarioFormProps,
} from "@/app/inicio/usuarios/UsuarioForm";

export type RequestMethod = UsuarioRequestMethod;
export type UsuarioFormFields = BaseUsuarioFormFields & {
  srtComercializadorGOrganizadorInterno?: number;
  comercializadorAsociados?: { srtComercializadorInterno: number; tipo: string; asociadoId: number }[];
};

export type Props = UsuarioFormProps & {
  creationRole?: string | null; // rol determinado por el contexto (tabla) desde donde se crea
  initialSelectedGrupoId?: string;
  initialSelectedOrganizadorId?: string;
};

// Interfaces completas para errores y campos tocados
export type ValidationErrors = BaseValidationErrors;
export type TouchedFields = BaseTouchedFields;

export interface SrtLocalidad {
  interno: number;
  nombre: string;
  provinciaId: number;
  codigo: string;
  nombreCompleto: string;
  codPostal: number;
}

export interface SrtLocalidadByCodigo extends SrtLocalidad {
  nombreProvincia: string;
}

export interface DatosReferenteSectionProps {
  form: UsuarioFormFields;
  creationRole?: string | null;
  errors: ValidationErrors;
  touched: TouchedFields;
  isDisabled: boolean;
  isCreating: boolean;
  isEditing: boolean;
  isViewing: boolean;
  isGrupoOrganizador: boolean;
  isOrganizadorComercializador: boolean;
  grupoOptions: { value: string; label: string }[];
  organizadorOptions: { value: string; label: string; gOrgInterno?: number }[];
  selectedGrupoId: string;
  selectedOrganizadorId: string;
  onGrupoChange: (value: string) => void;
  onOrganizadorChange: (value: string) => void;
  onTextFieldChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (e: SelectChangeEvent<string>) => void;
  onBlur: (field: keyof TouchedFields) => void;
}

export interface AsociadoRow {
  interno?: number;
  asociadoId: number;
  tipo: string;
  fechaBaja?: string | null;
  isNew?: boolean;
}

export interface AsociadoDetalleRow {
  razonSocial?: string;
  observacion?: string;
  observaciones?: string;
  descripcion?: string;
}

export interface SelectOption {
  value: number;
  label: string;
}

export interface AsociadosProps {
  comercializadorInterno: number;
  comercializadorNombre: string;
  readOnly?: boolean;
  grupoInternoFijo?: number;
  organizadorInternoFijo?: number;
}

export interface NombreAsociadoCellProps {
  tipo: string;
  asociadoId: number;
}

export interface AsociadosHandle {
  save: () => Promise<void>;
  hasUnsaved: () => boolean;
  getNewAsociados: () => { srtComercializadorInterno: number; tipo: string; asociadoId: number }[];
}

export type ApiOrganizacionItem = {
  interno?: number;
  razonSocial?: string;
  observacion?: string;
  observaciones?: string;
};

export type ApiGrupoItem = {
  interno?: number | string;
  razonSocial?: string;
  descripcion?: string;
};
