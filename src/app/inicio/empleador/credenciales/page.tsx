"use client";

import React, { useState, useEffect } from "react";
import { FaFilePdf } from "react-icons/fa";
import styles from "./Credenciales.module.css";
import DataTable from '@/utils/ui/table/DataTable';
import type { ColumnDef } from "@tanstack/react-table";
import { useAuth } from '@/data/AuthContext';
import ArtAPI from '@/data/artAPI';
import { useEmpresasStore } from '@/data/empresasStore';
import { Empresa } from '@/data/authAPI';
import CustomSelectSearch from '@/utils/ui/form/CustomSelectSearch';
import Formato from '@/utils/Formato';
import { downloadCredencialPdf } from "./PDF/pdfCredencial";
import type { AfiliadoCredencial, PolizaCredencial } from "./types/pdf";
import type { PolizaComercializador } from "./types/credencial";
import CustomButton from '@/utils/ui/button/CustomButton';
import CustomModal from '@/utils/ui/form/CustomModal';
import CustomModalMessage from '@/utils/ui/message/CustomModalMessage';
import dayjs from "dayjs";
import { TextField } from '@mui/material';
import { applySRTPolizasVerIndependientes } from '@/utils/srtPolizasParams';

const getPeriodo = (): string => dayjs().subtract(2, "month").format("YYYYMM");

