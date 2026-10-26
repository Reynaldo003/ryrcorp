
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";

export default function ModalErrorLogin({ error, onCerrar }) {
    useEffect(() => {
        if (!error) return;

        const detectarEscape = (evento) => {
            if (evento.key === "Escape") onCerrar();
        };

        window.addEventListener("keydown", detectarEscape);

        return () => window.removeEventListener("keydown", detectarEscape);
    }, [error, onCerrar]);

    return (
        <AnimatePresence>
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#06102D]/70 p-4 backdrop-blur-sm"
                    onMouseDown={(evento) => {
                        if (evento.target === evento.currentTarget) onCerrar();
                    }}
                >
                    <motion.div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="titulo-error-login"
                        aria-describedby="mensaje-error-login"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.25 }}
                        className="relative w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 text-center shadow-2xl sm:p-9"
                    >
                        <button
                            type="button"
                            onClick={onCerrar}
                            className="absolute right-5 top-5 text-slate-400 transition hover:text-slate-700"
                            aria-label="Cerrar mensaje"
                        >
                            <X size={20} />
                        </button>

                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                            <ShieldAlert size={38} className="text-red-600" />
                        </div>

                        <h2 id="titulo-error-login" className="mb-3 text-2xl font-black text-[#0B1F5E]">
                            {error.titulo}
                        </h2>

                        <p id="mensaje-error-login" className="mb-7 text-sm leading-6 text-slate-500">
                            {error.mensaje}
                        </p>

                        <button
                            type="button"
                            autoFocus
                            onClick={onCerrar}
                            className="w-full rounded-xl bg-[#0B1F5E] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#153A8A]"
                        >
                            Entendido
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
