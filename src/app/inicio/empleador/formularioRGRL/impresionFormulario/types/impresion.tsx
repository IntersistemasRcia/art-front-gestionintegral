// impresionFormulario/types/index.ts
import type { DocumentProps } from '@react-pdf/renderer';
import type { Style as PDFStyle } from '@react-pdf/types';

export type {
  PlanillaAItem,
  PlanillaBItem,
  PlanillaCItem,
  GremioItem,
  ContratistaItem,
  ResponsableItem,
} from '../../types/rgrl';

export type PDFChild = React.ReactElement<DocumentProps>;

export type VentanaImpresionFormularioProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: PDFChild; 
};

export type DetalleRow = {
  Nro: number;
  Categoria: string;
  CategoriaOrden?: number;
  Pregunta: string;
  Respuesta: string; 
  FechaRegularizacion: string;
  NormaVigente: string;
};

export type CabeceraData = {
  empresa: {
    razonSocial?: string;
    cuit?: string;
    contrato?: string;
    ciiu?: string;
  };
  establecimiento: {
    cuit?: string;
    numero?: string;
    ciiu?: string;
    direccion?: string;
    cp?: string;
    localidad?: string;
    provincia?: string;
    superficie?: string | number;
    cantTrabajadores?: number | string;
  };
  fechaSRT?: string; 
};

export type ImpresionProps = {
  cabecera: CabeceraData;
  detalle: DetalleRow[];
  planillaA: import('../../types/rgrl').PlanillaAItem[];
  planillaB?: import('../../types/rgrl').PlanillaBItem[];
  planillaC: import('../../types/rgrl').PlanillaCItem[];
  gremios: import('../../types/rgrl').GremioItem[];
  contratistas: import('../../types/rgrl').ContratistaItem[];
  responsables: import('../../types/rgrl').ResponsableItem[];
};

export type { PDFStyle };
