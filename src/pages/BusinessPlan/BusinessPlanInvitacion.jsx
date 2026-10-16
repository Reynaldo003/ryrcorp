import { useEffect, useState } from "react";
import { apiBusinessPlan } from "../../lib/apiBusinessPlan";

// Ejemplo didáctico; adapta la ruta de importación según dónde lo coloques.
// El componente BusinessPlan.jsx original requiere migrar sus operaciones
// locales a los métodos del API para funcionar con permisos por recurso.
export default function BusinessPlanConexionEjemplo() {
    const [tableros, setTableros] = useState([]);
    const [tablero, setTablero] = useState(null);
    const [temas, setTemas] = useState([]);
    const [tema, setTema] = useState(null);
    const [anio, setAnio] = useState(2026);
    const [periodo, setPeriodo] = useState(null);
    const [nombreNuevo, setNombreNuevo] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [usuarios, setUsuarios] = useState([]);
    const [mensaje, setMensaje] = useState("");

    async function cargarTableros() {
        try {
            const respuesta = await apiBusinessPlan.listarTableros();
            setTableros(respuesta);
        } catch (error) {
            setMensaje(error.message);
        }
    }

    async function crearTablero() {
        if (!nombreNuevo.trim()) return;
        try {
            const creado = await apiBusinessPlan.crearTablero(nombreNuevo.trim());
            setNombreNuevo("");
            await cargarTableros();
            await seleccionarTablero(creado);
        } catch (error) {
            setMensaje(error.message);
        }
    }

    async function seleccionarTablero(tableroElegido) {
        try {
            setTablero(tableroElegido);
            const respuesta = await apiBusinessPlan.listarTemas(tableroElegido.id);
            setTemas(respuesta);
            setTema(null);
            setPeriodo(null);
        } catch (error) {
            setMensaje(error.message);
        }
    }

    async function seleccionarTema(temaElegido, anioElegido = anio) {
        try {
            const respuesta = await apiBusinessPlan.obtenerPeriodo(temaElegido.id, anioElegido);
            setTema(temaElegido);
            setPeriodo(respuesta);
            setAnio(anioElegido);
        } catch (error) {
            setMensaje(error.message);
        }
    }

    async function agregarKPI() {
        if (!periodo) return;
        const nuevo = {
            id: crypto.randomUUID(),
            kpi: "Nuevo KPI",
            descripcion: "",
            valores: Array(12).fill(""),
            extras: {},
        };
        setPeriodo((anterior) => ({
            ...anterior,
            filas: [...anterior.filas, nuevo],
        }));
    }

    async function guardarPeriodo() {
        if (!tema || !periodo) return;
        try {
            const respuesta = await apiBusinessPlan.guardarPeriodo(tema.id, anio, periodo);
            setPeriodo(respuesta); // Contiene la nueva revisión.
            setMensaje("Cambios guardados.");
        } catch (error) {
            // En HTTP 409, no vuelvas a enviar datos sin resolver el conflicto.
            setMensaje(error.message);
        }
    }

    async function buscarUsuarios() {
        try {
            const respuesta = await apiBusinessPlan.buscarUsuarios(busqueda);
            setUsuarios(respuesta);
        } catch (error) {
            setMensaje(error.message);
        }
    }

    async function invitarUsuario(usuario, rol) {
        if (!tablero) return;
        try {
            await apiBusinessPlan.invitarTablero(tablero.id, usuario.id_usuario, rol);
            setMensaje(`Invitación enviada a ${usuario.usuario}.`);
        } catch (error) {
            setMensaje(error.message);
        }
    }

    useEffect(() => {
        cargarTableros();
    }, []);

    return (
        <section>
            <h2>BusinessPlan: ejemplo de conexión</h2>
            <input value={nombreNuevo} onChange={(evento) => setNombreNuevo(evento.target.value)}
                placeholder="Nombre del nuevo tablero" />
            <button onClick={crearTablero}>Crear tablero</button>
            <h3>Tableros accesibles</h3>
            {tableros.map((item) => (
                <button key={item.id} onClick={() => seleccionarTablero(item)}>
                    {item.nombre} (ID {item.id})
                </button>
            ))}
            {tablero && <>
                <h3>Temas de {tablero.nombre}</h3>
                {temas.map((item) => (
                    <button key={item.id} onClick={() => seleccionarTema(item)}>{item.nombre}</button>
                ))}
                {tablero.es_propietario && <>
                    <h3>Invitar al tablero</h3>
                    <input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)}
                        placeholder="Buscar usuario del CRM" />
                    <button onClick={buscarUsuarios}>Buscar</button>
                    {usuarios.map((usuario) => (
                        <div key={usuario.id_usuario}>
                            {usuario.nombre} ({usuario.usuario})
                            <button onClick={() => invitarUsuario(usuario, "lector")}>Invitar lector</button>
                            <button onClick={() => invitarUsuario(usuario, "editor")}>Invitar editor</button>
                        </div>
                    ))}
                </>}
            </>}
            {tema && periodo && <>
                <h3>{tema.nombre} — {anio}</h3>
                <p>{periodo.filas.length} KPI registrados</p>
                <button disabled={!tema.puede_editar} onClick={agregarKPI}>Agregar KPI</button>
                <button disabled={!tema.puede_editar} onClick={guardarPeriodo}>Guardar periodo</button>
            </>}
            <p role="status">{mensaje}</p>
        </section>
    );
}
