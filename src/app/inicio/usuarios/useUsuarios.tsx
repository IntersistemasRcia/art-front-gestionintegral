import { AxiosError } from "axios";
import UsuarioAPI, { type UsuarioUpdatePayload } from "@/data/usuarioAPI";
import { useAuth } from '@/data/AuthContext';
import ArtAPI from "@/data/artAPI";
import AuthAPI, {
  USUARIOS_EMPRESAS_USUARIO_LOGUEADO_PAGE_INDEX,
  USUARIOS_EMPRESAS_USUARIO_LOGUEADO_PAGE_SIZE,
  type UsuarioEmpresasUsuarioLogueadoItem,
} from "@/data/authAPI";
import IUsuarioDarDeBaja from "./interfaces/IUsuarioDarDeBajaReactivar";
import UsuarioRow from "./interfaces/UsuarioRow";

const { useGetAll, useGetRoles, registrar, tareasUpdate, update, darDeBaja, reactivar, useGetCargos, reestablecer, reenviarCorreo } = UsuarioAPI;
const { useGetRefEmpleadores } = ArtAPI;

export type UseUsuariosListFilter = {
  porEmpresaIds: number[];
  /**
   * Si true, se llama al POST aunque `porEmpresaIds` esté vacío
   * (Administrador + "Todas las empresas" → `empresasId: []` en el body).
   */
  allowEmptyEmpresasPost?: boolean;
  /** Página actual (1-based), igual que en el body del POST. */
  pageIndex?: number;
  pageSize?: number;
  cuit?: string;
  nombre?: string;
  email?: string;
  rol?: string;
  estado?: string;
};

function mapUsuarioEmpresasLogueadoItemToRow(
  u: UsuarioEmpresasUsuarioLogueadoItem
): UsuarioRow {
  const firstEmpresa = u.empresas?.[0];
  return {
    id: u.id,
    cuit: String(u.cuit ?? ""),
    nombre: u.nombre ?? "",
    tipo: u.tipo ?? "",
    sectorId: u.sectorId,
    titulo: u.titulo,
    matricula: u.matricula,
    userName: u.userName ?? "",
    email: u.email ?? "",
    estado: u.estado ?? "",
    phoneNumber: u.phoneNumber ?? "",
    phoneNumberConfirmed: Boolean(u.phoneNumberConfirmed),
    cargoId: u.cargoId ?? 0,
    cargoDescripcion: u.cargoDescripcion ?? "",
    rol: u.rol ?? "",
    empresaId: firstEmpresa?.empresaId ?? 0,
    deletedDate: u.deletedDate ?? null,
    modulos: (u.modulos ?? []) as UsuarioRow["modulos"],
  };
}

