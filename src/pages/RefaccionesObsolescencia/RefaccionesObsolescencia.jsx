import { useEffect, useMemo, useRef, useState } from "react";
import {
    BarChart3, Boxes, CalendarDays, CircleDollarSign, Clock3, Database, Eraser,
    Layers3, LoaderCircle, MapPin, PackageSearch, RefreshCw, Search,
    Table2, Tags, X, FileSpreadsheet, FileText, Wrench, Settings2, Check,
    Building2, ShieldCheck, Plus, ChevronDown, ChevronRight, Package,
    PieChart as PieChartIcon
} from "lucide-react";
import {
    Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine
} from "recharts";

import {
    getOpcionesRefaccionesObsolescencia,
    getRefaccionesObsolescencia,
    getRefaccionesObsolescenciaDashboard,
} from "../../lib/apiRefaccionesObsolescencia";
import InteractiveTable from "./InteractiveTable";

import ExcelJS from "exceljs";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

// RECURSOS VISUALES E IMÁGENES VW
const IMAGEN_HERO_INVENTARIO = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80";

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const PALETA_VW = [
    "#001E50", "#1677FF", "#0EA5E9", "#38BDF8", "#6366F1", "#14B8A6", "#F59E0B", "#10B981"
];

const TOOLTIP_STYLE = { border: "1px solid #E4E7F0", borderRadius: 12, boxShadow: "0 12px 30px rgba(0,30,80,.12)", fontSize: 12, fontFamily: "VW Text, sans-serif" };

const COLUMNAS = [
    { key: "agencia", label: "Agencia" },
    { key: "qt_inventario", label: "Qt. Inventario", tipo: "numero" },
    { key: "cod_linha_prod", label: "Línea Producto" },
    { key: "localizacao", label: "Localización" },
    { key: "cod_produto", label: "Código Producto" },
    { key: "nm_produto", label: "Producto" },
    { key: "unidade", label: "Unidad" },
    { key: "qtde_estoque", label: "Existencia", tipo: "numero" },
    { key: "vr_estoque", label: "Valor Inventario", tipo: "moneda" },
    { key: "vr_unitario_medio", label: "Valor Unitario Medio", tipo: "moneda4" },
    { key: "qt_reservada", label: "Reservada", tipo: "numero" },
    { key: "qt_pedida", label: "Pendiente", tipo: "numero" },
    { key: "grupo_principal", label: "Grupo Principal" },
    { key: "subgrupo", label: "Subgrupo" },
    { key: "nombre_estandarizado", label: "Nombre Estandarizado" },
    { key: "categoria", label: "Categoría" },
    { key: "observacion", label: "Observación" },
    { key: "fecha_ultima_venta", label: "Última Venta", tipo: "fecha" },
    { key: "fecha_ult_comp_prod", label: "Última Compra", tipo: "fecha" },
    { key: "fecha_ult_ped_prod", label: "Último Pedido", tipo: "fecha" },
    { key: "fecha_ult_actu_prod", label: "Última Act. Producto", tipo: "fecha" },
    { key: "fecha_regis_refac", label: "Registro Refacción", tipo: "fecha" },
    { key: "fecha_inventario_refac", label: "Inventario Refacción", tipo: "fecha" },
    { key: "fecha_primera_compra_refac", label: "Primera Compra", tipo: "fecha" },
    { key: "fecha_actualizacion_refac", label: "Actualización Refacción", tipo: "fecha" },
    { key: "vr_uni_ult_cpa", label: "Valor Última Compra", tipo: "moneda4" },
    { key: "fecha_referencia", label: "Fecha Referencia", tipo: "fecha" },
    { key: "dias_desde_ultimo_movimiento", label: "Días sin Movimiento", tipo: "entero" },
    { key: "capa_obsolescencia", label: "Capa Obsolescencia" },
    { key: "categoria_movimiento", label: "Categoría Movimiento" },
];

const FILTROS_INICIALES = {
    q: "", agencia: "", grupo_principal: "", categoria: "", capa_obsolescencia: "",
    categoria_movimiento: "", reservadas: "", pendientes: "",
    fecha_desde: "", fecha_hasta: "", dias_min: "", dias_max: "",
};

const OPCIONES_INICIALES = { agencias: [], grupos_principales: [], categorias: [], capas_obsolescencia: [], categorias_movimiento: [] };

const DASHBOARD_INICIAL = {
    totales: {
        registros: 0, productos: 0, qt_inventario: 0, existencia: 0, reservada: 0, pedida: 0, disponible: 0,
        valor_inventario: 0, valor_stock: 0, valor_reservado: 0, valor_disponible: 0, valor_pendiente: 0,
        valor_obsoleto: 0, porcentaje_obsolescencia: 0, relacion_reservada_pedida: 0, promedio_dias_movimiento: 0,
    },
    graficas: {
        por_capa: [], por_categoria_movimiento: [], por_agencia: [], por_grupo: [], por_categoria: [], por_antiguedad: [], por_grupo_capa: [],
    },
};

const inputClass = "h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-vw-head font-bold text-[#001E50] outline-none transition focus:border-[#1677FF] focus:bg-white focus:ring-2 focus:ring-[#1677FF]/20";

function cn(...parts) { return parts.filter(Boolean).join(" "); }
function numero(value) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function formatoNumero(value, decimales = 0) { return numero(value).toLocaleString("es-MX", { minimumFractionDigits: decimales, maximumFractionDigits: decimales }); }
function formatoCompacto(value) { return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(numero(value)); }
function money(value) { return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numero(value)); }
function moneyCompact(value) {
    const n = numero(value);
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(n);
}

function convertirGrafica(items) {
    return (items || []).map((item) => ({
        ...item,
        productos: numero(item.productos), existencia: numero(item.existencia), reservada: numero(item.reservada),
        pedida: numero(item.pedida), disponible: numero(item.disponible), valor_inventario: numero(item.valor_inventario),
        valor_stock: numero(item.valor_stock), valor_disponible: numero(item.valor_disponible), valor_reservado: numero(item.valor_reservado),
        valor_pendiente: numero(item.valor_pendiente), promedioDias: item.promedioDias !== undefined ? numero(item.promedioDias) : 0,
    }));
}

