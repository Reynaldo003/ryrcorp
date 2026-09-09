import React from "react";

export default function SemicircleProgress({ value = 0, size = 100, stroke = 10, color = "#131E5C", trackColor = "#E4E7F0", label }) {
    const radius = (size - stroke) / 2;
    const circumference = Math.PI * radius;
    const clamped = Math.min(100, Math.max(0, value));
    const offset = circumference - (clamped / 100) * circumference;

    return (
        <div className="relative inline-flex flex-col items-center">
            <svg width={size} height={size / 2 + stroke} viewBox={`0 0 ${size} ${size / 2 + stroke}`} className="overflow-visible">
                <path
                    d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
                    fill="none"
                    stroke={trackColor}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                />
                <path
                    d={`M ${stroke / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${size / 2}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out"
                    style={{ transformOrigin: "center", transform: "rotate(180deg)" }}
                />
            </svg>
            {label && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center" style={{ bottom: stroke * 0.3 }}>
                    {label}
                </div>
            )}
        </div>
    );
}
