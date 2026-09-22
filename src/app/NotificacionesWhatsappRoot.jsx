// src/app/NotificacionesWhatsappRoot.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNotificacionesWhatsapp } from "../hooks/useNotificacionesWhatsapp";
import { http } from "../lib/apiPruebas";

/*
 * HABILITADO por defecto.
 *
 * Para desactivar temporalmente sin tocar código:
 * VITE_NOTIFICACIONES_WS_ACTIVAS=false
 *
 * y volver a ejecutar npm run build.
 */
const NOTIFICACIONES_WS_ACTIVAS =
    String(import.meta.env.VITE_NOTIFICACIONES_WS_ACTIVAS || "true")
        .trim()
        .toLowerCase() === "true";

const ESTADO_ETIQUETA = {
    inactivo: "inactivo",
    desactivado: "desactivado",
    esperando_auth: "cargando sesión",
    no_autenticado: "sin sesión",
    sin_identificador: "usuario desconocido",
    validando_sesion: "validando sesión",
    conectando: "conectando",
    conectado: "conectado",
    reconectando: "reconectando",
    sin_red: "sin conexión",
    sin_token: "sin token",
    error_auth: "error de sesión",
    sesion_expirada: "sesión expirada",
    sin_permiso: "sin permiso",
    error: "error",
};

function EstadoChip({ estado, onAbrir }) {
    const etiqueta = ESTADO_ETIQUETA[estado] || estado || "?";
    const esConectado = estado === "conectado";

    return (
        <button
            type="button"
            onClick={onAbrir}
            title="Estado de notificaciones"
            className={`fixed bottom-4 right-4 z-[9997] flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold shadow-lg ${
                esConectado
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-white text-amber-700"
            }`}
        >
            <span
                className={`h-2 w-2 rounded-full ${
                    esConectado ? "bg-emerald-500" : "bg-amber-500"
                }`}
            />
            WS: {etiqueta}
        </button>
    );
}

