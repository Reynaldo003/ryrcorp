// src/pages/Clickup/ClickupUserAutocomplete.jsx
import { useEffect, useRef, useState } from "react";
import { Search, Check, X } from "lucide-react";
import { apiClickup } from "../../lib/apiClickup";

export default function ClickupUserAutocomplete({
    value,
    onChange,
    placeholder = "Buscar usuario por nombre o correo...",
}) {
    const [q, setQ] = useState("");
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const boxRef = useRef(null);

    useEffect(() => {
        const onClickOutside = (e) => {
            if (!boxRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!q.trim()) {
                setItems([]);
                return;
            }

            setLoading(true);
            try {
                const users = await apiClickup.searchUsers(q.trim(), 8);
                setItems(users || []);
                setOpen(true);
            } catch (e) {
                console.error(e);
                setItems([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [q]);

    function selectUser(user) {
        onChange?.(user);
        setQ(user?.name || "");
        setOpen(false);
    }

    function clearSelected() {
        onChange?.(null);
        setQ("");
        setItems([]);
        setOpen(false);
    }

    return (
        <div className="relative" ref={boxRef}>
            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-black/40" />
                <input
                    value={value ? value.name : q}
                    onChange={(e) => {
                        if (value) onChange?.(null);
                        setQ(e.target.value);
                    }}
                    onFocus={() => {
                        if (items.length) setOpen(true);
                    }}
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder={placeholder}
                />
                {value ? (
                    <button
                        type="button"
                        onClick={clearSelected}
                        className="rounded-lg p-1 text-black/50 hover:bg-slate-100"
                        title="Limpiar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            {value ? (
                <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                    <div className="font-bold text-emerald-800">{value.name}</div>
                    <div className="text-xs text-emerald-700">{value.email}</div>
                </div>
            ) : null}

            {open && !value ? (
                <div className="absolute z-[80] mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-black/10 bg-white p-2 shadow-xl">
                    {loading ? (
                        <div className="px-3 py-3 text-sm text-black/60">Buscando...</div>
                    ) : items.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-black/60">Sin coincidencias</div>
                    ) : (
                        <div className="grid gap-1">
                            {items.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => selectUser(user)}
                                    className="flex items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-slate-50"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-bold text-[#131E5C]">
                                            {user.name}
                                        </div>
                                        <div className="truncate text-xs text-black/55">
                                            {user.email} {user.username ? `· ${user.username}` : ""}
                                        </div>
                                    </div>
                                    <Check className="h-4 w-4 text-black/25" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}