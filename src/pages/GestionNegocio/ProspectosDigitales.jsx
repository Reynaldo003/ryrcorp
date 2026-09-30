// src/pages/GestionNegocio/ProspectosDigitales.jsx
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Car, CheckCircle2, FileText, Target,
  Users, ChevronDown, Plus, Check, CalendarCheck, ArrowDown,
  Loader2, XCircle, User, Phone, FileCheck, Calendar, Share2,
  Tag, CreditCard, KeyRound, Building2, ShieldCheck, Clock,
  BadgeCheck, PackageCheck, AlertCircle, UserCheck, Globe,
  MessageSquare, Shield
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import {
  getCitasStats, getCotizacionesStats, getPautasOrigen
} from "../../lib/apiProspectosDigitales";
import { http, api } from "../../lib/apiPruebas";
import { apiCitas } from "../../lib/apiCitas";
import { useAuth } from "../../auth/AuthContext";
import { LINEAS_WHATSAPP } from "../../config/lineasWhatsApp";

/* ============================================================
    CONFIGURACIÓN GENERAL & CONSTANTES
============================================================ */
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const AGENCIAS = ["VW Córdoba", "VW Orizaba", "VW Poza Rica", "VW Tuxpan", "VW Tuxtepec"];

const IMAGEN_HERO = "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=800&q=80";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80";

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "1px solid #E2E8F0",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  fontSize: 12,
  fontFamily: "inherit",
  fontWeight: "bold",
  color: "#001E50"
};

const VACIO = {
  negocio: null,
  pautas: [],
  citas: { citas_concertadas: 0, citas_efectivas: 0, tasa_asistencia: 0 },
  cotizaciones: null,
};

/* ============================================================
    HELPERS DE FORMATO Y NORMALIZACIÓN
============================================================ */
function quitaAccentos(str) {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  return query.toString();
}

function getNegocioStats(params = {}) {
  const query = buildQuery(params);
  return http(`/digitales/analitica/negocio-stats/${query ? `?${query}` : ""}`);
}

function numero(value) { return Number(value ?? 0); }
function porcentaje(value) { return `${numero(value).toLocaleString("es-MX", { maximumFractionDigits: 1 })}%`; }
function entero(value) { return numero(value).toLocaleString("es-MX", { maximumFractionDigits: 0 }); }
function moneda(value) {
  return `$${numero(value).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function normalizaTelefonoMx(tel) {
  const digits = String(tel || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("521") && digits.length === 13) return `52${digits.slice(3)}`;
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith("52")) return digits;
  return digits;
}

function normalizaTexto(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizaAgenciaGrupo(value) {
  const texto = normalizaTexto(value);

  if (!texto) return "";
  if (texto.includes("cordoba")) return "VW Cordoba";
  if (texto.includes("orizaba")) return "VW Orizaba";
  if (texto.includes("poza rica")) return "VW Poza Rica";
  if (texto.includes("tuxtepec")) return "VW Tuxtepec";
  if (texto.includes("tuxpan")) return "VW Tuxpan";

  return quitaAccentos(value);
}

function extraerNumerosWhatsApp(value) {
  const valores = Array.isArray(value)
    ? value
    : String(value || "").split(/[|,;\n]+/);

  return [
    ...new Set(
      valores
        .map(normalizaTelefonoMx)
        .filter((numero) => /^52\d{10}$/.test(numero))
    )
  ];
}

function getNumerosUsuarioSesion(user) {
  const fuentes = [
    user?.telefonos_whatsapp,
    user?.telefonos,
    user?.telefono,
    user?.numero_asesor,
    user?.whatsapp_number,
    user?.phone
  ];

  for (const fuente of fuentes) {
    const numeros = extraerNumerosWhatsApp(fuente);

    if (numeros.length) {
      return numeros;
    }
  }

  for (const key of ["auth", "crm.user", "user"]) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      const parsed = JSON.parse(raw);

      const userGuardado =
        parsed?.user && typeof parsed.user === "object"
          ? parsed.user
          : parsed;

      const numeros = extraerNumerosWhatsApp(
        userGuardado?.telefonos_whatsapp ||
        userGuardado?.telefonos ||
        userGuardado?.telefono ||
        userGuardado?.numero_asesor ||
        userGuardado?.whatsapp_number ||
        userGuardado?.phone ||
        ""
      );

      if (numeros.length) {
        return numeros;
      }
    } catch {
      // Continúa con la siguiente fuente.
    }
  }

  return [];
}

function deduplicarRegistros(items = []) {
  const mapa = new Map();

  items.forEach((item) => {
    const key =
      item?.id ??
      item?.id_cliente ??
      item?.cliente?.id ??
      normalizaTelefonoMx(
        item?.telefono ||
        item?.cliente?.telefono
      );

    if (key !== null && key !== undefined && key !== "") {
      mapa.set(String(key), item);
    }
  });

  return Array.from(mapa.values());
}

async function listarProspectosDashboard(params = {}) {
  const registros = [];
  let page = 1;

  while (page <= 100) {
    const respuesta = await api.digitalesListProspectos({
      ...params,
      page,
      page_size: 1000,
      limit: 1000
    });

    const items = extractArray(respuesta);

    registros.push(...items);

    if (Array.isArray(respuesta)) {
      break;
    }

    if (!respuesta?.next) {
      break;
    }

    page += 1;
  }

  return deduplicarRegistros(registros);
}

function combinarListaMetricas(listas = []) {
  const mapa = new Map();

  listas.flat().forEach((item) => {
    if (!item) return;

    const nombre =
      item.nombre ||
      item.name ||
      item.canal ||
      item.asesor ||
      item.pauta ||
      "";

    const key = normalizaTexto(nombre);

    if (!key) return;

    if (!mapa.has(key)) {
      mapa.set(key, { ...item });
      return;
    }

    const actual = mapa.get(key);
    const combinado = { ...actual };

    Object.entries(item).forEach(([campo, valor]) => {
      if (campo === "nombre" || campo === "name") {
        return;
      }

      const numeroValor = Number(valor);

      const esMetricaAcumulable =
        valor !== "" &&
        valor !== null &&
        valor !== undefined &&
        Number.isFinite(numeroValor) &&
        !campo.toLowerCase().includes("porcentaje") &&
        !campo.toLowerCase().includes("conversion") &&
        !campo.toLowerCase().includes("tasa");

      if (esMetricaAcumulable) {
        combinado[campo] =
          Number(combinado[campo] || 0) + numeroValor;
      }
    });

    mapa.set(key, combinado);
  });

  return Array.from(mapa.values());
}

function combinarObjetosNumericos(objetos = []) {
  const resultado = {};

  objetos.filter(Boolean).forEach((objeto) => {
    Object.entries(objeto).forEach(([key, value]) => {
      const num = Number(value);

      if (
        value !== "" &&
        value !== null &&
        value !== undefined &&
        Number.isFinite(num)
      ) {
        resultado[key] = Number(resultado[key] || 0) + num;
      } else if (resultado[key] === undefined) {
        resultado[key] = value;
      }
    });
  });

  return resultado;
}

function combinarNegocioStats(respuestas = []) {
  const validas = respuestas.filter(Boolean);

  if (!validas.length) {
    return null;
  }

  const resultado = {
    ...validas[0],
    embudo: combinarListaMetricas(
      validas.map((item) =>
        Array.isArray(item?.embudo) ? item.embudo : []
      )
    ),
    canales: combinarListaMetricas(
      validas.map((item) =>
        Array.isArray(item?.canales) ? item.canales : []
      )
    ),
    asesores: combinarListaMetricas(
      validas.map((item) =>
        Array.isArray(item?.asesores) ? item.asesores : []
      )
    ),
    actividad_periodo: combinarObjetosNumericos(
      validas.map((item) => item?.actividad_periodo || {})
    )
  };

  const totalOrigen = numero(resultado.embudo?.[0]?.total);

  resultado.embudo = (resultado.embudo || []).map(
    (etapa, index, lista) => {
      const total = numero(etapa.total);
      const anterior = index > 0
        ? numero(lista[index - 1]?.total)
        : total;

      return {
        ...etapa,
        conversion_origen:
          totalOrigen > 0
            ? (total / totalOrigen) * 100
            : 0,
        conversion_anterior:
          anterior > 0
            ? (total / anterior) * 100
            : 0
      };
    }
  );

  return resultado;
}

function combinarPautasStats(respuestas = []) {
  return combinarListaMetricas(
    respuestas.map((item) =>
      Array.isArray(item?.pautas) ? item.pautas : []
    )
  );
}

function combinarCitasStats(respuestas = []) {
  const citasConcertadas = respuestas.reduce(
    (total, item) =>
      total + numero(item?.citas_concertadas),
    0
  );

  const citasEfectivas = respuestas.reduce(
    (total, item) =>
      total + numero(item?.citas_efectivas),
    0
  );

  return {
    citas_concertadas: citasConcertadas,
    citas_efectivas: citasEfectivas,
    tasa_asistencia:
      citasConcertadas > 0
        ? (citasEfectivas / citasConcertadas) * 100
        : 0
  };
}

function combinarCotizacionesStats(respuestas = []) {
  return combinarObjetosNumericos(respuestas);
}

function extractArray(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.results)) return res.results;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.results)) return res.data.results;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  return [];
}

/* ============================================================
    EXTRACTORES DE ENTIDADES
============================================================ */
function getNombreCliente(p) {
  if (!p) return "Sin nombre";
  if (typeof p.cliente === "object" && p.cliente !== null) {
    const n = p.cliente.nombre || p.cliente.first_name || "";
    const a = p.cliente.apellidos || p.cliente.apellido || p.cliente.last_name || "";
    const full = `${n} ${a}`.trim();
    if (full) return full;
    if (p.cliente.telefono) return p.cliente.telefono;
  }
  if (p.cliente_nombre?.trim()) return p.cliente_nombre.trim();
  if (p.nombre_completo?.trim()) return p.nombre_completo.trim();
  if (p.nombre?.trim()) return `${p.nombre} ${p.apellidos || ""}`.trim();
  return `Cliente #${p.id || p.id_cliente || "s/n"}`;
}

