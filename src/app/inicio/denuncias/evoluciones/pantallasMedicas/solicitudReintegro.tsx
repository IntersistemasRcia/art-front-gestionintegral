import { useState } from "react";
import { TextField, Checkbox, FormControlLabel } from "@mui/material";
import { PantallaAdministrativaProps } from "../pantallasAdministrativas/types/pantallaAdministrativa";
import CabeceraComun from "../CabeceraComun";
import trasladoStyles from "../pantallasAdministrativas/solicitudTraslado.module.css";
import denunciasStyles from "../../denuncias.module.css";

type GastoRow = {
    id: number;
    detalle: string;
    detalleFixed: boolean;
    fecha: string;
    monto: string;
    prestador: string;
};

const GASTOS_INICIALES: GastoRow[] = [
    { id: 1, detalle: "Pasajes",      detalleFixed: true,  fecha: "", monto: "0.00", prestador: "" },
    { id: 2, detalle: "Hospedaje",    detalleFixed: true,  fecha: "", monto: "0.00", prestador: "" },
    { id: 3, detalle: "Medicamentos", detalleFixed: true,  fecha: "", monto: "0.00", prestador: "" },
    { id: 4, detalle: "Viáticos",     detalleFixed: true,  fecha: "", monto: "0.00", prestador: "" },
    { id: 5, detalle: "Otros",        detalleFixed: true,  fecha: "", monto: "0.00", prestador: "" },
    { id: 6, detalle: "",             detalleFixed: false, fecha: "", monto: "0.00", prestador: "" },
    { id: 7, detalle: "",             detalleFixed: false, fecha: "", monto: "0.00", prestador: "" },
];

const COL_GRID = "140px 1fr 110px 1fr";

type SolicitudReintegroProps = PantallaAdministrativaProps;

