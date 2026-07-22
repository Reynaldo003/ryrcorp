// src/auth/RequirePermission.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function tieneAlguno(permisos = [], permitidos = []) {
    if (permisos.includes("ALL")) return true;

    return permitidos.some((permiso) => permisos.includes(permiso));
}

export function obtenerRutaInicialPorUsuario(user) {
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
    const autorizado = tieneAlguno(permisos, anyOf);

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