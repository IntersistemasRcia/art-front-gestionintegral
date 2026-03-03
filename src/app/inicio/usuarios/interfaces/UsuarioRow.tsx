import IModulo from "./IModulo";

export default interface UsuarioRow {
  id: number;
  cuit: string;
  nombre: string;
  tipo: string;
  sectorId?: number;
  sectorDescripcion?: string;
  userName: string;
  email: string;
  estado: string;
  phoneNumber: string;
  phoneNumberConfirmed: boolean;
  cargoId: number;
  cargoDescripcion: string;
  rol: string;
  empresaId: number;
  deletedDate: string | null;
  modulos: IModulo[];
  // Add other fields if needed
}
