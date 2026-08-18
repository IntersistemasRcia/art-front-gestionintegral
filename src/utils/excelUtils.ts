import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { pick } from './utils';

//#region import types
export interface TrabajadorExcel {
  CUIL: string;
  Nombre: string;
  SectorTareas: string;
  Ingreso: string;
  FechaInicio: string;
  Exposicion: string;
  FechaFinExposicion?: string;
  UltimoExamenMedico: string;
  CodigoAgente: string;
  AgenteCausanteDisplay?: string;
}

export interface ResultadoImportacion {
  exitosos: TrabajadorExcel[];
  errores: Array<{
    fila: number;
    cuil: string;
    errores: string[];
  }>;
  total: number;
}
//#endregion import types

//#region helper functions

/**
 * Convierte un valor de Excel (puede ser Date, número serial, o string) a formato DD/MM/YYYY
 */
const convertirFechaExcel = (valor: any): string => {
  if (!valor) return '';
  
  // Si es una cadena, devuelverla tal cual
  if (typeof valor === 'string') {
    return valor.trim();
  }
  
  // Si es un objeto Date
  if (valor instanceof Date) {
    const dia = String(valor.getDate()).padStart(2, '0');
    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const año = valor.getFullYear();
    return `${dia}/${mes}/${año}`;
  }
  
  // Si es un número (serial de Excel)
  if (typeof valor === 'number') {
    // El serial de Excel comienza en 1900-01-01
    // Excel serial 1 = 1900-01-01, pero hay un bug histórico (año bisiesto de 1900 que no existió)
    const excelEpoch = new Date(1900, 0, 1);
    const fecha = new Date(excelEpoch.getTime() + (valor - 1) * 24 * 60 * 60 * 1000);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
  }
  
  return '';
};

/**
 * Valida si una fecha está en formato DD/MM/YYYY o YYYY-MM-DD (flexibiliza días y meses sin cero a la izquierda)
 * Acepta formatos como: 18/4/2024, 18/04/2024, 4/2/2024, 04/02/2024, etc.
 */
