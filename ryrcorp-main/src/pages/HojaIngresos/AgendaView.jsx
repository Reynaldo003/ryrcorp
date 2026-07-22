// src/pages/HojaIngresos/AgendaView.jsx
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Hammer,
  LogIn,
  Megaphone,
  MessageSquareWarning,
  MoreHorizontal,
  Paintbrush,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserRoundMinus,
  Users,
  UserX,
  Wrench,
} from "lucide-react";
const APERTURA_DEFECTO = { hour: 8, minute: 0 };
const CIERRE_DEFECTO = { hour: 16, minute: 0 };
const ADVISOR_COL_WIDTH = 220;
const SLOT_WIDTH = 220;
const ROW_HEIGHT = 160;
const HEADER_HEIGHT = 44;
const MEXICO_TZ = "America/Mexico_City";

const ASESORES_POR_AGENCIA = {
  "VW Cordoba": [
    { id: 1, nombre: "Yamil Tepole" },
    { id: 2, nombre: "Iván Ramírez" },
    { id: 3, nombre: "Verónica González" },
  ],
  "VW Orizaba": [
    { id: 4, nombre: "Carlos Oliveros" },
    { id: 5, nombre: "Norma Angélica Reyes" },
  ],
};

const ASESOR_PALETTE = [
  {
    avatarClass: "border-[#BFD0E7] bg-[#E8F0FA] text-[#131E5C]",
    dotClass: "bg-[#131E5C]",
    progressClass: "bg-[#131E5C]",
  },
  {
    avatarClass: "border-[#B9E0E3] bg-[#E0F4F5] text-[#075D65]",
    dotClass: "bg-[#087780]",
    progressClass: "bg-[#087780]",
  },
  {
    avatarClass: "border-[#F3C4BC] bg-[#FDEAE7] text-[#912018]",
    dotClass: "bg-[#D96873]",
    progressClass: "bg-[#D96873]",
  },
  {
    avatarClass: "border-[#D2CDEF] bg-[#ECEAF8] text-[#3D337D]",
    dotClass: "bg-[#6B5ACD]",
    progressClass: "bg-[#6B5ACD]",
  },
  {
    avatarClass: "border-[#B9E2CD] bg-[#E4F5ED] text-[#075F40]",
    dotClass: "bg-[#0B7A53]",
    progressClass: "bg-[#0B7A53]",
  },
];

const CATEGORIAS_SERVICIO = [
  { id: "mantenimientos", label: "Mantenimientos", keywords: ["manten"], icon: Wrench, },
  { id: "reparaciones", label: "Reparaciones", keywords: ["repar"], icon: Hammer, },
  { id: "diagnosticos", label: "Diagnósticos", keywords: ["diagn"], icon: Search, },
  { id: "campanas", label: "Campañas", keywords: ["campa"], icon: Megaphone, },
  { id: "garantias", label: "Garantías", keywords: ["garant"], icon: ShieldCheck, },
  { id: "hojalateria", label: "Hojalatería y pintura", keywords: ["hojalat", "pintura"], icon: Paintbrush, },
  { id: "reclamaciones", label: "Reclamaciones", keywords: ["reclam"], icon: MessageSquareWarning, },
  { id: "otros", label: "Otros", keywords: [], icon: MoreHorizontal, },
];

function normalizar(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function agenciaCanonical(value) {
  const key = normalizar(value);
  if (key.includes("cordoba")) return "VW Cordoba";
  if (key.includes("orizaba")) return "VW Orizaba";
  return String(value ?? "").trim();
}

function colorForAsesor(nombre) {
  if (!nombre) return ASESOR_PALETTE[0];

  let hash = 0;
  for (let i = 0; i < nombre.length; i += 1) {
    hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
  }

  return ASESOR_PALETTE[hash % ASESOR_PALETTE.length];
}

function boolFromAny(value) {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "si", "sí", "yes"].includes(text);
}

function asistenciaFromAny(cita) {
  const value = cita?.asistido ?? cita?.asistencia;

  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }

  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }

  return null;
}

function citaCitada(cita) {
  return boolFromAny(cita?.citado);
}

function estadoOperativoCita(cita, ahora = new Date()) {
  if (!citaCitada(cita)) return "no_citado";

  const asistencia = asistenciaFromAny(cita);
  if (asistencia === true) return "asistio";

  const fechaRaw = cita?.fecha_ingreso || cita?.fecha_cita;
  const fechaCita = new Date(fechaRaw);

  if (Number.isNaN(fechaCita.getTime())) {
    return asistencia === false ? "no_show" : "pendiente";
  }

  return fechaCita.getTime() > ahora.getTime() ? "pendiente" : "no_show";
}

