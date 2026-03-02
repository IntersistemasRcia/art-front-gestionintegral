"use client";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Field,
  formatQuery,
  type RuleGroupType,
  type ValueEditorType,
  type DefaultOperators,
} from "react-querybuilder";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import QueriesAPI, { type FiltroVm, type Query } from "@/data/queryAPI";
import Formato from "@/utils/Formato";
import propositionFormat from "@/utils/PropositionFormatQuery";
import { operators } from "@/utils/ui/queryBuilder/QueryBuilderDefaults";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { saveTable, type TableColumn, type AddTableOptions } from "@/utils/excelUtils";
import { FiltrosTable, FiltrosTableContextProvider } from "@/components/filtros/FiltrosTable";
import CustomModal from "@/utils/ui/form/CustomModal";
import parsePropositionGroup from "@/utils/PropositionParseQuery";
import FiltroForm from "@/components/filtros/FiltroForm";

// ===== Tipos =====
type Row = Record<string, any>;
type Formatter = (value: any) => any;
type TablesName = "vw_AtencionAlPublico";
interface TablesField {
  name: string;
  label?: string;
  type?: "text" | "number" | "date" | "dateTime";
  operators?: DefaultOperators;
  formatter?: Formatter;
  valueEditorType?: ValueEditorType;
  values?: any[];
}
type Tables = Record<TablesName, TablesField[]>;
type Headers = { columns: Record<string, TableColumn>; options: AddTableOptions };
interface DataContextType {
  fields: Field[];
  columns: ColumnDef<Row>[];
  rows: Row[];
  query: { state: RuleGroupType; setState: React.Dispatch<React.SetStateAction<RuleGroupType>> };
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

// ===== Helpers / formatters =====
const fechaFormatter = (v: any) => Formato.Fecha(v);
const numeroFormatter = (v: any) => Formato.Numero(v);
const cuipFormatter = (v: any) => Formato.CUIP(v);

// accessor tolerante (case-insensitive y sin _ ni espacios)
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
// normalizo para mostrar (trim strings)
const display = (v: any) => (typeof v === "string" ? v.trim() : v);

// ===== Globals =====
const { execute, analyze } = QueriesAPI;
const defaultQuery: RuleGroupType = { combinator: "and", rules: [] };
const DataContext = createContext<DataContextType | undefined>(undefined);
const MODULO_FILTROS = "Informes_AtencionAlPublico";

// ===== Provider =====
export function DataContextProvider({ children }: { children: ReactNode }) {
  const [tables] = useState<Tables>({
    vw_AtencionAlPublico: [

      { name: "Interno", label: "Número", type: "number", formatter: numeroFormatter },

      { name: "OrigenDescripcion", label: "Origen", type: "text" },

      { name: "ContactoTrabajadorEmpleador", label: "Trab./Emp.", type: "text" },
      { name: "ContactoDocNro", label: "CUIT/DNI", type: "text", formatter: cuipFormatter },
      { name: "ContactoNombre", label: "Contacto Nombre", type: "text" },

      { name: "TemaDescripcion", label: "Tema", type: "text" },
      { name: "CategoriaDescripcion", label: "Categoría", type: "text" },
      { name: "TipoTramiteDescripcion", label: "Trámite", type: "text" },
      { name: "Estado", label: "Estado", type: "text" },
      { name: "DiasTrans", label: "T. Trans.", type: "number", formatter: numeroFormatter },
      { name: "SectorDescripcion", label: "Sector", type: "text" },


      { name: "MedioDireccion", label: "Email", type: "text" },

      { name: "Apertura", label: "Fecha Contacto", type: "dateTime", formatter: fechaFormatter },
      { name: "Cierre", label: "Fecha Último Estado", type: "dateTime", formatter: fechaFormatter },
      //{ name: "AfiliadoComentario", label: "Departamento", type: "text" },

    ],
  });

  // Columnas + campos para QB
  const { columns, fields, headers } = useMemo(() => {
    const all = tables.vw_AtencionAlPublico;
    const fieldsForQB = all; // incluir todos los campos para que el QueryBuilder permita filtrarlos

    const columns: ColumnDef<Row>[] = [];
    const headers: Headers = { columns: {}, options: { formatters: { row: {} } } };

    all.forEach(({ name, label, formatter }) => {
      columns.push({
        accessorKey: name,
        header: label ?? name,
        cell: (info) => {
          const raw = tolerantGet(info.row.original, name);
          const val = display(raw);
          return formatter ? formatter(val) : (val ?? "");
        },
      });
      headers.columns[name] = { key: name, header: label ?? name };
      if (formatter) {
        headers.options.formatters!.row![name] = formatter;
      }
    });

    const fields: Field[] = fieldsForQB.map(({ name, label, operators: colOps, valueEditorType, values, type }) => ({
      name,
      label: label ?? name,
      // si el campo trae operators propios, los respeta; sino toma por tipo
      operators: colOps,
      valueEditorType,
      values,
      inputType: type ? (type === "dateTime" ? "datetime-local" : type) : undefined,
    }));

    return { columns, fields, headers };
  }, [tables.vw_AtencionAlPublico]);

  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState(defaultQuery);
  const [dialog, setDialog] = useState<React.ReactNode>();
  const [filtro, setFiltro] = useState<FiltroVm | undefined>();
  const [moduloFiltros, setModuloFiltros] = useState<string>(MODULO_FILTROS);

  const proposition = useMemo<string | undefined>(() => {
    const result = formatQuery(
      query,
      propositionFormat({ fields }) as any
    );

    return typeof result === "string" ? result : undefined;
  }, [query, fields]);

  const onCloseDialog = () => setDialog(null);
  const errorDialog = (prop: { title?: string; message: any }) =>
    setDialog(
      <Dialog open scroll="paper" onClose={onCloseDialog} aria-labelledby="scroll-dialog-title" aria-describedby="scroll-dialog-description">
        {prop.title ? <DialogTitle id="scroll-dialog-title">{prop.title}</DialogTitle> : null}
        <DialogContent dividers>
          <DialogContentText id="scroll-dialog-description" tabIndex={-1}>
            {prop.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDialog}>Cierra</Button>
        </DialogActions>
      </Dialog>
    );

  const onLookupFiltro = useCallback(() => {
    setDialog(
      <FiltrosLookup
        modulo={moduloFiltros}
        onClose={onCloseDialog}
        onSelect={(f) => {
          setFiltro(f);
          if (f?.modulo) setModuloFiltros(f.modulo);
          setQuery(parsePropositionGroup(f.proposition));
          onCloseDialog();
        }}
      />
    );
  }, [moduloFiltros]);

  const onGuardaFiltro = useCallback(() => {
    setDialog(
      <FiltroForm
        action={filtro == null ? "Create" : "Update"}
        title="Guardando filtro"
        init={{
          ...filtro,
          modulo: filtro?.modulo ?? moduloFiltros,
          proposition,
        }}
        onClose={(completed, filtroGuardado) => {
          if (completed && filtroGuardado) {
            setFiltro(filtroGuardado);
            if (filtroGuardado.modulo) setModuloFiltros(filtroGuardado.modulo);
          }
          onCloseDialog();
        }}
      />
    );
  }, [filtro, proposition, moduloFiltros]);

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
  }, [filtro]);

  const onAplicaFiltro = useCallback(() => {
    return (async function procesar() {
      const table = "vw_AtencionAlPublico" as const;

      const q: Query = {
        // alias = nombre exacto (como en tu componente de referencia)
        select: tables[table].map((c) => ({ value: c.name, name: c.name })),
        from: [{ table }],
        order: { by: [tables[table][0].name] }, // orden por primera columna: Interno
      };

      if (proposition) q.where = proposition;

      async function onConfirm() {
        await execute<Row>(q)
          .then((ok) => {
            const data = ok.data ?? [];
            setRows(data);

            // Diagnóstico: aviso de columnas faltantes, si aplica
            try {
              const first = data[0];
              if (first) {
                const got = Object.keys(first);
                const expected = tables[table].map((c) => c.name);
                const missing = expected.filter(
                  (n) => !got.some((k) => normalizeKey(k) === normalizeKey(n))
                );
                if (missing.length) {
                  errorDialog({
                    title: "Aviso de columnas faltantes",
                    message:
                      `Estas columnas no vienen en la respuesta del API (o llegan nulas):\n\n` +
                      missing.join(", "),
                  });
                }
              }
            } catch {}

            onCloseDialog();
          })
          .catch((error) => {
            errorDialog({
              message:
                typeof error === "string"
                  ? error
                  : error?.detail ?? error?.message ?? JSON.stringify(error),
            });
          });
      }

      await analyze(q)
        .then(async (ok) =>
          ok.count > 90
            ? setDialog(
              <Dialog open scroll="paper" onClose={onCloseDialog}>
                <DialogTitle>Consulta con muchos registros</DialogTitle>
                <DialogContent dividers>
                  <DialogContentText tabIndex={-1}>
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
        .catch((error) =>
          errorDialog({
            message:
              typeof error === "string"
                ? error
                : error?.detail ?? error?.message ?? JSON.stringify(error),
          })
        );
    })();
  }, [proposition, tables]);

  const onLimpiaFiltro = useCallback(() => {
    setFiltro(undefined);
    setQuery(defaultQuery);
  }, []);

  const onLimpiaTabla = useCallback(() => setRows([]), []);

  const onExport = useCallback(async () => {
    const now = dayjs();
    const options = { sheet: { name: "Atencion Al Publico" }, table: headers.options };
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

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// ===== Hook =====
export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useDataContext must be used within a DataContextProvider");
  }
  return context;
}

function FiltrosLookup({
  modulo,
  onSelect,
  onClose,
}: {
  modulo: string;
  onSelect: (filtro: FiltroVm) => void;
  onClose: () => void;
}) {
  return (
    <CustomModal open={true} onClose={onClose} title="Elige filtro">
      <FiltrosTableContextProvider deleted={false} modulo={modulo}>
        <FiltrosTable onSelect={onSelect} />
      </FiltrosTableContextProvider>
    </CustomModal>
  );
}