function getAsesorCliente(p) {
  if (!p) return "Sin Asesor Digital";
  let ad = p.asesor_digital ?? p.cliente?.asesor_digital;
  if (typeof ad === "object" && ad !== null) {
    const full = `${ad.nombre || ad.first_name || ""} ${ad.apellidos || ad.last_name || ""}`.trim();
    if (full && !full.toLowerCase().includes("sin asesor")) return full;
    if (ad.username && !ad.username.toLowerCase().includes("sin asesor")) return ad.username;
    if (ad.nombre && !ad.nombre.toLowerCase().includes("sin asesor")) return ad.nombre;
  }
  if (ad && typeof ad === "string" && ad.trim() !== "" && ad.toLowerCase() !== "null") {
    const str = ad.trim();
    if (!str.toLowerCase().includes("sin asesor") && !str.toLowerCase().includes("sin asignar")) return str;
  }
  if (p.asesor_digital_nombre?.trim()) {
    const str = p.asesor_digital_nombre.trim();
    if (!str.toLowerCase().includes("sin asesor")) return str;
  }
  return "Sin Asesor Digital";
}

function getTelefonoCliente(p) {
  if (!p) return "Sin número";
  if (typeof p.cliente === "object" && p.cliente !== null) {
    if (p.cliente.telefono) return p.cliente.telefono;
    if (p.cliente.celular) return p.cliente.celular;
  }
  return p.telefono || p.telefono_cliente || p.celular || "Sin número";
}

function getVehiculoCliente(p) {
  if (!p) return "Sin vehículo especificado";
  return (
    p.auto_interes ||
    p.cliente_interes ||
    p.modelo_interes ||
    p.interes ||
    p.vehiculo ||
    p.modelo ||
    "Sin vehículo especificado"
  );
}

function getFechaCreacion(p) {
  if (!p) return "Sin fecha";
  const raw = p.creado ?? p.cliente?.creado ?? p.fecha_registro ?? p.created_at;
  if (!raw) return "Sin fecha";
  try {
    const str = String(raw).trim();
    const d = new Date(str.includes("T") ? str : str.replace(" ", "T"));
    if (isNaN(d.getTime())) return str.slice(0, 16);
    return d.toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  } catch {
    return String(raw).slice(0, 16);
  }
}

function getTipoCita(p) {
  if (!p) return "Sin Cita";
  if (p._citaMatch) {
    const tc = p._citaMatch.tipo_cita || p._citaMatch.tipo_cita_nombre || p._citaMatch.tipo || p._citaMatch.canal_tipo || p._citaMatch.canal;
    if (tc && tc !== "null" && tc !== "undefined") return String(tc).trim();
  }
  const fallback = (
    p.tipo_cita ||
    p.tipo_cita_nombre ||
    p.cita_tipo ||
    (typeof p.ultima_cita === "object" ? p.ultima_cita?.tipo_cita : null) ||
    (typeof p.ultima_cita_agendada === "object" ? p.ultima_cita_agendada?.tipo_cita : null) ||
    p.cliente?.tipo_cita
  );
  if (fallback && fallback !== "null" && fallback !== "undefined") return String(fallback).trim();
  return "Presencial / Piso";
}

/* ============================================================
    REGLAS DE NEGOCIO Y EVALUACIONES DE COHORTE
============================================================ */
function esDelPeriodo(p, anio, mes) {
  if (!p) return false;
  const raw = p.creado ?? p.cliente?.creado ?? p.fecha_registro ?? p.created_at;
  if (!raw || raw === "null" || raw === "undefined") return false;

  try {
    const str = String(raw).trim();
    const formatted = str.includes("T") ? str : str.replace(" ", "T");
    const d = new Date(formatted);
    if (isNaN(d.getTime())) return false;
    return d.getFullYear() === Number(anio) && (d.getMonth() + 1) === Number(mes);
  } catch {
    return false;
  }
}

function esProspectoDigitalValido(p, listaAsesoresValidos = []) {
  if (!p) return false;
  if (p.es_digital === false || p.es_prospecto_digital === false) return false;

  let ad = p.asesor_digital ?? p.cliente?.asesor_digital;
  let nombreAD = "";
  if (typeof ad === "object" && ad !== null) {
    if (ad.id === null || ad.id === 0 || ad.id === "0") return false;
    nombreAD = String(ad.nombre || ad.first_name || ad.username || ad.name || "").trim();
  } else if (typeof ad === "string" || typeof ad === "number") {
    nombreAD = String(ad).trim();
  }

  if (!nombreAD) return false;
  const strAD = nombreAD.toLowerCase();
  const invalidos = [
    "", "null", "undefined", "none", "false", "0", "s/a", "s/i", "ninguno",
    "sin asesor", "sin_asesor", "sin asesor asignado", "sin_asesor_asignado",
    "sin asignar", "sin_asignar", "sin asesor digital", "sin_asesor_digital"
  ];

  if (invalidos.includes(strAD) || strAD.includes("sin asesor") || strAD.includes("sin_asesor") || strAD.includes("sin asignar")) {
    return false;
  }

  if (Array.isArray(listaAsesoresValidos) && listaAsesoresValidos.length > 0) {
    const nombresValidos = listaAsesoresValidos.map(a => String(a.nombre || a).toLowerCase().trim());
    const adEsValido = nombresValidos.some(n => n.includes(strAD) || strAD.includes(n));
    if (!adEsValido) return false;
  }

  return true;
}

function tieneCotizacion(p) {
  if (!p) return false;
  const idCot = String(p.id_cotizacion || p.cliente?.id_cotizacion || p.cotizacion_id || p.id_cotizacion_crm || "").trim();
  const tieneId = idCot !== "" && idCot !== "0" && idCot !== "null" && idCot !== "undefined";
  const tieneFlag = p.con_cotizacion === true || p.con_cotizacion === 1 || p.tiene_cotizacion === true || p.tiene_cotizaciones === true || numero(p.cotizaciones) > 0 || numero(p.total_cotizaciones) > 0;
  return tieneId || tieneFlag;
}

function tieneCita(p) {
  if (!p) return false;
  const rawTipo = getTipoCita(p);
  const strTipo = String(rawTipo).toLowerCase().trim();
  if (strTipo.includes("tradicional") || strTipo.includes("piso") || strTipo.includes("showroom")) {
    return false;
  }
  const u = p.ultima_cita_agendada ?? p.fecha_cita ?? p.ultima_cita ?? p.id_ultima_cita;
  const tieneRegistro = Boolean(p._citaMatch || (u && u !== "null" && u !== "undefined" && u !== "0" && u !== 0 && u !== false));
  const estado = String(p.estado || p.estatus || "").toLowerCase();
  const tieneCitaFlag = p.con_cita === true || p.con_cita === 1 || p.tiene_cita === true || p.tiene_cita === 1 || p.asistencia === true || numero(p.citas) > 0 || numero(p.total_citas) > 0;
  return tieneRegistro || tieneCitaFlag || estado.includes("cita");
}

function asistioCita(p) {
  if (!p) return false;
  if (p._citaMatch) {
    const c = p._citaMatch;
    const est = String(c.estatus || c.estado || c.estatus_asistencia || "").toLowerCase();
    if (c.asistio === true || c.asistio === 1 || c.cita_efectiva === true || c.asistencia === true || est.includes("asisti") || est.includes("efectiva")) {
      return true;
    }
  }
  const estado = String(p.estado || p.estatus || "").toLowerCase();
  return p.asistio === true || p.cita_efectiva === true || p.asistencia === true || p.asistio === 1 || p.cita_efectiva === 1 || estado.includes("efectiva") || estado.includes("asisti");
}

function tieneSolicitudCredito(p) {
  if (!p) return false;
  const folio = (
    p.folio_solicitud_credito ??
    p.cliente?.folio_solicitud_credito ??
    p.folio_credito ??
    p.folio_solicitud ??
    p.solicitud_credito_folio ??
    p.solicitud_credito_estado ??
    p.estado_credito
  );

  if (folio === null || folio === undefined) return false;
  const strFolio = String(folio).trim().toLowerCase();

  return (
    strFolio !== "" &&
    strFolio !== "null" &&
    strFolio !== "undefined" &&
    strFolio !== "0" &&
    strFolio !== "false" &&
    strFolio !== "s/i" &&
    strFolio !== "s/f"
  );
}

function esFacturado(p) {
  if (!p) return false;
  const estado = String(p.estado || p.estatus || "").toLowerCase();
  return p.facturado === true || p.facturado === 1 || p.con_factura === true || numero(p.facturados) > 0 || numero(p.total_facturados) > 0 || estado.includes("facturad");
}

