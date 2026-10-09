// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http, getAccessToken, getRefreshToken, saveJwtTokens } from "../lib/apiPruebas";

const AuthContext = createContext(null);
const API = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
const ME_TTL_MS = 2 * 60 * 1000;
const SESSION_KEYS = ["auth", "auth.access", "auth.refresh", "auth.token", "@token_access_jwt", "@token_refresh_jwt", "access", "accessToken", "refresh", "refreshToken", "token", "authToken", "crm.user", "user"];

function safeJson(raw) { try { return JSON.parse(raw); } catch { return null; } }
function getStoredAuth() { return safeJson(localStorage.getItem("auth")) || {}; }
function getStoredUser() {
    const authUser = getStoredAuth().user;
    if (authUser && typeof authUser === "object") return authUser;
    for (const key of ["crm.user", "user"]) {
        const value = safeJson(localStorage.getItem(key));
        if (value && typeof value === "object") return value.user && typeof value.user === "object" ? value.user : value;
    }
    return null;
}
function resolveFotoUrl(url) {
    if (!url) return url;
    const value = String(url).trim();
    if (/^https?:\/\//i.test(value)) return value;
    return `${API}${value.startsWith("/") ? "" : "/"}${value}`;
}
function normalizarUser(user) { return user ? { ...user, foto_url: resolveFotoUrl(user.foto_url) } : null; }
function claveValidacion(user) { return `crm:me:validado:${user?.id_usuario || user?.id || user?.usuario || ""}`; }
function validacionReciente(user) {
    if (!user) return false;
    const fecha = Number(sessionStorage.getItem(claveValidacion(user)) || 0);
    return fecha > 0 && Date.now() - fecha >= 0 && Date.now() - fecha < ME_TTL_MS;
}
function registrarValidacion(user) { if (user) sessionStorage.setItem(claveValidacion(user), String(Date.now())); }
function guardarSesion({ access, refresh, user }) {
    const current = getStoredAuth();
    const currentAccess = access || getAccessToken();
    const currentRefresh = refresh || getRefreshToken();
    const normalizado = normalizarUser(user);
    const siguiente = {
        ...current,
        ...(currentAccess ? { token: currentAccess, access: currentAccess } : {}),
        ...(currentRefresh ? { refresh: currentRefresh } : {}),
        ...(normalizado ? { user: normalizado } : {}),
    };
    localStorage.setItem("auth", JSON.stringify(siguiente));
    if (currentAccess) {
        localStorage.setItem("@token_access_jwt", currentAccess);
        localStorage.setItem("auth.access", currentAccess);
        localStorage.setItem("access", currentAccess);
    }
    if (currentRefresh) {
        localStorage.setItem("@token_refresh_jwt", currentRefresh);
        localStorage.setItem("auth.refresh", currentRefresh);
        localStorage.setItem("refresh", currentRefresh);
    }
    if (normalizado) {
        localStorage.setItem("crm.user", JSON.stringify(normalizado));
        localStorage.setItem("user", JSON.stringify(normalizado));
    }
}
function limpiarSesion() {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key?.startsWith("crm:me:validado:")) sessionStorage.removeItem(key);
    }
}
function agenciasUsuario(user) {
    return String(user?.agencia || "").split("|").map((v) => v.trim()).filter(Boolean);
}
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => getAccessToken() || "");
    const [user, setUser] = useState(() => normalizarUser(getStoredUser()));
    const [ready] = useState(true);

    useEffect(() => {
        if (!token) return undefined;
        let cancelado = false;
        const almacenado = getStoredUser();
        if (validacionReciente(almacenado)) return undefined;

        const validar = async () => {
            try {
                // Usa el cliente HTTP existente: comparte la renovación del JWT.
                const data = await http("/conformidad/api/auth/me/");
                if (cancelado || !data) return;
                const actualizado = normalizarUser(data);
                setUser(actualizado);
                guardarSesion({ user: actualizado });
                registrarValidacion(actualizado);
            } catch (error) {
                // Los errores temporales no cierran una sesión válida ni borran los datos locales.
                if (!cancelado && error?.code !== "SESSION_EXPIRED") {
                    console.warn("No se pudo actualizar el perfil de usuario:", error);
                }
            }
        };
        validar();
        return () => { cancelado = true; };
    }, [token]);

    const login = ({ token: legacyToken, access, refresh, user: nextUser }) => {
        const nuevoAccess = String(access || legacyToken || "").trim();
        const nuevoRefresh = String(refresh || "").trim();
        const nuevoUsuario = normalizarUser(nextUser);
        // Evita que se herede la sesión anterior al iniciar otra cuenta.
        limpiarSesion();
        guardarSesion({ access: nuevoAccess, refresh: nuevoRefresh, user: nuevoUsuario });
        setUser(nuevoUsuario);
        registrarValidacion(nuevoUsuario); // El login ya devolvió el perfil actualizado.
        setToken(nuevoAccess);
    };

    const logout = () => {
        limpiarSesion();
        setToken("");
        setUser(null);
    };

    const isAuthenticated = Boolean(token);
    const value = useMemo(() => {
        const permisos = Array.isArray(user?.permisos) ? user.permisos : [];
        const all = permisos.includes("ALL");
        return {
            token, user, ready, isAuthenticated, login, logout,
            hasPermission: (perm) => all || permisos.includes(perm),
            hasAnyPermission: (opciones = []) => all || opciones.some((perm) => permisos.includes(perm)),
            getUserAgencias: () => agenciasUsuario(user),
            userTieneAgencia: (agencia) => agenciasUsuario(user).some((a) => a.toLowerCase() === String(agencia || "").trim().toLowerCase()),
        };
    }, [token, user, ready, isAuthenticated]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider />");
    return ctx;
}
