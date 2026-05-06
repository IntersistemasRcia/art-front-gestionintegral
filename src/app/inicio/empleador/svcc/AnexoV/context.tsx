import { createContext, ReactNode, useContext } from "react";
import type { EmpresaTercerizadaDTO, EstablecimientoDeclaradoDTO } from "@/data/gestionEmpleadorAPI";
import ArtAPI from "@/data/artAPI";
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
} = ArtAPI;

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

  const empresasTercerizadas = useSVCCEmpresaTercerizadaList(
    presentacion ? { presentacionId: presentacion.interno, PageIndex: 1, PageSize: 10 } : undefined,
    {},
  );
  const establecimientosDeclarados = useSVCCEstablecimientoDeclaradoList(
    presentacion ? { presentacionId: presentacion.interno, PageIndex: 1, PageSize: 10 } : undefined,
    {},
  );

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