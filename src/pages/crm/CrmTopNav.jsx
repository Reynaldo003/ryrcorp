// src/components/CrmTopNav.jsx
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, ClipboardList, Sparkles } from "lucide-react";

const BRAND_BLUE = "#131E5C";

export default function CrmTopNav() {
    const location = useLocation();

    const tabs = useMemo(
        () => [
            { label: "Casos", href: "/crm", icon: ClipboardList },
            { label: "Resumen", href: "/crm/resumen", icon: LayoutGrid },
        ],
        []
    );

    const isActive = (href) => location.pathname.startsWith(href);

    return (
        <header className="w-full">
            <div
                className="relative overflow-hidden rounded-3xl shadow-lg"
                style={{ backgroundColor: BRAND_BLUE }}
            >
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-20 -left-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/0 to-black/15" />
                </div>

                <div className="relative px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="truncate text-lg font-extrabold text-white sm:text-xl">
                                    Gestión de las Reclamaciones
                                </h1>
                            </div>
                            <p className="mt-1 text-sm text-white/80">
                                Registro, seguimiento y cierre de casos de no conformidad.
                            </p>
                        </div>

                        {/* Tabs + Logos */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
                            {/* Tabs */}
                            <nav className="flex w-full gap-2 sm:w-auto">
                                {tabs.map((t) => {
                                    const Icon = t.icon;
                                    const active = isActive(t.href);
                                    return (
                                        <Link
                                            key={t.href}
                                            to={t.href}
                                            className={[
                                                "group inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                                                "border",
                                                active
                                                    ? "border-white/35 bg-white/20 text-white shadow-sm"
                                                    : "border-white/20 bg-white/10 text-white/85 hover:bg-white/15 hover:text-white",
                                            ].join(" ")}
                                            aria-current={active ? "page" : undefined}
                                        >
                                            <Icon className="h-4 w-4 opacity-90" />
                                            {t.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <img
                                    src="/vw_white.png"
                                    alt="VW"
                                    className="h-8 w-auto opacity-95"
                                    loading="lazy"
                                />
                                <img
                                    src="/ryr.png"
                                    alt="RYR"
                                    className="h-8 w-auto opacity-95"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 h-px w-full bg-gradient-to-r from-white/25 via-white/50 to-white/25" />
                </div>
            </div>
        </header>
    );
}
