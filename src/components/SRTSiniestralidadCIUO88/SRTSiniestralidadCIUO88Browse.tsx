import { SRTSiniestralidadCIUO88 } from "@/data/srtAPI";
import Browse, { defaultActionsColumns } from "@/utils/ui/table/Browse";

export const SRTSiniestralidadCIUO88Browse = Browse<SRTSiniestralidadCIUO88>(
  (props) => [
    { accessorKey: "ciuO88", header: "CIUO" },
    { accessorKey: "descripcion", header: "Descripción" },
    ...defaultActionsColumns<SRTSiniestralidadCIUO88>(props),
  ]
);

export default SRTSiniestralidadCIUO88Browse;
