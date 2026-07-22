import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function PostVentaIndex() {
    const navigate = useNavigate();
    const { hasAnyPermission } = useAuth();

    useEffect(() => {
        if (hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA"])) {
            navigate("/encuesta_whats/envio_satisfaccion", { replace: true });
            return;
        }
        // fallback
        navigate("/", { replace: true });
    }, [hasAnyPermission, navigate]);

    return null;
}