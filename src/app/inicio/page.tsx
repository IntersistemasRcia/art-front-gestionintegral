// src/app/inicio/page.tsx
"use client";

import { useSession} from "next-auth/react";
import React from 'react';
import Card from '@/components/Card';
import styles from './page.module.css';
import CustomButton from '@/utils/ui/button/CustomButton';
import QueriesAPI, { IndicadorDTO } from '@/data/queryAPI';
import { CircularProgress, Box } from '@mui/material';

const { useGetIndicadores } = QueriesAPI;

// Array de colores para las tarjetas (se rotan según el índice)
const borderColors = ['border-blue', 'border-pink', 'border-purple', 'border-yellow', 'border-red', 'border-green'];

const InicioPage = () => {
  const { data: session, status } = useSession();
  // Solo hacer la petición si el usuario está autenticado
  const { data: indicadores, isLoading, error } = useGetIndicadores();

  const { nombre } = session?.user as any || " ";

  return (
      <div className={styles.inicioContainer}>
      <div className={styles.header}>
        <h1 className={styles.mainTitle}>Bienvenido, {nombre}</h1>
      </div>

      <div className={styles.cardsGrid}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gridColumn: '1 / -1', padding: '40px' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: 'var(--rojo)' }}>
            Error al cargar los indicadores
          </Box>
        ) : indicadores && indicadores.length > 0 ? (
          indicadores.map((indicador: IndicadorDTO, index: number) => (
            <Card
              key={indicador.id}
              title={indicador.descripcion}
              quantity={indicador.valor}
              description={indicador.nombre}
              link={indicador.link}
              borderColorClass={borderColors[index % borderColors.length]}
            />
          ))
        ) : (
          <Box sx={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: 'var(--gris)' }}>
            No hay indicadores disponibles
          </Box>
        )}
      </div>

    <div className={styles.infoSection}>
        <div className={styles.recentActivity}>
          <h2 className={styles.activityTitle}>Actividad Reciente</h2>
          <ul className={styles.activityList}>
            <li className={styles.activityItem}>
              <span className={styles.activityDate}>25/09/2025</span> - Nueva cotización creada a la empresa SOLES
            </li>
            <li className={styles.activityItem}>
              <span className={styles.activityDate}>01/09/2025</span> - Póliza emitida
            </li>
            <li className={styles.activityItem}>
              <span className={styles.activityDate}>05/01/2025</span> - Comisión liquidada
            </li>
          </ul>
          <a href="#" className={styles.viewAllLink}>
            Ver todas las actividades →
          </a>
        </div>
        
        <div className={styles.quickAccess}>
          <h2 className={styles.accessTitle}>Accesos Rápidos</h2>
          <div className={styles.accessButtons}>
            {/* Uso del componente CustomButton */}
            <CustomButton width="60%" >Consultar Siniestro</CustomButton>
            <CustomButton width="60%">DDJJ</CustomButton>
            <CustomButton width="60%">Informes</CustomButton>
            <CustomButton width="60%">Denuncia</CustomButton>
          </div>
        </div>
      </div>
      

    </div>
  );
};

export default InicioPage;
