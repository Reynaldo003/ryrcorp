// src/pages/GestionNegocio/GestionLayout.jsx
import { Outlet } from "react-router-dom";
import GestionServicioTopNav from "./GestionServicioTopNav";

export default function GestionLayout() {
    return (
        <div className="min-h-screen">
            <GestionServicioTopNav />
            <Outlet />
        </div>
    );
}