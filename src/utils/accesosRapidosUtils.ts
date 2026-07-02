import type { ParametroEntidad } from "@/data/authAPI";

export const ACCESOS_RAPIDOS_PREFIX = "AccesosRapidos_";

export type AccesoRapido = {
  id: number;
  label: string;
  href: string;
};

function normalizeAccesoRapidoHref(valor: string): string {
  const trimmed = valor.trim().replace(/^\/+/, "");
  if (!trimmed) {
    return "/inicio";
  }
  return trimmed.startsWith("inicio") ? `/${trimmed}` : `/inicio/${trimmed}`;
}

/** Filtra parámetros cuyo nombre es AccesosRapidos_{Rol} y coincide con el rol del usuario. */
export function filterAccesosRapidosByRol(
  parametros: ParametroEntidad[] | unknown,
  userRol: string | undefined | null
): AccesoRapido[] {
  if (!userRol?.trim()) {
    return [];
  }

  const list = Array.isArray(parametros) ? parametros : [];
  const normalizedRol = userRol.trim().toLowerCase();

  return list
    .filter((parametro) => {
      const parametroNombre = (parametro.parametroNombre ?? "").trim();
      if (!parametroNombre.toLowerCase().startsWith(ACCESOS_RAPIDOS_PREFIX.toLowerCase())) {
        return false;
      }
      const rolEnParametro = parametroNombre
        .slice(ACCESOS_RAPIDOS_PREFIX.length)
        .trim()
        .toLowerCase();
      return rolEnParametro === normalizedRol;
    })
    .map((parametro) => ({
      id: parametro.id,
      label: (parametro.entidadTipo ?? "").trim() || parametro.parametroNombre,
      href: normalizeAccesoRapidoHref(parametro.valor ?? ""),
    }));
}
