import React from "react";
import { Outlet, NavLink } from "react-router-dom";

export default function CatalogoPreciosLayout() {
    return (
        <div className="min-h-screen">
            <Outlet />
        </div>
    );
}