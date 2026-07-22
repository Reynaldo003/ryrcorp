// src/pages/IA/ProcesosIA.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    MarkerType,
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { apiFlujo } from "../../lib/apiFlujo";
import {
    Circle,
    CircleDot,
    ClipboardCheck,
    Clock3,
    Copy,
    Database,
    Diamond,
    Download,
    FileText,
    Filter,
    GitBranch,
    GripVertical,
    Hand,
    Layers,
    Link2,
    Loader2,
    Maximize2,
    MessageCircle,
    Minus,
    MousePointer2,
    Package,
    Play,
    Plus,
    RefreshCw,
    Save,
    Search,
    ShieldCheck,
    Square,
    Table2,
    Trash2,
    Upload,
    Wrench,
    X,
} from "lucide-react";

import vwDark from "../../assets/vw_dark.png";

const STORAGE_KEY = "crm_vw_flow_projects_v1";

const RESPONSABLES = [
    "Asesor",
    "Asesor de Servicio",
    "Técnico",
    "Técnico Especialista",
    "Calidad",
    "Inspector",
    "Garantías",
    "Refacciones",
    "Jefe de Taller",
    "Cliente",
    "N/A",
];

const ACTION_TYPES = [
    "Tarea",
    "Decisión",
    "Documento",
    "Datos",
    "Conector",
    "Subproceso",
    "Espera",
    "Manual",
    "Checklist",
    "Control",
    "Nota",
    "Fin",
];

const PALETTE = [
    { kind: "terminal", label: "Inicio / Fin", tipo: "Fin", icon: CircleDot },
    { kind: "activity", label: "Actividad", tipo: "Tarea", icon: Square },
    { kind: "decision", label: "Decisión", tipo: "Decisión", icon: Diamond },
    { kind: "document", label: "Documento", tipo: "Documento", icon: FileText },
    { kind: "data", label: "Datos", tipo: "Datos", icon: Database },
    { kind: "connector", label: "Conector", tipo: "Conector", icon: Link2 },
    { kind: "subprocess", label: "Subproceso", tipo: "Subproceso", icon: Layers },
    { kind: "wait", label: "Espera", tipo: "Espera", icon: Clock3 },
    { kind: "manual", label: "Manual", tipo: "Manual", icon: Hand },
    { kind: "checklist", label: "Checklist", tipo: "Checklist", icon: ClipboardCheck },
    { kind: "control", label: "Control", tipo: "Control", icon: ShieldCheck },
    { kind: "note", label: "Comentario", tipo: "Nota", icon: MessageCircle },
];

const ACTION_STYLE = {
    Tarea: {
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        iconBg: "bg-blue-50 text-blue-700",
        icon: Square,
    },
    Decisión: {
        badge: "bg-purple-50 text-purple-700 border-purple-200",
        iconBg: "bg-purple-50 text-purple-700",
        icon: Diamond,
    },
    Documento: {
        badge: "bg-slate-50 text-slate-700 border-slate-200",
        iconBg: "bg-slate-50 text-slate-700",
        icon: FileText,
    },
    Datos: {
        badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
        iconBg: "bg-cyan-50 text-cyan-700",
        icon: Database,
    },
    Conector: {
        badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
        iconBg: "bg-indigo-50 text-indigo-700",
        icon: Link2,
    },
    Subproceso: {
        badge: "bg-violet-50 text-violet-700 border-violet-200",
        iconBg: "bg-violet-50 text-violet-700",
        icon: Layers,
    },
    Espera: {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        iconBg: "bg-amber-50 text-amber-700",
        icon: Clock3,
    },
    Manual: {
        badge: "bg-orange-50 text-orange-700 border-orange-200",
        iconBg: "bg-orange-50 text-orange-700",
        icon: Hand,
    },
    Checklist: {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconBg: "bg-emerald-50 text-emerald-700",
        icon: ClipboardCheck,
    },
    Control: {
        badge: "bg-green-50 text-green-700 border-green-200",
        iconBg: "bg-green-50 text-green-700",
        icon: ShieldCheck,
    },
    Nota: {
        badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
        iconBg: "bg-yellow-50 text-yellow-700",
        icon: MessageCircle,
    },
    Fin: {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconBg: "bg-emerald-50 text-emerald-700",
        icon: CircleDot,
    },
};

const INITIAL_STEPS = [
    {
        id: 1,
        nombre: "Recepción y firma de orden",
        responsable: "Asesor",
        tipo: "Tarea",
        siguiente: "2",
        detalles: "Checklist: Recepción",
        sla: 15,
        pos: { x: 80, y: 170 },
    },
    {
        id: 2,
        nombre: "Inspección visual (Checklist)",
        responsable: "Técnico",
        tipo: "Checklist",
        siguiente: "3",
        detalles: "Anexo: Formato Inspección",
        sla: 30,
        pos: { x: 360, y: 170 },
    },
    {
        id: 3,
        nombre: "¿Aprobó presupuesto?",
        responsable: "Asesor",
        tipo: "Decisión",
        siguiente: "Sí -> 4; No -> 6",
        detalles: "Link a aprobación",
        sla: 10,
        pos: { x: 670, y: 155 },
    },
    {
        id: 4,
        nombre: "Reparación",
        responsable: "Técnico",
        tipo: "Tarea",
        siguiente: "5",
        detalles: "Boletín Técnico #23",
        sla: 90,
        pos: { x: 980, y: 90 },
    },
    {
        id: 5,
        nombre: "Control de calidad",
        responsable: "Calidad",
        tipo: "Control",
        siguiente: "7",
        detalles: "Checklist: Calidad",
        sla: 20,
        pos: { x: 1260, y: 90 },
    },
    {
        id: 6,
        nombre: "Entrega directa",
        responsable: "Asesor",
        tipo: "Tarea",
        siguiente: "7",
        detalles: "Formato entrega",
        sla: 15,
        pos: { x: 980, y: 330 },
    },
    {
        id: 7,
        nombre: "Fin del proceso",
        responsable: "N/A",
        tipo: "Fin",
        siguiente: "[Fin]",
        detalles: "N/A",
        sla: 0,
        pos: { x: 1260, y: 330 },
    },
];

