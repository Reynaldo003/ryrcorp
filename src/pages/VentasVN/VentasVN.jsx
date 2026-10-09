// src/pages/VentasVN/VentasVN.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowDown, ArrowUp, BarChart3, CalendarDays, Car, CreditCard, Eraser,
  CircleDollarSign, Database, ImageDown, LoaderCircle, RefreshCw, RotateCcw,
  Search, SlidersHorizontal, Tags, User, Users, CheckCircle2, Globe,
  Table2, TrendingUp, WalletCards, X, Check, Plus, ChevronDown, Calendar,
  Percent, Landmark, Layers, ChevronUp, PieChart as PieIcon,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, ComposedChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import html2canvas from "html2canvas-pro";
import { CONDICION_USO, getVentasVNDashboard, getVentasVNDetalle } from "../../lib/apiVentasVN";
import InteractiveTable from "../VentasVN/InteractiveTable";
const C = {
  navy: "#001E50", navyDark: "#0A1340", navyLight: "#1677FF",
  border: "#E4E7F0", muted: "#8891AD", text: "#1A1F3C",
};
const MODELOS_VC = ["CADDY", "CRAFTER", "TRANSPORTER", "AMAROK", "CARAVELLE"];
function esVehiculoComercial(familia) {
  if (!familia) return false;
  const famUpper = String(familia).toUpperCase();
  return MODELOS_VC.some((mod) => famUpper.includes(mod));
}
function obtenerGrupoModelo(familia) {
  if (!familia) return "OTROS";
  const fam = String(familia).toUpperCase().trim();
  if (fam.includes("JETTA") || fam.includes("GLI")) return "JETTA";
  if (fam.includes("POLO")) return "POLO";
  if (fam.includes("VIRTUS")) return "VIRTUS";
  if (fam.includes("TAOS")) return "TAOS";
  if (fam.includes("TIGUAN") || fam.includes("ALLSPACE")) return "TIGUAN";
  if (fam.includes("NIVUS")) return "NIVUS";
  if (fam.includes("CROSS") && !fam.includes("SPORT")) return "T-CROSS";
  if (fam.includes("SAVEIRO")) return "SAVEIRO";
  if (fam.includes("AMAROK")) return "AMAROK";
  if (fam.includes("CRAFTER")) return "CRAFTER";
  if (fam.includes("TRANSPORTER")) return "TRANSPORTER";
  if (fam.includes("CADDY")) return "CADDY";
  if (fam.includes("CARAVELLE")) return "CARAVELLE";
  if (fam.includes("TERAMONT") || fam.includes("CROSS SPORT")) return "TERAMONT";
  if (fam.includes("GOLF") || fam.includes("GTI")) return "GOLF";
  if (fam.includes("GOL")) return "GOL";
  return fam.replace(/NUEVO\s\*|NUEVA\s\*|PA\s\*|GP\s\*/g, "").trim() || fam;
}
const COLUMNAS = [
  { key: "serie", label: "Serie" },
  { key: "nr_nota", label: "Nr. Nota" },
  { key: "tp_producto", label: "Tipo Producto" },
  { key: "producto_servicio", label: "Producto / Servicio" },
  { key: "precio_unitario", label: "Precio Unitario", tipo: "moneda" },
  { key: "valor_bruto_item", label: "Valor Bruto", tipo: "moneda" },
  { key: "influye_estadistica", label: "Influye Estadística" },
  { key: "valor_descuento_item", label: "Descuento", tipo: "moneda" },
  { key: "codigo_condicion_pago", label: "Código Cond. Pago" },
  { key: "valor_factura", label: "Valor Factura", tipo: "moneda" },
  { key: "valor_factura_sin_iva", label: "Factura sin IVA", tipo: "moneda" },
  { key: "valor_compra", label: "Valor Compra", tipo: "moneda" },
  { key: "isan", label: "ISAN", tipo: "moneda" },
  { key: "iva", label: "IVA", tipo: "moneda" },
  { key: "codigo_entidad", label: "Código Entidad" },
  { key: "fecha_emision", label: "Fecha Emisión", tipo: "fecha" },
  { key: "situacion", label: "Situación" },
  { key: "tipo_nf", label: "Tipo NF" },
  { key: "nr_mov", label: "Nr. Movimiento" },
  { key: "fecha_ultima_venta", label: "Última Venta", tipo: "fecha" },
  { key: "razon_social", label: "Razón Social" },
  { key: "tipo_persona", label: "Tipo Persona" },
  { key: "valor_total_productos", label: "Total Productos", tipo: "moneda" },
  { key: "codigo_marca", label: "Código Marca" },
  { key: "nombre_marca", label: "Marca" },
  { key: "nombre_familia", label: "Familia / Modelo" },
  { key: "condicion_uso", label: "Condición Uso" },
  { key: "nombre_condicion_pago", label: "Condición Pago" },
  { key: "asesor", label: "Asesor" },
  { key: "agencia", label: "Agencia" },
  { key: "tipo_venta", label: "Tipo de Venta" },
];
const FILTROS_INICIALES = {
  q: "", agencia: "", asesor: "", familia: "", condicion_pago: "",
  fecha_desde: "", fecha_hasta: "", venta_digital: "",
};
const MESES_CORTOS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const PIE_COLORS = ["#001E50", "#1677FF", "#3D63C8", "#6681D4", "#8B9DDE", "#AEB9E8", "#42526E", "#7A869A"];
const TOOLTIP_STYLE = { border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: "0 12px 30px rgba(0,30,80,.12)", fontSize: 12 };
function numero(value) { return Number(value || 0); }
function formatoNumero(value) { return numero(value).toLocaleString("es-MX"); }
function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
function etiquetaMes(item) {
  const mes = Number(item?.mes || 0);
  const anio = item?.anio || "";
  if (mes < 1 || mes > 12) return item?.periodo || "";
  return `${MESES_CORTOS[mes - 1]} ${anio}`;
}
function fechaInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function fechaLocal(value) {
  if (!value) return null;
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, m - 1, d);
}
function obtenerRangoMes(mes, anio) {
  const anioN = Number(anio) || 2000;
  const mesN = Number(mes);
  if (mesN < 1 || mesN > 12) return {};
  const desde = new Date(anioN, mesN - 1, 1);
  const hasta = new Date(anioN, mesN, 0);
  return { fecha_desde: fechaInput(desde), fecha_hasta: fechaInput(hasta) };
}
export default function VentasVN() {
  const [dashboard, setDashboard] = useState({
    totales: { productos: 0, unidades_vendidas: 0, ingresos: 0, costo: 0, ventas_digitales: 0 },
    graficas: { por_mes: [], por_asesor: [], por_familia: [], por_condicion_pago: [] },
    opciones: { agencias: [], asesores: [], familias: [], condiciones_pago: [] },
  });
  const [dashboardAnual, setDashboardAnual] = useState([]); // Para la tendencia completa de 12 meses
  const hoy = useMemo(() => new Date(), []);
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth();
  const anios = useMemo(() => Array.from({ length: 5 }, (_, i) => anioActual - i), [anioActual]);
  const [anioSel, setAnioSel] = useState(anioActual);
  const [mesSel, setMesSel] = useState(mesActual);
  const [modeloExpandido, setModeloExpandido] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [vistaActiva, setVistaActiva] = useState("dashboard");
  const [filtros, setFiltros] = useState(() => ({
    ...FILTROS_INICIALES,
    ...obtenerRangoMes(mesActual + 1, anioActual),
  }));
  const [qBuscado, setQBuscado] = useState("");
  // La agencia y la paginación se filtran en PostgreSQL, no en una página de React.
  const registrosFiltrados = registros;
  const agenciasOpciones = useMemo(() => {
    const agencias = dashboard?.opciones?.agencias || [];
    return Array.from(new Set([...agencias, "R&R VC"]));
  }, [dashboard?.opciones?.agencias]);

  useEffect(() => {
    const t = setTimeout(() => setQBuscado(filtros.q), 300);
    return () => clearTimeout(t);
  }, [filtros.q]);
  const solicitudDashboard = useRef(0);
  const solicitudDetalle = useRef(0);

  const cargarDashboard = useCallback(async () => {
    const solicitud = ++solicitudDashboard.current;
    setLoadingDashboard(true);
    try {
      const response = await getVentasVNDashboard({
        cond_uso: CONDICION_USO.NUEVO,
        q: qBuscado,
        fecha_desde: filtros.fecha_desde,
        fecha_hasta: filtros.fecha_hasta,
        agencia: filtros.agencia,
        asesor: filtros.asesor,
        familia: filtros.familia,
        condicion_pago: filtros.condicion_pago,
        venta_digital: filtros.venta_digital,
        anio_tendencia: anioSel,
      });
      if (solicitud !== solicitudDashboard.current) return;
      const data = response?.data || response || {};
      const totales = data.totales || {};
      const graficas = data.graficas || {};
      const opciones = data.opciones || {};
      setDashboard({
        totales: {
          productos: numero(totales.productos),
          unidades_vendidas: numero(totales.unidades_vendidas),
          ingresos: numero(totales.ingresos),
          costo: numero(totales.costo),
          ventas_digitales: numero(totales.ventas_digitales),
        },
        graficas: {
          por_mes: graficas.por_mes || [],
          por_asesor: graficas.por_asesor || [],
          por_familia: graficas.por_familia || [],
          por_condicion_pago: graficas.por_condicion_pago || [],
        },
        opciones: {
          agencias: opciones.agencias || [],
          asesores: opciones.asesores || [],
          familias: opciones.familias || [],
          condiciones_pago: opciones.condiciones_pago || [],
        },
      });
      setDashboardAnual(graficas.tendencia_anual || []);
    } catch (err) {
      if (solicitud === solicitudDashboard.current) console.error("Error en dashboard:", err);
    } finally {
      if (solicitud === solicitudDashboard.current) setLoadingDashboard(false);
    }
  }, [qBuscado, anioSel, filtros.fecha_desde, filtros.fecha_hasta, filtros.agencia, filtros.asesor, filtros.familia, filtros.condicion_pago, filtros.venta_digital]);

  const cargarDatos = useCallback(async () => {
    const solicitud = ++solicitudDetalle.current;
    setLoading(true);
    setError("");
    try {
      const response = await getVentasVNDetalle({
        cond_uso: CONDICION_USO.NUEVO,
        page: pagina,
        page_size: pageSize,
        q: qBuscado,
        agencia: filtros.agencia,
        asesor: filtros.asesor,
        familia: filtros.familia,
        condicion_pago: filtros.condicion_pago,
        fecha_desde: filtros.fecha_desde,
        fecha_hasta: filtros.fecha_hasta,
        venta_digital: filtros.venta_digital,
      });
      if (solicitud !== solicitudDetalle.current) return;
      const data = response?.data || response || {};
      const lista = Array.isArray(data.results) ? data.results : [];
      setRegistros(lista);
      setTotal(Number(data.count ?? lista.length));
    } catch (err) {
      if (solicitud !== solicitudDetalle.current) return;
      setRegistros([]);
      setTotal(0);
      setError(err?.message || "No fue posible cargar la información.");
    } finally {
      if (solicitud === solicitudDetalle.current) setLoading(false);
    }
  }, [pagina, pageSize, qBuscado, filtros.agencia, filtros.asesor, filtros.familia, filtros.condicion_pago, filtros.fecha_desde, filtros.fecha_hasta, filtros.venta_digital]);

  // El detalle se solicita solo cuando el usuario abre la tabla.
  useEffect(() => {
    if (vistaActiva === "detalle") cargarDatos();
  }, [vistaActiva, cargarDatos]);
  useEffect(() => { cargarDashboard(); }, [cargarDashboard]);

  const hayFiltros = useMemo(() => Object.values(filtros).some((v) => String(v || "").trim()), [filtros]);
  // Los KPI se calculan con toda la selección, nunca con la página visible.
  const totalesCalculados = dashboard.totales;

  const utilidad = numero(totalesCalculados.ingresos) - numero(totalesCalculados.costo);
  const margen = totalesCalculados.ingresos ? (utilidad / totalesCalculados.ingresos) * 100 : 0;
  const porcentajeDigital = useMemo(() => {
    return totalesCalculados.unidades_vendidas
      ? (numero(totalesCalculados.ventas_digitales) / numero(totalesCalculados.unidades_vendidas)) * 100
      : 0;
  }, [totalesCalculados]);
  // La penetración utiliza las agregaciones del servidor (Situacao = 'E').
  const penetracionFinanciera = useMemo(() => {
    const condiciones = dashboard?.graficas?.por_condicion_pago || [];
    const totalUnidades = condiciones.reduce((total, item) => total + numero(item.unidades_vendidas), 0);
    let unidadesVW = 0;
    const desgloseCompleto = condiciones.map((item) => {
      const condicion = String(item.condicion_pago || "Sin condición").trim();
      const esVW = condicion.toUpperCase().includes("VW") || condicion.toUpperCase().includes("FINANCI");
      const unidades = numero(item.unidades_vendidas);
      if (esVW) unidadesVW += unidades;
      return {
        condicion, unidades, esVW, ingresos: numero(item.ingresos),
        porcentaje: totalUnidades ? (unidades / totalUnidades) * 100 : 0,
      };
    }).sort((a, b) => b.unidades - a.unidades);
    return {
      porcentajeGlobal: totalUnidades ? (unidadesVW / totalUnidades) * 100 : 0,
      unidadesVW, totalUnidades, desgloseCompleto,
      maxUnidadesCondicion: Math.max(1, ...desgloseCompleto.map((item) => item.unidades)),
    };
  }, [dashboard?.graficas?.por_condicion_pago]);

  // AGRUPACIÓN INTERACTIVA DE MODELOS Y SUS SUB-FAMILIAS (100% ANCHO AL PIE WITH DRILLDOWN)
  const modelosAgrupados = useMemo(() => {
    const mapa = new Map();
    for (const fila of dashboard?.graficas?.por_familia || []) {
      const familia = fila.familia || "DESCONOCIDO";
      const modelo = obtenerGrupoModelo(familia);
      const unidades = numero(fila.unidades_vendidas);
      const ingresos = numero(fila.ingresos);
      const costo = numero(fila.costo);
      if (!mapa.has(modelo)) {
        mapa.set(modelo, { modelo, unidades: 0, ingresos: 0, costo: 0, utilidad: 0, familias: [] });
      }
      const grupo = mapa.get(modelo);
      grupo.unidades += unidades;
      grupo.ingresos += ingresos;
      grupo.costo += costo;
      grupo.utilidad = grupo.ingresos - grupo.costo;
      grupo.familias.push({ familia, unidades, ingresos, costo, utilidad: ingresos - costo });
    }
    const list = [...mapa.values()].sort((a, b) => b.unidades - a.unidades);
    for (const item of list) item.familias.sort((a, b) => b.unidades - a.unidades);
    return { list, maxUnidadesModelo: Math.max(1, ...list.map((item) => item.unidades)) };
  }, [dashboard?.graficas?.por_familia]);

  // Asesores calculados
  const asesoresCalculados = useMemo(() => {
    const lista = dashboard?.graficas?.por_asesor || [];
    return lista.map((item) => ({
      asesor: item.asesor || "SIN ASESOR",
      unidades_vendidas: numero(item.unidades_vendidas),
      ingresos: numero(item.ingresos),
      costo: numero(item.costo),
    })).sort((a, b) => b.unidades_vendidas - a.unidades_vendidas);
  }, [dashboard?.graficas?.por_asesor]);

  const maxUnidadesAsesor = useMemo(() => Math.max(1, ...asesoresCalculados.map((a) => a.unidades_vendidas)), [asesoresCalculados]);
  // Tendencia del Mes: SIEMPRE muestra TODO EL AÑO completo
  const datosMesCompleto = useMemo(() => {
    const porMes = new Map(dashboardAnual.map((item) => [Number(item.mes), item]));
    return Array.from({ length: 12 }, (_, indice) => {
      const mes = indice + 1;
      return porMes.get(mes) || { anio: anioSel, mes, unidades_vendidas: 0, ingresos: 0, costo: 0 };
    }).map((item) => ({
      ...item,
      etiqueta: etiquetaMes(item),
      unidades_vendidas: numero(item?.unidades_vendidas),
      ingresos: numero(item?.ingresos),
      costo: numero(item?.costo),
      utilidad: numero(item?.ingresos) - numero(item?.costo),
    }));
  }, [dashboardAnual, anioSel]);
  const condicionesPago = useMemo(() => {
    const lista = Array.isArray(dashboard?.graficas?.por_condicion_pago) ? dashboard.graficas.por_condicion_pago : [];
    return [...lista]
      .map((item) => ({
        ...item,
        unidades_vendidas: numero(item?.unidades_vendidas),
      }))
      .sort((a, b) => b.unidades_vendidas - a.unidades_vendidas)
      .slice(0, 8);
  }, [dashboard?.graficas?.por_condicion_pago]);
  function cambiarFiltro(campo, value) {
    setPagina(1);
    setFiltros((prev) => ({ ...prev, [campo]: value }));
  }
  function limpiarFiltros() {
    setPagina(1);
    setAnioSel(anioActual);
    setMesSel("sin_filtro");
    setFiltros({
      ...FILTROS_INICIALES,
      agencia: "",
      fecha_desde: `${anioActual}-01-01`,
      fecha_hasta: `${anioActual}-12-31`,
    });
  }
  function aplicarAgencia(agencia) {
    setPagina(1);
    setFiltros((prev) => ({ ...prev, agencia }));
  }
  function aplicarMes(mesIndex) {
    setPagina(1);
    if (mesSel === mesIndex) {
      setMesSel("sin_filtro");
      setFiltros((prev) => ({ ...prev, fecha_desde: "", fecha_hasta: "" }));
      return;
    }
    setMesSel(mesIndex);
    if (mesIndex === null) {
      setFiltros((prev) => ({ ...prev, fecha_desde: `${anioSel}-01-01`, fecha_hasta: `${anioSel}-12-31` }));
      return;
    }
    const rango = obtenerRangoMes(mesIndex + 1, anioSel);
    setFiltros((prev) => ({ ...prev, ...rango }));
  }

  function aplicarAnio(anio) {
    const nuevoAnio = Number(anio);
    setAnioSel(nuevoAnio);
    setPagina(1);

    if (mesSel === "sin_filtro" || mesSel === null) {
      setMesSel(null);
      setFiltros((prev) => ({
        ...prev,
        fecha_desde: `${nuevoAnio}-01-01`,
        fecha_hasta: `${nuevoAnio}-12-31`,
      }));
      return;
    }

    const rango = obtenerRangoMes(mesSel + 1, nuevoAnio);
    setFiltros((prev) => ({ ...prev, ...rango }));
  }

  const chartRefs = useRef({});
  const [exportandoKey, setExportandoKey] = useState(null);
  async function exportarGrafica(key, nombre) {
    const nodo = chartRefs.current[key];
    if (!nodo) return;
    setExportandoKey(key);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const canvas = await html2canvas(nodo, { scale: 1.6, useCORS: true, backgroundColor: "#ffffff", logging: false });
      const enlace = document.createElement("a");
      enlace.download = `${nombre}_${new Date().toISOString().slice(0, 10)}.png`;
      enlace.href = canvas.toDataURL("image/png");
      enlace.click();
    } catch (err) {
      console.error("Error exportando gráfica:", err);
    } finally {
      setExportandoKey(null);
    }
  }
  const totalTabla = total;
  const mesTextoActivo = mesSel === null ? "TODO EL AÑO" : mesSel !== "sin_filtro" ? MESES_CORTOS[mesSel] : "";
  const etiquetaPeriodoActivo = `${mesTextoActivo} ${anioSel}`.trim();
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <main className="space-y-4 py-3 px-1 sm:px-2">
        {/* HEADER TOP BAR */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-[#001E50] tracking-tight">Venta Autos Nuevos</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-[#001E50]/20 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setVistaActiva("detalle")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${vistaActiva === "detalle" ? "bg-[#001E50] text-white shadow" : "text-[#001E50] hover:bg-slate-100"
                  }`}
              >
                <Table2 className="h-3.5 w-3.5" />Tabla
              </button>
              <button
                type="button"
                onClick={() => setVistaActiva("dashboard")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${vistaActiva === "dashboard" ? "bg-[#001E50] text-white shadow" : "text-[#001E50] hover:bg-slate-100"
                  }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />Gráficos
              </button>
            </div>
            <button
              type="button"
              onClick={() => { if (vistaActiva === "detalle") cargarDatos(); cargarDashboard(); }}
              disabled={loading || loadingDashboard}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#001E50]/20 bg-white px-3.5 text-xs font-bold text-[#001E50] shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
            >
              {loading || loadingDashboard ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Actualizar
            </button>
          </div>
        </div>
        {/* HERO CARD BANNER ESTILO VOLVO CRM CON FILTRO INTEGRADO */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#001E50] via-[#0A1340] to-[#050B28] text-white shadow-xl border border-[#001E50]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(22,119,255,0.15),transparent_70%)] pointer-events-none" />
          <Car className="absolute -right-6 -bottom-6 h-56 w-56 text-white/[0.04] pointer-events-none transform -rotate-12" />
          {/* ENCABEZADO Y MÉTRICAS */}
          <div className="relative p-5 pb-4 border-b border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-300/80">
                  VOLKSWAGEN AUTOMOTRIZ R&R · CRM DASHBOARD
                </p>
                <h2 className="text-2xl font-black tracking-tight text-white mt-0.5">
                  Rendimiento de Venta Autos Nuevos
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-white/15">
                  Periodo Activo: <strong className="text-sky-300">{etiquetaPeriodoActivo}</strong>
                </span>
              </div>
            </div>
            {/* MÉTRICAS EN BLOQUES ESTILO VOLVO */}
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              <div className="pt-2 sm:pt-0 sm:px-3 first:px-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300/80 block mb-1">
                  UNIDADES VENDIDAS
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{totalesCalculados.unidades_vendidas}</span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                    {totalesCalculados.ventas_digitales} dig.
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Operaciones acumuladas</p>
              </div>
              <div className="pt-2 sm:pt-0 sm:px-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300/80 block mb-1">
                  INGRESOS TOTALES
                </span>
                <span className="text-2xl font-black text-white block">{money(totalesCalculados.ingresos)}</span>
                <p className="text-[10px] text-slate-400 mt-1">Facturación bruta acumulada</p>
              </div>
              <div className="pt-2 sm:pt-0 sm:px-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300/80 block mb-1">
                  COSTO DE VENTAS
                </span>
                <span className="text-2xl font-black text-slate-200 block">{money(totalesCalculados.costo)}</span>
                <p className="text-[10px] text-slate-400 mt-1">Costo total de las unidades</p>
              </div>
              <div className="pt-2 sm:pt-0 sm:px-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300/80 block mb-1">
                  UTILIDAD ESTIMADA
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">{money(utilidad)}</span>
                </div>
                <p className="text-[10px] text-emerald-300/80 font-bold mt-1">Margen: {margen.toFixed(1)}%</p>
              </div>
              <div className="pt-2 sm:pt-0 sm:px-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300/80 block mb-1">
                  VENTAS DIGITALES
                </span>
                <span className="text-2xl font-black text-sky-300 block">{totalesCalculados.ventas_digitales}</span>
                <p className="text-[10px] text-sky-200/80 mt-1">{porcentajeDigital.toFixed(1)}% penetración digital</p>
              </div>
            </div>
          </div>
          {/* INTEGRACIÓN DE BOTONES DE CONCESIONARIOS EN LA PARTE INFERIOR DEL BANNER HERO */}
          <div className="bg-black/30 backdrop-blur-md px-5 py-2.5 flex flex-wrap items-center gap-2 border-t border-white/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 mr-2">Concesionarios:</span>
            {["Todos", ...(agenciasOpciones || [])].map((agencia) => {
              const activa = agencia === "Todos" ? !filtros.agencia : filtros.agencia === agencia;
              return (
                <button
                  key={agencia}
                  type="button"
                  onClick={() => aplicarAgencia(agencia === "Todos" ? "" : agencia)}
                  className={`inline-flex items-center justify-center rounded-full px-3.5 py-1 text-[11px] font-bold transition-all ${activa
                    ? "bg-white text-[#001E50] shadow-md scale-105"
                    : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                    }`}
                >
                  {agencia === "Todos" ? "Todas las agencias" : agencia}
                </button>
              );
            })}
          </div>
        </div>
        {/* BARRA DE CONTROL DE FECHA (AÑO Y MESES VOLVO STYLE) */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-thin">
            <div className="relative inline-block shrink-0">
              <select
                value={anioSel}
                onChange={(e) => aplicarAnio(e.target.value)}
                className="appearance-none bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 pr-7 text-xs font-bold text-[#001E50] focus:outline-none cursor-pointer hover:bg-slate-200 transition"
              >
                {anios.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-600 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="h-4 w-[1px] bg-slate-200 mx-1 shrink-0" />
            <button
              type="button"
              onClick={() => aplicarMes(null)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${mesSel === null
                ? "bg-[#001E50] text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              Todo el año
            </button>
            {MESES_CORTOS.map((mes, index) => {
              const futuro = anioSel === anioActual && index > mesActual;
              const activo = mesSel === index;
              return (
                <button
                  key={mes}
                  type="button"
                  disabled={futuro}
                  onClick={() => aplicarMes(index)}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${activo
                    ? "bg-[#001E50] text-white shadow"
                    : futuro
                      ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                      : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  {mes}
                </button>
              );
            })}
          </div>
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
            >
              <Eraser className="h-3 w-3" /> Restablecer
            </button>
          )}
        </div>
        {/* FILTROS ADICIONALES SECUNDARIOS */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Buscar</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filtros.q}
                  onChange={(e) => cambiarFiltro("q", e.target.value)}
                  placeholder="Serie, cliente, modelo..."
                  className="h-8 w-full rounded-lg border border-slate-200 pl-8 pr-7 text-xs font-medium text-[#001E50] outline-none focus:border-[#1677FF]"
                />
                {filtros.q && (
                  <button type="button" onClick={() => cambiarFiltro("q", "")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Familia / Modelo</label>
              <select value={filtros.familia} onChange={(e) => cambiarFiltro("familia", e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-[#001E50] outline-none focus:border-[#1677FF]">
                <option value="">Todas las familias</option>
                {(dashboard?.opciones?.familias || []).map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Condición de Pago</label>
              <select value={filtros.condicion_pago} onChange={(e) => cambiarFiltro("condicion_pago", e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-[#001E50] outline-none focus:border-[#1677FF]">
                <option value="">Todas las condiciones</option>
                {(dashboard?.opciones?.condiciones_pago || []).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Asesor</label>
              <select value={filtros.asesor} onChange={(e) => cambiarFiltro("asesor", e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-[#001E50] outline-none focus:border-[#1677FF]">
                <option value="">Todos los asesores</option>
                {(dashboard?.opciones?.asesores || []).map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-400">Tipo de Venta</label>
              <select value={filtros.venta_digital} onChange={(e) => cambiarFiltro("venta_digital", e.target.value)} className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-[#001E50] outline-none focus:border-[#1677FF]">
                <option value="">Todas las ventas</option>
                <option value="1">Venta digital</option>
              </select>
            </div>
          </div>
        </div>
        {/* TABLA O DASHBOARD */}
        {vistaActiva === "detalle" ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <InteractiveTable
              data={registrosFiltrados || []}
              columns={COLUMNAS || []}
              total={totalTabla}
              page={pagina}
              pageSize={pageSize}
              onPageSizeChange={(tamano) => { setPageSize(tamano); setPagina(1); }}
              onPageChange={setPagina}
              loading={loading}
              error={error}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* PANEL IZQUIERDO: DESGLOSE Y RANKING POR ASESOR (FORMATO BARRAS DELGADAS) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                  <Users className="h-3.5 w-3.5" />
                  <span>Desglose por Asesor Comercial</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Top {asesoresCalculados.length} asesores
                </span>
              </div>
              <div className="max-h-[360px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                {asesoresCalculados.length === 0 ? (
                  <p className="py-12 text-center text-xs text-slate-400">Sin registros de asesores en este periodo</p>
                ) : (
                  asesoresCalculados.map((item, idx) => {
                    const pct = Math.min(100, Math.round((item.unidades_vendidas / maxUnidadesAsesor) * 100));
                    return (
                      <div key={item.asesor} className="flex items-center gap-3 text-xs bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100/70 transition">
                        <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-lg bg-[#001E50] text-[10px] font-black text-white">
                          VW{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between font-bold text-[#1A1F3C] text-[11px] mb-1">
                            <span className="truncate">{item.asesor}</span>
                            <span className="shrink-0 text-slate-500 ml-2">{item.unidades_vendidas} unds</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full rounded-full bg-[#001E50] transition-all duration-300" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="shrink-0 font-extrabold text-[#1677FF] text-xs min-w-[85px] text-right">
                          {money(item.ingresos)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {/* PANEL DERECHO SUPERIOR: PENETRACIÓN FINANCIERA (TODOS LOS TIPOS CON BARRAS DELGADAS Y REDONDEADAS) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                    <Landmark className="h-3.5 w-3.5" />
                    <span>Penetración Financiera VW (VWFS)</span>
                  </div>
                  <button type="button" onClick={() => exportarGrafica("penetracion", "penetracion_vwfs")} className="text-slate-400 hover:text-slate-600">
                    <ImageDown className="h-4 w-4" />
                  </button>
                </div>
                {/* BANNER TOTAL PENETRACIÓN % */}
                <div className="mt-3 flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      PENETRACIÓN TOTAL VWFS
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black text-[#001E50]">
                        {penetracionFinanciera.porcentajeGlobal.toFixed(1)}%
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        ({penetracionFinanciera.unidadesVW} de {penetracionFinanciera.totalUnidades} unds)
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#001E50]/10 p-3 text-[#001E50]">
                    <Percent className="h-6 w-6" />
                  </div>
                </div>
              </div>
              {/* LISTADO DE TODOS LOS TIPOS DE FINANCIAMIENTO CON BARRAS DELGADAS E INFORMACIÓN EN LA MISMA LÍNEA */}
              <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {penetracionFinanciera.desgloseCompleto.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">Sin datos de financiamiento en este periodo</p>
                ) : (
                  penetracionFinanciera.desgloseCompleto.map((item) => {
                    const pctBarra = Math.min(100, Math.round((item.unidades / penetracionFinanciera.maxUnidadesCondicion) * 100));
                    return (
                      <div key={item.condicion} className="flex items-center gap-3 text-xs bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-100/70 transition">
                        <span className={`flex h-6 px-2 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white ${item.esVW ? "bg-[#1677FF]" : "bg-slate-600"
                          }`}>
                          {item.esVW ? "VWFS" : "OTRO"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between font-bold text-[#1A1F3C] text-[11px] mb-1">
                            <span className="truncate">{item.condicion}</span>
                            <span className="shrink-0 text-slate-500 ml-2">{item.unidades} unds ({item.porcentaje.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${item.esVW ? "bg-[#1677FF]" : "bg-slate-500"
                              }`} style={{ width: `${pctBarra}%` }} />
                          </div>
                        </div>
                        <span className="shrink-0 font-extrabold text-[#001E50] text-xs min-w-[85px] text-right">
                          {money(item.ingresos)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            {/* SECCIÓN INTERMEDIA: TENDENCIA POR MES (TODO EL AÑO) Y CONDICIONES DE PAGO */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-[#001E50] text-sm">Tendencia de Ventas por Mes (Año Completo)</h3>
                  <p className="text-[10px] font-medium text-slate-400">Histórico de {anioSel} completo</p>
                </div>
                <button type="button" onClick={() => exportarGrafica("mes", "ventas_por_mes")} className="text-slate-400 hover:text-slate-600">
                  <ImageDown className="h-4 w-4" />
                </button>
              </div>
              <div ref={(el) => (chartRefs.current["mes"] = el)} className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={datosMesCompleto}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar yAxisId="left" dataKey="unidades_vendidas" name="Unidades" fill="#001E50" radius={[6, 6, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="ingresos" name="Ingresos" stroke="#1677FF" strokeWidth={2.5} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-[#001E50] text-sm">Distribución de Pagos</h3>
                <button type="button" onClick={() => exportarGrafica("condiciones", "condiciones_pago")} className="text-slate-400 hover:text-slate-600">
                  <ImageDown className="h-4 w-4" />
                </button>
              </div>
              <div ref={(el) => (chartRefs.current["condiciones"] = el)} className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={condicionesPago} dataKey="unidades_vendidas" nameKey="condicion_pago" cx="50%" cy="50%" outerRadius={85} innerRadius={40} paddingAngle={3}>
                      {(condicionesPago || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* ========================================================================= */}
            {/* SECCIÓN INFERIOR 100% ANCHO: MODELOS VENDIDOS BARRAS DELGADAS + INTERACTIVO */}
            {/* ========================================================================= */}
            <div className="lg:col-span-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#001E50] px-3.5 py-1 text-xs font-bold text-white">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Análisis de Modelos y Familias (Desglose de Montos e Utilidades)</span>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  Clica sobre un modelo para desplegar/contraer sus familias
                </span>
              </div>
              {/* LISTA DE BARRAS HORIZONTALES DELGADAS DE MODELOS CON ACORDEÓN DRILLDOWN */}
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                {modelosAgrupados.list.length === 0 ? (
                  <p className="py-12 text-center text-xs text-slate-400">Sin registros de modelos en este periodo</p>
                ) : (
                  modelosAgrupados.list.map((m) => {
                    const estaExpandido = modeloExpandido === m.modelo;
                    const pctBarra = Math.min(100, Math.round((m.unidades / modelosAgrupados.maxUnidadesModelo) * 100));
                    return (
                      <div key={m.modelo} className="rounded-xl border border-slate-200 overflow-hidden transition">
                        {/* FILA PRINCIPAL DEL MODELO (ESTILO ASESORES) */}
                        <div
                          onClick={() => setModeloExpandido(estaExpandido ? null : m.modelo)}
                          className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#001E50] text-white">
                            {estaExpandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between font-extrabold text-[#001E50] text-xs mb-1">
                              <span>{m.modelo}</span>
                              <span className="text-slate-500">{m.unidades} unds</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div className="h-full rounded-full bg-[#001E50] transition-all duration-300" style={{ width: `${pctBarra}%` }} />
                            </div>
                          </div>
                          <div className="text-right shrink-0 min-w-[140px] pl-2 border-l border-slate-200">
                            <div className="text-xs font-black text-[#1677FF]">{money(m.ingresos)}</div>
                            <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                              Ut. {money(m.utilidad)}
                            </div>
                          </div>
                        </div>
                        {/* DESPLIEGUE DRILLDOWN INTERACTIVO DE SUB-FAMILIAS AL HACER CLIC */}
                        {estaExpandido && (
                          <div className="p-3 bg-white border-t border-slate-100 space-y-2 pl-8">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                              Variantes y Familias de {m.modelo}:
                            </p>
                            {m.familias.map((fam) => {
                              const pctSubBarra = Math.min(100, Math.round((fam.unidades / m.unidades) * 100));
                              return (
                                <div key={fam.familia} className="flex items-center gap-3 text-xs bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                                  <Car className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex justify-between font-bold text-slate-700 text-[11px] mb-0.5">
                                      <span className="truncate">{fam.familia}</span>
                                      <span className="shrink-0 text-slate-500 ml-2">{fam.unidades} unds</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                      <div className="h-full rounded-full bg-[#1677FF] transition-all duration-300" style={{ width: `${pctSubBarra}%` }} />
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 min-w-[130px]">
                                    <div className="text-[11px] font-bold text-[#001E50]">{money(fam.ingresos)}</div>
                                    <div className="text-[10px] font-bold text-emerald-600">Ut. {money(fam.utilidad)}</div>
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
          </div>
        )}
      </main>
    </div>
  );
}
