import type { Modulo, Tarea, Usuario } from "@/data/usuarioAPI";

export function userHasTask(
  user: Usuario | null | undefined,
  taskName: string
): boolean {
  if (!user) {
    return false;
  }

  const userRol = String(user.rol ?? "").trim().toLowerCase();
  if (userRol === "administrador") {
    return true;
  }

  const normalizedTaskName = taskName.trim().toLowerCase();
  const userTasks: Tarea[] = (user.modulos ?? [])
    .filter((modulo: Modulo) => modulo?.habilitado)
    .flatMap((modulo: Modulo) => modulo?.tareas ?? [])
    .filter((tarea: Tarea) => tarea?.habilitada);

  return userTasks.some(
    (tarea) => (tarea?.tareaDescripcion ?? "").toLowerCase() === normalizedTaskName
  );
}
