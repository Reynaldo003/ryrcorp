import { useEffect, useMemo, useState } from "react";
import {
    Building2, Check, CheckCircle2, Copy, Edit3, ExternalLink, Globe2,
    Grid2X2, Link2, List, MonitorUp, Plus, Search, Trash2, X, Loader2,
} from "lucide-react";
import vwDark from "../../assets/vw_dark.png";

const STORAGE_KEY = "ryr_directorio_web";

const SITIOS_INICIALES = [
    { id: 1, nombre: "graficos-entrega-pzr", url: "https://graficos-entrega-pzr.vercel.app", agencia: "PZR", categoria: "Entregas", descripcion: "Dashboard de gráficas de entrega", plataforma: "Vercel", activo: true },
    { id: 2, nombre: "graficos-entrega-txt", url: "https://graficos-entrega-txt.vercel.app", agencia: "TXT", categoria: "Entregas", descripcion: "Dashboard de gráficas de entrega", plataforma: "Vercel", activo: true },
    { id: 3, nombre: "graficos-entrega-txp", url: "https://graficos-entrega-txp.vercel.app", agencia: "TXP", categoria: "Entregas", descripcion: "Dashboard de gráficas de entrega", plataforma: "Vercel", activo: true },
    { id: 4, nombre: "graficos-entrega-oba", url: "https://graficos-entrega-oba.vercel.app", agencia: "OBA", categoria: "Entregas", descripcion: "Dashboard de gráficas de entrega", plataforma: "Vercel", activo: true },
    { id: 5, nombre: "graficos-entrega-cba", url: "https://graficos-entrega-cba.vercel.app", agencia: "CBA", categoria: "Entregas", descripcion: "Dashboard de gráficas de entrega", plataforma: "Vercel", activo: true },
    { id: 6, nombre: "bitacora-mantenimiento-showroom", url: "https://bitacora-mantenimiento-showroom.vercel.app", agencia: "General", categoria: "Mantenimiento", descripcion: "Bitácora de mantenimiento de showroom", plataforma: "Vercel", activo: true },
    { id: 7, nombre: "encuesta-automotriz-ryr-cba", url: "https://encuesta-automotriz-ryr-cba.vercel.app", agencia: "CBA", categoria: "Encuestas", descripcion: "Encuesta de satisfacción automotriz", plataforma: "Vercel", activo: true },
    { id: 8, nombre: "concertacion-citas", url: "https://concertacion-citas.vercel.app", agencia: "General", categoria: "Citas", descripcion: "Herramienta de concertación de citas", plataforma: "Vercel", activo: true },
];

const FORM_VACIO = {
    id: null,
    nombre: "",
    url: "",
    agencia: "General",
    categoria: "",
    descripcion: "",
    plataforma: "Vercel",
    activo: true,
};

