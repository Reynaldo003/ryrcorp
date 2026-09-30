// src/pages/Servicio/Gota.jsx
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  Filter,
  Info,
  ListFilter,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SearchX,
  Sheet,
  Tag,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getGotaDashboard, getGotaOpciones, getGotaOrdenes } from "../../lib/apiGota";

const C = {
  navy: "#131E5C",
  navyDark: "#0A1340",
  navyMid: "#1E2F7A",
  accent: "#1677FF",
  border: "#E4E7F0",
  surface: "#F7F8FC",
};

const PALETA_VW = [
  "#001E50",
  "#1677FF",
  "#0EA5E9",
  "#38BDF8",
  "#6366F1",
  "#14B8A6",
  "#F59E0B",
  "#10B981",
];

/* Escala de semáforo para los rangos de permanencia (verde -> rojo). */
const ORDEN_RANGOS_ANTIGUEDAD = [
  "0-1 días",
  "2-3 días",
  "4-7 días",
  "8-15 días",
  "Más de 15 días",
];

const PALETA_ANTIGUEDAD = [
  "#10B981",
  "#22C55E",
  "#F59E0B",
  "#F97316",
  "#DC2626",
];

/* El color depende del rango y no de su posición: así un rango vacío
   no desplaza la escala verde -> rojo de los siguientes. */
function colorAntiguedad(rango) {
  const indice = ORDEN_RANGOS_ANTIGUEDAD.indexOf(rango);
  const seguro = indice < 0 ? 0 : indice;
  return PALETA_ANTIGUEDAD[seguro % PALETA_ANTIGUEDAD.length];
}

/* Límites en días calendario (igual que DATEDIFF del backend) de cada
   rango de permanencia: permiten traducir el rango tocado a un filtro
   fecha_desde/fecha_hasta exacto sobre DtAbertura. */
const LIMITES_RANGO_ANTIGUEDAD = {
  "0-1 días": { min: 0, max: 1 },
  "2-3 días": { min: 2, max: 3 },
  "4-7 días": { min: 4, max: 7 },
  "8-15 días": { min: 8, max: 15 },
  "Más de 15 días": { min: 16, max: null },
};

function fechaHaceDiasISO(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

function rangoFechasAntiguedad(nombre) {
  const limites = LIMITES_RANGO_ANTIGUEDAD[nombre];
  if (!limites) return null;

  return {
    fecha_desde: limites.max === null ? "" : fechaHaceDiasISO(limites.max),
    fecha_hasta: fechaHaceDiasISO(limites.min),
  };
}

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "1px solid #E2E8F0",
  boxShadow:
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  fontSize: 12,
  fontFamily: "inherit",
  fontWeight: "bold",
  color: "#001E50",
};

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

