import React from "react";
import { Outlet } from "react-router-dom";
import CrmTopNav from "../crm/CrmTopNav";

export default function CrmLayout() {
    return (
        <div className="space-y-4">
            <CrmTopNav />
            <Outlet />
        </div>
    );
}
