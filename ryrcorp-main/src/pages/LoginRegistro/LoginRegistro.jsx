//src/pages/LoginRegistro/LoginRegistro.jsx
import { useEffect, useMemo, useState } from "react";
import {
    Eye,
    EyeOff,
    User,
    Lock,
    Mail,
    Building2,
    ShieldCheck,
    ArrowRight,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";

import vwWhite from "../../assets/vw_white.png";
import ryrBlue from "../../assets/ryr_blue.png";
import fondo4 from "../../assets/fondo4.jpg";
import fondo3 from "../../assets/fondo3.jpg";

const BRAND_BLUE = "#0B1F5E";
const BRAND_BLUE_2 = "#153A8A";
const BRAND_LIGHT = "#DDE8FF";
const BRAND_SILVER = "#E8EDF5";

const API = import.meta.env.VITE_API_URL || "https://crm.grupoautomotrizryr.com";

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
    "Chirey",
    "JAECOO R&R",
];

function preloadImages(images = []) {
    images.forEach((src) => {
        const img = new Image();
        img.src = src;
    });
}

function Field({ label, icon: Icon, children, hint }) {
    return (
        <div className="group rounded-2xl border border-white/70 bg-white/90 p-3 shadow-[0_10px_30px_rgba(11,31,94,0.08)] backdrop-blur-sm transition duration-300 hover:border-[#0B1F5E]/20 hover:shadow-[0_16px_40px_rgba(11,31,94,0.12)]">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[13px] font-extrabold tracking-[0.18em] text-[#0B1F5E]">
                    {Icon ? <Icon className="h-4 w-4 text-[#0B1F5E]" /> : null}
                    <span>{label}</span>
                </div>
                {hint ? (
                    <span className="text-[10px] font-semibold text-slate-400">{hint}</span>
                ) : null}
            </div>
            {children}
        </div>
    );
}

function PasswordInput({
    value,
    onChange,
    show,
    onToggle,
    placeholder = "••••••••",
    required = false,
}) {
    return (
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={onChange}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 pr-11 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#153A8A]/40 focus:bg-white focus:ring-4 focus:ring-[#153A8A]/10"
                placeholder={placeholder}
                required={required}
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#0B1F5E]"
                aria-label="Mostrar u ocultar contraseña"
            >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}

function TextInput({
    type = "text",
    value,
    onChange,
    placeholder,
    required = false,
    autoComplete,
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete={autoComplete}
            required={required}
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#153A8A]/40 focus:bg-white focus:ring-4 focus:ring-[#153A8A]/10"
        />
    );
}

export default function LoginRegistro() {
    const [tab, setTab] = useState("login");
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const from = location.state?.from?.pathname || "/";

    const [formLogin, setFormLogin] = useState({
        usuario: "",
        contrasena: "",
    });

    const [formRegistro, setFormRegistro] = useState({
        nombre: "",
        apellidos: "",
        usuario: "",
        correo: "",
        agencia: "",
        contrasena: "",
        contrasenaConfirmada: "",
    });

    useEffect(() => {
        preloadImages([fondo3, fondo4]);
    }, []);

    const panelData = useMemo(() => {
        if (tab === "login") {
            return {
                imagen: fondo4,
                eyebrow: "Acceso corporativo",
                title: "Conecta con tu operación comercial.",
                description:
                    "Accede al CRM con una experiencia alineada al estándar automotriz del grupo.",
                bullets: [
                    "Seguimiento centralizado de prospectos y clientes"
                ],
            };
        }

        return {
            imagen: fondo3,
            eyebrow: "Nuevo acceso",
            title: "Activa tu cuenta y entra al ecosistema comercial.",
            description:
                "Registra tu perfil para comenzar a operar dentro del CRM.",
            bullets: [
                "Registro sencillo",
                "Asignación por agencia",
            ],
        };
    }, [tab]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`${API}/conformidad/api/auth/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    // SimpleJWT normalmente usa estos campos:
                    username: formLogin.usuario,
                    password: formLogin.contrasena,

                    // Compatibilidad con tu login viejo:
                    usuario: formLogin.usuario,
                    contrasena: formLogin.contrasena,
                }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                console.error("Error login:", data);
                alert(data?.detail || data?.error || "Credenciales inválidas.");
                return;
            }

            console.log("Respuesta login:", data);

            const access = data.access || data.access_token || "";
            const refresh = data.refresh || data.refresh_token || "";

            const legacyToken = data.token || access;

            if (!access) {
                console.error("El backend no devolvió access JWT:", data);
                alert(
                    "El login fue exitoso, pero el backend no devolvió access JWT. Hay que corregir el endpoint de login."
                );
                return;
            }

            const user =
                data.user ||
                data.usuario ||
                {
                    usuario: formLogin.usuario,
                    username: formLogin.usuario,
                    permisos: data.permisos || [],
                    rol: data.rol || "",
                    agencia: data.agencia || "",
                    telefono: data.telefono || "",
                };

            localStorage.setItem("@token_access_jwt", access);
            localStorage.setItem("auth.access", access);
            localStorage.setItem("access", access);

            if (refresh) {
                localStorage.setItem("@token_refresh_jwt", refresh);
                localStorage.setItem("auth.refresh", refresh);
                localStorage.setItem("refresh", refresh);
            }

            localStorage.setItem(
                "auth",
                JSON.stringify({
                    token: legacyToken,
                    access,
                    ...(refresh ? { refresh } : {}),
                    user,
                })
            );

            localStorage.setItem("crm.user", JSON.stringify(user));
            localStorage.setItem("user", JSON.stringify(user));

            login({
                token: legacyToken,
                access,
                refresh,
                user,
            });

            navigate(from, { replace: true });
        } catch (error) {
            console.error(error);
            alert("No se pudo iniciar sesión.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegistro = async (e) => {
        e.preventDefault();

        if (formRegistro.contrasena !== formRegistro.contrasenaConfirmada) {
            alert("Las contraseñas no coinciden.");
            return;
        }

        if (!formRegistro.agencia) {
            alert("Selecciona una agencia.");
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                nombre: formRegistro.nombre,
                apellidos: formRegistro.apellidos,
                usuario: formRegistro.usuario,
                correo: formRegistro.correo,
                contrasena: formRegistro.contrasena,
                agencia: formRegistro.agencia,
            };

            const res = await fetch(`${API}/conformidad/api/auth/register/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (res.status === 201) {
                alert("Registro exitoso, ahora puedes iniciar sesión.");
                setTab("login");
                setFormLogin({ usuario: payload.usuario, contrasena: "" });
                setFormRegistro((prev) => ({
                    ...prev,
                    contrasena: "",
                    contrasenaConfirmada: "",
                }));
            } else {
                alert(data?.detail || JSON.stringify(data));
            }
        } catch (error) {
            console.error(error);
            alert("No se pudo completar el registro.");
        } finally {
            setIsLoading(false);
        }
    };

    const transition = {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#06102D]">
            {/* Fondo general */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(44,91,187,0.24),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.10),_transparent_28%)]" />
                <div className="absolute left-[-12%] top-[-8%] rounded-full bg-[#2A63FF]/10 blur-3xl" />
                <div className="absolute bottom-[-12%] right-[-10%] rounded-full bg-white/10 blur-3xl" />
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(6,16,45,0.96),rgba(11,31,94,0.92),rgba(7,16,38,0.98))]" />
            </div>

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
                <motion.div
                    initial={{ opacity: 0, y: 18, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-7xl overflow-hidden rounded-[30px] border border-white/10 bg-white/8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
                >
                    <div className="grid min-h-[760px] grid-cols-1 lg:grid-cols-[1.15fr_0.95fr]">
                        {/* Panel visual */}
                        <div className="relative hidden overflow-hidden lg:block">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={panelData.imagen}
                                    initial={{ opacity: 0, scale: 1.04 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.02 }}
                                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                                    className="absolute inset-0"
                                >
                                    <img
                                        src={panelData.imagen}
                                        alt="Volkswagen background"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,16,45,0.30),rgba(6,16,45,0.60),rgba(4,10,28,0.86))]" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(221,232,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(21,58,138,0.25),transparent_28%)]" />
                                </motion.div>
                            </AnimatePresence>

                            <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
                                <div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.08, ...transition }}
                                        className="flex items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white backdrop-blur-md">
                                                <img
                                                    src={ryrBlue}
                                                    alt="Grupo Automotriz R&R"
                                                    className="h-14 w-14 object-contain p-1"
                                                />
                                            </div>

                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-[0.24em] text-white/65">
                                                    Grupo Automotriz R&amp;R
                                                </div>
                                                <div className="mt-1 text-lg font-semibold text-white">
                                                    CRM Corporativo
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 backdrop-blur-md">
                                            <img
                                                src={vwWhite}
                                                alt="Volkswagen"
                                                className="h-9 w-auto opacity-95"
                                            />
                                            <div className="h-7 w-px bg-white/15" />
                                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">
                                                Volkswagen
                                            </span>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        key={tab + "-hero"}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.12, ...transition }}
                                        className="mt-38 max-w-xl"
                                    >
                                        <h1 className="mt-6 text-4xl font-black leading-tight text-white xl:text-5xl">
                                            {panelData.title}
                                        </h1>

                                        <p className="mt-5 max-w-lg text-base leading-7 text-white/78">
                                            {panelData.description}
                                        </p>

                                        <div className="mt-8 grid gap-3">
                                            {panelData.bullets.map((item) => (
                                                <div
                                                    key={item}
                                                    className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-sm font-medium text-white/88 backdrop-blur-md"
                                                >
                                                    <div className="h-2.5 w-2.5 rounded-full bg-[#DDE8FF]" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, ...transition }}
                                    className="flex items-end justify-between gap-6"
                                >

                                    <div className="text-right text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                                        Acceso interno · Personal autorizado
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Panel formulario */}
                        <div className="relative flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-10">
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,247,252,0.94))] lg:bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,247,251,0.96))]" />

                            <div className="relative z-10 w-full max-w-xl">
                                <div className="mb-6 flex items-center justify-between lg:hidden">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={ryrBlue}
                                            alt="R&R"
                                            className="h-11 w-11 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
                                        />
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                                Grupo Automotriz R&amp;R
                                            </div>
                                            <div className="text-base font-extrabold text-[#0B1F5E]">
                                                CRM Corporativo
                                            </div>
                                        </div>
                                    </div>

                                    <img
                                        src={vwWhite}
                                        alt="Volkswagen"
                                        className="h-9 rounded-xl bg-[#0B1F5E] px-2 py-1"
                                    />
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="rounded-[28px] border border-slate-200/80 bg-white/80 p-4 shadow-[0_20px_50px_rgba(11,31,94,0.12)] backdrop-blur-xl sm:p-6 md:p-7"
                                >
                                    <div className="mb-6 flex justify-center">
                                        <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100/90 p-1.5 shadow-inner">
                                            <button
                                                type="button"
                                                onClick={() => setTab("login")}
                                                className={`relative rounded-xl px-5 py-2.5 text-sm font-extrabold transition ${tab === "login"
                                                    ? "bg-white text-[#0B1F5E] shadow-sm"
                                                    : "text-slate-500 hover:text-[#0B1F5E]"
                                                    }`}
                                            >
                                                Iniciar sesión
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTab("registro")}
                                                className={`relative rounded-xl px-5 py-2.5 text-sm font-extrabold transition ${tab === "registro"
                                                    ? "bg-white text-[#0B1F5E] shadow-sm"
                                                    : "text-slate-500 hover:text-[#0B1F5E]"
                                                    }`}
                                            >
                                                Crear cuenta
                                            </button>
                                        </div>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {tab === "login" ? (
                                            <motion.form
                                                key="login-form"
                                                initial={{ opacity: 0, y: 18 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -14 }}
                                                transition={transition}
                                                onSubmit={handleLogin}
                                                className="mx-auto w-full max-w-md"
                                            >
                                                <div className="mb-6 text-center">
                                                    <div className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#153A8A]">
                                                        Bienvenido
                                                    </div>
                                                    <h2 className="mt-2 text-3xl font-black text-[#0B1F5E]">
                                                        Inicia sesión
                                                    </h2>
                                                </div>

                                                <div className="space-y-4">
                                                    <Field label="Usuario" icon={User}>
                                                        <TextInput
                                                            value={formLogin.usuario}
                                                            onChange={(e) =>
                                                                setFormLogin((prev) => ({
                                                                    ...prev,
                                                                    usuario: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Ingresa tu usuario"
                                                            required
                                                            autoComplete="username"
                                                        />
                                                    </Field>

                                                    <Field label="Contraseña" icon={Lock}>
                                                        <PasswordInput
                                                            value={formLogin.contrasena}
                                                            onChange={(e) =>
                                                                setFormLogin((prev) => ({
                                                                    ...prev,
                                                                    contrasena: e.target.value,
                                                                }))
                                                            }
                                                            show={showLoginPassword}
                                                            onToggle={() =>
                                                                setShowLoginPassword((prev) => !prev)
                                                            }
                                                            required
                                                        />
                                                    </Field>

                                                    <motion.button
                                                        whileHover={{ y: -1, scale: 1.01 }}
                                                        whileTap={{ scale: 0.99 }}
                                                        type="submit"
                                                        className="group mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0B1F5E,#153A8A)] px-5 text-sm font-extrabold text-white shadow-[0_18px_35px_rgba(11,31,94,0.28)] transition hover:shadow-[0_24px_45px_rgba(11,31,94,0.34)]"
                                                    >
                                                        Entrar al CRM
                                                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                                                    </motion.button>
                                                </div>
                                            </motion.form>
                                        ) : (
                                            <motion.form
                                                key="registro-form"
                                                initial={{ opacity: 0, y: 18 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -14 }}
                                                transition={transition}
                                                onSubmit={handleRegistro}
                                                className="mx-auto w-full max-w-xl"
                                            >
                                                <div className="mb-6 text-center">
                                                    <div className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#153A8A]">
                                                        Alta de usuario
                                                    </div>
                                                    <h2 className="mt-2 text-3xl font-black text-[#0B1F5E]">
                                                        Crea tu cuenta
                                                    </h2>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <Field label="Nombre(s)" icon={User}>
                                                        <TextInput
                                                            value={formRegistro.nombre}
                                                            onChange={(e) =>
                                                                setFormRegistro((prev) => ({
                                                                    ...prev,
                                                                    nombre: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Nombre(s)"
                                                            required
                                                            autoComplete="given-name"
                                                        />
                                                    </Field>

                                                    <Field label="Apellidos" icon={User}>
                                                        <TextInput
                                                            value={formRegistro.apellidos}
                                                            onChange={(e) =>
                                                                setFormRegistro((prev) => ({
                                                                    ...prev,
                                                                    apellidos: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Apellidos"
                                                            required
                                                            autoComplete="family-name"
                                                        />
                                                    </Field>
                                                </div>

                                                <div className="mt-4 space-y-4">
                                                    <Field label="Nombre de usuario" icon={User}>
                                                        <TextInput
                                                            value={formRegistro.usuario}
                                                            onChange={(e) =>
                                                                setFormRegistro((prev) => ({
                                                                    ...prev,
                                                                    usuario: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Usuario"
                                                            required
                                                            autoComplete="username"
                                                        />
                                                    </Field>

                                                    <Field label="Correo electrónico" icon={Mail}>
                                                        <TextInput
                                                            type="email"
                                                            value={formRegistro.correo}
                                                            onChange={(e) =>
                                                                setFormRegistro((prev) => ({
                                                                    ...prev,
                                                                    correo: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="correo@empresa.com"
                                                            required
                                                            autoComplete="email"
                                                        />
                                                    </Field>

                                                    <Field
                                                        label="Agencia"
                                                        icon={Building2}
                                                        hint="Obligatorio"
                                                    >
                                                        <select
                                                            value={formRegistro.agencia}
                                                            onChange={(e) =>
                                                                setFormRegistro((prev) => ({
                                                                    ...prev,
                                                                    agencia: e.target.value,
                                                                }))
                                                            }
                                                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#153A8A]/40 focus:bg-white focus:ring-4 focus:ring-[#153A8A]/10"
                                                            required
                                                        >
                                                            <option value="" disabled>
                                                                Selecciona una agencia...
                                                            </option>
                                                            {DEALERS.map((dealer) => (
                                                                <option key={dealer} value={dealer}>
                                                                    {dealer}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </Field>

                                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                        <Field label="Contraseña" icon={Lock}>
                                                            <PasswordInput
                                                                value={formRegistro.contrasena}
                                                                onChange={(e) =>
                                                                    setFormRegistro((prev) => ({
                                                                        ...prev,
                                                                        contrasena:
                                                                            e.target.value,
                                                                    }))
                                                                }
                                                                show={showRegisterPassword}
                                                                onToggle={() =>
                                                                    setShowRegisterPassword(
                                                                        (prev) => !prev
                                                                    )
                                                                }
                                                                required
                                                            />
                                                        </Field>

                                                        <Field label="Confirmar contraseña" icon={Lock}>
                                                            <PasswordInput
                                                                value={
                                                                    formRegistro.contrasenaConfirmada
                                                                }
                                                                onChange={(e) =>
                                                                    setFormRegistro((prev) => ({
                                                                        ...prev,
                                                                        contrasenaConfirmada:
                                                                            e.target.value,
                                                                    }))
                                                                }
                                                                show={showRegisterPassword}
                                                                onToggle={() =>
                                                                    setShowRegisterPassword(
                                                                        (prev) => !prev
                                                                    )
                                                                }
                                                                required
                                                            />
                                                        </Field>
                                                    </div>

                                                    <motion.button
                                                        whileHover={{ y: -1, scale: 1.01 }}
                                                        whileTap={{ scale: 0.99 }}
                                                        type="submit"
                                                        className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0B1F5E,#153A8A)] px-5 text-sm font-extrabold text-white shadow-[0_18px_35px_rgba(11,31,94,0.28)] transition hover:shadow-[0_24px_45px_rgba(11,31,94,0.34)]"
                                                    >
                                                        Crear cuenta
                                                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                                                    </motion.button>
                                                </div>
                                            </motion.form>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#06102D]/35 backdrop-blur-sm">
                            <div className="rounded-3xl border border-white/20 bg-white/85 px-8 py-7 shadow-2xl">
                                <div className="flex flex-col items-center gap-3">
                                    <Bouncy size="48" speed="1.55" color={BRAND_BLUE} />
                                    <div className="text-sm font-bold text-[#0B1F5E]">
                                        Procesando...
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Precarga adicional invisible para asegurar cache visual */}
            <div className="pointer-events-none absolute -left-[9999px] -top-[9999px] opacity-0">
                <img src={fondo3} alt="preload fondo 3" />
                <img src={fondo4} alt="preload fondo 4" />
            </div>
        </div>
    );
}