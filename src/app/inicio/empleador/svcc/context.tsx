import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import gestionEmpleadorAPI, { PresentacionCreateDTO, PresentacionDTO, PresentacionFinalizaDTO, RefCIIU } from '@/data/gestionEmpleadorAPI';
import SrtAPI, { type SRTSiniestralidadCIUO88 } from '@/data/srtAPI';
import SvccAPI from '@/data/svccAPI';
import type { PresentacionUltimaDTO, SVCCPresentacionTodasParams, SVCCPresentacionUltimaParams } from '@/data/svccAPI';
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
    data?: PresentacionUltimaDTO;
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
} = SvccAPI;

const { useEstablecimientoList } = ArtAPI;

const {
  useSRTSiniestralidadCIUO88List,
} = SrtAPI;

const {
  useRefCIIUList,
} = gestionEmpleadorAPI;

/** `Browse`/`DataTable` notifica página en base 1; el estado arranca en `0` ⇒ primera página API = 1. */
function pageIndexForSvccApi(storedFromTable: number): number {
  return storedFromTable <= 0 ? 1 : storedFromTable;
}

/** Índice 1-based que espera `DataTable` desde la prop `pageIndex` (luego internamente hace `prop - 1`). */
function pageIndexFromApiResponse(apiPageIndex: number | undefined): number {
  return typeof apiPageIndex === "number" && apiPageIndex >= 1 ? apiPageIndex : 1;
}

export type SVCCPresentacionFilterBase = Omit<SVCCPresentacionTodasParams, "PageIndex" | "PageSize" | "Order">;

export function SVCCPresentacionContextProvider({
  children,
  empresaCUITParaAcciones,
  empresaCUITUltima,
  filtrosPresentacionesBase,
}: {
  children: ReactNode;
  empresaCUITParaAcciones?: number;
  /** CUIT de la empresa seleccionada en el combo; dispara GET Ultima una sola vez. */
  empresaCUITUltima?: number;
  filtrosPresentacionesBase?: SVCCPresentacionFilterBase;
}) {
  const [presentacionInfo, setPresentacionInfo] = useState<
    {
      index: number,
      size: number,
      selected?: PresentacionDTO
    }
  >({ index: 0, size: 10 });
  const [presentacionData, setPresentacionData] = useState<Data<PresentacionDTO>>({ index: presentacionInfo.index, size: presentacionInfo.size, count: 0, pages: 0, data: [] });
  
  useEffect(() => {
    setPresentacionInfo((o) => ({ ...o, index: 1, size: 10, selected: undefined }));
  }, [filtrosPresentacionesBase, empresaCUITUltima]);

  const presentacionTodasPaginated = useMemo((): SVCCPresentacionTodasParams | undefined => {
    if (filtrosPresentacionesBase == null) return undefined;
    return {
      ...filtrosPresentacionesBase,
      PageIndex: pageIndexForSvccApi(presentacionInfo.index),
      PageSize: 10,
      Order: "-interno",
    };
  }, [filtrosPresentacionesBase, presentacionInfo.index, presentacionInfo.size]);

  const presentacionTodas = useSVCCPresentacionTodas(presentacionTodasPaginated, {
    revalidateOnFocus: false,
  });

  const ultimaParams = useMemo((): SVCCPresentacionUltimaParams | undefined => {
    const cuit = Number(empresaCUITUltima);
    if (!Number.isFinite(cuit) || cuit <= 0) return undefined;
    return { empleadorCuit: cuit };
  }, [empresaCUITUltima]);

  const ultima = useSVCCPresentacionUltima(ultimaParams, { revalidateOnFocus: false });

  useEffect(() => {
    const pag = presentacionTodas.data;
    if (pag != null) {
      setPresentacionData({ ...pag, index: pageIndexFromApiResponse(pag.index) });
    }
  }, [presentacionTodas.data]);

  const constancia = useSVCCPresentacionConstancia(
    presentacionInfo.selected?.interno != null && presentacionInfo.selected.presentacionFecha != null
      ? { id: presentacionInfo.selected?.interno }
      : undefined
    , { revalidateOnFocus: false }
  );

  const nueva = useSVCCPresentacionNueva({ onSuccess(data) {
    presentacionTodas.mutate();
    ultima.mutate();
    if (data?.interno != null && data.interno > 0) {
      setPresentacionInfo((o) => ({ ...o, selected: data }));
    }
  }});

  const finaliza = useSVCCPresentacionFinaliza({ onSuccess(data) {
    const fechaConfirmacion = data?.presentacionFecha ?? new Date().toISOString();
    const presentacionFinalizada = {
      ...(presentacionInfo.selected ?? {}),
      ...data,
      presentacionFecha: fechaConfirmacion,
    } as PresentacionDTO;

    setPresentacionInfo((o) => ({ ...o, selected: presentacionFinalizada }));
    setPresentacionData((current) => ({
      ...current,
      data: current.data.map((presentacion) =>
        presentacion.interno === presentacionFinalizada.interno
          ? { ...presentacion, ...presentacionFinalizada }
          : presentacion
      ),
    }));
    presentacionTodas.mutate();
    ultima.mutate();
  }});

  const establecimientoList = useEstablecimientoList(
    empresaCUITParaAcciones && empresaCUITParaAcciones !== 0
      ? { cuit: empresaCUITParaAcciones }
      : undefined,
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
        empresaCUIT: empresaCUITParaAcciones,
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
          data: ultima.data ?? undefined,
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
