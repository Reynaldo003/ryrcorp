// src/pages/GestionNegocio/GestionLayout.jsx
import { Outlet } from "react-router-dom";
import GestionTopNav from "../GestionNegocio/GestionTopNav";

export default function GestionLayout() {
    return (
        <div className="min-h-screen">
            <GestionTopNav />
            <Outlet />
        </div>
    );
}