export default function SolicitudReintegro({
    denunciaNro,
    empleadorCuit,
    empleadorRazonSocial,
    cabecera,
}: SolicitudReintegroProps) {
    const empleador = cabecera?.empleador;
    const [cuitSolicitante, setCuitSolicitante] = useState("");
    const [nombreSolicitante, setNombreSolicitante] = useState("");
    const [telefonos, setTelefonos] = useState("");
    const [fechaAccidente, setFechaAccidente] = useState("");
    const [nroSiniestro, setNroSiniestro] = useState("");

    const [useCheque, setUseCheque] = useState(false);
    const [beneficiario, setBeneficiario] = useState("");
    const [useAcreditacion, setUseAcreditacion] = useState(false);
    const [cbuInfo, setCbuInfo] = useState("");
    const [tipoCuenta, setTipoCuenta] = useState("");
    const [nroCuenta, setNroCuenta] = useState("");

    const [gastos, setGastos] = useState<GastoRow[]>(GASTOS_INICIALES);
    const [observaciones, setObservaciones] = useState("");

    const updateGasto = (id: number, field: keyof GastoRow, value: string) => {
        setGastos(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const total = gastos
        .reduce((sum, row) => sum + (parseFloat(row.monto) || 0), 0)
        .toFixed(2);

    return (
        <div className={trasladoStyles.container}>
            <CabeceraComun denunciaNro={denunciaNro} />
            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Empresa</div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.compactField}>
                        <TextField label="C.U.I.T." value={String(empleador?.cuit ?? empleadorCuit ?? "")} fullWidth disabled />
                    </div>
                    <div className={denunciasStyles.wideField}>
                        <TextField label="Razón social" value={empleador?.razonSocial ?? empleadorRazonSocial ?? ""} fullWidth disabled />
                    </div>
                </div>
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Datos del solicitante (Empresa aseguradora o accidentado)</div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.compactField}>
                        <TextField
                            label="C.U.I.T."
                            value={cuitSolicitante}
                            onChange={(e) => setCuitSolicitante(e.target.value)}
                            fullWidth
                        />
                    </div>
                    <div className={denunciasStyles.wideField}>
                        <TextField
                            label="Nombre completo"
                            value={nombreSolicitante}
                            onChange={(e) => setNombreSolicitante(e.target.value)}
                            fullWidth
                        />
                    </div>
                </div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.wideField}>
                        <TextField
                            label="Teléfonos"
                            value={telefonos}
                            onChange={(e) => setTelefonos(e.target.value)}
                            fullWidth
                        />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField
                            label="Fecha del accidente"
                            type="date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={fechaAccidente}
                            onChange={(e) => setFechaAccidente(e.target.value)}
                            fullWidth
                        />
                    </div>
                    <div className={denunciasStyles.compactField}>
                        <TextField
                            label="Nº Siniestro"
                            value={nroSiniestro}
                            onChange={(e) => setNroSiniestro(e.target.value)}
                            fullWidth
                        />
                    </div>
                </div>
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Forma de cobro (marque opción)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                    <FormControlLabel
                        control={<Checkbox checked={useCheque} onChange={(e) => setUseCheque(e.target.checked)} />}
                        label="Cheque (indicar beneficiario)"
                    />
                    <TextField
                        label="Beneficiario"
                        value={beneficiario}
                        onChange={(e) => setBeneficiario(e.target.value)}
                        disabled={!useCheque}
                        style={{ flex: 1 }}
                    />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                    <FormControlLabel
                        control={<Checkbox checked={useAcreditacion} onChange={(e) => setUseAcreditacion(e.target.checked)} />}
                        label="Acreditación en cuenta (deberá enviar CBU e informar tipo de cuenta)"
                    />
                    <TextField
                        value={cbuInfo}
                        onChange={(e) => setCbuInfo(e.target.value)}
                        disabled={!useAcreditacion}
                        style={{ flex: 1 }}
                    />
                </div>
                <div className={denunciasStyles.formRow}>
                    <div className={denunciasStyles.wideField}>
                        <TextField
                            label="Tipo de Cuenta"
                            value={tipoCuenta}
                            onChange={(e) => setTipoCuenta(e.target.value)}
                            disabled={!useAcreditacion}
                            fullWidth
                        />
                    </div>
                    <div className={denunciasStyles.wideField}>
                        <TextField
                            label="Nº de Cuenta"
                            value={nroCuenta}
                            onChange={(e) => setNroCuenta(e.target.value)}
                            disabled={!useAcreditacion}
                            fullWidth
                        />
                    </div>
                </div>
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Detalle de gastos</div>

                <div style={{ display: "grid", gridTemplateColumns: COL_GRID, gap: 6, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: "#0f2d8f", fontSize: 13 }}>Fecha</span>
                    <span style={{ fontWeight: 700, color: "#0f2d8f", fontSize: 13 }}>Detalle</span>
                    <span style={{ fontWeight: 700, color: "#0f2d8f", fontSize: 13 }}>Monto</span>
                    <span style={{ fontWeight: 700, color: "#0f2d8f", fontSize: 13 }}>Nombre de Prestador / Nº Factura</span>
                </div>

                {gastos.map((row) => (
                    <div key={row.id} style={{ display: "grid", gridTemplateColumns: COL_GRID, gap: 6, marginBottom: 6 }}>
                        <TextField
                            type="date"
                            size="small"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={row.fecha}
                            onChange={(e) => updateGasto(row.id, "fecha", e.target.value)}
                        />
                        <TextField
                            size="small"
                            value={row.detalle}
                            disabled={row.detalleFixed}
                            onChange={(e) => updateGasto(row.id, "detalle", e.target.value)}
                        />
                        <TextField
                            size="small"
                            value={row.monto}
                            onChange={(e) => updateGasto(row.id, "monto", e.target.value)}
                            slotProps={{ htmlInput: { style: { textAlign: "right" } } }}
                        />
                        <TextField
                            size="small"
                            value={row.prestador}
                            onChange={(e) => updateGasto(row.id, "prestador", e.target.value)}
                        />
                    </div>
                ))}

                <div style={{ display: "grid", gridTemplateColumns: COL_GRID, gap: 6, marginTop: 4 }}>
                    <span />
                    <span style={{ textAlign: "right", fontWeight: 700, fontSize: 13, alignSelf: "center", paddingRight: 8 }}>Totales:</span>
                    <TextField
                        size="small"
                        value={total}
                        disabled
                        slotProps={{ htmlInput: { style: { textAlign: "right" } } }}
                    />
                    <span />
                </div>
            </div>

            <div className={trasladoStyles.sectionBox}>
                <div className={denunciasStyles.sectionTitle}>Observaciones</div>
                <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className={trasladoStyles.observacionesField}
                />
            </div>
        </div>
    );
}
