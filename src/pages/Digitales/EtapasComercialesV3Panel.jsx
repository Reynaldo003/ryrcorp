// src/pages/Digitales/EtapasComercialesV3Panel.jsx
// Vista piloto consulta y primera confirmación manual (cotización).
import { useEffect, useRef, useState } from "react";
import { Activity, CheckCircle2, Clock3, Loader2, RefreshCw, ShieldAlert, FileCheck2 } from "lucide-react";
import { apiEtapasV3 } from "../../lib/apiEtapasV3";

const ETAPAS = [
  ["nuevo_prospecto", "Nuevo prospecto", "Automática"],
  ["en_seguimiento", "En seguimiento", "Automática"],
  ["cotizacion_enviada", "Cotización enviada", "Confirmación manual"],
  ["cita_agendada", "Cita agendada", "Confirmación manual"],
  ["cita_asistida", "Cita asistida", "Confirmación manual"],
  ["documentos_enviados", "Documentos recibidos", "Confirmación manual"],
  ["autorizado_no_formalizado", "Autorizado no formalizado", "Selección manual"],
  ["compra_futura", "Compra futura", "Selección manual"],
  ["facturado", "Facturado", "Automática"],
  ["lead_perdido", "Lead perdido", "Selección manual"],
];
// Motivos de la propuesta comercial; el backend valida el mismo catálogo.
const MOTIVOS_LEAD_PERDIDO = [
  ['no_responde', 'No responde'],
  ['numero_incorrecto', 'Número incorrecto / inexistente'],
  ['bloqueo_contacto', 'Bloqueó el contacto'],
  ['compro_otra_marca', 'Compró en otra marca'],
  ['compro_otra_agencia_vw', 'Compró en otra agencia VW'],
  ['sin_interes', 'Ya no está interesado'],
  ['precio_fuera_presupuesto', 'Precio fuera de presupuesto'],
  ['no_acepta_toma', 'No acepta oferta de toma'],
  ['mal_buro_credito', 'Mal Buró de Crédito'],
  ['sin_ingresos_comprobables', 'Sin ingresos comprobables'],
  ['credito_rechazado', 'Crédito rechazado'],
  ['enganche_insuficiente', 'Enganche insuficiente'],
  ['mensualidad_fuera_presupuesto', 'Mensualidad fuera de presupuesto'],
  ['vehiculo_no_disponible', 'Vehículo no disponible'],
  ['version_color_no_disponible', 'Versión o color no disponible'],
  ['tiempo_entrega_no_aceptado', 'No acepta tiempo de entrega'],
  ['otra_area_empresa', 'Otra área de la empresa'],
  ['registro_duplicado', 'Registro duplicado'],
  ['spam', 'Spam'],
  ['otro_motivo', 'Otro motivo (especificar)'],
];
const LABELS = Object.fromEntries(ETAPAS.map(([id, label]) => [id, label]));
const EVENTOS = {
  seguimiento: "Seguimiento humano",
  cotizacion_enviada: "Cotización confirmada",
  cita_agendada: "Cita registrada",
  cita_asistida: "Asistencia confirmada",
  cita_no_asistida: "Inasistencia",
  documentos_recibidos: "Documentos recibidos",
  documentos_enviados: "Documentos recibidos",
  credito_autorizado: "Crédito autorizado",
  compra_futura: "Compra futura",
  factura_registrada: "Factura registrada",
  lead_perdido: "Lead perdido",
  reactivacion: "Reactivación",
  correccion: "Corrección de actividad",
};

function fechaCorta(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || "")) return "Sin fecha efectiva";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

// Fecha de negocio de la sucursal, no fecha UTC del navegador.
function fechaHoyMx() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const valor = (tipo) => partes.find((p) => p.type === tipo)?.value || "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

function nuevaClaveIdempotencia() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `cotizacion:${crypto.randomUUID()}`;
  return `cotizacion:${Date.now()}:${Math.random().toString(36).slice(2, 14)}`;
}

