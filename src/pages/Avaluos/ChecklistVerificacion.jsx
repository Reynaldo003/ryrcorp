import { useEffect, useMemo, useState } from "react";
import {
    Armchair,
    Camera,
    Car,
    CarFront,
    Check,
    CircleDot,
    Cog,
    Droplet,
    FileText,
    Route,
    Wrench,
} from "lucide-react";


const TIPOS_DANO = [
    { key: "abolladura", label: "Abolladura", color: "bg-red-500" },
    { key: "huella", label: "Huella", color: "bg-orange-400" },
    { key: "oxido", label: "Óxido", color: "bg-orange-600" },
    { key: "aranazo", label: "Arañazo", color: "bg-sky-500" },
    { key: "grieta", label: "Grieta/fisura", color: "bg-emerald-500" },
    { key: "inestanco", label: "Inestanco", color: "bg-neutral-800" },
    { key: "impacto", label: "Impacto de piedras", color: "bg-violet-500" },
];

// La app se sirve bajo base "/crm/" (vite.config.js), así que las rutas a
// public/ deben llevar el prefijo BASE_URL o el navegador pide /checklist/...
// en la raíz del dominio y la imagen da 404.
const imgChecklist = (nombre) => `${import.meta.env.BASE_URL}checklist/${nombre}`;

const VISTAS_AUTO = [
    { key: "superior", label: "Vista superior", src: `${import.meta.env.BASE_URL}checklist/vista_arriba.png` },
    { key: "lateral", label: "Vista lateral", src: imgChecklist("vista-lateral-izq.png") },
    { key: "frontal", label: "Vista frontal", src: imgChecklist("vista-frontal.png") },
    { key: "trasera", label: "Vista trasera", src: imgChecklist("vista-trasera.png") },
];

const NEUMATICOS = [
    { key: "di", label: "Delantera izquierda" },
    { key: "dd", label: "Delantera derecha" },
    { key: "ti", label: "Trasera izquierda" },
    { key: "td", label: "Trasera derecha" },
];

