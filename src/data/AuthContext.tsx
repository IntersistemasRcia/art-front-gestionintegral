// src/data/AuthContext.tsx
"use client";

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { Usuario } from '@/data/usuarioAPI';
import { userHasTask } from '@/utils/userTasksUtils';
import { useSession } from 'next-auth/react';
import { useRolesLoader } from '@/data/useRolesLoader';
import { useAccesosRapidosLoader } from '@/data/useAccesosRapidosLoader';
import { useEmpresasLoader } from '@/data/useEmpresasLoader';
import { useParametrosEntidadesLoader } from '@/data/useParametrosEntidadesLoader';

interface AuthContextType {
    session: any;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    user: Usuario | null; 
    hasTask: (taskName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SessionBootstrap = () => {
    useRolesLoader();
    useAccesosRapidosLoader();
    useEmpresasLoader();
    useParametrosEntidadesLoader();
    return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { data: session, status } = useSession();
    
    // Acceso al objeto de usuario (tipado)
    const user = (session?.user as Usuario) || null;
    
    // Verificación de si el usuario está autenticado
    const isAuthenticated = status === 'authenticated';
    const hasTask = (taskName: string): boolean =>
        isAuthenticated ? userHasTask(user, taskName) : false;
    
    // Usamos useMemo para optimizar el valor del contexto
    const value = useMemo(() => ({
        session,
        status,
        user,
        hasTask,
    }), [session, status, user]);

    return (
        <AuthContext.Provider value={value}>
            <SessionBootstrap />
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        // Durante el build/SSR, retornar valores por defecto en lugar de lanzar error
        if (typeof window === 'undefined') {
            return {
                session: null,
                status: 'loading' as const,
                user: null,
                hasTask: () => false,
            };
        }
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};