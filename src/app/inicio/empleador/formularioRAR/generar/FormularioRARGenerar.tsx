'use client';
import React from 'react';
import { TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import Formato from '@/utils/Formato';
import CustomButton from '@/utils/ui/button/CustomButton';
import DataTableImport from '@/utils/ui/table/DataTable';
import CustomModal from '@/utils/ui/form/CustomModal';
import CustomModalMessage from '@/utils/ui/message/CustomModalMessage';
import ArtAPI from '@/data/artAPI';
import styles from './FormularioRARGenerar.module.css';

import ExcelImportSection from './ExcelImportSection';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

const cuipFormatter = (v: any) => Formato.CUIP(v);

const normalizarCuil = (v: string) => (v || '').replace(/\D/g, '');

interface CrearProps {
  cuit: number;
  internoEstablecimiento?: number; // opcional en creación
  referenteDatos?: unknown;
  finalizaCarga: (ret?: boolean) => void;
  formulariosRAR?: any[]; // opcional
  editarId?: number; // interno del formulario a editar (si existe)
  replicaDe?: number; // interno del formulario a replicar (si existe)
  razonSocial?: string; // razón social de la empresa seleccionada
}

type OpcionEstablecimiento = { interno: string; domicilioCalle: string; displayText: string };
type OpcionAgente = { interno: number; codigo: number; agenteCausante: string; agenteTipo: string; displayText: string };

const FormularioRARCrear: React.FC<CrearProps> = ({
  cuit,
  internoEstablecimiento = 0,
  finalizaCarga,
  formulariosRAR = [],
  editarId = 0,
  replicaDe = 0,
  razonSocial,
}) => {
  // encabezado
  const [cuitActual, setCuitActual] = React.useState<string>(String(cuit || ''));
  const [razonSocialActual, setRazonSocialActual] = React.useState<string>(razonSocial || '');

  // establecimientos y agentes
  const [opcionesEstablecimientos, setOpcionesEstablecimientos] = React.useState<OpcionEstablecimiento[]>([]);
  const [agentesCausantes, setAgentesCausantes] = React.useState<OpcionAgente[]>([]);
  const [cargandoSelects, setCargandoSelects] = React.useState<boolean>(false);

  // selección establecimiento (usamos el **id** como value del Select)
  const [establecimientoSeleccionado, setEstablecimientoSeleccionado] = React.useState<string>('');
  const displayEstablecimiento =
    opcionesEstablecimientos.find((o) => o.interno === establecimientoSeleccionado)?.displayText || '';

  // cantidades
  const [cantExpuestos, setCantExpuestos] = React.useState<string>('');
  const [cantNoExpuestos, setCantNoExpuestos] = React.useState<string>('');
  const [generar, setGenerar] = React.useState<boolean>(false);
  const [totalTrabajadores, setTotalTrabajadores] = React.useState<number>(0);

  // modal - Se abre automáticamente al cargar el componente
  const [modalTrabajadorOpen, setModalTrabajadorOpen] = React.useState<boolean>(true);
  const esModoEdicionFormulario = editarId > 0;
  const esModoReplicaFormulario = replicaDe > 0;

  // trabajadores
  const [cuil, setCuil] = React.useState<string>('');
  const [nombre, setNombre] = React.useState<string>('');
  const [sector, setSector] = React.useState<string>('');
  const [ingreso, setIngreso] = React.useState<string>('');
  const [fechaInicio, setFechaInicio] = React.useState<string>('');
  const [exposicion, setExposicion] = React.useState<string>('0'); // Valor predeterminado "0"
  const [fechaFinExposicion, setFechaFinExposicion] = React.useState<string>('');
  const [ultimoExamenMedico, setUltimoExamenMedico] = React.useState<string>('');
  const [codigoAgente, setCodigoAgente] = React.useState<string>('');
  const [filas, setFilas] = React.useState<any[]>([]);

  // Modal de mensajes (errores/alertas)
  const [modalMessageOpen, setModalMessageOpen] = React.useState<boolean>(false);
  const [modalMessageText, setModalMessageText] = React.useState<string>('');
  const [modalMessageType, setModalMessageType] = React.useState<'success' | 'error' | 'warning'>('error');
  const [modalMessageTitle, setModalMessageTitle] = React.useState<string>('');

  // Estados para edición
  const [editandoIndex, setEditandoIndex] = React.useState<number>(-1);
  const [modoEdicion, setModoEdicion] = React.useState<boolean>(false);

  // Estado para consulta de CUIL
  const [consultandoCuil, setConsultandoCuil] = React.useState<boolean>(false);

  // Estados para errores de validación del trabajador
  const [erroresCampos, setErroresCampos] = React.useState<{
    cuil: string;
    nombre: string;
    sector: string;
    ingreso: string;
    fechaInicio: string;
    fechaFinExposicion: string;
    exposicion: string;
    ultimoExamenMedico: string;
    codigoAgente: string;
  }>({
    cuil: '',
    nombre: '',
    sector: '',
    ingreso: '',
    fechaInicio: '',
    fechaFinExposicion: '',
    exposicion: '',
    ultimoExamenMedico: '',
    codigoAgente: ''
  });

    // Estado para mostrar errores
  const [mensajeError, setMensajeError] = React.useState<string>('');

  // Filtro por CUIL en la tabla de trabajadores cargados
  const [filtroCuil, setFiltroCuil] = React.useState<string>('');

  const guardandoRef = React.useRef(false);

  // ===== Funciones para manejo de trabajadores =====
  // Función para editar un trabajador
  const handleEditarTrabajador = React.useCallback((index: number) => {
    const trabajador = filas[index];
    if (!trabajador) return;

    // Cargar los datos del trabajador en el formulario
    setCuil(trabajador.CUIL || '');
    setNombre(trabajador.Nombre || '');
    setSector(trabajador.SectorTareas || '');
    setIngreso(trabajador.Ingreso || '');
    setFechaInicio(trabajador.FechaInicio || '');
    setExposicion(trabajador.Exposicion || '');
    setFechaFinExposicion(trabajador.FechaFinExposicion || '');
    setUltimoExamenMedico(trabajador.UltimoExamenMedico || '');
    setCodigoAgente(trabajador.CodigoAgente || '');

    // Activar modo edición
    setEditandoIndex(index);
    setModoEdicion(true);
  }, [filas]);

  // Función para eliminar un trabajador
  const handleEliminarTrabajador = React.useCallback((index: number) => {
    setFilas(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ===== Configuración de columnas para DataTable =====
  const columnasTabla = React.useMemo(() => [
    {
      accessorKey: 'CUILDisplay',
      header: 'CUIL',
      size: 120,
    },
    {
      accessorKey: 'Nombre',
      header: 'Nombre',
      size: 180,
    },
    {
      accessorKey: 'SectorTareas',
      header: 'Sector/Tareas',
      size: 140,
    },
    {
      accessorKey: 'IngresoDisplay',
      header: 'F. Ingreso',
      size: 100,
    },
    {
      accessorKey: 'FechaInicioDisplay',
      header: 'F. Inicio',
      size: 100,
    },
    {
      accessorKey: 'Exposicion',
      header: 'Horas de Exposición',
      size: 90,
      meta: { align: 'center' }
    },
    {
      accessorKey: 'FechaFinExposicionDisplay',
      header: 'F. Fin Exposición',
      size: 100,
    },
    {
      accessorKey: 'UltimoExamenMedicoDisplay',
      header: 'Últ. Examen',
      size: 100,
    },
    {
      accessorKey: 'AgenteCausanteDisplay',
      header: 'Cód. Agente',
      size: 150,
    },
    {
      id: 'acciones',
      header: 'Acciones',
      size: 100,
      cell: ({ row }: any) => {
        const index = filas.findIndex(fila =>
          fila.CUIL === row.original.CUIL &&
          fila.Nombre === row.original.Nombre
        );

        return (
          <div className={styles.accionesContainer}>
            <EditIcon
              onClick={() => handleEditarTrabajador(index)}
              style={{
                fontSize: '16px',
                color: modoEdicion && editandoIndex !== index ? '#ccc' : '#2196f3',
                cursor: modoEdicion && editandoIndex !== index ? 'not-allowed' : 'pointer',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e: any) => {
                if (!modoEdicion || editandoIndex === index) {
                  e.target.style.color = '#ff9800';
                }
              }}
              onMouseLeave={(e: any) => {
                if (!modoEdicion || editandoIndex === index) {
                  e.target.style.color = '#2196f3';
                } else {
                  e.target.style.color = '#ccc';
                }
              }}
            />
            <DeleteIcon
              onClick={() => !modoEdicion && handleEliminarTrabajador(index)}
              style={{
                fontSize: '16px',
                color: modoEdicion ? '#ccc' : '#f44336',
                cursor: modoEdicion ? 'not-allowed' : 'pointer',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e: any) => {
                if (!modoEdicion) {
                  e.target.style.color = '#d32f2f';
                }
              }}
              onMouseLeave={(e: any) => {
                if (!modoEdicion) {
                  e.target.style.color = '#f44336';
                } else {
                  e.target.style.color = '#ccc';
                }
              }}
            />
          </div>
        );
      },
      meta: { align: 'center' }
    }
  ], [filas, modoEdicion, editandoIndex, handleEditarTrabajador, handleEliminarTrabajador]);

  const filasTabla = React.useMemo(() => {
    return filas.map((f) => ({
      ...f,
      CUILDisplay: f.CUIL ? Formato.CUIP(f.CUIL.replace(/\D/g, '')) : '',
      IngresoDisplay: f.Ingreso ? Formato.Fecha(f.Ingreso, 'DD/MM/YYYY') : '',
      FechaInicioDisplay: f.FechaInicio ? Formato.Fecha(f.FechaInicio, 'DD/MM/YYYY') : '',
      FechaFinExposicionDisplay: f.FechaFinExposicion ? Formato.Fecha(f.FechaFinExposicion, 'DD/MM/YYYY') : '',
      UltimoExamenMedicoDisplay: f.UltimoExamenMedico ? Formato.Fecha(f.UltimoExamenMedico, 'DD/MM/YYYY') : '',
    }));
  }, [filas]);

  const filasTablaFiltradas = filtroCuil
    ? filasTabla.filter(f => normalizarCuil(f.CUIL).startsWith(normalizarCuil(filtroCuil)))
    : filasTabla;

  // ===== Helpers =====
  const numerosValidos = (v: string) => {
    const valor = (v ?? '').trim();
    if (valor === '') return false;
    const num = Number(valor);
    return !Number.isNaN(num) && num >= 0 && Number.isInteger(num) && num <= 99999;
  };
  const manejarCambioNumerico = (valor: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const limpio = (valor ?? '').replace(/[^0-9]/g, '');
    if (limpio.length <= 5) setter(limpio);
  };
  const trabajadorCompleto = React.useMemo(() => {
    // Verificar cada campo individualmente
    const cuilCompleto = cuil && cuil.trim() !== '' && cuil.replace(/\D/g, '').length >= 11;
    const nombreCompleto = nombre && nombre.trim() !== '';
    const sectorCompleto = sector && sector.trim() !== '';
    const ingresoCompleto = ingreso && ingreso.trim() !== '';
    const esNoExpuestoSinFechas = Number(exposicion) === 0 && Number(cantNoExpuestos) > 0;
    const fechaInicioCompleto = esNoExpuestoSinFechas || (fechaInicio && fechaInicio.trim() !== '');
    const exposicionCompleto = exposicion && exposicion.trim() !== '';
    const ultimoExamenMedicoCompleto = esNoExpuestoSinFechas || (ultimoExamenMedico && ultimoExamenMedico.trim() !== '');
    const codigoAgenteCompleto = (codigoAgente && codigoAgente.trim() !== '') || (Number(exposicion) === 0 && Number(cantNoExpuestos) > 0);

    const resultado = cuilCompleto && nombreCompleto && sectorCompleto &&
      ingresoCompleto && fechaInicioCompleto && exposicionCompleto &&
      ultimoExamenMedicoCompleto && codigoAgenteCompleto;

    console.log(' Validación trabajadorCompleto DETALLADA:', {
      cuilCompleto: { valor: cuil, completo: cuilCompleto, longitud: cuil ? cuil.replace(/\D/g, '').length : 0 },
      nombreCompleto: { valor: nombre, completo: nombreCompleto },
      sectorCompleto: { valor: sector, completo: sectorCompleto },
      ingresoCompleto: { valor: ingreso, completo: ingresoCompleto },
      fechaInicioCompleto: { valor: fechaInicio, completo: fechaInicioCompleto },
      exposicionCompleto: { valor: exposicion, completo: exposicionCompleto },
      ultimoExamenMedicoCompleto: { valor: ultimoExamenMedico, completo: ultimoExamenMedicoCompleto },
      codigoAgenteCompleto: { valor: codigoAgente, completo: codigoAgenteCompleto },
      resultado: resultado
    });

    return resultado;
  }, [cuil, nombre, sector, ingreso, fechaInicio, exposicion, ultimoExamenMedico, codigoAgente, cantNoExpuestos]);

  const puedeGenerar =
    (establecimientoSeleccionado || '').trim() !== '' &&
    numerosValidos(cantExpuestos) &&
    numerosValidos(cantNoExpuestos);

  // Verificar si hay establecimiento seleccionado para habilitar siguiente paso
  const establecimientoSeleccionadoValido = (establecimientoSeleccionado || '').trim() !== '';

  // Validación para cantidades completas (requisito esencial)
  const cantidadesCompletas =
    establecimientoSeleccionadoValido &&
    numerosValidos(cantExpuestos) &&
    numerosValidos(cantNoExpuestos) &&
    (Number(cantExpuestos) + Number(cantNoExpuestos)) > 0;

  // Calcular total de trabajadores requeridos (EXPUESTOS + NO EXPUESTOS)
  const totalTrabajadoresRequeridos = cantidadesCompletas
    ? (Number(cantExpuestos) + Number(cantNoExpuestos))
    : 0;

  const cuilsUnicos = React.useMemo(() => {
    const set = new Set<string>();
    filas.forEach((f) => {
      const n = normalizarCuil(f.CUIL);
      if (n) set.add(n);
    });
    return set;
  }, [filas]);

  const trabajadoresCargados = cuilsUnicos.size;
  const faltanTrabajadores = totalTrabajadoresRequeridos - trabajadoresCargados;

  // Contadores únicos por tipo (expuestos / no expuestos)
  const contadoresUnicosPorTipo = React.useMemo(() => {
    const expSet = new Set<string>();
    const noExpSet = new Set<string>();
    filas.forEach((f) => {
      const n = normalizarCuil(f.CUIL);
      if (!n) return;
      const horas = Number(f.Exposicion || 0);
      if (horas === 0) noExpSet.add(n); else expSet.add(n);
    });
    return { expuestosUnicos: expSet.size, noExpuestosUnicos: noExpSet.size, expSet, noExpSet } as any;
  }, [filas]);

  const esCuilRepetido = React.useMemo(() => {
    const cuilNum = normalizarCuil(cuil);
    if (!cuilNum) return false;
    return filas.some((f) => normalizarCuil(f.CUIL) === cuilNum);
  }, [cuil, filas]);

  // Verificar si el CUIL ya existe con exposición = 0
  const cuilExisteConExposicionCero = React.useMemo(() => {
    const cuilNum = normalizarCuil(cuil);
    if (!cuilNum) return false;
    return filas.some((f) => {
      const cuilFila = normalizarCuil(f.CUIL);
      const exposicionFila = Number(f.Exposicion || 0);
      return cuilFila === cuilNum && exposicionFila === 0;
    });
  }, [cuil, filas]);

  const puedeCargarTrabajador = React.useMemo(() => {

    if (!cantidadesCompletas || !trabajadorCompleto) return false;

    if (totalTrabajadoresRequeridos <= 0) return false;

    // Si el CUIL ya existe con exposición = 0, no se puede volver a cargar
    if (cuilExisteConExposicionCero) return false;

    // Si no se alcanzó el límite, puede cargar cualquier CUIL (nuevo o existente, excepto los que ya tienen exposición 0)
    if (trabajadoresCargados < totalTrabajadoresRequeridos) return true;

    // Si ya se alcanzó el límite, solo puede cargar si el CUIL ya existe (repetir con diferente agente)
    // Pero no si ya tiene exposición = 0
    return esCuilRepetido && !cuilExisteConExposicionCero;
  }, [
    cantidadesCompletas,
    trabajadorCompleto,
    totalTrabajadoresRequeridos,
    trabajadoresCargados,
    esCuilRepetido,
    cuilExisteConExposicionCero,
  ]);



  // Console para debuggear totales
  console.log(' Cantidades:', {
    cantExpuestos,
    cantNoExpuestos,
    totalTrabajadoresRequeridos,
    trabajadoresCargados,
    faltanTrabajadores,
    cantidadesCompletas
  });

  // Nueva validación para el modal completo
  const puedeGuardarCompleto =
    (establecimientoSeleccionado || '').trim() !== '' &&
    cantidadesCompletas &&
    trabajadoresCargados >= totalTrabajadoresRequeridos &&
    !modoEdicion;

  // ===== Carga inicial: encabezado + selects =====
  React.useEffect(() => {
    // Prioridad 1: Si viene razonSocial como prop (empresa seleccionada), usarla
    if (razonSocial) {
      setRazonSocialActual(razonSocial);
    }
    
    // Actualizar CUIT con el valor del prop (que puede venir de empresa seleccionada)
    setCuitActual(String(cuit || ''));
    
    // Encabezado: si tenés datos en el listado padre, tomamos el CUIT/Razón Social de ahí
    // (solo si no hay empresa seleccionada explícitamente)
    if (!razonSocial) {
      const fila = formulariosRAR.find((f) => (f.cuit || f.CUIT) && (f.razonSocial || f.RazonSocial));
      if (fila) {
        setCuitActual(String(fila.cuit || fila.CUIT || cuit || ''));
        setRazonSocialActual(String(fila.razonSocial || fila.RazonSocial || ''));
      }
    }
  }, [cuit, formulariosRAR, razonSocial]);

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      if (!esModoEdicionFormulario || editarId <= 0) return;
      try {
        console.log(' MODO EDICIÓN: cargando formulario existente', editarId);
        const data = await ArtAPI.getFormularioRARById(editarId);
        if (cancel) return;

        // Cantidades
        setCantExpuestos(String(data.cantTrabajadoresExpuestos || 0));
        setCantNoExpuestos(String(data.cantTrabajadoresNoExpuestos || 0));

        // Establecimiento (interno)
        if (data.internoEstablecimiento) {
          setEstablecimientoSeleccionado(String(data.internoEstablecimiento));
        }

        // Detalle trabajadores
        if (Array.isArray(data.formularioRARDetalle)) {
          const filasMap = data.formularioRARDetalle.map((d: any) => ({
            CUIL: String(d.cuil || ''),
            Nombre: d.nombre || '',
            SectorTareas: d.sectorTarea || '',
            Ingreso: d.fechaIngreso ? dayjs(d.fechaIngreso).format('YYYY-MM-DD') : '',
            FechaInicio: d.fechaInicioExposicion ? dayjs(d.fechaInicioExposicion).format('YYYY-MM-DD') : '',
            Exposicion: String(d.horasExposicion ?? 0),
            FechaFinExposicion: d.fechaFinExposicion ? dayjs(d.fechaFinExposicion).format('YYYY-MM-DD') : '',
            UltimoExamenMedico: d.fechaUltimoExamenMedico ? dayjs(d.fechaUltimoExamenMedico).format('YYYY-MM-DD') : '',
            CodigoAgente: String(d.codigoAgente || ''),
            AgenteCausanteDisplay: String(d.codigoAgente || ''),
          }));
          setFilas(filasMap);
        }
      } catch (e) {
        console.error(' Error cargando datos para edición:', e);
      }
    })();
    return () => { cancel = true; };
  }, [editarId, esModoEdicionFormulario]);


  // Cargar datos para modo réplica
React.useEffect(() => {
  let cancel = false;
  (async () => {
    if (!esModoReplicaFormulario || replicaDe <= 0) return;
    try {
      const data = await ArtAPI.getFormularioRARById(replicaDe);
      if (cancel) return;

      // Cantidades
      setCantExpuestos(String(data.cantTrabajadoresExpuestos || 0));
      setCantNoExpuestos(String(data.cantTrabajadoresNoExpuestos || 0));

      // Establecimiento (interno)
      if (data.internoEstablecimiento) {
        setEstablecimientoSeleccionado(String(data.internoEstablecimiento));
      }

      if (Array.isArray(data.formularioRARDetalle)) {
        const filasMap = data.formularioRARDetalle.map((d: any) => ({
          CUIL: String(d.cuil || ''),
          Nombre: d.nombre || '',
          SectorTareas: d.sectorTarea || '',
          Ingreso: d.fechaIngreso ? dayjs(d.fechaIngreso).format('YYYY-MM-DD') : '',
          FechaInicio: d.fechaInicioExposicion ? dayjs(d.fechaInicioExposicion).format('YYYY-MM-DD') : '',
          Exposicion: String(d.horasExposicion ?? 0),
          FechaFinExposicion: d.fechaFinExposicion ? dayjs(d.fechaFinExposicion).format('YYYY-MM-DD') : '',
          UltimoExamenMedico: d.fechaUltimoExamenMedico ? dayjs(d.fechaUltimoExamenMedico).format('YYYY-MM-DD') : '',
          CodigoAgente: String(d.codigoAgente || ''),
          AgenteCausanteDisplay: String(d.codigoAgente || ''),
        }));
        setFilas(filasMap);
      }
    } catch (e) {
      console.log("Error carga replica", e);
    }
  })();
  return () => { cancel = true; };
}, [replicaDe, esModoReplicaFormulario]);


  React.useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setCargandoSelects(true);

        // Validar CUIT
        const cuitParaUsar = cuitActual || cuit;

        if (!cuitParaUsar || cuitParaUsar === 0 || String(cuitParaUsar).trim() === '' || String(cuitParaUsar).trim() === '0') {
          if (!cancel) {
            setOpcionesEstablecimientos([]);
            setCargandoSelects(false);
          }
          return;
        }

        // Establecimientos (por CUIT del usuario logueado)
        const establecimientos = await ArtAPI.establecimientoList({ cuit: Number(cuitParaUsar), Activos: true });

        console.log(' Respuesta establecimientos:', establecimientos);

        const estArr = Array.isArray(establecimientos) ? establecimientos : [];

        console.log(' Array procesado:', estArr);

        const opciones: OpcionEstablecimiento[] = estArr
          .filter((est: any) => est && (est.nroSucursal || est.domicilioCalle || est.interno))
          .map((est: any) => {
            const nro = est.nroSucursal ?? est.interno ?? '';
            const direccion = [est.domicilioCalle, est.domicilioNro].filter(Boolean).join(' ');
            return {
              interno: String(est.interno ?? ''),
              domicilioCalle: String(est.domicilioCalle ?? ''),
              displayText: `${nro}${direccion ? ' - ' + direccion : ''}`.trim()
            } as OpcionEstablecimiento;
          });

        console.log(' Opciones finales:', opciones);

        if (!cancel) setOpcionesEstablecimientos(opciones);

        // Preselección si viene por props
        if (!cancel && internoEstablecimiento && String(internoEstablecimiento) !== '0' && opciones.length > 0) {
          const existe = opciones.some(o => o.interno === String(internoEstablecimiento));
          if (existe) setEstablecimientoSeleccionado(String(internoEstablecimiento));
        }

        // Agentes
        try {
          const agArr = await ArtAPI.getAgentesCausantes();
          const opcionesAgentes: OpcionAgente[] = agArr
            .filter(a => a.codigo || a.agenteCausante)
            .map(a => ({
              interno: a.interno,
              codigo: a.codigo,
              agenteCausante: a.agenteCausante,
              agenteTipo: a.agenteTipo,
              displayText: `${a.codigo || 'S/C'} - ${a.agenteCausante || 'Sin descripción'}`
            }));
          if (!cancel) setAgentesCausantes(opcionesAgentes);
        } catch (e) {
          console.error('Error cargando agentes causantes:', e);
        }
      } catch (e) {
        console.error('Error cargando establecimientos:', e);
        if (!cancel) {
          setOpcionesEstablecimientos([]);
        }
      } finally {
        if (!cancel) setCargandoSelects(false);
      }
    })();
    return () => { cancel = true; };
  }, [cuit, cuitActual, internoEstablecimiento]);

  // ===== Efecto para manejar lógica de exposición y agente causante =====
  React.useEffect(() => {
    const exposicionNum = Number(exposicion) || 0;

    if (exposicionNum === 0) {

      setCodigoAgente('1');
      console.log(' Agente automático para exposición 0: código 1 seleccionado');
    } else if (exposicionNum > 0) {
      // Si exposición > 0, limpiar la selección para que el usuario pueda elegir
      if (codigoAgente === '1') {
        setCodigoAgente('');
        console.log(' Limpiando selección automática del agente código 1 para permitir selección manual');
      }
    }
  }, [exposicion, agentesCausantes, codigoAgente, cantNoExpuestos]);

  // ===== Función para consultar datos por CUIL =====
  const consultarDatosPorCuil = React.useCallback(async (cuilCompleto: string) => {
    // Limpiar CUIL y verificar que tenga 11 dígitos
    const cuilNumerico = cuilCompleto.replace(/\D/g, '');
    if (cuilNumerico.length !== 11) {
      return;
    }

    setConsultandoCuil(true);

    try {
      console.log(' Consultando CUIL:', cuilNumerico);

      const url = `https://api.artmutualrural.org.ar:8182/api/AfiliadoDatos/BuscarPorCUILSimple?pCUIL=${cuilNumerico}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (response.ok) {
        const datos = await response.json();
        console.log(' Datos obtenidos:', datos);

        // Si tiene nombre, completar automáticamente
        if (datos && datos.Nombre && datos.Nombre.trim() !== '') {
          setNombre(datos.Nombre.trim());
          console.log(' Nombre completado automáticamente:', datos.Nombre);
        } else {
          console.log(' No se encontró nombre en la respuesta');
        }
      } else {
        console.log(' Error en la consulta:', response.status, response.statusText);
      }
    } catch (error) {
      console.error(' Error consultando CUIL:', error);
    } finally {
      setConsultandoCuil(false);
    }
  }, []);

  // ===== Helper para determinar si el agente causante debe estar habilitado =====
  const agenteCausanteHabilitado = cantidadesCompletas && Number(exposicion) > 0;
  const exposicionEsCero = Number(exposicion) === 0;
  const noExpuestoSinFechas = exposicionEsCero && Number(cantNoExpuestos) > 0;

  // ===== Función para validar campos y actualizar errores =====
  const validarCamposTrabajador = React.useCallback(() => {
    const nuevosErrores = {
      cuil: '',
      nombre: '',
      sector: '',
      ingreso: '',
      fechaInicio: '',
      fechaFinExposicion: '',
      exposicion: '',
      ultimoExamenMedico: '',
      codigoAgente: ''
    };

    // Validar CUIL
    if (!cuil || cuil.trim() === '') {
      nuevosErrores.cuil = 'El CUIL es requerido';
    } else if (cuil.replace(/\D/g, '').length < 11) {
      nuevosErrores.cuil = 'El CUIL debe tener 11 dígitos';
    }

    // Validar Nombre
    if (!nombre || nombre.trim() === '') {
      nuevosErrores.nombre = 'El nombre completo es requerido';
    }

    // Validar Sector
    if (!sector || sector.trim() === '') {
      nuevosErrores.sector = 'El sector/tareas es requerido';
    }

    // Validar Fecha de Ingreso
    if (!ingreso || ingreso.trim() === '') {
      nuevosErrores.ingreso = 'La fecha de ingreso es requerida';
    }

    const esNoExpuestoSinFechas = Number(exposicion) === 0 && Number(cantNoExpuestos) > 0;

    // Validar Fecha Inicio Exposición
    if (!esNoExpuestoSinFechas && (!fechaInicio || fechaInicio.trim() === '')) {
      nuevosErrores.fechaInicio = 'La fecha de inicio de exposición es requerida';
    }

    const fechaCargaFormulario = dayjs().format('YYYY-MM-DD');

    if (ingreso && ingreso > fechaCargaFormulario) {
      nuevosErrores.ingreso = 'La fecha de ingreso debe ser menor o igual a la fecha de carga del formulario RAR';
    }

    if (!esNoExpuestoSinFechas && fechaInicio && ingreso && fechaInicio < ingreso) {
      nuevosErrores.fechaInicio = 'La fecha inicio exposición debe ser mayor o igual a la fecha de ingreso';
    }

    if (ultimoExamenMedico && ingreso && ultimoExamenMedico <= ingreso) {
      nuevosErrores.ultimoExamenMedico = 'La fecha del último examen médico debe ser posterior a la fecha de ingreso';
    }

    if (!esNoExpuestoSinFechas && fechaFinExposicion && fechaInicio && fechaFinExposicion < fechaInicio) {
      nuevosErrores.fechaFinExposicion = 'La fecha fin exposición debe ser mayor o igual a la fecha inicio exposición';
    }

    // Validar Nivel de Exposición
    if (!exposicion || exposicion.trim() === '') {
      nuevosErrores.exposicion = 'El nivel de exposición es requerido';
    } else if (isNaN(Number(exposicion)) || Number(exposicion) < 0) {
      nuevosErrores.exposicion = 'Debe ser un número mayor o igual a 0';
    }

    // Validar Último Examen Médico
    if (!esNoExpuestoSinFechas && (!ultimoExamenMedico || ultimoExamenMedico.trim() === '')) {
      nuevosErrores.ultimoExamenMedico = 'La fecha del último examen médico es requerida';
    }

    // Validar Código Agente (solo si la exposición es mayor a 0)
    if (Number(exposicion) > 0 && (!codigoAgente || codigoAgente.trim() === '')) {
      nuevosErrores.codigoAgente = 'Debe seleccionar un agente causante cuando la exposición es mayor a 0';
    }

    setErroresCampos(nuevosErrores);

    // Retornar si hay errores
    return Object.values(nuevosErrores).some(error => error !== '');
  }, [cuil, nombre, sector, ingreso, fechaInicio, fechaFinExposicion, exposicion, ultimoExamenMedico, codigoAgente]);

  // ===== Handlers =====

  const handleCargarFila = () => {
    console.log(' handleCargarFila iniciado');
    console.log(' Estado de campos:', {
      cuil,
      nombre,
      sector,
      ingreso,
      fechaInicio,
      exposicion,
      ultimoExamenMedico,
      codigoAgente,
      trabajadorCompleto
    });

    if (!modoEdicion && !puedeCargarTrabajador) {
      console.log(' No se puede cargar trabajador: límite alcanzado o datos incompletos');
      return;
    }

    // Si estamos en modo edición, usar la función de guardar edición
    if (modoEdicion) {
      console.log(' Modo edición activo, ejecutando handleGuardarEdicion');
      handleGuardarEdicion();
      return;
    }

    // Validar campos y mostrar errores
    const hayErrores = validarCamposTrabajador();
    if (hayErrores) {
      console.log(' Trabajador incompleto con errores de validación');
      return;
    }

    const cuilNum = normalizarCuil(cuil);
    const yaExisteCuil = filas.some((f) => normalizarCuil(f.CUIL) === cuilNum);

    // Verificar si el CUIL ya existe con exposición = 0
    const existeConExposicionCero = filas.some((f) => {
      const cuilFila = normalizarCuil(f.CUIL);
      const exposicionFila = Number(f.Exposicion || 0);
      return cuilFila === cuilNum && exposicionFila === 0;
    });

    // Si el trabajador ya existe con exposición = 0, no se puede volver a cargar
    if (existeConExposicionCero) {
      setModalMessageType('error');
      setModalMessageTitle('CUIL en uso');
      setModalMessageText(`El cuil ${normalizarCuil(cuil)} ya fue cargado como trabajador no expuesto`);
      setModalMessageOpen(true);
      // Reiniciar todos los campos del formulario según la solicitud
      setCuil('');
      setNombre('');
      setSector('');
      setIngreso('');
      setFechaInicio('');
      setExposicion('0');
      setFechaFinExposicion('');
      setUltimoExamenMedico('');
      setCodigoAgente('');
      setErroresCampos({
        cuil: '', nombre: '', sector: '', ingreso: '', fechaInicio: '', fechaFinExposicion: '', exposicion: '', ultimoExamenMedico: '', codigoAgente: ''
      });
      setModoEdicion(false);
      setEditandoIndex(-1);
      return;
    }

    // Si ya se alcanzó el límite de trabajadores únicos y el CUIL no existe, bloquear
    if (trabajadoresCargados >= totalTrabajadoresRequeridos && !yaExisteCuil) {
      setModalMessageType('error');
      setModalMessageTitle('');
      setModalMessageText(`Ya se alcanzó el límite de ${totalTrabajadoresRequeridos} trabajadores únicos. Solo puede agregar trabajadores con CUILs ya cargados (con diferentes agentes causantes).`);
      setModalMessageOpen(true);
      return;
    }

    // Validación por tipo (expuestos / no expuestos) contando trabajadores únicos por CUIL
    try {
      const { expuestosUnicos, noExpuestosUnicos, expSet, noExpSet } = contadoresUnicosPorTipo as any;
      const horasNum = Number(exposicion || 0);
      // Si es NO expuesto
      if (horasNum === 0) {
        const yaEnNoExp = noExpSet.has(cuilNum);
        if (!yaEnNoExp && Number(cantNoExpuestos) >= 0 && noExpuestosUnicos >= Number(cantNoExpuestos)) {
          setModalMessageType('error');
          setModalMessageTitle('Límite alcanzado');
          setModalMessageText(`Ya se alcanzó la cantidad indicada de ${cantNoExpuestos} trabajadores NO expuestos.`);
          setModalMessageOpen(true);
          return;
        }
      } else {
        // Expuesto
        const yaEnExp = expSet.has(cuilNum);
        if (!yaEnExp && Number(cantExpuestos) >= 0 && expuestosUnicos >= Number(cantExpuestos)) {
          setModalMessageType('error');
          setModalMessageTitle('Límite alcanzado');
          setModalMessageText(`Ya se alcanzó la cantidad indicada de ${cantExpuestos} trabajadores expuestos.`);
          setModalMessageOpen(true);
          return;
        }
      }
    } catch (e) {
      console.warn('Error validación por tipo:', e);
    }



    const agente = agentesCausantes.find((a) => String(a.codigo) === (codigoAgente || '').trim());

    const nuevoTrabajador = {
      CUIL: (cuil || '').trim(),
      Nombre: (nombre || '').trim(),
      SectorTareas: (sector || '').trim(),
      Ingreso: (ingreso || '').trim(),
      FechaInicio: (fechaInicio || '').trim(),
      Exposicion: (exposicion || '').trim(),
      FechaFinExposicion: (fechaFinExposicion || '').trim(),
      UltimoExamenMedico: (ultimoExamenMedico || '').trim(),
      CodigoAgente: (codigoAgente || '').trim(),
      AgenteCausanteDisplay: agente
        ? agente.displayText
        : (codigoAgente || '').trim() === '1'
          ? '1 - No Expuesto'
          : (codigoAgente || '').trim(),
    };

    console.log(' Cargando trabajador:', nuevoTrabajador);

    setFilas((prev) => {
      const nuevasFilas = [...prev, nuevoTrabajador];
      console.log('👥 DEBUG - Filas actualizadas:', nuevasFilas);
      return nuevasFilas;
    });

    // limpiar campos pero mantener modal abierto
    setCuil('');
    setNombre('');
    setSector('');
    setIngreso('');
    setFechaInicio('');
    setExposicion('0'); // Volver al valor por defecto
    setFechaFinExposicion('');
    setUltimoExamenMedico('');
    setCodigoAgente('');

  };



  // Función para guardar la edición
  const handleGuardarEdicion = () => {
    // Validar campos y mostrar errores
    const hayErrores = validarCamposTrabajador();
    if (hayErrores) {
      return;
    }

    if (editandoIndex < 0) return;

    const cuilNum = normalizarCuil(cuil);
    const yaExisteCuil = filas.some((f, idx) => 
      idx !== editandoIndex && normalizarCuil(f.CUIL) === cuilNum
    );

    // Obtener el CUIL del trabajador que estamos editando
    const trabajadorEditando = filas[editandoIndex];
    const cuilEditando = trabajadorEditando ? normalizarCuil(trabajadorEditando.CUIL) : null;
    const cuilCambio = cuilNum !== cuilEditando;
    const exposicionActual = Number(exposicion || 0);

    // Verificar si el CUIL ya existe con exposición = 0 (excluyendo el trabajador que estamos editando)
    const existeConExposicionCero = filas.some((f, idx) => {
      if (idx === editandoIndex) return false; // Excluir el trabajador que estamos editando
      const cuilFila = normalizarCuil(f.CUIL);
      const exposicionFila = Number(f.Exposicion || 0);
      return cuilFila === cuilNum && exposicionFila === 0;
    });

    // Si estamos intentando cambiar a un CUIL que ya tiene exposición = 0, bloquear
    if (existeConExposicionCero) {
      setModalMessageType('error');
      setModalMessageTitle('CUIL en uso');
      setModalMessageText(`El cuil ${normalizarCuil(cuil)} ya fue cargado como trabajador no expuesto`);
      setModalMessageOpen(true);
      // Reiniciar campos al intentar editar hacia un CUIL no expuesto ya existente
      setCuil('');
      setNombre('');
      setSector('');
      setIngreso('');
      setFechaInicio('');
      setExposicion('0');
      setFechaFinExposicion('');
      setUltimoExamenMedico('');
      setCodigoAgente('');
      setErroresCampos({
        cuil: '', nombre: '', sector: '', ingreso: '', fechaInicio: '', fechaFinExposicion: '', exposicion: '', ultimoExamenMedico: '', codigoAgente: ''
      });
      setModoEdicion(false);
      setEditandoIndex(-1);
      return;
    }

    // Si estamos intentando cambiar la exposición a 0 y el CUIL ya existe con exposición = 0, bloquear
    if (exposicionActual === 0 && yaExisteCuil) {
      const otroTrabajadorConExposicionCero = filas.some((f, idx) => {
        if (idx === editandoIndex) return false;
        const cuilFila = normalizarCuil(f.CUIL);
        const exposicionFila = Number(f.Exposicion || 0);
        return cuilFila === cuilNum && exposicionFila === 0;
      });
      
      if (otroTrabajadorConExposicionCero) {
        setModalMessageType('error');
        setModalMessageText(`Ya existe otro trabajador con este CUIL (${cuil}) y horas de exposición = 0. No se puede editar para tener exposición 0.`);
        setModalMessageOpen(true);
        return;
      }
    }

    // Si estamos cambiando el CUIL y ya se alcanzó el límite, verificar que el nuevo CUIT ya exista
    if (cuilCambio && trabajadoresCargados >= totalTrabajadoresRequeridos && !yaExisteCuil) {
      setModalMessageType('error');
      setModalMessageText(`Ya se alcanzó el límite de ${totalTrabajadoresRequeridos} trabajadores únicos. Solo puede usar CUILs ya cargados.`);
      setModalMessageOpen(true);
      return;
    }

    // Validación por tipo al editar (si se cambia tipo o CUIL único)
    try {
      const { expuestosUnicos, noExpuestosUnicos, expSet, noExpSet } = contadoresUnicosPorTipo as any;
      const prevHoras = trabajadorEditando ? Number(trabajadorEditando.Exposicion || 0) : 0;
      const newHoras = Number(exposicion || 0);

      // Si estamos pasando de expuesto a NO expuesto y el CUIL sería uno nuevo en NO expuestos
      if (prevHoras > 0 && newHoras === 0) {
        const yaEnNoExp = noExpSet.has(cuilNum);
        if (!yaEnNoExp && noExpuestosUnicos >= Number(cantNoExpuestos)) {
          setModalMessageType('error');
          setModalMessageText(`No se puede editar: ya se alcanzó la cantidad de ${cantNoExpuestos} NO expuestos.`);
          setModalMessageOpen(true);
          return;
        }
      }

      // Si estamos pasando de NO expuesto a expuesto y el CUIL sería uno nuevo en expuestos
      if (prevHoras === 0 && newHoras > 0) {
        const yaEnExp = expSet.has(cuilNum);
        if (!yaEnExp && expuestosUnicos >= Number(cantExpuestos)) {
          setModalMessageType('error');
          setModalMessageText(`No se puede editar: ya se alcanzó la cantidad de ${cantExpuestos} expuestos.`);
          setModalMessageOpen(true);
          return;
        }
      }

      // Si el CUIL cambia y el nuevo CUIL sería uno nuevo en su tipo, validar límites
      if (cuilCambio) {
        const newIsNoExp = newHoras === 0;
        if (newIsNoExp) {
          const yaEnNoExp = noExpSet.has(cuilNum);
          if (!yaEnNoExp && noExpuestosUnicos >= Number(cantNoExpuestos)) {
            setModalMessageType('error');
            setModalMessageText(`No se puede cambiar el CUIL: límite de NO expuestos alcanzado (${cantNoExpuestos}).`);
            setModalMessageOpen(true);
            return;
          }
        } else {
          const yaEnExp = expSet.has(cuilNum);
          if (!yaEnExp && expuestosUnicos >= Number(cantExpuestos)) {
            setModalMessageType('error');
            setModalMessageText(`No se puede cambiar el CUIL: límite de expuestos alcanzado (${cantExpuestos}).`);
            setModalMessageOpen(true);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Error validación por tipo en edición:', e);
    }

    const agente = agentesCausantes.find((a) => String(a.codigo) === codigoAgente.trim());

    // Actualizar el trabajador en la posición editandoIndex
    setFilas((prev) => {
      const nuevasFilas = [...prev];
      nuevasFilas[editandoIndex] = {
        CUIL: cuil.trim(),
        Nombre: nombre.trim(),
        SectorTareas: sector.trim(),
        Ingreso: ingreso.trim(),
        FechaInicio: fechaInicio.trim(),
        Exposicion: exposicion.trim(),
        FechaFinExposicion: fechaFinExposicion.trim(),
        UltimoExamenMedico: ultimoExamenMedico.trim(),
        CodigoAgente: codigoAgente.trim(),
        AgenteCausanteDisplay: agente
          ? agente.displayText
          : codigoAgente.trim() === '1'
            ? '1 - No Expuesto'
            : codigoAgente.trim(),
      };
      return nuevasFilas;
    });

    // Limpiar y salir del modo edición
    handleCancelarEdicion();
  };

  // Función para cancelar la edición
  const handleCancelarEdicion = () => {
    setCuil('');
    setNombre('');
    setSector('');
    setIngreso('');
    setFechaInicio('');
    setExposicion('0'); // Volver al valor por defecto
    setFechaFinExposicion('');
    setUltimoExamenMedico('');
    setCodigoAgente('');
    setEditandoIndex(-1);
    setModoEdicion(false);
  };

  // Nueva función para guardar directamente desde el modal completo
  const handleGuardarCompleto = async () => {
    console.log(' Iniciando handleGuardarCompleto (ahora permite guardar incompleto)');
    console.log('📊 DEBUG - Estado actual:', {
      puedeGuardarCompleto,
      cantExpuestos,
      cantNoExpuestos,
      establecimientoSeleccionado,
      filas: filas.length,
      totalTrabajadoresRequeridos,
      trabajadoresCargados: filas.length
    });

    const total = Number(cantExpuestos) + Number(cantNoExpuestos);

    const toIsoOrEmpty = (value: any) => {
      const raw = String(value ?? '').trim();
      if (!raw) return '';
      const parsed = dayjs(raw);
      return parsed.isValid() ? parsed.toISOString() : '';
    };

    if (guardandoRef.current) return;
    guardandoRef.current = true;

    try {
      const fechaActual = dayjs().toISOString();
      const establecimientoParaEnvio = Number(establecimientoSeleccionado) || 0;

      console.log(' Datos básicos:', {
        fechaActual,
        establecimientoParaEnvio,
        filasCargadas: filas
      });

      console.log('🔍 CRÍTICO - Estado de filas antes de map:', {
        filasLength: filas.length,
        filasCompletas: JSON.stringify(filas, null, 2)
      });

      // USAR TODOS LOS TRABAJADORES DE LA TABLA, NO SOLO LOS CAMPOS DEL MODAL
      const formularioRARDetalle = filas.map((f, index) => {
        const rawHoras = String(f.Exposicion ?? '').replace(/[^\d]/g, '').trim();
        const nHoras = Number(rawHoras);
        const horasParsed = rawHoras === '' ? 0 : (Number.isFinite(nHoras) ? nHoras : 0);

        const trabajador = {
          internoFormulariosRar: 0,
          cuil: Number(String(f.CUIL || '').replace(/\D/g, '') || 0),
          nombre: f.Nombre || '',
          sectorTarea: f.SectorTareas || '',
          fechaIngreso: toIsoOrEmpty(f.Ingreso),
          fechaUltimoExamenMedico: toIsoOrEmpty(f.UltimoExamenMedico),
          codigoAgente: Number(f.CodigoAgente) || 1,
          fechaInicioExposicion: toIsoOrEmpty(f.FechaInicio),
          fechaFinExposicion: toIsoOrEmpty(f.FechaFinExposicion),
          horasExposicion: horasParsed
        };

        console.log(`👤 DEBUG - Trabajador ${index + 1}:`, trabajador);
        return trabajador;
      });

      const payload = {
        cantTrabajadoresExpuestos: Number(cantExpuestos) || 0,
        cantTrabajadoresNoExpuestos: Number(cantNoExpuestos) || 0,
        fechaCreacion: fechaActual,
        // Si el formulario está completo mandamos la fecha actual, sino mandamos null
        fechaPresentacion: puedeGuardarCompleto ? fechaActual : null,
        internoPresentacion: 0,
        internoEstablecimiento: establecimientoParaEnvio,
        formularioRARDetalle: formularioRARDetalle,
      };

      console.log(' Payload completo:', JSON.stringify(payload, null, 2));

      console.log('📤 CRÍTICO - Payload final antes de fetch:', {
        formularioRARDetalle_length: payload.formularioRARDetalle.length,
        payload_completo: JSON.stringify(payload, null, 2)
      });

      console.log(' Enviando POST request...');

      let responseData: any = null;

      if (esModoEdicionFormulario) {
        responseData = await ArtAPI.putFormularioRAR(editarId, payload);
      } else {
        responseData = await ArtAPI.postFormularioRAR(payload);
      }

      console.log(' Respuesta exitosa:', responseData);

      // Mostrar mensaje de éxito y preguntar qué hacer


      if (!esModoEdicionFormulario) {
        // Cerrar modal y volver a la lista (después de crear un nuevo formulario)
        setModalTrabajadorOpen(false);
        // Opcional: limpiar el estado local antes de regresar
        setCuil(''); setNombre(''); setSector(''); setIngreso('');
        setFechaInicio(''); setExposicion('0'); setFechaFinExposicion('');
        setUltimoExamenMedico(''); setCodigoAgente('');
        setCantExpuestos(''); setCantNoExpuestos('');
        setEstablecimientoSeleccionado('');
        setFilas([]);
        setEditandoIndex(-1);
        setModoEdicion(false);
        // Informar al padre para que vuelva a la lista y recargue
        finalizaCarga(true);
      } else {
        // Cerrar modal y volver a la lista para edición
        setModalTrabajadorOpen(false);
        finalizaCarga(true);
      }
    } catch (e: any) {
      console.error(' Error al guardar (handleGuardarCompleto):', e);
      console.error(' Stack trace:', e.stack);
    } finally {
      guardandoRef.current = false;
    }
  };

  const handleGuardar = async () => {

    const toIsoOrEmpty = (value: any) => {
      const raw = String(value ?? '').trim();
      if (!raw) return '';
      const parsed = dayjs(raw);
      return parsed.isValid() ? parsed.toISOString() : '';
    };

    if (guardandoRef.current) return;
    guardandoRef.current = true;

    try {
      const fechaActual = dayjs().toISOString();
      const establecimientoParaEnvio = Number(establecimientoSeleccionado) || Number(internoEstablecimiento) || 0;

      const formularioRARDetalle = filas.map((f) => {
        const rawHoras = String(f.Exposicion ?? '').replace(/[^\d]/g, '').trim();
        const nHoras = Number(rawHoras);
        const horasParsed = rawHoras === '' ? 0 : (Number.isFinite(nHoras) ? nHoras : 0);

        const trabajador: any = {
          internoFormulariosRar: 0,
          cuil: Number(String(f.CUIL || '').replace(/\D/g, '') || 0),
          nombre: f.Nombre || '',
          sectorTarea: f.SectorTareas || '',
          fechaIngreso: toIsoOrEmpty(f.Ingreso),
          fechaUltimoExamenMedico: toIsoOrEmpty(f.UltimoExamenMedico),
          codigoAgente: Number(f.CodigoAgente) || 1,
          fechaInicioExposicion: toIsoOrEmpty(f.FechaInicio),
          fechaFinExposicion: toIsoOrEmpty(f.FechaFinExposicion),
        };
        trabajador.horasExposicion = horasParsed;

        return trabajador;
      });

      const payload = {
        cantTrabajadoresExpuestos: Number(cantExpuestos) || 0,
        cantTrabajadoresNoExpuestos: Number(cantNoExpuestos) || 0,
        fechaCreacion: fechaActual,
        fechaPresentacion: puedeGuardarCompleto ? fechaActual : null,
        internoPresentacion: 0,
        internoEstablecimiento: establecimientoParaEnvio,
        formularioRARDetalle: formularioRARDetalle,
      };

      await ArtAPI.postFormularioRAR(payload);


      finalizaCarga(true);
    } catch (e: any) {
      console.error('Error al guardar:', e);

    } finally {
      guardandoRef.current = false;
    }
  };

  const llegoAlTope = generar && totalTrabajadores > 0 && filas.length >= totalTrabajadores;

  // ===== UI =====
  return (
    <div className={styles.wrapperCol}>


      {/* MODAL COMPLETO - Establecimiento + Cantidades + Trabajador */}
      <CustomModal
        open={modalTrabajadorOpen}
        onClose={() => {
          // Cerrar modal y redirigir a la pantalla principal (igual que botón Cancelar)
          setModalTrabajadorOpen(false);
          // Limpiar todos los campos del formulario
          setCuil(''); setNombre(''); setSector(''); setIngreso('');
          setFechaInicio(''); setExposicion('0'); setFechaFinExposicion('');
          setUltimoExamenMedico(''); setCodigoAgente('');
          setCantExpuestos(''); setCantNoExpuestos('');
          setEstablecimientoSeleccionado('');
          setFilas([]);
          setEditandoIndex(-1);
          setModoEdicion(false);
          // Redirigir a la pantalla principal
          finalizaCarga(false);
        }}
        title={esModoEdicionFormulario ? `Editar Formulario RAR #${editarId}` : 'Formulario RAR'}
        size="large"
      >
        <div className={styles.modalGridCol}>
          {/* SECCIÓN 0: INFORMACIÓN DEL EMPLEADOR */}
          <div className={styles.empleadorInfo}>
            <h4 className={styles.empleadorInfoTitle}>Datos del Empleador</h4>
            <div className={styles.empleadorInfoGrid}>
              <div className={styles.empleadorInfoItem}>
                <strong>CUIT:</strong> {cuipFormatter(cuitActual) || 'No disponible'}
              </div>
              <div className={styles.empleadorInfoItem}>
                <strong>Razón Social:</strong> {razonSocialActual || 'No disponible'}
              </div>
            </div>
          </div>

          {/* SECCIÓN 1: SELECTOR DE ESTABLECIMIENTO */}
          <div className={styles.establecimientoSection}>
            <h4 className={styles.establecimientoTitle}>
              Selección de Establecimiento
              <span className={styles.requiredAsterisk}>*</span>
            </h4>
            <div className={styles.modalRow}>
              <FormControl fullWidth required className={styles.flex1}>
                <InputLabel>Establecimiento</InputLabel>
                <Select
                  value={establecimientoSeleccionado}
                  onChange={(e) => setEstablecimientoSeleccionado(e.target.value)}
                  label="Establecimiento"
                  disabled={cargandoSelects}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {cargandoSelects ? (
                    <MenuItem disabled value="">
                      Cargando establecimientos...
                    </MenuItem>
                  ) : opcionesEstablecimientos.length === 0 ? (
                    <MenuItem disabled value="">
                      No hay establecimientos disponibles
                    </MenuItem>
                  ) : (
                    opcionesEstablecimientos.map((est) => (
                      <MenuItem key={est.interno} value={est.interno}>
                        {est.displayText}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </div>
            </div>

                      {/* SECCIÓN 1.5: IMPORTACIÓN DE TRABAJADORES DESDE EXCEL */}
          <ExcelImportSection
            establecimientoSeleccionadoValido={establecimientoSeleccionadoValido}
            agentesCausantes={agentesCausantes}
            filas={filas}
            cantExpuestos={cantExpuestos}
            cantNoExpuestos={cantNoExpuestos}
            onFilasActualizadas={setFilas}
            onCantExpuestosActualizada={setCantExpuestos}
            onCantNoExpuestosActualizada={setCantNoExpuestos}
            fechaCargaFormulario={dayjs().format('YYYY-MM-DD')}
            onMensajeError={(mensaje) => {
              setMensajeError(mensaje);
              setModalMessageType('error');
              setModalMessageText(mensaje);
              setModalMessageOpen(true);
            }}
          />




          {/* SECCIÓN 2: CANTIDADES DE TRABAJADORES */}
            <div className={styles.modalRow}>
              <TextField
                label="Cantidad de Trabajadores Expuestos"
                name="cantExpuestos"
                type="text"
                value={cantExpuestos}
                onChange={(e) => manejarCambioNumerico(e.target.value, setCantExpuestos)}
                fullWidth
                required
                disabled={!establecimientoSeleccionadoValido}
                className={`${styles.centeredInput} ${styles.flex1}`}
                error={cantExpuestos !== '' && !numerosValidos(cantExpuestos)}
                helperText={cantExpuestos !== '' && !numerosValidos(cantExpuestos) ? 'Ingrese un número válido (0-99999)' : ''}
              />
              <TextField
                label="Cantidad de Trabajadores NO Expuestos"
                name="cantNoExpuestos"
                type="text"
                value={cantNoExpuestos}
                onChange={(e) => manejarCambioNumerico(e.target.value, setCantNoExpuestos)}
                fullWidth
                required
                disabled={!establecimientoSeleccionadoValido}
                className={`${styles.centeredInput} ${styles.flex1}`}
                error={cantNoExpuestos !== '' && !numerosValidos(cantNoExpuestos)}
                helperText={cantNoExpuestos !== '' && !numerosValidos(cantNoExpuestos) ? 'Ingrese un número válido (0-99999)' : ''}
              />
            </div>
            {(cantExpuestos || cantNoExpuestos) && (
              <div className={styles.totalResumen}>
                <strong>Total de Trabajadores: {(Number(cantExpuestos) || 0) + (Number(cantNoExpuestos) || 0)}</strong>
              </div>
            )}

          {/* SECCIÓN 3: DATOS DEL TRABAJADOR */}
          <div className={cantidadesCompletas ? styles.trabajadorSection : styles.trabajadorSectionDisabled}>
            <h4 className={cantidadesCompletas ? styles.trabajadorTitle : styles.trabajadorTitleDisabled}>
              Datos del Trabajador
              {!cantidadesCompletas && (
                <span className={styles.trabajadorSubtitle}>
                  (Completá primero las cantidades de trabajadores)
                </span>
              )}
            </h4>
            {/* FILA 1: CUIL y Nombre */}
            <div className={`${styles.modalRow} ${styles.modalRowSpaced}`}>
              <TextField
                label="CUIL"
                name="cuil"
                value={cuil}
                onChange={(e) => {
                  if (!cantidadesCompletas) return;
                  const value = (e.target.value || '').replace(/[^0-9]/g, '');
                  if (value.length <= 11) {
                    let f = value;
                    if (value.length > 2) f = value.substring(0, 2) + '-' + value.substring(2);
                    if (value.length > 10) f = value.substring(0, 2) + '-' + value.substring(2, 10) + '-' + value.substring(10);
                    setCuil(f);

                    // Limpiar error al escribir
                    if (erroresCampos.cuil) {
                      setErroresCampos(prev => ({ ...prev, cuil: '' }));
                    }

                    // Si el CUIL está completo (11 dígitos), consultar datos automáticamente
                    if (value.length === 11) {
                      // Primero, verificar si ya existe en las filas cargadas
                      const cuilDigits = value;
                      const filaExistente = filas.find((fi) => normalizarCuil(fi.CUIL) === cuilDigits);

                      if (filaExistente) {
                        const exposicionFila = Number(filaExistente.Exposicion || 0);
                        if (exposicionFila === 0) {
                          // Mostrar mensaje con título personalizado y reiniciar campos si ya existe como NO expuesto
                          setModalMessageType('error');
                          setModalMessageTitle('CUIL en uso');
                          setModalMessageText(`El cuil ${cuilDigits} ya fue cargado como trabajador no expuesto`);
                          setModalMessageOpen(true);
                          setCuil('');
                          setNombre('');
                          setSector('');
                          setIngreso('');
                          setFechaInicio('');
                          setExposicion('0');
                          setFechaFinExposicion('');
                          setUltimoExamenMedico('');
                          setCodigoAgente('');
                          setErroresCampos({ cuil: '', nombre: '', sector: '', ingreso: '', fechaInicio: '', fechaFinExposicion: '', exposicion: '', ultimoExamenMedico: '', codigoAgente: '' });
                          setModoEdicion(false);
                          setEditandoIndex(-1);
                        } else {
                          // Completar los demás campos con los datos previamente ingresados
                          setNombre(filaExistente.Nombre || '');
                          setSector(filaExistente.SectorTareas || '');
                          setIngreso(filaExistente.Ingreso || '');
                          setUltimoExamenMedico(filaExistente.UltimoExamenMedico || '');
                          console.log('CUIL repetido detectado, campos autocompletados desde fila existente:', filaExistente);
                        }
                      } else {
                        // Si no existe localmente, consultar servicio externo para completar el nombre
                        consultarDatosPorCuil(f);
                      }
                    }
                  }
                }}
                fullWidth
                required
                disabled={!cantidadesCompletas}
                placeholder={cantidadesCompletas ? "XX-XXXXXXXX-X" : "Completá primero las cantidades"}
                inputProps={{ maxLength: 13 }}
                className={styles.flex1}
                style={{ marginRight: '15px' }}
                error={!!erroresCampos.cuil}
              />
              <TextField
                label={consultandoCuil ? "Nombre Completo (Consultando...)" : "Nombre Completo"}
                name="nombre"
                value={nombre}
                onChange={(e) => {
                  if (cantidadesCompletas && !consultandoCuil) {
                    setNombre(e.target.value);
                    // Limpiar error al escribir
                    if (erroresCampos.nombre) {
                      setErroresCampos(prev => ({ ...prev, nombre: '' }));
                    }
                  }
                }}
                fullWidth
                required
                disabled={!cantidadesCompletas || consultandoCuil}
                placeholder={
                  !cantidadesCompletas
                    ? "Completá primero las cantidades"
                    : consultandoCuil
                      ? "Consultando datos..."
                      : "Se completará automáticamente al ingresar CUIL o ingresalo manualmente"
                }
                className={styles.flex1}
                error={!!erroresCampos.nombre}
                helperText={
                  erroresCampos.nombre ||
                  (consultandoCuil ? "🔍 Consultando datos del afiliado..." : "")
                }
              />
            </div>

            {/* FILA 2: Sector y Fecha de Ingreso */}
            <div className={`${styles.modalRow} ${styles.modalRowSpaced}`}>
              <TextField
                label="Sector/Tareas"
                name="sector"
                value={sector}
                onChange={(e) => {
                  if (cantidadesCompletas) {
                    setSector(e.target.value);
                    // Limpiar error al escribir
                    if (erroresCampos.sector) {
                      setErroresCampos(prev => ({ ...prev, sector: '' }));
                    }
                  }
                }}
                fullWidth
                required
                disabled={!cantidadesCompletas}
                placeholder={cantidadesCompletas ? "Descripción del sector o tareas realizadas" : "Completá primero las cantidades"}
                className={styles.flex1}
                style={{ marginRight: '15px' }}
                error={!!erroresCampos.sector}
                helperText={erroresCampos.sector}
              />
              <TextField
                label="Fecha de Ingreso"
                name="ingreso"
                type="date"
                value={ingreso}
                onChange={(e) => {
                  if (cantidadesCompletas) {
                    setIngreso(e.target.value);
                    // Limpiar error al escribir
                    if (erroresCampos.ingreso) {
                      setErroresCampos(prev => ({ ...prev, ingreso: '' }));
                    }
                  }
                }}
                fullWidth
                required
                disabled={!cantidadesCompletas}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: dayjs().format('YYYY-MM-DD') }}
                className={styles.flex1}
                error={!!erroresCampos.ingreso}
                helperText={erroresCampos.ingreso}
              />
            </div>

            {/* FILA 3: Fecha Inicio Exposición y Tipo de Exposición */}
            <div className={`${styles.modalRow} ${styles.modalRowSpaced}`}>
              <TextField
                label="Fecha Inicio Exposición"
                name="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  if (cantidadesCompletas) {
                    setFechaInicio(e.target.value);
                    // Limpiar error al escribir
                    if (erroresCampos.fechaInicio) {
                      setErroresCampos(prev => ({ ...prev, fechaInicio: '' }));
                    }
                  }
                }}
                fullWidth
                required={!noExpuestoSinFechas}
                disabled={!cantidadesCompletas || noExpuestoSinFechas}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: noExpuestoSinFechas ? undefined : ingreso || undefined
                }}
                className={styles.flex1}
                style={{ marginRight: '15px' }}
                error={!!erroresCampos.fechaInicio}
                helperText={erroresCampos.fechaInicio}
              />
              <TextField
                label="Horas de Exposición"
                name="exposicion"
                type="number"
                value={exposicion}
                onChange={(e) => {
                  if (cantidadesCompletas) {
                    const valor = e.target.value;
                    // Solo permitir números enteros >= 0
                    if (valor === '' || (/^\d+$/.test(valor) && Number(valor) >= 0)) {
                      setExposicion(valor);
                      // Limpiar error al escribir
                      if (erroresCampos.exposicion) {
                        setErroresCampos(prev => ({ ...prev, exposicion: '' }));
                      }
                    }
                  }
                }}
                fullWidth
                required
                disabled={!cantidadesCompletas}
                placeholder={cantidadesCompletas ? "Ingresá el nivel de exposición (0 = no expuesto)" : "Completá primero las cantidades"}
                className={styles.flex1}
                inputProps={{
                  min: 0,
                  step: 1
                }}
                error={!!erroresCampos.exposicion}
                helperText={erroresCampos.exposicion}
              />
            </div>

            {/* FILA 4: Fecha Fin Exposición y Último Examen Médico */}
            <div className={`${styles.modalRow} ${styles.modalRowSpaced}`}>
              <TextField
                label="Fecha Fin Exposición (Opcional)"
                name="fechaFinExposicion"
                type="date"
                value={fechaFinExposicion}
                onChange={(e) => {
                  if (cantidadesCompletas) {
                    setFechaFinExposicion(e.target.value);
                    if (erroresCampos.fechaFinExposicion) {
                      setErroresCampos(prev => ({ ...prev, fechaFinExposicion: '' }));
                    }
                  }
                }}
                fullWidth
                disabled={!cantidadesCompletas || noExpuestoSinFechas}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: noExpuestoSinFechas ? undefined : fechaInicio || undefined
                }}
                className={styles.flex1}
                style={{ marginRight: '15px' }}
                error={!!erroresCampos.fechaFinExposicion}
                helperText={erroresCampos.fechaFinExposicion}
              />
              <TextField
                label="Último Examen Médico"
                name="ultimoExamenMedico"
                type="date"
                value={ultimoExamenMedico}
                onChange={(e) => {
                  if (cantidadesCompletas) {
                    setUltimoExamenMedico(e.target.value);
                    // Limpiar error al escribir
                    if (erroresCampos.ultimoExamenMedico) {
                      setErroresCampos(prev => ({ ...prev, ultimoExamenMedico: '' }));
                    }
                  }
                }}
                fullWidth
                required={!noExpuestoSinFechas}
                disabled={!cantidadesCompletas}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: noExpuestoSinFechas ? undefined : ingreso ? dayjs(ingreso).add(1, 'day').format('YYYY-MM-DD') : undefined
                }}
                className={styles.flex1}
                error={!!erroresCampos.ultimoExamenMedico}
                helperText={erroresCampos.ultimoExamenMedico}
              />
            </div>

            {/* FILA 5: Agente Causante (ocupa todo el ancho) */}
            <div className={`${styles.modalRow} ${styles.modalRowSpaced}`}>
              <FormControl fullWidth required className={styles.flex1} error={!!erroresCampos.codigoAgente}>
                <InputLabel id="lbl-agente">
                  {!cantidadesCompletas
                    ? "Agente Causante (Completá primero las cantidades)"
                    : exposicionEsCero
                      ? "Agente Causante (Selección automática: Código 1 - No expuesto)"
                      : "Agente Causante"
                  }
                </InputLabel>
                <Select
                  labelId="lbl-agente"
                  name="codigoAgente"
                  value={codigoAgente}
                  label="Agente Causante"
                  disabled={!cantidadesCompletas || exposicionEsCero}
                  onChange={(e: SelectChangeEvent<string>) => {
                    if (cantidadesCompletas && !exposicionEsCero) {
                      setCodigoAgente(e.target.value);
                      // Limpiar error al seleccionar
                      if (erroresCampos.codigoAgente) {
                        setErroresCampos(prev => ({ ...prev, codigoAgente: '' }));
                      }
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 200,
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    {!cantidadesCompletas
                      ? "Completá primero las cantidades"
                      : exposicionEsCero
                        ? "Automático: Código 1 (No expuesto)"
                        : "Seleccione un agente causante"
                    }
                  </MenuItem>
                  {cantidadesCompletas && agentesCausantes.length === 0 ? (
                    <MenuItem disabled value="__empty__">No hay agentes causantes disponibles</MenuItem>
                  ) : cantidadesCompletas ? (
                    agentesCausantes.map((agente) => (
                      <MenuItem key={agente.codigo} value={String(agente.codigo)}>
                        {agente.displayText}
                      </MenuItem>
                    ))
                  ) : null}
                </Select>
                {erroresCampos.codigoAgente && (
                  <div style={{
                    color: '#d32f2f',
                    fontSize: '0.75rem',
                    marginTop: '3px',
                    marginLeft: '14px'
                  }}>
                    {erroresCampos.codigoAgente}
                  </div>
                )}
              </FormControl>

            </div>

            {/* BOTÓN CARGAR TRABAJADOR */}
            {cantidadesCompletas && (
              <div style={{
                textAlign: 'center',
                marginTop: '25px',
                paddingTop: '20px',
                borderTop: '1px solid #e0e0e0'
              }}>
                {/* Botones Centrados - Modo Edición o Normal */}
                {modoEdicion ? (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '15px'
                  }}>
                    <CustomButton
                      onClick={handleCargarFila}
                      style={{
                        background: '#ff9800',
                        color: 'white',
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      Guardar Cambios
                    </CustomButton>

                    <CustomButton
                      onClick={handleCancelarEdicion}
                      style={{
                        background: '#757575',
                        color: 'white',
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    >
                      Cancelar Edición
                    </CustomButton>
                  </div>
                ) : (
                  <CustomButton
                    onClick={handleCargarFila}
                    disabled={!puedeCargarTrabajador}
                    style={{
                      background: puedeCargarTrabajador ? '#2196f3' : '#cccccc',
                      color: 'white',
                      padding: '12px 24px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    {` Cargar Trabajador (${trabajadoresCargados}/${totalTrabajadoresRequeridos})`}
                  </CustomButton>
                )}
              </div>
            )}
          </div>

          {/* TABLA DE TRABAJADORES CARGADOS */}
          {filas.length > 0 && (
            <div className={styles.tablaTrabajadoresContainer}>

              <div className={styles.buscadorCuil}>
                <TextField
                  label="Buscador por CUIL"
                  value={filtroCuil}
                  onChange={(e) => setFiltroCuil(e.target.value)}
                  size="small"
                  placeholder="Ingresá el CUIL a buscar..."
                />
              </div>

              <DataTableImport
                data={filasTablaFiltradas}
                columns={columnasTabla}
                size="small"
                pageSizeOptions={[5, 10, 15]}
                enableSorting={true}
                enableFiltering={false}
                onRowClick={(rowData) => {
                  // Resaltar la fila seleccionada si está en modo edición
                  const index = filas.findIndex(fila =>
                    fila.CUIL === rowData.CUIL &&
                    fila.Nombre === rowData.Nombre
                  );
                  if (editandoIndex === index && modoEdicion) {
                    console.log('Fila en edición seleccionada');
                  }
                }}
              />

              {/* RESUMEN DE PROGRESO */}
              <div style={{
                background: trabajadoresCargados >= totalTrabajadoresRequeridos ? '#c8e6c9' : '#fff3cd',
                padding: '10px',
                borderRadius: '3px',
                marginTop: '10px',
                textAlign: 'center',
                border: `1px solid ${trabajadoresCargados >= totalTrabajadoresRequeridos ? '#4caf50' : '#ffc107'}`
              }}>
                {trabajadoresCargados >= totalTrabajadoresRequeridos ? (
                  <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                    Has cargado {trabajadoresCargados} trabajadores únicos (límite alcanzado). Puedes seguir agregando registros con CUILs ya cargados (con diferentes agentes causantes).
                  </span>
                ) : (
                  <span style={{ color: '#f57f17', fontWeight: 'bold' }}>
                    Faltan {faltanTrabajadores} trabajadores únicos por cargar ({trabajadoresCargados}/{totalTrabajadoresRequeridos})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* MENSAJE DE ESTADO */}
          {!establecimientoSeleccionado && (
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <strong>Para continuar:</strong> Seleccione primero un establecimiento
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          {!establecimientoSeleccionado ? null : (
            <div className={styles.modalButtons}>
              <CustomButton
                onClick={handleGuardarCompleto}
                disabled={!establecimientoSeleccionado}
                style={{
                  background: establecimientoSeleccionado ? '#4caf50' : '#cccccc',
                  color: 'white'
                }}
              >
                {esModoEdicionFormulario ? 'Actualizar Formulario RAR' : 'Guardar Formulario RAR'}
              </CustomButton>
              <CustomButton
                onClick={() => {
                  // Limpiar todos los campos del formulario
                  setCuil(''); setNombre(''); setSector(''); setIngreso('');
                  setFechaInicio(''); setExposicion('0'); setFechaFinExposicion('');
                  setUltimoExamenMedico(''); setCodigoAgente('');
                  setCantExpuestos(''); setCantNoExpuestos('');
                  setEstablecimientoSeleccionado('');
                  setFilas([]); // Limpiar también la tabla de trabajadores cargados
                  // Cancelar edición si está activa
                  setEditandoIndex(-1);
                  setModoEdicion(false);
                }}
              >
                Limpiar Todo
              </CustomButton>
              <CustomButton
                onClick={() => {
                  // Cerrar modal y redirigir a la pantalla principal
                  setModalTrabajadorOpen(false);
                  // Limpiar todos los campos del formulario
                  setCuil(''); setNombre(''); setSector(''); setIngreso('');
                  setFechaInicio(''); setExposicion('0'); setFechaFinExposicion('');
                  setUltimoExamenMedico(''); setCodigoAgente('');
                  setCantExpuestos(''); setCantNoExpuestos('');
                  setEstablecimientoSeleccionado('');
                  setFilas([]);
                  setEditandoIndex(-1);
                  setModoEdicion(false);
                  // Redirigir a la pantalla principal
                  finalizaCarga(false);
                }}
                style={{
                  background: '#757575',
                  color: 'white'
                }}
              >
                Cancelar
              </CustomButton>
            </div>
          )
          }
        </div>
      </CustomModal>

      <CustomModalMessage
        open={modalMessageOpen}
        message={modalMessageText}
        type={modalMessageType}
        title={modalMessageTitle}
        onClose={() => {
          setModalMessageOpen(false);
          setModalMessageTitle('');
        }}
      />

    </div>
  );
};

export default FormularioRARCrear;

