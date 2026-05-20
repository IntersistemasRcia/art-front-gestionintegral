import CustomButton from "@/utils/ui/button/CustomButton";
import { useSVCCPresentacionContext } from "../context";
import { Grid, Typography } from "@mui/material";
import Formato from "@/utils/Formato";

export default function FinalizarHandler() {
  const { ultima, finaliza, presentacion } = useSVCCPresentacionContext();
  const isWorking = ultima.isLoading || finaliza.isMutating;
  const presentacionFecha = ultima.data?.presentacionFecha;
  const presentacionId = presentacion.selected?.interno;
  const disabled = isWorking
    || (ultima?.data?.interno == null || presentacionFecha != null)
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
      {(ultima.isLoading || ultima.isValidating)
        ? (<Typography variant="caption" color="info" sx={{ ml: 2, mt: 0.5 }}>Cargando..</Typography>)
        : (ultima.error == null)
          ? (presentacionFecha == null)
            ? (<Typography variant="h6" color="info" sx={{ ml: 2, mt: 0.5 }}>Presentacion pendiente de confirmar</Typography>)
            : (<Typography variant="h6" color="info" sx={{ ml: 2, mt: 0.5 }}>Ultima presentación confirmada el {Formato.Fecha(presentacionFecha)}</Typography>)
          : (
            <Grid size={12}>
              {
                (ultima.error.status === 404)
                  ? (<Typography variant="h6" color="info" sx={{ ml: 2, mt: 0.5 }}>No se realizaron presentaciones anteriormente</Typography>)
                  : (ultima.error.status === 403)
                    ? (<Typography variant="h6" color="error" sx={{ ml: 2, mt: 0.5 }}>No tiene permisos para consultar la última presentación</Typography>)
                    : (<Typography variant="h6" color="error" sx={{ ml: 2, mt: 0.5 }}>Error consultando última presentación "{ultima.error.message}"</Typography>)
              }
            </Grid>
          )
      }
      {(finaliza.error == null) ? null : (
        <Grid size={12}>
          <Typography variant="h6" color="error" sx={{ ml: 2, mt: 0.5 }}>Error finalizando presentación "{finaliza.error.message}"</Typography>
        </Grid>
      )}
    </Grid>
  );
}