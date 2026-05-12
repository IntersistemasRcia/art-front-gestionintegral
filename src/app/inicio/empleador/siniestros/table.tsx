'use client';

import React from 'react';
import dayjs from 'dayjs';
import type { InstanciasTablaProps, InstanciaSiniestro } from './types/tipos';
import { useAuth } from '@/data/AuthContext';
import DataTableDetail, { DataTableDetailColumn } from '@/utils/ui/table/DataTableDetail';

const fmtDateTime = (v?: string | null) => {
  if (!v) return '';
  const d = dayjs(v);
  return d.isValid() ? d.format('DD-MM-YYYY HH:mm') : String(v ?? '');
};

const columns: DataTableDetailColumn<InstanciaSiniestro>[] = [
  { header: 'Denuncia N°',          width: 90,  render: r => r.denunciaNro },
  { header: 'Fecha/Hora Instancia', width: 160, render: r => fmtDateTime(r.fechaHoraInstancia) },
  { header: 'Tipo de Instancia',    width: 220, render: r => (r.tipoInstancia ?? '').trim() },
  { header: 'Comentario',           align: 'left', render: r => (r.comentarioInstancia ?? '').trim() },
  { header: 'Estado',               width: 120, render: r => (r.estadoInstancia ?? '').trim() },
  { header: 'Próx. Control Médico', width: 190, render: r => fmtDateTime(r.proximoControlMedicoFechaHora) },
];

const CondicionesTabla: React.FC<InstanciasTablaProps> = ({ rows, loading = false, hasAny = true }) => {
  const { hasTask } = useAuth();

  return (
    <div style={{ marginTop: 18 }}>
      {!hasTask('Empleador_Siniestros_EvolucionesMedicas') ? (
        <div style={{ padding: 12, textAlign: 'center', opacity: 0.7 }} />
      ) : loading ? (
        <div style={{ padding: 16, textAlign: 'center' }}>cargando detalle...</div>
      ) : !hasAny ? (
        <div style={{ padding: 12, textAlign: 'center', opacity: 0.7 }}>
          No hay instancias para mostrar.
        </div>
      ) : (
        <DataTableDetail
          columns={columns}
          rows={rows}
          rowKey={(r, i) => `${r.denunciaNro}-${i}`}
        />
      )}
    </div>
  );
};

export default CondicionesTabla;
