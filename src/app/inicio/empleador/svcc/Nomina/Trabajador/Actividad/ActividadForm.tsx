import { useState } from "react";
import { Card, Checkbox, CircularProgress, FormControlLabel, Grid, IconButton, InputAdornment, TextField, Tooltip, Typography } from "@mui/material";
import { MoreHoriz } from "@mui/icons-material";
import { ActividadDTO, ExamenMedicoDTO } from "@/data/gestionEmpleadorAPI";
import { Form, FormProps } from "@/utils/ui/form/Form";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import { DeepPartial } from "@/utils/utils";
import PuestoBrowse from "../../../Portada/EstablecimientoDeclarado/Puesto/PuestoBrowse";
import SectorBrowse from "../../../Portada/EstablecimientoDeclarado/Sector/SectorBrowse";
import { useNominaContext } from "../../context";
import SustanciaBrowse from "../../../AnexoV/Sustancia/SustanciaBrowse";
import { useTrabajadorContext } from "../context";
import ExamenMedicoBrowse from "./ExamenMedico/ExamenMedicoBrowse";
import ExamenMedicoForm from "./ExamenMedico/ExamenMedicoForm";

type EditAction = "create" | "read" | "update" | "delete";
type EditState<T extends object> = Omit<FormProps<T>, "onChange"> & {
  action?: EditAction,
  index?: number,
  message?: string;
};

