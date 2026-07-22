import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function ModalBaja({ open, colaborador, onClose, onGuardar }) {
    const [fechaBaja, setFechaBaja] = useState("");
    const [motivoBaja, setMotivoBaja] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setFechaBaja("");
            setMotivoBaja("");
            setError("");
        }
    }, [open]);

    if (!open || !colaborador) return null;

    const handleGuardar = async () => {
        if (!fechaBaja || !motivoBaja.trim()) {
            setError("Fecha y motivo son obligatorios.");
            return;
        }

        setGuardando(true);
        setError("");

        try {
            await onGuardar({
                fecha_baja: fechaBaja,
                motivo_baja: motivoBaja.trim(),
            });
        } catch (err) {
            console.error(err);
            setError("No fue posible registrar la baja.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-xl shadow-xl w-[420px] p-6">

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-[#1c1c1c]">
                        Dar de baja a {colaborador.nombre}
                    </h2>

                    <button onClick={onClose}>
                        <X size={20} className="text-gray-500 hover:text-gray-700" />
                    </button>
                </div>

                <div className="space-y-4">

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            Fecha de baja
                        </label>
                        <input
                            type="date"
                            value={fechaBaja}
                            onChange={(e) => setFechaBaja(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A2B72]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            Motivo de baja
                        </label>
                        <textarea
                            value={motivoBaja}
                            onChange={(e) => setMotivoBaja(e.target.value)}
                            placeholder="Escribe el motivo de la baja..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A2B72] resize-none"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}

                </div>

                <div className="flex justify-end gap-3 mt-6">

                    <button
                        onClick={onClose}
                        className="px-4 h-10 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleGuardar}
                        disabled={guardando}
                        className="px-4 h-10 rounded-lg bg-[#16255E] hover:bg-[#1F327B] text-white font-medium transition disabled:opacity-60"
                    >
                        {guardando ? "Guardando..." : "Confirmar baja"}
                    </button>

                </div>

            </div>

        </div>
    );
}