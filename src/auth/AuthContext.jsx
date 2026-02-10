import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Rehidrata sesión al recargar
        const raw = localStorage.getItem("auth");
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                setToken(parsed.token ?? null);
                setUser(parsed.user ?? null);
            } catch {
                localStorage.removeItem("auth");
            }
        }
        setReady(true);
    }, []);

    const login = ({ token, user }) => {
        setToken(token);
        setUser(user);
        localStorage.setItem("auth", JSON.stringify({ token, user }));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("auth");
    };

    const isAuthenticated = !!token;

    const value = useMemo(
        () => ({ token, user, isAuthenticated, ready, login, logout }),
        [token, user, isAuthenticated, ready]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider />");
    return ctx;
}
