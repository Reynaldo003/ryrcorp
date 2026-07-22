import React from "react";
import { Outlet } from "react-router-dom";
import CalidadTopNav from "../Calidad/CalidadTopNav";

export default function CalidadLayout() {
    return (
        <div className="space-y-4">
            <CalidadTopNav />
            <Outlet />
        </div>
    );
}
