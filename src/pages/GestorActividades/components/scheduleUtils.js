export const FIRST_HOUR = 8;
export const LAST_HOUR = 19;
export const HOUR_SIZE = 56;
export const HOUR_COUNT = LAST_HOUR - FIRST_HOUR + 1;
export const MIN_DURATION = 30;
export const DEFAULT_DURATION = 60;
export const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function pad2(n) {
    return String(n).padStart(2, "0");
}

export function toDateStr(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function getWeekDays(offset = 0) {
    const now = new Date();
    const monday = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(now.getDate() + diff + offset * 7);

    const todayStr = toDateStr(now);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return {
            name: DAY_NAMES[i],
            date: toDateStr(d),
            number: d.getDate(),
            isToday: toDateStr(d) === todayStr,
            fullDate: d,
        };
    });
}

export function parseTimeMin(value) {
    if (!value) return null;
    const parts = String(value).split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || "0", 10);
    if (!Number.isFinite(h) || h < 0 || h > 23) return null;
    const total = h * 60 + (Number.isFinite(m) ? m : 0);
    if (total < 0 || total > 23 * 60 + 59) return null;
    return total;
}

export function minutesToTimeLabel(min) {
    const m = Math.max(0, min);
    return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}

export function makeSlotId(date, hour) {
    return `${date}|${hour}`;
}

export function parseSlotId(id) {
    const [date, hourRaw] = String(id).split("|");
    return { date, hour: parseInt(hourRaw, 10) };
}

export function taskStartMin(task) {
    const parsed = parseTimeMin(task?.scheduled_start || task?.start_time);
    if (parsed === null) return FIRST_HOUR * 60;
    return Math.max(parsed, FIRST_HOUR * 60);
}

export function taskEndMin(task) {
    const parsed = parseTimeMin(task?.scheduled_end || task?.end_time);
    const start = taskStartMin(task);
    if (parsed !== null && parsed > start) return Math.min(parsed, LAST_HOUR * 60);
    return start + taskDurationMinutes(task);
}

export function taskDurationMinutes(task) {
    const start = parseTimeMin(task?.scheduled_start || task?.start_time);
    const end = parseTimeMin(task?.scheduled_end || task?.end_time);
    if (start !== null && end !== null && end > start) return end - start;
    const explicit = Number(task?.durationMinutes) || Number(task?.duration_minutes);
    if (explicit > 0) return explicit;
    return DEFAULT_DURATION;
}

export function resolveDrop({ date, slotHour, duration }) {
    const minMin = FIRST_HOUR * 60;
    const maxMin = LAST_HOUR * 60;
    let startMin = slotHour * 60;
    const effectiveDuration = duration && duration > 0 ? duration : DEFAULT_DURATION;

    if (startMin >= maxMin) {
        return { ok: false, reason: `Debe iniciar antes de las ${minutesToTimeLabel(maxMin)}` };
    }
    if (startMin < minMin) startMin = minMin;

    let endMin = startMin + effectiveDuration;
    if (endMin > maxMin) endMin = maxMin;
    if (endMin - startMin < MIN_DURATION) {
        return { ok: false, reason: "No queda tiempo suficiente dentro del horario visible" };
    }

    return {
        ok: true,
        endMin,
        patch: buildSchedulePatch({ date, startMin, endMin }),
    };
}

export function snapEndToClock({ startMin, endMin }) {
    const maxMin = LAST_HOUR * 60;
    const step = MIN_DURATION;
    const base = Math.max(startMin + MIN_DURATION, Math.round(endMin / step) * step);
    const snapped = Math.min(base, maxMin);
    if (snapped >= startMin && snapped > startMin) return snapped;
    return null;
}

export function buildSchedulePatch({ date, startMin, endMin }) {
    return {
        scheduled_date: date,
        scheduled_start: minutesToTimeLabel(startMin),
        scheduled_end: minutesToTimeLabel(endMin),
        durationMinutes: endMin - startMin,
    };
}

export function fmtDuration(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
    return `${m} min`;
}