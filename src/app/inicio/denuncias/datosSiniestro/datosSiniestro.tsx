"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  TextField,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { SelectChangeEvent } from "@mui/material/Select";
import styles from "../denuncias.module.css";
import {
  DenunciaFormData,
} from "../types/tDenuncias";
import Formato from "@/utils/Formato";
import { useAuth } from '@/data/AuthContext';
import ArtAPI from "@/data/artAPI";
import type { ApiEstablecimientoEmpresa } from "@/app/inicio/empleador/formularioRGRL/types/rgrl";

const formatEstablecimientoLabel = (est?: Partial<ApiEstablecimientoEmpresa> | null): string => {
  if (!est) return "";
  const nroSucursal = est.nroSucursal;
  const domicilio = `${est.domicilioCalle || ""} ${est.domicilioNro || ""}`.trim();
  const parts: string[] = [];
  if (nroSucursal !== undefined && nroSucursal !== null) parts.push(String(nroSucursal));
  if (domicilio) parts.push(domicilio);
  if (parts.length === 0) return "";
  return `Sucursal: ${parts.join(" - ")}`;
};

type DatosSiniestroProps = {
  form: DenunciaFormData;
  errors: { [K in keyof DenunciaFormData]?: string };
  touched: { [K in keyof DenunciaFormData]?: boolean };
  isDisabled: boolean;
  isEditing?: boolean;
  onTextFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (e: SelectChangeEvent<string>) => void;
  onBlur: (fieldName: keyof DenunciaFormData) => void;
};

