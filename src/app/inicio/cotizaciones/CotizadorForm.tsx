"use client";

import { useState, useEffect } from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Typography } from '@mui/material';
import cotizadorAPI, { CIIUIndicesDTO, ARTSellosIIBBDTO, EmpleadoresPadronDTO, EmpleadoresPESEDTO, EmpleadoresSiniestrosDTO, CotizacionGenerarDTO, CotizacionesDTO, RefEvolucionFFEPDTO } from '@/data/cotizadorAPI';
import Formato from '@/utils/Formato';
import CustomButton from '@/utils/ui/button/CustomButton';
import CustomSelectSearch from '@/utils/ui/form/CustomSelectSearch';
import { tieneActividadesSiniestras, debeSolicitar } from './validaciones';
import { CotizacionResultadoModal } from './CotizacionResultadoModal';
import { CotizadorPDFPreview } from './CotizadorPDFPreview';
import { CotizadorEmailModal } from './CotizadorEmailModal';
import { CotizadorFormData, CotizadorPDFFormData } from './types';
import styles from './cotizadorForm.module.css';

// Función helper para formatear CUIT sin rellenar con ceros mientras se escribe
// Formato correcto: ##-##.###.###-#
const formatCUIT = (value: string): string => {
  if (!value || value.length === 0) return '';
  const digits = value.replace(/[^\d]/g, '');
  if (digits.length === 0) return '';
  
  // Aplicar formato progresivo según la cantidad de dígitos
  // Formato: ##-##.###.###-#
  // Estructura: 2-2.3.3-1 = 11 dígitos totales
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    // ##-##
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  } else if (digits.length <= 7) {
    // ##-##.###
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}.${digits.slice(4)}`;
  } else if (digits.length <= 10) {
    // ##-##.###.###
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
  } else {
    // 11 dígitos: formato completo ##-##.###.###-#
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}.${digits.slice(4, 7)}.${digits.slice(7, 10)}-${digits.slice(10)}`;
  }
};

type CotizadorFormProps = {
  onClose: () => void;
};

const initialFormData: CotizadorFormData = {
  cuit: '',
  jurisdiccion: '',
  ciiuPrincipal: '',
  ciiuSecundario1: '',
  ciiuSecundario2: '',
  actividadCotizacion: '',
  trabajadoresDeclarados: '',
  masaSalarial: '',
  nombre: '',
  email: '',
  tipoTel: 'Celular',
  numeroTelefono: '',
  alicuota: '',
};

