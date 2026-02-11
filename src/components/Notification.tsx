"use client";

import React, { useEffect, useState } from 'react';
import { GoBellFill } from 'react-icons/go';
import styles from './Navbar.module.css';
import CustomButton from '@/utils/ui/button/CustomButton';
import ArtAPI from '@/data/artAPI';

type Props = {
  empresaCUIT?: number | string | null;
};

export default function Notification({ empresaCUIT }: Props) {
  const [campanaOpen, setCampanaOpen] = useState(false);
  const [missingCount, setMissingCount] = useState<number>(0);
  const [campanaLoading, setCampanaLoading] = useState<boolean>(false);
  const [missingList, setMissingList] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setCampanaLoading(true);
        const c = Number(empresaCUIT ?? 0);
        if (!c || Number.isNaN(c)) {
          setMissingCount(0);
          setMissingList([]);
          return;
        }
        const [ests, forms] = await Promise.all([
          ArtAPI.getEstablecimientosEmpresa(c, "True"),
          ArtAPI.getFormulariosRGRL(c, true),
        ]);

        const formsEstIds = new Set((forms ?? []).map((f: any) => Number(f.internoEstablecimiento)).filter(Boolean));

        const missing = (ests ?? []).filter((e: any) => !formsEstIds.has(Number(e.interno)));
        if (!mounted) return;
        setMissingCount(missing.length);
        setMissingList(missing);
      } catch (err) {
        console.error('Error cargando notificaciones RGRL', err);
      } finally {
        if (mounted) setCampanaLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [empresaCUIT]);

  return (
    <li className={styles.menuItem} onClick={(e) => { e.stopPropagation(); setCampanaOpen(v => !v); }}>
      <div className={styles.bellWrapper}>
        <GoBellFill
          className={styles.iconButton}
          style={missingCount > 0 ? { color: 'var(--rojo)' } : undefined}
        />
        {missingCount > 0 && <span className={styles.badge}>!</span>}
        {campanaOpen && (
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalContent}>
              <button className={styles.closeButton} onClick={(e) => { e.stopPropagation(); setCampanaOpen(false); }}>&times;</button>
              <div style={{ fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>Notificaciones RGRL</div>
              {campanaLoading ? (
                <div className={styles.bellItem}>Cargando...</div>
              ) : (
                <>
                  {missingCount === 0 ? (
                    <div className={styles.bellItem}>No hay notificaciones</div>
                  ) : (
                    <div className={styles.bellItem}>Faltan presentar formularios RGRL</div>
                  )}
                  <div className={styles.bellFooter}>
                    <CustomButton onClick={() => { setCampanaOpen(false); window.location.href = '/inicio/empleador/formularioRGRL'; }}>Ver Formularios</CustomButton>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
