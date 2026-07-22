import React from "react";
import { Outlet } from "react-router-dom";

export default function TimeForActionLayout() {
    return (
        <div className="space-y-4">
            <Outlet />
        </div>
    );
}