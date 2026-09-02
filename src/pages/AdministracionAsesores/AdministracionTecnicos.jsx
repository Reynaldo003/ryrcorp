import { useEffect, useMemo, useState } from "react";
import {
    Wrench,
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

import {
    AGENCIAS_DIGITALES,
} from "../../config/asesoresGestionComercial";


const FORM_INICIAL = {
    nombre: "",
    tipo_personal: "Tecnico",
    agencia: "",
    activo: true,
};


const TIPOS_PERSONAL = [
    {
        value: "Tecnico",
        label: "Técnico",
    },
    {
        value: "Refacciones",
        label: "Refacciones",
    },
];


const AGENCIAS_PERSONAL = AGENCIAS_DIGITALES.filter(
    (agencia) => agencia !== "Automotriz R&R"
);


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
                return (
                    value[0] ||
                    "No fue posible completar la operación."
                );
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


export default function AdministracionTecnicos() {
    const [personal, setPersonal] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    const [busqueda, setBusqueda] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("Todos");
    const [filtroAgencia, setFiltroAgencia] = useState("Todas");
    const [filtroEstado, setFiltroEstado] = useState("Todos");

    const [modalAbierto, setModalAbierto] = useState(false);
    const [personalEditando, setPersonalEditando] = useState(null);
    const [form, setForm] = useState(FORM_INICIAL);

    const [confirmacionEstado, setConfirmacionEstado] = useState({
        abierto: false,
        personal: null,
        nuevoEstado: false,
    });

    const [procesandoEstado, setProcesandoEstado] = useState(false);


    const cargarPersonal = async () => {
        setCargando(true);
        setError("");

        try {
            const data = await http(
                "/digitales/tecnicos/admin/"
            );

            setPersonal(
                Array.isArray(data) ? data : []
            );
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setCargando(false);
        }
    };


    useEffect(() => {
        cargarPersonal();
    }, []);


    const personalFiltrado = useMemo(() => {
        const query = texto(busqueda).toLowerCase();

        return personal.filter((item) => {
            if (query) {
                const contenido = [
                    item.nombre,
                    item.tipo_personal,
                    item.agencia,
                ]
                    .map((value) =>
                        texto(value).toLowerCase()
                    )
                    .join(" ");

                if (!contenido.includes(query)) {
                    return false;
                }
            }

            if (
                filtroTipo !== "Todos" &&
                texto(item.tipo_personal) !== filtroTipo
            ) {
                return false;
            }

            if (
                filtroAgencia !== "Todas" &&
                texto(item.agencia) !== filtroAgencia
            ) {
                return false;
            }

            if (
                filtroEstado === "Activos" &&
                !item.activo
            ) {
                return false;
            }

            if (
                filtroEstado === "Inactivos" &&
                item.activo
            ) {
                return false;
            }

            return true;
        });
    }, [
        personal,
        busqueda,
        filtroTipo,
        filtroAgencia,
        filtroEstado,
    ]);


    const resumen = useMemo(() => {
        const activos = personal.filter(
            (item) => item.activo
        ).length;

        const tecnicos = personal.filter(
            (item) =>
                texto(item.tipo_personal) === "Tecnico"
        ).length;

        const refacciones = personal.filter(
            (item) =>
                texto(item.tipo_personal) === "Refacciones"
        ).length;

        return {
            total: personal.length,
            activos,
            tecnicos,
            refacciones,
        };
    }, [personal]);


    const abrirNuevo = () => {
        setPersonalEditando(null);
        setForm(FORM_INICIAL);
        setError("");
        setModalAbierto(true);
    };


    const abrirEditar = (item) => {
        setPersonalEditando(item);

        setForm({
            nombre: item.nombre || "",
            tipo_personal:
                item.tipo_personal || "Tecnico",
            agencia: item.agencia || "",
            activo: Boolean(item.activo),
        });

        setError("");
        setModalAbierto(true);
    };


    const cerrarModal = () => {
        if (guardando) return;

        setModalAbierto(false);
        setPersonalEditando(null);
        setForm(FORM_INICIAL);
    };


    const actualizarCampo = (event) => {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    const guardarPersonal = async (event) => {
        event.preventDefault();

        const nombre = texto(form.nombre);

        if (!nombre) {
            setError(
                "El nombre del personal es obligatorio."
            );

            return;
        }

        if (!texto(form.tipo_personal)) {
            setError(
                "Selecciona el tipo de personal."
            );

            return;
        }

        if (!texto(form.agencia)) {
            setError(
                "Selecciona una agencia."
            );

            return;
        }

        setGuardando(true);
        setError("");

        const payload = {
            nombre,
            tipo_personal: texto(form.tipo_personal),
            agencia: texto(form.agencia),
            activo: Boolean(form.activo),
        };

        try {
            if (personalEditando?.id) {
                await http(
                    `/digitales/tecnicos/admin/${personalEditando.id}/`,
                    {
                        method: "PATCH",
                        data: payload,
                    }
                );
            } else {
                await http(
                    "/digitales/tecnicos/admin/",
                    {
                        method: "POST",
                        data: payload,
                    }
                );
            }

            cerrarModal();
            await cargarPersonal();
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };


    const cambiarEstado = (item) => {
        setConfirmacionEstado({
            abierto: true,
            personal: item,
            nuevoEstado: !item.activo,
        });
    };


    const cerrarConfirmacionEstado = () => {
        if (procesandoEstado) return;

        setConfirmacionEstado({
            abierto: false,
            personal: null,
            nuevoEstado: false,
        });
    };


    const confirmarCambioEstado = async () => {
        const item = confirmacionEstado.personal;
        const nuevoEstado =
            confirmacionEstado.nuevoEstado;

        if (!item) return;

        setProcesandoEstado(true);
        setError("");

        try {
            await http(
                `/digitales/tecnicos/admin/${item.id}/`,
                {
                    method: "PATCH",
                    data: {
                        activo: nuevoEstado,
                    },
                }
            );

            setConfirmacionEstado({
                abierto: false,
                personal: null,
                nuevoEstado: false,
            });

            await cargarPersonal();
        } catch (err) {
            setError(mensajeError(err));
        } finally {
            setProcesandoEstado(false);
        }
    };


    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                                <Wrench size={22} />
                            </div>

                            <div>
                                <h1 className="text-2xl font-semibold text-slate-900">
                                    Administración de Técnicos
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    Administra técnicos y personal de refacciones utilizado por el CRM.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={cargarPersonal}
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
                            Nuevo personal
                        </button>
                    </div>
                </div>


                <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                            Técnicos
                        </p>

                        <p className="mt-1 text-2xl font-semibold text-slate-900">
                            {resumen.tecnicos}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Refacciones
                        </p>

                        <p className="mt-1 text-2xl font-semibold text-slate-900">
                            {resumen.refacciones}
                        </p>
                    </div>
                </div>


                <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

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
                                placeholder="Buscar personal..."
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
                            <option value="Todos">
                                Todos los tipos
                            </option>

                            {TIPOS_PERSONAL.map((tipo) => (
                                <option
                                    key={tipo.value}
                                    value={tipo.value}
                                >
                                    {tipo.label}
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
                            <option value="Todas">
                                Todas las agencias
                            </option>

                            {AGENCIAS_PERSONAL.map((agencia) => (
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
                            <option value="Todos">
                                Todos los estados
                            </option>
                            <option value="Activos">
                                Activos
                            </option>
                            <option value="Inactivos">
                                Inactivos
                            </option>
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

                                Cargando personal...
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Nombre
                                        </th>

                                        <th className="px-4 py-3 font-semibold text-slate-600">
                                            Tipo de personal
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
                                    {personalFiltrado.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-16 text-center"
                                            >
                                                <Wrench
                                                    size={34}
                                                    className="mx-auto mb-3 text-slate-300"
                                                />

                                                <p className="font-medium text-slate-600">
                                                    No hay personal para mostrar
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Agrega personal o modifica los filtros.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        personalFiltrado.map(
                                            (item) => (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-slate-50/70"
                                                >
                                                    <td className="px-4 py-3.5 font-medium text-slate-900">
                                                        {item.nombre}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-slate-600">
                                                        {item.tipo_personal === "Tecnico"
                                                            ? "Técnico"
                                                            : item.tipo_personal || "—"}
                                                    </td>

                                                    <td className="px-4 py-3.5 text-slate-600">
                                                        {item.agencia || "—"}
                                                    </td>

                                                    <td className="px-4 py-3.5">
                                                        <span
                                                            className={
                                                                item.activo
                                                                    ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                                                                    : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                                                            }
                                                        >
                                                            {item.activo
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
                                                                        item
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
                                                                        item
                                                                    )
                                                                }
                                                                className={
                                                                    item.activo
                                                                        ? "inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                                                        : "inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                                                                }
                                                            >
                                                                {item.activo ? (
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
                    <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {personalEditando
                                        ? "Editar personal"
                                        : "Nuevo personal"}
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Completa la información del personal.
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
                            onSubmit={guardarPersonal}
                            className="p-6"
                        >
                            <div className="grid gap-4">

                                <label>
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
                                        Tipo de personal *
                                    </span>

                                    <select
                                        name="tipo_personal"
                                        value={form.tipo_personal}
                                        onChange={actualizarCampo}
                                        required
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                    >
                                        {TIPOS_PERSONAL.map(
                                            (tipo) => (
                                                <option
                                                    key={tipo.value}
                                                    value={tipo.value}
                                                >
                                                    {tipo.label}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>


                                <label>
                                    <span className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Agencia *
                                    </span>

                                    <select
                                        name="agencia"
                                        value={form.agencia}
                                        onChange={actualizarCampo}
                                        required
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                    >
                                        <option value="">
                                            Selecciona una agencia
                                        </option>

                                        {AGENCIAS_PERSONAL.map(
                                            (agencia) => (
                                                <option
                                                    key={agencia}
                                                    value={agencia}
                                                >
                                                    {agencia}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>


                                <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
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
                                            Personal activo
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            Los registros inactivos se conservan para mantener el historial.
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


            {confirmacionEstado.abierto && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Confirmar acción
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    Confirma el cambio de estado del personal.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={cerrarConfirmacionEstado}
                                disabled={procesandoEstado}
                                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>


                        <div className="px-6 py-5">
                            <div
                                className={
                                    confirmacionEstado.nuevoEstado
                                        ? "rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4"
                                        : "rounded-xl border border-red-100 bg-red-50 px-4 py-4"
                                }
                            >
                                <p className="text-sm text-slate-700">
                                    {confirmacionEstado.nuevoEstado
                                        ? "¿Deseas activar a "
                                        : "¿Deseas desactivar a "}

                                    <span className="font-semibold text-slate-900">
                                        {
                                            confirmacionEstado
                                                .personal?.nombre
                                        }
                                    </span>
                                    ?
                                </p>
                            </div>
                        </div>


                        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={cerrarConfirmacionEstado}
                                disabled={procesandoEstado}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={confirmarCambioEstado}
                                disabled={procesandoEstado}
                                className={
                                    confirmacionEstado.nuevoEstado
                                        ? "inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                        : "inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                                }
                            >
                                {procesandoEstado && (
                                    <LoaderCircle
                                        size={17}
                                        className="animate-spin"
                                    />
                                )}

                                {procesandoEstado
                                    ? "Procesando..."
                                    : confirmacionEstado.nuevoEstado
                                    ? "Activar"
                                    : "Desactivar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}