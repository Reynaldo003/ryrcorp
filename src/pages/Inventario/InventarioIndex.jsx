// src/pages/Inventario/InventarioIndex.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  BarChart3, Building2, Car, ChevronDown, ChevronUp, Clock, Eraser,
  FileSpreadsheet, FileText, Layers, LoaderCircle, RefreshCw, Search,
  Table2, TrendingUp, X,
} from "lucide-react";
import { apiInventario } from "../../lib/apiInventario";
import { getVentasVNDashboard, getVentasVNDetalle } from "../../lib/apiVentasVN";
import "./inventario.css";

const COLORES = [
  "#001E50",
  "#10205A",
  "#142D76",
  "#1677FF",
  "#1C49AC",
  "#2058C6",
  "#2868D5",
  "#3479E0",
  "#438BE8",
];

const ESTATUS_EXCLUIDOS = ["V", "O", "C", "D", "P", "T"];

const MODELOS_COMERCIALES = [
  "E-CRAFTER",
  "CRAFTER",
  "AMAROK",
  "TRANSPORTER",
  "CADDY",
];

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

const formatYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function obtenerAgenciaVentas(nombreAgenciaInv, esComercial) {
  if (esComercial) return "R&R VC";
  if (!nombreAgenciaInv) return "";

  const n = normalizarTexto(nombreAgenciaInv);
  if (n.includes("CORDOBA")) return "VW Córdoba";
  if (n.includes("ORIZABA")) return "VW Orizaba";
  if (n.includes("POZA RICA")) return "VW Poza Rica";
  if (n.includes("TUXPAN")) return "VW Tuxpan";
  if (n.includes("TUXTEPEC")) return "VW Tuxtepec";

  return nombreAgenciaInv;
}

function procesarRespuestaVentas(rawResponse) {
  if (!rawResponse) return { lista: [], resumen: null };

  if (Array.isArray(rawResponse)) {
    return { lista: rawResponse, resumen: null };
  }

  if (typeof rawResponse === "object") {
    const pos =
      rawResponse.data ||
      rawResponse.ventas ||
      rawResponse.detalle ||
      rawResponse.items ||
      rawResponse.resultados ||
      rawResponse.registros ||
      rawResponse.rows ||
      rawResponse.results ||
      rawResponse.vehiculos ||
      rawResponse.ventas_detalle ||
      rawResponse.lista;

    if (Array.isArray(pos)) {
      return { lista: pos, resumen: rawResponse };
    }

    return { lista: [], resumen: rawResponse };
  }

  return { lista: [], resumen: null };
}

