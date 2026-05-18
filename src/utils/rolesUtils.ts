import type RolesInterface from "@/app/inicio/usuarios/interfaces/RolesInterface";

export const ADMINISTRADOR_EMPLEADOR_ROLE = "AdministradorEmpleador";

function normalizeRoleName(roleName: string): string {
  return roleName.trim().toLowerCase();
}

function roleMatchesName(
  role: Pick<RolesInterface, "nombre" | "nombreNormalizado">,
  targetName: string
): boolean {
  const normalizedTarget = normalizeRoleName(targetName);
  return (
    normalizeRoleName(role.nombre) === normalizedTarget ||
    normalizeRoleName(role.nombreNormalizado) === normalizedTarget
  );
}

function findRoleByName(
  roles: RolesInterface[],
  roleName: string
): RolesInterface | undefined {
  const normalized = normalizeRoleName(roleName);
  return roles.find(
    (role) =>
      normalizeRoleName(role.nombre) === normalized ||
      normalizeRoleName(role.nombreNormalizado) === normalized
  );
}

/** Indica si el rol del usuario es AdministradorEmpleador o un rol hijo (directo o en cadena). */
export function isAdministradorEmpleadorOrChild(
  userRole: string | undefined | null,
  roles: RolesInterface[]
): boolean {
  if (!userRole?.trim() || roles.length === 0) {
    return false;
  }

  const ancestorRole = findRoleByName(roles, ADMINISTRADOR_EMPLEADOR_ROLE);
  if (!ancestorRole) {
    return false;
  }

  if (roleMatchesName(ancestorRole, userRole)) {
    return true;
  }

  const isDirectChild = ancestorRole.rolesHijos.some((child) =>
    roleMatchesName(child, userRole)
  );
  if (isDirectChild) {
    return true;
  }

  const userRoleEntry = roles.find((role) => roleMatchesName(role, userRole));
  if (!userRoleEntry?.idRolPadre) {
    return false;
  }

  let currentParentId: string | null = userRoleEntry.idRolPadre;
  while (currentParentId) {
    const parent = roles.find((role) => role.id === currentParentId);
    if (!parent) {
      return false;
    }
    if (roleMatchesName(parent, ADMINISTRADOR_EMPLEADOR_ROLE)) {
      return true;
    }
    currentParentId = parent.idRolPadre;
  }

  return false;
}
