// src/components/WhatsappNotificationsBell.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { api } from "../lib/apiPruebas";

export default function WhatsappNotificationsBell({
    className = "text-white",
}) {
    const location = useLocation();
    const [noLeidas, setNoLeidas] = useState(0);
    const cargandoRef = useRef(false);

    const cargarConteo = useCallback(async () => {
        try {
            const data = await api.notificacionesNoLeidas();
            setNoLeidas(Number(data?.no_leidas) || 0);
        } catch (error) {
            if (error?.code === "SESSION_EXPIRED") return;
        }
    }, []);

    const reiniciarConteo = useCallback(async () => {
        if (cargandoRef.current) return;

        cargandoRef.current = true;

        try {
            await api.notificacionesMarcarTodas();
            setNoLeidas(0);
        } catch (error) {
            if (error?.code === "SESSION_EXPIRED") return;
            console.error("Error reiniciando notificaciones WhatsApp:", error);
        } finally {
            cargandoRef.current = false;
        }
    }, []);

    useEffect(() => {
        const timerInicial = window.setTimeout(cargarConteo, 0);

        const onNuevoMensaje = () => cargarConteo();
        const onFocus = () => {
            if (!document.hidden) cargarConteo();
        };

        window.addEventListener("whatsapp:nuevo-mensaje", onNuevoMensaje);
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onFocus);

        const intervalo = window.setInterval(cargarConteo, 45000);

        return () => {
            window.clearTimeout(timerInicial);
            window.clearInterval(intervalo);
            window.removeEventListener("whatsapp:nuevo-mensaje", onNuevoMensaje);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onFocus);
        };
    }, [cargarConteo]);

    /*
     * Al entrar a la página de contactos el contador vuelve a 0:
     * el asesor ya ve ahí las conversaciones nuevas.
     */
    useEffect(() => {
        if (location.pathname.endsWith("/contacto")) {
            const timerReinicio = window.setTimeout(reiniciarConteo, 0);
            return () => window.clearTimeout(timerReinicio);
        }

        return undefined;
    }, [location.pathname, reiniciarConteo]);

    return (
        <span
            title="Notificaciones de WhatsApp"
            aria-label="Notificaciones de WhatsApp"
            className={`relative inline-flex h-10 items-center justify-center rounded-2xl ${className}`}
        >
            <Bell size={18} />

            {noLeidas > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {noLeidas > 99 ? "99+" : noLeidas}
                </span>
            ) : null}
        </span>
    );
}