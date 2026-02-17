// src/app/inicio/informes/comisionesMedicas/context.tsx
"use client";
import React, { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { type Field, formatQuery, type RuleGroupType, type ValueEditorType, type DefaultOperators, defaultOperators } from 'react-querybuilder';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { type GridColType } from '@mui/x-data-grid';
import QueriesAPI, { FiltroVm, type Query } from '@/data/queryAPI';
import UsuarioAPI from '@/data/usuarioAPI';
import Formato from '@/utils/Formato';
import propositionFormat from '@/utils/PropositionFormatQuery';
import { type ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { saveTable, type TableColumn, type AddTableOptions } from '@/utils/excelUtils';
import useSWR from 'swr';
import { FiltrosTable, FiltrosTableContextProvider } from '@/components/filtros/FiltrosTable';
import CustomModal from '@/utils/ui/form/CustomModal';
import parsePropositionGroup from '@/utils/PropositionParseQuery';
import FiltroForm from '@/components/filtros/FiltroForm';

//#region types
type Row = Record<string, any>;
type Formatter = (value: any) => any;
type TablesName = "RefCCMMMotivos" | "RefCCMMTipos" | "View_ConsultaCCMM";
interface TablesField {
  name: string;
  label?: string;
  type?: GridColType;
  operators?: DefaultOperators;
  formatter?: Formatter;
  valueEditorType?: ValueEditorType;
  values?: any[];
}
type Tables = Partial<Record<TablesName, TablesField[]>>;
type OptionsFormatter = (options: any) => Formatter;
type OptionsValues = (options: any) => { name: string, label: any }[];
type Headers = { columns: Record<string, TableColumn>, options: AddTableOptions };
interface DataContextType {
  fields: Field[];
  columns: ColumnDef<Row>[];
  rows: Row[];
  isLoadingData: boolean,
  query: { state: RuleGroupType, setState: React.Dispatch<React.SetStateAction<RuleGroupType>> };
  proposition?: string;
  filtro?: FiltroVm;
  dialog?: ReactNode;
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
const { execute, swrExecute, analyze } = QueriesAPI;
const { swrTablas } = UsuarioAPI;
const defaultQuery: RuleGroupType = { combinator: 'and', rules: [] };

const numeroSiniestroFormatter: Formatter = (v) => Formato.Mascara(v, "####-######-##");
const fechaHoraFormatter: Formatter = (v) => Formato.FechaHora(v);
const fechaFormatter: Formatter = (v) => Formato.Fecha(v);
const numeroFormatter: Formatter = (v) => Formato.Numero(v);
const monedaFormatter: Formatter = (v) => Formato.Moneda(v);
const porcentajeFormatter: Formatter = (v) => v == null ? v : Formato.Porcentaje(v/100);
const cuipFormatter: Formatter = (v) => Formato.CUIP(v);
const valueOptionsFormatter: OptionsFormatter = (options) => ((v: string) => (options[v] ?? v));
const blankOptionsFormatter: OptionsFormatter = (options) => ((v: string) => (options[v] ?? ""));

const optionsValues: OptionsValues = (options) => Object.entries<string>(options).map(([name, label]) => ({ name, label }))
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
const tipoSiniestroOptions = { T: "Accidente Trabajo", P: "Enfermedad Profesional", I: "Accidente In-Itinere", R: "Reingreso" };
const estadoOptions = { 1: "Pendiente", 2: "En gestión", 3: "Archivado" };
const calculoAnticipadoOptions = { 0: "Pendiente", 1: "En gestión", 2: "Finalizado" };

const CCMMContext = createContext<DataContextType | undefined>(undefined);
//#endregion globales

export function CCMMContextProvider({ children }: { children: ReactNode }) {
  const [tables, setTables] = useState<Tables>({});
  const { isLoading: isLoadingTablas } = useSWR(swrTablas.Key, swrTablas.Fetcher, {
    revalidateOnFocus: false,
    onSuccess(tablas) {
      const tables: Tables = {};
      addTable("RefCCMMMotivos", (addField) => {
        addField({ name: "Codigo" });
        addField({ name: "Descripcion" });
      });
      addTable("RefCCMMTipos", (addField) => {
        addField({ name: "Codigo" });
        addField({ name: "Descripcion" });
      });
      addTable("View_ConsultaCCMM", (addField) => {
        addField({ name: "CCMMCas_Interno", label: "Interno", type: "number" });
        addField({ name: "CCMMCas_NroCaso", label: "Nro. Caso", type: "number", formatter: numeroFormatter });
        addField({ name: "CCMMCas_Expediente", label: "Expediente" });
        addField({ name: "Den_SiniestroNro", label: "Siniestro", type: "number", formatter: numeroSiniestroFormatter });
        addField({ name: "CCMMCas_MotivoCodigo", label: "Motivo de Expediente", type: "number" });
        addField({ name: "CCMMCas_TipoCodigo", label: "Tipo de Expediente", type: "number" });
        addField({ name: "CCMMCas_Estado", label: "Estado Actual", type: "number", ...optionsSelect(estadoOptions, blankOptionsFormatter) });
        addField({ name: "SiniestroTipo", label: "Tipo de Siniestro", ...optionsSelect(tipoSiniestroOptions) });
        addField({ name: "SiniestroFechaHora", label: "Fecha de Denuncia", type: "dateTime", formatter: fechaHoraFormatter });
        addField({ name: "Den_AfiCUIL", label: "Cuil", type: "number", formatter: cuipFormatter });
        addField({ name: "Den_AfiNombre", label: "Apellido y Nombre" });
        addField({ name: "Den_EmpCuit", label: "Cuit", type: "number", formatter: cuipFormatter });
        addField({ name: "Den_EmpRazonSocial", label: "Razón Social" });
        addField({ name: "SRTPol_Numero", label: "Póliza", type: "number", formatter: numeroFormatter });
        addField({ name: "CCMMCasTipValDan_JunMediFecha", label: "Fecha de Junta Médica", type: "date", formatter: fechaFormatter });
        addField({ name: "CCMMCasTipValDan_JunMediAcuerdo", label: "Acuerdo Resultado", ...optionsSelect(SNOptions) });
        addField({ name: "CCMMCasTipValDan_JunMediLetrado", label: "Letrado Interviniente" });
        addField({ name: "CCMMCasTipValDan_AudHomoFechaHora", label: "Fecha de Homologación", type: "date", formatter: fechaHoraFormatter });
        addField({ name: "CCMMCasTipValDan_AudHomoMontoHomologado", label: "Monto Homologado", type: "number", formatter: numeroFormatter });
        addField({ name: "CCMMCasTipValDan_AcuHomoNotificacionFecha", label: "Fecha de Acuerdo", type: "date", formatter: fechaFormatter });
        addField({ name: "CCMMCasTipValDan_AcuHomoPagoFecha", label: "Fecha de Pago", type: "date", formatter: fechaFormatter });
        addField({ name: "CCMMCasTipValDan_AltaMedicaFecha", label: "Fecha alta médica", type: "date", formatter: fechaFormatter });
        addField({ name: "CCMMCasTipValDan_InicioFecha", label: "Fecha inicio", type: "date", formatter: fechaFormatter });
        addField({ name: "CCMMCasTipValDan_ILP1", label: "ILP 1%", type: "number", formatter: monedaFormatter });
        addField({ name: "CCMMCasTipValDan_CalculoAnticipado", label: "Cálculo anticipado", ...optionsSelect(calculoAnticipadoOptions) });
        addField({ name: "CCMMCasTipValDan_DefuncionFecha", label: "Fecha defunción", type: "date", formatter: fechaFormatter });
        addField({ name: "CCMMCasTipValDan_FinalizadoFecha", label: "Fecha finalizado", type: "date", formatter: fechaFormatter });
        addField({ name: "CCMMCasTipValDan_ILP", label: "% ILP", type: "number", formatter: porcentajeFormatter });
        addField({ name: "CCMMCasTipValDan_MontoIndemnizatorio", label: "Monto indemnizatorio", type: "number", formatter: monedaFormatter });
      });
      setTables(tables);
      function addTable(table: TablesName, addFieldsCallback?: (addField: (field: TablesField) => boolean) => void) {
        let tabla = tablas.find(r => r.nombre === table);
        if (!tablas.find(r => r.nombre === table)) return false;
        let campos: TablesField[] = [];
        if (addFieldsCallback) addFieldsCallback(addField);
        tables[table] = campos;
        return true;
        function addField(campo: TablesField) {
          if (!(tabla?.campos?.find(r => r.nombre === campo.name))) return false;
          campos.push(campo);
          return true;
        }
      };
    },
  });
  //#region RefCCMMMotivos
  useSWR(
    !isLoadingTablas && tables.RefCCMMMotivos && tables.View_ConsultaCCMM ?
      swrExecute.key({
        select: tables.RefCCMMMotivos.map(f => ({ value: f.name })),
        from: [{ table: "RefCCMMMotivos" }],
        order: { by: ["Codigo"] },
      }) : null,
    swrExecute.fetcher,
    {
      revalidateOnFocus: false,
      onSuccess(motivos) {
        if (!motivos?.data) return;
        const options = Object.fromEntries(motivos.data.map(e => [e["Codigo"], e["Descripcion"]]));
        setTables((o) => {
          const fieldIx = o.View_ConsultaCCMM!.findIndex(r => r.name === "CCMMCas_MotivoCodigo");
          if (fieldIx < 0) return o;
          const tables = { ...o, View_ConsultaCCMM: [...o.View_ConsultaCCMM!] };
          tables.View_ConsultaCCMM[fieldIx] = { ...tables.View_ConsultaCCMM[fieldIx], ...optionsSelect(options) };
          return tables;
        });
      },
    }
  );
  //#endregion RefCCMMMotivos
  //#region RefCCMMTipos
  useSWR(
    !isLoadingTablas && tables.RefCCMMTipos && tables.View_ConsultaCCMM ?
      swrExecute.key({
        select: tables.RefCCMMTipos.map(f => ({ value: f.name })),
        from: [{ table: "RefCCMMTipos" }],
        order: { by: ["Codigo"] },
      }) : null,
    swrExecute.fetcher,
    {
      revalidateOnFocus: false,
      onSuccess(tipos) {
        if (!tipos?.data) return;
        const options = Object.fromEntries(tipos.data.map(e => [e["Codigo"], e["Descripcion"]]));
        setTables((o) => {
          const fieldIx = o.View_ConsultaCCMM!.findIndex(r => r.name === "CCMMCas_TipoCodigo");
          if (fieldIx < 0) return o;
          const tables = { ...o, View_ConsultaCCMM: [...o.View_ConsultaCCMM!] };
          tables.View_ConsultaCCMM[fieldIx] = { ...tables.View_ConsultaCCMM[fieldIx], ...optionsSelect(options, blankOptionsFormatter) };
          return tables;
        });
      }
    }
  );
  //#endregion RefCCMMTipos
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [query, setQuery] = useState(defaultQuery);
  const [dialog, setDialog] = useState<ReactNode>();
  const [filtro, setFiltro] = useState<FiltroVm | undefined>();

  const { columns, fields, headers } = useMemo(() => {
    const columns: ColumnDef<Row>[] = [];
    const headers: Headers = { columns: {}, options: { formatters: { row: {} } } };
    const fields: Field[] = tables.View_ConsultaCCMM?.filter(f => !["CCMMCas_Interno"].includes(f.name)).map(column => {
      const { name, label, formatter, operators, valueEditorType, values, type } = column;
      columns.push({
        accessorKey: name,
        header: label ?? name,
        cell: formatter ? (info) => formatter(info.getValue()) : (info) => info.getValue()
      });
      headers.columns[name] = { key: name, header: label ?? name };
      if (formatter) headers.options.formatters!.row![name] = formatter;
      return ({
        name, label: label ?? name, operators, valueEditorType, values,
        inputType: type ? type === "dateTime" ? "datetime-local" : type : undefined
      });
    }) ?? [];
    return ({ columns, fields, headers });
  }, [tables.View_ConsultaCCMM]);
  const proposition = useMemo(() => formatQuery(query, propositionFormat({ fields })), [query, fields]);

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
      <DialogActions>
        <Button onClick={onCloseDialog}>Cierra</Button>
      </DialogActions>
    </Dialog>
  ), []);

  const onLookupFiltro = useCallback(() => {
    setDialog(
      <FiltrosLookup
        onClose={onCloseDialog}
        onSelect={(filtro) => {
          setFiltro(filtro);
          setQuery(parsePropositionGroup(filtro.proposition));
          onCloseDialog();
        }}
      />
    );
  }, []);

  const onGuardaFiltro = useCallback(() => {
    setDialog(
      <FiltroForm
        action={filtro == null ? "Create" : "Update"}
        title="Guardando filtro"
        init={{
          ...filtro,
          modulo: "Informes_CCMM",
          proposition
        }}
        onClose={(completed, filtro) => {
          if (completed) setFiltro(filtro);
          onCloseDialog();
        }}
      />
    );
  }, [filtro, proposition]);

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

  const onAplicaFiltro = useCallback(async () => {
    const table = "View_ConsultaCCMM";
    if (!tables[table]) return;
    setIsLoadingData(true);
    const query: Query = {
      select: tables[table].map(c => ({ value: c.name })),
      from: [{ table }],
      where: proposition,
      order: { by: ["CCMMCas_Interno"] }
    };
    await analyze(query).then(
      (ok) => (ok.count > 9000) ? setDialogRegistros(ok.count) : onExecute(),
      (error) => onError(error)
    );
    function onError(error: any) {
      errorDialog({
        message: typeof error === "string" ? error : error.detail ?? error.message ?? JSON.stringify(error)
      });
      setIsLoadingData(false);
    }
    async function onExecute() {
      await execute<Row>(query).then(
        (ok) => {
          setRows(ok.data ?? []);
          onClose();
        },
        (error) => onError(error)
      );
    };
    function onClose() {
      onCloseDialog();
      setIsLoadingData(false);
    }
    function setDialogRegistros(count: number) {
      setDialog(
        <Dialog
          open
          scroll="paper"
          onClose={onClose}
          aria-labelledby="scroll-dialog-title"
          aria-describedby="scroll-dialog-description"
        >
          <DialogTitle id="scroll-dialog-title">Consulta con muchos registros.</DialogTitle>
          <DialogContent dividers>
            <DialogContentText id="scroll-dialog-description" tabIndex={-1}>
              La consulta generará {count} registros.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Cancela</Button>
            <Button onClick={onExecute}>Continúa</Button>
          </DialogActions>
        </Dialog>
      );
    }
  }, [proposition, tables, onCloseDialog, errorDialog]);

  const onLimpiaFiltro = useCallback(() => {
    setFiltro(undefined);
    setQuery(defaultQuery);
  }, []);

  const onLimpiaTabla = useCallback(() => setRows([]), []);

  const onExport = useCallback(async () => {
    const now = dayjs();
    const options = { sheet: { name: "Comisiones Medicas" }, table: headers.options };
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

  return <CCMMContext.Provider
    value={{
      fields, columns, rows, isLoadingData, dialog, filtro,
      query: { state: query, setState: setQuery }, proposition,
      onLookupFiltro, onGuardaFiltro, onEliminaFiltro, onAplicaFiltro, onLimpiaFiltro,
      onLimpiaTabla, onExport,
    }}
  >{children}</CCMMContext.Provider>
}

export function useCCMMContext() {
  const context = useContext(CCMMContext)
  if (context === undefined) throw new Error('useCCMMContext must be used within a CCMMContextProvider');
  return context
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
      <FiltrosTableContextProvider deleted={false} modulo="Informes_CCMM" >
        <FiltrosTable onSelect={onSelect} />
      </FiltrosTableContextProvider>
    </CustomModal>
  );
}
