"use client";

import React, { useEffect, useState } from 'react';
import { GoBellFill } from 'react-icons/go';
import styles from './Navbar.module.css';
import CustomButton from '@/utils/ui/button/CustomButton';
import ArtAPI from '@/data/artAPI';
import gestionEmpleadorAPI from '@/data/gestionEmpleadorAPI';

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
        const [estsResult, formsResult, polizaResult] = await Promise.allSettled([
          ArtAPI.getEstablecimientosEmpresa(c, "true"),
          ArtAPI.getFormulariosRGRL({ CUIT: c }),
          gestionEmpleadorAPI.getPoliza({ CUIT: c }),
        ]);

        const ests = estsResult.status === "fulfilled" ? estsResult.value : [];
        const forms = formsResult.status === "fulfilled" ? formsResult.value : null;
        const poliza = polizaResult.status === "fulfilled" ? polizaResult.value : null;

        // Helper mínimo para parsear fechas en ISO o en formato dd/MM/yyyy
        const parseDate = (raw: any): Date | null => {
          if (!raw && raw !== 0) return null;
          if (raw instanceof Date) return raw;
          const s = String(raw || '').trim();
          if (!s) return null;
          // ISO or contains T
          if (s.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(s)) {
            const d = new Date(s);
            return Number.isNaN(d.getTime()) ? null : d;
          }
          // dd/MM/yyyy
          const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (m) {
            const day = Number(m[1]);
            const month = Number(m[2]) - 1;
            const year = Number(m[3]);
            const d = new Date(year, month, day);
            return Number.isNaN(d.getTime()) ? null : d;
          }
          // fallback
          const df = new Date(s);
          return Number.isNaN(df.getTime()) ? null : df;
        };

        // Mostrar sólo desde el inicio de vigencia de la póliza
        const vigenciaDesde = parseDate(poliza?.vigencia_Desde ?? poliza?.vigenciaDesde ?? null);
        const ahora = new Date();
        if (vigenciaDesde && ahora < vigenciaDesde) {
          setMissingCount(0);
          setMissingList([]);
          return;
        }

        // Control por año natural: usar fechaSRT o completadoFechaHora o creacionFechaHora para determinar el año
        const currentYear = new Date().getFullYear();
        // Priorizar la fecha de confirmación (`completadoFechaHora`) como criterio
        const formsThisYear = (forms?.data ?? []).filter((f: any) => {
          const raw = f.completadoFechaHora ?? f.fechaSRT ?? f.creacionFechaHora;
          const d = parseDate(raw);
          return d !== null && d.getFullYear() === currentYear;
        });

        const formsEstIdSet = new Set((formsThisYear as any[]).map((f: any) => String(f.internoEstablecimiento ?? '').trim()).filter(s => s));

        const missing = (ests ?? []).filter((e: any) => {
          const candidates = [e?.interno, e?.codEstabEmpresa, e?.numero].map((v: any) => String(v ?? '').trim()).filter((s: string) => s);
          // If any of the establishment identifiers has a matching form this year, it's not missing
          return !candidates.some((id: string) => formsEstIdSet.has(id));
        });
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
