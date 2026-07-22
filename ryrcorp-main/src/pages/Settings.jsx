// src/pages/Settings.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    ArrowLeft, Users, Plus, RefreshCw, Upload, Eye, EyeOff,
    Building2, ChevronDown, Pencil, Save, AtSign, Mail,
    User, Lock, Briefcase
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
const DEALERS = ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
    { bg: "#e0e7ff", text: "#3730a3" },
    { bg: "#d1fae5", text: "#065f46" },
    { bg: "#fef3c7", text: "#92400e" },
    { bg: "#fce7f3", text: "#9d174d" },
    { bg: "#e0f2fe", text: "#0369a1" },
];

function getInitials(u) {
    return ((u.nombre?.[0] ?? "") + (u.apellidos?.[0] ?? "")).toUpperCase();
}

function getAvatarColor(id) {
    return AVATAR_COLORS[(id ?? 0) % AVATAR_COLORS.length];
}

// ─── Estilos base ─────────────────────────────────────────────────────────────
const inputBase = (err) => ({
    width: "100%",
    padding: "9px 12px",
    border: `1px solid ${err ? "#fca5a5" : "#e2e8f0"}`,
    borderRadius: 10,
    fontSize: 13,
    color: "#0f172a",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
});

// ─── Componentes de formulario ────────────────────────────────────────────────
function FLabel({ children }) {
    return (
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
            {children}
        </span>
    );
}

function FInput({ label, value, onChange, type = "text", placeholder, disabled = false, error }) {
    return (
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <FLabel>{label}</FLabel>
            <input
                type={type} value={value} onChange={onChange}
                placeholder={placeholder} disabled={disabled}
                style={{
                    ...inputBase(error),
                    background: disabled ? "#f8fafc" : "#fff",
                    opacity: disabled ? 0.65 : 1,
                    cursor: disabled ? "not-allowed" : "text",
                }}
                onFocus={e => {
                    if (disabled) return;
                    e.target.style.borderColor = "#131E5C";
                    e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)";
                }}
                onBlur={e => {
                    e.target.style.borderColor = error ? "#fca5a5" : "#e2e8f0";
                    e.target.style.boxShadow = "none";
                }}
            />
            {error && <span style={{ fontSize: 11, color: "#ef4444" }}>{error}</span>}
        </label>
    );
}

function FSelect({ label, value, onChange, children }) {
    return (
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <FLabel>{label}</FLabel>
            <select
                value={value} onChange={onChange}
                style={{ ...inputBase(), cursor: "pointer", appearance: "auto" }}
                onFocus={e => { e.target.style.borderColor = "#131E5C"; e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)"; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            >
                {children}
            </select>
        </label>
    );
}

// ─── Checkbox de agencia (estilo original) ────────────────────────────────────
function AgencyCheck({ label, checked, onChange }) {
    return (
        <label
            style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                border: "1px solid #e2e8f0",
                background: checked ? "#f0f4ff" : "#f8fafc",
                transition: "background 0.12s, border-color 0.12s",
                borderColor: checked ? "#c7d2fe" : "#e2e8f0",
            }}
        >
            <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 15, height: 15, accentColor: "#131E5C", cursor: "pointer" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{label}</span>
        </label>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = 32 }) {
    const color = getAvatarColor(user.id);
    if (user.foto_url || user.photo) {
        return <img src={user.foto_url || user.photo} alt={user.nombre} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: color.bg, color: color.text,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.36, fontWeight: 700, flexShrink: 0,
        }}>
            {getInitials(user)}
        </div>
    );
}

// ─── Badges ───────────────────────────────────────────────────────────────────
const ROLE_MAP = {
    Administrador: { bg: "#ede9fe", color: "#5b21b6" },
    Gerente: { bg: "#fef3c7", color: "#92400e" },
    Vendedor: { bg: "#d1fae5", color: "#065f46" },
};

function RoleBadge({ rol }) {
    const s = ROLE_MAP[rol] ?? ROLE_MAP.Vendedor;
    return (
        <span style={{ background: s.bg, color: s.color, fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>
            {rol}
        </span>
    );
}

function StatusPill({ estado }) {
    const ok = estado === "Activo";
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: ok ? "#dcfce7" : "#fee2e2",
            color: ok ? "#15803d" : "#b91c1c",
            fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600,
        }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: ok ? "#16a34a" : "#dc2626" }} />
            {estado}
        </span>
    );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function ModalDivider({ label }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 14px" }}>
            <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em" }}>{label}</span>
            <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
        </div>
    );
}

