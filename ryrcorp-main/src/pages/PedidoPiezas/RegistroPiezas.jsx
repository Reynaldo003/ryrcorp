//src/pages/PedidoPiezas/RegistroPiezas.jsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import * as echarts from "echarts";
import { useAuth } from "../../auth/AuthContext";
import {
    Plus,
    Search,
    X,
    Save,
    PackageSearch,
    ClipboardList,
    User,
    Wrench,
    Pencil,
    Trash2,
    PackagePlus,
    BarChart3,
    PackageCheck,
    PackageX,
    Truck,
    AlertTriangle,
} from "lucide-react";
import { apiPedidosPiezas } from "../../lib/apiPedidosPiezas";

const BRAND_BLUE = "#131E5C";

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
    "Chirey",
    "JAECOO R&R",
];

const TIPOS_PEDIDO = ["STOCK", "NORA", "HOTLINE"];
const ESTATUS_PEDIDO = ["Entregadas", "En almacén", "En camino", "Back Order"];
const CANALES = [
    "Mostrador Taller",
    "Mostrador Público",
    "Promotoria",
    "Carrocería y Pintura",
];
const ASESORES = [
    "Carlos Oliveros",
    "Norma Angélica Reyes",
    "Yamil Tepole",
    "Ivan Ramírez",
    "Verónica González",
    "Francisco Olayo",
    "Axel Nava",
    "Ricardo López Campos",
    "Emmanuel Pulido",
    "Andrea García"
];

// ---- Indicadores: paleta y orden del flujo de estatus ----
const STATUS_COLORS = {
    "Entregadas": "#10b981",
    "En almacén": "#0ea5e9",
    "En camino": "#f59e0b",
    "Back Order": "#f43f5e",
};

const FUNNEL_ORDER = ["En almacén", "En camino", "Back Order", "Entregadas"];

function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

function createLocalId(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value) {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function onlyLetters(value) {
    return value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "");
}

function onlyNumbers(value) {
    return value.replace(/\D/g, "");
}

function onlyPartNumber(value) {
    return value.replace(/[^A-Za-z0-9\-/. ]/g, "").toUpperCase();
}

