import { useEffect, useMemo, useState } from "react";
import {
    UsersRound,
    Plus,
    Search,
    Pencil,
    Power,
    PowerOff,
    X,
    RefreshCw,
    LoaderCircle,
} from "lucide-react";

import { http } from "../../lib/apiClient";


const FORM_INICIAL = {
    nombre: "",
    telefono: "",
    tipo_asesor: "",
    area: "",
    agencia: "",
    activo: true,
};


function texto(value) {
    return String(value || "").trim();
}


function mensajeError(error) {
    const data = error?.data;

    if (data && typeof data === "object") {
        const primeraClave = Object.keys(data)[0];

        if (primeraClave) {
            const value = data[primeraClave];

            if (Array.isArray(value)) {
                return value[0] || "No fue posible completar la operación.";
            }

            if (typeof value === "string") {
                return value;
            }
        }
    }

    return (
        error?.message ||
        "No fue posible completar la operación."
    );
}


export default function AdministracionAsesores() {
    const [asesores, setAsesores] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const [busqueda, setBusqueda] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("Todos");
    const [filtroArea, setFiltroArea] = useState("Todas");
    const [filtroAgencia, setFiltroAgencia] = useState("Todas");
    const [filtroEstado, setFiltroEstado] = useState("Todos");

    const [modalAbierto, setModalAbierto] = useState(false);
    const [asesorEditando, setAsesorEditando] = useState(null);
    const [form, setForm] = useState(FORM_INICIAL);


    const cargarAsesores = async () => {
        setCargando(true);
        setError("");

        try {
            const data = await http(
                "/digitales/asesores/admin/"
            );

            setAsesores(
                Array.isArray(data) ? data : []
            );
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setCargando(false);
        }
    };


    useEffect(() => {
        cargarAsesores();
    }, []);


    const tipos = useMemo(() => {
        return [
            ...new Set(
                asesores
                    .map((item) => texto(item.tipo_asesor))
                    .filter(Boolean)
            ),
        ].sort((a, b) => a.localeCompare(b));
    }, [asesores]);


    const areas = useMemo(() => {
        return [
            ...new Set(
                asesores
                    .map((item) => texto(item.area))
                    .filter(Boolean)
            ),
        ].sort((a, b) => a.localeCompare(b));
    }, [asesores]);


    const agencias = useMemo(() => {
        return [
            ...new Set(
                asesores
                    .map((item) => texto(item.agencia))
                    .filter(Boolean)
            ),
        ].sort((a, b) => a.localeCompare(b));
    }, [asesores]);


    const asesoresFiltrados = useMemo(() => {
        const query = texto(busqueda).toLowerCase();

        return asesores.filter((asesor) => {
            if (query) {
                const contenido = [
                    asesor.nombre,
                    asesor.telefono,
                    asesor.tipo_asesor,
                    asesor.area,
                    asesor.agencia,
                ]
                    .map((value) => texto(value).toLowerCase())
                    .join(" ");

                if (!contenido.includes(query)) {
                    return false;
                }
            }

            if (
                filtroTipo !== "Todos" &&
                texto(asesor.tipo_asesor) !== filtroTipo
            ) {
                return false;
            }

            if (
                filtroArea !== "Todas" &&
                texto(asesor.area) !== filtroArea
            ) {
                return false;
            }

            if (
                filtroAgencia !== "Todas" &&
                texto(asesor.agencia) !== filtroAgencia
            ) {
                return false;
            }

            if (
                filtroEstado === "Activos" &&
                !asesor.activo
            ) {
                return false;
            }

            if (
                filtroEstado === "Inactivos" &&
                asesor.activo
            ) {
                return false;
            }

            return true;
        });
    }, [
        asesores,
        busqueda,
        filtroTipo,
        filtroArea,
        filtroAgencia,
        filtroEstado,
    ]);


    const resumen = useMemo(() => {
        const activos = asesores.filter(
            (asesor) => asesor.activo
        ).length;

        return {
            total: asesores.length,
            activos,
            inactivos: asesores.length - activos,
        };
    }, [asesores]);


    const abrirNuevo = () => {
        setAsesorEditando(null);
        setForm(FORM_INICIAL);
        setError("");
        setModalAbierto(true);
    };


    const abrirEditar = (asesor) => {
        setAsesorEditando(asesor);

        setForm({
            nombre: asesor.nombre || "",
            telefono: asesor.telefono || "",
            tipo_asesor: asesor.tipo_asesor || "",
            area: asesor.area || "",
            agencia: asesor.agencia || "",
            activo: Boolean(asesor.activo),
        });

        setError("");
        setModalAbierto(true);
    };


    const cerrarModal = () => {
        if (guardando) return;

        setModalAbierto(false);
        setAsesorEditando(null);
        setForm(FORM_INICIAL);
    };


    const actualizarCampo = (event) => {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    const guardarAsesor = async (event) => {
        event.preventDefault();

        const nombre = texto(form.nombre);

        if (!nombre) {
            setError(
                "El nombre del asesor es obligatorio."
            );
            return;
        }

        setGuardando(true);
        setError("");

        const payload = {
            nombre,
            telefono: texto(form.telefono),
            tipo_asesor: texto(form.tipo_asesor),
            area: texto(form.area),
            agencia: texto(form.agencia),
            activo: Boolean(form.activo),
        };

        try {
            if (asesorEditando?.id) {
                await http(
                    `/digitales/asesores/admin/${asesorEditando.id}/`,
                    {
                        method: "PATCH",
                        data: payload,
                    }
                );
            } else {
                await http(
                    "/digitales/asesores/admin/",
                    {
                        method: "POST",
                        data: payload,
                    }
                );
            }

            cerrarModal();
            await cargarAsesores();
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };


    const cambiarEstado = async (asesor) => {
        const nuevoEstado = !asesor.activo;

        const accion = nuevoEstado
            ? "activar"
            : "desactivar";

        const confirmado = window.confirm(
            `¿Deseas ${accion} a ${asesor.nombre}?`
        );

        if (!confirmado) return;

        setError("");

        try {
            await http(
                `/digitales/asesores/admin/${asesor.id}/`,
                {
                    method: "PATCH",
                    data: {
                        activo: nuevoEstado,
                    },
                }
            );

            await cargarAsesores();
        } catch (err) {
            setError(mensajeError(err));
        }
    };


    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                                <UsersRound size={22} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold text-slate-900">
                                    Administración de Asesores
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    Administra el catálogo de asesores utilizado por el CRM.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={cargarAsesores}
                            disabled={cargando}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    cargando
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                            Actualizar
                        </button>

                        <button
                            type="button"
                            onClick={abrirNuevo}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                        >
                            <Plus size={18} />
                            Nuevo asesor
                        </button>
                    </div>
                </div>


                <div className="mb-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Total
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">
                            {resumen.total}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Activos
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-emerald-700">
                            {resumen.activos}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Inactivos
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-slate-600">
                            {resumen.inactivos}
                        </p>
                    </div>
                </div>


                <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">

                        <div className="relative">
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={busqueda}
                                onChange={(event) =>
                                    setBusqueda(
                                        event.target.value
                                    )
                                }
                                placeholder="Buscar asesor..."
                                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                            />
                        </div>

                        <select
                            value={filtroTipo}
                            onChange={(event) =>
                                setFiltroTipo(
                                    event.target.value
                                )
                            }
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                        >
                            <option>Todos</option>

                            {tipos.map((tipo) => (
                                <option
                                    key={tipo}
                                    value={tipo}
                                >
                                    {tipo}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filtroArea}
                            onChange={(event) =>
                                setFiltroArea(
                                    event.target.value
                                )
                            }
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                        >
                            <option>Todas</option>

                            {areas.map((area) => (
                                <option
                                    key={area}
                                    value={area}
                                >
                                    {area}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filtroAgencia}
                            onChange={(event) =>
                                setFiltroAgencia(
                                    event.target.value
                                )
                            }
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                        >
                            <option>Todas</option>

                            {agencias.map((agencia) => (
                                <option
                                    key={agencia}
                                    value={agencia}
                                >
                                    {agencia}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filtroEstado}
                            onChange={(event) =>
                                setFiltroEstado(
                                    event.target.value
                                )
                            }
                            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400"
                        >
                            <option>Todos</option>
                            <option>Activos</option>
                            <option>Inactivos</option>
                        </select>
                    </div>
                </div>


                {error && !modalAbierto && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}


                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {cargando ? (
                        <div className="flex min-h-[300px] items-center justify-center">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <LoaderCircle
                                    size={20}
                                    className="animate-spin"
                                />
                                Cargando asesores...
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Nombre
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Teléfono
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Tipo de asesor
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Área
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Agencia
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Estado
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-600">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {asesoresFiltrados.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-16 text-center"
                                            >
                                                <UsersRound
                                                    size={34}
                                                    className="mx-auto mb-3 text-slate-300"
                                                />

                                                <p className="font-medium text-slate-600">
                                                    No hay asesores para mostrar
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Agrega un asesor o modifica los filtros.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        asesoresFiltrados.map(
                                            (asesor) => (
                                                <tr
                                                    key={asesor.id}
                                                    className="hover:bg-slate-50/70"
                                                >
                                                    <td className="px-4 py-3.5 font-medium text-slate-900">
                                                        {asesor.nombre}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-slate-600">
                                                        {asesor.telefono || "—"}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-slate-600">
                                                        {asesor.tipo_asesor || "—"}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-slate-600">
                                                        {asesor.area || "—"}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-slate-600">
                                                        {asesor.agencia || "—"}
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <span
                                                            className={
                                                                asesor.activo
                                                                    ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                                                                    : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                                                            }
                                                        >
                                                            {asesor.activo
                                                                ? "Activo"
                                                                : "Inactivo"}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    abrirEditar(
                                                                        asesor
                                                                    )
                                                                }
                                                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                                                            >
                                                                <Pencil size={14} />
                                                                Editar
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    cambiarEstado(
                                                                        asesor
                                                                    )
                                                                }
                                                                className={
                                                                    asesor.activo
                                                                        ? "inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                                                        : "inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                                                                }
                                                            >
                                                                {asesor.activo ? (
                                                                    <>
                                                                        <PowerOff size={14} />
                                                                        Desactivar
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Power size={14} />
                                                                        Activar
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>


            {modalAbierto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {asesorEditando
                                        ? "Editar asesor"
                                        : "Nuevo asesor"}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Completa la información del asesor.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cerrarModal}
                                disabled={guardando}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>


                        <form
                            onSubmit={guardarAsesor}
                            className="p-6"
                        >
                            <div className="grid gap-4 md:grid-cols-2">

                                <label className="md:col-span-2">
                                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Nombre *
                                    </span>

                                    <input
                                        name="nombre"
                                        value={form.nombre}
                                        onChange={actualizarCampo}
                                        maxLength={200}
                                        required
                                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                    />
                                </label>


                                <label>
                                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Teléfono
                                    </span>

                                    <input
                                        name="telefono"
                                        value={form.telefono}
                                        onChange={actualizarCampo}
                                        maxLength={25}
                                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                    />
                                </label>


                                <label>
                                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Tipo de asesor
                                    </span>

                                    <input
                                        name="tipo_asesor"
                                        value={form.tipo_asesor}
                                        onChange={actualizarCampo}
                                        placeholder="Ej. Digital, Piso"
                                        maxLength={80}
                                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                    />
                                </label>


                                <label>
                                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Área
                                    </span>

                                    <input
                                        name="area"
                                        value={form.area}
                                        onChange={actualizarCampo}
                                        placeholder="Ej. Ventas"
                                        maxLength={100}
                                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                    />
                                </label>


                                <label>
                                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Agencia
                                    </span>

                                    <input
                                        name="agencia"
                                        value={form.agencia}
                                        onChange={actualizarCampo}
                                        placeholder="Ej. VW Córdoba"
                                        maxLength={150}
                                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                    />
                                </label>


                                <label className="md:col-span-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={form.activo}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                activo:
                                                    event.target
                                                        .checked,
                                            }))
                                        }
                                        className="h-4 w-4"
                                    />

                                    <div>
                                        <p className="text-sm font-medium text-slate-700">
                                            Asesor activo
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            Los asesores inactivos se conservan en el catálogo para mantener el historial.
                                        </p>
                                    </div>
                                </label>
                            </div>


                            {error && (
                                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}


                            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    disabled={guardando}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {guardando && (
                                        <LoaderCircle
                                            size={17}
                                            className="animate-spin"
                                        />
                                    )}

                                    {guardando
                                        ? "Guardando..."
                                        : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}