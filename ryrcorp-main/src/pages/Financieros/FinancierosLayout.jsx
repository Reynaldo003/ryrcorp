//src/pages/Financieros/FinancierosLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import FinancierosTopNav from "../Financieros/FinancierosTopNav";

export default function FinancierosLayout() {
    return (
        <div className="space-y-4">
            <FinancierosTopNav />
            <Outlet />
        </div>
    );
}