function todayYmd() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function formatDate(dateString) {
    if (!dateString) return "—";

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [yyyy, mm, dd] = dateString.split("-");
        return `${dd}/${mm}/${yyyy}`;
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function formatDateTime(dateString) {
    if (!dateString) return "—";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function createEmptyPiece(partial = {}) {
    return {
        id: null,
        rowKey: createLocalId("pieza"),
        piezaId: null,
        numeroParte: "",
        descripcion: "",
        cantidad: 1,
        tipoPedido: "STOCK",
        estatus: "En almacén",
        costoUnitario: "",
        fechaLlegada: "",
        ...partial,
    };
}

function getTotalPieces(piezas = []) {
    return piezas.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
}

function getDeliveredPieces(piezas = []) {
    return piezas.reduce((acc, item) => {
        if ((item.estatus || "").trim() === "Entregadas") {
            return acc + Number(item.cantidad || 0);
        }
        return acc;
    }, 0);
}

function getProgress(order) {
    const total = getTotalPieces(order?.piezas || []);
    if (!total) return 0;
    return Math.round((getDeliveredPieces(order.piezas) / total) * 100);
}

function statusBadgeClass(status) {
    switch (status) {
        case "Entregadas":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";
        case "En almacén":
            return "border-sky-200 bg-sky-50 text-sky-700";
        case "En camino":
            return "border-amber-200 bg-amber-50 text-amber-700";
        case "Back Order":
            return "border-rose-200 bg-rose-50 text-rose-700";
        default:
            return "border-slate-200 bg-slate-50 text-slate-700";
    }
}

function validateDraft(draft) {
    const errors = {};

    if (!draft.numeroPedido.trim()) {
        errors.numeroPedido = "El número de pedido es obligatorio.";
    }

    if (!draft.dealer) {
        errors.dealer = "Selecciona un dealer.";
    }

    if (!draft.fechaPedido) {
        errors.fechaPedido = "La fecha de pedido es obligatoria.";
    }

    if (!draft.fechaProgramadaLlegada) {
        errors.fechaProgramadaLlegada = "La fecha programada de llegada es obligatoria.";
    }

    if (!draft.nombreCliente.trim()) {
        errors.nombreCliente = "El nombre del cliente es obligatorio.";
    } else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(draft.nombreCliente.trim())) {
        errors.nombreCliente = "El nombre del cliente solo acepta letras y espacios.";
    }

    if (!draft.ordenServicio.trim()) {
        errors.ordenServicio = "La orden de servicio es obligatoria.";
    } else if (!/^\d+$/.test(draft.ordenServicio.trim())) {
        errors.ordenServicio = "La orden de servicio solo acepta números.";
    }

    if (!draft.canal) {
        errors.canal = "Selecciona un canal.";
    }

    if (!draft.asesor) {
        errors.asesor = "Selecciona un asesor.";
    }

    if (!draft.estatus) {
        errors.estatus = "Selecciona un estatus.";
    }

    if (!Array.isArray(draft.piezas) || draft.piezas.length === 0) {
        errors.piezas = "Debes agregar al menos una pieza al pedido.";
    }

    const piecesErrors = (draft.piezas || []).map((pieza) => {
        const pieceError = {};

        if (!pieza.numeroParte.trim()) {
            pieceError.numeroParte = "Requerido";
        } else if (!/^[A-Za-z0-9\-/. ]+$/.test(pieza.numeroParte.trim())) {
            pieceError.numeroParte = "Solo letras y números";
        }

        if (!pieza.descripcion.trim()) {
            pieceError.descripcion = "Requerido";
        }

        if (!String(pieza.cantidad ?? "").trim()) {
            pieceError.cantidad = "Requerido";
        } else if (!/^\d+$/.test(String(pieza.cantidad)) || Number(pieza.cantidad) <= 0) {
            pieceError.cantidad = "Cantidad inválida";
        }

        if (pieza.fechaLlegada && draft.fechaPedido && pieza.fechaLlegada < draft.fechaPedido) {
            pieceError.fechaLlegada = "No puede ser menor que la fecha del pedido";
        }

        if ((pieza.estatus || "").trim() === "Entregadas" && !pieza.fechaLlegada) {
            pieceError.fechaLlegada = "Captura la fecha de llegada";
        }

        return pieceError;
    });

    if (piecesErrors.some((item) => Object.keys(item).length > 0)) {
        errors.piezasDetalle = piecesErrors;
    }

    return errors;
}

function hasErrors(errors) {
    if (!errors) return false;

    return Object.keys(errors).some((key) => {
        const value = errors[key];

        if (Array.isArray(value)) {
            return value.some((item) => Object.keys(item || {}).length > 0);
        }

        return Boolean(value);
    });
}

function extractData(response) {
    if (response?.data) return response.data;
    return response;
}

function getFirstErrorText(value) {
    if (Array.isArray(value)) {
        return value.map(getFirstErrorText).filter(Boolean).join(" ");
    }

    if (value && typeof value === "object") {
        return Object.values(value).map(getFirstErrorText).filter(Boolean).join(" ");
    }

    if (typeof value === "string") {
        return value;
    }

    return "";
}

function mapApiErrors(error) {
    const data = error?.data;

    if (!data || typeof data !== "object") {
        return {
            general: error?.message || "No se pudo procesar la solicitud.",
        };
    }

    const mapped = {};

    Object.entries(data).forEach(([key, value]) => {
        if (key === "piezas" && Array.isArray(value)) {
            const nested = value.filter(
                (item) => item && typeof item === "object" && !Array.isArray(item)
            );

            if (nested.length > 0) {
                mapped.piezasDetalle = value.map((item) => {
                    if (!item || typeof item !== "object" || Array.isArray(item)) {
                        return {};
                    }

                    const detalle = {};
                    Object.entries(item).forEach(([field, fieldValue]) => {
                        detalle[field] = getFirstErrorText(fieldValue);
                    });
                    return detalle;
                });
            }

            const generalPiecesError = value
                .filter((item) => typeof item === "string")
                .map((item) => getFirstErrorText(item))
                .join(" ");

            if (generalPiecesError) {
                mapped.piezas = generalPiecesError;
            }

            return;
        }

        mapped[key] = getFirstErrorText(value);
    });

    return mapped;
}

function hydrateOrder(order) {
    return {
        ...order,
        piezas: (order.piezas || []).map((pieza) =>
            createEmptyPiece({
                id: pieza.id ?? null,
                rowKey: pieza.id ? `pieza-${pieza.id}` : createLocalId("pieza"),
                piezaId: pieza.piezaId ?? null,
                numeroParte: pieza.numeroParte || "",
                descripcion: pieza.descripcion || "",
                cantidad: pieza.cantidad || 1,
                tipoPedido: pieza.tipoPedido || "STOCK",
                estatus: pieza.estatus || "En almacén",
                costoUnitario: pieza.costoUnitario ?? "",
                fechaLlegada: pieza.fechaLlegada || "",
            })
        ),
    };
}

function buildPedidoPayload(draft) {
    return {
        numeroPedido: draft.numeroPedido.trim(),
        fechaPedido: draft.fechaPedido,
        fechaProgramadaLlegada: draft.fechaProgramadaLlegada || null,
        dealer: draft.dealer.trim(),
        nombreCliente: draft.nombreCliente.trim(),
        asesor: draft.asesor.trim(),
        ordenServicio: draft.ordenServicio.trim(),
        ticketSar: draft.ticketSar.trim(),
        canal: draft.canal.trim(),
        estatus: draft.estatus.trim(),
        piezas: (draft.piezas || []).map((pieza) => {
            const payloadPieza = {
                piezaId: pieza.piezaId || null,
                numeroParte: pieza.numeroParte.trim(),
                descripcion: pieza.descripcion.trim(),
                cantidad: Number(pieza.cantidad),
                tipoPedido: (pieza.tipoPedido || "").trim(),
                estatus: (pieza.estatus || "").trim(),
                fechaLlegada: pieza.fechaLlegada || null,
            };

            if (
                pieza.costoUnitario !== "" &&
                pieza.costoUnitario !== null &&
                pieza.costoUnitario !== undefined
            ) {
                payloadPieza.costoUnitario = Number(pieza.costoUnitario);
            }

            return payloadPieza;
        }),
    };
}

function SectionTitle({ icon: Icon, title, subtitle }) {
    return (
        <div className="mb-4 flex items-start gap-3">
            <div className="mt-0.5 rounded-2xl bg-[#131E5C]/10 p-2 text-[#131E5C]">
                <Icon className="h-5 w-5" />
            </div>

            <div>
                <h3 className="text-base font-extrabold text-[#131E5C]">{title}</h3>
                {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
        </div>
    );
}

function Field({ label, error, children, hint }) {
    return (
        <div className="rounded-2xl bg-slate-50/70 p-4">
            <div className="mb-2 text-sm font-bold text-[#131E5C]">{label}</div>
            {children}
            {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
            {error ? <div className="mt-2 text-xs font-bold text-red-600">{error}</div> : null}
        </div>
    );
}

function Modal({ open, title, onClose, children, footer }) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <div className="w-full max-w-5xl overflow-hidden rounded-lg border border-[#131E5C]/20 bg-white shadow-2xl">
                    <div
                        className="flex items-center justify-between gap-3 px-5 py-4"
                        style={{ backgroundColor: BRAND_BLUE }}
                    >
                        <div className="min-w-0">
                            <div className="truncate text-lg font-extrabold text-white">{title}</div>
                        </div>

                        <button
                            onClick={onClose}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="max-h-[78vh] overflow-y-auto bg-slate-50 p-5">{children}</div>

                    <div className="border-t border-slate-200 bg-white px-5 py-4">
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// INDICADORES 

function diasEntre(fechaIso) {
    if (!fechaIso) return 0;
    const inicio = new Date(fechaIso);
    if (Number.isNaN(inicio.getTime())) return 0;
    const hoy = new Date();
    const ms = hoy.setHours(0, 0, 0, 0) - inicio.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function flattenPiezas(pedidos) {
    const out = [];
    pedidos.forEach((pedido) => {
        (pedido.piezas || []).forEach((pieza) => {
            out.push({
                ...pieza,
                numeroPedido: pedido.numeroPedido,
                dealer: pedido.dealer,
                fechaPedido: pedido.fechaPedido,
                cliente: pedido.nombreCliente,
            });
        });
    });
    return out;
}

function useEcharts(ref, optionFactory, deps) {
    useEffect(() => {
        if (!ref.current) return;

        const chart = echarts.init(ref.current, null, { renderer: "svg" });
        const option = optionFactory();
        if (option) chart.setOption(option);

        const onResize = () => chart.resize();
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
            chart.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

function KpiCard({ icon: Icon, label, value, accent, suffix }) {
    return (
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.08]"
                style={{ backgroundColor: accent }}
            />
            <div className="flex items-center justify-between">
                <div
                    className="rounded-2xl p-2.5"
                    style={{ backgroundColor: `${accent}1A`, color: accent }}
                >
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <div className="mt-4 text-3xl font-extrabold text-[#131E5C]">
                {value}
                {suffix ? (
                    <span className="ml-1 text-base font-bold text-slate-400">
                        {suffix}
                    </span>
                ) : null}
            </div>
            <div className="mt-1 text-sm font-bold text-slate-500">{label}</div>
        </div>
    );
}

function IndicadoresPiezas({ pedidos = [] }) {
    const funnelRef = useRef(null);
    const donutRef = useRef(null);
    const agingRef = useRef(null);
    const dealerRef = useRef(null);

    const piezas = useMemo(() => flattenPiezas(pedidos), [pedidos]);

    const totales = useMemo(() => {
        const acc = {
            total: 0,
            "Entregadas": 0,
            "En almacén": 0,
            "En camino": 0,
            "Back Order": 0,
        };
        piezas.forEach((p) => {
            const cantidad = Number(p.cantidad || 0);
            acc.total += cantidad;
            if (acc[p.estatus] !== undefined) {
                acc[p.estatus] += cantidad;
            }
        });
        return acc;
    }, [piezas]);

    const pendientes = totales.total - totales["Entregadas"];

    const piezasAntiguas = useMemo(() => {
        return piezas
            .filter((p) => p.estatus !== "Entregadas")
            .map((p) => ({
                ...p,
                dias: diasEntre(p.fechaPedido),
            }))
            .sort((a, b) => b.dias - a.dias)
            .slice(0, 8);
    }, [piezas]);

    const porDealer = useMemo(() => {
        const map = {};
        piezas.forEach((p) => {
            if (p.estatus === "Entregadas") return;
            const key = p.dealer || "Sin dealer";
            map[key] = (map[key] || 0) + Number(p.cantidad || 0);
        });
        return Object.entries(map)
            .map(([dealer, cantidad]) => ({ dealer, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad);
    }, [piezas]);

    // ---- Funnel: flujo real del inventario ----
useEcharts(
    funnelRef,
    () => {
        if (totales.total === 0) return null;

        const items = [
            { estatus: "En almacén", color: STATUS_COLORS["En almacén"], valor: totales["En almacén"] || 0 },
            { estatus: "En camino",  color: STATUS_COLORS["En camino"],  valor: totales["En camino"]  || 0 },
            { estatus: "Back Order", color: STATUS_COLORS["Back Order"], valor: totales["Back Order"] || 0 },
            { estatus: "Entregadas", color: STATUS_COLORS["Entregadas"], valor: totales["Entregadas"] || 0 },
        ].map((i) => ({
            ...i,
            pct: totales.total > 0 ? +((i.valor / totales.total) * 100).toFixed(1) : 0,
        }));

        const rings = [
            { r1: "98%" },
            { r1: "76%" },
            { r1: "54%" },
            { r1: "32%" },
        ];

        return {
            tooltip: {
                trigger: "item",
                backgroundColor: "#0f172a",
                borderColor: "transparent",
                textStyle: { color: "#f1f5f9", fontSize: 13 },
                formatter: (p) => {
                    const item = items.find((i) => i.estatus === p.seriesName);
                    if (!item) return "";
                    return `
                        <div style="font-weight:800;color:${item.color};margin-bottom:6px">${item.estatus}</div>
                        <div style="display:flex;justify-content:space-between;gap:24px">
                            <span style="color:#94a3b8">Piezas</span>
                            <span style="font-weight:800">${item.valor}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;gap:24px">
                            <span style="color:#94a3b8">Del total</span>
                            <span style="font-weight:800">${item.pct}%</span>
                        </div>
                    `;
                },
            },
        
            series: items.map((item, idx) => ({
                name: item.estatus,
                type: "gauge",
                radius: rings[idx].r1,
                startAngle: 200,
                endAngle: -20,
                min: 0,
                max: 100,
                center: ["50%", "55%"],
                pointer: { show: false },
                progress: {
                    show: true,
                    overlap: false,
                    width: 18,
                    itemStyle: {
                        color: item.color,
                        shadowBlur: 8,
                        shadowColor: item.color + "55",
                    },
                },
                axisLine: {
                    lineStyle: {
                        width: 18,
                        color: [[1, "#f1f5f9"]],
                    },
                },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                title: { show: false }, 
                // Sin detail, sin texto en el centro
                detail: { show: false },
                data: [{ value: item.pct, name: item.estatus }],
                animationEasing: "cubicOut",
                animationDuration: 1400,
                animationDelay: idx * 250,
            })),
        };
    },
    [totales]
);

    // Donut 
    useEcharts(
        donutRef,
        () => {
            if (totales.total === 0) return null;
            const data = FUNNEL_ORDER.map((estatus) => ({
                name: estatus,
                value: totales[estatus] || 0,
                itemStyle: { color: STATUS_COLORS[estatus] },
            })).filter((d) => d.value > 0);

            return {
                tooltip: {
                    trigger: "item",
                    formatter: "{b}: {c} piezas ({d}%)",
                },
                legend: {
                    bottom: 0,
                    icon: "circle",
                    textStyle: { color: "#475569", fontWeight: 600, fontSize: 11 },
                    itemGap: 14,
                },
                series: [
                    {
                        type: "pie",
                        radius: ["46%", "68%"],
                        center: ["50%", "44%"],
                        avoidLabelOverlap: true,
                        itemStyle: {
                            borderRadius: 8,
                            borderColor: "#fff",
                            borderWidth: 3,
                        },
                        label: {
                            show: true,
                            position: "center",
                            formatter: () =>
                                `{big|${totales.total}}\n{small|piezas totales}`,
                            rich: {
                                big: {
                                    fontSize: 26,
                                    fontWeight: 800,
                                    color: BRAND_BLUE,
                                    lineHeight: 30,
                                },
                                small: {
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#94a3b8",
                                },
                            },
                        },
                        emphasis: {
                            scale: true,
                            scaleSize: 8,
                            label: {
                                show: true,
                                formatter: "{b}\n{c} ({d}%)",
                                fontSize: 13,
                                fontWeight: 700,
                            },
                        },
                        labelLine: { show: false },
                        data,
                        animationType: "scale",
                        animationEasing: "elasticOut",
                        animationDelay: (idx) => idx * 80,
                    },
                ],
            };
        },
        [totales]
    );

    // ---- Antigüedad de pendientes: qué piezas urge perseguir ----
useEcharts(
    agingRef,
    () => {
        if (piezasAntiguas.length === 0) return null;

        const ordered = [...piezasAntiguas].reverse();
        const maxDias = Math.max(...ordered.map((p) => p.dias), 1);
        const axisMax = Math.ceil(maxDias * 1.18);

        const getColor = (dias) =>
            dias > 15 ? "#f43f5e" : dias > 7 ? "#f59e0b" : "#0ea5e9";

        return {
            grid: { left: 10, right: 56, top: 8, bottom: 8, containLabel: true },
            tooltip: {
                trigger: "item",
                backgroundColor: "#0f172a",
                borderColor: "transparent",
                textStyle: { color: "#f1f5f9", fontSize: 12 },
                formatter: (p) => {
                    const item = ordered[p.dataIndex];
                    const urgencia = item.dias > 15 ? "🔴 URGENTE" : item.dias > 7 ? "🟡 Atención" : "🔵 Normal";
                    return `
                        <div style="font-weight:800;margin-bottom:4px">${item.numeroParte}</div>
                        <div style="color:#94a3b8;font-size:11px;margin-bottom:6px">${item.descripcion}</div>
                        <div style="color:#94a3b8">Pedido <strong style="color:#f1f5f9">${item.numeroPedido}</strong> · ${item.dealer}</div>
                        <div style="margin-top:6px">${urgencia} — <strong style="color:${getColor(item.dias)}">${item.dias}d</strong></div>
                    `;
                },
            },
            xAxis: {
                type: "value",
                max: axisMax,
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
                axisLabel: { color: "#94a3b8", fontSize: 10 },
            },
            yAxis: {
                type: "category",
                data: ordered.map((p) => p.numeroParte),
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: "#334155", fontWeight: 700, fontSize: 11 },
            },
            series: [
                {
                    type: "bar",
                    data: ordered.map((p) => ({
                        value: p.dias,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                { offset: 0, color: getColor(p.dias) + "55" },
                                { offset: 1, color: getColor(p.dias) },
                            ]),
                            borderRadius: [0, 8, 8, 0],
                        },
                    })),
                    barWidth: 14,
                    label: {
                        show: true,
                        position: "right",
                        formatter: (p) => `${p.value}d`,
                        fontWeight: 800,
                        fontSize: 11,
                        color: "#475569",
                    },
                    markArea: {
                        silent: true,
                        label: { show: false }, 
                        data: [
                            [
                                { xAxis: 0,  itemStyle: { color: "rgba(14,165,233,0.06)"  } },
                                { xAxis: 7  },
                            ],
                            [
                                { xAxis: 7,  itemStyle: { color: "rgba(245,158,11,0.06)" } },
                                { xAxis: 15 },
                            ],
                            [
                                { xAxis: 15, itemStyle: { color: "rgba(244,63,94,0.06)"  } },
                                { xAxis: axisMax },
                            ],
                        ],
                    },
                    animationEasing: "cubicOut",
                    animationDuration: 1000,
                    animationDelay: (idx) => idx * 80,
                },
            ],
        };
    },
    [piezasAntiguas]
);
    // ---- Pendientes por dealer ----
useEcharts(
    dealerRef,
    () => {
        if (porDealer.length === 0) return null;

        const total = porDealer.reduce((a, d) => a + d.cantidad, 0);
        const maxVal = Math.max(...porDealer.map((d) => d.cantidad), 1);

        const palette = [BRAND_BLUE, "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa"];

        return {
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
                backgroundColor: "#0f172a",
                borderColor: "transparent",
                textStyle: { color: "#f1f5f9", fontSize: 13 },
                formatter: (params) => {
                    const p = params[0];
                    const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : "0";
                    return `
                        <div style="font-weight:800;font-size:14px;margin-bottom:6px">${p.name}</div>
                        <div style="display:flex;justify-content:space-between;gap:20px">
                            <span style="color:#94a3b8">Piezas pendientes</span>
                            <span style="font-weight:800;color:#60a5fa">${p.value}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;gap:20px">
                            <span style="color:#94a3b8">Del total pendiente</span>
                            <span style="font-weight:800">${pct}%</span>
                        </div>
                    `;
                },
            },
            grid: { left: 10, right: 10, top: 16, bottom: 10, containLabel: true },
            xAxis: {
                type: "category",
                data: porDealer.map((d) => d.dealer.replace("VW ", "")),
                axisLine: { lineStyle: { color: "#e2e8f0" } },
                axisTick: { show: false },
                axisLabel: { color: "#334155", fontWeight: 700, fontSize: 11, interval: 0 },
            },
            yAxis: {
                type: "value",
                max: Math.ceil(maxVal * 1.25),
                splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
                axisLabel: { color: "#94a3b8", fontSize: 10 },
            },
            series: [
            
                {
                    type: "bar",
                    data: porDealer.map(() => Math.ceil(maxVal * 1.25)),
                    barWidth: "55%",
                    itemStyle: { color: "#f1f5f9", borderRadius: [8, 8, 0, 0] },
                    silent: true,
                    animation: false,
                    z: 1,
                },
               
                {
                    type: "bar",
                    data: porDealer.map((d, idx) => ({
                        value: d.cantidad,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                { offset: 0, color: palette[idx % palette.length] },
                                { offset: 1, color: palette[idx % palette.length] + "99" },
                            ]),
                            borderRadius: [8, 8, 0, 0],
                            shadowBlur: 8,
                            shadowColor: palette[idx % palette.length] + "44",
                            shadowOffsetY: -4,
                        },
                    })),
                    barWidth: "55%",
                    barGap: "-100%",
                    label: {
                        show: true,
                        position: "top",
                        formatter: (p) => {
                            const pct = total > 0 ? ((p.value / total) * 100).toFixed(0) : "0";
                            return `{val|${p.value}}\n{pct|${pct}%}`;
                        },
                        rich: {
                            val: {
                                fontSize: 14,
                                fontWeight: 800,
                                color: BRAND_BLUE,
                                lineHeight: 20,
                            },
                            pct: {
                                fontSize: 10,
                                fontWeight: 600,
                                color: "#94a3b8",
                                lineHeight: 14,
                            },
                        },
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 20,
                            shadowColor: `${BRAND_BLUE}55`,
                        },
                    },
                    animationEasing: "elasticOut",
                    animationDuration: 1200,
                    animationDelay: (idx) => idx * 120,
                    z: 2,
                },
            ],
        };
    },
    [porDealer]
);
    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    icon={PackageCheck}
                    label="Piezas entregadas"
                    value={totales["Entregadas"]}
                    accent="#10b981"
                />
                <KpiCard
                    icon={Truck}
                    label="En camino"
                    value={totales["En camino"]}
                    accent="#f59e0b"
                />
                <KpiCard
                    icon={PackageX}
                    label="Back Order"
                    value={totales["Back Order"]}
                    accent="#f43f5e"
                />
                <KpiCard
                    icon={AlertTriangle}
                    label="Total pendientes"
                    value={pendientes}
                    accent={BRAND_BLUE}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
                    <div className="mb-1 text-sm font-extrabold text-[#131E5C]">
                        Flujo de piezas por estatus
                    </div>
                    <div className="mb-3 text-xs font-semibold text-slate-400">
                        De pedido a entrega, dónde está el inventario hoy
                    </div>
                    <div ref={funnelRef} style={{ width: "100%", height: 260 }} />

