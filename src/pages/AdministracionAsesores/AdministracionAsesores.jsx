import { useState } from "react";
import {
    UsersRound,
    Wrench,
} from "lucide-react";

import vwDark from "../../assets/vw_dark.png";

import AsesoresCatalogo from "./AsesoresCatalogo";
import AdministracionTecnicos from "./AdministracionTecnicos";


const BRAND_BLUE = "#131E5C";


function VWLogo() {
    return (
        <img
            src={vwDark}
            alt="Volkswagen"
            className="h-16 w-16 object-contain md:h-20 md:w-20"
            loading="lazy"
        />
    );
}


export default function AdministracionAsesores() {
    const [seccion, setSeccion] = useState("asesores");

    const tabs = [
        {
            id: "asesores",
            label: "Asesores",
            icon: UsersRound,
        },
        {
            id: "tecnicos",
            label: "Técnicos / Refacciones",
            icon: Wrench,
        },
    ];

    return (
        <div className="min-h-screen bg-white">

            {/* ENCABEZADO DEL MÓDULO */}
            <header
                className="sticky top-0 z-40 w-full border-b bg-white"
                style={{
                    borderColor: `${BRAND_BLUE}22`,
                }}
            >
                <div className="flex min-h-[76px] items-center gap-4 px-4 md:px-6 lg:px-8">

                    {/* LOGO + TÍTULO */}
                    <div className="flex shrink-0 items-center gap-3 md:gap-4">
                        <VWLogo />

                        <div>
                            <div
                                className="text-[24px] font-extrabold tracking-[-0.04em] md:text-[30px]"
                                style={{
                                    color: BRAND_BLUE,
                                }}
                            >
                                Administración de Personal
                            </div>

                            <p className="text-xs font-semibold text-slate-500 md:text-sm">
                                Gestión de asesores, técnicos y personal de refacciones.
                            </p>
                        </div>
                    </div>

                    {/* LÍNEA AZUL */}
                    <div
                        className="hidden h-[2px] min-w-[60px] flex-1 rounded-full lg:block"
                        style={{
                            background: BRAND_BLUE,
                        }}
                    />

                    {/* TABS */}
                    <nav className="ml-auto flex max-w-full items-center gap-2 overflow-x-auto py-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active =
                                seccion === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() =>
                                        setSeccion(tab.id)
                                    }
                                    aria-current={
                                        active
                                            ? "page"
                                            : undefined
                                    }
                                    className={[
                                        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition",
                                        active
                                            ? "text-white"
                                            : "bg-white hover:bg-[#131E5C] hover:text-white",
                                    ].join(" ")}
                                    style={{
                                        borderColor:
                                            BRAND_BLUE,
                                        backgroundColor:
                                            active
                                                ? BRAND_BLUE
                                                : "#FFFFFF",
                                        color:
                                            active
                                                ? "#FFFFFF"
                                                : BRAND_BLUE,
                                    }}
                                >
                                    <Icon className="h-4 w-4" />

                                    <span className="hidden sm:inline">
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                </div>
            </header>

            {/* CONTENIDO */}
            <main className="w-full">
                {seccion === "asesores" ? (
                    <AsesoresCatalogo />
                ) : (
                    <AdministracionTecnicos />
                )}
            </main>

        </div>
    );
}