function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function nowTime() {
    return new Intl.DateTimeFormat("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date());
}

function fullDateTime() {
    return new Date().toISOString();
}

function formatShortDate(value) {
    if (!value) return "Sin fecha";

    return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function minsLabel(value) {
    const mins = Number(value || 0);
    const h = Math.floor(mins / 60);
    const m = mins % 60;

    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
}

function makeProjectName(index) {
    return `Proceso PostVenta VW ${index}`;
}

function makeProject({ name, steps = [] } = {}) {
    const safeSteps = Array.isArray(steps)
        ? steps.map((step) => ({ ...step }))
        : [];

    return {
        id: `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: name || makeProjectName(1),
        description: "",
        createdAt: fullDateTime(),
        updatedAt: fullDateTime(),
        steps: safeSteps,
        nodes: stepsToNodes(safeSteps),
        edges: stepsToEdges(safeSteps),
        metadata: {},
    };
}

function loadProjectStore() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            const firstProject = makeProject({ name: "Nuevo diagrama" });

            return {
                activeProjectId: firstProject.id,
                projects: [firstProject],
            };
        }

        const parsed = JSON.parse(raw);
        const projects = Array.isArray(parsed.projects) ? parsed.projects : [];

        if (projects.length === 0) {
            const firstProject = makeProject({ name: "Nuevo diagrama" });

            return {
                activeProjectId: firstProject.id,
                projects: [firstProject],
            };
        }

        return {
            activeProjectId: parsed.activeProjectId || projects[0].id,
            projects,
        };
    } catch {
        const firstProject = makeProject({ name: "Nuevo diagrama" });

        return {
            activeProjectId: firstProject.id,
            projects: [firstProject],
        };
    }
}

async function saveProjectStore(projects, activeProjectId) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            activeProjectId,
            projects,
        })
    );

    const activeProject = projects.find(
        (project) => project.id === activeProjectId
    );

    if (!activeProject) return null;

    return apiFlujo.save(activeProject);
}

function nodeId(stepId) {
    return `step-${stepId}`;
}

function getStepIdFromNode(id) {
    const raw = String(id || "").replace("step-", "");
    const parsed = Number(raw);

    return Number.isFinite(parsed) ? parsed : null;
}

function getNodeType(step) {
    if (step.tipo === "Decisión") return "decision";
    if (step.tipo === "Fin") return "terminal";

    return "process";
}

function getDecisionHandle(label) {
    const clean = String(label || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (clean === "si" || clean === "sí") return "si";
    if (clean === "no") return "no";

    return "salida";
}

function makeEdge(
    source,
    target,
    label = "",
    sourceHandle = "salida",
    targetHandle = "entrada"
) {
    return {
        id: `${source}-${sourceHandle || "salida"}-${target}-${targetHandle || "entrada"}-${label || "edge"}-${Date.now()}`,
        source,
        target,
        sourceHandle: sourceHandle || "salida",
        targetHandle: targetHandle || "entrada",
        label,
        type: "smoothstep",
        animated: false,
        selectable: true,
        focusable: true,
        interactionWidth: 28,
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#315BAA",
            width: 18,
            height: 18,
        },
        style: {
            stroke: "#315BAA",
            strokeWidth: 2.2,
        },
        labelStyle: {
            fill: "#315BAA",
            fontWeight: 900,
            fontSize: 11,
        },
        labelBgStyle: {
            fill: "#EEF4FF",
            stroke: "#CFE0FF",
            strokeWidth: 1,
        },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 999,
    };
}

function parseNextLogic(value) {
    const raw = String(value || "").trim();

    if (!raw || raw.toLowerCase().includes("fin")) return [];

    const results = [];
    const logicRegex = /([a-zA-ZÁÉÍÓÚÜÑáéíóúüñ]+)\s*(?:->|=>)\s*(\d+)/g;
    let match;

    while ((match = logicRegex.exec(raw)) !== null) {
        results.push({
            label: match[1],
            target: Number(match[2]),
        });
    }

    if (results.length > 0) return results;

    return raw
        .split(/[;,]/)
        .map((part) => Number(String(part).trim()))
        .filter((num) => Number.isFinite(num))
        .map((target) => ({ label: "", target }));
}

function stepsToEdges(steps) {
    const validIds = new Set(steps.map((step) => step.id));
    const nextEdges = [];

    steps.forEach((step) => {
        const targets = parseNextLogic(step.siguiente);
        const isDecision = step.tipo === "Decisión";

        targets.forEach((item) => {
            if (!validIds.has(item.target)) return;

            nextEdges.push(
                makeEdge(
                    nodeId(step.id),
                    nodeId(item.target),
                    item.label,
                    isDecision ? getDecisionHandle(item.label) : "salida",
                    "entrada"
                )
            );
        });
    });

    return nextEdges;
}

function stepToNode(step, index, previousNodes = []) {
    const previous = previousNodes.find((node) => node.id === nodeId(step.id));

    const fallbackPosition = {
        x: 80 + (index % 4) * 300,
        y: 150 + Math.floor(index / 4) * 210,
    };

    return {
        id: nodeId(step.id),
        type: getNodeType(step),
        position: previous?.position || step.pos || fallbackPosition,
        data: {
            ...step,
            label: step.nombre,
            role: step.responsable,
            actionType: step.tipo,
            next: step.siguiente,
            details: step.detalles,
        },
    };
}

function stepsToNodes(steps, previousNodes = []) {
    return steps.map((step, index) => stepToNode(step, index, previousNodes));
}

function Badge({ children, variant = "default", dot = false }) {
    const styles = {
        default: "border-gray-200 bg-gray-50 text-gray-600",
        navy: "border-[#131E5C]/15 bg-[#131E5C]/10 text-[#131E5C]",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
        blue: "border-blue-200 bg-blue-50 text-blue-700",
    };

    const dotStyles = {
        default: "bg-gray-400",
        navy: "bg-[#131E5C]",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        blue: "bg-blue-500",
    };

    return (
        <span
            className={cx(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                styles[variant] || styles.default
            )}
        >
            {dot && (
                <span
                    className={cx(
                        "h-1.5 w-1.5 rounded-full",
                        dotStyles[variant] || dotStyles.default
                    )}
                />
            )}
            {children}
        </span>
    );
}

function ToolButton({ icon: Icon, label, active, onClick, disabled }) {
    return (
        <button
            type="button"
            title={label}
            onClick={onClick}
            disabled={disabled}
            className={cx(
                "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50",
                active
                    ? "border-[#131E5C] bg-[#131E5C] text-white"
                    : "border-[#E4E7F0] bg-white text-[#515778] hover:border-[#C8CEDF] hover:bg-[#F7F8FC] hover:text-[#131E5C]"
            )}
        >
            {Icon && <Icon className="h-4 w-4" />}
            <span className="hidden xl:inline">{label}</span>
        </button>
    );
}

function ResizeHandle({ onMouseDown, side = "right" }) {
    return (
        <div
            onMouseDown={onMouseDown}
            className={cx(
                "group relative z-40 flex w-2 shrink-0 cursor-col-resize items-center justify-center bg-transparent",
                side === "left" ? "border-l border-[#E4E7F0]" : "border-r border-[#E4E7F0]"
            )}
            title="Arrastra para redimensionar"
        >
            <div className="h-12 w-1 rounded-full bg-[#C8CEDF] opacity-60 transition group-hover:bg-[#131E5C] group-hover:opacity-100" />
        </div>
    );
}

function startResize(event, setWidth, options = {}) {
    const {
        min = 220,
        max = 760,
        direction = 1,
    } = options;

    event.preventDefault();

    const startX = event.clientX;

    setWidth((currentWidth) => {
        const startWidth = currentWidth;

        function onMove(moveEvent) {
            const delta = (moveEvent.clientX - startX) * direction;
            setWidth(clamp(startWidth + delta, min, max));
        }

        function onUp() {
            document.body.style.cursor = "";
            document.body.style.userSelect = "";

            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        }

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);

        return currentWidth;
    });
}

function NodeHandles() {
    const sourceClass =
        "!h-3.5 !w-3.5 !border-2 !border-white !bg-[#315BAA] !shadow-md !opacity-0 transition-opacity group-hover:!opacity-100";

    const targetClass =
        "!h-3.5 !w-3.5 !border-2 !border-[#315BAA] !bg-white !shadow-md !opacity-0 transition-opacity group-hover:!opacity-100";

    return (
        <>
            {/* Entradas */}
            <Handle
                id="entrada"
                type="target"
                position={Position.Left}
                className={targetClass}
            />

            <Handle
                id="entrada-derecha"
                type="target"
                position={Position.Right}
                className={targetClass}
            />

            <Handle
                id="entrada-arriba"
                type="target"
                position={Position.Top}
                className={targetClass}
            />

            <Handle
                id="entrada-abajo"
                type="target"
                position={Position.Bottom}
                className={targetClass}
            />

            {/* Salidas */}
            <Handle
                id="salida"
                type="source"
                position={Position.Right}
                className={sourceClass}
            />

            <Handle
                id="salida-izquierda"
                type="source"
                position={Position.Left}
                className={sourceClass}
            />

            <Handle
                id="salida-arriba"
                type="source"
                position={Position.Top}
                className={sourceClass}
            />

            <Handle
                id="salida-abajo"
                type="source"
                position={Position.Bottom}
                className={sourceClass}
            />
        </>
    );
}

function ProcessNode({ data, selected }) {
    const cfg = ACTION_STYLE[data.actionType] || ACTION_STYLE.Tarea;
    const Icon = cfg.icon || Square;

    return (
        <div
            className={cx(
                "group relative min-w-[220px] max-w-[255px] rounded-xl border bg-white shadow-[0_10px_26px_rgba(19,30,92,0.08)] transition",
                selected
                    ? "border-[#0B5CFF] ring-4 ring-[#0B5CFF]/10"
                    : "border-[#C8CEDF] hover:border-[#8AA4D6]"
            )}
        >
            <NodeHandles />

            <div className="p-3.5">
                <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-start gap-1.5">
                            <span className="mt-0.5 rounded-md bg-[#F1F5FF] px-1.5 py-0.5 text-[10px] font-black text-[#315BAA]">
                                {data.id}
                            </span>

                            <p className="text-[13px] font-black leading-tight text-[#1A1F3C]">
                                {data.label}
                            </p>
                        </div>

                        <p className="mt-1 text-[11px] font-semibold text-[#515778]">
                            {data.role || "Responsable"}
                        </p>
                    </div>

                    <span
                        className={cx(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                            cfg.iconBg
                        )}
                    >
                        <Icon className="h-4 w-4" />
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    <span
                        className={cx(
                            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black",
                            cfg.badge
                        )}
                    >
                        {data.actionType}
                    </span>
                </div>
            </div>
        </div>
    );
}

function DecisionNode({ data, selected }) {
    const sourceClass =
        "!h-3.5 !w-3.5 !border-2 !border-white !shadow-md !opacity-0 transition-opacity group-hover:!opacity-100";

    const targetClass =
        "!h-3.5 !w-3.5 !border-2 !border-[#315BAA] !bg-white !shadow-md !opacity-0 transition-opacity group-hover:!opacity-100";

    return (
        <div className="group relative h-[170px] w-[215px]">
            <Handle
                id="entrada"
                type="target"
                position={Position.Left}
                className={targetClass}
            />

            <Handle
                id="entrada-arriba"
                type="target"
                position={Position.Top}
                className={targetClass}
            />

            <Handle
                id="si"
                type="source"
                position={Position.Right}
                className={cx(sourceClass, "!bg-emerald-500")}
            />

            <Handle
                id="no"
                type="source"
                position={Position.Bottom}
                className={cx(sourceClass, "!bg-red-500")}
            />

            <span className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-[#F1F5FF] px-2 py-0.5 text-[10px] font-black text-[#315BAA] opacity-0 transition-opacity group-hover:opacity-100">
                Entrada
            </span>

            <span className="pointer-events-none absolute right-0 top-[62px] translate-x-[42px] rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
                Sí
            </span>

            <span className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[24px] rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-600 opacity-0 transition-opacity group-hover:opacity-100">
                No
            </span>

            <div
                className={cx(
                    "absolute left-1/2 top-1/2 h-[118px] w-[118px] -translate-x-1/2 -translate-y-1/2 rotate-45 border bg-white shadow-[0_10px_26px_rgba(19,30,92,0.08)] transition",
                    selected
                        ? "border-[#0B5CFF] ring-4 ring-[#0B5CFF]/10"
                        : "border-[#8AA4D6]"
                )}
            />

            <div className="absolute inset-0 flex items-center justify-center px-5 text-center">
                <div>
                    <span className="mb-1 inline-flex rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-black text-purple-700">
                        {data.id}
                    </span>

                    <p className="text-[12px] font-black leading-tight text-[#1A1F3C]">
                        {data.label}
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-[#8891AD]">
                        {data.next || "Sí -> ; No ->"}
                    </p>
                </div>
            </div>
        </div>
    );
}

function TerminalNode({ data, selected }) {
    const isStart = String(data.label || "").toLowerCase().includes("inicio");

    const sourceClass =
        "!h-3.5 !w-3.5 !border-2 !border-white !bg-[#315BAA] !shadow-md !opacity-0 transition-opacity group-hover:!opacity-100";

    const targetClass =
        "!h-3.5 !w-3.5 !border-2 !border-[#315BAA] !bg-white !shadow-md !opacity-0 transition-opacity group-hover:!opacity-100";

    return (
        <div className="group relative flex min-w-[150px] flex-col items-center">
            <Handle
                id="entrada"
                type="target"
                position={Position.Left}
                className={targetClass}
            />

            <Handle
                id="entrada-arriba"
                type="target"
                position={Position.Top}
                className={targetClass}
            />

            <Handle
                id="entrada-derecha"
                type="target"
                position={Position.Right}
                className={targetClass}
            />

            <Handle
                id="entrada-abajo"
                type="target"
                position={Position.Bottom}
                className={targetClass}
            />

            <Handle
                id="salida"
                type="source"
                position={Position.Bottom}
                className={sourceClass}
            />

            <Handle
                id="salida-derecha"
                type="source"
                position={Position.Right}
                className={sourceClass}
            />

            <Handle
                id="salida-izquierda"
                type="source"
                position={Position.Left}
                className={sourceClass}
            />

            <Handle
                id="salida-arriba"
                type="source"
                position={Position.Top}
                className={sourceClass}
            />

            <div
                className={cx(
                    "flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white shadow-[0_10px_26px_rgba(19,30,92,0.08)] transition",
                    selected
                        ? "border-[#0B5CFF] ring-4 ring-[#0B5CFF]/10"
                        : "border-emerald-500"
                )}
            >
                {isStart ? (
                    <Play className="h-7 w-7 text-emerald-600" />
                ) : (
                    <Circle className="h-7 w-7 text-emerald-600" />
                )}
            </div>

            <p className="mt-2 text-center text-sm font-black text-[#1A1F3C]">
                {data.label}
            </p>

            <p className="mt-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
                {data.details || data.next || "Evento del proceso"}
            </p>
        </div>
    );
}

function BasicShapesPanel({
    onAddNode,
    width,
    projects,
    activeProjectId,
    onSelectProject,
    onCreateProject,
    onDuplicateProject,
    onDeleteProject,
    onEditProject,
}) {
    const [tab, setTab] = useState("proyectos");
    const [qShapes, setQShapes] = useState("");
    const [qProjects, setQProjects] = useState("");

    const filteredShapes = useMemo(() => {
        const clean = qShapes.trim().toLowerCase();

        if (!clean) return PALETTE;

        return PALETTE.filter((item) =>
            `${item.label} ${item.tipo}`.toLowerCase().includes(clean)
        );
    }, [qShapes]);

    const filteredProjects = useMemo(() => {
        const clean = qProjects.trim().toLowerCase();

        if (!clean) return projects;

        return projects.filter((project) =>
            `${project.name} ${project.description || ""}`.toLowerCase().includes(clean)
        );
    }, [projects, qProjects]);

    function onDragStart(event, item) {
        event.dataTransfer.setData("application/reactflow", JSON.stringify(item));
        event.dataTransfer.effectAllowed = "move";
    }

    return (
        <aside
            className="flex min-h-0 shrink-0 flex-col border-r border-[#E4E7F0] bg-white"
            style={{ width }}
        >
            <div className="border-b border-[#E4E7F0] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-black text-[#1A1F3C]">
                            Biblioteca
                        </h2>
                    </div>

                    {tab === "proyectos" ? (
                        <button
                            type="button"
                            onClick={onCreateProject}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#131E5C] text-white hover:bg-[#0A1340]"
                            title="Nuevo proyecto"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    ) : (
                        <Badge variant="navy">{filteredShapes.length}</Badge>
                    )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] p-1">
                    <button
                        type="button"
                        onClick={() => setTab("proyectos")}
                        className={cx(
                            "rounded-lg px-3 py-2 text-xs font-black transition",
                            tab === "proyectos"
                                ? "bg-[#131E5C] text-white shadow-sm"
                                : "text-[#515778] hover:bg-white"
                        )}
                    >
                        Proyectos
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab("formas")}
                        className={cx(
                            "rounded-lg px-3 py-2 text-xs font-black transition",
                            tab === "formas"
                                ? "bg-[#131E5C] text-white shadow-sm"
                                : "text-[#515778] hover:bg-white"
                        )}
                    >
                        Formas
                    </button>
                </div>
            </div>

            {tab === "proyectos" && (
                <>
                    <div className="border-b border-[#E4E7F0] px-4 py-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8891AD]" />
                            <input
                                value={qProjects}
                                onChange={(e) => setQProjects(e.target.value)}
                                className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] pl-9 pr-3 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/30 focus:bg-white focus:ring-2 focus:ring-[#131E5C]/10"
                                placeholder="Buscar proyecto"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3">
                        <div className="space-y-2">
                            {filteredProjects.map((project) => {
                                const active = project.id === activeProjectId;

                                return (
                                    <div
                                        key={project.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => onSelectProject(project.id)}
                                        onDoubleClick={(event) => {
                                            event.stopPropagation();
                                            onEditProject(project.id);
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") onSelectProject(project.id);
                                        }}
                                        className={cx(
                                            "w-full cursor-pointer rounded-2xl border p-3 text-left transition",
                                            active
                                                ? "border-[#131E5C] bg-[#F1F5FF]"
                                                : "border-[#E4E7F0] bg-white hover:border-[#C8CEDF] hover:bg-[#F7F8FC]"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-black text-[#1A1F3C]">
                                                    {project.name}
                                                </p>

                                                <p className="mt-1 text-[11px] font-semibold text-[#8891AD]">
                                                    {project.steps?.length || 0} pasos · {formatShortDate(project.updatedAt)}
                                                </p>
                                            </div>

                                            {active && <Badge variant="navy">Activo</Badge>}
                                        </div>

                                        <div className="mt-3 flex items-center gap-1.5">
                                            <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-[#515778]">
                                                VW
                                            </span>

                                            <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-[#515778]">
                                                PostVenta
                                            </span>
                                        </div>

                                        <div className="mt-3 flex justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDuplicateProject(project.id);
                                                }}
                                                className="inline-flex h-8 items-center justify-center rounded-lg border border-[#E4E7F0] bg-white px-2 text-[#515778] hover:bg-[#F7F8FC]"
                                                title="Duplicar"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteProject(project.id);
                                                }}
                                                className="inline-flex h-8 items-center justify-center rounded-lg border border-red-100 bg-white px-2 text-red-600 hover:bg-red-50"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredProjects.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-[#C8CEDF] bg-[#F7F8FC] p-5 text-center">
                                    <p className="text-sm font-black text-[#1A1F3C]">
                                        Sin proyectos
                                    </p>
                                    <p className="mt-1 text-xs text-[#8891AD]">
                                        No hay coincidencias con la búsqueda.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {tab === "formas" && (
                <>
                    <div className="border-b border-[#E4E7F0] px-4 py-4">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8891AD]" />
                            <input
                                value={qShapes}
                                onChange={(e) => setQShapes(e.target.value)}
                                className="h-10 w-full rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] pl-9 pr-3 text-sm text-[#1A1F3C] outline-none transition placeholder:text-[#C8CEDF] focus:border-[#131E5C]/30 focus:bg-white focus:ring-2 focus:ring-[#131E5C]/10"
                                placeholder="Buscar forma"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-black uppercase tracking-widest text-[#8891AD]">
                                Componentes
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {filteredShapes.map((item) => {
                                const Icon = item.icon;
                                const cfg = ACTION_STYLE[item.tipo] || ACTION_STYLE.Tarea;

                                return (
                                    <button
                                        key={item.kind}
                                        type="button"
                                        draggable
                                        onDragStart={(event) => onDragStart(event, item)}
                                        onClick={() => onAddNode(item)}
                                        className="group flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-xl border border-[#E4E7F0] bg-white p-2 text-center transition hover:-translate-y-0.5 hover:border-[#0B5CFF]/40 hover:shadow-md"
                                    >
                                        <span
                                            className={cx(
                                                "flex h-9 w-9 items-center justify-center rounded-xl transition group-hover:bg-[#0B5CFF] group-hover:text-white",
                                                cfg.iconBg
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </span>

                                        <span className="line-clamp-2 text-[10px] font-black leading-tight text-[#515778]">
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </aside>
    );
}
function StepsTablePanel({
    width,
    steps,
    selectedStepId,
    onSelectStep,
    onUpdateStep,
    onAddStep,
    onRemoveStep,
    onMoveStep,
    onExport,
    onImportClick,
    stats,
}) {
    const [filter, setFilter] = useState("Todos");

    const filteredSteps = useMemo(() => {
        if (filter === "Todos") return steps;

        return steps.filter((step) => step.tipo === filter);
    }, [steps, filter]);

    return (
        <aside
            className="flex min-h-0 shrink-0 flex-col border-l border-[#E4E7F0] bg-white"
            style={{ width }}
        >
            <div className="border-b border-[#E4E7F0] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-[#1A1F3C]">
                            Constructor de pasos
                        </h2>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8891AD]" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="h-10 rounded-xl border border-[#E4E7F0] bg-white pl-9 pr-2 text-xs font-bold text-[#515778] outline-none focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                        >
                            <option>Todos</option>
                            {ACTION_TYPES.map((type) => (
                                <option key={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={onImportClick}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E4E7F0] bg-white px-3 text-xs font-black text-[#515778] hover:bg-[#F7F8FC]"
                    >
                        <Upload className="h-4 w-4" />
                        Importar
                    </button>

                    <button
                        type="button"
                        onClick={onExport}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E4E7F0] bg-white px-3 text-xs font-black text-[#515778] hover:bg-[#F7F8FC]"
                    >
                        <Download className="h-4 w-4" />
                        Exportar
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
                <table className="w-full min-w-[900px] border-separate border-spacing-0">
                    <thead>
                        <tr className="sticky top-0 z-10 bg-[#F7F8FC]">
                            <th className="w-[70px] border-b border-[#E4E7F0] px-3 py-3 text-left text-[11px] font-black uppercase tracking-widest text-[#8891AD]">
                                ID
                            </th>
                            <th className="w-[230px] border-b border-[#E4E7F0] px-3 py-3 text-left text-[11px] font-black uppercase tracking-widest text-[#8891AD]">
                                Nombre del paso
                            </th>
                            <th className="w-[150px] border-b border-[#E4E7F0] px-3 py-3 text-left text-[11px] font-black uppercase tracking-widest text-[#8891AD]">
                                Responsable
                            </th>
                            <th className="w-[140px] border-b border-[#E4E7F0] px-3 py-3 text-left text-[11px] font-black uppercase tracking-widest text-[#8891AD]">
                                Tipo
                            </th>
                            <th className="w-[150px] border-b border-[#E4E7F0] px-3 py-3 text-left text-[11px] font-black uppercase tracking-widest text-[#8891AD]">
                                Siguiente
                            </th>
                            <th className="w-[220px] border-b border-[#E4E7F0] px-3 py-3 text-left text-[11px] font-black uppercase tracking-widest text-[#8891AD]">
                                Detalles / Checklist
                            </th>
                            <th className="w-[90px] border-b border-[#E4E7F0] px-3 py-3 text-right text-[11px] font-black uppercase tracking-widest text-[#8891AD]">
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredSteps.map((step, index) => {
                            const cfg = ACTION_STYLE[step.tipo] || ACTION_STYLE.Tarea;
                            const selected = selectedStepId === step.id;

                            return (
                                <tr
                                    key={step.id}
                                    onClick={() => onSelectStep(step.id)}
                                    className={cx(
                                        "group transition",
                                        selected ? "bg-[#F1F5FF]" : "bg-white hover:bg-[#FAFBFD]"
                                    )}
                                >
                                    <td className="border-b border-[#E4E7F0] px-3 py-3 align-top">
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="h-4 w-4 cursor-grab text-[#C8CEDF]" />

                                            <button
                                                type="button"
                                                className={cx(
                                                    "flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-black",
                                                    selected
                                                        ? "border-[#131E5C] bg-[#131E5C] text-white"
                                                        : "border-[#E4E7F0] bg-white text-[#515778]"
                                                )}
                                            >
                                                {step.id}
                                            </button>
                                        </div>
                                    </td>

                                    <td className="border-b border-[#E4E7F0] px-3 py-3 align-top">
                                        <textarea
                                            value={step.nombre}
                                            onChange={(e) =>
                                                onUpdateStep(step.id, { nombre: e.target.value })
                                            }
                                            rows={2}
                                            className="w-full resize-none rounded-xl border border-[#E4E7F0] bg-white px-3 py-2 text-xs font-bold leading-snug text-[#1A1F3C] outline-none focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                                        />
                                    </td>

                                    <td className="border-b border-[#E4E7F0] px-3 py-3 align-top">
                                        <select
                                            value={step.responsable}
                                            onChange={(e) =>
                                                onUpdateStep(step.id, { responsable: e.target.value })
                                            }
                                            className="h-9 w-full rounded-xl border border-[#E4E7F0] bg-white px-2 text-xs font-bold text-[#515778] outline-none focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                                        >
                                            {RESPONSABLES.map((item) => (
                                                <option key={item}>{item}</option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="border-b border-[#E4E7F0] px-3 py-3 align-top">
                                        <select
                                            value={step.tipo}
                                            onChange={(e) =>
                                                onUpdateStep(step.id, { tipo: e.target.value })
                                            }
                                            className={cx(
                                                "h-9 w-full rounded-xl border px-2 text-xs font-black outline-none focus:ring-2 focus:ring-[#131E5C]/10",
                                                cfg.badge
                                            )}
                                        >
                                            {ACTION_TYPES.map((item) => (
                                                <option key={item}>{item}</option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="border-b border-[#E4E7F0] px-3 py-3 align-top">
                                        <input
                                            value={step.siguiente}
                                            onChange={(e) =>
                                                onUpdateStep(step.id, { siguiente: e.target.value })
                                            }
                                            className="h-9 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-xs font-bold text-[#1A1F3C] outline-none placeholder:text-[#C8CEDF] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                                            placeholder="2 o Sí -> 4; No -> 6"
                                        />
                                    </td>

                                    <td className="border-b border-[#E4E7F0] px-3 py-3 align-top">
                                        <input
                                            value={step.detalles}
                                            onChange={(e) =>
                                                onUpdateStep(step.id, { detalles: e.target.value })
                                            }
                                            className="h-9 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-xs font-semibold text-[#515778] outline-none placeholder:text-[#C8CEDF] focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                                            placeholder="Checklist, documento, nota..."
                                        />
                                    </td>

                                    <td className="border-b border-[#E4E7F0] px-3 py-3 align-top">
                                        <div className="flex justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMoveStep(step.id, "up");
                                                }}
                                                disabled={index === 0}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E7F0] text-[#515778] hover:bg-[#F7F8FC] disabled:opacity-40"
                                            >
                                                ↑
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMoveStep(step.id, "down");
                                                }}
                                                disabled={index === filteredSteps.length - 1}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E4E7F0] text-[#515778] hover:bg-[#F7F8FC] disabled:opacity-40"
                                            >
                                                ↓
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemoveStep(step.id);
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-[#E4E7F0] bg-white p-4">
                <button
                    type="button"
                    onClick={onAddStep}
                    className="mb-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#C8CEDF] bg-[#F7F8FC] text-sm font-black text-[#131E5C] transition hover:bg-white"
                >
                    <Plus className="h-4 w-4" />
                    Agregar paso
                </button>

                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8891AD]">
                            Pasos
                        </p>
                        <p className="mt-1 text-lg font-black text-[#131E5C]">
                            {stats.total}
                        </p>
                    </div>

                    <div className="rounded-xl border border-[#E4E7F0] bg-[#F7F8FC] p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8891AD]">
                            Decisiones
                        </p>
                        <p className="mt-1 text-lg font-black text-purple-700">
                            {stats.decisions}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function VWHeader({
    projectName,
    onRenameProject,
    tool,
    setTool,
    zoomIn,
    zoomOut,
    fitView,
    saving,
    saved,
    lastSaved,
    showTable,
    setShowTable,
    onSave,
    onExport,
    onImportClick,
}) {
    return (
        <header className="z-50 shrink-0 border-b border-[#E4E7F0] bg-white">
            <div className="flex min-h-[88px] items-center gap-4">
                <div className="flex shrink-0 items-center gap-4">
                    <img
                        src={vwDark}
                        alt="Volkswagen"
                        className="h-16 w-16 object-contain"
                        loading="lazy"
                    />

                    <div className="text-[28px] font-extrabold tracking-[-0.04em] text-[#131E5C] md:text-[34px]">
                        PostVenta
                    </div>
                </div>

                <div className="hidden h-[3px] min-w-[80px] flex-1 rounded-full bg-[#131E5C] lg:block" />

                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <div className="flex min-w-[200px] items-center gap-2">
                        <GitBranch className="h-4 w-4 shrink-0 text-[#131E5C]" />

                        <input
                            value={projectName}
                            onChange={(e) => onRenameProject(e.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-sm font-black text-[#1A1F3C] outline-none"
                            title="Nombre del proyecto"
                        />
                    </div>

                    <ToolButton
                        icon={MousePointer2}
                        label="Seleccionar"
                        active={tool === "select"}
                        onClick={() => setTool("select")}
                    />

                    <ToolButton
                        icon={Hand}
                        label="Mover"
                        active={tool === "hand"}
                        onClick={() => setTool("hand")}
                    />

                    <ToolButton
                        icon={Plus}
                        label="Acercar"
                        onClick={() => zoomIn({ duration: 250 })}
                    />

                    <ToolButton
                        icon={Minus}
                        label="Alejar"
                        onClick={() => zoomOut({ duration: 250 })}
                    />

                    <ToolButton
                        icon={Maximize2}
                        label="Ajustar"
                        onClick={() => fitView({ padding: 0.16, duration: 500 })}
                    />

                    <ToolButton
                        icon={Table2}
                        label={showTable ? "Ocultar tabla" : "Mostrar tabla"}
                        active={showTable}
                        onClick={() => setShowTable((value) => !value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <ToolButton
                        icon={Upload}
                        label="Importar"
                        onClick={onImportClick}
                    />

                    <ToolButton
                        icon={Download}
                        label="Exportar"
                        onClick={onExport}
                    />

                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#131E5C] px-4 text-xs font-black text-white shadow-sm transition hover:bg-[#0A1340] disabled:opacity-60"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Guardar
                    </button>
                </div>
            </div>
        </header>
    );
}

function ModalBase({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#07111F]/35 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-[#E4E7F0] bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#E4E7F0] px-5 py-4">
                    <h3 className="text-base font-black text-[#1A1F3C]">
                        {title}
                    </h3>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E4E7F0] text-[#515778] hover:bg-[#F7F8FC]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
}

function ProjectEditModal({ project, onClose, onSave }) {
    const [form, setForm] = useState({
        name: project?.name || "",
        description: project?.description || "",
    });

    function updateField(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    return (
        <ModalBase title="Editar proyecto" onClose={onClose}>
            <div className="space-y-4 p-5">
                <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-[#8891AD]">
                        Nombre
                    </label>

                    <input
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="h-11 w-full rounded-xl border border-[#E4E7F0] px-3 text-sm font-bold outline-none focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                        placeholder="Nombre del proyecto"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-[#8891AD]">
                        Descripción
                    </label>

                    <textarea
                        value={form.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-xl border border-[#E4E7F0] px-3 py-2 text-sm font-semibold outline-none focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                        placeholder="Descripción del proyecto"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E4E7F0] px-5 py-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="h-10 rounded-xl border border-[#E4E7F0] px-4 text-xs font-black text-[#515778] hover:bg-[#F7F8FC]"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    onClick={() => {
                        if (!form.name.trim()) {
                            alert("El nombre es obligatorio.");
                            return;
                        }

                        onSave({
                            name: form.name.trim(),
                            description: form.description.trim(),
                        });
                    }}
                    className="h-10 rounded-xl bg-[#131E5C] px-4 text-xs font-black text-white hover:bg-[#0A1340]"
                >
                    Guardar cambios
                </button>
            </div>
        </ModalBase>
    );
}

function StepEditModal({ step, onClose, onSave }) {
    const [form, setForm] = useState({
        nombre: step?.nombre || "",
        responsable: step?.responsable || "Asesor",
        tipo: step?.tipo || "Tarea",
        siguiente: step?.siguiente || "",
        detalles: step?.detalles || "",
    });

    function updateField(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    return (
        <ModalBase title="Editar paso" onClose={onClose}>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-[#8891AD]">
                        Nombre del paso
                    </label>

                    <input
                        value={form.nombre}
                        onChange={(e) => updateField("nombre", e.target.value)}
                        className="h-11 w-full rounded-xl border border-[#E4E7F0] px-3 text-sm font-bold outline-none focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-[#8891AD]">
                        Responsable
                    </label>

                    <select
                        value={form.responsable}
                        onChange={(e) => updateField("responsable", e.target.value)}
                        className="h-11 w-full rounded-xl border border-[#E4E7F0] px-3 text-sm font-bold outline-none focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                    >
                        {RESPONSABLES.map((item) => (
                            <option key={item}>{item}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-[#8891AD]">
                        Tipo
                    </label>

                    <select
                        value={form.tipo}
                        onChange={(e) => updateField("tipo", e.target.value)}
                        className="h-11 w-full rounded-xl border border-[#E4E7F0] px-3 text-sm font-bold outline-none focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                    >
                        {ACTION_TYPES.map((item) => (
                            <option key={item}>{item}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-[#8891AD]">
                        Siguiente paso
                    </label>

                    <input
                        value={form.siguiente}
                        onChange={(e) => updateField("siguiente", e.target.value)}
                        className="h-11 w-full rounded-xl border border-[#E4E7F0] px-3 text-sm font-bold outline-none focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                        placeholder="2 o Sí -> 4; No -> 6"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-widest text-[#8891AD]">
                        Detalles
                    </label>

                    <input
                        value={form.detalles}
                        onChange={(e) => updateField("detalles", e.target.value)}
                        className="h-11 w-full rounded-xl border border-[#E4E7F0] px-3 text-sm font-bold outline-none focus:border-[#131E5C]/30 focus:ring-2 focus:ring-[#131E5C]/10"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#E4E7F0] px-5 py-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="h-10 rounded-xl border border-[#E4E7F0] px-4 text-xs font-black text-[#515778] hover:bg-[#F7F8FC]"
                >
                    Cancelar
                </button>

                <button
                    type="button"
                    onClick={() => {
                        if (!form.nombre.trim()) {
                            alert("El nombre del paso es obligatorio.");
                            return;
                        }

                        onSave({
                            ...form,
                            nombre: form.nombre.trim(),
                            detalles: form.detalles.trim(),
                        });
                    }}
                    className="h-10 rounded-xl bg-[#131E5C] px-4 text-xs font-black text-white hover:bg-[#0A1340]"
                >
                    Guardar cambios
                </button>
            </div>
        </ModalBase>
    );
}

function ProcessDesignerInner() {
    const fileInputRef = useRef(null);
    const initialStoreRef = useRef(loadProjectStore());

    const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

    const [projects, setProjects] = useState(initialStoreRef.current.projects);
    const [activeProjectId, setActiveProjectId] = useState(initialStoreRef.current.activeProjectId);

    const activeProjectInitial =
        initialStoreRef.current.projects.find(
            (project) => project.id === initialStoreRef.current.activeProjectId
        ) || initialStoreRef.current.projects[0];

    const [steps, setSteps] = useState(activeProjectInitial.steps || INITIAL_STEPS);
    const [nodes, setNodes] = useState(
        activeProjectInitial.nodes || stepsToNodes(activeProjectInitial.steps || INITIAL_STEPS)
    );
    const [edges, setEdges] = useState(
        activeProjectInitial.edges || stepsToEdges(activeProjectInitial.steps || INITIAL_STEPS)
    );

    const [selectedStepId, setSelectedStepId] = useState(steps[0]?.id || null);
    const [tool, setTool] = useState("select");
    const [showTable, setShowTable] = useState(true);

    const [projectsWidth, setProjectsWidth] = useState(360);
    const [tableWidth, setTableWidth] = useState(560);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(true);
    const [lastSaved, setLastSaved] = useState(nowTime());

    const [editingProjectId, setEditingProjectId] = useState(null);
    const [editingStepId, setEditingStepId] = useState(null);

    const nodeTypes = useMemo(
        () => ({
            process: ProcessNode,
            decision: DecisionNode,
            terminal: TerminalNode,
        }),
        []
    );

    const activeProject = useMemo(
        () => projects.find((project) => project.id === activeProjectId) || projects[0],
        [projects, activeProjectId]
    );
    const editingProject = useMemo(
        () => projects.find((project) => project.id === editingProjectId) || null,
        [projects, editingProjectId]
    );

    const editingStep = useMemo(
        () => steps.find((step) => step.id === editingStepId) || null,
        [steps, editingStepId]
    );

    const stats = useMemo(
        () => ({
            total: steps.length,
            decisions: steps.filter((step) => step.tipo === "Decisión").length,
            sla: steps.reduce((acc, step) => acc + Number(step.sla || 0), 0),
        }),
        [steps]
    );

    function aplicarProyectoGuardado(proyectoGuardado, idAnterior = activeProjectId) {
        if (!proyectoGuardado?.id) return;

        let nextProjects = [];

        setProjects((currentProjects) => {
            const existe = currentProjects.some(
                (project) => project.id === proyectoGuardado.id
            );

            if (existe) {
                nextProjects = currentProjects.map((project) =>
                    project.id === proyectoGuardado.id
                        ? {
                            ...project,
                            ...proyectoGuardado,
                        }
                        : project
                );
            } else {
                nextProjects = currentProjects.map((project) =>
                    project.id === idAnterior
                        ? {
                            ...project,
                            ...proyectoGuardado,
                        }
                        : project
                );
            }

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    activeProjectId: proyectoGuardado.id,
                    projects: nextProjects,
                })
            );

            return nextProjects;
        });

        if (idAnterior !== proyectoGuardado.id) {
            setActiveProjectId(proyectoGuardado.id);
        }
    }

    function updateCurrentProject(patch, markDirty = true) {
        setProjects((currentProjects) =>
            currentProjects.map((project) =>
                project.id === activeProjectId
                    ? {
                        ...project,
                        ...patch,
                        updatedAt: fullDateTime(),
                    }
                    : project
            )
        );

        if (markDirty) setSaved(false);
    }

    function syncProjectState(nextSteps, nextNodes, nextEdges) {
        updateCurrentProject({
            steps: nextSteps,
            nodes: nextNodes,
            edges: nextEdges,
        });
    }

    function applySteps(nextSteps) {
        const nextNodes = stepsToNodes(nextSteps, nodes);
        const nextEdges = stepsToEdges(nextSteps);

        setSteps(nextSteps);
        setNodes(nextNodes);
        setEdges(nextEdges);

        syncProjectState(nextSteps, nextNodes, nextEdges);
    }

    function updateStep(stepId, patch) {
        const nextSteps = steps.map((step) =>
            step.id === stepId ? { ...step, ...patch } : step
        );

        applySteps(nextSteps);
    }

    function addStep(base = {}) {
        const nextId = Math.max(0, ...steps.map((step) => Number(step.id || 0))) + 1;

        const step = {
            id: nextId,
            nombre: base.nombre || "Nueva actividad",
            responsable: base.responsable || "Asesor",
            tipo: base.tipo || "Tarea",
            siguiente: base.tipo === "Fin" ? "[Fin]" : "",
            detalles: base.detalles || "",
            sla: base.sla ?? 30,
            pos: base.pos || {
                x: 80 + ((steps.length + 1) % 4) * 300,
                y: 170 + Math.floor((steps.length + 1) / 4) * 210,
            },
        };

        applySteps([...steps, step]);
        setSelectedStepId(step.id);

        setTimeout(() => {
            fitView({ padding: 0.18, duration: 500 });
        }, 80);
    }

    function addNodeFromPalette(item, position) {
        const labelByType = {
            Fin: "Fin del proceso",
            Decisión: "¿Nueva decisión?",
            Documento: "Documento requerido",
            Datos: "Entrada / salida de datos",
            Conector: "Conector",
            Subproceso: "Subproceso",
            Espera: "Tiempo de espera",
            Manual: "Actividad manual",
            Checklist: "Checklist",
            Control: "Control de calidad",
            Nota: "Comentario",
            Tarea: "Nueva actividad",
        };

        addStep({
            nombre: labelByType[item.tipo] || item.label,
            tipo: item.tipo,
            responsable: item.tipo === "Fin" ? "N/A" : "Asesor",
            sla: item.tipo === "Fin" ? 0 : 30,
            detalles: item.label,
            pos: position,
        });
    }

    function removeStep(stepId) {
        if (steps.length <= 1) return;

        const nextSteps = steps.filter((step) => step.id !== stepId);

        applySteps(nextSteps);

        if (selectedStepId === stepId) {
            setSelectedStepId(nextSteps[0]?.id || null);
        }
    }

    function moveStep(stepId, direction) {
        const index = steps.findIndex((step) => step.id === stepId);
        if (index < 0) return;

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= steps.length) return;

        const nextSteps = [...steps];
        const [item] = nextSteps.splice(index, 1);

        nextSteps.splice(targetIndex, 0, item);
        applySteps(nextSteps);
    }

    function deleteSelectedStep() {
        if (!selectedStepId) return;
        removeStep(selectedStepId);
    }

    function duplicateSelectedStep() {
        const current = steps.find((step) => step.id === selectedStepId);
        if (!current) return;

        const currentNode = nodes.find((node) => node.id === nodeId(current.id));

        addStep({
            ...current,
            nombre: `${current.nombre} copia`,
            pos: {
                x: (currentNode?.position?.x || 120) + 40,
                y: (currentNode?.position?.y || 160) + 40,
            },
        });
    }

    async function createProject() {
        const project = makeProject({
            name: makeProjectName(projects.length + 1),
        });

        setProjects((currentProjects) => [...currentProjects, project]);
        setActiveProjectId(project.id);
        setSteps(project.steps);
        setNodes(project.nodes);
        setEdges(project.edges);
        setSelectedStepId(project.steps[0]?.id || null);
        setSaved(false);

        try {
            const creado = await apiFlujo.create(project);

            setProjects((currentProjects) =>
                currentProjects.map((item) =>
                    item.id === project.id ? creado : item
                )
            );

            setActiveProjectId(creado.id);
            setSteps(creado.steps);
            setNodes(
                creado.nodes?.length ? creado.nodes : stepsToNodes(creado.steps || [])
            );
            setEdges(
                creado.edges?.length ? creado.edges : stepsToEdges(creado.steps || [])
            );
            setSelectedStepId(creado.steps?.[0]?.id || null);
            setSaved(true);
            setLastSaved(nowTime());
        } catch (error) {
            console.error("No se pudo crear el diagrama en backend:", error);
            setSaved(false);
        }

        setTimeout(() => {
            fitView({ padding: 0.18, duration: 500 });
        }, 80);
    }

    function selectProject(projectId) {
        const project = projects.find((item) => item.id === projectId);
        if (!project) return;

        const nextSteps = Array.isArray(project.steps) ? project.steps : [];
        const nextNodes =
            Array.isArray(project.nodes) && project.nodes.length > 0
                ? project.nodes
                : stepsToNodes(nextSteps);

        const nextEdges =
            Array.isArray(project.edges) && project.edges.length > 0
                ? project.edges
                : stepsToEdges(nextSteps);

        setActiveProjectId(project.id);
        setSteps(nextSteps);
        setNodes(nextNodes);
        setEdges(nextEdges);
        setSelectedStepId(nextSteps?.[0]?.id || null);
        setSaved(true);

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                activeProjectId: project.id,
                projects,
            })
        );

        setTimeout(() => {
            fitView({ padding: 0.18, duration: 500 });
        }, 80);
    }

    async function duplicateProject(projectId) {
        const project = projects.find((item) => item.id === projectId);
        if (!project) return;

        if (apiFlujo.isBackendId(projectId)) {
            try {
                const copia = await apiFlujo.duplicate(projectId);

                setProjects((currentProjects) => [...currentProjects, copia]);
                setActiveProjectId(copia.id);
                setSteps(copia.steps);
                setNodes(
                    copia.nodes?.length ? copia.nodes : stepsToNodes(copia.steps || [])
                );
                setEdges(
                    copia.edges?.length ? copia.edges : stepsToEdges(copia.steps || [])
                );
                setSelectedStepId(copia.steps?.[0]?.id || null);
                setSaved(true);
                setLastSaved(nowTime());

                return;
            } catch (error) {
                console.error("No se pudo duplicar en backend:", error);
                alert(error?.message || "No se pudo duplicar el diagrama.");
                return;
            }
        }

        const copy = {
            ...project,
            id: `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: `${project.name} copia`,
            createdAt: fullDateTime(),
            updatedAt: fullDateTime(),
            steps: project.steps.map((step) => ({ ...step })),
            nodes: project.nodes.map((node) => ({ ...node, data: { ...node.data } })),
            edges: project.edges.map((edge) => ({ ...edge })),
        };

        setProjects((currentProjects) => [...currentProjects, copy]);
        setActiveProjectId(copy.id);
        setSteps(copy.steps);
        setNodes(copy.nodes);
        setEdges(copy.edges);
        setSelectedStepId(copy.steps[0]?.id || null);
        setSaved(false);
    }

    async function deleteProject(projectId) {
        if (projects.length <= 1) {
            alert("Debe existir al menos un diagrama.");
            return;
        }

        if (!confirm("¿Eliminar este diagrama?")) return;

        if (apiFlujo.isBackendId(projectId)) {
            try {
                await apiFlujo.remove(projectId);
            } catch (error) {
                if (error?.status !== 404) {
                    console.error("Error eliminando diagrama:", error);
                    alert(error?.message || "No se pudo eliminar el diagrama.");
                    return;
                }
            }
        }

        const remaining = projects.filter((project) => project.id !== projectId);
        const nextActive =
            projectId === activeProjectId
                ? remaining[0]
                : activeProject;

        setProjects(remaining);
        setActiveProjectId(nextActive.id);
        setSteps(nextActive.steps || []);
        setNodes(nextActive.nodes || stepsToNodes(nextActive.steps || []));
        setEdges(nextActive.edges || stepsToEdges(nextActive.steps || []));
        setSelectedStepId(nextActive.steps?.[0]?.id || null);
        setSaved(false);
    }

    function renameActiveProject(name) {
        updateCurrentProject({
            name,
        });
    }

    const onNodesChange = useCallback(
        (changes) => {
            setNodes((currentNodes) => {
                const nextNodes = applyNodeChanges(changes, currentNodes);

                setProjects((currentProjects) =>
                    currentProjects.map((project) =>
                        project.id === activeProjectId
                            ? {
                                ...project,
                                nodes: nextNodes,
                                updatedAt: fullDateTime(),
                            }
                            : project
                    )
                );

                return nextNodes;
            });

            setSaved(false);
        },
        [activeProjectId]
    );

    const onEdgesChange = useCallback(
        (changes) => {
            setEdges((currentEdges) => {
                const nextEdges = applyEdgeChanges(changes, currentEdges);

                setProjects((currentProjects) =>
                    currentProjects.map((project) =>
                        project.id === activeProjectId
                            ? {
                                ...project,
                                edges: nextEdges,
                                updatedAt: fullDateTime(),
                            }
                            : project
                    )
                );

                return nextEdges;
            });

            setSaved(false);
        },
        [activeProjectId]
    );

    const onConnect = useCallback(
        (connection) => {
            const newEdge = makeEdge(
                connection.source,
                connection.target,
                "",
                connection.sourceHandle || "salida",
                connection.targetHandle || "entrada"
            );

            setEdges((currentEdges) => {
                const nextEdges = addEdge(newEdge, currentEdges);

                setProjects((currentProjects) =>
                    currentProjects.map((project) =>
                        project.id === activeProjectId
                            ? {
                                ...project,
                                edges: nextEdges,
                                updatedAt: fullDateTime(),
                            }
                            : project
                    )
                );

                return nextEdges;
            });

            setSaved(false);
        },
        [activeProjectId]
    );
    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const raw = event.dataTransfer.getData("application/reactflow");
            if (!raw) return;

            try {
                const item = JSON.parse(raw);
                const position = screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                });

                addNodeFromPalette(item, position);
            } catch (error) {
                console.error("No se pudo agregar la forma:", error);
            }
        },
        [screenToFlowPosition, steps, nodes]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    async function saveNow() {
        setSaving(true);

        try {
            const proyectoGuardado = await saveProjectStore(projects, activeProjectId);

            if (proyectoGuardado) {
                aplicarProyectoGuardado(proyectoGuardado, activeProjectId);
            }

            setSaved(true);
            setLastSaved(nowTime());
        } catch (error) {
            console.error("Error guardando diagrama:", error);
            alert(error?.message || "No se pudo guardar el diagrama.");
        } finally {
            setSaving(false);
        }
    }

    function exportJson() {
        const projectPayload = {
            diagrama: {
                id: activeProject?.id || "",
                nombre: activeProject?.name || "",
                descripcion: activeProject?.description || "",
            },
            pasos: steps,
            nodos: nodes,
            conexiones: edges,
            metadatos: activeProject?.metadata || {},
        };

        const blob = new Blob([JSON.stringify(projectPayload, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = `${activeProject?.name || "diagrama-flujo"}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    function importJson(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result || "{}"));
                const importedSteps = parsed.pasos || parsed.steps || parsed.diagrama?.pasos || parsed.project?.steps;

                if (!Array.isArray(importedSteps)) {
                    alert("El archivo no contiene una tabla de pasos válida.");
                    return;
                }

                const safeSteps = importedSteps.map((step, index) => ({
                    id: Number(step.id || index + 1),
                    nombre: step.nombre || step.label || "Paso sin nombre",
                    responsable: step.responsable || step.role || "Asesor",
                    tipo: ACTION_TYPES.includes(step.tipo || step.actionType)
                        ? step.tipo || step.actionType
                        : "Tarea",
                    siguiente: step.siguiente || step.next || "",
                    detalles: step.detalles || step.details || "",
                    sla: Number(step.sla || 0),
                    pos: step.pos,
                }));

                const project = makeProject({
                    name: parsed.diagrama?.nombre || parsed.project?.name || parsed.nombre || parsed.name || `Importado ${projects.length + 1}`,
                    steps: safeSteps,
                });

                project.nodes = Array.isArray(parsed.nodos)
                    ? parsed.nodos
                    : Array.isArray(parsed.nodes)
                        ? parsed.nodes
                        : stepsToNodes(safeSteps);

                project.edges = Array.isArray(parsed.conexiones)
                    ? parsed.conexiones
                    : Array.isArray(parsed.edges)
                        ? parsed.edges
                        : stepsToEdges(safeSteps);

                project.metadata =
                    parsed.metadatos ||
                    parsed.metadata ||
                    parsed.diagrama?.metadatos ||
                    {};

                setProjects((currentProjects) => [...currentProjects, project]);
                setActiveProjectId(project.id);
                setSteps(project.steps);
                setNodes(project.nodes);
                setEdges(project.edges);
                setSelectedStepId(project.steps[0]?.id || null);
                setSaved(false);

                setTimeout(() => {
                    fitView({ padding: 0.18, duration: 500 });
                }, 100);
            } catch {
                alert("No se pudo leer el JSON. Verifica que el archivo sea válido.");
            } finally {
                event.target.value = "";
            }
        };

        reader.readAsText(file);
    }
    useEffect(() => {
        let activo = true;

        async function cargarDiagramasFlujo() {
            try {
                const diagramas = await apiFlujo.list();

                if (!activo || !Array.isArray(diagramas) || diagramas.length === 0) {
                    return;
                }

                const primerDiagrama = diagramas[0];

                setProjects(diagramas);
                setActiveProjectId(primerDiagrama.id);
                setSteps(primerDiagrama.steps || []);
                setNodes(
                    Array.isArray(primerDiagrama.nodes) &&
                        primerDiagrama.nodes.length > 0
                        ? primerDiagrama.nodes
                        : stepsToNodes(primerDiagrama.steps || [])
                );
                setEdges(
                    Array.isArray(primerDiagrama.edges) &&
                        primerDiagrama.edges.length > 0
                        ? primerDiagrama.edges
                        : stepsToEdges(primerDiagrama.steps || [])
                );
                setSelectedStepId(primerDiagrama.steps?.[0]?.id || null);
                setSaved(true);
                setLastSaved(nowTime());

                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                        activeProjectId: primerDiagrama.id,
                        projects: diagramas,
                    })
                );

                setTimeout(() => {
                    fitView({ padding: 0.18, duration: 500 });
                }, 100);
            } catch (error) {
                console.warn("No se pudieron cargar diagramas desde backend:", error);
            }
        }

        cargarDiagramasFlujo();

        return () => {
            activo = false;
        };
    }, []);
    useEffect(() => {
        if (saved) return;

        const timer = setTimeout(async () => {
            setSaving(true);

            try {
                const proyectoGuardado = await saveProjectStore(
                    projects,
                    activeProjectId
                );

                if (proyectoGuardado) {
                    aplicarProyectoGuardado(proyectoGuardado, activeProjectId);
                }

                setSaved(true);
                setLastSaved(nowTime());
            } catch (error) {
                console.error("Error en autoguardado de diagrama:", error);
            } finally {
                setSaving(false);
            }
        }, 900);

        return () => clearTimeout(timer);
    }, [projects, activeProjectId, saved]);

    function saveProjectDetails(patch) {
        if (!editingProjectId) return;

        setProjects((currentProjects) =>
            currentProjects.map((project) =>
                project.id === editingProjectId
                    ? {
                        ...project,
                        ...patch,
                        updatedAt: fullDateTime(),
                    }
                    : project
            )
        );

        if (editingProjectId === activeProjectId) {
            updateCurrentProject(patch);
        } else {
            setSaved(false);
        }

        setEditingProjectId(null);
    }

    function saveStepDetails(patch) {
        if (!editingStepId) return;

        updateStep(editingStepId, patch);
        setEditingStepId(null);
    }
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#F7F8FC] text-[#1A1F3C]">
            <style>
                {`
                    .react-flow__attribution {
                        display: none;
                    }

                    .react-flow__controls {
                        border: 1px solid #E4E7F0;
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow: 0 14px 40px rgba(19,30,92,0.12);
                    }

                    .react-flow__controls-button {
                        border-bottom: 1px solid #E4E7F0;
                    }

                    .react-flow__edge-path {
                        filter: drop-shadow(0 2px 2px rgba(19,30,92,0.06));
                    }

                    .react-flow__minimap {
                        border: 1px solid #E4E7F0;
                        border-radius: 18px;
                        overflow: hidden;
                        box-shadow: 0 18px 50px rgba(19,30,92,0.12);
                    }
 
                    .react-flow__handle {
                        z-index: 20;
                    }

                    .react-flow__handle:hover {
                        transform: scale(1.35);
                    }

                    .react-flow__edge.selected .react-flow__edge-path,
                    .react-flow__edge:focus .react-flow__edge-path,
                    .react-flow__edge:focus-visible .react-flow__edge-path {
                        stroke: #0B5CFF !important;
                        stroke-width: 4px !important;
                        filter: drop-shadow(0 0 6px rgba(11, 92, 255, 0.45));
                    }

                    .react-flow__edge.selected .react-flow__arrowhead path,
                    .react-flow__edge:focus .react-flow__arrowhead path,
                    .react-flow__edge:focus-visible .react-flow__arrowhead path {
                        fill: #0B5CFF !important;
                        stroke: #0B5CFF !important;
                    }

                    .react-flow__edge .react-flow__edge-interaction {
                        stroke-width: 28px;
                    }

                    .react-flow__connection-path {
                        stroke: #0B5CFF !important;
                        stroke-width: 3px !important;
                    }
                `}
            </style>

            <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={importJson}
            />

            {editingProject && (
                <ProjectEditModal
                    project={editingProject}
                    onClose={() => setEditingProjectId(null)}
                    onSave={saveProjectDetails}
                />
            )}

            {editingStep && (
                <StepEditModal
                    step={editingStep}
                    onClose={() => setEditingStepId(null)}
                    onSave={saveStepDetails}
                />
            )}

            <VWHeader
                projectName={activeProject?.name || "Proceso Volkswagen"}
                onRenameProject={renameActiveProject}
                tool={tool}
                setTool={setTool}
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                fitView={fitView}
                saving={saving}
                saved={saved}
                lastSaved={lastSaved}
                showTable={showTable}
                setShowTable={setShowTable}
                onSave={saveNow}
                onExport={exportJson}
                onImportClick={() => fileInputRef.current?.click()}
            />

            <div className="flex min-h-0 flex-1">
                <BasicShapesPanel
                    onAddNode={addNodeFromPalette}
                    width={projectsWidth}
                    projects={projects}
                    activeProjectId={activeProjectId}
                    onSelectProject={selectProject}
                    onCreateProject={createProject}
                    onDuplicateProject={duplicateProject}
                    onDeleteProject={deleteProject}
                    onEditProject={setEditingProjectId}
                />

                <ResizeHandle
                    onMouseDown={(event) =>
                        startResize(event, setProjectsWidth, {
                            min: 280,
                            max: 520,
                            direction: 1,
                        })
                    }
                />

                <section
                    className="relative min-w-0 flex-1 bg-[#F8FAFF]"
                    onContextMenu={(event) => event.preventDefault()}
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        connectionMode="loose"
                        onPaneContextMenu={(event) => event.preventDefault()}
                        onNodeDoubleClick={(_, node) => {
                            const stepId = getStepIdFromNode(node?.id);
                            if (stepId) setEditingStepId(stepId);
                        }}
                        onSelectionChange={({ nodes: selectedNodes }) => {
                            const selected = selectedNodes?.[0];
                            const stepId = getStepIdFromNode(selected?.id);
                            setSelectedStepId(stepId);
                        }}
                        fitView
                        fitViewOptions={{ padding: 0.18 }}
                        deleteKeyCode={["Backspace", "Delete"]}
                        nodesDraggable
                        nodesConnectable
                        elementsSelectable
                        panOnDrag={tool === "hand" ? true : [2]}
                        selectionOnDrag={tool === "select"}
                        panOnScroll
                        panOnScrollMode="free"
                        zoomOnScroll={false}
                        zoomOnPinch
                        preventScrolling
                        defaultEdgeOptions={{
                            type: "smoothstep",
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: "#315BAA",
                            },
                            style: {
                                stroke: "#315BAA",
                                strokeWidth: 2,
                            },
                        }}
                    >
                        <Background color="#DDE6F8" gap={18} size={1} />

                        <Controls position="top-left" />

                        <MiniMap
                            position="top-right"
                            pannable
                            zoomable
                            nodeStrokeWidth={3}
                            nodeColor={(node) => {
                                if (node.type === "decision") return "#F3E8FF";
                                if (node.type === "terminal") return "#DCFCE7";
                                return "#E0E7FF";
                            }}
                            style={{
                                width: 170,
                                height: 120,
                            }}
                        />
                    </ReactFlow>
                </section>

                {showTable && (
                    <>
                        <ResizeHandle
                            side="left"
                            onMouseDown={(event) =>
                                startResize(event, setTableWidth, {
                                    min: 380,
                                    max: 900,
                                    direction: -1,
                                })
                            }
                        />

                        <StepsTablePanel
                            width={tableWidth}
                            steps={steps}
                            selectedStepId={selectedStepId}
                            onSelectStep={(stepId) => {
                                setSelectedStepId(stepId);

                                setNodes((currentNodes) =>
                                    currentNodes.map((node) => ({
                                        ...node,
                                        selected: node.id === nodeId(stepId),
                                    }))
                                );
                            }}
                            onUpdateStep={updateStep}
                            onAddStep={() => addStep()}
                            onRemoveStep={removeStep}
                            onMoveStep={moveStep}
                            onExport={exportJson}
                            onImportClick={() => fileInputRef.current?.click()}
                            stats={stats}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default function ProcesosIA() {
    return (
        <ReactFlowProvider>
            <ProcessDesignerInner />
        </ReactFlowProvider>
    );
}