export default function EtapasComercialesV3Panel({ expedienteId }) {
  const [revision, setRevision] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [fechaEnvio, setFechaEnvio] = useState(fechaHoyMx);
  const [vehiculo, setVehiculo] = useState("");
  const [referencia, setReferencia] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState("");
  const [avisoRegistro, setAvisoRegistro] = useState("");
  const intentoRef = useRef(null);
  const [mostrarFormularioCita, setMostrarFormularioCita] = useState(false);
  const [citaIdTexto, setCitaIdTexto] = useState("");
  const [confirmarCita, setConfirmarCita] = useState(false);
  const [guardandoCita, setGuardandoCita] = useState(false);
  const [errorCita, setErrorCita] = useState("");
  const [avisoCita, setAvisoCita] = useState("");
  const intentoCitaRef = useRef(null);
  // Fase 12: la cita debe estar previamente vinculada; solo se registra visita real.
  const [mostrarAsistencia, setMostrarAsistencia] = useState(false);
  const [citaAsistenciaTexto, setCitaAsistenciaTexto] = useState("");
  const [fechaAsistencia, setFechaAsistencia] = useState("");
  const [confirmarAsistencia, setConfirmarAsistencia] = useState(false);
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);
  const [errorAsistencia, setErrorAsistencia] = useState("");
  const [avisoAsistencia, setAvisoAsistencia] = useState("");
  const intentoAsistenciaRef = useRef(null);
  // Fase 13: documentos pueden llegar antes de que ocurra la cita.
  const [mostrarDocumentos, setMostrarDocumentos] = useState(false);
  const [fechaRecepcion, setFechaRecepcion] = useState(fechaHoyMx);
  const [listaDocumentosTexto, setListaDocumentosTexto] = useState("");
  const [confirmarDocumentos, setConfirmarDocumentos] = useState(false);
  const [guardandoDocumentos, setGuardandoDocumentos] = useState(false);
  const [errorDocumentos, setErrorDocumentos] = useState("");
  const [avisoDocumentos, setAvisoDocumentos] = useState("");
  const intentoDocumentosRef = useRef(null);
  // Fase 14: autorización declarada, independiente de campos históricos.
  const [mostrarAutorizacion, setMostrarAutorizacion] = useState(false);
  const [fechaAutorizacion, setFechaAutorizacion] = useState(fechaHoyMx);
  const [referenciaAutorizacion, setReferenciaAutorizacion] = useState("");
  const [confirmarAutorizacion, setConfirmarAutorizacion] = useState(false);
  const [guardandoAutorizacion, setGuardandoAutorizacion] = useState(false);
  const [errorAutorizacion, setErrorAutorizacion] = useState("");
  const [avisoAutorizacion, setAvisoAutorizacion] = useState("");
  const intentoAutorizacionRef = useRef(null);
  // Fase 15: Compra futura es una situación de seguimiento, no una venta perdida.
  const [mostrarCompraFutura, setMostrarCompraFutura] = useState(false);
  const [fechaCompraPrevista, setFechaCompraPrevista] = useState("");
  const [fechaProximoContacto, setFechaProximoContacto] = useState("");
  const [observacionCompra, setObservacionCompra] = useState("");
  const [confirmarCompra, setConfirmarCompra] = useState(false);
  const [guardandoCompra, setGuardandoCompra] = useState(false);
  const [errorCompra, setErrorCompra] = useState("");
  const [avisoCompra, setAvisoCompra] = useState("");
  const intentoCompraRef = useRef(null);
  const [mostrarReactivacion, setMostrarReactivacion] = useState(false);
  const [motivoReactivacion, setMotivoReactivacion] = useState("");
  const [confirmarReactivacion, setConfirmarReactivacion] = useState(false);
  const [guardandoReactivacion, setGuardandoReactivacion] = useState(false);
  const [errorReactivacion, setErrorReactivacion] = useState("");
  const [avisoReactivacion, setAvisoReactivacion] = useState("");
  const intentoReactivacionRef = useRef(null);
  // Fase 17: Lead perdido solo con motivo de catálogo y confirmación explícita.
  const [mostrarPerdida, setMostrarPerdida] = useState(false);
  const [motivoPerdida, setMotivoPerdida] = useState("");
  const [detallePerdida, setDetallePerdida] = useState("");
  const [confirmarPerdida, setConfirmarPerdida] = useState(false);
  const [guardandoPerdida, setGuardandoPerdida] = useState(false);
  const [errorPerdida, setErrorPerdida] = useState("");
  const [avisoPerdida, setAvisoPerdida] = useState("");
  const intentoPerdidaRef = useRef(null);

  useEffect(() => {
    setMostrarFormulario(false);
    setFechaEnvio(fechaHoyMx());
    setVehiculo("");
    setReferencia("");
    setConfirmar(false);
    setErrorRegistro("");
    setAvisoRegistro("");
    intentoRef.current = null;
    setMostrarFormularioCita(false);
    setCitaIdTexto("");
    setConfirmarCita(false);
    setErrorCita("");
    setAvisoCita("");
    intentoCitaRef.current = null;
    setMostrarAsistencia(false);
    setCitaAsistenciaTexto("");
    setFechaAsistencia("");
    setConfirmarAsistencia(false);
    setErrorAsistencia("");
    setAvisoAsistencia("");
    intentoAsistenciaRef.current = null;
    setMostrarDocumentos(false);
    setFechaRecepcion(fechaHoyMx());
    setListaDocumentosTexto("");
    setConfirmarDocumentos(false);
    setErrorDocumentos("");
    setAvisoDocumentos("");
    intentoDocumentosRef.current = null;
    setMostrarAutorizacion(false);
    setFechaAutorizacion(fechaHoyMx());
    setReferenciaAutorizacion("");
    setConfirmarAutorizacion(false);
    setErrorAutorizacion("");
    setAvisoAutorizacion("");
    intentoAutorizacionRef.current = null;
    setMostrarCompraFutura(false);
    setFechaCompraPrevista("");
    setFechaProximoContacto("");
    setObservacionCompra("");
    setConfirmarCompra(false);
    setErrorCompra("");
    setAvisoCompra("");
    intentoCompraRef.current = null;
    setMostrarReactivacion(false);
    setMotivoReactivacion("");
    setConfirmarReactivacion(false);
    setErrorReactivacion("");
    setAvisoReactivacion("");
    intentoReactivacionRef.current = null;
    setMostrarPerdida(false);
    setMotivoPerdida("");
    setDetallePerdida("");
    setConfirmarPerdida(false);
    setErrorPerdida("");
    setAvisoPerdida("");
    intentoPerdidaRef.current = null;
  }, [expedienteId]);


  useEffect(() => {
    let activo = true;
    setResultado(null);
    setError("");
    if (!expedienteId) {
      setCargando(false);
      return () => { activo = false; };
    }
    setCargando(true);
    apiEtapasV3.consultar(expedienteId)
      .then((datos) => { if (activo) setResultado(datos); })
      .catch((err) => {
        if (!activo) return;
        const codigo = err?.status;
        setError(codigo === 403 || codigo === 404
          ? "El seguimiento comercial no está habilitado para este expediente o usuario."
          : err?.message || "No fue posible consultar el seguimiento comercial.");
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [expedienteId, revision]);

  const actual = resultado?.etapa_comercial_v3 ?? null;
  const historial = Array.isArray(resultado?.actividades) ? resultado.actividades : [];
  // En el piloto solo abrimos el registro manual después del seguimiento humano.
  // La API decide finalmente si la operación es válida.
  const permiteCotizacion = resultado?.iniciado && actual === "en_seguimiento";
  // Solo vinculamos citas realmente existentes. El backend decide si pertenecen al cliente/dealer.
  const permiteCita = resultado?.iniciado && actual === "cotizacion_enviada";
  // Si la documentación llegó primero, se permite confirmar una visita
  // posterior sin hacer retroceder la etapa comercial.
  const asistenciaYaRegistrada = historial.some((a) => a.tipo === "cita_asistida");
  const permiteAsistencia = resultado?.iniciado &&
    (actual === "cita_agendada" || (actual === "documentos_enviados" && !asistenciaYaRegistrada));
  const permiteDocumentos = resultado?.iniciado &&
    ["cita_agendada", "cita_asistida"].includes(actual);
  const permiteAutorizacion = resultado?.iniciado && actual === "documentos_enviados";
  const permiteCompraFutura = resultado?.iniciado && [
    "en_seguimiento", "cotizacion_enviada", "cita_agendada",
    "cita_asistida", "documentos_enviados", "autorizado_no_formalizado",
  ].includes(actual);
  const permitePerdida = resultado?.iniciado && actual &&
    !["compra_futura", "lead_perdido", "facturado"].includes(actual);
  const permiteReactivacion = resultado?.iniciado &&
    ["compra_futura", "lead_perdido"].includes(actual);
  const recordatorioCompra = actual === "compra_futura" ? resultado?.recordatorio_compra_futura : null;
  const contactoVencido = Boolean(recordatorioCompra?.proximo_contacto &&
    recordatorioCompra.proximo_contacto <= fechaHoyMx());

  async function registrarLeadPerdido() {
    if (guardandoPerdida || !permitePerdida) return;
    setErrorPerdida("");
    setAvisoPerdida("");
    const motivo = motivoPerdida;
    const detalle = detallePerdida.trim();
    if (!MOTIVOS_LEAD_PERDIDO.some(([clave]) => clave === motivo)) {
      setErrorPerdida("Selecciona un motivo válido del catálogo."); return;
    }
    if (detalle.length > 1000 || (motivo === "otro_motivo" && detalle.length < 5)) {
      setErrorPerdida("Para Otro motivo escribe una explicación de 5 a 1000 caracteres."); return;
    }
    if (!confirmarPerdida) {
      setErrorPerdida("Confirma que esta oportunidad comercial está perdida."); return;
    }
    const firma = JSON.stringify([expedienteId, motivo, detalle]);
    if (intentoPerdidaRef.current?.firma !== firma) {
      const uuid = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
      intentoPerdidaRef.current = { firma, clave: `lead_perdido:${uuid}` };
    }
    setGuardandoPerdida(true);
    try {
      const registro = await apiEtapasV3.registrarLeadPerdido({
        expedienteId, motivo, detalleMotivo: detalle,
        claveIdempotencia: intentoPerdidaRef.current.clave,
      });
      setAvisoPerdida(registro?.duplicado
        ? "Lead perdido ya registrado; se recuperó el intento anterior."
        : "Lead perdido registrado. Se conservan el motivo y el historial.");
      setMostrarPerdida(false);
      setConfirmarPerdida(false);
      intentoPerdidaRef.current = null;
      setRevision((valor) => valor + 1);
    } catch (err) {
      setErrorPerdida(err?.message || "No fue posible registrar Lead perdido.");
    } finally {
      setGuardandoPerdida(false);
    }
  }

  async function registrarCompraFutura() {
    if (guardandoCompra || !permiteCompraFutura) return;
    setErrorCompra("");
    setAvisoCompra("");
    const compra = fechaCompraPrevista.trim();
    const contacto = fechaProximoContacto.trim();
    const observacion = observacionCompra.trim();
    if (![compra, contacto].every((fecha) => /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
        !Number.isNaN(new Date(`${fecha}T12:00:00`).getTime()))) {
      setErrorCompra("Captura ambas fechas válidas."); return;
    }
    if (compra <= fechaHoyMx() || contacto <= fechaHoyMx() || contacto > compra) {
      setErrorCompra("Ambas fechas deben ser futuras y el contacto no debe ocurrir después de la compra prevista.");
      return;
    }
    if (!observacion || observacion.length > 1000) {
      setErrorCompra("Escribe una observación de hasta 1000 caracteres."); return;
    }
    if (!confirmarCompra) {
      setErrorCompra("Confirma que el cliente planea comprar más adelante."); return;
    }
    const firma = JSON.stringify([expedienteId, compra, contacto, observacion]);
    if (intentoCompraRef.current?.firma !== firma) {
      const uuid = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
      intentoCompraRef.current = { firma, clave: `compra_futura:${uuid}` };
    }
    setGuardandoCompra(true);
    try {
      const registro = await apiEtapasV3.registrarCompraFutura({
        expedienteId, fechaPrevistaCompra: compra, proximoContacto: contacto,
        observacion, claveIdempotencia: intentoCompraRef.current.clave,
      });
      setAvisoCompra(registro?.duplicado
        ? "Compra futura ya registrada; se recuperó la operación anterior."
        : "Compra futura registrada. La próxima fecha de contacto aparecerá en esta ficha.");
      setMostrarCompraFutura(false);
      setConfirmarCompra(false);
      intentoCompraRef.current = null;
      setRevision((valor) => valor + 1);
    } catch (err) {
      setErrorCompra(err?.message || "No fue posible registrar Compra futura.");
    } finally {
      setGuardandoCompra(false);
    }
  }

  async function reactivarSeguimiento() {
    if (guardandoReactivacion || !permiteReactivacion) return;
    setErrorReactivacion("");
    const motivo = motivoReactivacion.trim();
    if (motivo.length < 5 || motivo.length > 1000) {
      setErrorReactivacion("Indica un motivo de reactivación de 5 a 1000 caracteres."); return;
    }
    if (!confirmarReactivacion) {
      setErrorReactivacion("Confirma que se reanudará el seguimiento comercial."); return;
    }
    if (intentoReactivacionRef.current?.motivo !== motivo) {
      const uuid = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
      intentoReactivacionRef.current = { motivo, clave: `reactivacion:${uuid}` };
    }
    setGuardandoReactivacion(true);
    try {
      const registro = await apiEtapasV3.reactivarSituacion({
        expedienteId, motivo, claveIdempotencia: intentoReactivacionRef.current.clave,
      });
      setAvisoReactivacion(registro?.duplicado
        ? "El seguimiento ya se había reactivado."
        : "Seguimiento reactivado. Se conserva el historial anterior.");
      setAvisoCompra("");
      setAvisoPerdida("");
      setMostrarReactivacion(false);
      setConfirmarReactivacion(false);
      intentoReactivacionRef.current = null;
      setRevision((valor) => valor + 1);
    } catch (err) {
      setErrorReactivacion(err?.message || "No fue posible reactivar el seguimiento.");
    } finally {
      setGuardandoReactivacion(false);
    }
  }

  async function registrarAutorizacion() {
    if (guardandoAutorizacion || !permiteAutorizacion) return;
    setErrorAutorizacion("");
    setAvisoAutorizacion("");
    const fecha = fechaAutorizacion.trim();
    const referencia = referenciaAutorizacion.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
        Number.isNaN(new Date(`${fecha}T12:00:00`).getTime()) || fecha > fechaHoyMx()) {
      setErrorAutorizacion("Selecciona una fecha válida que no sea futura.");
      return;
    }
    if (!referencia || referencia.length > 120) {
      setErrorAutorizacion("Indica la referencia o folio de autorización (máximo 120 caracteres).");
      return;
    }
    if (!confirmarAutorizacion) {
      setErrorAutorizacion("Confirma expresamente que el crédito fue autorizado.");
      return;
    }
    const firma = JSON.stringify([expedienteId, fecha, referencia]);
    if (intentoAutorizacionRef.current?.firma !== firma) {
      const uuid = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
      intentoAutorizacionRef.current = { firma, clave: `autorizacion:${uuid}` };
    }
    setGuardandoAutorizacion(true);
    try {
      const registro = await apiEtapasV3.registrarAutorizacion({
        expedienteId,
        fechaAutorizacion: fecha,
        referenciaAutorizacion: referencia,
        claveIdempotencia: intentoAutorizacionRef.current.clave,
      });
      setAvisoAutorizacion(registro?.duplicado
        ? "La autorización ya estaba registrada; se recuperó el intento anterior."
        : "Autorización registrada. La venta continúa pendiente de formalización/factura.");
      setMostrarAutorizacion(false);
      setConfirmarAutorizacion(false);
      intentoAutorizacionRef.current = null;
      setRevision((v) => v + 1);
    } catch (err) {
      setErrorAutorizacion(err?.message || "No se pudo registrar la autorización.");
    } finally {
      setGuardandoAutorizacion(false);
    }
  }

  async function registrarDocumentos() {
    if (guardandoDocumentos || !permiteDocumentos) return;
    setErrorDocumentos("");
    setAvisoDocumentos("");
    const fecha = fechaRecepcion.trim();
    const docs = listaDocumentosTexto.split(/\r?\n/).map((d) => d.trim()).filter(Boolean);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
        Number.isNaN(new Date(`${fecha}T12:00:00`).getTime()) || fecha > fechaHoyMx()) {
      setErrorDocumentos("Selecciona una fecha de recepción válida, que no sea futura.");
      return;
    }
    if (docs.length < 1 || docs.length > 30 || docs.some((d) => d.length > 160)) {
      setErrorDocumentos("Escribe entre 1 y 30 documentos (uno por línea, máximo 160 caracteres cada uno).");
      return;
    }
    if (!confirmarDocumentos) {
      setErrorDocumentos("Confirma expresamente que recibiste estos documentos del prospecto.");
      return;
    }
    const firma = JSON.stringify([expedienteId, fecha, docs]);
    if (intentoDocumentosRef.current?.firma !== firma) {
      const uuid = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
      intentoDocumentosRef.current = { firma, clave: `documentos:${uuid}` };
    }
    setGuardandoDocumentos(true);
    try {
      const registro = await apiEtapasV3.registrarDocumentos({
        expedienteId,
        fechaRecepcion: fecha,
        documentos: docs,
        claveIdempotencia: intentoDocumentosRef.current.clave,
      });
      setAvisoDocumentos(registro?.duplicado
        ? "La recepción ya estaba registrada. Se recuperó la operación anterior."
        : "Documentos recibidos registrados. La asistencia de la cita sigue independiente.");
      setMostrarDocumentos(false);
      setConfirmarDocumentos(false);
      intentoDocumentosRef.current = null;
      setRevision((v) => v + 1);
    } catch (err) {
      // Al reintentar la misma solicitud conservamos su clave de idempotencia.
      setErrorDocumentos(err?.message || "No se pudo registrar la recepción de documentos.");
    } finally {
      setGuardandoDocumentos(false);
    }
  }

  async function registrarAsistencia() {
    if (guardandoAsistencia || !permiteAsistencia) return;
    setErrorAsistencia("");
    setAvisoAsistencia("");

    const idTexto = citaAsistenciaTexto.trim();
    const citaId = Number(idTexto);
    const fecha = fechaAsistencia.trim();
    if (!/^\d+$/.test(idTexto) || !Number.isSafeInteger(citaId) || citaId <= 0) {
      setErrorAsistencia("Escribe el ID numérico de la cita ya vinculada a este expediente.");
      return;
    }
    // La fecha del navegador es una ayuda; Django valida contra la fecha programada real.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
        Number.isNaN(new Date(`${fecha}T12:00:00`).getTime()) || fecha > fechaHoyMx()) {
      setErrorAsistencia("Captura una fecha real de asistencia válida que no sea futura.");
      return;
    }
    if (!confirmarAsistencia) {
      setErrorAsistencia("Debes confirmar expresamente que el cliente acudió a su cita.");
      return;
    }
    const firma = JSON.stringify([expedienteId, citaId, fecha]);
    if (intentoAsistenciaRef.current?.firma !== firma) {
      const uuid = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
      intentoAsistenciaRef.current = { firma, clave: `asistencia:${uuid}` };
    }
    setGuardandoAsistencia(true);
    try {
      const registro = await apiEtapasV3.registrarAsistencia({
        expedienteId,
        citaId,
        fechaAsistenciaReal: fecha,
        claveIdempotencia: intentoAsistenciaRef.current.clave,
      });
      setAvisoAsistencia(registro?.duplicado
        ? "La asistencia ya estaba registrada. Se recuperó la operación anterior."
        : "Asistencia confirmada. Historial actualizado sin retroceder la etapa comercial.");
      setMostrarAsistencia(false);
      setConfirmarAsistencia(false);
      intentoAsistenciaRef.current = null;
      setRevision((valor) => valor + 1);
    } catch (err) {
      // Reutilizamos la misma clave si falla la red. No inventamos asistencia.
      setErrorAsistencia(err?.message || "No se pudo confirmar la asistencia. Revisa la cita y su fecha programada.");
    } finally {
      setGuardandoAsistencia(false);
    }
  }

  async function registrarCita() {
    if (guardandoCita || !permiteCita) return;
    setErrorCita("");
    setAvisoCita("");
    const texto = citaIdTexto.trim();
    const citaId = Number(texto);
    if (!/^\d+$/.test(texto) || !Number.isSafeInteger(citaId) || citaId <= 0) {
      setErrorCita("Indica el ID numérico de una cita ya guardada en el módulo de citas.");
      return;
    }
    if (!confirmarCita) {
      setErrorCita("Confirma que esta cita ya está registrada para este prospecto.");
      return;
    }
    // Reintentos de la misma operación reutilizan la clave: nunca crean otra actividad.
    const firma = JSON.stringify([expedienteId, citaId]);
    if (intentoCitaRef.current?.firma !== firma) {
      const uuid = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
      intentoCitaRef.current = { firma, clave: `cita:${uuid}` };
    }
    setGuardandoCita(true);
    try {
      const registro = await apiEtapasV3.registrarCita({
        expedienteId, citaId, claveIdempotencia: intentoCitaRef.current.clave,
      });
      setAvisoRegistro("");
      setAvisoCita(registro?.duplicado
        ? "La cita ya estaba vinculada; se recuperó el registro anterior."
        : "Cita vinculada correctamente. El historial se ha actualizado.");
      setMostrarFormularioCita(false);
      setConfirmarCita(false);
      intentoCitaRef.current = null;
      setRevision((v) => v + 1);
    } catch (err) {
      // Conservar la clave ante errores de red para un reintento idempotente.
      setErrorCita(err?.message || "No se pudo vincular la cita. Verifica que corresponda a este cliente y agencia.");
    } finally {
      setGuardandoCita(false);
    }
  }

  async function registrarCotizacion() {
    if (guardando || !permiteCotizacion) return;
    const fecha = fechaEnvio.trim();
    const veh = vehiculo.trim();
    const ref = referencia.trim();
    setErrorRegistro("");
    setAvisoRegistro("");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha > fechaHoyMx()) {
      setErrorRegistro("Indica una fecha válida de envío que no sea futura.");
      return;
    }
    if (!veh || !ref) {
      setErrorRegistro("Escribe el vehículo y la referencia de la cotización enviada.");
      return;
    }
    if (!confirmar) {
      setErrorRegistro("Confirma que la cotización realmente fue enviada.");
      return;
    }
    const firma = JSON.stringify([expedienteId, fecha, veh, ref]);
    if (intentoRef.current?.firma !== firma) {
      intentoRef.current = { firma, clave: nuevaClaveIdempotencia() };
    }
    setGuardando(true);
    try {
      const registrado = await apiEtapasV3.registrarCotizacion({
        expedienteId, fechaEnvio: fecha, vehiculo: veh, referencia: ref,
        claveIdempotencia: intentoRef.current.clave,
      });
      setMostrarFormulario(false);
      setConfirmar(false);
      setAvisoRegistro(registrado?.duplicado
        ? "La cotización ya estaba registrada; se recuperó el resultado anterior."
        : "Cotización registrada correctamente. Historial actualizado.");
      intentoRef.current = null;
      setRevision((v) => v + 1);
    } catch (err) {
      // Conservar la misma clave ante un fallo de red; reintentar no duplica.
      setErrorRegistro(err?.message || "No fue posible registrar la cotización.");
    } finally {
      setGuardando(false);
    }
  }


  return (
    <section className="rounded-2xl border border-[#131E5C]/10 bg-white p-4 shadow-sm" aria-label="Etapas comerciales">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#131E5C]">
            <Activity className="h-4 w-4" /> Etapas comerciales
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Seguimiento separado del estado histórico · Piloto autorizado</p>
        </div>
        {expedienteId ? (
          <button type="button" onClick={() => setRevision((v) => v + 1)} disabled={cargando}
            className="rounded-lg border border-slate-200 p-2 text-[#131E5C] hover:bg-slate-50 disabled:opacity-50"
            title="Actualizar etapas comerciales" aria-label="Actualizar etapas comerciales">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {!expedienteId ? (
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">Selecciona un expediente digital para consultar sus etapas comerciales.</div>
      ) : cargando ? (
        <div className="flex items-center gap-2 py-3 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Consultando el historial…</div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      ) : resultado ? (
        <>
          <div className="mb-3 rounded-lg bg-[#131E5C]/[0.05] px-3 py-2 text-[11px] font-bold text-[#131E5C]">
            {resultado.iniciado && actual
              ? <>Etapa vigente: <span className="font-black">{LABELS[actual] || actual}</span></>
              : "Aún no clasificado en las etapas comerciales. No se infiere la etapa desde el estado antiguo."}
          </div>
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {ETAPAS.map(([clave, etiqueta, clase], i) => {
              const vigente = actual === clave;
              return (
                <li key={clave} className={`flex min-w-0 gap-2 rounded-lg border p-2 text-[11px] ${vigente ? "border-[#131E5C]/40 bg-[#131E5C]/[0.06]" : "border-slate-100 bg-slate-50/60"}`}>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${vigente ? "bg-[#131E5C] text-white" : "bg-white text-slate-400 ring-1 ring-slate-200"}`}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className={`font-bold ${vigente ? "text-[#131E5C]" : "text-slate-600"}`}>{etiqueta} {vigente ? <CheckCircle2 className="inline h-3 w-3" /> : null}</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">{clase}</div>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 border-t border-slate-100 pt-3">
            {avisoRegistro ? (
              <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{avisoRegistro}</p>
            ) : null}
            {permiteCotizacion ? (
              <div className="mb-3 rounded-xl border border-[#131E5C]/15 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-[#131E5C]">Cotización enviada</div>
                    <p className="mt-0.5 text-[11px] text-slate-500">Confirmación manual con fecha, vehículo y referencia.</p>
                  </div>
                  <button type="button" disabled={guardando} onClick={() => { setMostrarFormulario((v) => !v); setErrorRegistro(""); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white hover:bg-[#1c2b79] disabled:opacity-50">
                    <FileCheck2 className="h-4 w-4" /> {mostrarFormulario ? "Cerrar" : "Registrar cotización"}
                  </button>
                </div>
                {mostrarFormulario ? (
                  <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Fecha de envío
                      <input type="date" max={fechaHoyMx()} value={fechaEnvio} onChange={(e) => setFechaEnvio(e.target.value)} disabled={guardando}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Vehículo cotizado
                      <input type="text" maxLength={255} value={vehiculo} onChange={(e) => setVehiculo(e.target.value)} disabled={guardando}
                        placeholder="Ej. Jetta Trendline" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C] sm:col-span-2">Referencia de cotización
                      <input type="text" maxLength={120} value={referencia} onChange={(e) => setReferencia(e.target.value)} disabled={guardando}
                        placeholder="Folio o identificador verificable" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="flex items-start gap-2 text-xs font-medium text-slate-700 sm:col-span-2">
                      <input type="checkbox" checked={confirmar} onChange={(e) => setConfirmar(e.target.checked)} disabled={guardando} className="mt-0.5" />
                      Confirmo que esta cotización ya fue enviada al prospecto.
                    </label>
                    {errorRegistro ? <p role="alert" className="text-xs font-semibold text-red-700 sm:col-span-2">{errorRegistro}</p> : null}
                    <div className="sm:col-span-2">
                      <button type="button" disabled={guardando} onClick={registrarCotizacion}
                        className="rounded-lg bg-[#131E5C] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2b79] disabled:opacity-50">
                        {guardando ? "Registrando…" : "Confirmar y registrar cotización"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : actual === "nuevo_prospecto" ? (
              <p className="mb-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                El botón de cotización se habilitará después de registrar un seguimiento humano válido desde el backend.
              </p>
            ) : null}

            {avisoCita ? (
              <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{avisoCita}</p>
            ) : null}
            {permiteCita ? (
              <div className="mb-3 rounded-xl border border-[#131E5C]/15 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-[#131E5C]">Cita agendada</div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Vincula una cita ya existente. No se crea otra cita ni se confirma asistencia.
                    </p>
                  </div>
                  <button type="button" disabled={guardandoCita}
                    onClick={() => { setMostrarFormularioCita((v) => !v); setErrorCita(""); }}
                    className="rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white hover:bg-[#1c2b79] disabled:opacity-50">
                    {mostrarFormularioCita ? "Cerrar" : "Vincular cita agendada"}
                  </button>
                </div>
                {mostrarFormularioCita ? (
                  <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">
                      ID de la cita (ya registrada)
                      <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={15}
                        value={citaIdTexto}
                        onChange={(e) => { setCitaIdTexto(e.target.value.replace(/\D/g, "")); intentoCitaRef.current = null; }}
                        disabled={guardandoCita} placeholder="Ej. 125"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <div className="flex items-center text-[11px] text-slate-500">
                      El ID se obtiene al guardar la cita en el módulo correspondiente.
                    </div>
                    <label className="flex items-start gap-2 text-xs font-medium text-slate-700 sm:col-span-2">
                      <input type="checkbox" checked={confirmarCita} onChange={(e) => setConfirmarCita(e.target.checked)}
                        disabled={guardandoCita} className="mt-0.5" />
                      Confirmo que esta cita existe y está agendada para el cliente del expediente.
                    </label>
                    {errorCita ? <p role="alert" className="text-xs font-semibold text-red-700 sm:col-span-2">{errorCita}</p> : null}
                    <div className="sm:col-span-2">
                      <button type="button" disabled={guardandoCita} onClick={registrarCita}
                        className="rounded-lg bg-[#131E5C] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2b79] disabled:opacity-50">
                        {guardandoCita ? "Vinculando…" : "Confirmar y vincular cita"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {actual === "documentos_enviados" && permiteAsistencia ? (
              <p className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-800">
                Documentos recibidos: cuando ocurra la visita, registra aquí su asistencia. La etapa permanecerá en Documentos recibidos.
              </p>
            ) : null}
            {avisoAsistencia ? (
              <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{avisoAsistencia}</p>
            ) : null}
            {permiteAsistencia ? (
              <div className="mb-3 rounded-xl border border-[#131E5C]/15 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-[#131E5C]">Cita asistida</div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Únicamente cuando el cliente haya acudido. La cita debe estar vinculada y su fecha programada ya debe haber ocurrido.
                    </p>
                  </div>
                  <button type="button" disabled={guardandoAsistencia}
                    onClick={() => { setMostrarAsistencia((valor) => !valor); setErrorAsistencia(""); }}
                    className="rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white hover:bg-[#1c2b79] disabled:opacity-50">
                    {mostrarAsistencia ? "Cerrar" : "Confirmar asistencia"}
                  </button>
                </div>
                {mostrarAsistencia ? (
                  <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">
                      ID de la cita vinculada
                      <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={15}
                        value={citaAsistenciaTexto}
                        onChange={(e) => { setCitaAsistenciaTexto(e.target.value.replace(/\D/g, "")); intentoAsistenciaRef.current = null; }}
                        disabled={guardandoAsistencia} placeholder="ID de cita, no del expediente"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">
                      Fecha real de visita
                      <input type="date" max={fechaHoyMx()} value={fechaAsistencia}
                        onChange={(e) => { setFechaAsistencia(e.target.value); intentoAsistenciaRef.current = null; }}
                        disabled={guardandoAsistencia}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <p className="text-[11px] font-medium text-amber-800 sm:col-span-2">
                      Una cita futura no es asistencia. Django rechazará cualquier confirmación anterior al día programado.
                    </p>
                    <label className="flex items-start gap-2 text-xs font-medium text-slate-700 sm:col-span-2">
                      <input type="checkbox" checked={confirmarAsistencia}
                        onChange={(e) => setConfirmarAsistencia(e.target.checked)}
                        disabled={guardandoAsistencia} className="mt-0.5" />
                      Confirmo que el cliente realmente asistió a esta cita en la fecha indicada.
                    </label>
                    {errorAsistencia ? (
                      <p role="alert" className="text-xs font-semibold text-red-700 sm:col-span-2">{errorAsistencia}</p>
                    ) : null}
                    <div className="sm:col-span-2">
                      <button type="button" disabled={guardandoAsistencia} onClick={registrarAsistencia}
                        className="rounded-lg bg-[#131E5C] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2b79] disabled:opacity-50">
                        {guardandoAsistencia ? "Confirmando…" : "Confirmar asistencia real"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {avisoDocumentos ? (
              <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{avisoDocumentos}</p>
            ) : null}
            {permiteDocumentos ? (
              <div className="mb-3 rounded-xl border border-[#131E5C]/15 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-[#131E5C]">Documentos recibidos</div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Puede avanzar antes de la asistencia. La cita seguirá pendiente; declarar documentos aquí no adjunta archivos.
                    </p>
                  </div>
                  <button type="button" disabled={guardandoDocumentos}
                    onClick={() => { setMostrarDocumentos((v) => !v); setErrorDocumentos(""); }}
                    className="rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white hover:bg-[#1c2b79] disabled:opacity-50">
                    {mostrarDocumentos ? "Cerrar" : "Registrar documentos recibidos"}
                  </button>
                </div>
                {mostrarDocumentos ? (
                  <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">
                      Fecha real de recepción
                      <input type="date" value={fechaRecepcion} max={fechaHoyMx()}
                        onChange={(e) => { setFechaRecepcion(e.target.value); intentoDocumentosRef.current = null; }}
                        disabled={guardandoDocumentos}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C] sm:col-span-2">
                      Documentos recibidos (uno por línea)
                      <textarea rows={4} maxLength={5000} value={listaDocumentosTexto}
                        onChange={(e) => { setListaDocumentosTexto(e.target.value); intentoDocumentosRef.current = null; }}
                        disabled={guardandoDocumentos}
                        placeholder={"Identificación oficial\nComprobante de domicilio"}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="flex items-start gap-2 text-xs font-medium text-slate-700 sm:col-span-2">
                      <input type="checkbox" checked={confirmarDocumentos}
                        onChange={(e) => setConfirmarDocumentos(e.target.checked)} disabled={guardandoDocumentos} className="mt-0.5" />
                      Confirmo que recibí realmente los documentos indicados en la fecha señalada.
                    </label>
                    {errorDocumentos ? <p role="alert" className="text-xs font-semibold text-red-700 sm:col-span-2">{errorDocumentos}</p> : null}
                    <div className="sm:col-span-2">
                      <button type="button" disabled={guardandoDocumentos} onClick={registrarDocumentos}
                        className="rounded-lg bg-[#131E5C] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2b79] disabled:opacity-50">
                        {guardandoDocumentos ? "Registrando…" : "Confirmar recepción de documentos"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {avisoAutorizacion ? (
              <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{avisoAutorizacion}</p>
            ) : null}
            {permiteAutorizacion ? (
              <div className="mb-3 rounded-xl border border-[#131E5C]/15 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-[#131E5C]">Autorizado no formalizado</div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Declaración manual de crédito autorizado. No formaliza ni factura una venta y no cambia los campos históricos.
                    </p>
                  </div>
                  <button type="button" disabled={guardandoAutorizacion}
                    onClick={() => { setMostrarAutorizacion((v) => !v); setErrorAutorizacion(""); }}
                    className="rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white hover:bg-[#1c2b79] disabled:opacity-50">
                    {mostrarAutorizacion ? "Cerrar" : "Registrar autorización"}
                  </button>
                </div>
                {mostrarAutorizacion ? (
                  <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">
                      Fecha efectiva de autorización
                      <input type="date" value={fechaAutorizacion} max={fechaHoyMx()}
                        onChange={(e) => { setFechaAutorizacion(e.target.value); intentoAutorizacionRef.current = null; }}
                        disabled={guardandoAutorizacion}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">
                      Referencia o folio de autorización
                      <input type="text" maxLength={120} value={referenciaAutorizacion}
                        onChange={(e) => { setReferenciaAutorizacion(e.target.value); intentoAutorizacionRef.current = null; }}
                        disabled={guardandoAutorizacion} placeholder="Ej. AUT-DEMO-13"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="flex items-start gap-2 text-xs font-medium text-slate-700 sm:col-span-2">
                      <input type="checkbox" checked={confirmarAutorizacion}
                        onChange={(e) => setConfirmarAutorizacion(e.target.checked)} disabled={guardandoAutorizacion} className="mt-0.5" />
                      Confirmo que existe una autorización de crédito para este prospecto en la fecha indicada.
                    </label>
                    {errorAutorizacion ? <p role="alert" className="text-xs font-semibold text-red-700 sm:col-span-2">{errorAutorizacion}</p> : null}
                    <div className="sm:col-span-2">
                      <button type="button" disabled={guardandoAutorizacion} onClick={registrarAutorizacion}
                        className="rounded-lg bg-[#131E5C] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2b79] disabled:opacity-50">
                        {guardandoAutorizacion ? "Registrando…" : "Confirmar autorización de crédito"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {avisoCompra ? (
              <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{avisoCompra}</p>
            ) : null}
            {permiteCompraFutura ? (
              <div className="mb-3 rounded-xl border border-[#131E5C]/15 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-[#131E5C]">Compra futura</div>
                    <p className="mt-0.5 text-[11px] text-slate-500">El cliente comprará después. No es Lead perdido ni una factura.</p>
                  </div>
                  <button type="button" disabled={guardandoCompra}
                    onClick={() => { setMostrarCompraFutura((valor) => !valor); setErrorCompra(""); }}
                    className="rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                    {mostrarCompraFutura ? "Cerrar" : "Registrar compra futura"}
                  </button>
                </div>
                {mostrarCompraFutura ? (
                  <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Fecha prevista de compra
                      <input type="date" min={fechaHoyMx()} value={fechaCompraPrevista}
                        onChange={(e) => { setFechaCompraPrevista(e.target.value); intentoCompraRef.current = null; }}
                        disabled={guardandoCompra} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Próximo contacto
                      <input type="date" min={fechaHoyMx()} max={fechaCompraPrevista || undefined} value={fechaProximoContacto}
                        onChange={(e) => { setFechaProximoContacto(e.target.value); intentoCompraRef.current = null; }}
                        disabled={guardandoCompra} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C] sm:col-span-2">Observación
                      <textarea rows={3} maxLength={1000} value={observacionCompra}
                        onChange={(e) => { setObservacionCompra(e.target.value); intentoCompraRef.current = null; }}
                        disabled={guardandoCompra} placeholder="Motivo y contexto del seguimiento futuro"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="flex items-start gap-2 text-xs font-medium text-slate-700 sm:col-span-2">
                      <input type="checkbox" checked={confirmarCompra}
                        onChange={(e) => setConfirmarCompra(e.target.checked)} disabled={guardandoCompra} className="mt-0.5" />
                      Confirmo que el cliente expresó intención de comprar más adelante.
                    </label>
                    {errorCompra ? <p role="alert" className="text-xs font-semibold text-red-700 sm:col-span-2">{errorCompra}</p> : null}
                    <div className="sm:col-span-2">
                      <button type="button" disabled={guardandoCompra} onClick={registrarCompraFutura}
                        className="rounded-lg bg-[#131E5C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                        {guardandoCompra ? "Registrando…" : "Confirmar compra futura"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {avisoPerdida ? (
              <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{avisoPerdida}</p>
            ) : null}
            {permitePerdida ? (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-[#131E5C]">Lead perdido</p>
                    <p className="mt-0.5 text-[11px] text-slate-600">El cliente no continuará como oportunidad activa. Debes seleccionar un motivo.</p>
                  </div>
                  <button type="button" disabled={guardandoPerdida}
                    onClick={() => { setMostrarPerdida((valor) => !valor); setErrorPerdida(""); }}
                    className="rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                    {mostrarPerdida ? "Cerrar" : "Registrar lead perdido"}
                  </button>
                </div>
                {mostrarPerdida ? (
                  <div className="mt-3 grid gap-3 border-t border-red-200 pt-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C] sm:col-span-2">
                      Motivo de descarte (obligatorio)
                      <select value={motivoPerdida} disabled={guardandoPerdida}
                        onChange={(e) => { setMotivoPerdida(e.target.value); intentoPerdidaRef.current = null; }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal">
                        <option value="">— Selecciona un motivo —</option>
                        {MOTIVOS_LEAD_PERDIDO.map(([clave, etiqueta]) => (
                          <option key={clave} value={clave}>{etiqueta}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C] sm:col-span-2">
                      {motivoPerdida === "otro_motivo" ? "Explicación obligatoria" : "Observación (opcional)"}
                      <textarea rows={3} maxLength={1000} value={detallePerdida}
                        onChange={(e) => { setDetallePerdida(e.target.value); intentoPerdidaRef.current = null; }}
                        disabled={guardandoPerdida} placeholder="Contexto del descarte"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="flex items-start gap-2 text-xs font-medium text-slate-700 sm:col-span-2">
                      <input type="checkbox" checked={confirmarPerdida}
                        onChange={(e) => setConfirmarPerdida(e.target.checked)} disabled={guardandoPerdida} className="mt-0.5" />
                      Confirmo que esta oportunidad se descarta con el motivo seleccionado.
                    </label>
                    {errorPerdida ? <p role="alert" className="text-xs font-semibold text-red-700 sm:col-span-2">{errorPerdida}</p> : null}
                    <div className="sm:col-span-2">
                      <button type="button" disabled={guardandoPerdida} onClick={registrarLeadPerdido}
                        className="rounded-lg bg-[#131E5C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                        {guardandoPerdida ? "Registrando…" : "Confirmar Lead perdido"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {permiteReactivacion ? (
              <div className="mb-3 space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                {actual === "compra_futura" ? (
                  <>
                    <p className="text-xs font-extrabold text-[#131E5C]">Recordatorio de compra futura</p>
                    {recordatorioCompra ? (
                      <div className="space-y-1 text-xs text-[#131E5C]">
                        <p>Próximo contacto: <strong>{fechaCorta(recordatorioCompra.proximo_contacto)}</strong>
                          {contactoVencido ? <span className="ml-2 font-extrabold text-red-700">Pendiente de contactar</span> : null}</p>
                        <p>Compra prevista: <strong>{fechaCorta(recordatorioCompra.fecha_prevista_compra)}</strong></p>
                        <p className="whitespace-pre-wrap text-slate-600">{recordatorioCompra.observacion || "Sin observación"}</p>
                      </div>
                    ) : <p className="text-xs text-amber-800">No se encontró el recordatorio. Consulta la actividad registrada.</p>}
                    <p className="text-[11px] text-slate-500">Recordatorio visible al abrir esta ficha; no envía notificaciones automáticas.</p>
                  </>
                ) : (
                  <div className="space-y-1 text-xs text-[#131E5C]">
                    <p className="font-bold">Oportunidad perdida. Solo se puede retomar mediante una reactivación explícita y justificada.</p>
                    <p>Motivo: <strong>{resultado?.motivo_lead_perdido?.etiqueta || "Consulta el historial de descarte"}</strong></p>
                    {resultado?.motivo_lead_perdido?.detalle ? (
                      <p className="whitespace-pre-wrap text-slate-600">{resultado.motivo_lead_perdido.detalle}</p>
                    ) : null}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-extrabold text-[#131E5C]">Retomar seguimiento</p>
                  <button type="button" onClick={() => setMostrarReactivacion((valor) => !valor)}
                    disabled={guardandoReactivacion}
                    className="rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                    {mostrarReactivacion ? "Cerrar" : "Reactivar seguimiento"}
                  </button>
                </div>
                {mostrarReactivacion ? (
                  <div className="grid gap-3 border-t border-blue-200 pt-3">
                    <p className="text-xs text-slate-600">Volverá a En seguimiento. Se conservarán todas las actividades previas.</p>
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Motivo de reactivación
                      <textarea rows={3} maxLength={1000} value={motivoReactivacion}
                        onChange={(e) => { setMotivoReactivacion(e.target.value); intentoReactivacionRef.current = null; }}
                        disabled={guardandoReactivacion} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    <label className="flex items-start gap-2 text-xs font-medium text-slate-700">
                      <input type="checkbox" checked={confirmarReactivacion}
                        onChange={(e) => setConfirmarReactivacion(e.target.checked)} disabled={guardandoReactivacion} className="mt-0.5" />
                      Confirmo que se retomará el seguimiento activo.
                    </label>
                    {errorReactivacion ? <p role="alert" className="text-xs font-semibold text-red-700">{errorReactivacion}</p> : null}
                    <div><button type="button" disabled={guardandoReactivacion} onClick={reactivarSeguimiento}
                      className="rounded-lg bg-[#131E5C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                      {guardandoReactivacion ? "Reactivando…" : "Confirmar reactivación"}
                    </button></div>
                  </div>
                ) : null}
              </div>
            ) : null}
            {avisoReactivacion ? (
              <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{avisoReactivacion}</p>
            ) : null}

            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold text-[#131E5C]"><Clock3 className="h-3.5 w-3.5" /> Actividades registradas (últimas 30)</div>
            {historial.length === 0 ? (
              <p className="text-[11px] text-slate-500">Sin actividades comerciales registradas.</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {historial.map((item) => (
                  <li key={item.id} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 text-[11px]">
                    <div className="font-bold text-[#131E5C]">{EVENTOS[item.tipo] || item.tipo}</div>
                    <div className="mt-0.5 text-slate-500">{fechaCorta(item.fecha_actividad)} · {item.usuario_crm || "Sin responsable"}</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">Resultado: {LABELS[item.etapa_resultante] || item.etapa_resultante || "Sin cambio"}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
