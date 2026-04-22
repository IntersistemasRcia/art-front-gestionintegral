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
