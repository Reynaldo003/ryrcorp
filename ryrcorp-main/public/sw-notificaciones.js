// public/sw-notificaciones.js

const CRM_BASE = "/crm";
const ICON_URL = "/crm/whatsapp.svg";

function normalizarUrl(url) {
  if (!url) return CRM_BASE;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith(CRM_BASE + "/")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${CRM_BASE}${url}`;
  }

  return `${CRM_BASE}/${url}`;
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.tipo !== "MOSTRAR_NOTIFICACION") return;

  const titulo = data.titulo || "Nuevo WhatsApp";
  const opciones = data.opciones || {};

  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: opciones.body || "Tienes un nuevo mensaje de WhatsApp",
      icon: opciones.icon || ICON_URL,
      badge: opciones.badge || ICON_URL,
      tag: opciones.tag || `whatsapp-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
      data: {
        url: normalizarUrl(opciones?.data?.url || CRM_BASE),
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = normalizarUrl(event.notification?.data?.url || CRM_BASE);

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }

        return null;
      }),
  );
});
