// src/pages/GestionNegocio/CompraRefaccionesGraficos.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  Building2,
  CalendarDays,
  Factory,
  Layers,
  LayoutList,
  LoaderCircle,
  Percent,
  RefreshCw,
  Search,
  Store,
  TrendingDown,
  Undo2,
  Wallet,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  getCompraRefGraficos,
  getCostoVenta,
} from "../../lib/apiCompraRef";


function numero(value) {
  const convertido = Number(value);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
}


function formatoNumero(value) {
  return numero(value).toLocaleString(
    "es-MX"
  );
}


function money(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const convertido = Number(value);

  if (!Number.isFinite(convertido)) {
    return value;
  }

  return new Intl.NumberFormat(
    "es-MX",
    {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(convertido);
}


function nombreCortoDonut(nombre) {
  let limpio = String(
    nombre || ""
  ).trim();

  const esSinTip =
    limpio.endsWith(
      "(sin tip.)"
    );

  let base = limpio
    .replace(
      /\s*\(sin tip\.\)\s*$/,
      ""
    )
    .trim();

  const palabras =
    base.split(/\s+/);

  if (palabras.length > 4) {
    base =
      palabras
        .slice(0, 4)
        .join(" ")
      + "…";
  }

  return esSinTip
    ? `${base} (sin tip.)`
    : base;
}


const MESES = [
  ["01", "Enero"],
  ["02", "Febrero"],
  ["03", "Marzo"],
  ["04", "Abril"],
  ["05", "Mayo"],
  ["06", "Junio"],
  ["07", "Julio"],
  ["08", "Agosto"],
  ["09", "Septiembre"],
  ["10", "Octubre"],
  ["11", "Noviembre"],
  ["12", "Diciembre"],
];


const MESES_MAP =
  Object.fromEntries(
    MESES
  );


const ANIOS = Array.from(
  {
    length:
      new Date().getFullYear()
      - 2004,
  },
  (_, index) =>
    String(
      2005 + index
    )
);


const COLORES_DONUT = [
  "#131E5C",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
  "#FACC15",
];


export default function CompraRefaccionesGraficos() {
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [porMes, setPorMes] =
    useState([]);

  const [porLinea, setPorLinea] =
    useState([]);

  const [
    porLineaNeto,
    setPorLineaNeto,
  ] = useState([]);

  const [
    devoluciones,
    setDevoluciones,
  ] = useState({});

  const [kpi, setKpi] =
    useState({});

  const [
    opciones,
    setOpciones,
  ] = useState({
    agencias: [],
    estados: [],
    proveedores: [],
    proveedores_nombre: [],
  });

  const [anio, setAnio] =
    useState(
      String(
        new Date().getFullYear()
      )
    );

  const [mes, setMes] =
    useState("");

  const [agencia, setAgencia] =
    useState("");

  const [estado, setEstado] =
    useState("");

  const [
    proveedor,
    setProveedor,
  ] = useState("");

  const [
    proveedorNombre,
    setProveedorNombre,
  ] = useState("");

  const [
    qBuscado,
    setQBuscado,
  ] = useState("");

  const [
    qDebounce,
    setQDebounce,
  ] = useState("");

  const [
    costoVenta,
    setCostoVenta,
  ] = useState(null);

  const [
    costoVentaLoading,
    setCostoVentaLoading,
  ] = useState(false);


  // ============================================================
  // DEBOUNCE
  // ============================================================

  useEffect(() => {
    const timeout =
      setTimeout(
        () => {
          setQDebounce(
            qBuscado
          );
        },
        400
      );

    return () => {
      clearTimeout(
        timeout
      );
    };
  }, [qBuscado]);

  const consultar =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await getCompraRefGraficos({
              anio:
                anio ||
                undefined,

              agencia:
                agencia ||
                undefined,

              estado:
                estado ||
                undefined,

              proveedor:
                proveedor ||
                undefined,

              proveedor_nombre:
                proveedorNombre ||
                undefined,

              q:
                qDebounce ||
                undefined,
            });

          setPorMes(
            Array.isArray(
              response?.por_mes
            )
              ? response.por_mes
              : []
          );

          setPorLinea(
            Array.isArray(
              response?.por_linea
            )
              ? response.por_linea
              : []
          );

          setPorLineaNeto(
            Array.isArray(
              response?.por_linea_neto
            )
              ? response.por_linea_neto
              : []
          );

          setDevoluciones(
            response?.devoluciones ||
            {}
          );

          setKpi(
            response?.kpi ||
            {}
          );

          const opts =
            response?.opciones ||
            {};

          setOpciones({
            agencias:
              Array.isArray(
                opts.agencias
              )
                ? opts.agencias
                : [],

            estados:
              Array.isArray(
                opts.estados
              )
                ? opts.estados
                : [],

            proveedores:
              Array.isArray(
                opts.proveedores
              )
                ? opts.proveedores
                : [],

            proveedores_nombre:
              Array.isArray(
                opts.proveedores_nombre
              )
                ? opts.proveedores_nombre
                : [],
          });

        } catch (err) {
          console.error(
            "Error cargando gráficos de compras:",
            err
          );

          setPorMes([]);
          setPorLinea([]);
          setPorLineaNeto([]);
          setDevoluciones({});
          setKpi({});

          setError(
            err?.message ||
            "No fue posible cargar los gráficos de compras."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        anio,
        agencia,
        estado,
        proveedor,
        proveedorNombre,
        qDebounce,
      ]
    );


  useEffect(() => {
    consultar();
  }, [consultar]);


  // ============================================================
  // COSTO DE VENTA
  // ============================================================

  const consultarCostoVenta =
    useCallback(
      async () => {
        setCostoVentaLoading(
          true
        );

        try {
          const response =
            await getCostoVenta({
              agencia:
                agencia ||
                undefined,

              anio:
                anio ||
                undefined,
            });

          setCostoVenta(
            Number(
              response?.costo_venta ||
              0
            )
          );

        } catch (err) {
          console.error(
            "Error cargando costo de venta:",
            err
          );

          setCostoVenta(null);

        } finally {
          setCostoVentaLoading(
            false
          );
        }
      },
      [
        agencia,
        anio,
      ]
    );


  useEffect(() => {
    consultarCostoVenta();
  }, [consultarCostoVenta]);


  // ============================================================
  // FILTROS
  // ============================================================

  function cambiarFiltro(
    setter
  ) {
    return (value) => {
      setter(
        value === "Todos"
          ? ""
          : value
      );
    };
  }


  function cambiarMes(value) {
    setMes(
      value === "Todos"
        ? ""
        : value
    );
  }


  function cambiarCategoriaProveedor(
    value
  ) {
    setProveedor(
      value === "Todos"
        ? ""
        : value
    );

    setProveedorNombre("");
  }


  // ============================================================
  // MESES
  // ============================================================

  const tabla =
    useMemo(() => {
      const mapa =
        new Map();

      for (
        const item of porMes
      ) {
        mapa.set(
          `${item.anio}-${String(
            item.mes
          ).padStart(
            2,
            "0"
          )}`,
          item
        );
      }

      return MESES.map(
        ([
          claveMes,
          nombreMes,
        ]) => {
          const item =
            mapa.get(
              `${anio}-${claveMes}`
            ) || {};

          const otros =
            numero(
              item.compras_otros
            );

          const planta =
            numero(
              item.compras_planta
            );

          return {
            claveMes,
            nombreMes,
            otros,
            planta,

            totalMes:
              otros +
              planta,

            tieneDatos:
              Boolean(
                item.mes ??
                item.anio
              ),
          };
        }
      );
    }, [
      porMes,
      anio,
    ]);


  const totales =
    useMemo(() => {
      return tabla.reduce(
        (
          acumulado,
          fila
        ) => ({
          otros:
            acumulado.otros +
            fila.otros,

          planta:
            acumulado.planta +
            fila.planta,

          totalMes:
            acumulado.totalMes +
            fila.totalMes,

          conDatos:
            acumulado.conDatos +
            (
              fila.tieneDatos
                ? 1
                : 0
            ),
        }),
        {
          otros: 0,
          planta: 0,
          totalMes: 0,
          conDatos: 0,
        }
      );
    }, [tabla]);


  // ============================================================
  // KPIS
  // ============================================================

  const indiceVentaCompra =
    useMemo(() => {
      const neto =
        numero(
          kpi.valor_neto
        );

      const costo =
        numero(
          costoVenta
        );

      if (
        !neto ||
        !costo ||
        costoVentaLoading
      ) {
        return null;
      }

      return costo / neto;
    }, [
      costoVenta,
      costoVentaLoading,
      kpi.valor_neto,
    ]);


  const fidelidadPlanta =
    useMemo(() => {
      const total =
        numero(
          devoluciones
            ?.total
            ?.neto
        );

      const planta =
        numero(
          devoluciones
            ?.planta
            ?.neto
        );

      if (!total) {
        return null;
      }

      return (
        planta /
        total
      ) * 100;
    }, [devoluciones]);


  // ============================================================
  // LÍNEAS
  // ============================================================

  const filasLinea =
    useMemo(() => {
      return [
        ...porLinea,
      ]
        .sort(
          (a, b) =>
            numero(
              b.total
            ) -
            numero(
              a.total
            )
        )
        .slice(
          0,
          5
        )
        .map(
          (item) => ({
            linea:
              String(
                item.linea ??
                ""
              ).trim() ||
              "SIN TIPIFICAR",

            otros:
              numero(
                item.otros
              ),

            planta:
              numero(
                item.planta
              ),

            total:
              numero(
                item.total
              ),
          })
        );
    }, [porLinea]);


  const totalLineas =
    porLinea.length;


  const totalesLinea =
    useMemo(() => {
      return filasLinea.reduce(
        (
          acumulado,
          fila
        ) => ({
          otros:
            acumulado.otros +
            fila.otros,

          planta:
            acumulado.planta +
            fila.planta,

          total:
            acumulado.total +
            fila.total,
        }),
        {
          otros: 0,
          planta: 0,
          total: 0,
        }
      );
    }, [filasLinea]);


  // ============================================================
  // DEVOLUCIONES
  // ============================================================

  const filasDevol =
    useMemo(() => {
      function crearFila(
        clave,
        nombre
      ) {
        return {
          nombre,

          compras:
            numero(
              devoluciones
                ?.[clave]
                ?.compras
            ),

          devol:
            numero(
              devoluciones
                ?.[clave]
                ?.devol
            ),

          neto:
            numero(
              devoluciones
                ?.[clave]
                ?.neto
            ),
        };
      }

      return [
        crearFila(
          "otros",
          "Otro Proveedor"
        ),

        crearFila(
          "planta",
          "Planta"
        ),

        crearFila(
          "total",
          "Total"
        ),
      ];
    }, [devoluciones]);


  // ============================================================
  // DONUT
  // ============================================================

  const datosDonut =
    useMemo(() => {
      const ordenadas =
        porLineaNeto
          .filter(
            (item) =>
              numero(
                item.neto
              ) > 0
          )
          .map(
            (item) => {
              const original =
                String(
                  item.linea ??
                  ""
                ).trim() ||
                "SIN TIPIFICAR";

              const partes =
                original.split(
                  " - "
                );

              const name =
                !item.tipificada &&
                  partes.length ===
                  2 &&
                  partes[0] ===
                  "SIN TIPIFICAR"
                  ? `${partes[1].trim()
                  } (sin tip.)`
                  : original;

              return {
                name,
                fullName:
                  original,

                value:
                  numero(
                    item.neto
                  ),
              };
            }
          )
          .sort(
            (a, b) =>
              b.value -
              a.value
          );

      const top =
        ordenadas.slice(
          0,
          8
        );

      const resto =
        ordenadas
          .slice(8)
          .reduce(
            (
              acumulado,
              item
            ) =>
              acumulado +
              item.value,
            0
          );

      if (resto > 0) {
        top.push({
          name: "Otros",
          fullName:
            "Otros",
          value:
            resto,
        });
      }

      return top;
    }, [porLineaNeto]);


  const topDonut =
    datosDonut[0] ||
    null;


  const totalDonut =
    datosDonut.reduce(
      (
        acumulado,
        item
      ) =>
        acumulado +
        item.value,
      0
    );


  // ============================================================
  // EVOLUCIÓN
  // ============================================================

  const datosEvolucion =
    useMemo(
      () =>
        tabla.map(
          (fila) => ({
            claveMes:
              fila.claveMes,

            nombre:
              fila.nombreMes,

            Planta:
              fila.planta,

            "Otro Proveedor":
              fila.otros,

            Total:
              fila.totalMes,
          })
        ),
      [tabla]
    );


  const indiceMesSeleccionado =
    mes
      ? datosEvolucion.findIndex(
        (fila) =>
          fila.claveMes ===
          mes
      )
      : -1;


  return (
    <div className="min-h-screen">
      <main className="space-y-5 py-4">

        <SubNav />


        {/* ENCABEZADO */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-xl font-extrabold text-[#131E5C]">
              Compra de Refacciones · Gráficos
            </h1>

            <p className="text-xs font-medium text-[#8891AD]">
              Compras por mes y año · PLANTA vs OTRO PROVEEDOR
            </p>
          </div>


          <button
            type="button"
            onClick={consultar}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#131E5C]/20 bg-white px-4 text-sm font-semibold text-[#131E5C] shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
          >
            {loading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Actualizar
          </button>

        </div>


        {/* KPIS */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <KPICard
            icon={TrendingDown}
            label="Costo de venta"
            value={
              costoVentaLoading
                ? "—"
                : money(
                  costoVenta
                )
            }
            sub={`${anio
              }${mes
                ? ` · ${MESES_MAP[
                mes
                ]
                }`
                : ""
              }${agencia
                ? ` · ${agencia}`
                : " · Todas las agencias"
              }`}
            accent="#EF4444"
          />


          <KPICard
            icon={Wallet}
            label="Valor neto compras"
            value={
              loading
                ? "—"
                : money(
                  kpi.valor_neto
                )
            }
            sub="Compras − devoluciones"
            accent="#0D9488"
          />


          <KPICard
            icon={Percent}
            label="Índice venta/compra"
            value={
              loading ||
                costoVentaLoading
                ? "—"
                : indiceVentaCompra ===
                  null
                  ? "—"
                  : `${indiceVentaCompra.toFixed(
                    2
                  )}×`
            }
            sub="Costo de venta ÷ valor neto compras"
            accent="#0EA5E9"
          />


          <KPICard
            icon={Factory}
            label="Fidelidad planta"
            value={
              loading
                ? "—"
                : fidelidadPlanta ===
                  null
                  ? "—"
                  : `${fidelidadPlanta.toFixed(
                    1
                  )}%`
            }
            sub="Planta vs otros proveedores"
            accent="#10B981"
          />

        </div>


        {/* FILTROS */}

        <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            <div className="flex flex-wrap items-center gap-3">

              <CalendarDays className="h-5 w-5 text-[#131E5C]" />

              <span className="font-black uppercase tracking-[0.08em] text-[#131E5C]">
                Periodo
              </span>


              <select
                value={anio}
                onChange={(e) =>
                  cambiarFiltro(
                    setAnio
                  )(
                    e.target.value
                  )
                }
                className="h-9 rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 text-sm font-bold text-[#07184C] outline-none focus:border-[#1555C7]"
              >
                {ANIOS.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>

            </div>


            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={() =>
                  setAgencia("")
                }
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${!agencia
                  ? "bg-[#131E5C] text-white"
                  : "bg-[#EEF2F8] text-[#152754] hover:bg-[#E3E9F3]"
                  }`}
              >
                Todas
              </button>


              {opciones.agencias.map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setAgencia(
                        item
                      )
                    }
                    className={`rounded-lg border border-[#131E5C] px-4 py-2 text-sm font-bold transition ${agencia === item
                      ? "bg-[#131E5C] text-white"
                      : "bg-white text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                      }`}
                  >
                    {item}
                  </button>
                )
              )}

            </div>

          </div>


          {/* MESES */}

          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">

            <button
              type="button"
              onClick={() =>
                cambiarMes(
                  "Todos"
                )
              }
              className={`min-w-[72px] flex-1 rounded-md border border-[#131E5C] px-2.5 py-2 text-[13px] font-bold transition ${!mes
                ? "bg-[#131E5C] text-white shadow"
                : "bg-white text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                }`}
            >
              Todos
            </button>


            {MESES.map(
              (
                [
                  valor,
                  nombre,
                ],
                index
              ) => {
                const futuro =
                  anio ===
                  String(
                    new Date().getFullYear()
                  ) &&
                  index >
                  new Date().getMonth();

                const activo =
                  mes === valor;

                return (
                  <button
                    key={valor}
                    type="button"
                    disabled={futuro}
                    onClick={() =>
                      cambiarMes(
                        valor
                      )
                    }
                    className={`min-w-[72px] flex-1 rounded-md border border-[#131E5C] px-2.5 py-2 text-[13px] font-bold transition ${activo
                      ? "bg-[#131E5C] text-white shadow"
                      : futuro
                        ? "cursor-not-allowed text-[#131E5C]/40"
                        : "bg-white text-[#131E5C] hover:bg-[#131E5C] hover:text-white"
                      }`}
                  >
                    {nombre}
                  </button>
                );
              }
            )}

          </div>


          {/* BUSCADOR */}

          <div className="mt-5 border-t border-[#E6EAF1] pt-4">

            <div className="relative">

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">
                Buscar
              </label>

              <Search className="pointer-events-none absolute left-3 top-[37px] h-4 w-4 text-[#8891AD]" />

              <input
                type="text"
                value={qBuscado}
                onChange={(e) =>
                  setQBuscado(
                    e.target.value
                  )
                }
                placeholder="Ped. compra, código, descripción, nota..."
                className="h-11 w-full rounded-xl border border-[#C8D0DF] bg-[#F7F8FC] pl-10 pr-9 text-sm font-semibold text-[#1A1F3C] outline-none transition placeholder:text-[#C4CADD] focus:border-[#131E5C]/50 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10"
              />

              {qBuscado && (
                <button
                  type="button"
                  onClick={() =>
                    setQBuscado("")
                  }
                  className="absolute right-2 top-[33px] inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

            </div>


            {/* PROVEEDOR / ESTADO */}

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center">

              {opciones.proveedores.length >
                1 && (
                  <FilterButtonGroup
                    label="Proveedor"
                    value={
                      proveedor ||
                      "Todos"
                    }
                    options={[
                      "Todos",
                      ...opciones.proveedores,
                    ]}
                    onChange={
                      cambiarCategoriaProveedor
                    }
                  />
                )}


              {opciones.estados.length >
                0 && (
                  <FilterButtonGroup
                    label="Estado"
                    value={
                      estado ||
                      "Todos"
                    }
                    options={[
                      "Todos",
                      ...opciones.estados,
                    ]}
                    onChange={
                      cambiarFiltro(
                        setEstado
                      )
                    }
                  />
                )}

            </div>


            {proveedor ===
              "OTROS" && (
                <div className="mt-4">

                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">
                    Proveedor en OTROS
                  </label>

                  <select
                    value={
                      proveedorNombre ||
                      "Todos"
                    }
                    onChange={(e) =>
                      cambiarFiltro(
                        setProveedorNombre
                      )(
                        e.target.value
                      )
                    }
                    className="h-10 w-full rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-bold text-[#07184C] outline-none"
                  >
                    <option value="Todos">
                      Todos
                    </option>

                    {opciones.proveedores_nombre.map(
                      (item) => (
                        <option
                          key={
                            item.proveedor
                          }
                          value={
                            item.proveedor
                          }
                        >
                          {item.proveedor}
                        </option>
                      )
                    )}
                  </select>

                </div>
              )}


            {/* RESUMEN */}

            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-[#F7F8FC] px-3 py-2 text-[11px] font-semibold text-slate-500">

              <span className="font-black uppercase tracking-wide text-[#131E5C]/60">
                Coincidencias:
              </span>

              <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]">
                {formatoNumero(
                  kpi.registros
                )}
              </span>


              {agencia && (
                <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]">
                  <Store className="mr-1 inline h-3 w-3" />
                  {agencia}
                </span>
              )}


              {proveedor && (
                <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]">
                  <Building2 className="mr-1 inline h-3 w-3" />
                  {proveedor}
                </span>
              )}

            </div>

          </div>

        </section>


        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}


        {/* TABLAS */}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">

          <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm xl:col-span-3">

            <div className="mb-3 flex items-center gap-3">

              <BarChart3 className="h-5 w-5 text-[#131E5C]" />

              <div>
                <h2 className="text-lg font-extrabold text-[#131E5C]">
                  Compras por Mes y Año
                </h2>

                <p className="text-xs font-semibold text-[#8891AD]">
                  Enero–diciembre de {anio} · importe líquido por fecha de emisión
                </p>
              </div>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full min-w-[520px] border-collapse text-sm">

                <thead>
                  <tr className="bg-[#131E5C] text-white">
                    <th className="border px-3 py-2.5 text-left">
                      AÑO/MES
                    </th>

                    <th className="border px-3 py-2.5 text-right">
                      OTRO PROVEEDOR
                    </th>

                    <th className="border px-3 py-2.5 text-right">
                      PLANTA
                    </th>

                    <th className="border px-3 py-2.5 text-right">
                      TOTAL
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {tabla.map(
                    (fila) => (
                      <tr
                        key={
                          fila.claveMes
                        }
                        className={
                          mes ===
                            fila.claveMes
                            ? "bg-amber-50"
                            : "hover:bg-slate-50"
                        }
                      >
                        <td className="border px-3 py-2 font-bold text-[#152754]">
                          {fila.nombreMes}{" "}
                          <span className="text-[#8891AD]">
                            {anio}
                          </span>
                        </td>

                        <td className="border px-3 py-2 text-right">
                          {money(
                            fila.otros
                          )}
                        </td>

                        <td className="border px-3 py-2 text-right">
                          {money(
                            fila.planta
                          )}
                        </td>

                        <td className="border px-3 py-2 text-right font-bold text-[#131E5C]">
                          {money(
                            fila.totalMes
                          )}
                        </td>
                      </tr>
                    )
                  )}

                </tbody>


                <tfoot>
                  <tr className="bg-[#131E5C] text-white">

                    <td className="border px-3 py-2.5 font-extrabold">
                      TOTAL
                    </td>

                    <td className="border px-3 py-2.5 text-right font-extrabold">
                      {money(
                        totales.otros
                      )}
                    </td>

                    <td className="border px-3 py-2.5 text-right font-extrabold">
                      {money(
                        totales.planta
                      )}
                    </td>

                    <td className="border px-3 py-2.5 text-right font-extrabold">
                      {money(
                        totales.totalMes
                      )}
                    </td>

                  </tr>
                </tfoot>

              </table>

            </div>

          </section>


          <div className="flex flex-col gap-4 xl:col-span-2">

            <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">

              <div className="mb-4 flex items-center gap-3">

                <Layers className="h-5 w-5 text-[#131E5C]" />

                <div>
                  <h2 className="text-lg font-extrabold text-[#131E5C]">
                    Compra por Línea
                  </h2>

                  <p className="text-xs font-semibold text-[#8891AD]">
                    Top 5 de {totalLineas} líneas
                  </p>
                </div>

              </div>


              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>
                    <tr className="bg-[#131E5C] text-white">
                      <th className="px-2 py-2 text-left">
                        LÍNEA
                      </th>

                      <th className="px-2 py-2 text-right">
                        OTROS
                      </th>

                      <th className="px-2 py-2 text-right">
                        PLANTA
                      </th>

                      <th className="px-2 py-2 text-right">
                        TOTAL
                      </th>
                    </tr>
                  </thead>


                  <tbody>

                    {filasLinea.map(
                      (fila) => (
                        <tr
                          key={
                            fila.linea
                          }
                          className="border-b"
                        >
                          <td className="px-2 py-2 font-bold">
                            {fila.linea}
                          </td>

                          <td className="px-2 py-2 text-right">
                            {money(
                              fila.otros
                            )}
                          </td>

                          <td className="px-2 py-2 text-right">
                            {money(
                              fila.planta
                            )}
                          </td>

                          <td className="px-2 py-2 text-right font-bold">
                            {money(
                              fila.total
                            )}
                          </td>
                        </tr>
                      )
                    )}

                  </tbody>


                  <tfoot>
                    <tr className="bg-[#131E5C] text-white">

                      <td className="px-2 py-2 font-bold">
                        Total
                      </td>

                      <td className="px-2 py-2 text-right font-bold">
                        {money(
                          totalesLinea.otros
                        )}
                      </td>

                      <td className="px-2 py-2 text-right font-bold">
                        {money(
                          totalesLinea.planta
                        )}
                      </td>

                      <td className="px-2 py-2 text-right font-bold">
                        {money(
                          totalesLinea.total
                        )}
                      </td>

                    </tr>
                  </tfoot>

                </table>

              </div>

            </section>


            <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">

              <div className="mb-4 flex items-center gap-3">
                <Undo2 className="h-5 w-5 text-[#131E5C]" />

                <h2 className="text-lg font-extrabold text-[#131E5C]">
                  Devoluciones y Traspasos
                </h2>
              </div>


              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>
                    <tr className="bg-[#131E5C] text-white">
                      <th className="px-2 py-2 text-left">
                        FUENTE
                      </th>

                      <th className="px-2 py-2 text-right">
                        COMPRAS
                      </th>

                      <th className="px-2 py-2 text-right">
                        DEVOL.
                      </th>

                      <th className="px-2 py-2 text-right">
                        NETO
                      </th>
                    </tr>
                  </thead>


                  <tbody>

                    {filasDevol.map(
                      (fila) => (
                        <tr
                          key={
                            fila.nombre
                          }
                          className="border-b"
                        >
                          <td className="px-2 py-2 font-bold">
                            {fila.nombre}
                          </td>

                          <td className="px-2 py-2 text-right">
                            {money(
                              fila.compras
                            )}
                          </td>

                          <td className="px-2 py-2 text-right">
                            {money(
                              fila.devol
                            )}
                          </td>

                          <td className="px-2 py-2 text-right font-bold">
                            {money(
                              fila.neto
                            )}
                          </td>
                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </section>

          </div>

        </div>


        {/* GRÁFICAS */}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

          <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">

            <h2 className="mb-4 text-lg font-extrabold text-[#131E5C]">
              Valor Neto Compras por Línea
            </h2>


            {datosDonut.length >
              0 ? (

              <div className="relative">

                <ResponsiveContainer
                  width="100%"
                  height={320}
                >
                  <PieChart>
                    <Pie
                      data={
                        datosDonut
                      }
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                    >
                      {datosDonut.map(
                        (
                          item,
                          index
                        ) => (
                          <Cell
                            key={
                              item.name
                            }
                            fill={
                              COLORES_DONUT[
                              index %
                              COLORES_DONUT.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      formatter={
                        money
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>


                {topDonut && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">

                    <span className="max-w-[150px] text-center text-sm font-black text-[#131E5C]">
                      {nombreCortoDonut(
                        topDonut.name
                      )}
                    </span>

                    <strong className="text-xl text-[#10B981]">
                      {totalDonut
                        ? `${(
                          topDonut.value /
                          totalDonut *
                          100
                        ).toFixed(
                          1
                        )}%`
                        : "—"}
                    </strong>

                  </div>
                )}

              </div>

            ) : (
              <p className="py-8 text-center text-slate-400">
                Sin información
              </p>
            )}

          </section>


          <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm xl:col-span-2">

            <h2 className="mb-4 text-lg font-extrabold text-[#131E5C]">
              Evolución de Compras por Mes
            </h2>


            <ResponsiveContainer
              width="100%"
              height={340}
            >
              <ComposedChart
                data={
                  datosEvolucion
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="nombre"
                />

                <YAxis
                  tickFormatter={
                    money
                  }
                  width={95}
                />


                {indiceMesSeleccionado >=
                  0 && (
                    <ReferenceArea
                      x1={
                        indiceMesSeleccionado -
                        0.5
                      }
                      x2={
                        indiceMesSeleccionado +
                        0.5
                      }
                      fill="#F59E0B"
                      fillOpacity={
                        0.12
                      }
                    />
                  )}


                <Tooltip
                  formatter={
                    money
                  }
                />

                <Legend />


                <Bar
                  dataKey="Otro Proveedor"
                  stackId="a"
                  fill="#0EA5E9"
                />

                <Bar
                  dataKey="Planta"
                  stackId="a"
                  fill="#131E5C"
                />

                <Line
                  dataKey="Total"
                  stroke="#F59E0B"
                  strokeWidth={3}
                />

              </ComposedChart>
            </ResponsiveContainer>

          </section>

        </div>

      </main>
    </div>
  );
}


function SubNav() {
  const tabs = [
    {
      to:
        "/gestion_negocio/compra_refacciones",
      label:
        "Listado",
      icon:
        LayoutList,
    },
    {
      to:
        "/gestion_negocio/compra_refacciones/graficos",
      label:
        "Gráficos",
      icon:
        BarChart3,
    },
  ];

  return (
    <nav className="flex w-fit items-center gap-1 rounded-xl border border-[#C8D0DF] bg-white p-1 shadow-sm">

      {tabs.map(
        (tab) => {
          const Icon =
            tab.icon;

          return (
            <NavLink
              key={
                tab.to
              }
              to={
                tab.to
              }
              className={({
                isActive,
              }) =>
                `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${isActive
                  ? "bg-[#131E5C] text-white"
                  : "text-[#131E5C] hover:bg-[#131E5C]/5"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          );
        }
      )}

    </nav>
  );
}


function KPICard({
  icon,
  label,
  value,
  sub,
  accent,
}) {
  const Icon = icon;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E7EAF3] bg-white p-4 shadow-sm">

      <div className="flex items-center gap-2">

        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            backgroundColor:
              `${accent}1A`,
            color:
              accent,
          }}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>

        <span className="text-xs font-bold uppercase tracking-wide text-[#8891AD]">
          {label}
        </span>

      </div>


      <div className="mt-3 truncate text-[26px] font-black text-[#131E5C]">
        {value}
      </div>


      {sub && (
        <div
          className="mt-2 truncate text-[11px] font-semibold"
          style={{
            color:
              accent,
          }}
        >
          {sub}
        </div>
      )}

    </div>
  );
}


function FilterButtonGroup({
  label,
  value,
  options,
  onChange,
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 lg:flex-row lg:items-center">

      <span className="shrink-0 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/40">
        {label}
      </span>


      <div className="flex flex-1 flex-wrap gap-1.5">

        {options.map(
          (option) => {
            const active =
              value === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() =>
                  onChange(
                    option
                  )
                }
                className={`inline-flex h-9 min-w-[90px] flex-1 items-center justify-center rounded-full px-3 text-xs font-bold transition ${active
                  ? "bg-[#131E5C] text-white"
                  : "bg-[#131E5C]/5 text-[#131E5C] hover:bg-[#131E5C]/10"
                  }`}
              >
                {option}
              </button>
            );
          }
        )}

      </div>

    </div>
  );
}