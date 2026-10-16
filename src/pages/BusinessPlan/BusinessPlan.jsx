import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Copy, MoreVertical, FileSpreadsheet, RotateCcw, X, AlertTriangle, CheckCircle2, ListTree, Table2, Users, UserPlus, Mail, Save, Info, Search, Loader2, Download } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { apiBusinessPlan } from "../../lib/apiBusinessPlan";
import vwDark from "../../assets/vw_dark.png";

const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const NUEVO_ID = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const ANIOS = Array.from({ length: 11 }, (_, indice) => new Date().getFullYear() - 5 + indice);
const BOTON = "inline-flex items-center justify-center gap-2 rounded-lg border border-[#D5E0EF] bg-white px-3 py-2 text-xs font-semibold text-[#17366F] transition hover:bg-[#EEF4FD] disabled:cursor-not-allowed disabled:opacity-40";
const ENTRADA = "w-full rounded-xl border border-[#D6E0EE] bg-[#F8FAFD] px-3 py-2.5 text-sm text-[#17366F] outline-none focus:border-[#3674BA]";

function mensajeError(error) {
  if (error?.data && typeof error.data === "object") {
    const primera = Object.entries(error.data).find(([clave]) => clave !== "status");
    if (primera) return `${primera[0]}: ${Array.isArray(primera[1]) ? primera[1].join(" ") : primera[1]}`;
  }
  return error?.message || "No se pudo completar la operación.";
}

