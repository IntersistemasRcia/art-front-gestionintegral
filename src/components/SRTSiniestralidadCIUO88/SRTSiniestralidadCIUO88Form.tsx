import { Grid, TextField } from "@mui/material";
import { SRTSiniestralidadCIUO88 } from "@/data/srtAPI";
import { Form } from "@/utils/ui/form/Form";

export const SRTSiniestralidadCIUO88Form: Form<SRTSiniestralidadCIUO88> = ({
  data,
  disabled = {},
  errors = {},
  helpers = {},
  onChange = () => { },
}) => (
  <Grid container size={12} spacing={2} maxHeight="fit-content">
    <Grid size={3}>
      <TextField
        name="ciuO88"
        type="number"
        label="Cod. CIUO"
        value={data.ciuO88}
        disabled={disabled.ciuO88}
        onChange={({ target: { value } }) => onChange({ ciuO88: Number(value) })}
        error={errors.ciuO88}
        helperText={helpers.ciuO88}
        fullWidth
      />
    </Grid>
    <Grid size={9}>
      <TextField
        name="descripcion"
        label="Descripción CIUO"
        value={data.descripcion}
        disabled={disabled.descripcion}
        onChange={({ target: { value } }) => onChange({ descripcion: value })}
        error={errors.descripcion}
        helperText={helpers.descripcion}
        fullWidth
      />
    </Grid>
  </Grid>
);

export default SRTSiniestralidadCIUO88Form;