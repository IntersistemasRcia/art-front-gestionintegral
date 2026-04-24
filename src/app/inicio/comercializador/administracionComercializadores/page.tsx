"use client";

import React, { useEffect, useMemo, useState, SyntheticEvent } from "react";
import useSWR from "swr";
import { Box } from '@mui/material';
import CustomButton from '@/utils/ui/button/CustomButton';
import { IoPersonAddSharp } from 'react-icons/io5';
import UsuarioForm from '@/app/inicio/comercializador/administracionComercializadores/formulario/UsuarioForm';
import type { UsuarioFormFields } from '@/app/inicio/comercializador/administracionComercializadores/formulario/types/formulario';
import useUsuarios from '@/app/inicio/usuarios/useUsuarios';
import { useAuth } from "@/data/AuthContext";
import ArtAPI from "@/data/artAPI";
import type { VComercializadorRow, EditKind, FormMethod, ComercializadoresOrganizadoresRow, ComercializadoresGOrganizadoresRow, ComercializadorPutRequest, ComercializadorOrganizadoresPutRequest, ComercializadorGOrganizadoresPostRequest, ComercializadorGOrganizadoresPutRequest } from "@/app/inicio/comercializador/administracionComercializadores/types/administracionUsuarios";
import AdministracionTable from "@/app/inicio/comercializador/administracionComercializadores/AdministracionTable";
import styles from "./administracionUsuarios.module.css";

function digits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

function estadoFromDeletedAt(v: any) {
  return v == null || String(v).trim() === '' ? 'Activo' : 'Inactivo';
}

function asArray(data: any): any[] {
  if (Array.isArray(data?.DATA)) return data.DATA;
  if (Array.isArray(data?.data)) return data.data;
  return Array.isArray(data) ? data : [];
}

