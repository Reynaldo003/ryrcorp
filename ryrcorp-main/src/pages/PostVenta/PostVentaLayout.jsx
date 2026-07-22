import React from "react";
import { Outlet } from "react-router-dom";
import PostVentaTopNav from "./PostVentaTopNav";

export default function PostVentaLayout() {
    return (
        <div className="space-y-4">
            <PostVentaTopNav />
            <Outlet />
        </div>
    );
}