function tipoServicioMeta(tipo) {
  const value = normalizar(tipo);

  if (value.includes("campa")) {
    return {
      label: "Campaña",
      cardClass:
        "border-[#72E2D3] bg-[linear-gradient(180deg,#FFFFFF_0%,#F2FFFD_100%)] shadow-[0_10px_24px_rgba(20,184,166,0.18)]",
      badgeClass: "border-[#72E2D3] bg-[#DDFCF7] text-[#008A7A]",
      accentClass: "bg-[#14B8A6]",
      timeClass: "text-[#008A7A]",
    };
  }

  if (value.includes("diagn")) {
    return {
      label: "Diagnóstico",
      cardClass:
        "border-[#C7A9FF] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF7FF_100%)] shadow-[0_10px_24px_rgba(124,58,237,0.18)]",
      badgeClass: "border-[#C7A9FF] bg-[#F1E8FF] text-[#6D28D9]",
      accentClass: "bg-[#7C3AED]",
      timeClass: "text-[#6D28D9]",
    };
  }

  if (value.includes("repar")) {
    return {
      label: "Reparación",
      cardClass:
        "border-[#FFD08A] bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFAF2_100%)] shadow-[0_10px_24px_rgba(245,158,11,0.18)]",
      badgeClass: "border-[#FFD08A] bg-[#FFF0D9] text-[#C26A00]",
      accentClass: "bg-[#F59E0B]",
      timeClass: "text-[#C26A00]",
    };
  }

  return {
    label: "Servicio",
    cardClass:
      "border-[#9BC7FF] bg-[linear-gradient(180deg,#FFFFFF_0%,#F6FAFF_100%)] shadow-[0_10px_24px_rgba(37,99,235,0.18)]",
    badgeClass: "border-[#9BC7FF] bg-[#E8F2FF] text-[#0057D9]",
    accentClass: "bg-[#2563EB]",
    timeClass: "text-[#0057D9]",
  };
}

function parseTiposServicio(raw) {
  if (Array.isArray(raw)) {
    return raw.map((tipo) => String(tipo ?? "").trim()).filter(Boolean);
  }

  const value = String(raw ?? "").trim();
  if (!value) return [];

  if (value.startsWith("[") && value.endsWith("]")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((tipo) => String(tipo ?? "").trim()).filter(Boolean);
      }
    } catch {
      // Si no es JSON válido, se procesa como texto separado por comas.
    }
  }

  return value
    .split(",")
    .map((tipo) => tipo.trim())
    .filter(Boolean);
}

function getTiposServicio(cita) {
  const tipos = parseTiposServicio(cita?.tipo_cita);
  return tipos.length ? tipos.slice(0, 3) : ["Servicio"];
}

function identificarCategoriaServicio(tipo) {
  const value = normalizar(tipo);

  const categoria = CATEGORIAS_SERVICIO.find(
    (item) =>
      item.id !== "otros" &&
      item.keywords.some((keyword) => value.includes(keyword)),
  );

  return categoria?.id || "otros";
}

function buildHorarios(inicio, fin) {
  const slots = [];
  let totalMin = inicio.hour * 60 + inicio.minute;
  const finMin = fin.hour * 60 + fin.minute;

  while (totalMin <= finMin) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    totalMin += 30;
  }

  return slots;
}

function mexicoYMD(fecha) {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-CA", {
    timeZone: MEXICO_TZ,
  });
}

function mexicoHourMinute(fecha) {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return null;

  return {
    hour: Number(
      date.toLocaleString("en-US", {
        timeZone: MEXICO_TZ,
        hour: "numeric",
        hour12: false,
      }),
    ),
    minute: Number(
      date.toLocaleString("en-US", {
        timeZone: MEXICO_TZ,
        minute: "numeric",
      }),
    ),
  };
}

function slotKeyFromFecha(fecha) {
  const hm = mexicoHourMinute(fecha);
  if (!hm) return null;

  return `${String(hm.hour).padStart(2, "0")}:${hm.minute < 30 ? "00" : "30"}`;
}

function horaCorta(fecha) {
  const hm = mexicoHourMinute(fecha);
  if (!hm) return "--:--";

  return `${String(hm.hour).padStart(2, "0")}:${String(hm.minute).padStart(2, "0")}`;
}