// ── Lista oficial VW CPO 114 puntos (secciones C–I). ──
// A y B son de ejemplo (el documento CPO no los incluye): indique si se
// quitan o qué contenido llevan.
const CHECKLIST_DATA = [
    {
        key: "A",
        titulo: "Datos del vehículo",
        icon: CarFront,
        conDatos: true,
        puntos: [],
        campos: [
            { key: "numInterno", label: "Número interno del vehículo", tipo: "text", placeholder: "Ej. INT-001" },
            { key: "matricula", label: "Matrícula", tipo: "text", placeholder: "Ej. ABC-123-D" },
            { key: "vinCampo", label: "Número de identificación del vehículo", tipo: "text", placeholder: "VIN de 17 caracteres" },
            { key: "fecha", label: "Fecha", tipo: "date" },
            { key: "modeloTipo", label: "Modelo / Tipo", tipo: "text", autoDe: "modelo" },
            { key: "km", label: "KM", tipo: "text", autoDe: "km" },
            { key: "fechaPrimera", label: "Fecha de primera matriculación", tipo: "date" },
            { key: "ordenRep", label: "Orden de Reparación", tipo: "text", placeholder: "Ej. OR-2024-001" },
        ],
    },
    {
        key: "B",
        titulo: "Documentación",
        icon: FileText,
        conChecklist: true,
        puntos: [
            { num: "B1", texto: "Documentos (Factura de Origen, Alta/Baja de placas, Tenencias)" },
            { num: "B2", texto: "Consulta Reporte de Robo (PGJ/OCRA)" },
            { num: "B3", texto: "Documentos de Matriculación" },
            { num: "B4", texto: "Ninguna acción de servicio pendiente (campañas)" },
            { num: "B5", texto: "Cuadernillo de garantía y mantenimiento" },
            { num: "B6", texto: "Elaborar el protocolo de análisis del vehículo." },
            { num: "B7", texto: "Manual de instrucciones." },
            { num: "B8", texto: "Comprobar verosimilitud del cuentakilómetros." },
            { num: "B9", texto: "Manual de radio/sistema de navegación" },
            { num: "B10", texto: "Sustitución de cuadro de instrumentos", conFechaKm: true },
            { num: "B11", texto: "Código de radio", conTexto: true, placeholder: "Código" },
            { num: "B12", texto: "Reparación por accidente", conFechaKm: true },
            { num: "B13", texto: "Versión de navegación", conTexto: true, placeholder: "Versión" },
            { num: "B14", texto: "Justificante de sustitución de motor", conFechaKm: true },
            { num: "B15", texto: "Número de llaves", conTexto: true, placeholder: "Ej. 2" },
            { num: "B16", texto: "Sustitución de caja de cambios", conFechaKm: true },
            { num: "B17", texto: "Herramientas de abordo", subChecks: ["gato", "botiquin", "compresor", "birlo", "llanta de refaccion", "Triangulo de emergencia", "herramienta", "juego de reparacion"] },
            { num: "B18", texto: "Análisis general", conFecha: true },
            { num: "B19", texto: "Análisis de gases de escape", conFecha: true },
            { num: "B20", texto: "Todos los mantenimientos realizados en concesionario (marca correspondiente)." },
            { num: "B21", texto: "Ausencia de piezas adosadas ajenas en el vehículo" },
        ],
    },
    {
        key: "C",
        titulo: "Exterior del vehículo (funcionamiento y estado)",
        icon: Car,
        conDiagrama: true,
        puntos: [
            { num: 1, texto: "Carrocería / Capota Cabrio" },
            { num: 2, texto: "Pintura" },
            { num: 3, texto: "Puertas / Capó" },
            { num: 4, texto: "Alumbrado exterior" },
            { num: 5, texto: "Regulador de altura de los faros" },
            { num: 6, texto: "Faros y bombilla" },
            { num: 7, texto: "Bajos" },
            { num: 8, texto: "Llantas" },
            { num: 9, texto: "Enganche de remolque" },
            { num: 10, texto: "Spoiler" },
            { num: 11, texto: "Tequipment / Exclusive" },
        ],
    },
    {
        key: "D",
        titulo: "Ruedas y neumáticos",
        icon: CircleDot,
        conNeumaticos: true,
        nota: "Los neumáticos deben corresponder al índice de velocidad, carga y especificaciones recomendadas. Antigüedad máxima: 6 años (verano) y 4 años (invierno).",
        puntos: [
            { num: 12, texto: "Profundidad de dibujo del neumático, mínimo 4 mm" },
            { num: 13, texto: "Homologación de neumáticos" },
            { num: 14, texto: "Dimensión de neumáticos" },
            { num: 15, texto: "Marca" },
            { num: 16, texto: "DOT" },
            { num: 17, texto: "Presión de neumáticos" },
            { num: 18, texto: "Sistema de control de presión de neumáticos" },
        ],
    },
    {
        key: "E",
        titulo: "Sistema de propulsión / bajos",
        icon: Cog,
        puntos: [
            { num: 19, texto: "Sistema de gases de escape", detalle: ["Tubo de escape sin fugas.", "Catalizador en buenas condiciones.", "Silenciador sin fugas."] },
            { num: 20, texto: "Chasis / suspensión de ruedas —amortiguadores y muelles—" },
            { num: 21, texto: "Suspensión neumática", detalle: ["Bujes de orquilla.", "Brazos de suspensión.", "Amortiguadores."] },
            { num: 22, texto: "Cojinetes de barra estabilizadora" },
            { num: 23, texto: "Articulación de eje" },
            { num: 24, texto: "Ejes motrices" },
            { num: 25, texto: "Caja de transferencia" },
            { num: 26, texto: "Caja de dirección" },
            { num: 27, texto: "Cojinete de rueda" },
            { num: 28, texto: "Tuberías / latiguillos de freno" },
            { num: 29, texto: "Pastillas de freno —máximo 50 % de desgaste y grosor mínimo de 4 mm—" },
            { num: 30, texto: "Discos de freno —menos de 1 mm de desgaste—" },
            { num: 31, texto: "Cilindro / mordaza de freno / conducciones de aire / chapas cobertoras" },
            { num: 32, texto: "Sistema de combustible" },
            { num: 33, texto: "Radiador / ventilador" },
            { num: 34, texto: "Tuberías de radiador —fugas—" },
        ],
    },
    {
        key: "F",
        titulo: "Compartimiento del motor",
        icon: Wrench,
        puntos: [
            { num: 35, texto: "Sistema de encendido" },
            { num: 36, texto: "Alternador / tensión a bordo" },
            { num: 37, texto: "Compresor del sistema de aire acondicionado" },
            { num: 38, texto: "Correas / bandas", detalle: ["Banda de distribución.", "Banda de accesorios."] },
            { num: 39, texto: "Motor —sin deficiencias visibles, pérdidas de líquido o inestanqueidades—", detalle: ["Presencia de fugas.", "Ruido anormal en frío / al arranque.", "Ruido anormal en caliente."] },
            { num: 40, texto: "Conexiones y fusibles" },
            { num: 41, texto: "Batería", subCampos: [{ key: "carga", label: "Estado de carga/tensión", placeholder: "Ej. 12.6 V" }, { key: "potencia", label: "Funcionamiento/Potencia", placeholder: "Ej. OK" }] },
            { num: 42, texto: "Batería adicional" },
        ],
    },
    {
        key: "G",
        titulo: "Líquidos",
        icon: Droplet,
        puntos: [
            { num: 43, texto: "Batería" },
            { num: 44, texto: "Batería adicional" },
            { num: 45, texto: "Aceite de motor", detalle: ["Nivel de depósito de aceite.", "Prueba de degradación de aceite.", "Presencia de partículas metálicas.", "Contaminación del aceite."] },
            { num: 46, texto: "Barra estabilizadora todo terreno" },
            { num: 47, texto: "Aceite del diferencial del eje delantero / trasero" },
            { num: 48, texto: "Aceite de la caja de cambio", detalle: ["Presencia de partículas metálicas.", "Contaminación del aceite."] },
            { num: 49, texto: "Líquido de refrigeración / protección anticongelante" },
            { num: 50, texto: "Aceite hidráulico de la servodirección" },
            { num: 51, texto: "Líquido de frenos / líquido de embrague" },
            { num: 52, texto: "Líquido lavaparabrisas y lavafaros" },
        ],
    },
    {
        key: "H",
        titulo: "Habitáculo interior",
        icon: Armchair,
        puntos: [
            { num: 53, texto: "Sistema de cierre de puertas —seguro infantil—" },
            { num: 54, texto: "Mando a distancia" },
            { num: 55, texto: "Sistema de alarma e inmovilizador" },
            { num: 56, texto: "Encendido / cerradura de encendido" },
            { num: 57, texto: "Bloqueo del volante" },
            { num: 58, texto: "Bocina" },
            { num: 59, texto: "Sistema de airbags —desactivación para asiento infantil—" },
            { num: 60, texto: "Limpiaparabrisas delantero / trasero" },
            { num: 61, texto: "Sistema limpia-lavafaros y limpiaparabrisas" },
            { num: 62, texto: "Ajuste de la columna de dirección", detalle: ["Presencia de ruido anormal."] },
            { num: 63, texto: "Cinturones de seguridad y ajuste de altura de los cinturones" },
            { num: 64, texto: "Ajuste de asientos / memoria de posición / asientos calefactables", detalle: ["Ruido anormal en la estructura del asiento.", "Ruido anormal al mover el asiento.", "Condición de la tapicería."] },
            { num: 65, texto: "Acolchado de asiento y reposacabezas" },
            { num: 66, texto: "Viseras parasol" },
            { num: 67, texto: "Galería de techo" },
            { num: 68, texto: "Alfombrillas y moqueta" },
            { num: 69, texto: "Revestimiento interior y espacio de equipajes" },
            { num: 70, texto: "Guantera" },
            { num: 71, texto: "Sujetavasos" },
            { num: 72, texto: "Cenicero" },
            { num: 73, texto: "Encendedor / tomas de corriente de 12 V" },
            { num: 74, texto: "Cuadro de instrumentos —inspección en parado—" },
            { num: 75, texto: "Testigos y señales de aviso" },
            { num: 76, texto: "Reloj de a bordo" },
            { num: 77, texto: "Ordenador de a bordo" },
            { num: 78, texto: "Sistema de alta fidelidad —altavoces—" },
            { num: 79, texto: "PCM —radio, teléfono, sistema de navegación—" },
            { num: 80, texto: "Entrada USB" },
            { num: 81, texto: "Iluminación interior" },
            { num: 82, texto: "Calefacción, ventilación, AC/AC" },
            { num: 83, texto: "Ajuste de retrovisores exteriores / interiores" },
            { num: 84, texto: "Elevalunas —función de retroceso—" },
            { num: 85, texto: "Desbloqueo de capós —delantero / trasero—" },
            { num: 86, texto: "Techo —Cabriolet / techo corredizo—" },
            { num: 87, texto: "Cabriolet: panel cortaviento" },
            { num: 88, texto: "Equipamiento Tequipment / Exclusive" },
        ],
    },
    {
        key: "I",
        titulo: "Recorrido de prueba",
        icon: Route,
        puntos: [
            { num: 89, texto: "Comportamiento de arranque", detalle: ["Arranque en frío.", "Arranque en caliente."] },
            { num: 90, texto: "Efecto de freno —freno de pie y freno de mano—" },
            { num: 91, texto: "ABS" },
            { num: 92, texto: "Sistema de suspensión", detalle: ["Ruido extraño al circular en terreno irregular.", "Ruido extraño al pasar baches y/o topes."] },
            { num: 93, texto: "PASM / suspensión neumática" },
            { num: 94, texto: "Sistema electrónico de estabilidad —PSM, etc.—" },
            { num: 95, texto: "Servodirección / Servotronic" },
            { num: 96, texto: "Centraje del volante" },
            { num: 97, texto: "Circulación en línea recta" },
            { num: 98, texto: "Comportamiento / maniobrabilidad en circulación" },
            { num: 99, texto: "Prestaciones del vehículo" },
            { num: 100, texto: "Holgura del embrague" },
            { num: 101, texto: "Cambio de marcha" },
            { num: 102, texto: "Calefacción adicional" },
            { num: 103, texto: "Sistema de calefacción / ventilación / aire acondicionado" },
            { num: 104, texto: "Luneta y retrovisores calefactables" },
            { num: 105, texto: "Parkassistent / cámara de visión trasera" },
            { num: 106, texto: "PCM —radio, teléfono, CD, DVD, sistema de navegación—" },
            { num: 107, texto: "Control de velocidad —todas las funciones—" },
            { num: 108, texto: "Bloqueos del diferencial / tracción total" },
            { num: 109, texto: "Cuadro de instrumentos —en circulación—" },
            { num: 110, texto: "Ausencia de ruidos extraños / vibraciones" },
            { num: 111, texto: "Comportamiento de arranque en caliente / al ralentí" },
            { num: 112, texto: "Ruidos extraños al viraje brusco del volante" },
            { num: 113, texto: "Ruidos extraños al virar en “U”" },
            { num: 114, texto: "Prueba de crucero para detección de humos —blanco, azul o negro—" },
        ],
    },
];

