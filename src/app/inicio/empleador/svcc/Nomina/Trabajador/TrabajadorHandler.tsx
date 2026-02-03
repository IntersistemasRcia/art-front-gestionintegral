import { useState } from "react";
import gestionEmpleadorAPI, {
  TrabajadorBaseDTO,
  TrabajadorCreateDTO,
  TrabajadorDTO,
  SVCCTrabajadorDeleteParams,
  SVCCTrabajadorUpdateParams,
} from "@/data/gestionEmpleadorAPI";
import { FormProps } from "@/utils/ui/form/Form";
import { useSVCCPresentacionContext } from "../../context";
import { Data } from "@/utils/ui/table/Browse";
import TrabajadorBrowse from "./TrabajadorBrowse";
import { DeepPartial } from "@/utils/utils";
import { Grid, Typography } from "@mui/material";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModal from "@/utils/ui/form/CustomModal";
import TrabajadorForm from "./TrabajadorForm";

const {
  useSVCCTrabajadorList,
  useSVCCTrabajadorCreate,
  useSVCCTrabajadorUpdate,
  useSVCCTrabajadorDelete,
} = gestionEmpleadorAPI;

type EditAction = "create" | "read" | "update" | "delete";
type EditState = Omit<FormProps<TrabajadorDTO>, "onChange"> & {
  action?: EditAction,
  message?: string;
};
export default function NominaHandler() {
  const [edit, setEdit] = useState<EditState>({ data: {} });
  const { ultima, establecimientos } = useSVCCPresentacionContext();
  const [{ index, size }, setPage] = useState({ index: 0, size: 100 });
  const [data, setData] = useState<Data<TrabajadorDTO>>({ index, size, count: 0, pages: 0, data: [] });
  const { isLoading, isValidating, mutate } = useSVCCTrabajadorList(
    { presentacionId: ultima.data?.interno ?? 0, page: `${index + 1},${size}` },
    {
      revalidateOnFocus: false,
      onSuccess(data) { setData({ ...data, index: data.index - 1 }) },
    }
  );
  const { trigger: triggerCreate, isMutating: isCreating } = useSVCCTrabajadorCreate({ onSuccess() { mutate(); } });
  const [updateParams, setUpdateParams] = useState<SVCCTrabajadorUpdateParams | undefined>();
  const { trigger: triggerUpdate, isMutating: isUpdating } = useSVCCTrabajadorUpdate(updateParams, { onSuccess() { mutate(); } });
  const [deleteParams, setDeleteParams] = useState<SVCCTrabajadorDeleteParams | undefined>();
  const { trigger: triggerDelete, isMutating: isDeleting } = useSVCCTrabajadorDelete(deleteParams, { onSuccess() { mutate(); } });
  const isWorking = isCreating || isUpdating || isDeleting || isLoading || isValidating;

  const readonly = ultima.data?.presentacionFecha != null;

  return (
    <>
      <TrabajadorBrowse
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
          <TrabajadorForm
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
    const value = "Trabajador";
    switch (edit.action) {
      case "create": return `Agregando ${value}`;
      case "read": return `Consultando ${value}`;
      case "update": return `Modificando ${value}`;
      case "delete": return `Borrando ${value}`;
    }
  }
  function handleOnChange(changes: DeepPartial<TrabajadorDTO>) {
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
        triggerCreate({ presentacionId: ultima.data?.interno ?? 0, ...edit.data } as TrabajadorCreateDTO)
          .then((data) => {
            console.info(data);
            handleEditOnClose();
          }, (error) => {
            console.error(error);
            setEdit((o) => ({ ...o, message: "Ocurrió un error creando trabajador" }));
          });
        break;
      }
      case "update": {
        triggerUpdate(edit.data as TrabajadorBaseDTO)
          .then((data) => {
            console.info(data);
            handleEditOnClose();
          }, (error) => {
            console.error(error);
            setEdit((o) => ({ ...o, message: "Ocurrió un error actualizando trabajador" }));
          });
        break;
      }
      case "delete": {
        triggerDelete(edit.data as TrabajadorDTO)
          .then((data) => {
            console.info(data);
            handleEditOnClose();
          }, (error) => {
            console.error(error);
            setEdit((o) => ({ ...o, message: "Ocurrió un error borrando trabajador" }));
          });
        break;
      }
      case "read": {
        handleEditOnClose();
        break;
      }
    }
  }
  function onAction(action: EditAction, data?: TrabajadorDTO) {
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
          cuil: true,
          idEstablecimientoEmpresa: true,
          fechaIngreso: true,
          actividades: {},
        }
        : {},
    });
  }
}