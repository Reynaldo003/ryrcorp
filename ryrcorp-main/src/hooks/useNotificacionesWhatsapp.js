// src/hooks/useNotificacionesWhatsapp.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const FRONTEND_ORIGIN = "https://grupoautomotrizryr.com";
const FRONTEND_BASE = "/crm";
const BACKEND_WS = "wss://crm.grupoautomotrizryr.com";

const SW_URL = `${FRONTEND_BASE}/sw-notificaciones.js`;
const SW_SCOPE = `${FRONTEND_BASE}/`;
const WHATSAPP_ICON = `${FRONTEND_ORIGIN}${FRONTEND_BASE}/whatsapp.svg`;

function normalizarUrlApp(url) {
  if (!url) return FRONTEND_BASE;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith(FRONTEND_BASE + "/")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${FRONTEND_BASE}${url}`;
  }

  return `${FRONTEND_BASE}/${url}`;
}

async function registrarServiceWorkerNotificaciones() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker no soportado en este navegador");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: SW_SCOPE,
      updateViaCache: "none",
    });

    await registration.update();

    console.log("Service Worker de notificaciones registrado:", {
      scope: registration.scope,
      scriptURL: registration.active?.scriptURL,
    });

    return registration;
  } catch (error) {
    console.warn(
      "No se pudo registrar el Service Worker de notificaciones:",
      error,
    );
    return null;
  }
}

function normalizaTelefonoMx(tel) {
  const digits = String(tel || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("521") && digits.length === 13) {
    return `52${digits.slice(3)}`;
  }

  if (digits.length === 10) {
    return `52${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("52")) {
    return digits;
  }

  return digits;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getUserFromLocalStorage() {
  const raw = localStorage.getItem("auth");
  if (!raw) return null;

  const parsed = tryParseJson(raw);
  if (!parsed || typeof parsed !== "object") return null;

  return parsed?.user && typeof parsed.user === "object" ? parsed.user : parsed;
}

function getUsuarioSesion(user) {
  const localUser = getUserFromLocalStorage();

  const usuario =
    user?.usuario ||
    user?.username ||
    user?.user ||
    user?.nombre_usuario ||
    localUser?.usuario ||
    localUser?.username ||
    localUser?.user ||
    localUser?.nombre_usuario ||
    "";

  return String(usuario || "").trim();
}

function getNumeroUsuarioSesion(user) {
  const localUser = getUserFromLocalStorage();

  return normalizaTelefonoMx(
    user?.telefono ||
      user?.numero_asesor ||
      user?.whatsapp_number ||
      user?.phone ||
      localUser?.telefono ||
      localUser?.numero_asesor ||
      localUser?.whatsapp_number ||
      localUser?.phone ||
      "",
  );
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
  if (!("Notification" in window)) {
    console.warn("Este navegador no soporta Notification API");
    return false;
  }

  if (Notification.permission !== "granted") {
    console.warn(
      "Permiso de notificaciones no concedido:",
      Notification.permission,
    );
    return false;
  }

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
    data: {
      url,
    },
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
    console.warn("No se pudo mostrar la notificación nativa:", error);
    return false;
  }
}

export function useNotificacionesWhatsapp({ user, ready, isAuthenticated }) {
  const socketRef = useRef(null);

  const [estado, setEstado] = useState("inactivo");
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
  }, []);

  useEffect(() => {
    setPermisoNotificaciones(getPermisoNotificaciones());
  }, []);

  useEffect(() => {
    if (!ready) {
      setEstado("esperando_auth");
      return;
    }

    if (!isAuthenticated) {
      setEstado("no_autenticado");
      return;
    }

    registrarServiceWorkerNotificaciones();

    console.log("WS WhatsApp user completo:", user);
    console.log("WS WhatsApp usuario detectado:", usuario);
    console.log("WS WhatsApp numeroAsesor detectado:", numeroAsesor);
    console.log("WS WhatsApp esAdmin:", esAdmin);
    console.log("Permiso notificaciones:", getPermisoNotificaciones());

    if (!numeroAsesor && !usuario && !esAdmin) {
      setEstado("sin_identificador");
      console.warn(
        "No se puede conectar WS: falta numeroAsesor, usuario o permiso admin.",
      );
      return;
    }

    let cerradoManual = false;
    let reconnectTimer = null;

    const conectar = () => {
      const params = new URLSearchParams();

      if (numeroAsesor) {
        params.set("numero_asesor", numeroAsesor);
      }

      if (usuario) {
        params.set("usuario", usuario);
      }

      if (esAdmin) {
        params.set("todas", "1");
      }

      const wsUrl = `${BACKEND_WS}/ws/notificaciones/whatsapp/?${params.toString()}`;

      console.log("Conectando WebSocket WhatsApp:", wsUrl);

      setEstado("conectando");

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket WhatsApp conectado");
        setEstado("conectado");
      };

      socket.onmessage = async (event) => {
        let data = null;

        try {
          data = JSON.parse(event.data);
        } catch {
          console.warn("WS mensaje no JSON:", event.data);
          return;
        }

        console.log("WS WhatsApp mensaje recibido:", data);

        if (data.tipo === "conexion_establecida") {
          console.log("Notificaciones activas para:", data.numero_asesor);
          return;
        }

        if (data.tipo !== "whatsapp_mensaje_recibido") return;

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

        const seMostro = await mostrarNotificacionNavegador(notificacion);

        console.log("Intento notificación nativa:", {
          seMostro,
          permiso: getPermisoNotificaciones(),
          hidden: document.hidden,
          visibilityState: document.visibilityState,
          hasFocus: document.hasFocus(),
          icon: WHATSAPP_ICON,
        });
      };

      socket.onerror = (error) => {
        console.warn("Error en WebSocket WhatsApp:", error);
        setEstado("error");
      };

      socket.onclose = (event) => {
        console.warn("WebSocket WhatsApp cerrado:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        if (cerradoManual) return;

        setEstado("reconectando");

        reconnectTimer = window.setTimeout(() => {
          conectar();
        }, 3000);
      };
    };

    conectar();

    return () => {
      cerradoManual = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [ready, isAuthenticated, numeroAsesor, usuario, esAdmin, user]);

  return {
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
