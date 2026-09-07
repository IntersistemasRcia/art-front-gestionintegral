"use client";

import React, { useState, useEffect, useMemo } from "react";
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

const getPeriodos = (): number[] => Array.from({ length: 3 }, (_, i) => Number(dayjs().subtract(i, "month").format("YYYYMM")));

/** Tamaño de página usado internamente para traer toda la nómina del empleador (varias páginas si hace falta). */
const FETCH_ALL_PAGE_SIZE = 100;

const maskCuil = (value: string) => {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 11);
  if (digits.length > 10) return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return digits;
};

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
  const [apiRows, setApiRows] = useState<any[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState<boolean>(false);
  const [rowsError, setRowsError] = useState<any>(null);
  const [localRows, setLocalRows] = useState<any[]>([]);

  const emptyFiltro = { cuil: "", nombre: "" };
  const [filtroDraft, setFiltroDraft] = useState(emptyFiltro);
  const [filtroCommitted, setFiltroCommitted] = useState(emptyFiltro);

  const handleBuscarFiltro = () => setFiltroCommitted(filtroDraft);
  const handleLimpiarFiltro = () => {
    setFiltroDraft(emptyFiltro);
    setFiltroCommitted(emptyFiltro);
  };

  useEffect(() => {
    let canceled = false;

    if (!selectedEmpresaCUIT) {
      setApiRows([]);
      setRowsError(null);
      setIsLoadingRows(false);
      return;
    }

    const parsePage = (response: any) => {
      const rawItems = response?.data ?? response?.DATA ?? response?.items ?? response?.Items ?? response;
      const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
      const mapped = items.map((row: any) => ({
        cuil: row?.cuil ?? row?.CUIL ?? row?.cuit ?? row?.CUIT ?? row?.trabCUIL,
        nombre: row?.nombre ?? row?.Nombre ?? row?.nombreEmpleador ?? row?.NombreEmpleador ?? row?.apellidoNombre ?? row?.ApellidoNombre ?? '',
      }));

      const pages =
        typeof response?.pages === 'number' ? response.pages :
          typeof response?.totalPages === 'number' ? response.totalPages :
            typeof response?.TotalPages === 'number' ? response.TotalPages :
              undefined;
      const total =
        typeof response?.total === 'number' ? response.total :
          typeof response?.totalCount === 'number' ? response.totalCount :
            typeof response?.TotalCount === 'number' ? response.TotalCount :
              typeof response?.TOTAL === 'number' ? response.TOTAL :
                typeof response?.count === 'number' ? response.count :
                  typeof response?.Count === 'number' ? response.Count :
                    typeof response?.meta?.total === 'number' ? response.meta.total :
                      undefined;

      return { mapped, pages, total };
    };

    const fetchTrabajadores = async () => {
      setIsLoadingRows(true);
      setRowsError(null);
      try {
        // Se trae toda la nómina del empleador recorriendo todas las páginas del
        // endpoint paginado (mismo request que ya funcionaba antes, PageIndex/PageSize
        // incluidos), para poder filtrar y paginar sobre el total del lado del cliente.
        const first = await ArtAPI.getEmpleadorTrabajadores({
          CUIL: selectedEmpresaCUIT,
          PageIndex: 1,
          PageSize: FETCH_ALL_PAGE_SIZE,
          Periodos: getPeriodos(),
        });

        if (canceled) return;

        const firstParsed = parsePage(first);
        let allRows = firstParsed.mapped;

        const totalPages =
          firstParsed.pages ??
          (firstParsed.total ? Math.max(1, Math.ceil(firstParsed.total / FETCH_ALL_PAGE_SIZE)) : 1);

        if (totalPages > 1) {
          const restResponses = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              ArtAPI.getEmpleadorTrabajadores({
                CUIL: selectedEmpresaCUIT,
                PageIndex: i + 2,
                PageSize: FETCH_ALL_PAGE_SIZE,
                Periodos: getPeriodos(),
              })
            )
          );

          if (canceled) return;
          restResponses.forEach((response) => {
            allRows = allRows.concat(parsePage(response).mapped);
          });
        }

        setApiRows(allRows);
      } catch (err) {
        if (canceled) return;
        console.error('Error cargando EmpleadorTrabajadores', err);
        setRowsError(err);
        setApiRows([]);
      } finally {
        if (!canceled) setIsLoadingRows(false);
      }
    };

    fetchTrabajadores();

    return () => {
      canceled = true;
    };
  }, [selectedEmpresaCUIT]);

  const data: any[] = useMemo(() => {
    const cuilFiltro = filtroCommitted.cuil.replace(/\D/g, '');
    const nombreFiltro = filtroCommitted.nombre.trim().toLowerCase();

    return [...localRows, ...apiRows]
      .filter((row) => {
        const matchCuil = !cuilFiltro || normalizeDigits(row.cuil) === cuilFiltro;
        const matchNombre = !nombreFiltro || String(row.nombre ?? '').toLowerCase().includes(nombreFiltro);
        return matchCuil && matchNombre;
      })
      .sort((a, b) => (Number(a.cuil) || 0) - (Number(b.cuil) || 0));
  }, [localRows, apiRows, filtroCommitted]);

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

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <div className={styles.selectWrap}>
            <CustomSelectSearch<Empresa>
              options={empresas}
              getOptionLabel={(e) => e ? `${e.razonSocial ?? ""} - ${Formato.CUIP(e.cuit)}` : ''}
              value={empresaSeleccionada}
              onChange={(_ev, newVal) => setEmpresaSeleccionada(newVal)}
              label="Seleccionar Empresa"
              placeholder="Buscar empresa..."
              loading={isLoadingEmpresas}
              loadingText="Cargando empresas..."
              noOptionsText={isLoadingEmpresas ? 'Cargando...' : empresas.length === 0 ? 'No hay empresas disponibles' : 'No se encontraron empresas'}
            />
          </div>
          <div className={styles.filterRow}>
            <TextField
              label="CUIL"
              value={filtroDraft.cuil}
              onChange={e => setFiltroDraft(p => ({ ...p, cuil: maskCuil(e.target.value) }))}
              inputProps={{ inputMode: 'numeric', pattern: '\\d*' }}
              className={styles.filterFieldCuil}
            />
            <TextField
              label="Nombre"
              value={filtroDraft.nombre}
              onChange={e => setFiltroDraft(p => ({ ...p, nombre: e.target.value }))}
              className={styles.filterFieldNombre}
            />
            <CustomButton onClick={handleBuscarFiltro}>Buscar</CustomButton>
            <CustomButton variant="outlined" onClick={handleLimpiarFiltro}>Limpiar</CustomButton>
          </div>
          <CustomButton onClick={() => setModalOpen(true)}>
            Agregar nuevo personal
          </CustomButton>
        </div>
      </div>
      <DataTable
        data={data}
        columns={columns}
        enableFiltering={false}
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
                onChange={e => setNewCuil(maskCuil(e.target.value))}
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
