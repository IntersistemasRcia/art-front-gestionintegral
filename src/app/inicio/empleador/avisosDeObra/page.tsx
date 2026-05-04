// src/app/inicio/empleador/avisosDeObra/page.tsx
"use client"
import React, { useEffect, useState, useRef, useMemo } from "react";
import axios, { AxiosError } from "axios"; 
import {Button,Card,CardContent,Dialog,DialogActions, DialogContent,DialogTitle, Grid,CircularProgress, Box } from "@mui/material";
import { AddCircleOutline } from "@mui/icons-material";
// Importaciones de módulos y tipos locales
import AvisosObraList from "./AvisosObraList";
import AvisoObraForm from "./AvisoObraForm";
import {AvisoObraRecord,Request,Response,ApiQueryState,ApiError,FormDataState } from "./types/types";
import ArtAPI from "@/data/artAPI";
import CustomButton from "@/utils/ui/button/CustomButton";
import CustomSelectSearch from "@/utils/ui/form/CustomSelectSearch";
import Formato from "@/utils/Formato";
import { useAuth } from "@/data/AuthContext";
import { useEmpresasStore } from "@/data/empresasStore";
import { Empresa } from "@/data/authAPI";
const { useGetAvisoObra, avisoObraInsert, avisoObraUpdate, avisoObraDelete } = ArtAPI;
import { getDefaultAvisoObra } from "./data/defaultAvisoObra";
import AvisosObraPdfGenerator from "./AvisoObraPdfGenerator";

const EMPRESA_TODAS_EMPRESAS_ID = -1;

const EMPRESA_OPCION_TODAS: Empresa = {
    empresaId: EMPRESA_TODAS_EMPRESAS_ID,
    cuit: 0,
    razonSocial: "Todas las Empresas",
    domicilio: "",
    localidad: "",
    provincia: "",
};

