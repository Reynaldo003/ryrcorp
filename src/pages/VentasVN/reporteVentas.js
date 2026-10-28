// src/pages/VentasVN/reporteVentas.js
// Configuración y generación del reporte exportable de Ventas (Autos Nuevos / Usados).
import { http, buildQuery } from "../../lib/apiClient";

export const COLUMNAS_REPORTE_VENTAS = [
    { key: "serie", label: "Serie" },
    { key: "nr_nota", label: "Nr. Nota" },
    { key: "tp_producto", label: "Tipo Producto" },
    { key: "producto_servicio", label: "Producto / Servicio" },
    { key: "precio_unitario", label: "Precio Unitario" },
    { key: "valor_bruto_item", label: "Valor Bruto" },
    { key: "influye_estadistica", label: "Influye Estadística" },
    { key: "valor_descuento_item", label: "Descuento" },
    { key: "codigo_condicion_pago", label: "Código Cond. Pago" },
    { key: "valor_factura", label: "Valor Factura" },
    { key: "valor_factura_sin_iva", label: "Factura sin IVA" },
    { key: "valor_compra", label: "Valor Compra" },
    { key: "isan", label: "ISAN" },
    { key: "iva", label: "IVA" },
    { key: "codigo_entidad", label: "Código Entidad" },
    { key: "fecha_emision", label: "Fecha Emisión" },
    { key: "situacion", label: "Situación" },
    { key: "tipo_nf", label: "Tipo NF" },
    { key: "nr_mov", label: "Nr. Movimiento" },
    { key: "fecha_ultima_venta", label: "Última Venta" },
    { key: "razon_social", label: "Razón Social" },
    { key: "tipo_persona", label: "Tipo Persona" },
    { key: "valor_total_productos", label: "Total Productos" },
    { key: "codigo_marca", label: "Código Marca" },
    { key: "nombre_marca", label: "Marca" },
    { key: "nombre_familia", label: "Familia / Modelo" },
    { key: "condicion_uso", label: "Condición Uso" },
    { key: "nombre_condicion_pago", label: "Condición Pago" },
    { key: "asesor", label: "Asesor" },
    { key: "agencia", label: "Agencia" },
    { key: "tipo_venta", label: "Tipo de Venta" },
];

// Selección inicial equilibrada: identificación, operación y finanzas.
export const COLUMNAS_REPORTE_VENTAS_DEFAULT = [
    "serie", "nr_nota", "producto_servicio", "fecha_emision", "situacion",
    "nombre_marca", "nombre_familia", "asesor", "agencia", "condicion_uso",
    "nombre_condicion_pago", "valor_factura", "valor_compra", "tipo_venta",
];

export const SECCIONES_REPORTE_VENTAS = [
    { key: "summary", label: "Resumen ejecutivo", description: "KPIs, totales y filtros aplicados al reporte.", defaultSelected: true },
    { key: "charts", label: "Análisis gráfico", description: "Visualizaciones de ventas, margen y distribución.", defaultSelected: true },
    { key: "table", label: "Detalle de operaciones", description: "Tabla configurable con las columnas elegidas.", defaultSelected: true },
];

export const GRAFICAS_REPORTE_VENTAS = [
    { key: "mes", label: "Tendencia por mes", description: "Unidades vendidas e ingresos por mes dentro del periodo.", type: "line", category: "Tendencia", metric: "Unidades", defaultSelected: true, recommended: true },
    { key: "asesor", label: "Rendimiento por asesor", description: "Top de asesores por unidades vendidas.", type: "bar", category: "Operación", metric: "Unidades", defaultSelected: true, recommended: true },
    { key: "familia", label: "Modelos con mayor movimiento", description: "Top de familias y modelos por unidades vendidas.", type: "bar", category: "Producto", metric: "Unidades", defaultSelected: true, recommended: true },
    { key: "agencia", label: "Ventas por agencia", description: "Distribución de unidades vendidas entre agencias.", type: "bar", category: "Distribución", metric: "Unidades", defaultSelected: true, recommended: true },
    { key: "condicion_pago", label: "Condición de pago", description: "Composición de las ventas por condición de pago.", type: "donut", category: "Comercial", metric: "Unidades", defaultSelected: true, recommended: true },
    { key: "tipo_venta", label: "Canal de venta", description: "Comparativo entre venta digital y venta tradicional.", type: "donut", category: "Canal", metric: "Unidades", defaultSelected: true, recommended: true },
    { key: "marca", label: "Distribución por marca", description: "Participación de unidades vendidas por marca.", type: "donut", category: "Producto", metric: "Unidades", defaultSelected: false, recommended: false },
];

