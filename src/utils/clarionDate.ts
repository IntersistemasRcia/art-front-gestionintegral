/**
 * Conversión de fechas al formato "serial Clarion": cantidad de días
 * transcurridos desde el 28/12/1800 (día 0 en el estándar de Clarion).
 *
 * El cálculo se hace íntegramente en UTC para preservar el día calendario
 * y evitar corrimientos por zona horaria / horario de verano.
 *
 * Ejemplo: "2026-12-16" <-> 82533
 */

const MS_POR_DIA = 86_400_000;
// Época Clarion: 28/12/1800 en UTC.
const EPOCA_CLARION_UTC = Date.UTC(1800, 11, 28);

const ISO_FECHA_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * ISO (`YYYY-MM-DD`) -> serial Clarion.
 * Devuelve `null` si la cadena no es una fecha ISO válida.
 */
export function isoToClarion(iso: string | null | undefined): number | null {
  const match = ISO_FECHA_RE.exec(String(iso ?? '').trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const utc = Date.UTC(year, month - 1, day);
  const date = new Date(utc);

  // Rechaza fechas imposibles (ej. 30/02, día 32) validando el round-trip.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return Math.round((utc - EPOCA_CLARION_UTC) / MS_POR_DIA);
}

/**
 * Serial Clarion -> ISO (`YYYY-MM-DD`).
 * Devuelve `null` si el serial no es un entero positivo.
 */
export function clarionToIso(serial: number | null | undefined): string | null {
  if (serial == null || !Number.isFinite(serial) || serial <= 0) return null;

  const date = new Date(EPOCA_CLARION_UTC + Math.round(serial) * MS_POR_DIA);
  const yyyy = String(date.getUTCFullYear()).padStart(4, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
