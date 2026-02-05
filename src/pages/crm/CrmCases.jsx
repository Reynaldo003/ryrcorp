import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const opciones_raiz = {
    "Gestion de Clientes": [
        "Respuestas lentas a las quejas",
        "Falta de seguimiento postventa",
        "Encuestas de satisfacción poco frecuentes o inexistentes",
        "Mala gestión de la experiencia del cliente en el showroom",
        "Falta de personal dedicado a la atención al cliente",
        "Tiempos de espera prolongados para servicios de mantenimiento",
        "Falta de comunicación proactiva con los clientes",
        "Carencia de programas de fidelización",
        "Problemas en la gestión de citas y servicios programados",
        "Deficiencias en la personalización del servicio",
        "Falta de transparencia en la información proporcionada a los clientes",
        "Deficiencias en la gestión de la imagen y reputación de la concesionaria en redes sociales y plataformas de opinión",
        "Falta de atención a los comentarios y reseñas de clientes",
        "Problemas en la gestión de garantías",
        "Falta de ofertas y promociones atractivas",
        "Dificultad para contactar con el servicio al cliente",
        "Horarios de atención limitados",
        "Mal uso de CRM",
        "Problemas en la gestión de reclamaciones y devoluciones"
    ],
    Materiales: [],
    Metodo: [
        "Procesos complejos",
        "Procesos poco explícitos",
        "Incumplimiento en la ejecución",
        "Procesos limitados",
        "Falta de documentación y registro",
        "Falta de integración entre departamentos",
        "Inconsistencias en la aplicación",
        "Procesos no optimizados",
        "Falta de estandarización en la atención al cliente",
        "Ausencia de procedimientos claros para la gestión de garantías",
        "Falta de protocolos para la entrega de vehículos nuevos",
        "Falta de automatización en procesos administrativos",
        "Retrasos en la tramitación de documentos",
        "Ineficiencia en la programación de citas para mantenimiento",
        "Problemas en la gestión de la información del cliente",
        "Falta de procedimientos de emergencia",
        "Deficiencias en el control de calidad",
        "Falta de auditorías internas periódicas",
        "Problemas en la implementación de sistemas ERP",
        "Deficiencias en la gestión de proyectos",
        "Falta de revisiones periódicas de los procesos",
        "Procedimientos redundantes",
        "Falta de actualización de manuales operativos",
        "Uso ineficiente de recursos",
        "Falta de un sistema de gestión de calidad total"
    ],
    Infraestructura: [],
    "Talento Humano": []
};

const causasDisponibles = Object.keys(opciones_raiz);
const lineas = ["Ventas", "Servicio", "Usados", "Refacciones", "General"];
const origenes = [
    "JD Power",
    "Whatsapp",
    "Facebook",
    "Encuesta Interna",
    "Reclamacion Verbal",
    "Llamada de Calidad"
];

const estado = [
    "1er Contacto",
    "2do Contacto",
    "3er Contacto",
    "Reclamacion Cerrada"
];

