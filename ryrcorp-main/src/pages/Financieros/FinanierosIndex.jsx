// src/pages/Financieros/FinancierosIndex.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function FinancierosIndex() {
    const navigate = useNavigate();
    const { hasAnyPermission } = useAuth();

    useEffect(() => {
        const puedeVerFinancieros = hasAnyPermission(["CRM_DIGITALES", "CRM_FINANCIEROS", "CRM_VENTAS", "USUARIOS_ADMIN", "CRM_CALIDAD",]);

        if (puedeVerFinancieros) {
            navigate("/financieros/credito", { replace: true });
            return;
        }

        navigate("/", { replace: true });
    }, [hasAnyPermission, navigate]);

    return null;
}