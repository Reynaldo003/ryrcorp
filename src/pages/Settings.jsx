// src/pages/Settings.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft, AtSign, Building2, ChevronDown, Eye, EyeOff,
    Lock, Mail, Phone, Plus, RefreshCw, Save, Search, Upload, User, Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { useAuth } from "../auth/AuthContext";
import { ensureFreshAccessToken } from "../lib/apiPruebas";

const API = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";
const AGENCIAS = ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan"];
const MAX_TELEFONOS = 5;
const REGEX_USUARIO = /^[A-Za-z0-9._-]+$/;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO_BD = /^\d{8,15}$/;

const AVATAR_COLORS = [
    { bg: "#e0e7ff", text: "#3730a3" },
    { bg: "#d1fae5", text: "#065f46" },
    { bg: "#fef3c7", text: "#92400e" },
    { bg: "#fce7f3", text: "#9d174d" },
    { bg: "#e0f2fe", text: "#0369a1" },
];

async function obtenerTokenVigente(tokenFallback) {
    try {
        return (await ensureFreshAccessToken()) || tokenFallback || "";
    } catch {
        return tokenFallback || "";
    }
}

const inputBase = (error = false) => ({
    width: "100%",
    padding: "9px 12px",
    border: `1px solid ${error ? "#fca5a5" : "#e2e8f0"}`,
    borderRadius: 10,
    fontSize: 13,
    color: "#0f172a",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color .15s, box-shadow .15s",
    fontFamily: "inherit",
});

function telefonoParaInput(valor) {
    const numero = String(valor || "").replace(/\D/g, "");
    return numero ? `+${numero}` : "";
}

function telefonoParaBD(valor) {
    return String(valor || "").replace(/\D/g, "");
}

function separarTelefonos(valor) {
    const telefonos = String(valor || "").split("|").map(telefonoParaInput).filter(Boolean);
    return telefonos.length ? telefonos : [""];
}

function limpiarTelefonos(lista = []) {
    return lista.map(telefonoParaBD).filter(Boolean);
}

function hayTelefonosDuplicados(lista = []) {
    const telefonos = limpiarTelefonos(lista);
    return new Set(telefonos).size !== telefonos.length;
}

function telefonoInvalido(lista = []) {
    return limpiarTelefonos(lista).find(telefono => !REGEX_TELEFONO_BD.test(telefono)) || "";
}

function passwordRequisitos(valor = "") {
    return {
        longitud: valor.length >= 8,
        mayuscula: /[A-Z]/.test(valor),
        numero: /[0-9]/.test(valor),
        simbolo: /[^A-Za-z0-9]/.test(valor),
    };
}

function passwordValido(valor = "") {
    return Object.values(passwordRequisitos(valor)).every(Boolean);
}

function mensajeApi(data, fallback) {
    if (!data || typeof data !== "object") return fallback;
    if (data.detail) return String(data.detail);

    const partes = Object.entries(data).map(([campo, valor]) =>
        `${campo}: ${Array.isArray(valor) ? valor.join(", ") : String(valor)}`
    );

    return partes.join(" | ") || fallback;
}

function initials(usuario = {}) {
    return `${usuario.nombre?.[0] || ""}${usuario.apellidos?.[0] || ""}`.toUpperCase();
}

function avatarColor(id) {
    return AVATAR_COLORS[(Number(id) || 0) % AVATAR_COLORS.length];
}

function Label({ children }) {
    return <span className="crm-label">{children}</span>;
}

function Alerta({ mensaje }) {
    if (!mensaje) return null;
    const ok = mensaje.startsWith("✓");

    return (
        <div role="alert" className={`crm-alert ${ok ? "ok" : "error"}`}>
            {mensaje}
        </div>
    );
}

function Avatar({ usuario, size = 34 }) {
    const color = avatarColor(usuario?.id ?? usuario?.id_usuario);

    if (usuario?.foto_url || usuario?.photo) {
        return (
            <img
                src={usuario.foto_url || usuario.photo}
                alt={usuario.nombre || "Usuario"}
                style={{ width: size, height: size }}
                className="crm-avatar-img"
            />
        );
    }

    return (
        <div
            className="crm-avatar"
            style={{
                width: size,
                height: size,
                background: color.bg,
                color: color.text,
                fontSize: size * 0.35,
            }}
        >
            {initials(usuario)}
        </div>
    );
}

