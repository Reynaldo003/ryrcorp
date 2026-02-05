import React, { useMemo, useRef, useState, ReactComponent } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
    BadgeCheck,
    ClipboardCheck,
    FileSpreadsheet,
    Link as LinkIcon,
    MessageCircle,
    Mic,
    Paperclip,
    PhoneCall,
    Search,
    Tag,
    Wrench,
    Car,
    Package,
    Building2,
    CheckCircle2,
    AlertTriangle,
    Phone,
    Facebook
} from "lucide-react";
import JDPOWER from "/jdpower.svg"
import WAP from "/whatsapp.svg"
import FB from "/facebook.svg"
import ENCUESTA from "/encuesta.svg"
import SPEAK from "/speak.svg"
import PHONE from "/phone.svg"

const AZUL = "#131E5C";

const ImgIcon = (src, alt) => (props) => <img src={src} alt={alt} {...props} />;

const lineaMeta = {
    Ventas: { Icon: Tag, label: "Ventas" },
    Servicio: { Icon: Wrench, label: "Servicio" },
    Usados: { Icon: Car, label: "Usados" },
    Refacciones: { Icon: Package, label: "Refacciones" },
    General: { Icon: Building2, label: "General" },
};

const origenMeta = {
    "JD Power": { Icon: ImgIcon(JDPOWER, "JD Power"), label: "JD Power" },
    "Whatsapp": { Icon: ImgIcon(WAP, "Whatsapp"), label: "WhatsApp" },
    "Facebook": { Icon: ImgIcon(FB, "Facebook"), label: "Facebook" },
    "Encuesta Interna": { Icon: ImgIcon(ENCUESTA, "Encuesta"), label: "Encuesta" },
    "Reclamacion Verbal": { Icon: ImgIcon(SPEAK, "Verbal"), label: "Verbal" },
    "Llamada de Calidad": { Icon: ImgIcon(PHONE, "Llamada"), label: "Llamada" },
};

