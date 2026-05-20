import { create } from "zustand";
import { Empresa } from "./authAPI";

type EmpresasStore = {
  empresas: Empresa[];
  isLoading: boolean;
  error: Error | null;
  emptyEmpresasMessage: string | null;
  setEmpresas: (empresas: Empresa[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  setEmptyEmpresasMessage: (message: string | null) => void;
  clearEmpresas: () => void;
};

export const useEmpresasStore = create<EmpresasStore>((set) => ({
  empresas: [],
  isLoading: false,
  error: null,
  emptyEmpresasMessage: null,
  setEmpresas: (empresas) => set({ empresas, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setEmptyEmpresasMessage: (message) => set({ emptyEmpresasMessage: message }),
  clearEmpresas: () =>
    set({ empresas: [], error: null, isLoading: false, emptyEmpresasMessage: null }),
}));

