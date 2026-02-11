// src/pages/Digitales/DigitalesContacto.jsx
import { useMemo, useState } from "react";
import { Search, CheckCheck, Check, Smile, Send, ArrowLeft, User, Building2, Tag, Clock } from "lucide-react";

const BRAND_BLUE = "#131E5C";

function cls(...a) {
    return a.filter(Boolean).join(" ");
}

function Avatar({ name = "?" }) {
    const initials = name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((x) => x[0]?.toUpperCase())
        .join("");

    return (
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm">
            <span className="text-sm font-extrabold text-[#131E5C]">{initials || "?"}</span>
        </div>
    );
}

function BadgeEstado({ value }) {
    const map = {
        nuevo: "bg-blue-600/15 text-blue-800 border-blue-300/25",
        contactado: "bg-yellow-500/15 text-yellow-800 border-yellow-300/25",
        cotizacion: "bg-purple-500/15 text-purple-800 border-purple-300/25",
        cerrado: "bg-emerald-500/15 text-emerald-800 border-emerald-300/25",
        perdido: "bg-red-500/15 text-red-800 border-red-300/25",
    };

    const key = String(value || "").toLowerCase();
    return (
        <span
            className={cls(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
                map[key] || "bg-slate-500/10 text-slate-700 border-slate-200"
            )}
        >
            {value || "—"}
        </span>
    );
}

function MessageBubble({ mine, text, time, status = "sent" }) {
    const StatusIcon =
        status === "read" ? CheckCheck : status === "delivered" ? CheckCheck : Check;

    return (
        <div className={cls("flex w-full", mine ? "justify-end" : "justify-start")}>
            <div
                className={cls(
                    "max-w-[78%] rounded-2xl px-4 py-2 shadow-sm border",
                    mine
                        ? "bg-[#131E5C] text-white border-white/10"
                        : "bg-white text-[#131E5C] border-black/10"
                )}
            >
                <div className="whitespace-pre-wrap text-sm font-semibold leading-relaxed">
                    {text}
                </div>

                <div className={cls("mt-1 flex items-center justify-end gap-2 text-[11px] font-bold",
                    mine ? "text-white/75" : "text-slate-500"
                )}>
                    <span>{time}</span>
                    {mine ? <StatusIcon className={cls("h-4 w-4", status === "read" ? "text-emerald-300" : "text-white/80")} /> : null}
                </div>
            </div>
        </div>
    );
}

const MOCK_CHATS = [
    {
        id: "p-001",
        nombre: "Reynaldo Vallejo",
        telefono: "+52 272 000 0000",
        agencia: "VW Orizaba",
        business: "Ventas",
        asesor: "Andrea M.",
        estado: "Nuevo",
        favorito: true,
        unread: 2,
        last: { text: "Me interesa un Virtus, ¿hay stock?", time: "10:21" },
        messages: [
            { id: 1, mine: false, text: "Hola, vi un Virtus en Facebook 👋", time: "10:18", status: "sent" },
            { id: 2, mine: false, text: "Me interesa, ¿hay stock?", time: "10:21", status: "sent" },
            { id: 3, mine: true, text: "¡Hola! Sí, ¿qué versión te interesa? 😊", time: "10:22", status: "read" },
        ],
    },
    {
        id: "p-002",
        nombre: "Mariana López",
        telefono: "+52 228 111 2233",
        agencia: "VW Córdoba",
        business: "Usados",
        asesor: "Luis R.",
        estado: "Contactado",
        favorito: false,
        unread: 0,
        last: { text: "¿Me compartes enganche mínimo?", time: "Ayer" },
        messages: [
            { id: 1, mine: true, text: "¡Hola Mariana! ¿Qué modelo buscas?", time: "Ayer", status: "read" },
            { id: 2, mine: false, text: "Un Polo 2020 aprox", time: "Ayer", status: "sent" },
            { id: 3, mine: false, text: "¿Me compartes enganche mínimo?", time: "Ayer", status: "sent" },
        ],
    },
    {
        id: "p-003",
        nombre: "Carlos Hernández",
        telefono: "+52 999 555 6666",
        agencia: "JAECOO R&R",
        business: "Ventas",
        asesor: "Andrea M.",
        estado: "Cotización",
        favorito: true,
        unread: 1,
        last: { text: "¿La cotización incluye seguro?", time: "09:05" },
        messages: [
            { id: 1, mine: false, text: "Buen día, quiero info de JAECOO", time: "08:50", status: "sent" },
            { id: 2, mine: true, text: "Claro, ¿qué versión te interesa? Te armo cotización.", time: "08:55", status: "delivered" },
            { id: 3, mine: false, text: "¿La cotización incluye seguro?", time: "09:05", status: "sent" },
        ],
    },
];