function CredencialesPage() {
  const { user } = useAuth();
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);

  useEffect(() => {
    if (isLoadingEmpresas) return;
    if (empresas.length === 1) setEmpresaSeleccionada(empresas[0]);
  }, [empresas, isLoadingEmpresas]);

  const normalizeDigits = (value: unknown) => String(value ?? '').replace(/\D/g, '');

  const selectedEmpresaCUIT = Number(normalizeDigits(empresaSeleccionada?.cuit ?? 0));
  const empresaCUIT = selectedEmpresaCUIT || Number(normalizeDigits((user as any)?.cuit ?? 0));
  const [PageIndex, setPageIndex] = useState<number>(1);
  const [PageSize, setPageSize] = useState<number>(10);
  const [pageCount, setPageCount] = useState<number>(1);
  const [apiRows, setApiRows] = useState<any[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState<boolean>(false);
  const [rowsError, setRowsError] = useState<any>(null);
  const [localRows, setLocalRows] = useState<any[]>([]);

  useEffect(() => {
    setPageIndex(1);
    setPageCount(1);
  }, [selectedEmpresaCUIT]);

  useEffect(() => {
    let canceled = false;

    if (!selectedEmpresaCUIT) {
      setApiRows([]);
      setPageCount(1);
      setRowsError(null);
      setIsLoadingRows(false);
      return;
    }

    const fetchTrabajadores = async () => {
      setIsLoadingRows(true);
      setRowsError(null);
      try {
        const response = await ArtAPI.getEmpleadorTrabajadores({
          CUIL: selectedEmpresaCUIT,
          PageIndex,
          PageSize,
          Periodos: Number(getPeriodo()),
        });

        if (canceled) return;

        const rawItems = response?.data ?? response?.DATA ?? response?.items ?? response?.Items ?? response;
        const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

        const mappedRows = items.map((row: any) => ({
          cuil: row?.cuil ?? row?.CUIL ?? row?.cuit ?? row?.CUIT ?? row?.trabCUIL,
          nombre: row?.nombre ?? row?.Nombre ?? row?.nombreEmpleador ?? row?.NombreEmpleador ?? row?.apellidoNombre ?? row?.ApellidoNombre ?? '',
        }));

        setApiRows(mappedRows);

        const total =
          typeof response?.total === 'number' ? response.total :
            typeof response?.totalCount === 'number' ? response.totalCount :
              typeof response?.TotalCount === 'number' ? response.TotalCount :
                typeof response?.TOTAL === 'number' ? response.TOTAL :
                  typeof response?.count === 'number' ? response.count :
                    typeof response?.Count === 'number' ? response.Count :
                      typeof response?.meta?.total === 'number' ? response.meta.total :
                        undefined;

        if (typeof total === 'number' && PageSize > 0) {
          setPageCount(Math.max(1, Math.ceil(total / PageSize)));
        } else {
          setPageCount(items.length > 0 ? Math.ceil(items.length / PageSize) : 1);
        }
      } catch (err) {
        if (canceled) return;
        setRowsError(err);
        setApiRows([]);
        setPageCount(1);
      } finally {
        if (!canceled) setIsLoadingRows(false);
      }
    };

    fetchTrabajadores();

    return () => {
      canceled = true;
    };
  }, [selectedEmpresaCUIT, PageIndex, PageSize]);

  const data: any[] = PageIndex === 1 ? [...localRows, ...apiRows] : apiRows;

  const [modalOpen, setModalOpen] = useState(false);
  const [newCuil, setNewCuil] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [msgOpen, setMsgOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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
    { accessorKey: "cuil", header: "CUIL", cell: (info: any) => info.getValue() ? Formato.CUIP(info.getValue()) : '-' },
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
              const polizas = await ArtAPI.getPolizaComercializador(
                applySRTPolizasVerIndependientes({ CUIT: empresaCUIT }, user?.rol)
              ) as PolizaComercializador[];
              const numeroContrato = Array.isArray(polizas) ? (polizas[0]?.numero ?? '') : '';
              const pol = [
                {
                  empleador_Denominacion: empresa.razonSocial,
                  cuit: Formato.CUIP(empresaCUIT),
                  numero: numeroContrato,
                },
              ];
              try {
                await downloadCredencialPdf({
                  afiliado,
                  poliza: pol,
                  assets: {
                    srtImageUrl: "/icons/SRT.png",
                    frontImageUrl: "/images/frente_Credencial.png",
                    // qrImageUrl: "/images/qr.png",
                  },
                });
              } catch (e: any) {
                console.error('Error generando credencial:', e);
                setErrorMessage('No se pudo descargar la credencial, por favor vuelva a intentar');
                setErrorOpen(true);
              }
            }}
          >
            <FaFilePdf />
          </button>
        );
      },
    },
  ];

  const handlePageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPageIndex(1);
  };

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <div className={styles.selectWrap}>
            <CustomSelectSearch<Empresa>
              options={empresas}
              getOptionLabel={(e) => e ? String(e.razonSocial) : ''}
              value={empresaSeleccionada}
              onChange={(_ev, newVal) => setEmpresaSeleccionada(newVal)}
              label="Seleccionar Empresa"
              placeholder="Buscar empresa..."
              loading={isLoadingEmpresas}
              loadingText="Cargando empresas..."
              noOptionsText={isLoadingEmpresas ? 'Cargando...' : empresas.length === 0 ? 'No hay empresas disponibles' : 'No se encontraron empresas'}
            />
          </div>
          <CustomButton onClick={() => setModalOpen(true)}>
            Agregar nuevo personal
          </CustomButton>
        </div>
      </div>
      <DataTable
        data={data}
        columns={columns}
        manualPagination={true}
        pageIndex={PageIndex}
        pageSize={PageSize}
        pageCount={pageCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10]}
        isLoading={isLoadingRows}
      />
      {/* Leyenda movida dentro del modal */}
      <CustomModal open={modalOpen} onClose={() => setModalOpen(false)} title="Agregar personal" size="large" actions={
        <div className={styles.actionsRow}>
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
          <CustomButton variant="outlined" onClick={() => {
            setNewCuil("");
            setNewNombre("");
            setTouchedCuil(false);
            setTouchedNombre(false);
            setModalOpen(false);
          }}>
            Cancelar
          </CustomButton>
        </div>
      }>
        <div className={styles.modalForm}>
          <div className={styles.formRow}>
            <div className={styles.cuilField}>
              <TextField
                label="CUIL"
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
                inputProps={{ inputMode: 'numeric', pattern: '\\d*' }}
                error={touchedCuil && !!cuilError}
                helperText={touchedCuil && cuilError ? cuilError : ''}
                fullWidth
              />
            </div>
            <div className={styles.nombreField}>
              <TextField
                label="Nombre del Trabajador"
                value={newNombre}
                onBlur={() => setTouchedNombre(true)}
                onChange={e => setNewNombre(e.target.value)}
                error={touchedNombre && !!nombreError}
                helperText={touchedNombre && nombreError ? nombreError : ''}
                fullWidth
              />
            </div>
          </div>
          <div className={styles.modalLegend}>
            <p className={styles.legend}>
              <span className={styles.legendBold}>
                Sr empleador, le recordamos que cualquier modificación a la nómina presentada es considerada una DDJJ.
              </span>{" "}
              <span>
                Los datos se recolectan únicamente para ser utilizados con motivo de la relación comercial que lo vincula con la compañía (art. 6° ley 25.326).
              </span>
            </p>
          </div>
        </div>
      </CustomModal>
      <CustomModalMessage open={msgOpen} onClose={() => setMsgOpen(false)} message="Atención: los datos que ingreses son temporales y no se guardarán de forma permanente." type="info" />
      <CustomModalMessage open={errorOpen} onClose={() => setErrorOpen(false)} message={errorMessage} type="error" />
    </div>
  );
}

export default CredencialesPage;
