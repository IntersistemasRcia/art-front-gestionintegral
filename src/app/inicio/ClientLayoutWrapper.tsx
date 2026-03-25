// src/app/inicio/ClientLayoutWrapper.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import styles from './ClientLayoutWrapper.module.css';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/data/AuthContext'; // Importa el hook de contexto
import { useEmpresasLoader } from '@/data/useEmpresasLoader';
import CustomModalMessage from '@/utils/ui/message/CustomModalMessage';

const formatTitleFromPath = (pathname: string): string => {
  if (pathname === '/inicio') {
    return 'Inicio';
  }

  if (pathname === '/inicio/empleador/poliza') {
    return 'Póliza';
  }

  if (pathname === '/inicio/comercializador/polizas') {
    return 'Pólizas';
  }

  if (pathname === '/inicio/comercializador/administracionComercializadores') {
    return 'Administración Comercializadores';
  }

  if (pathname === '/inicio/informes/comisionesMedicas') {
    return 'Comisiones Médicas';
  }

  if (pathname === '/inicio/informes/atencionAlPublico') {
    return 'Atención al Público';
  }

  const parts = pathname.split('/').filter(Boolean);
  const lastPart = parts[parts.length - 1];
  if (!lastPart) {
    return '';
  }
  const camelCaseToWords = (str: string): string => {
    return str.replace(/([a-z])([A-Z])/g, '$1 $2');
  };
  const formattedString = camelCaseToWords(lastPart);
  return formattedString.charAt(0).toUpperCase() + formattedString.slice(1);
};

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, session } = useAuth(); // Obtén el estado y la sesión del contexto
  const [isExpiredSessionModalOpen, setIsExpiredSessionModalOpen] = useState(false);
  
  // Cargar empresas automáticamente cuando el usuario esté autenticado
  useEmpresasLoader();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const pageTitle = formatTitleFromPath(pathname);

  const sessionExpires =
    typeof session === 'object' &&
    session !== null &&
    'expires' in session &&
    typeof session.expires === 'string'
      ? session.expires
      : null;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !sessionExpires) {
      setIsExpiredSessionModalOpen(false);
      return;
    }

    const expiresAt = new Date(sessionExpires).getTime();
    if (Number.isNaN(expiresAt)) {
      return;
    }

    const timeoutMs = expiresAt - Date.now();
    if (timeoutMs <= 0) {
      setIsExpiredSessionModalOpen(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsExpiredSessionModalOpen(true);
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [status, sessionExpires]);

  const handleExpiredSessionModalClose = async () => {
    setIsExpiredSessionModalOpen(false);
    await signOut({ callbackUrl: '/login' });
  };

  if (status === "loading") {
    return (
      <div className={styles.loadingContainer}>
        <h1 className={styles.loadingText}>Cargando...</h1>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }
    
  return (
    <>
      <CustomModalMessage
        open={isExpiredSessionModalOpen}
        onClose={handleExpiredSessionModalClose}
        message="La sesion expiró. Por favor vuelva a Iniciar Sesión."
        type="warning"
        title="Sesión expirada"
      />
      <Navbar />
      <div className={styles.mainLayout}>
        <div className={styles.breadcrumbsContainer}>
          <Breadcrumbs />
        </div>
        <div className={`${styles.contentWrapper} ${isSidebarOpen ? styles.contentOpen : styles.contentClosed}`}>
          <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
          <div className={styles.mainContentArea}>
            {pageTitle && (
              <div className={styles.pageTitleContainer}>
                <h1 key={pathname} className={styles.pageTitle}>
                  {pageTitle}
                </h1>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </>
  );
}