const validarFormatoFecha = (fecha: string): { valida: boolean; fecha: string } => {
  if (!fecha) return { valida: false, fecha: '' };
  
  const fechaTrim = fecha.trim();
  
  // Formato DD/MM/YYYY (flexible: permite 1-2 dígitos para día y mes)
  const regexDDMMYYYY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const matchDDMMYYYY = fechaTrim.match(regexDDMMYYYY);
  
  if (matchDDMMYYYY) {
    const [, dia, mes, año] = matchDDMMYYYY;
    const diaNum = parseInt(dia, 10);
    const mesNum = parseInt(mes, 10);
    const añoNum = parseInt(año, 10);
    
    if (diaNum < 1 || diaNum > 31 || mesNum < 1 || mesNum > 12) {
      return { valida: false, fecha: '' };
    }
    
    // Convertir a YYYY-MM-DD para almacenar (con ceros a la izquierda)
    const fechaFormato = `${año}-${String(mesNum).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
    return { valida: true, fecha: fechaFormato };
  }
  
  // Formato YYYY-MM-DD (flexible: permite 1-2 dígitos para mes y día)
  const regexYYYYMMDD = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const matchYYYYMMDD = fechaTrim.match(regexYYYYMMDD);
  
  if (matchYYYYMMDD) {
    const [, año, mes, dia] = matchYYYYMMDD;
    const diaNum = parseInt(dia, 10);
    const mesNum = parseInt(mes, 10);
    
    if (diaNum < 1 || diaNum > 31 || mesNum < 1 || mesNum > 12) {
      return { valida: false, fecha: '' };
    }
    
    // Normalizar a YYYY-MM-DD con ceros a la izquierda
    const fechaFormato = `${año}-${String(mesNum).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`;
    return { valida: true, fecha: fechaFormato };
  }
  
  return { valida: false, fecha: '' };
};

/**
 * Compara dos fechas en formato YYYY-MM-DD
 * Retorna true si fecha1 > fecha2
 */
const esFechaPosteriror = (fecha1: string, fecha2: string): boolean => {
  return fecha1 > fecha2;
};

//#endregion helper functions

//#region types
export type TableRow = Record<string, any>;
export type TableColumn = Partial<ExcelJS.Column>;
export type TableRowFormatter = (value: any) => any;
export type TableColumnFormatter = (column: TableColumn, rowValue?: any) => any;
export type AddTableOptions = {
  formatters?: {
    column?: Record<string, TableColumnFormatter>,
    row?: Record<string, TableRowFormatter>,
  }
};
export type Sheet = ExcelJS.Worksheet;
export type SheetOptions = Partial<ExcelJS.AddWorksheetOptions>;
export type SaveTableOptions = {
  format?: "xlsx" | "csv",
  sheet?: {
    name?: string,
    options?: SheetOptions,
  },
  table?: AddTableOptions,
}
//#endregion types
//#region defaults
export const defaultTableColumnFormatter: TableColumnFormatter = Object.freeze((column, rowValue) => {
  if (column.width == null)
    column.width = calcWidth((Array.isArray(column.header))
      ? column.header.reduce((p, c) => c.length > p.length ? c : p)
      : column.header ?? "");
  if (rowValue == null) return rowValue;
  let width = calcWidth(rowValue);
  if (column.width < width) column.width = width;
  return rowValue;
  function calcWidth(value: string) { return value.length + 3 };
});
export const defaultTableRowFormatter: TableRowFormatter = Object.freeze((value) => value);
export const defaultKey = Object.freeze("");
export const defaultTableColumnFormatters: Record<string, TableColumnFormatter> = Object.freeze({ [defaultKey]: defaultTableColumnFormatter });
export const defaultTableRowFormatters: Record<string, TableRowFormatter> = Object.freeze({ [defaultKey]: defaultTableRowFormatter });
export const defaultTableOptions: AddTableOptions = Object.freeze({
  formatters: Object.freeze({ column: defaultTableColumnFormatters, row: defaultTableRowFormatters })
});
//#endregion defaults

export function addTable(
  sheet: Sheet,
  columns: Record<string, TableColumn>,
  rows: TableRow[],
  options?: AddTableOptions,
) {
  options = { ...defaultTableOptions, ...options };
  const formatters = {
    column: { ...defaultTableColumnFormatters, ...options.formatters?.column },
    row: { ...defaultTableRowFormatters, ...options.formatters?.row },
  };

  const headers = Object.fromEntries(Object.entries(columns).map(([key, value]) => [key, { ...value }]));
  const lines = rows.map((row) => Object.fromEntries(Object.entries(pick(row, headers)).map(([key, value]) => {
    const columnFormatter = formatters.column[key] ?? formatters.column[defaultKey];
    const rowFormatter = formatters.row[key] ?? formatters.row[defaultKey];
    return [key, columnFormatter(headers[key], rowFormatter(value))];
  })));
  sheet.columns = Object.values(headers);

  // Estilos para encabezado
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'A8D08D' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  sheet.addRows(lines);
}

export async function saveXlsx(workbook: ExcelJS.Workbook, fileName: string) {
  return await workbook.xlsx.writeBuffer().then((buffer) => saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    fileName
  ));
}

export async function saveCsv(workbook: ExcelJS.Workbook, fileName: string) {
  return await workbook.csv.writeBuffer().then((buffer) => saveAs(
    new Blob([buffer], { type: 'application/text' }),
    fileName
  ));
}

export async function saveTable(
  columns: Record<string, TableColumn>,
  rows: TableRow[],
  fileName: string,
  options?: SaveTableOptions,
) {
  options ??= {};
  options.sheet ??= {};

  const workbook = new ExcelJS.Workbook();

  addTable(workbook.addWorksheet(options.sheet.name, options.sheet.options), columns, rows, options.table);

  switch (options.format ?? "xlsx") {
    case "xlsx": return await saveXlsx(workbook, fileName);
    case "csv": return await saveCsv(workbook, fileName);
  }
}

//#region importación de trabajadores desde Excel

/**
 * Lee un archivo Excel y extrae los datos de los trabajadores
 * @param file - Archivo Excel cargado por el usuario
 * @param maxTrabajadores - Cantidad máxima de trabajadores a importar (basado en cantExpuestos + cantNoExpuestos)
 * @returns Promesa con el resultado de la importación
 */
export async function importarTrabajadoresDesdeExcel(file: File, maxTrabajadores?: number, fechaCargaFormulario?: string): Promise<ResultadoImportacion> {
  const workbook = new ExcelJS.Workbook();
  
  // Leer el archivo
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0];
  const resultado: ResultadoImportacion = {
    exitosos: [],
    errores: [],
    total: 0
  };

  if (!worksheet) {
    throw new Error('El archivo Excel no contiene hojas de trabajo');
  }

  let numFila = 0;
  let contadorExitosos = 0;
  const fechaCarga = fechaCargaFormulario || new Date().toISOString().slice(0, 10);

  // Procesar filas (saltamos solo el encabezado: fila 1)
  worksheet.eachRow((row, rowNumber) => {
    // Saltar encabezado (fila 1)
    if (rowNumber <= 1) return;

    numFila = rowNumber;
    const erroresFila: string[] = [];

    // Extraer valores de las celdas (de acuerdo al orden esperado)
    const cuil = String(row.getCell(1).value || '').trim();
    const nombre = String(row.getCell(2).value || '').trim();
    const sectorTareas = String(row.getCell(3).value || '').trim();
    
    // Convertir fechas de Excel al formato DD/MM/YYYY
    const ingreso = convertirFechaExcel(row.getCell(4).value);
    const fechaInicio = convertirFechaExcel(row.getCell(5).value);
    
    let exposicion = String(row.getCell(6).value || '').trim();
    const horasExposicion = Number(String(exposicion || '').replace(/[^0-9]/g, '') || 0);
    
    // Convertir fecha fin exposición
    const fechaFinExposicion = convertirFechaExcel(row.getCell(7).value);
    
    // Convertir último examen médico
    const ultimoExamenMedico = convertirFechaExcel(row.getCell(8).value);
    
    const codigoAgenteRaw = row.getCell(9).value;
    const codigoAgente = codigoAgenteRaw instanceof Date && Number(exposicion) === 0
      ? '1'
      : String(codigoAgenteRaw || '').trim();

    if (!exposicion && codigoAgente === '1') exposicion = '0';

    // Si la fila está completamente vacía, no la contamos ni la procesamos
    const filaVacia = [cuil, nombre, sectorTareas, ingreso, fechaInicio, exposicion, fechaFinExposicion, ultimoExamenMedico, codigoAgente]
      .every(v => (v ?? '').trim() === '');
    if (filaVacia) return;

    // Validar CUIL
    const cuilNumerico = cuil.replace(/\D/g, '');
    if (!cuil || cuilNumerico.length < 11) {
      erroresFila.push('CUIL inválido (debe tener 11 dígitos)');
    }

    // Validar Nombre
    if (!nombre) {
      erroresFila.push('Nombre es requerido');
    }

    // Validar Sector
    if (!sectorTareas) {
      erroresFila.push('Sector/Tareas es requerido');
    }

    // Validar Fecha de Ingreso
    if (!ingreso) {
      erroresFila.push('Fecha de Ingreso es requerida');
    } else {
      const validacionIngreso = validarFormatoFecha(ingreso);
      if (!validacionIngreso.valida) {
        erroresFila.push('Fecha de Ingreso debe estar en formato DD/MM/YYYY (ej: 15/1/2023 o 15/01/2023)');
      }
    }

    // Validar Fecha Inicio Exposición
    if (!fechaInicio && horasExposicion > 0) {
      erroresFila.push('Fecha de Inicio Exposición es requerida');
    } else if (fechaInicio) {
      const validacionInicio = validarFormatoFecha(fechaInicio);
      if (!validacionInicio.valida) {
        erroresFila.push('Fecha de Inicio Exposición debe estar en formato DD/MM/YYYY (ej: 15/1/2023 o 15/01/2023)');
      }
    }

    // Validar Exposición
    if (!exposicion) {
      erroresFila.push('Nivel de Exposición es requerido');
    } else if (isNaN(Number(exposicion)) || Number(exposicion) < 0) {
      erroresFila.push('Nivel de Exposición debe ser un número >= 0');
    }

    // Validar Último Examen Médico
    if (!ultimoExamenMedico && horasExposicion > 0) {
      erroresFila.push('Último Examen Médico es requerido');
    } else if (ultimoExamenMedico) {
      const validacionExamen = validarFormatoFecha(ultimoExamenMedico);
      if (!validacionExamen.valida) {
        erroresFila.push('Último Examen Médico debe estar en formato DD/MM/YYYY (ej: 30/6/2024 o 30/06/2024)');
      }
    }

    // Validar Código Agente
    if (!codigoAgente) {
      erroresFila.push('Código Agente es requerido');
    } else if (isNaN(Number(codigoAgente))) {
      erroresFila.push('Código Agente debe ser un número válido');
    } else if (Number(codigoAgente) === 1 && Number(exposicion) !== 0) {
      erroresFila.push('Código Agente 1 solo es válido si Horas Exposición es 0');
    }

    // Validar Fecha Fin Exposición (es opcional, pero si se proporciona debe ser válida)
    let fechaFinExposicionValidada = '';
    if (fechaFinExposicion && fechaFinExposicion.trim() !== '') {
      const validacionFin = validarFormatoFecha(fechaFinExposicion);
      if (!validacionFin.valida) {
        erroresFila.push('Fecha Fin Exposición debe estar en formato DD/MM/YYYY');
      } else {
        fechaFinExposicionValidada = validacionFin.fecha;
      }
    }

    const validacionIngreso = validarFormatoFecha(ingreso);
    const validacionInicio = validarFormatoFecha(fechaInicio);
    const validacionExamen = validarFormatoFecha(ultimoExamenMedico);

    if (validacionIngreso.valida && validacionIngreso.fecha > fechaCarga) {
      erroresFila.push('La fecha de ingreso debe ser menor o igual a la fecha de carga del formulario RAR');
    }
    if (validacionInicio.valida && validacionIngreso.valida && validacionInicio.fecha < validacionIngreso.fecha) {
      erroresFila.push('La fecha inicio exposición debe ser mayor o igual a la fecha de ingreso');
    }
    if (validacionExamen.valida && validacionIngreso.valida && validacionExamen.fecha < validacionIngreso.fecha) {
      erroresFila.push('La fecha del último examen médico debe ser posterior a la fecha de ingreso');
    }
    if (fechaFinExposicionValidada && validacionInicio.valida && fechaFinExposicionValidada < validacionInicio.fecha) {
      erroresFila.push('La fecha fin exposición debe ser mayor o igual a la fecha inicio exposición');
    }

    // Si hay errores, añadir a errores
    if (erroresFila.length > 0) {
      resultado.errores.push({
        fila: numFila,
        cuil,
        errores: erroresFila
      });
    } else {
      // Añadir a exitosos solo si no hemos alcanzado el máximo
      if (!maxTrabajadores || contadorExitosos < maxTrabajadores) {
        resultado.exitosos.push({
          CUIL: cuil,
          Nombre: nombre,
          SectorTareas: sectorTareas,
          Ingreso: validacionIngreso.fecha,
          FechaInicio: validacionInicio.fecha,
          Exposicion: exposicion,
          FechaFinExposicion: fechaFinExposicionValidada || '',
          UltimoExamenMedico: validacionExamen.fecha,
          CodigoAgente: codigoAgente,
          AgenteCausanteDisplay: codigoAgente // Se actualiza después con la descripción
        });
        contadorExitosos++;
      }
    }

    resultado.total++;
  });

  return resultado;
}

/**
 * Descarga una plantilla Excel mejorada con ejemplos y instrucciones detalladas
 */
export async function descargarPlantillaExcel() {
  const workbook = new ExcelJS.Workbook();
  
  // Hoja 1: Plantilla de datos
  const worksheet = workbook.addWorksheet('Trabajadores', { pageSetup: { paperSize: 9, orientation: 'landscape' } });

  // Definir encabezados
  worksheet.columns = [
    { header: 'CUIL', key: 'CUIL', width: 18 },
    { header: 'Nombre', key: 'Nombre', width: 35 },
    { header: 'Sector/Tareas', key: 'SectorTareas', width: 30 },
    { header: 'Fecha Ingreso\n(DD/MM/YYYY)', key: 'Ingreso', width: 18 },
    { header: 'Fecha Inicio\nExposición (DD/MM/YYYY)', key: 'FechaInicio', width: 22 },
    { header: 'Horas\nExposición', key: 'Exposicion', width: 15 },
    { header: 'Fecha Fin Exposición\n(DD/MM/YYYY) - Opcional', key: 'FechaFinExposicion', width: 25 },
    { header: 'Último Examen Médico\n(DD/MM/YYYY)', key: 'UltimoExamenMedico', width: 22 },
    { header: 'Código\nAgente', key: 'CodigoAgente', width: 12 }
  ];

  // Evitar que Excel convierta el Código de Agente a fecha
  // Forzamos formato de texto para esta columna
  worksheet.getColumn('CodigoAgente').numFmt = '@';

  // Estilos para encabezado
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Altura de encabezado
  worksheet.getRow(1).height = 45;

  // ✅ SOLO DEJAMOS LA CABECERA - Los ejemplos irán a la hoja de Instrucciones

  // Hoja 2: Instrucciones detalladas con ejemplos
  const instruccionesSheet = workbook.addWorksheet('Instrucciones');
  instruccionesSheet.columns = [{ header: 'Información', key: 'info', width: 100 }];

  const instrucciones = [
    '📋 GUÍA RÁPIDA PARA CARGAR TRABAJADORES EN EL EXCEL RAR',
    '',
    '1️⃣ Complete la hoja "Trabajadores"',
    '   • No modifique la primera fila (cabecera).',
    '   • Ingrese datos desde la fila 2.',
    '',
    '2️⃣ Datos obligatorios',
    '   • CUIL: formato válido con o sin guiones (ej: 20-12345678-9 / 20123456789)',
    '   • Nombre completo: ej. Juan Pérez.',
    '   • Sector/Tareas: ej. Producción, Administración.',
    '   • Fecha ingreso: DD/MM/AAAA (ej: 15/01/2023). Debe ser igual o anterior a la fecha de carga del formulario.',
    '   • Fecha inicio exposición: igual o posterior a ingreso.',
    '   • Horas exposición: número de horas diarias (ej: 8).',
    '   • Último examen médico: fecha posterior o igual al ingreso.',
    '   • Código agente: ingresar dígitos (ej: 40005)',
     '  • Trabajador sin exposición: Código 1 - Sin exposición. En este caso, la columna “Fecha inicio exposición” debe quedar vacía.',
    '',
    '3️⃣ Datos opcionales',
    '   • Fecha fin exposición: solo si ya terminó la exposición.',
    '',
    '4️⃣ Si un trabajador tiene varios agentes',
    '   • Ingrese una fila por cada agente.',
    '',
    '✅ Ejemplo simple: CUIL: 20-12345678-9 | Nombre: Juan Pérez | Sector: Producción | Fecha ingreso: 15/01/2023 | Inicio exposición: 15/01/2023 | Horas: 8 | Último examen: 30/06/2024 | Código agente: 40005'
  ];

  instrucciones.forEach((linea) => {
    const row = instruccionesSheet.addRow({ info: linea });
    if (linea.startsWith('📋') || linea.startsWith('✅')) {
      row.getCell('info').font = { bold: true, size: 12, color: { argb: 'FF1F4E78' } };
    } else if (linea.match(/^\d️⃣|^⏱️/)) {
      row.getCell('info').font = { bold: true, size: 11, color: { argb: 'FF2E5090' } };
    } else if (linea.startsWith('   ')) {
      row.getCell('info').font = { size: 10 };
    } else if (linea === '') {
      row.height = 5;
    }
    row.getCell('info').alignment = { vertical: 'top', wrapText: true };
  });

  // Descargar
  await saveXlsx(workbook, 'Plantilla_Trabajadores.xlsx');
}

//#endregion importación de trabajadores desde Excel