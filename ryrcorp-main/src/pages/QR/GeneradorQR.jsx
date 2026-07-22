import { useEffect, useMemo, useState } from "react";
import {
    Download,
    ImagePlus,
    Info,
    Link2,
    Loader2,
    Palette,
    RefreshCw,
    Save,
    X,
} from "lucide-react";
import { apiQR } from "../../lib/apiQR";

const ESTADO_INICIAL = {
    url: "",
    nombre_archivo: "qr-encuesta",
    formato: "png",
    escala: 8,
    borde: 4,
    error: "h",
    dark: "#131E5C",
    light: "#FFFFFF",
    finder_dark: "",
    finder_light: "",
    data_dark: "",
    data_light: "",
    alignment_dark: "",
    alignment_light: "",
    quiet_zone: "",
    logo_size: 20,
    fondo_opacidad: 170,
    logo: null,
    background: null,
    usar_colores_avanzados: false,
};

function Campo({ titulo, children, ayuda }) {
    return (
        <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-bold text-[#131E5C]">{titulo}</div>
            {children}
            {ayuda ? <div className="mt-2 text-xs text-slate-500">{ayuda}</div> : null}
        </div>
    );
}

export default function GeneradorQR() {
    const [form, setForm] = useState(ESTADO_INICIAL);
    const [info, setInfo] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [resultado, setResultado] = useState(null);

    const urlValida = useMemo(() => {
        return /^https?:\/\/.+/i.test(String(form.url || "").trim());
    }, [form.url]);

    const formatoFinal = useMemo(() => {
        if (form.logo || form.background) return "png";
        return form.formato;
    }, [form.formato, form.logo, form.background]);

    useEffect(() => {
        let cancelado = false;

        async function cargarInfo() {
            setLoadingInfo(true);
            try {
                const data = await apiQR.info();
                if (!cancelado) setInfo(data);
            } catch (e) {
                if (!cancelado) setError("No se pudo cargar la configuración del módulo.");
            } finally {
                if (!cancelado) setLoadingInfo(false);
            }
        }

        cargarInfo();
        return () => {
            cancelado = true;
        };
    }, []);

    function setCampo(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function limpiar() {
        setForm(ESTADO_INICIAL);
        setResultado(null);
        setError("");
    }

    function construirPayload() {
        return {
            url: String(form.url || "").trim(),
            nombre_archivo: String(form.nombre_archivo || "").trim() || "qr",
            formato: formatoFinal,
            escala: String(form.escala),
            borde: String(form.borde),
            error: form.error,
            dark: form.dark,
            light: form.light,
            finder_dark: form.usar_colores_avanzados ? form.finder_dark : "",
            finder_light: form.usar_colores_avanzados ? form.finder_light : "",
            data_dark: form.usar_colores_avanzados ? form.data_dark : "",
            data_light: form.usar_colores_avanzados ? form.data_light : "",
            alignment_dark: form.usar_colores_avanzados ? form.alignment_dark : "",
            alignment_light: form.usar_colores_avanzados ? form.alignment_light : "",
            quiet_zone: form.usar_colores_avanzados ? form.quiet_zone : "",
            logo_size: String(form.logo_size),
            fondo_opacidad: String(form.fondo_opacidad),
            logo: form.logo,
            background: form.background,
        };
    }

    async function generar() {
        if (!urlValida || saving) return;

        setSaving(true);
        setError("");

        try {
            const data = await apiQR.generarPermanente(construirPayload());
            setResultado(data);
        } catch (e) {
            console.error(e);
            setError(e.message || "No se pudo generar el QR.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-extrabold text-[#131E5C]">Generador QR</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Genera QR permanentes guardados en el servidor.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={generar}
                        disabled={!urlValida || saving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#131E5C]/90 disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Generar y guardar
                    </button>

                    <button
                        onClick={limpiar}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#131E5C] bg-white px-4 py-2 text-sm font-bold text-[#131E5C] hover:bg-[#131E5C] hover:text-white disabled:opacity-60"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Limpiar
                    </button>
                </div>
            </div>

            {error ? (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-12">
                <div className="xl:col-span-7">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <Campo titulo="Link" ayuda="Debe iniciar con http:// o https://">
                                <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2">
                                    <Link2 className="h-4 w-4 text-[#131E5C]" />
                                    <input
                                        value={form.url}
                                        onChange={(e) => setCampo("url", e.target.value)}
                                        placeholder="https://midominio.com/encuesta/123"
                                        className="w-full text-sm font-semibold text-[#131E5C] outline-none"
                                    />
                                </div>
                            </Campo>
                        </div>

                        <Campo titulo="Nombre del archivo">
                            <input
                                value={form.nombre_archivo}
                                onChange={(e) => setCampo("nombre_archivo", e.target.value)}
                                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                            />
                        </Campo>

                        <Campo titulo="Formato">
                            <select
                                value={formatoFinal}
                                onChange={(e) => setCampo("formato", e.target.value)}
                                disabled={!!form.logo || !!form.background}
                                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none disabled:opacity-60"
                            >
                                <option value="png">PNG</option>
                                <option value="svg">SVG</option>
                            </select>
                        </Campo>

                        <Campo titulo="Escala">
                            <input
                                type="number"
                                min="1"
                                max="40"
                                value={form.escala}
                                onChange={(e) => setCampo("escala", e.target.value)}
                                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                            />
                        </Campo>

                        <Campo titulo="Borde">
                            <input
                                type="number"
                                min="0"
                                max="20"
                                value={form.borde}
                                onChange={(e) => setCampo("borde", e.target.value)}
                                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                            />
                        </Campo>

                        <Campo titulo="Corrección de error">
                            <select
                                value={form.error}
                                onChange={(e) => setCampo("error", e.target.value)}
                                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                            >
                                <option value="l">L</option>
                                <option value="m">M</option>
                                <option value="q">Q</option>
                                <option value="h">H</option>
                            </select>
                        </Campo>

                        <Campo titulo="Color oscuro">
                            <div className="flex items-center gap-2">
                                <Palette className="h-4 w-4 text-[#131E5C]" />
                                <input
                                    type="color"
                                    value={form.dark}
                                    onChange={(e) => setCampo("dark", e.target.value)}
                                    className="h-11 w-full rounded-lg border border-black/10 bg-white px-2 py-2"
                                />
                            </div>
                        </Campo>

                        <Campo titulo="Color claro / fondo">
                            <input
                                type="color"
                                value={form.light}
                                onChange={(e) => setCampo("light", e.target.value)}
                                className="h-11 w-full rounded-lg border border-black/10 bg-white px-2 py-2"
                            />
                        </Campo>

                        <div className="md:col-span-2 rounded-lg border border-black/10 bg-white p-4 shadow-sm">
                            <label className="flex items-center gap-3 text-sm font-bold text-[#131E5C]">
                                <input
                                    type="checkbox"
                                    checked={form.usar_colores_avanzados}
                                    onChange={(e) => setCampo("usar_colores_avanzados", e.target.checked)}
                                    className="h-4 w-4"
                                />
                                Activar colores avanzados
                            </label>
                        </div>

                        {form.usar_colores_avanzados ? (
                            <>
                                <Campo titulo="Finder oscuro">
                                    <input
                                        value={form.finder_dark}
                                        onChange={(e) => setCampo("finder_dark", e.target.value)}
                                        placeholder="#131E5C"
                                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                                    />
                                </Campo>

                                <Campo titulo="Finder claro">
                                    <input
                                        value={form.finder_light}
                                        onChange={(e) => setCampo("finder_light", e.target.value)}
                                        placeholder="#FFFFFF"
                                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                                    />
                                </Campo>

                                <Campo titulo="Data oscuro">
                                    <input
                                        value={form.data_dark}
                                        onChange={(e) => setCampo("data_dark", e.target.value)}
                                        placeholder="#000000"
                                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                                    />
                                </Campo>

                                <Campo titulo="Data claro">
                                    <input
                                        value={form.data_light}
                                        onChange={(e) => setCampo("data_light", e.target.value)}
                                        placeholder="#FFFFFF"
                                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                                    />
                                </Campo>

                                <Campo titulo="Alignment oscuro">
                                    <input
                                        value={form.alignment_dark}
                                        onChange={(e) => setCampo("alignment_dark", e.target.value)}
                                        placeholder="#FF0000"
                                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                                    />
                                </Campo>

                                <Campo titulo="Alignment claro">
                                    <input
                                        value={form.alignment_light}
                                        onChange={(e) => setCampo("alignment_light", e.target.value)}
                                        placeholder="#FFFFFF"
                                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                                    />
                                </Campo>

                                <Campo titulo="Quiet zone">
                                    <input
                                        value={form.quiet_zone}
                                        onChange={(e) => setCampo("quiet_zone", e.target.value)}
                                        placeholder="#FFFFFF"
                                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none"
                                    />
                                </Campo>
                            </>
                        ) : null}

                        <Campo titulo="Logo al centro" ayuda="Requiere Pillow en backend">
                            <div className="flex items-center gap-2">
                                <ImagePlus className="h-4 w-4 text-[#131E5C]" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setCampo("logo", e.target.files?.[0] || null)}
                                    className="w-full text-sm"
                                />
                                {form.logo ? (
                                    <button
                                        type="button"
                                        onClick={() => setCampo("logo", null)}
                                        className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </Campo>

                        <Campo titulo="Tamaño del logo (%)">
                            <input
                                type="range"
                                min="10"
                                max="30"
                                value={form.logo_size}
                                onChange={(e) => setCampo("logo_size", e.target.value)}
                                className="w-full"
                            />
                            <div className="mt-2 text-sm font-bold text-[#131E5C]">{form.logo_size}%</div>
                        </Campo>

                        <Campo titulo="Imagen de fondo" ayuda="Requiere Pillow en backend">
                            <div className="flex items-center gap-2">
                                <ImagePlus className="h-4 w-4 text-[#131E5C]" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setCampo("background", e.target.files?.[0] || null)}
                                    className="w-full text-sm"
                                />
                                {form.background ? (
                                    <button
                                        type="button"
                                        onClick={() => setCampo("background", null)}
                                        className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                        </Campo>

                        <Campo titulo="Opacidad del fondo blanco">
                            <input
                                type="range"
                                min="0"
                                max="255"
                                value={form.fondo_opacidad}
                                onChange={(e) => setCampo("fondo_opacidad", e.target.value)}
                                className="w-full"
                            />
                            <div className="mt-2 text-sm font-bold text-[#131E5C]">{form.fondo_opacidad}</div>
                        </Campo>
                    </div>
                </div>

                <div className="xl:col-span-5">
                    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
                        <div className="mb-3 text-sm font-bold text-[#131E5C]">Resultado</div>

                        <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-dashed border-black/10 bg-slate-50 p-4">
                            {resultado?.qr_url ? (
                                <img
                                    src={resultado.qr_url}
                                    alt="QR generado"
                                    className="max-h-[380px] max-w-full rounded-lg bg-white p-3 shadow"
                                />
                            ) : (
                                <div className="text-center text-sm text-slate-500">
                                    Aquí se mostrará el QR permanente generado.
                                </div>
                            )}
                        </div>

                        {resultado ? (
                            <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                                <div><b>Estado:</b> {resultado.ya_existia ? "Ya existía" : "Creado nuevo"}</div>
                                <div><b>Tipo:</b> {resultado.tipo_qr}</div>
                                <div><b>Formato:</b> {resultado.formato}</div>
                                <div><b>ID público:</b> {resultado.public_id}</div>
                                <div className="break-all"><b>URL destino:</b> {resultado.url_destino}</div>
                                <div className="break-all"><b>QR URL:</b> {resultado.qr_url}</div>

                                <div className="pt-2">
                                    <a
                                        href={resultado.qr_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                                    >
                                        <Download className="h-4 w-4" />
                                        Abrir / descargar QR
                                    </a>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}