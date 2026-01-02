"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { SelectChangeEvent } from "@mui/material/Select";
import styles from "../denuncias.module.css";
import {
  DenunciaFormData,
  COLORES,
  TIPOS_TRASLADO,
  PrestadorResponse,
} from "../types/tDenuncias";
import Formato from "@/utils/Formato";
import ArtAPI, { formatEstablecimientoLabel } from "@/data/artAPI";
import type { ApiEstablecimientoEmpresa } from "@/app/inicio/empleador/formularioRGRL/types/rgrl";

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
  isEditing,
  onTextFieldChange,
  onSelectChange,
  onBlur,
}) => {

  const onlyDigits = (v?: string) => (v ?? "").replace(/\D/g, "");

  // Estado de carga para búsqueda de Prestador Inicial por CUIT
  const [prestadorLoading, setPrestadorLoading] = useState(false);
  const lastPrestadorCuitRef = useRef<string>("");

  // Formateo inicial de CUITs si vienen desde la base (modo edición)
  const prestadorCuitInitialFormattedRef = useRef(false);
  useEffect(() => {
    if (prestadorCuitInitialFormattedRef.current) return;
    const digits = onlyDigits(String(form.prestadorInicialCuit || ""));
    if (digits.length === 11) {
      try {
        const formatted = Formato.CUIP(digits);
        if (formatted && formatted !== String(form.prestadorInicialCuit || "")) {
          const synthetic = { target: { name: 'prestadorInicialCuit', value: formatted } } as any;
          onTextFieldChange(synthetic);
        }
      } catch (err) {
        // ignore
      }
    }
    prestadorCuitInitialFormattedRef.current = true;
  }, [form.prestadorInicialCuit]);

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

  // Establecimientos por CUIT
  const [establecimientos, setEstablecimientos] = useState<ApiEstablecimientoEmpresa[]>([]);
  const [establecimientosLoading, setEstablecimientosLoading] = useState(false);
  const [selectedEstablecimiento, setSelectedEstablecimiento] = useState<ApiEstablecimientoEmpresa | null>(null);

  // Datos ROAM
  const { data: roamList } = ArtAPI.useGetRefRoam();
  // Prestadores (CUIT - Razón Social) para Autocomplete de traslado
  const { data: refPrestadores } = ArtAPI.useGetRefPrestadores();
  const prestadoresOptions = Array.isArray(refPrestadores) ? refPrestadores : [];

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
  
  // Autocompletar Razón Social Prestador al ingresar 11 dígitos de CUIT
  useEffect(() => {
    const digits = onlyDigits(String(form.prestadorInicialCuit || ""));
    if (isDisabled) return;
    if (digits.length !== 11) return;
    if (lastPrestadorCuitRef.current === digits) return;

    const fetchPrestador = async () => {
      try {
        setPrestadorLoading(true);
        const data: PrestadorResponse = await ArtAPI.getPrestador({ CUIT: Number(digits) });
        if (!data) return;
        const fantasia = data.razonSocial ?? "";
        const synthetic = { target: { name: "prestadorInicialRazonSocial", value: fantasia } } as any;
        onTextFieldChange(synthetic);
        lastPrestadorCuitRef.current = digits;
      } catch (_err) {
        // Silenciar errores (no encontrado u otros)
      } finally {
        setPrestadorLoading(false);
      }
    };

    fetchPrestador();
  }, [form.prestadorInicialCuit, isDisabled, isEditing]);

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

  // Autoselección de ROAM Descripción según ROAM Nro (match por 'interno')
  useEffect(() => {
    if (isDisabled) return;
    const nro = onlyDigits(String(form.roamNro || ""));
    const list: any[] = (roamList || []) as any[];

    if (!nro) {
      if (form.roamDescripcion) {
        const synthetic = { target: { name: "roamDescripcion", value: "" } } as any;
        onTextFieldChange(synthetic);
      }
      return;
    }

    const match = list.find((r: any) => String(r?.interno || "") === nro);
    const desc = match?.roamDetalle ? String(match.roamDetalle) : "";
    if (desc && form.roamDescripcion !== desc) {
      const synthetic = { target: { name: "roamDescripcion", value: desc } } as any;
      onTextFieldChange(synthetic);
    }
  }, [form.roamNro, roamList, isDisabled]);

  //Condicion para habilitar campos roan
  const roamEnabled = !isDisabled && String(form.roam) === "Si";
  return (
    <>
      {/* Estado del Trabajador */}
      <div className={styles.formSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          Estado del Trabajador
        </Typography>

        <div className={styles.formRow}>
          <FormControl
            fullWidth
            required={!isDisabled}
            error={touched.estaConsciente && !!errors.estaConsciente}
            disabled={isDisabled}
          >
            <InputLabel>¿Está Consciente?</InputLabel>
            <Select
              name="estaConsciente"
              value={form.estaConsciente}
              label="¿Está Consciente?"
              onChange={onSelectChange}
              onBlur={() => onBlur("estaConsciente")}
            >
              <MenuItem value="Ignora">Ignora</MenuItem>
              <MenuItem value="Si">Sí</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
            {touched.estaConsciente && errors.estaConsciente && (
              <Typography
                variant="caption"
                color="error"
                className={styles.captionNote}
              >
                {errors.estaConsciente}
              </Typography>
            )}
          </FormControl>

          <FormControl
            fullWidth
            required={!isDisabled}
            error={touched.color && !!errors.color}
            disabled={isDisabled}
          >
            <InputLabel>Color</InputLabel>
            <Select
              name="color"
              value={form.color}
              label="Color"
              onChange={onSelectChange}
              onBlur={() => onBlur("color")}
            >
              {COLORES.map((color) => (
                <MenuItem key={color.value} value={color.value}>
                  {color.label}
                </MenuItem>
              ))}
            </Select>
            {touched.color && errors.color && (
              <Typography
                variant="caption"
                color="error"
                className={styles.captionNote}
              >
                {errors.color}
              </Typography>
            )}
          </FormControl>

          <FormControl
            fullWidth
            required={!isDisabled}
            error={touched.habla && !!errors.habla}
            disabled={isDisabled}
          >
            <InputLabel>¿Habla?</InputLabel>
            <Select
              name="habla"
              value={form.habla}
              label="¿Habla?"
              onChange={onSelectChange}
              onBlur={() => onBlur("habla")}
            >
              <MenuItem value="Ignora">Ignora</MenuItem>
              <MenuItem value="Si">Sí</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
            {touched.habla && errors.habla && (
              <Typography
                variant="caption"
                color="error"
                className={styles.captionNote}
              >
                {errors.habla}
              </Typography>
            )}
          </FormControl>

          <FormControl
            fullWidth
            required={!isDisabled}
            error={touched.gravedad && !!errors.gravedad}
            disabled={isDisabled}
          >
            <InputLabel>Gravedad</InputLabel>
            <Select
              name="gravedad"
              value={form.gravedad}
              label="Gravedad"
              onChange={onSelectChange}
              onBlur={() => onBlur("gravedad")}
            >
              <MenuItem value="Ignora">Ignora</MenuItem>
              <MenuItem value="Leve">Leve</MenuItem>
              <MenuItem value="Grave">Grave</MenuItem>
              <MenuItem value="Critico">Crítico</MenuItem>
            </Select>
            {touched.gravedad && errors.gravedad && (
              <Typography
                variant="caption"
                color="error"
                className={styles.captionNote}
              >
                {errors.gravedad}
              </Typography>
            )}
          </FormControl>

          <FormControl
            fullWidth
            required={!isDisabled}
            error={touched.respira && !!errors.respira}
            disabled={isDisabled}
          >
            <InputLabel>¿Respira?</InputLabel>
            <Select
              name="respira"
              value={form.respira}
              label="¿Respira?"
              onChange={onSelectChange}
              onBlur={() => onBlur("respira")}
            >
              <MenuItem value="Ignora">Ignora</MenuItem>
              <MenuItem value="Si">Sí</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
            {touched.respira && errors.respira && (
              <Typography
                variant="caption"
                color="error"
                className={styles.captionNote}
              >
                {errors.respira}
              </Typography>
            )}
          </FormControl>
        </div>

        <div className={styles.formRow}>
          <TextField
            label="Observaciones"
            name="observaciones"
            value={form.observaciones}
            onChange={onTextFieldChange}
            fullWidth
            disabled={isDisabled}
            multiline
            rows={3}
            placeholder="Observaciones del estado del trabajador"
          />
        </div>

        <div className={styles.formRow}>
          <FormControl
            fullWidth
            required={!isDisabled}
            error={touched.tieneHemorragia && !!errors.tieneHemorragia}
            disabled={isDisabled}
          >
            <InputLabel>¿Tiene Hemorragia?</InputLabel>
            <Select
              name="tieneHemorragia"
              value={form.tieneHemorragia}
              label="¿Tiene Hemorragia?"
              onChange={onSelectChange}
              onBlur={() => onBlur("tieneHemorragia")}
            >
              <MenuItem value="Ignora">Ignora</MenuItem>
              <MenuItem value="Si">Sí</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
            {touched.tieneHemorragia && errors.tieneHemorragia && (
              <Typography
                variant="caption"
                color="error"
                className={styles.captionNote}
              >
                {errors.tieneHemorragia}
              </Typography>
            )}
          </FormControl>

          <FormControl
            fullWidth
            required={!isDisabled}
            error={touched.contextoDenuncia && !!errors.contextoDenuncia}
            disabled={isDisabled}
          >
            <InputLabel>¿Contexto de Riesgo?</InputLabel>
            <Select
              name="contextoDenuncia"
              value={form.contextoDenuncia}
              label="Contexto Denuncia"
              onChange={onSelectChange}
              onBlur={() => onBlur("contextoDenuncia")}
            >
              <MenuItem value="Ignora">Si</MenuItem>
              <MenuItem value="Urgente">No</MenuItem>
              <MenuItem value="Normal">Ignora</MenuItem>
            </Select>
            {touched.contextoDenuncia && errors.contextoDenuncia && (
              <Typography
                variant="caption"
                color="error"
                className={styles.captionNote}
              >
                {errors.contextoDenuncia}
              </Typography>
            )}
          </FormControl>
        </div>
      </div>

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
              required={!isDisabled}
              disabled={isDisabled}
              placeholder="CUIT del establecimiento"
            />

            <Autocomplete
              className={styles.wideField}
              disabled={isDisabled || establecimientos.length === 0}
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

      {/* ROAM */}
      <div className={styles.formSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          ROAM
        </Typography>

        <div className={styles.formRow}>
          <FormControl fullWidth disabled={isDisabled}>
            <InputLabel>ROAM</InputLabel>
            <Select
              name="roam"
              value={form.roam}
              label="ROAM"
              onChange={onSelectChange}
            >
              <MenuItem value="No">No</MenuItem>
              <MenuItem value="Si">Sí</MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            className={`${styles.wideField} ${!roamEnabled ? styles.disabledOpacity : ''}`}
            disabled={!roamEnabled}
            options={(roamList || []) as any[]}
            getOptionLabel={(option: any) => String(option?.roamDetalle || "")}
            isOptionEqualToValue={(opt: any, val: any) => String(opt?.interno) === String(val?.interno)}
            value={(roamList || []).find((r: any) => String(r?.roamDetalle || "") === String(form.roamDescripcion || "")) || null}
            onChange={(_e, newValue: any) => {
              const desc = String(newValue?.roamDetalle || "");
              const interno = newValue?.interno != null ? String(newValue.interno) : "";
              const e1 = { target: { name: "roamDescripcion", value: desc } } as any;
              onTextFieldChange(e1);
              // Setear ROAM Nro al interno (y que no se pueda editar luego)
              const e2 = { target: { name: "roamNro", value: interno } } as any;
              onTextFieldChange(e2);
            }}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label="ROAM Descripción"
                placeholder="Buscar ROAM"
                onBlur={() => onBlur("roamDescripcion")}
                fullWidth
              />
            )}
          />

          <TextField
            label="ROAM Nro."
            name="roamNro"
            value={form.roamNro}
            onChange={numericChange("roamNro")}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            fullWidth
            disabled={!roamEnabled}
            className={!roamEnabled ? styles.disabledOpacity : undefined}
            placeholder="Número ROAM"
          />

          <TextField
            label="ROAM Año"
            name="roamAno"
            value={form.roamAno}
            onChange={numericChange("roamAno")}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            fullWidth
            disabled={!roamEnabled}
            className={!roamEnabled ? styles.disabledOpacity : undefined}
            placeholder="Año ROAM"
          />

          <TextField
            label="ROAM Código"
            name="roamCodigo"
            value={form.roamCodigo}
            onChange={onTextFieldChange}
            fullWidth
            disabled={!roamEnabled}
            className={!roamEnabled ? styles.disabledOpacity : undefined}
            placeholder="Código ROAM"
          />

        </div>
      </div>

      {/* Tipo de Traslado */}
      <div className={styles.formSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          Tipo de Traslado
        </Typography>

        <div className={styles.formRow}>
          <FormControl fullWidth disabled={isDisabled}>
            <InputLabel>Tipo Traslado</InputLabel>
            <Select
              name="tipoTraslado"
              value={form.tipoTraslado}
              label="Tipo Traslado"
              onChange={onSelectChange}
            >
              {TIPOS_TRASLADO.map((tipo) => (
                <MenuItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            fullWidth
            disabled={isDisabled}
            options={prestadoresOptions}
            getOptionLabel={(opt: any) => {
              const cuit = opt?.cuit != null ? String(opt.cuit) : '';
              const rs = String(opt?.razonSocial ?? '');
              const cuitFmt = cuit ? Formato.CUIP(cuit) : '';
              return cuitFmt ? `${cuitFmt} - ${rs}` : rs;
            }}
            isOptionEqualToValue={(opt: any, val: any) => String(opt?.cuit) === String(val?.cuit)}
            value={prestadoresOptions.find((p: any) => String(p?.razonSocial ?? '') === String(form.prestadorTraslado ?? '')) ?? null}
            onChange={(_e, value: any) => {
              const rs = value ? String(value.razonSocial ?? '') : '';
              const synthetic = { target: { name: 'prestadorTraslado', value: rs } } as any;
              onTextFieldChange(synthetic);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Prestador Traslado"
                placeholder="Seleccione prestador"
                error={touched.prestadorTraslado && !!errors.prestadorTraslado}
                helperText={touched.prestadorTraslado && errors.prestadorTraslado}
                onBlur={() => onBlur('prestadorTraslado')}
              />
            )}
          />
        </div>
      </div>

      {/* Prestador Inicial */}
      <div className={styles.formSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          Prestador Inicial
        </Typography>

        <div className={styles.formRow}>
          <TextField
            label="CUIT Prestador Inicial"
            name="prestadorInicialCuit"
            value={form.prestadorInicialCuit}
            onChange={numericChange("prestadorInicialCuit", { format: (d) => Formato.CUIP(d), formatWhenLen: 11, maxDigits: 11 })}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            onBlur={() => onBlur("prestadorInicialCuit")}
            error={
              touched.prestadorInicialCuit && !!errors.prestadorInicialCuit
            }
            helperText={
              prestadorLoading
                ? "Buscando prestador inicial..."
                : touched.prestadorInicialCuit
                ? errors.prestadorInicialCuit
                : undefined
            }
            fullWidth
            required={!isDisabled}
            disabled={isDisabled}
            placeholder="CUIT del prestador inicial"
          />

          <TextField
            label="Razón Social Prestador"
            name="prestadorInicialRazonSocial"
            value={form.prestadorInicialRazonSocial}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("prestadorInicialRazonSocial")}
            InputProps={{ readOnly: true }}
            error={
              touched.prestadorInicialRazonSocial &&
              !!errors.prestadorInicialRazonSocial
            }
            helperText={
              touched.prestadorInicialRazonSocial &&
              errors.prestadorInicialRazonSocial
            }
            fullWidth
            required={!isDisabled}
            disabled={isDisabled}
            placeholder="Razón social del prestador"
          />
        </div>
      </div>
    </>
  );
};

export default DatosSiniestro;
