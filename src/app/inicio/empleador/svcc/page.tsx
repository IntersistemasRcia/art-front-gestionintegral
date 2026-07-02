'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import CustomSelectSearch from '@/utils/ui/form/CustomSelectSearch';
import Formato from '@/utils/Formato';
import { useEmpresasStore } from '@/data/empresasStore';
import { Empresa } from '@/data/authAPI';
import { useAuth } from '@/data/AuthContext';
import { isAdministradorTodasEmpresasRole } from '@/utils/rolesUtils';
import { SVCCPresentacionContextProvider } from './context';
import type { SVCCPresentacionFilterBase } from './context';
import PresentacionesHandler from './Presentaciones/PresentacionesHandler';

const EMPRESA_TODAS_EMPRESAS_ID = -1;

const EMPRESA_OPCION_TODAS: Empresa = {
  empresaId: EMPRESA_TODAS_EMPRESAS_ID,
  cuit: 0,
  razonSocial: 'Todas las Empresas',
  domicilio: '',
  localidad: '',
  provincia: '',
}; 

type FiltrosSvccMemo = {
  empresaCUITParaAcciones?: number;
  empresaCUITUltima?: number;
  filtrosPresentacionesBase: SVCCPresentacionFilterBase;
};

export default function SVCCPage() {
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const { user } = useAuth();
  const isAdmin = isAdministradorTodasEmpresasRole(user?.rol);

  const cuitsEmpresasRelacionadas = useMemo(
    () =>
      Array.from(
        new Set(
          empresas
            .map((e) => Number(e.cuit))
            .filter((n) => Number.isFinite(n) && n !== 0)
        )
      ).sort((a, b) => a - b),
    [empresas]
  );

  const opcionesEmpresaSelector = useMemo(
    () => [EMPRESA_OPCION_TODAS, ...empresas],
    [empresas]
  );

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
  const seleccionAutomaticaRef = useRef(false);

  useEffect(() => {
    if (isLoadingEmpresas) return;
    if (empresas.length === 1) {
      setEmpresaSeleccionada(empresas[0]);
      seleccionAutomaticaRef.current = true;
      return;
    }
    if (empresas.length === 0) {
      setEmpresaSeleccionada(null);
      seleccionAutomaticaRef.current = false;
      return;
    }
    setEmpresaSeleccionada((prev) => {
      if (!seleccionAutomaticaRef.current && prev !== null) return prev;
      return EMPRESA_OPCION_TODAS;
    });
    seleccionAutomaticaRef.current = true;
  }, [empresas, isLoadingEmpresas]);

  const handleEmpresaChange = (
    _event: React.SyntheticEvent,
    newValue: Empresa | null
  ) => {
    setEmpresaSeleccionada(newValue);
    seleccionAutomaticaRef.current = false;
  };

  const getEmpresaLabel = (empresa: Empresa | null): string => {
    if (!empresa) return '';
    if (empresa.empresaId === EMPRESA_TODAS_EMPRESAS_ID) return 'Todas las Empresas';
    return `${empresa.razonSocial} - ${Formato.CUIP(empresa.cuit)}`;
  };

  const filtrosMemo = useMemo((): FiltrosSvccMemo | null => {
    if (empresaSeleccionada == null) return null;
    if (empresaSeleccionada.empresaId === EMPRESA_TODAS_EMPRESAS_ID) {
      // Administrador / AdministradorART: array vacío = todas las presentaciones.
      const empleadorCuit = isAdmin ? [] : cuitsEmpresasRelacionadas;
      if (!isAdmin && empleadorCuit.length === 0) return null;
      return {
        empresaCUITParaAcciones: undefined,
        empresaCUITUltima: undefined,
        filtrosPresentacionesBase: { empleadorCuit },
      };
    }
    const cuitNum = Number(empresaSeleccionada.cuit);
    if (!Number.isFinite(cuitNum) || cuitNum === 0) return null;
    return {
      empresaCUITParaAcciones: cuitNum,
      empresaCUITUltima: cuitNum,
      filtrosPresentacionesBase: { empleadorCuit: [cuitNum] },
    };
  }, [empresaSeleccionada, isAdmin, cuitsEmpresasRelacionadas]);

  return (
    <SVCCPresentacionContextProvider
      empresaCUITParaAcciones={filtrosMemo?.empresaCUITParaAcciones}
      empresaCUITUltima={filtrosMemo?.empresaCUITUltima}
      filtrosPresentacionesBase={filtrosMemo?.filtrosPresentacionesBase}
    >
      <Box sx={{ maxWidth: 500, marginBottom: 2 }}>
        <CustomSelectSearch<Empresa>
          options={opcionesEmpresaSelector}
          getOptionLabel={getEmpresaLabel}
          value={empresaSeleccionada}
          onChange={handleEmpresaChange}
          label="Seleccionar Empresa"
          placeholder="Buscar empresa..."
          loading={isLoadingEmpresas}
          loadingText="Cargando empresas..."
          noOptionsText={
            isLoadingEmpresas
              ? 'Cargando...'
              : empresas.length === 0
              ? 'No hay empresas disponibles'
              : 'No se encontraron empresas'
          }
          disabled={isLoadingEmpresas}
        />
      </Box>
      {empresaSeleccionada == null || filtrosMemo == null ? (
        <Typography color="error">
          {isLoadingEmpresas
            ? 'Cargando empresas...'
            : 'Debe seleccionar una empresa o no hay filtros válidos para su usuario.'}
        </Typography>
      ) : (
        <PresentacionesHandler />
      )}
    </SVCCPresentacionContextProvider>
  );
}
