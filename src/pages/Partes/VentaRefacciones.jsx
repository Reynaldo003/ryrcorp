// src/pages/Partes/VentaRefacciones.jsx
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
    Check, ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet,
    FileText, LoaderCircle, PackageSearch, Plus, RefreshCw, Search, X,
} from "lucide-react";
import { Column } from "@ant-design/plots";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
    getVentaRefFacturas, getVentaRefOpciones, getVentaRefPiezas,
    getVentaRefAnalisis,
} from "../../lib/apiVentaRef";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const dinero = (valor) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(valor) || 0);
const numero = (valor) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(Number(valor) || 0);
const fechaMX = (valor) => valor ? String(valor).slice(0, 10).split("-").reverse().join("/") : "—";
const claveFactura = (f) => [f.agencia, f.serie, f.nrnota, f.fecha].join("|");
const VACIO = { results: [], count: 0, metricas: {} };
const SIN_ANALISIS = { lineas: [], clientes: [] };

function Indicador({ titulo, valor, descripcion, principal = false }) {
    return (
        <article className={`min-w-0 rounded-xl border p-3 shadow-sm ${principal ? "border-[#001E50] bg-[#001E50] text-white" : "border-slate-200 bg-slate-50 text-[#001E50]"}`}>
            <p className={`text-xs font-semibold ${principal ? "text-blue-100" : "text-slate-500"}`}>{titulo}</p>
            <p className="my-1 break-words text-xl font-extrabold tabular-nums">{valor}</p>
            {descripcion && <p className={`text-[11px] ${principal ? "text-blue-100" : "text-slate-500"}`}>{descripcion}</p>}
        </article>
    );
}

