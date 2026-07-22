import React from "react";
import { Outlet } from "react-router-dom";
import ComercialTopNav from "../Comercial/ComercialTopNav";

export default function ComercialLayout() {
    return (
        <div className="space-y-4">
            <ComercialTopNav />
            <Outlet />
        </div>
    );
}
