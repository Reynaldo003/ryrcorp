// src/app/NotificacionesWhatsappRoot.jsx
import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { useNotificacionesWhatsapp } from "../hooks/useNotificacionesWhatsapp";
import { getAccessToken } from "../lib/apiClient";

function WhatsAppToast({ notificacion, onClose }) {
    useEffect(() => {
        if (!notificacion) return;

        const timer = window.setTimeout(() => {
            onClose();
        }, 9000);

        return () => {
            window.clearTimeout(timer);
        };
    }, [notificacion, onClose]);

    if (!notificacion) return null;

    const nombre = notificacion.nombre || "Prospecto";
    const mensaje = notificacion.mensaje || "Nuevo mensaje de WhatsApp";

    const abrirChat = () => {
        if (notificacion.url) {
            window.location.href = notificacion.url;
            return;
        }

        onClose();
    };

    return (
        <div className="fixed right-4 top-4 z-[9999] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl">
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
                    <img src="/crm/whatsapp.svg" alt="WhatsApp" className="h-6 w-6" />
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

function ActivarNotificacionesCard({ permiso, onActivar, onClose }) {
    if (permiso === "granted") return null;
    if (permiso === "unsupported") return null;

    if (permiso === "denied") {
        return (
            <div className="fixed bottom-4 right-4 z-[9998] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-red-200 bg-white p-4 pr-12 shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar aviso"
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                    ×
                </button>

                <div className="text-sm font-extrabold text-[#131E5C]">
                    Notificaciones bloqueadas
                </div>

                <div className="mt-1 text-xs font-semibold text-slate-600">
                    Actívalas desde el candado de la barra de dirección del navegador para recibir avisos cuando estés en otra pestaña.
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9998] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-emerald-200 bg-white p-4 pr-12 shadow-2xl">
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar aviso"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
                ×
            </button>

            <div className="text-sm font-extrabold text-[#131E5C]">
                Activar notificaciones
            </div>

            <div className="mt-1 text-xs font-semibold text-slate-600">
                Permite notificaciones para recibir avisos de WhatsApp cuando estés en otra pestaña.
            </div>

            <button
                type="button"
                onClick={onActivar}
                className="mt-3 rounded-xl bg-[#131E5C] px-4 py-2 text-xs font-extrabold text-white hover:bg-[#131E5C]/90"
            >
                Activar
            </button>
        </div>
    );
}

export default function NotificacionesWhatsappRoot() {
    const { user, ready, isAuthenticated } = useAuth();

    const [cardNotificacionesCerrada, setCardNotificacionesCerrada] = useState(false);

    const accessToken = useMemo(() => {
        if (!ready || !isAuthenticated) return "";
        return getAccessToken();
    }, [ready, isAuthenticated, user]);

    const {
        estado,
        numeroAsesor,
        usuario,
        esAdmin,
        permisoNotificaciones,
        ultimaNotificacion,
        limpiarUltimaNotificacion,
        solicitarPermisoNotificaciones,
    } = useNotificacionesWhatsapp({
        user,
        ready,
        isAuthenticated,
        accessToken,
    });

    useEffect(() => {
        if (!import.meta.env.DEV) return;

        console.log("Estado notificaciones WhatsApp:", {
            estado,
            numeroAsesor,
            usuario,
            esAdmin,
            permisoNotificaciones,
            tieneJwt: Boolean(accessToken),
        });
    }, [estado, numeroAsesor, usuario, esAdmin, permisoNotificaciones, accessToken]);

    useEffect(() => {
        setCardNotificacionesCerrada(false);
    }, [permisoNotificaciones]);

    if (!ready || !isAuthenticated) return null;

    return (
        <>
            {!cardNotificacionesCerrada && (
                <ActivarNotificacionesCard
                    permiso={permisoNotificaciones}
                    onActivar={solicitarPermisoNotificaciones}
                    onClose={() => setCardNotificacionesCerrada(true)}
                />
            )}

            <WhatsAppToast
                notificacion={ultimaNotificacion}
                onClose={limpiarUltimaNotificacion}
            />
        </>
    );
}