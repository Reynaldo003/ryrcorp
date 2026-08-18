//src/pages/Digitales/NuevoProspectoModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Activity,
    Building2,
    CarFront,
    ChevronLeft,
    FileText,
    LayoutTemplate,
    Loader2,
    MessageSquareShare,
    Paperclip,
    Save,
    UploadCloud,
    User,
    UserStar,
    X,
} from "lucide-react";
import { api } from "../../lib/apiPruebas";
import { ASESORES_PISO } from "./asesoresPiso";
import MotivoDescalificacionPicker from "./MotivoDescalificacionPicker";

const DEALERS = [
    "VW Cordoba", "VW Cordoba Usados", "VW Orizaba", "VW Orizaba Usados",
    "VW Poza Rica", "VW Tuxtepec", "VW Tuxpan", "Automotriz R&R",
];

const ASESORES_DIGITALES = [
    "Lizbeth Cano Clara", "Erendira Santos Coyotzi", "Marelly Tenorio Salinas",
    "IA Vagen", "Edgar Omar Noguera Solis", "Dulce Abigail Garcia Olivares",
    "Bianca Chavez Alarcon", "Candy Denisse Marquez", "Julio Ramirez Lopez",
];

const ESTADOS_PROSPECTO = [
    "Contactado", "Calificado", "Pendiente de Cotización", "Requiere Asesor",
    "Financiamiento", "Sin Respuesta", "Descalificado",
];

const VEHICULOS = [
    "Virtus", "Polo", "Jetta", "Jetta GLI", "Golf GTI", "Taos", "Nivus",
    "Taigun", "Tiguan", "Teramont", "Crossport", "Saveiro", "Amarok",
    "Seminuevos", "Tera", "Avaluo", "Transporter", "Caddy", "Crafter",
];

const ANIOS_VEHICULO = Array.from({ length: 2060 - 2010 + 1 }, (_, i) => 2060 - i);
const LINEAS = ["Nuevos", "Usados", "Comerciales"];
const CANALES = ["VW-Concesionarios", "WhatsApp", "Facebook", "Llamada Entrante"];

const BURO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "bueno", label: "Bueno" },
    { value: "regular", label: "Regular" },
    { value: "iniciando", label: "Iniciando" },
    { value: "desconocido", label: "Desconocido" },
];

const SOLICITUD_CREDITO = [
    { value: "", label: "— Selecciona —" },
    { value: "autorizado", label: "Autorizado" },
    { value: "rechazado", label: "Rechazado" },
    { value: "condicionado", label: "Condicionado" },
];

const FORMA_PAGO_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "contado", label: "Contado" },
    { value: "credito", label: "Crédito" },
    { value: "arrendamiento", label: "Arrendamiento" },
    { value: "desconocido", label: "Desconocido" },
];

const TIPO_CLIENTE_OPTIONS = [
    { value: "", label: "— Selecciona —" },
    { value: "persona_fisica", label: "Persona física" },
    { value: "persona_moral", label: "Persona moral" },
    { value: "desconocido", label: "Desconocido" },
];

const PLAZO_COMPRA_OPTIONS = [
    "", "Inmediato", "Esta semana", "Este mes", "1 a 3 meses",
    "3 a 6 meses", "Más de 6 meses", "Sin definir",
];

const PAUTAS_BASE = [
    "Facebook Ads", "Google Ads", "Instagram Ads", "Orgánico",
    "Referido", "WhatsApp", "Evento", "Otro",
];

const NUMERO_TUXTEPEC = "522871232641";

const ASESOR_TUXTEPEC_POR_USUARIO = {
    adtuxte: "Marelly Tenorio Salinas",
    juliorl: "Julio Ramirez Lopez",
};

const CONTEXTO_POR_NUMERO = {
    "522712638803": { asesor_digital: "IA Vagen", agencia: "VW Cordoba" },
    "522721111244": { asesor_digital: "Lizbeth Cano Clara", agencia: "VW Orizaba" },
    "522713133332": { asesor_digital: "Erendira Santos Coyotzi", agencia: "VW Cordoba" },
    "522871232641": { asesor_digital: "", agencia: "VW Tuxtepec" },
    "527831263814": { asesor_digital: "Edgar Omar Noguera Solis", agencia: "VW Tuxpan" },
    "527821820706": { asesor_digital: "Dulce Abigail Garcia Olivares", agencia: "VW Poza Rica" },
    "522712837999": { asesor_digital: "Bianca Chavez Alarcon", agencia: "VW Cordoba Usados" },
    "522721986539": { asesor_digital: "Candy Denisse Marquez", agencia: "VW Orizaba Usados" },
};

function cls(...items) {
    return items.filter(Boolean).join(" ");
}

function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function normalizaTelefonoMx(tel) {
    const digits = String(tel || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("521") && digits.length === 13) return `52${digits.slice(3)}`;
    if (digits.length === 10) return `52${digits}`;
    if (digits.length === 12 && digits.startsWith("52")) return digits;
    return digits;
}

function toNullableNumber(value) {
    const numero = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(numero) && numero > 0 ? Math.round(numero) : null;
}

function getUsuarioCrm(user) {
    return normalizeText(
        user?.usuario ||
        user?.username ||
        user?.user ||
        user?.nombre_usuario ||
        ""
    );
}

function getContexto(numero, user) {
    const normalizado = normalizaTelefonoMx(numero);
    const base = CONTEXTO_POR_NUMERO[normalizado] || {
        asesor_digital: "",
        agencia: "",
    };

    if (normalizado !== NUMERO_TUXTEPEC) return base;

    return {
        ...base,
        asesor_digital:
            ASESOR_TUXTEPEC_POR_USUARIO[getUsuarioCrm(user)] || "",
    };
}

