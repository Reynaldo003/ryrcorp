import { Star, Users } from 'lucide-react';

export default function PuestoCard({ puesto, promedio, totalEvaluaciones, onEvaluar }) {
    const getColorPromedio = (puntaje) => {
        if (puntaje >= 85) return 'bg-emerald-500';
        if (puntaje >= 70) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition">
            <div className="bg-gradient-to-r from-[#131E5C] to-[#1E2A7A] p-4 text-white">
                <h3 className="font-bold text-lg">{puesto.nombre}</h3>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/20 mt-1 inline-block">
                    {puesto.categoria}
                </span>
            </div>
            <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <Users className="h-3 w-3" />
                    <span>{totalEvaluaciones} evaluación{totalEvaluaciones !== 1 ? 'es' : ''}</span>
                </div>

                {promedio && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-slate-500">Promedio</span>
                            <span className="font-bold text-[#131E5C]">{promedio}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className={`h-2 rounded-full ${getColorPromedio(promedio)}`} style={{ width: `${promedio}%` }} />
                        </div>
                    </div>
                )}

                <button
                    onClick={onEvaluar}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#131E5C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#131E5C]/85 transition"
                >
                    <Star className="h-4 w-4" />
                    {totalEvaluaciones > 0 ? 'Nueva evaluación' : 'Evaluar'}
                </button>
            </div>
        </div>
    );
}