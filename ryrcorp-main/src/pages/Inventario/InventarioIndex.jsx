// src/pages/Inventario/InventarioIndex.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { apiInventario } from "../../lib/apiInventario";
import { useECharts } from "./useECharts";
import "./inventario.css";
import { useNavigate } from "react-router-dom";

import vwDark from "../../assets/vw_dark.png";

const NAVY = "#001E50";
const CYAN = "#00B0F0";
const SILVER = "#C8CACB";
const BRAND_BLUE = "#131E5C";

const PALETA_AGENCIAS = ["#001E50", "#00437A", "#0077B3", "#00A0D6", "#00B0F0"];
const PALETA_ESTATUS = ["#00B0F0", "#0091CC", "#007099", "#005066", "#003344", "#001E50"];
const PALETA_CONDICION = { Nuevo: "#001E50", Usado: "#00B0F0", default: "#C8CACB" };

const ESTATUS_EXCLUIDOS = ["V", "O", "C", "D", "P", "T"];

const KPI_ICONS = {
  "Total activo": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />,
  "Agencia líder": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />,
  "% Nuevos": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14.25l6-6m4.5-3.493V21.75l-4.125-2.062-4.125 2.063-4.125-2.063L3 21.75V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />,
  "Costo inventario": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

function KPICard({ label, value, sub, color = NAVY }) {
  return (
    <div className="kpi-card bg-white flex flex-col gap-1 px-5 py-4"
      style={{ borderRadius: "4px", border: "1px solid #e2e8f0" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          style={{ color, opacity: 0.7, flexShrink: 0 }}>
          {KPI_ICONS[label]}
        </svg>
      </div>
      <span className="text-3xl font-bold" style={{ color }}>{value}</span>
      {sub && <span className="text-xs text-slate-400 mt-0.5">{sub}</span>}
    </div>
  );
}

function Panel({ titulo, subtitulo, children, alto, extra }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{titulo}</h3>
          {subtitulo && <p className="text-xs text-slate-400 mt-0.5">{subtitulo}</p>}
        </div>
        {extra}
      </div>
      <div style={alto ? { height: alto } : {}}>{children}</div>
    </div>
  );
}

function ChartDiv({ option, loading, onEvents }) {
  const ref = useECharts(option, { loading, onEvents });
  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}

function EmptyState({ mensaje = "Sin datos para los filtros seleccionados" }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M3 17v-2a4 4 0 014-4h0M12 7a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
      <span className="text-sm">{mensaje}</span>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: color + "18", color }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
      {label}
    </span>
  );
}

