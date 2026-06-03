import { Grid, TextField } from "@mui/material";
import type { PresentacionUltimaDTO } from "@/data/svccAPI";
import Formato from "@/utils/Formato";

type IniciarPresentacionFormProps = {
  data: PresentacionUltimaDTO;
  onChange: (patch: Partial<PresentacionUltimaDTO>) => void;
};

function formatFecha(value?: string): string {
  if (value == null || value === "" || String(value) === "null") return "";
  return Formato.Fecha(value);
}

export function IniciarPresentacionForm({ data, onChange }: IniciarPresentacionFormProps) {
  const numberOnChange = (field: keyof PresentacionUltimaDTO) =>
    ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ [field]: value === "" ? 0 : Number(value) });

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <TextField
          label="Empleador CUIT"
          value={Formato.CUIP(data.empleadorCuit)}
          disabled
          fullWidth
        />
      </Grid>
      <Grid size={12}>
        <TextField
          label="Razón social"
          value={data.empleadorRazonSocial ?? ""}
          disabled
          fullWidth
        />
      </Grid>
      <Grid size={4}>
        <TextField
          label="Interno (origen)"
          type="number"
          value={data.interno ?? ""}
          disabled
          fullWidth
        />
      </Grid>
      <Grid size={4}>
        <TextField
          label="ID presentación"
          type="number"
          value={data.idPresentacion ?? ""}
          disabled
          fullWidth
        />
      </Grid>
      <Grid size={4}>
        <TextField
          label="Número de póliza"
          type="number"
          value={data.numeroDePoliza ?? ""}
          onChange={numberOnChange("numeroDePoliza")}
          fullWidth
        />
      </Grid>
      <Grid size={4}>
        <TextField
          label="ID motivo"
          type="number"
          value={data.idMotivo ?? ""}
          onChange={numberOnChange("idMotivo")}
          fullWidth
        />
      </Grid>
      <Grid size={4}>
        <TextField
          label="ID programa muestra"
          type="number"
          value={data.idProgramaMuestra ?? ""}
          onChange={numberOnChange("idProgramaMuestra")}
          fullWidth
        />
      </Grid>
      <Grid size={4}>
        <TextField
          label="Versión"
          type="number"
          value={data.version ?? ""}
          onChange={numberOnChange("version")}
          fullWidth
        />
      </Grid>
      <Grid size={12}>
        <TextField
          label="Observaciones"
          value={data.observaciones ?? ""}
          onChange={({ target: { value } }) => onChange({ observaciones: value })}
          multiline
          minRows={2}
          fullWidth
        />
      </Grid>
      <Grid size={4}>
        <TextField
          label="Fecha presentación (última)"
          value={formatFecha(data.presentacionFecha)}
          disabled
          fullWidth
        />
      </Grid>
      <Grid size={4}>
        <TextField
          label="Fecha consolidación (última)"
          value={formatFecha(data.consolidacionFecha)}
          disabled
          fullWidth
        />
      </Grid>
      <Grid size={4}>
        <TextField
          label="Fecha insert (última)"
          value={formatFecha(data.fechaInsert)}
          disabled
          fullWidth
        />
      </Grid>
      <Grid size={6}>
        <TextField
          label="Constancia GUID (última)"
          value={data.constanciaGUID ?? ""}
          disabled
          fullWidth
        />
      </Grid>
      <Grid size={6}>
        <TextField
          label="Constancia archivo (última)"
          value={data.constanciaArchivo ?? ""}
          disabled
          fullWidth
        />
      </Grid>
    </Grid>
  );
}
