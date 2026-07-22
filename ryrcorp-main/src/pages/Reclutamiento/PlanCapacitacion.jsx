import { useState } from 'react';
import { Search, Eye, Calendar, User, BookOpen, CheckCircle, X, FileText } from 'lucide-react';
import { PLANES_CAPACITACION } from "./datos/PlanCapacitacionData";
export default function PlanCapacitacion() {
    const [searchTerm, setSearchTerm] = useState('');
    const [planSeleccionado, setPlanSeleccionado] = useState(null);
    const [evaluaciones, setEvaluaciones] = useState(() => {
        const guardadas = localStorage.getItem('evaluaciones_capacitacion');
        return guardadas ? JSON.parse(guardadas) : {};
    });

    const [evaluacionActual, setEvaluacionActual] = useState(null);

    const planesFiltrados = PLANES_CAPACITACION.filter(plan =>
        plan.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.puesto.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const guardarEvaluacion = (planId, evaluacion) => {
        const nuevasEvaluaciones = {
            ...evaluaciones,
            [planId]: {
                ...evaluaciones[planId],
                [Date.now()]: evaluacion
            }
        };
        setEvaluaciones(nuevasEvaluaciones);
        localStorage.setItem('evaluaciones_capacitacion', JSON.stringify(nuevasEvaluaciones));
        setEvaluacionActual(null);
    };

    const getUltimaEvaluacion = (planId) => {
        const evaluacionesPlan = evaluaciones[planId];
        if (!evaluacionesPlan) return null;
        const fechas = Object.keys(evaluacionesPlan).sort().reverse();
        if (fechas.length === 0) return null;
        return { fecha: fechas[0], ...evaluacionesPlan[fechas[0]] };
    };

    return (
        <div className="w-full p-4">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-[#131E5C]" />
                    Planes de Capacitación
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    Gestión de planes de capacitación por puesto
                </p>
            </div>

            {/* Barra de búsqueda */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre del plan o puesto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#131E5C] focus:outline-none"
                    />
                </div>
            </div>

            {/* Grid de planes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {planesFiltrados.map((plan) => {
                    const ultimaEval = getUltimaEvaluacion(plan.id);
                    return (
                        <div
                            key={plan.id}
                            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
                            onClick={() => setPlanSeleccionado(plan)}
                        >
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">{plan.nombre}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{plan.puesto}</p>
                                    </div>
                                    {ultimaEval && (
                                        <div className="text-right">
                                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                                Evaluado
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {plan.responsable?.split(' ')[0] || 'No asignado'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="h-3 w-3" />
                                        {plan.temas.length} temas
                                    </span>
                                </div>

                                <div className="mt-3 flex justify-between items-center">
                                    <span className="text-xs text-gray-400">
                                        {plan.duracion !== 'No especificada' ? plan.duracion : 'Duración variable'}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPlanSeleccionado(plan);
                                        }}
                                        className="text-[#131E5C] hover:text-[#131E5C]/70 text-sm font-medium flex items-center gap-1"
                                    >
                                        <Eye className="h-4 w-4" />
                                        Ver detalles
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de detalles del plan */}
            {planSeleccionado && (
                <ModalDetallePlan
                    plan={planSeleccionado}
                    onClose={() => setPlanSeleccionado(null)}
                    onEvaluar={() => {
                        setEvaluacionActual(planSeleccionado);
                        setPlanSeleccionado(null);
                    }}
                    evaluacionPrevia={getUltimaEvaluacion(planSeleccionado.id)}
                />
            )}

            {/* Modal de evaluación */}
            {evaluacionActual && (
                <ModalEvaluacionCapacitacion
                    plan={evaluacionActual}
                    onClose={() => setEvaluacionActual(null)}
                    onSave={(evaluacion) => guardarEvaluacion(evaluacionActual.id, evaluacion)}
                />
            )}
        </div>
    );
}

// Modal de detalles del plan
function ModalDetallePlan({ plan, onClose, onEvaluar, evaluacionPrevia }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-3xl my-8 mx-4 bg-white rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-[#0f2866] to-[#1a3a8a] rounded-t-2xl p-5 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold">{plan.nombre}</h2>
                            <p className="text-white/80 text-sm mt-1">{plan.puesto}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    {/* Responsable y duración */}
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                        <div>
                            <div className="text-xs text-gray-500">Responsable</div>
                            <div className="text-sm font-medium text-gray-800">{plan.responsable}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500">Duración</div>
                            <div className="text-sm font-medium text-gray-800">{plan.duracion}</div>
                        </div>
                    </div>

                    {/* Objetivo */}
                    <div>
                        <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            Objetivo
                        </div>
                        <p className="text-sm text-gray-600">{plan.objetivos}</p>
                    </div>

                    {/* Temas */}
                    <div>
                        <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                            Temas a tratar
                        </div>
                        <div className="space-y-1">
                            {plan.temas.map((tema, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                    <span>{tema}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Evaluación previa */}
                    {evaluacionPrevia && (
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-sm font-semibold text-gray-700 mb-2">Última evaluación</div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="text-xs text-gray-500">Fecha: {evaluacionPrevia.fecha}</div>
                                    <div className="text-xs text-gray-500">Evaluador: {evaluacionPrevia.evaluador}</div>
                                    {evaluacionPrevia.comentarios && (
                                        <div className="text-xs text-gray-600 mt-1 italic">"{evaluacionPrevia.comentarios}"</div>
                                    )}
                                </div>
                                <div className="text-2xl font-bold text-blue-600">{evaluacionPrevia.calificacion}%</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 rounded-b-2xl p-5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                        Cerrar
                    </button>
                    {plan.tieneEvaluacion && (
                        <button onClick={onEvaluar} className="px-5 py-2 bg-[#131E5C] text-white rounded-lg text-sm font-medium hover:bg-[#131E5C]/85">
                            Realizar evaluación
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Modal de evaluación
function ModalEvaluacionCapacitacion({ plan, onClose, onSave }) {
    const [evaluador, setEvaluador] = useState('');
    const [calificacion, setCalificacion] = useState(75);
    const [comentarios, setComentarios] = useState('');

    const handleSubmit = () => {
        if (!evaluador) {
            alert('Ingresa el nombre del evaluador');
            return;
        }
        onSave({
            evaluador,
            calificacion,
            comentarios,
            fecha: new Date().toISOString().split('T')[0]
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-md my-8 mx-4 bg-white rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0f2866] to-[#1a3a8a] rounded-t-2xl p-5 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold">Evaluar capacitación</h2>
                            <p className="text-white/80 text-sm mt-1">{plan.nombre}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Evaluador</label>
                        <input
                            type="text"
                            value={evaluador}
                            onChange={(e) => setEvaluador(e.target.value)}
                            placeholder="Nombre del evaluador"
                            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={calificacion}
                                onChange={(e) => setCalificacion(parseInt(e.target.value))}
                                className="flex-1 accent-[#131E5C]"
                            />
                            <span className="text-xl font-bold text-[#131E5C] w-12 text-center">{calificacion}%</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
                        <textarea
                            rows={3}
                            value={comentarios}
                            onChange={(e) => setComentarios(e.target.value)}
                            placeholder="Observaciones adicionales..."
                            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-blue-400 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button onClick={handleSubmit} className="px-5 py-2 bg-[#131E5C] text-white rounded-lg text-sm font-medium hover:bg-[#131E5C]/85">
                        Guardar evaluación
                    </button>
                </div>
            </div>
        </div>
    );
}