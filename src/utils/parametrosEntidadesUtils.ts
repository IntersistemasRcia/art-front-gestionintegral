import type { ParametroEntidad } from "@/data/authAPI";

export function getParametroEntidadValor(
  parametros: ParametroEntidad[],
  parametroNombre: string,
): string | undefined {
  const nombre = parametroNombre.trim().toLowerCase();
  const param = parametros.find(
    (item) => String(item.parametroNombre ?? "").trim().toLowerCase() === nombre,
  );
  const valor = String(param?.valor ?? "").trim();
  return valor || undefined;
}

export function getParametroEntidadNumero(
  parametros: ParametroEntidad[],
  parametroNombre: string,
): number | undefined {
  const valor = getParametroEntidadValor(parametros, parametroNombre);
  if (!valor) return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : undefined;
}