{/* Leyenda manual debajo, sin interferir con el chart */}
<div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
    {[
        { estatus: "En almacén", color: STATUS_COLORS["En almacén"] },
        { estatus: "En camino",  color: STATUS_COLORS["En camino"]  },
        { estatus: "Back Order", color: STATUS_COLORS["Back Order"] },
        { estatus: "Entregadas", color: STATUS_COLORS["Entregadas"] },
    ].map(({ estatus, color }) => {
        const valor = totales[estatus] || 0;
        const pct = totales.total > 0
            ? ((valor / totales.total) * 100).toFixed(1)
            : "0.0";
        return (
            <div key={estatus} className="flex items-center gap-2">
                <div
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                />
                <span className="text-xs font-bold text-slate-600">
                    {estatus}
                </span>
                <span className="ml-auto text-xs font-extrabold" style={{ color }}>
                    {pct}% <span className="font-semibold text-slate-400">({valor})</span>
                </span>
            </div>
        );
    })}
</div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="mb-1 text-sm font-extrabold text-[#131E5C]">
                        Distribución por estatus
                    </div>
                    <div className="mb-3 text-xs font-semibold text-slate-400">
                        Proporción del total de piezas
                    </div>
                    <div ref={donutRef} style={{ width: "100%", height: 260 }} />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
                    <div className="mb-1 text-sm font-extrabold text-[#131E5C]">
                        Piezas con más días de espera
                    </div>
                    <div className="mb-3 text-xs font-semibold text-slate-400">
                        Las que urge dar seguimiento con el proveedor
                    </div>
                    {piezasAntiguas.length === 0 ? (
                        <div className="flex h-[220px] items-center justify-center text-sm font-semibold text-slate-400">
                            No hay piezas pendientes 🎉
                        </div>
                    ) : (
                        <div
    ref={agingRef}
    style={{ width: "100%", height: 260 }}
/>
                    )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="mb-1 text-sm font-extrabold text-[#131E5C]">
                        Pendientes por dealer
                    </div>
                    <div className="mb-3 text-xs font-semibold text-slate-400">
                        Carga de piezas sin entregar por sucursal
                    </div>
                    {porDealer.length === 0 ? (
                        <div className="flex h-[220px] items-center justify-center text-sm font-semibold text-slate-400">
                            Sin pendientes por dealer
                        </div>
                    ) : (
                        <div ref={dealerRef} style={{ width: "100%", height: 260 }} />
                    )}
                </div>
            </div>
        </div>
    );
}

