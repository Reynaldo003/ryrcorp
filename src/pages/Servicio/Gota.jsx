// src/pages/Servicio/Gota.jsx
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  ListFilter,
  MapPin,
  RefreshCw,
  Sheet,
  Tag,
  TrendingUp,
  Wrench,
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

function colorDias(dias) {
  if (dias === null) return "bg-slate-100 text-slate-600";
  if (dias <= 1) return "bg-emerald-50 text-emerald-700";
  if (dias <= 3) return "bg-teal-50 text-teal-700";
  if (dias <= 7) return "bg-amber-50 text-amber-700";
  if (dias <= 15) return "bg-orange-50 text-orange-700";
  return "bg-red-50 text-red-700";
}

function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, value }) {
  if (!value) return null;
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
      className="text-[10px] font-bold drop-shadow"
    >
      {Math.round(value)}%
    </text>
  );
}

function ColumnFilterDropdown({
  label,
  values,
  selected,
  onToggle,
  onClear,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    function onDocument(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", onDocument);
    return () => document.removeEventListener("mousedown", onDocument);
  }, [onClose]);

  const filteredValues = useMemo(() => {
    if (!query) return values;
    return values.filter((value) =>
      value.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, values]);

  return (
    <div
      ref={wrapperRef}
      className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-lg border border-[#E4E7F0] bg-white shadow-2xl"
    >
      <div className="border-b border-[#E4E7F0] bg-[#F7F8FC] px-2.5 py-2">
        <p className="truncate text-[11px] font-bold text-[#1A1F3C]">{label}</p>

        <div className="relative mt-1.5">
          <Filter className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full rounded border border-slate-200 bg-white py-1 pl-7 pr-2 text-[11px] text-slate-700 outline-none focus:border-[#131E5C]/40"
          />
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto py-1">
        {filteredValues.length === 0 ? (
          <p className="px-3 py-4 text-center text-[11px] text-slate-400">
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
                className="flex w-full items-center gap-2 px-2.5 py-1 text-left hover:bg-slate-50"
              >
                <span
                  className={cn(
                    "flex h-3.5 w-3.5 items-center justify-center rounded border",
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

      <div className="flex gap-2 border-t border-[#E4E7F0] px-2.5 py-2">
        <button
          type="button"
          onClick={onClear}
          className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg bg-[#131E5C] px-2 py-1.5 text-[10px] font-bold text-white"
        >
          OK
        </button>
      </div>
    </div>
  );
}

function VWPieCard({
  title,
  icon: Icon,
  data = [],
  height = 300,
  showLegend = true,
  label,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-[#131E5C]" />}
          <h3 className="text-sm font-bold text-[#001E50]">{title}</h3>
        </div>
        {label && <span className="text-[11px] text-slate-500">{label}</span>}
      </div>

      <div className="p-4">
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-xs text-slate-400">
            Sin datos para mostrar
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                labelLine={false}
                label={renderLabel}
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PALETA_VW[index % PALETA_VW.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  `${entero(value)} (${porcentajeDecimal(value)}%)`,
                  name,
                ]}
                contentStyle={TOOLTIP_STYLE}
              />
              {showLegend && (
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
              )}
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function VWBarCard({
  title,
  icon: Icon,
  data = [],
  height = 320,
  xKey = "name",
  yKey = "value",
  barColor = "#1677FF",
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-[#131E5C]" />}
          <h3 className="text-sm font-bold text-[#001E50]">{title}</h3>
        </div>
      </div>

      <div className="p-4">
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-xs text-slate-400">
            Sin datos para mostrar
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 16, left: 0, bottom: 10 }}
            >
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 10, fill: "#475569" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#475569" }}
                tickFormatter={(value) => entero(value)}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [entero(value), "Órdenes"]}
                contentStyle={TOOLTIP_STYLE}
              />
              <Bar dataKey={yKey} radius={[6, 6, 0, 0]} fill={barColor} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function VWAreaCard({
  title,
  icon: Icon,
  data = [],
  height = 320,
  xKey = "name",
  yKey = "value",
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E4E7F0] bg-[#F7F8FC] px-4 py-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-[#131E5C]" />}
          <h3 className="text-sm font-bold text-[#001E50]">{title}</h3>
        </div>
      </div>

      <div className="p-4">
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-xs text-slate-400">
            Sin datos para mostrar
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 16, left: 0, bottom: 10 }}
            >
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 10, fill: "#475569" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#475569" }}
                tickFormatter={(value) => entero(value)}
                tickLine={false}
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
                dot={{ fill: "#0EA5E9", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
      <div className="flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {title}
            </p>
            <p className="mt-1 text-2xl font-black text-slate-800">{value}</p>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#131E5C]/10 text-[#131E5C]">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   DEFINICIÓN DE COLUMNAS
   tipo: texto | entero | moneda | fecha | hora | bool
   filtro: la columna alimenta el dropdown de filtro del encabezado
   ============================================================ */

const COLUMNAS = [
  { key: "agencia", label: "Agencia", tipo: "texto", filtro: true },
  { key: "nr_os", label: "OS", tipo: "entero", filtro: true },
  { key: "nr_atendimento", label: "Atención", tipo: "entero", filtro: true },
  { key: "tp_os", label: "Tipo OS", tipo: "texto", filtro: true },
  { key: "subtipo_os", label: "Subtipo", tipo: "texto", filtro: true },
  { key: "situacao", label: "Situación", tipo: "texto", filtro: true },
  { key: "dt_abertura", label: "Apertura", tipo: "fecha", filtro: true },
  { key: "hr_abertura", label: "Hora apertura", tipo: "hora" },
  { key: "dias_taller", label: "Días taller", tipo: "entero" },
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
  { key: "vr_total_pecas", label: "Total partes", tipo: "moneda" },
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

function formatCell(fila, col) {
  const value = fila[col.key];

  if (col.key === "dias_taller") {
    const dias = obtenerDiasTaller(fila.dt_abertura);
    return dias === null ? "—" : String(dias);
  }

  if (value === null || value === undefined || value === "") return "—";
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
   DETALLE DE LA ORDEN
   ============================================================ */

function DetalleOrden({ orden, onClose }) {
  useEffect(() => {
    function onEsc(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#131E5C] px-5 py-4 text-white">
          <div>
            <h2 className="text-lg font-black">
              Orden de servicio {orden.nr_os}
            </h2>
            <p className="text-xs text-white/70">
              {orden.agencia} · Apertura{" "}
              {formatearFechaISO(orden.dt_abertura)}
              {dias !== null ? ` · ${dias} día(s) en taller` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Cerrar
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {secciones.map((seccion) => {
              const Icon = seccion.icono;

              return (
                <div
                  key={seccion.titulo}
                  className="overflow-hidden rounded-xl border border-[#E4E7F0]"
                >
                  <div className="flex items-center gap-2 border-b border-[#E4E7F0] bg-[#F7F8FC] px-3 py-2">
                    <Icon className="h-4 w-4 text-[#131E5C]" />
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#001E50]">
                      {seccion.titulo}
                    </h3>
                  </div>

                  <dl className="divide-y divide-slate-100">
                    {seccion.items.map(({ etiqueta, valor }) => (
                      <div
                        key={etiqueta}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <dt className="text-xs text-slate-500">{etiqueta}</dt>
                        <dd className="truncate text-right text-xs font-bold text-slate-800">
                          {valor === null ||
                          valor === undefined ||
                          valor === "" ||
                          String(valor).trim() === ""
                            ? "—"
                            : String(valor)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        </div>
      </div>
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
  opciones,
  colFilters,
  onColFiltersChange,
  onOrdenar,
  onSeleccionar,
  ordenActual,
}) {
  const [openFilter, setOpenFilter] = useState(null);

  function toggleFiltro(key) {
    setOpenFilter((prev) => (prev === key ? null : key));
  }

  function valoresUnicos(key) {
    const valores = new Set();

    ordenes.forEach((fila) => {
      const col = COLUMNAS.find((item) => item.key === key);
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
    if (ordenActual !== key) return <ArrowUpDown className="h-3 w-3 text-white/50" />;
    return ordenActual.startsWith("-") ? (
      <ArrowDown className="h-3 w-3 text-white" />
    ) : (
      <ArrowUp className="h-3 w-3 text-white" />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-sm">
      <div className="max-h-[70vh] min-h-[420px] overflow-auto">
        <table className="min-w-max border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="bg-[#131E5C]">
              {COLUMNAS.map((col) => {
                const activo = seleccionados(col.key).size > 0;

                return (
                  <th
                    key={col.key}
                    className="whitespace-nowrap bg-[#131E5C] px-3 py-2 text-left"
                  >
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          onOrdenar(
                            ordenActual === `-${col.key}`
                              ? col.key
                              : `-${col.key}`
                          )
                        }
                        disabled={col.key === "dias_taller"}
                        className="flex items-center gap-1 rounded px-1 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {iconOrden(col.key)}
                        <span>{col.label}</span>
                      </button>

                      {col.filtro && (
                        <span className="relative">
                          <button
                            type="button"
                            onClick={() => toggleFiltro(col.key)}
                            className={cn(
                              "inline-flex h-5 w-5 items-center justify-center rounded transition",
                              activo
                                ? "bg-yellow-400 text-[#131E5C]"
                                : "text-white/50 hover:bg-white/15 hover:text-white"
                            )}
                          >
                            <Filter className="h-3 w-3" />
                          </button>

                          {openFilter === col.key && (
                            <ColumnFilterDropdown
                              label={col.label}
                              values={valoresUnicos(col.key)}
                              selected={seleccionados(col.key)}
                              onToggle={(value) =>
                                toggleValor(col.key, value)
                              }
                              onClear={() => limpiarColumna(col.key)}
                              onClose={() => setOpenFilter(null)}
                            />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 12 }).map((_, index) => (
                <tr key={index}>
                  {COLUMNAS.map((col) => (
                    <td
                      key={col.key}
                      className="border-b border-r border-slate-100 px-3 py-2.5"
                    >
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : ordenes.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNAS.length}
                  className="px-6 py-16 text-center"
                >
                  <Wrench className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No se encontraron órdenes
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Modifica los filtros para consultar otros registros.
                  </p>
                </td>
              </tr>
            ) : (
              ordenes.map((fila) => (
                <tr
                  key={fila.rowid ?? `${fila.agencia}-${fila.nr_os}-${fila.nr_atendimento}`}
                  onClick={() => onSeleccionar(fila)}
                  className="cursor-pointer transition-colors odd:bg-white even:bg-[#EAF1FF] hover:bg-blue-50/70 active:bg-blue-100/70"
                  title="Ver detalle de la orden"
                >
                  {COLUMNAS.map((col) => {
                    const value = formatCell(fila, col);
                    const negativo =
                      ["moneda", "numero"].includes(col.tipo) &&
                      numero(fila[col.key]) < 0;

                    return (
                      <td
                        key={col.key}
                        title={value}
                        className={cn(
                          "max-w-[340px] whitespace-nowrap border-b border-r border-slate-100 px-3 py-2.5 text-xs",
                          negativo ? "font-semibold text-red-600" : "text-slate-700"
                        )}
                      >
                        {col.key === "dias_taller" ? (
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-[11px] font-bold",
                              colorDias(obtenerDiasTaller(fila.dt_abertura))
                            )}
                          >
                            {value}
                          </span>
                        ) : (
                          <div className="max-w-[320px] truncate">{value}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 bg-[#F7F8FC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Mostrar</span>

          <select
            value={pageSize}
            onChange={(event) =>
              onPageSizeChange(Number(event.target.value))
            }
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
          </select>

          <span className="text-slate-500">
            de{" "}
            <span className="font-bold text-slate-700">
              {entero(total)}
            </span>{" "}
            órdenes
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={onPrev}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="min-w-[110px] text-center text-xs font-semibold text-slate-600">
            Página {entero(page)} de {entero(totalPages)}
          </span>

          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={onNext}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {opciones.fechas && (
        <span className="sr-only">
          Rango disponible: {opciones.fechas.minima} a{" "}
          {opciones.fechas.maxima}
        </span>
      )}
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

export default function Gota() {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState(
    FILTROS_VACIOS
  );
  const [opciones, setOpciones] = useState({});
  const [colFilters, setColFilters] = useState({});

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
  const [seleccionada, setSeleccionada] = useState(null);
  const [error, setError] = useState("");
  const [actualizando, setActualizando] = useState(false);

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
          err?.message ||
            "No fue posible consultar las órdenes de taller."
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

  /* ---------------- HANDLERS ---------------- */

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function aplicarFiltros() {
    setFiltrosAplicados(filtros);
    setPage(1);
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_VACIOS);
    setFiltrosAplicados(FILTROS_VACIOS);
    setColFilters({});
    setPage(1);
  }

  function limpiarFiltrosColumna() {
    setColFilters({});
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
      })
      .catch(() => {})
      .finally(() => setActualizando(false));
  }

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

  const hayFiltros =
    Object.values(filtrosAplicados).some(Boolean) ||
    Object.values(colFilters).some(
      (values) => Array.isArray(values) && values.length > 0
    );

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

  const porAntiguedad = useMemo(() => {
    const ordenRangos = [
      "0-1 días",
      "2-3 días",
      "4-7 días",
      "8-15 días",
      "Más de 15 días",
    ];

    const mapa = new Map(
      (graficas.por_antiguedad || []).map((item) => [
        item.rango,
        numero(item.ordenes),
      ])
    );

    return ordenRangos
      .map((rango) => ({ name: rango, value: mapa.get(rango) || 0 }))
      .filter((item) => item.value > 0);
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

  /* ---------------- RENDER ---------------- */

  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      {/* Encabezado */}
      <div className="border-b border-[#E4E7F0] bg-white px-4 py-5 md:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-[#131E5C]" />
              <h1 className="text-xl font-black tracking-tight text-[#001E50] md:text-2xl">
                GOTA · Gestor de Órdenes de Taller
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500 md:text-sm">
              Matriz de órdenes de servicio activas en taller
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#131E5C]/10 px-3 py-1.5 text-xs font-bold text-[#131E5C]">
              {entero(total)} órdenes
            </span>

            <button
              type="button"
              onClick={refrescar}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-[#131E5C] transition hover:bg-[#131E5C]/5"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", actualizando && "animate-spin")}
              />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-4 py-5 md:px-6 lg:px-8">
        {/* Filtros */}
        <section className="rounded-2xl border border-[#E4E7F0] bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Búsqueda
              </span>
              <input
                type="text"
                value={filtros.q}
                onChange={(event) => actualizarFiltro("q", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") aplicarFiltros();
                }}
                placeholder="OS, atención, agencia o job"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#131E5C]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Agencia
              </span>
              <select
                value={filtros.agencia}
                onChange={(event) =>
                  actualizarFiltro("agencia", event.target.value)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#131E5C]"
              >
                <option value="">Todas</option>
                {(opciones.agencia || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Tipo OS
              </span>
              <select
                value={filtros.tp_os}
                onChange={(event) =>
                  actualizarFiltro("tp_os", event.target.value)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#131E5C]"
              >
                <option value="">Todos</option>
                {(opciones.tpos || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Subtipo
              </span>
              <select
                value={filtros.subtipo_os}
                onChange={(event) =>
                  actualizarFiltro("subtipo_os", event.target.value)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#131E5C]"
              >
                <option value="">Todos</option>
                {(opciones.subtipoos || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Uso CFDI
              </span>
              <select
                value={filtros.uso_cfdi}
                onChange={(event) =>
                  actualizarFiltro("uso_cfdi", event.target.value)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#131E5C]"
              >
                <option value="">Todos</option>
                {(opciones.uso_cfdi || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Forma de pago
              </span>
              <select
                value={filtros.forma_pago}
                onChange={(event) =>
                  actualizarFiltro("forma_pago", event.target.value)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#131E5C]"
              >
                <option value="">Todas</option>
                {(opciones.formapago || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Desde apertura
              </span>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(event) =>
                  actualizarFiltro("fecha_desde", event.target.value)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#131E5C]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Hasta apertura
              </span>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(event) =>
                  actualizarFiltro("fecha_hasta", event.target.value)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#131E5C]"
              />
            </label>

            <div className="flex items-end gap-2 lg:col-span-2">
              <button
                type="button"
                onClick={aplicarFiltros}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#131E5C] px-4 text-[11px] font-bold text-white transition hover:bg-[#0A1340]"
              >
                <Filter className="h-3.5 w-3.5" />
                Aplicar filtros
              </button>

              <button
                type="button"
                onClick={limpiarFiltros}
                disabled={!hayFiltros}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ListFilter className="h-3.5 w-3.5" />
                Limpiar
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Órdenes en taller"
            value={loadingDashboard ? "—" : entero(totales.ordenes)}
            subtitle={`${entero(totales.agencias)} agencia(s)`}
            icon={Wrench}
          />
          <KpiCard
            title="Días promedio"
            value={
              loadingDashboard ? "—" : numero(totales.dias_promedio).toFixed(1)
            }
            subtitle={`Máximo ${entero(totales.dias_maximo)} días`}
            icon={Clock}
          />
          <KpiCard
            title="Monto total"
            value={loadingDashboard ? "—" : dinero(totales.monto_total)}
            subtitle={`Partes ${dinero(totales.monto_pecas)}`}
            icon={DollarSign}
          />
          <KpiCard
            title="Descuento en partes"
            value={loadingDashboard ? "—" : dinero(totales.descuento_pecas)}
            subtitle={`Adicionales ${dinero(totales.monto_adicionales)}`}
            icon={TrendingUp}
          />
        </section>

        {/* Gráficas */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <VWPieCard
            title="Órdenes por tipo"
            icon={Tag}
            data={porTipo}
            label={`${entero(totales.ordenes)} en total`}
          />

          <VWBarCard
            title="Órdenes por agencia"
            icon={MapPin}
            data={porAgencia}
            yKey="ordenes"
            barColor="#1677FF"
          />

          <VWPieCard
            title="Permanencia en taller"
            icon={Clock}
            data={porAntiguedad}
          />

          <VWBarCard
            title="Órdenes por subtipo"
            icon={CalendarDays}
            data={porSubtipo}
            yKey="value"
            barColor="#14B8A6"
          />

          <div className="lg:col-span-2">
            <VWAreaCard
              title="Aperturas por día"
              icon={CalendarCheck}
              data={porDia}
            />
          </div>
        </section>

        {/* Tabla */}
        <section>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black text-[#001E50]">
              <Sheet className="h-4 w-4" />
              Detalle de órdenes
            </h2>

            {Object.values(colFilters).some(
              (values) => Array.isArray(values) && values.length > 0
            ) && (
              <button
                type="button"
                onClick={limpiarFiltrosColumna}
                className="inline-flex h-8 items-center gap-1.5 self-start rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-bold text-red-600 transition hover:bg-red-100"
              >
                <ListFilter className="h-3.5 w-3.5" />
                Limpiar filtros de columna
              </button>
            )}
          </div>

          <TablaOrdenes
            ordenes={ordenes}
            loading={loading}
            total={total}
            page={page}
            pageSize={pageSize}
            totalPages={totalPaginas}
            onPrev={() => setPage((prev) => Math.max(1, prev - 1))}
            onNext={() =>
              setPage((prev) => Math.min(totalPaginas, prev + 1))
            }
            onPageSizeChange={(value) => {
              setPageSize(value);
              setPage(1);
            }}
            opciones={opciones}
            colFilters={colFilters}
            onColFiltersChange={(valor) => {
              setColFilters(valor);
              setPage(1);
            }}
            onSeleccionar={(fila) => setSeleccionada(fila)}
            onOrdenar={cambiarOrden}
            ordenActual={ordenActual}
          />
        </section>
      </div>

      {seleccionada && (
        <DetalleOrden
          orden={seleccionada}
          onClose={() => setSeleccionada(null)}
        />
      )}
    </main>
  );
}