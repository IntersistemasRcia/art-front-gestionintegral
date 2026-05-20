// src/utils/ui/button/CustomButton.tsx

"use client";
import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import styles from './CustomButton.module.css';

interface CustomButtonProps extends Omit<ButtonProps, 'classes' | 'size' | 'fullWidth' | 'color'> {
  children: React.ReactNode;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error' | 'white';
  isLoading?: boolean;
  width?: string;
  icon?: React.ReactNode;
  size?: 'small' | 'mid' | 'large';
  download?: any;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  children,
  variant = 'contained',
  color = 'primary',
  isLoading = false,
  width,
  className = '',
  disabled = false,
  icon,
  size = 'mid',
  ...props
}) => {
  const sizeClass = {
    small: styles.small,
    mid: styles.mid,
    large: styles.large,
  };
  
  // Mapeo de color a clase CSS específica
  const colorClass = {
    primary: styles.primary,
    secondary: styles.secondary,
    error: styles.error,
    white: styles.white,
  };
  
  const baseColorClass = colorClass[color] || styles.primary; 

  return (
    <Button
      variant={variant}
      classes={{
        root: `${styles.customButton} ${baseColorClass} ${disabled || isLoading ? styles.disabled : ''} ${sizeClass[size]}`,
        // Mantener estas líneas si Material UI las requiere, aunque el estilo principal se maneja en 'root'
        containedPrimary: styles.primary,
      }}
      // Aseguramos que la clase de color esté en el className para variantes outlined/text
      className={`${className} ${baseColorClass}`} 
      disabled={disabled || isLoading}
      style={{ width: width || 'fit-content' }}
      {...props}
    >
      {isLoading ? (
        <span className={styles.loadingText}>CARGANDO...</span>
      ) : (
        <div className={styles.contentWrapper}>
          {icon && <span className={styles.iconWrapper}>{icon}</span>}
          {children}
        </div>
      )}
    </Button>
  );
};

export default CustomButton;