function nombreCliente(cita) {
  return (
    cita?.cliente_nombre ||
    cita?.cliente?.nombre ||
    cita?.nombre_cliente ||
    "Sin nombre"
  );
}

function percentage(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function AdvisorAvatar({ nombre, color }) {
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold ${color.avatarClass}`}
    >
      {iniciales}
    </div>
  );
}

function AdvisorStats({ asesor, color, citasAsesor }) {
  const total = citasAsesor.length;
  const asistencias = citasAsesor.filter(
    (cita) => asistenciaFromAny(cita) === true,
  ).length;
  const ocupacion = Math.min(Math.round((total / 8) * 100), 100);

  return (
    <div className="flex w-full min-w-0 items-center gap-3">
      <AdvisorAvatar nombre={asesor.nombre} color={color} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-[13px] font-bold text-[#131E5C]">
            {asesor.nombre}
          </div>
          <span className={`h-2 w-2 rounded-full ${color.dotClass}`} />
        </div>

        <div className="mt-1 text-[10.5px] font-semibold text-[#8A95A6]">
          <span className="text-[#131E5C]">{total}</span> citas ·{" "}
          <span className="text-[#0B7A53]">{asistencias}</span> asistencias
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#DDE5EF]">
          <div
            className={`h-full rounded-full ${color.progressClass}`}
            style={{ width: `${ocupacion}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function TipoBadge({ tipo }) {
  const meta = tipoServicioMeta(tipo);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9.5px] font-black ${meta.badgeClass}`}
    >
      {meta.label}
    </span>
  );
}

function AttendanceSwitch({ estado, disabled, onToggle }) {
  const meta =
    estado === "asistio"
      ? {
        label: "Asistió",
        className:
          "border-[#9BE0BF] bg-[#D8F3E5] text-[#138A55] shadow-[0_6px_14px_rgba(155,224,191,0.35)]",
        dotClass: "bg-[#138A55]",
      }
      : estado === "no_show"
        ? {
          label: "No asistió",
          className:
            "border-[#FFB4AB] bg-[#FFE1DE] text-[#D92D20] shadow-[0_6px_14px_rgba(255,180,171,0.35)]",
          dotClass: "bg-[#D92D20]",
        }
        : {
          label: "Pendiente",
          className:
            "border-[#F1D36D] bg-[#FFF7D6] text-[#7A6200] shadow-[0_6px_14px_rgba(241,211,109,0.35)]",
          dotClass: "bg-[#F2C94C]",
        };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onToggle?.();
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] font-black transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 ${meta.className}`}
      title="Cambiar estado de asistencia"
    >
      <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </button>
  );
}

