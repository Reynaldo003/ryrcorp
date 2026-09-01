
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { http, buildQuery } from "../../lib/apiClient";
import vwDark from "../../assets/vw_dark.png";
import { getVentasVNDashboard, } from "../../lib/apiVentasVN";

const C = {
  navy: "#131E5C",
  navyDark: "#0A1340",
  surface: "#F7F8FC",
  border: "#E4E7F0",
  muted: "#8891AD",
  text: "#1A1F3C",
  textSub: "#515778",
};


// ==========================================================
// COLUMNAS DE VW_VN
//
// Aquí tenemos las 30 columnas que devuelve nuestro backend.
// "key" es el nombre recibido desde la API.
// "label" es el nombre que verá el usuario.
// "tipo" nos permite formatear dinero, fechas, etc.
// ==========================================================

const COLUMNAS = [
  { key: "serie", label: "Serie" },
  { key: "nr_nota", label: "Nr. Nota" },
  { key: "tp_producto", label: "Tipo Producto" },
  { key: "producto_servicio", label: "Producto / Servicio" },

  {
    key: "precio_unitario",
    label: "Precio Unitario",
    tipo: "moneda",
  },

  {
    key: "valor_bruto_item",
    label: "Valor Bruto",
    tipo: "moneda",
  },

  { key: "influye_estadistica", label: "Influye Estadística" },

  {
    key: "valor_descuento_item",
    label: "Descuento",
    tipo: "moneda",
  },

  { key: "codigo_condicion_pago", label: "Código Cond. Pago" },

  {
    key: "valor_factura",
    label: "Valor Factura",
    tipo: "moneda",
  },

  {
    key: "valor_factura_sin_iva",
    label: "Factura sin IVA",
    tipo: "moneda",
  },

  {
    key: "valor_compra",
    label: "Valor Compra",
    tipo: "moneda",
  },

  {
    key: "isan",
    label: "ISAN",
    tipo: "moneda",
  },

  {
    key: "iva",
    label: "IVA",
    tipo: "moneda",
  },

  { key: "codigo_entidad", label: "Código Entidad" },

  {
    key: "fecha_emision",
    label: "Fecha Emisión",
    tipo: "fecha",
  },

  { key: "situacion", label: "Situación" },
  { key: "tipo_nf", label: "Tipo NF" },
  { key: "nr_mov", label: "Nr. Movimiento" },

  {
    key: "fecha_ultima_venta",
    label: "Última Venta",
    tipo: "fecha",
  },

  { key: "razon_social", label: "Razón Social" },
  { key: "tipo_persona", label: "Tipo Persona" },

  {
    key: "valor_total_productos",
    label: "Total Productos",
    tipo: "moneda",
  },

  { key: "codigo_marca", label: "Código Marca" },
  { key: "nombre_marca", label: "Marca" },
  { key: "nombre_familia", label: "Familia / Modelo" },
  { key: "condicion_uso", label: "Condición Uso" },
  { key: "nombre_condicion_pago", label: "Condición Pago" },
  { key: "asesor", label: "Asesor" },
  { key: "agencia", label: "Agencia" },
];


const FILTROS_INICIALES = {
  q: "",
  agencia: "",
  asesor: "",
  familia: "",
  condicion_pago: "",
  fecha_desde: "",
  fecha_hasta: "",
};


// ==========================================================
// FORMATEADORES
// ==========================================================

function money(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const numero = Number(value);

  if (!Number.isFinite(numero)) {
    return value;
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
}


function formatDate(value) {
  if (!value) return "—";

  const partes = String(value).split("-");

  if (partes.length !== 3) {
    return value;
  }

  const [year, month, day] = partes;

  return `${day}/${month}/${year}`;
}


function formatCell(value, tipo) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (tipo === "moneda") {
    return money(value);
  }

  if (tipo === "fecha") {
    return formatDate(value);
  }

  return String(value);
}

// ==========================================================
// HELPERS DEL DASHBOARD
// ==========================================================

const MESES_CORTOS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const PIE_COLORS = [
  "#131E5C",
  "#2445A2",
  "#3D63C8",
  "#6681D4",
  "#8B9DDE",
  "#AEB9E8",
  "#42526E",
  "#7A869A",
];

function numero(value) {
  return Number(value || 0);
}

function formatoNumero(value) {
  return numero(value).toLocaleString("es-MX");
}