export const COLORES_REPORTE_VENTAS = ["#131E5C", "#2445A2", "#378ADD", "#1D9E75", "#D85A30", "#7F77DD", "#D4537E", "#F0A500"];
export const TOOLTIP_REPORTE_VENTAS = { fontSize: 11, borderRadius: 10, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,.08)" };
export const MESES_CORTOS_REPORTE = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function crearFiltrosReporteVentas(opciones = {}) {
    const opcionesSelect = (lista, etiquetaVacio) => [
        { value: "", label: etiquetaVacio },
        ...(lista || []).map((item) => ({ value: item, label: item })),
    ];

    return [
        { key: "q", label: "Búsqueda", type: "text", placeholder: "Serie, cliente o asesor..." },
        { key: "agencia", label: "Agencia", type: "select", options: opcionesSelect(opciones.agencias, "Todas las agencias") },
        { key: "asesor", label: "Asesor", type: "select", options: opcionesSelect(opciones.asesores, "Todos los asesores") },
        { key: "familia", label: "Familia / Modelo", type: "select", options: opcionesSelect(opciones.familias, "Todos los modelos") },
        { key: "condicion_pago", label: "Condición de pago", type: "select", options: opcionesSelect(opciones.condiciones_pago, "Todas las condiciones") },
        {
            key: "venta_digital",
            label: "Canal de venta",
            type: "select",
            options: [
                { value: "", label: "Todas las ventas" },
                { value: "1", label: "Solo ventas digitales" },
            ],
        },
        { key: "serie", label: "Serie / VIN", type: "text", placeholder: "Buscar por serie o VIN" },
        { key: "nr_nota", label: "Número de nota", type: "text", placeholder: "Nota o movimiento" },
        { key: "fecha_desde", label: "Fecha desde", type: "date" },
        { key: "fecha_hasta", label: "Fecha hasta", type: "date" },
    ];
}

const CAMPOS_MONEDA = new Set([
    "precio_unitario", "valor_bruto_item", "valor_descuento_item", "valor_factura",
    "valor_factura_sin_iva", "valor_compra", "isan", "iva", "valor_total_productos",
]);
const CAMPOS_FECHA = new Set(["fecha_emision", "fecha_ultima_venta"]);

