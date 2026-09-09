import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const BRAND_BLUE = "#131E5C";
const DAYS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

export default function MiniCalendar({ selectedDate, onDateSelect, tasksOnDate, month, year, onMonthChange }) {
    const now = new Date();
    const displayMonth = month ?? now.getMonth();
    const displayYear = year ?? now.getFullYear();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const daysInMonth = getDaysInMonth(displayYear, displayMonth);
    const firstDay = getFirstDayOfMonth(displayYear, displayMonth);

    const calendarDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push({ day: null, key: `empty-${i}` });
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const isSelected = selectedDate === dateStr;
            const taskCount = tasksOnDate ? tasksOnDate(dateStr) : 0;
            days.push({ day: d, dateStr, isToday, isSelected, taskCount, key: dateStr });
        }
        return days;
    }, [displayMonth, displayYear, daysInMonth, firstDay, selectedDate, tasksOnDate, todayStr]);

    function handlePrev() {
        if (displayMonth === 0) {
            onMonthChange?.(11, displayYear - 1);
        } else {
            onMonthChange?.(displayMonth - 1, displayYear);
        }
    }

    function handleNext() {
        if (displayMonth === 11) {
            onMonthChange?.(0, displayYear + 1);
        } else {
            onMonthChange?.(displayMonth + 1, displayYear);
        }
    }

    return (
        <div className="rounded-[16px] border border-[#E4E7F0] bg-white p-4 shadow-[0_1px_3px_rgba(19,30,92,0.04)] h-full flex flex-col">
            <div className="flex items-center justify-between mb-3 shrink-0">
                <button
                    onClick={handlePrev}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] border border-[#E4E7F0] text-[#8891AD] hover:bg-[#F7F8FC] hover:text-[#131E5C] transition"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center rounded-full bg-[#131E5C] px-2.5 py-0.5 text-[10px] font-extrabold text-white tracking-wide">
                        {displayYear}
                    </span>
                    <span className="text-sm font-black text-[#131E5C] tracking-tight">
                        {MONTHS[displayMonth]}
                    </span>
                </div>
                <button
                    onClick={handleNext}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] border border-[#E4E7F0] text-[#8891AD] hover:bg-[#F7F8FC] hover:text-[#131E5C] transition"
                >
                    <ChevronRight className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-y-0.5 mb-1 shrink-0">
                {DAYS_SHORT.map((d) => (
                    <div key={d} className="text-center text-[9px] font-extrabold text-[#C8CEDF] py-0.5 uppercase">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-0.5 flex-1 content-start">
                {calendarDays.map(({ day, dateStr, isToday, isSelected, taskCount, key }) => {
                    if (!day) return <div key={key} />;
                    return (
                        <button
                            key={key}
                            onClick={() => onDateSelect?.(dateStr)}
                            className={cls(
                                "relative flex flex-col items-center justify-center rounded-[8px] h-7 text-[11px] font-bold transition-all duration-150",
                                isSelected
                                    ? "bg-[#131E5C] text-white shadow-[0_2px_8px_rgba(19,30,92,0.25)]"
                                    : isToday
                                        ? "bg-[#131E5C]/[0.07] text-[#131E5C] font-black"
                                        : "text-[#515778] hover:bg-[#F7F8FC]"
                            )}
                        >
                            {day}
                            {taskCount > 0 && !isSelected && (
                                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[#131E5C]/60" />
                            )}
                            {taskCount > 0 && isSelected && (
                                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-white/80" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
