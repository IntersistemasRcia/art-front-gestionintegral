"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'; 
import gestionEmpleadorAPI from "@/data/gestionEmpleadorAPI";
import Persona from './types/persona';
import DataTable from '@/utils/ui/table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import styles from "./cobertura.module.css";
import CustomButton from '@/utils/ui/button/CustomButton';
import { BsBoxArrowInLeft, BsBoxArrowInRight, BsDownload, BsFileEarmarkExcel } from "react-icons/bs";
import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material';
import Image from 'next/image';
import Formato from '@/utils/Formato';
import Cobertura_PDF from './Cobertura_PDF';
import ExcelJS from 'exceljs';
import CustomModalMessage, { MessageType } from '@/utils/ui/message/CustomModalMessage';
import { useEmpresasStore } from "@/data/empresasStore";
import { Empresa } from "@/data/authAPI";
import CustomSelectSearch from "@/utils/ui/form/CustomSelectSearch";
import { useSearchParams } from "next/navigation";

const { useGetPersonal, useGetPoliza } = gestionEmpleadorAPI;

export default function CoberturaPage() {
    const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
    const seleccionAutomaticaRef = useRef(false);
    const [bloquearBusquedaPorCuit, setBloquearBusquedaPorCuit] = useState(false);
    const searchParams = useSearchParams();
    const cuitQuery = searchParams.get("cuit") ?? searchParams.get("cuil");
    const cuitDesdeQuery = cuitQuery ? Number(String(cuitQuery).replace(/\D/g, "")) : NaN;

    const cuitEmpresaActual = Number.isFinite(cuitDesdeQuery) && cuitDesdeQuery > 0
        ? cuitDesdeQuery
        : (empresaSeleccionada?.cuit ?? NaN);
   
    // Obtener personal y póliza usando el CUIT de la empresa seleccionada o, si viene por query, ese CUIT
    const paramsCUIT = Number.isFinite(cuitEmpresaActual) && cuitEmpresaActual > 0
        ? { CUIT: cuitEmpresaActual }
        : {};

    const { data: personalRawData, isLoading: isPersonalLoading } = useGetPersonal(paramsCUIT); 
    const { data: polizaData, isLoading: isPolizaLoading } = useGetPoliza(paramsCUIT);
    
    // Estados para las dos tablas: Pendiente (Origen) y Cubierto (Destino)
    const [personalPendiente, setPersonalPendiente] = useState<Persona[]>([]);
    const [personalCubierto, setPersonalCubierto] = useState<Persona[]>([]);
    const inputReference = useRef<HTMLInputElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [presentadoA, setPresentadoA] = useState<string>('');
    const [abrirPDF, setAbrirPDF] = useState<boolean>(false);
    const [clausula, setClausula] = useState<boolean>(false);

    // Estado para mensajes (formato unificado como en RGRL)
    const [msgOpen, setMsgOpen] = useState<boolean>(false);
    const [msgText, setMsgText] = useState<string>('');
    const [msgType, setMsgType] = useState<MessageType>('warning');
    const [msgTitle, setMsgTitle] = useState<string | undefined>(undefined);

    const showMessage = useCallback((message: string, type: MessageType = 'warning', title?: string) => {
        setMsgText(message);
        setMsgType(type);
        setMsgTitle(title);
        setMsgOpen(true);
    }, []);

    // Fecha y hora actuales (formato local es-AR) - Solo se calcula en el cliente para evitar errores de hidratación
    const [dia, setDia] = useState<string>('');
    const [hora, setHora] = useState<string>('');
    const [isMounted, setIsMounted] = useState<boolean>(false);

    useEffect(() => {
        // Marcar como montado y calcular fecha/hora solo en el cliente
        setIsMounted(true);
        const now = new Date();
        setDia(now.toLocaleDateString('es-AR')); // ej. "07/11/2025"
        setHora(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })); // ej. "14:35"
    }, []);

    // Seleccionar automáticamente si solo hay una empresa (salvo que venga CUIT por query)
    useEffect(() => {
        if (Number.isFinite(cuitDesdeQuery) && cuitDesdeQuery > 0) return;
        if (!isLoadingEmpresas) {
            if (empresas.length === 1) {
                setEmpresaSeleccionada(empresas[0]);
                seleccionAutomaticaRef.current = true;
            } else if (empresas.length !== 1 && seleccionAutomaticaRef.current) {
                setEmpresaSeleccionada(null);
                seleccionAutomaticaRef.current = false;
            }
        }
    }, [empresas.length, isLoadingEmpresas, cuitDesdeQuery]);

    // Si viene CUIT por query param, bloquear combo y seleccionar empresa (o al menos la razón social)
    useEffect(() => {
        if (!Number.isFinite(cuitDesdeQuery) || cuitDesdeQuery <= 0) return;

        setBloquearBusquedaPorCuit(true);
        if (isLoadingEmpresas || empresaSeleccionada) return;

        const match = empresas.find((e) => {
            const digits = Number(String((e as any)?.cuit ?? "").replace(/\D/g, ""));
            return Number.isFinite(digits) && digits === cuitDesdeQuery;
        });

        if (match) {
            setEmpresaSeleccionada(match);
            seleccionAutomaticaRef.current = true;
            return;
        }

        const razonSocial = (polizaData as any)?.empleador_Denominacion;
        if (!razonSocial) return;

        setEmpresaSeleccionada({ razonSocial: String(razonSocial) } as Empresa);
    }, [cuitDesdeQuery, empresas, isLoadingEmpresas, empresaSeleccionada, polizaData]);

    // Limpiar las tablas cuando cambia la empresa seleccionada
    useEffect(() => {
        setPersonalPendiente([]);
        setPersonalCubierto([]);
        setSelectedPendiente([]);
        setSelectedCubierto([]);
    }, [empresaSeleccionada?.cuit]);

    const handleEmpresaChange = (
        _event: React.SyntheticEvent,
        newValue: Empresa | null
    ) => {
        if (bloquearBusquedaPorCuit) return;
        setEmpresaSeleccionada(newValue);
        seleccionAutomaticaRef.current = false;
    };

    const getEmpresaLabel = (empresa: Empresa | null): string => {
        if (!empresa) return "";
        return String(empresa.razonSocial ?? "");
    };

    // Estados para las selecciones de filas en cada tabla
    const [selectedPendiente, setSelectedPendiente] = useState<Persona[]>([]);
    const [selectedCubierto, setSelectedCubierto] = useState<Persona[]>([]);
    
    // ESTADOS PARA LOS NUEVOS CAMPOS DE ENTRADA (newCuil es number | null)
    const [newCuil, setNewCuil] = useState<number | null>(null); 
    const [newNombre, setNewNombre] = useState<string>('');

    const handleDownload = () => {
        // Si no hay destinatario, poner foco en el campo "Para ser presentado a"
        if (!presentadoA?.trim()) {
            inputReference.current?.focus();
            return;
        }
        // continuar con la descarga / abrir PDF
        setAbrirPDF(true);
    };
    
    // Inicializa personalPendiente con los datos crudos cuando se cargan
    useEffect(() => {
        if (personalRawData && personalRawData.length > 0) {
            setPersonalPendiente(personalRawData);
        } else if (personalRawData && personalRawData.length === 0) {
            // Si la respuesta es un array vacío, limpiar las tablas
            setPersonalPendiente([]);
            setPersonalCubierto([]);
        }
    }, [personalRawData]);

    // Generar objeto de selección inicial para todas las filas
    const initialRowSelectionPendiente = useMemo(() => {
        const selection: Record<string, boolean> = {};
        personalPendiente.forEach((_, index) => {
            selection[index.toString()] = true;
        });
        return selection;
    }, [personalPendiente]);

    const initialRowSelectionCubierto = useMemo(() => {
        const selection: Record<string, boolean> = {};
        personalCubierto.forEach((_, index) => {
            selection[index.toString()] = true;
        });
        return selection;
    }, [personalCubierto]);

    const columns: ColumnDef<Persona>[] = useMemo(() => [
        {
            header: 'CUIL',
            accessorKey: 'cuil',
            cell: (info: any) => {
                // Solo formatear cuando el componente esté montado para evitar errores de hidratación
                if (!isMounted) return '';
                const value = info.getValue();
                return value ? Formato.CUIP(value) : '';
            }
        },
        {
            header: 'Nombre',
            accessorKey: 'nombreEmpleador',
        },
    ], [isMounted]);


    const handleSelectionPendiente = useCallback((selectedRows: Persona[]) => {
        setSelectedPendiente(selectedRows);
    }, []); 

    const handleSelectionCubierto = useCallback((selectedRows: Persona[] | null) => {
        setSelectedCubierto(selectedRows || []);
    }, []); 


    const handleInputCuil = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        if (value === '') {
            setNewCuil(null);
            return;
        }

        // Si hay texto, valida que sean solo dígitos
        if (/^\d+$/.test(value)) {
            // Convierte a número y almacena en el estado
            setNewCuil(parseInt(value, 10));
        }
        // Si no son dígitos, simplemente ignora la entrada (no actualiza el estado)
    };

    // Función principal: Mover de PENDIENTE a CUBIERTO
    const handleCubrir = () => {
        if (selectedPendiente.length === 0) return;

        const selectedCuils = new Set(selectedPendiente.map(p => p.cuil));

        const newPendiente = personalPendiente.filter(p => !selectedCuils.has(p.cuil));
        const newCubierto = [...personalCubierto, ...selectedPendiente];

        setPersonalPendiente(newPendiente);
        setPersonalCubierto(newCubierto);
        
        setSelectedPendiente([]); 
    };

    // Función secundaria: Mover de CUBIERTO a PENDIENTE
    const handleLiberar = () => {
        if (selectedCubierto.length === 0) return;

        const selectedCuils = new Set(selectedCubierto.map(p => p.cuil));

        const newCubierto = personalCubierto.filter(p => !selectedCuils.has(p.cuil));
        const newPendiente = [...personalPendiente, ...selectedCubierto];

        setPersonalCubierto(newCubierto);
        setPersonalPendiente(newPendiente);
        setSelectedCubierto([]);
    };
    
    // FUNCIÓN PARA AGREGAR FILA A LA TABLA CUBIERTO
    const handleAddFila = () => {
        if (newCuil === null || !newNombre.trim()) {
            showMessage('Por favor, ingrese CUIT/CUIL y Nombre válidos.', 'warning', 'Datos faltantes');
            return;
        }

        // Verificar duplicados
        const isDuplicate = personalCubierto.some(p => p.cuil === newCuil) || personalPendiente.some(p => p.cuil === newCuil);
        
        if (isDuplicate) {
            showMessage(`El CUIT/CUIL ${newCuil} ya existe en las listas.`, 'warning', 'Registro duplicado');
            return;
        }

        // Crear el nuevo objeto Persona usando newCuil (que ya es number)
        const newPerson: Persona = {
            cuil: newCuil, 
            nombreEmpleador: newNombre.trim().toUpperCase(),
        };

        // Añadir a la lista de cubiertos
        setPersonalCubierto(prev => [...prev, newPerson]);

        // Limpiar campos de entrada
        setNewCuil(null);
        setNewNombre('');
    };

    const isAddButtonDisabled = newCuil === null || newNombre.trim() === '';

    // Función para importar datos desde Excel
    const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const workbook = new ExcelJS.Workbook();
            const arrayBuffer = await file.arrayBuffer();
            await workbook.xlsx.load(arrayBuffer);
            
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                showMessage('El archivo Excel está vacío.', 'warning', 'Importación de Excel');
                return;
            }

            const importedData: Persona[] = [];
            const duplicados: number[] = [];

            // Empezar desde la fila 2 para saltar encabezados
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Saltar encabezado

                const cuilValue = row.getCell(1).value;
                const nombreValue = row.getCell(2).value;

                // Validar que haya datos
                if (!cuilValue || !nombreValue) return;

                const cuil = typeof cuilValue === 'number' ? cuilValue : parseInt(String(cuilValue).replace(/\D/g, ''), 10);
                const nombre = String(nombreValue).trim().toUpperCase();

                if (isNaN(cuil) || !nombre) return;

                // Verificar duplicados
                const isDuplicate = personalCubierto.some(p => p.cuil === cuil) || 
                                  personalPendiente.some(p => p.cuil === cuil) ||
                                  importedData.some(p => p.cuil === cuil);
                
                if (isDuplicate) {
                    duplicados.push(cuil);
                    return;
                }

                importedData.push({
                    cuil,
                    nombreEmpleador: nombre,
                });
            });

            if (importedData.length > 0) {
                setPersonalCubierto(prev => [...prev, ...importedData]);
                showMessage(`Se importaron ${importedData.length} registros exitosamente.${duplicados.length > 0 ? `\n${duplicados.length} duplicados omitidos.` : ''}`, 'success', 'Importación exitosa');
            } else {
                showMessage('No se encontraron datos válidos en el archivo.', 'warning', 'Importación de Excel');
            }

        } catch (error) {
            console.error('Error al importar Excel:', error);
            showMessage('Error al leer el archivo Excel. Asegúrese de que tenga el formato correcto (Columna 1: CUIL, Columna 2: Nombre).', 'error', 'Error de importación');
        }

        // Limpiar el input para permitir reimportar el mismo archivo
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    // Calcular valores formateados solo cuando polizaData esté disponible y el componente esté montado
    // Esto evita errores de hidratación al asegurar que los valores se calculen solo en el cliente
    const formattedValues = useMemo(() => {
        if (!isMounted || !polizaData) {
            return {
                cuit: "",
                vigenciaDesde: "",
                vigenciaHasta: "",
                empleadorDenominacion: "",
                numero: ""
            };
        }
        return {
            cuit: Formato.CUIP(polizaData.cuit) || "",
            vigenciaDesde: Formato.Fecha(polizaData.vigencia_Desde) || "",
            vigenciaHasta: Formato.Fecha(polizaData.vigencia_Hasta) || "",
            empleadorDenominacion: polizaData.empleador_Denoominacion || "",
            numero: polizaData.numero || ""
        };
    }, [polizaData, isMounted]);

    // Mostrar destinatario específico en la cláusula si fue ingresado, sino uso el genérico
    const destinatarioEnClausula = presentadoA?.trim() ? presentadoA : 'A quien corresponda';

    return ( 
        <div className={styles.inicioContainer}>
            <div className={styles.header}>
                <h1 className={styles.mainTitle}>Gestión de Cobertura de Personal</h1>
            </div>

            <Box className={styles.empresaSelectorContainer}>
                <CustomSelectSearch<Empresa>
                    options={empresas}
                    getOptionLabel={getEmpresaLabel}
                    value={empresaSeleccionada}
                    onChange={handleEmpresaChange}
                    label="Seleccionar Empresa"
                    placeholder="Buscar empresa..."
                    loading={isLoadingEmpresas}
                    loadingText="Cargando empresas..."
                    noOptionsText={
                        isLoadingEmpresas
                            ? "Cargando..."
                            : empresas.length === 0
                            ? "No hay empresas disponibles"
                            : "No se encontraron empresas"
                    }
                    disabled={isLoadingEmpresas || bloquearBusquedaPorCuit}
                />
            </Box>

            <div className={styles.dualTableContainer}>
                
                {/* -------------------- TABLA DE PERSONAL PENDIENTE -------------------- */}
                <div className={styles.tablePanel}>
                    <div className={styles.detalles}>
                        <h2 className={styles.tableTitle}>Personal Pendiente {isMounted ? `(${personalPendiente.length})` : ''}</h2>
                        <p>Seleccionados: {isMounted ? selectedPendiente.length : 0}</p>
                    </div>
                    <DataTable
                        data={personalPendiente} 
                        columns={columns} 
                        size="mid"
                        isLoading={isPersonalLoading}
                        enableRowSelection={true}
                        initialRowSelection={initialRowSelectionPendiente}
                        onRowSelectionChange={handleSelectionPendiente}
                        key={`pendiente-${isMounted ? personalPendiente.length : 0}`} 
                    />
                </div>

                {/* -------------------- PANEL DE BOTONES DE TRANSFERENCIA -------------------- */}
                <div className={styles.controlsPanel}>
                    <CustomButton 
                        className={`${styles.controlButton} ${styles.cubrirButton}`}
                        onClick={handleCubrir}
                        disabled={selectedPendiente.length === 0}
                        title="Mover personal seleccionado a 'Cubierto'"
                    >
                        CUBRIR <BsBoxArrowInRight style={{fontSize: "2.5rem"}}/>
                    </CustomButton>
                    <CustomButton 
                        onClick={handleLiberar}
                        disabled={selectedCubierto.length === 0}
                        title="Mover personal seleccionado de vuelta a 'Pendiente'"
                    >
                    <BsBoxArrowInLeft style={{fontSize: "2.5rem"}} />QUITAR
                    </CustomButton>
                    <CustomButton 
                        color="secondary"
                        onClick={handleImportClick}
                        title="Importar personal desde archivo Excel"
                        
                    >
                        IMPORTAR
                    </CustomButton>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleImportExcel}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* -------------------- TABLA DE PERSONAL CUBIERTO -------------------- */}
                <div className={styles.tablePanel}>
                    <div className={styles.detalles}>
                        <h2 className={styles.tableTitle}>Personal Cubierto {isMounted ? `(${personalCubierto.length})` : ''}</h2>
                        <p>Seleccionados: {isMounted ? selectedCubierto.length : 0}</p> 
                    </div>
                    <DataTable
                        data={personalCubierto} 
                        columns={columns} 
                        size="mid"
                        isLoading={isPersonalLoading}
                        enableRowSelection={true}
                        initialRowSelection={initialRowSelectionCubierto}
                        onRowSelectionChange={handleSelectionCubierto}
                        key={`cubierto-${isMounted ? personalCubierto.length : 0}`}
                    />

                    {/* NUEVOS CAMPOS DE ENTRADA Y BOTÓN */}
                    <Box className={styles.inputSection}> {/* Usamos Box y el style de la sección de inputs */}
                        <TextField
                            label="CUIL"
                            type="text"
                            placeholder="CUIL"
                            value={newCuil === null ? '' : newCuil.toString()} 
                            onChange={handleInputCuil} 
                            className={styles.inputField}                  
                        />
                        <TextField
                            label="Nombre"
                            type="text"
                            placeholder="Nombre Trabajador"
                            value={newNombre}
                            onChange={(e) => setNewNombre(e.target.value)}
                            className={styles.inputField}
                        />
                        <CustomButton 
                            onClick={handleAddFila}
                            disabled={isAddButtonDisabled}
                            title="Agregar Trabajador Cubierto"
                            icon={<BsBoxArrowInLeft/>}
                        >
                            AGREGAR
                        </CustomButton>
                    </Box>

                    <p className={styles.leyendaLegal}>
                        <strong>Sr. empleador, le recordamos que cualquier modificación a la nómina presentada es considerada una DDJJ.</strong><br/>
                        Los datos se recolectan únicamente para ser utilizados con motivo de la relación comercial que lo vincula con la compañía (art. 6° ley 25.326).
                    </p>
                </div>
                
            </div>
            <div className={styles.detalles}>
            </div>
            
            {/* -------------------- SECCIÓN DE CERTIFICADO DE COBERTURA -------------------- */}
            
            <div className={styles.downloadButtonContainer}>
                <CustomButton 
                    onClick={handleDownload}
                    variant="contained"
                    color="primary"
                    icon={<BsDownload />}
                    size="large"
                >
                    DESCARGAR CERTIFICADO DE COBERTURA
                </CustomButton>
            </div>
            <div className={styles.certificadoContainer}>
                {/* Contenido del Certificado */}
                <div className={styles.lugarFecha}>
                    Ciudad Autónoma de Buenos Aires{isMounted && dia ? `, ${dia}` : ''}
                </div>
                <div className={styles.certificadoContent}>
                    
                    <h2 className={styles.certificadoTitle}>CERTIFICADO DE COBERTURA</h2>
                    
                    <Image
                        src="/icons/Logo.svg"
                        alt="Logo ART Mutual Rural"
                        width={500}
                        height={500}
                        className={styles.logoWrapper}
                        priority
                    />
                   
                    <div className={styles.certificadoText}>
                        <div className={styles.presentadoA}>
                            <label>
                                Para ser presentado a:
                            </label>
                            <TextField
                                variant="standard"
                                placeholder="Ingrese destinatario"
                                inputRef={inputReference}
                                value={presentadoA}
                                onChange={(e) => setPresentadoA(e.target.value)}
                                className={styles.inputDestinatario}
                            />
                        </div>
                    </div>
                <br/>    

                    <p>
                        Por intermedio del presente <strong>CERTIFICAMOS</strong> que la empresa bajo la denominación de <strong>{formattedValues.empleadorDenominacion} </strong>
                          con N° de CUIT: <strong>{formattedValues.cuit} </strong> ha contratado la cobertura de <strong>ART MUTUAL RURAL DE SEGUROS DE RIESGOS DEL TRABAJO</strong>,
                          según los términos de la Ley Nro. 24.557 por lo que el personal declarado oportunamente por el/la mencionado/a se encuentra <strong> cubierto a partir
                           del {formattedValues.vigenciaDesde} hasta el {formattedValues.vigenciaHasta}.</strong>
                    </p>
                    <br/>
                    <p>
                        El N° del contrato es el <strong>{formattedValues.numero}.</strong>
                    </p>
                     <div className={styles.clausulaToggle}>
                        <Checkbox size="large" checked={clausula} onChange={(e) => setClausula(e.target.checked)} />
                        Incluir cláusula de no repetición
                    </div>
                    {clausula && 
                    <>
                        <p>
                            Consta por la presente que <strong>ART MUTUAL RURAL DE SEGUROS DE RIESGOS DEL TRABAJO</strong>, renuncia en forma expresa a reclamar o iniciar toda acción de 
                                repetición o de regreso contra: {destinatarioEnClausula}, sus funcionarios, empleados u obreros; sea con fundamento en el art. 39, ap. 5, de la Ley 
                            N° 24.557, sea en cualquier otra norma jurídica, con motivo de las prestaciones en especie o dinerarias que se vea obligada a abonar, contratar
                            u otorgar al personal dependiente o ex dependiente de <strong>{formattedValues.empleadorDenominacion}</strong>, amparados por la cobertura del Contrato de
                            Afiliación N° <strong>{formattedValues.numero}</strong>, por accidentes del trabajo o enfermedades profesionales, ocurridos o contraídos por el hecho 
                            o en ocasión del trabajo. Esta <strong>Cláusula de no repetición</strong> cesará en sus efectos si el empresario comitente a favor de quien 
                            se emite, no cumple estrictamente con las medidas de prevención e higiene y seguridad en el trabajo, o de cualquier manera infringe la Ley 
                            N° 19.587, su Decreto Reglamentario N° 351/79 y las normativas que sobre el particular ha dictado la Superintendencia de Riesgos del Trabajo,
                            las Provincias y la Ciudad Autónoma de la Ciudad de Buenos Aires en el ámbito de su competencia.
                        </p>
                        <br/>
                        <p>
                            Fuera de las causales que expresamente prevé la normativa vigente, el contrato de afiliación no podrá ser modificado o enmendado sin previa
                            notificación fehaciente a quien corresponda, en un plazo no inferior a quince (15) días corridos.
                        </p>
                    </>
                    }
                    <br/>
                    <p>
                        Se deja constancia por la presente que la empresa de referencia se encuentra asegurada en <strong>ART MUTUAL RURAL DE SEGUROS DE RIESGOS DEL TRABAJO</strong>.
                        El presente certificado tiene una validez de 30 días corridos a partir de la fecha de emisión. En ningún caso ART MUTUAL RURAL DE SEGUROS DE RIESGOS
                        DEL TRABAJO será responsable de las consecuencias del uso del certificado una vez vencido el plazo de validez.
                    </p>
                    <br/>
                    <p>
                        Sin otro particular, saludo a Ud. muy atentamente.
                    </p>
                     <br/>
                    <div className={styles.signatureSection}>
                        <div className={styles.signatureLine}>
                             <Image
                                src="/images/FirmaFernanda.png" 
                                alt="Firma de Fernanda Lassalle"
                                width={170}
                                height={200}
                                priority
                            />
                        </div>
                        <p className={styles.signatureText}>
                            Cdra. Ma. Fernanda Lassalle<br/>
                            Gerente de Administración
                        </p>
                    </div>
                </div>
            </div>
            <div>
                {abrirPDF && presentadoA != "" ? (
               <Cobertura_PDF
                    open={abrirPDF}
                    handleVentanaImpresion={(open: boolean) => setAbrirPDF(open)}
                    presentadoA={presentadoA}
                    poliza={polizaData}                     // pasa tu objeto poliza
                    dia={dia}                           // opcional
                    hora={hora}                         // opcional
                    fechaDesde={polizaData?.vigencia_Desde}             // opcional
                    fechaHasta={polizaData?.vigencia_Hasta}             // opcional
                    clausula={clausula}       // opcional
                    nominasSeleccionadas={selectedCubierto} // si aplicable
                cuitEmpresa={Number.isFinite(cuitEmpresaActual) ? cuitEmpresaActual : undefined}
                />
                ) : null}
          </div>
                {/* Modal de mensajes estandarizado (formato RGRL) */}
                <CustomModalMessage
                        open={msgOpen}
                        onClose={() => setMsgOpen(false)}
                        message={msgText}
                        type={msgType}
                        title={msgTitle}
                />
                </div>
    );
}