// src/app/AppShell.jsx
import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";

export default function AppShell() {
    const navigate = useNavigate();

    useEffect(() => {
        const onNavegar = (event) => {
            const to = event?.detail?.to;

            if (!to) return;

            navigate(to);
        };

        window.addEventListener("app:navigate", onNavegar);

        return () => window.removeEventListener("app:navigate", onNavegar);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-white">
            <div className="min-h-screen md:flex">
                <Sidebar />

                <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-white">
                    <main className="w-full flex-1 px-4 py-5 md:px-6 lg:px-8">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}