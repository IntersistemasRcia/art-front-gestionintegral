"use client";
import React, { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { type Field, formatQuery, type RuleGroupType, type ValueEditorType, type DefaultOperators, defaultOperators } from 'react-querybuilder';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { type GridColType } from '@mui/x-data-grid';
import QueriesAPI, { type Query, type FiltroVm } from '@/data/queryAPI';
import Formato from '@/utils/Formato';
import propositionFormat from '@/utils/PropositionFormatQuery';
import { type ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { saveTable, type TableColumn, type AddTableOptions } from '@/utils/excelUtils';
import { FiltrosTable, FiltrosTableContextProvider } from '@/components/filtros/FiltrosTable';
import CustomModal from '@/utils/ui/form/CustomModal';
import parsePropositionGroup from '@/utils/PropositionParseQuery';
import FiltroForm from '@/components/filtros/FiltroForm';

//#region types
type Row = Record<string, any>;
type Formatter = (value: any) => any;
type TablesName = "vSiniestrosWeb";
interface TablesField {
  name: string;
  label?: string;
  type?: GridColType;
  operators?: DefaultOperators;
  formatter?: Formatter;
  valueEditorType?: ValueEditorType;
  values?: any[];
}
type Tables = Record<TablesName, TablesField[]>;
type OptionsFormatter = (options: any) => Formatter;
type OptionsValues = (options: any) => { name: string, label: any }[];
type Headers = { columns: Record<string, TableColumn>, options: AddTableOptions };

interface DataContextType {
  fields: Field[];
  columns: ColumnDef<Row>[];
  rows: Row[];
  query: { state: RuleGroupType, setState: React.Dispatch<React.SetStateAction<RuleGroupType>> };
  dialog?: React.ReactNode;

  proposition?: string;
  filtro?: FiltroVm;
  onLookupFiltro: () => void;
  onGuardaFiltro: () => void;
  onEliminaFiltro: () => void;

  onAplicaFiltro: () => void;
  onLimpiaFiltro: () => void;
  onLimpiaTabla: () => void;
  onExport: () => void;
}
//#endregion types

//#region globales
const { execute, analyze } = QueriesAPI;
const defaultQuery: RuleGroupType = { combinator: 'and', rules: [] };

const numeroSiniestroFormatter: Formatter = (v) => Formato.Mascara(v, "####-######-##");
const fechaHoraFormatter: Formatter = (v) => Formato.FechaHora(v);

const fechaFormatter: Formatter = (v) => {
  if (v == null) return "";
  const s = String(v).trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return Formato.Fecha(s);

  if (/^\d{10,13}$/.test(s)) {
    const t = Number(s);
    const d = new Date(s.length === 13 ? t : t * 1000);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getUTCDate()).padStart(2, "0");
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const yyyy = d.getUTCFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  }

  const byUtils = Formato.Fecha(s);
  return byUtils || s;
};

const numeroFormatter: Formatter = (v) => Formato.Numero(v);
const cuipFormatter: Formatter = (v) => Formato.CUIP(v);

const valueOptionsFormatter: OptionsFormatter = (options) => {
  const map = options ?? {};
  return (v: string) => {
    if (v == null) return v;
    // exact key match
    if (v in map) return map[v];
    const nk = normalizeKey(v);
    // try matching against keys or labels ignoring spaces/underscores and case
    for (const [k, label] of Object.entries(map)) {
      if (normalizeKey(k) === nk) return label;
      if (typeof label === 'string' && normalizeKey(label) === nk) return label;
    }
    return v;
  };
};
const optionsValues: OptionsValues = (options) => Object.entries<string>(options ?? {}).map(([name, label]) => ({ name, label }));
const optionsSelect = (options: any, formatter = valueOptionsFormatter, values = optionsValues): {
  operators: DefaultOperators,
  valueEditorType: ValueEditorType,
  formatter: Formatter,
  values: any[],
} => ({
  operators: defaultOperators.filter((op) => op.name === '='),
  valueEditorType: "select",
  formatter: formatter(options),
  values: values(options),
});

const SNOptions = { S: "Si", N: "No" };
const tipoSiniestroOptions = {
  AccidenteTrabajo: "AccidenteTrabajo",
  Enfermedad: "P - Enfermedad Profesional",
  AccidenteInItinere: "AccidenteinItinere",
  Reingreso: "Reingreso",
};

const SiniestrosContext = createContext<DataContextType | undefined>(undefined);
//#endregion globales

//#region helpers
const normalizeKey = (s: string) => (typeof s === "string" ? s.toLowerCase().replace(/[_\s]/g, "") : s);
const tolerantGet = (row: Row, key: string) => {
  if (!row) return undefined;
  if (key in row) return row[key];
  const nk = normalizeKey(key);
  for (const k of Object.keys(row)) {
    if (normalizeKey(k) === nk) return row[k];
  }
  return undefined;
};
const display = (v: any) => (typeof v === "string" ? v.trim() : v);
//#endregion helpers tolerantes

export function SiniestrosContextProvider({ children }: { children: ReactNode }) {
  const [tables] = useState<Tables>({
    vSiniestrosWeb: [
      { name: "Siniestro", label: "Siniestro", type: "number", formatter: numeroSiniestroFormatter },

      { name: "Reingreso", label: "Reingreso", type: "dateTime", formatter: fechaHoraFormatter },
      { name: "Poliza", label: "Póliza", type: "number", formatter: numeroFormatter },

      { name: "Cuit", label: "CUIT", type: "number", formatter: cuipFormatter },
      { name: "RazonSocial", label: "Razón Social" },

      { name: "Ciiu", label: "CIIU" },
      { name: "CiiuDetalle", label: "Detalle CIIU" },

      { name: "Establecimiento", label: "Establecimiento" },
      { name: "EstablecimientoMu", label: "Establecimiento MU" },
      { name: "EstablecimientoIdSrt", label: "Establecimiento Id SRT", type: "number" },
      { name: "EstablecimientoTipo", label: "Establecimiento Tipo" },

      { name: "EstablecimientoProvincia", label: "Prov. Establecimiento (Desc.)" },
      { name: "EstablecimientoLocalidad", label: "Loc. Establecimiento (Desc.)" },

      { name: "ProvinciaOcurrenciaDes", label: "Prov. Ocurrencia (Desc.)" },
      { name: "LocalidadOcurrenciaDesc", label: "Loc. Ocurrencia (Desc.)" },

      { name: "Gestor", label: "Gestor" },

      { name: "Cuil", label: "CUIL", type: "number", formatter: cuipFormatter },
      { name: "ApellidoNombre", label: "Apellido y Nombre" },
      { name: "Edad", label: "Edad", type: "number", formatter: numeroFormatter },

      { name: "ModalidadDenuncia", label: "Modalidad Denuncia" },
      { name: "Tipo", label: "Tipo Siniestro", ...optionsSelect(tipoSiniestroOptions) },
      { name: "Categoria", label: "Categoría" },
      { name: "Gravedad", label: "Gravedad" },
      { name: "Roam", label: "ROAM", ...optionsSelect(SNOptions) },
      { name: "Cronico", label: "Crónico", ...optionsSelect(SNOptions) },

      { name: "FechaOcurrencia", label: "Fecha Ocurrencia", type: "date", formatter: fechaFormatter },
      { name: "FechaTomaConocimiento", label: "Toma de Conocimiento", type: "date", formatter: fechaFormatter },
      { name: "FechaDenuncia", label: "Fecha Denuncia", type: "date", formatter: fechaFormatter },

      { name: "CIE10", label: "CIE10" },

      { name: "FormaAccidente", label: "Forma Accidente" },
      { name: "NaturalezaLesion1", label: "Naturaleza Lesión 1" },
      { name: "NaturalezaLesion2", label: "Naturaleza Lesión 2" },
      { name: "NaturalezaLesion3", label: "Naturaleza Lesión 3" },

      { name: "AgenteMaterialAt", label: "Agente Material AT" },
      { name: "ZonaAfectadaAt", label: "Zona Afectada AT" },

      { name: "AgenteCausanteEP", label: "Agente Causante EP" },
      { name: "AgenteMaterialEp", label: "Agente Material EP" },
      { name: "ZonaAfectadaEp", label: "Zona Afectada EP" },

      { name: "CuitPrestadorInicial", label: "CUIT Prestador Inicial", type: "number", formatter: cuipFormatter },
      { name: "PrestadorInicial", label: "Prestador Inicial" },
      { name: "PrestadorActual", label: "CUIT Prestador Actual" },

      { name: "FechaAltaMedica", label: "Fecha Alta Médica", type: "date", formatter: fechaFormatter },
      { name: "DiasIlt", label: "Días ILT", type: "number", formatter: numeroFormatter },

      { name: "ExpedienteCcmm", label: "Expediente CCMM" },
      { name: "EnteCcmm", label: "Ente CCMM" },
      { name: "FechaDictamen", label: "Fecha Dictamen", type: "date", formatter: fechaFormatter },
      { name: "TipoIncapacidad", label: "Tipo Incapacidad" },
      { name: "PorcentajeIncapacidad", label: "% Incapacidad", type: "number", formatter: numeroFormatter },
    ],
  });

  //#region columns, fields, headers
  const { columns, fields, headers } = useMemo(() => {
    const columns: ColumnDef<Row>[] = [];
    const headers: Headers = { columns: {}, options: { formatters: { row: {} } } };

    const fields: Field[] = tables.vSiniestrosWeb.map(column => {
      const { name, label, formatter, operators, valueEditorType, values, type } = column;

      // Tabla (usa accessorKey, pero la celda lee de row.original con getter tolerante)
      columns.push({
        accessorKey: name,
        header: label ?? name,
        cell: (info) => {
          const raw = tolerantGet(info.row.original, name);
          const val = display(raw);
          return formatter ? formatter(val) : (val ?? "");
        }
      });

      // Headers para Excel
      headers.columns[name] = { key: name, header: label ?? name };
      if (formatter) headers.options.formatters!.row![name] = formatter;

      // Field para QueryBuilder
      return ({
        name, label: label ?? name, operators, valueEditorType, values,
        inputType: type ? (type === "dateTime" ? "datetime-local" : type) : undefined
      });
    });

    return ({ columns, fields, headers });
  }, [tables.vSiniestrosWeb]);
  //#endregion columns, fields, headers

  //#region rows, query, dialog, filtro
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState(defaultQuery);
  const [dialog, setDialog] = useState<React.ReactNode>();
  const [filtro, setFiltro] = useState<FiltroVm | undefined>();
  //#endregion rows, query, dialog, filtro

  //#region proposition (string serializada)
  const proposition = useMemo(
    () => formatQuery(query, propositionFormat({ fields })),
    [query, fields]
  );
  //#endregion

  //#region helpers diálogo
  const onCloseDialog = useCallback(() => setDialog(null), []);
  const errorDialog = useCallback((prop: { title?: string, message: any }) => setDialog(
    <Dialog
      open
      scroll="paper"
      onClose={onCloseDialog}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
    >
      {prop.title === undefined ? (null) : (<DialogTitle id="scroll-dialog-title">{prop.title}</DialogTitle>)}
      <DialogContent dividers>
        <DialogContentText id="scroll-dialog-description" tabIndex={-1}>{prop.message}</DialogContentText>
      </DialogContent>
      <DialogActions><Button onClick={onCloseDialog}>Cierra</Button></DialogActions>
    </Dialog>
  ), [onCloseDialog]);
  //#endregion helpers diálogo

  //#region acciones filtros guardados
  const onLookupFiltro = useCallback(() => {
    setDialog(
      <FiltrosLookup
        onClose={onCloseDialog}
        onSelect={(f) => {
          setFiltro(f);
          setQuery(parsePropositionGroup(f.proposition));
          onCloseDialog();
        }}
      />
    );
  }, [onCloseDialog]);

  const onGuardaFiltro = useCallback(() => {
    setDialog(
      <FiltroForm
        action={filtro == null ? "Create" : "Update"}
        title="Guardando filtro"
        init={{
          ...filtro,
          modulo: "Informes_Siniestros",
          proposition
        }}
        onClose={(completed, filtroGuardado) => {
          if (completed && filtroGuardado) setFiltro(filtroGuardado);
          onCloseDialog();
        }}
      />
    );
  }, [filtro, proposition, onCloseDialog]);

  const onEliminaFiltro = useCallback(() => {
    setDialog(
      <FiltroForm
        action="Delete"
        title="Borrando filtro"
        init={filtro}
        disabled={{ nombre: true, ambito: true }}
        onClose={(completed) => {
          if (completed) setFiltro(undefined);
          onCloseDialog();
        }}
      />
    );
  }, [filtro, onCloseDialog]);
  //#endregion acciones filtros guardados

  //#region acciones (aplicar/limpiar/exportar)
  const onAplicaFiltro = useCallback(async () => {
    const table: TablesName = "vSiniestrosWeb";

    const apiQuery: Query = {
      select: tables[table].map(c => ({ value: c.name, name: c.name })), // alias = nombre exacto
      from: [{ table }],
      order: { by: [tables[table][0].name] } // ordena por la primera (Siniestro)
    };
    if (proposition) apiQuery.where = normalizeProposition(proposition);

    async function onConfirm() {
      await execute<Row>(apiQuery).then((ok) => {
        setRows(ok.data ?? []);
        onCloseDialog();
      }).catch((error) => errorDialog({
        message: typeof error === "string" ? error : error.detail ?? error.message ?? JSON.stringify(error)
      }));
    }

    await analyze(apiQuery)
      .then(async (ok) => (ok.count > 90)
        ? setDialog(
          <Dialog
            open
            scroll="paper"
            onClose={onCloseDialog}
            aria-labelledby="scroll-dialog-title"
            aria-describedby="scroll-dialog-description"
          >
            <DialogTitle id="scroll-dialog-title">Consulta con muchos registros.</DialogTitle>
            <DialogContent dividers>
              <DialogContentText id="scroll-dialog-description" tabIndex={-1}>
                La consulta generará {ok.count} registros.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCloseDialog}>Cancela</Button>
              <Button onClick={onConfirm}>Continúa</Button>
            </DialogActions>
          </Dialog>
        )
        : onConfirm()
      )
      .catch((error) => errorDialog({
        message: typeof error === "string" ? error : error.detail ?? error.message ?? JSON.stringify(error)
      }));
  }, [proposition, tables, execute, analyze, onCloseDialog, errorDialog]);
  
  function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function normalizeProposition(prop?: string) {
    if (!prop) return prop;
    let p = String(prop);
    try {
      for (const [key, label] of Object.entries(tipoSiniestroOptions)) {
        const re = new RegExp("\\b" + escapeRegExp(key) + "\\b", 'g');
        p = p.replace(re, String(label));
      }
    } catch (_e) { /* ignore */ }
    return p;
  }

  const onLimpiaFiltro = useCallback(() => {
    setFiltro(undefined);
    setQuery(defaultQuery);
  }, []);

  const onLimpiaTabla  = useCallback(() => setRows([]), []);

  const onExport = useCallback(async () => {
    const now = dayjs();
    const options = { sheet: { name: "Siniestros" }, table: headers.options };
    const fileName = `${options.sheet.name.replaceAll(" ", "_")}-${now.format("YYYYMMDDHHmmssSSS")}.xlsx`;
    options.sheet.name += ` (${now.format("DD-MM-YYYY")})`;

    setDialog(
      <Dialog
        open
        scroll="paper"
        onClose={onCloseDialog}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">Exportando a excel.</DialogTitle>
      </Dialog>
    );

    await saveTable(headers.columns, rows, fileName, options).then(
      onCloseDialog,
      (e) => errorDialog({
        title: "Error al generar excel",
        message: e?.message ?? "Ocurrió un error desconocido al generar excel"
      })
    );
  }, [headers, rows, onCloseDialog, errorDialog]);
  //#endregion acciones (aplicar/limpiar/exportar)

  //#region provider
  const value: DataContextType = {
    fields,
    columns,
    rows,
    dialog,
    proposition,
    filtro,
    query: { state: query, setState: setQuery },
    onLookupFiltro,
    onGuardaFiltro,
    onEliminaFiltro,
    onAplicaFiltro,
    onLimpiaFiltro,
    onLimpiaTabla,
    onExport,
  };
  return <SiniestrosContext.Provider value={value}>{children}</SiniestrosContext.Provider>;
  //#endregion provider
}

export function useSiniestrosContext() {
  const context = useContext(SiniestrosContext);
  if (context === undefined) throw new Error('useSiniestrosContext must be used within a SiniestrosContextProvider');
  return context;
}
function FiltrosLookup({
  onSelect,
  onClose,
}: {
  onSelect: (filtro: FiltroVm) => void;
  onClose: () => void;
}) {
  return (
    <CustomModal
      open={true}
      onClose={onClose}
      title="Elige filtro"
    >
      <FiltrosTableContextProvider deleted={false} modulo="Informes_Siniestros">
        <FiltrosTable onSelect={onSelect} />
      </FiltrosTableContextProvider>
    </CustomModal>
  );
}
