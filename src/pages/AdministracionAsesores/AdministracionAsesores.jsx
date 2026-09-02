import { useState } from "react";
import {
    UsersRound,
    Wrench,
} from "lucide-react";

import AsesoresCatalogo from "./AsesoresCatalogo";
import AdministracionTecnicos from "./AdministracionTecnicos";


export default function AdministracionAsesores() {
    const [seccion, setSeccion] = useState("asesores");

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

                <div className="mb-6 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                setSeccion("asesores")
                            }
                            className={[
                                "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                                seccion === "asesores"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-600 hover:bg-slate-100",
                            ].join(" ")}
                        >
                            <UsersRound size={17} />
                            Asesores
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setSeccion("tecnicos")
                            }
                            className={[
                                "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition",
                                seccion === "tecnicos"
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-600 hover:bg-slate-100",
                            ].join(" ")}
                        >
                            <Wrench size={17} />
                            Técnicos / Refacciones
                        </button>
                    </div>
                </div>

                {seccion === "asesores" ? (
                    <AsesoresCatalogo />
                ) : (
                    <AdministracionTecnicos />
                )}

            </div>
        </div>
    );
}