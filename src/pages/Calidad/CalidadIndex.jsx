import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function CalidadIndex() {
    const navigate = useNavigate();
    const { hasAnyPermission, user } = useAuth();

    useEffect(() => {
        // Usuarios con interfaces manuales: aterrizar en su submódulo.
        if (Array.isArray(user?.interfaces)) {
            navigate("/calidad/reclamaciones", { replace: true });
            return;
        }

        // Calidad por ahora: reclamaciones (si no, manda a /comercial)
        if (hasAnyPermission(["CRM_RECLAMACIONES", "USUARIOS_ADMIN", "CRM_CALIDAD"])) {
            navigate("/calidad/reclamaciones", { replace: true });
            return;
        }
        navigate("/comercial", { replace: true });
    }, [hasAnyPermission, navigate, user?.interfaces]);

    return null;
}