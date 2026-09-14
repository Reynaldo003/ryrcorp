// src/hooks/useSyncTasks.js
import { useEffect, useRef } from "react";

const BROADCAST_CHANNEL = "ryr-tasks-sync";

function getChannel() {
  if (typeof BroadcastChannel === "undefined") return null;

  try {
    return new BroadcastChannel(BROADCAST_CHANNEL);
  } catch {
    return null;
  }
}

/**
 * Sincronización entre pestañas y dispositivos para los gestores de tareas:
 * - Polling mientras la pestaña es visible (cubre dispositivos que no
 *   comparten pestaña con el creador de la tarea).
 * - Refetch al volver a la pestaña (focus / visibilitychange).
 * - Refresh inmediato entre pestañas del mismo navegador vía BroadcastChannel,
 *   activado con notifyTasksChanged() después de cada mutación local.
 */
export function useSyncTasks(refresh, { interval = 20000 } = {}) {
  const refreshRef = useRef(refresh);
  const busyRef = useRef(false);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    let channel = getChannel();

    const run = async () => {
      if (busyRef.current) return;
      if (typeof refreshRef.current !== "function") return;
      if (document.hidden) return;

      busyRef.current = true;

      try {
        await refreshRef.current();
      } catch (error) {
        console.error("Error en refresco de sincronización:", error);
      } finally {
        busyRef.current = false;
      }
    };

    const timer = window.setInterval(run, interval);

    const onVisibilityOrFocus = () => {
      if (!document.hidden) run();
    };

    const onChannelMessage = (event) => {
      if (event?.data?.type === "TASKS_CHANGED") run();
    };

    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("focus", onVisibilityOrFocus);
    channel?.addEventListener("message", onChannelMessage);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("focus", onVisibilityOrFocus);
      channel?.removeEventListener("message", onChannelMessage);
      channel?.close();
      channel = null;
    };
  }, [interval]);
}

/**
 * Avisa a otras pestañas del mismo navegador que las tareas cambiaron,
 * para que refresquen de inmediato (complemento del polling entre dispositivos).
 */
export function notifyTasksChanged() {
  const channel = getChannel();
  if (!channel) return;

  try {
    channel.postMessage({ type: "TASKS_CHANGED" });
  } catch (error) {
    console.error("Error notificando cambio de tareas:", error);
  } finally {
    channel.close();
  }
}