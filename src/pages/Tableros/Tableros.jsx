// src/pages/Tableros/Tableros.jsx
import { useState, useMemo, useRef, useCallback } from "react";
import { Columns2, Plus } from "lucide-react";
import BarraFiltros from "./components/BarraFiltros";
import TarjetaPanel from "./components/TarjetaPanel";
import ModalCatalogo from "./components/ModalCatalogo";
import { CATALOGO_CRM } from "./config/catalogoModulos";

export default function Tableros() {
    const [agenciaSeleccionada, setAgenciaSeleccionada] = useState("Todas las agencias");
    const [periodoAnio, setPeriodoAnio] = useState("2026");
    const [mesesSeleccionados, setMesesSeleccionados] = useState(["10"]);

    const [paneles, setPaneles] = useState([
        {
            id: 1,
            moduloId: "gestion_negocio",
            submoduloId: "inventario",
        },
        {
            id: 2,
            moduloId: "comercial",
            submoduloId: "comercial_prospectos",
        },
    ]);

    const [modalAbierto, setModalAbierto] = useState(false);
    const panelArrastrado = useRef(null);

    const iniciarArrastre = (id) => {
        panelArrastrado.current = id;
    };

    const moverPanel = (idDestino) => {
        const idOrigen = panelArrastrado.current;

        if (!idOrigen || idOrigen === idDestino) return;

        setPaneles(prev => {
            const origen = prev.findIndex(p => p.id === idOrigen);
            const destino = prev.findIndex(p => p.id === idDestino);

            if (origen === -1 || destino === -1) return prev;

            const nuevos = [...prev];
            const [movido] = nuevos.splice(origen, 1);

            nuevos.splice(destino, 0, movido);

            return nuevos;
        });

        panelArrastrado.current = null;
    };

    const seleccionarMes = (key) => {
        if (key === "anual") {
            setMesesSeleccionados(["anual"]);
        } else {
            setMesesSeleccionados([key]);
        }
    };

    const agregarModulo = (moduloId, submoduloId) => {
        const nuevoId = Date.now();
        setPaneles((prev) => [...prev, { id: nuevoId, moduloId, submoduloId }]);
        setModalAbierto(false);
    };

    const eliminarPanel = useCallback((id) => {
        setPaneles(prev => prev.filter(p => p.id !== id));
    }, []);

    const cambiarSubmodulo = useCallback((id, nuevoSubmodulo) => {
        setPaneles(prev =>
            prev.map(p =>
                p.id === id
                    ? { ...p, submoduloId: nuevoSubmodulo }
                    : p
            )
        );
    }, []);

    const cambiarModulo = useCallback((id, nuevoModuloId) => {
        const todosModulos = CATALOGO_CRM.flatMap(grupo => grupo.modulos);

        const nuevoModulo = todosModulos.find(
            mod => mod.id === nuevoModuloId
        );

        if (!nuevoModulo || nuevoModulo.disponible === false) return;

        const primerSubmodulo = nuevoModulo.submodulos?.[0]?.id;

        if (!primerSubmodulo) return;

        setPaneles(prev =>
            prev.map(panel =>
                panel.id === id
                    ? {
                        ...panel,
                        moduloId: nuevoModuloId,
                        submoduloId: primerSubmodulo,
                    }
                    : panel
            )
        );
    }, []);

    const filtrosGlobales = useMemo(() => ({
        agencia: agenciaSeleccionada,
        anio: periodoAnio,
        meses: mesesSeleccionados,
    }), [agenciaSeleccionada, periodoAnio, mesesSeleccionados]);

    return (
        <div className="mx-auto w-full max-w-[1700px] space-y-5 p-4 sm:p-6">
            {/* Encabezado */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-xl font-black text-[#001E50] sm:text-2xl">
                        <Columns2 className="h-6 w-6 text-[#001E50]" />
                        Tableros de Rendimiento y Conversión
                    </h1>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        Vista comparativa del CRM: selecciona cualquier módulo y contrástalo en tiempo real.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setModalAbierto(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#001E50] px-4 text-xs font-black text-white shadow-sm transition hover:bg-[#102a6b] cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    Agregar Módulo
                </button>
            </div>

            {/* Filtros Globales */}
            <BarraFiltros
                agenciaSeleccionada={agenciaSeleccionada}
                setAgenciaSeleccionada={setAgenciaSeleccionada}
                periodoAnio={periodoAnio}
                setPeriodoAnio={setPeriodoAnio}
                mesesSeleccionados={mesesSeleccionados}
                seleccionarMes={seleccionarMes}
            />

            {/* Cuadrícula Dinámica */}
            <div className="grid gap-6 md:grid-cols-2">
                {paneles.map((panel) => (
                    <div
                        key={panel.id}
                        draggable
                        onDragStart={() => iniciarArrastre(panel.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => moverPanel(panel.id)}
                        className=""
                    >
                        <TarjetaPanel
                            panel={panel}
                            filtros={filtrosGlobales}
                            onCambiarModulo={cambiarModulo}
                            onCambiarSubmodulo={cambiarSubmodulo}
                            onEliminar={eliminarPanel}
                            totalPaneles={paneles.length}
                        />
                    </div>
                ))}

                {/* Tarjeta de añadir módulo */}
                <button
                    type="button"
                    onClick={() => setModalAbierto(true)}
                    className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition hover:border-[#001E50] hover:bg-blue-50/30 group cursor-pointer"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-400 group-hover:bg-[#001E50] group-hover:text-white group-hover:border-[#001E50] transition">
                        <Plus className="h-7 w-7" />
                    </div>
                    <span className="mt-4 text-sm font-black text-slate-700 group-hover:text-[#001E50] transition">
                        + Agregar Módulo al Tablero
                    </span>
                    <p className="mt-1 text-xs text-slate-400 max-w-xs leading-relaxed">
                        Selecciona otro módulo o submódulo del CRM para contrastar métricas en paralelo.
                    </p>
                </button>
            </div>

            {/* Modal Selector */}
            <ModalCatalogo
                abierto={modalAbierto}
                onClose={() => setModalAbierto(false)}
                onSelectSubmodulo={agregarModulo}
            />
        </div>
    );
}