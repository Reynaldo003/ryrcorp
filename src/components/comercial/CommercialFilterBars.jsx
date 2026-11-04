import { Search, X } from "lucide-react";

const MONTHS = ["Todo el año", "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

export default function CommercialFilterBars({
    from, to, search, year, month, onFromChange, onToChange, onSearchChange,
    onClearDates, onYearChange, onMonthChange, quickActions,
}) {
    return <>
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#D7E1F1] bg-white px-4 py-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[11px] font-black text-[#061E45]">FECHAS:</span>
                {quickActions.map(({ label, action }) => <button key={label} type="button" onClick={action} className="rounded-full border border-[#D7E1F1] bg-[#F3F6FB] px-4 py-2 text-xs font-bold text-[#061E45] transition hover:border-[#061E45] hover:bg-[#E8EEF8]">{label}</button>)}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="mr-1 text-[11px] font-black text-[#061E45]">RANGO:</span>
                <input type="date" value={from} max={to || undefined} onChange={(e) => onFromChange(e.target.value)} className="rounded-xl border border-[#D7E1F1] bg-[#F8FAFF] px-3 py-2 text-xs font-semibold text-[#061E45] outline-none focus:border-[#061E45]" />
                <span className="text-xl text-slate-400">→</span>
                <input type="date" value={to} min={from || undefined} onChange={(e) => onToChange(e.target.value)} className="rounded-xl border border-[#D7E1F1] bg-[#F8FAFF] px-3 py-2 text-xs font-semibold text-[#061E45] outline-none focus:border-[#061E45]" />
                <button type="button" onClick={onClearDates} title="Limpiar rango" className="rounded-xl border border-[#D7E1F1] bg-white p-2.5 text-[#061E45] hover:bg-[#F3F6FB]"><X className="h-4 w-4" /></button>
            </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#D7E1F1] bg-white px-4 py-4 shadow-sm xl:flex-row xl:items-center">
            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#D7E1F1] bg-[#F8FAFF] px-3 py-2.5 xl:w-[37%] xl:min-w-[360px]">
                <Search className="h-4 w-4 shrink-0 text-[#061E45]" />
                <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Buscar cliente, teléfono, email, asesor, vehículo..." className="min-w-0 flex-1 bg-transparent text-xs font-medium text-[#061E45] outline-none placeholder:text-slate-400" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                <select value={year} onChange={(e) => onYearChange(Number(e.target.value))} className="shrink-0 rounded-xl border border-[#D7E1F1] bg-[#F8FAFF] px-4 py-2.5 text-sm font-bold text-[#061E45] outline-none">
                    {[2026, 2027, 2028, 2029, 2030].map((item) => <option key={item}>{item}</option>)}
                </select>
                <div className="h-9 w-px shrink-0 bg-slate-200" />
                <div className="min-w-0 flex-1 overflow-x-auto">
                    <div className="flex min-w-[820px] items-center justify-between gap-1">
                        {MONTHS.map((label, index) => {
                            const value = index === 0 ? "todo" : index;
                            return <button key={label} type="button" onClick={() => onMonthChange(value)} className={`whitespace-nowrap rounded-lg px-2 py-2.5 text-[11px] font-black transition ${month === value ? "bg-[#061E45] text-white shadow-sm" : "text-[#061E45] hover:bg-slate-100"}`}>{label}</button>;
                        })}
                    </div>
                </div>
            </div>
        </div>
    </>;
}
