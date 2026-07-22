import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function PostVentaIndex() {
    const navigate = useNavigate();
    const { hasAnyPermission } = useAuth();

    useEffect(() => {
        if (hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA", "CRM_CALIDAD"])) {
            navigate("/postventa/pedidos_piezas", { replace: true });
            return;
        }
        // fallback
        navigate("/", { replace: true });
    }, [hasAnyPermission, navigate]);

    return null;
}