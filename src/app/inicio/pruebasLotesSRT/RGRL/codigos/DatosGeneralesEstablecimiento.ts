import SrtAPI from "@/data/srtAPI";
import ArtAPI from "@/data/artAPI";
import type { ApiFormularioRGRL } from "../types/rgrlLotes";
import type { SRTPoliza, SRTCIIUConversion, SRTEstablecimiento } from "../types/rgrlLotes";

const pad = (value: number | string, length: number) =>
  String(value).padStart(length, "0");

const padDate = (fechaHora: string | null): string => {
  if (!fechaHora) return " ".repeat(8);
  const d = new Date(fechaHora);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

export async function generarCodigoDatosGeneralesEstablecimiento(
  rgrl: ApiFormularioRGRL
): Promise<string> {
  // 1. Código ART (5 dígitos)
  const codigoART = "00523";

  // 2. CUIT del empleador (11 dígitos)
  const cuitNum = Number(rgrl.cuit);
  const cuit = pad(cuitNum, 11);

  // 3. Número de establecimiento (5 dígitos): primer número de direccion
  const nroEstablecimiento = pad(Number(rgrl.direccion?.split("-")[0]?.trim() ?? 0), 5);

  // 4. Número de póliza (7 dígitos)
  const polizas = await SrtAPI.getPolizaComercializador({ CUIT: cuitNum }) as SRTPoliza[];
  const poliza = polizas[0];
  const nroPoliza = pad(poliza?.numero ?? 0, 7);

  // 5. Fecha completado (8 dígitos): AAAAMMDD
  const fechaCompletado = padDate(rgrl.completadoFechaHora);

  // 6, 7 y 8. Datos del establecimiento
  const establecimiento = await ArtAPI.getEstablecimientoById({
    id: rgrl.internoEstablecimiento!,
  }) as SRTEstablecimiento;

  // 6. CIIU rev3 (6 dígitos): conversión desde CIIU del establecimiento
  const ciiuConversion = await SrtAPI.getSRTPublicacionesCIIUConversiones({
    rev4Ciiu6d: establecimiento.ciiu,
  }) as SRTCIIUConversion;
  const ciiu = pad(ciiuConversion.rev3Ciiu6d ?? 0, 6);
  const superficie = pad(establecimiento.superficie, 8);
  const cantTrabajadores = pad(establecimiento.cantTrabajadores, 6);

  // 9. Fecha de baja (8 dígitos): espacios si no existe
  const fechaBaja = establecimiento.fechaBaja
    ? padDate(establecimiento.fechaBaja)
    : " ".repeat(8);

  // 10. Motivo de baja (1 dígito): espacio si no existe
  const motivoBaja = establecimiento.bajaMotivo
    ? String(establecimiento.bajaMotivo)
    : " ";

  // 11. Estado acción (1 dígito)
  const estadoAccion = establecimiento.estadoAccion;

  const codigo =
    codigoART +
    cuit +
    nroEstablecimiento +
    nroPoliza +
    fechaCompletado +
    ciiu +
    superficie +
    cantTrabajadores +
    fechaBaja +
    motivoBaja +
    estadoAccion;

  return codigo;
}
