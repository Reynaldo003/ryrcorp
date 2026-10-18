// src/pages/Digitales/EtapasComercialesV3Panel.jsx
// Vista piloto consulta y primera confirmación manual (cotización).
import { useEffect, useRef, useState } from "react";
import { Activity, CheckCircle2, Clock3, Loader2, RefreshCw, ShieldAlert, FileCheck2 } from "lucide-react";
import { apiEtapasV3 } from "../../lib/apiEtapasV3";
import { useAsesoresGestionComercial } from "../../hooks/useAsesoresGestionComercial";
import "./EtapasComercialesV3Panel.chat.css";

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

// Una sola regularización para expedientes antiguos SIN etapa V3.
// El formulario nunca da libertad de cambiar una etapa ya iniciada.
const ETAPAS_HISTORICAS = ETAPAS.filter(([clave]) => clave !== "facturado");
function ClasificacionHistoricaForm({ expedienteId, estadoAnterior, agencia, onActualizado }) {
  const [etapa, setEtapa] = useState("");
  const [datos, setDatos] = useState({});
  const [motivo, setMotivo] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const intentoRef = useRef(null);
  const hoy = fechaHoyMx();

  const actualizar = (clave, valor) => {
    setDatos((anterior) => ({ ...anterior, [clave]: valor }));
    intentoRef.current = null;
    setError("");
  };
  const cambiarEtapa = (valor) => {
    setEtapa(valor);
    setDatos({});
    setConfirmado(false);
    intentoRef.current = null;
    setError("");
  };
  const input = (clave, etiqueta, tipo = "text", extra = {}) => (
    <label key={clave} className="grid gap-1 text-xs font-bold text-[#131E5C]">
      {etiqueta}
      <input type={tipo} value={datos[clave] || ""} onChange={(e) => actualizar(clave, e.target.value)}
        max={tipo === "date" && !["fecha_prevista_compra", "proximo_contacto"].includes(clave) ? hoy : undefined}
        maxLength={extra.maxLength || 200}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" />
    </label>
  );
  async function guardar(evento) {
    evento.preventDefault();
    if (guardando) return;
    if (!etapa || !confirmado || motivo.trim().length < 10) {
      setError("Selecciona la etapa, indica el motivo (mínimo 10 caracteres) y confirma la información.");
      return;
    }
    let datosEnviar = {};
    const valor = (clave) => String(datos[clave] || "").trim();
    if (etapa === "en_seguimiento") {
      datosEnviar = { medio: valor("medio"), fecha_contacto: valor("fecha_contacto"), observacion: valor("observacion") };
    } else if (etapa === "cotizacion_enviada") {
      datosEnviar = { fecha_envio: valor("fecha_envio"), vehiculo: valor("vehiculo"), referencia: valor("referencia") };
    } else if (etapa === "cita_agendada") {
      datosEnviar = { fecha_hora_cita: valor("fecha_hora_cita") };
    } else if (etapa === "cita_asistida") {
      datosEnviar = { fecha_hora_cita: valor("fecha_hora_cita"), fecha_asistencia_real: valor("fecha_asistencia_real") };
    } else if (etapa === "documentos_enviados") {
      datosEnviar = { fecha_recepcion: valor("fecha_recepcion"), documentos: valor("documentos").split("\n").map((x) => x.trim()).filter(Boolean) };
    } else if (etapa === "autorizado_no_formalizado") {
      datosEnviar = { fecha_autorizacion: valor("fecha_autorizacion"), referencia_autorizacion: valor("referencia_autorizacion") };
    } else if (etapa === "compra_futura") {
      datosEnviar = { fecha_prevista_compra: valor("fecha_prevista_compra"), proximo_contacto: valor("proximo_contacto"), observacion: valor("observacion") };
    } else if (etapa === "lead_perdido") {
      datosEnviar = { motivo: valor("motivo"), detalle_motivo: valor("detalle_motivo") };
    }
    if (!intentoRef.current) {
      intentoRef.current = `clasificacion:${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    }
    setGuardando(true);
    setError("");
    try {
      await apiEtapasV3.clasificarHistorico({ expedienteId, etapaDestino: etapa,
        datos: datosEnviar, motivo, claveIdempotencia: intentoRef.current });
      onActualizado?.();
    } catch (err) {
      setError(err?.message || "No se pudo clasificar el expediente histórico.");
    } finally {
      setGuardando(false);
    }
  }
  return (
    <form onSubmit={guardar} className="mb-3 space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
      <div className="font-extrabold text-[#131E5C]">Clasificar prospecto histórico</div>
      <div className="text-xs text-slate-700">Estado anterior: <strong>{estadoAnterior || "Sin estado"}</strong> · {agencia}</div>
      <p className="text-xs text-slate-600">Selecciona una sola vez la situación real y registra los datos correspondientes. No se generan citas, cotizaciones ni ventas ficticias.</p>
      <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Situación comercial confirmada
        <select value={etapa} onChange={(e) => cambiarEtapa(e.target.value)} disabled={guardando}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal">
          <option value="">— Seleccionar etapa —</option>
          {ETAPAS_HISTORICAS.filter(([clave]) =>
            estadoAnterior?.trim().toLowerCase() !== "descalificado" || clave === "lead_perdido"
          ).map(([clave, etiqueta]) => <option key={clave} value={clave}>{etiqueta}</option>)}
        </select>
      </label>
      {etapa === "nuevo_prospecto" ? <p className="text-xs text-amber-800">Confirma que aún no ha existido una atención comercial real.</p> : null}
      {etapa === "en_seguimiento" ? <>
        <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Medio de atención real
          <select value={datos.medio || ""} onChange={(e) => actualizar("medio", e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal">
            <option value="">— Selecciona el medio —</option>
            <option value="llamada">Llamada telefónica</option><option value="facebook">Facebook / Messenger</option>
            <option value="presencial">Presencial</option><option value="whatsapp_externo">WhatsApp externo</option>
            <option value="otro">Otro</option>
          </select>
        </label>
        {input("fecha_contacto", "Fecha real de atención", "date")}
        <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Resumen del contacto
          <textarea value={datos.observacion || ""} onChange={(e) => actualizar("observacion", e.target.value)} maxLength={600} rows={2} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" />
        </label>
      </> : null}
      {etapa === "cotizacion_enviada" ? <>
        {input("fecha_envio", "Fecha de envío", "date")}
        {input("vehiculo", "Vehículo cotizado")}{input("referencia", "Referencia o folio de cotización")}
      </> : null}
      {["cita_agendada", "cita_asistida"].includes(etapa) ? <>
        {input("fecha_hora_cita", "Fecha y hora programadas", "datetime-local")}
        <div className="text-xs text-slate-700">Sucursal del expediente: <strong>{agencia}</strong></div>
        {etapa === "cita_asistida" ? input("fecha_asistencia_real", "Fecha REAL en que asistió", "date") : null}
      </> : null}
      {etapa === "documentos_enviados" ? <>
        {input("fecha_recepcion", "Fecha de recepción", "date")}
        <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Documentos recibidos (uno por línea)
          <textarea value={datos.documentos || ""} onChange={(e) => actualizar("documentos", e.target.value)} rows={3} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" />
        </label>
      </> : null}
      {etapa === "autorizado_no_formalizado" ? <>
        {input("fecha_autorizacion", "Fecha de autorización", "date")}
        {input("referencia_autorizacion", "Referencia de autorización (opcional)")}
      </> : null}
      {etapa === "compra_futura" ? <>
        {input("fecha_prevista_compra", "Fecha prevista de compra", "date")}
        {input("proximo_contacto", "Fecha de próximo contacto", "date")}
        <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Observación de compra futura
          <textarea value={datos.observacion || ""} onChange={(e) => actualizar("observacion", e.target.value)} rows={2} maxLength={600} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" />
        </label>
      </> : null}
      {etapa === "lead_perdido" ? <>
        <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Motivo de descarte
          <select value={datos.motivo || ""} onChange={(e) => actualizar("motivo", e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal">
            <option value="">— Seleccionar motivo —</option>
            {MOTIVOS_LEAD_PERDIDO.map(([clave, nombre]) => <option key={clave} value={clave}>{nombre}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Detalles del motivo {datos.motivo === "otro_motivo" ? "(obligatorio)" : "(opcional)"}
          <textarea value={datos.detalle_motivo || ""} onChange={(e) => actualizar("detalle_motivo", e.target.value)} rows={2} maxLength={1000} className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" />
        </label>
      </> : null}
      {etapa ? <>
        <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Motivo de clasificación (obligatorio)
          <textarea value={motivo} onChange={(e) => { setMotivo(e.target.value); intentoRef.current = null; }} rows={2} maxLength={500}
            placeholder="Por qué la etapa elegida corresponde a la situación real del prospecto" className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal" />
        </label>
        <label className="flex items-start gap-2 text-xs text-slate-800">
          <input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />
          Confirmo que los datos corresponden al expediente y a la atención real del cliente.
        </label>
        {error ? <p role="alert" className="text-xs font-semibold text-red-700">{error}</p> : null}
        <button type="submit" disabled={guardando || !confirmado} className="rounded-lg bg-[#131E5C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          {guardando ? "Guardando…" : "Confirmar clasificación histórica"}
        </button>
      </> : null}
      <p className="text-[11px] text-amber-800">Operación única y auditada. No permite retrocesos ni escoger Facturado manualmente.</p>
    </form>
  );
}

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

// Montar el catálogo únicamente al abrir «Agendar nueva cita». El panel puede
// aparecer muchas veces en listados; no lanzar una petición por cada tarjeta.
function SelectorAsesorPisoCitaV3({ value, onChange, disabled }) {
  const { nombresAsesoresActivos, cargando, usandoFallback } = useAsesoresGestionComercial();
  return (
    <label className="grid gap-1 text-xs font-bold text-[#131E5C] sm:col-span-2">
      Asesor que atenderá la cita (obligatorio)
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled || cargando}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal">
        <option value="">— Selecciona asesor —</option>
        {nombresAsesoresActivos.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
      </select>
      {usandoFallback ? <span className="text-[11px] font-normal text-amber-800">Catálogo no disponible; se muestra la lista de respaldo utilizada por Contacto.</span> : null}
    </label>
  );
}

export default function EtapasComercialesV3Panel({ expedienteId, prospecto = null, onActualizado, compact = false, onAbrirEdicion, enChat = false, onAgendarCitaChat }) {
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
  const [modoCita, setModoCita] = useState(enChat ? "existente" : "crear");
  const [nuevaCitaFecha, setNuevaCitaFecha] = useState("");
  const [nuevaCitaHora, setNuevaCitaHora] = useState("12:00");
  const [nuevaCitaAgencia, setNuevaCitaAgencia] = useState("");
  const [nuevaCitaAsesorPiso, setNuevaCitaAsesorPiso] = useState("");
  const [nuevaCitaComentarios, setNuevaCitaComentarios] = useState("");
  const [citasCliente, setCitasCliente] = useState([]);
  const [cargandoCitasCliente, setCargandoCitasCliente] = useState(false);
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
  const [fechaProgramadaHistorica, setFechaProgramadaHistorica] = useState("");
  const [horaProgramadaHistorica, setHoraProgramadaHistorica] = useState("12:00");
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
  const [mostrarFacturacion, setMostrarFacturacion] = useState(false);
  const [vinFacturacion, setVinFacturacion] = useState("");
  const [confirmarFacturacion, setConfirmarFacturacion] = useState(false);
  const [guardandoFacturacion, setGuardandoFacturacion] = useState(false);
  const [errorFacturacion, setErrorFacturacion] = useState("");
  const [avisoFacturacion, setAvisoFacturacion] = useState("");
  // Corrección auditada de una actividad concreta, sin selector libre de etapa.
  const [mostrarContactoExterno, setMostrarContactoExterno] = useState(false);
  const [medioContacto, setMedioContacto] = useState("llamada");
  const [fechaContacto, setFechaContacto] = useState(fechaHoyMx);
  const [notaContacto, setNotaContacto] = useState("");
  const [confirmarContacto, setConfirmarContacto] = useState(false);
  const [guardandoContacto, setGuardandoContacto] = useState(false);
  const [errorContacto, setErrorContacto] = useState("");
  const intentoContactoRef = useRef(null);
  const [actividadCorreccion, setActividadCorreccion] = useState(null);
  const [camposCorreccion, setCamposCorreccion] = useState({});
  const [motivoCorreccion, setMotivoCorreccion] = useState("");
  const [errorCorreccion, setErrorCorreccion] = useState("");
  const [guardandoCorreccion, setGuardandoCorreccion] = useState(false);
  const intentoCorreccionRef = useRef(null);

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
    setModoCita("crear");
    setNuevaCitaFecha("");
    setNuevaCitaHora("12:00");
    setNuevaCitaAgencia(prospecto?.agencia || "");
    setNuevaCitaAsesorPiso("");
    setNuevaCitaComentarios("");
    setCitasCliente([]);
    const citaGuardada = typeof sessionStorage !== "undefined" && expedienteId
      ? sessionStorage.getItem(`v3_cita_pendiente_${expedienteId}`) || ""
      : "";
    setCitaIdTexto(citaGuardada);
    setConfirmarCita(false);
    setErrorCita("");
    setAvisoCita("");
    intentoCitaRef.current = null;
    setMostrarAsistencia(false);
    setCitaAsistenciaTexto("");
    setFechaAsistencia("");
    setFechaProgramadaHistorica("");
    setHoraProgramadaHistorica("12:00");
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
    setMostrarFacturacion(false);
    setVinFacturacion("");
    setConfirmarFacturacion(false);
    setErrorFacturacion("");
    setAvisoFacturacion("");
    setMostrarContactoExterno(false);
    setMedioContacto("llamada");
    setFechaContacto(fechaHoyMx());
    setNotaContacto("");
    setConfirmarContacto(false);
    setErrorContacto("");
    intentoContactoRef.current = null;
    setActividadCorreccion(null);
    setCamposCorreccion({});
    setMotivoCorreccion("");
    setErrorCorreccion("");
    intentoCorreccionRef.current = null;
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
  const citasDisponibles = Array.isArray(resultado?.citas_disponibles)
    ? resultado.citas_disponibles.filter((c) => !c.asistencia && [null, "pendiente", ""].includes(c.estado_asistencia))
    : [];
  const esCitaHistorica = Boolean(resultado?.homologacion_cita_historica);
  // Solamente las citas vinculadas al expediente pueden confirmar asistencia.
  // El resto sigue visible exclusivamente en «Usar cita ya existente», donde
  // puede vincularse mediante un evento distinto y con autorización del backend.
  const vinculadaAlExpediente = (c) => c.vinculada_v3 === true || c.vinculada_historica === true;
  const citasParaAsistencia = citasDisponibles.filter(vinculadaAlExpediente);
  const citasVinculadas = Array.isArray(resultado?.citas_disponibles)
    ? resultado.citas_disponibles.filter(vinculadaAlExpediente)
    : [];
  const citasVinculadasConAsistencia = citasVinculadas.filter(
    (c) => Boolean(c.asistencia) || ![null, "pendiente", ""].includes(c.estado_asistencia)
  );
  const citasSinVinculoPendientes = citasDisponibles.filter((c) => !vinculadaAlExpediente(c));
  const citaSeleccionada = citasParaAsistencia.find((c) => String(c.id) === citaAsistenciaTexto);
  const requiereCapturaHistorica = !citaSeleccionada && esCitaHistorica &&
    (!Array.isArray(resultado?.citas_disponibles) || resultado.citas_disponibles.length === 0);
  const citaSeleccionadaFutura = Boolean(
    citaSeleccionada && String(citaSeleccionada.fecha_hora_cita || "").slice(0, 10) > fechaHoyMx()
  );

  useEffect(() => {
    const actCita = historial.find((a) => a.tipo === "cita_agendada" && a.cita_id);
    const idDetectado =
      resultado?.cita_vinculada_id ||
      actCita?.cita_id ||
      prospecto?.cita?.id ||
      "";
    if (idDetectado && !citaAsistenciaTexto) {
      setCitaAsistenciaTexto(String(idDetectado));
    }
  }, [resultado, historial, prospecto, citaAsistenciaTexto]);

  useEffect(() => {
    if (citasParaAsistencia.length === 0) return;
    const vinculada = resultado?.cita_vinculada_id;
    const candidata = citasParaAsistencia.find((c) => c.id === vinculada);
    if (candidata) {
      setCitaAsistenciaTexto(String(candidata.id));
    } else if (citasParaAsistencia.length === 1) {
      setCitaAsistenciaTexto(String(citasParaAsistencia[0].id));
    } else {
      // No mantener una cita obsoleta o ajena al vínculo al cambiar expediente.
      setCitaAsistenciaTexto("");
    }
  }, [resultado]);

  useEffect(() => {
    if (!mostrarFormularioCita) return;
    if (!nuevaCitaAgencia && prospecto?.agencia) {
      setNuevaCitaAgencia(prospecto.agencia);
    }
    // Citas recuperadas por Django para este expediente, no por páginas genéricas.
    const opciones = citasDisponibles;
    setCitasCliente(opciones);
    setCargandoCitasCliente(false);
    if (opciones.length && !opciones.some((c) => String(c.id) === citaIdTexto)) {
      setCitaIdTexto(String(opciones[0].id));
    }
  }, [mostrarFormularioCita, resultado]);
  // En el piloto solo abrimos el registro manual después del seguimiento humano.
  // La API decide finalmente si la operación es válida.
  const permiteCotizacion = resultado?.iniciado && actual === "en_seguimiento";
  // Solo vinculamos citas realmente existentes. El backend decide si pertenecen al cliente/dealer.
  const tieneHomologacionCitaHistorica =
    resultado?.homologacion_cita_historica === true;

  const permiteCita =
    resultado?.iniciado &&
    (
      actual === "cotizacion_enviada" ||
      (
        actual === "cita_agendada" &&
        tieneHomologacionCitaHistorica &&
        !resultado?.cita_vinculada_id
      )
    );
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
  const permiteFacturacion = resultado?.iniciado && [
    "en_seguimiento", "cotizacion_enviada", "cita_agendada", "cita_asistida",
    "documentos_enviados", "autorizado_no_formalizado",
  ].includes(actual);
  const permitePerdida = resultado?.iniciado && actual &&
    !["compra_futura", "lead_perdido", "facturado"].includes(actual);
  const permiteReactivacion = resultado?.iniciado &&
    ["compra_futura", "lead_perdido"].includes(actual);
  const recordatorioCompra = actual === "compra_futura" ? resultado?.recordatorio_compra_futura : null;
  const contactoVencido = Boolean(recordatorioCompra?.proximo_contacto &&
    recordatorioCompra.proximo_contacto <= fechaHoyMx());

  async function registrarFacturacion() {
    if (guardandoFacturacion || !permiteFacturacion) return;
    const vin = vinFacturacion.trim().toUpperCase();
    setErrorFacturacion("");
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      setErrorFacturacion("Ingresa un VIN válido de 17 caracteres."); return;
    }
    if (!confirmarFacturacion) {
      setErrorFacturacion("Confirma que el VIN corresponde a un vehículo facturado."); return;
    }
    setGuardandoFacturacion(true);
    try {
      await apiEtapasV3.registrarFacturacionVin({ expedienteId, vin });
      setMostrarFacturacion(false);
      setConfirmarFacturacion(false);
      setAvisoFacturacion("VIN guardado y etapa Facturado registrada correctamente.");
      onActualizado?.();
      setRevision((valor) => valor + 1);
    } catch (err) {
      setErrorFacturacion(err?.message || "No fue posible registrar el VIN facturado.");
    } finally {
      setGuardandoFacturacion(false);
    }
  }

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
      onActualizado?.();
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
      onActualizado?.();
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
      onActualizado?.();
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
    if (referencia.length > 120) {
      setErrorAutorizacion("La referencia o folio, si se captura, admite máximo 120 caracteres.");
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
      onActualizado?.();
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
      onActualizado?.();
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

    const citaId = citaSeleccionada?.id ?? null;
    const fecha = fechaAsistencia.trim();
    if (citaId === null && !requiereCapturaHistorica) {
      setErrorAsistencia("Selecciona una cita registrada del prospecto. Si hay varias, elige la que corresponda por fecha y sucursal.");
      return;
    }
    if (requiereCapturaHistorica && (
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaProgramadaHistorica) ||
      !/^\d{2}:\d{2}$/.test(horaProgramadaHistorica)
    )) {
      setErrorAsistencia("Indica la fecha y hora originales de la cita histórica.");
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
    const programadaHistorica = requiereCapturaHistorica
      ? `${fechaProgramadaHistorica}T${horaProgramadaHistorica}` : null;
    const firma = JSON.stringify([expedienteId, citaId, fecha, programadaHistorica]);
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
        fechaProgramadaHistorica: programadaHistorica,
        sucursalHistorica: requiereCapturaHistorica ? prospecto?.agencia : null,
        claveIdempotencia: intentoAsistenciaRef.current.clave,
      });
      setAvisoAsistencia(registro?.duplicado
        ? "La asistencia ya estaba registrada. Se recuperó la operación anterior."
        : "Asistencia confirmada. Historial actualizado sin retroceder la etapa comercial.");
      setMostrarAsistencia(false);
      setConfirmarAsistencia(false);
      intentoAsistenciaRef.current = null;
      onActualizado?.();
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
    if (!confirmarCita) {
      setErrorCita("Confirma los datos de la cita para este prospecto.");
      return;
    }

    const esAlta = modoCita === "crear" && !enChat;
    let citaId = null;
    let firma;
    let fechaHoraCita = "";
    let agencia = "";
    let asesorPiso = "";
    let comentarios = "";

    if (esAlta) {
      const fecha = nuevaCitaFecha.trim();
      const hora = nuevaCitaHora.trim();
      // El backend exige que sea exactamente la sucursal del expediente.
      agencia = String(prospecto?.agencia || nuevaCitaAgencia || "").trim();
      asesorPiso = nuevaCitaAsesorPiso.trim();
      comentarios = nuevaCitaComentarios.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) {
        setErrorCita("Selecciona fecha y hora válidas para la cita.");
        return;
      }
      if (!agencia) {
        setErrorCita("El expediente debe tener una agencia para agendar una cita.");
        return;
      }
      if (!asesorPiso) {
        setErrorCita("Selecciona el asesor que atenderá la cita.");
        return;
      }
      if (comentarios.length > 2000) {
        setErrorCita("Los comentarios no pueden superar 2000 caracteres.");
        return;
      }
      fechaHoraCita = `${fecha}T${hora}:00`;
      firma = JSON.stringify([expedienteId, fechaHoraCita, agencia, asesorPiso, comentarios]);
    } else {
      citaId = Number(citaIdTexto.trim());
      if (!Number.isSafeInteger(citaId) || citaId <= 0 || !citasCliente.some((c) => Number(c.id) === citaId)) {
        setErrorCita("Selecciona una cita del prospecto por su fecha y sucursal, o agenda una nueva.");
        return;
      }
      firma = JSON.stringify([expedienteId, citaId]);
    }

    // Conservar la misma clave si falla la conexión: Django resuelve reintentos
    // sin duplicar la cita o la actividad, siempre que no cambie el formulario.
    if (intentoCitaRef.current?.firma !== firma) {
      const uuid = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
      intentoCitaRef.current = { firma, clave: `cita:${uuid}` };
    }

    setGuardandoCita(true);
    try {
      // Alta V3: cita y etapa en una única transacción en Django.
      // Existente: nunca crear otra cita, solo verificar y vincularla.
      const registro = esAlta
        ? await apiEtapasV3.agendarCitaChat({
            expedienteId, fechaHoraCita, agencia, asesorPiso, comentarios,
            claveIdempotencia: intentoCitaRef.current.clave,
          })
        : await apiEtapasV3.registrarCita({
            expedienteId, citaId, claveIdempotencia: intentoCitaRef.current.clave,
          });
      const citaVinculadaId = esAlta ? Number(registro?.cita_id) : citaId;
      if (typeof sessionStorage !== "undefined" && expedienteId) {
        // Compatibilidad con citas pendientes del formulario V3 anterior.
        sessionStorage.removeItem(`v3_cita_pendiente_${expedienteId}`);
      }
      setAvisoRegistro("");
      setAvisoCita(registro?.duplicado
        ? "La cita ya estaba registrada; se recuperó el intento anterior."
        : "Cita agendada y vinculada correctamente. El historial se ha actualizado.");
      setMostrarFormularioCita(false);
      setConfirmarCita(false);
      intentoCitaRef.current = null;
      if (Number.isSafeInteger(citaVinculadaId) && citaVinculadaId > 0) {
        setCitaAsistenciaTexto(String(citaVinculadaId));
      }
      onActualizado?.();
      setRevision((v) => v + 1);
    } catch (err) {
      setErrorCita(err?.message || (esAlta
        ? "No se pudo agendar la cita. Comprueba los datos y vuelve a intentar."
        : "No se pudo vincular la cita existente. Revisa su fecha y sucursal."));
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
    if (!veh) {
      setErrorRegistro("Escribe el vehículo de la cotización enviada.");
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
      onActualizado?.();
      setRevision((v) => v + 1);
    } catch (err) {
      // Conservar la misma clave ante un fallo de red; reintentar no duplica.
      setErrorRegistro(err?.message || "No fue posible registrar la cotización.");
    } finally {
      setGuardando(false);
    }
  }


  async function registrarContactoExterno() {
    if (guardandoContacto || !confirmarContacto || notaContacto.trim().length < 10) {
      setErrorContacto("Confirma el contacto e indica una nota de al menos 10 caracteres.");
      return;
    }
    if (!intentoContactoRef.current) intentoContactoRef.current = nuevaClaveIdempotencia();
    setGuardandoContacto(true);
    setErrorContacto("");
    try {
      await apiEtapasV3.registrarContactoExterno({ expedienteId, medio: medioContacto,
        fechaContacto, observacion: notaContacto.trim(),
        claveIdempotencia: intentoContactoRef.current });
      setMostrarContactoExterno(false);
      setRevision((v) => v + 1);
      onActualizado?.();
    } catch (err) {
      setErrorContacto(err?.message || "No se pudo registrar el contacto.");
    } finally {
      setGuardandoContacto(false);
    }
  }

  function abrirCorreccion(item) {
    const datos = item?.datos_efectivos || {};
    setActividadCorreccion({ ...item, tipo: item.tipo_correccion || item.tipo });
    setCamposCorreccion({
      fecha_envio: datos.fecha_envio || item.fecha_actividad || "",
      vehiculo: datos.vehiculo || "",
      referencia: datos.referencia || "",
      fecha_recepcion: datos.fecha_recepcion || item.fecha_actividad || "",
      documentos: Array.isArray(datos.documentos) ? datos.documentos.join("\n") : "",
      fecha_hora_cita: (datos.fecha_hora_cita || "").slice(0, 16),
      fecha_asistencia_real: datos.fecha_asistencia_real || item.fecha_actividad || "",
    });
    setMotivoCorreccion("");
    setErrorCorreccion("");
    intentoCorreccionRef.current = null;
  }

  async function guardarCorreccion() {
    if (!actividadCorreccion || guardandoCorreccion) return;
    if (motivoCorreccion.trim().length < 8) {
      setErrorCorreccion("Explica la corrección con al menos 8 caracteres.");
      return;
    }
    const tipo = actividadCorreccion.tipo;
    const campos = tipo === "cotizacion_enviada"
      ? { fecha_envio: camposCorreccion.fecha_envio, vehiculo: camposCorreccion.vehiculo,
          referencia: camposCorreccion.referencia }
      : tipo === "documentos_recibidos"
        ? { fecha_recepcion: camposCorreccion.fecha_recepcion,
            documentos: camposCorreccion.documentos.split("\n").map((x) => x.trim()).filter(Boolean) }
        : tipo === "cita_agendada"
          ? { fecha_hora_cita: camposCorreccion.fecha_hora_cita }
          : { fecha_asistencia_real: camposCorreccion.fecha_asistencia_real };
    if (!intentoCorreccionRef.current) intentoCorreccionRef.current = `correccion:${crypto.randomUUID()}`;
    setGuardandoCorreccion(true);
    setErrorCorreccion("");
    try {
      await apiEtapasV3.corregirActividad({ expedienteId, actividadId: actividadCorreccion.id,
        cambios: campos, motivo: motivoCorreccion.trim(),
        claveIdempotencia: intentoCorreccionRef.current });
      setActividadCorreccion(null);
      setRevision((v) => v + 1);
    } catch (err) {
      setErrorCorreccion(err?.message || "No se pudo registrar la corrección.");
    } finally {
      setGuardandoCorreccion(false);
    }
  }

  return (
    <section className={enChat ? "crm-v3-chat min-w-0 bg-white" : "rounded-2xl border border-[#131E5C]/10 bg-white p-4 shadow-sm"} aria-label="Etapas comerciales">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#131E5C]">
            <Activity className="h-4 w-4" /> Etapas comerciales
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Seguimiento comercial independiente del estado histórico</p>
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
          {!resultado.iniciado && resultado.clasificacion_historica?.permitida ? (
            compact ? (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Expediente antiguo pendiente de clasificación. Abre la edición comercial para registrar su situación real.</p>
            ) : (
              <ClasificacionHistoricaForm
                key={expedienteId} expedienteId={expedienteId}
                estadoAnterior={resultado.clasificacion_historica.estado_anterior}
                agencia={resultado.clasificacion_historica.agencia}
                onActualizado={() => { setRevision((v) => v + 1); onActualizado?.(); }}
              />
            )
          ) : null}
          {!compact && resultado.iniciado && actual === "nuevo_prospecto" ? (
            <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs">
              <div className="font-extrabold text-[#131E5C]">¿Se contactó por otro medio?</div>
              <p className="mt-1 text-slate-600">Registra una llamada, Facebook, atención presencial o WhatsApp fuera del CRM. No es necesario que existan mensajes aquí, pero el contacto debe haber ocurrido realmente.</p>
              <button type="button" onClick={() => setMostrarContactoExterno((v) => !v)} className="mt-2 rounded border border-sky-300 bg-white px-3 py-2 font-bold text-[#131E5C]">{mostrarContactoExterno ? "Cerrar" : "Registrar contacto realizado"}</button>
              {mostrarContactoExterno ? (
                <div className="mt-3 grid gap-2 border-t border-sky-200 pt-3">
                  <label className="grid gap-1">Medio del contacto
                    <select value={medioContacto} onChange={(e) => {setMedioContacto(e.target.value); intentoContactoRef.current=null;}} className="rounded border bg-white px-2 py-2">
                      <option value="llamada">Llamada telefónica</option>
                      <option value="facebook">Facebook / Messenger</option>
                      <option value="presencial">Atención presencial</option>
                      <option value="whatsapp_externo">WhatsApp fuera del CRM</option>
                      <option value="otro">Otro medio</option>
                    </select>
                  </label>
                  <label className="grid gap-1">Fecha real del contacto
                    <input type="date" max={fechaHoyMx()} value={fechaContacto} onChange={(e) => {setFechaContacto(e.target.value); intentoContactoRef.current=null;}} className="rounded border bg-white px-2 py-2" />
                  </label>
                  <label className="grid gap-1">Qué se habló / evidencia operativa
                    <textarea rows={3} maxLength={600} value={notaContacto} onChange={(e) => {setNotaContacto(e.target.value); intentoContactoRef.current=null;}} className="rounded border bg-white px-2 py-2" placeholder="Ej. Se habló por teléfono sobre el vehículo solicitado" />
                  </label>
                  <label className="flex items-start gap-2"><input type="checkbox" checked={confirmarContacto} onChange={(e) => setConfirmarContacto(e.target.checked)} />Confirmo que yo realmente contacté al prospecto por el canal indicado.</label>
                  {errorContacto ? <p role="alert" className="font-bold text-red-700">{errorContacto}</p> : null}
                  <button type="button" disabled={guardandoContacto || !confirmarContacto} onClick={registrarContactoExterno} className="rounded bg-[#131E5C] px-3 py-2 font-bold text-white disabled:opacity-50">{guardandoContacto ? "Registrando…" : "Registrar y pasar a En seguimiento"}</button>
                </div>
              ) : null}
            </div>
          ) : null}
          {compact ? (
            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold text-[#131E5C]">{actual ? LABELS[actual] || actual : "Sin clasificar"}</p>
                <p className="mt-1 text-[11px] text-slate-500">Las acciones y las diez etapas se muestran en la ficha completa del prospecto.</p>
              </div>
              {historial.length > 0 ? (
                <div className="min-w-0">
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#131E5C]">
                    <Clock3 className="h-3.5 w-3.5 shrink-0" /> Última actividad
                  </p>
                  <p className="break-words text-slate-700">{historial[0].es_clasificacion_historica ? "Clasificación histórica" : (EVENTOS[historial[0].tipo] || historial[0].tipo)}</p>
                  <p className="text-[11px] text-slate-500">{fechaCorta(historial[0].fecha_actividad)}</p>
                </div>
              ) : null}
              {typeof onAbrirEdicion === "function" ? (
                <button type="button" onClick={onAbrirEdicion}
                  className="w-full rounded-lg bg-[#131E5C] px-3 py-2.5 font-bold text-white hover:bg-[#1c2b79]">
                  Abrir edición comercial
                </button>
              ) : null}
            </div>
          ) : (
            <>
          <ol className={enChat ? "crm-v3-etapas-grid grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"}>
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
                    <p className="mt-0.5 text-[11px] text-slate-500">Confirmación del envío con fecha y vehículo. La referencia es opcional.</p>
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
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C] sm:col-span-2">Referencia o folio (opcional)
                      <input type="text" maxLength={120} value={referencia} onChange={(e) => setReferencia(e.target.value)} disabled={guardando}
                        placeholder="Si existe, indica el folio o referencia" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
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
                      Agenda una nueva cita con asesor responsable o vincula una cita existente. La asistencia se confirma por separado.
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
                    <div className="flex gap-2 sm:col-span-2">
                      {enChat && typeof onAgendarCitaChat === "function" ? (
                        <button type="button" onClick={() => { setModoCita("existente"); setErrorCita(""); onAgendarCitaChat(); }}
                          className="rounded-lg bg-[#1746D1] px-3 py-1.5 text-xs font-bold text-white">
                          Agendar con asesor de piso
                        </button>
                      ) : (
                        <button type="button" onClick={() => { setModoCita("crear"); setErrorCita(""); }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${modoCita === "crear" ? "bg-[#131E5C] text-white" : "border border-slate-300 bg-white text-slate-600"}`}>
                          Agendar nueva cita
                        </button>
                      )}
                      <button type="button" onClick={() => { setModoCita("existente"); setErrorCita(""); }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${modoCita === "existente" ? "bg-[#131E5C] text-white" : "border border-slate-300 bg-white text-slate-600"}`}>
                        Usar cita ya existente {citasCliente.length ? `(${citasCliente.length})` : ""}
                      </button>
                    </div>
                    {enChat ? (
                      <p className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-[11px] text-blue-900 sm:col-span-2">
                        Usa la agenda y selecciona el asesor de piso. Una cita creada desde el chat se vincula automáticamente al expediente; las citas anteriores deben vincularse de manera individual.
                      </p>
                    ) : null}
                    {modoCita === "crear" && !enChat ? (
                      <>
                        <label className="grid gap-1 text-xs font-bold text-[#131E5C]">
                          Fecha de cita
                          <input type="date" min={fechaHoyMx()} value={nuevaCitaFecha}
                            onChange={(e) => setNuevaCitaFecha(e.target.value)}
                            disabled={guardandoCita}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                        </label>
                        <label className="grid gap-1 text-xs font-bold text-[#131E5C]">
                          Hora
                          <input type="time" value={nuevaCitaHora}
                            onChange={(e) => setNuevaCitaHora(e.target.value)}
                            disabled={guardandoCita}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                        </label>
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:col-span-2">
                          <span className="font-bold text-[#131E5C]">Sucursal del expediente: </span>
                          {prospecto?.agencia || nuevaCitaAgencia || "Sin agencia"}
                          <p className="mt-1 text-[11px] text-slate-500">La cita se registra en la sucursal del prospecto, no en otra agencia.</p>
                        </div>
                        <SelectorAsesorPisoCitaV3
                          value={nuevaCitaAsesorPiso}
                          onChange={(valor) => setNuevaCitaAsesorPiso(valor)}
                          disabled={guardandoCita}
                        />
                        <label className="grid gap-1 text-xs font-bold text-[#131E5C] sm:col-span-2">
                          Comentarios de la cita (opcional)
                          <textarea value={nuevaCitaComentarios} maxLength={2000} rows={2}
                            onChange={(e) => setNuevaCitaComentarios(e.target.value)}
                            disabled={guardandoCita}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                        </label>
                        <p className="text-[11px] text-slate-600 sm:col-span-2">
                          Al confirmar, la cita y la etapa comercial se registran juntas. Si ya existe una cita pendiente para este cliente y sucursal, selecciónala en «Usar cita ya existente».
                        </p>
                      </>
                    ) : (
                      <div className="grid gap-2 sm:col-span-2">
                        {cargandoCitasCliente ? (
                          <p className="text-xs text-slate-500">Buscando citas del cliente…</p>
                        ) : citasCliente.length > 0 ? (
                          <label className="grid gap-1 text-xs font-bold text-[#131E5C]">
                            Selecciona la cita registrada del cliente
                            <select value={citaIdTexto}
                              onChange={(e) => { setCitaIdTexto(e.target.value); intentoCitaRef.current = null; }}
                              disabled={guardandoCita}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal">
                              {citasCliente.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                  {String(c.fecha_hora_cita || "").slice(0, 16).replace("T", " ")} · {c.agencia} · {c.auto_interes || "Sin vehículo especificado"}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                        {citasCliente.length === 0 && !cargandoCitasCliente ? (
                          <p className="text-xs text-amber-700">{enChat ? "No se encontró una cita para vincular. Agenda desde el botón azul indicando el asesor de piso y actualiza las etapas antes de vincularla." : "No se encontró una cita registrada de este prospecto. Selecciona «Agendar nueva cita» e indica fecha, hora y asesor."}</p>
                        ) : null}
                      </div>
                    )}
                    <label className="flex items-start gap-2 text-xs font-medium text-slate-700 sm:col-span-2">
                      <input type="checkbox" checked={confirmarCita} onChange={(e) => setConfirmarCita(e.target.checked)}
                        disabled={guardandoCita} className="mt-0.5" />
                      Confirmo que la cita está acordada con el cliente del expediente.
                    </label>
                    {errorCita ? <p role="alert" className="text-xs font-semibold text-red-700 sm:col-span-2">{errorCita}</p> : null}
                    <div className="sm:col-span-2">
                      <button type="button" disabled={guardandoCita} onClick={registrarCita}
                        className="rounded-lg bg-[#131E5C] px-4 py-2 text-xs font-bold text-white hover:bg-[#1c2b79] disabled:opacity-50">
                        {guardandoCita ? "Guardando…" : modoCita === "crear" ? "Guardar y agendar cita" : "Confirmar y vincular cita"}
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
                    {citasParaAsistencia.length > 0 ? (
                      <label className="grid gap-1 text-xs font-bold text-[#131E5C] sm:col-span-2">
                        Cita del prospecto (fecha, hora y sucursal)
                        <select value={citaSeleccionada ? citaAsistenciaTexto : ""}
                          onChange={(e) => { setCitaAsistenciaTexto(e.target.value); intentoAsistenciaRef.current = null; }}
                          disabled={guardandoAsistencia}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal">
                          <option value="">— Selecciona la cita —</option>
                          {citasParaAsistencia.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {String(c.fecha_hora_cita || "").slice(0, 16).replace("T", " ")} · {c.agencia}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : requiereCapturaHistorica ? (
                      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                        <p className="text-xs text-amber-800 sm:col-span-2">La etapa procede del CRM anterior y no existe una cita vinculada. Confirma los datos históricos reales sin crear una cita ficticia.</p>
                        <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Fecha programada originalmente
                          <input type="date" max={fechaHoyMx()} value={fechaProgramadaHistorica}
                            onChange={(e) => { setFechaProgramadaHistorica(e.target.value); intentoAsistenciaRef.current = null; }}
                            disabled={guardandoAsistencia} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                        </label>
                        <label className="grid gap-1 text-xs font-bold text-[#131E5C]">Hora programada originalmente
                          <input type="time" value={horaProgramadaHistorica}
                            onChange={(e) => { setHoraProgramadaHistorica(e.target.value); intentoAsistenciaRef.current = null; }}
                            disabled={guardandoAsistencia} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                        </label>
                        <p className="text-xs text-slate-600 sm:col-span-2">Sucursal: {prospecto?.agencia || "No disponible"}</p>
                      </div>
                    ) : (
                      <div className="grid gap-1 text-xs text-amber-800 sm:col-span-2">
                        {citasVinculadasConAsistencia.length > 0 ? (
                          <p>La cita vinculada al expediente ya tiene una asistencia o clasificación registrada en el CRM anterior. No debe confirmarse por segunda vez; si la etapa comercial no coincide, revisa su clasificación histórica.</p>
                        ) : (
                          <p>No existe ninguna cita pendiente vinculada a este expediente para confirmar asistencia.</p>
                        )}
                        {citasSinVinculoPendientes.length > 0 ? (
                          <p>Existen otras citas del mismo cliente, pero no están vinculadas al expediente comercial. No pueden utilizarse para confirmar asistencia sin una vinculación verificable.</p>
                        ) : null}
                      </div>
                    )}
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">
                      Fecha real de visita
                      <input type="date" max={fechaHoyMx()} value={fechaAsistencia}
                        onChange={(e) => { setFechaAsistencia(e.target.value); intentoAsistenciaRef.current = null; }}
                        disabled={guardandoAsistencia}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                    </label>
                    {citaSeleccionadaFutura ? (
                      <p className="text-[11px] font-medium text-amber-800 sm:col-span-2">
                        Esta cita está programada para una fecha futura. Solo podrá confirmarse después de que ocurra.
                      </p>
                    ) : null}
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
                      <button type="button"
                        disabled={guardandoAsistencia || (!citaSeleccionada && !requiereCapturaHistorica) || citaSeleccionadaFutura}
                        onClick={registrarAsistencia}
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
                      Referencia o folio de autorización (opcional)
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
            {avisoFacturacion ? (
              <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{avisoFacturacion}</p>
            ) : null}
            {permiteFacturacion ? (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-[#131E5C]">Facturado · captura operativa</p>
                    <p className="mt-0.5 text-[11px] text-slate-600">El VIN se guardará también en el campo VIN Facturado del expediente.</p>
                  </div>
                  <button type="button" disabled={guardandoFacturacion}
                    onClick={() => { setMostrarFacturacion((valor) => !valor); setErrorFacturacion(""); }}
                    className="rounded-lg bg-[#131E5C] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                    {mostrarFacturacion ? "Cerrar" : "Registrar facturación"}
                  </button>
                </div>
                {mostrarFacturacion ? (
                  <div className="mt-3 grid gap-3 border-t border-slate-200 pt-3">
                    <label className="grid gap-1 text-xs font-bold text-[#131E5C]">
                      VIN facturado (17 caracteres)
                      <input type="text" value={vinFacturacion} maxLength={17} disabled={guardandoFacturacion}
                        onChange={(e) => setVinFacturacion(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17))}
                        autoComplete="off" placeholder="VIN del vehículo facturado"
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal" />
                      <span className="text-[11px] font-normal text-slate-500">{vinFacturacion.length}/17 · Se registrará la fecha operativa; no verifica CFDI.</span>
                    </label>
                    <label className="flex items-start gap-2 text-xs font-medium text-slate-700">
                      <input type="checkbox" checked={confirmarFacturacion} disabled={guardandoFacturacion}
                        onChange={(e) => setConfirmarFacturacion(e.target.checked)} className="mt-0.5" />
                      Confirmo que este VIN corresponde a una operación facturada real.
                    </label>
                    {errorFacturacion ? <p role="alert" className="text-xs font-semibold text-red-700">{errorFacturacion}</p> : null}
                    <button type="button" disabled={guardandoFacturacion || !confirmarFacturacion}
                      onClick={registrarFacturacion}
                      className="w-fit rounded-lg bg-[#131E5C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                      {guardandoFacturacion ? "Registrando…" : "Guardar VIN y marcar Facturado"}
                    </button>
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
                    <div className="font-bold text-[#131E5C]">{item.es_clasificacion_historica ? "Clasificación histórica" : item.es_homologacion_historica ? "Homologación histórica" : (EVENTOS[item.tipo] || item.tipo)}</div>
                    <div className="mt-0.5 text-slate-500">{fechaCorta(item.fecha_actividad)} · {item.usuario_crm || "Sin responsable"}</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">Resultado: {LABELS[item.etapa_resultante] || item.etapa_resultante || "Sin cambio"}</div>
                    {item.tiene_correccion ? <div className="mt-1 text-[10px] font-bold text-indigo-700">Con corrección auditada</div> : null}
                    {item.puede_corregir ? (
                      <button type="button" onClick={() => abrirCorreccion(item)}
                        className="mt-2 rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold text-[#131E5C] hover:bg-slate-100">
                        {item.es_homologacion_historica ? `Completar datos de ${item.tipo_correccion === "cita_agendada" ? "cita histórica" : "cotización histórica"}` : "Corregir actividad"}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {actividadCorreccion ? (
              <div className="mt-3 space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs">
                <div className="font-extrabold text-[#131E5C]">{actividadCorreccion.es_homologacion_historica ? "Completar información histórica" : "Corregir actividad"}: {EVENTOS[actividadCorreccion.tipo] || actividadCorreccion.tipo}</div>
                {actividadCorreccion.es_homologacion_historica ? <p className="text-amber-800">La clasificación proviene del CRM anterior. Debes registrar datos confirmados; no se inventará una nueva cotización ni cambiará la etapa.</p> : null}
                {actividadCorreccion.tipo === "cotizacion_enviada" ? (
                  <>
                    <label className="grid gap-1">Fecha de envío<input type="date" value={camposCorreccion.fecha_envio} onChange={(e) => setCamposCorreccion((p) => ({...p, fecha_envio:e.target.value}))} className="rounded border px-2 py-1"/></label>
                    <label className="grid gap-1">Vehículo<input value={camposCorreccion.vehiculo} onChange={(e) => setCamposCorreccion((p) => ({...p, vehiculo:e.target.value}))} className="rounded border px-2 py-1"/></label>
                    <label className="grid gap-1">Referencia<input value={camposCorreccion.referencia} onChange={(e) => setCamposCorreccion((p) => ({...p, referencia:e.target.value}))} className="rounded border px-2 py-1"/></label>
                  </>
                ) : actividadCorreccion.tipo === "documentos_recibidos" ? (
                  <>
                    <label className="grid gap-1">Fecha de recepción<input type="date" value={camposCorreccion.fecha_recepcion} onChange={(e) => setCamposCorreccion((p) => ({...p, fecha_recepcion:e.target.value}))} className="rounded border px-2 py-1"/></label>
                    <label className="grid gap-1">Documentos (uno por línea)<textarea rows={3} value={camposCorreccion.documentos} onChange={(e) => setCamposCorreccion((p) => ({...p, documentos:e.target.value}))} className="rounded border px-2 py-1"/></label>
                  </>
                ) : actividadCorreccion.tipo === "cita_agendada" ? (
                  <label className="grid gap-1">Fecha y hora de cita<input type="datetime-local" value={camposCorreccion.fecha_hora_cita} onChange={(e) => setCamposCorreccion((p) => ({...p, fecha_hora_cita:e.target.value}))} className="rounded border px-2 py-1"/></label>
                ) : (
                  <label className="grid gap-1">Fecha real de asistencia<input type="date" value={camposCorreccion.fecha_asistencia_real} onChange={(e) => setCamposCorreccion((p) => ({...p, fecha_asistencia_real:e.target.value}))} className="rounded border px-2 py-1"/></label>
                )}
                <label className="grid gap-1 font-bold">Motivo de corrección (obligatorio)
                  <textarea rows={2} maxLength={1000} value={motivoCorreccion} onChange={(e) => {setMotivoCorreccion(e.target.value); intentoCorreccionRef.current = null;}} className="rounded border px-2 py-1 font-normal"/>
                </label>
                {errorCorreccion ? <p role="alert" className="font-bold text-red-700">{errorCorreccion}</p> : null}
                <div className="flex gap-2">
                  <button type="button" disabled={guardandoCorreccion} onClick={guardarCorreccion} className="rounded bg-[#131E5C] px-3 py-2 font-bold text-white disabled:opacity-50">{guardandoCorreccion ? "Guardando…" : "Registrar corrección"}</button>
                  <button type="button" disabled={guardandoCorreccion} onClick={() => setActividadCorreccion(null)} className="rounded border bg-white px-3 py-2">Cancelar</button>
                </div>
                <p className="text-slate-600">La actividad original no se borra ni cambia de etapa.</p>
              </div>
            ) : null}
          </div>
            </>
          )}
        </>
      ) : null}
    </section>
  );
}
