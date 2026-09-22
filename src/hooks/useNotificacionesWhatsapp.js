// src/hooks/useNotificacionesWhatsapp.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ensureFreshAccessToken, refreshAccessToken } from "../lib/apiPruebas";

const FRONTEND_ORIGIN = "https://grupoautomotrizryr.com";
const FRONTEND_BASE = "/crm";
const BACKEND_WS =
  import.meta.env.VITE_BACKEND_WS || "wss://crm.grupoautomotrizryr.com";

function normalizarUrlApp(url) {
  if (!url) return FRONTEND_BASE;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith(`${FRONTEND_BASE}/`)) return url;
  if (url.startsWith("/")) return `${FRONTEND_BASE}${url}`;
  return `${FRONTEND_BASE}/${url}`;
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

  const rol = String(
    target?.rol?.nombre || target?.rol || target?.rol_name || ""
  )
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
  const heartbeatTimerRef = useRef(null);
  const reintentosRef = useRef(0);
  const cierreManualRef = useRef(false);
  const conectandoRef = useRef(false);
  const idsVistosRef = useRef(new Set());

  const [estado, setEstado] = useState(activo ? "inactivo" : "desactivado");
  const [ultimaNotificacion, setUltimaNotificacion] = useState(null);

  const numeroAsesor = useMemo(() => getNumeroUsuarioSesion(user), [user]);

  const usuario = useMemo(() => getUsuarioSesion(user), [user]);

  const agencia = useMemo(() => {
    const localUser = getUserFromLocalStorage();
    const target = user || localUser || {};
    return String(target?.agencia || "").trim();
  }, [user]);

  const esAdmin = useMemo(() => getEsAdmin(user), [user]);

  const limpiarUltimaNotificacion = useCallback(() => {
    setUltimaNotificacion(null);
  }, []);

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

    function procesarNuevoMensaje(notificacion) {
      if (!efectoActivo || !notificacion) return;

      const id = notificacion.wa_message_id || notificacion.id;

      if (id) {
        if (idsVistosRef.current.has(id)) return;
        idsVistosRef.current.add(id);

        if (idsVistosRef.current.size > 2000) {
          const primero = idsVistosRef.current.values().next().value;
          idsVistosRef.current.delete(primero);
        }
      }

      const notificacionNormalizada = {
        id: notificacion.id || id || `${Date.now()}`,
        ...notificacion,
        url: normalizarUrlApp(notificacion.url),
      };

      setUltimaNotificacion(notificacionNormalizada);

      window.dispatchEvent(
        new CustomEvent("whatsapp:nuevo-mensaje", {
          detail: notificacionNormalizada,
        }),
      );
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

    if (!usuario) {
      setEstado("sin_identificador");
      return undefined;
    }

    cierreManualRef.current = false;

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

      /*
       * El backend resuelve las líneas permitidas desde el JWT
       * (rol + agencia + teléfonos). No enviamos numero_asesor ni
       * "todas" para no ampliar el alcance del lado del cliente.
       */
      const wsUrl = `${BACKEND_WS}/ws/notificaciones/whatsapp/`;

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

        procesarNuevoMensaje(data);
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

    /*
     * Cada vez que React renueva el access token, cerramos el WebSocket
     * viejo (autenticado con el token anterior) y lo reconectamos con el
     * token vigente. Sin esto, una conexión abierta durante horas queda
     * "pegada" a un token que dejó de ser el actual.
     */
    function manejarTokenRefreshed() {
      if (!efectoActivo || cierreManualRef.current || !isAuthenticated) return;

      const socket = socketRef.current;

      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING)
      ) {
        limpiarTimer();
        reintentosRef.current = 0;

        try {
          socket.close(1000, "token_renovado");
        } catch {
          // Sin acción.
        }
      }
    }

    /*
     * Al volver a la pestaña se verifica la conexión: si se cerró en
     * segundo plano se reconecta sin necesidad de recargar la página.
     */
    function manejarVisibilidad() {
      if (!efectoActivo || cierreManualRef.current || !isAuthenticated) return;

      if (document.visibilityState !== "visible") return;

      const socket = socketRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        limpiarTimer();
        reintentosRef.current = 0;
        programarReconexion(1000);
      }
    }

    window.addEventListener("online", manejarOnline);
    window.addEventListener("offline", manejarOffline);
    window.addEventListener("auth:token-refreshed", manejarTokenRefreshed);
    document.addEventListener("visibilitychange", manejarVisibilidad);

    function manejarMensajeLocal(event) {
      procesarNuevoMensaje(event?.detail || {});
    }

    window.addEventListener("whatsapp:mensaje-local", manejarMensajeLocal);

    /*
     * Heartbeat: evita que los proxies corten el WebSocket por
     * inactividad. El consumer responde {tipo: "pong"}.
     */
    heartbeatTimerRef.current = window.setInterval(() => {
      const socket = socketRef.current;

      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ tipo: "ping" }));
        } catch {
          // Sin acción: el manejador de cierre reintentará.
        }
      }
    }, 25000);

    conectar();

    return () => {
      efectoActivo = false;
      cierreManualRef.current = true;
      conectandoRef.current = false;

      limpiarTimer();

      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }

      cerrarSocket();

      window.removeEventListener("online", manejarOnline);
      window.removeEventListener("offline", manejarOffline);
      window.removeEventListener("auth:token-refreshed", manejarTokenRefreshed);
      document.removeEventListener("visibilitychange", manejarVisibilidad);
      window.removeEventListener("whatsapp:mensaje-local", manejarMensajeLocal);
    };
  }, [activo, ready, isAuthenticated, usuario, agencia]);

  return {
    activo,
    estado,
    numeroAsesor,
    usuario,
    agencia,
    esAdmin,
    ultimaNotificacion,
    limpiarUltimaNotificacion,
  };
}
