import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Database,
  LoaderCircle,
  Package,
  PackageSearch,
  PieChart as PieChartIcon,
  RefreshCw,
  Search,
  Store,
  X,
  FileSpreadsheet,
  FileText,
  Wrench,
  Settings2,
  Check,
  Briefcase,
  Plus,
  Building2,
  ShieldCheck
} from "lucide-react";
import { Pie } from "@ant-design/plots";
import {
  getCompraRefOpciones,
  getCompraRefPiezas,
  getCompraRefTipificada,
} from "../../lib/apiCompraRef";
import ExcelJS from "exceljs";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
// RECURSOS VISUALES E IMÁGENES
const IMAGEN_HERO_REFACCIONES = "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80";
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const PALETA_VW = [
  "#001E50", // VW Navy
  "#1677FF", // VW Electric Blue
  "#0EA5E9", // Sky Blue
  "#38BDF8", // Light Blue
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F59E0B", // Amber
  "#10B981"  // Emerald
];
// ── FUNCIONES AUXILIARES DE FORMATEO Y NÚMEROS ──
function numero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
function formatoNumero(value) {
  return numero(value).toLocaleString("es-MX", {
    maximumFractionDigits: 2,
  });
}
function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}
function moneyCompact(value) {
  const n = numero(value);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
function fechaCorta(value) {
  if (!value) return "Sin fecha";
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}`;
  const mx = raw.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/);
  if (mx) return `${mx[1]}/${mx[2]}`;
  return raw.slice(0, 10);
}
function claveFactura(factura) {
  return `${factura.agencia || ""}|${factura.nrnota || ""}|${factura.serie || ""}`;
}
export default function CompraRefacciones() {
  const hoy = new Date();
  const añoActual = hoy.getFullYear();
  const mesActual = hoy.getMonth();
  const años = useMemo(() => Array.from({ length: 5 }, (_, i) => añoActual - i), [añoActual]);
  // FILTROS DE FECHA
  const [añoSel, setAñoSel] = useState(añoActual);
  const [mesSel, setMesSel] = useState(null); // null = Todo el año
  const [datos, setDatos] = useState([]);
  // Datos paginados: únicamente para la tabla visible.
  const [datosAnalisis, setDatosAnalisis] = useState([]);
  // Datos completos del filtro actual: métricas, proveedores y gráficas.
  const [loadingAnalisis, setLoadingAnalisis] = useState(true);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [metricas, setMetricas] = useState({
    registros: 0,
    cantidad_total: 0,
    subtotal: 0,
    total: 0,
  });
  const [opciones, setOpciones] = useState({ agencias: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agencia, setAgencia] = useState("");
  const [fechaDesde, setFechaDesde] = useState(`${añoActual}-01-01`);
  const [fechaHasta, setFechaHasta] = useState(`${añoActual}-12-31`);
  const [qBuscado, setQBuscado] = useState("");
  const [qDebounce, setQDebounce] = useState("");
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [facturaAbierta, setFacturaAbierta] = useState(null);
  const [piezasPorFactura, setPiezasPorFactura] = useState({});
  const [loadingPiezas, setLoadingPiezas] = useState({});
  const [errorPiezas, setErrorPiezas] = useState({});
  const [mostrarAnalisis, setMostrarAnalisis] = useState(true);
  const [exportando, setExportando] = useState(null);
  const reporteVisualRef = useRef(null);
  // ── SINCRONIZACIÓN DE FECHAS AÑO / MES ──
  useEffect(() => {
    const pad = (n) => String(n).padStart(2, "0");
    if (mesSel === null) {
      setFechaDesde(`${añoSel}-01-01`);
      setFechaHasta(`${añoSel}-12-31`);
    } else {
      const ultimoDia = new Date(añoSel, mesSel + 1, 0).getDate();
      setFechaDesde(`${añoSel}-${pad(mesSel + 1)}-01`);
      setFechaHasta(`${añoSel}-${pad(mesSel + 1)}-${pad(ultimoDia)}`);
    }
    setPagina(1);
  }, [añoSel, mesSel]);
  // ── FILTRADO EXCLUSIVO VW DE MÉXICO ──
  const facturasVWDeMexico = useMemo(() => {
    return datosAnalisis.filter((f) => {
      const prov = String(f.proveedor || "").toUpperCase();
      return prov.includes("VOLKSWAGEN") || prov.includes("VW DE MEXICO") || prov.includes("VW MEXICO");
    });
  }, [datosAnalisis]);
  const metricasVWMexico = useMemo(() => {
    return {
      total: facturasVWDeMexico.reduce((acc, f) => acc + numero(f.total), 0),
      facturas: facturasVWDeMexico.length,
      cantidad: facturasVWDeMexico.reduce((acc, f) => acc + numero(f.qtprodutos), 0),
      porcentaje: metricas.total > 0 ? ((facturasVWDeMexico.reduce((acc, f) => acc + numero(f.total), 0) / metricas.total) * 100).toFixed(1) : "0.0"
    };
  }, [facturasVWDeMexico, metricas.total]);
  // ── MÉTRICA SUBALTERNA "AUTOPART" (CÓDIGO AP) ──
  const metricasAutopart = useMemo(() => {
    const facturasAP = datosAnalisis.filter((f) =>
      String(f.codigo || "").toUpperCase() === "AP" ||
      String(f.linea || "").toUpperCase() === "AP" ||
      String(f.marca || "").toUpperCase() === "AP" ||
      String(f.serie || "").toUpperCase().includes("AP")
    );
    const totalAP = facturasAP.reduce((acc, f) => acc + numero(f.total), 0);
    return {
      facturas: facturasAP.length,
      total: totalAP,
      cantidad: facturasAP.reduce((acc, f) => acc + numero(f.qtprodutos), 0),
      porcentaje: metricas.total > 0 ? ((totalAP / metricas.total) * 100).toFixed(1) : "0.0"
    };
  }, [datosAnalisis, metricas.total]);
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
  const crearNombreReporteCompras = (extension) => {
    const agenciaLimpia = limpiarNombreArchivo(agencia || "todas_las_agencias");
    const periodoDesc = mesSel !== null ? `${MESES[mesSel]}_${añoSel}` : `ano_${añoSel}`;
    return `reporte_compras_refacciones_${agenciaLimpia}_${periodoDesc}_${obtenerSelloFecha()}.${extension}`;
  };
  const exportarComprasExcel = async () => {
    if (totalRegistros === 0 || exportando) return;
    setExportando("excel");
    try {
      const respuestaCompleta = await getCompraRefTipificada({
        ...parametros,
        page: 1,
        page_size: totalRegistros > 0 ? totalRegistros : 5000,
      });
      const filasAExportar = Array.isArray(respuestaCompleta?.results) ? respuestaCompleta.results : datos;
      const workbook = new ExcelJS.Workbook();
      const hoja = workbook.addWorksheet("Compras", {
        views: [{ state: "frozen", ySplit: 1 }],
        pageSetup: { orientation: "landscape" },
      });
      hoja.columns = [
        { header: "Agencia", key: "agencia", width: 20 },
        { header: "Nota", key: "nrnota", width: 14 },
        { header: "Serie", key: "serie", width: 10 },
        { header: "Pedido", key: "nrpedunpar", width: 14 },
        { header: "Cantidad", key: "qtprodutos", width: 12 },
        { header: "Proveedor", key: "proveedor", width: 30 },
        { header: "Emisión", key: "dtemissao", width: 14 },
        { header: "Entrada", key: "dtentrada", width: 14 },
        { header: "Subtotal", key: "subtotal", width: 16 },
        { header: "IVA", key: "iva", width: 14 },
        { header: "Total", key: "total", width: 16 },
      ];
      hoja.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF001E50" } };
        cell.alignment = { horizontal: "center" };
      });
      filasAExportar.forEach((f) => {
        const sub = numero(f.subtotal);
        hoja.addRow({
          agencia: f.agencia || "—",
          nrnota: f.nrnota ?? "—",
          serie: f.serie || "—",
          nrpedunpar: f.nrpedunpar || "—",
          qtprodutos: numero(f.qtprodutos),
          proveedor: f.proveedor || "—",
          dtemissao: f.dtemissao || "—",
          dtentrada: f.dtentrada || "—",
          subtotal: sub,
          iva: sub * 0.16,
          total: numero(f.total),
        });
      });
      hoja.getColumn(9).numFmt = "$#,##0.00";
      hoja.getColumn(10).numFmt = "$#,##0.00";
      hoja.getColumn(11).numFmt = "$#,##0.00";
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = crearNombreReporteCompras("xlsx");
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando compras:", err);
      alert("No fue posible exportar a Excel.");
    } finally {
      setExportando(null);
    }
  };
  const exportarComprasPdf = async () => {
    if (!datos.length || exportando) return;
    setExportando("pdf");
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 30, 80);
      doc.text("Reporte de Compras de Refacciones", 14, 15);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Fecha: ${new Date().toLocaleString("es-MX")} · Registros: ${totalRegistros}`, 14, 20);
      autoTable(doc, {
        startY: 24,
        head: [["Agencia", "Nota", "Serie", "Pedido", "Cant.", "Proveedor", "Emisión", "Entrada", "Subtotal", "Total"]],
        body: datos.map((f) => [
          f.agencia || "—",
          f.nrnota ?? "—",
          f.serie || "—",
          f.nrpedunpar || "—",
          formatoNumero(f.qtprodutos),
          (f.proveedor || "—").slice(0, 24),
          f.dtemissao || "—",
          f.dtentrada || "—",
          money(f.subtotal),
          money(f.total),
        ]),
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [0, 30, 80], textColor: 255 },
      });
      doc.save(crearNombreReporteCompras("pdf"));
    } catch (err) {
      console.error("Error exportando compras a PDF:", err);
      alert("No fue posible exportar a PDF.");
    } finally {
      setExportando(null);
    }
  };
  useEffect(() => {
    const timeout = setTimeout(() => setQDebounce(qBuscado), 400);
    return () => clearTimeout(timeout);
  }, [qBuscado]);
  useEffect(() => {
    getCompraRefOpciones()
      .then((response) => setOpciones({ agencias: Array.isArray(response?.agencias) ? response.agencias : [] }))
      .catch((err) => console.error("Error cargando agencias:", err));
  }, []);
  const parametros = useMemo(() => ({
    agencia: agencia || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    q: qDebounce || undefined,
  }), [agencia, fechaDesde, fechaHasta, qDebounce]);
  const consultar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getCompraRefTipificada({
        ...parametros,
        page: pagina,
        page_size: pageSize,
      });
      setDatos(Array.isArray(response?.results) ? response.results : []);
      setTotalRegistros(Number(response?.count || 0));
      setMetricas({
        registros: Number(response?.metricas?.registros || 0),
        cantidad_total: Number(response?.metricas?.cantidad_total || 0),
        subtotal: Number(response?.metricas?.subtotal || 0),
        total: Number(response?.metricas?.total || 0),
      });
      setFacturaAbierta(null);
    } catch (err) {
      console.error("Error cargando compras de refacciones:", err);
      setDatos([]);
      setTotalRegistros(0);
      setMetricas({ registros: 0, cantidad_total: 0, subtotal: 0, total: 0 });
      setError(err?.message || "No fue posible cargar las compras de refacciones.");
    } finally {
      setLoading(false);
    }
  }, [parametros, pagina, pageSize]);
  const consultarAnalisis = useCallback(async () => {
    setLoadingAnalisis(true);
    try {
      // Se consulta en bloques para no depender de que el backend permita
      // un page_size enorme. El resultado final contiene TODO el filtro actual.
      const pageSizeAnalisis = 200;
      const primeraRespuesta = await getCompraRefTipificada({
        ...parametros,
        page: 1,
        page_size: pageSizeAnalisis,
      });
      const primeraPagina = Array.isArray(primeraRespuesta?.results)
        ? primeraRespuesta.results
        : [];
      const total = Number(primeraRespuesta?.count || primeraPagina.length || 0);
      const totalPaginasAnalisis = Math.max(1, Math.ceil(total / pageSizeAnalisis));
      const todosLosRegistros = [...primeraPagina];
      for (let paginaAnalisis = 2; paginaAnalisis <= totalPaginasAnalisis; paginaAnalisis += 1) {
        const response = await getCompraRefTipificada({
          ...parametros,
          page: paginaAnalisis,
          page_size: pageSizeAnalisis,
        });
        const resultados = Array.isArray(response?.results) ? response.results : [];
        todosLosRegistros.push(...resultados);
      }
      setDatosAnalisis(todosLosRegistros);
    } catch (err) {
      console.error("Error cargando análisis completo de compras:", err);
      setDatosAnalisis([]);
    } finally {
      setLoadingAnalisis(false);
    }
  }, [parametros]);
  const actualizarTodo = useCallback(() => {
    consultar();
    consultarAnalisis();
  }, [consultar, consultarAnalisis]);
  useEffect(() => {
    consultar();
  }, [consultar]);
  useEffect(() => {
    consultarAnalisis();
  }, [consultarAnalisis]);
  const totalPaginas = useMemo(() => Math.max(1, Math.ceil(totalRegistros / pageSize)), [totalRegistros, pageSize]);
  const analisisGeneral = useMemo(() => {
    const agenciasMap = {};
    const proveedoresMap = {};
    datosAnalisis.forEach((factura) => {
      const totalFactura = numero(factura.total);
      const nombreAgencia = factura.agencia || "Sin agencia";
      const nombreProveedor = factura.proveedor || "Sin proveedor";
      if (!agenciasMap[nombreAgencia]) {
        agenciasMap[nombreAgencia] = { total: 0, facturas: 0 };
      }
      agenciasMap[nombreAgencia].total += totalFactura;
      agenciasMap[nombreAgencia].facturas += 1;
      if (!proveedoresMap[nombreProveedor]) {
        proveedoresMap[nombreProveedor] = { total: 0, facturas: 0 };
      }
      proveedoresMap[nombreProveedor].total += totalFactura;
      proveedoresMap[nombreProveedor].facturas += 1;
    });
    const agencias = Object.entries(agenciasMap)
      .map(([type, values]) => ({ type, ...values }))
      .sort((a, b) => b.total - a.total);
    const proveedores = Object.entries(proveedoresMap)
      .map(([nombre, values]) => ({ nombre, ...values }))
      .sort((a, b) => b.total - a.total);
    const distribucion = agencia
      ? proveedores.map((item) => ({ type: item.nombre, value: item.facturas }))
      : agencias.map((item) => ({ type: item.type, value: item.total }));
    const totalProveedores = proveedores.reduce(
      (acc, item) => acc + numero(item.total),
      0
    );
    return {
      agencias,
      proveedores,
      distribucion,
      maxProveedor: Math.max(...proveedores.map((item) => item.total), 1),
      totalVisible: totalProveedores,
    };
  }, [datosAnalisis, agencia]);
  async function desplegarFactura(factura) {
    const clave = claveFactura(factura);
    if (facturaAbierta === clave) {
      setFacturaAbierta(null);
      return;
    }
    setFacturaAbierta(clave);
    if (piezasPorFactura[clave]) return;
    setLoadingPiezas((prev) => ({ ...prev, [clave]: true }));
    setErrorPiezas((prev) => ({ ...prev, [clave]: "" }));
    try {
      const response = await getCompraRefPiezas({ agencia: factura.agencia, nrnota: factura.nrnota });
      setPiezasPorFactura((prev) => ({
        ...prev,
        [clave]: {
          results: Array.isArray(response?.results) ? response.results : [],
          resumen: response?.resumen || { partidas: 0, cantidad_total: 0, importe_total: 0 },
        },
      }));
    } catch (err) {
      setErrorPiezas((prev) => ({ ...prev, [clave]: err?.message || "No fue posible cargar las piezas de esta factura." }));
    } finally {
      setLoadingPiezas((prev) => ({ ...prev, [clave]: false }));
    }
  }
  function cambiarAgencia(value) {
    setAgencia(value);
    setPagina(1);
  }
  return (
    <div className="w-full bg-white text-[#1E293B] font-vw-text font-light p-3 md:p-5 space-y-5 min-h-screen">
      {/* ── ENCABEZADO Y CONTROLES GENERALES ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
        <div>
          <h1 className="text-xl font-vw-head font-extrabold text-[#001E50] tracking-tight">
            Compra de Refacciones
          </h1>
          <p className="text-xs font-vw-text font-semibold text-slate-500">
            Monitor de compras consolidadas y facturación
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={exportarComprasExcel}
            disabled={!datos.length || Boolean(exportando)}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 font-vw-head font-bold text-xs hover:bg-emerald-100 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {exportando === "excel" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={exportarComprasPdf}
            disabled={!datos.length || Boolean(exportando)}
            className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 px-4 py-1.5 font-vw-head font-bold text-xs hover:bg-red-100 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            {exportando === "pdf" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            Exportar PDF
          </button>
          <button
            type="button"
            onClick={actualizarTodo}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-[#001E50] border border-slate-200 px-4 py-1.5 font-vw-head font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>
      {/* ── FILTROS DE AGENCIAS Y BÚSQUEDA ── */}
      <div className="w-full py-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => cambiarAgencia("")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-vw-head font-bold transition-all duration-150 cursor-pointer ${!agencia
              ? "bg-[#001E50] text-white ring-2 ring-[#001E50]"
              : "bg-white text-[#001E50] border border-slate-200 hover:bg-slate-50"
              }`}
          >
            <span>Todas las agencias</span>
          </button>
          {opciones.agencias.map((item) => {
            const active = agencia === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => cambiarAgencia(active ? "" : item)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-vw-head font-bold transition-all duration-150 cursor-pointer ${active
                  ? "bg-[#001E50] text-white ring-2 ring-[#001E50]"
                  : "bg-white text-[#001E50] border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <span>{item}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* ── FILTROS DE AÑO Y MESES HORIZONTALES ── */}
      <div className="bg-white rounded-xl p-2.5 border border-slate-200 flex flex-col md:flex-row items-center gap-3">
        <div className="relative inline-block shrink-0">
          <select
            value={añoSel}
            onChange={(e) => setAñoSel(Number(e.target.value))}
            className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-7 text-xs font-vw-head font-bold text-[#001E50] focus:outline-none cursor-pointer"
          >
            {años.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto w-full pb-1 md:pb-0 scrollbar-thin">
          <button
            type="button"
            onClick={() => setMesSel(null)}
            className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-3 py-1.5 text-xs transition-all ${mesSel === null
              ? "bg-[#001E50] text-white font-vw-head font-bold"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-vw-head font-bold"
              }`}
          >
            {mesSel === null ? <Check className="h-3 w-3 text-white" /> : <Plus className="h-3 w-3 text-slate-400" />}
            <span>Todo el año</span>
          </button>
          {MESES.map((mes, index) => {
            const futuro = añoSel === añoActual && index > mesActual;
            const active = mesSel === index;
            return (
              <button
                key={mes}
                type="button"
                disabled={futuro}
                onClick={() => setMesSel(active ? null : index)}
                className={`inline-flex items-center gap-1 shrink-0 rounded-lg px-2.5 py-1.5 text-xs transition-all ${active
                  ? "bg-[#001E50] text-white font-vw-head font-bold"
                  : futuro
                    ? "border border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed font-vw-head font-bold"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-vw-head font-bold"
                  }`}
              >
                {active ? <Check className="h-3 w-3 text-white" /> : <Plus className="h-3 w-3 text-slate-400" />}
                <span>{mes.toLowerCase()}</span>
              </button>
            );
          })}
        </div>
        {/* BUSCADOR */}
        <div className="relative shrink-0 w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={qBuscado}
            onChange={(e) => { setQBuscado(e.target.value); setPagina(1); }}
            placeholder="Buscar nota, pedido..."
            className="w-full h-[32px] rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-8 text-xs font-vw-text font-semibold text-[#001E50] outline-none transition focus:border-[#1677FF] focus:bg-white"
          />
          {qBuscado && (
            <button
              onClick={() => { setQBuscado(""); setPagina(1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-vw-text">
          {error}
        </div>
      )}
      {/* ── SECCIÓN HERO: TOTAL DE FACTURACIÓN (1/3) + CONSOLIDADO / SUBALTERNOS (2/3) ── */}
      <div ref={reporteVisualRef} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* KPI HERO PRINCIPAL: TOTAL DE FACTURACIÓN (1/3 ANCHO) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="relative h-28 w-full overflow-hidden bg-[#001E50] shrink-0">
            <img
              src={IMAGEN_HERO_REFACCIONES}
              alt="Refacciones VW"
              className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
              onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#001E50] via-[#001E50]/50 to-transparent" />
            <div className="absolute top-2 left-2 bg-[#001E50] text-white text-[10px] font-vw-head font-bold px-2.5 py-0.5 rounded-full border border-white/20">
              Consolidado General
            </div>
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white">
              <Building2 className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-xs font-vw-head font-bold tracking-wide">VW Showroom & Almacén</span>
            </div>
          </div>
          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider">
                  COMPRAS DE REFACCIONES
                </span>
                <span className="bg-blue-50 text-[#1677FF] text-[9px] font-vw-head font-bold px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  VW de México
                </span>
              </div>
            </div>
            {/* MONTO PRINCIPAL HERO */}
            <div className="flex flex-col items-center justify-center py-1 text-center my-auto">
              <h4 className="text-[11px] font-vw-head font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                Total de Facturación
              </h4>
              <div className="text-4xl font-vw-head font-extrabold text-[#001E50] leading-none tracking-tight">
                {loading ? "..." : moneyCompact(metricas.total)}
              </div>
              <div className="text-[10px] font-vw-head font-bold text-[#1677FF] uppercase tracking-wider mt-1.5">
                {formatoNumero(metricas.registros)} Facturas Totales
              </div>
            </div>
            {/* DESGLOSE COMPRAS EXCLUSIVAS VOLKSWAGEN DE MÉXICO */}
            <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-vw-head font-bold text-[#001E50]">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-[#1677FF]" /> Exclusivas Volkswagen de México
                </span>
                <span className="bg-blue-100 text-[#001E50] px-1.5 py-0.2 rounded text-[9px]">
                  {loadingAnalisis ? "..." : `${metricasVWMexico.porcentaje}%`}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-vw-head font-extrabold text-[#001E50]">
                <span>{loadingAnalisis ? "..." : money(metricasVWMexico.total)}</span>
                <span className="text-[10px] font-normal text-slate-500">{loadingAnalisis ? "..." : `${metricasVWMexico.facturas} fact.`}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-1.5 text-center">
                <div className="text-[9px] text-slate-400 font-vw-text">Subtotal Acumulado</div>
                <div className="text-xs font-vw-head font-bold text-[#001E50] mt-0.5">
                  {moneyCompact(metricas.subtotal)}
                </div>
              </div>
              <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-1.5 text-center">
                <div className="text-[9px] text-slate-400 font-vw-text">Piezas Totales</div>
                <div className="text-xs font-vw-head font-bold text-amber-600 mt-0.5">
                  {formatoNumero(metricas.cantidad_total)} u.
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* MÉTRICAS SECUNDARIAS, HERO SUBALTERNO (AP) Y ANÁLISIS (2/3 ANCHO) */}
        <div className="lg:col-span-8 bg-[#F8FAFC] rounded-2xl border border-slate-200 p-3.5 md:p-4 space-y-3 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
              <Settings2 className="h-3.5 w-3.5 text-white shrink-0" />
              <span>Análisis de Compras y Líneas</span>
            </div>
            <button
              type="button"
              onClick={() => setMostrarAnalisis(p => !p)}
              className="inline-flex items-center gap-1 rounded-full bg-white text-[#001E50] border border-slate-200 px-3 py-1 font-vw-head font-bold text-[10px] hover:bg-[#001E50] hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <PieChartIcon className="h-3 w-3" />
              <span>{mostrarAnalisis ? "Ocultar Análisis" : "Ver Análisis"}</span>
            </button>
          </div>
          {/* TARJETAS SUPERIORES INCLUYENDO EL SUBALTERNO AP (AUTOPART) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* CARD SUBALTERNO: AUTOPART (CÓDIGO AP) */}
            <div className="bg-white border border-amber-200/80 bg-amber-50/20 rounded-xl p-2.5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-[10px] font-vw-head font-bold text-amber-800 uppercase mb-1">
                <span className="flex items-center gap-1">
                  <Wrench className="h-3 w-3 text-amber-600" /> Autopart (AP)
                </span>
                <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold">
                  {metricasAutopart.porcentaje}% del total
                </span>
              </div>
              <div className="text-base font-vw-head font-extrabold text-[#001E50]">
                {loading || loadingAnalisis ? "..." : money(metricasAutopart.total)}
              </div>
              <div className="text-[10px] text-slate-500 font-vw-text mt-0.5 flex justify-between">
                <span>{metricasAutopart.facturas} facturas AP</span>
                <span className="font-bold text-amber-700">{formatoNumero(metricasAutopart.cantidad)} pzs.</span>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-col justify-between">
              <div className="text-[10px] font-vw-head font-bold text-slate-400 uppercase">
                <CircleDollarSign className="inline h-3 w-3 mr-1 text-[#1677FF]" />
                Subtotal
              </div>
              <div className="text-base font-vw-head font-extrabold text-[#001E50]">
                {loading ? "—" : money(metricas.subtotal)}
              </div>
              <div className="text-[10px] text-slate-400 font-vw-text">Antes de impuestos</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs flex flex-col justify-between">
              <div className="text-[10px] font-vw-head font-bold text-slate-400 uppercase">
                <Package className="inline h-3 w-3 mr-1 text-emerald-600" />
                Piezas Registradas
              </div>
              <div className="text-base font-vw-head font-extrabold text-emerald-700">
                {loading ? "—" : formatoNumero(metricas.cantidad_total)}
              </div>
              <div className="text-[10px] text-slate-400 font-vw-text">Cantidad acumulada</div>
            </div>
          </div>
          {mostrarAnalisis && loadingAnalisis && (
            <div className="flex-1 flex items-center justify-center gap-2 text-xs text-slate-500 bg-white rounded-xl border border-slate-200 min-h-[210px]">
              <LoaderCircle className="h-4 w-4 animate-spin text-[#1677FF]" />
              Cargando análisis completo...
            </div>
          )}
          {mostrarAnalisis && !loadingAnalisis && datosAnalisis.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 h-[210px]">
              <VWPieCard
                title={agencia ? "Distribución por Proveedor" : "Importe por Agencia"}
                icon={PieChartIcon}
                data={analisisGeneral.distribucion}
                total={analisisGeneral.distribucion.reduce((acc, item) => acc + numero(item.value), 0)}
                isCurrency={!agencia}
              />
              <VWTopProveedores
                data={analisisGeneral.proveedores}
                maxVal={analisisGeneral.maxProveedor}
                totalVisible={analisisGeneral.totalVisible}
                totalFacturado={metricas.total}
                onRowClick={(prov) => { setQBuscado(prov); setPagina(1); }}
              />
            </div>
          )}
          {mostrarAnalisis && !loadingAnalisis && datosAnalisis.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-300 min-h-[210px]">
              No hay datos registrados en el periodo seleccionado
            </div>
          )}
        </div>
      </div>
      {/* ── TABLA DE RESULTADOS EXPANDIBLE ── */}
      <TablaFacturasExpandible
        rows={datos}
        loading={loading}
        facturaAbierta={facturaAbierta}
        piezasPorFactura={piezasPorFactura}
        loadingPiezas={loadingPiezas}
        errorPiezas={errorPiezas}
        onToggle={desplegarFactura}
      />
      <Paginacion
        pagina={pagina}
        totalPaginas={totalPaginas}
        total={totalRegistros}
        pageSize={pageSize}
        onPageSizeChange={(value) => { setPageSize(value); setPagina(1); }}
        onPrev={() => setPagina((prev) => Math.max(1, prev - 1))}
        onNext={() => setPagina((prev) => Math.min(totalPaginas, prev + 1))}
      />
    </div>
  );
}
// =========================================================================================
// COMPONENTES SECUNDARIOS ADAPTADOS
// =========================================================================================
function VWTopProveedores({ data, maxVal, totalVisible, totalFacturado, onRowClick }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 h-[210px] flex flex-col justify-center text-center text-xs text-slate-400 italic">
        Sin proveedores registrados.
      </div>
    );
  }

  const diferencia = numero(totalFacturado) - numero(totalVisible);
  const conciliado = Math.abs(diferencia) < 0.01;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3 h-[210px] flex flex-col overflow-hidden">
      <div className="text-[10px] font-vw-head font-bold text-slate-500 uppercase border-b border-slate-100 pb-1 mb-2 shrink-0">
        <Briefcase className="inline h-3 w-3 mr-1 text-[#1677FF]" />
        Proveedores por Importe
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
        {data.map((item, idx) => {
          const pctWidth = maxVal > 0 ? (item.total / maxVal) * 100 : 0;
          const share = totalVisible > 0 ? (item.total / totalVisible) * 100 : 0;

          return (
            <div
              key={item.nombre}
              onClick={() => onRowClick(item.nombre)}
              className="cursor-pointer group hover:bg-slate-50 p-1 rounded-lg transition-colors"
            >
              <div className="flex justify-between items-center text-[11px] mb-0.5">
                <div className="flex items-center gap-1.5 truncate min-w-0">
                  <span className="bg-[#001E50] text-white rounded text-[8px] px-1 font-bold shrink-0">
                    {idx + 1}
                  </span>

                  <span
                    className="font-vw-head font-bold text-[#001E50] truncate"
                    title={item.nombre}
                  >
                    {item.nombre}
                  </span>
                </div>

                <div className="text-right shrink-0 font-vw-head font-bold text-slate-700 ml-2">
                  {moneyCompact(item.total)}
                  <span className="text-[#1677FF] text-[9px] ml-1">
                    ({share.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#001E50] rounded-full group-hover:bg-[#1677FF] transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(3, pctWidth))}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 shrink-0 text-[13px] font-vw-text bg-white">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Total proveedores</span>
          <span className="font-vw-head font-bold text-[#001E50]">
            {money(totalVisible)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-slate-500">Diferencia vs. facturación</span>
          <span
            className={`font-vw-head font-bold ${conciliado ? "text-emerald-600" : "text-red-600"
              }`}
          >
            {money(diferencia)}
          </span>
        </div>
      </div>
    </div>
  );
}

function VWPieCard({ title, icon: Icon, data = [], total = 0, isCurrency = false }) {
  const formattedData = data.map((item, index) => ({
    ...item,
    color: PALETA_VW[index % PALETA_VW.length],
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0"
  }));
  const config = {
    data: formattedData,
    angleField: "value",
    colorField: "type",
    radius: 0.95,
    innerRadius: 0.60,
    scale: { color: { range: formattedData.map(d => d.color) } },
    legend: false,
    label: {
      text: (d) => `${total > 0 ? ((d.value / total) * 100).toFixed(0) : "0"}%`,
      position: "inside",
      style: { fontSize: 10, fontWeight: "bold", fontFamily: "VW Text, sans-serif", fill: "#FFFFFF", textAlign: "center" },
    },
    tooltip: {
      formatter: (datum) => {
        const val = isCurrency ? money(datum.value) : formatoNumero(datum.value);
        return { name: datum.type, value: val };
      },
    },
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 h-full flex items-center justify-between gap-2">
      <div className="w-1/2 flex flex-col justify-center space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
        <div className="text-[10px] font-vw-head font-bold text-slate-500 uppercase border-b border-slate-100 pb-1 mb-1">
          <Icon className="inline h-3 w-3 mr-1 text-[#1677FF]" />
          {title}
        </div>
        {formattedData.map((item) => (
          <div key={item.type} className="flex flex-col text-[10px] border-b border-slate-50 pb-1 last:border-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-vw-head font-bold text-[#001E50] truncate" title={item.type}>{item.type}</span>
            </div>
            <div className="flex justify-between items-center pl-3.5 mt-0.5">
              <span className="font-vw-head font-bold text-slate-600">{isCurrency ? moneyCompact(item.value) : formatoNumero(item.value)}</span>
              <span className="text-[#1677FF] font-bold">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="w-1/2 h-full flex items-center justify-center min-h-[140px]">
        {data.length > 0 && <Pie {...config} />}
      </div>
    </div>
  );
}
function TablaFacturasExpandible({ rows, loading, facturaAbierta, piezasPorFactura, loadingPiezas, errorPiezas, onToggle }) {
  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <LoaderCircle className="h-7 w-7 animate-spin text-[#1677FF]" />
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-sm font-vw-text font-semibold text-slate-400">
        No se encontraron facturas.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm font-vw-text">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse text-xs">
          <thead className="bg-[#F1F5F9] text-[#001E50] font-vw-head font-bold border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="w-12 px-3 py-3" />
              <th className="px-3 py-3 text-left">Agencia</th>
              <th className="px-3 py-3 text-right">Nota</th>
              <th className="px-3 py-3 text-left">Serie</th>
              <th className="px-3 py-3 text-left">Pedido</th>
              <th className="px-3 py-3 text-right">Cantidad</th>
              <th className="px-3 py-3 text-left">Proveedor</th>
              <th className="px-3 py-3 text-center">Emisión</th>
              <th className="px-3 py-3 text-center">Entrada</th>
              <th className="px-3 py-3 text-right">Subtotal</th>
              <th className="px-3 py-3 text-right">IVA</th>
              <th className="px-3 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((factura) => {
              const clave = claveFactura(factura);
              const abierta = facturaAbierta === clave;
              const detalle = piezasPorFactura[clave];
              const piezas = detalle?.results || [];
              const esAP = String(factura.codigo || "").toUpperCase() === "AP" ||
                String(factura.linea || "").toUpperCase() === "AP" ||
                String(factura.marca || "").toUpperCase() === "AP" ||
                String(factura.serie || "").toUpperCase().includes("AP");
              return (
                <Fragment key={clave}>
                  <tr className={`transition-colors hover:bg-slate-50 ${abierta ? "bg-slate-50" : ""}`}>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggle(factura)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#1677FF] bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        {abierta ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                    <td className="px-3 py-3 font-vw-head font-bold text-[#001E50]">{factura.agencia || "—"}</td>
                    <td className="px-3 py-3 text-right font-vw-head font-bold text-[#1677FF]">{factura.nrnota ?? "—"}</td>
                    <td className="px-3 py-3">
                      {esAP ? <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 text-[9px] font-bold mr-1">AP</span> : null}
                      {factura.serie || "—"}
                    </td>
                    <td className="px-3 py-3">{factura.nrpedunpar || "—"}</td>
                    <td className="px-3 py-3 text-right font-bold">{formatoNumero(factura.qtprodutos)}</td>
                    <td className="max-w-[200px] truncate px-3 py-3 text-[#001E50]" title={factura.proveedor}>{factura.proveedor || "—"}</td>
                    <td className="px-3 py-3 text-center">{factura.dtemissao || "—"}</td>
                    <td className="px-3 py-3 text-center">{factura.dtentrada || "—"}</td>
                    <td className="px-3 py-3 text-right">{money(factura.subtotal)}</td>
                    <td className="px-3 py-3 text-right">{money(factura.subtotal * 0.16)}</td>
                    <td className="px-3 py-3 text-right font-vw-head font-bold text-[#001E50]">{money(factura.total)}</td>
                  </tr>
                  {abierta && (
                    <tr>
                      <td colSpan={12} className="bg-slate-50 p-0 border-b border-slate-200">
                        <div className="px-6 py-4">
                          {loadingPiezas[clave] && (
                            <div className="flex items-center gap-2 py-4 text-xs font-semibold text-slate-500">
                              <LoaderCircle className="h-4 w-4 animate-spin text-[#1677FF]" /> Cargando piezas...
                            </div>
                          )}
                          {!loadingPiezas[clave] && errorPiezas[clave] && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                              {errorPiezas[clave]}
                            </div>
                          )}
                          {!loadingPiezas[clave] && !errorPiezas[clave] && detalle && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
                              <div className="flex items-center gap-2 mb-3 text-xs font-vw-head font-bold text-[#001E50]">
                                <PackageSearch className="h-4 w-4 text-[#1677FF]" /> Desglose de piezas (Nota: {factura.nrnota})
                              </div>
                              {piezas.length ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-[10px]">
                                    <thead className="bg-[#F8FAFC] text-[#001E50] font-vw-head font-bold border-b border-slate-100">
                                      <tr>
                                        <th className="px-2 py-1.5 text-right">#</th>
                                        <th className="px-2 py-1.5">Código</th>
                                        <th className="px-2 py-1.5">Descripción</th>
                                        <th className="px-2 py-1.5">Unidad</th>
                                        <th className="px-2 py-1.5 text-right">Cant.</th>
                                        <th className="px-2 py-1.5 text-right">Unitario</th>
                                        <th className="px-2 py-1.5 text-right">Total Bruto</th>
                                        <th className="px-2 py-1.5 text-right">IVA</th>
                                        <th className="px-2 py-1.5 text-right">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-600">
                                      {piezas.map((pieza) => (
                                        <tr key={pieza.rowid__ ?? `${pieza.seqitem}-${pieza.prodserv}`} className="hover:bg-slate-50">
                                          <td className="px-2 py-1.5 text-right text-slate-400">{pieza.seqitem ?? "—"}</td>
                                          <td className="px-2 py-1.5 font-vw-head font-bold text-[#001E50]">{pieza.prodserv?.trim() || "—"}</td>
                                          <td className="px-2 py-1.5">{pieza.descrprod || "—"}</td>
                                          <td className="px-2 py-1.5">{pieza.unidade || "—"}</td>
                                          <td className="px-2 py-1.5 text-right font-bold">{formatoNumero(pieza.qtprodutos)}</td>
                                          <td className="px-2 py-1.5 text-right">{money(pieza.vrunitbruto)}</td>
                                          <td className="px-2 py-1.5 text-right">{money(pieza.vrliqtotal)}</td>
                                          <td className="px-2 py-1.5 text-right">{money(pieza.vrliqtotal * 0.16)}</td>
                                          <td className="px-2 py-1.5 text-right font-vw-head font-bold text-[#001E50]">{money(pieza.vrliqtotal * 1.16)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="border-t-2 border-slate-200 bg-[#F1F5F9] text-[#001E50] font-vw-head font-bold">
                                      <tr>
                                        <td colSpan={4} className="px-2 py-2 text-right uppercase">Totales</td>
                                        <td className="px-2 py-2 text-right">{formatoNumero(piezas.reduce((sum, p) => sum + numero(p.qtprodutos), 0))}</td>
                                        <td className="px-2 py-2 text-right">{money(piezas.reduce((sum, p) => sum + numero(p.vrunitbruto), 0))}</td>
                                        <td className="px-2 py-2 text-right">{money(piezas.reduce((sum, p) => sum + numero(p.vrliqtotal), 0))}</td>
                                        <td className="px-2 py-2 text-right">{money(piezas.reduce((sum, p) => sum + numero(p.vrliqtotal) * 0.16, 0))}</td>
                                        <td className="px-2 py-2 text-right">{money(piezas.reduce((sum, p) => sum + numero(p.vrliqtotal) * 1.16, 0))}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center text-[10px] text-slate-400 italic py-4">No se encontraron piezas registradas en esta factura.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Paginacion({ pagina, totalPaginas, total, pageSize, onPageSizeChange, onPrev, onNext }) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm font-vw-text text-xs">
      <div className="text-slate-500 font-semibold">
        Total <span className="font-vw-head font-bold text-[#001E50]">{formatoNumero(total)}</span> registros |
        Página <span className="font-vw-head font-bold text-[#001E50]">{pagina}</span> de <span className="font-vw-head font-bold text-[#001E50]">{totalPaginas}</span>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 rounded-full border border-slate-200 bg-white px-3 font-vw-head font-bold text-[#001E50] outline-none cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
        <button
          onClick={onPrev}
          disabled={pagina <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 px-3 font-vw-head font-bold text-[#001E50] hover:bg-slate-50 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Anterior
        </button>
        <button
          onClick={onNext}
          disabled={pagina >= totalPaginas}
          className="inline-flex h-8 items-center gap-1 rounded-full bg-[#001E50] px-3 font-vw-head font-bold text-white hover:bg-[#1677FF] disabled:opacity-40 transition-colors"
        >
          Siguiente <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
