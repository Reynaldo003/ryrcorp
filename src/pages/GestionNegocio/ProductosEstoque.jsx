import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Boxes,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Package,
    RefreshCw,
} from "lucide-react";

import { getProductosEstoque } from "../../lib/apiProductosEstoque";


const BRAND_BLUE = "#131E5C";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];


function numero(valor, decimales = 2) {
    const n = Number(valor);

    if (!Number.isFinite(n)) {
        return "0";
    }

    return n.toLocaleString("es-MX", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
    });
}


function moneda(valor) {
    const n = Number(valor);

    if (!Number.isFinite(n)) {
        return "$0.00";
    }

    return n.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}


function fecha(valor) {
    if (!valor) {
        return "—";
    }

    // SQL contiene fechas históricas como 0001-01-01.
    // Las mostramos como vacías porque no representan una fecha comercial útil.
    if (String(valor).startsWith("0001-01-01")) {
        return "—";
    }

    return String(valor).slice(0, 10);
}


export default function ProductosEstoque() {
    const [datos, setDatos] = useState([]);
    const [agencias, setAgencias] = useState([]);

    const [agencia, setAgencia] = useState("");
    const [pagina, setPagina] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const [total, setTotal] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");


    const cargarDatos = useCallback(async () => {
        setCargando(true);
        setError("");

        try {
            const respuesta = await getProductosEstoque({
                agencia: agencia || undefined,
                page: pagina,
                page_size: pageSize,
            });

            setDatos(
                Array.isArray(respuesta?.results)
                    ? respuesta.results
                    : []
            );

            setTotal(Number(respuesta?.count || 0));
            setTotalPaginas(Number(respuesta?.total_pages || 0));

            const opcionesAgencias = respuesta?.opciones?.agencias;

            if (Array.isArray(opcionesAgencias)) {
                setAgencias(opcionesAgencias);
            }
        } catch (err) {
            console.error("Error cargando Productos Estoque:", err);

            setDatos([]);
            setTotal(0);
            setTotalPaginas(0);

            setError(
                err?.message ||
                "No fue posible cargar los productos."
            );
        } finally {
            setCargando(false);
        }
    }, [agencia, pagina, pageSize]);


    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);


    const desde = useMemo(() => {
        if (!total) {
            return 0;
        }

        return (pagina - 1) * pageSize + 1;
    }, [pagina, pageSize, total]);


    const hasta = useMemo(() => {
        return Math.min(pagina * pageSize, total);
    }, [pagina, pageSize, total]);


    function cambiarAgencia(event) {
        setAgencia(event.target.value);
        setPagina(1);
    }


    function cambiarPageSize(event) {
        setPageSize(Number(event.target.value));
        setPagina(1);
    }


    return (
        <main className="min-h-screen bg-slate-50 px-4 py-5 md:px-6 lg:px-8">
            <div className="mx-auto max-w-[1800px]">

                {/* Encabezado */}
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div
                                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                                style={{ backgroundColor: BRAND_BLUE }}
                            >
                                <Boxes className="h-6 w-6" />
                            </div>

                            <div>
                                <h1
                                    className="text-2xl font-extrabold tracking-tight md:text-3xl"
                                    style={{ color: BRAND_BLUE }}
                                >
                                    Productos
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    Existencias de productos por agencia
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={cargarDatos}
                        disabled={cargando}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-bold text-[#131E5C] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ borderColor: `${BRAND_BLUE}33` }}
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${
                                cargando ? "animate-spin" : ""
                            }`}
                        />
                        Actualizar
                    </button>
                </div>


                {/* Controles */}
                <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">

                        <div className="w-full md:w-72">
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                Agencia
                            </label>

                            <select
                                value={agencia}
                                onChange={cambiarAgencia}
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#131E5C]"
                            >
                                <option value="">Todas las agencias</option>

                                {agencias.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full md:w-40">
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                Filas
                            </label>

                            <select
                                value={pageSize}
                                onChange={cambiarPageSize}
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#131E5C]"
                            >
                                {PAGE_SIZE_OPTIONS.map((cantidad) => (
                                    <option key={cantidad} value={cantidad}>
                                        {cantidad}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:ml-auto">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Registros
                            </div>

                            <div
                                className="mt-1 text-xl font-extrabold"
                                style={{ color: BRAND_BLUE }}
                            >
                                {total.toLocaleString("es-MX")}
                            </div>
                        </div>
                    </div>
                </div>


                {/* Error */}
                {error ? (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                        {error}
                    </div>
                ) : null}


                {/* Tabla */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                     <div className="max-h-[calc(100vh-420px)] min-h-[420px] overflow-auto">
                         <table className="min-w-[1850px] w-full border-collapse text-left text-xs">
                            <thead
                                className="sticky top-0 z-10 text-white"
                                style={{ backgroundColor: BRAND_BLUE }}
                            >
                                <tr>
                                    <th className="whitespace-nowrap px-4 py-3 font-bold">
                                        Agencia
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 font-bold">
                                        Código producto
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-right font-bold">
                                        Existencia
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-right font-bold">
                                        Valor estoque
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-right font-bold">
                                        Valor unitario medio
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-right font-bold">
                                        Reservada
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-right font-bold">
                                        Pedida
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-right font-bold">
                                        Reserva estratégica
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-right font-bold">
                                        Tránsito
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 font-bold">
                                        Última venta
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 font-bold">
                                        Última compra
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 font-bold">
                                        Último pedido
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 font-bold">
                                        Actualización
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {cargando ? (
                                    <tr>
                                        <td
                                            colSpan={13}
                                            className="px-4 py-16 text-center"
                                        >
                                            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Cargando productos...
                                            </div>
                                        </td>
                                    </tr>
                                ) : datos.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={13}
                                            className="px-4 py-16 text-center"
                                        >
                                            <Package className="mx-auto mb-3 h-8 w-8 text-slate-300" />

                                            <div className="text-sm font-bold text-slate-500">
                                                No se encontraron productos.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    datos.map((item, index) => (
                                        <tr
                                            key={`${item.agencia}-${item.rowid__}-${index}`}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 font-bold text-[#131E5C]">
                                                {item.agencia || "—"}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                                                {item.CodProduto || "—"}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                {numero(item.QtdeEstoque)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                {moneda(item.VrEstoque)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                {moneda(item.VrUnitarioMedio)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                {numero(item.QtReservada)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                {numero(item.QtPedida)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                {numero(item.QtReserEstrateg)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3 text-right">
                                                {numero(item.QtTransito)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                {fecha(item.DtUltimaVenda)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                {fecha(item.DtUltimaCompra)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                {fecha(item.DtUltimoPedido)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-3">
                                                {fecha(item.DtAtualizacao)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>


                    {/* Paginación */}
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="text-xs font-medium text-slate-500">
                            {total > 0
                                ? `Mostrando ${desde.toLocaleString(
                                    "es-MX"
                                )} - ${hasta.toLocaleString(
                                    "es-MX"
                                )} de ${total.toLocaleString("es-MX")}`
                                : "Sin registros"}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={pagina <= 1 || cargando}
                                onClick={() =>
                                    setPagina((actual) =>
                                        Math.max(1, actual - 1)
                                    )
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <span className="min-w-[100px] text-center text-xs font-bold text-slate-600">
                                Página {pagina}
                                {totalPaginas
                                    ? ` de ${totalPaginas}`
                                    : ""}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    cargando ||
                                    totalPaginas === 0 ||
                                    pagina >= totalPaginas
                                }
                                onClick={() =>
                                    setPagina((actual) => actual + 1)
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
