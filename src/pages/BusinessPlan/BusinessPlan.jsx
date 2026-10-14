import React, { useEffect, useRef, useState } from "react";

import { Plus, Trash2, Pencil, Copy, MoreVertical, Download, FileSpreadsheet, LayoutDashboard, Table2, CalendarDays, RotateCcw, X, AlertTriangle, CheckCircle2, Layers3, Database, Info, FolderPlus, ListTree } from "lucide-react";

import vwDark from "../../assets/vw_dark.png";



const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const NEGOCIOS_INICIALES = ["Ventas", "Marketing", "Servicio", "Refacciones"];

const ALMACEN_NEGOCIOS = "businessPlan_negocios_v1";

const ALMACEN = "businessPlan_tableros_v2";
const ALMACEN_PAPELERA = "businessPlan_papelera_v1";
const ALMACEN_TEMAS = "businessPlan_temas_v1";

const NUEVO_ID = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;



function plantillaInicial() {

  return {

    filas: [

      { id: 1, kpi: "Creación de leads", descripcion: "Cantidad de prospectos generados", valores: ["155", "155", "", "", "", "", "", "", "", "", "", ""], extras: {} },

      { id: 2, kpi: "Ventas", descripcion: "Cantidad de vehículos vendidos", valores: ["37", "39", "42", "", "", "", "", "", "", "", "", ""], extras: {} },

      { id: 3, kpi: "Desocupación", descripcion: "Indicador configurable", valores: Array(12).fill(""), extras: {} },

    ],

    columnas: [],

  };

}



function cargarNegocios() {

  try {

    const guardados = JSON.parse(localStorage.getItem(ALMACEN_NEGOCIOS) || "null");

    if (Array.isArray(guardados)) {

      const limpios = guardados.filter((n) => typeof n === "string" && n.trim());

      return [...new Set(limpios)];

    }

  } catch (error) {

    console.error("No se pudieron recuperar los negocios:", error);

  }

  return [...NEGOCIOS_INICIALES];

}



