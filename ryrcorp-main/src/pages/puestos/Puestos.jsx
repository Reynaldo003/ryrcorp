import { useState } from 'react';
import EvaluacionView from './EvaluacionView';
import ListaPuestosView from './ListaPuestosView';
import { ClipboardList, BriefcaseBusiness } from 'lucide-react';

export default function Puestos() {
    const [activeTab, setActiveTab] = useState('evaluacion');

    return (
        <div className="w-full">
            {/* Pestañas superiores */}
            <div className="bg-white px-4 py-3">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('evaluacion')}
                        className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-all ${
                            activeTab === 'evaluacion'
                                ? 'bg-[#131E5C] text-white shadow-md'
                                : 'border border-[#131E5C] text-[#131E5C] bg-white hover:bg-slate-50'
                        }`}
                    >
                        <ClipboardList className="h-4 w-4" />
                        Evaluación de puestos
                    </button>
                    <button
                        onClick={() => setActiveTab('lista')}
                        className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-all ${
                            activeTab === 'lista'
                                ? 'bg-[#131E5C] text-white shadow-md'
                                : 'border border-[#131E5C] text-[#131E5C] bg-white hover:bg-slate-50'
                        }`}
                    >
                        <BriefcaseBusiness className="h-4 w-4" />
                        Lista de puestos
                    </button>
                </div>
            </div>

            {/* Contenido según pestaña */}
            {activeTab === 'evaluacion' ? <EvaluacionView /> : <ListaPuestosView />}
        </div>
    );
}