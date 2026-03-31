export type EmpresaRow = {
    interno?: number;
    cuit?: string;
    nombreEmpresa?: string;
    parametro?: string;
    accion?: string;
};

export type ParametroEntidad = {
    id: number;
    entidadId: number;
    entidadTipo: string;
    parametroId: number;
    parametroNombre: string;
    valor: string;
};

export type EmpresaById = {
    interno: number;
    cuit: number;
    razonSocial: string;
};

export interface Props {
    data?: EmpresaRow[];
    isLoading?: boolean;
}
export type EmpresaParamsID = {
  id?: number;
};