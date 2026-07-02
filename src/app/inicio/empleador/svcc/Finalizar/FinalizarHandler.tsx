import CustomButton from "@/utils/ui/button/CustomButton";
import { useSVCCPresentacionContext } from "../context";
import { Grid, Typography } from "@mui/material";
import Formato from "@/utils/Formato";

export default function FinalizarHandler() {
  const { finaliza, presentacion } = useSVCCPresentacionContext();
  const isWorking = finaliza.isMutating;
  const presentacionFecha = presentacion.selected?.presentacionFecha;
  const presentacionId = presentacion.selected?.interno;
  const disabled = isWorking
    || presentacionFecha != null
    || (presentacionId == null || presentacionId <= 0);
    // ToDo: Revisar si se completaron todos los datos requeridos

  return (
    <Grid container>
      <Grid size={12}>
        <CustomButton
          variant="contained"
          color="primary"
          size="large"
          onClick={() => {
            if (presentacionId == null || presentacionId <= 0) return;
            void finaliza.trigger({ id: presentacionId, observaciones: '' });
          }}
          loading={isWorking}
          disabled={disabled}
        >
          Confirma presentación
        </CustomButton>
      </Grid>
      {presentacion.selected == null
        ? (<Typography variant="h6" color="info" sx={{ ml: 2, mt: 0.5 }}>Debe seleccionar una presentación</Typography>)
        : presentacionFecha == null
          ? (<Typography variant="h6" color="info" sx={{ ml: 2, mt: 0.5 }}>Presentación pendiente de confirmar</Typography>)
          : (<Typography variant="h6" color="info" sx={{ ml: 2, mt: 0.5 }}>Presentación confirmada el {Formato.Fecha(presentacionFecha)}</Typography>)
      }
      {(finaliza.error == null) ? null : (
        <Grid size={12}>
          <Typography variant="h6" color="error" sx={{ ml: 2, mt: 0.5 }}>Error finalizando presentación "{finaliza.error.message}"</Typography>
        </Grid>
      )}
    </Grid>
  );
}