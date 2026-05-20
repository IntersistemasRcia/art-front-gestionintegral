"use client";

import React from 'react';
import { Typography, Box, Divider } from '@mui/material';
import CustomModal from '@/utils/ui/form/CustomModal';
import CustomButton from '@/utils/ui/button/CustomButton';
import { CotizacionesDTO } from '@/data/cotizadorAPI';
import Formato from '@/utils/Formato';
import styles from './cotizacionResultadoModal.module.css';

type CotizacionResultadoModalProps = {
  open: boolean;
  onClose: () => void;
  resultado: CotizacionesDTO | null;
  esSolicitud: boolean;
  error: string | null;
  onImprimir?: () => void;
  onEnviarEmail?: () => void;
};

export const CotizacionResultadoModal = ({
  open,
  onClose,
  resultado,
  esSolicitud,
  error,
  onImprimir,
  onEnviarEmail,
}: CotizacionResultadoModalProps) => {
  if (error) {
    return (
      <CustomModal
        open={open}
        onClose={onClose}
        title="Error al procesar la cotización"
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" color="error" sx={{ mb: 2, fontSize: '1.6rem' }}>
            {error}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <CustomButton onClick={onClose} color="primary">
              Cerrar
            </CustomButton>
          </Box>
        </Box>
      </CustomModal>
    );
  }

  if (esSolicitud) {
    return (
      <CustomModal
        open={open}
        onClose={onClose}
        title="Solicitud de Cotización"
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" sx={{ mb: 2, fontSize: '1.6rem' }}>
            Su solicitud de cotización ha sido registrada exitosamente. 
            Nuestro equipo se pondrá en contacto con usted a la brevedad.
          </Typography>
          {resultado && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.5rem' }}>
                ID de Solicitud: {resultado.idCotizacion}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
            <CustomButton onClick={onClose} color="primary">
              Cerrar
            </CustomButton>
          </Box>
        </Box>
      </CustomModal>
    );
  }

  // Cotización exitosa
  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Cotización Generada Exitosamente"
    >
      <Box sx={{ p: 2 }}>
        {resultado && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontSize: '2rem' }}>
                Detalles de la Cotización
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.6rem' }}>
                    Nro. Cotización:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '1.6rem' }}>
                    {resultado.idCotizacion}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.6rem' }}>
                    Alícuota Final:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '1.6rem' }}>
                    % {typeof resultado.alicuotaFinal === 'number' ? resultado.alicuotaFinal.toFixed(2) : resultado.alicuotaFinal}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.6rem' }}>
                    Estado:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '1.6rem' }}>
                    {resultado.estado}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          {onImprimir && !esSolicitud && (
            <CustomButton onClick={onImprimir} color="secondary">
              Imprimir
            </CustomButton>
          )}
          {onEnviarEmail && !esSolicitud && (
            <CustomButton onClick={onEnviarEmail} color="secondary">
              Enviar por Email
            </CustomButton>
          )}
          <CustomButton onClick={onClose} color="primary">
            Cerrar
          </CustomButton>
        </Box>
      </Box>
    </CustomModal>
  );
};

