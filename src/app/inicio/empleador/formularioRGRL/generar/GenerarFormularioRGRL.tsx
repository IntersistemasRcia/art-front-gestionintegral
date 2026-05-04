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

import ArtAPI, { type ApiFormulariosRGRLParams } from '@/data/artAPI';
import CabeceraFormulario from './CabeceraFormulario';
import { useAuth } from '@/data/AuthContext';


import type {
  Establecimiento,
  TipoFormulario,
  RespuestaCuestionarioVm,
  FormularioVm,
  GremioUI,
  ContratistaUI,
  ResponsableUI
} from './types/generar';

// Helper: convierte fecha a ISO (o null)
const toIsoOrNull = (v?: string | Date | null) => {
  if (!v) return null;
  const d = dayjs(v);
  return d.isValid() ? d.toISOString() : null;
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

// Componente principal: crea, edita o replica formularios RGRL
const GenerarFormularioRGRL: React.FC<{
  initialCuit?: number;
  /** Ids de empresa del combo del listado; se envían en GetBySpecs (empresasId). */
  empresasIdGetBySpecs?: number[];
  replicaDe?: number;
  onDone?: (nuevoId: number) => void;
  onClose?: () => void;
}> = ({ initialCuit, empresasIdGetBySpecs, replicaDe, onDone, onClose }) => {

  const router = useRouter();
  const { hasTask } = useAuth();
  const search = useSearchParams();
  // En modal (onDone) se ignoran query params.
  const isModal = Boolean(onDone || onClose);

  const buildGetBySpecsParams = useCallback(
    (extra: Partial<ApiFormulariosRGRLParams> = {}): ApiFormulariosRGRLParams => ({
      empresasId: empresasIdGetBySpecs ?? [],
      ...extra,
    }),
    [empresasIdGetBySpecs]
  );

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

  const cuitSoloLecturaDesdeEmpresaLista = useMemo(
    () =>
      Boolean(
        onClose &&
          !replicaDe &&
          !replicaDeQuery &&
          typeof initialCuit === 'number' &&
          initialCuit > 0
      ),
    [onClose, replicaDe, replicaDeQuery, initialCuit]
  );

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
  const [fechaSRTEdit, setFechaSRTEdit] = useState<string>('');

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
      const [formulariosRes, ests, tfs] = await Promise.all([
        ArtAPI.getFormulariosRGRL(buildGetBySpecsParams({ CUIT: cuit!, PageIndex: 1, PageSize: 1 })),
        fetchEstablecimientos(cuit!),
        ArtAPI.getTiposFormulariosRGRL(),
      ]);
      const rs = (formulariosRes.data?.[0]?.razonSocial ?? '') as string;
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
  }, [cuit, canBuscar, buildGetBySpecsParams]);

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
      const frm = await ArtAPI.getFormularioRGRLById(replId);
      setOriginal(frm);

      const c = Number((frm as any).cuit ?? 0) || undefined;
      if (c) setCuit(c);

      const [formulariosRes, ests, tfs] = await Promise.all([
        c ? ArtAPI.getFormulariosRGRL(buildGetBySpecsParams({ CUIT: c, PageIndex: 1, PageSize: 1 })) : Promise.resolve({ data: [], index: 0, size: 0, pages: 0, count: 0 }),
        c ? fetchEstablecimientos(c) : Promise.resolve([] as Establecimiento[]),
        ArtAPI.getTiposFormulariosRGRL(),
      ]);
      const rs = (formulariosRes.data?.[0]?.razonSocial ?? '') as string;
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
  }, [replicaDe, replicaDeQuery, buildGetBySpecsParams]);

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
        await ArtAPI.patchEstablecimientoRGRL(establecimientoSel!, payloadEst);
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
        completadoFechaHora: null,
        notificacionFecha: toIsoOrNull(new Date()),
        internoPresentacion: 0,
        fechaSRT: null,
      };

      const data = await ArtAPI.postFormularioRGRL(payload);
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

        await ArtAPI.putFormularioRGRL(nuevoId, payloadPUT);

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

  type InlinePanel = 'preguntas' | 'gremios' | 'contratistas' | 'responsables';
  const [panel, setPanel] = useState<InlinePanel>('preguntas');
  const puedeVerCabeceraEdicion = hasTask('Empleador_FormularioRGRL_EditarDenunciaConfirmada');

  // Carga el formulario ya creado/edición (paso 2)
  const cargarPaso2 = useCallback(async () => {
    if (!idFromQuery) return;
    setLoading(true);
    setError('');
    try {
      const [tfs, frm] = await Promise.all([ArtAPI.getTiposFormulariosRGRL(), ArtAPI.getFormularioRGRLById(idFromQuery)]);
      setTipos(tfs);
      setForm(frm);
      setFechaSRTEdit(frm.fechaSRT && dayjs(frm.fechaSRT).isValid() ? dayjs(frm.fechaSRT).format('YYYY-MM-DD') : '');
      const c = Number((frm as any).cuit ?? 0) || undefined;
      setCuit(c);
      setEstablecimientoSel(frm.internoEstablecimiento);
      setTipoSel(frm.internoFormulario);
      if (c) {
        const [formulariosRes, ests] = await Promise.all([
          ArtAPI.getFormulariosRGRL(buildGetBySpecsParams({ CUIT: c, PageIndex: 1, PageSize: 1 })),
          fetchEstablecimientos(c),
        ]);
        const rs = (formulariosRes.data?.[0]?.razonSocial ?? '') as string;
        setRazonSocial(rs);
        setEstablecimientos(ests);
      }

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
            representacion: r?.representacion === 0 || r?.representacion === '0' ? 0 : (Number(r?.representacion ?? 0) || undefined),
            esContratado: r?.esContratado === 0 || r?.esContratado === '0' ? 0 : (Number(r?.esContratado ?? 0) || undefined),
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
  }, [idFromQuery, buildGetBySpecsParams]);

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

  // Mapas de páginas por rangos de 'interno' según tipo de formulario.
  const pagesMap = useMemo(() => {
    const a = [
      [1, 20],
      [21, 43],
      [44, 63],
      [64, 90],
      [91, 112],
      [113, 134],
      [135, 149],
      [150, 161],
      'PA',
      'PC'
    ];
    const b = [
      [1, 26],
      [27, 51],
      [52, 80],
      [81, 104],
      [105, 135],
      [136, 162],
      [163, 188],
      [189, 210],
      'PA',
      'PC'
    ];
    const c = [
      [1, 19],
      [20, 52],
      [53, 70],
      [71, 82],
      [83, 98],
      [99, 134],
      [135, 148],
      [149, 151],
      'PA',
      'PC'
    ];

    const kind = (tipoDeEsteFormulario?.descripcion ?? '').toString().toUpperCase();
    if (kind.includes('FORMULARIO A') || kind.endsWith(' A')) return { pages: a, showPlanillas: true };
    if (kind.includes('FORMULARIO B') || kind.endsWith(' B')) return { pages: b, showPlanillas: true };
    if (kind.includes('FORMULARIO C') || kind.endsWith(' C')) return { pages: c, showPlanillas: true };
    return { pages: null as null | any[], showPlanillas: false };
  }, [tipoDeEsteFormulario]);

  const guardarPUT = async (completar: boolean, options?: { redirigir?: boolean; fechaSRTOverride?: string | null }) => {
    if (!form) return;

    for (let i = 0; i < gremiosUI.length; i++) {
      const g = gremiosUI[i] ?? {};
      const tieneLegajo = Number(g.legajo ?? 0) > 0;
      const tieneNombre = String(g.nombre ?? '').trim() !== '';
      if (tieneLegajo !== tieneNombre) {
        setError('');
        setModalMsg(`En Representación Gremial, la fila ${i + 1} tiene datos incompletos. Complete Legajo y Nombre.`);
        setModalMsgType('error');
        setModalMsgOpen(true);
        return;
      }
    }

    for (let i = 0; i < contratistasUI.length; i++) {
      const c = contratistasUI[i] ?? {};
      const tieneCuit = Number(c.cuit ?? 0) > 0;
      const tieneContratista = String(c.contratista ?? '').trim() !== '';
      if (tieneCuit !== tieneContratista) {
        setError('');
        setModalMsg(`En Contratista, la fila ${i + 1} tiene datos incompletos. Complete CUIT y Contratista.`);
        setModalMsgType('error');
        setModalMsgOpen(true);
        return;
      }
      if (tieneCuit && String(c.cuit).length !== 11) {
        setError('');
        setModalMsg(`En Contratista, la fila ${i + 1}: el CUIT debe tener 11 dígitos.`);
        setModalMsgType('error');
        setModalMsgOpen(true);
        return;
      }
    }

    for (let i = 0; i < responsablesUI.length; i++) {
        const r = responsablesUI[i] ?? {};
        const tieneDatos =
        Number(r.cuit ?? 0) > 0 ||
          String(r.responsable ?? '').trim() !== '' ||
          String(r.cargo ?? '').trim() !== '' ||
          typeof r.esContratado === 'number' ||
          typeof r.representacion === 'number' ||
          String(r.tituloHabilitante ?? '').trim() !== '' ||
          String(r.matricula ?? '').trim() !== '' ||
          String(r.entidadOtorganteTitulo ?? '').trim() !== '';
      if (tieneDatos) {
        if (!Number(r.cuit ?? 0)) {
          setError('');
          setModalMsg(`En Responsables, la fila ${i + 1} requiere CUIT (distinto de 0).`);
          setModalMsgType('error');
          setModalMsgOpen(true);
          return;
        }
        if (String(r.cuit).length !== 11) {
          setError('');
          setModalMsg(`En Responsables, la fila ${i + 1}: el CUIT debe tener 11 dígitos.`);
          setModalMsgType('error');
          setModalMsgOpen(true);
          return;
        }
        if (!String(r.responsable ?? '').trim()) {
          setError('');
          setModalMsg(`En Responsables, la fila ${i + 1} requiere Nombre y apellido.`);
          setModalMsgType('error');
          setModalMsgOpen(true);
          return;
        }
        if (!String(r.cargo ?? '').trim()) {
          setError('');
          setModalMsg(`En Responsables, la fila ${i + 1} requiere Cargo.`);
          setModalMsgType('error');
          setModalMsgOpen(true);
          return;
        }
        if (typeof r.representacion !== 'number') {
          setError('');
          setModalMsg(`En Responsables, la fila ${i + 1} requiere completar Representación.`);
          setModalMsgType('error');
          setModalMsgOpen(true);
          return;
        }
        if (typeof r.esContratado !== 'number') {
          setError('');
          setModalMsg(`En Responsables, la fila ${i + 1} requiere completar Propio/Contratado.`);
          setModalMsgType('error');
          setModalMsgOpen(true);
          return;
        }
      }
    }

    if (completar) {
      // Requerir al menos un Responsable de Datos del Formulario con datos completos
      const tieneRespDatos = responsablesUI.some(r => r.cargo === 'R' && (r.cuit ?? '') && (r.responsable ?? '').toString().trim() !== '' && typeof r.representacion === 'number' && typeof r.esContratado === 'number');
      if (!tieneRespDatos) {
        setError('');
        setModalMsg('Debe indicar al menos un Responsable de Datos del Formulario con CUIT, nombre, representación y Propio/Contratado.');
        setModalMsgType('error');
        setModalMsgOpen(true);
        return;
      }

      const preguntasObligatorias = secciones
        .filter((s) => {
          const desc = (s.descripcion ?? '').toString().toUpperCase();
          return !desc.includes('PLANILLA A') && !desc.includes('PLANILLA C') && !desc.includes('PLANILLA B');
        })
        .flatMap((s) => s.cuestionarios ?? [])
        .map((q) => Number(q.codigo ?? 0))
        .filter((codigo) => codigo > 0)
        .filter((codigo, idx, arr) => arr.indexOf(codigo) === idx)
        .sort((a, b) => a - b);

      const hoy = Number(dayjs().format('YYYYMMDD'));
      for (const nro of preguntasObligatorias) {
        const r = respuestas[nro] ?? {};
        const respuesta = String(r.respuesta ?? '').toUpperCase();
        if (respuesta !== 'SI' && respuesta !== 'NO' && respuesta !== 'NA') {
          const preguntaFaltante = secciones
            .flatMap((s) => s.cuestionarios ?? [])
            .find((q) => Number(q.codigo ?? 0) === nro);
          const textoPregunta = String(preguntaFaltante?.pregunta ?? '').trim();
          setError('');
          setModalMsg(
            textoPregunta
              ? `Debe completar todo el formulario para confirmar.`
              : `Falta responder la pregunta ${nro}.`
          );
          setModalMsgType('error');
          setModalMsgOpen(true);
          return;
        }
        if (respuesta === 'NO') {
          const fecha = Number(
            (r.fechaRegularizacionNormal ? String(r.fechaRegularizacionNormal).replace(/-/g, '') : r.fechaRegularizacion) ?? 0
          );
          if (!fecha) {
            setError('');
            setModalMsg(`La pregunta ${nro} con respuesta NO, requiere fecha de regularización.`);
            setModalMsgType('error');
            setModalMsgOpen(true);
            return;
          }
          if (fecha <= hoy) {
            setError('');
            setModalMsg(`La pregunta ${nro} con respuesta NO requiere una fecha posterior a hoy.`);
            setModalMsgType('error');
            setModalMsgOpen(true);
            return;
          }
        }
      }
    }
    setLoading(true);
    setError('');
    try {
      const fullCuest: any[] = [];
      // Recolectar todas las preguntas y ordenar por 'codigo' (interno)
      const allQs = secciones.flatMap(s => (s.cuestionarios ?? [])).slice().sort((a, b) => Number(a.codigo ?? 0) - Number(b.codigo ?? 0));
      for (const q of allQs) {
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

      const gremiosFull = gremiosUI
        .filter((g) => Number(g.legajo ?? 0) > 0)
        .map((g, i) => ({
        internoRespuestaFormulario: form.interno ?? 0,
        legajo: Number(g.legajo ?? 0),
        nombre: g.nombre ?? '',
        estadoAccion: 'A',
        estadoFecha: 0,
        estadoSituacion: '',
        bajaMotivo: 0,
        renglon: i,
      }));
      const contratistasFull = contratistasUI
        .filter((c) => Number(c.cuit ?? 0) > 0)
        .map((c, i) => ({
        internoRespuestaFormulario: form.interno ?? 0,
        cuit: Number(c.cuit ?? 0),
        contratista: c.contratista ?? '',
        estadoAccion: 'A',
        estadoFecha: 0,
        estadoSituacion: '',
        bajaMotivo: 0,
        renglon: i,
      }));
      const responsablesFull = responsablesUI
        .filter((r) => Number(r.cuit ?? 0) > 0)
        .map((r, i) => ({
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
        completadoFechaHora: form.completadoFechaHora ?? (completar ? toIsoOrNull(new Date()) : null),
        notificacionFecha: form.notificacionFecha ?? toIsoOrNull(new Date()),
        respuestasCuestionario: fullCuest,
        respuestasGremio: gremiosFull,
        respuestasContratista: contratistasFull,
        respuestasResponsable: responsablesFull,
        internoPresentacion: form.internoPresentacion ?? 0,
        fechaSRT: typeof options?.fechaSRTOverride !== 'undefined' ? options!.fechaSRTOverride : (form.fechaSRT ?? null),
      };

      await ArtAPI.putFormularioRGRL(form.interno, payloadPUT);

      if (options?.redirigir === false && typeof options?.fechaSRTOverride !== 'undefined') {
        setError('');
        setModalMsg('Fecha SRT actualizada correctamente.');
        setModalMsgType('success');
        setModalMsgOpen(true);
      }

      if (options?.redirigir !== false) {
        router.replace('/inicio/empleador/formularioRGRL');
      }
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
    // Build preguntas según mapa de páginas si existe, sino por sección (comportamiento anterior)
    const allPreguntas = secciones.flatMap(s => (s.cuestionarios ?? []).map(q => ({ ...q, _sec: s })));
    let preguntas: any[] = [];
    let tieneNA = false;
    if (pagesMap.pages) {
      const pages = pagesMap.pages;
      const idx = Math.max(0, Math.min(page, pages.length - 1));
      const sel = pages[idx] ?? [];
      if (Array.isArray(sel) && sel.length === 2) {
        const [from, to] = sel;
        preguntas = allPreguntas.filter(p => {
          const k = Number(p.codigo ?? 0);
          return k >= from && k <= to;
        }).slice().sort((a, b) => Number(a.codigo ?? 0) - Number(b.codigo ?? 0));
        tieneNA = preguntas.some(p => p._sec?.tieneNoAplica === 1);
      } else if (Array.isArray(sel) && sel.length === 0) {
        preguntas = [];
        tieneNA = false;
      } else if (sel === 'PA' || sel === 'PC') {
        // Buscar secciones que correspondan a Planilla A o C por su descripción
        const lookFor = sel === 'PA' ? 'PLANILLA A' : 'PLANILLA C';
        const secs = secciones.filter(s => (s.descripcion ?? '').toString().toUpperCase().includes(lookFor));
        preguntas = secs.flatMap(s => (s.cuestionarios ?? []).map(q => ({ ...q, _sec: s }))).slice().sort((a, b) => Number(a.codigo ?? 0) - Number(b.codigo ?? 0));
        tieneNA = preguntas.some(p => p._sec?.tieneNoAplica === 1);
      }
    } else {
      const secActual = secciones[secIdx];
      preguntas = (secActual?.cuestionarios ?? []).slice().sort((a, b) => Number(a.codigo ?? 0) - Number(b.codigo ?? 0));
      tieneNA = secActual?.tieneNoAplica === 1;
    }

    const currentPageEntry = pagesMap.pages
      ? pagesMap.pages[Math.max(0, Math.min(page, pagesMap.pages.length - 1))]
      : null;
    const isPlanillaAPage = currentPageEntry === 'PA';
    const isPlanillaCPage = currentPageEntry === 'PC';
    const isPlanillaEspecialPage = isPlanillaAPage || isPlanillaCPage;

    const renderPaginador = () => {
      if (pagesMap.pages) {
        const pages = pagesMap.pages;
        const last = pages.length - 1;
        return (
          <div className={styles.paginatorBar}>
            <button
              onClick={() => {
                if (panel === 'responsables') {
                  setPanel('contratistas');
                } else if (panel === 'contratistas') {
                  setPanel('gremios');
                } else if (panel === 'gremios') {
                  setPanel('preguntas');
                } else {
                  setPage(p => Math.max(0, p - 1));
                }
              }}
              disabled={panel === 'preguntas' && page === 0}
              className={`${styles.pagerBtn} ${styles.pagerBtnNarrow}`}
            >
              &lt;
            </button>

            {pages.map((entry, i) => {
              const label = entry === 'PA' ? 'Planilla A' : entry === 'PC' ? 'Planilla C' : (i + 1).toString();
              return (
                <button
                  key={i}
                  onClick={() => {
                    setPanel('preguntas');
                    setPage(i);
                  }}
                  className={`${styles.pagerBtn} ${panel === 'preguntas' && page === i ? styles.pagerBtnActive : ''}`}
                >
                  {label}
                </button>
              );
            })}

            <button onClick={() => setPanel('gremios')} className={`${styles.pagerBtn} ${panel === 'gremios' ? styles.pagerBtnActive : ''}`}>
              Gremios
            </button>
            <button onClick={() => setPanel('contratistas')} className={`${styles.pagerBtn} ${panel === 'contratistas' ? styles.pagerBtnActive : ''}`}>
              Contratistas
            </button>
            <button onClick={() => setPanel('responsables')} className={`${styles.pagerBtn} ${panel === 'responsables' ? styles.pagerBtnActive : ''}`}>
              Responsables
            </button>

            <button
              onClick={() => {
                if (panel === 'preguntas') {
                  if (page >= last) {
                    setPanel('gremios');
                  } else {
                    setPage(p => Math.min(last, p + 1));
                  }
                } else if (panel === 'gremios') {
                  setPanel('contratistas');
                } else if (panel === 'contratistas') {
                  setPanel('responsables');
                }
              }}
              disabled={panel === 'responsables'}
              className={`${styles.pagerBtn} ${styles.pagerBtnNarrow}`}
            >
              &gt;
            </button>
          </div>
        );
      }

      // fallback: comportamiento anterior por secciones
      const totalPages = Math.max(1, Math.ceil(totalSecs / PAGE_SIZE));
      const last = totalPages - 1;
      const pageStart = page * PAGE_SIZE;
      const pageEnd = Math.min(pageStart + PAGE_SIZE, totalSecs);

      return (
        <div className={styles.paginatorBar}>
          <button
            onClick={() => {
              if (panel === 'responsables') {
                setPanel('contratistas');
              } else if (panel === 'contratistas') {
                setPanel('gremios');
              } else if (panel === 'gremios') {
                setPanel('preguntas');
              } else {
                setPage(p => Math.max(0, p - 1));
              }
            }}
            disabled={panel === 'preguntas' && page === 0}
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
                onClick={() => {
                  setPanel('preguntas');
                  setSecIdx(i);
                }}
                className={`${styles.pagerBtn} ${panel === 'preguntas' && active ? styles.pagerBtnActive : ''}`}
                title={secciones[i].descripcion}
              >
                {i + 1}
              </button>
            );
          })}

          <button onClick={() => setPanel('gremios')} className={`${styles.pagerBtn} ${panel === 'gremios' ? styles.pagerBtnActive : ''}`}>
            Gremios
          </button>
          <button onClick={() => setPanel('contratistas')} className={`${styles.pagerBtn} ${panel === 'contratistas' ? styles.pagerBtnActive : ''}`}>
            Contratistas
          </button>
          <button onClick={() => setPanel('responsables')} className={`${styles.pagerBtn} ${panel === 'responsables' ? styles.pagerBtnActive : ''}`}>
            Responsables
          </button>

          <button
            onClick={() => {
              if (panel === 'preguntas') {
                if (page >= last) {
                  setPanel('gremios');
                } else {
                  setPage(p => Math.min(last, p + 1));
                }
              } else if (panel === 'gremios') {
                setPanel('contratistas');
              } else if (panel === 'contratistas') {
                setPanel('responsables');
              }
            }}
            disabled={panel === 'responsables'}
            className={`${styles.pagerBtn} ${styles.pagerBtnNarrow}`}
          >
            &gt;
          </button>
        </div>
      );
    };

    return (

      <div className={`${styles.container} ${puedeVerCabeceraEdicion ? styles.headerVisible : ''}`}>
        {/* Vista de edición del formulario — preguntas, paginador y listas (gremios/contratistas/responsables). */}
        <h2 className={styles.sectionHeaderTitle} />
        {puedeVerCabeceraEdicion && (
          <>
            <CabeceraFormulario
              cuit={cuit}
              onCuitChange={setCuit}
              razonSocial={razonSocial}
              establecimientos={establecimientos}
              estActual={estActual}
              esReplica={true}
              onEstablecimientoChange={setEstablecimientoSel}
              estSuperficie={estSuperficie}
              onSuperficieChange={setEstSuperficie}
              estCantTrab={estCantTrab}
              onCantTrabChange={setEstCantTrab}
              tipos={tipos}
              tipoSel={tipoSel}
              onTipoChange={setTipoSel}
              onVolver={() => {}}
              onCrear={() => {}}
              disableCrear={true}
              soloLectura={true}
              mostrarAcciones={false}
            />
            <div className={styles.fechaSrtRow}>
              <TextField
                label="Fecha SRT"
                type="date"
                value={fechaSRTEdit}
                onChange={(e) => setFechaSRTEdit(e.target.value)}
                InputLabelProps={{ shrink: true }}
                className={styles.fechaSrtInput}
              />
              <CustomButton
                onClick={() => {
                  const fechaSRT = toIsoOrNull(fechaSRTEdit || null);
                  setForm((prev) => (prev ? { ...prev, fechaSRT } : prev));
                  guardarPUT(false, { redirigir: false, fechaSRTOverride: fechaSRT });
                }}
              >
                Actualiza Fecha Srt
              </CustomButton>
            </div>
          </>
        )}
        <div className={styles.sectionHeaderSubtitle}>

          Página {page + 1} {pagesMap.pages ? `de ${pagesMap.pages.length}` : ''}
        </div>

        {renderPaginador()}

        {panel === 'gremios' ? (
          <div className={styles.questionsBox}>
            <div className="formGrid">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className={styles.modalGrid120}>
                  <TextField
                    label="Nro. Legajo"
                    type="number"
                    value={gremiosUI[idx]?.legajo ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      setGremiosUI((prev) => {
                        const next = [...prev];
                        next[idx] = { ...(next[idx] ?? {}), legajo: val };
                        return next;
                      });
                    }}
                  />
                  <TextField
                    label="Nombre"
                    value={gremiosUI[idx]?.nombre ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGremiosUI((prev) => {
                        const next = [...prev];
                        next[idx] = { ...(next[idx] ?? {}), nombre: val };
                        return next;
                      });
                    }}
                    fullWidth
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {panel === 'contratistas' ? (
          <div className={styles.questionsBox}>
            <div className="formGrid">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className={styles.modalGrid160}>
                  <TextField
                    label="CUIT"
                    value={
                      String(contratistasUI[idx]?.cuit ?? '').replace(/[^\d]/g, '').length === 11
                        ? CUIP(contratistasUI[idx]?.cuit)
                        : String(contratistasUI[idx]?.cuit ?? '')
                    }
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 11);
                      const val = digits ? Number(digits) : undefined;
                      setContratistasUI((prev) => {
                        const next = [...prev];
                        next[idx] = { ...(next[idx] ?? {}), cuit: val };
                        return next;
                      });
                    }}
                    inputMode="numeric"
                  />
                  <TextField
                    label="Contratista"
                    value={contratistasUI[idx]?.contratista ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setContratistasUI((prev) => {
                        const next = [...prev];
                        next[idx] = { ...(next[idx] ?? {}), contratista: val };
                        return next;
                      });
                    }}
                    fullWidth
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {panel === 'responsables' ? (
          <div className={`${styles.questionsBox} ${styles.responsablesWideBox}`}>
            <div className={styles.responsablesRows}>
              {[0, 1, 2, 3, 4].map((idx) => (
                <div key={idx} className={styles.responsableRowGrid}>
                  <TextField
                    label="CUIT/CUIL/CUIP"
                    value={(() => {
                      const digits = String(responsablesUI[idx]?.cuit ?? '').replace(/[^\d]/g, '');
                      return digits.length === 11 ? CUIP(digits) : (digits ? digits : '');
                    })()}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 11);
                      const val = digits ? Number(digits) : undefined;
                      setResponsablesUI((prev) => {
                        const next = [...prev];
                        next[idx] = { ...(next[idx] ?? {}), cuit: val };
                        return next;
                      });
                    }}
                    inputMode="numeric"
                  />
                  <TextField
                    label="Nombre y apellido"
                    value={responsablesUI[idx]?.responsable ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResponsablesUI((prev) => {
                        const next = [...prev];
                        next[idx] = { ...(next[idx] ?? {}), responsable: val };
                        return next;
                      });
                    }}
                    fullWidth
                  />
                  <FormControl fullWidth>
                    <InputLabel>Cargo</InputLabel>
                    <Select
                      label="Cargo"
                      value={responsablesUI[idx]?.cargo ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setResponsablesUI((prev) => {
                          const next = [...prev];
                          next[idx] = { ...(next[idx] ?? {}), cargo: val };
                          return next;
                        });
                      }}
                    >
                      <MenuItem value=""><em>Seleccioná...</em></MenuItem>
                      <MenuItem value={'H'}>Profesional de Higiene y Seguridad en el Trabajo</MenuItem>
                      <MenuItem value={'M'}>Profesional de Medicina Laboral</MenuItem>
                      <MenuItem value={'R'}>Responsable de Datos del Formulario</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Representación</InputLabel>
                    <Select
                      label="Representación"
                      value={typeof responsablesUI[idx]?.representacion === 'number' ? responsablesUI[idx]?.representacion : ''}
                      onChange={(e) => {
                        const v = e.target.value as string | number;
                        setResponsablesUI((prev) => {
                          const next = [...prev];
                          next[idx] = { ...(next[idx] ?? {}), representacion: v === '' ? undefined : Number(v) };
                          return next;
                        });
                      }}
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
                  <FormControl fullWidth>
                    <InputLabel>Propio/Contratado</InputLabel>
                    <Select
                      label="Propio/Contratado"
                      value={typeof responsablesUI[idx]?.esContratado === 'number' ? responsablesUI[idx]?.esContratado : ''}
                      onChange={(e) => {
                        const v = e.target.value as string | number;
                        setResponsablesUI((prev) => {
                          const next = [...prev];
                          next[idx] = { ...(next[idx] ?? {}), esContratado: v === '' ? undefined : Number(v) };
                          return next;
                        });
                      }}
                    >
                      <MenuItem value=""><em>Seleccioná...</em></MenuItem>
                      <MenuItem value={0}>Contratado</MenuItem>
                      <MenuItem value={1}>Propio</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Título habilitante"
                    value={responsablesUI[idx]?.tituloHabilitante ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResponsablesUI((prev) => {
                        const next = [...prev];
                        next[idx] = { ...(next[idx] ?? {}), tituloHabilitante: val };
                        return next;
                      });
                    }}
                  />
                  <TextField
                    label="N° matrícula"
                    value={responsablesUI[idx]?.matricula ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResponsablesUI((prev) => {
                        const next = [...prev];
                        next[idx] = { ...(next[idx] ?? {}), matricula: val };
                        return next;
                      });
                    }}
                  />
                  <TextField
                    label="Entidad que otorgó el título habilitante"
                    value={responsablesUI[idx]?.entidadOtorganteTitulo ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setResponsablesUI((prev) => {
                        const next = [...prev];
                        next[idx] = { ...(next[idx] ?? {}), entidadOtorganteTitulo: val };
                        return next;
                      });
                    }}
                    fullWidth
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {panel === 'preguntas' ? (
          <div className={styles.questionsBox}>
            {(() => {
              const grouped: Record<string, any[]> = {};
              for (const p of preguntas) {
                const title = (p._sec?.descripcion ?? '').toString().trim() || 'Sin título';
                if (!grouped[title]) grouped[title] = [];
                grouped[title].push(p);
              }

              return Object.keys(grouped).map((title) => (
                <div key={title}>
                  {(() => {
                    const preguntasSeccion = grouped[title];
                    const marcarSeccion = (respuesta: 'SI' | 'NO' | 'NA') => {
                      setRespuestas((prev) => {
                        const next = { ...prev };
                        for (const item of preguntasSeccion) {
                          const key = item.codigo as number;
                          const base = next[key] ?? { internoCuestionario: key, respuesta: '' };
                          next[key] = { ...base, respuesta };
                        }
                        return next;
                      });
                    };
                    return (
                      <>
                  <div style={{ textAlign: 'center', fontWeight: 700, margin: '12px 0' }}>{title}</div>
                  <div
                    className={styles.questionHeaderRow}
                    style={
                      isPlanillaEspecialPage
                        ? { gridTemplateColumns: isPlanillaAPage ? '70px 1fr 260px' : '70px 1fr 260px 260px' }
                        : undefined
                    }
                  >
                    <div className={styles.qNum}>{isPlanillaEspecialPage ? 'Código' : 'Nro.'}</div>
                    <div className={styles.qText}>Condiciones a cumplir</div>
                    <div
                      className={styles.qAnswerHead}
                      style={isPlanillaEspecialPage ? { gridTemplateColumns: '1fr' } : undefined}
                    >
                      {isPlanillaEspecialPage ? (
                        <div>Sí (Indicar si corresponde)</div>
                      ) : (
                        <>
                          <CustomButton onClick={() => marcarSeccion('SI')} style={{ padding: '2px 8px', minHeight: 24, fontSize: 12, lineHeight: '16px' }}>SI</CustomButton>
                          <CustomButton onClick={() => marcarSeccion('NO')} style={{ padding: '2px 8px', minHeight: 24, fontSize: 12, lineHeight: '16px' }}>NO</CustomButton>
                          <CustomButton onClick={() => marcarSeccion('NA')} style={{ padding: '2px 8px', minHeight: 24, fontSize: 12, lineHeight: '16px' }}>No Aplica</CustomButton>
                        </>
                      )}
                    </div>
                    {!isPlanillaEspecialPage && <div className={styles.qDateHead}>Fecha de Regularización</div>}
                    {!isPlanillaAPage && <div className={styles.qNormaHead}>Norma Vigente</div>}
                  </div>
                      </>
                    );
                  })()}
                  {grouped[title].map((q) => {
                    const key = q.codigo as number;
                    const rr = respuestas[key] ?? {};
                    const value = rr.respuesta ?? '';
                    const hoyIso = dayjs().format('YYYY-MM-DD');
                    const fechaIso = rr.fechaRegularizacionNormal ?? (rr.fechaRegularizacion ? `${String(rr.fechaRegularizacion).slice(0,4)}-${String(rr.fechaRegularizacion).slice(4,6)}-${String(rr.fechaRegularizacion).slice(6,8)}` : '');
                    const fechaVisible = fechaIso && fechaIso > hoyIso ? fechaIso : '';
                    return (
                      <div
                        key={key}
                        className={styles.questionRow}
                        style={
                          isPlanillaEspecialPage
                            ? { gridTemplateColumns: isPlanillaAPage ? '70px 1fr 260px' : '70px 1fr 260px 260px' }
                            : undefined
                        }
                      >
                        <div className={styles.qNum}>{String(q.codigo ?? '')}</div>
                        <div className={styles.qText}>{q.pregunta}</div>
                        <div className={styles.qAnswer} style={isPlanillaEspecialPage ? { gridTemplateColumns: '1fr' } : undefined}>
                          {isPlanillaEspecialPage ? (
                            <label className={styles.qRadioCell}>
                              <input
                                type="checkbox"
                                checked={value === 'SI'}
                                onChange={(e) => onCambiarRespuesta(key, { respuesta: e.target.checked ? 'SI' : '' })}
                              />
                            </label>
                          ) : (
                            <>
                              <label className={styles.qRadioCell}>
                                <input
                                  type="radio"
                                  name={`r-${key}`}
                                  checked={value === 'SI'}
                                  onChange={() => onCambiarRespuesta(key, { respuesta: 'SI' })}
                                />
                              </label>
                              <label className={styles.qRadioCell}>
                                <input
                                  type="radio"
                                  name={`r-${key}`}
                                  checked={value === 'NO'}
                                  onChange={() => onCambiarRespuesta(key, { respuesta: 'NO' })}
                                />
                              </label>
                              <label className={styles.qRadioCell}>
                                {tieneNA ? (
                                  <input
                                    type="radio"
                                    name={`r-${key}`}
                                    checked={value === 'NA'}
                                    onChange={() => onCambiarRespuesta(key, { respuesta: 'NA' })}
                                  />
                                ) : null}
                              </label>
                            </>
                          )}
                        </div>
                        {!isPlanillaEspecialPage && (
                          <div className={styles.qDate}>
                            <input
                              type="date"
                              value={fechaVisible}
                              min={dayjs().add(1, 'day').format('YYYY-MM-DD')}
                              onChange={(e) => {
                                const iso = e.target.value || '';
                                if (iso && iso <= hoyIso) return;
                                const digits = iso ? iso.replace(/-/g, '') : '';
                                onCambiarRespuesta(key, {
                                  fechaRegularizacion: digits ? Number(digits) : 0,
                                  fechaRegularizacionNormal: iso ? iso : null,
                                });
                              }}
                              className={styles.qDateInput}
                            />
                          </div>
                        )}
                        {!isPlanillaAPage && <div className={styles.qNorma}>{q.comentario ?? ''}</div>}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        ) : null}

        <div className={styles.row}>
          <CustomButton onClick={() => router.back()} disabled={loading}>VOLVER</CustomButton>
          <CustomButton onClick={() => setConfirmOpen(true)} disabled={loading}>GUARDAR Y CONFIRMAR</CustomButton>
          <CustomButton onClick={() => guardarPUT(false)} disabled={loading}>GUARDAR BORRADOR</CustomButton>
        </div>

        {panel === 'gremios' && (
          <div className={styles.gremiosLegendFixed}>
            <p>En caso de contar con delegados gremiales indicar número de legajo conforme a la inscripción en el Ministerio de Trabajo, Empleo y Seguridad Social</p>
            <p><a href="http://www.trabajo.gov.ar" target="_blank" rel="noreferrer">http://www.trabajo.gov.ar</a></p>
          </div>
        )}
        {panel === 'contratistas' && (
          <div className={styles.contratistasLegendFixed}>
            <p>En caso de tener contratistas, indicar nro de CUIT y Nombre - Razón Social</p>
          </div>
        )}

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
        <CustomModalMessage
          open={modalMsgOpen}
          onClose={handleCloseModalMsg}
          message={modalMsg}
          type={modalMsgType}
          title="Datos faltantes"
        />
      </div>
    );
  }

  return (
  <div className={`${styles.container} ${puedeVerCabeceraEdicion ? styles.headerVisible : ''}`}>
      {/* Carga de datos inicial y botones para crear/replicar el formulario. */}
      <CabeceraFormulario
        cuit={cuit}
        onCuitChange={setCuit}
        razonSocial={razonSocial}
        establecimientos={establecimientos}
        estActual={estActual}
        esReplica={esReplica}
        onEstablecimientoChange={setEstablecimientoSel}
        estSuperficie={estSuperficie}
        onSuperficieChange={setEstSuperficie}
        estCantTrab={estCantTrab}
        onCantTrabChange={setEstCantTrab}
        tipos={tipos}
        tipoSel={tipoSel}
        onTipoChange={setTipoSel}
        cuitSoloLectura={cuitSoloLecturaDesdeEmpresaLista}
        onVolver={() => {
          if (onClose) {
            onClose();
            return;
          }
          router.back();
        }}
        onCrear={crearFormulario}
        disableCrear={!cuit}
      />
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
