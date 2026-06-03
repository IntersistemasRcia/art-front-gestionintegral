import type RolesInterface from "@/app/inicio/usuarios/interfaces/RolesInterface";

export const ADMINISTRADOR_ROLE = "Administrador";
export const ADMINISTRADOR_ART_ROLE = "AdministradorART";
export const ADMINISTRADOR_EMPLEADOR_ROLE = "AdministradorEmpleador";
export const ADMINISTRADOR_COMERCIALIZADOR_ROLE = "AdministradorComercializador";
export const VER_TODAS_LAS_EMPRESAS_TASK = "VerTodasLasEmpresas";
export const COMERCIALIZADOR_ROLE = "Comercializador";
export const ORGANIZADOR_COMERCIALIZADOR_ROLE = "OrganizadorComercializador";
export const GRUPO_ORGANIZADOR_ROLE = "GrupoOrganizador";

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

/** Indica si el rol del usuario coincide con el rol indicado o es un hijo (directo o en cadena). */
export function isRoleOrChild(
  userRole: string | undefined | null,
  roles: RolesInterface[],
  ancestorRoleName: string
): boolean {
  if (!userRole?.trim() || roles.length === 0) {
    return false;
  }

  const ancestorRole = findRoleByName(roles, ancestorRoleName);
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
    if (roleMatchesName(parent, ancestorRoleName)) {
      return true;
    }
    currentParentId = parent.idRolPadre;
  }

  return false;
}

export function isExactRole(
  userRole: string | undefined | null,
  targetRoleName: string
): boolean {
  if (!userRole?.trim()) {
    return false;
  }
  return normalizeRoleName(userRole) === normalizeRoleName(targetRoleName);
}

export function isAdministradorRole(userRole: string | undefined | null): boolean {
  return isExactRole(userRole, ADMINISTRADOR_ROLE);
}

export function isAdministradorARTRole(userRole: string | undefined | null): boolean {
  return isExactRole(userRole, ADMINISTRADOR_ART_ROLE);
}

/** Administrador o AdministradorART: cargan todas las empresas (ref empleadores). */
export function isAdministradorTodasEmpresasRole(
  userRole: string | undefined | null
): boolean {
  return isAdministradorRole(userRole) || isAdministradorARTRole(userRole);
}

/** Indica si el rol del usuario es AdministradorEmpleador o un rol hijo (directo o en cadena). */
export function isAdministradorEmpleadorOrChild(
  userRole: string | undefined | null,
  roles: RolesInterface[]
): boolean {
  return isRoleOrChild(userRole, roles, ADMINISTRADOR_EMPLEADOR_ROLE);
}

/** Indica si el rol del usuario es AdministradorComercializador o un rol hijo (directo o en cadena). */
export function isAdministradorComercializadorOrChild(
  userRole: string | undefined | null,
  roles: RolesInterface[]
): boolean {
  return isRoleOrChild(userRole, roles, ADMINISTRADOR_COMERCIALIZADOR_ROLE);
}

export function isComercializadorRole(userRole: string | undefined | null): boolean {
  return isExactRole(userRole, COMERCIALIZADOR_ROLE);
}

export function isOrganizadorComercializadorRole(
  userRole: string | undefined | null
): boolean {
  return isExactRole(userRole, ORGANIZADOR_COMERCIALIZADOR_ROLE);
}

export function isGrupoOrganizadorRole(userRole: string | undefined | null): boolean {
  return isExactRole(userRole, GRUPO_ORGANIZADOR_ROLE);
}

/** Roles comercializador identificables solo con el rol de la sesión (sin tabla de roles). */
export function isComercializadorEmpresasRoleFromSession(
  userRole: string | undefined | null
): boolean {
  return (
    isExactRole(userRole, ADMINISTRADOR_COMERCIALIZADOR_ROLE) ||
    isComercializadorRole(userRole) ||
    isOrganizadorComercializadorRole(userRole) ||
    isGrupoOrganizadorRole(userRole)
  );
}

export function isComercializadorEmpresasRole(
  userRole: string | undefined | null,
  roles: RolesInterface[]
): boolean {
  return (
    isComercializadorEmpresasRoleFromSession(userRole) ||
    isAdministradorComercializadorOrChild(userRole, roles)
  );
}

/** Indica si hace falta la jerarquía de roles antes de resolver la carga de empresas. */
export function needsRolesHierarchyForEmpresas(
  userRole: string | undefined | null
): boolean {
  if (!userRole?.trim()) {
    return true;
  }
  if (isAdministradorTodasEmpresasRole(userRole)) {
    return false;
  }
  if (isComercializadorEmpresasRoleFromSession(userRole)) {
    return false;
  }
  return true;
}
