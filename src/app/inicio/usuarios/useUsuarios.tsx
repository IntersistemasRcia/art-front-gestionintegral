import { useMemo } from "react";
import { AxiosError } from "axios";
import UsuarioAPI, {
  type UsuarioGetAllBody,
  type UsuarioUpdatePayload,
} from "@/data/usuarioAPI";
import { useAuth } from "@/data/AuthContext";
import ArtAPI from "@/data/artAPI";
import AuthAPI, {
  USUARIOS_EMPRESAS_USUARIO_LOGUEADO_PAGE_INDEX,
  USUARIOS_EMPRESAS_USUARIO_LOGUEADO_PAGE_SIZE,
} from "@/data/authAPI";
import IUsuarioDarDeBaja from "./interfaces/IUsuarioDarDeBajaReactivar";
import UsuarioRow from "./interfaces/UsuarioRow";

const {
  useGetAll,
  useGetRoles,
  registrar,
  tareasUpdate,
  update,
  darDeBaja,
  reactivar,
  useGetCargos,
  reestablecer,
  reenviarCorreo,
} = UsuarioAPI;
const { useGetRefEmpleadores } = ArtAPI;

export type UseUsuariosListFilter = {
  porEmpresaIds: number[];
  /**
   * Si true, GetAll usa `empresaId: []` (solo Administrador / AdministradorART).
   * Demás roles con "Todas las empresas" envían todos sus `empresaId` en el array.
   */
  allowEmptyEmpresasPost?: boolean;
  pageIndex?: number;
  pageSize?: number;
  cuit?: string;
  nombre?: string;
  email?: string;
  rol?: string;
  estado?: string;
};

function buildGetAllBody(
  listFilter: UseUsuariosListFilter | undefined,
  userEmpresaId: number | undefined
): UsuarioGetAllBody | null {
  if (listFilter === undefined) {
    return {
      empresaId: userEmpresaId === 0 || userEmpresaId == null ? [] : [userEmpresaId],
    };
  }

  if (listFilter.porEmpresaIds.length === 0 && !listFilter.allowEmptyEmpresasPost) {
    return null;
  }

  const body: UsuarioGetAllBody = {
    empresaId:
      listFilter.porEmpresaIds.length > 0 ? listFilter.porEmpresaIds : [],
    pageIndex: listFilter.pageIndex ?? USUARIOS_EMPRESAS_USUARIO_LOGUEADO_PAGE_INDEX,
    pageSize: listFilter.pageSize ?? USUARIOS_EMPRESAS_USUARIO_LOGUEADO_PAGE_SIZE,
  };

  const cuitDigits = Number(String(listFilter.cuit ?? "").replace(/\D/g, ""));
  if (Number.isFinite(cuitDigits) && cuitDigits > 0) {
    body.cuit = cuitDigits;
  }
  if (listFilter.nombre?.trim()) body.nombre = listFilter.nombre.trim();
  if (listFilter.email?.trim()) body.email = listFilter.email.trim();
  if (listFilter.rol?.trim()) body.rol = listFilter.rol.trim();
  if (listFilter.estado?.trim()) body.estado = listFilter.estado.trim();

  return body;
}

