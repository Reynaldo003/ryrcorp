import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function CalidadIndex() {
    const navigate = useNavigate();
    const { hasAnyPermission } = useAuth();

    useEffect(() => {
        // Calidad por ahora: reclamaciones (si no, manda a /comercial)
        if (hasAnyPermission(["CRM_RECLAMACIONES", "USUARIOS_ADMIN", "CRM_CALIDAD"])) {
            navigate("/calidad/reclamaciones", { replace: true });
            return;
        }
        navigate("/comercial", { replace: true });
    }, [hasAnyPermission, navigate]);

    return null;
}