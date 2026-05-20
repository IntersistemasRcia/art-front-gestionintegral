import { Grid, Typography } from "@mui/material";
import { useSVCCPresentacionContext } from "../context";
import CustomButton from "@/utils/ui/button/CustomButton";
import { BsDownload } from "react-icons/bs";

export default function ConstanciaHandler() {
  const { constancia } = useSVCCPresentacionContext();

  return (
    <Grid container>
      <Grid size={12}>
        <CustomButton
          variant="contained"
          color="primary"
          size="large"
          href={constancia.data ? URL.createObjectURL(constancia.data) : undefined}
          download={constancia.data?.name}
          isLoading={constancia.isLoading || constancia.isValidating}
          disabled={constancia.data == null || !!constancia.error}
          icon={<BsDownload />}
        >Descargar constancia de presentación SVCC</CustomButton>
      </Grid>
      {(constancia.error == null) ? null : (
        <Grid size={12}>
          <Typography variant="h6" color="error" sx={{ ml: 2, mt: 0.5 }}>Error obteniendo constancia de presentación "{constancia.error.message}"</Typography>
        </Grid>
      )}
    </Grid>
  );
}