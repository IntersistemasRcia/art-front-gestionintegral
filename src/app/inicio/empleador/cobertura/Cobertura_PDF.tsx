'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import styles from './cobertura.module.css';
import Image from 'next/image';
import Formato from '@/utils/Formato';
import ArtAPI from '@/data/artAPI';
import useSWR from 'swr';

type CoberturaPDFProps = {
  poliza?: any;
  open: boolean;
  handleVentanaImpresion: (open: boolean) => void;
  presentadoA: string;
  dia?: string;
  hora?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  clausula?: boolean;
  nominasSeleccionadas?: Array<{ cuil?: string | number; nombreEmpleador?: string }>;
  cuitEmpresa?: number;
};

export default function Cobertura_PDF(props: CoberturaPDFProps) {
  const {
    poliza,
    open,
    handleVentanaImpresion,
    presentadoA,
    dia,
    hora,
    fechaDesde,
    fechaHasta,
    clausula,
    nominasSeleccionadas,
    cuitEmpresa,
  } = props;

  // refs separados: primero el certificado (pagina 1), luego el resto (pagina 2+)
  const firstRef = useRef<HTMLDivElement | null>(null);
  const restRef = useRef<(HTMLDivElement | null)[]>([]);
  const generatedRef = useRef(false);

  const nominaChunks = useMemo(() => {
    const rowsPerPage = 32;
    const source = nominasSeleccionadas ?? [];
    if (source.length === 0) return [source];

    const chunks: Array<Array<{ cuil?: string | number; nombreEmpleador?: string }>> = [];
    for (let i = 0; i < source.length; i += rowsPerPage) {
      chunks.push(source.slice(i, i + rowsPerPage));
    }
    return chunks;
  }, [nominasSeleccionadas]);

  const { data: empresaByCuit } = useSWR(
    cuitEmpresa ? ['empresaByCuit', cuitEmpresa] : null,
    () => ArtAPI.getEmpresaByCUIT({ CUIT: cuitEmpresa })
  );

  const cp = empresaByCuit?.codLocalidadPostal;
  const { data: localidadesData } = useSWR(
    cp ? ['localidadesByCP', cp] : null,
    () => ArtAPI.getLocalidadesbyCP({ CodPostal: cp })
  );
  const litProvincia = Array.isArray(localidadesData) && localidadesData.length > 0
    ? localidadesData[0].litProvincia
    : '';

  // Acepta poliza como array o como objeto
  const p = Array.isArray(poliza) ? poliza[0] : poliza ?? {};

  // Destinatario para la cláusula: usar el valor ingresado en el formulario si existe
  const destinatarioEnClausula = presentadoA?.trim() ? presentadoA : 'A quien corresponda';

  useEffect(() => {
    if (!open) {
      generatedRef.current = false;
      return;
    }

    if (!empresaByCuit) return;
    if (cp && !localidadesData) return;

    if (generatedRef.current) return;
    generatedRef.current = true;

    const generate = async () => {
      try {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        // validar refs
        if (!firstRef.current) throw new Error('No content to render');

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4',
        });

        // escala para mejorar calidad (ajusta si el PDF pesa mucho)
        const scale = 3;
        const jpegQuality = 0.85;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const footerReservedHeight = 56;
        const printableHeight = pageHeight - footerReservedHeight;

        const renderBlockWithPagination = async (element: HTMLDivElement, startOnNewPage: boolean) => {
          const canvas = await html2canvas(element, {
            scale,
            useCORS: true,
            allowTaint: false,
            logging: false,
          });

          const imgWidth = pageWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          const imgData = canvas.toDataURL('image/jpeg', jpegQuality);

          let renderedHeight = 0;
          let firstSlice = true;

          while (renderedHeight < imgHeight - 0.1) {
            if (startOnNewPage || !firstSlice) {
              pdf.addPage();
            }

            pdf.addImage(imgData, 'JPEG', 0, -renderedHeight, imgWidth, imgHeight);
            renderedHeight += printableHeight;
            firstSlice = false;
            startOnNewPage = false;
          }
        };

        // Render primer bloque (certificado)
        if (firstRef.current) {
          await renderBlockWithPagination(firstRef.current, false);
        }

        // Render páginas de nómina (cada bloque empieza en página nueva)
        const nominaRefs = restRef.current.filter((element): element is HTMLDivElement => element !== null);
        for (const pageElement of nominaRefs) {
          await renderBlockWithPagination(pageElement, true);
        }

        // Pie de página en todas las páginas
        const footerLines = [
          'San Martin 588 - Piso 5to. - (1004) Capital Federal - Bs As. - Argentina - Tel: 0800-333-2786',
          'Mail: atencion.clientes@artmutualrural.org.ar',
        ];
        const pageCount = pdf.getNumberOfPages();
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, printableHeight, pageWidth, footerReservedHeight, 'F');
          pdf.setDrawColor(200);
          pdf.line(30, pageHeight - 42, pageWidth - 30, pageHeight - 42);
          pdf.text(footerLines, pageWidth / 2, pageHeight - 28, { align: 'center' });
        }

        pdf.save('CertificadoDeCobertura.pdf');
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error generando PDF de Cobertura:', err);
      } finally {
        handleVentanaImpresion(false);
      }
    };

    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresaByCuit, localidadesData]);

  return (
    // off-screen wrapper: dos bloques separados para forzar que la tabla quede en bloques distintos
    <div style={{ position: 'fixed', left: -9999, top: -9999, width: '210mm' }}>
      <div ref={firstRef} className={styles.pdfContainer}>
        {/* Cabecera: fecha alineada a la derecha */}
        <div className={styles.pdfHeader}>
          <div className={styles.pdfLogo}>
            <Image src="/icons/LogoTexto.svg" alt="Logo" width={130} height={130} />

          </div>

          <div className={styles.pdfLugarFecha}>Ciudad Autónoma de Buenos Aires, {dia ?? ''}</div>
        </div>

        {/* Página 1: certificado */}
        <div className={styles.pdfBody}>
          <div className={styles.pdfTitle}>CERTIFICADO DE COBERTURA</div>

          <div className={styles.pdfSection}>
            <strong>Para ser presentado a: {presentadoA || ''}</strong>
          </div>

          <div className={styles.pdfBody2}>
            <div className={styles.pdfSection}>
              <div>
                Por intermedio del presente <strong>CERTIFICAMOS</strong> que la empresa bajo la denominación de{' '}
                <strong>{p.empleadorDenominacion ?? ''}</strong> con N° de CUIT:{' '}
                <strong>{p.cuit ?? ''}</strong> ha contratado la cobertura de <strong>ART MUTUAL RURAL DE SEGUROS DE RIESGOS DEL TRABAJO</strong>,
                según los términos de la Ley Nro. 24.557 por lo que el personal declarado oportunamente por el/la mencionado/a se encuentra <strong> cubierto a partir del{' '}
                {Formato.Fecha(p?.vigenciaDesde) || ""} hasta el {Formato.Fecha(p?.vigenciaHasta) || ""}.</strong>
              </div>
            </div>

            <div className={styles.pdfSection}>El N° del contrato es el: <strong>{p.numero ?? ''}</strong>.</div>

          {clausula && (
              <>
                <div className={styles.pdfSection} style={{ lineHeight: 1.4 }}>
                  Consta por la presente que <strong>ART MUTUAL RURAL DE SEGUROS DE RIESGOS DEL TRABAJO</strong>, renuncia en forma expresa a reclamar o iniciar toda acción de
                  repetición o de regreso contra: {destinatarioEnClausula}, sus funcionarios, empleados u obreros; sea con fundamento en el art. 39, ap. 5, de la Ley
                  N° 24.557, sea en cualquier otra norma jurídica, con motivo de las prestaciones en especie o dinerarias que se vea obligada a abonar, contratar
                  u otorgar al personal dependiente o ex dependiente de <strong>{p.empleadorDenominacion ?? ''}</strong>, amparados por la cobertura del Contrato de
                  Afiliación N° <strong>{p.numero ?? ''}</strong>, por accidentes del trabajo o enfermedades profesionales, ocurridos o contraídos por el hecho
                  o en ocasión del trabajo. Esta <strong>Cláusula de no repetición</strong> cesará en sus efectos si el empresario comitente a favor de quien
                  se emite, no cumple estrictamente con las medidas de prevención e higiene y seguridad en el trabajo, o de cualquier manera infringe la Ley
                  N° 19.587, su Decreto Reglamentario N° 351/79 y las normativas que sobre el particular ha dictado la Superintendencia de Riesgos del Trabajo.
                </div>

                <div className={styles.pdfSection}>
                  Fuera de las causales que expresamente prevé la normativa vigente, el contrato de afiliación no podrá ser modificado o enmendado sin previa
                  notificación fehaciente a quien corresponda, en un plazo no inferior a quince (15) días corridos.
                </div>
              </>
            )}
            
             <div className={styles.pdfSection}>
                Se deja constancia por la presente que la empresa de referencia se encuentra asegurada en <strong>ART MUTUAL RURAL DE SEGUROS DE RIESGOS DEL TRABAJO</strong>.
                El presente certificado tiene una validez de 30 días corridos a partir de la fecha de emisión. En ningún caso ART MUTUAL RURAL DE SEGUROS DE RIESGOS
                DEL TRABAJO será responsable de las consecuencias del uso del certificado una vez vencido el plazo de validez.
            </div>
            <br/>
            <div className={styles.pdfSection}>
                Sin otro particular, saludo a Ud. muy atentamente.
            </div>
            <div className={styles.signatureSection}>
              <div className={styles.signatureLine}>
                <Image src="/images/FirmaFernanda.png" alt="Firma de Fernanda Lassalle" width={170} height={200} priority />
              </div>
              <p className={styles.signatureText}>
                Cdra. Ma. Fernanda Lassalle
                <br />
                Gerente de Administración
              </p>
            </div>
            {nominasSeleccionadas && nominasSeleccionadas.length > 0 && (
              <div className={styles.pdfSection}>Se adjunta Nómina de Personal.</div>
            )}
          </div>
        </div>
      </div>

      {nominaChunks.map((chunk, pageIndex) => (
        <div
          key={`nomina-page-${pageIndex}`}
          ref={(element) => {
            restRef.current[pageIndex] = element;
          }}
          className={styles.pdfContainer}
        >
          <div className={styles.pdfHeader}>
            <div className={styles.pdfLogo}>
              <Image src="/icons/LogoTexto.svg" alt="Logo" width={130} height={130} />
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
              <div>Ciudad Autónoma de Buenos Aires,</div>
              <div>Fecha: {dia ?? ''}</div>
              <div>Hora: {hora ?? ''}</div>
              <div>Página: {pageIndex + 2}</div>
            </div>
          </div>

          <div className={styles.pdfSecondPage}>
            <h3>Nómina de Personal a la Fecha</h3>

            <div className={styles.pdfPolicyInfo}>
              <div>Razón Social: {empresaByCuit?.razonSocial ?? ''}</div>
              <div>CUIT: {empresaByCuit?.cuit ?? ''}</div>
              <div>Calle: {[empresaByCuit?.domicilioCalle, empresaByCuit?.domicilioNro].filter(Boolean).join(' ')}</div>
              <div>Localidad: {litProvincia} - CP: {empresaByCuit?.codLocalidadPostal ?? ''}</div>
              <div>Nro.Contrato: {p.numero ?? ''}</div>
              <div>Ciiu Rev. 4: {empresaByCuit?.ciiu ?? ''}</div>
            </div>

            <table className={styles.pdfTable}>
              <thead>
                <tr>
                  <th>CUIL</th>
                  <th>Apellido y Nombre</th>
                </tr>
              </thead>
              <tbody>
                {chunk.map((n, i) => (
                  <tr key={`${pageIndex}-${i}`}>
                    <td>{n.cuil ?? ''}</td>
                    <td>{n.nombreEmpleador ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}