const AvisosObraHandler: React.FC = () => {
    const { empresas, isLoading: isLoadingEmpresas } = useEmpresasStore();
    const { user } = useAuth();
    const isAdmin = user?.rol?.toLowerCase() === "administrador";
    const empresaCUIT = user?.empresaCUIT;
    const empresaRazonSocial = user?.empresaRazonSocial;

    const opcionesEmpresaSelector = useMemo(
        () => [EMPRESA_OPCION_TODAS, ...empresas],
        [empresas]
    );

    const cuitsEmpresasRelacionadas = useMemo(
        () =>
            Array.from(
                new Set(
                    empresas
                        .map((e) => Number(e.cuit))
                        .filter((n) => Number.isFinite(n) && n !== 0)
                )
            ).sort((a, b) => a - b),
        [empresas]
    );

    const [empresaSeleccionada, setEmpresaSeleccionada] = useState<Empresa | null>(null);
    const seleccionAutomaticaRef = useRef(false);

    // Una sola empresa → selección automática; varias → "Todas las Empresas" por defecto
    useEffect(() => {
        if (isLoadingEmpresas) return;
        if (empresas.length === 1) {
            setEmpresaSeleccionada(empresas[0]);
            seleccionAutomaticaRef.current = true;
            return;
        }
        if (empresas.length === 0) {
            setEmpresaSeleccionada(null);
            seleccionAutomaticaRef.current = false;
            return;
        }
        setEmpresaSeleccionada((prev) => {
            if (!seleccionAutomaticaRef.current && prev !== null) return prev;
            return EMPRESA_OPCION_TODAS;
        });
        seleccionAutomaticaRef.current = true;
    }, [empresas, isLoadingEmpresas]);

    const handleEmpresaChange = (
        _event: React.SyntheticEvent,
        newValue: Empresa | null
    ) => {
        setEmpresaSeleccionada(newValue);
        seleccionAutomaticaRef.current = false;
    };

    const getEmpresaLabel = (empresa: Empresa | null): string => {
        if (!empresa) return "";
        if (empresa.empresaId === EMPRESA_TODAS_EMPRESAS_ID) return "Todas las Empresas";
        return `${empresa.razonSocial} - ${Formato.CUIP(empresa.cuit)}`;
    };

    const paramsAvisoObra = useMemo(() => {
        if (!empresaSeleccionada) return {};
        if (empresaSeleccionada.empresaId === EMPRESA_TODAS_EMPRESAS_ID) {
            return {
                todasLasEmpresas: true,
                esAdministrador: isAdmin,
                cuitsRelacionados: cuitsEmpresasRelacionadas,
            };
        }
        if (!empresaSeleccionada.cuit) return {};
        return { CUIT: empresaSeleccionada.cuit };
    }, [empresaSeleccionada, isAdmin, cuitsEmpresasRelacionadas]);

    const {
        data: avisoObraRawData,
        isLoading: isDataLoading,
        error: fetchError,
        mutate: refetchAvisos,
    } = useGetAvisoObra(paramsAvisoObra);
    const [avisosObrasArray, setAvisosObrasArray] = useState<AvisoObraRecord[]>([]);
    const [formData, setFormData] = useState<FormDataState>({ request: null });
    const [dialogPDF, setDialogPDF] = useState<React.ReactNode | null>(null);
    const [dialogError, setDialogError] = useState<React.ReactNode | null>(null);

    // apiQuery solo se usa para disparar mutaciones (Insert/Change/Delete)
    const [apiQuery, setApiQuery] = useState<ApiQueryState>({
        action: "Fetch", 
        timeStamp: new Date(),
    });
    // Sincronización de datos (SWR -> ESTADO LOCAL)
    useEffect(() => {
        if (!avisoObraRawData) {
            setAvisosObrasArray([]);
        } else if (Array.isArray(avisoObraRawData.data)) {
            setAvisosObrasArray(avisoObraRawData.data);
        }

        if (fetchError) {
            abrirError(fetchError);
        }
    }, [avisoObraRawData, fetchError]);

    // Efecto de MUTACIÓN (Insert/Change/Delete)
    useEffect(() => {
        const cerrarFormulario = (recarga: boolean) => {
            if (recarga) {
                refetchAvisos(); 
            }
            setFormData({ request: null });
        };
        
        // Evitamos ejecutar si es "Fetch" o no hay data
        if (apiQuery.action === "Fetch" || !apiQuery.data) return;

        const data = { ...apiQuery.data } as AvisoObraRecord; 
        const { action } = apiQuery;

        if ([Request.Insert, Request.Change, Request.Delete].includes(action as Request)) {
            const isInsert = action === Request.Insert;
            
            // Preparar payload: NO enviar 'interno' en INSERT
            const payload: Partial<AvisoObraRecord> = { ...data };
            if (isInsert) {
                 // El casting a any permite eliminar la propiedad opcional
                delete (payload as any).interno;
            }
            
            // Lógica de Petición HTTP usando gestionEmpleadorAPI
            let requestPromise: Promise<any>;
            
            if (isInsert) {
                requestPromise = avisoObraInsert(payload);
            } else if (action === Request.Change) {
                if (!data.interno) {
                    abrirError({ title: "Error", message: "El interno es requerido para actualizar" });
                    return;
                }
                requestPromise = avisoObraUpdate(data.interno, payload);
            } else { // Request.Delete
                if (!data.interno) {
                    abrirError({ title: "Error", message: "El interno es requerido para eliminar" });
                    return;
                }
                requestPromise = avisoObraDelete(data.interno);
            }
            
            requestPromise
                .then(async (response) => {
                    // Si hay confirmación (la fecha no es null), abrimos el PDF
                    if (data.confirmacionFecha != null) await abrirPDFAvisoDeObra(response);
                    cerrarFormulario(true);
                })
                .catch(async (error: AxiosError | any) => {
                    abrirError(error);
                });
        }
        
    }, [apiQuery, refetchAvisos]); // Dependencias: apiQuery y la función de recarga de SWR


    // 4. HANDLERS (EVENTOS)
    const abrirError = (error: ApiError | any) => {
        let title: string | undefined = error.title;
        let message: string | React.ReactNode | React.ReactNode[] = error.message;

        if (axios.isAxiosError(error)) { 
            title = "Error de Petición HTTP";
            message = error.response?.data?.message || error.message || "Error desconocido en la API.";
        }

        title ??= [error.code, error.type].filter((e: any) => e).join();
        title = title || "Error Desconocido";
        
        const handleCloseError = () => setDialogError(null);
        
        setDialogError(
            <Dialog open onClose={handleCloseError}>
                <DialogTitle>{title}</DialogTitle>
                <DialogContent dividers style={{ display: "flex" }}>
                    <Grid>{message}</Grid>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={handleCloseError}>
                        Cierra
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

    const abrirPDFAvisoDeObra = (record: AvisoObraRecord) => {
        setDialogPDF(
            <Dialog open  maxWidth={"md"} onClose={() => setDialogPDF(null)}>
                <DialogContent dividers style={{ display: "flex" }}>    
                    <AvisosObraPdfGenerator data={record} />
                </DialogContent>
                <DialogActions >
                    <CustomButton onClick={() => setDialogPDF(null)}>Cerrar</CustomButton>
                </DialogActions>
            </Dialog>
        );
    };

    /* Abre el formulario modal con la data del registro.*/
    const handleFormOpen = (request: Request, record: AvisoObraRecord) => {
        let currentRecord: AvisoObraRecord = { ...record }; 
        
        switch (request) {
            case Request.Change:
                if (currentRecord.confirmacionFecha) {
                    request = Request.Insert;
                    currentRecord.operacionTipo = "M"; // Modificación post-confirmación
                    currentRecord.confirmacionFecha = null;
                }
                break;
            case Request.Delete:
                if (currentRecord.confirmacionFecha) {
                    request = Request.Insert;
                    currentRecord.operacionTipo = "B"; // Baja post-confirmación
                    currentRecord.confirmacionFecha = null;
                }
                break;
            default:
                break;
        }

        // Rellenar datos estáticos del empleador (si no existen)
        const cuitParaUsar = empresaSeleccionada?.cuit ?? empresaCUIT;
        const razonSocialParaUsar = empresaSeleccionada?.razonSocial ?? empresaRazonSocial;
        currentRecord.empleadorCUIT = cuitParaUsar ?? currentRecord.empleadorCUIT ?? null;
        currentRecord.empleadorRazonSocial = razonSocialParaUsar ?? currentRecord.empleadorRazonSocial ?? null;
        
        setFormData({ request: request, data: currentRecord });
    };

    /* Cierra el formulario modal y dispara la mutación si la respuesta es Completed.*/
    const handleFormClose = (request: Request, response: Response, record: AvisoObraRecord) => {
        // 1. Cancelado o respuesta no relevante para mutación
        if (
            ![Request.Insert, Request.Change, Request.Delete].includes(request) ||
            response !== Response.Completed
        ) {
            setFormData({ request: null }); 
            return;
        }

        // 2. Validación de campos obligatorios
        const validationError: ApiError = {
            title: "Formulario incompleto.",
            message: [],
        };
        
        if (record.obraTipo === "") {
            (validationError.message as React.ReactNode[]).push(<Grid key="tipo">Debe especificar el tipo de aviso de obra.</Grid>);
        }
        if (!record.direccionPciaCodigo || record.direccionPciaCodigo === "") {
            (validationError.message as React.ReactNode[]).push(<Grid key="provincia">Debe especificar una provincia.</Grid>);
        }
        
        if ((validationError.message as React.ReactNode[]).length) {
            abrirError(validationError);
            return;
        }

        // 3. Pre-procesamiento de datos antes de la mutación
        if (record.operacionTipo === "A")
            record.recepcionFecha = record.confirmacionFecha;
            
        // 4. Disparar el efecto de mutación
        setApiQuery({
            data: record,
            timeStamp: new Date(),
            action: request,
        });

        // Opcional: Cerrar inmediatamente el formulario para evitar doble envío
        setFormData({ request: null });
    };
    
    // 5. RENDERIZADO PRINCIPAL
    
    // Muestra spinner de carga (solo si es la carga inicial)
    if (isDataLoading && avisosObrasArray.length === 0) {
        return (
            <Card variant="outlined">
                <CardContent style={{ textAlign: 'center', padding: '50px' }}>
                    <CircularProgress />
                    <p>Cargando avisos de obra...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card variant="outlined">
            <CardContent>
                <Grid container direction="column" rowSpacing={2}>
                    <Grid style={{ marginBottom: '16px' }}>
                        <Box sx={{ maxWidth: 500, marginBottom: 2 }}>
                            <CustomSelectSearch<Empresa>
                                options={opcionesEmpresaSelector}
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
                                        : opcionesEmpresaSelector.length <= 1
                                        ? "No hay empresas disponibles"
                                        : "No se encontraron empresas"
                                }
                                disabled={isLoadingEmpresas}
                            />
                        </Box>
                    </Grid>
                    <Grid  style={{ marginBottom: '16px' }}>
                        <CustomButton
                            variant="contained"
                            color="primary"
                            startIcon={<AddCircleOutline />}
                            onClick={() => handleFormOpen(Request.Insert, getDefaultAvisoObra())}
                            disabled={
                                isDataLoading ||
                                !empresaSeleccionada ||
                                empresaSeleccionada.empresaId === EMPRESA_TODAS_EMPRESAS_ID
                            }
                        >
                            Agregar Aviso
                        </CustomButton>
                    </Grid>
                    <Grid >
                        <AvisosObraList
                            data={avisosObrasArray} 
                            onInsert={() => handleFormOpen(Request.Insert, getDefaultAvisoObra())}
                            onChange={(r) => handleFormOpen(Request.Change, r)}
                            onDelete={(r) => handleFormOpen(Request.Delete, r)}
                            onView={(r) => handleFormOpen(Request.View, r)}
                            onPdf={(record) => abrirPDFAvisoDeObra(record)}
                        />
                    </Grid>
                </Grid>
                {/* Modales (Formulario, PDF y Error) */}
                {formData.request && formData.data && (
                    <AvisoObraForm
                        request={formData.request} 
                        data={formData.data} 
                        onClose={handleFormClose}
                        open={true} 
                    />
                )}
                {dialogPDF}
                {dialogError}
            </CardContent>
        </Card>
    );
};

export default AvisosObraHandler;