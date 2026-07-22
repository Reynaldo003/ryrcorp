import React from "react";
import { Outlet } from "react-router-dom";
import AdministrativosTopNav from "./AdministrativosTopNav";

export default function PostVentaLayout() {
    return (
        <div className="space-y-4">
            <AdministrativosTopNav />
            <Outlet />
        </div>
    );
}
