import React, { useEffect, useRef } from "react";
import { TextField, Typography } from "@mui/material";
import styles from "../denuncias.module.css";
import type { DatosEmpleadorProps } from "../types/tDenuncias";
import Formato from "@/utils/Formato";
import { useAuth } from "@/data/AuthContext";
import CustomSelectSearch from "@/utils/ui/form/CustomSelectSearch";
import { useEmpresasStore } from "@/data/empresasStore";
import { Empresa } from "@/data/authAPI";

const DatosEmpleador: React.FC<DatosEmpleadorProps> = ({
  form,
  errors,
  touched,
  isDisabled,
  onTextFieldChange,
  onBlur,
}) => {
  const { user, hasTask } = useAuth();
  const canRealizaDenuncias = hasTask("Denuncia_Formulario_RealizaDenuncias");

  const empresaId = Number((user as any)?.empresaId ?? 0);
  const isEmpleador = empresaId > 0;
  const isAdmin = (String(user?.rol || '').toLowerCase() === 'administrador');

  const lockAllFields = isDisabled || (isEmpleador && !canRealizaDenuncias);
  const lockNonCuitFields = !isEmpleador && !isAdmin;
  const nonCuitLocked = lockAllFields || lockNonCuitFields;
  const nonCuitEnabled = !nonCuitLocked;

  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();

  const empresaSeleccionada = empresas.find(e => {
    const digits = String((e as any)?.cuit ?? '').replace(/\D/g, '');
    return digits === (form.empCuit ?? '').replace(/\D/g, '');
  }) ?? null;

  const handleEmpresaChange = (_ev: React.SyntheticEvent, val: Empresa | null) => {
    const cuit = val ? String((val as any)?.cuit ?? '') : '';
    const digits = cuit.replace(/\D/g, '');
    const formatted = digits.length === 11 ? Formato.CUIP(digits) : digits;
    const synthetic = { target: { name: 'empCuit', value: formatted } } as any;
    onTextFieldChange(synthetic);
  };

  const onlyDigits = (v?: string) => (v ?? "").replace(/\D/g, "");


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
    if (canRealizaDenuncias) return;
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
  }, [user, form.empCuit, onTextFieldChange, canRealizaDenuncias]);

  return (
    <div className={styles.formSection}>
      <Typography variant="h5" component="h2" className={styles.sectionTitle}>
        Datos del Empleador
      </Typography>

      <div className={styles.formRow}>
        <CustomSelectSearch<Empresa>
          options={empresas}
          getOptionLabel={(e) => {
            const cuitFmt = Formato.CUIP((e as any)?.cuit);
            return `${cuitFmt} - ${(e as any)?.razonSocial ?? ''}`;
          }}
          value={empresaSeleccionada}
          onChange={handleEmpresaChange}
          label="Empresa (CUIT)"
          loading={isLoadingEmpresas}
          loadingText="Cargando empresas..."
          noOptionsText="No se encontraron empresas"
          disabled={isDisabled || isLoadingEmpresas}
          className={styles.formRowWide}
        />

        <TextField
          label="Póliza"
          name="empPoliza"
          value={form.empPoliza}
          onBlur={() => onBlur("empPoliza")}
          InputProps={{ readOnly: true }}
          error={touched.empPoliza && !!errors.empPoliza}
          helperText={touched.empPoliza && errors.empPoliza}
          className={styles.smallField}
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
