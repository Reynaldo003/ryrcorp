import { useEffect, useRef } from "react";
import * as THREE from "three";
import NET from "vanta/dist/vanta.net.min";

export default function VantaNetBg({
    className = "",
    color = 0x3b82f6,        // azul “neón” (ajústalo)
    backgroundColor = 0x070b1a // azul muy oscuro
}) {
    const ref = useRef(null);
    const vantaRef = useRef(null);

    useEffect(() => {
        // Vanta a veces requiere THREE en window (depende del bundler)
        window.THREE = THREE;

        if (!vantaRef.current && ref.current) {
            vantaRef.current = NET({
                el: ref.current,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                color,
                backgroundColor,
                points: 10.0,
                maxDistance: 22.0,
                spacing: 18.0,
                showDots: false,
            });
        }

        return () => {
            if (vantaRef.current) {
                vantaRef.current.destroy();
                vantaRef.current = null;
            }
        };
    }, [color, backgroundColor]);

    return <div ref={ref} className={className} />;
}