function Segmentado({ value, onChange }) {
    const base =
        "min-w-[38px] rounded-md border px-2 py-1 text-xs font-extrabold transition";
    return (
        <div className="flex items-center justify-center gap-1">
            <button
                type="button"
                onClick={() => onChange(value === "P" ? null : "P")}
                className={[
                    base,
                    value === "P"
                        ? "border-emerald-600 bg-emerald-500 text-white"
                        : "border-slate-200 bg-white text-slate-400 hover:border-emerald-400",
                ].join(" ")}
                title="En perfecto estado"
            >
                P
            </button>
            <button
                type="button"
                onClick={() => onChange(value === "O" ? null : "O")}
                className={[
                    base,
                    value === "O"
                        ? "border-red-600 bg-red-500 text-white"
                        : "border-slate-200 bg-white text-slate-400 hover:border-red-400",
                ].join(" ")}
                title="Defectuoso"
            >
                O
            </button>
            <button
                type="button"
                onClick={() => onChange(value === "NA" ? null : "NA")}
                className={[
                    base,
                    value === "NA"
                        ? "border-slate-500 bg-slate-400 text-white"
                        : "border-slate-200 bg-white text-slate-400 hover:border-slate-400",
                ].join(" ")}
                title="No aplicable"
            >
                NA
            </button>
        </div>
    );
}

