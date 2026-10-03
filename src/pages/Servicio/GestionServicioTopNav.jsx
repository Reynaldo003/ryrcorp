// src/pages/GestionNegocio/GestionNegocioTopNav.jsx
import { CarFront, Users, ArchiveX, LayoutList, ShoppingCart, BadgeDollarSign, CircleDollarSign, Wrench, Receipt, ReceiptText } from "lucide-react";
import { NavLink } from "react-router-dom";
import vwDark from "../../assets/vw_dark.png";
import { useAuth } from "../../auth/AuthContext";
import { interfazActivada, submoduloVisible } from "../../config/interfaces";

const BRAND_BLUE = "#131E5C";

export default function GestionTopNav() {
    const { hasAnyPermission, user } = useAuth();
    // Si la interfaz "servicio" está activada manualmente, mostrar todos los submódulos.
    const servicioActivo = interfazActivada(user, "servicio");

    const tabs = [
        {
            label: "Presupuestos de Servicio",
            to: "/servicio/presupuestos",
            icon: LayoutList,
            show: submoduloVisible(user, "servicio", "presupuestos", servicioActivo || hasAnyPermission(["USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_VENTAS"])),
        },
        {
            label: "GOTA - Órdenes de Taller",
            to: "/servicio/gota",
            icon: Wrench,
            show: submoduloVisible(user, "servicio", "gota", servicioActivo || hasAnyPermission(["USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_VENTAS"])),
        },
        {
            label: "Órdenes Facturadas",
            to: "/servicio/ordenes-facturadas",
            icon: ReceiptText,
            show: submoduloVisible(user, "servicio", "ordenes-facturadas", servicioActivo || hasAnyPermission(["USUARIOS_ADMIN", "CRM_CALIDAD", "CRM_VENTAS"])),
        },
    ].filter((tab) => tab.show);
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-white" style={{ borderColor: `${BRAND_BLUE}22` }}>
            <div className="flex min-h-[76px] items-center gap-4 px-4 md:px-6 lg:px-8">
                <div className="flex shrink-0 items-center gap-3 md:gap-4">
                    <img src={vwDark} alt="Volkswagen" className="h-16 w-16 object-contain md:h-20 md:w-20" loading="lazy" />
                    <div className="text-[24px] font-extrabold tracking-[-0.04em] md:text-[30px]" style={{ color: BRAND_BLUE }}>
                        Servicio
                    </div>
                </div>

                <div className="hidden h-[2px] min-w-[60px] flex-1 rounded-full lg:block" style={{ background: BRAND_BLUE }} />

                <nav className="ml-auto flex max-w-full items-center gap-2 overflow-x-auto py-2">
                    {tabs.map(({ label, to, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition ${isActive
                                    ? "bg-[#131E5C] text-white"
                                    : "bg-white text-[#131E5C] hover:bg-[#131E5C]/5"
                                }`
                            }
                            style={{ borderColor: BRAND_BLUE }}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </header>
    );
}