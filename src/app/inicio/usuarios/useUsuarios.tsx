import { AxiosError } from "axios";
import UsuarioAPI from "@/data/usuarioAPI";
import { useAuth } from '@/data/AuthContext';
import ArtAPI from "@/data/artAPI";
import IUsuarioDarDeBaja from "./interfaces/IUsuarioDarDeBajaReactivar";

const { useGetAll, useGetRoles, registrar, tareasUpdate, update, darDeBaja, reactivar, useGetCargos, reestablecer, reenviarCorreo } = UsuarioAPI;
const { useGetRefEmpleadores } = ArtAPI;

export default function useUsuarios() {
  
  const { user, status } = useAuth();   
  const { data: usuariosData, error: usuariosError, isLoading: usuariosLoading, mutate: mutateUsuarios } = useGetAll(user?.empresaId == 0 ? {}:{ empresaId: user?.empresaId});
  const { data: roles, error: rolesError, isLoading: rolesLoading } = useGetRoles();  
  const {
    data: cargos,
    error: cargosError,
    isLoading: cargosLoading,
  } = useGetCargos({ empresaId: user?.empresaId });

  // console.log("user**",user)

  const { data: refEmpleadores } = useGetRefEmpleadores();

  const registrarUsuario = async (formData: any) => {
    try {
      // Usa el fetcher importado para la petición POST, especificando los tipos genéricos
      // await fetcher("UsuarioAPI", "registrar", { data: formData });
      await registrar(formData);
      // Con SWR, usa mutate para revalidar automáticamente los datos.
      await mutateUsuarios();
      return { success: true };
    } catch (err) {
      console.log("error",err)
      const error = (err instanceof AxiosError) ? err : new AxiosError("Error desconocido al registrar usuario");
      return { success: false, error: error.response?.data?.Mensaje ?? "Ocurrió un error al guardar el usuario." };
    }
  };

  const usuarioUpdate = async (usuarioId: string, formData: any) => {
    try {
      // Usa el fetcher importado para la petición POST, especificando los tipos genéricos
      // await fetcher("UsuarioAPI", "registrar", { data: formData });
      await update(usuarioId, formData);
      // Con SWR, usa mutate para revalidar automáticamente los datos.
      await mutateUsuarios();
      return { success: true };
    } catch (err) {
      const error =
        err instanceof AxiosError
          ? err
          : new AxiosError("Error desconocido al actualizar usuario");
      return {
        success: false,
        error: error.response?.data?.Mensaje ?? "Ocurrió un error al guardar el usuario.",
      };
    }
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
    usuarios: usuariosData?.data || [],
    roles: roles || [],
    cargos: cargos || [],
    refEmpleadores: refEmpleadores || [],
    loading: usuariosLoading || rolesLoading,
    error: usuariosError || rolesError,
    registrarUsuario,
    actualizarPermisosUsuario,
    usuarioUpdate,
    usuarioDarDeBaja,
    usuarioReactivar,
    usuarioReestablecer,
    usuarioReenviarCorreo
  };
};