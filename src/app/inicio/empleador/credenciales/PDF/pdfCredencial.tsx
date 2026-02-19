"use client";

import { jsPDF } from "jspdf";
import Formato from '@/utils/Formato';
import type {
  CredencialPdfInput,
} from "../types/pdf";

function sanitize(text: unknown): string {
  if (text === null || text === undefined) return "";
  return String(text).replace(/\s+$/g, "");
}

async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`No se pudo cargar imagen: ${url} (${res.status})`);
  }
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Error leyendo blob de ${url}`));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function addLabelValue(
  pdf: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string,
  maxWidthMm: number
) {
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(8);
  pdf.text(label, x, y);

  const labelWidth = pdf.getTextWidth(label);
  const valueX = x + labelWidth + 1.5;

  const valueSafe = value || "-";
  pdf.setFillColor(229, 230, 230);
  const boxPaddingX = 1.2;
  const boxPaddingY = 2.2;
  const valueWidth = Math.min(pdf.getTextWidth(valueSafe) + boxPaddingX * 2, maxWidthMm);

  pdf.roundedRect(valueX - boxPaddingX, y - boxPaddingY, valueWidth, 4.8, 1.6, 1.6, "F");
  pdf.text(valueSafe, valueX, y);
}

export async function buildCredencialPdf(input: CredencialPdfInput): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const afiliado = input.afiliado ?? {};
  const poliza0 = (input.poliza && input.poliza.length > 0 ? input.poliza[0] : undefined) ?? {};
  const assets = input.assets ?? {};
  let hadError = false;

  const pageW = pdf.internal.pageSize.getWidth();

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);

  // reducir margen lateral para hacer la tarjeta más ancha
  const credX = 2;
  const credY = 20;
  const credW = pageW - 4;
  const credH = 80;

  pdf.setDrawColor(0);
  pdf.setLineWidth(0.3);
  pdf.setLineDashPattern([1.2, 1.2], 0);
  pdf.rect(credX, credY, credW, credH);
  pdf.setLineDashPattern([], 0);

  // Texto "DOBLAR AQUI" pegado a la línea punteada, centrado
  pdf.setFontSize(8);
  pdf.setTextColor(0, 0, 0);
  pdf.text("DOBLAR AQUI", credX + credW / 2, credY - 1, { align: "center" });

  const halfW = credW / 2;
  const frontX = credX;
  const frontY = credY;
  const backX = credX + halfW;
  const backY = credY;
  // Alinear la parte verde con la parte superior de la imagen izquierda
  const headerTop = frontY + 1;

  // Frente
  const frontUrl = assets.frontImageUrl ?? "/images/frente_Credencial.png";
  const frontDataUrl = await urlToDataUrl(frontUrl);
  // Ocupar toda la mitad izquierda únicamente con la imagen
  pdf.addImage(frontDataUrl, "PNG", frontX + 1, frontY + 1, halfW - 2, credH - 2);

  // Dorso - cabecera (alineada con la imagen izquierda)
  const headerH = 34;
  pdf.setFillColor(0, 128, 0);
  pdf.rect(backX, headerTop, halfW, headerH, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.text("COMO ACTUAR FRENTE A UN ACCIDENTE DE TRABAJO", backX + 3, headerTop + 6, {
    maxWidth: halfW - 6,
  });

  // aumentar tamaño y separación de las líneas del bloque verde
  pdf.setFontSize(7);
  const bulletX = backX + 4;
  let lineY = headerTop + 11;
  pdf.text("1. COMUNIQUESE AL 0800-333-6888", bulletX, lineY);
  lineY += 4;
  pdf.text("2. INFORME DEL ACCIDENTE INMEDIATAMENTE AL EMPLEADOR", bulletX, lineY, {
    maxWidth: halfW - 6,
  });
  lineY += 4.2;
  pdf.text("3. NO OLVIDE LLEVAR ESTA CREDENCIAL CONSIGO EN TODO MOMENTO", bulletX, lineY, {
    maxWidth: halfW - 6,
  });
  lineY += 4.5;
  pdf.setFontSize(6);
  pdf.text(
    "Esta tarjeta es personal e intransferible para uso exclusivo del titular y emitida a solo efecto informativo.",
    bulletX,
    lineY,
    { maxWidth: halfW - 6 }
  );
  lineY += 6;
  pdf.text(
    "Para cualquier otra información, comuniquese al Centro de Atención al Cliente 0800 333 6888 (MUTUART).",
    bulletX,
    lineY,
    { maxWidth: halfW - 6 }
  );

  // Dorso - cuerpo (posicionado respecto a headerTop)
  const bodyY = headerTop + headerH + 3;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(8);

  const leftColX = backX + 4;
  // subir un poco los campos y reducir el interlineado
  let rowY = bodyY + 1;
  const maxValueWidth = halfW - 22; // dejamos espacio para el QR

  addLabelValue(pdf, leftColX, rowY, "NOMBRE:", sanitize(afiliado.NombreEmpleado), maxValueWidth);
  rowY += 5;
  addLabelValue(pdf, leftColX, rowY, "CUIL:", sanitize(Formato.CUIP(afiliado.CUIL)), maxValueWidth);
  rowY += 5;
  addLabelValue(
    pdf,
    leftColX,
    rowY,
    "EMPRESA:",
    sanitize(poliza0.empleador_Denominacion),
    maxValueWidth
  );
  rowY += 5;
  addLabelValue(pdf, leftColX, rowY, "CUIT:", sanitize(poliza0.cuit), maxValueWidth);
  rowY += 5;
  addLabelValue(pdf, leftColX, rowY, "N° DE CONTRATO:", sanitize(poliza0.numero), maxValueWidth);

  // QR (opcional)
  if (assets.qrImageUrl) {
    try {
      const qrDataUrl = await urlToDataUrl(assets.qrImageUrl);
      const qrSize = 18;
      pdf.addImage(qrDataUrl, "PNG", backX + halfW - qrSize - 4, bodyY + 2, qrSize, qrSize);
    } catch {
      hadError = true;
      // sin QR si no carga
    }
  }

  // Alinear el pie derecho con el final de la imagen izquierda
  const imageBottom = frontY + credH - 1; // bottom de la imagen (frontY+1 + credH-2)
  const footerY = imageBottom - 6;
  pdf.setFontSize(7);
  pdf.setTextColor(0, 0, 0);
  pdf.text("www.argentina.gob.ar/srt", backX + 4, footerY);
  pdf.text("0800-666-6778", backX + 4, footerY + 4.5);

  const srtUrl = assets.srtImageUrl ?? "/icons/SRT.png";
  try {
    // Agregar solo el QR encima del logo, dejando el logo SRT en su posición/size original
    try {
      // coordenadas y tamaños para logo SRT y QR (declaradas aquí para alcance)
      const srtW = 20; // ancho un poco mayor (aumentado 2mm)
      const srtH = 8;  // altura rectangular
      const srtX = backX + halfW - srtW - 4; // posicionar a la derecha con pequeño margen
      const srtY = footerY - 2; // mover logo SRT 4mm hacia abajo (solo el logo)
      const qrSize = 16; // ajustar QR para no sobresalir
      const qrX = srtX + (srtW - qrSize) / 2; // centrar QR sobre el logo
      const qrY = srtY - qrSize - 14;

      // intentar agregar QR encima (si existe)
      try {
        const qrAboveUrl = "/images/qr.png";
        const qrAboveDataUrl = await urlToDataUrl(qrAboveUrl);
        pdf.addImage(qrAboveDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
      } catch {
        // si no carga el QR, continuar
      }

      // agregar logo SRT en su tamaño/posición ajustada
      const srtDataUrl = await urlToDataUrl(srtUrl);
      pdf.addImage(srtDataUrl, "PNG", srtX, srtY, srtW, srtH);
      } catch (e) {
        hadError = true;
        console.error('Error añadiendo logo SRT o QR:', e);
        // sin logo SRT si no carga
      }
  } catch (e) {
    hadError = true;
    console.error('Error procesando logo SRT:', e);
    // sin logo SRT si no carga
  }

  if (hadError) {
    throw new Error('No se pudo descargar la credencial, por favor vuelva a intentar');
  }

  return pdf;
}

export async function downloadCredencialPdf(input: CredencialPdfInput) {
  const pdf = await buildCredencialPdf(input);
  const cuil = sanitize(input.afiliado?.CUIL) || "credencial";
  const fileName = input.fileName ?? `credencial_${cuil}.pdf`;
  pdf.save(fileName);
}
