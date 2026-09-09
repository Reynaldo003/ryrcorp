import React, { useState, useRef, useCallback } from "react";
import { Plus, Clock } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";
import {
    makeSlotId,
    taskStartMin,
    taskEndMin,
    snapEndToClock,
    FIRST_HOUR,
    LAST_HOUR,
} from "./scheduleUtils";

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

function HourSlot({ date, hour, hourSize }) {
    const { setNodeRef, isOver } = useDroppable({ id: makeSlotId(date, hour) });
    return (
        <div
            ref={setNodeRef}
            className={cls(
                "pointer-events-none absolute inset-x-0 border-t border-[#F0F1F6] transition-colors duration-150",
                isOver && "border-t-2 border-t-[#131E5C]/30 bg-[#131E5C]/[0.06]"
            )}
            style={{ top: (hour - FIRST_HOUR) * hourSize, height: hourSize, marginTop: "-1px" }}
        />
    );
}

function ScheduledCard({
    task,
    firstHour,
    hourSize,
    onEdit,
    onDelete,
    onResize,
    suppressClickRef,
}) {
    const startMin = taskStartMin(task);
    const initHeight = ((taskEndMin(task) - startMin) / 60) * hourSize;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `task-${task.id}`,
        data: { task, source: "scheduled" },
    });

    const [resizing, setResizing] = useState(false);
    const [resizeHeight, setResizeHeight] = useState(null);
    const startYRef = useRef(0);
    const endMinRef = useRef(taskEndMin(task));

    const handleClick = useCallback((e) => {
        if (suppressClickRef.current && Date.now() < suppressClickRef.current) return;
        e.stopPropagation();
        onEdit?.(task);
    }, [onEdit, task, suppressClickRef]);

    function handleResizeDown(e) {
        e.preventDefault();
        e.stopPropagation();
        setResizing(true);
        startYRef.current = e.clientY;
        endMinRef.current = taskEndMin(task);
        e.currentTarget.setPointerCapture?.(e.pointerId);
    }

    function handleResizeMove(e) {
        if (!resizing) return;
        const delta = ((e.clientY - startYRef.current) / hourSize) * 60;
        const snapped = snapEndToClock({ startMin, endMin: endMinRef.current + delta });
        if (snapped !== null) {
            endMinRef.current = snapped;
            setResizeHeight(((snapped - startMin) / 60) * hourSize);
        }
    }

    function handleResizeUp() {
        if (!resizing) return;
        setResizing(false);
        const finalEnd = endMinRef.current;
        setResizeHeight(null);
        if (finalEnd > startMin) onResize?.(task.id, startMin, finalEnd);
    }

    const height = resizing && resizeHeight !== null ? resizeHeight : initHeight;

    return (
        <div
            className={cls("absolute z-10", isDragging && "z-30")}
            style={{
                top: ((startMin - firstHour * 60) / 60) * hourSize,
                height,
                left: 4,
                right: 4,
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
                transition: isDragging ? "none" : undefined,
            }}
        >
            <TaskCard
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                dragRef={setNodeRef}
                dragAttributes={attributes}
                dragListeners={listeners}
                onClick={handleClick}
                isDragging={isDragging}
                resizeProps={{
                    onPointerDown: handleResizeDown,
                    onPointerMove: handleResizeMove,
                    onPointerUp: handleResizeUp,
                    onPointerCancel: handleResizeUp,
                }}
            />
        </div>
    );
}

export default function DayColumn({
    dayName,
    dayDate,
    dayNumber,
    isCurrent,
    stats,
    tasks,
    onAddTask,
    onEdit,
    onDelete,
    onCreateSlot,
    onResize,
    hours,
    hourSize,
    firstHour,
    headerHeight = 66,
    suppressClickRef,
}) {
    const bodyRef = useRef(null);
    const bodyHeight = hours.length * hourSize;

    function handleBodyClick(e) {
        if (suppressClickRef.current && Date.now() < suppressClickRef.current) return;
        const rect = bodyRef.current?.getBoundingClientRect();
        if (!rect) return;
        const idx = Math.floor((e.clientY - rect.top) / hourSize);
        const hour = Math.min(Math.max(firstHour + idx, firstHour), LAST_HOUR - 1);
        onCreateSlot?.(dayDate, hour);
    }

    return (
        <div className="flex h-full flex-col">
            <div
                className={cls(
                    "sticky top-0 z-20 shrink-0 border-b px-2 py-1.5",
                    isCurrent ? "border-[#131E5C]/20 bg-[#131E5C]/[0.04]" : "border-[#E4E7F0] bg-white"
                )}
                style={{ minHeight: headerHeight }}
            >
                <div className="flex items-center justify-between">
                    <span className={cls("text-[9px] font-extrabold uppercase tracking-wide", isCurrent ? "text-[#131E5C]" : "text-[#8891AD]")}>
                        {dayName}
                    </span>
                    <span
                        className={cls(
                            "flex h-5 min-w-[22px] items-center justify-center rounded-full px-1 text-[11px] font-black",
                            isCurrent ? "bg-[#131E5C] text-white" : "text-[#1A1F3C]"
                        )}
                    >
                        {dayNumber}
                    </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#F0F1F6]">
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${stats.pct}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-[#515778]">{stats.pct}%</span>
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-[#C8CEDF]">
                    <Clock className="h-2.5 w-2.5" />
                    {stats.timeLabel}
                    <span className="text-[#C8CEDF]/70">·</span>
                    <span>{stats.done}/{stats.total}</span>
                </div>
            </div>

            <div ref={bodyRef} className="relative" style={{ height: bodyHeight }} onClick={handleBodyClick}>
                {hours.map((h) => (
                    <HourSlot key={h} date={dayDate} hour={h} hourSize={hourSize} />
                ))}
                {tasks.map((task) => (
                    <ScheduledCard
                        key={task.id}
                        task={task}
                        firstHour={firstHour}
                        hourSize={hourSize}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onResize={onResize}
                        suppressClickRef={suppressClickRef}
                    />
                ))}
            </div>

            <button
                onClick={() => onAddTask?.(dayDate)}
                className="mt-1 inline-flex w-full shrink-0 items-center justify-center gap-1 rounded-[10px] border border-dashed border-[#C8CEDF] py-1.5 text-[10px] font-extrabold text-[#8891AD] hover:border-[#131E5C]/40 hover:bg-[#131E5C]/[0.03] hover:text-[#131E5C] transition"
            >
                <Plus className="h-3 w-3" />
                Nueva tarea
            </button>
        </div>
    );
}