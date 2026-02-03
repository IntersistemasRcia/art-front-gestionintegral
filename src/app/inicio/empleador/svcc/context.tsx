import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/data/AuthContext";
import gestionEmpleadorAPI, { Pagination, PresentacionCreateDTO, PresentacionDTO, PresentacionFinalizaDTO, RefCIIU, SRTSiniestralidadCIUO88, SVCCPresentacionTodasParams } from '@/data/gestionEmpleadorAPI';
import ArtAPI, { EstablecimientoVm, EstablecimientoVmDescripcion } from "@/data/artAPI";
import { arrayToRecord } from "@/utils/utils";
import { AxiosError } from "axios";
import { Data } from "@/utils/ui/table/Browse";

export type SVCCPresentacionContextType = {
  empresaCUIT?: number;
  presentacion: {
    isLoading: boolean;
    isValidating: boolean;
    data: Data<PresentacionDTO>;
    setPageIndex: (index: number) => void;
    setPageSize: (size: number) => void;
    selected?: PresentacionDTO;
    setSelected: (select?: PresentacionDTO) => void;
  };
  ultima: {
    isLoading: boolean;
    isValidating: boolean;
    data?: PresentacionDTO;
    error?: AxiosError
  };
  isMutating: boolean;
  nueva: {
    isMutating: boolean;
    data?: PresentacionDTO;
    error?: AxiosError;
    trigger: (data: PresentacionCreateDTO) => void;
  };
  finaliza: {
    isMutating: boolean;
    data?: PresentacionDTO;
    error?: AxiosError;
    trigger: (data: PresentacionFinalizaDTO) => void;
  };
  constancia: {
    isLoading: boolean;
    isValidating: boolean;
    data?: File;
    error?: AxiosError
  };
  establecimientos: {
    isLoading: boolean;
    isValidating: boolean;
    data?: EstablecimientoVm[],
    error?: AxiosError,
    map: Record<number, string>,
  };
  refCIIU: {
    isLoading: boolean;
    isValidating: boolean;
    data?: RefCIIU[],
    error?: AxiosError,
    map: Record<number, string>,
  };
  ciuo88: {
    isLoading: boolean;
    isValidating: boolean;
    data?: SRTSiniestralidadCIUO88[],
    error?: AxiosError,
    map: Record<number, string>,
  };
}

const SVCCPresentacionContext = createContext<SVCCPresentacionContextType | undefined>(undefined);

const {
  useSVCCPresentacionTodas,
  useSVCCPresentacionUltima,
  useSVCCPresentacionNueva,
  useSVCCPresentacionFinaliza,
  useSVCCPresentacionConstancia,

  useSRTSiniestralidadCIUO88List,
  useRefCIIUList,
} = gestionEmpleadorAPI;

const { useEstablecimientoList } = ArtAPI;

