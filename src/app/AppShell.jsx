import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AppShell() {
    return (
        <div className="min-h-screen">
            <div className="flex">
                <Sidebar />
                <div className="flex min-h-screen w-full flex-col">
                    <Topbar />
                    <main className="w-full px-4 py-5 md:px-6 lg:px-8">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
