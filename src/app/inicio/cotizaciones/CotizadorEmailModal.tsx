"use client";

import React, { useRef, useState, useEffect } from 'react';
import { TextField, Box, Grid, Typography } from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CIIUIndicesDTO, ARTSellosIIBBDTO, EmpleadoresPadronDTO, CotizacionesDTO } from '@/data/cotizadorAPI';
import UsuarioAPI from '@/data/usuarioAPI';
import CustomModal from '@/utils/ui/form/CustomModal';
import CustomButton from '@/utils/ui/button/CustomButton';
import CustomModalMessage, { MessageType } from '@/utils/ui/message/CustomModalMessage';
import { CotizadorPDFContent } from './CotizadorPDFContent';
import { CotizadorPDFFormData } from './types';

type CotizadorEmailModalProps = {
  open: boolean;
  onClose: () => void;
  resultado: CotizacionesDTO;
  formData: CotizadorPDFFormData;
  actividadesCIIU?: CIIUIndicesDTO[];
  artSellosIIBB?: ARTSellosIIBBDTO[];
  empleadoresPadron?: EmpleadoresPadronDTO | null;
  ffepImporte?: number;
};

export const CotizadorEmailModal = ({
  open,
  onClose,
  resultado,
  formData,
  actividadesCIIU,
  artSellosIIBB,
  empleadoresPadron,
  ffepImporte = 1227,
}: CotizadorEmailModalProps) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState(formData.email || '');
  const [nombre, setNombre] = useState(empleadoresPadron?.denominacion || formData.nombre || '');
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [preparingPDF, setPreparingPDF] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [messageModal, setMessageModal] = useState<{
    open: boolean;
    message: string;
    type: MessageType;
  }>({
    open: false,
    message: '',
    type: 'success' as MessageType,
  });

  // Preparar PDF cuando se abre el modal y resetear estado cuando se cierra
  useEffect(() => {
    if (open) {
      // Resetear estados
      setEmail(formData.email || '');
      setNombre(empleadoresPadron?.denominacion || formData.nombre || '');
      setPdfBase64('');
      setEmailError('');
      setMessageModal({ open: false, message: '', type: 'success' as MessageType });
      
      // Preparar PDF después de un pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        if (pdfRef.current) {
          prepararPDF();
        }
      }, 100);
    }
  }, [open, formData.email, formData.nombre, empleadoresPadron?.denominacion]);

  const prepararPDF = async () => {
    if (!pdfRef.current) return;

    setPreparingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const marginMM = 8;

      const A4_PX_W = Math.round(210 * (96 / 25.4));
      const A4_PX_H = Math.round(297 * (96 / 25.4));

      const root = pdfRef.current;
      root.style.width = `${A4_PX_W}px`;
      root.style.height = `${A4_PX_H}px`;
      root.style.background = '#ffffff';

      // Esperar a que las imágenes se carguen
      const images = root.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve, reject) => {
              if (img.complete) {
                resolve(null);
              } else {
                img.onload = () => resolve(null);
                img.onerror = reject;
              }
            })
        )
      );

      const canvas = await html2canvas(root, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgWmm = canvas.width / (96 / 25.4);
      const imgHmm = canvas.height / (96 / 25.4);

      const availableW = pdfW - marginMM * 2;
      const availableH = pdfH - marginMM * 2;
      const scale = Math.min(availableW / imgWmm, availableH / imgHmm);

      const drawW = imgWmm * scale;
      const drawH = imgHmm * scale;
      const x = (pdfW - drawW) / 2;
      const y = marginMM;

      pdf.addImage(
        canvas.toDataURL('image/png', 1.0),
        'PNG',
        x,
        y,
        drawW,
        drawH,
        undefined,
        'FAST'
      );

      // Convertir PDF a base64
      const pdfBlob = pdf.output('blob');
      const base64 = await blobToBase64(pdfBlob);
      setPdfBase64(base64.split(',')[1]);
    } catch (error) {
      console.error('Error preparando PDF:', error);
      setMessageModal({
        open: true,
        message: 'Error al preparar el PDF para envío',
        type: 'error' as MessageType,
      });
    } finally {
      setPreparingPDF(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const validarEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setEmail(value);
    setEmailError('');
      setMessageModal({ open: false, message: '', type: 'success' as MessageType });
  };

  const handleEnviarCorreo = async () => {
    // Validar email
    if (!email || !email.trim()) {
      setEmailError('El email es requerido');
      return;
    }

    if (!validarEmail(email)) {
      setEmailError('Email inválido');
      return;
    }

    if (!pdfBase64) {
      setMessageModal({
        open: true,
        message: 'El PDF aún se está preparando. Por favor, espere un momento.',
        type: 'warning' as MessageType,
      });
      return;
    }

    setLoading(true);
    setEmailError('');
      setMessageModal({ open: false, message: '', type: 'success' as MessageType });

    try {
      await UsuarioAPI.enviarCorreo({
        to: [email],
        cuerpo: '<br/><br/><strong>Le enviamos adjunta la cotización solicitada</strong>',
        attachments: [
          {
            fileName: 'ART MUTUAL RURAL Cotización.pdf',
            contentType: 'application/pdf',
            base64Data: pdfBase64,
          },
        ],
      });

      setMessageModal({
        open: true,
        message: 'Correo enviado con éxito',
        type: 'success',
      });
      // Cerrar el modal después de 2 segundos si fue exitoso
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error enviando correo:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al enviar el correo';
      setMessageModal({
        open: true,
        message: errorMessage,
        type: 'error' as MessageType,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMessage = () => {
      setMessageModal({ open: false, message: '', type: 'success' as MessageType });
  };

  if (!open) return null;

  return (
    <>
      <CustomModal
        open={open}
        onClose={onClose}
        title="Enviar Cotización por Email"
      >
        <Box sx={{ p: 2 }}>
          {/* Contenedor oculto para generar el PDF */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div ref={pdfRef}>
              <CotizadorPDFContent
                resultado={resultado}
                formData={formData}
                actividadesCIIU={actividadesCIIU}
                artSellosIIBB={artSellosIIBB}
                empleadoresPadron={empleadoresPadron}
                ffepImporte={ffepImporte}
              />
            </div>
          </div>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                id="nombre"
                type="text"
                label="Nombre"
                value={nombre}
                disabled={true}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                error={!!emailError}
                id="email"
                type="email"
                label="Email"
                value={email}
                onChange={handleEmailChange}
                helperText={emailError || ''}
                disabled={loading || preparingPDF}
              />
            </Grid>
          </Grid>

          {preparingPDF && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Preparando PDF...
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <CustomButton
              onClick={handleEnviarCorreo}
              color="secondary"
              disabled={loading || preparingPDF || !pdfBase64}
            >
              {loading ? 'Enviando...' : 'Enviar Cotización por Email'}
            </CustomButton>
            <CustomButton onClick={onClose} color="primary" disabled={loading || preparingPDF}>
              Cerrar
            </CustomButton>
          </Box>
        </Box>
      </CustomModal>

      <CustomModalMessage
        open={messageModal.open}
        message={messageModal.message}
        type={messageModal.type}
        onClose={handleCloseMessage}
      />
    </>
  );
};