function getAgenciasUsuario(user) {
    return String(user?.agencia || "")
        .split("|")
        .map((agencia) => agencia.trim())
        .filter(Boolean);
}

function normalizarPautas(response) {
    const raw = Array.isArray(response)
        ? response
        : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response?.results)
                ? response.results
                : [];

    const values = raw
        .map((item) =>
            typeof item === "string"
                ? item
                : item?.value ||
                item?.label ||
                item?.pauta ||
                item?.pauta_origen ||
                item?.nombre ||
                item?.name ||
                item?.campana ||
                item?.campaign_name ||
                item?.campaign ||
                item?.ad_name ||
                ""
        )
        .map((value) => String(value || "").trim())
        .filter(Boolean);

    const seen = new Set();

    return [...values, ...PAUTAS_BASE].filter((value) => {
        const key = normalizeText(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function getTemplateComponentType(component = {}) {
    return String(component.type || "").toLowerCase();
}

function replaceMetaVariables(text, componentType, values) {
    return String(text || "").replace(
        /\{\{(\d+)\}\}/g,
        (_, index) =>
            String(
                values?.[`${componentType}_${index}`] ?? ""
            ).trim()
    );
}

function interpolateNumberedText(text, fields, values) {
    const fieldValues = (fields || []).map((field) =>
        String(values?.[field.key] || "").trim()
    );

    return String(text || "").replace(
        /\((\d+)\)/g,
        (_, index) => fieldValues[Number(index) - 1] || ""
    );
}

function buildTemplatePreviewText(template, values) {
    if (!template) return "";

    const components = Array.isArray(template.components_meta)
        ? template.components_meta
        : [];

    const metaText = components
        .filter((component) => {
            const type = getTemplateComponentType(component);

            return (
                ["header", "body", "footer"].includes(type) &&
                String(component.text || "").trim()
            );
        })
        .map((component) =>
            replaceMetaVariables(
                component.text,
                getTemplateComponentType(component),
                values
            )
        )
        .filter(Boolean)
        .join("\n");

    return (
        metaText ||
        interpolateNumberedText(
            template.help || "",
            template.fields || [],
            values
        )
    );
}

function getTemplateFieldOptions(field) {
    if (Array.isArray(field?.options) && field.options.length) {
        return field.options;
    }

    const label = normalizeText(field?.label);
    const key = normalizeText(field?.key);

    if (
        label.includes("dealer") ||
        label.includes("agencia") ||
        key.includes("dealer") ||
        key.includes("agencia")
    ) {
        return DEALERS;
    }

    if (label.includes("canal") || key.includes("canal")) {
        return CANALES;
    }

    return [];
}

function getDefaultTemplateFieldValue(field, context) {
    const label = normalizeText(field?.label);
    const key = normalizeText(field?.key);

    if (
        label.includes("asesor") ||
        key.includes("asesor") ||
        label.includes("quien eres")
    ) {
        return context.asesor || "";
    }

    if (
        label.includes("nombre") ||
        label.includes("prospecto") ||
        label.includes("cliente") ||
        key.includes("nombre")
    ) {
        return context.nombre || "";
    }

    if (
        label.includes("dealer") ||
        label.includes("agencia") ||
        key.includes("dealer") ||
        key.includes("agencia")
    ) {
        return context.agencia || "";
    }

    if (
        label.includes("modelo") ||
        label.includes("auto") ||
        label.includes("vehiculo") ||
        key.includes("modelo") ||
        key.includes("auto")
    ) {
        return context.modelo || "";
    }

    if (label.includes("canal") || key.includes("canal")) {
        return context.canal || "";
    }

    if (label.includes("tema") || key.includes("tema")) {
        return context.tema || "";
    }

    if (label.includes("dato") || key.includes("dato")) {
        return context.dato || "";
    }

    return "";
}

function buildDynamicTemplateComponents(template, values) {
    const fields = Array.isArray(template?.fields)
        ? template.fields
        : [];

    const grouped = fields.reduce((acc, field) => {
        const component = String(
            field.component || "body"
        ).toLowerCase();

        if (!acc[component]) acc[component] = [];
        acc[component].push(field);

        return acc;
    }, {});

    return Object.entries(grouped)
        .map(([type, componentFields]) => ({
            type,
            parameters: componentFields
                .sort(
                    (a, b) =>
                        Number(a.index || 0) -
                        Number(b.index || 0)
                )
                .map((field) => ({
                    type: "text",
                    text: String(
                        values?.[field.key] || ""
                    ).trim(),
                })),
        }))
        .filter((component) => component.parameters.length);
}

function crearDraftInicial(numeroAsesor, user, isAdmin) {
    const contexto = getContexto(numeroAsesor, user);
    const agenciasUsuario = getAgenciasUsuario(user);

    const agencia =
        contexto.agencia ||
        (!isAdmin && agenciasUsuario.length === 1
            ? agenciasUsuario[0]
            : "");

    return {
        agencia,
        anio_auto: "",
        tiene_nombre: false,
        nombre_cliente: "",
        telefono: "",
        correo: "",
        linea: "",
        origen: "",
        pauta: "",
        estado: "Contactado",
        motivo_descalificacion: "",
        cliente_interes: "",
        comentarios: "",
        asesor_digital: contexto.asesor_digital || "",
        asesor_solicita: "",
        enganche_monto: "",
        presupuesto_mensual: "",
        buro_estado: "",
        forma_pago: "",
        tipo_cliente: "",
        uso_vehiculo: "",
        plazo_compra: "",
        comprobacion_ingresos: "",
        id_cotizacion: "",
        folio_solicitud_credito: "",
        solicitud_credito_estado: "",
        vin_facturado: "",
        vin_estatus_entrega: "",
        evidencias_nuevas: [],
    };
}

function Campo({
    label,
    icon: Icon,
    children,
    className = "",
}) {
    return (
        <div
            className={cls(
                "rounded-xl border border-black/10 bg-white p-4 shadow-sm",
                className
            )}
        >
            <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#131E5C]">
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {label}
            </div>

            {children}
        </div>
    );
}

export default function NuevoProspectoModal({
    open,
    onClose,
    onCreado,
    onPlantillaEnviada,
    numeroAsesor = "",
    user = null,
    isAdmin = false,
}) {
    const [draft, setDraft] = useState(() =>
        crearDraftInicial(
            numeroAsesor,
            user,
            isAdmin
        )
    );

    const [saving, setSaving] = useState(false);
    const [touched, setTouched] = useState(false);
    const [idGuardado, setIdGuardado] = useState(null);
    const [error, setError] = useState("");

    const [pautas, setPautas] = useState(PAUTAS_BASE);
    const [loadingPautas, setLoadingPautas] = useState(false);

    const [showTemplates, setShowTemplates] = useState(false);
    const [tplSelected, setTplSelected] = useState(null);
    const [tplDraft, setTplDraft] = useState({});
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [templatesError, setTemplatesError] = useState("");
    const [sendingTemplate, setSendingTemplate] = useState(false);

    const fileInputRef = useRef(null);
    const ultimaFirmaGuardadaRef = useRef("");
    const ultimoProspectoRef = useRef(null);

    const numeroLinea = normalizaTelefonoMx(numeroAsesor);
    const telefono = normalizaTelefonoMx(draft.telefono);
    const telefonoValido = /^52\d{10}$/.test(telefono);
    const contexto = useMemo(
        () => getContexto(numeroLinea, user),
        [numeroLinea, user]
    );

    const agenciasUsuario = useMemo(
        () => getAgenciasUsuario(user),
        [user]
    );

    const agencias = useMemo(() => {
        if (contexto.agencia) {
            return [contexto.agencia];
        }

        if (isAdmin) {
            return DEALERS;
        }

        return agenciasUsuario.length
            ? agenciasUsuario
            : DEALERS;
    }, [
        contexto.agencia,
        isAdmin,
        agenciasUsuario,
    ]);

    const templatePreview = useMemo(
        () =>
            tplSelected
                ? buildTemplatePreviewText(
                    tplSelected,
                    tplDraft
                )
                : "",
        [tplSelected, tplDraft]
    );

    const inputBase =
        "h-10 w-full rounded-lg border border-black/10 bg-neutral-50 px-3 text-sm font-semibold text-[#131E5C] outline-none transition focus:border-[#131E5C]/40 focus:ring-2 focus:ring-[#131E5C]/10";

    useEffect(() => {
        if (!open) return;

        setDraft(
            crearDraftInicial(
                numeroAsesor,
                user,
                isAdmin
            )
        );

        setSaving(false);
        setTouched(false);
        setIdGuardado(null);
        setError("");

        setShowTemplates(false);
        setTplSelected(null);
        setTplDraft({});
        setTemplates([]);
        setTemplatesError("");

        ultimaFirmaGuardadaRef.current = "";
        ultimoProspectoRef.current = null;
    }, [
        open,
        numeroAsesor,
        user,
        isAdmin,
    ]);

    useEffect(() => {
        if (!open) return;

        let cancelado = false;

        async function cargarPautas() {
            setLoadingPautas(true);

            try {
                const response =
                    await api.digitalesCampanasMeta(30);

                if (!cancelado) {
                    setPautas(
                        normalizarPautas(response)
                    );
                }
            } catch (errorPautas) {
                console.error(
                    "No se pudieron cargar campañas Meta:",
                    errorPautas
                );

                if (!cancelado) {
                    setPautas(PAUTAS_BASE);
                }
            } finally {
                if (!cancelado) {
                    setLoadingPautas(false);
                }
            }
        }

        cargarPautas();

        return () => {
            cancelado = true;
        };
    }, [open]);

    function buildPayload() {
        const nombre =
            draft.tiene_nombre &&
                String(draft.nombre_cliente || "").trim()
                ? String(
                    draft.nombre_cliente
                ).trim()
                : "SIN NOMBRE";

        return {
            numero_asesor: numeroLinea,
            nombre,
            telefono,
            correo: String(
                draft.correo || ""
            ).trim(),
            agencia:
                contexto.agencia ||
                draft.agencia ||
                "",
            anio_auto: draft.anio_auto
                ? Number(draft.anio_auto)
                : null,
            business: draft.linea || "",
            canal_contacto:
                draft.origen || "",
            pauta: draft.pauta || "",
            estado:
                draft.estado ||
                "Contactado",
            motivo_descalificacion:
                normalizeText(
                    draft.estado
                ) === "descalificado"
                    ? String(
                        draft.motivo_descalificacion ||
                        ""
                    ).trim()
                    : "",
            asesor_digital:
                contexto.asesor_digital ||
                draft.asesor_digital ||
                "",
            asesor_ventas:
                draft.asesor_solicita || "",
            auto_interes:
                draft.cliente_interes || "",
            comentarios:
                draft.comentarios || "",
            enganche_monto:
                toNullableNumber(
                    draft.enganche_monto
                ),
            presupuesto_mensual:
                toNullableNumber(
                    draft.presupuesto_mensual
                ),
            buro_estado:
                draft.buro_estado || "",
            forma_pago:
                draft.forma_pago || "",
            tipo_cliente:
                draft.tipo_cliente || "",
            uso_vehiculo:
                draft.uso_vehiculo || "",
            plazo_compra:
                draft.plazo_compra || "",
            comprobacion_ingresos:
                draft.comprobacion_ingresos ||
                "",
            id_cotizacion:
                draft.id_cotizacion || "",
            folio_solicitud_credito:
                draft.folio_solicitud_credito ||
                "",
            solicitud_credito_estado:
                draft.solicitud_credito_estado ||
                "",
            vin_facturado: String(
                draft.vin_facturado || ""
            )
                .trim()
                .toUpperCase(),
            vin_estatus_entrega:
                draft.vin_estatus_entrega ||
                "",
        };
    }

    function validar() {
        setTouched(true);
        setError("");

        if (!numeroLinea) {
            setError(
                "Selecciona una línea de WhatsApp antes de crear el prospecto."
            );

            return false;
        }

        if (!telefonoValido) {
            setError(
                "Captura un teléfono mexicano válido de 10 dígitos."
            );

            return false;
        }

        if (
            !(
                contexto.agencia ||
                draft.agencia
            )
        ) {
            setError(
                "Selecciona el dealer."
            );

            return false;
        }

        if (
            normalizeText(
                draft.estado
            ) === "descalificado" &&
            !String(
                draft.motivo_descalificacion ||
                ""
            ).trim()
        ) {
            setError(
                "Selecciona el motivo de descalificación."
            );

            return false;
        }

        return true;
    }

    async function subirEvidencias(prospectoId) {
        const files = (
            draft.evidencias_nuevas || []
        )
            .map((item) => item.file)
            .filter(Boolean);

        if (!files.length) return;

        const formData = new FormData();

        files.forEach((file) =>
            formData.append(
                "archivos",
                file
            )
        );

        await api.digitalesUploadEvidencias(
            prospectoId,
            formData,
            numeroLinea
        );

        setDraft((prev) => ({
            ...prev,
            evidencias_nuevas: [],
        }));
    }

    async function guardar({
        cerrar = true,
    } = {}) {
        if (saving || !validar()) {
            return null;
        }

        const payload = buildPayload();
        const firma =
            JSON.stringify(payload);

        setSaving(true);

        try {
            let id = idGuardado;
            let respuesta =
                ultimoProspectoRef.current;

            if (!id) {
                respuesta =
                    await api.digitalesCreateProspecto(
                        payload
                    );

                id =
                    respuesta?.id ||
                    respuesta?.id_exp ||
                    respuesta?.prospecto
                        ?.id ||
                    null;

                if (!id) {
                    throw new Error(
                        "El backend guardó el prospecto, pero no devolvió su ID."
                    );
                }

                setIdGuardado(id);
            } else if (
                ultimaFirmaGuardadaRef.current !==
                firma
            ) {
                await api.digitalesUpdateProspecto(
                    id,
                    payload
                );
            }

            await subirEvidencias(id);

            ultimaFirmaGuardadaRef.current =
                firma;

            const prospecto = {
                ...payload,
                ...(respuesta?.prospecto ||
                    {}),
                ...(respuesta || {}),
                id,
                id_exp: id,
                telefono:
                    payload.telefono,
                nombre:
                    payload.nombre,
                business:
                    payload.business,
                canal_contacto:
                    payload.canal_contacto,
            };

            ultimoProspectoRef.current =
                prospecto;

            onCreado?.(
                prospecto,
                {
                    cerrar,
                    numero_asesor:
                        numeroLinea,
                }
            );

            if (cerrar) {
                onClose?.();
            }

            return prospecto;
        } catch (errorGuardar) {
            console.error(
                "Error creando prospecto:",
                errorGuardar
            );

            setError(
                errorGuardar?.message ||
                "No se pudo registrar el prospecto."
            );

            return null;
        } finally {
            setSaving(false);
        }
    }

    async function cargarPlantillas() {
        if (!numeroLinea) {
            setTemplatesError(
                "Selecciona una línea de WhatsApp."
            );

            return;
        }

        setLoadingTemplates(true);
        setTemplatesError("");

        try {
            const response =
                await api.digitalesPlantillas({
                    numero_asesor:
                        numeroLinea,
                });

            setTemplates(
                Array.isArray(
                    response?.items
                )
                    ? response.items
                    : Array.isArray(
                        response
                    )
                        ? response
                        : []
            );
        } catch (errorPlantillas) {
            console.error(
                "Error cargando plantillas:",
                errorPlantillas
            );

            setTemplates([]);
            setTemplatesError(
                errorPlantillas?.message ||
                "No se pudieron cargar las plantillas."
            );
        } finally {
            setLoadingTemplates(false);
        }
    }

    async function abrirPlantillas() {
        if (showTemplates) {
            setShowTemplates(false);
            setTplSelected(null);
            setTplDraft({});
            return;
        }

        /*
         * Si todavía no existe el prospecto,
         * lo crea antes de habilitar Meta.
         */
        const prospecto =
            await guardar({
                cerrar: false,
            });

        if (!prospecto) return;

        setShowTemplates(true);
        setTplSelected(null);
        setTplDraft({});

        await cargarPlantillas();
    }

    function seleccionarPlantilla(
        template
    ) {
        setTplSelected(template);

        const context = {
            nombre:
                draft.tiene_nombre
                    ? draft.nombre_cliente
                    : "",
            agencia:
                contexto.agencia ||
                draft.agencia ||
                "",
            modelo:
                draft.cliente_interes ||
                "",
            canal:
                draft.origen || "",
            asesor:
                contexto.asesor_digital ||
                draft.asesor_digital ||
                user?.nombre ||
                user?.username ||
                "",
            tema:
                draft.cliente_interes
                    ? "vehículo de interés"
                    : "solicitud de información",
            dato: "horario",
        };

        const values = {};

        for (
            const field of
            template.fields || []
        ) {
            values[field.key] =
                getDefaultTemplateFieldValue(
                    field,
                    context
                );
        }

        setTplDraft(values);
    }

    async function enviarPlantilla() {
        if (
            !tplSelected ||
            sendingTemplate
        ) {
            return;
        }

        const incomplete = (
            tplSelected.fields || []
        ).find(
            (field) =>
                !String(
                    tplDraft[field.key] ||
                    ""
                ).trim()
        );

        if (incomplete) {
            setTemplatesError(
                `Completa el campo: ${incomplete.label ||
                incomplete.key
                }`
            );

            return;
        }

        const templateName =
            tplSelected.key ||
            tplSelected.name;

        if (!templateName) {
            setTemplatesError(
                "La plantilla no tiene nombre válido."
            );

            return;
        }

        const components =
            buildDynamicTemplateComponents(
                tplSelected,
                tplDraft
            );

        setSendingTemplate(true);
        setTemplatesError("");

        try {
            await api.digitalesEnviarPlantilla({
                to: telefono,
                template_name:
                    templateName,
                idioma:
                    tplSelected.idioma ||
                    tplSelected.language ||
                    "es_MX",
                components:
                    components.length
                        ? components
                        : undefined,
                params:
                    components.length
                        ? undefined
                        : [],
                numero_asesor:
                    numeroLinea,
            });

            setShowTemplates(false);
            setTplSelected(null);
            setTplDraft({});

            onPlantillaEnviada?.({
                telefono,
                numero_asesor:
                    numeroLinea,
                prospecto:
                    ultimoProspectoRef.current,
            });

            alert(
                "Plantilla enviada correctamente."
            );
        } catch (errorPlantilla) {
            console.error(
                "Error enviando plantilla:",
                errorPlantilla
            );

            setTemplatesError(
                errorPlantilla?.message ||
                "No se pudo enviar la plantilla."
            );
        } finally {
            setSendingTemplate(false);
        }
    }

    function addFiles(fileList) {
        const nuevos =
            Array.from(fileList || []).map(
                (file) => ({
                    id: `${Date.now()}_${Math.random()
                        .toString(36)
                        .slice(2)}`,
                    file,
                    name: file.name,
                    size: file.size,
                })
            );

        if (!nuevos.length) return;

        setDraft((prev) => ({
            ...prev,
            evidencias_nuevas: [
                ...(prev.evidencias_nuevas ||
                    []),
                ...nuevos,
            ],
        }));
    }

    function removeFile(id) {
        setDraft((prev) => ({
            ...prev,
            evidencias_nuevas: (
                prev.evidencias_nuevas ||
                []
            ).filter(
                (item) =>
                    item.id !== id
            ),
        }));
    }

    function cerrar() {
        if (
            saving ||
            sendingTemplate
        ) {
            return;
        }

        onClose?.();
    }

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px]"
            onMouseDown={cerrar}
        >
            <div
                className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-neutral-100 shadow-2xl"
                onMouseDown={(e) =>
                    e.stopPropagation()
                }
            >
                <div className="flex shrink-0 items-center justify-between border-b border-black/10 bg-[#131E5C] px-5 py-4 text-white">
                    <div>
                        <div className="text-lg font-black">
                            Nuevo prospecto
                        </div>

                        <div className="mt-0.5 text-xs font-semibold text-white/60">
                            Registra el prospecto y comienza la conversación por WhatsApp.
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={cerrar}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {error ? (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {error}
                        </div>
                    ) : null}

                    <div className="grid gap-3 md:grid-cols-4">
                        <Campo
                            label="Dealer y asignación"
                            icon={Building2}
                            className="md:col-span-4"
                        >
                            <div className="grid gap-3 md:grid-cols-3">
                                <div>
                                    <div className="mb-1 text-xs font-bold text-[#131E5C]">
                                        Dealer *
                                    </div>

                                    <select
                                        value={
                                            contexto.agencia ||
                                            draft.agencia
                                        }
                                        disabled={
                                            Boolean(
                                                contexto.agencia
                                            )
                                        }
                                        onChange={(e) =>
                                            setDraft(
                                                (prev) => ({
                                                    ...prev,
                                                    agencia:
                                                        e
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        className={inputBase}
                                    >
                                        <option value="">
                                            Selecciona…
                                        </option>

                                        {agencias.map(
                                            (
                                                agencia
                                            ) => (
                                                <option
                                                    key={
                                                        agencia
                                                    }
                                                    value={
                                                        agencia
                                                    }
                                                >
                                                    {
                                                        agencia
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <div className="mb-1 text-xs font-bold text-[#131E5C]">
                                        Asesor digital
                                    </div>

                                    <select
                                        value={
                                            contexto.asesor_digital ||
                                            draft.asesor_digital
                                        }
                                        disabled={
                                            Boolean(
                                                contexto.asesor_digital
                                            )
                                        }
                                        onChange={(e) =>
                                            setDraft(
                                                (prev) => ({
                                                    ...prev,
                                                    asesor_digital:
                                                        e
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        className={inputBase}
                                    >
                                        <option value="">
                                            Selecciona…
                                        </option>

                                        {ASESORES_DIGITALES.map(
                                            (
                                                asesor
                                            ) => (
                                                <option
                                                    key={
                                                        asesor
                                                    }
                                                    value={
                                                        asesor
                                                    }
                                                >
                                                    {
                                                        asesor
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <div className="mb-1 text-xs font-bold text-[#131E5C]">
                                        Asesor piso
                                    </div>

                                    <select
                                        value={
                                            draft.asesor_solicita
                                        }
                                        onChange={(e) =>
                                            setDraft(
                                                (prev) => ({
                                                    ...prev,
                                                    asesor_solicita:
                                                        e
                                                            .target
                                                            .value,
                                                })
                                            )
                                        }
                                        className={inputBase}
                                    >
                                        <option value="">
                                            Sin asignar
                                        </option>

                                        {ASESORES_PISO.map(
                                            (
                                                asesor
                                            ) => (
                                                <option
                                                    key={
                                                        asesor
                                                    }
                                                    value={
                                                        asesor
                                                    }
                                                >
                                                    {
                                                        asesor
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            </div>
                        </Campo>

                        <Campo
                            label="Cliente"
                            icon={User}
                            className="md:col-span-2"
                        >
                            <div className="mb-3 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={
                                        draft.tiene_nombre
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                tiene_nombre:
                                                    e
                                                        .target
                                                        .checked,
                                            })
                                        )
                                    }
                                />

                                <span className="text-xs font-bold text-[#131E5C]">
                                    Tengo el nombre del cliente
                                </span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                    value={
                                        draft.nombre_cliente
                                    }
                                    disabled={
                                        !draft.tiene_nombre
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                nombre_cliente:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="Nombre completo"
                                    className={inputBase}
                                />

                                <input
                                    value={
                                        draft.telefono
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                telefono:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="2711234567"
                                    className={cls(
                                        inputBase,
                                        touched &&
                                            !telefonoValido
                                            ? "border-red-400"
                                            : ""
                                    )}
                                />

                                <input
                                    value={
                                        draft.correo
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                correo:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="Correo"
                                    className={cls(
                                        inputBase,
                                        "sm:col-span-2"
                                    )}
                                />
                            </div>
                        </Campo>

                        <Campo
                            label="Vehículo"
                            icon={CarFront}
                            className="md:col-span-2"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <select
                                    value={
                                        draft.cliente_interes
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                cliente_interes:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className={inputBase}
                                >
                                    <option value="">
                                        Modelo de interés
                                    </option>

                                    {VEHICULOS.map(
                                        (modelo) => (
                                            <option
                                                key={
                                                    modelo
                                                }
                                                value={
                                                    modelo
                                                }
                                            >
                                                {
                                                    modelo
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <select
                                    value={
                                        draft.anio_auto
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                anio_auto:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className={inputBase}
                                >
                                    <option value="">
                                        Año
                                    </option>

                                    {ANIOS_VEHICULO.map(
                                        (anio) => (
                                            <option
                                                key={
                                                    anio
                                                }
                                                value={
                                                    anio
                                                }
                                            >
                                                {
                                                    anio
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </Campo>

                        <Campo
                            label="Origen"
                            icon={UserStar}
                            className="md:col-span-2"
                        >
                            <div className="grid gap-3 sm:grid-cols-2">
                                <select
                                    value={
                                        draft.linea
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                linea:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className={inputBase}
                                >
                                    <option value="">
                                        Business
                                    </option>

                                    {LINEAS.map(
                                        (linea) => (
                                            <option
                                                key={
                                                    linea
                                                }
                                                value={
                                                    linea
                                                }
                                            >
                                                {
                                                    linea
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <select
                                    value={
                                        draft.origen
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                origen:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className={inputBase}
                                >
                                    <option value="">
                                        Canal
                                    </option>

                                    {CANALES.map(
                                        (canal) => (
                                            <option
                                                key={
                                                    canal
                                                }
                                                value={
                                                    canal
                                                }
                                            >
                                                {
                                                    canal
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <select
                                    value={
                                        draft.pauta
                                    }
                                    disabled={
                                        loadingPautas
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                pauta:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className={cls(
                                        inputBase,
                                        "sm:col-span-2"
                                    )}
                                >
                                    <option value="">
                                        {loadingPautas
                                            ? "Cargando campañas..."
                                            : "Pauta / campaña"}
                                    </option>

                                    {pautas.map(
                                        (pauta) => (
                                            <option
                                                key={
                                                    pauta
                                                }
                                                value={
                                                    pauta
                                                }
                                            >
                                                {
                                                    pauta
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </Campo>

                        <Campo
                            label="Estado"
                            icon={Activity}
                            className="md:col-span-2"
                        >
                            <select
                                value={
                                    draft.estado
                                }
                                onChange={(e) =>
                                    setDraft(
                                        (prev) => ({
                                            ...prev,
                                            estado:
                                                e
                                                    .target
                                                    .value,
                                            motivo_descalificacion:
                                                normalizeText(
                                                    e
                                                        .target
                                                        .value
                                                ) ===
                                                    "descalificado"
                                                    ? prev.motivo_descalificacion
                                                    : "",
                                        })
                                    )
                                }
                                className={inputBase}
                            >
                                {ESTADOS_PROSPECTO.map(
                                    (estado) => (
                                        <option
                                            key={
                                                estado
                                            }
                                            value={
                                                estado
                                            }
                                        >
                                            {estado}
                                        </option>
                                    )
                                )}
                            </select>

                            {normalizeText(
                                draft.estado
                            ) ===
                                "descalificado" ? (
                                <div className="mt-3">
                                    <MotivoDescalificacionPicker
                                        value={
                                            draft.motivo_descalificacion
                                        }
                                        onChange={(
                                            motivo
                                        ) =>
                                            setDraft(
                                                (
                                                    prev
                                                ) => ({
                                                    ...prev,
                                                    motivo_descalificacion:
                                                        motivo,
                                                })
                                            )
                                        }
                                        invalid={
                                            touched &&
                                            !draft.motivo_descalificacion
                                        }
                                    />
                                </div>
                            ) : null}
                        </Campo>

                        <Campo
                            label="Perfil comercial y financiero"
                            icon={Activity}
                            className="md:col-span-4"
                        >
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <input
                                    type="number"
                                    min="0"
                                    value={
                                        draft.enganche_monto
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                enganche_monto:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="Enganche"
                                    className={inputBase}
                                />

                                <input
                                    type="number"
                                    min="0"
                                    value={
                                        draft.presupuesto_mensual
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                presupuesto_mensual:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="Mensualidad"
                                    className={inputBase}
                                />

                                <select
                                    value={
                                        draft.buro_estado
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                buro_estado:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className={inputBase}
                                >
                                    {BURO_OPTIONS.map(
                                        (item) => (
                                            <option
                                                key={
                                                    item.value
                                                }
                                                value={
                                                    item.value
                                                }
                                            >
                                                {
                                                    item.label
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <select
                                    value={
                                        draft.forma_pago
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                forma_pago:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className={inputBase}
                                >
                                    {FORMA_PAGO_OPTIONS.map(
                                        (item) => (
                                            <option
                                                key={
                                                    item.value
                                                }
                                                value={
                                                    item.value
                                                }
                                            >
                                                {
                                                    item.label
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <select
                                    value={
                                        draft.tipo_cliente
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                tipo_cliente:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className={inputBase}
                                >
                                    {TIPO_CLIENTE_OPTIONS.map(
                                        (item) => (
                                            <option
                                                key={
                                                    item.value
                                                }
                                                value={
                                                    item.value
                                                }
                                            >
                                                {
                                                    item.label
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <select
                                    value={
                                        draft.plazo_compra
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                plazo_compra:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className={inputBase}
                                >
                                    {PLAZO_COMPRA_OPTIONS.map(
                                        (item) => (
                                            <option
                                                key={
                                                    item ||
                                                    "empty"
                                                }
                                                value={
                                                    item
                                                }
                                            >
                                                {item ||
                                                    "— Plazo —"}
                                            </option>
                                        )
                                    )}
                                </select>

                                <input
                                    value={
                                        draft.uso_vehiculo
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                uso_vehiculo:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="Uso del vehículo"
                                    className={inputBase}
                                />

                                <input
                                    value={
                                        draft.comprobacion_ingresos
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                comprobacion_ingresos:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="Comprobación de ingresos"
                                    className={inputBase}
                                />
                            </div>
                        </Campo>

                        <Campo
                            label="Proceso comercial"
                            icon={FileText}
                            className="md:col-span-4"
                        >
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <input
                                    value={
                                        draft.id_cotizacion
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                id_cotizacion:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="ID Cotización"
                                    className={inputBase}
                                />

                                <input
                                    value={
                                        draft.folio_solicitud_credito
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                folio_solicitud_credito:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    placeholder="Folio solicitud"
                                    className={inputBase}
                                />

                                <select
                                    value={
                                        draft.solicitud_credito_estado
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                solicitud_credito_estado:
                                                    e
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                    className={inputBase}
                                >
                                    {SOLICITUD_CREDITO.map(
                                        (item) => (
                                            <option
                                                key={
                                                    item.value
                                                }
                                                value={
                                                    item.value
                                                }
                                            >
                                                {
                                                    item.label
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <input
                                    value={
                                        draft.vin_facturado
                                    }
                                    onChange={(e) =>
                                        setDraft(
                                            (prev) => ({
                                                ...prev,
                                                vin_facturado:
                                                    e
                                                        .target
                                                        .value
                                                        .toUpperCase(),
                                            })
                                        )
                                    }
                                    placeholder="VIN facturado"
                                    className={inputBase}
                                />
                            </div>
                        </Campo>

                        <Campo
                            label="Evidencias"
                            icon={Paperclip}
                            className="md:col-span-4"
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.7z"
                                className="hidden"
                                onChange={(e) => {
                                    addFiles(
                                        e.target
                                            .files
                                    );

                                    e.target.value =
                                        "";
                                }}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#131E5C]/25 bg-[#131E5C]/5 px-4 py-5 text-sm font-extrabold text-[#131E5C] hover:bg-[#131E5C]/10"
                            >
                                <UploadCloud className="h-5 w-5" />
                                Agregar evidencias
                            </button>

                            {draft
                                .evidencias_nuevas
                                .length ? (
                                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {draft.evidencias_nuevas.map(
                                        (
                                            item
                                        ) => (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="flex items-center gap-2 rounded-lg border border-black/10 bg-neutral-50 px-3 py-2"
                                            >
                                                <FileText className="h-4 w-4 text-[#131E5C]" />

                                                <span className="min-w-0 flex-1 truncate text-xs font-bold text-[#131E5C]">
                                                    {
                                                        item.name
                                                    }
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeFile(
                                                            item.id
                                                        )
                                                    }
                                                    className="text-red-500"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : null}
                        </Campo>

                        <Campo
                            label="Comentarios"
                            icon={FileText}
                            className="md:col-span-4"
                        >
                            <textarea
                                value={
                                    draft.comentarios
                                }
                                onChange={(e) =>
                                    setDraft(
                                        (prev) => ({
                                            ...prev,
                                            comentarios:
                                                e
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                                rows={4}
                                className={cls(
                                    inputBase,
                                    "h-auto py-2.5"
                                )}
                            />
                        </Campo>
                    </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-black/10 bg-white px-5 py-3">
                    <div className="relative mr-auto">
                        <button
                            type="button"
                            onClick={
                                abrirPlantillas
                            }
                            disabled={
                                saving ||
                                sendingTemplate ||
                                !telefonoValido ||
                                !numeroLinea
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-[#131E5C] hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LayoutTemplate className="h-4 w-4" />
                            )}

                            Plantillas
                        </button>

                        {showTemplates ? (
                            <div className="absolute bottom-12 left-0 z-30 w-[min(25rem,85vw)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                                <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5">
                                    {tplSelected ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setTplSelected(
                                                    null
                                                )
                                            }
                                        >
                                            <ChevronLeft className="h-4 w-4 text-slate-500" />
                                        </button>
                                    ) : (
                                        <span className="text-xs font-extrabold text-[#131E5C]">
                                            Plantillas
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowTemplates(
                                                false
                                            );
                                            setTplSelected(
                                                null
                                            );
                                        }}
                                    >
                                        <X className="h-4 w-4 text-slate-400" />
                                    </button>
                                </div>

                                <div className="max-h-80 overflow-y-auto">
                                    {!tplSelected ? (
                                        loadingTemplates ? (
                                            <div className="p-5 text-center text-xs font-bold text-slate-400">
                                                Cargando plantillas...
                                            </div>
                                        ) : templatesError ? (
                                            <div className="p-4 text-xs font-bold text-red-600">
                                                {
                                                    templatesError
                                                }
                                            </div>
                                        ) : templates.length ? (
                                            templates.map(
                                                (
                                                    template
                                                ) => (
                                                    <button
                                                        key={`${template.key || template.name}-${template.idioma || template.language || "x"}`}
                                                        type="button"
                                                        onClick={() =>
                                                            seleccionarPlantilla(
                                                                template
                                                            )
                                                        }
                                                        className="block w-full border-b border-black/5 px-4 py-3 text-left hover:bg-neutral-50"
                                                    >
                                                        <div className="text-xs font-extrabold text-[#131E5C]">
                                                            {template.title ||
                                                                template.key ||
                                                                template.name}
                                                        </div>

                                                        <div className="mt-1 truncate text-[11px] font-semibold text-slate-400">
                                                            {template.help ||
                                                                template.category ||
                                                                "Plantilla Meta"}
                                                        </div>
                                                    </button>
                                                )
                                            )
                                        ) : (
                                            <div className="p-5 text-center text-xs font-bold text-slate-400">
                                                No hay plantillas disponibles.
                                            </div>
                                        )
                                    ) : (
                                        <div className="space-y-3 p-4">
                                            <div className="whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-xs font-semibold text-[#131E5C]">
                                                {templatePreview ||
                                                    tplSelected.help ||
                                                    "Sin texto visible."}
                                            </div>

                                            {(tplSelected.fields ||
                                                []).map(
                                                    (
                                                        field
                                                    ) => {
                                                        const options =
                                                            getTemplateFieldOptions(
                                                                field
                                                            );

                                                        return (
                                                            <div
                                                                key={
                                                                    field.key
                                                                }
                                                            >
                                                                <div className="mb-1 text-[11px] font-extrabold text-[#131E5C]">
                                                                    {field.label ||
                                                                        field.key}
                                                                </div>

                                                                {options.length ? (
                                                                    <select
                                                                        value={
                                                                            tplDraft[
                                                                            field
                                                                                .key
                                                                            ] ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setTplDraft(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [field.key]:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                })
                                                                            )
                                                                        }
                                                                        className={
                                                                            inputBase
                                                                        }
                                                                    >
                                                                        <option value="">
                                                                            Selecciona…
                                                                        </option>

                                                                        {options.map(
                                                                            (
                                                                                option
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        option
                                                                                    }
                                                                                    value={
                                                                                        option
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        option
                                                                                    }
                                                                                </option>
                                                                            )
                                                                        )}
                                                                    </select>
                                                                ) : (
                                                                    <input
                                                                        value={
                                                                            tplDraft[
                                                                            field
                                                                                .key
                                                                            ] ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setTplDraft(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [field.key]:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                })
                                                                            )
                                                                        }
                                                                        className={
                                                                            inputBase
                                                                        }
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                )}

                                            {templatesError ? (
                                                <div className="text-xs font-bold text-red-600">
                                                    {
                                                        templatesError
                                                    }
                                                </div>
                                            ) : null}

                                            <button
                                                type="button"
                                                onClick={
                                                    enviarPlantilla
                                                }
                                                disabled={
                                                    sendingTemplate
                                                }
                                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#131E5C] py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
                                            >
                                                {sendingTemplate ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <MessageSquareShare className="h-4 w-4" />
                                                )}

                                                {sendingTemplate
                                                    ? "Enviando..."
                                                    : "Enviar plantilla"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={cerrar}
                        disabled={
                            saving ||
                            sendingTemplate
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-400 px-4 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                    >
                        <X className="h-4 w-4" />
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            guardar({
                                cerrar: true,
                            })
                        }
                        disabled={
                            saving ||
                            sendingTemplate
                        }
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#131E5C] px-4 text-sm font-bold text-white hover:bg-[#131E5C]/90 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}

                        {saving
                            ? "Guardando..."
                            : "Guardar prospecto"}
                    </button>
                </div>
            </div>
        </div>
    );
}