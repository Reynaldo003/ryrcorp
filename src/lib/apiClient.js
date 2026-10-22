// src/lib/apiClient.js
import { http as httpPruebas, getAccessToken } from "./apiPruebas";

export { getAccessToken };

export const API_ROOT =
  import.meta.env.VITE_API_URL ||
  "https://crm.grupoautomotrizryr.com".replace(/\/+$/, "");
// "http://127.0.0.1:8000".replace(/\/+$/, "");

export function getWebSocketAuthQuery() {
  const token = getAccessToken();

  if (!token) return "";

  return `token=${encodeURIComponent(token)}`;
}

function isFormData(body) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function buildBody({ body, data } = {}) {
  if (data !== undefined) return JSON.stringify(data);

  if (body === undefined || body === null) return body;
  if (typeof body === "string") return body;
  if (isFormData(body)) return body;

  return JSON.stringify(body);
}

function shouldRedirectOnUnauthorized(path) {
  const value = String(path || "");
  return !value.includes("/api/public/");
}

async function fetchPublic(path, { method = "GET", body, headers = {} } = {}) {
  const finalHeaders = { Accept: "application/json", ...headers };

  if (
    !isFormData(body) &&
    body !== undefined &&
    !finalHeaders["Content-Type"]
  ) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(
    `${API_ROOT}${path.startsWith("/") ? path : `/${path}`}`,
    {
      method,
      headers: finalHeaders,
      body,
    },
  );

  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type") || "";
  const responseData = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (responseData &&
        (responseData.detail || responseData.error || responseData.message)) ||
      `HTTP ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = responseData;
    throw error;
  }

  return responseData;
}

export async function http(
  path,
  {
    method = "GET",
    body,
    data,
    headers = {},
    auth = true,
    retryWithoutAuth = true,
    redirectOnUnauthorized = shouldRedirectOnUnauthorized(path),
  } = {},
) {
  const finalBody = buildBody({ body, data });

  const finalHeaders = { ...headers };
  if (
    !isFormData(finalBody) &&
    finalBody !== undefined &&
    !finalHeaders["Content-Type"]
  ) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (!auth) {
    return fetchPublic(path, {
      method,
      body: finalBody,
      headers: finalHeaders,
    });
  }

  try {
    return await httpPruebas(path, {
      method,
      body: finalBody,
      headers: finalHeaders,
    });
  } catch (error) {
    if (error?.code === "SESSION_EXPIRED" && retryWithoutAuth) {
      return fetchPublic(path, {
        method,
        body: finalBody,
        headers: finalHeaders,
      });
    }
    throw error;
  }
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (value === "Todos" || value === "Todas") return;
    query.append(key, value);
  });

  const text = query.toString();

  return text ? `?${text}` : "";
}

export async function descargarArchivoCRM(path, nombreArchivo) {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Tu sesión no está disponible. Inicia sesión nuevamente.");
  }

  const url = `${API_ROOT.replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;

  const respuesta = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!respuesta.ok) {
    throw new Error(`No se pudo descargar el archivo (HTTP ${respuesta.status}).`);
  }

  const archivo = await respuesta.blob();

  const urlTemporal = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");

  enlace.href = urlTemporal;
  enlace.download = nombreArchivo || "archivo";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  setTimeout(() => {
    URL.revokeObjectURL(urlTemporal);
  }, 1000);
}