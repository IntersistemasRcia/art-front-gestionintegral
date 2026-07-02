import SvccAPI, {
  type EmpresaTercerizadaCreateDTO,
  type EmpresaTercerizadaDTO,
  type EstablecimientoDeclaradoCreateDTO,
  type EstablecimientoDeclaradoDTO,
  type Pagination,
  type SustanciaCreateDTO,
  type SustanciaDTO,
  type TrabajadorCreateDTO,
  type TrabajadorDTO,
} from "@/data/svccAPI";

const COPY_PAGE_SIZE = 200;

const FIELDS_OMIT_ON_CLONE = new Set(["interno", "fechaInsert"]);

type CloneReferenceMaps = {
  puestoInterno: Map<number, number>;
  sectorInterno: Map<number, number>;
  sustanciaInterno: Map<number, number>;
};

function stripCloneFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripCloneFields(item)) as T;
  }
  if (value != null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const target: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(source)) {
      if (FIELDS_OMIT_ON_CLONE.has(key)) continue;
      target[key] = stripCloneFields(nested);
    }
    return target as T;
  }
  return value;
}

function createReferenceMaps(): CloneReferenceMaps {
  return {
    puestoInterno: new Map<number, number>(),
    sectorInterno: new Map<number, number>(),
    sustanciaInterno: new Map<number, number>(),
  };
}

function setReferenceMapValue(map: Map<number, number>, oldValue?: number, newValue?: number): void {
  if (oldValue == null || newValue == null) return;
  if (oldValue <= 0 || newValue <= 0) return;
  map.set(oldValue, newValue);
}

function mappedReference(value: number | undefined, map: Map<number, number>): number | undefined {
  if (value == null || value <= 0) return undefined;
  return map.get(value);
}

function mapPuestosByIdentity(
  sourcePuestos: { interno?: number; nombre?: string; ciuo?: number }[] | undefined,
  createdPuestos: { interno?: number; nombre?: string; ciuo?: number }[] | undefined,
  map: Map<number, number>,
): void {
  if (sourcePuestos == null || createdPuestos == null) return;

  sourcePuestos.forEach((sourcePuesto, index) => {
    const sourceInterno = sourcePuesto.interno;
    if (sourceInterno == null || sourceInterno <= 0) return;

    const byIdentity = createdPuestos.find(
      (createdPuesto) =>
        String(createdPuesto.nombre ?? "").trim() === String(sourcePuesto.nombre ?? "").trim()
        && Number(createdPuesto.ciuo ?? 0) === Number(sourcePuesto.ciuo ?? 0),
    )?.interno;
    const byIndex = createdPuestos[index]?.interno;

    setReferenceMapValue(map, sourceInterno, byIdentity ?? byIndex);
  });
}

function mapSectoresByIdentity(
  sourceSectores: { interno?: number; nombre?: string; ciiu?: number }[] | undefined,
  createdSectores: { interno?: number; nombre?: string; ciiu?: number }[] | undefined,
  map: Map<number, number>,
): void {
  if (sourceSectores == null || createdSectores == null) return;

  sourceSectores.forEach((sourceSector, index) => {
    const sourceInterno = sourceSector.interno;
    if (sourceInterno == null || sourceInterno <= 0) return;

    const byIdentity = createdSectores.find(
      (createdSector) =>
        String(createdSector.nombre ?? "").trim() === String(sourceSector.nombre ?? "").trim()
        && Number(createdSector.ciiu ?? 0) === Number(sourceSector.ciiu ?? 0),
    )?.interno;
    const byIndex = createdSectores[index]?.interno;

    setReferenceMapValue(map, sourceInterno, byIdentity ?? byIndex);
  });
}

async function fetchAllPaginated<T>(
  fetchPage: (pageIndex: number) => Promise<Pagination<T>>,
): Promise<T[]> {
  const first = await fetchPage(1);
  const items = [...first.data];
  const pages = Math.max(first.pages ?? 1, 1);
  for (let pageIndex = 2; pageIndex <= pages; pageIndex++) {
    const page = await fetchPage(pageIndex);
    items.push(...page.data);
  }
  return items;
}

/** GET /api/Trabajadores?PresentacionId={id} de la presentación origen (antes de crear la nueva). */
export async function fetchTrabajadoresByPresentacionId(presentacionId: number): Promise<TrabajadorDTO[]> {
  if (presentacionId <= 0) return [];

  return fetchAllPaginated((pageIndex) =>
    SvccAPI.svccTrabajadorList({
      presentacionId,
      PresentacionId: presentacionId,
      PageIndex: pageIndex,
      PageSize: COPY_PAGE_SIZE,
    })
  );
}

function toEmpresaTercerizadaCreate(
  row: EmpresaTercerizadaDTO,
  presentacionId: number,
): EmpresaTercerizadaCreateDTO {
  return {
    ...stripCloneFields(row),
    presentacionId,
  };
}

function toEstablecimientoDeclaradoCreate(
  row: EstablecimientoDeclaradoDTO,
  presentacionId: number,
): EstablecimientoDeclaradoCreateDTO {
  return {
    ...stripCloneFields(row),
    presentacionId,
  };
}

