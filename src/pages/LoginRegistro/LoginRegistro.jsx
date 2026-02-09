import { useMemo, useState } from "react";
import { Eye, EyeOff, User, Lock, Mail, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bouncy } from "ldrs/react";
import "ldrs/react/Bouncy.css";

const BRAND_BLUE = "#131E5C";
const API = import.meta.env.VITE_API_URL || "https://rhi4i2-ip-187-148-222-77.tunnelmole.net";

const DEALERS = [
    "VW Cordoba",
    "VW Orizaba",
    "VW Poza Rica",
    "VW Tuxtepec",
    "VW Tuxpan",
    "Chirey",
    "JAECOO R&R",
];

function Field({ label, icon: Icon, children }) {
    return (
        <div className="rounded-lg border border-black/10 bg-white p-3 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-xs font-extrabold  text[#131E5C]">
                {Icon ? <Icon className="h-4 w-4 text[#131E5C]" /> : null}
                <span>{label}</span>
            </div>
            {children}
        </div>
    );
}

export default function LoginRegistro() {
    const [tab, setTab] = useState("login"); // "login" | "registro"
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const [formLogin, setFormLogin] = useState({ usuario: "", contrasena: "" });
    const [formRegistro, setFormRegistro] = useState({
        nombre: "",
        apellidos: "",
        usuario: "",
        correo: "",
        agencia: "",
        contrasena: "",
        contrasenaConfirmada: "",
    });

    const subtitle = useMemo(() => {
        return tab === "login"
            ? "Ingresa con tu usuario y contraseña para acceder al CRM."
            : "Crea tu cuenta para poder acceder al CRM.";
    }, [tab]);

    const imagenFondo = useMemo(() => {
        return tab === "login"
            ? "/fondo4.jpg"
            : "/fondo3.jpg";
    }, [tab]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch(`${API}/conformidad/api/auth/login/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formLogin),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(data?.detail || "Credenciales inválidas.");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario", JSON.stringify(data.user));
            navigate("/");
        } catch (err) {
            console.error(err);
            alert("No se pudo iniciar sesión.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegistro = async (e) => {
        e.preventDefault();

        if (formRegistro.contrasena !== formRegistro.contrasenaConfirmada) {
            alert("Las contraseñas no coinciden");
            return;
        }
        if (!formRegistro.agencia) {
            alert("Selecciona una agencia");
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
            } else {
                alert(data?.detail || JSON.stringify(data));
            }
        } catch (err) {
            console.error(err);
            alert("No se pudo completar el registro.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
            <div className="relative w-full max-w-5xl overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl">
                <div
                    className="px-6 py-5 text-white"
                    style={{ backgroundColor: BRAND_BLUE }}
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <img src="/ryr_blue.png" alt="R&R" className="h-10 w-10 rounded-full bg-neutral-100 p-1" />
                            <div className="min-w-0">
                                <div className="truncate text-lg font-extrabold">
                                    Grupo Automotriz R&R
                                </div>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-3">
                            <img src="/vw_white.png" alt="VW" className="h-10 opacity-90" />
                            <div className="h-8 w-px bg-white/25" />
                            <span className="text-xs font-semibold text-white/80">Gestion R&R</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Panel izquierdo */}
                    <div className="hidden md:flex relative flex-col justify-between p-10 text-white overflow-hidden">
                        <img
                            src={imagenFondo}
                            alt="Agencia"
                            className="absolute inset-0 h-full w-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#131E5C]/40 via-[#131E5C]/45 to-[#0B123A]/55" />

                        {/* Contenido */}
                        <div className="relative">
                            <h3 className="mt-10 text-3xl font-extrabold leading-tight">
                                {subtitle}
                            </h3>

                        </div>

                        <div className="relative text-xs text-white/60">
                            Acceso interno • Personal autorizado
                        </div>
                    </div>


                    {/* Panel derecho */}
                    <div className="p-6 sm:p-10">
                        <div className="mb-6 flex justify-center">
                            <div className="inline-flex rounded-lg border border-black/10 bg-slate-100 p-1">
                                <button
                                    onClick={() => setTab("login")}
                                    className={[
                                        "px-4 py-2 text-sm font-extrabold rounded-lg transition",
                                        tab === "login"
                                            ? "bg-white shadow text-slate-900"
                                            : "text-slate-600 hover:text-slate-900",
                                    ].join(" ")}
                                >
                                    Iniciar sesión
                                </button>
                                <button
                                    onClick={() => setTab("registro")}
                                    className={[
                                        "px-4 py-2 text-sm font-extrabold rounded-lg transition",
                                        tab === "registro"
                                            ? "bg-white shadow text-slate-900"
                                            : "text-slate-600 hover:text-slate-900",
                                    ].join(" ")}
                                >
                                    Crear cuenta
                                </button>
                            </div>
                        </div>

                        {tab === "login" ? (
                            <form onSubmit={handleLogin} className="mx-auto w-full max-w-md space-y-3">
                                <div className="text-center">
                                    <div className="text-2xl font-extrabold text-slate-900">Bienvenido</div>
                                    <div className="text-sm text-slate-500">Inicia sesión para continuar</div>
                                </div>

                                <Field label="Usuario" icon={User}>
                                    <input
                                        value={formLogin.usuario}
                                        onChange={(e) => setFormLogin((p) => ({ ...p, usuario: e.target.value }))}
                                        className="w-full rounded-lg border border-black/10 bg-slate-50 px-3 text[#131E5C] py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                                        placeholder="usuario"
                                        required
                                    />
                                </Field>

                                <Field label="Contraseña" icon={Lock}>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={formLogin.contrasena}
                                            onChange={(e) => setFormLogin((p) => ({ ...p, contrasena: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-slate-50 px-3 text[#131E5C] py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((s) => !s)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                            aria-label="Mostrar/ocultar contraseña"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </Field>

                                <button
                                    type="submit"
                                    className="w-full rounded-lg py-3 text-sm font-extrabold text-white shadow-lg hover:brightness-110"
                                    style={{ backgroundColor: BRAND_BLUE }}
                                >
                                    Entrar
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegistro} className="mx-auto w-full max-w-lg space-y-3">
                                <div className="text-center">
                                    <div className="text-2xl font-extrabold text-slate-900">Crear cuenta</div>
                                    <div className="text-sm text-slate-500">
                                        Registrate para probar la <b>web</b>.
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field label="Nombre(s)" icon={User}>
                                        <input
                                            value={formRegistro.nombre}
                                            onChange={(e) => setFormRegistro((p) => ({ ...p, nombre: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-slate-50 px-3 text[#131E5C] py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                                            required
                                        />
                                    </Field>

                                    <Field label="Apellidos" icon={User}>
                                        <input
                                            value={formRegistro.apellidos}
                                            onChange={(e) => setFormRegistro((p) => ({ ...p, apellidos: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-slate-50 px-3 text[#131E5C] py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                                            required
                                        />
                                    </Field>
                                </div>

                                <Field label="Nombre de Usuario" icon={User}>
                                    <input
                                        value={formRegistro.usuario}
                                        onChange={(e) => setFormRegistro((p) => ({ ...p, usuario: e.target.value }))}
                                        className="w-full rounded-lg border border-black/10 bg-slate-50 px-3 text[#131E5C] py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                                        required
                                    />
                                </Field>

                                <Field label="Correo" icon={Mail}>
                                    <input
                                        type="email"
                                        value={formRegistro.correo}
                                        onChange={(e) => setFormRegistro((p) => ({ ...p, correo: e.target.value }))}
                                        className="w-full rounded-lg border border-black/10 bg-slate-50 px-3 text[#131E5C] py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                                        required
                                    />
                                </Field>

                                <Field label="Agencia" icon={Building2}>
                                    <select
                                        value={formRegistro.agencia}
                                        onChange={(e) => setFormRegistro((p) => ({ ...p, agencia: e.target.value }))}
                                        className="w-full rounded-lg border border-black/10 bg-slate-50 px-3 text[#131E5C] py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                                        required
                                    >
                                        <option value="" disabled>Selecciona una agencia...</option>
                                        {DEALERS.map((d) => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </Field>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field label="Contraseña" icon={Lock}>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={formRegistro.contrasena}
                                                onChange={(e) => setFormRegistro((p) => ({ ...p, contrasena: e.target.value }))}
                                                className="w-full rounded-lg border border-black/10 bg-slate-50 px-3 text[#131E5C] py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((s) => !s)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                                aria-label="Mostrar/ocultar contraseña"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </Field>

                                    <Field label="Confirmar" icon={Lock}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={formRegistro.contrasenaConfirmada}
                                            onChange={(e) => setFormRegistro((p) => ({ ...p, contrasenaConfirmada: e.target.value }))}
                                            className="w-full rounded-lg border border-black/10 bg-slate-50 px-3 text[#131E5C] py-2 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                                            required
                                        />
                                    </Field>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full rounded-lg py-3 text-sm font-extrabold text-white shadow-lg hover:brightness-110"
                                    style={{ backgroundColor: BRAND_BLUE }}
                                >
                                    Registrar
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/75">
                        <Bouncy size="45" speed="1.55" color={BRAND_BLUE} />
                    </div>
                )}
            </div>
        </div>
    );
}
