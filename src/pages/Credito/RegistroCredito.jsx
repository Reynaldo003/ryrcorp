import { memo, useMemo, useState, useEffect, useCallback } from "react";
import {
    Plus, Search, X, Save, User, CarFront, CalendarDays, ArrowUpDown, ChevronDown, ChevronUp,
    Trash2, Loader2, Phone, Mail, MessageSquareText, Building2, UserSearch, UserStar,
    CreditCard, Wallet, BadgeDollarSign, Check, TableProperties, BarChart3, FileDown, CalendarClock,
} from "lucide-react";
import { apiCredito } from "../../lib/apiCredito";
import { createPortal } from "react-dom";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import * as XLSX from "xlsx";

const BRAND_BLUE = "#131E5C";

const DEALERS = ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan"];

const ASESORES = [
    "ADRIAN GALVEZ ROLDAN", "AURA MARLIZETH FERNANDEZ LOPEZ", "Bianca Isabel Chavez Alarcon", "Blanca Patricia Hernandez Hernandez",
    "CANDY DENISSE MARQUEZ CORTES", "Carlos Arturo Garces Venegas", "Cesar Ivan Salazar Reyes", "Cristian Fernando Rivera Godinez",
    "David Uriel García Navarro", "DELMAR JAVIER ILLESCAS DOMINGUEZ", "DULCE ABIGAIL GARCIA OLIVARES", "EDGAR JESUS GOMEZ PEREZ",
    "Edgar Omar Noguera Solis", "ELIA INES ARANO REYES", "ERENDIRA SANTOS COYOTZI", "Estefano Marlom De Azcue Aparicio",
    "Felix Emmanuel Solis Angeles", "GEOVANI NAVA DIAZ", "GERMAN JARITH SALAZAR MIRANDA", "Gustavo Chontal Romero",
    "Hector Rodriguez", "IDALMY JIMENEZ SANCHEZ", "IRENE DEL CARMEN GUIZA LOPEZ", "Iris Yazmín Gómez Velázquez",
    "Israel Garcia Juarez", "IVAN JUAREZ ORTEGA", "Javier Perez Meraz", "JESSICA OLIVARES CAMPOS",
    "JESUS XITLAMA GOMEZ", "JORGE ANTONIO RODRIGUEZ MARTINEZ", "JORGE LUIS ALAMILLO RODRIGUEZ", "JOSE ALBERTO SEDAS FLORES",
    "JOSE ALFREDO BARRANCA REYES", "JOSE DE JESUS GARCIA ROMAN", "JUAN JESUS MARQUEZ AQUINO", "JUAN MANUEL SOBREVILLA VICENCIO",
    "Julio Ramirez Lopez", "LIZBETH CANO CLARA", "Luis Alberto Ramirez Santamaria", "LUIS ALFONSO CORIA MARROQUIN",
    "Luis Armando Almora Perez", "Luis Manuel Alvarez Martinez", "Luis Manuel Hernandez Espejo", "LUIS MANUEL PALOMARES OLAYO",
    "Mara Erubey Soto Villegas", "MARCOS RAUL DIAZ RAMOS", "Marelly Tenorio Salinas", "MARIA DE GUADALUPE VANVOLLENHOVEN DIAZ",
    "MARIA DEL CARMEN ZAVALA VELAZQUEZ", "Maria Monserrath Zarate Gamboa", "MARIO ALBERTO LOPEZ RAMOS", "MARISOL LAGUNES GONZALEZ",
    "Miguel Capitanachi Paredes", "NALLELY HERNANDEZ GARCIA", "OCTAVIO BRUNO GONZALEZ", "OLIMPIA VAZQUEZ MENDEZ",
    "OMAR VILLIERS MONDRAGON", "Paul Serrano Vera", "Roberto Ramses Luna Fajardo", "ROGELIO VAZQUEZ SANCHEZ",
    "RUBEN ALBERTO TOSQUY ADRIANO", "RUBEN ROMERO VALDES", "Saja Azzam Mohammad Jamous", "SANDRA LUZ PRIETO PEREZ",
    "Sergio Ivan Quintana Martinez", "Sergio Rene Delgado Sarmiento", "Valeria Zilli Durante", "VANESSA JIMENEZ MEDINA",
    "VERONICA CASTILLO FUENTES", "YAMIL MISAEL RODRIGUEZ AGUILAR", "Yoseth Ruiz Castellanos", "ZEILA NAVARRO CONTRERAS",
];

const FUENTE = ["Digital", "Piso", "Tradicional"];
const VEHICULOS = ["Virtus", "Polo", "Jetta", "Jetta GLI", "Golf GTI", "Taos", "Nivus", "Taigun", "Tiguan", "Teramont", "Crossport", "Saveiro", "Amarok", "Seminuevos", "Tera", "Avaluo", "Transporter", "Caddy", "Crafter"];
const ESTADOS_FINANCIAMIENTO = ["En Proceso", "Condicionado", "Autorizado", "No Autorizado", "Ejercido"];
const ESTADOS_COMPRA = ["Venta Perdida", "En Proceso", "Facturada", "Entregada"];
const PRODUCTO_FINANCIERO = ["Credito Tradicional", "Arrendamiento", "Autofinanciamiento"];

const REQUIRED = {
    cliente_telefono: "Teléfono",
    id_soli_cred: "ID Solicitud Credito",
    producto_financiero: "Producto Financiero",
    auto_interes: "Auto Interes",
    canal_origen: "Canal de Origen",
    estado_financiamiento: "Estado Financiamiento",
    estado_compra: "Estado de la Compra",
};

const INPUT_BASE = "w-full rounded-lg border px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none transition-colors focus:border-[#131E5C]";
const INPUT_OK = "border-black/10 bg-neutral-100";
const INPUT_BAD = "border-red-500 bg-red-50";

function normalizeStr(v) {
    return String(v ?? "").trim();
}

function Skeleton({ className = "" }) {
    return <div className={["animate-pulse rounded-md bg-black/10", className].join(" ")} />;
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="px-4 py-3"><div className="h-4 w-36 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-40 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-8 w-40 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-8 w-40 rounded bg-slate-200/60" /></td>
            <td className="px-4 py-3"><div className="h-8 w-40 rounded bg-slate-200/60" /></td>
        </tr>
    );
}

