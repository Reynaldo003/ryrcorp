// src/pages/Tableros/services/tablerosService.js

import { api } from "../../../lib/apiPruebas";
import { apiTraficoPiso } from "../../../lib/apiTraficoPiso";
import { apiInventario } from "../../../lib/apiInventario";
import { getVentasVNDashboard } from "../../../lib/apiVentasVN";
import { apiCitas } from "../../../lib/apiCitas";
import { apiPruebaManejo } from "../../../lib/apiPruebaManejo";
import { apiCredito } from "../../../lib/apiCredito";
import { apiEntregas } from "../../../lib/apiEntregas";
import { Globe, FileText, CreditCard, Car, HandCoins, CalendarDays, AlertCircle, BadgeDollarSign, Users } from "lucide-react";

const MODELOS_COMERCIALES = ["E-CRAFTER", "CRAFTER", "AMAROK", "TRANSPORTER", "CADDY"];
const ESTATUS_EXCLUIDOS = ["V", "O", "C", "D", "P", "T"];

function normalizarTexto(texto) {
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").toLowerCase().trim();
}

function coincideAgencia(agenciaEntidad, agenciaSeleccionada) {
    if (!agenciaSeleccionada) return true;
    const seleccion = normalizarTexto(agenciaSeleccionada).replace(/^vw\s+/i, "");
    if (!seleccion || seleccion === "todas" || seleccion.includes("todas las agencias")) return true;
    const entidad = normalizarTexto(agenciaEntidad).replace(/^vw\s+/i, "");
    return entidad.includes(seleccion) || seleccion.includes(entidad);
}

function normalizaTelefonoMx(tel) {
    const digits = String(tel || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("521") && digits.length === 13) return `52${digits.slice(3)}`;
    if (digits.length === 10) return `52${digits}`;
    if (digits.length === 12 && digits.startsWith("52")) return digits;
    return digits;
}