export default function AdminUserPage() {
  const initialTabIndex = 0;
  const [currentTab, setCurrentTab] = useState<number>(initialTabIndex);
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [formMethod, setFormMethod] = useState<FormMethod>("create");
  const [formInitialData, setFormInitialData] = useState<UsuarioFormFields | undefined>(undefined);
  const [editKind, setEditKind] = useState<EditKind | null>(null);
  const [editComercializadorBase, setEditComercializadorBase] = useState<ComercializadorPutRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeletingGrupo, setIsDeletingGrupo] = useState<boolean>(false);
  const [pendingComercializador, setPendingComercializador] = useState<UsuarioFormFields | null>(null);
  const [pendingOrganizador, setPendingOrganizador] = useState<UsuarioFormFields | null>(null);
  const [pendingGrupoOrganizador, setPendingGrupoOrganizador] = useState<UsuarioFormFields | null>(null);
  const [editOrganizadorBase, setEditOrganizadorBase] = useState<ComercializadorOrganizadoresPutRequest | null>(null);
  const [editGrupoBase, setEditGrupoBase] = useState<ComercializadorGOrganizadoresPutRequest | null>(null);
  const [selectedGrupoRowKey, setSelectedGrupoRowKey] = useState<string | null>(null);
  const [selectedGrupoInterno, setSelectedGrupoInterno] = useState<number | undefined>(undefined);
  const [selectedOrganizadorRowKey, setSelectedOrganizadorRowKey] = useState<string | null>(null);
  const [selectedOrganizadorInterno, setSelectedOrganizadorInterno] = useState<number | undefined>(undefined);
  const { usuarios, roles, cargos, refEmpleadores, registrarUsuario, usuarioDarDeBaja } = useUsuarios();
  const { user, hasTask } = useAuth();

  const { trigger: triggerPostComercializador } = ArtAPI.usePostComercializador();
  const { trigger: triggerPostOrganizador } = ArtAPI.usePostComercializadorOrganizadores();
  const { trigger: triggerPostGrupoOrganizador } = ArtAPI.usePostComercializadorGOrganizadores();
  const { trigger: triggerPutGrupoOrganizador } = ArtAPI.usePutComercializadorGOrganizadores();
  const { trigger: triggerPutOrganizador } = ArtAPI.usePutComercializadorOrganizadores();
  const { trigger: triggerPutComercializador } = ArtAPI.usePutComercializador();
  const { trigger: triggerDeleteComercializador, isMutating: isDeletingComercializador } = ArtAPI.useDeleteComercializador();
  const { trigger: triggerDeleteOrganizador, isMutating: isDeletingOrganizador } = ArtAPI.useDeleteComercializadoresOrganizadores();

  const isGrupoOrganizador = String((user as any)?.rol ?? '').toLowerCase() === 'grupoorganizador';
  const isOrganizadorComercializador = String((user as any)?.rol ?? '').toLowerCase() === 'organizadorcomercializador';
  const isAdministrador = String((user as any)?.rol ?? '').toLowerCase() === 'administrador';
  const isComercializador = String((user as any)?.rol ?? '').toLowerCase() === 'comercializador';
  const canLoadComercializadores = isGrupoOrganizador || isOrganizadorComercializador || isAdministrador;
  const userCuit = Number(digits((user as any)?.cuit ?? (user as any)?.CUIL ?? (user as any)?.cuil ?? 0));
  const userCuitValid = Number.isFinite(userCuit) && userCuit > 0 ? userCuit : undefined;

  const darDeBajaUsuarioPorCuil = async (cuil: string | undefined | null) => {
    const cleanCuil = digits(cuil ?? '');
    if (!cleanCuil) return;
    const usuario = (usuarios as any[])?.find((u: any) => digits(u?.cuit ?? '') === cleanCuil);
    if (!usuario?.id) return;
    try {
      await usuarioDarDeBaja({ id: String(usuario.id), deletedObs: "" });
    } catch (error) {
      console.error("Error al dar de baja el usuario asociado:", error);
    }
  };

  const { data: gOrgData, isLoading: isLoadingGOrg, mutate: mutateGOrg } = useSWR(
    (isGrupoOrganizador && userCuitValid) || isAdministrador
      ? ['SRTComercializadoresGOrganizadores', isAdministrador ? 'ALL' : userCuitValid]
      : null,
    () => (isAdministrador ? ArtAPI.getGOrganizador({} as any) : ArtAPI.getGOrganizador({ CUIL: userCuitValid } as any)),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const gOrganizadorInterno = useMemo(() => {
    const first = asArray(gOrgData)?.[0];
    const interno = Number(first?.interno ?? first?.Interno ?? NaN);
    return Number.isFinite(interno) && interno >= 0 ? interno : undefined;
  }, [gOrgData]);

  const organizadorKey = isGrupoOrganizador || isAdministrador
    ? (selectedGrupoInterno ?? gOrganizadorInterno)
    : isOrganizadorComercializador
      ? userCuitValid
      : undefined;

  const { data: organizadorData, isLoading: isLoadingOrganizador, mutate: mutateOrganizador } = useSWR(
    canLoadComercializadores && (isAdministrador || organizadorKey !== undefined)
      ? ['SRTComercializadoresOrganizadores', isAdministrador ? 'ALL' : isGrupoOrganizador ? 'GO' : 'OC', organizadorKey ?? 'ALL']
      : null,
    () =>
      isGrupoOrganizador
        ? ArtAPI.getOrganizador({ SRTComercializadorGOrganizadorInterno: selectedGrupoInterno ?? gOrganizadorInterno } as any)
        : isOrganizadorComercializador
          ? ArtAPI.getOrganizador({ CUIL: userCuitValid } as any)
          : selectedGrupoInterno !== undefined
            ? ArtAPI.getOrganizador({ SRTComercializadorGOrganizadorInterno: selectedGrupoInterno } as any)
            : ArtAPI.getOrganizador({} as any),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const organizadorGOrganizadorInterno = useMemo(() => {
    if (!isOrganizadorComercializador) return undefined;
    const first = asArray(organizadorData)?.[0];
    const interno = Number(first?.srtComercializadorGOrganizadorInterno ?? NaN);
    return Number.isFinite(interno) && interno > 0 ? interno : undefined;
  }, [isOrganizadorComercializador, organizadorData]);

  const {
    data: gOrgByIdData,
    isLoading: isLoadingGOrgById,
    mutate: mutateGOrgById,
  } = ArtAPI.useGetGOrganizadorById(
    isOrganizadorComercializador && organizadorGOrganizadorInterno
      ? { id: organizadorGOrganizadorInterno }
      : undefined
  );

  const mutateGrupoTable = isOrganizadorComercializador ? mutateGOrgById : mutateGOrg;
  const isLoadingGrupoTable = isOrganizadorComercializador ? isLoadingGOrgById : isLoadingGOrg;

  const organizadorInternosCSV = useMemo(() => {
    const internos = asArray(organizadorData)
      .map((x: any) => Number(x?.interno ?? x?.Interno ?? NaN))
      .filter((n: number) => Number.isFinite(n) && n >= 0);
    const unique = Array.from(new Set(internos));
    return unique.length ? unique.join(',') : undefined;
  }, [organizadorData]);

  const comercializadorInternosCSV = selectedOrganizadorInterno !== undefined
    ? String(selectedOrganizadorInterno)
    : isAdministrador
      ? undefined
      : organizadorInternosCSV;

  const comercializadorKey = selectedOrganizadorInterno !== undefined
    ? String(selectedOrganizadorInterno)
    : isAdministrador
      ? 'ALL'
      : comercializadorInternosCSV;

  const { data: comercializadorData, isLoading: isLoadingComercializador, mutate: mutateComercializador } = useSWR(
    canLoadComercializadores && comercializadorKey
      ? ['SRTComercializadores', comercializadorKey]
      : null,
    () =>
      isAdministrador && selectedOrganizadorInterno === undefined
        ? ArtAPI.getComercializador({} as any)
        : ArtAPI.getComercializador({ ComercializadoresOrganizadoresInternos: comercializadorInternosCSV } as any),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const grupoRows: ComercializadoresGOrganizadoresRow[] = useMemo(() => {
    if (!isGrupoOrganizador && !isAdministrador && !isOrganizadorComercializador) return [];

    const source = isOrganizadorComercializador
      ? (gOrgByIdData ? [gOrgByIdData] : [])
      : asArray(gOrgData);

    return source.map((x: any) => ({
      interno: x?.interno ?? x?.Interno ?? 0,
      cuil: String(x?.cuil ?? x?.CUIL ?? ''),
      descripcion: String(x?.descripcion ?? ''),
      email: String(x?.email ?? ''),
      telefono: String(x?.telefono ?? ''),
      razonSocial: String(x?.razonSocial ?? x?.descripcion ?? ''),
      fechaNacimiento: String(x?.fechaNacimiento ?? ''),
      domocilioCalle: String(x?.domocilioCalle ?? x?.domicilioCalle ?? ''),
      domicilioNumero: String(x?.domicilioNumero ?? x?.domicilioNro ?? ''),
      domicilioPiso: String(x?.domicilioPiso ?? ''),
      domicilioEntreCalle: String(x?.domicilioEntreCalle ?? x?.domicilioEntreCalle1 ?? ''),
      domicilioYCalle: String(x?.domicilioYCalle ?? x?.domicilioEntreCalle2 ?? ''),
      codLocalidad: String(x?.codLocalidad ?? x?.codLocalidadSrt ?? ''),
      codPostal: Number(x?.codPostal ?? x?.codLocalidadPostal ?? 0),
      estado: estadoFromDeletedAt(x?.deletedAt ?? x?.DeletedAt ?? null),
      accion: '',
    }));
  }, [gOrgData, gOrgByIdData, isAdministrador, isGrupoOrganizador, isOrganizadorComercializador]);

  useEffect(() => {
    if (selectedGrupoInterno === undefined) return;
    // Para rol OrganizadorComercializador, la tabla de Grupo se arma por Id (gOrgByIdData)
    if (isOrganizadorComercializador) return;
    const internos = asArray(gOrgData)
      .map((x: any) => Number(x?.interno ?? x?.Interno ?? NaN))
      .filter((n: number) => Number.isFinite(n) && n >= 0);
    if (!internos.includes(selectedGrupoInterno)) {
      setSelectedGrupoInterno(undefined);
      setSelectedGrupoRowKey(null);
      setSelectedOrganizadorInterno(undefined);
      setSelectedOrganizadorRowKey(null);
    }
  }, [gOrgData, selectedGrupoInterno, isOrganizadorComercializador]);

  const organizadorRows: ComercializadoresOrganizadoresRow[] = useMemo(() => {
    if (!canLoadComercializadores) return [];
    return asArray(organizadorData).map((x: any) => ({
      interno: Number(x?.interno ?? x?.Interno ?? 0),
      cuil: String(x?.cuil ?? ''),
      observacion: String(x?.observaciones ?? x?.observacion ?? x?.razonSocial ?? ''),
      email: String(x?.email ?? ''),
      telefono: String(x?.telefono ?? ''),
      srtComercializadorGOrganizadorInterno: Number(x?.srtComercializadorGOrganizadorInterno ?? 0),
      observaciones: String(x?.observaciones ?? x?.observacion ?? ''),
      razonSocial: String(x?.razonSocial ?? x?.observaciones ?? x?.observacion ?? ''),
      fechaNacimiento: String(x?.fechaNacimiento ?? ''),
      domicilioCalle: String(x?.domicilioCalle ?? ''),
      domicilioNro: String(x?.domicilioNro ?? ''),
      domocilioCalle: String(x?.domocilioCalle ?? ''),
      domicilioNumero: String(x?.domicilioNumero ?? ''),
      domicilioPiso: String(x?.domicilioPiso ?? ''),
      domicilioEntreCalle1: String(x?.domicilioEntreCalle1 ?? ''),
      domicilioEntreCalle2: String(x?.domicilioEntreCalle2 ?? ''),
      domicilioEntreCalle: String(x?.domicilioEntreCalle ?? ''),
      domicilioYCalle: String(x?.domicilioYCalle ?? ''),
      codLocalidadSrt: String(x?.codLocalidadSrt ?? ''),
      codLocalidadPostal: Number(x?.codLocalidadPostal ?? 0),
      codLocalidad: String(x?.codLocalidad ?? ''),
      codPostal: Number(x?.codPostal ?? 0),
      estado: estadoFromDeletedAt(x?.deletedAt ?? x?.DeletedAt ?? null),
      accion: '',
    }));
  }, [canLoadComercializadores, organizadorData]);

  useEffect(() => {
    if (selectedOrganizadorInterno === undefined) return;
    const internos = asArray(organizadorData)
      .map((x: any) => Number(x?.interno ?? x?.Interno ?? NaN))
      .filter((n: number) => Number.isFinite(n) && n >= 0);
    if (!internos.includes(selectedOrganizadorInterno)) {
      setSelectedOrganizadorInterno(undefined);
      setSelectedOrganizadorRowKey(null);
    }
  }, [organizadorData, selectedOrganizadorInterno]);

  const comercializadorRows: VComercializadorRow[] = useMemo(() => {
    if (!canLoadComercializadores) return [];
    return asArray(comercializadorData).map((x: any) => ({
      interno: Number(x?.interno ?? x?.Interno ?? x?.id ?? x?.ID ?? 0),
      cuil: String(x?.cuil ?? ''),
      referenteRazonSocial: String(x?.referenteRazonSocial ?? ''),
      matricula: x?.matricula ?? '',
      email: String(x?.email ?? ''),
      telefono: String(x?.telefono ?? ''),
      movil: String(x?.movil ?? ''),
      referenteDatosInterno: Number(x?.referenteDatosInterno ?? 0),
      canalInterviniente: String(x?.canalInterviniente ?? 'E'),
      inicioFecha: String(x?.inicioFecha ?? ''),
      bajaFecha: (x?.bajaFecha ?? null) as any,
      comision: Number(x?.comision ?? 0),
      aplicaIva: Number(x?.aplicaIva ?? 0),
      serviciosAdicionales: Number(x?.serviciosAdicionales ?? 0),
      srtComercializadorOrganizadorInterno: Number(x?.srtComercializadorOrganizadorInterno ?? 0),
      estado: estadoFromDeletedAt(x?.deletedAt ?? null),
      accion: '',
    }));
  }, [canLoadComercializadores, comercializadorData]);

  const openFormCreate = () => {
    setFormError(null);
    setPendingComercializador(null);
    setPendingOrganizador(null);
    setPendingGrupoOrganizador(null);
    setFormMethod("create");
    setFormInitialData(undefined);
    setEditKind(null);
    setEditComercializadorBase(null);
    setEditOrganizadorBase(null);
    setEditGrupoBase(null);
    setFormOpen(true);
  };

  const creationRoleForTab = (tabIndex: number) => {
    switch (tabIndex) {
      case 0:
        return { label: 'Crear Grupo Organizador', role: 'GrupoOrganizador' };
      case 1:
        return { label: 'Crear Organizador Comercializador', role: 'OrganizadorComercializador' };
      case 2:
        return { label: 'Crear Comercializador', role: 'Comercializador' };
      default:
        return { label: 'Crear Comercializador', role: 'Comercializador' };
    }
  };

  const canCreateForTab = (tabIndex: number) => {
    if (isComercializador) return false;
    if (isOrganizadorComercializador) return tabIndex === 2; // solo Comercializador
    if (isGrupoOrganizador) return tabIndex === 1 || tabIndex === 2; // Organizador o Comercializador
    if (isAdministrador) return true;
    return false;
  };

  const openFormEditFromRow = async (row: ComercializadoresGOrganizadoresRow | ComercializadoresOrganizadoresRow | VComercializadorRow, kind: EditKind) => {
    const interno = Number((row as any)?.interno ?? NaN);

    setFormError(null);
    setPendingComercializador(null);
    setPendingOrganizador(null);
    setPendingGrupoOrganizador(null);
    setFormMethod("edit");
    setEditKind(kind);

    let rowAny = row as any;
    if (kind === "comercializador" && Number.isFinite(interno) && interno > 0) {
      try {
        rowAny = await ArtAPI.getComercializadorById({ id: interno } as any);
      } catch {
        rowAny = row as any;
      }
    }

    const cuilDigits = digits(rowAny?.cuil ?? "");
    const nombre = String(rowAny?.descripcion ?? rowAny?.observacion ?? rowAny?.referenteRazonSocial ?? "");
    const email = String(rowAny?.email ?? "");
    const telefono = String(rowAny?.telefono ?? rowAny?.movil ?? "");
    const matricula = String(rowAny?.matricula ?? "");

    const asociados = Array.isArray((rowAny as any)?.comercializadorAsociados)
      ? (rowAny as any).comercializadorAsociados
      : [];
    const organizadorAsociado = asociados.find(
      (x: any) => String(x?.tipo ?? '').trim().toUpperCase() === 'ORGANIZADOR'
    );
    const grupoAsociado = asociados.find(
      (x: any) => String(x?.tipo ?? '').trim().toUpperCase() === 'GRUPO'
    );

    const organizadorInternoFromAsociados = Number(
      (organizadorAsociado as any)?.interno ?? (organizadorAsociado as any)?.asociadoId ?? NaN
    );
    const grupoInternoFromAsociados = Number(
      (grupoAsociado as any)?.interno ?? (grupoAsociado as any)?.asociadoId ?? NaN
    );

    const organizadorInterno = Number.isFinite(organizadorInternoFromAsociados)
      ? organizadorInternoFromAsociados
      : Number(rowAny?.srtComercializadorOrganizadorInterno ?? rowAny?.comercializadorOrganizadorInterno ?? 0);

    const grupoInterno = Number.isFinite(grupoInternoFromAsociados)
      ? grupoInternoFromAsociados
      : Number(rowAny?.srtComercializadorGOrganizadorInterno ?? 0);

    if (kind === "comercializador" && Number.isFinite(interno) && interno > 0) {
      const today = new Date().toISOString().slice(0, 10);
      setEditComercializadorBase({
        interno,
        cuil: Number(cuilDigits || 0),
        matricula,
        email,
        telefono: String(rowAny?.telefono ?? ""),
        movil: String(rowAny?.movil ?? ""),
        referenteDatosInterno: Number(rowAny?.referenteDatosInterno ?? 0),
        canalInterviniente: String(rowAny?.canalInterviniente ?? "E"),
        inicioFecha: String(rowAny?.inicioFecha || today),
        bajaFecha: (rowAny?.bajaFecha ?? null) as any,
        comision: Number(rowAny?.comision ?? 0),
        aplicaIva: Number(rowAny?.aplicaIva ?? 0),
        serviciosAdicionales: Number(rowAny?.serviciosAdicionales ?? 0),
            srtComercializadorOrganizadorInterno: organizadorInterno,
            srtComercializadorGOrganizadorInterno: grupoInterno,
      });
    } else {
      setEditComercializadorBase(null);
    }

    if (kind === "organizador" && Number.isFinite(interno) && interno > 0) {
      setEditOrganizadorBase({
        interno,
        srtComercializadorGOrganizadorInterno: Number(
          rowAny?.srtComercializadorGOrganizadorInterno ??
          selectedGrupoInterno ??
          gOrganizadorInterno ??
          0
        ),
        observaciones: String(rowAny?.observaciones ?? rowAny?.observacion ?? ""),
        cuil: Number(cuilDigits || 0),
        email,
        telefono: String(rowAny?.telefono ?? telefono ?? ""),
        razonSocial: String(rowAny?.razonSocial ?? nombre ?? ""),
        fechaNacimiento: String(rowAny?.fechaNacimiento ?? ""),
        domocilioCalle: String(rowAny?.domocilioCalle ?? ""),
        domicilioNumero: String(rowAny?.domicilioNumero ?? ""),
        domicilioPiso: String(rowAny?.domicilioPiso ?? ""),
        domicilioEntreCalle: String(rowAny?.domicilioEntreCalle ?? ""),
        domicilioYCalle: String(rowAny?.domicilioYCalle ?? ""),
        codLocalidad: String(rowAny?.codLocalidad ?? ""),
        codPostal: Number(rowAny?.codPostal ?? 0),
      });
    } else {
      setEditOrganizadorBase(null);
    }

    if (kind === "grupo" && Number.isFinite(interno) && interno > 0) {
      setEditGrupoBase({
        interno,
        descripcion: String(rowAny?.descripcion ?? nombre ?? ""),
        cuil: Number(cuilDigits || 0),
        email,
        telefono: String(rowAny?.telefono ?? telefono ?? ""),
        razonSocial: String(rowAny?.razonSocial ?? rowAny?.descripcion ?? nombre ?? ""),
        fechaNacimiento: String(rowAny?.fechaNacimiento ?? ""),
        domocilioCalle: String(rowAny?.domocilioCalle ?? ""),
        domicilioNumero: String(rowAny?.domicilioNumero ?? ""),
        domicilioPiso: String(rowAny?.domicilioPiso ?? ""),
        domicilioEntreCalle: String(rowAny?.domicilioEntreCalle ?? ""),
        domicilioYCalle: String(rowAny?.domicilioYCalle ?? ""),
        codLocalidad: String(rowAny?.codLocalidad ?? ""),
        codPostal: Number(rowAny?.codPostal ?? 0),
      });
    } else {
      setEditGrupoBase(null);
    }

    setFormInitialData({
      nombre:
        kind === "organizador"
          ? String(rowAny?.razonSocial ?? nombre ?? "")
          : kind === "grupo"
            ? String(rowAny?.descripcion ?? rowAny?.razonSocial ?? nombre ?? "")
            : String(rowAny?.referenteRazonSocial ?? nombre ?? ""),
      email,
      cuit: "",
      phoneNumber: telefono,
      matricula,
      cargoId: 1,
      rol: kind === "comercializador" ? "Comercializador" : kind === "organizador" ? "OrganizadorComercializador" : kind === "grupo" ? "GrupoOrganizador" : "",
      userName: cuilDigits,
      empresaId: 0,
      id: Number.isFinite(interno) ? String(interno) : undefined,
      canalInterviniente: kind === "comercializador" ? String(rowAny?.canalInterviniente ?? "") : undefined,
      inicioFecha: kind === "comercializador" ? String(rowAny?.inicioFecha ?? "") : undefined,
      bajaFecha: kind === "comercializador" ? String(rowAny?.bajaFecha ?? "") : undefined,
      comision: kind === "comercializador" ? Number(rowAny?.comision ?? 0) : undefined,
      serviciosAdicionales: kind === "comercializador" ? Number(rowAny?.serviciosAdicionales ?? 0) : undefined,
      aplicaIva: kind === "comercializador" ? Number(rowAny?.aplicaIva ?? 0) : undefined,
      fechaNacimiento: kind === "organizador" || kind === "grupo" || kind === "comercializador" ? String((rowAny?.fechaNacimiento ?? rowAny?.referenteFechaNacimiento ?? "")).slice(0, 10) : undefined,
      domicilioCalle: kind === "organizador" ? String(rowAny?.domicilioCalle ?? "") : kind === "grupo" || kind === "comercializador" ? String(rowAny?.domocilioCalle ?? rowAny?.referenteDomicilioCalle ?? "") : undefined,
      domicilioNro: kind === "organizador" ? String(rowAny?.domicilioNro ?? "") : kind === "grupo" || kind === "comercializador" ? String(rowAny?.domicilioNumero ?? rowAny?.referenteDomicilioNro ?? "") : undefined,
      domicilioPiso: kind === "organizador" || kind === "grupo" || kind === "comercializador" ? String(rowAny?.domicilioPiso ?? rowAny?.referenteDomicilioPiso ?? "") : undefined,
      domicilioEntreCalle1: kind === "organizador" ? String(rowAny?.domicilioEntreCalle1 ?? "") : kind === "grupo" || kind === "comercializador" ? String(rowAny?.domicilioEntreCalle ?? rowAny?.referenteDomicilioEntreCalle1 ?? "") : undefined,
      domicilioEntreCalle2: kind === "organizador" ? String(rowAny?.domicilioEntreCalle2 ?? "") : kind === "grupo" || kind === "comercializador" ? String(rowAny?.domicilioYCalle ?? rowAny?.referenteDomicilioEntreCalle2 ?? "") : undefined,
      domicilioCodLocalidad: kind === "organizador" ? String(rowAny?.codLocalidadSrt ?? "") : kind === "grupo" || kind === "comercializador" ? String(rowAny?.codLocalidad ?? rowAny?.referenteCodLocalidadSrt ?? "") : undefined,
      domicilioCodPostal: kind === "organizador" ? String(rowAny?.codLocalidadPostal ?? "") : kind === "grupo" || kind === "comercializador" ? String(rowAny?.codPostal ?? rowAny?.referenteCodLocalidadPostal ?? "") : undefined,
      srtComercializadorOrganizadorInterno: kind === "comercializador" ? organizadorInterno : undefined,
      srtComercializadorGOrganizadorInterno: kind === "comercializador" ? grupoInterno : kind === "organizador" ? Number(rowAny?.srtComercializadorGOrganizadorInterno ?? 0) : undefined,
    } as UsuarioFormFields);
    setFormOpen(true);
  };

  const openFormViewFromRow = async (row: ComercializadoresGOrganizadoresRow | ComercializadoresOrganizadoresRow | VComercializadorRow, kind: EditKind) => {
    await openFormEditFromRow(row, kind);
    setFormMethod("view");
  };

  const openFormDeleteFromRow = async (row: ComercializadoresGOrganizadoresRow | ComercializadoresOrganizadoresRow | VComercializadorRow, kind: EditKind) => {
    setFormError(null);
    setPendingComercializador(null);
    setPendingOrganizador(null);
    setPendingGrupoOrganizador(null);
    setFormMethod("delete");
    await openFormEditFromRow(row, kind);
    setFormMethod("delete");
  };

  const handleTabChange = (_event: SyntheticEvent, newTabValue: string | number) => {
    setCurrentTab(newTabValue as number);
  };

  const handleGrupoRowSelect = (key: string | number | null, row?: ComercializadoresGOrganizadoresRow) => {
    if (!row) return;
    const normalizedKey = key === null || key === undefined ? null : String(key);
    if (normalizedKey && normalizedKey === selectedGrupoRowKey) {
      setSelectedGrupoRowKey(null);
      setSelectedGrupoInterno(undefined);
      setSelectedOrganizadorInterno(undefined);
      setSelectedOrganizadorRowKey(null);
      return;
    }

    const interno = Number((row as any)?.interno ?? NaN);
    setSelectedGrupoRowKey(normalizedKey);
    setSelectedGrupoInterno(Number.isFinite(interno) && interno >= 0 ? interno : undefined);
    setSelectedOrganizadorInterno(undefined);
    setSelectedOrganizadorRowKey(null);
  };

  const handleOrganizadorRowSelect = (key: string | number | null, row?: ComercializadoresOrganizadoresRow) => {
    if (!row) return;
    const normalizedKey = key === null || key === undefined ? null : String(key);
    if (normalizedKey && normalizedKey === selectedOrganizadorRowKey) {
      setSelectedOrganizadorRowKey(null);
      setSelectedOrganizadorInterno(undefined);
      return;
    }

    const interno = Number((row as any)?.interno ?? NaN);
    setSelectedOrganizadorRowKey(normalizedKey);
    setSelectedOrganizadorInterno(Number.isFinite(interno) && interno >= 0 ? interno : undefined);
  };

  const selectedGrupoNombre = useMemo(() => {
    if (selectedGrupoInterno === undefined) return "";
    const selected = grupoRows.find((row) => Number(row.interno) === Number(selectedGrupoInterno));
    return String(selected?.razonSocial ?? selected?.descripcion ?? "").trim();
  }, [grupoRows, selectedGrupoInterno]);

  const selectedOrganizadorNombre = useMemo(() => {
    if (selectedOrganizadorInterno === undefined) return "";
    const selected = organizadorRows.find((row) => Number(row.interno) === Number(selectedOrganizadorInterno));
    return String(selected?.razonSocial ?? selected?.observacion ?? "").trim();
  }, [organizadorRows, selectedOrganizadorInterno]);

  const selectedOrganizadorGrupoInterno = useMemo(() => {
    if (selectedOrganizadorInterno === undefined) return undefined;
    const selected = organizadorRows.find((row) => Number(row.interno) === Number(selectedOrganizadorInterno));
    const interno = Number(selected?.srtComercializadorGOrganizadorInterno ?? NaN);
    return Number.isFinite(interno) && interno >= 0 ? interno : undefined;
  }, [organizadorRows, selectedOrganizadorInterno]);

  const organizadorFilterText = selectedGrupoInterno === 0
    ? "Organizadores sin grupo asignado"
    : selectedGrupoInterno !== undefined && selectedGrupoNombre
      ? `Organizadores filtrados por el grupo: ${selectedGrupoNombre}`
      : "Todos los organizadores";

  const comercializadorFilterText = selectedOrganizadorInterno === 0
    ? "Comercializadores sin Organizador asignado"
    : selectedOrganizadorInterno !== undefined && selectedOrganizadorNombre
      ? `Comercializadores filtrados por el organizador: ${selectedOrganizadorNombre}`
      : "Todos los comercializadores";

  const createDefaultGrupoId = useMemo(() => {
    if (formMethod !== "create") return "";
    if (currentTab === 1) {
      return selectedGrupoInterno !== undefined ? String(selectedGrupoInterno) : "";
    }
    if (currentTab === 2) {
      const interno = selectedOrganizadorGrupoInterno ?? selectedGrupoInterno;
      return interno !== undefined ? String(interno) : "";
    }
    return "";
  }, [formMethod, currentTab, selectedGrupoInterno, selectedOrganizadorGrupoInterno]);

  const createDefaultOrganizadorId = useMemo(() => {
    if (formMethod !== "create") return "";
    if (currentTab === 2) {
      return selectedOrganizadorInterno !== undefined ? String(selectedOrganizadorInterno) : "";
    }
    return "";
  }, [formMethod, currentTab, selectedOrganizadorInterno]);

  return (
    <div>

      <Box className={styles.createButtonWrapper}>
        <CustomButton
          variant="contained"
          color="primary"
          icon={<IoPersonAddSharp />}
          onClick={openFormCreate}
          disabled={!canCreateForTab(currentTab)}
        >
          {creationRoleForTab(currentTab).label}
        </CustomButton>
      </Box>

      <AdministracionTable
        currentTab={currentTab}
        onTabChange={handleTabChange}
        organizadorFilterText={organizadorFilterText}
        comercializadorFilterText={comercializadorFilterText}
        grupoRows={grupoRows}
        organizadorRows={organizadorRows}
        comercializadorRows={comercializadorRows}
        isLoadingGrupoTable={isLoadingGrupoTable}
        isLoadingOrganizador={isLoadingOrganizador}
        isLoadingComercializador={isLoadingComercializador}
        selectedGrupoRowKey={selectedGrupoRowKey}
        selectedOrganizadorRowKey={selectedOrganizadorRowKey}
        onGrupoRowSelect={handleGrupoRowSelect}
        onOrganizadorRowSelect={handleOrganizadorRowSelect}
        onViewRow={openFormViewFromRow}
        onEditRow={openFormEditFromRow}
        onDeleteRow={openFormDeleteFromRow}
        hasTask={hasTask}
        isGrupoOrganizador={isGrupoOrganizador}
        isOrganizadorComercializador={isOrganizadorComercializador}
        isDeletingGrupo={isDeletingGrupo}
        isDeletingOrganizador={isDeletingOrganizador}
        isDeletingComercializador={isDeletingComercializador}
      />

      <UsuarioForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        roles={roles}
        cargos={cargos}
        refEmpleadores={refEmpleadores}
        creationRole={formMethod === 'create' ? creationRoleForTab(currentTab).role : null}
        initialSelectedGrupoId={createDefaultGrupoId}
        initialSelectedOrganizadorId={createDefaultOrganizadorId}
        onSubmit={async (data: UsuarioFormFields) => {
          setIsSubmitting(true);
          setFormError(null);
          try {
            if (formMethod === "delete") {
              const interno = Number((data as any)?.id ?? NaN);
              const cuilForBaja = (data as any)?.cuit ?? (data as any)?.userName;

              if (!Number.isFinite(interno) || interno <= 0 || !editKind) {
                setFormError("No se pudo identificar el registro para dar de baja.");
                return;
              }

              try {
                if (editKind === "grupo") {
                  setIsDeletingGrupo(true);
                  await darDeBajaUsuarioPorCuil(cuilForBaja);
                  await ArtAPI.deleteComercializadoresGOrganizadores(interno);
                  await mutateGrupoTable();

                  if (selectedGrupoInterno === Number(interno)) {
                    setSelectedGrupoInterno(undefined);
                    setSelectedGrupoRowKey(null);
                    setSelectedOrganizadorInterno(undefined);
                    setSelectedOrganizadorRowKey(null);
                  }
                }

                if (editKind === "organizador") {
                  await darDeBajaUsuarioPorCuil(cuilForBaja);
                  await triggerDeleteOrganizador({ id: interno });
                  await mutateOrganizador();
                  if (selectedOrganizadorInterno === Number(interno)) {
                    setSelectedOrganizadorInterno(undefined);
                    setSelectedOrganizadorRowKey(null);
                  }
                }

                if (editKind === "comercializador") {
                  await darDeBajaUsuarioPorCuil(cuilForBaja);
                  await triggerDeleteComercializador({ id: interno });
                  await mutateComercializador();
                }

                setFormOpen(false);
                return;
              } catch (error) {
                console.error("Error al dar de baja:", error);
                setFormError("Error al dar de baja el registro.");
                return;
              } finally {
                setIsDeletingGrupo(false);
              }
            }

            if (formMethod === "edit") {
              const bajaFechaValue = String((data as any)?.bajaFecha ?? "").trim();
              const cuilForBaja = (data as any)?.cuit ?? (data as any)?.userName;
              if (editKind === "comercializador" && editComercializadorBase) {
                const cuilNumber = Number(digits((data as any)?.cuit ?? (data as any)?.userName ?? "") || 0);

                const codPostalNumber = Number(digits((data as any)?.domicilioCodPostal ?? '') || 0);
                const fechaNacimientoIso = (data as any)?.fechaNacimiento
                  ? new Date(String((data as any)?.fechaNacimiento)).toISOString()
                  : "";
                  
                  const srtOrgInternoFromData = Number((data as any)?.srtComercializadorOrganizadorInterno ?? editComercializadorBase.srtComercializadorOrganizadorInterno ?? 0);
                  const srtGOrgInternoFromData = Number((data as any)?.srtComercializadorGOrganizadorInterno ?? editComercializadorBase.srtComercializadorGOrganizadorInterno ?? selectedGrupoInterno ?? gOrganizadorInterno ?? 0);

                  const putPayload = {
                  interno: editComercializadorBase.interno,
                  cuil: Number.isFinite(cuilNumber) ? cuilNumber : editComercializadorBase.cuil,
                  matricula: String((data as any)?.matricula ?? editComercializadorBase.matricula ?? ""),
                  email: String((data as any)?.email ?? editComercializadorBase.email ?? ""),
                  telefono: String((data as any)?.phoneNumber ?? editComercializadorBase.telefono ?? ""),
                  movil: String(editComercializadorBase.movil ?? ""),
                  canalInterviniente: String((data as any)?.canalInterviniente ?? editComercializadorBase.canalInterviniente ?? "E"),
                  inicioFecha: String((data as any)?.inicioFecha ?? editComercializadorBase.inicioFecha ?? ""),
                  bajaFecha: ((data as any)?.bajaFecha ?? editComercializadorBase.bajaFecha ?? null) as any,
                  comision: Number((data as any)?.comision ?? editComercializadorBase.comision ?? 0),
                  aplicaIva: Number((data as any)?.aplicaIva ?? editComercializadorBase.aplicaIva ?? 0),
                  serviciosAdicionales: Number((data as any)?.serviciosAdicionales ?? editComercializadorBase.serviciosAdicionales ?? 0),
                    srtComercializadorOrganizadorInterno: Number.isFinite(srtOrgInternoFromData) ? srtOrgInternoFromData : 0,
                    srtComercializadorGOrganizadorInterno: Number.isFinite(srtGOrgInternoFromData) ? srtGOrgInternoFromData : 0,

                  razonSocial: String((data as any)?.nombre ?? ""),
                  fechaNacimiento: fechaNacimientoIso,
                  domocilioCalle: String((data as any)?.domicilioCalle ?? ""),
                  domicilioNumero: String((data as any)?.domicilioNro ?? ""),
                  domicilioPiso: String((data as any)?.domicilioPiso ?? ""),
                  domicilioEntreCalle: String((data as any)?.domicilioEntreCalle1 ?? ""),
                  domicilioYCalle: String((data as any)?.domicilioEntreCalle2 ?? ""),
                  codLocalidad: String((data as any)?.domicilioCodLocalidad ?? ""),
                  codPostal: Number.isFinite(codPostalNumber) ? codPostalNumber : 0,
                };

                await triggerPutComercializador({
                  id: editComercializadorBase.interno,
                  data: putPayload as any,
                });

                await mutateComercializador();
                if (bajaFechaValue) await darDeBajaUsuarioPorCuil(cuilForBaja);
                setFormOpen(false);
                return;
              }

              if (editKind === "organizador" && editOrganizadorBase) {
                const cuilNumber = Number(digits((data as any)?.cuit ?? (data as any)?.userName ?? "") || 0);
                const codPostalNumber = Number(digits((data as any)?.domicilioCodPostal ?? '') || 0);

                const srtGOrgForOrganizador = Number((data as any)?.srtComercializadorGOrganizadorInterno ?? editOrganizadorBase.srtComercializadorGOrganizadorInterno ?? selectedGrupoInterno ?? gOrganizadorInterno ?? 0);

                const putPayload: ComercializadorOrganizadoresPutRequest = {
                  ...editOrganizadorBase,
                  srtComercializadorGOrganizadorInterno: Number.isFinite(srtGOrgForOrganizador) ? srtGOrgForOrganizador : 0,
                  cuil: Number.isFinite(cuilNumber) ? cuilNumber : editOrganizadorBase.cuil,
                  email: String((data as any)?.email ?? editOrganizadorBase.email ?? ""),
                  telefono: String((data as any)?.phoneNumber ?? editOrganizadorBase.telefono ?? ""),
                  razonSocial: String((data as any)?.nombre ?? editOrganizadorBase.razonSocial ?? ""),
                  fechaNacimiento: String((data as any)?.fechaNacimiento ?? editOrganizadorBase.fechaNacimiento ?? ""),
                  domocilioCalle: String((data as any)?.domicilioCalle ?? editOrganizadorBase.domocilioCalle ?? ""),
                  domicilioNumero: String((data as any)?.domicilioNro ?? editOrganizadorBase.domicilioNumero ?? ""),
                  domicilioPiso: String((data as any)?.domicilioPiso ?? editOrganizadorBase.domicilioPiso ?? ""),
                  domicilioEntreCalle: String((data as any)?.domicilioEntreCalle1 ?? editOrganizadorBase.domicilioEntreCalle ?? ""),
                  domicilioYCalle: String((data as any)?.domicilioEntreCalle2 ?? editOrganizadorBase.domicilioYCalle ?? ""),
                  codLocalidad: String((data as any)?.domicilioCodLocalidad ?? editOrganizadorBase.codLocalidad ?? ""),
                  codPostal: Number.isFinite(codPostalNumber) ? codPostalNumber : (Number(editOrganizadorBase.codPostal ?? 0) || 0),
                };

                await triggerPutOrganizador({
                  id: editOrganizadorBase.interno,
                  data: putPayload,
                });

                await mutateOrganizador();
                if (bajaFechaValue) await darDeBajaUsuarioPorCuil(cuilForBaja);
                setFormOpen(false);
                return;
              }

              if (editKind === "grupo" && editGrupoBase) {
                const cuilNumber = Number(digits((data as any)?.cuit ?? (data as any)?.userName ?? "") || 0);
                const codPostalNumber = Number(digits((data as any)?.domicilioCodPostal ?? '') || 0);

                const putPayload: ComercializadorGOrganizadoresPutRequest = {
                  ...editGrupoBase,
                  descripcion: String((data as any)?.nombre ?? editGrupoBase.descripcion ?? ""),
                  cuil: Number.isFinite(cuilNumber) ? cuilNumber : editGrupoBase.cuil,
                  email: String((data as any)?.email ?? editGrupoBase.email ?? ""),
                  telefono: String((data as any)?.phoneNumber ?? editGrupoBase.telefono ?? ""),
                  razonSocial: String((data as any)?.nombre ?? editGrupoBase.razonSocial ?? ""),
                  fechaNacimiento: String((data as any)?.fechaNacimiento ?? editGrupoBase.fechaNacimiento ?? ""),
                  domocilioCalle: String((data as any)?.domicilioCalle ?? editGrupoBase.domocilioCalle ?? ""),
                  domicilioNumero: String((data as any)?.domicilioNro ?? editGrupoBase.domicilioNumero ?? ""),
                  domicilioPiso: String((data as any)?.domicilioPiso ?? editGrupoBase.domicilioPiso ?? ""),
                  domicilioEntreCalle: String((data as any)?.domicilioEntreCalle1 ?? editGrupoBase.domicilioEntreCalle ?? ""),
                  domicilioYCalle: String((data as any)?.domicilioEntreCalle2 ?? editGrupoBase.domicilioYCalle ?? ""),
                  codLocalidad: String((data as any)?.domicilioCodLocalidad ?? editGrupoBase.codLocalidad ?? ""),
                  codPostal: Number.isFinite(codPostalNumber) ? codPostalNumber : (Number(editGrupoBase.codPostal ?? 0) || 0),
                };

                await triggerPutGrupoOrganizador({
                  id: editGrupoBase.interno,
                  data: putPayload,
                });

                await mutateGrupoTable();
                if (bajaFechaValue) await darDeBajaUsuarioPorCuil(cuilForBaja);
                setFormOpen(false);
                return;
              }

              setFormError("Edición disponible solo para Comercializador, Organizador y Grupo Organizador por ahora.");
              return;
            }

            const rol = String((data as any)?.rol ?? "");
            const isComercializador = rol.toLowerCase() === 'comercializador';
            const isOrganizador = rol.toLowerCase() === 'organizadorcomercializador';
            const isGrupoOrganizadorRol = rol.toLowerCase() === 'grupoorganizador';

            // Si ya creamos el usuario pero falló el comercializador, permitimos reintentar
            const isRetryOnlyComercializador =
              !!pendingComercializador &&
              String(pendingComercializador.cuit ?? '') === String(data.cuit ?? '');

            const isRetryOnlyOrganizador =
              !!pendingOrganizador &&
              String(pendingOrganizador.cuit ?? '') === String(data.cuit ?? '');

            const isRetryOnlyGrupoOrganizador =
              !!pendingGrupoOrganizador &&
              String(pendingGrupoOrganizador.cuit ?? '') === String(data.cuit ?? '');

            if (!isRetryOnlyComercializador && !isRetryOnlyOrganizador && !isRetryOnlyGrupoOrganizador) {
              const { matricula: _matricula, ...userPayload } = (data as any) ?? {};
              const result = await registrarUsuario(userPayload);
              if (!result?.success) {
                setFormError(result?.error || 'Error al crear usuario');
                return;
              }
            }

            if (isComercializador) {
              const cleanCuit = digits((data as any)?.cuit ?? '');
              const cuilNumber = Number(cleanCuit || 0);
              const today = new Date().toISOString().slice(0, 10);
              const codPostalNumber = Number((data as any)?.codPostal ?? 0);
              const organizadorRow = isOrganizadorComercializador ? asArray(organizadorData)?.[0] : null;
              const organizadorInternoFromForm = Number((data as any)?.srtComercializadorOrganizadorInterno ?? 0);
              const organizadorInternoForPost = isOrganizadorComercializador
                ? Number((organizadorRow as any)?.interno ?? (organizadorRow as any)?.Interno ?? 0)
                : (Number.isFinite(organizadorInternoFromForm) && organizadorInternoFromForm > 0
                    ? organizadorInternoFromForm
                    : (selectedOrganizadorInterno ?? 0));

              try {
                await triggerPostComercializador({
                  cuil: Number.isFinite(cuilNumber) ? cuilNumber : 0,
                  matricula: String((data as any)?.matricula ?? ''),
                  email: String((data as any)?.email ?? ''),
                  telefono: String((data as any)?.phoneNumber ?? ''),
                  movil: '0',
                  referenteDatosInterno: 0,
                  canalInterviniente: String((data as any)?.canalInterviniente ?? 'E'),
                  inicioFecha: String((data as any)?.inicioFecha ?? today),
                  bajaFecha: (String((data as any)?.bajaFecha ?? '') || null),
                  comision: Number((data as any)?.comision ?? 0),
                  aplicaIva: Number((data as any)?.aplicaIva ?? 0),
                  serviciosAdicionales: Number((data as any)?.serviciosAdicionales ?? 0),
                  srtComercializadorOrganizadorInterno: Number.isFinite(organizadorInternoForPost) ? Number(organizadorInternoForPost) : 0,

                  razonSocial: String((data as any)?.nombre ?? ''),
                  fechaNacimiento: String((data as any)?.fechaNacimiento ?? ''),
                  domocilioCalle: String((data as any)?.domicilioCalle ?? ''),
                  domicilioNumero: String((data as any)?.domicilioNro ?? ''),
                  domicilioPiso: String((data as any)?.domicilioPiso ?? ''),
                  domicilioEntreCalle: String((data as any)?.domicilioEntreCalle1 ?? ''),
                  domicilioYCalle: String((data as any)?.domicilioEntreCalle2 ?? ''),
                  codLocalidad: String((data as any)?.codLocalidad ?? ''),
                  codPostal: Number.isFinite(codPostalNumber) ? codPostalNumber : 0,
                } as any);
                setPendingComercializador(null);
                await mutateComercializador();
              } catch (err) {
                setPendingComercializador(data);
                setFormError('El usuario se creó, pero falló la creación del comercializador. Reintentá el envío para crear el comercializador.');
                console.error(err);
                return;
              }
            }

            if (isOrganizador) {
              const cleanCuit = digits((data as any)?.cuit ?? '');
              const cuilNumber = Number(cleanCuit || 0);
              const codPostalNumber = Number((data as any)?.codPostal ?? 0);
              const gOrganizadorInternoForPost = selectedGrupoInterno ?? gOrganizadorInterno ?? 0;

              try {
                await triggerPostOrganizador({
                  srtComercializadorGOrganizadorInterno: Number.isFinite(Number(gOrganizadorInternoForPost)) ? Number(gOrganizadorInternoForPost) : 0,
                  observaciones: String((data as any)?.nombre ?? ''),
                  cuil: Number.isFinite(cuilNumber) ? cuilNumber : 0,
                  email: String((data as any)?.email ?? ''),
                  telefono: String((data as any)?.phoneNumber ?? ''),
                  razonSocial: String((data as any)?.nombre ?? ''),
                  fechaNacimiento: String((data as any)?.fechaNacimiento ?? ''),
                  domocilioCalle: String((data as any)?.domicilioCalle ?? ''),
                  domicilioNumero: String((data as any)?.domicilioNro ?? ''),
                  domicilioPiso: String((data as any)?.domicilioPiso ?? ''),
                  domicilioEntreCalle: String((data as any)?.domicilioEntreCalle1 ?? ''),
                  domicilioYCalle: String((data as any)?.domicilioEntreCalle2 ?? ''),
                  codLocalidad: String((data as any)?.codLocalidad ?? ''),
                  codPostal: Number.isFinite(codPostalNumber) ? codPostalNumber : 0,
                } as any);
                setPendingOrganizador(null);
                await mutateOrganizador();
              } catch (err) {
                setPendingOrganizador(data);
                setFormError('El usuario se creó, pero falló la creación del organizador. Reintentá el envío para crear el organizador.');
                console.error(err);
                return;
              }
            }

            if (isGrupoOrganizadorRol) {
              const cleanCuit = digits((data as any)?.cuit ?? '');
              const cuilNumber = Number(cleanCuit || 0);
              const codPostalNumber = Number((data as any)?.codPostal ?? 0);

              const payload: ComercializadorGOrganizadoresPostRequest = {
                descripcion: String((data as any)?.nombre ?? ''),
                cuil: Number.isFinite(cuilNumber) ? cuilNumber : 0,
                email: String((data as any)?.email ?? ''),
                telefono: String((data as any)?.phoneNumber ?? ''),
                razonSocial: String((data as any)?.nombre ?? ''),
                fechaNacimiento: String((data as any)?.fechaNacimiento ?? ''),
                domocilioCalle: String((data as any)?.domicilioCalle ?? ''),
                domicilioNumero: String((data as any)?.domicilioNro ?? ''),
                domicilioPiso: String((data as any)?.domicilioPiso ?? ''),
                domicilioEntreCalle: String((data as any)?.domicilioEntreCalle1 ?? ''),
                domicilioYCalle: String((data as any)?.domicilioEntreCalle2 ?? ''),
                codLocalidad: String((data as any)?.codLocalidad ?? ''),
                codPostal: Number.isFinite(codPostalNumber) ? codPostalNumber : 0,
              };

              try {
                await triggerPostGrupoOrganizador(payload as any);
                setPendingGrupoOrganizador(null);
                await mutateGrupoTable();
              } catch (err) {
                setPendingGrupoOrganizador(data);
                setFormError('El usuario se creó, pero falló la creación del Grupo Organizador. Reintentá el envío para crear el Grupo Organizador.');
                console.error(err);
                return;
              }
            }

            setFormOpen(false);
          } catch (err) {
            setFormError(formMethod === "edit" ? 'Ocurrió un error al actualizar el comercializador' : 'Ocurrió un error al crear el usuario');
            console.error(err);
          } finally {
            setIsSubmitting(false);
          }
        }}
        method={formMethod}
        initialData={formInitialData}
        isSubmitting={isSubmitting}
        errorMsg={formError}
        isAdmin={isAdministrador}
      />

    </div>
  );
}