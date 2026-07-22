import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const BRAND_BLUE = "#131E5C";

/**
 * Recomendación:
 * - Guarda un .lottie en /public/lotties/vw_intro.lottie
 *   (puedes bajar uno y adaptarlo en LottieFiles)
 */
export default function LoginIntroSplash({ onFinish }) {
    return (
        <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Fondo oscuro + “scanlines” */}
            <div className="absolute inset-0 bg-[#050714]" />
            <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(to bottom, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 1px, transparent 2px, transparent 6px)",
                }}
            />
            {/* Glow central */}
            <div
                className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-40"
                style={{ background: `radial-gradient(circle, ${BRAND_BLUE} 0%, transparent 60%)` }}
            />

            <motion.div
                className="relative flex flex-col items-center gap-4"
                initial={{ scale: 0.96, opacity: 0, filter: "blur(6px)" }}
                animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                {/* Animación Lottie */}
                <div className="h-44 w-44">
                    <DotLottieReact src="/lotties/vw_intro.lottie" autoplay loop />
                </div>

                {/* Texto con look “terminal premium” */}
                <motion.div
                    className="text-center"
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                >
                    <div className="text-xs tracking-[0.4em] text-white/70">
                        INICIANDO SISTEMA
                    </div>
                    <div className="mt-2 text-white font-extrabold text-xl">
                        Gestión R&amp;R
                    </div>
                </motion.div>

                {/* Barra de carga fake */}
                <motion.div
                    className="mt-2 h-1 w-64 overflow-hidden rounded-full bg-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: BRAND_BLUE }}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.7, ease: "easeInOut" }}
                        onAnimationComplete={() => onFinish?.()}
                    />
                </motion.div>

                <div className="text-[11px] text-white/50">
                    Verificando credenciales • Cargando módulos
                </div>
            </motion.div>
        </motion.div>
    );
}