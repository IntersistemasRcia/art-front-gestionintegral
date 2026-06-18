import { useState } from "react";
import { Grid, IconButton, InputAdornment, TextField, Tooltip } from "@mui/material";
import { MoreHoriz } from "@mui/icons-material";
import { PuestoDTO } from "@/data/gestionEmpleadorAPI";
import { Form } from "@/utils/ui/form/Form";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import SRTSiniestralidadCIUO88Browse from "@/components/SRTSiniestralidadCIUO88/SRTSiniestralidadCIUO88Browse";
import { useSVCCPresentacionContext } from "../../../context";

const tooltip_SlotProps = { tooltip: { sx: { fontSize: "1.2rem", fontWeight: 500 } } };
export const PuestoForm: Form<PuestoDTO> = ({
  data,
  disabled = {},
  errors = {},
  helpers = {},
  onChange = () => { },
}) => {
  const [lookupCIUO, setLookupCIUO] = useState<boolean>(false);
  const { ciuo88 } = useSVCCPresentacionContext();
  
  return (
    <Grid container size={12} spacing={2} maxHeight="fit-content">
      <Grid size={3}>
        <TextField
          name="ciuo"
          type="number"
          label="CIUO"
          value={data.ciuo ?? ""}
          disabled={disabled.ciuo}
          onChange={({ target: { value } }) => onChange({ ciuo: Number(value) })}
          error={errors.ciuo}
          helperText={helpers.ciuo}
          slotProps={{
            inputLabel: { shrink: data.ciuo != null },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip
                    title="Buscar CIUO"
                    arrow
                    slotProps={tooltip_SlotProps}
                  >
                    <div>
                      <IconButton
                        color="primary"
                        size="large"
                        disabled={disabled.ciuo}
                        onClick={() => setLookupCIUO(true)}
                      >
                        <MoreHoriz />
                      </IconButton>
                    </div>
                  </Tooltip>
                </InputAdornment>
              ),
            }
          }}
          fullWidth
        />
        <CustomModal
          open={lookupCIUO}
          onClose={() => setLookupCIUO(false)}
          title="Selección de CIUO"
          size="large"
          actions={(
            <Grid container spacing={2}>
              <CustomButton
                onClick={() => setLookupCIUO(false)}
                color="secondary"
              >
                Cancelar
              </CustomButton>
            </Grid>
          )}
        >
          <Grid container spacing={2} justifyContent="center" minHeight="500px">
            <Grid size={12}>
              <SRTSiniestralidadCIUO88Browse
                isLoading={ciuo88.isLoading || ciuo88.isValidating}
                data={{ data: ciuo88.data ?? [] }}
                onSelect={(select) => () => {
                  const ciuo = Number(select.ciuO88 ?? (select as any).ciuo88);
                  onChange({
                    ciuo: Number.isFinite(ciuo) ? ciuo : undefined,
                    nombre: select.descripcion,
                  });
                  setLookupCIUO(false);
                }}
              />
            </Grid>
          </Grid>
        </CustomModal>
      </Grid>
      <Grid size={9}>
        <TextField
          name="nombre"
          label="Nombre"
          value={data.nombre ?? ""}
          disabled={disabled.nombre}
          onChange={({ target: { value } }) => onChange({ nombre: value })}
          error={errors.nombre}
          helperText={helpers.nombre}
          fullWidth
        />
      </Grid>
    </Grid>
  );
}

export default PuestoForm;