import Formato from '@/utils/Formato';
import { saveTable, type TableColumn } from '@/utils/excelUtils';
import type { DetalleTrabajador } from './types/TformularioRar';

/* Exporta a Excel el detalle de trabajadores del RAR seleccionado (RN-001, RN-002, RN-003).
   Incluye todos los registros recibidos, sin paginación ni filtros, conservando los mismos
   datos, columnas y orden que la solapa Detalles. Si `detalle` está vacío, genera el archivo
   sólo con los encabezados. */
export const exportarDetalleRARExcel = async (
  detalle: DetalleTrabajador[],
  internoRAR: number | string,
): Promise<void> => {
  const rows = detalle.map((d) => ({
    id: d.id,
    cuil: Formato.CUIP(d.cuil) || '—',
    nombre: d.nombre || '—',
    sectorTarea: d.sectorTarea || '—',
    fechaIngreso: d.fechaIngreso || '—',
    fechaInicioExposicion: d.fechaInicioExposicion || '—',
    fechaFinExposicion: d.fechaFinExposicion || '—',
    horasExposicion: d.horasExposicion || '0',
    agenteCausante: d.agenteCausante || '—',
    fechaUltimoExamenMedico: d.fechaUltimoExamenMedico || '—',
  }));

  const fileName = `DetalleRAR${internoRAR ? `_${internoRAR}` : ''}.xlsx`;

  await saveTable(DETALLE_EXCEL_COLUMNS, rows, fileName, {
    format: 'xlsx',
    sheet: { name: 'Detalle RAR' },
  });
};

/* Encabezados, claves y orden de las columnas del detalle en el Excel.
   Debe coincidir con las columnas de la tabla de la solapa Detalles. */
const DETALLE_EXCEL_COLUMNS: Record<string, TableColumn> = {
  id: { header: '#', key: 'id' },
  cuil: { header: 'CUIL', key: 'cuil' },
  nombre: { header: 'Apellido y Nombre', key: 'nombre' },
  sectorTarea: { header: 'Sector/Tarea', key: 'sectorTarea' },
  fechaIngreso: { header: 'Fecha Ingreso', key: 'fechaIngreso' },
  fechaInicioExposicion: { header: 'Fecha Inicio Exp.', key: 'fechaInicioExposicion' },
  fechaFinExposicion: { header: 'Fecha Fin Exp.', key: 'fechaFinExposicion' },
  horasExposicion: { header: 'Horas Exp.', key: 'horasExposicion' },
  agenteCausante: { header: 'Agente Causante', key: 'agenteCausante' },
  fechaUltimoExamenMedico: { header: 'Último Examen Médico', key: 'fechaUltimoExamenMedico' },
};
