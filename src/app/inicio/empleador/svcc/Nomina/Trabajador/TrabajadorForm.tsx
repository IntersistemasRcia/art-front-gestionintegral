import { useState } from "react";
import { Card, Grid, IconButton, InputAdornment, TextField, Tooltip, Typography } from "@mui/material";
import { MoreHoriz } from "@mui/icons-material";
import { TrabajadorDTO, ActividadDTO } from "@/data/gestionEmpleadorAPI";
import { DeepPartial } from "@/utils/utils";
import { Form, FormProps } from "@/utils/ui/form/Form";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import { useSVCCPresentacionContext } from "../../context";
import Formato from "@/utils/Formato";
import ActividadBrowse from "./Actividad/ActividadBrowse";
import ActividadForm from "./Actividad/ActividadForm";
import { TrabajadorContextProvider, useTrabajadorContext } from "./context";
import { useNominaContext } from "../context";
import EstablecimientoBrowse from "@/components/establecimientos/EstablecimientoBrowse";

type EditAction = "create" | "read" | "update" | "delete";
type EditState<T extends object> = Omit<FormProps<T>, "onChange"> & {
  action?: EditAction,
  index?: number,
  message?: string;
};
 
const tooltip_SlotProps = { tooltip: { sx: { fontSize: "1.2rem", fontWeight: 500 } } };
const date_SlotProps = { inputLabel: { shrink: true } };
const Contextualized: Form<TrabajadorDTO> = ({
  data,
  disabled = {},
  errors = {},
  helpers = {},
  onChange = () => { }
}) => {
  const [editActividad, setEditActividad] = useState<EditState<ActividadDTO>>({ data: {} });
  const [lookupEstablecimientos, setLookupEstablecimientos] = useState<boolean>(false);

  const { establecimientos } = useSVCCPresentacionContext();
  const { establecimientoDeclarado } = useTrabajadorContext();
  const { sustancias } = useNominaContext();

  return (
    <Grid container size={12} spacing={2} maxHeight="fit-content">
      <Grid size={6}>
        <TextField
          name="cuit"
          label="CUIT"
          value={Formato.CUIP(data.cuil)}
          disabled={disabled.cuil}
          onChange={({ target: { value } }) => onChange({ cuil: value ? Number((value || '').replace(/[^0-9]/g, '')) : undefined })}
          error={errors.cuil}
          helperText={helpers.cuil}
          fullWidth
        />
      </Grid>
      <Grid size={6}>
        <TextField
          name="fechaIngreso"
          type="date"
          label="Fecha de ingreso"
          value={data.fechaIngreso?.slice(0, 10) ?? ""}
          disabled={disabled.fechaIngreso}
          onChange={({ target: { value } }) => onChange({ fechaIngreso: value })}
          error={errors.fechaIngreso}
          helperText={helpers.fechaIngreso}
          slotProps={date_SlotProps}
          fullWidth
        />
      </Grid>
      <Grid size={3}>
        <TextField
          name="idEstablecimientoEmpresa"
          type="number"
          label="Establ. Empresa"
          value={data.idEstablecimientoEmpresa ?? ""}
          disabled={disabled.idEstablecimientoEmpresa}
          onChange={({ target: { value } }) => onChange({ idEstablecimientoEmpresa: Number(value) })}
          error={errors.idEstablecimientoEmpresa}
          helperText={helpers.idEstablecimientoEmpresa}
          slotProps={{
            inputLabel: { shrink: data.idEstablecimientoEmpresa != null },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip
                    title="Buscar Establ. Empresa"
                    arrow
                    slotProps={tooltip_SlotProps}
                  >
                    <div>
                      <IconButton
                        color="primary"
                        size="large"
                        disabled={disabled.idEstablecimientoEmpresa}
                        onClick={() => setLookupEstablecimientos(true)}
                      >
                        <MoreHoriz />
                      </IconButton>
                    </div>
                  </Tooltip>
                </InputAdornment>
              ),
            }
          }}
          fullWidth
        />
        <CustomModal
          open={lookupEstablecimientos}
          onClose={() => setLookupEstablecimientos(false)}
          title="Selección de establecimiento"
          size="large"
          actions={(
            <Grid container spacing={2}>
              <CustomButton
                onClick={() => setLookupEstablecimientos(false)}
                color="secondary"
              >
                Cancelar
              </CustomButton>
            </Grid>
          )}
        >
          <Grid container spacing={2} justifyContent="center" minHeight="500px">
            <Grid size={12}>
              <EstablecimientoBrowse
                isLoading={establecimientos.isLoading || establecimientos.isValidating}
                data={{ data: establecimientos.data ?? [] }}
                onSelect={(select) => () => {
                  onChange({ idEstablecimientoEmpresa: select.codEstabEmpresa });
                  setLookupEstablecimientos(false);
                }}
              />
            </Grid>
          </Grid>
        </CustomModal>
      </Grid>
      <Grid size={9}>
        <TextField
          name="Placeholder"
          label="Establ. Empresa - Descripcion"
          value={establecimientos.map[data.idEstablecimientoEmpresa ?? 0] ?? ""}
          disabled
          fullWidth
        />
      </Grid>
      <Grid size={12}>
        <Card variant="outlined">
          <Grid container spacing={2} padding={1.5}>
            <Grid size={12}><Typography fontWeight={700} color="#45661f" fontSize="smaller">Actividades</Typography></Grid>
            <Grid size={12}>
              <ActividadBrowse
                data={{ data: (data.actividades ?? []) as ActividadDTO[] }}
                onCreate={disabled.actividades ? undefined : () => onActividadAction("create")}
                onRead={(data, index) => () => onActividadAction("read", data, index)}
                onUpdate={disabled.actividades ? undefined : (data, index) => () => onActividadAction("update", data, index)}
                onDelete={disabled.actividades ? undefined : (data, index) => () => onActividadAction("delete", data, index)}
              />
              <CustomModal
                open={!!editActividad.action}
                onClose={handleEditActividadOnClose}
                title={editActividadTitle()}
                size="large"
                actions={(
                  <Grid container spacing={2}>
                    {editActividad.action !== "read" &&
                      <CustomButton
                        onClick={handleEditActividadOnConfirm}
                      >
                        {editActividad.action === "delete" ? "Borrar" : "Guardar"}
                      </CustomButton>
                    }
                    <CustomButton
                      onClick={handleEditActividadOnClose}
                      color="secondary"
                    >
                      {editActividad.action === "read" ? "Cerrar" : "Cancelar"}
                    </CustomButton>
                  </Grid>
                )}
              >
                <Grid container spacing={2} justifyContent="center" minHeight="500px">
                  {editActividad.message && <Typography variant="h5" color="var(--naranja)" textAlign="center">{editActividad.message}</Typography>}
                  <ActividadForm
                    data={editActividad.data}
                    disabled={editActividad.disabled}
                    errors={editActividad.errors}
                    helpers={editActividad.helpers}
                    onChange={handleActividadOnChange}
                  />
                </Grid>
              </CustomModal>
            </Grid>
          </Grid>
        </Card>
      </Grid>
    </Grid>
  );
  //#region funciones Actividad
  function editActividadTitle() {
    const value = "Actividad";
    switch (editActividad.action) {
      case "create": return `Agregando ${value}`;
      case "read": return `Consultando ${value}`;
      case "update": return `Modificando ${value}`;
      case "delete": return `Borrando ${value}`;
    }
  }
  function handleActividadOnChange(changes: DeepPartial<ActividadDTO>) {
    setEditActividad((o) => {
      const edit = ({ ...o, data: { ...o.data }, errors: { ...o.errors }, helpers: { ...o.helpers } });
      if ("puestoInterno" in changes) {
        if (changes.puestoInterno) {
          const ix = establecimientoDeclarado.data?.puestos?.findIndex((e) => e.interno === changes.puestoInterno) ?? -1;
          if (ix < 0) {
            edit.errors.puestoInterno = true;
            edit.helpers.puestoInterno = "No existe el puesto en el establecimiento declarado";
          } else {
            delete edit.errors.puestoInterno;
            delete edit.helpers.puestoInterno;
          }
        } else {
          delete edit.errors.puestoInterno;
          edit.helpers.puestoInterno = "Debe seleccionar un puesto del establecimiento declarado";
        }
      }
      if ("sectorInterno" in changes) {
        if (changes.sectorInterno) {
          const ix = establecimientoDeclarado.data?.sectores?.findIndex((e) => e.interno === changes.sectorInterno) ?? -1;
          if (ix < 0) {
            edit.errors.sectorInterno = true;
            edit.helpers.sectorInterno = "No existe el sector en el establecimiento declarado";
          } else {
            delete edit.errors.sectorInterno;
            delete edit.helpers.sectorInterno;
          }
        } else {
          delete edit.errors.sectorInterno;
          edit.helpers.sectorInterno = "Debe seleccionar un sector del establecimiento declarado";
        }
      }
      if ("sustanciaInterno" in changes) {
        if (changes.sustanciaInterno) {
          const ix = sustancias.data.findIndex((e) => e.interno === changes.sustanciaInterno) ?? -1;
          if (ix < 0) {
            edit.errors.sustanciaInterno = true;
            edit.helpers.sustanciaInterno = "No existe la sustancia declarada";
          } else {
            delete edit.errors.sustanciaInterno;
            delete edit.helpers.sustanciaInterno;
          }
        } else {
          delete edit.errors.sustanciaInterno;
          edit.helpers.sustanciaInterno = "Debe seleccionar una sustancia declarada";
        }
      }
      edit.data = { ...edit.data, ...changes };
      return edit;
    });
  }
  function handleEditActividadOnClose() { setEditActividad({ data: {} }); }
  function handleEditActividadOnConfirm() {
    const actividades = [...data.actividades ?? []];
    switch (editActividad.action) {
      case "create": {
        actividades.push(editActividad.data as ActividadDTO);
        onChange({ actividades });
        handleEditActividadOnClose();
        break;
      }
      case "update": {
        actividades[editActividad.index!] = editActividad.data as ActividadDTO
        onChange({ actividades });
        handleEditActividadOnClose();
        break;
      }
      case "delete": {
        actividades.splice(editActividad.index!, 1);
        onChange({ actividades });
        handleEditActividadOnClose();
        break;
      }
      case "read": {
        handleEditActividadOnClose();
        break;
      }
    }
  }
  function onActividadAction(action: EditAction, data?: ActividadDTO, index?: number) {
    setEditActividad({
      action,
      index,
      data: data ? JSON.parse(JSON.stringify(data)) : { examenesMedicos: [] },
      disabled: ["read", "delete"].includes(action)
        ? {
          interno: true,
          puestoInterno: true,
          sectorInterno: true,
          sustanciaInterno: true,
          permanente: true,
          fechaInicioExposicion: true,
          fechaFinExposicion: true,
          examenesMedicos: {},
        }
        : {},
    });
  }
  //#endregion funciones Actividad
}

export const TrabajadorForm: Form<TrabajadorDTO> = (props) => (
  <TrabajadorContextProvider idEstablecimientoEmpresa={props.data.idEstablecimientoEmpresa}>
    <Contextualized {...props} />
  </TrabajadorContextProvider>
);
export default TrabajadorForm;
