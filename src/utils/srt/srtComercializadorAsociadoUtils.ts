/** Nodo recursivo de la jerarquía Grupo → Organizador (API SRTPolizas). */
export type SRTComercializadorAsociadoNodo = {
  srtComercializadorAsociadoInterno?: number | null;
  srtComercializadorAsociadoDescripcion?: string | null;
  srtComercializadorAsociadoTipo?: string | null;
  /** Padre en la mamushka; misma estructura que el nodo actual. */
  srtComercializadorAsociadoPadre?: SRTComercializadorAsociadoNodo | string | null;
};

export type SRTPolizaHierarchyFields = {
  srtcomercializadorInterno?: number | null;
  comercializadorReferenteRazonSocial?: string | null;
  srtComercializadorDenominacion?: string | null;
  /** ID plano legado / resumen del asociado inmediato. */
  srtComercializadorAsociadoInterno?: number | null;
  srtComercializadorAsociadoDescripcion?: string | null;
  srtComercializadorAsociadoTipo?: string | null;
  srtComercializadorAsociado?: SRTComercializadorAsociadoNodo | null;
};

export type PolizaHierarchyTipo = "grupo" | "organizador";

export type PolizaHierarchyNode = {
  interno: number;
  descripcion: string;
  tipo: PolizaHierarchyTipo;
};

function normalizeTipo(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function asHierarchyTipo(value: unknown): PolizaHierarchyTipo | null {
  const tipo = normalizeTipo(value);
  if (tipo === "grupo") return "grupo";
  if (tipo === "organizador") return "organizador";
  return null;
}

/** Normaliza el padre: el swagger a veces tipa string; en runtime es objeto recursivo. */
function resolvePadre(
  padre: SRTComercializadorAsociadoNodo["srtComercializadorAsociadoPadre"],
): SRTComercializadorAsociadoNodo | null {
  if (padre == null) return null;
  if (typeof padre === "string") return null;
  return padre;
}

/**
 * Resuelve el nodo raíz de asociados desde el objeto nested
 * o, en fallback, desde los campos planos del response legado.
 * Nodos "Independiente" (interno 0 / tipo vacío / sin padre) no aportan jerarquía.
 */
export function getAsociadoRoot(
  poliza: SRTPolizaHierarchyFields,
): SRTComercializadorAsociadoNodo | null {
  const nested = poliza.srtComercializadorAsociado;
  if (nested != null) {
    const nestedInterno = Number(nested.srtComercializadorAsociadoInterno ?? 0);
    const nestedTipo = asHierarchyTipo(nested.srtComercializadorAsociadoTipo);
    const hasPadre = resolvePadre(nested.srtComercializadorAsociadoPadre) != null;
    if (nestedInterno > 0 || nestedTipo != null || hasPadre) {
      return nested;
    }
    return null;
  }

  const interno = Number(poliza.srtComercializadorAsociadoInterno ?? 0);
  const tipo = asHierarchyTipo(poliza.srtComercializadorAsociadoTipo);
  if (interno <= 0 && !tipo) return null;

  return {
    srtComercializadorAsociadoInterno: poliza.srtComercializadorAsociadoInterno,
    srtComercializadorAsociadoDescripcion: poliza.srtComercializadorAsociadoDescripcion,
    srtComercializadorAsociadoTipo: poliza.srtComercializadorAsociadoTipo,
    srtComercializadorAsociadoPadre: null,
  };
}

/** Recorre la cadena asociado → padre → ... (Grupo encima de Organizador). */
export function walkAsociadoHierarchy(
  poliza: SRTPolizaHierarchyFields,
): PolizaHierarchyNode[] {
  const nodes: PolizaHierarchyNode[] = [];
  const seen = new Set<number>();
  let current: SRTComercializadorAsociadoNodo | null = getAsociadoRoot(poliza);

  while (current != null) {
    const interno = Number(current.srtComercializadorAsociadoInterno ?? 0);
    const tipo = asHierarchyTipo(current.srtComercializadorAsociadoTipo);
    if (interno > 0 && tipo && !seen.has(interno)) {
      seen.add(interno);
      const descripcion =
        String(current.srtComercializadorAsociadoDescripcion ?? "").trim()
        || `${tipo === "grupo" ? "Grupo" : "Organizador"} ${interno}`;
      nodes.push({ interno, descripcion, tipo });
    }
    current = resolvePadre(current.srtComercializadorAsociadoPadre);
  }

  return nodes;
}

export function findHierarchyNodeByTipo(
  poliza: SRTPolizaHierarchyFields,
  tipo: PolizaHierarchyTipo,
): PolizaHierarchyNode | null {
  return walkAsociadoHierarchy(poliza).find((node) => node.tipo === tipo) ?? null;
}

export function polizaBelongsToAsociado(
  poliza: SRTPolizaHierarchyFields,
  asociadoInterno: number,
  tipo?: PolizaHierarchyTipo,
): boolean {
  if (asociadoInterno <= 0) return false;
  return walkAsociadoHierarchy(poliza).some(
    (node) =>
      node.interno === asociadoInterno
      && (tipo == null || node.tipo === tipo),
  );
}

export function getComercializadorInterno(poliza: SRTPolizaHierarchyFields): number {
  return Number(poliza.srtcomercializadorInterno ?? 0);
}

export function getComercializadorDescripcion(poliza: SRTPolizaHierarchyFields): string {
  return (
    String(poliza.comercializadorReferenteRazonSocial ?? "").trim()
    || String(poliza.srtComercializadorDenominacion ?? "").trim()
  );
}

export function getAsociadoDescripcionDisplay(poliza: SRTPolizaHierarchyFields): string {
  const nodes = walkAsociadoHierarchy(poliza);
  if (nodes.length === 0) {
    return String(poliza.srtComercializadorAsociadoDescripcion ?? "").trim();
  }
  return nodes.map((node) => node.descripcion).join(" / ");
}
