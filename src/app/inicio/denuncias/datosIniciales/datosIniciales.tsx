import React , { useState, useRef } from "react";
import {
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Autocomplete,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import styles from "../denuncias.module.css";
import CustomButton from "@/utils/ui/button/CustomButton";
import ArtAPI from "@/data/artAPI";
import Formato from "@/utils/Formato";
import {
  DenunciaFormData,
  RELACION_ACCIDENTADO,
  DatosInicialesProps,
} from "../types/tDenuncias";
import { FaSearch } from "react-icons/fa";


const DatosIniciales: React.FC<DatosInicialesProps> = ({
  form,
  errors,
  touched,
  isDisabled,
  isEditing,
  onTextFieldChange,
  onSelectChange,
  onBlur,
}) => {


  // CP que se usó para buscar localidades
  const [cpBuscado, setCpBuscado] = useState<number | null>(null);

  // Buscador para localidad (campo de búsqueda)
  const [busqueda, setBusqueda] = useState<string>("");
  // Valor usado cuando se dispara la búsqueda por nombre (lupa)
  const [nombreBuscado, setNombreBuscado] = useState<string | null>(null);

  // Llamamos al hook SOLO cuando hay cpBuscado (búsqueda por CP desde el botón/lupa)
  const { data: localidadesData, isValidating: isValidatingCP } = ArtAPI.useGetLocalidadesbyCP(
    cpBuscado ? { CodPostal: cpBuscado } : {}
  );

  const localidadesFromCpButton: any[] = Array.isArray(localidadesData)
    ? localidadesData
    : [];

  // Hooks para búsquedas disparadas por el botón (nombreBuscado) o por CP (cpBuscado)
  const { data: localidadesByNombre, isValidating: isValidatingNombre } = ArtAPI.useGetLocalidadesbyNombre(
    nombreBuscado ? { Nombre: nombreBuscado } : {}
  );

  // Si al editar ya viene un código de localidad, traemos esa localidad por código
  const codigoLocalidadDigits = (form.codLocalidad ?? "").replace(/\D/g, "");
  const codigoLocalidadNum = codigoLocalidadDigits ? Number(codigoLocalidadDigits) : 0;
  const { data: localidadCodigoData } = ArtAPI.useGetLocalidadesbyCodigo(
    codigoLocalidadNum ? { Codigo: codigoLocalidadNum } : {}
  );
  const localidadCodigoItem = Array.isArray(localidadCodigoData)
    ? localidadCodigoData[0]
    : localidadCodigoData || null;
  // Determinar de dónde tomar las opciones según la búsqueda disparada
  let localidadesOptions: any[] = [];
  if (nombreBuscado) {
    localidadesOptions = Array.isArray(localidadesByNombre) ? localidadesByNombre : [];
  } else {
    localidadesOptions = localidadesFromCpButton.length
      ? localidadesFromCpButton
      : localidadCodigoItem
      ? [localidadCodigoItem]
      : [];
  }

  const isValidating = isValidatingNombre || isValidatingCP;

  const telInputRef = useRef<HTMLInputElement | null>(null);

  // En edición: autocompletar provincia, CP y nombre de localidad
  React.useEffect(() => {
    if (!isEditing || isDisabled) return;
    if (!localidadCodigoItem) return;

    const provincia = String(
      localidadCodigoItem?.litProvincia ?? localidadCodigoItem?.provincia ?? ""
    );
    const codigoPostal = String(
      localidadCodigoItem?.codPostal ?? localidadCodigoItem?.CodPostal ?? ""
    );
    const nombreLocalidad = String(
      localidadCodigoItem?.nombreCompleto ?? localidadCodigoItem?.nombre ?? ""
    );

    // Actualizar solo si están vacíos o distintos
    if (provincia && String(form.litProvincia ?? "").trim() !== provincia) {
      const syntheticProvincia = {
        target: { name: "litProvincia", value: provincia },
      } as any;
      onTextFieldChange(syntheticProvincia);
    }

    if (
      codigoPostal && String(form.codPostal ?? "").trim() !== codigoPostal
    ) {
      const syntheticPostal = {
        target: { name: "codPostal", value: codigoPostal },
      } as any;
      onTextFieldChange(syntheticPostal);
    }

    if (
      nombreLocalidad &&
      String(form.localidadAccidente ?? "").trim() !== nombreLocalidad
    ) {
      const syntheticLocalidad = {
        target: { name: "localidadAccidente", value: nombreLocalidad },
      } as any;
      onTextFieldChange(syntheticLocalidad);
    }
  }, [isEditing, isDisabled, localidadCodigoItem, form.litProvincia, form.codPostal, form.localidadAccidente, onTextFieldChange]);

  const handleTelefonosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value ?? "";
    const formatted = Formato.Telefono(raw);
    const synthetic = {
      target: {
        name: e.target.name,
        value: formatted,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onTextFieldChange(synthetic);
    // mover caret al final tras aplicar formato
    requestAnimationFrame(() => {
      const el = telInputRef.current;
      if (el) {
        const len = (formatted ?? "").length;
        try {
          el.setSelectionRange(len, len);
        } catch (err) {
          // ignore
        }
      }
    });
  };

  const handleTelefonosBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = Formato.Telefono(e.target.value ?? "");
    const synthetic = {
      target: {
        name: e.target.name,
        value: formatted,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onTextFieldChange(synthetic);
    onBlur("telefonos");
  };

  const handleBuscarLocalidades = () => {
    const text = busqueda.trim();
    if (text) {
      // Si el campo contiene sólo números, buscar por CP; si no, buscar por nombre
      if (/^\d+$/.test(text)) {
        const cp = Number(text);
        setNombreBuscado(null);
        setCpBuscado(cp);
      } else {
        setCpBuscado(null);
        setNombreBuscado(text);
      }
      return;
    }

    // Si no hay texto en el campo de búsqueda, usar el CP del formulario como antes
    const cp = Number(form.codPostal);
    if (!cp || Number.isNaN(cp)) {
      return;
    }
    setNombreBuscado(null);
    setCpBuscado(cp);
  };

  // En modo edición: si 'apellidoNombres' viene vacío pero tenemos 'nombre', usarlo como fallback
  React.useEffect(() => {
    if (!isEditing || isDisabled) return;
    const actual = String(form.apellidoNombres || '').trim();
    if (actual) return;
    const fallback = String(form.nombre || '').trim();
    if (!fallback) return;
    const synthetic = { target: { name: 'apellidoNombres', value: fallback } } as any;
    onTextFieldChange(synthetic);
  }, [isEditing, isDisabled, form.apellidoNombres, form.nombre, onTextFieldChange]);

  // Si el tipo de denuncia es "Enfermedad Profesional", bloquear campos relacionados con "Accidente de Trabajo"
  const bloquearPorEnfermedad = String(form.tipoDenuncia ?? "") === "Enfermedad";

  const tipoDenunciaKey = String(form.tipoDenuncia ?? "");
  const tipoSiniestroOptions = React.useMemo(() => {
    if (tipoDenunciaKey === "AccidenteTrabajo") {
      return ["Accidente Trabajo", "Accidente In Itinere", "Reingreso"];
    }
    if (tipoDenunciaKey === "Enfermedad") {
      return ["Enfermedad Profesional", "Reingreso"];
    }
    return [] as string[];
  }, [tipoDenunciaKey]);

  // Si cambia tipoDenuncia y el tipoSiniestro actual no aplica, limpiarlo
  React.useEffect(() => {
    const current = String(form.tipoSiniestro ?? "");
    if (!current) return;
    if (tipoSiniestroOptions.length === 0 || !tipoSiniestroOptions.includes(current)) {
      const syntheticClear = { target: { name: "tipoSiniestro", value: "" } } as any;
      onTextFieldChange(syntheticClear);
    }
  }, [tipoDenunciaKey, form.tipoSiniestro, tipoSiniestroOptions, onTextFieldChange]);

  return (
    <>
      {/* Contacto Inicial */}
      <div className={styles.formSection}>
        <Typography variant="h5" component="h2" className={styles.sectionTitle}>
          Contacto Inicial
        </Typography>

        <div className={styles.formRow}>
          <TextField
            label="Teléfonos"
            name="telefonos"
            inputRef={telInputRef}
            value={form.telefonos}
            onChange={handleTelefonosChange}
            onBlur={handleTelefonosBlur}
            error={touched.telefonos && !!errors.telefonos}
            helperText={touched.telefonos && errors.telefonos}
            fullWidth
            required={!isDisabled}
            disabled={isDisabled}
            placeholder="Ingrese teléfono"
          />
          <TextField
            label="Apellido y Nombres"
            name="apellidoNombres"
            value={form.apellidoNombres}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("apellidoNombres")}
            error={touched.apellidoNombres && !!errors.apellidoNombres}
            helperText={touched.apellidoNombres && errors.apellidoNombres}
            fullWidth
            required={!isDisabled}
            disabled={isDisabled}
            placeholder="Apellido y Nombres"
          />
          <FormControl
            fullWidth
            required={!isDisabled && !bloquearPorEnfermedad}
            error={touched.relacionAccidentado && !!errors.relacionAccidentado}
            disabled={isDisabled || bloquearPorEnfermedad}
            className={bloquearPorEnfermedad ? styles.disabledOpacity : undefined}
          >
            <InputLabel>Relación c/accidentado</InputLabel>
            <Select
              name="relacionAccidentado"
              value={form.relacionAccidentado}
              label="Relación c/accidentado"
              onChange={onSelectChange}
              onBlur={() => onBlur("relacionAccidentado")}
            >
              {RELACION_ACCIDENTADO.map((relacion) => (
                <MenuItem key={relacion.value} value={relacion.value}>
                  {relacion.label}
                </MenuItem>
              ))}
            </Select>
            {touched.relacionAccidentado && errors.relacionAccidentado && (
              <Typography
                variant="caption"
                color="error"
                className={styles.captionNote}
              >
                {errors.relacionAccidentado}
              </Typography>
            )}
          </FormControl>
        </div>
      </div>

      {/* Información del Siniestro */}
      <div className={styles.formSection}>
        <Typography variant="h5" component="h2" className={styles.sectionTitle}>
          Información del Siniestro
        </Typography>

        <div className={styles.formRow}>
          <FormControl
            fullWidth
            required={!isDisabled}
            error={touched.tipoDenuncia && !!errors.tipoDenuncia}
            disabled={isDisabled}
          >
            <InputLabel>Tipo Denuncia</InputLabel>
            <Select
              name="tipoDenuncia"
              value={form.tipoDenuncia}
              label="Tipo Denuncia"
              onChange={onSelectChange}
              onBlur={() => onBlur("tipoDenuncia")}
            >
              <MenuItem value="AccidenteTrabajo">
                Accidente de Trabajo
              </MenuItem>
              <MenuItem value="Enfermedad">Enfermedad Profesional</MenuItem>
            </Select>
            {touched.tipoDenuncia && errors.tipoDenuncia && (
              <Typography
                variant="caption"
                color="error"
                className={styles.captionNote}
              >
                {errors.tipoDenuncia}
              </Typography>
            )}
          </FormControl>

          <FormControl
            fullWidth
            error={touched.tipoSiniestro && !!errors.tipoSiniestro}
            disabled={isDisabled || !tipoDenunciaKey}
          >
            <InputLabel>Tipo Siniestro</InputLabel>
            <Select
              name="tipoSiniestro"
              value={form.tipoSiniestro}
              label="Tipo Siniestro"
              onChange={onSelectChange}
              onBlur={() => onBlur("tipoSiniestro")}
            >
              {tipoSiniestroOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
            {touched.tipoSiniestro && errors.tipoSiniestro && (
              <Typography
                variant="caption"
                color="error"
                className={styles.captionNote}
              >
                {errors.tipoSiniestro}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth disabled={isDisabled || bloquearPorEnfermedad} className={bloquearPorEnfermedad ? styles.disabledOpacity : undefined}>
            <InputLabel>¿En Vía Pública?</InputLabel>
            <Select
              name="enViaPublica"
              value={form.enViaPublica}
              label="¿En Vía Pública?"
              onChange={onSelectChange}
            >
              <MenuItem value="Si">Sí</MenuItem>
              <MenuItem value="No">No</MenuItem>
            </Select>
          </FormControl>
        </div>
      </div>

      {/* Accidente de Trabajo */}
      <div className={styles.formSection}>
        <Typography variant="h5" component="h2" className={styles.sectionTitle}>
          Accidente de Trabajo
        </Typography>

        <div className={styles.formRow}>
          <TextField
            label="Fecha Ocurrencia"
            name="fechaOcurrencia"
            type="date"
            value={form.fechaOcurrencia}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("fechaOcurrencia")}
            error={touched.fechaOcurrencia && !!errors.fechaOcurrencia}
            helperText={touched.fechaOcurrencia && errors.fechaOcurrencia}
            fullWidth
            required={!isDisabled && !bloquearPorEnfermedad}
            disabled={isDisabled}
            InputProps={{ readOnly: bloquearPorEnfermedad || undefined }}
            className={bloquearPorEnfermedad ? styles.disabledOpacity : undefined}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Hora"
            name="hora"
            type="time"
            value={form.hora}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("hora")}
            error={touched.hora && !!errors.hora}
            helperText={touched.hora && errors.hora}
            fullWidth
            required={!isDisabled && !bloquearPorEnfermedad}
            disabled={isDisabled}
            InputProps={{ readOnly: bloquearPorEnfermedad || undefined }}
            className={bloquearPorEnfermedad ? styles.disabledOpacity : undefined}
            InputLabelProps={{ shrink: true }}
          />
        </div>

        <div className={styles.formRow}>
          <TextField
            label="Calle"
            name="calle"
            value={form.calle}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("calle")}
            error={touched.calle && !!errors.calle}
            helperText={touched.calle && errors.calle}
            fullWidth
            required={!isDisabled && !bloquearPorEnfermedad}
            disabled={isDisabled}
            InputProps={{ readOnly: bloquearPorEnfermedad || undefined }}
            className={`${styles.halfField} ${bloquearPorEnfermedad ? styles.disabledOpacity : ''}`}
            placeholder="Nombre de la calle"
          />
          <div className={`${styles.halfField} ${styles.inlineGroup}`}>
            <TextField
              label="Nro."
              name="nro"
              value={form.nro}
              onChange={onTextFieldChange}
              fullWidth
              disabled={isDisabled}
              InputProps={{ readOnly: bloquearPorEnfermedad || undefined }}
              className={bloquearPorEnfermedad ? styles.disabledOpacity : undefined}
              placeholder="Número"
            />
            <TextField
              label="Piso"
              name="piso"
              value={form.piso}
              onChange={onTextFieldChange}
              fullWidth
              disabled={isDisabled}
              InputProps={{ readOnly: bloquearPorEnfermedad || undefined }}
              className={bloquearPorEnfermedad ? styles.disabledOpacity : undefined}
              placeholder="Piso"
            />
            <TextField
              label="Departamento"
              name="dpto"
              value={form.dpto}
              onChange={onTextFieldChange}
              fullWidth
              disabled={isDisabled}
              InputProps={{ readOnly: bloquearPorEnfermedad || undefined }}
              className={bloquearPorEnfermedad ? styles.disabledOpacity : undefined}
              placeholder="Depto"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <TextField
            label="Entre Calle 1"
            name="entreCalle"
            value={form.entreCalle}
            onChange={onTextFieldChange}
            fullWidth
            disabled={isDisabled}
            InputProps={{ readOnly: bloquearPorEnfermedad || undefined }}
            className={bloquearPorEnfermedad ? styles.disabledOpacity : undefined}
            placeholder="Entre calle"
          />
          <TextField
            label="Y calle 2"
            name="entreCalleY"
            value={form.entreCalleY}
            onChange={onTextFieldChange}
            fullWidth
            disabled={isDisabled}
            InputProps={{ readOnly: bloquearPorEnfermedad || undefined }}
            className={bloquearPorEnfermedad ? styles.disabledOpacity : undefined}
            placeholder="y calle"
          />
        </div>

        <div className={styles.formRow}>
          <TextField
            label="Descripción"
            name="descripcion"
            value={form.descripcion}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("descripcion")}
            error={touched.descripcion && !!errors.descripcion}
            helperText={touched.descripcion && errors.descripcion}
            fullWidth
            required={!isDisabled}
            disabled={isDisabled}
            multiline
            rows={3}
            placeholder="Descripción del accidente"
          />
        </div>

        <div className={styles.formRow}>
          <TextField
            label="Búsqueda Localidad / C.P."
            name="busqueda"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            fullWidth
            disabled={isDisabled || bloquearPorEnfermedad}
            InputProps={{ readOnly: bloquearPorEnfermedad || undefined }}
            className={`${styles.smallField} ${bloquearPorEnfermedad ? styles.disabledOpacity : ''}`}
            placeholder="Buscar..."
          />

          <CustomButton
            color="primary"
            size="mid"
            className={styles.smallButton}
            // icon={<span>🔍</span>}
            aria-label="buscar localidad"
            onClick={handleBuscarLocalidades}
            disabled={bloquearPorEnfermedad || false}
          >
            <FaSearch />
          </CustomButton>

          <div className={styles.smallField}>
            <Autocomplete
              disabled={isDisabled || bloquearPorEnfermedad}
              className={bloquearPorEnfermedad ? styles.disabledOpacity : undefined}
              options={localidadesOptions}
              getOptionLabel={(opt: any) => String(opt?.nombreCompleto ?? opt?.nombre ?? "")}
              isOptionEqualToValue={(opt: any, val: any) => String(opt?.codigo) === String(val?.codigo)}
              value={localidadesOptions.find((loc) => String(loc.codigo) === String(form.codLocalidad)) ?? null}
              onChange={(_e, newValue: any) => {
                const codigo = newValue ? String(newValue.codigo ?? "") : "";
                const nombre = newValue ? String(newValue.nombreCompleto ?? newValue.nombre ?? "") : "";
                const syntheticSelect = { target: { name: 'codLocalidad', value: codigo } } as any;
                onSelectChange(syntheticSelect);
                const syntheticText = { target: { name: 'localidadAccidente', value: nombre } } as any;
                onTextFieldChange(syntheticText);
                const codigoPostal = newValue ? String(newValue.codPostal ?? newValue.CodPostal ?? "") : "";
                const syntheticPostal = { target: { name: 'codPostal', value: codigoPostal } } as any;
                onTextFieldChange(syntheticPostal);
                const provincia = newValue ? String(newValue.litProvincia ?? newValue.provincia ?? "") : "";
                const syntheticProvincia = { target: { name: 'litProvincia', value: provincia } } as any;
                onTextFieldChange(syntheticProvincia);
              }}
              onBlur={() => onBlur('codLocalidad')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Localidad"
                  placeholder="Seleccione localidad"
                  error={touched.codLocalidad && !!errors.codLocalidad}
                  helperText={touched.codLocalidad && errors.codLocalidad}
                />
              )}
            />

            {isValidating && (
              <Typography
                variant="caption"
                className={styles.captionNote}
              >
                cargando...
              </Typography>
            )}
          </div>

          <TextField
            label="Cód. Postal"
            name="codPostal"
            value={form.codPostal}
            onChange={onTextFieldChange}
            fullWidth
            disabled={isDisabled || bloquearPorEnfermedad}
            InputProps={{ readOnly: true }}
            className={`${styles.smallField} ${bloquearPorEnfermedad ? styles.disabledOpacity : ''}`}
            placeholder="Código postal"
          />

          <TextField
            label="Provincia"
            name="litProvincia"
            value={form.litProvincia}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("litProvincia")}
            fullWidth
            disabled={isDisabled || bloquearPorEnfermedad}
            InputProps={{ readOnly: true }}
            className={`${styles.smallField} ${bloquearPorEnfermedad ? styles.disabledOpacity : ''}`}
            placeholder="Provincia"
          />
        </div>
      </div>
    </>
  );
};

export default DatosIniciales;
