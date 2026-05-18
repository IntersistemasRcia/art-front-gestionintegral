import { create } from "zustand";
import type RolesInterface from "@/app/inicio/usuarios/interfaces/RolesInterface";

type RolesStore = {
  roles: RolesInterface[];
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  setRoles: (roles: RolesInterface[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  clearRoles: () => void;
};

export const useRolesStore = create<RolesStore>((set) => ({
  roles: [],
  isLoading: false,
  isLoaded: false,
  error: null,
  setRoles: (roles) => set({ roles, error: null, isLoaded: true }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false, isLoaded: true }),
  clearRoles: () =>
    set({ roles: [], error: null, isLoading: false, isLoaded: false }),
}));
