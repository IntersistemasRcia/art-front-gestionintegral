const ROLES_SIN_VER_INDEPENDIENTES = new Set([
  'grupoorganizador',
  'organizadorcomercializador',
]);

export function shouldSendVerIndependientes(rol: string | undefined | null): boolean {
  const normalizedRol = String(rol ?? '').trim().toLowerCase();
  return !ROLES_SIN_VER_INDEPENDIENTES.has(normalizedRol);
}

export function applySRTPolizasVerIndependientes<T extends Record<string, unknown>>(
  params: T,
  rol: string | undefined | null,
): T {
  if (shouldSendVerIndependientes(rol)) {
    return params;
  }

  return { ...params, VerIndependientes: false };
}