function TablaVehiculos({ vehiculos, cargando, error, familiaFiltro, onClearFamilia }) {
  const [query, setQuery] = useState("");
  const [pagina, setPagina] = useState(1);
  const [filtAgencia, setFiltAgencia] = useState("");
  const [filtEstatus, setFiltEstatus] = useState("");
  const [filtCondicion, setFiltCondicion] = useState("");
  const [filtFamilia, setFiltFamilia] = useState("");
  const [filtDiasMin, setFiltDiasMin] = useState("");
  const [filtDiasMax, setFiltDiasMax] = useState("");
  const POR_PAGINA = 12;
  // Opciones dinámicas desde los datos
  const agencias = useMemo(() => [...new Set(vehiculos.map((v) => v.agenciaNombre).filter(Boolean))].sort(), [vehiculos]);
  const estatuses = useMemo(() => [...new Set(vehiculos.map((v) => v.estatusNombre).filter(Boolean))].sort(), [vehiculos]);
  const familias = useMemo(() => [...new Set(vehiculos.map((v) => v.NmFamilia).filter(Boolean))].sort(), [vehiculos]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehiculos.filter((v) => {
      if (familiaFiltro && (v.NmFamilia || "").toLowerCase() !== familiaFiltro.toLowerCase()) return false;
      if (filtAgencia && v.agenciaNombre !== filtAgencia) return false;
      if (filtEstatus && v.estatusNombre !== filtEstatus) return false;

      if (filtCondicion) {
        const cond = ({ N: "Nuevo", U: "Usado" })[(v.CondUso || "").trim()];
        if (cond !== filtCondicion) return false;
      }

      if (filtFamilia && (v.NmFamilia || "") !== filtFamilia) return false;
      if (filtDiasMin !== "" && (v.diasEnStock ?? 0) < Number(filtDiasMin)) return false;
      if (filtDiasMax !== "" && (v.diasEnStock ?? 0) > Number(filtDiasMax)) return false;

      if (q) {
        return [
          v.NmFamilia,
          v.NmMarca,
          v.EdiModelo,
          v.agenciaNombre,
          v.estatusNombre,
          v.SitVeiculo,
          v.NrChassi
        ].some((c) => (c || "").toLowerCase().includes(q));
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
    filtDiasMax
  ]);

  useEffect(() => { setPagina(1); }, [query, vehiculos, filtAgencia, filtEstatus, filtCondicion, filtFamilia, filtDiasMin, filtDiasMax]);

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA); const condLabel = (c) => ({ N: "Nuevo", U: "Usado" })[(c || "").trim()] ?? (c || "—");
  const totalCosto = filtrados.reduce((acc, v) => acc + (v.VrNF_Compra || 0), 0);

  const hayFiltros = filtAgencia || filtEstatus || filtCondicion || filtFamilia || filtDiasMin || filtDiasMax;

  const limpiarFiltros = () => {
    setFiltAgencia("");
    setFiltEstatus("");
    setFiltCondicion("");
    setFiltFamilia("");
    setFiltDiasMin("");
    setFiltDiasMax("");
    setQuery("");
  };

  const selectCls = "text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40";

  return (
    <div>
      {/* Barra de búsqueda */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por VIN, modelo, agencia…"
          className="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-200 rounded-lg
                     text-slate-700 bg-slate-50 focus:outline-none focus:ring-2
                     focus:ring-cyan-400/40 focus:bg-white" />
        {query && (
          <button onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
        <select value={filtAgencia} onChange={(e) => setFiltAgencia(e.target.value)} className={selectCls}>
          <option value="">Todas las agencias</option>
          {agencias.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>



        <select value={filtEstatus} onChange={(e) => setFiltEstatus(e.target.value)} className={selectCls}>
          <option value="">Todos los estatus</option>
          {estatuses.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>



        <select value={filtCondicion} onChange={(e) => setFiltCondicion(e.target.value)} className={selectCls}>
          <option value="">Nuevo y Usado</option>
          <option value="Nuevo">Nuevo</option>
          <option value="Usado">Usado</option>
        </select>

        <select value={filtFamilia} onChange={(e) => setFiltFamilia(e.target.value)} className={selectCls}>
          <option value="">Todas las familias</option>
          {familias.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        <div className="flex items-center gap-1">
          <input type="number" value={filtDiasMin} onChange={(e) => setFiltDiasMin(e.target.value)}
            placeholder="Días min" min={0}
            className={`${selectCls} w-24`} />
          <span className="text-xs text-slate-400">—</span>
          <input type="number" value={filtDiasMax} onChange={(e) => setFiltDiasMax(e.target.value)}
            placeholder="Días max" min={0}
            className={`${selectCls} w-24`} />
        </div>

        {hayFiltros && (
          <button onClick={limpiarFiltros}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{ background: "#001E5012", color: "#001E50" }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Badge familia filtro desde gráfica */}
      {familiaFiltro && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-500">Filtrando por modelo:</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: CYAN + "18", color: CYAN }}>
            {familiaFiltro}
            <button onClick={onClearFamilia} className="hover:opacity-70">
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
      )}

      {!cargando && !error && (
        <p className="text-xs text-slate-400 mb-2">
          {filtrados.length.toLocaleString("es-MX")} vehículo{filtrados.length !== 1 ? "s" : ""}
          {query && ` · "${query}"`}
        </p>
      )}

      {error && <p className="text-sm text-red-500 text-center py-6">{error}</p>}
      {cargando && (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-sm">
          <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Cargando…
        </div>
      )}
      {!cargando && !error && filtrados.length === 0 && (
        <p className="text-center text-xs text-slate-400 py-8">Sin resultados.</p>
      )}

      {!cargando && !error && paginados.length > 0 && (
        <>
          <div className="overflow-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-left border-b border-slate-100">
                  {["VIN", "Familia", "Modelo", "Agencia", "Condición", "Estatus", "F. Compra", "Días", "Valor Compra", "Situación"].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginados.map((v, i) => (
                  <tr key={`${v.NrChassi}-${i}`}
                    className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                    <td className="px-3 py-2 font-mono whitespace-nowrap">
                      <span className="cursor-pointer hover:underline font-semibold"
                        style={{ color: NAVY, fontSize: "11px", letterSpacing: "0.03em" }}>
                        {v.NrChassi || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{v.NmFamilia || "—"}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{v.EdiModelo || "—"}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{v.agenciaNombre}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{condLabel(v.CondUso)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-sm text-xs font-semibold"
                        style={{ background: "#001E5012", color: "#001E50" }}>
                        {v.estatusNombre}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{v.DtFaturamento || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {v.diasEnStock != null ? (
                        <span className={`font-medium px-2 py-0.5 rounded-full ${v.diasEnStock > 120 ? "bg-red-50 text-red-500"
                          : v.diasEnStock > 60 ? "bg-amber-50 text-amber-600"
                            : "bg-emerald-50 text-emerald-600"
                          }`}>
                          {v.diasEnStock}d
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {v.VrNF_Compra != null
                        ? `$${Number(v.VrNF_Compra).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{v.SitVeiculo || "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td colSpan={8} className="px-3 py-2.5 font-semibold text-slate-700 text-xs">
                    Total ({filtrados.length.toLocaleString("es-MX")} vehículos)
                  </td>
                  <td className="px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap text-xs">
                    ${totalCosto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">Página {pagina} de {totalPaginas}</span>
              <div className="flex gap-1">
                <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600
                             disabled:opacity-40 hover:bg-slate-50 transition-colors">
                  ← Anterior
                </button>
                <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600
                             disabled:opacity-40 hover:bg-slate-50 transition-colors">
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
// ── Página principal ───────────────────────────────────────────────────────────

export default function InventarioIndex() {
  const [filtrosDisponibles, setFiltrosDisponibles] = useState({ agencias: [], estatus: [] });
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState("");
  const [estatusSeleccionado, setEstatusSeleccionado] = useState("");
  const [familiaFiltro, setFamiliaFiltro] = useState("");
  const tablaRef = useRef(null);

  const [vehiculos, setVehiculos] = useState([]);
  const [porAgencia, setPorAgencia] = useState([]);
  const [porEstatus, setPorEstatus] = useState([]);
  const [porMarca, setPorMarca] = useState([]);
  const [nuevoUsado, setNuevoUsado] = useState([]);
  const [nacionalImportado, setNacionalImportado] = useState([]);
  const [costoTotal, setCostoTotal] = useState(0);
  const [antiguedad, setAntiguedad] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [cargandoTabla, setCargandoTabla] = useState(true);
  const [error, setError] = useState("");
  const [errorTabla, setErrorTabla] = useState("");

  useEffect(() => {
    apiInventario.getFiltros()
      .then(setFiltrosDisponibles)
      .catch(() => setFiltrosDisponibles({ agencias: [], estatus: [] }));
  }, []);

  useEffect(() => {
    const params = {
      agencia: agenciaSeleccionada || undefined,
      estatus: estatusSeleccionado || undefined,
    };

    setCargando(true);
    setError("");
    Promise.all([
      apiInventario.getPorAgencia(params),
      apiInventario.getPorEstatus(params),
      apiInventario.getPorMarca(params),
      apiInventario.getNuevoUsado(params),
      apiInventario.getNacionalImportado(params),
      apiInventario.getCosto(params),
      apiInventario.getAntiguedad(params),
    ])
      .then(([agencia, estatus, marca, nu, ni, costo, antig]) => {
        setPorAgencia(agencia);
        setPorEstatus(estatus.filter((e) => !ESTATUS_EXCLUIDOS.includes(e.estatus)));
        setPorMarca(marca.slice(0, 13));
        setNuevoUsado(nu.filter((d) => d.condicion === "Nuevo" || d.condicion === "Usado"));
        setNacionalImportado(ni);
        setCostoTotal(costo);
        setAntiguedad(antig);
      })
      .catch(() => setError("No se pudo cargar el inventario."))
      .finally(() => setCargando(false));

    setCargandoTabla(true);
    setErrorTabla("");
    apiInventario.getInventario(params)
      .then((data) => setVehiculos(
        data.filter((v) => !ESTATUS_EXCLUIDOS.includes((v.StEstoque || "").trim()))
      ))
      .catch(() => setErrorTabla("No se pudo cargar el listado."))
      .finally(() => setCargandoTabla(false));

  }, [agenciaSeleccionada, estatusSeleccionado]);

  const totalGeneral = useMemo(
    () => porEstatus.reduce((acc, e) => acc + e.total, 0),
    [porEstatus]
  );

  const agenciaLider = useMemo(() => {
    if (!porAgencia.length) return null;
    return [...porAgencia].sort((a, b) => b.total - a.total)[0];
  }, [porAgencia]);

  const pctNuevo = useMemo(() => {
    const total = nuevoUsado.reduce((a, d) => a + d.total, 0);
    const nuevos = nuevoUsado.filter((d) => d.condicion === "Nuevo").reduce((a, d) => a + d.total, 0);
    return total > 0 ? Math.round((nuevos / total) * 100) : 0;
  }, [nuevoUsado]);

  const estatusDisponibles = useMemo(
    () => filtrosDisponibles.estatus.filter((e) => !ESTATUS_EXCLUIDOS.includes(e.codigo)),
    [filtrosDisponibles.estatus]
  );

  const eventosModelo = useMemo(() => ({
    click: (params) => {
      setFamiliaFiltro((prev) =>
        prev.toLowerCase() === params.name.toLowerCase() ? "" : params.name
      );
      setTimeout(() => {
        tablaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    },
  }), [tablaRef]);

  const optionPorAgencia = useMemo(() => {
    if (!porAgencia.length) return null;
    const sorted = [...porAgencia].sort((a, b) => b.total - a.total);
    return {
      tooltip: {
        trigger: "axis", axisPointer: { type: "none" },
        backgroundColor: "#fff", borderColor: "#e2e8f0", borderWidth: 1,
        textStyle: { color: "#334155", fontSize: 12 },
        formatter: (params) => {
          const p = params[0];
          const pct = totalGeneral > 0 ? ((p.value / totalGeneral) * 100).toFixed(1) : 0;
          return `<b>${p.name}</b><br/>Vehículos: <b>${p.value.toLocaleString("es-MX")}</b><br/>${pct}% del total`;
        },
      },
      grid: { left: 8, right: 16, top: 20, bottom: 8, containLabel: true },
      xAxis: {
        type: "category", data: sorted.map((d) => d.agenciaNombre),
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: "#64748b", fontSize: 11, fontWeight: 500 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
        axisLabel: { color: "#94a3b8", fontSize: 10, formatter: (v) => v.toLocaleString("es-MX") },
      },
      series: [{
        name: "Vehículos", type: "bar",
        data: sorted.map((d, i) => ({
          value: d.total,
          itemStyle: {
            color: {
              type: "linear", x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: i === 0 ? CYAN : PALETA_AGENCIAS[i] || "#3b82f6" },
                { offset: 1, color: i === 0 ? "#0891B2" : NAVY },
              ],
            },
            borderRadius: [8, 8, 0, 0],
          },
        })),
        barWidth: "45%",
        label: {
          show: true, position: "top", color: "#475569", fontSize: 11, fontWeight: 600,
          formatter: (p) => p.value.toLocaleString("es-MX")
        },
      }],
    };
  }, [porAgencia, totalGeneral]);

  const navigate = useNavigate();

  const optionPorEstatus = useMemo(() => {
    if (!porEstatus.length) return null;
    return {
      tooltip: {
        trigger: "item", backgroundColor: "#fff", borderColor: "#e2e8f0", borderWidth: 1,
        textStyle: { color: "#334155", fontSize: 12 },
        formatter: (p) => `<b>${p.name}</b><br/>${p.value.toLocaleString("es-MX")} vehículos<br/><b>${p.percent}%</b>`
      },
      legend: { bottom: 0, textStyle: { color: "#64748b", fontSize: 11 }, icon: "circle", itemWidth: 8, itemHeight: 8, itemGap: 12 },
      color: PALETA_ESTATUS,
      series: [{
        name: "Estatus", type: "pie", radius: ["50%", "75%"], center: ["50%", "42%"],
        itemStyle: { borderColor: "#fff", borderWidth: 3 },
        label: { show: true, color: "#334155", fontSize: 11, formatter: "{b}\n{d}%" },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.1)" }, scaleSize: 5 },
        data: porEstatus.map((d) => ({ name: d.estatusNombre, value: d.total })),
      }],
    };
  }, [porEstatus]);

  const optionPorMarca = useMemo(() => {
    if (!porMarca.length) return null;
    const datos = [...porMarca].reverse();
    const max = datos[datos.length - 1]?.total || 1;
    return {
      tooltip: {
        trigger: "axis", axisPointer: { type: "none" },
        backgroundColor: "#fff", borderColor: "#e2e8f0", borderWidth: 1,
        textStyle: { color: "#334155", fontSize: 12 },
        formatter: (params) => `<b>${params[0].name}</b><br/>Vehículos: <b>${params[0].value.toLocaleString("es-MX")}</b>`
      },
      grid: { left: 8, right: 80, top: 12, bottom: 12, containLabel: true },
      xAxis: {
        type: "value", splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
        axisLabel: { color: "#94a3b8", fontSize: 10 }
      },
      yAxis: {
        type: "category", data: datos.map((d) => d.familia),
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: "#475569", fontSize: 11, fontWeight: 500 }
      },
      series: [{
        name: "Vehículos", type: "bar",
        data: datos.map((d) => {
          const isActive = familiaFiltro && d.familia.toLowerCase() === familiaFiltro.toLowerCase();
          const isInactive = familiaFiltro && !isActive;
          return {
            value: d.total,
            itemStyle: {
              color: isInactive
                ? "#cbd5e1"
                : {
                  type: "linear", x: 0, y: 0, x2: 1, y2: 0,
                  colorStops: [
                    { offset: 0, color: NAVY },
                    { offset: 1, color: (d.total === max || isActive) ? CYAN : "#2563eb" },
                  ],
                },
              borderRadius: [0, 6, 6, 0],
              opacity: isInactive ? 0.4 : 1,
            },
          };
        }),
        barWidth: "60%",
        label: {
          show: true, position: "right", color: "#475569", fontSize: 11, fontWeight: 600,
          formatter: (p) => p.value.toLocaleString("es-MX")
        },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: "rgba(6,182,212,0.3)" } },
        cursor: "pointer",
      }],
    };
  }, [porMarca, familiaFiltro]);

  const optionNuevoUsado = useMemo(() => {
    if (!nuevoUsado.length) return null;
    const agencias = [...new Set(nuevoUsado.map((d) => d.agenciaNombre))];
    const condiciones = ["Nuevo", "Usado"];
    const series = condiciones.map((cond) => ({
      name: cond, type: "bar", stack: "total",
      data: agencias.map((ag) => {
        const fila = nuevoUsado.find((d) => d.agenciaNombre === ag && d.condicion === cond);
        return fila ? fila.total : 0;
      }),
      itemStyle: {
        color: PALETA_CONDICION[cond] || PALETA_CONDICION.default,
        borderRadius: cond === "Usado" ? [6, 6, 0, 0] : [0, 0, 0, 0]
      },
      barWidth: "45%",
      label: {
        show: true, color: "#fff", fontSize: 10, fontWeight: 600,
        formatter: (p) => p.value > 0 ? p.value.toLocaleString("es-MX") : ""
      },
    }));
    return {
      tooltip: {
        trigger: "axis", axisPointer: { type: "none" },
        backgroundColor: "#fff", borderColor: "#e2e8f0", borderWidth: 1,
        textStyle: { color: "#334155", fontSize: 12 }
      },
      legend: { top: 0, textStyle: { color: "#64748b", fontSize: 11 }, icon: "circle", itemWidth: 8, itemHeight: 8 },
      grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
      xAxis: {
        type: "category", data: agencias, axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: "#64748b", fontSize: 11 }
      },
      yAxis: {
        type: "value", splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
        axisLabel: { color: "#94a3b8", fontSize: 10, formatter: (v) => v.toLocaleString("es-MX") }
      },
      series,
    };
  }, [nuevoUsado]);

  const optionNacionalImportado = useMemo(() => {
    if (!nacionalImportado.length) return null;
    return {
      tooltip: {
        trigger: "item", backgroundColor: "#fff", borderColor: "#e2e8f0", borderWidth: 1,
        textStyle: { color: "#334155", fontSize: 12 },
        formatter: (p) => `<b>${p.name}</b><br/>${p.value.toLocaleString("es-MX")} vehículos<br/><b>${p.percent}%</b>`
      },
      legend: { bottom: 0, textStyle: { color: "#64748b", fontSize: 11 }, icon: "circle", itemWidth: 8, itemHeight: 8 },
      color: [NAVY, CYAN],
      series: [{
        name: "Origen", type: "pie", radius: ["45%", "70%"], center: ["50%", "42%"],
        itemStyle: { borderColor: "#fff", borderWidth: 3 },
        label: { show: true, color: "#334155", fontSize: 11, formatter: "{b}\n{d}%" },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.1)" }, scaleSize: 5 },
        data: nacionalImportado.map((d) => ({ name: d.tipoNombre, value: d.total })),
      }],
    };
  }, [nacionalImportado]);

  const optionAntiguedad = useMemo(() => {
    if (!antiguedad.length) return null;
    const orden = ["+120", "91-120", "61-90", "31-60", "0-30"];
    const datos = orden.map((r) => antiguedad.find((d) => d.rango === r) ?? { rango: r, total: 0 });
    const max = Math.max(...datos.map((d) => d.total));
    return {
      tooltip: {
        trigger: "axis", axisPointer: { type: "none" },
        backgroundColor: "#fff", borderColor: "#e2e8f0", borderWidth: 1,
        textStyle: { color: "#334155", fontSize: 12 },
        formatter: (params) =>
          `<b>${params[0].name} días</b><br/>Vehículos: <b>${params[0].value.toLocaleString("es-MX")}</b>`,
      },
      grid: { left: 8, right: 60, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
        axisLabel: { color: "#94a3b8", fontSize: 10 }
      },
      yAxis: {
        type: "category", data: datos.map((d) => d.rango),
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: "#475569", fontSize: 12, fontWeight: 600 }
      },
      series: [{
        name: "Vehículos", type: "bar",
        data: datos.map((d) => ({
          value: d.total,
          itemStyle: {
            color: {
              type: "linear", x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: NAVY },
                { offset: 1, color: d.total === max ? CYAN : "#2563eb" },
              ],
            },
            borderRadius: [0, 6, 6, 0],
          },
        })),
        barWidth: "55%",
        label: {
          show: true, position: "right", color: "#475569", fontSize: 12, fontWeight: 600,
          formatter: (p) => p.value > 0 ? p.value.toLocaleString("es-MX") : ""
        },
      }],
    };
  }, [antiguedad]);

  return (
    <div className="p-6 space-y-4 min-h-screen" style={{ background: "#F4F4F4" }}>

      {/* ── ENCABEZADO estilo PostVenta ── */}
      <header
        className="sticky top-0 z-40 w-full border-b bg-white -mx-6 -mt-6 px-6"
        style={{ borderColor: `${BRAND_BLUE}22` }}
      >
        <div className="flex min-h-[76px] items-center gap-4">
          {/* Logo VW */}
          <img
            src={vwDark}
            alt="Volkswagen"
            className="h-16 w-16 object-contain md:h-20 md:w-20 shrink-0"
            loading="lazy"
          />

          {/* Título */}
          <div
            className="text-[24px] font-extrabold tracking-[-0.04em] md:text-[30px] shrink-0"
            style={{ color: BRAND_BLUE }}
          >
            Inventario
          </div>

          {/* Línea azul */}
          <div
            className="hidden h-[2px] min-w-[60px] flex-1 rounded-full lg:block"
            style={{ background: BRAND_BLUE }}
          />

          {/* Filtros a la derecha */}
          <div className="ml-auto flex flex-wrap gap-2 py-2">
            <select
              value={agenciaSeleccionada}
              onChange={(e) => setAgenciaSeleccionada(e.target.value)}
              className="text-sm rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 border"
              style={{ borderColor: `${BRAND_BLUE}44`, color: BRAND_BLUE }}
            >
              <option value="">Todas las agencias</option>
              {filtrosDisponibles.agencias.map((a) => (
                <option key={a.codigo} value={a.codigo}>{a.nombre}</option>
              ))}
            </select>

            <button
              onClick={() => navigate("/inventario/bitacora_mantenimiento")}
              className="text-sm rounded-lg px-4 py-2 font-semibold border transition hover:brightness-110"
              style={{ background: BRAND_BLUE, borderColor: BRAND_BLUE, color: "#fff" }}
            >
              Bitácoras
            </button>

            <select
              value={estatusSeleccionado}
              onChange={(e) => setEstatusSeleccionado(e.target.value)}
              className="text-sm rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 border"
              style={{ borderColor: `${BRAND_BLUE}44`, color: BRAND_BLUE }}
            >
              <option value="">Todos los estatus</option>
              {filtrosDisponibles.estatus
                .filter((e) => !ESTATUS_EXCLUIDOS.includes(e.codigo))
                .map((e) => (
                  <option key={e.codigo} value={e.codigo}>{e.nombre}</option>
                ))}
            </select>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── FILA 1: KPIs + Antigüedad ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="grid grid-cols-2 gap-4 content-start">
          <KPICard label="Total activo" value={cargando ? "…" : totalGeneral.toLocaleString("es-MX")} sub="Sin vendidos ni consignación" color={NAVY} />
          <KPICard label="Agencia líder" value={cargando ? "…" : (agenciaLider?.agenciaNombre || "—")} sub={agenciaLider ? `${agenciaLider.total.toLocaleString("es-MX")} vehículos` : ""} color={CYAN} />
          <KPICard label="% Nuevos" value={cargando ? "…" : `${pctNuevo}%`} sub="Del total activo" color="#00437A" />
          <KPICard label="Costo inventario" value={cargando ? "…" : `$${costoTotal.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`} sub="Suma valor de compra" color={NAVY} />
        </div>
        <div className="lg:col-span-2">
          <Panel titulo="Antigüedad en Stock" subtitulo="Días desde facturación (activos)" alto={260}>
            {optionAntiguedad ? <ChartDiv option={optionAntiguedad} loading={cargando} /> : <EmptyState />}
          </Panel>
        </div>
      </div>

      {/* ── FILA 2: Tabla ── */}
      <div ref={tablaRef}>
        <Panel titulo="Listado de vehículos" subtitulo="Detalle por unidad (activos)">
          <TablaVehiculos vehiculos={vehiculos} cargando={cargandoTabla} error={errorTabla} familiaFiltro={familiaFiltro} onClearFamilia={() => setFamiliaFiltro("")} />
        </Panel>
      </div>

      {/* ── FILA 2.5: Top Modelos ── */}
      <Panel
        titulo="Inventario por modelo"
        subtitulo={familiaFiltro ? `Filtrando: ${familiaFiltro} · Click en otra barra para cambiar, o click en la misma para quitar filtro` : "Top unidades en stock · Click en una barra para filtrar la tabla"}
        alto={520}
        extra={!cargando && porMarca.length > 0 ? <Badge label={`${porMarca.length} modelos`} color={CYAN} /> : null}
      >
        {optionPorMarca ? <ChartDiv option={optionPorMarca} loading={cargando} onEvents={eventosModelo} /> : <EmptyState />}
      </Panel>

      {/* ── FILA 3: Por agencia ── */}
      <Panel titulo="Inventario por agencia" subtitulo="Total de vehículos activos" alto={300}
        extra={!cargando && porAgencia.length > 0 ? <Badge label={`${porAgencia.length} agencias`} color={CYAN} /> : null}>
        {optionPorAgencia ? <ChartDiv option={optionPorAgencia} loading={cargando} /> : <EmptyState />}
      </Panel>

      {/* ── FILA 4: Estatus · Nuevo/Usado · Nacional/Importado ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel titulo="Estatus de stock" subtitulo="Distribución actual" alto={280}>
          {optionPorEstatus ? <ChartDiv option={optionPorEstatus} loading={cargando} /> : <EmptyState />}
        </Panel>
        <Panel titulo="Nuevo vs. Usado" subtitulo="Por agencia" alto={280}>
          {optionNuevoUsado ? <ChartDiv option={optionNuevoUsado} loading={cargando} /> : <EmptyState />}
        </Panel>
        <Panel titulo="Nacional vs. Importado" subtitulo="Tipo de nacionalización" alto={280}>
          {optionNacionalImportado ? <ChartDiv option={optionNacionalImportado} loading={cargando} /> : <EmptyState />}
        </Panel>
      </div>

    </div>
  );
}
