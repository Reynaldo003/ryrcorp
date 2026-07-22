import { useState } from 'react';
import { X, User, Star, Award, TrendingUp, Target, Users, MessageSquare, CheckCircle, Calendar, Building2, Clock } from 'lucide-react';
import { obtenerFormatoEvaluacion } from './datos/formatosEvaluacion';

export default function EvaluarPuesto({ puesto, onClose, onSave }) {
    const formato = obtenerFormatoEvaluacion(puesto.nombre);
    const criterios = formato?.criterios || [];
    const criteriosStrings = criterios.map(c => typeof c === 'string' ? c : c.nombre);

    const [evaluacion, setEvaluacion] = useState({
        puestoId: puesto.id,
        puestoNombre: puesto.nombre,
        
        // Datos del colaborador evaluado
        colaborador_nombre: '',
        periodo: '',
        concesionario: '',
        antiguedad: '',
        
        // Datos del evaluador
        evaluador_nombre: '',
        evaluador_puesto: '',
        motivo: 'A',
        
        calificacion: 75,
        comentarios: '',
        criterios: {}
    });

    if (Object.keys(evaluacion.criterios).length === 0 && criteriosStrings.length > 0) {
        const criteriosObj = {};
        criteriosStrings.forEach(c => criteriosObj[c] = 3);
        evaluacion.criterios = criteriosObj;
    }

    const calcularCalificacion = () => {
        if (criteriosStrings.length === 0) return 0;
        let suma = 0;
        criteriosStrings.forEach(criterio => {
            suma += evaluacion.criterios[criterio] || 3;
        });
        return Math.round((suma / (criteriosStrings.length * 5)) * 100);
    };

    const handleCriterioChange = (criterio, valor) => {
        const nuevosCriterios = { ...evaluacion.criterios, [criterio]: valor };
        setEvaluacion({
            ...evaluacion,
            criterios: nuevosCriterios,
            calificacion: calcularCalificacion()
        });
    };

    const escala = [
        { valor: 5, label: "Excelente", color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700" },
        { valor: 4, label: "Bueno", color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-700" },
        { valor: 3, label: "Regular", color: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700" },
        { valor: 2, label: "Tolerable", color: "bg-orange-500", light: "bg-orange-50", text: "text-orange-700" },
        { valor: 1, label: "Malo", color: "bg-red-500", light: "bg-red-50", text: "text-red-700" }
    ];

    const calificacion = evaluacion.calificacion;

    const handleSubmit = () => {
        if (!evaluacion.evaluador_nombre) {
            alert('Por favor, ingresa el nombre del evaluador');
            return;
        }
        if (!evaluacion.colaborador_nombre) {
            alert('Por favor, ingresa el nombre del colaborador evaluado');
            return;
        }
        
        const fecha = new Date().toISOString().split('T')[0];
        onSave({ ...evaluacion, fecha, calificacion });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-4xl my-8 mx-4 bg-white rounded-2xl shadow-2xl">
                
                <div className="relative rounded-t-2xl bg-gradient-to-r from-[#0f2866] to-[#1a3a8a] p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="text-2xl">📋</span> Evaluación de Desempeño
                            </h2>
                            <p className="text-white/80 text-sm mt-1">{puesto.nombre}</p>
                            <p className="text-white/60 text-xs mt-0.5">{criteriosStrings.length} criterios de evaluación</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">

                     
                    {/* CUADRO DE PRUEBA - AGREGA ESTO AQUÍ */}
                    <div className="bg-red-500 text-white p-4 mb-4 rounded-xl">
                        🔥 PRUEBA - SI VES ESTO, EL ARCHIVO SE ACTUALIZÓ 🔥
                    </div>
                                    
                    {/* DATOS DEL COLABORADOR EVALUADO */}
                    <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl p-4 border border-blue-100">
                        <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" /> Datos del colaborador evaluado
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre completo *</label>
                                <input
                                    type="text"
                                    value={evaluacion.colaborador_nombre}
                                    onChange={(e) => setEvaluacion({ ...evaluacion, colaborador_nombre: e.target.value })}
                                    placeholder="Ej: Juan Pérez Gómez"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Período que se evalúa</label>
                                <input
                                    type="text"
                                    value={evaluacion.periodo}
                                    onChange={(e) => setEvaluacion({ ...evaluacion, periodo: e.target.value })}
                                    placeholder="Ej: Enero - Marzo 2026"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                                    <Building2 className="h-3 w-3" /> Concesionario
                                </label>
                                <input
                                    type="text"
                                    value={evaluacion.concesionario}
                                    onChange={(e) => setEvaluacion({ ...evaluacion, concesionario: e.target.value })}
                                    placeholder="Ej: VW Cordoba"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Antigüedad
                                </label>
                                <input
                                    type="text"
                                    value={evaluacion.antiguedad}
                                    onChange={(e) => setEvaluacion({ ...evaluacion, antiguedad: e.target.value })}
                                    placeholder="Ej: 2 años, 3 meses"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* DATOS DEL EVALUADOR */}
                    <div className="bg-gradient-to-r from-emerald-50 to-white rounded-xl p-4 border border-emerald-100">
                        <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                            <User className="h-4 w-4" /> Datos del evaluador
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre completo *</label>
                                <input
                                    type="text"
                                    value={evaluacion.evaluador_nombre}
                                    onChange={(e) => setEvaluacion({ ...evaluacion, evaluador_nombre: e.target.value })}
                                    placeholder="Ej: María López Sánchez"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Puesto</label>
                                <input
                                    type="text"
                                    value={evaluacion.evaluador_puesto}
                                    onChange={(e) => setEvaluacion({ ...evaluacion, evaluador_puesto: e.target.value })}
                                    placeholder="Ej: Gerente de Ventas"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="mt-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-2">Motivo de la evaluación</label>
                            <div className="flex gap-4">
                                {[
                                    { value: 'A', label: 'Análisis de desempeño', desc: 'Evaluación inicial o periódica' },
                                    { value: 'D', label: 'Desarrollo del trabajador', desc: 'Desempeño a la baja' },
                                    { value: 'E', label: 'Evaluación directa', desc: 'Evaluación de resultados' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setEvaluacion({ ...evaluacion, motivo: opt.value })}
                                        className={`flex-1 p-3 rounded-lg text-left transition border ${
                                            evaluacion.motivo === opt.value
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="font-bold text-sm">{opt.value} - {opt.label}</div>
                                        <div className={`text-xs mt-1 ${evaluacion.motivo === opt.value ? 'text-white/80' : 'text-gray-400'}`}>
                                            {opt.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CRITERIOS */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                            Criterios de evaluación
                        </h3>
                        <div className="space-y-3">
                            {criteriosStrings.map((criterio, idx) => (
                                <div key={idx} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition">
                                    <div className="text-sm font-medium text-gray-800 mb-3">{criterio}</div>
                                    <div className="flex gap-2">
                                        {escala.map(opt => (
                                            <button
                                                key={opt.valor}
                                                onClick={() => handleCriterioChange(criterio, opt.valor)}
                                                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all transform hover:scale-105 ${
                                                    evaluacion.criterios[criterio] === opt.valor
                                                        ? `${opt.color} text-white shadow-md`
                                                        : `${opt.light} ${opt.text} hover:${opt.color} hover:text-white`
                                                }`}
                                            >
                                                {opt.valor}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CALIFICACIÓN */}
                    <div className="rounded-xl p-5 text-center bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                        <div className="text-sm text-gray-500 uppercase tracking-wide">Calificación total</div>
                        <div className="text-5xl font-black mt-2 bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                            {calificacion}%
                        </div>
                        <div className="mt-4">
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500" style={{ width: `${calificacion}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* COMENTARIOS */}
                    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Comentarios y observaciones</label>
                        <textarea
                            rows={3}
                            value={evaluacion.comentarios}
                            onChange={(e) => setEvaluacion({ ...evaluacion, comentarios: e.target.value })}
                            placeholder="Escribe aquí tus comentarios..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-100 rounded-b-2xl p-5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!evaluacion.evaluador_nombre || !evaluacion.colaborador_nombre}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md disabled:opacity-50"
                    >
                        Guardar evaluación
                    </button>
                </div>
            </div>
        </div>
    );
}