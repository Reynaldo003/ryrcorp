// src/auth/RequirePermission.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { INTERFACES } from "../config/interfaces";

function tieneAlguno(permisos = [], permitidos = []) {
    if (permisos.includes("ALL")) return true;

    return permitidos.some((permiso) => permisos.includes(permiso));
}

// True si la ruta actual pertenece a la interfaz (route prefix match).
function rutaPerteneceAInterfaz(pathname, item) {
    if (item.to === "/") return pathname === "/";

    return pathname === item.to || pathname.startsWith(item.to + "/");
}

export function obtenerRutaInicialPorUsuario(user) {
    // Administradores: siempre Inicio.
    if ((user?.permisos || []).includes("ALL")) {
        return "/";
    }

    const interfaces = user?.interfaces;

    // Usuarios con interfaces manuales: la ruta inicial es la primera
    // interfaz habilitada (en el orden del menú), o "/" (Inicio).
    if (Array.isArray(interfaces)) {
        for (const item of INTERFACES) {
            if (item.alwaysOn) continue;

            if (interfaces.includes(item.key)) {
                return item.to;
            }
        }

        return "/";
    }

    const permisos = user?.permisos || [];

    if (permisos.includes("ALL")) {
        return "/";
    }

    if (permisos.includes("USUARIOS_ADMIN")) {
        return "/";
    }

    if (permisos.includes("CRM_CALIDAD")) {
        return "/";
    }

    if (permisos.includes("CRM_CALL_CENTER")) {
        return "/comercial/entregas";
    }

    if (permisos.includes("CRM_POSTVENTA")) {
        return "/postventa";
    }

    if (
        permisos.includes("CRM_DIGITALES") ||
        permisos.includes("CRM_VENTAS") ||
        permisos.includes("CRM_COORDINADOR_DIGITAL")
    ) {
        return "/comercial";
    }

    if (permisos.includes("CRM_FINANCIEROS")) {
        return "/financieros";
    }

    if (permisos.includes("CRM_RRHH")) {
        return "/administrativos";
    }

    return "/";
}

export default function RequirePermission({ anyOf = [], children }) {
    const { user, ready } = useAuth();
    const location = useLocation();

    if (ready === false) {
        return null;
    }

    if (!anyOf.length) {
        return children;
    }

    const permisos = user?.permisos || [];
    const interfaces = user?.interfaces;
    const autorizado = tieneAlguno(permisos, anyOf);

    // Usuarios con interfaces manuales: se autoriza si la ruta pertenece a
    // una interfaz habilitada (mismo criterio que usa el sidebar).
    if (Array.isArray(interfaces)) {
        const interfazHabilitada = INTERFACES.some(
            (item) =>
                interfaces.includes(item.key) &&
                rutaPerteneceAInterfaz(location.pathname, item)
        );

        if (interfazHabilitada) return children;
    }

    if (autorizado) {
        return children;
    }

    const rutaInicial = obtenerRutaInicialPorUsuario(user);

    if (location.pathname === rutaInicial) {
        return null;
    }

    return (
        <Navigate
            to={rutaInicial}
            replace
            state={{ from: location.pathname }}
        />
    );
}