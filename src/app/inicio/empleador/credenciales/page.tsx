"use client";

import React, { useState } from "react";
import { FaFilePdf } from "react-icons/fa";
import styles from "./Credenciales.module.css";
import DataTable from '@/utils/ui/table/DataTable';
import type { ColumnDef } from "@tanstack/react-table";
import gestionEmpleadorAPI from '@/data/gestionEmpleadorAPI';
import { useAuth } from '@/data/AuthContext';
import ArtAPI from '@/data/artAPI';
import Formato from '@/utils/Formato';
import { downloadCredencialPdf } from "./PDF/pdfCredencial";
import type { AfiliadoCredencial, PolizaCredencial } from "./types/pdf";
import CustomButton from '@/utils/ui/button/CustomButton';
import CustomModal from '@/utils/ui/form/CustomModal';
import CustomModalMessage from '@/utils/ui/message/CustomModalMessage';
import dayjs from "dayjs";

const getPeriodo = (): string => dayjs().subtract(2, "month").format("YYYYMM");

function CredencialesPage() {
  const { user } = useAuth();
  const empresaCUIT = Number((user as any)?.cuit ?? 0);
  const { data: apiData, error } = gestionEmpleadorAPI.useGetPersonal({ CUIT: empresaCUIT, periodo: Number(getPeriodo()) });
  const [localRows, setLocalRows] = useState<any[]>([]);
  const data: any[] = [...(apiData || []).map((r: any) => ({ cuil: r.cuil, nombre: r.nombreEmpleador })), ...localRows];

  const [modalOpen, setModalOpen] = useState(false);
  const [newCuil, setNewCuil] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [msgOpen, setMsgOpen] = useState(false);
  const [touchedCuil, setTouchedCuil] = useState(false);
  const [touchedNombre, setTouchedNombre] = useState(false);

  const cuilDigits = newCuil.replace(/\D/g, '');
  const cuilError = !newCuil.trim()
    ? "CUIL es requerido"
    : cuilDigits.length !== 11
      ? "CUIL debe contener 11 dígitos"
      : "";
  const nombreError = !newNombre.trim() ? "Nombre es requerido" : "";

  const columns: ColumnDef<any>[] = [
    { accessorKey: "cuil", header: "CUIL", cell: (info: any) => Formato.CUIP(info.getValue()) },
    { accessorKey: "nombre", header: "Nombre" },
    {
      id: "accion",
      header: "Acción",
      enableSorting: false,
      meta: { width: '10%', align: 'center' },
      cell: ({ row }) => {
        const afiliado: AfiliadoCredencial = {
          CUIL: row.original?.cuil,
          NombreEmpleado: row.original?.nombre,
        };

        return (
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Descargar credencial PDF"
            title="Descargar credencial"
            onClick={async () => {
              const empresa = await ArtAPI.getEmpresaByCUIT({ CUIT: empresaCUIT });
              const pol = [
                {
                  empleador_Denominacion: empresa.razonSocial,
                  cuit: Formato.CUIP(empresaCUIT),
                  numero: empresa.contratoNro,
                },
              ];
              downloadCredencialPdf({
                afiliado,
                poliza: pol,
                assets: {
                  srtImageUrl: "/icons/SRT.png",
                  frontImageUrl: "/images/frente_Credencial.png",
                  // qrImageUrl: "/images/qr.png",
                },
              });
            }}
          >
            <FaFilePdf />
          </button>
        );
      },
    },
  ];

  return (
    <div>
      <div className={styles.toolbar}>
        <CustomButton onClick={() => setModalOpen(true)}>
          Agregar nuevo personal
        </CustomButton>
      </div>
      <DataTable data={data} columns={columns} pageSize={10} isLoading={!apiData && !error} />
      <div className={styles.legendContainer}>
        <p className={styles.legend}>
          <span className={styles.legendBold}>
            Sr empleador, le recordamos que cualquier modificación a la nómina presentada es considerada una DDJJ.
          </span>{" "}
          <span>
            Los datos se recolectan únicamente para ser utilizados con motivo de la relación comercial que lo vincula con la compañía (art. 6° ley 25.326).
          </span>
        </p>
      </div>
      <CustomModal open={modalOpen} onClose={() => setModalOpen(false)} title="Agregar personal" size="small" actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <CustomButton variant="outlined" onClick={() => {
            setNewCuil("");
            setNewNombre("");
            setTouchedCuil(false);
            setTouchedNombre(false);
            setModalOpen(false);
          }}>
            Cancelar
          </CustomButton>
          <CustomButton disabled={!(cuilDigits.length === 11) || !newNombre.trim()} onClick={() => {
            // agregar fila mínima (guardar CUIL sin guiones)
            setLocalRows(rows => [{ cuil: cuilDigits, nombre: newNombre }, ...rows]);
            setNewCuil("");
            setNewNombre("");
            setTouchedCuil(false);
            setTouchedNombre(false);
            setModalOpen(false);
            setMsgOpen(true);
          }}>
            Guardar
          </CustomButton>
        </div>
      }>
        <div className={styles.modalForm}>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>CUIL</label>
            <div className={styles.formField}>
              <input
                className={styles.formInput}
                inputMode="numeric"
                pattern="\d*"
                value={newCuil}
                onBlur={() => setTouchedCuil(true)}
                onChange={e => {
                  const digits = String(e.target.value).replace(/\D/g, '').slice(0, 11);
                  let formatted = digits;
                  if (digits.length > 2 && digits.length <= 10) {
                    formatted = digits.slice(0, 2) + '-' + digits.slice(2);
                  } else if (digits.length > 10) {
                    formatted = digits.slice(0, 2) + '-' + digits.slice(2, 10) + '-' + digits.slice(10);
                  }
                  setNewCuil(formatted);
                }}
              />
              {touchedCuil && cuilError && (
                <span className={styles.fieldError}>{cuilError}</span>
              )}
            </div>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Nombre</label>
            <div className={styles.formField}>
              <input
                className={styles.formInput}
                value={newNombre}
                onBlur={() => setTouchedNombre(true)}
                onChange={e => setNewNombre(e.target.value)}
              />
              {touchedNombre && nombreError && (
                <span className={styles.fieldError}>{nombreError}</span>
              )}
            </div>
          </div>
        </div>
      </CustomModal>
      <CustomModalMessage open={msgOpen} onClose={() => setMsgOpen(false)} message="Atención: los datos que ingreses son temporales y no se guardarán de forma permanente." type="info" />
    </div>
  );
}

export default CredencialesPage;
