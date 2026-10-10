//src/pages/Partes/VentaRefacciones.jsx
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet, FileText, LoaderCircle, PackageSearch, Plus, RefreshCw, Search, X } from "lucide-react";
import { Pie } from "@ant-design/plots";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { getVentaRefFacturas, getVentaRefOpciones, getVentaRefPiezas } from "../../lib/apiVentaRef";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const COLORES = ["#001E50", "#1677FF", "#0EA5E9", "#38BDF8", "#6366F1", "#14B8A6", "#F59E0B"];
const dinero = (valor) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(valor) || 0);
const compacto = (valor) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", notation: "compact", maximumFractionDigits: 1 }).format(Number(valor) || 0);
const numero = (valor) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(Number(valor) || 0);
const fechaMX = (fecha) => fecha ? String(fecha).slice(0, 10).split("-").reverse().join("/") : "—";
const claveFactura = (f) => [f.agencia, f.serie, f.nrnota, f.fecha].join("|");

export default function VentaRefacciones() {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth();
    const [anio, setAnio] = useState(anioActual);
    const [mes, setMes] = useState(null);
    const [agencia, setAgencia] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [busquedaAplicada, setBusquedaAplicada] = useState("");
    const [opciones, setOpciones] = useState([]);
    const [pagina, setPagina] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [version, setVersion] = useState(0);
    const [respuesta, setRespuesta] = useState({ count: 0, results: [], metricas: {}, analisis: { agencias: [], areas: [] } });
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [facturaAbierta, setFacturaAbierta] = useState("");
    const [detalles, setDetalles] = useState({});
    const [cargandoDetalles, setCargandoDetalles] = useState({});
    const [erroresDetalles, setErroresDetalles] = useState({});
    const [exportando, setExportando] = useState("");
    const solicitudActual = useRef(0);

    useEffect(() => {
        const espera = setTimeout(() => setBusquedaAplicada(busqueda.trim()), 400);
        return () => clearTimeout(espera);
    }, [busqueda]);

    useEffect(() => {
        getVentaRefOpciones().then((r) => setOpciones(Array.isArray(r?.agencias) ? r.agencias : []))
            .catch((e) => console.error("Error cargando agencias:", e));
    }, []);

    const fechas = useMemo(() => {
        const pad = (n) => String(n).padStart(2, "0");
        if (mes === null) return { fecha_desde: `${anio}-01-01`, fecha_hasta: `${anio}-12-31` };
        const ultimoDia = new Date(anio, mes + 1, 0).getDate();
        return { fecha_desde: `${anio}-${pad(mes + 1)}-01`, fecha_hasta: `${anio}-${pad(mes + 1)}-${pad(ultimoDia)}` };
    }, [anio, mes]);

    const filtros = useMemo(() => ({
        ...fechas, agencia: agencia || undefined, q: busquedaAplicada || undefined,
    }), [fechas, agencia, busquedaAplicada]);

    useEffect(() => {
        const id = ++solicitudActual.current;
        setCargando(true);
        setError("");
        setFacturaAbierta("");
        getVentaRefFacturas({ ...filtros, page: pagina, page_size: pageSize })
            .then((r) => { if (id === solicitudActual.current) setRespuesta(r); })
            .catch((e) => {
                if (id === solicitudActual.current) {
                    setRespuesta({ count: 0, results: [], metricas: {}, analisis: { agencias: [], areas: [] } });
                    setError(e?.message || "No se pudieron cargar las ventas.");
                }
            })
            .finally(() => { if (id === solicitudActual.current) setCargando(false); });
        return () => { solicitudActual.current += 1; };
    }, [filtros, pagina, pageSize, version]);

    const facturas = respuesta?.results || [];
    const metricas = respuesta?.metricas || {};
    const analisis = respuesta?.analisis || { agencias: [], areas: [] };
    const totalPaginas = Math.max(1, Math.ceil(Number(respuesta?.count || 0) / pageSize));
    const distribucion = agencia ? (analisis.areas || []) : (analisis.agencias || []);
    const datosGrafica = distribucion.filter((f) => Number(f.total) > 0).map((f) => ({
        type: agencia ? f.area : f.agencia, value: Number(f.total),
    }));
    const totalDistribucion = datosGrafica.reduce((suma, f) => suma + f.value, 0);
    const hayImportesNegativos = distribucion.some((f) => Number(f.total) < 0);

    function cambiarFiltros(cambios) {
        if (Object.hasOwn(cambios, "agencia")) setAgencia(cambios.agencia);
        if (Object.hasOwn(cambios, "anio")) setAnio(cambios.anio);
        if (Object.hasOwn(cambios, "mes")) setMes(cambios.mes);
        if (Object.hasOwn(cambios, "busqueda")) setBusqueda(cambios.busqueda);
        setPagina(1);
    }

    function actualizar() {
        setDetalles({});
        setVersion((anterior) => anterior + 1);
    }

    async function desplegarFactura(factura) {
        const clave = claveFactura(factura);
        if (facturaAbierta === clave) { setFacturaAbierta(""); return; }
        setFacturaAbierta(clave);
        if (detalles[clave]) return;
        setCargandoDetalles((anterior) => ({ ...anterior, [clave]: true }));
        setErroresDetalles((anterior) => ({ ...anterior, [clave]: "" }));
        try {
            const r = await getVentaRefPiezas({ agencia: factura.agencia, serie: factura.serie, nrnota: factura.nrnota, fecha: factura.fecha });
            setDetalles((anterior) => ({ ...anterior, [clave]: r }));
        } catch (e) {
            setErroresDetalles((anterior) => ({ ...anterior, [clave]: e?.message || "No se pudo consultar el detalle." }));
        } finally {
            setCargandoDetalles((anterior) => ({ ...anterior, [clave]: false }));
        }
    }

    async function exportarExcel() {
        if (exportando || !Number(respuesta?.count)) return;
        setExportando("excel");
        try {
            const libro = new ExcelJS.Workbook();
            const hoja = libro.addWorksheet("Ventas", { views: [{ state: "frozen", ySplit: 1 }] });
            hoja.columns = [
                { header: "Agencia", key: "agencia", width: 22 }, { header: "Serie", key: "serie", width: 12 },
                { header: "Nota", key: "nrnota", width: 15 }, { header: "Emisión", key: "fecha", width: 16 },
                { header: "Partidas", key: "partidas", width: 12 }, { header: "Piezas", key: "cantidad", width: 15 },
                { header: "Importe bruto", key: "importe_bruto", width: 19 }, { header: "Descuento", key: "descuento", width: 18 },
                { header: "Venta neta", key: "venta_neta", width: 19 }, { header: "ICMS", key: "impuesto_icms", width: 18 },
                { header: "Costo registrado", key: "costo_registrado", width: 19 },
            ];
            hoja.getRow(1).eachCell((celda) => {
                celda.font = { bold: true, color: { argb: "FFFFFFFF" } };
                celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF001E50" } };
            });
            const lote = 200;
            const paginas = Math.ceil(Number(respuesta.count) / lote);
            for (let indice = 1; indice <= paginas; indice++) {
                const r = await getVentaRefFacturas({ ...filtros, page: indice, page_size: lote, solo_detalle: 1 });
                const filas = r?.results || [];
                for (const f of filas) hoja.addRow({ ...f, fecha: f.fecha, cantidad: Number(f.cantidad), importe_bruto: Number(f.importe_bruto), descuento: Number(f.descuento), venta_neta: Number(f.venta_neta), impuesto_icms: Number(f.impuesto_icms), costo_registrado: Number(f.costo_registrado) });
                if (!filas.length) break;
            }
            for (const columna of [7, 8, 9, 10, 11]) hoja.getColumn(columna).numFmt = '"$"#,##0.00';
            hoja.autoFilter = { from: "A1", to: "K1" };
            const buffer = await libro.xlsx.writeBuffer();
            const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
            const enlace = document.createElement("a");
            enlace.href = url;
            enlace.download = `ventas_refacciones_${anio}_${mes === null ? "anual" : MESES[mes].toLowerCase()}.xlsx`;
            enlace.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            alert(`No se pudo generar el Excel: ${e.message}`);
        } finally {
            setExportando("");
        }
    }

    function exportarPDF() {
        if (exportando || !facturas.length) return;
        setExportando("pdf");
        try {
            const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
            pdf.setFontSize(15);
            pdf.text("Reporte de ventas de refacciones", 14, 15);
            pdf.setFontSize(9);
            pdf.text(`Agencia: ${agencia || "Todas"}  |  ${fechaMX(fechas.fecha_desde)} - ${fechaMX(fechas.fecha_hasta)}  |  Página ${pagina} de ${totalPaginas}`, 14, 22);
            autoTable(pdf, {
                startY: 28,
                head: [["Agencia", "Serie", "Nota", "Fecha", "Partidas", "Piezas", "Bruto", "Descuento", "Venta neta", "ICMS"]],
                body: facturas.map((f) => [f.agencia, f.serie, f.nrnota, fechaMX(f.fecha), f.partidas, numero(f.cantidad), dinero(f.importe_bruto), dinero(f.descuento), dinero(f.venta_neta), dinero(f.impuesto_icms)]),
                styles: { fontSize: 7 }, headStyles: { fillColor: [0, 30, 80] },
            });
            pdf.save(`ventas_refacciones_pagina_${pagina}.pdf`);
        } catch (e) {
            alert(`No se pudo generar el PDF: ${e.message}`);
        } finally {
            setExportando("");
        }
    }

    return (
        <div className="min-h-screen w-full space-y-4 bg-white p-3 text-slate-800 md:p-5 font-vw-text">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl font-extrabold text-[#001E50] font-vw-head">Venta de Refacciones</h1>
                    <p className="text-xs text-slate-500">Monitor de ventas, facturación y partidas por agencia</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={exportarExcel} disabled={cargando || exportando || !respuesta.count} className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 disabled:opacity-40"><FileSpreadsheet size={15} />{exportando === "excel" ? "Generando..." : "Exportar Excel"}</button>
                    <button onClick={exportarPDF} disabled={cargando || exportando || !facturas.length} className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 disabled:opacity-40"><FileText size={15} />PDF página</button>
                    <button onClick={actualizar} disabled={cargando} className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-[#001E50] disabled:opacity-40"><RefreshCw size={15} className={cargando ? "animate-spin" : ""} />Actualizar</button>
                </div>
            </header>

            <section className="flex flex-wrap gap-2">
                <button onClick={() => cambiarFiltros({ agencia: "" })} className={`rounded-full px-4 py-1.5 text-xs font-bold ${!agencia ? "bg-[#001E50] text-white" : "border border-slate-200 text-[#001E50]"}`}>Todas las agencias</button>
                {opciones.map((item) => <button key={item} onClick={() => cambiarFiltros({ agencia: agencia === item ? "" : item })} className={`rounded-full px-4 py-1.5 text-xs font-bold ${agencia === item ? "bg-[#001E50] text-white" : "border border-slate-200 text-[#001E50] hover:bg-slate-50"}`}>{item}</button>)}
            </section>

            <section className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 lg:flex-row lg:items-center">
                <div className="relative shrink-0">
                    <select value={anio} onChange={(e) => cambiarFiltros({ anio: Number(e.target.value) })} className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-bold text-[#001E50]">
                        {Array.from({ length: 5 }, (_, i) => anioActual - i).map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2 top-2 text-slate-500" />
                </div>
                <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
                    <button onClick={() => cambiarFiltros({ mes: null })} className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold ${mes === null ? "bg-[#001E50] text-white" : "border border-slate-200 text-slate-600"}`}>{mes === null ? <Check size={12} /> : <Plus size={12} />}Todo el año</button>
                    {MESES.map((nombre, indice) => <button key={nombre} disabled={anio === anioActual && indice > mesActual} onClick={() => cambiarFiltros({ mes: mes === indice ? null : indice })} className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-30 ${mes === indice ? "bg-[#001E50] text-white" : "border border-slate-200 text-slate-600"}`}>{mes === indice ? <Check size={12} /> : <Plus size={12} />}{nombre.toLowerCase()}</button>)}
                </div>
                <div className="relative w-full shrink-0 lg:w-60">
                    <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <input value={busqueda} onChange={(e) => cambiarFiltros({ busqueda: e.target.value })} placeholder="Buscar nota o serie" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs outline-none focus:border-[#1677FF]" />
                    {busqueda && <button onClick={() => cambiarFiltros({ busqueda: "" })} className="absolute right-2 top-2 text-slate-500"><X size={15} /></button>}
                </div>
            </section>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Indicador titulo="Venta neta de partidas" valor={compacto(metricas.venta_neta)} descripcion="Suma de VrLiqItem" principal />
                <Indicador titulo="Facturas" valor={numero(metricas.facturas)} descripcion={`${numero(metricas.partidas)} partidas`} />
                <Indicador titulo="Piezas vendidas" valor={numero(metricas.cantidad_total)} descripcion="Cantidad acumulada" />
                <Indicador titulo="Impuesto registrado (ICMS)" valor={compacto(metricas.impuesto_icms)} descripcion={`Descuentos: ${dinero(metricas.descuento)}`} />
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-sm font-bold text-[#001E50] font-vw-head">{agencia ? "Venta neta por área" : "Venta neta por agencia"}</h2>
                    {cargando ? <div className="flex h-48 items-center justify-center"><LoaderCircle className="animate-spin text-blue-600" /></div> : datosGrafica.length ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="h-48"><Pie data={datosGrafica} angleField="value" colorField="type" innerRadius={0.62} legend={false} scale={{ color: { range: COLORES } }} label={false} /></div>
                            <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
                                {datosGrafica.map((item, i) => <div key={item.type} className="border-b border-slate-100 pb-1 text-xs"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORES[i % COLORES.length] }} /><span className="min-w-0 flex-1 truncate font-semibold" title={item.type}>{item.type}</span><span className="font-bold text-[#001E50]">{compacto(item.value)}</span></div><div className="pl-4 text-right text-[10px] text-blue-600">{totalDistribucion ? ((item.value / totalDistribucion) * 100).toFixed(1) : 0}%</div></div>)}
                            </div>
                        </div>
                    ) : <p className="py-12 text-center text-xs text-slate-400">Sin registros en el periodo</p>}
                    {hayImportesNegativos && <p className="mt-2 text-[10px] text-amber-700">El gráfico circular omite importes negativos; los totales SQL sí los incluyen.</p>}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 shadow-sm">
                    <h2 className="mb-3 text-sm font-bold text-[#001E50] font-vw-head">Áreas por importe vendido</h2>
                    <div className="max-h-48 space-y-3 overflow-y-auto pr-2">
                        {(analisis.areas || []).map((area) => <div key={area.area} className="text-xs"><div className="mb-1 flex justify-between gap-2"><span className="font-bold text-[#001E50]">{area.area}</span><span>{dinero(area.total)}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#1677FF]" style={{ width: `${Number(metricas.venta_neta) > 0 ? Math.min(100, Math.max(0, (Number(area.total) / Number(metricas.venta_neta)) * 100)) : 0}%` }} /></div></div>)}
                        {!cargando && !analisis.areas?.length && <p className="py-8 text-center text-xs text-slate-400">Sin áreas registradas</p>}
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between bg-[#F8FAFC] px-4 py-3"><h2 className="text-sm font-bold text-[#001E50] font-vw-head">Facturas de venta</h2><span className="text-xs text-slate-500">{numero(respuesta?.count)} facturas</span></div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-xs">
                        <thead className="bg-slate-100 text-[#001E50]"><tr>{["", "Agencia", "Serie", "Nota", "Fecha", "Partidas", "Piezas", "Importe bruto", "Descuento", "Venta neta", "ICMS"].map((t, i) => <th key={i} className={`px-3 py-3 ${i > 4 ? "text-right" : "text-left"}`}>{t}</th>)}</tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {cargando && <tr><td colSpan={11} className="py-12 text-center"><LoaderCircle size={24} className="mx-auto animate-spin text-blue-600" /></td></tr>}
                            {!cargando && !facturas.length && <tr><td colSpan={11} className="py-12 text-center text-slate-400">No se encontraron facturas</td></tr>}
                            {!cargando && facturas.map((f) => {
                                const clave = claveFactura(f);
                                const abierta = facturaAbierta === clave;
                                const piezas = detalles[clave]?.results || [];
                                return <Fragment key={clave}>
                                    <tr className={abierta ? "bg-blue-50/50" : "hover:bg-slate-50"}>
                                        <td className="px-3 py-3"><button aria-label={`Detalle de nota ${f.nrnota}`} onClick={() => desplegarFactura(f)} className="rounded-full bg-blue-50 p-1.5 text-blue-600">{abierta ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button></td>
                                        <td className="px-3 py-3 font-bold text-[#001E50]">{f.agencia}</td>
                                        <td className="px-3 py-3">{f.serie || "—"}</td>
                                        <td className="px-3 py-3 font-bold text-blue-600">{f.nrnota}</td>
                                        <td className="px-3 py-3">{fechaMX(f.fecha)}</td>
                                        <td className="px-3 py-3 text-right">{numero(f.partidas)}</td>
                                        <td className="px-3 py-3 text-right">{numero(f.cantidad)}</td>
                                        <td className="px-3 py-3 text-right">{dinero(f.importe_bruto)}</td>
                                        <td className="px-3 py-3 text-right">{dinero(f.descuento)}</td>
                                        <td className="px-3 py-3 text-right font-bold text-[#001E50]">{dinero(f.venta_neta)}</td>
                                        <td className="px-3 py-3 text-right">{dinero(f.impuesto_icms)}</td>
                                    </tr>
                                    {abierta && <tr><td colSpan={11} className="bg-slate-50 p-4"><div className="rounded-xl border border-slate-200 bg-white p-3">
                                        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold text-[#001E50]"><PackageSearch size={16} />Piezas de la nota {f.nrnota}</h3>
                                        {cargandoDetalles[clave] && <p className="py-3 text-xs text-slate-500">Cargando piezas...</p>}
                                        {erroresDetalles[clave] && <p className="py-3 text-xs text-red-600">{erroresDetalles[clave]} <button className="underline" onClick={() => desplegarFactura(f)}>Cerrar</button></p>}
                                        {!cargandoDetalles[clave] && detalles[clave] && <div className="overflow-x-auto"><table className="w-full min-w-[1150px] text-[11px]">
                                            <thead className="bg-slate-100 text-[#001E50]"><tr>{["Seq.", "Código", "Producto", "Área", "Sector", "Vendedor", "Cantidad", "Precio", "Bruto", "Descuento", "Neto", "ICMS", "Costo"].map((titulo) => <th key={titulo} className="px-2 py-2 text-left">{titulo}</th>)}</tr></thead>
                                            <tbody className="divide-y divide-slate-100">{piezas.map((p, i) => <tr key={`${p.rowid__ ?? ""}-${i}`} className="hover:bg-slate-50">
                                                <td className="px-2 py-2">{p.secuencia ?? "—"}</td><td className="px-2 py-2 font-bold">{p.codigo_producto?.trim() || "—"}</td>
                                                <td className="px-2 py-2">{p.nombre_producto || "Sin descripción"}</td><td className="px-2 py-2">{p.descripcion_area || p.codigo_area || "—"}</td>
                                                <td className="px-2 py-2">{p.descripcion_sector || p.codigo_sector || "—"}</td><td className="px-2 py-2">{p.nombre_funcionario || "—"}</td>
                                                <td className="px-2 py-2 text-right">{numero(p.cantidad)}</td><td className="px-2 py-2 text-right">{dinero(p.precio_unitario)}</td>
                                                <td className="px-2 py-2 text-right">{dinero(p.importe_bruto)}</td><td className="px-2 py-2 text-right">{dinero(p.descuento)}</td>
                                                <td className="px-2 py-2 text-right font-bold">{dinero(p.venta_neta)}</td><td className="px-2 py-2 text-right">{dinero(p.impuesto_icms)}</td>
                                                <td className="px-2 py-2 text-right">{dinero(p.costo_registrado)}</td>
                                            </tr>)}</tbody>
                                            <tfoot className="bg-slate-100 font-bold text-[#001E50]"><tr><td colSpan={6} className="px-2 py-2 text-right">Total de partidas ({piezas.length})</td><td className="px-2 py-2 text-right">{numero(detalles[clave]?.resumen?.cantidad_total)}</td><td colSpan={3}></td><td className="px-2 py-2 text-right">{dinero(detalles[clave]?.resumen?.venta_neta)}</td><td className="px-2 py-2 text-right">{dinero(detalles[clave]?.resumen?.impuesto_icms)}</td><td></td></tr></tfoot>
                                        </table></div>}
                                        {!cargandoDetalles[clave] && detalles[clave] && !piezas.length && <p className="py-4 text-xs text-slate-400">Sin piezas para esta factura.</p>}
                                    </div></td></tr>}
                                </Fragment>;
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-xs">
                <span className="font-semibold text-slate-600">Total: {numero(respuesta?.count)} facturas · Página {pagina} de {totalPaginas}</span>
                <div className="flex items-center gap-2">
                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPagina(1); }} className="rounded-full border border-slate-200 px-3 py-2 text-[#001E50]">{[25, 50, 100, 200].map((valor) => <option key={valor} value={valor}>{valor} por página</option>)}</select>
                    <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1 || cargando} className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 disabled:opacity-40"><ChevronLeft size={14} />Anterior</button>
                    <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina >= totalPaginas || cargando} className="flex items-center gap-1 rounded-full bg-[#001E50] px-3 py-2 text-white disabled:opacity-40">Siguiente<ChevronRight size={14} /></button>
                </div>
            </footer>
            <p className="text-[10px] text-slate-500">Venta neta = suma de VrLiqItem. ICMS = suma de VrICMS según el origen. No se calcula ni se asume un total fiscal de factura.</p>
        </div>
    );
}

function Indicador({ titulo, valor, descripcion, principal = false }) {
    return <article className={`rounded-2xl border p-4 shadow-sm ${principal ? "border-[#001E50] bg-[#001E50] text-white" : "border-slate-200 bg-[#F8FAFC] text-[#001E50]"}`}>
        <p className={`text-xs font-semibold ${principal ? "text-blue-100" : "text-slate-500"}`}>{titulo}</p>
        <p className="my-2 text-2xl font-extrabold font-vw-head">{valor}</p>
        <p className={`text-[11px] ${principal ? "text-blue-100" : "text-slate-500"}`}>{descripcion}</p>
    </article>;
}
