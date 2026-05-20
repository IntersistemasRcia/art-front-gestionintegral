// src/data/AuthContext.tsx
"use client";

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { Modulo, Usuario, Tarea } from '@/data/usuarioAPI'; // usa la Interface que declaro rodri
import { useSession } from 'next-auth/react';

interface AuthContextType {
    session: any;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    user: Usuario | null; 
    hasTask: (taskName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { data: session, status } = useSession();
    
    // Acceso al objeto de usuario (tipado)
    const user = (session?.user as Usuario) || null;
    
    // Verificación de si el usuario está autenticado
    const isAuthenticated = status === 'authenticated';
    const userModules: Modulo[] = (user?.modulos || []).filter(modulo => modulo?.habilitado);
    const userTasks: Tarea[] = userModules
        .flatMap(modulo => modulo?.tareas || [])
        .filter(tarea => tarea?.habilitada);


    const hasTask = (taskName: string): boolean => {
            
        if (isAuthenticated && user) {
            const userRol = String(user.rol || '').trim().toLowerCase();
            // Si tiene el rol "Administrador", siempre permite el acceso.
            if (userRol === "administrador") {
                return true;
            }

            // Si no es Administrador, verifica la tarea específica.
            const normalizedTaskName = taskName.trim().toLowerCase();
            return userTasks.some(tarea => (tarea?.tareaDescripcion || '').toLowerCase() === normalizedTaskName);
        }

        return false;
    };
    
    // Usamos useMemo para optimizar el valor del contexto
    const value = useMemo(() => ({
        session,
        status,
        user,
        hasTask,
    }), [session, status, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
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