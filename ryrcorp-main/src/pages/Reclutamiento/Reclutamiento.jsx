// src/pages/Administrativos/Reclutamiento.jsx
import { useState } from 'react';
import { ClipboardList, BookOpen } from 'lucide-react';
import VacantesView from './VacantesView';
import PlanCapacitacion from './PlanCapacitacion';

const BRAND_BLUE = "#131E5C";

export default function Reclutamiento() {
    const [activeTab, setActiveTab] = useState('vacantes');

    const tabs = [
        { key: 'vacantes', label: 'Vacantes', icon: ClipboardList },
        { key: 'capacitacion', label: 'Plan de Capacitación', icon: BookOpen },
    ];

    return (
        <div className="w-full">
            {/* Pestañas superiores */}
            <div className="flex items-center gap-2 bg-white px-4 py-3">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;

                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition"
                            style={{
                                borderColor: BRAND_BLUE,
                                backgroundColor: active ? BRAND_BLUE : "#FFFFFF",
                                color: active ? "#FFFFFF" : BRAND_BLUE,
                            }}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Contenido según pestaña */}
            {activeTab === 'vacantes' ? <VacantesView /> : <PlanCapacitacion />}
        </div>
    );
}