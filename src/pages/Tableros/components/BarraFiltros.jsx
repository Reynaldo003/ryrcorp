// src/pages/Tableros/components/BarraFiltros.jsx
import { Building2, Calendar } from "lucide-react";
import { AGENCIAS, MESES } from "../config/catalogoModulos";

export default function BarraFiltros({
    agenciaSeleccionada,
    setAgenciaSeleccionada,
    periodoAnio,
    setPeriodoAnio,
    mesesSeleccionados,
    seleccionarMes,
}) {
    const esAnual = mesesSeleccionados.length === 0 || mesesSeleccionados.includes("anual") || mesesSeleccionados.length === 12;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
            {/* Agencias */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
                    <Building2 className="h-4 w-4" />
                    <span>Agencia:</span>
                </div>

                {AGENCIAS.map((agencia) => {
                    const activo = agenciaSeleccionada === agencia;
                    return (
                        <button
                            key={agencia}
                            type="button"
                            onClick={() => setAgenciaSeleccionada(agencia)}
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                                activo
                                    ? "bg-[#001E50] text-white shadow"
                                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#001E50] hover:text-[#001E50]"
                            }`}
                        >
                            {agencia}
                        </button>
                    );
                })}
            </div>

            <hr className="border-slate-100" />

            {/* Año, Botón Anual y Meses */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#001E50]" />
                    <span className="text-xs font-black text-[#001E50]">PERIODO:</span>
                    <select
                        value={periodoAnio}
                        onChange={(e) => setPeriodoAnio(e.target.value)}
                        className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#001E50] outline-none cursor-pointer"
                    >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>
                </div>

                <div className="flex flex-1 flex-wrap items-center gap-1.5">
                    {/* Botón ANUAL */}
                    <button
                        type="button"
                        onClick={() => seleccionarMes("anual")}
                        className={`rounded-lg px-3 py-1 text-xs font-black transition cursor-pointer ${
                            esAnual
                                ? "bg-[#001E50] text-white shadow-sm ring-1 ring-[#001E50]"
                                : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        {esAnual ? "✓ Anual" : "Anual"}
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                    {/* Botones de Meses */}
                    {MESES.map((mes) => {
                        const activo = !esAnual && mesesSeleccionados.includes(mes.key);
                        return (
                            <button
                                key={mes.key}
                                type="button"
                                onClick={() => seleccionarMes(mes.key)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                                    activo
                                        ? "bg-[#001E50] text-white shadow-sm"
                                        : "border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                                }`}
                            >
                                {activo ? `✓ ${mes.label}` : `+ ${mes.label}`}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}