export function SVCCPresentacionContextProvider({ 
  children,
  empresaCUIT
}: { 
  children: ReactNode;
  empresaCUIT?: number;
}) {
  const { user } = useAuth();
  
  // Solo hacer fetch si hay empresa seleccionada (empresaCUIT debe ser válido y diferente de 0)
  const cuitParaUsar = empresaCUIT && empresaCUIT !== 0 ? empresaCUIT : undefined;
  
  const [presentacionInfo, setPresentacionInfo] = useState<
    {
      index: number,
      size: number,
      selected?: PresentacionDTO
    }
  >({ index: 0, size: 100 });
  const [presentacionData, setPresentacionData] = useState<Data<PresentacionDTO>>({ index: presentacionInfo.index, size: presentacionInfo.size, count: 0, pages: 0, data: [] });
  
  useEffect(() => {
    setPresentacionInfo((o) => ({ ...o, selected: undefined }));
  }, [cuitParaUsar]);

  const presentacionTodas = useSVCCPresentacionTodas(
    cuitParaUsar ? { empleadorCUIT: cuitParaUsar, page: `${presentacionInfo.index + 1},${presentacionInfo.size}`, sort: "-interno" } : undefined,
    {
      revalidateOnFocus: false,
      onSuccess(data) {
        setPresentacionData({ ...data, index: data.index - 1 });
      },
    }
  );

  const ultima = useSVCCPresentacionUltima(cuitParaUsar ? { empleadorCUIT: cuitParaUsar } : undefined, { revalidateOnFocus: false });

  const constancia = useSVCCPresentacionConstancia(
    presentacionInfo.selected?.interno != null && presentacionInfo.selected.presentacionFecha != null
      ? { id: presentacionInfo.selected?.interno }
      : undefined
    , { revalidateOnFocus: false }
  );

  const nueva = useSVCCPresentacionNueva({ onSuccess() {
    presentacionTodas.mutate();
    ultima.mutate();
    // constancia.mutate();
  }});

  const finaliza = useSVCCPresentacionFinaliza({ onSuccess() {
    presentacionTodas.mutate();
    ultima.mutate();
    // constancia.mutate();
  }});

  // Solo hacer fetch de establecimientos si hay empresa seleccionada
  const establecimientoList = useEstablecimientoList(
    cuitParaUsar ? { cuit: cuitParaUsar } : undefined,
    { revalidateOnFocus: false }
  );

  const setPresentacionInfoIndex = useCallback((index: number) => {
    setPresentacionInfo((o) => ({ ...o, index }));
    constancia.mutate();
  }, [presentacionInfo.selected, constancia]);

  const setPresentacionInfoSize = useCallback((size: number) => {
    setPresentacionInfo((o) => ({ ...o, size }));
    constancia.mutate();
  }, [presentacionInfo.selected, constancia]);

  const establecimientoMap = useMemo(() => (
    arrayToRecord(establecimientoList.data ?? [], (e) => [e.codEstabEmpresa, EstablecimientoVmDescripcion(e)])
  ), [establecimientoList.data]);

  const refCIIUList = useRefCIIUList({ revalidateOnFocus: false });

  const refCIIUMap = useMemo(() => (
    arrayToRecord(refCIIUList.data ?? [], (e) => [e.ciiuRev4 ?? 0, e.descripcionRev4 ?? ""])
  ), [refCIIUList.data]);

  const ciuo88List = useSRTSiniestralidadCIUO88List({ revalidateOnFocus: false });

  const ciuo88Map = useMemo(() => (
    arrayToRecord(ciuo88List.data ?? [], (e) => [e.ciuO88, e.descripcion ?? ""])
  ), [ciuo88List.data]);

  return (
    <SVCCPresentacionContext.Provider
      value={{
        empresaCUIT,
        presentacion: {
          isLoading: presentacionTodas.isLoading,
          isValidating: presentacionTodas.isValidating,
          data: presentacionData,
          setPageIndex: setPresentacionInfoIndex,
          setPageSize: setPresentacionInfoSize,
          selected: presentacionInfo.selected,
          setSelected: (selected) => setPresentacionInfo((o) => ({ ...o, selected })),
        },
        ultima: {
          isLoading: ultima.isLoading,
          isValidating: ultima.isValidating,
          data: ultima.data,
          error: ultima.error
        },
        isMutating: nueva.isMutating || finaliza.isMutating,
        nueva: {
          isMutating: nueva.isMutating,
          data: nueva.data,
          error: nueva.error,
          trigger: nueva.trigger
        },
        finaliza: {
          isMutating: finaliza.isMutating,
          data: finaliza.data,
          error: finaliza.error,
          trigger: finaliza.trigger
        },
        constancia: {
          isLoading: constancia.isLoading,
          isValidating: constancia.isValidating,
          data: constancia.data,
          error: constancia.error
        },
        establecimientos: {
          isLoading: establecimientoList.isLoading,
          isValidating: establecimientoList.isValidating,
          data: establecimientoList.data,
          error: establecimientoList.error,
          map: establecimientoMap,
        },
        refCIIU: {
          isLoading: refCIIUList.isLoading,
          isValidating: refCIIUList.isValidating,
          data: refCIIUList.data,
          error: refCIIUList.error,
          map: refCIIUMap,
        },
        ciuo88: {
          isLoading: ciuo88List.isLoading,
          isValidating: ciuo88List.isValidating,
          data: ciuo88List.data,
          error: ciuo88List.error,
          map: ciuo88Map,
        },
      }}
    >
      {children}
    </SVCCPresentacionContext.Provider>
  );
}

export function useSVCCPresentacionContext() {
  const context = useContext(SVCCPresentacionContext)
  if (context === undefined) throw new Error('useSVCCPresentacionContext must be used within a SVCCPresentacionContextProvider');
  return context
}
