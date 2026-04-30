export type FormularioEvolucionesProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  denunciaId?: number | string | null;
  denunciaNro?: number | string | null;
  empleadoNombre?: string | null;
  empleadoCuil?: number | string | null;
};


export type ParametersDenunciaInstancia = {
  denunciaNro?: number;
  Tipo?: string;
  AutorizacionEstado?: string;
  VerTodas?: boolean;
}

export type DenunciaInstanciaItem = {
  interno?: number;
  fechaHora?: string;
  tipoInstancia?: string;
  comentario?: string;
  formulario?: string;
  autorizacionEstado?: string;
  operadorInterno?: number | null;
  [key: string]: unknown;
}