export function numeroReporte(value) { return Number(value || 0); }
export function formatoNumeroReporte(value) { return numeroReporte(value).toLocaleString("es-MX"); }
export function formatoCompactoReporte(value) {
    return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(numeroReporte(value));
}
export function moneyReporte(value) {
    if (value === null || value === undefined || value === "") return "—";
    const n = Number(value);
    if (!Number.isFinite(n)) return value;
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
export function cnReporte(...parts) { return parts.filter(Boolean).join(" "); }
export function etiquetaMesReporte(item) {
    const mes = Number(item?.mes || 0);
    const anio = item?.anio || "";
    if (mes < 1 || mes > 12) return item?.periodo || "";
    return `${MESES_CORTOS_REPORTE[mes - 1]} ${anio}`;
}

export function agruparReporte(rows, getter, limit = null) {
    const map = new Map();
    rows.forEach((row) => {
        const raw = typeof getter === "function" ? getter(row) : row?.[getter];
        const key = String(raw ?? "").trim() || "Sin dato";
        map.set(key, (map.get(key) || 0) + 1);
    });
    const data = Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    return limit ? data.slice(0, limit) : data;
}

function normalizarBusquedaVIN(valor) {
    return String(valor || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function esVINCompleto(valor) {
    return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalizarBusquedaVIN(valor));
}

export function valorReporte(row, key) {
    if (!row) return "";
    if (CAMPOS_MONEDA.has(key)) return moneyReporte(row[key]);
    if (CAMPOS_FECHA.has(key)) {
        const raw = row[key];
        if (!raw) return "—";
        const [y, m, d] = String(raw).split("-");
        return y && m && d ? `${d}/${m}/${y}` : String(raw);
    }
    if (key === "tipo_venta") return row.tipo_venta || (row.es_venta_digital ? "Venta digital" : "Tradicional");
    return row[key] ?? "";
}

function nombreReporte(config, extension, defaultFileName) {
    const ahora = new Date();
    const sello = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}_${String(ahora.getHours()).padStart(2, "0")}-${String(ahora.getMinutes()).padStart(2, "0")}`;
    const base = String(config?.fileName || "").trim().replace(/\.(xlsx|pdf)$/i, "").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, "_").replace(/^_+|_+$/g, "");
    return `${base || `${defaultFileName}_${sello}`}.${extension}`;
}

function descargarBlob(blob, nombreArchivo) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function agregarCanvasPdf(doc, canvas) {
    const margen = 8;
    const anchoPagina = doc.internal.pageSize.getWidth();
    const altoPagina = doc.internal.pageSize.getHeight();
    const anchoUtil = anchoPagina - margen * 2;
    const altoUtil = altoPagina - margen * 2;
    const pixelesPorMm = canvas.width / anchoUtil;
    const altoCortePx = Math.max(1, Math.floor(altoUtil * pixelesPorMm));
    let y = 0;
    let primera = true;

    while (y < canvas.height) {
        if (!primera) doc.addPage();
        primera = false;
        const altoActual = Math.min(altoCortePx, canvas.height - y);
        const corte = document.createElement("canvas");
        corte.width = canvas.width;
        corte.height = altoActual;
        const ctx = corte.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, corte.width, corte.height);
        ctx.drawImage(canvas, 0, y, canvas.width, altoActual, 0, 0, canvas.width, altoActual);
        doc.addImage(corte.toDataURL("image/png"), "PNG", margen, margen, anchoUtil, altoActual / pixelesPorMm, undefined, "FAST");
        y += altoActual;
    }
}

async function esperarRenderReporte() {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 240));
}

function esperarPintadoProgreso() {
    // Deja que el navegador pinte el mensaje antes de un bloque de trabajo pesado.
    return new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

/**
 * Genera el archivo Excel o PDF del reporte configurado.
 */
export async function generarReporteVentas(config = {}, {
    onProgress,
    filtros = {},
    condicionUso,
    moduleLabel = "Ventas de Autos Nuevos",
    defaultTitle = "Reporte de Ventas de Autos Nuevos",
    defaultFileName = "reporte_autos_nuevos",
    filterDefinitions = [],
    onPreviewChange,
} = {}) {
    const progreso = (mensaje) => {
        try {
            onProgress?.(mensaje);
        } catch {
            // El aviso de progreso es informativo; no debe interrumpir la exportación.
        }
    };

    progreso("Leyendo filtros y parámetros del reporte...");
    const reportFilters = { ...filtros, ...(config.filters || {}) };
    const busqueda = String(reportFilters.q || "").trim();
    const buscarVIN = esVINCompleto(busqueda);

    const paramsBase = {
        cond_uso: condicionUso,
        q: buscarVIN ? normalizarBusquedaVIN(busqueda) : busqueda,
        agencia: reportFilters.agencia,
        asesor: reportFilters.asesor,
        familia: reportFilters.familia,
        condicion_pago: reportFilters.condicion_pago,
        serie: reportFilters.serie,
        nr_nota: reportFilters.nr_nota,
        producto_servicio: reportFilters.producto_servicio,
        venta_digital: reportFilters.venta_digital,
        fecha_desde: buscarVIN ? "" : reportFilters.fecha_desde,
        fecha_hasta: buscarVIN ? "" : reportFilters.fecha_hasta,
    };

    try {
        progreso("Extrayendo datos de ventas...");
        const primera = await http(`/ventas-vn/api/${buildQuery({ ...paramsBase, page: 1, page_size: 100 })}`);
        const totalRegistros = Number(primera?.count || 0);
        const filasExportar = Array.isArray(primera?.results) ? [...primera.results] : [];
        const paginasReporte = Math.ceil(totalRegistros / 100);

        for (let page = 2; page <= paginasReporte; page += 1) {
            progreso(`Leyendo registros... página ${page} de ${paginasReporte}`);
            const response = await http(`/ventas-vn/api/${buildQuery({ ...paramsBase, page, page_size: 100 })}`);
            if (Array.isArray(response?.results)) filasExportar.push(...response.results);
        }

        if (!filasExportar.length) {
            throw new Error("No hay registros para exportar con los filtros configurados.");
        }

        progreso("Organizando la información obtenida...");
        const columnasSolicitadas = Array.isArray(config.columns) && config.columns.length
            ? config.columns
            : COLUMNAS_REPORTE_VENTAS_DEFAULT;
        const columnasSeleccionadas = COLUMNAS_REPORTE_VENTAS.filter((columna) => columnasSolicitadas.includes(columna.key));

        const incluyeResumen = config.sections?.includes("summary") ?? true;
        const incluyeGraficas = config.sections?.includes("charts") && Array.isArray(config.charts) && config.charts.length > 0;
        const incluyeTabla = config.sections?.includes("table") ?? true;

        progreso("Calculando totales y resumen ejecutivo...");
        const filasVendidas = filasExportar.filter((row) => String(row.situacion || "").toUpperCase() === "E");
        const baseTotales = filasVendidas.length ? filasVendidas : filasExportar;
        const ingresos = filasExportar.reduce((acc, row) => acc + numeroReporte(row.valor_factura_sin_iva) - numeroReporte(row.isan), 0);
        const costo = filasExportar.reduce((acc, row) => acc + numeroReporte(row.valor_compra), 0);
        const utilidad = ingresos - costo;
        const margen = ingresos ? (utilidad / ingresos) * 100 : 0;
        const digitales = filasExportar.filter((row) => row.es_venta_digital || row.tipo_venta === "Venta digital").length;

        const resumen = {
            unidades: baseTotales.length,
            operaciones: filasExportar.length,
            ingresos,
            costo,
            utilidad,
            margen,
            digitales,
        };

        const filtrosLegibles = filterDefinitions
            .map((definicion) => {
                const raw = reportFilters[definicion.key];
                if (raw === undefined || raw === null || raw === "" || raw === "Todos" || raw === "Todas") return null;
                let value = raw;
                if (definicion.type === "select" && Array.isArray(definicion.options)) {
                    const encontrado = definicion.options.find((opcion) => String(opcion.value) === String(raw));
                    if (encontrado) value = encontrado.label;
                }
                return { label: definicion.label, value };
            })
            .filter(Boolean);

        const tituloReporte = config.title || defaultTitle;
        let canvas = null;

        if (incluyeResumen || incluyeGraficas) {
            progreso("Preparando el resumen y las gráficas del reporte...");
            onPreviewChange?.({
                title: tituloReporte,
                filters: filtrosLegibles,
                charts: incluyeGraficas ? config.charts : [],
                includeSummary: incluyeResumen,
                includeCharts: incluyeGraficas,
                summary: resumen,
                rows: filasExportar,
            });
            await esperarRenderReporte();

            // La vista previa se monta desde la página; aquí solo esperamos a que exista.
            const nodo = document.getElementById("reporte-ventas-preview");
            if (!nodo) {
                throw new Error("No se pudo preparar la vista visual del reporte.");
            }

            progreso("Generando imágenes del reporte...");
            const { default: html2canvas } = await import("html2canvas-pro");
            canvas = await html2canvas(nodo, {
                scale: 1.35,
                useCORS: true,
                allowTaint: false,
                backgroundColor: "#ffffff",
                logging: false,
                windowWidth: 1280,
                scrollX: 0,
                scrollY: 0,
            });
        }

        if (config.format === "pdf") {
            progreso("Creando documento PDF...");
            await esperarPintadoProgreso();
            const orientation = config.orientation === "portrait" ? "portrait" : "landscape";
            const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
            const doc = new jsPDF({ orientation, unit: "mm", format: "a4", compress: true });
            doc.setProperties({
                title: tituloReporte,
                subject: `Reporte configurable de ${moduleLabel}`,
                author: "CRM Grupo Automotriz R&R",
                creator: "CRM Grupo Automotriz R&R",
            });

            let tieneContenido = false;
            if (canvas) {
                agregarCanvasPdf(doc, canvas);
                tieneContenido = true;
            }

            if (incluyeTabla) {
                if (tieneContenido) doc.addPage();
                const columnasPorPagina = orientation === "portrait" ? 4 : 7;
                const grupos = [];
                for (let i = 0; i < columnasSeleccionadas.length; i += columnasPorPagina) {
                    grupos.push(columnasSeleccionadas.slice(i, i + columnasPorPagina));
                }

                grupos.forEach((grupo, indice) => {
                    if (indice > 0) doc.addPage();
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(12);
                    doc.setTextColor(19, 30, 92);
                    doc.text(`${tituloReporte} · Detalle ${indice + 1}/${grupos.length}`, 8, 10);

                    autoTable(doc, {
                        startY: 14,
                        head: [grupo.map((columna) => columna.label)],
                        body: filasExportar.map((row) => grupo.map((columna) => String(valorReporte(row, columna.key) ?? ""))),
                        theme: "grid",
                        styles: {
                            font: "helvetica",
                            fontSize: 6.2,
                            cellPadding: 1.4,
                            overflow: "linebreak",
                            valign: "middle",
                            textColor: [55, 65, 81],
                            lineColor: [226, 232, 240],
                            lineWidth: 0.12,
                        },
                        headStyles: {
                            fillColor: [19, 30, 92],
                            textColor: [255, 255, 255],
                            fontStyle: "bold",
                            halign: "center",
                        },
                        alternateRowStyles: { fillColor: [248, 250, 252] },
                        margin: { left: 7, right: 7, bottom: 9 },
                    });
                });
                tieneContenido = true;
            }

            if (!tieneContenido) {
                throw new Error("El reporte no tiene contenido seleccionado.");
            }

            progreso("Descargando archivo...");
            await esperarPintadoProgreso();
            doc.save(nombreReporte(config, "pdf", defaultFileName));
        } else {
            progreso("Creando archivo Excel...");
            await esperarPintadoProgreso();
            const { default: ExcelJS } = await import("exceljs");
            const workbook = new ExcelJS.Workbook();
            workbook.creator = "CRM Grupo Automotriz R&R";
            workbook.lastModifiedBy = "CRM Grupo Automotriz R&R";
            workbook.created = new Date();
            workbook.modified = new Date();
            workbook.title = tituloReporte;

            if (incluyeResumen) {
                const hoja = workbook.addWorksheet("Resumen", { views: [{ showGridLines: false }] });
                hoja.columns = [{ width: 30 }, { width: 48 }];
                hoja.mergeCells("A1:B2");
                hoja.getCell("A1").value = tituloReporte;
                hoja.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
                hoja.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF131E5C" } };
                hoja.getCell("A1").alignment = { vertical: "middle" };

                const filasResumen = [
                    ["Generado", new Date().toLocaleString("es-MX")],
                    ["Unidades vendidas", resumen.unidades],
                    ["Operaciones", resumen.operaciones],
                    ["Ingresos", moneyReporte(resumen.ingresos)],
                    ["Costo", moneyReporte(resumen.costo)],
                    ["Utilidad estimada", moneyReporte(resumen.utilidad)],
                    ["Margen", `${resumen.margen.toFixed(1)}%`],
                    ["Ventas digitales", resumen.digitales],
                ];
                filasResumen.forEach(([etiqueta, valor], index) => {
                    const fila = 4 + index;
                    hoja.getCell(`A${fila}`).value = etiqueta;
                    hoja.getCell(`A${fila}`).font = { bold: true };
                    hoja.getCell(`B${fila}`).value = valor;
                });

                const filaFiltros = 4 + filasResumen.length + 1;
                hoja.getCell(`A${filaFiltros}`).value = "Filtros configurados";
                hoja.getCell(`A${filaFiltros}`).font = { bold: true, color: { argb: "FF131E5C" } };
                if (filtrosLegibles.length) {
                    filtrosLegibles.forEach((filtro, index) => {
                        const fila = filaFiltros + 1 + index;
                        hoja.getCell(`A${fila}`).value = filtro.label;
                        hoja.getCell(`A${fila}`).font = { bold: true };
                        hoja.getCell(`B${fila}`).value = String(filtro.value);
                    });
                } else {
                    hoja.getCell(`B${filaFiltros}`).value = "Sin filtros (todo el historial)";
                }
            }

            if (incluyeTabla) {
                const hoja = workbook.addWorksheet("Detalle", {
                    views: [{ state: "frozen", ySplit: 1 }],
                });
                hoja.columns = columnasSeleccionadas.map((columna) => ({
                    header: columna.label,
                    key: columna.key,
                    width: ["producto_servicio", "razon_social"].includes(columna.key) ? 34 : 20,
                }));
                filasExportar.forEach((row) => {
                    const registro = {};
                    columnasSeleccionadas.forEach((columna) => {
                        registro[columna.key] = valorReporte(row, columna.key);
                    });
                    hoja.addRow(registro);
                });
                hoja.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
                hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF131E5C" } };
                hoja.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
                hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(1, columnasSeleccionadas.length) } };
            }

            if (incluyeGraficas && canvas) {
                const hoja = workbook.addWorksheet("Gráficas", { views: [{ showGridLines: false, zoomScale: 70 }] });
                hoja.getCell("A1").value = tituloReporte;
                hoja.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF131E5C" } };
                const imageId = workbook.addImage({ base64: canvas.toDataURL("image/png"), extension: "png" });
                const ancho = 1200;
                const alto = Math.round((canvas.height / canvas.width) * ancho);
                hoja.addImage(imageId, { tl: { col: 0, row: 2 }, ext: { width: ancho, height: alto } });
                for (let i = 1; i <= 18; i += 1) hoja.getColumn(i).width = 11;
            }

            if (!workbook.worksheets.length) {
                throw new Error("El reporte no tiene contenido seleccionado.");
            }

            const buffer = await workbook.xlsx.writeBuffer();
            progreso("Descargando archivo...");
            await esperarPintadoProgreso();
            descargarBlob(
                new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
                nombreReporte(config, "xlsx", defaultFileName),
            );
        }
    } catch (error) {
        console.error(`Error generando reporte de ${moduleLabel}:`, error);
        throw error;
    }
}
