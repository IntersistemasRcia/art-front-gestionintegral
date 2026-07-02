import { useEffect, useState } from "react";
import { Grid, Typography } from "@mui/material";
import { Data } from "@/utils/ui/table/Browse";
import SvccAPI from "@/data/svccAPI";
import type {
  EstablecimientoDeclaradoBaseDTO,
  EstablecimientoDeclaradoCreateDTO,
  EstablecimientoDeclaradoDTO,
  SVCCEstablecimientoDeclaradoUpdateParams,
  SVCCEstablecimientoDeclaradoDeleteParams,
} from "@/data/gestionEmpleadorAPI";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import { DeepPartial } from "@/utils/utils";
import EstablecimientoDeclaradoForm from "./EstablecimientoDeclaradoForm";
import EstablecimientoDeclaradoBrowse from "./EstablecimientoDeclaradoBrowse";
import { useSVCCPresentacionContext } from "../../context";
import { FormProps } from "@/utils/ui/form/Form";

const {
  useSVCCEstablecimientoDeclaradoList,
  useSVCCEstablecimientoDeclaradoCreate,
  useSVCCEstablecimientoDeclaradoUpdate,
  useSVCCEstablecimientoDeclaradoDelete,
} = SvccAPI;

type EditAction = "create" | "read" | "update" | "delete";
type EditState = Omit<FormProps<EstablecimientoDeclaradoDTO>, "onChange"> & {
  action?: EditAction,
  message?: string;
};
export default function EstablecimientoDeclaradoHandler() {
  const [edit, setEdit] = useState<EditState>({ data: {} });
  const { presentacion: { selected: presentacion }, establecimientos } = useSVCCPresentacionContext();
  const [{ index, size }, setPage] = useState({ index: 0, size: 10 });
  const [data, setData] = useState<Data<EstablecimientoDeclaradoDTO>>({ index, size, count: 0, pages: 0, data: [] });
  const { data: establecimientoDeclaradoList, isLoading, isValidating, mutate } = useSVCCEstablecimientoDeclaradoList(
    { presentacionId: presentacion?.interno ?? 0, PageIndex: index + 1, PageSize: 10 },
    {
      revalidateOnFocus: false,
      onSuccess(data) { setData({ ...data, index: data.index - 1 }) },
    }
  );
  useEffect(() => {
    if (establecimientoDeclaradoList == null) return;
    setData({ ...establecimientoDeclaradoList, index: establecimientoDeclaradoList.index - 1 });
  }, [establecimientoDeclaradoList]);
  const { trigger: triggerCreate, isMutating: isCreating } = useSVCCEstablecimientoDeclaradoCreate({ onSuccess() { mutate(); } });
  const [updateParams, setUpdateParams] = useState<SVCCEstablecimientoDeclaradoUpdateParams | undefined>();
  const { trigger: triggerUpdate, isMutating: isUpdating } = useSVCCEstablecimientoDeclaradoUpdate(updateParams, { onSuccess() { mutate(); } });
  const [deleteParams, setDeleteParams] = useState<SVCCEstablecimientoDeclaradoDeleteParams | undefined>();
  const { trigger: triggerDelete, isMutating: isDeleting } = useSVCCEstablecimientoDeclaradoDelete(deleteParams, { onSuccess() { mutate(); } });
  const isWorking = isCreating || isUpdating || isDeleting || isLoading || isValidating;

  const readonly = presentacion?.presentacionFecha != null;
  return (
    <>
      <EstablecimientoDeclaradoBrowse
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
          <EstablecimientoDeclaradoForm
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
    const value = "Establecimiento Declarado";
    switch (edit.action) {
      case "create": return `Agregando ${value}`;
      case "read": return `Consultando ${value}`;
      case "update": return `Modificando ${value}`;
      case "delete": return `Borrando ${value}`;
    }
  }
  function handleOnChange(changes: DeepPartial<EstablecimientoDeclaradoDTO>) {
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
        triggerCreate({ presentacionId: presentacion?.interno ?? 0, ...edit.data } as EstablecimientoDeclaradoCreateDTO)
          .then((data) => {
            console.info(data);
            handleEditOnClose();
          }, (error) => {
            console.error(error);
            setEdit((o) => ({ ...o, message: "Ocurrió un error creando establecimiento declarado" }));
          });
        break;
      }
      case "update": {
        triggerUpdate(edit.data as EstablecimientoDeclaradoBaseDTO)
          .then((data) => {
            console.info(data);
            handleEditOnClose();
          }, (error) => {
            console.error(error);
            setEdit((o) => ({ ...o, message: "Ocurrió un error actualizando establecimiento declarado" }));
          });
        break;
      }
      case "delete": {
        triggerDelete(edit.data as EstablecimientoDeclaradoDTO)
          .then((data) => {
            console.info(data);
            handleEditOnClose();
          }, (error) => {
            console.error(error);
            setEdit((o) => ({ ...o, message: "Ocurrió un error borrando establecimiento declarado" }));
          });
        break;
      }
      case "read": {
        handleEditOnClose();
        break;
      }
    }
  }
  function onAction(action: EditAction, data?: EstablecimientoDeclaradoDTO) {
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
          descripcionActividad: true,
          cantTrabEventualesProd: true,
          cantTrabEventualesAdmin: true,
          cantTrabPropiosProd: true,
          cantTrabPropiosAdmin: true,
          mail: true,
          telefono: true,
          cuilContacto: true,
          permitidoFumar: true,
          lugaresCerradosParaFumar: true,
          puestos: {},
          sectores: {},
          responsables: {},
          contratistas: {},
        }
        : {},
    });
  }
}