export default function RefaccionesObsolescencia() {
    const [registros, setRegistros] = useState([]);
    const [total, setTotal] = useState(0);
    const [dashboard, setDashboard] = useState(DASHBOARD_INICIAL);
    const [opciones, setOpciones] = useState(OPCIONES_INICIALES);
    const [filtros, setFiltros] = useState(FILTROS_INICIALES);

    // Filtros de fecha horizontales
    const anioActual = new Date().getFullYear();
    const mesActual = new Date().getMonth();
    const opcionesAnios = useMemo(() => Array.from({ length: 5 }, (_, i) => (anioActual - i).toString()), [anioActual]);
    const [anioActivo, setAnioActivo] = useState(anioActual.toString());
    const [mesActivo, setMesActivo] = useState(null);

    const [qBuscado, setQBuscado] = useState("");
    const [pagina, setPagina] = useState(1);
    const [pageSize, setPageSize] = useState(100);
    const [vistaActiva, setVistaActiva] = useState("dashboard");

    const [loading, setLoading] = useState(false);
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [loadingOpciones, setLoadingOpciones] = useState(false);

    const [error, setError] = useState("");
    const [errorDashboard, setErrorDashboard] = useState("");

    const requestDatosRef = useRef(0);
    const requestDashboardRef = useRef(0);
    const reporteVisualRef = useRef(null);
    const [exportando, setExportando] = useState(null);

    const hayFiltros = useMemo(() => Object.values(filtros).some((value) => String(value ?? "").trim() !== ""), [filtros]);

    // ── CÁLCULO SOBRE EL 100% DE LA BASE DE DATOS (DASHBOARD API) EN LUGAR DE REGISTROS PAGINADOS ──
    const gruposDesglosados = useMemo(() => {
        const gruposBackend = dashboard.graficas.por_grupo || [];
        const grupoCapasBackend = dashboard.graficas.por_grupo_capa || [];
        const categoriasBackend = dashboard.graficas.por_categoria || [];

        // Mapa de capas por grupo
        const capasPorGrupo = new Map();
        grupoCapasBackend.forEach((item) => {
            const grp = item.grupo_principal || "Sin Grupo";
            const capa = (item.capa_obsolescencia || "Sin Capa").toUpperCase();
            const val = numero(item.valor_stock || item.valor_inventario);
            if (!capasPorGrupo.has(grp)) {
                capasPorGrupo.set(grp, { A: 0, B: 0, O: 0 });
            }
            if (['A', 'B', 'O'].includes(capa)) {
                capasPorGrupo.get(grp)[capa] += val;
            }
        });

        // Mapa de subcategorías por grupo
        const subgruposPorGrupo = new Map();
        categoriasBackend.forEach((cat) => {
            const grp = cat.grupo_principal || cat.grupo || "Sin Grupo";
            const subName = cat.categoria || cat.subgrupo || "Sin Subcategoría";
            if (!subgruposPorGrupo.has(grp)) {
                subgruposPorGrupo.set(grp, []);
            }
            subgruposPorGrupo.get(grp).push({
                nombre: subName,
                monto: numero(cat.valor_inventario || cat.valor_stock),
                items: numero(cat.existencia || cat.productos),
                promDias: numero(cat.promedioDias || cat.promedio_dias),
                capas: cat.capas || { A: 0, B: 0, O: 0 }
            });
        });

        let lista = [];

        if (gruposBackend.length > 0) {
            lista = gruposBackend.map((g) => {
                const nombre = g.grupo_principal || g.nombre || "Sin Grupo";
                const monto = numero(g.valor_inventario || g.valor_stock);
                const items = numero(g.existencia || g.productos || g.qtde_estoque);
                const promDias = numero(g.promedioDias || g.promedio_dias);
                const capas = capasPorGrupo.get(nombre) || { A: 0, B: 0, O: 0 };
                const subgrupos = (subgruposPorGrupo.get(nombre) || []).sort((a, b) => b.monto - a.monto);

                return {
                    nombre,
                    monto,
                    items,
                    promDias,
                    subgrupos,
                    capas
                };
            }).sort((a, b) => b.monto - a.monto);
        } else {
            // Fallback usando registros si aún no ha cargado el dashboard backend
            const mapGrupos = new Map();
            registros.forEach((r) => {
                const grp = r.grupo_principal || "Sin Grupo";
                const sub = r.subgrupo || r.categoria || "Sin Subcategoría";
                const capa = (r.capa_obsolescencia || "Sin Capa").toUpperCase();
                const monto = numero(r.vr_estoque);
                const items = numero(r.qtde_estoque || r.qt_inventario || 1);
                const dias = numero(r.dias_desde_ultimo_movimiento);

                if (!mapGrupos.has(grp)) {
                    mapGrupos.set(grp, {
                        nombre: grp,
                        monto: 0,
                        items: 0,
                        totalDias: 0,
                        countDias: 0,
                        subgruposMap: new Map()
                    });
                }

                const gData = mapGrupos.get(grp);
                gData.monto += monto;
                gData.items += items;
                gData.totalDias += dias;
                gData.countDias += 1;

                if (!gData.subgruposMap.has(sub)) {
                    gData.subgruposMap.set(sub, {
                        nombre: sub,
                        monto: 0,
                        items: 0,
                        totalDias: 0,
                        countDias: 0,
                        capas: { A: 0, B: 0, O: 0 }
                    });
                }
                const sData = gData.subgruposMap.get(sub);
                sData.monto += monto;
                sData.items += items;
                sData.totalDias += dias;
                sData.countDias += 1;

                if (['A', 'B', 'O'].includes(capa)) {
                    sData.capas[capa] += monto;
                }
            });

            lista = Array.from(mapGrupos.values()).map((g) => {
                const promDias = g.countDias > 0 ? Math.round(g.totalDias / g.countDias) : 0;
                const subgrupos = Array.from(g.subgruposMap.values()).map((s) => ({
                    nombre: s.nombre,
                    monto: s.monto,
                    items: s.items,
                    promDias: s.countDias > 0 ? Math.round(s.totalDias / s.countDias) : 0,
                    capas: s.capas
                })).sort((a, b) => b.monto - a.monto);

                return {
                    nombre: g.nombre,
                    monto: g.monto,
                    items: g.items,
                    promDias,
                    subgrupos,
                    capas: { A: 0, B: 0, O: 0 }
                };
            }).sort((a, b) => b.monto - a.monto);
        }

        const maxMontoGrupo = Math.max(...lista.map(g => g.monto), 1);

        return { lista, maxMontoGrupo };
    }, [dashboard.graficas, registros]);

    // ── MÉTRICAS EXCLUSIVAS AUTOPART ──
    const metricasEspeciales = useMemo(() => {
        const facturasAP = registros.filter(f => {
            const cod = String(f.cod_produto || "").toUpperCase();
            const lin = String(f.cod_linha_prod || "").toUpperCase();
            return cod === "AP" || lin === "AP" || cod.startsWith("AP");
        });

        const vTotAP = facturasAP.reduce((acc, f) => acc + numero(f.vr_estoque), 0);

        return {
            ap: {
                registros: facturasAP.length,
                valor: vTotAP,
                cantidad: facturasAP.reduce((acc, f) => acc + numero(f.qtde_estoque), 0),
                porcentaje: dashboard.totales.valor_inventario > 0 ? ((vTotAP / dashboard.totales.valor_inventario) * 100).toFixed(1) : "0.0"
            }
        };
    }, [registros, dashboard.totales.valor_inventario]);

    // ── LÓGICA DE SINCRONIZACIÓN AÑO/MES CON FECHAS ──
    useEffect(() => {
        setPagina(1);
        const pad = (n) => String(n).padStart(2, "0");
        if (!anioActivo) {
            setMesActivo(null);
            setFiltros((prev) => ({ ...prev, fecha_desde: "", fecha_hasta: "" }));
            return;
        }
        if (mesActivo !== null) {
            const ultimoDia = new Date(Number(anioActivo), mesActivo + 1, 0).getDate();
            setFiltros((prev) => ({
                ...prev,
                fecha_desde: `${anioActivo}-${pad(mesActivo + 1)}-01`,
                fecha_hasta: `${anioActivo}-${pad(mesActivo + 1)}-${pad(ultimoDia)}`,
            }));
            return;
        }
        setFiltros((prev) => ({
            ...prev,
            fecha_desde: `${anioActivo}-01-01`,
            fecha_hasta: `${anioActivo}-12-31`,
        }));
    }, [anioActivo, mesActivo]);

    useEffect(() => {
        const timeout = setTimeout(() => setQBuscado(filtros.q), 400);
        return () => clearTimeout(timeout);
    }, [filtros.q]);

    function parametrosFiltros() {
        return {
            q: qBuscado, agencia: filtros.agencia, grupo_principal: filtros.grupo_principal,
            categoria: filtros.categoria, capa_obsolescencia: filtros.capa_obsolescencia,
            categoria_movimiento: filtros.categoria_movimiento, reservadas: filtros.reservadas,
            pendientes: filtros.pendientes, fecha_desde: filtros.fecha_desde, fecha_hasta: filtros.fecha_hasta,
            dias_min: filtros.dias_min, dias_max: filtros.dias_max,
        };
    }

    async function cargarOpciones() {
        setLoadingOpciones(true);
        try {
            const response = await getOpcionesRefaccionesObsolescencia();
            setOpciones({
                agencias: response?.agencias || [],
                grupos_principales: response?.grupos_principales || [],
                categorias: response?.categorias || [],
                capas_obsolescencia: response?.capas_obsolescencia || [],
                categorias_movimiento: response?.categorias_movimiento || [],
            });
        } catch (err) { console.error(err); } finally { setLoadingOpciones(false); }
    }

    async function cargarDatos() {
        const requestId = ++requestDatosRef.current;
        setLoading(true);
        setError("");
        try {
            const response = await getRefaccionesObsolescencia({ ...parametrosFiltros(), page: pagina, page_size: pageSize });
            if (requestId !== requestDatosRef.current) return;
            setRegistros(Array.isArray(response?.results) ? response.results : []);
            setTotal(Number(response?.count || 0));
        } catch (err) {
            if (requestId !== requestDatosRef.current) return;
            setRegistros([]); setTotal(0); setError(err?.message || "No fue posible cargar las refacciones.");
        } finally {
            if (requestId === requestDatosRef.current) setLoading(false);
        }
    }

    async function cargarDashboard() {
        const requestId = ++requestDashboardRef.current;
        setLoadingDashboard(true);
        setErrorDashboard("");
        try {
            const response = await getRefaccionesObsolescenciaDashboard(parametrosFiltros());
            if (requestId !== requestDashboardRef.current) return;
            setDashboard({
                totales: {
                    registros: numero(response?.totales?.registros),
                    productos: numero(response?.totales?.productos),
                    qt_inventario: numero(response?.totales?.qt_inventario),
                    existencia: numero(response?.totales?.existencia),
                    reservada: numero(response?.totales?.reservada),
                    pedida: numero(response?.totales?.pedida),
                    disponible: numero(response?.totales?.disponible),
                    valor_inventario: numero(response?.totales?.valor_inventario),
                    valor_stock: numero(response?.totales?.valor_stock),
                    valor_reservado: numero(response?.totales?.valor_reservado),
                    valor_disponible: numero(response?.totales?.valor_disponible),
                    valor_pendiente: numero(response?.totales?.valor_pendiente),
                    valor_obsoleto: numero(response?.totales?.valor_obsoleto),
                    porcentaje_obsolescencia: numero(response?.totales?.porcentaje_obsolescencia),
                    relacion_reservada_pedida: numero(response?.totales?.relacion_reservada_pedida),
                    promedio_dias_movimiento: numero(response?.totales?.promedio_dias_movimiento),
                },
                graficas: {
                    por_capa: response?.graficas?.por_capa || [],
                    por_categoria_movimiento: response?.graficas?.por_categoria_movimiento || [],
                    por_agencia: response?.graficas?.por_agencia || [],
                    por_grupo: response?.graficas?.por_grupo || [],
                    por_grupo_capa: response?.graficas?.por_grupo_capa || [],
                    por_categoria: response?.graficas?.por_categoria || [],
                    por_antiguedad: response?.graficas?.por_antiguedad || [],
                },
            });
        } catch (err) {
            if (requestId !== requestDashboardRef.current) return;
            setDashboard(DASHBOARD_INICIAL); setErrorDashboard(err?.message || "No fue posible cargar los gráficos.");
        } finally {
            if (requestId === requestDashboardRef.current) setLoadingDashboard(false);
        }
    }

    useEffect(() => { cargarOpciones(); }, []);
    useEffect(() => { cargarDatos(); }, [pagina, pageSize, qBuscado, filtros]);
    useEffect(() => { cargarDashboard(); }, [qBuscado, filtros]);

    const porCapa = useMemo(() => convertirGrafica(dashboard.graficas.por_capa), [dashboard.graficas.por_capa]);
    const porGrupo = useMemo(() => convertirGrafica(dashboard.graficas.por_grupo), [dashboard.graficas.por_grupo]);
    const cargandoGeneral = loading || loadingDashboard || loadingOpciones;

    function cambiarFiltro(campo, value) { setPagina(1); setFiltros((prev) => ({ ...prev, [campo]: value })); }
    function limpiarFiltros() { setPagina(1); setFiltros(FILTROS_INICIALES); setAnioActivo(anioActual.toString()); setMesActivo(null); }
    function actualizarTodo() { cargarDatos(); cargarDashboard(); cargarOpciones(); }

    const limpiarNombreArchivo = (valor) => {
        return String(valor ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .toLowerCase();
    };

    const obtenerSelloFecha = () => {
        const ahora = new Date();
        const dos = (valor) => String(valor).padStart(2, "0");
        return `${ahora.getFullYear()}${dos(ahora.getMonth() + 1)}${dos(ahora.getDate())}_${dos(ahora.getHours())}${dos(ahora.getMinutes())}`;
    };

    const crearNombreReporteObsolescencia = (extension) => {
        const agenciaDesc = filtros.agencia || "todas_las_agencias";
        const fechaDesc = anioActivo ? (mesActivo !== null ? `mes_${mesActivo + 1}_${anioActivo}` : `ano_${anioActivo}`) : "historico";
        const agenciaLimpia = limpiarNombreArchivo(agenciaDesc) || "todas_las_agencias";
        const fechaLimpia = limpiarNombreArchivo(fechaDesc) || "historico";

        return `reporte_obsolescencia_${agenciaLimpia}_${fechaLimpia}_${obtenerSelloFecha()}.${extension}`;
    };

    const exportarExcel = async () => {
        if (total === 0 || exportando) return;
        setExportando("excel");
        try {
            const respuestaCompleta = await getRefaccionesObsolescencia({
                ...parametrosFiltros(),
                page: 1,
                page_size: total > 0 ? total : 5000,
            });
            const filasAExportar = Array.isArray(respuestaCompleta?.results)
                ? respuestaCompleta.results
                : registros;

            const workbook = new ExcelJS.Workbook();
            const hoja = workbook.addWorksheet("Obsolescencia", {
                views: [{ state: "frozen", ySplit: 1 }],
                pageSetup: { orientation: "landscape" },
            });

            hoja.columns = COLUMNAS.map((c) => ({ header: c.label, key: c.key, width: 18 }));

            hoja.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF001E50" } };
                cell.alignment = { horizontal: "center" };
            });

            filasAExportar.forEach((row) => {
                hoja.addRow(row);
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = crearNombreReporteObsolescencia("xlsx");
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error exportando a Excel:", err);
            alert("No fue posible generar el archivo Excel.");
        } finally {
            setExportando(null);
        }
    };

    const exportarPdf = async () => {
        if (!registros.length || exportando) return;
        setExportando("pdf");
        const vistaPrevia = vistaActiva;

        try {
            if (vistaPrevia !== "dashboard") {
                setVistaActiva("dashboard");
                await new Promise((resolve) => setTimeout(resolve, 300));
            }

            if (document.fonts?.ready) await document.fonts.ready;
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            await new Promise((resolve) => setTimeout(resolve, 600));

            if (!reporteVisualRef.current) throw new Error("No se encontró el contenedor visual.");

            const canvas = await html2canvas(reporteVisualRef.current, {
                scale: 1.35,
                useCORS: true,
                allowTaint: false,
                backgroundColor: "#ffffff",
                logging: false,
            });

            const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
            doc.setProperties({
                title: `Reporte de Obsolescencia - ${new Date().toLocaleDateString("es-MX")}`,
                author: "CRM Grupo Automotriz VW",
            });

            const margen = 8;
            const anchoPagina = doc.internal.pageSize.getWidth();
            const altoPagina = doc.internal.pageSize.getHeight();
            const anchoUtil = anchoPagina - margen * 2;
            const altoUtil = altoPagina - margen * 2;
            const pixelesPorMm = canvas.width / anchoUtil;
            const altoCortePx = Math.max(1, Math.floor(altoUtil * pixelesPorMm));

            let posicionY = 0;
            let primeraPagina = true;

            while (posicionY < canvas.height) {
                if (!primeraPagina) doc.addPage("a4", "landscape");
                primeraPagina = false;

                const altoActualPx = Math.min(altoCortePx, canvas.height - posicionY);
                const corte = document.createElement("canvas");
                corte.width = canvas.width;
                corte.height = altoActualPx;
                const contexto = corte.getContext("2d");
                if (contexto) {
                    contexto.fillStyle = "#ffffff";
                    contexto.fillRect(0, 0, corte.width, corte.height);
                    contexto.drawImage(canvas, 0, posicionY, canvas.width, altoActualPx, 0, 0, canvas.width, altoActualPx);
                    const altoImagenMm = altoActualPx / pixelesPorMm;
                    doc.addImage(corte.toDataURL("image/png"), "PNG", margen, margen, anchoUtil, altoImagenMm, undefined, "FAST");
                }
                posicionY += altoActualPx;
            }

            doc.addPage("a4", "landscape");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(0, 30, 80);
            doc.text("Detalle de Obsolescencia de Refacciones", 10, 12);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100);
            doc.text(`Generado: ${new Date().toLocaleString("es-MX")} · Total: ${total} refacciones`, 10, 16);

            const columnasPrincipales = [
                { key: "agencia", label: "Agencia" },
                { key: "cod_produto", label: "Código" },
                { key: "nm_produto", label: "Producto" },
                { key: "qtde_estoque", label: "Exist." },
                { key: "vr_estoque", label: "Valor Inv." },
                { key: "grupo_principal", label: "Grupo" },
                { key: "dias_desde_ultimo_movimiento", label: "Días sin mov." },
                { key: "capa_obsolescencia", label: "Capa" },
                { key: "categoria_movimiento", label: "Movimiento" },
            ];

            autoTable(doc, {
                startY: 19,
                head: [columnasPrincipales.map((c) => c.label)],
                body: registros.map((r) => columnasPrincipales.map((c) => {
                    if (c.key === "vr_estoque") return money(r[c.key]);
                    return r[c.key] ?? "—";
                })),
                styles: { fontSize: 6.5, cellPadding: 1.2 },
                headStyles: { fillColor: [0, 30, 80], textColor: 255 },
                margin: { left: 8, right: 8, bottom: 10 },
            });

            doc.save(crearNombreReporteObsolescencia("pdf"));
        } catch (err) {
            console.error("Error exportando a PDF:", err);
            alert("No fue posible generar el archivo PDF.");
        } finally {
            if (vistaPrevia !== "dashboard") {
                setVistaActiva(vistaPrevia);
            }
            setExportando(null);
        }
    };

    return (
        <div className="w-full bg-white text-[#1E293B] font-vw-text font-light p-3 md:p-5 space-y-5 min-h-screen">

            {/* ── ENCABEZADO ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                <div>
                    <h1 className="text-xl font-vw-head font-extrabold text-[#001E50] tracking-tight">Obsolescencia de Refacciones</h1>
                    <p className="text-xs font-vw-text font-semibold text-slate-500">Monitor de valor de inventario y antigüedad</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button type="button" onClick={exportarExcel} disabled={!registros.length || Boolean(exportando)} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 font-vw-head font-bold text-xs hover:bg-emerald-100 transition-all cursor-pointer shadow-sm disabled:opacity-50">
                        {exportando === "excel" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />} Excel
                    </button>
                    <button type="button" onClick={exportarPdf} disabled={!registros.length || Boolean(exportando)} className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 px-4 py-1.5 font-vw-head font-bold text-xs hover:bg-red-100 transition-all cursor-pointer shadow-sm disabled:opacity-50">
                        {exportando === "pdf" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />} PDF
                    </button>

                    <div className="flex items-center bg-slate-50 rounded-full border border-slate-200 p-0.5 ml-2 shadow-sm">
                        <button type="button" onClick={() => setVistaActiva("dashboard")} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-vw-head font-bold text-[10px] transition-all", vistaActiva === "dashboard" ? "bg-[#001E50] text-white" : "text-slate-600 hover:bg-slate-200")}>
                            <BarChart3 className="h-3.5 w-3.5" /> Dashboard
                        </button>
                        <button type="button" onClick={() => setVistaActiva("detalle")} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-vw-head font-bold text-[10px] transition-all", vistaActiva === "detalle" ? "bg-[#001E50] text-white" : "text-slate-600 hover:bg-slate-200")}>
                            <Table2 className="h-3.5 w-3.5" /> Detalle
                        </button>
                    </div>

                    <button type="button" onClick={actualizarTodo} disabled={cargandoGeneral} className="inline-flex items-center gap-1.5 rounded-full bg-white text-[#001E50] border border-slate-200 px-3 py-1.5 font-vw-head font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer shadow-sm ml-2 disabled:opacity-50">
                        <RefreshCw className={cn("h-3.5 w-3.5", cargandoGeneral && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* ── FILTROS (AGENCIAS Y FECHAS) ── */}
            <div className="flex flex-col lg:flex-row items-start gap-4">
                <div className="w-full lg:w-auto py-1 bg-slate-50 rounded-xl p-2 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-[#001E50] text-xs font-vw-head font-bold px-2 shrink-0">
                        <MapPin className="h-3.5 w-3.5 text-[#1677FF]" />
                        <span>Agencia:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button onClick={() => cambiarFiltro("agencia", "")} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-vw-head font-bold transition-all duration-150 cursor-pointer ${!filtros.agencia ? "bg-[#1677FF] text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}>
                            {!filtros.agencia && <Check className="h-3 w-3 text-white" />} Todas
                        </button>
                        {opciones.agencias.map((item) => (
                            <button key={item} onClick={() => cambiarFiltro("agencia", item)} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-vw-head font-bold transition-all duration-150 cursor-pointer ${filtros.agencia === item ? "bg-[#1677FF] text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}>
                                {filtros.agencia === item && <Check className="h-3 w-3 text-white" />} {item}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-2 border border-slate-200/80 flex items-center gap-2 flex-wrap w-full lg:w-auto">
                    <div className="relative inline-block shrink-0">
                        <select value={anioActivo} onChange={(e) => { setAnioActivo(e.target.value); setMesActivo(null); }} className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-7 text-xs font-vw-head font-bold text-[#001E50] focus:outline-none cursor-pointer">
                            <option value="">Todo el histórico</option>
                            {opcionesAnios.map((a) => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        <button type="button" onClick={() => setMesActivo(null)} disabled={!anioActivo} className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-2.5 py-1.5 text-xs transition-all ${mesActivo === null ? "bg-[#001E50] text-white font-vw-head font-bold" : !anioActivo ? "border border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed font-vw-head font-bold" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-vw-head font-bold"}`}>
                            {mesActivo === null ? <Check className="h-3 w-3 text-white" /> : <Plus className="h-3 w-3 text-slate-400" />} Anual
                        </button>
                        {MESES.map((mes, index) => {
                            const active = mesActivo === index;
                            const disable = !anioActivo;
                            return (
                                <button key={mes} type="button" disabled={disable} onClick={() => setMesActivo(active ? null : index)} className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-2.5 py-1.5 text-xs transition-all ${active ? "bg-[#001E50] text-white font-vw-head font-bold" : disable ? "border border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed font-vw-head font-bold" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-vw-head font-bold"}`}>
                                    {active ? <Check className="h-3 w-3 text-white" /> : <Plus className="h-3 w-3 text-slate-400" />} {mes.substring(0, 3)}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="relative shrink-0 flex-1 w-full lg:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" value={filtros.q} onChange={(e) => cambiarFiltro("q", e.target.value)} placeholder="Código, producto, grupo..." className="w-full h-[38px] rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-xs font-vw-text font-semibold text-[#001E50] outline-none transition focus:border-[#1677FF] focus:bg-white focus:ring-2 focus:ring-[#1677FF]/20" />
                    {filtros.q && <button onClick={() => cambiarFiltro("q", "")} className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200"><X className="h-3 w-3" /></button>}
                </div>
            </div>

            {/* ── FILTROS AVANZADOS ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
                <SelectFilter label="Capa" icon={Clock3} value={filtros.capa_obsolescencia} onChange={(v) => cambiarFiltro("capa_obsolescencia", v)}>
                    <option value="">Todas</option>{opciones.capas_obsolescencia.map(i => <option key={i} value={i}>{i}</option>)}
                </SelectFilter>
                <SelectFilter label="Grupo" icon={Layers3} value={filtros.grupo_principal} onChange={(v) => cambiarFiltro("grupo_principal", v)}>
                    <option value="">Todos</option>{opciones.grupos_principales.map(i => <option key={i} value={i}>{i}</option>)}
                </SelectFilter>
                <SelectFilter label="Categoría" icon={Tags} value={filtros.categoria} onChange={(v) => cambiarFiltro("categoria", v)}>
                    <option value="">Todas</option>{opciones.categorias.map(i => <option key={i} value={i}>{i}</option>)}
                </SelectFilter>
                <SelectFilter label="Movimiento" icon={Boxes} value={filtros.categoria_movimiento} onChange={(v) => cambiarFiltro("categoria_movimiento", v)}>
                    <option value="">Todos</option>{opciones.categorias_movimiento.map(i => <option key={i} value={i}>{i}</option>)}
                </SelectFilter>
                <SelectFilter label="Reservadas" icon={PackageSearch} value={filtros.reservadas} onChange={(v) => cambiarFiltro("reservadas", v)}>
                    <option value="">Ambas</option><option value="con">Sí</option><option value="sin">No</option>
                </SelectFilter>

                <div className="col-span-2 flex items-center gap-2 mt-5">
                    <input type="number" min="0" placeholder="Min días" value={filtros.dias_min} onChange={(e) => cambiarFiltro("dias_min", e.target.value)} className={inputClass} />
                    <span className="text-slate-300">-</span>
                    <input type="number" min="0" placeholder="Max días" value={filtros.dias_max} onChange={(e) => cambiarFiltro("dias_max", e.target.value)} className={inputClass} />
                    <button type="button" onClick={limpiarFiltros} disabled={!hayFiltros} className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0">
                        <Eraser className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {errorDashboard && <ErrorBox>{errorDashboard}</ErrorBox>}
            {error && <ErrorBox>{error}</ErrorBox>}

            {/* ── SECCIÓN HERO KPI: TOTAL DE FACTURACIÓN (INVENTARIO) Y SUBALTERNOS (AP) ── */}
            <div ref={reporteVisualRef} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

                {/* 1/3 - HERO PRINCIPAL: VALOR TOTAL DEL INVENTARIO */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm">
                    <div className="relative h-28 w-full overflow-hidden bg-[#001E50] shrink-0">
                        <img src={IMAGEN_HERO_INVENTARIO} alt="Inventario VW" className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105" onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#001E50] via-[#001E50]/50 to-transparent" />
                        <div className="absolute top-2 left-2 bg-[#001E50] text-white text-[10px] font-vw-head font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                            Inventario Global
                        </div>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white">
                            <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-xs font-vw-head font-bold tracking-wide">VW Group & Almacenes</span>
                        </div>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider">
                                    Valor Total Inventario
                                </span>
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-vw-head font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                    <ShieldCheck className="h-2.5 w-2.5" />
                                    Concesionarias
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center py-1 text-center my-auto">
                            <h4 className="text-[11px] font-vw-head font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                Facturación Equivalente
                            </h4>
                            <div className="text-4xl font-vw-head font-extrabold text-[#001E50] leading-none tracking-tight">
                                {loadingDashboard ? "..." : moneyCompact(dashboard.totales.valor_inventario)}
                            </div>
                            <div className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider mt-1.5">
                                {formatoNumero(dashboard.totales.existencia)} Piezas Físicas Disponibles
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-1.5 text-center">
                                <div className="text-[9px] text-slate-400 font-vw-text">Reservado</div>
                                <div className="text-xs font-vw-head font-bold text-amber-600 mt-0.5">
                                    {moneyCompact(dashboard.totales.valor_reservado)}
                                </div>
                            </div>
                            <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-1.5 text-center">
                                <div className="text-[9px] text-slate-400 font-vw-text">Libre / Disponible</div>
                                <div className="text-xs font-vw-head font-bold text-emerald-600 mt-0.5">
                                    {moneyCompact(dashboard.totales.valor_disponible)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2/3 - PANEL DE CONTROL Y ANÁLISIS: AUTOPART Y GRÁFICAS */}
                <div className="lg:col-span-8 bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
                            <Settings2 className="h-3.5 w-3.5 text-white shrink-0" />
                            <span>Métricas Generales y Líneas (AP)</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* CARD SUBALTERNO: AUTOPART (AP) */}
                        <div className="bg-white border border-amber-200/80 bg-amber-50/20 rounded-xl p-2.5 shadow-xs relative overflow-hidden">
                            <div className="flex items-center justify-between text-[10px] font-vw-head font-bold text-amber-800 uppercase mb-1">
                                <span className="flex items-center gap-1">
                                    <Wrench className="h-3 w-3 text-amber-600" /> Línea Autopart (AP)
                                </span>
                                <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                    {metricasEspeciales.ap.porcentaje}%
                                </span>
                            </div>
                            <div className="text-base font-vw-head font-extrabold text-[#001E50]">
                                {loadingDashboard ? "..." : money(metricasEspeciales.ap.valor)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-vw-text mt-0.5 flex justify-between">
                                <span>{metricasEspeciales.ap.registros} registros</span>
                                <span className="font-bold text-amber-700">{formatoNumero(metricasEspeciales.ap.cantidad)} pzs.</span>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-col justify-between">
                            <div className="text-[10px] font-vw-head font-bold text-slate-400 uppercase">
                                <CircleDollarSign className="inline h-3 w-3 mr-1 text-red-500" />
                                Valor Obsoleto
                            </div>
                            <div className="text-base font-vw-head font-extrabold text-[#001E50]">
                                {loadingDashboard ? "—" : money(dashboard.totales.valor_obsoleto)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-vw-text">
                                Representa el <span className="font-bold text-red-500">{formatoNumero(dashboard.totales.porcentaje_obsolescencia, 1)}%</span>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-col justify-between">
                            <div className="text-[10px] font-vw-head font-bold text-slate-400 uppercase">
                                <Clock3 className="inline h-3 w-3 mr-1 text-[#1677FF]" />
                                Prom. Sin Movimiento
                            </div>
                            <div className="text-base font-vw-head font-extrabold text-[#1677FF]">
                                {loadingDashboard ? "—" : `${formatoNumero(dashboard.totales.promedio_dias_movimiento)} días`}
                            </div>
                            <div className="text-[10px] text-slate-400 font-vw-text">Tiempo medio inmovilizado</div>
                        </div>
                    </div>

                    {vistaActiva === "dashboard" ? (
                        <div className="grid grid-cols-1 gap-3 flex-1 min-h-[210px]">
                            <ChartCardMini title="Valor Disponible y Reservado" subtitle="Por Capa">
                                {loadingDashboard ? <ChartLoading type="pie" /> : porCapa.length === 0 ? <ChartEmpty /> : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={porCapa} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="capa_obsolescencia" tick={{ fontSize: 10, fill: "#000" }} axisLine={false} tickLine={false} width={40} />
                                            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => money(value)} />
                                            <Bar dataKey="valor_disponible" stackId="a" fill={PALETA_VW[1]} radius={[0, 0, 0, 0]} isAnimationActive />
                                            <Bar dataKey="valor_reservado" stackId="a" fill={PALETA_VW[0]} radius={[0, 4, 4, 0]} isAnimationActive />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </ChartCardMini>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-300 min-h-[210px]">
                            Sección de gráficas (Cambia a la vista Dashboard para visualizarlas a detalle).
                        </div>
                    )}
                </div>
            </div>

            {/* ── NUEVA SECCIÓN UNIFICADA: LISTADO COMPLETO Y DESGLOSABLE POR GRUPOS Y SUBCATEGORÍAS ── */}
            {vistaActiva === "dashboard" && (
                <div className="grid grid-cols-1 gap-5">
                    <VWConsolidadoCategoriasExpandable
                        data={gruposDesglosados.lista}
                        maxMonto={gruposDesglosados.maxMontoGrupo}
                        loading={loading}
                        totalGeneral={dashboard.totales.valor_inventario}
                    />
                </div>
            )}

            {vistaActiva === "detalle" && (
                <InteractiveTable
                    rows={registros}
                    columns={COLUMNAS}
                    storageKey="refacciones_obsolescencia_vw"
                    total={total}
                    loading={loading}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => { setPagina(1); setPageSize(size); }}
                    page={pagina}
                    onPrev={() => setPagina((prev) => Math.max(1, prev - 1))}
                    onNext={() => setPagina((prev) => Math.min(10, prev + 1))}
                />
            )}
        </div>
    );
}

// =========================================================================================
// COMPONENTE: DESGLOSE CONSOLIDADO POR GRUPO Y SUBCATEGORÍAS (PORCENTAJE REAL SOBRE SUMATORIA / TOTAL GLOBAL)
// =========================================================================================
function VWConsolidadoCategoriasExpandable({ data = [], maxMonto = 1, loading = false, totalGeneral = 1 }) {
    const [grupoAbierto, setGrupoAbierto] = useState(null);

    // Sumatoria de ValorInventario de todos los grupos de la lista actual
    const sumatoriaValorInventario = useMemo(() => {
        const sumaGrupos = data.reduce((acc, g) => acc + numero(g.monto), 0);
        return totalGeneral > 0 ? totalGeneral : (sumaGrupos > 0 ? sumaGrupos : 1);
    }, [data, totalGeneral]);

    if (loading) {
        return (
            <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 p-4 min-h-[300px] flex items-center justify-center">
                <LoaderCircle className="h-6 w-6 animate-spin text-[#1677FF]" />
            </div>
        );
    }

    if (!data.length) {
        return (
            <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 p-4 min-h-[300px] flex items-center justify-center text-xs text-slate-400 italic">
                Sin información de grupos para mostrar.
            </div>
        );
    }

    return (
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
                    <BarChart3 className="h-3.5 w-3.5 text-white shrink-0" />
                    <span>Desglose por Grupo de Refacciones</span>
                </div>

                {/* LEYENDA Y KPI SUPERIOR */}
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-[9px] font-vw-head font-bold">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#10B981]" /> Capa A</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Capa B</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#EF4444]" /> Capa O</span>
                    </div>
                    <span className="text-[10px] font-vw-head font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                        {data.length} Categorías Principales ({money(sumatoriaValorInventario)})
                    </span>
                </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                {data.map((grupo, idx) => {
                    const isExpanded = grupoAbierto === grupo.nombre;
                    const pctWidth = maxMonto > 0 ? (grupo.monto / maxMonto) * 100 : 0;

                    // Cálculo del porcentaje real sobre la sumatoria del ValorInventario global
                    const pctTotal = sumatoriaValorInventario > 0
                        ? ((grupo.monto / sumatoriaValorInventario) * 100).toFixed(1)
                        : "0.0";

                    return (
                        <div key={grupo.nombre} className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs transition-all">

                            {/* ENCABEZADO DE LA FILA (ESTILO VW ASESORES) */}
                            <div
                                onClick={() => setGrupoAbierto(isExpanded ? null : grupo.nombre)}
                                className="px-3 py-2 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer text-xs"
                            >
                                {/* Lado Izquierdo: Indice + Nombre */}
                                <div className="flex items-center gap-2.5 w-full sm:w-1/3 shrink-0">
                                    <div className="h-6 w-6 rounded-md bg-[#001E50] text-white font-vw-head font-bold text-[10px] flex items-center justify-center shrink-0">
                                        VW{idx + 1}
                                    </div>
                                    <span className="font-vw-head font-bold text-[#001E50] text-xs truncate" title={grupo.nombre}>
                                        {grupo.nombre}
                                    </span>
                                </div>

                                {/* Centro: Estadísticas (Monto, Piezas, Antigüedad) */}
                                <div className="flex-1 flex items-center justify-center gap-3 font-vw-head font-bold text-[11px] text-slate-600">
                                    <span>{money(grupo.monto)}</span>
                                    <span className="text-amber-600">{formatoNumero(grupo.items)} pzs.</span>
                                    <span className="text-[#1677FF]">{grupo.promDias} días prom.</span>
                                </div>

                                {/* Lado Derecho: Progress Bar + Porcentaje + Flecha */}
                                <div className="flex items-center justify-end gap-3 w-full sm:w-1/4 shrink-0">
                                    <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                                        <div
                                            className="h-full bg-[#001E50] rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, Math.max(3, pctWidth))}%` }}
                                        />
                                    </div>
                                    <span className="font-vw-head font-bold text-[#1677FF] text-xs min-w-[42px] text-right">
                                        {pctTotal}%
                                    </span>
                                    <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-all ${isExpanded ? "bg-[#001E50] text-white" : "bg-slate-100 text-slate-400"}`}>
                                        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                    </div>
                                </div>
                            </div>

                            {/* TABLA DE SUBCATEGORÍAS DESPLEGABLE CON DESGLOSE POR CAPAS */}
                            {isExpanded && (
                                <div className="bg-[#F8FAFC] border-t border-slate-200 p-3 space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-vw-head font-bold text-slate-500 px-1">
                                        <span>Desglose de subcategorías de {grupo.nombre} ({grupo.subgrupos.length})</span>
                                        <span className="text-[#1677FF]">Formato: Subcategoría | Monto | Pzs | Antigüedad | Distribución Capas</span>
                                    </div>

                                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                        <table className="w-full text-left text-[10px] min-w-[700px]">
                                            <thead className="bg-[#F1F5F9] text-[#001E50] font-vw-head font-bold border-b border-slate-200">
                                                <tr>
                                                    <th className="px-2.5 py-2">Subcategoría</th>
                                                    <th className="px-2.5 py-2 text-right">Monto</th>
                                                    <th className="px-2.5 py-2 text-right">Piezas</th>
                                                    <th className="px-2.5 py-2 text-right">Antigüedad Prom.</th>
                                                    <th className="px-2.5 py-2 text-center w-32">Capas (A/B/O)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-vw-text text-slate-700">
                                                {grupo.subgrupos.map((sub) => {
                                                    const subA = sub.capas["A"] || 0;
                                                    const subB = sub.capas["B"] || 0;
                                                    const subO = sub.capas["O"] || 0;
                                                    const subTot = subA + subB + subO || 1;

                                                    const subPctA = (subA / subTot) * 100;
                                                    const subPctB = (subB / subTot) * 100;
                                                    const subPctO = (subO / subTot) * 100;

                                                    return (
                                                        <tr key={sub.nombre} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-2.5 py-2 font-vw-head font-bold text-[#001E50] max-w-[200px] truncate" title={sub.nombre}>
                                                                {sub.nombre}
                                                            </td>
                                                            <td className="px-2.5 py-2 text-right font-bold text-[#001E50]">
                                                                {money(sub.monto)}
                                                            </td>
                                                            <td className="px-2.5 py-2 text-right text-amber-700 font-bold">
                                                                {formatoNumero(sub.items)}
                                                            </td>
                                                            <td className="px-2.5 py-2 text-right text-[#1677FF] font-bold">
                                                                {sub.promDias} d
                                                            </td>
                                                            <td className="px-2.5 py-2 text-center">
                                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex" title={`A: ${money(subA)} | B: ${money(subB)} | O: ${money(subO)}`}>
                                                                    {subPctA > 0 && <div style={{ width: `${subPctA}%` }} className="bg-[#10B981] h-full" />}
                                                                    {subPctB > 0 && <div style={{ width: `${subPctB}%` }} className="bg-[#F59E0B] h-full" />}
                                                                    {subPctO > 0 && <div style={{ width: `${subPctO}%` }} className="bg-[#EF4444] h-full" />}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// =========================================================================================
// COMPONENTES SECUNDARIOS AUXILIARES
// =========================================================================================

function ChartCardMini({ title, subtitle, children }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 h-full flex flex-col justify-between">
            <div className="text-[10px] font-vw-head font-bold text-slate-500 uppercase border-b border-slate-100 pb-1 mb-2">
                <span className="text-[#001E50]">{title}</span> <span className="font-normal text-slate-400">({subtitle})</span>
            </div>
            <div className="h-full min-h-[140px] w-full">
                {children}
            </div>
        </div>
    );
}

function FilterField({ label, icon: Icon, children }) {
    return (
        <div>
            <div className="mb-1.5 flex items-center gap-1.5">
                {Icon && <Icon className="h-3.5 w-3.5 text-[#1677FF]" />}
                <label className="text-[10px] font-vw-head font-bold uppercase tracking-widest text-[#001E50]">{label}</label>
            </div>
            {children}
        </div>
    );
}

function SelectFilter({ label, icon: Icon, value, onChange, loading = false, children }) {
    return (
        <FilterField label={label} icon={Icon}>
            <div className="relative">
                <select value={value} onChange={(e) => onChange(e.target.value)} disabled={loading} className={cn(inputClass, loading && "animate-pulse pr-9")}>
                    {children}
                </select>
                {loading && (
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#1677FF]" />
                    </span>
                )}
            </div>
        </FilterField>
    );
}

function ChartLoading({ type = "vertical" }) {
    if (type === "pie") {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="relative h-24 w-24 animate-pulse rounded-full bg-slate-200">
                    <div className="absolute inset-6 rounded-full bg-white" />
                </div>
            </div>
        );
    }
    if (type === "horizontal") {
        return (
            <div className="flex h-full flex-col justify-center gap-2 px-2">
                {[75, 58, 88].map((width, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="h-2 w-8 animate-pulse rounded bg-slate-100" />
                        <div className="h-4 animate-pulse rounded bg-slate-200" style={{ width: `${width}%`, animationDelay: `${index * 70}ms` }} />
                    </div>
                ))}
            </div>
        );
    }
    return (
        <div className="flex h-full items-end justify-around gap-2 px-2 pb-2 pt-4">
            {[48, 72, 58, 88, 65, 78].map((height, index) => (
                <div key={index} className="flex h-full w-4 items-end">
                    <div className="w-full animate-pulse rounded-t bg-slate-200" style={{ height: `${height}%`, animationDelay: `${index * 70}ms` }} />
                </div>
            ))}
        </div>
    );
}

function ErrorBox({ children }) {
    return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-vw-text font-semibold text-red-700">{children}</div>;
}

function ChartEmpty() {
    return (
        <div className="flex h-full flex-col items-center justify-center text-center">
            <Database className="h-6 w-6 text-slate-300" />
            <p className="mt-1 text-[10px] font-semibold text-slate-400">Sin información</p>
        </div>
    );
}