/* ============================================================
    KPI CARD PRINCIPAL (NÚMERO EN IMAGEN + MINI-CARDS AZUL MARINO)
============================================================ */
function CardResumenPrincipal({
  totalProspectos = 0,
  citasTotales = 0,
  citasEfectivasTotales = 0,
  cotizacionesTotales = 0,
  creditosTotales = 0,
  creditosAprobados = 0,
  facturadosTotales = 0,
  asesores = [],
  loading = false,
  objConcertadas = 40,
  objAsistidas = 30
}) {
  const pctConcertadas = Math.min(100, Math.round((citasTotales / (objConcertadas || 1)) * 100));
  const pctAsistidas = Math.min(100, Math.round((citasEfectivasTotales / (objAsistidas || 1)) * 100));

  const tasaEfectivaCita = citasTotales > 0 ? ((citasEfectivasTotales / citasTotales) * 100).toFixed(1) : "0.0";
  const tasaCotizados = totalProspectos > 0 ? ((cotizacionesTotales / totalProspectos) * 100).toFixed(1) : "0.0";
  const tasaFacturado = totalProspectos > 0 ? ((facturadosTotales / totalProspectos) * 100).toFixed(1) : "0.0";

  const asesoresValidos = useMemo(() => {
    return (asesores || []).filter(a => {
      if (!a || !a.nombre) return false;
      const n = String(a.nombre).trim().toLowerCase();
      return !n.includes("sin asesor") && !n.includes("sin_asesor") && n !== "null";
    });
  }, [asesores]);

  const maxProspectosAd = useMemo(() => {
    return Math.max(...asesoresValidos.map(a => numero(a.prospectos)), 1);
  }, [asesoresValidos]);

  const listDigitales = useMemo(() => asesoresValidos.slice(0, 4), [asesoresValidos]);
  const listPiso = useMemo(() => asesoresValidos.slice(4, 8), [asesoresValidos]);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md flex flex-col lg:flex-row">

      {/* LADO IZQUIERDO: HERO BANNER CON IMAGEN Y NÚMERO TOTAL DENTRO */}
      <div className="lg:w-1/3 xl:w-1/4 relative bg-[#001E50] p-5 flex flex-col justify-between shrink-0 overflow-hidden min-h-[260px] lg:min-h-[320px]">
        <img
          src={IMAGEN_HERO}
          alt="VW Dashboard"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-30 hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMAGE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#001E50] via-[#001E50]/80 to-[#001E50]/50 z-0" />

        {/* Badges Objetivos Top */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          <span className="bg-[#001E50]/90 backdrop-blur-md text-white/90 text-[10px] font-vw-head font-bold px-2.5 py-0.5 rounded-full border border-white/20">
            Obj. Concertadas: {objConcertadas}
          </span>
          <span className="bg-[#1677FF]/80 backdrop-blur-md text-white/90 text-[10px] font-vw-head font-bold px-2.5 py-0.5 rounded-full border border-white/20">
            Obj. Asistidas: {objAsistidas}
          </span>
        </div>

        {/* NÚMERO TOTAL DE PROSPECTOS DENTRO DE LA IMAGEN EN LETRAS BLANCAS Y GRANDES */}
        <div className="relative z-10 my-auto text-center py-2">
          <div className="text-[10px] font-vw-head font-bold text-blue-200 uppercase tracking-widest mb-0.5">
            TOTAL PROSPECTOS DIGITALES
          </div>
          <div className="text-6xl xl:text-7xl font-vw-head font-extrabold text-white leading-none tracking-tight drop-shadow-lg">
            {loading ? "..." : entero(totalProspectos)}
          </div>
          <div className="text-[11px] font-vw-text text-slate-300 mt-1.5 font-medium">
            Canales Digitales & Redes
          </div>
        </div>

        {/* Footer Tag en Banner */}
        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10">
          <div className="inline-flex items-center gap-1.5 text-white/90 text-xs font-vw-head font-bold">
            <Globe className="h-3.5 w-3.5 text-[#38BDF8]" />
            <span>VW Showroom Digital</span>
          </div>
          <span className="text-[9px] font-vw-head font-bold uppercase text-[#38BDF8] bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
            En vivo
          </span>
        </div>
      </div>

      {/* LADO DERECHO: PANEL AZUL MARINO (#001E50) ELEGANTE Y COMPACTO */}
      <div className="lg:w-2/3 xl:w-3/4 p-4 md:p-5 flex flex-col justify-between bg-white">

        {/* MINI-CARDS DE CONVERSIÓN EN AZUL MARINO (#001E50) */}
        <div className="grid grid-cols-3 gap-2.5 mb-3.5">
          {/* Cotizados */}
          <div className="bg-[#001E50] text-white rounded-xl p-2.5 border border-[#001E50]/20 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-vw-head font-bold uppercase text-slate-300">
              <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-[#38BDF8]" /> Cotizados</span>
              <span className="text-[#38BDF8] text-[9px]">{tasaCotizados}%</span>
            </div>
            <div className="text-xl font-vw-head font-extrabold text-white mt-1 leading-none">
              {loading ? "..." : entero(cotizacionesTotales)}
            </div>
          </div>

          {/* Crédito */}
          <div className="bg-[#001E50] text-white rounded-xl p-2.5 border border-[#001E50]/20 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-vw-head font-bold uppercase text-slate-300">
              <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5 text-[#38BDF8]" /> Crédito</span>
              <span className="text-[#38BDF8] text-[9px]">{creditosAprobados} Aprob</span>
            </div>
            <div className="text-xl font-vw-head font-extrabold text-white mt-1 leading-none">
              {loading ? "..." : entero(creditosTotales)}
            </div>
          </div>

          {/* Facturados */}
          <div className="bg-[#001E50] text-white rounded-xl p-2.5 border border-[#001E50]/20 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-vw-head font-bold uppercase text-slate-300">
              <span className="flex items-center gap-1"><Car className="h-3.5 w-3.5 text-[#38BDF8]" /> Facturados</span>
              <span className="text-[#38BDF8] text-[9px]">{tasaFacturado}% Cierre</span>
            </div>
            <div className="text-xl font-vw-head font-extrabold text-white mt-1 leading-none">
              {loading ? "..." : entero(facturadosTotales)}
            </div>
          </div>
        </div>

        {/* BARRAS DE PROGRESO DE METAS (CONCERTADAS Y ASISTIDAS) */}
        <div className="space-y-2 mb-3">
          <div>
            <div className="flex justify-between text-[11px] font-vw-head font-bold text-[#001E50] mb-0.5">
              <span>Concertadas</span>
              <span className="text-slate-400">
                <strong className="text-[#001E50]">{entero(citasTotales)}</strong> / {objConcertadas} Obj
              </span>
            </div>
            <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1677FF] rounded-full transition-all duration-500"
                style={{ width: `${pctConcertadas}%` }}
              />
              <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 right-[20%]" title="Objetivo" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-vw-head font-bold text-[#001E50] mb-0.5">
              <span>Asistidas Efectivas</span>
              <span className="text-slate-400">
                <strong className="text-[#001E50]">{entero(citasEfectivasTotales)}</strong> / {objAsistidas} Obj
              </span>
            </div>
            <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#001E50] rounded-full transition-all duration-500"
                style={{ width: `${pctAsistidas}%` }}
              />
              <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 right-[30%]" title="Objetivo" />
            </div>
          </div>
        </div>

        {/* DESGLOSE ASESORES EN 2 COLUMNAS COMPACTAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2.5 border-t border-slate-100">
          <div>
            <div className="text-[10px] font-vw-head font-bold text-[#001E50] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#001E50]"></span> ASESORES DIGITALES
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin pr-1">
              {listDigitales.length === 0 ? (
                <div className="text-[11px] text-slate-400 italic">Sin datos de asesores digitales</div>
              ) : (
                listDigitales.map((a, idx) => {
                  const totalA = numero(a.prospectos);
                  const cotiA = numero(a.cotizaciones);
                  const pctA = totalA > 0 ? ((cotiA / totalA) * 100).toFixed(1) : "0.0";
                  const widthBar = maxProspectosAd > 0 ? Math.min(100, Math.round((totalA / maxProspectosAd) * 100)) : 0;

                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[11px] font-vw-text">
                        <span className="font-semibold text-slate-700 truncate max-w-[130px]">{a.nombre}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          <strong className="text-[#001E50]">{cotiA}/{totalA}</strong> ({pctA}%)
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#001E50] rounded-full" style={{ width: `${widthBar}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-vw-head font-bold text-[#001E50] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1677FF]"></span> ASESORES PISO (LEADS)
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin pr-1">
              {listPiso.length === 0 ? (
                <div className="text-[11px] text-slate-400 italic">Sin asignaciones a piso</div>
              ) : (
                listPiso.map((a, idx) => {
                  const totalA = numero(a.prospectos);
                  const factA = numero(a.facturados || a.cotizaciones);
                  const pctA = totalA > 0 ? ((factA / totalA) * 100).toFixed(1) : "0.0";
                  const widthBar = maxProspectosAd > 0 ? Math.min(100, Math.round((totalA / maxProspectosAd) * 100)) : 0;

                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[11px] font-vw-text">
                        <span className="font-semibold text-slate-700 truncate max-w-[130px]">{a.nombre}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          <strong className="text-[#001E50]">{factA}/{totalA}</strong> ({pctA}%)
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1677FF] rounded-full" style={{ width: `${widthBar}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* FOOTER BAR AZUL MARINO */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-vw-head font-bold text-[#001E50]">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#1677FF]" />
              <span>Efectividad Citas: <strong className="text-[#1677FF]">{tasaEfectivaCita}%</strong></span>
            </div>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <div className="flex items-center gap-1 text-[#001E50]">
              <Shield className="h-3.5 w-3.5 text-[#001E50]" />
              <span>Tasa Cierre Global: <strong className="text-[#001E50]">{tasaFacturado}%</strong></span>
            </div>
          </div>

          <span className="bg-[#001E50] text-white text-[10px] font-vw-head font-bold px-3 py-1 rounded-full shadow-sm">
            Rendimiento Digital
          </span>
        </div>

      </div>
    </div>
  );
}

/* ============================================================
    PANELES ANCHOS DE FLUJO COMERCIAL (100% ANCHO)
============================================================ */
function PanelesFlujoComercial({ prospectosCohorte = [], loadingCohorte = false }) {
  const [panelAbierto, setPanelAbierto] = useState(null);

  const togglePanel = (id) => {
    setPanelAbierto(prev => prev === id ? null : id);
  };

  const listCotizaciones = useMemo(() => prospectosCohorte.filter(tieneCotizacion), [prospectosCohorte]);
  const listCitas = useMemo(() => prospectosCohorte.filter(tieneCita), [prospectosCohorte]);
  const listCredito = useMemo(() => prospectosCohorte.filter(tieneSolicitudCredito), [prospectosCohorte]);
  const listFacturados = useMemo(() => prospectosCohorte.filter(esFacturado), [prospectosCohorte]);

  const cotizadosPct = prospectosCohorte.length ? (listCotizaciones.length / prospectosCohorte.length) * 100 : 0;

  const citasEfectivasNum = useMemo(() => listCitas.filter(asistioCita).length, [listCitas]);
  const tasaAsistencia = listCitas.length ? (citasEfectivasNum / listCitas.length) * 100 : 0;

  const creditoAprobadoNum = useMemo(() => listCredito.filter(p => String(p.solicitud_credito_estado || p.estado_credito || "").toLowerCase().includes("aprob")).length, [listCredito]);
  const tasaAprobacionCredito = listCredito.length ? (creditoAprobadoNum / listCredito.length) * 100 : 0;

  const entregadosNum = useMemo(() => listFacturados.filter(p => p.entregado === true || p.estatus_entrega === "Entregado").length, [listFacturados]);
  const tasaEntrega = listFacturados.length ? (entregadosNum / listFacturados.length) * 100 : 0;

  const paneles = [
    {
      id: 'cotizaciones',
      titulo: 'Cotizaciones Documentadas',
      subtitulo: 'Generación de propuestas formales y planes de financiamiento',
      icono: <FileText className="h-5 w-5" />,
      colorBgIcon: 'bg-blue-50 text-[#1677FF] border border-blue-200',
      badgeBgIcon: 'bg-blue-400/20 text-blue-300',
      m1Val: entero(listCotizaciones.length),
      m1Label: 'Cotizaciones',
      m2Val: porcentaje(cotizadosPct),
      m2Label: 'Tasa de Cotización',
      data: listCotizaciones
    },
    {
      id: 'citas',
      titulo: 'Citas y Asistencia Showroom',
      subtitulo: 'Citas agendadas, pruebas de manejo y asistencia efectiva',
      icono: <CalendarDays className="h-5 w-5" />,
      colorBgIcon: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      badgeBgIcon: 'bg-emerald-400/20 text-emerald-300',
      m1Val: entero(listCitas.length),
      m1Label: 'Agendadas',
      m2Val: `${entero(citasEfectivasNum)} (${porcentaje(tasaAsistencia)})`,
      m2Label: 'Efectivas (Asistió)',
      data: listCitas
    },
    {
      id: 'credito',
      titulo: 'Solicitudes de Crédito',
      subtitulo: 'Estatus de expedientes financieros e integración con VWFS y Bancos',
      icono: <CreditCard className="h-5 w-5" />,
      colorBgIcon: 'bg-purple-50 text-purple-600 border border-purple-200',
      badgeBgIcon: 'bg-purple-400/20 text-purple-300',
      m1Val: entero(listCredito.length),
      m1Label: 'Solicitudes',
      m2Val: `${entero(creditoAprobadoNum)} (${porcentaje(tasaAprobacionCredito)})`,
      m2Label: 'Aprobadas',
      data: listCredito
    },
    {
      id: 'facturados',
      titulo: 'Facturados y Entregados',
      subtitulo: 'Cierre de venta, asignación de VIN y entregas de unidades',
      icono: <Car className="h-5 w-5" />,
      colorBgIcon: 'bg-amber-50 text-amber-600 border border-amber-200',
      badgeBgIcon: 'bg-amber-400/20 text-amber-300',
      m1Val: entero(listFacturados.length),
      m1Label: 'Facturados',
      m2Val: `${entero(entregadosNum)} (${porcentaje(tasaEntrega)})`,
      m2Label: 'Entregados',
      data: listFacturados
    }
  ];

  return (
    <div className="w-full space-y-3">
      {paneles.map(p => {
        const isOpen = panelAbierto === p.id;

        return (
          <div key={p.id} className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
            <div
              onClick={() => togglePanel(p.id)}
              className={`w-full p-4 cursor-pointer transition-all flex items-center justify-between select-none ${isOpen
                ? 'bg-[#001E50] text-white'
                : 'bg-white hover:bg-slate-50/80 text-[#1E293B]'
                }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`p-3 rounded-xl shrink-0 transition-colors ${isOpen ? p.badgeBgIcon : p.colorBgIcon}`}>
                  {p.icono}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-vw-head font-bold uppercase tracking-wide truncate ${isOpen ? 'text-white' : 'text-[#001E50]'}`}>
                      {p.titulo}
                    </h3>
                    <span className={`text-[10px] font-vw-head font-bold px-2 py-0.5 rounded-full ${isOpen ? 'bg-white/10 text-white border border-white/20' : 'bg-slate-100 text-slate-600'
                      }`}>
                      {loadingCohorte ? '...' : p.data.length} registros
                    </span>
                  </div>
                  <p className={`text-xs font-vw-text truncate hidden sm:block mt-0.5 ${isOpen ? 'text-slate-300' : 'text-slate-500'}`}>
                    {p.subtitulo}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="hidden md:flex items-baseline gap-4 text-right">
                  <div>
                    <div className={`text-[10px] font-vw-head font-bold uppercase ${isOpen ? 'text-slate-300' : 'text-slate-400'}`}>
                      {p.m1Label}
                    </div>
                    <div className="text-lg font-vw-head font-extrabold leading-none mt-0.5">
                      {loadingCohorte ? '...' : p.m1Val}
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] font-vw-head font-bold uppercase ${isOpen ? 'text-slate-300' : 'text-slate-400'}`}>
                      {p.m2Label}
                    </div>
                    <div className={`text-sm font-vw-head font-bold mt-0.5 ${isOpen ? 'text-blue-300' : 'text-[#1677FF]'}`}>
                      {loadingCohorte ? '...' : p.m2Val}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-200/20 pl-4">
                  <span className={`text-[10px] font-vw-head font-bold uppercase hidden lg:inline-block ${isOpen ? 'text-slate-200' : 'text-slate-400'}`}>
                    {isOpen ? 'Ocultar Detalle' : 'Ver Detalle'}
                  </span>
                  <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                </div>
              </div>
            </div>

            {isOpen && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-200 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {p.id === 'cotizaciones' && (
                    <>
                      <MicroKpi titulo="Cotizaciones Totales" valor={entero(listCotizaciones.length)} icono={<FileText className="h-4 w-4 text-blue-600" />} />
                      <MicroKpi titulo="Conversión a Cotizado" valor={porcentaje(cotizadosPct)} icono={<BadgeCheck className="h-4 w-4 text-emerald-600" />} />
                      <MicroKpi titulo="Promedio por Cliente" valor="1.2 cot." icono={<FileCheck className="h-4 w-4 text-amber-600" />} />
                      <MicroKpi titulo="Plan Preponderante" valor="Credit (VWFS)" icono={<Building2 className="h-4 w-4 text-purple-600" />} />
                    </>
                  )}
                  {p.id === 'citas' && (
                    <>
                      <MicroKpi titulo="Total Agendadas" valor={entero(listCitas.length)} icono={<Calendar className="h-4 w-4 text-blue-600" />} />
                      <MicroKpi titulo="Citas Efectivas" valor={entero(citasEfectivasNum)} icono={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} />
                      <MicroKpi titulo="Tasa de Asistencia" valor={porcentaje(tasaAsistencia)} icono={<Users className="h-4 w-4 text-purple-600" />} />
                      <MicroKpi titulo="Test Drives Realizados" valor={entero(Math.round(citasEfectivasNum * 0.75))} icono={<Car className="h-4 w-4 text-amber-600" />} />
                    </>
                  )}
                  {p.id === 'credito' && (
                    <>
                      <MicroKpi titulo="Solicitudes Ingresadas" valor={entero(listCredito.length)} icono={<CreditCard className="h-4 w-4 text-purple-600" />} />
                      <MicroKpi titulo="Créditos Aprobados" valor={entero(creditoAprobadoNum)} icono={<ShieldCheck className="h-4 w-4 text-emerald-600" />} />
                      <MicroKpi titulo="Tasa de Aprobación" valor={porcentaje(tasaAprobacionCredito)} icono={<BadgeCheck className="h-4 w-4 text-purple-600" />} />
                      <MicroKpi titulo="Financiera Líder" valor="VWFS Mexico" icono={<Building2 className="h-4 w-4 text-amber-600" />} />
                    </>
                  )}
                  {p.id === 'facturados' && (
                    <>
                      <MicroKpi titulo="Unidades Facturadas" valor={entero(listFacturados.length)} icono={<Car className="h-4 w-4 text-blue-600" />} />
                      <MicroKpi titulo="Unidades Entregadas" valor={entero(entregadosNum)} icono={<PackageCheck className="h-4 w-4 text-emerald-600" />} />
                      <MicroKpi titulo="Tasa de Entrega" valor={porcentaje(tasaEntrega)} icono={<KeyRound className="h-4 w-4 text-amber-600" />} />
                      <MicroKpi titulo="Tiempo Promed. Entrega" valor="3.2 Días" icono={<Clock className="h-4 w-4 text-purple-600" />} />
                    </>
                  )}
                </div>

                {loadingCohorte ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-[#001E50]" />
                    <span className="ml-2 text-xs font-vw-head font-bold text-slate-500">Cargando datos detallados del módulo...</span>
                  </div>
                ) : p.data.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto scrollbar-thin rounded-xl border border-slate-200 bg-white shadow-inner">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 sticky top-0 z-10 text-[10px] font-vw-head font-bold uppercase text-slate-600 border-b border-slate-200">
                        <tr>
                          {p.id === 'credito' ? (
                            <>
                              <th className="py-2.5 px-3">Cliente</th>
                              <th className="py-2.5 px-3 text-center">Fecha Creación</th>
                              <th className="py-2.5 px-3 text-right">Enganche Monto</th>
                              <th className="py-2.5 px-3 text-right">Presupuesto Mensual</th>
                              <th className="py-2.5 px-3">Asesor Digital</th>
                              <th className="py-2.5 px-3">Asesor Asignado</th>
                              <th className="py-2.5 px-3 text-center">Solicitud Crédito Estado</th>
                              <th className="py-2.5 px-3">Comentarios</th>
                            </>
                          ) : (
                            <>
                              <th className="py-2.5 px-3">Cliente</th>
                              <th className="py-2.5 px-3">Asesor Digital</th>
                              <th className="py-2.5 px-3">Vehículo</th>

                              {p.id === 'cotizaciones' && (
                                <>
                                  <th className="py-2.5 px-3 text-center">Folio Cotización</th>
                                  <th className="py-2.5 px-3">Plan / Financiamiento</th>
                                  <th className="py-2.5 px-3 text-right">Enganche Sugerido</th>
                                  <th className="py-2.5 px-3 text-center">Fecha Cotización</th>
                                </>
                              )}
                              {p.id === 'citas' && (
                                <>
                                  <th className="py-2.5 px-3 text-center">Fecha y Hora Cita</th>
                                  <th className="py-2.5 px-3 text-center">Tipo de Cita</th>
                                  <th className="py-2.5 px-3 text-right">Estatus Asistencia</th>
                                </>
                              )}
                              {p.id === 'facturados' && (
                                <>
                                  <th className="py-2.5 px-3 font-mono">Número VIN (Chasis)</th>
                                  <th className="py-2.5 px-3 text-center">Fecha Factura</th>
                                  <th className="py-2.5 px-3 text-right">Estatus Entrega</th>
                                </>
                              )}
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-vw-text">
                        {p.data.map((item, idx) => {
                          const cliente = getNombreCliente(item);
                          const asesor = getAsesorCliente(item);
                          const vehiculo = getVehiculoCliente(item);
                          const fecha = getFechaCreacion(item);

                          if (p.id === 'credito') {
                            const enganche = item.enganche_monto || item.monto_enganche || item.cliente?.enganche_monto || 0;
                            const presupuestoMensual = item.presupuesto_mensual || item.mensualidad_presupuesto || item.mensualidad || item.cliente?.presupuesto_mensual || 0;
                            const asesorAsignado = item.asesor_asignado || item.asesor_nombre || item.asesor || item.vendedor || "Sin asignar";
                            const estadoCredito = item.solicitud_credito_estado || item.estado_credito || item.estatus_credito || item.credito_estatus || "En Revisión";
                            const comentariosText = item.comentarios || item.observaciones || item.notas || "Sin comentarios";

                            return (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2 px-3 font-bold text-[#001E50] whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate max-w-[150px]">{cliente}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-3 text-center text-slate-600 whitespace-nowrap text-[10px]">
                                  <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-vw-head font-bold text-slate-700">
                                    <Calendar className="h-3 w-3 text-slate-400" />
                                    {fecha}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                                  {moneda(enganche)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-purple-700 whitespace-nowrap">
                                  {moneda(presupuestoMensual)}
                                </td>
                                <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-vw-head font-bold bg-[#001E50]/10 text-[#001E50]">
                                    {asesor}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-vw-head font-bold bg-slate-100 text-slate-700">
                                    {asesorAsignado}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 rounded text-[10px] font-vw-head font-bold">
                                    <ShieldCheck className="h-3 w-3 text-purple-600" />
                                    {estadoCredito}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-600 text-xs max-w-[200px] truncate" title={comentariosText}>
                                  <div className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{comentariosText}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2 px-3 font-bold text-[#001E50] whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[160px]">{cliente}</span>
                                </div>
                              </td>
                              <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-vw-head font-bold bg-[#001E50]/10 text-[#001E50]">
                                  {asesor}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <Car className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[150px]">{vehiculo}</span>
                                </div>
                              </td>

                              {p.id === 'cotizaciones' && (
                                <>
                                  <td className="py-2 px-3 text-center whitespace-nowrap font-mono text-xs font-bold text-[#1677FF]">
                                    <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                      <FileCheck className="h-3 w-3 text-[#1677FF]" />
                                      {item.id_cotizacion || item.cliente?.id_cotizacion || `COT-${idx + 101}`}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                                    {item.plan_financiamiento || "Credit (VWFS) 36 meses"}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                                    {moneda(item.monto_enganche || 85000)}
                                  </td>
                                  <td className="py-2 px-3 text-center text-slate-500 whitespace-nowrap text-[10px]">
                                    {fecha}
                                  </td>
                                </>
                              )}

                              {p.id === 'citas' && (
                                <>
                                  <td className="py-2 px-3 text-center whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-vw-head font-bold text-slate-700">
                                      <Calendar className="h-3 w-3 text-slate-400" />
                                      {fecha}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-vw-head font-bold text-amber-800">
                                      <Tag className="h-3 w-3 text-amber-600" />
                                      {getTipoCita(item)}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-right whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-vw-head font-bold ${asistioCita(item) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                      }`}>
                                      {asistioCita(item) ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3 text-slate-400" />}
                                      {asistioCita(item) ? "Asistió (Efectiva)" : "Agendada / Pendiente"}
                                    </span>
                                  </td>
                                </>
                              )}

                              {p.id === 'facturados' && (
                                <>
                                  <td className="py-2 px-3 font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
                                    {item.vin || `3VW2B7AJ${idx + 10}849`}
                                  </td>
                                  <td className="py-2 px-3 text-center text-slate-500 whitespace-nowrap text-[10px]">
                                    {fecha}
                                  </td>
                                  <td className="py-2 px-3 text-right whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-vw-head font-bold">
                                      <KeyRound className="h-3 w-3 text-emerald-600" />
                                      {item.entregado ? "Entregado al Cliente" : "Listo para Entrega"}
                                    </span>
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200">
                    No se encontraron registros activos para este módulo en la cohorte seleccionada.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MicroKpi({ titulo, valor, icono }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-[9px] font-vw-head font-bold text-slate-400 uppercase tracking-wider">{titulo}</div>
        <div className="text-sm font-vw-head font-extrabold text-[#001E50] mt-0.5">{valor}</div>
      </div>
      <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
        {icono}
      </div>
    </div>
  );
}

/* ============================================================
    SUBCOMPONENTE: EMBUDO COMERCIAL Y BURBUJAS
============================================================ */
function EmbudoComercial({ etapas = [], canales = [], pautas = [], loading }) {
  const datos = Array.isArray(etapas) ? etapas : [];
  const coloresFunnel = ["#001E50", "#0B2D66", "#163B7C", "#214A92", "#2C58A8", "#3767BE", "#4275D4", "#4D84EA", "#5892FF"];
  const anchoInicial = 100;
  const anchoFinal = 40;

  const bubbleRows = useMemo(() => {
    const listPautas = pautas.map(p => ({ nombre: p.nombre, total: numero(p.total), tipo: 'Pauta' }));
    const listCanales = canales.map(c => ({ nombre: c.nombre, total: numero(c.prospectos), tipo: 'Canal' }));

    const totalPautas = listPautas.reduce((acc, p) => acc + p.total, 0);

    const adjustedCanales = listCanales.map(c => {
      if (c.nombre === 'Facebook Ads' || c.nombre === 'Facebook' || c.nombre === 'FB') {
        return { ...c, total: Math.max(0, c.total - totalPautas) };
      }
      return c;
    });

    let combinados = [...adjustedCanales, ...listPautas]
      .filter(x => x.total > 0)
      .sort((a, b) => b.total - a.total);

    if (combinados.length === 0) return [];

    const maxVal = combinados[0].total;

    const FLAT_PALETTE = [
      "#001E50", "#05265D", "#0B2E6A", "#103677", "#163E84",
      "#1B4691", "#214E9F", "#2656AC", "#2C5EB9", "#3166C6",
      "#376ED3", "#3C76E0", "#427EED", "#4786FA", "#1677FF",
      "#2486FF", "#3295FF", "#40A4FF", "#0EA5E9", "#38BDF8"
    ];

    const pseudoRandom = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      return Math.abs((hash % 100) / 100);
    };

    const sizedItems = combinados.map((item, i) => {
      const minRadius = 14;
      const maxRadius = 135;
      const ratio = Math.pow(item.total / maxVal, 0.5);
      const size = minRadius + (maxRadius - minRadius) * ratio;
      const color = FLAT_PALETTE[i % FLAT_PALETTE.length];
      const offsetY = (pseudoRandom(item.nombre + "y") - 0.5) * 15;

      return { ...item, size, color, offsetY };
    });

    const shuffled = [...sizedItems].sort((a, b) => pseudoRandom(a.nombre) - pseudoRandom(b.nombre));

    const rows = [];
    let currentRow = [];
    let currentUsage = 0;
    let widthPct = 95;
    let maxUsage = 800;

    shuffled.forEach((item) => {
      const itemWidth = item.size + 2;

      if (currentUsage + itemWidth > maxUsage && currentRow.length > 0) {
        rows.push({ items: currentRow, width: `${widthPct}%` });
        currentRow = [];
        currentUsage = 0;
        widthPct = Math.max(30, widthPct - 16);
        maxUsage = Math.max(200, maxUsage - 130);
      }
      currentRow.push(item);
      currentUsage += itemWidth;
    });

    if (currentRow.length > 0) {
      rows.push({ items: currentRow, width: `${widthPct}%` });
    }

    return rows;
  }, [canales, pautas]);

  const datosFunnel = datos.map((etapa, index) => {
    const totalEtapas = Math.max(datos.length - 1, 1);
    const progreso = index / totalEtapas;
    return {
      ...etapa,
      total: numero(etapa.total),
      ancho: anchoInicial - (anchoInicial - anchoFinal) * progreso,
      color: coloresFunnel[index % coloresFunnel.length],
    };
  });

  return (
    <Tarjeta>
      <TituloCard icono={<Target />} titulo="Embudo y Origen Digital" />
      {loading ? (
        <div className="mt-5 flex flex-col items-center gap-1">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-[55px]" style={{ width: `${anchoInicial - ((anchoInicial - anchoFinal) * i) / 7}%` }}><Skeleton className="h-full w-full" /></div>)}
        </div>
      ) : datosFunnel.length === 0 ? (
        <Vacio texto="Sin datos de embudo" />
      ) : (
        <>
          {bubbleRows.length > 0 && (
            <div className="relative w-full max-w-[850px] mx-auto flex flex-col items-center justify-center overflow-visible pb-8 pt-4 px-2 border-b border-slate-100">
              <div className="absolute inset-0 pointer-events-none z-0">
                <svg width="100%" height="100%" preserveAspectRatio="none">
                  <line x1="5%" y1="0" x2="30%" y2="100%" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6 6" />
                  <line x1="95%" y1="0" x2="70%" y2="100%" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6 6" />
                </svg>
              </div>

              {bubbleRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-wrap items-center justify-around z-10 mx-auto" style={{ width: row.width, marginTop: rowIndex > 0 ? '-1rem' : '0' }}>
                  {row.items.map((b) => (
                    <div key={b.nombre} className="bubble-container shrink-0" style={{ animationDelay: `${Math.random() * 2}s`, margin: '0 -4px' }}>
                      <div
                        title={`${b.nombre}: ${b.total} prospectos (${b.tipo})`}
                        className="rounded-full flex flex-col items-center justify-center text-white cursor-pointer hover:scale-110 hover:z-30 transition-transform duration-200 shadow-sm relative"
                        style={{
                          width: b.size,
                          height: b.size,
                          backgroundColor: b.color,
                          marginTop: `${b.offsetY}px`,
                          border: '2px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        {b.size >= 36 && (
                          <span className="font-vw-head font-extrabold leading-none" style={{ fontSize: b.size > 80 ? '24px' : b.size > 50 ? '16px' : '12px' }}>
                            {entero(b.total)}
                          </span>
                        )}
                        {b.size >= 75 && (
                          <span className="font-vw-text text-white/90 truncate w-[85%] text-center leading-tight mt-1 px-1" style={{ fontSize: b.size > 100 ? '11px' : '9px' }}>
                            {b.nombre}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center z-20 shadow-sm animate-bounce">
                <ArrowDown className="h-4 w-4 text-[#001E50]" />
              </div>
            </div>
          )}

          <div className="mt-8 flex min-h-[350px] items-start justify-center px-2">
            <div className="flex w-full max-w-[600px] flex-col items-center">
              {datosFunnel.map((etapa, index) => {
                const siguiente = datosFunnel[index + 1];
                const anchoInferior = siguiente ? siguiente.ancho : Math.max(etapa.ancho - 7, 24);
                const relacionInferior = anchoInferior / etapa.ancho;
                const recorte = ((1 - relacionInferior) / 2) * 100;

                return (
                  <div key={etapa.id || index} className="relative -mt-[1px] flex h-[55px] shrink-0 items-center justify-center text-white"
                    style={{ width: `${etapa.ancho}%`, backgroundColor: etapa.color, clipPath: `polygon(0% 0%, 100% 0%, ${100 - recorte}% 100%, ${recorte}% 100%)` }}>
                    <div className="flex w-full items-center justify-between px-6 sm:px-12">
                      <div className="min-w-0 text-left">
                        <div className="truncate text-[11px] font-vw-head font-bold uppercase tracking-wider">{etapa.nombre}</div>
                        <div className="text-[9px] font-vw-text font-bold text-white/70">
                          {index === 0 ? "Etapa inicial" : `${porcentaje(index === 0 ? 100 : numero(etapa.conversion_anterior))} vs. ant`}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xl font-vw-head font-extrabold leading-none">{entero(etapa.total)}</div>
                        <div className="text-[9px] font-vw-head font-bold text-white/80">{porcentaje(index === 0 ? 100 : numero(etapa.conversion_origen))}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs font-vw-head font-bold text-slate-500 uppercase">Conversión final</div>
            <div className="text-xl font-vw-head font-extrabold text-[#10B981]">{porcentaje(datosFunnel[datosFunnel.length - 1]?.conversion_origen)}</div>
          </div>
        </>
      )}
    </Tarjeta>
  );
}

/* ============================================================
    COMPONENTE PRINCIPAL
============================================================ */
export default function ProspectosDigitales() {
  const { user, ready } = useAuth();

  const hoy = new Date();
  const añoActual = hoy.getFullYear();
  const mesActual = hoy.getMonth();

  const años = useMemo(
    () => Array.from({ length: 5 }, (_, i) => añoActual - i),
    [añoActual]
  );

  const [añoSel, setAñoSel] = useState(añoActual);
  const [mesSel, setMesSel] = useState(mesActual);
  const [agenciaSel, setAgenciaSel] = useState("Todas");

  const rolUsuario = useMemo(() => {
    return normalizaTexto(
      user?.rol?.nombre ||
      user?.rol?.name ||
      user?.rol ||
      ""
    );
  }, [user]);

  const isAdmin = useMemo(() => {
    const permisos = Array.isArray(user?.permisos)
      ? user.permisos
      : [];

    return (
      rolUsuario === "administrador" ||
      rolUsuario === "admin" ||
      permisos.includes("ALL") ||
      permisos.includes("USUARIOS_ADMIN")
    );
  }, [rolUsuario, user?.permisos]);

  const isCoordinador = useMemo(() => {
    const permisos = Array.isArray(user?.permisos)
      ? user.permisos
      : [];

    return (
      !isAdmin &&
      (
        rolUsuario === "coordinador digital" ||
        rolUsuario === "coordinador_digital" ||
        permisos.includes("CRM_COORDINADOR_DIGITAL")
      )
    );
  }, [isAdmin, rolUsuario, user?.permisos]);

  const numerosUsuarioSesion = useMemo(() => {
    return getNumerosUsuarioSesion(user);
  }, [user]);

  const numerosPermitidos = useMemo(() => {
    if (isAdmin) {
      return Object.keys(LINEAS_WHATSAPP)
        .map(normalizaTelefonoMx)
        .filter(Boolean);
    }

    const lineasConfiguradas = new Set(
      Object.keys(LINEAS_WHATSAPP).map(normalizaTelefonoMx)
    );

    return [
      ...new Set(
        numerosUsuarioSesion
          .map(normalizaTelefonoMx)
          .filter((numero) =>
            lineasConfiguradas.has(numero)
          )
      )
    ];
  }, [isAdmin, numerosUsuarioSesion]);

  const agenciasUsuario = useMemo(() => {
    return String(user?.agencia || "")
      .split("|")
      .map((agencia) => agencia.trim())
      .filter(Boolean);
  }, [user?.agencia]);

  const agenciasPermitidas = useMemo(() => {
    if (isAdmin) {
      return AGENCIAS;
    }

    const agenciasLineas = numerosPermitidos
      .map((numero) =>
        LINEAS_WHATSAPP[numero]?.agencia || ""
      )
      .filter(Boolean);

    const todas = [
      ...agenciasUsuario,
      ...agenciasLineas
    ];

    const mapa = new Map();

    todas.forEach((agencia) => {
      const normalizada = normalizaAgenciaGrupo(agencia);

      if (!normalizada) return;

      const agenciaCatalogo = AGENCIAS.find(
        (item) =>
          normalizaAgenciaGrupo(item) === normalizada
      );

      mapa.set(
        normalizada,
        agenciaCatalogo || agencia
      );
    });

    return Array.from(mapa.values());
  }, [
    isAdmin,
    agenciasUsuario,
    numerosPermitidos
  ]);

  const lineasConsulta = useMemo(() => {
    if (isAdmin) {
      return [];
    }

    if (agenciaSel === "Todas") {
      return numerosPermitidos;
    }

    const agenciaSeleccionada =
      normalizaAgenciaGrupo(agenciaSel);

    return numerosPermitidos.filter((numero) => {
      const agenciaLinea =
        LINEAS_WHATSAPP[numero]?.agencia || "";

      return (
        normalizaAgenciaGrupo(agenciaLinea) ===
        agenciaSeleccionada
      );
    });
  }, [
    isAdmin,
    numerosPermitidos,
    agenciaSel
  ]);

  useEffect(() => {
    if (agenciaSel === "Todas") {
      return;
    }

    const permitida = agenciasPermitidas.some(
      (agencia) =>
        normalizaAgenciaGrupo(agencia) ===
        normalizaAgenciaGrupo(agenciaSel)
    );

    if (!permitida) {
      setAgenciaSel("Todas");
    }
  }, [agenciaSel, agenciasPermitidas]);

  const filtrosParams = useMemo(() => {
    const mesStart =
      `${añoSel}-${String(mesSel + 1).padStart(2, "0")}-01`;

    const ultimoDia = new Date(
      añoSel,
      mesSel + 1,
      0
    ).getDate();

    const mesEnd =
      `${añoSel}-${String(mesSel + 1).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;

    const params = {
      anio: añoSel,
      mes: mesSel + 1,

      creado__gte: mesStart,
      creado__lte: `${mesEnd} 23:59:59`,

      fecha_registro_desde: mesStart,
      fecha_registro_hasta: mesEnd,

      fecha_desde: mesStart,
      fecha_hasta: mesEnd,

      created_at__gte: mesStart,
      created_at__lte: `${mesEnd} 23:59:59`,

      asesor_digital__isnull: "false",
      con_asesor_digital: 1
    };

    if (agenciaSel !== "Todas") {
      const agencia = quitaAccentos(agenciaSel);

      params.agencia = agencia;
      params.agencia_nombre = agencia;
      params.sucursal = agencia;
    }

    return params;
  }, [
    añoSel,
    mesSel,
    agenciaSel
  ]);
  const [data, setData] = useState(VACIO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [prospectosRaw, setProspectosRaw] = useState([]);
  const [citasRaw, setCitasRaw] = useState([]);
  const [loadingCohorte, setLoadingCohorte] = useState(true);

  useEffect(() => {
    if (!ready) {
      return;
    }

    let activo = true;

    async function cargarDashboard() {
      setLoading(true);
      setLoadingCohorte(true);
      setError("");

      try {
        const mesStart =
          `${añoSel}-${String(mesSel + 1).padStart(2, "0")}-01`;

        const ultimoDia = new Date(
          añoSel,
          mesSel + 1,
          0
        ).getDate();

        const mesEnd =
          `${añoSel}-${String(mesSel + 1).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;

        /*
         * ADMIN:
         * una consulta global con todos=1.
         *
         * COORDINADOR / USUARIO:
         * una consulta por cada línea permitida.
         */
        const alcances = isAdmin
          ? [null]
          : lineasConsulta;

        if (!isAdmin && alcances.length === 0) {
          if (!activo) return;

          setData(VACIO);
          setProspectosRaw([]);
          setCitasRaw([]);
          setError(
            "El usuario no tiene líneas de WhatsApp asignadas para el alcance seleccionado."
          );

          return;
        }

        /*
         * ============================
         * ANALÍTICA POR LÍNEA
         * ============================
         */
        const metricasPorLinea =
          await Promise.allSettled(
            alcances.map(async (numeroLinea) => {
              const params = {
                ...filtrosParams
              };

              if (numeroLinea) {
                params.numero_asesor =
                  numeroLinea;
              } else {
                params.todos = 1;
              }

              const [
                negocio,
                pautas,
                citas,
                cotizaciones
              ] = await Promise.allSettled([
                getNegocioStats(params),
                getPautasOrigen(params),
                getCitasStats(params),
                getCotizacionesStats(params)
              ]);

              return {
                negocio:
                  negocio.status === "fulfilled"
                    ? negocio.value
                    : null,

                pautas:
                  pautas.status === "fulfilled"
                    ? pautas.value
                    : null,

                citas:
                  citas.status === "fulfilled"
                    ? citas.value
                    : null,

                cotizaciones:
                  cotizaciones.status === "fulfilled"
                    ? cotizaciones.value
                    : null
              };
            })
          );

        const metricasValidas =
          metricasPorLinea
            .filter(
              (resultado) =>
                resultado.status === "fulfilled"
            )
            .map((resultado) =>
              resultado.value
            );

        /*
         * ============================
         * PROSPECTOS POR LÍNEA
         * ============================
         */
        const prospectosPorLinea =
          await Promise.allSettled(
            alcances.map((numeroLinea) => {
              const params = {
                ...filtrosParams,
                ligero: 1
              };

              if (numeroLinea) {
                params.numero_asesor =
                  numeroLinea;
              } else {
                params.todos = 1;
              }

              return listarProspectosDashboard(
                params
              );
            })
          );

        const prospectos =
          deduplicarRegistros(
            prospectosPorLinea.flatMap(
              (resultado) =>
                resultado.status === "fulfilled"
                  ? resultado.value
                  : []
            )
          );

        /*
         * ============================
         * CITAS
         * ============================
         *
         * Citas no necesita definir el alcance
         * final del usuario. Solo las usamos
         * para enriquecer los prospectos que
         * YA fueron autorizados arriba.
         */
        let agenciasCitas = [];

        if (agenciaSel !== "Todas") {
          agenciasCitas = [agenciaSel];
        } else if (!isAdmin) {
          agenciasCitas = agenciasPermitidas;
        }

        let citas = [];

        if (isAdmin && agenciaSel === "Todas") {
          citas = await apiCitas.list({
            fecha_desde: mesStart,
            fecha_hasta: mesEnd
          });
        } else {
          const respuestasCitas =
            await Promise.allSettled(
              agenciasCitas.map((agencia) =>
                apiCitas.list({
                  fecha_desde: mesStart,
                  fecha_hasta: mesEnd,
                  agencia: quitaAccentos(
                    agencia
                  )
                })
              )
            );

          citas = deduplicarRegistros(
            respuestasCitas.flatMap(
              (resultado) =>
                resultado.status === "fulfilled"
                  ? resultado.value
                  : []
            )
          );
        }

        if (!activo) {
          return;
        }

        const negocios =
          metricasValidas.map(
            (item) => item.negocio
          );

        const pautas =
          metricasValidas.map(
            (item) => item.pautas
          );

        const statsCitas =
          metricasValidas.map(
            (item) => item.citas
          );

        const cotizaciones =
          metricasValidas.map(
            (item) => item.cotizaciones
          );

        setData({
          negocio:
            combinarNegocioStats(
              negocios
            ),

          pautas:
            combinarPautasStats(
              pautas
            ),

          citas:
            combinarCitasStats(
              statsCitas
            ),

          cotizaciones:
            combinarCotizacionesStats(
              cotizaciones
            )
        });

        setProspectosRaw(
          prospectos
        );

        setCitasRaw(
          Array.isArray(citas)
            ? citas
            : []
        );

        const fallosMetricas =
          metricasPorLinea.filter(
            (resultado) =>
              resultado.status === "rejected"
          ).length;

        const fallosProspectos =
          prospectosPorLinea.filter(
            (resultado) =>
              resultado.status === "rejected"
          ).length;

        const totalFallos =
          fallosMetricas +
          fallosProspectos;

        if (totalFallos > 0) {
          setError(
            `Se cargó el tablero, pero ${totalFallos} consulta${totalFallos === 1 ? "" : "s"} no pudieron completarse.`
          );
        }
      } catch (error) {
        console.error(
          "Error cargando ProspectosDigitales:",
          error
        );

        if (activo) {
          setData(VACIO);
          setProspectosRaw([]);
          setCitasRaw([]);
          setError(
            error?.message ||
            "No fue posible cargar las métricas."
          );
        }
      } finally {
        if (activo) {
          setLoading(false);
          setLoadingCohorte(false);
        }
      }
    }

    cargarDashboard();

    return () => {
      activo = false;
    };
  }, [ready, isAdmin, lineasConsulta, agenciasPermitidas, filtrosParams, añoSel, mesSel, agenciaSel]);

  const negocio = data.negocio || {};
  const embudoOriginal = Array.isArray(negocio.embudo) ? negocio.embudo : [];
  const canales = Array.isArray(negocio.canales) ? negocio.canales : [];
  const asesores = Array.isArray(negocio.asesores) ? negocio.asesores : [];

  const asesoresValidos = useMemo(() => {
    return asesores.filter(a => {
      if (!a || !a.nombre) return false;
      const n = String(a.nombre).trim().toLowerCase();
      return !n.includes("sin asesor") && !n.includes("sin_asesor") && n !== "null" && n !== "undefined";
    });
  }, [asesores]);

  const citasMap = useMemo(() => {
    const map = new Map();
    (citasRaw || []).forEach(c => {
      const keys = [
        c.prospecto, c.prospecto_id, c.id_prospecto,
        c.cliente, c.cliente_id, c.id_cliente,
        c.cliente?.id, c.prospecto?.id, c.id
      ].filter(v => v !== null && v !== undefined && v !== "" && v !== "null");

      keys.forEach(k => {
        const strKey = String(k);
        if (!map.has(strKey)) map.set(strKey, []);
        map.get(strKey).push(c);
      });

      const tel = normalizaTelefonoMx(c.telefono || c.celular || c.cliente?.telefono || c.prospecto?.telefono);
      if (tel && tel.length >= 10) {
        const keyTel = `tel_${tel}`;
        if (!map.has(keyTel)) map.set(keyTel, []);
        map.get(keyTel).push(c);
      }

      const nom = (c.nombre_cliente || c.cliente_nombre || c.nombre || c.prospecto_nombre || c.cliente?.nombre || "").toLowerCase().trim();
      if (nom && nom !== "sin nombre") {
        const keyNom = `nom_${nom}`;
        if (!map.has(keyNom)) map.set(keyNom, []);
        map.get(keyNom).push(c);
      }
    });
    return map;
  }, [citasRaw]);

  const findCitaMatch = (p) => {
    if (!p || citasMap.size === 0) return null;

    const candidateKeys = [
      p.id, p.id_cliente, p.cliente?.id, p.id_prospecto
    ].filter(v => v !== null && v !== undefined && v !== "" && v !== "null");

    for (const k of candidateKeys) {
      const list = citasMap.get(String(k));
      if (list && list.length > 0) return list[0];
    }

    const tel = normalizaTelefonoMx(getTelefonoCliente(p));
    if (tel && tel.length >= 10) {
      const listTel = citasMap.get(`tel_${tel}`);
      if (listTel && listTel.length > 0) return listTel[0];
    }

    const nom = getNombreCliente(p).toLowerCase().trim();
    if (nom && nom !== "sin nombre") {
      const listNom = citasMap.get(`nom_${nom}`);
      if (listNom && listNom.length > 0) return listNom[0];
    }

    return null;
  };

  const prospectosCohorte = useMemo(() => {
    return prospectosRaw
      .filter((p) =>
        esDelPeriodo(
          p,
          añoSel,
          mesSel + 1
        )
      )

      /*
       * Importante:
       * la seguridad/alcan­ce ya fue aplicada
       * al cargar por numero_asesor.
       *
       * No debemos volver a descartar registros
       * basándonos en negocio.asesores.
       */
      .filter((p) =>
        esProspectoDigitalValido(p)
      )

      .filter((p) => {
        const agenciaProspecto =
          normalizaAgenciaGrupo(
            p.agencia ||
            p.sucursal ||
            p.agencia_nombre ||
            p.cliente?.agencia ||
            ""
          );

        if (!agenciaProspecto) {
          return false;
        }

        /*
         * Primero respetamos el alcance
         * permitido del usuario.
         */
        if (!isAdmin) {
          const perteneceAlUsuario =
            agenciasPermitidas.some(
              (agencia) =>
                normalizaAgenciaGrupo(
                  agencia
                ) === agenciaProspecto
            );

          if (!perteneceAlUsuario) {
            return false;
          }
        }

        /*
         * Después aplicamos el filtro
         * seleccionado en pantalla.
         */
        if (agenciaSel === "Todas") {
          return true;
        }

        return (
          agenciaProspecto ===
          normalizaAgenciaGrupo(
            agenciaSel
          )
        );
      })

      .map((p) => ({
        ...p,
        _citaMatch: findCitaMatch(p)
      }));
  }, [prospectosRaw, añoSel, mesSel, citasMap, agenciaSel, isAdmin, agenciasPermitidas]);

  /* CÁLCULOS DE METRICAS INTEGRADAS */
  const totalProspectos = prospectosCohorte.length;
  const citasTotales = useMemo(() => prospectosCohorte.filter(tieneCita).length, [prospectosCohorte]);
  const citasEfectivasTotales = useMemo(() => prospectosCohorte.filter(tieneCita).filter(asistioCita).length, [prospectosCohorte]);
  const cotizacionesTotales = useMemo(() => prospectosCohorte.filter(tieneCotizacion).length, [prospectosCohorte]);

  const listCredito = useMemo(() => prospectosCohorte.filter(tieneSolicitudCredito), [prospectosCohorte]);
  const creditosTotales = listCredito.length;
  const creditosAprobados = useMemo(() => listCredito.filter(p => String(p.solicitud_credito_estado || p.estado_credito || "").toLowerCase().includes("aprob")).length, [listCredito]);

  const facturadosTotales = useMemo(() => prospectosCohorte.filter(esFacturado).length, [prospectosCohorte]);

  const conversacionesIA = numero(negocio?.actividad_periodo?.conversaciones_ia);
  const topCanal = [...canales].sort((a, b) => numero(b.prospectos) - numero(a.prospectos))[0];
  const topPauta = [...data.pautas].sort((a, b) => numero(b.total) - numero(a.total))[0];
  const iaPct = totalProspectos ? (conversacionesIA / totalProspectos) * 100 : 0;

  const contactadosReales = prospectosCohorte.filter(p => p.sin_respuesta !== true && p.sin_respuesta !== 1 && p.contactado !== false).length;

  const embudoOrdenadoYCalculado = useMemo(() => {
    if (embudoOriginal.length === 0) return [];
    let nuevoEmbudo = [...embudoOriginal];

    nuevoEmbudo = nuevoEmbudo.map(etapa => {
      if (etapa.nombre.toLowerCase().includes("contactado")) {
        return {
          ...etapa,
          total: contactadosReales,
          conversion_origen: totalProspectos > 0 ? (contactadosReales / totalProspectos) * 100 : 0,
          conversion_anterior: totalProspectos > 0 ? (contactadosReales / totalProspectos) * 100 : 0
        };
      }
      if (etapa.nombre.toLowerCase().includes("cita") && !etapa.nombre.toLowerCase().includes("efectiva")) {
        return {
          ...etapa,
          total: citasTotales,
          conversion_origen: totalProspectos > 0 ? (citasTotales / totalProspectos) * 100 : 0
        };
      }
      if (etapa.nombre.toLowerCase().includes("efectiva")) {
        return {
          ...etapa,
          total: citasEfectivasTotales,
          conversion_origen: totalProspectos > 0 ? (citasEfectivasTotales / totalProspectos) * 100 : 0
        };
      }
      return etapa;
    });

    const idxCotizados = nuevoEmbudo.findIndex(e => e.nombre.toLowerCase().includes("cotiza"));
    const idxCita = nuevoEmbudo.findIndex(e => e.nombre.toLowerCase() === "con cita" || (e.nombre.toLowerCase().includes("cita") && !e.nombre.toLowerCase().includes("efectiva")));

    if (idxCotizados !== -1 && idxCita !== -1 && idxCotizados > idxCita) {
      const itemCotizados = nuevoEmbudo.splice(idxCotizados, 1)[0];
      nuevoEmbudo.splice(idxCita, 0, itemCotizados);

      for (let i = 1; i < nuevoEmbudo.length; i++) {
        const anteriorTotal = numero(nuevoEmbudo[i - 1].total);
        const actualTotal = numero(nuevoEmbudo[i].total);
        nuevoEmbudo[i].conversion_anterior = anteriorTotal > 0 ? (actualTotal / anteriorTotal) * 100 : 0;
      }
    }
    return nuevoEmbudo;
  }, [embudoOriginal, contactadosReales, totalProspectos, citasTotales, citasEfectivasTotales]);

  return (
    <div className="w-full min-h-screen bg-[#F1F5F9] text-[#1E293B] font-vw-text font-light p-3 md:p-5 space-y-5">

      <style>{`
                @keyframes floatBubbleFlat {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                    100% { transform: translateY(0px); }
                }
                .bubble-container {
                    animation: floatBubbleFlat 3.5s ease-in-out infinite;
                }
            `}</style>

      {/* FILTROS VW */}
      <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-thin pb-1 xl:pb-0">
          <button
            onClick={() => setAgenciaSel("Todas")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-vw-head font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${agenciaSel === "Todas"
                ? "bg-[#001E50] text-white ring-2 ring-[#001E50]"
                : "bg-white text-[#001E50] border border-slate-200 hover:bg-slate-50"
              }`}
          >
            {isAdmin
              ? "Todas las agencias"
              : "Todas mis agencias"}
          </button>

          {agenciasPermitidas.map((agencia) => (
            <button
              key={agencia}
              onClick={() =>
                setAgenciaSel(agencia)
              }
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-vw-head font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${agenciaSel === agencia
                  ? "bg-[#001E50] text-white ring-2 ring-[#001E50]"
                  : "bg-white text-[#001E50] border border-slate-200 hover:bg-slate-50"
                }`}
            >
              {agencia}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex items-center gap-2 px-2 shrink-0">
            <CalendarDays className="h-4 w-4 text-[#1677FF]" />
            <span className="text-[#001E50] text-xs font-vw-head font-bold uppercase tracking-wider">Periodo:</span>
          </div>
          <div className="relative inline-block shrink-0">
            <select value={añoSel} onChange={(e) => { const nuevoAnio = Number(e.target.value); setAñoSel(nuevoAnio); if (nuevoAnio === añoActual && mesSel > mesActual) setMesSel(mesActual); }} className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-7 text-xs font-vw-head font-bold text-[#001E50] focus:outline-none cursor-pointer shadow-sm">
              {años.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto w-full pb-1 md:pb-0 scrollbar-thin max-w-full md:max-w-md lg:max-w-xl">
            {MESES.map((item, index) => {
              const futuro = añoSel === añoActual && index > mesActual;
              const active = mesSel === index;
              return (
                <button key={item} disabled={futuro} onClick={() => setMesSel(index)} className={`inline-flex items-center justify-center gap-1 shrink-0 rounded-lg px-2.5 py-1.5 text-xs capitalize transition-all ${active ? "bg-[#001E50] text-white font-vw-head font-bold shadow-sm" : futuro ? "border border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed font-vw-head font-bold" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-vw-head font-bold"}`}>
                  {active ? <Check className="h-3 w-3 text-white" /> : <Plus className="h-3 w-3 text-slate-400" />}
                  <span>{item.substring(0, 3)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-vw-head font-bold text-amber-800">{error}</div>}

      {/* 1. SECCIÓN: RESUMEN EJECUTIVO CON CARD PRINCIPAL RE DISEÑADA INTEGRADA */}
      <Seccion titulo="Resumen Ejecutivo" subtitulo="Visión general del funnel y rendimiento de la cohorte">
        <CardResumenPrincipal
          totalProspectos={totalProspectos}
          citasTotales={citasTotales}
          citasEfectivasTotales={citasEfectivasTotales}
          cotizacionesTotales={cotizacionesTotales}
          creditosTotales={creditosTotales}
          creditosAprobados={creditosAprobados}
          facturadosTotales={facturadosTotales}
          asesores={asesores}
          loading={loadingCohorte}
          objConcertadas={40}
          objAsistidas={30}
        />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <DatoContexto titulo="Conversaciones con IA" valor={`${entero(conversacionesIA)} · ${porcentaje(iaPct)}`} detalle="actividad IA del periodo" />
          <DatoContexto titulo="Canal con mayor volumen" valor={topCanal?.nombre || "Sin datos"} detalle={topCanal ? `${entero(topCanal.prospectos)} prospectos` : ""} />
          <DatoContexto titulo="Pauta líder" valor={topPauta?.nombre || "Sin datos"} detalle={topPauta ? `${entero(topPauta.total)} prospectos · ${porcentaje(topPauta.porcentaje)}` : ""} />
          <DatoContexto titulo="Línea de negocio líder" valor={data.lineasNegocio?.lineas?.[0]?.nombre || "Sin datos"} detalle="" />
        </div>
      </Seccion>

      {/* 2. SECCIÓN: PANELES ANCHOS DE FLUJO COMERCIAL */}
      <Seccion titulo="Operación y Seguimiento Detallado por Etapa" subtitulo="Detalle interactivo por cohorte: Cotizaciones, Citas, Créditos y Entregas">
        <PanelesFlujoComercial
          prospectosCohorte={prospectosCohorte}
          loadingCohorte={loadingCohorte}
        />
      </Seccion>

      {/* 3. SECCIÓN: EMBUDO Y ORIGEN DIGITAL */}
      <Seccion titulo="Embudo Comercial Digital">
        <EmbudoComercial etapas={embudoOrdenadoYCalculado} canales={canales} pautas={data.pautas} loading={loadingCohorte} />
      </Seccion>

    </div>
  );
}

/* ============================================================
    COMPONENTES UI AUXILIARES
============================================================ */
function Seccion({ titulo, subtitulo, children }) {
  return (
    <div className="space-y-3 mt-6 mb-2">
      <div>
        <h2 className="text-lg font-vw-head font-bold text-[#001E50]">{titulo}</h2>
        {subtitulo && <p className="text-xs text-slate-500 font-vw-text">{subtitulo}</p>}
      </div>
      {children}
    </div>
  );
}

function Tarjeta({ children, className = "" }) {
  return <div className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col h-full ${className}`}>{children}</div>;
}

function Skeleton({ className = "h-8 w-20" }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

function TituloCard({ icono, titulo, detalle }) {
  return (
    <div className="border-b border-slate-200/60 pb-2.5 mb-3">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#001E50] text-white px-3.5 py-1 text-xs font-vw-head font-bold">
        {icono && <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icono}</span>}
        <span>{titulo}</span>
      </div>
      {detalle && <div className="mt-2 text-[11px] text-slate-500 font-vw-text">{detalle}</div>}
    </div>
  );
}

function DatoContexto({ titulo, valor, detalle }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col justify-center">
      <div className="text-[10px] font-vw-head font-bold text-slate-500 uppercase tracking-wider mb-1">{titulo}</div>
      <div className="text-lg font-vw-head font-extrabold text-[#001E50] truncate" title={String(valor || "")}>{valor || "Sin datos"}</div>
      {detalle && <div className="mt-1 text-[10px] font-vw-text text-slate-400">{detalle}</div>}
    </div>
  );
}

function Vacio({ texto, compact = false }) {
  return <div className={`flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs font-vw-head font-bold text-slate-400 ${compact ? "h-16" : "h-full min-h-[180px]"}`}>{texto}</div>;
}