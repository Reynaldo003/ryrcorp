import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Reclutamiento from "../Reclutamiento/Reclutamiento";
import Puestos from "../puestos/Puestos";

export default function AdministrativosIndex() {
    const [activeTab, setActiveTab] = useState("reclutamiento");
    const navigate = useNavigate();
    const location = useLocation();
    const { hasAnyPermission } = useAuth();

    const hasAccess = hasAnyPermission(["USUARIOS_ADMIN", "CRM_RRHH", "CRM_CALIDAD"]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab === 'puestos') {
            setActiveTab("puestos");
        } else {
            setActiveTab("reclutamiento");
        }
    }, [location]);

    if (!hasAccess) {
        navigate("/", { replace: true });
        return null;
    }

   return (
    <div className="w-full">
        {activeTab === "reclutamiento" ? <Reclutamiento /> : <Puestos />}
    </div>
);
}