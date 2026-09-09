import React, { useMemo, useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import DayColumn from "./DayColumn";
import {
    getWeekDays,
    pad2,
    FIRST_HOUR,
    HOUR_SIZE,
    HOUR_COUNT,
    LAST_HOUR,
    DEFAULT_DURATION,
    taskSpan,
    taskStartMin,
    taskEndMin,
} from "./scheduleUtils";

const HOURS = Array.from({ length: HOUR_COUNT }, (_, i) => i + FIRST_HOUR);
const HEADER_HEIGHT = 66;
const MIN_HOUR_SIZE = 40;
const BOTTOM_MARGIN = 14;

export default function WeeklySchedule({
    tasks,
    weekOffset,
    onWeekChange,
    onAddTask,
    onEdit,
    onDelete,
    onCreateSlot,
    onResize,
    selectedDate = null,
    suppressClickRef,
}) {
    const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

    const weekLabel = useMemo(() => {
        const start = weekDays[0].fullDate;
        const end = weekDays[6].fullDate;
        const opts = { day: "numeric", month: "short" };
        return `${start.toLocaleDateString("es-MX", opts)} – ${end.toLocaleDateString("es-MX", opts)}, ${end.getFullYear()}`;
    }, [weekDays]);

    const cardRef = useRef(null);
    const scrollRef = useRef(null);
    const [cardHeight, setCardHeight] = useState(null);
    const [hourSize, setHourSize] = useState(HOUR_SIZE);

    useEffect(() => {
        function measure() {
            const el = cardRef.current;
            if (!el) return;
            const top = el.getBoundingClientRect().top;
            const vh = window.visualViewport?.height ?? window.innerHeight;
            const h = Math.max(360, Math.floor(vh - top - BOTTOM_MARGIN));
            setCardHeight((prev) => (prev === null || Math.abs(prev - h) > 2 ? h : prev));
        }
        measure();
        window.addEventListener("resize", measure);
        window.visualViewport?.addEventListener?.("resize", measure);
        let ro;
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(measure);
            ro.observe(document.body);
        }
        return () => {
            window.removeEventListener("resize", measure);
            window.visualViewport?.removeEventListener?.("resize", measure);
            if (ro) ro.disconnect();
        };
    }, []);

    useEffect(() => {
        function measureHours() {
            const el = scrollRef.current;
            if (!el) return;
            const next = Math.max(MIN_HOUR_SIZE, Math.floor((el.clientHeight - HEADER_HEIGHT - 34) / HOUR_COUNT));
            setHourSize((prev) => (prev === next ? prev : next));
        }
        measureHours();
        let ro;
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(measureHours);
            if (scrollRef.current) ro.observe(scrollRef.current);
        }
        return () => { if (ro) ro.disconnect(); };
    }, []);

    const segmentsByDay = useMemo(() => {
        const result = {};
        for (const day of weekDays) {
            const segs = [];
            const seen = new Set();
            for (const t of tasks) {
                const span = taskSpan(t);
                if (!span || span.startDay > day.date || span.endDay < day.date) continue;
                const idKey = String(t.id ?? `${t.title}|${t.scheduled_date}|${t.due_date}`);
                if (seen.has(idKey)) continue;
                seen.add(idKey);
                const startMin = taskStartMin(t);
                const endMin = taskEndMin(t);
                let s = startMin;
                let e = endMin;
                if (span.startDay === span.endDay) {
                    // misma tarjeta de un solo día
                } else if (day.date === span.startDay) {
                    // primer día: del inicio a fin de la franja visible
                    e = LAST_HOUR * 60;
                } else if (day.date === span.endDay) {
                    // último día: de inicio de la franja hasta la hora de término
                    s = FIRST_HOUR * 60;
                } else {
                    // días intermedios: franja completa
                    s = FIRST_HOUR * 60;
                    e = LAST_HOUR * 60;
                }
                segs.push({ task: t, startMin: s, endMin: e });
            }
            result[day.date] = segs;
        }
        return result;
    }, [tasks, weekDays]);

    function getDayStats(dateStr) {
        const daySegs = segmentsByDay[dateStr] || [];
        const done = daySegs.filter((s) => s.task.list_name === "Hecho").length;

        const minutes = daySegs.reduce((acc, s) => {
            const duration = s.endMin > s.startMin ? s.endMin - s.startMin : DEFAULT_DURATION;
            return acc + duration;
        }, 0);

        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const timeLabel =
            minutes === 0
                ? "Sin tiempo"
                : h > 0
                    ? m > 0
                        ? `${h}h ${m}m`
                        : `${h}h`
                    : `${m}m`;

        return { pct: daySegs.length ? Math.round((done / daySegs.length) * 100) : 0, timeLabel, done, total: daySegs.length };
    }

    return (
        <div
            ref={cardRef}
            className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm"
            style={{
                height: cardHeight ?? undefined,
                minHeight: cardHeight ? undefined : "min(calc(100vh - 340px), 680px)",
            }}
        >
            <div className="flex shrink-0 items-center justify-between border-b border-[#E4E7F0] bg-white px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onWeekChange(-1)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E4E7F0] text-[#8891AD] hover:bg-[#F7F8FC] transition"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={() => onWeekChange(0)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E4E7F0] px-2.5 py-1 text-[10px] font-extrabold text-[#8891AD] hover:bg-[#F7F8FC] hover:text-[#131E5C] transition"
                        title="Volver a esta semana"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Hoy
                    </button>
                    <button
                        onClick={() => onWeekChange(1)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E4E7F0] text-[#8891AD] hover:bg-[#F7F8FC] transition"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
                <span className="text-xs font-black text-[#131E5C]">{weekLabel}</span>
            </div>

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
                <div className="flex min-w-max">
                    <div className="sticky left-0 z-30 shrink-0 border-r border-[#E4E7F0] bg-white">
                        <div className="shrink-0 border-b border-[#E4E7F0]" style={{ height: HEADER_HEIGHT }} />
                        {HOURS.map((h) => (
                            <div key={h} className="relative shrink-0 border-t border-[#F0F1F6]" style={{ height: hourSize }}>
                                <span className="absolute left-2 -top-[7px] bg-white pr-1 text-[9px] font-black leading-none text-[#8891AD]">
                                    {pad2(h)}:00
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-1">
                        {weekDays.map((day) => (
                            <div
                                key={day.date}
                                className="w-[150px] shrink-0 border-r border-[#E4E7F0] last:border-r-0 md:w-[190px] xl:w-[220px]"
                            >
                                <DayColumn
                                    dayName={day.name}
                                    dayDate={day.date}
                                    dayNumber={day.number}
                                    isCurrent={day.isToday || day.date === selectedDate}
                                    stats={getDayStats(day.date)}
                                    segments={segmentsByDay[day.date] || []}
                                    onAddTask={onAddTask}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onCreateSlot={onCreateSlot}
                                    onResize={onResize}
                                    hours={HOURS}
                                    hourSize={hourSize}
                                    firstHour={FIRST_HOUR}
                                    headerHeight={HEADER_HEIGHT}
                                    suppressClickRef={suppressClickRef}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}