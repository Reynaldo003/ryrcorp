// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const API =
    import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
// import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const AuthContext = createContext(null);

function normalizarTexto(valor) {
    return String(valor || "").trim().toLowerCase();
}

function safeParseJson(value, fallback = null) {
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

function cleanToken(value) {
    const token = String(value || "").trim();

    if (!token) return "";
    if (token === "undefined") return "";
    if (token === "null") return "";

    return token;
}

function looksLikeJwt(token) {
    const value = cleanToken(token);
    return value.split(".").length === 3;
}

// ─── NUEVO: normalización de foto_url ─────────────────────────────────────
function resolveFotoUrl(url) {
    if (!url) return url;
    const limpio = String(url).trim();
    if (!limpio) return limpio;
    if (limpio.startsWith("http://") || limpio.startsWith("https://")) return limpio;
    return `${API}${limpio.startsWith("/") ? "" : "/"}${limpio}`;
}

function normalizarUser(user) {
    if (!user) return user;
    return { ...user, foto_url: resolveFotoUrl(user.foto_url) };
}
// ────────────────────────────────────────────────────────────────────────

function getUserAgenciasFromUser(user) {
    const agencia = user?.agencia || "";

    return String(agencia)
        .split("|")
        .map((x) => x.trim())
        .filter(Boolean);
}

function userTieneAgenciaFromUser(user, agenciaRegistro) {
    const agenciasUsuario = getUserAgenciasFromUser(user).map(normalizarTexto);
    const agenciaActual = normalizarTexto(agenciaRegistro);

    if (!agenciaActual) return false;

    return agenciasUsuario.includes(agenciaActual);
}

function getStoredAuth() {
    const raw = localStorage.getItem("auth");

    if (!raw || raw === "undefined" || raw === "null") {
        return null;
    }

    const parsed = safeParseJson(raw, null);

    return parsed && typeof parsed === "object" ? parsed : null;
}

function getStoredTokenFromSources() {
    const auth = getStoredAuth();

    const candidates = [
        auth?.token,
        auth?.access,
        auth?.access_token,
        auth?.jwt,
        auth?.auth?.token,
        auth?.auth?.access,
        localStorage.getItem("auth.access"),
        localStorage.getItem("@token_access_jwt"),
        localStorage.getItem("access"),
        localStorage.getItem("accessToken"),
        localStorage.getItem("token"),
        localStorage.getItem("authToken"),
    ];

    for (const candidate of candidates) {
        const token = cleanToken(candidate);
        if (token) return token;
    }

    return "";
}

function getStoredJwtAccessFromSources() {
    const auth = getStoredAuth();

    const candidates = [
        localStorage.getItem("@token_access_jwt"),
        localStorage.getItem("access"),
        localStorage.getItem("accessToken"),
        auth?.access,
        auth?.access_token,
        auth?.jwt,
        auth?.auth?.access,
        localStorage.getItem("auth.access"),
        auth?.token,
    ];

    for (const candidate of candidates) {
        const token = cleanToken(candidate);
        if (looksLikeJwt(token)) return token;
    }

    return "";
}

function getStoredRefreshFromSources() {
    const auth = getStoredAuth();

    const candidates = [
        auth?.refresh,
        auth?.refresh_token,
        auth?.auth?.refresh,
        localStorage.getItem("auth.refresh"),
        localStorage.getItem("@token_refresh_jwt"),
        localStorage.getItem("refresh"),
        localStorage.getItem("refreshToken"),
    ];

    for (const candidate of candidates) {
        const token = cleanToken(candidate);
        if (token) return token;
    }

    return "";
}

function getStoredUserFromSources() {
    const auth = getStoredAuth();

    if (auth?.user && typeof auth.user === "object") {
        return auth.user;
    }

    const keys = ["crm.user", "user"];

    for (const key of keys) {
        const raw = localStorage.getItem(key);

        if (!raw || raw === "undefined" || raw === "null") continue;

        const parsed = safeParseJson(raw, null);

        if (!parsed || typeof parsed !== "object") continue;

        if (parsed.user && typeof parsed.user === "object") {
            return parsed.user;
        }

        return parsed;
    }

    return null;
}

function saveSession({ token, access, refresh, user }) {
    const legacyOrSessionToken = cleanToken(token);
    const jwtAccess = cleanToken(access);
    const finalRefresh = cleanToken(refresh);
    const finalUser = user || getStoredUserFromSources();

    const authAnterior = getStoredAuth() || {};

    const finalToken = legacyOrSessionToken || jwtAccess || cleanToken(authAnterior.token);
    const finalAccess = jwtAccess || (looksLikeJwt(finalToken) ? finalToken : cleanToken(authAnterior.access));

    const authPayload = {
        ...authAnterior,
        ...(finalToken ? { token: finalToken } : {}),
        ...(finalAccess ? { access: finalAccess } : {}),
        ...(finalRefresh ? { refresh: finalRefresh } : {}),
        ...(finalUser ? { user: finalUser } : {}),
    };

    localStorage.setItem("auth", JSON.stringify(authPayload));

    if (finalToken) {
        localStorage.setItem("auth.access", finalToken);
    }

    if (looksLikeJwt(finalAccess)) {
        localStorage.setItem("@token_access_jwt", finalAccess);
        localStorage.setItem("access", finalAccess);
        localStorage.setItem("auth.access", finalAccess);
    }

    if (looksLikeJwt(finalRefresh)) {
        localStorage.setItem("@token_refresh_jwt", finalRefresh);
        localStorage.setItem("auth.refresh", finalRefresh);
        localStorage.setItem("refresh", finalRefresh);
    }

    if (finalUser) {
        localStorage.setItem("crm.user", JSON.stringify(finalUser));
        localStorage.setItem("user", JSON.stringify(finalUser));
    }
}

function clearSession() {
    const keys = [
        "auth",
        "auth.access",
        "auth.refresh",
        "auth.token",
        "@token_access_jwt",
        "@token_refresh_jwt",
        "access",
        "accessToken",
        "refresh",
        "refreshToken",
        "token",
        "authToken",
    ];

    keys.forEach((key) => {
        localStorage.removeItem(key);
    });
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const storedToken = getStoredTokenFromSources();
        const storedUser = normalizarUser(getStoredUserFromSources());

        setToken(storedToken || null);
        setUser(storedUser || null);
        setReady(true);
    }, []);

    useEffect(() => {
        const refrescarUsuario = async () => {
            const jwtAccess = getStoredJwtAccessFromSources();

            if (!jwtAccess) return;

            try {
                const res = await fetch(`${API}/conformidad/api/auth/me/`, {
                    headers: {
                        Authorization: `Bearer ${jwtAccess}`,
                    },
                });

                if (!res.ok) return;

                const data = await res.json();
                const userNormalizado = normalizarUser(data);

                setUser(userNormalizado);

                saveSession({
                    token: token || jwtAccess,
                    access: jwtAccess,
                    refresh: getStoredRefreshFromSources(),
                    user: userNormalizado,
                });
            } catch {
                // No cerramos sesión aquí para no sacar al usuario por fallos temporales de red.
            }
        };

        refrescarUsuario();
    }, [token]);

    const login = ({ token, access, refresh, user }) => {
        const finalToken = String(access || token || "").trim();
        const finalRefresh = String(refresh || "").trim();
        const userNormalizado = normalizarUser(user);

        setToken(finalToken || null);
        setUser(userNormalizado || null);

        localStorage.setItem(
            "auth",
            JSON.stringify({
                token: finalToken,
                access: finalToken,
                ...(finalRefresh ? { refresh: finalRefresh } : {}),
                user: userNormalizado,
            })
        );

        if (finalToken) {
            localStorage.setItem("@token_access_jwt", finalToken);
            localStorage.setItem("access", finalToken);
            localStorage.setItem("auth.access", finalToken);
        }

        if (finalRefresh) {
            localStorage.setItem("@token_refresh_jwt", finalRefresh);
            localStorage.setItem("refresh", finalRefresh);
            localStorage.setItem("auth.refresh", finalRefresh);
        }

        if (userNormalizado) {
            localStorage.setItem("crm.user", JSON.stringify(userNormalizado));
            localStorage.setItem("user", JSON.stringify(userNormalizado));
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        clearSession();
    };

    const isAuthenticated = !!token;

    const hasPermission = (perm) => {
        const permisos = user?.permisos || [];
        return permisos.includes("ALL") || permisos.includes(perm);
    };

    const hasAnyPermission = (anyOf = []) => {
        const permisos = user?.permisos || [];

        if (permisos.includes("ALL")) return true;

        return anyOf.some((permiso) => permisos.includes(permiso));
    };

    const getUserAgencias = () => {
        return getUserAgenciasFromUser(user);
    };

    const userTieneAgencia = (agenciaRegistro) => {
        return userTieneAgenciaFromUser(user, agenciaRegistro);
    };

    const value = useMemo(
        () => ({
            token,
            user,
            isAuthenticated,
            ready,
            login,
            logout,
            hasPermission,
            hasAnyPermission,
            getUserAgencias,
            userTieneAgencia,
        }),
        [token, user, isAuthenticated, ready]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);

    if (!ctx) {
        throw new Error("useAuth debe usarse dentro de <AuthProvider />");
    }

    return ctx;
}
