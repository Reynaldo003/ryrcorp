// src/app/AppShell.jsx
import React from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AppShell() {
    return (
        <div className="min-h-screen bg-white">
            <div className="min-h-screen md:flex">
                <Sidebar />

                <div className="relative z-0 flex min-h-screen min-w-0 flex-1 flex-col bg-white">
                    <main className="relative z-0 w-full flex-1 px-4 py-5 md:px-6 lg:px-8">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}