function toSustanciaCreate(
  row: SustanciaDTO,
  presentacionId: number,
  maps: CloneReferenceMaps,
): SustanciaCreateDTO {
  const clone = stripCloneFields(row);
  return {
    ...clone,
    puestosAfectados: clone.puestosAfectados?.map((puestoAfectado) => ({
      ...puestoAfectado,
      puestoInterno: mappedReference(puestoAfectado.puestoInterno, maps.puestoInterno),
    })),
    presentacionId,
  };
}

function toTrabajadorCreatePayload(row: TrabajadorDTO, presentacionId: number): TrabajadorCreateDTO {
  const clone = stripCloneFields(row);
  return {
    presentacionId,
    cuil: clone.cuil,
    idEstablecimientoEmpresa: clone.idEstablecimientoEmpresa,
    fechaIngreso: clone.fechaIngreso,
  };
}

async function copyEmpresasTercerizadas(origenId: number, nuevoId: number): Promise<void> {
  const rows = await fetchAllPaginated((pageIndex) =>
    SvccAPI.svccEmpresaTercerizadaList({
      presentacionId: origenId,
      PageIndex: pageIndex,
      PageSize: COPY_PAGE_SIZE,
    })
  );
  await Promise.all(
    rows.map((row) => SvccAPI.svccEmpresaTercerizadaCreate(toEmpresaTercerizadaCreate(row, nuevoId)))
  );
}

async function copyEstablecimientosDeclarados(
  origenId: number,
  nuevoId: number,
  maps: CloneReferenceMaps,
): Promise<void> {
  const rows = await fetchAllPaginated((pageIndex) =>
    SvccAPI.svccEstablecimientoDeclaradoList({
      presentacionId: origenId,
      PageIndex: pageIndex,
      PageSize: COPY_PAGE_SIZE,
    })
  );
  for (const row of rows) {
    const created = await SvccAPI.svccEstablecimientoDeclaradoCreate(toEstablecimientoDeclaradoCreate(row, nuevoId));
    mapPuestosByIdentity(row.puestos, created.puestos, maps.puestoInterno);
    mapSectoresByIdentity(row.sectores, created.sectores, maps.sectorInterno);
  }
}

async function copySustancias(origenId: number, nuevoId: number, maps: CloneReferenceMaps): Promise<void> {
  const rows = await fetchAllPaginated((pageIndex) =>
    SvccAPI.svccSustanciaList({
      presentacionId: origenId,
      PageIndex: pageIndex,
      PageSize: COPY_PAGE_SIZE,
    })
  );
  for (const row of rows) {
    const full =
      row.interno > 0
        ? await SvccAPI.svccSustanciaRead({ id: row.interno })
        : row;
    const created = await SvccAPI.svccSustanciaCreate(toSustanciaCreate(full, nuevoId, maps));
    setReferenceMapValue(maps.sustanciaInterno, full.interno, created.interno);
  }
}

/** Copia Portada y Anexo V desde la presentación origen a la nueva. */
export async function copyPortadaYAnexoVFromOrigen(
  presentacionOrigenInterno: number,
  presentacionNuevaInterno: number,
): Promise<void> {
  if (presentacionOrigenInterno <= 0 || presentacionNuevaInterno <= 0) return;
  if (presentacionOrigenInterno === presentacionNuevaInterno) return;

  const maps = createReferenceMaps();

  await copyEmpresasTercerizadas(presentacionOrigenInterno, presentacionNuevaInterno);
  await copyEstablecimientosDeclarados(presentacionOrigenInterno, presentacionNuevaInterno, maps);
  await copySustancias(presentacionOrigenInterno, presentacionNuevaInterno, maps);
}

/**
 * POST /api/Trabajadores con el nuevo presentacionId.
 * Las filas deben haberse obtenido antes de crear la nueva presentación.
 */
export async function copyNominasToPresentacion(
  trabajadoresOrigen: TrabajadorDTO[],
  presentacionNuevaInterno: number,
): Promise<void> {
  if (presentacionNuevaInterno <= 0 || trabajadoresOrigen.length === 0) return;

  for (const row of trabajadoresOrigen) {
    await SvccAPI.svccTrabajadorCreate(toTrabajadorCreatePayload(row, presentacionNuevaInterno));
  }
}

/** Copia Portada, Anexo V y Nóminas desde la presentación origen a la nueva. */
export async function copyPresentacionDetalleFromOrigen(
  presentacionOrigenInterno: number,
  presentacionNuevaInterno: number,
  trabajadoresOrigen?: TrabajadorDTO[],
): Promise<void> {
  if (presentacionOrigenInterno <= 0 || presentacionNuevaInterno <= 0) return;
  if (presentacionOrigenInterno === presentacionNuevaInterno) return;

  const nominas =
    trabajadoresOrigen
    ?? await fetchTrabajadoresByPresentacionId(presentacionOrigenInterno);

  await copyPortadaYAnexoVFromOrigen(presentacionOrigenInterno, presentacionNuevaInterno);
  await copyNominasToPresentacion(nominas, presentacionNuevaInterno);
}
