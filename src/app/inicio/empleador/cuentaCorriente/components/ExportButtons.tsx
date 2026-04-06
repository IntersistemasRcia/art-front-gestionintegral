"use client";
import React from 'react';
import { Box } from '@mui/material';
import CustomButton from '@/utils/ui/button/CustomButton';
import { saveTable } from '@/utils/excelUtils';
import Formato from '@/utils/Formato';

interface ExportButtonsProps {
    data: any[];
    type: 'estadoCuenta' | 'ultimasDDJJ';
    sumarleUnMesAlPeriodo?: (periodo: string | number | null | undefined) => string | null;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ data, type, sumarleUnMesAlPeriodo }) => {
    const toRoundedNumber = (value: unknown): number | null => {
        if (value == null) return null;
        const numericValue = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(numericValue)) return null;
        return Number(numericValue.toFixed(2));
    };

    // Funciones de exportación para Estado de Cuenta
    const handleExportCtaCteCSV = async () => {
        if (data.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        
        // Transformar datos para incluir ambos períodos
        const transformedData = data.map((row: any) => ({
            ...row,
            periodoCobertura: Formato.Fecha(sumarleUnMesAlPeriodo?.(row.periodo), "MM-YYYY"),
            periodoDDJJ: Formato.Fecha(row.periodo, "MM-YYYY"),
            saldoMensual: toRoundedNumber(row.saldoMensual),
            saldoAcumulado: toRoundedNumber(row.saldoAcumulado),
        }));
        
        const exportColumns = {
            periodoCobertura: { header: 'Período Cobertura', key: 'periodoCobertura' },
            periodoDDJJ: { header: 'Período DDJJ', key: 'periodoDDJJ' },
            presentacion: { header: 'Fecha de Presentación', key: 'presentacion' },
            origenDDJJ: { header: 'Tipo', key: 'origenDDJJ' },
            masaSalarial: { header: 'Masa Salarial', key: 'masaSalarial' },
            cantidadTrabajadores: { header: 'Cant. Trabajadores', key: 'cantidadTrabajadores' },
            alicuotaFijaVigenteTrabajador: { header: 'Alic. Fija', key: 'alicuotaFijaVigenteTrabajador' },
            alicuotaVariableVigenteSobreMasaSalarial: { header: 'Alic. Var.', key: 'alicuotaVariableVigenteSobreMasaSalarial' },
            alicuotaFijaDeclaradaTrabajador: { header: 'Alic. Fija + FFEP Declarado', key: 'alicuotaFijaDeclaradaTrabajador' },
            alicuotaVariableDeclaradaMasaSalarial: { header: 'Alic. Var. Declarada', key: 'alicuotaVariableDeclaradaMasaSalarial' },
            primaAPagar: { header: 'Premio A Pagar', key: 'primaAPagar' },
            totalDevengadoFFEP: { header: 'Total Devengado FFEP', key: 'totalDevengadoFFEP' },
            ffep: { header: 'FFEP S/Res', key: 'ffep' },
            totalCuota: { header: 'Total Cuota a Pagar', key: 'totalCuota' },
            totalPagadoCuota: { header: 'Total Pagado Cuota', key: 'totalPagadoCuota' },
            saldoMensual: { header: 'Saldo Mensual', key: 'saldoMensual' },
            saldoAcumulado: { header: 'Saldo Acumulado', key: 'saldoAcumulado' },
        };
        
        await saveTable(exportColumns, transformedData, 'estado_cuenta_empleador.csv', { format: 'csv' });
    };

    const handleExportCtaCteExcel = async () => {
        if (data.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        
        // Transformar datos para incluir ambos períodos
        const transformedData = data.map((row: any) => ({
            ...row,
            periodoCobertura: Formato.Fecha(sumarleUnMesAlPeriodo?.(row.periodo), "MM-YYYY"),
            periodoDDJJ: Formato.Fecha(row.periodo, "MM-YYYY"),
            saldoMensual: toRoundedNumber(row.saldoMensual),
            saldoAcumulado: toRoundedNumber(row.saldoAcumulado),
        }));
        
        const exportColumns = {
            periodoCobertura: { header: 'Período Cobertura', key: 'periodoCobertura' },
            periodoDDJJ: { header: 'Período DDJJ', key: 'periodoDDJJ' },
            presentacion: { header: 'Fecha de Presentación', key: 'presentacion' },
            origenDDJJ: { header: 'Tipo', key: 'origenDDJJ' },
            masaSalarial: { header: 'Masa Salarial', key: 'masaSalarial' },
            cantidadTrabajadores: { header: 'Cant. Trabajadores', key: 'cantidadTrabajadores' },
            alicuotaFijaVigenteTrabajador: { header: 'Alic. Fija', key: 'alicuotaFijaVigenteTrabajador' },
            alicuotaVariableVigenteSobreMasaSalarial: { header: 'Alic. Var.', key: 'alicuotaVariableVigenteSobreMasaSalarial' },
            alicuotaFijaDeclaradaTrabajador: { header: 'Alic. Fija + FFEP Declarado', key: 'alicuotaFijaDeclaradaTrabajador' },
            alicuotaVariableDeclaradaMasaSalarial: { header: 'Alic. Var. Declarada', key: 'alicuotaVariableDeclaradaMasaSalarial' },
            primaAPagar: { header: 'Premio A Pagar', key: 'primaAPagar' },
            totalDevengadoFFEP: { header: 'Total Devengado FFEP', key: 'totalDevengadoFFEP' },
            ffep: { header: 'FFEP S/Res', key: 'ffep' },
            totalCuota: { header: 'Total Cuota a Pagar', key: 'totalCuota' },
            totalPagadoCuota: { header: 'Total Pagado Cuota', key: 'totalPagadoCuota' },
            saldoMensual: { header: 'Saldo Mensual', key: 'saldoMensual' },
            saldoAcumulado: { header: 'Saldo Acumulado', key: 'saldoAcumulado' },
        };
        
        await saveTable(exportColumns, transformedData, 'estado_cuenta_empleador.xlsx', { 
            format: 'xlsx',
            sheet: { name: 'Estado de Cuenta' }
        });
    };

    // Funciones de exportación para Últimas DDJJ
    const handleExportDDJJCSV = async () => {
        if (data.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        
        const exportColumns = {
            periodo: { header: 'Período DDJJ', key: 'periodo' },
            presentacion: { header: 'Presentación', key: 'presentacion' },
            origenDDJJ: { header: 'Tipo', key: 'origenDDJJ' },
            alicuotaFijaDeclaradaTrabajador: { header: 'Alic. Fija', key: 'alicuotaFijaDeclaradaTrabajador' },
            alicuotaVariableDeclaradaMasaSalarial: { header: 'Alic. Variable', key: 'alicuotaVariableDeclaradaMasaSalarial' },
            cantidadTrabajadores: { header: 'Cant. Trabajadores', key: 'cantidadTrabajadores' },
            masaSalarial: { header: 'Masa Salarial', key: 'masaSalarial' },
        };
        
        await saveTable(exportColumns, data, 'ultimas_ddjj_empleador.csv', { format: 'csv' });
    };

    const handleExportDDJJExcel = async () => {
        if (data.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        
        const exportColumns = {
            periodo: { header: 'Período DDJJ', key: 'periodo' },
            presentacion: { header: 'Presentación', key: 'presentacion' },
            origenDDJJ: { header: 'Tipo', key: 'origenDDJJ' },
            alicuotaFijaDeclaradaTrabajador: { header: 'Alic. Fija', key: 'alicuotaFijaDeclaradaTrabajador' },
            alicuotaVariableDeclaradaMasaSalarial: { header: 'Alic. Variable', key: 'alicuotaVariableDeclaradaMasaSalarial' },
            cantidadTrabajadores: { header: 'Cant. Trabajadores', key: 'cantidadTrabajadores' },
            masaSalarial: { header: 'Masa Salarial', key: 'masaSalarial' },
        };
        
        await saveTable(exportColumns, data, 'ultimas_ddjj_empleador.xlsx', { 
            format: 'xlsx',
            sheet: { name: 'Últimas DDJJ' }
        });
    };

    // Decidir qué botones mostrar según el tipo
    if (type === 'estadoCuenta') {
        return (
            <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'flex-end' }}>
                <CustomButton 
                    color="primary"
                    onClick={handleExportCtaCteCSV}
                    disabled={data.length === 0}
                >
                    Exportar a CSV
                </CustomButton>
                <CustomButton 
                    color="primary"
                    onClick={handleExportCtaCteExcel}
                    disabled={data.length === 0}
                >
                    Exportar a Excel
                </CustomButton>
            </Box>
        );
    }

    // type === 'ultimasDDJJ'
    return (
        <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'flex-end' }}>
            <CustomButton 
                color="primary"
                onClick={handleExportDDJJCSV}
                disabled={data.length === 0}
            >
                Exportar a CSV
            </CustomButton>
            <CustomButton 
                color="primary"
                onClick={handleExportDDJJExcel}
                disabled={data.length === 0}
            >
                Exportar a Excel
            </CustomButton>
        </Box>
    );
};

export default ExportButtons;
