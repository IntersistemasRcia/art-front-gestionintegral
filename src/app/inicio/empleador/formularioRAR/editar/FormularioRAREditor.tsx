

'use client';
import React from 'react';
import { TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import Formato from '@/utils/Formato';
import CustomButton from '../../../../../utils/ui/button/CustomButton';
import DataTableImport from '../../../../../utils/ui/table/DataTable';
import CustomModal from '../../../../../utils/ui/form/CustomModal';
import styles from '../FormulariosRAR.module.css';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

/* ===== Tipos auxiliares ===== */
type EstablecimientoOpt = { interno: string; displayText: string };
type AgenteOpt = { codigo: number; displayText: string };

type FilaTrabajador = {
  CUIL: string;
  Nombre: string;
  SectorTareas: string;
  Ingreso: string;
  FechaFin: string; // (fechaInicioExposicion en API)
  Exposicion: string; // "X horas"
  FechaFinExposicion: string;
  UltimoExamenMedico: string;
  CodigoAgente: string;
};

interface EditarProps {
  edita: number; // ID del formulario a editar
  finalizaCarga: (ret?: boolean) => void;
}

const FormulariosRAREditar: React.FC<EditarProps> = ({ edita, finalizaCarga }) => {
  const formatoFechaTabla = (fecha: any) => {
    if (!fecha || String(fecha).trim() === '') return '';
    return Formato.Fecha(fecha, 'DD/MM/YYYY');
  };

  const [cantExpuestos, setCantExpuestos] = React.useState<string>('');
  const [cantNoExpuestos, setCantNoExpuestos] = React.useState<string>('');
  const [descripcion, setDescripcion] = React.useState<string>('');
  const [generar, setGenerar] = React.useState<boolean>(false);
  const guardandoRef = React.useRef(false);

  const [totalTrabajadores, setTotalTrabajadores] = React.useState<number>(0);
  const [opcionesEstablecimientos, setOpcionesEstablecimientos] = React.useState<EstablecimientoOpt[]>([]);
  const [agentesCausantes, setAgentesCausantes] = React.useState<AgenteOpt[]>([]);
  const [establecimientoSeleccionado, setEstablecimientoSeleccionado] = React.useState<string>('');

  // trabajadores
  const [filas, setFilas] = React.useState<FilaTrabajador[]>([]);
  const [modalTrabajadorOpen, setModalTrabajadorOpen] = React.useState<boolean>(false);
  const [modalCantidadesOpen, setModalCantidadesOpen] = React.useState<boolean>(false);

  const [cuil, setCuil] = React.useState<string>('');
  const [nombre, setNombre] = React.useState<string>('');
  const [sector, setSector] = React.useState<string>('');
  const [ingreso, setIngreso] = React.useState<string>('');
  const [fechaInicio, setFechaInicio] = React.useState<string>('');
  const [exposicion, setExposicion] = React.useState<string>('');
  const [fechaFinExposicion, setFechaFinExposicion] = React.useState<string>('');
  const [ultimoExamenMedico, setUltimoExamenMedico] = React.useState<string>('');
  const [codigoAgente, setCodigoAgente] = React.useState<string>('');

  // Estados para edición
  const [editandoIndex, setEditandoIndex] = React.useState<number>(-1);
  const [modoEdicion, setModoEdicion] = React.useState<boolean>(false);

  // Filtro por CUIL en la tabla de trabajadores cargados
  const [filtroCuil, setFiltroCuil] = React.useState<string>('');

  // CARGA INICIAL
  React.useEffect(() => {
    (async () => {
      // detalle del formulario
      const r = await fetch(`http://arttest.intersistemas.ar:8302/api/FormulariosRAR/${edita}`);
      if (r.ok) {
        const data = await r.json();
        setCantExpuestos(String(data.cantTrabajadoresExpuestos || 0));
        setCantNoExpuestos(String(data.cantTrabajadoresNoExpuestos || 0));
        setTotalTrabajadores((data.cantTrabajadoresExpuestos || 0) + (data.cantTrabajadoresNoExpuestos || 0));

        // establecimientos por CUIT del formulario
        const cuitForm: string | number | undefined = data.cuit || data.CUIT;
        if (cuitForm) {
          const re = await fetch(`http://arttest.intersistemas.ar:8302/api/Establecimientos/Empresa/${cuitForm}`);
          const raw = re.ok ? await re.json() : [];
          const arr = Array.isArray(raw)
            ? raw
            : raw?.data
            ? Array.isArray(raw.data)
              ? raw.data
              : [raw.data]
            : [raw];

          const ests: EstablecimientoOpt[] = arr.map((est: any) => ({
            interno: String(est.interno || ''),
            displayText: `${est.interno || 'S/C'} - ${est.domicilioCalle || ''}`,
          }));

          setOpcionesEstablecimientos(ests);

          // ⛔️ Aquí estaba el error: tipamos el parámetro 'e'
          const actual = ests.find((e: EstablecimientoOpt) => String(e.interno) === String(data.internoEstablecimiento));
          setDescripcion(actual?.displayText || '');
          setEstablecimientoSeleccionado(actual?.interno || '');
        }

        // detalle trabajadores
        if (Array.isArray(data.formularioRARDetalle) && data.formularioRARDetalle.length) {
          const filasDetalle: FilaTrabajador[] = data.formularioRARDetalle.map((d: any) => ({
            CUIL: String(d.cuil || ''),
            Nombre: d.nombre || '',
            SectorTareas: d.sectorTarea || '',
            Ingreso: d.fechaIngreso ? dayjs(d.fechaIngreso).format('YYYY-MM-DD') : '',
            FechaFin: d.fechaInicioExposicion ? dayjs(d.fechaInicioExposicion).format('YYYY-MM-DD') : '',
            Exposicion: `${d.horasExposicion || 0} horas`,
            FechaFinExposicion: d.fechaFinExposicion ? dayjs(d.fechaFinExposicion).format('YYYY-MM-DD') : '',
            UltimoExamenMedico: d.fechaUltimoExamenMedico ? dayjs(d.fechaUltimoExamenMedico).format('YYYY-MM-DD') : '',
            CodigoAgente: String(d.codigoAgente || ''),
          }));
          setFilas(filasDetalle);
          setGenerar(true);
        }
      }

      // agentes
      const ra = await fetch('http://arttest.intersistemas.ar:8302/api/AgentesCausantes');
      const agents = ra.ok ? await ra.json() : [];
      const arrAg = Array.isArray(agents)
        ? agents
        : agents?.data
        ? Array.isArray(agents.data)
          ? agents.data
          : [agents.data]
        : [agents];

      const ags: AgenteOpt[] = arrAg.map((a: any) => ({
        codigo: Number(a.codigo || 0),
        displayText: `${a.codigo || 'S/C'} - ${a.agenteCausante || ''}`,
      }));
      setAgentesCausantes(ags);
    })();
  }, [edita]);

  const numerosValidos = (v: string) => {
    const n = Number(v.trim());
    return !Number.isNaN(n) && n >= 0 && Number.isInteger(n) && n <= 99999;
  };

  const manejarCambioNumerico = (valor: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const limpio = (valor ?? '').replace(/[^0-9]/g, '');
    if (limpio.length <= 5) setter(limpio);
  };

  const establecimientoSeleccionadoValido = establecimientoSeleccionado.trim() !== '';

  const puedeGenerar =
    descripcion.trim() !== '' &&
    numerosValidos(cantExpuestos) &&
    numerosValidos(cantNoExpuestos) &&
    establecimientoSeleccionado.trim() !== '';

  const confirmarCantidades = () => {
    if (!numerosValidos(cantExpuestos) || !numerosValidos(cantNoExpuestos)) return alert('Cantidades inválidas');
    const total = Number(cantExpuestos) + Number(cantNoExpuestos);
    if (total <= 0) return alert('El total debe ser > 0');
    setTotalTrabajadores(total);
    setGenerar(true);
    setModalCantidadesOpen(false);
  };

  const trabajadorCompleto =
    [cuil, nombre, sector, ingreso, exposicion, codigoAgente].every(
      (x) => x && x.trim() !== ''
    ) && ((Number(String(exposicion || '').replace(/[^0-9]/g, '') || 0) === 0 && Number(cantNoExpuestos) > 0) || ((fechaInicio && fechaInicio.trim() !== '') && (ultimoExamenMedico && ultimoExamenMedico.trim() !== ''))) && cuil.replace(/\D/g, '').length >= 11;

  const trabajadoresCargados = React.useMemo(() => {
    const s = new Set<string>();
    filas.forEach((f) => {
      const n = (f.CUIL || '').replace(/\D/g, '');
      if (n) s.add(n);
    });
    return s.size;
  }, [filas]);

  const cargarFila = () => {
    if (!trabajadorCompleto) return;

    const horasExposicion = Number(String(exposicion || '').replace(/[^0-9]/g, '') || 0);
    const esNoExpuestoSinFechas = horasExposicion === 0 && Number(cantNoExpuestos) > 0;

    const fechaCargaFormulario = dayjs().format('YYYY-MM-DD');
    if (ingreso && ingreso > fechaCargaFormulario) {
      return alert('La fecha de ingreso debe ser menor o igual a la fecha de carga del formulario RAR');
    }
    if (!esNoExpuestoSinFechas && fechaInicio && ingreso && fechaInicio < ingreso) {
      return alert('La fecha inicio exposición debe ser mayor o igual a la fecha de ingreso');
    }
    if (ultimoExamenMedico && ingreso && ultimoExamenMedico <= ingreso) {
      return alert('La fecha del último examen médico debe ser posterior a la fecha de ingreso');
    }
    if (!esNoExpuestoSinFechas && fechaFinExposicion && fechaInicio && fechaFinExposicion < fechaInicio) {
      return alert('La fecha fin exposición debe ser mayor o igual a la fecha inicio exposición');
    }

    if (modoEdicion) {
      const cuilExiste = filas.some((f, idx) => f.CUIL === cuil.trim() && idx !== editandoIndex);
      if (cuilExiste) return alert('Este CUIL ya existe en otro trabajador');

      setFilas((prev) => {
        const nuevas = [...prev];
        nuevas[editandoIndex] = {
          CUIL: cuil.trim(),
          Nombre: nombre.trim(),
          SectorTareas: sector.trim(),
          Ingreso: ingreso.trim(),
          FechaFin: esNoExpuestoSinFechas ? '' : fechaInicio.trim(),
          Exposicion: exposicion.trim(),
          FechaFinExposicion: esNoExpuestoSinFechas ? '' : fechaFinExposicion.trim(),
          UltimoExamenMedico: ultimoExamenMedico.trim(),
          CodigoAgente: codigoAgente.trim(),
        };
        return nuevas;
      });

      setModoEdicion(false);
      setEditandoIndex(-1);
    } else {
      if (trabajadoresCargados >= totalTrabajadores) return alert('Ya alcanzó el límite máximo de trabajadores');
      const cuilExiste = filas.some((f) => f.CUIL === cuil.trim());
      if (cuilExiste) return alert('Este CUIL ya fue cargado');

      setFilas((p) => [
        ...p,
        {
          CUIL: cuil.trim(),
          Nombre: nombre.trim(),
          SectorTareas: sector.trim(),
          Ingreso: ingreso.trim(),
          FechaFin: esNoExpuestoSinFechas ? '' : fechaInicio.trim(),
          Exposicion: exposicion.trim(),
          FechaFinExposicion: esNoExpuestoSinFechas ? '' : fechaFinExposicion.trim(),
          UltimoExamenMedico: ultimoExamenMedico.trim(),
          CodigoAgente: codigoAgente.trim(),
        },
      ]);
    }

    // Limpiar campos
    setCuil('');
    setNombre('');
    setSector('');
    setIngreso('');
    setFechaInicio('');
    setExposicion('');
    setFechaFinExposicion('');
    setUltimoExamenMedico('');
    setCodigoAgente('');
    setModalTrabajadorOpen(false);
  };

  const handleEditarTrabajador = (index: number) => {
    const trabajador = filas[index];
    if (!trabajador) return;
    setCuil(trabajador.CUIL || '');
    setNombre(trabajador.Nombre || '');
    setSector(trabajador.SectorTareas || '');
    setIngreso(trabajador.Ingreso || '');
    setFechaInicio(trabajador.FechaFin || '');
    setExposicion(trabajador.Exposicion || '');
    setFechaFinExposicion(trabajador.FechaFinExposicion || '');
    setUltimoExamenMedico(trabajador.UltimoExamenMedico || '');
    setCodigoAgente(trabajador.CodigoAgente || '');
    setEditandoIndex(index);
    setModoEdicion(true);
    setModalTrabajadorOpen(true);
  };

  const handleEliminarTrabajador = (index: number) => {
    if (window.confirm('¿Estás seguro de que querés eliminar este trabajador?')) {
      setFilas((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleCancelarEdicion = () => {
    setCuil('');
    setNombre('');
    setSector('');
    setIngreso('');
    setFechaInicio('');
    setExposicion('');
    setFechaFinExposicion('');
    setUltimoExamenMedico('');
    setCodigoAgente('');
    setEditandoIndex(-1);
    setModoEdicion(false);
    setModalTrabajadorOpen(false);
  };

  const guardar = async () => {
    if (guardandoRef.current) return;
    if (!establecimientoSeleccionado) return alert('Seleccione establecimiento');
    if (trabajadoresCargados === 0) return alert('Cargue al menos un trabajador');

    guardandoRef.current = true;
    try {
      const fechaActual = new Date().toISOString();
      const cantidadesCompletas = numerosValidos(cantExpuestos) && numerosValidos(cantNoExpuestos) && (Number(cantExpuestos) + Number(cantNoExpuestos)) > 0;
      const formularioCompleto = establecimientoSeleccionado.trim() !== '' && cantidadesCompletas && trabajadoresCargados >= totalTrabajadores;
      const detalle = filas.map((f) => {
        const raw = String(f.Exposicion ?? '').replace(/[^\d]/g, '').trim();
        const n = Number(raw);
        const horas = raw === '' ? 0 : (Number.isFinite(n) ? n : 0);

        return {
          internoFormulariosRar: 0,
          cuil: Number((f.CUIL || '').replace(/\D/g, '')),
          nombre: f.Nombre || '',
          sectorTarea: f.SectorTareas || '',
          fechaIngreso: new Date(f.Ingreso || fechaActual).toISOString(),
          horasExposicion: horas,
          fechaUltimoExamenMedico: new Date(f.UltimoExamenMedico || fechaActual).toISOString(),
          codigoAgente: Number(f.CodigoAgente) || 1,
          fechaInicioExposicion: new Date(f.FechaFin || fechaActual).toISOString(),
          fechaFinExposicion: new Date(f.FechaFinExposicion || fechaActual).toISOString(),
        };
      });

      const body = {
        cantTrabajadoresExpuestos: Number(cantExpuestos) || 0,
        cantTrabajadoresNoExpuestos: Number(cantNoExpuestos) || 0,
        fechaCreacion: fechaActual,
        fechaPresentacion: formularioCompleto ? fechaActual : null,
        internoPresentacion: 0,
        internoEstablecimiento: Number(establecimientoSeleccionado) || 0,
        formularioRARDetalle: detalle,
      };

      const r = await fetch(`http://arttest.intersistemas.ar:8302/api/FormulariosRAR/${edita}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!r.ok) throw new Error(await r.text());
      alert('Formulario RAR actualizado exitosamente');
      finalizaCarga(true);
    } catch (e: any) {
      console.error(e);
      alert(`Error al guardar: ${e?.message || e}`);
    } finally {
      guardandoRef.current = false;
    }
  };

  const llegoAlTope = generar && totalTrabajadores > 0 && trabajadoresCargados >= totalTrabajadores;

  return (
    <div className={styles.wrapperCol}>
      <h2>{`Editar Formulario RAR #${edita}`}</h2>

      <FormControl fullWidth required disabled={!!establecimientoSeleccionado}>
        <InputLabel>Establecimiento</InputLabel>
        <Select
          value={descripcion}
          label="Establecimiento"
          onChange={(e: SelectChangeEvent<string>) => {
            const val = e.target.value;
            setDescripcion(val);
            const sel = opcionesEstablecimientos.find((o) => o.displayText === val);
            setEstablecimientoSeleccionado(sel ? sel.interno : '');
          }}
        >
          <MenuItem value="">Seleccione un establecimiento</MenuItem>
          {opcionesEstablecimientos.length === 0 ? (
            <MenuItem disabled value="">
              No hay establecimientos
            </MenuItem>
          ) : (
            opcionesEstablecimientos.map((op) => (
              <MenuItem key={op.interno} value={op.displayText}>
                {op.displayText}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* CANTIDADES */}
      <div
        style={{
          background: establecimientoSeleccionadoValido ? '#f8f9fa' : '#f5f5f5',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          marginTop: '20px',
          opacity: establecimientoSeleccionadoValido ? 1 : 0.6,
        }}
      >
        <h4
          style={{
            margin: '0 0 15px 0',
            color: establecimientoSeleccionadoValido ? '#495057' : '#9e9e9e',
          }}
        >
          Cantidades de Trabajadores <span style={{ color: '#d32f2f', fontSize: '16px' }}>*</span>
          {!establecimientoSeleccionadoValido && (
            <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '10px' }}>(Seleccioná primero un establecimiento)</span>
          )}
          {establecimientoSeleccionadoValido && (
            <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '10px' }}>(Requerido para habilitar datos del trabajador)</span>
          )}
        </h4>
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
          <div style={{ background: '#bbdefb', padding: '10px', borderRadius: '3px', marginTop: '10px', textAlign: 'center' }}>
            <strong>Total de Trabajadores: {(Number(cantExpuestos) || 0) + (Number(cantNoExpuestos) || 0)}</strong>
          </div>
        )}

        {establecimientoSeleccionadoValido && (
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <CustomButton onClick={confirmarCantidades} disabled={!puedeGenerar} style={{ background: puedeGenerar ? '#2196f3' : '#cccccc', color: 'white' }}>
              {generar ? 'Actualizar Cantidades' : 'Confirmar y Generar'}
            </CustomButton>
          </div>
        )}
      </div>

      {generar && totalTrabajadores > 0 && !llegoAlTope && (
        <div className={`${styles.btnCenter} ${styles.mt20}`}>
          <CustomButton onClick={() => setModalTrabajadorOpen(true)}>
            Agregar Trabajador ({trabajadoresCargados}/{totalTrabajadores})
          </CustomButton>
        </div>
      )}

      {filas.length > 0 && (
        <div className={styles.tableBlock}>
          <span className={`${styles.bold} ${styles.fs20}`}>Datos del Trabajador:</span>
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
            columns={[
              { accessorKey: 'CUIL', header: 'CUIL', cell: ({ getValue }: { getValue: () => string }) => Formato.CUIP(getValue()) },
              { accessorKey: 'Nombre', header: 'Nombre' },
              { accessorKey: 'SectorTareas', header: 'Sector/Tareas' },
              { accessorKey: 'Ingreso', header: 'F. Ingreso', cell: ({ getValue }: any) => formatoFechaTabla(getValue()) },
              { accessorKey: 'FechaFin', header: 'F. Fin', cell: ({ getValue }: any) => formatoFechaTabla(getValue()) },
              { accessorKey: 'Exposicion', header: 'Exposición' },
              { accessorKey: 'FechaFinExposicion', header: 'F. Fin Exposición', cell: ({ getValue }: any) => formatoFechaTabla(getValue()) },
              { accessorKey: 'UltimoExamenMedico', header: 'F. Último Examen', cell: ({ getValue }: any) => formatoFechaTabla(getValue()) },
              { accessorKey: 'CodigoAgente', header: 'Cód. Agente' },
              {
                id: 'acciones',
                header: 'Acciones',
                cell: ({ row }: { row: { original: FilaTrabajador } }) => {
                  const index = filas.findIndex(
                    (fila) => fila.CUIL === row.original.CUIL && fila.Nombre === row.original.Nombre
                  );
                  const onEnter = (e: React.MouseEvent<SVGSVGElement>) => {
                    (e.currentTarget as SVGElement).style.color = '#E4840C';
                  };
                  const onLeave = (e: React.MouseEvent<SVGSVGElement>) => {
                    (e.currentTarget as SVGElement).style.color = '#E4840C';
                  };
                  return (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      <EditIcon
                        onClick={() => handleEditarTrabajador(index)}
                        style={{ fontSize: '20px', color: '#E4840C', cursor: 'pointer', transition: 'color 0.2s ease' }}
                        onMouseEnter={onEnter}
                        onMouseLeave={onLeave}
                      />
                      <DeleteIcon
                        onClick={() => handleEliminarTrabajador(index)}
                        style={{ fontSize: '20px', color: '#E4840C', cursor: 'pointer', transition: 'color 0.2s ease' }}
                        onMouseEnter={onEnter}
                        onMouseLeave={onLeave}
                      />
                    </div>
                  );
                },
                meta: { align: 'center'}, 
                enableSorting: false,
              },
            ]}
            data={filtroCuil ? filas.filter(f => (f.CUIL || '').replace(/\D/g, '').startsWith(filtroCuil.replace(/\D/g, ''))) : filas}
          />
        </div>
      )}

      <div className={`${styles.flex} ${styles.gap8} ${styles.mt40}`}>
        <CustomButton onClick={guardar} disabled={!generar || trabajadoresCargados === 0 || trabajadoresCargados < totalTrabajadores}>
          Guardar Cambios
        </CustomButton>
        <CustomButton onClick={() => finalizaCarga(false)}>Cancelar</CustomButton>
      </div>

      {/* MODAL Trabajador */}
      <CustomModal
        open={modalTrabajadorOpen}
        onClose={modoEdicion ? handleCancelarEdicion : () => setModalTrabajadorOpen(false)}
        title={modoEdicion ? 'Editar Trabajador Expuesto' : 'Datos del Trabajador Expuesto'}
        size="large"
      >
        <div className={styles.modalGridCol}>
          <div className={styles.modalRow}>
            <TextField
              label="CUIL"
              value={cuil}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '');
                if (v.length <= 11) {
                  let formatted = v;
                  if (v.length > 2) formatted = v.substring(0, 2) + '-' + v.substring(2);
                  if (v.length > 10) formatted = v.substring(0, 2) + '-' + v.substring(2, 10) + '-' + v.substring(10);
                  setCuil(formatted);
                }
              }}
              fullWidth
              required
              placeholder="XX-XXXXXXXX-X"
              inputProps={{ maxLength: 13 }}
              className={styles.flex1}
            />
            <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} fullWidth required className={styles.flex1} />
          </div>

          <div className={styles.modalRow}>
            <TextField label="Sector/Tareas" value={sector} onChange={(e) => setSector(e.target.value)} fullWidth required className={styles.flex1} />
            <TextField label="Ingreso" type="date" value={ingreso} onChange={(e) => setIngreso(e.target.value)} fullWidth required InputLabelProps={{ shrink: true }} inputProps={{ max: dayjs().format('YYYY-MM-DD') }} className={styles.flex1} />
          </div>

          <div className={styles.modalRow}>
            <TextField label="Fecha Inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} fullWidth required={!(Number(String(exposicion || '').replace(/[^0-9]/g, '') || 0) === 0 && Number(cantNoExpuestos) > 0)} disabled={Number(String(exposicion || '').replace(/[^0-9]/g, '') || 0) === 0 && Number(cantNoExpuestos) > 0} InputLabelProps={{ shrink: true }} inputProps={{ min: ingreso || undefined }} className={styles.flex1} />
            <TextField label="Exposición" value={exposicion} onChange={(e) => {
              setExposicion(e.target.value);
              const horas = Number(String(e.target.value || '').replace(/[^0-9]/g, '') || 0);
              if (horas === 0 && Number(cantNoExpuestos) > 0) {
                setFechaInicio('');
                setFechaFinExposicion('');
              }
            }} fullWidth required className={styles.flex1} />
          </div>

          <div className={styles.modalRow}>
            <TextField label="Fecha Fin Exposición" type="date" value={fechaFinExposicion} onChange={(e) => setFechaFinExposicion(e.target.value)} fullWidth disabled={Number(String(exposicion || '').replace(/[^0-9]/g, '') || 0) === 0 && Number(cantNoExpuestos) > 0} InputLabelProps={{ shrink: true }} inputProps={{ min: fechaInicio || undefined }} className={styles.flex1} />
            <TextField label="Último Examen Médico" type="date" value={ultimoExamenMedico} onChange={(e) => setUltimoExamenMedico(e.target.value)} fullWidth required={!(Number(String(exposicion || '').replace(/[^0-9]/g, '') || 0) === 0 && Number(cantNoExpuestos) > 0)} InputLabelProps={{ shrink: true }} inputProps={{ min: (Number(String(exposicion || '').replace(/[^0-9]/g, '') || 0) === 0 && Number(cantNoExpuestos) > 0) ? undefined : ingreso ? dayjs(ingreso).add(1, 'day').format('YYYY-MM-DD') : undefined }} className={styles.flex1} />
          </div>

          <div className={styles.modalRow}>
            <FormControl fullWidth required className={styles.flex1}>
              <InputLabel>Agente Causante</InputLabel>
              <Select value={codigoAgente} label="Agente Causante" onChange={(e: SelectChangeEvent<string>) => setCodigoAgente(e.target.value)}>
                <MenuItem value="">Seleccione…</MenuItem>
                {agentesCausantes.map((a) => (
                  <MenuItem key={a.codigo} value={String(a.codigo)}>
                    {a.displayText}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className={styles.modalButtons}>
            <CustomButton
              onClick={cargarFila}
              disabled={!trabajadorCompleto || (!modoEdicion && trabajadoresCargados >= totalTrabajadores)}
              style={modoEdicion ? { backgroundColor: '#ff9800', color: 'white' } : {}}
            >
              {modoEdicion ? 'Guardar Cambios' : 'Cargar Trabajador'}
            </CustomButton>
            <CustomButton
              onClick={() => {
                setCuil('');
                setNombre('');
                setSector('');
                setIngreso('');
                setFechaInicio('');
                setExposicion('');
                setFechaFinExposicion('');
                setUltimoExamenMedico('');
                setCodigoAgente('');
              }}
            >
              Limpiar Campos
            </CustomButton>
            <CustomButton onClick={modoEdicion ? handleCancelarEdicion : () => setModalTrabajadorOpen(false)} style={modoEdicion ? { backgroundColor: '#757575', color: 'white' } : {}}>
              Cancelar
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* MODAL Cantidades */}
      <CustomModal open={modalCantidadesOpen} onClose={() => setModalCantidadesOpen(false)} title="Configurar Cantidades de Trabajadores" size="mid">
        <div className={styles.modalGridCol}>
          <TextField
            label="Cantidad de Trabajadores Expuestos"
            type="text"
            value={cantExpuestos}
            onChange={(e) => setCantExpuestos(e.target.value.replace(/[^0-9]/g, ''))}
            fullWidth
            required
            className={styles.centeredInput}
          />
        </div>
        <div className={styles.modalGridCol}>
          <TextField
            label="Cantidad de Trabajadores NO Expuestos"
            type="text"
            value={cantNoExpuestos}
            onChange={(e) => setCantNoExpuestos(e.target.value.replace(/[^0-9]/g, ''))}
            fullWidth
            required
            className={styles.centeredInput}
          />
          <div className={styles.modalButtons}>
            <CustomButton onClick={confirmarCantidades} disabled={!puedeGenerar}>
              Confirmar y Generar
            </CustomButton>
            <CustomButton onClick={() => setModalCantidadesOpen(false)}>Cancelar</CustomButton>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default FormulariosRAREditar;

