/** Nodo recursivo Grupo → Organizador en SRTPolizas (contrato actual). */
export type SRTComercializadorAsociadoNodo = {
  interno?: number | null;
  descripcion?: string | null;
  tipo?: string | null;
  asociadoId?: number | null;
  srtComercializadorAsociadoPadre?: SRTComercializadorAsociadoNodo | string | null;
  /** Campos legacy del contrato anterior. */
  srtComercializadorAsociadoInterno?: number | null;
  srtComercializadorAsociadoDescripcion?: string | null;
  srtComercializadorAsociadoTipo?: string | null;
};

export type SRTPolizaHierarchyFields = {
  srtcomercializadorInterno?: number | null;
  comercializadorReferenteRazonSocial?: string | null;
  srtComercializadorDenominacion?: string | null;
  srtComercializadorAsociadoInterno?: number | null;
  srtComercializadorAsociadoDescripcion?: string | null;
  srtComercializadorAsociadoTipo?: string | null;
  srtComercializadorAsociado?: SRTComercializadorAsociadoNodo | null;
};

export type PolizaHierarchyTipo = "grupo" | "organizador";

export type PolizaHierarchyNode = {
  /** ID de negocio del Grupo/Organizador (clave de agrupación en combos). */
  asociadoId: number;
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

function getNodeDescripcion(node: SRTComercializadorAsociadoNodo): string {
  return String(node.descripcion ?? node.srtComercializadorAsociadoDescripcion ?? "").trim();
}

function getNodeTipoRaw(node: SRTComercializadorAsociadoNodo): string {
  return String(node.tipo ?? node.srtComercializadorAsociadoTipo ?? "").trim();
}

function getNodeAsociadoId(node: SRTComercializadorAsociadoNodo): number {
  const asociadoId = Number(node.asociadoId ?? 0);
  if (asociadoId > 0) return asociadoId;
  // Legacy: antes el ID de negocio venía en srtComercializadorAsociadoInterno.
  return Number(node.srtComercializadorAsociadoInterno ?? 0);
}

function resolvePadre(
  padre: SRTComercializadorAsociadoNodo["srtComercializadorAsociadoPadre"],
): SRTComercializadorAsociadoNodo | null {
  if (padre == null) return null;
  if (typeof padre === "string") return null;
  return padre;
}

function isIndependienteNode(node: SRTComercializadorAsociadoNodo): boolean {
  const tipo = asHierarchyTipo(getNodeTipoRaw(node));
  const asociadoId = getNodeAsociadoId(node);
  const descripcion = getNodeDescripcion(node).toLowerCase();
  if (tipo != null) return false;
  if (asociadoId > 0) return false;
  if (resolvePadre(node.srtComercializadorAsociadoPadre) != null) return false;
  return descripcion === "independiente" || descripcion === "";
}

function hasHierarchyMeaning(node: SRTComercializadorAsociadoNodo): boolean {
  if (isIndependienteNode(node)) return false;
  const tipo = asHierarchyTipo(getNodeTipoRaw(node));
  const asociadoId = getNodeAsociadoId(node);
  if (tipo != null && asociadoId > 0) return true;
  return resolvePadre(node.srtComercializadorAsociadoPadre) != null;
}

/**
 * Raíz del árbol asociativo desde el objeto nested o campos planos legacy.
 */
export function getAsociadoRoot(
  poliza: SRTPolizaHierarchyFields,
): SRTComercializadorAsociadoNodo | null {
  const nested = poliza.srtComercializadorAsociado;
  if (nested != null) {
    return hasHierarchyMeaning(nested) ? nested : null;
  }

  const asociadoId = Number(poliza.srtComercializadorAsociadoInterno ?? 0);
  const tipo = asHierarchyTipo(poliza.srtComercializadorAsociadoTipo);
  if (asociadoId <= 0 || !tipo) return null;

  return {
    asociadoId,
    descripcion: poliza.srtComercializadorAsociadoDescripcion,
    tipo: poliza.srtComercializadorAsociadoTipo,
  };
}

/** Recorre Organizador → Grupo (padre recursivo). Agrupa por `asociadoId`. */
export function walkAsociadoHierarchy(
  poliza: SRTPolizaHierarchyFields,
): PolizaHierarchyNode[] {
  const nodes: PolizaHierarchyNode[] = [];
  const seen = new Set<number>();
  let current: SRTComercializadorAsociadoNodo | null = getAsociadoRoot(poliza);

  while (current != null) {
    const asociadoId = getNodeAsociadoId(current);
    const tipo = asHierarchyTipo(getNodeTipoRaw(current));
    if (asociadoId > 0 && tipo && !seen.has(asociadoId)) {
      seen.add(asociadoId);
      const descripcion =
        getNodeDescripcion(current)
        || `${tipo === "grupo" ? "Grupo" : "Organizador"} ${asociadoId}`;
      nodes.push({ asociadoId, descripcion, tipo });
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
  asociadoId: number,
  tipo?: PolizaHierarchyTipo,
): boolean {
  if (asociadoId <= 0) return false;
  return walkAsociadoHierarchy(poliza).some(
    (node) =>
      node.asociadoId === asociadoId
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
  if (nodes.length > 0) {
    return nodes.map((node) => node.descripcion).join(" / ");
  }
  const root = getAsociadoRoot(poliza);
  if (root) return getNodeDescripcion(root);
  return String(poliza.srtComercializadorAsociadoDescripcion ?? "").trim();
}
