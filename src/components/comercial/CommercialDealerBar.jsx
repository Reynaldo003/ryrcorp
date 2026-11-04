const DEALER_LABELS = {
    "VW Cordoba": "VW Córdoba",
    "VW Córdoba": "VW Córdoba",
    "VW Orizaba": "VW Orizaba",
    "VW Poza Rica": "VW Poza Rica",
    "VW Tuxpan": "VW Tuxpan",
    "VW Tuxtepec": "VW Tuxtepec",
};

export default function CommercialDealerBar({
    value,
    dealers,
    onChange,
    secondaryLabel,
    secondaryValue,
    secondaryOptions = [],
    onSecondaryChange,
}) {
    const options = Array.from(new Set(
        (dealers || []).filter((dealer) => dealer && dealer !== "Todos")
    ));

    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#061E45] px-5 py-4 shadow-md">
            <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 text-[11px] font-black uppercase text-blue-200">
                    Concesionarios:
                </span>
                <button
                    type="button"
                    onClick={() => onChange("Todos")}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition ${value === "Todos" ? "bg-white text-[#061E45] shadow-sm" : "bg-[#203D68] text-white hover:bg-[#30517F]"}`}
                >
                    Todas las agencias
                </button>
                {options.map((dealer) => (
                    <button
                        key={dealer}
                        type="button"
                        onClick={() => onChange(dealer)}
                        className={`rounded-full px-4 py-2 text-xs font-bold transition ${value === dealer ? "bg-white text-[#061E45] shadow-sm" : "bg-[#203D68] text-white hover:bg-[#30517F]"}`}
                    >
                        {DEALER_LABELS[dealer] || dealer}
                    </button>
                ))}
            </div>

            {secondaryLabel && secondaryOptions.length ? (
                <div className="flex flex-wrap items-center gap-2 border-l border-blue-300/25 pl-4">
                    <span className="mr-1 text-[10px] font-black uppercase text-blue-200">
                        {secondaryLabel}
                    </span>
                    {secondaryOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onSecondaryChange?.(option.value)}
                            className={`rounded-full px-4 py-2 text-xs font-bold transition ${secondaryValue === option.value ? "bg-white text-[#061E45] shadow-sm" : "bg-[#203D68] text-white hover:bg-[#30517F]"}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
