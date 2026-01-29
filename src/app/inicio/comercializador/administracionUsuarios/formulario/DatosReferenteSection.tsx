import {
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import styles from "./formulario.module.css";
import CustomButton from "@/utils/ui/button/CustomButton";
import { FaSearch } from "react-icons/fa";
import { SelectChangeEvent } from "@mui/material/Select";
import {
  UsuarioFormFields,
  ValidationErrors,
  TouchedFields,
} from "./types/formulario";

interface Props {
  form: UsuarioFormFields;
  errors: ValidationErrors;
  touched: TouchedFields;
  busqueda: string;
  onBusquedaChange: (value: string) => void;
  onBuscarLocalidades: () => void;
  localidadesOptions: any[];
  isValidating: boolean;
  isDisabled: boolean;
  onTextFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (e: SelectChangeEvent<string>) => void;
  onBlur: (field: keyof TouchedFields) => void;
}

export default function DatosReferenteSection({
  form,
  errors,
  touched,
  busqueda,
  onBusquedaChange,
  onBuscarLocalidades,
  localidadesOptions,
  isValidating,
  isDisabled,
  onTextFieldChange,
  onSelectChange,
  onBlur,
}: Props) {
  return (
    <div className={styles.formSection}>
      <Typography variant="h6" className={styles.sectionTitle}>
        Datos Referente
      </Typography>

      <div className={styles.formRow}>
        <TextField
          label="Búsqueda Localidad / C.P."
          name="busqueda"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          fullWidth
          className={styles.searchInput}
          disabled={isDisabled}
          placeholder="Buscar..."
        />

        <CustomButton
          color="primary"
          size="small"
          aria-label="buscar localidad"
          onClick={onBuscarLocalidades}
          disabled={isDisabled}
          className={styles.searchButton}
          style={{ minWidth: 0, padding: "4px 10px" }}
        >
          <FaSearch size={14} />
        </CustomButton>

        <div>
          <Autocomplete
            disabled={isDisabled}
            options={localidadesOptions}
            getOptionLabel={(opt: any) =>
              String(opt?.nombreCompleto ?? opt?.nombre ?? "")
            }
            isOptionEqualToValue={(opt: any, val: any) =>
              String(opt?.codigo) === String(val?.codigo)
            }
            value={
              localidadesOptions.find(
                (loc) => String(loc.codigo) === String(form.domicilioCodLocalidad)
              ) ?? null
            }
            onChange={(_e, newValue: any) => {
              const codigo = newValue ? String(newValue.codigo ?? "") : "";
              const nombre = newValue
                ? String(newValue.nombreCompleto ?? newValue.nombre ?? "")
                : "";
              const syntheticSelect = {
                target: { name: "domicilioCodLocalidad", value: codigo },
              } as any;
              onSelectChange(syntheticSelect as any);
              const syntheticText = {
                target: { name: "domicilioLocalidad", value: nombre },
              } as any;
              onTextFieldChange(syntheticText as any);
              const codigoPostal = newValue
                ? String(newValue.codPostal ?? newValue.CodPostal ?? "")
                : "";
              const syntheticPostal = {
                target: { name: "domicilioCodPostal", value: codigoPostal },
              } as any;
              onTextFieldChange(syntheticPostal as any);
              const provincia = newValue
                ? String(newValue.litProvincia ?? newValue.provincia ?? "")
                : "";
              const syntheticProvincia = {
                target: { name: "domicilioProvincia", value: provincia },
              } as any;
              onTextFieldChange(syntheticProvincia as any);
            }}
            onBlur={() => onBlur("domicilioCodLocalidad")}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Localidad"
                placeholder="Seleccione localidad"
                error={
                  touched.domicilioCodLocalidad &&
                  !!errors.domicilioCodLocalidad
                }
                helperText={
                  touched.domicilioCodLocalidad &&
                  errors.domicilioCodLocalidad
                }
              />
            )}
          />

          {isValidating && <Typography variant="caption">cargando...</Typography>}
        </div>
      </div>

      <div className={styles.formRow}>
        <TextField
          label="Cód. Postal"
          name="domicilioCodPostal"
          value={form.domicilioCodPostal}
          onChange={onTextFieldChange}
          fullWidth
          disabled={isDisabled}
          InputProps={{ readOnly: true }}
          placeholder="Código postal"
        />

        <TextField
          label="Provincia"
          name="domicilioProvincia"
          value={form.domicilioProvincia}
          onChange={onTextFieldChange}
          onBlur={() => onBlur("domicilioProvincia")}
          fullWidth
          disabled={isDisabled}
          InputProps={{ readOnly: true }}
          placeholder="Provincia"
        />
      </div>

      <div className={styles.formRow}>
        <TextField
          label="Domicilio Calle"
          name="domicilioCalle"
          value={form.domicilioCalle ?? ""}
          onChange={onTextFieldChange}
          onBlur={() => onBlur("domicilioCalle")}
          error={touched.domicilioCalle && !!errors.domicilioCalle}
          helperText={touched.domicilioCalle && errors.domicilioCalle}
          fullWidth
          disabled={isDisabled}
          placeholder="Ingrese calle"
        />
        <TextField
          label="Nro"
          name="domicilioNro"
          value={form.domicilioNro ?? ""}
          onChange={onTextFieldChange}
          onBlur={() => onBlur("domicilioNro")}
          error={touched.domicilioNro && !!errors.domicilioNro}
          helperText={touched.domicilioNro && errors.domicilioNro}
          fullWidth
          disabled={isDisabled}
          placeholder="Ingrese número"
        />
        <TextField
          label="Piso"
          name="domicilioPiso"
          value={form.domicilioPiso ?? ""}
          onChange={onTextFieldChange}
          onBlur={() => onBlur("domicilioPiso")}
          error={touched.domicilioPiso && !!errors.domicilioPiso}
          helperText={touched.domicilioPiso && errors.domicilioPiso}
          fullWidth
          disabled={isDisabled}
          placeholder="Ingrese piso"
        />
      </div>

      <div className={styles.formRow}>
        <TextField
          label="Entre calle 1"
          name="domicilioEntreCalle1"
          value={form.domicilioEntreCalle1 ?? ""}
          onChange={onTextFieldChange}
          onBlur={() => onBlur("domicilioEntreCalle1")}
          error={touched.domicilioEntreCalle1 && !!errors.domicilioEntreCalle1}
          helperText={touched.domicilioEntreCalle1 && errors.domicilioEntreCalle1}
          fullWidth
          disabled={isDisabled}
          placeholder="Ingrese entre calle 1"
        />
        <TextField
          label="Y calle 2"
          name="domicilioEntreCalle2"
          value={form.domicilioEntreCalle2 ?? ""}
          onChange={onTextFieldChange}
          onBlur={() => onBlur("domicilioEntreCalle2")}
          error={touched.domicilioEntreCalle2 && !!errors.domicilioEntreCalle2}
          helperText={touched.domicilioEntreCalle2 && errors.domicilioEntreCalle2}
          fullWidth
          disabled={isDisabled}
          placeholder="Ingrese calle 2"
        />
      </div>
    </div>
  );
}
