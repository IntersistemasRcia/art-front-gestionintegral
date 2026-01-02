import React, { useEffect, useRef } from "react";
import { TextField, Typography } from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import styles from "../denuncias.module.css";
import type { DenunciaFormData, DatosEmpleadorProps } from "../types/tDenuncias";
import Formato from "@/utils/Formato";
import { useAuth } from "@/data/AuthContext";

const DatosEmpleador: React.FC<DatosEmpleadorProps> = ({
  form,
  errors,
  touched,
  isDisabled,
  readonlyEmpCuit = false,
  onTextFieldChange,
  onSelectChange,
  onBlur,
}) => {
  const { user } = useAuth();

  const empresaId = Number((user as any)?.empresaId ?? 0);
  const lockAllFields = isDisabled || empresaId > 0;
  const lockNonCuitFields = empresaId === 0; // admin: solo CUIT editable
  const nonCuitLocked = lockAllFields || lockNonCuitFields;
  const cuitLocked = lockAllFields || readonlyEmpCuit;
  const cuitEnabled = !cuitLocked;
  const nonCuitEnabled = !nonCuitLocked;
  // Helper para mantener sólo dígitos
  const onlyDigits = (v?: string) => (v ?? "").replace(/\D/g, "");

  // Handler numérico con formateo opcional
  const numericChange = (
    name: string,
    options?: { format?: (digits: string) => string; formatWhenLen?: number }
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = onlyDigits(e.target.value || "");
    const cap = options?.formatWhenLen ?? undefined as number | undefined;
    if (cap != null) {
      digits = digits.slice(0, cap);
    }
    const synthetic = { target: { name, value: digits } } as any;
    onTextFieldChange(synthetic);
    try {
      if (
        options?.format &&
        options.formatWhenLen != null &&
        digits.length === options.formatWhenLen &&
        !isDisabled
      ) {
        const formatted = options.format(digits);
        const syntheticEvent = { target: { name, value: formatted } } as any;
        onTextFieldChange(syntheticEvent);
      }
    } catch (err) {
      // ignore
    }
  };

  // Formateo inicial de empCuit si viene desde la base
  const empCuitInitRef = useRef(false);
  useEffect(() => {
    if (empCuitInitRef.current) return;
    const digits = onlyDigits(form.empCuit);
    if (digits.length === 11) {
      try {
        const formatted = Formato.CUIP(digits);
        if (formatted && formatted !== form.empCuit) {
          const synthetic = { target: { name: "empCuit", value: formatted } } as any;
          onTextFieldChange(synthetic);
        }
      } catch (err) {
        // ignore
      }
    }
    empCuitInitRef.current = true;
  }, [form.empCuit]);

  // Prefill automático desde empresaCUIT del usuario si está disponible
  const userCuitPrefilledRef = useRef(false);
  useEffect(() => {
    if (userCuitPrefilledRef.current) return;
    const userCuit = Number((user as any)?.empresaCUIT ?? 0);
    if (!userCuit || String(userCuit).length !== 11) return;

    const currentDigits = onlyDigits(form.empCuit);
    const desiredDigits = String(userCuit);
    if (currentDigits === desiredDigits) {
      userCuitPrefilledRef.current = true;
      return;
    }

    try {
      const formatted = Formato.CUIP(desiredDigits);
      const synthetic = { target: { name: "empCuit", value: formatted } } as any;
      onTextFieldChange(synthetic);
      userCuitPrefilledRef.current = true;
    } catch {
      // ignore
    }
  }, [user, form.empCuit, onTextFieldChange]);
  return (
    <div className={styles.formSection}>
      <Typography variant="h5" component="h2" className={styles.sectionTitle}>
        Datos del Empleador
      </Typography>

      <div className={styles.formRow}>
        <TextField
          label="CUIT"
          name="empCuit"
          value={form.empCuit}
          onChange={numericChange("empCuit", { format: (d) => Formato.CUIP(d), formatWhenLen: 11 })}
          onBlur={() => onBlur("empCuit")}
          error={touched.empCuit && !!errors.empCuit}
          helperText={touched.empCuit && errors.empCuit}
          fullWidth
          disabled={!cuitEnabled}
          InputProps={{ readOnly: !cuitEnabled }}
          placeholder="Solo números"
        />

        <TextField
          label="Póliza"
          name="empPoliza"
          value={form.empPoliza}
          onBlur={() => onBlur("empPoliza")}
          InputProps={{ readOnly: true }}
          error={touched.empPoliza && !!errors.empPoliza}
          helperText={touched.empPoliza && errors.empPoliza}
          fullWidth
          disabled={!nonCuitEnabled}
          placeholder="Número de póliza"
        />
      </div>

      <div className={styles.formRow}>
        <TextField
          label="Razón Social"
          name="empRazonSocial"
          value={form.empRazonSocial}
          InputProps={{ readOnly: true }}
          onBlur={() => onBlur("empRazonSocial")}
          error={touched.empRazonSocial && !!errors.empRazonSocial}
          helperText={touched.empRazonSocial && errors.empRazonSocial}
          fullWidth
          disabled={!nonCuitEnabled}
        />
      </div>

      <div className={styles.formRow}>
        <TextField
          label="Calle"
          name="empDomicilioCalle"
          value={form.empDomicilioCalle}
          InputProps={{ readOnly: true }}
          onBlur={() => onBlur("empDomicilioCalle")}
          error={touched.empDomicilioCalle && !!errors.empDomicilioCalle}
          helperText={touched.empDomicilioCalle && errors.empDomicilioCalle}
          fullWidth
          disabled={!nonCuitEnabled}
        />

        <TextField
          label="Número"
          name="empDomicilioNro"
          value={form.empDomicilioNro}
          InputProps={{ readOnly: true }}
          onBlur={() => onBlur("empDomicilioNro")}
          error={touched.empDomicilioNro && !!errors.empDomicilioNro}
          helperText={touched.empDomicilioNro && errors.empDomicilioNro}
          fullWidth
          disabled={!nonCuitEnabled}
        />
      </div>

      <div className={styles.formRow}>
        <TextField
          label="Piso"
          name="empDomicilioPiso"
          value={form.empDomicilioPiso}
          InputProps={{ readOnly: true }}
          onBlur={() => onBlur("empDomicilioPiso")}
          error={touched.empDomicilioPiso && !!errors.empDomicilioPiso}
          helperText={touched.empDomicilioPiso && errors.empDomicilioPiso}
          disabled={!nonCuitEnabled}
        />

        <TextField
          label="Departamento"
          name="empDomicilioDpto"
          value={form.empDomicilioDpto}
          InputProps={{ readOnly: true }}
          onBlur={() => onBlur("empDomicilioDpto")}
          error={touched.empDomicilioDpto && !!errors.empDomicilioDpto}
          helperText={touched.empDomicilioDpto && errors.empDomicilioDpto}
          disabled={!nonCuitEnabled}
        />
      </div>

      <div className={styles.formRow}>
        <TextField
          label="Entre Calle 1"
          name="empDomicilioEntreCalle1"
          value={form.empDomicilioEntreCalle1}
          InputProps={{ readOnly: true }}
          onBlur={() => onBlur("empDomicilioEntreCalle1")}
          error={touched.empDomicilioEntreCalle1 && !!errors.empDomicilioEntreCalle1}
          helperText={touched.empDomicilioEntreCalle1 && errors.empDomicilioEntreCalle1}
          disabled={!nonCuitEnabled}
        />

        <TextField
          label="Entre Calle 2"
          name="empDomicilioEntreCalle2"
          value={form.empDomicilioEntreCalle2}
          InputProps={{ readOnly: true }}
          onBlur={() => onBlur("empDomicilioEntreCalle2")}
          error={touched.empDomicilioEntreCalle2 && !!errors.empDomicilioEntreCalle2}
          helperText={touched.empDomicilioEntreCalle2 && errors.empDomicilioEntreCalle2}
          disabled={!nonCuitEnabled}
        />
      </div>

      <div className={styles.formRow}>
        <TextField
          label="Localidad (código)"
          name="empCodLocalidad"
          value={form.empCodLocalidad}
          InputProps={{ readOnly: true }}
          onBlur={() => onBlur("empCodLocalidad")}
          error={touched.empCodLocalidad && !!errors.empCodLocalidad}
          helperText={touched.empCodLocalidad && errors.empCodLocalidad}
          disabled={!nonCuitEnabled}
        />

        <TextField
          label="Código Postal"
          name="empCodPostal"
          value={form.empCodPostal}
          InputProps={{ readOnly: true }}
          onBlur={() => onBlur("empCodPostal")}
          error={touched.empCodPostal && !!errors.empCodPostal}
          helperText={touched.empCodPostal && errors.empCodPostal}
          disabled={!nonCuitEnabled}
        />
      </div>

      <div className={styles.formRow}>
        <TextField
          label="Teléfono"
          name="empTelefonos"
          value={form.empTelefonos}
          InputProps={{ readOnly: true }}
          onBlur={() => onBlur("empTelefonos")}
          error={touched.empTelefonos && !!errors.empTelefonos}
          helperText={touched.empTelefonos && errors.empTelefonos}
          fullWidth
          disabled={!nonCuitEnabled}
        />

        <TextField
          label="Email"
          name="empEmail"
          value={form.empEmail}
          InputProps={{ readOnly: true }}
          onBlur={() => onBlur("empEmail")}
          error={touched.empEmail && !!errors.empEmail}
          helperText={touched.empEmail && errors.empEmail}
          fullWidth
          disabled={!nonCuitEnabled}
        />
      </div>
    </div>
  );
};

export default DatosEmpleador;