import { useMemo, useState } from "react";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModal from "@/utils/ui/form/CustomModal";
import { useSVCCPresentacionContext } from "../context";
import { Grid, Typography } from "@mui/material";
import Formato from "@/utils/Formato";
import SvccAPI from "@/data/svccAPI";
import type { PresentacionCreateDTO, PresentacionDTO, PresentacionUltimaDTO } from "@/data/svccAPI";
import { useEmpresasStore } from "@/data/empresasStore";
import { useParametrosEntidadesStore } from "@/data/ParametrosEntidadesStore";
import { getParametroEntidadNumero } from "@/utils/parametrosEntidadesUtils";
import {
  copyPortadaYAnexoVFromOrigen,
  copyNominasToPresentacion,
  fetchTrabajadoresByPresentacionId,
} from "@/utils/svcc/copyPresentacionDetalle";
import {
  buildIniciarPresentacionForm,
  canIniciarNuevaPresentacion,
  presentacionUltimaFormToCreate,
} from "@/utils/svcc/presentacionUtils";
import { IniciarPresentacionForm } from "./IniciarPresentacionForm";

export default function IniciarHandler() {
  const { ultima, nueva, empresaCUIT, presentacion } = useSVCCPresentacionContext();
  const { empresas } = useEmpresasStore();
  const { parametrosEntidades } = useParametrosEntidadesStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<PresentacionUltimaDTO | null>(null);
  const [isCopyingDetalle, setIsCopyingDetalle] = useState(false);
  const [copyDetalleError, setCopyDetalleError] = useState<string | null>(null);

  const isWorking = ultima.isLoading || nueva.isMutating || isCopyingDetalle;
  const presentacionFecha = ultima.data?.presentacionFecha;
  const puedeIniciarNueva = canIniciarNuevaPresentacion(
    ultima.data,
    ultima.error,
    ultima.isLoading || ultima.isValidating,
    empresaCUIT,
  );
  const disabled = isWorking || !puedeIniciarNueva;

  const empresaSeleccionada = useMemo(
    () =>
      empresaCUIT == null
        ? null
        : empresas.find((empresa) => Number(empresa.cuit) === empresaCUIT) ?? null,
    [empresaCUIT, empresas],
  );

  const handleOpenModal = () => {
    if (empresaCUIT == null) return;
    setCopyDetalleError(null);
    const idProgramaMuestraParam = getParametroEntidadNumero(
      parametrosEntidades,
      "IdProgramaMuestra",
    );
    setFormData(
      buildIniciarPresentacionForm({
        ultima: ultima.data,
        empleadorCUIT: empresaCUIT,
        empresa: empresaSeleccionada,
        idProgramaMuestraParam,
      }),
    );
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (nueva.isMutating) return;
    setModalOpen(false);
    setFormData(null);
  };

  const handleConfirm = async () => {
    if (empresaCUIT == null || formData == null) return;
    setCopyDetalleError(null);
    try {
      const ultimaAnterior = await SvccAPI.svccPresentacionUltima({ empleadorCuit: empresaCUIT });
      const presentacionOrigenInterno = Number(ultimaAnterior?.interno ?? formData.interno ?? 0);

      const trabajadoresOrigen = presentacionOrigenInterno > 0
        ? await fetchTrabajadoresByPresentacionId(presentacionOrigenInterno)
        : [];

      const created = await (nueva.trigger as (data: PresentacionCreateDTO) => Promise<PresentacionDTO>)(
        presentacionUltimaFormToCreate(formData, empresaCUIT)
      );
      const createdInterno = created?.interno ?? 0;
      if (ultima.data != null && createdInterno <= 0) {
        setCopyDetalleError("No se pudo determinar el interno de la nueva presentación para copiar sus registros hijos.");
        return;
      }
      if (createdInterno > 0) {
        setIsCopyingDetalle(true);
        try {
          if (
            presentacionOrigenInterno > 0
            && presentacionOrigenInterno !== createdInterno
          ) {
            const maps = await copyPortadaYAnexoVFromOrigen(presentacionOrigenInterno, createdInterno);
            await copyNominasToPresentacion(trabajadoresOrigen, createdInterno, maps);
          }
          presentacion.setSelected(created);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Error copiando Portada, Anexo V o Nóminas de la presentación anterior";
          setCopyDetalleError(message);
          return;
        } finally {
          setIsCopyingDetalle(false);
        }
      }
      setModalOpen(false);
      setFormData(null);
    } catch {
      /* el error se muestra vía nueva.error */
    }
  };

  const handleFormChange = (patch: Partial<PresentacionUltimaDTO>) => {
    setFormData((prev) => (prev == null ? prev : { ...prev, ...patch }));
  };

  const modalTitle = useMemo(
    () => (ultima.data != null ? "Iniciar nueva presentación (copiada de la última)" : "Iniciar nueva presentación"),
    [ultima.data]
  );

  return (
    <Grid container>
      <Grid size={12}>
        <CustomButton
          variant="contained"
          color="primary"
          size="large"
          onClick={handleOpenModal}
          isLoading={isWorking}
          disabled={disabled}
        >
          Iniciar Nueva Presentación
        </CustomButton>
      </Grid>
      {(ultima.isLoading || ultima.isValidating)
        ? (<Typography variant="caption" color="info" sx={{ ml: 2, mt: 0.5 }}>Cargando..</Typography>)
        : (ultima.error == null)
          ? (ultima.data == null)
            ? (<Typography variant="h6" color="info" sx={{ ml: 2, mt: 0.5 }}>No se realizaron presentaciones anteriormente</Typography>)
            : (presentacionFecha == null)
              ? (<Typography variant="h6" color="info" sx={{ ml: 2, mt: 0.5 }}>Presentacion iniciada pendiente de confirmar</Typography>)
              : (<Typography variant="h6" color="info" sx={{ ml: 2, mt: 0.5 }}>Ultima presentación confirmada el {Formato.Fecha(presentacionFecha)}</Typography>)
          : (
            <Grid size={12}>
              {
                (ultima.error.status === 403)
                  ? (<Typography variant="h6" color="error" sx={{ ml: 2, mt: 0.5 }}>No tiene permisos para consultar la última presentación</Typography>)
                  : (ultima.error.status === 500)
                    ? (<Typography variant="h6" color="warning" sx={{ ml: 2, mt: 0.5 }}>No se pudo consultar la última presentación. Puede iniciar una nueva presentación.</Typography>)
                    : (<Typography variant="h6" color="error" sx={{ ml: 2, mt: 0.5 }}>Error consultando última presentación "{ultima.error.message}"</Typography>)
              }
            </Grid>
          )
      }
      {(nueva.error == null) ? null : (
        <Grid size={12}>
          <Typography variant="h6" color="error" sx={{ ml: 2, mt: 0.5 }}>Error generando nueva presentación "{nueva.error.message}"</Typography>
        </Grid>
      )}
      {(copyDetalleError == null) ? null : (
        <Grid size={12}>
          <Typography variant="h6" color="error" sx={{ ml: 2, mt: 0.5 }}>
            La presentación se creó, pero falló la copia de Portada/Anexo V/Nóminas: {copyDetalleError}
          </Typography>
        </Grid>
      )}
      {isCopyingDetalle ? (
        <Grid size={12}>
          <Typography variant="caption" color="info" sx={{ ml: 2, mt: 0.5 }}>
            Copiando Portada, Anexo V y Nóminas de la última presentación...
          </Typography>
        </Grid>
      ) : null}

      <CustomModal
        open={modalOpen}
        onClose={handleCloseModal}
        title={modalTitle}
        size="large"
        actions={(
          <Grid container spacing={2}>
            <CustomButton
              onClick={handleConfirm}
              disabled={nueva.isMutating || isCopyingDetalle || formData == null}
              isLoading={nueva.isMutating || isCopyingDetalle}
            >
              Confirmar e iniciar
            </CustomButton>
            <CustomButton
              onClick={handleCloseModal}
              color="secondary"
              disabled={nueva.isMutating || isCopyingDetalle}
            >
              Cancelar
            </CustomButton>
          </Grid>
        )}
      >
        {formData != null && (
          <>
            {ultima.data != null && (
              <Typography variant="body2" color="info" sx={{ mb: 2 }}>
                Al confirmar se copiarán también los registros de Portada, Anexo V y Nóminas de la última presentación.
              </Typography>
            )}
            <IniciarPresentacionForm data={formData} onChange={handleFormChange} />
          </>
        )}
      </CustomModal>
    </Grid>
  );
}
