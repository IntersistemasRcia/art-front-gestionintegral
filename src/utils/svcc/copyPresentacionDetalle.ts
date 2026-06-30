import SvccAPI, {
  type ActividadDTO,
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
  if (value == null) return value;
  return map.get(value) ?? value;
}

function mapNestedInternos<T extends { interno?: number }>(
  sourceRows: T[] | undefined,
  clonedRows: T[] | undefined,
  map: Map<number, number>,
): void {
  if (sourceRows == null || clonedRows == null) return;
  sourceRows.forEach((sourceRow, index) => {
    setReferenceMapValue(map, sourceRow.interno, clonedRows[index]?.interno);
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

function toTrabajadorCreate(
  row: TrabajadorDTO,
  presentacionId: number,
  maps?: CloneReferenceMaps,
): TrabajadorCreateDTO {
  const clone = stripCloneFields(row);
  return {
    presentacionId,
    cuil: clone.cuil,
    idEstablecimientoEmpresa: clone.idEstablecimientoEmpresa,
    fechaIngreso: clone.fechaIngreso,
    actividades: clone.actividades?.map((actividad) => toTrabajadorActividadCreate(actividad, maps)),
  };
}

function toTrabajadorActividadCreate(actividad: ActividadDTO, maps?: CloneReferenceMaps): ActividadDTO {
  const clone = stripCloneFields(actividad);
  const puestoInterno = maps
    ? mappedReference(clone.puestoInterno ?? clone.idPuesto, maps.puestoInterno)
    : clone.puestoInterno ?? clone.idPuesto;
  const sectorInterno = maps
    ? mappedReference(clone.sectorInterno, maps.sectorInterno)
    : clone.sectorInterno;
  const sustanciaInterno = maps
    ? mappedReference(clone.sustanciaInterno, maps.sustanciaInterno)
    : clone.sustanciaInterno;

  return {
    ...clone,
    puestoInterno,
    sectorInterno,
    sustanciaInterno,
    idPuesto: puestoInterno,
    examenesMedicos: clone.examenesMedicos?.map((examen) => stripCloneFields(examen)),
  };
}

async function fetchTrabajadoresByPresentacion(presentacionId: number): Promise<TrabajadorDTO[]> {
  return fetchAllPaginated((pageIndex) =>
    SvccAPI.svccTrabajadorList({
      PresentacionId: presentacionId,
      presentacionId,
      PageIndex: pageIndex,
      PageSize: COPY_PAGE_SIZE,
    })
  );
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
    mapNestedInternos(row.puestos, created.puestos, maps.puestoInterno);
    mapNestedInternos(row.sectores, created.sectores, maps.sectorInterno);
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

async function copyTrabajadores(origenId: number, nuevoId: number, maps: CloneReferenceMaps): Promise<void> {
  const rows = await fetchTrabajadoresByPresentacion(origenId);
  for (const row of rows) {
    const full =
      row.interno > 0
        ? await SvccAPI.svccTrabajadorRead({ id: row.interno })
        : row;
    await SvccAPI.svccTrabajadorCreate(toTrabajadorCreate(full, nuevoId, maps));
  }
}

/** Copia Portada, Anexo V y Nóminas desde la presentación origen a la nueva. */
export async function copyPresentacionDetalleFromOrigen(
  presentacionOrigenInterno: number,
  presentacionNuevaInterno: number,
): Promise<void> {
  if (presentacionOrigenInterno <= 0 || presentacionNuevaInterno <= 0) return;

  const maps = createReferenceMaps();

  await copyEmpresasTercerizadas(presentacionOrigenInterno, presentacionNuevaInterno);
  await copyEstablecimientosDeclarados(presentacionOrigenInterno, presentacionNuevaInterno, maps);
  await copySustancias(presentacionOrigenInterno, presentacionNuevaInterno, maps);
  await copyTrabajadores(presentacionOrigenInterno, presentacionNuevaInterno, maps);
}

/** Copia solamente trabajadores/nómina desde una presentación origen a la nueva. */
export async function copyTrabajadoresFromPresentacionOrigen(
  presentacionOrigenInterno: number,
  presentacionNuevaInterno: number,
): Promise<void> {
  if (presentacionOrigenInterno <= 0 || presentacionNuevaInterno <= 0) return;

  const rows = await fetchTrabajadoresByPresentacion(presentacionOrigenInterno);
  for (const row of rows) {
    await SvccAPI.svccTrabajadorCreate(toTrabajadorCreate(row, presentacionNuevaInterno));
  }
}
