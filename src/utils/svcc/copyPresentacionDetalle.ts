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

function toSustanciaCreate(row: SustanciaDTO, presentacionId: number): SustanciaCreateDTO {
  return {
    ...stripCloneFields(row),
    presentacionId,
  };
}

function toTrabajadorCreate(row: TrabajadorDTO, presentacionId: number): TrabajadorCreateDTO {
  return {
    ...stripCloneFields(row),
    presentacionId,
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

async function copyEstablecimientosDeclarados(origenId: number, nuevoId: number): Promise<void> {
  const rows = await fetchAllPaginated((pageIndex) =>
    SvccAPI.svccEstablecimientoDeclaradoList({
      presentacionId: origenId,
      PageIndex: pageIndex,
      PageSize: COPY_PAGE_SIZE,
    })
  );
  await Promise.all(
    rows.map((row) =>
      SvccAPI.svccEstablecimientoDeclaradoCreate(toEstablecimientoDeclaradoCreate(row, nuevoId))
    )
  );
}

async function copySustancias(origenId: number, nuevoId: number): Promise<void> {
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
    await SvccAPI.svccSustanciaCreate(toSustanciaCreate(full, nuevoId));
  }
}

async function copyTrabajadores(origenId: number, nuevoId: number): Promise<void> {
  const rows = await fetchAllPaginated((pageIndex) =>
    SvccAPI.svccTrabajadorList({
      presentacionId: origenId,
      PageIndex: pageIndex,
      PageSize: COPY_PAGE_SIZE,
    })
  );
  for (const row of rows) {
    const full =
      row.interno > 0
        ? await SvccAPI.svccTrabajadorRead({ id: row.interno })
        : row;
    await SvccAPI.svccTrabajadorCreate(toTrabajadorCreate(full, nuevoId));
  }
}

/** Copia Portada, Anexo V y Nóminas desde la presentación origen a la nueva. */
export async function copyPresentacionDetalleFromOrigen(
  presentacionOrigenInterno: number,
  presentacionNuevaInterno: number,
): Promise<void> {
  if (presentacionOrigenInterno <= 0 || presentacionNuevaInterno <= 0) return;

  await copyEmpresasTercerizadas(presentacionOrigenInterno, presentacionNuevaInterno);
  await copyEstablecimientosDeclarados(presentacionOrigenInterno, presentacionNuevaInterno);
  await copySustancias(presentacionOrigenInterno, presentacionNuevaInterno);
  await copyTrabajadores(presentacionOrigenInterno, presentacionNuevaInterno);
}
