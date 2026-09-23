// src/pages/GestionNegocio/CompraRefacciones.jsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CircleDollarSign,
  Database,
  LoaderCircle,
  Package,
  RefreshCw,
  Search,
  Store,
  X,
} from "lucide-react";

import {
  getCompraRefOpciones,
  getCompraRefTipificada,
} from "../../lib/apiCompraRef";

import InteractiveTable from "../VentasVN/InteractiveTable";


// ============================================================
// HELPERS
// ============================================================

function numero(value) {
  const convertido =
    Number(value);

  return Number.isFinite(
    convertido
  )
    ? convertido
    : 0;
}


function formatoNumero(value) {
  return numero(
    value
  ).toLocaleString(
    "es-MX",
    {
      maximumFractionDigits:
        2,
    }
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

  const convertido =
    Number(value);

  if (
    !Number.isFinite(
      convertido
    )
  ) {
    return value;
  }

  return new Intl.NumberFormat(
    "es-MX",
    {
      style:
        "currency",

      currency:
        "MXN",

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    convertido
  );
}


// ============================================================
// COLUMNAS
// ============================================================

const COLUMNAS = [
  {
    key:
      "agencia",

    label:
      "Agencia",
  },

  {
    key:
      "nrnota",

    label:
      "Nota",

    tipo:
      "numero",
  },

  {
    key:
      "serie",

    label:
      "Serie",
  },

  {
    key:
      "nrpedunpar",

    label:
      "Pedido",
  },

  {
    key:
      "qtprodutos",

    label:
      "Cantidad",

    tipo:
      "numero",
  },

  {
    key:
      "proveedor",

    label:
      "Proveedor",
  },

  {
    key:
      "dtemissao",

    label:
      "Fecha emisión",

    tipo:
      "fecha",
  },

  {
    key:
      "dtentrada",

    label:
      "Fecha entrada",

    tipo:
      "fecha",
  },

  {
    key:
      "subtotal",

    label:
      "Subtotal",

    tipo:
      "moneda",
  },

  {
    key:
      "total",

    label:
      "Total",

    tipo:
      "moneda",
  },
];


// ============================================================
// COMPONENTE
// ============================================================

export default function CompraRefacciones() {
  const [
    datos,
    setDatos,
  ] = useState([]);

  const [
    totalRegistros,
    setTotalRegistros,
  ] = useState(0);

  const [
    metricas,
    setMetricas,
  ] = useState({
    registros: 0,
    cantidad_total: 0,
    subtotal: 0,
    total: 0,
  });

  const [
    opciones,
    setOpciones,
  ] = useState({
    agencias: [],
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    agencia,
    setAgencia,
  ] = useState("");

  const [
    fechaDesde,
    setFechaDesde,
  ] = useState("");

  const [
    fechaHasta,
    setFechaHasta,
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
    pagina,
    setPagina,
  ] = useState(1);

  const [
    pageSize,
    setPageSize,
  ] = useState(50);


  // ==========================================================
  // DEBOUNCE BUSCADOR
  // ==========================================================

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
  }, [
    qBuscado,
  ]);


  // ==========================================================
  // CARGAR AGENCIAS
  // ==========================================================

  useEffect(() => {
    getCompraRefOpciones()
      .then(
        (response) => {
          setOpciones({
            agencias:
              Array.isArray(
                response
                  ?.agencias
              )
                ? response.agencias
                : [],
          });
        }
      )
      .catch(
        (err) => {
          console.error(
            "Error cargando agencias:",
            err
          );
        }
      );
  }, []);


  // ==========================================================
  // PARAMETROS
  //
  // Estos son los ÚNICOS filtros que manda el front.
  //
  // NO manda:
  // - Serie
  // - TpItensNFE
  // - SitNF
  // ==========================================================

  const parametros =
    useMemo(
      () => ({
        agencia:
          agencia ||
          undefined,

        fecha_desde:
          fechaDesde ||
          undefined,

        fecha_hasta:
          fechaHasta ||
          undefined,

        q:
          qDebounce ||
          undefined,
      }),
      [
        agencia,
        fechaDesde,
        fechaHasta,
        qDebounce,
      ]
    );


  // ==========================================================
  // CONSULTAR
  // ==========================================================

  const consultar =
    useCallback(
      async () => {
        setLoading(
          true
        );

        setError(
          ""
        );

        try {
          const response =
            await getCompraRefTipificada({
              ...parametros,

              page:
                pagina,

              page_size:
                pageSize,
            });

          setDatos(
            Array.isArray(
              response
                ?.results
            )
              ? response.results
              : []
          );

          setTotalRegistros(
            Number(
              response
                ?.count ||
              0
            )
          );

          setMetricas({
            registros:
              Number(
                response
                  ?.metricas
                  ?.registros ||
                0
              ),

            cantidad_total:
              Number(
                response
                  ?.metricas
                  ?.cantidad_total ||
                0
              ),

            subtotal:
              Number(
                response
                  ?.metricas
                  ?.subtotal ||
                0
              ),

            total:
              Number(
                response
                  ?.metricas
                  ?.total ||
                0
              ),
          });

        } catch (err) {
          console.error(
            "Error cargando compras de refacciones:",
            err
          );

          setDatos(
            []
          );

          setTotalRegistros(
            0
          );

          setMetricas({
            registros: 0,
            cantidad_total: 0,
            subtotal: 0,
            total: 0,
          });

          setError(
            err?.message ||
            "No fue posible cargar las compras de refacciones."
          );

        } finally {
          setLoading(
            false
          );
        }
      },
      [
        parametros,
        pagina,
        pageSize,
      ]
    );


  useEffect(() => {
    consultar();
  }, [
    consultar,
  ]);


  // ==========================================================
  // PAGINACION
  // ==========================================================

  const totalPaginas =
    useMemo(
      () =>
        Math.max(
          1,
          Math.ceil(
            totalRegistros /
            pageSize
          )
        ),
      [
        totalRegistros,
        pageSize,
      ]
    );


  // ==========================================================
  // AGENCIA
  // ==========================================================

  function cambiarAgencia(
    value
  ) {
    setAgencia(
      value
    );

    setPagina(
      1
    );
  }


  // ==========================================================
  // LIMPIAR
  // ==========================================================

  function limpiarFiltros() {
    setAgencia(
      ""
    );

    setFechaDesde(
      ""
    );

    setFechaHasta(
      ""
    );

    setQBuscado(
      ""
    );

    setPagina(
      1
    );
  }


  return (
    <div className="min-h-screen">

      <main className="space-y-5 py-4">


        {/* ===================================================
            ENCABEZADO
        =================================================== */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h1 className="text-xl font-extrabold text-[#131E5C]">
              Compra de Refacciones
            </h1>

            <p className="text-xs font-medium text-[#8891AD]">
              Facturas de refacciones
            </p>

          </div>


          <button
            type="button"
            onClick={
              consultar
            }
            disabled={
              loading
            }
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


        {/* ===================================================
            KPIS
        =================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <KPICard
            icon={
              CircleDollarSign
            }
            label="Subtotal"
            value={
              loading
                ? "—"
                : money(
                  metricas.subtotal
                )
            }
            sub="Subtotal de facturas"
            accent="#10B981"
          />


          <KPICard
            icon={
              CircleDollarSign
            }
            label="Total"
            value={
              loading
                ? "—"
                : money(
                  metricas.total
                )
            }
            sub="Total de facturas"
            accent="#0EA5E9"
          />


          <KPICard
            icon={
              Package
            }
            label="Cantidad"
            value={
              loading
                ? "—"
                : formatoNumero(
                  metricas.cantidad_total
                )
            }
            sub="QtProdutos"
            accent="#F59E0B"
          />


          <KPICard
            icon={
              Database
            }
            label="Registros"
            value={
              loading
                ? "—"
                : formatoNumero(
                  metricas.registros
                )
            }
            sub="Facturas encontradas"
            accent="#131E5C"
          />

        </div>


        {/* ===================================================
            FILTROS
        =================================================== */}

        <section className="rounded-xl border border-[#9EA9BD] bg-white p-4 shadow-sm">


          {/* =================================================
              FECHAS
          ================================================= */}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            <div>

              <label className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/60">

                <CalendarDays className="h-4 w-4" />

                Fecha Entrada desde

              </label>


              <input
                type="date"
                value={
                  fechaDesde
                }
                max={
                  fechaHasta ||
                  undefined
                }
                onChange={
                  (e) => {
                    setFechaDesde(
                      e.target.value
                    );

                    setPagina(
                      1
                    );
                  }
                }
                className="h-11 w-full rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-semibold text-[#07184C] outline-none transition focus:border-[#1555C7]"
              />

            </div>


            <div>

              <label className="mb-1.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#131E5C]/60">

                <CalendarDays className="h-4 w-4" />

                Fecha Entrada hasta

              </label>


              <input
                type="date"
                value={
                  fechaHasta
                }
                min={
                  fechaDesde ||
                  undefined
                }
                onChange={
                  (e) => {
                    setFechaHasta(
                      e.target.value
                    );

                    setPagina(
                      1
                    );
                  }
                }
                className="h-11 w-full rounded-lg border border-[#C8D0DF] bg-[#F7F8FC] px-3 font-semibold text-[#07184C] outline-none transition focus:border-[#1555C7]"
              />

            </div>

          </div>


          {/* =================================================
              AGENCIA
          ================================================= */}

          <div className="mt-5 border-t border-[#E6EAF1] pt-4">

            <div className="mb-3 flex items-center gap-2">

              <Store className="h-4 w-4 text-[#131E5C]" />

              <span className="text-[11px] font-black uppercase tracking-wider text-[#131E5C]/60">
                Agencia
              </span>

            </div>


            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={
                  () =>
                    cambiarAgencia(
                      ""
                    )
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
                    key={
                      item
                    }
                    type="button"
                    onClick={
                      () =>
                        cambiarAgencia(
                          item
                        )
                    }
                    className={`rounded-lg border border-[#131E5C] px-4 py-2 text-sm font-bold transition ${agencia ===
                      item
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


          {/* =================================================
              BUSCADOR
          ================================================= */}

          <div className="mt-5 border-t border-[#E6EAF1] pt-4">

            <div className="relative">

              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8891AD]">
                Buscar
              </label>


              <Search className="pointer-events-none absolute left-3 top-[37px] h-4 w-4 text-[#8891AD]" />


              <input
                type="text"
                value={
                  qBuscado
                }
                onChange={
                  (e) => {
                    setQBuscado(
                      e.target.value
                    );

                    setPagina(
                      1
                    );
                  }
                }
                placeholder="Nota, pedido, proveedor, agencia..."
                className="h-11 w-full rounded-xl border border-[#C8D0DF] bg-[#F7F8FC] pl-10 pr-9 text-sm font-semibold text-[#1A1F3C] outline-none transition placeholder:text-[#C4CADD] focus:border-[#131E5C]/50 focus:bg-white focus:ring-4 focus:ring-[#131E5C]/10"
              />


              {qBuscado && (

                <button
                  type="button"
                  onClick={
                    () => {
                      setQBuscado(
                        ""
                      );

                      setPagina(
                        1
                      );
                    }
                  }
                  className="absolute right-2 top-[33px] inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                >

                  <X className="h-3.5 w-3.5" />

                </button>

              )}

            </div>

          </div>


          {/* =================================================
              FILTROS ACTIVOS
          ================================================= */}

          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-[#F7F8FC] px-3 py-2 text-[11px] font-semibold text-slate-500">

            <span className="font-black uppercase tracking-wide text-[#131E5C]/60">
              Coincidencias:
            </span>


            <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]">

              {formatoNumero(
                totalRegistros
              )}

            </span>


            {agencia && (

              <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]">

                <Store className="mr-1 inline h-3 w-3" />

                {agencia}

              </span>

            )}


            {fechaDesde && (

              <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]">

                Desde{" "}
                {fechaDesde}

              </span>

            )}


            {fechaHasta && (

              <span className="rounded-full bg-[#131E5C]/[0.07] px-2.5 py-1 font-bold text-[#131E5C]">

                Hasta{" "}
                {fechaHasta}

              </span>

            )}


            {(
              agencia ||
              fechaDesde ||
              fechaHasta ||
              qBuscado
            ) && (

                <button
                  type="button"
                  onClick={
                    limpiarFiltros
                  }
                  className="ml-auto rounded-lg px-3 py-1.5 font-bold text-red-500 transition hover:bg-red-50"
                >
                  Limpiar filtros
                </button>

              )}

          </div>

        </section>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

            {error}

          </div>

        )}


        {/* ===================================================
            TABLA
        =================================================== */}

        <InteractiveTable
          rows={
            datos
          }
          columns={
            COLUMNAS
          }
          storageKey="compra-refacciones-facturas"
          resetColumnsOnMount
          total={
            totalRegistros
          }
          loading={
            loading
          }
          pageSize={
            pageSize
          }
          onPageSizeChange={
            (size) => {
              setPagina(
                1
              );

              setPageSize(
                size
              );
            }
          }
          page={
            pagina
          }
          totalPages={
            totalPaginas
          }
          onPrev={
            () =>
              setPagina(
                (actual) =>
                  Math.max(
                    1,
                    actual - 1
                  )
              )
          }
          onNext={
            () =>
              setPagina(
                (actual) =>
                  Math.min(
                    totalPaginas,
                    actual + 1
                  )
              )
          }
          detail={
            false
          }
          rowKey="rowid__"
          exportName="Compra Refacciones"
          exportFile={
            `compra_refacciones_${new Date()
              .toISOString()
              .slice(
                0,
                10
              )}`
          }
        />

      </main>

    </div>
  );
}


// ============================================================
// KPI
// ============================================================

function KPICard({
  icon,
  label,
  value,
  sub,
  accent,
}) {
  const Icon =
    icon;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md"
      style={{
        borderColor:
          "#E7EAF3",
      }}
    >

      <div
        className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full opacity-[0.12]"
        style={{
          backgroundColor:
            accent,
        }}
      />


      <div className="relative">

        <div className="flex items-center gap-2">

          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor:
                `${accent}1A`,

              color:
                accent,
            }}
          >

            <Icon className="h-[18px] w-[18px]" />

          </span>


          <span className="truncate text-xs font-bold uppercase tracking-wide text-[#8891AD]">

            {label}

          </span>

        </div>


        <div
          className="mt-3 truncate text-[26px] font-black leading-none tracking-tight text-[#131E5C]"
          title={
            String(
              value
            )
          }
        >

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

    </div>
  );
}