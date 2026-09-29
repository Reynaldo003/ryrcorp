import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function PostVentaIndex() {
    const navigate = useNavigate();
    const { hasAnyPermission, user } = useAuth();

    useEffect(() => {
        // Usuarios con interfaces manuales: aterrizar en su submódulo.
        if (Array.isArray(user?.interfaces)) {
            navigate("/encuesta_whats/envio_satisfaccion", { replace: true });
            return;
        }

        if (hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA"])) {
            navigate("/encuesta_whats/envio_satisfaccion", { replace: true });
            return;
        }
        // fallback
        navigate("/", { replace: true });
    }, [hasAnyPermission, navigate, user?.interfaces]);

    return null;
}