function numeroSeguro(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function formatMoneda(valor, decimales = 0) {
  return `$${numeroSeguro(valor).toLocaleString("es-MX", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })}`;
}

function obtenerReglaPenetracion(penetracion) {
  const valor = Math.max(0, Math.min(100, numeroSeguro(penetracion)));

  if (valor < 38) {
    return { rango: "< 38%", bono: 0, descuentoWholesale: 0 };
  }
  if (valor < 42) {
    return { rango: "38% a < 42%", bono: 0.5, descuentoWholesale: 0 };
  }
  if (valor < 48) {
    return { rango: "42% a < 48%", bono: 1, descuentoWholesale: -1.5 };
  }
  if (valor < 53) {
    return { rango: "48% a < 53%", bono: 2.25, descuentoWholesale: -2 };
  }
  return { rango: ">= 53%", bono: 3.5, descuentoWholesale: -2.5 };
}

function calcularFinanciamientoVehiculo(vehiculo, periodoGracia, tasaAnual) {
  const valorCompra = Number(vehiculo.VrNF_Compra);
  const tieneValorValid = Number.isFinite(valorCompra) && valorCompra > 0;

  const costoFinancieroDiario = tieneValorValid ? (valorCompra * (tasaAnual / 100)) / 360 : 0;

  const antiguedad = vehiculo.diasEnStock === null || vehiculo.diasEnStock === undefined
    ? null
    : numeroSeguro(vehiculo.diasEnStock);

  const diasFuera = (antiguedad !== null && antiguedad > periodoGracia)
    ? antiguedad - periodoGracia
    : null;

  const costoFinancieroTotal = (diasFuera !== null && tieneValorValid)
    ? costoFinancieroDiario * diasFuera
    : 0;

  return {
    ...vehiculo,
    diasFueraGracia: diasFuera,
    costoFinancieroDiario,
    costoFinancieroTotal,
  };
}

function obtenerColorAntiguedad(dias, periodoGracia) {
  if (dias <= periodoGracia) return COLORES[3];
  if (dias <= periodoGracia + 30) return "#d97706";
  if (dias <= periodoGracia + 60) return "#ea580c";
  return "#dc2626";
}

function TablaVehiculos({ vehiculos, cargando, error, familiaFiltro, onClearFamilia, periodoGracia }) {
  const [query, setQuery] = useState("");
  const [pagina, setPagina] = useState(1);
  const [filtAgencia, setFiltAgencia] = useState("");
  const [filtEstatus, setFiltEstatus] = useState("");
  const [filtCondicion, setFiltCondicion] = useState("");
  const [filtFamilia, setFiltFamilia] = useState("");
  const [filtDiasMin, setFiltDiasMin] = useState("");
  const [filtDiasMax, setFiltDiasMax] = useState("");

  const POR_PAGINA = 12;

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
        const condicion = { N: "Nuevo", U: "Usado" }[(v.CondUso || "").trim()];
        if (condicion !== filtCondicion) return false;
      }
      if (filtFamilia && (v.NmFamilia || "") !== filtFamilia) return false;
      if (filtDiasMin !== "" && (v.diasEnStock ?? 0) < Number(filtDiasMin)) return false;
      if (filtDiasMax !== "" && (v.diasEnStock ?? 0) > Number(filtDiasMax)) return false;
      if (q) {
        return [v.NmFamilia, v.NmMarca, v.EdiModelo, v.agenciaNombre, v.estatusNombre, v.SitVeiculo, v.NrChassi]
          .some((campo) => (campo || "").toLowerCase().includes(q));
      }
      return true;
    });
  }, [vehiculos, query, familiaFiltro, filtAgencia, filtEstatus, filtCondicion, filtFamilia, filtDiasMin, filtDiasMax]);

  useEffect(() => { setPagina(1); }, [query, vehiculos, filtAgencia, filtEstatus, filtCondicion, filtFamilia, filtDiasMin, filtDiasMax]);

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const condLabel = (condicion) => ({ N: "Nuevo", U: "Usado" }[(condicion || "").trim()] ?? condicion ?? "—");

  const totalCosto = filtrados.reduce((total, vehiculo) => total + numeroSeguro(vehiculo.VrNF_Compra), 0);
  const totalCostoDiario = filtrados.reduce((total, vehiculo) => total + numeroSeguro(vehiculo.costoFinancieroDiario), 0);
  const totalCostoFinanciero = filtrados.reduce((total, vehiculo) => total + numeroSeguro(vehiculo.costoFinancieroTotal), 0);

  const hayFiltros = filtAgencia || filtEstatus || filtCondicion || filtFamilia || filtDiasMin || filtDiasMax;

  const limpiarFiltros = () => {
    setFiltAgencia(""); setFiltEstatus(""); setFiltCondicion(""); setFiltFamilia(""); setFiltDiasMin(""); setFiltDiasMax(""); setQuery("");
  };

  const selectCls = "h-8 border border-slate-200 rounded-lg px-2 text-xs bg-white text-[#001E50] outline-none focus:border-[#1677FF]";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por VIN, modelo, agencia…"
            className="h-8 w-full pl-8 pr-8 text-xs border border-slate-200 rounded-lg bg-white text-[#001E50] outline-none focus:border-[#1677FF]"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={filtAgencia} onChange={(e) => setFiltAgencia(e.target.value)} className={selectCls}>
            <option value="">Todas las agencias</option>
            {agencias.map((a) => (<option key={a} value={a}>{a}</option>))}
          </select>

          <select value={filtEstatus} onChange={(e) => setFiltEstatus(e.target.value)} className={selectCls}>
            <option value="">Todos los estatus</option>
            {estatuses.map((e) => (<option key={e} value={e}>{e}</option>))}
          </select>

          <select value={filtCondicion} onChange={(e) => setFiltCondicion(e.target.value)} className={selectCls}>
            <option value="">Nuevo / Usado</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Usado">Usado</option>
          </select>

          <select value={filtFamilia} onChange={(e) => setFiltFamilia(e.target.value)} className={selectCls}>
            <option value="">Todas las familias</option>
            {familias.map((f) => (<option key={f} value={f}>{f}</option>))}
          </select>

          <div className="flex items-center gap-1">
            <input type="number" value={filtDiasMin} onChange={(e) => setFiltDiasMin(e.target.value)} placeholder="Días min" min={0} className={`${selectCls} w-20`} />
            <span className="text-xs text-slate-400">—</span>
            <input type="number" value={filtDiasMax} onChange={(e) => setFiltDiasMax(e.target.value)} placeholder="Días max" min={0} className={`${selectCls} w-20`} />
          </div>

          {hayFiltros && (
            <button onClick={limpiarFiltros} className="h-8 inline-flex items-center gap-1 text-xs px-2.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100">
              <Eraser className="h-3 w-3" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {familiaFiltro && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filtrando por modelo:</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#1677FF]/10 text-[#1677FF]">
            {familiaFiltro}
            <button onClick={onClearFamilia} className="hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {!cargando && !error && (
        <p className="text-xs text-slate-500 font-semibold">
          {filtrados.length.toLocaleString("es-MX")} vehículo{filtrados.length !== 1 ? "s" : ""} encontrado{filtrados.length !== 1 ? "s" : ""}
        </p>
      )}

      {error && <p className="text-xs text-center py-6 text-red-500 font-bold">{error}</p>}

      {cargando && (
        <div className="flex items-center justify-center py-12 gap-2 text-xs font-bold text-[#001E50]">
          <LoaderCircle className="h-4 w-4 animate-spin text-[#1677FF]" /> Cargando inventario…
        </div>
      )}

      {!cargando && !error && filtrados.length === 0 && (
        <p className="text-center text-xs py-10 text-slate-400">Sin vehículos para los filtros seleccionados.</p>
      )}

      {!cargando && !error && paginados.length > 0 && (
        <>
          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left bg-slate-100 border-b border-slate-200 text-[#001E50]">
                  {["VIN / Chasis", "Familia", "Modelo", "Agencia", "Condición", "Estatus", "F. Factura", "Antigüedad", "Fuera Gracia", "Valor Compra", "Costo Diario", "Costo Financiero Total", "Situación"].map((header) => (
                    <th key={header} className="px-3 py-2.5 font-extrabold whitespace-nowrap">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginados.map((vehiculo, index) => {
                  const colorAntiguedad = obtenerColorAntiguedad(vehiculo.diasEnStock ?? 0, periodoGracia);
                  return (
                    <tr key={`${vehiculo.NrChassi}-${index}`} className="hover:bg-slate-50/80 transition">
                      <td className="px-3 py-2 font-mono font-bold text-[#001E50] text-[11px] whitespace-nowrap">
                        {vehiculo.NrChassi || "—"}
                      </td>
                      <td className="px-3 py-2 font-semibold text-[#001E50] whitespace-nowrap">{vehiculo.NmFamilia || "—"}</td>
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{vehiculo.EdiModelo || "—"}</td>
                      <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">{vehiculo.agenciaNombre}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{condLabel(vehiculo.CondUso)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#001E50]/10 text-[#001E50]">
                          {vehiculo.estatusNombre}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{vehiculo.DtFaturamento || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {vehiculo.diasEnStock != null ? (
                          <span className="font-bold px-2 py-0.5 rounded-full text-[11px]" style={{ background: `${colorAntiguedad}15`, color: colorAntiguedad }}>
                            {vehiculo.diasEnStock}d
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {vehiculo.diasFueraGracia != null ? (
                          <span className="font-bold px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-700">
                            {vehiculo.diasFueraGracia}d
                          </span>
                        ) : (
                          <span className="font-medium px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-700">
                            En gracia
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">
                        {vehiculo.VrNF_Compra != null ? formatMoneda(vehiculo.VrNF_Compra, 2) : "—"}
                      </td>
                      <td className="px-3 py-2 font-bold text-[#1677FF] whitespace-nowrap">
                        {vehiculo.costoFinancieroDiario != null ? formatMoneda(vehiculo.costoFinancieroDiario, 2) : "—"}
                      </td>
                      <td className="px-3 py-2 font-extrabold text-[#001E50] whitespace-nowrap">
                        {vehiculo.costoFinancieroTotal != null ? formatMoneda(vehiculo.costoFinancieroTotal, 2) : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[11px] whitespace-nowrap">{vehiculo.SitVeiculo || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold text-xs text-[#001E50] border-t-2 border-slate-300">
                  <td colSpan={9} className="px-3 py-2.5 text-right font-extrabold">
                    Total ({filtrados.length.toLocaleString("es-MX")} vehículos):
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-black">{formatMoneda(totalCosto, 0)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-black text-[#1677FF]">{formatMoneda(totalCostoDiario, 0)}/día</td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-black text-[#001E50]">{formatMoneda(totalCostoFinanciero, 0)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-medium">Página {pagina} de {totalPaginas}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-200 bg-white font-bold text-[#001E50] hover:bg-slate-100 disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-200 bg-white font-bold text-[#001E50] hover:bg-slate-100 disabled:opacity-40"
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
  const reporteVisualRef = useRef(null);
  const ultimaCargaInventario = useRef(0);
  const ultimaCargaVentas = useRef(0);

  // VISTA ACTIVA: "dashboard" | "detalle"
  const [vistaActiva, setVistaActiva] = useState("dashboard");

  // Filtros generales
  const [filtrosDisponibles, setFiltrosDisponibles] = useState({ agencias: [], estatus: [] });
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState("");
  const [modelosComerciales, setModelosComerciales] = useState(false);
  const [estatusSeleccionado, setEstatusSeleccionado] = useState("");
  const [condicionInventario, setCondicionInventario] = useState("N");
  const [familiaFiltro, setFamiliaFiltro] = useState("");

  // Fechas (Ventas / Rotación) - Default últimos 30 días
  const hoy = new Date();
  const hace30dias = new Date();
  hace30dias.setDate(hace30dias.getDate() - 30);

  const [fechaDesde, setFechaDesde] = useState(formatYMD(hace30dias));
  const [fechaHasta, setFechaHasta] = useState(formatYMD(hoy));

  // Datos Inventario
  const [vehiculos, setVehiculos] = useState([]);
  const [porAgencia, setPorAgencia] = useState([]);
  const [porEstatus, setPorEstatus] = useState([]);
  const [porMarca, setPorMarca] = useState([]);
  const [nuevoUsado, setNuevoUsado] = useState([]);
  const [nacionalImportado, setNacionalImportado] = useState([]);
  const [costoTotal, setCostoTotal] = useState(0);
  const [antiguedad, setAntiguedad] = useState([]);

  // Estado Ventas
  const [ventasData, setVentasData] = useState(null);
  const [cargandoVentas, setCargandoVentas] = useState(false);

  // Accordion drilldown modelo
  const [modeloExpandido, setModeloExpandido] = useState(null);

  // Loadings y Errores
  const [cargando, setCargando] = useState(true);
  const [cargandoTabla, setCargandoTabla] = useState(true);
  const [error, setError] = useState("");
  const [errorTabla, setErrorTabla] = useState("");

  // Parámetros financieros
  const [periodoGracia, setPeriodoGracia] = useState(30);
  const [tiie, setTiie] = useState("6.7458");
  const [spreadBase, setSpreadBase] = useState("0");
  const [penetracionRetail, setPenetracionRetail] = useState("0");

  const tiieNumero = useMemo(() => numeroSeguro(tiie), [tiie]);
  const spreadBaseNumero = useMemo(() => numeroSeguro(spreadBase), [spreadBase]);
  const reglaPenetracion = useMemo(() => obtenerReglaPenetracion(penetracionRetail), [penetracionRetail]);
  const spreadEfectivo = useMemo(() => spreadBaseNumero + reglaPenetracion.descuentoWholesale, [spreadBaseNumero, reglaPenetracion.descuentoWholesale]);
  const tasaAnual = useMemo(() => tiieNumero + spreadEfectivo, [tiieNumero, spreadEfectivo]);

  const agenciaActual = useMemo(() => {
    return filtrosDisponibles.agencias.find((agencia) => String(agencia.codigo) === String(agenciaSeleccionada));
  }, [filtrosDisponibles.agencias, agenciaSeleccionada]);

  // Cargar Filtros de Inventario
  useEffect(() => {
    apiInventario.getFiltros().then(setFiltrosDisponibles).catch(() => setFiltrosDisponibles({ agencias: [], estatus: [] }));
  }, []);

  // Inventario: una petición para detalle, KPIs y todos los gráficos.
  const cargarInventarioData = useCallback(async (forzarActualizacion = false) => {
    const idCarga = ++ultimaCargaInventario.current;
    const params = {
      agencia: agenciaSeleccionada || undefined,
      estatus: estatusSeleccionado || undefined,
      modelos: modelosComerciales ? MODELOS_COMERCIALES.join(",") : undefined,
      condicion: condicionInventario,
      actualizar: forzarActualizacion ? 1 : undefined,
    };
    setCargando(true);
    setCargandoTabla(true);
    setError("");
    setErrorTabla("");

    try {
      const datos = await apiInventario.getDashboard(params);
      if (idCarga !== ultimaCargaInventario.current) return;
      setVehiculos(datos.vehiculos);
      setPorAgencia(datos.porAgencia);
      setPorEstatus(datos.porEstatus.filter((item) => !ESTATUS_EXCLUIDOS.includes(item.estatus)));
      setPorMarca(datos.porMarca.slice(0, 13));
      setNuevoUsado(datos.nuevoUsado.filter((item) => item.condicion === "Nuevo" || item.condicion === "Usado"));
      setNacionalImportado(datos.nacionalImportado);
      setCostoTotal(datos.costoTotal);
      setAntiguedad(datos.antiguedad);
    } catch (errorCarga) {
      if (idCarga !== ultimaCargaInventario.current) return;
      console.error("Error de inventario:", errorCarga);
      setError("No se pudo cargar el resumen de inventario.");
      setErrorTabla("No se pudo cargar el listado de unidades.");
    } finally {
      if (idCarga === ultimaCargaInventario.current) {
        setCargando(false);
        setCargandoTabla(false);
      }
    }
  }, [agenciaSeleccionada, estatusSeleccionado, modelosComerciales, condicionInventario]);

  useEffect(() => {
    cargarInventarioData();
    return () => { ultimaCargaInventario.current += 1; };
  }, [cargarInventarioData]);

  // Cargar Datos Ventas (VentasVN API)
  const cargarVentasData = useCallback(() => {
    const idCarga = ++ultimaCargaVentas.current;
    setCargandoVentas(true);
    const nombreUnificadoVentas = obtenerAgenciaVentas(agenciaActual?.nombre, modelosComerciales);

    const paramsVentas = {
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      agencia: nombreUnificadoVentas || undefined,
    };

    Promise.allSettled([
      getVentasVNDetalle(paramsVentas),
      getVentasVNDashboard(paramsVentas),
    ])
      .then(([resDetalle, resDashboard]) => {
        if (idCarga !== ultimaCargaVentas.current) return;
        const dataDetalle = resDetalle.status === "fulfilled" ? resDetalle.value : null;
        const dataDashboard = resDashboard.status === "fulfilled" ? resDashboard.value : null;

        const parsedDetalle = procesarRespuestaVentas(dataDetalle);
        const parsedDashboard = procesarRespuestaVentas(dataDashboard);

        if (parsedDetalle.lista.length > 0) {
          setVentasData(dataDetalle);
        } else if (parsedDashboard.lista.length > 0) {
          setVentasData(dataDashboard);
        } else if (dataDashboard) {
          setVentasData(dataDashboard);
        } else if (dataDetalle) {
          setVentasData(dataDetalle);
        } else {
          setVentasData(null);
        }
      })
      .finally(() => {
        if (idCarga === ultimaCargaVentas.current) setCargandoVentas(false);
      });
  }, [fechaDesde, fechaHasta, agenciaActual, modelosComerciales]);

  useEffect(() => {
    cargarVentasData();
    return () => { ultimaCargaVentas.current += 1; };
  }, [cargarVentasData]);

  // Cálculos de Vehículos
  const vehiculosCalculados = useMemo(() => {
    return vehiculos.map((v) => calcularFinanciamientoVehiculo(v, periodoGracia, tasaAnual));
  }, [vehiculos, periodoGracia, tasaAnual]);

  const totalGeneral = vehiculosCalculados.length;

  const costoDiarioTotal = useMemo(() => {
    return vehiculosCalculados.reduce((total, v) => total + numeroSeguro(v.costoFinancieroDiario), 0);
  }, [vehiculosCalculados]);

  const costoFinancieroTotal = useMemo(() => {
    return vehiculosCalculados.reduce((total, v) => total + numeroSeguro(v.costoFinancieroTotal), 0);
  }, [vehiculosCalculados]);

  const unidadesFueraGracia = useMemo(() => {
    return vehiculosCalculados.filter((v) => numeroSeguro(v.diasFueraGracia) > 0).length;
  }, [vehiculosCalculados]);

  const agenciaLider = useMemo(() => {
    return porAgencia.length ? [...porAgencia].sort((a, b) => b.total - a.total)[0] : null;
  }, [porAgencia]);

  const pctNuevo = useMemo(() => {
    const total = nuevoUsado.reduce((acumulado, item) => acumulado + item.total, 0);
    const nuevos = nuevoUsado.filter((item) => item.condicion === "Nuevo").reduce((acumulado, item) => acumulado + item.total, 0);
    return total > 0 ? Math.round((nuevos / total) * 100) : 0;
  }, [nuevoUsado]);

  // Métricas de Ventas y Rotación
  const metricasVentas = useMemo(() => {
    const { lista, resumen } = procesarRespuestaVentas(ventasData);

    let canceladasCount = 0;
    let validasCount = 0;
    let costoVendidoTotal = 0;

    if (lista.length > 0) {
      lista.forEach((v) => {
        const sit = String(
          v.situacion ?? v.Situacion ?? v.SitVeiculo ?? v.estatus ?? v.Estatus ?? v.estado ?? v.sit_veiculo ?? ""
        ).trim().toUpperCase();

        const esCancelada = sit === "X" || sit === "CANCELADA" || sit === "CANCELADO" || sit === "C" || sit === "CANC" || v.cancelada === true;

        if (esCancelada) {
          canceladasCount++;
        } else {
          validasCount++;
          const costo = numeroSeguro(
            v.VrNF_Compra ?? v.vr_nf_compra ?? v.VrCompra ?? v.vr_compra ?? v.costo_compra ??
            v.CostoCompra ?? v.costo_vehiculo ?? v.costo ?? v.Costo ?? v.precio_costo ??
            v.PrecioCosto ?? v.valor_compra ?? v.ValorCompra ?? v.VrNF ?? v.vr_nf ??
            v.monto ?? v.total ?? v.VrVenda ?? v.vr_venda
          );
          costoVendidoTotal += costo;
        }
      });
    } else if (resumen) {
      costoVendidoTotal = numeroSeguro(
        resumen.costo_vendido ?? resumen.costoVendido ?? resumen.costo_total ??
        resumen.costoTotal ?? resumen.total_costo ?? resumen.monto_total ??
        resumen.total ?? resumen.costo ?? resumen.VrNF_Compra ?? resumen.vr_nf_compra
      );
      validasCount = numeroSeguro(
        resumen.validas ?? resumen.unidades_vendidas ?? resumen.unidades ??
        resumen.total_ventas ?? resumen.ventas ?? resumen.cantidad
      );
      canceladasCount = numeroSeguro(
        resumen.canceladas ?? resumen.ventas_canceladas ?? resumen.total_canceladas ?? resumen.cancelados
      );
    }

    const d1 = new Date(fechaDesde);
    const d2 = new Date(fechaHasta);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const mesesPeriodo = diffDays / 30.41;

    const ventasPromedioMensualCosto = mesesPeriodo > 0 ? costoVendidoTotal / mesesPeriodo : 0;
    const ventasPromedioMensualUnidades = mesesPeriodo > 0 ? validasCount / mesesPeriodo : 0;

    const rotacion = costoTotal > 0 ? costoVendidoTotal / costoTotal : 0;
    const mesesVenta = ventasPromedioMensualCosto > 0 ? costoTotal / ventasPromedioMensualCosto : 0;
    const mesesVentaUnidades = ventasPromedioMensualUnidades > 0 ? totalGeneral / ventasPromedioMensualUnidades : 0;

    return {
      canceladas: canceladasCount,
      validas: validasCount,
      costoVendido: costoVendidoTotal,
      rotacion,
      mesesVenta,
      mesesVentaUnidades
    };
  }, [ventasData, costoTotal, totalGeneral, fechaDesde, fechaHasta]);

  // Agrupación de Costo Financiero por Agencia (para barras delgadas)
  const costosPorAgencia = useMemo(() => {
    const agrupado = {};
    vehiculosCalculados.forEach((vehiculo) => {
      const familia = String(vehiculo.NmFamilia || "").trim().toUpperCase();
      const esVehiculoComercial = MODELOS_COMERCIALES.some((m) => familia.includes(m.toUpperCase()));
      const agencia = esVehiculoComercial ? "R&R VC" : vehiculo.agenciaNombre || "Sin agencia";

      if (!agrupado[agencia]) agrupado[agencia] = { agencia, totalFinanciero: 0, totalDiario: 0, unidades: 0, vehiculosFuera: 0 };
      agrupado[agencia].totalFinanciero += numeroSeguro(vehiculo.costoFinancieroTotal);
      agrupado[agencia].totalDiario += numeroSeguro(vehiculo.costoFinancieroDiario);
      agrupado[agencia].unidades += 1;
      if (numeroSeguro(vehiculo.diasFueraGracia) > 0) agrupado[agencia].vehiculosFuera += 1;
    });

    const lista = Object.values(agrupado).sort((a, b) => b.totalFinanciero - a.totalFinanciero);
    const maxFinanciero = Math.max(1, ...lista.map((i) => i.totalFinanciero));
    return { lista, maxFinanciero };
  }, [vehiculosCalculados]);

  // AGRUPACIÓN DE MODELOS CON CÁLCULO DE ANTIGÜEDAD PROMEDIO (DÍAS EN STOCK)
  const modelosAgrupados = useMemo(() => {
    const map = new Map();

    vehiculosCalculados.forEach((r) => {
      const famOriginal = r.NmFamilia || "DESCONOCIDO";
      const grupo = famOriginal.toUpperCase().trim();
      const costoComp = numeroSeguro(r.VrNF_Compra);
      const costoDiario = numeroSeguro(r.costoFinancieroDiario);
      const costoFin = numeroSeguro(r.costoFinancieroTotal);
      const diasStock = numeroSeguro(r.diasEnStock);

      if (!map.has(grupo)) {
        map.set(grupo, {
          modelo: grupo,
          unidades: 0,
          costoCompra: 0,
          costoDiario: 0,
          costoFin: 0,
          sumaDiasStock: 0,
          familiasMap: new Map(),
        });
      }

      const item = map.get(grupo);
      item.unidades += 1;
      item.costoCompra += costoComp;
      item.costoDiario += costoDiario;
      item.costoFin += costoFin;
      item.sumaDiasStock += diasStock;

      const famData = item.familiasMap.get(famOriginal) || {
        familia: famOriginal,
        unidades: 0,
        costoCompra: 0,
        costoDiario: 0,
        costoFin: 0,
        sumaDiasStock: 0,
      };
      famData.unidades += 1;
      famData.costoCompra += costoComp;
      famData.costoDiario += costoDiario;
      famData.costoFin += costoFin;
      famData.sumaDiasStock += diasStock;
      item.familiasMap.set(famOriginal, famData);
    });

    const list = Array.from(map.values())
      .map((item) => ({
        ...item,
        antiguedadPromedio: item.unidades > 0 ? Math.round(item.sumaDiasStock / item.unidades) : 0,
        familias: Array.from(item.familiasMap.values())
          .map((f) => ({
            ...f,
            antiguedadPromedio: f.unidades > 0 ? Math.round(f.sumaDiasStock / f.unidades) : 0,
          }))
          .sort((a, b) => b.unidades - a.unidades),
      }))
      .sort((a, b) => b.unidades - a.unidades);

    const maxUnidadesModelo = Math.max(1, ...list.map((m) => m.unidades));
    return { list, maxUnidadesModelo };
  }, [vehiculosCalculados]);

  // Preset de Fechas
  const setPresetFechas = (tipo) => {
    const h = new Date();
    if (tipo === "30dias") {
      const d = new Date(); d.setDate(d.getDate() - 30);
      setFechaDesde(formatYMD(d)); setFechaHasta(formatYMD(h));
    } else if (tipo === "mesActual") {
      const d = new Date(h.getFullYear(), h.getMonth(), 1);
      setFechaDesde(formatYMD(d)); setFechaHasta(formatYMD(h));
    } else if (tipo === "mesAnterior") {
      const d1 = new Date(h.getFullYear(), h.getMonth() - 1, 1);
      const d2 = new Date(h.getFullYear(), h.getMonth(), 0);
      setFechaDesde(formatYMD(d1)); setFechaHasta(formatYMD(d2));
    } else if (tipo === "anioActual") {
      const d = new Date(h.getFullYear(), 0, 1);
      setFechaDesde(formatYMD(d)); setFechaHasta(formatYMD(h));
    }
  };

  // Botones Concesionarios
  const agenciasPills = useMemo(() => {
    const agsInv = filtrosDisponibles.agencias || [];
    return [
      { id: "todas", label: "Todas las agencias", click: () => { setAgenciaSeleccionada(""); setModelosComerciales(false); } },
      { id: "comerciales", label: "R&R Vehículos Comerciales", click: () => { setAgenciaSeleccionada(""); setModelosComerciales(true); } },
      ...agsInv.map((a) => ({
        id: a.codigo,
        label: a.nombre,
        click: () => { setModelosComerciales(false); setAgenciaSeleccionada(a.codigo); },
      })),
    ];
  }, [filtrosDisponibles.agencias]);

  // Exportaciones
  const [exportando, setExportando] = useState(null);

  const exportarInventarioExcel = async () => {
    if (!vehiculosCalculados.length || exportando) return;
    setExportando("excel");
    try {
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const hoja = workbook.addWorksheet("Inventario", { views: [{ state: "frozen", ySplit: 1 }], pageSetup: { orientation: "landscape" } });
      hoja.columns = [
        { header: "VIN", key: "vin", width: 22 }, { header: "Familia", key: "familia", width: 18 }, { header: "Modelo", key: "modelo", width: 28 }, { header: "Agencia", key: "agencia", width: 20 },
        { header: "Condición", key: "condicion", width: 12 }, { header: "Estatus", key: "estatus", width: 14 }, { header: "F. Factura", key: "fecha_factura", width: 14 },
        { header: "Antigüedad (d)", key: "antiguedad", width: 15 }, { header: "Fuera Gracia (d)", key: "fuera_gracia", width: 16 }, { header: "Valor Compra", key: "valor_compra", width: 18 },
        { header: "Costo Diario", key: "costo_diario", width: 16 }, { header: "Costo Financiero Total", key: "costo_total", width: 22 }, { header: "Situación", key: "situacion", width: 14 },
      ];
      hoja.getRow(1).eachCell((cell) => { cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF001E50" } }; cell.alignment = { horizontal: "center", vertical: "middle" }; });
      vehiculosCalculados.forEach((v) => {
        hoja.addRow({ vin: v.NrChassi || "—", familia: v.NmFamilia || "—", modelo: v.EdiModelo || "—", agencia: v.agenciaNombre || "—", condicion: v.CondUso === "N" ? "Nuevo" : v.CondUso === "U" ? "Usado" : v.CondUso, estatus: v.estatusNombre || "—", fecha_factura: v.DtFaturamento || "—", antiguedad: v.diasEnStock ?? 0, fuera_gracia: v.diasFueraGracia ?? 0, valor_compra: Number(v.VrNF_Compra) || 0, costo_diario: v.costoFinancieroDiario || 0, costo_total: v.costoFinancieroTotal || 0, situacion: v.SitVeiculo || "—" });
      });
      hoja.getColumn(10).numFmt = "$#,##0.00"; hoja.getColumn(11).numFmt = "$#,##0.00"; hoja.getColumn(12).numFmt = "$#,##0.00";
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob); const enlace = document.createElement("a"); enlace.href = url; enlace.download = `reporte_inventario_${formatYMD(new Date())}.xlsx`;
      document.body.appendChild(enlace); enlace.click(); enlace.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) { console.error(err); alert("Error al exportar a Excel."); } finally { setExportando(null); }
  };

  const exportarInventarioPdf = async () => {
    if (!vehiculosCalculados.length || exportando) return;
    setExportando("pdf");
    if (vistaActiva !== "dashboard") {
      setVistaActiva("dashboard");
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((resolve) => setTimeout(resolve, 300));
      const [{ default: html2canvas }, { jsPDF }, { autoTable }] = await Promise.all([
        import("html2canvas-pro"), import("jspdf"), import("jspdf-autotable"),
      ]);
      if (!reporteVisualRef.current) {
        throw new Error("Abre la vista Gráficos antes de exportar a PDF.");
      }
      const canvas = await html2canvas(reporteVisualRef.current, { scale: 1.4, useCORS: true, backgroundColor: "#ffffff", logging: false });
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
      const anchoUtil = doc.internal.pageSize.getWidth() - 16;
      const pixelesPorMm = canvas.width / anchoUtil;
      doc.addImage(canvas.toDataURL("image/png"), "PNG", 8, 8, anchoUtil, canvas.height / pixelesPorMm, undefined, "FAST");
      doc.addPage("a4", "landscape"); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(0, 30, 80);
      doc.text("Detalle de Inventario Físico de Unidades", 10, 12);
      autoTable(doc, {
        startY: 16,
        head: [["VIN", "Familia", "Modelo", "Agencia", "Cond.", "Estatus", "F. Factura", "Antig.", "F. Gracia", "Valor Compra", "Costo Diario", "Costo Total"]],
        body: vehiculosCalculados.map((v) => [v.NrChassi || "—", v.NmFamilia || "—", (v.EdiModelo || "—").slice(0, 18), v.agenciaNombre || "—", v.CondUso === "N" ? "Nuevo" : "Usado", v.estatusNombre || "—", v.DtFaturamento || "—", `${v.diasEnStock ?? 0}d`, v.diasFueraGracia ? `${v.diasFueraGracia}d` : "0d", formatMoneda(v.VrNF_Compra, 0), formatMoneda(v.costoFinancieroDiario, 0), formatMoneda(v.costoFinancieroTotal, 0)]),
        theme: "grid", styles: { fontSize: 6, cellPadding: 1 }, headStyles: { fillColor: [0, 30, 80], textColor: 255 }, margin: { left: 8, right: 8, bottom: 8 },
      });
      doc.save(`reporte_inventario_${formatYMD(new Date())}.pdf`);
    } catch (err) { console.error(err); alert("Error al exportar a PDF."); } finally { setExportando(null); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="space-y-4 py-3 px-1 sm:px-2">
        {/* HEADER TOP BAR */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#001E50] tracking-tight">Control de Inventario</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-[#001E50]/20 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setVistaActiva("dashboard")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${vistaActiva === "dashboard" ? "bg-[#001E50] text-white shadow" : "text-[#001E50] hover:bg-slate-100"
                  }`}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Gráficos
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva("detalle")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${vistaActiva === "detalle" ? "bg-[#001E50] text-white shadow" : "text-[#001E50] hover:bg-slate-100"
                  }`}
              >
                <Table2 className="h-3.5 w-3.5" /> Tabla Detalle
              </button>
            </div>

            <button
              type="button"
              onClick={exportarInventarioExcel}
              disabled={!vehiculosCalculados.length || Boolean(exportando)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:opacity-50"
            >
              {exportando === "excel" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
              Excel
            </button>

            <button
              type="button"
              onClick={exportarInventarioPdf}
              disabled={!vehiculosCalculados.length || Boolean(exportando)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
            >
              {exportando === "pdf" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              PDF
            </button>

            <button
              type="button"
              onClick={() => { cargarInventarioData(true); cargarVentasData(); }}
              disabled={cargando || cargandoTabla || cargandoVentas}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#001E50]/20 bg-white px-3 text-xs font-bold text-[#001E50] shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
            >
              {cargando || cargandoTabla || cargandoVentas ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Actualizar
            </button>
          </div>
        </div>

        {/* HERO CARD BANNER ESTILO VOLVO */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#001E50] via-[#0A1340] to-[#050B28] text-white shadow-xl border border-[#001E50]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(22,119,255,0.15),transparent_70%)] pointer-events-none" />
          <Car className="absolute -right-6 -bottom-6 h-56 w-56 text-white/[0.04] pointer-events-none transform -rotate-12" />

          {/* ENCABEZADO Y MÉTRICAS CLAVE */}
          <div className="relative p-5 pb-4 border-b border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-300/80">
                  VOLKSWAGEN AUTOMOTRIZ R&R · CONTROL FÍSICO Y FINANCIERO DE UNIDADES
                </p>
                <h2 className="text-2xl font-black tracking-tight text-white mt-0.5">
                  Dashboard de Inventario
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-white/15">
                  Tasa Aplicada: <strong className="text-sky-300">{tasaAnual.toFixed(4)}%</strong> (TIIE + Spread)
                </span>
              </div>
            </div>

            {/* MÉTRICAS EN BLOQUES ESTILO VOLVO */}
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-white/10">

              <div className="pt-2 sm:pt-0 sm:px-3 first:px-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300/80 block mb-1">
                  TOTAL ACTIVO
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">
                    {cargandoTabla ? "…" : totalGeneral.toLocaleString("es-MX")}
                  </span>
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/30">
                    {pctNuevo}% nuev.
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Unidades en stock activo</p>
              </div>

              <div className="pt-2 sm:pt-0 sm:px-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300/80 block mb-1">
                  VALOR DE COMPRA
                </span>
                <span className="text-2xl font-black text-white block">
                  {cargando ? "…" : formatMoneda(costoTotal, 0)}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Capital total invertido</p>
              </div>

              <div className="pt-2 sm:pt-0 sm:px-3 bg-white/5 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 block mb-1">
                  COSTO DIARIO
                </span>
                <span className="text-2xl font-black text-sky-300 block">
                  {cargandoTabla ? "…" : `${formatMoneda(costoDiarioTotal, 0)}/día`}
                </span>
                <p className="text-[10px] text-sky-200/80 mt-1">Interés diario generado</p>
              </div>

              <div className="pt-2 sm:pt-0 sm:px-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300/80 block mb-1">
                  COSTO FINANCIERO ACUM.
                </span>
                <span className="text-2xl font-black text-emerald-400 block">
                  {cargandoTabla ? "…" : formatMoneda(costoFinancieroTotal, 0)}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">Acumulado fuera de gracia</p>
              </div>

              <div className="pt-2 sm:pt-0 sm:px-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300/80 block mb-1">
                  FUERA DE GRACIA
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-300">
                    {cargandoTabla ? "…" : unidadesFueraGracia}
                  </span>
                  <span className="text-[10px] font-bold text-amber-200/80">uds.</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Más de {periodoGracia} días en stock</p>
              </div>

              <div className="pt-2 sm:pt-0 sm:px-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300/80 block mb-1">
                  ROTACIÓN (PERIODO)
                </span>
                <span className="text-2xl font-black text-sky-300 block">
                  {cargandoVentas ? "…" : `${metricasVentas.rotacion.toFixed(2)}x`}
                </span>
                <p className="text-[10px] text-slate-400 mt-1">
                  {metricasVentas.mesesVenta.toFixed(1)} meses venta (valor)
                </p>
              </div>

            </div>
          </div>

          {/* BOTONES DE AGENCIAS / CONCESIONARIOS */}
          <div className="bg-black/30 backdrop-blur-md px-5 py-2.5 flex flex-wrap items-center gap-2 border-t border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 mr-2">Concesionarios:</span>
            {agenciasPills.map((pill) => {
              const activa = pill.id === "todas"
                ? (!agenciaSeleccionada && !modelosComerciales)
                : pill.id === "comerciales"
                  ? modelosComerciales
                  : (agenciaSeleccionada === pill.id && !modelosComerciales);

              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={pill.click}
                  className={`inline-flex items-center justify-center rounded-full px-3.5 py-1 text-[11px] font-bold transition-all ${activa
                    ? "bg-white text-[#001E50] shadow-md scale-105"
                    : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                    }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* PARÁMETROS FINANCIEROS Y RANGO DE VENTAS DE ROTACIÓN */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-center">

            <div className="lg:col-span-3">
              <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                Periodo de Gracia (Días)
              </label>
              <div className="flex gap-1.5">
                {[30, 45, 60].map((dias) => (
                  <button
                    key={dias}
                    type="button"
                    onClick={() => setPeriodoGracia(dias)}
                    className={`flex-1 rounded-lg border py-1 text-xs font-bold transition ${periodoGracia === dias
                      ? "border-[#001E50] bg-[#001E50] text-white shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                  >
                    {dias}d
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <label className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
                Rango Fechas Ventas (Rotación)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  className="h-8 w-full text-[11px] border border-slate-200 rounded-lg px-2 bg-white text-[#001E50] font-bold outline-none focus:border-[#1677FF]"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
                <span className="text-slate-400 font-bold text-xs">-</span>
                <input
                  type="date"
                  className="h-8 w-full text-[11px] border border-slate-200 rounded-lg px-2 bg-white text-[#001E50] font-bold outline-none focus:border-[#1677FF]"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                <button type="button" onClick={() => setPresetFechas("30dias")} className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[#001E50] hover:bg-slate-100">
                  30d
                </button>
                <button type="button" onClick={() => setPresetFechas("mesActual")} className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[#001E50] hover:bg-slate-100">
                  Mes actual
                </button>
                <button type="button" onClick={() => setPresetFechas("mesAnterior")} className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[#001E50] hover:bg-slate-100">
                  Mes ant.
                </button>
                <button type="button" onClick={() => setPresetFechas("anioActual")} className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[#001E50] hover:bg-slate-100">
                  Año actual
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-3 gap-2">
              <div>
                <label className="mb-0.5 block text-[9px] font-black uppercase text-slate-400">TIIE 28d</label>
                <input
                  type="number"
                  step="0.0001"
                  value={tiie}
                  onChange={(e) => setTiie(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-[#001E50] outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[9px] font-black uppercase text-slate-400">Spread</label>
                <input
                  type="number"
                  step="0.01"
                  value={spreadBase}
                  onChange={(e) => setSpreadBase(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-[#001E50] outline-none"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-[9px] font-black uppercase text-slate-400">Penetración %</label>
                <input
                  type="number"
                  step="0.1"
                  value={penetracionRetail}
                  onChange={(e) => setPenetracionRetail(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-[#001E50] outline-none"
                />
              </div>
            </div>

          </div>
        </div>

        {/* TABLA O DASHBOARD */}
        {vistaActiva === "detalle" ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-extrabold text-[#001E50] text-sm mb-3">Detalle Individual de Unidades en Inventario</h3>
            <TablaVehiculos
              vehiculos={vehiculosCalculados}
              cargando={cargandoTabla}
              error={errorTabla}
              familiaFiltro={familiaFiltro}
              onClearFamilia={() => setFamiliaFiltro("")}
              periodoGracia={periodoGracia}
            />
          </div>
        ) : (
          <div ref={reporteVisualRef} className="space-y-4">

            {/* FILA 1: COSTO FINANCIERO Y ROTACIÓN */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

              {/* COSTO FINANCIERO POR AGENCIA */}
              <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Costo Financiero por Concesionario</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Gracia: {periodoGracia} días
                  </span>
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                  {costosPorAgencia.lista.length === 0 ? (
                    <p className="py-10 text-center text-xs text-slate-400">Sin unidades fuera del periodo de gracia</p>
                  ) : (
                    costosPorAgencia.lista.map((item) => {
                      const pct = Math.min(100, Math.round((item.totalFinanciero / costosPorAgencia.maxFinanciero) * 100));
                      return (
                        <div key={item.agencia} className="flex items-center gap-3 text-xs bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100/80 transition">
                          <span className="flex h-6 px-2 shrink-0 items-center justify-center rounded-lg bg-[#001E50] text-[10px] font-black text-white">
                            {item.unidades} uds.
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between font-bold text-[#1A1F3C] text-[11px] mb-1">
                              <span className="truncate">{item.agencia}</span>
                              <span className="shrink-0 text-slate-500 ml-2">{item.vehiculosFuera} fuera gracia</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div className="h-full rounded-full bg-[#001E50] transition-all duration-300" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <div className="text-right shrink-0 min-w-[100px]">
                            <span className="font-black text-[#1677FF] text-xs block">
                              {formatMoneda(item.totalFinanciero, 0)}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 block">
                              {formatMoneda(item.totalDiario, 0)}/día
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RENTABILIDAD Y ROTACIÓN */}
              <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>Análisis de Ventas y Rotación</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Periodo: {fechaDesde} al {fechaHasta}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">COSTO DE LO VENDIDO</span>
                      <span className="text-xl font-black text-emerald-600 block">{formatMoneda(metricasVentas.costoVendido, 0)}</span>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">{metricasVentas.validas} uds. ({metricasVentas.canceladas} canceladas)</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">ROTACIÓN INVENTARIO</span>
                      <span className="text-xl font-black text-[#001E50] block">{metricasVentas.rotacion.toFixed(2)}x</span>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">Costo Vendido / Costo Inventario</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">MESES VENTA (VALOR)</span>
                      <span className="text-xl font-black text-amber-600 block">{metricasVentas.mesesVenta.toFixed(1)} m.</span>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">Inv / Venta Prom. Mensual ($)</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">MESES VENTA (UDS)</span>
                      <span className="text-xl font-black text-[#1677FF] block">{metricasVentas.mesesVentaUnidades.toFixed(1)} m.</span>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">Inv / Venta Prom. Mensual (Uds)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#001E50]/5 p-3 rounded-xl border border-[#001E50]/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#001E50]" />
                    <span className="text-xs font-bold text-[#001E50]">Impacto de Permanencia Diaria:</span>
                  </div>
                  <span className="text-xs font-black text-[#1677FF]">
                    {formatMoneda(costoDiarioTotal, 0)} costo financiero/día
                  </span>
                </div>
              </div>

            </div>

            {/* FILA 2: ANÁLISIS DE MODELOS CON ANTIGÜEDAD PROMEDIO Y ANTIGÜEDAD POR RANGOS */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

              {/* MODELOS Y VARIANTES CON ANTIGÜEDAD PROMEDIO INCORPORADA */}
              <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Inventario por Modelo y Variantes (Antigüedad Promedio)</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Clica un modelo para desplegar sus familias
                  </span>
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                  {modelosAgrupados.list.length === 0 ? (
                    <p className="py-12 text-center text-xs text-slate-400">Sin datos de modelos en inventario</p>
                  ) : (
                    modelosAgrupados.list.map((m) => {
                      const estaExpandido = modeloExpandido === m.modelo;
                      const pctBarra = Math.min(100, Math.round((m.unidades / modelosAgrupados.maxUnidadesModelo) * 100));

                      return (
                        <div key={m.modelo} className="rounded-xl border border-slate-200 overflow-hidden transition">

                          <div
                            onClick={() => setModeloExpandido(estaExpandido ? null : m.modelo)}
                            className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#001E50] text-white">
                              {estaExpandido ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between font-extrabold text-[#001E50] text-xs mb-1">
                                <div className="flex items-center gap-2">
                                  <span>{m.modelo}</span>
                                  {/* MOSTRAR ANTIGÜEDAD PROMEDIO POR MODELO */}
                                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-800 border border-amber-200/80 px-1.5 py-0.5 text-[10px] font-bold">
                                    <Clock className="h-3 w-3 text-amber-600" />
                                    Prom. {m.antiguedadPromedio}d en stock
                                  </span>
                                </div>
                                <span className="text-slate-500">{m.unidades} uds.</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                <div className="h-full rounded-full bg-[#001E50] transition-all duration-300" style={{ width: `${pctBarra}%` }} />
                              </div>
                            </div>

                            <div className="text-right shrink-0 min-w-[130px] pl-2 border-l border-slate-200">
                              <div className="text-xs font-black text-[#001E50]">{formatMoneda(m.costoCompra, 0)}</div>
                              <div className="text-[10px] font-bold text-[#1677FF]">
                                {formatMoneda(m.costoDiario, 0)}/día
                              </div>
                            </div>
                          </div>

                          {/* DRILLDOWN INTERACTIVO CON ANTIGÜEDAD PROMEDIO DE SUB-FAMILIAS */}
                          {estaExpandido && (
                            <div className="p-3 bg-white border-t border-slate-100 space-y-2 pl-8">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                Variantes y Familias de {m.modelo}:
                              </p>
                              {m.familias.map((fam) => {
                                const pctSub = Math.min(100, Math.round((fam.unidades / m.unidades) * 100));
                                return (
                                  <div key={fam.familia} className="flex items-center gap-3 text-xs bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                                    <Car className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between font-bold text-slate-700 text-[11px] mb-0.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="truncate">{fam.familia}</span>
                                          {/* ANTIGÜEDAD PROMEDIO POR SUB-FAMILIA */}
                                          <span className="shrink-0 text-[9px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                                            {fam.antiguedadPromedio}d prom.
                                          </span>
                                        </div>
                                        <span className="shrink-0 text-slate-500 ml-2">{fam.unidades} uds.</span>
                                      </div>
                                      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                        <div className="h-full rounded-full bg-[#1677FF] transition-all duration-300" style={{ width: `${pctSub}%` }} />
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0 min-w-[120px]">
                                      <div className="text-[11px] font-bold text-[#001E50]">{formatMoneda(fam.costoCompra, 0)}</div>
                                      <div className="text-[10px] font-bold text-[#1677FF]">{formatMoneda(fam.costoDiario, 0)}/día</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ANTIGÜEDAD EN STOCK Y ORIGEN */}
              <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Antigüedad en Stock</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {(antiguedad || []).map((item) => {
                    const color = item.rango === "+120" ? "#dc2626" : item.rango === "91-120" ? "#ea580c" : item.rango === "61-90" ? "#d97706" : "#001E50";
                    const maxA = Math.max(1, ...(antiguedad || []).map(a => a.total));
                    const pctBar = Math.min(100, Math.round((item.total / maxA) * 100));

                    return (
                      <div key={item.rango} className="flex items-center gap-3 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="font-extrabold text-[#001E50] w-14 shrink-0">{item.rango}d</span>
                        <div className="flex-1 min-w-0">
                          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pctBar}%`, backgroundColor: color }} />
                          </div>
                        </div>
                        <span className="font-black text-xs min-w-[40px] text-right" style={{ color }}>{item.total} uds.</span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">Origen de las Unidades</span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    {(nacionalImportado || []).map((ni) => (
                      <div key={ni.tipoNombre} className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 block">{ni.tipoNombre}</span>
                        <span className="text-lg font-black text-[#001E50]">{ni.total} uds.</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}