const estadoMeta = {
    "1er Contacto": {
        Icon: Phone,
        label: "1er contacto",
        className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    "2do Contacto": {
        Icon: PhoneCall,
        label: "2do contacto",
        className: "bg-amber-50 text-amber-800 border-amber-200",
    },
    "3er Contacto": {
        Icon: AlertTriangle,
        label: "3er contacto",
        className: "bg-red-50 text-red-700 border-red-200",
    },
    "Reclamacion Cerrada": {
        Icon: CheckCircle2,
        label: "Cerrada",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
};

function Pill({ children, className = "" }) {
    return (
        <span
            className={[
                "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                className || "border-slate-200 bg-white text-slate-700",
            ].join(" ")}
        >
            {children}
        </span>
    );
}

function IconPill({ Icon, text, tone = "default" }) {
    const cls =
        tone === "primary"
            ? "border-slate-200 bg-slate-900 text-white"
            : "border-slate-200 bg-white text-slate-700";

    return (
        <Pill className={cls}>
            <Icon size={14} />
            {text}
        </Pill>
    );
}

function StatusPill({ estado }) {
    const meta = estadoMeta[estado] || {
        Icon: Phone,
        label: estado,
        className: "border-slate-200 bg-white text-slate-700",
    };
    const Icon = meta.Icon;
    return (
        <Pill className={meta.className}>
            {meta.label}
        </Pill>
    );
}

function safeStr(v) {
    return (v ?? "").toString().trim();
}

function normalizeHeader(h) {
    const x = safeStr(h).toLowerCase();
    const map = {
        chasis: "chasis",
        folio: "chasis",
        cliente: "cliente",
        "línea": "linea",
        "linea": "linea",
        "linea de negocios": "linea",
        "os": "expediente",
        "expediente": "expediente",
        "os - expediente": "expediente",
        fecha: "fecha",
        "fecha servicio": "fecha_serv",
        "fecha_servicio": "fecha_serv",
        origen: "origen",
        "origen reclamacion": "origen",
        estado: "estado",
        "recopilacion": "recop",
        "recopilacion de contactos": "recop",
        problema: "problema",
        "definicion del problema": "problema",
        causa: "causa",
        raiz: "raiz",
        descripción: "descripcion",
        descripcion: "descripcion",
        "descripcion general": "descripcion",
        "contacto 1": "contacto1",
        "contacto 2": "contacto2",
        "contacto 3": "contacto3",
        "contacto cierre": "contacto_cierre",
    };
    return map[x] || null;
}

export default function CrmCases() {
    const navigate = useNavigate();

    const [rows, setRows] = useState([
        {
            chasis: "NC-00124",
            cliente: "Cliente Ejemplo A",
            linea: "Ventas",
            expediente: "OS-4521",
            fecha: "2026-01-18",
            fecha_serv: "2026-01-20",
            origen: "JD Power",
            estado: "Reclamacion Cerrada",
            recop: "Correo",
            problema: "Ruido en motor",
            causa: "Gestion de Clientes",
            raiz: "Falta de comunicación proactiva con los clientes",
            descripcion: "Cliente reporta ruido al encender.",
            contacto1: "03/02/2026 Sin respuesta",
            contacto2: "08/02/2026 Proximo a contactar",
            contacto3: "—",
            contacto_cierre: "",
            evidencia: [],
        },
        {
            chasis: "NC-00123",
            cliente: "Cliente Ejemplo B",
            linea: "Servicio",
            expediente: "OS-4499",
            fecha: "2026-01-10",
            fecha_serv: "2026-01-12",
            origen: "Whatsapp",
            estado: "1er Contacto",
            recop: "Llamada",
            problema: "Demora en entrega",
            causa: "Metodo",
            raiz: "Procesos complejos",
            descripcion: "Retraso en la entrega del vehículo.",
            contacto1: "28/01/2026 Satisfactorio",
            contacto2: "—",
            contacto3: "—",
            contacto_cierre: "—",
            evidencia: [],
        },
        {
            chasis: "NC-00122",
            cliente: "Cliente Ejemplo C",
            linea: "Usados",
            expediente: "OS-4477",
            fecha: "2025-12-20",
            fecha_serv: "2025-12-22",
            origen: "Encuesta Interna",
            estado: "2do Contacto",
            recop: "Formulario",
            problema: "Documentación incompleta",
            causa: "Gestion de Clientes",
            raiz: "Mal uso de CRM",
            descripcion: "Se entregó sin papeles completos.",
            contacto1: "30/01/2026 Sin respuesta",
            contacto2: "05/02/2026 Finalizado",
            contacto3: "—",
            contacto_cierre: "—",
            evidencia: [],
        }, {
            chasis: "NC-00121",
            cliente: "Cliente Ejemplo C",
            linea: "Usados",
            expediente: "OS-4477",
            fecha: "2025-12-20",
            fecha_serv: "2025-12-22",
            origen: "Facebook",
            estado: "3er Contacto",
            recop: "Formulario",
            problema: "Documentación incompleta",
            causa: "Gestion de Clientes",
            raiz: "Mal uso de CRM",
            descripcion: "Se entregó sin papeles completos.",
            contacto1: "30/01/2026 Sin respuesta",
            contacto2: "05/02/2026 Finalizado",
            contacto3: "—",
            contacto_cierre: "—",
            evidencia: [],
        },
    ]);

    const [q, setQ] = useState("");
    const [estadoFilter, setEstadoFilter] = useState("Todos");
    const [origenFilter, setOrigenFilter] = useState("Todos");
    const [lineaFilter, setLineaFilter] = useState("Todos");

    const fileExcelRef = useRef(null);
    const fileEviRef = useRef(null);
    const [eviTargetChasis, setEviTargetChasis] = useState(null);

    const filtered = useMemo(() => {
        const t = q.trim().toLowerCase();
        return rows.filter((r) => {
            const okQ =
                !t ||
                [
                    r.chasis,
                    r.cliente,
                    r.expediente,
                    r.problema,
                    r.causa,
                    r.raiz,
                    r.origen,
                    r.estado,
                ].some((v) => safeStr(v).toLowerCase().includes(t));

            const okE = estadoFilter === "Todos" ? true : r.estado === estadoFilter;
            const okO = origenFilter === "Todos" ? true : r.origen === origenFilter;
            const okL = lineaFilter === "Todos" ? true : r.linea === lineaFilter;

            return okQ && okE && okO && okL;
        });
    }, [rows, q, estadoFilter, origenFilter, lineaFilter]);

    const onDoubleClickRow = (row) => {
        navigate(`/crm/casos/${row.chasis}/editar`, { state: row });
    };

    const onImportExcelClick = () => fileExcelRef.current?.click();

    const onExcelSelected = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];

        // raw rows as arrays
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        if (!aoa.length) return;

        const headers = aoa[0].map(normalizeHeader);
        const dataRows = aoa.slice(1).filter((r) => r.some((x) => safeStr(x)));

        const imported = dataRows.map((r) => {
            const obj = { evidencia: [] };
            headers.forEach((k, idx) => {
                if (!k) return;
                obj[k] = safeStr(r[idx]);
            });

            if (!obj.chasis) obj.chasis = `NC-${Math.floor(Math.random() * 90000 + 10000)}`;
            if (!obj.estado) obj.estado = "1er Contacto";
            if (!obj.linea) obj.linea = "General";
            if (!obj.origen) obj.origen = "Encuesta Interna";

            return obj;
        });

        setRows((prev) => [...imported, ...prev]);
        e.target.value = "";
    };

    const onEvidenceClick = (chasis) => {
        setEviTargetChasis(chasis);
        fileEviRef.current?.click();
    };

    const onEvidenceSelected = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length || !eviTargetChasis) return;

        const names = files.map((f) => f.name);

        setRows((prev) =>
            prev.map((r) =>
                r.chasis === eviTargetChasis
                    ? { ...r, evidencia: [...(r.evidencia || []), ...names] }
                    : r
            )
        );

        e.target.value = "";
    };

    const clearFilters = () => {
        setQ("");
        setEstadoFilter("Todos");
        setOrigenFilter("Todos");
        setLineaFilter("Todos");
    };

    return (
        <div className="space-y-4 max-w-[1200px] mb-10">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-base font-semibold">Casos</h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={onImportExcelClick}
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                        >
                            <FileSpreadsheet size={18} />
                            Importar Excel
                        </button>

                        <button
                            className="rounded-2xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            style={{ background: AZUL }}
                        >
                            + Nuevo caso
                        </button>
                    </div>
                </div>

                {/* filtros */}
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-slate-300"
                            placeholder="Buscar por chasis, cliente, problema, causa..."
                        />
                    </div>

                    <select
                        value={lineaFilter}
                        onChange={(e) => setLineaFilter(e.target.value)}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300"
                    >
                        <option value="Todos">Línea: Todas</option>
                        {Object.keys(lineaMeta).map((x) => (
                            <option key={x} value={x}>{x}</option>
                        ))}
                    </select>

                    <select
                        value={estadoFilter}
                        onChange={(e) => setEstadoFilter(e.target.value)}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300"
                    >
                        <option value="Todos">Estado: Todos</option>
                        {Object.keys(estadoMeta).map((x) => (
                            <option key={x} value={x}>{x}</option>
                        ))}
                    </select>

                    <select
                        value={origenFilter}
                        onChange={(e) => setOrigenFilter(e.target.value)}
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300 md:col-span-1"
                    >
                        <option value="Todos">Origen: Todos</option>
                        {Object.keys(origenMeta).map((x) => (
                            <option key={x} value={x}>{x}</option>
                        ))}
                    </select>

                    <button
                        onClick={clearFilters}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 md:col-span-1"
                    >
                        Limpiar filtros
                    </button>
                </div>

                {/* inputs ocultos */}
                <input
                    ref={fileExcelRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={onExcelSelected}
                />
                <input
                    ref={fileEviRef}
                    type="file"
                    accept=".pdf,image/*"
                    multiple
                    className="hidden"
                    onChange={onEvidenceSelected}
                />
            </div>

            {/* tabla */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
                <table className="min-w-[1600px] w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Chasis</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Línea</th>
                            <th className="px-4 py-3">OS</th>
                            <th className="px-4 py-3">Fecha de Atencion</th>
                            <th className="px-4 py-3">Fecha de Reclamacion</th>
                            <th className="px-4 py-3">Origen</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Problema</th>
                            <th className="px-4 py-3">Recopilacion de contactos</th>
                            <th className="px-4 py-3">Causa</th>
                            <th className="px-4 py-3">Raiz</th>
                            <th className="px-4 py-3">Documentacion</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                        {filtered.map((x) => {
                            const L = lineaMeta[x.linea] || lineaMeta.General;
                            const O = origenMeta[x.origen] || { Icon: LinkIcon, label: x.origen || "—" };

                            return (
                                <tr
                                    key={x.chasis}
                                    onDoubleClick={() => onDoubleClickRow(x)}
                                    className="hover:bg-slate-50 cursor-pointer"
                                    title="Doble clic para editar"
                                >
                                    <td className="px-4 py-3 font-semibold text-slate-900">{x.chasis}</td>
                                    <td className="px-4 py-3">{x.cliente}</td>

                                    <td className="px-4 py-3">
                                        <IconPill Icon={L.Icon} text={L.label} />
                                    </td>

                                    <td className="px-4 py-3">{x.expediente}</td>

                                    <td className="px-4 py-3">
                                        {x.fecha || "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {x.fecha_serv || "—"}
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center text-center">
                                            <O.Icon className="h-4 w-4" />
                                        </div>
                                        <span>{O.label}</span>
                                    </td>

                                    <td className="px-4 py-3">
                                        <StatusPill estado={x.estado} />
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{x.problema || "—"}</div>
                                    </td>
                                    <td className="px-4 py-3">{x.recop}</td>

                                    <td className="px-4 py-3">{x.causa || "—"}</td>
                                    <td className="px-4 py-3">{x.raiz || "—"}</td>

                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Pill className="border-slate-200 bg-slate-50 text-slate-700">
                                                {(x.evidencia || []).length} archivo(s)
                                            </Pill>
                                        </div>

                                        {(x.evidencia || []).length ? (
                                            <div className="mt-2 text-xs text-slate-500 line-clamp-2">
                                                {(x.evidencia || []).slice(0, 3).join(", ")}
                                                {(x.evidencia || []).length > 3 ? "…" : ""}
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            );
                        })}

                        {!filtered.length ? (
                            <tr>
                                <td colSpan={12} className="px-4 py-10 text-center text-sm text-slate-600">
                                    No hay registros con esos filtros.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
