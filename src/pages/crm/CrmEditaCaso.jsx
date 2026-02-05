import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const opcionesRaiz = {
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
        "Deficiencias en la gestión de la imagen y reputación",
        "Falta de atención a los comentarios y reseñas",
        "Problemas en la gestión de garantías",
        "Falta de ofertas y promociones atractivas",
        "Dificultad para contactar con el servicio al cliente",
        "Horarios de atención limitados",
        "Mal uso de CRM",
        "Problemas en la gestión de reclamaciones y devoluciones"
    ],
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
        "Ineficiencia en la programación de citas",
        "Problemas en la gestión de la información del cliente",
        "Falta de procedimientos de emergencia",
        "Deficiencias en el control de calidad",
        "Falta de auditorías internas periódicas",
        "Problemas en la implementación de sistemas ERP",
        "Deficiencias en la gestión de proyectos",
        "Falta de revisiones periódicas",
        "Procedimientos redundantes",
        "Falta de actualización de manuales operativos",
        "Uso ineficiente de recursos",
        "Falta de un sistema de gestión de calidad total"
    ],
    Materiales: [],
    Infraestructura: [],
    "Talento Humano": []
};

const lineas = ["Ventas", "Servicio", "Usados", "Refacciones", "General"];
const origenes = [
    "JD Power",
    "Whatsapp",
    "Facebook",
    "Encuesta Interna",
    "Reclamacion Verbal",
    "Llamada de Calidad"
];
const estados = ["Nuevo", "En análisis", "En ejecución", "Reclamacion Cerrada", "Cerrado"];
const recopTipos = ["Correo", "Llamada", "Formulario", "Visita", "Otro"];

