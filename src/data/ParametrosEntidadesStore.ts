import { create } from "zustand";
import type { ParametroEntidad } from "@/data/authAPI";

type ParametrosEntidadesStore = {
  parametrosEntidades: ParametroEntidad[];
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  setParametrosEntidades: (parametrosEntidades: ParametroEntidad[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  clearParametrosEntidades: () => void;
};

export const useParametrosEntidadesStore = create<ParametrosEntidadesStore>((set) => ({
  parametrosEntidades: [],
  isLoading: false,
  isLoaded: false,
  error: null,
  setParametrosEntidades: (parametrosEntidades) =>
    set({ parametrosEntidades, error: null, isLoaded: true }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false, isLoaded: true }),
  clearParametrosEntidades: () =>
    set({
      parametrosEntidades: [],
      error: null,
      isLoading: false,
      isLoaded: false,
    }),
}));
