import dayjs, { type ConfigType, type Dayjs } from "dayjs";

type SRTPolizaVigencia = {
  vigenciaDesde?: string | null;
  vigenciaHasta?: string | null;
};

export function isSRTPolizaVigente(
  poliza: SRTPolizaVigencia,
  fechaReferencia: ConfigType = dayjs(),
): boolean {
  const desde = parseSRTPolizaDate(poliza.vigenciaDesde);
  const hasta = parseSRTPolizaDate(poliza.vigenciaHasta);
  const referencia = dayjs(fechaReferencia).startOf("day");

  if (!desde || !hasta || !referencia.isValid()) return false;
  if (desde.isAfter(hasta)) return false;

  return (
    (referencia.isSame(desde) || referencia.isAfter(desde))
    && (referencia.isSame(hasta) || referencia.isBefore(hasta))
  );
}

function parseSRTPolizaDate(value: string | null | undefined): Dayjs | null {
  const datePart = String(value ?? "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;

  const parsedDate = dayjs(datePart);
  if (!parsedDate.isValid() || parsedDate.format("YYYY-MM-DD") !== datePart) {
    return null;
  }

  return parsedDate.startOf("day");
}
