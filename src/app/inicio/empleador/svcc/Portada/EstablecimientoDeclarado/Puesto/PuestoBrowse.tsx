import { PuestoDTO } from "@/data/gestionEmpleadorAPI";
import Browse, { defaultActionsColumns } from "@/utils/ui/table/Browse";

export const PuestoBrowse = Browse<PuestoDTO>(
  (props) => [
    { accessorKey: "nombre", header: "Nombre" },
    {
      accessorKey: "ciuo88",
      header: "CIUO",
      cell: ({ row }) => {
        const puesto = row.original as PuestoDTO & { ciuO88?: number; ciuo88?: number };
        return puesto.ciuo ?? puesto.ciuO88 ?? puesto.ciuo88 ?? "";
      },
    },
    ...defaultActionsColumns<PuestoDTO>(props),
  ]
);

export default PuestoBrowse;
