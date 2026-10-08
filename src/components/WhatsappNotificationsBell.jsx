// src/components/WhatsappNotificationsBell.jsx

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/apiPruebas";

const INTERVALO_RESPALDO = 120000;
const MIN_INTERVALO_CONSULTA = 30000;
const ESPERA_NUEVOS_MENSAJES = 2500;

export default function WhatsappNotificationsBell({ className = "text-white" }) {
    const location = useLocation();
    const { user, ready, isAuthenticated } = useAuth();
    const activo = Boolean(ready && isAuthenticated);
    const usuarioClave = String(user?.id_usuario || user?.id || user?.usuario || user?.username || "");
    const [noLeidas, setNoLeidas] = useState(0);
    const conteoRef = useRef(0);
    const consultaRef = useRef(null);
    const marcandoRef = useRef(null);
    const ultimoIntentoRef = useRef(0);
    const timerMensajesRef = useRef(null);
    const generacionRef = useRef(0);

    useEffect(() => {
        generacionRef.current += 1;
        conteoRef.current = 0;
        consultaRef.current = null;
        marcandoRef.current = null;
        ultimoIntentoRef.current = 0;
        setNoLeidas(0);
    }, [usuarioClave, activo]);

    const actualizarConteo = useCallback((cantidad) => {
        const numero = Math.max(0, Number(cantidad) || 0);
        conteoRef.current = numero;
        setNoLeidas(numero);
    }, []);

    const cargarConteo = useCallback(async ({ forzar = false } = {}) => {
        if (!activo) return null;

        if (marcandoRef.current) {
            await marcandoRef.current;
            return conteoRef.current;
        }

        if (consultaRef.current) return consultaRef.current;

        const ahora = Date.now();
        if (!forzar && ultimoIntentoRef.current &&
            ahora - ultimoIntentoRef.current < MIN_INTERVALO_CONSULTA) {
            return conteoRef.current;
        }

        ultimoIntentoRef.current = ahora;
        const generacion = generacionRef.current;

        const tarea = api.notificacionesNoLeidas()
            .then((data) => {
                const cantidad = Math.max(0, Number(data?.no_leidas) || 0);
                if (generacion === generacionRef.current) {
                    actualizarConteo(cantidad);
                }
                return cantidad;
            })
            .catch((error) => {
                if (error?.code !== "SESSION_EXPIRED") {
                    console.warn("Error consultando notificaciones:", error);
                }
                return null;
            })
            .finally(() => {
                if (consultaRef.current === tarea) consultaRef.current = null;
            });

        consultaRef.current = tarea;
        return tarea;
    }, [activo, actualizarConteo]);

    const marcarTodas = useCallback(async () => {
        if (!activo) return null;
        if (marcandoRef.current) return marcandoRef.current;

        const cantidad = await cargarConteo();
        if (cantidad === null || cantidad <= 0) return cantidad;
        if (marcandoRef.current) return marcandoRef.current;

        const generacion = generacionRef.current;

        const tarea = api.notificacionesMarcarTodas()
            .then((data) => {
                const restantes = Math.max(0, Number(data?.no_leidas) || 0);
                if (generacion === generacionRef.current) {
                    actualizarConteo(restantes);
                    ultimoIntentoRef.current = Date.now();
                }
                return restantes;
            })
            .catch((error) => {
                if (generacion === generacionRef.current) ultimoIntentoRef.current = 0;
                if (error?.code !== "SESSION_EXPIRED") {
                    console.warn("Error marcando notificaciones:", error);
                }
                return null;
            })
            .finally(() => {
                if (marcandoRef.current === tarea) marcandoRef.current = null;
            });

        marcandoRef.current = tarea;
        return tarea;
    }, [activo, cargarConteo, actualizarConteo]);

    useEffect(() => {
        if (!activo) return undefined;

        const timerInicial = window.setTimeout(() => cargarConteo({ forzar: true }), 0);

        const onNuevoMensaje = (event) => {
            const detalle = event?.detail || {};
            if (detalle.direction === "out" || detalle.mine === true) return;
            if (timerMensajesRef.current) window.clearTimeout(timerMensajesRef.current);

            timerMensajesRef.current = window.setTimeout(() => {
                timerMensajesRef.current = null;
                if (document.visibilityState === "visible") {
                    cargarConteo({ forzar: true });
                }
            }, ESPERA_NUEVOS_MENSAJES);
        };

        const onFocus = () => {
            if (document.visibilityState === "visible") cargarConteo();
        };

        const intervalo = window.setInterval(() => {
            if (document.visibilityState === "visible") {
                cargarConteo({ forzar: true });
            }
        }, INTERVALO_RESPALDO);

        window.addEventListener("whatsapp:nuevo-mensaje", onNuevoMensaje);
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onFocus);

        return () => {
            window.clearTimeout(timerInicial);
            window.clearInterval(intervalo);
            if (timerMensajesRef.current) window.clearTimeout(timerMensajesRef.current);
            timerMensajesRef.current = null;
            window.removeEventListener("whatsapp:nuevo-mensaje", onNuevoMensaje);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onFocus);
        };
    }, [activo, usuarioClave, cargarConteo]);

    useEffect(() => {
        if (!activo || !/\/contacto\/?$/.test(location.pathname)) return undefined;
        let cancelado = false;

        const verificarYMarcar = async () => {
            const cantidad = await cargarConteo({ forzar: true });
            if (!cancelado && cantidad !== null && cantidad > 0) {
                await marcarTodas();
            }
        };

        verificarYMarcar();
        return () => { cancelado = true; };
    }, [activo, usuarioClave, location.pathname, cargarConteo, marcarTodas]);

    return (
        <span
            title="Notificaciones de WhatsApp"
            aria-label="Notificaciones de WhatsApp"
            className={`relative inline-flex h-10 items-center justify-center rounded-2xl ${className}`}
        >
            <Bell size={18} />
            {noLeidas > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {noLeidas > 99 ? "99+" : noLeidas}
                </span>
            )}
        </span>
    );
}
