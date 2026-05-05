import { useState } from "react";
import { Grid, Typography } from "@mui/material";
import ArtAPI from "@/data/artAPI";
import type {
  EmpresaTercerizadaBaseDTO,
  EmpresaTercerizadaCreateDTO,
  EmpresaTercerizadaDTO,
  SVCCEmpresaTercerizadaUpdateParams,
  SVCCEmpresaTercerizadaDeleteParams,
} from "@/data/gestionEmpleadorAPI";
import { Data } from "@/utils/ui/table/Browse";
import { FormProps } from "@/utils/ui/form/Form";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import EmpresaTercerizadaBrowse from "./EmpresaTercerizadaBrowse";
import EmpresaTercerizadaForm from "./EmpresaTercerizadaForm";
import { useSVCCPresentacionContext } from "../../context";
import { DeepPartial } from "@/utils/utils";

const {
  useSVCCEmpresaTercerizadaList,
  useSVCCEmpresaTercerizadaCreate,
  useSVCCEmpresaTercerizadaUpdate,
  useSVCCEmpresaTercerizadaDelete,
} = ArtAPI;

type EditAction = "create" | "read" | "update" | "delete";
type EditState = Omit<FormProps<EmpresaTercerizadaDTO>, "onChange"> & {
  action?: EditAction,
  message?: string;
};
export default function EmpresaTercerizadaHandler() {
  const [edit, setEdit] = useState<EditState>({ data: {} });
  const { presentacion: { selected: presentacion }, establecimientos, refCIIU } = useSVCCPresentacionContext();
  const [{ index, size }, setPage] = useState({ index: 0, size: 10 });
  const [data, setData] = useState<Data<EmpresaTercerizadaDTO>>({ index, size, count: 0, pages: 0, data: [] });
  const { isLoading, isValidating, mutate } = useSVCCEmpresaTercerizadaList(
    { presentacionId: presentacion?.interno ?? 0, PageIndex: index + 1, PageSize: size },
    {
      revalidateOnFocus: false,
      onSuccess(data) { setData({ ...data, index: data.index - 1 }) },
    }
  );
  const { trigger: triggerCreate, isMutating: isCreating } = useSVCCEmpresaTercerizadaCreate({ onSuccess() { mutate(); } });
  const [updateParams, setUpdateParams] = useState<SVCCEmpresaTercerizadaUpdateParams | undefined>();
  const { trigger: triggerUpdate, isMutating: isUpdating } = useSVCCEmpresaTercerizadaUpdate(updateParams, { onSuccess() { mutate(); } });
  const [deleteParams, setDeleteParams] = useState<SVCCEmpresaTercerizadaDeleteParams | undefined>();
  const { trigger: triggerDelete, isMutating: isDeleting } = useSVCCEmpresaTercerizadaDelete(deleteParams, { onSuccess() { mutate(); } });
  const isWorking = isCreating || isUpdating || isDeleting || isLoading || isValidating;

  const readonly = presentacion?.presentacionFecha != null;
  return (
    <>
      <EmpresaTercerizadaBrowse
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
          <EmpresaTercerizadaForm
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
    const value = "Empresa Tercerizada";
    switch (edit.action) {
      case "create": return `Agregando ${value}`;
      case "read": return `Consultando ${value}`;
      case "update": return `Modificando ${value}`;
      case "delete": return `Borrando ${value}`;
    }
  }
  function handleOnChange(changes: DeepPartial<EmpresaTercerizadaDTO>) {
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
      if ("ciiu" in changes) {
        if (changes.ciiu) {
          const ciiuNewIx = refCIIU.data?.findIndex((r) => r.ciiuRev4 === changes.ciiu) ?? -1;
          if (ciiuNewIx < 0) {
            edit.errors!.ciiu = true;
            edit.helpers!.ciiu = "No existe CIIU";
          } else {
            delete edit.errors!.ciiu;
            delete edit.helpers!.ciiu;
          }
        } else {
          delete edit.errors!.ciiu;
          // edit.helpers.ciiu = "Debe elegir un CIIU";
          delete edit.helpers!.ciiu;
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
        triggerCreate({ presentacionId: presentacion?.interno ?? 0, ...edit.data } as EmpresaTercerizadaCreateDTO)
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
        triggerUpdate(edit.data as EmpresaTercerizadaBaseDTO)
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
        triggerDelete(edit.data as EmpresaTercerizadaDTO)
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
  function onAction(action: EditAction, data?: EmpresaTercerizadaDTO) {
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
          cuit: true,
          ciiu: true,
          cantidadTrabajadores: true,
        }
        : {},
    });
  }
}
