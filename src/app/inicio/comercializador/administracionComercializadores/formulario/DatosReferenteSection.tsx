import {
  TextField,
  Autocomplete,
} from "@mui/material";
import { useEffect, useState } from "react";
import ArtAPI from "@/data/artAPI";
import SrtProvincia from "@/app/inicio/usuarios/interfaces/SrtProvincia";
import styles from "./formulario.module.css";
import {
  DatosReferenteSectionProps,
  SrtLocalidad,
  SrtLocalidadByCodigo,
} from "./types/formulario";

export default function DatosReferenteSection({
  form,
  creationRole = null,
  errors,
  touched,
  isDisabled,
  isCreating,
  isEditing,
  isViewing,
  isGrupoOrganizador,
  isOrganizadorComercializador,
  grupoOptions,
  organizadorOptions,
  selectedGrupoId,
  selectedOrganizadorId,
  onGrupoChange,
  onOrganizadorChange,
  onTextFieldChange,
  onSelectChange,
  onBlur,
}: DatosReferenteSectionProps) {
  const roleKey = String(creationRole ?? form.rol ?? "").toLowerCase();
  const isRoleGrupo = roleKey.includes("grupo");
  const isRoleOrganizador = roleKey.includes("organizador");

  const hideForCreateComercializador = isCreating && roleKey === "comercializador";
  const showGrupoAutocomplete = !hideForCreateComercializador && !((isCreating || isEditing) && isRoleGrupo);
  const showOrganizadorAutocomplete =
    !hideForCreateComercializador && !(((isCreating || isEditing || isViewing) && isRoleOrganizador) || (isEditing && isRoleGrupo));

  const [provincias, setProvincias] = useState<SrtProvincia[]>([]);
  const [provinciaId, setProvinciaId] = useState<number | null>(null);
  const [localidadesSrt, setLocalidadesSrt] = useState<SrtLocalidad[]>([]);
  const [provinciaInput, setProvinciaInput] = useState<string>(String(form.domicilioProvincia ?? ""));
  const [localidadInput, setLocalidadInput] = useState<string>(String(form.domicilioLocalidad ?? ""));

  const setField = (name: string, value: string) => {
    onTextFieldChange({ target: { name, value } } as React.ChangeEvent<HTMLInputElement>);
  };

  useEffect(() => {
    ArtAPI.getsrtProvinciaURL().then(setProvincias);
  }, []);

  useEffect(() => {
    if (provinciaId == null) return;
    ArtAPI.getLocalidadesSRT({ provinciaId }).then(setLocalidadesSrt);
  }, [provinciaId]);

  useEffect(() => {
    if (!isEditing && !isViewing) return;
    const codigo = String(form.domicilioCodLocalidad ?? "");
    if (!codigo) return;

    ArtAPI.getLocalidadById({ codigo }).then((loc: SrtLocalidadByCodigo) => {
      const localidad = `${loc.codPostal} - ${loc.nombre}`;
      setField("domicilioProvincia", loc.nombreProvincia);
      setField("domicilioLocalidad", localidad);
      setField("domicilioCodPostal", String(loc.codPostal));
      setField("codLocalidad", loc.codigo);
      setField("codPostal", String(loc.codPostal));
      setProvinciaId(loc.provinciaId);
      setProvinciaInput(loc.nombreProvincia);
      setLocalidadInput(localidad);
    });
  }, [isEditing, isViewing, form.domicilioCodLocalidad]);

  return (
    <div className={styles.formSection}>

      <div className={styles.formRow}>
        <Autocomplete<SrtProvincia, false, false, false>
          disabled={isDisabled}
          options={provincias}
          inputValue={provinciaInput}
          onInputChange={(_e, v) => setProvinciaInput(v)}
          getOptionLabel={(opt) => opt.nombre}
          isOptionEqualToValue={(opt, val) => String(opt.interno) === String(val?.interno)}
          value={provincias.find((p) => String(p.nombre) === String(form.domicilioProvincia)) ?? null}
          onChange={(_e, newVal) => {
            const nombre = newVal ? newVal.nombre : "";
            setField("domicilioProvincia", nombre);
            setProvinciaId(newVal ? newVal.interno : null);
            setProvinciaInput(nombre);
          }}
          renderInput={(params) => (
        <TextField
              {...params}
              label="Provincia"
              placeholder="Seleccione provincia"
              fullWidth
              disabled={isDisabled}
              onBlur={() => onBlur("domicilioProvincia")}
            />
          )}
          fullWidth
        />
        <Autocomplete<SrtLocalidad, false, false, false>
          disabled={isDisabled}
          options={localidadesSrt}
          inputValue={localidadInput}
          onInputChange={(_e, v) => setLocalidadInput(v)}
          getOptionLabel={(opt) => `${opt.codPostal} - ${opt.nombre}`}
          isOptionEqualToValue={(opt, val) => String(opt.interno) === String(val?.interno)}
          value={
            localidadesSrt.find(
              (l) => `${l.codPostal} - ${l.nombre}` === String(form.domicilioLocalidad)
            ) ?? null
          }
          onChange={(_e, newVal) => {
            const txt = newVal ? `${newVal.codPostal} - ${newVal.nombre}` : "";
            setField("domicilioLocalidad", txt);
            setField("domicilioCodPostal", newVal ? String(newVal.codPostal) : "");
            setField("domicilioCodLocalidad", newVal ? String(newVal.codigo) : "");
            setField("codLocalidad", newVal ? String(newVal.codigo) : "");
            setField("codPostal", newVal ? String(newVal.codPostal) : "");
            setLocalidadInput(txt);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Localidad"
                placeholder="Seleccione localidad"
              fullWidth
              disabled={isDisabled}
              onBlur={() => onBlur("domicilioLocalidad")}
            />
          )}
          fullWidth
        />
        <TextField
          label="Código postal"
          name="domicilioCodPostal"
          value={form.domicilioCodPostal ?? ""}
          fullWidth
          disabled={isDisabled}
          InputProps={{ readOnly: true }}
          className={styles.postalField}
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
          inputProps={{ maxLength: 6 }}
          className={styles.nroField}
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
          inputProps={{ maxLength: 4 }}
          className={styles.pisoField}
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

      {(isCreating || isEditing || isViewing) && (showGrupoAutocomplete || showOrganizadorAutocomplete) && (
        <div className={styles.formRow}>
          {showGrupoAutocomplete && (
            <Autocomplete
              disabled={isDisabled || isGrupoOrganizador || isOrganizadorComercializador}
              options={grupoOptions}
              getOptionLabel={(opt) => String(opt?.label ?? "")}
              isOptionEqualToValue={(opt, val) => String(opt?.value) === String(val?.value)}
              value={
                grupoOptions.find(
                  (grupo) => String(grupo.value) === String(selectedGrupoId)
                ) ?? null
              }
              onChange={(_e, newValue) => onGrupoChange(String(newValue?.value ?? ""))}
              renderInput={(params) => (
                <TextField {...params} label="Grupo" placeholder="Seleccione grupo" />
              )}
              fullWidth
            />
          )}

          {showOrganizadorAutocomplete && (
            <Autocomplete
              disabled={isDisabled || isOrganizadorComercializador}
              options={organizadorOptions}
              getOptionLabel={(opt) => String(opt?.label ?? "")}
              isOptionEqualToValue={(opt, val) => String(opt?.value) === String(val?.value)}
              value={
                organizadorOptions.find(
                  (org) => String(org.value) === String(selectedOrganizadorId)
                ) ?? null
              }
              onChange={(_e, newValue) => onOrganizadorChange(String(newValue?.value ?? ""))}
              renderInput={(params) => (
                <TextField {...params} label="Organizador" placeholder="Seleccione organizador" />
              )}
              fullWidth
            />
          )}
        </div>
      )}
    </div>
  );
}