function UserModal({ user, roles, token, onClose, onSaved }) {
    const isNew = !user?.id;
    const [form, setForm] = useState({
        nombre: user?.nombre ?? "", apellidos: user?.apellidos ?? "",
        usuario: user?.usuario ?? "", correo: user?.correo ?? "",
        id_rol: user?.id_rol ?? "", estado: user?.estado ?? "Activo",
        agencies: user?.agencies ?? [],
    });
    const [foto, setFoto] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(user?.foto_url ?? null);
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [showP, setShowP] = useState(false);
    const [showP2, setShowP2] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Animación de entrada
        requestAnimationFrame(() => setVisible(true));
    }, []);

    function handleClose() {
        setVisible(false);
        setTimeout(onClose, 280);
    }

    function set(field, val) {
        setForm(f => ({ ...f, [field]: val }));
        setErrors(e => ({ ...e, [field]: undefined }));
    }

    function toggleAgency(ag) {
        set("agencies", form.agencies.includes(ag)
            ? form.agencies.filter(a => a !== ag)
            : [...form.agencies, ag]);
    }

    function handleFoto(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFoto(file);
        setFotoPreview(URL.createObjectURL(file));
    }

    function validate() {
        const errs = {};
        if (!form.nombre.trim()) errs.nombre = "Requerido";
        if (!form.apellidos.trim()) errs.apellidos = "Requerido";
        if (!form.usuario.trim()) errs.usuario = "Requerido";
        if (!form.correo.trim()) errs.correo = "Requerido";
        if (password && password !== password2) errs.password2 = "Las contraseñas no coinciden";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSave() {
        if (!validate()) return;
        setLoading(true); setMsg("");
        const fd = new FormData();
        fd.append("nombre", form.nombre); fd.append("apellidos", form.apellidos);
        fd.append("usuario", form.usuario); fd.append("correo", form.correo);
        fd.append("id_rol", form.id_rol); fd.append("estado", form.estado);
        fd.append("agencia", form.agencies.join("|"));
        if (password) fd.append("contrasena", password);
        if (foto) fd.append("foto", foto);
        try {
            const url = isNew
                ? `${API}/conformidad/api/admin/usuarios/`
                : `${API}/conformidad/api/admin/usuarios/${user.id}/`;
            const res = await fetch(url, {
                method: isNew ? "POST" : "PATCH",
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const errores = data?.errors || data;
                let mensaje = data?.detail || "No se pudo guardar.";
                if (errores && typeof errores === "object") {
                    const partes = [];
                    for (const [campo, valor] of Object.entries(errores))
                        partes.push(`${campo}: ${Array.isArray(valor) ? valor.join(", ") : valor}`);
                    if (partes.length) mensaje = partes.join(" | ");
                }
                throw new Error(mensaje);
            }
            setMsg(isNew ? "✓ Usuario creado" : "✓ Cambios guardados");
            setTimeout(() => { onSaved(); handleClose(); }, 900);
        } catch (err) {
            setMsg(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    const previewUser = { ...user, ...form, foto_url: fotoPreview, id: user?.id ?? 0 };
    const color = getAvatarColor(user?.id ?? 0);

    return (
        <>
            {/* Overlay semitransparente */}
            <div
                onClick={handleClose}
                style={{
                    position: "fixed", inset: 0,
                    background: "rgba(15, 23, 42, 0.3)",
                    backdropFilter: "blur(2px)",
                    zIndex: 200,
                    opacity: visible ? 1 : 0,
                    transition: "opacity 0.28s ease",
                }}
            />

            {/* Panel lateral derecho */}
            <div style={{
                position: "fixed", top: 0, right: 0, bottom: 0,
                width: 420,
                background: "#fff",
                zIndex: 201,
                display: "flex", flexDirection: "column",
                boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
                transform: visible ? "translateX(0)" : "translateX(100%)",
                transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
            }}>

                {/* Header con avatar grande */}
                <div style={{
                    background: "linear-gradient(135deg, #131E5C 0%, #1a2d8a 100%)",
                    padding: "20px 20px 24px",
                    position: "relative",
                    flexShrink: 0,
                }}>
                    {/* Botón cerrar */}
                    <button onClick={handleClose} style={{
                        position: "absolute", top: 14, right: 14,
                        width: 30, height: 30, borderRadius: 8,
                        background: "rgba(255,255,255,0.15)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        cursor: "pointer", color: "#fff", fontSize: 14,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>✕</button>

                    {/* Avatar + nombre */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ position: "relative" }}>
                            <Avatar user={previewUser} size={58} />
                            <label style={{
                                position: "absolute", bottom: 0, right: 0,
                                width: 20, height: 20, borderRadius: "50%",
                                background: "#4f46e5", border: "2px solid #fff",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Upload size={9} color="#fff" />
                                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFoto} />
                            </label>
                        </div>
                        <div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 2px" }}>
                                {form.nombre || "Nombre"} {form.apellidos}
                            </p>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "0 0 6px" }}>
                                @{form.usuario || "usuario"}
                            </p>
                            <div style={{ display: "flex", gap: 6 }}>
                                <span style={{
                                    fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600,
                                    background: form.estado === "Activo" ? "#dcfce7" : "#fee2e2",
                                    color: form.estado === "Activo" ? "#15803d" : "#b91c1c",
                                }}>
                                    {form.estado}
                                </span>
                                {roles.find(r => String(r.id_rol) === String(form.id_rol)) && (
                                    <span style={{
                                        fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600,
                                        background: "rgba(255,255,255,0.15)", color: "#e0e7ff",
                                    }}>
                                        {roles.find(r => String(r.id_rol) === String(form.id_rol))?.nombre}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenido scrollable */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

                    {/* Datos personales */}
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", margin: "0 0 12px", textTransform: "uppercase" }}>Datos personales</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                        <FInput label="Nombre(s)" error={errors.nombre} value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Nombre(s)" />
                        <FInput label="Apellidos" error={errors.apellidos} value={form.apellidos} onChange={e => set("apellidos", e.target.value)} placeholder="Apellidos" />
                        <FInput label="Usuario" error={errors.usuario} value={form.usuario} onChange={e => set("usuario", e.target.value)} placeholder="usuario" />
                        <FInput label="Correo" error={errors.correo} type="email" value={form.correo} onChange={e => set("correo", e.target.value)} placeholder="correo@ejemplo.com" />
                    </div>

                    {/* Rol y Estado */}
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", margin: "0 0 12px", textTransform: "uppercase" }}>Rol y estado</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                        <FSelect label="Rol" value={form.id_rol} onChange={e => set("id_rol", e.target.value)}>
                            <option value="">Selecciona rol...</option>
                            {roles.map(r => <option key={r.id_rol} value={String(r.id_rol)}>{r.nombre}</option>)}
                        </FSelect>
                        <FSelect label="Estado" value={form.estado} onChange={e => set("estado", e.target.value)}>
                            <option>Activo</option><option>Inactivo</option>
                        </FSelect>
                    </div>

                    {/* Contraseña */}
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", margin: "0 0 12px", textTransform: "uppercase" }}>Cambiar contraseña</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                        {[[" Nueva contraseña", password, setPassword, showP, setShowP, "Dejar vacío", null],
                        ["Confirmar", password2, setPassword2, showP2, setShowP2, "Repetir", errors.password2]
                        ].map(([label, val, setVal, show, setShow, ph, err]) => (
                            <label key={label} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                <FLabel>{label}</FLabel>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type={show ? "text" : "password"} value={val}
                                        onChange={e => setVal(e.target.value)} placeholder={ph}
                                        style={{ ...inputBase(err), paddingRight: 36 }}
                                        onFocus={e => { e.target.style.borderColor = "#131E5C"; e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)"; }}
                                        onBlur={e => { e.target.style.borderColor = err ? "#fca5a5" : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                                    />
                                    <button type="button" onClick={() => setShow(v => !v)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                                        {show ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                </div>
                                {err && <span style={{ fontSize: 11, color: "#ef4444" }}>{err}</span>}
                            </label>
                        ))}
                    </div>

                    {/* Agencias */}
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", margin: "0 0 12px", textTransform: "uppercase" }}>Agencias asignadas</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                        {DEALERS.map(ag => (
                            <AgencyCheck key={ag} label={ag} checked={form.agencies.includes(ag)} onChange={() => toggleAgency(ag)} />
                        ))}
                    </div>
                </div>

                {/* Footer fijo */}
                <div style={{
                    padding: "14px 20px", borderTop: "1px solid #f1f5f9",
                    background: "#fff", flexShrink: 0,
                    display: "flex", flexDirection: "column", gap: 10,
                }}>
                    {msg && (
                        <div style={{
                            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, textAlign: "center",
                            background: msg.startsWith("✓") ? "#dcfce7" : "#fee2e2",
                            color: msg.startsWith("✓") ? "#15803d" : "#b91c1c",
                        }}>
                            {msg}
                        </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={handleClose} style={{
                            flex: 1, padding: "10px", borderRadius: 9, fontSize: 13,
                            cursor: "pointer", border: "1px solid #e2e8f0",
                            background: "#fff", color: "#374151", fontWeight: 500,
                        }}>
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={loading} style={{
                            flex: 2, padding: "10px", borderRadius: 9, fontSize: 13,
                            cursor: loading ? "not-allowed" : "pointer", border: "none",
                            background: loading ? "#94a3b8" : "#131E5C",
                            color: "#fff", fontWeight: 600,
                        }}>
                            {loading ? "Guardando..." : (isNew ? "Crear usuario" : "Guardar cambios")}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── TABLA POR AGENCIA ────────────────────────────────────────────────────────
function AgencyBlock({ agency, users, onEdit }) {
    const [open, setOpen] = useState(true);
    const agUsers = users.filter(u => {
        const agencias = Array.isArray(u.agencies) ? u.agencies : String(u.agencia || "").split("|");
        return agencias.some(a => a.trim() === agency);
    });

    return (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", marginBottom: 10, background: "#fff" }}>
            <div
                onClick={() => setOpen(v => !v)}
                style={{ padding: "11px 18px", background: "#131E5C", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Building2 size={13} color="#fff" />
                    </div>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{agency}</span>
                    <span style={{ background: "rgba(255,255,255,0.15)", color: "#e0e7ff", fontSize: 11, padding: "1px 9px", borderRadius: 20, fontWeight: 500 }}>
                        {agUsers.length} {agUsers.length === 1 ? "usuario" : "usuarios"}
                    </span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <ChevronDown size={15} />
                </div>
            </div>

            {open && (
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#fafafa" }}>
                                {["", "Nombre", "Usuario", "Rol", "Estado", "Correo"].map((h, i) => (
                                    <th key={i} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {agUsers.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "#94a3b8" }}>Sin usuarios en esta agencia</td></tr>
                            ) : agUsers.map((u, idx) => (
                                <tr
                                    key={u.id}
                                    onDoubleClick={() => onEdit(u)}
                                    style={{ borderBottom: idx < agUsers.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.1s", cursor: "pointer" }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                                >
                                    <td style={{ padding: "10px 14px" }}><Avatar user={u} size={32} /></td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{u.nombre} {u.apellidos}</span>
                                    </td>
                                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b" }}>@{u.usuario}</td>
                                    <td style={{ padding: "10px 14px" }}><RoleBadge rol={u.rol || u.nombre_rol} /></td>
                                    <td style={{ padding: "10px 14px" }}><StatusPill estado={u.estado || "Activo"} /></td>
                                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.correo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
function FilterSelect({ label, value, onChange, options }) {
    return (
        <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {label}
            </span>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{ ...inputBase(), cursor: "pointer", minWidth: 160, background: "#fff" }}
            >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </label>
    );
}

// ─── TABLA ÚNICA (reemplaza las 5 tablas por agencia) ─────────────────────────
function UsersTableUnificada({ users, onEdit }) {
    return (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#fafafa" }}>
                            {["", "Nombre", "Usuario", "Agencia", "Rol", "Estado", "Correo"].map((h, i) => (
                                <th key={i} style={{ padding: "8px 14px", textAlign: "left", fontSize: 11, color: "#94a3b8", fontWeight: 600, borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "#94a3b8" }}>
                                    Sin usuarios que coincidan con los filtros
                                </td>
                            </tr>
                        ) : users.map((u, idx) => (
                            <tr
                                key={u.id}
                                onDoubleClick={() => onEdit(u)}
                                style={{ borderBottom: idx < users.length - 1 ? "1px solid #f8fafc" : "none", cursor: "pointer" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                                onMouseLeave={e => (e.currentTarget.style.background = "")}
                            >
                                <td style={{ padding: "10px 14px" }}><Avatar user={u} size={32} /></td>
                                <td style={{ padding: "10px 14px" }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{u.nombre} {u.apellidos}</span>
                                </td>
                                <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b" }}>@{u.usuario}</td>
                                <td style={{ padding: "10px 14px", fontSize: 12, color: "#374151" }}>
                                    {(u.agencies || []).join(", ")}
                                </td>
                                <td style={{ padding: "10px 14px" }}><RoleBadge rol={u.rol || u.nombre_rol} /></td>
                                <td style={{ padding: "10px 14px" }}><StatusPill estado={u.estado || "Activo"} /></td>
                                <td style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {u.correo}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ─── PERFIL USUARIO NORMAL ────────────────────────────────────────────────────
function PerfilUsuario({ token, user }) {
    // TEMPORAL - ver estructura del objeto user
    console.log("=== USER KEYS:", Object.keys(user || {}));
    console.log("=== USER JSON:", JSON.stringify(user));
    // ... resto del componente
    const [formData, setFormData] = useState({
        nombre: user?.nombre || "",
        apellidos: user?.apellidos || "",
        usuario: user?.usuario || "",
        correo: user?.correo || "",
        telefono: user?.telefono || "",
    });
    const [foto, setFoto] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(user?.foto_url || "");
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    // Estado para cambio de contraseña
    const [showPassModal, setShowPassModal] = useState(false);
    const [passForm, setPassForm] = useState({ actual: "", nueva: "", confirmar: "" });
    const [showPass, setShowPass] = useState({ actual: false, nueva: false, confirmar: false });
    const [passMsg, setPassMsg] = useState("");
    const [passLoading, setPassLoading] = useState(false);

    const initials = ((user?.nombre?.[0] ?? "") + (user?.apellidos?.[0] ?? "")).toUpperCase();
    const avatarColor = AVATAR_COLORS[(user?.id ?? 0) % AVATAR_COLORS.length];
    const miembroDesde = user?.date_joined
        ? new Date(user.date_joined).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
        : "—";

    const guardarCambios = async () => {
        setLoading(true); setMsg("");

        const userId = user?.id_usuario;
        if (!userId) {
            setMsg(`Error: ID no encontrado. Campos disponibles: ${Object.keys(user || {}).join(", ")}`);
            setLoading(false);
            return;
        }

        const fd = new FormData();
        fd.append("nombre", formData.nombre);
        fd.append("apellidos", formData.apellidos);
        fd.append("usuario", formData.usuario);
        fd.append("correo", formData.correo);
        if (formData.telefono) fd.append("telefono", formData.telefono);
        if (foto) fd.append("foto", foto);

        try {
            const res = await fetch(`${API}/conformidad/api/perfil/`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const responseText = await res.text();
            if (res.ok) {
                setMsg("✓ Datos actualizados correctamente");
                setFoto(null);

                // Vuelve a pedir los datos actualizados del usuario (incluye la foto nueva)
                try {
                    const meRes = await fetch(`${API}/conformidad/api/auth/me/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (meRes.ok) {
                        const updatedUser = await meRes.json();
                        localStorage.setItem("crm.user", JSON.stringify(updatedUser));
                        localStorage.setItem("user", JSON.stringify(updatedUser));
                        const auth = JSON.parse(localStorage.getItem("auth") || "{}");
                        localStorage.setItem("auth", JSON.stringify({ ...auth, user: updatedUser }));
                    }
                } catch (e) {
                    console.error("Error refrescando usuario:", e);
                }

                setTimeout(() => window.location.reload(), 800);
            } else {
                let err = {};
                try { err = JSON.parse(responseText); } catch { }
                setMsg(`Error: ${err.detail || responseText || "No se pudo actualizar"}`);
            }
        } catch (e) {
            setMsg("Error de conexión");
        } finally {
            setLoading(false);
            setTimeout(() => setMsg(""), 6000);
        }
    };
    const cambiarContrasena = async () => {
        if (passForm.nueva.length < 8) return setPassMsg("Mínimo 8 caracteres.");
        if (!/[A-Z]/.test(passForm.nueva)) return setPassMsg("Agrega al menos una mayúscula.");
        if (!/[0-9]/.test(passForm.nueva)) return setPassMsg("Agrega al menos un número.");
        if (!/[^A-Za-z0-9]/.test(passForm.nueva)) return setPassMsg("Agrega al menos un símbolo.");
        if (passForm.nueva !== passForm.confirmar) return setPassMsg("Las contraseñas no coinciden.");

        setPassLoading(true); setPassMsg("");
        const fd = new FormData();
        fd.append("contrasena", passForm.nueva);
        try {
            const res = await fetch(`${API}/conformidad/api/admin/usuarios/${userId}/`, {
                method: "PUT",  // ← cambia PATCH por PUT
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (res.ok) {
                setPassMsg("✓ Contraseña actualizada correctamente");
                setPassForm({ nueva: "", confirmar: "" });
                setTimeout(() => { setShowPassModal(false); setPassMsg(""); }, 1200);
            } else {
                const err = await res.json().catch(() => ({}));
                setPassMsg(`Error: ${err.detail || "No se pudo cambiar"}`);
            }
        } catch { setPassMsg("Error de conexión"); }
        finally { setPassLoading(false); }
    };

    return (
        <div style={{ maxWidth: 1500, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, sans-serif" }}>
            {/* Header perfil */}
            {/* Header perfil */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 20 }}>
                <div style={{ height: 80, background: "linear-gradient(135deg, #131E5C 0%, #1a2d8a 100%)", position: "relative" }}>
                    {/* Círculos decorativos */}
                    <div style={{ position: "absolute", right: 160, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                    <div style={{ position: "absolute", right: 60, top: 10, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                </div>
                <div style={{ padding: "0 28px 24px" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
                        {/* Avatar — muestra foto si existe */}
                        <div style={{ position: "relative", marginTop: -40 }}>
                            <label style={{ cursor: "pointer", display: "block" }}>
                                {(fotoPreview && fotoPreview !== "") ? (<img
                                    src={fotoPreview || user.foto_url}
                                    style={{ width: 88, height: 88, borderRadius: "50%", border: "4px solid #fff", objectFit: "cover", display: "block", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                                    alt="foto de perfil"
                                />
                                ) : (
                                    <div style={{ width: 88, height: 88, borderRadius: "50%", border: "4px solid #fff", background: avatarColor.bg, color: avatarColor.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
                                        {initials}
                                    </div>
                                )}
                                {/* Botón cámara */}
                                <div style={{ position: "absolute", bottom: 2, right: 2, width: 28, height: 28, borderRadius: "50%", background: "#131E5C", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Upload size={12} color="#fff" />
                                </div>
                                <input type="file" accept="image/*" style={{ display: "none" }}
                                    onChange={e => { const f = e.target.files[0]; if (f) { setFoto(f); setFotoPreview(URL.createObjectURL(f)); } }} />
                            </label>
                        </div>

                        {/* Info nombre */}
                        <div style={{ flex: 1, marginLeft: 18, paddingTop: 10 }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                                {formData.nombre} {formData.apellidos}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5, flexWrap: "wrap" }}>
                                <span style={{ background: "#ede9fe", color: "#5b21b6", fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>
                                    {user?.rol || user?.nombre_rol || "Usuario"}
                                </span>
                                {user?.agencia && (
                                    <span style={{ fontSize: 12, color: "#64748b" }}>
                                        Agencia asignada: <strong>{user.agencia}</strong>
                                    </span>
                                )}
                                {miembroDesde !== "—" && (
                                    <span style={{ fontSize: 12, color: "#64748b" }}>
                                        Miembro desde: <strong>{miembroDesde}</strong>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido principal — dos columnas */}
            {/* Contenido principal */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
                {/* Columna izquierda */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Información personal */}
                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "24px 28px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Información personal</div>
                                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Actualiza tus datos personales y de contacto.</div>
                            </div>
                            <button onClick={guardarCambios} disabled={loading}
                                style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: loading ? "#94a3b8" : "#131E5C", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                <Save size={14} />
                                {loading ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            {[
                                ["Nombre(s)", "nombre", "text", "Reynaldo"],
                                ["Apellidos", "apellidos", "text", "Vallejo"],
                                ["Usuario", "usuario", "text", "rey"],
                                ["Correo electrónico", "correo", "email", "correo@gmail.com"],
                                ["Teléfono", "telefono", "tel", "5512345678"],
                            ].map(([label, field, type, ph]) => (
                                <div key={field} style={field === "telefono" ? { gridColumn: "1 / -1" } : {}}>
                                    <FLabel>{label}</FLabel>
                                    <input type={type} value={formData[field]}
                                        onChange={e => setFormData(p => ({ ...p, [field]: e.target.value }))}
                                        placeholder={ph}
                                        style={{ ...inputBase(false), marginTop: 6 }}
                                        onFocus={e => { e.target.style.borderColor = "#131E5C"; e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)"; }}
                                        onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                                    />
                                </div>
                            ))}

                            {/* Foto de perfil */}
                            <div style={{ gridColumn: "1 / -1" }}>
                                <FLabel>Foto de perfil <span style={{ color: "#94a3b8", fontWeight: 400 }}>(opcional)</span></FLabel>
                                <label style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, padding: "12px 18px", borderRadius: 12, border: "1px dashed #c7d2fe", background: "#f8faff", cursor: "pointer" }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Upload size={16} color="#131E5C" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0 }}>
                                            {foto ? foto.name : "Arrastra una imagen o haz clic para seleccionar"}
                                        </p>
                                        <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>JPG, PNG o WEBP. Máx. 2MB</p>
                                    </div>
                                    <input type="file" accept="image/*" style={{ display: "none" }}
                                        onChange={e => { const f = e.target.files[0]; if (f) { setFoto(f); setFotoPreview(URL.createObjectURL(f)); } }} />
                                </label>
                            </div>
                        </div>

                        {msg && (
                            <div style={{ marginTop: 14, padding: "8px 14px", borderRadius: 8, background: msg.startsWith("✓") ? "#dcfce7" : "#fee2e2", color: msg.startsWith("✓") ? "#15803d" : "#b91c1c", fontSize: 12, fontWeight: 500, textAlign: "center" }}>
                                {msg}
                            </div>
                        )}
                        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 12 }}>Al guardar cambios, tu información se actualizará en todo el sistema.</p>
                    </div>

                </div>

                {/* Columna derecha — Seguridad */}
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "24px 24px" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Seguridad y acceso</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>Administra tu contraseña.</div>

                    {/* Cambiar contraseña */}
                    <div style={{ padding: "16px", borderRadius: 12, border: "1px solid #f1f5f9", background: "#fafafa", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: "#eff2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Lock size={16} color="#131E5C" />
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Cambiar contraseña</div>
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>Te recomendamos cambiarla periódicamente.</div>
                            </div>
                        </div>
                        <button onClick={() => setShowPassModal(true)}
                            style={{ width: "100%", padding: "9px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#131E5C", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            Cambiar contraseña
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal cambiar contraseña */}
            {showPassModal && (
                <div onClick={e => e.target === e.currentTarget && setShowPassModal(false)}
                    style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "1rem" }}>
                    <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, boxShadow: "0 25px 50px rgba(0,0,0,0.15)", overflow: "hidden" }}>

                        {/* Header */}
                        <div style={{ padding: "16px 20px", background: "#131E5C", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Lock size={15} color="#fff" />
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Cambiar contraseña</span>
                            </div>
                            <button onClick={() => { setShowPassModal(false); setPassForm({ nueva: "", confirmar: "" }); setPassMsg(""); }}
                                style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                ✕
                            </button>
                        </div>

                        <div style={{ padding: "24px 20px" }}>

                            {/* Campo nueva contraseña */}
                            <div style={{ marginBottom: 8 }}>
                                <FLabel>Nueva contraseña</FLabel>
                                <div style={{ position: "relative", marginTop: 6 }}>
                                    <input
                                        type={showPass.nueva ? "text" : "password"}
                                        value={passForm.nueva}
                                        onChange={e => setPassForm(p => ({ ...p, nueva: e.target.value }))}
                                        placeholder="Crea una contraseña segura"
                                        style={{ ...inputBase(false), paddingRight: 36 }}
                                        onFocus={e => { e.target.style.borderColor = "#131E5C"; e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)"; }}
                                        onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                                    />
                                    <button type="button" onClick={() => setShowPass(p => ({ ...p, nueva: !p.nueva }))}
                                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                                        {showPass.nueva ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>

                            {/* Requisitos en tiempo real */}
                            {passForm.nueva.length > 0 && (() => {
                                const requisitos = [
                                    { label: "Mínimo 8 caracteres", ok: passForm.nueva.length >= 8 },
                                    { label: "Al menos una letra mayúscula (A-Z)", ok: /[A-Z]/.test(passForm.nueva) },
                                    { label: "Al menos un número (0-9)", ok: /[0-9]/.test(passForm.nueva) },
                                    { label: "Al menos un símbolo (!@#$%...)", ok: /[^A-Za-z0-9]/.test(passForm.nueva) },
                                ];
                                const cumplidos = requisitos.filter(r => r.ok).length;
                                const porcentaje = (cumplidos / requisitos.length) * 100;
                                const fortaleza = cumplidos <= 1 ? { label: "Muy débil", color: "#ef4444" }
                                    : cumplidos === 2 ? { label: "Débil", color: "#f97316" }
                                        : cumplidos === 3 ? { label: "Buena", color: "#eab308" }
                                            : { label: "Fuerte", color: "#22c55e" };

                                return (
                                    <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                                        {/* Barra de fortaleza */}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Fortaleza</span>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: fortaleza.color }}>{fortaleza.label}</span>
                                        </div>
                                        <div style={{ height: 4, borderRadius: 4, background: "#e2e8f0", marginBottom: 10, overflow: "hidden" }}>
                                            <div style={{ height: "100%", borderRadius: 4, background: fortaleza.color, width: `${porcentaje}%`, transition: "width 0.3s, background 0.3s" }} />
                                        </div>

                                        {/* Lista de requisitos */}
                                        {requisitos.map((req, i) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < requisitos.length - 1 ? 5 : 0 }}>
                                                <div style={{
                                                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                                                    background: req.ok ? "#22c55e" : "#e2e8f0",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    transition: "background 0.2s",
                                                }}>
                                                    {req.ok && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900 }}>✓</span>}
                                                </div>
                                                <span style={{ fontSize: 12, color: req.ok ? "#15803d" : "#94a3b8", fontWeight: req.ok ? 600 : 400, transition: "color 0.2s" }}>
                                                    {req.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}

                            {/* Campo confirmar */}
                            <div style={{ marginBottom: 16 }}>
                                <FLabel>Confirmar contraseña</FLabel>
                                <div style={{ position: "relative", marginTop: 6 }}>
                                    <input
                                        type={showPass.confirmar ? "text" : "password"}
                                        value={passForm.confirmar}
                                        onChange={e => setPassForm(p => ({ ...p, confirmar: e.target.value }))}
                                        placeholder="Repite la nueva contraseña"
                                        style={{
                                            ...inputBase(false),
                                            paddingRight: 36,
                                            borderColor: passForm.confirmar
                                                ? passForm.confirmar === passForm.nueva ? "#86efac" : "#fca5a5"
                                                : "#e2e8f0",
                                        }}
                                        onFocus={e => { e.target.style.borderColor = "#131E5C"; e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)"; }}
                                        onBlur={e => {
                                            e.target.style.borderColor = passForm.confirmar
                                                ? passForm.confirmar === passForm.nueva ? "#86efac" : "#fca5a5"
                                                : "#e2e8f0";
                                            e.target.style.boxShadow = "none";
                                        }}
                                    />
                                    <button type="button" onClick={() => setShowPass(p => ({ ...p, confirmar: !p.confirmar }))}
                                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                                        {showPass.confirmar ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                {/* Mensaje coincidencia */}
                                {passForm.confirmar.length > 0 && (
                                    <div style={{ marginTop: 5, fontSize: 11, fontWeight: 600, color: passForm.confirmar === passForm.nueva ? "#15803d" : "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
                                        <span>{passForm.confirmar === passForm.nueva ? "✓" : "✕"}</span>
                                        {passForm.confirmar === passForm.nueva ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                                    </div>
                                )}
                            </div>

                            {passMsg && (
                                <div style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, background: passMsg.startsWith("✓") ? "#dcfce7" : "#fee2e2", color: passMsg.startsWith("✓") ? "#15803d" : "#b91c1c", marginBottom: 14 }}>
                                    {passMsg}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                <button onClick={() => { setShowPassModal(false); setPassForm({ nueva: "", confirmar: "" }); setPassMsg(""); }}
                                    style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                    Cancelar
                                </button>
                                <button onClick={cambiarContrasena} disabled={passLoading || passForm.nueva !== passForm.confirmar || passForm.nueva.length < 8}
                                    style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: (passLoading || passForm.nueva !== passForm.confirmar || passForm.nueva.length < 8) ? "#94a3b8" : "#131E5C", color: "#fff", fontSize: 13, fontWeight: 700, cursor: (passLoading || passForm.nueva !== passForm.confirmar || passForm.nueva.length < 8) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                                    <Save size={14} />
                                    {passLoading ? "Guardando..." : "Actualizar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, fontSize: 12, color: "#131E5C", textDecoration: "none" }}>
                <ArrowLeft size={12} /> Volver al inicio
            </Link>
        </div>
    );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
// ── Input con ícono a la izquierda (externo) ──
function InputWithSideIcon({ icon: Icon, label, value, onChange, type = "text", placeholder, disabled = false, error }) {
    return (
        <div>
            <FLabel>{label}</FLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#eff2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={15} color="#131E5C" />
                </div>
                <input
                    type={type} value={value} onChange={onChange}
                    placeholder={placeholder} disabled={disabled}
                    style={{ ...inputBase(error), flex: 1 }}
                    onFocus={e => { e.target.style.borderColor = "#131E5C"; e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)"; }}
                    onBlur={e => { e.target.style.borderColor = error ? "#fca5a5" : "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                />
            </div>
            {error && <span style={{ fontSize: 11, color: "#ef4444", marginTop: 3, display: "block" }}>{error}</span>}
        </div>
    );
}

// ── Password con ícono externo + toggle ojo ──
function PasswordSideField({ label, value, onChange, placeholder }) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <FLabel>{label}</FLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#eff2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Lock size={15} color="#131E5C" />
                </div>
                <div style={{ position: "relative", flex: 1 }}>
                    <input
                        type={show ? "text" : "password"} value={value} onChange={onChange}
                        placeholder={placeholder}
                        style={{ ...inputBase(false), width: "100%", paddingRight: 36, boxSizing: "border-box" }}
                        onFocus={e => { e.target.style.borderColor = "#131E5C"; e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)"; }}
                        onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                    />
                    <button type="button" onClick={() => setShow(v => !v)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}>
                        {show ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Rol con ícono externo ──
function RolSideField({ label, value, onChange, roles }) {
    return (
        <div>
            <FLabel>{label}</FLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#eff2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Briefcase size={15} color="#131E5C" />
                </div>
                <select value={value} onChange={onChange}
                    style={{ ...inputBase(false), flex: 1, cursor: "pointer", appearance: "auto" }}
                    onFocus={e => { e.target.style.borderColor = "#131E5C"; e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)"; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}>
                    <option value="">Selecciona rol...</option>
                    {roles.map(r => <option key={r.id_rol} value={String(r.id_rol)}>{r.nombre}</option>)}
                </select>
            </div>
        </div>
    );
}

function RolToggle({ value, onChange, roles, onNuevoRol }) {
    return (
        <div>
            <FLabel>Rol</FLabel>
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                {roles.map(r => {
                    const active = String(value) === String(r.id_rol);
                    return (
                        <button key={r.id_rol} type="button"
                            onClick={() => onChange(String(r.id_rol))}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                                border: active ? "none" : "1px solid #e2e8f0",
                                background: active ? "#131E5C" : "#f8fafc",
                                color: active ? "#fff" : "#374151",
                                fontSize: 13, fontWeight: 600,
                                transition: "all 0.15s",
                                boxShadow: active ? "0 2px 8px rgba(19,30,92,0.25)" : "none",
                            }}>
                            <Users size={13} />
                            {r.nombre}
                        </button>
                    );
                })}

                {/* Botón Nuevo Rol */}
                <button type="button" onClick={onNuevoRol}
                    style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                        border: "1px dashed #c7d2fe",
                        background: "#f5f7ff",
                        color: "#4f46e5",
                        fontSize: 13, fontWeight: 600,
                        transition: "all 0.15s",
                    }}>
                    <Plus size={13} /> Nuevo Rol
                </button>
            </div>
        </div>
    );
}

function EstadoToggle({ value, onChange }) {
    const opciones = [
        { value: "Activo", icon: "✓", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
        { value: "Inactivo", icon: "○", color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0" },
    ];
    return (
        <div>
            <FLabel>Estado</FLabel>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {opciones.map(op => {
                    const active = value === op.value;
                    return (
                        <button key={op.value} type="button"
                            onClick={() => onChange(op.value)}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "9px 20px", borderRadius: 10, cursor: "pointer",
                                border: `1px solid ${active ? op.border : "#e2e8f0"}`,
                                background: active ? op.bg : "#f8fafc",
                                color: active ? op.color : "#94a3b8",
                                fontSize: 13, fontWeight: 600,
                                transition: "all 0.15s",
                            }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: active ? op.color : "#cbd5e1" }} />
                            {op.value}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function NuevoRolModal({ token, onClose, onCreado }) {
    const [nombre, setNombre] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    async function handleCrear() {
        const nombreLimpio = nombre.trim();
        if (!nombreLimpio) return setMsg("Escribe un nombre para el rol.");
        setLoading(true); setMsg("");
        try {
            const res = await fetch(`${API}/conformidad/api/admin/roles/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    nombre: nombreLimpio,
                    descripcion: " ",  // ← lo mandas pero invisible para el usuario
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.detail || data?.nombre?.[0] || "No se pudo crear el rol.");
            setMsg("✓ Rol creado");
            setTimeout(() => { onCreado(data); onClose(); }, 700);
        } catch (err) {
            setMsg(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div onClick={e => e.target === e.currentTarget && onClose()}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "1rem" }}>
            <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 25px 50px rgba(0,0,0,0.15)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "16px 20px", background: "#131E5C", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Briefcase size={15} color="#fff" />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Nuevo rol</span>
                    </div>
                    <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>

                {/* Body */}
                <div style={{ padding: "24px 20px" }}>
                    <div style={{ marginBottom: 16 }}>
                        <FLabel>Nombre del rol</FLabel>
                        <input
                            autoFocus
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCrear()}
                            placeholder="Ej. Gerente de ventas"
                            style={{ ...inputBase(false), marginTop: 6 }}
                            onFocus={e => { e.target.style.borderColor = "#131E5C"; e.target.style.boxShadow = "0 0 0 3px rgba(19,30,92,0.08)"; }}
                            onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                        />
                        <p style={{ fontSize: 11, color: "#94a3b8", margin: "6px 0 0" }}>El rol estará disponible inmediatamente para asignarlo a usuarios.</p>
                    </div>

                    {msg && (
                        <div style={{ padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, background: msg.startsWith("✓") ? "#dcfce7" : "#fee2e2", color: msg.startsWith("✓") ? "#15803d" : "#b91c1c", marginBottom: 14 }}>
                            {msg}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button type="button" onClick={onClose}
                            style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                            Cancelar
                        </button>
                        <button type="button" onClick={handleCrear} disabled={loading}
                            style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: loading ? "#94a3b8" : "#131E5C", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                            <Plus size={14} />
                            {loading ? "Creando..." : "Crear rol"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Settings() {



    const [estadoNuevo, setEstadoNuevo] = useState("Activo");
    const { token, user } = useAuth();

    const isAdminUI = useMemo(() => {
        const permisos = user?.permisos || [];
        return permisos.includes("ALL") || permisos.includes("USUARIOS_ADMIN");
    }, [user]);

    const authHeaders = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);

    const [roles, setRoles] = useState([]);
    const [selectedRolId, setSelectedRolId] = useState("");
    const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", apellidos: "", usuario: "", correo: "", contrasena: "", agencia: "", id_rol: "", foto: null });
    const [agenciasSeleccionadas, setAgenciasSeleccionadas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [usuarios, setUsuarios] = useState([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [modalUser, setModalUser] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalRolOpen, setModalRolOpen] = useState(false);
    const [filtroAgencia, setFiltroAgencia] = useState("Todas");
    const [filtroRol, setFiltroRol] = useState("Todos");
    const [filtroEstado, setFiltroEstado] = useState("Todos");

    const rolesUnicos = useMemo(() => {
        const set = new Set(usuarios.map(u => u.rol || u.nombre_rol).filter(Boolean));
        return ["Todos", ...set];
    }, [usuarios]);

    const usuariosFiltrados = useMemo(() => {
        return usuarios.filter(u => {
            const agencias = Array.isArray(u.agencies) ? u.agencies : [];
            const matchAgencia = filtroAgencia === "Todas" || agencias.includes(filtroAgencia);
            const rolUsuario = u.rol || u.nombre_rol || "";
            const matchRol = filtroRol === "Todos" || rolUsuario === filtroRol;
            const matchEstado = filtroEstado === "Todos" || (u.estado || "Activo") === filtroEstado;
            return matchAgencia && matchRol && matchEstado;
        });
    }, [usuarios, filtroAgencia, filtroRol, filtroEstado]);

    const onRolCreado = (nuevoRol) => {
        setRoles(prev => [...prev, nuevoRol]);
        // Seleccionar automáticamente el rol recién creado
        const id = String(nuevoRol.id_rol);
        setSelectedRolId(id);
        setNuevoUsuario(p => ({ ...p, id_rol: id }));
    };

    const showMsg = (text) => { setMsg(text); setTimeout(() => setMsg(""), 3500); };

    const cargarUsuarios = useCallback(async () => {
        if (!token) return;
        setLoadingTable(true);
        try {
            const res = await fetch(`${API}/conformidad/api/admin/usuarios/`, { headers: authHeaders });
            if (!res.ok) throw new Error("No se pudieron cargar los usuarios.");
            const data = await res.json();
            const lista = (Array.isArray(data) ? data : data.results ?? []).map(u => ({
                ...u,
                agencies: Array.isArray(u.agencies) ? u.agencies : String(u.agencia || "").split("|").map(a => a.trim()).filter(Boolean),
            }));
            setUsuarios(lista);
        } catch (err) { console.error(err); }
        finally { setLoadingTable(false); }
    }, [token, authHeaders]);

    useEffect(() => {
        if (!token || !isAdminUI) return;
        const cargarDatos = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API}/conformidad/api/admin/roles/`, { headers: authHeaders });
                if (!res.ok) throw new Error("No se pudieron cargar los roles.");
                const dataRoles = await res.json();
                const rolesList = Array.isArray(dataRoles) ? dataRoles : [];
                setRoles(rolesList);
                if (rolesList.length > 0) {
                    const firstId = String(rolesList[0].id_rol);
                    setSelectedRolId(firstId);
                    setNuevoUsuario(prev => ({ ...prev, id_rol: firstId }));
                }
            } catch (error) { showMsg(error.message || "Error cargando datos."); }
            finally { setLoading(false); }
        };
        cargarDatos();
        cargarUsuarios();
    }, [token, isAdminUI, authHeaders, cargarUsuarios]);

    const toggleAgencia = (agencia) => {
        setAgenciasSeleccionadas(prev => prev.includes(agencia) ? prev.filter(i => i !== agencia) : [...prev, agencia]);
    };

    const limpiarFormulario = () => {
        setNuevoUsuario({ nombre: "", apellidos: "", usuario: "", correo: "", contrasena: "", agencia: "", id_rol: selectedRolId || "", foto: null });
        setAgenciasSeleccionadas([]);
        setEstadoNuevo("Activo"); // ← agrega esto
    };
    const crearUsuario = async (e) => {
        e.preventDefault();

        const nombre = String(nuevoUsuario.nombre || "").trim();
        const apellidos = String(nuevoUsuario.apellidos || "").trim();
        const usuario = String(nuevoUsuario.usuario || "").trim();
        const correo = String(nuevoUsuario.correo || "").trim();
        const contrasena = String(nuevoUsuario.contrasena || "");
        const agencia = agenciasSeleccionadas.join("|");

        if (!nombre) return showMsg("Captura el nombre.");
        if (!usuario) return showMsg("Captura el usuario.");
        if (usuario.length > 10) {
            return showMsg("El usuario no puede tener más de 10 caracteres.");
        }

        if (!correo) return showMsg("Captura el correo electrónico.");
        if (!contrasena) return showMsg("Captura una contraseña.");
        if (contrasena.length < 8) {
            return showMsg("La contraseña debe tener al menos 8 caracteres.");
        }

        if (!nuevoUsuario.id_rol) {
            return showMsg("Selecciona un rol.");
        }

        if (agenciasSeleccionadas.length === 0) {
            return showMsg("Selecciona al menos una agencia.");
        }

        setLoading(true);

        const fd = new FormData();
        fd.append("nombre", nombre);
        fd.append("apellidos", apellidos);
        fd.append("usuario", usuario);
        fd.append("correo", correo);
        fd.append("contrasena", contrasena);
        fd.append("agencia", agencia);
        fd.append("id_rol", nuevoUsuario.id_rol);

        if (nuevoUsuario.foto) {
            fd.append("foto", nuevoUsuario.foto);
        }

        try {
            const res = await fetch(
                `${API}/conformidad/api/admin/usuarios/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: fd,
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const errores = data?.errors || data;
                let mensaje = data?.detail || "No se pudo crear el usuario.";

                if (errores && typeof errores === "object") {
                    const partes = Object.entries(errores).map(
                        ([campo, valor]) =>
                            `${campo}: ${Array.isArray(valor)
                                ? valor.join(", ")
                                : String(valor)
                            }`
                    );

                    if (partes.length) {
                        mensaje = partes.join(" | ");
                    }
                }

                throw new Error(mensaje);
            }

            showMsg("✓ Usuario creado exitosamente");
            limpiarFormulario();
            await cargarUsuarios();
        } catch (error) {
            showMsg(error.message || "Error creando usuario.");
        } finally {
            setLoading(false);
        }
    };

    function openEdit(u) { setModalUser(u); setModalOpen(true); }
    function closeModal() { setModalOpen(false); setModalUser(null); }

    if (!isAdminUI) return <PerfilUsuario token={token} user={user} />;

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, sans-serif" }}>


            {/* ── Card formulario (ancho completo) ── */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 24 }}>

                {/* Header banner */}

                <div style={{
                    padding: "28px 32px",
                    background: "linear-gradient(135deg, #131E5C 0%, #1a2d8a 100%)",
                    display: "flex", alignItems: "center", gap: 18,
                    position: "relative", overflow: "hidden",
                }}>
                    <div style={{ position: "absolute", right: 160, top: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
                    <div style={{ position: "absolute", right: 100, top: 10, width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                    <div style={{ width: 54, height: 54, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Users size={26} color="#fff" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: 0 }}>Gestión de usuarios</h2>
                        {/* Botón Volver en lugar del subtítulo */}
                        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 12, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }}>
                            <ArrowLeft size={12} /> Volver
                        </Link>
                    </div>
                    <div style={{ marginLeft: "auto", position: "relative", width: 100, height: 60 }}>
                        <div style={{ position: "absolute", right: 0, top: -10, width: 60, height: 60, borderRadius: "50%", background: "rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Users size={24} color="rgba(255,255,255,0.8)" />
                        </div>
                        <div style={{ position: "absolute", right: 45, top: 5, width: 40, height: 40, borderRadius: "50%", background: "rgba(99,102,241,0.4)" }} />
                        <div style={{ position: "absolute", right: 20, top: -5, fontSize: 16, color: "rgba(255,255,255,0.5)" }}>✦</div>
                        <div style={{ position: "absolute", right: 75, top: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>✦</div>
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={crearUsuario} style={{ padding: "28px 32px" }}>

                    {/* Fila 1: Nombre, Apellidos, Usuario */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "18px 24px", marginBottom: 20 }}>
                        <InputWithSideIcon icon={User} label="Nombre(s)" value={nuevoUsuario.nombre}
                            onChange={e => setNuevoUsuario(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej. Juan Carlos" />
                        <InputWithSideIcon icon={User} label="Apellidos" value={nuevoUsuario.apellidos}
                            onChange={e => setNuevoUsuario(p => ({ ...p, apellidos: e.target.value }))} placeholder="Ej. Pérez García" />
                        <InputWithSideIcon icon={AtSign} label="Usuario" value={nuevoUsuario.usuario}
                            onChange={e => setNuevoUsuario(p => ({ ...p, usuario: e.target.value }))} placeholder="Ej. juancarlos" />
                    </div>

                    {/* Fila 2: Correo + Contraseña */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px", marginBottom: 20 }}>
                        <InputWithSideIcon icon={Mail} label="Correo electrónico" type="email" value={nuevoUsuario.correo}
                            onChange={e => setNuevoUsuario(p => ({ ...p, correo: e.target.value }))} placeholder="Ej. juancarlos@correo.com" />
                        <PasswordSideField label="Contraseña" value={nuevoUsuario.contrasena}
                            onChange={e => setNuevoUsuario(p => ({ ...p, contrasena: e.target.value }))} placeholder="Mín. 8 caracteres" />
                    </div>

                    {/* Fila 3: Rol como botones toggle */}
                    <div style={{ marginBottom: 20 }}>
                        <RolToggle
                            value={nuevoUsuario.id_rol}
                            onChange={v => { setSelectedRolId(v); setNuevoUsuario(p => ({ ...p, id_rol: v })); }}
                            roles={roles}
                            onNuevoRol={() => setModalRolOpen(true)} />

                    </div>

                    {/* Fila 4: Estado + Foto lado a lado */}
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, marginBottom: 20, alignItems: "start" }}>
                        <EstadoToggle value={estadoNuevo} onChange={setEstadoNuevo} />
                        <div>
                            <FLabel>Foto de perfil <span style={{ color: "#94a3b8", fontWeight: 400 }}>(opcional)</span></FLabel>
                            <label style={{
                                display: "flex", alignItems: "center", gap: 14,
                                marginTop: 6, padding: "12px 18px",
                                borderRadius: 12, border: "1px dashed #c7d2fe",
                                background: "#f8faff", cursor: "pointer",
                            }}>
                                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Upload size={16} color="#131E5C" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0 }}>
                                        {nuevoUsuario.foto ? nuevoUsuario.foto.name : "Arrastra una imagen o haz clic para seleccionar"}
                                    </p>
                                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>JPG, PNG o WEBP. Máx. 2MB</p>
                                </div>
                                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <User size={20} color="#94a3b8" />
                                </div>
                                <input type="file" accept="image/*" style={{ display: "none" }}
                                    onChange={e => setNuevoUsuario(p => ({ ...p, foto: e.target.files[0] }))} />
                            </label>
                        </div>
                    </div>

                    {/* Agencias con Seleccionar todas */}
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <Building2 size={14} color="#131E5C" />
                                <FLabel>Agencia(s)</FLabel>
                            </div>
                            <button type="button"
                                onClick={() => setAgenciasSeleccionadas(
                                    agenciasSeleccionadas.length === DEALERS.length ? [] : [...DEALERS]
                                )}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    padding: "5px 12px", borderRadius: 8,
                                    border: "1px solid #e2e8f0", background: "#fff",
                                    fontSize: 12, fontWeight: 600, color: "#131E5C", cursor: "pointer",
                                }}>
                                {agenciasSeleccionadas.length === DEALERS.length ? "Deseleccionar todas" : "Seleccionar todas"}
                                <ChevronDown size={13} />
                            </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                            {DEALERS.map(dealer => (
                                <AgencyCheck key={dealer} label={dealer}
                                    checked={agenciasSeleccionadas.includes(dealer)}
                                    onChange={() => toggleAgencia(dealer)} />
                            ))}
                        </div>
                    </div>

                    {/* Botones */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 12,
                            paddingTop: 20,
                            borderTop: "1px solid #f1f5f9",
                        }}
                    >
                        <button
                            type="button"
                            onClick={limpiarFormulario}
                            disabled={loading}
                            style={{
                                padding: "11px 32px",
                                borderRadius: 10,
                                border: "1px solid #e2e8f0",
                                background: "#fff",
                                color: "#374151",
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: loading ? "not-allowed" : "pointer",
                            }}
                        >
                            Limpiar
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: "11px 32px",
                                borderRadius: 10,
                                border: "none",
                                background: loading
                                    ? "#94a3b8"
                                    : "linear-gradient(135deg, #4f46e5, #6366f1)",
                                color: "#fff",
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: loading ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                            }}
                        >
                            <Plus size={15} />
                            {loading ? "Creando..." : "Crear usuario"}
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Tabla usuarios ── */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>Usuarios por agencia</h2>
                        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>Haz doble clic en un usuario para modificarlo</p>
                    </div>
                    <button onClick={cargarUsuarios} disabled={loadingTable}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#374151", cursor: loadingTable ? "not-allowed" : "pointer", fontWeight: 500 }}>
                        <RefreshCw size={11} style={{ animation: loadingTable ? "spin 1s linear infinite" : "none" }} />
                        Actualizar
                    </button>
                </div>

                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

                {/* Filtros */}
                <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 14, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
                    <FilterSelect label="Agencia" value={filtroAgencia} onChange={setFiltroAgencia} options={["Todas", ...DEALERS]} />
                    <FilterSelect label="Rol" value={filtroRol} onChange={setFiltroRol} options={rolesUnicos} />
                    <FilterSelect label="Estado" value={filtroEstado} onChange={setFiltroEstado} options={["Todos", "Activo", "Inactivo"]} />
                    {(filtroAgencia !== "Todas" || filtroRol !== "Todos" || filtroEstado !== "Todos") && (
                        <button
                            onClick={() => { setFiltroAgencia("Todas"); setFiltroRol("Todos"); setFiltroEstado("Todos"); }}
                            style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                            Limpiar filtros
                        </button>
                    )}
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", alignSelf: "center" }}>
                        {usuariosFiltrados.length} de {usuarios.length} usuarios
                    </span>
                </div>
                {loadingTable ? (
                    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "36px 0", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
                        Cargando usuarios...
                    </div>
                ) : (
                    <UsersTableUnificada users={usuariosFiltrados} onEdit={openEdit} />
                )}
            </div>

            {/* ── Resumen (debajo de la tabla) ── */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 13 }}>🌐</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Resumen</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 200px)", gap: 0 }}>
                    {[["Total usuarios", usuarios.length], ["Agencias", DEALERS.length]].map(([label, val]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9" }}>
                            <span style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: "#131E5C", marginLeft: 16 }}>{val}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <UserModal user={modalUser} roles={roles} token={token} onClose={closeModal} onSaved={cargarUsuarios} />
            )}
            {/* Modal Nuevo Rol */}
            {modalRolOpen && (
                <NuevoRolModal
                    token={token}
                    onClose={() => setModalRolOpen(false)}
                    onCreado={onRolCreado}
                />
            )}
        </div>
    );
}