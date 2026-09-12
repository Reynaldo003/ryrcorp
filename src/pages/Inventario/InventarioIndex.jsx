// src/pages/Inventario/InventarioIndex.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiInventario } from "../../lib/apiInventario";
import { useECharts } from "./useECharts";
import "./inventario.css";

import vwDark from "../../assets/vw_dark.png";

const BRAND_BLUE = "#131E5C";

const COLORES = [
  "#0B143F",
  "#10205A",
  "#142D76",
  "#183B91",
  "#1C49AC",
  "#2058C6",
  "#2868D5",
  "#3479E0",
  "#438BE8",
];

const PALETA_AGENCIAS = COLORES;
const PALETA_ESTATUS = COLORES;

const PALETA_CONDICION = {
  Nuevo: BRAND_BLUE,
  Usado: COLORES[7],
  default: COLORES[4],
};

const ESTATUS_EXCLUIDOS = ["V", "O", "C", "D", "P", "T"];

const KPI_ICONS = {
  "Total activo": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
    />
  ),
  "Agencia líder": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
    />
  ),
  "% Nuevos": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9 14.25l6-6m4.5-3.493V21.75l-4.125-2.062-4.125 2.063-4.125-2.063L3 21.75V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
    />
  ),
  "Costo inventario": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  "Fuera de gracia": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  ),
  "Costo financiero": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33"
    />
  ),
  "Tasa aplicada": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7.5 7.5h.008v.008H7.5V7.5zm9 9h.008v.008H16.5V16.5zM18 6L6 18"
    />
  ),
  "Periodo de gracia": (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M6.75 3v2.25M17.25 3v2.25M3.75 9h16.5M5.25 5.25h13.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-12a1.5 1.5 0 011.5-1.5z"
    />
  ),
};

