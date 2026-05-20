'use client';
import React, { Fragment } from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import CabeceraFormulario from './CabeceraFormulario';
import type { CabeceraData, ImpresionProps, DetalleRow } from './types/impresion';

const styles = StyleSheet.create({
  page: { backgroundColor: 'white', padding: 10 },
  hStrip: { backgroundColor: '#83BC00', width: '98%', marginTop: 8, marginBottom: 4 },
  stripText: { color: 'white', fontWeight: 'bold', fontSize: 11, textAlign: 'center', paddingVertical: 2 },

  table: { width: '98%', borderWidth: 1, borderColor: '#777', fontSize: 8, marginBottom: 4 },
  row: { flexDirection: 'row' },
  th: { backgroundColor: '#e9f2e2', fontWeight: 'bold' },
  cell: { borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#777', padding: 2, textAlign: 'left' },

  cNro: { width: '8%' },
  cPregunta: { width: '44%' },
  cResp: { width: '14%' },
  cFecha: { width: '16%' },
  cNorma: { width: '18%' },

  cCod: { width: '15%' },
  cSus: { width: '60%' },
  cSiNo: { width: '25%' },

  cCodC: { width: '15%' },
  cSusC: { width: '45%' },
  cSiNoC: { width: '20%' },
  cNormaC: { width: '20%' },

  cLegajo: { width: '25%' },
  cGremio: { width: '75%' },

  cCUIT: { width: '30%' },
  cContr: { width: '70%' },

  cRespCUIT: { width: '16%' },
  cRespNom: { width: '22%' },
  cRespCargo: { width: '16%' },
  cRespRep: { width: '12%' },
  cRespPropio: { width: '10%' },
  cRespTit: { width: '12%' },
  cRespMat: { width: '6%' },
  cRespEnt: { width: '16%' },
});

const ImpresionFormulario: React.FC<ImpresionProps> = (props) => {
  const { cabecera, detalle, planillaA, planillaB, planillaC, gremios, contratistas, responsables } = props;

  /* ===== DETALLE PRINCIPAL, agrupado por sección, con UNA TABLA por sección ===== */
  const TablaDetalle = () => {
    // Agrupamos preservando orden (asumimos que viene ordenado por CategoriaOrden y Nro)
    const groups: { key: string; rows: DetalleRow[] }[] = [];
    let currKey = '__INIT__';
    let bucket: DetalleRow[] = [];
    (detalle ?? []).forEach((row) => {
      const k = row.Categoria || 'SECCIÓN';
      if (k !== currKey) {
        if (bucket.length) groups.push({ key: currKey, rows: bucket });
        currKey = k;
        bucket = [];
      }
      bucket.push(row);
    });
    if (bucket.length) groups.push({ key: currKey, rows: bucket });

    return (
      <>

        {groups.map((g, gi) => (
          <Fragment key={gi}>
            <View style={styles.hStrip}>
              <Text style={styles.stripText}>{g.key || 'SECCIÓN'}</Text>
            </View>

            <View style={styles.table}>
              <View style={[styles.row, styles.th]}>
                <Text style={[styles.cell, styles.cNro]}>NRO</Text>
                <Text style={[styles.cell, styles.cPregunta]}>PREGUNTA</Text>
                <Text style={[styles.cell, styles.cResp]}>RESPUESTA</Text>
                <Text style={[styles.cell, styles.cFecha]}>FECHA</Text>
                <Text style={[styles.cell, styles.cNorma]}>NORMA VIGENTE</Text>
              </View>

              {g.rows.map((r) => (
                <View key={`${g.key}-${r.Nro}`} style={styles.row} wrap={false}>
                  <Text style={[styles.cell, styles.cNro]}>{r.Nro}</Text>
                  <Text style={[styles.cell, styles.cPregunta]}>{r.Pregunta || '—'}</Text>
                  <Text style={[styles.cell, styles.cResp]}>{r.Respuesta || '—'}</Text>
                  <Text style={[styles.cell, styles.cFecha]}>{r.FechaRegularizacion || ''}</Text>
                  <Text style={[styles.cell, styles.cNorma]}>{r.NormaVigente || '—'}</Text>
                </View>
              ))}
            </View>
          </Fragment>
        ))}
      </>
    );
  };

  //PLANILLAS Y OTRAS TABLAS, UNA TABLA CONTINUA CADA UNA 

  const TablaPlanillaA = () => (
    <>
      <View style={styles.hStrip}>
        <Text style={styles.stripText}>PLANILLA A - LISTADO DE SUSTANCIAS Y AGENTES CANCERÍGENOS (Res. SRT 81/2019)</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.row, styles.th]}>
          <Text style={[styles.cell, styles.cCod]}>Código</Text>
          <Text style={[styles.cell, styles.cSus]}>Sustancia</Text>
          <Text style={[styles.cell, styles.cSiNo]}>Sí/No</Text>
        </View>

        {planillaA.map((r, i) => (
          <View key={i} style={styles.row}>
            <Text style={[styles.cell, styles.cCod]}>{r.Codigo}</Text>
            <Text style={[styles.cell, styles.cSus]}>{r.Sustancia}</Text>
            <Text style={[styles.cell, styles.cSiNo]}>{r.SiNo}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const TablaPlanillaB = () => (
    <>
      <View style={styles.hStrip}>
        <Text style={styles.stripText}>PLANILLA B - DIFENILOS POLICLORADOS (Res. SRT 497/03)</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.row, styles.th]}>
          <Text style={[styles.cell, styles.cCod]}>Código</Text>
          <Text style={[styles.cell, styles.cSus]}>Sustancia</Text>
          <Text style={[styles.cell, styles.cSiNo]}>Sí/No</Text>
        </View>
      </View>
    </>
  );

  const TablaPlanillaC = () => (
    <>
      <View style={styles.hStrip}>
        <Text style={styles.stripText}>PLANILLA C - SUSTANCIAS QUÍMICAS A DECLARAR (Res. SRT 743/03)</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.row, styles.th]}>
          <Text style={[styles.cell, styles.cCodC]}>Código</Text>
          <Text style={[styles.cell, styles.cSusC]}>Sustancia</Text>
          <Text style={[styles.cell, styles.cSiNoC]}>Sí/No</Text>
          <Text style={[styles.cell, styles.cNormaC]}>Norma Vigente</Text>
        </View>

        {planillaC.map((r, i) => (
          <View key={i} style={styles.row}>
            <Text style={[styles.cell, styles.cCodC]}>{r.Codigo}</Text>
            <Text style={[styles.cell, styles.cSusC]}>{r.Sustancia}</Text>
            <Text style={[styles.cell, styles.cSiNoC]}>{r.SiNo}</Text>
            <Text style={[styles.cell, styles.cNormaC]}>{r.NormaVigente}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const TablaGremios = () => (
    <>
      <View style={styles.hStrip}><Text style={styles.stripText}>REPRESENTACIÓN GREMIAL</Text></View>

      <View style={styles.table}>
        <View style={[styles.row, styles.th]}>
          <Text style={[styles.cell, styles.cLegajo]}>LEGAJO</Text>
          <Text style={[styles.cell, styles.cGremio]}>GREMIO</Text>
        </View>

        {gremios.map((g, i) => (
          <View key={i} style={styles.row}>
            <Text style={[styles.cell, styles.cLegajo]}>{g.Legajo}</Text>
            <Text style={[styles.cell, styles.cGremio]}>{g.Nombre}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const TablaContratistas = () => (
    <>
      <View style={styles.hStrip}><Text style={styles.stripText}>CONTRATISTAS</Text></View>

      <View style={styles.table}>
        <View style={[styles.row, styles.th]}>
          <Text style={[styles.cell, styles.cCUIT]}>CUIT</Text>
          <Text style={[styles.cell, styles.cContr]}>RAZÓN SOCIAL</Text>
        </View>

        {contratistas.map((c, i) => (
          <View key={i} style={styles.row}>
            <Text style={[styles.cell, styles.cCUIT]}>{c.CUIT}</Text>
            <Text style={[styles.cell, styles.cContr]}>{c.Contratista}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const TablaResponsables = () => (
    <>
      <View style={styles.hStrip}><Text style={styles.stripText}>DATOS DE LOS PROFESIONALES / RESPONSABLES</Text></View>

      <View style={styles.table}>
        <View style={[styles.row, styles.th]}>
          <Text style={[styles.cell, styles.cRespCUIT]}>CUIT/CUIL</Text>
          <Text style={[styles.cell, styles.cRespNom]}>Nombre y Apellido</Text>
          <Text style={[styles.cell, styles.cRespCargo]}>Cargo</Text>
          <Text style={[styles.cell, styles.cRespRep]}>Representación</Text>
          <Text style={[styles.cell, styles.cRespPropio]}>Propio/Contrat.</Text>
          <Text style={[styles.cell, styles.cRespTit]}>Título Habilitante</Text>
          <Text style={[styles.cell, styles.cRespMat]}>Matrícula</Text>
          <Text style={[styles.cell, styles.cRespEnt]}>Entidad</Text>
        </View>

        {responsables.map((r, i) => (
          <View key={i} style={styles.row}>
            <Text style={[styles.cell, styles.cRespCUIT]}>{r.CUITCUIL}</Text>
            <Text style={[styles.cell, styles.cRespNom]}>{r.NombreApellido}</Text>
            <Text style={[styles.cell, styles.cRespCargo]}>{r.Cargo}</Text>
            <Text style={[styles.cell, styles.cRespRep]}>{r.Representacion}</Text>
            <Text style={[styles.cell, styles.cRespPropio]}>{r.PropioContratado}</Text>
            <Text style={[styles.cell, styles.cRespTit]}>{r.TituloHabilitante}</Text>
            <Text style={[styles.cell, styles.cRespMat]}>{r.Matricula}</Text>
            <Text style={[styles.cell, styles.cRespEnt]}>{r.EntidadOtorgante}</Text>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* CABECERA */}
        <CabeceraFormulario {...cabecera} />

        {/* DETALLE PRINCIPAL */}
        <TablaDetalle />
      </Page>

      <Page size="A4" style={styles.page} wrap>
        {!!planillaA.length && <TablaPlanillaA />}
        {!!planillaC.length && <TablaPlanillaC />}
        {!!gremios.length && <TablaGremios />}
        {!!contratistas.length && <TablaContratistas />}
        {!!responsables.length && <TablaResponsables />}
      </Page>
    </Document>
  );
};

export default ImpresionFormulario;
