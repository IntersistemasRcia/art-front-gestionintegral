'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
//import { Box, Grid, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import CustomButton from '@/utils/ui/button/CustomButton';
import dayjs from 'dayjs';
import styles from './GenerarFormularioRGRL.module.css';
import { CUIP } from '@/utils/Formato';
import CustomModal from '@/utils/ui/form/CustomModal';
import CustomModalMessage, { MessageType } from '@/utils/ui/message/CustomModalMessage';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import DataTableImport from '@/utils/ui/table/DataTable';

import ArtAPI from '@/data/artAPI';


import type {
  Establecimiento,
  TipoFormulario,
  RespuestaCuestionarioVm,
  FormularioVm,
  GremioUI,
  ContratistaUI,
  ResponsableUI
} from './types/generar';

// URL base de la API (entorno de pruebas)
const API_BASE = 'http://arttest.intersistemas.ar:8302/api';

// Helper: convierte fecha a ISO (o null)
const toIsoOrNull = (v?: string | Date | null) => {
  if (!v) return null;
  const d = dayjs(v);
  return d.isValid() ? d.toISOString() : null;
};

// Llamadas a la API para obtener datos (razón social, establecimientos, tipos, formulario)
const fetchRazonSocial = async (cuit: number): Promise<string> => {
  const url = `${API_BASE}/FormulariosRGRL?CUIT=${encodeURIComponent(cuit)}`;
  const res = await fetch(
    url,
    { 
      cache: 'no-store',
      headers: { Accept: 'application/json, text/json' }
     }
  );
  if (res.status === 404) return '';

  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);

  // Parse robusto: la API puede devolver { DATA: [...] } o { data: [...] } o el array directamente
  const body = await res.json().catch(() => null);
  const arr =
    Array.isArray(body?.DATA) ? body.DATA :
    Array.isArray(body?.data) ? body.data :
    Array.isArray(body) ? body :
    [];

  // Si no hay elementos, devolver cadena vacía
  const razon = (arr[0]?.razonSocial ?? arr[0]?.razon ?? '') as string;
  return (razon ?? '').toString();
};

const fetchEstablecimientos = async (cuit: number): Promise<Establecimiento[]> => {
  const data = await ArtAPI.getEstablecimientosEmpresa(cuit, "True");
  return data.map((e) => ({
    interno: e.interno,
    cuit: e.cuit,
    nroSucursal: e.nroSucursal,
    nombre: e.nombre,
    domicilioCalle: e.domicilioCalle,
    domicilioNro: e.domicilioNro,
    superficie: e.superficie,
    cantTrabajadores: e.cantTrabajadores,
    localidad: e.localidad,
    provincia: e.provincia,
    numero: e.numero,
    ciiu: e.ciiu,
  }));
};

const fetchTipos = async (): Promise<TipoFormulario[]> => {
  const url = `${API_BASE}/TiposFormulariosRGRL`;
  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json, text/json' } });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return (await res.json()) as TipoFormulario[];
};
// Trae un formulario existente por ID (para edición o réplica)
const fetchFormularioById = async (id: number): Promise<FormularioVm> => {
  const url = `${API_BASE}/FormulariosRGRL/${id}`;
  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json, text/json' } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return (await res.json()) as FormularioVm;
};