function InputCampo({
    icon: Icon,
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    error = "",
    correcto = "",
    contador = "",
    sinIcono = false,
}) {
    const color = error
        ? "#fca5a5"
        : correcto
            ? "#86efac"
            : "#e2e8f0";

    return (
        <div>
            <Label>{label}</Label>

            <div className="crm-input-row">
                {!sinIcono && (
                    <div className={`crm-side-icon ${error ? "error" : ""}`}>
                        <Icon size={15} />
                    </div>
                )}

                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    aria-invalid={!!error}
                    style={{
                        ...inputBase(!!error),
                        borderColor: color,
                    }}
                    onFocus={e => {
                        e.target.style.borderColor = error ? "#ef4444" : "#131E5C";
                        e.target.style.boxShadow = `0 0 0 3px ${error
                            ? "rgba(239,68,68,.08)"
                            : "rgba(19,30,92,.08)"
                            }`;
                    }}
                    onBlur={e => {
                        e.target.style.borderColor = color;
                        e.target.style.boxShadow = "none";
                    }}
                />
            </div>

            {(error || correcto || contador) && (
                <div className={`crm-help ${sinIcono ? "compact" : ""}`}>
                    <span className={error ? "bad" : correcto ? "good" : ""}>
                        {error || correcto}
                    </span>

                    {contador && (
                        <span className={error ? "bad" : ""}>
                            {contador}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

function PasswordCampo({
    label,
    value,
    onChange,
    placeholder,
    error = "",
    sinIcono = false,
}) {
    const [ver, setVer] = useState(false);

    return (
        <div>
            <Label>{label}</Label>

            <div className="crm-input-row">
                {!sinIcono && (
                    <div className={`crm-side-icon ${error ? "error" : ""}`}>
                        <Lock size={15} />
                    </div>
                )}

                <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                    <input
                        type={ver ? "text" : "password"}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        style={{
                            ...inputBase(!!error),
                            paddingRight: 38,
                        }}
                    />

                    <button
                        type="button"
                        className="crm-eye"
                        onClick={() => setVer(v => !v)}
                    >
                        {ver ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>
            </div>

            {error && (
                <div className={`crm-help ${sinIcono ? "compact" : ""}`}>
                    <span className="bad">{error}</span>
                </div>
            )}
        </div>
    );
}

function RequisitosPassword({ value }) {
    if (!value) return null;

    const requisitos = passwordRequisitos(value);

    return (
        <div className="crm-password-rules">
            {[
                ["8+ caracteres", requisitos.longitud],
                ["Mayúscula", requisitos.mayuscula],
                ["Número", requisitos.numero],
                ["Símbolo", requisitos.simbolo],
            ].map(([texto, ok]) => (
                <span key={texto} className={ok ? "ok" : ""}>
                    {ok ? "✓" : "○"} {texto}
                </span>
            ))}
        </div>
    );
}

function AgencyCheck({ label, checked, onChange }) {
    return (
        <label className={`crm-agency ${checked ? "selected" : ""}`}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
            />
            <span>{label}</span>
        </label>
    );
}

function TelefonosMultiples({
    telefonos,
    onChange,
    error = "",
}) {
    const actualizar = (indice, valor) => {
        onChange(
            telefonos.map((telefono, i) =>
                i === indice
                    ? (valor || "")
                    : telefono
            )
        );
    };

    const agregar = () => {
        if (telefonos.length >= MAX_TELEFONOS) return;
        onChange([...telefonos, ""]);
    };

    const quitar = indice => {
        onChange(
            telefonos.length === 1
                ? [""]
                : telefonos.filter((_, i) => i !== indice)
        );
    };

    const repetidos = hayTelefonosDuplicados(telefonos);
    const invalido = telefonoInvalido(telefonos);

    const errorFinal =
        error ||
        (
            repetidos
                ? "No repitas el mismo teléfono dentro de este usuario."
                : invalido
                    ? `El teléfono ${invalido} está incompleto.`
                    : ""
        );

    return (
        <div>
            <div className="crm-phone-header">
                <div>
                    <Label>Teléfono(s)</Label>

                    <small>
                        Hasta {MAX_TELEFONOS}. El mismo número sí puede pertenecer a usuarios distintos.
                    </small>
                </div>

                <button
                    type="button"
                    className="crm-secondary-small"
                    disabled={telefonos.length >= MAX_TELEFONOS}
                    onClick={agregar}
                >
                    <Plus size={12} />
                    Agregar teléfono
                </button>
            </div>

            <div className="crm-phone-grid">
                {telefonos.map((telefono, indice) => (
                    <div className="crm-phone-item" key={indice}>
                        <div className="crm-side-icon">
                            <Phone size={15} />
                        </div>

                        <div className="crm-phone-wrap">
                            <PhoneInput
                                international
                                defaultCountry="MX"
                                flags={flags}
                                value={telefono || undefined}
                                onChange={valor => actualizar(indice, valor)}
                                placeholder="55 1234 5678"
                                className="crm-phone"
                            />
                        </div>

                        {telefonos.length > 1 && (
                            <button
                                type="button"
                                className="crm-remove-phone"
                                title="Eliminar teléfono"
                                onClick={() => quitar(indice)}
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {errorFinal && (
                <div className="crm-inline-error">
                    {errorFinal}
                </div>
            )}
        </div>
    );
}

function RolToggle({
    value,
    onChange,
    roles,
    onNuevoRol,
}) {
    return (
        <div>
            <Label>Rol</Label>

            <div className="crm-role-list">
                {roles.map(rol => (
                    <button
                        key={rol.id_rol}
                        type="button"
                        className={
                            String(value) === String(rol.id_rol)
                                ? "active"
                                : ""
                        }
                        onClick={() => onChange(String(rol.id_rol))}
                    >
                        <Users size={13} />
                        {rol.nombre}
                    </button>
                ))}

                <button
                    type="button"
                    className="new-role"
                    onClick={onNuevoRol}
                >
                    <Plus size={13} />
                    Nuevo Rol
                </button>
            </div>
        </div>
    );
}

function EstadoToggle({
    value,
    onChange,
}) {
    return (
        <div>
            <Label>Estado</Label>

            <div className="crm-status-toggle">
                {["Activo", "Inactivo"].map(estado => (
                    <button
                        key={estado}
                        type="button"
                        className={
                            value === estado
                                ? estado === "Activo"
                                    ? "active"
                                    : "inactive"
                                : ""
                        }
                        onClick={() => onChange(estado)}
                    >
                        <span />
                        {estado}
                    </button>
                ))}
            </div>
        </div>
    );
}

function NuevoRolModal({
    token,
    onClose,
    onCreado,
}) {
    const [nombre, setNombre] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const crear = async () => {
        const nombreLimpio = nombre.trim();

        if (!nombreLimpio) {
            return setMsg("Escribe un nombre para el rol.");
        }

        setLoading(true);
        setMsg("");

        try {
            const access = await obtenerTokenVigente(token);

            const res = await fetch(
                `${API}/conformidad/api/admin/roles/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${access}`,
                    },
                    body: JSON.stringify({
                        nombre: nombreLimpio,
                        descripcion: " ",
                    }),
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    mensajeApi(
                        data,
                        "No se pudo crear el rol."
                    )
                );
            }

            setMsg("✓ Rol creado");

            setTimeout(() => {
                onCreado(data);
                onClose();
            }, 500);
        } catch (error) {
            setMsg(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="crm-overlay"
            onMouseDown={e =>
                e.target === e.currentTarget && onClose()
            }
        >
            <div className="crm-modal-small">
                <div className="crm-modal-head">
                    <span>
                        <Users size={16} />
                        Nuevo rol
                    </span>

                    <button onClick={onClose}>×</button>
                </div>

                <div className="crm-modal-body">
                    <Label>Nombre del rol</Label>

                    <input
                        autoFocus
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        onKeyDown={e =>
                            e.key === "Enter" && crear()
                        }
                        placeholder="Ej. Gerente de ventas"
                        style={{
                            ...inputBase(),
                            marginTop: 6,
                        }}
                    />

                    <div style={{ marginTop: 14 }}>
                        <Alerta mensaje={msg} />
                    </div>

                    <div className="crm-modal-actions">
                        <button
                            type="button"
                            className="crm-btn secondary"
                            onClick={onClose}
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            className="crm-btn primary"
                            disabled={loading}
                            onClick={crear}
                        >
                            <Plus size={14} />
                            {loading
                                ? "Creando..."
                                : "Crear rol"
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserModal({
    user,
    usuarios,
    roles,
    token,
    onClose,
    onSaved,
}) {
    const idActual =
        user?.id ??
        user?.id_usuario;

    const [visible, setVisible] = useState(false);

    const [form, setForm] = useState({
        nombre: user?.nombre || "",
        apellidos: user?.apellidos || "",
        usuario: user?.usuario || "",
        correo: user?.correo || "",
        id_rol: user?.id_rol || "",
        estado: user?.estado || "Activo",
        agencies: Array.isArray(user?.agencies)
            ? user.agencies
            : String(user?.agencia || "")
                .split("|")
                .map(x => x.trim())
                .filter(Boolean),
    });

    const [telefonos, setTelefonos] = useState(
        separarTelefonos(user?.telefono)
    );

    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [foto, setFoto] = useState(null);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    const cerrar = () => {
        setVisible(false);
        setTimeout(onClose, 220);
    };

    const set = (campo, valor) => {
        setForm(prev => ({
            ...prev,
            [campo]: valor,
        }));
    };

    const usuario = form.usuario.trim();
    const correo = form.correo.trim().toLowerCase();

    const usuarioDuplicado = usuarios.some(item =>
        String(item.id ?? item.id_usuario) !== String(idActual) &&
        String(item.usuario || "")
            .trim()
            .toLowerCase() === usuario.toLowerCase()
    );

    const correoDuplicado = usuarios.some(item =>
        String(item.id ?? item.id_usuario) !== String(idActual) &&
        String(item.correo || "")
            .trim()
            .toLowerCase() === correo
    );

    const errorUsuario =
        !usuario
            ? ""
            : usuario.length > 10
                ? "Máximo 10 caracteres."
                : !REGEX_USUARIO.test(usuario)
                    ? "Solo letras, números, punto, guion y _."
                    : usuarioDuplicado
                        ? "Ese usuario ya existe."
                        : "";

    const errorCorreo =
        !correo
            ? ""
            : !REGEX_CORREO.test(correo)
                ? "Correo inválido."
                : correoDuplicado
                    ? "Ese correo ya existe."
                    : "";

    const errorTelefono =
        hayTelefonosDuplicados(telefonos)
            ? "No repitas el mismo teléfono dentro de este usuario."
            : telefonoInvalido(telefonos)
                ? `El teléfono ${telefonoInvalido(telefonos)} está incompleto.`
                : "";

    const guardar = async () => {
        if (!form.nombre.trim()) {
            return setMsg("Captura el nombre.");
        }

        if (!usuario) {
            return setMsg("Captura el usuario.");
        }

        if (errorUsuario) {
            return setMsg(errorUsuario);
        }

        if (!correo) {
            return setMsg("Captura el correo.");
        }

        if (errorCorreo) {
            return setMsg(errorCorreo);
        }

        if (!form.id_rol) {
            return setMsg("Selecciona un rol.");
        }

        if (!form.agencies.length) {
            return setMsg("Selecciona al menos una agencia.");
        }

        if (errorTelefono) {
            return setMsg(errorTelefono);
        }

        if (
            password &&
            !passwordValido(password)
        ) {
            return setMsg(
                "La nueva contraseña debe tener 8+ caracteres, mayúscula, número y símbolo."
            );
        }

        if (
            password &&
            password !== password2
        ) {
            return setMsg(
                "Las contraseñas no coinciden."
            );
        }

        setLoading(true);
        setMsg("");

        const fd = new FormData();

        fd.append("nombre", form.nombre.trim());
        fd.append("apellidos", form.apellidos.trim());
        fd.append("usuario", usuario);
        fd.append("correo", correo);
        fd.append(
            "telefono",
            limpiarTelefonos(telefonos).join("|")
        );
        fd.append("id_rol", form.id_rol);
        fd.append(
            "agencia",
            form.agencies.join("|")
        );
        fd.append("estado", form.estado);

        if (password) {
            fd.append("contrasena", password);
        }

        if (foto) {
            fd.append("foto", foto);
        }

        try {
            const access =
                await obtenerTokenVigente(token);

            const res = await fetch(
                `${API}/conformidad/api/admin/usuarios/${idActual}/`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                    body: fd,
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(
                    mensajeApi(
                        data,
                        "No se pudo actualizar el usuario."
                    )
                );
            }

            setMsg("✓ Cambios guardados");

            setTimeout(() => {
                onSaved();
                cerrar();
            }, 650);
        } catch (error) {
            setMsg(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div
                className="crm-drawer-overlay"
                onClick={cerrar}
                style={{
                    opacity: visible ? 1 : 0,
                }}
            />

            <aside
                className="crm-drawer"
                style={{
                    transform: visible
                        ? "translateX(0)"
                        : "translateX(100%)",
                }}
            >
                <div className="crm-drawer-head">
                    <button onClick={cerrar}>
                        ×
                    </button>

                    <div className="crm-drawer-user">
                        <Avatar
                            usuario={{
                                ...user,
                                ...form,
                            }}
                            size={58}
                        />

                        <div>
                            <strong>
                                {form.nombre || "Nombre"}{" "}
                                {form.apellidos}
                            </strong>

                            <span>
                                @{form.usuario || "usuario"}
                            </span>

                            <small>
                                {
                                    roles.find(
                                        rol =>
                                            String(rol.id_rol) ===
                                            String(form.id_rol)
                                    )?.nombre || "Sin rol"
                                }
                            </small>
                        </div>
                    </div>
                </div>

                <div className="crm-drawer-content">
                    <div className="crm-section-title">
                        Datos personales
                    </div>

                    <div className="crm-grid-2">
                        <InputCampo
                            icon={User}
                            sinIcono
                            label="Nombre(s)"
                            value={form.nombre}
                            onChange={e =>
                                set(
                                    "nombre",
                                    e.target.value
                                )
                            }
                        />

                        <InputCampo
                            icon={User}
                            sinIcono
                            label="Apellidos"
                            value={form.apellidos}
                            onChange={e =>
                                set(
                                    "apellidos",
                                    e.target.value
                                )
                            }
                        />

                        <InputCampo
                            icon={AtSign}
                            sinIcono
                            label="Usuario"
                            value={form.usuario}
                            onChange={e =>
                                set(
                                    "usuario",
                                    e.target.value
                                )
                            }
                            error={errorUsuario}
                            correcto={
                                usuario &&
                                    !errorUsuario
                                    ? "✓ Disponible"
                                    : ""
                            }
                            contador={`${form.usuario.length}/10`}
                        />

                        <InputCampo
                            icon={Mail}
                            sinIcono
                            type="email"
                            label="Correo"
                            value={form.correo}
                            onChange={e =>
                                set(
                                    "correo",
                                    e.target.value
                                )
                            }
                            error={errorCorreo}
                            correcto={
                                correo &&
                                    !errorCorreo
                                    ? "✓ Disponible"
                                    : ""
                            }
                        />
                    </div>

                    <div className="crm-block">
                        <TelefonosMultiples
                            telefonos={telefonos}
                            onChange={setTelefonos}
                        />
                    </div>

                    <div className="crm-section-title">
                        Rol y agencias
                    </div>

                    <div className="crm-grid-2">
                        <label>
                            <Label>Rol</Label>

                            <select
                                value={form.id_rol}
                                onChange={e =>
                                    set(
                                        "id_rol",
                                        e.target.value
                                    )
                                }
                                style={{
                                    ...inputBase(),
                                    marginTop: 6,
                                }}
                            >
                                <option value="">
                                    Selecciona...
                                </option>

                                {roles.map(rol => (
                                    <option
                                        key={rol.id_rol}
                                        value={rol.id_rol}
                                    >
                                        {rol.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <EstadoToggle
                            value={form.estado}
                            onChange={valor =>
                                set("estado", valor)
                            }
                        />
                    </div>

                    <div className="crm-agencies-grid edit">
                        {AGENCIAS.map(agencia => (
                            <AgencyCheck
                                key={agencia}
                                label={agencia}
                                checked={
                                    form.agencies.includes(
                                        agencia
                                    )
                                }
                                onChange={() =>
                                    set(
                                        "agencies",
                                        form.agencies.includes(agencia)
                                            ? form.agencies.filter(
                                                item =>
                                                    item !== agencia
                                            )
                                            : [
                                                ...form.agencies,
                                                agencia,
                                            ]
                                    )
                                }
                            />
                        ))}
                    </div>

                    <div className="crm-section-title">
                        Cambiar contraseña{" "}
                        <small>(opcional)</small>
                    </div>

                    <div className="crm-grid-2">
                        <PasswordCampo
                            sinIcono
                            label="Nueva contraseña"
                            value={password}
                            onChange={e =>
                                setPassword(e.target.value)
                            }
                            placeholder="Dejar vacío"
                        />

                        <PasswordCampo
                            sinIcono
                            label="Confirmar"
                            value={password2}
                            onChange={e =>
                                setPassword2(e.target.value)
                            }
                            error={
                                password2 &&
                                    password !== password2
                                    ? "No coincide"
                                    : ""
                            }
                        />
                    </div>

                    <RequisitosPassword
                        value={password}
                    />

                    <div className="crm-section-title">
                        Foto{" "}
                        <small>(opcional)</small>
                    </div>

                    <label className="crm-upload">
                        <Upload size={16} />

                        <span>
                            {foto
                                ? foto.name
                                : "Seleccionar nueva foto"
                            }
                        </span>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={e =>
                                setFoto(
                                    e.target.files?.[0] ||
                                    null
                                )
                            }
                        />
                    </label>
                </div>

                <div className="crm-drawer-footer">
                    <Alerta mensaje={msg} />

                    <div>
                        <button
                            className="crm-btn secondary"
                            onClick={cerrar}
                        >
                            Cancelar
                        </button>

                        <button
                            className="crm-btn primary"
                            disabled={loading}
                            onClick={guardar}
                        >
                            {loading
                                ? "Guardando..."
                                : "Guardar cambios"
                            }
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

function TablaUsuarios({
    users,
    onEdit,
}) {
    return (
        <div className="crm-table-wrap">
            <table className="crm-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>Nombre</th>
                        <th>Usuario</th>
                        <th>Agencia</th>
                        <th>Teléfono(s)</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Correo</th>
                    </tr>
                </thead>

                <tbody>
                    {!users.length ? (
                        <tr>
                            <td
                                colSpan="8"
                                className="empty"
                            >
                                Sin usuarios que coincidan con los filtros
                            </td>
                        </tr>
                    ) : (
                        users.map(usuario => {
                            const telefonos =
                                limpiarTelefonos(
                                    separarTelefonos(
                                        usuario.telefono
                                    )
                                );

                            return (
                                <tr
                                    key={
                                        usuario.id ??
                                        usuario.id_usuario
                                    }
                                    onDoubleClick={() =>
                                        onEdit(usuario)
                                    }
                                >
                                    <td>
                                        <Avatar
                                            usuario={usuario}
                                        />
                                    </td>

                                    <td>
                                        <strong>
                                            {usuario.nombre}{" "}
                                            {usuario.apellidos}
                                        </strong>
                                    </td>

                                    <td>
                                        @{usuario.usuario}
                                    </td>

                                    <td>
                                        {(usuario.agencies || [])
                                            .join(", ")}
                                    </td>

                                    <td>
                                        {telefonos.length ? (
                                            <span>
                                                {telefonos[0]}{" "}

                                                {telefonos.length > 1 && (
                                                    <b
                                                        className="crm-count"
                                                        title={telefonos.join("\n")}
                                                    >
                                                        +{telefonos.length - 1}
                                                    </b>
                                                )}
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>

                                    <td>
                                        <span className="crm-role-badge">
                                            {usuario.rol ||
                                                usuario.nombre_rol ||
                                                "—"}
                                        </span>
                                    </td>

                                    <td>
                                        <span
                                            className={`crm-status ${usuario.estado === "Inactivo"
                                                ? "inactive"
                                                : ""
                                                }`}
                                        >
                                            {usuario.estado || "Activo"}
                                        </span>
                                    </td>

                                    <td>
                                        {usuario.correo}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}

function PerfilUsuario({
    token,
    user,
}) {
    const userId =
        user?.id_usuario ||
        user?.id;

    const [form, setForm] = useState({
        nombre: user?.nombre || "",
        apellidos: user?.apellidos || "",
        usuario: user?.usuario || "",
        correo: user?.correo || "",
    });

    const [telefonos, setTelefonos] = useState(
        separarTelefonos(user?.telefono)
    );

    const [foto, setFoto] = useState(null);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const [showPass, setShowPass] = useState(false);
    const [pass, setPass] = useState("");
    const [pass2, setPass2] = useState("");
    const [passMsg, setPassMsg] = useState("");
    const [passLoading, setPassLoading] = useState(false);

    const guardar = async () => {
        if (!userId) {
            return setMsg(
                "No se encontró el ID del usuario."
            );
        }

        if (
            hayTelefonosDuplicados(
                telefonos
            )
        ) {
            return setMsg(
                "No repitas el mismo teléfono dentro de tu perfil."
            );
        }

        const invalido =
            telefonoInvalido(telefonos);

        if (invalido) {
            return setMsg(
                `El teléfono ${invalido} está incompleto.`
            );
        }

        setLoading(true);
        setMsg("");

        const fd = new FormData();

        Object.entries(form).forEach(
            ([campo, valor]) =>
                fd.append(campo, valor)
        );

        fd.append(
            "telefono",
            limpiarTelefonos(
                telefonos
            ).join("|")
        );

        if (foto) {
            fd.append("foto", foto);
        }

        try {
            const access =
                await obtenerTokenVigente(token);

            const res = await fetch(
                `${API}/conformidad/api/perfil/`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                    body: fd,
                }
            );

            const data =
                await res.json().catch(
                    () => ({})
                );

            if (!res.ok) {
                throw new Error(
                    mensajeApi(
                        data,
                        "No se pudo actualizar el perfil."
                    )
                );
            }

            setMsg(
                "✓ Datos actualizados correctamente"
            );
        } catch (error) {
            setMsg(
                `Error: ${error.message}`
            );
        } finally {
            setLoading(false);
        }
    };

    const cambiarPass = async () => {
        if (!passwordValido(pass)) {
            return setPassMsg(
                "La contraseña debe tener 8+ caracteres, mayúscula, número y símbolo."
            );
        }

        if (pass !== pass2) {
            return setPassMsg(
                "Las contraseñas no coinciden."
            );
        }

        if (!userId) {
            return setPassMsg(
                "No se encontró el ID del usuario."
            );
        }

        setPassLoading(true);
        setPassMsg("");

        const fd = new FormData();
        fd.append("contrasena", pass);

        try {
            const access =
                await obtenerTokenVigente(token);

            const res = await fetch(
                `${API}/conformidad/api/admin/usuarios/${userId}/`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                    body: fd,
                }
            );

            const data =
                await res.json().catch(
                    () => ({})
                );

            if (!res.ok) {
                throw new Error(
                    mensajeApi(
                        data,
                        "No se pudo cambiar la contraseña."
                    )
                );
            }

            setPassMsg(
                "✓ Contraseña actualizada"
            );

            setTimeout(() => {
                setShowPass(false);
                setPass("");
                setPass2("");
                setPassMsg("");
            }, 800);
        } catch (error) {
            setPassMsg(
                `Error: ${error.message}`
            );
        } finally {
            setPassLoading(false);
        }
    };

    return (
        <div className="crm-page perfil">
            <GlobalStyles />

            <div className="crm-card">
                <div className="crm-profile-banner">
                    <div>
                        <Avatar
                            usuario={user}
                            size={72}
                        />
                    </div>

                    <div>
                        <h2>
                            {form.nombre}{" "}
                            {form.apellidos}
                        </h2>

                        <p>
                            @{form.usuario} ·{" "}
                            {user?.rol ||
                                user?.nombre_rol ||
                                "Usuario"}
                        </p>
                    </div>
                </div>

                <div className="crm-form">
                    <div className="crm-grid-2">
                        <InputCampo
                            icon={User}
                            label="Nombre(s)"
                            value={form.nombre}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    nombre:
                                        e.target.value,
                                }))
                            }
                        />

                        <InputCampo
                            icon={User}
                            label="Apellidos"
                            value={form.apellidos}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    apellidos:
                                        e.target.value,
                                }))
                            }
                        />

                        <InputCampo
                            icon={AtSign}
                            label="Usuario"
                            value={form.usuario}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    usuario:
                                        e.target.value,
                                }))
                            }
                        />

                        <InputCampo
                            icon={Mail}
                            label="Correo"
                            type="email"
                            value={form.correo}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    correo:
                                        e.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className="crm-block">
                        <TelefonosMultiples
                            telefonos={telefonos}
                            onChange={setTelefonos}
                        />
                    </div>

                    <label className="crm-upload">
                        <Upload size={16} />

                        <span>
                            {foto
                                ? foto.name
                                : "Seleccionar foto de perfil"
                            }
                        </span>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={e =>
                                setFoto(
                                    e.target.files?.[0] ||
                                    null
                                )
                            }
                        />
                    </label>

                    <button
                        type="button"
                        className="crm-btn secondary"
                        style={{
                            marginTop: 12,
                        }}
                        onClick={() =>
                            setShowPass(true)
                        }
                    >
                        <Lock size={14} />
                        Cambiar contraseña
                    </button>

                    <div style={{ marginTop: 14 }}>
                        <Alerta mensaje={msg} />
                    </div>

                    <div className="crm-actions">
                        <Link
                            className="crm-btn secondary"
                            to="/"
                        >
                            <ArrowLeft size={14} />
                            Volver
                        </Link>

                        <button
                            className="crm-btn primary"
                            disabled={loading}
                            onClick={guardar}
                        >
                            <Save size={14} />

                            {loading
                                ? "Guardando..."
                                : "Guardar cambios"
                            }
                        </button>
                    </div>
                </div>
            </div>

            {showPass && (
                <div
                    className="crm-overlay"
                    onMouseDown={e =>
                        e.target === e.currentTarget &&
                        setShowPass(false)
                    }
                >
                    <div className="crm-modal-small">
                        <div className="crm-modal-head">
                            <span>
                                <Lock size={16} />
                                Cambiar contraseña
                            </span>

                            <button
                                onClick={() =>
                                    setShowPass(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <div className="crm-modal-body">
                            <div className="crm-grid-2">
                                <PasswordCampo
                                    sinIcono
                                    label="Nueva contraseña"
                                    value={pass}
                                    onChange={e =>
                                        setPass(e.target.value)
                                    }
                                />

                                <PasswordCampo
                                    sinIcono
                                    label="Confirmar"
                                    value={pass2}
                                    onChange={e =>
                                        setPass2(e.target.value)
                                    }
                                    error={
                                        pass2 &&
                                            pass !== pass2
                                            ? "No coincide"
                                            : ""
                                    }
                                />
                            </div>

                            <RequisitosPassword
                                value={pass}
                            />

                            <Alerta
                                mensaje={passMsg}
                            />

                            <div className="crm-modal-actions">
                                <button
                                    className="crm-btn secondary"
                                    onClick={() =>
                                        setShowPass(false)
                                    }
                                >
                                    Cancelar
                                </button>

                                <button
                                    className="crm-btn primary"
                                    disabled={passLoading}
                                    onClick={cambiarPass}
                                >
                                    {passLoading
                                        ? "Guardando..."
                                        : "Actualizar"
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function GlobalStyles() {
    return (
        <style>{`
      .crm-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px 20px;
        font-family: system-ui, sans-serif;
        color: #0f172a;
      }

      .crm-page.perfil {
        max-width: 980px;
      }

      .crm-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        overflow: hidden;
        margin-bottom: 24px;
      }

      .crm-header {
        padding: 28px 32px;
        background: linear-gradient(135deg, #131E5C, #1a2d8a);
        color: #fff;
        display: flex;
        align-items: center;
        gap: 18px;
      }

      .crm-header-icon {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: rgba(255,255,255,.15);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .crm-header h2 {
        margin: 0;
        font-size: 22px;
      }

      .crm-header a {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-top: 6px;
        padding: 5px 11px;
        border-radius: 8px;
        background: rgba(255,255,255,.14);
        border: 1px solid rgba(255,255,255,.2);
        color: #fff;
        text-decoration: none;
        font-size: 12px;
        font-weight: 600;
      }

      .crm-form {
        padding: 28px 32px;
      }

      .crm-label {
        font-size: 12px;
        font-weight: 600;
        color: #374151;
      }

      .crm-grid-3,
      .crm-grid-2 {
        display: grid;
        gap: 18px 24px;
      }

      .crm-grid-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .crm-grid-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .crm-input-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 6px;
        min-width: 0;
      }

      .crm-side-icon {
        width: 36px;
        height: 36px;
        border-radius: 9px;
        background: #eff2ff;
        color: #131E5C;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
      }

      .crm-side-icon.error {
        background: #fef2f2;
        color: #ef4444;
      }

      .crm-help {
        margin: 4px 0 0 46px;
        display: flex;
        justify-content: space-between;
        gap: 8px;
        min-height: 14px;
        font-size: 10px;
        font-weight: 600;
        color: #94a3b8;
      }

      .crm-help.compact {
        margin-left: 0;
      }

      .crm-help .bad,
      .crm-inline-error {
        color: #ef4444;
      }

      .crm-help .good {
        color: #16a34a;
      }

      .crm-eye {
        position: absolute;
        right: 9px;
        top: 50%;
        transform: translateY(-50%);
        border: 0;
        background: none;
        color: #94a3b8;
        cursor: pointer;
        display: flex;
      }

      .crm-block {
        margin: 20px 0;
        padding: 14px 16px;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #fafcff;
      }

      .crm-phone-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }

      .crm-phone-header small {
        display: block;
        font-size: 10px;
        color: #94a3b8;
        margin-top: 2px;
      }

      .crm-phone-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .crm-phone-item {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .crm-phone-wrap {
        flex: 1;
        min-width: 0;
      }

      .crm-phone {
        width: 100%;
      }

      .crm-phone .PhoneInputInput {
        width: 100%;
        padding: 9px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        font-size: 13px;
        outline: none;
        min-width: 0;
      }

      .crm-phone .PhoneInputInput:focus {
        border-color: #131E5C;
        box-shadow: 0 0 0 3px rgba(19,30,92,.08);
      }

      .crm-remove-phone {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid #fecaca;
        background: #fff;
        color: #dc2626;
        cursor: pointer;
        font-size: 16px;
      }

      .crm-secondary-small {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 10px;
        border: 1px solid #c7d2fe;
        border-radius: 8px;
        background: #f5f7ff;
        color: #4f46e5;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
      }

      .crm-secondary-small:disabled {
        opacity: .45;
        cursor: not-allowed;
      }

      .crm-inline-error {
        font-size: 11px;
        font-weight: 600;
        margin-top: 7px;
      }

      .crm-password-rules {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin: 8px 0 18px;
        font-size: 10px;
        font-weight: 600;
        color: #94a3b8;
      }

      .crm-password-rules .ok {
        color: #16a34a;
      }

      .crm-role-list {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 6px;
      }

      .crm-role-list button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 9px 15px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        color: #374151;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }

      .crm-role-list button.active {
        border-color: #131E5C;
        background: #131E5C;
        color: #fff;
      }

      .crm-role-list button.new-role {
        border: 1px dashed #c7d2fe;
        background: #f5f7ff;
        color: #4f46e5;
      }

      .crm-status-toggle {
        display: flex;
        gap: 8px;
        margin-top: 6px;
      }

      .crm-status-toggle button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 9px 18px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: #f8fafc;
        color: #94a3b8;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }

      .crm-status-toggle button span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #cbd5e1;
      }

      .crm-status-toggle button.active {
        background: #dcfce7;
        border-color: #86efac;
        color: #16a34a;
      }

      .crm-status-toggle button.active span {
        background: #16a34a;
      }

      .crm-status-toggle button.inactive {
        background: #fee2e2;
        border-color: #fecaca;
        color: #b91c1c;
      }

      .crm-status-toggle button.inactive span {
        background: #dc2626;
      }

      .crm-agencies-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0,1fr));
        gap: 10px;
        margin-top: 10px;
      }

      .crm-agencies-grid.edit {
        grid-template-columns: repeat(2, minmax(0,1fr));
        margin: 14px 0 22px;
      }

      .crm-agency {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 10px 13px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: #f8fafc;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
      }

      .crm-agency.selected {
        background: #f0f4ff;
        border-color: #c7d2fe;
      }

      .crm-agency input {
        accent-color: #131E5C;
      }

      .crm-upload {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border: 1px dashed #c7d2fe;
        border-radius: 12px;
        background: #f8faff;
        color: #334155;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }

      .crm-upload input {
        display: none;
      }

      .crm-actions {
        display: flex;
        justify-content: center;
        gap: 10px;
        padding-top: 20px;
        margin-top: 20px;
        border-top: 1px solid #f1f5f9;
      }

      .crm-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 10px 20px;
        border-radius: 9px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
      }

      .crm-btn.primary {
        border: 0;
        background: #131E5C;
        color: #fff;
      }

      .crm-btn.secondary {
        border: 1px solid #e2e8f0;
        background: #fff;
        color: #374151;
      }

      .crm-btn:disabled {
        opacity: .55;
        cursor: not-allowed;
      }

      .crm-alert {
        padding: 10px 14px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 700;
      }

      .crm-alert.ok {
        background: #f0fdf4;
        border: 1px solid #86efac;
        color: #15803d;
      }

      .crm-alert.error {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #b91c1c;
      }

      .crm-filter-row {
        display: flex;
        gap: 14px;
        align-items: flex-end;
        flex-wrap: wrap;
        margin-bottom: 14px;
        padding: 14px 16px;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
      }

      .crm-search {
        flex: 1;
        min-width: 240px;
      }

      .crm-filter {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .crm-filter select {
        min-width: 150px;
      }

      .crm-table-wrap {
        overflow-x: auto;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #fff;
      }

      .crm-table {
        width: 100%;
        min-width: 980px;
        border-collapse: collapse;
      }

      .crm-table th {
        padding: 8px 14px;
        text-align: left;
        font-size: 11px;
        color: #94a3b8;
        background: #fafafa;
        border-bottom: 1px solid #f1f5f9;
      }

      .crm-table td {
        padding: 10px 14px;
        font-size: 12px;
        color: #64748b;
        border-bottom: 1px solid #f8fafc;
      }

      .crm-table tbody tr {
        cursor: pointer;
      }

      .crm-table tbody tr:hover {
        background: #f8fafc;
      }

      .crm-table .empty {
        text-align: center;
        padding: 28px;
      }

      .crm-count {
        background: #eef2ff;
        color: #4338ca;
        border-radius: 20px;
        padding: 1px 7px;
        font-size: 10px;
      }

      .crm-role-badge {
        background: #eef2ff;
        color: #4338ca;
        border-radius: 20px;
        padding: 2px 9px;
        font-weight: 600;
      }

      .crm-status {
        background: #dcfce7;
        color: #15803d;
        border-radius: 20px;
        padding: 2px 9px;
        font-weight: 600;
      }

      .crm-status.inactive {
        background: #fee2e2;
        color: #b91c1c;
      }

      .crm-avatar,
      .crm-avatar-img {
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        object-fit: cover;
        font-weight: 800;
        flex: 0 0 auto;
      }

      .crm-overlay,
      .crm-drawer-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15,23,42,.38);
        backdrop-filter: blur(2px);
        z-index: 300;
      }

      .crm-modal-small {
        width: min(400px, calc(100vw - 24px));
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 25px 50px rgba(0,0,0,.15);
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%,-50%);
      }

      .crm-modal-head {
        padding: 15px 18px;
        background: #131E5C;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 700;
      }

      .crm-modal-head span {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .crm-modal-head button,
      .crm-drawer-head > button {
        border: 0;
        background: rgba(255,255,255,.12);
        color: #fff;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 20px;
      }

      .crm-modal-body {
        padding: 20px;
      }

      .crm-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
      }

      .crm-drawer-overlay {
        z-index: 350;
        transition: opacity .22s;
      }

      .crm-drawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 470px;
        max-width: 100vw;
        background: #fff;
        z-index: 351;
        display: flex;
        flex-direction: column;
        box-shadow: -8px 0 40px rgba(0,0,0,.12);
        transition: transform .22s ease;
      }

      .crm-drawer-head {
        padding: 20px;
        background: linear-gradient(135deg,#131E5C,#1a2d8a);
        color: #fff;
        position: relative;
      }

      .crm-drawer-head > button {
        position: absolute;
        right: 14px;
        top: 14px;
      }

      .crm-drawer-user {
        display: flex;
        align-items: center;
        gap: 13px;
        padding-right: 35px;
      }

      .crm-drawer-user div {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .crm-drawer-user strong {
        font-size: 16px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .crm-drawer-user span {
        font-size: 12px;
        color: #c7d2fe;
      }

      .crm-drawer-user small {
        margin-top: 5px;
        width: max-content;
        padding: 2px 8px;
        border-radius: 20px;
        background: rgba(255,255,255,.14);
      }

      .crm-drawer-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .crm-drawer-footer {
        padding: 14px 20px;
        border-top: 1px solid #f1f5f9;
      }

      .crm-drawer-footer > div:last-child {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }

      .crm-drawer-footer .crm-btn {
        flex: 1;
      }

      .crm-section-title {
        font-size: 11px;
        font-weight: 800;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: .06em;
        margin: 4px 0 12px;
      }

      .crm-section-title small {
        font-weight: 400;
        text-transform: none;
      }

      .crm-profile-banner {
        padding: 26px;
        background: linear-gradient(135deg,#131E5C,#1a2d8a);
        color: #fff;
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .crm-profile-banner .crm-avatar {
        border: 3px solid #fff;
      }

      .crm-profile-banner h2 {
        margin: 0;
        font-size: 22px;
      }

      .crm-profile-banner p {
        margin: 4px 0 0;
        color: #c7d2fe;
      }

      .crm-summary {
        display: grid;
        grid-template-columns: repeat(2,180px);
        gap: 10px;
      }

      .crm-summary div {
        padding: 12px 14px;
        border: 1px solid #f1f5f9;
        border-radius: 10px;
      }

      .crm-summary span {
        display: block;
        font-size: 11px;
        color: #94a3b8;
      }

      .crm-summary strong {
        font-size: 20px;
        color: #131E5C;
      }

      .crm-top-table {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .crm-top-table h3 {
        margin: 0;
        font-size: 14px;
      }

      .crm-top-table p {
        margin: 2px 0 0;
        font-size: 12px;
        color: #94a3b8;
      }

      @media(max-width: 980px) {
        .crm-grid-3 {
          grid-template-columns: repeat(2,minmax(0,1fr));
        }

        .crm-agencies-grid {
          grid-template-columns: repeat(3,minmax(0,1fr));
        }
      }

      @media(max-width: 700px) {
        .crm-page {
          padding: 18px 12px;
        }

        .crm-header,
        .crm-form {
          padding: 20px 16px;
        }

        .crm-grid-3,
        .crm-grid-2,
        .crm-phone-grid {
          grid-template-columns: 1fr;
        }

        .crm-agencies-grid,
        .crm-agencies-grid.edit {
          grid-template-columns: repeat(2,minmax(0,1fr));
        }

        .crm-filter-row {
          align-items: stretch;
        }

        .crm-search {
          min-width: 100%;
        }

        .crm-filter {
          flex: 1;
          min-width: calc(50% - 8px);
        }

        .crm-filter select {
          min-width: 0;
          width: 100%;
        }

        .crm-actions {
          flex-direction: column-reverse;
        }

        .crm-actions .crm-btn {
          width: 100%;
        }

        .crm-drawer {
          width: 100%;
        }

        .crm-summary {
          grid-template-columns: 1fr 1fr;
        }

        .crm-top-table {
          align-items: flex-start;
        }
      }

      @media(max-width: 430px) {
        .crm-agencies-grid,
        .crm-agencies-grid.edit {
          grid-template-columns: 1fr;
        }

        .crm-filter {
          min-width: 100%;
        }

        .crm-summary {
          grid-template-columns: 1fr;
        }

        .crm-header {
          align-items: flex-start;
        }

        .crm-header-icon {
          width: 44px;
          height: 44px;
        }

        .crm-role-list button {
          flex: 1;
          justify-content: center;
        }

        .crm-status-toggle {
          flex-wrap: wrap;
        }

        .crm-status-toggle button {
          flex: 1;
          justify-content: center;
        }
      }
    `}</style>
    );
}

export default function Settings() {
    const { token, user } = useAuth();

    const isAdminUI = useMemo(() => {
        const permisos =
            user?.permisos || [];

        return (
            permisos.includes("ALL") ||
            permisos.includes("USUARIOS_ADMIN")
        );
    }, [user]);

    const [roles, setRoles] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingTable, setLoadingTable] = useState(false);
    const [msg, setMsg] = useState("");

    const [nuevo, setNuevo] = useState({
        nombre: "",
        apellidos: "",
        usuario: "",
        correo: "",
        contrasena: "",
        confirmar: "",
        id_rol: "",
        foto: null,
    });

    const [telefonos, setTelefonos] = useState([""]);
    const [agencias, setAgencias] = useState([]);
    const [estado, setEstado] = useState("Activo");

    const [modalUser, setModalUser] = useState(null);
    const [modalRol, setModalRol] = useState(false);

    const [fAgencia, setFAgencia] = useState("Todas");
    const [fRol, setFRol] = useState("Todos");
    const [fEstado, setFEstado] = useState("Todos");
    const [busqueda, setBusqueda] = useState("");

    const showMsg = text => {
        setMsg(text);

        window.setTimeout(
            () =>
                setMsg(actual =>
                    actual === text
                        ? ""
                        : actual
                ),
            4500
        );
    };

    const cargarUsuarios = useCallback(
        async () => {
            if (!token) return;

            setLoadingTable(true);

            try {
                const access =
                    await obtenerTokenVigente(token);

                const res = await fetch(
                    `${API}/conformidad/api/admin/usuarios/`,
                    {
                        headers: {
                            Authorization: `Bearer ${access}`,
                        },
                    }
                );

                if (!res.ok) {
                    throw new Error(
                        "No se pudieron cargar los usuarios."
                    );
                }

                const data = await res.json();

                const lista = (
                    Array.isArray(data)
                        ? data
                        : data.results || []
                ).map(usuario => ({
                    ...usuario,

                    agencies: Array.isArray(
                        usuario.agencies
                    )
                        ? usuario.agencies
                        : String(
                            usuario.agencia || ""
                        )
                            .split("|")
                            .map(x => x.trim())
                            .filter(Boolean),
                }));

                setUsuarios(lista);
            } catch (error) {
                showMsg(error.message);
            } finally {
                setLoadingTable(false);
            }
        },
        [token]
    );

    useEffect(() => {
        if (
            !token ||
            !isAdminUI
        ) {
            return;
        }

        const cargarRoles = async () => {
            try {
                const access =
                    await obtenerTokenVigente(token);

                const res = await fetch(
                    `${API}/conformidad/api/admin/roles/`,
                    {
                        headers: {
                            Authorization: `Bearer ${access}`,
                        },
                    }
                );

                if (!res.ok) {
                    throw new Error(
                        "No se pudieron cargar los roles."
                    );
                }

                const data =
                    await res.json();

                const lista =
                    Array.isArray(data)
                        ? data
                        : [];

                setRoles(lista);

                if (lista.length) {
                    setNuevo(prev => ({
                        ...prev,
                        id_rol: String(
                            lista[0].id_rol
                        ),
                    }));
                }
            } catch (error) {
                showMsg(error.message);
            }
        };

        cargarRoles();
        cargarUsuarios();
    }, [
        token,
        isAdminUI,
        cargarUsuarios,
    ]);

    const usuarioLimpio =
        nuevo.usuario.trim();

    const correoLimpio =
        nuevo.correo
            .trim()
            .toLowerCase();

    const usuarioDuplicado =
        !!usuarioLimpio &&
        usuarios.some(usuario =>
            String(usuario.usuario || "")
                .trim()
                .toLowerCase() ===
            usuarioLimpio.toLowerCase()
        );

    const correoDuplicado =
        !!correoLimpio &&
        usuarios.some(usuario =>
            String(usuario.correo || "")
                .trim()
                .toLowerCase() ===
            correoLimpio
        );

    const errorUsuario =
        !usuarioLimpio
            ? ""
            : usuarioLimpio.length > 10
                ? "Máximo 10 caracteres."
                : !REGEX_USUARIO.test(usuarioLimpio)
                    ? "Solo letras, números, punto, guion y _."
                    : usuarioDuplicado
                        ? "Este usuario ya existe."
                        : "";

    const errorCorreo =
        !correoLimpio
            ? ""
            : !REGEX_CORREO.test(correoLimpio)
                ? "Correo electrónico inválido."
                : correoDuplicado
                    ? "Este correo ya está registrado."
                    : "";

    const errorTelefono =
        hayTelefonosDuplicados(telefonos)
            ? "No repitas el mismo teléfono dentro de este usuario."
            : telefonoInvalido(telefonos)
                ? `El teléfono ${telefonoInvalido(telefonos)} está incompleto.`
                : "";

    const passwordCoincide =
        !!nuevo.confirmar &&
        nuevo.contrasena ===
        nuevo.confirmar;

    const formularioValido = !!(
        nuevo.nombre.trim() &&
        usuarioLimpio &&
        !errorUsuario &&
        correoLimpio &&
        !errorCorreo &&
        passwordValido(
            nuevo.contrasena
        ) &&
        passwordCoincide &&
        nuevo.id_rol &&
        agencias.length &&
        !errorTelefono
    );

    const limpiar = () => {
        setNuevo({
            nombre: "",
            apellidos: "",
            usuario: "",
            correo: "",
            contrasena: "",
            confirmar: "",
            id_rol: roles[0]
                ? String(roles[0].id_rol)
                : "",
            foto: null,
        });

        setTelefonos([""]);
        setAgencias([]);
        setEstado("Activo");
    };

    const crear = async event => {
        event.preventDefault();

        if (!nuevo.nombre.trim()) {
            return showMsg(
                "Captura el nombre."
            );
        }

        if (!usuarioLimpio) {
            return showMsg(
                "Captura el usuario."
            );
        }

        if (errorUsuario) {
            return showMsg(errorUsuario);
        }

        if (!correoLimpio) {
            return showMsg(
                "Captura el correo electrónico."
            );
        }

        if (errorCorreo) {
            return showMsg(errorCorreo);
        }

        if (
            !passwordValido(
                nuevo.contrasena
            )
        ) {
            return showMsg(
                "La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo."
            );
        }

        if (!passwordCoincide) {
            return showMsg(
                "Las contraseñas no coinciden."
            );
        }

        if (!nuevo.id_rol) {
            return showMsg(
                "Selecciona un rol."
            );
        }

        if (!agencias.length) {
            return showMsg(
                "Selecciona al menos una agencia."
            );
        }

        if (errorTelefono) {
            return showMsg(
                errorTelefono
            );
        }

        setLoading(true);

        const fd =
            new FormData();

        fd.append(
            "nombre",
            nuevo.nombre.trim()
        );

        fd.append(
            "apellidos",
            nuevo.apellidos.trim()
        );

        fd.append(
            "usuario",
            usuarioLimpio
        );

        fd.append(
            "correo",
            correoLimpio
        );

        fd.append(
            "contrasena",
            nuevo.contrasena
        );

        fd.append(
            "id_rol",
            nuevo.id_rol
        );

        fd.append(
            "agencia",
            agencias.join("|")
        );

        fd.append(
            "estado",
            estado
        );

        const telefono =
            limpiarTelefonos(
                telefonos
            ).join("|");

        if (telefono) {
            fd.append(
                "telefono",
                telefono
            );
        }

        if (nuevo.foto) {
            fd.append(
                "foto",
                nuevo.foto
            );
        }

        try {
            const access =
                await obtenerTokenVigente(token);

            const res = await fetch(
                `${API}/conformidad/api/admin/usuarios/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${access}`,
                    },
                    body: fd,
                }
            );

            const data =
                await res.json().catch(
                    () => ({})
                );

            if (!res.ok) {
                throw new Error(
                    mensajeApi(
                        data,
                        "No se pudo crear el usuario."
                    )
                );
            }

            showMsg(
                `✓ Usuario "${usuarioLimpio}" creado correctamente`
            );

            limpiar();
            await cargarUsuarios();
        } catch (error) {
            showMsg(
                error.message ||
                "Error creando usuario."
            );
        } finally {
            setLoading(false);
        }
    };

    const rolesFiltro = useMemo(
        () => [
            "Todos",
            ...new Set(
                usuarios
                    .map(
                        usuario =>
                            usuario.rol ||
                            usuario.nombre_rol
                    )
                    .filter(Boolean)
            ),
        ],
        [usuarios]
    );

    const filtrados = useMemo(() => {
        const query =
            busqueda
                .trim()
                .toLowerCase();

        return usuarios.filter(usuario => {
            const agenciasUsuario =
                Array.isArray(
                    usuario.agencies
                )
                    ? usuario.agencies
                    : [];

            const rol =
                usuario.rol ||
                usuario.nombre_rol ||
                "";

            const estadoUsuario =
                usuario.estado ||
                "Activo";

            const matchAgencia =
                fAgencia === "Todas" ||
                agenciasUsuario.includes(
                    fAgencia
                );

            const matchRol =
                fRol === "Todos" ||
                rol === fRol;

            const matchEstado =
                fEstado === "Todos" ||
                estadoUsuario === fEstado;

            const matchBusqueda =
                !query ||
                [
                    usuario.usuario,
                    `${usuario.nombre || ""} ${usuario.apellidos || ""}`,
                    usuario.correo,
                    usuario.telefono,
                ].some(valor =>
                    String(valor || "")
                        .toLowerCase()
                        .includes(query)
                );

            return (
                matchAgencia &&
                matchRol &&
                matchEstado &&
                matchBusqueda
            );
        });
    }, [
        usuarios,
        fAgencia,
        fRol,
        fEstado,
        busqueda,
    ]);

    if (!isAdminUI) {
        return (
            <PerfilUsuario
                token={token}
                user={user}
            />
        );
    }

    return (
        <div className="crm-page">
            <GlobalStyles />

            <div className="crm-card">
                <div className="crm-header">
                    <div className="crm-header-icon">
                        <Users size={26} />
                    </div>

                    <div>
                        <h2>
                            Gestión de usuarios
                        </h2>

                        <Link to="/">
                            <ArrowLeft size={12} />
                            Volver
                        </Link>
                    </div>
                </div>

                <form
                    className="crm-form"
                    onSubmit={crear}
                >
                    <div className="crm-grid-3">
                        <InputCampo
                            icon={User}
                            label="Nombre(s)"
                            value={nuevo.nombre}
                            onChange={e =>
                                setNuevo(prev => ({
                                    ...prev,
                                    nombre:
                                        e.target.value,
                                }))
                            }
                            placeholder="Ej. Juan Carlos"
                        />

                        <InputCampo
                            icon={User}
                            label="Apellidos"
                            value={nuevo.apellidos}
                            onChange={e =>
                                setNuevo(prev => ({
                                    ...prev,
                                    apellidos:
                                        e.target.value,
                                }))
                            }
                            placeholder="Ej. Pérez García"
                        />

                        <InputCampo
                            icon={AtSign}
                            label="Usuario"
                            value={nuevo.usuario}
                            onChange={e =>
                                setNuevo(prev => ({
                                    ...prev,
                                    usuario:
                                        e.target.value,
                                }))
                            }
                            placeholder="Máximo 10 caracteres"
                            error={errorUsuario}
                            correcto={
                                usuarioLimpio &&
                                    !errorUsuario
                                    ? "✓ Usuario disponible"
                                    : ""
                            }
                            contador={`${nuevo.usuario.length}/10`}
                        />

                        <InputCampo
                            icon={Mail}
                            label="Correo electrónico"
                            type="email"
                            value={nuevo.correo}
                            onChange={e =>
                                setNuevo(prev => ({
                                    ...prev,
                                    correo:
                                        e.target.value,
                                }))
                            }
                            placeholder="correo@ejemplo.com"
                            error={errorCorreo}
                            correcto={
                                correoLimpio &&
                                    !errorCorreo
                                    ? "✓ Correo disponible"
                                    : ""
                            }
                        />

                        <PasswordCampo
                            label="Contraseña"
                            value={nuevo.contrasena}
                            onChange={e =>
                                setNuevo(prev => ({
                                    ...prev,
                                    contrasena:
                                        e.target.value,
                                }))
                            }
                            placeholder="Mínimo 8 caracteres"
                        />

                        <PasswordCampo
                            label="Confirmar contraseña"
                            value={nuevo.confirmar}
                            onChange={e =>
                                setNuevo(prev => ({
                                    ...prev,
                                    confirmar:
                                        e.target.value,
                                }))
                            }
                            placeholder="Repite la contraseña"
                            error={
                                nuevo.confirmar &&
                                    !passwordCoincide
                                    ? "Las contraseñas no coinciden."
                                    : ""
                            }
                        />
                    </div>

                    <RequisitosPassword
                        value={nuevo.contrasena}
                    />

                    <div className="crm-block">
                        <TelefonosMultiples
                            telefonos={telefonos}
                            onChange={setTelefonos}
                        />
                    </div>

                    <div
                        style={{
                            marginBottom: 20,
                        }}
                    >
                        <RolToggle
                            value={nuevo.id_rol}
                            onChange={valor =>
                                setNuevo(prev => ({
                                    ...prev,
                                    id_rol: valor,
                                }))
                            }
                            roles={roles}
                            onNuevoRol={() =>
                                setModalRol(true)
                            }
                        />
                    </div>

                    <div
                        className="crm-grid-2"
                        style={{
                            alignItems: "start",
                            marginBottom: 20,
                        }}
                    >
                        <EstadoToggle
                            value={estado}
                            onChange={setEstado}
                        />

                        <label>
                            <Label>
                                Foto de perfil{" "}
                                <small
                                    style={{
                                        color: "#94a3b8",
                                        fontWeight: 400,
                                    }}
                                >
                                    (opcional)
                                </small>
                            </Label>

                            <div
                                className="crm-upload"
                                style={{
                                    marginTop: 6,
                                }}
                            >
                                <Upload size={16} />

                                <span>
                                    {nuevo.foto
                                        ? nuevo.foto.name
                                        : "Seleccionar imagen"
                                    }
                                </span>

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e =>
                                        setNuevo(prev => ({
                                            ...prev,
                                            foto:
                                                e.target
                                                    .files?.[0] ||
                                                null,
                                        }))
                                    }
                                />
                            </div>
                        </label>
                    </div>

                    <div>
                        <div className="crm-phone-header">
                            <div>
                                <Building2
                                    size={14}
                                    style={{
                                        verticalAlign: -2,
                                        marginRight: 5,
                                    }}
                                />

                                <Label>
                                    Agencia(s)
                                </Label>
                            </div>

                            <button
                                type="button"
                                className="crm-secondary-small"
                                onClick={() =>
                                    setAgencias(
                                        agencias.length ===
                                            AGENCIAS.length
                                            ? []
                                            : [...AGENCIAS]
                                    )
                                }
                            >
                                {agencias.length ===
                                    AGENCIAS.length
                                    ? "Deseleccionar todas"
                                    : "Seleccionar todas"
                                }

                                <ChevronDown size={12} />
                            </button>
                        </div>

                        <div className="crm-agencies-grid">
                            {AGENCIAS.map(agencia => (
                                <AgencyCheck
                                    key={agencia}
                                    label={agencia}
                                    checked={
                                        agencias.includes(
                                            agencia
                                        )
                                    }
                                    onChange={() =>
                                        setAgencias(prev =>
                                            prev.includes(
                                                agencia
                                            )
                                                ? prev.filter(
                                                    item =>
                                                        item !==
                                                        agencia
                                                )
                                                : [
                                                    ...prev,
                                                    agencia,
                                                ]
                                        )
                                    }
                                />
                            ))}
                        </div>
                    </div>

                    <div
                        style={{
                            marginTop: 18,
                        }}
                    >
                        <Alerta mensaje={msg} />
                    </div>

                    <div className="crm-actions">
                        <button
                            type="button"
                            className="crm-btn secondary"
                            disabled={loading}
                            onClick={limpiar}
                        >
                            Limpiar
                        </button>

                        <button
                            type="submit"
                            className="crm-btn primary"
                            disabled={loading}
                            title={
                                formularioValido
                                    ? "Datos validados"
                                    : "Pulsa para ver qué dato falta"
                            }
                        >
                            <Plus size={14} />

                            {loading
                                ? "Creando..."
                                : "Crear usuario"
                            }
                        </button>
                    </div>
                </form>
            </div>

            <section
                style={{
                    marginBottom: 24,
                }}
            >
                <div className="crm-top-table">
                    <div>
                        <h3>Usuarios</h3>

                        <p>
                            Doble clic para editar. La búsqueda también revisa teléfonos.
                        </p>
                    </div>

                    <button
                        className="crm-btn secondary"
                        onClick={cargarUsuarios}
                        disabled={loadingTable}
                    >
                        <RefreshCw size={13} />

                        {loadingTable
                            ? "Actualizando..."
                            : "Actualizar"
                        }
                    </button>
                </div>

                <div className="crm-filter-row">
                    <label className="crm-search">
                        <Label>Buscar</Label>

                        <div
                            style={{
                                position: "relative",
                                marginTop: 5,
                            }}
                        >
                            <Search
                                size={13}
                                style={{
                                    position: "absolute",
                                    left: 10,
                                    top: 12,
                                    color: "#94a3b8",
                                }}
                            />

                            <input
                                value={busqueda}
                                onChange={e =>
                                    setBusqueda(
                                        e.target.value
                                    )
                                }
                                placeholder="Usuario, nombre, correo o teléfono..."
                                style={{
                                    ...inputBase(),
                                    paddingLeft: 32,
                                }}
                            />
                        </div>
                    </label>

                    {[
                        [
                            "Agencia",
                            fAgencia,
                            setFAgencia,
                            ["Todas", ...AGENCIAS],
                        ],
                        [
                            "Rol",
                            fRol,
                            setFRol,
                            rolesFiltro,
                        ],
                        [
                            "Estado",
                            fEstado,
                            setFEstado,
                            [
                                "Todos",
                                "Activo",
                                "Inactivo",
                            ],
                        ],
                    ].map(
                        ([
                            label,
                            value,
                            setter,
                            options,
                        ]) => (
                            <label
                                className="crm-filter"
                                key={label}
                            >
                                <Label>
                                    {label}
                                </Label>

                                <select
                                    value={value}
                                    onChange={e =>
                                        setter(
                                            e.target.value
                                        )
                                    }
                                    style={inputBase()}
                                >
                                    {options.map(option => (
                                        <option
                                            key={option}
                                        >
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )
                    )}

                    {(busqueda ||
                        fAgencia !== "Todas" ||
                        fRol !== "Todos" ||
                        fEstado !== "Todos") && (
                            <button
                                className="crm-btn secondary"
                                onClick={() => {
                                    setBusqueda("");
                                    setFAgencia("Todas");
                                    setFRol("Todos");
                                    setFEstado("Todos");
                                }}
                            >
                                Limpiar filtros
                            </button>
                        )}

                    <span
                        style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            color: "#94a3b8",
                        }}
                    >
                        {filtrados.length} de{" "}
                        {usuarios.length}
                    </span>
                </div>

                {loadingTable ? (
                    <div
                        className="crm-card"
                        style={{
                            padding: 34,
                            textAlign: "center",
                            color: "#94a3b8",
                        }}
                    >
                        Cargando usuarios...
                    </div>
                ) : (
                    <TablaUsuarios
                        users={filtrados}
                        onEdit={setModalUser}
                    />
                )}
            </section>

            <div
                className="crm-card"
                style={{
                    padding: 20,
                }}
            >
                <div className="crm-summary">
                    <div>
                        <span>
                            Total usuarios
                        </span>

                        <strong>
                            {usuarios.length}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Agencias
                        </span>

                        <strong>
                            {AGENCIAS.length}
                        </strong>
                    </div>
                </div>
            </div>

            {modalUser && (
                <UserModal
                    user={modalUser}
                    usuarios={usuarios}
                    roles={roles}
                    token={token}
                    onClose={() =>
                        setModalUser(null)
                    }
                    onSaved={cargarUsuarios}
                />
            )}

            {modalRol && (
                <NuevoRolModal
                    token={token}
                    onClose={() =>
                        setModalRol(false)
                    }
                    onCreado={rol => {
                        setRoles(prev => [
                            ...prev,
                            rol,
                        ]);

                        setNuevo(prev => ({
                            ...prev,
                            id_rol: String(
                                rol.id_rol
                            ),
                        }));
                    }}
                />
            )}
        </div>
    );
}