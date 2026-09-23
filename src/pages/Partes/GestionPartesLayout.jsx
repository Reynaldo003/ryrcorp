// src/pages/Partes/GestionPartesLayout.jsx
import { Outlet } from "react-router-dom";
import GestionPartesTopNav from "../Partes/GestionPartesTopNav";

export default function GestionPartesLayout() {
    return (
        <div className="min-h-screen">
            <GestionPartesTopNav />
            <Outlet />
        </div>
    );
}