const DatosSiniestro: React.FC<DatosSiniestroProps> = ({
  form,
  errors,
  touched,
  isDisabled,
  onTextFieldChange,
  onBlur,
}) => {

  const onlyDigits = (v?: string) => (v ?? "").replace(/\D/g, "");

  const establecimientoCuitInitialFormattedRef = useRef(false);
  useEffect(() => {
    if (establecimientoCuitInitialFormattedRef.current) return;
    const digits = onlyDigits(String(form.establecimientoCuit || ""));
    if (digits.length === 11) {
      try {
        const formatted = Formato.CUIP(digits);
        if (formatted && formatted !== String(form.establecimientoCuit || "")) {
          const synthetic = { target: { name: 'establecimientoCuit', value: formatted } } as any;
          onTextFieldChange(synthetic);
        }
      } catch (err) {
        // ignore
      }
    }
    establecimientoCuitInitialFormattedRef.current = true;
  }, [form.establecimientoCuit]);

  const { user, hasTask } = useAuth();
  const canRealizaDenuncias = hasTask("Denuncia_Formulario_RealizaDenuncias");
  const isUserAdmin = (String(user?.rol || '').toLowerCase() === 'administrador');

  // Establecimientos por CUIT
  const [establecimientos, setEstablecimientos] = useState<ApiEstablecimientoEmpresa[]>([]);
  const [establecimientosLoading, setEstablecimientosLoading] = useState(false);
  const [selectedEstablecimiento, setSelectedEstablecimiento] = useState<ApiEstablecimientoEmpresa | null>(null);
  // Generador de handlers para campos numéricos.
  const numericChange = (
    name: string,
    options?: { format?: (digits: string) => string; formatWhenLen?: number; maxDigits?: number }
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = onlyDigits(e.target.value || "");
    if (options?.maxDigits != null) {
      digits = digits.slice(0, options.maxDigits);
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
      // Ignorar errores de formateo
    }
  };

  // Buscar establecimientos al ingresar 11 dígitos de CUIT de establecimiento
  useEffect(() => {
    const digits = onlyDigits(String(form.establecimientoCuit || ""));
    if (isDisabled) return;

    if (digits.length !== 11) {
      setEstablecimientos([]);
      setSelectedEstablecimiento(null);
      return;
    }

    let cancelled = false;

    const fetchEstablecimientos = async () => {
      try {
        setEstablecimientosLoading(true);
        const cuitNumber = Number(digits);
        if (!cuitNumber) return;
        const list = await ArtAPI.getEstablecimientosEmpresa(cuitNumber);
        if (cancelled) return;
        setEstablecimientos(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) {
          setEstablecimientos([]);
        }
      } finally {
        if (!cancelled) {
          setEstablecimientosLoading(false);
        }
      }
    };

    fetchEstablecimientos();

    return () => {
      cancelled = true;
    };
  }, [form.establecimientoCuit, isDisabled]);

  // Si el usuario no es administrador, fijar CUIT de establecimiento al CUIT de la empresa del usuario (no editable)
  useEffect(() => {
    if (canRealizaDenuncias) return;
    if (isUserAdmin) return;
    if (!user) return;
    const empresaCuitRaw = String(user.empresaCUIT ?? "");
    const digits = empresaCuitRaw.replace(/\D/g, '');
    if (!digits) return;
    try {
      const formatted = Formato.CUIP(digits);
      if (formatted && formatted !== String(form.establecimientoCuit || "")) {
        const synthetic = { target: { name: 'establecimientoCuit', value: formatted } } as any;
        onTextFieldChange(synthetic);
      }
    } catch (err) {
      // ignore
    }
  }, [user?.empresaCUIT, isUserAdmin, canRealizaDenuncias]);

  return (
    <>
      {/* Establecimiento */}
      <div className={styles.formSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          Establecimiento
        </Typography>

          <div className={styles.formRow}>
            <TextField
              label="CUIT Establecimiento"
              name="establecimientoCuit"
              value={form.establecimientoCuit}
              onChange={numericChange("establecimientoCuit", { format: (d) => Formato.CUIP(d), formatWhenLen: 11 })}
              onBlur={() => onBlur("establecimientoCuit")}
              error={touched.establecimientoCuit && !!errors.establecimientoCuit}
              helperText={touched.establecimientoCuit ? errors.establecimientoCuit : undefined}
              fullWidth
              required={!isDisabled && (isUserAdmin || canRealizaDenuncias)}
              disabled={isDisabled || (!isUserAdmin && !canRealizaDenuncias)}
              placeholder="CUIT del establecimiento"
            />

            <Autocomplete
              className={styles.wideField}
              disabled={isDisabled}
              options={establecimientos}
              loading={establecimientosLoading}
              getOptionLabel={(option: ApiEstablecimientoEmpresa) =>
                formatEstablecimientoLabel(option) || option.nombre || ""
              }
              isOptionEqualToValue={(opt: ApiEstablecimientoEmpresa, val: ApiEstablecimientoEmpresa) =>
                opt.interno === val.interno
              }
              value={selectedEstablecimiento}
              onChange={(_e, newValue: ApiEstablecimientoEmpresa | null) => {
                setSelectedEstablecimiento(newValue);
                const nombre = newValue?.nombre ?? "";
                const ciiu = newValue?.ciiu != null ? String(newValue.ciiu) : "";
                const calle = newValue?.domicilioCalle ?? "";
                const numero = newValue?.domicilioNro ?? "";
                const codLocalidad = newValue?.codigo != null ? String(newValue.codigo) : "";
                const codPostal = newValue?.cp != null ? String(newValue.cp) : "";

                const updates: Array<{ name: keyof DenunciaFormData; value: string }> = [
                  { name: "establecimientoNombre", value: nombre },
                  { name: "establecimientoCiiu", value: ciiu },
                  { name: "establecimientoCalle", value: calle },
                  { name: "establecimientoNumero", value: numero },
                  { name: "establecimientoCodLocalidad", value: codLocalidad },
                  { name: "establecimientoCodPostal", value: codPostal },
                ];

                updates.forEach(({ name, value }) => {
                  const evt = { target: { name, value } } as any;
                  onTextFieldChange(evt);
                });

                onBlur("establecimientoNombre");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Establecimiento"
                  error={touched.establecimientoNombre && !!errors.establecimientoNombre}
                  helperText={
                    touched.establecimientoNombre
                      ? errors.establecimientoNombre
                      : undefined
                  }
                  required={!isDisabled}
                  placeholder={
                    establecimientosLoading
                      ? "Buscando establecimientos..."
                      : "Seleccionar establecimiento"
                  }
                  fullWidth
                  onBlur={() => onBlur("establecimientoNombre")}
                />
              )}
            />

            <TextField
              label="CIIU"
              name="establecimientoCiiu"
              value={form.establecimientoCiiu}
              onChange={numericChange("establecimientoCiiu")}
              onBlur={() => onBlur("establecimientoCiiu")}
              error={touched.establecimientoCiiu && !!errors.establecimientoCiiu}
              helperText={touched.establecimientoCiiu ? errors.establecimientoCiiu : undefined}
              fullWidth
              disabled={isDisabled}
              InputProps={{ readOnly: true }}
              placeholder="CIIU"
            />
          </div>

          <div className={styles.formRow}>
            <TextField
              label="Calle"
              name="establecimientoCalle"
              value={form.establecimientoCalle}
              onChange={onTextFieldChange}
              onBlur={() => onBlur("establecimientoCalle")}
              error={touched.establecimientoCalle && !!errors.establecimientoCalle}
              helperText={touched.establecimientoCalle ? errors.establecimientoCalle : undefined}
              fullWidth
              disabled={isDisabled}
              InputProps={{ readOnly: true }}
              placeholder="Calle"
            />

            <TextField
              label="Número"
              name="establecimientoNumero"
              value={form.establecimientoNumero}
              onChange={numericChange("establecimientoNumero")}
              onBlur={() => onBlur("establecimientoNumero")}
              error={touched.establecimientoNumero && !!errors.establecimientoNumero}
              helperText={touched.establecimientoNumero ? errors.establecimientoNumero : undefined}
              fullWidth
              disabled={isDisabled}
              InputProps={{ readOnly: true }}
              placeholder="Número"
            />

            <TextField
              label="Piso"
              name="establecimientoPiso"
              value={form.establecimientoPiso}
              onChange={onTextFieldChange}
              onBlur={() => onBlur("establecimientoPiso")}
              error={touched.establecimientoPiso && !!errors.establecimientoPiso}
              helperText={touched.establecimientoPiso ? errors.establecimientoPiso : undefined}
              fullWidth
              disabled={isDisabled}
              InputProps={{ readOnly: true }}
              placeholder="Piso"
            />

            <TextField
              label="Dpto."
              name="establecimientoDpto"
              value={form.establecimientoDpto}
              onChange={onTextFieldChange}
              onBlur={() => onBlur("establecimientoDpto")}
              error={touched.establecimientoDpto && !!errors.establecimientoDpto}
              helperText={touched.establecimientoDpto ? errors.establecimientoDpto : undefined}
              fullWidth
              disabled={isDisabled}
              InputProps={{ readOnly: true }}
              placeholder="Dpto"
            />
          </div>

          <div className={styles.formRow}>
            <TextField
              label="Código Localidad"
              name="establecimientoCodLocalidad"
              value={form.establecimientoCodLocalidad}
              onChange={onTextFieldChange}
              onBlur={() => onBlur("establecimientoCodLocalidad")}
              error={touched.establecimientoCodLocalidad && !!errors.establecimientoCodLocalidad}
              helperText={touched.establecimientoCodLocalidad ? errors.establecimientoCodLocalidad : undefined}
              fullWidth
              disabled={isDisabled}
              InputProps={{ readOnly: true }}
              placeholder="Código localidad"
            />

            <TextField
              label="Código Postal"
              name="establecimientoCodPostal"
              value={form.establecimientoCodPostal}
              onChange={numericChange("establecimientoCodPostal")}
              onBlur={() => onBlur("establecimientoCodPostal")}
              error={touched.establecimientoCodPostal && !!errors.establecimientoCodPostal}
              helperText={touched.establecimientoCodPostal ? errors.establecimientoCodPostal : undefined}
              fullWidth
              disabled={isDisabled}
              InputProps={{ readOnly: true }}
              placeholder="Código postal"
            />

            <TextField
              label="Teléfono"
              name="establecimientoTelefono"
              value={form.establecimientoTelefono}
              onChange={numericChange("establecimientoTelefono")}
              onBlur={() => onBlur("establecimientoTelefono")}
              error={touched.establecimientoTelefono && !!errors.establecimientoTelefono}
              helperText={touched.establecimientoTelefono ? errors.establecimientoTelefono : undefined}
              fullWidth
              disabled={isDisabled}
              InputProps={{ readOnly: true }}
              placeholder="Teléfono"
            />

            <TextField
              label="Email"
              name="establecimientoEmail"
              value={form.establecimientoEmail}
              onChange={onTextFieldChange}
              onBlur={() => onBlur("establecimientoEmail")}
              error={touched.establecimientoEmail && !!errors.establecimientoEmail}
              helperText={touched.establecimientoEmail ? errors.establecimientoEmail : undefined}
              fullWidth
              disabled={isDisabled}
              InputProps={{ readOnly: true }}
              placeholder="Email"
            />
          </div>
        </div>

    </>
  );
};

export default DatosSiniestro;
