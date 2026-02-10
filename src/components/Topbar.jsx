import React from "react";
import { UserCircle2, CirclePower } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Topbar() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        logout();
        navigate("/login", { replace: true });
    };

    return (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-end gap-3 px-4 py-3 md:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:bg-red-600 text-red-500 hover:text-slate-50"
                        onClick={handleLogout}>
                        <CirclePower size={18} /> Cerrar sesion
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                    >
                        <Link
                            to="/configuracion"
                            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-200 hover:text-[#131E5C]"
                        >
                            <UserCircle2 size={18} />
                            <span className="hidden text-sm sm:block">Usuario</span>
                        </Link>
                    </button>
                </div>
            </div>
        </header>
    );
}
