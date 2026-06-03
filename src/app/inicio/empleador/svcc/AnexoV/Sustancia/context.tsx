import { createContext, ReactNode, useContext } from "react";
import type { EstablecimientoDeclaradoDTO } from "@/data/gestionEmpleadorAPI";
import SvccAPI from "@/data/svccAPI";
import { useSVCCPresentacionContext } from "../../context";

type SustanciaContextType = {
  establecimientoDeclarado: {
    isLoading: boolean;
    isValidating: boolean;
    data?: EstablecimientoDeclaradoDTO;
    error?: any;
  },
}

const SustanciaContext = createContext<SustanciaContextType | undefined>(undefined);

const { useSVCCEstablecimientoDeclaradoList } = SvccAPI;

export function useSustanciaContext() {
  const context = useContext(SustanciaContext);
  if (context === undefined) throw new Error('useSustanciaContext must be used within a SustanciaContextProvider');
  return context;
}

export function SustanciaContextProvider({
  idEstablecimientoEmpresa,
  children,
}: {
  idEstablecimientoEmpresa?: number;
  children: ReactNode;
}) {
  const { presentacion: { selected: presentacion } } = useSVCCPresentacionContext();
  const establecimientosDeclarados = useSVCCEstablecimientoDeclaradoList({ presentacionId: presentacion?.interno ?? 0, PageIndex: 1, PageSize: 10, idEstablecimientoEmpresa }, {});
  const establecimientoDeclarado = establecimientosDeclarados.data?.data.find(e => e.idEstablecimientoEmpresa === idEstablecimientoEmpresa);

  return (
    <SustanciaContext.Provider
      value={{
        establecimientoDeclarado: {
          isLoading: establecimientosDeclarados.isLoading,
          isValidating: establecimientosDeclarados.isValidating,
          data: establecimientoDeclarado,
          error: establecimientosDeclarados.error,
        },
      }}
    >
      {children}
    </SustanciaContext.Provider>
  );
}