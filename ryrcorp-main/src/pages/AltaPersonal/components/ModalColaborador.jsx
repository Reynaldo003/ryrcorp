import React, { useState, useEffect } from "react";
import { X, UserPlus, Calendar } from "lucide-react";

export default function ModalColaborador({
    open,
    onClose,
    onGuardar,
    agencia,
    colaborador
}) {
  const [formulario, setFormulario] = useState({
        nombre: "",
        puesto: "",
        curp: "",
        nss: "",
        fecha_nacimiento: "",
        fecha_alta: "",
        fecha_baja: "",
        motivoBaja: "",
        comentarios: ""
    });

    useEffect(() => {

        if (colaborador) {

            setFormulario({
                nombre: colaborador.nombre || "",
                puesto: colaborador.puesto || "",
                curp: colaborador.curp || "",
                nss: colaborador.nss || "",
                fecha_nacimiento: colaborador.fecha_nacimiento || "",
                fecha_alta: colaborador.fecha_alta || "",
                fecha_baja: colaborador.fecha_baja || "",
                motivoBaja: "",
                comentarios: ""
            });

        } else {

            setFormulario({
                nombre: "",
                puesto: "",
                curp: "",
                nss: "",
                fecha_nacimiento: "",
                fecha_alta: "",
                fecha_baja: "",
                motivoBaja: "",
                indicadores: "",
                planAccion: "",
                seguimiento: ""
            });

        }

    }, [colaborador, open]);

    const [mostrarBaja, setMostrarBaja] = useState(false);

    const handleChange = (e) => {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });
    };

   const guardar = () => {

    const datos = {
        agencia,
        nombre: formulario.nombre,
        puesto: formulario.puesto,
        curp: formulario.curp,
        nss: formulario.nss,
        fecha_alta: formulario.fecha_alta,
        fecha_baja: formulario.fecha_baja || null,
        fecha_nacimiento: formulario.fecha_nacimiento || null,
    };

    //console.log("DATOS QUE SE ENVÍAN:", datos);

    onGuardar(datos);

    setFormulario({
        nombre: "",
        puesto: "",
        curp: "",
        nss: "",
        fecha_nacimiento: "",
        fecha_alta: "",
        fecha_baja: "",
        motivoBaja: "",
        comentarios: ""
    });

};

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-[#131E5C] text-white px-6 py-4 flex justify-between items-center">

                    <div className="flex items-center gap-3">

                        <div className="bg-white/20 p-2 rounded-full">
                            <UserPlus size={20} />
                        </div>

                        <div>
                           <h2 className="text-xl font-semibold">
                                {colaborador ? "Editar Colaborador" : "Nuevo Colaborador"}
                            </h2>

                            <p className="text-xs text-blue-100">
                                Registro de personal
                            </p>
                        </div>

                    </div>

                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 p-2 rounded-full transition"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                   <div className="bg-slate-50 rounded-xl p-5 border">

                        <h3 className="font-semibold text-[#131E5C] mb-4">
                            Información del colaborador
                        </h3>

                        <div className="space-y-4">

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nombre Completo
                                </label>

                                <input
                                    type="text"
                                    name="nombre"
                                    value={formulario.nombre}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-[#131E5C] outline-none"
                                />
                            </div>

                            {/* Puesto */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Puesto
                                </label>

                                <input
                                    type="text"
                                    name="puesto"
                                    value={formulario.puesto}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-[#131E5C] outline-none"
                                />
                            </div>

                            {/* CURP y NSS */}
                            <div className="grid grid-cols-2 gap-4">

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        CURP
                                    </label>

                                    <input
                                        type="text"
                                        name="curp"
                                        value={formulario.curp}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 uppercase focus:ring-2 focus:ring-[#131E5C] outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        NSS
                                    </label>

                                    <input
                                        type="text"
                                        name="nss"
                                        value={formulario.nss}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:ring-2 focus:ring-[#131E5C] outline-none"
                                    />
                                </div>

                            </div>

                            {/* Cumpleaños y Fecha Alta */}
                            <div className="grid grid-cols-2 gap-4">

                                <div>

                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Fecha Nacimiento
                                    </label>

                                    <div className="relative">

                                        <Calendar
                                            size={18}
                                            className="absolute left-3 top-3 text-slate-400"
                                        />

                                        <input
                                            type="date"
                                            name="fecha_nacimiento"
                                            value={formulario.fecha_nacimiento}
                                            onChange={handleChange}
                                        />

                                    </div>

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Fecha Alta
                                    </label>

                                    <div className="relative">

                                        <Calendar
                                            size={18}
                                            className="absolute left-3 top-3 text-slate-400"
                                        />

                                        <input
                                            type="date"
                                            name="fecha_alta"
                                            value={formulario.fecha_alta}
                                            onChange={handleChange}
                                        />

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                   {/* Comentarios */}
                    <div className="bg-slate-50 rounded-xl p-5 border">

                        <h3 className="font-semibold text-[#131E5C] mb-4">
                            Comentarios
                        </h3>

                        <textarea
                            rows={4}
                            name="comentarios"
                            value={formulario.comentarios}
                            onChange={handleChange}
                            placeholder="Escriba observaciones o comentarios del colaborador..."
                            className="
                                w-full
                                resize-none
                                rounded-lg
                                border
                                border-slate-300
                                px-4
                                py-3
                                focus:ring-2
                                focus:ring-[#131E5C]
                                outline-none
                            "
                        />

                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-100 px-6 py-4 flex justify-end gap-3">

                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-200 transition"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={guardar}
                        className="px-6 py-2 rounded-lg bg-[#131E5C] text-white hover:bg-[#0f1748] transition"
                    >
                       {colaborador ? "Actualizar" : "Guardar"}
                    </button>

                </div>

            </div>

        </div>
    );
}