function normalizaAgenciaGrupo(value) {
    const texto = normalizarTexto(value);
    if (!texto) return "";
    if (texto.includes("cordoba")) return "VW Cordoba";
    if (texto.includes("orizaba")) return "VW Orizaba";
    if (texto.includes("poza rica")) return "VW Poza Rica";
    if (texto.includes("tuxtepec")) return "VW Tuxtepec";
    if (texto.includes("tuxpan")) return "VW Tuxpan";
    return String(value || "").trim();
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

function deduplicarRegistros(items = []) {
    const mapa = new Map();
    for (const item of items) {
        const key = item?.id ?? item?.id_cliente ?? item?.cliente?.id ?? normalizaTelefonoMx(item?.telefono || item?.cliente?.telefono);
        if (key !== null && key !== undefined && key !== "") mapa.set(String(key), item);
    }
    return Array.from(mapa.values());
}

async function listarProspectosDashboard(params = {}) {
    const registros = [];
    let page = 1;

    while (page <= 100) {
        const respuesta = await api.digitalesListProspectos({ ...params, page, page_size: 1000, limit: 1000 });
        registros.push(...extractArray(respuesta));
        if (Array.isArray(respuesta) || !respuesta?.next) break;
        page += 1;
    }

    return deduplicarRegistros(registros);
}

/* =========================
   PROSPECTOS DIGITALES
========================= */

function fechaProspecto(p) {
    return p?.creado ?? p?.cliente?.creado ?? p?.fecha_registro ?? p?.created_at ?? null;
}

function esDelRangoPD(p, anio, mesNum, esAnual) {
    const raw = fechaProspecto(p);
    if (!raw || raw === "null" || raw === "undefined") return false;

    try {
        const str = String(raw).trim();
        const d = new Date(str.includes("T") ? str : str.replace(" ", "T"));
        if (Number.isNaN(d.getTime()) || d.getFullYear() !== Number(anio)) return false;
        return esAnual || d.getMonth() + 1 === Number(mesNum);
    } catch {
        return false;
    }
}

function esProspectoDigitalValidoPD(p) {
    if (!p || p?.es_digital === false || p?.es_prospecto_digital === false) return false;

    const ad = p?.asesor_digital ?? p?.cliente?.asesor_digital;
    let nombre = "";

    if (typeof ad === "object" && ad !== null) {
        if (ad.id === null || ad.id === 0 || ad.id === "0") return false;
        nombre = String(ad.nombre || ad.first_name || ad.username || ad.name || "").trim();
    } else if (typeof ad === "string" || typeof ad === "number") {
        nombre = String(ad).trim();
    }

    if (!nombre) return false;

    const valor = nombre.toLowerCase();
    const invalidos = ["", "null", "undefined", "none", "false", "0", "s/a", "s/i", "ninguno", "sin asesor", "sin_asesor", "sin asesor asignado", "sin_asesor_asignado", "sin asignar", "sin_asignar", "sin asesor digital", "sin_asesor_digital"];

    return !(invalidos.includes(valor) || valor.includes("sin asesor") || valor.includes("sin_asesor") || valor.includes("sin asignar"));
}

function getNombreClientePD(p) {
    if (!p) return "Sin nombre";

    if (typeof p?.cliente === "object" && p.cliente !== null) {
        const nombre = p.cliente.nombre || p.cliente.first_name || "";
        const apellidos = p.cliente.apellidos || p.cliente.apellido || p.cliente.last_name || "";
        const full = `${nombre} ${apellidos}`.trim();
        if (full) return full;
        if (p.cliente.telefono) return p.cliente.telefono;
    }

    if (p?.cliente_nombre?.trim()) return p.cliente_nombre.trim();
    if (p?.nombre_completo?.trim()) return p.nombre_completo.trim();
    if (p?.nombre?.trim()) return `${p.nombre} ${p.apellidos || ""}`.trim();
    return `Cliente #${p?.id || p?.id_cliente || "s/n"}`;
}

function getTelefonoClientePD(p) {
    if (!p) return "";
    if (typeof p?.cliente === "object" && p.cliente !== null) {
        if (p.cliente.telefono) return p.cliente.telefono;
        if (p.cliente.celular) return p.cliente.celular;
    }
    return p?.telefono || p?.telefono_cliente || p?.celular || "";
}

function construirMapaCitasPD(citas = []) {
    const mapa = new Map();
    const add = (key, cita) => {
        if (!key) return;
        if (!mapa.has(key)) mapa.set(key, []);
        mapa.get(key).push(cita);
    };

    for (const cita of citas) {
        const ids = [cita?.id_prospecto, cita?.prospecto_id, cita?.id_cliente, cita?.cliente_id, cita?.cliente?.id].filter(v => v !== null && v !== undefined && v !== "");
        ids.forEach(id => add(String(id), cita));

        const tel = normalizaTelefonoMx(cita?.telefono || cita?.celular || cita?.cliente?.telefono || cita?.prospecto?.telefono);
        if (tel && tel.length >= 10) add(`tel_${tel}`, cita);

        const nombre = String(cita?.nombre_cliente || cita?.cliente_nombre || cita?.nombre || cita?.prospecto_nombre || cita?.cliente?.nombre || "").toLowerCase().trim();
        if (nombre && nombre !== "sin nombre") add(`nom_${nombre}`, cita);
    }

    return mapa;
}

function buscarCitaProspectoPD(p, citasMap) {
    if (!p || !citasMap?.size) return null;

    const ids = [p?.id, p?.id_cliente, p?.cliente?.id, p?.id_prospecto].filter(v => v !== null && v !== undefined && v !== "" && v !== "null");

    for (const id of ids) {
        const lista = citasMap.get(String(id));
        if (lista?.length) return lista[0];
    }

    const tel = normalizaTelefonoMx(getTelefonoClientePD(p));
    if (tel && tel.length >= 10) {
        const lista = citasMap.get(`tel_${tel}`);
        if (lista?.length) return lista[0];
    }

    const nombre = getNombreClientePD(p).toLowerCase().trim();
    if (nombre && nombre !== "sin nombre") {
        const lista = citasMap.get(`nom_${nombre}`);
        if (lista?.length) return lista[0];
    }

    return null;
}

function getTipoCitaPD(p) {
    if (!p) return "Sin Cita";

    if (p?._citaMatch) {
        const c = p._citaMatch;
        const tipo = c?.tipo_cita || c?.tipo_cita_nombre || c?.tipo || c?.canal_tipo || c?.canal;
        if (tipo && tipo !== "null" && tipo !== "undefined") return String(tipo).trim();
    }

    const fallback = p?.tipo_cita || p?.tipo_cita_nombre || p?.cita_tipo || (typeof p?.ultima_cita === "object" ? p.ultima_cita?.tipo_cita : null) || (typeof p?.ultima_cita_agendada === "object" ? p.ultima_cita_agendada?.tipo_cita : null) || p?.cliente?.tipo_cita;

    return fallback && fallback !== "null" && fallback !== "undefined" ? String(fallback).trim() : "Presencial / Piso";
}

function tieneCotizacionPD(p) {
    if (!p) return false;

    const idCot = String(p?.id_cotizacion || p?.cliente?.id_cotizacion || p?.cotizacion_id || p?.id_cotizacion_crm || "").trim();
    const tieneId = idCot !== "" && idCot !== "0" && idCot !== "null" && idCot !== "undefined";
    const tieneFlag = p?.con_cotizacion === true || p?.con_cotizacion === 1 || p?.tiene_cotizacion === true || p?.tiene_cotizaciones === true || Number(p?.cotizaciones || 0) > 0 || Number(p?.total_cotizaciones || 0) > 0;

    return tieneId || tieneFlag;
}

function tieneCitaPD(p) {
    if (!p) return false;

    const tipo = String(getTipoCitaPD(p)).toLowerCase().trim();
    if (tipo.includes("tradicional") || tipo.includes("piso") || tipo.includes("showroom")) return false;

    const u = p?.ultima_cita_agendada ?? p?.fecha_cita ?? p?.ultima_cita ?? p?.id_ultima_cita;
    const tieneRegistro = Boolean(p?._citaMatch || (u && u !== "null" && u !== "undefined" && u !== "0" && u !== 0 && u !== false));
    const estado = String(p?.estado || p?.estatus || "").toLowerCase();
    const tieneFlag = p?.con_cita === true || p?.con_cita === 1 || p?.tiene_cita === true || p?.tiene_cita === 1 || p?.asistencia === true || Number(p?.citas || 0) > 0 || Number(p?.total_citas || 0) > 0;

    return tieneRegistro || tieneFlag || estado.includes("cita");
}

function asistioCitaPD(p) {
    if (!p) return false;

    if (p?._citaMatch) {
        const c = p._citaMatch;
        const estado = String(c?.estatus || c?.estado || c?.estatus_asistencia || "").toLowerCase();

        if (c?.asistio === true || c?.asistio === 1 || c?.cita_efectiva === true || c?.asistencia === true || estado.includes("asisti") || estado.includes("efectiva")) return true;
    }

    const estado = String(p?.estado || p?.estatus || "").toLowerCase();

    return p?.asistio === true || p?.cita_efectiva === true || p?.asistencia === true || p?.asistio === 1 || p?.cita_efectiva === 1 || estado.includes("efectiva") || estado.includes("asisti");
}

function tieneSolicitudCreditoPD(p) {
    if (!p) return false;

    const folio = p?.folio_solicitud_credito ?? p?.cliente?.folio_solicitud_credito ?? p?.folio_credito ?? p?.folio_solicitud ?? p?.solicitud_credito_folio ?? p?.solicitud_credito_estado ?? p?.estado_credito;
    if (folio === null || folio === undefined) return false;

    const valor = String(folio).trim().toLowerCase();
    return !["", "null", "undefined", "0", "false", "s/i", "s/f"].includes(valor);
}

function esFacturadoPD(p) {
    if (!p) return false;

    const estado = String(p?.estado || p?.estatus || "").toLowerCase();

    return p?.facturado === true || p?.facturado === 1 || p?.con_factura === true || Number(p?.facturados || 0) > 0 || Number(p?.total_facturados || 0) > 0 || estado.includes("facturad");
}

function nombreAsesorPD(p) {
    const ad = p?.asesor_digital ?? p?.cliente?.asesor_digital;

    if (typeof ad === "object" && ad !== null) {
        return String(ad.nombre || ad.first_name || ad.username || ad.name || "Sin asesor").trim();
    }

    return String(ad || p?.asesor_digital_nombre || "Sin asesor").trim();
}

/* =========================
   CITAS
========================= */

function normalizarAgenciaCita(value) {
    const t = normalizarTexto(value);
    if (t.includes("cordoba")) return "VW Cordoba";
    if (t.includes("orizaba")) return "VW Orizaba";
    if (t.includes("poza rica")) return "VW Poza Rica";
    if (t.includes("tuxpan")) return "VW Tuxpan";
    if (t.includes("tuxtepec")) return "VW Tuxtepec";
    return String(value || "").trim();
}

function deduplicarCitasPorCliente(lista = []) {
    const mapa = new Map();

    for (const cita of lista) {
        const nombre = String(cita?.cliente?.nombre || cita?.nombre || "").trim();
        const key = nombre ? nombre.toLowerCase() : `id_${cita?.id}`;

        if (!mapa.has(key)) mapa.set(key, []);
        mapa.get(key).push(cita);
    }

    const resultado = [];

    mapa.forEach(registros => {
        if (registros.length === 1) {
            resultado.push(registros[0]);
            return;
        }

        const asistidas = registros.filter(r => !!r.asistencia);
        const listaElegida = asistidas.length > 0 ? asistidas : registros;

        listaElegida.sort(
            (a, b) =>
                new Date(b.fecha_hora_cita || b.created_at) -
                new Date(a.fecha_hora_cita || a.created_at)
        );

        resultado.push(listaElegida[0]);
    });

    return resultado;
}

function normalizarTraficoPisoTablero(lista = []) {
    return lista.map(item => {
        const agenciaOriginal = String(item?.agencia || item?.dealer || "").trim();
        const agencia = normalizaAgenciaGrupo(agenciaOriginal);
        const fecha = item?.creado_en || item?.fecha_hora || item?.fecha;

        return {
            ...item,
            agencia,
            fecha_hora_cita: fecha,
            nombre: item?.nombre_prospecto || item?.nombre || "—",
            asesor_ventas: item?.asesor_ventas || item?.asesor_piso || item?.asesor || "Sin asignar",
            fuente_prospeccion: item?.motivo_ingreso || item?.motivo_ingreso_piso || item?.fuente_prospeccion || item?.fuente || "Visita Espontánea",
            tipo_venta: item?.tipo_venta || (item?.deja_auto_cuenta ? "Usados" : "Nuevos"),
            modelo_interes: item?.auto_suenos || item?.modelo_interes || item?.modelo || "No especificado",
            motivo_compra: item?.motivo_compra || item?.uso_vehiculo || "Uso Personal / Familiar",
            forma_capitalizacion: item?.forma_capitalizacion || item?.forma_pago || item?.tipo_financiamiento || "Crédito Concesionario",
            perfil_profesional: item?.perfil_profesional || item?.ocupacion || item?.giro_negocio || "Empleado / Salariado",
        };
    });
}

/* =========================
   PRUEBAS DE MANEJO
========================= */

function extraerNombreModeloPM(item) {
    const val = v => {
        if (!v) return null;
        if (typeof v === "string" && v.trim()) return v.trim();
        if (typeof v === "object") return v.nombre || v.modelo || v.descripcion || v.name || v.titulo || null;
        return String(v);
    };

    return (
        val(item?.auto_interes) ||
        val(item?.auto_interes_nombre) ||
        val(item?.modelo_interes) ||
        val(item?.modelo_interes_nombre) ||
        val(item?.modelo_demostrado) ||
        val(item?.modelo_demostrado_nombre) ||
        val(item?.auto_demostrado) ||
        val(item?.auto_suenos) ||
        val(item?.auto_suenos_nombre) ||
        val(item?.vehiculo) ||
        val(item?.vehiculo_nombre) ||
        val(item?.modelo) ||
        val(item?.modelo_nombre) ||
        val(item?.auto) ||
        val(item?.auto_nombre) ||
        val(item?.unidad) ||
        val(item?.carro) ||
        val(item?.modelo_info) ||
        val(item?.vehiculo_info) ||
        val(item?.auto_info) ||
        "No especificado"
    );
}

function normalizarPruebasManejoTablero(lista = []) {
    return lista.map(item => ({
        ...item,
        agencia: normalizaAgenciaGrupo(item?.agencia || item?.dealer || ""),
        fecha_hora_cita: item?.fecha_hora_cita || item?.creado_en || item?.fecha_hora || item?.fecha,
        nombre: item?.nombre_prospecto || item?.nombre || item?.cliente || "—",
        asesor_ventas: item?.asesor_ventas || item?.asesor || item?.asesor_piso || "Sin asignar",
        fuente_prospeccion: item?.motivo_ingreso || item?.motivo_solicitud || item?.fuente_prospeccion || item?.fuente || "Prueba de Manejo",
        tipo_venta: item?.tipo_venta || (item?.deja_auto_cuenta ? "Usados" : "Nuevos"),
        modelo_interes: extraerNombreModeloPM(item),
        comentarios: item?.comentarios || item?.observaciones || "—",
    }));
}

/* =========================
   SOLICITUDES DE CRÉDITO
========================= */

function extraerTextoCredito(val) {
    if (!val) return null;
    if (typeof val === "string" && val.trim()) return val.trim();
    if (typeof val === "object") return val.nombre || val.nombre_completo || val.razon_social || val.descripcion || val.titulo || null;
    return String(val);
}

function normalizarSolicitudesCreditoTablero(lista = []) {
    return lista.map(item => ({
        ...item,
        agencia: normalizaAgenciaGrupo(item?.agencia || "") || "Sin Agencia",
        fecha_hora_cita: item?.creado || item?.fecha_respuesta || item?.fecha_hora_cita || item?.fecha,
        nombre: extraerTextoCredito(item?.cliente) || item?.cliente_nombre || item?.nombre || "—",
        asesor_ventas: item?.asesor_ventas || "Sin asignar",
        tipo_venta: item?.tipo_venta || "Nuevos",
        estatus_solicitud: item?.estado_financiamiento || "En Proceso",
        financiera: item?.producto_financiero || "VW Financial Services",
        tipo_credito: item?.plazo_meses ? `${item.plazo_meses} Meses` : "Crédito Tradicional",
        monto_credito: item?.monto_financiero || 0,
        auto_interes: item?.auto_interes || "No especificado",
        canal_origen: item?.canal_origen || "Concesionario / Piso",
        comentarios: item?.comentarios || "—",
    }));
}

/* =========================
   GESTIÓN COMERCIAL -> PROSPECTOS
========================= */

function numeroProspecto(v) {
    if (v === null || v === undefined || v === "") return 0;
    const n = Number(String(v).replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : 0;
}

function tienePerfilComercialGC(r) {
    return Boolean(
        numeroProspecto(r?.enganche_monto) ||
        numeroProspecto(r?.presupuesto_mensual) ||
        r?.buro_estado ||
        r?.forma_pago ||
        r?.tipo_cliente ||
        r?.uso_vehiculo ||
        r?.plazo_compra ||
        r?.comprobacion_ingresos
    );
}

function fechaProspectoGC(p) {
    return (
        p?.creado ||
        p?.created_at ||
        p?.fecha_creacion ||
        p?.creado_en ||
        p?.fecha_reclamacion ||
        p?.primer_mensaje_cliente ||
        p?.primer_contacto_at ||
        p?.ultimo_contacto_asesor ||
        p?.ultimo_contacto_at ||
        p?.resumen_actualizado_at ||
        null
    );
}

function normalizarProspectoGC(p) {
    return {
        ...p,
        agencia: p?.agencia || "",
        linea: p?.business || "",
        estado: p?.estado || "",
        asesor_digital: p?.asesor_digital || "",
        origen: p?.canal_contacto || "",
        cliente_interes: p?.auto_interes || "",
        creado: fechaProspectoGC(p),
        primer_contacto_at: p?.primer_contacto_at || null,
        cotizacion_pendiente: Boolean(p?.cotizacion_pendiente),
        requiere_asesor: Boolean(p?.requiere_asesor),
        enganche_monto: p?.enganche_monto || "",
        presupuesto_mensual: p?.presupuesto_mensual || "",
        buro_estado: p?.buro_estado || "",
        forma_pago: p?.forma_pago || "",
        tipo_cliente: p?.tipo_cliente || "",
        uso_vehiculo: p?.uso_vehiculo || "",
        plazo_compra: p?.plazo_compra || "",
        comprobacion_ingresos: p?.comprobacion_ingresos || "",
    };
}

/* =========================
   RENDIMIENTO DIGITAL
========================= */

function fechaISOOffset(dias = 0) {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    return d.toISOString().slice(0, 10);
}

function pctRD(a, b) {
    return Number(b) > 0 ? Math.round((Number(a || 0) / Number(b)) * 1000) / 10 : 0;
}

function normalizarMetricasRD(item = {}) {
    const intentos = Number(item.intentos_contacto ?? item.mensajes ?? 0);
    const fallidos = Number(item.fallidos || 0);
    const contactosValidos = Number(item.contactos_validos ?? Math.max(intentos - fallidos, 0));
    const respuestas = Number(item.respuestas || 0);
    const positivas = Number(item.positivas ?? item.respuestas_positivas ?? 0);
    const sinRespuesta = Number(item.sin_respuesta || 0);

    return {
        ...item,
        mensajes: intentos,
        intentos_contacto: intentos,
        contactos_validos: contactosValidos,
        respuestas,
        positivas,
        sin_respuesta: sinRespuesta,
        fallidos,
        clientes: Number(item.clientes || 0),
        acciones: Number(item.acciones || 0),
        tasa_respuesta_cliente: Number(item.tasa_respuesta_cliente ?? pctRD(respuestas, contactosValidos)),
        tasa_interes_respuestas: Number(item.tasa_interes_respuestas ?? pctRD(positivas, respuestas)),
    };
}

function sumarResumenesRD(items = []) {
    const total = items.reduce((acc, item) => {
        const m = normalizarMetricasRD(item);

        acc.clientes += m.clientes;
        acc.acciones += m.acciones;
        acc.intentos_contacto += m.intentos_contacto;
        acc.contactos_validos += m.contactos_validos;
        acc.respuestas += m.respuestas;
        acc.positivas += m.positivas;
        acc.sin_respuesta += m.sin_respuesta;
        acc.fallidos += m.fallidos;

        return acc;
    }, {
        clientes: 0,
        acciones: 0,
        intentos_contacto: 0,
        contactos_validos: 0,
        respuestas: 0,
        positivas: 0,
        sin_respuesta: 0,
        fallidos: 0,
    });

    total.tasa_respuesta_cliente = pctRD(total.respuestas, total.contactos_validos);
    total.tasa_interes_respuestas = pctRD(total.positivas, total.respuestas);

    return total;
}

function sumarActividadRD(respuestas = []) {
    const map = new Map();

    respuestas.forEach(res => {
        (res?.actividad_diaria || []).forEach(item => {
            const fecha = item.fecha;
            if (!fecha) return;

            if (!map.has(fecha)) {
                map.set(fecha, { fecha, mensajes: 0, respuestas: 0, sin_respuesta: 0 });
            }

            const fila = map.get(fecha);
            fila.mensajes += Number(item.mensajes || 0);
            fila.respuestas += Number(item.respuestas || 0);
            fila.sin_respuesta += Number(item.sin_respuesta || 0);
        });
    });

    return Array.from(map.values()).sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
}

async function listarTraficoPisoCompleto(params = {}) {
    const registros = [];
    let page = 1;

    while (page <= 100) {
        const res = await apiTraficoPiso.list({
            ...params,
            page,
            page_size: 200,
        });

        if (Array.isArray(res)) {
            registros.push(...res);
            break;
        }

        const items = Array.isArray(res?.results) ? res.results : [];
        registros.push(...items);

        if (!res?.next || items.length === 0) break;
        page++;
    }

    return registros;
}

/* =========================
   ENTREGAS
========================= */

function esEntregaActiva(value) {
    if (value === true || value === 1) return true;
    return ["si", "sí", "true", "1", "yes", "entregada", "reportada"]
        .includes(String(value ?? "").trim().toLowerCase());
}

function tipoVentaEntrega(value) {
    const v = String(value || "").trim().toLowerCase();

    if (["nuevo", "nuevos"].includes(v)) return "Nuevo";
    if (["usado", "usados", "seminuevo", "seminuevos"].includes(v)) return "Usado";
    if (["comercial", "comerciales"].includes(v)) return "Comercial";

    return "Sin capturar";
}

/* =========================
   CAMPAÑAS META
========================= */

const META_API_BASE = (
    import.meta.env.VITE_API_URL ||
    "https://crm.grupoautomotrizryr.com"
).replace(/\/$/, "");

const META_ENDPOINT_TABLEROS =
    `${META_API_BASE}/campanas-meta/api/campanas-meta`;

function numeroMeta(valor) {
    const n = Number(valor ?? 0);
    return Number.isFinite(n) ? n : 0;
}

function decimalMeta(valor) {
    const n = parseFloat(valor ?? 0);
    return Number.isFinite(n) ? n : 0;
}

function normalizarCanalMeta(nombreCampana) {
    const nombre = normalizarTexto(nombreCampana);

    if (/\b(comercial|comerciales)\b/.test(nombre)) return "Comerciales";
    if (/\b(seminuevo|seminuevos|semi nuevos|usado|usados)\b/.test(nombre)) return "Usados";
    if (/\b(postventa|postventas)\b/.test(nombre)) return "PostVenta";

    return "Nuevos";
}

function normalizarCampanaMeta(c = {}) {
    return {
        ...c,
        id_campana: String(c.id_campana ?? ""),
        nombre_campana: c.nombre_campana || "Sin nombre",
        sucursal: c.sucursal || "Sin dealer",
        estado_campana: c.estado_campana || "Sin estado",
        canal: normalizarCanalMeta(c.nombre_campana),
        alcance: numeroMeta(c.alcance),
        impresiones: numeroMeta(c.impresiones),
        importe_gastado: decimalMeta(c.importe_gastado),
        total_resultados: numeroMeta(c.total_resultados),
        messaging_first_reply: numeroMeta(c.messaging_first_reply),
        inicio_campana: c.inicio_campana || null,
        fin_campana: c.fin_campana || null,
        inicio_informe: c.inicio_informe || null,
        fin_informe: c.fin_informe || null,
    };
}

const GRUPOS_META = {
    "VW Córdoba": ["Cordoba", "Comerciales Cordoba", "Seminuevos Cordoba"],
    "VW Orizaba": ["Orizaba", "Comerciales Orizaba", "Seminuevos Orizaba"],
    "VW Poza Rica": ["Poza Rica"],
    "VW Tuxtepec": ["Tuxtepec", "Seminuevos Tuxtepec"],
    "VW Tuxpan": ["Tuxpan"],
};

async function cargarCampanasMetaTablero({ anio, mes, agencia }) {
    const params = new URLSearchParams();

    if (anio) params.set("anio", String(anio));
    if (mes) params.set("mes", String(mes));

    // Para grupos por ciudad cargamos todas y filtramos después,
    // igual que el módulo original.
    params.set("ordering", "-inicio_informe");

    const url =
        `${META_ENDPOINT_TABLEROS}/ligero/` +
        `${params.toString() ? `?${params.toString()}` : ""}`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Campañas Meta no disponible (${res.status})`);
    }

    const json = await res.json();

    let lista = Array.isArray(json)
        ? json
        : Array.isArray(json?.results)
            ? json.results
            : [];

    lista = lista.map(normalizarCampanaMeta);

    if (agencia) {
        const permitidas = GRUPOS_META[agencia] || [agencia];

        lista = lista.filter(c =>
            permitidas.some(nombre =>
                normalizarTexto(c.sucursal) === normalizarTexto(nombre)
            )
        );
    }

    return lista;
}

/* =========================
   SERVICIO PRINCIPAL
========================= */

export async function obtenerDatosSubmodulo(moduloId, submoduloId, filtros = {}) {
    const anio = filtros.anio || "2026";
    const esAnual = !filtros.meses || filtros.meses.length === 0 || filtros.meses.includes("anual") || filtros.meses.length === 12;
    const mesNum = esAnual ? null : Number(filtros.meses[0]);
    const pad = n => String(n).padStart(2, "0");

    const mesStart = esAnual ? `${anio}-01-01` : `${anio}-${pad(mesNum)}-01`;
    const mesEnd = esAnual ? `${anio}-12-31` : `${anio}-${pad(mesNum)}-${pad(new Date(Number(anio), mesNum, 0).getDate())}`;

    const esTodas = !filtros.agencia || filtros.agencia === "Todas las agencias" || filtros.agencia === "Todas";
    const agenciaSeleccionada = esTodas ? "" : filtros.agencia;
    const agenciaLimpia = agenciaSeleccionada ? agenciaSeleccionada.replace(/^VW\s+/i, "").trim() : "";

    /* =========================
       PROSPECTOS DIGITALES
    ========================= */

    if (
        moduloId === "gestion_negocio" &&
        submoduloId === "prospectos_digitales"
    ) {
        const filtrosProspectos = {
            anio,
            creado__gte: mesStart,
            creado__lte: `${mesEnd} 23:59:59`,
            fecha_registro_desde: mesStart,
            fecha_registro_hasta: mesEnd,
            fecha_desde: mesStart,
            fecha_hasta: mesEnd,
            created_at__gte: mesStart,
            created_at__lte: `${mesEnd} 23:59:59`,
            asesor_digital__isnull: "false",
            con_asesor_digital: 1,
            todos: 1,
            ligero: 1,
        };

        if (!esAnual) filtrosProspectos.mes = mesNum;

        if (agenciaSeleccionada) {
            filtrosProspectos.agencia = agenciaSeleccionada;
            filtrosProspectos.agencia_nombre = agenciaSeleccionada;
            filtrosProspectos.sucursal = agenciaSeleccionada;
        }

        const [prospectosRaw, citasRaw] = await Promise.all([
            listarProspectosDashboard(filtrosProspectos),
            apiCitas.list({
                fecha_desde: mesStart,
                fecha_hasta: mesEnd,
                ...(agenciaSeleccionada ? { agencia: agenciaSeleccionada } : {}),
            }),
        ]);

        const citasMap = construirMapaCitasPD(Array.isArray(citasRaw) ? citasRaw : extractArray(citasRaw));

        const prospectosCohorte = prospectosRaw
            .filter(p => esDelRangoPD(p, anio, mesNum, esAnual))
            .filter(esProspectoDigitalValidoPD)
            .filter(p => {
                const agenciaProspecto = normalizaAgenciaGrupo(p?.agencia || p?.sucursal || p?.agencia_nombre || p?.cliente?.agencia || "");
                if (!agenciaProspecto) return false;
                return !agenciaSeleccionada || agenciaProspecto === normalizaAgenciaGrupo(agenciaSeleccionada);
            })
            .map(p => ({ ...p, _citaMatch: buscarCitaProspectoPD(p, citasMap) }));

        const totalProspectos = prospectosCohorte.length;
        const cotizaciones = prospectosCohorte.filter(tieneCotizacionPD).length;
        const prospectosConCita = prospectosCohorte.filter(tieneCitaPD);
        const citas = prospectosConCita.length;
        const efectivas = prospectosConCita.filter(asistioCitaPD).length;
        const creditos = prospectosCohorte.filter(tieneSolicitudCreditoPD).length;
        const facturados = prospectosCohorte.filter(esFacturadoPD).length;
        const contactados = prospectosCohorte.filter(p => p?.sin_respuesta !== true && p?.sin_respuesta !== 1 && p?.contactado !== false).length;

        const pct = valor => totalProspectos > 0 ? Math.round((valor / totalProspectos) * 1000) / 10 : 0;
        const tasaAsistencia = citas > 0 ? Math.round((efectivas / citas) * 1000) / 10 : 0;

        const asesoresMap = new Map();

        for (const p of prospectosCohorte) {
            const name = nombreAsesorPD(p) || "Sin asesor";

            if (!asesoresMap.has(name)) {
                asesoresMap.set(name, { name, cantidad: 0, cotizaciones: 0, citas: 0, efectivas: 0, creditos: 0, facturados: 0 });
            }

            const item = asesoresMap.get(name);
            item.cantidad++;
            if (tieneCotizacionPD(p)) item.cotizaciones++;
            if (tieneCitaPD(p)) item.citas++;
            if (tieneCitaPD(p) && asistioCitaPD(p)) item.efectivas++;
            if (tieneSolicitudCreditoPD(p)) item.creditos++;
            if (esFacturadoPD(p)) item.facturados++;
        }

        const porAsesor = Array.from(asesoresMap.values())
            .filter(a => {
                const n = normalizarTexto(a.name);
                return n && !n.includes("sin asesor") && n !== "null";
            })
            .sort((a, b) => b.cotizaciones - a.cotizaciones || b.facturados - a.facturados || b.cantidad - a.cantidad)
            .slice(0, 8);

        const origenMap = new Map();

        for (const p of prospectosCohorte) {
            const name = String(p?.canal_contacto || p?.origen || p?.canal || "Sin clasificar").trim() || "Sin clasificar";
            origenMap.set(name, (origenMap.get(name) || 0) + 1);
        }

        const porOrigen = Array.from(origenMap.entries())
            .map(([name, cantidad]) => ({ name, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 6);

        return {
            tipo: "prospectos_digitales",

            kpis: [
                { label: "Prospectos", valor: `${totalProspectos.toLocaleString("es-MX")} uds`, sub: `${contactados.toLocaleString("es-MX")} contactados`, icon: Globe },
                { label: "Cotizados", valor: cotizaciones.toLocaleString("es-MX"), sub: `${pct(cotizaciones)}% del embudo`, icon: FileText },
                { label: "Citas Agendadas", valor: citas.toLocaleString("es-MX"), sub: `${efectivas} asistidas (${tasaAsistencia}%)`, icon: CalendarDays },
                { label: "Facturados", valor: facturados.toLocaleString("es-MX"), sub: `${pct(facturados)}% cierre`, icon: Car },
            ],

            etapas: [
                { etapa: "Prospectos Digitales", cantidad: totalProspectos, porcentaje: 100 },
                { etapa: "Cotizados", cantidad: cotizaciones, porcentaje: pct(cotizaciones) },
                { etapa: "Citas Agendadas", cantidad: citas, porcentaje: pct(citas) },
                { etapa: "Asistencias Efectivas", cantidad: efectivas, porcentaje: pct(efectivas) },
                { etapa: "Solicitudes de Crédito", cantidad: creditos, porcentaje: pct(creditos) },
                { etapa: "Facturados", cantidad: facturados, porcentaje: pct(facturados) },
            ],

            dimensiones: { porAsesor, porOrigen },
            totalInicial: totalProspectos,
            cierreFinal: facturados,
            debug: { prospectos: totalProspectos, contactados, cotizaciones, citas, efectivas, creditos, facturados },
        };
    }

    /* =========================
    CITAS
    ========================= */

    if (moduloId === "gestion_negocio" && submoduloId === "citas") {
        const citasRaw = await apiCitas.list({
            fecha_desde: `${anio}-01-01`,
            fecha_hasta: `${anio}-12-31`,
        });

        const lista = (Array.isArray(citasRaw) ? citasRaw : extractArray(citasRaw))
            .map(c => ({ ...c, agencia: normalizarAgenciaCita(c?.agencia || c?.dealer) }))
            .filter(c => {
                if (!c?.fecha_hora_cita) return false;

                const fecha = new Date(c.fecha_hora_cita);

                if (Number.isNaN(fecha.getTime())) return false;
                if (fecha.getFullYear() !== Number(anio)) return false;
                if (!esAnual && fecha.getMonth() + 1 !== mesNum) return false;

                if (agenciaSeleccionada) {
                    return normalizarAgenciaCita(c.agencia) === normalizarAgenciaCita(agenciaSeleccionada);
                }

                return true;
            });

        const citas = deduplicarCitasPorCliente(lista);

        const concertadas = citas.length;
        const asistidas = citas.filter(c => !!c.asistencia).length;
        const noShow = concertadas - asistidas;

        const digitales = citas.filter(c => String(c?.tipo_cita || "").toLowerCase().trim() === "digital");
        const tradicionales = citas.filter(c => String(c?.tipo_cita || "").toLowerCase().trim() !== "digital");

        const digitalesAsistidas = digitales.filter(c => !!c.asistencia).length;
        const tradicionalesAsistidas = tradicionales.filter(c => !!c.asistencia).length;

        const efectividad = concertadas ? Number(((asistidas / concertadas) * 100).toFixed(1)) : 0;
        const pctNoShow = concertadas ? Number(((noShow / concertadas) * 100).toFixed(1)) : 0;
        const mixDigital = concertadas ? Number(((digitales.length / concertadas) * 100).toFixed(1)) : 0;
        const mixTradicional = concertadas ? Number(((tradicionales.length / concertadas) * 100).toFixed(1)) : 0;

        const asesorMap = {};
        const origenMap = {};

        citas.forEach(c => {
            const asesor = c?.asesor_digital || c?.asesor_piso || "Sin asignar";
            const fuente = c?.fuente_prospeccion || c?.fuente || "Concesionario";

            if (!asesorMap[asesor]) asesorMap[asesor] = { name: asesor, cantidad: 0, asistidas: 0, noShow: 0 };
            asesorMap[asesor].cantidad++;
            c.asistencia ? asesorMap[asesor].asistidas++ : asesorMap[asesor].noShow++;

            if (!origenMap[fuente]) origenMap[fuente] = { name: fuente, cantidad: 0, asistidas: 0, noShow: 0 };
            origenMap[fuente].cantidad++;
            c.asistencia ? origenMap[fuente].asistidas++ : origenMap[fuente].noShow++;
        });

        return {
            tipo: "citas",

            kpis: [
                { label: "Concertadas", valor: concertadas.toLocaleString("es-MX"), sub: "Clientes únicos", icon: CalendarDays },
                { label: "Asistidas", valor: asistidas.toLocaleString("es-MX"), sub: `${efectividad}% efectividad`, icon: Users },
                { label: "No-Show", valor: noShow.toLocaleString("es-MX"), sub: `${pctNoShow}% del total`, icon: AlertCircle },
                { label: "Mix Digital", valor: `${mixDigital}%`, sub: `${digitales.length} digitales`, icon: Globe },
            ],

            dimensiones: {
                mixCanal: [
                    { name: "Digital", cantidad: digitales.length, asistidas: digitalesAsistidas, porcentaje: mixDigital },
                    { name: "Tradicional", cantidad: tradicionales.length, asistidas: tradicionalesAsistidas, porcentaje: mixTradicional },
                ],
                porAsesor: Object.values(asesorMap).sort((a, b) => b.cantidad - a.cantidad).slice(0, 8),
                porOrigen: Object.values(origenMap).sort((a, b) => b.cantidad - a.cantidad).slice(0, 8),
            },

            resumen: {
                concertadas,
                asistidas,
                noShow,
                efectividad,
                digitales: digitales.length,
                digitalesAsistidas,
                tradicionales: tradicionales.length,
                tradicionalesAsistidas,
                mixDigital,
                mixTradicional,
            },
        };
    }

    /* =========================
    INGRESOS DE PISO
    ========================= */

    if (
        (moduloId === "gestion_negocio" && submoduloId === "ingresos_piso") ||
        (moduloId === "comercial" && submoduloId === "comercial_trafico")
    ) {
        const res = await apiTraficoPiso.list({
            page_size: 10000,
            desde: `${anio}-01-01`,
            hasta: `${anio}-12-31`,
        }).catch(() => []);

        const lista = normalizarTraficoPisoTablero(Array.isArray(res) ? res : res?.results || []);

        const trafico = lista.filter(c => {
            if (!c?.fecha_hora_cita) return false;

            const dt = new Date(c.fecha_hora_cita);
            if (Number.isNaN(dt.getTime())) return false;
            if (dt.getFullYear() !== Number(anio)) return false;
            if (!esAnual && dt.getMonth() + 1 !== mesNum) return false;

            if (agenciaSeleccionada) {
                return normalizaAgenciaGrupo(c.agencia) === normalizaAgenciaGrupo(agenciaSeleccionada);
            }

            return true;
        });

        const totalVisitas = trafico.length;
        const conAutoCuenta = trafico.filter(c => !!c.deja_auto_cuenta).length;

        const diasPeriodo = esAnual
            ? (new Date(Number(anio), 1, 29).getMonth() === 1 ? 366 : 365)
            : new Date(Number(anio), mesNum, 0).getDate();

        const promedioDiario = diasPeriodo > 0 ? Number((totalVisitas / diasPeriodo).toFixed(1)) : 0;

        const asesoresMap = {};
        const motivosIngresoMap = {};
        const modelosInteresMap = {};
        const motivosCompraMap = {};
        const capitalizacionMap = {};
        const perfilesMap = {};
        const comportamientoMap = {};

        trafico.forEach(c => {
            const dt = new Date(c.fecha_hora_cita);
            const dia = dt.getDate();

            const asesor = c.asesor_ventas || "Sin asignar";
            if (!asesoresMap[asesor]) asesoresMap[asesor] = { name: asesor, cantidad: 0, autoCuenta: 0 };
            asesoresMap[asesor].cantidad++;
            if (c.deja_auto_cuenta) asesoresMap[asesor].autoCuenta++;

            motivosIngresoMap[c.fuente_prospeccion] = (motivosIngresoMap[c.fuente_prospeccion] || 0) + 1;
            modelosInteresMap[c.modelo_interes] = (modelosInteresMap[c.modelo_interes] || 0) + 1;
            motivosCompraMap[c.motivo_compra] = (motivosCompraMap[c.motivo_compra] || 0) + 1;
            capitalizacionMap[c.forma_capitalizacion] = (capitalizacionMap[c.forma_capitalizacion] || 0) + 1;
            perfilesMap[c.perfil_profesional] = (perfilesMap[c.perfil_profesional] || 0) + 1;

            const keyDia = esAnual ? `${dt.getMonth() + 1}/${dia}` : String(dia);
            comportamientoMap[keyDia] = (comportamientoMap[keyDia] || 0) + 1;
        });

        const convertir = map => Object.entries(map)
            .map(([name, cantidad]) => ({ name, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad);

        const porAsesor = convertir(
            Object.fromEntries(
                Object.entries(asesoresMap).map(([k, v]) => [k, v.cantidad])
            )
        ).slice(0, 10);

        const motivosIngreso = convertir(motivosIngresoMap);
        const modelosInteres = convertir(modelosInteresMap);
        const motivosCompra = convertir(motivosCompraMap);
        const capitalizacion = convertir(capitalizacionMap);
        const perfiles = convertir(perfilesMap);

        const comportamientoDiario = esAnual
            ? convertir(comportamientoMap)
            : Array.from({ length: diasPeriodo }, (_, i) => ({
                name: String(i + 1),
                cantidad: comportamientoMap[String(i + 1)] || 0,
            }));

        return {
            tipo: "ingresos_piso",

            kpis: [
                { label: "Visitantes", valor: totalVisitas.toLocaleString("es-MX"), sub: "Total ingresos a piso", icon: HandCoins },
                { label: "Atendidos", valor: totalVisitas.toLocaleString("es-MX"), sub: "Clientes registrados", icon: Users },
                { label: "Auto a Cuenta", valor: conAutoCuenta.toLocaleString("es-MX"), sub: `${totalVisitas ? ((conAutoCuenta / totalVisitas) * 100).toFixed(1) : 0}% del total`, icon: Car },
                { label: "Promedio Diario", valor: promedioDiario.toFixed(1), sub: "visitas por día", icon: CalendarDays },
            ],

            dimensiones: {
                porAsesor,
                comportamientoDiario,
                motivosIngreso,
                modelosInteres,
                motivosCompra,
                capitalizacion,
                perfiles,
            },

            resumen: {
                totalVisitas,
                atendidos: totalVisitas,
                conAutoCuenta,
                promedioDiario,
            },
        };
    }

    /* =========================
    PRUEBAS DE MANEJO
    ========================= */

    if (
        moduloId === "gestion_negocio" &&
        (submoduloId === "pruebas_manejo" || submoduloId === "test_drives")
    ) {
        const res = await apiPruebaManejo.listAll({
            desde: `${anio}-01-01`,
            hasta: `${anio}-12-31`,
        });

        const lista = normalizarPruebasManejoTablero(Array.isArray(res) ? res : res?.results || []);

        const pruebas = lista.filter(c => {
            if (!c?.fecha_hora_cita) return false;

            const dt = new Date(c.fecha_hora_cita);
            if (Number.isNaN(dt.getTime())) return false;
            if (dt.getFullYear() !== Number(anio)) return false;
            if (!esAnual && dt.getMonth() + 1 !== mesNum) return false;

            if (agenciaSeleccionada) {
                return normalizaAgenciaGrupo(c.agencia) === normalizaAgenciaGrupo(agenciaSeleccionada);
            }

            return true;
        });

        const totalPruebas = pruebas.length;
        const conAutoCuenta = pruebas.filter(c => !!c.deja_auto_cuenta).length;

        const diasPeriodo = esAnual
            ? (new Date(Number(anio), 1, 29).getMonth() === 1 ? 366 : 365)
            : new Date(Number(anio), mesNum, 0).getDate();

        const promedioDiario = diasPeriodo > 0 ? Number((totalPruebas / diasPeriodo).toFixed(1)) : 0;

        const asesoresMap = {};
        const modelosMap = {};
        const comportamientoMap = {};

        pruebas.forEach(c => {
            const dt = new Date(c.fecha_hora_cita);
            const dia = dt.getDate();

            const asesor = c.asesor_ventas || "Sin asignar";
            if (!asesoresMap[asesor]) asesoresMap[asesor] = { name: asesor, cantidad: 0, autoCuenta: 0 };
            asesoresMap[asesor].cantidad++;
            if (c.deja_auto_cuenta) asesoresMap[asesor].autoCuenta++;

            const modelo = c.modelo_interes || "No especificado";
            modelosMap[modelo] = (modelosMap[modelo] || 0) + 1;

            const keyDia = esAnual ? `${dt.getMonth() + 1}/${dia}` : String(dia);
            comportamientoMap[keyDia] = (comportamientoMap[keyDia] || 0) + 1;
        });

        const convertir = map =>
            Object.entries(map)
                .map(([name, cantidad]) => ({ name, cantidad }))
                .sort((a, b) => b.cantidad - a.cantidad);

        const porAsesor = Object.values(asesoresMap)
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 10);

        const modelos = convertir(modelosMap);

        const comportamientoDiario = esAnual
            ? convertir(comportamientoMap)
            : Array.from({ length: diasPeriodo }, (_, i) => ({
                name: String(i + 1),
                cantidad: comportamientoMap[String(i + 1)] || 0,
            }));

        return {
            tipo: "pruebas_manejo",

            kpis: [
                { label: "Pruebas Realizadas", valor: totalPruebas.toLocaleString("es-MX"), sub: "Demostraciones registradas", icon: Car },
                { label: "Auto a Cuenta", valor: conAutoCuenta.toLocaleString("es-MX"), sub: `${totalPruebas ? ((conAutoCuenta / totalPruebas) * 100).toFixed(1) : 0}% del total`, icon: HandCoins },
                { label: "Promedio Diario", valor: promedioDiario.toFixed(1), sub: "pruebas por día", icon: CalendarDays },
                { label: "Modelos", valor: modelos.length.toLocaleString("es-MX"), sub: "modelos registrados", icon: FileText },
            ],

            dimensiones: {
                porAsesor,
                comportamientoDiario,
                modelos,
            },

            resumen: {
                totalPruebas,
                conAutoCuenta,
                promedioDiario,
                modelosRegistrados: modelos.length,
            },
        };
    }

    /* =========================
    SOLICITUDES DE CRÉDITO
    ========================= */

    if (
        moduloId === "gestion_negocio" &&
        (submoduloId === "solicitudes_credito" || submoduloId === "credito")
    ) {
        const res = await apiCredito.list();
        const lista = normalizarSolicitudesCreditoTablero(Array.isArray(res) ? res : res?.results || []);

        const solicitudes = lista.filter(c => {
            if (!c?.fecha_hora_cita) return false;

            const dt = new Date(c.fecha_hora_cita);
            if (Number.isNaN(dt.getTime())) return false;
            if (dt.getFullYear() !== Number(anio)) return false;
            if (!esAnual && dt.getMonth() + 1 !== mesNum) return false;

            if (agenciaSeleccionada) {
                return normalizaAgenciaGrupo(c.agencia) === normalizaAgenciaGrupo(agenciaSeleccionada);
            }

            return true;
        });

        const totalSolicitudes = solicitudes.length;

        const autorizadas = solicitudes.filter(c =>
            /autoriz|ejercid|aprob|aceptad|formaliz/i.test(c.estatus_solicitud || "")
        ).length;

        const pctAutorizacion = totalSolicitudes
            ? Number(((autorizadas / totalSolicitudes) * 100).toFixed(1))
            : 0;

        const asesoresMap = {};
        const estatusMap = {};
        const financierasMap = {};
        const modelosMap = {};
        const comportamientoMap = {};

        solicitudes.forEach(c => {
            const dt = new Date(c.fecha_hora_cita);
            const dia = dt.getDate();

            const asesor = c.asesor_ventas || "Sin asignar";
            asesoresMap[asesor] = (asesoresMap[asesor] || 0) + 1;

            const estatus = c.estatus_solicitud || "En Proceso";
            estatusMap[estatus] = (estatusMap[estatus] || 0) + 1;

            const financiera = c.financiera || "VW Financial Services";
            financierasMap[financiera] = (financierasMap[financiera] || 0) + 1;

            const modelo = c.auto_interes || "No especificado";
            modelosMap[modelo] = (modelosMap[modelo] || 0) + 1;

            const keyDia = esAnual ? `${dt.getMonth() + 1}/${dia}` : String(dia);
            comportamientoMap[keyDia] = (comportamientoMap[keyDia] || 0) + 1;
        });

        const convertir = map =>
            Object.entries(map)
                .map(([name, cantidad]) => ({ name, cantidad }))
                .sort((a, b) => b.cantidad - a.cantidad);

        const diasPeriodo = esAnual
            ? (new Date(Number(anio), 1, 29).getMonth() === 1 ? 366 : 365)
            : new Date(Number(anio), mesNum, 0).getDate();

        const comportamientoDiario = esAnual
            ? convertir(comportamientoMap)
            : Array.from({ length: diasPeriodo }, (_, i) => ({
                name: String(i + 1),
                cantidad: comportamientoMap[String(i + 1)] || 0,
            }));

        const porAsesor = convertir(asesoresMap).slice(0, 10);
        const porEstatus = convertir(estatusMap);
        const porFinanciera = convertir(financierasMap);
        const porModelo = convertir(modelosMap);

        return {
            tipo: "solicitudes_credito",

            kpis: [
                { label: "Solicitudes", valor: totalSolicitudes.toLocaleString("es-MX"), sub: "Total registradas", icon: FileText },
                { label: "Autorizadas", valor: autorizadas.toLocaleString("es-MX"), sub: "Autorizadas / ejercidas", icon: CreditCard },
                { label: "% Autorización", valor: `${pctAutorizacion}%`, sub: `${autorizadas} de ${totalSolicitudes}`, icon: BadgeDollarSign },
                { label: "Modelos", valor: porModelo.length.toLocaleString("es-MX"), sub: "Modelos solicitados", icon: Car },
            ],

            dimensiones: {
                porAsesor,
                porEstatus,
                porFinanciera,
                porModelo,
                comportamientoDiario,
            },

            resumen: {
                totalSolicitudes,
                autorizadas,
                pctAutorizacion,
            },
        };
    }

    /* =========================
       AUTOS NUEVOS
    ========================= */

    if (moduloId === "gestion_negocio" && submoduloId === "autos_nuevos") {
        try {
            const paramsVentas = { fecha_desde: mesStart, fecha_hasta: mesEnd };
            if (!esTodas && filtros.agencia) paramsVentas.agencia = filtros.agencia;

            let res = await getVentasVNDashboard(paramsVentas).catch(() => null);

            if ((!res || !res.totales || res.totales.unidades_vendidas === 0) && agenciaLimpia && !esTodas) {
                const resAlt = await getVentasVNDashboard({ ...paramsVentas, agencia: agenciaLimpia }).catch(() => null);
                if (resAlt?.totales && Number(resAlt.totales.unidades_vendidas) > 0) res = resAlt;
            }

            const unidadesVendidas = Number(res?.totales?.unidades_vendidas || 0);
            const ingresos = Number(res?.totales?.ingresos || 0);
            const costo = Number(res?.totales?.costo || 0);
            const utilidad = ingresos - costo;
            const ventasDigitales = Number(res?.totales?.ventas_digitales || 0);
            const margen = ingresos > 0 ? ((utilidad / ingresos) * 100).toFixed(1) : "0.0";

            const porAsesor = (res?.graficas?.por_asesor || [])
                .map(a => ({ name: a.asesor || "Sin asesor", cantidad: Number(a.unidades_vendidas || 0), monto: Number(a.ingresos || 0) }))
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 10);

            const porFamilia = (res?.graficas?.por_familia || [])
                .map(f => ({ name: f.familia || "Otro", cantidad: Number(f.unidades_vendidas || 0), monto: Number(f.ingresos || 0) }))
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 10);

            const rawCondiciones = (res?.graficas?.por_condicion_pago || [])
                .map(c => ({ name: c.condicion_pago || "Sin condición", cantidad: Number(c.unidades_vendidas || 0) }))
                .sort((a, b) => b.cantidad - a.cantidad);

            const porCondicion = rawCondiciones.length > 6
                ? [...rawCondiciones.slice(0, 5), { name: "Otras Financieras", cantidad: rawCondiciones.slice(5).reduce((acc, c) => acc + c.cantidad, 0) }]
                : rawCondiciones;

            return {
                tipo: "autos_nuevos",
                kpis: [
                    { label: "Unidades Vendidas", valor: `${unidadesVendidas.toLocaleString("es-MX")} uds`, sub: `${ventasDigitales} digitales`, icon: Car },
                    { label: "Ingresos Ventas", valor: `$${Math.round(ingresos).toLocaleString("es-MX")}`, sub: "Facturación total", icon: CreditCard },
                    { label: "Utilidad Estimada", valor: `$${Math.round(utilidad).toLocaleString("es-MX")}`, sub: `Margen: ${margen}%`, icon: BadgeDollarSign, alert: utilidad < 0 },
                    { label: "Costo Unidades", valor: `$${Math.round(costo).toLocaleString("es-MX")}`, sub: "Costo de compra", icon: HandCoins },
                ],
                dimensiones: { porAsesor, porFamilia, porCondicion },
            };
        } catch (err) {
            console.error("Error al obtener ventas de autos nuevos:", err);
            throw err;
        }
    }

    /* =========================
    GESTIÓN COMERCIAL -> PROSPECTOS
    ========================= */

    if (
        moduloId === "comercial" &&
        submoduloId === "comercial_prospectos"
    ) {
        // Este submódulo NO usa filtro de año/mes.
        // Trabaja sobre la cartera completa, igual que Gestión Comercial > Prospectos.

        const params = {
            todos: 1,
            ligero: 1,
            page: 1,
            page_size: 200,
            ...(agenciaSeleccionada ? { agencia: agenciaSeleccionada } : {}),
        };

        // Primera página para obtener los KPIs calculados por el backend.
        const primeraPagina = await api.digitalesListProspectos(params);

        const serverKpis = primeraPagina?.kpis || null;
        const totalServidor = Number(primeraPagina?.count || 0);

        // Cargamos todos los prospectos únicamente para construir las gráficas.
        const prospectosRaw = await listarProspectosDashboard({
            todos: 1,
            ligero: 1,
            ...(agenciaSeleccionada ? { agencia: agenciaSeleccionada } : {}),
        });

        const prospectos = prospectosRaw
            .map(normalizarProspectoGC)
            .filter(p => {
                if (!agenciaSeleccionada) return true;

                return (
                    normalizaAgenciaGrupo(p.agencia) ===
                    normalizaAgenciaGrupo(agenciaSeleccionada)
                );
            });

        const total = Number(
            serverKpis?.total ??
            totalServidor ??
            prospectos.length
        );

        const pendIA = Number(
            serverKpis?.pendIA ??
            prospectos.filter(
                r => r.cotizacion_pendiente || r.requiere_asesor
            ).length
        );

        const conPerfil = Number(
            serverKpis?.conPerfil ??
            prospectos.filter(tienePerfilComercialGC).length
        );

        const financiamiento = Number(
            serverKpis?.financiamiento ??
            prospectos.filter(r =>
                ["credito", "arrendamiento"].includes(
                    normalizarTexto(r.forma_pago)
                )
            ).length
        );

        const tiemposResp = prospectos
            .filter(r => r.primer_contacto_at && r.creado)
            .map(r =>
                (
                    new Date(r.primer_contacto_at).getTime() -
                    new Date(r.creado).getTime()
                ) / 60000
            )
            .filter(v => v > 0 && v < 1440);

        const avgResp =
            serverKpis?.avgResp ??
            (
                tiemposResp.length
                    ? Math.round(
                        tiemposResp.reduce((a, b) => a + b, 0) /
                        tiemposResp.length
                    )
                    : null
            );

        const pctPerfil =
            total > 0
                ? Math.round((conPerfil / total) * 100)
                : 0;

        const estadoMap = {};
        const asesorMap = {};
        const businessMap = {};
        const scoreMap = {
            "0-34 Bajo": 0,
            "35-59 Medio": 0,
            "60-79 Alto": 0,
            "80-100 Muy alto": 0,
        };

        prospectos.forEach(p => {
            const estado = p.estado || "Sin dato";
            const asesor = p.asesor_digital || "Sin asesor";
            const business = p.linea || "Sin business";

            estadoMap[estado] =
                (estadoMap[estado] || 0) + 1;

            asesorMap[asesor] =
                (asesorMap[asesor] || 0) + 1;

            businessMap[business] =
                (businessMap[business] || 0) + 1;

            const score = Number(
                p?.score ||
                p?.lead_score ||
                0
            );

            if (score >= 80) {
                scoreMap["80-100 Muy alto"]++;
            } else if (score >= 60) {
                scoreMap["60-79 Alto"]++;
            } else if (score >= 35) {
                scoreMap["35-59 Medio"]++;
            } else {
                scoreMap["0-34 Bajo"]++;
            }
        });

        const convertir = map =>
            Object.entries(map)
                .map(([name, cantidad]) => ({
                    name,
                    cantidad,
                }))
                .sort(
                    (a, b) =>
                        b.cantidad - a.cantidad
                );

        return {
            tipo: "comercial_prospectos",

            // Permitirá que la interfaz indique que este submódulo
            // ignora el filtro mensual.
            ignoraPeriodo: true,

            kpis: [
                {
                    label: "Prospectos",
                    valor: total.toLocaleString("es-MX"),
                    sub: "Prospectos activos",
                    icon: Users,
                },
                {
                    label: "Pendientes IA",
                    valor: pendIA.toLocaleString("es-MX"),
                    sub: "Requieren atención",
                    icon: AlertCircle,
                },
                {
                    label: "Perfil Comercial",
                    valor: `${pctPerfil}%`,
                    sub: `${conPerfil.toLocaleString("es-MX")} con datos de compra`,
                    icon: FileText,
                },
                {
                    label: "Crédito / Arrendamiento",
                    valor: financiamiento.toLocaleString("es-MX"),
                    sub: "Oportunidad financiera",
                    icon: HandCoins,
                },
                {
                    label: "Resp. Promedio",
                    valor:
                        avgResp === null
                            ? "—"
                            : avgResp < 60
                                ? `${avgResp}m`
                                : `${Math.floor(avgResp / 60)}h ${avgResp % 60}m`,
                    sub: "Objetivo < 4h",
                    icon: CalendarDays,
                },
            ],

            dimensiones: {
                porEstado: convertir(estadoMap).slice(0, 10),
                porAsesor: convertir(asesorMap).slice(0, 10),
                porBusiness: convertir(businessMap).slice(0, 8),
                porScore: convertir(scoreMap),
            },

            resumen: {
                total,
                pendIA,
                conPerfil,
                pctPerfil,
                financiamiento,
                avgResp,
            },
        };
    }

    /* =========================
    GESTIÓN COMERCIAL -> RENDIMIENTO DIGITAL
    ========================= */

    if (
        moduloId === "comercial" &&
        submoduloId === "comercial_rendimiento_digital"
    ) {
        const fechaDesde = fechaISOOffset(29);
        const fechaHasta = fechaISOOffset(0);

        const base = await api.digitalesAnaliticaAsesores({
            fecha_desde: fechaDesde,
            fecha_hasta: fechaHasta,
            page: 1,
            page_size: 200,
        });

        let resumen;
        let asesores;
        let actividadDiaria;

        /* TODAS LAS AGENCIAS */
        if (!agenciaSeleccionada) {
            resumen = normalizarMetricasRD(base?.resumen || {});
            asesores = (base?.asesores || [])
                .map(normalizarMetricasRD)
                .sort((a, b) =>
                    b.tasa_respuesta_cliente - a.tasa_respuesta_cliente ||
                    b.contactos_validos - a.contactos_validos
                )
                .slice(0, 10);

            actividadDiaria = base?.actividad_diaria || [];
        }

        /* AGENCIA ESPECÍFICA */
        else {
            const lineas = (base?.lineas || base?.asesores || []).filter(item =>
                normalizaAgenciaGrupo(item?.agencia) === normalizaAgenciaGrupo(agenciaSeleccionada)
            );

            const numeros = [...new Set(
                lineas
                    .map(item => item?.numero || item?.numero_asesor)
                    .filter(Boolean)
            )];

            const respuestas = await Promise.all(
                numeros.map(numero =>
                    api.digitalesAnaliticaAsesores({
                        fecha_desde: fechaDesde,
                        fecha_hasta: fechaHasta,
                        numero_asesor: numero,
                        page: 1,
                        page_size: 200,
                    }).catch(() => null)
                )
            );

            const validas = respuestas.filter(Boolean);

            asesores = validas
                .map(res => {
                    const item = res?.asesores?.[0] || res?.resumen || {};
                    return normalizarMetricasRD(item);
                })
                .filter(item => item.numero_asesor || item.asesor_digital)
                .sort((a, b) =>
                    b.tasa_respuesta_cliente - a.tasa_respuesta_cliente ||
                    b.contactos_validos - a.contactos_validos
                )
                .slice(0, 10);

            resumen = sumarResumenesRD(
                validas.map(res => res?.resumen || {})
            );

            actividadDiaria = sumarActividadRD(validas);
        }

        return {
            tipo: "comercial_rendimiento_digital",
            ignoraPeriodo: true,
            periodoEspecial: "Últimos 30 días",

            kpis: [
                {
                    label: "Clientes con Actividad",
                    valor: Number(resumen.clientes || 0).toLocaleString("es-MX"),
                    sub: `${Number(resumen.acciones || 0).toLocaleString("es-MX")} acciones registradas`,
                    icon: Users,
                },
                {
                    label: "Intentos de Contacto",
                    valor: Number(resumen.intentos_contacto || 0).toLocaleString("es-MX"),
                    sub: `${Number(resumen.contactos_validos || 0).toLocaleString("es-MX")} enviados · ${Number(resumen.fallidos || 0).toLocaleString("es-MX")} fallidos`,
                    icon: FileText,
                },
                {
                    label: "Respuesta del Cliente",
                    valor: `${Number(resumen.tasa_respuesta_cliente || 0)}%`,
                    sub: `${Number(resumen.respuestas || 0).toLocaleString("es-MX")} respuestas`,
                    icon: Globe,
                },
                {
                    label: "Interés entre Respuestas",
                    valor: `${Number(resumen.tasa_interes_respuestas || 0)}%`,
                    sub: `${Number(resumen.positivas || 0).toLocaleString("es-MX")} con intención comercial`,
                    icon: BadgeDollarSign,
                },
            ],

            dimensiones: {
                porAsesor: asesores.map(item => ({
                    name: item.asesor_digital || item.numero_asesor || "Sin asesor",
                    agencia: item.agencia || "",
                    clientes: Number(item.clientes || 0),
                    enviados: Number(item.contactos_validos || 0),
                    respuestas: Number(item.respuestas || 0),
                    interes: Number(item.positivas || 0),
                    sinRespuesta: Number(item.sin_respuesta || 0),
                    tasa: Number(item.tasa_respuesta_cliente || 0),
                })),

                actividadDiaria: actividadDiaria.map(item => ({
                    name: String(item.fecha || "").slice(5),
                    intentos: Number(item.mensajes || 0),
                    respuestas: Number(item.respuestas || 0),
                    sinRespuesta: Number(item.sin_respuesta || 0),
                })),
            },

            resumen,
        };
    }

    /* =========================
    GESTIÓN COMERCIAL -> CITAS
    ========================= */

    if (
        moduloId === "comercial" &&
        submoduloId === "comercial_citas"
    ) {
        const params = {
            fecha_desde: mesStart,
            fecha_hasta: mesEnd,
        };

        if (agenciaSeleccionada) params.agencia = agenciaSeleccionada;

        const res = await apiCitas.list(params);
        const citas = Array.isArray(res) ? res : extractArray(res);

        const filas = citas.filter(c => {
            if (!c?.fecha_hora_cita) return false;

            const fecha = new Date(c.fecha_hora_cita);
            if (Number.isNaN(fecha.getTime())) return false;

            if (fecha.getFullYear() !== Number(anio)) return false;
            if (!esAnual && fecha.getMonth() + 1 !== mesNum) return false;

            if (
                agenciaSeleccionada &&
                normalizaAgenciaGrupo(c?.agencia || "") !==
                normalizaAgenciaGrupo(agenciaSeleccionada)
            ) {
                return false;
            }

            return true;
        });

        const total = filas.length;
        const asistieron = filas.filter(c => !!c.asistencia).length;
        const noAsistieron = total - asistieron;
        const pctAsistencia = total > 0 ? Math.round((asistieron / total) * 100) : 0;

        const tipoMap = {};
        const dealerMap = {};
        const asesorMap = {};
        const fuenteMap = {};
        const diaMap = {
            Lun: 0,
            Mar: 0,
            Mié: 0,
            Jue: 0,
            Vie: 0,
            Sáb: 0,
            Dom: 0,
        };

        const nombresDia = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        filas.forEach(c => {
            const tipo = c?.tipo_cita || "Sin tipo";
            const dealer = c?.agencia || "Sin agencia";
            const asesor = c?.asesor_digital || "Sin asesor";
            const fuente = c?.fuente_prospeccion || "Sin fuente";

            tipoMap[tipo] = (tipoMap[tipo] || 0) + 1;
            dealerMap[dealer] = (dealerMap[dealer] || 0) + 1;
            asesorMap[asesor] = (asesorMap[asesor] || 0) + 1;
            fuenteMap[fuente] = (fuenteMap[fuente] || 0) + 1;

            if (c.fecha_hora_cita) {
                const d = new Date(c.fecha_hora_cita);
                if (!Number.isNaN(d.getTime())) {
                    const nombreDia = nombresDia[d.getDay()];
                    diaMap[nombreDia] = (diaMap[nombreDia] || 0) + 1;
                }
            }
        });

        const convertir = map =>
            Object.entries(map)
                .map(([name, cantidad]) => ({ name, cantidad }))
                .sort((a, b) => b.cantidad - a.cantidad);

        return {
            tipo: "comercial_citas",

            kpis: [
                {
                    label: "Total Citas",
                    valor: total.toLocaleString("es-MX"),
                    sub: "Citas registradas",
                    icon: CalendarDays,
                },
                {
                    label: "Asistieron",
                    valor: asistieron.toLocaleString("es-MX"),
                    sub: `${pctAsistencia}% asistencia`,
                    icon: Users,
                },
                {
                    label: "No Asistieron",
                    valor: noAsistieron.toLocaleString("es-MX"),
                    sub: `${total ? Math.round((noAsistieron / total) * 100) : 0}% del total`,
                    icon: AlertCircle,
                },
                {
                    label: "% Asistencia",
                    valor: `${pctAsistencia}%`,
                    sub: `${asistieron} de ${total}`,
                    icon: Globe,
                },
            ],

            dimensiones: {
                porTipo: convertir(tipoMap),
                porDealer: convertir(dealerMap),
                porAsesor: convertir(asesorMap).slice(0, 10),
                porFuente: convertir(fuenteMap).slice(0, 10),
                porDia: Object.entries(diaMap).map(([name, cantidad]) => ({
                    name,
                    cantidad,
                })),
            },

            resumen: {
                total,
                asistieron,
                noAsistieron,
                pctAsistencia,
            },
        };
    }

    /* =========================
    GESTIÓN COMERCIAL -> TRÁFICO PISO
    ========================= */

    if (
        moduloId === "comercial" &&
        submoduloId === "comercial_trafico_piso"
    ) {
        const params = {
            desde: mesStart,
            hasta: mesEnd,
        };

        if (agenciaSeleccionada) {
            params.agencia = agenciaSeleccionada;
        }

        const registrosRaw = await listarTraficoPisoCompleto(params);

        const registros = registrosRaw.filter(r => {
            if (!r?.creado_en) return false;

            const fecha = new Date(r.creado_en);
            if (Number.isNaN(fecha.getTime())) return false;

            if (fecha.getFullYear() !== Number(anio)) return false;
            if (!esAnual && fecha.getMonth() + 1 !== mesNum) return false;

            if (
                agenciaSeleccionada &&
                normalizaAgenciaGrupo(r?.agencia) !==
                normalizaAgenciaGrupo(agenciaSeleccionada)
            ) {
                return false;
            }

            return true;
        });

        const total = registros.length;
        const conAutoCuenta = registros.filter(r => !!r.deja_auto_cuenta).length;
        const sinAutoCuenta = total - conAutoCuenta;

        const presupuestoTotal = registros.reduce(
            (acc, r) => acc + Number(r?.presupuesto_estimado || 0),
            0
        );

        const presupuestoPromedio =
            total > 0
                ? Math.round(presupuestoTotal / total)
                : 0;

        const dealerMap = {};
        const asesorMap = {};
        const motivoMap = {};
        const personaMap = {};
        const tiempoMap = {};
        const capitalizacionMap = {};

        const diaMap = {
            Lun: 0,
            Mar: 0,
            Mié: 0,
            Jue: 0,
            Vie: 0,
            Sáb: 0,
            Dom: 0,
        };

        const dias = [
            "Dom",
            "Lun",
            "Mar",
            "Mié",
            "Jue",
            "Vie",
            "Sáb",
        ];

        registros.forEach(r => {
            const dealer = r?.agencia || "Sin agencia";
            const asesor = r?.asesor_ventas || "Sin asesor";
            const motivo = r?.motivo_ingreso || "Sin motivo";
            const persona = r?.tipo_persona || "Sin tipo";
            const tiempo = r?.tiempo_compra || "Sin tiempo";
            const capitalizacion =
                r?.forma_capitalizacion || "Sin forma";

            dealerMap[dealer] =
                (dealerMap[dealer] || 0) + 1;

            asesorMap[asesor] =
                (asesorMap[asesor] || 0) + 1;

            motivoMap[motivo] =
                (motivoMap[motivo] || 0) + 1;

            personaMap[persona] =
                (personaMap[persona] || 0) + 1;

            tiempoMap[tiempo] =
                (tiempoMap[tiempo] || 0) + 1;

            capitalizacionMap[capitalizacion] =
                (capitalizacionMap[capitalizacion] || 0) + 1;

            const fecha = new Date(r.creado_en);

            if (!Number.isNaN(fecha.getTime())) {
                const nombreDia = dias[fecha.getDay()];
                diaMap[nombreDia] =
                    (diaMap[nombreDia] || 0) + 1;
            }
        });

        const convertir = map =>
            Object.entries(map)
                .map(([name, cantidad]) => ({
                    name,
                    cantidad,
                }))
                .sort((a, b) => b.cantidad - a.cantidad);

        return {
            tipo: "comercial_trafico_piso",

            kpis: [
                {
                    label: "Total Registros",
                    valor: total.toLocaleString("es-MX"),
                    sub: "Prospectos en piso",
                    icon: Users,
                },
                {
                    label: "Auto a Cuenta",
                    valor: conAutoCuenta.toLocaleString("es-MX"),
                    sub: `${total ? Math.round((conAutoCuenta / total) * 100) : 0}% del total`,
                    icon: Car,
                },
                {
                    label: "Sin Auto a Cuenta",
                    valor: sinAutoCuenta.toLocaleString("es-MX"),
                    sub: `${total ? Math.round((sinAutoCuenta / total) * 100) : 0}% del total`,
                    icon: AlertCircle,
                },
                {
                    label: "Presupuesto Promedio",
                    valor: `$${presupuestoPromedio.toLocaleString("es-MX")}`,
                    sub: `$${Math.round(presupuestoTotal).toLocaleString("es-MX")} acumulado`,
                    icon: BadgeDollarSign,
                },
            ],

            dimensiones: {
                porDealer: convertir(dealerMap),
                porAsesor: convertir(asesorMap).slice(0, 10),
                porMotivo: convertir(motivoMap),
                porPersona: convertir(personaMap),
                porTiempo: convertir(tiempoMap),
                porCapitalizacion: convertir(capitalizacionMap),
                porDia: Object.entries(diaMap).map(
                    ([name, cantidad]) => ({
                        name,
                        cantidad,
                    })
                ),
            },

            resumen: {
                total,
                conAutoCuenta,
                sinAutoCuenta,
                presupuestoPromedio,
                presupuestoTotal,
            },
        };
    }

    /* =========================
    GESTIÓN COMERCIAL -> PRUEBAS
    ========================= */

    if (
        moduloId === "comercial" &&
        submoduloId === "comercial_pruebas"
    ) {
        // Vista en tiempo real:
        // NO usa agencia, año ni mes del tablero.
        const data = await apiPruebaManejo.listAll();
        const registros = Array.isArray(data) ? data : [];

        const total = registros.length;
        const asistencias = registros.filter(r => !!r.asistencia).length;
        const pctAsistencia = total > 0
            ? Math.round((asistencias / total) * 100)
            : 0;

        const dealersActivos = new Set(
            registros
                .map(r => String(r?.agencia || "").trim())
                .filter(Boolean)
        ).size;

        const dealerMap = {};
        const modeloMap = {};
        const asesorMap = {};
        const diasMap = {};

        registros.forEach(r => {
            const dealer = r?.agencia || "Sin dealer";
            const modelo = r?.auto_interes || "Sin modelo";
            const asesor = r?.asesor_piso || "Sin asesor";

            dealerMap[dealer] = (dealerMap[dealer] || 0) + 1;
            modeloMap[modelo] = (modeloMap[modelo] || 0) + 1;
            asesorMap[asesor] = (asesorMap[asesor] || 0) + 1;

            if (r?.fecha_hora_cita) {
                const d = new Date(r.fecha_hora_cita);

                if (!Number.isNaN(d.getTime())) {
                    const pad = n => String(n).padStart(2, "0");
                    const ymd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                    diasMap[ymd] = (diasMap[ymd] || 0) + 1;
                }
            }
        });

        const convertir = map =>
            Object.entries(map)
                .map(([name, cantidad]) => ({ name, cantidad }))
                .sort((a, b) => b.cantidad - a.cantidad);

        // Igual que el módulo original: hoy + 13 días anteriores.
        const ultimos14Dias = [];

        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);

            const pad = n => String(n).padStart(2, "0");
            const ymd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

            ultimos14Dias.push({
                name: `${d.getDate()}/${d.getMonth() + 1}`,
                cantidad: diasMap[ymd] || 0,
            });
        }

        return {
            tipo: "comercial_pruebas",
            ignoraPeriodo: true,
            ignoraAgencia: true,
            periodoEspecial: "Tiempo real",

            kpis: [
                {
                    label: "Total Pruebas",
                    valor: total.toLocaleString("es-MX"),
                    sub: "Registros en tiempo real",
                    icon: Car,
                },
                {
                    label: "Asistencias",
                    valor: asistencias.toLocaleString("es-MX"),
                    sub: "Pruebas con asistencia",
                    icon: Users,
                },
                {
                    label: "% Asistencia",
                    valor: `${pctAsistencia}%`,
                    sub: `${asistencias} de ${total}`,
                    icon: CalendarDays,
                },
                {
                    label: "Dealers Activos",
                    valor: dealersActivos.toLocaleString("es-MX"),
                    sub: "Con pruebas registradas",
                    icon: Globe,
                },
            ],

            dimensiones: {
                porDia: ultimos14Dias,
                porDealer: convertir(dealerMap),
                porModelo: convertir(modeloMap).slice(0, 10),
                porAsesor: convertir(asesorMap).slice(0, 10),
            },

            resumen: {
                total,
                asistencias,
                pctAsistencia,
                dealersActivos,
            },
        };
    }

    /* =========================
    GESTIÓN COMERCIAL -> ENTREGAS
    ========================= */

    if (
        moduloId === "comercial" &&
        submoduloId === "comercial_entregas"
    ) {
        // Gráficas del módulo original trabajan con todos los registros.
        const data = await apiEntregas.listAll();
        const lista = Array.isArray(data) ? data : [];

        const entregas = lista.filter(r => {
            if (!r?.fecha_hora_entrega) return false;

            const fecha = new Date(r.fecha_hora_entrega);
            if (Number.isNaN(fecha.getTime())) return false;

            if (fecha.getFullYear() !== Number(anio)) return false;
            if (!esAnual && fecha.getMonth() + 1 !== mesNum) return false;

            if (
                agenciaSeleccionada &&
                normalizaAgenciaGrupo(r?.agencia) !==
                normalizaAgenciaGrupo(agenciaSeleccionada)
            ) {
                return false;
            }

            return true;
        });

        const total = entregas.length;
        const entregadas = entregas.filter(r =>
            esEntregaActiva(r?.entrega_reportada)
        ).length;

        const pendientes = total - entregadas;

        const unidadesEntregadas = entregas.filter(r =>
            esEntregaActiva(r?.entrega_reportada)
        );  

        const pctEntrega = total > 0
            ? Math.round((entregadas / total) * 100)
            : 0;

        const estadoMap = {
            Entregadas: entregadas,
            Pendientes: pendientes,
        };

        const tipoMap = {};
        const modeloMap = {};
        const versionMap = {};
        const colorMap = {};
        const asesorMap = {};
        const dealerMap = {};
        const diasMap = {};

        /* Dealer puede representar todos los registros */
        entregas.forEach(r => {
            const dealer = r?.agencia || "Sin dealer";
            dealerMap[dealer] = (dealerMap[dealer] || 0) + 1;
        });

        /* Estas gráficas representan SOLO unidades entregadas */
        unidadesEntregadas.forEach(r => {
            const tipo = tipoVentaEntrega(r?.tipo_venta);
            const modelo = r?.modelo_version || "Sin modelo";
            const version = r?.version || "Sin versión";
            const color = r?.color || "Sin color";
            const asesor = r?.asesor_ventas || "Sin asesor";

            tipoMap[tipo] = (tipoMap[tipo] || 0) + 1;
            modeloMap[modelo] = (modeloMap[modelo] || 0) + 1;
            versionMap[version] = (versionMap[version] || 0) + 1;
            colorMap[color] = (colorMap[color] || 0) + 1;
            asesorMap[asesor] = (asesorMap[asesor] || 0) + 1;

            const fecha = new Date(r.fecha_hora_entrega);

            if (!Number.isNaN(fecha.getTime())) {
                const pad = n => String(n).padStart(2, "0");

                const key =
                    `${fecha.getFullYear()}-` +
                    `${pad(fecha.getMonth() + 1)}-` +
                    `${pad(fecha.getDate())}`;

                diasMap[key] = (diasMap[key] || 0) + 1;
            }
        });

        const convertir = map =>
            Object.entries(map)
                .map(([name, cantidad]) => ({ name, cantidad }))
                .sort((a, b) => b.cantidad - a.cantidad);

        const porEstado = convertir(estadoMap);
        const porTipo = convertir(tipoMap);
        const porModelo = convertir(modeloMap).slice(0, 10);
        const porVersion = convertir(versionMap).slice(0, 10);
        const porColor = convertir(colorMap).slice(0, 10);
        const porAsesor = convertir(asesorMap).slice(0, 10);
        const porDealer = convertir(dealerMap);

        const porDia = Object.entries(diasMap)
            .map(([fecha, cantidad]) => ({
                name: fecha,
                cantidad,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        const topAsesor = porAsesor[0] || null;
        const topModelo = porModelo[0] || null;

        return {
            tipo: "comercial_entregas",

            kpis: [
                {
                    label: "Total Entregas",
                    valor: total.toLocaleString("es-MX"),
                    sub: "Registros del periodo",
                    icon: Car,
                },
                {
                    label: "Entregadas",
                    valor: entregadas.toLocaleString("es-MX"),
                    sub: `${pctEntrega}% cumplimiento`,
                    icon: Users,
                },
                {
                    label: "Pendientes",
                    valor: pendientes.toLocaleString("es-MX"),
                    sub: `${total ? Math.round((pendientes / total) * 100) : 0}% pendientes`,
                    icon: AlertCircle,
                },
                {
                    label: "% Entrega",
                    valor: `${pctEntrega}%`,
                    sub: `${entregadas} de ${total}`,
                    icon: CalendarDays,
                },
            ],

            dimensiones: {
                porEstado,
                porTipo,
                porModelo,
                porVersion,
                porColor,
                porAsesor,
                porDealer,
                porDia,
            },

            resumen: {
                total,
                entregadas,
                pendientes,
                pctEntrega,
                topAsesor,
                topModelo,
            },
        };
    }

    /* =========================
    GESTIÓN COMERCIAL -> CAMPAÑAS META
    ========================= */

    if (
        moduloId === "comercial" &&
        submoduloId === "comercial_campanas_meta"
    ) {
        try {
            const datos = await cargarCampanasMetaTablero({
                anio,
                mes: esAnual ? null : mesNum,
                agencia: agenciaSeleccionada || null,
            });

            const totalCampanas = datos.length;

            const alcanceTotal = datos.reduce(
                (s, c) => s + c.alcance,
                0
            );

            const impresionesTotal = datos.reduce(
                (s, c) => s + c.impresiones,
                0
            );

            const gastoTotal = datos.reduce(
                (s, c) => s + c.importe_gastado,
                0
            );

            const resultadosTotal = datos.reduce(
                (s, c) => s + c.total_resultados,
                0
            );

            const dealerMap = {};
            const canalMap = {};
            const estadoMap = {};
            const campanasMap = {};

            datos.forEach(c => {
                const dealer = c.sucursal || "Sin dealer";
                const canal = c.canal || "Sin canal";
                const estado = c.estado_campana || "Sin estado";
                const nombre = c.nombre_campana || "Sin nombre";

                if (!dealerMap[dealer]) {
                    dealerMap[dealer] = {
                        name: dealer,
                        gasto: 0,
                        alcance: 0,
                        resultados: 0,
                    };
                }

                dealerMap[dealer].gasto += c.importe_gastado;
                dealerMap[dealer].alcance += c.alcance;
                dealerMap[dealer].resultados += c.total_resultados;

                if (!canalMap[canal]) {
                    canalMap[canal] = {
                        name: canal,
                        gasto: 0,
                        resultados: 0,
                        alcance: 0,
                        impresiones: 0,
                        campanas: 0,
                    };
                }

                canalMap[canal].gasto += c.importe_gastado;
                canalMap[canal].resultados += c.total_resultados;
                canalMap[canal].alcance += c.alcance;
                canalMap[canal].impresiones += c.impresiones;
                canalMap[canal].campanas++;

                estadoMap[estado] =
                    (estadoMap[estado] || 0) + 1;

                campanasMap[nombre] =
                    (campanasMap[nombre] || 0) +
                    c.total_resultados;
            });

            const porDealer = Object.values(dealerMap)
                .sort((a, b) => b.gasto - a.gasto);

            const porCanal = Object.values(canalMap)
                .map(item => ({
                    ...item,
                    costoResultado:
                        item.resultados > 0
                            ? Number(
                                (
                                    item.gasto /
                                    item.resultados
                                ).toFixed(2)
                            )
                            : 0,
                }))
                .sort((a, b) => b.gasto - a.gasto);

            const porEstado = Object.entries(estadoMap)
                .map(([name, cantidad]) => ({
                    name,
                    cantidad,
                }))
                .sort((a, b) => b.cantidad - a.cantidad);

            const porCampana = Object.entries(campanasMap)
                .map(([name, cantidad]) => ({
                    name,
                    cantidad,
                }))
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 10);

            return {
                tipo: "comercial_campanas_meta",

                kpis: [
                    {
                        label: "Campañas",
                        valor: totalCampanas.toLocaleString("es-MX"),
                        sub: "Campañas del periodo",
                        icon: FileText,
                    },
                    {
                        label: "Alcance Total",
                        valor: alcanceTotal.toLocaleString("es-MX"),
                        sub: "Personas únicas",
                        icon: Users,
                    },
                    {
                        label: "Impresiones",
                        valor: impresionesTotal.toLocaleString("es-MX"),
                        sub: "Visualizaciones",
                        icon: Globe,
                    },
                    {
                        label: "Inversión",
                        valor: `$${gastoTotal.toLocaleString("es-MX", {
                            maximumFractionDigits: 2,
                        })}`,
                        sub: `${resultadosTotal.toLocaleString("es-MX")} resultados`,
                        icon: BadgeDollarSign,
                    },
                ],

                dimensiones: {
                    porCampana,
                    porDealer,
                    porCanal,
                    porEstado,
                },

                resumen: {
                    totalCampanas,
                    alcanceTotal,
                    impresionesTotal,
                    gastoTotal,
                    resultadosTotal,
                },

                disponible: true,
            };
        } catch (error) {
            console.error(
                "[Tableros][Campañas Meta]",
                error
            );

            return {
                tipo: "comercial_campanas_meta",

                kpis: [
                    {
                        label: "Campañas",
                        valor: "—",
                        sub: "Servicio no disponible",
                        icon: FileText,
                    },
                    {
                        label: "Alcance Total",
                        valor: "—",
                        sub: "Servicio no disponible",
                        icon: Users,
                    },
                    {
                        label: "Impresiones",
                        valor: "—",
                        sub: "Servicio no disponible",
                        icon: Globe,
                    },
                    {
                        label: "Inversión",
                        valor: "—",
                        sub: "Servicio no disponible",
                        icon: BadgeDollarSign,
                    },
                ],

                dimensiones: {
                    porCampana: [],
                    porDealer: [],
                    porCanal: [],
                    porEstado: [],
                },

                resumen: {},

                disponible: false,
                mensaje:
                    "El servicio de Campañas Meta no está disponible actualmente.",
            };
        }
    }

    /* =========================
    INVENTARIO
    ========================= */

    if (moduloId === "gestion_negocio" && submoduloId === "inventario") {
        try {
            const filtrosInv = await apiInventario.getFiltros();
            const agenciasLista = Array.isArray(filtrosInv?.agencias) ? filtrosInv.agencias : [];

            let codigoAgencia;

            if (agenciaLimpia) {
                const encontrada = agenciasLista.find(a => coincideAgencia(a.nombre || a.agenciaNombre || a.codigo, agenciaLimpia));
                codigoAgencia = encontrada?.codigo;
            }

            const paramsAPI = {
                condicion: "N",
                agencia: codigoAgencia || undefined,
            };

            const [dataVehiculos, costoBackend] = await Promise.all([
                apiInventario.getInventario(paramsAPI),
                apiInventario.getCosto(paramsAPI),
            ]);

            if (!Array.isArray(dataVehiculos)) {
                throw new Error("El servicio de inventario no devolvió una lista válida.");
            }

            const periodoGracia = 30;
            const tasaAnual = 6.7458;

            const vehiculosActivos = dataVehiculos.filter(v => {
                const estatus = String(v?.StEstoque || "").trim();
                return !ESTATUS_EXCLUIDOS.includes(estatus);
            });

            const vehiculosCalculados = vehiculosActivos.map(v => {
                const diasEnStock = v?.diasEnStock === null || v?.diasEnStock === undefined ? null : Number(v.diasEnStock);
                const valorCompra = Number(v?.VrNF_Compra);

                if (!Number.isFinite(diasEnStock) || diasEnStock <= periodoGracia || !Number.isFinite(valorCompra)) {
                    return {
                        ...v,
                        diasFueraGracia: null,
                        costoFinancieroTotal: 0,
                    };
                }

                const diasFueraGracia = diasEnStock - periodoGracia;
                const costoFinancieroDiario = (valorCompra * (tasaAnual / 100)) / 360;
                const costoFinancieroTotal = costoFinancieroDiario * diasFueraGracia;

                return {
                    ...v,
                    diasFueraGracia,
                    costoFinancieroDiario,
                    costoFinancieroTotal,
                };
            });

            const totalActivo = vehiculosCalculados.length;

            const costoInventarioCalculado = vehiculosCalculados.reduce((total, v) => {
                const valor = Number(v?.VrNF_Compra);
                return total + (Number.isFinite(valor) ? valor : 0);
            }, 0);

            const costoInventario =
                Number.isFinite(Number(costoBackend)) && Number(costoBackend) > 0
                    ? Number(costoBackend)
                    : costoInventarioCalculado;

            const unidadesFueraGracia = vehiculosCalculados.filter(v => Number(v?.diasFueraGracia || 0) > 0).length;

            const costoFinancieroTotal = vehiculosCalculados.reduce(
                (total, v) => total + Number(v?.costoFinancieroTotal || 0),
                0
            );

            /* ANTIGÜEDAD REAL */
            const buckets = {
                "0-30": 0,
                "31-60": 0,
                "61-90": 0,
                "91-120": 0,
                "+120": 0,
            };

            vehiculosCalculados.forEach(v => {
                const dias = Number(v?.diasEnStock);

                if (!Number.isFinite(dias)) return;

                if (dias <= 30) buckets["0-30"]++;
                else if (dias <= 60) buckets["31-60"]++;
                else if (dias <= 90) buckets["61-90"]++;
                else if (dias <= 120) buckets["91-120"]++;
                else buckets["+120"]++;
            });

            const antiguedadData = [
                { name: "0-30 días", cantidad: buckets["0-30"], estado: "optimo" },
                { name: "31-60 días", cantidad: buckets["31-60"], estado: "alerta" },
                { name: "61-90 días", cantidad: buckets["61-90"], estado: "critico" },
                { name: "91-120 días", cantidad: buckets["91-120"], estado: "critico" },
                { name: ">120 días", cantidad: buckets["+120"], estado: "obsoleto" },
            ].map(item => ({
                ...item,
                porcentaje: totalActivo > 0 ? Math.round((item.cantidad / totalActivo) * 100) : 0,
            }));

            /* MODELOS REALES */
            const modelosMap = {};

            vehiculosCalculados.forEach(v => {
                const modelo = String(v?.NmFamilia || v?.EdiModelo || "").trim();
                if (!modelo) return;

                modelosMap[modelo] = (modelosMap[modelo] || 0) + 1;
            });

            const modelosData = Object.entries(modelosMap)
                .map(([name, cantidad]) => ({ name, cantidad }))
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 7);

            /* COSTO FINANCIERO REAL POR AGENCIA */
            const costosAgenciaMap = {};

            vehiculosCalculados.forEach(v => {
                const familia = String(v?.NmFamilia || "").trim().toUpperCase();

                const esComercial = MODELOS_COMERCIALES.some(modelo =>
                    familia.includes(modelo.toUpperCase())
                );

                const agencia = esComercial
                    ? "Vehiculos Comerciales"
                    : String(v?.agenciaNombre || v?.agencia || "Sin agencia").trim();

                if (!costosAgenciaMap[agencia]) {
                    costosAgenciaMap[agencia] = {
                        name: agencia,
                        cantidad: 0,
                        vehiculosFuera: 0,
                    };
                }

                costosAgenciaMap[agencia].cantidad += Number(v?.costoFinancieroTotal || 0);

                if (Number(v?.diasFueraGracia || 0) > 0) {
                    costosAgenciaMap[agencia].vehiculosFuera++;
                }
            });

            let costoFinancieroChart = Object.values(costosAgenciaMap)
                .filter(item => item.cantidad > 0)
                .map(item => ({
                    ...item,
                    cantidad: Number(item.cantidad.toFixed(2)),
                }))
                .sort((a, b) => b.cantidad - a.cantidad);

            let tituloCostoChart = "Costo Financiero por Concesionaria";

            /* SI SE SELECCIONÓ UNA AGENCIA, AGRUPAR POR MODELO */
            if (agenciaLimpia) {
                tituloCostoChart = `Costo Financiero en ${filtros.agencia} por Modelo`;

                const costosModeloMap = {};

                vehiculosCalculados.forEach(v => {
                    const modelo = String(v?.NmFamilia || v?.EdiModelo || "").trim();
                    if (!modelo) return;

                    if (!costosModeloMap[modelo]) {
                        costosModeloMap[modelo] = {
                            name: modelo,
                            cantidad: 0,
                            vehiculosFuera: 0,
                        };
                    }

                    costosModeloMap[modelo].cantidad += Number(v?.costoFinancieroTotal || 0);

                    if (Number(v?.diasFueraGracia || 0) > 0) {
                        costosModeloMap[modelo].vehiculosFuera++;
                    }
                });

                costoFinancieroChart = Object.values(costosModeloMap)
                    .filter(item => item.cantidad > 0)
                    .map(item => ({ ...item, cantidad: Number(item.cantidad.toFixed(2)) }))
                    .sort((a, b) => b.cantidad - a.cantidad)
                    .slice(0, 10);
            }

            return {
                tipo: "inventario",
                agenciaSeleccionada: filtros.agencia,

                kpis: [
                    {
                        label: "Stock Activo",
                        valor: `${totalActivo.toLocaleString("es-MX")} uds`,
                        sub: "Inventario considerado",
                        icon: Car,
                    },
                    {
                        label: "Valor Compra",
                        valor: `$${Math.round(costoInventario).toLocaleString("es-MX")}`,
                        sub: "Suma valor de compra",
                        icon: CreditCard,
                    },
                    {
                        label: "Fuera de Gracia",
                        valor: `${unidadesFueraGracia.toLocaleString("es-MX")} uds`,
                        sub: `> ${periodoGracia} días`,
                        icon: AlertCircle,
                        alert: true,
                    },
                    {
                        label: "Costo Financiero",
                        valor: `$${Math.round(costoFinancieroTotal).toLocaleString("es-MX")}`,
                        sub: `Tasa ${tasaAnual.toFixed(4)}%`,
                        icon: HandCoins,
                        alert: true,
                    },
                ],

                dimensiones: {
                    antiguedad: antiguedadData,
                    modelos: modelosData,
                    costoChart: costoFinancieroChart,
                    tituloCostoChart,
                },
            };
        } catch (err) {
            console.error("Error al obtener inventario:", err);
            throw new Error("No fue posible obtener los datos reales de Inventario.");
        }
    }

    return {
        tipo: "embudo",
        kpis: [
            { label: "Registros", valor: "0", icon: CalendarDays },
            { label: "Avance", valor: "0%", icon: Car },
        ],
        etapas: [
            { etapa: "Registros Totales del Periodo", cantidad: 0, porcentaje: 100 },
            { etapa: "Operaciones en Seguimiento", cantidad: 0, porcentaje: 0 },
            { etapa: "Operaciones Concluidas", cantidad: 0, porcentaje: 0 },
        ],
        totalInicial: 0,
        cierreFinal: 0,
        nota: "Submódulo listo para enlazar sus métricas finales.",
    };
}