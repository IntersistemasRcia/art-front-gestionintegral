import { createContext, ReactNode, useContext } from "react";
import SvccAPI from "@/data/svccAPI";
import { useSVCCPresentacionContext } from "../../context";
import { EstablecimientoVm } from "@/data/artAPI";
import { EstablecimientoDeclaradoDTO } from "@/data/gestionEmpleadorAPI";

const { useSVCCEstablecimientoDeclaradoList } = SvccAPI;

type TrabajadorContextType = {
  establecimientoDeclarado: {
    isLoading: boolean;
    isValidating: boolean;
    data?: EstablecimientoDeclaradoDTO;
    error?: unknown;
  },
  establecimiento: {
    isLoading: boolean;
    isValidating: boolean;
    data?: EstablecimientoVm;
    error?: unknown;
  },
  idEstablecimientoEmpresa?: number;
}

const TrabajadorContext = createContext<TrabajadorContextType | undefined>(undefined);

export function useTrabajadorContext() {
  const context = useContext(TrabajadorContext);
  if (context === undefined) throw new Error('useTrabajadorContext must be used within a TrabajadorContextProvider');
  return context;
}

export function TrabajadorContextProvider({
  idEstablecimientoEmpresa,
  children,
}: {
  idEstablecimientoEmpresa?: number;
  children: ReactNode;
}) {
  const {
    presentacion: { selected: presentacionSeleccionada },
    ultima,
    establecimientos,
  } = useSVCCPresentacionContext();

  const presentacionActiva = presentacionSeleccionada ?? ultima.data;
  const presentacionId = presentacionActiva?.interno ?? 0;
  const establecimientoEmpresaId = idEstablecimientoEmpresa ?? 0;
  const shouldFetchDeclarado = presentacionId > 0 && establecimientoEmpresaId > 0;

  const establecimientosDeclaradosQuery = useSVCCEstablecimientoDeclaradoList(
    shouldFetchDeclarado
      ? {
          presentacionId,
          idEstablecimientoEmpresa: establecimientoEmpresaId,
          PageIndex: 1,
          PageSize: 1,
        }
      : undefined,
    { revalidateOnFocus: false },
  );

  const establecimientoDeclarado = establecimientosDeclaradosQuery.data?.data?.find(
    (item) => item.idEstablecimientoEmpresa === establecimientoEmpresaId,
  ) ?? establecimientosDeclaradosQuery.data?.data?.[0];

  const establecimiento = establecimientos.data?.find(
    (item) => item.codEstabEmpresa === establecimientoEmpresaId,
  );

  return (
    <TrabajadorContext.Provider
      value={{
        idEstablecimientoEmpresa,
        establecimientoDeclarado: {
          isLoading: establecimientosDeclaradosQuery.isLoading,
          isValidating: establecimientosDeclaradosQuery.isValidating,
          data: establecimientoDeclarado,
          error: establecimientosDeclaradosQuery.error,
        },
        establecimiento: {
          isLoading: establecimientos.isLoading,
          isValidating: establecimientos.isValidating,
          data: establecimiento,
          error: establecimientos.error,
        },
      }}
    >
      {children}
    </TrabajadorContext.Provider>
  );
}
