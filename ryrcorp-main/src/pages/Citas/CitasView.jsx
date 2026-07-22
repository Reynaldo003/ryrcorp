import { useState } from "react";

import RegistroCitas from "./RegistroCitas";
import RegistroCitasAgenda from "./RegistroCitasAgenda";
import DigitalesOverview from "./RegistroCitasGraficos";

export default function CitasView() {
    const [view, setView] = useState("tabla");

    return (
        <div>

            <div className="flex gap-2 mb-4">
                <button onClick={() => setView("grafico")}>
                    Gráfico
                </button>

                <button onClick={() => setView("agenda")}>
                    Agenda
                </button>

                <button onClick={() => setView("tabla")}>
                    Tabla
                </button>
            </div>


            {view === "grafico" && <DigitalesOverview />}
            {view === "agenda" && <RegistroCitasAgenda />}
            {view === "tabla" && <RegistroCitas />}
        </div>
    );
}