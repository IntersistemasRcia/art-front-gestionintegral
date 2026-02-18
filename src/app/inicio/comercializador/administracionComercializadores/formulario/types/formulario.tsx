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
export type UsuarioFormFields = BaseUsuarioFormFields;

export type Props = UsuarioFormProps & {
  creationRole?: string | null; // rol determinado por el contexto (tabla) desde donde se crea
  initialSelectedGrupoId?: string;
  initialSelectedOrganizadorId?: string;
};

// Interfaces completas para errores y campos tocados
export type ValidationErrors = BaseValidationErrors;
export type TouchedFields = BaseTouchedFields;
