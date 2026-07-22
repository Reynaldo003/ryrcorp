// src/lib/apiPruebas.js

const API =
  import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const LOGIN_PATH = "/login";
const ACCESS_REFRESH_MARGIN_SECONDS = 60;

let refreshTokenPromise = null;

function createAuthError(
  message,
  { code = "AUTH_ERROR", status = 0, rejected = false, cause = null } = {},
) {
  const error = new Error(message);

  error.code = code;
  error.status = status;
  error.authRejected = rejected;
  error.cause = cause;

  return error;
}

function cleanToken(value) {
  const token = String(value || "").trim();

  if (!token || token === "undefined" || token === "null") {
    return "";
  }

  return token;
}

function isJwt(token) {
  return cleanToken(token).split(".").length === 3;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function decodeJwtPayload(token) {
  const value = cleanToken(token);

  if (!isJwt(value)) {
    return null;
  }

  try {
    const payloadPart = value.split(".")[1];

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");

    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function jwtExpiresSoon(token, marginSeconds = ACCESS_REFRESH_MARGIN_SECONDS) {
  const payload = decodeJwtPayload(token);
  const expiresAt = Number(payload?.exp || 0);

  if (!expiresAt) {
    return false;
  }

  const currentSeconds = Math.floor(Date.now() / 1000);

  return expiresAt - currentSeconds <= marginSeconds;
}

function isRefreshEndpoint(path) {
  return String(path || "").includes("/api/auth/token/refresh/");
}

function isLoginEndpoint(path) {
  return String(path || "").includes("/api/auth/login/");
}

function isFormData(value) {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function getAuthObject() {
  try {
    const raw = localStorage.getItem("auth");

    if (!raw) {
      return null;
    }

    const parsed = tryParseJson(raw);

    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function saveAuthObject(nextAuth) {
  try {
    localStorage.setItem("auth", JSON.stringify(nextAuth || {}));
  } catch {
    // Sin acción.
  }
}

function getStoredUserObject() {
  const auth = getAuthObject();

  if (auth?.user && typeof auth.user === "object") {
    return auth.user;
  }

  const candidateKeys = ["crm.user", "user"];

  for (const key of candidateKeys) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        continue;
      }

      const parsed = tryParseJson(raw);

      if (!parsed || typeof parsed !== "object") {
        continue;
      }

      if (parsed.user && typeof parsed.user === "object") {
        return parsed.user;
      }

      return parsed;
    } catch {
      // Continúa buscando.
    }
  }

  return null;
}

function getAccessToken() {
  const directCandidates = [
    localStorage.getItem("@token_access_jwt"),
    localStorage.getItem("auth.access"),
    localStorage.getItem("access"),
    localStorage.getItem("token"),
  ];

  for (const candidate of directCandidates) {
    const token = cleanToken(candidate);

    if (isJwt(token)) {
      return token;
    }
  }

  const auth = getAuthObject();

  const authCandidates = [
    auth?.access,
    auth?.access_token,
    auth?.token,
    auth?.jwt,
  ];

  for (const candidate of authCandidates) {
    const token = cleanToken(candidate);

    if (isJwt(token)) {
      return token;
    }
  }

  return "";
}

function getRefreshToken() {
  const directCandidates = [
    localStorage.getItem("@token_refresh_jwt"),
    localStorage.getItem("auth.refresh"),
    localStorage.getItem("refresh"),
  ];

  for (const candidate of directCandidates) {
    const token = cleanToken(candidate);

    if (isJwt(token)) {
      return token;
    }
  }

  const auth = getAuthObject();

  const authCandidates = [auth?.refresh, auth?.refresh_token];

  for (const candidate of authCandidates) {
    const token = cleanToken(candidate);

    if (isJwt(token)) {
      return token;
    }
  }

  return "";
}

function getAuthHeader() {
  const token = getAccessToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

function saveJwtTokens({ access, refresh } = {}) {
  const accessToken = cleanToken(access);

  const refreshToken = cleanToken(refresh);

  const auth = getAuthObject() || {};

  const user = getStoredUserObject() || auth.user || null;

  const nextAuth = {
    ...auth,
    ...(user ? { user } : {}),
  };

  if (isJwt(accessToken)) {
    localStorage.setItem("@token_access_jwt", accessToken);

    localStorage.setItem("auth.access", accessToken);

    nextAuth.access = accessToken;
    nextAuth.token = accessToken;
  }

  if (isJwt(refreshToken)) {
    localStorage.setItem("@token_refresh_jwt", refreshToken);

    localStorage.setItem("auth.refresh", refreshToken);

    nextAuth.refresh = refreshToken;
  }

  saveAuthObject(nextAuth);
}

function clearJwtTokensOnly() {
  const keys = [
    "@token_access_jwt",
    "@token_refresh_jwt",
    "auth.access",
    "auth.refresh",
    "auth.token",
    "access",
    "refresh",
    "token",
  ];

  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Sin acción.
    }
  }

  const auth = getAuthObject();

  if (auth && typeof auth === "object") {
    delete auth.access;
    delete auth.refresh;
    delete auth.token;
    delete auth.access_token;
    delete auth.refresh_token;
    delete auth.jwt;

    saveAuthObject(auth);
  }
}

function clearFullSession() {
  clearJwtTokensOnly();

  try {
    localStorage.removeItem("auth");
  } catch {
    // Sin acción.
  }
}

function redirectToLogin() {
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.href = LOGIN_PATH;
  }
}

async function executeRefreshAccessToken() {
  const refresh = getRefreshToken();

  if (!refresh) {
    throw createAuthError("No hay refresh token disponible.", {
      code: "REFRESH_TOKEN_MISSING",
      rejected: true,
    });
  }

  let response;

  try {
    response = await fetch(`${API}/conformidad/api/auth/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh,
      }),
    });
  } catch (cause) {
    throw createAuthError(
      "No se pudo conectar con el servidor para renovar la sesión.",
      {
        code: "REFRESH_NETWORK_ERROR",
        cause,
      },
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.access) {
    const rejected = response.status === 401 || response.status === 403;

    throw createAuthError(
      data?.detail || data?.error || "No se pudo renovar la sesión.",
      {
        code: rejected ? "REFRESH_TOKEN_REJECTED" : "REFRESH_REQUEST_FAILED",
        status: response.status,
        rejected,
      },
    );
  }

  saveJwtTokens({
    access: data.access,
    refresh: data.refresh || refresh,
  });

  return data.access;
}

function refreshAccessToken() {
  if (!refreshTokenPromise) {
    refreshTokenPromise = executeRefreshAccessToken().finally(() => {
      refreshTokenPromise = null;
    });
  }

  return refreshTokenPromise;
}

async function ensureFreshAccessToken() {
  const access = getAccessToken();
  const refresh = getRefreshToken();

  if (!access && !refresh) {
    return "";
  }

  if (access && !jwtExpiresSoon(access)) {
    return access;
  }

  if (refresh) {
    return refreshAccessToken();
  }

  throw createAuthError(
    "La sesión no puede renovarse porque no existe refresh token.",
    {
      code: "REFRESH_TOKEN_MISSING",
      rejected: true,
    },
  );
}

function closeExpiredSession() {
  clearFullSession();
  redirectToLogin();
}

function normalizaTelefonoMx(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

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

function getCrmUsername() {
  const user = getStoredUserObject();

  if (!user) {
    return "";
  }

  return String(
    user.usuario ||
      user.username ||
      user.user ||
      user.nombre_usuario ||
      user.correo ||
      user.email ||
      "",
  ).trim();
}

function getWhatsAppNumbersFromSources() {
  const user = getStoredUserObject();

  if (!user) {
    return [];
  }

  const raw =
    user.telefonos_whatsapp ??
    user.telefonos ??
    user.telefono ??
    user.numero_asesor ??
    user.whatsapp_number ??
    user.phone ??
    "";

  const parts = Array.isArray(raw) ? raw : String(raw || "").split(/[|,;\n]+/);

  return [
    ...new Set(
      parts
        .map(normalizaTelefonoMx)
        .filter((numero) => /^52\d{10}$/.test(numero)),
    ),
  ];
}

function getWhatsAppNumberFromSources(preferredNumber = "") {
  const explicitNumber = normalizaTelefonoMx(preferredNumber);

  if (/^52\d{10}$/.test(explicitNumber)) {
    return explicitNumber;
  }

  return getWhatsAppNumbersFromSources()[0] || "";
}

function withRequestContext(payload = {}) {
  const source = payload && typeof payload === "object" ? payload : {};

  const numero = getWhatsAppNumberFromSources(source.numero_asesor || "");

  const usuario = String(source.usuario || "").trim() || getCrmUsername();

  return {
    ...source,
    ...(numero
      ? {
          numero_asesor: numero,
        }
      : {}),
    ...(usuario
      ? {
          usuario,
        }
      : {}),
  };
}

function buildQuery(params = {}) {
  const queryParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    queryParams.set(key, String(value));
  });

  const query = queryParams.toString();

  return query ? `?${query}` : "";
}

function appendContextToFormData(formData, numeroAsesor = "") {
  if (!(formData instanceof FormData)) {
    throw new Error("Se esperaba una instancia de FormData.");
  }

  const numero = getWhatsAppNumberFromSources(numeroAsesor);

  const usuario = getCrmUsername();

  if (numero) {
    formData.set("numero_asesor", numero);
  }

  if (usuario) {
    formData.set("usuario", usuario);
  }

  return formData;
}

function normalizeTelInput(input = {}) {
  if (typeof input === "string" || typeof input === "number") {
    return {
      tel: String(input),
    };
  }

  return input || {};
}

async function parseErrorResponse(response) {
  const text = await response.text().catch(() => "");

  if (!text) {
    return `HTTP ${response.status}`;
  }

  const json = tryParseJson(text);

  if (json?.detail) {
    return json.detail;
  }

  if (json?.error) {
    return json.error;
  }

  if (json?.message) {
    return json.message;
  }

  if (json && typeof json === "object") {
    const firstEntry = Object.entries(json)[0];

    if (firstEntry) {
      const [field, value] = firstEntry;

      const detail = Array.isArray(value) ? value.join(" ") : String(value);

      return `${field}: ${detail}`;
    }
  }

  return text;
}

async function http(
  path,
  {
    method = "GET",
    body,
    headers,
    _retryRefresh = true,
    _skipProactiveRefresh = false,
  } = {},
) {
  const refreshRequest = isRefreshEndpoint(path);

  const loginRequest = isLoginEndpoint(path);

  if (!_skipProactiveRefresh && !refreshRequest && !loginRequest) {
    try {
      await ensureFreshAccessToken();
    } catch (error) {
      if (error?.authRejected) {
        closeExpiredSession();

        throw createAuthError("Tu sesión expiró. Inicia sesión nuevamente.", {
          code: "SESSION_EXPIRED",
          status: error?.status || 401,
          rejected: true,
          cause: error,
        });
      }

      throw error;
    }
  }

  const finalHeaders = {
    ...getAuthHeader(),
    ...(headers || {}),
  };

  if (isFormData(body)) {
    delete finalHeaders["Content-Type"];

    delete finalHeaders["content-type"];
  }

  let response;

  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers: finalHeaders,
      body,
    });
  } catch (cause) {
    throw createAuthError("No fue posible conectar con el servidor.", {
      code: "NETWORK_ERROR",
      cause,
    });
  }

  if (
    response.status === 401 &&
    _retryRefresh &&
    !refreshRequest &&
    !loginRequest
  ) {
    try {
      await refreshAccessToken();
    } catch (error) {
      if (error?.authRejected) {
        closeExpiredSession();

        throw createAuthError("Tu sesión expiró. Inicia sesión nuevamente.", {
          code: "SESSION_EXPIRED",
          status: error?.status || 401,
          rejected: true,
          cause: error,
        });
      }

      throw error;
    }

    return http(path, {
      method,
      body,
      headers,
      _retryRefresh: false,
      _skipProactiveRefresh: true,
    });
  }

  if (response.status === 401 && !refreshRequest && !loginRequest) {
    closeExpiredSession();

    throw createAuthError("Tu sesión expiró. Inicia sesión nuevamente.", {
      code: "SESSION_EXPIRED",
      status: 401,
      rejected: true,
    });
  }

  if (!response.ok) {
    const message = await parseErrorResponse(response);

    throw createAuthError(message || `HTTP ${response.status}`, {
      code: "HTTP_ERROR",
      status: response.status,
    });
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function getNumeroAsesorIA(numeroAsesor) {
  const raw = String(numeroAsesor || "").trim();

  if (!raw) {
    throw new Error("Falta seleccionar una línea de WhatsApp.");
  }

  if (["GLOBAL", "TODOS", "ALL", "*"].includes(raw.toUpperCase())) {
    throw new Error(
      "La configuración global ya no está permitida. Selecciona un número de WhatsApp.",
    );
  }

  const numero = normalizaTelefonoMx(raw);

  if (!numero) {
    throw new Error("Número de WhatsApp inválido.");
  }

  return numero;
}

function rejectMissingId(message = "Falta el ID solicitado.") {
  return Promise.reject(new Error(message));
}

export const api = {
  // Helpers genéricos
  get: (path) => http(path),

  post: (path, payload) =>
    http(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload || {}),
    }),

  patch: (path, payload) =>
    http(path, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload || {}),
    }),

  put: (path, payload) =>
    http(path, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload || {}),
    }),

  delete: (path) =>
    http(path, {
      method: "DELETE",
    }),

  // Prospectos digitales
  digitalesListProspectos: (params = {}) =>
    http(`/digitales/api/prospectos/${buildQuery(withRequestContext(params))}`),

  digitalesGetProspecto: (id, params = {}) =>
    id
      ? http(
          `/digitales/api/prospectos/${encodeURIComponent(id)}/${buildQuery(
            withRequestContext(params),
          )}`,
        )
      : rejectMissingId("Falta el ID del prospecto."),

  digitalesCreateProspecto: (payload = {}) =>
    http("/digitales/api/prospectos/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  digitalesUpdateProspecto: (id, payload = {}) =>
    id
      ? http(`/digitales/api/prospectos/${encodeURIComponent(id)}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(withRequestContext(payload)),
        })
      : rejectMissingId("Falta el ID del prospecto."),

  digitalesPatchProspecto: (id, payload = {}) =>
    id
      ? http(`/digitales/api/prospectos/${encodeURIComponent(id)}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(withRequestContext(payload)),
        })
      : rejectMissingId("Falta el ID del prospecto."),

  digitalesDeleteProspecto: (id, params = {}) =>
    id
      ? http(
          `/digitales/api/prospectos/${encodeURIComponent(id)}/${buildQuery(
            withRequestContext(params),
          )}`,
          {
            method: "DELETE",
          },
        )
      : rejectMissingId("Falta el ID del prospecto."),

  digitalesGenerarResumen: (id, payload = {}) =>
    id
      ? http(
          `/digitales/api/prospectos/${encodeURIComponent(
            id,
          )}/generar-resumen/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(withRequestContext(payload)),
          },
        )
      : rejectMissingId("Falta el ID del prospecto para generar el resumen."),

  digitalesListEvidencias: (idProspecto, params = {}) =>
    idProspecto
      ? http(
          `/digitales/api/prospectos/${encodeURIComponent(
            idProspecto,
          )}/evidencias/${buildQuery(withRequestContext(params))}`,
        )
      : rejectMissingId("Falta el ID del prospecto."),

  digitalesUploadEvidencias: (idProspecto, formData, numeroAsesor = "") => {
    if (!idProspecto) {
      return rejectMissingId("Falta el ID del prospecto.");
    }

    if (!(formData instanceof FormData)) {
      return Promise.reject(
        new Error("Las evidencias deben enviarse mediante FormData."),
      );
    }

    appendContextToFormData(formData, numeroAsesor);

    return http(
      `/digitales/api/prospectos/${encodeURIComponent(
        idProspecto,
      )}/evidencias/`,
      {
        method: "POST",
        body: formData,
      },
    );
  },

  digitalesDeleteEvidencia: (idProspecto, idEvidencia, params = {}) =>
    idProspecto && idEvidencia
      ? http(
          `/digitales/api/prospectos/${encodeURIComponent(
            idProspecto,
          )}/evidencias/${encodeURIComponent(idEvidencia)}/${buildQuery(
            withRequestContext(params),
          )}`,
          {
            method: "DELETE",
          },
        )
      : rejectMissingId("Falta el ID del prospecto o de la evidencia."),

  digitalesCampanasMeta: (days = 30) =>
    http(`/digitales/api/campanas-meta/?days=${encodeURIComponent(days)}`),

  // Analítica y bitácora
  digitalesAnaliticaAsesores: (params = {}) =>
    http(`/digitales/analitica/asesores/${buildQuery(params)}`),

  digitalesAnaliticaCliente: (expedienteId, params = {}) =>
    http(
      `/digitales/analitica/asesores/cliente/${encodeURIComponent(
        expedienteId,
      )}/${buildQuery(params)}`,
    ),

  digitalesAnaliticaActualizarResultado: (eventoId, payload = {}) =>
    http(
      `/digitales/analitica/eventos/${encodeURIComponent(eventoId)}/resultado/`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload || {}),
      },
    ),

  // Chats WhatsApp
  digitalesChats: (params = {}) =>
    http(`/digitales/chats/${buildQuery(withRequestContext(params))}`),

  digitalesMarkRead: (input = {}) => {
    const payload = normalizeTelInput(input);

    return http("/digitales/chats/mark-read/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
    });
  },

  digitalesMarkUnread: (input = {}) => {
    const payload = normalizeTelInput(input);

    return http("/digitales/chats/mark-unread/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
    });
  },

  digitalesBloquearContacto: (payload = {}) =>
    http("/digitales/chats/bloquear/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  digitalesDesbloquearContacto: (payload = {}) =>
    http("/digitales/chats/desbloquear/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  digitalesContacto: (
    tel,
    {
      limit = 20,
      before_id = "",
      usuario = "",
      numero_asesor = "",
      mark_read = 1,
    } = {},
  ) =>
    http(
      `/digitales/contacto/${buildQuery(
        withRequestContext({
          tel,
          limit,
          before_id,
          mark_read,
          usuario,
          numero_asesor,
        }),
      )}`,
    ),

  digitalesContactoUpdates: (
    tel,
    after = "",
    { limit = 50, usuario = "", numero_asesor = "", after_id = "" } = {},
  ) =>
    http(
      `/digitales/contacto/updates/${buildQuery(
        withRequestContext({
          tel,
          after,
          after_id,
          limit,
          usuario,
          numero_asesor,
        }),
      )}`,
    ),

  // Envío de mensajes
  digitalesEnviarMensaje: (payload = {}) =>
    http("/digitales/mensajes/enviar/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  digitalesEnviarPlantilla: (payload = {}) =>
    http("/digitales/mensajes/enviar-plantilla/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  digitalesEnviarMedia: ({
    to,
    text = "",
    files = [],
    reply_to_message_id = "",
    numero_asesor = "",
  } = {}) => {
    const formData = new FormData();

    formData.set("to", String(to || "").trim());

    if (text) {
      formData.set("text", String(text));
    }

    if (reply_to_message_id) {
      formData.set("reply_to_message_id", String(reply_to_message_id));
    }

    appendContextToFormData(formData, numero_asesor);

    const fileArray = Array.isArray(files) ? files : Array.from(files || []);

    fileArray.forEach((file) => {
      if (file) {
        formData.append("files", file);
      }
    });

    return http("/digitales/mensajes/enviar-media/", {
      method: "POST",
      body: formData,
    });
  },

  digitalesEditarMensaje: (payload = {}) =>
    http("/digitales/mensajes/editar/", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  digitalesPlantillas: (params = {}) =>
    http(
      `/digitales/mensajes/plantillas/${buildQuery(
        withRequestContext(params),
      )}`,
    ),

  // Administración de plantillas Meta
  digitalesPlantillasAdmin: (numeroAsesor = "") => {
    const numero = getWhatsAppNumberFromSources(numeroAsesor);

    return http(
      `/digitales/mensajes/plantillas/admin/${buildQuery(
        withRequestContext({
          numero_asesor: numero,
        }),
      )}`,
    );
  },

  digitalesPlantillaCrear: (numeroAsesor, payload = {}) => {
    const numero = getWhatsAppNumberFromSources(numeroAsesor);

    const contexto = withRequestContext({
      ...payload,
      numero_asesor: numero,
    });

    return http(
      `/digitales/mensajes/plantillas/admin/${buildQuery(contexto)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contexto),
      },
    );
  },

  digitalesPlantillaAnalizar: (numeroAsesor, payload = {}) => {
    const numero = getWhatsAppNumberFromSources(numeroAsesor);

    const contexto = withRequestContext({
      ...payload,
      numero_asesor: numero,
    });

    return http(
      `/digitales/mensajes/plantillas/admin/analizar/${buildQuery(contexto)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contexto),
      },
    );
  },

  digitalesPlantillaEditar: (numeroAsesor, templateId, payload = {}) => {
    const numero = getWhatsAppNumberFromSources(numeroAsesor);

    const contexto = withRequestContext({
      ...payload,
      numero_asesor: numero,
    });

    return http(
      `/digitales/mensajes/plantillas/admin/${encodeURIComponent(
        templateId,
      )}/${buildQuery(contexto)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contexto),
      },
    );
  },

  digitalesPlantillaEliminar: (numeroAsesor, templateId, name = "") => {
    const numero = getWhatsAppNumberFromSources(numeroAsesor);

    return http(
      `/digitales/mensajes/plantillas/admin/${encodeURIComponent(
        templateId,
      )}/${buildQuery(
        withRequestContext({
          numero_asesor: numero,
          name,
        }),
      )}`,
      {
        method: "DELETE",
      },
    );
  },

  digitalesLlamarWhatsapp: ({
    telefono,
    sdp_offer = "",
    numero_asesor = "",
  } = {}) =>
    http("/digitales/llamar-whatsapp/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        withRequestContext({
          telefono,
          sdp_offer,
          numero_asesor,
        }),
      ),
    }),

  // Control IA por conversación
  iaPausarConversacion: (payload = {}) =>
    http("/digitales/ia/conversacion/pausar/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        withRequestContext({
          ...payload,
          tel: normalizaTelefonoMx(payload?.tel),
          motivo: payload?.motivo || "manual_desde_chat",
        }),
      ),
    }),

  iaReactivarConversacion: (payload = {}) =>
    http("/digitales/ia/conversacion/reactivar/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        withRequestContext({
          ...payload,
          tel: normalizaTelefonoMx(payload?.tel),
        }),
      ),
    }),

  // Configuración IA
  iaLineas: () => http("/digitales/ia/lineas/"),

  iaConfigGet: (numeroAsesor) => {
    const numero = getNumeroAsesorIA(numeroAsesor);

    return http(`/digitales/ia/config/${encodeURIComponent(numero)}/`);
  },

  iaConfigPatch: (numeroAsesor, payload = {}) => {
    const numero = getNumeroAsesorIA(numeroAsesor);

    return http(`/digitales/ia/config/${encodeURIComponent(numero)}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        withRequestContext({
          ...payload,
          numero_asesor: numero,
        }),
      ),
    });
  },

  iaConfigPublicar: (numeroAsesor) => {
    const numero = getNumeroAsesorIA(numeroAsesor);

    return http(
      `/digitales/ia/config/${encodeURIComponent(numero)}/publicar/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          withRequestContext({
            numero_asesor: numero,
          }),
        ),
      },
    );
  },

  // Catálogo IA
  catalogoVehiculos: ({
    activo = "true",
    limit = 1000,
    modelo = "",
    marca = "",
  } = {}) =>
    http(
      `/digitales/catalogo/vehiculos/${buildQuery({
        activo,
        limit,
        modelo,
        marca,
      })}`,
    ),

  catalogoVehiculoCreate: (payload = {}) =>
    http("/digitales/catalogo/vehiculos/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  catalogoVehiculoPatch: (id, payload = {}) =>
    http(`/digitales/catalogo/vehiculos/${encodeURIComponent(id)}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withRequestContext(payload)),
    }),

  catalogoVehiculoDelete: (id) =>
    http(`/digitales/catalogo/vehiculos/${encodeURIComponent(id)}/`, {
      method: "DELETE",
    }),

  catalogoVehiculoSubirMedia: (id, tipo, files) => {
    const formData = new FormData();

    formData.set("tipo", String(tipo || ""));

    const fileArray = Array.isArray(files) ? files : Array.from(files || []);

    fileArray.forEach((file) => {
      if (file) {
        formData.append("files", file);
      }
    });

    return http(
      `/digitales/catalogo/vehiculos/${encodeURIComponent(id)}/upload/`,
      {
        method: "POST",
        body: formData,
      },
    );
  },

  catalogoVehiculoEliminarMedia: (id, tipo, ruta) =>
    http(
      `/digitales/catalogo/vehiculos/${encodeURIComponent(
        id,
      )}/media/${buildQuery({
        tipo,
        ruta,
      })}`,
      {
        method: "DELETE",
      },
    ),

  // Vehículos usados
  digitalesListAutosUsados: () => http("/digitales/catalogo/usados/"),

  digitalesGetAutoUsado: (id) =>
    http(`/digitales/catalogo/usados/${encodeURIComponent(id)}/`),

  digitalesCreateAutoUsado: (payload = {}) =>
    http("/digitales/catalogo/usados/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),

  digitalesUpdateAutoUsado: (id, payload = {}) =>
    http(`/digitales/catalogo/usados/${encodeURIComponent(id)}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }),

  digitalesDeleteAutoUsado: (id) =>
    http(`/digitales/catalogo/usados/${encodeURIComponent(id)}/`, {
      method: "DELETE",
    }),

  digitalesSubirImagenAutoUsado: (file) => {
    const formData = new FormData();

    formData.set("imagen", file);

    return http("/digitales/catalogo/usados/subir-imagen/", {
      method: "POST",
      body: formData,
    });
  },
};

export {
  http,
  normalizaTelefonoMx,
  getCrmUsername,
  getWhatsAppNumberFromSources,
  getAccessToken,
  getRefreshToken,
  getAuthHeader,
  saveJwtTokens,
  refreshAccessToken,
  ensureFreshAccessToken,
  clearFullSession,
  closeExpiredSession,
  getStoredUserObject,
};
