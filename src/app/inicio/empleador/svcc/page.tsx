'use client';
import { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import CustomSelectSearch from '@/utils/ui/form/CustomSelectSearch';
import Formato from '@/utils/Formato';
import { useEmpresasStore } from '@/data/empresasStore';
import { Empresa } from '@/data/authAPI';
import { SVCCPresentacionContextProvider } from './context';
import PresentacionesHandler from './Presentaciones/PresentacionesHandler';

export default function SVCCPage() {
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const seleccionAutomaticaRef = useRef(false);

  // Seleccionar automáticamente si solo hay una empresa
  useEffect(() => {
    if (!isLoadingEmpresas) {
      if (empresas.length === 1) {
        setEmpresaSeleccionada(empresas[0]);
        seleccionAutomaticaRef.current = true;
      } else if (empresas.length !== 1 && seleccionAutomaticaRef.current) {
        setEmpresaSeleccionada(null);
        seleccionAutomaticaRef.current = false;
      }
    }
  }, [empresas.length, isLoadingEmpresas]);

  const handleEmpresaChange = (
    _event: React.SyntheticEvent,
    newValue: Empresa | null
  ) => {
    setEmpresaSeleccionada(newValue);
    seleccionAutomaticaRef.current = false;
  };

  const getEmpresaLabel = (empresa: Empresa | null): string => {
    if (!empresa) return "";
    return `${empresa.razonSocial} - ${Formato.CUIP(empresa.cuit)}`;
  };

  return (
    <SVCCPresentacionContextProvider empresaCUIT={empresaSeleccionada?.cuit}>
      <Box sx={{ maxWidth: 500, marginBottom: 2 }}>
        <CustomSelectSearch<Empresa>
          options={empresas}
          getOptionLabel={getEmpresaLabel}
          value={empresaSeleccionada}
          onChange={handleEmpresaChange}
          label="Seleccionar Empresa"
          placeholder="Buscar empresa..."
          loading={isLoadingEmpresas}
          loadingText="Cargando empresas..."
          noOptionsText={
            isLoadingEmpresas
              ? "Cargando..."
              : empresas.length === 0
              ? "No hay empresas disponibles"
              : "No se encontraron empresas"
          }
          disabled={isLoadingEmpresas}
        />
      </Box>
      {empresaSeleccionada == null
        ? (<Typography color="error">Debe seleccionar una empresa</Typography>)
        : (<PresentacionesHandler/>)
      }
    </SVCCPresentacionContextProvider>
  );
}
