"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useAuth } from "@/data/AuthContext";
import {
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  UsuarioFormFields,
  Props,
  ValidationErrors,
  TouchedFields,
} from "./types/formulario";
import styles from "./formulario.module.css";
import { SelectChangeEvent } from "@mui/material/Select";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import DatosUsuarioSection from "./DatosUsuarioSection";
import DatosReferenteSection from "./DatosReferenteSection";
import ArtAPI from "@/data/artAPI";
import { CUIP } from "@/utils/Formato";

function digits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function asArray(data: any): any[] {
  if (Array.isArray(data?.DATA)) return data.DATA;
  if (Array.isArray(data?.data)) return data.data;
  return Array.isArray(data) ? data : [];
}

const initialFormState: UsuarioFormFields = {
  nombre: "",
  email: "",
  cuit: "",
  phoneNumber: "",
  matricula: "",
  fechaNacimiento: "",
  canalInterviniente: 'E',
  inicioFecha: "",
  bajaFecha: "",
  domicilioCalle: "",
  domicilioNro: "",
  domicilioPiso: "",
  domicilioEntreCalle1: "",
  domicilioEntreCalle2: "",
  domicilioCodPostal: "",
  domicilioCodLocalidad: "",
  domicilioLocalidad: "",
  domicilioProvincia: "",
  cargoId: 1,
  password: "",
  confirmPassword: "",
  rol: "",
  userName: "",
  empresaId: 0,
  comision: 0,
  serviciosAdicionales: 0,
  aplicaIva: 0,
  srtComercializadorOrganizadorInterno: 0,
};

