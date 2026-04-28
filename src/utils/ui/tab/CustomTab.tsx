//src/utils/ui/tab/CustomTab.tsx

import React, { useState, ReactNode, SyntheticEvent } from 'react';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import styles from './CustomTab.module.css';

// Define la estructura de cada "tab"
interface TabItem {
  label: string;
    value: number;         
    content: ReactNode;    // El contenido que se mostrará en el panel
    disabled?: boolean;    // para deshabilitar la pestaña
  
}

// Define las propiedades del componente CustomTabs
interface CustomTabsProps {
  tabs: TabItem[];
  currentTab: number; // El valor actual de la pestaña DEBE venir del padre para ser controlado
  onTabChange: (event: SyntheticEvent, newTabValue: number) => void;  // El manejador de cambio DEBE venir del padre
}

// Interfaz para el Panel de la pestaña
interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

// Componente auxiliar para el Panel de Contenido de cada Tab
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      className={styles.tabPanel} // Aplicamos la clase para padding o estilos del panel
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {/* Aquí se podría usar el componente Typography, pero dejaremos el children directo */}
          {children}
        </Box>
      )}
    </div>
  );
}

// Función auxiliar para las propiedades de accesibilidad
function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

// Componente principal CustomTabs
const CustomTabs: React.FC<CustomTabsProps> = ({ tabs, currentTab, onTabChange }) => {
  
return (

        <Box sx={{ width: '100%' }}> 
            <Box className={styles.tabsContainer}>
                <Tabs 
                    value={currentTab} // <-- Usa el valor del padre
                    onChange={onTabChange} // <-- Usa la función del padre
                    aria-label="custom tabs"
                    className={styles.customTabsBar} 
                >
                    {tabs.map((tab) => (
                        <Tab
                            key={tab.value}
                            label={tab.label}
                            value={tab.value} 
                            disabled={tab.disabled || false} // <-- Aplica la propiedad disabled
                            {...a11yProps(tab.value)}
                            className={styles.customTab} 
                        />
                    ))}
                </Tabs>
            </Box>
            {/* Renderizado de los Paneles de Contenido */}
            {tabs.map((tab) => (
                <TabPanel key={tab.value} value={currentTab} index={tab.value}>
                    {tab.content}
                </TabPanel>
            ))}
        </Box>
    );
};

export default CustomTabs;