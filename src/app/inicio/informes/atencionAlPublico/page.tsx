 "use client"
 import React from "react";
 import {
   Accordion,
   AccordionActions,
   AccordionDetails,
   AccordionSummary,
   Grid,
   Paper,
   Typography,
 } from "@mui/material";
 import { MdExpandMore } from "react-icons/md";
 import { DataContextProvider, useDataContext } from "./dataContext";
 import DataTable from "@/utils/ui/table/DataTable";
 import CustomButton from '@/utils/ui/button/CustomButton';
 import QueryBuilder from '@/utils/ui/queryBuilder/QueryBuilder';
import styles from '../informes.module.css';
import { BsSliders } from "react-icons/bs";

 function AtencionAlPublicoQueryBuilder() {
   const { fields, query: { state: query, setState: setQuery } } = useDataContext();
   return <QueryBuilder fields={fields} query={query} onQueryChange={setQuery} />
 }

 function AtencionAlPublicoTable() {
   const { columns, rows } = useDataContext();
   return <DataTable data={rows} columns={columns} />;
 }

function AtencionAlPublicoPageInner() {
  const {
    dialog,
    rows: { length: habilita },
    proposition,
    filtro,
    onLookupFiltro,
    onGuardaFiltro,
    onEliminaFiltro,
    onAplicaFiltro,
    onLimpiaFiltro,
    onExport,
  } = useDataContext();
  return (
    <Grid container spacing={1} size="grow">
      <Grid size={12}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<MdExpandMore className={styles.accordionIcon} />} aria-controls="panel1-content" id="panel1-header">
            <Grid container spacing={1} alignItems="center">
              <BsSliders size={20}/>
              <Typography component="span" className={styles.accordionTitle} >Configuración de Filtros</Typography>
            </Grid>
          </AccordionSummary>
          
           <AccordionDetails>
              <Grid container spacing={3} size="grow" >
                <Grid size={12} className={styles.orangeBG}>
                  <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                    <Grid>
                      <Typography
                        className={styles.filtersInfo}
                        color={filtro == null ? "textDisabled" : "success"}
                      >
                        {filtro?.nombre ? (
                          <>Filtro cargado: <span className={styles.accentuatedText}>{filtro?.nombre}</span></>
                        ) : (
                          "Sin filtro seleccionado"
                        )}
                      </Typography>
                    </Grid>

                    <Grid>
                      <Grid container spacing={2} alignItems="center" justifyContent="flex-end">
                        <Grid>
                          <CustomButton onClick={onLookupFiltro}>Elegir Filtro</CustomButton>
                        </Grid>
                        <Grid>
                          <CustomButton onClick={onEliminaFiltro} disabled={filtro == null}>
                            Eliminar Filtro
                          </CustomButton>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>

                <Grid size={12}>
                  <AtencionAlPublicoQueryBuilder />
                </Grid>
                <Grid container size={12} spacing={2} justifyContent="space-between">
                  <Grid container spacing={2}>
                    <CustomButton onClick={onAplicaFiltro}>Aplicar Filtro</CustomButton>
                    <CustomButton onClick={onLimpiaFiltro}>Limpiar Filtro</CustomButton>
                    <CustomButton onClick={onGuardaFiltro} disabled={!proposition}>
                      Guardar Filtro
                    </CustomButton>
                  </Grid>
                  <CustomButton width="auto" onClick={onExport} disabled={!habilita}>Exportar a Excel</CustomButton>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          <Paper>
            <AtencionAlPublicoTable />
          </Paper>
       </Grid>
       {dialog}
     </Grid>
   );
 }

 export default function SiniestrosPage() {
   return (
     <DataContextProvider>
       <AtencionAlPublicoPageInner />
     </DataContextProvider>
   );
 }