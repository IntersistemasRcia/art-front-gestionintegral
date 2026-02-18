import { createContext, ReactNode, useContext } from "react";
import gestionEmpleadorAPI, { EmpresaTercerizadaDTO, EstablecimientoDeclaradoDTO } from "@/data/gestionEmpleadorAPI";
import { useSVCCPresentacionContext } from "../context";

export type AnexoVContextType = {
  establecimientosDeclarados: {
    isLoading: boolean;
    isValidating: boolean;
    data: EstablecimientoDeclaradoDTO[];
    error?: any;
  };
  empresasTercerizadas: {
    isLoading: boolean;
    isValidating: boolean;
    data: EmpresaTercerizadaDTO[];
    error?: any;
  };
}

const {
  useSVCCEmpresaTercerizadaList,
  useSVCCEstablecimientoDeclaradoList,
} = gestionEmpleadorAPI;

const AnexoVContext = createContext<AnexoVContextType | undefined>(undefined);

export function useAnexoVContext() {
  const context = useContext(AnexoVContext);
  if (context === undefined) throw new Error('useAnexoVContext must be used within a AnexoVContextProvider');
  return context;
}

export function AnexoVContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { presentacion: { selected: presentacion } } = useSVCCPresentacionContext();

  const empresasTercerizadas = useSVCCEmpresaTercerizadaList(presentacion ? { presentacionId: presentacion.interno } : undefined, {});
  const establecimientosDeclarados = useSVCCEstablecimientoDeclaradoList(presentacion ? { presentacionId: presentacion.interno } : undefined, {});

  return (
    <AnexoVContext.Provider
      value={{
        empresasTercerizadas: {
          isLoading: empresasTercerizadas.isLoading,
          isValidating: empresasTercerizadas.isValidating,
          data: empresasTercerizadas.data?.data ?? [],
          error: empresasTercerizadas.error,
        },
        establecimientosDeclarados: {
          isLoading: establecimientosDeclarados.isLoading,
          isValidating: establecimientosDeclarados.isValidating,
          data: establecimientosDeclarados.data?.data ?? [],
          error: establecimientosDeclarados.error,
        },
      }}
    >
      {children}
    </AnexoVContext.Provider>
  );
}