export default function useUsuarios(listFilter?: UseUsuariosListFilter) {
  const { user } = useAuth();
  const legacyParams =
    listFilter === undefined
      ? user?.empresaId === 0
        ? {}
        : { empresaId: user?.empresaId }
      : !!listFilter?.allowEmptyEmpresasPost
      ? {
          pageIndex: listFilter!.pageIndex ?? USUARIOS_EMPRESAS_USUARIO_LOGUEADO_PAGE_INDEX,
          pageSize: listFilter!.pageSize ?? USUARIOS_EMPRESAS_USUARIO_LOGUEADO_PAGE_SIZE,
          cuit: listFilter!.cuit || undefined,
          nombre: listFilter!.nombre || undefined,
          email: listFilter!.email || undefined,
          rol: listFilter!.rol || undefined,
          estado: listFilter!.estado || undefined,
        }
      : null;

  const {
    data: usuariosData,
    error: usuariosError,
    isLoading: usuariosLoading,
    mutate: mutateUsuariosLegacy,
  } = useGetAll(legacyParams);

  const quierePostListadoUsuariosEmpresa =
    listFilter !== undefined &&
    listFilter.porEmpresaIds.length > 0;

  const listadoSinEmpresasSinPost =
    listFilter !== undefined &&
    listFilter.porEmpresaIds.length === 0 &&
    !listFilter.allowEmptyEmpresasPost;

  const postBody = quierePostListadoUsuariosEmpresa
    ? {
        empresasId: listFilter!.porEmpresaIds,
        pageIndex: listFilter!.pageIndex ?? USUARIOS_EMPRESAS_USUARIO_LOGUEADO_PAGE_INDEX,
        pageSize: listFilter!.pageSize ?? USUARIOS_EMPRESAS_USUARIO_LOGUEADO_PAGE_SIZE,
        cuit: listFilter!.cuit || undefined,
        nombre: listFilter!.nombre || undefined,
        email: listFilter!.email || undefined,
        rol: listFilter!.rol || undefined,
        estado: listFilter!.estado || undefined,
      }
    : null;

  const {
    data: usuariosPorEmpresasData,
    error: usuariosPorEmpresasError,
    isLoading: usuariosPorEmpresasLoading,
    mutate: mutateUsuariosPorEmpresas,
  } = AuthAPI.useUsuariosEmpresasUsuarioLogueado(postBody);

  const usuariosDataResolved =
    listFilter !== undefined
      ? listadoSinEmpresasSinPost
        ? { data: [] as UsuarioRow[] }
        : listFilter.allowEmptyEmpresasPost
        ? usuariosData
        : usuariosPorEmpresasData
      : usuariosData;
  const usuariosLoadingResolved =
    listFilter !== undefined
      ? listadoSinEmpresasSinPost
        ? false
        : listFilter.allowEmptyEmpresasPost
        ? usuariosLoading
        : usuariosPorEmpresasLoading
      : usuariosLoading;
  const usuariosErrorResolved =
    listFilter !== undefined
      ? listFilter.allowEmptyEmpresasPost
        ? usuariosError
        : usuariosPorEmpresasError
      : usuariosError;
  const { data: roles, error: rolesError, isLoading: rolesLoading } = useGetRoles();  
  const {
    data: cargos,
    error: cargosError,
    isLoading: cargosLoading,
  } = useGetCargos({ empresaId: user?.empresaId });

  // console.log("user**",user)

  const { data: refEmpleadores } = useGetRefEmpleadores();
  const { data: sectores } = AuthAPI.useGetRefSectores();

  const mutateUsuarios = async () => {
    if (listFilter?.allowEmptyEmpresasPost) {
      await mutateUsuariosLegacy();
    } else if (listFilter !== undefined && quierePostListadoUsuariosEmpresa) {
      await mutateUsuariosPorEmpresas();
    } else if (listFilter === undefined) {
      await mutateUsuariosLegacy();
    }
  };

  const rawUsuarios = usuariosDataResolved?.data ?? [];
  const usuariosNormalizados: UsuarioRow[] =
    listFilter !== undefined && !listFilter.allowEmptyEmpresasPost
      ? (rawUsuarios as UsuarioEmpresasUsuarioLogueadoItem[]).map(
          mapUsuarioEmpresasLogueadoItemToRow
        )
      : (rawUsuarios as UsuarioRow[]);

  const usuariosListadoMeta =
    listFilter !== undefined &&
    quierePostListadoUsuariosEmpresa &&
    usuariosPorEmpresasData
      ? {
          index: usuariosPorEmpresasData.index,
          size: usuariosPorEmpresasData.size,
          pages: usuariosPorEmpresasData.pages,
          count: usuariosPorEmpresasData.count,
        }
      : listFilter?.allowEmptyEmpresasPost && usuariosData
      ? {
          index: usuariosData.index,
          size: usuariosData.size,
          pages: usuariosData.pages,
          count: usuariosData.count,
        }
      : null;

  const usuarios: UsuarioRow[] = usuariosNormalizados.map((usuario) => {
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
      // Usa el fetcher importado para la petición POST, especificando los tipos genéricos
      // await fetcher("UsuarioAPI", "registrar", { data: formData });
      const createdUser = await registrar(formData);
      await mutateUsuarios();
      try {
        await reenviarCorreo(String(formData.email));
      } catch {
        return {
          success: false,
          error: "No fue posible enviar el correo de verificación. Verifique el email ingresado.",
          data: createdUser,
        };
      }
      return { success: true, data: createdUser };
    } catch (err) {
      console.log("error",err)
      const error = (err instanceof AxiosError) ? err : new AxiosError("Error desconocido al registrar usuario");
      return { success: false, error: error.response?.data?.Mensaje ?? "Ocurrió un error al guardar el usuario." };
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

    // Si cambió el email, reenviar correo de activación con el nuevo email
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
      // Revalidar los datos de usuarios para obtener los permisos actualizados
      await mutateUsuarios();
      return { success: true };
    } catch (err) {
      const error = (err instanceof AxiosError) ? err : new AxiosError("Error desconocido al actualizar permisos");
      return { success: false, error: error.response?.data?.Mensaje ??"Ocurrió un error al actualizar los permisos." };
    }
  };

  const usuarioDarDeBaja = async (data: IUsuarioDarDeBaja) => {
    try {
      await darDeBaja(data);
      // Revalidar los datos de usuarios después de dar de baja
      await mutateUsuarios();
      return { success: true };
    } catch (err) {
      const error = (err instanceof AxiosError) ? err : new AxiosError("Error desconocido al dar de baja el usuario");
      return { success: false, error: error.response?.data?.Mensaje ?? "Ocurrió un error al dar de baja el usuario." };
    }
  };

  const usuarioReactivar = async (data: IUsuarioDarDeBaja) => {
    try {
      await reactivar(data);
      // Revalidar los datos de usuarios después de reactivar
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
      const error = (err instanceof AxiosError) ? err : new AxiosError("Error desconocido al reestablecer el usuario");
      return { success: false, error: error.response?.data?.Mensaje ?? "Ocurrió un error al reestablecer el usuario." };
    }
  };

  const usuarioReenviarCorreo = async (email: string) => {
    try {
      await reenviarCorreo(email);

      return { success: true };
    } catch (err) {
      const error = (err instanceof AxiosError) ? err : new AxiosError("Error desconocido al reenviar el correo");
      return { success: false, error: error.response?.data?.Mensaje ?? "Ocurrió un error al reenviar el correo." };
    }
  };

  return {
    usuarios,
    usuariosListadoMeta,
    roles: roles || [],
    cargos: cargos || [],
    refEmpleadores: refEmpleadores || [],
    loading: usuariosLoadingResolved || rolesLoading,
    error: usuariosErrorResolved || rolesError,
    registrarUsuario,
    actualizarPermisosUsuario,
    usuarioUpdate,
    usuarioDarDeBaja,
    usuarioReactivar,
    usuarioReestablecer,
    usuarioReenviarCorreo
  };
};