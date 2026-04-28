import { useState, useCallback, useMemo } from "react";
import { TextField, IconButton, Box } from "@mui/material";
import { ColumnDef } from "@tanstack/react-table";
import { MdModeEdit, MdDelete } from "react-icons/md";
import DatosEstablecimiento from "./cabecera/datosEstablecimiento";
import { PantallaAdministrativaProps } from "../pantallasAdministrativas/types/pantallaAdministrativa";
import CustomButton from "@/utils/ui/button/CustomButton";
import DataTable from "@/utils/ui/table/DataTable";
import CabeceraComun from "../CabeceraComun";
import trasladoStyles from "../pantallasAdministrativas/solicitudTraslado.module.css";
import denunciasStyles from "../../denuncias.module.css";

type InosItem = {
    id: number;
    codigo: string;
    descripcion: string;
    cantidad: string;
    valor: string;
    vencimiento: string;
};

type SolicitudAtencionProps = PantallaAdministrativaProps;

export default function SolicitudAtencionMedica({
    denunciaNro,
    empleadoNombre,
    empleadoCuil,
    empleadoDocTipo,
    empleadoDocNumero,
    empleadorCuit,
    empleadorRazonSocial,
    cabecera,
}: SolicitudAtencionProps) {
    const trabajador = cabecera?.trabajador;
    const empleador = cabecera?.empleador;
    const establecimiento = cabecera?.establecimiento;
    const siniestro = cabecera?.siniestro;
    const [comentario, setComentario] = useState("");
    const [inos, setInos] = useState("");
    const [inosDescripcion, setInosDescripcion] = useState("");
    const [cantidad, setCantidad] = useState("");
    const [valor, setValor] = useState("0.00");
    const [vencimiento, setVencimiento] = useState("");
    const [items, setItems] = useState<InosItem[]>([]);
    const [nextId, setNextId] = useState(1);

    const handleAgregar = () => {
        if (!inos) return;
        setItems(prev => [...prev, { id: nextId, codigo: inos, descripcion: inosDescripcion, cantidad, valor, vencimiento }]);
        setNextId(n => n + 1);
        setInos("");
        setInosDescripcion("");
        setCantidad("");
        setValor("0.00");
        setVencimiento("");
    };

    const handleDelete = useCallback((id: number) => {
        setItems(prev => prev.filter(item => item.id !== id));
    }, []);

    const columns: ColumnDef<InosItem>[] = useMemo(() => [
        { accessorKey: "codigo", header: "Código", meta: { width: "12%" } },
        { accessorKey: "descripcion", header: "Descripción", meta: { width: "35%" } },
        { accessorKey: "cantidad", header: "Cantidad", meta: { width: "10%", align: "center" } },
        { accessorKey: "valor", header: "Valor", meta: { width: "10%", align: "right" } },
        { accessorKey: "vencimiento", header: "Vencimiento", meta: { width: "13%", align: "center" } },
        {
            id: "accion",
            header: "Acción",
            meta: { width: "10%", align: "center" },
            cell: ({ row }) => (
                <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                    <IconButton size="small" sx={{ color: "#ff6600" }}>
                        <MdModeEdit size={20} />
                    </IconButton>
                    <IconButton size="small" sx={{ color: "#d32f2f" }} onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id); }}>
                        <MdDelete size={20} />
                    </IconButton>
                </Box>
            ),
        },
    ], [handleDelete]);

    return (
        <div className={trasladoStyles.container}>
            <CabeceraComun denunciaNro={denunciaNro} />

            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Datos del empleador</div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="C.U.I.T." value={String(empleador?.cuit ?? empleadorCuit ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.wideField}>
                        <TextField label="Razón social" value={empleador?.razonSocial ?? empleadorRazonSocial ?? ""} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Póliza" value={String(empleador?.poliza ?? "")} fullWidth disabled />
                    </div>
                </div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.wideField}>
                        <TextField label="Domicilio: Calle" value={empleador?.domicilioCalle ?? ""} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Nro" value={String(empleador?.domicilioNro ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Piso" value={String(empleador?.domicilioPiso ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactFieldSmall}>
                        <TextField label="Dpto" value={empleador?.domicilioDpto ?? ""} fullWidth disabled />
                    </div>
                </div>
                <div className={denunciasStyles.formRow}>
                    <TextField label="Teléfonos" value={empleador?.telefonos ?? ""} fullWidth disabled />
                </div>
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Datos del trabajador</div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="C.U.I.L." value={String(trabajador?.cuil ?? empleadoCuil ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.wideField}>
                        <TextField label="Nombre" value={trabajador?.nombre ?? empleadoNombre ?? ""} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Documento" value={trabajador?.docTipo ?? empleadoDocTipo ?? ""} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactFieldSmall}>
                        <TextField label="" value={String(trabajador?.docNumero ?? empleadoDocNumero ?? "")} fullWidth disabled />
                    </div>
                </div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.wideField}>
                        <TextField label="Domicilio: Calle" value={trabajador?.domicilioCalle ?? ""} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Nro" value={String(trabajador?.domicilioNro ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="Piso" value={String(trabajador?.domicilioPiso ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.compactFieldSmall}>
                        <TextField label="Dpto" value={trabajador?.domicilioDpto ?? ""} fullWidth disabled />
                    </div>
                </div>
                <div className={denunciasStyles.formRow}>
                    <TextField label="Puesto de trabajo" value="" fullWidth disabled />
                </div>
            </div>

            <div className={trasladoStyles.sectionBox}>
                <DatosEstablecimiento
                    cuit={establecimiento?.cuit}
                    razonSocial={establecimiento?.razonSocial}
                    domicilioCalle={establecimiento?.domicilioCalle}
                    domicilioNro={establecimiento?.domicilioNro}
                    domicilioPiso={establecimiento?.domicilioPiso}
                    domicilioDpto={establecimiento?.domicilioDpto}
                />
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                        <div className={denunciasStyles.sectionTitle}>Siniestro:</div>
                        <div className={denunciasStyles.formRow}>
                            <TextField label="El día:" value={siniestro?.dia ?? ""} fullWidth disabled />
                            <TextField label="A las:" value={siniestro?.hora ?? ""} fullWidth disabled />
                        </div>
                        <TextField value={siniestro?.descripcion ?? ""} multiline rows={4} fullWidth disabled />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className={denunciasStyles.sectionTitle}>Comentario</div>
                        <TextField
                            multiline
                            rows={6}
                            fullWidth
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.formRow} style={{ alignItems: "center" }}>
                    <div className={denunciasStyles.compactField}>
                        <TextField
                            label="Inos"
                            value={inos}
                            onChange={(e) => setInos(e.target.value)}
                            fullWidth
                        />
                    </div>
                    <div style={{ flex: 2, minWidth: 200 }}>
                        <TextField
                            label="Descripción"
                            value={inosDescripcion}
                            onChange={(e) => setInosDescripcion(e.target.value)}
                            fullWidth
                        />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField
                            label="Cantidad"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            fullWidth
                        />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField
                            label="Valor"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            fullWidth
                        />
                    </div>
                    <div className={denunciasStyles.compactFieldSmall}>
                        <TextField
                            label="Vencimiento"
                            type="date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={vencimiento}
                            onChange={(e) => setVencimiento(e.target.value)}
                            fullWidth
                        />
                    </div>
                </div>
                <div style={{ marginTop: 6 }}>
                    <CustomButton onClick={handleAgregar}>Agregar</CustomButton>
                </div>
            </div>

            <DataTable
                data={items}
                columns={columns}
                size="small"
                enableFiltering={false}
                rowKeyField="id"
            />
        </div>
    );
}