function GraficaVentas({ titulo, datos = [], cargando, error, mensaje }) {
    const grafica = datos
        .filter((f) => Number(f.ventas) > 0)
        .map((f) => ({
            nombreCompleto: String(f.nombre || ""),
            nombre: String(f.nombre || "").length > 16
                ? `${String(f.nombre).slice(0, 16)}...`
                : String(f.nombre || ""),
            valor: Number(f.ventas),
        }));

    const granTotal = datos.length
        ? Number(datos[0].total_grupo)
        : 0;

    return (
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex flex-wrap justify-between gap-2">
                <h2 className="text-sm font-extrabold text-[#001E50]">
                    {titulo}
                </h2>
                <span className="text-[11px] text-slate-500">
                    Top 8
                </span>
            </div>

            {mensaje && (
                <p className="py-10 text-center text-xs text-slate-500">
                    {mensaje}
                </p>
            )}

            {!mensaje && cargando && (
                <div className="flex h-72 items-center justify-center">
                    <LoaderCircle className="animate-spin text-blue-600" />
                </div>
            )}

            {!mensaje && !cargando && error && (
                <p className="py-7 text-xs text-red-600">
                    {error}
                </p>
            )}

            {!mensaje && !cargando && !error && !datos.length && (
                <p className="py-7 text-center text-xs text-slate-400">
                    Sin resultados.
                </p>
            )}

            {!mensaje && !cargando && !error && grafica.length > 0 && (
                <div className="h-80 overflow-x-auto">
                    <Column
                        data={grafica}
                        xField="nombre"
                        yField="valor"
                        colorField="nombre"
                        scale={{
                            color: {
                                range: ["#001E50", "#1677FF", "#0EA5E9", "#38BDF8"]
                            }
                        }}
                        axis={{
                            x: {
                                labelAutoHide: false,
                                labelAutoRotate: true,
                            },
                            y: {
                                labelFormatter: (v) => numero(v),
                            }
                        }}
                        tooltip={{
                            title: (d) => d.nombreCompleto,
                            items: [
                                (d) => ({
                                    name: "Ventas",
                                    value: dinero(d.valor),
                                }),
                            ],
                        }}
                        legend={false}
                        label={false}
                        animation={false}
                        style={{
                            radiusTopLeft: 6,
                            radiusTopRight: 6,
                        }}
                    />
                </div>
            )}

            {!mensaje && !cargando && !error && datos.length > 0 && (
                <>
                    <div className="max-h-56 overflow-auto rounded-md border border-slate-100">
                        <table className="w-full min-w-[580px] text-[11px]">
                            <thead className="sticky top-0 bg-[#001E50] text-white">
                                <tr>
                                    <th className="px-2 py-2 text-left">Nombre</th>
                                    <th className="px-2 py-2 text-right">Ítems</th>
                                    <th className="px-2 py-2 text-right">Piezas</th>
                                    <th className="px-2 py-2 text-right">Ventas</th>
                                    <th className="px-2 py-2 text-right">%TG</th>
                                    <th className="px-2 py-2 text-right">U.B.</th>
                                    <th className="px-2 py-2 text-right">M.B.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {datos.map((fila, i) => (
                                    <tr
                                        key={`${fila.codigo}-${i}`}
                                        className="odd:bg-slate-50"
                                    >
                                        <td
                                            className="max-w-44 truncate px-2 py-1.5 font-medium"
                                            title={fila.nombre}
                                        >
                                            {fila.nombre}
                                        </td>
                                        <td className="px-2 py-1.5 text-right">
                                            {numero(fila.items)}
                                        </td>
                                        <td className="px-2 py-1.5 text-right">
                                            {numero(fila.piezas)}
                                        </td>
                                        <td className="px-2 py-1.5 text-right">
                                            {dinero(fila.ventas)}
                                        </td>
                                        <td className="px-2 py-1.5 text-right">
                                            {numero(fila.porcentaje_total)}%
                                        </td>
                                        <td className="px-2 py-1.5 text-right">
                                            {dinero(fila.utilidad_bruta)}
                                        </td>
                                        <td className="px-2 py-1.5 text-right">
                                            {numero(fila.margen_bruto)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500">
                        Venta total del periodo (todas las categorías):{" "}
                        <strong>{dinero(granTotal)}</strong>. La tabla solo muestra el Top 8.
                    </p>
                </>
            )}
        </section>
    );
}
export default function VentaRefacciones() {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth();
    const [anio, setAnio] = useState(anioActual);
    const [mes, setMes] = useState(mesActual); // Inicio mensual para evitar una consulta anual costosa.
    const [agencia, setAgencia] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [busquedaAplicada, setBusquedaAplicada] = useState("");
    const [opciones, setOpciones] = useState([]);
    const [pagina, setPagina] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [version, setVersion] = useState(0);
    const [respuesta, setRespuesta] = useState(VACIO);
    const [filtrosListos, setFiltrosListos] = useState("");
    const [analisis, setAnalisis] = useState(SIN_ANALISIS);
    const [cargando, setCargando] = useState(true);
    const [cargandoGraficas, setCargandoGraficas] = useState(false);
    const [error, setError] = useState("");
    const [errorGraficas, setErrorGraficas] = useState("");
    const [facturaAbierta, setFacturaAbierta] = useState("");
    const [detalles, setDetalles] = useState({});
    const [cargandoDetalles, setCargandoDetalles] = useState({});
    const [erroresDetalles, setErroresDetalles] = useState({});
    const [exportando, setExportando] = useState("");
    const solicitudLista = useRef(0);
    const solicitudGraficas = useRef(0);

    useEffect(() => {
        const espera = setTimeout(() => setBusquedaAplicada(busqueda.trim()), 400);
        return () => clearTimeout(espera);
    }, [busqueda]);

    useEffect(() => {
        getVentaRefOpciones()
            .then((r) => setOpciones(Array.isArray(r?.agencias) ? r.agencias : []))
            .catch((e) => console.error("No se pudieron cargar las agencias:", e));
    }, []);

    const fechas = useMemo(() => {
        const pad = (valor) => String(valor).padStart(2, "0");
        if (mes === null) return { fecha_desde: `${anio}-01-01`, fecha_hasta: `${anio}-12-31` };
        const ultimoDia = new Date(anio, mes + 1, 0).getDate();
        return { fecha_desde: `${anio}-${pad(mes + 1)}-01`, fecha_hasta: `${anio}-${pad(mes + 1)}-${pad(ultimoDia)}` };
    }, [anio, mes]);

    const filtros = useMemo(() => ({
        ...fechas, agencia: agencia || undefined, q: busquedaAplicada || undefined,
    }), [fechas, agencia, busquedaAplicada]);
    const claveFiltros = useMemo(() => `${version}|${JSON.stringify(filtros)}`, [filtros, version]);

    useEffect(() => {
        const id = ++solicitudLista.current;
        setCargando(true);
        setError("");
        setFacturaAbierta("");
        getVentaRefFacturas({ ...filtros, page: pagina, page_size: pageSize })
            .then((datos) => {
                if (id === solicitudLista.current) {
                    setRespuesta(datos);
                    setFiltrosListos(claveFiltros); // Después de facturas se permite iniciar análisis.
                }
            })
            .catch((e) => {
                if (id === solicitudLista.current) {
                    setRespuesta(VACIO);
                    setFiltrosListos("");
                    setError(e?.message || "No se pudieron cargar las facturas.");
                }
            })
            .finally(() => { if (id === solicitudLista.current) setCargando(false); });
        return () => { solicitudLista.current += 1; };
    }, [filtros, pagina, pageSize, version, claveFiltros]);

    useEffect(() => {
        const id = ++solicitudGraficas.current;

        setAnalisis(SIN_ANALISIS);
        setErrorGraficas("");

        // Solo exigir un mes y esperar a que terminen las facturas.
        // La agencia puede estar vacía para consultar todas.
        if (mes === null || filtrosListos !== claveFiltros) {
            setCargandoGraficas(false);
            return;
        }

        setCargandoGraficas(true);

        getVentaRefAnalisis(filtros)
            .then((resultado) => {
                if (id === solicitudGraficas.current) {
                    setAnalisis(resultado);
                }
            })
            .catch((error) => {
                if (id === solicitudGraficas.current) {
                    setErrorGraficas(
                        error?.message || "No fue posible cargar las gráficas."
                    );
                }
            })
            .finally(() => {
                if (id === solicitudGraficas.current) {
                    setCargandoGraficas(false);
                }
            });

        return () => {
            solicitudGraficas.current += 1;
        };
    }, [filtros, mes, filtrosListos, claveFiltros]);

    const facturas = respuesta?.results || [];
    const metricas = respuesta?.metricas || {};
    const totalPaginas = Math.max(1, Math.ceil(Number(respuesta?.count || 0) / pageSize));
    const avisoGraficas = !agencia ? "Selecciona una agencia para consultar las gráficas." : mes === null ? "Selecciona un mes; las gráficas están limitadas a periodos mensuales." : "";

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
        if (detalles[clave] || cargandoDetalles[clave]) return;
        setCargandoDetalles((a) => ({ ...a, [clave]: true }));
        setErroresDetalles((a) => ({ ...a, [clave]: "" }));
        try {
            const datos = await getVentaRefPiezas({ agencia: factura.agencia, serie: factura.serie, nrnota: factura.nrnota, fecha: factura.fecha });
            setDetalles((a) => ({ ...a, [clave]: datos }));
        } catch (e) {
            setErroresDetalles((a) => ({ ...a, [clave]: e?.message || "Error consultando piezas." }));
        } finally {
            setCargandoDetalles((a) => ({ ...a, [clave]: false }));
        }
    }

    async function exportarExcel() {
        if (exportando || !Number(respuesta?.count)) return;
        setExportando("excel");
        try {
            const libro = new ExcelJS.Workbook();
            const hoja = libro.addWorksheet("Facturas", { views: [{ state: "frozen", ySplit: 1 }] });
            hoja.columns = [
                { header: "Agencia", key: "agencia", width: 21 },
                { header: "Serie", key: "serie", width: 12 },
                { header: "Nota", key: "nrnota", width: 13 },
                { header: "Fecha", key: "fecha", width: 16 },
                { header: "Cliente", key: "cliente", width: 38 },
                { header: "Partidas", key: "partidas", width: 13 },
                { header: "Piezas", key: "cantidad", width: 13 },
                { header: "Bruto", key: "importe_bruto", width: 20 },
                { header: "Descuentos", key: "descuento", width: 20 },
                { header: "Venta neta", key: "venta_neta", width: 20 },
                { header: "Costo", key: "costo_registrado", width: 20 },
                { header: "Utilidad bruta", key: "utilidad_bruta", width: 20 },
            ];
            hoja.getRow(1).eachCell((c) => {
                c.font = { bold: true, color: { argb: "FFFFFFFF" } };
                c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF001E50" } };
            });
            // Exportar solo la página visible: no repetir la consulta pesada por cada lote.
            for (const fila of facturas) {
                hoja.addRow({
                    ...fila, cantidad: Number(fila.cantidad), importe_bruto: Number(fila.importe_bruto),
                    descuento: Number(fila.descuento), venta_neta: Number(fila.venta_neta),
                    costo_registrado: Number(fila.costo_registrado), utilidad_bruta: Number(fila.utilidad_bruta),
                });
            }
            for (const columna of [8, 9, 10, 11, 12]) hoja.getColumn(columna).numFmt = '"$"#,##0.00';
            hoja.autoFilter = { from: "A1", to: "L1" };
            const buffer = await libro.xlsx.writeBuffer();
            const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
            const enlace = document.createElement("a");
            enlace.href = url;
            enlace.download = `venta_refacciones_pagina_${pagina}_${anio}_${mes === null ? "anual" : MESES[mes].toLowerCase()}.xlsx`;
            enlace.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            alert(`Error al exportar Excel: ${e.message}`);
        } finally {
            setExportando("");
        }
    }

    function exportarPDF() {
        if (exportando || !facturas.length) return;
        setExportando("pdf");
        try {
            const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
            pdf.setFontSize(14);
            pdf.text("Ventas de refacciones", 14, 15);
            pdf.setFontSize(9);
            pdf.text(`${agencia || "Todas las agencias"} · ${fechaMX(fechas.fecha_desde)} al ${fechaMX(fechas.fecha_hasta)} · Página ${pagina}`, 14, 22);
            autoTable(pdf, {
                startY: 28,
                head: [["Agencia", "Serie", "Nota", "Fecha", "Cliente", "Piezas", "Venta neta", "Costo", "Utilidad"]],
                body: facturas.map((f) => [f.agencia, f.serie, f.nrnota, fechaMX(f.fecha), f.cliente, numero(f.cantidad), dinero(f.venta_neta), dinero(f.costo_registrado), dinero(f.utilidad_bruta)]),
                styles: { fontSize: 7 }, headStyles: { fillColor: [0, 30, 80] },
            });
            pdf.save(`venta_refacciones_pagina_${pagina}.pdf`);
        } catch (e) {
            alert(`Error al exportar PDF: ${e.message}`);
        } finally {
            setExportando("");
        }
    }

    return (
        <div className="min-h-screen w-full space-y-4 bg-white p-3 text-slate-800 md:p-5 font-vw-text">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                    <h1 className="text-xl font-extrabold text-[#001E50] font-vw-head">Venta de Refacciones</h1>
                    <p className="text-xs text-slate-500">Ventas netas, costos y utilidad bruta</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={exportarExcel} disabled={cargando || exportando || !respuesta.count} className="flex items-center gap-2 rounded-full border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-40"><FileSpreadsheet size={15} />{exportando === "excel" ? "Generando..." : "Excel"}</button>
                    <button onClick={exportarPDF} disabled={cargando || exportando || !facturas.length} className="flex items-center gap-2 rounded-full border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-40"><FileText size={15} />PDF página</button>
                    <button onClick={actualizar} disabled={cargando} className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-[#001E50] disabled:opacity-40"><RefreshCw size={15} className={cargando ? "animate-spin" : ""} />Actualizar</button>
                </div>
            </header>

            <div className="flex flex-wrap gap-2">
                <button onClick={() => cambiarFiltros({ agencia: "" })} className={`rounded-full px-3 py-1.5 text-xs font-bold ${!agencia ? "bg-[#001E50] text-white" : "border border-slate-200"}`}>Todas las agencias</button>
                {opciones.map((item) => <button key={item} onClick={() => cambiarFiltros({ agencia: item })} className={`rounded-full px-3 py-1.5 text-xs font-bold ${agencia === item ? "bg-[#001E50] text-white" : "border border-slate-200 text-[#001E50]"}`}>{item}</button>)}
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3">
                <div className="relative">
                    <select value={anio} onChange={(e) => cambiarFiltros({ anio: Number(e.target.value) })} className="appearance-none rounded-lg border border-slate-200 px-3 py-2 pr-8 text-xs font-bold">
                        {Array.from({ length: 5 }, (_, i) => anioActual - i).map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2 top-2.5" />
                </div>
                <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
                    <button onClick={() => cambiarFiltros({ mes: null })} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${mes === null ? "bg-[#001E50] text-white" : "border border-slate-200"}`}>{mes === null ? <Check size={12} className="inline" /> : <Plus size={12} className="inline" />} Todo el año</button>
                    {MESES.map((nombre, indice) => {
                        const esMesFuturo =
                            anio === anioActual && indice > mesActual;

                        return (
                            <button
                                key={nombre}
                                type="button"
                                disabled={esMesFuturo}
                                onClick={() => {
                                    if (!esMesFuturo) {
                                        cambiarFiltros({ mes: indice });
                                    }
                                }}
                                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition ${esMesFuturo
                                    ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 opacity-60"
                                    : mes === indice
                                        ? "bg-[#001E50] text-white"
                                        : "border border-slate-200 text-[#001E50] hover:bg-slate-50"
                                    }`}
                                title={
                                    esMesFuturo
                                        ? "Mes bloqueado porque aún no hay información disponible."
                                        : nombre
                                }
                            >
                                {nombre.toLowerCase()}
                            </button>
                        );
                    })}
                </div>
                <div className="relative w-full sm:w-48">
                    <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <input value={busqueda} onChange={(e) => cambiarFiltros({ busqueda: e.target.value })} placeholder="Buscar nota o serie" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-8 text-xs" />
                    {busqueda && <button onClick={() => cambiarFiltros({ busqueda: "" })} className="absolute right-2 top-2"><X size={15} /></button>}
                </div>
            </div>

            {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
            <section className="grid grid-cols-2 gap-2 xl:grid-cols-5">
                <Indicador principal titulo="Venta neta" valor={dinero(metricas.venta_neta)} descripcion="Valor de refacciones" />
                <Indicador titulo="Costo de venta" valor={dinero(metricas.costo_registrado)} />
                <Indicador titulo="Utilidad bruta" valor={dinero(metricas.utilidad_bruta)} descripcion="Venta neta − costo" />
                <Indicador titulo="Margen bruto" valor={`${numero(metricas.margen_utilidad)}%`} descripcion="Utilidad / venta neta" />
                <Indicador titulo="Facturas" valor={numero(metricas.facturas)} descripcion={`${numero(metricas.cantidad_total)} piezas · ${numero(metricas.partidas)} partidas`} />
            </section>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <GraficaVentas titulo="Ventas por línea" datos={analisis.lineas} cargando={cargandoGraficas} error={errorGraficas} />
                <GraficaVentas titulo="Ventas por cliente" datos={analisis.clientes} cargando={cargandoGraficas} error={errorGraficas} />
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                    <h2 className="text-sm font-bold text-[#001E50]">Facturas de venta</h2>
                    <span className="text-xs text-slate-500">{numero(respuesta?.count)} facturas</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px] text-xs">
                        <thead className="bg-slate-100 text-[#001E50]"><tr>
                            {['', 'Agencia', 'Serie', 'Nota', 'Fecha', 'Cliente', 'Partidas', 'Piezas', 'Bruto', 'Descuento', 'Venta neta', 'Costo', 'Utilidad'].map((titulo, i) => <th key={i} className={`px-3 py-2 ${i >= 6 ? "text-right" : "text-left"}`}>{titulo}</th>)}
                        </tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {cargando && <tr><td colSpan={13} className="py-12 text-center"><LoaderCircle className="mx-auto animate-spin text-blue-600" /></td></tr>}
                            {!cargando && !facturas.length && <tr><td colSpan={13} className="py-12 text-center text-slate-400">No se encontraron facturas.</td></tr>}
                            {!cargando && facturas.map((f) => {
                                const clave = claveFactura(f);
                                const abierta = facturaAbierta === clave;
                                const piezas = detalles[clave]?.results || [];
                                const resumen = detalles[clave]?.resumen || {};
                                return <Fragment key={clave}>
                                    <tr className={abierta ? "bg-blue-50" : "hover:bg-slate-50"}>
                                        <td className="px-3 py-2"><button onClick={() => desplegarFactura(f)} aria-label={`Ver nota ${f.nrnota}`} className="rounded-full bg-blue-50 p-1.5 text-blue-600">{abierta ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button></td>
                                        <td className="px-3 py-2 font-semibold">{f.agencia}</td>
                                        <td className="px-3 py-2">{f.serie || "—"}</td>
                                        <td className="px-3 py-2 text-blue-600">{f.nrnota}</td>
                                        <td className="px-3 py-2">{fechaMX(f.fecha)}</td>
                                        <td className="max-w-52 truncate px-3 py-2" title={f.cliente}>{f.cliente || "Sin cliente"}</td>
                                        <td className="px-3 py-2 text-right">{numero(f.partidas)}</td>
                                        <td className="px-3 py-2 text-right">{numero(f.cantidad)}</td>
                                        <td className="px-3 py-2 text-right">{dinero(f.importe_bruto)}</td>
                                        <td className="px-3 py-2 text-right">{dinero(f.descuento)}</td>
                                        <td className="px-3 py-2 text-right font-bold">{dinero(f.venta_neta)}</td>
                                        <td className="px-3 py-2 text-right">{dinero(f.costo_registrado)}</td>
                                        <td className="px-3 py-2 text-right font-semibold">{dinero(f.utilidad_bruta)}</td>
                                    </tr>
                                    {abierta && <tr><td colSpan={13} className="bg-slate-50 p-3">
                                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                                            <h3 className="mb-2 flex items-center gap-2 text-xs font-bold text-[#001E50]"><PackageSearch size={15} />Piezas de la nota {f.nrnota} · {f.cliente}</h3>
                                            {cargandoDetalles[clave] && <p className="py-3 text-xs">Cargando piezas...</p>}
                                            {erroresDetalles[clave] && <p className="py-3 text-xs text-red-600">{erroresDetalles[clave]}</p>}
                                            {!cargandoDetalles[clave] && detalles[clave] && <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-[11px]">
                                                <thead className="bg-slate-100 text-[#001E50]"><tr>{["Seq.", "Código", "Producto", "Área", "Sector", "Vendedor", "Cantidad", "Precio", "Bruto", "Descuento", "Neto", "Costo"].map((t) => <th key={t} className="px-2 py-2 text-left">{t}</th>)}</tr></thead>
                                                <tbody>{piezas.map((p, i) => <tr key={`${p.rowid__}-${i}`} className="border-b border-slate-100">
                                                    <td className="px-2 py-2">{p.secuencia ?? "—"}</td>
                                                    <td className="px-2 py-2">{p.codigo_producto}</td>
                                                    <td className="px-2 py-2">{p.nombre_producto || "—"}</td>
                                                    <td className="px-2 py-2">{p.codigo_area || "—"}</td>
                                                    <td className="px-2 py-2">{p.codigo_sector || "—"}</td>
                                                    <td className="px-2 py-2">{p.nombre_funcionario || p.codigo_funcionario || "—"}</td>
                                                    <td className="px-2 py-2 text-right">{numero(p.cantidad)}</td>
                                                    <td className="px-2 py-2 text-right">{dinero(p.precio_unitario)}</td>
                                                    <td className="px-2 py-2 text-right">{dinero(p.importe_bruto)}</td>
                                                    <td className="px-2 py-2 text-right">{dinero(p.descuento)}</td>
                                                    <td className="px-2 py-2 text-right">{dinero(p.venta_neta)}</td>
                                                    <td className="px-2 py-2 text-right">{dinero(p.costo_registrado)}</td>
                                                </tr>)}</tbody>
                                                <tfoot className="bg-slate-100 font-bold"><tr>
                                                    <td colSpan={10} className="px-2 py-2 text-right">Total</td>
                                                    <td className="px-2 py-2 text-right">{dinero(resumen.venta_neta)}</td>
                                                    <td className="px-2 py-2 text-right">{dinero(resumen.costo_registrado)}</td>
                                                </tr></tfoot>
                                            </table></div>}
                                        </div>
                                    </td></tr>}
                                </Fragment>;
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs">
                <span>Página {pagina} de {totalPaginas} · {numero(respuesta?.count)} facturas</span>
                <div className="flex items-center gap-2">
                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPagina(1); }} className="rounded-full border border-slate-200 px-2 py-1.5">{[25, 50, 100].map((tam) => <option key={tam} value={tam}>{tam} por página</option>)}</select>
                    <button disabled={pagina <= 1 || cargando} onClick={() => setPagina((p) => Math.max(1, p - 1))} className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 disabled:opacity-40"><ChevronLeft size={14} />Anterior</button>
                    <button disabled={pagina >= totalPaginas || cargando} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} className="flex items-center gap-1 rounded-full bg-[#001E50] px-3 py-1.5 text-white disabled:opacity-40">Siguiente<ChevronRight size={14} /></button>
                </div>
            </footer>
        </div>
    );
}
