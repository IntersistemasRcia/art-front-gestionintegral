"use client";

import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import type { RefRol, RefSector, RefCargoEmpresa } from "@/data/authAPI";
import type { FiltroVm } from "@/data/queryAPI";

export type RequestMethod = "create" | "edit" | "view" | "delete";

export interface IndicadorFormFields {
  id?: number;
  nombre: string;
  descripcion: string;
  filtroId: number;
  tablaBase: string;
  rolId: string;
  cargoId: number | null;
  sectorId: number | null;
  estado: "Activo" | "Inactivo";
  link?: string;
}

export interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: IndicadorFormFields) => void;
  initialData?: IndicadorFormFields;
  errorMsg?: string | null;
  method: RequestMethod;
  isSubmitting?: boolean;
  roles?: RefRol[];
  sectores?: RefSector[];
  cargos?: RefCargoEmpresa[];
  filtros?: FiltroVm[];
}

const initialFormState: IndicadorFormFields = {
  nombre: "",
  descripcion: "",
  filtroId: 0,
  tablaBase: "",
  rolId: "",
  cargoId: null,
  sectorId: null,
  estado: "Activo",
  link: "",
};

export default function IndicadorForm({
  open,
  onClose,
  onSubmit,
  initialData,
  errorMsg,
  method,
  isSubmitting = false,
  roles = [],
  sectores = [],
  cargos = [],
  filtros = [],
}: Props) {
  const [formData, setFormData] = useState<IndicadorFormFields>(initialFormState);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(initialFormState);
    }
    setTouched({});
  }, [initialData, open]);

  const isViewMode = method === "view";
  const isReadOnly = isViewMode;

  const handleChange = (field: keyof IndicadorFormFields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string | number>
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === "filtroId"
          ? Number(value) || 0
          : field === "cargoId" || field === "sectorId"
            ? (value === "" || value === "0" ? null : Number(value))
            : value,
    }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setTouched({});
    onClose();
  };

  const title = method === "create" ? "Crear Indicador" : method === "edit" ? "Editar Indicador" : "Ver Indicador";

  const actions = !isViewMode ? (
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
      <CustomButton onClick={handleClose} variant="outlined">
        Cancelar
      </CustomButton>
      <CustomButton
        onClick={handleSubmit}
        disabled={isSubmitting || !formData.nombre || !formData.descripcion || !formData.tablaBase || !formData.rolId}
        isLoading={isSubmitting}
      >
        Guardar
      </CustomButton>
    </Box>
  ) : (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <CustomButton onClick={handleClose}>
        Cerrar
      </CustomButton>
    </Box>
  );

  return (
    <CustomModal
      open={open}
      onClose={handleClose}
      title={title}
      size="mid"
      actions={actions}
    >
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "200px" }}
              label="Nombre"
              value={formData.nombre}
              onChange={handleChange("nombre")}
              disabled={isReadOnly}
              required
              error={touched.nombre && !formData.nombre}
              helperText={touched.nombre && !formData.nombre ? "El nombre es requerido" : ""}
            />

            <TextField
              sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "200px" }}
              label="Descripción"
              value={formData.descripcion}
              onChange={handleChange("descripcion")}
              disabled={isReadOnly}
              required
              error={touched.descripcion && !formData.descripcion}
              helperText={touched.descripcion && !formData.descripcion ? "La descripción es requerida" : ""}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl
              sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "200px" }}
              disabled={isReadOnly}
              required
              error={touched.filtroId && formData.filtroId === 0}
            >
              <InputLabel shrink>Filtro</InputLabel>
              <Select
                value={formData.filtroId === 0 ? "" : String(formData.filtroId)}
                onChange={handleChange("filtroId")}
                label="Filtro"
                displayEmpty
              >
                <MenuItem value="">
                  <em>Sin selección</em>
                </MenuItem>
                {filtros
                  .filter((f) => f.id != null)
                  .map((filtro) => (
                    <MenuItem key={filtro.id} value={String(filtro.id)}>
                      {filtro.nombre ?? `Filtro ${filtro.id}`}
                    </MenuItem>
                  ))}
              </Select>
              {touched.filtroId && formData.filtroId === 0 && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  El filtro es requerido
                </Typography>
              )}
            </FormControl>

            <TextField
              sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "200px" }}
              label="Tabla Base"
              value={formData.tablaBase}
              onChange={handleChange("tablaBase")}
              disabled={isReadOnly}
              required
              error={touched.tablaBase && !formData.tablaBase}
              helperText={touched.tablaBase && !formData.tablaBase ? "La tabla base es requerida" : ""}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl
              sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "200px" }}
              disabled={isReadOnly}
              required
              error={touched.rolId && !formData.rolId}
            >
              <InputLabel shrink>Rol</InputLabel>
              <Select
                value={formData.rolId}
                onChange={handleChange("rolId")}
                label="Rol"
                displayEmpty
              >
                <MenuItem value="">
                  <em>Sin selección</em>
                </MenuItem>
                {roles.map((rol) => (
                  <MenuItem key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </MenuItem>
                ))}
              </Select>
              {touched.rolId && !formData.rolId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  El rol es requerido
                </Typography>
              )}
            </FormControl>

            <FormControl sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "200px" }} disabled={isReadOnly}>
              <InputLabel shrink>Cargo</InputLabel>
              <Select
                value={formData.cargoId != null ? String(formData.cargoId) : ""}
                onChange={handleChange("cargoId")}
                label="Cargo"
                displayEmpty
              >
                <MenuItem value="">
                  <em>Sin selección</em>
                </MenuItem>
                {cargos.map((cargo) => (
                  <MenuItem key={cargo.id} value={String(cargo.id)}>
                    {cargo.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "200px" }} disabled={isReadOnly}>
              <InputLabel shrink>Sector</InputLabel>
              <Select
                value={formData.sectorId != null ? String(formData.sectorId) : ""}
                onChange={handleChange("sectorId")}
                label="Sector"
                displayEmpty
              >
                <MenuItem value="">
                  <em>Sin selección</em>
                </MenuItem>
                {sectores.map((sector) => (
                  <MenuItem key={sector.id} value={String(sector.id)}>
                    {sector.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "200px" }} disabled={isReadOnly}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={formData.estado}
                onChange={handleChange("estado")}
                label="Estado"
              >
                <MenuItem value="Activo">Activo</MenuItem>
                <MenuItem value="Inactivo">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <TextField
              fullWidth
              label="Link"
              value={formData.link ?? ""}
              onChange={handleChange("link")}
              disabled={isReadOnly}
            />
          </Box>

          {errorMsg && (
            <Box>
              <Typography color="error" variant="body2">
                {errorMsg}
              </Typography>
            </Box>
          )}
        </Box>
      </form>
    </CustomModal>
  );
}