function numero(valor) {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function dinero(valor) {
  return numero(valor).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function dineroCompacto(valor) {
  const n = numero(valor);
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return dinero(n);
}

function entero(valor) {
  return numero(valor).toLocaleString("es-MX", {
    maximumFractionDigits: 0,
  });
}

function porcentajeDecimal(valor) {
  return numero(valor).toLocaleString("es-MX", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function formatearFechaISO(valor) {
  if (!valor) return "—";
  const texto = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    const partes = texto.substring(0, 10).split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
  }
  return texto || "—";
}

function formatearHora(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const segundos = n % 100;
  const minutos = Math.floor((n / 100) % 100);
  const horas = Math.floor(n / 10000);
  const hh = String(horas).padStart(2, "0");
  const mm = String(minutos).padStart(2, "0");
  const ss = String(segundos).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function obtenerDiasTaller(abertura) {
  if (!abertura) return null;
  const d = new Date(abertura);
  if (Number.isNaN(d.getTime())) return null;
  const hoy = new Date();
  const diff = hoy.getTime() - d.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function vacio(valor) {
  return valor === null || valor === undefined || String(valor).trim() === "";
}

/* ============================================================
   TONOS VISUALES
   ============================================================ */

function tonoDias(dias) {
  if (dias === null) return "border-slate-200 bg-slate-50 text-slate-500";
  if (dias <= 1) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (dias <= 3) return "border-teal-200 bg-teal-50 text-teal-700";
  if (dias <= 7) return "border-amber-200 bg-amber-50 text-amber-700";
  if (dias <= 15) return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-red-200 bg-red-50 text-red-700";
}

/* Clasificación por palabra clave del texto de situación que trae la BD. */
const TONOS_SITUACION = [
  {
    claves: ["cancel", "rechaz", "anul"],
    chip: "border-rose-200 bg-rose-50 text-rose-700",
    punto: "bg-rose-500",
  },
  {
    claves: ["conclu", "finaliz", "cerrad", "fechad", "entreg", "termin"],
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    punto: "bg-emerald-500",
  },
  {
    claves: ["espera", "pend", "refacc", "aguard", "suspens", "falta"],
    chip: "border-amber-200 bg-amber-50 text-amber-700",
    punto: "bg-amber-500",
  },
  {
    claves: ["garant"],
    chip: "border-violet-200 bg-violet-50 text-violet-700",
    punto: "bg-violet-500",
  },
  {
    claves: ["dagn", "process", "curso", "abiert", "recep", "taller", "ejecuc"],
    chip: "border-sky-200 bg-sky-50 text-sky-700",
    punto: "bg-sky-500",
  },
];

const TONO_SITUACION_NEUTRO = {
  chip: "border-slate-200 bg-slate-50 text-slate-600",
  punto: "bg-slate-400",
};

function tonoSituacion(situacao) {
  const texto = String(situacao || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const coincidencia = TONOS_SITUACION.find((tono) =>
    tono.claves.some((clave) => texto.includes(clave))
  );

  return coincidencia || TONO_SITUACION_NEUTRO;
}

/* ============================================================
   PRIMITIVAS DE INTERFAZ
   ============================================================ */

function Badge({ children, className = "", punto }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
        className
      )}
    >
      {punto && (
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", punto)} />
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}

function EtiquetaCampo({ children, htmlFor }) {
  return (
    <span
      htmlFor={htmlFor}
      className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"
    >
      {children}
    </span>
  );
}

const CLASES_CONTROL =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/15";

/* ============================================================
   AVISOS FLOTANTES (retroalimentación de acciones)
   ============================================================ */

const TONOS_AVISO = {
  info: {
    icono: Info,
    contenedor: "border-[#131E5C]/20 bg-[#131E5C] text-white",
  },
  success: {
    icono: CheckCircle2,
    contenedor: "border-emerald-500/25 bg-emerald-600 text-white",
  },
  error: {
    icono: AlertTriangle,
    contenedor: "border-red-500/25 bg-red-600 text-white",
  },
};

function useAvisos() {
  const [avisos, setAvisos] = useState([]);
  const secuencia = useRef(0);

  const push = useCallback((texto, tono = "info") => {
    secuencia.current += 1;
    const id = secuencia.current;

    setAvisos((prev) => [...prev, { id, texto, tono }]);

    setTimeout(() => {
      setAvisos((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  return { avisos, push };
}

function PilaAvisos({ avisos }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      {avisos.map(({ id, texto, tono }) => {
        const { icono: Icon, contenedor } = TONOS_AVISO[tono] || TONOS_AVISO.info;

        return (
          <div
            key={id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg",
              contenedor
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="min-w-0 flex-1 text-xs font-semibold">{texto}</p>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

/* ============================================================
   TARJETA DE GRÁFICA
   ============================================================ */

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = "",
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon && (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#131E5C]/10 bg-white text-[#131E5C]">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-[#001E50]">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-[11px] leading-tight text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>

      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}

function EtiquetaVacia({ mensaje = "Sin datos para mostrar" }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
      <SearchX className="h-6 w-6 text-slate-300" />
      <p className="text-xs font-semibold text-slate-400">{mensaje}</p>
    </div>
  );
}

function crearRenderLabel(total) {
  return function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, value }) {
    if (!value) return null;

    const porcentaje = total > 0 ? Math.round((value / total) * 100) : 0;
    if (porcentaje < 4) return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return (
      <text
        x={x}
        y={y}
        fill="#FFFFFF"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] font-bold"
      >
        {porcentaje}%
      </text>
    );
  };
}

function VWPieCard({
  title,
  subtitle,
  icon: Icon,
  action,
  data = [],
  height = 300,
  label,
  colors = PALETA_VW,
}) {
  const total = data.reduce((acc, item) => acc + numero(item.value), 0);

  return (
    <ChartCard title={title} subtitle={subtitle} icon={Icon} action={action}>
      {data.length === 0 ? (
        <EtiquetaVacia />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={118}
              labelLine={false}
              label={crearRenderLabel(total)}
              paddingAngle={2}
            >
              {data.map((item, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={item.color || colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${entero(value)} (${porcentajeDecimal(
                  total > 0 ? (numero(value) / total) * 100 : 0
                )}%)`,
                name,
              ]}
              contentStyle={TOOLTIP_STYLE}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconSize={8}
              wrapperStyle={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#475569",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      {label && (
        <p className="mt-2 text-center text-[11px] text-slate-500">{label}</p>
      )}
    </ChartCard>
  );
}

function VWBarCard({
  title,
  subtitle,
  icon: Icon,
  action,
  data = [],
  height = 300,
  xKey = "name",
  yKey = "value",
  formatoEjeY = entero,
  barColor = C.accent,
  gradientId,
}) {
  return (
    <ChartCard title={title} subtitle={subtitle} icon={Icon} action={action}>
      {data.length === 0 ? (
        <EtiquetaVacia />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={barColor} stopOpacity={1} />
                <stop offset="100%" stopColor={barColor} stopOpacity={0.55} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 10, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              angle={-15}
              textAnchor="end"
              height={64}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#475569" }}
              tickFormatter={(value) => formatoEjeY(value)}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              formatter={(value, name) => [
                name === "monto" ? dinero(value) : entero(value),
                name === "monto" ? "Monto" : "Órdenes",
              ]}
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "rgba(19, 30, 92, 0.05)" }}
            />
            <Bar
              dataKey={yKey}
              radius={[8, 8, 0, 0]}
              maxBarSize={42}
              fill={`url(#${gradientId})`}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function VWAreaCard({
  title,
  subtitle,
  icon: Icon,
  action,
  data = [],
  height = 300,
  xKey = "name",
  yKey = "value",
}) {
  return (
    <ChartCard title={title} subtitle={subtitle} icon={Icon} action={action}>
      {data.length === 0 ? (
        <EtiquetaVacia />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
          >
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 10, fill: "#475569" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#475569" }}
              tickFormatter={(value) => entero(value)}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              formatter={(value) => [entero(value), "Órdenes"]}
              contentStyle={TOOLTIP_STYLE}
            />
            <Line
              type="monotone"
              dataKey={yKey}
              stroke="#0EA5E9"
              strokeWidth={3}
              dot={{ fill: "#0EA5E9", r: 3 }}
              activeDot={{ fill: "#131E5C", r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* ============================================================
   TARJETA KPI
   ============================================================ */

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tono = "navy",
  cargando = false,
}) {
  const tonos = {
    navy: "border-[#131E5C]/15 bg-[#131E5C]/10 text-[#131E5C]",
    sky: "border-sky-100 bg-sky-50 text-sky-600",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-600",
    amber: "border-amber-100 bg-amber-50 text-amber-600",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white p-4 shadow-sm transition hover:border-[#131E5C]/25 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>

          {cargando ? (
            <div className="mt-2 h-7 w-28 animate-pulse rounded-lg bg-slate-200" />
          ) : (
            <p className="mt-1.5 truncate text-[22px] font-black leading-none text-[#001E50]">
              {value}
            </p>
          )}

          {subtitle && (
            <p className="mt-1.5 truncate text-[11px] font-medium text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              tonos[tono] || tonos.navy
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   RESUMEN EJECUTIVO (HERO)
   ============================================================ */

function ResumenEjecutivo({
  cargando,
  totales,
  antiguedad,
  agencias,
  rangoActivo,
  onSeleccionarRango,
}) {
  const maximoAgencia = Math.max(1, ...agencias.map((item) => item.ordenes));
  const topAgencias = agencias.slice(0, 6);

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A1340] via-[#131E5C] to-[#1E2F7A] p-5 text-white shadow-[0_18px_40px_-18px_rgba(10,19,64,0.7)] md:p-6">
      <Wrench
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -bottom-12 h-64 w-64 text-white/[0.05]"
        strokeWidth={1}
      />

      <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* TOTAL + DESGLOSE POR PERMANENCIA */}
        <div className="lg:col-span-5 lg:border-r lg:border-white/10 lg:pr-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">
            <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
            Resumen ejecutivo · Postventa
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Órdenes de taller abiertas
            </p>

            <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
              {cargando ? (
                <div className="h-11 w-32 animate-pulse rounded-lg bg-white/15" />
              ) : (
                <span className="text-5xl font-black leading-none tracking-tight">
                  {entero(totales.ordenes)}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-400/15 px-2.5 py-1 text-[11px] font-bold text-sky-200">
                <MapPin className="h-3 w-3" />
                {entero(totales.agencias)} agencia
                {numero(totales.agencias) === 1 ? "" : "s"}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Matriz de órdenes de servicio con captura de refacciones y mano de
              obra.
            </p>
          </div>

          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Toca un rango para ver sus órdenes
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {antiguedad.length === 0 ? (
              <p className="col-span-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-[11px] font-medium text-slate-400">
                Sin Permanencia calculable: las órdenes no tienen fecha de
                apertura.
              </p>
            ) : (
              antiguedad.map((item) => {
                const activo = rangoActivo === item.name;

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => onSeleccionarRango(item.name)}
                    aria-pressed={activo}
                    title={`Ver órdenes con ${item.name} en taller`}
                    className={cn(
                      "cursor-pointer rounded-xl border px-3 py-2.5 text-center transition",
                      activo
                        ? "border-sky-300/60 bg-white/[0.14] ring-2 ring-sky-300/60"
                        : "border-white/10 bg-white/[0.06] hover:border-white/25 hover:bg-white/[0.1]"
                    )}
                  >
                    <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-lg font-bold leading-none">
                      {entero(item.value)}
                    </p>
                    <span
                      className="mx-auto mt-2 block h-1 w-8 rounded-full"
                      style={{ backgroundColor: colorAntiguedad(item.name) }}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* DISTRIBUCIÓN POR AGENCIA */}
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-200">
              <MapPin className="h-4 w-4 text-sky-400" />
              Carga por agencia
            </h3>
            <span className="text-[11px] text-slate-400">
              {topAgencias.length} de {agencias.length} agencias
            </span>
          </div>

          {topAgencias.length === 0 ? (
            <p className="mt-6 rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-[11px] font-medium text-slate-400">
              Sin agencias con órdenes activas.
            </p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {topAgencias.map((item) => {
                const porcentaje = Math.min(
                  100,
                  Math.round((item.ordenes / maximoAgencia) * 100)
                );

                return (
                  <div
                    key={item.name}
                    className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-xs font-semibold text-slate-100">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-[11px] font-bold text-sky-300">
                        {entero(item.ordenes)} OS · {dineroCompacto(item.monto)}
                      </span>
                    </div>

                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#1677FF] transition-[width] duration-500"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   DETALLE DE RANGO DE PERMANENCIA
   Panel bajo el resumen ejecutivo: lista las órdenes cuya fecha
   de apertura cae en el rango de días tocado. Usa el endpoint de
   listado con fecha_desde/fecha_hasta, sin parámetros nuevos.
   ============================================================ */

const PAGE_SIZE_DETALLE_RANGO = 200;

function DetalleRangoAntiguedad({ rango, filtrosBase, onClose, onVerEnTabla }) {
  const [ordenes, setOrdenes] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const fechas = rangoFechasAntiguedad(rango);

  // Los cuadritos del resumen usan la base global (sin filtros):
  // el detalle debe consultar con la misma base para que los
  // totales coincidan.
  const conFiltros = Object.values(filtrosBase || {}).some(
    (valor) => valor !== "" && valor !== undefined && valor !== null
  );

  useEffect(() => {
    if (!fechas) return;
    let vigente = true;

    getGotaOrdenes({
      ...filtrosBase,
      fecha_desde: fechas.fecha_desde,
      fecha_hasta: fechas.fecha_hasta,
      page: 1,
      page_size: PAGE_SIZE_DETALLE_RANGO,
      ordering: "dt_abertura",
    })
      .then((data) => {
        if (!vigente) return;
        setOrdenes(data?.results || []);
        setTotal(Number(data?.count || 0));
        setCargando(false);
      })
      .catch((err) => {
        if (!vigente) return;
        setOrdenes([]);
        setTotal(0);
        setError(
          err?.message || "No fue posible consultar las órdenes del rango."
        );
        setCargando(false);
      });

    return () => {
      vigente = false;
    };
    // Se reconsulta al cambiar de rango o de filtros base.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rango, filtrosBase]);

  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#131E5C]/10 bg-white text-[#131E5C]">
            <Clock className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#001E50]">
              Órdenes con {rango} en taller
              {!cargando && !error && (
                <span className="rounded-full bg-[#131E5C] px-2 py-0.5 text-[10px] font-bold text-white">
                  {entero(total)}
                </span>
              )}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              Apertura {fechas?.fecha_desde || "sin límite"} →{" "}
              {fechas?.fecha_hasta || "sin límite"}
              {conFiltros ? " · con filtros aplicados" : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!cargando && !error && total > 0 && (
            <button
              type="button"
              onClick={onVerEnTabla}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#131E5C] px-3 text-[11px] font-bold text-white transition hover:bg-[#0A1340]"
            >
              Ver en la tabla
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Ocultar detalle del rango"
            title="Ocultar detalle del rango"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          >
            <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="space-y-2 p-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-lg bg-slate-100"
            />
          ))}
        </div>
      ) : error ? (
        <p className="flex items-center gap-2 px-4 py-5 text-xs font-bold text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : ordenes.length === 0 ? (
        <p className="px-4 py-5 text-center text-xs font-medium text-slate-500">
          Sin órdenes abiertas en este rango de permanencia.
        </p>
      ) : (
        <div className="max-h-80 overflow-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead className="sticky top-0 bg-[#F7F8FC]">
              <tr className="border-b border-[#E4E7F0] text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="px-4 py-2">
                  OS
                </th>
                <th scope="col" className="px-4 py-2">
                  Agencia
                </th>
                <th scope="col" className="px-4 py-2">
                  Tipo OS
                </th>
                <th scope="col" className="px-4 py-2">
                  Apertura
                </th>
                <th scope="col" className="px-4 py-2 text-center">
                  Días
                </th>
                <th scope="col" className="px-4 py-2 text-right">
                  Total partes
                </th>
              </tr>
            </thead>

            <tbody>
              {ordenes.map((fila, indice) => {
                const dias = obtenerDiasTaller(fila.dt_abertura);

                return (
                  <tr
                    key={claveFila(fila)}
                    className={cn(
                      "border-b border-slate-100 last:border-0",
                      indice % 2 === 1 && "bg-[#FAFBFF]"
                    )}
                  >
                    <td className="whitespace-nowrap px-4 py-2 font-bold text-[#131E5C]">
                      {fila.nr_os ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                      {vacio(fila.agencia) ? "—" : fila.agencia}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                      {vacio(fila.tp_os) ? "—" : fila.tp_os}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                      {formatearFechaISO(fila.dt_abertura)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-center">
                      {dias === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                            tonoDias(dias)
                          )}
                        >
                          {dias}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-right font-bold text-slate-800">
                      {dinero(fila.vr_total_pecas)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!cargando && !error && total > ordenes.length && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E4E7F0] bg-[#F7F8FC] px-4 py-2.5">
          <p className="text-[11px] text-slate-500">
            Mostrando {entero(ordenes.length)} de {entero(total)} órdenes
          </p>
          <button
            type="button"
            onClick={onVerEnTabla}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#131E5C] transition hover:underline"
          >
            Ver todas en la tabla
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   FILTRO POR COLUMNA (PORTAL)
   ============================================================ */

function ColumnFilterMenu({
  label,
  values,
  selected,
  onToggle,
  onClear,
  onClose,
  anchor,
}) {
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  const ancho = 272;
  const altoEstimado = 320;
  const abrirArriba =
    anchor.bottom + altoEstimado > window.innerHeight && anchor.top > altoEstimado;

  const top = abrirArriba
    ? Math.max(8, anchor.top - 8)
    : anchor.bottom + 6;

  const left = Math.max(
    8,
    Math.min(anchor.left, window.innerWidth - ancho - 8)
  );

  const alineacion = abrirArriba
    ? { bottom: window.innerHeight - top, maxHeight: Math.max(180, top - 16) }
    : { maxHeight: Math.max(180, window.innerHeight - top - 16) };

  useEffect(() => {
    function onDocument(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        onClose();
      }
    }

    function onTecla(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", onDocument);
    document.addEventListener("keydown", onTecla);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);

    return () => {
      document.removeEventListener("mousedown", onDocument);
      document.removeEventListener("keydown", onTecla);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  const filteredValues = useMemo(() => {
    if (!query) return values;
    return values.filter((value) =>
      value.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, values]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={wrapperRef}
      style={{ position: "fixed", top, left, width: ancho, ...alineacion }}
      className="z-[60] flex flex-col overflow-hidden rounded-xl border border-[#E4E7F0] bg-white shadow-2xl"
    >
      <div className="shrink-0 border-b border-[#E4E7F0] bg-[#F7F8FC] px-3 py-2.5">
        <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>

        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar valor..."
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-[11px] text-slate-700 outline-none transition focus:border-[#131E5C] focus:ring-2 focus:ring-[#131E5C]/15"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {filteredValues.length === 0 ? (
          <p className="px-3 py-6 text-center text-[11px] text-slate-400">
            Sin resultados
          </p>
        ) : (
          filteredValues.map((value) => {
            const activo = selected.has(value);

            return (
              <button
                key={value}
                type="button"
                onClick={() => onToggle(value)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition hover:bg-[#F7F8FC]"
              >
                <span
                  className={cn(
                    "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
                    activo
                      ? "border-[#131E5C] bg-[#131E5C] text-white"
                      : "border-slate-300 bg-white"
                  )}
                >
                  {activo && <Check className="h-2.5 w-2.5" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">
                  {value}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex shrink-0 gap-2 border-t border-[#E4E7F0] bg-[#F7F8FC] px-3 py-2">
        <button
          type="button"
          onClick={onClear}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg bg-[#131E5C] px-2 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#0A1340]"
        >
          Listo
        </button>
      </div>
    </div>,
    document.body
  );
}

/* ============================================================
   DEFINICIÓN DE COLUMNAS
   tipo: texto | entero | moneda | fecha | hora | bool
   filtro: la columna alimenta el dropdown de filtro del encabezado
   ============================================================ */

const COLUMNAS = [
  { key: "agencia", label: "Agencia", tipo: "texto", filtro: true, alineacion: "chip" },
  { key: "nr_os", label: "OS", tipo: "entero", filtro: true, alineacion: "fuerte" },
  { key: "nr_atendimento", label: "Atención", tipo: "entero", filtro: true },
  { key: "tp_os", label: "Tipo OS", tipo: "texto", filtro: true, alineacion: "chip" },
  { key: "subtipo_os", label: "Subtipo", tipo: "texto", filtro: true },
  { key: "situacao", label: "Situación", tipo: "texto", filtro: true, alineacion: "estado" },
  { key: "dt_abertura", label: "Apertura", tipo: "fecha", filtro: true, alineacion: "fecha" },
  { key: "hr_abertura", label: "Hora apertura", tipo: "hora" },
  { key: "dias_taller", label: "Días taller", tipo: "entero", alineacion: "dias" },
  { key: "id_job", label: "Job", tipo: "entero", filtro: true },
  { key: "vr_pecas", label: "Partes", tipo: "moneda" },
  { key: "vr_om", label: "Mano de obra", tipo: "moneda" },
  { key: "vr_lubrif", label: "Lubricantes", tipo: "moneda" },
  { key: "vr_acessor", label: "Accesorios", tipo: "moneda" },
  { key: "vr_cascos", label: "Cascos", tipo: "moneda" },
  { key: "vr_adicionais", label: "Adicionales", tipo: "moneda" },
  { key: "vr_adiantam", label: "Ad anticipos", tipo: "moneda" },
  { key: "vr_desc_peca", label: "Desc. partes", tipo: "moneda" },
  { key: "perc_desc_pcs", label: "% desc. piezas", tipo: "numero" },
  { key: "vr_total_pecas", label: "Total partes", tipo: "moneda", alineacion: "fuerte" },
  { key: "cod_pagador", label: "Pagador", tipo: "entero" },
  { key: "cod_cond_pgto", label: "Cond. pago", tipo: "entero" },
  { key: "cod_oper_fiscal", label: "Oper. fiscal", tipo: "entero" },
  { key: "forma_pago", label: "Forma pago", tipo: "texto", filtro: true },
  { key: "uso_cfdi", label: "Uso CFDI", tipo: "texto", filtro: true },
  { key: "sit_garantia", label: "Garantía", tipo: "texto", filtro: true },
  { key: "sit_fiss", label: "FISS", tipo: "texto" },
  { key: "motivo_cancel", label: "Motivo cancel.", tipo: "entero" },
  { key: "dt_debloq", label: "Desbloqueo", tipo: "fecha" },
  { key: "dt_emi_prefact", label: "Prefactura", tipo: "fecha" },
  { key: "hora_llegada", label: "Hora llegada", tipo: "hora" },
  { key: "dt_fechamento", label: "Cierre", tipo: "fecha" },
  { key: "hr_fechamento", label: "Hora cierre", tipo: "hora" },
  { key: "rowid", label: "RowID" },
];

function columnaPorClave(key) {
  return COLUMNAS.find((col) => col.key === key);
}

const STORAGE_COLUMNAS_GOTA = "gota_columnas_visibles";

function columnasPorDefecto() {
  return new Set(COLUMNAS.map((col) => col.key));
}

function columnasGuardadasIniciales() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(STORAGE_COLUMNAS_GOTA));

    if (!Array.isArray(guardadas)) return columnasPorDefecto();

    const validas = guardadas.filter((key) =>
      COLUMNAS.some((col) => col.key === key)
    );

    return validas.length ? new Set(validas) : columnasPorDefecto();
  } catch {
    return columnasPorDefecto();
  }
}

function formatCell(fila, col) {
  const value = fila[col.key];

  if (col.key === "dias_taller") {
    const dias = obtenerDiasTaller(fila.dt_abertura);
    return dias === null ? "—" : String(dias);
  }

  if (vacio(value)) return "—";
  if (col.tipo === "fecha") return formatearFechaISO(value);
  if (col.tipo === "hora") return formatearHora(value);
  if (col.tipo === "moneda") return dinero(value);
  if (col.tipo === "numero") {
    return numero(value).toLocaleString("es-MX", {
      maximumFractionDigits: 2,
    });
  }
  if (col.tipo === "entero") return entero(value);
  return String(value);
}

/* ============================================================
   CELDA DE LA TABLA
   ============================================================ */

function CeldaOrden({ fila, col }) {
  const texto = formatCell(fila, col);
  const sinDato = texto === "—";

  if (col.alineacion === "dias") {
    const dias = obtenerDiasTaller(fila.dt_abertura);

    return (
      <div className="flex justify-center">
        <span
          title={`${texto} día(s) en taller`}
          className={cn(
            "inline-flex min-w-[46px] items-center justify-center rounded-lg border px-2 py-0.5 text-[11px] font-bold",
            tonoDias(dias)
          )}
        >
          {sinDato ? "—" : `${texto} d`}
        </span>
      </div>
    );
  }

  if (col.alineacion === "estado" && !sinDato) {
    const tono = tonoSituacion(fila[col.key]);

    return (
      <div>
        <Badge className={tono.chip} punto={tono.punto}>
          {texto}
        </Badge>
      </div>
    );
  }

  if ((col.alineacion === "chip" || col.alineacion === "fuerte") && !sinDato) {
    return (
      <div>
        <span
          className={cn(
            "inline-block max-w-full truncate rounded-lg border px-2 py-1 text-[11px] font-bold",
            col.alineacion === "fuerte"
              ? "border-[#131E5C]/15 bg-[#131E5C]/8 text-[#131E5C]"
              : "border-slate-200 bg-slate-50 text-slate-600"
          )}
        >
          {texto}
        </span>
      </div>
    );
  }

  if (col.alineacion === "fecha" && !sinDato) {
    return (
      <div className="flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-300" />
        <span className="truncate">{texto}</span>
      </div>
    );
  }

  return <div className="max-w-[320px] truncate">{texto}</div>;
}

/* ============================================================
   DETALLE DE LA ORDEN (FILA EXPANDIDA)
   Se despliega dentro de la tabla, bajo la fila seleccionada.
   ============================================================ */

function claveFila(fila) {
  return fila?.rowid ?? `${fila?.agencia}-${fila?.nr_os}-${fila?.nr_atendimento}`;
}

function DetalleOrden({ orden, onClose }) {
  const dias = obtenerDiasTaller(orden.dt_abertura);

  const secciones = [
    {
      titulo: "Identificación",
      icono: Wrench,
      items: [
        { etiqueta: "Agencia", valor: orden.agencia },
        { etiqueta: "Orden de servicio", valor: orden.nr_os },
        { etiqueta: "Número de atención", valor: orden.nr_atendimento },
        { etiqueta: "Tipo de OS", valor: orden.tp_os },
        { etiqueta: "Subtipo", valor: orden.subtipo_os },
        { etiqueta: "Job", valor: orden.id_job },
      ],
    },
    {
      titulo: "Tiempos en taller",
      icono: Clock,
      items: [
        {
          etiqueta: "Fecha de apertura",
          valor: formatearFechaISO(orden.dt_abertura),
        },
        {
          etiqueta: "Hora de apertura",
          valor: formatearHora(orden.hr_abertura),
        },
        {
          etiqueta: "Días en taller",
          valor: dias === null ? "—" : `${dias} día(s)`,
        },
        {
          etiqueta: "Hora de llegada",
          valor: formatearHora(orden.hora_llegada),
        },
        {
          etiqueta: "Fecha de desbloqueo",
          valor: formatearFechaISO(orden.dt_debloq),
        },
        {
          etiqueta: "Fecha de cierre",
          valor: formatearFechaISO(orden.dt_fechamento),
        },
      ],
    },
    {
      titulo: "Importes",
      icono: DollarSign,
      items: [
        { etiqueta: "Partes", valor: dinero(orden.vr_pecas) },
        { etiqueta: "Mano de obra", valor: dinero(orden.vr_om) },
        { etiqueta: "Lubricantes", valor: dinero(orden.vr_lubrif) },
        { etiqueta: "Accesorios", valor: dinero(orden.vr_acessor) },
        { etiqueta: "Cascos", valor: dinero(orden.vr_cascos) },
        { etiqueta: "Adicionales", valor: dinero(orden.vr_adicionais) },
        { etiqueta: "Adelantos", valor: dinero(orden.vr_adiantam) },
        { etiqueta: "Descuento en partes", valor: dinero(orden.vr_desc_peca) },
        {
          etiqueta: "% descuento piezas",
          valor: porcentajeDecimal(orden.perc_desc_pcs),
        },
        { etiqueta: "Total de partes", valor: dinero(orden.vr_total_pecas) },
      ],
    },
    {
      titulo: "Pago y facturación",
      icono: Tag,
      items: [
        { etiqueta: "Situación", valor: orden.situacao },
        { etiqueta: "Pagador", valor: orden.cod_pagador },
        { etiqueta: "Condición de pago", valor: orden.cod_cond_pgto },
        { etiqueta: "Operación fiscal", valor: orden.cod_oper_fiscal },
        { etiqueta: "Uso de CFDI", valor: orden.uso_cfdi },
        { etiqueta: "Forma de pago", valor: orden.forma_pago },
        { etiqueta: "Flag pagado", valor: orden.flag_pago },
        {
          etiqueta: "Fecha prefactura",
          valor: formatearFechaISO(orden.dt_emi_prefact),
        },
        {
          etiqueta: "Hora prefactura",
          valor: formatearHora(orden.hr_emi_prefact),
        },
      ],
    },
    {
      titulo: "Garantía y control",
      icono: CalendarCheck,
      items: [
        { etiqueta: "Situación garantía", valor: orden.sit_garantia },
        { etiqueta: "FISS", valor: orden.sit_fiss },
        { etiqueta: "Garantía HDA", valor: orden.nr_gar_hda },
        { etiqueta: "Motivo de cancelación", valor: orden.motivo_cancel },
        { etiqueta: "Funcionario cancelación", valor: orden.func_cancel },
        { etiqueta: "Tipo de golpe", valor: orden.tipo_golpe },
        { etiqueta: "Servicio de marca", valor: orden.tp_serv_marca },
        { etiqueta: "Check GM", valor: orden.check_gm },
        { etiqueta: "Autorización Chrysler", valor: orden.autori_crhysler },
        {
          etiqueta: "Funcionario de espera",
          valor: orden.tem_fun_pin ? "Sí" : "No",
        },
        { etiqueta: "RowID", valor: orden.rowid },
      ],
    },
  ];

  const campos = secciones.flatMap((seccion) => seccion.items);
  const camposConDato = campos.filter((item) => !vacio(item.valor)).length;
  const avance =
    campos.length === 0
      ? 0
      : Math.round((camposConDato / campos.length) * 100);

  return (
    <div className="border-b border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3">
      <div className="overflow-hidden rounded-xl border border-[#E4E7F0] bg-white">
      {/* Cabecera estilo referencia */}
        <div className="flex items-center gap-3 border-b border-[#E4E7F0] px-4 py-2.5">
          <span className="flex h-7 shrink-0 items-center rounded-lg bg-[#0A1340] px-2 text-[11px] font-black text-white">
            OS {orden.nr_os}
          </span>

          <div className="min-w-0 shrink-0">
            <p className="truncate text-xs font-black uppercase tracking-wide text-[#001E50]">
              {orden.agencia || "Sin agencia"}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              {entero(campos.length)} campos · Apertura{" "}
              {formatearFechaISO(orden.dt_abertura)}
            </p>
          </div>

          <div
            className="hidden h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100 sm:block"
            role="progressbar"
            aria-valuenow={avance}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Campos con dato capturado"
            title={`${entero(camposConDato)} de ${entero(campos.length)} campos con dato`}
          >
            <div
              className="h-full rounded-full bg-[#0A1340]"
              style={{ width: `${avance}%` }}
            />
          </div>

          {dias !== null && (
            <span
              className={cn(
                "hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase md:inline",
                dias <= 3
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : dias <= 7
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
              )}
            >
              {dias} día(s)
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Ocultar detalle"
            title="Ocultar detalle"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A1340] text-white transition hover:bg-[#1E2F7A]"
          >
            <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
        </div>

      {/* Secciones en columnas para ver todo sin tanto scroll */}
        <div className="columns-1 gap-3 md:columns-2 2xl:columns-3">
          {secciones.map((seccion) => {
            const Icon = seccion.icono;

            return (
              <div
                key={seccion.titulo}
                className="mb-3 break-inside-avoid overflow-hidden rounded-lg border border-[#E4E7F0]"
              >
                <p className="flex items-center gap-1.5 border-b border-[#E4E7F0] bg-[#F7F8FC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#1677FF]">
                  <Icon className="h-3 w-3 shrink-0" />
                  {seccion.titulo}
                </p>

                <dl>
                  {seccion.items.map(({ etiqueta, valor }, indice) => (
                    <div
                      key={etiqueta}
                      className={cn(
                        "flex items-baseline justify-between gap-2 px-2.5 py-1",
                        indice % 2 === 1 && "bg-[#FAFBFF]"
                      )}
                    >
                      <dt className="shrink-0 text-[11px] text-slate-500">
                        {etiqueta}
                      </dt>
                      <dd className="truncate text-right text-[11px] font-bold text-slate-800">
                        {vacio(valor) ? "—" : String(valor)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-2 text-[10px] text-slate-400">
        Ficha de solo lectura · los importes corresponden al valor capturado en
        la orden de servicio.
      </p>
    </div>
  );
}

/* ============================================================
   SELECTOR DE COLUMNAS
   ============================================================ */

function ColumnChooser({ visibles, onChange, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggle(key) {
    const next = new Set(visibles);

    if (next.has(key)) {
      if (next.size === 1) return; // siempre al menos una columna
      next.delete(key);
    } else {
      next.add(key);
    }

    onChange(next);
  }

  const todas = visibles.size === COLUMNAS.length;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-xl border border-[#131E5C]/15 bg-white shadow-2xl"
    >
      <div className="border-b border-[#131E5C]/10 bg-[#F7F8FC] px-3 py-2.5">
        <p className="text-xs font-bold text-[#131E5C]">Columnas visibles</p>
        <p className="mt-0.5 text-[10px] text-slate-500">
          {visibles.size} de {COLUMNAS.length} activadas
        </p>

        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(columnasPorDefecto())}
            className="flex-1 rounded-lg bg-[#131E5C] px-2 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#0A1340]"
          >
            Mostrar todas
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#131E5C]/20 bg-white px-2 py-1.5 text-[10px] font-bold text-[#131E5C] transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto p-1.5">
        {COLUMNAS.map((col) => {
          const activa = visibles.has(col.key);
          const ultima = activa && visibles.size === 1;

          return (
            <button
              key={col.key}
              type="button"
              onClick={() => toggle(col.key)}
              title={ultima ? "Debe quedar al menos una columna" : col.label}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                  activa
                    ? "border-[#131E5C] bg-[#131E5C] text-white"
                    : "border-slate-300 bg-white"
                )}
              >
                {activa && <Check className="h-3 w-3" />}
              </span>

              {activa ? (
                <Eye className="h-3 w-3 shrink-0 text-[#131E5C]" />
              ) : (
                <EyeOff className="h-3 w-3 shrink-0 text-slate-300" />
              )}

              <span
                className={cn(
                  "truncate text-[11px] font-semibold",
                  activa ? "text-[#131E5C]" : "text-slate-400"
                )}
              >
                {col.label}
              </span>
            </button>
          );
        })}
      </div>

      {!todas && (
        <div className="border-t border-[#131E5C]/10 px-3 py-2 text-[10px] text-slate-500">
          Las columnas ocultas no se incluyen en la exportación.
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TABLA DE ÓRDENES
   ============================================================ */

function TablaOrdenes({
  ordenes,
  loading,
  total,
  page,
  pageSize,
  totalPages,
  onPrev,
  onNext,
  onPageSizeChange,
  colFilters,
  onColFiltersChange,
  onLimpiarFiltrosColumna,
  onOrdenar,
  filaExpandida,
  onAlternarFila,
  onRestablecer,
  hayFiltros,
  ordenActual,
}) {
  const [filtroAbierto, setFiltroAbierto] = useState(null);
  const [columnasVisibles, setColumnasVisibles] = useState(columnasGuardadasIniciales);
  const [showColumnas, setShowColumnas] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_COLUMNAS_GOTA,
        JSON.stringify(Array.from(columnasVisibles))
      );
    } catch {
      /* almacenamiento no disponible: se mantiene solo en memoria */
    }
  }, [columnasVisibles]);

  const columnasTabla = useMemo(
    () => COLUMNAS.filter((col) => columnasVisibles.has(col.key)),
    [columnasVisibles]
  );

  const totalColumnas = columnasTabla.length + 1;

  function abrirFiltro(key, event) {
    if (filtroAbierto && filtroAbierto.key === key) {
      setFiltroAbierto(null);
      return;
    }

    setFiltroAbierto({ key, anchor: event.currentTarget.getBoundingClientRect() });
  }

  function valoresUnicos(key) {
    const valores = new Set();
    const col = columnaPorClave(key);

    ordenes.forEach((fila) => {
      const value = formatCell(fila, col);
      if (value !== "—") valores.add(value);
    });

    return Array.from(valores).sort((a, b) =>
      a.localeCompare(b, "es", { numeric: true })
    );
  }

  function seleccionados(key) {
    return new Set(Array.isArray(colFilters[key]) ? colFilters[key] : []);
  }

  function toggleValor(key, value) {
    onColFiltersChange((prev) => {
      const current = new Set(Array.isArray(prev[key]) ? prev[key] : []);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [key]: Array.from(current) };
    });
  }

  function limpiarColumna(key) {
    onColFiltersChange((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function iconOrden(key) {
    if (ordenActual !== key) return <ArrowUpDown className="h-3 w-3 text-white/45" />;
    return ordenActual.startsWith("-") ? (
      <ArrowDown className="h-3 w-3 text-white" />
    ) : (
      <ArrowUp className="h-3 w-3 text-white" />
    );
  }

  const hayFiltrosColumna = Object.values(colFilters).some(
    (values) => Array.isArray(values) && values.length > 0
  );

  const primero = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const ultimo = Math.min(page * pageSize, total);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
      {/* Cabecera de la tarjeta */}
      <div className="flex flex-col gap-3 border-b border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#131E5C]/10 bg-white text-[#131E5C]">
            <Sheet className="h-4 w-4" />
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-[#001E50]">
              Detalle de órdenes
            </h3>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-500">
              <span className="font-bold text-[#131E5C]">
                Mostrando {entero(primero)}–{entero(ultimo)}
              </span>{" "}
              de {entero(total)} órdenes · haz clic en una fila para ver la ficha
            </p>
          </div>
        </div>

<div className="flex shrink-0 items-center gap-2 self-start">
          {hayFiltrosColumna && (
            <button
              type="button"
              onClick={onLimpiarFiltrosColumna}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[11px] font-bold text-rose-600 transition hover:bg-rose-100"
            >
              <ListFilter className="h-3.5 w-3.5" />
              Limpiar filtros de columna
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnas((prev) => !prev)}
              aria-expanded={showColumnas}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold transition",
                showColumnas
                  ? "border-[#131E5C] bg-[#131E5C] text-white"
                  : "border-[#131E5C]/20 bg-white text-[#131E5C] hover:bg-slate-50"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Columnas ({columnasTabla.length}/{COLUMNAS.length})
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  showColumnas && "rotate-180"
                )}
              />
            </button>

            {showColumnas && (
              <ColumnChooser
                visibles={columnasVisibles}
                onChange={setColumnasVisibles}
                onClose={() => setShowColumnas(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="max-h-[70vh] min-h-[420px] overflow-auto">
        <table className="min-w-max border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="bg-[#131E5C]">
              {columnasTabla.map((col) => {
                const activo = seleccionados(col.key).size > 0;

                return (
                  <th
                    key={col.key}
                    className="whitespace-nowrap border-b border-white/10 bg-[#131E5C] px-3 py-2 text-left"
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onOrdenar(
                            ordenActual === `-${col.key}` ? col.key : `-${col.key}`
                          )
                        }
                        disabled={col.key === "dias_taller"}
                        className="flex items-center gap-1 rounded px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {iconOrden(col.key)}
                        <span>{col.label}</span>
                      </button>

                      {col.filtro && (
                        <button
                          type="button"
                          onClick={(event) => abrirFiltro(col.key, event)}
                          title={`Filtrar por ${col.label}`}
                          className={cn(
                            "inline-flex h-5 w-5 items-center justify-center rounded transition",
                            activo
                              ? "bg-amber-300 text-[#131E5C]"
                              : "text-white/45 hover:bg-white/15 hover:text-white"
                          )}
                        >
                          <Filter className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}

              <th className="w-10 bg-[#131E5C] px-2 py-2">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <tr key={`esqueleto-${index}`}>
                  {columnasTabla.map((col) => (
                    <td
                      key={col.key}
                      className="border-b border-slate-100 px-3 py-2.5"
                    >
                      <div className="h-3.5 w-20 animate-pulse rounded bg-slate-200" />
                    </td>
                  ))}
                  <td className="border-b border-slate-100 px-2 py-2.5" />
                </tr>
              ))
            ) : ordenes.length === 0 ? (
              <tr>
                <td colSpan={totalColumnas} className="px-6 py-16 text-center">
                  <SearchX className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-bold text-slate-700">
                    No se encontraron órdenes
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Modifica los filtros o restablece la búsqueda para consultar
                    otros registros.
                  </p>

                  {hayFiltros && (
                    <button
                      type="button"
                      onClick={onRestablecer}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#131E5C] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0A1340]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restablecer filtros
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              ordenes.map((fila, indice) => {
                const clave = claveFila(fila);
                const expandida = filaExpandida === clave;

                return (
                  <Fragment key={clave}>
                    <tr
                      onClick={() => onAlternarFila(clave)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onAlternarFila(clave);
                        }
                      }}
                      tabIndex={0}
                      aria-expanded={expandida}
                      title={expandida ? "Ocultar detalle" : "Ver detalle de la orden"}
                      className={cn(
                        "group cursor-pointer border-b border-slate-100 transition-colors hover:bg-[#EAF1FF] focus:bg-[#EAF1FF] focus:outline-none",
                        indice % 2 === 1 && "bg-[#FAFBFF]",
                        expandida && "bg-[#EAF1FF]"
                      )}
                    >
                      {columnasTabla.map((col) => {
                        const negativo =
                          ["moneda", "numero"].includes(col.tipo) &&
                          numero(fila[col.key]) < 0;

                        return (
                          <td
                            key={col.key}
                            title={formatCell(fila, col)}
                            className={cn(
                              "whitespace-nowrap px-3 py-2.5 text-xs",
                              col.alineacion === "dias" ? "text-center" : "text-left",
                              negativo
                                ? "font-semibold text-rose-600"
                                : col.alineacion === "fuerte"
                                  ? "font-bold text-[#131E5C]"
                                  : "text-slate-700"
                            )}
                          >
                            <CeldaOrden fila={fila} col={col} />
                          </td>
                        );
                      })}

                      <td className="px-2 py-2.5 text-right">
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#131E5C]/15 bg-white text-[#131E5C] transition",
                            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                            expandida &&
                              "rotate-90 border-[#131E5C] bg-[#131E5C] text-white opacity-100"
                          )}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </td>
                    </tr>

                    {expandida && (
                      <tr>
                        <td colSpan={totalColumnas} className="p-0">
                          <DetalleOrden
                            orden={fila}
                            onClose={() => onAlternarFila(clave)}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col gap-3 border-t border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Mostrar</span>

          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none transition focus:border-[#131E5C]"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
          </select>

          <span className="text-slate-500">
            de{" "}
            <span className="font-bold text-slate-700">{entero(total)}</span>{" "}
            órdenes
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={onPrev}
            aria-label="Página anterior"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-[#131E5C] hover:text-[#131E5C] disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-[120px] text-center text-xs font-semibold text-slate-600">
            Página {entero(page)} de {entero(totalPages)}
          </span>

          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={onNext}
            aria-label="Página siguiente"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-[#131E5C] hover:text-[#131E5C] disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filtroAbierto && (
        <ColumnFilterMenu
          key={filtroAbierto.key}
          label={columnaPorClave(filtroAbierto.key)?.label || filtroAbierto.key}
          values={valoresUnicos(filtroAbierto.key)}
          selected={seleccionados(filtroAbierto.key)}
          onToggle={(value) => toggleValor(filtroAbierto.key, value)}
          onClear={() => limpiarColumna(filtroAbierto.key)}
          onClose={() => setFiltroAbierto(null)}
          anchor={filtroAbierto.anchor}
        />
      )}
    </div>
  );
}

/* ============================================================
   FILTROS RÁPIDOS (ESTILO PÍLDORAS)
   Las píldoras escriben los mismos parámetros del backend
   (agencia, tp_os, fecha_desde, fecha_hasta): solo cambia el
   control visual, no el contrato de la API.
   ============================================================ */

const MESES_PERIODO = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function dosDigitos(valor) {
  return String(valor).padStart(2, "0");
}

function rangoMesISO(anio, mesIndice) {
  const mes = dosDigitos(mesIndice + 1);
  const ultimoDia = new Date(anio, mesIndice + 1, 0).getDate();

  return {
    fecha_desde: `${anio}-${mes}-01`,
    fecha_hasta: `${anio}-${mes}-${dosDigitos(ultimoDia)}`,
  };
}

function rangoAnioISO(anio) {
  return { fecha_desde: `${anio}-01-01`, fecha_hasta: `${anio}-12-31` };
}

/* Año inicial del selector de periodo: el actual si hay datos que
   lo cubran; si no, el año más reciente disponible. */
function anioPeriodoPorDefecto(anios) {
  const actual = new Date().getFullYear();
  if (anios.includes(actual)) return actual;
  return anios[0] ?? actual;
}

/* ============================================================
   PANEL DE FILTROS
   ============================================================ */

const CAMPOS_FILTRO = [
  {
    campo: "subtipo_os",
    etiqueta: "Subtipo",
    tipo: "select",
    vacio: "Todos",
    opciones: "subtipoos",
  },
  {
    campo: "uso_cfdi",
    etiqueta: "Uso CFDI",
    tipo: "select",
    vacio: "Todos",
    opciones: "uso_cfdi",
  },
  {
    campo: "forma_pago",
    etiqueta: "Forma de pago",
    tipo: "select",
    vacio: "Todas",
    opciones: "formapago",
  },
];

/* Barra de filtros rápidos con el estilo de píldoras de los
   tableros de Gestión de Negocio, conectada a los filtros de GOTA. */
function BarraFiltrosRapidos({
  agencias,
  tipos,
  anios,
  anio,
  mesActivo,
  anioCompleto,
  agenciaActiva,
  tipoActivo,
  cargando,
  onAgencia,
  onTipo,
  onMes,
  onAnioCompleto,
  onAnio,
}) {
  const hoy = new Date();
  const esAnioActual = anio === hoy.getFullYear();

  const clasesPildoraAgencia = (activa) =>
    cn(
      "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-150",
      activa
        ? "bg-[#131E5C] text-white ring-2 ring-[#131E5C]"
        : "border border-slate-200 bg-white text-[#001E50] hover:bg-slate-50"
    );

  const clasesPildoraTipo = (activa) =>
    cn(
      "inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-all duration-150",
      activa
        ? "bg-[#1677FF] text-white shadow-sm"
        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
    );

  return (
    <div className="space-y-3">
      {/* Agencias */}
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="Filtrar por agencia"
      >
        {cargando && agencias.length === 0 ? (
          [0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-8 w-28 animate-pulse rounded-full bg-slate-100"
            />
          ))
        ) : (
          <>
            <button
              type="button"
              onClick={() => onAgencia("")}
              aria-pressed={!agenciaActiva}
              className={clasesPildoraAgencia(!agenciaActiva)}
            >
              <span>Todas las agencias</span>
            </button>

            {agencias.map((agencia) => {
              const activa = agenciaActiva === agencia;

              return (
                <button
                  key={agencia}
                  type="button"
                  onClick={() => onAgencia(agencia)}
                  aria-pressed={activa}
                  title={activa ? "Quitar filtro de agencia" : `Filtrar por ${agencia}`}
                  className={clasesPildoraAgencia(activa)}
                >
                  <span>{agencia}</span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Tipo de orden de servicio */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-slate-50 p-2 md:flex-row md:items-center">
        <span className="flex shrink-0 items-center gap-1.5 px-2 text-xs font-bold text-[#001E50]">
          <Tag className="h-3.5 w-3.5 text-[#1677FF]" />
          Tipo OS:
        </span>

        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filtrar por tipo de orden de servicio"
        >
          <button
            type="button"
            onClick={() => onTipo("")}
            aria-pressed={!tipoActivo}
            className={clasesPildoraTipo(!tipoActivo)}
          >
            {!tipoActivo && <Check className="h-3 w-3 text-white" />}
            <span>Todos</span>
          </button>

          {tipos.map((tipo) => {
            const activo = tipoActivo === tipo;

            return (
              <button
                key={tipo}
                type="button"
                onClick={() => onTipo(tipo)}
                aria-pressed={activo}
                className={clasesPildoraTipo(activo)}
              >
                {activo && <Check className="h-3 w-3 text-white" />}
                <span>{tipo}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Periodo de apertura: año + meses */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-2.5 md:flex-row md:items-center">
        <div className="relative inline-block shrink-0">
          <select
            value={anio}
            onChange={(event) => onAnio(Number(event.target.value))}
            aria-label="Año del periodo de apertura"
            className="appearance-none cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 pr-7 text-xs font-bold text-[#001E50] focus:outline-none"
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        <div
          className="flex w-full gap-1.5 overflow-x-auto pb-1 md:pb-0"
          role="group"
          aria-label="Filtrar por mes de apertura"
        >
          <button
            type="button"
            onClick={onAnioCompleto}
            aria-pressed={anioCompleto}
            className={cn(
              "inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
              anioCompleto
                ? "bg-[#131E5C] text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {anioCompleto ? (
              <Check className="h-3 w-3 text-white" />
            ) : (
              <Plus className="h-3 w-3 text-slate-400" />
            )}
            <span>Todo el año</span>
          </button>

          {MESES_PERIODO.map((mes, index) => {
            const futuro = esAnioActual && index > hoy.getMonth();
            const activo = mesActivo === index;

            return (
              <button
                key={mes}
                type="button"
                disabled={futuro}
                onClick={() => onMes(index)}
                aria-pressed={activo}
                title={futuro ? "Mes futuro sin datos" : `Filtrar por ${mes.toLowerCase()} de ${anio}`}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all",
                  activo
                    ? "cursor-pointer bg-[#131E5C] text-white"
                    : futuro
                      ? "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-300"
                      : "cursor-pointer border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                {activo ? (
                  <Check className="h-3 w-3 text-white" />
                ) : (
                  <Plus className="h-3 w-3 text-slate-400" />
                )}
                <span>{mes.toLowerCase()}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PÁGINA PRINCIPAL
   ============================================================ */

const FILTROS_VACIOS = {
  q: "",
  agencia: "",
  tp_os: "",
  situacao: "",
  subtipo_os: "",
  uso_cfdi: "",
  forma_pago: "",
  fecha_desde: "",
  fecha_hasta: "",
};

const ETIQUETAS_FILTRO = {
  q: "Búsqueda",
  agencia: "Agencia",
  tp_os: "Tipo OS",
  situacao: "Situación",
  subtipo_os: "Subtipo",
  uso_cfdi: "Uso CFDI",
  forma_pago: "Forma de pago",
  fecha_desde: "Desde apertura",
  fecha_hasta: "Hasta apertura",
};

export default function Gota() {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_VACIOS);
  const [opciones, setOpciones] = useState({});
  const [colFilters, setColFilters] = useState({});
  const [filtrosVisibles, setFiltrosVisibles] = useState(true);
  const [rapidosVisibles, setRapidosVisibles] = useState(true);
  // Año mostrado por el selector de periodo (null = automático).
  const [anioPeriodo, setAnioPeriodo] = useState(null);
  // Rango de permanencia tocado en el resumen (null = sin detalle).
  const [rangoAntiguedad, setRangoAntiguedad] = useState(null);
  const refTabla = useRef(null);

  const [ordenes, setOrdenes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const [dashboard, setDashboard] = useState(null);

  // Clave del último request resuelto: permite derivar el estado de
  // carga sin llamar setState dentro del cuerpo del efecto.
  const [claveResuelta, setClaveResuelta] = useState("");
  const [claveDashboardResuelta, setClaveDashboardResuelta] = useState("");

  const [ordenActual, setOrdenActual] = useState("-rowid");
  // Detalle desplegado: { clave, pagina } para que al cambiar de
  // página el detalle de la fila anterior deje de mostrarse.
  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const [error, setError] = useState("");
  const [actualizando, setActualizando] = useState(false);

  const { avisos, push } = useAvisos();

  // Los filtros de columna del encabezado se traducen a parámetros del backend.
  const colFiltersQuery = useMemo(() => {
    const query = {};

    Object.entries(colFilters).forEach(([key, values]) => {
      if (Array.isArray(values) && values.length === 1) {
        query[key] = values[0];
      }
    });

    return query;
  }, [colFilters]);

  const paramsConsulta = useMemo(
    () => ({ ...filtrosAplicados, ...colFiltersQuery }),
    [filtrosAplicados, colFiltersQuery]
  );

  /* ---------------- OPCIONES DE FILTRO ---------------- */

  useEffect(() => {
    let vigente = true;

    getGotaOpciones()
      .then((data) => {
        if (vigente) setOpciones(data || {});
      })
      .catch(() => {
        if (vigente) setOpciones({});
      });

    return () => {
      vigente = false;
    };
  }, []);

  /* ---------------- LISTADO DE ÓRDENES ---------------- */

  const claveListado = JSON.stringify([
    paramsConsulta,
    page,
    pageSize,
    ordenActual,
  ]);

  const loading = claveResuelta !== claveListado;

  useEffect(() => {
    let vigente = true;

    getGotaOrdenes({
      ...paramsConsulta,
      page,
      page_size: pageSize,
      ordering: ordenActual,
    })
      .then((data) => {
        if (!vigente) return;
        setOrdenes(data?.results || []);
        setTotal(Number(data?.count || 0));
        setError("");
        setClaveResuelta(claveListado);
      })
      .catch((err) => {
        if (!vigente) return;
        setOrdenes([]);
        setTotal(0);
        setError(
          err?.message || "No fue posible consultar las órdenes de taller."
        );
        setClaveResuelta(claveListado);
      });

    return () => {
      vigente = false;
    };
    // claveListado cubre paramsConsulta, page, pageSize y ordenActual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveListado]);

  /* ---------------- DASHBOARD ---------------- */

  const claveDashboard = JSON.stringify(paramsConsulta);

  const loadingDashboard = claveDashboardResuelta !== claveDashboard;

  useEffect(() => {
    let vigente = true;

    getGotaDashboard(paramsConsulta)
      .then((data) => {
        if (!vigente) return;
        setDashboard(data);
        setClaveDashboardResuelta(claveDashboard);
      })
      .catch(() => {
        if (!vigente) return;
        setDashboard(null);
        setClaveDashboardResuelta(claveDashboard);
      });

    return () => {
      vigente = false;
    };
    // claveDashboard cubre paramsConsulta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveDashboard]);

  /* ---------------- RESUMEN GLOBAL (SIN FILTROS) ---------------- */

  // El Resumen ejecutivo · Postventa muestra el estado global del taller:
  // se consulta una sola vez sin parámetros para que los filtros
  // (rápidos, de formulario y de columna) no lo alteren.
  const [dashboardGlobal, setDashboardGlobal] = useState(null);
  const [dashboardGlobalListo, setDashboardGlobalListo] = useState(false);

  useEffect(() => {
    let vigente = true;

    getGotaDashboard()
      .then((data) => {
        if (!vigente) return;
        setDashboardGlobal(data);
        setDashboardGlobalListo(true);
      })
      .catch(() => {
        if (!vigente) return;
        setDashboardGlobal(null);
        setDashboardGlobalListo(true);
      });

    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    if (error) push(error, "error");
  }, [error, push]);

  /* ---------------- FILTROS RÁPIDOS ---------------- */

  // Años con datos de apertura; siempre incluyen el año en curso.
  const rangoFechas = opciones.fechas || {};

  const aniosPeriodo = useMemo(() => {
    const años = new Set([new Date().getFullYear()]);

    [rangoFechas.minima, rangoFechas.maxima].forEach((fecha) => {
      const anio = Number(String(fecha || "").slice(0, 4));
      if (Number.isFinite(anio) && anio > 0) años.add(anio);
    });

    return [...años].sort((a, b) => b - a);
  }, [rangoFechas.minima, rangoFechas.maxima]);

  const anioEfectivo =
    anioPeriodo !== null && aniosPeriodo.includes(anioPeriodo)
      ? anioPeriodo
      : anioPeriodoPorDefecto(aniosPeriodo);

  // El mes/año iluminado se deriva del rango del borrador: solo se
  // activa cuando coincide exactamente con un periodo completo.
  const mesPeriodoActivo = useMemo(() => {
    const { fecha_desde, fecha_hasta } = filtros;
    if (!fecha_desde || !fecha_hasta) return null;

    const indice = MESES_PERIODO.findIndex((_, i) => {
      const rango = rangoMesISO(anioEfectivo, i);
      return (
        rango.fecha_desde === fecha_desde &&
        rango.fecha_hasta === fecha_hasta
      );
    });

    return indice < 0 ? null : indice;
  }, [filtros, anioEfectivo]);

  const anioCompletoActivo = useMemo(() => {
    const rango = rangoAnioISO(anioEfectivo);
    return (
      filtros.fecha_desde === rango.fecha_desde &&
      filtros.fecha_hasta === rango.fecha_hasta
    );
  }, [filtros, anioEfectivo]);

  // Las píldoras aplican de inmediato (como los chips de filtros
  // activos): escriben el borrador y la consulta al mismo tiempo.
  function aplicarSeleccionRapida(parche) {
    const siguiente = { ...filtros, ...parche };
    setFiltros(siguiente);
    setFiltrosAplicados(siguiente);
    setPage(1);
  }

  function seleccionarAgenciaRapida(valor) {
    aplicarSeleccionRapida({
      agencia: filtros.agencia === valor ? "" : valor,
    });
  }

  function seleccionarTipoRapido(valor) {
    if (filtros.tp_os === valor) return;
    aplicarSeleccionRapida({ tp_os: valor });
  }

  function seleccionarMesRapido(indice) {
    if (mesPeriodoActivo === indice) {
      aplicarSeleccionRapida({ fecha_desde: "", fecha_hasta: "" });
      return;
    }
    aplicarSeleccionRapida(rangoMesISO(anioEfectivo, indice));
  }

  function seleccionarAnioCompleto() {
    if (anioCompletoActivo) {
      aplicarSeleccionRapida({ fecha_desde: "", fecha_hasta: "" });
      return;
    }
    aplicarSeleccionRapida(rangoAnioISO(anioEfectivo));
  }

  function cambiarAnioPeriodo(nuevoAnio) {
    setAnioPeriodo(nuevoAnio);
    if (mesPeriodoActivo !== null) {
      aplicarSeleccionRapida(rangoMesISO(nuevoAnio, mesPeriodoActivo));
    } else if (anioCompletoActivo) {
      aplicarSeleccionRapida(rangoAnioISO(nuevoAnio));
    }
  }

  // Lleva el rango tocado a la tabla principal: aplica sus fechas
  // como filtro de apertura y desplaza la vista hasta la tabla.
  function verRangoEnTabla(nombre) {
    const fechas = rangoFechasAntiguedad(nombre);
    if (!fechas) return;

    const siguiente = { ...filtros, ...fechas };
    setFiltros(siguiente);
    setFiltrosAplicados(siguiente);
    setPage(1);
    setRangoAntiguedad(null);
    push(`Rango ${nombre} aplicado a la tabla.`);

    requestAnimationFrame(() => {
      refTabla.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ---------------- HANDLERS ---------------- */

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function aplicarFiltros() {
    setFiltrosAplicados(filtros);
    setPage(1);
    push("Filtros aplicados a la consulta.");
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_VACIOS);
    setFiltrosAplicados(FILTROS_VACIOS);
    setColFilters({});
    setAnioPeriodo(null);
    setRangoAntiguedad(null);
    setPage(1);
    push("Filtros restablecidos.");
  }

  function limpiarFiltrosColumna() {
    setColFilters({});
    setPage(1);
    push("Filtros de columna restablecidos.");
  }

  function quitarFiltroCampo(campo) {
    const siguiente = { ...filtros, [campo]: "" };
    setFiltros(siguiente);
    setFiltrosAplicados(siguiente);
    setPage(1);
  }

  function quitarFiltroColumna(key) {
    setColFilters((prev) => {
      const siguiente = { ...prev };
      delete siguiente[key];
      return siguiente;
    });
    setPage(1);
  }

  function cambiarOrden(columna) {
    setOrdenActual(columna);
    setPage(1);
  }

  function refrescar() {
    setActualizando(true);

    getGotaOrdenes({
      ...paramsConsulta,
      page,
      page_size: pageSize,
      ordering: ordenActual,
    })
      .then((data) => {
        setOrdenes(data?.results || []);
        setTotal(Number(data?.count || 0));
        push("Datos actualizados.", "success");
      })
      .catch(() => {})
      .finally(() => setActualizando(false));
  }

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

  const hayFiltros =
    Object.values(filtros).some(Boolean) ||
    Object.values(colFilters).some(
      (values) => Array.isArray(values) && values.length > 0
    );

  const filtrosActivos = useMemo(
    () => Object.entries(filtros).filter(([, value]) => Boolean(value)),
    [filtros]
  );

  const filtrosColumnaActivos = useMemo(
    () =>
      Object.entries(colFilters)
        .filter(([, values]) => Array.isArray(values) && values.length > 0)
        .map(([key, values]) => ({ key, values })),
    [colFilters]
  );

  const totalFiltrosActivos =
    filtrosActivos.length + filtrosColumnaActivos.reduce((acc, item) => acc + item.values.length, 0);

  /* ---------------- DATOS PARA GRÁFICAS ---------------- */

  const totales = dashboard?.totales || {};
  const graficas = dashboard?.graficas || {};

  const porTipo = useMemo(
    () =>
      (graficas.por_tipo || []).map((item) => ({
        name: `Tipo ${item.tp_os}`,
        value: numero(item.ordenes),
      })),
    [graficas.por_tipo]
  );

  const porAgencia = useMemo(
    () =>
      (graficas.por_agencia || []).map((item) => ({
        name: item.agencia,
        ordenes: numero(item.ordenes),
        monto: numero(item.monto_total),
      })),
    [graficas.por_agencia]
  );

  // El backend agrupa por (rango, orden_dias): puede traer varias
  // filas por rango y hay que sumarlas, no pisarlas con un Map.
  const porAntiguedad = useMemo(() => {
    const sumas = new Map();

    (graficas.por_antiguedad || []).forEach((item) => {
      sumas.set(item.rango, (sumas.get(item.rango) || 0) + numero(item.ordenes));
    });

    return ORDEN_RANGOS_ANTIGUEDAD.map((rango) => ({
      name: rango,
      value: sumas.get(rango) || 0,
      color: colorAntiguedad(rango),
    })).filter((item) => item.value > 0);
  }, [graficas.por_antiguedad]);

  const porDia = useMemo(
    () =>
      (graficas.por_dia || [])
        .slice()
        .reverse()
        .map((item) => ({
          name: formatearFechaISO(item.dia).slice(0, 5),
          value: numero(item.ordenes),
        })),
    [graficas.por_dia]
  );

  const porSubtipo = useMemo(
    () =>
      (graficas.por_subtipo || []).map((item) => ({
        name: `Subtipo ${item.subtipo_os}`,
        value: numero(item.ordenes),
      })),
    [graficas.por_subtipo]
  );

  /* Datos globales (sin filtros) solo para el Resumen ejecutivo. */
  const totalesResumen = dashboardGlobal?.totales || {};
  const graficasResumen = dashboardGlobal?.graficas || {};

  const porAgenciaResumen = useMemo(
    () =>
      (graficasResumen.por_agencia || []).map((item) => ({
        name: item.agencia,
        ordenes: numero(item.ordenes),
        monto: numero(item.monto_total),
      })),
    [graficasResumen.por_agencia]
  );

  const porAntiguedadResumen = useMemo(() => {
    const mapa = new Map(
      (graficasResumen.por_antiguedad || []).map((item) => [
        item.rango,
        numero(item.ordenes),
      ])
    );

    return ORDEN_RANGOS_ANTIGUEDAD.map((rango) => ({
      name: rango,
      value: mapa.get(rango) || 0,
      color: colorAntiguedad(rango),
    })).filter((item) => item.value > 0);
  }, [graficasResumen.por_antiguedad]);

  /* ---------------- RENDER ---------------- */

  return (
    <main className="min-h-screen bg-[#F7F8FC] pb-10">
      {/* Encabezado */}
      <div className="border-b border-[#E4E7F0] bg-white px-4 py-5 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#131E5C] text-white">
                <Wrench className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black tracking-tight text-[#001E50] md:text-2xl">
                  GOTA · Gestor de Órdenes de Taller
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 md:text-sm">
                  Matriz de órdenes de servicio activas en taller
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#131E5C]/15 bg-[#131E5C]/5 px-3 py-1.5 text-xs font-bold text-[#131E5C]">
              <Wrench className="h-3.5 w-3.5" />
              {entero(total)} órdenes
            </span>

            <button
              type="button"
              onClick={refrescar}
              disabled={actualizando}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-[#131E5C] transition hover:border-[#131E5C] hover:bg-[#131E5C]/5 disabled:opacity-60"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", actualizando && "animate-spin")}
              />
              {actualizando ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </div>
<div className="space-y-5 px-4 py-5 md:px-6 lg:px-8">

        {/* FILTROS RÁPIDOS */}
        <section className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3">
            <button
              type="button"
              onClick={() => setRapidosVisibles((prev) => !prev)}
              className="flex items-center gap-2.5 text-left"
              aria-expanded={rapidosVisibles}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#131E5C]/10 bg-white text-[#131E5C]">
                <Filter className="h-4 w-4" />
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#001E50]">
                    Filtros rápidos
                  </span>
                  {(filtros.agencia ||
                    filtros.tp_os ||
                    filtros.fecha_desde ||
                    filtros.fecha_hasta) && (
                    <span className="rounded-full bg-[#131E5C] px-2 py-0.5 text-[10px] font-bold text-white">
                      {entero(
                        [
                          filtros.agencia,
                          filtros.tp_os,
                          filtros.fecha_desde || filtros.fecha_hasta,
                        ].filter(Boolean).length
                      )}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[11px] leading-tight text-slate-500">
                  Agencia, tipo de orden y periodo de apertura
                </span>
              </span>
            </button>

            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] text-slate-400 sm:inline">
                {rapidosVisibles ? "Ocultar" : "Mostrar"} filtros
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    rapidosVisibles && "rotate-180"
                  )}
                />
              </span>
            </div>
          </div>

          {rapidosVisibles && (
            <div className="p-4">
              <BarraFiltrosRapidos
                agencias={opciones.agencia || []}
                tipos={opciones.tpos || []}
                anios={aniosPeriodo}
                anio={anioEfectivo}
                mesActivo={mesPeriodoActivo}
                anioCompleto={anioCompletoActivo}
                agenciaActiva={filtros.agencia}
                tipoActivo={filtros.tp_os}
                cargando={!opciones.agencia}
                onAgencia={seleccionarAgenciaRapida}
                onTipo={seleccionarTipoRapido}
                onMes={seleccionarMesRapido}
                onAnioCompleto={seleccionarAnioCompleto}
                onAnio={cambiarAnioPeriodo}
              />
            </div>
          )}
        </section>

        {/* RESUMEN EJECUTIVO */}
        <ResumenEjecutivo
          cargando={!dashboardGlobalListo}
          totales={totalesResumen}
          antiguedad={porAntiguedadResumen}
          agencias={porAgenciaResumen}
          rangoActivo={rangoAntiguedad}
          onSeleccionarRango={(nombre) =>
            setRangoAntiguedad((prev) => (prev === nombre ? null : nombre))
          }
        />

        {rangoAntiguedad && (
          <DetalleRangoAntiguedad
            key={rangoAntiguedad}
            rango={rangoAntiguedad}
            filtrosBase={FILTROS_VACIOS}
            onClose={() => setRangoAntiguedad(null)}
            onVerEnTabla={() => verRangoEnTabla(rangoAntiguedad)}
          />
        )}

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Órdenes en taller"
            value={entero(totales.ordenes)}
            subtitle={`${entero(totales.agencias)} agencia(s) · ${entero(totales.ordenes_unicas)} OS únicas`}
            icon={Wrench}
            tono="navy"
            cargando={loadingDashboard}
          />
          <KpiCard
            title="Días promedio"
            value={numero(totales.dias_promedio).toFixed(1)}
            subtitle={`Permanencia máxima ${entero(totales.dias_maximo)} días`}
            icon={Clock}
            tono="sky"
            cargando={loadingDashboard}
          />
          <KpiCard
            title="Monto total"
            value={dinero(totales.monto_total)}
            subtitle={`Partes ${dineroCompacto(totales.monto_pecas)} · MO ${dineroCompacto(totales.monto_mano_obra)}`}
            icon={DollarSign}
            tono="emerald"
            cargando={loadingDashboard}
          />
          <KpiCard
            title="Descuento en partes"
            value={dinero(totales.descuento_pecas)}
            subtitle={`Adicionales ${dineroCompacto(totales.monto_adicionales)}`}
            icon={TrendingUp}
            tono="amber"
            cargando={loadingDashboard}
          />
        </section>

        {/* Gráficas */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <VWPieCard
            title="Órdenes por tipo"
            subtitle="Distribución de la mezcla de trabajo"
            icon={Tag}
            data={porTipo}
            label={`${entero(totales.ordenes)} órdenes en el corte actual`}
          />

          <VWBarCard
            title="Órdenes por agencia"
            subtitle="Volumen de órdenes abiertas por agencia"
            icon={MapPin}
            data={porAgencia}
            yKey="ordenes"
            barColor={C.accent}
            gradientId="gota-grad-agencia"
          />

          <VWPieCard
            title="Permanencia en taller"
            subtitle="Días transcurridos desde la apertura"
            icon={Clock}
            data={porAntiguedad}
            label="Verde: salida rápida · Rojo: requiere atención"
          />

          <VWBarCard
            title="Monto por agencia"
            subtitle="Importe acumulado de órdenes abiertas por agencia"
            icon={DollarSign}
            data={porAgencia}
            yKey="monto"
            formatoEjeY={dineroCompacto}
            barColor="#10B981"
            gradientId="gota-grad-monto"
          />

          <VWBarCard
            title="Órdenes por subtipo"
            subtitle="Top 15 subtipos con más órdenes abiertas"
            icon={CalendarDays}
            data={porSubtipo}
            yKey="value"
            barColor="#14B8A6"
            gradientId="gota-grad-subtipo"
          />

          <VWAreaCard
            title="Aperturas por día"
            subtitle="Órdenes ingresadas al taller en los últimos cierres"
            icon={CalendarCheck}
            data={porDia}
          />
        </section>

        {/* FILTROS */}
        <section className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3">
            <button
              type="button"
              onClick={() => setFiltrosVisibles((prev) => !prev)}
              className="flex items-center gap-2.5 text-left"
              aria-expanded={filtrosVisibles}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#131E5C]/10 bg-white text-[#131E5C]">
                <Filter className="h-4 w-4" />
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#001E50]">Filtros</span>
                  {totalFiltrosActivos > 0 && (
                    <span className="rounded-full bg-[#131E5C] px-2 py-0.5 text-[10px] font-bold text-white">
                      {entero(totalFiltrosActivos)}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[11px] leading-tight text-slate-500">
                  Acota las órdenes por búsqueda, subtipo y facturación
                </span>
              </span>
            </button>

            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] text-slate-400 sm:inline">
                {filtrosVisibles ? "Ocultar" : "Mostrar"} filtros
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    filtrosVisibles && "rotate-180"
                  )}
                />
              </span>
            </div>
          </div>

          {filtrosVisibles && (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                  <EtiquetaCampo htmlFor="gota-busqueda">Búsqueda</EtiquetaCampo>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="gota-busqueda"
                      type="text"
                      value={filtros.q}
                      onChange={(event) => actualizarFiltro("q", event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") aplicarFiltros();
                      }}
                      placeholder="OS, atención, agencia o job"
                      className={cn(CLASES_CONTROL, "pl-8")}
                    />
                  </div>
                </div>

                {CAMPOS_FILTRO.map((campo) => (
                  <div key={campo.campo} className="flex flex-col gap-1.5">
                    <EtiquetaCampo htmlFor={`gota-${campo.campo}`}>
                      {campo.etiqueta}
                    </EtiquetaCampo>

                    {campo.tipo === "select" ? (
                      <select
                        id={`gota-${campo.campo}`}
                        value={filtros[campo.campo]}
                        onChange={(event) =>
                          actualizarFiltro(campo.campo, event.target.value)
                        }
                        className={cn(CLASES_CONTROL, "cursor-pointer")}
                      >
                        <option value="">{campo.vacio}</option>
                        {(opciones[campo.opciones] || []).map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`gota-${campo.campo}`}
                        type="date"
                        value={filtros[campo.campo]}
                        min={opciones.fechas?.minima || undefined}
                        max={opciones.fechas?.maxima || undefined}
                        onChange={(event) =>
                          actualizarFiltro(campo.campo, event.target.value)
                        }
                        className={CLASES_CONTROL}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Acciones */}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={aplicarFiltros}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#131E5C] px-4 text-[11px] font-bold text-white transition hover:bg-[#0A1340] active:scale-[0.98]"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Aplicar filtros
                  </button>

                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    disabled={!hayFiltros}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Limpiar
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  <span className="font-bold text-[#131E5C]">{entero(total)}</span>{" "}
                  órdenes con los criterios seleccionados
                </p>
              </div>

              {/* Filtros activos */}
              {totalFiltrosActivos > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    <ListFilter className="h-3 w-3" />
                    Filtros activos
                  </span>

                  {filtrosActivos.map(([campo, valor]) => (
                    <button
                      key={campo}
                      type="button"
                      onClick={() => quitarFiltroCampo(campo)}
                      title="Quitar filtro"
                      className="group inline-flex items-center gap-1.5 rounded-full border border-[#131E5C]/15 bg-[#131E5C]/5 py-1 pl-2.5 pr-1.5 text-[11px] font-bold text-[#131E5C] transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <span className="text-[#131E5C]/50 group-hover:text-rose-500">
                        {ETIQUETAS_FILTRO[campo] || campo}:
                      </span>
                      <span className="max-w-[180px] truncate">{valor}</span>
                      <X className="h-3 w-3 opacity-50 transition group-hover:opacity-100" />
                    </button>
                  ))}

                  {filtrosColumnaActivos.map((item) => (
                    <span
                      key={item.key}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 py-1 pl-2.5 pr-1.5 text-[11px] font-bold text-amber-800"
                    >
                      <span className="text-amber-600/70">
                        {columnaPorClave(item.key)?.label || item.key}:
                      </span>
                      <span className="max-w-[180px] truncate">
                        {item.values.join(", ")}
                      </span>
                      <button
                        type="button"
                        onClick={() => quitarFiltroColumna(item.key)}
                        title="Quitar filtro"
                        className="rounded-full p-0.5 transition hover:bg-amber-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Tabla */}
        <section ref={refTabla} className="scroll-mt-4">
          <TablaOrdenes
            ordenes={ordenes}
            loading={loading}
            total={total}
            page={page}
            pageSize={pageSize}
            totalPages={totalPaginas}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setPage((prev) => Math.min(totalPaginas, prev + 1))}
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
            colFilters={colFilters}
            onColFiltersChange={(valor) => {
              setColFilters(valor);
              setPage(1);
            }}
            onLimpiarFiltrosColumna={limpiarFiltrosColumna}
            filaExpandida={
              detalleAbierto?.pagina === page ? detalleAbierto.clave : null
            }
            onAlternarFila={(clave) =>
              setDetalleAbierto((prev) =>
                prev?.clave === clave && prev?.pagina === page
                  ? null
                  : { clave, pagina: page }
              )
            }
            onRestablecer={limpiarFiltros}
            hayFiltros={hayFiltros}
            onOrdenar={cambiarOrden}
            ordenActual={ordenActual}
          />
        </section>
      </div>

      <PilaAvisos avisos={avisos} />
    </main>
  );
}
