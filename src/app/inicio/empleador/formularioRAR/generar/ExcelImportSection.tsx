'use client';
import React from 'react';
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CustomButton from '@/utils/ui/button/CustomButton';
import CustomModal from '@/utils/ui/form/CustomModal';
import { importarTrabajadoresDesdeExcel, descargarPlantillaExcel } from '@/utils/excelUtils';
import type { ResultadoImportacion } from '@/utils/excelUtils';
import styles from './ExcelImportSection.module.css';

interface ExcelImportSectionProps {
  establecimientoSeleccionadoValido: boolean;
  agentesCausantes: Array<{ interno: number; codigo: number; agenteCausante: string; agenteTipo: string; displayText: string }>;
  filas: any[];
  cantExpuestos: string;
  cantNoExpuestos: string;
  onFilasActualizadas: (nuevasFilas: any[]) => void;
  onCantExpuestosActualizada: (cant: string) => void;
  onCantNoExpuestosActualizada: (cant: string) => void;
  onMensajeError: (mensaje: string) => void;
}

const ExcelImportSection: React.FC<ExcelImportSectionProps> = ({
  establecimientoSeleccionadoValido,
  agentesCausantes,
  filas,
  cantExpuestos,
  cantNoExpuestos,
  onFilasActualizadas,
  onCantExpuestosActualizada,
  onCantNoExpuestosActualizada,
  onMensajeError,
}) => {
  // Estados para importación de Excel
  const [cargandoExcel, setCargandoExcel] = React.useState<boolean>(false);
  const [mostrarModalImportacion, setMostrarModalImportacion] = React.useState<boolean>(false);
  const [resultadoImportacion, setResultadoImportacion] = React.useState<ResultadoImportacion | null>(null);

  // ===== Funciones para importación de Excel =====
  const handleCargarExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // No limitamos por cantidad ingresada, traemos todo el Excel
    const maxAImportar = 10000;

    setCargandoExcel(true);
    try {
      const resultado = await importarTrabajadoresDesdeExcel(file, maxAImportar);
      
      // Calcular estadísticas del Excel
      const cuilsExpuestos = new Set<string>();
      const cuilsNoExpuestos = new Set<string>();

      resultado.exitosos.forEach(t => {
        const cuilLimpio = t.CUIL?.replace(/\D/g, '');
        if (cuilLimpio) {
          // Clasificar por codigoAgente
          if (t.CodigoAgente === '1') {
            cuilsNoExpuestos.add(cuilLimpio);
          } else {
            cuilsExpuestos.add(cuilLimpio);
          }
        }
      });

      const totalTrabajadores = cuilsExpuestos.size + cuilsNoExpuestos.size;

      // Guardar estadísticas en el resultado
      const resultadoConEstadisticas = {
        ...resultado,
        totalTrabajadores,
        trabajadoresExpuestos: cuilsExpuestos.size,
        trabajadoresNoExpuestos: cuilsNoExpuestos.size
      };

      setResultadoImportacion(resultadoConEstadisticas as any);
      setMostrarModalImportacion(true);
    } catch (error) {
      console.error('Error al importar Excel:', error);
      onMensajeError('Error al leer el archivo Excel. Asegúrate de que sea un archivo válido.');
    } finally {
      setCargandoExcel(false);
      // Limpiar el input para poder cargar el mismo archivo nuevamente
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleConfirmarImportacion = () => {
    if (!resultadoImportacion) return;

    // Agregar los trabajadores exitosos a la tabla con la descripción del agente
    const nuevosTrabajadores = resultadoImportacion.exitosos.map(t => {
      // Buscar la descripción del agente en la lista de agentes cargados
      const agente = agentesCausantes.find((a) => String(a.codigo) === t.CodigoAgente);
      
      return {
        ...t,
        AgenteCausanteDisplay: agente
          ? agente.displayText
          : t.CodigoAgente === '1'
            ? '1 - Sin exposición'
            : t.CodigoAgente
      };
    });

    // Reemplazar completamente las filas con los nuevos trabajadores del Excel
    onFilasActualizadas(nuevosTrabajadores);

    // Opcionalmente actualizar cantidades SOLO si el usuario aún no las cargó
    const expActual = (cantExpuestos ?? '').trim();
    const noExpActual = (cantNoExpuestos ?? '').trim();
    if (expActual === '' && noExpActual === '') {
      const trabajadoresExpuestos = (resultadoImportacion as any).trabajadoresExpuestos || 0;
      const trabajadoresNoExpuestos = (resultadoImportacion as any).trabajadoresNoExpuestos || 0;
      onCantExpuestosActualizada(String(trabajadoresExpuestos));
      onCantNoExpuestosActualizada(String(trabajadoresNoExpuestos));
    }

    // Limpiar modal
    setMostrarModalImportacion(false);
    setResultadoImportacion(null);
  };

  const handleDescargarPlantilla = async () => {
    try {
      await descargarPlantillaExcel();
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      onMensajeError('Error al descargar la plantilla');
    }
  };

  return (
    <>
      {/* SECCIÓN 1.5: IMPORTACIÓN DE TRABAJADORES DESDE EXCEL */}
      <div className={establecimientoSeleccionadoValido ? styles.excelImportContainer : styles.excelImportContainerDisabled}>
        <div className={styles.excelImportHeader}>
          <CloudUploadIcon style={{ fontSize: '28px', color: establecimientoSeleccionadoValido ? '#1565c0' : '#ccc' }} />
          <h4 className={establecimientoSeleccionadoValido ? styles.excelImportTitle : styles.excelImportTitleDisabled}>
            Importar Trabajadores desde Excel
          </h4>
          {!establecimientoSeleccionadoValido && (
            <span className={styles.excelImportSubtitle}>
              (Seleccioná primero un establecimiento)
            </span>
          )}
        </div>
        
        <p className={establecimientoSeleccionadoValido ? styles.excelImportDescription : styles.excelImportDescriptionDisabled}>
          Cargá un archivo Excel con los datos de los trabajadores para importarlos automáticamente. 
          Podés descargar la plantilla para ver el formato requerido.
        </p>
        <p className={establecimientoSeleccionadoValido ? styles.excelImportNote : styles.excelImportNoteDisabled}>
          Nota: la plantilla incluye una fila 3 de ejemplo. Cargá tus datos reales a partir de la fila 4.
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px',
          flexWrap: 'wrap'
        }}>
          <input
            type="file"
            id="upload-excel"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleCargarExcel}
            disabled={cargandoExcel || !establecimientoSeleccionadoValido}
          />
          <CustomButton
            onClick={() => document.getElementById('upload-excel')?.click()}
            disabled={cargandoExcel || !establecimientoSeleccionadoValido}
            style={{
              background: establecimientoSeleccionadoValido ? '#1976d2' : '#cccccc',
              color: 'white',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '4px',
              cursor: establecimientoSeleccionadoValido ? 'pointer' : 'not-allowed'
            }}
          >
            <CloudUploadIcon style={{ fontSize: '18px' }} />
            {cargandoExcel ? 'Cargando...' : 'Seleccionar archivo Excel'}
          </CustomButton>

          <CustomButton
            onClick={handleDescargarPlantilla}
            disabled={!establecimientoSeleccionadoValido}
            style={{
              background: establecimientoSeleccionadoValido ? '#17a2b8' : '#cccccc',
              color: 'white',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '600',
              borderRadius: '4px',
              cursor: establecimientoSeleccionadoValido ? 'pointer' : 'not-allowed'
            }}
          >
            📋 Descargar formato modelo excel
          </CustomButton>
        </div>
      </div>

      {/* MODAL DE RESULTADOS DE IMPORTACIÓN */}
      <CustomModal
        open={mostrarModalImportacion}
        onClose={() => setMostrarModalImportacion(false)}
        title="Resultados de Importación"
        size="large"
      >
        {resultadoImportacion && (
          <div style={{ padding: '20px' }}>
            {/* RESUMEN GENERAL */}
            <div style={{
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Resumen de Importación</h4>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '15px',
                marginTop: '10px'
              }}>
                <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '3px' }}>
                  <div style={{ fontSize: '12px', color: '#1565c0' }}>Total Trabajadores</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1565c0' }}>
                    {(resultadoImportacion as any).totalTrabajadores || 0}
                  </div>
                </div>
                <div style={{ background: '#bbdefb', padding: '10px', borderRadius: '3px' }}>
                  <div style={{ fontSize: '12px', color: '#1565c0' }}>Expuestos</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1565c0' }}>
                    {(resultadoImportacion as any).trabajadoresExpuestos || 0}
                  </div>
                </div>
                <div style={{ background: '#ffe0b2', padding: '10px', borderRadius: '3px' }}>
                  <div style={{ fontSize: '12px', color: '#e65100' }}>No Expuestos</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e65100' }}>
                    {(resultadoImportacion as any).trabajadoresNoExpuestos || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* TRABAJADORES EXITOSOS */}
            {resultadoImportacion.exitosos.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>
                  ✓ Registros Cargados Correctamente
                </h4>
                <div style={{
                  background: '#f1f8e9',
                  padding: '10px',
                  borderRadius: '3px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #c5e1a5'
                }}>
                  <ul style={{ margin: '0', paddingLeft: '20px' }}>
                    {resultadoImportacion.exitosos.map((t, i) => (
                      <li key={i} style={{ marginBottom: '5px', color: '#333' }}>
                        {t.CUIL} - {t.Nombre}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ERRORES */}
            {resultadoImportacion.errores.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>
                  ✗ Errores en la Importación
                </h4>
                <div style={{
                  background: '#ffebee',
                  padding: '10px',
                  borderRadius: '3px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #ef9a9a'
                }}>
                  {resultadoImportacion.errores.map((error, i) => (
                    <div key={i} style={{
                      marginBottom: '10px',
                      paddingBottom: '10px',
                      borderBottom: i < resultadoImportacion.errores.length - 1 ? '1px solid #ffcdd2' : 'none'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#d32f2f' }}>
                        Fila {error.fila} - CUIL: {error.cuil}
                      </div>
                      <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', color: '#c62828' }}>
                        {error.errores.map((err, j) => (
                          <li key={j} style={{ fontSize: '13px' }}>
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              marginTop: '20px'
            }}>
              {resultadoImportacion.exitosos.length > 0 && (
                <CustomButton
                  onClick={handleConfirmarImportacion}
                  style={{
                    background: '#4caf50',
                    color: 'white',
                    padding: '10px 20px'
                  }}
                >
                  Confirmar Carga ({resultadoImportacion.exitosos.length} registros)
                </CustomButton>
              )}
              <CustomButton
                onClick={() => setMostrarModalImportacion(false)}
                style={{
                  background: '#757575',
                  color: 'white',
                  padding: '10px 20px'
                }}
              >
                Cerrar
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>
    </>
  );
};

export default ExcelImportSection;
