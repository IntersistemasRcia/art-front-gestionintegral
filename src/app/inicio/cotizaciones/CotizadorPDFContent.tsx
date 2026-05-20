"use client";

import React from 'react';
import Formato from '@/utils/Formato';
import styles from './cotizadorPDF.module.css';
import { CotizadorPDFContentProps } from './types';

// Lista de servicios online del sistema ART Mutual Rural
const SERVICIOS_ONLINE = [
  'ASISTENCIA MÉDICA 24HS - 0800 CECAP EMERGENCIA',
  'DESCARGAS DE FORMULARIOS GENERALES',
  'PRESTACIONES DINERARIAS',
  'CREDENCIALES FÍSICAS PARA EL AFILIADO',
  'CERTIFICADOS DE COBERTURA (GENERAL - CON NOMINA - NO REPETICIÓN)',
  'ATENCIÓN PERSONALIZADA PARA SU AFILIADO',
  'PRESTADORES A NIVEL PAÍS (HOSPITALES/SANATORIOS/ORTOPEDIAS/KTM/FARMACIAS)',
  'INFORMACIÓN ACTUALIZADA DEL DIAGNÓSTICO DEL SINIESTRO',
  'PREVENCIÓN ESPECIALIZADA DEL SECTOR AGROPECUARIO -RGRL/RAR - EXÁMENES PERIÓDICOS',
  'CONFIRMACIÓN DE ALTAS MÉDICAS Y CONSULTA DE RETORNO LABORAL',
  'REINTEGROS DE ILT',
  'SERVICIO DE TELEMEDICINA PARA EL SEGUIMIENTO',
  'RED DE TRASLADOS A NIVEL PAÍS',
] as const;

// Función helper para formatear importe sin símbolo de moneda (solo números con formato argentino)
// Formato: separador de miles con punto, separador decimal con coma (ej: 1.234.567,89)
const formatearImporteArgentino = (valor: number): string => {
  if (isNaN(valor)) return String(valor);
  
  // Convertir a string con 2 decimales
  const valorStr = valor.toFixed(2);
  
  // Separar parte entera y decimal
  const [parteEntera, parteDecimal] = valorStr.split('.');
  
  // Agregar puntos como separadores de miles a la parte entera
  const parteEnteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Unir parte entera y decimal con coma
  return `${parteEnteraFormateada},${parteDecimal}`;
};

// Función helper para formatear alícuota con 2 decimales
const formatearAlicuota = (valor: number): string => {
  if (isNaN(valor)) return String(valor);
  return valor.toFixed(2);
};

// Calcula los costos y ahorros de una cotización
const calcularCostosYAhorros = (
  masaSalarial: number,
  alicuotaIngresada: number,
  alicuotaFinal: number
) => {
  const costoMensualActual = masaSalarial * (alicuotaIngresada / 100);
  const costoMensualNuevo = masaSalarial * (alicuotaFinal / 100);
  const costoAnualActual = costoMensualActual * 13;
  const costoAnualNuevo = costoMensualNuevo * 13;
  const ahorroMensual = costoMensualActual - costoMensualNuevo;
  const ahorroAnual = costoAnualActual - costoAnualNuevo;

  return {
    costoMensualActual,
    costoMensualNuevo,
    costoAnualActual,
    costoAnualNuevo,
    ahorroMensual,
    ahorroAnual,
  };
};