export const CotizadorForm = ({ onClose }: CotizadorFormProps) => {
  const [formData, setFormData] = useState<CotizadorFormData>(initialFormData);

  const [validatingCuit, setValidatingCuit] = useState(false);
  const [cuitError, setCuitError] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CotizadorFormData, string>>>({});
  const [isCuitValidated, setIsCuitValidated] = useState(false);
  const [cuitValidado, setCuitValidado] = useState<number | null>(null);
  const [artSellosIIBB, setArtSellosIIBB] = useState<ARTSellosIIBBDTO[]>([]);
  const [empleadoresPadron, setEmpleadoresPadron] = useState<EmpleadoresPadronDTO | null>(null);
  const [empleadoresPESE, setEmpleadoresPESE] = useState<EmpleadoresPESEDTO[] | null>(null);
  const [empleadoresSiniestros, setEmpleadoresSiniestros] = useState<EmpleadoresSiniestrosDTO[] | null>(null);
  const [cotizacionRealizada, setCotizacionRealizada] = useState(false);
  const [isGeneratingCotizacion, setIsGeneratingCotizacion] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
    open: false,
    message: '',
    type: 'success',
  });
  const [resultadoCotizacion, setResultadoCotizacion] = useState<{ open: boolean; resultado: CotizacionesDTO | null; esSolicitud: boolean; error: string | null }>({
    open: false,
    resultado: null,
    esSolicitud: false,
    error: null,
  });
  const [datosParaPDF, setDatosParaPDF] = useState<{
    formData: CotizadorPDFFormData;
    resultado: CotizacionesDTO | null;
  } | null>(null);
  const [mostrarPreviewPDF, setMostrarPreviewPDF] = useState(false);
  const [mostrarEmailModal, setMostrarEmailModal] = useState(false);

  // Consultar actividades CIIU desde el endpoint de CIIUIndices cuando hay CUIT validado
  const { data: actividadesCIIU, isLoading: isLoadingActividades } = cotizadorAPI.useGetCIIUIndices(
    cuitValidado ? { CUIT: cuitValidado } : undefined,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Consultar RefEvolucionFFEP automáticamente (no requiere CUIT)
  const { data: refEvolucionFFEPData } = cotizadorAPI.useGetRefEvolucionFFEP({
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Obtener el último importe de FFEP (el más reciente por fecha)
  const ultimoFFEP = refEvolucionFFEPData && refEvolucionFFEPData.length > 0
    ? refEvolucionFFEPData
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
    : null;

  // Consultar ARTSellosIIBB automáticamente cuando hay CUIT validado
  const { data: artSellosIIBBData, isLoading: isLoadingArtSellosIIBB } = cotizadorAPI.useGetARTSellosIIBB(
    cuitValidado ? { CUIT: cuitValidado } : undefined,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Actualizar el estado cuando se cargan los datos de ARTSellosIIBB
  useEffect(() => {
    if (artSellosIIBBData) {
      setArtSellosIIBB(artSellosIIBBData);
    }
  }, [artSellosIIBBData]);

  const clearFieldError = (field: keyof CotizadorFormData) => {
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTextFieldChange = (field: keyof CotizadorFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const raw = e.target.value;
    const value = field === 'numeroTelefono' ? raw.replace(/\D/g, '') : raw;
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
  };

  const handleMasaSalarialChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    // Limpiar todos los caracteres excepto números
    // Los dígitos ingresados representan centavos (los 2 primeros son decimales)
    const cleanValue = inputValue.replace(/[^\d]/g, '');
    
    // Convertir a número con decimales: dividir por 100 para obtener el valor real
    // Ejemplo: "1234" → 12.34, "12345" → 123.45
    const numericValue = cleanValue ? parseFloat(cleanValue) / 100 : 0;
    const finalValue = numericValue.toString();
    
    setFormData(prev => ({ ...prev, masaSalarial: finalValue }));
    clearFieldError('masaSalarial');
  };


  const handleCuitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Limpiar todos los caracteres no numéricos (guiones, puntos, espacios, etc.)
    const cleanValue = inputValue.replace(/[^\d]/g, '').slice(0, 11);
    setFormData(prev => ({ ...prev, cuit: cleanValue }));
    setCuitError('');
    // Resetear validación cuando el usuario cambia el CUIT
    setIsCuitValidated(false);
    setCuitValidado(null);
  };

  const handleValidateCuit = async () => {
    if (!formData.cuit || formData.cuit.length !== 11) {
      setCuitError('El CUIT debe tener 11 dígitos');
      return;
    }

    setValidatingCuit(true);
    setCuitError('');

    try {
      const cleanCuit = formData.cuit.replace(/[^\d]/g, '');
      if (cleanCuit.length !== 11) {
        setCuitError('El CUIT debe tener 11 dígitos');
        return;
      }

      // Validación básica del dígito verificador
      const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
      const digits = cleanCuit.split('').map(Number);
      const sum = digits.slice(0, 10).reduce((acc, digit, index) => acc + digit * factors[index], 0);
      const verifierDigit = 11 - (sum % 11);
      const expectedDigit = verifierDigit >= 10 ? verifierDigit - 11 : verifierDigit;

      if (digits[10] !== expectedDigit) {
        setCuitError('CUIT inválido');
        return;
      }

      // Llamar a la API para validar el CUIT
      const cuitNumber = Number(cleanCuit);
      const validacion = await cotizadorAPI.validarCuit({ CUIT: cuitNumber });

      // Verificar si el estado es "Correcta" (case insensitive)
      const estadoNormalizado = validacion.estado?.toLowerCase() || '';
      const esCorrecta = estadoNormalizado === 'correcta' || estadoNormalizado === 'correcto' || estadoNormalizado === 'ok';

      if (!esCorrecta) {
        setCuitError(validacion.observaciones || 'CUIT no válido');
        setIsCuitValidated(false);
        return;
      }

      // Si el estado es "Correcta", habilitar los campos
      setIsCuitValidated(true);
      setCuitValidado(cuitNumber);

      // Guardar datos del padrón
      if (validacion.empleadoresPadron) {
        setEmpleadoresPadron(validacion.empleadoresPadron);
      }

      // Consultar EmpleadoresPESE y EmpleadoresSiniestros en paralelo
      try {
        const [empleadoresPESEData, empleadoresSiniestrosData, artSellosIIBBData] = await Promise.all([
          cotizadorAPI.getEmpleadoresPESE({ CUIT: cuitNumber }).catch(() => []),
          cotizadorAPI.getEmpleadoresSiniestros({ CUIT: cuitNumber }).catch(() => []),
          cotizadorAPI.getARTSellosIIBB({ CUIT: cuitNumber }),
        ]);

        setEmpleadoresPESE(empleadoresPESEData.length > 0 ? empleadoresPESEData : null);
        setEmpleadoresSiniestros(empleadoresSiniestrosData.length > 0 ? empleadoresSiniestrosData : null);
        setArtSellosIIBB(artSellosIIBBData);

        // Si hay datos del padrón, prellenar campos
        if (validacion.empleadoresPadron) {
          const padron = validacion.empleadoresPadron;
          
          // Cargar jurisdicción desde ARTSellosIIBB usando artSellosIIBBInterno
          let jurisdiccionCodigo: number | '' = formData.jurisdiccion;
          if (padron.artSellosIIBBInterno) {
            const artSello = artSellosIIBBData.find(s => s.interno === padron.artSellosIIBBInterno);
            if (artSello) {
              jurisdiccionCodigo = artSello.jurisdiccion;
            }
          }

          setFormData(prev => ({
            ...prev,
            // Prellenar jurisdicción desde ARTSellosIIBB
            jurisdiccion: jurisdiccionCodigo,
            // Prellenar actividades CIIU si existen
            ciiuPrincipal: padron.ciiuPrincipal ? String(padron.ciiuPrincipal) : prev.ciiuPrincipal,
            ciiuSecundario1: padron.ciiuSecundario1 ? String(padron.ciiuSecundario1) : prev.ciiuSecundario1,
            ciiuSecundario2: padron.ciiuSecundario2 ? String(padron.ciiuSecundario2) : prev.ciiuSecundario2,
            // Prellenar trabajadores declarados si existe promedioTrabajadores
            trabajadoresDeclarados: padron.promedioTrabajadores ? String(padron.promedioTrabajadores) : prev.trabajadoresDeclarados,
            // Prellenar alicuota si existe
            alicuota: padron.alicuota ? String(padron.alicuota) : prev.alicuota,
          }));
        }
      } catch (error) {
        console.error('Error al obtener datos adicionales:', error);
      }
    } catch (error) {
      console.error('Error al validar CUIT:', error);
      setCuitError('Error al validar el CUIT. Por favor, intente nuevamente.');
    } finally {
      setValidatingCuit(false);
    }
  };

  const handleSelectChange = (field: keyof CotizadorFormData) => (
    e: { target: { value: unknown } }
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  // Función helper para obtener la descripción de un CIIU
  const getCIIUDescripcion = (ciiuCode: string | number): string => {
    if (!ciiuCode || !actividadesCIIU) return '';
    const ciiuNum = typeof ciiuCode === 'string' ? Number(ciiuCode) : ciiuCode;
    const actividad = actividadesCIIU.find(a => a.ciiu === ciiuNum);
    return actividad ? `${actividad.ciiu} - ${actividad.descripcion}` : '';
  };

  const handleCheckboxChange = (field: keyof CotizadorFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.checked }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CotizadorFormData, string>> = {};

    if (!formData.cuit || formData.cuit.length !== 11) {
      errors.cuit = 'CUIT es requerido';
    }

    if (!formData.jurisdiccion) {
      errors.jurisdiccion = 'Jurisdicción es requerida';
    }

    if (!formData.actividadCotizacion) {
      errors.actividadCotizacion = 'Actividad a Cotizar es requerida';
    }

    if (!formData.trabajadoresDeclarados) {
      errors.trabajadoresDeclarados = 'Trabajadores declarados es requerido';
    }

    if (!formData.masaSalarial) {
      errors.masaSalarial = 'Masa Salarial es requerida';
    }

    if (!formData.alicuota) {
      errors.alicuota = 'Alicuota es requerida';
    }

    if (!formData.nombre) {
      errors.nombre = 'Nombre es requerido';
    }

    if (!formData.email) {
      errors.email = 'Email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.numeroTelefono) {
      errors.numeroTelefono = 'Número de teléfono es requerido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCotizar = async () => {
    if (!validateForm()) {
      return;
    }

    setIsGeneratingCotizacion(true);

    try {
      // Obtener valores numéricos del formulario
      const cuitNumber = Number(formData.cuit.replace(/[^\d]/g, ''));
      const trabajadoresDeclarados = Number(formData.trabajadoresDeclarados) || 0;
      const masaSalarial = parseFloat(formData.masaSalarial) || 0;
      const alicuotaIngresada = parseFloat(formData.alicuota) || 0;
      const ciiuCotizacion = Number(formData.actividadCotizacion) || 0;

      // Obtener artSellosIIBBInterno desde empleadoresPadron o buscar en artSellosIIBB
      let artSellosIIBBInterno = 0;
      if (empleadoresPadron?.artSellosIIBBInterno) {
        artSellosIIBBInterno = empleadoresPadron.artSellosIIBBInterno;
      } else if (formData.jurisdiccion) {
        const artSello = artSellosIIBB.find(s => s.jurisdiccion === formData.jurisdiccion);
        if (artSello) {
          artSellosIIBBInterno = artSello.interno;
        }
      }

      // Obtener actividades CIIU
      const ciiu1 = Number(formData.ciiuPrincipal) || 0;
      const ciiu2 = Number(formData.ciiuSecundario1) || 0;
      const ciiu3 = Number(formData.ciiuSecundario2) || 0;

      // Determinar el estado: si debeSolicitar retorna true, Estado = 1, si false, Estado = 0
      const actividadesSiniestras = tieneActividadesSiniestras(
        actividadesCIIU,
        formData.ciiuPrincipal,
        formData.ciiuSecundario1,
        formData.ciiuSecundario2
      );

      const indiceSiniestralidad = empleadoresSiniestros && empleadoresSiniestros.length > 0
        ? empleadoresSiniestros[0].indiceSiniestralidad
        : null;

      const debeSolicitarCotizacion = debeSolicitar({
        empleadoresPadron,
        trabajadoresDeclarados,
        alicuotaIngresada,
        validacionPESE: empleadoresPESE,
        actividadesSiniestras,
        indiceSiniestralidad,
      });

      const estado = debeSolicitarCotizacion ? 1 : 0;

      // Construir el objeto CotizacionGenerar
      const cotizacionData: CotizacionGenerarDTO = {
        cuit: cuitNumber,
        artSellosIIBBInterno,
        ciiu1,
        ciiu2,
        ciiu3,
        trabajadoresDeclarados,
        masaSalarial,
        alicuotaActual: empleadoresPadron?.alicuota || 0,
        alicuotaIngresada,
        fechaResicicion: empleadoresPadron?.fechaRescicion || null,
        estado,
        datosContacto: {
          nombre: formData.nombre,
          tipoTelefono: formData.tipoTel,
          numeroTelefono: formData.numeroTelefono,
          email: formData.email,
        },
        ciiuManual: null,
        ciiuCotizacion,
      };

      // Llamar al endpoint POST Cotizaciones/Generar
      const resultado = await cotizadorAPI.generarCotizacion(cotizacionData);

      // Marcar que se realizó la cotización (solo si no es solicitud)
      if (!debeSolicitarCotizacion) {
        setCotizacionRealizada(true);
      }

      // Guardar datos para PDF (solo si no es solicitud)
      if (!debeSolicitarCotizacion) {
        const pdfFormData: CotizadorPDFFormData = {
          nombre: formData.nombre,
          cuit: formData.cuit,
          trabajadoresDeclarados: formData.trabajadoresDeclarados,
          masaSalarial: formData.masaSalarial,
          actividadCotizacion: formData.actividadCotizacion,
          alicuota: formData.alicuota,
          email: formData.email,
        };
        setDatosParaPDF({
          formData: pdfFormData,
          resultado,
        });
      }

      // Mostrar modal con el resultado
      setResultadoCotizacion({
        open: true,
        resultado,
        esSolicitud: debeSolicitarCotizacion,
        error: null,
      });

      console.log('Cotización generada:', resultado);
    } catch (error: any) {
      console.error('Error al generar cotización:', error);
      
      // Extraer mensaje de error
      let errorMessage = 'Error al generar la cotización. Por favor, intente nuevamente.';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setResultadoCotizacion({
        open: true,
        resultado: null,
        esSolicitud: false,
        error: errorMessage,
      });
    } finally {
      setIsGeneratingCotizacion(false);
    }
  };

  const handleImprimir = () => {
    if (!datosParaPDF || !datosParaPDF.resultado) {
      return;
    }

    // Mostrar el modal de vista previa del PDF
    setMostrarPreviewPDF(true);
  };

  const handleEnviarMail = () => {
    if (!resultadoCotizacion.resultado || !datosParaPDF) {
      return;
    }
    setMostrarEmailModal(true);
  };

  const handleNuevaCotizacion = () => {
    setFormData(initialFormData);
    setCuitError('');
    setFormErrors({});
    setIsCuitValidated(false);
    setCuitValidado(null);
    setArtSellosIIBB([]);
    setEmpleadoresPadron(null);
    setEmpleadoresPESE(null);
    setEmpleadoresSiniestros(null);
    setCotizacionRealizada(false);
  };

  // Calcular si debe mostrar "SOLICITAR" en lugar de "COTIZAR"
  const actividadesSiniestras = tieneActividadesSiniestras(
    actividadesCIIU,
    formData.ciiuPrincipal,
    formData.ciiuSecundario1,
    formData.ciiuSecundario2
  );

  const indiceSiniestralidad = empleadoresSiniestros && empleadoresSiniestros.length > 0
    ? empleadoresSiniestros[0].indiceSiniestralidad
    : null;

  const debeMostrarSolicitar = debeSolicitar({
    empleadoresPadron,
    trabajadoresDeclarados: formData.trabajadoresDeclarados,
    alicuotaIngresada: formData.alicuota,
    validacionPESE: empleadoresPESE,
    actividadesSiniestras,
    indiceSiniestralidad,
  });

  return (
    <>
      <CotizacionResultadoModal
        open={resultadoCotizacion.open}
        onClose={() => setResultadoCotizacion({ open: false, resultado: null, esSolicitud: false, error: null })}
        resultado={resultadoCotizacion.resultado}
        esSolicitud={resultadoCotizacion.esSolicitud}
        error={resultadoCotizacion.error}
        onImprimir={handleImprimir}
        onEnviarEmail={handleEnviarMail}
      />
      {datosParaPDF && datosParaPDF.resultado && (
        <>
          <CotizadorPDFPreview
            open={mostrarPreviewPDF}
            onClose={() => setMostrarPreviewPDF(false)}
            resultado={datosParaPDF.resultado}
            formData={{
              nombre: datosParaPDF.formData.nombre,
              cuit: datosParaPDF.formData.cuit,
              trabajadoresDeclarados: datosParaPDF.formData.trabajadoresDeclarados,
              masaSalarial: datosParaPDF.formData.masaSalarial,
              actividadCotizacion: datosParaPDF.formData.actividadCotizacion,
              alicuota: datosParaPDF.formData.alicuota,
            }}
            actividadesCIIU={actividadesCIIU}
            artSellosIIBB={artSellosIIBB}
            empleadoresPadron={empleadoresPadron}
            ffepImporte={ultimoFFEP?.importe}
          />
          <CotizadorEmailModal
            open={mostrarEmailModal}
            onClose={() => setMostrarEmailModal(false)}
            resultado={datosParaPDF.resultado}
            formData={{
              nombre: datosParaPDF.formData.nombre,
              cuit: datosParaPDF.formData.cuit,
              trabajadoresDeclarados: datosParaPDF.formData.trabajadoresDeclarados,
              masaSalarial: datosParaPDF.formData.masaSalarial,
              actividadCotizacion: datosParaPDF.formData.actividadCotizacion,
              alicuota: datosParaPDF.formData.alicuota,
              email: formData.email,
            }}
            actividadesCIIU={actividadesCIIU}
            artSellosIIBB={artSellosIIBB}
            empleadoresPadron={empleadoresPadron}
            ffepImporte={ultimoFFEP?.importe}
          />
        </>
      )}
      <div className={styles.formContainer}>
      <Grid container spacing={2}>
        {/* CUIT y Validar */}
        <Grid size={8}>
          <TextField
            label="CUIT"
            value={formData.cuit ? formatCUIT(formData.cuit) : ''}
            onChange={handleCuitChange}
            error={!!cuitError || !!formErrors.cuit}
            helperText={cuitError || formErrors.cuit || 'Ingrese el CUIT'}
            fullWidth
            inputProps={{
              inputMode: 'numeric',
            }}
          />
        </Grid>
        <Grid size={4}>
          <CustomButton
            onClick={handleValidateCuit}
            isLoading={validatingCuit}
            width="100%"
            color="primary"
          >
            VALIDAR
          </CustomButton>
        </Grid>

        {/* Denominación (mostrar entre CUIT y VALIDAR) */}
        {empleadoresPadron?.denominacion && (
          <Grid size={12}>
            <TextField
              label="Razón Social"
              value={empleadoresPadron.denominacion}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
        )}

        {/* Jurisdicción */}
        <Grid size={12}>
          <FormControl fullWidth error={!!formErrors.jurisdiccion} disabled={!isCuitValidated || isLoadingArtSellosIIBB}>
            <InputLabel>Jurisdiccion</InputLabel>
            <Select
              value={formData.jurisdiccion}
              onChange={handleSelectChange('jurisdiccion')}
              label="Jurisdiccion"
              disabled={!isCuitValidated || isLoadingArtSellosIIBB}
            >
              <MenuItem value="" disabled>
                Seleccionar...
              </MenuItem>
              {artSellosIIBB.map((artSello) => (
                <MenuItem key={artSello.interno} value={artSello.jurisdiccion}>
                  {artSello.provincia}
                </MenuItem>
              ))}
            </Select>
            {formErrors.jurisdiccion && (
              <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                {formErrors.jurisdiccion}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Actividad Principal */}
        <Grid size={12}>
          <TextField
            label="Actividad Principal"
            value={formData.ciiuPrincipal ? getCIIUDescripcion(formData.ciiuPrincipal) || formData.ciiuPrincipal : ''}
            fullWidth
            InputProps={{
              readOnly: true,
            }}
          />
        </Grid>

        {/* Actividad Secundaria */}
        <Grid size={12}>
          <TextField
            label="Actividad Secundaria"
            value={formData.ciiuSecundario1 ? getCIIUDescripcion(formData.ciiuSecundario1) || formData.ciiuSecundario1 : ''}
            fullWidth
            InputProps={{
              readOnly: true,
            }}
          />
        </Grid>

        {/* Actividad Terciaria*/}
        <Grid size={12}>
          <TextField
            label="Actividad Terciaria"
            value={formData.ciiuSecundario2 ? getCIIUDescripcion(formData.ciiuSecundario2) || formData.ciiuSecundario2 : ''}
            fullWidth
            InputProps={{
              readOnly: true,
            }}
          />
        </Grid>

        {/* Select de Actividades */}
        <Grid size={12}>
          <CustomSelectSearch<CIIUIndicesDTO>
            options={(actividadesCIIU || []).filter(act => act.utilizadoPorArt === true)}
            getOptionLabel={(option) => {
              if (!option) return '';
              return `${option.ciiu} - ${option.descripcion}`;
            }}
            filterOptions={(options, { inputValue }) => {
              if (!inputValue) return options;
              const searchTerm = inputValue.toLowerCase().trim();
              return options.filter((option) => {
                const codigoMatch = String(option.ciiu).includes(searchTerm);
                const descripcionMatch = option.descripcion.toLowerCase().includes(searchTerm);
                return codigoMatch || descripcionMatch;
              });
            }}
            label="Actividad a Cotizar*"
            placeholder="Buscar por código CIIU o descripción..."
            disabled={!isCuitValidated || isLoadingActividades}
            noOptionsText="No se encontraron actividades"
            loadingText="Cargando actividades..."
            value={
              actividadesCIIU?.find(
                (act) =>
                  act.utilizadoPorArt === true &&
                  String(act.ciiu) === formData.actividadCotizacion
              ) || null
            }
            onChange={(event, newValue: CIIUIndicesDTO | null) => {
              setFormData(prev => ({
                ...prev,
                actividadCotizacion: newValue ? String(newValue.ciiu) : '',
              }));
              clearFieldError('actividadCotizacion');
            }}
            error={!!formErrors.actividadCotizacion}
            helperText={formErrors.actividadCotizacion}
          />
        </Grid>

        {/* Trabajadores Declarados */}
        <Grid size={6}>
          <TextField
            label="Trabajadores Declarados*"
            value={formData.trabajadoresDeclarados}
            onChange={handleTextFieldChange('trabajadoresDeclarados')}
            error={!!formErrors.trabajadoresDeclarados}
            helperText={formErrors.trabajadoresDeclarados || '(Promedio de los últimos 12 meses)'}
            fullWidth
            type="number"
            disabled={!isCuitValidated}
          />
        </Grid>

        {/* Masa Salarial */}
        <Grid size={6}>
          <TextField
            label="Masa Salarial*"
            value={formData.masaSalarial ? Formato.Moneda(parseFloat(formData.masaSalarial) || 0) : ''}
            onChange={handleMasaSalarialChange}
            error={!!formErrors.masaSalarial}
            helperText={formErrors.masaSalarial || '(Promedio de los últimos 12 meses)'}
            fullWidth
            disabled={!isCuitValidated}
            inputProps={{ inputMode: 'numeric' }}
          />
        </Grid>

        {/* Nombre y Email */}
        <Grid size={6}>
          <TextField
            label="Nombre"
            value={formData.nombre}
            onChange={handleTextFieldChange('nombre')}
            error={!!formErrors.nombre}
            helperText={formErrors.nombre}
            fullWidth
            disabled={!isCuitValidated}
          />
        </Grid>
        <Grid size={6}>
          <TextField
            label="Email"
            value={formData.email}
            onChange={handleTextFieldChange('email')}
            error={!!formErrors.email}
            helperText={formErrors.email}
            fullWidth
            type="email"
            disabled={!isCuitValidated}
          />
        </Grid>

        {/* Tipo Tel y Número Teléfono */}
        <Grid size={4}>
          <FormControl fullWidth disabled={!isCuitValidated}>
            <InputLabel>Tipo Tel</InputLabel>
            <Select
              value={formData.tipoTel}
              onChange={handleSelectChange('tipoTel')}
              label="Tipo Tel"
              disabled={!isCuitValidated}
            >
              <MenuItem value="Celular">Celular</MenuItem>
              <MenuItem value="Fijo">Fijo</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={8}>
          <TextField
            label="Numero Telefono"
            value={formData.numeroTelefono}
            onChange={handleTextFieldChange('numeroTelefono')}
            error={!!formErrors.numeroTelefono}
            helperText={formErrors.numeroTelefono}
            fullWidth
            placeholder="0"
            disabled={!isCuitValidated}
          />
        </Grid>

        {/* Alicuota y Botones de acción */}
        <Grid size={3}>
          <TextField
            label="Alicuota*"
            value={formData.alicuota}
            onChange={handleTextFieldChange('alicuota')}
            error={!!formErrors.alicuota}
            helperText={formErrors.alicuota}
            fullWidth
            type="number"
            disabled={!isCuitValidated}
          />
        </Grid>
        <Grid size={9}>
          <div className={styles.actionsContainer}>
            <CustomButton
              onClick={handleCotizar}
              color="secondary"
              width="fit-content"
              disabled={!isCuitValidated || isGeneratingCotizacion}
              isLoading={isGeneratingCotizacion}
            >
              {debeMostrarSolicitar ? 'SOLICITAR' : 'COTIZAR'}
            </CustomButton>
            <CustomButton
              onClick={handleNuevaCotizacion}
              color="primary"
              width="fit-content"
            >
              NUEVA COTIZACIÓN
            </CustomButton>
          </div>
        </Grid>

        {/* Disclaimer */}
        <Grid size={12}>
          <Typography variant="h5" className={styles.disclaimer}>
            Compará la alícuota que te ofrecemos con la que estas pagando
          </Typography>
        </Grid>
      </Grid>
    </div>
    </>
  );
};

