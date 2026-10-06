// src/pages/Tableros/components/BarraFiltros.jsx
import { useEffect } from "react";
import { Building2, Calendar } from "lucide-react";
import { AGENCIAS, MESES } from "../config/catalogoModulos";

export default function BarraFiltros({
    agenciaSeleccionada,
    setAgenciaSeleccionada,
    periodoAnio,
    setPeriodoAnio,
    mesesSeleccionados,
    setMesesSeleccionados,
    seleccionarMes,
}) {
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth() + 1;
    const anioSeleccionado = Number(periodoAnio);

    const mesBloqueado = (mes) => {
        const numeroMes = Number(mes);
        if (anioSeleccionado < anioActual) return false;
        if (anioSeleccionado > anioActual) return true;
        return numeroMes > mesActual;
    };

    useEffect(() => {
        setMesesSeleccionados(prev => {
            if (prev.includes("anual")) return prev;

            const validos = prev.filter(mes => !mesBloqueado(mes));
            return validos.length === prev.length ? prev : validos;
        });
    }, [periodoAnio]);

    const esAnual =
        mesesSeleccionados.length === 0 ||
        mesesSeleccionados.includes("anual") ||
        mesesSeleccionados.length === 12;

    return (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {/* Agencias */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="mr-2 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Building2 className="h-4 w-4" />
                    <span>Agencia:</span>
                </div>

                {AGENCIAS.map(agencia => {
                    const activo = agenciaSeleccionada === agencia;

                    return (
                        <button
                            key={agencia}
                            type="button"
                            onClick={() => setAgenciaSeleccionada(agencia)}
                            className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition ${
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

            {/* Año, Anual y meses */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#001E50]" />
                    <span className="text-xs font-black text-[#001E50]">PERIODO:</span>

                    <select
                        value={periodoAnio}
                        onChange={e => setPeriodoAnio(e.target.value)}
                        className="h-9 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#001E50] outline-none"
                    >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                    </select>
                </div>

                <div className="flex flex-1 flex-wrap items-center gap-1.5">
                    {/* Anual */}
                    <button
                        type="button"
                        onClick={() => seleccionarMes("anual")}
                        className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-black transition ${
                            esAnual
                                ? "bg-[#001E50] text-white shadow-sm ring-1 ring-[#001E50]"
                                : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        {esAnual ? "✓ Anual" : "Anual"}
                    </button>

                    <div className="mx-1 hidden h-4 w-px bg-slate-200 sm:block" />

                    {/* Meses */}
                    {MESES.map(mes => {
                        const bloqueado = mesBloqueado(mes.key);
                        const activo = !esAnual && mesesSeleccionados.includes(mes.key);

                        return (
                            <button
                                key={mes.key}
                                type="button"
                                disabled={bloqueado}
                                onClick={() => !bloqueado && seleccionarMes(mes.key)}
                                title={bloqueado ? "Este mes todavía no ha transcurrido" : ""}
                                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                    bloqueado
                                        ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-300 opacity-60"
                                        : activo
                                            ? "cursor-pointer bg-[#001E50] text-white shadow-sm"
                                            : "cursor-pointer border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
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