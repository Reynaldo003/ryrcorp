import React, { useState, useEffect } from "react";

import {
    Search,
    Plus,
    Pencil,
    Trash2,
    UserX
} from "lucide-react";

import ModalColaborador from "./components/ModalColaborador";
import ModalBaja from "./components/ModalBaja";

import {
    obtenerColaboradores,
    crearColaborador,
    actualizarColaborador,
    eliminarColaborador,
    darDeBajaColaborador,
} from "../../lib/apiColaboradores";


export default function AltaPersonal() {

    const [agenciaSeleccionada, setAgenciaSeleccionada] = useState("Córdoba");
    const [busqueda, setBusqueda] = useState("");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [colaboradores, setColaboradores] = useState([]);
    const [colaboradorEditar, setColaboradorEditar] =useState(null);
    const [mostrarModalBaja, setMostrarModalBaja] = useState(false);
    const [colaboradorBaja, setColaboradorBaja] = useState(null);

    const cargarColaboradores = async () => {
        try {
            const datos = await obtenerColaboradores({
                agencia: agenciaSeleccionada,
                buscar: busqueda,
            });

            setColaboradores(datos);
        } catch (error) {
            console.error("Error al cargar colaboradores:", error);
        }
    };
   
    useEffect(() => {
        cargarColaboradores();
    }, [agenciaSeleccionada, busqueda]);

    const agencias = [
        "Córdoba",
        "Orizaba",
        "Poza Rica",
        "Tuxtepec",
        "Tuxpan"
    ];

    const colaboradoresFiltrados = colaboradores.filter((item) => {

        const texto = busqueda.toLowerCase();

        return (
            item.nombre?.toLowerCase().includes(texto) ||
            item.puesto?.toLowerCase().includes(texto) ||
            item.curp?.toLowerCase().includes(texto) ||
            item.nss?.toLowerCase().includes(texto)
        );

    });

    return (

        <div className="min-h-screen bg-[#f8f8fa] p-10">

            <div className="max-w-7xl mx-auto">

                {/* ENCABEZADO */}

                <div className="flex justify-between items-center mb-8">

                    <div>

                       <h1 className="text-3xl font-semibold text-[#1c1c1c]">
                            Alta del Personal
                        </h1>

                        <p className="text-gray-500 text-sm mt-1">
                            Administración del personal por agencia
                        </p>

                    </div>

                </div>

                {/* AGENCIAS */}

               <div className="flex items-center border-b border-gray-300 mb-8">
                    {agencias.map((agencia)=>(

                        <button

                            key={agencia}

                            onClick={()=>setAgenciaSeleccionada(agencia)}

                            className={`
                                px-7
                                py-3
                                text-sm
                                transition-all
                                border-b-2

                                ${
                                    agenciaSeleccionada===agencia
                                    ? "border-[#1A2B72] text-[#1A2B72] font-semibold"
                                    : "border-transparent text-gray-500 hover:text-[#1A2B72]"
                                }
                            `}
                        >

                            {agencia}

                        </button>

                    ))}

                </div>

                {/* BUSCADOR */}

               {/* BUSCADOR Y BOTÓN */}

                <div className="flex justify-between items-center mb-8">

                    <div className="relative w-[380px]">

                        <Search
                            className="absolute left-4 top-3.5 text-gray-400"
                            size={18}
                        />

                        <input
                            type="text"
                            placeholder="Buscar colaborador..."
                            value={busqueda}
                            onChange={(e)=>setBusqueda(e.target.value)}
                            className="
                                w-full
                                pl-11
                                pr-4
                                h-11
                                rounded-lg
                                border
                                border-gray-200
                                bg-white
                                shadow-sm
                                focus:outline-none
                                focus:ring-2
                                focus:ring-[#1A2B72]
                            "
                        />

                    </div>

                    <button

                        onClick={()=>setMostrarModal(true)}

                        className="
                            h-11
                            px-5
                            rounded-lg
                            bg-[#16255E]
                            hover:bg-[#1F327B]
                            text-white
                            font-medium
                            flex
                            items-center
                            gap-2
                            transition
                        "

                    >

                        <Plus size={18}/>

                        Nuevo Colaborador

                    </button>

                </div>

                {/* TABLA */}

                <div className="rounded-xl border border-gray-200 bg-white shadow-md">

                    <table className="min-w-full">

                        <thead className="bg-[#16255E] text-white">

                            <tr>

                                <th className="py-3 px-4 text-left text-sm font-medium">

                                    Nombre

                                </th>

                                <th className="px-5 py-4 text-left">
                                    Puesto
                                </th>

                                <th className="px-5 py-4 text-left">
                                    CURP
                                </th>

                                <th className="px-5 py-4 text-left">
                                    NSS
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Fecha Nacimiento
                                </th>

                                <th className="px-5 py-4 text-left">
                                    Fecha Alta
                                </th>

                                <th className="px-5 py-4 text-center">
                                    Estado
                                </th>

                                <th className="px-5 py-4 text-center">
                                    Acciones
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {colaboradoresFiltrados.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan={8}
                                        className="py-16 text-center text-slate-400 text-lg"
                                    >
                                        No hay colaboradores registrados.
                                    </td>

                                </tr>

                            ) : (

                                colaboradoresFiltrados.map((colaborador, index) => (

                                    <tr

                                        key={index}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition"

                                    >

                                        <td className="px-5 py-4">

                                            {colaborador.nombre}

                                        </td>

                                        <td className="px-5 py-4">

                                            {colaborador.puesto}

                                        </td>

                                        <td className="px-5 py-4">

                                            {colaborador.curp}

                                        </td>

                                        <td className="px-5 py-4">

                                            {colaborador.nss}

                                        </td>

                                        <td className="px-5 py-4">
                                            {colaborador.fecha_nacimiento}
                                        </td>

                                        <td className="px-5 py-4">
                                            {colaborador.fecha_alta}
                                        </td>

                                        <td className="px-5 py-4 text-center">

                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    colaborador.activo
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                                title={
                                                    colaborador.activo
                                                        ? "Activo"
                                                        : `Baja: ${colaborador.motivo_baja || ""}`
                                                }
                                            >
                                                {colaborador.activo ? "Activo" : "Baja"}
                                            </span>

                                        </td>

                                        <td className="px-5 py-4">

                                            <div className="flex justify-center gap-2">

                                                <button
                                                    onClick={() => {
                                                        setColaboradorEditar(colaborador);
                                                        setMostrarModal(true);
                                                    }}
                                                    className="
                                                        w-9
                                                        h-9
                                                        rounded-lg
                                                        bg-gradient-to-b
                                                        from-slate-200
                                                        to-slate-400
                                                        hover:brightness-110
                                                        transition
                                                        flex
                                                        items-center
                                                        justify-center
                                                    "
                                                >
                                                    <Pencil size={17}/>
                                                </button>

                                               <button
                                                    onClick={async () => {

                                                        const confirmar = window.confirm(
                                                            `¿Deseas eliminar a "${colaborador.nombre}"?`
                                                        );

                                                        if (!confirmar) return;

                                                        try {

                                                            await eliminarColaborador(
                                                                colaborador.id_colaborador
                                                            );

                                                            await cargarColaboradores();

                                                        } catch (error) {

                                                            console.error(error);

                                                            alert("No fue posible eliminar el colaborador.");

                                                        }

                                                    }}
                                                    className="
                                                        w-9
                                                        h-9
                                                        rounded-lg
                                                        bg-gradient-to-b
                                                        from-red-300
                                                        to-red-500
                                                        text-white
                                                        hover:brightness-110
                                                        transition
                                                        flex
                                                        items-center
                                                        justify-center
                                                    "
                                               >
                                                    <Trash2 size={17} />
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setColaboradorBaja(colaborador);
                                                        setMostrarModalBaja(true);
                                                    }}
                                                    title="Dar de baja"
                                                    className="
                                                        w-9
                                                        h-9
                                                        rounded-lg
                                                        bg-gradient-to-b
                                                        from-amber-300
                                                        to-amber-500
                                                        text-white
                                                        hover:brightness-110
                                                        transition
                                                        flex
                                                        items-center
                                                        justify-center
                                                    "
                                                >
                                                    <UserX size={17} />
                                                </button>

                                            
                                            </div>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

                {/* MODAL */}
             <ModalColaborador
                    open={mostrarModal}
                    agencia={agenciaSeleccionada}
                    colaborador={colaboradorEditar}
                    onClose={() => {
                        setMostrarModal(false);
                        setColaboradorEditar(null);
                    }}
                    onGuardar={async (datos) => {

                        if (colaboradorEditar) {

                            await actualizarColaborador(
                                colaboradorEditar.id_colaborador,
                                datos
                            );

                        } else {

                            await crearColaborador(datos);

                        }

                        await cargarColaboradores();

                        setMostrarModal(false);
                        setColaboradorEditar(null);
                    }}
                />

                {/* MODAL DE BAJA */}
                <ModalBaja
                    open={mostrarModalBaja}
                    colaborador={colaboradorBaja}
                    onClose={() => {
                        setMostrarModalBaja(false);
                        setColaboradorBaja(null);
                    }}
                    onGuardar={async (datos) => {

                        await darDeBajaColaborador(
                            colaboradorBaja.id_colaborador,
                            datos
                        );

                        await cargarColaboradores();

                        setMostrarModalBaja(false);
                        setColaboradorBaja(null);
                    }}
                />

            </div>

        </div>

    );

}