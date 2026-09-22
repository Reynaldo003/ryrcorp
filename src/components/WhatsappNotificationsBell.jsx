// src/components/WhatsappNotificationsBell.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, MessageCircle } from "lucide-react";
import { api } from "../lib/apiPruebas";

const FRONTEND_BASE = "/crm";

function rutaSpaDesdeUrl(url) {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return null;

    const sinPrefijo = url.startsWith(`${FRONTEND_BASE}/`)
        ? url.slice(FRONTEND_BASE.length)
        : url;

    return sinPrefijo.startsWith("/") ? sinPrefijo : `/${sinPrefijo}`;
}

function timeAgo(dateStr) {
    if (!dateStr) return "—";

    const now = new Date();
    const dt = new Date(dateStr);
    const diff = Math.max(0, now - dt);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins} min`;
    if (hrs < 24) return `hace ${hrs} h`;
    return `hace ${days} d`;
}

function formatNumber(numero) {
    const digito = String(numero || "").replace(/\D/g, "");
    if (digito.length === 12 && digito.startsWith("52")) {
        return `+${digito.slice(0, 2)} ${digito.slice(2, 5)} ${digito.slice(5, 8)} ${digito.slice(8)}`;
    }
    return numero || "";
}

export default function WhatsappNotificationsBell() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [noLeidas, setNoLeidas] = useState(0);
    const [loading, setLoading] = useState(false);
    const cargandoRef = useRef(false);
    const abiertoRef = useRef(false);

    const cargar = useCallback(async () => {
        if (cargandoRef.current) return;

        cargandoRef.current = true;
        setLoading(true);

        try {
            const data = await api.notificacionesListar({
                limite: 50,
                solo_no_leidas: 0,
            });
            setItems(Array.isArray(data?.items) ? data.items : []);
            setNoLeidas(Number(data?.no_leidas) || 0);
        } catch (error) {
            if (error?.code === "SESSION_EXPIRED") return;

            /*
             * No reintentar aquí: si el backend responde 401/502/503
             * se evita entrar en otro ciclo de peticiones.
             */
            console.error("Error cargando notificaciones WhatsApp:", error);
        } finally {
            cargandoRef.current = false;
            setLoading(false);
        }
    }, []);

    const cargarSoloConteo = useCallback(async () => {
        try {
            const data = await api.notificacionesNoLeidas();
            setNoLeidas(Number(data?.no_leidas) || 0);
        } catch (error) {
            if (error?.code === "SESSION_EXPIRED") return;
        }
    }, []);

    useEffect(() => {
        const timerInicial = window.setTimeout(cargar, 0);

        const onNuevoMensaje = () => {
            if (abiertoRef.current) {
                cargar();
            } else {
                cargarSoloConteo();
            }
        };

        const onFocus = () => {
            if (!document.hidden) cargar();
        };

        window.addEventListener("whatsapp:nuevo-mensaje", onNuevoMensaje);
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onFocus);

        const intervalo = window.setInterval(cargar, 45000);

        return () => {
            window.clearTimeout(timerInicial);
            window.clearInterval(intervalo);
            window.removeEventListener("whatsapp:nuevo-mensaje", onNuevoMensaje);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onFocus);
        };
    }, [cargar, cargarSoloConteo]);

    const itemsLista = items;

    function togglePanel() {
        const siguiente = !open;
        abiertoRef.current = siguiente;
        setOpen(siguiente);

        if (siguiente) cargar();
    }

    async function abrirChat(item) {
        const ruta = rutaSpaDesdeUrl(item?.url);

        if (ruta) {
            navigate(ruta);
            return;
        }

        if (item?.url) {
            window.location.assign(item.url);
            return;
        }

        if (!item?.id) return;

        try {
            await api.notificacionesMarcarLeida([item.id]);
            window.dispatchEvent(new Event("whatsapp:nuevo-mensaje"));
        } catch (error) {
            if (error?.code === "SESSION_EXPIRED") return;
            console.error("Error marcando leída:", error);
        }
    }

    async function marcarLeida(item) {
        if (!item?.id) return;

        try {
            await api.notificacionesMarcarLeida([item.id]);
            setItems((prev) =>
                prev.map((x) => (x.id === item.id ? { ...x, leida: true } : x)),
            );
            setNoLeidas((prev) => Math.max(0, prev - 1));
        } catch (error) {
            if (error?.code === "SESSION_EXPIRED") return;
            console.error("Error marcando leída:", error);
        }
    }

    async function marcarTodasLeidas() {
        try {
            await api.notificacionesMarcarTodas();
            setItems((prev) => prev.map((x) => ({ ...x, leida: true })));
            setNoLeidas(0);
        } catch (error) {
            if (error?.code === "SESSION_EXPIRED") return;
            console.error("Error marcando todas:", error);
        }
    }

    return (
        <div className="relative">
            <button
                onClick={togglePanel}
                title="Notificaciones de WhatsApp"
                aria-label="Notificaciones de WhatsApp"
                className="relative inline-flex h-10 items-center justify-center rounded-2xl text-white transition hover:shadow-sm"
            >
                <Bell size={18} />

                {noLeidas > 0 ? (
                    <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {noLeidas > 99 ? "99+" : noLeidas}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="absolute right-0 z-[90] mt-3 w-[400px] max-w-[92vw] rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-2xl">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <div className="text-sm font-extrabold text-[#131E5C]">
                                WhatsApp
                            </div>
                            <div className="text-xs text-slate-500">
                                Nuevos mensajes entrantes
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {noLeidas > 0 ? (
                                <button
                                    onClick={marcarTodasLeidas}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                                >
                                    <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                                    Marcar todas
                                </button>
                            ) : null}

                            <div className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-700">
                                {noLeidas}
                            </div>
                        </div>
                    </div>

                    <div className="max-h-[480px] space-y-3 overflow-auto pr-1">
                        {loading ? (
                            <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                                Cargando notificaciones...
                            </div>
                        ) : itemsLista.length === 0 ? (
                            <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                                No tienes notificaciones de WhatsApp.
                            </div>
                        ) : (
                            itemsLista.map((item) => (
                                <div
                                    key={item.id}
                                    className={`rounded-2xl border bg-white p-3 shadow-sm ${
                                        item.leida
                                            ? "border-slate-200"
                                            : "border-emerald-200"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`mt-0.5 rounded-2xl p-2 ${
                                                item.leida
                                                    ? "bg-slate-100 text-slate-500"
                                                    : "bg-emerald-100 text-emerald-700"
                                            }`}
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-extrabold text-slate-900">
                                                        {item.nombre ||
                                                            "Prospecto"}
                                                    </div>
                                                    <div className="mt-0.5 text-xs text-slate-500">
                                                        {timeAgo(item.creado)}
                                                    </div>
                                                </div>

                                                {!item.leida ? (
                                                    <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                                                ) : null}
                                            </div>

                                            <div className="mt-1.5 line-clamp-2 text-sm text-slate-700">
                                                {item.mensaje}
                                            </div>

                                            {item.telefono ? (
                                                <div className="mt-1 text-[11px] font-semibold text-slate-500">
                                                    {formatNumber(item.telefono)}
                                                </div>
                                            ) : null}

                                            <div className="mt-3 flex items-center gap-2">
                                                <button
                                                    onClick={() => abrirChat(item)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#131E5C] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                                                >
                                                    <MessageCircle className="h-3.5 w-3.5" />
                                                    Abrir chat
                                                </button>

                                                {!item.leida ? (
                                                    <button
                                                        onClick={() => marcarLeida(item)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                        Leída
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}