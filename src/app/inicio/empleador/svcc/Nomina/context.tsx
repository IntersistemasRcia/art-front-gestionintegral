import { createContext, ReactNode, useContext } from "react";
import type { SustanciaDTO } from "@/data/gestionEmpleadorAPI";
import SvccAPI from "@/data/svccAPI";
import { AnexoVContextProvider } from "../AnexoV/context";
import { useSVCCPresentacionContext } from "../context";

export type NominaContextType = {
  sustancias: {
    isLoading: boolean;
    isValidating: boolean;
    data: SustanciaDTO[];
    error?: any;
  };
}

const { useSVCCSustanciaList } = SvccAPI;

const NominaContext = createContext<NominaContextType | undefined>(undefined);

export function useNominaContext() {
  const context = useContext(NominaContext);
  if (context === undefined) throw new Error('useNominaContext must be used within a NominaContextProvider');
  return context;
}

export function NominaContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { presentacion: { selected: presentacion } } = useSVCCPresentacionContext();

  const sustancias = useSVCCSustanciaList(
    presentacion ? { presentacionId: presentacion.interno, PageIndex: 1, PageSize: 500 } : undefined,
    { revalidateOnFocus: false },
  );

  return (
    <NominaContext.Provider
      value={{
        sustancias: {
          isLoading: sustancias.isLoading,
          isValidating: sustancias.isValidating,
          data: sustancias.data?.data ?? [],
          error: sustancias.error,
        },
      }}
    >
      <AnexoVContextProvider>
        {children}
      </AnexoVContextProvider>
    </NominaContext.Provider>
  );
}