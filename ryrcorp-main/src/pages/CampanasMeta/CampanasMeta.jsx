import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  ComposedChart, Area,
} from "recharts";
import {
  BarChart2,
  TableProperties,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
} from "lucide-react";
import ExcelJS from "exceljs";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

// CONSTANTES 
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MESES_CORTOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const SEMANAS = Array.from({ length: 52 }, (_, i) => i + 1);
const CHART_COLORS = ["#378ADD", "#1D9E75", "#D85A30", "#7F77DD", "#D4537E", "#F0A500", "#00B8D9"];
const NAVY = "#131E5C";

// ─── GRUPOS DE DEALERS POR CIUDAD ───────────────────────────────────────────
// Los valores del array deben coincidir EXACTAMENTE con el campo "sucursal"
// que llega del backend. Si hay diferencia de mayúsculas o acentos, ajústalos.
const GRUPOS_DEALER = {
  "Córdoba": ["Cordoba", "Comerciales Cordoba", "Seminuevos Cordoba"],
  "Orizaba": ["Orizaba", "Comerciales Orizaba", "Seminuevos Orizaba"],
  "Poza Rica": ["Poza Rica"],
  "Tuxtepec": ["Tuxtepec", "Seminuevos Tuxtepec"],
  "Tuxpan": ["Tuxpan"],
};
// ────────────────────────────────────────────────────────────────────────────

const API_BASE = (
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com"
).replace(/\/$/, "");

const META_ENDPOINT = `${API_BASE}/campanas-meta/api/campanas-meta`;

const ANIO_ACTUAL = String(new Date().getFullYear());
const MES_ACTUAL = String(new Date().getMonth() + 1);

function parseFechaLocal(fecha) {
  if (!fecha) return null;
  const partes = String(fecha).split("-").map(Number);
  if (partes.length < 3) return null;
  const [anio, mes, dia] = partes;
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia);
}

