import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
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
import { FileSpreadsheet, FileText } from "lucide-react";

const PALETA_VW = [
  "#001E50",
  "#1677FF",
  "#0EA5E9",
  "#38BDF8",
  "#6366F1",
  "#14B8A6",
  "#F59E0B",
  "#10B981",
];

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

function fechaOrden(value) {
  if (!value) return 0;
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return Number(`${iso[1]}${iso[2]}${iso[3]}`);
  const mx = raw.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})/);
  if (mx) return Number(`${mx[3]}${mx[2]}${mx[1]}`);
  const fecha = new Date(raw);
  return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime();
}

function claveFactura(factura) {
  return `${factura.agencia || ""}|${factura.nrnota || ""}|${factura.serie || ""}`;
}

export default function CompraRefacciones() {
  const [datos, setDatos] = useState([]);
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
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

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

  // ── Formateo de nombre dinámico según filtros activos ──
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

    let periodoDesc = "todas_las_fechas";
    if (fechaDesde && fechaHasta) {
      periodoDesc = `${fechaDesde}_a_${fechaHasta}`;
    } else if (fechaDesde) {
      periodoDesc = `desde_${fechaDesde}`;
    } else if (fechaHasta) {
      periodoDesc = `hasta_${fechaHasta}`;
    }
    const periodoLimpio = limpiarNombreArchivo(periodoDesc);
    const busquedaLimpia = qBuscado ? `_${limpiarNombreArchivo(qBuscado)}` : "";

    return `reporte_compras_refacciones_${agenciaLimpia}_${periodoLimpio}${busquedaLimpia}_${obtenerSelloFecha()}.${extension}`;
  };

  const esperarRenderCompleto = async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 800));
  };

  const agregarCanvasPaginadoPdf = (doc, canvas) => {
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
      if (!contexto) throw new Error("No fue posible preparar una página del PDF.");
      contexto.fillStyle = "#ffffff";
      contexto.fillRect(0, 0, corte.width, corte.height);
      contexto.drawImage(canvas, 0, posicionY, canvas.width, altoActualPx, 0, 0, canvas.width, altoActualPx);

      const altoImagenMm = altoActualPx / pixelesPorMm;
      doc.addImage(corte.toDataURL("image/png"), "PNG", margen, margen, anchoUtil, altoImagenMm, undefined, "FAST");
      posicionY += altoActualPx;
    }
  };

  const exportarComprasExcel = async () => {
    if (totalRegistros === 0 || exportando) return;
    setExportando("excel");
    try {
      // 1. Consultar el 100% de las facturas que coinciden con los filtros actuales
      const respuestaCompleta = await getCompraRefTipificada({
        ...parametros,
        page: 1,
        page_size: totalRegistros > 0 ? totalRegistros : 5000,
      });
      const filasAExportar = Array.isArray(respuestaCompleta?.results) 
        ? respuestaCompleta.results 
        : datos;

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
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF131E5C" } };
        cell.alignment = { horizontal: "center" };
      });

      // 2. Insertar todas las facturas recuperadas
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
    const previaVisibilidad = mostrarAnalisis;

    try {
      // Si el análisis de gráficas estaba oculto, se despliega temporalmente para la captura
      if (!previaVisibilidad) {
        setMostrarAnalisis(true);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      await esperarRenderCompleto();

      if (!reporteVisualRef.current) throw new Error("No se encontró el contenedor visual.");

      // 1. Captura de gráficas y KPIs eliminando los filtros del clon
      const canvas = await html2canvas(reporteVisualRef.current, {
        scale: 1.35,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (documentoClonado) => {
          const filtrosClonados = documentoClonado.getElementById("seccion-filtros-compras");
          if (filtrosClonados) {
            filtrosClonados.remove();
          }
        },
      });

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
      doc.setProperties({
        title: `Reporte de Compras - ${new Date().toLocaleDateString("es-MX")}`,
        author: "CRM Grupo Automotriz R&R",
      });

      // 2. Insertar las gráficas
      agregarCanvasPaginadoPdf(doc, canvas);

      // 3. Insertar la tabla detallada al final
      doc.addPage("a4", "landscape");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(19, 30, 92);
      doc.text("Detalle de Facturas de Compras", 10, 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(
        `Generado: ${new Date().toLocaleString("es-MX")} · Total: ${totalRegistros} facturas`,
        10,
        16
      );

      autoTable(doc, {
        startY: 19,
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
        headStyles: { fillColor: [19, 30, 92], textColor: 255 },
        margin: { left: 8, right: 8, bottom: 10 },
        didDrawPage: () => {
          const ancho = doc.internal.pageSize.getWidth();
          const alto = doc.internal.pageSize.getHeight();
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(107, 114, 128);
          doc.text(`Página ${doc.getNumberOfPages()}`, ancho - 22, alto - 4);
        },
      });

      doc.save(crearNombreReporteCompras("pdf"));
    } catch (err) {
      console.error("Error exportando compras a PDF:", err);
      alert("No fue posible exportar a PDF.");
    } finally {
      if (!previaVisibilidad) {
        setMostrarAnalisis(false);
      }
      setExportando(null);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setQDebounce(qBuscado), 400);
    return () => clearTimeout(timeout);
  }, [qBuscado]);

  useEffect(() => {
    getCompraRefOpciones()
      .then((response) => {
        setOpciones({
          agencias: Array.isArray(response?.agencias) ? response.agencias : [],
        });
      })
      .catch((err) => {
        console.error("Error cargando agencias:", err);
      });
  }, []);

  const parametros = useMemo(
    () => ({
      agencia: agencia || undefined,
      fecha_desde: fechaDesde || undefined,
      fecha_hasta: fechaHasta || undefined,
      q: qDebounce || undefined,
    }),
    [agencia, fechaDesde, fechaHasta, qDebounce]
  );

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
      setMetricas({
        registros: 0,
        cantidad_total: 0,
        subtotal: 0,
        total: 0,
      });

      setError(
        err?.message ||
        "No fue posible cargar las compras de refacciones."
      );
    } finally {
      setLoading(false);
    }
  }, [parametros, pagina, pageSize]);

  useEffect(() => {
    consultar();
  }, [consultar]);

  const totalPaginas = useMemo(() => {
    return Math.max(1, Math.ceil(totalRegistros / pageSize));
  }, [totalRegistros, pageSize]);

  const analisisPagina = useMemo(() => {
    const agenciasMap = {};
    const proveedoresMap = {};
    const fechasMap = {};

    datos.forEach((factura) => {
      const totalFactura = numero(factura.total);
      const nombreAgencia = factura.agencia || "Sin agencia";
      const nombreProveedor = factura.proveedor || "Sin proveedor";
      const fecha = factura.dtentrada || "Sin fecha";

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

      if (!fechasMap[fecha]) {
        fechasMap[fecha] = { total: 0, facturas: 0 };
      }
      fechasMap[fecha].total += totalFactura;
      fechasMap[fecha].facturas += 1;
    });

    const agencias = Object.entries(agenciasMap)
      .map(([type, values]) => ({ type, ...values }))
      .sort((a, b) => b.total - a.total);

    const proveedores = Object.entries(proveedoresMap)
      .map(([nombre, values]) => ({ nombre, ...values }))
      .sort((a, b) => b.total - a.total);

    const comportamiento = Object.entries(fechasMap)
      .map(([fecha, values]) => ({
        fecha,
        etiqueta: fechaCorta(fecha),
        orden: fechaOrden(fecha),
        ...values,
      }))
      .sort((a, b) => a.orden - b.orden);

    const distribucion = agencia
      ? proveedores.slice(0, 8).map((item) => ({
        type: item.nombre,
        value: item.facturas,
      }))
      : agencias.map((item) => ({
        type: item.type,
        value: item.total,
      }));

    return {
      agencias,
      proveedores,
      comportamiento,
      distribucion,
      maxProveedor: Math.max(...proveedores.map((item) => item.total), 1),
      maxFecha: Math.max(...comportamiento.map((item) => item.total), 1),
      totalVisible: datos.reduce((acc, item) => acc + numero(item.total), 0),
    };
  }, [datos, agencia]);


  async function desplegarFactura(factura) {
    const clave = claveFactura(factura);

    if (facturaAbierta === clave) {
      setFacturaAbierta(null);
      return;
    }

    setFacturaAbierta(clave);

    if (piezasPorFactura[clave]) return;

    setLoadingPiezas((prev) => ({
      ...prev,
      [clave]: true,
    }));

    setErrorPiezas((prev) => ({
      ...prev,
      [clave]: "",
    }));

    try {
      const response = await getCompraRefPiezas({
        agencia: factura.agencia,
        nrnota: factura.nrnota,
      });

      setPiezasPorFactura((prev) => ({
        ...prev,
        [clave]: {
          results: Array.isArray(response?.results)
            ? response.results
            : [],
          resumen: response?.resumen || {
            partidas: 0,
            cantidad_total: 0,
            importe_total: 0,
          },
        },
      }));
    } catch (err) {
      console.error("Error cargando piezas:", err);

      setErrorPiezas((prev) => ({
        ...prev,
        [clave]:
          err?.message ||
          "No fue posible cargar las piezas de esta factura.",
      }));
    } finally {
      setLoadingPiezas((prev) => ({
        ...prev,
        [clave]: false,
      }));
    }
  }

  function cambiarAgencia(value) {
    setAgencia(value);
    setPagina(1);
  }

  function limpiarFiltros() {
    setAgencia("");
    setFechaDesde("");
    setFechaHasta("");
    setQBuscado("");
    setPagina(1);
  }

  return (
    <div className="min-h-screen">
      <main className="space-y-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#131E5C]">
              Compra de Refacciones
            </h1>
            <p className="text-xs font-medium text-[#8891AD]">
              Facturas de refacciones
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={exportarComprasExcel}
              disabled={!datos.length || Boolean(exportando)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50"
            >
              {exportando === "excel" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Exportar Excel
            </button>

            <button
              type="button"
              onClick={exportarComprasPdf}
              disabled={!datos.length || Boolean(exportando)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
            >
              {exportando === "pdf" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Exportar PDF
            </button>

            <button
              type="button"
              onClick={consultar}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-sm font-semibold text-[#131E5C] shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Actualizar
            </button>
          </div>
        </div>

        <div ref={reporteVisualRef} className="space-y-5">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KPICard
              icon={CircleDollarSign}
              label="Total"
              value={loading ? "—" : money(metricas.total)}
              sub="Total de facturas"
              accent="#0EA5E9"
            />

            <KPICard
              icon={CircleDollarSign}
              label="Subtotal"
              value={loading ? "—" : money(metricas.subtotal)}
              sub="Subtotal de facturas"
              accent="#10B981"
            />

            <KPICard
              icon={Package}
              label="Cantidad"
              value={loading ? "—" : formatoNumero(metricas.cantidad_total)}
              sub="QtProdutos"
              accent="#F59E0B"
            />

            <KPICard
              icon={Database}
              label="Registros"
              value={loading ? "—" : formatoNumero(metricas.registros)}
              sub="Facturas encontradas"
              accent="#131E5C"
            />
          </div>

          <section id="seccion-filtros-compras" data-html2canvas-ignore="true" className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/60">
                  <CalendarDays className="h-4 w-4" />
                  Fecha entrada desde
                </label>

                <input
                  type="date"
                  value={fechaDesde}
                  max={fechaHasta || undefined}
                  onChange={(e) => {
                    setFechaDesde(e.target.value);
                    setPagina(1);
                  }}
                  className="h-11 w-full rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-semibold text-[#07184C] outline-none transition focus:border-[#1555C7]"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/60">
                  <CalendarDays className="h-4 w-4" />
                  Fecha entrada hasta
                </label>

                <input
                  type="date"
                  value={fechaHasta}
                  min={fechaDesde || undefined}
                  onChange={(e) => {
                    setFechaHasta(e.target.value);
                    setPagina(1);
                  }}
                  className="h-11 w-full rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-semibold text-[#07184C] outline-none transition focus:border-[#1555C7]"
                />
              </div>
            </div>

            <div className="mt-5 border-t border-[#E6EAF1] pt-4">
              <div className="mb-3 flex items-center gap-2">
                <Store className="h-4 w-4 text-[#131E5C]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#131E5C]/60">
                  Agencia
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => cambiarAgencia("")}
                  className={`rounded-lg px-4 py-2 text-sm font-bold transition ${!agencia
                    ? "bg-[#131E5C] text-white"
                    : "bg-[#EEF2F8] text-[#152754] hover:bg-[#E3E9F3]"
                    }`}
                >
                  Todas
                </button>

                {opciones.agencias.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => cambiarAgencia(item)}
                    className={`rounded-lg border border-[#131E5C] px-4 py-2 text-sm font-bold transition ${agencia === item
                      ? "bg-[#131E5C] text-white"
                      : "bg-white text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                      }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-[#E6EAF1] pt-4">
              <div className="relative">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">
                  Buscar
                </label>

                <Search className="pointer-events-none absolute left-3 top-[37px] h-4 w-4 text-[#8891AD]" />

                <input
                  type="text"
                  value={qBuscado}
                  onChange={(e) => {
                    setQBuscado(e.target.value);
                    setPagina(1);
                  }}
                  placeholder="Nota, pedido, proveedor, agencia..."
                  className="h-11 w-full rounded-xl border border-[#C8D0DF] bg-[#F7F8FC] pl-10 pr-9 text-sm font-semibold text-[#1A1F3C] outline-none transition placeholder:text-[#C4CADD] focus:border-[#131E5C]/50 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10"
                />

                {qBuscado && (
                  <button
                    type="button"
                    onClick={() => {
                      setQBuscado("");
                      setPagina(1);
                    }}
                    className="absolute right-2 top-[33px] inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <AnalisisCompras
            datos={datos}
            analisis={analisisPagina}
            agencia={agencia}
            totalRegistros={totalRegistros}
            pagina={pagina}
            pageSize={pageSize}
            visible={mostrarAnalisis}
            onToggle={() => setMostrarAnalisis((prev) => !prev)}
            onAgenciaClick={cambiarAgencia}
            onProveedorClick={(proveedor) => {
              setQBuscado(proveedor);
              setPagina(1);
            }}
          />
        </div>
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
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPagina(1);
          }}
          onPrev={() => setPagina((prev) => Math.max(1, prev - 1))}
          onNext={() =>
            setPagina((prev) => Math.min(totalPaginas, prev + 1))
          }
        />
      </main>
    </div>
  );
}

function TablaFacturasExpandible({
  rows,
  loading,
  facturaAbierta,
  piezasPorFactura,
  loadingPiezas,
  errorPiezas,
  onToggle,
}) {
  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-[#C8D0DF] bg-white">
        <LoaderCircle className="h-7 w-7 animate-spin text-[#131E5C]" />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-[#C8D0DF] bg-white px-4 py-12 text-center text-sm font-semibold text-slate-400">
        No se encontraron facturas.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#C8D0DF] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#131E5C] text-white">
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

          <tbody>
            {rows.map((factura) => {
              const clave = claveFactura(factura);
              const abierta = facturaAbierta === clave;
              const detalle = piezasPorFactura[clave];
              const piezas = detalle?.results || [];
              const resumen = detalle?.resumen || {};

              return (
                <Fragment key={clave}>
                  <tr
                    className={`border-b border-[#E6EAF1] transition ${abierta ? "bg-[#F1F4FA]" : "hover:bg-[#F7F8FC]"
                      }`}
                  >
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggle(factura)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#131E5C] hover:bg-[#131E5C]/10"
                        title="Ver piezas"
                      >
                        {abierta ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    <td className="px-3 py-3 font-bold text-[#152754]">
                      {factura.agencia || "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-[#131E5C]">
                      {factura.nrnota ?? "—"}
                    </td>
                    <td className="px-3 py-3">{factura.serie || "—"}</td>
                    <td className="px-3 py-3">{factura.nrpedunpar || "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {formatoNumero(factura.qtprodutos)}
                    </td>
                    <td className="max-w-[260px] truncate px-3 py-3" title={factura.proveedor || ""}>{factura.proveedor || "—"}</td>
                    <td className="px-3 py-3 text-center">
                      {factura.dtemissao || "—"}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {factura.dtentrada || "—"}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                      {money(factura.subtotal)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">
                      {money(factura.subtotal * .16)}
                    </td>
                    <td className="px-3 py-3 text-right font-extrabold tabular-nums text-[#131E5C]">
                      {money(factura.total)}
                    </td>
                  </tr>

                  {abierta && (
                    <tr>
                      <td colSpan={12} className="bg-[#F7F8FC] p-0">
                        <div className="border-b border-[#C8D0DF] px-5 py-4">
                          {loadingPiezas[clave] && (
                            <div className="flex items-center justify-center gap-2 py-8 text-sm font-semibold text-[#8891AD]">
                              <LoaderCircle className="h-5 w-5 animate-spin text-[#131E5C]" />
                              Cargando piezas...
                            </div>
                          )}

                          {!loadingPiezas[clave] && errorPiezas[clave] && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                              {errorPiezas[clave]}
                            </div>
                          )}

                          {!loadingPiezas[clave] &&
                            !errorPiezas[clave] &&
                            detalle && (
                              <>
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <PackageSearch className="h-5 w-5 text-[#131E5C]" />
                                    <div>
                                      <div className="font-extrabold text-[#131E5C]">
                                        Piezas de factura {factura.nrnota}
                                      </div>
                                      <div className="text-xs font-semibold text-[#8891AD]">
                                        {factura.agencia}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {piezas.length ? (
                                  <div className="overflow-x-auto rounded-lg border border-[#D7DDEA] bg-white">
                                    <table className="min-w-[950px] w-full border-collapse text-[15px]">
                                      <thead className="sticky top-0 z-10">
                                        <tr className="bg-[#E9EDF5] text-[#131E5C]">
                                          <th className="px-3 py-2 text-right">
                                            #
                                          </th>
                                          <th className="px-3 py-2 text-left">
                                            Código
                                          </th>
                                          <th className="px-3 py-2 text-left">
                                            Descripción
                                          </th>
                                          <th className="px-3 py-2 text-left">
                                            Unidad
                                          </th>
                                          <th className="px-3 py-2 text-right">
                                            Cantidad
                                          </th>
                                          <th className="px-3 py-2 text-right">
                                            Unitario bruto
                                          </th>
                                          <th className="px-3 py-2 text-right">
                                            Total bruto
                                          </th>
                                          <th className="px-3 py-2 text-right">
                                            IVA
                                          </th>
                                          <th className="px-3 py-2 text-right">
                                            Total
                                          </th>
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {piezas.map((pieza) => (
                                          <tr
                                            key={
                                              pieza.rowid__ ??
                                              `${pieza.seqitem}-${pieza.prodserv}`
                                            }
                                            className="border-t border-[#E6EAF1] hover:bg-[#F7F8FC]"
                                          >
                                            <td className="px-3 py-2 text-right text-[#8891AD]">
                                              {pieza.seqitem ?? "—"}
                                            </td>
                                            <td className="px-3 py-2 font-bold text-[#131E5C]">
                                              {pieza.prodserv?.trim() || "—"}
                                            </td>
                                            <td className="px-3 py-2">
                                              {pieza.descrprod || "—"}
                                            </td>
                                            <td className="px-3 py-2">
                                              {pieza.unidade || "—"}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                              {formatoNumero(
                                                pieza.qtprodutos
                                              )}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                              {money(pieza.vrunitbruto)}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                              {money(pieza.vrliqtotal)}
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                              {money(pieza.vrliqtotal * 0.16)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-extrabold text-[#131E5C]">
                                              {money(pieza.vrliqtotal + (pieza.vrliqtotal * 0.16))}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot>
                                        <tr className="border-t-2 border-[#131E5C] bg-[#EEF2F8] text-[#131E5C]">
                                          <td
                                            colSpan={4}
                                            className="px-3 py-3 text-right font-black uppercase"
                                          >
                                            Totales
                                          </td>

                                          {/* CANTIDAD */}
                                          <td className="px-3 py-3 text-right font-black">
                                            {formatoNumero(
                                              piezas.reduce(
                                                (total, pieza) =>
                                                  total + numero(pieza.qtprodutos),
                                                0
                                              )
                                            )}
                                          </td>

                                          {/* UNITARIO BRUTO */}
                                          <td className="px-3 py-3 text-right font-black">
                                            {money(
                                              piezas.reduce(
                                                (total, pieza) =>
                                                  total + numero(pieza.vrunitbruto),
                                                0
                                              )
                                            )}
                                          </td>

                                          {/* TOTAL BRUTO */}
                                          <td className="px-3 py-3 text-right font-black">
                                            {money(
                                              piezas.reduce(
                                                (total, pieza) =>
                                                  total + numero(pieza.vrliqtotal),
                                                0
                                              )
                                            )}
                                          </td>

                                          {/* IVA */}
                                          <td className="px-3 py-3 text-right font-black">
                                            {money(
                                              piezas.reduce(
                                                (total, pieza) =>
                                                  total +
                                                  numero(pieza.vrliqtotal) * 0.16,
                                                0
                                              )
                                            )}
                                          </td>

                                          {/* TOTAL */}
                                          <td className="px-3 py-3 text-right font-black">
                                            {money(
                                              piezas.reduce(
                                                (total, pieza) =>
                                                  total +
                                                  numero(pieza.vrliqtotal) * 1.16,
                                                0
                                              )
                                            )}
                                          </td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="rounded-lg border border-dashed border-[#C8D0DF] bg-white px-4 py-8 text-center text-sm font-semibold text-[#8891AD]">
                                    No se encontraron piezas para esta factura.
                                  </div>
                                )}
                              </>
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


function AnalisisCompras({
  datos,
  analisis,
  agencia,
  totalRegistros,
  pagina,
  pageSize,
  visible,
  onToggle,
  onAgenciaClick,
  onProveedorClick,
}) {
  const inicio = totalRegistros === 0 ? 0 : (pagina - 1) * pageSize + 1;
  const fin = Math.min(pagina * pageSize, totalRegistros);
  const distribucionTotal = analisis.distribucion.reduce(
    (acc, item) => acc + numero(item.value),
    0
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-[#F8FAFC] shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#001E50] text-white">
            <BarChart3 className="h-4 w-4" />
          </span>
          <div>
            <div className="text-base font-extrabold text-[#001E50]">
              Análisis de compras
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#001E50] transition hover:bg-slate-50"
        >
          <PieChartIcon className="h-3.5 w-3.5" />
          {visible ? "Ocultar análisis" : "Mostrar análisis"}
        </button>
      </div>

      {visible && (
        <div className="space-y-4 p-3.5 md:p-4">
          {datos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm font-semibold text-slate-400">
              No hay registros visibles para generar el análisis.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <PieComprasCard
                    title={agencia ? "Facturas por proveedor" : "Importe por agencia"}
                    data={analisis.distribucion}
                    total={distribucionTotal}
                    valueFormatter={agencia ? (value) => `${formatoNumero(value)} factura${numero(value) === 1 ? "" : "s"}` : money}
                    onItemClick={agencia ? onProveedorClick : onAgenciaClick}
                  />
                </div>

                <div className="lg:col-span-7">
                  <TopProveedoresCard
                    data={analisis.proveedores}
                    maxValue={analisis.maxProveedor}
                    totalVisible={analisis.totalVisible}
                    onProveedorClick={onProveedorClick}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function PieComprasCard({
  title,
  subtitle,
  data = [],
  total = 0,
  valueFormatter = formatoNumero,
  onItemClick,
}) {
  if (!data.length || total <= 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-base font-semibold text-slate-400">
        Sin datos para graficar.
      </div>
    );
  }

  const formattedData = data.map((item, index) => ({
    ...item,
    color: PALETA_VW[index % PALETA_VW.length],
  }));

  const config = {
    data: formattedData,
    angleField: "value",
    colorField: "type",
    radius: 0.97,
    innerRadius: 0.60,

    scale: {
      color: {
        range: formattedData.map((item) => item.color),
      },
    },

    legend: false,

    label: {
      text: (d) => {
        const pct =
          total > 0
            ? (numero(d.value) / total) * 100
            : 0;

        return pct >= 5
          ? `${pct.toFixed(0)}%`
          : "";
      },
      position: "inside",
      style: {
        fontSize: 12,
        fontWeight: "bold",
        fill: "#FFFFFF",
        textAlign: "center",
      },
    },

    tooltip: {
      title: (d) => d.type,

      items: [
        (d) => {
          const pct =
            total > 0
              ? (numero(d.value) / total) * 100
              : 0;

          return {
            name: d.type,
            value: `${valueFormatter(d.value)} · ${pct.toFixed(1)}%`,
          };
        },
      ],
    },

    interaction: {
      tooltip: {
        css: {
          ".g2-tooltip": {
            background: "#FFFFFF",
            color: "#001E50",
            padding: "10px 12px",
            "border-radius": "10px",
            border: "1px solid #D7DDEA",
            "box-shadow": "0 8px 24px rgba(0, 30, 80, 0.14)",
            "font-size": "12px",
          },

          ".g2-tooltip-title": {
            color: "#001E50",
            "font-weight": "800",
          },

          ".g2-tooltip-list-item-name-label": {
            color: "#475569",
            "font-weight": "700",
          },

          ".g2-tooltip-list-item-value": {
            color: "#001E50",
            "font-weight": "800",
          },
        },
      },
    },
  };

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-base font-extrabold text-[#001E50]">
            <PieChartIcon className="h-3.5 w-3.5 text-[#1677FF]" />
            {title}
          </div>
          <div className="mt-0.5 text-[10px] font-semibold text-slate-400">
            {subtitle}
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
          {data.length} proveedores
        </span>
      </div>

      <div className="grid min-h-[235px] grid-cols-1 items-center gap-2 sm:grid-cols-2">
        <div className="max-h-[225px] space-y-1 overflow-y-auto pr-1">
          {formattedData.map((item, index) => {
            const pct = total > 0 ? (numero(item.value) / total) * 100 : 0;
            const contenido = (
              <>
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-[13px] font-bold text-[#001E50]" title={item.type}>
                    {item.type}
                  </span>
                </div>
                <div className="ml-2 flex shrink-0 items-center gap-1.5">
                  <span className="text-[12px] font-bold text-slate-600">
                    {valueFormatter(item.value)}
                  </span>
                  <span className="min-w-[42px] rounded bg-slate-100 px-1.5 py-0.5 text-right text-[12px] font-bold text-slate-500">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </>
            );

            return onItemClick ? (
              <button
                key={`${item.type}-${index}`}
                type="button"
                onClick={() => onItemClick(item.type)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
                title={`Filtrar por ${item.type}`}
              >
                {contenido}
              </button>
            ) : (
              <div
                key={`${item.type}-${index}`}
                className="flex items-center justify-between rounded-lg px-2 py-1.5"
              >
                {contenido}
              </div>
            );
          })}
        </div>

        <div className="h-[225px] min-w-0">
          <Pie {...config} />
        </div>
      </div>
    </div>
  );
}

function TopProveedoresCard({
  data = [],
  maxValue = 1,
  totalVisible = 0,
  onProveedorClick,
}) {
  const top = data.slice(0, 8);

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-base font-extrabold text-[#001E50]">
            <Store className="h-5 w-5 text-[#1677FF]" />
            Top proveedores por importe
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-bold text-slate-500">
          {data.length} proveedores
        </span>
      </div>

      <div className="max-h-[235px] space-y-2 overflow-y-auto pr-1">
        {top.length === 0 ? (
          <div className="flex h-[190px] items-center justify-center text-xs font-semibold text-slate-400">
            Sin proveedores registrados.
          </div>
        ) : (
          top.map((item, index) => {
            const width = maxValue > 0 ? (item.total / maxValue) * 100 : 0;
            const share = totalVisible > 0 ? (item.total / totalVisible) * 100 : 0;

            return (
              <button
                key={item.nombre}
                type="button"
                onClick={() => onProveedorClick(item.nombre)}
                className="block w-full rounded-xl border border-transparent px-2 py-1.5 text-left transition hover:border-slate-200 hover:bg-slate-50"
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#001E50] text-[9px] font-black text-white">
                      {index + 1}
                    </span>
                    <span className="truncate text-[12px] font-bold text-[#001E50]" title={item.nombre}>
                      {item.nombre}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[13px] font-bold text-slate-700">
                      {item.facturas} fact. · {share.toFixed(1)}%
                      <span className="h-3.5 m-2 bg-slate-700" />
                      {money(item.total)}
                    </div>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#001E50] transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(3, width))}%` }}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function Paginacion({
  pagina,
  totalPaginas,
  total,
  pageSize,
  onPageSizeChange,
  onPrev,
  onNext,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#C8D0DF] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-semibold text-[#8891AD]">
        {formatoNumero(total)} registros · Página{" "}
        <span className="font-black text-[#131E5C]">{pagina}</span> de{" "}
        <span className="font-black text-[#131E5C]">{totalPaginas}</span>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-9 rounded-lg border border-[#C8D0DF] bg-white px-2 text-sm font-bold text-[#131E5C]"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>

        <button
          type="button"
          onClick={onPrev}
          disabled={pagina <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#C8D0DF] px-3 text-sm font-bold text-[#131E5C] disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={pagina >= totalPaginas}
          className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#131E5C] px-3 text-sm font-bold text-white disabled:opacity-40"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, sub, accent }) {
  const Icon = icon;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
      style={{ borderColor: "#E7EAF3" }}
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full opacity-[0.12]"
        style={{ backgroundColor: accent }}
      />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${accent}1A`,
              color: accent,
            }}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>

          <span className="truncate text-xs font-bold uppercase tracking-wide text-[#8891AD]">
            {label}
          </span>
        </div>

        <div
          className="mt-3 truncate text-[26px] font-black leading-none text-[#131E5C]"
          title={String(value)}
        >
          {value}
        </div>

        {sub && (
          <div
            className="mt-2 truncate text-[11px] font-semibold"
            style={{ color: accent }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function DetalleBadge({ label, value }) {
  return (
    <div className="rounded-lg border border-[#D7DDEA] bg-white px-3 py-2">
      <div className="text-[9px] font-black uppercase tracking-wider text-[#8891AD]">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-extrabold text-[#131E5C]">
        {value}
      </div>
    </div>
  );
}