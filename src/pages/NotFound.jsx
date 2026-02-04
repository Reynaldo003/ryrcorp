import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold">404</h1>
            <p className="mt-2 text-sm text-slate-600">La página no existe.</p>
            <Link to="/" className="mt-4 inline-block rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                Volver al inicio
            </Link>
        </div>
    );
}
