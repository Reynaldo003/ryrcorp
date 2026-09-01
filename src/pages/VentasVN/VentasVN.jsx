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

import { http, buildQuery } from "../../lib/apiClient";
import vwDark from "../../assets/vw_dark.png";


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
// COMPONENTE PRINCIPAL
// ==========================================================

export default function VentasVN() {

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


  // ----------------------------------------------------------
  // Usamos filtrosDraft para que escribir en un campo
  // no consulte inmediatamente la API.
  // ----------------------------------------------------------

  const [filtrosDraft, setFiltrosDraft] =
    useState(FILTROS_INICIALES);

  // Estos son los filtros que realmente se mandan al backend.
  const [filtros, setFiltros] =
    useState(FILTROS_INICIALES);


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
                Ventas VN
              </h1>

              <p
                className="text-xs"
                style={{
                  color: C.muted,
                }}
              >
                Consulta de información VW_VN
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
            onClick={cargarDatos}
            disabled={loading}
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

            {loading ? (
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
            TARJETAS
        ================================================== */}

        <div className="grid gap-4 md:grid-cols-4">

          <StatCard
            label="Registros encontrados"
            value={total.toLocaleString("es-MX")}
            icon={Database}
          />

          <StatCard
            label="Página actual"
            value={`${pagina} / ${totalPaginas}`}
          />

          <StatCard
            label="Registros visibles"
            value={registros.length}
          />

          <StatCard
            label="Registros por página"
            value={pageSize}
          />

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


          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">


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


            {/* AGENCIA */}

            <input
              type="text"
              value={filtrosDraft.agencia}
              onChange={(e) =>
                cambiarFiltro(
                  "agencia",
                  e.target.value,
                )
              }
              placeholder="Agencia"
              className={inputClass}
            />


            {/* ASESOR */}

            <input
              type="text"
              value={filtrosDraft.asesor}
              onChange={(e) =>
                cambiarFiltro(
                  "asesor",
                  e.target.value,
                )
              }
              placeholder="Asesor"
              className={inputClass}
            />


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


        {/* ==================================================
            ERROR
        ================================================== */}

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