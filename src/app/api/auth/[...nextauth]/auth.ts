import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import UsuarioAPI, { TokenDTO, Usuario, UsuarioVm } from '@/data/usuarioAPI';

const { login } = UsuarioAPI;

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
          const user = await login({
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
        token.user = usr;
        token.data = tkn;
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