// Componente principal: crea, edita o replica formularios RGRL
const GenerarFormularioRGRL: React.FC<{
  initialCuit?: number;
  replicaDe?: number;
  onDone?: (nuevoId: number) => void;
}> = ({ initialCuit, replicaDe, onDone }) => {

  const router = useRouter();
  const search = useSearchParams();
  // En modal (onDone) se ignoran query params.
  const isModal = Boolean(onDone);
  const cuitFromQuery = useMemo(() => {
    if (isModal) return undefined;
    const v = search?.get('cuit');
    return v ? Number(v) : undefined;
  }, [search, isModal]);


  const idFromQuery = useMemo(() => {
    if (isModal) return undefined;
    const v = search?.get('id');
    return v ? Number(v) : undefined;
  }, [search, isModal]);


  const replicaDeQuery = useMemo(() => {
    if (isModal) return undefined;
    const v = search?.get('replicaDe');
    return v ? Number(v) : undefined;
  }, [search, isModal]);

  const [original, setOriginal] = useState<FormularioVm | null>(null);
  // Marca si el flujo actual es de réplica
  const esReplica = Boolean(replicaDe || replicaDeQuery || original);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [cuit, setCuit] = useState<number | undefined>(initialCuit ?? cuitFromQuery);
  const [razonSocial, setRazonSocial] = useState('');
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([]);
  const [establecimientoSel, setEstablecimientoSel] = useState<number | undefined>(undefined);
  const [tipos, setTipos] = useState<TipoFormulario[]>([]);
  const [tipoSel, setTipoSel] = useState<number | undefined>(undefined);

  const [estSuperficie, setEstSuperficie] = useState<number | string>('');
  const [estCantTrab, setEstCantTrab] = useState<number | string>('');

  const estActual = useMemo(
    () => establecimientos.find((e) => e.interno === establecimientoSel),
    [establecimientos, establecimientoSel]
  );

  //ESTADOS PARA EL MODAL DE MENSAJE
  const [modalMsgOpen, setModalMsgOpen] = useState(false);
  const [modalMsg, setModalMsg] = useState('');
  const [modalMsgType, setModalMsgType] = useState<MessageType>('warning');

  const [confirmOpen, setConfirmOpen] = useState(false);

  // Función para cerrar el modal de mensaje
  const handleCloseModalMsg = () => setModalMsgOpen(false);

  useEffect(() => {
    if (estActual) {
      setEstSuperficie(estActual.superficie ?? 0);
      setEstCantTrab(estActual.cantTrabajadores ?? 0);
    } else {
      setEstSuperficie('');
      setEstCantTrab('');
    }
  }, [estActual]);
  

  const canBuscar = !!cuit && !Number.isNaN(cuit);

  //trae razón social, establecimientos y tipos.
  const cargarTodoPaso1 = useCallback(async () => {
    if (!canBuscar) return;
    setLoading(true);
    setError('');
    try {
      const [rs, ests, tfs] = await Promise.all([fetchRazonSocial(cuit!), fetchEstablecimientos(cuit!), fetchTipos()]);
      // LÓGICA DE ALERTA A IMPLEMENTAR
      console.log("rs",rs)
      let alertMessage = '';
      if (!rs) {
          alertMessage += 'No se encontró la Razón Social para el CUIT ingresado.';
      }
      if (!ests || ests.length === 0) {
          if (alertMessage) alertMessage += '\n\n';
          alertMessage += 'No se encontraron Establecimientos asociados al CUIT.';
      }

      if (alertMessage) {
        setModalMsg(alertMessage);
        setModalMsgType('warning');
        setModalMsgOpen(true);
      }

      setRazonSocial(rs);
      setEstablecimientos(ests);
      setTipos(tfs);
      setEstablecimientoSel(ests?.[0]?.interno);
      setTipoSel(tfs?.[0]?.interno);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar datos');
      console.log("e**",e)
    } finally {
      setLoading(false);
    }
  }, [cuit, canBuscar]);

  useEffect(() => {
    // Ejecutar la carga automáticamente solo cuando el CUIT tiene 11 dígitos
    try {
      const digits = cuit ? String(cuit).replace(/\D/g, '') : '';
      if (!idFromQuery && digits.length === 11 && !(replicaDe || replicaDeQuery)) {
        cargarTodoPaso1();
      }
    } catch (err) {
      console.log('Error al cargar datos automáticamente:', err);
    }
  }, [cuit, idFromQuery, replicaDe, replicaDeQuery, cargarTodoPaso1]);

  // Carga datos cuando se solicita replicar un formulario
  const cargarReplicaDe = useCallback(async () => {
    const replId = typeof replicaDe === 'number' ? replicaDe : replicaDeQuery;
    if (!replId) return;

    setLoading(true);
    setError('');
    try {
      const frm = await fetchFormularioById(replId);
      setOriginal(frm);

      const c = Number((frm as any).cuit ?? 0) || undefined;
      if (c) setCuit(c);

      const [rs, ests, tfs] = await Promise.all([
        c ? fetchRazonSocial(c) : Promise.resolve(''),
        c ? fetchEstablecimientos(c) : Promise.resolve([] as Establecimiento[]),
        fetchTipos(),
      ]);
      setRazonSocial(rs);
      setEstablecimientos(ests);
      setTipos(tfs);

      setEstablecimientoSel(frm.internoEstablecimiento);
      setTipoSel(frm.internoFormulario);

      const d = new Date();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');

    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar datos para replicar.');
    } finally {
      setLoading(false);
    }
  }, [replicaDe, replicaDeQuery]);

  useEffect(() => {
    if (!idFromQuery && (replicaDe || replicaDeQuery)) cargarReplicaDe();
  }, [idFromQuery, replicaDe, replicaDeQuery, cargarReplicaDe]);

  // Crea el formulario y, si viene de una réplica, copia respuestas/listas
  const crearFormulario = async () => {
    if (!cuit || !establecimientoSel || !tipoSel) {
      setError('Completá CUIT, Establecimiento y Tipo de formulario.');
      return;
    }
    setLoading(true);
    setError('');
    try {

      // Actualiza Superficie y Cant. Trabajadores del Establecimiento antes de crear el formulario
      {
        const payloadEst = {
          superficie: Number(estSuperficie) || 0,
          cantTrabajadores: Number(estCantTrab) || 0,
        };
        const respEst = await fetch(`${API_BASE}/Establecimientos/${establecimientoSel}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadEst),
        });
        const rawEst = await respEst.text().catch(() => '');
        if (!respEst.ok) throw new Error(`Actualizar establecimiento -> ${respEst.status} ${rawEst}`);
        // reflejamos en memoria
        setEstablecimientos(prev =>
          prev.map(e =>
            e.interno === establecimientoSel
              ? { ...e, superficie: payloadEst.superficie, cantTrabajadores: payloadEst.cantTrabajadores }
              : e
          )
        );
      }


      const payload = {
        internoFormulario: tipoSel!,
        internoEstablecimiento: establecimientoSel!,
        creacionFechaHora: toIsoOrNull(new Date()),
        completadoFechaHora: toIsoOrNull(new Date()),
        notificacionFecha: toIsoOrNull(new Date()),
        internoPresentacion: 0,
        fechaSRT: toIsoOrNull(new Date()),
      };

      const res = await fetch(`${API_BASE}/FormulariosRGRL`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(`POST /FormulariosRGRL -> ${res.status}`);

      const nuevoId = Number(data?.interno ?? 0);
      if (!nuevoId) throw new Error('No se obtuvo el ID del nuevo formulario.');


      if (original) {
        // Copia respuestas y listas del original con nuevo ID
        const fullCuest = (original.respuestasCuestionario || []).map((r) => ({
          interno: 0,
          internoCuestionario: r.internoCuestionario ?? 0,
          internoRespuestaFormulario: nuevoId,
          respuesta: r.respuesta ?? '',
          fechaRegularizacion: r.fechaRegularizacion ?? 0,
          observaciones: r.observaciones ?? '',

          estadoAccion: 'A',
          estadoFecha: 0,
          estadoSituacion: '',
          bajaMotivo: 0,
        }));

        const gremiosFull = (original.respuestasGremio || []).map((g: any, i: number) => ({
          interno: 0,
          internoRespuestaFormulario: nuevoId,
          legajo: g?.legajo ?? 0,
          nombre: g?.nombre ?? '',
          estadoAccion: 'A',
          estadoFecha: 0,
          estadoSituacion: '',
          bajaMotivo: 0,
          renglon: i,
        }));

        const contratistasFull = (original.respuestasContratista || []).map((c: any, i: number) => ({
          interno: 0,
          internoRespuestaFormulario: nuevoId,
          cuit: c?.cuit ?? 0,
          contratista: c?.contratista ?? c?.nombre ?? '',
          estadoAccion: 'A',
          estadoFecha: 0,
          estadoSituacion: '',
          bajaMotivo: 0,
          renglon: i,
        }));

        const responsablesFull = (original.respuestasResponsable || []).map((r: any, i: number) => ({
          interno: 0,
          internoRespuestaFormulario: nuevoId,
          cuit: r?.cuit ?? 0,
          responsable: r?.responsable ?? '',
          cargo: r?.cargo ?? '',
          representacion: r?.representacion ?? 0,
          esContratado: r?.esContratado ?? 0,
          tituloHabilitante: r?.tituloHabilitante ?? '',
          matricula: r?.matricula ?? '',
          entidadOtorganteTitulo: r?.entidadOtorganteTitulo ?? '',
          estadoAccion: 'A',
          estadoFecha: 0,
          estadoSituacion: '',
          bajaMotivo: 0,
          renglon: i,
        }));

        const payloadPUT = {
          internoFormulario: tipoSel!,
          internoEstablecimiento: establecimientoSel!,
          creacionFechaHora: payload.creacionFechaHora,
          completadoFechaHora: payload.completadoFechaHora,
          notificacionFecha: payload.notificacionFecha,
          respuestasCuestionario: fullCuest,
          respuestasGremio: gremiosFull,
          respuestasContratista: contratistasFull,
          respuestasResponsable: responsablesFull,
          internoPresentacion: 0,
          fechaSRT: payload.fechaSRT,
        };

        const resPut = await fetch(`${API_BASE}/FormulariosRGRL/${nuevoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadPUT),
        });

        await resPut.json().catch(() => null);
        if (!resPut.ok) throw new Error(`PUT /FormulariosRGRL/${nuevoId} -> ${resPut.status}`);

        onDone?.(nuevoId);
        router.push(`/inicio/empleador/formularioRGRL/generar?id=${nuevoId}`);
        return;
      }
      onDone?.(nuevoId);
      router.push(`/inicio/empleador/formularioRGRL/generar?id=${nuevoId}`);
    } catch (e: any) {
      setError(e?.message ?? 'Error al crear el formulario.');
    } finally {
      setLoading(false);
    }
  };

  const [form, setForm] = useState<FormularioVm | null>(null);
  const [respuestas, setRespuestas] = useState<Record<number, RespuestaCuestionarioVm>>({});
  const [gremiosUI, setGremiosUI] = useState<GremioUI[]>([]);
  const [contratistasUI, setContratistasUI] = useState<ContratistaUI[]>([]);
  const [responsablesUI, setResponsablesUI] = useState<ResponsableUI[]>([]);

  const [nuevoResponsable, setNuevoResponsable] = useState<ResponsableUI>({
    cuit: undefined,
    responsable: '',
    cargo: '',
    representacion: undefined,
    esContratado: undefined,
    tituloHabilitante: '',
    matricula: '',
    entidadOtorganteTitulo: '',
  });
  const [editRespIndex, setEditRespIndex] = useState<number | null>(null);

  //Contratistas
  const [nuevoContratista, setNuevoContratista] = useState<ContratistaUI>({ cuit: undefined, contratista: '' });
  const [editContrIndex, setEditContrIndex] = useState<number | null>(null);

  const columnasContratistas = useMemo(() => [
    {
      accessorKey: 'cuit',
      header: 'CUIT',
      size: 160,
      cell: ({ getValue }: any) => {
        const v = getValue();
        return String(v || '').replace(/\D/g, '').length === 11 ? CUIP(v) : String(v ?? '');
      }
    },
    { accessorKey: 'contratista', header: 'Contratista' },
    {
      id: 'acciones',
      header: 'Acciones',
      size: 110,
      cell: ({ row }: any) => {
        const orig = row.original as ContratistaUI;
        const idx = contratistasUI.findIndex(r => String(r.cuit ?? '') === String(orig.cuit ?? '') && (r.contratista ?? '') === (orig.contratista ?? ''));
        return (
          <div className={styles.actionsInline}>
            <IconButton size="small" onClick={() => { setNuevoContratista(orig); setEditContrIndex(idx); }} title="Editar">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setContratistasUI(prev => prev.filter((_, i) => i !== idx))} title="Eliminar">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        );
      },
      meta: { align: 'center' }
    }
  ], [contratistasUI]);

  // Gremios
  const [nuevoGremio, setNuevoGremio] = useState<GremioUI>({ legajo: undefined, nombre: '' });
  const [editGremioIndex, setEditGremioIndex] = useState<number | null>(null);

  const columnasGremios = useMemo(() => [
    { accessorKey: 'legajo', header: 'Nro Legajo', size: 140 },
    { accessorKey: 'nombre', header: 'Nombre' },
    {
      id: 'acciones',
      header: 'Acciones',
      size: 110,
      cell: ({ row }: any) => {
        const orig = row.original as GremioUI;
        const idx = gremiosUI.findIndex(r => Number(r.legajo ?? 0) === Number(orig.legajo ?? 0) && (r.nombre ?? '') === (orig.nombre ?? ''));
        return (
          <div className={styles.actionsInline}>
            <IconButton size="small" onClick={() => { setNuevoGremio(orig); setEditGremioIndex(idx); }} title="Editar">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setGremiosUI(prev => prev.filter((_, i) => i !== idx))} title="Eliminar">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        );
      },
      meta: { align: 'center' }
    }
  ], [gremiosUI]);

  const columnasResponsables = useMemo(() => [
    {
      accessorKey: 'cuit',
      header: 'CUIT',
      size: 130,
      cell: ({ getValue }: any) => {
        const v = getValue();
        return String(v || '').replace(/\D/g, '').length === 11 ? CUIP(v) : String(v ?? '');
      }
    },
    {
      accessorKey: 'responsable',
      header: 'Nombre y apellido',
      size: 360,
    },
    {
      accessorKey: 'cargo',
      header: 'Cargo',
      size: 180,
      cell: ({ getValue }: any) => {
        const val = getValue();
        if (!val) return '';
        if (val === 'H') return 'Profesional de Higiene y Seguridad en el Trabajo';
        if (val === 'M') return 'Profesional de Medicina Laboral';
        if (val === 'R') return 'Responsable de Datos del Formulario';
        return String(val);
      }
    },
    {
      accessorKey: 'representacion',
      header: 'Representación',
      size: 120,
      cell: ({ getValue }: any) => {
        const v = Number(getValue());
        switch (v) {
          case 1: return 'Representante Legal';
          case 2: return 'Presidente';
          case 3: return 'VicePresidente';
          case 4: return 'Director General';
          case 5: return 'Gerente General';
          case 6: return 'Administrador General';
          case 0: return 'Otros';
          default: return '';
        }
      }
    },
    {
      accessorKey: 'esContratado',
      header: 'Propio/contratado',
      size: 110,
      cell: ({ getValue }: any) => (Number(getValue()) === 1 ? 'Propio' : Number(getValue()) === 0 ? 'Contratado' : ''),
    },
    { accessorKey: 'tituloHabilitante', header: 'Título', size: 160 },
    { accessorKey: 'matricula', header: 'Matrícula', size: 120 },
    { accessorKey: 'entidadOtorganteTitulo', header: 'Entidad', size: 160 },
    {
      id: 'acciones',
      header: 'Acciones',
      size: 110,
      cell: ({ row }: any) => {
        const orig = row.original as ResponsableUI;
        const idx = responsablesUI.findIndex(r => String(r.cuit ?? '') === String(orig.cuit ?? '') && (r.responsable ?? '') === (orig.responsable ?? ''));
        return (
          <div className={styles.actionsInline}>
            <IconButton size="small" onClick={() => { setNuevoResponsable(orig); setEditRespIndex(idx); }} title="Editar">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setResponsablesUI(prev => prev.filter((_, i) => i !== idx))} title="Eliminar">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        );
      },
      meta: { align: 'center' }
    }
  ], [responsablesUI]);

  const [openGremios, setOpenGremios] = useState(false);
  const [openContratistas, setOpenContratistas] = useState(false);
  const [openResponsables, setOpenResponsables] = useState(false);

  // Carga el formulario ya creado/edición (paso 2)
  const cargarPaso2 = useCallback(async () => {
    if (!idFromQuery) return;
    setLoading(true);
    setError('');
    try {
      const [tfs, frm] = await Promise.all([fetchTipos(), fetchFormularioById(idFromQuery)]);
      setTipos(tfs);
      setForm(frm);

      try {
        const respGrem = (frm.respuestasGremio ?? []) as any[];
        const meaningfulGrem = respGrem.filter(g => {
          const leg = Number(g?.legajo ?? 0) || 0;
          const nombre = (g?.nombre ?? '')?.toString().trim();
          return leg !== 0 || (nombre && nombre.length > 0);
        });
        if (meaningfulGrem.length === 0) {
          console.log('GenerarFormularioRGRL: la API devolvió sólo gremios vacíos; se omiten.');
          setGremiosUI([]);
        } else {
          setGremiosUI(respGrem.map((g: any) => ({
            legajo: Number(g?.legajo ?? 0) || 0,
            nombre: g?.nombre ?? ''
          })));
        }
      } catch (err) {
        console.log('Error procesando respuestasGremio:', err);
        setGremiosUI([]);
      }

      try {
        const respContr = (frm.respuestasContratista ?? []) as any[];
        const meaningfulContr = respContr.filter(c => {
          const cuit = Number(c?.cuit ?? 0) || 0;
          const nombre = (c?.contratista ?? '')?.toString().trim();
          return cuit !== 0 || (nombre && nombre.length > 0);
        });
        if (meaningfulContr.length === 0) {
          console.log('GenerarFormularioRGRL: la API devolvió sólo contratistas vacíos; se omiten.');
          setContratistasUI([]);
        } else {
          setContratistasUI(respContr.map((c: any) => ({
            cuit: Number(c?.cuit ?? 0) || undefined,
            contratista: c?.contratista ?? ''
          })));
        }
      } catch (err) {
        console.log('Error procesando respuestasContratista:', err);
        setContratistasUI([]);
      }

      try {
        const respResp = (frm.respuestasResponsable ?? []) as any[];
        // detectamos filas con contenido real (CUIT o nombre)
        const meaningful = respResp.filter(r => {
          const c = Number(r?.cuit ?? 0) || 0;
          const nombre = (r?.responsable ?? '')?.toString().trim();
          return c !== 0 || (nombre && nombre.length > 0);
        });
        if (meaningful.length === 0) {
          console.log('GenerarFormularioRGRL: la API devolvió sólo responsables vacíos; se omiten.');
          setResponsablesUI([]);
        } else {
          setResponsablesUI(respResp.map((r: any) => ({
            cuit: Number(r?.cuit ?? 0) || undefined,
            responsable: r?.responsable ?? '',
            cargo: r?.cargo ?? '',
            representacion: Number(r?.representacion ?? 0) || undefined,
            esContratado: Number(r?.esContratado ?? 0) || undefined,
            tituloHabilitante: r?.tituloHabilitante ?? '',
            matricula: r?.matricula ?? '',
            entidadOtorganteTitulo: r?.entidadOtorganteTitulo ?? '',
          })));
        }
      } catch (err) {
        console.log('Error procesando respuestasResponsable:', err);
        setResponsablesUI([]);
      }

      const dict: Record<number, RespuestaCuestionarioVm> = {};
      for (const r of frm.respuestasCuestionario || []) {
        if (r.internoCuestionario != null) dict[r.internoCuestionario] = { ...r };
      }
      setRespuestas(dict);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar formulario.');
    } finally {
      setLoading(false);
    }
  }, [idFromQuery]);

  useEffect(() => {
    if (idFromQuery && !isModal) cargarPaso2();
  }, [idFromQuery, isModal, cargarPaso2]);

  const tipoDeEsteFormulario = useMemo(() => {

    // Obtiene el tipo de formulario actual según 'interno'
    if (!form || !tipos?.length) return undefined;
    return tipos.find((t) => t.interno === form.internoFormulario);
  }, [form, tipos]);

  // Actualiza una respuesta parcial del cuestionario
  const onCambiarRespuesta = (internoCuestionario: number, cambios: Partial<RespuestaCuestionarioVm>) => {
    setRespuestas((prev) => {
      const base = prev[internoCuestionario] ?? { internoCuestionario, respuesta: '' };
      return { ...prev, [internoCuestionario]: { ...base, ...cambios } };
    });
  };

  const PAGE_SIZE = 20;
  const secciones = useMemo(() => {
    const t = tipos.find((x) => x.interno === form?.internoFormulario);
    return (t?.secciones ?? []).slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  }, [tipos, form]);

  const [secIdx, setSecIdx] = useState(0);
  const totalSecs = secciones.length;
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(Math.floor(secIdx / PAGE_SIZE)); }, [secIdx]);

  const guardarPUT = async (completar: boolean) => {
    if (!form) return;
    setLoading(true);
    setError('');
    try {
      const fullCuest: any[] = [];
      for (const sec of secciones) {
        const qs = (sec.cuestionarios ?? []).slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        for (const q of qs) {
          const key = q.codigo as number;
          const r = respuestas[key] ?? {};
            fullCuest.push({
            interno: r.interno ?? 0,
            internoCuestionario: key,
            internoRespuestaFormulario: r.internoRespuestaFormulario ?? form.interno ?? 0,
            respuesta: r.respuesta ?? '',
            fechaRegularizacion: r.fechaRegularizacion ?? 0,
            observaciones: r.observaciones ?? '',
              fechaRegularizacionNormal: (r as any).fechaRegularizacionNormal ?? null,
            estadoAccion: r.estadoAccion ?? 'A',
            estadoFecha: r.estadoFecha ?? 0,
            estadoSituacion: r.estadoSituacion ?? '',
            bajaMotivo: r.bajaMotivo ?? 0,
          });
        }
      }

      const gremiosFull = gremiosUI.map((g, i) => ({
        internoRespuestaFormulario: form.interno ?? 0,
        legajo: Number(g.legajo ?? 0),
        nombre: g.nombre ?? '',
        estadoAccion: 'A',
        estadoFecha: 0,
        estadoSituacion: '',
        bajaMotivo: 0,
        renglon: i,
      }));
      const contratistasFull = contratistasUI.map((c, i) => ({
        internoRespuestaFormulario: form.interno ?? 0,
        cuit: Number(c.cuit ?? 0),
        contratista: c.contratista ?? '',
        estadoAccion: 'A',
        estadoFecha: 0,
        estadoSituacion: '',
        bajaMotivo: 0,
        renglon: i,
      }));
      const responsablesFull = responsablesUI.map((r, i) => ({
        internoRespuestaFormulario: form.interno ?? 0,
        cuit: Number(r.cuit ?? 0),
        responsable: r.responsable ?? '',
        cargo: r.cargo ?? '',
        representacion: Number(r.representacion ?? 0),
        esContratado: Number(r.esContratado ?? 0),
        tituloHabilitante: r.tituloHabilitante ?? '',
        matricula: r.matricula ?? '',
        entidadOtorganteTitulo: r.entidadOtorganteTitulo ?? '',
        estadoAccion: 'A',
        estadoFecha: 0,
        estadoSituacion: '',
        bajaMotivo: 0,
        renglon: i,
      }));

      const payloadPUT = {
        internoFormulario: form.internoFormulario,
        internoEstablecimiento: form.internoEstablecimiento,
        creacionFechaHora: form.creacionFechaHora ?? toIsoOrNull(new Date()),
        completadoFechaHora: completar ? toIsoOrNull(new Date()) : null,
        notificacionFecha: form.notificacionFecha ?? toIsoOrNull(new Date()),
        respuestasCuestionario: fullCuest,
        respuestasGremio: gremiosFull,
        respuestasContratista: contratistasFull,
        respuestasResponsable: responsablesFull,
        internoPresentacion: form.internoPresentacion ?? 0,
        fechaSRT: form.fechaSRT ?? toIsoOrNull(new Date()),
      };

      const res = await fetch(`${API_BASE}/FormulariosRGRL/${form.interno}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadPUT),
      });

      await res.json().catch(() => null);
      if (!res.ok) throw new Error(`PUT /FormulariosRGRL/${form.interno} -> ${res.status}`);

      router.replace('/inicio/empleador/formularioRGRL');
    } catch (e: any) {
      setError(e?.message ?? (completar ? 'Error al finalizar.' : 'Error al guardar incompleto.'));
    } finally {
      setLoading(false);
    }
  };

  if (!isModal && idFromQuery && !form) {
    return null;
  }

  if (!isModal && idFromQuery && form) {
    const secActual = secciones[secIdx];
    const preguntas = (secActual?.cuestionarios ?? []).slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
    const tieneNA = secActual?.tieneNoAplica === 1;

    const renderPaginador = () => {
      const totalPages = Math.max(1, Math.ceil(totalSecs / PAGE_SIZE));
      const pageStart = page * PAGE_SIZE;
      const pageEnd = Math.min(pageStart + PAGE_SIZE, totalSecs);


      return (
        <div className={styles.paginatorBar}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className={`${styles.pagerBtn} ${styles.pagerBtnNarrow}`}
          >
            &lt;
          </button>

          {Array.from({ length: pageEnd - pageStart }, (_, k) => {
            const i = pageStart + k;
            const active = i === secIdx;
            return (
              <button
                key={secciones[i].interno ?? i}
                onClick={() => setSecIdx(i)}
                className={`${styles.pagerBtn} ${active ? styles.pagerBtnActive : ''}`}
                title={secciones[i].descripcion}
              >
                {i + 1}
              </button>
            );
          })}

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className={`${styles.pagerBtn} ${styles.pagerBtnNarrow}`}
          >
            &gt;
          </button>
        </div>
      );
    };

    return (

      <div className={styles.container}>
        {/* Vista de edición del formulario — preguntas, paginador y listas (gremios/contratistas/responsables). */}
        <h2 className={styles.sectionHeaderTitle} />
        <div className={styles.sectionHeaderSubtitle}>

          Sección {secIdx + 1} de {totalSecs} — {secActual?.descripcion}
        </div>

        <div className={`${styles.row} ${styles.sectionHeaderButtons}`}>
          <CustomButton onClick={() => setOpenGremios(true)}>Gremios</CustomButton>
          <CustomButton onClick={() => setOpenContratistas(true)}>Contratistas</CustomButton>
          <CustomButton onClick={() => setOpenResponsables(true)}>Responsables</CustomButton>
        </div>

        {renderPaginador()}
        <div className={styles.questionsBox}>
          {preguntas.map((q) => {
            const key = q.codigo as number;
            const rr = respuestas[key] ?? {};
            const value = rr.respuesta ?? '';
            return (
              <div key={key} className={styles.questionCard}>
                <div className={styles.questionTitle}>
                  {q.orden}. {q.pregunta}{' '}
                  {q.comentario ? <span className={styles.questionComment}>— {q.comentario}</span> : null}
                </div>

                <div className={styles.radioRow}>
                  <label>
                    <input
                      type="radio"
                      name={`r-${key}`}
                      checked={value === 'SI'}
                      onChange={() => onCambiarRespuesta(key, { respuesta: 'SI' })}
                    /> SI
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`r-${key}`}
                      checked={value === 'NO'}
                      onChange={() => onCambiarRespuesta(key, { respuesta: 'NO' })}
                    /> NO
                  </label>
                  {tieneNA ? (
                    <label>
                      <input
                        type="radio"
                        name={`r-${key}`}
                        checked={value === 'NA'}
                        onChange={() => onCambiarRespuesta(key, { respuesta: 'NA' })}
                      /> No aplica
                    </label>
                  ) : null}
                </div>

                <div className={styles.obsArea}>
                  <textarea
                    value={rr.observaciones ?? ''}
                    onChange={(e) => onCambiarRespuesta(key, { observaciones: e.target.value })}
                    placeholder="Observaciones…"
                    className={styles.textarea}

                  />
                </div>

                <div className={styles.dateRow}>
                  <label className={styles.dateLabel}>Fecha regularización:</label>
                  <input
                    type="date"
                    value={
                      rr.fechaRegularizacionNormal ?? (rr.fechaRegularizacion ? `${String(rr.fechaRegularizacion).slice(0,4)}-${String(rr.fechaRegularizacion).slice(4,6)}-${String(rr.fechaRegularizacion).slice(6,8)}` : '')
                    }
                    onChange={(e) => {
                      const iso = e.target.value || '';
                      const digits = iso ? iso.replace(/-/g, '') : '';
                      onCambiarRespuesta(key, {
                        fechaRegularizacion: digits ? Number(digits) : 0,
                        fechaRegularizacionNormal: iso ? iso : null,
                      });
                    }}
                    placeholder="2025-10-30"
                    className={styles.dateInputNum}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.row}>
          <CustomButton onClick={() => router.back()} disabled={loading}>VOLVER</CustomButton>
          <CustomButton onClick={() => setConfirmOpen(true)} disabled={loading}>GUARDAR Y CONFIRMAR</CustomButton>
          <CustomButton onClick={() => guardarPUT(false)} disabled={loading}>GUARDAR</CustomButton>
        </div>

        {loading && <div className={styles.savingMsg}>Guardando…</div>}
        {!!error && <div className={styles.errorMsg}>{error}</div>}

        <CustomModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          size="mid"
          actions={
            <div className={styles.confirmActionsInner}>
              <CustomButton
                onClick={() => {
                  setConfirmOpen(false);
                  guardarPUT(true);
                }}
              >
                SI
              </CustomButton>
              <CustomButton onClick={() => setConfirmOpen(false)}>NO</CustomButton>
            </div>
          }
        >
          <div className={styles.confirmDialogContent}>
            ¿Está seguro que desea CONFIRMAR el formulario?
          </div>
        </CustomModal>

        <CustomModal open={openGremios} onClose={() => setOpenGremios(false)} title="Representación Gremial" size="mid">
          <div className="formGrid">
            <div className={styles.modalGrid120}>
              <TextField
                label="Nro. Legajo"
                type="number"
                value={nuevoGremio.legajo ?? ''}
                onChange={(e) => setNuevoGremio(prev => ({ ...prev, legajo: e.target.value ? Number(e.target.value) : undefined }))}
              />
              <TextField
                label="Nombre"
                value={nuevoGremio.nombre ?? ''}
                onChange={(e) => setNuevoGremio(prev => ({ ...prev, nombre: e.target.value }))}
                fullWidth
              />
            </div>
            <div className={styles.modalActionsRow}>
              <CustomButton onClick={() => {
                if (editGremioIndex != null && editGremioIndex >= 0) {
                  setGremiosUI(prev => prev.map((p, idx) => idx === editGremioIndex ? (nuevoGremio as GremioUI) : p));
                  setEditGremioIndex(null);
                } else {
                  setGremiosUI(prev => [...prev, nuevoGremio as GremioUI]);
                }
                setNuevoGremio({ legajo: undefined, nombre: '' });
              }}>{editGremioIndex != null ? 'GUARDAR CAMBIOS' : 'AGREGAR'}</CustomButton>
            </div>
            <div className={styles.modalTableWrapper}>
              <DataTableImport
                data={gremiosUI}
                columns={columnasGremios as any}
                size="small"
                pageSizeOptions={[5, 10, 15]}
                enableSorting={true}
                enableFiltering={false}
                onRowClick={(rowData) => {
                  const index = gremiosUI.findIndex(r => Number(r.legajo ?? 0) === Number((rowData as any).legajo ?? 0) && (r.nombre ?? '') === ((rowData as any).nombre ?? ''));
                  if (index >= 0) {
                    setNuevoGremio(gremiosUI[index]);
                    setEditGremioIndex(index);
                  }
                }}
              />
            </div>

            <div className={styles.tableFooter}>
              <CustomButton onClick={() => setOpenGremios(false)}>GUARDAR</CustomButton>
            </div>
          </div>
        </CustomModal>
        <CustomModal open={openContratistas} onClose={() => setOpenContratistas(false)} title="Contratistas" size="mid">
          <div className="formGrid">
            <div className={styles.modalGrid160}>
              <TextField
                label="CUIT"
                value={
                  String(nuevoContratista.cuit ?? '').replace(/[^\d]/g, '').length === 11
                    ? CUIP(nuevoContratista.cuit)
                    : String(nuevoContratista.cuit ?? '')
                }
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^\d]/g, '');
                  setNuevoContratista(prev => ({ ...prev, cuit: digits ? Number(digits) : undefined }));
                }}
                inputMode="numeric"
              />
              <TextField
                label="Contratista"
                value={nuevoContratista.contratista ?? ''}
                onChange={(e) => setNuevoContratista(prev => ({ ...prev, contratista: e.target.value }))}
                fullWidth
              />
            </div>
            <div className={styles.modalActionsRow}>
              <CustomButton onClick={() => {
                if (editContrIndex != null && editContrIndex >= 0) {
                  setContratistasUI(prev => prev.map((p, idx) => idx === editContrIndex ? (nuevoContratista as ContratistaUI) : p));
                  setEditContrIndex(null);
                } else {
                  setContratistasUI(prev => [...prev, nuevoContratista as ContratistaUI]);
                }
                setNuevoContratista({ cuit: undefined, contratista: '' });
              }}>{editContrIndex != null ? 'GUARDAR CAMBIOS' : 'AGREGAR'}</CustomButton>
            </div>
            <div className={styles.modalTableWrapper}>
              <DataTableImport
                data={contratistasUI}
                columns={columnasContratistas as any}
                size="small"
                pageSizeOptions={[5, 10, 15]}
                enableSorting={true}
                enableFiltering={false}
                onRowClick={(rowData) => {
                  const index = contratistasUI.findIndex(r => String(r.cuit ?? '') === String((rowData as any).cuit ?? '') && (r.contratista ?? '') === ((rowData as any).contratista ?? ''));
                  if (index >= 0) {
                    setNuevoContratista(contratistasUI[index]);
                    setEditContrIndex(index);
                  }
                }}
              />
            </div>

            <div className={styles.tableFooter}>
              <CustomButton onClick={() => setOpenContratistas(false)}>GUARDAR</CustomButton>
            </div>
          </div>
        </CustomModal>
        <CustomModal open={openResponsables} onClose={() => setOpenResponsables(false)} title="Profesional / Responsable" size="large">
          <div className="formGrid">
            <div className={styles.modalGridRespTop}>
              <TextField
                label="CUIT"
                value={(() => {
                  const digits = String(nuevoResponsable.cuit ?? '').replace(/[^\d]/g, '');
                  return digits.length === 11 ? CUIP(digits) : (digits ? digits : '');
                })()}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^\d]/g, '');
                  setNuevoResponsable(prev => ({ ...prev, cuit: digits ? Number(digits) : undefined }));
                }}
                inputMode="numeric"
              />
              <TextField
                label="Nombre y apellido"
                value={nuevoResponsable.responsable ?? ''}
                onChange={(e) => setNuevoResponsable(prev => ({ ...prev, responsable: e.target.value }))}
                fullWidth
              />
              <FormControl>
                <InputLabel>Cargo</InputLabel>
                <Select
                  value={nuevoResponsable.cargo ?? ''}
                  onChange={(e) => setNuevoResponsable(prev => ({ ...prev, cargo: e.target.value }))}
                >
                  <MenuItem value=""><em>Seleccioná...</em></MenuItem>
                  <MenuItem value={'H'}>Profesional de Higiene y Seguridad en el Trabajo</MenuItem>
                  <MenuItem value={'M'}>Profesional de Medicina Laboral</MenuItem>
                  <MenuItem value={'R'}>Responsable de Datos del Formulario</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>Representación</InputLabel>
                <Select
                  value={nuevoResponsable.representacion ?? ''}
                  onChange={(e) => setNuevoResponsable(prev => ({ ...prev, representacion: Number(e.target.value || 0) }))}
                >
                  <MenuItem value=""><em>Seleccioná...</em></MenuItem>
                  <MenuItem value={1}>Representante Legal</MenuItem>
                  <MenuItem value={2}>Presidente</MenuItem>
                  <MenuItem value={3}>VicePresidente</MenuItem>
                  <MenuItem value={4}>Director General</MenuItem>
                  <MenuItem value={5}>Gerente General</MenuItem>
                  <MenuItem value={6}>Administrador General</MenuItem>
                  <MenuItem value={0}>Otros</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div className={styles.modalGridRespBottom}>
              <FormControl>
                <InputLabel>Propio/Contratado</InputLabel>
                <Select
                  value={typeof nuevoResponsable.esContratado === 'number' ? nuevoResponsable.esContratado : ''}
                  onChange={(e) => {
                    const v = e.target.value as string | number;
                    setNuevoResponsable(prev => ({ ...prev, esContratado: v === '' ? undefined : Number(v) }));
                  }}
                >
                  <MenuItem value=""><em>Seleccioná...</em></MenuItem>
                  <MenuItem value={0}>Contratado</MenuItem>
                  <MenuItem value={1}>Propio</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Título"
                value={nuevoResponsable.tituloHabilitante ?? ''}
                onChange={(e) => setNuevoResponsable(prev => ({ ...prev, tituloHabilitante: e.target.value }))}
              />
              <TextField
                label="Matrícula"
                value={nuevoResponsable.matricula ?? ''}
                onChange={(e) => setNuevoResponsable(prev => ({ ...prev, matricula: e.target.value }))}
              />
              <TextField
                label="Entidad"
                value={nuevoResponsable.entidadOtorganteTitulo ?? ''}
                onChange={(e) => setNuevoResponsable(prev => ({ ...prev, entidadOtorganteTitulo: e.target.value }))}
                fullWidth
              />
            </div>
            <div className={styles.modalActionsRow}>
              <CustomButton onClick={() => {
                if (editRespIndex != null && editRespIndex >= 0) {
                  setResponsablesUI(prev => prev.map((p, idx) => idx === editRespIndex ? (nuevoResponsable as ResponsableUI) : p));
                  setEditRespIndex(null);
                } else {
                  setResponsablesUI(prev => [...prev, nuevoResponsable as ResponsableUI]);
                }
                setNuevoResponsable({ cuit: undefined, responsable: '', cargo: '', representacion: undefined, esContratado: undefined, tituloHabilitante: '', matricula: '', entidadOtorganteTitulo: '' });
              }}>{editRespIndex != null ? 'GUARDAR CAMBIOS' : 'AGREGAR'}</CustomButton>
            </div>

            {/* Tabla de responsables (usando DataTableImport) */}
            <div className={styles.modalTableWrapper}>
              <DataTableImport
                data={responsablesUI}
                columns={columnasResponsables as any}
                size="small"
                pageSizeOptions={[5, 10, 15]}
                enableSorting={true}
                enableFiltering={false}
                onRowClick={(rowData) => {
                  // Si se hace click en la fila, seleccionamos para editar si coincide
                  const index = responsablesUI.findIndex(r => String(r.cuit ?? '') === String((rowData as any).cuit ?? '') && (r.responsable ?? '') === ((rowData as any).responsable ?? ''));
                  if (index >= 0) {
                    setNuevoResponsable(responsablesUI[index]);
                    setEditRespIndex(index);
                  }
                }}
              />
            </div>

            <div className={styles.tableFooter}>
              <CustomButton onClick={() => setOpenResponsables(false)}>GUARDAR</CustomButton>
            </div>
          </div>
        </CustomModal>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Carga de datos inicial y botones para crear/replicar el formulario. */}
      <Box className={styles.filterCuitBox}>
        <TextField
          label="CUIT"
          value={
            cuit
              ? (String(cuit).replace(/\D/g, '').length === 11 ? CUIP(cuit) : String(cuit))
              : ''
          }
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d]/g, '');
            setCuit(digits ? Number(digits) : undefined);
          }}
          placeholder="Ingresá CUIT"
          inputMode="numeric"
          fullWidth
        />
      </Box>
      <Box className={styles.razonSocialBox}>
        <TextField
          label="Razón Social"
          value={razonSocial}
          placeholder="Sin datos"
          fullWidth
          InputProps={{ readOnly: true }}
        />
      </Box>
      <Box className={styles.establecimientoBox}>
          <FormControl fullWidth disabled={esReplica} title={esReplica ? 'Tipo fijado por replicación' : undefined}>
            <Autocomplete
              options={establecimientos}
              getOptionLabel={(opt) => {
                const suc = String(opt.nroSucursal ?? '').trim();
                const calle = String(opt.domicilioCalle ?? '').trim();
                const nro = String(opt.domicilioNro ?? '').trim();
                const dir = [calle, nro].filter(Boolean).join(' ').trim();
                return [suc, dir].filter(Boolean).join(' - ').trim();
              }}
              value={estActual ?? null}
              onChange={(_e, newVal) => setEstablecimientoSel(newVal ? newVal.interno : undefined)}
              isOptionEqualToValue={(option, value) => option.interno === value.interno}
              renderInput={(params) => <TextField {...params} label="Establecimiento" />}
              disabled={esReplica}
            />
          </FormControl>
      </Box>
      {estActual && (
        <Box className={styles.estDatosGrid}>
          <TextField
            label="Superficie"
            type="number"
            value={estSuperficie}
            onChange={(e) => setEstSuperficie(e.target.value)}
            fullWidth
            inputProps={{ inputMode: 'numeric' }}
          />
          <TextField
            label="Cant. Trabajadores"
            type="number"
            value={estCantTrab}
            onChange={(e) => setEstCantTrab(e.target.value)}
            fullWidth
            inputProps={{ inputMode: 'numeric' }}
          />
          <TextField
            label="CIIU"
            value={estActual.ciiu ?? ''}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Box>
      )}
      <Box className={styles.establecimientoBox}>
        <FormControl fullWidth disabled={esReplica} title={esReplica ? 'Tipo fijado por replicación' : undefined}>
          <InputLabel>Formulario</InputLabel>
          <Select
            label="Formulario"
            value={tipoSel ?? ''}
            onChange={(e) => setTipoSel(Number(e.target.value) || undefined)}
          >
            <MenuItem value="" disabled>Seleccioná</MenuItem>
            {tipos.map((t) => (
              <MenuItem key={t.interno} value={t.interno}>{t.descripcion}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box className={styles.accionesFooter}>
        <CustomButton
          onClick={() => {
            if (isModal) {
              onDone?.(0);
            } else {
              router.back();
            }
          }}
        >
          VOLVER
        </CustomButton>
        <CustomButton onClick={crearFormulario} disabled={!cuit}>CREAR FORMULARIO</CustomButton>
      </Box>
      <CustomModalMessage
        open={modalMsgOpen}
        onClose={handleCloseModalMsg}
        message={modalMsg}
        type={modalMsgType}
        title="Datos faltantes" // Título personalizado para esta alerta
      />
    </div>
  );
};

export default GenerarFormularioRGRL;
