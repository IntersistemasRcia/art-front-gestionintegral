import axios, { AxiosError } from "axios";
import type { LoginCommand, LoginErrorResponse, UsuarioVm } from "@/data/usuarioAPI";

function getAuthBasePath(): string {
  const url =
    process.env.NEXT_PUBLIC_API_AUTH_URL ?? "http://fallback-prod.url";
  const normalized = url.replace(/\/api\/?$/, "").replace(/\/$/, "");
  return normalized;
}

const loginHref = (): string =>
  new URL("/api/Usuario/Login", `${getAuthBasePath()}/`).toString();

/**
 * Login vía Axios sin depender del bundle de cliente de SWR.
 * Para uso desde rutas servidor (ej. NextAuth) sin resolver `swr` → react-server.
 */
export async function loginUsuario(
  body: LoginCommand
): Promise<UsuarioVm | null> {
  return axios
    .post<UsuarioVm>(loginHref(), body)
    .then(({ data }) => data)
    .catch((error) => {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as
          | LoginErrorResponse
          | string
          | undefined;
        const apiMessage =
          typeof responseData === "string"
            ? responseData
            : responseData?.Mensaje || responseData?.message;
        console.error(
          "Authentication failed:",
          error.response?.data || error.message
        );
        throw new Error(apiMessage || "Credenciales inválidas");
      }
      if (error instanceof Error) {
        console.error("An unexpected error occurred:", error.message);
        throw error;
      }
      console.error("An unexpected error occurred:", error);
      throw new Error("Error inesperado al iniciar sesión");
    });
}
