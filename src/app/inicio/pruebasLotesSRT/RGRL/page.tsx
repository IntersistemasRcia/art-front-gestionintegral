"use client";
import { useState, useMemo, SyntheticEvent } from "react";
import { Box } from "@mui/material";
import { useEmpresasStore } from "@/data/empresasStore";
import { Empresa } from "@/data/authAPI";
import CustomSelectSearch from "@/utils/ui/form/CustomSelectSearch";
import CustomTab from "@/utils/ui/tab/CustomTab";
import Formato from "@/utils/Formato";
import RgrlTable from "./rgrlTable";
import EnvioSrtEnvio from "./envioSrtEnvio";

const EMPRESA_TODAS_EMPRESAS_ID = -1;
const EMPRESA_OPCION_TODAS: Empresa = {
  empresaId: EMPRESA_TODAS_EMPRESAS_ID,
  cuit: 0,
  razonSocial: "Todas las Empresas",
  domicilio: "",
  localidad: "",
  provincia: "",
};

export default function RGRLPage() {
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa>(EMPRESA_OPCION_TODAS);
  const [currentTab, setCurrentTab] = useState(0);

  const opcionesEmpresaSelector = useMemo(
    () => [EMPRESA_OPCION_TODAS, ...empresas],
    [empresas]
  );

  const getEmpresaLabel = (empresa: Empresa | null): string => {
    if (!empresa) return "";
    if (empresa.empresaId === EMPRESA_TODAS_EMPRESAS_ID) return "Todas las Empresas";
    return `${empresa.razonSocial} - ${Formato.CUIP(empresa.cuit)}`;
  };

  const tabItems = [
    {
      label: "Formularios Confirmados",
      value: 0,
      content: <RgrlTable empresaSeleccionada={empresaSeleccionada} />,
    },
    {
      label: "Seguimiento de Envío",
      value: 1,
      content: <EnvioSrtEnvio />,
    },
  ];

  return (
    <div>
      <Box sx={{ maxWidth: 500, marginBottom: 2 }}>
        <CustomSelectSearch<Empresa>
          options={opcionesEmpresaSelector}
          getOptionLabel={getEmpresaLabel}
          value={empresaSeleccionada}
          onChange={(_e, newValue) => setEmpresaSeleccionada(newValue ?? EMPRESA_OPCION_TODAS)}
          label="Seleccionar Empresa"
          placeholder="Buscar empresa..."
          loading={isLoadingEmpresas}
          loadingText="Cargando empresas..."
          noOptionsText={
            isLoadingEmpresas
              ? "Cargando..."
              : opcionesEmpresaSelector.length <= 1
              ? "No hay empresas disponibles"
              : "No se encontraron empresas"
          }
          disabled={isLoadingEmpresas}
        />
      </Box>
      <CustomTab
        tabs={tabItems}
        currentTab={currentTab}
        onTabChange={(_e: SyntheticEvent, val: string | number) => setCurrentTab(val as number)}
      />
    </div>
  );
}