export default function useUsuarios(listFilter?: UseUsuariosListFilter) {
  const { user } = useAuth();

  const getAllBody = useMemo(
    () => buildGetAllBody(listFilter, user?.empresaId),
    [listFilter, user?.empresaId]
  );

  const skipListado = getAllBody === null;

  const {
    data: usuariosData,
    error: usuariosError,
    isLoading: usuariosLoading,
    mutate: mutateUsuariosRaw,
  } = useGetAll(skipListado ? null : getAllBody);

  const mutateUsuarios = async () => {
    await mutateUsuariosRaw();
  };

  const { data: roles, error: rolesError, isLoading: rolesLoading } = useGetRoles();
  const {
    data: cargos,
    error: cargosError,
    isLoading: cargosLoading,
  } = useGetCargos({ empresaId: user?.empresaId });

  const { data: refEmpleadores } = useGetRefEmpleadores();
  const { data: sectores } = AuthAPI.useGetRefSectores();

  const usuariosListadoMeta =
    listFilter !== undefined && usuariosData && !skipListado
      ? {
          index: usuariosData.index,
          size: usuariosData.size,
          pages: usuariosData.pages,
          count: usuariosData.count,
        }
      : null;

  const usuarios: UsuarioRow[] = (usuariosData?.data ?? []).map((usuario) => {
    const usuarioConSector = usuario as UsuarioRow & { SectorId?: number | string };
    const resolvedSectorId =
      usuarioConSector.sectorId ??
      (usuarioConSector.SectorId !== undefined && usuarioConSector.SectorId !== null
        ? Number(usuarioConSector.SectorId)
        : undefined);

    const sectorDescripcion = sectores?.find((s) => s.id === resolvedSectorId)?.descripcion;

    return {
      ...usuarioConSector,
      sectorId: resolvedSectorId,
      sectorDescripcion,
    };
  });

  const registrarUsuario = async (formData: any) => {
    try {
      const createdUser = await registrar(formData);
      await mutateUsuarios();
      return { success: true, data: createdUser };
    } catch (err) {
      console.log("error", err);
      const error =
        err instanceof AxiosError
          ? err
          : new AxiosError("Error desconocido al registrar usuario");
      return {
        success: false,
        error: error.response?.data?.Mensaje ?? "Ocurrió un error al guardar el usuario.",
      };
    }
  };

  const usuarioUpdate = async (usuarioId: string, formData: UsuarioUpdatePayload) => {
    const existing = usuarios.find((u) => String(u.id) === String(usuarioId));
    const previousEmail = existing?.email;

    try {
      await update(usuarioId, formData);
      await mutateUsuarios();
    } catch (err) {
      const error =
        err instanceof AxiosError
          ? err
          : new AxiosError("Error desconocido al actualizar usuario");
      const serverValue: string = error.response?.data?.value ?? "";
      const esErrorCorreo = /correo/i.test(serverValue) || /mail/i.test(serverValue);
      return {
        success: false,
        error: esErrorCorreo
          ? "No fue posible enviar el correo de verificación. Verifique el email ingresado."
          : error.response?.data?.Mensaje ?? "Ocurrió un error al guardar el usuario.",
      };
    }

    if (formData?.email && formData.email !== previousEmail) {
      try {
        await reenviarCorreo(String(formData.email));
      } catch {
        return {
          success: false,
          error: "No fue posible enviar el correo de verificación. Verifique el email ingresado.",
        };
      }
    }

    return { success: true };
  };

  const actualizarPermisosUsuario = async (
    usuarioId: string,
    permisosModulos: Array<{
      moduloId: number;
      moduloDescripcion: string;
      habilitado: boolean;
      tareas: Array<{ tareaId: number; moduloId: number; habilitada: boolean }>;
    }>
  ) => {
    try {
      await tareasUpdate(usuarioId, permisosModulos);
      await mutateUsuarios();
      return { success: true };
    } catch (err) {
      const error =
        err instanceof AxiosError
          ? err
          : new AxiosError("Error desconocido al actualizar permisos");
      return {
        success: false,
        error:
          error.response?.data?.Mensaje ?? "Ocurrió un error al actualizar los permisos.",
      };
    }
  };

  const usuarioDarDeBaja = async (data: IUsuarioDarDeBaja) => {
    try {
      await darDeBaja(data);
      await mutateUsuarios();
      return { success: true };
    } catch (err) {
      const error =
        err instanceof AxiosError
          ? err
          : new AxiosError("Error desconocido al dar de baja el usuario");
      return {
        success: false,
        error: error.response?.data?.Mensaje ?? "Ocurrió un error al dar de baja el usuario.",
      };
    }
  };

  const usuarioReactivar = async (data: IUsuarioDarDeBaja) => {
    try {
      await reactivar(data);
      await mutateUsuarios();
      return { success: true };
    } catch (err) {
      const error =
        err instanceof AxiosError
          ? err
          : new AxiosError("Error desconocido al dar de baja el usuario");
      return {
        success: false,
        error:
          error.response?.data?.Mensaje ??
          "Ocurrió un error al dar de baja el usuario.",
      };
    }
  };

  const usuarioReestablecer = async (email: string) => {
    try {
      await reestablecer(email);
      return { success: true };
    } catch (err) {
      const error =
        err instanceof AxiosError
          ? err
          : new AxiosError("Error desconocido al reestablecer el usuario");
      return {
        success: false,
        error: error.response?.data?.Mensaje ?? "Ocurrió un error al reestablecer el usuario.",
      };
    }
  };

  const usuarioReenviarCorreo = async (email: string) => {
    try {
      await reenviarCorreo(email);
      return { success: true };
    } catch (err) {
      const error =
        err instanceof AxiosError
          ? err
          : new AxiosError("Error desconocido al reenviar el correo");
      return {
        success: false,
        error: error.response?.data?.Mensaje ?? "Ocurrió un error al reenviar el correo.",
      };
    }
  };

  return {
    usuarios,
    usuariosListadoMeta,
    roles: roles || [],
    cargos: cargos || [],
    refEmpleadores: refEmpleadores || [],
    loading: (skipListado ? false : usuariosLoading) || rolesLoading,
    error: usuariosError || rolesError,
    registrarUsuario,
    actualizarPermisosUsuario,
    usuarioUpdate,
    usuarioDarDeBaja,
    usuarioReactivar,
    usuarioReestablecer,
    usuarioReenviarCorreo,
    mutateUsuarios,
  };
}