const tooltip_SlotProps = { tooltip: { sx: { fontSize: "1.2rem", fontWeight: 500 } } };
const date_SlotProps = { inputLabel: { shrink: true } };
export const ActividadForm: Form<ActividadDTO> = ({
  data,
  disabled = {},
  errors = {},
  helpers = {},
  onChange = () => { }
}) => {
  const [editExamenMedico, setEditExamenMedico] = useState<EditState<ExamenMedicoDTO>>({ data: {} });

  const { establecimientoDeclarado, idEstablecimientoEmpresa } = useTrabajadorContext();
  const puestos = establecimientoDeclarado.data?.puestos ?? [];
  const puesto = puestos.find((p) => p.interno === data.puestoInterno);

  const [lookupPuesto, setLookupPuesto] = useState<boolean>(false);

  const sectores = establecimientoDeclarado.data?.sectores ?? [];
  const sector = sectores.find((s) => s.interno === data.sectorInterno);

  const [lookupSector, setLookupSector] = useState<boolean>(false);

  const { sustancias } = useNominaContext();
  const sustancia = sustancias.data.find((s) => s.interno === data.sustanciaInterno);

  const [lookupSustancia, setLookupSustancia] = useState<boolean>(false);

  const isExamenesDisabled = disabled.examenesMedicos != null;
  const isDeclaradoLoading =
    establecimientoDeclarado.isLoading || establecimientoDeclarado.isValidating;
  const hasEstablecimientoEmpresa = (idEstablecimientoEmpresa ?? 0) > 0;
  const hasDeclarado = Boolean(establecimientoDeclarado.data);
  const canLookupDeclarado = hasEstablecimientoEmpresa && hasDeclarado && !isDeclaradoLoading;
  const canLookupSustancia = !sustancias.isLoading && !sustancias.isValidating;

  const lookupDeclaradoTooltip = !hasEstablecimientoEmpresa
    ? "Seleccione primero el establecimiento del trabajador"
    : isDeclaradoLoading
      ? "Cargando establecimiento declarado..."
      : !hasDeclarado
        ? "No se encontró establecimiento declarado para la empresa seleccionada"
        : "Buscar";

  const lookupSustanciaTooltip = !canLookupSustancia
    ? "Cargando sustancias declaradas..."
    : sustancias.data.length === 0
      ? "No hay sustancias declaradas en la presentación"
      : "Buscar sustancia declarada";

  return (
    <Grid container size={12} spacing={2} maxHeight="fit-content">
      <Grid size={3}>
        <TextField
          name="puestoInterno"
          type="number"
          label="Puesto declarado"
          value={data.puestoInterno ?? ""}
          disabled={disabled.puestoInterno}
          onChange={({ target: { value } }) => onChange({ puestoInterno: Number(value) })}
          error={errors.puestoInterno}
          helperText={helpers.puestoInterno}
          slotProps={{
            inputLabel: { shrink: data.puestoInterno != null },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip
                    title={lookupDeclaradoTooltip}
                    arrow
                    slotProps={tooltip_SlotProps}
                  >
                    <div>
                      <IconButton
                        color="primary"
                        size="large"
                        disabled={disabled.puestoInterno || !canLookupDeclarado}
                        onClick={() => setLookupPuesto(true)}
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
          open={lookupPuesto}
          onClose={() => setLookupPuesto(false)}
          title="Selección de puesto declarado"
          size="large"
          actions={(
            <Grid container spacing={2}>
              <CustomButton
                onClick={() => setLookupPuesto(false)}
                color="secondary"
              >
                Cancelar
              </CustomButton>
            </Grid>
          )}
        >
          <Grid container spacing={2} justifyContent="center" minHeight="500px">
            <Grid size={12}>
              {isDeclaradoLoading ? (
                <Grid container justifyContent="center" padding={4}>
                  <CircularProgress />
                </Grid>
              ) : puestos.length === 0 ? (
                <Typography color="text.secondary" textAlign="center">
                  No hay puestos declarados para el establecimiento seleccionado.
                </Typography>
              ) : (
                <PuestoBrowse
                  key={`puesto-lookup-${puestos.length}-${idEstablecimientoEmpresa ?? 0}`}
                  isLoading={false}
                  data={{ data: puestos }}
                  onSelect={(select) => () => {
                    onChange({ puestoInterno: select.interno });
                    setLookupPuesto(false);
                  }}
                />
              )}
            </Grid>
          </Grid>
        </CustomModal>
      </Grid>
      <Grid size={9}>
        <TextField
          label="Puesto - Descripcion"
          value={[puesto?.ciuo, puesto?.nombre].filter(e => e !== undefined).join(" - ")}
          disabled
          fullWidth
        />
      </Grid>
      <Grid size={3}>
        <TextField
          name="sectorInterno"
          type="number"
          label="Sector declarado"
          value={data.sectorInterno ?? ""}
          disabled={disabled.sectorInterno}
          onChange={({ target: { value } }) => onChange({ sectorInterno: Number(value) })}
          error={errors.sectorInterno}
          helperText={helpers.sectorInterno}
          slotProps={{
            inputLabel: { shrink: data.sectorInterno != null },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip
                    title={lookupDeclaradoTooltip}
                    arrow
                    slotProps={tooltip_SlotProps}
                  >
                    <div>
                      <IconButton
                        color="primary"
                        size="large"
                        disabled={disabled.sectorInterno || !canLookupDeclarado}
                        onClick={() => setLookupSector(true)}
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
          open={lookupSector}
          onClose={() => setLookupSector(false)}
          title="Selección de sector declarado"
          size="large"
          actions={(
            <Grid container spacing={2}>
              <CustomButton
                onClick={() => setLookupSector(false)}
                color="secondary"
              >
                Cancelar
              </CustomButton>
            </Grid>
          )}
        >
          <Grid container spacing={2} justifyContent="center" minHeight="500px">
            <Grid size={12}>
              {isDeclaradoLoading ? (
                <Grid container justifyContent="center" padding={4}>
                  <CircularProgress />
                </Grid>
              ) : sectores.length === 0 ? (
                <Typography color="text.secondary" textAlign="center">
                  No hay sectores declarados para el establecimiento seleccionado.
                </Typography>
              ) : (
                <SectorBrowse
                  key={`sector-lookup-${sectores.length}-${idEstablecimientoEmpresa ?? 0}`}
                  isLoading={false}
                  data={{ data: sectores }}
                  onSelect={(select) => () => {
                    onChange({ sectorInterno: select.interno });
                    setLookupSector(false);
                  }}
                />
              )}
            </Grid>
          </Grid>
        </CustomModal>
      </Grid>
      <Grid size={9}>
        <TextField
          label="Sector declarado - Descripcion"
          value={[sector?.ciiu, sector?.nombre].filter(e => e !== undefined).join(" - ")}
          disabled
          fullWidth
        />
      </Grid>
      <Grid size={3}> 
        <TextField
          name="sustanciaInterno"
          type="number"
          label="Sustancia declarada"
          value={data.sustanciaInterno ?? ""}
          disabled={disabled.sustanciaInterno}
          onChange={({ target: { value } }) => onChange({ sustanciaInterno: Number(value) })}
          error={errors.sustanciaInterno}
          helperText={helpers.sustanciaInterno}
          slotProps={{
            inputLabel: { shrink: data.sustanciaInterno != null },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip
                    title={lookupSustanciaTooltip}
                    arrow
                    slotProps={tooltip_SlotProps}
                  >
                    <div>
                      <IconButton
                        color="primary"
                        size="large"
                        disabled={disabled.sustanciaInterno || !canLookupSustancia || sustancias.data.length === 0}
                        onClick={() => setLookupSustancia(true)}
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
          open={lookupSustancia}
          onClose={() => setLookupSustancia(false)}
          title="Selección de sustancia declarada"
          size="large"
          actions={(
            <Grid container spacing={2}>
              <CustomButton
                onClick={() => setLookupSustancia(false)}
                color="secondary"
              >
                Cancelar
              </CustomButton>
            </Grid>
          )}
        >
          <Grid container spacing={2} justifyContent="center" minHeight="500px">
            <Grid size={12}>
              {!canLookupSustancia ? (
                <Grid container justifyContent="center" padding={4}>
                  <CircularProgress />
                </Grid>
              ) : sustancias.data.length === 0 ? (
                <Typography color="text.secondary" textAlign="center">
                  No hay sustancias declaradas en la presentación.
                </Typography>
              ) : (
                <SustanciaBrowse
                  key={`sustancia-lookup-${sustancias.data.length}`}
                  isLoading={false}
                  data={{ data: sustancias.data }}
                  onSelect={(select) => () => {
                    onChange({ sustanciaInterno: select.interno });
                    setLookupSustancia(false);
                  }}
                />
              )}
            </Grid>
          </Grid>
        </CustomModal>
      </Grid>
      <Grid size={9}>
        <TextField
          label="Sustancia declarada - Descripcion"
          value={sustancia?.nombreComercial ?? ""}
          disabled
          fullWidth
        />
      </Grid>
      <Grid size={4} alignContent="center">
        <FormControlLabel
          name="permanente"
          label={<Typography fontWeight={700} color={disabled.permanente ? "textDisabled" : "#45661f"} fontSize="smaller">Puesto permanente</Typography>}
          disabled={disabled.permanente}
          control={
            <Checkbox
              checked={data.permanente}
              indeterminate={data.permanente === undefined}
              onChange={({ target: { checked } }) => onChange({ permanente: checked })}
            />
          }
        />
      </Grid>
      <Grid size={4}>
        <TextField
          name="fechaInicioExposicion"
          type="date"
          label="Fecha inicio exposicion"
          value={data.fechaInicioExposicion?.slice(0, 10) ?? ""}
          disabled={disabled.fechaInicioExposicion}
          onChange={({ target: { value } }) => onChange({ fechaInicioExposicion: value })}
          error={errors.fechaInicioExposicion}
          helperText={helpers.fechaInicioExposicion}
          slotProps={date_SlotProps}
          fullWidth
        />
      </Grid>
      <Grid size={4}>
        <TextField
          name="fechaFinExposicion"
          type="date"
          label="Fecha fin exposicion"
          value={data.fechaFinExposicion?.slice(0, 10) ?? ""}
          disabled={disabled.fechaFinExposicion}
          onChange={({ target: { value } }) => onChange({ fechaFinExposicion: value })}
          error={errors.fechaFinExposicion}
          helperText={helpers.fechaFinExposicion}
          slotProps={date_SlotProps}
          fullWidth
        />
      </Grid>

      <Grid size={12}>
        <Card variant="outlined">
          <Grid container spacing={2} padding={1.5}>
            <Grid size={12}><Typography fontWeight={700} color="#45661f" fontSize="smaller">Exámenes médicos</Typography></Grid>
            <Grid size={12}>
              <ExamenMedicoBrowse
                data={{ data: (data.examenesMedicos ?? []) as ExamenMedicoDTO[] }}
                onCreate={isExamenesDisabled ? undefined : () => onExamenMedicoAction("create")}
                onRead={(row, index) => () => onExamenMedicoAction("read", row, index)}
                onUpdate={isExamenesDisabled ? undefined : (row, index) => () => onExamenMedicoAction("update", row, index)}
                onDelete={isExamenesDisabled ? undefined : (row, index) => () => onExamenMedicoAction("delete", row, index)}
              />
              <CustomModal
                open={!!editExamenMedico.action}
                onClose={handleEditExamenMedicoOnClose}
                title={editExamenMedicoTitle()}
                size="large"
                actions={(
                  <Grid container spacing={2}>
                    {editExamenMedico.action !== "read" &&
                      <CustomButton
                        onClick={handleEditExamenMedicoOnConfirm}
                      >
                        {editExamenMedico.action === "delete" ? "Borrar" : "Guardar"}
                      </CustomButton>
                    }
                    <CustomButton
                      onClick={handleEditExamenMedicoOnClose}
                      color="secondary"
                    >
                      {editExamenMedico.action === "read" ? "Cerrar" : "Cancelar"}
                    </CustomButton>
                  </Grid>
                )}
              >
                <Grid container spacing={2} justifyContent="center" minHeight="500px">
                  {editExamenMedico.message && <Typography variant="h5" color="var(--naranja)" textAlign="center">{editExamenMedico.message}</Typography>}
                  <ExamenMedicoForm
                    data={editExamenMedico.data}
                    disabled={editExamenMedico.disabled}
                    errors={editExamenMedico.errors}
                    helpers={editExamenMedico.helpers}
                    onChange={handleExamenMedicoOnChange}
                  />
                </Grid>
              </CustomModal>
            </Grid>
          </Grid>
        </Card>
      </Grid>
    </Grid>
  );
  //#region funciones Examen Medico
  function editExamenMedicoTitle() {
    const value = "Examen Médico";
    switch (editExamenMedico.action) {
      case "create": return `Agregando ${value}`;
      case "read": return `Consultando ${value}`;
      case "update": return `Modificando ${value}`;
      case "delete": return `Borrando ${value}`;
    }
  }
  function handleExamenMedicoOnChange(changes: DeepPartial<ExamenMedicoDTO>) {
    setEditExamenMedico((o) => ({ ...o, data: { ...o.data, ...changes } }));
  }
  function handleEditExamenMedicoOnClose() { setEditExamenMedico({ data: {} }); }
  function handleEditExamenMedicoOnConfirm() {
    const examenesMedicos = [...data.examenesMedicos ?? []];
    switch (editExamenMedico.action) {
      case "create": {
        examenesMedicos.push(editExamenMedico.data as ExamenMedicoDTO);
        onChange({ examenesMedicos });
        handleEditExamenMedicoOnClose();
        break;
      }
      case "update": {
        examenesMedicos[editExamenMedico.index!] = editExamenMedico.data as ExamenMedicoDTO
        onChange({ examenesMedicos });
        handleEditExamenMedicoOnClose();
        break;
      }
      case "delete": {
        examenesMedicos.splice(editExamenMedico.index!, 1);
        onChange({ examenesMedicos });
        handleEditExamenMedicoOnClose();
        break;
      }
      case "read": {
        handleEditExamenMedicoOnClose();
        break;
      }
    }
  }
  function onExamenMedicoAction(action: EditAction, data?: ExamenMedicoDTO, index?: number) {
    setEditExamenMedico({
      action,
      index,
      data: data ? JSON.parse(JSON.stringify(data)) : {},
      disabled: ["read", "delete"].includes(action)
        ? {
          interno: true,
          idExamen: true,
        }
        : {},
    });
  }
  //#endregion funciones Examen Medico
}

export default ActividadForm;
