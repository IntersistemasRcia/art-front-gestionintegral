import CustomButton from "@/utils/ui/button/CustomButton";
import { useSVCCPresentacionContext } from "../context";
import { Grid, Typography } from "@mui/material";
import Formato from "@/utils/Formato";

export default function IniciarHandler() {
  const { ultima, nueva, empresaCUIT } = useSVCCPresentacionContext();
  const isWorking = ultima.isLoading || nueva.isMutating;
  const presentacionFecha = ultima.data?.presentacionFecha;
  const disabled = isWorking
    || (ultima?.data?.interno != null && presentacionFecha == null);

  return (
    <Grid container>
      <Grid size={12}>
        <CustomButton
          variant="contained"
          color="primary"
          size="large"
          onClick={() => nueva.trigger({ empleadorCUIT: empresaCUIT!, idMotivo: 1 })}
          loading={isWorking}
          disabled={disabled || !empresaCUIT}
        >
          Iniciar Nueva Presentación
        </CustomButton>
      </Grid>
      {(ultima.isLoading || ultima.isValidating)
        ? (<Typography variant="caption" color="info" sx={{ ml: 2, mt: 0.5 }}>Cargando..</Typography>)
        : (ultima.error == null)
          ? (presentacionFecha == null)
            ? (<Typography variant="h6" color="info" sx={{ ml: 2, mt: 0.5 }}>Presentacion iniciada pendiente de confirmar</Typography>)
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
      {(nueva.error == null) ? null : (
        <Grid size={12}>
          <Typography variant="h6" color="error" sx={{ ml: 2, mt: 0.5 }}>Error generando nueva presentación "{nueva.error.message}"</Typography>
        </Grid>
      )}
    </Grid>
  );
}