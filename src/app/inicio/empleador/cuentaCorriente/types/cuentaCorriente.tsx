
export type CuentaCorrienteRegistro = {
    cuit?: number;
    empleador_Denominacion?: string;
    periodoCobertura: string;
    periodoDDJJ: string;
    fechaPresentacion: string;
    tipo: 'R' | 'O';
    masaSalarial: number;
    cantTrabajadores: number;
    alicFija: number;
    alicVar: number;
    alicFijaFFEPDeclarado: number;
    alicVarDeclarado: number;
    premioAPagar: number;
    deduccionDevengado: number;
    totalFFEP: number;
    totalSRES: number;
    totalCuotaAPagar: number;
    totalPagadoCuota: number;
    saldoMensual: number;
    saldoAcumulado: number;
}

export type DDJJRegistro = {
    cuit?: number;
    empleador_Denominacion?: string;
    periodoDDJJ: string;
    presentacion: string;    
    tipo: string;    
    alicFija: string;    
    alicVariable: string;
    cantTrabajadores: string;
    masaSalarial: string;
}


//#region VEmpleadorDDJJ Types
export type VEmpleadorDDJJPostParams = {
  cuit: number[];
  pageIndex: number;
  pageSize: number;
  orderBy: string;
};

export type VEmpleadorDDJJItem = {
  interno: number;
  cuit: number;
  periodo: number;
  presentacion: string;
  cantidadTrabajadores: number;
  masaSalarial: number;
  alicuotaFijaVigenteTrabajador: number;
  alicuotaVariableVigenteSobreMasaSalarial: number;
  alicuotaFijaDeclaradaTrabajador: number;
  alicuotaVariableDeclaradaMasaSalarial: number;
  ffep: number;
  totalDevengadoFfep: number;
  totalPagadoFfep: number;
  totalCuota: number;
  totalInteresesMora: number | null;
  totalPagadoCuota: number;
  totalPagadoIntereses: number;
  saldo: number;
  saldoAcumulado: number;
  origenDdjj: string;
  primaApagar: number;
  esPresunta: boolean;
};

export type VEmpleadorDDJJResponse = {
  index: number;
  size: number;
  pages: number;
  count: number;
  data: VEmpleadorDDJJItem[];
};
//#endregion VEmpleadorDDJJ Types

export default CuentaCorrienteRegistro;