export default function CrmEditaCaso() {
    const navigate = useNavigate();
    const { chasis } = useParams();
    const { state } = useLocation();

    const initial = state || {
        chasis,
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
        contacto1: "Ana Pérez",
        contacto2: "—",
        contacto3: "—",
        contacto_cierre: "Carlos Ruiz",
        prioridad: "Alta"
    };

    const [form, setForm] = useState(initial);

    const raicesDisponibles = useMemo(
        () => opcionesRaiz[form.causa] || [],
        [form.causa]
    );

    const handleChange = (field, value) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Guardar", form);
        navigate("/crm/casos");
    };

    return (
        <div className="min-h-screen bg-neutral-100">
            <header className="border-b border-white/10 bg-[#131E5C] backdrop-blur sticky top-0 z-30 shadow-lg">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <div className="text-neutral-100">
                        <p className="text-xs uppercase tracking-[0.2em]">
                            Gestión de las Reclamaciones
                        </p>
                        <h1 className="text-2xl font-semibold">Editar caso {form.chasis}</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="rounded-2xl border border-neutral-600 px-4 py-2 text-sm font-semibold bg-neutral-200 text-[#131E5C] hover:bg-white/10"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="form-edita-caso"
                            className="rounded-2xl bg-neutral-200 px-4 py-2 text-sm font-semibold text-[#131E5C] hover:bg-emerald-400"
                        >
                            Guardar cambios
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-10 ">
                <form
                    id="form-edita-caso"
                    onSubmit={handleSubmit}
                    className="space-y-8"
                >
                    {/* Datos generales */}
                    <section className="rounded-3xl border border-white/10 bg-neutral-100 p-6 shadow-lg text-neutral-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Datos generales</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3 text-neutral-900">
                            <Field label="Chasis" disabled value={form.chasis} />
                            <Field
                                label="Cliente"
                                value={form.cliente}
                                onChange={(v) => handleChange("cliente", v)}
                            />
                            <Select
                                label="Línea de negocios"
                                value={form.linea}
                                options={lineas}
                                onChange={(v) => handleChange("linea", v)}
                            />
                            <Field
                                label="OS / Expediente"
                                value={form.expediente}
                                onChange={(v) => handleChange("expediente", v)}
                            />
                            <Field
                                label="Liga de reclamación"
                                value={form.liga}
                                onChange={(v) => handleChange("liga", v)}
                            />
                            <Select
                                label="Estado"
                                value={form.estado}
                                options={estados}
                                onChange={(v) => handleChange("estado", v)}
                            />
                        </div>
                    </section>

                    {/* Fechas y origen */}
                    <section className="rounded-3xl border border-white/10 bg-neutral-100 p-6 shadow-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Fechas y origen</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Field
                                label="Fecha Atencion"
                                type="date"
                                value={form.fecha}
                                onChange={(v) => handleChange("fecha", v)}
                            />
                            <Field
                                label="Fecha reclamación"
                                type="date"
                                value={form.fecha_recla}
                                onChange={(v) => handleChange("fecha_recla", v)}
                            />
                            <Select
                                label="Origen reclamación"
                                value={form.origen}
                                options={origenes}
                                onChange={(v) => handleChange("origen", v)}
                            />
                            <Select
                                label="Recopilación de contactos"
                                value={form.recop}
                                options={recopTipos}
                                onChange={(v) => handleChange("recop", v)}
                            />

                            <Field
                                label="Evidencia"
                                type="file"
                            />
                        </div>
                    </section>

                    {/* Problema, causa, raíz */}
                    <section className="rounded-3xl border border-white/10 bg-neutral-100 p-6 shadow-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Análisis</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field
                                label="Definición del problema"
                                value={form.problema}
                                onChange={(v) => handleChange("problema", v)}
                            />
                            <Select
                                label="Causa"
                                value={form.causa}
                                options={Object.keys(opcionesRaiz)}
                                onChange={(v) => handleChange("causa", v)}
                            />
                            <Select
                                label="Raíz"
                                value={form.raiz}
                                options={raicesDisponibles}
                                placeholder={
                                    raicesDisponibles.length ? "Selecciona" : "Sin opciones"
                                }
                                onChange={(v) => handleChange("raiz", v)}
                            />
                            <Textarea
                                label="Descripción general"
                                value={form.descripcion}
                                onChange={(v) => handleChange("descripcion", v)}
                            />
                        </div>
                    </section>

                    {/* Contactos */}
                    <section className="rounded-3xl border border-white/10 bg-neutral-100 p-6 shadow-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Contactos</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field
                                label="Contacto 1"
                                value={form.contacto1}
                                onChange={(v) => handleChange("contacto1", v)}
                            />
                            <Field
                                label="Contacto 2"
                                value={form.contacto2}
                                onChange={(v) => handleChange("contacto2", v)}
                            />
                            <Field
                                label="Contacto 3"
                                value={form.contacto3}
                                onChange={(v) => handleChange("contacto3", v)}
                            />
                            <Field
                                label="Contacto cierre"
                                value={form.contacto_cierre}
                                onChange={(v) => handleChange("contacto_cierre", v)}
                            />
                        </div>
                    </section>
                </form>
            </main>
        </div>
    );
}

function Field({ label, value, onChange, type = "text", disabled = false }) {
    return (
        <label className="space-y-1 text-sm text-slate-200">
            <span className="block text-xs uppercase tracking-wide text-slate-400">
                {label}
            </span>
            <input
                type={type}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange && onChange(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 shadow-sm bg-white/10 px-3 py-2 text-sm text-neutral-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-white/5"
            />
        </label>
    );
}

function Select({ label, value, options, onChange, placeholder = "Selecciona" }) {
    return (
        <label className="space-y-1 text-sm text-slate-200">
            <span className="block text-xs uppercase tracking-wide text-slate-400">
                {label}
            </span>
            <select
                value={value || ""}
                onChange={(e) => onChange && onChange(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 shadow-sm bg-white/10 px-3 py-2 text-sm text-neutral-800 focus:border-emerald-400 focus:outline-none"
            >
                <option value="">{placeholder}</option>
                {options.map((o) => (
                    <option key={o} value={o} className="text-slate-900">
                        {o}
                    </option>
                ))}
            </select>
        </label>
    );
}

function Textarea({ label, value, onChange }) {
    return (
        <label className="space-y-1 text-sm text-slate-200 md:col-span-2">
            <span className="block text-xs uppercase tracking-wide text-slate-400">
                {label}
            </span>
            <textarea
                rows={4}
                value={value}
                onChange={(e) => onChange && onChange(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 shadow-sm bg-white/10 px-3 py-2 text-sm text-neutral-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
            />
        </label>
    );
}
