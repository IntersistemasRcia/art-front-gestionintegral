// app/inicio/cotizaciones/page.tsx

"use client";
import { useState } from 'react';
import styles from './cotizaciones.module.css';
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomModal from "@/utils/ui/form/CustomModal";
import { CotizadorForm } from './CotizadorForm';

const  basePath = process.env.NEXT_PUBLIC_FRONT_COTIZADOR_URL || 'http://fallback-prod.url'; 

const EXTERNAL_QUOTE_URL = `${basePath}/Cotizador`;

function CotizacionesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenExternalLink = () => {
    // 'noopener,noreferrer' son importantes por seguridad.
    window.open(EXTERNAL_QUOTE_URL, '_blank', 'noopener,noreferrer');
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={styles.inicioContainer}>
      <div className={styles.header}>
        <h1 className={styles.mainTitle}>Cotizador Online:</h1>

        <div className={styles.buttonsContainer}>
          <CustomButton
            onClick={handleOpenExternalLink}
            width="fit-content" 
          >
            Abrir Cotizador
          </CustomButton>

          <CustomButton
            onClick={handleOpenModal}
            width="fit-content" 
          >
            Abrir Nuevo Cotizador
          </CustomButton>
        </div>
      </div>

      <CustomModal
        open={isModalOpen}
        onClose={handleCloseModal}
        title="Cotizador"
        size="large"
      >
        <CotizadorForm onClose={handleCloseModal} />
      </CustomModal>
    </div>
  )
}

export default CotizacionesPage;