export const CotizadorPDFContent = ({
  resultado,
  formData,
  actividadesCIIU,
  artSellosIIBB,
  empleadoresPadron,
  ffepImporte = 1227,
}: CotizadorPDFContentProps) => {
  const ciiuActividad = actividadesCIIU?.find(
    (e) => e.ciiu === resultado.ciiuCotizacion
  );

  const masaSalarialNum = parseFloat(formData.masaSalarial) || 0;
  const alicuotaIngresadaNum = parseFloat(formData.alicuota) || 0;
  const alicuotaFinalNum = resultado.alicuotaFinal || 0;

  const {
    costoMensualActual,
    costoMensualNuevo,
    costoAnualActual,
    costoAnualNuevo,
    ahorroMensual,
    ahorroAnual,
  } = calcularCostosYAhorros(masaSalarialNum, alicuotaIngresadaNum, alicuotaFinalNum);

  const razonSocial = empleadoresPadron?.denominacion || formData.nombre;

  return (
    <div className={styles.pdfContainer}>
      {/* Cabecera con Logo */}
      <div className={styles.cabecera}>
        <img src="/icons/LogoTexto.png" alt="ART Mutual Rural" className={styles.logo} />
      </div>

      {/* Información Principal */}
      <div className={styles.infoPrincipal}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Razón Social</span>
          <span className={styles.infoValue}>{razonSocial}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>CUIT</span>
          <span className={styles.infoValue}>{Formato.CUIP(resultado.cuit)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Cant. de personal</span>
          <span className={styles.infoValue}>{formData.trabajadoresDeclarados}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Masa Salarial</span>
          <span className={styles.infoValue}>$ {formatearImporteArgentino(masaSalarialNum)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>CIIU</span>
          <span className={styles.infoValue}>
            {ciiuActividad ? `${ciiuActividad.ciiu} - ${ciiuActividad.descripcion}` : resultado.ciiuCotizacion}
          </span>
        </div>
      </div>

      {/* Comparación de Alícuotas */}
      <table className={styles.comparacionTable}>
        <thead>
          <tr>
            <th className={styles.columnaVacia}></th>
            <th className={styles.columnaTitulo}>ART ACTUAL ALICUOTA</th>
            <th className={styles.columnaTituloNaranja}>ART RURAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={styles.columnaLabel}>Alicuota Variable</td>
            <td className={styles.columnaValor}>{formatearAlicuota(alicuotaIngresadaNum)} %</td>
            <td className={`${styles.columnaValor} ${styles.columnaValorBold}`}>{formatearAlicuota(alicuotaFinalNum)} %</td>
          </tr>
          <tr>
            <td className={styles.columnaLabel}>Costo Mensual</td>
            <td className={styles.columnaValor}>$ {formatearImporteArgentino(costoMensualActual)}</td>
            <td className={`${styles.columnaValor} ${styles.columnaValorBold}`}>$ {formatearImporteArgentino(costoMensualNuevo)}</td>
          </tr>
          <tr>
            <td className={styles.columnaLabel}>Costo Anual</td>
            <td className={styles.columnaValor}>$ {formatearImporteArgentino(costoAnualActual)}</td>
            <td className={`${styles.columnaValor} ${styles.columnaValorBold}`}>$ {formatearImporteArgentino(costoAnualNuevo)}</td>
          </tr>
        </tbody>
      </table>

      {/* Nota sobre FFEP */}
      <div className={styles.notaFFEP}>
        Las tarifas NO INCLUYEN la Obligación impuesta por el DECR. 590/97 (${formatearImporteArgentino(ffepImporte)}.- por dependiente destinado al FONDO PARA FINES ESPECIFICOS) - Validez de Propuesta 30 días de vigencia. (Sujeto a ultimo F931 presentado en AFIP)
      </div>

      {/* Ahorro */}
      <div className={styles.ahorro}>
        <div className={styles.ahorroFila}>
          <span className={styles.ahorroLabel}>AHORRO MENSUAL</span>
          <span className={styles.ahorroValor}>$ {formatearImporteArgentino(ahorroMensual)}</span>
        </div>
        <div className={styles.ahorroDivider}></div>
        <div className={styles.ahorroFila}>
          <span className={styles.ahorroLabel}>AHORRO ANUAL</span>
          <span className={styles.ahorroValor}>$ {formatearImporteArgentino(ahorroAnual)}</span>
        </div>
      </div>

      {/* Mensaje de Ahorro */}
      <div className={styles.mensajeAhorro}>
        <strong>ART Mutual Rural, les presenta un ahorro más que importante para vuestra empresa, el cual se calcula multiplicando la masa salarial por la alícuota, y esto por 13 (12 meses y aguinaldo).</strong>
      </div>

      {/* Servicios Online */}
      <div className={styles.serviciosTitulo}>SERVICIOS ONLINE SISTEMA ART MUTUAL RURAL</div>
      <table className={styles.serviciosTable}>
        <tbody>
          {SERVICIOS_ONLINE.map((servicio, index) => (
            <tr key={index} className={styles.servicioRow}>
              <td className={styles.servicioNombre}>{servicio}</td>
              <td className={styles.servicioIncluido}>Incluído</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerWeb}>artmutualrural.org.ar</div>
        <div className={styles.footerInfo}>
          <span>www.argentina.gob.ar/srt</span>
          <span>0800-666-6778</span>
          <img src="/icons/SRT.png" alt="SRT" className={styles.footerLogo} />
        </div>
      </div>
    </div>
  );
};