export default function UsuarioForm({
  open,
  onClose,
  onSubmit,
  roles = [],
  initialData,
  errorMsg,
  method,
  isSubmitting = false,
  isAdmin = false,
}: Props) {
  const [form, setForm] = useState<UsuarioFormFields>(initialFormState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const { user } = useAuth();
  const isOrganizadorComercializador = String((user as any)?.rol ?? "").toLowerCase() === 'organizadorcomercializador';
  const isGrupoOrganizador = String((user as any)?.rol ?? "").toLowerCase() === 'grupoorganizador';
  const isAdministrador = isAdmin || String((user as any)?.rol ?? "").toLowerCase() === "administrador";
  const userCuit = Number(digits((user as any)?.cuit ?? (user as any)?.CUIL ?? (user as any)?.cuil ?? 0));
  const userCuitValid = Number.isFinite(userCuit) && userCuit > 0 ? userCuit : undefined;

  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("");
  const [selectedOrganizadorId, setSelectedOrganizadorId] = useState<string>("");

  const { data: organizadorSelfData } = useSWR(
    isOrganizadorComercializador && userCuitValid
      ? ["SRTComercializadoresOrganizadores", "SELF", userCuitValid]
      : null,
    () => ArtAPI.getOrganizador({ CUIL: userCuitValid } as any),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const organizadorSelf = useMemo(() => asArray(organizadorSelfData)?.[0], [organizadorSelfData]);
  // const organizadorSelfInterno = Number(organizadorSelf?.interno ?? organizadorSelf?.Interno ?? NaN);
  const organizadorSelfGrupoInterno = Number(organizadorSelf?.srtComercializadorGOrganizadorInterno ?? NaN);

  const { data: gOrgData } = useSWR(
    isAdministrador
      ? ["SRTComercializadoresGOrganizadores", "ALL"]
      : isGrupoOrganizador && userCuitValid
        ? ["SRTComercializadoresGOrganizadores", userCuitValid]
        : null,
    () =>
      isAdministrador
        ? ArtAPI.getGOrganizador({} as any)
        : ArtAPI.getGOrganizador({ CUIL: userCuitValid } as any),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const { data: gOrgByIdData } = ArtAPI.useGetGOrganizadorById(
    isOrganizadorComercializador && Number.isFinite(organizadorSelfGrupoInterno) && organizadorSelfGrupoInterno > 0
      ? { id: organizadorSelfGrupoInterno }
      : undefined
  );

  const grupoOptions = useMemo(() => {
    const source = isOrganizadorComercializador
      ? gOrgByIdData
        ? [gOrgByIdData]
        : []
      : asArray(gOrgData);
    return source
      .map((x: any) => ({
        value: String(x?.interno ?? x?.Interno ?? x?.id ?? ""),
        label: String(x?.descripcion ?? x?.razonSocial ?? x?.nombre ?? x?.email ?? "") || "(Sin nombre)",
      }))
      .filter((x: any) => x.value);
  }, [gOrgData, gOrgByIdData, isOrganizadorComercializador]);

  const selectedGrupoInterno = selectedGrupoId ? Number(selectedGrupoId) : undefined;

  const canFetchOrganizadores = !isOrganizadorComercializador && (isAdministrador || (isGrupoOrganizador && selectedGrupoInterno));

  const { data: organizadorData } = useSWR(
    canFetchOrganizadores
      ? ["SRTComercializadoresOrganizadores", isAdministrador ? "ALL" : "GO", selectedGrupoId || "ALL"]
      : null,
    () =>
      isAdministrador && !selectedGrupoInterno
        ? ArtAPI.getOrganizador({} as any)
        : ArtAPI.getOrganizador({ SRTComercializadorGOrganizadorInterno: selectedGrupoInterno } as any),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const organizadorOptions = useMemo(() => {
    const source = isOrganizadorComercializador ? asArray(organizadorSelfData) : asArray(organizadorData);
    return source
      .map((x: any) => ({
        value: String(x?.interno ?? x?.Interno ?? x?.id ?? ""),
        label: String(x?.razonSocial ?? x?.observacion ?? x?.observaciones ?? x?.descripcion ?? "") || "(Sin nombre)",
        gOrgInterno: Number(x?.srtComercializadorGOrganizadorInterno ?? 0),
      }))
      .filter((x: any) => x.value);
  }, [isOrganizadorComercializador, organizadorData, organizadorSelfData]);

  useEffect(() => {
    if (isGrupoOrganizador && grupoOptions.length && !selectedGrupoId) {
      setSelectedGrupoId(grupoOptions[0].value);
    }
  }, [isGrupoOrganizador, grupoOptions, selectedGrupoId]);

  useEffect(() => {
    if (isOrganizadorComercializador && organizadorOptions.length && !selectedOrganizadorId) {
      setSelectedOrganizadorId(organizadorOptions[0].value);
    }
  }, [isOrganizadorComercializador, organizadorOptions, selectedOrganizadorId]);

  useEffect(() => {
    if (isOrganizadorComercializador && grupoOptions.length && !selectedGrupoId) {
      setSelectedGrupoId(grupoOptions[0].value);
    }
  }, [isOrganizadorComercializador, grupoOptions, selectedGrupoId]);

  useEffect(() => {
    if (selectedGrupoId && selectedOrganizadorId && !organizadorOptions.some((o) => o.value === selectedOrganizadorId)) {
      setSelectedOrganizadorId("");
    }
  }, [selectedGrupoId, selectedOrganizadorId, organizadorOptions]);


  // --- Lógica de Modos y Estado ---
  const isViewing = method === "view";
  const isEditing = method === "edit";
  const isCreating = method === "create";
  const isDeleting = method === "delete";

  const isDisabled = isViewing || isDeleting

  // --- Buscador Localidad / C.P.
  const [cpBuscado, setCpBuscado] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState<string>("");
  const [nombreBuscado, setNombreBuscado] = useState<string | null>(null);

  const { data: localidadesData, isValidating: isValidatingCP } = ArtAPI.useGetLocalidadesbyCP(
    cpBuscado ? { CodPostal: cpBuscado } : {}
  );
  const localidadesFromCpButton: any[] = Array.isArray(localidadesData) ? localidadesData : [];

  const { data: localidadesByNombre, isValidating: isValidatingNombre } = ArtAPI.useGetLocalidadesbyNombre(
    nombreBuscado ? { Nombre: nombreBuscado } : {}
  );

  const codigoLocalidadDigits = (form.domicilioCodLocalidad ?? "").replace(/\D/g, "");
  const codigoLocalidadNum = codigoLocalidadDigits ? Number(codigoLocalidadDigits) : 0;
  const { data: localidadCodigoData } = ArtAPI.useGetLocalidadesbyCodigo(
    codigoLocalidadNum ? { Codigo: codigoLocalidadNum } : {}
  );
  const localidadCodigoItem = Array.isArray(localidadCodigoData)
    ? localidadCodigoData[0]
    : localidadCodigoData || null;

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

  const handleBuscarLocalidades = () => {
    const text = busqueda.trim();
    if (text) {
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

    const cp = Number(form.domicilioCodPostal);
    if (!cp || Number.isNaN(cp)) return;
    setNombreBuscado(null);
    setCpBuscado(cp);
  };

  useEffect(() => {
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

    if (provincia && String(form.domicilioProvincia ?? "").trim() !== provincia) {
      const syntheticProvincia = { target: { name: "domicilioProvincia", value: provincia } } as any;
      handleTextFieldChange(syntheticProvincia as any);
    }

    if (codigoPostal && String(form.domicilioCodPostal ?? "").trim() !== codigoPostal) {
      const syntheticPostal = { target: { name: "domicilioCodPostal", value: codigoPostal } } as any;
      handleTextFieldChange(syntheticPostal as any);
    }

    if (nombreLocalidad && String(form.domicilioLocalidad ?? "").trim() !== nombreLocalidad) {
      const syntheticLocalidad = { target: { name: "domicilioLocalidad", value: nombreLocalidad } } as any;
      handleTextFieldChange(syntheticLocalidad as any);
    }
  }, [isEditing, isDisabled, localidadCodigoItem, form.domicilioProvincia, form.domicilioCodPostal, form.domicilioLocalidad]);

  useEffect(() => {
    // Restablecer el formulario y los estados de error/tocado al abrir o cambiar los datos
    if (initialData) {
      const processedData = { ...initialData };
      // Aplicar formato al CUIT
      if (processedData.userName) {
        processedData.cuit = CUIP(processedData.userName);
      }

      setForm(processedData);
    } else {
      setForm(initialFormState);
    }
    
    setErrors({});
    setTouched({});
  }, [initialData, open, isEditing, isCreating]);

  const modalTitle = useMemo(() => {
    switch (method) {
      case "create":
        return "Crear Nuevo Usuario";
      case "edit":
        return `Editar Usuario`;
      case "view":
        return `Detalles del usuario`;
      case "delete":
        return `Dar de baja Usuario`;
      default:
        return "Formulario de Usuario";
    }
  }, [method, form.nombre]);

  // --- Funciones de Validación ---

  const validateCuit = (cuit: string): string | undefined => {
    if (!cuit.trim()) return "CUIT es requerido";
    const cleanCuit = cuit.replace(/[^\d]/g, "");
    if (cleanCuit.length !== 11) return "CUIT debe tener 11 dígitos";
    // Basic CUIT validation algorithm
    const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const digits = cleanCuit.split("").map(Number);
    const sum = digits
      .slice(0, 10)
      .reduce((acc, digit, index) => acc + digit * factors[index], 0);
    const verifierDigit = 11 - (sum % 11);
    const expectedDigit =
      verifierDigit >= 10 ? verifierDigit - 11 : verifierDigit;
    if (digits[10] !== expectedDigit) return "CUIT inválido";
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return "Email es requerido";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Formato de email inválido";
    return undefined;
  };

  const validateRequired = (
    value: string,
    fieldName: string
  ): string | undefined => {
    if (!value.trim()) return `${fieldName} es requerido`;
    return undefined;
  };

  const validateField = (
    name: keyof UsuarioFormFields,
    value: string
  ): string | undefined => {
    switch (name) {
      case "cuit":
        return validateCuit(value);
      case "email":
        return validateEmail(value);
      case "nombre":
        return validateRequired(value, "Nombre");
      case "rol":
        return validateRequired(value, "Rol");
      default:
        return undefined;
    }
  };

  const validateAllFields = (): boolean => {
    const newErrors: ValidationErrors = {};
    let hasErrors = false;

    // No validar en modos 'view' o 'delete'
    if (isDisabled) return true;

    // Validar todos los campos
    (Object.keys(form) as (keyof UsuarioFormFields)[]).forEach((fieldName) => {
      const value = String(form[fieldName] ?? "");
      const error = validateField(fieldName, value);
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };
  // --- Handlers ---
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof UsuarioFormFields;

    if (name === "cuit") {
      const cleanValue = (value || '').replace(/[^0-9]/g, '');
      if (cleanValue.length <= 11) {
        const formattedCuit = CUIP(cleanValue);
        setForm((prev: UsuarioFormFields) => ({
          ...prev,
          [name]: formattedCuit,
        }));
      }
    } else {
      setForm((prev: UsuarioFormFields) => ({
        ...prev,
        [name]: value,
      }));
    }
        
    if (touched[fieldName]) {
      const error = validateField(fieldName, name === "cuit" ? CUIP(value.replace(/[^0-9]/g, '')) : value);
      setErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof UsuarioFormFields;

    setForm((prev: UsuarioFormFields) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    }
  };

  // Filtrar roles visibles cuando el usuario actual es admin
  const allowedAdminRoles = useMemo(
    () => ["Comercializador", "OrganizadorComercializador", "GrupoOrganizador"],
    []
  );

  const displayedRoles = useMemo(() => {
    if (isOrganizadorComercializador) {
      return roles.filter((r) => String(r.nombre) === "Comercializador");
    }
    if (isGrupoOrganizador) {
      return roles.filter((r) => ["Comercializador", "OrganizadorComercializador"].includes(String(r.nombre)));
    }
    if (isAdmin) {
      return roles.filter((r) => allowedAdminRoles.includes(r.nombre));
    }
    return roles;
  }, [roles, isAdmin, allowedAdminRoles, isOrganizadorComercializador, isGrupoOrganizador]);

  useEffect(() => {
    if (!isCreating) return;
    if (isOrganizadorComercializador) {
      const target = displayedRoles[0]?.nombre || "Comercializador";
      if (form.rol !== target) {
        setForm((prev) => ({ ...prev, rol: target }));
      }
      return;
    }

    if (isGrupoOrganizador) {
      const allowedNames = displayedRoles.map((r) => r.nombre);
      if (!form.rol || !allowedNames.includes(form.rol)) {
        setForm((prev) => ({ ...prev, rol: displayedRoles[0]?.nombre || "Comercializador" }));
      }
      return;
    }

    if (isAdmin) {
      const allowedNames = displayedRoles.map((r) => r.nombre);
      if (form.rol && !allowedNames.includes(form.rol)) {
        setForm((prev) => ({ ...prev, rol: displayedRoles[0]?.nombre || "" }));
      }
    }
  }, [isAdmin, displayedRoles, isOrganizadorComercializador, isGrupoOrganizador, form.rol, isCreating]);

  // handleCargoChange removed: el campo Cargo/Función ya no se muestra

  const handleBlur = (fieldName: keyof UsuarioFormFields) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, String(form[fieldName] ?? ""));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isDeleting) {
      const cleanCuit = form.cuit.replace(/[^ -9]/g, "");
      const deleteData: UsuarioFormFields = {
        ...form,
        cuit: cleanCuit,
        userName: cleanCuit,
      };
      onSubmit(deleteData);
      return;
    }

    // Empresa 0
    const finalEmpresaId = 0;
  
    const cleanCuit = form.cuit.replace(/[^\d]/g, "");

    const organizadorInternoSelected = Number(selectedOrganizadorId || form.srtComercializadorOrganizadorInterno || 0);

    const formDataWithDefaults = {
      ...form,
      cuit: cleanCuit,
      userName: cleanCuit,
      tipo: "",
      rol: form.rol || (displayedRoles.length > 0 ? displayedRoles[0].nombre : (roles.length > 0 ? roles[0].nombre : "")), // Default to first displayed role
      empresaId: finalEmpresaId,
      cargoId: 1,
      password: cleanCuit,
      confirmPassword: cleanCuit,
      srtComercializadorOrganizadorInterno: Number.isFinite(organizadorInternoSelected) ? organizadorInternoSelected : 0,
    };

    // // Mark all fields as touched
    const allTouched: TouchedFields = Object.keys(form).reduce((acc, key) => {
      acc[key as keyof TouchedFields] = true;
      return acc;
    }, {} as TouchedFields);
    setTouched(allTouched);

    if (validateAllFields()) {
      console.log("Submitting form data:", formDataWithDefaults);
      onSubmit(formDataWithDefaults);
    }
  };

  const handleGrupoChange = (value: string) => {
    setSelectedGrupoId(value);
    setSelectedOrganizadorId("");
  };

  const handleOrganizadorChange = (value: string) => {
    setSelectedOrganizadorId(value);
    setForm((prev) => ({
      ...prev,
      srtComercializadorOrganizadorInterno: value ? Number(value) : 0,
    }));
  };

  const handleAplicaIvaChange = (checked: boolean) => {
    setForm((prev) => ({ ...prev, aplicaIva: checked ? 1 : 0 }));
  };

  return (
    <CustomModal
      open={open}
      onClose={isSubmitting ? () => {} : onClose}
      title={modalTitle}
      size={isCreating ? "large" : "mid"}
    >
      <Box
        component="form"
        className={styles.formContainer}
        onSubmit={handleSubmit}
      >
        {errorMsg && (
          <Typography className={styles.errorMessage}>{errorMsg}</Typography>
        )}
        <div className={styles.formLayout}>
          <div className={styles.formContent}>
            <DatosUsuarioSection
              form={form}
              errors={errors}
              touched={touched}
              displayedRoles={displayedRoles}
              isCreating={isCreating}
              isEditing={isEditing}
              isViewing={isViewing}
              isDisabled={isDisabled}
              isGrupoOrganizador={isGrupoOrganizador}
              isOrganizadorComercializador={isOrganizadorComercializador}
              grupoOptions={grupoOptions}
              organizadorOptions={organizadorOptions}
              selectedGrupoId={selectedGrupoId}
              selectedOrganizadorId={selectedOrganizadorId}
              onGrupoChange={handleGrupoChange}
              onOrganizadorChange={handleOrganizadorChange}
              onTextFieldChange={handleTextFieldChange}
              onSelectChange={handleSelectChange}
              onBlur={handleBlur}
              onToggleAplicaIva={handleAplicaIvaChange}
            />

            <DatosReferenteSection
              form={form}
              errors={errors}
              touched={touched}
              busqueda={busqueda}
              onBusquedaChange={setBusqueda}
              onBuscarLocalidades={handleBuscarLocalidades}
              localidadesOptions={localidadesOptions}
              isValidating={isValidating}
              isDisabled={isDisabled}
              onTextFieldChange={handleTextFieldChange}
              onSelectChange={handleSelectChange}
              onBlur={handleBlur}
            />

            {/* Credenciales de Acceso eliminadas: password/confirmPassword se derivan del CUIT al enviar */}
            <div className={styles.formActions}>
              {/* Botón de acción principal (Oculto en 'view') */}
              {!isViewing && (
                <CustomButton 
                  type="submit" 
                  disabled={isSubmitting}
                  className={isSubmitting ? styles.actionButtonDisabled : undefined}
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} color="inherit" className={styles.spinner} />
                      {isDeleting
                        ? "Dando de baja..."
                        : isEditing
                          ? "Guardando..."
                          : "Registrando..."}
                    </>
                  ) : (
                    <>
                      {isDeleting
                        ? "Dar de baja Usuario"
                        : isEditing
                          ? "Guardar Cambios"
                          : "Registrar Usuario"}
                    </>
                  )}
                </CustomButton>
              )}

              <CustomButton
                onClick={onClose}
                color="secondary"
                disabled={isSubmitting}
                className={isSubmitting ? styles.actionButtonDisabled : undefined}
              >
                {isViewing ? "Cerrar" : "Cancelar"}
              </CustomButton>
            </div>
          </div>
          {isCreating && (
            <div className={styles.infoPanel}>
              <Typography variant="h6" className={styles.infoPanelTitle}>
                Información Importante
              </Typography>
              <ul className={styles.infoList}>
                <li>El usuario recibirá un email para activar su cuenta</li>
                <li>La contraseña temporal será el CUIL ingresado</li>
                <li>La contraseña temporal debe ser cambiada en el primer ingreso</li>
                <li>Posteriormente se podrán configurar los permisos</li>
                <li>Los campos marcados con * son obligatorios</li>
              </ul>
            </div>
          )}
        </div>
      </Box>
    </CustomModal>
  );
}