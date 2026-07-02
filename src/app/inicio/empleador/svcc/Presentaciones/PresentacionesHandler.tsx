import { useEffect, useMemo, useState } from "react";
import { Grid, Typography } from "@mui/material";
import CustomTabs from "@/utils/ui/tab/CustomTab";
import Formato from "@/utils/Formato";
import PresentacionBrowse from "./PresentacionesBrowse";
import { useSVCCPresentacionContext } from "../context";
import IniciarHandler from "../Iniciar/IniciarHandler";
import PortadaHandler from "../Portada/PortadaHandler";
import AnexoVHandler from "../AnexoV/AnexoVHandler";
import NominasHandler from '../Nomina/NominasHandler';
import FinalizarHandler from "../Finalizar/FinalizarHandler";
import ConstanciaHandler from "../Constancia/ConstanciaHandler";

export default function PresentacionesHandler() {
  const [currentTab, setCurrentTab] = useState(0);// Queremos que inicie en la primera pestaña (0)
  const { presentacion, ultima } = useSVCCPresentacionContext();
  const presentacionSeleccionadaInterno = presentacion.selected?.interno ?? 0;
  const presentacionSeleccionadaPendiente = presentacionSeleccionadaInterno > 0
    && presentacion.selected?.presentacionFecha == null;

  const disabled = useMemo(() => ({
    inicio: ultima.isLoading || ultima.isValidating || ultima.data?.interno !== presentacion.selected?.interno,
    finaliza: !presentacionSeleccionadaPendiente,
    presentacion: presentacion.selected == null,
  }), [
    ultima.isLoading,
    ultima.isValidating,
    ultima.data,
    presentacion.selected,
    presentacionSeleccionadaPendiente,
  ]);

  useEffect(() => {
    if (disabled.presentacion) {
      setCurrentTab(0);
    } else if ((currentTab === 0 && disabled.inicio) || (currentTab === 4 && disabled.finaliza)) {
      setCurrentTab(1);
    }
  }, [currentTab, disabled]);

  return (
    <Grid size={12}>
      <Grid size={12}>
        <PresentacionBrowse
          isLoading={presentacion.isLoading || presentacion.isValidating}
          data={presentacion.data}
          onPageIndexChange={presentacion.setPageIndex}
          onPageSizeChange={presentacion.setPageSize}
          onSelectedRowChange={(_k, select) => presentacion.setSelected(select)}
        />
      </Grid>
      <Grid size={12}>
        {presentacion.selected == null
          ? (<Typography color="info">Sin presentación seleccionada</Typography>)
          : (<Typography color="info">Presentación: {
            presentacion.selected.presentacionFecha
              ? (Formato.Fecha(presentacion.selected.presentacionFecha))
              : "Pendiente"
          }</Typography>)
        }
      </Grid>
      <Grid size={12}>
        {(presentacion.data?.data?.length ?? 0) > 0 && presentacion.selected == null
          ? (<Typography color="error">Debe seleccionar una presentacion</Typography>)
          : (
            <CustomTabs
              currentTab={currentTab}
              onTabChange={(_event, tab) => setCurrentTab(tab)}
              tabs={[
                {
                  label: 'Inicio',
                  value: 0,
                  content: <IniciarHandler />,
                  disabled: disabled.inicio,
                },
                {
                  label: 'Portada',
                  value: 1,
                  content: <PortadaHandler />,
                  disabled: disabled.presentacion,
                },
                {
                  label: 'Anexo V',
                  value: 2,
                  content: <AnexoVHandler />,
                  disabled: disabled.presentacion,
                },
                {
                  label: 'Nóminas',
                  value: 3,
                  content: <NominasHandler />,
                  disabled: disabled.presentacion,
                },
                {
                  label: 'Confirma',
                  value: 4,
                  content: <FinalizarHandler />,
                  disabled: disabled.finaliza,
                },
                {
                  label: 'Constancia',
                  value: 5,
                  content: <ConstanciaHandler />,
                  disabled: disabled.presentacion,
                },
              ]}
            />
          )
        }
      </Grid>
    </Grid>
  );
}
