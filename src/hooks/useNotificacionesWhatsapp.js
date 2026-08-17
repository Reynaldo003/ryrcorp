// src/hooks/useNotificacionesWhatsapp.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ensureFreshAccessToken, refreshAccessToken } from "../lib/apiPruebas";

const FRONTEND_ORIGIN = "https://grupoautomotrizryr.com";
const FRONTEND_BASE = "/crm";
const BACKEND_WS = "wss://crm.grupoautomotrizryr.com";
const SW_URL = `${FRONTEND_BASE}/sw-notificaciones.js`;
const SW_SCOPE = `${FRONTEND_BASE}/`;
const WHATSAPP_ICON = `${FRONTEND_ORIGIN}${FRONTEND_BASE}/whatsapp.svg`;

function normalizarUrlApp(url) {
  if (!url) return FRONTEND_BASE;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith(`${FRONTEND_BASE}/`)) return url;
  if (url.startsWith("/")) return `${FRONTEND_BASE}${url}`;
  return `${FRONTEND_BASE}/${url}`;
}

async function registrarServiceWorkerNotificaciones() {
  if (!("serviceWorker" in navigator)) return null;

  try {
    return await navigator.serviceWorker.register(SW_URL, {
      scope: SW_SCOPE,
      updateViaCache: "none",
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("No se pudo registrar el Service Worker:", error);
    }
    return null;
  }
}

function normalizaTelefonoMx(tel) {
  const digits = String(tel || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("521") && digits.length === 13)
    return `52${digits.slice(3)}`;
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith("52")) return digits;
  return "";
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getUserFromLocalStorage() {
  try {
    const raw = localStorage.getItem("auth");
    if (!raw) return null;

    const parsed = tryParseJson(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return parsed?.user && typeof parsed.user === "object"
      ? parsed.user
      : parsed;
  } catch {
    return null;
  }
}

function getUsuarioSesion(user) {
  const localUser = getUserFromLocalStorage();

  return String(
    user?.usuario ||
      user?.username ||
      user?.user ||
      user?.nombre_usuario ||
      localUser?.usuario ||
      localUser?.username ||
      localUser?.user ||
      localUser?.nombre_usuario ||
      "",
  ).trim();
}

function obtenerNumerosUsuario(user) {
  const localUser = getUserFromLocalStorage();
  const target = user || localUser || {};

  const raw =
    target?.telefonos_whatsapp ??
    target?.telefonos ??
    target?.telefono ??
    target?.numero_asesor ??
    target?.whatsapp_number ??
    target?.phone ??
    "";

  const partes = Array.isArray(raw) ? raw : String(raw || "").split(/[|,;\n]+/);

  return [
    ...new Set(
      partes
        .map(normalizaTelefonoMx)
        .filter((numero) => /^52\d{10}$/.test(numero)),
    ),
  ];
}

function getNumeroUsuarioSesion(user) {
  return obtenerNumerosUsuario(user)[0] || "";
}

function getEsAdmin(user) {
  const localUser = getUserFromLocalStorage();
  const target = user || localUser || {};

  const rol = String(target?.rol || "")
    .trim()
    .toLowerCase();
  const permisos = Array.isArray(target?.permisos) ? target.permisos : [];

  return (
    rol === "administrador" ||
    rol === "admin" ||
    permisos.includes("ALL") ||
    permisos.includes("USUARIOS_ADMIN") ||
    permisos.includes("DIGITALES_ADMIN")
  );
}

function getPermisoNotificaciones() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

async function mostrarNotificacionNavegador(data) {
  if (!("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  const nombre = data?.nombre || "Prospecto";
  const mensaje = data?.mensaje || "Nuevo mensaje de WhatsApp";
  const url = data?.url?.startsWith("/crm/")
    ? data.url
    : `/crm${data?.url || "/comercial/prospectos/contacto"}`;

  const opciones = {
    body: mensaje,
    icon: "/crm/whatsapp.svg",
    badge: "/crm/whatsapp.svg",
    tag: data?.wa_message_id || `whatsapp-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: { url },
  };

  try {
    const registration = await navigator.serviceWorker.getRegistration("/crm/");

    if (registration) {
      await registration.showNotification(
        `Nuevo WhatsApp de ${nombre}`,
        opciones,
      );
      return true;
    }

    const notificacion = new Notification(
      `Nuevo WhatsApp de ${nombre}`,
      opciones,
    );

    notificacion.onclick = () => {
      notificacion.close();
      window.focus();
      window.location.href = url;
    };

    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("No se pudo mostrar la notificación:", error);
    }
    return false;
  }
}

function calcularEsperaReconexion(intento) {
  const esperas = [5000, 10000, 20000, 30000, 60000];
  const base = esperas[Math.min(intento, esperas.length - 1)];
  return base + Math.floor(Math.random() * 2000);
}

export function useNotificacionesWhatsapp({
  user,
  ready,
  isAuthenticated,
  activo = true,
}) {
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reintentosRef = useRef(0);
  const cierreManualRef = useRef(false);
  const conectandoRef = useRef(false);

  const [estado, setEstado] = useState(activo ? "inactivo" : "desactivado");
  const [ultimaNotificacion, setUltimaNotificacion] = useState(null);
  const [permisoNotificaciones, setPermisoNotificaciones] = useState(() => {
    if (typeof window === "undefined") return "unsupported";
    return getPermisoNotificaciones();
  });

  const numeroAsesor = useMemo(() => getNumeroUsuarioSesion(user), [user]);

  const usuario = useMemo(() => getUsuarioSesion(user), [user]);

  const esAdmin = useMemo(() => getEsAdmin(user), [user]);

  const limpiarUltimaNotificacion = useCallback(() => {
    setUltimaNotificacion(null);
  }, []);

  const solicitarPermisoNotificaciones = useCallback(async () => {
    if (!activo) return "disabled";

    if (!("Notification" in window)) {
      setPermisoNotificaciones("unsupported");
      return "unsupported";
    }

    const permiso = await Notification.requestPermission();
    setPermisoNotificaciones(permiso);

    if (permiso === "granted") {
      await registrarServiceWorkerNotificaciones();
    }

    return permiso;
  }, [activo]);

  useEffect(() => {
    if (!activo) return;
    setPermisoNotificaciones(getPermisoNotificaciones());
  }, [activo]);

  useEffect(() => {
    let efectoActivo = true;

    function limpiarTimer() {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function cerrarSocket() {
      const socket = socketRef.current;
      socketRef.current = null;

      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING)
      ) {
        try {
          socket.close(1000, "cierre_controlado");
        } catch {
          // Sin acción.
        }
      }
    }

    if (!activo) {
      cierreManualRef.current = true;
      limpiarTimer();
      cerrarSocket();
      setEstado("desactivado");
      return undefined;
    }

    if (!ready) {
      setEstado("esperando_auth");
      return undefined;
    }

    if (!isAuthenticated) {
      cierreManualRef.current = true;
      limpiarTimer();
      cerrarSocket();
      setEstado("no_autenticado");
      return undefined;
    }

    if (!numeroAsesor && !usuario && !esAdmin) {
      setEstado("sin_identificador");
      return undefined;
    }

    cierreManualRef.current = false;
    registrarServiceWorkerNotificaciones();

    function programarReconexion(esperaForzada = null) {
      if (
        !efectoActivo ||
        cierreManualRef.current ||
        !isAuthenticated ||
        reconnectTimerRef.current
      ) {
        return;
      }

      if (!navigator.onLine) {
        setEstado("sin_red");
        return;
      }

      const intento = reintentosRef.current;
      const espera = esperaForzada ?? calcularEsperaReconexion(intento);

      reintentosRef.current += 1;
      setEstado("reconectando");

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        conectar();
      }, espera);
    }

    async function conectar() {
      if (
        !efectoActivo ||
        cierreManualRef.current ||
        !isAuthenticated ||
        conectandoRef.current
      ) {
        return;
      }

      const existente = socketRef.current;

      if (
        existente &&
        (existente.readyState === WebSocket.OPEN ||
          existente.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      if (!navigator.onLine) {
        setEstado("sin_red");
        return;
      }

      conectandoRef.current = true;
      setEstado("validando_sesion");

      let token = "";

      try {
        token = await ensureFreshAccessToken();
      } catch (error) {
        conectandoRef.current = false;

        if (!efectoActivo || cierreManualRef.current) return;

        if (error?.authRejected || error?.code === "SESSION_EXPIRED") {
          setEstado("sesion_expirada");
          return;
        }

        setEstado("error_auth");
        programarReconexion();
        return;
      }

      if (!token) {
        conectandoRef.current = false;
        setEstado("sin_token");
        return;
      }

      const params = new URLSearchParams();

      if (numeroAsesor) params.set("numero_asesor", numeroAsesor);
      if (usuario) params.set("usuario", usuario);
      if (esAdmin) params.set("todas", "1");

      const wsUrl = `${BACKEND_WS}/ws/notificaciones/whatsapp/?${params.toString()}`;

      setEstado("conectando");

      let socket;

      try {
        /*
         * JWT por subprotocolo para no exponerlo en los access logs de Apache.
         * El backend acepta "crm-jwt" y toma el segundo valor como token.
         */
        socket = new WebSocket(wsUrl, ["crm-jwt", token]);
      } catch {
        conectandoRef.current = false;
        setEstado("error");
        programarReconexion();
        return;
      }

      socketRef.current = socket;
      conectandoRef.current = false;

      socket.onopen = () => {
        if (!efectoActivo || socketRef.current !== socket) return;

        reintentosRef.current = 0;
        setEstado("conectado");
      };

      socket.onmessage = async (event) => {
        if (!efectoActivo) return;

        let data;

        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data?.tipo === "conexion_establecida") return;
        if (data?.tipo !== "whatsapp_mensaje_recibido") return;

        const notificacion = {
          id: data.wa_message_id || `${Date.now()}`,
          ...data,
          url: normalizarUrlApp(data.url),
        };

        setUltimaNotificacion(notificacion);

        window.dispatchEvent(
          new CustomEvent("whatsapp:nuevo-mensaje", {
            detail: notificacion,
          }),
        );

        await mostrarNotificacionNavegador(notificacion);
      };

      socket.onerror = () => {
        if (
          efectoActivo &&
          !cierreManualRef.current &&
          socketRef.current === socket
        ) {
          setEstado("error");
        }
      };

      socket.onclose = async (event) => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (!efectoActivo || cierreManualRef.current) return;

        if (event.code === 4403) {
          setEstado("sin_permiso");
          return;
        }

        if (event.code === 4401) {
          setEstado("renovando_sesion");

          try {
            await refreshAccessToken();

            if (!efectoActivo || cierreManualRef.current) return;

            reintentosRef.current = 0;
            programarReconexion(1000);
            return;
          } catch (error) {
            if (error?.authRejected) {
              setEstado("sesion_expirada");
              return;
            }

            setEstado("error_auth");
            programarReconexion();
            return;
          }
        }

        programarReconexion();
      };
    }

    function manejarOnline() {
      if (!efectoActivo || cierreManualRef.current) return;

      limpiarTimer();
      reintentosRef.current = 0;
      conectar();
    }

    function manejarOffline() {
      limpiarTimer();
      setEstado("sin_red");
    }

    window.addEventListener("online", manejarOnline);
    window.addEventListener("offline", manejarOffline);

    conectar();

    return () => {
      efectoActivo = false;
      cierreManualRef.current = true;
      conectandoRef.current = false;

      limpiarTimer();
      cerrarSocket();

      window.removeEventListener("online", manejarOnline);
      window.removeEventListener("offline", manejarOffline);
    };
  }, [activo, ready, isAuthenticated, numeroAsesor, usuario, esAdmin]);

  return {
    activo,
    estado,
    numeroAsesor,
    usuario,
    esAdmin,
    permisoNotificaciones,
    ultimaNotificacion,
    limpiarUltimaNotificacion,
    solicitarPermisoNotificaciones,
  };
}