function DiagnosticoPanel({
    diagnostico,
    cargando,
    onClose,
    onProbar,
    probarCargando,
    probarResultado,
}) {
    return (
        <div className="fixed bottom-16 right-4 z-[9998] w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 pr-12 shadow-2xl">
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar diagnóstico"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
                ×
            </button>

            <div className="text-sm font-extrabold text-[#131E5C]">
                Diagnóstico de notificaciones
            </div>

            {cargando && (
                <div className="mt-2 text-xs font-semibold text-slate-500">
                    Consultando…
                </div>
            )}

            {!cargando && diagnostico && (
                <div className="mt-3 space-y-3 text-xs text-slate-600">
                    <div className="space-y-1">
                        <div>
                            <b>Rol:</b> {diagnostico.rol || "(vacío)"}
                        </div>
                        <div>
                            <b>Agencia:</b>{" "}
                            {diagnostico.agencia || "(vacío)"}
                        </div>
                        <div>
                            <b>Teléfono:</b>{" "}
                            {diagnostico.telefono || "(vacío)"}
                        </div>
                        {diagnostico.es_acceso_total && (
                            <div className="font-bold text-emerald-700">
                                Acceso total: todas las líneas
                            </div>
                        )}
                    </div>

                    {diagnostico.motivos?.length > 0 && (
                        <ul className="list-disc space-y-1 pl-4 text-slate-700">
                            {diagnostico.motivos.map((motivo) => (
                                <li key={motivo}>{motivo}</li>
                            ))}
                        </ul>
                    )}

                    <div>
                        <b>Líneas autorizadas:</b>{" "}
                        {diagnostico.lineas_permitidas?.length
                            ? diagnostico.lineas_permitidas.join(", ")
                            : "ninguna"}
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                        <button
                            type="button"
                            onClick={onProbar}
                            disabled={probarCargando}
                            className="w-full rounded-xl bg-[#131E5C] px-3 py-2 text-xs font-extrabold text-white transition hover:bg-[#131E5C]/90 disabled:opacity-50"
                        >
                            {probarCargando
                                ? "Enviando…"
                                : "Enviar notificación de prueba"}
                        </button>

                        {probarResultado && (
                            <div
                                className={`mt-2 text-xs font-bold ${
                                    probarResultado.ok
                                        ? "text-emerald-700"
                                        : "text-red-700"
                                }`}
                            >
                                {probarResultado.ok
                                    ? `Enviado a: ${
                                          probarResultado.data
                                              ?.lineas_enviadas?.join(", ") ||
                                          "líneas"
                                      }`
                                    : probarResultado.data?.error ||
                                      "No se pudo enviar."}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function SinPermisoCard({ onClose }) {
    return (
        <div className="fixed bottom-16 right-4 z-[9998] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-amber-200 bg-white p-4 pr-12 shadow-2xl">
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar aviso"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
                ×
            </button>

            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <span className="text-lg font-black text-amber-600" aria-hidden="true">
                        !
                    </span>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="text-sm font-extrabold text-[#131E5C]">
                        Notificaciones no disponibles
                    </div>

                    <div className="mt-1 text-xs font-semibold text-slate-600">
                        Tu usuario no tiene líneas de WhatsApp autorizadas
                        para notificaciones.
                    </div>
                </div>
            </div>
        </div>
    );
}

function rutaSpaDesdeUrl(url) {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return null;

    const sinPrefijo = url.startsWith("/crm/") ? url.slice("/crm".length) : url;
    return sinPrefijo.startsWith("/") ? sinPrefijo : `/${sinPrefijo}`;
}

function WhatsAppToast({ notificacion, onClose }) {
    useEffect(() => {
        if (!notificacion) return undefined;

        const timer = window.setTimeout(onClose, 9000);
        return () => window.clearTimeout(timer);
    }, [notificacion, onClose]);

    if (!notificacion) return null;

    const nombre = notificacion.nombre || "Prospecto";
    const mensaje =
        notificacion.mensaje || "Nuevo mensaje de WhatsApp";

    const abrirChat = () => {
        const ruta = rutaSpaDesdeUrl(notificacion.url);

        if (ruta) {
            window.dispatchEvent(
                new CustomEvent("app:navigate", { detail: { to: ruta } }),
            );
            onClose();
            return;
        }

        if (notificacion.url) {
            window.location.assign(notificacion.url);
            return;
        }

        onClose();
    };

    return (
        <div className="fixed right-4 top-4 z-[2147483647] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl">
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar notificación"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
                ×
            </button>

            <div className="flex items-start gap-3 p-4 pr-12">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <img
                        src="/crm/whatsapp.svg"
                        alt="WhatsApp"
                        className="h-6 w-6"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="text-sm font-extrabold text-[#131E5C]">
                        Nuevo WhatsApp
                    </div>

                    <div className="mt-0.5 truncate text-sm font-bold text-slate-700">
                        {nombre}
                    </div>

                    <div className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {mensaje}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={abrirChat}
                            className="rounded-xl bg-[#131E5C] px-3 py-2 text-xs font-extrabold text-white hover:bg-[#131E5C]/90"
                        >
                            Abrir chat
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-[#131E5C] hover:bg-slate-50"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function NotificacionesWhatsappRoot() {
    const { user, ready, isAuthenticated } = useAuth();
    const [cardSinPermisoCerradaPara, setCardSinPermisoCerradaPara] =
        useState(null);
    const [diagnostico, setDiagnostico] = useState(null);
    const [diagnosticoAbierto, setDiagnosticoAbierto] = useState(false);
    const [diagnosticoCargando, setDiagnosticoCargando] = useState(false);
    const [probarCargando, setProbarCargando] = useState(false);
    const [probarResultado, setProbarResultado] = useState(null);

    const {
        estado,
        ultimaNotificacion,
        limpiarUltimaNotificacion,
    } = useNotificacionesWhatsapp({
        user,
        ready,
        isAuthenticated,
        activo: NOTIFICACIONES_WS_ACTIVAS,
    });

    async function alternarDiagnostico() {
        const abrir = !diagnosticoAbierto;
        setDiagnosticoAbierto(abrir);

        if (!abrir) return;

        setDiagnosticoCargando(true);

        try {
            const data = await http("/api/notificaciones/diagnostico/");
            setDiagnostico(data);
        } catch (error) {
            if (error?.code === "SESSION_EXPIRED") return;

            setDiagnostico({
                ok: false,
                rol: "—",
                agencia: "—",
                telefono: "—",
                motivos: [
                    "No se pudo consultar el diagnóstico en este momento. Inténtalo de nuevo.",
                ],
                lineas_permitidas: [],
            });
        } finally {
            setDiagnosticoCargando(false);
        }
    }

    async function enviarPrueba() {
        if (probarCargando) return;

        setProbarCargando(true);
        setProbarResultado(null);

        try {
            const data = await http("/api/notificaciones/probar/");
            setProbarResultado({ ok: true, data });
        } catch (error) {
            if (error?.code === "SESSION_EXPIRED") return;

            setProbarResultado({
                ok: false,
                data: {
                    error:
                        "No se pudo enviar la notificación de prueba en este momento.",
                },
            });
        } finally {
            setProbarCargando(false);
        }
    }

    /*
     * Si el valor cambia (nuevo estado) la tarjeta vuelve a mostrarse;
     * cerrar solo la oculta para ese mismo valor.
     */

    /*
     * Mientras la bandera esté apagada no renderizamos nada
     * relacionado con las notificaciones.
     */
    if (!NOTIFICACIONES_WS_ACTIVAS) return null;
    if (!ready || !isAuthenticated) return null;

    return (
        <>
            {cardSinPermisoCerradaPara !== estado &&
                estado === "sin_permiso" && (
                    <SinPermisoCard
                        onClose={() => setCardSinPermisoCerradaPara(estado)}
                    />
                )}

            <EstadoChip
                estado={estado}
                onAbrir={alternarDiagnostico}
            />

            {diagnosticoAbierto && (
                <DiagnosticoPanel
                    diagnostico={diagnostico}
                    cargando={diagnosticoCargando}
                    onClose={() => setDiagnosticoAbierto(false)}
                    onProbar={enviarPrueba}
                    probarCargando={probarCargando}
                    probarResultado={probarResultado}
                />
            )}

            <WhatsAppToast
                notificacion={ultimaNotificacion}
                onClose={limpiarUltimaNotificacion}
            />
        </>
    );
}