function normalizarUrl(url) {
    const value = String(url || "").trim();
    if (!value) return "";
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function obtenerDominio(url) {
    try { return new URL(normalizarUrl(url)).hostname; }
    catch { return url; }
}

function obtenerFavicon(url) {
    try { return `${new URL(normalizarUrl(url)).origin}/favicon.ico`; }
    catch { return ""; }
}

function detectarPlataforma(url) {
    const host = obtenerDominio(url).toLowerCase();
    if (host.includes("vercel.app")) return "Vercel";
    if (host.includes("netlify.app")) return "Netlify";
    if (host.includes("github.io")) return "GitHub Pages";
    return "Externo";
}

function Badge({ children, variant = "default" }) {
    const variants = {
        default: "border-[#E4E7F0] bg-[#F7F8FC] text-[#515778]",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        navy: "border-[#131E5C]/15 bg-[#131E5C]/5 text-[#131E5C]",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
    };

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${variants[variant]}`}>
            {children}
        </span>
    );
}

function StatCard({ icon: Icon, label, value, description }) {
    return (
        <div className="rounded-2xl border border-[#E4E7F0] bg-white p-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#8891AD]">{label}</p>
                    <p className="mt-1 text-2xl font-black text-[#1A1F3C]">{value}</p>
                    <p className="mt-1 text-[11px] text-[#8891AD]">{description}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#131E5C]/5">
                    <Icon className="h-5 w-5 text-[#131E5C]" />
                </div>
            </div>
        </div>
    );
}

function LogoSitio({ sitio }) {
    const [error, setError] = useState(false);

    return (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E4E7F0] bg-[#F7F8FC]">
            {!error && obtenerFavicon(sitio.url) ? (
                <img
                    src={obtenerFavicon(sitio.url)}
                    alt=""
                    className="h-7 w-7 object-contain"
                    onError={() => setError(true)}
                />
            ) : (
                <Globe2 className="h-5 w-5 text-[#131E5C]" />
            )}
        </div>
    );
}

function SitioPreviewCard({ sitio, onEditar, onEliminar, onCopiar }) {
    const [cargando, setCargando] = useState(true);

    return (
        <article className="group overflow-hidden rounded-2xl border border-[#DDE1EA] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#131E5C]/30 hover:shadow-[0_18px_45px_rgba(19,30,92,.12)]">

            {/* Barra del navegador */}
            <div className="flex h-11 items-center gap-3 border-b border-[#E4E7F0] bg-[#F4F5F7] px-3">

                {/* Botones tipo navegador */}
                <div className="flex shrink-0 items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>

                {/* Barra URL */}
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-[#DDE1EA] bg-white px-2.5 py-1">
                    <Globe2 className="h-3 w-3 shrink-0 text-[#8891AD]" />

                    <span className="truncate text-[10px] font-medium text-[#515778]">
                        {obtenerDominio(sitio.url)}
                    </span>
                </div>

                <a
                    href={sitio.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir aplicación"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#8891AD] transition hover:bg-white hover:text-[#131E5C]"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                </a>
            </div>

            {/* Navegador / Preview */}
            <div className="relative aspect-[16/9] overflow-hidden bg-[#F7F8FC]">

                {cargando && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#F7F8FC]">
                        <Loader2 className="h-5 w-5 animate-spin text-[#131E5C]" />

                        <span className="mt-2 text-[10px] font-semibold text-[#8891AD]">
                            Cargando aplicación...
                        </span>
                    </div>
                )}

                <iframe
                    src={sitio.url}
                    title={sitio.nombre}
                    loading="lazy"
                    onLoad={() => setCargando(false)}
                    className="h-full w-full border-0 bg-white"
                />

                {/* Overlay para que el iframe no capture clics */}
                <a
                    href={sitio.url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 z-20 flex items-center justify-center bg-[#131E5C]/0 transition-all duration-200 group-hover:bg-[#131E5C]/10"
                >
                    <span className="translate-y-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#131E5C] opacity-0 shadow-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                        Abrir aplicación
                    </span>
                </a>
            </div>

            {/* Información */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-black text-[#1A1F3C]">
                                {sitio.nombre}
                            </h3>

                            <span
                                className={`h-2 w-2 shrink-0 rounded-full ${sitio.activo ? "bg-emerald-500" : "bg-gray-300"
                                    }`}
                            />
                        </div>

                        <p className="mt-1 line-clamp-1 text-[11px] text-[#8891AD]">
                            {sitio.descripcion || "Sin descripción"}
                        </p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant="navy">
                        {sitio.agencia}
                    </Badge>

                    <Badge>
                        {sitio.categoria}
                    </Badge>

                    <Badge variant="success">
                        {sitio.plataforma}
                    </Badge>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between border-t border-[#E4E7F0] bg-[#FAFBFD] px-3 py-2">
                <button
                    onClick={() => onCopiar(sitio.url)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#515778] hover:bg-white hover:text-[#131E5C]"
                >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar URL
                </button>

                <div className="flex gap-1">
                    <button
                        onClick={() => onEditar(sitio)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8891AD] hover:bg-white hover:text-[#131E5C]"
                    >
                        <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    <button
                        onClick={() => onEliminar(sitio)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8891AD] hover:bg-red-50 hover:text-red-600"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </article>
    );
}
function ModalSitio({ open, form, setForm, onClose, onGuardar }) {
    if (!open) return null;

    const inputCls =
        "w-full rounded-xl border border-[#E4E7F0] bg-white px-3.5 py-2.5 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10";

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative w-full max-w-2xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
                <div className="flex items-center justify-between border-b border-[#E4E7F0] px-6 py-5">
                    <div>
                        <h2 className="font-black text-[#1A1F3C]">
                            {form.id ? "Editar aplicación" : "Agregar aplicación"}
                        </h2>
                        <p className="mt-0.5 text-xs text-[#8891AD]">
                            Registra la URL para mostrarla en el directorio.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E7F0] text-[#8891AD] hover:bg-[#F7F8FC]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid gap-4 p-6 md:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">
                            Nombre
                        </label>
                        <input
                            value={form.nombre}
                            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                            className={inputCls}
                            placeholder="graficos-entrega-cba"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">
                            Agencia
                        </label>
                        <select
                            value={form.agencia}
                            onChange={(e) => setForm((p) => ({ ...p, agencia: e.target.value }))}
                            className={inputCls}
                        >
                            <option>General</option>
                            <option>CBA</option>
                            <option>OBA</option>
                            <option>TXP</option>
                            <option>PZR</option>
                            <option>TXT</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">
                            URL
                        </label>
                        <input
                            value={form.url}
                            onChange={(e) => {
                                const url = e.target.value;
                                setForm((p) => ({ ...p, url, plataforma: detectarPlataforma(url) }));
                            }}
                            className={inputCls}
                            placeholder="https://mi-proyecto.vercel.app"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">
                            Categoría
                        </label>
                        <input
                            value={form.categoria}
                            onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                            className={inputCls}
                            placeholder="Entregas, Encuestas, Citas..."
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">
                            Plataforma
                        </label>
                        <select
                            value={form.plataforma}
                            onChange={(e) => setForm((p) => ({ ...p, plataforma: e.target.value }))}
                            className={inputCls}
                        >
                            <option>Vercel</option>
                            <option>Netlify</option>
                            <option>GitHub Pages</option>
                            <option>Externo</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">
                            Descripción
                        </label>
                        <textarea
                            rows={3}
                            value={form.descripcion}
                            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                            className={`${inputCls} resize-none`}
                            placeholder="Describe brevemente para qué sirve este sitio."
                        />
                    </div>

                    <label className="flex cursor-pointer items-center gap-3 md:col-span-2">
                        <input
                            type="checkbox"
                            checked={form.activo}
                            onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
                            className="h-4 w-4 accent-[#131E5C]"
                        />
                        <div>
                            <p className="text-sm font-bold text-[#1A1F3C]">Aplicación activa</p>
                            <p className="text-xs text-[#8891AD]">Indica que la URL debe mostrarse como disponible.</p>
                        </div>
                    </label>
                </div>

                <div className="flex justify-end gap-2 border-t border-[#E4E7F0] bg-[#F7F8FC] px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-[#E4E7F0] bg-white px-4 py-2.5 text-sm font-bold text-[#515778]"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={onGuardar}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#131E5C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a1340]"
                    >
                        <Check className="h-4 w-4" />
                        {form.id ? "Guardar cambios" : "Agregar sitio"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DirectorioWeb() {
    const [sitios, setSitios] = useState(() => {
        try {
            const guardados = localStorage.getItem(STORAGE_KEY);
            return guardados ? JSON.parse(guardados) : SITIOS_INICIALES;
        } catch {
            return SITIOS_INICIALES;
        }
    });

    const [busqueda, setBusqueda] = useState("");
    const [agencia, setAgencia] = useState("Todas");
    const [plataforma, setPlataforma] = useState("Todas");
    const [vista, setVista] = useState("grid");
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(FORM_VACIO);
    const [copiado, setCopiado] = useState("");

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sitios));
    }, [sitios]);

    const agencias = useMemo(
        () => ["Todas", ...new Set(sitios.map((s) => s.agencia).filter(Boolean))],
        [sitios]
    );

    const sitiosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();

        return sitios.filter((sitio) => {
            const coincideBusqueda =
                !q ||
                [
                    sitio.nombre,
                    sitio.url,
                    sitio.agencia,
                    sitio.categoria,
                    sitio.descripcion,
                    sitio.plataforma,
                ].some((valor) => String(valor || "").toLowerCase().includes(q));

            const coincideAgencia = agencia === "Todas" || sitio.agencia === agencia;
            const coincidePlataforma = plataforma === "Todas" || sitio.plataforma === plataforma;

            return coincideBusqueda && coincideAgencia && coincidePlataforma;
        });
    }, [sitios, busqueda, agencia, plataforma]);

    const totalVercel = sitios.filter((s) => s.plataforma === "Vercel").length;
    const totalActivos = sitios.filter((s) => s.activo).length;
    const totalAgencias = new Set(sitios.map((s) => s.agencia).filter((a) => a !== "General")).size;

    function abrirNuevo() {
        setForm(FORM_VACIO);
        setModal(true);
    }

    function editar(sitio) {
        setForm({ ...sitio });
        setModal(true);
    }

    function guardar() {
        const nombre = form.nombre.trim();
        const url = normalizarUrl(form.url);

        if (!nombre || !url) return alert("Nombre y URL son obligatorios.");

        try {
            new URL(url);
        } catch {
            return alert("La URL ingresada no es válida.");
        }

        const item = {
            ...form,
            nombre,
            url,
            plataforma: form.plataforma || detectarPlataforma(url),
        };

        setSitios((prev) =>
            item.id
                ? prev.map((s) => (s.id === item.id ? item : s))
                : [{ ...item, id: Date.now() }, ...prev]
        );

        setModal(false);
        setForm(FORM_VACIO);
    }

    function eliminar(sitio) {
        if (!confirm(`¿Eliminar "${sitio.nombre}" del directorio?`)) return;
        setSitios((prev) => prev.filter((s) => s.id !== sitio.id));
    }

    async function copiar(url) {
        try {
            await navigator.clipboard.writeText(url);
            setCopiado(url);
            setTimeout(() => setCopiado(""), 1800);
        } catch {
            setCopiado("");
        }
    }

    return (
        <div className="min-h-screen bg-[#F7F8FC]">
            <header className="sticky top-0 z-40 border-b border-[#131E5C]/10 bg-white">
                <div className="flex min-h-[76px] items-center gap-4 px-4 md:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <img src={vwDark} alt="Volkswagen" className="h-16 w-16 object-contain md:h-20 md:w-20" />

                        <div>
                            <h1 className="text-xl font-black tracking-[-.03em] text-[#131E5C] md:text-[28px]">
                                Directorio de aplicaciones
                            </h1>
                        </div>
                    </div>

                    <div className="hidden h-[2px] flex-1 rounded-full bg-[#131E5C] lg:block" />

                    <button
                        onClick={abrirNuevo}
                        className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#131E5C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0a1340]"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Nueva URL</span>
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard icon={Globe2} label="Aplicaciones" value={sitios.length} description="URLs registradas" />
                    <StatCard icon={MonitorUp} label="Vercel" value={totalVercel} description="Proyectos desplegados" />
                    <StatCard icon={CheckCircle2} label="Disponibles" value={totalActivos} description="Aplicaciones activas" />
                    <StatCard icon={Building2} label="Agencias" value={totalAgencias} description="Con aplicaciones propias" />
                </div>

                <div className="sticky top-[76px] z-30 mt-5 rounded-2xl border border-[#E4E7F0] bg-white/95 p-3 shadow-sm backdrop-blur-md">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8891AD]" />
                            <input
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por nombre, URL, agencia, categoría..."
                                className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] pl-10 pr-4 text-sm outline-none transition focus:border-[#131E5C]/30 focus:bg-white focus:ring-2 focus:ring-[#131E5C]/10"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <select
                                value={agencia}
                                onChange={(e) => setAgencia(e.target.value)}
                                className="h-10 rounded-xl border border-[#E4E7F0] bg-white px-3 text-xs font-bold text-[#515778] outline-none"
                            >
                                {agencias.map((item) => <option key={item}>{item}</option>)}
                            </select>

                            <select
                                value={plataforma}
                                onChange={(e) => setPlataforma(e.target.value)}
                                className="h-10 rounded-xl border border-[#E4E7F0] bg-white px-3 text-xs font-bold text-[#515778] outline-none"
                            >
                                <option>Todas</option>
                                <option>Vercel</option>
                                <option>Netlify</option>
                                <option>GitHub Pages</option>
                                <option>Externo</option>
                            </select>

                            <div className="flex rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] p-1">
                                <button
                                    onClick={() => setVista("grid")}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${vista === "grid" ? "bg-white text-[#131E5C] shadow-sm" : "text-[#8891AD]"
                                        }`}
                                >
                                    <Grid2X2 className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={() => setVista("lista")}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${vista === "lista" ? "bg-white text-[#131E5C] shadow-sm" : "text-[#8891AD]"
                                        }`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#8891AD]">
                        Mostrando <span className="text-[#1A1F3C]">{sitiosFiltrados.length}</span> aplicaciones
                    </p>
                </div>

                {sitiosFiltrados.length ? (
                    <div
                        className={
                            vista === "grid"
                                ? "mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                                : "mt-3 grid max-w-5xl gap-3"
                        }
                    >
                        {sitiosFiltrados.map((sitio) => (
                            <SitioPreviewCard
                                key={sitio.id}
                                sitio={sitio}
                                onEditar={editar}
                                onEliminar={eliminar}
                                onCopiar={copiar}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#C8CEDF] bg-white py-20 text-center">
                        <Globe2 className="mx-auto h-8 w-8 text-[#C8CEDF]" />
                        <p className="mt-3 text-sm font-bold text-[#1A1F3C]">No encontramos aplicaciones</p>
                        <p className="mt-1 text-xs text-[#8891AD]">Modifica los filtros o agrega una nueva URL.</p>
                    </div>
                )}
            </main>

            {copiado && (
                <div className="fixed bottom-6 right-6 z-[150] flex items-center gap-2 rounded-xl bg-[#131E5C] px-4 py-3 text-xs font-bold text-white shadow-xl">
                    <Check className="h-4 w-4" />
                    URL copiada
                </div>
            )}

            <ModalSitio
                open={modal}
                form={form}
                setForm={setForm}
                onClose={() => setModal(false)}
                onGuardar={guardar}
            />
        </div>
    );
}