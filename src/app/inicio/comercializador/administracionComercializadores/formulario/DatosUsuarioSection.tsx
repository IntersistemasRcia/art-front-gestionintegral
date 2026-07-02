import {
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { Checkbox, FormControlLabel } from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/material.css";
import styles from "./formulario.module.css";
import {
  UsuarioFormFields,
  ValidationErrors,
  TouchedFields,
} from "./types/formulario";
import RolesInterface from "@/app/inicio/usuarios/interfaces/RolesInterface";

export type SelectOption = {
  value: string;
  label: string;
};

interface Props {
  form: UsuarioFormFields;
  errors: ValidationErrors;
  touched: TouchedFields;
  displayedRoles: RolesInterface[];
  isCreating: boolean;
  isEditing: boolean;
  isViewing: boolean;
  isDisabled: boolean;
  onTextFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (e: SelectChangeEvent<string>) => void;
  onBlur: (field: keyof TouchedFields) => void;
  onToggleAplicaIva: (checked: boolean) => void;
  creationRole?: string | null;
}

export default function DatosUsuarioSection({
  form,
  errors,
  touched,
  displayedRoles,
  isCreating,
  isEditing,
  isViewing,
  isDisabled,
  onTextFieldChange,
  onSelectChange,
  onBlur,
  onToggleAplicaIva,
  creationRole = null,
}: Props) {
  const roleKey = String(creationRole ?? form.rol ?? "").toLowerCase();
  const hideFechaNacimientoInCreateEdit =
    (isCreating || isEditing) &&
    (roleKey.includes("grupo") || roleKey.includes("organizador"));

  const roleLabel = (() => {
    const r = String(creationRole ?? form.rol ?? '').toLowerCase();
    if (!r) return 'Usuario';
    if (r === 'comercializador') return 'Comercializador';
    if (r === 'organizadorcomercializador') return 'Organizador Comercializador';
    if (r === 'grupoorganizador') return 'Grupo Organizador';
    if (r.includes('organizador')) return 'Organizador';
    if (r.includes('grupo')) return 'Grupo';
    // Fallback: capitalize first letter
    return creationRole?.charAt(0).toUpperCase() + String(creationRole).slice(1);
  })();
  return (
    <div className={styles.formSection}>
      <Typography variant="h6" className={styles.sectionTitle}>
        {`Datos del ${roleLabel}`}
      </Typography>

      <div className={styles.formRow}>
        <TextField
          label="Nombre/Apellido"
          name="nombre"
          value={form.nombre}
          onChange={onTextFieldChange}
          onBlur={() => onBlur("nombre")}
          error={touched.nombre && !!errors.nombre}
          helperText={touched.nombre && errors.nombre}
          fullWidth
          required={!isDisabled}
          disabled={isDisabled}
          placeholder="Ingrese nombre"
        />
      </div>

      <div className={styles.formRow}>
        {(isCreating || isEditing || isViewing) && (
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("email")}
            error={touched.email && !!errors.email}
            helperText={touched.email && errors.email}
            required={!isDisabled}
            disabled={isDisabled}
            placeholder="ejemplo@empresa.com"
          />
        )}
        <TextField
          label="CUIT/CUIL"
          name="cuit"
          value={form.cuit}
          onChange={onTextFieldChange}
          onBlur={() => onBlur("cuit")}
          error={touched.cuit && !!errors.cuit}
          helperText={touched.cuit && errors.cuit}
          required={!isDisabled}
          disabled={isDisabled}
          placeholder="Ingrese CUIT (11 dígitos)"
          className={styles.fieldSmall}
        />
        <div className={`${styles.phoneField} ${styles.phoneFieldWidth}`}>
          <PhoneInput
            country="ar"
            value={form.phoneNumber}
            onChange={(value) =>
              onTextFieldChange({
                target: { name: "phoneNumber", value },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            onBlur={() => onBlur("phoneNumber")}
            disabled={isDisabled}
            specialLabel="Teléfono"
            containerClass={styles.phoneContainer}
            inputClass={styles.phoneInput}
            buttonClass={styles.phoneButton}
            inputProps={{ name: "phoneNumber" }}
          />
          {touched.phoneNumber && errors.phoneNumber && (
            <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
              {errors.phoneNumber}
            </Typography>
          )}
        </div>
        {roleKey !== "comercializador" && !hideFechaNacimientoInCreateEdit && (
          <TextField
            label="Fecha Nacimiento"
            name="fechaNacimiento"
            type="date"
            value={form.fechaNacimiento ?? ""}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("fechaNacimiento")}
            error={touched.fechaNacimiento && !!errors.fechaNacimiento}
            helperText={touched.fechaNacimiento && errors.fechaNacimiento}
            disabled={isDisabled}
            InputLabelProps={{ shrink: true }}
            className={styles.fieldSmall}
          />
        )}
        <TextField
          label="Matrícula"
          name="matricula"
          type="number"
          value={form.matricula ?? ""}
          onChange={onTextFieldChange}
          onBlur={() => onBlur("matricula")}
          error={touched.matricula && !!errors.matricula}
          helperText={touched.matricula && errors.matricula}
          disabled={isDisabled}
          placeholder="Ingrese matrícula"
          className={styles.fieldNarrow}
        />
      </div>

      {/* Rol removido: se determina desde el contexto donde se crea el usuario */}

      {(isCreating || isEditing || isViewing) &&
        String(form.rol ?? "").toLowerCase() === "comercializador" && (
          <>
            <div className={styles.formRow}>
              <TextField
                label="Fecha Nacimiento"
                name="fechaNacimiento"
                type="date"
                value={form.fechaNacimiento ?? ""}
                onChange={onTextFieldChange}
                onBlur={() => onBlur("fechaNacimiento")}
                error={touched.fechaNacimiento && !!errors.fechaNacimiento}
                helperText={touched.fechaNacimiento && errors.fechaNacimiento}
                disabled={isDisabled}
                InputLabelProps={{ shrink: true }}
              />

              <FormControl fullWidth disabled={isDisabled}>
                <InputLabel>Canal Interviniente</InputLabel>
                <Select
                  name="canalInterviniente"
                  value={form.canalInterviniente ?? "E"}
                  label="Canal Interviniente"
                  onChange={onSelectChange}
                >
                  <MenuItem value={"P"}>Propio</MenuItem>
                  <MenuItem value={"E"}>Externo</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Fecha Inicio"
                name="inicioFecha"
                type="date"
                value={form.inicioFecha ?? ""}
                onChange={onTextFieldChange}
                fullWidth
                disabled={isDisabled}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Fecha Baja"
                name="bajaFecha"
                type="date"
                value={form.bajaFecha ?? ""}
                onChange={onTextFieldChange}
                fullWidth
                disabled={isDisabled}
                InputLabelProps={{ shrink: true }}
              />
            </div>

            <div className={styles.formRow}>
              <TextField
                label="Comisión (%)"
                name="comision"
                type="number"
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                value={String(form.comision ?? "")}
                onChange={onTextFieldChange}
                fullWidth
                disabled={isDisabled}
                placeholder="0"
                className={styles.wideField}
              />

              <TextField
                label="Servicios Adicionales (%)"
                name="serviciosAdicionales"
                type="number"
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                value={String(form.serviciosAdicionales ?? "")}
                onChange={onTextFieldChange}
                fullWidth
                disabled={isDisabled}
                placeholder="0"
                className={styles.wideField}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={Number(form.aplicaIva ?? 0) === 1}
                    onChange={(e) => onToggleAplicaIva(e.target.checked)}
                    disabled={isDisabled}
                    className={styles.checkboxLarge}
                  />
                }
                label={
                  <Typography className={styles.checkboxLabel} component="span">
                    Aplica IVA
                  </Typography>
                }
                className={styles.formControlLabel}
              />
            </div>
          </>
        )}
    </div>
  );
}