function CitaCard({
  cita,
  ahora,
  abrirEditar,
  onSetAsistencia,
  updatingInline = {},
}) {
  const cliente = nombreCliente(cita);
  const tipos = getTiposServicio(cita);
  const asistencia = asistenciaFromAny(cita);
  const estado = estadoOperativoCita(cita, ahora);
  const modelo = cita.modelo || "Modelo sin capturar";
  const loadingAsistencia = !!updatingInline[`${cita.id}-asistencia`];
  const metaPrincipal = tipoServicioMeta(tipos[0]);

  function abrirConTeclado(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      abrirEditar?.(cita);
    }
  }

  function toggleAsistencia(event) {
    event?.stopPropagation?.();
    onSetAsistencia?.(cita, asistencia === true ? false : true);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => abrirEditar?.(cita)}
      onKeyDown={abrirConTeclado}
      title={`${cliente} · clic para editar`}
      className={`group relative h-full min-w-[174px] overflow-hidden rounded-[14px] border p-2.5 text-left transition duration-200 hover:-translate-y-[2px] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#9BC7FF] ${metaPrincipal.cardClass}`}
    >
      <span
        className={`absolute bottom-0 left-0 top-0 w-[4px] ${metaPrincipal.accentClass}`}
      />

      <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#DDE5EF] bg-white text-[#8A95A6]">
        <Phone className="h-3.5 w-3.5" />
      </div>

      <div className="pl-2 pr-7">
        <div className="flex items-start justify-between gap-2">
          <div className={`text-[10px] font-black tabular-nums ${metaPrincipal.timeClass}`}>
            {horaCorta(cita.fecha_ingreso || cita.fecha_cita)}
          </div>

          <AttendanceSwitch
            estado={estado}
            disabled={loadingAsistencia}
            onToggle={toggleAsistencia}
          />
        </div>

        <div className="mt-2 truncate text-[11px] font-black uppercase tracking-wide text-[#131E5C]">
          {cliente}
        </div>

        <div className="mt-1 space-y-0.5 text-[10px] font-semibold leading-4 text-[#536070]">
          <div className="truncate">{modelo}</div>
          <div className="flex flex-wrap gap-1">
            {tipos.map((tipo) => (
              <TipoBadge key={tipo} tipo={tipo} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptySlot({ slot, onClick }) {
  return (
    <div className="group relative h-full w-full rounded-[10px] bg-[#F8FAFD]/70 transition hover:bg-white">
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={onClick}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#131E5C] text-white shadow-lg"
          title={`Crear cita a las ${slot}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MultiSourceRing({ medios = [] }) {
  const itemsBase = medios
    .filter((medio) => Number(medio.total) > 0)
    .slice(0, 5)
    .map((medio) => ({
      nombre: medio.nombre,
      total: Number(medio.total) || 0,
    }));

  const otros = medios
    .slice(5)
    .reduce((acc, medio) => acc + (Number(medio.total) || 0), 0);

  const items =
    otros > 0 ? [...itemsBase, { nombre: "Otros", total: otros }] : itemsBase;

  const total = items.reduce((acc, item) => acc + item.total, 0);
  const size = 168;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 6;
  const [hovered, setHovered] = useState(null);

  const palette = [
    {
      strokeClass: "stroke-[#131E5C]",
      textClass: "text-[#131E5C]",
      borderClass: "border-[#131E5C]",
    },
    {
      strokeClass: "stroke-[#35AEE0]",
      textClass: "text-[#176C8F]",
      borderClass: "border-[#35AEE0]",
    },
    {
      strokeClass: "stroke-[#0B8F6A]",
      textClass: "text-[#087566]",
      borderClass: "border-[#0B8F6A]",
    },
    {
      strokeClass: "stroke-[#6B5ACD]",
      textClass: "text-[#5B369A]",
      borderClass: "border-[#6B5ACD]",
    },
    {
      strokeClass: "stroke-[#D96873]",
      textClass: "text-[#9C3943]",
      borderClass: "border-[#D96873]",
    },
    {
      strokeClass: "stroke-[#F2C94C]",
      textClass: "text-[#7A6200]",
      borderClass: "border-[#F2C94C]",
    },
  ];

  let accumulated = 0;
  const segments = items.map((item, index) => {
    const fraction = total ? item.total / total : 0;
    const rawLength = circumference * fraction;
    const dashLength = Math.max(rawLength - gap, 0);
    const dashOffset = -accumulated;
    accumulated += rawLength;

    return {
      ...item,
      ...palette[index % palette.length],
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset,
      percent: percentage(item.total, total),
    };
  });

  return (
    <div className="flex h-full min-w-0 flex-col px-2 py-1">
      <div className="flex items-start justify-between">
        <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#131E5C]">
          Medio de concertación
        </div>
      </div>

      {segments.length ? (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center">
          <div className="relative h-[168px] w-[168px]">
            {hovered ? (
              <div className={`pointer-events-none absolute left-1/2 top-0 z-20 min-w-[150px] -translate-x-1/2 -translate-y-[115%] rounded-[12px] border bg-white px-3 py-2 text-center shadow-[0_10px_24px_rgba(19,30,92,0.14)] ${hovered.borderClass}`}>
                <div className="truncate text-[10px] font-black uppercase tracking-wide text-[#131E5C]">
                  {hovered.nombre}
                </div>
                <div className="mt-0.5 text-[10px] font-semibold text-[#6F7690]">
                  {hovered.total} citas · {hovered.percent}%
                </div>
              </div>
            ) : null}

            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="h-full w-full -rotate-90 overflow-visible"
              aria-label="Distribución por medio de concertación"
              role="img"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={stroke}
                className="stroke-[#E7EAF2]"
              />

              {segments.map((segment) => {
                const activo = hovered?.nombre === segment.nombre;

                return (
                  <circle
                    key={segment.nombre}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={activo ? stroke + 3 : stroke}
                    strokeLinecap="round"
                    strokeDasharray={segment.dashArray}
                    strokeDashoffset={segment.dashOffset}
                    tabIndex={0}
                    aria-label={`${segment.nombre}: ${segment.total} citas, ${segment.percent}%`}
                    className={`cursor-pointer outline-none transition-all duration-200 ${segment.strokeClass} ${hovered && !activo ? "opacity-40" : "opacity-100"
                      } ${activo ? "drop-shadow-[0_0_7px_rgba(19,30,92,0.22)]" : ""}`}
                    style={{ pointerEvents: "stroke" }}
                    onPointerEnter={() => setHovered(segment)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(segment)}
                    onBlur={() => setHovered(null)}
                  >
                    <title>
                      {segment.nombre} · {segment.total} citas · {segment.percent}%
                    </title>
                  </circle>
                );
              })}
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <div
                className={`text-[30px] font-black leading-none ${hovered?.textClass || "text-[#131E5C]"
                  }`}
              >
                {hovered ? `${hovered.percent}%` : total}
              </div>

              <div
                className="mt-1 max-w-[110px] truncate text-[10px] font-black uppercase tracking-wide text-[#536070]"
                title={hovered?.nombre || "Citas"}
              >
                {hovered?.nombre || "citas"}
              </div>

              <div className="mt-1 text-[10px] font-semibold text-[#8A95A6]">
                {hovered ? `${hovered.total} citas` : "medios del día"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[16px] border border-dashed border-[#B9C7DA] bg-white px-4 py-6 text-center text-[11px] font-semibold text-[#8A95A6]">
          No hay medios de concertación capturados para este día.
        </div>
      )}
    </div>
  );
}

function CorporateMetricCard({
  icon: Icon,
  label,
  value,
  detail,
  compact = false,
}) {
  return (
    <div className={`group relative overflow-hidden rounded-[18px] border border-[#CBD1E2] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#131E5C] hover:shadow-[0_12px_28px_rgba(19,30,92,0.10)] ${compact ? "min-h-[96px] px-3 py-3" : "min-h-[108px] px-4 py-3"}`}>
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#131E5C]" />

      <div className="flex h-full items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`font-black uppercase tracking-[0.12em] text-[#131E5C] ${compact ? "text-[9px]" : "text-[10px]"
              }`}
            title={label}
          >
            {label}
          </div>

          <div
            className={`mt-2 font-black leading-none text-[#131E5C] ${compact ? "text-[25px]" : "text-[29px]"
              }`}
          >
            {value}
          </div>

          {detail ? (
            <div className="mt-2 text-[9.5px] font-semibold leading-4 text-[#66708C]">
              {detail}
            </div>
          ) : null}
        </div>

        <div
          className={`flex shrink-0 items-center justify-center rounded-[12px] border border-[#D7DBE8] bg-[#F1F3F8] text-[#131E5C] transition duration-200 group-hover:border-[#131E5C] group-hover:bg-[#131E5C] group-hover:text-white ${compact ? "h-8 w-8" : "h-9 w-9"
            }`}
        >
          <Icon className={compact ? "h-4 w-4" : "h-[17px] w-[17px]"} />
        </div>
      </div>
    </div>
  );
}

function DailyHeroSummary({
  estadisticas,
  tiposServicio = [],
  medios = [],
}) {
  const safeAsistencia = Math.max(
    0,
    Math.min(Number(estadisticas.tasaAsistencia) || 0, 100),
  );

  const size = 158;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (safeAsistencia / 100) * circumference;

  const metricasPrincipales = [
    {
      label: "Citas Totales",
      value: estadisticas.citados,
      detail: "Citas confirmadas",
      icon: CalendarDays,
    },
    {
      label: "No Show",
      value: estadisticas.noShow,
      detail: "Clientes no asistidos",
      icon: UserX,
    },
    {
      label: "Pendientes",
      value: estadisticas.pendientesAsistencia,
      detail: "Citas por atender",
      icon: Clock3,
    },
    {
      label: "No Citados",
      value: estadisticas.noCitados,
      detail: "Ingresos sin cita",
      icon: UserRoundMinus,
    },
    {
      label: "Total de Ingresos",
      value: estadisticas.ingresosTotales,
      detail: `${estadisticas.citados} - ${estadisticas.noShow} + ${estadisticas.noCitados}`,
      icon: LogIn,
    },
  ];

  return (
    <div className="overflow-visible rounded-[24px] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-black uppercase tracking-[0.16em] text-[#131E5C]">
            Recorrido del día
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[180px_minmax(0,1fr)_230px] xl:items-stretch">
        {/* Tasa de asistencia */}
        <div className="flex flex-col items-center justify-center border-b border-[#E2E7F0] px-2 py-5 xl:border-b-0 xl:border-r xl:pr-5">
          <div className="relative h-[158px] w-[158px]">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="h-full w-full -rotate-90"
              aria-label={`Tasa de asistencia ${safeAsistencia}%`}
              role="img"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={stroke}
                className="stroke-[#E5E8F1]"
              />

              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
                className="stroke-[#131E5C] transition-all duration-500"
              />
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="text-[37px] font-black leading-none text-[#131E5C]">
                {safeAsistencia}%
              </div>

              <div className="mt-1 text-[11px] font-black uppercase tracking-[0.15em] text-[#131E5C]">
                Asistencia
              </div>

              <div className="mt-1 max-w-[110px] text-[11px] font-semibold text-[#66708C]">
                {estadisticas.asistencias} de {estadisticas.citados} citados
              </div>
            </div>
          </div>
        </div>

        {/* Métricas y servicios */}
        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {metricasPrincipales.map((metrica) => (
              <CorporateMetricCard
                key={metrica.label}
                icon={metrica.icon}
                label={metrica.label}
                value={metrica.value}
                detail={metrica.detail}
              />
            ))}
          </div>

          <div className="mt-5 border-t border-[#E2E7F0] pt-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EEF0F7] text-[#131E5C]">
                <Wrench className="h-4 w-4" />
              </div>

              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#131E5C]">
                Servicios registrados
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
              {tiposServicio.map((tipo) => (
                <CorporateMetricCard
                  key={tipo.id}
                  compact
                  icon={tipo.icon}
                  label={tipo.label}
                  value={tipo.value}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Medio de concertación */}
        <div className="min-w-0 border-t border-[#E2E7F0] pt-5 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0">
          <MultiSourceRing medios={medios} />
        </div>
      </div>
    </div>
  );
}

function ExecutiveOverview({
  estadisticas,
  medios,
  tiposServicio,
}) {
  return (
    <DailyHeroSummary
      estadisticas={estadisticas}
      tiposServicio={tiposServicio}
      medios={medios}
    />
  );
}

export default function AgendaView({
  citas = [],
  abrirEditar,
  onSlotClick,
  onSetAsistencia,
  updatingInline = {},
  selectedDate = new Date().toISOString().split("T")[0],
  agenciaSeleccionada = "VW Cordoba",
}) {
  const [reloj, setReloj] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setReloj(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const agenciaActual = agenciaCanonical(agenciaSeleccionada);

  const asesores = useMemo(
    () => ASESORES_POR_AGENCIA[agenciaActual] || [],
    [agenciaActual],
  );

  const citasDeLaFecha = useMemo(() => {
    if (!Array.isArray(citas)) return [];

    return citas.filter((cita) => {
      const fecha = cita.fecha_ingreso || cita.fecha_cita;
      if (!fecha) return false;

      const mismaFecha = mexicoYMD(fecha) === selectedDate;
      const mismaAgencia =
        !cita.agencia || agenciaCanonical(cita.agencia) === agenciaActual;

      return mismaFecha && mismaAgencia;
    });
  }, [citas, selectedDate, agenciaActual]);

  const rangoHorario = useMemo(() => {
    let cierreMin = CIERRE_DEFECTO.hour * 60 + CIERRE_DEFECTO.minute;

    citasDeLaFecha.forEach((cita) => {
      const hm = mexicoHourMinute(cita.fecha_ingreso || cita.fecha_cita);
      if (!hm) return;

      const finCitaMin = hm.hour * 60 + (hm.minute < 30 ? 30 : 60);
      cierreMin = Math.max(cierreMin, finCitaMin);
    });

    return {
      inicio: APERTURA_DEFECTO,
      fin: {
        hour: Math.floor(cierreMin / 60),
        minute: cierreMin % 60,
      },
    };
  }, [citasDeLaFecha]);

  const horarios = useMemo(
    () => buildHorarios(rangoHorario.inicio, rangoHorario.fin),
    [rangoHorario],
  );

  const citasPorCelda = useMemo(() => {
    const map = new Map();

    citasDeLaFecha.forEach((cita) => {
      const asesor = cita.asesor || cita.nombre_asesor;
      const slot = slotKeyFromFecha(cita.fecha_ingreso || cita.fecha_cita);
      if (!asesor || !slot) return;

      const key = `${asesor}__${slot}`;
      const current = map.get(key) || [];
      current.push(cita);
      current.sort(
        (a, b) =>
          new Date(a.fecha_ingreso || a.fecha_cita) -
          new Date(b.fecha_ingreso || b.fecha_cita),
      );
      map.set(key, current);
    });

    return map;
  }, [citasDeLaFecha]);

  const estadisticas = useMemo(() => {
    const estados = citasDeLaFecha.map((cita) =>
      estadoOperativoCita(cita, reloj),
    );

    const total = citasDeLaFecha.length;
    const citados = estados.filter((estado) => estado !== "no_citado").length;
    const noCitados = estados.filter((estado) => estado === "no_citado").length;
    const asistencias = estados.filter((estado) => estado === "asistio").length;
    const noShow = estados.filter((estado) => estado === "no_show").length;
    const pendientesAsistencia = estados.filter(
      (estado) => estado === "pendiente",
    ).length;

    // La cobertura solo mide registros capturados explícitamente en la BD.
    // Un No Show automático por hora vencida no se considera seguimiento capturado.
    const registrosConAsistencia = citasDeLaFecha.filter(
      (cita) => citaCitada(cita) && asistenciaFromAny(cita) !== null,
    ).length;

    return {
      total,
      citados,
      noCitados,
      asistencias,
      noShow,
      pendientesAsistencia,
      ingresosTotales: Math.max(citados - noShow, 0) + noCitados,
      tasaAsistencia: percentage(asistencias, citados),
      coberturaAsistencia: percentage(registrosConAsistencia, citados),
    };
  }, [citasDeLaFecha, reloj]);

  const metricasPorMedio = useMemo(() => {
    const agrupados = new Map();

    citasDeLaFecha.forEach((cita) => {
      const nombre =
        String(cita?.medio_concertacion || "").trim() ||
        "Sin medio de concertación";

      agrupados.set(nombre, (agrupados.get(nombre) || 0) + 1);
    });

    return Array.from(agrupados.entries())
      .map(([nombre, total]) => ({ nombre, total }))
      .sort(
        (a, b) =>
          b.total - a.total || a.nombre.localeCompare(b.nombre, "es"),
      );
  }, [citasDeLaFecha]);

  const metricasTiposServicio = useMemo(() => {
    const conteos = Object.fromEntries(
      CATEGORIAS_SERVICIO.map((categoria) => [categoria.id, 0]),
    );

    citasDeLaFecha.forEach((cita) => {
      const tipos = parseTiposServicio(cita?.tipo_cita);
      const categoriasDeLaCita = new Set(
        tipos.map(identificarCategoriaServicio),
      );

      if (categoriasDeLaCita.size === 0) {
        categoriasDeLaCita.add("otros");
      }

      categoriasDeLaCita.forEach((categoriaId) => {
        conteos[categoriaId] += 1;
      });
    });

    return CATEGORIAS_SERVICIO.map((categoria) => ({
      ...categoria,
      value: conteos[categoria.id] || 0,
    }));
  }, [citasDeLaFecha]);

  const posicionAhora = useMemo(() => {
    if (selectedDate !== mexicoYMD(reloj)) return null;

    const hm = mexicoHourMinute(reloj);
    if (!hm) return null;

    const minutosActuales = hm.hour * 60 + (hm.minute < 30 ? 0 : 30);
    const inicio = rangoHorario.inicio.hour * 60 + rangoHorario.inicio.minute;
    const fin = rangoHorario.fin.hour * 60 + rangoHorario.fin.minute;

    if (minutosActuales < inicio || minutosActuales > fin) return null;

    return ADVISOR_COL_WIDTH + ((minutosActuales - inicio) / 30) * SLOT_WIDTH;
  }, [reloj, selectedDate, rangoHorario]);

  const totalColumnas = horarios.length;
  const gridTemplateColumns = `${ADVISOR_COL_WIDTH}px repeat(${totalColumnas}, ${SLOT_WIDTH}px)`;
  const gridTemplateRows = `${HEADER_HEIGHT}px repeat(${Math.max(
    asesores.length,
    1,
  )}, ${ROW_HEIGHT}px)`;
  const gridWidth = ADVISOR_COL_WIDTH + totalColumnas * SLOT_WIDTH;

  if (asesores.length === 0) {
    return (
      <div className="rounded-[22px] border border-[#DDE5EF] bg-white px-4 py-16 text-center">
        <Users className="mx-auto mb-3 h-8 w-8 text-[#8A95A6]" />
        <p className="text-[14px] font-bold text-[#536070]">
          No hay asesores configurados para {agenciaSeleccionada}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ExecutiveOverview
        estadisticas={estadisticas}
        medios={metricasPorMedio}
        tiposServicio={metricasTiposServicio}
      />

      <div className="relative max-h-[900px] overflow-auto rounded-[18px] border border-[#DDE5EF] bg-white shadow-[0_18px_44px_rgba(0,30,80,0.08)]">
        <div
          className="relative grid"
          style={{
            gridTemplateColumns,
            gridTemplateRows,
            width: gridWidth,
          }}
        >
          <div
            className="sticky left-0 top-0 z-30 flex items-center border-b border-r border-[#DDE5EF] bg-white px-5 text-[11px] font-black uppercase tracking-wide text-[#131E5C]"
            style={{ gridColumn: "1 / 2", gridRow: "1 / 2" }}
          >
            Asesor
          </div>

          {horarios.map((slot, index) => {
            const esMediaHora = slot.endsWith(":30");

            return (
              <div
                key={slot}
                className={`sticky top-0 z-20 flex items-center justify-center border-b border-l bg-white text-[11px] font-bold tabular-nums ${esMediaHora
                  ? "border-l-[#B9C7DA] border-b-[#DDE5EF] border-l-dashed text-[#536070]"
                  : "border-[#DDE5EF] text-[#131E5C]"
                  }`}
                style={{
                  gridColumn: `${2 + index} / span 1`,
                  gridRow: "1 / 2",
                }}
              >
                {slot}
              </div>
            );
          })}

          {asesores.map((asesor, rowIdx) => {
            const color = colorForAsesor(asesor.nombre);
            const citasAsesor = citasDeLaFecha.filter(
              (cita) =>
                (cita.asesor || cita.nombre_asesor) === asesor.nombre,
            );
            const rowClass = rowIdx % 2 ? "bg-[#F8FAFD]" : "bg-white";

            return (
              <div key={asesor.id} className="contents">
                <div
                  className={`sticky left-0 z-10 flex items-center border-b border-r border-[#DDE5EF] px-4 ${rowClass}`}
                  style={{
                    gridColumn: "1 / 2",
                    gridRow: `${2 + rowIdx} / span 1`,
                  }}
                >
                  <AdvisorStats
                    asesor={asesor}
                    color={color}
                    citasAsesor={citasAsesor}
                  />
                </div>

                {horarios.map((slot, colIdx) => {
                  const citasCelda =
                    citasPorCelda.get(`${asesor.nombre}__${slot}`) || [];
                  const esMediaHora = slot.endsWith(":30");

                  return (
                    <div
                      key={`${asesor.id}-${slot}`}
                      className={`border-b border-l p-2 ${rowClass} ${esMediaHora
                        ? "border-l-[#B9C7DA] border-b-[#DDE5EF] border-l-dashed"
                        : "border-[#DDE5EF]"
                        }`}
                      style={{
                        gridColumn: `${2 + colIdx} / span 1`,
                        gridRow: `${2 + rowIdx} / span 1`,
                      }}
                    >
                      {citasCelda.length > 0 ? (
                        <div className="flex h-full gap-2 overflow-x-auto pb-0.5">
                          {citasCelda.map((cita) => (
                            <CitaCard
                              key={
                                cita.id ||
                                `${asesor.nombre}-${slot}-${nombreCliente(cita)}`
                              }
                              cita={cita}
                              ahora={reloj}
                              abrirEditar={abrirEditar}
                              onSetAsistencia={onSetAsistencia}
                              updatingInline={updatingInline}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptySlot
                          slot={slot}
                          onClick={
                            onSlotClick
                              ? () => onSlotClick(asesor.nombre, slot)
                              : undefined
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {posicionAhora !== null ? (
            <div
              className="pointer-events-none absolute z-20 w-0.5 bg-[#B42318]"
              style={{
                left: posicionAhora,
                top: HEADER_HEIGHT,
                bottom: 0,
              }}
            >
              <div className="absolute -left-[5px] -top-2 h-3 w-3 rounded-full bg-[#B42318] shadow-[0_0_0_4px_rgba(180,35,24,0.12)]" />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-[#8A95A6]">
        <TipoBadge tipo="Servicio" />
        <TipoBadge tipo="Reparación" />
        <TipoBadge tipo="Diagnóstico" />
        <TipoBadge tipo="Campaña" />
      </div>
    </div>
  );
}