function ImagenGuia({ src, label, className = "" }) {
    const [fallo, setFallo] = useState(false);
    if (fallo) {
        return (
            <div
                className={[
                    "flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#131E5C]/25 bg-[#131E5C]/5 px-3 py-6 text-center",
                    className,
                ].join(" ")}
            >
                <Camera className="h-6 w-6 text-[#131E5C]/40" />
                <div className="text-xs font-extrabold text-[#131E5C]">{label}</div>
                <div className="font-mono text-[10px] font-semibold text-slate-400">
                    Falta: {src}
                </div>
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={label}
            onError={() => setFallo(true)}
            className={["rounded-xl object-contain", className].join(" ")}
        />
    );
}

export default function ChecklistVerificacion({ info = {}, value = null, onChange = null }) {
    const data = value && typeof value === "object" ? value : {};

    const [seccionActiva, setSeccionActiva] = useState("C");
    const [estados, setEstados] = useState(() => (data.estados && typeof data.estados === "object" ? data.estados : {}));
    const [comentarios, setComentarios] = useState(() => (data.comentarios && typeof data.comentarios === "object" ? data.comentarios : {}));
    const [datosVehiculo, setDatosVehiculo] = useState(() => (data.datosVehiculo && typeof data.datosVehiculo === "object" ? data.datosVehiculo : {}));
    const [danosAnteriores, setDanosAnteriores] = useState(data.danosAnteriores ?? null);
    const [folio, setFolio] = useState(data.folio || info.folio || "");
    const [vinEdit, setVinEdit] = useState(data.vin || info.vin || "");
    const [vistaAuto, setVistaAuto] = useState("superior");
    const [mediciones, setMediciones] = useState(() => (data.mediciones && typeof data.mediciones === "object" ? data.mediciones : {}));

    // El snapshot viaja al padre (draft.checklist_cpo) para guardarse en BD
    // junto con el avalúo. El padre pasa onChange estable (useCallback).
    useEffect(() => {
        onChange?.({
            estados,
            comentarios,
            datosVehiculo,
            danosAnteriores,
            folio,
            vin: vinEdit,
            mediciones,
        });
    }, [onChange, estados, comentarios, datosVehiculo, danosAnteriores, folio, vinEdit, mediciones]);

    const setPunto = (puntoId, campo, valor) => {
        setEstados((prev) => ({
            ...prev,
            [puntoId]: { ...prev[puntoId], [campo]: valor },
        }));
    };

    const toggleSub = (puntoId, nombre) => {
        setEstados((prev) => ({
            ...prev,
            [puntoId]: {
                ...prev[puntoId],
                subs: { ...prev[puntoId]?.subs, [nombre]: !prev[puntoId]?.subs?.[nombre] },
            },
        }));
    };

    const marcarSeccion = (valor) => {
        setEstados((prev) => {
            const next = { ...prev };
            (seccion?.puntos || []).forEach((p) => {
                const id = `${seccion.key}${p.num}`;
                if (seccion?.conChecklist) {
                    const tieneInput = !!(p.conFechaKm || p.conFecha || p.conTexto || Array.isArray(p.subChecks));
                    if (valor === "P") next[id] = { ...next[id], check: true, na: false };
                    else if (valor === "O") next[id] = { ...next[id], check: false, na: false };
                    else if (valor === "NA" && tieneInput) next[id] = { ...next[id], na: true };
                    else if (valor === "X") {
                        if (seccion?.conChecklist) {
                            const keep = {};
                            ["fecha", "km", "texto"].forEach((k) => {
                                if (next[id]?.[k] !== undefined) keep[k] = next[id][k];
                            });
                            next[id] = keep;
                        } else {
                            next[id] = { ...next[id], primer: null, final: null };
                        }
                    }
                } else {
                    next[id] = { ...next[id], primer: valor, final: valor };
                }
            });
            return next;
        });
    };

    const resumen = useMemo(() => {
        let total = 0;
        let hechos = 0;
        const porSeccion = {};
        CHECKLIST_DATA.forEach((sec) => {
            const ids = (sec.puntos || []).map((p) => `${sec.key}${p.num}`);
            const hechosSec = ids.filter((id) =>
                sec.conChecklist ? (estados[id]?.check || estados[id]?.na) : estados[id]?.final
            ).length;
            porSeccion[sec.key] = { total: ids.length, hechos: hechosSec };
            total += ids.length;
            hechos += hechosSec;
        });
        return { total, hechos, porSeccion, pct: total ? Math.round((hechos / total) * 100) : 0 };
    }, [estados]);

    const seccion = CHECKLIST_DATA.find((s) => s.key === seccionActiva);
    const vistaActual = VISTAS_AUTO.find((v) => v.key === vistaAuto);

    return (
        <div className="space-y-3">
            {/* ── Encabezado ── */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <h3 className="text-base font-extrabold text-[#131E5C]">
                    Checklist de revisión y certificación
                </h3>
                <span className="rounded-full bg-[#131E5C]/10 px-3 py-1 text-xs font-bold text-[#131E5C]">
                    {resumen.total} puntos
                </span>
                <div className="ml-auto flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">
                        {resumen.pct}% completado
                    </span>
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${resumen.pct}%` }}
                        />
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-xs font-extrabold text-white" title="En perfecto estado">P</span>
                    <span className="text-[11px] font-semibold text-slate-500">En perfecto estado</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-red-500 px-2 py-1 text-xs font-extrabold text-white" title="Defectuoso">O</span>
                    <span className="text-[11px] font-semibold text-slate-500">Defectuoso</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-400 px-2 py-1 text-xs font-extrabold text-white" title="No aplicable">NA</span>
                    <span className="text-[11px] font-semibold text-slate-500">No aplicable</span>
                </div>
            </div>

            {/* ── Datos del vehículo ── */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:grid-cols-5">
                <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Folio</div>
                    <input
                        value={folio}
                        onChange={(e) => setFolio(e.target.value)}
                        placeholder="UC-2024-00125"
                        className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-extrabold text-[#131E5C] outline-none placeholder:text-slate-300 focus:border-[#131E5C]/40"
                    />
                </div>
                <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">VIN</div>
                    <input
                        value={vinEdit}
                        onChange={(e) => setVinEdit(e.target.value)}
                        placeholder="WWWWZZZ1KZRZ123456"
                        className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-extrabold text-[#131E5C] outline-none placeholder:text-slate-300 focus:border-[#131E5C]/40"
                    />
                </div>
                {[
                    { label: "Modelo / Tipo", value: info.modelo || "—" },
                    { label: "KM", value: info.km || "—" },
                    { label: "Cliente", value: info.cliente || "—" },
                ].map((d) => (
                    <div key={d.label} className="min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{d.label}</div>
                        <div className="truncate py-1.5 text-sm font-extrabold text-[#131E5C]">{d.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-3 xl:grid-cols-[240px_minmax(0,1fr)]">
                {/* ── Lateral de secciones ── */}
                <div className="space-y-2">
                    {CHECKLIST_DATA.map((sec) => {
                        const Icon = sec.icon;
                        const r = resumen.porSeccion[sec.key];
                        const completa = r.hechos === r.total && r.total > 0;
                        const activa = sec.key === seccionActiva;
                        return (
                            <button
                                key={sec.key}
                                type="button"
                                onClick={() => setSeccionActiva(sec.key)}
                                className={[
                                    "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition",
                                    activa
                                        ? "border-[#131E5C] bg-[#131E5C] text-white shadow"
                                        : "border-slate-200 bg-white text-[#131E5C] hover:border-[#131E5C]/40",
                                ].join(" ")}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="min-w-0 flex-1 truncate text-xs font-bold">
                                    {sec.key}. {sec.titulo}
                                </span>
                                <span className={["text-[11px] font-bold", activa ? "text-white/80" : "text-slate-400"].join(" ")}>
                                    {r.total > 0 ? `${r.hechos}/${r.total}` : "datos"}
                                </span>
                                {completa ? (
                                    <Check className="h-4 w-4 text-emerald-400" />
                                ) : r.hechos > 0 ? (
                                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                ) : (
                                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Panel de sección ── */}
                <div className="min-w-0 space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                            {seccion?.icon ? <seccion.icon className="h-5 w-5 text-[#131E5C]" /> : null}
                            <span className="text-sm font-extrabold text-[#131E5C]">
                                {seccion?.key}. {seccion?.titulo}
                            </span>
                            <span className="ml-auto text-xs font-bold text-slate-400">
                                {resumen.porSeccion[seccionActiva]?.hechos} de{" "}
                                {resumen.porSeccion[seccionActiva]?.total} completados
                            </span>
                        </div>

                        {seccion?.nota ? (
                            <div className="border-b border-slate-100 px-4 py-2.5">
                                <div className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold leading-5 text-sky-900">
                                    {seccion.nota}
                                </div>
                            </div>
                        ) : null}

                        {/* Tarjetas de neumáticos (solo sección D) */}
                        {seccion?.conNeumaticos ? (
                            <div className="grid grid-cols-2 gap-3 border-b border-slate-100 px-4 py-3 lg:grid-cols-4">
                                {NEUMATICOS.map((n) => (
                                    <div key={n.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                                        <div className="text-xs font-extrabold text-[#131E5C]">{n.label}</div>
                                        <div className="mt-2 text-left text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                                            Profundidad (mm)
                                        </div>
                                        {[
                                            { suf: "ext", label: "Lateral exterior" },
                                            { suf: "cen", label: "Centro" },
                                            { suf: "int", label: "Lateral interior" },
                                        ].map((m) => (
                                            <div key={m.suf} className="mt-1 flex items-center gap-1.5">
                                                <span className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold text-slate-500">{m.label}</span>
                                                <input
                                                    value={mediciones[`${n.key}-${m.suf}`] || ""}
                                                    onChange={(e) => setMediciones((p) => ({ ...p, [`${n.key}-${m.suf}`]: e.target.value }))}
                                                    placeholder="mm"
                                                    inputMode="decimal"
                                                    className="w-16 shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-bold text-[#131E5C] outline-none placeholder:text-slate-300"
                                                />
                                            </div>
                                        ))}
                                        <input
                                            value={mediciones[`${n.key}-bar`] || ""}
                                            onChange={(e) => setMediciones((p) => ({ ...p, [`${n.key}-bar`]: e.target.value }))}
                                            placeholder="bar"
                                            inputMode="decimal"
                                            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-bold text-[#131E5C] outline-none placeholder:text-slate-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {seccion?.key === "C" ? (
                            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-2.5">
                                <span className="text-[13px] font-bold text-[#131E5C]">
                                    ¿Hay daños reconocibles en el vehículo de daños anteriores?
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {["Si", "No"].map((op) => (
                                        <button
                                            key={op}
                                            type="button"
                                            onClick={() => setDanosAnteriores(danosAnteriores === op ? null : op)}
                                            className={[
                                                "rounded-lg px-4 py-1.5 text-xs font-extrabold transition",
                                                danosAnteriores === op
                                                    ? "bg-[#131E5C] text-white"
                                                    : "border border-slate-200 bg-white text-slate-500 hover:border-[#131E5C]/40",
                                            ].join(" ")}
                                        >
                                            {op === "Si" ? "Sí" : op}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {!seccion?.conDatos ? (
                        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5">
                            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                Marcar sección:
                            </span>
                            <button
                                type="button"
                                onClick={() => marcarSeccion("P")}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-600"
                            >
                                {seccion?.conChecklist ? (
                                    <>
                                        <Check className="h-3.5 w-3.5" />
                                        Verificado
                                    </>
                                ) : (
                                    <>
                                        <span className="rounded bg-white/25 px-1">P</span>
                                        En perfecto estado
                                    </>
                                )}
                            </button>
                            {seccion?.conChecklist ? null : (
                            <button
                                type="button"
                                onClick={() => marcarSeccion("O")}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-red-600"
                            >
                                <span className="rounded bg-white/25 px-1">O</span>
                                Defectuoso
                            </button>
                            )}
                            <button
                                type="button"
                                onClick={() => marcarSeccion("NA")}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-400 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-slate-500"
                            >
                                <span className="rounded bg-white/25 px-1">NA</span>
                                No aplicable
                            </button>
                            <button
                                type="button"
                                onClick={() => marcarSeccion("X")}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-500 hover:border-red-300 hover:text-red-600"
                            >
                                Limpiar selección
                            </button>
                        </div>
                        ) : null}

                        {seccion?.conDatos ? (
                        <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
                            {(seccion.campos || []).map((c) => {
                                const valorAuto =
                                    c.autoDe === "km"
                                        ? (info.km || "")
                                        : c.autoDe === "modelo"
                                            ? (info.modelo || "")
                                            : null;
                                // El VIN de la tira superior y el de Datos del
                                // vehículo son el mismo: comparten estado.
                                const esVin = c.key === "vinCampo";
                                return (
                                <div key={c.key} className="min-w-0">
                                    <div className="mb-1.5 text-xs font-extrabold text-[#131E5C]">
                                        {c.label}
                                    </div>
                                    <input
                                        type={c.tipo === "date" ? "date" : "text"}
                                        value={valorAuto !== null ? valorAuto : (esVin ? vinEdit : (datosVehiculo[c.key] ?? ""))}
                                        readOnly={valorAuto !== null}
                                        onChange={(e) => esVin ? setVinEdit(e.target.value) : setDatosVehiculo((p) => ({ ...p, [c.key]: e.target.value }))}
                                        placeholder={c.placeholder || ""}
                                        className={[
                                            "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-300 focus:border-[#131E5C]/40",
                                            valorAuto !== null ? "cursor-not-allowed bg-slate-100" : "",
                                        ].join(" ")}
                                    />
                                </div>
                                );
                            })}
                        </div>
                        ) : (
                        <>
                        {/* Tabla de puntos + vista lateral fija */}
                        <div className={seccion?.conDiagrama ? "grid lg:grid-cols-[minmax(0,1fr)_420px]" : ""}>
                        <div className="min-w-0 overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    {seccion?.conChecklist ? (
                                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                                        <th className="px-4 py-2 font-bold">Elemento</th>
                                        <th className="px-4 py-2 text-center font-bold">Verificado</th>
                                    </tr>
                                    ) : (
                                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                                        <th className="px-4 py-2 font-bold">Elemento</th>
                                        <th className="px-4 py-2 text-center font-bold">Primer control</th>
                                        <th className="px-4 py-2 text-center font-bold">Estado definitivo</th>
                                    </tr>
                                    )}
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {seccion?.puntos.map((p) => {
                                        const id = `${seccion.key}${p.num}`;
                                        const est = estados[id] || {};
                                        if (seccion?.conChecklist) {
                                            const tieneInput = !!(p.conFechaKm || p.conFecha || p.conTexto || Array.isArray(p.subChecks));
                                            const esNA = !!est.na;
                                            const claseNA = [
                                                "rounded-md border px-2 py-1.5 text-[11px] font-extrabold transition",
                                                esNA
                                                    ? "border-slate-500 bg-slate-400 text-white"
                                                    : "border-slate-200 bg-white text-slate-400 hover:border-slate-400",
                                            ].join(" ");
                                            return (
                                            <tr key={id} className="hover:bg-slate-50">
                                                <td className="px-4 py-2.5">
                                                    <span className="mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1 text-[10px] font-extrabold text-slate-500">
                                                        {p.num}
                                                    </span>
                                                    <span className="text-[13px] font-semibold text-[#131E5C]">{p.texto}</span>
                                                    {p.conFechaKm ? (
                                                        <div className="ml-7 mt-1.5 flex flex-wrap items-center gap-2">
                                                            <label className="text-[11px] font-bold text-slate-400">Fecha</label>
                                                            <input
                                                                type="date"
                                                                value={est.fecha || ""}
                                                                disabled={esNA}
                                                                onChange={(e) => setPunto(id, "fecha", e.target.value)}
                                                                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-[#131E5C] outline-none focus:border-[#131E5C]/40 disabled:cursor-not-allowed disabled:opacity-50"
                                                            />
                                                            <label className="text-[11px] font-bold text-slate-400">KM</label>
                                                            <input
                                                                value={est.km || ""}
                                                                disabled={esNA}
                                                                onChange={(e) => setPunto(id, "km", e.target.value)}
                                                                placeholder="km"
                                                                inputMode="numeric"
                                                                className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-[#131E5C] outline-none placeholder:text-slate-300 focus:border-[#131E5C]/40 disabled:cursor-not-allowed disabled:opacity-50"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setPunto(id, "na", !esNA)}
                                                                className={claseNA}
                                                                title="No aplicable"
                                                            >
                                                                N/A
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                    {p.conFecha && !p.conFechaKm ? (
                                                        <div className="ml-7 mt-1.5 flex items-center gap-2">
                                                            <label className="text-[11px] font-bold text-slate-400">Fecha</label>
                                                            <input
                                                                type="date"
                                                                value={est.fecha || ""}
                                                                disabled={esNA}
                                                                onChange={(e) => setPunto(id, "fecha", e.target.value)}
                                                                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-[#131E5C] outline-none focus:border-[#131E5C]/40 disabled:cursor-not-allowed disabled:opacity-50"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setPunto(id, "na", !esNA)}
                                                                className={claseNA}
                                                                title="No aplicable"
                                                            >
                                                                N/A
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                    {p.conTexto ? (
                                                        <div className="ml-7 mt-1.5 flex items-center gap-2">
                                                            <input
                                                                value={est.texto || ""}
                                                                disabled={esNA}
                                                                onChange={(e) => setPunto(id, "texto", e.target.value)}
                                                                placeholder={p.placeholder || ""}
                                                                className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-[#131E5C] outline-none placeholder:text-slate-300 focus:border-[#131E5C]/40 disabled:cursor-not-allowed disabled:opacity-50"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setPunto(id, "na", !esNA)}
                                                                className={claseNA}
                                                                title="No aplicable"
                                                            >
                                                                N/A
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                    {Array.isArray(p.subChecks) ? (
                                                        <div className="ml-7 mt-1.5 flex flex-wrap gap-1.5">
                                                            {p.subChecks.map((s) => {
                                                                const on = !!est.subs?.[s] && !esNA;
                                                                return (
                                                                    <button
                                                                        key={s}
                                                                        type="button"
                                                                        disabled={esNA}
                                                                        onClick={() => toggleSub(id, s)}
                                                                        className={[
                                                                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                                                                            on
                                                                                ? "border-emerald-600 bg-emerald-500 text-white"
                                                                                : "border-slate-200 bg-white text-slate-500 hover:border-emerald-400",
                                                                        ].join(" ")}
                                                                    >
                                                                        {on ? <Check className="h-3 w-3" /> : null}
                                                                        {s}
                                                                    </button>
                                                                );
                                                            })}
                                                            <button
                                                                type="button"
                                                                onClick={() => setPunto(id, "na", !esNA)}
                                                                className={claseNA}
                                                                title="No aplicable"
                                                            >
                                                                N/A
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-2.5 text-center align-top">
                                                    {tieneInput ? null : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPunto(id, "check", !est.check)}
                                                        className={[
                                                            "inline-flex h-6 w-6 items-center justify-center rounded-md border-2 transition",
                                                            est.check
                                                                ? "border-emerald-600 bg-emerald-500 text-white"
                                                                : "border-slate-300 bg-white text-transparent hover:border-emerald-400",
                                                        ].join(" ")}
                                                        title="Marcar verificado"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    )}
                                                </td>
                                            </tr>
                                            );
                                        }
                                        return (
                                            <tr key={id} className="hover:bg-slate-50">
                                                <td className="px-4 py-2.5">
                                                    <span className="mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1 text-[10px] font-extrabold text-slate-500">
                                                        {p.num}
                                                    </span>
                                                    <span className="text-[13px] font-semibold text-[#131E5C]">{p.texto}</span>
                                                    {Array.isArray(p.detalle) && p.detalle.length > 0 ? (
                                                        <ul className="ml-7 mt-1 list-disc space-y-0.5">
                                                            {p.detalle.map((d) => (
                                                                <li key={d} className="text-xs font-normal text-slate-500">{d}</li>
                                                            ))}
                                                        </ul>
                                                    ) : null}
                                                    {Array.isArray(p.subCampos) && p.subCampos.length > 0 ? (
                                                        <div className="ml-7 mt-1.5 grid gap-1.5 sm:grid-cols-2">
                                                            {p.subCampos.map((sc) => (
                                                                <div key={sc.key}>
                                                                    <div className="mb-0.5 text-[11px] font-bold text-slate-400">{sc.label}</div>
                                                                    <input
                                                                        value={est[sc.key] || ""}
                                                                        onChange={(e) => setPunto(id, sc.key, e.target.value)}
                                                                        placeholder={sc.placeholder || ""}
                                                                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-[#131E5C] outline-none placeholder:text-slate-300 focus:border-[#131E5C]/40"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <Segmentado value={est.primer} onChange={(v) => setPunto(id, "primer", v)} />
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <Segmentado value={est.final} onChange={(v) => setPunto(id, "final", v)} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {seccion?.conDiagrama ? (
                            <aside className="min-w-0 border-t border-slate-100 px-4 py-3 lg:border-l lg:border-t-0">
                                <div className="space-y-2 lg:sticky lg:top-2">
                                    <div className="text-xs font-extrabold text-[#131E5C]">
                                        Vista del vehículo
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {VISTAS_AUTO.map((v) => (
                                            <button
                                                key={v.key}
                                                type="button"
                                                onClick={() => setVistaAuto(v.key)}
                                                className={[
                                                    "rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition",
                                                    vistaAuto === v.key
                                                        ? "bg-[#131E5C] text-white"
                                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                                                ].join(" ")}
                                            >
                                                {v.label}
                                            </button>
                                        ))}
                                    </div>
                                    <ImagenGuia
                                        key={vistaActual.src}
                                        src={vistaActual.src}
                                        label={vistaActual.label}
                                        className="mx-auto max-h-[26rem] w-full"
                                    />
                                    <div className="flex flex-wrap gap-x-2 gap-y-1">
                                        {TIPOS_DANO.map((t) => (
                                            <span key={t.key} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                                <span className={["inline-block h-2.5 w-2.5 rounded-full", t.color].join(" ")} />
                                                {t.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </aside>
                        ) : null}
                        </div>
                        </>)}

                        {/* Comentarios de la sección */}
                        <div className="border-t border-slate-100 px-4 py-3">
                            <div className="mb-1.5 text-xs font-extrabold text-[#131E5C]">
                                Comentarios de la sección
                            </div>
                            <textarea
                                value={comentarios[seccionActiva] || ""}
                                onChange={(e) => setComentarios((p) => ({ ...p, [seccionActiva]: e.target.value }))}
                                rows={4}
                                maxLength={500}
                                placeholder="Observaciones de esta sección..."
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#131E5C] outline-none placeholder:text-slate-300 focus:border-[#131E5C]/40"
                            />
                            <div className="mt-1 text-right text-[11px] font-semibold text-slate-400">
                                {(comentarios[seccionActiva] || "").length}/500
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#131E5C]/15 bg-[#131E5C]/5 px-4 py-2.5 text-xs font-semibold text-[#131E5C]">
                        Avance total: {resumen.hechos} de {resumen.total} puntos con estado
                        definitivo ({resumen.pct}%). Los cambios se guardan al guardar el
                        avalúo.
                    </div>
                </div>
            </div>
        </div>
    );
}
