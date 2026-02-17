// @/utils/ui/message/CustomModalMessage/CustomModalMessage.tsx
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogTitle, Typography, Box } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import styles from './CustomModalMessage.module.css';
export type MessageType = 'success' | 'error' | 'warning' | 'info';
interface CustomModalMessageProps {
  open: boolean;
  message: string;
  type: MessageType;
  onClose: () => void;
  title?: string;
}

const CustomModalMessage: React.FC<CustomModalMessageProps> = ({
  open,
  message,
  type,
  onClose,
  title,
}) => {

  // Definir el ícono y la clase CSS basados en el tipo de mensaje
  const { Icon, defaultTitle } = React.useMemo(() => {
    switch (type) {
      case 'success':
        return { 
          Icon: CheckCircleOutlineIcon, 
          defaultTitle: '¡Operación Exitosa!' 
        };
      case 'error':
        return { 
          Icon: ErrorOutlineIcon, 
          defaultTitle: 'Error' 
        };
      case 'warning':
        return { 
          Icon: WarningAmberIcon, 
          defaultTitle: 'Advertencia' 
        };
      case 'info':
        return { 
          Icon: InfoOutlineIcon, 
          defaultTitle: 'Información' 
        };
      default:
        return { 
          Icon: WarningAmberIcon, 
          defaultTitle: 'Advertencia' 
        };
    }
  }, [type]);
  
  const colorClass = styles[type];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      className={styles.modal} // Estilo global del contenedor del modal
      PaperProps={{
        className: `${styles.paper} ${colorClass}` // Estilos de fondo y color del borde/ícono
      }}
    >
      <DialogTitle className={styles.title}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <Icon className={styles.icon} />
          <Typography variant="h6" component="span" className={styles.titleText}>
            {title || defaultTitle}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent className={styles.content}>
        <Typography variant="body1" className={styles.messageText}>
          {message}
        </Typography>
      </DialogContent>
      
      {/* <DialogActions>
        <Button onClick={onClose} color="primary">
          Cerrar
        </Button>
      </DialogActions> */}
    </Dialog>
  );
};
export default CustomModalMessage;