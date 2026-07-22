// src/pages/AmbienteLaboral/AmbienteLaboral.jsx
import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight, Paperclip, Loader2 } from "lucide-react";
import { obtenerResumen, guardarEvaluacionDominio } from "../../lib/apiAmbienteLaboral";

const BRAND_BLUE = "#131E5C";

export default function AmbienteLaboral() {
    const [dealer, setDealer] = useState("VW Cordoba");
    const [anio, setAnio] = useState("2026");
    const [categoriaAbierta, setCategoriaAbierta] = useState(null);

    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [guardandoDominio, setGuardandoDominio] = useState(null);
    const [guardadoExitoso, setGuardadoExitoso] = useState(null);

    // ---------- Cargar datos del backend ----------
    const cargarResumen = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const data = await obtenerResumen(dealer, anio);
            console.log("Resumen recibido:", data);
            setCategorias(data);
            if (data.length > 0 && !categoriaAbierta) {
                setCategoriaAbierta(data[0].id_categoria);
            }
        } catch (err) {
            setError(err.message || "Error al cargar Ambiente laboral.");
        } finally {
            setCargando(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dealer, anio]);

    useEffect(() => {
        cargarResumen();
    }, [cargarResumen]);

    // ---------- Actualizar un campo localmente (antes de guardar) ----------
    const actualizarCampoLocal = (idCategoria, idDominio, campo, valor) => {
        setCategorias((prev) =>
            prev.map((cat) =>
                cat.id_categoria !== idCategoria
                    ? cat
                    : {
                          ...cat,
                          dominios: cat.dominios.map((dom) =>
                              dom.id_dominio !== idDominio
                                  ? dom
                                  : { ...dom, [campo]: valor }
                          ),
                      }
            )
        );
    };

    // ---------- Guardar un dominio en el backend ----------
    const guardarDominio = async (dominio, archivo) => {
        setGuardandoDominio(dominio.id_dominio);
        try {
            const actualizado = await guardarEvaluacionDominio({
                idDominio: dominio.id_dominio,
                dealer,
                anio,
                puntuacion: dominio.puntuacion,
                planAccion: dominio.plan_accion,
                seguimiento: dominio.seguimiento,
                archivoEvidencia: archivo,
            });

            // Sincroniza id_evaluacion y url de evidencia con lo que regresó el back
            setCategorias((prev) =>
                prev.map((cat) => ({
                    ...cat,
                    dominios: cat.dominios.map((dom) =>
                        dom.id_dominio !== dominio.id_dominio
                            ? dom
                            : {
                                  ...dom,
                                  id_evaluacion: actualizado.id_evaluacion,
                                  evidencia: actualizado.evidencia,
                              }
                    ),
                }))
            );

            setGuardadoExitoso(dominio.id_dominio);
            setTimeout(() => setGuardadoExitoso(null), 2000);
        } catch (err) {
            alert(err.message || "Error al guardar.");
        } finally {
            setGuardandoDominio(null);
        }
    };

    const manejarEvidencia = (dominio, archivo) => {
        if (!archivo) return;
        guardarDominio(dominio, archivo);
    };

    const toggleCategoria = (catId) => {
        setCategoriaAbierta((prev) => (prev === catId ? null : catId));
    };

    // ---------- Métricas ----------
    const totalDominios = categorias.reduce(
        (acc, cat) => acc + cat.dominios.length,
        0
    );
    const conSeguimiento = categorias.reduce(
        (acc, cat) =>
            acc +
            cat.dominios.filter((d) => (d.seguimiento || "").trim() !== "")
                .length,
        0
    );
    const puntuaciones = categorias
        .flatMap((cat) => cat.dominios)
        .map((d) => Number(d.puntuacion))
        .filter((n) => !Number.isNaN(n) && n > 0);
    const promedio = puntuaciones.length
        ? (puntuaciones.reduce((a, b) => a + b, 0) / puntuaciones.length).toFixed(1)
        : "-";

    return (
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 lg:px-14">
            <h1
                className="text-3xl font-extrabold tracking-[-0.02em] md:text-4xl"
                style={{ color: BRAND_BLUE }}
            >
                Ambiente laboral
            </h1>
            <p className="mb-6 text-base text-slate-500">
                Evaluación anual por categoría y dominio, con plan de acción, seguimiento y evidencias.
            </p>

            {/* Filtros */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <select
                    value={dealer}
                    onChange={(e) => setDealer(e.target.value)}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: `${BRAND_BLUE}33` }}
                >
                    <option>VW Cordoba</option>
                    <option>VW Tuxpan</option>
                    <option>VW Orizaba</option>
                    <option>VW Tuxtepec</option>
                </select>
                <select
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm sm:w-32"
                    style={{ borderColor: `${BRAND_BLUE}33` }}
                >
                    <option>2026</option>
                    <option>2025</option>
                </select>
            </div>

            {cargando && (
                <div className="flex items-center gap-2 py-10 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Cargando información...
                </div>
            )}

            {error && !cargando && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {!cargando && !error && (
                <>
                    {/* Resumen */}
                    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <Metrica label="Categorías" valor={categorias.length} />
                        <Metrica label="Dominios" valor={totalDominios} />
                        <Metrica label="Promedio general" valor={promedio} />
                        <Metrica
                            label="Con seguimiento"
                            valor={`${conSeguimiento} / ${totalDominios}`}
                        />
                    </div>

                    {/* Categorías */}
                    <div className="space-y-3">
                        {categorias.map((cat) => {
                            const abierta = categoriaAbierta === cat.id_categoria;
                            return (
                                <div
                                    key={cat.id_categoria}
                                    className="overflow-hidden rounded-xl border bg-white"
                                    style={{ borderColor: `${BRAND_BLUE}22` }}
                                >
                                    <button
                                        onClick={() => toggleCategoria(cat.id_categoria)}
                                        className="flex w-full items-center justify-between px-6 py-4 text-left"
                                    >
                                        <span
                                            className="flex items-center gap-2 text-lg font-bold"
                                            style={{ color: BRAND_BLUE }}
                                        >
                                            {abierta ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                            {cat.nombre}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {cat.dominios.length} dominios
                                        </span>
                                    </button>

                                    {abierta && (
                                        <div className="border-t" style={{ borderColor: `${BRAND_BLUE}15` }}>
                                            {cat.dominios.map((dom) => (
                                                <div
                                                    key={dom.id_dominio}
                                                    className="border-b px-6 py-4 last:border-b-0"
                                                    style={{ borderColor: `${BRAND_BLUE}10` }}
                                                >
                                                    {/* Nombre del dominio + puntuación */}
                                                    <div className="mb-2 flex items-center justify-between gap-2">
                                                        <span className="text-sm font-semibold text-slate-700">
                                                            {dom.nombre}
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="5"
                                                            step="0.1"
                                                            placeholder="1.0 - 5.0"
                                                            value={dom.puntuacion ?? ""}
                                                            onChange={(e) =>
                                                                actualizarCampoLocal(
                                                                    cat.id_categoria,
                                                                    dom.id_dominio,
                                                                    "puntuacion",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-24 rounded-lg border px-2 py-1 text-right text-xs font-bold"
                                                            style={{
                                                                borderColor: `${BRAND_BLUE}33`,
                                                                color: BRAND_BLUE,
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Plan de acción / Seguimiento */}
                                                    <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Plan de acción"
                                                            value={dom.plan_accion ?? ""}
                                                            onChange={(e) =>
                                                                actualizarCampoLocal(
                                                                    cat.id_categoria,
                                                                    dom.id_dominio,
                                                                    "plan_accion",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="rounded-lg border px-3 py-2 text-sm"
                                                            style={{ borderColor: `${BRAND_BLUE}22` }}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Seguimiento"
                                                            value={dom.seguimiento ?? ""}
                                                            onChange={(e) =>
                                                                actualizarCampoLocal(
                                                                    cat.id_categoria,
                                                                    dom.id_dominio,
                                                                    "seguimiento",
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="rounded-lg border px-3 py-2 text-sm"
                                                            style={{ borderColor: `${BRAND_BLUE}22` }}
                                                        />
                                                    </div>

                                                    {/* Botón Guardar: solo puntuación / plan / seguimiento */}
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <button
                                                            type="button"
                                                            onClick={() => guardarDominio(dom)}
                                                            disabled={guardandoDominio === dom.id_dominio}
                                                            className="rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                                                            style={{ backgroundColor: BRAND_BLUE }}
                                                        >
                                                            {guardandoDominio === dom.id_dominio
                                                                ? "Guardando..."
                                                                : "Guardar"}
                                                        </button>
                                                        {guardadoExitoso === dom.id_dominio && (
                                                            <span className="text-xs font-semibold text-green-600">
                                                                ✓ Guardado
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Adjuntar evidencias: acción independiente, sube directo al elegir archivo */}
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="file"
                                                            id={`evidencia-${dom.id_dominio}`}
                                                            className="hidden"
                                                            onChange={(e) =>
                                                                manejarEvidencia(dom, e.target.files[0])
                                                            }
                                                        />
                                                        <label
                                                            htmlFor={`evidencia-${dom.id_dominio}`}
                                                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold"
                                                            style={{
                                                                borderColor: `${BRAND_BLUE}33`,
                                                                color: BRAND_BLUE,
                                                            }}
                                                        >
                                                            <Paperclip className="h-3.5 w-3.5" />
                                                            {dom.evidencia
                                                                ? "Evidencia cargada — cambiar archivo"
                                                                : "Adjuntar evidencias"}
                                                        </label>
                                                        {dom.evidencia && (
                                                            <a
                                                                href={dom.evidencia}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs font-semibold underline"
                                                                style={{ color: BRAND_BLUE }}
                                                            >
                                                                Ver
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

function Metrica({ label, valor }) {
    return (
        <div className="rounded-xl bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="text-3xl font-extrabold" style={{ color: BRAND_BLUE }}>
                {valor}
            </p>
        </div>
    );
}