const QUICK_FILTERS = ["Todos", "No leídos", "Favoritos", "Nuevo", "Contactado", "Cotización", "Cerrado", "Perdido"];

export default function DigitalesProspectos() {
    const [q, setQ] = useState("");
    const [filter, setFilter] = useState("Todos");
    const [chats, setChats] = useState(MOCK_CHATS);
    const [activeId, setActiveId] = useState(MOCK_CHATS[0]?.id || null);


    async function onEnviarWhatsApp() {
        try {
            const res = await fetch("http://127.0.0.1:8000/digitales/enviar-template/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to: 522711872907 }),
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error || "Error enviando WhatsApp");
            alert("Template enviado ✅");
        } catch (e) {
            alert(`Falló: ${e.message}`);
        }
    }

    const [mobileView, setMobileView] = useState("list");

    const active = useMemo(() => chats.find((c) => c.id === activeId) || null, [chats, activeId]);

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();

        return chats
            .filter((c) => {
                const matchQ =
                    !qq ||
                    c.nombre.toLowerCase().includes(qq) ||
                    c.telefono.toLowerCase().includes(qq) ||
                    c.agencia.toLowerCase().includes(qq) ||
                    c.business.toLowerCase().includes(qq) ||
                    c.asesor.toLowerCase().includes(qq) ||
                    (c.last?.text || "").toLowerCase().includes(qq);

                let matchF = true;
                if (filter === "No leídos") matchF = (c.unread || 0) > 0;
                else if (filter === "Favoritos") matchF = !!c.favorito;
                else if (filter !== "Todos") matchF = String(c.estado || "").toLowerCase() === filter.toLowerCase();

                return matchQ && matchF;
            })
            .sort((a, b) => {
                if (a.favorito !== b.favorito) return a.favorito ? -1 : 1;
                if ((a.unread || 0) !== (b.unread || 0)) return (b.unread || 0) - (a.unread || 0);
                return 0;
            });
    }, [chats, q, filter]);

    const openChat = (id) => {
        setActiveId(id);
        setMobileView("chat");

        setChats((prev) =>
            prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
        );
    };

    const toggleFav = (id) => {
        setChats((prev) =>
            prev.map((c) => (c.id === id ? { ...c, favorito: !c.favorito } : c))
        );
    };

    const setEstado = (id, estado) => {
        setChats((prev) =>
            prev.map((c) => (c.id === id ? { ...c, estado } : c))
        );
    };

    const [draftMsg, setDraftMsg] = useState("");

    const sendMessage = () => {
        const text = draftMsg.trim();
        if (!text || !active) return;

        setChats((prev) =>
            prev.map((c) => {
                if (c.id !== active.id) return c;
                const nextMessages = [
                    ...c.messages,
                    {
                        id: crypto.randomUUID(),
                        mine: true,
                        text,
                        time: "Ahora",
                        status: "delivered",
                    },
                ];

                return {
                    ...c,
                    messages: nextMessages,
                    last: { text, time: "Ahora" },
                };
            })
        );

        setDraftMsg("");
    };

    return (
        <div className="w-full">
            <div className="rounded-lg border border-black/10 bg-white shadow-sm overflow-hidden pb-6">
                <div
                    className="px-5 py-4 text-white"
                    style={{ backgroundColor: BRAND_BLUE }}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-lg font-extrabold">Prospectos Digitales</div>
                        </div>

                    </div>
                </div>

                <div className="grid h-[75vh] grid-cols-1 lg:grid-cols-[360px_1fr]">
                    <aside
                        className={cls(
                            "border-r border-black/10 bg-neutral-50",
                            "lg:block",
                            mobileView === "chat" ? "hidden" : "block"
                        )}
                    >
                        <div className="p-4 border-b border-black/10 bg-white">
                            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-neutral-100 px-3 py-2">
                                <Search className="h-4 w-4 text-[#131E5C]" />
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Buscar prospecto, número, agencia…"
                                    className="w-full bg-transparent text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400"
                                />
                            </div>

                        </div>

                        <div className="h-[calc(75vh-120px)] overflow-auto">
                            {filtered.map((c) => {
                                const isActive = c.id === activeId;

                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => openChat(c.id)}
                                        className={cls(
                                            "w-full text-left px-4 py-3 border-b border-black/5 transition",
                                            isActive ? "bg-white" : "bg-neutral-50 hover:bg-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar name={c.nombre} />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="truncate text-sm font-extrabold text-[#131E5C]">
                                                        {c.nombre}
                                                    </div>
                                                    <div className="text-[11px] font-bold text-slate-400">
                                                        {c.last?.time}
                                                    </div>
                                                </div>

                                                <div className="mt-0.5 flex items-center justify-between gap-2">
                                                    <div className="truncate text-xs font-semibold text-slate-500">
                                                        {c.last?.text}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {c.unread > 0 ? (
                                                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-extrabold text-white">
                                                                {c.unread}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex items-center gap-2">
                                                    <BadgeEstado value={c.estado} />
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                                                        <Building2 className="h-3.5 w-3.5" />
                                                        {c.agencia}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {filtered.length === 0 ? (
                                <div className="p-8 text-center text-sm font-semibold text-slate-500">
                                    Sin resultados.
                                </div>
                            ) : null}
                        </div>
                    </aside>

                    <section
                        className={cls(
                            "relative flex flex-col bg-white",
                            "lg:flex",
                            mobileView === "list" ? "hidden" : "flex"
                        )}
                    >
                        {!active ? (
                            <div className="flex h-full items-center justify-center text-slate-500">
                                Selecciona un chat
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 bg-white">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <button
                                            onClick={() => setMobileView("list")}
                                            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white hover:bg-neutral-50"
                                            aria-label="Volver"
                                        >
                                            <ArrowLeft className="h-5 w-5 text-[#131E5C]" />
                                        </button>

                                        <Avatar name={active.nombre} />

                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-extrabold text-[#131E5C]">
                                                {active.nombre}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                                                <span className="inline-flex items-center gap-1">
                                                    <User className="h-3.5 w-3.5" />
                                                    {active.telefono}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Building2 className="h-3.5 w-3.5" />
                                                    {active.agencia}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Tag className="h-3.5 w-3.5" />
                                                    {active.business}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Asesor: {active.asesor}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mensajes */}
                                <div className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-50 via-white to-neutral-50 px-4 py-4">
                                    <div className="mx-auto max-w-3xl space-y-3">
                                        {active.messages.map((m) => (
                                            <MessageBubble
                                                key={m.id}
                                                mine={m.mine}
                                                text={m.text}
                                                time={m.time}
                                                status={m.status}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-black/10 bg-white px-3 py-3">
                                    <div className="mx-auto flex max-w-3xl items-center gap-2">
                                        <button
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white hover:bg-neutral-50"
                                            title="Emoji"
                                        >
                                            <Smile className="h-5 w-5 text-[#131E5C]" />
                                        </button>

                                        <input
                                            value={draftMsg}
                                            onChange={(e) => setDraftMsg(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") sendMessage();
                                            }}
                                            placeholder="Escribe un mensaje…"
                                            className="h-11 flex-1 rounded-xl border border-black/10 bg-neutral-100 px-4 text-sm font-semibold text-[#131E5C] outline-none placeholder:text-slate-400"
                                        />

                                        <button
                                            //onClick={sendMessage}
                                            onClick={onEnviarWhatsApp}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
                                            style={{ backgroundColor: BRAND_BLUE }}
                                            title="Enviar"
                                        >
                                            <Send className="h-4 w-4" />
                                            <span className="hidden sm:inline">Enviar</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
