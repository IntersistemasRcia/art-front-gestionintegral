import React, { useMemo, useState, useRef, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import {
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Autocomplete,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import styles from "../denuncias.module.css";
import CustomButton from "@/utils/ui/button/CustomButton";
import {
  DenunciaFormData,
  TIPO_DOCUMENTO,
  ESTADO_CIVIL,
  AfiApiResponse,
} from "../types/tDenuncias";
import Formato from "@/utils/Formato";
import ArtAPI from "@/data/artAPI";
import DataTable from "@/utils/ui/table/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import CustomModalMessage, { MessageType } from "@/utils/ui/message/CustomModalMessage";
import dayjs from "dayjs";

type DatosTrabajadorProps = {
  form: DenunciaFormData;
  errors: { [K in keyof DenunciaFormData]?: string };
  touched: { [K in keyof DenunciaFormData]?: boolean };
  isDisabled: boolean;
  isEditing?: boolean;
  onTextFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (e: SelectChangeEvent<string>) => void;
  onBlur: (fieldName: keyof DenunciaFormData) => void;
};

const DatosTrabajador: React.FC<DatosTrabajadorProps> = ({
  form,
  errors,
  touched,
  isDisabled,
  isEditing,
  onTextFieldChange,
  onSelectChange,
  onBlur,
}) => {

  // Traemos países desde /api/Paises
  const { data: paisesData } = ArtAPI.useGetRefPaises();
  // Máxima fecha de nacimiento permitida 16 años
  const maxNacimiento = useMemo(() => dayjs().subtract(16, "year").format("YYYY-MM-DD"), []);

  // Nos aseguramos de tener un array y lo ordenamos por denominación
  const paisesOrdenados = useMemo(
    () =>
      Array.isArray(paisesData)
        ? [...paisesData].sort((a, b) =>
          (a.denominacion || "").localeCompare(b.denominacion || "")
        )
        : [],
    [paisesData]
  );

  // Traemos obras sociales desde /api/ObrasSociales
  const { data: obrasSocialesData } = ArtAPI.useGetRefObraSocail();

  // Ordenamos alfabéticamente por descripción
  const obrasSocialesOrdenadas = useMemo(
    () =>
      Array.isArray(obrasSocialesData)
        ? [...obrasSocialesData].sort((a, b) =>
          (a.denominacion || "").localeCompare(b.denominacion || "")
        )
        : [],
    [obrasSocialesData]
  );

  // CP que se usó para buscar localidades (trabajador)
  const [cpBuscado, setCpBuscado] = useState<number | null>(null);

  // Buscador para localidad (campo de búsqueda)
  const [busqueda, setBusqueda] = useState<string>("");
  const [nombreBuscado, setNombreBuscado] = useState<string | null>(null);

  // Llamamos al hook SOLO cuando hay cpBuscado (búsqueda por CP desde el botón/lupa)
  const { data: localidadesData, isValidating: isValidatingCP } = ArtAPI.useGetLocalidadesbyCP(
    cpBuscado ? { CodPostal: cpBuscado } : {}
  );

  const localidadesFromCpButton: any[] = Array.isArray(localidadesData) ? localidadesData : [];

  // Hook para búsquedas por nombre disparadas con la lupa
  const { data: localidadesByNombre, isValidating: isValidatingNombre } = ArtAPI.useGetLocalidadesbyNombre(
    nombreBuscado ? { Nombre: nombreBuscado } : {}
  );

  // Si estamos editando y ya existe un código de localidad, traemos esa localidad por código
  const codigoLocalidadDigits = (form.codLocalidadTrabajador ?? "").replace(/\D/g, "");
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
  const afiLoadingRef = useRef(false);
  const [afiLoading, setAfiLoading] = useState(false);
  const [afiModalOpen, setAfiModalOpen] = useState(false);
  const [afiModalMessage, setAfiModalMessage] = useState("");
  const [afiModalType, setAfiModalType] = useState<MessageType>("alert");
  const lastAfiCuilRef = useRef<string>("");
  // CUIL inicial proveniente de la base (solo se setea una vez)
  const initialCuilRef = useRef<string | null>(null);

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleTelefonoBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = Formato.Telefono(e.target.value ?? "");
    const synthetic = {
      target: {
        name: e.target.name,
        value: formatted,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onTextFieldChange(synthetic);
    onBlur("telefono");
  };

  // EmpleadorTrabajadores por CUIL
  const [empTrabList, setEmpTrabList] = useState<any[]>([]);
  const [empTrabLoading, setEmpTrabLoading] = useState<boolean>(false);
  const lastEmpTrabCuilRef = useRef<string>("");

  useEffect(() => {
    const digits = onlyDigits(form.cuil);
    if (isDisabled) return;

    if (digits.length !== 11) {
      if (empTrabList.length) setEmpTrabList([]);
      lastEmpTrabCuilRef.current = "";
      return;
    }
    if (lastEmpTrabCuilRef.current === digits) return;

    let cancelled = false;
    const fetchEmpTrab = async () => {
      try {
        setEmpTrabLoading(true);
        const list = await ArtAPI.getEmpleadorTrabajadores({ CUIL: Number(digits) });
        if (cancelled) return;
        setEmpTrabList(Array.isArray(list) ? list : []);
        lastEmpTrabCuilRef.current = digits;
      } catch {
        if (!cancelled) setEmpTrabList([]);
      } finally {
        if (!cancelled) setEmpTrabLoading(false);
      }
    };

    fetchEmpTrab();
    return () => { cancelled = true; };
  }, [form.cuil, isDisabled]);

  const empTrabColumns = useMemo<ColumnDef<any>[]>(() => ([
    {
      accessorKey: 'cuil',
      header: 'Trabajador',
      size: 130,
      cell: (info) => Formato.CUIP(String(info.getValue() ?? '')),
    },
    {
      accessorKey: 'cuit',
      header: 'Empresa',
      size: 130,
      cell: (info) => Formato.CUIP(String(info.getValue() ?? '')),
    },
    {
      accessorKey: 'periodo',
      header: 'Periodo',
      size: 100,
      cell: (info) => {
        const raw = String(info.getValue() ?? '');
        const digits = raw.replace(/\D/g, '');
        if (digits.length >= 6) {
          const six = digits.slice(0, 6);
          return `${six.slice(0, 4)}-${six.slice(4, 6)}`;
        }
        return raw;
      },
    },
    {
      accessorKey: 'origenTipo',
      header: 'Origen',
      size: 120,
      cell: (info) => {
        const v = String(info.getValue() ?? '').toUpperCase();
        if (v === 'N') return 'DDJJ';
        if (v === 'R') return 'RL';
        return v;
      },
    },
    {
      accessorKey: 'empresaRazonSocial',
      header: 'Razón Social',
      size: 260,
      cell: (info) => {
        const v = String(info.getValue() ?? '');
        return v && v.length > 60 ? `${v.substring(0, 60)}...` : v;
      },
    },
  ]), []);

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

    const cp = Number(form.codPostalTrabajador);
    if (!cp || Number.isNaN(cp)) {
      return;
    }
    setNombreBuscado(null);
    setCpBuscado(cp);
  };

  // Helper para mantener sólo dígitos
  const onlyDigits = (v?: string) => (v ?? "").replace(/\D/g, "");

  // Aplicar formateo inicial del CUIL (cuando el formulario viene con valor desde la base)
  const cuilInitialFormattedRef = useRef(false);
  useEffect(() => {
    if (cuilInitialFormattedRef.current) return;
    const digits = onlyDigits(form.cuil);
    if (digits.length === 11) {
      try {
        const formatted = Formato.CUIP(digits);
        if (formatted && formatted !== form.cuil) {
          const synthetic = { target: { name: 'cuil', value: formatted } } as any;
          onTextFieldChange(synthetic);
        }
      } catch (err) {
        // ignore
      }
    }
    cuilInitialFormattedRef.current = true;
  }, [form.cuil]);

  // Guardar CUIL inicial de base solo una vez
  useEffect(() => {
    if (initialCuilRef.current != null) return;
    const initialDigits = onlyDigits(form.cuil);
    if (initialDigits) {
      initialCuilRef.current = initialDigits;
    } else {
      initialCuilRef.current = "";
    }
  }, [form.cuil]);

  // Generador de handlers para campos numéricos.
  const numericChange = (
    name: string,
    options?: { format?: (digits: string) => string; formatWhenLen?: number }
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = onlyDigits(e.target.value || "");
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

  // Autocompletado por CUIL: cuando se ingresan 11 dígitos válidos, consulta afiliado y completa.
  useEffect(() => {
    const digits = onlyDigits(form.cuil);
    if (isDisabled) return;
    const initialDigits = initialCuilRef.current ?? "";

    // En edición: consultar solo si no hay CUIL inicial o si el actual es distinto
    if (isEditing) {
      if (digits.length !== 11) return;
      if (initialDigits && digits === initialDigits) return;
      if (lastAfiCuilRef.current === digits) return;

      const fetchAndFill = async () => {
        try {
          afiLoadingRef.current = true;
          setAfiLoading(true);
          const data: AfiApiResponse = await ArtAPI.getAfiliadoCuil({ CUIL: Number(digits) });
          if (!data) {
            setAfiModalMessage("El trabajador no se encuentra registrado como afiliado.");
            setAfiModalType("alert");
            setAfiModalOpen(true);
            const syntheticClear = { target: { name: 'cuil', value: '' } } as any;
            onTextFieldChange(syntheticClear);
            lastAfiCuilRef.current = "";
            return;
          }

          // Mapear respuesta del afiliado a los campos del formulario
          const domCalle = (data as any).DomicilioCalle ?? (data as any).domicilioCalle ?? "";
          const domNro = String((data as any).DomicilioNumero ?? (data as any).domicilioNro ?? "");
          const domPiso = (data as any).DomicilioPiso ?? (data as any).domicilioPiso ?? "";
          const domDpto = (data as any).DomicilioDpto ?? (data as any).domicilioDpto ?? "";
          const domEntre1 = (data as any).DomicilioEntreCalle1 ?? (data as any).domicilioEntreCalle1 ?? "";
          const domEntre2 = (data as any).DomicilioEntreCalle2 ?? (data as any).domicilioEntreCalle2 ?? "";
          const locSrt = (data as any).CodLocalidadSrt ?? (data as any).codLocalidadSrt ?? "";
          const cpPostal = (data as any).CodLocalidadPostal ?? (data as any).codLocalidadPostal ?? "";

          const selectEvent = (name: keyof DenunciaFormData, value: string) => {
            const syntheticSelect = { target: { name, value } } as any;
            onSelectChange(syntheticSelect);
          };
          const textEvent = (name: keyof DenunciaFormData, value: string) => {
            const syntheticInput = { target: { name, value } } as any;
            onTextFieldChange(syntheticInput);
          };

          // Campos básicos
          textEvent("docTipo", data.docTipo ?? "");
          textEvent("docNumero", String(data.docNumero ?? ""));
          textEvent("nombre", data.nombre ?? "");
          textEvent("fechaNac", data.fechaNacimiento ?? "");
          selectEvent("sexo", data.sexo ?? "");
          selectEvent("estadoCivil", data.estadoCivil ?? "");
          selectEvent("nacionalidad", String(data.nacionalidad ?? ""));

          // Domicilio
          textEvent("domicilioCalle", domCalle ?? "");
          textEvent("domicilioNro", domNro ?? "");
          textEvent("domicilioPiso", domPiso ?? "");
          textEvent("domicilioDpto", domDpto ?? "");
          textEvent("domicilioEntreCalle1", domEntre1 ?? "");
          textEvent("domicilioEntreCalle2", domEntre2 ?? "");
          // Localidad y CP
          selectEvent("codLocalidadTrabajador", String(locSrt ?? ""));
          textEvent("codPostalTrabajador", String(cpPostal ?? ""));
          // Contacto: completar solo si no hay datos pre-cargados
          if (!form.telefono) {
            textEvent("telefono", data.telefono ?? "");
          }
          if (!form.email) {
            textEvent("email", (data as any).email ?? (data as any).eMail ?? "");
          }

          // Obra social (RNOS como string)
          selectEvent("obraSocial", String(data.obraSocial ?? ""));

          lastAfiCuilRef.current = digits;
        } catch (err) {
          setAfiModalMessage("No se pudo verificar el CUIL del trabajador.");
          setAfiModalType("alert");
          setAfiModalOpen(true);
          const syntheticClear = { target: { name: 'cuil', value: '' } } as any;
          onTextFieldChange(syntheticClear);
          lastAfiCuilRef.current = "";
        } finally {
          afiLoadingRef.current = false;
          setAfiLoading(false);
        }
      };

      fetchAndFill();
      return;
    }
    // En creación: si hay 11 dígitos, realizar búsqueda (evita duplicados)
    if (digits.length !== 11) return;
    if (lastAfiCuilRef.current === digits) return;

    const fetchAndFill = async () => {
      try {
        afiLoadingRef.current = true;
        setAfiLoading(true);
        const data: AfiApiResponse = await ArtAPI.getAfiliadoCuil({ CUIL: Number(digits) });
        if (!data) {
          setAfiModalMessage("El trabajador no se encuentra registrado como afiliado.");
          setAfiModalType("alert");
          setAfiModalOpen(true);
          const syntheticClear = { target: { name: 'cuil', value: '' } } as any;
          onTextFieldChange(syntheticClear);
          lastAfiCuilRef.current = "";
          return;
        }

        // Mapear respuesta del afiliado a los campos del formulario
        const domCalle = (data as any).DomicilioCalle ?? (data as any).domicilioCalle ?? "";
        const domNro = String((data as any).DomicilioNumero ?? (data as any).domicilioNro ?? "");
        const domPiso = (data as any).DomicilioPiso ?? (data as any).domicilioPiso ?? "";
        const domDpto = (data as any).DomicilioDpto ?? (data as any).domicilioDpto ?? "";
        const domEntre1 = (data as any).DomicilioEntreCalle1 ?? (data as any).domicilioEntreCalle1 ?? "";
        const domEntre2 = (data as any).DomicilioEntreCalle2 ?? (data as any).domicilioEntreCalle2 ?? "";
        const locSrt = (data as any).CodLocalidadSrt ?? (data as any).codLocalidadSrt ?? "";
        const cpPostal = (data as any).CodLocalidadPostal ?? (data as any).codLocalidadPostal ?? "";

        const selectEvent = (name: keyof DenunciaFormData, value: string) => {
          const syntheticSelect = { target: { name, value } } as any;
          onSelectChange(syntheticSelect);
        };
        const textEvent = (name: keyof DenunciaFormData, value: string) => {
          const syntheticInput = { target: { name, value } } as any;
          onTextFieldChange(syntheticInput);
        };

        // Campos básicos
        textEvent("docTipo", data.docTipo ?? "");
        textEvent("docNumero", String(data.docNumero ?? ""));
        textEvent("nombre", data.nombre ?? "");
        textEvent("fechaNac", data.fechaNacimiento ?? "");
        selectEvent("sexo", data.sexo ?? "");
        selectEvent("estadoCivil", data.estadoCivil ?? "");
        selectEvent("nacionalidad", String(data.nacionalidad ?? ""));

        // Domicilio
        textEvent("domicilioCalle", domCalle ?? "");
        textEvent("domicilioNro", domNro ?? "");
        textEvent("domicilioPiso", domPiso ?? "");
        textEvent("domicilioDpto", domDpto ?? "");
        textEvent("domicilioEntreCalle1", domEntre1 ?? "");
        textEvent("domicilioEntreCalle2", domEntre2 ?? "");

        // Localidad y CP
        selectEvent("codLocalidadTrabajador", String(locSrt ?? ""));
        textEvent("codPostalTrabajador", String(cpPostal ?? ""));

        // Contacto: solo completar si no hay datos pre-cargados en edición
        if (!form.telefono) {
          textEvent("telefono", data.telefono ?? "");
        }
        if (!form.email) {
          textEvent("email", (data as any).email ?? (data as any).eMail ?? "");
        }

        // Obra social (se usa RNOS como string)
        selectEvent("obraSocial", String(data.obraSocial ?? ""));

        lastAfiCuilRef.current = digits;
      } catch (err) {
        setAfiModalMessage("No se pudo verificar el CUIL del trabajador.");
        setAfiModalType("alert");
        setAfiModalOpen(true);
        const syntheticClear = { target: { name: 'cuil', value: '' } } as any;
        onTextFieldChange(syntheticClear);
        lastAfiCuilRef.current = "";
      } finally {
        afiLoadingRef.current = false;
        setAfiLoading(false);
      }
    };

    fetchAndFill();
  }, [form.cuil, isDisabled, isEditing]);

  return (
    <>
      <CustomModalMessage
        open={afiModalOpen}
        type={afiModalType}
        message={afiModalMessage}
        onClose={() => setAfiModalOpen(false)}
        title={afiModalType === 'alert' ? 'CUIL no afiliado' : undefined}
      />
      {/* Trabajador */}
      <div className={styles.formSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          Trabajador
        </Typography>

        <div className={styles.formRow}>
          <div className={`${styles.compactField} ${styles.flexColumn}`}>
            <TextField
              label="Cuil"
              name="cuil"
              value={form.cuil}
              onChange={numericChange("cuil", { format: (d) => Formato.CUIP(d), formatWhenLen: 11 })}
              error={touched.cuil && !!errors.cuil}
              helperText={touched.cuil && errors.cuil}
              fullWidth
              required={!isDisabled}
              disabled={isDisabled}
              placeholder="Ingrese CUIL"
            />
            {afiLoading && (
              <Typography variant="caption" className={styles.captionNote}>
                cargando...
              </Typography>
            )}
          </div>

          <FormControl
            fullWidth
            required={!isDisabled}
            error={touched.docTipo && !!errors.docTipo}
            disabled={isDisabled}
            className={styles.compactField}
          >
            <InputLabel>Doc. Tipo</InputLabel>
            <Select
              name="docTipo"
              value={form.docTipo}
              label="Doc Tipo"
              onChange={onSelectChange}
              onBlur={() => onBlur("docTipo")}
            >
              {TIPO_DOCUMENTO.map((tipo) => (
                <MenuItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </MenuItem>
              ))}
            </Select>
            {touched.docTipo && errors.docTipo && (
              <Typography
                variant="caption"
                color="error"
                className={styles.captionNote}
              >
                {errors.docTipo}
              </Typography>
            )}
          </FormControl>

          <TextField
            label="Doc. Número"
            name="docNumero"
            value={form.docNumero}
            onChange={numericChange("docNumero", { format: (d) => Formato.DNI(d), formatWhenLen: 8 })}
            error={touched.docNumero && !!errors.docNumero}
            helperText={touched.docNumero && errors.docNumero}
            fullWidth
            required={!isDisabled}
            disabled={isDisabled}
            placeholder="Número de documento"
            className={styles.compactField}
          />

          <TextField
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("nombre")}
            error={touched.nombre && !!errors.nombre}
            helperText={touched.nombre && errors.nombre}
            fullWidth
            required={!isDisabled}
            disabled={isDisabled}
            placeholder="Nombre completo"
            className={styles.wideField}
          />

        </div>

        <div className={styles.formRow}>
          <TextField
            label="Fecha Nac."
            name="fechaNac"
            type="date"
            value={form.fechaNac}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("fechaNac")}
            error={touched.fechaNac && !!errors.fechaNac}
            helperText={touched.fechaNac && errors.fechaNac}
            fullWidth
            required={!isDisabled}
            disabled={isDisabled}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: maxNacimiento }}
            className={styles.compactField}
          />

          <FormControl
            fullWidth
            required={!isDisabled}
            error={touched.sexo && !!errors.sexo}
            disabled={isDisabled}
            className={styles.compactField}
          >
            <InputLabel>Sexo</InputLabel>
            <Select
              name="sexo"
              value={form.sexo}
              label="Sexo"
              onChange={onSelectChange}
              onBlur={() => onBlur("sexo")}
            >
              <MenuItem value="M">Masculino</MenuItem>
              <MenuItem value="F">Femenino</MenuItem>
            </Select>
            {touched.sexo && errors.sexo && (
              <Typography variant="caption" color="error" className={styles.captionNote}>
                {errors.sexo}
              </Typography>
            )}
          </FormControl>

          <FormControl
            fullWidth
            required={!isDisabled}
            error={touched.estadoCivil && !!errors.estadoCivil}
            disabled={isDisabled}
            className={styles.compactField}
          >
            <InputLabel>Estado Civil</InputLabel>
            <Select
              name="estadoCivil"
              value={form.estadoCivil}
              label="Estado Civil"
              onChange={onSelectChange}
              onBlur={() => onBlur("estadoCivil")}
            >
              {ESTADO_CIVIL.map((estado) => (
                <MenuItem key={estado.value} value={estado.value}>
                  {estado.label}
                </MenuItem>
              ))}
            </Select>
            {touched.estadoCivil && errors.estadoCivil && (
              <Typography
                variant="caption"
                color="error"
                className={styles.captionNote}
              >
                {errors.estadoCivil}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth disabled={isDisabled} className={styles.fullRowField}>
            <InputLabel>Nacionalidad</InputLabel>
            <Select
              name="nacionalidad"
              value={form.nacionalidad}
              label="Nacionalidad"
              onChange={onSelectChange}
              onBlur={() => onBlur("nacionalidad")}
              disabled={isDisabled}
            >
              <MenuItem value="">Seleccione...</MenuItem>
              {paisesOrdenados.map((pais) => (
                <MenuItem key={pais.codigo} value={String(pais.codigo)}>
                  {pais.denominacion ?? pais.pais}
                </MenuItem>
              ))}
            </Select>
            {touched.nacionalidad && errors.nacionalidad && (
              <Typography variant="caption" color="error" className={styles.captionNote}>
                {errors.nacionalidad}
              </Typography>
            )}
          </FormControl>
        </div>

        <div className={styles.formRow}>
          <div className={styles.inlineGroup}>
            <Autocomplete
              fullWidth
              options={obrasSocialesOrdenadas}
              getOptionLabel={(os) => (os ? (os.sigla ? `${os.sigla} - ${os.denominacion}` : os.denominacion || '') : '')}
              value={obrasSocialesOrdenadas.find((os) => String(os.rnos) === form.obraSocial) ?? null}
              onChange={(e, value) => {
                const syntheticSelect = { target: { name: 'obraSocial', value: value ? String(value.rnos) : '' } } as any;
                onSelectChange(syntheticSelect);
              }}
              onBlur={() => onBlur('obraSocial')}
              disabled={isDisabled}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Obra Social"
                  error={touched.obraSocial && !!errors.obraSocial}
                  helperText={touched.obraSocial && errors.obraSocial}
                />
              )}
            />

          </div>
        </div>

        <div className={styles.formRow}>
          <TextField
            label="Domicilio Calle"
            name="domicilioCalle"
            value={form.domicilioCalle}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("domicilioCalle")}
            error={touched.domicilioCalle && !!errors.domicilioCalle}
            helperText={touched.domicilioCalle && errors.domicilioCalle}
            fullWidth
            required={!isDisabled}
            disabled={isDisabled}
            placeholder="Nombre de la calle"
          />
        </div>

        <div className={styles.formRow}>
          <TextField
            label="Nro."
            name="domicilioNro"
            value={form.domicilioNro}
            onChange={numericChange("domicilioNro")}
            fullWidth
            disabled={isDisabled}
            placeholder="Número"
          />
          <TextField
            label="Piso"
            name="domicilioPiso"
            value={form.domicilioPiso}
            onChange={onTextFieldChange}
            fullWidth
            disabled={isDisabled}
            placeholder="Piso"
          />
          <TextField
            label="Dpto."
            name="domicilioDpto"
            value={form.domicilioDpto}
            onChange={onTextFieldChange}
            fullWidth
            disabled={isDisabled}
            placeholder="Depto"
          />
        </div>

        <div className={styles.formRow}>
          <TextField
            label="Teléfono"
            name="telefono"
            inputRef={telInputRef}
            value={form.telefono}
            onChange={handleTelefonoChange}
            onBlur={handleTelefonoBlur}
            error={touched.telefono && !!errors.telefono}
            helperText={touched.telefono && errors.telefono}
            fullWidth
            required={!isDisabled}
            disabled={isDisabled}
            placeholder="Ingrese teléfono"
          />

          <TextField
            label="eMail"
            name="email"
            type="email"
            value={form.email}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("email")}
            error={touched.email && !!errors.email}
            helperText={touched.email && errors.email}
            fullWidth
            required={!isDisabled}
            disabled={isDisabled}
            placeholder="email@ejemplo.com"
          />
        </div>

        <div className={styles.formRow}>
          <TextField
            label="Búsqueda Localidad / C.P."
            name="busqueda"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={styles.smallField}
            fullWidth
            disabled={isDisabled}
            placeholder="Buscar..."
          />

          <CustomButton
            color="primary"
            size="mid"
            className={styles.smallButton}
            aria-label="buscar localidad"
            onClick={handleBuscarLocalidades}
          >
            <FaSearch />
          </CustomButton>

          <div className={styles.smallField}>
            <Autocomplete
              disabled={isDisabled}
              options={localidadesOptions}
              getOptionLabel={(opt: any) => String(opt?.nombreCompleto ?? opt?.nombre ?? "")}
              isOptionEqualToValue={(opt: any, val: any) => String(opt?.codigo) === String(val?.codigo)}
              value={localidadesOptions.find((loc) => String(loc.codigo) === String(form.codLocalidadTrabajador)) ?? null}
              onChange={(_e, newValue: any) => {
                const codigo = newValue ? String(newValue.codigo ?? "") : "";
                const nombre = newValue ? String(newValue.nombreCompleto ?? newValue.nombre ?? "") : "";
                const syntheticSelect = { target: { name: 'codLocalidadTrabajador', value: codigo } } as any;
                onSelectChange(syntheticSelect);
                const syntheticText = { target: { name: 'localidadTrabajador', value: nombre } } as any;
                onTextFieldChange(syntheticText);
                const codigoPostal = newValue ? String(newValue.codPostal ?? newValue.CodPostal ?? "") : "";
                const syntheticPostal = { target: { name: 'codPostalTrabajador', value: codigoPostal } } as any;
                onTextFieldChange(syntheticPostal);
                const provincia = newValue ? String(newValue.litProvincia ?? newValue.provincia ?? "") : "";
                const syntheticProvincia = { target: { name: 'litProvinciaTrabajador', value: provincia } } as any;
                onTextFieldChange(syntheticProvincia);
                // limpiar búsqueda al seleccionar
                setBusqueda("");
                setNombreBuscado(null);
              }}
              onBlur={() => onBlur('codLocalidadTrabajador')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Localidad"
                  placeholder="Seleccione localidad"
                  error={touched.codLocalidadTrabajador && !!errors.codLocalidadTrabajador}
                  helperText={touched.codLocalidadTrabajador && errors.codLocalidadTrabajador}
                />
              )}
            />

            {isValidating && (
              <Typography variant="caption" className={styles.captionNote}>
                cargando...
              </Typography>
            )}
          </div>

          <TextField
            label="Cod. Postal"
            name="codPostalTrabajador"
            value={form.codPostalTrabajador}
            className={styles.smallField}
            fullWidth
            disabled={isDisabled}
            InputProps={{ readOnly: true }}
            placeholder="Código postal"
          />

          <TextField
            label="Provincia"
            name="litProvinciaTrabajador"
            value={form.litProvinciaTrabajador}
            onChange={onTextFieldChange}
            onBlur={() => onBlur("litProvinciaTrabajador")}
            className={styles.smallField}
            fullWidth
            disabled={isDisabled}
            InputProps={{ readOnly: true }}
            placeholder="Provincia"
          />
        </div>
      </div>

      {/* EmpleadorTrabajadores por CUIL */}
      <div className={styles.formSection}>
        <Typography variant="h6" className={styles.sectionTitle}>
          Historial de Relación Empleador-Trabajador
        </Typography>
        <div className={styles.compactTable}>
          <DataTable
            columns={empTrabColumns}
            data={Array.isArray(empTrabList) ? empTrabList : []}
            isLoading={empTrabLoading}
            enableFiltering={false}
            pageSize={5}
          />
        </div>
      </div>
    </>
  );
};

export default DatosTrabajador;
