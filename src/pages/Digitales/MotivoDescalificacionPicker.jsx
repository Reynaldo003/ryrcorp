import { useState } from "react";
import {
    PhoneCall,
    ThumbsDown,
    Wallet,
    ShieldAlert,
    MoreHorizontal,
    Check,
} from "lucide-react";
import {
    MOTIVOS_DESCALIFICACION_POR_CATEGORIA,
    encontrarCategoriaDeMotivo,
    esMotivoEstandar,
} from "./motivosDescalificacion";

const cls = (...items) => items.filter(Boolean).join(" ");

const ICONOS_CATEGORIA = {
    contacto: PhoneCall,
    desinteres: ThumbsDown,
    financiamiento: Wallet,
    lead_invalido: ShieldAlert,
    otro: MoreHorizontal,
};

export default function MotivoDescalificacionPicker({ value, onChange, invalid = false }) {
    const [prevValue, setPrevValue] = useState(value);
    const [categoria, setCategoria] = useState(() => encontrarCategoriaDeMotivo(value));
    const [otroTexto, setOtroTexto] = useState(() => {
        const v = String(value || "").trim();
        return v && !esMotivoEstandar(v) ? v : "";
    });

    if (value !== prevValue) {
        setPrevValue(value);

        const categoriaActual = encontrarCategoriaDeMotivo(value);

        if (categoriaActual) {
            setCategoria(categoriaActual);
            if (categoriaActual === "otro") setOtroTexto(String(value || "").trim());
        }
    }

    const seleccionarCategoria = (cat) => {
        setCategoria(cat.key);

        if (cat.key === "otro") {
            setOtroTexto("");
            onChange("");
        } else {
            onChange("");
        }
    };

    return (
        <div>
            <div
                className={cls(
                    "grid grid-cols-2 gap-2 rounded-xl border-2 p-2.5 transition sm:grid-cols-3 lg:grid-cols-5",
                    invalid && !categoria
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-white",
                )}
            >
                {MOTIVOS_DESCALIFICACION_POR_CATEGORIA.map((cat) => {
                    const Icon = ICONOS_CATEGORIA[cat.icon] || MoreHorizontal;
                    const activo = categoria === cat.key;

                    return (
                        <button
                            key={cat.key}
                            type="button"
                            onClick={() => seleccionarCategoria(cat)}
                            className={cls(
                                "group flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-2.5 text-center transition",
                                activo
                                    ? "border-[#1746D1] bg-[#1746D1]/5"
                                    : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white",
                            )}
                        >
                            <span
                                className={cls(
                                    "flex h-8 w-8 items-center justify-center rounded-full transition",
                                    activo
                                        ? "bg-[#1746D1] text-white"
                                        : "bg-white text-slate-400 group-hover:text-[#1746D1]",
                                )}
                            >
                                <Icon className="h-4 w-4" />
                            </span>
                            <span
                                className={cls(
                                    "text-[11px] font-extrabold leading-tight",
                                    activo ? "text-[#1746D1]" : "text-slate-500",
                                )}
                            >
                                {cat.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {categoria === "otro" ? (
                <div className="mt-2">
                    <input
                        autoFocus
                        type="text"
                        value={otroTexto}
                        onChange={(e) => setOtroTexto(e.target.value)}
                        onBlur={() => onChange(otroTexto)}
                        placeholder="Especifica el motivo…"
                        className={cls(
                            "h-10 w-full rounded-lg border px-3 text-sm font-bold outline-none transition focus:ring-2",
                            otroTexto.trim()
                                ? "border-slate-200 text-[#131E5C] focus:border-[#1746D1]/50 focus:ring-[#1746D1]/10"
                                : "border-red-300 bg-red-50 text-red-700 focus:border-red-400 focus:ring-red-100",
                        )}
                    />
                    {!otroTexto.trim() ? (
                        <div className="mt-1 text-xs font-bold text-red-600">
                            Especifica el motivo por escrito.
                        </div>
                    ) : null}
                </div>
            ) : null}

            {categoria && categoria !== "otro" ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {MOTIVOS_DESCALIFICACION_POR_CATEGORIA.find((c) => c.key === categoria)
                        ?.opciones.map((opcion) => {
                            const activa = String(value || "").trim() === opcion;

                            return (
                                <button
                                    key={opcion}
                                    type="button"
                                    onClick={() => onChange(opcion)}
                                    className={cls(
                                        "flex items-center justify-between gap-2 rounded-lg border-2 px-3 py-2 text-left text-xs font-bold transition",
                                        activa
                                            ? "border-[#1746D1] bg-[#1746D1]/5 text-[#1746D1]"
                                            : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white",
                                    )}
                                >
                                    <span>{opcion}</span>
                                    {activa ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
                                </button>
                            );
                        })}
                </div>
            ) : null}
        </div>
    );
}
