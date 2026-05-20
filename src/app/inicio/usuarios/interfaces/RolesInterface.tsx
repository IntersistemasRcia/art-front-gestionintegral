interface RolesHijoInterface {
  id: string;
  nombre: string;
  nombreNormalizado: string;
}

interface RolesInterface {
  id: string;
  nombre: string;
  nombreNormalizado: string;
  esRolHijo: boolean;
  idRolPadre: string | null;
  rolesHijos: RolesHijoInterface[];
}
export default RolesInterface;