function formatoCompacto(value) {
  return new Intl.NumberFormat("es-MX", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(numero(value));
}

function etiquetaMes(item) {
  const mes = Number(item?.mes || 0);
  const anio = item?.anio || "";

  if (mes < 1 || mes > 12) {
    return item?.periodo || "";
  }

  return `${MESES_CORTOS[mes - 1]} ${anio}`;
}

// ==========================================================
// COMPONENTE PRINCIPAL
// ==========================================================

export default function VentasVN() {

  // ========================================================
  // DASHBOARD
  // ========================================================

  const [dashboard, setDashboard] = useState({
    totales: {
      productos: 0,
      unidades_vendidas: 0,
      ingresos: 0,
      costo: 0,
    },

    graficas: {
      por_mes: [],
      por_asesor: [],
      por_familia: [],
      por_condicion_pago: [],
    },

    opciones: {
      agencias: [],
      asesores: [],
      familias: [],
      condiciones_pago: [],
    },
  });

  const [loadingDashboard, setLoadingDashboard] =
    useState(false);

  const [errorDashboard, setErrorDashboard] =
    useState("");

  // Registros recibidos desde el backend.
  const [registros, setRegistros] = useState([]);

  // Total real de registros encontrados.
  const [total, setTotal] = useState(0);

  // Página actual.
  const [pagina, setPagina] = useState(1);

  // Cantidad de registros que pedimos al backend.
  const [pageSize, setPageSize] = useState(50);

  // Indica si estamos esperando respuesta de la API.
  const [loading, setLoading] = useState(false);

  // Mensaje en caso de error.
  const [error, setError] = useState("");

  const [vistaActiva, setVistaActiva] =
    useState("dashboard");

  // ----------------------------------------------------------
  // Usamos filtrosDraft para que escribir en un campo
  // no consulte inmediatamente la API.
  // ----------------------------------------------------------

  const [filtrosDraft, setFiltrosDraft] =
    useState(FILTROS_INICIALES);

  // Estos son los filtros que realmente se mandan al backend.
  const [filtros, setFiltros] =
    useState(FILTROS_INICIALES);


  // ========================================================
  // CARGAR DASHBOARD
  // ========================================================

  async function cargarDashboard() {
    setLoadingDashboard(true);
    setErrorDashboard("");

    try {
      const response = await getVentasVNDashboard({
        fecha_desde: filtros.fecha_desde,
        fecha_hasta: filtros.fecha_hasta,
        agencia: filtros.agencia,
        asesor: filtros.asesor,
        familia: filtros.familia,
        condicion_pago: filtros.condicion_pago,
      });

      setDashboard({
        totales: {
          productos:
            Number(response?.totales?.productos || 0),

          unidades_vendidas:
            Number(
              response?.totales?.unidades_vendidas || 0
            ),

          ingresos:
            Number(response?.totales?.ingresos || 0),

          costo:
            Number(response?.totales?.costo || 0),
        },

        graficas: {
          por_mes:
            response?.graficas?.por_mes || [],

          por_asesor:
            response?.graficas?.por_asesor || [],

          por_familia:
            response?.graficas?.por_familia || [],

          por_condicion_pago:
            response?.graficas?.por_condicion_pago || [],
        },

        opciones: {
          agencias:
            response?.opciones?.agencias || [],

          asesores:
            response?.opciones?.asesores || [],

          familias:
            response?.opciones?.familias || [],

          condiciones_pago:
            response?.opciones?.condiciones_pago || [],
        },
      });

    } catch (err) {
      console.error(
        "Error cargando dashboard VW_VN:",
        err,
      );

      setErrorDashboard(
        err?.message ||
        "No se pudo cargar el dashboard de Autos Nuevos."
      );

    } finally {
      setLoadingDashboard(false);
    }
  }

  // ==========================================================
  // CARGA DE DATOS
  // ==========================================================

  async function cargarDatos() {
    setLoading(true);
    setError("");

    try {

      // buildQuery convierte nuestro objeto en algo como:
      //
      // ?page=1&page_size=50&agencia=VW%20Cordoba
      //
      const query = buildQuery({
        page: pagina,
        page_size: pageSize,

        q: filtros.q,

        agencia: filtros.agencia,
        asesor: filtros.asesor,
        familia: filtros.familia,
        condicion_pago: filtros.condicion_pago,

        fecha_desde: filtros.fecha_desde,
        fecha_hasta: filtros.fecha_hasta,
      });


      // Consultamos el endpoint Django.
      //
      // apiClient ya se encarga de enviar
      // el token de autenticación del CRM.
      //
      const response = await http(
        `/ventas-vn/api/${query}`,
      );


      // Nuestro backend devuelve:
      //
      // {
      //   count: 1000,
      //   page: 1,
      //   page_size: 50,
      //   results: [...]
      // }
      //
      const items = Array.isArray(response?.results)
        ? response.results
        : [];


      setRegistros(items);

      setTotal(
        Number(response?.count || 0),
      );

    } catch (err) {

      console.error(
        "Error cargando VW_VN:",
        err,
      );

      setRegistros([]);
      setTotal(0);

      setError(
        err?.message ||
        "No fue posible cargar la información de VW_VN.",
      );

    } finally {
      setLoading(false);
    }
  }


  // ==========================================================
  // REACT ACTUALIZA LOS DATOS AUTOMÁTICAMENTE
  //
  // Cada vez que cambia:
  // - página
  // - cantidad por página
  // - filtros aplicados
  //
  // volvemos a consultar el backend.
  // ==========================================================

  useEffect(() => {
    cargarDatos();
  }, [
    pagina,
    pageSize,
    filtros,
  ]);

  useEffect(() => {
    cargarDashboard();
  }, [filtros]);

  // ==========================================================
  // PAGINACIÓN
  // ==========================================================

  const totalPaginas = useMemo(() => {
    return Math.max(
      1,
      Math.ceil(total / pageSize),
    );
  }, [total, pageSize]);

  // ==========================================================
  // FILTROS
  // ==========================================================

  function cambiarFiltro(campo, value) {
    setFiltrosDraft((prev) => ({
      ...prev,
      [campo]: value,
    }));
  }


  function aplicarFiltros(event) {
    event?.preventDefault();

    setPagina(1);

    setFiltros({
      ...filtrosDraft,
    });
  }


  function limpiarFiltros() {
    setFiltrosDraft(FILTROS_INICIALES);
    setFiltros(FILTROS_INICIALES);
    setPagina(1);
  }


  const hayFiltros = Object.values(filtros).some(
    (value) => String(value || "").trim(),
  );

  // ========================================================
  // DATOS PREPARADOS PARA RECHARTS
  // ========================================================

  const datosMes = useMemo(() => {
    return (dashboard.graficas.por_mes || []).map((item) => ({
      ...item,

      etiqueta: etiquetaMes(item),

      productos: numero(item.productos),

      unidades_vendidas:
        numero(item.unidades_vendidas),

      ingresos:
        numero(item.ingresos),

      costo:
        numero(item.costo),
    }));
  }, [dashboard.graficas.por_mes]);


  // Mostramos los 10 asesores con más unidades vendidas.
  const topAsesores = useMemo(() => {
    return [...(dashboard.graficas.por_asesor || [])]
      .map((item) => ({
        ...item,
        unidades_vendidas:
          numero(item.unidades_vendidas),
        ingresos:
          numero(item.ingresos),
        costo:
          numero(item.costo),
      }))
      .sort(
        (a, b) =>
          b.unidades_vendidas -
          a.unidades_vendidas
      )
      .slice(0, 10);
  }, [dashboard.graficas.por_asesor]);


  // Familias/modelos con más unidades vendidas.
  const topFamilias = useMemo(() => {
    return [...(dashboard.graficas.por_familia || [])]
      .map((item) => ({
        ...item,
        unidades_vendidas:
          numero(item.unidades_vendidas),
        ingresos:
          numero(item.ingresos),
        costo:
          numero(item.costo),
      }))
      .sort(
        (a, b) =>
          b.unidades_vendidas -
          a.unidades_vendidas
      )
      .slice(0, 10);
  }, [dashboard.graficas.por_familia]);


  const condicionesPago = useMemo(() => {
    return [...(dashboard.graficas.por_condicion_pago || [])]
      .map((item) => ({
        ...item,
        unidades_vendidas:
          numero(item.unidades_vendidas),
      }))
      .sort(
        (a, b) =>
          b.unidades_vendidas -
          a.unidades_vendidas
      )
      .slice(0, 8);
  }, [dashboard.graficas.por_condicion_pago]);

  const totalCondicionesPago = useMemo(() => {
    return condicionesPago.reduce(
      (total, item) =>
        total + numero(item.unidades_vendidas),
      0
    );
  }, [condicionesPago]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: C.surface,
      }}
    >

      {/* ====================================================
          ENCABEZADO
      ==================================================== */}

      <header
        className="sticky top-0 z-30 border-b bg-white"
        style={{
          borderColor: `${C.navy}22`,
        }}
      >
        <div className="flex min-h-[76px] items-center gap-4 px-4 md:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <img
              src={vwDark}
              alt="Volkswagen"
              className="h-16 w-16 object-contain md:h-20 md:w-20"
            />

            <div>
              <h1
                className="text-xl font-extrabold tracking-tight md:text-2xl"
                style={{
                  color: C.navy,
                }}
              >
                Autos Nuevos
              </h1>

              <p
                className="text-xs"
                style={{
                  color: C.muted,
                }}
              >
                Dashboard comercial Volkswagen
              </p>
            </div>

          </div>


          <div
            className="hidden h-[2px] flex-1 rounded-full lg:block"
            style={{
              backgroundColor: C.navy,
            }}
          />


          <button
            type="button"
            onClick={() => {
              cargarDatos();
              cargarDashboard();
            }}
            disabled={loading || loadingDashboard}
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              bg-white
              px-4
              py-2
              text-sm
              font-bold
              transition
              hover:bg-slate-50
              disabled:opacity-50
            "
            style={{
              borderColor: C.navy,
              color: C.navy,
            }}
          >

            {loading || loadingDashboard ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Actualizar

          </button>

        </div>
      </header>


      <main className="space-y-5 px-4 py-6 sm:px-6 lg:px-8">

        {/* ==================================================
    VISTAS
================================================== */}

        <div
          className="
    flex
    items-center
    justify-between
    rounded-2xl
    border
    bg-white
    px-4
    py-3
    shadow-sm
  "
          style={{
            borderColor: C.border,
          }}
        >
          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                setVistaActiva("dashboard")
              }
              className="
        rounded-xl
        border
        px-5
        py-2
        text-sm
        font-bold
        transition
      "
              style={{
                borderColor: C.navy,
                backgroundColor:
                  vistaActiva === "dashboard"
                    ? C.navy
                    : "#FFFFFF",
                color:
                  vistaActiva === "dashboard"
                    ? "#FFFFFF"
                    : C.navy,
              }}
            >
              Dashboard
            </button>


            <button
              type="button"
              onClick={() =>
                setVistaActiva("detalle")
              }
              className="
        rounded-xl
        border
        px-5
        py-2
        text-sm
        font-bold
        transition
      "
              style={{
                borderColor: C.navy,
                backgroundColor:
                  vistaActiva === "detalle"
                    ? C.navy
                    : "#FFFFFF",
                color:
                  vistaActiva === "detalle"
                    ? "#FFFFFF"
                    : C.navy,
              }}
            >
              Detalle
            </button>

          </div>

          <p className="hidden text-xs text-slate-400 md:block">
            Información comercial de Autos Nuevos
          </p>

        </div>


        {/* ==================================================
            TARJETAS
        ================================================== */}

        {vistaActiva === "dashboard" && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <StatCard
              label="Unidades vendidas"
              value={
                loadingDashboard
                  ? "..."
                  : dashboard.totales.unidades_vendidas.toLocaleString(
                    "es-MX"
                  )
              }
              icon={Database}
            />

            <StatCard
              label="Ingresos"
              value={
                loadingDashboard
                  ? "..."
                  : money(dashboard.totales.ingresos)
              }
            />

            <StatCard
              label="Costo"
              value={
                loadingDashboard
                  ? "..."
                  : money(dashboard.totales.costo)
              }
            />

            <StatCard
              label="Productos / operaciones"
              value={
                loadingDashboard
                  ? "..."
                  : dashboard.totales.productos.toLocaleString(
                    "es-MX"
                  )
              }
            />

          </div>
        )}

        {/* =====================================================
    SELECTOR DE AGENCIA
===================================================== */}

        <div
          className="
    rounded-2xl
    border
    bg-white
    px-4
    py-4
    shadow-sm
  "
          style={{
            borderColor: C.border,
          }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            <div className="shrink-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{
                  color: C.muted,
                }}
              >
                Agencia
              </p>

              <p
                className="text-sm font-bold"
                style={{
                  color: C.text,
                }}
              >
                Filtrar resultados
              </p>
            </div>


            <div className="flex flex-1 flex-wrap gap-2 lg:justify-end">

              {/* TODAS LAS AGENCIAS */}

              <button
                type="button"
                onClick={() => {
                  setPagina(1);

                  setFiltrosDraft((prev) => ({
                    ...prev,
                    agencia: "",
                  }));

                  setFiltros((prev) => ({
                    ...prev,
                    agencia: "",
                  }));
                }}
                className="
          rounded-xl
          border
          px-4
          py-2
          text-xs
          font-bold
          transition
        "
                style={{
                  borderColor: C.navy,

                  backgroundColor:
                    !filtros.agencia
                      ? C.navy
                      : "#FFFFFF",

                  color:
                    !filtros.agencia
                      ? "#FFFFFF"
                      : C.navy,
                }}
              >
                Todas
              </button>


              {/* AGENCIAS TRAÍDAS DIRECTAMENTE DE VW_VN */}

              {dashboard.opciones.agencias.map(
                (agencia) => {

                  const activa =
                    filtros.agencia === agencia;

                  return (
                    <button
                      key={agencia}
                      type="button"
                      onClick={() => {
                        setPagina(1);

                        setFiltrosDraft((prev) => ({
                          ...prev,
                          agencia,
                        }));

                        setFiltros((prev) => ({
                          ...prev,
                          agencia,
                        }));
                      }}
                      className="
                rounded-xl
                border
                px-4
                py-2
                text-xs
                font-bold
                transition
              "
                      style={{
                        borderColor: C.navy,

                        backgroundColor:
                          activa
                            ? C.navy
                            : "#FFFFFF",

                        color:
                          activa
                            ? "#FFFFFF"
                            : C.navy,
                      }}
                    >
                      {agencia}
                    </button>
                  );
                }
              )}

            </div>

          </div>
        </div>
        {/* ==================================================
            FILTROS
        ================================================== */}

        <form
          onSubmit={aplicarFiltros}
          className="
            rounded-2xl
            border
            bg-white
            p-4
            shadow-sm
          "
          style={{
            borderColor: C.border,
          }}
        >

          <div className="mb-3 flex items-center gap-2">

            <Filter
              className="h-4 w-4"
              style={{
                color: C.navy,
              }}
            />

            <h2
              className="text-sm font-bold"
              style={{
                color: C.text,
              }}
            >
              Filtros
            </h2>

          </div>


          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">


            {/* BÚSQUEDA GENERAL */}

            <div className="relative">

              <Search
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="text"
                value={filtrosDraft.q}
                onChange={(e) =>
                  cambiarFiltro(
                    "q",
                    e.target.value,
                  )
                }
                placeholder="Serie, cliente, modelo..."
                className="
                  h-10
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-9
                  pr-3
                  text-sm
                  outline-none
                  transition
                  focus:border-[#131E5C]/40
                  focus:ring-2
                  focus:ring-[#131E5C]/10
                "
              />

            </div>

            {/* FAMILIA / MODELO */}

            <select
              value={filtrosDraft.familia}
              onChange={(e) =>
                cambiarFiltro(
                  "familia",
                  e.target.value,
                )
              }
              className={inputClass}
            >
              <option value="">
                Todas las familias
              </option>

              {dashboard.opciones.familias.map(
                (familia) => (
                  <option
                    key={familia}
                    value={familia}
                  >
                    {familia}
                  </option>
                )
              )}

            </select>


            {/* CONDICIÓN DE PAGO */}

            <select
              value={filtrosDraft.condicion_pago}
              onChange={(e) =>
                cambiarFiltro(
                  "condicion_pago",
                  e.target.value,
                )
              }
              className={inputClass}
            >
              <option value="">
                Todas las condiciones de pago
              </option>

              {dashboard.opciones.condiciones_pago.map(
                (condicion) => (
                  <option
                    key={condicion}
                    value={condicion}
                  >
                    {condicion}
                  </option>
                )
              )}

            </select>

            {/* ASESOR */}

            <select
              value={filtrosDraft.asesor}
              onChange={(e) =>
                cambiarFiltro(
                  "asesor",
                  e.target.value,
                )
              }
              className={inputClass}
            >
              <option value="">
                Todos los asesores
              </option>

              {dashboard.opciones.asesores.map(
                (asesor) => (
                  <option
                    key={asesor}
                    value={asesor}
                  >
                    {asesor}
                  </option>
                )
              )}

            </select>

            {/* FECHA DESDE */}

            <input
              type="date"
              value={filtrosDraft.fecha_desde}
              onChange={(e) =>
                cambiarFiltro(
                  "fecha_desde",
                  e.target.value,
                )
              }
              className={inputClass}
            />


            {/* FECHA HASTA */}

            <input
              type="date"
              value={filtrosDraft.fecha_hasta}
              onChange={(e) =>
                cambiarFiltro(
                  "fecha_hasta",
                  e.target.value,
                )
              }
              className={inputClass}
            />

          </div>


          <div className="mt-3 flex flex-wrap justify-end gap-2">

            {hayFiltros && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="
                  inline-flex
                  h-9
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-slate-200
                  px-3
                  text-xs
                  font-semibold
                  text-slate-600
                  transition
                  hover:bg-slate-50
                "
              >
                <X className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}


            <button
              type="submit"
              className="
                inline-flex
                h-9
                items-center
                gap-2
                rounded-xl
                bg-[#131E5C]
                px-4
                text-xs
                font-bold
                text-white
                transition
                hover:bg-[#0A1340]
              "
            >
              <Search className="h-3.5 w-3.5" />
              Aplicar filtros
            </button>

          </div>

        </form>

        {/* =====================================================
    DASHBOARD DE GRÁFICAS
===================================================== */}
        {vistaActiva === "dashboard" && (
          <div className="grid gap-5 xl:grid-cols-2">

            {/* ===================================================
      1. INGRESOS Y COSTO POR MES
  =================================================== */}

            <ChartCard
              title="Ingresos y costo por mes"
              subtitle="Evolución mensual según DtEmissao"
            >
              <div className="h-[340px]">

                {loadingDashboard ? (
                  <ChartLoading />
                ) : datosMes.length === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={datosMes}
                      margin={{
                        top: 10,
                        right: 20,
                        bottom: 10,
                        left: 10,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E4E7F0"
                      />

                      <XAxis
                        dataKey="etiqueta"
                        tick={{
                          fontSize: 11,
                          fill: "#8891AD",
                        }}
                      />

                      <YAxis
                        tickFormatter={formatoCompacto}
                        tick={{
                          fontSize: 11,
                          fill: "#8891AD",
                        }}
                        width={65}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          money(value),
                          name,
                        ]}
                      />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="ingresos"
                        name="Ingresos"
                        stroke="#131E5C"
                        strokeWidth={3}
                        dot={{
                          r: 3,
                        }}
                        activeDot={{
                          r: 5,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="costo"
                        name="Costo"
                        stroke="#6681D4"
                        strokeWidth={3}
                        dot={{
                          r: 3,
                        }}
                      />

                    </LineChart>
                  </ResponsiveContainer>
                )}

              </div>
            </ChartCard>


            {/* ===================================================
      2. UNIDADES POR ASESOR
  =================================================== */}

            <ChartCard
              title="Unidades vendidas por asesor"
              subtitle="Top 10 asesores por unidades"
            >
              <div className="h-[340px]">

                {loadingDashboard ? (
                  <ChartLoading />
                ) : topAsesores.length === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={topAsesores}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 25,
                        left: 20,
                        bottom: 5,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#E4E7F0"
                      />

                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{
                          fontSize: 11,
                          fill: "#8891AD",
                        }}
                      />

                      <YAxis
                        type="category"
                        dataKey="asesor"
                        width={130}
                        tick={{
                          fontSize: 10,
                          fill: "#515778",
                        }}
                      />

                      <Tooltip
                        formatter={(value) => [
                          formatoNumero(value),
                          "Unidades vendidas",
                        ]}
                      />

                      <Bar
                        dataKey="unidades_vendidas"
                        name="Unidades vendidas"
                        fill="#131E5C"
                        radius={[0, 6, 6, 0]}
                      />

                    </BarChart>
                  </ResponsiveContainer>
                )}

              </div>
            </ChartCard>


            {/* ===================================================
      3. UNIDADES POR FAMILIA / MODELO
  =================================================== */}

            <ChartCard
              title="Unidades por familia"
              subtitle="Modelos con mayor número de unidades vendidas"
            >
              <div className="h-[340px]">

                {loadingDashboard ? (
                  <ChartLoading />
                ) : topFamilias.length === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={topFamilias}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 25,
                        left: 35,
                        bottom: 5,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#E4E7F0"
                      />

                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{
                          fontSize: 11,
                          fill: "#8891AD",
                        }}
                      />

                      <YAxis
                        type="category"
                        dataKey="familia"
                        width={155}
                        tick={{
                          fontSize: 10,
                          fill: "#515778",
                        }}
                      />

                      <Tooltip
                        formatter={(value) => [
                          formatoNumero(value),
                          "Unidades vendidas",
                        ]}
                      />

                      <Bar
                        dataKey="unidades_vendidas"
                        name="Unidades vendidas"
                        fill="#2445A2"
                        radius={[0, 6, 6, 0]}
                      />

                    </BarChart>
                  </ResponsiveContainer>
                )}

              </div>
            </ChartCard>


            {/* ===================================================
      4. CONDICIÓN DE PAGO
  =================================================== */}

            <ChartCard
              title="Condición de pago"
              subtitle="Distribución de unidades vendidas por NmCondPgto"
            >
              <div className="relative h-[340px]">

                {loadingDashboard ? (
                  <ChartLoading />
                ) : condicionesPago.length === 0 ? (
                  <ChartEmpty />
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>

                      <Pie
                        data={condicionesPago}
                        dataKey="unidades_vendidas"
                        nameKey="condicion_pago"
                        cx="50%"
                        cy="43%"
                        innerRadius={72}
                        outerRadius={110}
                        paddingAngle={2}
                      >

                        {condicionesPago.map(
                          (item, index) => (
                            <Cell
                              key={`${item.condicion_pago}-${index}`}
                              fill={
                                PIE_COLORS[
                                index %
                                PIE_COLORS.length
                                ]
                              }
                            />
                          )
                        )}

                      </Pie>

                      <Tooltip
                        formatter={(value, name) => [
                          `${formatoNumero(value)} unidades`,
                          name,
                        ]}
                      />

                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{
                          fontSize: 11,
                        }}
                      />

                    </PieChart>
                  </ResponsiveContainer>
                )}
                {!loadingDashboard && condicionesPago.length > 0 && (
                  <div
                    className="
        pointer-events-none
        absolute
        left-1/2
        top-[43%]
        -translate-x-1/2
        -translate-y-1/2
        text-center
        "
                  >
                    <p className="text-2xl font-bold text-[#131E5C]">
                      {formatoNumero(totalCondicionesPago)}
                    </p>

                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8891AD]">
                      Unidades
                    </p>
                  </div>
                )}
              </div>
            </ChartCard>

          </div>
        )}
        {/* ==================================================
            ERROR
        ================================================== */}
        {errorDashboard && (
          <div className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            font-medium
            text-red-700
        ">
            {errorDashboard}
          </div>
        )}
        {error && (
          <div className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            font-medium
            text-red-700
          ">
            {error}
          </div>
        )}


        {/* ==================================================
            TABLA
        ================================================== */}
        {vistaActiva === "detalle" && (
          <div
            className="
            overflow-hidden
            rounded-2xl
            border
            bg-white
            shadow-sm
          "
            style={{
              borderColor: C.border,
            }}
          >

            {/* La tabla tiene scroll horizontal porque
              VW_VN contiene 30 columnas. */}

            <div className="max-h-[65vh] overflow-auto">

              <table className="min-w-max border-collapse">

                <thead className="sticky top-0 z-20">

                  <tr
                    style={{
                      backgroundColor: C.surface,
                    }}
                  >

                    {COLUMNAS.map((columna) => (

                      <th
                        key={columna.key}
                        className="
                        whitespace-nowrap
                        border-b
                        border-r
                        border-slate-200
                        px-4
                        py-3
                        text-left
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-slate-500
                      "
                      >
                        {columna.label}
                      </th>

                    ))}

                  </tr>

                </thead>


                <tbody>

                  {/* =================================================
                    LOADER
                ================================================= */}

                  {loading ? (

                    Array.from({
                      length: 10,
                    }).map((_, index) => (

                      <tr key={index}>

                        {COLUMNAS.map((columna) => (

                          <td
                            key={columna.key}
                            className="
                            border-b
                            border-r
                            border-slate-100
                            px-4
                            py-3
                          "
                          >
                            <div className="
                            h-4
                            w-24
                            animate-pulse
                            rounded
                            bg-slate-200
                          " />
                          </td>

                        ))}

                      </tr>

                    ))

                  ) : registros.length === 0 ? (

                    /* ===============================================
                       SIN RESULTADOS
                    =============================================== */

                    <tr>

                      <td
                        colSpan={COLUMNAS.length}
                        className="
                        px-6
                        py-16
                        text-center
                      "
                      >

                        <Database
                          className="
                          mx-auto
                          h-8
                          w-8
                          text-slate-300
                        "
                        />

                        <p className="
                        mt-3
                        text-sm
                        font-semibold
                        text-slate-700
                      ">
                          No se encontraron registros
                        </p>

                        <p className="
                        mt-1
                        text-xs
                        text-slate-400
                      ">
                          Modifica los filtros o actualiza la consulta.
                        </p>

                      </td>

                    </tr>

                  ) : (

                    /* ===============================================
                       DATOS REALES
                    =============================================== */

                    registros.map((registro, index) => (

                      <tr
                        key={`${registro.nr_mov || ""}-${registro.nr_nota || ""}-${registro.serie || ""}-${index}`}
                        className="
                        transition-colors
                        odd:bg-white
                        even:bg-slate-50/40
                        hover:bg-blue-50/40
                      "
                      >

                        {COLUMNAS.map((columna) => {

                          const value = formatCell(
                            registro[columna.key],
                            columna.tipo,
                          );

                          return (
                            <td
                              key={columna.key}
                              title={value}
                              className="
                              max-w-[300px]
                              whitespace-nowrap
                              border-b
                              border-r
                              border-slate-100
                              px-4
                              py-3
                              text-xs
                              text-slate-700
                            "
                            >

                              <div className="max-w-[280px] truncate">
                                {value}
                              </div>

                            </td>
                          );
                        })}

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>
            {/* ==================================================
              PAGINACIÓN
          ================================================== */}

            <div
              className="
              flex
              flex-col
              gap-3
              border-t
              px-4
              py-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
              style={{
                borderColor: C.border,
                backgroundColor: C.surface,
              }}
            >

              <div className="flex items-center gap-3">

                <p className="text-xs text-slate-500">

                  Mostrando{" "}

                  <span className="font-bold text-slate-700">
                    {registros.length}
                  </span>

                  {" "}de{" "}

                  <span className="font-bold text-slate-700">
                    {total.toLocaleString("es-MX")}
                  </span>

                  {" "}registros

                </p>


                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPagina(1);
                    setPageSize(
                      Number(e.target.value),
                    );
                  }}
                  className="
                  h-8
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-2
                  text-xs
                  font-semibold
                  text-slate-600
                  outline-none
                "
                >

                  <option value={25}>
                    25 por página
                  </option>

                  <option value={50}>
                    50 por página
                  </option>

                  <option value={100}>
                    100 por página
                  </option>

                </select>

              </div>


              <div className="flex items-center gap-2">

                <button
                  type="button"
                  disabled={
                    loading ||
                    pagina <= 1
                  }
                  onClick={() =>
                    setPagina((prev) =>
                      Math.max(1, prev - 1),
                    )
                  }
                  className={paginationButton}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>


                <span className="
                min-w-[100px]
                text-center
                text-xs
                font-semibold
                text-slate-600
              ">
                  Página {pagina} de {totalPaginas}
                </span>


                <button
                  type="button"
                  disabled={
                    loading ||
                    pagina >= totalPaginas
                  }
                  onClick={() =>
                    setPagina((prev) =>
                      Math.min(
                        totalPaginas,
                        prev + 1,
                      ),
                    )
                  }
                  className={paginationButton}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
// ==========================================================
// COMPONENTES PEQUEÑOS
// ==========================================================

function StatCard({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="
      rounded-2xl
      border
      border-[#E4E7F0]
      bg-white
      p-5
      shadow-sm
    ">

      <div className="
        flex
        items-start
        justify-between
        gap-3
      ">

        <div>

          <p className="
            text-[11px]
            font-semibold
            uppercase
            tracking-widest
            text-[#8891AD]
          ">
            {label}
          </p>

          <p className="
            mt-2
            text-2xl
            font-bold
            text-[#1A1F3C]
          ">
            {value}
          </p>

        </div>


        {Icon && (
          <div className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-[#131E5C]/10
          ">
            <Icon className="
              h-5
              w-5
              text-[#131E5C]
            " />
          </div>
        )}

      </div>

    </div>
  );
}

// ==========================================================
// TARJETA PARA GRÁFICAS
// ==========================================================

function ChartCard({
  title,
  subtitle,
  children,
}) {
  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-[#E4E7F0]
        bg-white
        shadow-sm
      "
    >

      <div className="
        border-b
        border-[#E4E7F0]
        px-5
        py-4
      ">

        <h3 className="
          text-sm
          font-bold
          text-[#1A1F3C]
        ">
          {title}
        </h3>

        {subtitle && (
          <p className="
            mt-1
            text-xs
            text-[#8891AD]
          ">
            {subtitle}
          </p>
        )}

      </div>

      <div className="p-4">
        {children}
      </div>

    </section>
  );
}


// ==========================================================
// CARGANDO GRÁFICA
// ==========================================================

function ChartLoading() {
  return (
    <div className="
      flex
      h-full
      items-center
      justify-center
    ">
      <div className="
        flex
        items-center
        gap-2
        text-sm
        font-medium
        text-[#8891AD]
      ">
        <LoaderCircle className="h-4 w-4 animate-spin" />

        Cargando información...
      </div>
    </div>
  );
}


// ==========================================================
// SIN DATOS
// ==========================================================

function ChartEmpty() {
  return (
    <div className="
      flex
      h-full
      flex-col
      items-center
      justify-center
      text-center
    ">

      <Database className="
        h-7
        w-7
        text-[#C8CEDF]
      " />

      <p className="
        mt-2
        text-sm
        font-semibold
        text-[#515778]
      ">
        Sin información
      </p>

      <p className="
        mt-1
        text-xs
        text-[#8891AD]
      ">
        No existen datos para los filtros seleccionados.
      </p>

    </div>
  );
}

const inputClass = `
  h-10
  w-full
  rounded-xl
  border
  border-slate-200
  bg-white
  px-3
  text-sm
  text-slate-700
  outline-none
  transition
  focus:border-[#131E5C]/40
  focus:ring-2
  focus:ring-[#131E5C]/10
`;


const paginationButton = `
  inline-flex
  h-8
  w-8
  items-center
  justify-center
  rounded-lg
  border
  border-slate-200
  bg-white
  text-slate-600
  transition
  hover:bg-slate-50
  disabled:cursor-not-allowed
  disabled:opacity-40
`;