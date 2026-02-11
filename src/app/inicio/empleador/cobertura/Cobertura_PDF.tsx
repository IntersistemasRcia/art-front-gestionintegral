'use client';

import React, { useEffect, useRef } from 'react';
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
  const restRef = useRef<HTMLDivElement | null>(null);
  const generatedRef = useRef(false);

  const { data: empresaByCuit } = useSWR(
    cuitEmpresa ? ['empresaByCuit', cuitEmpresa] : null,
    () => ArtAPI.getEmpresaByCUIT({ CUIT: cuitEmpresa })
  );

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

    if (generatedRef.current) return;
    generatedRef.current = true;

    const generate = async () => {
      try {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        // validar refs
        if (!firstRef.current && !restRef.current) throw new Error('No content to render');

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4',
        });

        // escala para mejorar calidad (ajusta si el PDF pesa mucho)
        const scale = 3;
        const jpegQuality = 0.85;

        // Render primer bloque (certificado)
        if (firstRef.current) {
          const canvas1 = await html2canvas(firstRef.current, {
            scale,
            useCORS: true,
            allowTaint: false,
            logging: false,
          });
          // Añadir canvas1 como primera página (no crear página extra)
          const pageWidth = pdf.internal.pageSize.getWidth();
          const imgWidth = pageWidth;
          const imgHeight = (canvas1.height * imgWidth) / canvas1.width;
          // usar JPEG en lugar de PNG para contenido (mejor compresión)
          const imgData1 = canvas1.toDataURL('image/jpeg', jpegQuality);
          pdf.addImage(imgData1, 'JPEG', 0, 0, imgWidth, imgHeight);

          // Si canvas1 ocupa más de una página, agregar las siguientes porciones
          let heightLeft1 = imgHeight - pdf.internal.pageSize.getHeight();
          while (heightLeft1 > -0.1) {
            pdf.addPage();
            pdf.addImage(imgData1, 'PNG', 0, -(imgHeight - pdf.internal.pageSize.getHeight() - heightLeft1), imgWidth, imgHeight);
            heightLeft1 -= pdf.internal.pageSize.getHeight();
          }
        }

        // Render resto (páginas siguientes: póliza + tabla)
        if (restRef.current) {
          const canvas2 = await html2canvas(restRef.current, {
            scale,
            useCORS: true,
            allowTaint: false,
            logging: false,
          });

          const pageWidth = pdf.internal.pageSize.getWidth();
          const imgWidth = pageWidth;
          const imgHeight = (canvas2.height * imgWidth) / canvas2.width;
          const imgData2 = canvas2.toDataURL('image/jpeg', jpegQuality);

          // Si el primer contenido ya ocupó todo, la siguiente adición debe ser nueva página
          // Añadimos canvas2 y lo fragmentamos en páginas según altura
          let heightLeft = imgHeight;
          let position = 0;

          // Añadimos primer trozo de canvas2 en nueva(s) página(s)
          pdf.addPage();
          pdf.addImage(imgData2, 'JPEG', 0, 0, imgWidth, imgHeight);
          heightLeft -= pdf.internal.pageSize.getHeight();

          while (heightLeft > -0.1) {
            pdf.addPage();
            // posicion negativa para desplazar la imagen y mostrar la siguiente porción
            pdf.addImage(imgData2, 'JPEG', 0, -(imgHeight - pdf.internal.pageSize.getHeight() - heightLeft), imgWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
          }
        }

        // Pie de página en todas las páginas
        const footerLines = [
          'San Martin 588 - Piso 5to. - (1004) Capital Federal - Bs As. - Argentina - Tel: 0800-333-2786',
          'Mail: atencion.clientes@artmutualrural.org.ar',
        ];
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageCount = pdf.getNumberOfPages();
        pdf.setFontSize(8);
        pdf.setTextColor(120);
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
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
  }, [open, empresaByCuit]);

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
                <strong>{p.empleador_Denominacion ?? ''}</strong> con N° de CUIT:{' '}
                <strong>{p.cuit ?? ''}</strong> ha contratado la cobertura de <strong>ART MUTUAL RURAL DE SEGUROS DE RIESGOS DEL TRABAJO</strong>,
                según los términos de la Ley Nro. 24.557 por lo que el personal declarado oportunamente por el/la mencionado/a se encuentra <strong> cubierto a partir del{' '}
                {Formato.Fecha(p?.vigencia_Desde) || ""} hasta el {Formato.Fecha(p?.vigencia_Hasta) || ""}.</strong>
              </div>
            </div>

            {clausula && (
              <>
                <div className={styles.pdfSection}>El N° del contrato es el <strong>{p.numero ?? ''}</strong>.</div>

                <div className={styles.pdfSection} style={{ lineHeight: 1.4 }}>
                  Consta por la presente que <strong>ART MUTUAL RURAL DE SEGUROS DE RIESGOS DEL TRABAJO</strong>, renuncia en forma expresa a reclamar o iniciar toda acción de
                  repetición o de regreso contra: {destinatarioEnClausula}, sus funcionarios, empleados u obreros; sea con fundamento en el art. 39, ap. 5, de la Ley
                  N° 24.557, sea en cualquier otra norma jurídica, con motivo de las prestaciones en especie o dinerarias que se vea obligada a abonar, contratar
                  u otorgar al personal dependiente o ex dependiente de <strong>{p.empleador_Denominacion ?? ''}</strong>, amparados por la cobertura del Contrato de
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
            <br/>
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
          </div>
        </div>
      </div>

      {/* Bloque separado que se renderiza en páginas posteriores */}
      <div ref={restRef} className={styles.pdfContainer}>
        <div className={styles.pdfHeader}>
          <div className={styles.pdfLogo}>
            <Image src="/icons/LogoTexto.svg" alt="Logo" width={130} height={130} />
          </div>
          <div className={styles.pdfLugarFecha}>Ciudad Autónoma de Buenos Aires, {dia ?? ''}</div>
        </div>

        <div className={styles.pdfSecondPage}>
          <h3>Nómina de Personal a la Fecha</h3>

          <div className={styles.pdfPolicyInfo}>
            <div>Razón Social: {empresaByCuit?.razonSocial ?? ''}</div>
            <div>CUIT: {empresaByCuit?.cuit ?? ''}</div>
            <div>
              Calle: {empresaByCuit?.domicilioCalle ?? ''}
            </div>
            <div>
              CP: {empresaByCuit?.codLocalidadPostal ?? ''}
            </div>
            <div>Nro.Contrato: {empresaByCuit?.contratoNro ?? ''}</div>
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
              {(nominasSeleccionadas ?? []).map((n, i) => (
                <tr key={i}>
                  <td>{n.cuil ?? ''}</td>
                  <td>{n.nombreEmpleador ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}