export default function CrmCases() {
    const navigate = useNavigate();

    const rows = [
        {
            chasis: "NC-00124",
            cliente: "Cliente Ejemplo A",
            linea: "Ventas",
            expediente: "OS-4521",
            fecha: "2026-01-18",
            fecha_serv: "2026-01-20",
            fecha_entrega: "2026-01-22",
            fecha_recla: "2026-02-01",
            liga: "https://docs.google.com/spreadsheets/d/18vNgj81iOQeDD_cNVlPSfaSNsaODFLNQpF03H396OsI/edit?usp=sharing",
            origen: "JD Power",
            estado: "Reclamacion Cerrada",
            recop: "Correo",
            problema: "Ruido en motor",
            causa: "Gestion de Clientes",
            raiz: "Falta de comunicación proactiva con los clientes",
            descripcion: "Cliente reporta ruido al encender.",
            contacto1: "03/02/2026 Sin respuesta",
            contacto2: "08/02/2026 Proximo a contactar",
            contacto3: "—",
            contacto_cierre: "",
        },
        {
            chasis: "NC-00123",
            cliente: "Cliente Ejemplo B",
            linea: "Servicio",
            expediente: "OS-4499",
            fecha: "2026-01-10",
            fecha_serv: "2026-01-12",
            fecha_entrega: "2026-01-15",
            fecha_recla: "2026-01-25",
            liga: "https://docs.google.com/spreadsheets/d/18vNgj81iOQeDD_cNVlPSfaSNsaODFLNQpF03H396OsI/edit?usp=sharing",
            origen: "Whatsapp",
            estado: "1er Contacto",
            recop: "Llamada",
            problema: "Demora en entrega",
            causa: "Metodo",
            raiz: "Procesos complejos",
            descripcion: "Retraso en la entrega del vehículo.",
            contacto1: "28/01/2026 Satisfactorio",
            contacto2: "—",
            contacto3: "—",
            contacto_cierre: "—",
        },
        {
            chasis: "NC-00122",
            cliente: "Cliente Ejemplo C",
            linea: "Usados",
            expediente: "OS-4477",
            fecha: "2025-12-20",
            fecha_serv: "2025-12-22",
            fecha_entrega: "2025-12-24",
            fecha_recla: "2026-01-05",
            liga: "https://docs.google.com/spreadsheets/d/18vNgj81iOQeDD_cNVlPSfaSNsaODFLNQpF03H396OsI/edit?usp=sharing",
            origen: "Encuesta Interna",
            estado: "2do Contacto",
            recop: "Formulario",
            problema: "Documentación incompleta",
            causa: "Gestion de Clientes",
            raiz: "Mal uso de CRM",
            descripcion: "Se entregó sin papeles completos.",
            contacto1: "30/01/2026 Sin respuesta",
            contacto2: "05/02/2026 Finalizado",
            contacto3: "—",
            contacto_cierre: "—",
        }
    ];

    const [openMenus, setOpenMenus] = useState({});
    const [selectedCausas, setSelectedCausas] = useState(() =>
        Object.fromEntries(rows.map((r) => [r.chasis, r.causa || ""]))
    );
    const [selectedRaices, setSelectedRaices] = useState(() =>
        Object.fromEntries(rows.map((r) => [r.chasis, r.raiz || ""]))
    );

    const toggleMenu = (rowId, field) => {
        const key = `${rowId}-${field}`;
        setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const chooseCausa = (rowId, value) => {
        const key = `${rowId}-causa`;
        setSelectedCausas((prev) => ({ ...prev, [rowId]: value }));
        setSelectedRaices((prev) => ({ ...prev, [rowId]: "" }));
        setOpenMenus((prev) => ({ ...prev, [key]: false }));
    };

    const chooseRaiz = (rowId, value) => {
        const key = `${rowId}-raiz`;
        setSelectedRaices((prev) => ({ ...prev, [rowId]: value }));
        setOpenMenus((prev) => ({ ...prev, [key]: false }));
    };
    const handleRowClick = (row) => {
        navigate(`/crm/casos/${row.chasis}/editar`, { state: row });
    };

    const stop = (e) => e.stopPropagation();

    return (
        <div className="space-y-4 max-w-6xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm w-[1210px]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-base font-semibold">Casos</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Lista de no conformidades.
                        </p>
                    </div>

                    <button className="rounded-2xl bg-[#131E5C] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                        + Nuevo caso
                    </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <input className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300" placeholder="Buscar folio o cliente..." />
                    <select className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300">
                        <option>Agencia: Todos</option>
                        <option>VW Cordoba</option>
                        <option>VW Orizaba</option>
                        <option>VW Tuxpan</option>
                        <option>VW Poza Rica</option>
                        <option>VW Tuxtepec</option>
                    </select>
                    <select className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300">
                        <option>Estado: Todos</option>
                        <option>Nuevo</option>
                        <option>En análisis</option>
                        <option>En ejecución</option>
                        <option>Cerrado</option>
                    </select>
                    <select className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300">
                        <option>Prioridad: Todas</option>
                        <option>Alta</option>
                        <option>Media</option>
                        <option>Baja</option>
                    </select>
                    <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 w-[1160px]">
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm mb-16 overflow-x-auto w-[1210px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-4 py-3">Chasis</th>
                            <th className="px-4 py-3">Cliente</th>
                            <th className="px-4 py-3">Linea de Negocios</th>
                            <th className="px-4 py-3">OS - Expediente</th>
                            <th className="px-4 py-3">Fecha</th>
                            <th className="px-4 py-3">Fecha Servicio</th>
                            <th className="px-4 py-3">Fecha Entrega</th>
                            <th className="px-4 py-3">Fecha Reclamacion</th>
                            <th className="px-4 py-3">Liga de Reclamacion</th>
                            <th className="px-4 py-3">Origen Reclamacion</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Recopilacion de Contactos</th>
                            <th className="px-4 py-3">Definicion del Problema</th>
                            <th className="px-4 py-3">Causa</th>
                            <th className="px-4 py-3">Raiz</th>
                            <th className="px-4 py-3">Descripcion General</th>
                            <th className="px-4 py-3">Contacto 1</th>
                            <th className="px-4 py-3">Contacto 2</th>
                            <th className="px-4 py-3">Contacto 3</th>
                            <th className="px-4 py-3">Contacto Cierre</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {rows.map((x) => {
                            const causa = selectedCausas[x.chasis] || "Selecciona causa";
                            const raiz = selectedRaices[x.chasis] || "Selecciona raíz";
                            const raizOpciones = opciones_raiz[causa] || [];
                            return (
                                <tr key={x.chasis} onDoubleClick={() => handleRowClick(x)} className="hover:bg-slate-100 cursor-pointer">
                                    <td className="px-4 py-3 font-medium">{x.chasis}</td>
                                    <td className="px-4 py-3">{x.cliente}</td>

                                    {/* Linea */}
                                    <td className="px-4 py-3 relative whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => toggleMenu(x.chasis, "linea")}
                                            className="rounded-2xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-300"
                                        >
                                            {x.linea}
                                        </button>
                                        {openMenus[`${x.chasis}-linea`] && (
                                            <div className="absolute left-0 mt-2 w-40 rounded-xl border border-slate-200 bg-white shadow-lg z-20">
                                                {lineas.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
                                                        onClick={() => {
                                                            x.linea = opt;
                                                            toggleMenu(x.chasis, "linea");
                                                        }}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">{x.expediente}</td>
                                    <td className="px-4 py-3">{x.fecha}</td>
                                    <td className="px-4 py-3">{x.fecha_serv}</td>
                                    <td className="px-4 py-3">{x.fecha_entrega}</td>
                                    <td className="px-4 py-3">{x.fecha_recla}</td>
                                    <td className="px-4 py-3">
                                        <a
                                            href={x.liga}
                                            className="text-blue-600 underline"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Ver liga
                                        </a>
                                    </td>

                                    {/* Origen */}
                                    <td className="px-4 py-3 relative whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => toggleMenu(x.chasis, "origen")}
                                            className="rounded-2xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-300"
                                        >
                                            {x.origen}
                                        </button>
                                        {openMenus[`${x.chasis}-origen`] && (
                                            <div className="absolute left-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg z-20">
                                                {origenes.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
                                                        onClick={() => {
                                                            x.origen = opt;
                                                            toggleMenu(x.chasis, "origen");
                                                        }}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </td>

                                    {/* Estado */}
                                    <td className="px-4 py-3 relative whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => toggleMenu(x.chasis, "estado")}
                                            className="rounded-2xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-300"
                                        >
                                            {x.estado}
                                        </button>
                                        {openMenus[`${x.chasis}-estado`] && (
                                            <div className="absolute left-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg z-20">
                                                {estado.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
                                                        onClick={() => {
                                                            x.estado = opt;
                                                            toggleMenu(x.chasis, "estado");
                                                        }}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">{x.recop}</td>
                                    <td className="px-4 py-3">{x.problema}</td>

                                    {/* Causa */}
                                    <td className="px-4 py-3 relative whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => toggleMenu(x.chasis, "causa")}
                                            className="rounded-2xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-300"
                                        >
                                            {causa}
                                        </button>
                                        {openMenus[`${x.chasis}-causa`] && (
                                            <div className="absolute left-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg z-20">
                                                {causasDisponibles.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        className="block w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
                                                        onClick={() => chooseCausa(x.chasis, opt)}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </td>

                                    {/* Raiz dependiente */}
                                    <td className="px-4 py-3 relative whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => toggleMenu(x.chasis, "raiz")}
                                            className="rounded-2xl bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-300"
                                        >
                                            {raiz}
                                        </button>
                                        {openMenus[`${x.chasis}-raiz`] && (
                                            <div className="absolute left-0 mt-2 w-96 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg z-20">
                                                {raizOpciones.length === 0 ? (
                                                    <div className="px-4 py-2 text-sm text-slate-500">
                                                        Sin opciones para esta causa
                                                    </div>
                                                ) : (
                                                    raizOpciones.map((opt) => (
                                                        <button
                                                            key={opt}
                                                            className="block w-full px-4 py-2 text-sm text-slate-700 text-left hover:bg-slate-200"
                                                            onClick={() => chooseRaiz(x.chasis, opt)}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">{x.descripcion}</td>
                                    <td className="px-4 py-3">{x.contacto1}</td>
                                    <td className="px-4 py-3">{x.contacto2}</td>
                                    <td className="px-4 py-3">{x.contacto3}</td>
                                    <td className="px-4 py-3">{x.contacto_cierre}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


