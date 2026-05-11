
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

export default CuentaCorrienteRegistro;