function descargarArchivo(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportarCSV(tablero, tema, anio, periodo) {
  const columnas = periodo?.columnas || [];
  const filas = periodo?.filas || [];
  const cabecera = ["KPI", "Descripción", ...columnas.map((c) => c.nombre), ...MESES];
  const contenido = [cabecera, ...filas.map((fila) => [
    fila.kpi, fila.descripcion,
    ...columnas.map((columna) => fila.extras?.[columna.id] ?? ""),
    ...MESES.map((_, indice) => fila.valores?.[indice] ?? ""),
  ])];
  const escapar = (valor) => {
    let texto = String(valor ?? "");
    if (/^[\s]*[=+@]/.test(texto)) texto = `'${texto}`;
    return `"${texto.replace(/"/g, '""')}"`;
  };
  const csv = "\uFEFF" + contenido.map((fila) => fila.map(escapar).join(",")).join("\r\n");
  descargarArchivo(`BusinessPlan_${tablero.nombre}_${tema.nombre}_${anio}.csv`, csv, "text/csv;charset=utf-8");
}

export default function BusinessPlan() {
  const { user } = useAuth();
  const idUsuario = Number(user?.id_usuario ?? user?.id ?? 0);
  const [tableros, setTableros] = useState([]);
  const [tableroActivo, setTableroActivo] = useState(null);
  const [temas, setTemas] = useState([]);
  const [temaActivo, setTemaActivo] = useState(null);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [periodo, setPeriodo] = useState(null);
  const [papelera, setPapelera] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [navegando, setNavegando] = useState(false);
  const [guardado, setGuardado] = useState("guardado");
  const [mensaje, setMensaje] = useState("");
  const [modal, setModal] = useState(null);
  const [modalValor, setModalValor] = useState("");
  const [modalError, setModalError] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [modalTema, setModalTema] = useState(null);
  const [nombreTema, setNombreTema] = useState("");
  const [subtituloTema, setSubtituloTema] = useState("");
  const [modalEspecial, setModalEspecial] = useState("");
  const [compartir, setCompartir] = useState(null);
  const [colaboradores, setColaboradores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioInvitado, setUsuarioInvitado] = useState(null);
  const [rolInvitado, setRolInvitado] = useState("lector");
  const [compartirError, setCompartirError] = useState("");
  const [compartirExito, setCompartirExito] = useState("");
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [cargandoColaboradores, setCargandoColaboradores] = useState(false);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [confirmarRevocacion, setConfirmarRevocacion] = useState(null);
  const [menu, setMenu] = useState(null);
  const [enfoque, setEnfoque] = useState(null);
  const referenciaTabla = useRef(null);
  const periodoRef = useRef(null);
  const revisionRef = useRef(0);
  const pendienteRef = useRef(false);
  const versionRef = useRef(0);
  const guardandoRef = useRef(null);
  const temporizadorRef = useRef(null);
  const conflictoRef = useRef(false);
  const navegandoRef = useRef(false);
  const tableroRef = useRef(null);
  const temaRef = useRef(null);
  const anioRef = useRef(anio);

  const filas = periodo?.filas || [];
  const columnas = periodo?.columnas || [];
  const puedeEditar = Boolean(temaActivo?.puede_editar && !conflictoRef.current && !navegando);
  const puedeCrearTema = Boolean(tableroActivo?.puede_editar);
  const administraTablero = Boolean(tableroActivo?.es_propietario);
  const administraTema = Boolean(temaActivo && (administraTablero || Number(temaActivo.propietario) === idUsuario));
  const celdasCapturadas = filas.reduce((total, fila) => total + (fila.valores || []).filter((v) => String(v ?? "").trim()).length, 0);
  const progreso = filas.length ? Math.round((celdasCapturadas / (filas.length * 12)) * 100) : 0;

  useEffect(() => {
    let vigente = true;
    async function iniciar() {
      try {
        const [lista, pendientes] = await Promise.all([
          apiBusinessPlan.listarTableros(),
          apiBusinessPlan.listarInvitaciones(),
        ]);
        if (!vigente) return;
        setTableros(lista);
        setInvitaciones(pendientes);
        if (lista.length) await cargarTablero(lista[0], false);
      } catch (error) {
        if (vigente) setMensaje(mensajeError(error));
      } finally {
        if (vigente) setCargando(false);
      }
    }
    iniciar();
    return () => {
      vigente = false;
      clearTimeout(temporizadorRef.current);
    };
  }, []);

  useEffect(() => {
    function confirmarSalida(evento) {
      if (!pendienteRef.current && !guardandoRef.current) return;
      evento.preventDefault();
      evento.returnValue = "";
    }
    window.addEventListener("beforeunload", confirmarSalida);
    return () => window.removeEventListener("beforeunload", confirmarSalida);
  }, []);

  useEffect(() => {
    if (!enfoque) return;
    const selector = enfoque.tipo === "fila"
      ? `[data-fila="${enfoque.id}"] [data-campo="kpi"]`
      : `[data-columna="${enfoque.id}"]`;
    referenciaTabla.current?.querySelector(selector)?.focus();
    setEnfoque(null);
  }, [enfoque, periodo]);

  async function guardarPendientes() {
    clearTimeout(temporizadorRef.current);
    if (conflictoRef.current) return false;
    if (guardandoRef.current) return guardandoRef.current;
    if (!pendienteRef.current || !periodoRef.current) return true;
    const tarea = (async () => {
      try {
        setGuardado("guardando");
        while (pendienteRef.current) {
          const datos = periodoRef.current;
          const version = versionRef.current;
          pendienteRef.current = false;
          const respuesta = await apiBusinessPlan.guardarPeriodo(datos.tema, datos.anio, {
            revision: revisionRef.current,
            filas: datos.filas,
            columnas: datos.columnas,
          });
          revisionRef.current = respuesta.revision;
          if (periodoRef.current?.tema === datos.tema && periodoRef.current?.anio === datos.anio) {
            periodoRef.current = { ...periodoRef.current, revision: respuesta.revision };
            setPeriodo((actual) => actual ? { ...actual, revision: respuesta.revision } : actual);
          }
          if (versionRef.current !== version) pendienteRef.current = true;
        }
        setGuardado("guardado");
        setMensaje("");
        return true;
      } catch (error) {
        pendienteRef.current = true;
        if (error?.status === 409) {
          conflictoRef.current = true;
          setGuardado("conflicto");
          setMensaje("Otro usuario modificó este periodo. Exporta tus cambios antes de recargar.");
        } else {
          setGuardado("error");
          setMensaje(mensajeError(error));
        }
        return false;
      }
    })();
    guardandoRef.current = tarea;
    try {
      return await tarea;
    } finally {
      if (guardandoRef.current === tarea) guardandoRef.current = null;
    }
  }

  function modificarPeriodo(accion) {
    if (!temaRef.current?.puede_editar || conflictoRef.current || navegandoRef.current || !periodoRef.current) return;
    const nuevo = accion(periodoRef.current);
    periodoRef.current = nuevo;
    versionRef.current += 1;
    pendienteRef.current = true;
    setPeriodo(nuevo);
    setGuardado("pendiente");
    clearTimeout(temporizadorRef.current);
    temporizadorRef.current = setTimeout(() => { guardarPendientes(); }, 850);
  }

  async function cargarPeriodo(tema, anioElegido) {
    const respuesta = await apiBusinessPlan.obtenerPeriodo(tema.id, anioElegido);
    const nuevo = {
      tema: tema.id, anio: anioElegido, revision: respuesta.revision,
      filas: respuesta.filas || [], columnas: respuesta.columnas || [],
    };
    periodoRef.current = nuevo;
    revisionRef.current = respuesta.revision;
    pendienteRef.current = false;
    versionRef.current = 0;
    conflictoRef.current = false;
    temaRef.current = tema;
    anioRef.current = anioElegido;
    setTemaActivo(tema);
    setAnio(anioElegido);
    setPeriodo(nuevo);
    setGuardado("guardado");
    setMensaje("");
  }

  async function cargarTablero(tablero, guardarAntes = true) {
    if (navegandoRef.current) return;
    navegandoRef.current = true;
    setNavegando(true);
    try {
      if (guardarAntes && !(await guardarPendientes())) return;
      const lista = await apiBusinessPlan.listarTemas(tablero.id);
      const tema = lista[0] || null;
      if (tema) {
        const datos = await apiBusinessPlan.obtenerPeriodo(tema.id, anioRef.current);
        const nuevo = { tema: tema.id, anio: anioRef.current, revision: datos.revision, filas: datos.filas || [], columnas: datos.columnas || [] };
        periodoRef.current = nuevo;
        revisionRef.current = datos.revision;
        pendienteRef.current = false;
        versionRef.current = 0;
        conflictoRef.current = false;
        temaRef.current = tema;
        setPeriodo(nuevo);
        setTemaActivo(tema);
      } else {
        periodoRef.current = null;
        temaRef.current = null;
        setTemaActivo(null);
        setPeriodo(null);
      }
      tableroRef.current = tablero;
      setTableroActivo(tablero);
      setTemas(lista);
      setGuardado("guardado");
      setMenu(null);
      setMensaje("");
    } catch (error) {
      setMensaje(mensajeError(error));
    } finally {
      navegandoRef.current = false;
      setNavegando(false);
    }
  }

  async function cambiarTema(tema, anioElegido = anioRef.current) {
    if (!tableroRef.current || navegandoRef.current) return;
    navegandoRef.current = true;
    setNavegando(true);
    try {
      if (!(await guardarPendientes())) return;
      await cargarPeriodo(tema, anioElegido);
      setMenu(null);
    } catch (error) {
      setMensaje(mensajeError(error));
    } finally {
      navegandoRef.current = false;
      setNavegando(false);
    }
  }

  async function actualizarListaTableros(preferidoId = tableroRef.current?.id) {
    const lista = await apiBusinessPlan.listarTableros();
    setTableros(lista);
    const elegido = lista.find((t) => t.id === preferidoId) || lista[0];
    if (elegido) await cargarTablero(elegido, false);
    else {
      tableroRef.current = null;
      temaRef.current = null;
      periodoRef.current = null;
      setTableroActivo(null);
      setTemaActivo(null);
      setPeriodo(null);
      setTemas([]);
    }
  }

  async function actualizarListaTemas(preferidoId = temaRef.current?.id) {
    const lista = await apiBusinessPlan.listarTemas(tableroRef.current.id);
    setTemas(lista);
    const elegido = lista.find((t) => t.id === preferidoId) || lista[0];
    if (elegido) await cambiarTema(elegido);
    else {
      temaRef.current = null;
      periodoRef.current = null;
      setTemaActivo(null);
      setPeriodo(null);
    }
  }

  function abrirModal(opciones) {
    setMenu(null);
    setModalError("");
    setModalValor(opciones.valor || "");
    setModal(opciones);
  }

  async function confirmarModal() {
    if (!modal || procesando) return;
    setProcesando(true);
    setModalError("");
    try {
      await modal.confirmar(modalValor.trim());
      setModal(null);
    } catch (error) {
      setModalError(mensajeError(error));
    } finally {
      setProcesando(false);
    }
  }

  function crearTablero() {
    abrirModal({
      tipo: "entrada", titulo: "Nuevo tablero", boton: "Crear tablero",
      mensaje: "Cada tablero pertenece a tu usuario y comienza sin indicadores.",
      confirmar: async (nombre) => {
        if (!nombre) throw new Error("Escribe un nombre para el tablero.");
        if (!(await guardarPendientes())) throw new Error("Guarda o resuelve los cambios actuales primero.");
        const creado = await apiBusinessPlan.crearTablero(nombre);
        await actualizarListaTableros(creado.id);
      },
    });
  }

  function editarTablero(tablero) {
    abrirModal({
      tipo: "entrada", titulo: "Renombrar tablero", valor: tablero.nombre, boton: "Guardar cambios",
      confirmar: async (nombre) => {
        if (!nombre) throw new Error("Escribe un nombre válido.");
        await apiBusinessPlan.editarTablero(tablero.id, nombre);
        const lista = await apiBusinessPlan.listarTableros();
        setTableros(lista);
        const actualizado = lista.find((t) => t.id === tablero.id);
        if (actualizado && tableroRef.current?.id === actualizado.id) {
          tableroRef.current = actualizado;
          setTableroActivo(actualizado);
        }
      },
    });
  }

  function eliminarTablero(tablero) {
    abrirModal({
      tipo: "peligro", titulo: "Enviar tablero a papelera", boton: "Mover a papelera",
      mensaje: `¿Mover “${tablero.nombre}” con todos sus temas y años a la papelera?`,
      confirmar: async () => {
        if (!(await guardarPendientes())) throw new Error("No se pudieron guardar los cambios actuales.");
        await apiBusinessPlan.eliminarTablero(tablero.id);
        await actualizarListaTableros(tableroRef.current?.id === tablero.id ? null : tableroRef.current?.id);
      },
    });
  }

  function abrirFormularioTema(tema = null) {
    setNombreTema(tema?.nombre || "");
    setSubtituloTema(tema?.subtitulo || "");
    setModalError("");
    setModalTema(tema ? { accion: "editar", id: tema.id } : { accion: "crear" });
  }

  async function guardarTema(evento) {
    evento.preventDefault();
    if (procesando) return;
    setProcesando(true);
    setModalError("");
    try {
      const nombre = nombreTema.trim();
      if (!nombre) throw new Error("Escribe el título del tema.");
      if (!(await guardarPendientes())) throw new Error("Resuelve los cambios pendientes primero.");
      if (modalTema.accion === "crear") {
        const nuevo = await apiBusinessPlan.crearTema(tableroRef.current.id, nombre, subtituloTema.trim());
        await actualizarListaTemas(nuevo.id);
      } else {
        const actualizado = await apiBusinessPlan.editarTema(modalTema.id, { nombre, subtitulo: subtituloTema.trim() });
        setTemas((actual) => actual.map((t) => t.id === actualizado.id ? actualizado : t));
        if (temaRef.current?.id === actualizado.id) {
          temaRef.current = actualizado;
          setTemaActivo(actualizado);
        }
      }
      setModalTema(null);
    } catch (error) {
      setModalError(mensajeError(error));
    } finally {
      setProcesando(false);
    }
  }

  function eliminarTema(tema) {
    abrirModal({
      tipo: "peligro", titulo: "Eliminar tema", boton: "Eliminar tema",
      mensaje: `Se eliminará “${tema.nombre}” y sus KPI de todos los años. Esta acción no se puede deshacer.`,
      confirmar: async () => {
        if (!(await guardarPendientes())) throw new Error("No se pudieron guardar los cambios actuales.");
        await apiBusinessPlan.eliminarTema(tema.id);
        await actualizarListaTemas(temaRef.current?.id === tema.id ? null : temaRef.current?.id);
      },
    });
  }

  function cambiarFila(id, campo, valor) {
    modificarPeriodo((actual) => ({
      ...actual,
      filas: actual.filas.map((fila) => fila.id === id ? { ...fila, [campo]: valor } : fila),
    }));
  }

  function agregarKPI() {
    const id = NUEVO_ID();
    modificarPeriodo((actual) => ({
      ...actual,
      filas: [...actual.filas, { id, kpi: "", descripcion: "", valores: Array(12).fill(""), extras: {} }],
    }));
    setEnfoque({ tipo: "fila", id });
  }

  function duplicarKPI(id) {
    const nuevoId = NUEVO_ID();
    modificarPeriodo((actual) => {
      const indice = actual.filas.findIndex((fila) => fila.id === id);
      if (indice < 0) return actual;
      const original = actual.filas[indice];
      const copia = { ...original, id: nuevoId, kpi: `${original.kpi || "Nuevo KPI"} (copia)`, valores: [...original.valores], extras: { ...original.extras } };
      const nuevas = [...actual.filas];
      nuevas.splice(indice + 1, 0, copia);
      return { ...actual, filas: nuevas };
    });
    setMenu(null);
    setEnfoque({ tipo: "fila", id: nuevoId });
  }

  function eliminarKPI(id) {
    const fila = filas.find((f) => f.id === id);
    abrirModal({
      tipo: "peligro", titulo: "Eliminar KPI", boton: "Eliminar KPI",
      mensaje: `¿Eliminar “${fila?.kpi || "Sin nombre"}” y todos sus valores?`,
      confirmar: async () => modificarPeriodo((actual) => ({ ...actual, filas: actual.filas.filter((f) => f.id !== id) })),
    });
  }

  function agregarColumna() {
    const id = NUEVO_ID();
    modificarPeriodo((actual) => ({ ...actual, columnas: [...actual.columnas, { id, nombre: "" }] }));
    setEnfoque({ tipo: "columna", id });
  }

  function eliminarColumna(id) {
    const columna = columnas.find((c) => c.id === id);
    abrirModal({
      tipo: "peligro", titulo: "Eliminar columna", boton: "Eliminar columna",
      mensaje: `¿Eliminar “${columna?.nombre || "Sin nombre"}” y los valores registrados?`,
      confirmar: async () => modificarPeriodo((actual) => ({
        ...actual,
        columnas: actual.columnas.filter((c) => c.id !== id),
        filas: actual.filas.map((fila) => {
          const extras = { ...fila.extras };
          delete extras[id];
          return { ...fila, extras };
        }),
      })),
    });
  }

  function abrirMenu(evento, tipo, id) {
    if (!puedeEditar) return;
    evento.preventDefault();
    setMenu({ tipo, id, x: Math.max(8, Math.min(evento.clientX, window.innerWidth - 190)), y: Math.max(8, Math.min(evento.clientY, window.innerHeight - 175)) });
  }

  async function abrirPapelera() {
    setModalEspecial("papelera");
    setMensaje("");
    try {
      setPapelera(await apiBusinessPlan.listarTableros(true));
    } catch (error) {
      setMensaje(mensajeError(error));
    }
  }

  async function restaurarTablero(tablero) {
    setProcesando(true);
    try {
      if (!(await guardarPendientes())) return;
      await apiBusinessPlan.restaurarTablero(tablero.id);
      setPapelera((actual) => actual.filter((t) => t.id !== tablero.id));
      setModalEspecial("");
      await actualizarListaTableros(tablero.id);
    } catch (error) {
      setMensaje(mensajeError(error));
    } finally {
      setProcesando(false);
    }
  }

  async function abrirInvitaciones() {
    setModalEspecial("invitaciones");
    try {
      setInvitaciones(await apiBusinessPlan.listarInvitaciones());
    } catch (error) {
      setMensaje(mensajeError(error));
    }
  }

  async function responderInvitacion(invitacion, accion) {
    setProcesando(true);
    try {
      await apiBusinessPlan.responderInvitacion(invitacion.tipo, invitacion.id, accion);
      setInvitaciones(await apiBusinessPlan.listarInvitaciones());
      if (accion === "aceptar") {
        const lista = await apiBusinessPlan.listarTableros();
        setTableros(lista);
        if (!tableroRef.current && lista.length) await cargarTablero(lista[0], false);
      }
    } catch (error) {
      setMensaje(mensajeError(error));
    } finally {
      setProcesando(false);
    }
  }

  async function abrirCompartir(tipo, recurso) {
    if (!recurso) return;
    setCompartir({ tipo, id: recurso.id, nombre: recurso.nombre });
    setBusqueda("");
    setUsuarios([]);
    setUsuarioInvitado(null);
    setRolInvitado("lector");
    setBusquedaRealizada(false);
    setCompartirError("");
    setCompartirExito("");
    setConfirmarRevocacion(null);
    setCargandoColaboradores(true);
    setColaboradores([]);
    try {
      const lista = tipo === "tablero"
        ? await apiBusinessPlan.listarColaboradoresTablero(recurso.id)
        : await apiBusinessPlan.listarColaboradoresTema(recurso.id);
      setColaboradores(lista);
    } catch (error) {
      setCompartirError(mensajeError(error));
    } finally {
      setCargandoColaboradores(false);
    }
  }

  async function buscarUsuarios() {
    const termino = busqueda.trim();
    setUsuarioInvitado(null);
    setCompartirError("");
    setCompartirExito("");
    if (termino.length < 2) {
      setCompartirError("Escribe al menos dos caracteres para buscar usuarios.");
      return;
    }
    setCargandoUsuarios(true);
    setBusquedaRealizada(false);
    try {
      setUsuarios(await apiBusinessPlan.buscarUsuarios(termino));
      setBusquedaRealizada(true);
    } catch (error) {
      setUsuarios([]);
      setCompartirError(mensajeError(error));
    } finally {
      setCargandoUsuarios(false);
    }
  }

  async function invitarUsuario() {
    if (!usuarioInvitado || !compartir || procesando) return;
    setProcesando(true);
    setCompartirError("");
    setCompartirExito("");
    try {
      if (compartir.tipo === "tablero") {
        await apiBusinessPlan.invitarTablero(compartir.id, usuarioInvitado.id_usuario, rolInvitado);
      } else {
        await apiBusinessPlan.invitarTema(compartir.id, usuarioInvitado.id_usuario, rolInvitado);
      }
      const lista = compartir.tipo === "tablero"
        ? await apiBusinessPlan.listarColaboradoresTablero(compartir.id)
        : await apiBusinessPlan.listarColaboradoresTema(compartir.id);
      setColaboradores(lista);
      setCompartirExito(`Invitación enviada a ${usuarioInvitado.nombre}. Quedará pendiente hasta que la acepte.`);
      setUsuarioInvitado(null);
      setUsuarios([]);
      setBusqueda("");
      setBusquedaRealizada(false);
    } catch (error) {
      setCompartirError(mensajeError(error));
    } finally {
      setProcesando(false);
    }
  }

  async function revocarUsuario(colaborador) {
    if (!compartir || procesando) return;
    setProcesando(true);
    setCompartirError("");
    setCompartirExito("");
    try {
      if (compartir.tipo === "tablero") {
        await apiBusinessPlan.revocarTablero(compartir.id, colaborador.usuario);
      } else {
        await apiBusinessPlan.revocarTema(compartir.id, colaborador.usuario);
      }
      setColaboradores((actual) => actual.filter((c) => c.id !== colaborador.id));
      setConfirmarRevocacion(null);
      setCompartirExito("Se revocó el acceso del usuario.");
    } catch (error) {
      setCompartirError(mensajeError(error));
    } finally {
      setProcesando(false);
    }
  }

  function exportarRespaldo() {
    if (!periodoRef.current) return;
    descargarArchivo(
      `BusinessPlan_respaldo_tema_${periodoRef.current.tema}_${periodoRef.current.anio}.json`,
      JSON.stringify({ ...periodoRef.current, revision: revisionRef.current }, null, 2),
      "application/json;charset=utf-8",
    );
  }

  function confirmarRecarga() {
    abrirModal({
      tipo: "peligro", titulo: "Descartar cambios locales", boton: "Recargar periodo",
      mensaje: "Si tienes cambios sin guardar se perderán. Puedes exportar un respaldo JSON antes de continuar.",
      confirmar: async () => {
        clearTimeout(temporizadorRef.current);
        await cargarPeriodo(temaRef.current, anioRef.current);
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2C51]">
      <header className="border-b border-[#DCE4EF] bg-white">
        <div className="mx-auto flex max-w-[1800px] items-center gap-5 px-5 py-3 lg:px-7">
          <img src={vwDark} alt="Volkswagen" className="h-12 w-12 shrink-0 object-contain lg:h-14 lg:w-14" />
          <div><h1 className="text-[23px] font-semibold text-[#092754]">Business Plan</h1><p className="text-[11px] text-[#73849E]">Planeación y seguimiento de indicadores comerciales</p></div>
          <div className="hidden h-[2px] flex-1 bg-[#142B64] md:block" />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={abrirPapelera} className={BOTON}><RotateCcw className="h-4 w-4" /> Papelera</button>
            <button type="button" onClick={abrirInvitaciones} className={BOTON}>
              <Mail className="h-4 w-4" /> Invitaciones
              {invitaciones.length > 0 && <span className="rounded-full bg-[#17366F] px-2 py-0.5 text-white">{invitaciones.length}</span>}
            </button>
            {administraTablero && <button
              type="button"
              disabled={navegando}
              onClick={() => abrirCompartir("tablero", tableroActivo)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#102A61] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#1B4685] disabled:opacity-50"
            ><UserPlus className="h-4 w-4" /> Invitar usuarios</button>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1800px] space-y-4 px-4 pb-10 pt-4 lg:px-7">
        {mensaje && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>{mensaje}</span>
          <button type="button" onClick={() => setMensaje("")} aria-label="Cerrar aviso"><X className="h-4 w-4" /></button>
        </div>}
        {cargando && <div className="flex items-center gap-2 rounded-xl bg-white p-4 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Cargando tus tableros...</div>}
        <section className="overflow-visible rounded-[26px] border border-[#17356B] bg-[#071E47] text-white shadow-[0_9px_20px_rgba(5,28,65,0.13)]">
          <div className="rounded-t-[25px] bg-gradient-to-r from-[#062B60] via-[#071E47] to-[#081636] px-5 py-5 lg:px-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#63B9ED]">Grupo Automotriz R&amp;R / Planeación comercial</p>
            <h2 className="mt-2 text-[24px] font-bold">Dashboard de Business Plan</h2>
            <p className="mt-1 text-xs text-[#A9C1DF]">{tableroActivo?.nombre || "Sin tablero seleccionado"} · {temaActivo?.nombre || "Sin tema"} · Ciclo {anio}</p>
            <div className="mt-5 grid grid-cols-1 gap-y-4 border-t border-white/15 pt-5 sm:grid-cols-3">
              {[
                { titulo: "TABLEROS ACCESIBLES", valor: tableros.length, detalle: "Propios y compartidos" },
                { titulo: "INDICADORES KPI", valor: filas.length, detalle: "Tema y año seleccionados" },
                { titulo: "CAPTURA MENSUAL", valor: `${progreso}%`, detalle: `${celdasCapturadas} de ${filas.length * 12} celdas` },
              ].map((dato, indice) => <div key={dato.titulo} className={`px-2 md:px-5 ${indice ? "md:border-l md:border-white/15" : ""}`}>
                <div className="text-[10px] font-semibold tracking-wide text-[#91B3DB]">{dato.titulo}</div>
                <div className="mt-1 text-[27px] font-semibold">{dato.valor}</div>
                <div className="mt-1 text-[11px] text-[#A6BAD6]">{dato.detalle}</div>
              </div>)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-b-[25px] border-t border-white/10 bg-[#071634] px-4 py-4 lg:px-5">
            <span className="mr-1 text-[10px] font-extrabold uppercase tracking-wide text-[#9BB0D1]">Tableros:</span>
            {tableros.map((tablero) => <div key={tablero.id} className="group/tablero relative flex items-center py-1">
              <button
                type="button"
                disabled={navegando}
                onClick={() => cargarTablero(tablero)}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-50 ${tableroActivo?.id === tablero.id ? "bg-white text-[#092754]" : "bg-[#20395F] text-[#D4E0F0] hover:bg-[#2C4C7D]"}`}
              >
                {tablero.nombre}{!tablero.es_propietario && <span className="ml-1 opacity-60">· Compartido</span>}
              </button>
              {tablero.es_propietario && <div className="pointer-events-none absolute bottom-[calc(100%-2px)] left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-lg border border-[#DCE5F2] bg-white p-1 opacity-0 shadow-xl transition group-hover/tablero:pointer-events-auto group-hover/tablero:opacity-100 group-focus-within/tablero:pointer-events-auto group-focus-within/tablero:opacity-100">
                <button type="button" title="Renombrar tablero" onClick={() => editarTablero(tablero)} className="rounded-md p-1.5 text-[#17366F] hover:bg-[#EFF4FC]"><Pencil className="h-3.5 w-3.5" /></button>
                <button type="button" title="Invitar colaboradores" onClick={() => abrirCompartir("tablero", tablero)} className="rounded-md p-1.5 text-[#17366F] hover:bg-[#EFF4FC]"><UserPlus className="h-3.5 w-3.5" /></button>
                <button type="button" title="Enviar a papelera" onClick={() => eliminarTablero(tablero)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>}
            </div>)}
            <button
              type="button"
              disabled={cargando || navegando}
              onClick={crearTablero}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-white/35 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/10 disabled:opacity-40"
            ><Plus className="h-3.5 w-3.5" /> Nuevo tablero</button>
            <div className="ml-auto flex items-center gap-2 pl-3">
              <label htmlFor="bp-anio" className="text-[10px] font-bold uppercase text-[#A9C1DF]">Año</label>
              <select
                id="bp-anio"
                disabled={!temaActivo || navegando}
                value={anio}
                onChange={(e) => cambiarTema(temaActivo, Number(e.target.value))}
                className="h-9 rounded-lg border border-white/25 bg-[#1F3D6A] px-3 text-xs font-bold text-white disabled:opacity-40"
              >
                {ANIOS.map((valor) => <option key={valor} value={valor} className="bg-white text-[#17366F]">{valor}</option>)}
              </select>
            </div>
          </div>
        </section>
        {!cargando && tableros.length === 0 && <div className="rounded-2xl border border-dashed border-[#D5E0EF] bg-white px-6 py-12 text-center">
          <Table2 className="mx-auto mb-3 h-8 w-8 text-[#7185A5]" /><h3 className="font-bold">Todavía no tienes tableros</h3>
          <p className="mt-1 text-sm text-[#73849E]">Crea el primero o acepta una invitación para trabajar con otros usuarios.</p>
          <button type="button" onClick={crearTablero} className={`${BOTON} mt-4`}><Plus className="h-4 w-4" /> Crear tablero</button>
        </div>}
        {tableroActivo && <section className="rounded-[22px] border border-[#DEE6F0] bg-white px-4 py-4 shadow-sm lg:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#7B8BA6]"><ListTree className="h-4 w-4" /> Temas:</span>
              {temas.map((tema) => <div key={tema.id} className="group/tema relative py-1">
                <button
                  type="button"
                  disabled={navegando}
                  onClick={() => cambiarTema(tema)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${temaActivo?.id === tema.id ? "border-[#14366D] bg-[#14366D] text-white" : "border-[#D5E0EF] bg-[#F6F9FD] text-[#315177] hover:bg-[#EDF4FD]"}`}
                >{tema.nombre}</button>
                {(tema.puede_editar || administraTablero || Number(tema.propietario) === idUsuario) && <div className="pointer-events-none absolute bottom-[calc(100%-2px)] left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-lg border border-[#DCE5F2] bg-white p-1 opacity-0 shadow-lg transition group-hover/tema:pointer-events-auto group-hover/tema:opacity-100 group-focus-within/tema:pointer-events-auto group-focus-within/tema:opacity-100">
                  {tema.puede_editar && <button type="button" title="Editar tema" onClick={() => abrirFormularioTema(tema)} className="rounded p-1.5 text-[#17366F] hover:bg-[#EFF4FC]"><Pencil className="h-3.5 w-3.5" /></button>}
                  {(administraTablero || Number(tema.propietario) === idUsuario) && <>
                    <button type="button" title="Compartir tema" onClick={() => abrirCompartir("tema", tema)} className="rounded p-1.5 text-[#17366F] hover:bg-[#EFF4FC]"><UserPlus className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Eliminar tema" onClick={() => eliminarTema(tema)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                  </>}
                </div>}
              </div>)}
              {puedeCrearTema && <button
                type="button"
                onClick={() => abrirFormularioTema()}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#AFC1DD] bg-white px-3.5 py-2 text-xs font-semibold text-[#17366F] hover:bg-[#EEF4FD]"
              ><Plus className="h-4 w-4" /> Nuevo tema</button>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs text-[#73849E]">
                {tableroActivo.es_propietario ? "Eres propietario" : `Compartido por ${tableroActivo.propietario_nombre}`}
              </span>
              {administraTablero && <button
                type="button"
                disabled={navegando}
                onClick={() => abrirCompartir("tablero", tableroActivo)}
                className={BOTON}
              ><Users className="h-4 w-4" /> Compartir tablero</button>}
              {administraTema && <button
                type="button"
                disabled={navegando}
                onClick={() => abrirCompartir("tema", temaActivo)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#1B4E8F] bg-[#EFF5FE] px-3 py-2 text-xs font-semibold text-[#17366F] transition hover:bg-[#E1EEFE] disabled:opacity-50"
              ><UserPlus className="h-4 w-4" /> Compartir tema</button>}
            </div>
          </div>
          <div className="mt-3 rounded-xl border-l-[3px] border-[#2469B0] bg-[#F5F8FD] px-4 py-3">
            <p className="text-sm font-bold text-[#102A61]">{temaActivo?.nombre || "Sin temas"}</p>
            <p className="mt-0.5 text-xs text-[#73849E]">{temaActivo?.subtitulo || "Crea o selecciona un tema para capturar tus indicadores."}</p>
          </div>
        </section>}
        {tableroActivo && !temaActivo && <div className="rounded-xl border bg-white p-10 text-center text-sm text-slate-500">No hay temas disponibles en este tablero.</div>}
        {temaActivo && periodo && <section className="overflow-hidden rounded-[24px] border border-[#D7E2EF] bg-white shadow-[0_12px_30px_rgba(14,36,80,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4EAF3] px-4 py-3 lg:px-5">
            <div className="flex items-center gap-3"><span className="rounded-lg bg-[#EFF4FC] p-2.5 text-[#153B72]"><Table2 className="h-4 w-4" /></span>
              <div><p className="text-sm font-bold text-[#102A61]">{temaActivo.nombre}</p><p className="text-[11px] text-[#788AA3]">{tableroActivo.nombre} · {anio} · {puedeEditar ? "Edición habilitada" : "Solo lectura"}</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 text-xs text-[#64748B]">{guardado === "guardando" ? "Guardando..." : guardado === "pendiente" ? "Cambios pendientes" : guardado === "guardado" ? "Guardado" : guardado === "conflicto" ? "Conflicto de edición" : "Error al guardar"}</span>
              {(guardado === "error" || guardado === "pendiente") && <button type="button" onClick={guardarPendientes} className={BOTON}><Save className="h-4 w-4" /> Guardar</button>}
              {(guardado === "error" || guardado === "conflicto") && <button type="button" onClick={exportarRespaldo} className={BOTON}><Download className="h-4 w-4" /> Respaldo</button>}
              {guardado === "conflicto" && <button type="button" onClick={confirmarRecarga} className={BOTON}><RotateCcw className="h-4 w-4" /> Recargar</button>}
              <button type="button" onClick={abrirPapelera} className={BOTON}><RotateCcw className="h-4 w-4" /> Papelera</button>
              <button type="button" onClick={() => exportarCSV(tableroActivo, temaActivo, anio, periodo)} className={`${BOTON} border-emerald-200 bg-emerald-50 text-emerald-800`}><FileSpreadsheet className="h-4 w-4" /> Exportar Excel</button>
            </div>
          </div>
          <div ref={referenciaTabla} className="max-h-[68vh] overflow-auto">
            <table className="w-full min-w-[1500px] border-separate border-spacing-0 text-xs">
              <thead><tr className="sticky top-0 z-30 bg-[#102A61] text-white">
                <th className="sticky left-0 z-40 w-[225px] min-w-[225px] border-r border-white/15 bg-[#132B60] px-4 py-4 text-left">Indicador (KPI)</th>
                <th className="sticky left-[225px] z-40 w-[275px] min-w-[275px] border-r border-white/15 bg-[#132B60] px-4 py-4 text-left">Descripción</th>
                {columnas.map((columna) => <th key={columna.id} onContextMenu={(e) => abrirMenu(e, "columna", columna.id)} className="min-w-[170px] border-r border-white/15 p-2">
                  <div className="flex items-center gap-1">
                    <input
                      data-columna={columna.id}
                      disabled={!puedeEditar}
                      value={columna.nombre}
                      onChange={(e) => modificarPeriodo((actual) => ({ ...actual, columnas: actual.columnas.map((c) => c.id === columna.id ? { ...c, nombre: e.target.value } : c) }))}
                      placeholder="Nombre de columna"
                      className="min-w-0 flex-1 rounded-md border border-white/25 bg-white/10 px-2 py-1.5 text-center text-xs text-white placeholder:text-white/60 outline-none disabled:opacity-70"
                    />
                    {puedeEditar && <button type="button" title="Eliminar columna" onClick={() => eliminarColumna(columna.id)} className="rounded p-1 hover:bg-red-500"><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                </th>)}
                <th className="w-[42px] min-w-[42px] border-r border-white/15 bg-[#132B60] px-1">
                  {puedeEditar && <button type="button" onClick={agregarColumna} title="Agregar columna" className="mx-auto rounded p-2 hover:bg-white/20"><Plus className="h-4 w-4" /></button>}
                </th>
                {MESES.map((mes, indice) => <th key={mes} className={`min-w-[85px] border-r border-white/15 px-2 py-3 text-center ${indice % 3 === 0 ? "border-l-2 border-l-blue-300/50" : ""}`}>{mes}<span className="block text-[9px] font-normal text-[#9DBBE3]">T{Math.floor(indice / 3) + 1}</span></th>)}
              </tr></thead>
              <tbody>
                {filas.map((fila, indiceFila) => <tr key={fila.id} data-fila={fila.id} onContextMenu={(e) => abrirMenu(e, "fila", fila.id)} className="group hover:bg-[#EAF2FD]">
                  <td className={`sticky left-0 z-10 border-b border-r border-[#E4EAF3] px-2 py-1.5 ${indiceFila % 2 ? "bg-[#F8FAFD]" : "bg-white"} group-hover:bg-[#EAF2FD]`}>
                    <div className="flex items-center gap-0.5"><input
                      data-campo="kpi"
                      disabled={!puedeEditar}
                      value={fila.kpi}
                      onChange={(e) => cambiarFila(fila.id, "kpi", e.target.value)}
                      placeholder="Nombre del KPI"
                      className="w-full min-w-0 rounded px-2 py-2 text-xs font-semibold text-[#172F60] outline-none focus:bg-white disabled:bg-transparent"
                    />
                      {puedeEditar && <><button type="button" title="Eliminar KPI" onClick={() => eliminarKPI(fila.id)} className="rounded p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        <button
                          type="button"
                          title="Más opciones"
                          onClick={(e) => { const caja = e.currentTarget.getBoundingClientRect(); abrirMenu({ preventDefault() { }, clientX: caja.left, clientY: caja.bottom }, "fila", fila.id); }}
                          className="rounded p-1 text-slate-400 hover:text-[#131E5C]"
                        ><MoreVertical className="h-4 w-4" /></button></>}
                    </div>
                  </td>
                  <td className={`sticky left-[225px] z-10 border-b border-r border-[#E4EAF3] px-2 py-1.5 ${indiceFila % 2 ? "bg-[#F8FAFD]" : "bg-white"} group-hover:bg-[#EAF2FD]`}>
                    <input
                      disabled={!puedeEditar}
                      value={fila.descripcion}
                      onChange={(e) => cambiarFila(fila.id, "descripcion", e.target.value)}
                      placeholder="Descripción"
                      className="w-full rounded px-2 py-2 text-xs text-[#63728C] outline-none focus:bg-white disabled:bg-transparent"
                    />
                  </td>
                  {columnas.map((columna) => <td key={columna.id} className="border-b border-r border-[#E4EAF3] p-1">
                    <input
                      disabled={!puedeEditar}
                      value={fila.extras?.[columna.id] ?? ""}
                      onChange={(e) => cambiarFila(fila.id, "extras", { ...fila.extras, [columna.id]: e.target.value })}
                      placeholder="—"
                      className="w-full rounded px-1 py-2 text-center text-xs outline-none focus:bg-[#ECF5FF] disabled:bg-transparent"
                    />
                  </td>)}
                  <td className="border-b border-r border-[#E4EAF3] bg-[#F7F9FC]" />
                  {MESES.map((_, indice) => <td key={indice} className={`border-b border-r border-[#E4EAF3] p-1 ${indice % 3 === 0 ? "border-l-2 border-[#D5E2F5]" : ""}`}>
                    <input disabled={!puedeEditar} value={fila.valores?.[indice] ?? ""} onChange={(e) => {
                      const valores = [...(fila.valores || Array(12).fill(""))];
                      valores[indice] = e.target.value;
                      cambiarFila(fila.id, "valores", valores);
                    }} placeholder="—" className="w-full rounded px-1 py-2 text-center text-xs outline-none focus:bg-[#ECF5FF] disabled:bg-transparent" />
                  </td>)}
                </tr>)}
                {filas.length === 0 && <tr><td colSpan={columnas.length + 15} className="px-6 py-12 text-center text-[#8A98AA]">No hay indicadores en este tema y año.</td></tr>}
                {puedeEditar && <tr className="bg-[#F8FAFD]"><td className="sticky left-0 z-10 border-b border-r bg-[#F8FAFD] px-3 py-2"><button type="button" onClick={agregarKPI} className={BOTON}><Plus className="h-4 w-4" /> Agregar KPI</button></td><td className="sticky left-[225px] z-10 border-b border-r bg-[#F8FAFD] px-3 py-2 text-[#9AA7B9]">Agregar indicador</td><td colSpan={columnas.length + 13} className="border-b" /></tr>}
              </tbody>
            </table>
          </div>
        </section>}
        {tableroActivo && <div className="flex justify-end"><button type="button" onClick={abrirPapelera} className={BOTON}><RotateCcw className="h-4 w-4" /> Ver papelera</button></div>}
      </main>
      {modal && <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#101A3B]/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !procesando) setModal(null); }}>
        <div role="dialog" aria-modal="true" className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b p-5"><div className="flex gap-3"><span className={`rounded-xl p-3 ${modal.tipo === "peligro" ? "bg-red-50 text-red-600" : "bg-[#EFF4FC] text-[#17366F]"}`}>{modal.tipo === "peligro" ? <AlertTriangle className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}</span><div><h3 className="text-lg font-bold text-[#102A61]">{modal.titulo}</h3>{modal.mensaje && <p className="mt-1 text-sm text-slate-500">{modal.mensaje}</p>}</div></div><button type="button" onClick={() => setModal(null)} disabled={procesando}><X className="h-5 w-5" /></button></div>
          <form onSubmit={(e) => { e.preventDefault(); confirmarModal(); }}><div className="p-5">
            {modal.tipo === "entrada" && <input autoFocus value={modalValor} onChange={(e) => setModalValor(e.target.value)} maxLength={120} placeholder="Nombre" className={ENTRADA} />}
            {modalError && <p role="alert" className="mt-2 text-sm text-red-600">{modalError}</p>}
          </div><div className="flex justify-end gap-2 border-t bg-[#FAFBFE] p-4"><button type="button" onClick={() => setModal(null)} disabled={procesando} className={BOTON}>Cancelar</button><button
            type="submit"
            disabled={procesando}
            className={`rounded-lg px-5 py-2 text-xs font-bold text-white disabled:opacity-40 ${modal.tipo === "peligro" ? "bg-red-600" : "bg-[#102A61]"}`}
          >{procesando ? "Procesando..." : modal.boton}</button></div></form>
        </div>
      </div>}
      {modalTema && <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#101A3B]/60 p-4">
        <div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex justify-between border-b p-5"><h3 className="text-lg font-bold text-[#102A61]">{modalTema.accion === "crear" ? "Nuevo tema" : "Editar tema"}</h3><button type="button" onClick={() => setModalTema(null)}><X className="h-5 w-5" /></button></div>
          <form onSubmit={guardarTema} className="space-y-4 p-5"><div><label className="mb-1 block text-xs font-bold">Título del tema</label><input autoFocus maxLength={80} value={nombreTema} onChange={(e) => setNombreTema(e.target.value)} className={ENTRADA} /></div><div><label className="mb-1 block text-xs font-bold">Subtítulo / descripción</label><textarea rows={3} maxLength={220} value={subtituloTema} onChange={(e) => setSubtituloTema(e.target.value)} className={ENTRADA} /></div>
            {modalError && <p role="alert" className="text-sm text-red-600">{modalError}</p>}
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setModalTema(null)} className={BOTON}>Cancelar</button><button type="submit" disabled={procesando} className="rounded-lg bg-[#102A61] px-5 py-2 text-xs font-bold text-white disabled:opacity-40">{modalTema.accion === "crear" ? "Crear tema" : "Guardar cambios"}</button></div>
          </form>
        </div>
      </div>}
      {modalEspecial && <div className="fixed inset-0 z-[135] flex items-center justify-center bg-[#101A3B]/60 p-4">
        <div role="dialog" aria-modal="true" className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b p-5"><div><h3 className="text-lg font-bold text-[#102A61]">{modalEspecial === "papelera" ? "Papelera de tableros" : "Mis invitaciones"}</h3><p className="text-xs text-slate-500">{modalEspecial === "papelera" ? "Solo aparecen los tableros que te pertenecen." : "Acepta o rechaza las invitaciones pendientes."}</p></div><button type="button" onClick={() => setModalEspecial("")}><X className="h-5 w-5" /></button></div>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
            {mensaje && <p role="status" className="rounded-lg bg-[#F5F8FD] p-3 text-xs text-[#17366F]">{mensaje}</p>}
            {modalEspecial === "papelera" && (papelera.length ? papelera.map((tablero) => <div key={tablero.id} className="flex items-center justify-between gap-3 rounded-xl border bg-[#FAFBFE] p-4"><div className="font-bold text-[#102A61]">{tablero.nombre}</div><button type="button" disabled={procesando} onClick={() => restaurarTablero(tablero)} className={BOTON}><RotateCcw className="h-4 w-4" /> Restaurar</button></div>) : <p className="py-8 text-center text-sm text-slate-500">No hay tableros en la papelera.</p>)}
            {modalEspecial === "invitaciones" && (invitaciones.length ? invitaciones.map((inv) => <div key={`${inv.tipo}-${inv.id}`} className="rounded-xl border bg-[#FAFBFE] p-4"><div className="font-bold text-[#102A61]">{inv.nombre}</div><p className="mt-1 text-xs text-slate-500">{inv.tipo === "tema" ? `Tema de ${inv.tablero}` : "Tablero"} · Invitó {inv.invitado_por} · {inv.rol}</p><div className="mt-3 flex gap-2"><button type="button" disabled={procesando} onClick={() => responderInvitacion(inv, "aceptar")} className={BOTON}><CheckCircle2 className="h-4 w-4" /> Aceptar</button><button type="button" disabled={procesando} onClick={() => responderInvitacion(inv, "rechazar")} className={BOTON}>Rechazar</button></div></div>) : <p className="py-8 text-center text-sm text-slate-500">No tienes invitaciones pendientes.</p>)}
          </div><div className="flex justify-end border-t p-4"><button type="button" onClick={() => setModalEspecial("")} className={BOTON}>Cerrar</button></div>
        </div>
      </div>}
      {compartir && <div
        className="fixed inset-0 z-[150] flex items-center justify-center bg-[#101A3B]/65 p-4 backdrop-blur-[2px]"
        onMouseDown={(e) => { if (e.target === e.currentTarget && !procesando) setCompartir(null); }}
      >
        <div role="dialog" aria-modal="true" aria-labelledby="bp-compartir-titulo" className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#DCE5F2] bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-[#E4EAF3] p-5">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-[#EFF4FC] p-3 text-[#17366F]"><UserPlus className="h-5 w-5" /></span>
              <div>
                <h3 id="bp-compartir-titulo" className="text-lg font-bold text-[#102A61]">Invitar usuarios del CRM</h3>
                <p className="mt-0.5 text-xs text-[#73849E]">Elige qué deseas compartir y los permisos del invitado.</p>
              </div>
            </div>
            <button type="button" onClick={() => setCompartir(null)} disabled={procesando} aria-label="Cerrar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-5 overflow-y-auto p-5">
            {administraTablero && <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#63748E]">¿Qué deseas compartir?</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={procesando || cargandoColaboradores}
                  onClick={() => { if (compartir.tipo !== "tablero") abrirCompartir("tablero", tableroActivo); }}
                  className={`rounded-xl border p-3 text-left transition ${compartir.tipo === "tablero" ? "border-[#17366F] bg-[#EFF4FC]" : "border-[#DCE5F2] hover:bg-[#F8FAFD]"}`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-[#17366F]"><Users className="h-4 w-4" /> Tablero completo</span>
                  <span className="mt-1 block text-xs text-[#73849E]">Acceso a todos sus temas y años.</span>
                </button>
                <button
                  type="button"
                  disabled={!temaActivo || procesando || cargandoColaboradores}
                  onClick={() => { if (compartir.tipo !== "tema") abrirCompartir("tema", temaActivo); }}
                  className={`rounded-xl border p-3 text-left transition disabled:opacity-40 ${compartir.tipo === "tema" ? "border-[#17366F] bg-[#EFF4FC]" : "border-[#DCE5F2] hover:bg-[#F8FAFD]"}`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-[#17366F]"><ListTree className="h-4 w-4" /> Solo tema actual</span>
                  <span className="mt-1 block text-xs text-[#73849E]">Acceso únicamente a {temaActivo?.nombre || "un tema"}.</span>
                </button>
              </div>
            </div>}
            <div className="rounded-xl border border-[#DCE5F2] bg-[#F8FAFD] px-4 py-3">
              <p className="text-xs font-bold text-[#17366F]">Compartiendo {compartir.tipo}: {compartir.nombre}</p>
              <p className="mt-1 text-xs text-[#63748E]">El invitado debe aceptar desde su sección de Invitaciones.</p>
            </div>
            {compartirError && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{compartirError}</div>}
            {compartirExito && <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {compartirExito}</div>}
            <div>
              <label htmlFor="bp-buscar-usuario" className="mb-2 block text-xs font-bold text-[#17366F]">1. Buscar usuario existente</label>
              <form onSubmit={(e) => { e.preventDefault(); buscarUsuarios(); }} className="flex gap-2">
                <input
                  id="bp-buscar-usuario"
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setUsuarios([]); setUsuarioInvitado(null); setBusquedaRealizada(false); setCompartirError(""); }}
                  placeholder="Nombre, apellido, correo o nombre de usuario"
                  autoComplete="off"
                  className={ENTRADA}
                />
                <button type="submit" disabled={cargandoUsuarios || procesando || cargandoColaboradores} className={BOTON}>
                  {cargandoUsuarios ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Buscar
                </button>
              </form>
              {usuarios.length > 0 && <div className="mt-2 max-h-44 overflow-auto rounded-xl border border-[#DCE5F2]">
                {usuarios.map((usuario) => <button
                  key={usuario.id_usuario}
                  type="button"
                  onClick={() => { setUsuarioInvitado(usuario); setCompartirError(""); }}
                  className={`flex w-full items-center justify-between gap-3 border-b border-[#E8EDF5] px-4 py-3 text-left last:border-0 hover:bg-[#F0F5FD] ${usuarioInvitado?.id_usuario === usuario.id_usuario ? "bg-[#E8F0FC]" : "bg-white"}`}
                >
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#17366F]">{usuario.nombre}</span><span className="block text-xs text-[#73849E]">@{usuario.usuario}</span></span>
                  {usuarioInvitado?.id_usuario === usuario.id_usuario ? <CheckCircle2 className="h-5 w-5 text-[#17366F]" /> : <Plus className="h-4 w-4 text-[#73849E]" />}
                </button>)}
              </div>}
              {busquedaRealizada && !usuarios.length && <p className="mt-2 text-xs text-[#73849E]">No se encontraron usuarios con esa búsqueda.</p>}
            </div>
            <div className="rounded-xl border border-[#DCE5F2] p-4">
              <label htmlFor="bp-rol-invitado" className="mb-3 block text-xs font-bold text-[#17366F]">2. Asignar permisos y enviar invitación</label>
              {usuarioInvitado ? <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1"><p className="text-[11px] text-[#73849E]">Usuario seleccionado</p><p className="truncate text-sm font-bold text-[#102A61]">{usuarioInvitado.nombre}</p><p className="text-xs text-[#73849E]">@{usuarioInvitado.usuario}</p></div>
                <div className="w-full sm:w-36"><p className="mb-1 text-[11px] text-[#73849E]">Rol</p><select id="bp-rol-invitado" value={rolInvitado} onChange={(e) => setRolInvitado(e.target.value)} className={ENTRADA}><option value="lector">Lector</option><option value="editor">Editor</option></select></div>
                <button type="button" disabled={procesando || cargandoColaboradores} onClick={invitarUsuario} className="inline-flex items-center gap-2 rounded-lg bg-[#102A61] px-4 py-3 text-xs font-bold text-white hover:bg-[#1B4685] disabled:opacity-50">
                  {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Enviar invitación
                </button>
              </div> : <p className="text-xs text-[#73849E]">Selecciona un resultado de la búsqueda para asignar permisos.</p>}
              <p className="mt-3 text-[11px] leading-relaxed text-[#73849E]"><strong>Lector:</strong> consulta los KPI. <strong>Editor:</strong> también puede modificarlos. Ninguno administra invitaciones a menos que sea propietario.</p>
            </div>
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-bold text-[#102A61]">Colaboradores del {compartir.tipo}</h4><span className="rounded-full bg-[#EFF4FC] px-2 py-1 text-[11px] font-semibold text-[#17366F]">{colaboradores.length} usuario(s)</span></div>
              {cargandoColaboradores ? <p className="flex items-center gap-2 text-xs text-[#73849E]"><Loader2 className="h-4 w-4 animate-spin" /> Cargando colaboradores...</p> : colaboradores.length ? <div className="divide-y divide-[#E4EAF3] rounded-xl border border-[#DCE5F2]">
                {colaboradores.map((colaborador) => <div key={colaborador.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div><p className="text-sm font-semibold text-[#17366F]">{colaborador.usuario_nombre}</p><p className="mt-1 text-xs text-[#73849E]">{colaborador.rol === "editor" ? "Editor" : "Lector"} · {colaborador.estado === "aceptada" ? "Acceso activo" : "Invitación pendiente"}</p></div>
                  {confirmarRevocacion === colaborador.id ? <div className="flex items-center gap-2"><span className="text-xs text-red-600">¿Revocar?</span><button type="button" disabled={procesando} onClick={() => revocarUsuario(colaborador)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Sí</button><button type="button" disabled={procesando} onClick={() => setConfirmarRevocacion(null)} className={BOTON}>No</button></div> : <button type="button" disabled={procesando} onClick={() => setConfirmarRevocacion(colaborador.id)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Revocar</button>}
                </div>)}
              </div> : <p className="rounded-lg border border-dashed border-[#DCE5F2] px-4 py-5 text-center text-xs text-[#73849E]">Aún no has invitado usuarios a este {compartir.tipo}.</p>}
            </div>
          </div>
          <div className="flex justify-end border-t border-[#E4EAF3] bg-[#FAFBFE] px-5 py-4"><button type="button" disabled={procesando} onClick={() => setCompartir(null)} className={BOTON}>Cerrar</button></div>
        </div>
      </div>}
      {menu && <><div className="fixed inset-0 z-[90]" onClick={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} /><div className="fixed z-[100] w-44 overflow-hidden rounded-xl border bg-white py-1 shadow-xl" style={{ left: menu.x, top: menu.y }}>
        {menu.tipo === "fila" ? <><button
          type="button"
          onClick={() => { setEnfoque({ tipo: "fila", id: menu.id }); setMenu(null); }}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
        ><Pencil className="h-4 w-4" /> Editar KPI</button><button type="button" onClick={() => duplicarKPI(menu.id)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"><Copy className="h-4 w-4" /> Duplicar KPI</button><button type="button" onClick={() => eliminarKPI(menu.id)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Eliminar KPI</button></> : <><button
          type="button"
          onClick={() => { setEnfoque({ tipo: "columna", id: menu.id }); setMenu(null); }}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
        ><Pencil className="h-4 w-4" /> Renombrar</button><button type="button" onClick={() => eliminarColumna(menu.id)} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Eliminar columna</button></>}
      </div></>}
    </div>
  );
}
