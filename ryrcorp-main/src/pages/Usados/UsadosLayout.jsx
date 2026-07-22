import React from "react";
import { Outlet } from "react-router-dom";
import UsadosTopNav from "../Usados/UsadosTopNav";

export default function UsadosLayout() {
    return (
        <div className="space-y-4">
            <UsadosTopNav />
            <Outlet />
        </div>
    );
}
