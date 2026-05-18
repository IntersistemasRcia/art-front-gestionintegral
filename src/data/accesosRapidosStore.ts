import { create } from "zustand";
import type { AccesoRapido } from "@/utils/accesosRapidosUtils";

type AccesosRapidosStore = {
  accesosRapidos: AccesoRapido[];
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  setAccesosRapidos: (accesosRapidos: AccesoRapido[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  clearAccesosRapidos: () => void;
};

export const useAccesosRapidosStore = create<AccesosRapidosStore>((set) => ({
  accesosRapidos: [],
  isLoading: false,
  isLoaded: false,
  error: null,
  setAccesosRapidos: (accesosRapidos) =>
    set({ accesosRapidos, error: null, isLoaded: true }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false, isLoaded: true }),
  clearAccesosRapidos: () =>
    set({
      accesosRapidos: [],
      error: null,
      isLoading: false,
      isLoaded: false,
    }),
}));