function numeroSeguro(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function formatMoneda(valor, decimales = 2) {
  return `$${numeroSeguro(valor).toLocaleString("es-MX", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })}`;
}

function obtenerReglaPenetracion(penetracion) {
  const valor = Math.max(0, Math.min(100, numeroSeguro(penetracion)));

  if (valor < 38) {
    return {
      rango: "< 38%",
      bono: 0,
      descuentoWholesale: 0,
    };
  }

  if (valor < 42) {
    return {
      rango: "38% a < 42%",
      bono: 0.5,
      descuentoWholesale: 0,
    };
  }

  if (valor < 48) {
    return {
      rango: "42% a < 48%",
      bono: 1,
      descuentoWholesale: -1.5,
    };
  }

  if (valor < 53) {
    return {
      rango: "48% a < 53%",
      bono: 2.25,
      descuentoWholesale: -2,
    };
  }

  return {
    rango: ">= 53%",
    bono: 3.5,
    descuentoWholesale: -2.5,
  };
}

function calcularFinanciamientoVehiculo(
  vehiculo,
  periodoGracia,
  tasaAnual
) {
  const antiguedad =
    vehiculo.diasEnStock === null ||
      vehiculo.diasEnStock === undefined
      ? null
      : numeroSeguro(vehiculo.diasEnStock);

  if (antiguedad === null) {
    return {
      ...vehiculo,
      diasFueraGracia: null,
      costoFinancieroDiario: null,
      costoFinancieroTotal: null,
    };
  }

  const diasFuera =
    antiguedad > periodoGracia
      ? antiguedad - periodoGracia
      : null;

  if (diasFuera === null) {
    return {
      ...vehiculo,
      diasFueraGracia: null,
      costoFinancieroDiario: null,
      costoFinancieroTotal: null,
    };
  }

  const valorCompra = Number(vehiculo.VrNF_Compra);

  if (!Number.isFinite(valorCompra)) {
    return {
      ...vehiculo,
      diasFueraGracia: diasFuera,
      costoFinancieroDiario: null,
      costoFinancieroTotal: null,
    };
  }

  const costoFinancieroDiario =
    (valorCompra * (tasaAnual / 100)) / 360;

  const costoFinancieroTotal =
    costoFinancieroDiario * diasFuera;

  return {
    ...vehiculo,
    diasFueraGracia: diasFuera,
    costoFinancieroDiario,
    costoFinancieroTotal,
  };
}

function KPICard({
  label,
  value,
  sub,
  color = BRAND_BLUE,
  destacado = false,
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-[0_2px_8px_rgba(19,30,92,0.05)] ${destacado
        ? "border-[#131E5C] bg-[#131E5C] text-white"
        : "border-[#B9C4D7] bg-white"
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={`font-black uppercase tracking-[0.07em] ${destacado ? "text-white" : "text-[#1A2344]"
            }`}
        >
          {label}
        </div>

        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${destacado
            ? "bg-white/15 text-white"
            : "bg-[#EAF0FF]"
            }`}
          style={!destacado ? { color } : undefined}
        >
          <svg
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {KPI_ICONS[label]}
          </svg>
        </span>
      </div>

      <div
        className={`mt-6 text-[32px] font-black leading-none ${destacado ? "text-white" : "text-[#07184C]"
          }`}
      >
        {value}
      </div>

      <div
        className={`mt-4 border-t pt-3 font-semibold ${destacado
          ? "border-white/15 text-white/80"
          : "border-[#E6EAF1] text-[#67728B]"
          }`}
      >
        {sub || "\u00A0"}
      </div>
    </div>
  );
}

function Panel({ titulo, subtitulo, children, alto, extra }) {
  return (
    <div className="rounded-xl border border-[#B9C4D7] bg-white p-4 shadow-[0_2px_8px_rgba(19,30,92,0.05)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black uppercase tracking-[0.06em] text-[#152754]">
            {titulo}
          </h3>

          {subtitulo && (
            <p className="mt-1 text-[13px] font-medium text-[#7A859C]">
              {subtitulo}
            </p>
          )}
        </div>

        {extra}
      </div>

      <div style={alto ? { height: alto } : undefined}>
        {children}
      </div>
    </div>
  );
}

function ChartDiv({ option, loading, onEvents }) {
  const ref = useECharts(option, {
    loading,
    onEvents,
  });

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
}

function EmptyState({
  mensaje = "Sin datos para los filtros seleccionados",
}) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-2"
      style={{ color: `${BRAND_BLUE}55` }}
    >
      <svg
        width="32"
        height="32"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M3 17v-2a4 4 0 014-4h0M12 7a4 4 0 100-8 4 4 0 000 8z"
        />
      </svg>

      <span className="text-sm">
        {mensaje}
      </span>
    </div>
  );
}

function Badge({ label, color = BRAND_BLUE }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{
        background: `${color}12`,
        color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: color }}
      />

      {label}
    </span>
  );
}

function Seccion({ titulo, subtitulo, children, className = "" }) {
  return (
    <section
      className={`relative rounded-xl border border-[#9EA9BD] bg-white px-2 pb-4 pt-7 shadow-sm ${className}`}
    >
      <div className="absolute -top-[14px] left-5 flex max-w-[calc(100%_-_40px)] items-center gap-3 bg-white px-2">
        <h2 className="whitespace-nowrap text-[18px] font-black text-[#07184C]">
          {titulo}
        </h2>

        <div className="hidden h-px w-24 bg-[#748199] sm:block" />
      </div>

      {subtitulo && (
        <div className="mb-4 font-medium text-[#67728B]">
          {subtitulo}
        </div>
      )}

      {children}
    </section>
  );
}

function Tarjeta({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-[#B9C4D7] bg-white p-4 shadow-[0_2px_8px_rgba(19,30,92,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

function GrupoFiltro({ titulo, children }) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-black uppercase  text-[#67728B]">
        {titulo}
      </div>

      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

function BotonFiltro({ activo, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-[13px] font-bold transition ${activo
        ? "border-[#131E5C] bg-[#131E5C] text-white shadow-sm"
        : "border-[#131E5C] bg-white text-[#152754] hover:border-[#131E5C] hover:bg-[#EEF2F8]"
        }`}
    >
      {children}
    </button>
  );
}

function CampoFinanciero({
  titulo,
  descripcion,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}) {
  return (
    <div>
      <label className="text-[12px] font-black uppercase tracking-[0.06em] text-[#67728B]">
        {titulo}
      </label>

      <div className="relative mt-2">
        <input
          type="number"
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          className="h-10 w-full rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 pr-11 font-bold text-[#152754] outline-none transition focus:border-[#1555C7] focus:bg-white"
        />

        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#7A859C]">
            {suffix}
          </span>
        )}
      </div>

      <div className="mt-1 text-[14px] font-medium text-[#8A94A8]">
        {descripcion}
      </div>
    </div>
  );
}

function MetricaFinanciera({ titulo, valor, detalle }) {
  return (
    <div className="rounded-lg border border-[#D7DEEA] bg-white px-4 py-3">
      <div className="text-[13px] font-semibold text-[#67728B]">
        {titulo}
      </div>

      <div className="mt-1 text-[19px] font-black text-[#07184C]">
        {valor}
      </div>

      {detalle && (
        <div className="mt-1 text-[12px] font-medium text-[#8A94A8]">
          {detalle}
        </div>
      )}
    </div>
  );
}

function FiltrosInventario({
  filtrosDisponibles,
  agenciaSeleccionada,
  setAgenciaSeleccionada,
  estatusSeleccionado,
  setEstatusSeleccionado,
  periodoGracia,
  setPeriodoGracia,
  tiie,
  setTiie,
  spreadBase,
  setSpreadBase,
  penetracionRetail,
  setPenetracionRetail,
  reglaPenetracion,
  spreadEfectivo,
  tasaAnual,
}) {
  const estatusDisponibles = filtrosDisponibles.estatus.filter(
    (estatus) => !ESTATUS_EXCLUIDOS.includes(estatus.codigo)
  );

  return (
    <div className="p-4 shadow-sm">
      <div className="space-y-5 grid grid-cols-4">
        <GrupoFiltro titulo="Agencia">
          <BotonFiltro
            activo={!agenciaSeleccionada}
            onClick={() => setAgenciaSeleccionada("")}
          >
            Todas
          </BotonFiltro>

          {filtrosDisponibles.agencias.map((agencia) => (
            <BotonFiltro
              key={agencia.codigo}
              activo={agenciaSeleccionada === agencia.codigo}
              onClick={() => setAgenciaSeleccionada(agencia.codigo)}
            >
              {agencia.nombre}
            </BotonFiltro>
          ))}
        </GrupoFiltro>

        <GrupoFiltro titulo="Estatus">
          <BotonFiltro
            activo={!estatusSeleccionado}
            onClick={() => setEstatusSeleccionado("")}
          >
            Todos
          </BotonFiltro>

          {estatusDisponibles.map((estatus) => (
            <BotonFiltro
              key={estatus.codigo}
              activo={estatusSeleccionado === estatus.codigo}
              onClick={() => setEstatusSeleccionado(estatus.codigo)}
            >
              {estatus.nombre}
            </BotonFiltro>
          ))}
        </GrupoFiltro>

        <GrupoFiltro titulo="Periodo de gracia">
          {[30, 45, 60].map((dias) => (
            <BotonFiltro
              key={dias}
              activo={periodoGracia === dias}
              onClick={() => setPeriodoGracia(dias)}
            >
              {dias} días
            </BotonFiltro>
          ))}
        </GrupoFiltro>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CampoFinanciero
            titulo="TIIE 28 días"
            descripcion="Tasa anual de referencia"
            value={tiie}
            onChange={(e) => setTiie(e.target.value)}
            min="0"
            step="0.0001"
            suffix="%"
          />

          <CampoFinanciero
            titulo="Spread base"
            descripcion="Antes del descuento wholesale"
            value={spreadBase}
            onChange={(e) => setSpreadBase(e.target.value)}
            step="0.01"
            suffix="pp"
          />

          <CampoFinanciero
            titulo="Penetración retail"
            descripcion="Define bono y descuento"
            value={penetracionRetail}
            onChange={(e) => setPenetracionRetail(e.target.value)}
            min="0"
            max="100"
            step="0.01"
            suffix="%"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricaFinanciera
          titulo="Bono penetración"
          valor={`${reglaPenetracion.bono.toFixed(2)} pp`}
          detalle={reglaPenetracion.rango}
        />

        <MetricaFinanciera
          titulo="Descuento wholesale"
          valor={`${reglaPenetracion.descuentoWholesale.toFixed(2)} pp`}
          detalle="Ajuste sobre spread"
        />

        <MetricaFinanciera
          titulo="Spread efectivo"
          valor={`${spreadEfectivo.toFixed(2)} pp`}
          detalle="Spread base + descuento"
        />

        <MetricaFinanciera
          titulo="TIIE + Spread"
          valor={`${tasaAnual.toFixed(4)}%`}
          detalle="Tasa anual aplicada"
        />
      </div>
    </div>
  );
}
function obtenerColorAntiguedad(
  dias,
  periodoGracia
) {
  if (dias <= periodoGracia) {
    return COLORES[7];
  }

  if (dias <= periodoGracia + 30) {
    return COLORES[5];
  }

  if (dias <= periodoGracia + 60) {
    return COLORES[3];
  }

  return COLORES[0];
}

function TablaVehiculos({
  vehiculos,
  cargando,
  error,
  familiaFiltro,
  onClearFamilia,
  periodoGracia,
}) {
  const [query, setQuery] = useState("");
  const [pagina, setPagina] = useState(1);
  const [filtAgencia, setFiltAgencia] = useState("");
  const [filtEstatus, setFiltEstatus] = useState("");
  const [filtCondicion, setFiltCondicion] =
    useState("");
  const [filtFamilia, setFiltFamilia] =
    useState("");
  const [filtDiasMin, setFiltDiasMin] =
    useState("");
  const [filtDiasMax, setFiltDiasMax] =
    useState("");

  const POR_PAGINA = 12;

  const agencias = useMemo(
    () =>
      [
        ...new Set(
          vehiculos
            .map((v) => v.agenciaNombre)
            .filter(Boolean)
        ),
      ].sort(),
    [vehiculos]
  );

  const estatuses = useMemo(
    () =>
      [
        ...new Set(
          vehiculos
            .map((v) => v.estatusNombre)
            .filter(Boolean)
        ),
      ].sort(),
    [vehiculos]
  );

  const familias = useMemo(
    () =>
      [
        ...new Set(
          vehiculos
            .map((v) => v.NmFamilia)
            .filter(Boolean)
        ),
      ].sort(),
    [vehiculos]
  );

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();

    return vehiculos.filter((v) => {
      if (
        familiaFiltro &&
        (v.NmFamilia || "").toLowerCase() !==
        familiaFiltro.toLowerCase()
      ) {
        return false;
      }

      if (
        filtAgencia &&
        v.agenciaNombre !== filtAgencia
      ) {
        return false;
      }

      if (
        filtEstatus &&
        v.estatusNombre !== filtEstatus
      ) {
        return false;
      }

      if (filtCondicion) {
        const condicion =
          {
            N: "Nuevo",
            U: "Usado",
          }[(v.CondUso || "").trim()];

        if (condicion !== filtCondicion) {
          return false;
        }
      }

      if (
        filtFamilia &&
        (v.NmFamilia || "") !== filtFamilia
      ) {
        return false;
      }

      if (
        filtDiasMin !== "" &&
        (v.diasEnStock ?? 0) <
        Number(filtDiasMin)
      ) {
        return false;
      }

      if (
        filtDiasMax !== "" &&
        (v.diasEnStock ?? 0) >
        Number(filtDiasMax)
      ) {
        return false;
      }

      if (q) {
        return [
          v.NmFamilia,
          v.NmMarca,
          v.EdiModelo,
          v.agenciaNombre,
          v.estatusNombre,
          v.SitVeiculo,
          v.NrChassi,
        ].some((campo) =>
          (campo || "")
            .toLowerCase()
            .includes(q)
        );
      }

      return true;
    });
  }, [
    vehiculos,
    query,
    familiaFiltro,
    filtAgencia,
    filtEstatus,
    filtCondicion,
    filtFamilia,
    filtDiasMin,
    filtDiasMax,
  ]);

  useEffect(() => {
    setPagina(1);
  }, [
    query,
    vehiculos,
    filtAgencia,
    filtEstatus,
    filtCondicion,
    filtFamilia,
    filtDiasMin,
    filtDiasMax,
  ]);

  const totalPaginas = Math.ceil(
    filtrados.length / POR_PAGINA
  );

  const paginados = filtrados.slice(
    (pagina - 1) * POR_PAGINA,
    pagina * POR_PAGINA
  );

  const condLabel = (condicion) =>
  ({
    N: "Nuevo",
    U: "Usado",
  }[(condicion || "").trim()] ??
    condicion ??
    "—");

  const totalCosto = filtrados.reduce(
    (total, vehiculo) =>
      total +
      numeroSeguro(vehiculo.VrNF_Compra),
    0
  );

  const totalCostoFinanciero =
    filtrados.reduce(
      (total, vehiculo) =>
        total +
        numeroSeguro(
          vehiculo.costoFinancieroTotal
        ),
      0
    );

  const hayFiltros =
    filtAgencia ||
    filtEstatus ||
    filtCondicion ||
    filtFamilia ||
    filtDiasMin ||
    filtDiasMax;

  const limpiarFiltros = () => {
    setFiltAgencia("");
    setFiltEstatus("");
    setFiltCondicion("");
    setFiltFamilia("");
    setFiltDiasMin("");
    setFiltDiasMax("");
    setQuery("");
  };

  const selectCls =
    "vw-control text-xs border rounded-lg px-2 py-1.5 bg-white";

  return (
    <div>
      <div className="relative mb-3">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2"
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ color: `${BRAND_BLUE}88` }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
          />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          placeholder="Buscar por VIN, modelo, agencia…"
          className="vw-control w-full pl-8 pr-8 py-1.5 text-xs border rounded-lg bg-white"
        />

        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{
              color: `${BRAND_BLUE}88`,
            }}
          >
            <svg
              width="12"
              height="12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div
        className="flex flex-wrap gap-2 mb-3 p-3 rounded-xl"
        style={{
          background: `${BRAND_BLUE}06`,
          border: `1px solid ${BRAND_BLUE}10`,
        }}
      >
        <select
          value={filtAgencia}
          onChange={(e) =>
            setFiltAgencia(e.target.value)
          }
          className={selectCls}
        >
          <option value="">
            Todas las agencias
          </option>

          {agencias.map((agencia) => (
            <option
              key={agencia}
              value={agencia}
            >
              {agencia}
            </option>
          ))}
        </select>

        <select
          value={filtEstatus}
          onChange={(e) =>
            setFiltEstatus(e.target.value)
          }
          className={selectCls}
        >
          <option value="">
            Todos los estatus
          </option>

          {estatuses.map((estatus) => (
            <option
              key={estatus}
              value={estatus}
            >
              {estatus}
            </option>
          ))}
        </select>

        <select
          value={filtCondicion}
          onChange={(e) =>
            setFiltCondicion(e.target.value)
          }
          className={selectCls}
        >
          <option value="">
            Nuevo y Usado
          </option>
          <option value="Nuevo">
            Nuevo
          </option>
          <option value="Usado">
            Usado
          </option>
        </select>

        <select
          value={filtFamilia}
          onChange={(e) =>
            setFiltFamilia(e.target.value)
          }
          className={selectCls}
        >
          <option value="">
            Todas las familias
          </option>

          {familias.map((familia) => (
            <option
              key={familia}
              value={familia}
            >
              {familia}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <input
            type="number"
            value={filtDiasMin}
            onChange={(e) =>
              setFiltDiasMin(e.target.value)
            }
            placeholder="Días min"
            min={0}
            className={`${selectCls} w-24`}
          />

          <span
            className="text-xs"
            style={{
              color: `${BRAND_BLUE}88`,
            }}
          >
            —
          </span>

          <input
            type="number"
            value={filtDiasMax}
            onChange={(e) =>
              setFiltDiasMax(e.target.value)
            }
            placeholder="Días max"
            min={0}
            className={`${selectCls} w-24`}
          />
        </div>

        {hayFiltros && (
          <button
            onClick={limpiarFiltros}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{
              background: `${BRAND_BLUE}12`,
              color: BRAND_BLUE,
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {familiaFiltro && (
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-xs"
            style={{
              color: `${BRAND_BLUE}88`,
            }}
          >
            Filtrando por modelo:
          </span>

          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: `${COLORES[7]}15`,
              color: COLORES[7],
            }}
          >
            {familiaFiltro}

            <button
              onClick={onClearFamilia}
            >
              <svg
                width="10"
                height="10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        </div>
      )}

      {!cargando && !error && (
        <p
          className="text-xs mb-2"
          style={{
            color: `${BRAND_BLUE}77`,
          }}
        >
          {filtrados.length.toLocaleString(
            "es-MX"
          )}{" "}
          vehículo
          {filtrados.length !== 1
            ? "s"
            : ""}
          {query && ` · "${query}"`}
        </p>
      )}

      {error && (
        <p
          className="text-sm text-center py-6"
          style={{ color: BRAND_BLUE }}
        >
          {error}
        </p>
      )}

      {cargando && (
        <div
          className="flex items-center justify-center py-10 gap-2 text-sm"
          style={{
            color: `${BRAND_BLUE}88`,
          }}
        >
          <svg
            className="animate-spin"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>

          Cargando…
        </div>
      )}

      {!cargando &&
        !error &&
        filtrados.length === 0 && (
          <p
            className="text-center text-xs py-8"
            style={{
              color: `${BRAND_BLUE}77`,
            }}
          >
            Sin resultados.
          </p>
        )}

      {!cargando &&
        !error &&
        paginados.length > 0 && (
          <>
            <div
              className="overflow-auto rounded-xl"
              style={{
                border: `1px solid ${BRAND_BLUE}10`,
              }}
            >
              <table className="w-full text-xs">
                <thead>
                  <tr
                    className="text-left"
                    style={{
                      background:
                        `${BRAND_BLUE}08`,
                      borderBottom: `1px solid ${BRAND_BLUE}12`,
                    }}
                  >
                    {[
                      "VIN",
                      "Familia",
                      "Modelo",
                      "Agencia",
                      "Condición",
                      "Estatus",
                      "F. Factura",
                      "Antigüedad",
                      "Fuera gracia",
                      "Valor Compra",
                      "Costo diario",
                      "Costo financiero",
                      "Situación",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-3 py-2.5 font-semibold whitespace-nowrap"
                        style={{
                          color: `${BRAND_BLUE}BB`,
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {paginados.map(
                    (vehiculo, index) => {
                      const colorAntiguedad =
                        obtenerColorAntiguedad(
                          vehiculo.diasEnStock ??
                          0,
                          periodoGracia
                        );

                      return (
                        <tr
                          key={`${vehiculo.NrChassi}-${index}`}
                          style={{
                            borderBottom: `1px solid ${BRAND_BLUE}08`,
                            background:
                              index % 2 === 0
                                ? "#FFFFFF"
                                : `${BRAND_BLUE}03`,
                          }}
                        >
                          <td className="px-3 py-2 font-mono whitespace-nowrap">
                            <span
                              className="font-semibold"
                              style={{
                                color:
                                  BRAND_BLUE,
                                fontSize:
                                  "11px",
                                letterSpacing:
                                  "0.03em",
                              }}
                            >
                              {vehiculo.NrChassi ||
                                "—"}
                            </span>
                          </td>

                          <td
                            className="px-3 py-2 font-medium whitespace-nowrap"
                            style={{
                              color:
                                COLORES[1],
                            }}
                          >
                            {vehiculo.NmFamilia ||
                              "—"}
                          </td>

                          <td
                            className="px-3 py-2 whitespace-nowrap"
                            style={{
                              color:
                                `${BRAND_BLUE}BB`,
                            }}
                          >
                            {vehiculo.EdiModelo ||
                              "—"}
                          </td>

                          <td
                            className="px-3 py-2 whitespace-nowrap"
                            style={{
                              color:
                                `${BRAND_BLUE}BB`,
                            }}
                          >
                            {
                              vehiculo.agenciaNombre
                            }
                          </td>

                          <td
                            className="px-3 py-2 whitespace-nowrap"
                            style={{
                              color:
                                `${BRAND_BLUE}BB`,
                            }}
                          >
                            {condLabel(
                              vehiculo.CondUso
                            )}
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            <span
                              className="px-2 py-0.5 rounded-sm text-xs font-semibold"
                              style={{
                                background:
                                  `${BRAND_BLUE}12`,
                                color:
                                  BRAND_BLUE,
                              }}
                            >
                              {
                                vehiculo.estatusNombre
                              }
                            </span>
                          </td>

                          <td
                            className="px-3 py-2 whitespace-nowrap"
                            style={{
                              color:
                                `${BRAND_BLUE}99`,
                            }}
                          >
                            {vehiculo.DtFaturamento ||
                              "—"}
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            {vehiculo.diasEnStock !=
                              null ? (
                              <span
                                className="font-medium px-2 py-0.5 rounded-full"
                                style={{
                                  background:
                                    `${colorAntiguedad}14`,
                                  color:
                                    colorAntiguedad,
                                }}
                              >
                                {
                                  vehiculo.diasEnStock
                                }
                                d
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="px-3 py-2 whitespace-nowrap">
                            {vehiculo.diasFueraGracia !=
                              null ? (
                              <span
                                className="font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                  background:
                                    `${COLORES[2]}14`,
                                  color:
                                    COLORES[2],
                                }}
                              >
                                {
                                  vehiculo.diasFueraGracia
                                }
                                d
                              </span>
                            ) : (
                              <span
                                className="font-medium px-2 py-0.5 rounded-full"
                                style={{
                                  background:
                                    `${COLORES[7]}12`,
                                  color:
                                    COLORES[7],
                                }}
                              >
                                En gracia
                              </span>
                            )}
                          </td>

                          <td
                            className="px-3 py-2 whitespace-nowrap"
                            style={{
                              color:
                                `${BRAND_BLUE}BB`,
                            }}
                          >
                            {vehiculo.VrNF_Compra !=
                              null
                              ? formatMoneda(
                                vehiculo.VrNF_Compra
                              )
                              : "—"}
                          </td>

                          <td
                            className="px-3 py-2 whitespace-nowrap"
                            style={{
                              color:
                                `${BRAND_BLUE}BB`,
                            }}
                          >
                            {vehiculo.costoFinancieroDiario !=
                              null
                              ? formatMoneda(
                                vehiculo.costoFinancieroDiario
                              )
                              : "—"}
                          </td>

                          <td
                            className="px-3 py-2 font-semibold whitespace-nowrap"
                            style={{
                              color:
                                BRAND_BLUE,
                            }}
                          >
                            {vehiculo.costoFinancieroTotal !=
                              null
                              ? formatMoneda(
                                vehiculo.costoFinancieroTotal
                              )
                              : "—"}
                          </td>

                          <td
                            className="px-3 py-2 whitespace-nowrap"
                            style={{
                              color:
                                `${BRAND_BLUE}77`,
                            }}
                          >
                            {vehiculo.SitVeiculo ||
                              "—"}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>

                <tfoot>
                  <tr
                    style={{
                      background:
                        `${BRAND_BLUE}08`,
                      borderTop: `2px solid ${BRAND_BLUE}18`,
                    }}
                  >
                    <td
                      colSpan={9}
                      className="px-3 py-2.5 font-semibold text-xs"
                      style={{
                        color: BRAND_BLUE,
                      }}
                    >
                      Total (
                      {filtrados.length.toLocaleString(
                        "es-MX"
                      )}{" "}
                      vehículos)
                    </td>

                    <td
                      className="px-3 py-2.5 font-bold whitespace-nowrap text-xs"
                      style={{
                        color: BRAND_BLUE,
                      }}
                    >
                      {formatMoneda(totalCosto)}
                    </td>

                    <td />

                    <td
                      className="px-3 py-2.5 font-bold whitespace-nowrap text-xs"
                      style={{
                        color: BRAND_BLUE,
                      }}
                    >
                      {formatMoneda(
                        totalCostoFinanciero
                      )}
                    </td>

                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div
                className="flex items-center justify-between mt-3 pt-3"
                style={{
                  borderTop: `1px solid ${BRAND_BLUE}10`,
                }}
              >
                <span
                  className="text-xs"
                  style={{
                    color: `${BRAND_BLUE}77`,
                  }}
                >
                  Página {pagina} de{" "}
                  {totalPaginas}
                </span>

                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setPagina((actual) =>
                        Math.max(
                          1,
                          actual - 1
                        )
                      )
                    }
                    disabled={pagina === 1}
                    className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40"
                    style={{
                      borderColor:
                        `${BRAND_BLUE}22`,
                      color: BRAND_BLUE,
                    }}
                  >
                    ← Anterior
                  </button>

                  <button
                    onClick={() =>
                      setPagina((actual) =>
                        Math.min(
                          totalPaginas,
                          actual + 1
                        )
                      )
                    }
                    disabled={
                      pagina === totalPaginas
                    }
                    className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40"
                    style={{
                      borderColor:
                        `${BRAND_BLUE}22`,
                      color: BRAND_BLUE,
                    }}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
}

export default function InventarioIndex() {
  const navigate = useNavigate();

  const tablaRef = useRef(null);

  const [
    filtrosDisponibles,
    setFiltrosDisponibles,
  ] = useState({
    agencias: [],
    estatus: [],
  });

  const [
    agenciaSeleccionada,
    setAgenciaSeleccionada,
  ] = useState("");

  const [
    estatusSeleccionado,
    setEstatusSeleccionado,
  ] = useState("");

  const [familiaFiltro, setFamiliaFiltro] =
    useState("");

  const [vehiculos, setVehiculos] =
    useState([]);

  const [porAgencia, setPorAgencia] =
    useState([]);

  const [porEstatus, setPorEstatus] =
    useState([]);

  const [porMarca, setPorMarca] =
    useState([]);

  const [nuevoUsado, setNuevoUsado] =
    useState([]);

  const [
    nacionalImportado,
    setNacionalImportado,
  ] = useState([]);

  const [costoTotal, setCostoTotal] =
    useState(0);

  const [antiguedad, setAntiguedad] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [cargandoTabla, setCargandoTabla] =
    useState(true);

  const [error, setError] = useState("");

  const [errorTabla, setErrorTabla] =
    useState("");

  // Parámetros financieros.
  const [periodoGracia, setPeriodoGracia] =
    useState(30);

  // Valor inicial según el dato mostrado.
  const [tiie, setTiie] =
    useState("6.7458");

  // Debe configurarse con el spread contractual.
  const [spreadBase, setSpreadBase] =
    useState("0");

  const [
    penetracionRetail,
    setPenetracionRetail,
  ] = useState("0");

  const tiieNumero = useMemo(
    () => numeroSeguro(tiie),
    [tiie]
  );

  const spreadBaseNumero = useMemo(
    () => numeroSeguro(spreadBase),
    [spreadBase]
  );

  const reglaPenetracion = useMemo(
    () =>
      obtenerReglaPenetracion(
        penetracionRetail
      ),
    [penetracionRetail]
  );

  const spreadEfectivo = useMemo(
    () =>
      spreadBaseNumero +
      reglaPenetracion.descuentoWholesale,
    [
      spreadBaseNumero,
      reglaPenetracion.descuentoWholesale,
    ]
  );

  const tasaAnual = useMemo(
    () => tiieNumero + spreadEfectivo,
    [tiieNumero, spreadEfectivo]
  );

  useEffect(() => {
    apiInventario
      .getFiltros()
      .then(setFiltrosDisponibles)
      .catch(() =>
        setFiltrosDisponibles({
          agencias: [],
          estatus: [],
        })
      );
  }, []);

  useEffect(() => {
    const params = {
      agencia:
        agenciaSeleccionada || undefined,
      estatus:
        estatusSeleccionado || undefined,
    };

    setCargando(true);
    setError("");

    Promise.all([
      apiInventario.getPorAgencia(params),
      apiInventario.getPorEstatus(params),
      apiInventario.getPorMarca(params),
      apiInventario.getNuevoUsado(params),
      apiInventario.getNacionalImportado(
        params
      ),
      apiInventario.getCosto(params),
      apiInventario.getAntiguedad(params),
    ])
      .then(
        ([
          agencia,
          estatus,
          marca,
          nu,
          ni,
          costo,
          antig,
        ]) => {
          setPorAgencia(agencia);

          setPorEstatus(
            estatus.filter(
              (item) =>
                !ESTATUS_EXCLUIDOS.includes(
                  item.estatus
                )
            )
          );

          setPorMarca(marca.slice(0, 13));

          setNuevoUsado(
            nu.filter(
              (item) =>
                item.condicion === "Nuevo" ||
                item.condicion === "Usado"
            )
          );

          setNacionalImportado(ni);
          setCostoTotal(costo);
          setAntiguedad(antig);
        }
      )
      .catch(() =>
        setError(
          "No se pudo cargar el inventario."
        )
      )
      .finally(() => setCargando(false));

    setCargandoTabla(true);
    setErrorTabla("");

    apiInventario
      .getInventario(params)
      .then((data) =>
        setVehiculos(
          data.filter(
            (vehiculo) =>
              !ESTATUS_EXCLUIDOS.includes(
                (
                  vehiculo.StEstoque || ""
                ).trim()
              )
          )
        )
      )
      .catch(() =>
        setErrorTabla(
          "No se pudo cargar el listado."
        )
      )
      .finally(() =>
        setCargandoTabla(false)
      );
  }, [
    agenciaSeleccionada,
    estatusSeleccionado,
  ]);

  const vehiculosCalculados = useMemo(
    () =>
      vehiculos.map((vehiculo) =>
        calcularFinanciamientoVehiculo(
          vehiculo,
          periodoGracia,
          tasaAnual
        )
      ),
    [vehiculos, periodoGracia, tasaAnual]
  );

  const totalGeneral =
    vehiculosCalculados.length;

  const costoFinancieroTotal = useMemo(
    () =>
      vehiculosCalculados.reduce(
        (total, vehiculo) =>
          total +
          numeroSeguro(
            vehiculo.costoFinancieroTotal
          ),
        0
      ),
    [vehiculosCalculados]
  );

  const unidadesFueraGracia = useMemo(
    () =>
      vehiculosCalculados.filter(
        (vehiculo) =>
          numeroSeguro(
            vehiculo.diasFueraGracia
          ) > 0
      ).length,
    [vehiculosCalculados]
  );

  const agenciaLider = useMemo(() => {
    if (!porAgencia.length) {
      return null;
    }

    return [...porAgencia].sort(
      (a, b) => b.total - a.total
    )[0];
  }, [porAgencia]);

  const pctNuevo = useMemo(() => {
    const total = nuevoUsado.reduce(
      (acumulado, item) =>
        acumulado + item.total,
      0
    );

    const nuevos = nuevoUsado
      .filter(
        (item) =>
          item.condicion === "Nuevo"
      )
      .reduce(
        (acumulado, item) =>
          acumulado + item.total,
        0
      );

    return total > 0
      ? Math.round((nuevos / total) * 100)
      : 0;
  }, [nuevoUsado]);

  const eventosModelo = useMemo(
    () => ({
      click: (params) => {
        setFamiliaFiltro((actual) =>
          actual.toLowerCase() ===
            params.name.toLowerCase()
            ? ""
            : params.name
        );

        setTimeout(() => {
          tablaRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      },
    }),
    []
  );

  const costosPorAgencia = useMemo(() => {
    const agrupado = {};

    vehiculosCalculados.forEach(
      (vehiculo) => {
        const agencia =
          vehiculo.agenciaNombre ||
          "Sin agencia";

        if (!agrupado[agencia]) {
          agrupado[agencia] = {
            agencia,
            total: 0,
            vehiculosFuera: 0,
          };
        }

        agrupado[agencia].total +=
          numeroSeguro(
            vehiculo.costoFinancieroTotal
          );

        if (
          numeroSeguro(
            vehiculo.diasFueraGracia
          ) > 0
        ) {
          agrupado[agencia].vehiculosFuera +=
            1;
        }
      }
    );

    return Object.values(agrupado)
      .filter((item) => item.total > 0)
      .sort(
        (a, b) => b.total - a.total
      );
  }, [vehiculosCalculados]);

  const optionCostoFinancieroAgencia =
    useMemo(() => {
      if (!costosPorAgencia.length) {
        return null;
      }

      return {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "none",
          },
          backgroundColor: "#FFFFFF",
          borderColor: `${BRAND_BLUE}22`,
          borderWidth: 1,
          textStyle: {
            color: BRAND_BLUE,
            fontSize: 12,
          },
          formatter: (params) => {
            const item = params[0];
            const detalle =
              costosPorAgencia[
              item.dataIndex
              ];

            return `
              <b>${item.name}</b><br/>
              Costo financiero: <b>${formatMoneda(
              item.value
            )}</b><br/>
              Fuera de gracia: <b>${detalle.vehiculosFuera
              } vehículos</b>
            `;
          },
        },
        grid: {
          left: 8,
          right: 20,
          top: 15,
          bottom: 10,
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: costosPorAgencia.map(
            (item) => item.agencia
          ),
          axisLine: {
            lineStyle: {
              color: `${BRAND_BLUE}22`,
            },
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: `${BRAND_BLUE}BB`,
            fontSize: 11,
          },
        },
        yAxis: {
          type: "value",
          splitLine: {
            lineStyle: {
              color: `${BRAND_BLUE}10`,
              type: "dashed",
            },
          },
          axisLabel: {
            color: `${BRAND_BLUE}88`,
            fontSize: 10,
            formatter: (valor) =>
              `$${(
                valor / 1000
              ).toFixed(0)}k`,
          },
        },
        series: [
          {
            name: "Costo financiero",
            type: "bar",
            barWidth: "45%",
            data: costosPorAgencia.map(
              (item, index) => ({
                value: item.total,
                itemStyle: {
                  color:
                    COLORES[
                    index %
                    COLORES.length
                    ],
                  borderRadius: [
                    6, 6, 0, 0,
                  ],
                },
              })
            ),
            label: {
              show: true,
              position: "top",
              color: BRAND_BLUE,
              fontSize: 10,
              fontWeight: 600,
              formatter: (params) =>
                `$${(
                  params.value / 1000
                ).toFixed(0)}k`,
            },
          },
        ],
      };
    }, [costosPorAgencia]);

  const optionPorAgencia = useMemo(() => {
    if (!porAgencia.length) {
      return null;
    }

    const sorted = [...porAgencia].sort(
      (a, b) => b.total - a.total
    );

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "none",
        },
        backgroundColor: "#FFFFFF",
        borderColor: `${BRAND_BLUE}22`,
        borderWidth: 1,
        textStyle: {
          color: BRAND_BLUE,
          fontSize: 12,
        },
        formatter: (params) => {
          const item = params[0];

          const porcentaje =
            totalGeneral > 0
              ? (
                (item.value /
                  totalGeneral) *
                100
              ).toFixed(1)
              : 0;

          return `
            <b>${item.name}</b><br/>
            Vehículos: <b>${item.value.toLocaleString(
            "es-MX"
          )}</b><br/>
            ${porcentaje}% del total
          `;
        },
      },
      grid: {
        left: 8,
        right: 16,
        top: 20,
        bottom: 8,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: sorted.map(
          (item) => item.agenciaNombre
        ),
        axisLine: {
          lineStyle: {
            color: `${BRAND_BLUE}22`,
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: `${BRAND_BLUE}BB`,
          fontSize: 11,
          fontWeight: 500,
        },
      },
      yAxis: {
        type: "value",
        splitLine: {
          lineStyle: {
            color: `${BRAND_BLUE}10`,
            type: "dashed",
          },
        },
        axisLabel: {
          color: `${BRAND_BLUE}88`,
          fontSize: 10,
          formatter: (valor) =>
            valor.toLocaleString("es-MX"),
        },
      },
      series: [
        {
          name: "Vehículos",
          type: "bar",
          barWidth: "45%",
          data: sorted.map(
            (item, index) => ({
              value: item.total,
              itemStyle: {
                color:
                  PALETA_AGENCIAS[
                  index %
                  PALETA_AGENCIAS.length
                  ],
                borderRadius: [
                  6, 6, 0, 0,
                ],
              },
            })
          ),
          label: {
            show: true,
            position: "top",
            color: BRAND_BLUE,
            fontSize: 11,
            fontWeight: 600,
            formatter: (params) =>
              params.value.toLocaleString(
                "es-MX"
              ),
          },
        },
      ],
    };
  }, [porAgencia, totalGeneral]);

  const optionPorEstatus = useMemo(() => {
    if (!porEstatus.length) {
      return null;
    }

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: "#FFFFFF",
        borderColor: `${BRAND_BLUE}22`,
        borderWidth: 1,
        textStyle: {
          color: BRAND_BLUE,
          fontSize: 12,
        },
        formatter: (params) =>
          `<b>${params.name}</b><br/>${params.value.toLocaleString(
            "es-MX"
          )} vehículos<br/><b>${params.percent
          }%</b>`,
      },
      legend: {
        bottom: 0,
        textStyle: {
          color: `${BRAND_BLUE}BB`,
          fontSize: 11,
        },
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 12,
      },
      color: PALETA_ESTATUS,
      series: [
        {
          name: "Estatus",
          type: "pie",
          radius: ["50%", "75%"],
          center: ["50%", "42%"],
          itemStyle: {
            borderColor: "#FFFFFF",
            borderWidth: 3,
          },
          label: {
            show: true,
            color: BRAND_BLUE,
            fontSize: 11,
            formatter: "{b}\n{d}%",
          },
          emphasis: {
            scaleSize: 5,
          },
          data: porEstatus.map(
            (item) => ({
              name: item.estatusNombre,
              value: item.total,
            })
          ),
        },
      ],
    };
  }, [porEstatus]);

  const optionPorMarca = useMemo(() => {
    if (!porMarca.length) {
      return null;
    }

    const datos = [...porMarca].reverse();

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "none",
        },
        backgroundColor: "#FFFFFF",
        borderColor: `${BRAND_BLUE}22`,
        borderWidth: 1,
        textStyle: {
          color: BRAND_BLUE,
          fontSize: 12,
        },
        formatter: (params) =>
          `<b>${params[0].name}</b><br/>Vehículos: <b>${params[0].value.toLocaleString(
            "es-MX"
          )}</b>`,
      },
      grid: {
        left: 8,
        right: 80,
        top: 12,
        bottom: 12,
        containLabel: true,
      },
      xAxis: {
        type: "value",
        splitLine: {
          lineStyle: {
            color: `${BRAND_BLUE}10`,
            type: "dashed",
          },
        },
        axisLabel: {
          color: `${BRAND_BLUE}88`,
          fontSize: 10,
        },
      },
      yAxis: {
        type: "category",
        data: datos.map(
          (item) => item.familia
        ),
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: BRAND_BLUE,
          fontSize: 11,
          fontWeight: 500,
        },
      },
      series: [
        {
          name: "Vehículos",
          type: "bar",
          data: datos.map(
            (item, index) => {
              const activo =
                familiaFiltro &&
                item.familia.toLowerCase() ===
                familiaFiltro.toLowerCase();

              const inactivo =
                familiaFiltro && !activo;

              return {
                value: item.total,
                itemStyle: {
                  color: inactivo
                    ? `${BRAND_BLUE}33`
                    : COLORES[
                    index %
                    COLORES.length
                    ],
                  borderRadius: [
                    0, 6, 6, 0,
                  ],
                  opacity: inactivo
                    ? 0.4
                    : 1,
                },
              };
            }
          ),
          barWidth: "60%",
          label: {
            show: true,
            position: "right",
            color: BRAND_BLUE,
            fontSize: 11,
            fontWeight: 600,
            formatter: (params) =>
              params.value.toLocaleString(
                "es-MX"
              ),
          },
          cursor: "pointer",
        },
      ],
    };
  }, [porMarca, familiaFiltro]);

  const optionNuevoUsado =
    useMemo(() => {
      if (!nuevoUsado.length) {
        return null;
      }

      const agencias = [
        ...new Set(
          nuevoUsado.map(
            (item) => item.agenciaNombre
          )
        ),
      ];

      const condiciones = [
        "Nuevo",
        "Usado",
      ];

      const series = condiciones.map(
        (condicion) => ({
          name: condicion,
          type: "bar",
          stack: "total",
          data: agencias.map((agencia) => {
            const fila =
              nuevoUsado.find(
                (item) =>
                  item.agenciaNombre ===
                  agencia &&
                  item.condicion ===
                  condicion
              );

            return fila ? fila.total : 0;
          }),
          itemStyle: {
            color:
              PALETA_CONDICION[
              condicion
              ] ||
              PALETA_CONDICION.default,
            borderRadius:
              condicion === "Usado"
                ? [6, 6, 0, 0]
                : [0, 0, 0, 0],
          },
          barWidth: "45%",
          label: {
            show: true,
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: 600,
            formatter: (params) =>
              params.value > 0
                ? params.value.toLocaleString(
                  "es-MX"
                )
                : "",
          },
        })
      );

      return {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "none",
          },
          backgroundColor: "#FFFFFF",
          borderColor:
            `${BRAND_BLUE}22`,
          borderWidth: 1,
          textStyle: {
            color: BRAND_BLUE,
            fontSize: 12,
          },
        },
        legend: {
          top: 0,
          textStyle: {
            color: `${BRAND_BLUE}BB`,
            fontSize: 11,
          },
          icon: "circle",
          itemWidth: 8,
          itemHeight: 8,
        },
        grid: {
          left: 8,
          right: 16,
          top: 32,
          bottom: 8,
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: agencias,
          axisLine: {
            lineStyle: {
              color: `${BRAND_BLUE}22`,
            },
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: `${BRAND_BLUE}BB`,
            fontSize: 11,
          },
        },
        yAxis: {
          type: "value",
          splitLine: {
            lineStyle: {
              color: `${BRAND_BLUE}10`,
              type: "dashed",
            },
          },
          axisLabel: {
            color: `${BRAND_BLUE}88`,
            fontSize: 10,
          },
        },
        series,
      };
    }, [nuevoUsado]);

  const optionNacionalImportado =
    useMemo(() => {
      if (!nacionalImportado.length) {
        return null;
      }

      return {
        tooltip: {
          trigger: "item",
          backgroundColor: "#FFFFFF",
          borderColor:
            `${BRAND_BLUE}22`,
          borderWidth: 1,
          textStyle: {
            color: BRAND_BLUE,
            fontSize: 12,
          },
          formatter: (params) =>
            `<b>${params.name}</b><br/>${params.value.toLocaleString(
              "es-MX"
            )} vehículos<br/><b>${params.percent
            }%</b>`,
        },
        legend: {
          bottom: 0,
          textStyle: {
            color: `${BRAND_BLUE}BB`,
            fontSize: 11,
          },
          icon: "circle",
          itemWidth: 8,
          itemHeight: 8,
        },
        color: [
          BRAND_BLUE,
          COLORES[7],
        ],
        series: [
          {
            name: "Origen",
            type: "pie",
            radius: ["45%", "70%"],
            center: ["50%", "42%"],
            itemStyle: {
              borderColor: "#FFFFFF",
              borderWidth: 3,
            },
            label: {
              show: true,
              color: BRAND_BLUE,
              fontSize: 11,
              formatter: "{b}\n{d}%",
            },
            emphasis: {
              scaleSize: 5,
            },
            data: nacionalImportado.map(
              (item) => ({
                name: item.tipoNombre,
                value: item.total,
              })
            ),
          },
        ],
      };
    }, [nacionalImportado]);

  const optionAntiguedad =
    useMemo(() => {
      if (!antiguedad.length) {
        return null;
      }

      const orden = [
        "+120",
        "91-120",
        "61-90",
        "31-60",
        "0-30",
      ];

      const datos = orden.map(
        (rango) =>
          antiguedad.find(
            (item) =>
              item.rango === rango
          ) ?? {
            rango,
            total: 0,
          }
      );

      return {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "none",
          },
          backgroundColor: "#FFFFFF",
          borderColor:
            `${BRAND_BLUE}22`,
          borderWidth: 1,
          textStyle: {
            color: BRAND_BLUE,
            fontSize: 12,
          },
          formatter: (params) =>
            `<b>${params[0].name} días</b><br/>Vehículos: <b>${params[0].value.toLocaleString(
              "es-MX"
            )}</b>`,
        },
        grid: {
          left: 8,
          right: 60,
          top: 8,
          bottom: 8,
          containLabel: true,
        },
        xAxis: {
          type: "value",
          splitLine: {
            lineStyle: {
              color: `${BRAND_BLUE}10`,
              type: "dashed",
            },
          },
          axisLabel: {
            color: `${BRAND_BLUE}88`,
            fontSize: 10,
          },
        },
        yAxis: {
          type: "category",
          data: datos.map(
            (item) => item.rango
          ),
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            color: BRAND_BLUE,
            fontSize: 12,
            fontWeight: 600,
          },
        },
        series: [
          {
            name: "Vehículos",
            type: "bar",
            data: datos.map(
              (item, index) => ({
                value: item.total,
                itemStyle: {
                  color:
                    COLORES[
                    index %
                    COLORES.length
                    ],
                  borderRadius: [
                    0, 6, 6, 0,
                  ],
                },
              })
            ),
            barWidth: "55%",
            label: {
              show: true,
              position: "right",
              color: BRAND_BLUE,
              fontSize: 12,
              fontWeight: 600,
              formatter: (params) =>
                params.value > 0
                  ? params.value.toLocaleString(
                    "es-MX"
                  )
                  : "",
            },
          },
        ],
      };
    }, [antiguedad]);

  return (
    <div className="inventario-page min-h-screen text-[14px] text-[#1A2344]">
      <main className="space-y-6 px-2 py-4 lg:px-4">
        {/* Filtros generales */}
        <Seccion titulo='Inventario'>
          <FiltrosInventario
            filtrosDisponibles={filtrosDisponibles}
            agenciaSeleccionada={agenciaSeleccionada}
            setAgenciaSeleccionada={setAgenciaSeleccionada}
            estatusSeleccionado={estatusSeleccionado}
            setEstatusSeleccionado={setEstatusSeleccionado}
            periodoGracia={periodoGracia}
            setPeriodoGracia={setPeriodoGracia}
            tiie={tiie}
            setTiie={setTiie}
            spreadBase={spreadBase}
            setSpreadBase={setSpreadBase}
            penetracionRetail={penetracionRetail}
            setPenetracionRetail={setPenetracionRetail}
            reglaPenetracion={reglaPenetracion}
            spreadEfectivo={spreadEfectivo}
            tasaAnual={tasaAnual}
          />

          {error && (
            <div className="rounded-xl border border-[#C8D0DF] bg-[#F7F8FC] px-4 py-3 font-semibold text-[#131E5C]">
              {error}
            </div>
          )}
        </Seccion>
        {/* Resumen */}
        <Seccion titulo="Resumen de Inventario">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KPICard
              label="Total activo"
              value={
                cargandoTabla
                  ? "…"
                  : totalGeneral.toLocaleString("es-MX")
              }
              sub="Inventario considerado"
            />

            <KPICard
              label="Costo inventario"
              value={
                cargando
                  ? "…"
                  : formatMoneda(costoTotal, 0)
              }
              sub="Suma valor de compra"
            />

            <KPICard
              label="Fuera de gracia"
              value={
                cargandoTabla
                  ? "…"
                  : unidadesFueraGracia.toLocaleString("es-MX")
              }
              sub={`Más de ${periodoGracia} días`}
            />

            <KPICard
              label="Costo financiero"
              value={
                cargandoTabla
                  ? "…"
                  : formatMoneda(costoFinancieroTotal, 0)
              }
              sub="Costo acumulado actual"
              destacado
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KPICard
              label="Agencia líder"
              value={
                cargando
                  ? "…"
                  : agenciaLider?.agenciaNombre || "—"
              }
              sub={
                agenciaLider
                  ? `${agenciaLider.total.toLocaleString("es-MX")} vehículos`
                  : ""
              }
            />

            <KPICard
              label="% Nuevos"
              value={cargando ? "…" : `${pctNuevo}%`}
              sub="Del total activo"
            />

            <KPICard
              label="Tasa aplicada"
              value={`${tasaAnual.toFixed(4)}%`}
              sub="TIIE + spread efectivo"
            />

            <KPICard
              label="Periodo de gracia"
              value={`${periodoGracia} días`}
              sub="Parámetro actual"
            />
          </div>
        </Seccion>

        {/* Financiamiento y antigüedad */}
        <Seccion
          titulo="Costo Financiero"
          subtitulo="Antigüedad del inventario y costo generado fuera del periodo de gracia"
        >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel
              titulo="Antigüedad en Stock"
              subtitulo="Días desde facturación"
              alto={300}
            >
              {optionAntiguedad ? (
                <ChartDiv
                  option={optionAntiguedad}
                  loading={cargando}
                />
              ) : (
                <EmptyState />
              )}
            </Panel>

            <Panel
              titulo="Costo financiero por agencia"
              subtitulo={`Tasa ${tasaAnual.toFixed(4)}% · Gracia ${periodoGracia} días`}
              alto={300}
            >
              {optionCostoFinancieroAgencia ? (
                <ChartDiv
                  option={optionCostoFinancieroAgencia}
                  loading={cargandoTabla}
                />
              ) : (
                <EmptyState mensaje="No existen vehículos fuera del periodo de gracia" />
              )}
            </Panel>
          </div>
        </Seccion>

        {/* Tabla */}
        <Seccion
          titulo="Detalle del Inventario"
        >
          <div ref={tablaRef}>
            <TablaVehiculos
              vehiculos={vehiculosCalculados}
              cargando={cargandoTabla}
              error={errorTabla}
              familiaFiltro={familiaFiltro}
              onClearFamilia={() => setFamiliaFiltro("")}
              periodoGracia={periodoGracia}
            />
          </div>
        </Seccion>

        {/* Distribución */}
        <Seccion
          titulo="Distribución del Inventario"
          subtitulo="Composición actual de las unidades activas"
        >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel
              titulo="Inventario por modelo"
              subtitulo={
                familiaFiltro
                  ? `Filtrando: ${familiaFiltro} · Selecciona la misma barra para quitar el filtro`
                  : "Top unidades en stock · Selecciona una barra para filtrar la tabla"
              }
              alto={500}
              extra={
                !cargando && porMarca.length > 0 ? (
                  <Badge
                    label={`${porMarca.length} modelos`}
                    color={COLORES[7]}
                  />
                ) : null
              }
            >
              {optionPorMarca ? (
                <ChartDiv
                  option={optionPorMarca}
                  loading={cargando}
                  onEvents={eventosModelo}
                />
              ) : (
                <EmptyState />
              )}
            </Panel>

            <Panel
              titulo="Inventario por agencia"
              subtitulo="Total de vehículos activos"
              alto={500}
              extra={
                !cargando && porAgencia.length > 0 ? (
                  <Badge
                    label={`${porAgencia.length} agencias`}
                    color={COLORES[7]}
                  />
                ) : null
              }
            >
              {optionPorAgencia ? (
                <ChartDiv
                  option={optionPorAgencia}
                  loading={cargando}
                />
              ) : (
                <EmptyState />
              )}
            </Panel>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Panel
              titulo="Estatus de stock"
              subtitulo="Distribución actual"
              alto={280}
            >
              {optionPorEstatus ? (
                <ChartDiv
                  option={optionPorEstatus}
                  loading={cargando}
                />
              ) : (
                <EmptyState />
              )}
            </Panel>

            <Panel
              titulo="Nuevo vs. Usado"
              subtitulo="Por agencia"
              alto={280}
            >
              {optionNuevoUsado ? (
                <ChartDiv
                  option={optionNuevoUsado}
                  loading={cargando}
                />
              ) : (
                <EmptyState />
              )}
            </Panel>

            <Panel
              titulo="Nacional vs. Importado"
              subtitulo="Tipo de nacionalización"
              alto={280}
            >
              {optionNacionalImportado ? (
                <ChartDiv
                  option={optionNacionalImportado}
                  loading={cargando}
                />
              ) : (
                <EmptyState />
              )}
            </Panel>
          </div>
        </Seccion>
      </main>
    </div>
  );
}