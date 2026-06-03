import { useState } from "react";
import { Grid, Typography } from "@mui/material";
import SvccAPI from "@/data/svccAPI";
import type {
  SustanciaBaseDTO,
  SustanciaCreateDTO,
  SustanciaDTO,
  SVCCSustanciaUpdateParams,
  SVCCSustanciaDeleteParams,
} from "@/data/gestionEmpleadorAPI";
import { Data } from "@/utils/ui/table/Browse";
import { FormProps } from "@/utils/ui/form/Form";
import CustomModal from "@/utils/ui/form/CustomModal";
import { DeepPartial } from "@/utils/utils";
import CustomButton from "@/utils/ui/button/CustomButton";
import SustanciaBrowse from "./SustanciaBrowse";
import SustanciaForm from "./SustanciaForm";
import { useSVCCPresentacionContext } from "../../context";

const {
  useSVCCSustanciaList,
  useSVCCSustanciaCreate,
  useSVCCSustanciaUpdate,
  useSVCCSustanciaDelete,
} = SvccAPI;

type EditAction = "create" | "read" | "update" | "delete";
type EditState = Omit<FormProps<SustanciaDTO>, "onChange"> & {
  action?: EditAction,
  message?: string;
};
export default function SustanciaHandler() {
  const [edit, setEdit] = useState<EditState>({ data: {} });
  const { presentacion: { selected: presentacionSeleccionada }, establecimientos } = useSVCCPresentacionContext();
  const presentacion = presentacionSeleccionada;
  const [{ index, size }, setPage] = useState({ index: 0, size: 10 });
  const [data, setData] = useState<Data<SustanciaDTO>>({ index, size, count: 0, pages: 0, data: [] });
  const { isLoading, isValidating, mutate } = useSVCCSustanciaList(
    { presentacionId: presentacion?.interno ?? 0, PageIndex: index + 1, PageSize: 10 },
    {
      revalidateOnFocus: false,
      onSuccess(data) { setData({ ...data, index: data.index - 1 }) },
    }
  );
  const { trigger: triggerCreate, isMutating: isCreating } = useSVCCSustanciaCreate({ onSuccess() { mutate(); } });
  const [updateParams, setUpdateParams] = useState<SVCCSustanciaUpdateParams | undefined>();
  const { trigger: triggerUpdate, isMutating: isUpdating } = useSVCCSustanciaUpdate(updateParams, { onSuccess() { mutate(); } });
  const [deleteParams, setDeleteParams] = useState<SVCCSustanciaDeleteParams | undefined>();
  const { trigger: triggerDelete, isMutating: isDeleting } = useSVCCSustanciaDelete(deleteParams, { onSuccess() { mutate(); } });
  const isWorking = isCreating || isUpdating || isDeleting || isLoading || isValidating;

  const readonly = presentacion?.presentacionFecha != null;
  return (
    <>
      <SustanciaBrowse
        isLoading={isLoading || isValidating}
        data={data}
        onPageIndexChange={(index: number) => setPage((o) => ({ ...o, index }))}
        onPageSizeChange={(size: number) => setPage((o) => ({ ...o, size }))}
        onCreate={readonly ? undefined : () => onAction("create")}
        onRead={(data) => data.interno ? () => onAction("read", data) : undefined}
        onUpdate={readonly ? undefined : (data) => data.interno ? () => onAction("update", data) : undefined}
        onDelete={readonly ? undefined : (data) => data.interno ? () => onAction("delete", data) : undefined}
      />
      <CustomModal
        open={!!edit.action}
        onClose={handleEditOnClose}
        title={editTitle()}
        size="large"
        actions={(
          <Grid container spacing={2}>
            {edit.action !== "read" &&
              <CustomButton
                onClick={handleEditOnConfirm}
                disabled={isWorking}
              >
                {actionMessage() || (edit.action === "delete" ? "Borrar" : "Guardar")}
              </CustomButton>
            }
            <CustomButton
              onClick={handleEditOnClose}
              color="secondary"
              disabled={isWorking}
            >
              {edit.action === "read" ? "Cerrar" : "Cancelar"}
            </CustomButton>
          </Grid>
        )}
      >
        <Grid container spacing={2} justifyContent="center" minHeight="500px">
          {edit.message && <Typography variant="h5" color="var(--naranja)" textAlign="center">{edit.message}</Typography>}
          <SustanciaForm
            data={edit.data}
            disabled={edit.disabled}
            errors={edit.errors}
            helpers={edit.helpers}
            onChange={handleOnChange}
          />
        </Grid>
      </CustomModal>
    </>
  );
  function actionMessage() {
    if (isLoading || isValidating) return "Cargando...";
    if (isCreating) return "Agregando...";
    if (isUpdating) return "Modificando...";
    if (isDeleting) return "Borrando...";
  }
  function editTitle() {
    const value = "Sustancia";
    switch (edit.action) {
      case "create": return `Agregando ${value}`;
      case "read": return `Consultando ${value}`;
      case "update": return `Modificando ${value}`;
      case "delete": return `Borrando ${value}`;
    }
  }
  function handleOnChange(changes: DeepPartial<SustanciaDTO>) {
    setEdit((o) => {
      const edit = ({ ...o, data: { ...o.data }, errors: { ...o.errors }, helpers: { ...o.helpers } });
      if ("idEstablecimientoEmpresa" in changes) {
        if (changes.idEstablecimientoEmpresa) {
          const ix = establecimientos.data?.findIndex((e) => e.codEstabEmpresa === changes.idEstablecimientoEmpresa) ?? -1;
          if (ix < 0) {
            edit.errors.idEstablecimientoEmpresa = true;
            edit.helpers.idEstablecimientoEmpresa = "No existe el establecimiento";
          } else {
            delete edit.errors.idEstablecimientoEmpresa;
            delete edit.helpers.idEstablecimientoEmpresa;
          }
        } else {
          delete edit.errors.idEstablecimientoEmpresa;
          edit.helpers.idEstablecimientoEmpresa = "Debe seleccionar un establecimiento";
        }
      }
      edit.data = { ...edit.data, ...changes };
      return edit;
    });
  }
  function handleEditOnClose() { setEdit({ data: {} }); }
  function handleEditOnConfirm() {
    switch (edit.action) {
      case "create": {
        triggerCreate({ presentacionId: presentacion?.interno ?? 0, ...edit.data } as SustanciaCreateDTO)
          .then((data) => {
            console.info(data);
            handleEditOnClose();
          }, (error) => {
            console.error(error);
            setEdit((o) => ({ ...o, message: "Ocurrió un error creando sustancia" }));
          });
        break;
      }
      case "update": {
        triggerUpdate(edit.data as SustanciaBaseDTO)
          .then((data) => {
            console.info(data);
            handleEditOnClose();
          }, (error) => {
            console.error(error);
            setEdit((o) => ({ ...o, message: "Ocurrió un error actualizando sustancia" }));
          });
        break;
      }
      case "delete": {
        triggerDelete(edit.data as SustanciaDTO)
          .then((data) => {
            console.info(data);
            handleEditOnClose();
          }, (error) => {
            console.error(error);
            setEdit((o) => ({ ...o, message: "Ocurrió un error borrando sustancia" }));
          });
        break;
      }
      case "read": {
        handleEditOnClose();
        break;
      }
    }
  }
  function onAction(action: EditAction, data?: SustanciaDTO) {
    switch (action) {
      case "update": {
        setUpdateParams({ id: data!.interno! });
        break;
      }
      case "delete": {
        setDeleteParams({ id: data!.interno! });
        break;
      }
    }
    setEdit({
      action,
      data: data ? JSON.parse(JSON.stringify(data)) : {},
      disabled: ["read", "delete"].includes(action)
        ? {
          interno: true,
          idEstablecimientoEmpresa: true,
          idSustancia: true,
          nombreComercial: true,
          cantidadAnual: true,
          idUnidadDeMedida: true,
          utilizaciones: {},
          puestosAfectados: {},
          equiposRadiologicos: {},
          proveedores: {},
          compradores: {},
          estudiosAmbientalesEspecificos: {},
          estudiosBiologicosEspecificos: {},
        }
        : {},
    });
  }
}
