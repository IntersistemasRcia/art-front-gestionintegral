
export type CuentaCorrienteRegistro = {
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
    periodoDDJJ: string;
    presentacion: string;    
    tipo: string;    
    alicFija: string;    
    alicVariable: string;
    cantTrabajadores: string;
    masaSalarial: string;
}

export default CuentaCorrienteRegistro;