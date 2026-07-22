// src/pages/PostVenta/EnvioTopNav.jsx
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Package } from "lucide-react";
import vwDark from "../../assets/vw_dark.png";
import { useAuth } from "../../auth/AuthContext";

const BRAND_BLUE = "#131E5C";

export default function PostVentaTopNav() {
    const location = useLocation();
    const { hasAnyPermission } = useAuth();

    const inProspectos = location.pathname.startsWith("/encuesta_whats/envio_satisfaccion");
    const canSeeContacto = hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA"]);

    const tabs = useMemo(() => {
        const items = [
            {
                label: "Envio de Encuestas",
                href: "/encuesta_whats/envio_satisfaccion",
                icon: Package,
                show: hasAnyPermission(["USUARIOS_ADMIN", "CRM_POSTVENTA"]),
            },
        ];
        return items.filter((x) => x.show);
    }, [hasAnyPermission, canSeeContacto, inProspectos]);

    const isActive = (href) => location.pathname.startsWith(href);

    return (
        <header
            className="sticky top-0 z-40 w-full border-b bg-white"
            style={{ borderColor: `${BRAND_BLUE}22` }}
        >
            <div className="flex min-h-[76px] items-center gap-4 px-4 md:px-6 lg:px-8">

                {/* Logo VW */}
                <img
                    src={vwDark}
                    alt="Volkswagen"
                    className="h-16 w-16 object-contain md:h-20 md:w-20 shrink-0"
                    loading="lazy"
                />

                {/* Título */}
                <div
                    className="text-[24px] font-extrabold tracking-[-0.04em] md:text-[30px] shrink-0"
                    style={{ color: BRAND_BLUE }}
                >
                    PostVenta
                </div>

                {/* Línea azul */}
                <div
                    className="hidden h-[2px] min-w-[60px] flex-1 rounded-full lg:block"
                    style={{ background: BRAND_BLUE }}
                />

                {/* Tabs */}
                <nav className="ml-auto flex items-center gap-2 overflow-x-auto py-2">
                    {tabs.map((t) => {
                        const Icon = t.icon;
                        const active = isActive(t.href);
                        return (
                            <Link
                                key={t.href}
                                to={t.href}
                                aria-current={active ? "page" : undefined}
                                className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition"
                                style={{
                                    border: `1px solid ${BRAND_BLUE}`,
                                    backgroundColor: active ? BRAND_BLUE : "#FFFFFF",
                                    color: active ? "#FFFFFF" : BRAND_BLUE,
                                }}
                                onMouseEnter={(e) => {
                                    if (!active) {
                                        e.currentTarget.style.backgroundColor = BRAND_BLUE;
                                        e.currentTarget.style.color = "#FFFFFF";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!active) {
                                        e.currentTarget.style.backgroundColor = "#FFFFFF";
                                        e.currentTarget.style.color = BRAND_BLUE;
                                    }
                                }}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{t.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
