// src/pages/Financieros/FinancierosIndex.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function FinancierosIndex() {
    const navigate = useNavigate();
    const { hasAnyPermission, user } = useAuth();

    useEffect(() => {
        // Usuarios con interfaces manuales: aterrizar en su submódulo.
        if (Array.isArray(user?.interfaces)) {
            navigate("/financieros/credito", { replace: true });
            return;
        }

        const puedeVerFinancieros = hasAnyPermission(["CRM_DIGITALES", "CRM_FINANCIEROS", "CRM_VENTAS", "USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_COORDINADOR_DIGITAL"]);

        if (puedeVerFinancieros) {
            navigate("/financieros/credito", { replace: true });
            return;
        }

        // Asesor Piso solo accede al submódulo Documentación.
        if (hasAnyPermission(["CRM_ASESOR_PISO"])) {
            navigate("/financieros/documentacion", { replace: true });
            return;
        }

        navigate("/", { replace: true });
    }, [hasAnyPermission, navigate, user?.interfaces]);

    return null;
}