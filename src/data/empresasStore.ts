import { create } from "zustand";
import { Empresa } from "./authAPI";

type EmpresasStore = {
  empresas: Empresa[];
  isLoading: boolean;
  error: Error | null;
  setEmpresas: (empresas: Empresa[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  clearEmpresas: () => void;
};

export const useEmpresasStore = create<EmpresasStore>((set) => ({
  empresas: [],
  isLoading: false,
  error: null,
  setEmpresas: (empresas) => set({ empresas, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearEmpresas: () => set({ empresas: [], error: null, isLoading: false }),
}));

