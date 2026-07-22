// src/components/Topbar.jsx
import React, { useState } from "react";
import { UserCircle2, CirclePower, Mailbox, X, Bug, Lightbulb } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import ClickupNotificationsBell from "./ClickupNotificationsBell";
import { apiClickup } from "../lib/apiClickup";

function IconBtn({ onClick, className = "", title, children, rightText }) {
    return (
        <button
            onClick={onClick}
            title={title}
            aria-label={title}
            className={[
                "inline-flex items-center justify-center gap-2",
                "rounded-2xl border border-slate-200 bg-white",
                "h-10 px-3",
                "transition active:scale-[0.98] hover:shadow-sm",
                className,
            ].join(" ")}
        >
            {children}
            {rightText ? <span className="hidden lg:inline text-sm font-semibold">{rightText}</span> : null}
        </button>
    );
}

export default function Topbar() {
    const { logout, hasAnyPermission } = useAuth();
    const navigate = useNavigate();

    const canSeeSettings = hasAnyPermission(["USUARIOS_ADMIN"]);

    const [openBugModal, setOpenBugModal] = useState(false);
    const [tipoReporte, setTipoReporte] = useState("BUG");
    const [titulo, setTitulo] = useState("");
    const [descripcionBug, setDescripcionBug] = useState("");
    const [imagenes, setImagenes] = useState([]);
    const [saving, setSaving] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const handleFilesChange = (e) => {
        const files = Array.from(e.target.files || []);
        setImagenes(files);
    };

    const resetForm = () => {
        setTipoReporte("BUG");
        setTitulo("");
        setDescripcionBug("");
        setImagenes([]);
    };

    const handleSubmitBug = async (e) => {
        e.preventDefault();

        if (!titulo.trim() || !descripcionBug.trim()) return;

        setSaving(true);
        try {
            await apiClickup.createReport({
                tipo: tipoReporte,
                titulo,
                descripcion: descripcionBug,
                imagenes,
            });

            resetForm();
            setOpenBugModal(false);
            window.dispatchEvent(new Event("clickup:refresh"));
            alert("Reporte enviado correctamente. Se creó una tarea en ClickUp.");
        } catch (error) {
            alert(error.message || "No se pudo enviar el reporte.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
                <div className="flex items-center justify-end gap-2 px-4 py-3 md:px-6 lg:px-8">
                    <ClickupNotificationsBell />

                    <IconBtn
                        onClick={() => setOpenBugModal(true)}
                        title="Sugerencias y errores"
                        className="text-blue-500 hover:bg-blue-600 hover:text-slate-50"
                        rightText="Sugerencias y errores"
                    >
                        <Mailbox size={18} />
                    </IconBtn>

                    <IconBtn
                        onClick={handleLogout}
                        title="Cerrar sesión"
                        className="text-red-500 hover:bg-red-600 hover:text-slate-50"
                        rightText="Cerrar sesión"
                    >
                        <CirclePower size={18} />
                    </IconBtn>

                    {canSeeSettings ? (
                        <Link
                            to="/configuracion"
                            title="Usuarios"
                            aria-label="Usuarios"
                            className={[
                                "inline-flex items-center justify-center gap-2",
                                "rounded-2xl border border-slate-200 bg-white",
                                "h-10 px-3",
                                "transition active:scale-[0.98] hover:bg-slate-200 hover:text-[#131E5C] hover:shadow-sm",
                            ].join(" ")}
                        >
                            <UserCircle2 size={18} />
                            <span className="hidden lg:inline text-sm font-semibold">Usuarios</span>
                        </Link>
                    ) : null}
                </div>
            </header>

            {openBugModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setOpenBugModal(false)}
                >
                    <div
                        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800">Reportar error o sugerencia</h2>
                            <button
                                onClick={() => setOpenBugModal(false)}
                                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                                aria-label="Cerrar"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitBug} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTipoReporte("BUG")}
                                        className={[
                                            "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                                            tipoReporte === "BUG"
                                                ? "border-red-300 bg-red-50 text-red-700"
                                                : "border-slate-300 bg-white text-slate-700"
                                        ].join(" ")}
                                    >
                                        <Bug size={16} />
                                        Error
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTipoReporte("SUGGESTION")}
                                        className={[
                                            "flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold",
                                            tipoReporte === "SUGGESTION"
                                                ? "border-amber-300 bg-amber-50 text-amber-700"
                                                : "border-slate-300 bg-white text-slate-700"
                                        ].join(" ")}
                                    >
                                        <Lightbulb size={16} />
                                        Sugerencia
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
                                <input
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ej: El modal de clientes no guarda"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
                                <textarea
                                    value={descripcionBug}
                                    onChange={(e) => setDescripcionBug(e.target.value)}
                                    rows={5}
                                    placeholder="Describe el problema, pasos para reproducirlo, resultado actual y resultado esperado."
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Evidencias iniciales
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.txt,.mp4"
                                    multiple
                                    onChange={handleFilesChange}
                                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
                                />
                                {imagenes.length > 0 ? (
                                    <p className="mt-2 text-xs text-slate-500">
                                        {imagenes.length} archivo(s) seleccionado(s)
                                    </p>
                                ) : null}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOpenBugModal(false)}
                                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !titulo.trim() || !descripcionBug.trim()}
                                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {saving ? "Enviando..." : "Enviar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}