function nombreDisponible(nombre, lista, nombreActual = null) {

  return !lista.some((n) => n !== nombreActual && n.toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es"));

}



function cargarTableros() {

  try {

    const guardado = JSON.parse(localStorage.getItem(ALMACEN) || "null");

    if (guardado && typeof guardado === "object" && !Array.isArray(guardado)) return guardado;



    // Migrar automáticamente los datos que ya se capturaron en la versión anterior.

    const filasViejas = JSON.parse(localStorage.getItem("businessPlan_filas") || "null");

    const columnasViejas = JSON.parse(localStorage.getItem("businessPlan_columnas") || "null");

    if (Array.isArray(filasViejas) || Array.isArray(columnasViejas)) {

      const inicial = plantillaInicial();

      return {

        [`Ventas::${new Date().getFullYear()}`]: {

          filas: Array.isArray(filasViejas) ? filasViejas : inicial.filas,

          columnas: Array.isArray(columnasViejas) ? columnasViejas : [],

        },

      };

    }

  } catch (error) {

    console.error("No se pudo recuperar Business Plan:", error);

  }

  return {};

}



export default function BusinessPlan() {

  const [negocios, setNegocios] = useState(cargarNegocios);

  const [negocio, setNegocio] = useState(() => cargarNegocios()[0] || "");

  const [anio, setAnio] = useState(new Date().getFullYear());

  const [tableros, setTableros] = useState(cargarTableros);

  const [papelera, setPapelera] = useState(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(ALMACEN_PAPELERA) || "[]");
      return Array.isArray(guardado) ? guardado : [];
    } catch (error) {
      console.error("No se pudo cargar la papelera:", error);
      return [];
    }
  });
  // Los temas son secciones dentro de cada tablero. El tema General utiliza
  // las claves históricas para no perder ningún KPI guardado anteriormente.
  const [temasPorNegocio, setTemasPorNegocio] = useState(() => {
    try {
      const datos = JSON.parse(localStorage.getItem(ALMACEN_TEMAS) || "{}");
      return datos && typeof datos === "object" && !Array.isArray(datos) ? datos : {};
    } catch { return {}; }
  });
  const [temaSeleccionado, setTemaSeleccionado] = useState("general");
  const [modalTema, setModalTema] = useState(null);
  const [temaNombre, setTemaNombre] = useState("");
  const [temaSubtitulo, setTemaSubtitulo] = useState("");
  const [temaError, setTemaError] = useState("");
  const temasActuales = temasPorNegocio[negocio] || [
    { id: "general", nombre: "General", subtitulo: "Indicadores y objetivos generales" },
  ];
  const temaActual = temasActuales.find((tema) => tema.id === temaSeleccionado) || temasActuales[0];
  const temaIdActivo = temaActual?.id || "general";

  const [papeleraAbierta, setPapeleraAbierta] = useState(false);
  const [papeleraError, setPapeleraError] = useState("");

  const [menu, setMenu] = useState(null);

  const [modal, setModal] = useState(null);
  const [modalValor, setModalValor] = useState("");
  const [modalError, setModalError] = useState("");

  const [enfoque, setEnfoque] = useState(null);

  const referenciaTabla = useRef(null);

  const clave = temaIdActivo === "general"
    ? `${negocio}::${anio}`
    : `${negocio}::${anio}::tema::${temaIdActivo}`;

  const tablero = tableros[clave] || { filas: [], columnas: [] };

  const filas = tablero.filas || [];

  const columnas = tablero.columnas || [];

  useEffect(() => {
    try { localStorage.setItem(ALMACEN_TEMAS, JSON.stringify(temasPorNegocio)); }
    catch (error) { console.error("No se pudieron guardar los temas:", error); }
  }, [temasPorNegocio]);

  useEffect(() => {
    if (!temasActuales.some((t) => t.id === temaSeleccionado)) setTemaSeleccionado("general");
  }, [negocio, temaSeleccionado, temasPorNegocio]);

  // Indicadores visuales calculados sobre el tablero activo, sin afectar los datos.
  const celdasCapturadas = filas.reduce((total, fila) =>
    total + MESES.filter((_, indice) => String(fila.valores?.[indice] ?? "").trim() !== "").length, 0);
  const celdasPosibles = filas.length * MESES.length;
  const progresoCaptura = celdasPosibles ? Math.round((celdasCapturadas / celdasPosibles) * 100) : 0;




  useEffect(() => {

    try {

      localStorage.setItem(ALMACEN_NEGOCIOS, JSON.stringify(negocios));

    } catch (error) {

      console.error("No se pudieron guardar los nombres de tableros:", error);

    }

  }, [negocios]);



  useEffect(() => {

    try {

      localStorage.setItem(ALMACEN, JSON.stringify(tableros));

    } catch (error) {

      console.error("No se pudieron guardar los cambios:", error);

    }

  }, [tableros]);



  useEffect(() => {
    try {
      localStorage.setItem(ALMACEN_PAPELERA, JSON.stringify(papelera));
    } catch (error) {
      console.error("No se pudo guardar la papelera:", error);
    }
  }, [papelera]);

  useEffect(() => {

    if (!enfoque) return;

    const selector = enfoque.tipo === "kpi"

      ? `[data-fila="${enfoque.id}"] [data-campo="kpi"]`

      : `[data-columna="${enfoque.id}"]`;

    referenciaTabla.current?.querySelector(selector)?.focus();

    setEnfoque(null);

  }, [enfoque, tableros]);



  // Todas las operaciones se aplican únicamente al negocio y año seleccionados.

  const modificarTablero = (accion) => {

    setTableros((prev) => {

      const actual = prev[clave] || { filas: [], columnas: [] };

      return { ...prev, [clave]: accion(actual) };

    });

  };



  // Ventanas institucionales: crear, editar, confirmar e informar.
  const abrirModal = (opciones) => {
    setMenu(null);
    setModalError("");
    setModalValor(opciones.valor || "");
    setModal(opciones);
  };

  const cerrarModal = () => {
    setModal(null);
    setModalError("");
  };

  const confirmarModal = () => {
    if (!modal) return;
    // La acción puede devolver un mensaje de validación para mantener el modal abierto.
    const error = modal.onConfirm?.(modalValor);
    if (typeof error === "string" && error) {
      setModalError(error);
      return;
    }
    cerrarModal();
  };

  const abrirNuevoTema = () => {
    setTemaNombre(""); setTemaSubtitulo(""); setTemaError("");
    setModalTema({ accion: "crear" });
  };
  const abrirEditarTema = (id = temaIdActivo) => {
    const objetivo = temasActuales.find((t) => t.id === id);
    if (!objetivo) return;
    setTemaNombre(objetivo.nombre); setTemaSubtitulo(objetivo.subtitulo || "");
    setTemaError(""); setModalTema({ accion: "editar", id: objetivo.id });
  };
  const guardarTema = () => {
    const nombre = temaNombre.trim();
    const subtitulo = temaSubtitulo.trim();
    if (!nombre) { setTemaError("Escribe el título del tema."); return; }
    if (temasActuales.some((t) => t.nombre.toLowerCase() === nombre.toLowerCase() &&
      (modalTema.accion === "crear" || t.id !== modalTema.id))) {
      setTemaError("Ya existe un tema con ese nombre en este tablero."); return;
    }
    if (modalTema.accion === "crear") {
      const id = NUEVO_ID();
      setTemasPorNegocio((prev) => ({ ...prev, [negocio]: [
        ...temasActuales, { id, nombre, subtitulo },
      ] }));
      setTemaSeleccionado(id);
    } else {
      setTemasPorNegocio((prev) => ({ ...prev, [negocio]: temasActuales.map((t) =>
        t.id === modalTema.id ? { ...t, nombre, subtitulo } : t,
      ) }));
    }
    setModalTema(null);
  };
  const confirmarEliminarTema = (id = temaIdActivo) => {
    const objetivo = temasActuales.find((t) => t.id === id);
    if (!objetivo) return;
    abrirModal({ tipo: "peligro", titulo: "Eliminar tema",
      mensaje: `Se eliminará “${objetivo.nombre}” y sus KPI de todos los años de ${negocio}. Esta acción no se puede deshacer.`,
      boton: "Eliminar tema", onConfirm: () => {
        setTemasPorNegocio((prev) => ({ ...prev, [negocio]: temasActuales.filter((t) => t.id !== objetivo.id) }));
        setTableros((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) =>
          objetivo.id === "general"
            ? !/^.*::\d{4}$/.test(key) || !key.startsWith(`${negocio}::`)
            : !key.startsWith(`${negocio}::`) || !key.endsWith(`::tema::${objetivo.id}`),
        )));
        setTemaSeleccionado(temasActuales.find((t) => t.id !== objetivo.id)?.id || "general");
        if (temasActuales.length === 1) {
          setTemasPorNegocio((prev) => ({ ...prev, [negocio]: [
            { id: "general", nombre: "General", subtitulo: "Indicadores y objetivos generales" },
          ] }));
        }
      },
    });
  };

  const crearNegocio = () => {
    abrirModal({
      tipo: "entrada",
      titulo: "Nuevo tablero",
      mensaje: "Crea un espacio independiente para tus indicadores y objetivos.",
      placeholder: "Ej. Seminuevos",
      etiqueta: "Nombre del tablero",
      boton: "Crear tablero",
      onConfirm: (valor) => {
        const nombre = valor.trim();
        if (!nombre) return "Escribe el nombre del tablero.";
        if (nombre.includes("::")) return 'El nombre no puede contener "::".';
        if (!nombreDisponible(nombre, negocios)) return "Ya existe un tablero con ese nombre.";
        setNegocios((prev) => [...prev, nombre]);
        setNegocio(nombre);
      },
    });
  };

  const renombrarNegocio = (nombreObjetivo = negocio) => {
    if (!nombreObjetivo) return;
    const anterior = nombreObjetivo;
    abrirModal({
      tipo: "entrada",
      titulo: "Renombrar tablero",
      mensaje: "El nuevo nombre se aplicará a todos los años de este tablero sin perder datos.",
      etiqueta: "Nombre del tablero",
      valor: anterior,
      boton: "Guardar cambios",
      onConfirm: (valor) => {
        const nombre = valor.trim();
        if (!nombre) return "Escribe un nombre válido.";
        if (nombre.includes("::")) return 'El nombre no puede contener "::".';
        if (!nombreDisponible(nombre, negocios, anterior)) return "Ya existe un tablero con ese nombre.";
        if (nombre === anterior) return;
        setTableros((prev) => {
          const siguientes = {};
          Object.entries(prev).forEach(([claveVieja, datos]) => {
            const nuevaClave = claveVieja.startsWith(`${anterior}::`)
              ? `${nombre}::${claveVieja.slice(anterior.length + 2)}`
              : claveVieja;
            siguientes[nuevaClave] = datos;
          });
          return siguientes;
        });
        setTemasPorNegocio((prev) => {
          const next = { ...prev };
          if (next[anterior]) { next[nombre] = next[anterior]; delete next[anterior]; }
          return next;
        });
        setNegocios((prev) => prev.map((n) => n === anterior ? nombre : n));
        if (negocio === anterior) setNegocio(nombre);
      },
    });
  };

  const eliminarNegocio = (nombreObjetivo = negocio) => {
    if (!nombreObjetivo) return;
    const anterior = nombreObjetivo;
    abrirModal({
      tipo: "peligro",
      titulo: "Enviar tablero a la papelera",
      mensaje: `Se moverá “${anterior}” con sus KPI, columnas y datos de todos los años. Podrás recuperarlo desde Papelera.`,
      boton: "Mover a papelera",
      onConfirm: () => {
        const datos = Object.fromEntries(
          Object.entries(tableros).filter(([claveVieja]) => claveVieja.startsWith(`${anterior}::`))
        );
        setPapelera((prev) => [
          { id: NUEVO_ID(), nombre: anterior, eliminadoEn: new Date().toISOString(), datos,
            temas: temasPorNegocio[anterior] || [{ id: "general", nombre: "General", subtitulo: "Indicadores y objetivos generales" }] },
          ...prev,
        ]);
        setTableros((prev) => Object.fromEntries(
          Object.entries(prev).filter(([claveVieja]) => !claveVieja.startsWith(`${anterior}::`))
        ));
        setTemasPorNegocio((prev) => { const next = { ...prev }; delete next[anterior]; return next; });
        setNegocios((prev) => prev.filter((n) => n !== anterior));
        if (negocio === anterior) setNegocio(negocios.find((n) => n !== anterior) || "");
      },
    });
  };

  const restaurarDesdePapelera = (entrada) => {
    if (!entrada) return;
    const nombre = entrada.nombre;
    if (!nombreDisponible(nombre, negocios)) {
      setPapeleraError(`Ya existe un tablero llamado “${nombre}”. Renómbralo o elimínalo antes de restaurar esta copia.`);
      return;
    }
    const datosRecuperados = entrada.datos && typeof entrada.datos === "object" ? entrada.datos : {};
    setTableros((prev) => ({ ...prev, ...datosRecuperados }));
    setTemasPorNegocio((prev) => ({ ...prev, [nombre]: entrada.temas || [
      { id: "general", nombre: "General", subtitulo: "Indicadores y objetivos generales" },
    ] }));
    setNegocios((prev) => [...prev, nombre]);
    setNegocio(nombre);
    setPapelera((prev) => prev.filter((item) => item.id !== entrada.id));
    setPapeleraError("");
    setPapeleraAbierta(false);
  };

  const abrirPapelera = () => {
    setMenu(null);
    setPapeleraError("");
    setPapeleraAbierta(true);
  };

  const cambiarFila = (id, campo, valor) => modificarTablero((actual) => ({

    ...actual,

    filas: actual.filas.map((fila) => fila.id === id ? { ...fila, [campo]: valor } : fila),

  }));



  const agregarKPI = () => {

    const id = NUEVO_ID();

    modificarTablero((actual) => ({

      ...actual,

      filas: [...actual.filas, { id, kpi: "", descripcion: "", valores: Array(12).fill(""), extras: {} }],

    }));

    setEnfoque({ tipo: "kpi", id });

  };



  const eliminarKPI = (id) => {
    const fila = filas.find((f) => f.id === id);
    if (!fila) return;
    abrirModal({
      tipo: "peligro",
      titulo: "Eliminar KPI",
      mensaje: `¿Eliminar “${fila.kpi || "Sin nombre"}” y todos sus valores mensuales y personalizados?`,
      boton: "Eliminar KPI",
      onConfirm: () => modificarTablero((actual) => ({
        ...actual, filas: actual.filas.filter((f) => f.id !== id),
      })),
    });
  };

  const duplicarKPI = (id) => {

    const nuevoId = NUEVO_ID();

    modificarTablero((actual) => {

      const indice = actual.filas.findIndex((f) => f.id === id);

      if (indice < 0) return actual;

      const original = actual.filas[indice];

      const copia = {

        ...original,

        id: nuevoId,

        kpi: `${original.kpi || "Nuevo KPI"} (copia)`,

        valores: [...(original.valores || Array(12).fill(""))],

        extras: { ...(original.extras || {}) },

      };

      const nuevas = [...actual.filas];

      nuevas.splice(indice + 1, 0, copia);

      return { ...actual, filas: nuevas };

    });

    setMenu(null);

    setEnfoque({ tipo: "kpi", id: nuevoId });

  };



  const agregarColumna = () => {

    const id = NUEVO_ID();

    modificarTablero((actual) => ({

      ...actual, columnas: [...actual.columnas, { id, nombre: "" }],

    }));

    setEnfoque({ tipo: "columna", id });

  };



  const renombrarColumna = (id, nombre) => modificarTablero((actual) => ({

    ...actual,

    columnas: actual.columnas.map((c) => c.id === id ? { ...c, nombre } : c),

  }));



  const eliminarColumna = (id) => {
    const columna = columnas.find((c) => c.id === id);
    if (!columna) return;
    abrirModal({
      tipo: "peligro",
      titulo: "Eliminar columna",
      mensaje: `¿Eliminar “${columna.nombre || "Sin nombre"}” y todos sus valores registrados?`,
      boton: "Eliminar columna",
      onConfirm: () => modificarTablero((actual) => ({
        ...actual,
        columnas: actual.columnas.filter((c) => c.id !== id),
        filas: actual.filas.map((fila) => {
          const extras = { ...(fila.extras || {}) };
          delete extras[id];
          return { ...fila, extras };
        }),
      })),
    });
  };

  const abrirMenu = (event, tipo, id) => {

    event.preventDefault();

    setMenu({ tipo, id, x: Math.max(8, Math.min(event.clientX, window.innerWidth - 200)), y: Math.max(8, Math.min(event.clientY, window.innerHeight - 160)) });

  };



  const descargarCSV = () => {

    const encabezados = ["KPI", "Descripción", ...columnas.map((c) => c.nombre || "Columna sin nombre"), ...MESES];

    const matriz = [encabezados, ...filas.map((fila) => [

      fila.kpi, fila.descripcion,

      ...columnas.map((c) => fila.extras?.[c.id] || ""),

      ...MESES.map((_, i) => fila.valores?.[i] || ""),

    ])];

    const csv = "\uFEFF" + matriz.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));

    const a = document.createElement("a");

    a.href = url;

    a.download = `BusinessPlan_${negocio}_${temaActual?.nombre || "General"}_${anio}.csv`;

    a.click();

    URL.revokeObjectURL(url);

  };



  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2C51]">
      {/* Encabezado consistente con Gestión de Negocio / Volkswagen */}
      <header className="border-b border-[#DCE4EF] bg-white">
        <div className="mx-auto flex max-w-[1800px] items-center gap-5 px-5 py-3 lg:px-7">
          <img src={vwDark} alt="Volkswagen" className="h-12 w-12 shrink-0 object-contain lg:h-14 lg:w-14" />
          <div className="min-w-0 shrink-0">
            <h1 className="text-[23px] font-semibold leading-tight text-[#092754]">Business Plan</h1>
            <p className="mt-0.5 text-[11px] text-[#73849E]">Planeación y seguimiento de indicadores comerciales</p>
          </div>
          <div className="hidden h-[2px] flex-1 bg-[#142B64] md:block" />
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] space-y-4 px-4 pb-10 pt-4 lg:px-7">
        {/* Dashboard navy compacto, siguiendo Gestión de Negocio */}
        <section className="relative overflow-visible rounded-[26px] border border-[#17356B] bg-[#071E47] text-white shadow-[0_9px_20px_rgba(5,28,65,0.13)]">
          <div className="relative overflow-hidden rounded-t-[25px] bg-gradient-to-r from-[#062B60] via-[#071E47] to-[#081636] px-5 pb-5 pt-5 lg:px-6">
            <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[48px] border-white/[0.025]" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#63B9ED]">Volkswagen · Grupo Automotriz R&amp;R / Planeación comercial</p>
                <h3 className="mt-2 text-[24px] font-bold tracking-tight">Dashboard de Business Plan</h3>
                <p className="mt-1 text-[12px] text-[#A9C1DF]">{negocio || "Selecciona un tablero"} · {temaActual?.nombre || "General"} · Ciclo {anio}</p>
              </div>

            </div>
            <div className="relative mt-5 grid grid-cols-1 gap-y-5 border-t border-white/15 pt-5 sm:grid-cols-3">
              {[
                { label: "TABLEROS ACTIVOS", value: negocios.length, detail: "Planes configurados" },
                { label: "INDICADORES KPI", value: filas.length, detail: "En el tablero actual" },
                { label: "COLUMNAS ADICIONALES", value: columnas.length, detail: "Además de 12 meses" },
              ].map((metric, index) => (
                <div key={metric.label} className={`min-w-0 px-2 md:px-5 ${index > 0 ? "md:border-l md:border-white/15" : ""}`}>
                  <div className="text-[10px] font-semibold tracking-wide text-[#91B3DB]">{metric.label}</div>
                  <div className="mt-1 text-[27px] font-semibold leading-tight text-white">{metric.value}</div>
                  <div className="mt-1 text-[11px] text-[#A6BAD6]">{metric.detail}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-b-[25px] border-t border-white/10 bg-[#071634] px-4 py-4 lg:px-5">
            <span className="mr-1 text-[10px] font-extrabold uppercase tracking-wide text-[#9BB0D1]">Tableros:</span>
            {negocios.map((nombre) => (
              <div key={nombre} className="group/tablero relative flex items-center py-1" onKeyDown={(e) => { if (e.key === "Escape") e.currentTarget.blur(); }}>
                <button
                  type="button"
                  onClick={() => { setNegocio(nombre); setMenu(null); }}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition ${negocio === nombre ? "bg-white text-[#092754] shadow-sm" : "bg-[#20395F] text-[#D4E0F0] hover:bg-[#2C4C7D]"}`}
                >{nombre}</button>
                <div className="pointer-events-none absolute bottom-[calc(100%-2px)] left-1/2 z-50 flex -translate-x-1/2 translate-y-1 items-center gap-1 rounded-lg border border-[#DCE5F2] bg-white p-1 opacity-0 shadow-xl transition-all duration-150 group-hover/tablero:pointer-events-auto group-hover/tablero:translate-y-0 group-hover/tablero:opacity-100 group-focus-within/tablero:pointer-events-auto group-focus-within/tablero:translate-y-0 group-focus-within/tablero:opacity-100">
                  <button type="button" title={`Editar ${nombre}`} aria-label={`Editar tablero ${nombre}`} onClick={(e) => { e.stopPropagation(); renombrarNegocio(nombre); }} className="rounded-md p-1.5 text-[#17366F] hover:bg-[#EFF4FC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#17366F]"><Pencil className="h-3.5 w-3.5" /></button>
                  <button type="button" title={`Enviar ${nombre} a papelera`} aria-label={`Eliminar tablero ${nombre}`} onClick={(e) => { e.stopPropagation(); eliminarNegocio(nombre); }} className="rounded-md p-1.5 text-red-600 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            <button type="button" onClick={crearNegocio} className="inline-flex items-center gap-1 rounded-full border border-dashed border-white/35 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/10"><Plus className="h-3.5 w-3.5" /> Nuevo tablero</button>
            <div className="ml-auto flex items-center gap-2 pl-3">
              <label htmlFor="bp-anio-superior" className="text-[10px] font-bold uppercase tracking-wide text-[#A9C1DF]">Año</label>
              <select id="bp-anio-superior" value={anio} onChange={(e) => { setAnio(Number(e.target.value)); setMenu(null); }} className="h-9 rounded-lg border border-white/25 bg-[#1F3D6A] px-3 text-xs font-bold text-white outline-none focus:border-white/70">
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((a) => <option key={a} value={a} className="bg-white text-[#17366F]">{a}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Los temas se muestran como botones, en función del tablero seleccionado. */}
        <section className="rounded-[22px] border border-[#DEE6F0] bg-white px-4 py-4 shadow-[0_4px_15px_rgba(18,42,82,0.05)] lg:px-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <span className="mr-2 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#7B8BA6]"><ListTree className="h-4 w-4" /> Temas:</span>
              {temasActuales.map((t) => (
                <div key={t.id} className="group/tema relative flex items-center py-1">
                  <button
                    type="button"
                    onClick={() => { setTemaSeleccionado(t.id); setMenu(null); }}
                    aria-pressed={temaIdActivo === t.id}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${temaIdActivo === t.id ? "border-[#14366D] bg-[#14366D] text-white shadow-sm" : "border-[#D5E0EF] bg-[#F6F9FD] text-[#315177] hover:border-[#8EADCE] hover:bg-[#EDF4FD]"}`}
                  >{t.nombre}</button>
                  <div className="pointer-events-none absolute bottom-[calc(100%-2px)] left-1/2 z-50 flex -translate-x-1/2 translate-y-1 gap-1 rounded-lg border border-[#DCE5F2] bg-white p-1 opacity-0 shadow-lg transition group-hover/tema:pointer-events-auto group-hover/tema:translate-y-0 group-hover/tema:opacity-100 group-focus-within/tema:pointer-events-auto group-focus-within/tema:opacity-100">
                    <button type="button" onClick={(e) => { e.stopPropagation(); abrirEditarTema(t.id); }} title={`Editar ${t.nombre}`} aria-label={`Editar tema ${t.nombre}`} className="rounded-md p-1.5 text-[#17366F] hover:bg-[#EFF4FC]"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); confirmarEliminarTema(t.id); }} title={`Eliminar ${t.nombre}`} aria-label={`Eliminar tema ${t.nombre}`} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={abrirNuevoTema} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#AFC1DD] bg-white px-3.5 py-2 text-xs font-semibold text-[#17366F] hover:bg-[#EEF4FD]"><Plus className="h-4 w-4" /> Nuevo tema</button>
            </div>
          </div>
          <div className="mt-3 rounded-xl border-l-[3px] border-[#2469B0] bg-[#F5F8FD] px-4 py-3">
            <p className="text-sm font-bold text-[#102A61]">{temaActual?.nombre || "General"}</p>
            <p className="mt-0.5 text-xs text-[#73849E]">{temaActual?.subtitulo || "Agrega un subtítulo para describir los objetivos de este tema."}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-[#D7E2EF] bg-white shadow-[0_12px_30px_rgba(14,36,80,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4EAF3] bg-white px-4 py-3 lg:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF4FC] text-[#153B72]"><Table2 className="h-4 w-4" /></span>
              <div><p className="text-sm font-bold text-[#102A61]">{temaActual?.nombre || "General"}</p><p className="text-[11px] text-[#788AA3]">{temaActual?.subtitulo || "Indicadores y objetivos"} · {negocio} · {anio}</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={abrirPapelera} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#DAE3EF] bg-white px-3 text-xs font-semibold text-[#294574] shadow-sm transition hover:bg-[#F0F5FB]"><RotateCcw className="h-4 w-4" /> Papelera <span className="rounded-full bg-[#E9EFF8] px-2 py-0.5 text-[10px]">{papelera.length}</span></button>
              <button type="button" onClick={descargarCSV} className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"><FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Exportar Excel</button>
            </div>
          </div>
          <div className="max-h-[68vh] overflow-auto rounded-b-[23px]" ref={referenciaTabla}>
            <table className="w-full min-w-[1500px] border-separate border-spacing-0 text-[12px]">
              <thead>
                <tr className="sticky top-0 z-30 bg-[#102A61] text-white shadow-[0_2px_5px_rgba(7,25,61,0.12)]">
                  <th className="sticky left-0 z-40 w-[225px] min-w-[225px] max-w-[225px] border-r border-white/15 bg-[#132B60] px-4 py-4 text-left font-semibold">Indicador (KPI)</th>
                  <th className="sticky left-[225px] z-40 w-[275px] min-w-[275px] max-w-[275px] border-r border-white/15 bg-[#132B60] px-4 py-4 text-left font-semibold">Descripción</th>
                  {columnas.map((columna) => (
                    <th key={columna.id} onContextMenu={(e) => abrirMenu(e, "columna", columna.id)} className="group/extra min-w-[170px] border-r border-white/15 px-2 py-2">
                      <div className="flex items-center gap-1">
                        <input data-columna={columna.id} value={columna.nombre} onChange={(e) => renombrarColumna(columna.id, e.target.value)} placeholder="Nombre de columna..." className="min-w-0 flex-1 rounded-md border border-white/25 bg-white/10 px-2 py-1.5 text-center text-xs text-white placeholder:text-white/60 outline-none focus:border-white" />
                        <button type="button" title="Eliminar columna" onClick={() => eliminarColumna(columna.id)} className="rounded p-1 text-white/60 opacity-0 transition-opacity hover:bg-red-500 hover:text-white focus:opacity-100 group-hover/extra:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </th>
                  ))}
                  <th className="group/add w-[42px] min-w-[42px] border-r border-white/15 bg-[#132B60] px-1 text-center transition-colors hover:bg-[#25467E] focus-within:bg-[#25467E]">
                    <button type="button" onClick={agregarColumna} title="Agregar columna" aria-label="Agregar columna personalizada" className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-white/15 text-white opacity-0 transition-opacity hover:bg-white/25 group-hover/add:opacity-100 focus:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><Plus className="h-4 w-4" /></button>
                  </th>
                  {MESES.map((mes, i) => <th key={mes} title={`Trimestre ${Math.floor(i / 3) + 1}`} className={`min-w-[85px] border-r border-white/15 px-2 py-3 text-center font-semibold ${i % 3 === 0 ? "border-l-2 border-l-[#60A5FA]/70" : ""}`}>{mes}<span className="block text-[9px] font-normal text-[#9DBBE3]">T{Math.floor(i / 3) + 1}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, indiceFila) => (
                  <tr key={fila.id} data-fila={fila.id} onContextMenu={(e) => abrirMenu(e, "fila", fila.id)} className="group transition-colors duration-150 hover:bg-[#EAF2FD] focus-within:bg-[#F1F6FF]">
                    <td className={`sticky left-0 z-10 w-[225px] min-w-[225px] max-w-[225px] border-b border-r border-[#E4EAF3] px-2 py-1.5 ${indiceFila % 2 ? "bg-[#F8FAFD]" : "bg-white"} group-hover:bg-[#EAF2FD] group-focus-within:bg-[#F1F6FF]`}>
                      <div className="flex items-center gap-0.5">
                        <input data-campo="kpi" type="text" value={fila.kpi} onChange={(e) => cambiarFila(fila.id, "kpi", e.target.value)} placeholder="Nombre del KPI..." className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-2 text-xs font-semibold text-[#172F60] outline-none focus:border-[#9FB4D4] focus:bg-white" />
                        <button type="button" onClick={() => eliminarKPI(fila.id)} title="Eliminar KPI" className="rounded p-1.5 text-[#ABB6C8] opacity-0 hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); abrirMenu({ preventDefault: () => {}, clientX: r.left, clientY: r.bottom + 4 }, "fila", fila.id); }} title="Más opciones" className="rounded p-1 text-[#ABB6C8] opacity-0 hover:bg-white hover:text-[#131E5C] focus:opacity-100 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></button>
                      </div>
                    </td>
                    <td className={`sticky left-[225px] z-10 w-[275px] min-w-[275px] max-w-[275px] border-b border-r border-[#E4EAF3] px-2 py-1.5 ${indiceFila % 2 ? "bg-[#F8FAFD]" : "bg-white"} group-hover:bg-[#EAF2FD] group-focus-within:bg-[#F1F6FF]`}>
                      <input type="text" value={fila.descripcion} onChange={(e) => cambiarFila(fila.id, "descripcion", e.target.value)} placeholder="Escribir descripción..." className="w-full rounded-md border border-transparent bg-transparent px-2 py-2 text-xs text-[#63728C] outline-none focus:border-[#9FB4D4] focus:bg-white" />
                    </td>
                    {columnas.map((c) => <td key={c.id} className="border-b border-r border-[#E4EAF3] px-1 py-1.5"><input value={fila.extras?.[c.id] ?? ""} onChange={(e) => cambiarFila(fila.id, "extras", { ...(fila.extras || {}), [c.id]: e.target.value })} placeholder="—" className="w-full rounded-md border border-transparent bg-transparent px-1 py-2 text-center text-xs font-medium text-[#405675] outline-none transition focus:border-[#619BE5] focus:bg-[#ECF5FF] focus:ring-1 focus:ring-[#619BE5]/30" /></td>)}
                    <td className="border-b border-r border-[#E4EAF3] bg-[#F7F9FC]" />
                    {MESES.map((_, i) => <td key={i} className={`border-b border-r border-[#E4EAF3] px-1 py-1.5 text-center ${i % 3 === 0 ? "border-l-2 border-l-[#D5E2F5]" : ""}`}><input value={fila.valores?.[i] ?? ""} onChange={(e) => { const valores = [...(fila.valores || Array(12).fill(""))]; valores[i] = e.target.value; cambiarFila(fila.id, "valores", valores); }} placeholder="—" className="w-full rounded-md border border-transparent bg-transparent px-1 py-2 text-center text-xs font-medium text-[#405675] outline-none transition focus:border-[#619BE5] focus:bg-[#ECF5FF] focus:ring-1 focus:ring-[#619BE5]/30" /></td>)}
                  </tr>
                ))}
                {filas.length === 0 && <tr><td colSpan={columnas.length + 3 + MESES.length} className="px-6 py-12 text-center"><Table2 className="mx-auto mb-2 h-7 w-7 text-[#A1AEC2]" /><p className="text-sm font-semibold text-[#30476C]">Este tablero aún no tiene indicadores</p><p className="mt-1 text-xs text-[#93A0B2]">Utiliza “Agregar KPI” para crear el primero.</p></td></tr>}
                <tr className="bg-[#F8FAFD] hover:bg-[#EEF4FD]">
                  <td className="sticky left-0 z-10 border-b border-r border-[#E4EAF3] bg-[#F8FAFD] px-3 py-2"><button type="button" onClick={agregarKPI} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#A6BADD] bg-white px-3 py-2 text-xs font-semibold text-[#1F447B] transition hover:border-[#244E8C] hover:bg-[#E9F1FD]"><Plus className="h-4 w-4" /> Agregar KPI</button></td>
                  <td className="sticky left-[225px] z-10 border-b border-r border-[#E4EAF3] bg-[#F8FAFD] px-3 py-2 text-[11px] text-[#9AA7B9]">Agregar otro indicador</td>
                  <td colSpan={columnas.length + 1 + MESES.length} className="border-b border-[#E4EAF3]" />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E4EAF3] bg-[#FBFCFE] px-4 py-3 text-[11px] text-[#8290A5]">
            <span className="inline-flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Edita las celdas directamente. Clic derecho para más opciones.</span>
            <span>Desplázate para consultar los 12 meses →</span>
          </div>
        </section>
      </main>

      {/* Ventana para título y subtítulo de cada tema */}
      {modalTema && <div className="fixed inset-0 z-[145] flex items-center justify-center bg-[#101A3B]/65 p-4 backdrop-blur-[3px]" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalTema(null); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="bp-tema-modal-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#DFE7F2] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#E4EAF3] px-6 py-5">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-[#EDF3FC] p-3 text-[#17366F]"><ListTree className="h-5 w-5" /></span>
              <div><h3 id="bp-tema-modal-title" className="text-lg font-bold text-[#102A61]">{modalTema.accion === "crear" ? "Nuevo tema" : "Editar tema"}</h3><p className="text-xs text-[#73849E]">Organiza tus indicadores con un título y subtítulo</p></div>
            </div>
            <button type="button" onClick={() => setModalTema(null)} aria-label="Cerrar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); guardarTema(); }} className="space-y-4 px-6 py-5">
            <div><label htmlFor="tema-nombre" className="mb-1.5 block text-xs font-bold text-[#17366F]">Título del tema</label><input id="tema-nombre" autoFocus maxLength={80} value={temaNombre} onChange={(e) => { setTemaNombre(e.target.value); setTemaError(""); }} placeholder="Ej. Captación de prospectos" className="w-full rounded-xl border border-[#D6E0EE] bg-[#F8FAFD] px-4 py-3 text-sm outline-none focus:border-[#3674BA]" /></div>
            <div><label htmlFor="tema-subtitulo" className="mb-1.5 block text-xs font-bold text-[#17366F]">Subtítulo / descripción</label><textarea id="tema-subtitulo" rows={3} maxLength={220} value={temaSubtitulo} onChange={(e) => setTemaSubtitulo(e.target.value)} placeholder="Ej. Objetivos mensuales de generación y seguimiento de leads" className="w-full resize-none rounded-xl border border-[#D6E0EE] bg-[#F8FAFD] px-4 py-3 text-sm outline-none focus:border-[#3674BA]" /></div>
            {temaError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{temaError}</p>}
            <div className="flex justify-end gap-2 border-t border-[#E4EAF3] pt-4"><button type="button" onClick={() => setModalTema(null)} className="rounded-lg border border-[#D6E0EE] px-4 py-2 text-xs font-semibold text-[#536685]">Cancelar</button><button type="submit" className="rounded-lg bg-[#102A61] px-5 py-2 text-xs font-semibold text-white hover:bg-[#19437D]">{modalTema.accion === "crear" ? "Crear tema" : "Guardar cambios"}</button></div>
          </form>
        </div>
      </div>}

      {/* Modales corporativos: reemplazan todos los prompt/confirm/alert del navegador. */}
      {papeleraAbierta && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-[#101A3B]/60 p-4 backdrop-blur-[3px]"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setPapeleraAbierta(false); }}
          onKeyDown={(e) => { if (e.key === "Escape") setPapeleraAbierta(false); }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="papelera-business-plan-title" className="w-full max-w-[580px] overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#E4E7F0] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#131E5C]/5 text-[#131E5C]"><RotateCcw className="h-5 w-5" /></span>
                <div>
                  <h3 id="papelera-business-plan-title" className="text-lg font-bold text-[#131E5C]">Papelera de tableros</h3>
                  <p className="text-sm text-slate-500">Elige cuál quieres recuperar, con todos sus años e indicadores.</p>
                </div>
              </div>
              <button type="button" onClick={() => setPapeleraAbierta(false)} aria-label="Cerrar papelera" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[55vh] space-y-3 overflow-y-auto px-6 py-5">
              {papelera.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#DDE2EE] bg-[#F7F8FC] px-5 py-9 text-center">
                  <Trash2 className="mx-auto mb-3 h-7 w-7 text-slate-400" />
                  <p className="font-semibold text-[#131E5C]">No hay tableros eliminados</p>
                  <p className="mt-1 text-sm text-slate-500">Los tableros que elimines a partir de ahora aparecerán aquí.</p>
                </div>
              ) : papelera.map((entrada) => (
                <div key={entrada.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E4E7F0] bg-[#FAFBFE] p-4">
                  <div>
                    <p className="font-bold text-[#131E5C]">{entrada.nombre}</p>
                    <p className="mt-1 text-xs text-[#8891AD]">
                      {Object.keys(entrada.datos || {}).length} año(s) con datos · Eliminado {new Date(entrada.eliminadoEn).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <button type="button" onClick={() => restaurarDesdePapelera(entrada)} className="inline-flex items-center gap-2 rounded-xl bg-[#131E5C] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0B1646]">
                    <RotateCcw className="h-4 w-4" /> Restaurar
                  </button>
                </div>
              ))}
              {papeleraError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{papeleraError}</p>}
            </div>
            <div className="flex justify-end border-t border-[#E4E7F0] bg-[#FAFBFE] px-6 py-4">
              <button type="button" onClick={() => setPapeleraAbierta(false)} className="rounded-xl border border-[#DDE2EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#515778] hover:bg-slate-100">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#101A3B]/60 p-4 backdrop-blur-[3px]"
          onMouseDown={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
          onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); cerrarModal(); } }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="business-plan-modal-title"
            className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-[#E4E7F0] bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E4E7F0] px-6 py-5">
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${modal.tipo === "peligro" ? "bg-red-50 text-red-600" : "bg-[#131E5C]/5 text-[#131E5C]"}`}>
                  {modal.tipo === "peligro" ? <AlertTriangle className="h-5 w-5" /> : modal.tipo === "aviso" ? <CheckCircle2 className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
                </span>
                <div>
                  <h3 id="business-plan-modal-title" className="text-lg font-bold text-[#131E5C]">{modal.titulo}</h3>
                  {modal.mensaje && <p className="mt-1 text-sm leading-relaxed text-slate-500">{modal.mensaje}</p>}
                </div>
              </div>
              <button type="button" onClick={cerrarModal} title="Cerrar" aria-label="Cerrar ventana" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#131E5C]"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); confirmarModal(); }}>
              <div className="px-6 py-5">
                {modal.tipo === "entrada" && (
                  <div>
                    <label htmlFor="business-plan-modal-input" className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#515778]">{modal.etiqueta || "Nombre"}</label>
                    <input
                      id="business-plan-modal-input"
                      autoFocus
                      maxLength={80}
                      value={modalValor}
                      onChange={(e) => { setModalValor(e.target.value); setModalError(""); }}
                      placeholder={modal.placeholder || "Escribe aquí..."}
                      className={`w-full rounded-xl border bg-[#F7F8FC] px-4 py-3 text-sm text-[#131E5C] outline-none transition focus:ring-2 focus:ring-[#131E5C]/10 ${modalError ? "border-red-400" : "border-[#DDE2EE] focus:border-[#131E5C]"}`}
                    />
                  </div>
                )}
                {modal.tipo === "peligro" && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Confirma que deseas continuar.</p>
                )}
                {modalError && <p role="alert" className="mt-2 text-sm text-red-600">{modalError}</p>}
              </div>
              <div className="flex justify-end gap-2 border-t border-[#E4E7F0] bg-[#FAFBFE] px-6 py-4">
                {modal.tipo !== "aviso" && <button type="button" onClick={cerrarModal} className="rounded-xl border border-[#DDE2EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#515778] hover:bg-slate-100">Cancelar</button>}
                <button type="submit" className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white transition ${modal.tipo === "peligro" ? "bg-red-600 hover:bg-red-700" : "bg-[#131E5C] hover:bg-[#0B1646]"}`}>
                  {modal.boton || (modal.tipo === "aviso" ? "Entendido" : "Guardar")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {menu && <>

        <div className="fixed inset-0 z-[90]" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />

        <div className="fixed z-[100] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl" style={{ left: menu.x, top: menu.y }}>

          {menu.tipo === "fila" ? <>

            <button type="button" onClick={() => { setEnfoque({ tipo: "kpi", id: menu.id }); setMenu(null); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><Pencil className="h-4 w-4" /> Editar KPI</button>

            <button type="button" onClick={() => duplicarKPI(menu.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><Copy className="h-4 w-4" /> Duplicar KPI</button>

            <div className="my-1 border-t border-slate-100" />

            <button type="button" onClick={() => eliminarKPI(menu.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Eliminar KPI</button>

          </> : <>

            <button type="button" onClick={() => { setEnfoque({ tipo: "columna", id: menu.id }); setMenu(null); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"><Pencil className="h-4 w-4" /> Renombrar</button>

            <button type="button" onClick={() => eliminarColumna(menu.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Eliminar columna</button>

          </>}

        </div>

      </>}

    </div>

  );

}
