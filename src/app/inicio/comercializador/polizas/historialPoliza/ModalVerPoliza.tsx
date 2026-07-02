"use client";

import { TextField } from "@mui/material";
import CustomModal from "@/utils/ui/form/CustomModal";
import CustomButton from "@/utils/ui/button/CustomButton";
import SrtAPI from "@/data/srtAPI";
import Formato from "@/utils/Formato";
import styles from "./modalVerPoliza.module.css";

type Props = {
  historialId: number | null;
  onClose: () => void;
};

export default function ModalVerPoliza({ historialId, onClose }: Props) {
  const { data: poliza, isLoading } = SrtAPI.useGetSRTComercializadoresHistorialById(historialId ?? undefined);

  const field = (label: string, value: string | number | null | undefined, className?: string) => (
    <TextField
      label={label}
      value={value ?? ""}
      disabled
      className={className}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );

  const titulo = poliza
    ? `Histo: ${(poliza as any).numero} - Fecha: ${Formato.Fecha((poliza as any).vigenciaHasta)}`
    : "Historial Poliza";

  return (
    <CustomModal
      open={!!historialId}
      onClose={onClose}
      title={titulo}
      size="large"
      actions={<CustomButton color="secondary" onClick={onClose}>Cerrar</CustomButton>}
    >
      {isLoading || !poliza ? null : (
        <div className={styles.grid}>
          <span className={styles.section}>Póliza</span>
          {field("Número", (poliza as any).numero, styles.w100)}
          {field("CUIT", Formato.CUIP(String((poliza as any).cuit ?? "")), styles.w150)}
          {field("Nro. Solicitud", (poliza as any).numeroSolicitud, styles.w120)}
          {field("Vigencia Desde", Formato.Fecha((poliza as any).vigenciaDesde), styles.w120)}
          {field("Vigencia Hasta", Formato.Fecha((poliza as any).vigenciaHasta), styles.w120)}
          {field("Estado", (poliza as any).estadoCodigo, styles.w100)}
          {field("Fecha Estado", Formato.Fecha((poliza as any).estadoFecha), styles.w120)}
          {field("Días para Vencimiento", (poliza as any).diasParaVencimiento, styles.w160)}
          {field("CIIU", (poliza as any).ciiu, styles.w100)}

          <span className={styles.section}>Empleador</span>
          {field("Denominación", (poliza as any).empleadorDenominacion, styles.col2)}
          {field("Email", (poliza as any).empleadorEmail, styles.col2)}
          {field("Teléfono", (poliza as any).empleadorTelefono)}
          {field("Móvil", (poliza as any).empleadorMovil)}
          {field("Calle", (poliza as any).empleadorDomicilioCalle)}
          {field("Altura", (poliza as any).empleadorDomicilioAltura)}
          {field("Piso", (poliza as any).empleadorDomicilioPiso)}
          {field("Depto", (poliza as any).empleadorDomicilioDepto)}
          {field("CP", (poliza as any).empleadorDomicilioCp)}
          {field("Localidad", (poliza as any).empleadorDomicilioLocalidadDescripcion)}
          {field("Provincia", (poliza as any).empleadorDomicilioProvinciaDescripcion)}

          <span className={styles.section}>Alícuota</span>
          {field("Pago ILT", (poliza as any).alicuotaPagoIlt)}
          {field("Suma Fija", (poliza as any).alicuotaSumaFija)}
          {field("Cuota Variable", (poliza as any).alicuotaCuotaVariable)}
          {field("Nivel", (poliza as any).alicuotaNivel)}
          {field("FFE", (poliza as any).alicuotaFfe)}

          <span className={styles.section}>Movimiento</span>
          {field("Código Operación", (poliza as any).movimientoCodigoOperacion)}
          {field("Fecha", Formato.Fecha((poliza as any).movimientoFecha))}
          {field("PDM Id", (poliza as any).movimientoPdmId)}

          <span className={styles.section}>Comercializador</span>
          {field("CUIL", Formato.CUIP(String((poliza as any).comercializadorCuil ?? "")))}
          {field("Razón Social", (poliza as any).comercializadorReferenteRazonSocial, styles.col2)}
          {field("Matrícula", (poliza as any).comercializadorMatricula)}
          {field("Email", (poliza as any).comercializadorEmail, styles.col2)}
          {field("Teléfono", (poliza as any).comercializadorTelefono)}
          {field("Móvil", (poliza as any).comercializadorMovil)}
          {field("Asociado", (poliza as any).srtComercializadorAsociadoDescripcion, styles.col2)}
        </div>
      )}
    </CustomModal>
  );
}