function obtenerSemana(fecha) {
  const date = parseFechaLocal(fecha);
  if (!date) return 0;
  const inicio = new Date(date.getFullYear(), 0, 1);
  const dias = Math.floor((date - inicio) / 86400000);
  return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

function numeroSeguro(valor) {
  const numero = Number(valor ?? 0);
  return Number.isFinite(numero) ? numero : 0;
}

function decimalSeguro(valor) {
  const numero = parseFloat(valor ?? 0);
  return Number.isFinite(numero) ? numero : 0;
}

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obtenerCanalPorNombreCampana(nombreCampana) {
  const nombre = normalizarTexto(nombreCampana);
  if (/\b(comercial|comerciales)\b/.test(nombre)) return "Comerciales";
  if (/\b(seminuevo|seminuevos|semi nuevos|usado|usados)\b/.test(nombre)) return "Usados";
  if (/\b(postventa|postventas)\b/.test(nombre)) return "PostVenta";
  return "Nuevos";
}

function mapearCampana(c) {
  const fechaBase = c.inicio_campana || c.inicio_informe;
  const fecha = parseFechaLocal(fechaBase);
  const nombreCampana = c.nombre_campana ?? "Sin nombre";
  return {
    id_campana: String(c.id_campana),
    nombre_campana: nombreCampana,
    canal: obtenerCanalPorNombreCampana(nombreCampana),
    sucursal: c.sucursal ?? "—",
    estado_campana: c.estado_campana ?? "Sin estado",
    año: fecha ? fecha.getFullYear() : 0,
    mes: fecha ? fecha.getMonth() + 1 : 0,
    semana: obtenerSemana(fechaBase),
    alcance: numeroSeguro(c.alcance),
    impresiones: numeroSeguro(c.impresiones),
    importe_gastado: decimalSeguro(c.importe_gastado),
    total_resultados: numeroSeguro(c.total_resultados),
    id_concesionaria: c.id_concesionaria,
    objetivo_campana: c.objetivo_campana,
    inicio_campana: c.inicio_campana,
    fin_campana: c.fin_campana,
    inicio_informe: c.inicio_informe,
    fin_informe: c.fin_informe,
  };
}

function esFiltroVacio(valor) {
  return !valor || valor === "Todos" || valor === "Todas";
}

function construirQueryCampanas({ anio, mes, sucursal }) {
  const params = new URLSearchParams();
  if (!esFiltroVacio(anio)) params.set("anio", anio);
  if (!esFiltroVacio(mes)) params.set("mes", mes);
  if (!esFiltroVacio(sucursal)) params.set("sucursal", sucursal);
  params.set("ordering", "-inicio_informe");
  return params.toString();
}

const ESTADO_STYLES = {
  Activa: "bg-emerald-100 text-emerald-700",
  Pausada: "bg-amber-100 text-amber-700",
  Finalizada: "bg-gray-100 text-gray-500",
};

function agg(arr) {
  return arr.reduce((a, c) => ({
    alcance: a.alcance + c.alcance,
    impresiones: a.impresiones + c.impresiones,
    importe_gastado: a.importe_gastado + c.importe_gastado,
    total_resultados: a.total_resultados + c.total_resultados,
    count: a.count + 1,
  }), { alcance: 0, impresiones: 0, importe_gastado: 0, total_resultados: 0, count: 0 });
}

function pct(a, b) { if (!b) return null; return ((a - b) / b * 100).toFixed(1); }


function limpiarNombreArchivo(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function obtenerSelloFecha() {
  const ahora = new Date();
  const dos = (valor) => String(valor).padStart(2, "0");
  return `${ahora.getFullYear()}${dos(ahora.getMonth() + 1)}${dos(ahora.getDate())}_${dos(ahora.getHours())}${dos(ahora.getMinutes())}`;
}

function crearNombreReporte({ periodo, dealer, extension }) {
  const periodoLimpio = limpiarNombreArchivo(periodo) || "todos_los_periodos";
  const dealerLimpio = limpiarNombreArchivo(dealer) || "todos_los_dealers";
  return `reporte_meta_ads_${periodoLimpio}_${dealerLimpio}_${obtenerSelloFecha()}.${extension}`;
}

function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function esperarRenderCompleto() {
  if (document.fonts?.ready) await document.fonts.ready;

  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  // Permite que ResponsiveContainer/Recharts termine de medir y pintar sus SVG.
  await new Promise((resolve) => setTimeout(resolve, 250));
}

function aplicarEstiloTituloExcel(celda) {
  celda.font = { name: "Arial", size: 20, bold: true, color: { argb: "FFFFFFFF" } };
  celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF131E5C" } };
  celda.alignment = { vertical: "middle", horizontal: "left" };
}

function agregarHojaResumenExcel(workbook, {
  filtrosReporte,
  totales,
  cantidadRegistros,
  modoComp,
  labelA,
  labelB,
  totalesComparacion,
  cantidadComparacion,
}) {
  const hoja = workbook.addWorksheet("Resumen", {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
  });

  hoja.columns = [
    { width: 24 }, { width: 24 }, { width: 4 }, { width: 24 },
    { width: 24 }, { width: 4 }, { width: 24 }, { width: 24 },
  ];

  hoja.mergeCells("A1:H2");
  hoja.getCell("A1").value = "Reporte de Marketing | META ADS";
  aplicarEstiloTituloExcel(hoja.getCell("A1"));
  hoja.getRow(1).height = 28;
  hoja.getRow(2).height = 16;

  hoja.mergeCells("A3:H3");
  hoja.getCell("A3").value = `Generado: ${new Date().toLocaleString("es-MX")}`;
  hoja.getCell("A3").font = { italic: true, color: { argb: "FF6B7280" } };

  hoja.getCell("A5").value = "Filtros aplicados";
  hoja.getCell("A5").font = { bold: true, size: 13, color: { argb: "FF131E5C" } };

  filtrosReporte.forEach((filtro, indice) => {
    const fila = 6 + indice;
    hoja.getCell(`A${fila}`).value = filtro.etiqueta;
    hoja.getCell(`A${fila}`).font = { bold: true, color: { argb: "FF374151" } };
    hoja.getCell(`B${fila}`).value = filtro.valor;
    hoja.mergeCells(`B${fila}:D${fila}`);
    hoja.getCell(`B${fila}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
    hoja.getCell(`B${fila}`).alignment = { vertical: "middle" };
  });

  const filaKpi = 6;
  const kpis = [
    ["Campañas", cantidadRegistros, "FF378ADD"],
    ["Alcance total", totales.alcance, "FF1D9E75"],
    ["Impresiones", totales.impresiones, "FF7F77DD"],
    ["Gasto total", totales.importe_gastado, "FFD85A30"],
    ["Resultados", totales.total_resultados, "FF131E5C"],
  ];

  hoja.getCell(`F5`).value = modoComp ? `Resumen ${labelA}` : "Resumen del período";
  hoja.getCell(`F5`).font = { bold: true, size: 13, color: { argb: "FF131E5C" } };

  kpis.forEach(([etiqueta, valor, color], indice) => {
    const fila = filaKpi + indice;
    hoja.getCell(`F${fila}`).value = etiqueta;
    hoja.getCell(`F${fila}`).font = { bold: true, color: { argb: "FF374151" } };
    hoja.getCell(`G${fila}`).value = valor;
    hoja.mergeCells(`G${fila}:H${fila}`);
    hoja.getCell(`G${fila}`).font = { bold: true, color: { argb: color } };
    hoja.getCell(`G${fila}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } };
    hoja.getCell(`G${fila}`).alignment = { horizontal: "right" };
  });

  hoja.getCell("G7").numFmt = "#,##0";
  hoja.getCell("G8").numFmt = "#,##0";
  hoja.getCell("G9").numFmt = '$#,##0.00';
  hoja.getCell("G10").numFmt = "#,##0";

  if (modoComp) {
    const inicio = 13;
    hoja.mergeCells(`A${inicio}:H${inicio}`);
    hoja.getCell(`A${inicio}`).value = `Comparación: ${labelA} vs ${labelB}`;
    hoja.getCell(`A${inicio}`).font = { bold: true, size: 13, color: { argb: "FF131E5C" } };

    const comparacion = [
      ["Campañas", cantidadRegistros, cantidadComparacion],
      ["Alcance", totales.alcance, totalesComparacion.alcance],
      ["Impresiones", totales.impresiones, totalesComparacion.impresiones],
      ["Gasto", totales.importe_gastado, totalesComparacion.importe_gastado],
      ["Resultados", totales.total_resultados, totalesComparacion.total_resultados],
    ];

    hoja.getRow(inicio + 1).values = ["Métrica", labelA, labelB, "Variación %"];
    ["A", "B", "C", "D"].forEach((columna) => {
      const celda = hoja.getCell(`${columna}${inicio + 1}`);
      celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
      celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF131E5C" } };
      celda.alignment = { horizontal: "center" };
    });

    comparacion.forEach(([metrica, valorA, valorB], indice) => {
      const fila = inicio + 2 + indice;
      hoja.getCell(`A${fila}`).value = metrica;
      hoja.getCell(`B${fila}`).value = valorA;
      hoja.getCell(`C${fila}`).value = valorB;
      hoja.getCell(`D${fila}`).value = valorB ? (valorA - valorB) / valorB : null;
      hoja.getCell(`D${fila}`).numFmt = "0.0%";
      ["B", "C"].forEach((columna) => {
        hoja.getCell(`${columna}${fila}`).numFmt = metrica === "Gasto" ? '$#,##0.00' : "#,##0";
      });
    });
  }

  return hoja;
}

function agregarHojaDatosExcel(workbook, nombreHoja, nombreTabla, datos, etiquetaPeriodo) {
  const hoja = workbook.addWorksheet(nombreHoja, {
    views: [{ state: "frozen", ySplit: 1 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  const columnas = [
    { name: "Campaña", width: 42, value: (c) => c.nombre_campana },
    { name: "Dealer", width: 24, value: (c) => c.sucursal },
    { name: "Canal", width: 16, value: (c) => c.canal },
    { name: "Estado", width: 16, value: (c) => c.estado_campana },
    { name: "Año", width: 10, value: (c) => c.año },
    { name: "Mes", width: 14, value: (c) => MESES[c.mes - 1] ?? c.mes },
    { name: "Semana", width: 11, value: (c) => c.semana },
    { name: "Alcance", width: 16, value: (c) => c.alcance },
    { name: "Impresiones", width: 16, value: (c) => c.impresiones },
    { name: "Gasto ($)", width: 16, value: (c) => c.importe_gastado },
    { name: "Resultados", width: 14, value: (c) => c.total_resultados },
    { name: "Objetivo", width: 24, value: (c) => c.objetivo_campana ?? "" },
    { name: "Inicio campaña", width: 17, value: (c) => c.inicio_campana ?? "" },
    { name: "Fin campaña", width: 17, value: (c) => c.fin_campana ?? "" },
    { name: "Inicio informe", width: 17, value: (c) => c.inicio_informe ?? "" },
    { name: "Fin informe", width: 17, value: (c) => c.fin_informe ?? "" },
  ];

  hoja.columns = columnas.map((columna, indice) => ({ key: `col_${indice}`, width: columna.width }));
  hoja.addTable({
    name: nombreTabla,
    ref: "A1",
    headerRow: true,
    totalsRow: false,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: columnas.map((columna) => ({ name: columna.name, filterButton: true })),
    rows: datos.map((campana) => columnas.map((columna) => columna.value(campana))),
  });

  hoja.getColumn(8).numFmt = "#,##0";
  hoja.getColumn(9).numFmt = "#,##0";
  hoja.getColumn(10).numFmt = '$#,##0.00';
  hoja.getColumn(11).numFmt = "#,##0";
  hoja.properties.defaultRowHeight = 19;
  hoja.headerFooter.oddHeader = `&L&16&B${etiquetaPeriodo}&R&D`;
  hoja.headerFooter.oddFooter = "&LReporte META ADS&RPágina &P de &N";

  return hoja;
}

function agregarHojaGraficasExcel(workbook, canvas, filtrosReporte) {
  const hoja = workbook.addWorksheet("Gráficas", {
    views: [{ showGridLines: false, zoomScale: 70 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  hoja.getCell("A1").value = "Reporte visual de gráficas";
  hoja.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF131E5C" } };
  hoja.getCell("A2").value = filtrosReporte.map((f) => `${f.etiqueta}: ${f.valor}`).join(" | ");
  hoja.getCell("A2").font = { color: { argb: "FF6B7280" }, italic: true };

  const base64 = canvas.toDataURL("image/png");
  const imageId = workbook.addImage({ base64, extension: "png" });
  const ancho = 1200;
  const alto = Math.round((canvas.height / canvas.width) * ancho);

  hoja.addImage(imageId, {
    tl: { col: 0, row: 3 },
    ext: { width: ancho, height: alto },
  });

  for (let i = 1; i <= 18; i += 1) hoja.getColumn(i).width = 11;
  return hoja;
}

function agregarCanvasPaginadoPdf(doc, canvas) {
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
}

function agregarTablaPdf(doc, datos, titulo) {
  doc.addPage("a4", "landscape");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(19, 30, 92);
  doc.text(titulo, 10, 12);

  autoTable(doc, {
    startY: 17,
    head: [["Campaña", "Dealer", "Canal", "Estado", "Año", "Mes", "Alcance", "Impresiones", "Gasto ($)", "Resultados"]],
    body: datos.map((c) => [
      c.nombre_campana,
      c.sucursal,
      c.canal,
      c.estado_campana,
      c.año,
      MESES[c.mes - 1] ?? c.mes,
      c.alcance.toLocaleString("es-MX"),
      c.impresiones.toLocaleString("es-MX"),
      c.importe_gastado.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      c.total_resultados.toLocaleString("es-MX"),
    ]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 6.5,
      cellPadding: 1.4,
      overflow: "linebreak",
      valign: "middle",
      textColor: [55, 65, 81],
      lineColor: [229, 231, 235],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [19, 30, 92],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 52 },
      1: { cellWidth: 28 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 13, halign: "center" },
      5: { cellWidth: 19 },
      6: { cellWidth: 23, halign: "right" },
      7: { cellWidth: 23, halign: "right" },
      8: { cellWidth: 23, halign: "right" },
      9: { cellWidth: 20, halign: "right" },
    },
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
}

function Delta({ val }) {
  if (val === null) return null;
  const pos = parseFloat(val) >= 0;
  return <span className={`text-xs font-medium ml-1 ${pos ? "text-emerald-600" : "text-red-500"}`}>
    {pos ? "▲" : "▼"} {Math.abs(val)}%
  </span>;
}

function StatCard({ label, value, sub, delta, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ backgroundColor: color ?? NAVY }} />
      <p className="text-[11px] text-gray-500 mb-1 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}<Delta val={delta} /></p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const TooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,.08)" };

function VistaTabla({ datos }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: NAVY }} className="text-white text-left">
            {["Campaña", "Dealer", "Canal", "Estado", "Año", "Mes", "Alcance", "Impresiones", "Gasto ($)", "Resultados"].map(h => (
              <th key={h} className={`px-4 py-3 font-medium ${["Alcance", "Impresiones", "Gasto ($)", "Resultados"].includes(h) ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.map((c, i) => (
            <tr key={c.id_campana} className={`border-t border-gray-100 hover:bg-blue-50/40 transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
              <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{c.nombre_campana}</td>
              <td className="px-4 py-3 text-gray-600">{c.sucursal}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.canal === "Nuevos" ? "bg-blue-100 text-blue-700" : c.canal === "Usados" ? "bg-violet-100 text-violet-700" : c.canal === "Comerciales" ? "bg-orange-100 text-orange-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {c.canal}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_STYLES[c.estado_campana] ?? "bg-gray-100 text-gray-600"}`}>
                  {c.estado_campana ?? "—"}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{c.año}</td>
              <td className="px-4 py-3 text-gray-600">{MESES[c.mes - 1]}</td>
              <td className="px-4 py-3 text-right text-gray-700">{c.alcance.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-gray-700">{c.impresiones.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-gray-700">${c.importe_gastado.toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-gray-700">{c.total_resultados}</td>
            </tr>
          ))}
          {datos.length === 0 && (
            <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">Sin resultados para los filtros seleccionados</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const CustomBarLabel = (props) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 4} fill="#1e3a8a" fontSize={10} fontWeight="600" textAnchor="middle">
      {value.toLocaleString()}
    </text>
  );
};

function VistaGraficas({ datos, datosComp, modoComp, labelA, labelB }) {
  const porCampana = [...datos]
    .sort((a, b) => b.total_resultados - a.total_resultados)
    .slice(0, 10)
    .map(c => ({
      name: c.nombre_campana.length > 12 ? c.nombre_campana.substring(0, 12) + "…" : c.nombre_campana,
      full: c.nombre_campana,
      alcance: c.alcance,
      impresiones: c.impresiones,
      gasto: c.importe_gastado,
      resultados: c.total_resultados,
    }));

  const buildSerie = (arr) => {
    const map = {};
    arr.forEach(c => {
      const k = `${MESES[c.mes - 1].slice(0, 3)} ${c.año}`;
      if (!map[k]) map[k] = { mes: k, alcance: 0, impresiones: 0, gasto: 0, resultados: 0 };
      map[k].alcance += c.alcance; map[k].impresiones += c.impresiones;
      map[k].gasto += c.importe_gastado; map[k].resultados += c.total_resultados;
    });
    return Object.values(map);
  };

  const serieA = buildSerie(datos);
  const serieB = modoComp ? buildSerie(datosComp) : [];

  const serieComp = useMemo(() => {
    if (!modoComp) return serieA;
    const keysA = serieA.map(s => s.mes);
    const keysB = serieB.map(s => s.mes);
    const allKeys = Array.from(new Set([...keysA, ...keysB]));
    return allKeys.map(k => ({
      mes: k,
      [`alcance_${labelA}`]: serieA.find(s => s.mes === k)?.alcance ?? 0,
      [`alcance_${labelB}`]: serieB.find(s => s.mes === k)?.alcance ?? 0,
      [`gasto_${labelA}`]: serieA.find(s => s.mes === k)?.gasto ?? 0,
      [`gasto_${labelB}`]: serieB.find(s => s.mes === k)?.gasto ?? 0,
    }));
  }, [serieA, serieB, modoComp, labelA, labelB]);

  const porSucursal = useMemo(() => {
    const map = {};
    datos.forEach(c => {
      if (!map[c.sucursal]) map[c.sucursal] = { name: c.sucursal, gasto: 0, alcance: 0 };
      map[c.sucursal].gasto += c.importe_gastado;
      map[c.sucursal].alcance += c.alcance;
    });
    return Object.values(map);
  }, [datos]);

  const estatusPauta = useMemo(() => {
    const map = {};
    datos.forEach(c => {
      const k = c.estado_campana || "Sin estado";
      if (!map[k]) map[k] = { name: k, value: 0 };
      map[k].value++;
    });
    return Object.values(map);
  }, [datos]);

  const rendimientoPorCanal = useMemo(() => {
    const ordenCanales = ["Nuevos", "Usados", "Comerciales", "PostVenta"];
    const map = {};
    datos.forEach((c) => {
      const canal = c.canal || "Sin canal";
      if (!map[canal]) map[canal] = { canal, gasto: 0, resultados: 0, alcance: 0, impresiones: 0, campanas: 0 };
      map[canal].gasto += c.importe_gastado;
      map[canal].resultados += c.total_resultados;
      map[canal].alcance += c.alcance;
      map[canal].impresiones += c.impresiones;
      map[canal].campanas += 1;
    });
    return Object.values(map)
      .map((item) => ({
        ...item,
        costo_por_resultado: item.resultados > 0 ? item.gasto / item.resultados : 0,
        costo_por_mil_alcance: item.alcance > 0 ? (item.gasto / item.alcance) * 1000 : 0,
      }))
      .sort((a, b) => {
        const ia = ordenCanales.indexOf(a.canal);
        const ib = ordenCanales.indexOf(b.canal);
        if (ia === -1 && ib === -1) return a.canal.localeCompare(b.canal);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
  }, [datos]);

  const ESTATUS_COLORS = { Activa: "#378ADD", Finalizada: "#1D9E75", Pausada: "#F0A500" };

  const cronograma = useMemo(() => {
    return [...datos].sort((a, b) => a.mes - b.mes).slice(0, 8).map(c => ({
      nombre: c.nombre_campana.length > 22 ? c.nombre_campana.substring(0, 22) + "…" : c.nombre_campana,
      resultados: c.total_resultados,
      inicio: c.inicio_campana ? new Date(c.inicio_campana).getDate() : 1,
      fin: c.fin_campana ? new Date(c.fin_campana).getDate() : 15,
      mes: c.mes,
      estado: c.estado_campana,
    }));
  }, [datos]);

  const totResultados = datos.reduce((a, c) => a + c.total_resultados, 0);
  const totGasto = datos.reduce((a, c) => a + c.importe_gastado, 0);
  const totAlcance = datos.reduce((a, c) => a + c.alcance, 0);
  const totImpresiones = datos.reduce((a, c) => a + c.impresiones, 0);

  const pautasPeriodo = porCampana.map((c) => ({
    ...c,
    msg2: Math.round(c.resultados * 0.65),
    msg3: Math.round(c.resultados * 0.42),
    msg5: Math.round(c.resultados * 0.22),
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[14px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Total de Impresiones</p>
          <p className="text-[12px] text-gray-400 mb-2">Cantidad de visualizaciones en social media</p>
          <p className="text-2xl font-bold" style={{ color: NAVY }}>{(totImpresiones / 1000).toFixed(3)} mil</p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-[14px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Total de Alcance</p>
            <p className="text-[12px] text-gray-400 mb-2">Cantidad de cuentas que visualizaron el contenido</p>
            <p className="text-2xl font-bold" style={{ color: NAVY }}>{(totAlcance / 1000).toFixed(3)} mil</p>
          </div>
        </div>

        <div className="rounded-xl p-4 flex flex-col justify-between" style={{ backgroundColor: NAVY }}>
          <div>
            <p className="text-[20px] text-blue-200 uppercase tracking-wide font-semibold mb-1">Resultados</p>
            <p className="text-[14px] text-blue-300 mb-3">Interesados contactando de forma más directa</p>
          </div>
          <p className="text-5xl font-black text-white">{totResultados}</p>
        </div>

        <div className="rounded-xl p-4 flex flex-col justify-between" style={{ backgroundColor: NAVY }}>
          <div>
            <p className="text-[20px] text-blue-200 uppercase tracking-wide font-semibold mb-1">Inversión</p>
            <p className="text-[14px] text-blue-300 mb-3">Dinero invertido en pautas en redes sociales</p>
          </div>
          <p className="text-4xl font-black text-white">${totGasto.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[14px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Estatus de la Pauta</p>
          <p className="text-[12px] text-gray-400 mb-2">Relación de Completadas, Pausadas y Activas</p>
          <ResponsiveContainer width="100%" height={90}>
            <PieChart>
              <Pie data={estatusPauta} dataKey="value" cx="50%" cy="50%" outerRadius={42} innerRadius={24}>
                {estatusPauta.map((e, idx) => (
                  <Cell key={idx} fill={ESTATUS_COLORS[e.name] ?? CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {estatusPauta.map((e, idx) => (
              <div key={e.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ESTATUS_COLORS[e.name] ?? CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="text-gray-600">{e.name}</span>
                </div>
                <span className="font-bold text-gray-700">{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
          <p className="text-lg font-bold mb-1" style={{ color: NAVY }}>Pautas del Período</p>
          <p className="text-[14px] text-gray-400 mb-4">En relación a la cantidad de resultados generados en META</p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={pautasPeriodo} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#6b7280" }} interval={0} angle={-30} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
              <Tooltip contentStyle={TooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
              <Bar dataKey="resultados" name="Total de Resultados" fill={NAVY} radius={[3, 3, 0, 0]} label={<CustomBarLabel />} />
              <Line type="monotone" dataKey="msg2" stroke="#378ADD" name="+ 2 mensajes" dot={{ r: 3 }} strokeWidth={2} />
              <Line type="monotone" dataKey="msg3" stroke="#1D9E75" name="+ 3 mensajes" dot={{ r: 3 }} strokeWidth={2} />
              <Line type="monotone" dataKey="msg5" stroke="#D4537E" name="+ 5 mensajes" dot={{ r: 3 }} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-lg font-bold mb-1" style={{ color: NAVY }}>Gasto por Dealer</p>
          <p className="text-[14px] text-gray-400 mb-4">Distribución de inversión</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={porSucursal} dataKey="gasto" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={38}>
                {porSucursal.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => [`$${v.toFixed(2)}`, "Gasto"]} contentStyle={TooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {porSucursal.map((s, idx) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="text-gray-600">{s.name}</span>
                </div>
                <span className="font-semibold text-gray-700">${s.gasto.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col gap-1 mb-4">
          <p className="text-lg font-bold" style={{ color: NAVY }}>Rendimiento por Canal</p>
          <p className="text-[14px] text-gray-400">Comparativa de inversión total y costo por resultado entre Nuevos, Usados y Comerciales</p>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={rendimientoPorCanal} margin={{ top: 20, right: 15, left: -5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="canal" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(value) => `$${Number(value).toFixed(0)}`} />
            <Tooltip contentStyle={TooltipStyle} formatter={(value, name) => {
              const numero = Number(value || 0);
              if (name === "Costo por resultado") return [`$${numero.toFixed(2)}`, name];
              if (name === "Inversión total") return [`$${numero.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, name];
              return [numero.toLocaleString(), name];
            }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="gasto" name="Inversión total" fill={NAVY} radius={[5, 5, 0, 0]} barSize={42} />
            <Line yAxisId="right" type="monotone" dataKey="costo_por_resultado" name="Costo por resultado" stroke="#D85A30" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {rendimientoPorCanal.map((item) => (
            <div key={item.canal} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-lg font-bold mb-1" style={{ color: NAVY }}>{item.canal}</p>
              <div className="space-y-1 text-[14px] text-gray-500">
                <div className="flex justify-between gap-3"><span>Campañas</span><span className="font-semibold text-gray-700">{item.campanas}</span></div>
                <div className="flex justify-between gap-3"><span>Resultados</span><span className="font-semibold text-gray-700">{item.resultados}</span></div>
                <div className="flex justify-between gap-3"><span>Inversión</span><span className="font-semibold text-gray-700">${item.gasto.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between gap-3"><span>Costo / resultado</span><span className="font-bold" style={{ color: NAVY }}>${item.costo_por_resultado.toFixed(2)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-lg font-bold mb-1" style={{ color: NAVY }}>Cronograma de Pautas</p>
        <p className="text-[14px] text-gray-400 mb-4">Fechas de inicio y final de la programación de las pautas</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-600 w-52">nombre_campana</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600 w-20">total_resultados</th>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <th key={d} className="text-center py-2 px-1 font-medium text-gray-400 min-w-[28px]">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cronograma.map((c, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 px-3 font-medium text-gray-700">{c.nombre}</td>
                  <td className="py-2 px-3 text-right font-bold" style={{ color: NAVY }}>{c.resultados}</td>
                  {Array.from({ length: 31 }, (_, w) => {
                    const dia = w + 1;
                    const inRange = dia >= c.inicio && dia <= c.fin;
                    const ESTATUS_COLORS = { Activa: "#378ADD", Finalizada: "#1D9E75", Pausada: "#F0A500" };
                    const color = ESTATUS_COLORS[c.estado] ?? "#378ADD";
                    return (
                      <td key={w} className="py-2 px-1">
                        {inRange ? <div className="h-5 rounded-sm mx-0.5" style={{ backgroundColor: color, opacity: 0.85 }} /> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-lg font-bold mb-1" style={{ color: NAVY }}>
          Evolución de Alcance {modoComp ? `— ${labelA} vs ${labelB}` : "Mensual"}
        </p>
        <p className="text-[14px] text-gray-400 mb-4">Comparativa acumulada por mes</p>
        <ResponsiveContainer width="100%" height={240}>
          {modoComp ? (
            <ComposedChart data={serieComp} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip contentStyle={TooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={`alcance_${labelA}`} fill="#378ADD" name={`Alcance ${labelA}`} radius={[4, 4, 0, 0]} opacity={0.85} />
              <Bar dataKey={`alcance_${labelB}`} fill="#D85A30" name={`Alcance ${labelB}`} radius={[4, 4, 0, 0]} opacity={0.85} />
              <Line type="monotone" dataKey={`gasto_${labelA}`} stroke="#1D9E75" name={`Gasto ${labelA}`} dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey={`gasto_${labelB}`} stroke="#7F77DD" name={`Gasto ${labelB}`} dot={false} strokeWidth={2} strokeDasharray="5 3" />
            </ComposedChart>
          ) : (
            <ComposedChart data={serieA} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip contentStyle={TooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="alcance" fill="#EBF3FD" stroke="#378ADD" name="Alcance" strokeWidth={2} />
              <Line type="monotone" dataKey="gasto" stroke="#D85A30" name="Gasto ($)" dot={false} strokeWidth={2} />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {modoComp && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-bold mb-4" style={{ color: NAVY }}>Comparación de Gasto — {labelA} vs {labelB}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={serieComp} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip formatter={v => [`$${v.toFixed(2)}`]} contentStyle={TooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey={`gasto_${labelA}`} fill="#378ADD" name={`Gasto ${labelA}`} radius={[4, 4, 0, 0]} />
              <Bar dataKey={`gasto_${labelB}`} fill="#D85A30" name={`Gasto ${labelB}`} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function CampanasMeta() {
  const [vista, setVista] = useState("tabla");

  // Filtros principales
  const [año, setAño] = useState(ANIO_ACTUAL);
  const [mes, setMes] = useState("Todos");
  const [semana, setSemana] = useState("Todas");
  const [sucursal, setSucursal] = useState("Todas");

  // ── NUEVO: ciudad seleccionada en el filtro de dealers ──
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState("Todas");

  // Modo comparación
  const [modoComp, setModoComp] = useState(false);
  const [tipoComp, setTipoComp] = useState("meses");
  const [compA, setCompA] = useState(`${ANIO_ACTUAL}-${MES_ACTUAL}`);
  const [compB, setCompB] = useState(`${Number(ANIO_ACTUAL) - 1}-${MES_ACTUAL}`);

  // Datos del backend
  const [DATOS_RAW, setDatosRaw] = useState([]);
  const [datosAComp, setDatosAComp] = useState([]);
  const [datosBComp, setDatosBComp] = useState([]);

  const [opciones, setOpciones] = useState({
    sucursales: [],
    estados_campana: [],
    concesionarias: [],
    anios: [],
    anio_mes: [],
    meses_por_anio: {},
  });

  const [loadingOpciones, setLoadingOpciones] = useState(true);
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingComp, setLoadingComp] = useState(false);
  const [error, setError] = useState(null);

  const cacheRef = useRef(new Map());
  const reporteVisualRef = useRef(null);
  const [exportando, setExportando] = useState(null);
  const [errorExportacion, setErrorExportacion] = useState(null);

  const cargarCampanas = useCallback(async (filtros, signal) => {
    const query = construirQueryCampanas(filtros);
    const cacheKey = query || "sin-filtros";
    if (cacheRef.current.has(cacheKey)) return cacheRef.current.get(cacheKey);
    const url = `${META_ENDPOINT}/ligero/${query ? `?${query}` : ""}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Error al cargar campañas: ${res.status}`);
    const data = await res.json();
    const lista = Array.isArray(data) ? data : data.results ?? [];
    const mapeado = lista.map(mapearCampana);
    cacheRef.current.set(cacheKey, mapeado);
    return mapeado;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function cargarOpciones() {
      try {
        setLoadingOpciones(true);
        const res = await fetch(`${META_ENDPOINT}/opciones/`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Error al cargar opciones: ${res.status}`);
        const data = await res.json();
        setOpciones({
          sucursales: Array.isArray(data.sucursales) ? data.sucursales : [],
          estados_campana: Array.isArray(data.estados_campana) ? data.estados_campana : [],
          concesionarias: Array.isArray(data.concesionarias) ? data.concesionarias : [],
          anios: Array.isArray(data.anios) ? data.anios : [],
          anio_mes: Array.isArray(data.anio_mes) ? data.anio_mes : [],
          meses_por_anio: data.meses_por_anio && typeof data.meses_por_anio === "object" ? data.meses_por_anio : {},
        });
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoadingOpciones(false);
      }
    }
    cargarOpciones();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function cargarDatosBase() {
      try {
        setLoadingBase(true);
        setError(null);
        // Si hay ciudad seleccionada le pedimos "Todas" al backend y filtramos en frontend
        const sucursalQuery = sucursal.startsWith("__grupo__") ? "Todas" : sucursal;
        const datos = await cargarCampanas({ anio: año, mes, sucursal: sucursalQuery }, controller.signal);
        setDatosRaw(datos);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoadingBase(false);
      }
    }
    cargarDatosBase();
    return () => controller.abort();
  }, [año, mes, sucursal, cargarCampanas]);

  const filtrosDesdeComparacion = useCallback((key) => {
    const sucursalQuery = sucursal.startsWith("__grupo__") ? "Todas" : sucursal;
    if (tipoComp === "años") return { anio: key, mes: "Todos", sucursal: sucursalQuery };
    const [anio, mesComp] = String(key).split("-");
    return { anio, mes: mesComp, sucursal: sucursalQuery };
  }, [tipoComp, sucursal]);

  useEffect(() => {
    if (!modoComp) { setDatosAComp([]); setDatosBComp([]); return; }
    const controller = new AbortController();
    async function cargarComparacion() {
      try {
        setLoadingComp(true);
        setError(null);
        const [a, b] = await Promise.all([
          cargarCampanas(filtrosDesdeComparacion(compA), controller.signal),
          cargarCampanas(filtrosDesdeComparacion(compB), controller.signal),
        ]);
        setDatosAComp(a);
        setDatosBComp(b);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoadingComp(false);
      }
    }
    cargarComparacion();
    return () => controller.abort();
  }, [modoComp, compA, compB, tipoComp, sucursal, cargarCampanas, filtrosDesdeComparacion]);

  // ── NUEVO: seleccionar ciudad y mapearla a sucursal interna ──────────────
  const seleccionarCiudad = useCallback((ciudad) => {
    setCiudadSeleccionada(ciudad);
    setSucursal(ciudad === "Todas" ? "Todas" : `__grupo__${ciudad}`);
  }, []);

  const añosDisponibles = useMemo(() => {
    if (opciones.anios.length > 0) return opciones.anios;
    return [...new Set(DATOS_RAW.map((d) => d.año))].filter(Boolean).sort((a, b) => b - a);
  }, [opciones.anios, DATOS_RAW]);

  const filtrarPorSemana = useCallback((arr) => {
    if (semana === "Todas") return arr;
    const semanaNumero = parseInt(semana);
    return arr.filter((c) => c.semana === semanaNumero);
  }, [semana]);

  // ── NUEVO: filtrado por grupo de ciudad en frontend ──────────────────────
  const filtrarPorCiudad = useCallback((arr) => {
    if (!sucursal.startsWith("__grupo__")) return arr;
    const ciudad = sucursal.replace("__grupo__", "");
    const sucursalesDelGrupo = GRUPOS_DEALER[ciudad] ?? [];
    return arr.filter(c =>
      sucursalesDelGrupo.some(s => normalizarTexto(c.sucursal) === normalizarTexto(s))
    );
  }, [sucursal]);

  const datosFiltrados = useMemo(() => {
    return filtrarPorSemana(filtrarPorCiudad(DATOS_RAW));
  }, [DATOS_RAW, filtrarPorSemana, filtrarPorCiudad]);

  const datosA = useMemo(() => filtrarPorSemana(filtrarPorCiudad(datosAComp)), [datosAComp, filtrarPorSemana, filtrarPorCiudad]);
  const datosB = useMemo(() => filtrarPorSemana(filtrarPorCiudad(datosBComp)), [datosBComp, filtrarPorSemana, filtrarPorCiudad]);

  const datosActivos = modoComp ? datosA : datosFiltrados;
  const datosComp = modoComp ? datosB : [];

  const labelA = tipoComp === "años" ? compA : (() => { const [y, m] = compA.split("-"); return `${MESES[parseInt(m) - 1]?.slice(0, 3) ?? "Mes"} ${y}`; })();
  const labelB = tipoComp === "años" ? compB : (() => { const [y, m] = compB.split("-"); return `${MESES[parseInt(m) - 1]?.slice(0, 3) ?? "Mes"} ${y}`; })();

  const totA = useMemo(() => agg(datosActivos), [datosActivos]);
  const totB = useMemo(() => agg(datosComp), [datosComp]);

  const opcionesAñoMes = useMemo(() => {
    const fuente = opciones.anio_mes.length > 0 ? opciones.anio_mes : DATOS_RAW.map((c) => ({ anio: c.año, mes: c.mes }));
    const set = new Set();
    fuente.forEach((item) => { if (item.anio && item.mes) set.add(`${item.anio}-${item.mes}`); });
    return Array.from(set).sort((a, b) => {
      const [ya, ma] = a.split("-").map(Number);
      const [yb, mb] = b.split("-").map(Number);
      if (yb !== ya) return yb - ya;
      return mb - ma;
    }).map((value) => {
      const [y, m] = value.split("-");
      return { value, label: `${MESES[parseInt(m) - 1]?.slice(0, 3) ?? "Mes"} ${y}` };
    });
  }, [opciones.anio_mes, DATOS_RAW]);

  const opcionesAño = useMemo(() => añosDisponibles.map((a) => ({ value: String(a), label: String(a) })), [añosDisponibles]);

  const mesesDisponibles = useMemo(() => {
    if (año === "Todos") {
      const meses = opciones.anio_mes.map((item) => item.mes).filter(Boolean);
      return [...new Set(meses)].sort((a, b) => a - b);
    }
    const desdeOpciones = opciones.anio_mes.filter((item) => String(item.anio) === String(año)).map((item) => item.mes).filter(Boolean);
    if (desdeOpciones.length > 0) return [...new Set(desdeOpciones)].sort((a, b) => a - b);
    return [...new Set(DATOS_RAW.map((d) => d.mes))].filter(Boolean).sort((a, b) => a - b);
  }, [año, opciones.anio_mes, DATOS_RAW]);

  const loading = loadingOpciones || (modoComp ? loadingComp : loadingBase);


  const descripcionPeriodo = modoComp
    ? `${labelA} vs ${labelB}`
    : `${mes === "Todos" ? "Todos los meses" : MESES[Number(mes) - 1]} · ${año === "Todos" ? "Todos los años" : año}`;

  const descripcionDealer = ciudadSeleccionada === "Todas"
    ? "Todos los dealers"
    : ciudadSeleccionada;

  const filtrosReporte = useMemo(() => ([
    { etiqueta: "Período", valor: descripcionPeriodo },
    { etiqueta: "Dealer", valor: descripcionDealer },
    { etiqueta: "Semana", valor: semana === "Todas" ? "Todas las semanas" : `Semana ${semana}` },
    { etiqueta: "Comparación", valor: modoComp ? `${labelA} vs ${labelB}` : "No aplicada" },
  ]), [descripcionPeriodo, descripcionDealer, semana, modoComp, labelA, labelB]);

  const capturarReporteVisual = useCallback(async () => {
    if (!reporteVisualRef.current) throw new Error("No se encontró el contenido visual del reporte.");

    await esperarRenderCompleto();
    const canvas = await html2canvas(reporteVisualRef.current, {
      scale: 1.35,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 1440,
      scrollX: 0,
      scrollY: 0,
      onclone: (documentoClonado) => {
        const reporteClonado = documentoClonado.getElementById("reporte-meta-exportacion");
        if (reporteClonado) {
          reporteClonado.style.position = "absolute";
          reporteClonado.style.left = "0";
          reporteClonado.style.top = "0";
          reporteClonado.style.zIndex = "0";
        }
      },
    });

    if (!canvas.width || !canvas.height) throw new Error("No fue posible capturar las gráficas.");
    return canvas;
  }, []);

  const generarExcel = useCallback(async () => {
    if (datosActivos.length === 0 || exportando) return;

    try {
      setExportando("excel");
      setErrorExportacion(null);

      const canvas = await capturarReporteVisual();
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "CRM Grupo Automotriz R&R";
      workbook.lastModifiedBy = "CRM Grupo Automotriz R&R";
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.subject = "Reporte de campañas META ADS";
      workbook.title = `Reporte META ADS - ${descripcionPeriodo}`;

      agregarHojaResumenExcel(workbook, {
        filtrosReporte,
        totales: totA,
        cantidadRegistros: datosActivos.length,
        modoComp,
        labelA,
        labelB,
        totalesComparacion: totB,
        cantidadComparacion: datosComp.length,
      });

      agregarHojaDatosExcel(
        workbook,
        modoComp ? "Datos período A" : "Datos filtrados",
        "TablaDatosFiltrados",
        datosActivos,
        modoComp ? labelA : descripcionPeriodo,
      );

      if (modoComp && datosComp.length > 0) {
        agregarHojaDatosExcel(
          workbook,
          "Datos período B",
          "TablaDatosComparacion",
          datosComp,
          labelB,
        );
      }

      agregarHojaGraficasExcel(workbook, canvas, filtrosReporte);

      const buffer = await workbook.xlsx.writeBuffer();
      const archivo = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      descargarBlob(archivo, crearNombreReporte({
        periodo: descripcionPeriodo,
        dealer: descripcionDealer,
        extension: "xlsx",
      }));
    } catch (err) {
      console.error("Error generando Excel:", err);
      setErrorExportacion(err?.message || "No fue posible generar el reporte Excel.");
    } finally {
      setExportando(null);
    }
  }, [
    datosActivos,
    datosComp,
    exportando,
    capturarReporteVisual,
    filtrosReporte,
    totA,
    totB,
    modoComp,
    labelA,
    labelB,
    descripcionPeriodo,
    descripcionDealer,
  ]);

  const generarPdf = useCallback(async () => {
    if (datosActivos.length === 0 || exportando) return;

    try {
      setExportando("pdf");
      setErrorExportacion(null);

      const canvas = await capturarReporteVisual();
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
      doc.setProperties({
        title: `Reporte META ADS - ${descripcionPeriodo}`,
        subject: "Reporte de tabla y gráficas de campañas META ADS",
        author: "CRM Grupo Automotriz R&R",
        creator: "CRM Grupo Automotriz R&R",
      });

      agregarCanvasPaginadoPdf(doc, canvas);
      agregarTablaPdf(doc, datosActivos, modoComp ? `Tabla de campañas - ${labelA}` : "Tabla de campañas filtradas");

      if (modoComp && datosComp.length > 0) {
        agregarTablaPdf(doc, datosComp, `Tabla de comparación - ${labelB}`);
      }

      doc.save(crearNombreReporte({
        periodo: descripcionPeriodo,
        dealer: descripcionDealer,
        extension: "pdf",
      }));
    } catch (err) {
      console.error("Error generando PDF:", err);
      setErrorExportacion(err?.message || "No fue posible generar el reporte PDF.");
    } finally {
      setExportando(null);
    }
  }, [
    datosActivos,
    datosComp,
    exportando,
    capturarReporteVisual,
    modoComp,
    labelA,
    labelB,
    descripcionPeriodo,
    descripcionDealer,
  ]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        Cargando campañas…
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <p className="text-red-400 text-sm font-medium">Error al cargar los datos</p>
        <p className="text-gray-400 text-xs mt-1">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-0 p-1">

      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Marketing | META ADS</h2>
          <p className="text-xs text-gray-500">Métricas y rendimiento de campañas publicitarias</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={generarExcel}
            disabled={datosActivos.length === 0 || Boolean(exportando)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generar Excel con resumen, datos filtrados y gráficas"
          >
            {exportando === "excel" ? <LoaderCircle size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            {exportando === "excel" ? "Generando..." : "Exportar Excel"}
          </button>

          <button
            onClick={generarPdf}
            disabled={datosActivos.length === 0 || Boolean(exportando)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Generar PDF con resumen, gráficas y tabla paginada"
          >
            {exportando === "pdf" ? <LoaderCircle size={16} className="animate-spin" /> : <FileText size={16} />}
            {exportando === "pdf" ? "Generando..." : "Exportar PDF"}
          </button>

          <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block" />

          {["tabla", "graficas"].map(v => (
            <button key={v} onClick={() => setVista(v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${vista === v ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              style={vista === v ? { backgroundColor: NAVY } : {}}
            >
              {v === "tabla" ? <><TableProperties size={15} />Tabla</> : <><BarChart2 size={15} />Gráficas</>}
            </button>
          ))}
        </div>
      </div>

      {errorExportacion && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorExportacion}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 overflow-hidden mb-5">

        {/* Filtro de años */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-200 bg-gray-50/60 flex-wrap">
          <button className="p-1 rounded hover:bg-gray-200 text-gray-400 mr-1">
            <ChevronRight size={14} className="rotate-180" />
          </button>
          {añosDisponibles.map(a => (
            <button key={a} onClick={() => { setAño(año === String(a) ? "Todos" : String(a)); setMes("Todos"); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${año === String(a) ? "text-white border-transparent" : "bg-white border-gray-300 text-gray-600 hover:border-blue-300 hover:text-blue-600"}`}
              style={año === String(a) ? { backgroundColor: NAVY } : {}}
            >
              {a}
            </button>
          ))}
          <button onClick={() => { setAño("Todos"); setMes("Todos"); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ml-1 ${año === "Todos" ? "text-white border-transparent" : "bg-white border-gray-300 text-gray-600 hover:border-blue-300"}`}
            style={año === "Todos" ? { backgroundColor: NAVY } : {}}
          >
            Todos
          </button>
          <button className="p-1 rounded hover:bg-gray-200 text-gray-400 ml-1">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Filtro de meses */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-200 bg-white flex-wrap">
          {MESES_CORTOS.map((m, i) => {
            const mesNum = i + 1;
            const disponible = año === "Todos" || mesesDisponibles.includes(mesNum);
            return (
              <button key={m}
                onClick={() => disponible && setMes(mes === String(mesNum) ? "Todos" : String(mesNum))}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${mes === String(mesNum) ? "text-white border-transparent" : disponible ? "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50" : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"}`}
                style={mes === String(mesNum) ? { backgroundColor: NAVY } : {}}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* ── Filtros inferiores ── */}
        <div className="flex flex-wrap items-end gap-4 px-4 py-3 bg-white">

          {/* ── NUEVO filtro de dealers agrupados por ciudad ── */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Dealer</label>
            <div className="flex flex-wrap gap-1.5">
              {/* Botón "Todas" */}
              <button
                onClick={() => seleccionarCiudad("Todas")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${ciudadSeleccionada === "Todas" ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50"}`}
                style={ciudadSeleccionada === "Todas" ? { backgroundColor: NAVY } : {}}
              >
                Todas
              </button>
              {/* Un botón por ciudad */}
              {Object.keys(GRUPOS_DEALER).map(ciudad => (
                <button
                  key={ciudad}
                  onClick={() => seleccionarCiudad(ciudad)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${ciudadSeleccionada === ciudad ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50"}`}
                  style={ciudadSeleccionada === ciudad ? { backgroundColor: NAVY } : {}}
                >
                  {ciudad}
                </button>
              ))}
            </div>

            {/* Sub-chips: muestra las sucursales de la ciudad activa */}
            {ciudadSeleccionada !== "Todas" && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(GRUPOS_DEALER[ciudadSeleccionada] ?? []).map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Filtro de semana */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Semana</label>
            <div className="relative">
              <select value={semana} onChange={e => setSemana(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer min-w-[130px]">
                <option value="Todas">Todas</option>
                {SEMANAS.map(s => <option key={s} value={String(s)}>Semana {s}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Comparar períodos */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Comparar períodos</label>
            <button onClick={() => setModoComp(!modoComp)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition h-[38px] ${modoComp ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              style={modoComp ? { backgroundColor: "#1D9E75" } : {}}
            >
              <TrendingUp size={14} />
              {modoComp ? "Comparando" : "Comparar"}
            </button>
          </div>

          {/* Accesos rápidos */}
          <div className="ml-auto flex items-end gap-2 flex-wrap">
            <button onClick={() => { setAño(ANIO_ACTUAL); setMes(MES_ACTUAL); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition"
              style={{ backgroundColor: "#1D9E75" }}>
              𝄜  Hoy
            </button>
            <button onClick={() => {
              const hoy = new Date();
              const mesAnterior = hoy.getMonth() === 0 ? 12 : hoy.getMonth();
              const añoAnterior = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear();
              setAño(String(añoAnterior)); setMes(String(mesAnterior));
            }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition"
              style={{ backgroundColor: "#F0A500" }}>
              𝄜  Mes anterior
            </button>
            <button onClick={() => { setAño(ANIO_ACTUAL); setMes("Todos"); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition"
              style={{ backgroundColor: "#378ADD" }}>
              𝄜  Este año
            </button>
            {/* ── NUEVO: limpia también ciudadSeleccionada ── */}
            <button onClick={() => {
              setAño("Todos"); setMes("Todos"); setSemana("Todas");
              setSucursal("Todas"); setCiudadSeleccionada("Todas");
              setModoComp(false);
            }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 transition">
              ✕ Limpiar
            </button>
          </div>
        </div>

        {/* Panel de comparación */}
        {modoComp && (
          <div className="px-4 py-3 border-t border-gray-100 bg-blue-50/40 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Tipo comparación</label>
              <div className="relative">
                <select value={tipoComp} onChange={v => {
                  setTipoComp(v.target.value);
                  setCompA(v.target.value === "años" ? String(new Date().getFullYear()) : `${new Date().getFullYear()}-${new Date().getMonth() + 1}`);
                  setCompB(v.target.value === "años" ? String(new Date().getFullYear() - 1) : `${new Date().getFullYear() - 1}-${new Date().getMonth() + 1}`);
                }}
                  className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer min-w-[140px]">
                  <option value="meses">Mes vs Mes</option>
                  <option value="años">Año vs Año</option>
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">{tipoComp === "años" ? "Año A" : "Mes/Año A"}</label>
              <div className="relative">
                <select value={compA} onChange={e => setCompA(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer min-w-[130px]">
                  {(tipoComp === "años" ? opcionesAño : opcionesAñoMes).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-end pb-1">
              <span className="text-xs font-bold text-blue-400 px-2">vs</span>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">{tipoComp === "años" ? "Año B" : "Mes/Año B"}</label>
              <div className="relative">
                <select value={compB} onChange={e => setCompB(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer min-w-[130px]">
                  {(tipoComp === "años" ? opcionesAño : opcionesAñoMes).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-end">
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-100 font-medium">
                {labelA} <span className="text-blue-400">vs</span> {labelB}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <StatCard label="Campañas" value={datosActivos.length} sub={modoComp ? `${datosB.length} en ${labelB}` : undefined} color="#378ADD" delta={modoComp ? pct(datosActivos.length, datosB.length) : null} />
        <StatCard label="Alcance total" value={totA.alcance.toLocaleString()} sub={modoComp ? `${totB.alcance.toLocaleString()} en ${labelB}` : "personas únicas"} color="#1D9E75" delta={modoComp ? pct(totA.alcance, totB.alcance) : null} />
        <StatCard label="Impresiones" value={totA.impresiones.toLocaleString()} sub={modoComp ? `${totB.impresiones.toLocaleString()} en ${labelB}` : "total"} color="#7F77DD" delta={modoComp ? pct(totA.impresiones, totB.impresiones) : null} />
        <StatCard label="Gasto total" value={`$${totA.importe_gastado.toFixed(0)}`} sub={modoComp ? `$${totB.importe_gastado.toFixed(0)} en ${labelB}` : "importe gastado"} color="#D85A30" delta={modoComp ? pct(totA.importe_gastado, totB.importe_gastado) : null} />
      </div>

      {vista === "tabla"
        ? <VistaTabla datos={datosActivos} />
        : <VistaGraficas datos={datosActivos} datosComp={datosComp} modoComp={modoComp} labelA={labelA} labelB={labelB} />
      }

      {/*
        Este bloque permanece fuera de la pantalla, pero sí está renderizado.
        Así se pueden exportar todas las gráficas aunque el usuario esté viendo la tabla.
      */}
      <div
        id="reporte-meta-exportacion"
        ref={reporteVisualRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-20000px",
          top: 0,
          width: "1200px",
          padding: "32px",
          backgroundColor: "#ffffff",
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <div className="mb-6 border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-black" style={{ color: NAVY }}>Reporte de Marketing | META ADS</h1>
          <p className="mt-1 text-sm text-gray-500">Tabla y gráficas generadas con los filtros aplicados en el CRM</p>
          <p className="mt-1 text-xs text-gray-400">Generado: {new Date().toLocaleString("es-MX")}</p>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
          {filtrosReporte.map((filtro) => (
            <div key={filtro.etiqueta} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">{filtro.etiqueta}</p>
              <p className="mt-1 text-sm font-bold text-gray-700">{filtro.valor}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-5">
          <StatCard label="Campañas" value={datosActivos.length} sub={modoComp ? `${datosComp.length} en ${labelB}` : undefined} color="#378ADD" delta={modoComp ? pct(datosActivos.length, datosComp.length) : null} />
          <StatCard label="Alcance total" value={totA.alcance.toLocaleString()} sub={modoComp ? `${totB.alcance.toLocaleString()} en ${labelB}` : "personas únicas"} color="#1D9E75" delta={modoComp ? pct(totA.alcance, totB.alcance) : null} />
          <StatCard label="Impresiones" value={totA.impresiones.toLocaleString()} sub={modoComp ? `${totB.impresiones.toLocaleString()} en ${labelB}` : "total"} color="#7F77DD" delta={modoComp ? pct(totA.impresiones, totB.impresiones) : null} />
          <StatCard label="Gasto total" value={`$${totA.importe_gastado.toFixed(2)}`} sub={modoComp ? `$${totB.importe_gastado.toFixed(2)} en ${labelB}` : "importe gastado"} color="#D85A30" delta={modoComp ? pct(totA.importe_gastado, totB.importe_gastado) : null} />
        </div>

        <VistaGraficas
          datos={datosActivos}
          datosComp={datosComp}
          modoComp={modoComp}
          labelA={labelA}
          labelB={labelB}
        />
      </div>
    </div>
  );
}