function ModalSkeleton() {
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-10 w-full rounded-lg" />
                </div>
            ))}
            <div className="md:col-span-2 rounded-lg border border-white/10 bg-neutral-200/50 p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-3 h-24 w-full rounded-lg" />
            </div>
        </div>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/55" onClick={onClose} />

            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-[#131E5C] bg-neutral-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ backgroundColor: BRAND_BLUE }}>
                        <div className="min-w-0"><div className="truncate text-base font-extrabold text-white">{title}</div></div>
                        <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/15" aria-label="Cerrar">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[72vh] overflow-auto p-5">{children}</div>

                    {footer ? (
                        <div className="flex flex-col gap-2 border-t border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                            {footer}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>,
        document.body
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-lg border border-black/5 bg-neutral-200/50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#131E5C]">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

function toDTLocal(value) {
    if (!value) return "";

    const s = String(value);

    if (s.endsWith("Z")) {
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fechaActualDTLocal() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDTLocalToISO(value) {
    const v = String(value || "").trim();
    return v || null;
}

function toYMDLocal(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ymdToInt(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    return Number(ymd.replaceAll("-", ""));
}

function FilterBlock({ label, children }) {
    return (
        <div className="rounded-lg">
            <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">{label}</div>
            {children}
        </div>
    );
}

function ContextMenu({ ctxMenu, onDelete, onClose }) {
    if (!ctxMenu.open || !ctxMenu.row) return null;

    return createPortal(
        <div className="fixed z-[9999]" style={{ left: ctxMenu.x, top: ctxMenu.y }} onClick={(e) => e.stopPropagation()}>
            <div className="w-48 overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <button type="button" className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50" onClick={() => onDelete(ctxMenu.row)}>
                    <Trash2 className="h-4 w-4" /> Eliminar
                </button>
                <button type="button" className="w-full px-4 py-2 text-left text-xs text-slate-500 hover:bg-slate-50" onClick={onClose}>Cerrar</button>
            </div>
        </div>,
        document.body
    );
}

function InlineInput({ value, saving, onChange, onBlur, onKeyDown, placeholder = "" }) {
    return (
        <div className="flex min-w-[180px] items-center gap-2">
            <input
                value={value}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className="w-full rounded-lg border border-[#131E5C]/20 bg-white px-2 py-1.5 text-xs font-semibold text-[#131E5C] outline-none"
            />
            {saving ? <Loader2 className="h-4 w-4 animate-spin text-[#131E5C]" /> : <Check className="h-4 w-4 text-emerald-600" />}
        </div>
    );
}

function InlineSelect({ value, options, saving, onChange }) {
    return (
        <div className="flex min-w-[180px] items-center gap-2">
            <select
                value={value || ""}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-[#131E5C]/20 bg-white px-2 py-1.5 text-xs font-semibold text-[#131E5C] outline-none"
            >
                <option value="">Selecciona...</option>
                {options.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>

            {saving ? <Loader2 className="h-4 w-4 animate-spin text-[#131E5C]" /> : <Check className="h-4 w-4 text-emerald-600" />}
        </div>
    );
}

const MobileCardList = memo(function MobileCardList({ rows, loading, onEdit, onContext }) {
    return (
        <div className="lg:hidden">
            <div className="overflow-hidden rounded-lg bg-white/[0.03] shadow-lg">
                {loading ? (
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="mt-3 h-4 w-28" />
                                <Skeleton className="mt-3 h-4 w-56" />
                                <Skeleton className="mt-4 h-8 w-24 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="px-4 py-10 text-center text-[#131E5C]">No hay resultados con esos filtros.</div>
                ) : (
                    <div className="grid gap-3 p-3 sm:grid-cols-2">
                        {rows.map((row) => {
                            const nombre = row?.cliente?.nombre || "—";
                            const telefono = row?.cliente?.telefono || "—";
                            const fecha = row.creado ? toDTLocal(row.creado).replace("T", " ") : "—";

                            return (
                                <div key={row.id} onClick={() => onEdit(row)} onContextMenu={(e) => onContext(e, row)} className="cursor-pointer rounded-lg border border-black/10 bg-white p-4 shadow-sm transition hover:shadow-md">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 text-xs font-extrabold text-[#131E5C]"><CalendarDays className="h-4 w-4" /><span className="truncate">{fecha}</span></div>
                                            <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500"><Building2 className="h-4 w-4" /><span className="truncate">{row.agencia || "—"}</span></div>
                                        </div>
                                        <div className="rounded-full border border-[#131E5C]/15 bg-[#131E5C]/5 px-3 py-1 text-xs font-bold text-[#131E5C]">{row.estado_financiamiento || "Sin estado"}</div>
                                    </div>

                                    <div className="mt-3 grid gap-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-[#131E5C]"><User className="h-4 w-4" /><span className="truncate">{nombre}</span></div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Phone className="h-4 w-4 text-[#131E5C]" /><span>{telefono}</span></div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><CreditCard className="h-4 w-4 text-[#131E5C]" /><span>{row.id_soli_cred || "—"}</span></div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><CarFront className="h-4 w-4 text-[#131E5C]" /><span>{row.auto_interes || "—"}</span></div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><UserStar className="h-4 w-4 text-[#131E5C]" /><span>{row.asesor_ventas || "—"}</span></div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><BadgeDollarSign className="h-4 w-4 text-[#131E5C]" /><span>{row.estado_compra || "—"}</span></div>
                                        <div className="mt-1 flex items-start gap-2 text-xs text-slate-600"><MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[#131E5C]" /><span className="line-clamp-2">{row.comentarios || "—"}</span></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
});

const GraficasSolicitudes = memo(function GraficasSolicitudes({ rows }) {
    const agrupar = useCallback((campo, fallback) => {
        const conteo = {};
        rows.forEach((row) => {
            const valor = row[campo] || fallback;
            conteo[valor] = (conteo[valor] || 0) + 1;
        });
        return Object.entries(conteo).map(([name, value]) => ({ name, value }));
    }, [rows]);

    const porDealer = useMemo(() => agrupar("agencia", "Sin dealer").sort((a, b) => b.value - a.value), [agrupar]);
    const porFinanciamiento = useMemo(() => agrupar("estado_financiamiento", "Sin estado"), [agrupar]);
    const porCompra = useMemo(() => agrupar("estado_compra", "Sin estado"), [agrupar]);
    const porAsesor = useMemo(() => agrupar("asesor_ventas", "Sin asesor").sort((a, b) => b.value - a.value).slice(0, 10), [agrupar]);
    const porProducto = useMemo(() => agrupar("producto_financiero", "Sin producto").sort((a, b) => b.value - a.value), [agrupar]);

    const porFecha = useMemo(() => {
        const conteo = {};
        rows.forEach((row) => {
            if (!row.creado) return;
            const fecha = String(row.creado).slice(0, 10);
            conteo[fecha] = (conteo[fecha] || 0) + 1;
        });

        return Object.entries(conteo).map(([fecha, value]) => ({ fecha, value })).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-15);
    }, [rows]);

    const total = rows.length || 1;
    const porcentaje = useCallback((valor) => ((valor / total) * 100).toFixed(1), [total]);

    const dealerPrincipal = porDealer[0] || { name: "Sin datos", value: 0 };
    const financiamientoPrincipal = [...porFinanciamiento].sort((a, b) => b.value - a.value)[0] || { name: "Sin datos", value: 0 };
    const productoPrincipal = porProducto[0] || { name: "Sin datos", value: 0 };

    const opcionDealer = useMemo(() => ({
        tooltip: { trigger: "axis" },
        grid: { left: 20, right: 55, top: 20, bottom: 20, containLabel: true },
        xAxis: { type: "value", minInterval: 1 },
        yAxis: { type: "category", data: porDealer.map((i) => i.name) },
        series: [{
            type: "bar",
            data: porDealer.map((i) => i.value),
            barWidth: 20,
            itemStyle: { borderRadius: [0, 6, 6, 0], color: BRAND_BLUE },
            label: { show: true, position: "right", formatter: (p) => `${p.value} (${porcentaje(p.value)}%)`, fontSize: 11, fontWeight: "bold", color: BRAND_BLUE },
        }],
    }), [porDealer, porcentaje]);

    const opcionFinanciamiento = useMemo(() => ({
        tooltip: { trigger: "item" },
        legend: { bottom: 0, textStyle: { fontSize: 11 } },
        series: [{
            type: "pie", radius: ["44%", "64%"], center: ["50%", "45%"], data: porFinanciamiento,
            label: { show: true, formatter: (p) => `${p.name}\n${p.value} (${p.percent.toFixed(1)}%)`, fontSize: 9, fontWeight: "bold", width: 85, overflow: "break", lineHeight: 12 },
            labelLine: { show: true, length: 8, length2: 5 },
        }],
    }), [porFinanciamiento]);

    const opcionCompra = useMemo(() => ({
        tooltip: { trigger: "item" },
        legend: { bottom: 0, textStyle: { fontSize: 11 } },
        series: [{
            type: "pie", radius: ["44%", "64%"], center: ["50%", "45%"], data: porCompra,
            label: { show: true, formatter: (p) => `${p.name}\n${p.value} (${p.percent.toFixed(1)}%)`, fontSize: 9, fontWeight: "bold", width: 85, overflow: "break", lineHeight: 12 },
            labelLine: { show: true, length: 8, length2: 5 },
        }],
    }), [porCompra]);

    const opcionAsesor = useMemo(() => ({
        tooltip: { trigger: "axis" },
        grid: { left: 20, right: 30, top: 20, bottom: 20, containLabel: true },
        xAxis: { type: "value", minInterval: 1 },
        yAxis: { type: "category", inverse: true, data: porAsesor.map((i) => i.name), axisLabel: { width: 110, overflow: "truncate" } },
        series: [{
            type: "bar",
            data: porAsesor.map((i) => i.value),
            barWidth: 18,
            itemStyle: { borderRadius: [0, 6, 6, 0], color: BRAND_BLUE },
            label: { show: true, position: "right", formatter: (p) => `${p.value} (${porcentaje(p.value)}%)`, fontSize: 10, fontWeight: "bold", color: BRAND_BLUE },
        }],
    }), [porAsesor, porcentaje]);

    const opcionProducto = useMemo(() => ({
        tooltip: { trigger: "item" },
        legend: { bottom: 0, textStyle: { fontSize: 11 } },
        series: [{
            type: "pie", radius: ["42%", "64%"], center: ["50%", "45%"], avoidLabelOverlap: true, data: porProducto,
            label: { show: true, formatter: (p) => `${p.name}\n${p.value} (${p.percent.toFixed(1)}%)`, fontSize: 10, fontWeight: "bold", lineHeight: 12 },
            labelLine: { show: true, length: 10, length2: 10 },
        }],
    }), [porProducto]);

    const opcionFecha = useMemo(() => ({
        tooltip: { trigger: "axis" },
        grid: { left: 20, right: 20, top: 20, bottom: 40, containLabel: true },
        xAxis: { type: "category", data: porFecha.map((i) => i.fecha), axisLabel: { rotate: 35, fontSize: 10 } },
        yAxis: { type: "value", minInterval: 1 },
        series: [{
            type: "line", smooth: true, data: porFecha.map((i) => i.value), symbolSize: 7,
            lineStyle: { width: 3 }, areaStyle: {},
            label: { show: true, position: "top", formatter: "{c}", fontSize: 10, fontWeight: "bold", color: BRAND_BLUE },
        }],
    }), [porFecha]);

    return (
        <>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400">Total solicitudes</p>
                    <p className="mt-1 text-2xl font-extrabold text-[#131E5C]">{rows.length}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400">Dealer principal</p>
                    <p className="mt-1 truncate text-sm font-extrabold text-[#131E5C]">{dealerPrincipal.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{dealerPrincipal.value} solicitudes · {porcentaje(dealerPrincipal.value)}%</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400">Financiamiento principal</p>
                    <p className="mt-1 truncate text-sm font-extrabold text-[#131E5C]">{financiamientoPrincipal.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{financiamientoPrincipal.value} solicitudes · {porcentaje(financiamientoPrincipal.value)}%</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-400">Producto principal</p>
                    <p className="mt-1 truncate text-sm font-extrabold text-[#131E5C]">{productoPrincipal.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{productoPrincipal.value} solicitudes · {porcentaje(productoPrincipal.value)}%</p>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                <Grafica titulo="Solicitudes por dealer" descripcion="Distribución de solicitudes registradas" option={opcionDealer} />
                <Grafica titulo="Estado de financiamiento" descripcion="Situación actual de las solicitudes" option={opcionFinanciamiento} />
                <Grafica titulo="Estado de compra" descripcion="Seguimiento del proceso de compra" option={opcionCompra} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <Grafica titulo="Solicitudes por asesor" descripcion="Top 10 asesores con más solicitudes" option={opcionAsesor} height={280} />
                <Grafica titulo="Producto financiero" descripcion="Distribución por tipo de producto" option={opcionProducto} height={280} />
                <Grafica titulo="Solicitudes por fecha" descripcion="Evolución de solicitudes registradas" option={opcionFecha} height={280} />
            </div>
        </>
    );
});

function Grafica({ titulo, descripcion, option, height = 260 }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-2">
                <h3 className="text-sm font-extrabold text-[#131E5C]">{titulo}</h3>
                <p className="text-xs text-slate-400">{descripcion}</p>
            </div>
            <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />
        </div>
    );
}

const FormularioSolicitudCredito = memo(function FormularioSolicitudCredito({
    open, mode, initialDraft, loading, saving, isAdmin, userAgencias, onClose, onSave,
}) {
    const [draft, setDraft] = useState(initialDraft);
    const [touchedSave, setTouchedSave] = useState(false);

    useEffect(() => {
        if (!open) return;
        setDraft(initialDraft);
        setTouchedSave(false);
    }, [open, initialDraft]);

    const actualizarCampo = useCallback((campo, valor) => {
        setDraft((prev) => {
            if (!prev || prev[campo] === valor) return prev;
            return { ...prev, [campo]: valor };
        });
    }, []);

    const missing = useMemo(() => {
        if (!draft) return [];
        return Object.keys(REQUIRED).filter((key) => {
            const value = draft[key];
            return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
        });
    }, [draft]);

    const missingSet = useMemo(() => new Set(missing), [missing]);
    const isInvalid = useCallback((key) => touchedSave && missingSet.has(key), [touchedSave, missingSet]);

    const telDigits = useMemo(() => String(draft?.cliente_telefono || "").replace(/\D/g, ""), [draft?.cliente_telefono]);
    const telIsOk = useMemo(() => /^(?:\d{10}|52\d{10})$/.test(telDigits), [telDigits]);
    const telIsNormalized = useMemo(() => /^52\d{10}$/.test(telDigits), [telDigits]);

    const telError = useMemo(() => {
        if (!telDigits || /^\d{10}$/.test(telDigits) || /^52\d{10}$/.test(telDigits)) return "";
        if (telDigits.length < 10) return "Número incompleto (mínimo 10 dígitos)";
        if (telDigits.length === 11) return "Número incorrecto (11 dígitos no válido)";
        if (telDigits.length === 12 && !telDigits.startsWith("52")) return "Número inválido: si tiene 12 dígitos debe iniciar con 52";
        if (telDigits.length > 12) return "Número incorrecto (máximo 12 dígitos)";
        return "Número inválido";
    }, [telDigits]);

    const guardar = useCallback(() => {
        if (!draft || saving) return;
        setTouchedSave(true);
        if (missing.length || !telDigits || !telIsOk) return;
        onSave(draft);
    }, [draft, saving, missing, telDigits, telIsOk, onSave]);

    const errorRequerido = (key) => isInvalid(key) ? <div className="mt-2 text-xs font-bold text-red-600">{REQUIRED[key]} es requerido.</div> : null;

    if (!open) return null;

    return (
        <Modal
            open={open}
            title={mode === "create" ? "Nueva Solicitud de Credito" : `Editar Solicitud • ${draft?.id || ""}`}
            onClose={onClose}
            footer={
                <>
                    <button type="button" onClick={onClose} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-400 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                        <X className="h-4 w-4" /> Cancelar
                    </button>

                    <button type="button" onClick={guardar} disabled={saving || loading || !!telError || (draft?.cliente_telefono ? !telIsOk : false)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white hover:bg-[#131E5C]/85 disabled:cursor-not-allowed disabled:opacity-60">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                </>
            }
        >
            {loading ? <ModalSkeleton /> : !draft ? null : (
                <>
                    {touchedSave && missing.length > 0 ? (
                        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">Hay campos obligatorios pendientes por completar.</div>
                    ) : null}

                    <div className="grid gap-3 md:grid-cols-3">
                        <Field label="Dealer" icon={Building2}>
                            <select
                                value={draft.agencia || ""}
                                onChange={(e) => actualizarCampo("agencia", e.target.value)}
                                disabled={!isAdmin && userAgencias.length <= 1}
                                className={[INPUT_BASE, INPUT_OK, !isAdmin && userAgencias.length <= 1 ? "cursor-not-allowed opacity-75" : ""].join(" ")}
                            >
                                <option value="" disabled>Selecciona un dealer...</option>
                                {(isAdmin ? DEALERS : userAgencias).map((dealer) => <option key={dealer} value={dealer}>{dealer}</option>)}
                            </select>
                        </Field>

                        <Field label="Nombre del cliente" icon={User}>
                            <input value={draft.cliente_nombre || ""} onChange={(e) => actualizarCampo("cliente_nombre", e.target.value)} className={`${INPUT_BASE} ${INPUT_OK}`} placeholder="Nombre completo" />
                        </Field>

                        <Field label="Teléfono" icon={Phone}>
                            <input
                                maxLength={12}
                                value={draft.cliente_telefono || ""}
                                onChange={(e) => actualizarCampo("cliente_telefono", e.target.value.replace(/\D/g, "").slice(0, 12))}
                                disabled={mode === "edit" || telIsNormalized}
                                className={[INPUT_BASE, isInvalid("cliente_telefono") || telError ? INPUT_BAD : INPUT_OK, mode === "edit" || telIsNormalized ? "cursor-not-allowed opacity-75" : ""].join(" ")}
                            />
                            {errorRequerido("cliente_telefono")}
                            {!isInvalid("cliente_telefono") && telError ? <div className="mt-2 text-xs font-bold text-red-600">{telError}</div> : null}
                        </Field>

                        <Field label="Fecha de Ingreso" icon={CalendarClock}>
                            <input type="datetime-local" value={draft.creado || ""} onChange={(e) => actualizarCampo("creado", e.target.value)} className={`${INPUT_BASE} ${INPUT_OK}`} />
                        </Field>

                        <Field label="Correo" icon={Mail}>
                            <input type="email" value={draft.cliente_correo || ""} onChange={(e) => actualizarCampo("cliente_correo", e.target.value)} className={`${INPUT_BASE} ${INPUT_OK}`} placeholder="correo@dominio.com" />
                        </Field>

                        <Field label="ID Solicitud Credito" icon={CreditCard}>
                            <input value={draft.id_soli_cred || ""} onChange={(e) => actualizarCampo("id_soli_cred", e.target.value)} className={`${INPUT_BASE} ${isInvalid("id_soli_cred") ? INPUT_BAD : INPUT_OK}`} placeholder="ID / folio / referencia" />
                            {errorRequerido("id_soli_cred")}
                        </Field>

                        <Field label="Producto Financiero" icon={UserSearch}>
                            <select value={draft.producto_financiero || ""} onChange={(e) => actualizarCampo("producto_financiero", e.target.value)} className={`${INPUT_BASE} ${isInvalid("producto_financiero") ? INPUT_BAD : INPUT_OK}`}>
                                <option value="">Selecciona un Producto...</option>
                                {PRODUCTO_FINANCIERO.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                            {errorRequerido("producto_financiero")}
                        </Field>

                        <Field label="Plazo Meses" icon={CalendarDays}>
                            <input value={draft.plazo_meses || ""} onChange={(e) => actualizarCampo("plazo_meses", e.target.value)} className={`${INPUT_BASE} ${INPUT_OK}`} placeholder="Ej. 12, 24, 36" />
                        </Field>

                        <Field label="Monto a Financiar" icon={Wallet}>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={draft.monto_financiero || ""}
                                onChange={(e) => {
                                    let valor = e.target.value.replace(/,/g, "").replace(/[^0-9.]/g, "");
                                    const partes = valor.split(".");
                                    if (partes.length > 2) valor = `${partes[0]}.${partes.slice(1).join("")}`;
                                    actualizarCampo("monto_financiero", valor);
                                }}
                                className={`${INPUT_BASE} ${INPUT_OK}`}
                                placeholder="Monto"
                            />
                        </Field>

                        <Field label="Auto Interes" icon={CarFront}>
                            <select value={draft.auto_interes || ""} onChange={(e) => actualizarCampo("auto_interes", e.target.value)} className={`${INPUT_BASE} ${isInvalid("auto_interes") ? INPUT_BAD : INPUT_OK}`}>
                                <option value="">Selecciona un modelo...</option>
                                {VEHICULOS.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                            {errorRequerido("auto_interes")}
                        </Field>

                        <Field label="Canal de Origen" icon={UserSearch}>
                            <select value={draft.canal_origen || ""} onChange={(e) => actualizarCampo("canal_origen", e.target.value)} className={`${INPUT_BASE} ${isInvalid("canal_origen") ? INPUT_BAD : INPUT_OK}`}>
                                <option value="">Selecciona un Canal...</option>
                                {FUENTE.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                            {errorRequerido("canal_origen")}
                        </Field>

                        <Field label="Asesor Ventas" icon={UserStar}>
                            <select value={draft.asesor_ventas || ""} onChange={(e) => actualizarCampo("asesor_ventas", e.target.value)} className={`${INPUT_BASE} ${INPUT_OK}`}>
                                <option value="">Selecciona un asesor...</option>
                                {ASESORES.map((asesor) => <option key={asesor} value={asesor}>{asesor}</option>)}
                            </select>
                        </Field>

                        <Field label="Estado Financiamiento" icon={BadgeDollarSign}>
                            <select value={draft.estado_financiamiento || ""} onChange={(e) => actualizarCampo("estado_financiamiento", e.target.value)} className={`${INPUT_BASE} ${isInvalid("estado_financiamiento") ? INPUT_BAD : INPUT_OK}`}>
                                <option value="">Selecciona un estado...</option>
                                {ESTADOS_FINANCIAMIENTO.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                            {errorRequerido("estado_financiamiento")}
                        </Field>

                        <Field label="Estado de la Compra" icon={BadgeDollarSign}>
                            <select value={draft.estado_compra || ""} onChange={(e) => actualizarCampo("estado_compra", e.target.value)} className={`${INPUT_BASE} ${isInvalid("estado_compra") ? INPUT_BAD : INPUT_OK}`}>
                                <option value="">Selecciona un estado...</option>
                                {ESTADOS_COMPRA.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                            {errorRequerido("estado_compra")}
                        </Field>

                        <Field label="Fecha de Respuesta" icon={CalendarDays}>
                            <input type="datetime-local" value={draft.fecha_respuesta || ""} onChange={(e) => actualizarCampo("fecha_respuesta", e.target.value)} className={`${INPUT_BASE} ${INPUT_OK}`} />
                        </Field>

                        <div className="md:col-span-3">
                            <Field label="Comentarios" icon={MessageSquareText}>
                                <textarea value={draft.comentarios || ""} onChange={(e) => actualizarCampo("comentarios", e.target.value)} className={`${INPUT_BASE} ${INPUT_OK} min-h-[110px] resize-y`} placeholder="Notas internas..." />
                            </Field>
                        </div>
                    </div>
                </>
            )}
        </Modal>
    );
});

export default function RegistroCredito() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const permisos = user?.permisos || [];
    const rol = String(user?.rol || "").trim().toLowerCase();

    const isAdmin = useMemo(() => rol === "administrador" || permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN"), [rol, permisos]);

    const canAccessCredito = useMemo(() => {
        return isAdmin || permisos.includes("CRM_FINANCIEROS") || permisos.includes("CRM_VENTAS") || permisos.includes("CRM_DIGITALES") || permisos.includes("CRM_COORDINADOR_DIGITAL") || permisos.includes("CRM_CALIDAD");
    }, [isAdmin, permisos]);

    const userAgencias = useMemo(() => String(user?.agencia || "").split("|").map(normalizeStr).filter(Boolean), [user?.agencia]);
    const userAgencia = userAgencias[0] || "";

    const userTieneAgencia = useCallback((agenciaRegistro) => {
        const agencia = normalizeStr(agenciaRegistro);
        if (!agencia) return false;
        return userAgencias.some((agenciaUsuario) => agenciaUsuario.toLowerCase() === agencia.toLowerCase());
    }, [userAgencias]);

    const [solicitudes, setSolicitudes] = useState([]);
    const [inlineDrafts, setInlineDrafts] = useState({});
    const [savingInline, setSavingInline] = useState({});
    const [authError, setAuthError] = useState("");
    const [viewMode, setViewMode] = useState("tabla");
    const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, row: null });
    const [sort, setSort] = useState({ key: "creado", dir: "desc" });
    const [filters, setFilters] = useState({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" });
    const [openModal, setOpenModal] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [saving, setSaving] = useState(false);

    const toggleSort = useCallback((key) => {
        setSort((prev) => prev.key !== key ? { key, dir: "asc" } : { key, dir: prev.dir === "asc" ? "desc" : "asc" });
    }, []);

    useEffect(() => {
        const onGlobal = () => setCtxMenu((prev) => !prev.open && !prev.row ? prev : { ...prev, open: false, row: null });

        window.addEventListener("click", onGlobal);
        window.addEventListener("scroll", onGlobal, true);
        window.addEventListener("resize", onGlobal);

        return () => {
            window.removeEventListener("click", onGlobal);
            window.removeEventListener("scroll", onGlobal, true);
            window.removeEventListener("resize", onGlobal);
        };
    }, []);

    const onRowContextMenu = useCallback((e, row) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, row });
    }, []);

    const manejarErrorCredito = useCallback((error, fallbackMessage = "Ocurrió un error en el módulo de crédito.") => {
        console.error(error);

        const message = String(error?.message || "");
        const isSessionExpired = error?.code === "SESSION_EXPIRED" || error?.status === 401 || (error?.status === 403 && /token expirado|token inválido|token invalido|credenciales/i.test(message));

        if (isSessionExpired) {
            setAuthError("Tu sesión expiró o ya no es válida. Inicia sesión nuevamente.");
            setOpenModal(false);
            setDraft(null);
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
            setSolicitudes([]);
            navigate("/login", { replace: true, state: { from: location } });
            return;
        }

        alert(message || fallbackMessage);
    }, [navigate, location]);

    const refreshList = useCallback(async () => {
        if (!canAccessCredito) {
            setSolicitudes([]);
            return;
        }

        setLoadingList(true);
        setAuthError("");

        try {
            const data = await apiCredito.list();
            const rows = Array.isArray(data) ? data : [];

            setSolicitudes(rows);

            const nextInline = {};
            rows.forEach((row) => {
                nextInline[row.id] = { id_soli_cred: row.id_soli_cred || "" };
            });

            setInlineDrafts(nextInline);
        } catch (e) {
            manejarErrorCredito(e, "No se pudo cargar la lista de solicitudes.");
            setSolicitudes([]);
        } finally {
            setLoadingList(false);
        }
    }, [canAccessCredito, manejarErrorCredito]);

    useEffect(() => {
        refreshList();
    }, [refreshList]);

    const dealers = useMemo(() => {
        if (!isAdmin && userAgencias.length) return ["Todos", ...userAgencias];
        const set = new Set(solicitudes.map((c) => normalizeStr(c.agencia)).filter(Boolean));
        return ["Todos", ...Array.from(set)];
    }, [solicitudes, isAdmin, userAgencias]);

    const filtered = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const minInt = ymdToInt(filters.rangoDesde);
        const maxInt = ymdToInt(filters.rangoHasta);

        return solicitudes.filter((c) => {
            if (!isAdmin && userAgencias.length && !userTieneAgencia(c.agencia)) return false;

            const nombre = normalizeStr(c?.cliente?.nombre);
            const telefono = normalizeStr(c?.cliente?.telefono);

            const matchQ =
                !q ||
                normalizeStr(c.agencia).toLowerCase().includes(q) ||
                nombre.toLowerCase().includes(q) ||
                telefono.toLowerCase().includes(q) ||
                normalizeStr(c.id_soli_cred).toLowerCase().includes(q) ||
                normalizeStr(c.producto_financiero).toLowerCase().includes(q) ||
                normalizeStr(c.auto_interes).toLowerCase().includes(q) ||
                normalizeStr(c.canal_origen).toLowerCase().includes(q) ||
                normalizeStr(c.asesor_ventas).toLowerCase().includes(q) ||
                normalizeStr(c.estado_financiamiento).toLowerCase().includes(q) ||
                normalizeStr(c.estado_compra).toLowerCase().includes(q) ||
                normalizeStr(c.comentarios).toLowerCase().includes(q);

            const matchAgencia = filters.agencia === "Todos" || normalizeStr(c.agencia) === normalizeStr(filters.agencia);

            let matchRango = true;

            if (minInt !== null || maxInt !== null) {
                const fecha = c.creado ? ymdToInt(toYMDLocal(c.creado)) : null;
                if (!fecha) return false;
                if (minInt !== null && fecha < minInt) matchRango = false;
                if (maxInt !== null && fecha > maxInt) matchRango = false;
            }

            return matchQ && matchAgencia && matchRango;
        });
    }, [solicitudes, filters, isAdmin, userAgencias, userTieneAgencia]);

    const sorted = useMemo(() => {
        const data = [...filtered];
        const { key, dir } = sort;
        const mult = dir === "asc" ? 1 : -1;

        return data.sort((a, b) => {
            if (key === "creado" || key === "fecha_respuesta") {
                const ta = a[key] ? new Date(a[key]).getTime() : 0;
                const tb = b[key] ? new Date(b[key]).getTime() : 0;
                return (ta - tb) * mult;
            }

            if (key === "cliente_nombre") {
                return normalizeStr(a?.cliente?.nombre).localeCompare(normalizeStr(b?.cliente?.nombre)) * mult;
            }

            return normalizeStr(a?.[key]).localeCompare(normalizeStr(b?.[key])) * mult;
        });
    }, [filtered, sort]);

    const limpiarValorExcel = useCallback((value) => {
        if (value === null || value === undefined || value === "") return "—";
        const texto = String(value).trim();
        return /^[=+\-@]/.test(texto) ? `'${texto}` : texto;
    }, []);

    const formatearFechaExcel = useCallback((value) => {
        if (!value) return "—";
        const fecha = new Date(value);
        if (Number.isNaN(fecha.getTime())) return limpiarValorExcel(value);

        return new Intl.DateTimeFormat("es-MX", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        }).format(fecha);
    }, [limpiarValorExcel]);

    const formatearMontoExcel = useCallback((value) => {
        if (value === null || value === undefined || value === "") return "—";
        const numero = Number(String(value).replace(/,/g, ""));
        if (!Number.isFinite(numero)) return limpiarValorExcel(value);

        return numero.toLocaleString("es-MX", {
            style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2,
        });
    }, [limpiarValorExcel]);

    const exportarExcelSolicitudes = useCallback(() => {
        if (!sorted.length) {
            alert("No hay solicitudes para exportar con los filtros actuales.");
            return;
        }

        const ahora = new Date();
        const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
        const hora = `${String(ahora.getHours()).padStart(2, "0")}-${String(ahora.getMinutes()).padStart(2, "0")}`;

        const registros = sorted.map((row) => ({
            ID: row.id ?? "",
            "Fecha de Ingreso": formatearFechaExcel(row.creado),
            Dealer: limpiarValorExcel(row.agencia),
            Cliente: limpiarValorExcel(row?.cliente?.nombre),
            Teléfono: limpiarValorExcel(row?.cliente?.telefono),
            Correo: limpiarValorExcel(row?.cliente?.correo),
            "ID Solicitud Crédito": limpiarValorExcel(row.id_soli_cred),
            "Producto Financiero": limpiarValorExcel(row.producto_financiero),
            "Plazo Meses": limpiarValorExcel(row.plazo_meses),
            "Monto a Financiar": formatearMontoExcel(row.monto_financiero),
            "Auto Interés": limpiarValorExcel(row.auto_interes),
            "Canal de Origen": limpiarValorExcel(row.canal_origen),
            "Asesor Ventas": limpiarValorExcel(row.asesor_ventas),
            "Estado Financiamiento": limpiarValorExcel(row.estado_financiamiento),
            "Estado Compra": limpiarValorExcel(row.estado_compra),
            "Fecha de Respuesta": formatearFechaExcel(row.fecha_respuesta),
            Comentarios: limpiarValorExcel(row.comentarios),
        }));

        const ws = XLSX.utils.json_to_sheet(registros);

        ws["!cols"] = [
            { wch: 8 }, { wch: 20 }, { wch: 22 }, { wch: 32 }, { wch: 18 }, { wch: 30 }, { wch: 22 }, { wch: 24 }, { wch: 14 },
            { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 24 }, { wch: 20 }, { wch: 20 }, { wch: 45 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Solicitudes Crédito");
        XLSX.writeFile(wb, `solicitudes_credito_${fecha}_${hora}.xlsx`, { compression: true });
    }, [sorted, formatearFechaExcel, limpiarValorExcel, formatearMontoExcel]);

    const openCreate = useCallback(() => {
        setMode("create");
        setLoadingDetail(false);

        setDraft({
            id: null,
            cliente_id: null,
            creado: fechaActualDTLocal(),
            agencia: isAdmin ? "" : userAgencias[0] || "",
            cliente_nombre: "",
            cliente_telefono: "",
            cliente_correo: "",
            id_soli_cred: "",
            producto_financiero: "",
            plazo_meses: "",
            monto_financiero: "",
            auto_interes: "",
            canal_origen: "",
            asesor_ventas: "",
            estado_financiamiento: "",
            estado_compra: "",
            fecha_respuesta: "",
            comentarios: "",
        });

        setOpenModal(true);
    }, [isAdmin, userAgencias]);

    const openEdit = useCallback(async (row) => {
        if (!row?.id) return;

        try {
            setMode("edit");
            setLoadingDetail(true);
            setDraft(null);
            setOpenModal(true);

            const c = await apiCredito.get(row.id);

            if (!isAdmin && userAgencias.length && !userTieneAgencia(c.agencia)) {
                alert("No tienes permisos para ver registros de otra agencia.");
                setOpenModal(false);
                return;
            }

            setDraft({
                id: c.id,
                cliente_id: c?.cliente?.id_cliente ?? null,
                creado: toDTLocal(c.creado),
                agencia: c.agencia || (isAdmin ? "" : userAgencia),
                cliente_nombre: c?.cliente?.nombre || "",
                cliente_telefono: c?.cliente?.telefono || "",
                cliente_correo: c?.cliente?.correo || "",
                id_soli_cred: c.id_soli_cred || "",
                producto_financiero: c.producto_financiero || "",
                plazo_meses: c.plazo_meses || "",
                monto_financiero: c.monto_financiero || "",
                auto_interes: c.auto_interes || "",
                canal_origen: c.canal_origen || "",
                asesor_ventas: c.asesor_ventas || "",
                estado_financiamiento: c.estado_financiamiento || "",
                estado_compra: c.estado_compra || "",
                fecha_respuesta: toDTLocal(c.fecha_respuesta),
                comentarios: c.comentarios || "",
            });
        } catch (e) {
            manejarErrorCredito(e, "No se pudo abrir la solicitud.");
            setOpenModal(false);
        } finally {
            setLoadingDetail(false);
        }
    }, [isAdmin, userAgencias, userAgencia, userTieneAgencia, manejarErrorCredito]);

    const closeModal = useCallback(() => {
        if (saving) return;
        setOpenModal(false);
        setDraft(null);
        setLoadingDetail(false);
    }, [saving]);

    const save = useCallback(async (draftActual) => {
        if (!draftActual || saving) return;

        setSaving(true);

        try {
            const payload = {
                agencia: isAdmin ? normalizeStr(draftActual.agencia) : normalizeStr(draftActual.agencia || userAgencia),
                ...(draftActual.cliente_id ? { cliente_id: draftActual.cliente_id } : {}),
                nombre: draftActual.cliente_nombre || "",
                telefono: normalizeStr(draftActual.cliente_telefono),
                correo: draftActual.cliente_correo || "",
                creado: fromDTLocalToISO(draftActual.creado),
                id_soli_cred: draftActual.id_soli_cred || "",
                producto_financiero: draftActual.producto_financiero || "",
                plazo_meses: draftActual.plazo_meses || null,
                monto_financiero: draftActual.monto_financiero || null,
                auto_interes: draftActual.auto_interes || "",
                canal_origen: draftActual.canal_origen || "",
                asesor_ventas: draftActual.asesor_ventas || null,
                estado_financiamiento: draftActual.estado_financiamiento || "",
                estado_compra: draftActual.estado_compra || "",
                fecha_respuesta: fromDTLocalToISO(draftActual.fecha_respuesta),
                comentarios: draftActual.comentarios || null,
            };

            if (mode === "create") await apiCredito.create(payload);
            else await apiCredito.update(draftActual.id, payload);

            setOpenModal(false);
            setDraft(null);
            await refreshList();
        } catch (e) {
            manejarErrorCredito(e, "Error guardando la solicitud.");
        } finally {
            setSaving(false);
        }
    }, [saving, isAdmin, userAgencia, mode, refreshList, manejarErrorCredito]);

    const eliminarSolicitud = useCallback(async (row) => {
        if (!row?.id) return;

        if (!isAdmin && userAgencias.length && !userTieneAgencia(row.agencia)) {
            alert("No tienes permisos para eliminar registros de otra agencia.");
            return;
        }

        if (!confirm(`¿Eliminar la solicitud de ${row?.cliente?.nombre || row?.cliente?.telefono || "cliente"}?`)) return;

        try {
            await apiCredito.remove(row.id);
            setSolicitudes((prev) => prev.filter((c) => c.id !== row.id));
            setCtxMenu({ open: false, x: 0, y: 0, row: null });
        } catch (e) {
            manejarErrorCredito(e, "No se pudo eliminar la solicitud.");
        }
    }, [isAdmin, userAgencias, userTieneAgencia, manejarErrorCredito]);

    const updateInlineField = useCallback(async (row, field, value) => {
        const id = row?.id;
        if (!id) return;

        if (!isAdmin && userAgencias.length && !userTieneAgencia(row.agencia)) {
            alert("No tienes permisos para modificar registros de otra agencia.");
            return;
        }

        const prevValue = row[field] || "";

        setSolicitudes((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
        setSavingInline((prev) => ({ ...prev, [`${id}-${field}`]: true }));

        try {
            await apiCredito.patch(id, { [field]: value });
        } catch (e) {
            setSolicitudes((prev) => prev.map((item) => item.id === id ? { ...item, [field]: prevValue } : item));
            manejarErrorCredito(e, `No se pudo actualizar ${field}.`);
        } finally {
            setSavingInline((prev) => {
                const next = { ...prev };
                delete next[`${id}-${field}`];
                return next;
            });
        }
    }, [isAdmin, userAgencias, userTieneAgencia, manejarErrorCredito]);

    const handleInlineIdChange = useCallback((id, value) => {
        setInlineDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), id_soli_cred: value } }));
    }, []);

    const commitInlineId = useCallback(async (row) => {
        const id = row?.id;
        if (!id) return;

        const value = inlineDrafts[id]?.id_soli_cred ?? "";
        if (value === (row.id_soli_cred || "")) return;

        await updateInlineField(row, "id_soli_cred", value);
    }, [inlineDrafts, updateInlineField]);

    const resetFilters = useCallback(() => setFilters({ q: "", agencia: "Todos", rangoDesde: "", rangoHasta: "" }), []);

    const aplicarRango = useCallback((inicio, fin = new Date()) => {
        setFilters((prev) => ({ ...prev, rangoDesde: toYMDLocal(inicio), rangoHasta: toYMDLocal(fin) }));
    }, []);

    const setHoy = useCallback(() => aplicarRango(new Date()), [aplicarRango]);

    const setAyer = useCallback(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        aplicarRango(d, d);
    }, [aplicarRango]);

    const setSemana = useCallback(() => {
        const hoy = new Date();
        const inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() + (hoy.getDay() === 0 ? -6 : 1 - hoy.getDay()));
        aplicarRango(inicio, hoy);
    }, [aplicarRango]);

    const setUltimos7Dias = useCallback(() => {
        const hoy = new Date();
        const inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 6);
        aplicarRango(inicio, hoy);
    }, [aplicarRango]);

    const setUltimos30Dias = useCallback(() => {
        const hoy = new Date();
        const inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 29);
        aplicarRango(inicio, hoy);
    }, [aplicarRango]);

    const setEsteMes = useCallback(() => {
        const hoy = new Date();
        aplicarRango(new Date(hoy.getFullYear(), hoy.getMonth(), 1), hoy);
    }, [aplicarRango]);

    if (!canAccessCredito) {
        return (
            <div className="w-full">
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
                    Tu usuario no tiene permiso para acceder al módulo de servicios financieros.
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {authError ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{authError}</div> : null}

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="font-vw-header truncate text-lg font-extrabold text-[#131E5C]">Solicitudes de Credito</h2>
                    {!isAdmin && userAgencia ? <p className="mt-1 text-xs font-semibold text-slate-500">Agencia asignada: <span className="text-[#131E5C]">{userAgencias.join(", ")}</span></p> : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    <div className="inline-flex rounded-lg border border-[#131E5C]/20 bg-white p-1 shadow-sm">
                        <button type="button" onClick={() => setViewMode("tabla")} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${viewMode === "tabla" ? "bg-[#131E5C] text-white" : "text-[#131E5C] hover:bg-slate-100"}`}>
                            <TableProperties className="h-4 w-4" /> Tabla
                        </button>

                        <button type="button" onClick={() => setViewMode("graficas")} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${viewMode === "graficas" ? "bg-[#131E5C] text-white" : "text-[#131E5C] hover:bg-slate-100"}`}>
                            <BarChart3 className="h-4 w-4" /> Gráficas
                        </button>
                    </div>

                    <button type="button" onClick={exportarExcelSolicitudes} disabled={loadingList || !sorted.length} className="inline-flex items-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 py-2 text-sm font-semibold text-[#131E5C] shadow-sm hover:bg-slate-100 disabled:opacity-50">
                        <FileDown className="h-4 w-4" /> Exportar Excel
                    </button>

                    <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm text-white shadow-sm hover:bg-[#131E5C]/80">
                        <Plus className="h-4 w-4" /> Nueva Solicitud
                    </button>
                </div>
            </div>

            <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="grid gap-3 md:grid-cols-12">
                    <div className="md:col-span-4">
                        <FilterBlock label="Búsqueda">
                            <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />
                                <input value={filters.q} onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))} placeholder="Buscar por dealer, cliente, teléfono, solicitud, asesor…" className="w-full text-sm text-[#131E5C] outline-none" />
                                {filters.q ? <button type="button" onClick={() => setFilters((p) => ({ ...p, q: "" }))}><X className="h-4 w-4" /></button> : null}
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-2">
                        <FilterBlock label="Dealer">
                            <select value={filters.agencia} onChange={(e) => setFilters((p) => ({ ...p, agencia: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C] outline-none">
                                {dealers.map((d) => <option key={d}>{d}</option>)}
                            </select>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Acciones">
                            <div className="flex flex-wrap gap-2">
                                <button onClick={setHoy} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Hoy</button>
                                <button onClick={setAyer} className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-white">Ayer</button>
                                <button onClick={setSemana} className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white">Semana</button>
                                <button onClick={setUltimos7Dias} className="rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white">7 días</button>
                                <button onClick={setUltimos30Dias} className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white">30 días</button>
                                <button onClick={setEsteMes} className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white">Este mes</button>
                                <button onClick={resetFilters} className="rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm font-semibold text-[#131E5C]">Limpiar</button>
                            </div>
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Desde">
                            <input type="date" value={filters.rangoDesde} onChange={(e) => setFilters((p) => ({ ...p, rangoDesde: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C]" />
                        </FilterBlock>
                    </div>

                    <div className="md:col-span-6">
                        <FilterBlock label="Hasta">
                            <input type="date" value={filters.rangoHasta} onChange={(e) => setFilters((p) => ({ ...p, rangoHasta: e.target.value }))} className="w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2 text-sm text-[#131E5C]" />
                        </FilterBlock>
                    </div>
                </div>
            </div>

            {viewMode === "graficas" ? <GraficasSolicitudes rows={sorted} /> : null}

            {viewMode === "tabla" ? (
                <>
                    <MobileCardList rows={sorted} loading={loadingList} onEdit={openEdit} onContext={onRowContextMenu} />

                    <div className="hidden overflow-hidden rounded-lg bg-white/[0.03] shadow-lg lg:block">
                        <div className="overflow-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-[#131E5C] text-xs text-white">
                                    <tr>
                                        {[
                                            ["creado", "Fecha de Ingreso"],
                                            ["agencia", "Dealer"],
                                            ["cliente_nombre", "Cliente"],
                                        ].map(([key, label]) => (
                                            <th key={key} className="px-4 py-3">
                                                <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 font-bold">
                                                    {label}
                                                    {sort.key === key ? (sort.dir === "asc" ? <ChevronUp className="h-4" /> : <ChevronDown className="h-4" />) : <ArrowUpDown className="h-4" />}
                                                </button>
                                            </th>
                                        ))}
                                        <th className="px-4 py-3">ID Solicitud Credito</th>
                                        <th className="px-4 py-3">Asesor Ventas</th>
                                        <th className="px-4 py-3">Estado Financiamiento</th>
                                        <th className="px-4 py-3">Estado Compra</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-black/30">
                                    {loadingList ? (
                                        Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                    ) : (
                                        <>
                                            {sorted.map((row) => (
                                                <tr key={row.id} onDoubleClick={() => openEdit(row)} onContextMenu={(e) => onRowContextMenu(e, row)} className="cursor-pointer hover:bg-white/[0.04]">
                                                    <td className="px-4 py-3 text-[#131E5C]">{row.creado ? toDTLocal(row.creado).replace("T", " ") : "—"}</td>
                                                    <td className="px-4 py-3 font-semibold text-[#131E5C]">{row.agencia || "—"}</td>
                                                    <td className="px-4 py-3 font-bold text-[#131E5C]">{row?.cliente?.nombre || "—"}</td>

                                                    <td className="px-4 py-3">
                                                        <InlineInput
                                                            value={inlineDrafts[row.id]?.id_soli_cred ?? row.id_soli_cred ?? ""}
                                                            saving={!!savingInline[`${row.id}-id_soli_cred`]}
                                                            onChange={(e) => handleInlineIdChange(row.id, e.target.value)}
                                                            onBlur={() => commitInlineId(row)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    commitInlineId(row);
                                                                }
                                                            }}
                                                        />
                                                    </td>

                                                    <td className="px-4 py-3 text-[#131E5C]">{row.asesor_ventas || "—"}</td>

                                                    <td className="px-4 py-3">
                                                        <InlineSelect value={row.estado_financiamiento || ""} options={ESTADOS_FINANCIAMIENTO} saving={!!savingInline[`${row.id}-estado_financiamiento`]} onChange={(value) => updateInlineField(row, "estado_financiamiento", value)} />
                                                    </td>

                                                    <td className="px-4 py-3">
                                                        <InlineSelect value={row.estado_compra || ""} options={ESTADOS_COMPRA} saving={!!savingInline[`${row.id}-estado_compra`]} onChange={(value) => updateInlineField(row, "estado_compra", value)} />
                                                    </td>
                                                </tr>
                                            ))}

                                            {!sorted.length ? <tr><td colSpan={7} className="px-4 py-10 text-center text-[#131E5C]">No hay resultados con esos filtros.</td></tr> : null}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}

            <ContextMenu ctxMenu={ctxMenu} onDelete={eliminarSolicitud} onClose={() => setCtxMenu({ open: false, x: 0, y: 0, row: null })} />

            <FormularioSolicitudCredito
                open={openModal}
                mode={mode}
                initialDraft={draft}
                loading={loadingDetail}
                saving={saving}
                isAdmin={isAdmin}
                userAgencias={userAgencias}
                onClose={closeModal}
                onSave={save}
            />
        </div>
    );
}