// COMPONENTE PRINCIPAL
export default function AdministradorPedidosPiezas() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingPieces, setLoadingPieces] = useState(false);
    const [tableError, setTableError] = useState("");
    const [mostrarIndicadores, setMostrarIndicadores] = useState(false);

    const [filters, setFilters] = useState({
        q: "",
        dealer: "Todos",
        estatus: "Todos",
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState("create");
    const [draft, setDraft] = useState(null);
    const [pieceSearch, setPieceSearch] = useState("");
    const [pieceSearchResults, setPieceSearchResults] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const { user } = useAuth();
    const permisos = user?.permisos || [];
    const rol = String(user?.rol || "").trim().toLowerCase();

    const isAdmin = useMemo(() => {
    return (
        rol === "administrador" ||
        permisos.includes("ALL") ||
        permisos.includes("USUARIOS_ADMIN")
    );
}, [rol, permisos]);

const userAgencias = useMemo(() => {
    return String(user?.agencia || "")
        .split("|")
        .map((a) => a.trim())
        .filter(Boolean);
}, [user?.agencia]);

const userTieneAgencia = useCallback((agenciaRegistro) => {
    if (isAdmin) return true;
    if (userAgencias.length === 0) return true;
    const agencia = String(agenciaRegistro ?? "").trim().toLowerCase();
    return userAgencias.some((ua) => ua.toLowerCase() === agencia);
}, [isAdmin, userAgencias]);

    async function loadPedidos() {
        try {
            setLoading(true);
            setTableError("");
            const response = await apiPedidosPiezas.listPedidos();
            const data = extractData(response);
            setPedidos(Array.isArray(data) ? data : []);
        } catch (error) {
            setTableError(error.message || "No se pudieron cargar los pedidos.");
            setPedidos([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPedidos();
    }, []);

    useEffect(() => {
        const delay = setTimeout(async () => {
            const q = pieceSearch.trim();

            if (!q) {
                setPieceSearchResults([]);
                return;
            }

            try {
                setLoadingPieces(true);
                const response = await apiPedidosPiezas.listPiezas(q);
                const data = extractData(response);
                setPieceSearchResults(Array.isArray(data) ? data.slice(0, 8) : []);
            } catch {
                setPieceSearchResults([]);
            } finally {
                setLoadingPieces(false);
            }
        }, 300);

        return () => clearTimeout(delay);
    }, [pieceSearch]);

    const filteredOrders = useMemo(() => {
    const q = normalizeText(filters.q);

    return pedidos.filter((order) => {
        if (!userTieneAgencia(order.dealer)) return false;

        const matchesDealer =
            filters.dealer === "Todos" || order.dealer === filters.dealer;

            const matchesStatus =
                filters.estatus === "Todos" || order.estatus === filters.estatus;

            const searchablePieces = (order.piezas || [])
                .map((pieza) => `${pieza.numeroParte} ${pieza.descripcion}`)
                .join(" ");

            const hayMatchTexto =
                !q ||
                normalizeText(order.numeroPedido).includes(q) ||
                normalizeText(order.nombreCliente).includes(q) ||
                normalizeText(order.ordenServicio).includes(q) ||
                normalizeText(order.ticketSar).includes(q) ||
                normalizeText(order.canal).includes(q) ||
                normalizeText(order.asesor).includes(q) ||
                normalizeText(searchablePieces).includes(q);

            return matchesDealer && matchesStatus && hayMatchTexto;
        });
    }, [pedidos, filters]);

    function openCreate() {
        setMode("create");
        setErrors({});
        setPieceSearch("");
        setPieceSearchResults([]);
        setDraft({
            id: null,
            numeroPedido: "",
            creadoEn: "",
            fechaPedido: todayYmd(),
            fechaProgramadaLlegada: todayYmd(),
            dealer: isAdmin ? DEALERS[0] : (userAgencias[0] || DEALERS[0]),
            nombreCliente: "",
            ordenServicio: "",
            ticketSar: "",
            canal: CANALES[0],
            asesor: ASESORES[0],
            estatus: "En almacén",
            piezas: [createEmptyPiece()],
        });
        setModalOpen(true);
    }

    function openEdit(order) {
        setMode("edit");
        setErrors({});
        setPieceSearch("");
        setPieceSearchResults([]);
        setDraft(hydrateOrder(order));
        setModalOpen(true);
    }

    function closeModal() {
        if (saving) return;
        setModalOpen(false);
        setDraft(null);
        setPieceSearch("");
        setPieceSearchResults([]);
        setErrors({});
    }

    function updateDraftField(field, value) {
        setDraft((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    function addBlankPiece() {
        setDraft((prev) => ({
            ...prev,
            piezas: [...prev.piezas, createEmptyPiece()],
        }));
    }

    function addPieceFromCatalog(piece) {
        setDraft((prev) => ({
            ...prev,
            piezas: [
                ...prev.piezas,
                createEmptyPiece({
                    piezaId: piece.id ?? null,
                    numeroParte: piece.numeroParte || "",
                    descripcion: piece.descripcion || "",
                    cantidad: 1,
                    tipoPedido: "STOCK",
                    estatus: "En almacén",
                    costoUnitario: piece.costo ?? "",
                }),
            ],
        }));

        setPieceSearch("");
        setPieceSearchResults([]);
    }

    function updatePiece(pieceRowKey, field, value) {
        setDraft((prev) => ({
            ...prev,
            piezas: prev.piezas.map((pieza) =>
                pieza.rowKey === pieceRowKey ? { ...pieza, [field]: value } : pieza
            ),
        }));
    }

    function removePiece(pieceRowKey) {
        setDraft((prev) => ({
            ...prev,
            piezas: prev.piezas.filter((pieza) => pieza.rowKey !== pieceRowKey),
        }));
    }

    async function quickUpdateOrderStatus(orderId, estatus) {
        const pedidoActual = pedidos.find((item) => item.id === orderId);
        if (!pedidoActual) return;

        const previo = pedidos;

        setPedidos((prev) =>
            prev.map((item) => (item.id === orderId ? { ...item, estatus } : item))
        );

        try {
            await apiPedidosPiezas.patchPedido(orderId, { estatus });
        } catch (error) {
            setPedidos(previo);
            window.alert(error.message || "No se pudo actualizar el estatus.");
        }
    }

    async function removeOrder(orderId) {
        const confirmDelete = window.confirm("¿Deseas eliminar este pedido?");
        if (!confirmDelete) return;

        try {
            await apiPedidosPiezas.deletePedido(orderId);
            setPedidos((prev) => prev.filter((item) => item.id !== orderId));
        } catch (error) {
            window.alert(error.message || "No se pudo eliminar el pedido.");
        }
    }

    function resetFilters() {
        setFilters({
            q: "",
            dealer: "Todos",
            estatus: "Todos",
        });
    }

    async function saveOrder() {
        const validation = validateDraft(draft);
        setErrors(validation);

        if (hasErrors(validation)) return;

        setSaving(true);

        try {
            const payload = buildPedidoPayload(draft);

            let response;
            if (mode === "create") {
                response = await apiPedidosPiezas.createPedido(payload);
            } else {
                response = await apiPedidosPiezas.updatePedido(draft.id, payload);
            }

            const savedOrder = extractData(response);

            if (mode === "create") {
                setPedidos((prev) => [savedOrder, ...prev]);
            } else {
                setPedidos((prev) =>
                    prev.map((item) => (item.id === savedOrder.id ? savedOrder : item))
                );
            }

            closeModal();
        } catch (error) {
            setErrors(mapApiErrors(error));
        } finally {
            setSaving(false);
        }
    }

    const totalDraftPieces = useMemo(() => {
        return getTotalPieces(draft?.piezas || []);
    }, [draft]);

    const deliveredDraftPieces = useMemo(() => {
        return getDeliveredPieces(draft?.piezas || []);
    }, [draft]);

    const draftProgress = useMemo(() => {
        if (!draft) return 0;
        return getProgress(draft);
    }, [draft]);

    const inputBase =
        "w-full rounded-lg border border-[#131E5C] bg-white px-3 py-2.5 text-sm font-semibold text-[#131E5C] outline-none transition focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/10";

    return (
        <div className="w-full">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-2xl font-extrabold text-[#131E5C]">
                        Administrador de Pedido de Piezas
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMostrarIndicadores((prev) => !prev)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-5 py-3 text-sm font-bold text-[#131E5C] shadow-sm transition hover:bg-[#131E5C]/5"
                    >
                        <BarChart3 className="h-4 w-4" />
                        {mostrarIndicadores ? "Ocultar Indicadores" : "Ver Indicadores"}
                    </button>

                    <button
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0f1747]"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Pedido
                    </button>
                </div>
            </div>

            {mostrarIndicadores ? (
                <div className="mb-6">
                    <IndicadoresPiezas pedidos={filteredOrders} />
                </div>
            ) : null}

            {tableError ? (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {tableError}
                </div>
            ) : null}

            <div className="mb-6 rounded-lg p-4">
                <div className="grid gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">
                            Búsqueda
                        </div>

                        <div className="flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-3 py-2">
                            <Search className="h-4 w-4 text-[#131E5C]" />
                            <input
                                value={filters.q}
                                onChange={(e) =>
                                    setFilters((prev) => ({ ...prev, q: e.target.value }))
                                }
                                placeholder="Buscar por pedido, cliente, orden, ticket, número de parte o descripción"
                                className="w-full bg-transparent text-sm text-[#131E5C] outline-none placeholder:text-slate-400"
                            />
                            {filters.q ? (
                                <button
                                    onClick={() =>
                                        setFilters((prev) => ({ ...prev, q: "" }))
                                    }
                                    className="rounded-xl p-1 text-slate-500 transition hover:bg-slate-200 hover:text-red-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">
                            Dealer
                        </div>

                        <select
                            value={filters.dealer}
                            onChange={(e) =>
                                setFilters((prev) => ({ ...prev, dealer: e.target.value }))
                            }
                            className={inputBase}
                        >
                            <option value="Todos">Todos</option>
                            {(isAdmin ? DEALERS : userAgencias).map((dealer) => (
                                <option key={dealer} value={dealer}>
                                    {dealer}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="lg:col-span-3">
                        <div className="mb-2 text-xs font-extrabold tracking-wide text-[#131E5C]">
                            Estatus
                        </div>

                        <select
                            value={filters.estatus}
                            onChange={(e) =>
                                setFilters((prev) => ({ ...prev, estatus: e.target.value }))
                            }
                            className={inputBase}
                        >
                            <option value="Todos">Todos</option>
                            {ESTATUS_PEDIDO.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="flex justify-end">
                            <button
                                onClick={resetFilters}
                                className="inline-flex items-center gap-2 rounded-lg border border-[#131E5C] bg-white px-4 py-2 text-sm font-bold text-[#131E5C] transition hover:bg-slate-100"
                            >
                                <X className="h-4 w-4" />
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-[1300px] w-full text-left">
                        <thead className="bg-[#131E5C] text-white">
                            <tr className="text-xs tracking-wide">
                                <th className="px-4 py-4 font-extrabold">Número de Pedido</th>
                                <th className="px-4 py-4 font-extrabold">Fecha Captura</th>
                                <th className="px-4 py-4 font-extrabold">Fecha Pedido</th>
                                <th className="px-4 py-4 font-extrabold">Llegada Programada</th>
                                <th className="px-4 py-4 font-extrabold">Dealer</th>
                                <th className="px-4 py-4 font-extrabold">Cliente</th>
                                <th className="px-4 py-4 font-extrabold">Orden de Servicio</th>
                                <th className="px-4 py-4 font-extrabold">Canal</th>
                                <th className="px-4 py-4 font-extrabold">Asesor</th>
                                <th className="px-4 py-4 font-extrabold">Total de Piezas</th>
                                <th className="px-4 py-4 font-extrabold">% Completado</th>
                                <th className="px-4 py-4 font-extrabold">Estatus</th>
                                <th className="px-4 py-4 font-extrabold">Ticket SAR</th>
                                <th className="px-4 py-4 font-extrabold text-center">Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={14} className="px-4 py-12 text-center text-sm font-semibold text-slate-500">
                                        Cargando pedidos...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={14} className="px-4 py-12 text-center text-sm font-semibold text-slate-500">
                                        No hay pedidos que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const progress = getProgress(order);

                                    return (
                                        <tr
                                            key={order.id}
                                            className="border-b border-slate-200 align-top transition hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="font-extrabold text-[#131E5C]">
                                                    {order.numeroPedido}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                                                {formatDateTime(order.creadoEn)}
                                            </td>

                                            <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                                                {formatDate(order.fechaPedido)}
                                            </td>

                                            <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                                                {formatDate(order.fechaProgramadaLlegada)}
                                            </td>

                                            <td className="px-4 py-4 text-sm font-semibold text-[#131E5C]">
                                                {order.dealer}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="font-bold text-[#131E5C]">
                                                    {order.nombreCliente}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                                                {order.ordenServicio}
                                            </td>

                                            <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                                                {order.canal}
                                            </td>

                                            <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                                                {order.asesor}
                                            </td>

                                            <td className="px-4 py-4 text-sm font-bold text-[#131E5C]">
                                                {getTotalPieces(order.piezas)}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="min-w-[170px]">
                                                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600">
                                                        <span>{progress}%</span>
                                                        <span>
                                                            {getDeliveredPieces(order.piezas)}/{getTotalPieces(order.piezas)}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                                        <div
                                                            className="h-full rounded-full bg-[#131E5C]"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4">
                                                <select
                                                    value={order.estatus}
                                                    onChange={(e) =>
                                                        quickUpdateOrderStatus(order.id, e.target.value)
                                                    }
                                                    className={cn(
                                                        "w-[160px] rounded-xl border px-3 py-2 text-sm font-bold outline-none",
                                                        statusBadgeClass(order.estatus)
                                                    )}
                                                >
                                                    {ESTATUS_PEDIDO.map((status) => (
                                                        <option key={status} value={status}>
                                                            {status}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                                                {order.ticketSar || "—"}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEdit(order)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-[#131E5C] transition hover:bg-slate-100"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                        Editar
                                                    </button>

                                                    <button
                                                        onClick={() => removeOrder(order.id)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                open={modalOpen}
                onClose={closeModal}
                title={mode === "create" ? "Nuevo Pedido de Piezas" : `Editar Pedido • ${draft?.numeroPedido || ""}`}
                footer={
                    <>
                        <button
                            onClick={closeModal}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </button>

                        <button
                            onClick={saveOrder}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0f1747] disabled:opacity-60"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "Guardando..." : "Guardar Pedido"}
                        </button>
                    </>
                }
            >
                {!draft ? null : (
                    <div className="space-y-6">
                        {errors.general ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                {errors.general}
                            </div>
                        ) : null}

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                    Número de pedido
                                </div>
                                <div className="mt-2 text-lg font-extrabold text-[#131E5C]">
                                    {draft.numeroPedido || "Sin capturar"}
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                    Fecha de captura
                                </div>
                                <div className="mt-2 text-lg font-extrabold text-[#131E5C]">
                                    {formatDateTime(draft.creadoEn)}
                                </div>
                            </div>

                            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                    Avance del pedido
                                </div>
                                <div className="mt-2 text-lg font-extrabold text-[#131E5C]">
                                    {draftProgress}%
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <SectionTitle
                                icon={ClipboardList}
                                title="Datos generales del pedido"
                            />

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <Field label="Dealer" error={errors.dealer}>
                            <select
                                value={draft.dealer}
                                onChange={(e) => updateDraftField("dealer", e.target.value)}
                                disabled={!isAdmin && userAgencias.length <= 1}
                                className={cn(inputBase, !isAdmin && userAgencias.length <= 1 ? "opacity-75 cursor-not-allowed" : "")}
                            >
                                {(isAdmin ? DEALERS : userAgencias).map((dealer) => (
                                    <option key={dealer} value={dealer}>
                                        {dealer}
                                    </option>
                                ))}
                            </select>
                        </Field>

                                <Field label="Número de pedido" error={errors.numeroPedido}>
                                    <input
                                        value={draft.numeroPedido}
                                        onChange={(e) =>
                                            updateDraftField("numeroPedido", e.target.value.toUpperCase())
                                        }
                                        className={inputBase}
                                        placeholder="Captura el número generado en la otra interfaz"
                                    />
                                </Field>

                                <Field label="Fecha de pedido" error={errors.fechaPedido}>
                                    <input
                                        type="date"
                                        value={draft.fechaPedido}
                                        onChange={(e) => updateDraftField("fechaPedido", e.target.value)}
                                        className={inputBase}
                                    />
                                </Field>

                                <Field
                                    label="Fecha programada de llegada"
                                    error={errors.fechaProgramadaLlegada}
                                >
                                    <input
                                        type="date"
                                        value={draft.fechaProgramadaLlegada}
                                        onChange={(e) =>
                                            updateDraftField("fechaProgramadaLlegada", e.target.value)
                                        }
                                        className={inputBase}
                                    />
                                </Field>

                                <Field label="Estatus general" error={errors.estatus}>
                                    <select
                                        value={draft.estatus}
                                        onChange={(e) => updateDraftField("estatus", e.target.value)}
                                        className={cn(inputBase, statusBadgeClass(draft.estatus))}
                                    >
                                        {ESTATUS_PEDIDO.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Canal" error={errors.canal}>
                                    <select
                                        value={draft.canal}
                                        onChange={(e) => updateDraftField("canal", e.target.value)}
                                        className={inputBase}
                                    >
                                        {CANALES.map((canal) => (
                                            <option key={canal} value={canal}>
                                                {canal}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Asesor" error={errors.asesor}>
                                    <select
                                        value={draft.asesor}
                                        onChange={(e) => updateDraftField("asesor", e.target.value)}
                                        className={inputBase}
                                    >
                                        {ASESORES.map((asesor) => (
                                            <option key={asesor} value={asesor}>
                                                {asesor}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Número de Ticket SAR" error={errors.ticketSar}>
                                    <input
                                        value={draft.ticketSar}
                                        onChange={(e) =>
                                            updateDraftField("ticketSar", e.target.value.toUpperCase())
                                        }
                                        className={inputBase}
                                        placeholder="Ej. SAR-12345"
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <SectionTitle
                                icon={User}
                                title="Cliente y seguimiento"
                            />

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <Field label="Nombre del Cliente" error={errors.nombreCliente}>
                                    <input
                                        value={draft.nombreCliente}
                                        onChange={(e) =>
                                            updateDraftField("nombreCliente", onlyLetters(e.target.value))
                                        }
                                        className={inputBase}
                                        placeholder="Nombre del cliente"
                                    />
                                </Field>

                                <Field label="Orden de Servicio" error={errors.ordenServicio}>
                                    <input
                                        value={draft.ordenServicio}
                                        onChange={(e) =>
                                            updateDraftField("ordenServicio", onlyNumbers(e.target.value))
                                        }
                                        className={inputBase}
                                        placeholder="Solo números"
                                    />
                                </Field>

                                <Field label="Resumen de piezas">
                                    <div className="flex h-[46px] items-center rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-bold text-[#131E5C]">
                                        {totalDraftPieces} piezas solicitadas
                                    </div>
                                </Field>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                            <SectionTitle
                                icon={PackageSearch}
                                title="Piezas del pedido"
                            />

                            <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                                <div className="relative">
                                    <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2">
                                        <Search className="h-4 w-4 text-[#131E5C]" />
                                        <input
                                            value={pieceSearch}
                                            onChange={(e) => setPieceSearch(e.target.value)}
                                            placeholder="Buscar pieza por número de parte o nombre"
                                            className="w-full bg-transparent text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400"
                                        />
                                        {pieceSearch ? (
                                            <button
                                                onClick={() => {
                                                    setPieceSearch("");
                                                    setPieceSearchResults([]);
                                                }}
                                                className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-200 hover:text-red-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        ) : null}
                                    </div>

                                    {pieceSearch && (
                                        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                                            {loadingPieces ? (
                                                <div className="px-4 py-3 text-sm font-semibold text-slate-500">
                                                    Buscando piezas...
                                                </div>
                                            ) : pieceSearchResults.length > 0 ? (
                                                pieceSearchResults.map((pieza) => (
                                                    <button
                                                        key={pieza.id}
                                                        type="button"
                                                        onClick={() => addPieceFromCatalog(pieza)}
                                                        className="flex w-full items-start justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50"
                                                    >
                                                        <div>
                                                            <div className="font-extrabold text-[#131E5C]">
                                                                {pieza.numeroParte}
                                                            </div>
                                                            <div className="mt-1 text-sm font-semibold text-slate-600">
                                                                {pieza.descripcion}
                                                            </div>
                                                        </div>
                                                        <div className="rounded-lg bg-[#131E5C]/10 px-3 py-1 text-xs font-bold text-[#131E5C]">
                                                            {pieza.costo !== undefined && pieza.costo !== null
                                                                ? `$${Number(pieza.costo).toFixed(2)}`
                                                                : "Sin costo"}
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-sm font-semibold text-slate-500">
                                                    No se encontraron piezas.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={addBlankPiece}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-[#131E5C]/5 px-4 py-3 text-sm font-bold text-[#131E5C] transition hover:bg-[#131E5C]/10"
                                >
                                    <PackagePlus className="h-4 w-4" />
                                    Agregar pieza manual
                                </button>
                            </div>

                            {errors.piezas ? (
                                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                    {errors.piezas}
                                </div>
                            ) : null}

                            <div className="space-y-4">
                                {draft.piezas.map((pieza, index) => {
                                    const pieceError = errors.piezasDetalle?.[index] || {};

                                    return (
                                        <div
                                            key={pieza.rowKey}
                                            className="rounded-lg border border-slate-200 bg-slate-50/80 p-4"
                                        >
                                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-2xl bg-[#131E5C]/10 p-2 text-[#131E5C]">
                                                        <Wrench className="h-5 w-5" />
                                                    </div>

                                                    <div>
                                                        <div className="text-sm font-extrabold text-[#131E5C]">
                                                            Pieza #{index + 1}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removePiece(pieza.rowKey)}
                                                    disabled={draft.piezas.length === 1}
                                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Eliminar pieza
                                                </button>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                                                <Field
                                                    label="Número de Parte"
                                                    error={pieceError.numeroParte}
                                                >
                                                    <input
                                                        value={pieza.numeroParte}
                                                        onChange={(e) =>
                                                            updatePiece(
                                                                pieza.rowKey,
                                                                "numeroParte",
                                                                onlyPartNumber(e.target.value)
                                                            )
                                                        }
                                                        className={inputBase}
                                                        placeholder="Ej. 06A919501A"
                                                    />
                                                </Field>

                                                <Field
                                                    label="Nombre"
                                                    error={pieceError.descripcion}
                                                >
                                                    <input
                                                        value={pieza.descripcion}
                                                        onChange={(e) =>
                                                            updatePiece(
                                                                pieza.rowKey,
                                                                "descripcion",
                                                                e.target.value
                                                            )
                                                        }
                                                        className={inputBase}
                                                        placeholder="Descripción de la pieza"
                                                    />
                                                </Field>

                                                <Field
                                                    label="Cantidad"
                                                    error={pieceError.cantidad}
                                                >
                                                    <input
                                                        value={pieza.cantidad}
                                                        onChange={(e) =>
                                                            updatePiece(
                                                                pieza.rowKey,
                                                                "cantidad",
                                                                onlyNumbers(e.target.value)
                                                            )
                                                        }
                                                        className={inputBase}
                                                        placeholder="0"
                                                    />
                                                </Field>

                                                <Field
                                                    label="Tipo de Pedido"
                                                    error={pieceError.tipoPedido}
                                                >
                                                    <select
                                                        value={pieza.tipoPedido}
                                                        onChange={(e) =>
                                                            updatePiece(
                                                                pieza.rowKey,
                                                                "tipoPedido",
                                                                e.target.value
                                                            )
                                                        }
                                                        className={inputBase}
                                                    >
                                                        {TIPOS_PEDIDO.map((tipo) => (
                                                            <option key={tipo} value={tipo}>
                                                                {tipo}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </Field>

                                                <Field
                                                    label="Estatus"
                                                    error={pieceError.estatus}
                                                >
                                                    <select
                                                        value={pieza.estatus}
                                                        onChange={(e) =>
                                                            updatePiece(
                                                                pieza.rowKey,
                                                                "estatus",
                                                                e.target.value
                                                            )
                                                        }
                                                        className={cn(
                                                            inputBase,
                                                            statusBadgeClass(pieza.estatus)
                                                        )}
                                                    >
                                                        {ESTATUS_PEDIDO.map((status) => (
                                                            <option key={status} value={status}>
                                                                {status}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </Field>
                                                <Field
                                                    label="Fecha de llegada"
                                                    error={pieceError.fechaLlegada}
                                                >
                                                    <input
                                                        type="date"
                                                        value={pieza.fechaLlegada || ""}
                                                        onChange={(e) =>
                                                            updatePiece(
                                                                pieza.rowKey,
                                                                "fechaLlegada",
                                                                e.target.value
                                                            )
                                                        }
                                                        className={inputBase}
                                                    />
                                                </Field>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-3">
                                <div className="rounded-lg border border-slate-200 bg-white p-4">
                                    <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                        Total de piezas
                                    </div>
                                    <div className="mt-2 text-lg font-extrabold text-[#131E5C]">
                                        {totalDraftPieces}
                                    </div>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-white p-4">
                                    <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                        Piezas entregadas
                                    </div>
                                    <div className="mt-2 text-2xl font-extrabold text-[#131E5C]">
                                        {deliveredDraftPieces}
                                    </div>
                                </div>

                                <div className="rounded-lg border border-slate-200 bg-white p-4">
                                    <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                        Progreso
                                    </div>
                                    <div className="mt-2 text-2xl font-extrabold text-[#131E5C]">
                                        {draftProgress}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}