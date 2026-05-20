import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import type { TokenDTO, Usuario, UsuarioVm } from '@/data/usuarioAPI';
import { loginUsuario } from '@/data/usuarioLogin';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      id: "credentials",
      credentials: {
        loginUser: { label: "Usuario", type: "text", placeholder: "CUIT/CUIL/EMAIL" },
        loginPassword: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const user = await loginUsuario({
            usuario: credentials?.loginUser,
            password: credentials?.loginPassword,
          });

          if (!user) return null;
          return user as any;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Error de autenticación";
          throw new Error(message);
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  // Configuración para Next.js 16
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const { token: tkn, ...usr } = user as UsuarioVm;
        // Evita inflar la cookie JWT con estructuras grandes (ej: empresas).
        // NextAuth guarda el JWT en cookie y puede provocar HTTP 431.
        const { empresas: _empresas, ...usrSinEmpresas } = usr;
        token.user = usrSinEmpresas;
        token.data = tkn;
      }
      if (token.user && typeof token.user === "object" && "empresas" in (token.user as Record<string, unknown>)) {
        delete (token.user as Record<string, unknown>).empresas;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as Usuario;
      const tokenData = token.data as TokenDTO;
      if (tokenData) {
        session.expires = tokenData.validTo;
        session.accessToken = tokenData.tokenId;
      }
      return session;
    },
  },
};