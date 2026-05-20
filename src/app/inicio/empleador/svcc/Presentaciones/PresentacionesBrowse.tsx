import { PresentacionDTO } from "@/data/gestionEmpleadorAPI";
import Browse, { defaultActionsColumns } from "@/utils/ui/table/Browse";
import Formato from "@/utils/Formato";

export const PresentacionBrowse = Browse<PresentacionDTO>(
  (props) => {
    return [
      { accessorKey: "interno", header: "Código identificativo" },
      { accessorKey: "empleadorCuit", header: "CUIT", cell({ getValue }) { return Formato.CUIP(getValue<number>()) } },
      { accessorKey: "empleadorRazonSocial", header: "Razón Social" },
      {
        accessorKey: "presentacionFecha",
        header: "Fecha de presentación",
        cell({ getValue }) {
          const v = getValue<string | undefined>();
          return v ? Formato.Fecha(v) : "Pendiente"
        }
      },
      { accessorKey: "observaciones", header: "Observaciones" },
      ...defaultActionsColumns<PresentacionDTO>(props),
    ]
  }
);

export default PresentacionBrowse;
