import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function ComercialIndex() {
    const navigate = useNavigate();
    const { hasAnyPermission } = useAuth();

    useEffect(() => {
        if (hasAnyPermission(["CRM_DIGITALES", "USUARIOS_ADMIN", "CRM_VENTAS", "CRM_CALIDAD", "CRM_VALUADOR"])) {
            navigate("/usados/valuaciones", { replace: true });
            return;
        }
        if (hasAnyPermission(["CRM_VENTAS", "CRM_CALIDAD"])) {
            navigate("/usados/ventas_cruzadas", { replace: true });
            return;
        }
        // fallback
        navigate("/", { replace: true });
    }, [hasAnyPermission, navigate]);

    return null;
}