import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { apiCitas } from "../../lib/apiCitas";

const AZUL = "#131E5C";

function normalizeText(value) {
    return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizaTelefonoMx(tel) {
    const raw = String(tel || "").replace(/\D/g, "");
    if (raw.length === 10) return `52${raw}`;
    if (raw.length === 12 && raw.startsWith("52")) return raw;
    return raw;
}

function normalizeDealerGrupo(value) {
    const text = normalizeText(value);
    if (text.includes("cordoba") && !text.includes("usados")) return "VW Cordoba";
    if (text.includes("orizaba") && !text.includes("usados")) return "VW Orizaba";
    if (text.includes("poza rica")) return "VW Poza Rica";
    if (text.includes("tuxtepec")) return "VW Tuxtepec";
    if (text.includes("tuxpan")) return "VW Tuxpan";
    return String(value || "").trim();
}

function onlyDate(value) {
    if (value === null || value === undefined || value === "") return "";
    const raw = String(value).trim();
    if (!raw) return "";
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const mxMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (mxMatch) {
        const day = mxMatch[1].padStart(2, "0");
        const month = mxMatch[2].padStart(2, "0");
        return `${mxMatch[3]}-${month}-${day}`;
    }
    return "";
}

function dateToInt(value) {
    const ymd = onlyDate(value);
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    return Number(ymd.replaceAll("-", ""));
}

function isDateInRange(dateStr, desde, hasta) {
    const int = dateToInt(dateStr);
    if (int === null) return false;
    if (desde) {
        const desdeInt = dateToInt(desde);
        if (desdeInt !== null && int < desdeInt) return false;
    }
    if (hasta) {
        const hastaInt = dateToInt(hasta);
        if (hastaInt !== null && int > hastaInt) return false;
    }
    return true;
}

function formatDateYMDLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function widthClass(value) {
    const clamped = Math.max(0, Math.min(100, value));
    if (clamped === 0) return "w-0";
    return `w-[${clamped.toFixed(1)}%]`;
}

function formatRangoFechas(desde, hasta) {
    if (!desde && !hasta) return "Sin filtro de fechas";
    const opciones = { day: "2-digit", month: "short", year: "numeric" };
    const fmt = (v) => new Intl.DateTimeFormat("es-MX", opciones).format(new Date(`${v}T00:00:00`));
    if (desde && hasta) return `${fmt(desde)} – ${fmt(hasta)}`;
    if (desde) return `Desde ${fmt(desde)}`;
    return `Hasta ${fmt(hasta)}`;
}

function getRangoMes(yyyyMm) {
    const match = String(yyyyMm || "").match(/^(\d{4})-(\d{2})$/);
    if (!match) return null;
    const anio = Number(match[1]);
    const mes = Number(match[2]);
    if (mes < 1 || mes > 12) return null;
    const inicio = `${match[1]}-${match[2]}-01`;
    const ultimoDia = new Date(anio, mes, 0).getDate();
    const fin = `${match[1]}-${match[2]}-${String(ultimoDia).padStart(2, "0")}`;
    return { inicio, fin };
}

function formatMesLargo(yyyyMm) {
    const match = String(yyyyMm || "").match(/^(\d{4})-(\d{2})$/);
    if (!match) return yyyyMm;
    const fecha = new Date(Number(match[1]), Number(match[2]) - 1, 1);
    const label = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(fecha);
    return label.charAt(0).toUpperCase() + label.slice(1);
}

function getMesesDisponibles() {
    const mesesBase = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
    const ahora = new Date();
    const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
    const mesSiguiente = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
    const mesSiguienteStr = `${mesSiguiente.getFullYear()}-${String(mesSiguiente.getMonth() + 1).padStart(2, "0")}`;
    const unicos = new Set([...mesesBase, mesActual, mesSiguienteStr]);
    return Array.from(unicos).sort();
}

function esGestionableBDC(row) {
    return normalizeText(row?.estado) !== "descalificado" && /^52\d{10}$/.test(normalizaTelefonoMx(row?.telefono));
}

function esContactadoBDC(row) {
    const estado = normalizeText(row?.estado);
    const estadosConContacto = ["contactado", "sin respuesta", "calificado", "pendiente de cotizacion", "requiere atencion", "requiere asesor", "cita programada", "asistencia a la cita", "no show", "no asistio", "financiamiento"];
    return Boolean(row?.primer_contacto_at || row?.fecha_contacto || estadosConContacto.includes(estado) || row?.ultima_cita_agendada || row?.asistencia || row?.folio_solicitud_credito || row?.solicitud_credito_estado || row?.vin_facturado);
}

function tieneSolicitudBDC(row) {
    return Boolean(String(row?.folio_solicitud_credito || "").trim() || String(row?.solicitud_credito_estado || "").trim());
}

function esAnfBDC(row) {
    const estado = normalizeText(row?.solicitud_credito_estado);
    return ["autorizado", "condicionado"].includes(estado) && !String(row?.vin_facturado || "").trim();
}

function getDealerBDC(row) {
    return normalizeDealerGrupo(row?.agencia || "");
}

function getTipoUnidadBDC(row) {
    const agencia = normalizeText(row?.agencia || "");
    const linea = normalizeText(row?.linea || "");
    if (agencia.includes("usados")) return "Seminuevos";
    if (linea === "usados" || linea === "seminuevos") return "Seminuevos";
    if (linea === "comerciales") return "Comerciales";
    if (linea === "nuevos") return "Nuevos";
    return "";
}

function lineaMatchesBDC(row, filtro) {
    if (!filtro || filtro === "Todos") return true;
    const tipo = getTipoUnidadBDC(row);
    if (!tipo) return false;
    if (filtro === "Nuevos + Seminuevos") return tipo === "Nuevos" || tipo === "Seminuevos";
    return tipo === filtro;
}

const ASESOR_DIGITAL_CANONICO_BDC = new Map([
    ["lizbeth cano clara", "Lizbeth Cano Clara"],
    ["erendira santos coyotzi", "Erendira Santos Coyotzi"],
    ["marelly tenorio salinas", "Marelly Tenorio Salinas"],
    ["ia vagen", "IA Vagen"],
    ["edgar omar noguera solis", "Edgar Omar Noguera Solis"],
    ["dulce abigail garcia olivares", "Dulce Abigail Garcia Olivares"],
    ["bianca chavez alarcon", "Bianca Chavez Alarcon"],
    ["bianca isabel chavez alarcon", "Bianca Chavez Alarcon"],
    ["candy denisse marquez", "Candy Denisse Marquez"],
    ["candy denisse marquez cortes", "Candy Denisse Marquez"],
    ["julio ramirez lopez", "Julio Ramirez Lopez"],
]);

function canonicalAsesorDigitalBDC(value) {
    const normalized = normalizeText(value);
    if (!normalized) return "";
    return ASESOR_DIGITAL_CANONICO_BDC.get(normalized) || String(value || "").trim();
}

function esAsesorDigitalValidoBDC(value) {
    return Boolean(canonicalAsesorDigitalBDC(value));
}

function getTelefonoApiBDC(item) {
    return normalizaTelefonoMx(item?.cliente?.telefono || item?.telefono || item?.cliente_telefono || "");
}

function parseDateToTimestamp(value) {
    const ymd = onlyDate(value);
    if (!ymd) return 0;
    const ts = new Date(`${ymd}T00:00:00`).getTime();
    return Number.isNaN(ts) ? 0 : ts;
}

function getProspectoTimestampBDC(row) {
    for (const value of [row?.creado, row?.fecha_reclamacion, row?.primer_contacto_at, row?.fecha_contacto, row?.ultimo_contacto_at]) {
        const ts = parseDateToTimestamp(value);
        if (ts) return ts;
    }
    return 0;
}

function buildProspectosPorTelefonoBDC(rows) {
    const map = new Map();
    for (const row of rows || []) {
        const telefono = normalizaTelefonoMx(row?.telefono || "");
        if (!/^52\d{10}$/.test(telefono)) continue;
        if (!map.has(telefono)) map.set(telefono, []);
        map.get(telefono).push(row);
    }
    for (const lista of map.values()) lista.sort((a, b) => getProspectoTimestampBDC(a) - getProspectoTimestampBDC(b));
    return map;
}

function getProspectoRelacionadoBDC(index, telefono, fechaReferencia = "") {
    const tel = normalizaTelefonoMx(telefono || "");
    if (!/^52\d{10}$/.test(tel)) return null;
    const lista = index.get(tel) || [];
    if (!lista.length) return null;
    const referenciaTs = parseDateToTimestamp(fechaReferencia);
    if (!referenciaTs) return lista[lista.length - 1];
    for (let i = lista.length - 1; i >= 0; i -= 1) {
        const ts = getProspectoTimestampBDC(lista[i]);
        if (ts && ts <= referenciaTs) return lista[i];
    }
    return null;
}

function getProspectoCitaBDC(cita, prospectosPorTelefono) {
    return getProspectoRelacionadoBDC(prospectosPorTelefono, getTelefonoApiBDC(cita), cita?.fecha_hora_cita);
}

function getAsesorCitaBDC(cita) {
    return canonicalAsesorDigitalBDC(cita?.asesor_digital || "");
}

function getTipoUnidadCitaBDC(cita, prospecto) {
    const desdeProspecto = getTipoUnidadBDC(prospecto || {});
    if (desdeProspecto) return desdeProspecto;
    const agencia = normalizeText(cita?.agencia || "");
    const auto = normalizeText(cita?.auto_interes || "");
    if (agencia.includes("usados") || auto === "seminuevos" || auto === "seminuevo") return "Seminuevos";
    return "";
}

function tipoUnidadMatchesBDC(tipo, filtro) {
    if (!filtro || filtro === "Todos") return true;
    if (!tipo) return false;
    if (filtro === "Nuevos + Seminuevos") return tipo === "Nuevos" || tipo === "Seminuevos";
    return tipo === filtro;
}

function asistenciaConfirmadaBDC(value) {
    if (value === true || value === 1) return true;
    return ["si", "sí", "true", "1", "asistio", "asistió"].includes(normalizeText(value));
}

function getCitaUniqueKeyBDC(cita) {
    if (cita?.id !== null && cita?.id !== undefined) return `id:${cita.id}`;
    return [getTelefonoApiBDC(cita), String(cita?.fecha_hora_cita || ""), getAsesorCitaBDC(cita), normalizeText(cita?.tipo_cita || "")].join("|");
}

function dedupeCitasBDC(citas) {
    const map = new Map();
    for (const cita of citas || []) {
        const key = getCitaUniqueKeyBDC(cita);
        if (!map.has(key)) map.set(key, cita);
    }
    return Array.from(map.values());
}

function setTelefonosBDC(items, getter = (item) => item?.telefono) {
    const set = new Set();
    for (const item of items || []) {
        const tel = normalizaTelefonoMx(getter(item));
        if (/^52\d{10}$/.test(tel)) set.add(tel);
    }
    return set;
}

function porcentajeInterseccionBDC(origenSet, destinoSet) {
    if (!origenSet?.size) return 0;
    let avanzaron = 0;
    for (const tel of origenSet) if (destinoSet?.has(tel)) avanzaron += 1;
    return (avanzaron / origenSet.size) * 100;
}

function getEstadoMetaBDC(valor, meta) {
    if (valor >= meta) return { label: "En meta", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
    if (valor >= meta * 0.6) return { label: "Requiere atención", text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    return { label: "Crítico", text: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
}

function getEstadoAsesorBDC(efectividad) {
    if (efectividad >= 80) return { label: "En meta", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    if (efectividad >= 60) return { label: "Requiere atención", cls: "border-amber-200 bg-amber-50 text-amber-700" };
    return { label: "Crítico", cls: "border-red-200 bg-red-50 text-red-700" };
}

function cls(...args) {
    return args.filter(Boolean).join(" ");
}

export default function DashboardEjecutivoBDC({
    rows: rowsOriginales,
    versionOperativa = 0,
    asesoresPermitidos = null,
    accesoTotal = false,
}) {
    const asesoresPermitidosSet = useMemo(() => {
        if (accesoTotal) return null;
        return new Set((asesoresPermitidos || []).map(canonicalAsesorDigitalBDC).filter(Boolean));
    }, [accesoTotal, asesoresPermitidos]);

    const asesorPuedeMonitorearseBDC = useCallback((value) => {
        if (accesoTotal) return true;
        const nombre = canonicalAsesorDigitalBDC(value);
        return Boolean(nombre && asesoresPermitidosSet?.has(nombre));
    }, [accesoTotal, asesoresPermitidosSet]);

    const rows = useMemo(() => {
        const lista = Array.isArray(rowsOriginales) ? rowsOriginales : [];
        return accesoTotal ? lista : lista.filter((row) => asesorPuedeMonitorearseBDC(row?.asesor_digital));
    }, [rowsOriginales, accesoTotal, asesorPuedeMonitorearseBDC]);

    const mesActualYyyyMm = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }, []);

    const mesesDisponibles = useMemo(() => getMesesDisponibles(), []);

    const [mes, setMes] = useState(mesActualYyyyMm);
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [asesor, setAsesor] = useState("Todos");
    const [agencia, setAgencia] = useState("Todos");
    const [linea, setLinea] = useState("Todos");
    const [origen, setOrigen] = useState("Todos");
    const [showDiscardDetails, setShowDiscardDetails] = useState(false);
    const [citasBDC, setCitasBDC] = useState([]);
    const [loadingOperativoBDC, setLoadingOperativoBDC] = useState(true);
    const [errorOperativoBDC, setErrorOperativoBDC] = useState("");

    const rangoActivo = useMemo(() => {
        if (fechaInicio || fechaFin) return { inicio: fechaInicio || null, fin: fechaFin || null };
        const rango = getRangoMes(mes);
        if (rango) return { inicio: rango.inicio, fin: rango.fin };
        return { inicio: null, fin: null };
    }, [mes, fechaInicio, fechaFin]);

    const cambioMes = useCallback((nuevoMes) => {
        setMes(nuevoMes);
        setFechaInicio("");
        setFechaFin("");
    }, []);

    const cambioFechaCustom = useCallback((campo, valor) => {
        if (campo === "inicio") setFechaInicio(valor);
        else setFechaFin(valor);
        setMes("");
    }, []);

    const hoy = useMemo(() => formatDateYMDLocal(new Date()), []);

    const setRango7Dias = useCallback(() => {
        const now = new Date();
        const desde = new Date(now);
        desde.setDate(desde.getDate() - 6);
        setFechaInicio(formatDateYMDLocal(desde));
        setFechaFin(formatDateYMDLocal(now));
        setMes("");
    }, []);

    const setRango30Dias = useCallback(() => {
        const now = new Date();
        const desde = new Date(now);
        desde.setDate(desde.getDate() - 29);
        setFechaInicio(formatDateYMDLocal(desde));
        setFechaFin(formatDateYMDLocal(now));
        setMes("");
    }, []);

    const is7DiasActivo = useMemo(() => {
        if (!fechaInicio || !fechaFin || mes) return false;
        const now = new Date();
        const desde = new Date(now);
        desde.setDate(desde.getDate() - 6);
        return fechaInicio === formatDateYMDLocal(desde) && fechaFin === hoy;
    }, [fechaInicio, fechaFin, mes, hoy]);

    const is30DiasActivo = useMemo(() => {
        if (!fechaInicio || !fechaFin || mes) return false;
        const now = new Date();
        const desde = new Date(now);
        desde.setDate(desde.getDate() - 29);
        return fechaInicio === formatDateYMDLocal(desde) && fechaFin === hoy;
    }, [fechaInicio, fechaFin, mes, hoy]);

    const limpiarFiltros = useCallback(() => {
        setMes(mesActualYyyyMm);
        setFechaInicio("");
        setFechaFin("");
        setAsesor("Todos");
        setAgencia("Todos");
        setLinea("Todos");
        setOrigen("Todos");
    }, [mesActualYyyyMm]);

    useEffect(() => {
        let cancelado = false;
        async function cargarCitas() {
            setLoadingOperativoBDC(true);
            setErrorOperativoBDC("");
            try {
                const params = { solo_digital: 1 };
                if (rangoActivo.inicio) params.fecha_inicio = rangoActivo.inicio;
                if (rangoActivo.fin) params.fecha_fin = rangoActivo.fin;
                const data = await apiCitas.list(params);
                if (!cancelado) setCitasBDC(dedupeCitasBDC(getListItems(data)));
            } catch (error) {
                console.error("Error cargando citas BDC:", error);
                if (!cancelado) {
                    setCitasBDC([]);
                    setErrorOperativoBDC("No se pudieron sincronizar las citas.");
                }
            } finally {
                if (!cancelado) setLoadingOperativoBDC(false);
            }
        }
        cargarCitas();
        return () => { cancelado = true; };
    }, [rangoActivo, versionOperativa]);

    const prospectosPorTelefono = useMemo(() => buildProspectosPorTelefonoBDC(rows), [rows]);

    const citasDigitalesBase = useMemo(() => dedupeCitasBDC(
        (citasBDC || []).filter((cita) => {
            if (!onlyDate(cita?.creado_en)) return false;
            const asesorCita = getAsesorCitaBDC(cita);
            if (!asesorCita) return false;
            return asesorPuedeMonitorearseBDC(asesorCita);
        })
    ), [citasBDC, asesorPuedeMonitorearseBDC]);

    const asesores = useMemo(() => {
        const values = Array.from(new Set([
            ...rows.map((row) => canonicalAsesorDigitalBDC(row?.asesor_digital)),
            ...citasDigitalesBase.map((cita) => getAsesorCitaBDC(cita)),
        ].filter(esAsesorDigitalValidoBDC).filter(asesorPuedeMonitorearseBDC))).sort((a, b) => a.localeCompare(b, "es"));
        return ["Todos", ...values];
    }, [rows, citasDigitalesBase, asesorPuedeMonitorearseBDC]);

    const agencias = useMemo(() => {
        const orden = ["VW Cordoba", "VW Orizaba", "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan"];
        const values = Array.from(new Set(rows.map(getDealerBDC).filter(Boolean)));
        return ["Todos", ...orden.filter((d) => values.includes(d)), ...values.filter((d) => !orden.includes(d)).sort((a, b) => a.localeCompare(b, "es"))];
    }, [rows]);

    const origenes = useMemo(() => ["Todos", ...Array.from(new Set(rows.map((row) => String(row?.origen || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "es"))], [rows]);

    const filteredRows = useMemo(() => rows.filter((row) => {
        if (!isDateInRange(row?.creado, rangoActivo.inicio, rangoActivo.fin)) return false;
        if (!esAsesorDigitalValidoBDC(row?.asesor_digital)) return false;
        if (asesor !== "Todos" && canonicalAsesorDigitalBDC(row?.asesor_digital) !== canonicalAsesorDigitalBDC(asesor)) return false;
        if (agencia !== "Todos" && getDealerBDC(row) !== agencia) return false;
        if (!lineaMatchesBDC(row, linea)) return false;
        if (origen !== "Todos" && normalizeText(row?.origen) !== normalizeText(origen)) return false;
        return true;
    }), [rows, rangoActivo, asesor, agencia, linea, origen]);

    const telefonosProspectosPeriodo = useMemo(() => setTelefonosBDC(filteredRows, (row) => row?.telefono), [filteredRows]);

    const citasFiltradas = useMemo(() => dedupeCitasBDC(
        citasDigitalesBase.filter((cita) => {
            const asesorCita = getAsesorCitaBDC(cita);
            if (!asesorCita) return false;
            if (asesor !== "Todos" && asesorCita !== canonicalAsesorDigitalBDC(asesor)) return false;
            const prospecto = getProspectoCitaBDC(cita, prospectosPorTelefono);
            const dealerCita = normalizeDealerGrupo(cita?.agencia || prospecto?.agencia || "");
            if (agencia !== "Todos" && dealerCita !== agencia) return false;
            if (!telefonosProspectosPeriodo.has(getTelefonoApiBDC(cita))) return false;
            if (linea !== "Todos") {
                const tipoUnidad = getTipoUnidadCitaBDC(cita, prospecto);
                if (!tipoUnidadMatchesBDC(tipoUnidad, linea)) return false;
            }
            if (origen !== "Todos") {
                const origenCita = String(cita?.fuente_prospeccion || prospecto?.origen || "").trim();
                if (normalizeText(origenCita) !== normalizeText(origen)) return false;
            }
            return true;
        })
    ), [citasDigitalesBase, asesor, agencia, linea, origen, prospectosPorTelefono, telefonosProspectosPeriodo]);

    const facturadosFiltrados = useMemo(() => {
        const unicos = new Map();
        for (const row of rows || []) {
            if (!isDateInRange(row?.facturado_at, rangoActivo.inicio, rangoActivo.fin)) continue;
            if (!esAsesorDigitalValidoBDC(row?.asesor_digital)) continue;
            if (asesor !== "Todos" && canonicalAsesorDigitalBDC(row?.asesor_digital) !== canonicalAsesorDigitalBDC(asesor)) continue;
            if (agencia !== "Todos" && getDealerBDC(row) !== agencia) continue;
            if (!lineaMatchesBDC(row, linea)) continue;
            if (origen !== "Todos" && normalizeText(row?.origen) !== normalizeText(origen)) continue;
            if (!telefonosProspectosPeriodo.has(normalizaTelefonoMx(row?.telefono || ""))) continue;
            const key = row?.id_exp ?? `${normalizaTelefonoMx(row?.telefono)}|${row?.facturado_at}`;
            unicos.set(key, row);
        }
        return Array.from(unicos.values());
    }, [rows, rangoActivo, asesor, agencia, linea, origen, telefonosProspectosPeriodo]);

    const metricas = useMemo(() => {
        const oportunidades = filteredRows.length;
        const gestionablesRows = filteredRows.filter(esGestionableBDC);
        const contactadosRows = gestionablesRows.filter(esContactadoBDC);
        const solicitudesRows = filteredRows.filter(tieneSolicitudBDC);
        const citados = citasFiltradas.length;
        const efectivas = citasFiltradas.filter((cita) => asistenciaConfirmadaBDC(cita?.asistencia)).length;
        const facturados = facturadosFiltrados.length;
        const gestionables = gestionablesRows.length;
        const contactados = contactadosRows.length;
        const solicitudes = solicitudesRows.length;
        const anf = filteredRows.filter(esAnfBDC).length;
        const descartados = filteredRows.filter((row) => normalizeText(row?.estado) === "descalificado").length;
        return {
            oportunidades, gestionables, contactados, citados, efectivas, solicitudes, anf, facturados, descartados,
            tasaContacto: gestionables ? (contactados / gestionables) * 100 : 0,
            efectividadCitas: citados ? (efectivas / citados) * 100 : 0,
            tasaFacturacion: solicitudes ? (facturados / solicitudes) * 100 : 0,
            sets: {
                gestionables: setTelefonosBDC(gestionablesRows),
                contactados: setTelefonosBDC(contactadosRows),
                citados: setTelefonosBDC(citasFiltradas, getTelefonoApiBDC),
                efectivas: setTelefonosBDC(citasFiltradas.filter((cita) => asistenciaConfirmadaBDC(cita?.asistencia)), getTelefonoApiBDC),
                solicitudes: setTelefonosBDC(solicitudesRows),
                facturados: setTelefonosBDC(facturadosFiltrados),
            },
        };
    }, [filteredRows, citasFiltradas, facturadosFiltrados]);

    const funnel = useMemo(() => {
        const stages = [
            { key: "gestionables", label: "Gestionables", value: metricas.gestionables, wrapCls: "flex-[1.2]", boxCls: "h-[118px] bg-[#0B46D8] text-white [clip-path:polygon(0_0,100%_7%,100%_93%,0_100%)]" },
            { key: "contactados", label: "Contactados", value: metricas.contactados, wrapCls: "flex-[1.12]", boxCls: "h-[108px] bg-[#1670F5] text-white [clip-path:polygon(0_7%,100%_12%,100%_88%,0_93%)]" },
            { key: "citados", label: "Citas registradas", value: metricas.citados, wrapCls: "flex-1", boxCls: "h-[96px] bg-[#55A6F6] text-white [clip-path:polygon(0_7%,100%_12%,100%_88%,0_93%)]" },
            { key: "efectivas", label: "Citas efectivas", value: metricas.efectivas, wrapCls: "flex-[0.95]", boxCls: "h-[84px] bg-[#A9D1F7] text-[#131E5C] [clip-path:polygon(0_7%,100%_12%,100%_88%,0_93%)]" },
            { key: "solicitudes", label: "Solicitudes", value: metricas.solicitudes, wrapCls: "flex-[0.9]", boxCls: "h-[74px] bg-[#F7A416] text-white [clip-path:polygon(0_7%,100%_12%,100%_88%,0_93%)]" },
            { key: "facturados", label: "Facturados", value: metricas.facturados, wrapCls: "flex-[0.82]", boxCls: "h-[64px] bg-[#F52332] text-white [clip-path:polygon(0_7%,100%_16%,100%_84%,0_93%)]" },
        ];
        return stages.map((stage, index) => {
            const next = stages[index + 1];
            const origenSet = metricas.sets?.[stage.key] || new Set();
            const destinoSet = next ? metricas.sets?.[next.key] || new Set() : new Set();
            let avanzaron = 0;
            for (const tel of origenSet) if (destinoSet.has(tel)) avanzaron += 1;
            return { ...stage, nextLabel: next?.label || "", conversion: next ? porcentajeInterseccionBDC(origenSet, destinoSet) : null, baseClientes: origenSet.size, avanzaron, perdidos: Math.max(origenSet.size - avanzaron, 0) };
        });
    }, [metricas]);

    const resultadosAsesor = useMemo(() => {
        const nombres = Array.from(new Set([
            ...filteredRows.map((row) => canonicalAsesorDigitalBDC(row?.asesor_digital)),
            ...citasFiltradas.map((cita) => getAsesorCitaBDC(cita)),
        ].filter(Boolean)));
        return nombres.map((nombre) => {
            const asesorCanonico = canonicalAsesorDigitalBDC(nombre);
            const registros = filteredRows.filter((row) => canonicalAsesorDigitalBDC(row?.asesor_digital) === asesorCanonico);
            const citasAsesor = citasFiltradas.filter((cita) => getAsesorCitaBDC(cita) === asesorCanonico);
            const facturadosAsesor = facturadosFiltrados.filter((row) => canonicalAsesorDigitalBDC(row?.asesor_digital) === asesorCanonico);
            const gestionables = registros.filter(esGestionableBDC).length;
            const contactados = registros.filter((row) => esGestionableBDC(row) && esContactadoBDC(row)).length;
            const citados = citasAsesor.length;
            const efectivas = citasAsesor.filter((cita) => asistenciaConfirmadaBDC(cita?.asistencia)).length;
            const solicitudes = registros.filter(tieneSolicitudBDC).length;
            return {
                nombre: asesorCanonico, gestionables, contactados, citados, efectivas, noShow: Math.max(citados - efectivas, 0), solicitudes, facturados: facturadosAsesor.length, efectividad: citados ? (efectivas / citados) * 100 : 0,
            };
        }).sort((a, b) => b.facturados - a.facturados || b.efectivas - a.efectivas || b.citados - a.citados || b.contactados - a.contactados);
    }, [filteredRows, citasFiltradas, facturadosFiltrados]);

    const origenStats = useMemo(() => {
        const map = new Map();
        for (const row of filteredRows) {
            const key = String(row?.origen || "").trim() || "Otros / sin origen";
            map.set(key, (map.get(key) || 0) + 1);
        }
        return Array.from(map.entries()).sort(([, a], [, b]) => b - a);
    }, [filteredRows]);

    const motivosDescarte = useMemo(() => {
        const map = new Map();
        for (const row of filteredRows) {
            if (normalizeText(row?.estado) !== "descalificado") continue;
            const key = String(row?.motivo_descalificacion || "").trim() || "Sin motivo capturado";
            map.set(key, (map.get(key) || 0) + 1);
        }
        return Array.from(map.entries()).sort(([, a], [, b]) => b - a);
    }, [filteredRows]);

    const principalDescarte = motivosDescarte[0] || ["Sin descartes", 0];
    const maxOrigen = Math.max(...origenStats.map(([, total]) => total), 1);
    const maxMotivo = Math.max(...motivosDescarte.map(([, total]) => total), 1);
    const getOriginBarClass = (label) => {
        const value = normalizeText(label);
        if (value.includes("facebook") || value.includes("meta")) return "bg-[#1670F5]";
        if (value.includes("whatsapp")) return "bg-[#22C55E]";
        if (value.includes("llamada")) return "bg-[#F59E0B]";
        if (value.includes("concesionario") || value.includes("web")) return "bg-[#131E5C]";
        return "bg-slate-400";
    };

    const Control = ({ value, onChange, children, ariaLabel }) => <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel} className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#131E5C] outline-none transition hover:border-[#131E5C]/30 focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10">{children}</select>;
    const SummaryCard = ({ label, value }) => <div className="border-r border-slate-100 px-4 py-3 last:border-r-0"><div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div><div className="mt-1 text-[28px] font-black leading-none text-slate-950">{value.toLocaleString("es-MX")}</div></div>;
    const ProcessRow = ({ label, value, detail }) => <div className="flex min-h-[64px] items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0"><div className="min-w-0"><div className="text-xs font-bold text-sky-700">{label}</div><div className="mt-0.5 text-[9px] leading-tight text-slate-400">{detail}</div></div><div className="shrink-0 text-xl font-black text-slate-950">{value.toLocaleString("es-MX")}</div></div>;
    const MetaRow = ({ label, value, meta }) => {
        const estado = getEstadoMetaBDC(value, meta);
        const stroke = value >= meta ? "#10b981" : value >= meta * 0.6 ? "#f59e0b" : "#ef4444";
        const barColor = value >= meta ? "from-emerald-400 to-emerald-500" : value >= meta * 0.6 ? "from-amber-400 to-amber-500" : "from-red-400 to-red-500";
        const radio = 20;
        const circunferencia = 2 * Math.PI * radio;
        const progreso = Math.max(0, Math.min(value, 100)) / 100;
        return <div className="group grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-100 bg-gradient-to-r from-white to-slate-50/80 px-3 py-3 transition-all duration-300 hover:border-[#131E5C]/25 hover:bg-white hover:shadow-md hover:shadow-slate-200/70">
            <div className="relative h-11 w-11 shrink-0">
                <svg viewBox="0 0 48 48" className="h-11 w-11 -rotate-90">
                    <circle cx="24" cy="24" r={radio} fill="none" stroke="#f1f5f9" strokeWidth="5" />
                    <circle cx="24" cy="24" r={radio} fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${progreso * circunferencia} ${circunferencia}`} className="transition-all duration-700 ease-out" />
                </svg>
                <div className={cls("absolute inset-0 flex items-center justify-center text-[10px] font-black tracking-tight", estado.text)}>{value.toFixed(0)}%</div>
            </div>
            <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2"><span className="truncate text-xs font-black text-[#131E5C]">{label}</span><span className="shrink-0 text-[9px] font-bold text-slate-400">Meta {meta}%</span></div>
                <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={cls("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700 ease-out group-hover:brightness-110", barColor, widthClass(value))} />
                </div>
            </div>
            <span className={cls("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black transition-colors", estado.bg, estado.border, estado.text)}>• {estado.label}</span>
        </div>;
    };

    const estadoRendimiento = getEstadoMetaBDC(metricas.efectividadCitas, 80);

    return <div className="overflow-hidden">
        <div className="px-5 pt-5">
            <div className="mt-3">
                <div className="text-[22px] font-black leading-[0.9] text-slate-950">Ventas Digitales</div>
                <div className="mt-1 text-[12px] font-bold text-blue-500">Resumen de resultados BDC</div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/60 to-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-2.5">
                    <span className="text-xs font-black text-[#131E5C]">Filtros</span>
                    <span className="text-[10px] font-semibold text-slate-400">{mes ? formatMesLargo(mes) : formatRangoFechas(fechaInicio, fechaFin)}</span>
                </div>
                <div className="grid gap-x-5 gap-y-3 px-5 py-4 sm:grid-cols-2 xl:grid-cols-12">
                    <div className="xl:col-span-3">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Mes</label>
                        <select
                            value={mes}
                            onChange={(e) => cambioMes(e.target.value)}
                            className={cls("h-10 w-full rounded-lg border bg-white px-3 text-xs font-semibold outline-none transition", mes ? "border-slate-200 text-[#131E5C] hover:border-[#131E5C]/30 focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10" : "border-slate-300 text-slate-400 italic")}
                        >
                            {!mes && <option value="" disabled>Seleccionar mes…</option>}
                            {mesesDisponibles.map((m) => (
                                <option key={m} value={m}>{formatMesLargo(m)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="xl:col-span-2">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Desde</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => cambioFechaCustom("inicio", e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#131E5C] outline-none transition hover:border-[#131E5C]/30 focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10"
                        />
                    </div>
                    <div className="xl:col-span-2">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Hasta</label>
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => cambioFechaCustom("fin", e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#131E5C] outline-none transition hover:border-[#131E5C]/30 focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10"
                        />
                    </div>
                    <div className="flex items-end gap-1.5 pb-0.5 xl:col-span-5">
                        <button type="button" onClick={setRango7Dias} className={cls("h-10 shrink-0 whitespace-nowrap rounded-lg px-3.5 text-[11px] font-bold text-white transition-all shadow-sm", is7DiasActivo ? "bg-blue-700 ring-2 ring-blue-300" : "bg-blue-600 hover:bg-blue-700")}>7 días</button>
                        <button type="button" onClick={setRango30Dias} className={cls("h-10 shrink-0 whitespace-nowrap rounded-lg px-3.5 text-[11px] font-bold text-white transition-all shadow-sm", is30DiasActivo ? "bg-amber-600 ring-2 ring-amber-300" : "bg-amber-500 hover:bg-amber-600")}>30 días</button>
                        <button type="button" onClick={limpiarFiltros} className="h-10 shrink-0 whitespace-nowrap rounded-lg bg-slate-500 px-3.5 text-[11px] font-bold text-white transition-all shadow-sm hover:bg-red-500">Limpiar</button>
                    </div>
                    <div className="xl:col-span-3">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Asesora digital</label>
                        <select value={asesor} onChange={(e) => setAsesor(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#131E5C] outline-none transition hover:border-[#131E5C]/30 focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10">{asesores.map((item) => <option key={item} value={item}>{item === "Todos" ? "Todas las asesoras" : item}</option>)}</select>
                    </div>
                    <div className="xl:col-span-3">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Agencia</label>
                        <select value={agencia} onChange={(e) => setAgencia(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#131E5C] outline-none transition hover:border-[#131E5C]/30 focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10">{agencias.map((item) => <option key={item} value={item}>{item === "Todos" ? "Todas las agencias" : item}</option>)}</select>
                    </div>
                    <div className="xl:col-span-3">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Business</label>
                        <select value={linea} onChange={(e) => setLinea(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#131E5C] outline-none transition hover:border-[#131E5C]/30 focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10">{["Todos", "Nuevos + Seminuevos", "Nuevos", "Seminuevos", "Comerciales"].map((item) => <option key={item} value={item}>{item}</option>)}</select>
                    </div>
                    <div className="xl:col-span-3">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Origen</label>
                        <select value={origen} onChange={(e) => setOrigen(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#131E5C] outline-none transition hover:border-[#131E5C]/30 focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10">{origenes.map((item) => <option key={item} value={item}>{item === "Todos" ? "Todos los orígenes" : item}</option>)}</select>
                    </div>
                </div>
            </div>

            <div className="mt-2 flex min-h-5 flex-wrap items-center justify-end gap-2 text-[10px] font-semibold">
                <span className="inline-flex items-center gap-2">{loadingOperativoBDC ? <><Loader2 className="h-3.5 w-3.5 animate-spin text-[#131E5C]" /><span className="text-slate-500">Sincronizando citas…</span></> : errorOperativoBDC ? <span className="text-amber-600">{errorOperativoBDC}</span> : <span className="text-emerald-600">Citas sincronizadas</span>}</span>
            </div>
        </div>

        <div className="mx-5 mt-4 grid overflow-hidden border-y border-slate-100 bg-white sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <SummaryCard label="Oportunidades" value={metricas.oportunidades} /><SummaryCard label="Gestionables" value={metricas.gestionables} /><SummaryCard label="Contactados únicos" value={metricas.contactados} /><SummaryCard label="Citas registradas" value={metricas.citados} /><SummaryCard label="Citas efectivas" value={metricas.efectivas} /><SummaryCard label="Facturados" value={metricas.facturados} />
        </div>

        <div className="grid gap-5 px-5 py-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(470px,1fr)]">
            <div className="min-w-0">
                <h4 className="mb-2 text-sm font-black text-[#131E5C]">Embudo comercial</h4>
                <div className="overflow-x-auto pb-28">
                    <div className="min-w-[760px]">
                        <div className="flex h-[130px] items-center">
                            {funnel.map((stage) => <div key={stage.key} className={cls("group relative flex h-full min-w-0 items-center", stage.wrapCls)}>
                                <div className={cls("relative -ml-px flex w-full items-center justify-center shadow-sm transition-transform duration-200 first:ml-0 group-hover:z-20 group-hover:scale-[1.02]", stage.boxCls)}><div className="text-center"><div className="text-[11px] font-bold">{stage.label}</div><div className="mt-1 text-2xl font-black">{stage.value.toLocaleString("es-MX")}</div></div></div>
                                {stage.conversion !== null ? <div className="pointer-events-none absolute left-1/2 top-full z-[60] mt-2 hidden w-64 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left text-slate-900 shadow-xl ring-1 ring-black/5 group-hover:block"><div className="text-[10px] font-black uppercase text-slate-500">{stage.label} → {stage.nextLabel}</div><div className="mt-2 flex justify-between text-xs"><span className="text-slate-600">Conversión clientes únicos</span><span className="font-black text-[#131E5C]">{stage.conversion.toFixed(1)}%</span></div><div className="mt-1 text-[10px] leading-relaxed text-slate-500">{stage.avanzaron} de {stage.baseClientes} clientes únicos avanzaron al siguiente paso.</div><div className="mt-2 flex justify-between text-xs"><span className="text-slate-600">No avanzaron</span><span className="font-black text-red-500">{stage.perdidos}</span></div></div> : null}
                            </div>)}
                        </div>
                        <div className="flex">{funnel.map((stage) => <div key={`conversion-${stage.key}`} className={cls("min-w-0 text-center", stage.wrapCls)}>{stage.conversion !== null ? <div><div className={cls("text-[11px] font-black", stage.conversion >= 50 ? "text-emerald-500" : stage.conversion >= 20 ? "text-amber-500" : "text-red-500")}>{stage.conversion.toFixed(1)}%</div><div className="mt-0.5 text-[9px] font-semibold text-slate-400">→ {stage.nextLabel}</div></div> : null}</div>)}</div>
                    </div>
                </div>

                <div className="-mt-20 rounded-xl border border-[#131E5C]/20 bg-white px-4 py-3">
                    <h4 className="text-xs font-black text-[#131E5C]">Rendimiento de citas</h4>
                    <div className="mt-2 grid items-center gap-4 sm:grid-cols-[1fr_80px_1fr]">
                        <div className="text-center"><div className="text-xs font-bold text-slate-500">Citas registradas</div><div className="text-3xl font-black text-[#131E5C]">{metricas.citados}</div><div className="text-[10px] text-slate-400">Mismo criterio del módulo de Citas</div></div>
                        <div className="flex items-center"><div className="h-px flex-1 bg-blue-500" /><div className="h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-[#1670F5]" /></div>
                        <div className="text-center"><div className="text-xs font-bold text-slate-500">Citas efectivas</div><div className="text-3xl font-black text-[#131E5C]">{metricas.efectivas}</div><div className="text-[10px] text-slate-400">Asistencia=true</div></div>
                    </div>
                    <div className="mt-3 grid grid-cols-[110px_minmax(0,1fr)_60px_auto] items-center gap-3"><div className="text-[10px] font-black text-slate-500">Efectividad de citas</div><div className="h-2 overflow-hidden rounded-full bg-blue-100"><div className={cls("h-full rounded-full bg-blue-600 transition-all", widthClass(metricas.efectividadCitas))} /></div><div className="text-right text-xs font-black text-[#131E5C]">{metricas.efectividadCitas.toFixed(1)}%</div><div className={cls("rounded-full border px-2 py-1 text-[9px] font-black", estadoRendimiento.bg, estadoRendimiento.border, estadoRendimiento.text)}>• {estadoRendimiento.label}</div></div>
                </div>
            </div>

            <div className="grid min-w-0 gap-4">
                <section><h4 className="mb-2 text-xs font-black text-[#131E5C]">Cumplimiento de metas</h4><div className="space-y-2"><MetaRow label="Contacto" value={metricas.tasaContacto} meta={90} /><MetaRow label="Citas efectivas" value={metricas.efectividadCitas} meta={80} /><MetaRow label="Facturación" value={metricas.tasaFacturacion} meta={100} /></div></section>
                <section><h4 className="mb-2 text-xs font-black text-[#131E5C]">Proceso comercial</h4><div className="overflow-hidden rounded-xl border border-slate-100 bg-white"><ProcessRow label="Solicitudes ingresadas" value={metricas.solicitudes} detail="Folio o estatus de solicitud capturado" /><ProcessRow label="ANF" value={metricas.anf} detail="Solicitud autorizada/condicionada aún sin VIN facturado" /><ProcessRow label="Facturados" value={metricas.facturados} detail="Expedientes con facturado_at dentro del período seleccionado" /></div></section>
            </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 px-5 pb-3 text-[10px] font-bold text-slate-500"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />En meta</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Atención</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />Crítico</span></div>

        <section className="px-5">
            <div className="mb-1 flex items-center justify-end"><span className="text-[10px] text-slate-400">Comparativo del período seleccionado</span></div>
            <div className="overflow-x-auto"><table className="min-w-full text-left text-[11px]"><thead><tr className="border-b border-slate-200 text-slate-500">{["Asesora", "Gestionables", "Contactados", "Citados", "Efectivas", "No show", "Solicitudes", "Facturados", "Efectividad", "Estado"].map((label, i) => <th key={label} className={cls("px-2 py-2 font-bold", i ? "text-center" : "")}>{label}</th>)}</tr></thead><tbody>
                {resultadosAsesor.map((item) => { const estado = getEstadoAsesorBDC(item.efectividad); return <tr key={item.nombre} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"><td className="px-2 py-2.5 font-bold text-slate-900">{item.nombre}</td><td className="px-2 py-2.5 text-center font-semibold text-slate-600">{item.gestionables}</td><td className="px-2 py-2.5 text-center font-semibold text-slate-600">{item.contactados}</td><td className="px-2 py-2.5 text-center font-semibold text-slate-600">{item.citados}</td><td className="px-2 py-2.5 text-center font-semibold text-slate-600">{item.efectivas}</td><td className="px-2 py-2.5 text-center font-semibold text-slate-600">{item.noShow}</td><td className="px-2 py-2.5 text-center font-semibold text-slate-600">{item.solicitudes}</td><td className="px-2 py-2.5 text-center font-black text-slate-900">{item.facturados}</td><td className="px-2 py-2.5 text-center"><span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 font-black text-[#131E5C]">{item.efectividad.toFixed(1)}%</span></td><td className="px-2 py-2.5 text-center"><span className={cls("inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black", estado.cls)}>• {estado.label}</span></td></tr>; })}
                {!resultadosAsesor.length ? <tr><td colSpan={10} className="px-3 py-8 text-center text-slate-400">Sin resultados para los filtros seleccionados.</td></tr> : null}
            </tbody></table></div>
        </section>

        <div className="grid gap-8 px-5 py-5 xl:grid-cols-2">
            <section><h4 className="mb-4 text-sm font-black text-slate-950">¿De dónde vienen los resultados?</h4><div className="space-y-3">{origenStats.slice(0, 6).map(([label, total]) => { const pct = metricas.oportunidades ? (total / metricas.oportunidades) * 100 : 0; return <div key={label} className="grid grid-cols-[110px_minmax(0,1fr)_44px] items-center gap-3"><span className="truncate text-[11px] font-medium text-slate-600" title={label}>{label}</span><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={cls("h-full rounded-full transition-all", widthClass((total / maxOrigen) * 100), getOriginBarClass(label))} /></div><span className="text-right text-[11px] font-black text-slate-900">{pct.toFixed(0)}%</span></div>; })}{!origenStats.length ? <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-400">Sin datos de origen.</div> : null}</div></section>
            <section><h4 className="mb-3 text-sm font-black text-slate-950">Leads descartados</h4><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setShowDiscardDetails((value) => !value)} className="rounded-xl bg-slate-50 p-4 text-left transition hover:bg-slate-100"><div className="text-xs text-slate-500">Total descartados</div><div className="mt-1 text-3xl font-black text-slate-950">{metricas.descartados}</div><div className="mt-2 text-[10px] font-bold text-[#131E5C]">{showDiscardDetails ? "Ocultar motivos" : "Ver todos los motivos"}</div></button><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Principal motivo</div><div className="mt-1 line-clamp-2 text-xl font-black text-slate-950">{principalDescarte[0]}</div><div className="mt-1 text-xs text-slate-500">{principalDescarte[1]} leads</div></div></div>{showDiscardDetails && motivosDescarte.length ? <div className="mt-3 space-y-3 rounded-xl border border-slate-200 p-4">{motivosDescarte.map(([label, total]) => <div key={label}><div className="mb-1 flex items-center justify-between gap-3 text-[10px]"><span className="truncate font-semibold text-slate-600" title={label}>{label}</span><span className="font-black text-slate-900">{total}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cls("h-full rounded-full bg-slate-500", widthClass((total / maxMotivo) * 100))} /></div></div>)}</div> : null}</section>
        </div>
    </div>;
}

function getListItems(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
}
