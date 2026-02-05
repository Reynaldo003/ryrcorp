import { useLocation, useParams } from "react-router-dom";
import { useState } from "react";

export default function CrmEditaCaso() {
    const { chasis } = useParams();
    const { state } = useLocation();
    const [form, setForm] = useState(state || { chasis, cliente: "" });

    return (
        <div className="max-w-3xl space-y-4">
            <h1 className="text-lg font-semibold">Editar caso {chasis}</h1>
            <label className="block text-sm">Chasis
                <input value={form.chasis} disabled className="input" />
            </label>
            <label className="block text-sm">Cliente
                <input
                    value={form.cliente}
                    onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                    className="input"
                />
            </label>
            <button className="btn-primary">Guardar cambios</button>
        </div>
    );
}
